function chatText(key){
 const lang=String((typeof LG!=='undefined'&&LG)||document.documentElement.lang||'en').slice(0,2);
 const copy={fa:{reply:'پاسخ',cancel:'لغو',unavailable:'پیام اصلی در دسترس نیست',retry:'تلاش دوباره',sending:'در حال فرستادن…',sent:'فرستاده شد',failed:'فرستاده نشد',preview:'پیش‌نمایش',record:'برای ضبط بزن؛ برای پایان دوباره بزن',stop:'پایان ضبط',upload:'در حال فرستادن فایل…',preparing:'آماده‌سازی…',limit:'اول فایل آماده‌شده را بفرست یا لغو کن'},
  ps:{reply:'ځواب',cancel:'لغوه',unavailable:'اصلي پیغام نشته',retry:'بیا هڅه',sending:'لېږل کېږي…',sent:'ولېږل شو',failed:'ونه لېږل شو',preview:'مخکتنه',record:'د ثبت لپاره کېکاږئ؛ د پای لپاره بیا کېکاږئ',stop:'ثبت پای',upload:'فایل لېږل کېږي…',preparing:'چمتو کېږي…',limit:'لومړی چمتو فایل ولېږئ یا لغوه کړئ'},
  en:{reply:'Reply',cancel:'Cancel',unavailable:'Original message unavailable',retry:'Retry',sending:'Sending…',sent:'Sent',failed:'Not sent',preview:'Preview',record:'Tap to record; tap again to finish',stop:'Finish recording',upload:'Sending file…',preparing:'Preparing…',limit:'Send or cancel the current attachment first'}};
 if(key==='seen')return lang==='fa'?'خوانده شد':lang==='ps'?'لوستل شوی':'Seen';
 return (copy[lang]||copy.en)[key]||key;
}

function rememberThread(){
 const peer=S.peer,input=$('wm70-dm-text');
 if(!peer||!input)return;
 S.drafts.set(peer,{text:input.value,reply:S.replies.get(peer)||null,scroll:$('wm70-dm-messages')?.scrollTop||0});
 while(S.drafts.size>50)S.drafts.delete(S.drafts.keys().next().value);
}

function replyPreview(message){
 if(!message)return '';
 if(message.unavailable)return chatText('unavailable');
 return String(message.text||'').replace(/\s*⟦m:[A-Za-z0-9_-]+⟧/g,'').slice(0,180);
}

function replyAuthor(message){
 const uid=Number(message?.sender);
 const profile=uid===me()?selfP():WM70.people.get(uid);
 return profile?(profile.name||profile.first_name||profile.username||chatText('reply')):chatText('reply');
}

function chooseReply(message){
 if(!WM70.replySupported||!message?.id)return;
 S.replies.set(Number(WM70.peer),{id:Number(message.id),sender:Number(message.sender),text:String(message.text||'').slice(0,240)});
 renderReply();$('wm70-dm-text')?.focus({preventScroll:true});rememberThread();
}

function cancelReply(){S.replies.delete(Number(WM70.peer));renderReply();rememberThread()}

function renderReply(){
 const root=$('c2-thread');if(!root)return;
 let strip=root.querySelector('.c4-reply');
 if(!strip){strip=document.createElement('div');strip.className='c4-reply';root.querySelector('.c3-bar').before(strip)}
 const reply=S.replies.get(Number(WM70.peer));if(strip.hidden===!!reply)strip.hidden=!reply;
 if(!reply){delete strip.dataset.replyKey;return}
 const key=JSON.stringify([WM70.peer,reply.id,replyAuthor(reply),replyPreview(reply)]);
 if(strip.dataset.replyKey===key)return;strip.dataset.replyKey=key;
 strip.replaceChildren();
 const text=document.createElement('div'),label=document.createElement('b'),preview=document.createElement('span');
 label.textContent=replyAuthor(reply);label.dir='auto';preview.textContent=replyPreview(reply);preview.dir='auto';text.append(label,preview);
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='×';cancel.setAttribute('aria-label',chatText('cancel'));cancel.onclick=cancelReply;
 strip.append(text,cancel);
}

async function jumpToReply(reply){
 if(!reply||reply.unavailable)return;
 const peer=Number(WM70.peer),seq=WM70.dmSeq;
 let row=S.rows.get(String(reply.id));
 if(!row){
  try{
   const result=await wm70Request('dm?uid='+peer+'&before='+(Number(reply.id)+1));
   if(peer!==Number(WM70.peer)||seq!==WM70.dmSeq)return;
   const ids=new Set(WM70.messages.map(x=>x.id));
   for(const message of result.messages||[])if(!ids.has(message.id))WM70.messages.push(message);
   WM70.messages.sort((a,b)=>a.id-b.id);drawMessages();row=S.rows.get(String(reply.id));
  }catch{say(chatText('unavailable'));return}
 }
 if(!row){say(chatText('unavailable'));return}
 row.scrollIntoView({block:'center',behavior:'auto'});row.classList.add('c4-highlight');setTimeout(()=>row.classList.remove('c4-highlight'),1400);
}

function rowEl(message,mine){
 const row=document.createElement('div');row.className='dt-row c3-row '+(mine?'me':'them');
 if(message.id)row.dataset.id=String(message.id);
 const profile=mine?selfP():(WM70.people.get(Number(WM70.peer))||{id:WM70.peer});
 row.innerHTML=`<button type="button" class="c3-av" onclick="wm70OpenProfile(${Number(profile.id)||0})">${av(profile)}</button><div class="c4-content">${bubbleHtml(message)}<time>${esc(hm(Number(message.ts)||Date.now()/1000))}</time></div>`;
 const bubble=row.querySelector('.c3-b');
 if(message.reply){
  const quote=document.createElement('button');quote.type='button';quote.className='c4-quote';quote.dir='auto';
  const author=document.createElement('b'),preview=document.createElement('span');author.textContent=replyAuthor(message.reply);preview.textContent=replyPreview(message.reply);quote.append(author,preview);
  quote.disabled=!!message.reply.unavailable;quote.onclick=()=>jumpToReply(message.reply);bubble.prepend(quote);
 }
 if(message.id){
  const action=document.createElement('button');action.type='button';action.className='c4-reply-action';action.textContent=chatText('reply');action.title=chatText('reply');action.setAttribute('aria-label',chatText('reply'));
  action.hidden=!WM70.replySupported;action.onclick=()=>chooseReply(message);row.append(action);
  row.addEventListener('contextmenu',event=>{if(WM70.replySupported){event.preventDefault();chooseReply(message)}});
  installReplySwipe(row,message);
 }
 const mediaBubble=row.querySelector('.c3-b[data-mid]');if(mediaBubble)hydrate(mediaBubble);
 return row;
}

function installReplySwipe(row,message){
 let gesture=null,suppressClick=false;
 const content=row.querySelector('.c4-content');
 function reset(){content.style.transform='';row.classList.remove('c4-swiping','c4-swipe-ready');gesture=null}
 row.addEventListener('pointerdown',event=>{
  if(!WM70.replySupported||!event.isPrimary||event.button!==0||event.target.closest('button,a,input,textarea,audio,video'))return;
  gesture={id:event.pointerId,x:event.clientX,y:event.clientY,peer:Number(WM70.peer),dx:0,moved:false};
 });
 row.addEventListener('pointermove',event=>{
  const g=gesture;if(!g||g.id!==event.pointerId)return;
  const dx=event.clientX-g.x,dy=event.clientY-g.y;
  if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){reset();return}
  if(dx>=-10&&!g.moved)return;
  if(dx>0){reset();return}
  if(!g.moved){g.moved=true;try{row.setPointerCapture(event.pointerId)}catch{}}
  event.preventDefault();g.dx=Math.max(-80,dx);row.classList.add('c4-swiping');row.classList.toggle('c4-swipe-ready',g.dx<=-48);content.style.transform=`translateX(${g.dx}px)`;
 },{passive:false});
 row.addEventListener('pointerup',event=>{
  const g=gesture;if(!g||g.id!==event.pointerId)return;
  const reply=g.moved&&g.dx<=-48&&g.peer===Number(WM70.peer)&&row.isConnected;
  suppressClick=g.moved;reset();if(reply)chooseReply(message);
  setTimeout(()=>{suppressClick=false},0);
 });
 row.addEventListener('pointercancel',reset);row.addEventListener('lostpointercapture',reset);
 row.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation()}},true);
}

function drawMessages(){
 const out=$('wm70-dm-messages');if(!out||Number(WM70.peer)!==S.peer)return;
 const messages=WM70.messages||[],height=out.scrollHeight,scroll=out.scrollTop;
 const sticky=height-scroll-out.clientHeight<120||!out.dataset.init;
 const prepend=messages.length&&S.first&&Number(messages[0].id)<S.first;
 let older=out.querySelector('.dt-older');
 if(!older&&messages.length>=30){older=document.createElement('button');older.type='button';older.className='dt-older';older.textContent=tx('older');older.onclick=()=>wm70Older();out.prepend(older)}
 const empty=out.querySelector('.dt-empty');if(empty&&messages.length)empty.remove();
 let cursor=older?older.nextSibling:out.firstChild;
 for(const message of messages){
  const id=String(message.id);let row=S.rows.get(id);
  if(!row){dropEcho(message);row=rowEl(message,Number(message.sender)===me());S.rows.set(id,row)}
  const action=row.querySelector('.c4-reply-action');if(action)action.hidden=!WM70.replySupported;
  if(row!==cursor)out.insertBefore(row,cursor);cursor=row.nextSibling;
 }
 S.first=messages.length?Number(messages[0].id):0;
 for(const echo of S.outbox.values())if(echo.uid===S.peer){
  if(echo.mid&&messages.some(m=>Number(m.id)===echo.mid)){echo.el?.remove();S.outbox.delete(echo.client_key);continue}
  if(!echo.el)echo.el=rowEl({text:echo.text,reply:echo.reply,ts:echo.ts},true);
  echo.el.classList.toggle('pending',echo.state==='sending');echo.el.classList.toggle('c4-failed',echo.state==='failed');
  let status=echo.el.querySelector('.c4-status');if(!status){status=document.createElement('button');status.type='button';status.className='c4-status';echo.el.querySelector('.c4-content').append(status)}
  status.textContent=echo.state==='failed'?chatText('retry'):chatText(echo.state==='sending'?'sending':'sent');
  status.disabled=echo.state!=='failed';status.onclick=()=>send(echo);
  out.append(echo.el);
 }
 if(!messages.length&&![...S.outbox.values()].some(e=>e.uid===S.peer)&&!out.querySelector('.dt-empty')){
  const empty=document.createElement('div');empty.className='dt-empty';empty.textContent=tx('first');out.append(empty);
 }
 if(prepend&&!sticky)out.scrollTop=scroll+(out.scrollHeight-height);
 else if(sticky){out.scrollTop=out.scrollHeight;out.dataset.init='1'}
 const notice=$('wm70-dm-notice'),error=WM70.dmError||(!WM70.dmCanSend?tx('friend'):'');
 if(notice){notice.textContent=error;notice.hidden=!error}
 const button=document.querySelector('#c2-thread .c3-send');if(button)button.disabled=!WM70.dmCanSend||!!WM70.dmJobs?.has(S.peer);
 renderReply();renderAttachment();
 renderReadReceipts();scheduleVisibleRead();
}

function renderReadReceipts(){
 const cursor=Number(WM70.peerReadId)||0;
 const read=(WM70.messages||[]).filter(m=>Number(m.sender)===me()&&Number(m.id)<=cursor),last=read[read.length-1];
 for(const [id,row]of S.rows){
  let label=row.querySelector('.c5-seen');
  if(Number(id)!==Number(last?.id)){label?.remove();continue}
  if(!label){label=document.createElement('small');label.className='c5-seen';row.querySelector('.c4-content').append(label)}
  label.textContent=chatText('seen');
 }
}

function scheduleVisibleRead(){
 if(S.readFrame)return;
 S.readFrame=requestAnimationFrame(()=>{
  S.readFrame=0;
  if(TAB!=='d'||document.visibilityState==='hidden'||Number(WM70.peer)!==S.peer||WM70.modal||document.querySelector('dialog[open],#c3-settings'))return;
  const out=$('wm70-dm-messages');if(!out||!out.isConnected||out.getBoundingClientRect().height<1)return;
  const bounds=out.getBoundingClientRect();let last=0;
  for(const message of WM70.messages||[]){
   if(Number(message.sender)===me())continue;
   const row=S.rows.get(String(message.id));if(!row)continue;
   const box=row.getBoundingClientRect(),overlap=Math.min(bounds.bottom,box.bottom)-Math.max(bounds.top,box.top);
   if(box.height>0&&overlap>=Math.min(40,box.height)*.5)last=Math.max(last,Number(message.id));
  }
  S.readSent ||= new Map();const peer=Number(WM70.peer);
  if(!last||last<=(S.readSent.get(peer)||0)||S.readPending===peer)return;
  S.readPending=peer;
  wm70Request('dm',{action:'read',uid:peer,last_id:last}).then(()=>S.readSent.set(peer,Math.max(last,S.readSent.get(peer)||0))).catch(()=>{}).finally(()=>{if(S.readPending===peer)S.readPending=null});
 });
}

function dropEcho(message){
 if(Number(message.sender)!==me())return;
 for(const [key,echo] of S.outbox)if(echo.mid===Number(message.id)||key===message.client_key){echo.mid=Number(message.id);echo.state='sent';echo.el?.remove();S.outbox.delete(key);finishSend(echo,$('wm70-dm-text'),Number(WM70.peer));renderAttachment()}
}

async function send(value){
 const input=$('wm70-dm-text'),peer=Number(WM70.peer);
 if(!input||!peer||!WM70.dmCanSend||WM70.dmJobs?.has(peer))return false;
 const explicit=typeof value==='string'||(value&&typeof value==='object');
 const text=typeof value==='string'?value.trim():value?.text||input.value.trim();
 if(!text)return false;
 const selected=S.replies.get(peer)||null,reply=typeof value==='object'?(value.reply||null):selected;
 const reply_to=typeof value==='object'?value.reply_to:reply?.id||null;
 let entry=typeof value==='object'?(S.outbox.get(value.client_key)||value):[...S.outbox.values()].find(x=>x.uid===peer&&x.text===text&&x.reply_to===reply_to&&x.state==='failed');
 if(!entry)entry={uid:peer,text,reply_to,reply,client_key:wm70Key(),ts:Date.now()/1000,fromComposer:!explicit,draftRevision:S.draftRevision.get(peer)||0};
 if(entry.uid!==peer)return false;
 entry.state='sending';S.outbox.set(entry.client_key,entry);drawMessages();
 try{
  const result=await wm70SendDM({uid:entry.uid,text:entry.text,reply_to:entry.reply_to,client_key:entry.client_key});
  entry.mid=result.id;entry.state='sent';
  finishSend(entry,input,peer);
  return true;
 }catch(error){if(entry.mid){entry.state='sent';finishSend(entry,input,peer);return true}entry.state='failed';say(wm70Error(error));return false}
 finally{if(Number(WM70.peer)===peer)drawMessages()}
}

function finishSend(entry,input,peer){
 if(Number(WM70.peer)!==peer)return;
 if(entry.fromComposer&&input.isConnected&&(S.draftRevision.get(peer)||0)===entry.draftRevision&&input.value.trim()===entry.text){input.value='';input.style.height='38px';S.drafts.delete(peer)}
 if(S.replies.get(peer)===entry.reply)S.replies.delete(peer);
 const attachment=entry.mediaJob;
 if(attachment&&S.attachments.get(peer)===attachment){S.attachments.delete(peer);if(attachment.url)URL.revokeObjectURL(attachment.url)}
 rememberThread();document.querySelector('#c2-thread .c3-bar')?.classList.toggle('typed',!!input.value.trim());renderReply();
 // Poll failures must not turn a server-confirmed send into a failed send.
 void wm70PollDM();
}

function back(){
 rememberThread();stopRecording(false);closeSettings();
 S.mediaObserver?.disconnect();S.mediaObserver=null;
 WM70.peer=null;++WM70.dmSeq;document.body.classList.remove('dt-open','wk-typing');S.peer=0;S.listKey='';drawList();
 try{wm70RefreshSocial()}catch{}
}

function clearChatState(){
 stopRecording(false);S.player?.pause();S.player?.remove();S.player=null;
 S.mediaObserver?.disconnect();S.mediaObserver=null;
 for(const job of S.attachments.values()){job.cancelled=true;if(job.url)URL.revokeObjectURL(job.url)}
 S.attachments.clear();S.drafts.clear();S.replies.clear();S.outbox.clear();S.draftRevision.clear();
 for(const value of media.values())Promise.resolve(value).then(url=>URL.revokeObjectURL(url)).catch(()=>{});
 media.clear();WM70.threadCache?.clear();
}
