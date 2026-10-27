'use client';
import {useEffect,useState} from 'react';
import {clearGuestDraft} from '@/lib/guest-draft';
import {signOut} from 'firebase/auth';import {firebaseAuth,firebaseConfigured} from '@/lib/firebase-client';
export default function Signout(){const[error,setError]=useState('');useEffect(()=>{void(async()=>{try{const r=await fetch('/api/auth/signout',{method:'POST'});if(!r.ok)throw new Error('লগআউট হয়নি। আবার চেষ্টা করুন।');if(firebaseConfigured)await signOut(firebaseAuth());await clearGuestDraft().catch(()=>{});window.location.replace('/login')}catch(e){setError((e as Error).message)}})()},[]);return <main className="auth-shell"><p>{error||'লগআউট হচ্ছে…'}</p>{error&&<a href="/signout">আবার চেষ্টা</a>}</main>}
