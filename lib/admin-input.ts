export type CreditAdjustment={userId:string;credits:number;expectedCredits:number;reason:string;requestId:string};
export function creditAdjustment(value:unknown):CreditAdjustment|null {
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const d=value as Record<string,unknown>;
 if(typeof d.userId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(d.userId))return null;
 for(const k of ['credits','expectedCredits'])if(typeof d[k]!=='number'||!Number.isInteger(d[k])||(d[k] as number)<0||(d[k] as number)>100000)return null;
 if(typeof d.reason!=='string'||d.reason.trim().length<5||d.reason.length>300)return null;
 if(typeof d.requestId!=='string'||!/^[-a-f0-9]{36}$/i.test(d.requestId)||!/^\w{8}-\w{4}-4\w{3}-[89ab]\w{3}-\w{12}$/i.test(d.requestId))return null;
 return {userId:d.userId,credits:d.credits as number,expectedCredits:d.expectedCredits as number,reason:d.reason.trim(),requestId:d.requestId};
}
export function usableBalance(value:unknown):value is number{return typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<=100000}
