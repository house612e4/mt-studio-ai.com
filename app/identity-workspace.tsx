'use client';
import BrandMark from './brand-mark';
import {useState, type FormEvent} from 'react';
import {Phone, BriefcaseBusiness, CalendarDays, MapPin, Map, Building2, Mars, Venus, Transgender, Check} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {NativeSelect, NativeSelectOption} from '@/components/ui/native-select';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {emptyProfile, type StudioProfile} from '@/lib/profile';
const countries=[['US','🇺🇸 যুক্তরাষ্ট্র','+1'],['BD','🇧🇩 বাংলাদেশ','+880'],['IN','🇮🇳 ভারত','+91'],['GB','🇬🇧 যুক্তরাজ্য','+44'],['SA','🇸🇦 সৌদি আরব','+966'],['AE','🇦🇪 সংযুক্ত আরব আমিরাত','+971']];
const professions=['কম্পিউটার অপারেটর','টাইপিস্ট','ফটোগ্রাফার','গ্রাফিক ডিজাইনার','ফ্রিল্যান্সার','ব্যবসায়ী','ভিডিও এডিটর','ডাটা এন্ট্রি অপারেটর','মোবাইল সার্ভিসিং','লেমিনেশন অপারেটর','ফটোকপি অপারেটর'];
export default function IdentityWorkspace({profile,name,email,brand,onDone,onCancel}:{profile:StudioProfile|null;name:string;email:string;brand:string;onDone:(profile:StudioProfile)=>Promise<void>;onCancel?:()=>void}){
 const [value,setValue]=useState<StudioProfile>(profile?.skipped?{...emptyProfile}:profile||{...emptyProfile}),[step,setStep]=useState(1),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const change=(key:keyof StudioProfile,text:string)=>{setValue(v=>({...v,[key]:text}));setError('')};
 const save=async(skipped=false)=>{setBusy(true);setError('');try{await onDone(skipped?{...emptyProfile,completed:true,skipped:true}:{...value,completed:true,skipped:false})}catch(e){setError((e as Error).message)}finally{setBusy(false)}};
 function next(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!value.profession.trim()||!value.gender){setError('পেশা ও লিঙ্গ নির্বাচন করুন।');return;}setStep(2);setError('');window.scrollTo({top:0,behavior:'smooth'})}
 const field=(key:'phone'|'profession'|'birthDate'|'address'|'district'|'area',label:string,placeholder:string,Icon:typeof Phone,type='text',required=false)=><div className="identity-field"><label htmlFor={'identity-'+key}>{label}{required&&<span> *</span>}</label><div className="identity-input-wrap"><Icon size={19} aria-hidden="true"/><Input id={'identity-'+key} type={type} value={value[key]} onChange={e=>change(key,e.target.value)} placeholder={placeholder} required={required} autoComplete={key==='phone'?'tel':key==='address'?'street-address':key==='birthDate'?'bday':key==='district'?'address-level2':'off'} max={type==='date'?[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'),String(new Date().getDate()).padStart(2,'0')].join('-'):undefined} maxLength={key==='address'?500:key==='phone'?30:100}/></div></div>;
 return <main className="identity-shell"><header className="identity-top"><span className="identity-logo"><BrandMark/><strong>{brand}</strong></span>{onCancel?<button disabled={busy} onClick={onCancel}>বাতিল</button>:<button disabled={busy} onClick={()=>void save(true)}>{busy?'সংরক্ষণ হচ্ছে…':'এড়িয়ে যান'}</button>}</header><div className="identity-content"><p className="identity-step">ধাপ {step} / 2</p><h1>{step===1?'আপনার পরিচয়':'আপনার তথ্য যাচাই করুন'}</h1><p className="identity-subtitle">{step===1?'আপনার সম্পর্কে কিছু তথ্য দিন':'তথ্য সংরক্ষণ করে ড্যাশবোর্ড খুলুন'}</p>
 {step===1?<form onSubmit={next}>
 <div className="identity-field"><label htmlFor="identity-country">দেশ</label><NativeSelect id="identity-country" value={value.country} onChange={e=>change('country',e.target.value)}>{countries.map(([id,label,code])=><NativeSelectOption value={id} key={id}>{label}　{code}</NativeSelectOption>)}</NativeSelect></div>
 {field('phone','ফোন নম্বর',countries.find(c=>c[0]===value.country)?.[2]+' ফোন নম্বর',Phone,'tel')}
 {field('profession','পেশা / পদবি','যেমন: ব্যবসায়ী, আইনজীবী',BriefcaseBusiness,'text',true)}
 <div className="profession-chips" aria-label="Suggested professions">{professions.map(p=><button type="button" key={p} aria-pressed={value.profession===p} onClick={()=>change('profession',p)}>{p}</button>)}</div>
 <fieldset className="identity-gender"><legend>লিঙ্গ<span> *</span></legend><RadioGroup value={value.gender} onValueChange={v=>change('gender',v)} className="identity-gender-grid" aria-label="লিঙ্গ">{[['male','পুরুষ',Mars],['female','নারী',Venus],['other','অন্যান্য',Transgender]].map(([id,label,Icon])=>{const I=Icon as typeof Mars;return <label className="identity-gender-option" key={id as string} htmlFor={'gender-'+id}><RadioGroupItem value={id as string} id={'gender-'+id} className="gender-radio"/><span><I size={24}/></span><strong>{label as string}</strong>{value.gender===id&&<Check className="gender-check" size={16}/>}</label>})}</RadioGroup></fieldset>
 {field('birthDate','জন্মতারিখ','জন্মতারিখ নির্বাচন করুন',CalendarDays,'date')}
 {field('address','ঠিকানা','আপনার বর্তমান ঠিকানা',MapPin)}
 {field('district','জেলা','জেলা / শহর',Map)}
 {field('area','উপজেলা / এলাকা','উপজেলা / এলাকা',Building2)}
 <div className="identity-actions"><Button type="submit">পরবর্তী ধাপ</Button></div>
 </form>:<><section className="identity-review"><div className="identity-review-account"><span className="identity-review-avatar">{name.slice(0,1)}</span><div><strong>{name}</strong><small>{email}</small></div></div><dl>{[['দেশ',countries.find(c=>c[0]===value.country)?.[1]],['ফোন নম্বর',value.phone],['পেশা',value.profession],['লিঙ্গ',value.gender==='male'?'পুরুষ':value.gender==='female'?'নারী':'অন্যান্য'],['জন্মতারিখ',value.birthDate],['ঠিকানা',value.address],['জেলা',value.district],['উপজেলা / এলাকা',value.area]].map(([label,text])=><div key={label}><dt>{label}</dt><dd>{text||'—'}</dd></div>)}</dl></section><div className="identity-actions review-actions"><Button variant="outline" disabled={busy} onClick={()=>setStep(1)}>পেছনে</Button><Button disabled={busy} onClick={()=>void save()}>{busy?'সংরক্ষণ হচ্ছে…':'সংরক্ষণ করে ড্যাশবোর্ড খুলুন'}</Button></div></>}
 {error&&<p className="identity-error" role="alert">{error}</p>}
 </div></main>
}
