import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {creditAdjustment} from '../lib/admin-input.ts';
import {validateBrand,publicBrand,publicHttpsUrl} from '../lib/studio-settings.ts';

const valid={userId:'customer-123',credits:25,expectedCredits:10,reason:'Manual goodwill adjustment',requestId:'00000000-0000-4000-8000-000000000001'};
test('admin inputs reject malformed identifiers, forged balances and missing audit reasons',()=>{
 assert(creditAdjustment(valid));
 for(const b of [null,[],{...valid,userId:'../other'},{...valid,credits:-1},{...valid,credits:1.5},{...valid,credits:100001},{...valid,credits:'25'},{...valid,expectedCredits:NaN},{...valid,reason:' '},{...valid,reason:'x'.repeat(301)},{...valid,requestId:'bad-id'}])assert.equal(creditAdjustment(b),null);
});
test('public settings accept optional HTTPS links, discard secret-shaped extras and reject active URLs',()=>{
 const b={name:'Studio',phone:'+8801700000000',welcome:'Hello',supportEmail:'help@example.com',supportGroupUrl:'https://chat.whatsapp.com/example',appDownloadUrl:'https://example.com/app.apk',OPENAI_API_KEY:'should-not-escape'};
 const clean=validateBrand(b);assert(clean);assert.equal(clean.OPENAI_API_KEY,undefined);assert.equal(clean.privacyUrl,'');
 for(const u of ['javascript:alert(1)','http://example.com','https://user:password@example.com','data:text/html,test','https://exam\nple.com']){assert(!publicHttpsUrl(u));assert.equal(validateBrand({...b,termsUrl:u}),null)}
 assert.equal(validateBrand({...b,supportEmail:'bad-address'}),null);assert.equal(publicBrand(null).name,'MT studio');
});

// Execute the real route with isolated Auth/Firestore adapters, without production credentials.
class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
let actor,records,authLookups;
const ref=(collection,id)=>({collection,id,get:async()=>snapshot(collection,id)});
const snapshot=(c,id)=>({exists:records.has(c+'/'+id),data:()=>records.get(c+'/'+id)});
const db={collection:c=>({doc:id=>ref(c,id)}),runTransaction:async callback=>{
 const writes=[];
 const result=await callback({get:async r=>snapshot(r.collection,r.id),update:(r,d)=>writes.push(['update',r,d]),create:(r,d)=>writes.push(['create',r,d])});
 for(const [kind,r] of writes)if(kind==='create'&&records.has(r.collection+'/'+r.id))throw new Error('duplicate create');
 for(const [kind,r,d] of writes){const key=r.collection+'/'+r.id;records.set(key,kind==='update'?{...records.get(key),...d}:d)}return result;
}};
globalThis.__mtAdminTest={
 account:async()=>{if(!actor)throw new HttpError(401,'login');return actor},database:()=>db,bucket:()=>({getMetadata:async()=>[]}),
 failure:e=>Response.json({error:e.message},{status:e.status||500}),HttpError,
 checkWriteRequest:req=>{if(req.headers.get('origin')!=='https://studio.example')throw new HttpError(403,'origin')},
 adminAuth:()=>({getUser:async uid=>{authLookups++;return {uid,email:'customer@example.com',disabled:false,emailVerified:true}}})
};
const source=await readFile(new URL('../app/api/admin/route.ts',import.meta.url),'utf8');
const imports=source.replace(/import \{([^}]+)\} from '@\/lib\/server';/, 'const {$1}=globalThis.__mtAdminTest;').replace(/import \{adminAuth\} from '@\/lib\/firebase-admin';/, 'const {adminAuth}=globalThis.__mtAdminTest;').replace("'@/lib/admin-input'",JSON.stringify(new URL('../lib/admin-input.ts',import.meta.url).href));
const js=ts.transpileModule(imports,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const route=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
function reset(){actor={admin:true,userId:'owner'};records=new Map([['users/customer-123',{credits:10}]]);authLookups=0}
function request(body=valid,origin='https://studio.example'){return new Request('https://studio.example/api/admin',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)})}
test('admin route rejects missing login, non-admin users and hostile write origins before customer access',async()=>{
 reset();actor=null;assert.equal((await route.POST(request())).status,401);
 actor={admin:false,userId:'other'};assert.equal((await route.POST(request())).status,403);assert.equal((await route.GET(new Request('https://studio.example/api/admin'))).status,403);
 actor={admin:true,userId:'owner'};assert.equal((await route.POST(request(valid,'https://evil.example'))).status,403);assert.equal(authLookups,0);
});
test('credit update and both audit entries commit together; replay does not reapply after later spending',async()=>{
 reset();const first=await route.POST(request());assert.equal(first.status,200);assert.equal(records.get('users/customer-123').credits,25);assert.equal(records.size,3);
 assert.equal(records.get('adminAudit/'+valid.requestId).actor,'owner');assert.equal(records.get('records/admin-credit-'+valid.requestId).owner,'customer-123');
 records.set('users/customer-123',{credits:23});const replay=await route.POST(request());assert.equal(replay.status,200);assert.equal((await replay.json()).replayed,true);assert.equal(records.get('users/customer-123').credits,23);assert.equal(records.size,3);
});
test('stale balance and reused id with different payload cannot overwrite or duplicate credits',async()=>{
 reset();records.set('users/customer-123',{credits:8});assert.equal((await route.POST(request())).status,409);assert.equal(records.size,1);assert.equal(records.get('users/customer-123').credits,8);
 reset();await route.POST(request());assert.equal((await route.POST(request({...valid,credits:999}))).status,409);assert.equal(records.get('users/customer-123').credits,25);assert.equal(records.size,3);
});

test('studio contact defaults preserve separate Bangladesh phone and US WhatsApp',()=>{
 const b=publicBrand({name:'MT studio',phone:'',welcome:'Welcome'});
 assert.equal(b.phone,'01311128584');assert.equal(b.whatsappPhone,'+19174199814');assert.equal(b.supportEmail,'studiomt46@gmail.com');assert.equal(b.address,'Noakhali, Bangladesh');
 assert.equal(validateBrand({...b,whatsappPhone:'01311128584'}),null);
 assert.equal(validateBrand({...b,address:'x'.repeat(301)}),null);
 assert.equal(publicBrand({...b,whatsappPhone:''}).whatsappPhone,'');
});

test('social links preserve supplied destinations, inherit into old settings and may be hidden',()=>{
 const b=publicBrand({name:'MT studio',phone:'01311128584',welcome:'Welcome'});
 assert.equal(b.instagramUrl,'https://www.instagram.com/mt_studio_ai?rpxt=NTN2MHhmcmV4dWpv&utm_source=qr');
 assert.equal(b.threadsUrl,'https://www.threads.com/@mt_studio_ai?igshid=NTc4MTIwNjQ2YQ==');
 assert.equal(b.facebookUrl,'https://www.facebook.com/share/1KH6Mmw91t/?mibextid=wwXIfr');
 assert.equal(b.youtubeUrl,'https://www.youtube.com/@mt_studio_ai46');
 for(const k of ['instagramUrl','threadsUrl','facebookUrl','youtubeUrl']){assert.equal(validateBrand({...b,[k]:'javascript:alert(1)'}),null);assert.equal(validateBrand({...b,[k]:''})[k],'')}
});
