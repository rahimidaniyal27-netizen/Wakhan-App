async function wm70OpenDM(uid){
 const previous=Number(WM70.peer);
 WM70.threadCache ||= new Map();
 if(previous)WM70.threadCache.set(previous,{messages:WM70.messages.slice(-120),canSend:WM70.dmCanSend,replySupported:WM70.replySupported,peerReadId:WM70.peerReadId||0});
 const peer=Number(uid),saved=WM70.threadCache.get(peer);
 WM70.modal=null;closeSheet();++WM70.profileSeq;++WM70.dmSeq;WM70.peer=peer;
 WM70.messages=saved?saved.messages.slice():[];WM70.dmCanSend=!!saved?.canSend;WM70.replySupported=!!saved?.replySupported;WM70.peerReadId=saved?.peerReadId||0;WM70.dmError='';
 WM70.dmBusy=!!WM70.dmJobs?.has(peer);
 while(WM70.threadCache.size>12)WM70.threadCache.delete(WM70.threadCache.keys().next().value);
 go('d');await wm70PollDM(!saved);
}

async function wm70PollDM(initial=false){
 const peer=WM70.peer,seq=WM70.dmSeq;
 if(!peer||TAB!=='d')return;
 if(WM70.pollingDM&&WM70.pollingDM.peer===peer&&WM70.pollingDM.seq===seq)return;
 const job={peer,seq};WM70.pollingDM=job;
 try{
  const after=initial?0:Math.max(0,...WM70.messages.map(v=>v.id));
  const result=await wm70Request('dm?uid='+peer+(after?'&after='+after:''));
  if(peer!==WM70.peer||seq!==WM70.dmSeq||TAB!=='d')return;
  wm70Remember(result.peer);WM70.dmCanSend=result.can_send;WM70.replySupported=result.reply_supported===true;WM70.peerReadId=Number(result.peer_read_id)||0;WM70.dmError='';
  const ids=new Set(WM70.messages.map(v=>v.id));
  for(const message of result.messages||[])if(!ids.has(message.id))WM70.messages.push(message);
  WM70.messages.sort((a,b)=>a.id-b.id);wm70DMMessages();
  return result;
 }catch(error){if(peer===WM70.peer&&seq===WM70.dmSeq){WM70.dmError=wm70Error(error);wm70DMMessages()}}
 finally{if(WM70.pollingDM===job)WM70.pollingDM=null}
}

async function wm70SendDM(intent){
 const input=document.getElementById('wm70-dm-text');
 const pending=intent||{uid:Number(WM70.peer),text:input?.value.trim(),client_key:wm70Key()};
 if(!pending.text||!pending.uid)return;
 WM70.dmJobs ||= new Map();
 if(WM70.dmJobs.has(pending.uid))throw Error('send_in_progress');
 const job={};WM70.dmJobs.set(pending.uid,job);
 if(pending.uid===Number(WM70.peer)){WM70.dmBusy=true;wm70DMMessages()}
 try{
  const reply=await wm70Request('dm',pending);
  if(!reply||!reply.ok||!Number.isSafeInteger(reply.id))throw Error('send_failed');
  if(!intent&&Number(WM70.peer)===pending.uid&&input?.value.trim()===pending.text)input.value='';
  return reply;
 }finally{
  if(WM70.dmJobs.get(pending.uid)===job)WM70.dmJobs.delete(pending.uid);
  WM70.dmBusy=WM70.dmJobs.has(Number(WM70.peer));
  if(pending.uid===Number(WM70.peer))wm70DMMessages();
 }
}
