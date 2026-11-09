/* WAKHAN voice2 — keeps hall voice connected (loads last, works with old and new hall).
   1. If the server forgot us (phone locked, network gap) we join again by ourselves.
   2. A broken link to one person is rebuilt on its own (no need to leave and come back).
   3. When the network changes (Wi-Fi ↔ mobile) or the app comes back to the front, links are checked at once. */
(()=>{'use strict';
if(window.__wkVoice2||typeof VC==='undefined'||typeof vcPc!=='function')return;window.__wkVoice2=1;
const myId=()=>{try{return Number(ME.me.id)}catch(e){return 0}};
const seatedNow=()=>{try{return !!CS&&CS.mine>=0}catch(e){return false}};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const R={fix:{},rejoining:false,log:[]};
const note=m=>{R.log.push(Date.now()+' '+m);if(R.log.length>40)R.log.shift()};
window.WKV2=R;

/* ---- 1. poll loop that notices when we are no longer a member */
async function rejoin(cid){if(R.rejoining||!VC.on||VC.cid!==cid||!seatedNow())return;R.rejoining=true;note('rejoin');
 try{const r=await api('/api/cv/'+cid,{a:'join',keep:1});if(r&&r.ok&&VC.on&&!r.again){for(const id of Object.keys(VC.pcs)){try{VC.pcs[id].pc.close()}catch(e){}delete VC.pcs[id]}R.fix={};if(!VC.mute)await api('/api/cv/'+cid,{a:'mute',m:0});vcSync()}}catch(e){}finally{R.rejoining=false}}
vcLoop=async function(){const tok=++VC.tok;let miss=0;
 while(VC.on&&tok===VC.tok){
  try{const cid=VC.cid,j=await api(`/api/cv/${cid}/poll?v=${VC.ver}`);if(tok!==VC.tok||!VC.on)return;
   if(!j||!j.ok){await wait(Math.min(1500*(++miss),6000));continue}miss=0;
   VC.ver=j.ver;VC.members=j.members||[];
   for(const m of j.msgs||[]){try{await vcSig(m.from,m.d)}catch(e){}}
   if(!VC.members.some(m=>Number(m.id)===myId()))rejoin(cid);
   vcSync();check()}
  catch(e){await wait(Math.min(1500*(++miss),6000))}}};

/* ---- 2. rebuild one broken link: the lower id calls again, the other side waits for the call */
function rebuild(id,why){id=Number(id);const P=VC.pcs[id];if(!VC.on)return;
 const last=R.fix[id]||0;if(Date.now()-last<4000)return;R.fix[id]=Date.now();note('rebuild '+id+' '+why);
 if(P){try{P.pc.close()}catch(e){}delete VC.pcs[id]}
 if(myId()<id){try{vcCall(id)}catch(e){}}else{note('ring '+id);api('/api/cv/'+VC.cid,{a:'sig',to:id,d:{ring:1}}).catch(()=>{})}}
function watch(id,pc){let t=0;const st=()=>pc.connectionState||pc.iceConnectionState;
 const on=()=>{if(!VC.pcs[id]||VC.pcs[id].pc!==pc)return;const s=st();clearTimeout(t);
  if(s==='failed')rebuild(id,'failed');
  else if(s==='disconnected')t=setTimeout(()=>{if(VC.pcs[id]&&VC.pcs[id].pc===pc&&/disconnected|failed/.test(st()))rebuild(id,'lost')},5000)};
 pc.onconnectionstatechange=on;pc.oniceconnectionstatechange=on;
 /* a link that never connects within 15 s is rebuilt too */
 setTimeout(()=>{if(VC.pcs[id]&&VC.pcs[id].pc===pc&&!/connected|completed/.test(st()))rebuild(id,'slow')},15000)}
const prevPc=vcPc;
vcPc=function(id){const pc=prevPc(id);try{watch(Number(id),pc)}catch(e){}return pc};
function check(){for(const [id,P] of Object.entries(VC.pcs)){const s=P.pc.connectionState||P.pc.iceConnectionState;if(s==='failed'||s==='closed')rebuild(id,s)}
 /* we are the higher id and have no link to someone: ask them to call us */
 const me=myId(),now=Date.now();R.miss=R.miss||{};
 for(const m of VC.members||[]){const id=Number(m.id);if(id>=me||VC.pcs[id]){delete R.miss[id];continue}
  if(!R.miss[id])R.miss[id]=now;else if(now-R.miss[id]>3000){R.miss[id]=now;note('ring '+id);api('/api/cv/'+VC.cid,{a:'sig',to:id,d:{ring:1}}).catch(()=>{})}}}
setInterval(()=>{if(VC.on)check()},2500);
const prevSig=vcSig;
vcSig=async function(from,d){if(d&&d.ring){if(myId()<Number(from))rebuild(from,'ring');return}return prevSig(from,d)};

/* ---- 3. network change / back to the front */
function wake(why){if(!VC.on)return;note('wake '+why);const cid=VC.cid;
 rejoin(cid);
 setTimeout(()=>{if(!VC.on)return;for(const id of Object.keys(VC.pcs)){const s=VC.pcs[id].pc.connectionState;if(s!=='connected')rebuild(id,why)}vcSync()},1200);
 try{VC.actx&&VC.actx.resume()}catch(e){}
 document.querySelectorAll('audio.vca').forEach(a=>{try{a.play().catch(()=>{})}catch(e){}})}
window.addEventListener('online',()=>wake('online'));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')wake('front')});
try{navigator.connection&&navigator.connection.addEventListener('change',()=>wake('net'))}catch(e){}
})();
