import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {validatedFileMime} from '../lib/file-validation.ts';
import {reserveFile,finalizeFile,cancelFile,FILE_LIMIT,STORAGE_LIMIT} from '../lib/storage-quota.ts';
function fixture(initial=[]){
 const rows=new Map(initial);
 const snap=key=>({exists:rows.has(key),data:()=>rows.get(key)});
 const ref=(c,id)=>({id,key:c+'/'+id,get:async()=>snap(c+'/'+id)});
 const db={
  collection:c=>({
   doc:id=>ref(c,id),
   where:(_field,_operator,owner)=>({limit:n=>({get:async()=>{
    const docs=[...rows].filter(([k,v])=>k.startsWith(c+'/')&&v.owner===owner).slice(0,n).map(([key])=>snap(key));return{docs,size:docs.length};
   }})}),
  }),
  runTransaction:async callback=>{
   const writes=[];let wrote=false;
   const transaction={
    get:async r=>{assert(!wrote,'Firestore reads must precede writes');return snap(r.key)},
    set:(r,v)=>{wrote=true;writes.push(()=>rows.set(r.key,v))},
    create:(r,v)=>{wrote=true;assert(!rows.has(r.key));writes.push(()=>rows.set(r.key,v))},
    update:(r,v)=>{wrote=true;writes.push(()=>rows.set(r.key,{...rows.get(r.key),...v}))},
    delete:r=>{wrote=true;writes.push(()=>rows.delete(r.key))},
   };
   const result=await callback(transaction);writes.forEach(fn=>fn());return result;
  },
 };
 return{db,rows};
}
test('quota reservation seeds legacy files, counts pending bytes, and rejects overflow without writes',async()=>{const{db,rows}=fixture([['files/legacy',{owner:'alice',size:STORAGE_LIMIT-FILE_LIMIT}]]);await reserveFile(db,'alice','one',FILE_LIMIT,'one.png');assert.deepEqual(rows.get('storageUsage/alice'),{count:2,bytes:STORAGE_LIMIT});await assert.rejects(()=>reserveFile(db,'alice','two',1,'two.png'));assert(!rows.has('uploadReservations/two'));assert.equal(rows.get('storageUsage/alice').bytes,STORAGE_LIMIT)});
test('finalization adjusts reserved bytes once and cancellation cannot erase an accepted file',async()=>{const{db,rows}=fixture();await reserveFile(db,'alice','one',100,'one.png');await db.runTransaction(t=>finalizeFile(t,db,'alice','one',40,{owner:'alice',size:40}));assert.deepEqual(rows.get('storageUsage/alice'),{count:1,bytes:40});await db.runTransaction(t=>finalizeFile(t,db,'alice','one',40,{owner:'alice',size:40}));assert.equal(await cancelFile(db,'alice','one'),false);assert(rows.has('files/one'));assert.equal(rows.get('storageUsage/alice').bytes,40)});
test('abandoned reservation releases quota once, while a different owner cannot release it',async()=>{const{db,rows}=fixture();await reserveFile(db,'alice','one',100,'one.png');assert.equal(await cancelFile(db,'bob','one'),false);assert.equal(await cancelFile(db,'alice','one'),true);assert.equal(await cancelFile(db,'alice','one'),false);assert.deepEqual(rows.get('storageUsage/alice'),{count:0,bytes:0})});
test('image MIME comes from decoded bytes, corrupt pictures fail, generic binary files remain attachments',async()=>{const png=await sharp({create:{width:20,height:30,channels:3,background:'#ff0000'}}).png().toBuffer();assert.equal(await validatedFileMime(png,'image/jpeg'),'image/png');await assert.rejects(()=>validatedFileMime(Buffer.from('not an image'),'image/png'));await assert.rejects(()=>validatedFileMime(png.subarray(0,20),'image/png'));assert.equal(await validatedFileMime(Buffer.from([0,1,2,3]),'video/unknown'),'application/octet-stream');assert.equal(await validatedFileMime(Buffer.from('%PDF-1.7\n'),'application/pdf'),'application/pdf')});
