'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {Menu,Search,Home,Plus,Image as ImageIcon,Users} from 'lucide-react';
import AccountMenu from './account-menu';
import NewWorkDrawer from './new-work-drawer';
import BrandMark from './brand-mark';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {defaultBrand} from '@/lib/studio-settings';
import {workspaceHref} from '@/lib/workspace-navigation';
import {readApiJson} from '@/lib/api-response';
import type {Workspace} from './studio';
const initial:Workspace={profile:null,records:[],files:[],user:{credits:0},admin:false,brand:defaultBrand,aiReady:false,paymentsReady:true};
export default function CommerceShell({children,authenticated=false,name='অতিথি'}:{children:React.ReactNode;authenticated?:boolean;name?:string}){
 const[open,setOpen]=useState(false),[create,setCreate]=useState(false),[info,setInfo]=useState(''),[data,setData]=useState(initial);
 useEffect(()=>{void fetch(authenticated?'/api/workspace':'/api/site',{cache:'no-store'}).then(readApiJson).then(j=>setData(authenticated?j as Workspace:{...initial,brand:j.brand||defaultBrand,aiReady:!!j.aiReady})).catch(()=>{})},[authenticated]);
 const go=(v:string)=>{const path=v==='contest'?'/contest':workspaceHref(v);const privateView=['profile','photos','gallery','photo-settings','files','credit-history','settings','transaction','customer','invoice','shop','job','question','autofill','admin'].includes(v);window.location.assign(!authenticated&&privateView?'/login?next='+encodeURIComponent(path):path)};
 const descriptions:Record<string,string>={mobile:'iPhone-এ Safari থেকে Share → Add to Home Screen দিয়ে শর্টকাট রাখুন। Android-এ ব্রাউজারের Add to Home Screen ব্যবহার করুন।',shortcuts:'কর্মক্ষেত্রে Ctrl/⌘ + K: টুল খোঁজা; Alt + H: হোম; Alt + N: নতুন কাজ; Alt + P: প্রোফাইল।',whatsapp:'সাপোর্ট নম্বর সেটিংসে যোগ করা বাকি।','support-group':'সাপোর্ট গ্রুপের লিংক এখনো দেওয়া হয়নি।'};
 return <div className="commerce-page"><header className="commerce-top"><a href="/workspace" className="commerce-brand"><BrandMark logoUrl={data.brand.logoUrl}/><strong>{data.brand.name}</strong></a><nav><button className="commerce-icon-button" aria-label="টুল খুঁজুন" onClick={()=>go('tools')}><Search size={22}/></button><button className="commerce-icon-button" aria-label="সাইডবার মেনু খুলুন" aria-expanded={open} onClick={()=>setOpen(true)}><Menu size={24}/></button></nav></header><main>{children}</main><footer className="commerce-footer">{data.brand.name} · <a href="/credits">ক্রেডিট</a> · <a href="/contest">প্রতিযোগিতা</a> · <Link href="/policies/terms">শর্ত</Link> · <Link href="/policies/privacy">গোপনীয়তা</Link> · <Link href="/policies/refund">রিফান্ড</Link></footer><nav className="commerce-bottom" aria-label="প্রধান নেভিগেশন"><button onClick={()=>go('dashboard')}><Home/><span>হোম</span></button><button className="commerce-new" onClick={()=>setCreate(true)} aria-label="নতুন কাজ"><Plus size={30}/></button><button onClick={()=>go('photos')}><ImageIcon/><span>ছবি</span></button><button onClick={()=>go('profile')}><Users/><span>{authenticated?'প্রোফাইল':'সাইনআপ বা লগইন'}</span></button></nav><AccountMenu open={open} onOpenChange={setOpen} data={data} name={name} view="" go={go} credits={()=>window.location.assign('/credits')} info={setInfo} guest={!authenticated}/><NewWorkDrawer open={create} onOpenChange={setCreate} onChoose={go} aiReady={data.aiReady}/><Dialog open={!!info} onOpenChange={v=>{if(!v)setInfo('')}}><DialogContent><DialogHeader><DialogTitle>MT Studio</DialogTitle><DialogDescription>{descriptions[info]||'সাহায্যের জন্য '+data.brand.supportEmail+'-এ যোগাযোগ করুন।'}</DialogDescription></DialogHeader></DialogContent></Dialog></div>
}
