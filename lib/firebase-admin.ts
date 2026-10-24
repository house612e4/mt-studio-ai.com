import 'server-only';
import {cert,getApps,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
function adminApp(){if(getApps().length)return getApps()[0];const value=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;if(!value)throw new Error('CONFIG');let service;try{service=JSON.parse(value)}catch{throw new Error('CONFIG_JSON')}if(!service.project_id||!service.client_email||!service.private_key)throw new Error('CONFIG');return initializeApp({credential:cert(service),projectId:service.project_id,storageBucket:process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET});}
export const adminAuth=()=>getAuth(adminApp());
export const database=()=>getFirestore(adminApp());
export const bucket=()=>getStorage(adminApp()).bucket();
