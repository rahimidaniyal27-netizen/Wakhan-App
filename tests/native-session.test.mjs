import test from 'node:test';
import assert from 'node:assert/strict';
import {SessionBroker} from '../src/session.mjs';
const key='wka1.'+'a'.repeat(24)+'.'+'b'.repeat(32);
function setup(fetch){const data=new Map();const broker=new SessionBroker({origin:'https://app.test',fetch,store:{get:async k=>data.get(k)||null,set:async(k,v)=>data.set(k,v),remove:async k=>data.delete(k)}});broker.session={key,user:{id:8878966292}};return {broker,data}}
test('public alias persists without changing the private account id',async()=>{
 const {broker,data}=setup(async()=>Response.json({ok:true,uid:8878966292,name:'Owner',public_id:77777777}));
 await broker.me();const saved=JSON.parse(data.get('session'));assert.equal(saved.user.id,8878966292);assert.equal(saved.user.public_id,77777777);
});
test('native credential goes only to own API, including Request inputs',async()=>{
 const seen=[];const {broker}=setup(async(input,init)=>{seen.push(new Request(input,init));return Response.json({ok:true})});
 await broker.fetch(new Request('https://app.test/api/community/me'));
 await broker.fetch(new Request('https://foreign.test/media',{headers:{'X-Init':key}}));
 assert.equal(seen[0].headers.get('X-Init'),key);assert.equal(seen[0].redirect,'error');assert.equal(seen[1].headers.get('X-Init'),null);
});
test('a failed coin mutation is never sent a second time',async()=>{
 let count=0;const {broker}=setup(async()=>{count++;throw new TypeError('offline')});
 await assert.rejects(broker.fetch('/api/wallet',{method:'POST',body:'{"a":"transfer"}'}));assert.equal(count,1);
});
test('a transient GET can recover once; mutations with HTTP 503 never retry',async()=>{
 let count=0;const {broker}=setup(async()=>++count===1?new Response('',{status:503}):Response.json({ok:true}));
 assert.equal((await broker.fetch('/api/me')).status,200);assert.equal(count,2);
 count=0;assert.equal((await broker.fetch('/api/wallet',{method:'POST'})).status,503);assert.equal(count,1);
});
test('a caller abort on a Request cancels the fetch and is never retried',async()=>{
 let count=0;const {broker}=setup((input,init)=>{count++;return new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true}))});
 const parent=new AbortController();const response=broker.fetch(new Request('https://app.test/api/me',{signal:parent.signal}));parent.abort();await assert.rejects(response,{name:'AbortError'});assert.equal(count,1);
});
test('a timed out request cancels work instead of remaining busy forever',async()=>{
 const {broker}=setup((input,init)=>new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('timeout','AbortError')),{once:true})));
 await assert.rejects(broker.request('https://app.test/api/me',{},10),{name:'AbortError'});
});
test('obsolete identity handoff is removed; browser OAuth handoff survives',async()=>{
 const {broker,data}=setup(async()=>Response.json({ok:true}));
 data.set('pair',JSON.stringify({kind:'telegram',origin:broker.origin,expires:Date.now()+100000}));assert.equal(await broker.pending(),null);assert.equal(data.has('pair'),false);
 data.set('pair',JSON.stringify({kind:'browser',origin:broker.origin,expires:Date.now()/1000+100,provider:'google'}));assert.equal((await broker.pending()).provider,'google');
 await assert.rejects(broker.startBrowser('apple'),/invalid_provider/);
});

test('a native HTTP bridge that ignores AbortSignal still cannot leave the UI waiting forever',async()=>{const {broker}=setup(()=>new Promise(()=>{}));await assert.rejects(broker.request('https://app.test/api/me',{},10),{name:'AbortError'})});
