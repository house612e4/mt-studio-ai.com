'use client';
import {useEffect,useState} from 'react';
export default function BrandMark({logoUrl,className='brand-mark'}:{logoUrl?:string;className?:string}){const[remote,setRemote]=useState(''),[failedSource,setFailedSource]=useState('');useEffect(()=>{if(logoUrl===undefined)void fetch('/api/site').then(r=>r.json()).then(d=>setRemote(d.brand?.logoUrl||'')).catch(()=>{})},[logoUrl]);const src=logoUrl===undefined?remote:logoUrl;return <span className={className}>{src&&src!==failedSource?<img src={src} alt="স্টুডিওর লোগো" onError={()=>setFailedSource(src)}/>:<>MT</>}</span>}
