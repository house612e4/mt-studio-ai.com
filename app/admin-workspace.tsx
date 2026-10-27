'use client';
import {useEffect,useState} from 'react';
import dynamic from 'next/dynamic';
const AdminContent=dynamic(()=>import('./admin-content'));
const AdminMfa=dynamic(()=>import('./admin-mfa'));
const ManualPaymentAdmin=dynamic(()=>import('./manual-payment-admin'));
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {readApiJson} from '@/lib/api-response';
import {defaultBrand,type BrandSettings} from '@/lib/studio-settings';
import {creditAdjustment,type CreditAdjustment} from '@/lib/admin-input';
import {write} from '@/lib/workspace-client';
import type {BrandSettings as AdminBrand} from '@/lib/studio-settings';
import './admin/admin.css';
type Customer={userId:string;email:string;name:string;credits:number};
type Audit={id:string;email:string;before:number;after:number;reason:string;created:string};
type Diagnostic={checkedAt:string;checks:{id:string;name:string;state:string;detail:string}[];audit:Audit[]};
const fields:{key:keyof BrandSettings;label:string;type?:string;max:number}[]=[
 {key:'logoUrl',label:'লোগোর HTTPS লিংক (অথবা নিচে আপলোড করুন)',type:'url',max:2000},{key:'appVersion',label:'অ্যাপ সংস্করণ',max:40},{key:'releaseNotes',label:'অ্যাপের নতুন সংস্করণে যা আছে',max:2000},
 {key:'name',label:'স্টুডিওর নাম',max:80},{key:'phone',label:'যোগাযোগ নম্বর',type:'tel',max:40},
 {key:'whatsappPhone',label:'WhatsApp নম্বর (+ এবং দেশের কোডসহ)',type:'tel',max:20},{key:'address',label:'ঠিকানা',max:300},
 {key:'welcome',label:'ড্যাশবোর্ডের শিরোনাম',max:300},{key:'supportEmail',label:'সাপোর্ট ইমেইল',type:'email',max:254},
 {key:'supportGroupUrl',label:'সাপোর্ট গ্রুপের HTTPS লিংক',type:'url',max:2000},
 {key:'appDownloadUrl',label:'প্রকৃত অ্যাপ ডাউনলোডের HTTPS লিংক',type:'url',max:2000},
 {key:'termsUrl',label:'ব্যবহারের শর্তের HTTPS লিংক',type:'url',max:2000},
 {key:'privacyUrl',label:'গোপনীয়তা নীতির HTTPS লিংক',type:'url',max:2000},
 {key:'refundUrl',label:'রিফান্ড নীতির HTTPS লিংক',type:'url',max:2000},
 {key:'instagramUrl',label:'Instagram HTTPS লিংক',type:'url',max:2000},
 {key:'threadsUrl',label:'Threads HTTPS লিংক',type:'url',max:2000},
 {key:'facebookUrl',label:'Facebook HTTPS লিংক',type:'url',max:2000},
 {key:'youtubeUrl',label:'YouTube HTTPS লিংক',type:'url',max:2000}
 ,{key:'googleReviewUrl',label:'Google Business-এর “Get more reviews” লিংক',type:'url',max:2000}
 ,{key:'googlePlaceId',label:'Google Business Place ID',max:220}
];
const states:Record<string,string>={passed:'পরীক্ষায় সফল',configured:'মান দেওয়া আছে',missing:'মান দেওয়া বাকি',error:'পরীক্ষা ব্যর্থ',pending:'সংযোগ বাকি'};
export default function AdminWorkspace({data,refresh,contest,expectedUid}:{expectedUid?:string;data:{brand:Partial<AdminBrand>};refresh:()=>Promise<void>;contest:()=>void}){
 const[tab,setTab]=useState('health'),[visited,setVisited]=useState(['health']);
 const[edits,setEdits]=useState<Partial<BrandSettings>>({}),[saving,setSaving]=useState(false),[brandMessage,setBrandMessage]=useState('');const brand={...defaultBrand,...data.brand,...edits},dirty=Object.keys(edits).length>0;
 const[diagnostic,setDiagnostic]=useState<Diagnostic|null>(null),[checking,setChecking]=useState(false),[checkError,setCheckError]=useState('');
 const[email,setEmail]=useState(''),[customer,setCustomer]=useState<Customer|null>(null),[balance,setBalance]=useState(''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[attempt,setAttempt]=useState<CreditAdjustment|null>(null);
 useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[dirty]);
 async function check(){setChecking(true);setCheckError('');try{const r=await fetch('/api/admin',{cache:'no-store'});setDiagnostic(await readApiJson(r) as Diagnostic)}catch(e){setCheckError((e as Error).message)}finally{setChecking(false)}}
 useEffect(()=>{let active=true;fetch('/api/admin',{cache:'no-store'}).then(readApiJson).then(result=>{if(active)setDiagnostic(result as Diagnostic)}).catch(error=>{if(active)setCheckError(error.message)});return()=>{active=false}},[]);
 async function find(){setBusy(true);setCustomer(null);setAttempt(null);setMessage('');try{const r=await fetch('/api/admin?email='+encodeURIComponent(email.trim()),{cache:'no-store'});const j=await readApiJson(r);setCustomer(j.user);setBalance(String(j.user.credits));setReason('')}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 async function adjust(){if(!customer)return;const body=attempt||creditAdjustment({userId:customer.userId,credits:Number(balance),expectedCredits:customer.credits,reason,requestId:crypto.randomUUID()});if(!body){setMessage('সঠিক পূর্ণসংখ্যা ও অন্তত ৫ অক্ষরের কারণ দিন।');return}setAttempt(body);setBusy(true);setMessage('');try{
  const r=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});await readApiJson(r);setCustomer(null);setBalance('');setReason('');setAttempt(null);setMessage('সমন্বয় সংরক্ষিত হয়েছে। একই অনুরোধে দ্বিতীয়বার সমন্বয় হবে না।');await check();
 }catch(e){setMessage((e as Error).message+' ফল অস্পষ্ট হলে একই অনুরোধ আবার যাচাই করুন, অথবা গ্রাহক নতুন করে খুঁজুন।')}finally{setBusy(false)}}
 function openContest(){if(dirty&&!window.confirm('ব্র্যান্ডের পরিবর্তন সংরক্ষিত হয়নি। এই পাতা ছাড়বেন?'))return;contest()}
 const canAdjust=customer&&balance.trim()!==''&&Number.isInteger(Number(balance))&&Number(balance)>=0&&Number(balance)<=100000&&Number(balance)!==customer.credits&&reason.trim().length>=5;
 return <div className="admin-workspace"><header className="page-heading"><div><h1>স্টুডিও পরিচালনা</h1><p>সেবার অবস্থা, যোগাযোগ ও গ্রাহকের ক্রেডিট পরিচালনা করুন।</p></div></header><nav className="admin-section-tabs" aria-label="পরিচালনার বিভাগ">{[['health','সংযোগ'],['brand','ব্র্যান্ড'],['credits','ক্রেডিট'],['payments','পেমেন্ট'],['contests','প্রতিযোগিতা'],['policies','নীতিমালা']].map(([id,label])=><button type="button" key={id} aria-current={tab===id?'page':undefined} onClick={()=>{setTab(id);setVisited(v=>v.includes(id)?v:[...v,id])}}>{label}</button>)}</nav>
 <section className="panel" hidden={tab!=='health'}>{expectedUid&&<AdminMfa expectedUid={expectedUid}/>}<div className="admin-section-heading"><h2>সংযোগ পরীক্ষা</h2><Button variant="outline" disabled={checking} onClick={()=>void check()}>{checking?'পরীক্ষা হচ্ছে…':'আবার পরীক্ষা করুন'}</Button></div><p>এই পরীক্ষা গোপন মান দেখায় না এবং কোনো paid AI কাজ চালায় না।</p>{checkError&&<p role="alert" className="error-banner">{checkError}</p>}{diagnostic&&<><p className="help">সর্বশেষ পরীক্ষা: {new Date(diagnostic.checkedAt).toLocaleString('bn-BD')}</p><div className="admin-checks">{diagnostic.checks.map(c=><div className="admin-check" key={c.id}><div><strong>{c.name}</strong><small>{c.detail}</small></div><span className={'admin-check-state '+c.state}>{states[c.state]||c.state}</span></div>)}</div></>}</section>
 <div><section className="panel" hidden={tab!=='brand'}><h2>স্টুডিও ও সাপোর্ট</h2><p>ঐচ্ছিক লিংক খালি থাকলে সংশ্লিষ্ট বাটন দেখানো হবে না। API key এই ফর্মে দেবেন না।</p><form onSubmit={async e=>{e.preventDefault();setSaving(true);setBrandMessage('');try{await write('brand',{data:brand});await refresh();setEdits({});setBrandMessage('তথ্য সংরক্ষিত হয়েছে।')}catch(e){setBrandMessage((e as Error).message)}finally{setSaving(false)}}}>{fields.map(f=><label key={f.key}>{f.label}<Input type={f.type||'text'} value={brand[f.key]} maxLength={f.max} required={f.key==='name'} disabled={saving} onChange={e=>setEdits({...edits,[f.key]:e.target.value})}/></label>)}<Button disabled={saving} type="submit">{saving?'সংরক্ষণ হচ্ছে…':'তথ্য সংরক্ষণ'}</Button><p role="status">{brandMessage}</p></form></section>
 <section className="panel" hidden={tab!=='credits'}><h2>গ্রাহকের ক্রেডিট সমন্বয়</h2><p>এটি অ্যাডমিন সমন্বয়। পেমেন্ট গ্রহণ হয়েছে বলে চিহ্নিত করবে না।</p><form onSubmit={e=>{e.preventDefault();void find()}}><label>গ্রাহকের যাচাইকৃত ইমেইল<Input type="email" required maxLength={254} value={email} disabled={busy} onChange={e=>{setEmail(e.target.value);setCustomer(null);setAttempt(null)}}/></label><Button disabled={busy} type="submit">গ্রাহক খুঁজুন</Button></form>{customer&&<><div className="admin-customer"><strong>{customer.name||customer.email}</strong><span>{customer.email}</span><small>UID: {customer.userId}</small><p>বর্তমান ক্রেডিট: <b>{customer.credits}</b></p></div><label>সমন্বয়ের পর মোট ক্রেডিট<Input type="number" min="0" max="100000" step="1" disabled={busy||!!attempt} value={balance} onChange={e=>setBalance(e.target.value)}/></label><label>সমন্বয়ের কারণ<Textarea maxLength={300} rows={3} disabled={busy||!!attempt} value={reason} onChange={e=>setReason(e.target.value)}/></label>{canAdjust&&<p>পরিবর্তন: {customer.credits} → {Number(balance)} ক্রেডিট</p>}<Button disabled={busy||!attempt&&!canAdjust} onClick={()=>void adjust()}>{busy?'কাজ হচ্ছে…':attempt?'একই অনুরোধের ফল যাচাই করুন':'ক্রেডিট সমন্বয় করুন'}</Button></>}<p role="status">{message}</p></section></div>
 <section className="panel" hidden={tab!=='credits'}><h2>সাম্প্রতিক সমন্বয়</h2>{diagnostic?.audit.length?diagnostic.audit.map(a=><div className="admin-check" key={a.id}><div><strong>{a.email}</strong><small>{a.reason} · {new Date(a.created).toLocaleString('bn-BD')}</small></div><b>{a.before} → {a.after}</b></div>):<p>এখনও সমন্বয়ের তথ্য নেই।</p>}</section>
 <section className="panel" hidden={tab!=='contests'}><h2>প্রতিযোগিতা পরিচালনা</h2><p>কাজ, পয়েন্ট, সময় ও পুরস্কার নির্ধারণ করুন। প্রকৃত অংশগ্রহণ থেকে লিডারবোর্ড তৈরি হবে।</p><div className="button-row"><a className="primary-link" href="/contest">পয়েন্ট প্রতিযোগিতা পরিচালনা</a><Button variant="outline" onClick={openContest}>ছবি জমার প্রতিযোগিতা পরিচালনা</Button></div></section>
 {visited.includes('payments')&&<div hidden={tab!=='payments'}><ManualPaymentAdmin refresh={refresh}/></div>}
 {visited.includes('policies')&&<div hidden={tab!=='policies'}><AdminContent refresh={refresh} contest={openContest}/></div>}
 </div>
}
