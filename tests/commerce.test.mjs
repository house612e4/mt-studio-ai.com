import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {competitionInput,remainingTime,rankEntries,automaticScores} from '../lib/competitions.ts';
import {loginDestination} from '../lib/workspace-navigation.ts';
const cid='00000000-0000-4000-8000-000000000001',pid='00000000-0000-4000-8000-000000000002';
const event={title:'MT Competition',description:'A competition with real verified entries.',rules:'Verified proof required, earlier join wins ties.',prize:'Awarded by organizer.',startsAt:'2020-01-01T00:00:00Z',endsAt:'2099-01-01T00:00:00Z',status:'published',tasks:[{id:'creative',title:'Create a design',description:'Submit a public link or description.',points:25,url:'https://example.com',kind:'proof'},{id:'purchase',title:'Purchase credits',description:'Approved payment order.',points:40,url:'',kind:'purchase'}],prizes:[{rank:1,title:'Organizer prize',detail:'Delivery described in rules.'}]};
test('competition input rejects malformed dates, repeated tasks, unsafe links, review incentives and invalid points',()=>{
 assert.ok(competitionInput(event));
 for(const changes of [{endsAt:'invalid'},{tasks:[{...event.tasks[0],url:'javascript:alert(1)'}]},{tasks:[event.tasks[0],event.tasks[0]]},{tasks:[{...event.tasks[0],points:-1}]},{tasks:[{...event.tasks[0],title:'Give Google review'}]},{prizes:[]}])assert.equal(competitionInput({...event,...changes}),null);
 assert.deepEqual(remainingTime('2026-01-01T00:00:00Z',Date.parse('2026-01-02')), {days:0,hours:0,minutes:0,seconds:0});
 assert.deepEqual(rankEntries([{id:'b',points:10,joined:'2026-02-01'},{id:'a',points:10,joined:'2026-01-01'},{id:'c',points:11,joined:'2026-03-01'}]).map(x=>x.id),['c','a','b']);
});
test('sign-in returns to public commerce routes but rejects external redirects',()=>{assert.equal(loginDestination('/credits'),'/credits');assert.equal(loginDestination('/contest'),'/contest');assert.equal(loginDestination('https://evil.example/contest'),'/workspace')});
class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
let actor,rows;
const snap=(c,id)=>({id,exists:rows.has(c+'/'+id),data:()=>rows.get(c+'/'+id)});
const ref=(c,id)=>({c,id,get:async()=>snap(c,id)});
function collection(c,filters=[],limit=Infinity,sort=[],after=null){return {c,filters,limitValue:limit,sort,after,doc:id=>ref(c,id),where:(k,op,v)=>collection(c,[...filters,[k,op,v]],limit,sort,after),orderBy:(k,direction='asc')=>collection(c,filters,limit,[...sort,[k,direction]],after),startAfter:cursor=>collection(c,filters,limit,sort,cursor),limit:n=>collection(c,filters,n,sort,after),get:async()=>query(c,filters,limit,sort,after)}}
function query(c,filters,limit,sort=[],after=null){let docs=[...rows.keys()].filter(k=>k.startsWith(c+'/')).map(k=>snap(c,k.slice(c.length+1))).filter(d=>filters.every(([k,op,v])=>op==='>='?d.data()[k]>=v:op==='<='?d.data()[k]<=v:d.data()[k]===v));if(sort.length)docs.sort((a,b)=>{for(const[k,direction] of sort){const av=k==='__name__'?a.id:a.data()[k],bv=k==='__name__'?b.id:b.data()[k],result=String(av).localeCompare(String(bv));if(result)return direction==='desc'?-result:result}return 0});if(after)docs=docs.slice(docs.findIndex(d=>d.id===after.id)+1);docs=docs.slice(0,limit);return {docs,size:docs.length}}
const db={collection:c=>collection(c),runTransaction:async fn=>{const writes=[];const result=await fn({get:async r=>r.id?snap(r.c,r.id):query(r.c,r.filters,r.limitValue,r.sort,r.after),set:(r,d)=>writes.push(['set',r,d]),create:(r,d)=>writes.push(['create',r,d]),update:(r,d)=>writes.push(['update',r,d])});for(const[k,r]of writes)if(k==='create'&&rows.has(r.c+'/'+r.id))throw Error('duplicate');for(const[k,r,d]of writes)rows.set(r.c+'/'+r.id,k==='update'?{...rows.get(r.c+'/'+r.id),...d}:d);return result}};
globalThis.__commerce={account:async()=>{if(!actor)throw new HttpError(401,'login');return actor},database:()=>db,checkWriteRequest:r=>{if(r.headers.get('origin')!=='https://studio.example')throw new HttpError(403,'origin')},failure:e=>Response.json({error:e.message},{status:e.status||500}),HttpError,currentUser:async()=>actor,isStudioAdmin:()=>!!actor?.admin,requireRecentAdmin:a=>{if(!a.admin)throw new HttpError(403,'admin')},enforceRateLimit:async()=>{}};
async function load(path){let source=await readFile(new URL(path,import.meta.url),'utf8');source=source.replace(/import \{([^}]+)\} from '@\/lib\/server';/, 'const {$1}=globalThis.__commerce;').replace(/import \{currentUser\} from '@\/lib\/firebase-session';/,'const {currentUser}=globalThis.__commerce;').replace(/import \{isStudioAdmin\} from '@\/lib\/admin-access';/,'const {isStudioAdmin}=globalThis.__commerce;');for(const name of ['credit-packages','manual-payments','payment-validation','competitions','site-content'])source=source.replace("'@/lib/"+name+"'",JSON.stringify(new URL('../lib/'+name+'.ts',import.meta.url).href));return import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'))}
const manual=await load('../app/api/payments/manual/route.ts'),competitions=await load('../app/api/competitions/route.ts');
function post(route,body,origin='https://studio.example'){return route.POST(new Request('https://studio.example/api/test',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}))}
function reset(){actor={userId:'alice',email:'alice@example.com',admin:false};rows=new Map([['users/alice',{credits:10}],['users/bob',{credits:0}],['settings/policies',{terms:'Terms '.repeat(20),privacy:'Privacy '.repeat(20),refund:'Refund '.repeat(20)}],['competitions/'+cid,{...event,entryCount:0,created:'2026-01-01'}]])}
const pay={requestId:pid,packageId:'standard',method:'bkash',sender:'01711111111',trxId:'AB12345678',accepted:true};
test('manual payment uses server package price and replay does not duplicate approval or credit',async()=>{
 reset();assert.equal((await post(manual,{...pay,priceBDT:1,totalCredits:999999})).status,200);assert.equal(rows.get('manualPayments/'+pid).priceBDT,99);assert.equal(rows.get('manualPayments/'+pid).totalCredits,100);assert.equal(rows.get('users/alice').credits,10);
 assert.equal((await post(manual,pay)).status,200);actor.admin=true;const approve={action:'approve',id:pid,reason:'Receipt checked in wallet'};assert.equal((await post(manual,approve)).status,200);assert.equal(rows.get('users/alice').credits,110);assert.equal((await post(manual,approve)).status,200);assert.equal(rows.get('users/alice').credits,110);
 actor.admin=false;const id='00000000-0000-4000-8000-000000000003';assert.equal((await post(manual,{...pay,requestId:id})).status,200);actor.admin=true;assert.equal((await post(manual,{...approve,id})).status,409);assert.equal(rows.get('users/alice').credits,110);
});
test('manual payment denies guests, cross-site writes, unauthorized approvals and invalid submissions',async()=>{
 reset();actor=null;assert.equal((await post(manual,pay)).status,401);reset();assert.equal((await post(manual,pay,'https://evil.example')).status,403);assert.equal((await post(manual,{...pay,accepted:false})).status,400);assert.equal((await post(manual,{action:'approve',id:pid,reason:'invalid permission'})).status,403);
 await post(manual,pay);actor.admin=true;assert.equal((await post(manual,{action:'reject',id:pid,reason:'Transfer was not received'})).status,200);assert.equal(rows.get('users/alice').credits,10);assert.equal((await post(manual,{action:'approve',id:pid,reason:'Already rejected'})).status,409);
});
test('manual payment history returns only the current customer records',async()=>{
 reset();await post(manual,pay);actor={userId:'bob',email:'bob@example.com',admin:false};const j=await (await manual.GET(new Request('https://studio.example/api/payments/manual'))).json();assert.equal(j.orders.length,0);assert.equal(j.balance,0);
});
test('competition is public while private claims remain private and each join increments once',async()=>{
 reset();actor=null;const listing=await competitions.GET(new Request('https://studio.example/api/competitions'));assert.equal(listing.status,200);assert.equal((await listing.json()).competitions.length,1);assert.equal((await post(competitions,{action:'join',id:cid,publicName:'Alice',accepted:true})).status,401);
 reset();assert.equal((await post(competitions,{action:'join',id:cid,publicName:'Alice',accepted:true})).status,200);await post(competitions,{action:'join',id:cid,publicName:'Alice',accepted:true});assert.equal(rows.get('competitions/'+cid).entryCount,1);
 actor.admin=true;assert.equal((await post(competitions,{action:'save',id:cid,data:event})).status,409);
});
test('proof points require admin verification and approval is idempotent; paid claims require own approved receipt',async()=>{
 reset();await post(competitions,{action:'join',id:cid,publicName:'Alice',accepted:true});await post(competitions,{action:'claim',id:cid,taskId:'creative',proof:'https://example.com/my-work'});const claim=[...rows.entries()].find(([k])=>k.startsWith('competitionClaims/'));const eid=claim[1].entryId;assert.equal(rows.get('competitionEntries/'+eid).points,0);
 const decision={action:'review',id:cid,claimId:claim[0].split('/')[1],decision:'approved',reason:'Design verified by organizer'};assert.equal((await post(competitions,decision)).status,403);actor.admin=true;assert.equal((await post(competitions,decision)).status,200);await post(competitions,decision);assert.equal(rows.get('competitionEntries/'+eid).points,25);
 actor.admin=false;assert.equal((await post(competitions,{action:'claim',id:cid,taskId:'purchase',proof:pid})).status,409);rows.set('manualPayments/'+pid,{owner:'bob',status:'approved',created:'2026-01-01'});assert.equal((await post(competitions,{action:'claim',id:cid,taskId:'purchase',proof:pid})).status,409);rows.set('manualPayments/'+pid,{owner:'alice',status:'approved',created:'2026-01-01'});assert.equal((await post(competitions,{action:'claim',id:cid,taskId:'purchase',proof:pid})).status,200);await post(competitions,{action:'claim',id:cid,taskId:'purchase',proof:pid});assert.equal(rows.get('competitionEntries/'+eid).points,65);assert.equal(rows.get('users/alice').credits,10);
 actor={userId:'bob',admin:false};const j=await (await competitions.GET(new Request('https://studio.example/api/competitions?id='+cid))).json();assert.equal(j.claims.length,0);assert.equal(j.pending.length,0);assert(!JSON.stringify(j.leaderboard).includes('proof'));
});
test('finalization waits for deadline and pending verification then freezes points and publishes real winners',async()=>{
 reset();await post(competitions,{action:'join',id:cid,publicName:'Alice',accepted:true});await post(competitions,{action:'claim',id:cid,taskId:'creative',proof:'https://example.com/my-work'});actor.admin=true;assert.equal((await post(competitions,{action:'finalize',id:cid})).status,409);rows.get('competitions/'+cid).endsAt='2021-01-01';assert.equal((await post(competitions,{action:'finalize',id:cid})).status,409);const claim=[...rows.entries()].find(([k])=>k.startsWith('competitionClaims/'));await post(competitions,{action:'review',id:cid,claimId:claim[0].split('/')[1],decision:'approved',reason:'Verified before final result'});assert.equal((await post(competitions,{action:'finalize',id:cid})).status,200);assert.equal(rows.get('competitions/'+cid).winners[0].publicName,'Alice');assert.equal((await post(competitions,{action:'review',id:cid,claimId:claim[0].split('/')[1],decision:'rejected',reason:'Cannot alter final result'})).status,409);
});

test('automatic scores use only own successful spend, approved payments and valid referral records within the joined campaign window',()=>{
 const tasks=[{id:'spend',kind:'credit-spend',points:1},{id:'paid',kind:'purchase-total',points:0.1},{id:'ref',kind:'referral',points:5}];
 const campaign={startsAt:'2026-01-01',endsAt:'2026-02-01',tasks};
 const entries=[{id:'e1',owner:'alice',publicName:'Alice',points:7,joined:'2026-01-10'}];
 const records=[{owner:'alice',created:'2026-01-11',kind:'credit-use',data:'{"amount":2}'},{owner:'alice',created:'2026-01-09',kind:'credit-use',data:'{"amount":2}'},{owner:'bob',created:'2026-01-11',kind:'credit-use',data:'{"amount":2}'}];
 const payments=[{owner:'alice',created:'2026-01-12',status:'approved',priceBDT:99},{owner:'alice',created:'2026-01-12',status:'pending',priceBDT:999}];
 const referrals=[{entryId:'e1',created:'2026-01-11'},{entryId:'other',created:'2026-01-11'}];
 const score=automaticScores(campaign,entries,records,payments,referrals)[0];assert.equal(score.points,23);assert.deepEqual(score.automatic,{spend:2,paid:9,ref:5});
});
test('payment requests are blocked when required policies have not been published',async()=>{reset();rows.delete('settings/policies');assert.equal((await post(manual,pay)).status,503);assert(!rows.has('manualPayments/'+pid))});
let authIdentity;
globalThis.__commerceSession={adminAuth:()=>({verifyIdToken:async()=>authIdentity,createSessionCookie:async()=> 'test-session'}),database:()=>db,cookies:async()=>({set:()=>{}})};
let sessionSource=await readFile(new URL('../app/api/auth/session/route.ts',import.meta.url),'utf8');
sessionSource=sessionSource.replace("import {cookies} from 'next/headers';",'const {cookies}=globalThis.__commerceSession;').replace("import {adminAuth,database} from '@/lib/firebase-admin';",'const {adminAuth,database}=globalThis.__commerceSession;').replace("import {checkWriteRequest,failure,HttpError} from '@/lib/server';",'const {checkWriteRequest,failure,HttpError}=globalThis.__commerce;').replace("import {sessionCookieName} from '@/lib/firebase-session';","const sessionCookieName='__Host-mt_session';").replace("'@/lib/profile'",JSON.stringify(new URL('../lib/profile.ts',import.meta.url).href));
const sessionRoute=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(sessionSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
test('referrals count only new verified accounts, preserve inviter and do not count existing accounts twice',async()=>{
 reset();await post(competitions,{action:'join',id:cid,publicName:'Alice',accepted:true});const entry=[...rows.entries()].find(([k])=>k.startsWith('competitionEntries/'))[0].split('/')[1];
 authIdentity={uid:'new-user',email:'new@example.com',name:'New user',email_verified:true,auth_time:Date.now()/1000};
 const body={idToken:'valid-test-id',competitionReferral:{entryId:entry}};
 assert.equal((await post(sessionRoute,body)).status,200);assert.equal(rows.get('competitionReferrals/new-user').entryId,entry);
 assert.equal((await post(sessionRoute,body)).status,200);assert.equal([...rows.keys()].filter(k=>k.startsWith('competitionReferrals/')).length,1);
 authIdentity={...authIdentity,uid:'alice',email:'alice@example.com'};assert.equal((await post(sessionRoute,body)).status,200);assert(!rows.has('competitionReferrals/alice'));
 authIdentity={...authIdentity,uid:'unverified',email_verified:false};assert.equal((await post(sessionRoute,body)).status,403);assert(!rows.has('competitionReferrals/unverified'));
});

test('payment queue filters pending orders across pages, caps page size and rejects foreign cursors',async()=>{
 reset();
 const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 for(let n=1;n<=65;n++)rows.set('manualPayments/'+id(n),{owner:n%2?'alice':'bob',status:n%5?'pending':'approved',created:new Date(Date.UTC(2026,0,1,0,n)).toISOString(),trxId:'TX'+n});
 const get=path=>manual.GET(new Request('https://studio.example/api/payments/manual?'+path));
 assert.equal((await get('scope=all')).status,403);
 actor.admin=true;
 const first=await (await get('scope=all&status=pending&limit=30')).json();
 assert.equal(first.orders.length,30);assert(first.next);assert(first.orders.every(o=>o.status==='pending'));
 const second=await (await get('scope=all&status=pending&limit=30&after='+first.next)).json();
 assert.equal(second.orders.length,22);assert.equal(second.next,null);assert.equal(new Set([...first.orders,...second.orders].map(o=>o.id)).size,52);
 const capped=await (await get('scope=all&limit=100000')).json();assert.equal(capped.orders.length,50);assert(capped.next);
 const missing=await get('scope=all&after='+id(999));assert.equal(missing.status,404);
 actor.admin=false;
 const own=await (await get('limit=3')).json();assert.equal(own.orders.length,3);assert(own.orders.every(o=>o.owner==='alice'));assert(own.next);
 assert.equal((await get('after='+id(2))).status,404);
 assert.equal((await get('status=invalid')).status,400);
});

test('rejected payments may be reopened and approved once, but approved payments cannot reopen',async()=>{
 reset();await post(manual,pay);actor.admin=true;
 const reject={action:'reject',id:pid,reason:'Transfer was not received'};
 assert.equal((await post(manual,reject)).status,200);assert.equal(rows.get('users/alice').credits,10);
 const reopen={action:'reopen',id:pid,reason:'Customer corrected the receipt'};
 assert.equal((await post(manual,reopen)).status,200);assert.equal(rows.get('manualPayments/'+pid).status,'pending');
 assert.equal((await post(manual,reopen)).status,200);assert.equal(rows.get('users/alice').credits,10);
 const approve={action:'approve',id:pid,reason:'Wallet receipt verified'};
 assert.equal((await post(manual,approve)).status,200);assert.equal(rows.get('users/alice').credits,110);
 assert.equal((await post(manual,approve)).status,200);assert.equal(rows.get('users/alice').credits,110);
 assert.equal((await post(manual,reopen)).status,409);
 actor.admin=false;assert.equal((await post(manual,reopen)).status,403);
});
