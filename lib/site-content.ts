export const policyKinds=['terms','privacy','refund'] as const;
export type Policies=Record<typeof policyKinds[number],string>;
export const emptyPolicies:Policies={terms:'',privacy:'',refund:''};
export const policyTitles={terms:'ব্যবহারের শর্ত',privacy:'গোপনীয়তা নীতি',refund:'রিফান্ড নীতি'};
export function validatePolicies(value:unknown):Policies|null{if(!value||typeof value!=='object'||Array.isArray(value))return null;const d=value as Record<string,unknown>,out={...emptyPolicies};for(const k of policyKinds){if(typeof d[k]!=='string'||d[k].length>50000)return null;out[k]=d[k].trim();if(out[k]&&out[k].length<50)return null}return out}
export type ContestInput={title:string;description:string;rules:string;prize:string;startsAt:string;endsAt:string;status:'draft'|'published'|'closed'};
export function validateContest(value:unknown):ContestInput|null{if(!value||typeof value!=='object'||Array.isArray(value))return null;const d=value as Record<string,unknown>;
 for(const[k,min,max]of [['title',3,120],['description',10,2000],['rules',20,10000],['prize',3,1000]] as const)if(typeof d[k]!=='string'||d[k].trim().length<min||d[k].length>max)return null;
 if(!['draft','published','closed'].includes(String(d.status))||typeof d.startsAt!=='string'||typeof d.endsAt!=='string'||!Number.isFinite(Date.parse(d.startsAt))||!Number.isFinite(Date.parse(d.endsAt))||Date.parse(d.endsAt)<=Date.parse(d.startsAt))return null;
 return {title:(d.title as string).trim(),description:(d.description as string).trim(),rules:(d.rules as string).trim(),prize:(d.prize as string).trim(),startsAt:new Date(d.startsAt).toISOString(),endsAt:new Date(d.endsAt).toISOString(),status:d.status as ContestInput['status']};
}
export function contestOpen(contest:{status:string;startsAt:string;endsAt:string},now=Date.now()){return contest.status==='published'&&Date.parse(contest.startsAt)<=now&&Date.parse(contest.endsAt)>now}
export function validEntry(value:unknown){if(!value||typeof value!=='object'||Array.isArray(value))return null;const d=value as Record<string,unknown>;if(typeof d.publicName!=='string'||d.publicName.trim().length<2||d.publicName.length>60||typeof d.note!=='string'||d.note.length>2000||d.accepted!==true)return null;return {publicName:d.publicName.trim(),note:d.note.trim()}}
