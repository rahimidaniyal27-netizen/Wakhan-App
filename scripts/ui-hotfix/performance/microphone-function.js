async function(){
 if(!CS||CS.mine<0)return;
 const room=CID,epoch=WMC.epoch;
 if(SX.micJob&&SX.micJob.room===room&&SX.micJob.epoch===epoch&&SX.micJob.token===WMQ.token)return;
 const job={room,epoch,token:WMQ.token};SX.micJob=job;SX.micBusy=true;let acquired=null;
 const owns=()=>SX.micJob===job&&CID===room&&WMC.epoch===epoch&&VC.on&&VC.cid===room&&(job.token===null||job.token===WMQ.token);
 try{
  if(!VC.on){const joining=vcJoin();job.token=WMQ.token;await joining;}
  if(!owns())return;job.token=WMQ.token;
  if(!VC.mute){VC.mute=true;SX.mic?.getAudioTracks().forEach(t=>t.enabled=false);VC.spk[ME.me.id]=false}
  else{
   let stream=SX.mic;
   if(!stream?.getAudioTracks().some(t=>t.readyState==='live')){
    wmqSession('play-and-record');
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:false,sampleRate:{ideal:48000},channelCount:{ideal:1}}});acquired=stream;
    stream.getAudioTracks().forEach(t=>t.enabled=false);
    if(!owns()){stream.getTracks().forEach(t=>t.stop());return}
    SX.mic=stream;VC.stream=stream;await wmqReplaceTrack(stream.getAudioTracks()[0]);
    if(!owns()){stream.getTracks().forEach(t=>t.stop());return}
    vcMeter(ME.me.id,stream);
   }
   if(!owns())return;
   stream.getAudioTracks().forEach(t=>t.enabled=true);VC.mute=false;
  }
  wmqNotifyMute(room,epoch,VC.mute);if(owns())hap('medium');
 }catch(e){
  if(!owns()){acquired?.getTracks().forEach(t=>t.stop());return}
  SX.mic?.getAudioTracks().forEach(t=>t.enabled=false);VC.mute=true;
  if(VC.on){try{VC.stream=wmqSilent();await wmqReplaceTrack(VC.stream.getAudioTracks()[0])}catch(ignore){}
   if(!owns())return;SX.mic?.getTracks().forEach(t=>t.stop());SX.mic=null}
  toast(t(e.name==='NotAllowedError'?'mic_denied':'err'));
 }finally{
  if(SX.micJob===job){SX.micJob=null;SX.micBusy=false;if(CID===room&&WMC.epoch===epoch&&CS)drawHall()}
 }
}
