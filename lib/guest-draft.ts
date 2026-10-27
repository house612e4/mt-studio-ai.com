'use client';
type Draft={file:File;prompt:string;style:string;created:number};
const dbName='mt-guest-draft',store='drafts',sessionKey='mt-ai-draft-key';
function open(){return new Promise<IDBDatabase>((resolve,reject)=>{const req=indexedDB.open(dbName,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(store))req.result.createObjectStore(store)};req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result)})}
export async function saveGuestDraft(file:File,prompt:string,style:string){
 const db=await open();const id=sessionStorage.getItem(sessionKey)||crypto.randomUUID();sessionStorage.setItem(sessionKey,id);
 try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).clear();tx.objectStore(store).put({file,prompt,style,created:Date.now()},id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}finally{db.close()}
}
export async function takeGuestDraft():Promise<Draft|null>{
 const id=sessionStorage.getItem(sessionKey);if(!id)return null;const db=await open();
 try{const draft=await new Promise<Draft|undefined>((resolve,reject)=>{const tx=db.transaction(store,'readwrite');const request=tx.objectStore(store).get(id);let value:Draft|undefined;request.onsuccess=()=>{value=request.result;tx.objectStore(store).delete(id)};tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error)});sessionStorage.removeItem(sessionKey);if(!draft||Date.now()-draft.created>30*60*1000||!(draft.file instanceof Blob))return null;return {...draft,file:new File([draft.file],draft.file.name||'mt-photo.png',{type:draft.file.type})}}finally{db.close()}
}
export async function clearGuestDraft(){sessionStorage.removeItem(sessionKey);const db=await open();try{await new Promise<void>((resolve,reject)=>{const t=db.transaction(store,'readwrite');t.objectStore(store).clear();t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error)})}finally{db.close()}}
