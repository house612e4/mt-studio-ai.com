import {cert,getApps,initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {cancelFile} from '../../lib/storage-quota';
export const config={schedule:'0 3 * * *'};
const cleanupUploads=async()=>{
 const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;if(!raw)return new Response('Configuration missing',{status:503});const service=JSON.parse(raw),app=getApps()[0]||initializeApp({credential:cert(service),storageBucket:process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET});const db=getFirestore(app),bucket=getStorage(app).bucket(),state=db.collection('maintenance').doc('uploads'),previous=(await state.get()).data();let removed=0;
 const expired=await db.collection('uploadReservations').where('expires','<',new Date().toISOString()).limit(100).get();for(const d of expired.docs){const owner=String(d.data().owner||'');if(owner&&await cancelFile(db,owner,d.id)){await bucket.file(`users/${owner}/${d.id}`).delete({ignoreNotFound:true});removed++}}
 const[files,nextQuery]=await bucket.getFiles({prefix:'users/',autoPaginate:false,maxResults:100,...(previous?.pageToken?{pageToken:String(previous.pageToken)}:{})});
 for(const file of files){const parts=file.name.split('/');if(parts.length!==3)continue;const[meta,saved,reservation]=await Promise.all([file.getMetadata(),db.collection('files').doc(parts[2]).get(),db.collection('uploadReservations').doc(parts[2]).get()]);if(!saved.exists&&!reservation.exists&&Date.parse(meta[0].timeCreated||'')<Date.now()-24*60*60*1000){await file.delete({ignoreNotFound:true});removed++}}
 await state.set({pageToken:nextQuery?.pageToken||null,updated:new Date().toISOString()});return Response.json({removed,scanned:files.length});
}

export default cleanupUploads;
