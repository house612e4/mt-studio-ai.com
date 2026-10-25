import {claimAi} from '@/lib/ai-request';
import {providerFailure} from '@/lib/provider-failure';
import {account,database,failure,checkWriteRequest,HttpError} from '@/lib/server';
import {documentInput} from '@/lib/document-input';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(req:Request){
 let reservationId='',uid='';
 try{
  checkWriteRequest(req);
  const user=await account();uid=user.userId;
  const body=await req.json(),input=documentInput(body);
  if(!input)throw new HttpError(400,'শিরোনাম, ভাষা ও অন্তত ১০ অক্ষরের নির্দেশনা দিন।');
  const key=process.env.OPENAI_API_KEY;
  if(!key)throw new HttpError(503,'এআই সেবা সংযুক্ত হয়নি। নিজে লিখে ডকুমেন্ট টেমপ্লেট ব্যবহার করুন।');
  const db=database(),claimed=await claimAi(uid,body.requestId,'document',input);if(claimed.completed){const saved=(await db.collection('records').doc(claimed.resultId).get()).data();if(!saved||saved.owner!==uid)throw new HttpError(404,'আগের ডকুমেন্ট পাওয়া যায়নি।');return Response.json({id:claimed.resultId,text:JSON.parse(saved.data).text})}const job=claimed.job;reservationId=job.id;
  const base=(process.env.OPENAI_BASE_URL||'https://api.openai.com/v1').replace(/\/+$/,'');
  const response=await fetch(base+'/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({model:process.env.OPENAI_TEXT_MODEL||'gpt-4.1-mini',max_completion_tokens:3000,messages:[{role:'system',content:'Write an editable document draft as plain text in the requested language. Use only supplied personal facts. Mark missing facts with [fill in]. Never invent signatures, approvals, qualifications, statistics or official certification. Do not output HTML. Keep under 18000 characters.'},{role:'user',content:JSON.stringify(input)}]})});
  if(!response.ok)throw await providerFailure(response);
  const output=await response.json();
  const text=output.choices?.[0]?.message?.content;
  if(typeof text!=='string'||!text.trim()||text.length>20000||output.choices?.[0]?.finish_reason!=='stop')throw new HttpError(502,'সম্পূর্ণ ডকুমেন্ট পাওয়া যায়নি। আবার চেষ্টা করুন।');
  await db.runTransaction(async t=>{
   const state=(await t.get(job)).data();
   if(state?.status!=='processing')throw new Error('INVALID_STATE');
   t.create(db.collection('records').doc('document-'+job.id),{owner:uid,kind:'document',title:input.title,data:JSON.stringify({text,template:'ai-document'}),created:new Date().toISOString()});
   t.create(db.collection('records').doc(job.id),{owner:uid,kind:'credit-use',title:'এআই ডকুমেন্ট',data:JSON.stringify({amount:2}),created:new Date().toISOString()});
   t.update(job,{status:'completed',resultId:'document-'+job.id});
  });
  return Response.json({text,id:'document-'+job.id});
 }catch(e){
  if(reservationId&&uid)try{
   const db=database(),job=db.collection('aiRequests').doc(reservationId),user=db.collection('users').doc(uid);
   await db.runTransaction(async t=>{const[s,u]=await Promise.all([t.get(job),t.get(user)]);if(s.data()?.status==='processing'){t.update(user,{credits:Number(u.data()?.credits||0)+2});t.update(job,{status:'refunded'});}});
  }catch{console.error('Document credit refund pending',{reservationId})}
  return failure(e);
 }
}
