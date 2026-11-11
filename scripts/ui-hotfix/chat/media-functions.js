async function mediaUrl(id){
 if(media.has(id))return media.get(id);
 const promise=(async()=>{
  let init='';try{init=WakhanNative.initData||''}catch{}
  const response=await fetch('/api/app/dm/media/'+id,{headers:init?{'X-Init':init}:{}});
  if(!response.ok)throw Error('media');
  return URL.createObjectURL(await response.blob());
 })();
 media.set(id,promise);promise.catch(()=>media.delete(id));
 for(const key of [...media.keys()]){
  if(media.size<=24)break;
  if(key===id||key===S.playingId)continue;
  const previous=media.get(key);media.delete(key);Promise.resolve(previous).then(url=>URL.revokeObjectURL(url)).catch(()=>{});
 }
 return promise;
}

async function playVoice(bubble,id){
 const button=bubble.querySelector('.c3-play');if(!button)return;
 if(S.player&&S.playingId===id&&!S.player.paused){S.player.pause();return}
 S.player?.pause();
 const audio=document.createElement('audio');audio.className='c4-player';audio.hidden=true;audio.preload='metadata';document.body.append(audio);
 S.player?.remove();S.player=audio;S.playingId=id;
 const active=()=>S.player===audio;
 audio.onplay=()=>{if(active()){button.innerHTML=PAUSE;bubble.classList.add('on')}};
 audio.onpause=audio.onended=()=>{S.playback.set(id,audio.ended?0:audio.currentTime);button.innerHTML=PLAY;bubble.classList.remove('on')};
 audio.ontimeupdate=()=>{if(audio.duration)bubble.style.setProperty('--p',audio.currentTime/audio.duration)};
 button.disabled=true;
 try{
  window.WakhanPlayback?.intent?.();const url=await mediaUrl(id);if(!active())return;
  audio.src=url;audio.onloadedmetadata=()=>{const position=S.playback.get(id)||0;if(position&&Number.isFinite(audio.duration))audio.currentTime=Math.min(position,audio.duration)};
  await audio.play();
 }catch{if(active()){bubble.classList.add('c3-fail');say(chatText('retry'))}}
 finally{button.disabled=false}
 while(S.playback.size>80)S.playback.delete(S.playback.keys().next().value);
}

function hydrate(bubble){
 const id=bubble.dataset.mid;
 const load=async()=>{
  try{
   const url=await mediaUrl(id);if(!bubble.isConnected)return;
   if(bubble.classList.contains('c3-img')){
    const image=document.createElement('img');image.src=url;image.alt=t2('photo');image.loading='lazy';image.decoding='async';image.onclick=()=>viewer(url);
    bubble.querySelector('.c3-img-ph')?.replaceWith(image);
   }
   bubble.classList.remove('c3-fail');
  }catch{if(bubble.isConnected)bubble.classList.add('c3-fail')}
 };
 if(bubble.classList.contains('c3-voice'))bubble.querySelector('.c3-play').onclick=()=>playVoice(bubble,id);
 else bubble.addEventListener('click',event=>{if(bubble.classList.contains('c3-fail')){event.preventDefault();load()}});
 if(bubble.classList.contains('c3-voice')&&window.WakhanRenderMode?.lowData)return;
 if(typeof IntersectionObserver==='function'){
  if(!S.mediaObserver)S.mediaObserver=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){S.mediaObserver.unobserve(entry.target);entry.target._c4Load?.()}
  },{rootMargin:'160px'});
  bubble._c4Load=load;S.mediaObserver.observe(bubble);
 }else load();
}

function renderAttachment(){
 const root=$('c2-thread');if(!root)return;
 const peer=Number(WM70.peer),job=S.attachments.get(peer);
 let box=root.querySelector('.c4-attachment');
 if(!job){box?.remove();return}
 if(!box){box=document.createElement('section');box.className='c4-attachment';root.querySelector('.c3-bar').before(box)}
 if(box.dataset.key!==job.client_key){
  box.dataset.key=job.client_key;box.replaceChildren();
  const heading=document.createElement('b');heading.textContent=chatText('preview');box.append(heading);
  if(job.kind==='image'&&job.data){const image=document.createElement('img');image.src=job.data;image.alt=t2('photo');box.append(image)}
  if(job.kind==='voice'&&job.url){const audio=document.createElement('audio');audio.controls=true;audio.preload='metadata';audio.src=job.url;box.append(audio)}
  const status=document.createElement('span');status.className='c4-attachment-status';status.setAttribute('role','status');box.append(status);
  const actions=document.createElement('div');actions.className='c4-attachment-actions';
  const sendButton=document.createElement('button');sendButton.type='button';sendButton.dataset.send='';sendButton.textContent=t2('send');sendButton.onclick=()=>sendAttachment(job);
  const cancel=document.createElement('button');cancel.type='button';cancel.dataset.cancel='';cancel.textContent=chatText('cancel');cancel.onclick=()=>{
   if(job.stage==='sending')return;
   job.cancelled=true;box.querySelector('audio')?.pause();if(job.url)URL.revokeObjectURL(job.url);
   if(S.attachments.get(peer)===job)S.attachments.delete(peer);renderAttachment();
  };
  actions.append(sendButton,cancel);box.append(actions);
 }
 const busy=['preparing','uploading','sending'].includes(job.stage);
 box.querySelector('[data-send]').disabled=busy;box.querySelector('[data-cancel]').disabled=job.stage==='sending';
 box.querySelector('.c4-attachment-status').textContent=job.stage==='uploading'?chatText('upload'):job.stage==='sending'?chatText('sending'):job.stage==='preparing'?chatText('preparing'):job.stage==='failed'?chatText('failed'):'';
}

async function sendPhoto(file){
 const peer=Number(WM70.peer);if(!WM70.dmCanSend)return say(tx('friend'));
 if(S.attachments.has(peer)||S.attachments.size>=3)return say(chatText('limit'));
 const job={uid:peer,kind:'image',client_key:wm70Key(),stage:'preparing'};S.attachments.set(peer,job);renderAttachment();
 try{
  const data=await shrink(file,1280);if(job.cancelled||S.attachments.get(peer)!==job)return;
  job.data=data;job.stage='ready';
  if(Number(WM70.peer)===peer){const box=$('c2-thread')?.querySelector('.c4-attachment');if(box)box.dataset.key='';renderAttachment()}
 }catch{if(S.attachments.get(peer)===job)S.attachments.delete(peer);if(Number(WM70.peer)===peer){renderAttachment();say(t2('failed'))}}
}

async function sendAttachment(job){
 const peer=Number(WM70.peer);
 if(peer!==job.uid||job.cancelled||S.attachments.get(peer)!==job||['uploading','sending','preparing'].includes(job.stage)||WM70.dmJobs?.has(peer))return;
 if(job.reply===undefined){job.reply=S.replies.get(peer)||null;job.reply_to=job.reply?.id||null}
 try{
  if(!job.mid){
   job.stage='uploading';renderAttachment();
   let data=job.data;
   if(!data)data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('file_read'));reader.readAsDataURL(job.blob)});
   if(job.cancelled)return;
   const uploaded=await api('/api/app/dm/media',{kind:job.kind,data,dur:job.duration||0});
   if(!uploaded?.ok||!MID.test('⟦m:'+uploaded.id+'⟧'))throw Error('upload_failed');
   job.mid=uploaded.id;
  }
  // Navigation/cancellation during upload never sends a file to another conversation.
  if(job.cancelled||Number(WM70.peer)!==peer){job.stage='ready';return}
  job.stage='sending';renderAttachment();
  const duration=job.duration||0;
  const text=job.kind==='image'?'📷 ⟦m:'+job.mid+'⟧':'🎤 '+Math.floor(duration/60)+':'+String(duration%60).padStart(2,'0')+' ⟦m:'+job.mid+'⟧';
  const intent={uid:peer,text,reply:job.reply,reply_to:job.reply_to,client_key:job.client_key,ts:Date.now()/1000,mediaJob:job};
  const success=await send(intent);
  if(!success)throw Error('send_failed');
  S.attachments.delete(peer);if(job.url)URL.revokeObjectURL(job.url);
 }catch{job.stage='failed';if(Number(WM70.peer)===peer)say(t2('failed'))}
 finally{if(Number(WM70.peer)===peer)renderAttachment()}
}

async function stopRecording(preview){
 const job=S.recording;if(!job)return;
 S.recording=null;job.cancelled=!preview;clearInterval(job.tick);
 job.button.classList.remove('on');job.box.hidden=true;
 if(!job.rec){job.cancelled=true;return}
 const duration=Math.min(60,Math.round((Date.now()-job.started)/1000));
 try{
  await new Promise(resolve=>{let timer=setTimeout(resolve,1500);job.rec.onstop=()=>{clearTimeout(timer);resolve()};try{job.rec.stop()}catch{clearTimeout(timer);resolve()}});
 }finally{
  job.stream.getTracks().forEach(track=>track.stop());window.WakhanChatAudio.recording=!!S.recording?.rec&&S.recording.rec.state==='recording';window.WakhanPlayback?.sync?.();
 }
 if(!preview||job.cancelled||!duration||!job.chunks.length)return;
 if(S.attachments.has(job.uid)||S.attachments.size>=3){say(chatText('limit'));return}
 const blob=new Blob(job.chunks,{type:job.rec.mimeType||'audio/mp4'});
 if(!blob.size||blob.size>1500000){say(t2('failed'));return}
 S.attachments.set(job.uid,{uid:job.uid,kind:'voice',blob,url:URL.createObjectURL(blob),duration,client_key:wm70Key(),stage:'ready'});
 if(Number(WM70.peer)===job.uid)renderAttachment();
}

function voiceSetup(button,box){
 button.setAttribute('aria-label',chatText('record'));button.title=chatText('record');
 box.querySelector('small').textContent=chatText('stop');
 button.onclick=async()=>{
  if(S.recording){await stopRecording(true);return}
  const peer=Number(WM70.peer);
  if(!WM70.dmCanSend)return say(tx('friend'));
  if(S.attachments.has(peer)||S.attachments.size>=3)return say(chatText('limit'));
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder!=='function')return say(t2('noMic'));
  const job={uid:peer,button,box,chunks:[],cancelled:false};S.recording=job;button.classList.add('on');
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   if(S.recording!==job||job.cancelled||Number(WM70.peer)!==peer||TAB!=='d'||!button.isConnected){stream.getTracks().forEach(track=>track.stop());if(S.recording===job){S.recording=null;button.classList.remove('on')}return}
   job.stream=stream;
   const type=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg'].find(mime=>MediaRecorder.isTypeSupported?.(mime));
   job.rec=new MediaRecorder(stream,{...(type?{mimeType:type}:{}),audioBitsPerSecond:48000});
   job.rec.ondataavailable=event=>{if(event.data?.size)job.chunks.push(event.data)};
   job.rec.onerror=()=>{stopRecording(false);say(t2('failed'))};job.rec.start(250);job.started=Date.now();box.hidden=false;
   window.WakhanChatAudio.recording=true;window.WakhanPlayback?.intent?.();window.WakhanPlayback?.sync?.();
   job.tick=setInterval(()=>{if(TAB!=='d'||Number(WM70.peer)!==peer){stopRecording(false);return}const seconds=Math.floor((Date.now()-job.started)/1000);box.querySelector('b').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');if(seconds>=60)stopRecording(true)},250);
  }catch{
   job.stream?.getTracks().forEach(track=>track.stop());if(S.recording===job){S.recording=null;button.classList.remove('on');say(t2('noMic'))}
  }
 };
 button.addEventListener('contextmenu',event=>event.preventDefault());
}

function installChatFeatures(){
 window.WakhanChatAudio={recording:false};
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&S.recording)stopRecording(true)});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scheduleVisibleRead()});
 document.addEventListener('scroll',event=>{if(event.target?.id==='wm70-dm-messages')scheduleVisibleRead()},true);
 const style=document.createElement('style');style.id='c4-chat';
 style.textContent=`
 .c4-content{display:flex;flex-direction:column;min-width:0;max-width:78%;gap:3px;align-items:flex-start}.me>.c4-content{align-items:flex-end}
 .c4-content>.c3-b{max-width:100%;min-width:0}.c4-content>time{font-size:10px;opacity:.6;padding:0 5px;font-variant-numeric:tabular-nums}
 .c5-seen{font:400 9px/1.2 system-ui;color:var(--mut);padding-inline:5px;opacity:.75}
 .c4-reply-action{position:absolute;width:1px;height:1px;padding:0;clip-path:inset(50%);overflow:hidden;white-space:nowrap;border:0}
 .c4-reply-action:focus-visible{position:static;width:auto;height:auto;min-height:44px;clip-path:none;padding:4px 10px;background:var(--card);color:var(--txt)}
 .c4-content{touch-action:pan-y;transition:transform .16s ease}.c4-swiping>.c4-content{transition:none}.c3-row{position:relative}
 .c4-reply-action[hidden],.c4-reply[hidden]{display:none!important}
 .c4-quote{display:block!important;max-width:100%;width:100%;overflow:hidden;text-overflow:ellipsis;text-align:start;white-space:nowrap;border:0!important;border-inline-start:3px solid var(--a1,#8b5cf6)!important;border-radius:6px;background:#ffffff0c!important;box-shadow:none!important;color:inherit;font:inherit;font-size:12px;padding:7px 9px!important;margin:0 0 5px!important;min-height:32px}
 .c4-quote>b,.c4-quote>span{display:block;overflow:hidden;text-overflow:ellipsis}.c4-quote>b{font-size:11px;margin-bottom:2px}
 .c4-reply{display:flex;align-items:center;gap:10px;flex:none;padding:8px 12px;background:var(--bg2,var(--bg));border-top:1px solid #ffffff12}
 .c4-reply>div{flex:1;min-width:0;border-inline-start:3px solid var(--a1,#8b5cf6);padding-inline-start:10px;display:flex;flex-direction:column;gap:3px}.c4-reply b{font-size:12px;color:var(--a1,#8b5cf6)}.c4-reply span{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .c4-reply>button{min-width:44px;min-height:44px;border:0;background:none;color:inherit;font-size:23px}
 .c4-status{min-height:32px;border:0!important;background:none!important;box-shadow:none!important;color:var(--mut);font:inherit;font-size:11px;padding:4px!important}.c4-failed .c4-status{color:#fb7185}
 .c4-highlight{background:#8b5cf633!important;border-radius:12px}
 .c4-attachment{flex:none;max-height:36dvh;overflow:auto;padding:10px 14px;border-top:1px solid #ffffff20;background:var(--bg2,var(--bg));display:flex;align-items:center;gap:10px;flex-wrap:wrap}
 .c4-attachment>b{font-size:12px}.c4-attachment>img{width:72px;height:72px;object-fit:cover;border-radius:10px}.c4-attachment>audio{max-width:100%;height:40px}.c4-attachment-status{font-size:12px;color:var(--mut)}
 .c4-attachment-actions{display:flex;gap:8px;margin-inline-start:auto}.c4-attachment-actions>button{min-height:44px;border:0;border-radius:12px;background:var(--a1,#8b5cf6);color:white;padding:8px 15px;font:inherit}.c4-attachment-actions>[data-cancel]{background:#ffffff12;color:inherit}
 .c3-bar{flex-shrink:0!important}.c3-msgs{min-height:0!important;flex:1 1 auto!important}.c3-rec small{max-width:160px}.c3-tool.c3-mic.on{color:#fb7185}
 @media(max-height:500px){.c3-head{min-height:44px;padding-block:2px!important}.c4-attachment{max-height:28dvh}.c4-attachment>img{width:46px;height:46px}.c3-bar{padding-block:4px!important}}
 #c2-thread>.c3-head{display:grid!important}
 html.wk-ios #c2-thread>.c3-head{padding-top:calc(4px + var(--wk-chat-safe-top,var(--wk-safe-top,env(safe-area-inset-top,0px))))!important;min-height:calc(52px + var(--wk-chat-safe-top,var(--wk-safe-top,env(safe-area-inset-top,0px))))}
 `;document.head.append(style);
}
