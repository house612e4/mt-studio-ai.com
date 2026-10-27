import 'server-only';
import {isStudioAdmin} from './admin-access';
import {currentUser} from './firebase-session';
import {database} from './firebase-admin';
import {allowedWriteOrigin} from './workspace-input';
import {adminSecurityIssue} from './admin-security';
import {createHash} from 'node:crypto';
export {database,bucket} from './firebase-admin';
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export async function account(){const u=await currentUser();if(!u)throw new HttpError(401,'লগইন করুন।');const db=database(),ref=db.collection('users').doc(u.userId);await db.runTransaction(async t=>{const snap=await t.get(ref);if(!snap.exists)t.create(ref,{email:u.email,credits:0,profile:null,profileBonusAwarded:false,created:new Date().toISOString()});});return {...u,admin:isStudioAdmin(u.userId,process.env.ADMIN_UID)};}
export function requireRecentAdmin(a:Awaited<ReturnType<typeof account>>,maxAgeSeconds=900){
 const issue=adminSecurityIssue(a,process.env.ADMIN_REQUIRE_MFA==='true',Date.now()/1000,maxAgeSeconds);
 if(issue==='not-admin')throw new HttpError(403,'অ্যাডমিন অনুমতি প্রয়োজন।');
 if(issue==='reauthenticate')throw new HttpError(401,'নিরাপত্তার জন্য সাইন আউট করে আবার লগইন করুন, তারপর একই কাজটি করুন।');
 if(issue==='mfa-required')throw new HttpError(403,'এই অ্যাডমিন কাজের জন্য Firebase multi-factor authentication দিয়ে লগইন করা প্রয়োজন।');
}
// Firestore-backed fixed window: shared across Netlify instances and atomic under concurrency.
export async function enforceRateLimit(key:string,max:number,windowMs:number){
 const id=createHash('sha256').update(key).digest('hex'),ref=database().collection('rateLimits').doc(id),now=Date.now();
 await database().runTransaction(async t=>{const d=(await t.get(ref)).data(),active=Number(d?.windowStart)>now-windowMs,count=active?Number(d?.count||0):0;if(count>=max)throw new HttpError(429,'অনুরোধের সীমা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।');t.set(ref,{windowStart:active?d!.windowStart:now,count:count+1,expiresAt:new Date(now+windowMs)});});
}
export function checkWriteRequest(req:Request){const origins=[process.env.APP_ORIGIN,process.env.URL,process.env.DEPLOY_PRIME_URL,process.env.DEPLOY_URL].filter((s):s is string=>Boolean(s));if(!allowedWriteOrigin(req.headers.get('origin'),req.headers.get('host'),origins)||req.headers.get('sec-fetch-site')==='cross-site')throw new HttpError(403,'অনুরোধ অনুমোদিত নয়।');}
export function failure(e:unknown){
 const authCode=(e as {code?:string})?.code;
 if(['auth/id-token-expired','auth/id-token-revoked','auth/session-cookie-expired','auth/session-cookie-revoked','auth/invalid-id-token','auth/argument-error'].includes(authCode||''))return Response.json({error:'লগইন সেশনের তথ্য সঠিক নয় বা মেয়াদ শেষ। আবার লগইন করুন।'},{status:401});
 if(e instanceof SyntaxError)return Response.json({error:'অনুরোধের তথ্য সঠিক নয়। আবার চেষ্টা করুন।'},{status:400});
 if((e as {name?:string})?.name==='TimeoutError'||(e as {name?:string})?.name==='AbortError')return Response.json({error:'সেবার উত্তর পেতে সময় বেশি লাগছে। ক্রেডিটের ইতিহাস দেখে কিছুক্ষণ পরে চেষ্টা করুন।'},{status:504});
 if(e instanceof HttpError)return Response.json({error:e.message},{status:e.status});
 const err=e as {name?:string;message?:string;code?:string|number};
 const reference=crypto.randomUUID();
 const message=String(err?.message||'');
 const index=err?.code===9||message.includes('requires an index');
 const config=message==='CONFIG'||message==='CONFIG_JSON';
 console.error('MT API failed',{reference,name:err?.name||'unknown',code:err?.code,indexRequired:index,configuration:config});
 return Response.json({error:config?'Firebase সার্ভারের configuration সঠিক নয়। অ্যাডমিনকে জানান।':index?'ডেটাবেসের index প্রস্তুত হয়নি। কিছুক্ষণ পরে চেষ্টা করুন; অ্যাডমিন Firestore Indexes পরীক্ষা করুন।':`কাজটি সম্পন্ন হয়নি। সহায়তার পরিচয়: ${reference}`,reference},{status:503});
}
// Reconcile reservations interrupted by a hard function timeout.
// Transaction status prevents a second refund.
export async function recoverStaleAi(uid:string){const db=database(),pending=await db.collection('aiRequests').where('owner','==',uid).where('status','==','processing').orderBy('created','asc').limit(20).get();for(const snapshot of pending.docs){if(Date.now()-Date.parse(snapshot.data().created)<5*60*1000)continue;await db.runTransaction(async t=>{const user=db.collection('users').doc(uid),[job,u]=await Promise.all([t.get(snapshot.ref),t.get(user)]);if(job.data()?.status==='processing'&&Date.now()-Date.parse(job.data()!.created)>=5*60*1000){t.update(user,{credits:Number(u.data()?.credits||0)+2});t.update(snapshot.ref,{status:'refunded',recovered:true})}})}}
