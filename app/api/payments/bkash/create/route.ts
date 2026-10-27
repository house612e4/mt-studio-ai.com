import {account,database,checkWriteRequest,failure,HttpError} from '@/lib/server';
import {bkashConfig,bkashCall} from '@/lib/bkash';
import {creditPackage} from '@/lib/credit-packages';
import {uuid,moneyMinor,paymentRedirect} from '@/lib/payment-validation';
import {paymentOrigin,hash} from '@/lib/payment-service';
import {publicBrand} from '@/lib/studio-settings';
export const runtime='nodejs';export const maxDuration=60;
export async function POST(req:Request){try{
 checkWriteRequest(req);if(process.env.PAYMENT_MODE!=='automatic')throw new HttpError(503,'এখন ম্যানুয়াল পেমেন্ট চালু আছে। পেমেন্টের তথ্য জমা দিন।');const user=await account(),c=bkashConfig();if(!c||c.environment==='sandbox'&&!user.admin)throw new HttpError(503,'bKash পেমেন্ট এখনও চালু হয়নি।');
 const body=await req.json(),p=creditPackage(body.packageId);if(!p||!uuid(body.requestId)||body.accepted!==true)throw new HttpError(400,'প্যাকেজ ও নীতিমালায় সম্মতি প্রয়োজন।');
 const db=database(),brand=publicBrand((await db.collection('settings').doc('brand').get()).data());if(!brand.termsUrl||!brand.privacyUrl||!brand.refundUrl)throw new HttpError(503,'স্টুডিওর ব্যবহারের শর্ত, গোপনীয়তা ও রিফান্ড নীতি প্রকাশ করা বাকি।');
 const id=body.requestId,ref=db.collection('paymentOrders').doc(id),nonce=crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,''),invoice='MT-'+id,origin=paymentOrigin();
 const previous=await db.runTransaction(async t=>{const old=(await t.get(ref)).data();if(old){if(old.owner!==user.userId||old.packageId!==p.id)throw new HttpError(409,'অর্ডারের পরিচয় মেলেনি।');return old}
  const limit=db.collection('paymentLimits').doc(user.userId),state=(await t.get(limit)).data()||{},now=Date.now(),times=(Array.isArray(state.times)?state.times:[]).filter((n:number)=>n>now-3600000);if(times.length>=10)throw new HttpError(429,'অনেক পেমেন্ট চেষ্টা হয়েছে। পরে চেষ্টা করুন।');
  t.set(limit,{times:[...times,now]});t.create(ref,{owner:user.userId,packageId:p.id,totalCredits:p.totalCredits,priceBDT:p.priceBDT,environment:c.environment,invoice,nonceHash:hash(nonce),status:'creating',created:new Date().toISOString(),policyAcceptance:{terms:brand.termsUrl,privacy:brand.privacyUrl,refund:brand.refundUrl,acceptedAt:new Date().toISOString()}});return null;
 });
 if(previous){if(previous.checkoutUrl&&previous.status==='created')return Response.json({orderId:id,url:previous.checkoutUrl});if(['paid','sandbox_completed'].includes(previous.status))return Response.json({orderId:id,url:origin+'/payments/result?order='+id});throw new HttpError(409,'আগের পেমেন্ট তৈরির ফল অনিশ্চিত। অবস্থা যাচাই করুন বা নতুন পেমেন্ট শুরু করুন।')}
 const output=await bkashCall('/payment/create',{payerReference:invoice,callbackURL:origin+'/api/payments/bkash/callback/'+id+'/'+nonce,amount:p.priceBDT.toFixed(2),currency:'BDT',intent:'sale',merchantInvoiceNumber:invoice});
 const url=paymentRedirect(output.bkashURL??output.bKashURL,c.environment);
 if(!url||typeof output.paymentId!=='string'||!output.paymentId||output.paymentId.length>200||typeof output.signature!=='string'||!output.signature||output.signature.length>512||output.merchantInvoiceNumber!==invoice||output.currency!=='BDT'||output.intent!=='sale'||moneyMinor(output.amount)!==p.priceBDT*100||output.transactionStatus!=='Initiated')throw new HttpError(502,'bKash পেমেন্ট সঠিকভাবে তৈরি হয়নি। কোনো ক্রেডিট যোগ হয়নি।');
 await ref.update({paymentId:output.paymentId,signature:output.signature,checkoutUrl:url,status:'created'});return Response.json({orderId:id,url});
 }catch(e){return failure(e)}}
