function royalWords(key){
 const lang=String(typeof LG!=='undefined'?LG:document.documentElement.lang).slice(0,2);
 const words={fa:{seat:'جایگاه',capacity:'تعداد جایگاه‌ها',occupied:'تعداد افراد حاضر بیشتر است؛ اول جایگاه‌ها را خالی کن.',stop:'پایان پخش',controls:'کنترل پخش',background:'عکس پس‌زمینه',choose:'انتخاب از گالری',remove:'برداشتن عکس',saved:'ذخیره شد',error:'انجام نشد؛ دوباره تلاش کن',close:'برگشت'},ps:{seat:'څوکۍ',capacity:'د څوکیو شمېر',occupied:'لومړی اضافي څوکۍ تشې کړئ.',stop:'خپرونه پای',controls:'د خپرونې کنټرول',background:'شالید انځور',choose:'له ګالرۍ غوره کړئ',remove:'انځور لرې کړئ',saved:'وساتل شو',error:'بیا هڅه وکړئ',close:'شاته'},en:{seat:'Seat',capacity:'Seats',occupied:'There are more people seated. Free seats before reducing capacity.',stop:'Stop playback',controls:'Playback controls',background:'Room background',choose:'Choose photo',remove:'Remove photo',saved:'Saved',error:'Could not complete; try again',close:'Back'}};
 return (words[lang]||words.en)[key]||key;
}

function royalThrone(){
 const url=new URL('/royal-seat.webp',window.WAKHAN_NATIVE_N1?.assetOrigin||location.origin).href;
 return `<img class="h4-throne" src="${esc(url)}" alt="" aria-hidden="true" draggable="false" decoding="async" width="100" height="116">`;
}

function paintSeats(){
 const box=$('hall');if(!box||!CS||!Array.isArray(CS.seats))return;const seats=CS.seats;
 if(S.royalChatRoom!==CID){S.royalChatRoom=CID;royalResetChat()}
 box.style.setProperty('--h4-cols',10);root()?.setAttribute('data-h4-capacity',String(seats.length));
 box.style.setProperty('--h4-compact-rows',seats.length<=5?1:2);
 if(box.children.length!==seats.length||!box.dataset.royal){box.innerHTML=seats.map((_,i)=>`<button type="button" class="h2-seat is-empty" data-i="${i}"><span class="h2-face">${royalThrone(i)}<span class="h2-av"></span><i class="h2-mic"></i></span><b class="h2-name"></b></button>`).join('');box.dataset.royal='1';S.seatAv=[];S.seatSig=[]}
 const h=info(),locks=new Set(h?.locks||[]),host=Number(h?.owner_id)||0;
 seats.forEach((x,i)=>{const el=box.children[i],p=x?person(x):null;
  const remainder=seats.length%5,first=remainder&&i<remainder,position=i-(remainder||0);
  el.style.gridColumn=(first?6-remainder+2*i:1+2*((remainder?position:i)%5))+' / span 2';el.style.gridRow=String(first?1:1+(remainder?1:0)+Math.floor((remainder?position:i)/5));
  if(p)try{wm70Remember(p)}catch{}
  const av=p?JSON.stringify([p.id,p.avatar,p.halo,p.frame_style,p.name,p.online]):locks.has(i)?'L':'E';
  const mute=!!p&&micMuted(p.id),mine=!!p&&p.id===me(),hst=!!p&&p.id===host,sig=[mute,mine,hst].join();
  if(S.seatAv[i]!==av){S.seatAv[i]=av;setHtml(el.querySelector('.h2-av'),p?face(p):locks.has(i)?ic('lock'):'');setText(el.querySelector('.h2-name'),p?p.name:'');el.classList.toggle('is-empty',!p);el.classList.toggle('is-locked',!p&&locks.has(i));el.dataset.uid=p?String(p.id):'';setAttr(el,'aria-label',p?tx('profile')+' · '+p.name:royalWords('seat'));S.seatSig[i]=null}
  if(S.seatSig[i]!==sig){S.seatSig[i]=sig;el.classList.toggle('is-me',mine);el.classList.toggle('is-host',hst);el.classList.toggle('is-muted',mute);setHtml(el.querySelector('.h2-mic'),p?ic(mute?'muted':'mic'):'')}
 });speaking();royalPaint();
}

function royalPaint(){
 const room=root();if(!room||!mounted())return;room.classList.add('h4-royal');
 let unlock=room.querySelector('.h4-audio-unlock');
 if(!unlock){unlock=document.createElement('button');unlock.type='button';unlock.className='h4-audio-unlock';unlock.textContent=String(document.documentElement.lang).startsWith('fa')?'برای شنیدن صدا بزن':String(document.documentElement.lang).startsWith('de')?'Ton einschalten':'Enable room audio';unlock.onclick=()=>wmqResumeVoiceAudio();room.querySelector('.h2-foot')?.prepend(unlock)}
 unlock.hidden=!SX.audioBlocked||SX.speaker===false;
 const stage=$('wmc-stage'),screen=stage?.querySelector('.screen'),toolbar=stage?.querySelector('.wmc-stage-toolbar');
 if(screen&&toolbar){
  if(toolbar.parentElement!==screen)screen.append(toolbar);
  let tap=screen.querySelector('.h4-screen-tap');
  if(!tap){tap=document.createElement('button');tap.type='button';tap.className='h4-screen-tap';tap.setAttribute('aria-label',royalWords('controls'));screen.append(tap);tap.onclick=()=>royalReveal(!stage.classList.contains('h4-controls-visible'));toolbar.addEventListener('pointerdown',()=>clearTimeout(S.royalControlsTimer));toolbar.addEventListener('pointerup',()=>royalReveal(true));screen.addEventListener('keydown',()=>royalReveal(true))}
  let stop=toolbar.querySelector('.h4-stop');
  if(!stop){stop=document.createElement('button');stop.type='button';stop.className='h4-stop';stop.onclick=royalStop;stop.textContent=royalWords('stop');toolbar.append(stop)}
  stop.hidden=CS?.can===false;
  if(S.royalVideo!==String(CS?.vid||'')){if(S.royalVideo&&!CS?.vid)royalSilence();S.royalVideo=String(CS?.vid||'');royalReveal(!!CS?.vid)}
 }
 const messages=$('wm70-live-messages'),notice=room.querySelector('.h2-notice')||(S.royalNoticeRoom===CID?S.royalNotice:null);
 if(messages&&notice&&notice.parentElement!==messages){messages.prepend(notice);S.royalNotice=notice;S.royalNoticeRoom=CID}
 const revision=CS?.room_layout?.background_revision||'',key=CID+'|'+revision;
 if(S.royalBgKey!==key){
  S.royalBgKey=key;if(S.royalBgUrl){URL.revokeObjectURL(S.royalBgUrl);S.royalBgUrl=null}room.classList.remove('h4-background');room.style.removeProperty('--h4-background');
  if(revision){const code=CID;fetch('/api/app/rooms/'+encodeURIComponent(code)+'/background?r='+encodeURIComponent(revision)).then(response=>{if(!response.ok)throw Error('background');return response.blob()}).then(blob=>{if(!mounted()||CID!==code||S.royalBgKey!==key)return;S.royalBgUrl=URL.createObjectURL(blob);room.style.setProperty('--h4-background',`url("${S.royalBgUrl}")`);room.classList.add('h4-background')}).catch(()=>{})}
 }
}

function royalSilence(){
 try{YTP?.stopVideo?.();WMC.loaded=null;WMC.error=''}catch{}
 try{++SX.mediaToken;SX.audioKey=null;SX.audioLoading=false;SX.audio?.pause();if(SX.audio){SX.audio.removeAttribute('src');SX.audio.load()}}catch{}
 try{if(typeof NX!=='undefined'){NX.video?.pause();NX.video?.removeAttribute('src');NX.video?.load();NX.key=null;NX.loading=false;NX.error=false;NX.blocked=false}}catch{}
}

function royalReveal(show=true){
 const stage=$('wmc-stage');if(!stage)return;
 clearTimeout(S.royalControlsTimer);stage.classList.toggle('h4-controls-visible',show);
 const toolbar=stage.querySelector('.wmc-stage-toolbar');if(toolbar){toolbar.inert=!show;toolbar.setAttribute('aria-hidden',String(!show))}
 if(show)S.royalControlsTimer=setTimeout(()=>royalReveal(false),3000);
}

async function royalStop(){
 const code=CID,button=root()?.querySelector('.h4-stop');if(!code)return;
 if(button)button.disabled=true;
 try{const value=await api('/api/app/rooms/'+code+'/stop',{});if(!value.ok)throw Error('stop');if(CID===code){cinSet(value);royalReveal(false)}}catch{say(royalWords('error'))}finally{if(button?.isConnected)button.disabled=false}
}

function royalLayoutSettings(){
 const count=CS?.room_layout?.seat_count||CS?.seats?.length||10;
 return `<div class="h2-card h4-layout"><label>${esc(royalWords('capacity'))}<select data-seat-count onchange="H2.setSeats(Number(this.value))">${Array.from({length:15},(_,i)=>i+2).map(value=>`<option value="${value}" ${value===count?'selected':''}>${value}</option>`).join('')}</select></label><div class="h4-background-actions"><button type="button" onclick="H2.royalBackground()">${ic('gallery')} ${esc(royalWords('choose'))}</button>${CS?.room_layout?.background_revision?`<button type="button" onclick="H2.royalBackground(true)">${esc(royalWords('remove'))}</button>`:''}</div><p class="h4-layout-status" role="status"></p></div>`;
}

async function royalSetSeats(count){
 const code=CID,select=document.querySelector('[data-seat-count]'),status=document.querySelector('.h4-layout-status');if(select)select.disabled=true;
 try{const result=await api('/api/app/rooms/'+code+'/layout',{seat_count:count});if(!result.ok)throw Error(result.err);if(code!==CID)return;const state=await api('/api/c/'+code+'?v=0');if(state.ok)cinSet(state);if(status)status.textContent=royalWords('saved')}
 catch(error){if(status)status.textContent=royalWords(error.message==='seats_occupied'?'occupied':'error');if(select)select.value=CS?.seats?.length||10}
 finally{if(select)select.disabled=false}
}

async function royalBackground(remove=false){
 const code=CID,status=document.querySelector('.h4-layout-status');
 async function upload(body){try{const result=await api('/api/app/rooms/'+code+'/background',body);if(!result.ok)throw Error('image');if(code===CID){if(CS)CS.room_layout=result.layout;royalPaint();if(status)status.textContent=royalWords('saved')}}catch{if(status)status.textContent=royalWords('error')}}
 if(remove)return upload({remove:true});
 const input=document.createElement('input');input.type='file';input.accept='image/*';input.style.display='none';document.body.append(input);input.oncancel=()=>input.remove();input.onchange=()=>{
  input.remove();
  const file=input.files?.[0];if(!file)return;const url=URL.createObjectURL(file),image=new Image();
  image.onload=()=>{try{const ratio=Math.min(1,1600/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);void upload({data:canvas.toDataURL('image/jpeg',.84)})}finally{URL.revokeObjectURL(url)}};
  image.onerror=()=>{URL.revokeObjectURL(url);if(status)status.textContent=royalWords('error')};image.src=url;
 };input.click();
}

function kb(){
 S.raf=0;const room=root();if(!room)return;
 const viewport=window.__h2vv||window.visualViewport,visible=Math.round(viewport?.height||innerHeight),offset=Math.round(Math.max(0,viewport?.offsetTop||0)),width=Math.round(innerWidth);
 const typing=document.activeElement===$('wm70-room-text');
 if(typing)S.royalKeyboardUntil=Date.now()+900;
 if(!S.royalFullHeight||S.royalWidth!==width||(!typing&&(Date.now()>(S.royalKeyboardUntil||0)||visible+offset>=S.royalFullHeight-40))){S.royalFullHeight=visible+offset;S.royalWidth=width}
 const full=S.royalFullHeight,keyboard=Math.max(0,full-visible-offset);
 room.style.setProperty('--h2-h',full+'px');room.style.setProperty('--h4-keyboard-bottom',keyboard+'px');room.style.transform='';
 const top=room.querySelector('.h2-top');if(top)room.style.setProperty('--h4-chat-top',Math.round(top.getBoundingClientRect().bottom-room.getBoundingClientRect().top)+'px');
 const changed=room.classList.contains('is-typing')!==typing;
 room.classList.toggle('is-typing',typing);document.body.classList.toggle('wk-typing',typing);
 if(changed&&typing)requestAnimationFrame(()=>{const out=$('wm70-live-messages');if(out)out.scrollTop=out.scrollHeight});
}

function speaking(id){
 const box=$('hall');if(!box)return;
 for(const node of box.children){const uid=node.dataset.uid;
  // A reused seat must also clear its previous occupant's visual state.
  const on=!!uid&&!node.classList.contains('is-empty')&&!!VC.spk[uid]&&!micMuted(uid),level=on?Math.min(1,Math.max(0,Number(VC.levels?.[uid])||0)):0;
  if(node.classList.contains('is-speaking')!==on)node.classList.toggle('is-speaking',on);
  const value=level.toFixed(3);if(node.style.getPropertyValue('--h4-voice-level')!==value)node.style.setProperty('--h4-voice-level',value);
 }
}

function royalNavigate(k,sub){
 const leaving=inHall()&&CV==='hall'&&(k!=='c'||window.WakhanCinema?.opening);
 const returning=k==='c'&&S.min&&!window.WakhanCinema?.opening;
 if(leaving||returning)royalResetChat();
 if(k==='c'&&window.WakhanCinema?.opening){
  const show=()=>{CV='lobby';return old.go(k,sub)};
  if(!S.min&&inHall()&&seated())return minimize(k,sub,show);
  return show();
 }
 if(S.min&&k==='c')return restore(sub,old.go);
 if(!S.min&&inHall()&&k!=='c'&&seated()&&CV==='hall')return minimize(k,sub,old.go);
 return old.go.apply(this,arguments);
}

async function speaker(){
 vib();
 if(SX.audioBlocked&&SX.speaker!==false){wmqResumeVoiceAudio();paintVoice();return}
 try{await sxSpeaker()}catch{}
 paintVoice();
}

function msgNode(m){
 const p=m.sender||{},name=p.name||'Wakhan',gift=m.kind==='gift';
 const node=document.createElement('article');node.className='h2-msg'+(Number(p.id)===me()?' is-own':'')+(gift?' is-gift':'');node.dataset.id=String(m.id);
 const portrait=document.createElement('button');portrait.type='button';portrait.className='h2-mav';portrait.setAttribute('aria-label',tx('profile')+' · '+name);portrait.onclick=()=>wm70OpenProfile(Number(p.id));portrait.innerHTML=wm70Avatar(p);
 const body=document.createElement('div');body.className='h2-mb';
 const author=document.createElement('button');author.type='button';author.className='h2-mname';author.dir='auto';author.textContent=name;author.onclick=()=>wm70OpenProfile(Number(p.id));body.append(author);
 if(gift){const line=document.createElement('div');line.className='h2-giftline';line.innerHTML=wm70GiftArt(m.detail?.gift);const label=document.createElement('span');label.dir='auto';label.textContent=(wm70Name(WM70.gifts.find(v=>v.code===m.detail?.gift))||tx('gift'))+' ↗ '+(WM70.people.get(Number(m.detail?.target))?.name||'');line.append(label);body.append(line)}
 else{const text=document.createElement('p');text.className='wm70-native-emoji';text.dir='auto';text.textContent=m.text||'';body.append(text)}
 node.append(portrait,body);return node;
}

function royalResetChat(){
 // A new visible visit starts after the current server cursor. Other clients
 // keep their messages; no shared history is deleted.
 ++WM70.hallSeq;WM70.hallBusy=false;WM70.hallMessages=[];WM70.roomPending=null;
 S.base=null;S.chatOn=false;S.nodes?.clear();S.echo=[];
 S.mountAt=Date.now();S.peopleRef=WM70.hallPeople;S.royalChatBaseline=true;
 const out=$('wm70-live-messages');if(out)out.querySelectorAll('.h2-msg,.h2-sys').forEach(node=>node.remove());
}

function baseline(){
 if(S.royalChatBaseline)return false;
 if(S.base!==null)return true;
 const list=WM70.hallMessages||[];
 if(!(WM70.hallCursor>0||WM70.hallPeople!==S.peopleRef||list.length||Date.now()-S.mountAt>5000))return false;
 S.base=list.reduce((a,m)=>Math.max(a,Number(m.id)||0),0);return true;
}
