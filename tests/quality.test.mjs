import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {workspaceViews,workspaceHref,workspaceView,viewFromLocation,loginDestination} from '../lib/workspace-navigation.ts';
import {isStudioAdmin} from '../lib/admin-access.ts';
import {imageFileError,inferredImageType} from '../lib/image-input.ts';
import {providerMessage} from '../lib/provider-errors.ts';
test('workspace URLs survive refresh/back and refuse arbitrary or external login redirects',()=>{
 for(const view of workspaceViews){const url=new URL(workspaceHref(view),'https://studio.example');assert.equal(viewFromLocation(url.pathname,url.search),view);assert.equal(loginDestination(url.pathname+url.search),url.pathname+url.search)}
 for(const value of ['//evil.example','https://evil.example/workspace','/api/admin','/workspace/../../admin','/workspace?view=invalid',undefined])assert.equal(loginDestination(value),'/workspace');
 assert.equal(workspaceView('<script>'),'dashboard');
});
test('admin access has no default UID and never treats substring or blank config as authorization',()=>{
 assert.equal(isStudioAdmin('owner',undefined),false);assert.equal(isStudioAdmin('',' '),false);assert.equal(isStudioAdmin('owner',' owner\n'),true);assert.equal(isStudioAdmin('owner-2','owner'),false);
});
test('image inputs reject empty, unsupported, HEIC and oversized files before paid processing',()=>{
 const file={name:'photo.jpg',type:'image/jpeg',size:300};assert.equal(imageFileError(file),'');assert.equal(imageFileError({...file,type:''}),'');
 for(const f of [{...file,size:0},{...file,size:10*1024*1024+1},{...file,name:'photo.heic',type:'image/heic'},{...file,name:'file.svg',type:'image/svg+xml'}])assert(imageFileError(f));
 assert.equal(inferredImageType('photo.PNG'),'image/png');assert.equal(inferredImageType('photo.webp'),'image/webp');
});
test('provider failures distinguish authorization, quota, throttling and moderation without reflecting raw provider content',()=>{
 assert.match(providerMessage(401,null),/key/);assert.match(providerMessage(429,'insufficient_quota'),/ব্যালেন্স/);assert.match(providerMessage(429,null),/অনুরোধের সীমা/);assert.match(providerMessage(400,'moderation_blocked'),/গ্রহণ করেনি/);assert(!providerMessage(500,'sk-secret').includes('sk-secret'));
});
class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
let records;
const snapshot=r=>({exists:records.has(r.key),data:()=>records.get(r.key)});
const db={collection:c=>({doc:id=>({id,key:c+'/'+id})}),runTransaction:async f=>{const writes=[];const result=await f({get:async r=>snapshot(r),update:(r,d)=>writes.push([r,d,true]),create:(r,d)=>writes.push([r,d,false]),set:(r,d)=>writes.push([r,d,false])});for(const[r,d,merge]of writes)records.set(r.key,merge?{...records.get(r.key),...d}:d);return result}};
globalThis.__quality={database:()=>db,HttpError};
const source=(await readFile(new URL('../lib/ai-request.ts',import.meta.url),'utf8')).replace("import 'server-only';",'').replace("import {database,HttpError} from './server';",'const {database,HttpError}=globalThis.__quality;');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {claimAi}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const id='00000000-0000-4000-8000-000000000001';
function reset(){records=new Map([['users/owner',{credits:10}],['users/other',{credits:10}]])}
test('AI replay returns the completed result without a second debit; a processing retry cannot refund or repeat the first call',async()=>{
 reset();const first=await claimAi('owner',id,'ai',{image:'file',prompt:'portrait'});assert.equal(records.get('users/owner').credits,8);
 await assert.rejects(()=>claimAi('owner',id,'ai',{image:'file',prompt:'portrait'}),e=>e.status===409);assert.equal(records.get('users/owner').credits,8);
 records.set(first.job.key,{...records.get(first.job.key),status:'completed',resultId:'image-result'});
 const repeat=await claimAi('owner',id,'ai',{image:'file',prompt:'portrait'});assert.equal(repeat.resultId,'image-result');assert.equal(records.get('users/owner').credits,8);
});
test('AI attempt fingerprints bind input and owner; refunded attempts retry with a new atomic reservation',async()=>{
 reset();const a=await claimAi('owner',id,'document',{text:'a'});
 await assert.rejects(()=>claimAi('owner',id,'document',{text:'b'}),e=>e.status===409);
 const other=await claimAi('other',id,'document',{text:'a'});assert.notEqual(a.job.id,other.job.id);
 records.set(a.job.key,{...records.get(a.job.key),status:'refunded'});records.set('users/owner',{credits:10});await claimAi('owner',id,'document',{text:'a'});assert.equal(records.get('users/owner').credits,8);
 await assert.rejects(()=>claimAi('owner','bad-id','ai',{}),e=>e.status===400);
});
test('insufficient or malformed balances create no reservation and change no money',async()=>{
 for(const credits of [0,1,-1,NaN,'10']){reset();records.set('users/owner',{credits});await assert.rejects(()=>claimAi('owner',id,'ai',{}),e=>e.status===402);assert.equal(records.size,2);assert.equal(records.get('users/owner').credits,credits)}
});
import {invoiceSummary,moneyMinor,localDateValue} from '../lib/business-input.ts';
import {validRecord} from '../lib/workspace-input.ts';
test('invoice math uses minor currency units and exposes overpayment as advance instead of negative dues',()=>{
 const summary=invoiceSummary({items:'Photo | 3 | 0.10\nPrint | 2 | 0.20',paid:'1.00'});assert(summary);assert.equal(summary.totalMinor,70);assert.equal(summary.dueMinor,0);assert.equal(summary.advanceMinor,30);
 for(const data of [{items:' '},{items:'Photo | 0 | 5'},{items:'Photo | 1 |'},{items:'Photo | 1 | 5',paid:'NaN'},{items:'Photo | 1 | 5',paid:'Infinity'},{items:'Photo | 1 | 5 | extra'}])assert.equal(invoiceSummary(data),null);
 assert.equal(moneyMinor('0.10'),10);assert.equal(moneyMinor('1e3'),null);assert.equal(moneyMinor(''),null);assert.equal(validRecord('invoice','Bill',{items:' ',paid:0}),false);assert.equal(validRecord('credit-request','forged',{credits:1}),false);assert.equal(validRecord('transaction','sale',{type:'income',amount:'',name:'sale'}),false);assert.equal(localDateValue(new Date(2026,9,25,0,30)),'2026-10-25');
});
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
globalThis.__qualityReact=React;
let pageActor,renderedStudio,pageBrandReads=0;
globalThis.__pageAuth={requireUser:async next=>{if(!pageActor)throw new Error('LOGIN:'+next);return pageActor},isStudioAdmin,database:()=>({collection:()=>({doc:()=>({get:async()=>{pageBrandReads++;return {data:()=>({name:'Test studio'})}}})})}),AdminShell:props=>{renderedStudio=props;return React.createElement('main',null,'ADMIN SHELL')}};
const pageSource=(await readFile(new URL('../app/admin/page.tsx',import.meta.url),'utf8')).replace("import AdminShell from './admin-shell';",'const {AdminShell}=globalThis.__pageAuth;').replace("import {database} from '@/lib/firebase-admin';",'const {database}=globalThis.__pageAuth;').replace("'@/lib/studio-settings'",JSON.stringify(new URL('../lib/studio-settings.ts',import.meta.url).href)).replace("import {requireUser} from '@/lib/firebase-session';",'const {requireUser}=globalThis.__pageAuth;').replace("import {isStudioAdmin} from '@/lib/admin-access';",'const {isStudioAdmin}=globalThis.__pageAuth;');
const pageJs=ts.transpileModule('const React=globalThis.__qualityReact;\n'+pageSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
const adminPage=(await import('data:text/javascript;base64,'+Buffer.from(pageJs).toString('base64'))).default;
test('direct admin page redirects signed-out users, refuses ordinary accounts and opens admin view only for exact owner',async()=>{
 const previous=process.env.ADMIN_UID;process.env.ADMIN_UID='owner';renderedStudio=null;pageActor=null;await assert.rejects(()=>adminPage(),/LOGIN:\/admin/);
 pageActor={userId:'customer',email:'customer@example.test',displayName:'Customer'};const denied=renderToStaticMarkup(await adminPage());assert.match(denied,/অ্যাডমিন অনুমতি প্রয়োজন/);assert.equal(renderedStudio,null);assert.equal(pageBrandReads,0);
 pageActor={userId:'owner',email:'owner@example.test',displayName:'Owner'};assert.match(renderToStaticMarkup(await adminPage()),/ADMIN SHELL/);assert.equal(renderedStudio.expectedUid,'owner');assert.equal(renderedStudio.initialBrand.name,'Test studio');assert.equal(pageBrandReads,1);if(previous===undefined)delete process.env.ADMIN_UID;else process.env.ADMIN_UID=previous;
});
