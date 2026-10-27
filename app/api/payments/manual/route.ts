import {createHash} from 'node:crypto';
import {account,database,checkWriteRequest,failure,HttpError} from '@/lib/server';
import {validatePolicies,policyKinds} from '@/lib/site-content';
import {creditPackage} from '@/lib/credit-packages';
import {manualInput,manualWallets} from '@/lib/manual-payments';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(data:unknown)=>Response.json(data,{headers:{'Cache-Control':'private, no-store'}});
export async function GET(req:Request){try{const a=await account(),db=database(),all=!!req&&new URL(req.url).searchParams.get('scope')==='all';if(all&&!a.admin)throw new HttpError(403,'অ্যাডমিন অনুমতি প্রয়োজন।');const q=all?db.collection('manualPayments').orderBy('created','desc').limit(100):db.collection('manualPayments').where('owner','==',a.userId).limit(100);const rows=(await q.get()).docs.map(d=>({id:d.id,...d.data()}));return json({orders:rows,balance:Number((await db.collection('users').doc(a.userId).get()).data()?.credits)||0})}catch(e){return failure(e)}}
export async function POST(req:Request){try{
 checkWriteRequest(req);const a=await account(),b=await req.json(),db=database();
 if(b.action==='approve'||b.action==='reject'){
  if(!a.admin)throw new HttpError(403,'শুধু অ্যাডমিন পেমেন্ট যাচাই করতে পারবেন।');
  if(typeof b.id!=='string'||! /^[0-9a-f-]{36}$/i.test(b.id))throw new HttpError(400,'সঠিক অনুরোধ বেছে নিন।');
  const reason=typeof b.reason==='string'?b.reason.trim().slice(0,300):'';
  if(reason.length<5)throw new HttpError(400,'যাচাইয়ের কারণ অন্তত ৫ অক্ষরে লিখুন।');
  const ref=db.collection('manualPayments').doc(b.id);
  await db.runTransaction(async t=>{
   const o=(await t.get(ref)).data();if(!o)throw new HttpError(404,'অনুরোধ পাওয়া যায়নি।');
   const status=b.action==='approve'?'approved':'rejected';if(o.status===status)return;if(o.status!=='pending')throw new HttpError(409,'অনুরোধটির সিদ্ধান্ত আগেই হয়েছে।');
   const now=new Date().toISOString();
   if(status==='approved'){
    const receipt=db.collection('manualPaymentReceipts').doc(createHash('sha256').update(o.method+':'+o.trxId).digest('hex'));
    const user=db.collection('users').doc(o.owner);
    const [used,u]=await Promise.all([t.get(receipt),t.get(user)]);
    if(used.exists)throw new HttpError(409,'এই ট্রানজ্যাকশন আগে অনুমোদিত হয়েছে।');
    const balance=u.data()?.credits;if(!Number.isSafeInteger(balance)||balance<0||!Number.isSafeInteger(o.totalCredits)||o.totalCredits<1||!Number.isSafeInteger(balance+o.totalCredits))throw new HttpError(409,'ক্রেডিটের তথ্য সঠিক নয়।');
    t.update(user,{credits:balance+o.totalCredits});t.create(receipt,{orderId:b.id,created:now});
    t.create(db.collection('records').doc('manual-payment-'+b.id),{owner:o.owner,kind:'credit-purchase',title:'ম্যানুয়াল পেমেন্টে ক্রেডিট ক্রয়',created:now,data:JSON.stringify({amount:o.priceBDT,credits:o.totalCredits,orderId:b.id,method:o.method,trxId:o.trxId})});
   }
   t.update(ref,{status,reason,reviewedBy:a.userId,reviewedAt:now});
  });return json({ok:true});
 }
 const policies=validatePolicies((await db.collection('settings').doc('policies').get()).data());if(!policies||policyKinds.some(k=>!policies[k]))throw new HttpError(503,'অ্যাডমিনকে আগে ব্যবহারের শর্ত, গোপনীয়তা ও রিফান্ড নীতি প্রকাশ করতে বলুন। এখন টাকা পাঠাবেন না।');
 const input=manualInput(b),p=creditPackage(b.packageId);if(!input||!p)throw new HttpError(400,'প্যাকেজ, মোবাইল নম্বর, ট্রানজ্যাকশন আইডি ও সম্মতি সঠিকভাবে দিন।');
 const ref=db.collection('manualPayments').doc(input.requestId);
 await db.runTransaction(async t=>{
  const existing=(await t.get(ref)).data();
  if(existing){if(existing.owner!==a.userId||existing.packageId!==p.id||existing.method!==input.method||existing.sender!==input.sender||existing.trxId!==input.trxId)throw new HttpError(409,'আগের অনুরোধের তথ্য মেলেনি।');return}
  const limit=db.collection('manualPaymentLimits').doc(a.userId),l=(await t.get(limit)).data(),now=Date.now();const times=(Array.isArray(l?.times)?l.times:[]).filter((v:number)=>v>now-3600000);if(times.length>=5)throw new HttpError(429,'এক ঘণ্টায় সর্বোচ্চ ৫টি অনুরোধ করা যাবে।');
  t.set(limit,{times:[...times,now]});t.create(ref,{owner:a.userId,email:a.email||'',method:input.method,recipient:manualWallets[input.method].number,sender:input.sender,trxId:input.trxId,packageId:p.id,totalCredits:p.totalCredits,priceBDT:p.priceBDT,status:'pending',policyVersion:createHash('sha256').update(JSON.stringify(policies)).digest('hex'),acceptedAt:new Date().toISOString(),created:new Date().toISOString()});
 });return json({ok:true,orderId:input.requestId});
}catch(e){return failure(e)}}
