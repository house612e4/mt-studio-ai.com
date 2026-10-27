 'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {readPhotoPreferences} from '@/lib/photo-preferences';
export default function PreferencesWorkspace({go,admin}:{go:(view:string)=>void;admin:boolean}){
 const [dark,setDark]=useState(false),[status,setStatus]=useState('');
// Read browser-only theme after hydration and subscribe to external theme changes.
// eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{try{setDark(localStorage.getItem('mt-theme')==='dark')}catch{}const changed=(e:Event)=>setDark((e as CustomEvent<boolean>).detail);window.addEventListener('mt-theme-change',changed);return()=>window.removeEventListener('mt-theme-change',changed)},[]);
 function theme(value:boolean){setDark(value);try{localStorage.setItem('mt-theme',value?'dark':'light')}catch{};window.dispatchEvent(new CustomEvent('mt-theme-change',{detail:value}));document.documentElement.dataset.studioTheme=value?'dark':'light'}
 return <section className="panel preferences-panel"><h1>সেটিংস</h1><label className="service-row">ডার্ক মোড<input type="checkbox" checked={dark} onChange={e=>theme(e.target.checked)}/></label><p>এই ব্রাউজারে পছন্দগুলো মনে রাখা হবে।</p><div className="button-row"><Button onClick={()=>go('photo-settings')}>ছবির ডিফল্ট মাপ, পোশাক ও ব্যাকগ্রাউন্ড</Button><Button variant="outline" onClick={()=>go('profile')}>ব্যক্তিগত ও ব্যবসার তথ্য</Button>{admin&&<Button variant="outline" onClick={()=>go('admin')}>স্টুডিও পরিচালনা</Button>}</div><hr/><h2>ছবির পছন্দ পুনরায় সেট করুন</h2><p>এটি শুধু এই ব্রাউজারের ছবির পছন্দ বদলাবে। সংরক্ষিত ছবি ও তথ্য থাকবে।</p><Button variant="outline" onClick={()=>{localStorage.setItem('mt-photo-preferences',JSON.stringify(readPhotoPreferences(null)));setStatus('ছবির পছন্দ পুনরায় সেট হয়েছে।')}}>ডিফল্ট পছন্দ ফিরিয়ে আনুন</Button><p role="status">{status}</p><h2>ফাইলের সীমা</h2><p>লোকাল ছবি সম্পাদনা: ৬০ MB পর্যন্ত। AI: ১০ MB পর্যন্ত। ক্লাউডে সংরক্ষণ: ২০ MB পর্যন্ত। বড় ফল সরাসরি ডাউনলোড করতে পারবেন।</p></section>
}
