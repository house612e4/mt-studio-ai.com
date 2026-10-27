import 'server-only';
import {loginDestination} from './workspace-navigation';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {adminAuth} from './firebase-admin';
import {adminMfaClaim} from './admin-security';
export const sessionCookieName=process.env.NODE_ENV==='production'?'__Host-mt_session':'mt_session';
export async function currentUser(){
 const token=(await cookies()).get(sessionCookieName)?.value;
 if(!token)return null;
 try{
  const decoded=await adminAuth().verifySessionCookie(token,true);
  if(!decoded.email_verified)return null;
  return {userId:decoded.uid,email:decoded.email||'',displayName:decoded.name||decoded.email||'আপনার স্টুডিও',authTime:Number(decoded.auth_time||0),mfa:adminMfaClaim(decoded)};
 }catch{return null;}
}
export async function requireUser(next='/workspace'){const user=await currentUser();if(!user)redirect('/login?next='+encodeURIComponent(loginDestination(next)));return user;}
