import {account,database,checkWriteRequest,failure,HttpError} from '@/lib/server';
import {uuid} from '@/lib/payment-validation';
import {reconcilePayment} from '@/lib/payment-service';
export const runtime='nodejs';export const maxDuration=60;export const dynamic='force-dynamic';
async function own(id:unknown){const user=await account();if(!uuid(id))throw new HttpError(400,'পেমেন্টের পরিচয় সঠিক নয়।');const order=(await database().collection('paymentOrders').doc(id).get()).data();if(!order||order.owner!==user.userId)throw new HttpError(404,'পেমেন্ট পাওয়া যায়নি।');return order}
export async function GET(req:Request){try{const id=new URL(req.url).searchParams.get('order'),o=await own(id);return Response.json({orderId:id,status:o.status,packageId:o.packageId,priceBDT:o.priceBDT,totalCredits:o.totalCredits,environment:o.environment,trxId:o.trxId||''},{headers:{'Cache-Control':'private, no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{checkWriteRequest(req);const {orderId}=await req.json();await own(orderId);const status=await reconcilePayment(orderId);return Response.json({status},{headers:{'Cache-Control':'private, no-store'}})}catch(e){return failure(e)}}
