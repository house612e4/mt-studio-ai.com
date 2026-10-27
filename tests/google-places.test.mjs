import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=(await readFile(new URL('../lib/google-places.ts',import.meta.url),'utf8')).replace("import 'server-only';",'');
const moduleSource=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {fetchGooglePlace}=await import('data:text/javascript;base64,'+Buffer.from(moduleSource).toString('base64'));
test('Places validates configuration before calling the network',async()=>{
 const original=globalThis.fetch;let called=false;globalThis.fetch=async()=>{called=true;throw Error('unexpected')};
 try{await assert.rejects(()=>fetchGooglePlace('../bad','secret'),e=>e.code==='INVALID_PLACE_ID');await assert.rejects(()=>fetchGooglePlace('ChIJ_valid',''),e=>e.code==='KEY_MISSING');assert.equal(called,false)}finally{globalThis.fetch=original}
});
test('Places connection test uses fresh real request, field mask, timeout and preserves valid data',async()=>{
 const original=globalThis.fetch;let request;globalThis.fetch=async(url,options)=>{request={url,options};return Response.json({id:'ChIJ_valid',displayName:{text:'MT Studio'},rating:4.8,userRatingCount:12})};
 try{const result=await fetchGooglePlace('ChIJ_valid','test-key',{fresh:true});assert.equal(result.rating,4.8);assert.match(request.url,/places.googleapis.com\/v1\/places\/ChIJ_valid/);assert.equal(request.options.cache,'no-store');assert(request.options.signal instanceof AbortSignal);assert.match(request.options.headers['X-Goog-FieldMask'],/rating/);assert(!request.options.headers['X-Goog-FieldMask'].includes('reviews'))}finally{globalThis.fetch=original}
});
test('Places failures expose bounded status codes and never leak provider message or API key',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({error:{status:'PERMISSION_DENIED',message:'raw provider text and secret'}},{status:403});
 try{await assert.rejects(()=>fetchGooglePlace('ChIJ_valid','secret',{fresh:true}),e=>e.status===403&&e.code==='PERMISSION_DENIED'&&!e.message.includes('secret'));globalThis.fetch=async()=>Response.json({rating:5});await assert.rejects(()=>fetchGooglePlace('ChIJ_valid','secret'),e=>e.code==='INVALID_RESPONSE')}finally{globalThis.fetch=original}
});
