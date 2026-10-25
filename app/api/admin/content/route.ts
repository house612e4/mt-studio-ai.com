import {account,database,checkWriteRequest,failure,HttpError} from '@/lib/server';
import {emptyPolicies,validatePolicies,policyKinds} from '@/lib/site-content';
import {paymentOrigin} from '@/lib/payment-service';
export const runtime='nodejs';export const dynamic='force-dynamic';
async function admin(){const u=await account();if(!u.admin)throw new HttpError(403,'অ্যাডমিন অনুমতি প্রয়োজন।');return u}
export async function GET(){try{await admin();const d=(await database().collection('settings').doc('policies').get()).data();return Response.json({policies:validatePolicies(d)||emptyPolicies},{headers:{'Cache-Control':'private, no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{checkWriteRequest(req);const actor=await admin(),body=await req.json(),policies=validatePolicies(body.policies);if(!policies)throw new HttpError(400,'প্রতিটি নীতি খালি রাখুন অথবা ৫০ থেকে ৫০,০০০ অক্ষরের মধ্যে সম্পূর্ণ লেখা দিন।');
 const origin=paymentOrigin(),db=database(),batch=db.batch();batch.set(db.collection('settings').doc('policies'),{...policies,updatedAt:new Date().toISOString(),updatedBy:actor.userId});batch.set(db.collection('settings').doc('brand'),Object.fromEntries(policyKinds.map(k=>[k+'Url',policies[k]?origin+'/policies/'+k:''])),{merge:true});await batch.commit();return Response.json({ok:true})}catch(e){return failure(e)}}
