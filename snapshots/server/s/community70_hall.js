function wm70MountHall(){
 if(TAB!=='c'||!CID)return;
 for(const seat of document.querySelectorAll('#hall .seat[data-u]')){const id=Number(seat.dataset.u);if(!id)continue;seat.onclick=()=>wm70OpenProfile(id);const p=CS.seats?.find(v=>v&&Number(v.id)===id);if(p?.community)wm70Remember(p.community);const image=seat.querySelector('.ch>img');if(image&&p?.avatar){image.dataset.wm70Avatar='1';if(image.getAttribute('src')!==p.avatar)image.src=p.avatar}}
 if(CS?.mine<0){document.getElementById('wm70-live-compose')?.remove();document.getElementById('wm70-live-chat')?.remove();return}
 const stage=document.getElementById('wmc-stage');if(!stage)return;stage.classList.add('wm70-stage');
 if(!stage.querySelector('#wm70-live-chat')){const panel=document.createElement('section');panel.id='wm70-live-chat';panel.className='wm70-live-chat';panel.innerHTML='<div id="wm70-live-messages" class="wm70-live-messages"></div>';stage.appendChild(panel)}
 if(!document.getElementById('wm70-live-compose')){const form=document.createElement('form');form.id='wm70-live-compose';form.className='wm70-live-compose';form.onsubmit=event=>{event.preventDefault();wm70SendRoom()};form.innerHTML=`<input id="wm70-room-text" maxlength="1000" autocomplete="off" placeholder="${h(wm70T('roomWrite'))}" dir="auto"><button type="submit">${h(wm70T('send'))}</button>`;stage.insertAdjacentElement('afterend',form)}
 if(WM70.hall!==CID){WM70.hall=CID;WM70.hallMessages=[];WM70.hallCursor=0;++WM70.hallSeq;WM70.hallBusy=false;WM70.roomPending=null;wm70PollHall()}
 wm70HallMessages();
}
function wm70HallMessages(){const out=document.getElementById('wm70-live-messages');if(!out||WM70.hall!==CID)return;out.innerHTML=WM70.hallMessages.slice(-12).map(m=>`<article class="wm70-live-message"><button onclick="wm70OpenProfile(${Number(m.sender.id)})">${wm70Avatar(m.sender)}<b class="wn-inline">${h(m.sender.name)}</b></button>${m.kind==='gift'?`<span class="wm70-live-gift">${wm70GiftArt(m.detail.gift)}<b>${h(wm70Name(WM70.gifts.find(v=>v.code===m.detail.gift)))} ↗ ${h(WM70.people.get(Number(m.detail.target))?.name||'')}</b></span>`:`<bdi class="wn-inline wm70-native-emoji">${h(m.text)}</bdi>`}</article>`).join('');out.scrollTop=out.scrollHeight}
async function wm70PollHall(){
 if(TAB!=='c'||!CID||CS?.mine<0||WM70.hallBusy)return;const room=CID,seq=WM70.hallSeq;WM70.hallBusy=true;
 try{const result=await wm70Request('hall?room='+encodeURIComponent(room)+'&after='+WM70.hallCursor);if(TAB!=='c'||CID!==room||seq!==WM70.hallSeq)return;const ids=new Set(WM70.hallMessages.map(m=>m.id));for(const m of result.messages){wm70Remember(m.sender);if(!ids.has(m.id))WM70.hallMessages.push(m)}WM70.hallMessages=WM70.hallMessages.slice(-100);WM70.hallCursor=result.cursor;WM70.hallPeople=result.people;for(const p of result.people)wm70Remember(p);wm70HallMessages()}
 catch(error){}finally{if(seq===WM70.hallSeq)WM70.hallBusy=false}
}
async function wm70SendRoom(){
 const input=document.getElementById('wm70-room-text'),room=CID,text=input?.value.trim();if(!text||WM70.sendingRoom||CS?.mine<0)return;const pending=WM70.roomPending?.room===room&&WM70.roomPending.text===text?WM70.roomPending:{room,text,client_key:wm70Key()};WM70.roomPending=pending;WM70.sendingRoom=true;
 try{await wm70Request('hall',pending);if(room===CID){if(input.value.trim()===text)input.value='';WM70.roomPending=null;await wm70PollHall()}}
 catch(error){toast(wm70Error(error))}finally{WM70.sendingRoom=false}
}
async function wm70GiftPicker(uid){
 if(TAB!=='c'||!CID||CS?.mine<0)return toast(wm70T('seat'));if(!CS.seats.some(v=>v&&Number(v.id)===Number(uid)))return toast(wm70T('recipientLeft'));
 WM70.modal='gift';WM70.gift={uid:Number(uid),room:CID,selected:null,key:null};++WM70.giftSeq;
 if(!WM70.gifts.length){const value=await wm70Request('gifts').catch(()=>null);if(value)WM70.gifts=value.gifts}
 wm70GiftDraw();
}
function wm70GiftDraw(){if(WM70.modal!=='gift'||!WM70.gift)return;const p=WM70.people.get(WM70.gift.uid)||{name:'Wakhan'};sheet(`<section class="wm70-gift-picker"><div class="wm70-title"><h3>${h(wm70T('gift'))} · <span class="wn-inline">${h(p.name)}</span></h3><button onclick="WM70.modal=null;WM70.gift=null;closeSheet()">×</button></div><div class="wm70-gift-grid">${WM70.gifts.map(g=>`<button onclick="wm70GiftQuote('${g.code}')" ${WM70.giftBusy?'disabled':''}>${wm70GiftArt(g)}<b>${h(wm70Name(g))}</b><small>${h(g.coins)} ${h(wc23T('coins'))}</small></button>`).join('')}</div></section>`)}
async function wm70GiftQuote(code){
 const context=WM70.gift;if(!context||WM70.giftBusy)return;const seq=++WM70.giftSeq;WM70.giftBusy=true;wm70GiftDraw();
 try{const value=await wm70Request('gifts',{action:'quote',uid:context.uid,room:context.room,gift:code});if(WM70.gift!==context||seq!==WM70.giftSeq||CID!==context.room||WM70.modal!=='gift')return;context.selected=value;context.key=wm70Key();sheet(`<section class="wm70-gift-confirm"><h3>${h(wm70T('giftConfirm'))}</h3>${wm70GiftArt(value.gift)}<h3>${h(wm70Name(value.gift))}</h3><p><span class="wn-inline">${h(value.recipient.name)}</span> · ${h(value.gift.coins)} ${h(wc23T('coins'))}</p><button class="wn-primary" onclick="wm70GiftSend()">${h(wm70T('send'))}</button><button class="wn-secondary" onclick="wm70GiftDraw()">${h(wm70T('cancel'))}</button></section>`)}
 catch(error){toast(wm70Error(error))}finally{WM70.giftBusy=false;if(WM70.gift===context&&!context.selected&&WM70.modal==='gift')wm70GiftDraw()}
}
async function wm70GiftSend(){
 const context=WM70.gift;if(!context?.selected||WM70.giftBusy)return;WM70.giftBusy=true;const button=document.querySelector('.wm70-gift-confirm .wn-primary');if(button)button.disabled=true;
 try{const value=await wm70Request('gifts',{action:'send',uid:context.uid,room:context.room,gift:context.selected.gift.code,token:context.selected.token,client_key:context.key});if(WC23.data)WC23.data.balance=value.balance;if(WM70.gift===context){WM70.modal=null;WM70.gift=null;closeSheet()}toast(wm70T('giftSent'));if(CID===context.room)await wm70PollHall();wc23Refresh?.()}
 catch(error){if(error.message==='quote_invalid'||error.message==='quote_changed'){context.selected=null;context.key=null}toast(wm70Error(error))}finally{WM70.giftBusy=false;if(button?.isConnected)button.disabled=false;if(WM70.gift===context&&!context.selected&&WM70.modal==='gift')wm70GiftDraw()}
}
