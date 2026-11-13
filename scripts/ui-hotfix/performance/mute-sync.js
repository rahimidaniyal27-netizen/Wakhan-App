function wmqNotifyMute(room,epoch,muted){
 const token=WMQ.token;
 let job=SX.muteSync;
 if(!job||job.room!==room||job.epoch!==epoch||job.token!==token)job=SX.muteSync={room,epoch,token,revision:0,running:false};
 job.muted=!!muted;++job.revision;
 if(job.running)return;
 const valid=()=>SX.muteSync===job&&CID===room&&WMC.epoch===epoch&&WMQ.token===token&&VC.on&&VC.cid===room;
 job.running=true;
 void(async()=>{
  let failures=0;
  try{
   while(valid()){
    const revision=job.revision;
    try{const result=await api('/api/cv/'+room,{a:'mute',m:job.muted?1:0});if(result?.ok===false)throw Error('mute_sync');failures=0}
    catch{if(!valid()||++failures>=3)return;await new Promise(resolve=>setTimeout(resolve,500));continue}
    if(!valid()||revision===job.revision)return;
   }
  }finally{job.running=false}
 })();
}
