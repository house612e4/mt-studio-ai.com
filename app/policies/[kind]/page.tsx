import {notFound} from 'next/navigation';
import {database} from '@/lib/firebase-admin';
import {policyKinds,policyTitles,validatePolicies} from '@/lib/site-content';
import {publicBrand} from '@/lib/studio-settings';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{kind:string}>}){const {kind}=await params;if(!policyKinds.includes(kind as typeof policyKinds[number]))notFound();const key=kind as typeof policyKinds[number];const db=database(),[p,b]=await Promise.all([db.collection('settings').doc('policies').get(),db.collection('settings').doc('brand').get()]);const policies=validatePolicies(p.data());if(!policies?.[key])notFound();const brand=publicBrand(b.data());return <main className="policy-page"><a href="/">{brand.name}</a><h1>{policyTitles[key]}</h1><article style={{whiteSpace:'pre-wrap'}}>{policies[key]}</article><p>{brand.supportEmail}</p><a href="/workspace">স্টুডিওতে ফিরুন</a></main>}
