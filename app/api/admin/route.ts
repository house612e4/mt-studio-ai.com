import {bkashConfig} from '@/lib/bkash';
import {account,database,bucket,failure,checkWriteRequest,HttpError} from '@/lib/server';
import {adminAuth} from '@/lib/firebase-admin';
import {creditAdjustment,usableBalance} from '@/lib/admin-input';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(data:unknown)=>Response.json(data,{headers:{'Cache-Control':'private, no-store'}});
async function admin(){const u=await account();if(!u.admin)throw new HttpError(403,'শুধু স্টুডিওর অ্যাডমিন এই কাজ করতে পারবেন।');return u}
export async function GET(req:Request){try{
 const actor=await admin(),db=database(),email=new URL(req.url).searchParams.get('email');
 if(email!==null){
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new HttpError(400,'সঠিক ইমেইল দিন।');
  let person;
  try{person=await adminAuth().getUserByEmail(email.trim())}catch(e){if((e as {code?:string}).code==='auth/user-not-found')throw new HttpError(404,'এই ইমেইলে অ্যাকাউন্ট পাওয়া যায়নি।');throw e}
  if(person.disabled||!person.emailVerified)throw new HttpError(409,'অ্যাকাউন্টটি চালু ও ইমেইল যাচাই করা থাকতে হবে।');
  const saved=(await db.collection('users').doc(person.uid).get()).data();
  if(!saved)throw new HttpError(409,'এই গ্রাহককে আগে সাইটে লগইন করতে বলুন।');
  if(!usableBalance(saved.credits))throw new HttpError(409,'ক্রেডিটের তথ্য সঠিক নয়। আগে ডেটা পরীক্ষা করুন।');
  return json({user:{userId:person.uid,email:person.email||email,name:person.displayName||'',credits:saved.credits}});
 }
 const checks:{id:string;name:string;state:'passed'|'configured'|'missing'|'error'|'pending';detail:string}[]=[];
 checks.push({id:'admin',name:'অ্যাডমিন পরিচয়',state:'passed',detail:'ADMIN_UID এবং যাচাইকৃত সেশন মিলেছে।'});
 const variables=['NEXT_PUBLIC_FIREBASE_API_KEY','NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN','NEXT_PUBLIC_FIREBASE_PROJECT_ID','NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET','NEXT_PUBLIC_FIREBASE_APP_ID','FIREBASE_SERVICE_ACCOUNT_JSON','APP_ORIGIN'];
 for(const name of variables)checks.push({id:name,name,state:process.env[name]?'configured':'missing',detail:process.env[name]?'মান দেওয়া আছে; গোপন মান এখানে দেখানো হয় না।':'Netlify Environment variables-এ মান দিন।'});
 checks.push({id:'ai',name:'AI API configuration',state:process.env.OPENAI_API_KEY?'configured':'missing',detail:'Key উপস্থিত থাকা সফল AI generation বা ব্যালেন্স যাচাইয়ের প্রমাণ নয়।'});
 checks.push({id:'analytics',name:'Google Analytics visitor tracking',state:/^G-[A-Z0-9]+$/i.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID||'')?'configured':'missing',detail:process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?'GA4 Measurement ID দেওয়া আছে; রিপোর্ট Google Analytics-এ দেখা যাবে।':'ভিজিটর ও page view গুনতে NEXT_PUBLIC_GA_MEASUREMENT_ID দিন।'});
 checks.push({id:'google-reviews',name:'Google Business reviews',state:process.env.GOOGLE_PLACES_API_KEY?'configured':'missing',detail:process.env.GOOGLE_PLACES_API_KEY?'Places API key দেওয়া আছে; Place ID ও review link স্টুডিও সেটিংসে দিন।':'লাইভ Google rating ও review দেখাতে GOOGLE_PLACES_API_KEY দিন।'});
 checks.push({id:'payment',name:'অনলাইন পেমেন্ট',state:bkashConfig()?'configured':'missing',detail:bkashConfig()?'bKash v2 '+bkashConfig()!.environment+' configuration দেওয়া আছে; সফল live payment এখনও আলাদা পরীক্ষা করতে হবে।':'bKash v2 credentials, API URL, encryption key ও enable flag প্রয়োজন।'});
 const [firestore,storage,audit]=await Promise.allSettled([
  db.collection('settings').doc('brand').get(),
  Promise.resolve().then(()=>bucket().getMetadata()),
  db.collection('adminAudit').orderBy('created','desc').limit(30).get()
 ]);
 checks.push({id:'firestore',name:'Firestore server read',state:firestore.status==='fulfilled'?'passed':'error',detail:firestore.status==='fulfilled'?'সার্ভার থেকে ডেটাবেস পড়া গেছে।':'Firestore/API/IAM configuration পরীক্ষা করুন।'});
 checks.push({id:'storage',name:'Storage bucket metadata',state:storage.status==='fulfilled'?'passed':'error',detail:storage.status==='fulfilled'?'Bucket metadata পড়া গেছে; browser upload rules আলাদাভাবে পরীক্ষা করতে হবে।':'Bucket name, bucket তৈরি হয়েছে কি না ও IAM permission পরীক্ষা করুন।'});
 checks.push({id:'audit',name:'ক্রেডিট সমন্বয়ের ইতিহাস',state:audit.status==='fulfilled'?'passed':'error',detail:audit.status==='fulfilled'?'ইতিহাসের query চালানো গেছে।':'Firestore query/IAM পরীক্ষা করুন।'});
 return json({checks,audit:audit.status==='fulfilled'?audit.value.docs.map(d=>({id:d.id,...d.data()})):[],checkedAt:new Date().toISOString(),adminUid:actor.userId});
}catch(e){return failure(e)}}
export async function POST(req:Request){try{
 checkWriteRequest(req);const actor=await admin();
 const body=creditAdjustment(await req.json());if(!body)throw new HttpError(400,'গ্রাহক, ক্রেডিট, কারণ ও অনুরোধের পরিচয় সঠিকভাবে দিন।');
 const person=await adminAuth().getUser(body.userId);
 if(person.disabled||!person.emailVerified)throw new HttpError(409,'অ্যাকাউন্টটি চালু ও ইমেইল যাচাই করা থাকতে হবে।');
 const db=database(),ref=db.collection('users').doc(body.userId),audit=db.collection('adminAudit').doc(body.requestId),log=db.collection('records').doc('admin-credit-'+body.requestId);
 const result=await db.runTransaction(async t=>{
  const [previous,user]=await Promise.all([t.get(audit),t.get(ref)]);
  if(previous.exists){const p=previous.data()!;if(p.actor!==actor.userId||p.userId!==body.userId||p.after!==body.credits||p.before!==body.expectedCredits||p.reason!==body.reason)throw new HttpError(409,'একই অনুরোধের পরিচয়ে ভিন্ন তথ্য পাঠানো যাবে না।');return {ok:true,replayed:true,credits:p.after}}
  const saved=user.data();if(!saved||!usableBalance(saved.credits))throw new HttpError(409,'গ্রাহকের ক্রেডিটের তথ্য পাওয়া যায়নি।');
  if(saved.credits!==body.expectedCredits)throw new HttpError(409,'ক্রেডিট ইতিমধ্যে বদলেছে। গ্রাহক আবার খুঁজে নতুন ব্যালেন্স দেখে সমন্বয় করুন।');
  if(saved.credits===body.credits)throw new HttpError(400,'নতুন ক্রেডিট আগের ক্রেডিটের সমান।');
  const entry={actor:actor.userId,userId:body.userId,email:person.email||'',before:saved.credits,after:body.credits,reason:body.reason,created:new Date().toISOString()};
  t.update(ref,{credits:body.credits});t.create(audit,entry);
  t.create(log,{owner:body.userId,kind:'credit-log',title:'অ্যাডমিন ক্রেডিট সমন্বয়',created:entry.created,data:JSON.stringify({credits:body.credits,before:saved.credits,reason:body.reason,actor:actor.userId})});
  return {ok:true,replayed:false,credits:body.credits};
 });return json(result);
}catch(e){return failure(e)}}
