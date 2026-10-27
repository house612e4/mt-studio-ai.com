import test from 'node:test';
import assert from 'node:assert/strict';
import {readApiJson} from '../lib/api-response.ts';
import {documentInput} from '../lib/document-input.ts';
test('successful API response preserves data',async()=>{assert.deepEqual(await readApiJson(Response.json({id:'saved'})),{id:'saved'})});
test('HTML/empty failures become readable HTTP messages instead of JSON parser exceptions',async()=>{for(const body of ['','<html>Internal Server Error</html>'])await assert.rejects(()=>readApiJson(new Response(body,{status:500})),/HTTP 500/);await assert.rejects(()=>readApiJson(new Response('',{status:401})),/লগইন/)});
test('API error and malformed payload are rejected',async()=>{await assert.rejects(()=>readApiJson(Response.json({error:'Insufficient credit'},{status:402})),/Insufficient credit/);for(const value of [null,[],42])await assert.rejects(()=>readApiJson(Response.json(value)),/সঠিক নয়/)});
test('AI document validation rejects missing/oversized inputs and unsupported language',()=>{const valid={title:'  Application  ',instructions:'Please write a leave application.',language:'বাংলা'};assert.equal(documentInput(valid).title,'Application');for(const input of [null,[],{}, {...valid,title:' '},{...valid,title:'x'.repeat(201)},{...valid,instructions:'short'},{...valid,instructions:'x'.repeat(6001)},{...valid,language:'unknown'}])assert.equal(documentInput(input),null)});

import {creditPackage,creditPackages} from '../lib/credit-packages.ts';
test('supplied package totals include bonus once and retain exact prices',()=>{
 assert.deepEqual(creditPackages.map(p=>[p.priceBDT,p.totalCredits,p.bonusCredits]),[[20,20,0],[50,50,0],[99,100,1],[299,305,6],[449,515,16],[999,1050,51],[1999,2200,201]]);
 assert.equal(creditPackage('standard').totalCredits,100);assert.equal(creditPackage('unknown'),undefined);assert.equal(creditPackage({id:'business'}),undefined);
});
