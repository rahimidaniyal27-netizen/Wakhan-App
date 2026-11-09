async function wm70Friend(action,uid){
 if(WM70.friendBusy)return;WM70.friendBusy=true;
 try{await wm70Request('friends',{action,uid:Number(uid)});await wm70RefreshFriends();if(WM70.modal==='profile'&&WM70.profileId===Number(uid))await wm70OpenProfile(uid);if(WM70.peer===Number(uid))await wm70PollDM();else if(TAB==='d'&&!WM70.peer)wm70ChatDraw()}
 catch(error){toast(wm70Error(error))}finally{WM70.friendBusy=false}
}
async function wm70RefreshFriends(){const seq=WM70.friendsSeq=(WM70.friendsSeq||0)+1,value=await wm70Request('friends');if(seq===WM70.friendsSeq){WM70.friends=value;for(const key of ['friends','incoming','outgoing','blocked'])for(const p of value[key]||[])wm70Remember(p)}return value}
function wm70OpenFriends(){WM70.tab='friends';WM70.peer=null;go('d');wm70RefreshFriends().then(()=>{if(TAB==='d'&&!WM70.peer)wm70ChatDraw()}).catch(error=>toast(wm70Error(error)))}
function wm70PeerRow(p,extra=''){return `<article class="wm70-peer-row"><button onclick="wm70OpenProfile(${Number(p.id)})">${wm70Avatar(p)}<span><b class="wn-inline" dir="auto">${h(p.name)}</b>${p.last?`<small class="wn-inline" dir="auto">${h(p.last.slice(0,90))}</small>`:''}</span></button>${extra||`<button class="wm70-row-action" onclick="wm70OpenDM(${Number(p.id)})">${h(wm70T('chat'))}${p.unread?`<i>${Number(p.unread)}</i>`:''}</button>`}</article>`}
function wm70ChatDraw(){
 if(TAB!=='d')return;
 if(WM70.peer){wm70ThreadDraw();return}
 const value=WM70.friends||{},list=WM70.tab==='friends'?value.friends||[]:WM70.tab==='requests'?[...(value.incoming||[]),...(value.outgoing||[])]:WM70.inbox;
 V().innerHTML=`<main class="wn-page wm70-conversations"><div class="wn-eyebrow">WAKHAN SOCIAL</div><h1 class="wn-heading">${h(wm70T('chat'))}</h1><form class="wn-search" onsubmit="event.preventDefault();wm70Search()">${wnIcon('search')}<input id="wm70-search" type="search" placeholder="${h(wm70T('search'))}" maxlength="60"><button type="submit">${wnIcon('forward')}</button></form><div id="wm70-search-results"></div><div class="wm70-tabs">${['messages','friends','requests'].map(tab=>`<button class="${WM70.tab===tab?'on':''}" onclick="WM70.tab='${tab}';wm70ChatDraw()">${h(wm70T(tab))}${tab==='requests'&&(value.incoming||[]).length?` <i>${value.incoming.length}</i>`:''}</button>`).join('')}</div><div class="wm70-peer-list">${list.length?list.map(p=>wm70PeerRow(p,WM70.tab==='requests'?`<button class="wm70-row-action" onclick="wm70OpenProfile(${Number(p.id)})">${h(wm70T(p.relation==='incoming'?'incoming':'outgoing'))}</button>`:'')).join(''):`<p class="wm70-muted">${h(wm70T('empty'))}</p>`}</div></main>`;
}
async function wm70Search(){const input=document.getElementById('wm70-search'),output=document.getElementById('wm70-search-results');if(!input||!output)return;const query=input.value.trim(),seq=++WM70.searchSeq;if(query.length<2)return;output.innerHTML=`<p>${h(wm70T('loading'))}</p>`;try{const result=await wm70Request('search?q='+encodeURIComponent(query));if(seq!==WM70.searchSeq||TAB!=='d'||WM70.peer||!output.isConnected)return;for(const p of result.users)wm70Remember(p);output.innerHTML=result.users.length?result.users.map(p=>wm70PeerRow(p,`<button onclick="wm70OpenProfile(${Number(p.id)})">${h(wm70T('profile'))}</button>`)).join(''):`<p>${h(wm70T('empty'))}</p>`}catch(error){if(seq===WM70.searchSeq&&output.isConnected)output.innerHTML=`<p>${h(wm70Error(error))}</p>`}}
async function wm70OpenDM(uid){
 WM70.modal=null;closeSheet();++WM70.profileSeq;++WM70.dmSeq;WM70.peer=Number(uid);WM70.messages=[];WM70.dmCanSend=false;WM70.dmError='';WM70.dmPending=null;go('d');await wm70PollDM(true);
}
function wm70ThreadDraw(){const p=WM70.people.get(WM70.peer)||{id:WM70.peer,name:'Wakhan'},back=`WM70.peer=null;++WM70.dmSeq;wm70ChatDraw();wm70RefreshSocial()`;
 V().innerHTML=`<main class="wn-page wm70-thread"><div class="wm70-thread-head"><button onclick="${back}" aria-label="${h(wnT('back'))}">‹</button><button onclick="wm70OpenProfile(${WM70.peer})">${wm70Avatar(p)}<b class="wn-inline">${h(p.name)}</b></button></div><button class="wm70-older" onclick="wm70Older()">${h(wm70T('older'))}</button><div id="wm70-dm-messages" class="wm70-dm-messages"></div><p id="wm70-dm-notice" class="wm70-muted">${h(WM70.dmError||(!WM70.dmCanSend?wm70T('friendFirst'):''))}</p><form class="wm70-compose" onsubmit="event.preventDefault();wm70SendDM()"><textarea id="wm70-dm-text" rows="1" maxlength="2000" placeholder="${h(wm70T('write'))}" dir="auto"></textarea><button type="submit" ${WM70.dmCanSend?'':'disabled'}>${h(wm70T('send'))}</button></form></main>`;wm70DMMessages();
}
function wm70DMMessages(){const out=document.getElementById('wm70-dm-messages');if(!out)return;const bottom=out.scrollHeight-out.scrollTop-out.clientHeight<90;out.innerHTML=WM70.messages.map(m=>`<article class="wm70-message ${Number(m.sender)===Number(ME.me.id)?'mine':''}" data-message="${Number(m.id)}"><bdi class="wn-inline wm70-native-emoji">${h(m.text)}</bdi><small>${new Date(m.ts*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</small></article>`).join('');if(bottom)out.scrollTop=out.scrollHeight;const notice=document.getElementById('wm70-dm-notice');if(notice)notice.textContent=WM70.dmError||(!WM70.dmCanSend?wm70T('friendFirst'):'');const button=document.querySelector('.wm70-compose button');if(button)button.disabled=!WM70.dmCanSend||WM70.dmBusy}
async function wm70PollDM(initial=false){
 const peer=WM70.peer;if(!peer||TAB!=='d'||WM70.pollingDM)return;const seq=WM70.dmSeq;WM70.pollingDM=true;
 try{const after=initial?0:Math.max(0,...WM70.messages.map(v=>v.id)),result=await wm70Request('dm?uid='+peer+(after?'&after='+after:''));if(peer!==WM70.peer||seq!==WM70.dmSeq||TAB!=='d')return;wm70Remember(result.peer);WM70.dmCanSend=result.can_send;WM70.dmError='';const ids=new Set(WM70.messages.map(v=>v.id));for(const m of result.messages)if(!ids.has(m.id))WM70.messages.push(m);WM70.messages.sort((a,b)=>a.id-b.id);wm70DMMessages();if(document.visibilityState!=='hidden'){const last=Math.max(0,...WM70.messages.filter(v=>Number(v.sender)!==Number(ME.me.id)).map(v=>v.id));if(last)wm70Request('dm',{action:'read',uid:peer,last_id:last}).catch(()=>{})}}
 catch(error){if(peer===WM70.peer&&seq===WM70.dmSeq){WM70.dmError=wm70Error(error);wm70DMMessages()}}
 finally{WM70.pollingDM=false}
}
async function wm70SendDM(){
 const input=document.getElementById('wm70-dm-text'),peer=WM70.peer,text=input?.value.trim();if(!text||WM70.dmBusy||!WM70.dmCanSend)return;
 const pending=WM70.dmPending?.uid===peer&&WM70.dmPending.text===text?WM70.dmPending:{uid:peer,text,client_key:wm70Key()};WM70.dmPending=pending;WM70.dmBusy=true;wm70DMMessages();
 try{await wm70Request('dm',pending);if(peer===WM70.peer){if(input.value.trim()===text)input.value='';WM70.dmPending=null;await wm70PollDM()}}
 catch(error){toast(wm70Error(error))}finally{WM70.dmBusy=false;if(peer===WM70.peer)wm70DMMessages()}
}
async function wm70Older(){const peer=WM70.peer,seq=WM70.dmSeq,before=Math.min(...WM70.messages.map(v=>v.id));if(!peer||!Number.isFinite(before))return;try{const result=await wm70Request('dm?uid='+peer+'&before='+before);if(peer!==WM70.peer||seq!==WM70.dmSeq)return;const ids=new Set(WM70.messages.map(v=>v.id));WM70.messages.unshift(...result.messages.filter(v=>!ids.has(v.id)));wm70DMMessages()}catch(error){toast(wm70Error(error))}}
async function wm70RefreshSocial(){
 if(!ME?.me||WM70.socialBusy)return;WM70.socialBusy=true;
 try{const [inbox]=await Promise.all([wm70Request('inbox'),wm70RefreshFriends()]);WM70.inbox=inbox.threads;WM70.unread=inbox.unread;for(const p of inbox.threads)wm70Remember(p);WM70.lastInbox=Date.now();renderNav();if(TAB==='d'&&!WM70.peer&&!document.activeElement?.matches?.('input,textarea'))wm70ChatDraw()}
 catch(error){}finally{WM70.socialBusy=false}
}
