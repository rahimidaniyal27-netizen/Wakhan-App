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
 box.style.setProperty('--h4-cols',seats.length<=4?Math.max(2,seats.length):seats.length<=9?3:4);
 box.style.setProperty('--h4-compact-rows',seats.length<=5?1:2);
 if(box.children.length!==seats.length||!box.dataset.royal){box.innerHTML=seats.map((_,i)=>`<button type="button" class="h2-seat is-empty" data-i="${i}"><span class="h2-face">${royalThrone(i)}<span class="h2-av"></span><i class="h2-mic"></i></span><b class="h2-name"></b></button>`).join('');box.dataset.royal='1';S.seatAv=[];S.seatSig=[]}
 const h=info(),locks=new Set(h?.locks||[]),host=Number(h?.owner_id)||0;
 seats.forEach((x,i)=>{const el=box.children[i],p=x?person(x):null;
  if(p)try{wm70Remember(p)}catch{}
  const av=p?JSON.stringify([p.id,p.avatar,p.halo,p.name,p.online]):locks.has(i)?'L':'E';
  const mute=!!p&&micMuted(p.id),mine=!!p&&p.id===me(),hst=!!p&&p.id===host,sig=[mute,mine,hst].join();
  if(S.seatAv[i]!==av){S.seatAv[i]=av;setHtml(el.querySelector('.h2-av'),p?face(p):locks.has(i)?ic('lock'):'');setText(el.querySelector('.h2-name'),p?p.name:'');el.classList.toggle('is-empty',!p);el.classList.toggle('is-locked',!p&&locks.has(i));el.dataset.uid=p?String(p.id):'';setAttr(el,'aria-label',p?tx('profile')+' · '+p.name:royalWords('seat'));S.seatSig[i]=null}
  if(S.seatSig[i]!==sig){S.seatSig[i]=sig;el.classList.toggle('is-me',mine);el.classList.toggle('is-host',hst);el.classList.toggle('is-muted',mute);setHtml(el.querySelector('.h2-mic'),p?ic(mute?'muted':'mic'):'')}
 });speaking();royalPaint();
}

function royalPaint(){
 const room=root();if(!room||!mounted())return;room.classList.add('h4-royal');
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
 const revision=CS?.room_layout?.background_revision||'',key=CID+'|'+revision;
 if(S.royalBgKey!==key){
  S.royalBgKey=key;if(S.royalBgUrl){URL.revokeObjectURL(S.royalBgUrl);S.royalBgUrl=null}room.classList.remove('h4-background');room.style.removeProperty('--h4-background');
  if(revision){const code=CID;fetch('/api/app/rooms/'+encodeURIComponent(code)+'/background?r='+encodeURIComponent(revision)).then(response=>{if(!response.ok)throw Error('background');return response.blob()}).then(blob=>{if(!mounted()||CID!==code||S.royalBgKey!==key)return;S.royalBgUrl=URL.createObjectURL(blob);room.style.setProperty('--h4-background',`url("${S.royalBgUrl}")`);room.classList.add('h4-background')}).catch(()=>{})}
 }
}

function royalSilence(){
 try{YTP?.stopVideo?.();WMC.loaded=null;WMC.error=''}catch{}
 try{++SX.mediaToken;SX.audioKey=null;SX.audioLoading=false;SX.audio?.pause();if(SX.audio){SX.audio.removeAttribute('src');SX.audio.load()}}catch{}
 try{if(typeof nxStop==='function')nxStop()}catch{}
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
 const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.onchange=()=>{
  const file=input.files?.[0];if(!file)return;const url=URL.createObjectURL(file),image=new Image();
  image.onload=()=>{try{const ratio=Math.min(1,1600/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);void upload({data:canvas.toDataURL('image/jpeg',.84)})}finally{URL.revokeObjectURL(url)}};
  image.onerror=()=>{URL.revokeObjectURL(url);if(status)status.textContent=royalWords('error')};image.src=url;
 };input.click();
}
