import {createHash} from 'node:crypto';
import {currentUser} from '@/lib/firebase-session';
import {isStudioAdmin} from '@/lib/admin-access';
import {account,database,checkWriteRequest,failure,HttpError} from '@/lib/server';
import {uuid} from '@/lib/payment-validation';
import {competitionInput,contestOpen,rankEntries,automaticScores,type Competition} from '@/lib/competitions';
export const runtime='nodejs';export const dynamic='force-dynamic';
const key=(c:string,u:string)=>createHash('sha256').update(c+':'+u).digest('hex');
const json=(d:unknown)=>Response.json(d,{headers:{'Cache-Control':'private, no-store'}});
export async function GET(req:Request){try{
 const u=await currentUser(),admin=!!u&&isStudioAdmin(u.userId,process.env.ADMIN_UID),db=database(),id=new URL(req.url).searchParams.get('id');
 if(!id){const rows=await db.collection('competitions').orderBy('created','desc').limit(50).get();return json({competitions:rows.docs.filter(d=>admin||d.data().status!=='draft').map(d=>({id:d.id,...d.data()})),admin,authenticated:!!u})}
 if(!uuid(id))throw new HttpError(400,'প্রতিযোগিতার পরিচয় সঠিক নয়।');const c=(await db.collection('competitions').doc(id).get()).data();if(!c||c.status==='draft'&&!admin)throw new HttpError(404,'প্রতিযোগিতা পাওয়া যায়নি।');
 const entries=await db.collection('competitionEntries').where('competitionId','==',id).get();
 const range=(name:string)=>db.collection(name).where('created','>=',c.startsAt).where('created','<=',c.endsAt);
 const [records,payments,referrals]=await Promise.all([range('records').get(),range('manualPayments').get(),range('competitionReferrals').get()]);
 const ranked=rankEntries(automaticScores(c as Competition,entries.docs.map(d=>({id:d.id,owner:String(d.data().owner),publicName:String(d.data().publicName),points:Number(d.data().points)||0,joined:String(d.data().joined)})),records.docs.map(d=>d.data()) as never,payments.docs.map(d=>d.data()) as never,referrals.docs.map(d=>d.data()) as never));
 if(c.finalizedAt&&Array.isArray(c.finalRanking)){ranked.splice(0,ranked.length,...c.finalRanking)}
 const ownId=u?key(id,u.userId):'',mine=ranked.find(e=>e.id===ownId)||null;
 const claims=u?await db.collection('competitionClaims').where('entryId','==',ownId).get():null;
 const pending=admin?await db.collection('competitionClaims').where('competitionId','==',id).get():null;
 const {finalRanking,updatedBy,...publicContest}=c;return json({competition:{id,...publicContest},leaderboard:ranked.slice(0,50).map(({owner,automatic,...row})=>row),mine,participants:ranked.length,claims:claims?.docs.map(d=>({id:d.id,...d.data()}))||[],pending:pending?.docs.filter(d=>d.data().status==='pending').map(d=>({id:d.id,...d.data()}))||[],admin,authenticated:!!u});
}catch(e){return failure(e)}}
export async function POST(req:Request){try{
 checkWriteRequest(req);const u=await account(),b=await req.json(),db=database();
 if(b.action==='save'){
  if(!u.admin)throw new HttpError(403,'অ্যাডমিন অনুমতি প্রয়োজন।');const input=competitionInput(b.data);if(!input||!uuid(b.id))throw new HttpError(400,'শিরোনাম, সময়, নিয়ম, কাজ ও পুরস্কার সঠিকভাবে দিন। রিভিউয়ের জন্য পয়েন্ট দেওয়া যায় না।');
  const ref=db.collection('competitions').doc(b.id);await db.runTransaction(async t=>{const old=(await t.get(ref)).data();if(old?.entryCount>0)throw new HttpError(409,'অংশগ্রহণ শুরু হয়েছে; নিয়ম, পয়েন্ট বা পুরস্কার বদলানো যাবে না।');t.set(ref,{...input,entryCount:0,created:old?.created||new Date().toISOString(),updatedBy:u.userId})});return json({ok:true});
 }
 if(!uuid(b.id))throw new HttpError(400,'সঠিক প্রতিযোগিতা বেছে নিন।');const ref=db.collection('competitions').doc(b.id),entry=db.collection('competitionEntries').doc(key(b.id,u.userId));
 if(b.action==='join'){
  const name=typeof b.publicName==='string'?b.publicName.trim():'';if(name.length<2||name.length>60||b.accepted!==true)throw new HttpError(400,'প্রকাশযোগ্য নাম ও নিয়মে সম্মতি দিন।');
  await db.runTransaction(async t=>{const[c,e]=await Promise.all([t.get(ref),t.get(entry)]);if(!c.exists||!contestOpen(c.data() as Competition))throw new HttpError(409,'এখন অংশগ্রহণের সময় নয়।');if(e.exists)return;if(Number(c.data()!.entryCount)>=1000)throw new HttpError(409,'এই প্রতিযোগিতার ১০০০ জনের অংশগ্রহণসীমা পূর্ণ হয়েছে।');t.create(entry,{competitionId:b.id,owner:u.userId,publicName:name,points:0,joined:new Date().toISOString()});t.update(ref,{entryCount:Number(c.data()!.entryCount||0)+1})});return json({ok:true});
 }
 if(b.action==='claim'){
  const taskId=typeof b.taskId==='string'?b.taskId:'';if(!/^[a-z0-9-]{1,50}$/.test(taskId))throw new HttpError(400,'কাজটি সঠিক নয়।');const proof=typeof b.proof==='string'?b.proof.trim():'';if(proof.length<6||proof.length>1500)throw new HttpError(400,'কাজের প্রমাণ বা পেমেন্ট অর্ডারের আইডি দিন।');const claim=db.collection('competitionClaims').doc(key(entry.id,taskId));
  await db.runTransaction(async t=>{
   const[c,e,old]=await Promise.all([t.get(ref),t.get(entry),t.get(claim)]);if(!c.exists||!contestOpen(c.data() as Competition)||!e.exists)throw new HttpError(409,'সক্রিয় প্রতিযোগিতায় আগে যোগ দিন।');const task=(c.data()!.tasks as Competition['tasks']).find(x=>x.id===taskId);if(!task)throw new HttpError(400,'কাজটি পাওয়া যায়নি।');if(['credit-spend','purchase-total','referral'].includes(task.kind))throw new HttpError(400,'এই কাজের পয়েন্ট স্বয়ংক্রিয়ভাবে গণনা হয়।');if(old.exists){if(['approved','pending'].includes(old.data()!.status))return;throw new HttpError(409,'এই কাজের দাবি বাতিল হয়েছে। সাপোর্টে যোগাযোগ করুন।')}
   const receipt=task.kind==='purchase'?db.collection('competitionPurchaseReceipts').doc(key(b.id,proof)):null;
   if(task.kind==='purchase'){
    if(!uuid(proof))throw new HttpError(400,'অনুমোদিত পেমেন্ট অর্ডারের আইডি দিন।');const used=await t.get(receipt!);if(used.exists)throw new HttpError(409,'এই পেমেন্টে এই প্রতিযোগিতায় পয়েন্ট নেওয়া হয়েছে।');const pay=(await t.get(db.collection('manualPayments').doc(proof))).data();if(!pay||pay.owner!==u.userId||pay.status!=='approved'||Date.parse(pay.created)<Date.parse(c.data()!.startsAt)||Date.parse(pay.created)>Date.parse(c.data()!.endsAt))throw new HttpError(409,'নিজের এই প্রতিযোগিতার সময়ের অনুমোদিত পেমেন্ট দিন।');
   }
   const approved=task.kind==='purchase';if(receipt)t.create(receipt,{entryId:entry.id,orderId:proof,created:new Date().toISOString()});t.create(claim,{competitionId:b.id,entryId:entry.id,owner:u.userId,publicName:e.data()!.publicName,taskId,taskTitle:task.title,points:task.points,proof,status:approved?'approved':'pending',created:new Date().toISOString()});if(approved)t.update(entry,{points:e.data()!.points+task.points});
  });return json({ok:true});
 }
 if(b.action==='review'){
  if(!u.admin||typeof b.claimId!=='string'||! /^[a-f0-9]{64}$/.test(b.claimId)||!['approved','rejected'].includes(b.decision))throw new HttpError(403,'অ্যাডমিন হিসেবে সঠিক দাবি বেছে নিন।');const reason=typeof b.reason==='string'?b.reason.trim():'';if(reason.length<5||reason.length>300)throw new HttpError(400,'সিদ্ধান্তের কারণ লিখুন।');const claim=db.collection('competitionClaims').doc(b.claimId);
  await db.runTransaction(async t=>{const[c,p]=await Promise.all([t.get(ref),t.get(claim)]);if(!c.exists||!p.exists||p.data()!.competitionId!==b.id)throw new HttpError(404,'দাবি পাওয়া যায়নি।');if(c.data()!.finalizedAt)throw new HttpError(409,'ফল চূড়ান্ত হয়েছে।');if(p.data()!.status===b.decision)return;if(p.data()!.status!=='pending')throw new HttpError(409,'সিদ্ধান্ত আগে হয়েছে।');const e=db.collection('competitionEntries').doc(p.data()!.entryId),saved=await t.get(e);if(!saved.exists)throw new HttpError(404,'অংশগ্রহণ পাওয়া যায়নি।');if(b.decision==='approved')t.update(e,{points:saved.data()!.points+p.data()!.points});t.update(claim,{status:b.decision,reason,reviewedBy:u.userId,reviewedAt:new Date().toISOString()})});return json({ok:true});
 }
 if(b.action==='finalize'){
  if(!u.admin)throw new HttpError(403,'অ্যাডমিন অনুমতি প্রয়োজন।');
  await db.runTransaction(async t=>{const c=(await t.get(ref)).data();if(!c||Date.now()<Date.parse(c.endsAt))throw new HttpError(409,'নির্ধারিত শেষ সময় পর্যন্ত অপেক্ষা করুন।');if(c.finalizedAt)return;const pending=await t.get(db.collection('competitionClaims').where('competitionId','==',b.id));if(pending.docs.some(d=>d.data().status==='pending'))throw new HttpError(409,'আগে অপেক্ষমাণ দাবিগুলোর সিদ্ধান্ত দিন।');const all=await t.get(db.collection('competitionEntries').where('competitionId','==',b.id));const range=(name:string)=>db.collection(name).where('created','>=',c.startsAt).where('created','<=',c.endsAt);const [records,payments,referrals]=await Promise.all([t.get(range('records')),t.get(range('manualPayments')),t.get(range('competitionReferrals'))]);const rank=rankEntries(automaticScores(c as Competition,all.docs.map(d=>({id:d.id,owner:d.data().owner,publicName:d.data().publicName,points:d.data().points,joined:d.data().joined})),records.docs.map(d=>d.data()) as never,payments.docs.map(d=>d.data()) as never,referrals.docs.map(d=>d.data()) as never));t.update(ref,{status:'closed',finalizedAt:new Date().toISOString(),finalRanking:rank.map(({owner,...r})=>({...r,owner:''})),winners:(c.prizes as Competition['prizes']).map(p=>({...p,publicName:rank[p.rank-1]?.publicName||'',points:rank[p.rank-1]?.points||0,entryId:rank[p.rank-1]?.id||''})).filter(w=>w.entryId)})});return json({ok:true});
 }
 throw new HttpError(400,'অনুরোধটি সঠিক নয়।');
}catch(e){return failure(e)}}
