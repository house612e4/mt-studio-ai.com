import type {Firestore,Transaction} from 'firebase-admin/firestore';
export const FILE_LIMIT=20*1024*1024;
export const STORAGE_LIMIT=200*1024*1024;
export const FILE_COUNT_LIMIT=200;
export class StorageQuotaError extends Error {}
export async function reserveFile(db:Firestore,owner:string,id:string,size:number,name:string){
 const ref=db.collection('uploadReservations').doc(id),usage=db.collection('storageUsage').doc(owner);
 // Seed existing accounts once; the transaction serializes concurrent first reservations.
 const current=await usage.get();let seed={count:0,bytes:0};
 if(!current.exists){const files=await db.collection('files').where('owner','==',owner).limit(FILE_COUNT_LIMIT+1).get();seed={count:files.size,bytes:files.docs.reduce((n,d)=>n+Number(d.data().size||0),0)}}
 await db.runTransaction(async t=>{const[r,u]=await Promise.all([t.get(ref),t.get(usage)]);if(r.exists){const old=r.data()!;if(old.owner!==owner||old.size!==size)throw new StorageQuotaError('ফাইলের অনুরোধ মেলেনি।');return}const data=u.data()||seed,count=Number(data.count||0),bytes=Number(data.bytes||0);if(count>=FILE_COUNT_LIMIT||bytes+size>STORAGE_LIMIT)throw new StorageQuotaError('ফাইল সংরক্ষণের সীমা পূর্ণ হয়েছে (২০০টি ফাইল / ২০০ MB)। সহায়তায় যোগাযোগ করুন।');t.set(usage,{count:count+1,bytes:bytes+size});t.create(ref,{owner,size,name,status:'pending',created:new Date().toISOString(),expiresAt:new Date(Date.now()+60*60*1000),expires:new Date(Date.now()+60*60*1000).toISOString()})});
}
export async function finalizeFile(t:Transaction,db:Firestore,owner:string,id:string,actualSize:number,file:Record<string,unknown>){
 const ref=db.collection('files').doc(id),reservation=db.collection('uploadReservations').doc(id),usage=db.collection('storageUsage').doc(owner);
 const[old,r,u]=await Promise.all([t.get(ref),t.get(reservation),t.get(usage)]);if(old.exists){if(old.data()?.owner!==owner)throw new StorageQuotaError('ফাইলটি আপনার নয়।');return}const pending=r.data();if(!pending||pending.owner!==owner||pending.status!=='pending'||actualSize>Number(pending.size)||Date.parse(pending.expires)<Date.now())throw new StorageQuotaError('আপলোডের সময়সীমা শেষ হয়েছে। আবার ফাইল দিন।');const total=Number(u.data()?.bytes||0)-Number(pending.size)+actualSize;if(total>STORAGE_LIMIT||total<0)throw new StorageQuotaError('সংরক্ষণের হিসাব সঠিক নয়। সহায়তায় যোগাযোগ করুন।');t.create(ref,file);t.update(usage,{bytes:total});t.delete(reservation);
}
export async function cancelFile(db:Firestore,owner:string,id:string){
 const reservation=db.collection('uploadReservations').doc(id),usage=db.collection('storageUsage').doc(owner),file=db.collection('files').doc(id);
 return db.runTransaction(async t=>{const[f,r,u]=await Promise.all([t.get(file),t.get(reservation),t.get(usage)]);if(f.exists||!r.exists||r.data()?.owner!==owner)return false;const data=u.data();t.delete(reservation);if(data)t.update(usage,{count:Math.max(0,Number(data.count||0)-1),bytes:Math.max(0,Number(data.bytes||0)-Number(r.data()?.size||0))});return true});
}
