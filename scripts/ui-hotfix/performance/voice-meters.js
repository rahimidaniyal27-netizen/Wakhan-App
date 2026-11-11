/* Speaking indicators share one bounded visual sampler; media tracks are unchanged. */
(()=>{'use strict';
 if(typeof WMC==='undefined'||typeof VC==='undefined'||typeof WKV2==='undefined'||WKV2.meterSampler)return;
 const stats={reads:0,ticks:0,active:0};WKV2.meterSampler=stats;
 let timer=0;
 const dispose=(id,state)=>{try{state.source.disconnect();state.an.disconnect()}catch{}if(WMC.meters.get(id)===state){WMC.meters.delete(id);if(VC.levels)delete VC.levels[id];VC.spk[id]=false;spkDraw(id)}};
 const start=()=>{if(!timer&&VC.on&&document.visibilityState!=='hidden'&&WMC.meters.size)timer=setTimeout(sample,120)};
 function sample(){
  timer=0;if(!VC.on||document.visibilityState==='hidden')return;
  stats.ticks++;const now=performance.now();
  for(const [id,state] of WMC.meters){
   if(state.cid!==VC.cid||state.token!==(typeof WMQ==='undefined'?null:WMQ.token)||!state.stream.getAudioTracks().some(t=>t.readyState==='live')){dispose(id,state);continue}
   try{
    state.an.getByteFrequencyData(state.buf);stats.reads++;
    let sum=0;for(const value of state.buf)sum+=value;
    const muted=id===String(ME.me.id)&&VC.mute;const energy=sum/state.buf.length;const active=energy>16&&!muted;
    VC.levels ||= {};const before=VC.levels[id]||0;VC.levels[id]=muted?0:Math.min(1,Math.max(0,(energy-12)/80));
    if(Math.abs(before-VC.levels[id])>.015)spkDraw(id);
    if(active!==!!VC.spk[id]&&(active||now-state.last>550)){VC.spk[id]=active;spkDraw(id);duck()}
    if(active)state.last=now;
   }catch{dispose(id,state)}
  }
  stats.active=WMC.meters.size;start();
 }
 vcMeter=function(id,stream){
  id=String(id);const prior=WMC.meters.get(id);if(prior)dispose(id,prior);
  try{
   if(!VC.actx||VC.actx.state==='closed')VC.actx=new (window.AudioContext||window.webkitAudioContext)();
   VC.actx.resume().catch(()=>{});
   const an=VC.actx.createAnalyser();an.fftSize=256;
   const source=VC.actx.createMediaStreamSource(stream);source.connect(an);
   const state={an,source,stream,cid:VC.cid,token:typeof WMQ==='undefined'?null:WMQ.token,buf:new Uint8Array(an.frequencyBinCount),last:0};
   WMC.meters.set(id,state);stats.active=WMC.meters.size;start();
  }catch{}
 };
 const leave=vcLeave;
 vcLeave=function(...args){clearTimeout(timer);timer=0;const result=leave.apply(this,args);stats.active=WMC.meters.size;return result};
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){clearTimeout(timer);timer=0}else start()});
})();
