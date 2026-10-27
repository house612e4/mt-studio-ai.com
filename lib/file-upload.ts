'use client';
import {readApiJson} from '@/lib/api-response';
import {ref,uploadBytesResumable} from 'firebase/storage';
import {firebaseAuth,firebaseStorage} from './firebase-client';
const savedUploads=new WeakMap<File,Promise<{id:string}>>();
export async function uploadFile(file:File,onProgress?:(n:number)=>void){const existing=savedUploads.get(file);if(existing)return existing;const pending=performUpload(file,onProgress);savedUploads.set(file,pending);try{return await pending}catch(e){savedUploads.delete(file);throw e}}
async function performUpload(file:File,onProgress?:(n:number)=>void){if(!file.size||file.size>20*1024*1024)throw new Error('প্রতিটি সংরক্ষিত ফাইল সর্বোচ্চ ২০ MB হতে পারে।');const auth=firebaseAuth();await auth.authStateReady();const user=auth.currentUser;if(!user||!user.emailVerified)throw new Error('ইমেইল যাচাই করে আবার লগইন করুন।');await user.getIdToken();
 const reservation=await readApiJson(await fetch('/api/files',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reserve',name:file.name.slice(0,200),size:file.size})}));const id=String(reservation.id),path=`users/${user.uid}/${id}`;
 try{const task=uploadBytesResumable(ref(firebaseStorage(),path),file,{contentType:'application/octet-stream',customMetadata:{originalMime:file.type||'application/octet-stream',originalName:file.name.slice(0,200)}});await new Promise<void>((resolve,reject)=>task.on('state_changed',s=>onProgress?.(Math.round(s.bytesTransferred/s.totalBytes*100)),reject,()=>resolve()));const data=await readApiJson(await fetch('/api/files',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name:file.name.slice(0,200)})}));return{id:data.id as string};}
 catch(e){await fetch('/api/files',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}).catch(()=>{});throw e}}
