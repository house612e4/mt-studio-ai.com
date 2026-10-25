import {database,HttpError} from '@/lib/server';
import {uuid} from '@/lib/payment-validation';
import {hash,secretMatches,paymentOrigin,reconcilePayment} from '@/lib/payment-service';
export const runtime='nodejs';export const maxDuration=60;export const dynamic='force-dynamic';
export async function GET(req:Request,{params}:{params:Promise<{orderId:string;nonce:string}>}){
 const {orderId,nonce}=await params;
 try{if(!uuid(orderId)||!/^\w{64}$/.test(nonce))throw new HttpError(400,'পেমেন্টের পরিচয় সঠিক নয়।');
 const order=(await database().collection('paymentOrders').doc(orderId).get()).data(),url=new URL(req.url),signature=url.searchParams.get('signature')||'';
 if(!order||!secretMatches(hash(nonce),order.nonceHash)||url.searchParams.get('paymentID')!==order.paymentId||!signature||signature.length>512||!secretMatches(signature,order.signature||''))throw new HttpError(403,'পেমেন্ট callback যাচাই হয়নি।');
 if(url.searchParams.get('status')==='success')await reconcilePayment(orderId,true);
 // Cancel/failure query strings never prove payment completion or overwrite paid state.
 return Response.redirect(paymentOrigin()+'/payments/result?order='+orderId,303);
 }catch(e){if(e instanceof HttpError&&[400,403].includes(e.status))return Response.json({error:e.message},{status:e.status});
 // An uncertain provider/DB outcome is recoverable from the authenticated result page.
 console.error('bKash callback pending',{orderId:uuid(orderId)?orderId:'invalid'});
 return Response.redirect(paymentOrigin()+'/payments/result?order='+encodeURIComponent(uuid(orderId)?orderId:''),303)}
}
