import 'server-only';
import {createHash,timingSafeEqual} from 'node:crypto';
import {database,HttpError} from './server';
import {bkashCall,bkashConfig,bkashToken,providerPost} from './bkash';
import {completedPayment} from './payment-validation';
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export function secretMatches(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export function paymentOrigin(){try{const u=new URL(process.env.APP_ORIGIN||'');if(u.protocol!=='https:'||u.origin!==(process.env.APP_ORIGIN||'').replace(/\/$/,''))throw Error();return u.origin}catch{throw new HttpError(503,'APP_ORIGIN-এ সাইটের সঠিক HTTPS ঠিকানা দিন।')}}
export async function settlePayment(id:string,data:Record<string,unknown>){const db=database(),ref=db.collection('paymentOrders').doc(id);return db.runTransaction(async t=>{
 const snap=await t.get(ref),order=snap.data();if(!order)throw new HttpError(404,'পেমেন্ট পাওয়া যায়নি।');
 if(order.status==='paid'||order.status==='sandbox_completed')return order.status as string;
 if(!completedPayment(order as {paymentId:string;invoice:string;priceBDT:number},data))throw new HttpError(409,'পেমেন্টের পরিচয়, মূল্য বা সম্পন্ন হওয়ার তথ্য মেলেনি। ক্রেডিট যোগ হয়নি।');
 const trx=db.collection('paymentTransactions').doc(hash(order.environment+':'+data.trxId));const receipt=await t.get(trx);if(receipt.exists&&receipt.data()?.orderId!==id)throw new HttpError(409,'এই লেনদেন আগে অন্য অর্ডারে ব্যবহার হয়েছে।');
 const user=db.collection('users').doc(order.owner),u=(await t.get(user)).data();if(!u||!Number.isSafeInteger(u.credits)||u.credits<0)throw new HttpError(409,'গ্রাহকের ক্রেডিটের তথ্য সঠিক নয়।');
 const live=order.environment==='live',total=Number(order.totalCredits);if(!Number.isSafeInteger(total)||total<1||!Number.isSafeInteger(u.credits+total))throw new HttpError(409,'ক্রেডিটের পরিমাণ সঠিক নয়।');
 const created=new Date().toISOString();
 if(live){t.update(user,{credits:u.credits+total});t.create(db.collection('records').doc('payment-'+id),{owner:order.owner,kind:'credit-purchase',title:'bKash ক্রেডিট ক্রয়',created,data:JSON.stringify({amount:order.priceBDT,credits:total,trxId:data.trxId,orderId:id})})}
 if(!receipt.exists)t.create(trx,{orderId:id,created});
 const status=live?'paid':'sandbox_completed';t.update(ref,{status,trxId:data.trxId,completedAt:created});return status;
 })}
export async function reconcilePayment(id:string,execute=false){const ref=database().collection('paymentOrders').doc(id),order=(await ref.get()).data();if(!order?.paymentId)throw new HttpError(409,'পেমেন্ট এখনও তৈরি হয়নি।');if(['paid','sandbox_completed'].includes(order.status))return order.status as string;
 const config=bkashConfig();if(!config||order.environment!==config.environment)throw new HttpError(503,'এই পেমেন্টের পরিবেশ এখন সংযুক্ত নেই।');
 if(execute){const token=await bkashToken();const claimed=await database().runTransaction(async t=>{const o=(await t.get(ref)).data()!;if(o.executeAttempted)return false;t.update(ref,{executeAttempted:true,status:'verifying'});return true});
  if(claimed){try{const output=await providerPost('/payment/execute',{paymentId:order.paymentId},token);if(output.transactionStatus==='Completed')return await settlePayment(id,output)}catch{/* The Execute outcome may be uncertain. Query it, never execute a second time. */}}
 }
 const output=await bkashCall('/query/payment',{paymentId:order.paymentId});if(output.transactionStatus==='Completed')return settlePayment(id,output);
 return 'pending';
}
