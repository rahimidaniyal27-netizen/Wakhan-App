function vcPc(id){
 const room=VC.cid,pc=new RTCPeerConnection(window.WakhanVoiceRoutes?.configuration(VC.ice,{room,peer:id})||{iceServers:VC.ice});
 VC.stream.getTracks().forEach(track=>pc.addTrack(track,VC.stream));
 pc.onicecandidate=event=>{if(event.candidate&&VC.on&&VC.cid===room&&VC.pcs[id]?.pc===pc)api('/api/cv/'+room,{a:'sig',to:id,d:{c:event.candidate.toJSON?event.candidate.toJSON():event.candidate}})};
 pc.ontrack=event=>{
  if(!VC.on||VC.cid!==room||VC.pcs[id]?.pc!==pc||event.track?.kind!=='audio')return;
  const stream=event.streams?.[0]||new MediaStream([event.track]);let audio=document.getElementById('vca'+id);
  if(!audio){audio=document.createElement('audio');audio.id='vca'+id;audio.className='vca';audio.autoplay=true;audio.setAttribute('playsinline','');document.body.append(audio)}
  audio.dataset.room=room;audio.muted=SX.speaker===false;if(audio.srcObject!==stream)audio.srcObject=stream;
  void wmqPlayVoice(audio);vcMeter(id,stream);
 };
 pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'&&VC.pcs[id]?.pc===pc){pc.close();delete VC.pcs[id];setTimeout(vcSync,1500)}};
 VC.pcs[id]={pc,q:[]};return pc;
}
function wmqPlayVoice(audio){
 if(!VC.on||audio.dataset.room!==VC.cid)return Promise.resolve(false);
 return audio.play().then(()=>{audio.dataset.blocked='0';SX.audioBlocked=[...document.querySelectorAll('.vca')].some(node=>node.dataset.room===VC.cid&&node.dataset.blocked==='1');if(typeof drawHall==='function')drawHall();return true}).catch(error=>{
  if(!VC.on||audio.dataset.room!==VC.cid)return false;
  audio.dataset.blocked='1';SX.audioBlocked=true;if(typeof drawHall==='function')drawHall();return false;
 });
}
function wmqResumeVoiceAudio(){
 if(!VC.on||SX.speaker===false)return false;
 VC.actx?.resume().catch(()=>{});
 let pending=false;for(const audio of document.querySelectorAll('.vca')){
  if(audio.dataset.room!==VC.cid||!audio.srcObject)continue;audio.muted=false;
  if(audio.paused||audio.dataset.blocked==='1'){pending=true;void wmqPlayVoice(audio)}
 }
 return pending;
}
