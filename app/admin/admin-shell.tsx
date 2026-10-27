'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import type {BrandSettings} from '@/lib/studio-settings';
import {readApiJson} from '@/lib/api-response';
import AdminWorkspace from '../admin-workspace';
import './admin.css';
export default function AdminShell({initialBrand,expectedUid}:{initialBrand:BrandSettings;expectedUid:string}){const router=useRouter();const[brand,setBrand]=useState(initialBrand);async function refresh(){const result=await readApiJson(await fetch('/api/site',{cache:'no-store'}));setBrand(result.brand)}return <div className="admin-shell"><header className="admin-shell-header"><a href="/workspace"><b>{brand.name}</b></a><nav aria-label="মূল নেভিগেশন"><a href="/workspace">কর্মক্ষেত্র</a><a href="/signout">সাইন আউট</a></nav></header><main><AdminWorkspace expectedUid={expectedUid} data={{brand}} refresh={refresh} contest={()=>router.push('/workspace?view=photo-contest')}/></main></div>}
