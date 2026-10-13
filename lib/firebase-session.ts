import 'server-only';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {adminAuth} from './firebase-admin';
export async function currentUser(){const token=(await cookies()).get('mt_session')?.value;if(!token)return null;try{const decoded=await adminAuth().verifySessionCookie(token,true);if(!decoded.email_verified)return null;return {userId:decoded.uid,email:decoded.email||'',displayName:decoded.name||decoded.email||'আপনার স্টুডিও'};}catch{return null;}}
export async function requireUser(){const user=await currentUser();if(!user)redirect('/login');return user;}
