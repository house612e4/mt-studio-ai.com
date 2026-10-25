import 'server-only';
import {createHash,createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {database,HttpError} from './server';
export function bkashConfig(){
 const environment=process.env.BKASH_ENVIRONMENT;
 const base=process.env.BKASH_API_BASE_URL?.replace(/\/+$/,'');
 const username=process.env.BKASH_USERNAME,password=process.env.BKASH_PASSWORD,appKey=process.env.BKASH_APP_KEY,appSecret=process.env.BKASH_APP_SECRET,key=process.env.BKASH_TOKEN_ENCRYPTION_KEY;
 if(process.env.BKASH_ENABLED!=='true'||!['sandbox','live'].includes(environment||'')||!base||!username||!password||!appKey||!appSecret||!key)return null;
 try{const url=new URL(base),hosts=environment==='sandbox'?['tokenized.sandbox.bka.sh']:['tokenized.pay.bka.sh'];if(url.protocol!=='https:'||!hosts.includes(url.hostname)||url.port||url.username||url.password||url.pathname!=='/v2/tokenized-checkout'||url.search||url.hash||Buffer.from(key,'base64').length!==32)return null}catch{return null}
 return {environment:environment!,base,username,password,appKey,appSecret,key:Buffer.from(key,'base64')};
}
export const bkashConfigured=()=>Boolean(bkashConfig());
export async function providerPost(path:string,body:unknown,token?:string){const c=bkashConfig();if(!c)throw new HttpError(503,'bKash API সংযোগ সম্পন্ন হয়নি।');
 const headers:Record<string,string>={'Content-Type':'application/json',Accept:'application/json'};
 if(token){headers.Authorization=token;headers['X-App-Key']=c.appKey}else{headers.username=c.username;headers.password=c.password}
 try{const response=await fetch(c.base+path,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(token?25000:10000),redirect:'error',cache:'no-store'});const data=await response.json();if(!response.ok||!data||typeof data!=='object'||Array.isArray(data))throw Error('PROVIDER');return data as Record<string,any>}
 catch{throw new HttpError(502,'bKash থেকে নিশ্চিত উত্তর পাওয়া যায়নি। পেমেন্টের অবস্থা আবার যাচাই করুন।')}
}
function seal(data:unknown,key:Buffer){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv),encrypted=Buffer.concat([cipher.update(JSON.stringify(data),'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64')}
function unseal(blob:string,key:Buffer){const b=Buffer.from(blob,'base64'),d=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([d.update(b.subarray(28)),d.final()]).toString('utf8')) as {id:string;refresh:string;expires:number;refreshExpires:number}}
export async function bkashToken(){
 const c=bkashConfig();if(!c)throw new HttpError(503,'bKash API সংযোগ সম্পন্ন হয়নি।');
 const fingerprint=createHash('sha256').update(c.base+c.appKey+c.appSecret+c.username+c.password+c.key.toString('base64')).digest('hex'),ref=database().collection('paymentSecrets').doc(fingerprint),lease=crypto.randomUUID();
 const state=await database().runTransaction(async t=>{const old=(await t.get(ref)).data()||{},now=Date.now();let token;try{if(old.blob)token=unseal(old.blob,c.key)}catch{throw new HttpError(503,'bKash token cache খোলা যায়নি। অ্যাডমিন encryption key পরীক্ষা করুন।')}
  if(token&&token.expires>now+5*60*1000)return {cached:token.id,refresh:''};
  if(Number(old.lockUntil)>now)throw new HttpError(503,'পেমেন্ট সংযোগ প্রস্তুত হচ্ছে। কিছুক্ষণ পরে চেষ্টা করুন।');
  const calls=(Array.isArray(old.calls)?old.calls:[]).filter((n:number)=>Number.isFinite(n)&&n>now-3600000);if(calls.length>=2)throw new HttpError(503,'bKash token নবায়নের সীমা হয়েছে। পরে চেষ্টা করুন।');
  t.set(ref,{...old,calls:[...calls,now],lease,lockUntil:now+45000});return {cached:'',refresh:token&&token.refreshExpires>now?token.refresh:''};
 });
 if(state.cached)return state.cached;
 try{const data=await providerPost(state.refresh?'/auth/refresh-token':'/auth/grant-token',{app_key:c.appKey,app_secret:c.appSecret,...(state.refresh?{refresh_token:state.refresh}:{})});
  if(data.statusCode!=='0000'||typeof data.id_token!=='string'||typeof data.refresh_token!=='string'||!Number.isFinite(Number(data.expires_in))||Number(data.expires_in)<600)throw new HttpError(502,'bKash API পরিচয় যাচাই হয়নি। অ্যাডমিন credentials পরীক্ষা করুন।');
  const now=Date.now(),blob=seal({id:data.id_token,refresh:data.refresh_token,expires:now+Math.min(Number(data.expires_in),3600)*1000,refreshExpires:now+29*86400000},c.key);
  await database().runTransaction(async t=>{const old=(await t.get(ref)).data();if(old?.lease!==lease)throw new HttpError(503,'পেমেন্ট token নবায়ন সম্পূর্ণ হয়নি।');t.update(ref,{blob,lockUntil:0})});return data.id_token as string;
 }catch(e){await database().runTransaction(async t=>{const old=(await t.get(ref)).data();if(old?.lease===lease)t.update(ref,{lockUntil:0,...(state.refresh?{blob:''}:{})})});throw e}
}
export async function bkashCall(path:string,body:unknown){return providerPost(path,body,await bkashToken())}
