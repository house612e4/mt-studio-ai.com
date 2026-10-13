import 'server-only';
import {currentUser} from './firebase-session';
import {database} from './firebase-admin';
import {allowedWriteOrigin} from './workspace-input';
export {database,bucket} from './firebase-admin';
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export async function account(){const u=await currentUser();if(!u)throw new HttpError(401,'লগইন করুন।');const db=database(),ref=db.collection('users').doc(u.userId);await db.runTransaction(async t=>{const snap=await t.get(ref);if(!snap.exists)t.create(ref,{email:u.email,credits:0,profile:null,profileBonusAwarded:false,created:new Date().toISOString()});});return {...u,admin:Boolean(process.env.ADMIN_UID)&&u.userId===process.env.ADMIN_UID};}
export function checkWriteRequest(req:Request){const origins=[process.env.APP_ORIGIN,process.env.URL,process.env.DEPLOY_PRIME_URL,process.env.DEPLOY_URL].filter((s):s is string=>Boolean(s));if(!allowedWriteOrigin(req.headers.get('origin'),req.headers.get('host'),origins)||req.headers.get('sec-fetch-site')==='cross-site')throw new HttpError(403,'অনুরোধ অনুমোদিত নয়।');}
export function failure(e:unknown){if(e instanceof HttpError)return Response.json({error:e.message},{status:e.status});console.error('MT API failed',e instanceof Error?e.name:'unknown');return Response.json({error:e instanceof Error&&e.message==='CONFIG'?'Firebase সার্ভার কনফিগারেশন দেওয়া হয়নি।':'কাজটি সম্পন্ন হয়নি। আবার চেষ্টা করুন।'},{status:503});}
// Reconcile reservations interrupted by a hard function timeout.
// Transaction status prevents a second refund.
export async function recoverStaleAi(uid:string){const db=database(),pending=await db.collection('aiRequests').where('owner','==',uid).where('status','==','processing').orderBy('created','asc').limit(20).get();for(const snapshot of pending.docs){if(Date.now()-Date.parse(snapshot.data().created)<5*60*1000)continue;await db.runTransaction(async t=>{const user=db.collection('users').doc(uid),[job,u]=await Promise.all([t.get(snapshot.ref),t.get(user)]);if(job.data()?.status==='processing'&&Date.now()-Date.parse(job.data()!.created)>=5*60*1000){t.update(user,{credits:Number(u.data()?.credits||0)+2});t.update(snapshot.ref,{status:'refunded',recovered:true})}})}}
