import {validateContest,contestOpen} from './site-content.ts';
export {contestOpen};
export type CompetitionTask={id:string;title:string;description:string;points:number;url:string;kind:'proof'|'purchase'|'credit-spend'|'purchase-total'|'referral'};
export type Competition={id:string;title:string;description:string;rules:string;prize:string;startsAt:string;endsAt:string;status:'draft'|'published'|'closed';tasks:CompetitionTask[];prizes:{rank:number;title:string;detail:string}[];entryCount:number};
export function competitionInput(v:unknown){
 const base=validateContest(v);if(!base)return null;const b=v as Record<string,unknown>;
 if(!Array.isArray(b.tasks)||b.tasks.length<1||b.tasks.length>20||!Array.isArray(b.prizes)||b.prizes.length<1||b.prizes.length>10)return null;
 const tasks:CompetitionTask[]=[];
 for(const x of b.tasks){if(!x||typeof x!=='object'||! /^[a-z0-9-]{1,50}$/.test(x.id)||typeof x.title!=='string'||x.title.trim().length<3||x.title.length>120||typeof x.description!=='string'||x.description.length>1000||!Number.isFinite(x.points)||x.points<0.01||x.points>10000||!['proof','purchase','credit-spend','purchase-total','referral'].includes(x.kind)||typeof x.url!=='string'||x.url.length>2000)return null;
 if(x.url){try{const u=new URL(x.url);if(u.protocol!=='https:'||u.username||u.password)return null}catch{return null}}
 // Reviews are voluntary and never a rewarded task.
 if(/review|রিভিউ|রেটিং/i.test(x.title+' '+x.description+' '+x.url))return null;
 if(['proof','purchase','referral'].includes(x.kind)&&!Number.isSafeInteger(x.points))return null;
 tasks.push({id:x.id,title:x.title.trim(),description:x.description.trim(),points:x.points,url:x.url,kind:x.kind});}
 if(new Set(tasks.map(x=>x.id)).size!==tasks.length)return null;
 const automatic=tasks.filter(t=>['credit-spend','purchase-total','referral'].includes(t.kind));if(new Set(automatic.map(t=>t.kind)).size!==automatic.length)return null;
 const prizes:Competition['prizes']=[];
 for(const x of b.prizes){if(!x||!Number.isSafeInteger(x.rank)||x.rank<1||x.rank>50||typeof x.title!=='string'||x.title.trim().length<2||x.title.length>120||typeof x.detail!=='string'||x.detail.length>1000)return null;prizes.push({rank:x.rank,title:x.title.trim(),detail:x.detail.trim()});}
 if(new Set(prizes.map(p=>p.rank)).size!==prizes.length)return null;
 return {...base,tasks,prizes:prizes.sort((a,b)=>a.rank-b.rank)};
}
export function rankEntries<T extends {id:string;points:number;joined:string}>(rows:T[]){return [...rows].sort((a,b)=>b.points-a.points||a.joined.localeCompare(b.joined)||a.id.localeCompare(b.id)).map((r,i)=>({...r,rank:i+1}));}
export function remainingTime(end:string,now=Date.now()){const s=Math.max(0,Math.floor((Date.parse(end)-now)/1000));return {days:Math.floor(s/86400),hours:Math.floor(s/3600)%24,minutes:Math.floor(s/60)%60,seconds:s%60};}

export type ScoreEntry={id:string;owner:string;publicName:string;points:number;joined:string};
export type ScoreEvent={owner?:string;entryId?:string;kind?:string;created:string;data?:string;status?:string;priceBDT?:number};
export function automaticScores(c:Pick<Competition,'startsAt'|'endsAt'|'tasks'>,entries:ScoreEntry[],records:ScoreEvent[],payments:ScoreEvent[],referrals:ScoreEvent[]){
 return entries.map(e=>{
  const after=Math.max(Date.parse(c.startsAt),Date.parse(e.joined)),end=Date.parse(c.endsAt);
  const eligible=(v:ScoreEvent)=>Date.parse(v.created)>=after&&Date.parse(v.created)<=end;
  const used=records.filter(v=>v.owner===e.owner&&v.kind==='credit-use'&&eligible(v)).reduce((n,v)=>{try{const amount=JSON.parse(v.data||'{}').amount;return n+(Number.isSafeInteger(amount)&&amount>0?amount:0)}catch{return n}},0);
  const paid=payments.filter(v=>v.owner===e.owner&&v.status==='approved'&&eligible(v)).reduce((n,v)=>n+(Number.isFinite(v.priceBDT)&&v.priceBDT!>0?v.priceBDT!:0),0);
  const invited=referrals.filter(v=>v.entryId===e.id&&eligible(v)).length;
  const automatic:Record<string,number>={};
  for(const task of c.tasks){const units=task.kind==='credit-spend'?used:task.kind==='purchase-total'?paid:task.kind==='referral'?invited:0;if(['credit-spend','purchase-total','referral'].includes(task.kind))automatic[task.id]=Math.floor((units*task.points)+1e-7)}
  return {...e,points:e.points+Object.values(automatic).reduce((a,b)=>a+b,0),automatic};
 });
}
