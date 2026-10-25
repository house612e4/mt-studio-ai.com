import 'server-only';
import {createHash} from 'node:crypto';
import {database,HttpError} from './server';
// One browser attempt maps to one atomic debit. A lost response can replay the result.
export async function claimAi(uid:string,requestId:unknown,kind:string,input:unknown){
 if(requestId!==undefined&&(typeof requestId!=='string'||!/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(requestId)))throw new HttpError(400,'AI অনুরোধের পরিচয় সঠিক নয়।');
 const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
 const db=database(),id=requestId?digest(uid+':'+requestId):crypto.randomUUID(),job=db.collection('aiRequests').doc(id),user=db.collection('users').doc(uid),fingerprint=digest(JSON.stringify({kind,input}));
 const result=await db.runTransaction(async t=>{const [old,account]=await Promise.all([t.get(job),t.get(user)]),state=old.data();
  if(state){if(state.owner!==uid||state.fingerprint!==fingerprint)throw new HttpError(409,'এই অনুরোধের পরিচয়ে অন্য কাজ পাঠানো যাবে না।');if(state.status==='completed')return {completed:true,resultId:String(state.resultId||'')};if(state.status==='processing')throw new HttpError(409,'এই AI কাজটি এখনও চলছে। কিছুক্ষণ পরে একই বাটনে আবার চাপ দিয়ে ফল দেখুন।');}
  const balance=account.data()?.credits;if(!Number.isSafeInteger(balance)||balance<2)throw new HttpError(402,'অন্তত ২ ক্রেডিট প্রয়োজন।');
  const data={owner:uid,status:'processing',amount:2,created:new Date().toISOString(),kind,fingerprint};t.update(user,{credits:balance-2});if(state)t.set(job,data);else t.create(job,data);return {completed:false,resultId:''};
 });return {job,...result};
}
