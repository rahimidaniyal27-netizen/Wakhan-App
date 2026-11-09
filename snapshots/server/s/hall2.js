/* =====================================================================
   WAKHAN HALL v2 — the whole cinema hall in one clean module.

   Screen, top to bottom:   bar · stage · seats · chat · footer
   (a plain column: the chat can never cover the seats).

   Engines that stay as they are and are only *used* here:
     room state  CS / cinStart / cinSet / api("/api/c/…")
     voice       VC / vcJoin / vcMute
     media       WMC / YTP / nxControls / wmcOverlay
     hall chat   WM70 / wm70PollHall / wm70SendRoom
     hall rules  /api/v51/hall   (server module wakhan_hall51.py)

   Rule of this file: draw once, then touch only what changed.
   Sections:
     1 texts & icons      6 seats            11 sheets (menu, settings…)
     2 helpers            7 stage & voice    12 staying in the hall
     3 state              8 chat             13 engine hooks
     4 hall rules (data)  9 keyboard         14 start
     5 page skeleton     10 actions
   ===================================================================== */
(()=>{'use strict';
if(!window.WK_V2||window.H2)return;
if(typeof WM70==='undefined'||typeof WMC==='undefined'||typeof drawHall==='undefined')return;

/* ---------------------------------------------------------------- 1 texts & icons */
const TEXT={
 fa:{room:'سالون واخان',id:'آیدی',say:'یک چیزی بگو…',write:'پیام به سالون…',send:'فرستادن',sitToChat:'برای چت روی یک جایگاه بشین',chatOff:'چت برای تو بسته است',
  choose:'انتخاب فلم یا آهنگ',menu:'گزینه‌های سالون',settings:'تنظیمات',lock:'قفل سالون',unlock:'باز کدن سالون',locked:'سالون قفل شد',opened:'سالون باز شد',
  search:'جستجو',apps:'برنامه‌ها',invite:'دعوت رفیقا',copy:'کاپی کد',films:'فلم‌های مه',leave:'ترک سالون',close:'بستن',
  sure:'از سالون بیرون می‌شی؟',keep:'نگه داشتن سالون',keepSub:'صدا و مایک روشن می‌مانه و بقیه اپ ره می‌گردی',leaveSub:'از جایگاه بلند می‌شی و صدا قطع میشه',cancel:'لغو',backHall:'برگشت به سالون',lost:'جایگاهت در سالون آزاد شد',
  welcome:'به سالون خوش آمدی؛ لطفاً با احترام چت کنین',joined:'وارد سالون شد',left:'از سالون رفت',taken:'ای جایگاه پُر است',
  appsTitle:'از کدام برنامه پخش شوه؟',appsSub:'فلم فقط از برنامهٔ انتخاب‌شده گذاشته میشه',hostOnly:'فقط صاحب سالون برنامه ره عوض کده می‌تانه',
  gift:'تحفه برای کی؟',noOne:'کسی روی جایگاه نیست',msgs:'پیام‌ها',noMsgs:'هنوز پیامی نداری',you:'تو: ',
  emoji:'شکلک‌ها',dice:'تاس بنداز',lucky:'عدد شانس',diceMsg:'🎲 تاس انداخت: ',luckyMsg:'🍀 عدد شانسش: ',
  profile:'دیدن پروفایل',mute:'بی‌صدا',unmute:'باصدا کدن',unseat:'برداشتن از جایگاه',kick:'بیرون کدن از سالون',kickQ:'از سالون بیرون شوه و دوباره داخل آمده نتانه؟',unlockSeat:'باز کدن ای جایگاه',
  notice:'اعلان سالون',noticePh:'یک پیام برای همه که بالای چت سنجاق بمانه…',noNotice:'هنوز اعلانی نگذاشتی',save:'ذخیره',saved:'ذخیره شد',err:'نشد؛ دوباره کوشش کو',
  edit:'ویرایش عکس و نام',access:'دسترسی‌ها',enter:'کی داخل شده می‌تانه',mic:'کی مایک گرفته می‌تانه',chat:'کی چت کده می‌تانه',all:'همه',friends:'رفیقا',closed:'هیچ‌کس',owner:'فقط مه',
  seatLocks:'قفل جایگاه‌ها',seatLocksSub:'روی شمارهٔ هر جایگاه بزن تا قفل یا باز شوه',bg:'پس‌زمینه',gallery:'از گالری',rmPhoto:'حذف عکس',
  people:'حاضرین سالون',nobody:'به جز تو کسی داخل نیست',muted:'بی‌صدا شده‌ها',banned:'بیرون شده‌ها',empty:'خالی است',undo:'برداشتن',
  clear:'پاک کدن همهٔ چت',clearQ:'همهٔ پیام‌های چت سالون برای همه پاک شوه؟',cleared:'چت پاک شد',
  micOn:'مایک باز است',micOff:'مایک بسته است',spkOn:'صدای سالون',spkOff:'صدای سالون بسته',noMedia:'تا حالی چیزی پخش نمیشه',source:'برنامهٔ پخش',
  hall_banned:'صاحب سالون تو ره ازی سالون بیرون کده',hall_closed:'ای سالون فعلاً بسته است',hall_friends:'ای سالون فقط برای رفیقای صاحب سالون است',hall_muted:'صاحب سالون تو ره بی‌صدا کده',
  hall_mic_owner:'مایک ای سالون فقط برای صاحبش است',hall_mic_friends:'مایک فقط برای رفیقای صاحب سالون است',hall_chat_owner:'چت ای سالون فقط برای صاحبش است',hall_chat_friends:'چت فقط برای رفیقای صاحب سالون است',hall_seat_locked:'ای جایگاه قفل است'},
 en:{room:'Wakhan hall',id:'ID',say:'Say something…',write:'Message the hall…',send:'Send',sitToChat:'Take a seat to chat',chatOff:'Chat is closed for you',
  choose:'Choose a film or song',menu:'Hall options',settings:'Settings',lock:'Lock hall',unlock:'Unlock hall',locked:'Hall locked',opened:'Hall opened',
  search:'Search',apps:'Apps',invite:'Invite friends',copy:'Copy code',films:'My films',leave:'Leave hall',close:'Close',
  sure:'Leave the hall?',keep:'Keep the hall',keepSub:'Voice and mic stay on while you browse the app',leaveSub:'You give up your seat and voice ends',cancel:'Cancel',backHall:'Back to hall',lost:'Your seat in the hall was released',
  welcome:'Welcome to the hall — please be kind in the chat',joined:'joined the hall',left:'left the hall',taken:'This seat is taken',
  appsTitle:'Play from which app?',appsSub:'Films can only be added from the selected app',hostOnly:'Only the hall owner can change the app',
  gift:'Gift for whom?',noOne:'Nobody is seated',msgs:'Messages',noMsgs:'No messages yet',you:'You: ',
  emoji:'Emoji',dice:'Roll dice',lucky:'Lucky number',diceMsg:'🎲 rolled: ',luckyMsg:'🍀 lucky number: ',
  profile:'View profile',mute:'Mute',unmute:'Unmute',unseat:'Remove from seat',kick:'Remove from hall',kickQ:'Remove from the hall and block re-entry?',unlockSeat:'Unlock this seat',
  notice:'Announcement',noticePh:'A message pinned above the chat for everyone…',noNotice:'No announcement yet',save:'Save',saved:'Saved',err:'Failed, try again',
  edit:'Edit photo & name',access:'Access',enter:'Who can enter',mic:'Who can use the mic',chat:'Who can chat',all:'Everyone',friends:'Friends',closed:'Nobody',owner:'Only me',
  seatLocks:'Seat locks',seatLocksSub:'Tap a seat number to lock or unlock it',bg:'Background',gallery:'From gallery',rmPhoto:'Remove photo',
  people:'In the hall',nobody:'Nobody else is here',muted:'Muted',banned:'Removed',empty:'Empty',undo:'Undo',
  clear:'Clear the whole chat',clearQ:'Clear all hall chat messages for everyone?',cleared:'Chat cleared',
  micOn:'Microphone on',micOff:'Microphone off',spkOn:'Hall sound',spkOff:'Hall sound off',noMedia:'Nothing is playing yet',source:'Media source',
  hall_banned:'The owner removed you from this hall',hall_closed:'This hall is closed right now',hall_friends:"This hall is only for the owner's friends",hall_muted:'The owner muted you',
  hall_mic_owner:'Only the owner can use the mic here',hall_mic_friends:"Only the owner's friends can use the mic",hall_chat_owner:'Only the owner can chat here',hall_chat_friends:"Only the owner's friends can chat",hall_seat_locked:'This seat is locked'}};
TEXT.ps=Object.assign({},TEXT.fa,{room:'د واخان سالون',say:'یو څه ووایه…',write:'سالون ته پیغام…',send:'لېږل',sitToChat:'د خبرو لپاره ځای ونیسه',menu:'د سالون انتخابونه',settings:'تنظیمات',
 search:'لټون',apps:'پروګرامونه',invite:'ملګرو ته بلنه',copy:'کوډ کاپي',leave:'له سالونه وتل',close:'تړل',sure:'له سالون څخه وځې؟',keep:'سالون وساته',cancel:'لغوه',
 welcome:'سالون ته ښه راغلاست؛ په درناوي خبرې وکړئ',joined:'سالون ته راغی',left:'له سالون ولاړ',save:'ساتل',all:'ټول',friends:'ملګري',owner:'یوازې زه',mute:'چوپ',kick:'وباسه'});
const LANGS=['fa','ps','en'];
const tx=k=>{let l='fa';try{l=String((typeof LG!=='undefined'&&LG)||document.documentElement.lang||'fa').slice(0,2)}catch(e){}return (TEXT[LANGS.includes(l)?l:'en'][k])||TEXT.fa[k]||k};

const SVG=p=>`<svg class="h2-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const OWN={ /* only the shapes the shared Wakhan icon family does not have */
 mega:SVG('<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
 smile:SVG('<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>'),
 keep:SVG('<path d="M4 14v4a2 2 0 0 0 2 2h4M20 10V6a2 2 0 0 0-2-2h-4"/><rect x="12" y="12" width="8" height="8" rx="2"/>'),
 tg:SVG('<path d="M20.5 3.5 10.6 13.4"/><path d="M20.5 3.5 14.4 20.5l-3.8-7.1-7.1-3.8Z"/>')};
const ic=k=>OWN[k]||(typeof wi11==='function'?wi11(k,'h2-i'):'');
const BG={'':'پیش‌فرض',night:'شب شهر',aurora:'شفق',sunset:'غروب',ocean:'دریا',forest:'جنگل',royal:'شاهانه',rose:'گلابی'};
const EMO='😂 😍 🥰 😎 🤩 😢 😡 👏 🙏 🔥 ❤️ 💔 🌹 🎉 👋 💯 😴 🤔 🙈 💪 🇦🇫 🎶 ✨ 🤝'.split(' ');

/* ---------------------------------------------------------------- 2 helpers */
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vib=k=>{try{hap(k)}catch(e){}};
const me=()=>{try{return Number(ME.me.id)||0}catch(e){return 0}};
const say=m=>{try{toast(m)}catch(e){}};
const shut=()=>{try{closeSheet()}catch(e){}};
const ask=(q,fn)=>{try{tg.showConfirm(q,ok=>{if(ok)fn()})}catch(e){if(confirm(q))fn()}};
const later=(fn,ms)=>setTimeout(()=>{try{fn()}catch(e){}},ms||170);
const setHtml=(el,html)=>{if(el&&el.__h!==html){el.innerHTML=html;el.__h=html}};
const setText=(el,v)=>{v=String(v==null?'':v);if(el&&el.textContent!==v)el.textContent=v};
const setAttr=(el,k,v)=>{if(el&&el.getAttribute(k)!==String(v))el.setAttribute(k,v)};
const setOff=(el,v)=>{v=!!v;if(el&&el.disabled!==v)el.disabled=v};
const root=()=>$('wm78-room');
const inHall=()=>{try{return TAB==='c'&&!!CID}catch(e){return false}};
const mounted=()=>{try{return TAB==='c'&&CV==='hall'&&!!CID&&root()?.dataset.room===String(CID)}catch(e){return false}};
const seated=()=>{try{return !!CS&&CS.mine>=0}catch(e){return false}};
const info=()=>S.info&&S.info.code===CID?S.info:null;
const isOwner=()=>!!(info()&&info().is_owner);
function person(x){const mine=Number(x.id)===me(),v=mine&&WM70.self?WM70.self:x.community||{};return {...x,id:Number(x.id),name:v.name||x.name||'Wakhan',avatar:v.avatar||x.avatar||'/ava/'+Number(x.id),halo:v.halo||x.appearance||null,...v}}
function face(p){ /* full avatar with halo, as everywhere else in the app */
 try{if(p.halo?.source===24&&typeof af24Art==='function'&&AF24_ART[p.halo.frame])return `<span class="wm70-avatar"><img src="${esc(p.avatar)}" alt=""><i class="wm70-avatar-halo">${af24Art(p.halo.frame)}</i></span>`;return wm70Avatar(p)}catch(e){return mini(p)}}
const mini=p=>`<img class="h2-mini" src="${esc(p.avatar||'/ava/'+Number(p.id))}" alt="" decoding="async" onerror="this.style.visibility='hidden'">`;
function micMuted(id){if(Number(id)===me())return !VC.on||VC.cid!==CID||VC.mute;const e=(VC.members||[]).find(v=>Number(v.id)===Number(id))||(CS?.vc||[]).find(v=>Number(v.id)===Number(id));return !e||!!e.mute}
const seatedPeople=()=>((CS&&CS.seats)||[]).filter(Boolean).map(person);

/* ---------------------------------------------------------------- 3 state */
const S={
 room:'',info:null,infoAt:0,           /* hall rules for the room on screen          */
 seatAv:[],seatSig:[],rulesSig:'',     /* what each seat shows right now             */
 pend:null,lastVer:-1,seen:null,moving:0, /* seat change in flight                   */
 base:null,mountAt:0,peopleRef:null,   /* chat: only messages after I came in        */
 nodes:new Map(),echo:[],chatOn:false,prevIds:null,
 media:null,listen:false,raf:0,
 min:false,ka:0,bub:null,miss:0,minRoom:''  /* staying in the hall while browsing    */
};

/* ---------------------------------------------------------------- 4 hall rules (data) */
async function loadInfo(force){const c=CID;if(!c)return null;
 if(!force&&info()&&Date.now()-S.infoAt<6000)return S.info;
 try{const j=await api('/api/v51/hall?code='+encodeURIComponent(c));if(j&&j.ok&&j.hall&&CID===c){S.info=Object.assign({code:c},j.hall);S.infoAt=Date.now();applyInfo()}}catch(e){}
 return info()}
async function post(body){vib();
 try{const j=await api('/api/v51/hall',Object.assign({code:CID},body));if(!j||!j.ok)throw Error((j&&j.err)||'x');S.info=Object.assign({code:CID},j.hall);S.infoAt=Date.now();applyInfo();return true}
 catch(e){if(!/^hall_/.test(String(e.message)))say(tx('err'));return false}}
function applyInfo(){const r=root(),h=info();if(!r||!h||!mounted())return;
 if((r.dataset.bg||'')!==(h.bg||''))r.dataset.bg=h.bg||'';
 const img=h.bgphoto?`url("${h.bgphoto}")`:'';if(r.style.getPropertyValue('--h2-photo')!==img){if(img)r.style.setProperty('--h2-photo',img);else r.style.removeProperty('--h2-photo')}
 r.classList.toggle('has-photo',!!img);
 const n=r.querySelector('.h2-notice');if(n){const show=!!h.notice||h.is_owner;n.hidden=!show;if(show)setHtml(n,`<span class="h2-ni">${ic('mega')}</span><p dir="auto">${h.notice?esc(h.notice):`<i>${esc(tx('noNotice'))}</i>`}</p>${h.is_owner?`<button type="button" onclick="H2.notice()" aria-label="${esc(tx('notice'))}">${ic('edit')}</button>`:''}`)}
 try{if(h.can&&h.can.mic===false&&VC.on&&!VC.mute)vcMute()}catch(e){}
 const rs=JSON.stringify([h.locks||[],h.owner_id]);if(rs!==S.rulesSig){S.rulesSig=rs;S.seatSig=[];S.seatAv=[]}
 paintSeats();paintTop();paintVoice();wm70HallMessages()}

/* ---------------------------------------------------------------- 5 page skeleton */
function skeleton(){return `<main class="h2" id="wm78-room" data-room="${esc(CID)}" data-bg="">
 <div class="h2-top">
  <button type="button" class="h2-btn h2-back" onclick="H2.exit()" aria-label="${esc(tx('leave'))}">${ic('back')}</button>
  <button type="button" class="h2-id" onclick="H2.idTap()"><span class="h2-cov"></span><span class="h2-nm"><b dir="auto"></b><small></small></span></button>
  <span class="h2-fill"></span>
  <button type="button" class="h2-ppl" onclick="H2.peopleSheet()"></button>
  <button type="button" class="h2-btn" onclick="H2.menu()" aria-label="${esc(tx('menu'))}">${ic('more')}</button>
 </div>
 <section class="wmc-stage h2-stage" id="wmc-stage" hidden aria-label="Wakhan Cinema"><div class="screen"><div id="yt"></div><div class="scov" id="scov"></div><div id="wmc-speakers" class="wmc-speakers"></div><div id="wmc-notice" class="wmc-notice" role="status"></div></div><div class="wmc-stage-toolbar"><div id="cbar" class="wmc-controls"></div><div class="wmc-view-controls"></div></div><div id="vbarw" hidden></div><div id="wmc-voice-audio"></div></section>
 <div id="cinfo" class="h2-title" dir="auto"></div>
 <section class="h2-seats" id="hall"></section>
 <div class="h2-pick" id="wm78-no-media" hidden><button type="button" onclick="H2.apps()">${ic('film')}<span>${esc(tx('choose'))}</span></button></div>
 <div id="wmc-connection" class="wmc-connection" role="status"></div>
 <section class="h2-chat"><div class="h2-notice" hidden></div><div id="wm70-live-messages" class="h2-msgs wm78-messages" role="log" aria-live="polite"></div></section>
 <div class="h2-foot" id="wm78-footer">
  <div class="h2-bar">
   <button type="button" class="h2-rb" id="wm78-speaker" onclick="H2.speaker()"></button>
   <button type="button" class="h2-rb" id="wm78-mic" onclick="H2.mic()"></button>
   <button type="button" class="h2-say" onclick="H2.type()"></button>
   <button type="button" class="h2-rb" onclick="H2.emoji()" aria-label="${esc(tx('emoji'))}">${ic('smile')}</button>
   <button type="button" class="h2-rb h2-gold" onclick="H2.gift()" aria-label="${esc(tx('gift'))}">${ic('gift')}</button>
   <button type="button" class="h2-rb" onclick="H2.inbox()" aria-label="${esc(tx('msgs'))}">${ic('chat')}<i class="h2-dot" hidden></i></button>
  </div>
  <form class="h2-compose" id="wm70-live-compose" onsubmit="event.preventDefault();H2.send()">
   <button type="button" class="h2-rb" onpointerdown="event.preventDefault()" onclick="H2.emoji()" aria-label="${esc(tx('emoji'))}">${ic('smile')}</button>
   <input id="wm70-room-text" maxlength="1000" autocomplete="off" enterkeyhint="send" dir="auto">
   <button type="submit" class="h2-send" id="wm78-send" onpointerdown="event.preventDefault()" aria-label="${esc(tx('send'))}">${ic('send')}</button>
  </form>
 </div>
 <section class="h2-disc" id="wm78-discovery" hidden>
  <div class="h2-disc-top"><button type="button" class="h2-chip" onclick="H2.apps()">${ic('apps')}<span>${esc(tx('source'))}</span></button><button type="button" class="h2-btn" onclick="H2.search(false)" aria-label="${esc(tx('close'))}">${ic('close')}</button></div>
  <form class="wmc-search h2-search" onsubmit="event.preventDefault();hSearch()"><input id="hq" type="search" enterkeyhint="search" autocomplete="off" placeholder="${esc(tx('search'))}"><button type="submit" aria-label="${esc(tx('search'))}">${ic('search')}</button></form>
  <div id="yres"></div>
 </section>
</main>`}
function mount(){
 const fresh=S.room!==CID;
 if(fresh){S.room=CID;S.info=null;S.base=null;S.prevIds=null;S.pend=null;S.lastVer=-1;S.seen=null}
 S.seatAv=[];S.seatSig=[];S.rulesSig='';S.nodes=new Map();S.echo=[];S.chatOn=false;S.media=null;S.mountAt=Date.now();S.peopleRef=WM70.hallPeople;
 try{wmcDropPlayer()}catch(e){}WMC.error='';WMC.known=null;
 document.body.classList.add('h2-open','wm78-room-open','wmc-hall-active');document.body.classList.remove('wm75-lobby-mode','s22-hall');
 try{tg.disableVerticalSwipes&&tg.disableVerticalSwipes()}catch(e){}
 V().innerHTML=skeleton();
 if(!CS||CS._cid!==CID)CS={seats:Array(10).fill(null),mine:-1,vid:'',playing:false,t:0,ver:0,_cid:CID};
 drawHall();try{ytLoad()}catch(e){}cinStart();try{drawYRes()}catch(e){}kb();loadInfo(true);
}

/* ---------------------------------------------------------------- 6 seats */
function paintSeats(){const box=$('hall');if(!box||!CS||!Array.isArray(CS.seats))return;const seats=CS.seats;
 if(box.children.length!==seats.length){box.innerHTML=seats.map((_,i)=>`<button type="button" class="h2-seat is-empty" data-i="${i}"><span class="h2-face"><span class="h2-av"></span><i class="h2-mic"></i></span><b class="h2-name"></b></button>`).join('');S.seatAv=[];S.seatSig=[]}
 const h=info(),locks=new Set((h&&h.locks)||[]),host=h?Number(h.owner_id):0;
 seats.forEach((x,i)=>{const el=box.children[i];const p=x?person(x):null;
  if(p)try{wm70Remember(p)}catch(e){}
  const av=p?JSON.stringify([p.id,p.avatar,p.halo,p.name]):(locks.has(i)?'L':'E');
  const mute=!!p&&micMuted(p.id),mine=!!p&&p.id===me(),hst=!!p&&p.id===host;
  const sig=[mute,mine,hst].join();
  if(S.seatAv[i]!==av){S.seatAv[i]=av;
   setHtml(el.querySelector('.h2-av'),p?face(p):ic(locks.has(i)?'lock':'add'));
   setText(el.querySelector('.h2-name'),p?p.name:String(i+1));
   el.classList.toggle('is-empty',!p);el.classList.toggle('is-locked',!p&&locks.has(i));
   el.dataset.uid=p?String(p.id):'';setAttr(el,'aria-label',p?tx('profile')+' · '+p.name:String(i+1));S.seatSig[i]=null}
  if(S.seatSig[i]!==sig){S.seatSig[i]=sig;el.classList.toggle('is-me',mine);el.classList.toggle('is-host',hst);el.classList.toggle('is-muted',mute);
   setHtml(el.querySelector('.h2-mic'),p?ic(mute?'muted':'mic'):'')}});
 speaking()}
function speaking(id){const box=$('hall');if(!box)return;for(const el of box.children){const u=el.dataset.uid;if(!u||(id!==undefined&&String(id)!==u))continue;el.classList.toggle('is-speaking',!!VC.spk[u])}}

/* one tap = move. The first seat is taken by the app when you come in. */
async function seatTap(i){if(!mounted()||!CS||!Array.isArray(CS.seats))return;const x=CS.seats[i],h=info();
 if(x){const uid=Number(x.id);if(isOwner()&&uid!==me())return ownerMenu(uid);try{wm70OpenProfile(uid)}catch(e){}return}
 const locked=!!h&&(h.locks||[]).includes(i);
 if(locked){if(isOwner())return menu([[tx('unlockSeat'),()=>post({action:'unlock_seat',i})]]);return say(tx('hall_seat_locked'))}
 if(!seated()){vib('medium');return cinSit(i)} /* first time: the normal path, it also starts the film */
 if(Date.now()<S.moving)return;S.moving=Date.now()+700;vib('light');
 const from=CS.mine,mine=CS.seats[from];CS.seats=CS.seats.slice();CS.seats[i]=mine;CS.seats[from]=null;CS.mine=i;
 S.pend={i,until:Date.now()+4000};paintSeats();
 let j=null;try{j=await api('/api/c/'+CID,{a:'sit',i})}catch(e){}
 if(!j||!j.ok){S.pend=null;if(j&&j.err!=='hall_seat_locked')say(tx(j.err==='taken'?'taken':'err'));try{const k=await api('/api/c/'+CID+'?v=0');if(k&&k.ok){S.lastVer=-1;cinSet(k)}}catch(e){}return}
 cinSet(j)}
function ownerMenu(uid){const muted=(info()?.muted||[]).some(x=>Number(x.id)===uid);
 menu([[tx('profile'),()=>{try{wm70OpenProfile(uid)}catch(e){}}],[muted?tx('unmute'):tx('mute'),()=>post({action:muted?'unmute':'mute',uid})],[tx('unseat'),()=>post({action:'unseat',uid})],[tx('kick'),()=>kick(uid),'red']])}

/* ---------------------------------------------------------------- 7 top bar, stage & voice */
function paintTop(){const r=root();if(!r)return;const h=info();
 setHtml(r.querySelector('.h2-cov'),h&&h.photo?`<img src="${esc(h.photo)}" alt="">`:`<i>${esc(((h&&h.name)||'W').trim().charAt(0)||'W')}</i>`);
 let name=h&&h.name;if(!name)try{name=WMP.mine&&WMP.mine.code===CID?WMP.mine.name:''}catch(e){}
 setText(r.querySelector('.h2-nm b'),name||tx('room'));
 /* under the hall name: the owner, with the crown */
 const own=(h&&(h.owner_name||(((CS&&CS.seats)||[]).find(x=>x&&Number(x.id)===Number(h.owner_id))||{}).name))||'';
 setHtml(r.querySelector('.h2-nm small'),own?`${ic('crown')}<span dir="auto">${esc(own)}</span>`:esc(tx('id')+': '+CID));
 const ss=seatedPeople();setHtml(r.querySelector('.h2-ppl'),ss.slice(0,3).map(p=>`<span>${mini(p)}</span>`).join('')+`<em>${ss.length}</em>`)}
function paintStage(){const r=root();if(!r||!CS)return;const has=!!CS.vid,stage=$('wmc-stage'),pick=$('wm78-no-media');
 if(stage&&stage.hidden===has)stage.hidden=!has;if(pick){const hide=has||!seated();if(pick.hidden!==hide)pick.hidden=hide}
 r.classList.toggle('is-idle',!has);
 if(S.media!==CS.vid){S.media=CS.vid;if(CS.vid)search(false)}
 setText($('cinfo'),has?(CS.title||''):'');
 try{nxControls()}catch(e){}try{wmcOverlay()}catch(e){}try{wmcSpeakers()}catch(e){}}
function paintVoice(){const r=root();if(!r)return;const can=seated(),on=VC.on&&VC.cid===CID&&!VC.mute,h=info(),chatOff=!!(h&&h.can&&h.can.chat===false);
 const mic=$('wm78-mic');if(mic){setHtml(mic,ic(on?'mic':'muted'));mic.classList.toggle('is-on',on);setOff(mic,!can||!!(typeof SX!=='undefined'&&SX.micBusy));setAttr(mic,'aria-label',tx(on?'micOn':'micOff'))}
 const spk=$('wm78-speaker');if(spk){const s=typeof SX==='undefined'||SX.speaker!==false;setHtml(spk,ic(s?'volume_up':'silent'));spk.classList.toggle('is-off',!s);setOff(spk,!can);setAttr(spk,'aria-label',tx(s?'spkOn':'spkOff'))}
 const hint=!can?tx('sitToChat'):chatOff?tx('chatOff'):'';
 setText(r.querySelector('.h2-say'),hint||tx('say'));
 const inp=$('wm70-room-text');if(inp){setOff(inp,!!hint);const ph=hint||tx('write');if(inp.placeholder!==ph)inp.placeholder=ph}
 setOff($('wm78-send'),!can||!!WM70.sendingRoom);
 const dot=r.querySelector('.h2-dot');if(dot){let n=0;try{n=Number(WM70.unread||0)||(WM70.friends?.incoming||[]).length}catch(e){}if(dot.hidden!==!n)dot.hidden=!n}}

/* ---------------------------------------------------------------- 8 chat */
function baseline(){if(S.base!==null)return true;const list=WM70.hallMessages||[];
 if(!(WM70.hallCursor>0||WM70.hallPeople!==S.peopleRef||list.length||Date.now()-S.mountAt>5000))return false;
 S.base=list.reduce((a,m)=>Math.max(a,Number(m.id)||0),0);return true}
const nearBottom=el=>el.scrollHeight-el.scrollTop-el.clientHeight<80;
function msgNode(m){const p=m.sender||{},name=p.name||'Wakhan',own=Number(p.id)===me(),gift=m.kind==='gift';
 const n=document.createElement('article');n.className='h2-msg'+(own?' is-own':'')+(gift?' is-gift':'');n.dataset.id=String(m.id);
 let body;if(gift){let g='',t='';try{g=wm70GiftArt(m.detail?.gift);t=(wm70Name(WM70.gifts.find(v=>v.code===m.detail?.gift))||tx('gift'))+' ↗ '+(WM70.people.get(Number(m.detail?.target))?.name||'')}catch(e){}body=`<div class="h2-giftline">${g}<span dir="auto">${esc(t)}</span></div>`}
 else body=`<p dir="auto" class="wm70-native-emoji">${esc(m.text||'')}</p>`;
 n.innerHTML=`<button type="button" class="h2-mav" onclick="wm70OpenProfile(${Number(p.id)})">${mini(p)}</button><div class="h2-mb"><button type="button" class="h2-mname" onclick="wm70OpenProfile(${Number(p.id)})"><bdi>${esc(name)}</bdi></button>${body}</div>`;return n}
function sysNode(text,kind){const n=document.createElement('div');n.className='h2-sys '+(kind||'');n.innerHTML=`${ic(kind==='welcome'?'shield':kind==='join'?'enter':'exit')}<span dir="auto">${text}</span>`;return n}
function append(n){const out=$('wm70-live-messages');if(!out)return;const stick=nearBottom(out);out.appendChild(n);while(out.children.length>140){const f=out.firstElementChild;if(f.dataset.id)S.nodes.delete(f.dataset.id);f.remove()}if(stick)out.scrollTop=out.scrollHeight}
function welcomeLine(){if(!seated()&&!mounted())return;const out=$('wm70-live-messages');if(out&&!out.querySelector('.h2-sys.welcome'))append(sysNode(esc(tx('welcome')),'welcome'))}
function sysTrack(){if(!CS||!Array.isArray(CS.seats)||!CS.ok)return; /* only real server states, not the empty placeholder */const now=new Map(CS.seats.filter(Boolean).map(p=>[Number(p.id),person(p).name]));
 if(S.prevIds&&seated()){for(const [id,n] of now)if(!S.prevIds.has(id)&&id!==me())append(sysNode(`<b dir="auto">${esc(n)}</b> ${esc(tx('joined'))}`,'join'));for(const [id,n] of S.prevIds)if(!now.has(id)&&id!==me())append(sysNode(`<b dir="auto">${esc(n)}</b> ${esc(tx('left'))}`,'leave'))}
 S.prevIds=now}
function chatPaint(){const out=$('wm70-live-messages');if(!out||!seated()||WM70.hall!==CID||!baseline())return;
 const h=info(),floor=Math.max(S.base||0,Number(h&&h.clear_id)||0);
 for(const [id,n] of S.nodes)if(Number(id)<=floor){n.remove();S.nodes.delete(id)}
 const stick=nearBottom(out);let added=0;
 for(const m of WM70.hallMessages||[]){if(Number(m.id)<=floor)continue;const id=String(m.id);if(S.nodes.has(id))continue;
  dropEcho(m);const n=msgNode(m);S.nodes.set(id,n);out.appendChild(n);added++}
 if(added){while(out.children.length>140){const f=out.firstElementChild;if(f.dataset.id)S.nodes.delete(f.dataset.id);f.remove()}if(stick)out.scrollTop=out.scrollHeight}}
function echo(text){const n=msgNode({id:'',text,sender:{id:me(),name:(WM70.self&&WM70.self.name)||(ME.me&&ME.me.name)||'',avatar:(WM70.self&&WM70.self.avatar)||'/ava/'+me()}});n.classList.add('is-pending');n.removeAttribute('data-id');
 const out=$('wm70-live-messages');if(out){out.appendChild(n);out.scrollTop=out.scrollHeight}const e={text,n,t:setTimeout(()=>{n.remove();S.echo=S.echo.filter(x=>x!==e)},12000)};S.echo.push(e);return e}
function dropEcho(m){if(Number(m.sender?.id)!==me())return;const e=S.echo.find(x=>x.text===String(m.text||'').trim());if(!e)return;clearTimeout(e.t);e.n.remove();S.echo=S.echo.filter(x=>x!==e)}

/* ---------------------------------------------------------------- 9 keyboard (iPhone) */
/* The room is sized to the part of the screen you can see. When the keyboard opens the room
   gets shorter from the bottom: the bar and the seats stay exactly where they are, only the
   chat gets smaller, and the text box sits right on top of the keyboard. */
function kb(){S.raf=0;const r=root();if(!r)return;const vv=window.__h2vv||window.visualViewport;
 const h=Math.round(vv?vv.height:window.innerHeight),top=Math.round(vv?Math.max(0,vv.offsetTop):0);
 const inp=$('wm70-room-text'),typing=!!inp&&document.activeElement===inp;
 if(r.style.getPropertyValue('--h2-h')!==h+'px')r.style.setProperty('--h2-h',h+'px');
 const tf=top?`translate3d(0,${top}px,0)`:'';if(r.style.transform!==tf)r.style.transform=tf;
 if(r.classList.contains('is-typing')!==typing){r.classList.toggle('is-typing',typing);document.body.classList.toggle('wk-typing',typing);const out=$('wm70-live-messages');if(out)requestAnimationFrame(()=>{out.scrollTop=out.scrollHeight})}}
const kbSoon=()=>{if(!S.raf)S.raf=requestAnimationFrame(kb)};
(()=>{const vv=window.visualViewport;if(vv){vv.addEventListener('resize',kbSoon);vv.addEventListener('scroll',kbSoon)}window.addEventListener('resize',kbSoon);
 document.addEventListener('focusin',e=>{if(e.target&&e.target.id==='wm70-room-text'){kb();for(const t of [80,200,400,700])setTimeout(kbSoon,t)}});
 document.addEventListener('focusout',e=>{if(e.target&&e.target.id==='wm70-room-text')for(const t of [60,250,500])setTimeout(kbSoon,t)});
 try{tg.onEvent('viewportChanged',kbSoon)}catch(e){}
 /* a tap anywhere outside the text box closes the keyboard (TopTop) */
 document.addEventListener('pointerdown',e=>{const r=root();if(!r||!r.classList.contains('is-typing'))return;if(e.target.closest&&e.target.closest('#wm78-footer,#sheet'))return;const i=$('wm70-room-text');if(i)i.blur()},true)})();

/* ---------------------------------------------------------------- 10 actions */
async function send(){const inp=$('wm70-room-text');const text=inp&&inp.value.trim();if(!text||!seated()||WM70.sendingRoom)return;
 const h=info();if(h&&h.can&&h.can.chat===false)return say(tx(h.chat==='owner'?'hall_chat_owner':'hall_chat_friends'));
 const e=echo(text);paintVoice();
 try{await wm70SendRoom()}catch(x){}
 if(inp.value.trim()===text){clearTimeout(e.t);e.n.remove();S.echo=S.echo.filter(v=>v!==e)} /* not sent: the text is still in the box */
 paintVoice();chatPaint()}
async function mic(){if(!mounted()||!seated()||(typeof SX!=='undefined'&&SX.micBusy))return;try{await vcMute()}catch(e){}paintVoice()}
function speaker(){if(!mounted())return;try{sxSpeaker()}catch(e){}paintVoice()}
function type(){if(!seated())return say(tx('sitToChat'));const i=$('wm70-room-text');if(i&&!i.disabled){i.focus();setTimeout(()=>{try{i.focus()}catch(e){}},60)}}
function search(on){const d=$('wm78-discovery');if(!d)return;const show=typeof on==='boolean'?on:d.hidden;d.hidden=!show;root()?.classList.toggle('is-searching',show);if(show)later(()=>$('hq')?.focus(),60)}
async function provider(id){if(CS&&CS.can===false){shut();return say(tx('hostOnly'))}const room=CID,ep=WMC.epoch;try{await sxProvider(id)}catch(e){return say(tx('err'))}if(!mounted()||room!==CID||ep!==WMC.epoch)return;shut();search(true)}
function tgFilms(){shut();if(CS&&CS.can===false)return say(tx('hostOnly'));try{p27FilmOpen()}catch(e){}}
function kick(uid){ask(tx('kickQ'),async()=>{if(await post({action:'ban',uid}))redraw()})}

/* ---------------------------------------------------------------- 11 sheets */
function menu(items){window.__h2m=items;try{sheet(`<section class="h2-list">${items.map((x,i)=>`<button type="button" class="${x[2]||''}" onclick="closeSheet();setTimeout(()=>window.__h2m[${i}][1](),160)">${esc(x[0])}</button>`).join('')}<button type="button" class="h2-cancel" onclick="closeSheet()">${esc(tx('cancel'))}</button></section>`)}catch(e){}}
function grid(title,sub,items){window.__h2g=items;try{sheet(`<section class="h2-sh"><h3 dir="auto">${esc(title)}</h3>${sub?`<p class="h2-sub">${sub}</p>`:''}<div class="h2-grid">${items.map((x,i)=>`<button type="button" class="${x[3]||''}" onclick="closeSheet();setTimeout(()=>window.__h2g[${i}][2](),170)"><span>${x[0]}</span><b>${esc(x[1])}</b></button>`).join('')}</div></section>`)}catch(e){}}
async function openMenu(){vib();await loadInfo(false);const h=info(),items=[];
 if(h&&h.is_owner){items.push([ic('settings'),tx('settings'),settings,'gold']);items.push([ic('lock'),h.enter==='closed'?tx('unlock'):tx('lock'),lockHall])}
 items.push([ic('search'),tx('search'),()=>search(true)],[ic('apps'),tx('apps'),apps],[ic('invite'),tx('invite'),()=>{try{shareRoom()}catch(e){}}],[ic('copy'),tx('copy'),()=>{try{cpy(CID)}catch(e){}}],[ic('film'),tx('films'),tgFilms],[ic('exit'),tx('leave'),exitSheet,'red']);
 if(!(h&&h.is_owner)&&window.WKS)items.splice(items.length-1,0,[WKS.flag,WKS.t('reportHall'),()=>WKS.report({hall:CID,name:h&&h.name})]);
 grid((h&&h.name)||tx('menu'),`${esc(tx('id'))} · <bdi>${esc(CID)}</bdi>`,items)}
async function lockHall(){const closed=info()?.enter==='closed';if(await post({enter:closed?'all':'closed'}))say(tx(closed?'opened':'locked'))}
async function apps(){vib();if(!seated())return say(tx('sitToChat'));
 let ps=[];try{ps=(NX.providers||[]).filter(p=>/^[a-z0-9_-]{1,30}$/.test(p.id))}catch(e){}
 if(!ps.length){try{const j=await api('/api/cinema/providers');if(j&&j.ok&&Array.isArray(j.providers)){ps=j.providers.filter(p=>/^[a-z0-9_-]{1,30}$/.test(p.id));try{if(ps.length)NX.providers=ps}catch(e){}}}catch(e){}}
 if(!ps.length)ps=[{id:'youtube',name:'YouTube'},{id:'soundcloud',name:'SoundCloud'}];
 let cur='youtube';try{cur=(CS&&CS.provider)||SX.provider||'youtube'}catch(e){}
 window.__h2p=ps;
 try{sheet(`<section class="h2-sh"><h3>${esc(tx('appsTitle'))}</h3><p class="h2-sub">${esc(tx('appsSub'))}</p><div class="h2-apps"><button type="button" onclick="H2.tgFilms()"><span class="h2-tg">${ic('tg')}</span><bdi>Telegram</bdi></button>${ps.map(p=>`<button type="button" class="${p.id===cur?'on':''}" onclick="H2.provider('${p.id}')"><img src="/s/provider-${p.id}-hd.png?v=24" alt="" onerror="this.onerror=null;this.src='/s/provider-${p.id}-v12.png'"><bdi>${esc(p.name)}</bdi></button>`).join('')}</div></section>`)}catch(e){}}
function exitSheet(){vib();if(!seated())return leave();
 try{sheet(`<section class="h2-sh"><h3>${esc(tx('sure'))}</h3><button type="button" class="h2-opt" onclick="H2.keep()"><span class="h2-oi">${ic('keep')}</span><span><b>${esc(tx('keep'))}</b><small>${esc(tx('keepSub'))}</small></span></button><button type="button" class="h2-opt red" onclick="H2.leave()"><span class="h2-oi">${ic('exit')}</span><span><b>${esc(tx('leave'))}</b><small>${esc(tx('leaveSub'))}</small></span></button><button type="button" class="h2-cancel" onclick="closeSheet()">${esc(tx('cancel'))}</button></section>`)}catch(e){leave()}}
function leave(){shut();finishMin();try{exitRoom()}catch(e){}}
function keep(){shut();try{go('h')}catch(e){try{go('p')}catch(_){}}}
function idTap(){if(isOwner())return settings();try{wk52HallEdit(CID)}catch(e){}}
function peopleSheet(){vib();const ps=seatedPeople();
 try{sheet(`<section class="h2-sh"><h3>${esc(tx('people'))} · ${ps.length}</h3>${ps.length?`<div class="h2-rows">${ps.map(p=>`<button type="button" class="h2-row" onclick="closeSheet();setTimeout(()=>wm70OpenProfile(${p.id}),170)"><span class="h2-rav">${mini(p)}</span><b dir="auto">${esc(p.name)}</b>${Number(info()?.owner_id)===p.id?ic('crown'):''}</button>`).join('')}</div>`:`<p class="h2-muted">${esc(tx('noOne'))}</p>`}</section>`)}catch(e){}}
function gift(){vib();if(!seated())return say(tx('sitToChat'));const ps=seatedPeople().filter(p=>p.id!==me());
 try{sheet(`<section class="h2-sh"><h3>${esc(tx('gift'))}</h3>${ps.length?`<div class="h2-people">${ps.map(p=>`<button type="button" onclick="closeSheet();setTimeout(()=>wm70GiftPicker(${p.id}),180)"><span>${mini(p)}</span><b dir="auto">${esc(p.name)}</b></button>`).join('')}</div>`:`<p class="h2-muted">${esc(tx('noOne'))}</p>`}</section>`)}catch(e){}}
async function inbox(){vib();let list=[];try{const v=await wm70Request('inbox');list=(v&&(v.threads||v.inbox))||[];if(Array.isArray(list))WM70.inbox=list}catch(e){try{list=WM70.inbox||[]}catch(_){}}
 if(!Array.isArray(list))list=[];const mine=String(me());
 try{sheet(`<section class="h2-sh"><h3>${esc(tx('msgs'))}</h3>${list.length?`<div class="h2-rows">${list.slice(0,40).map(p=>`<button type="button" class="h2-row" onclick="closeSheet();setTimeout(()=>wm70OpenDM(${Number(p.id)}),170)"><span class="h2-rav">${mini(p)}</span><span class="h2-rt"><b dir="auto">${esc(p.name)}</b><small dir="auto">${esc(((String(p.sender)===mine?tx('you'):'')+(p.last||'')).slice(0,70))}</small></span>${p.unread?`<i class="h2-badge">${Number(p.unread)>99?'99+':Number(p.unread)}</i>`:''}</button>`).join('')}</div>`:`<p class="h2-muted">${esc(tx('noMsgs'))}</p>`}</section>`)}catch(e){}}
function emoji(){vib();try{sheet(`<section class="h2-sh"><h3>${esc(tx('emoji'))}</h3><div class="h2-emos">${EMO.map(x=>`<button type="button" onclick="H2.put('${x}')">${x}</button>`).join('')}</div><div class="h2-games"><button type="button" onclick="H2.game('dice')">🎲 <span>${esc(tx('dice'))}</span></button><button type="button" onclick="H2.game('lucky')">🍀 <span>${esc(tx('lucky'))}</span></button></div></section>`)}catch(e){}}
function put(x){const i=$('wm70-room-text');shut();if(!i||i.disabled)return say(tx('sitToChat'));i.value+=x;later(()=>i.focus(),220)}
function game(k){const i=$('wm70-room-text');shut();if(!i||i.disabled)return say(tx('sitToChat'));const keepText=i.value;
 i.value=(k==='dice'?tx('diceMsg')+(1+Math.floor(Math.random()*6)):tx('luckyMsg')+(1+Math.floor(Math.random()*100)));
 send().finally(()=>{if(!i.value&&keepText)i.value=keepText})}
/* notice */
function notice(){vib();const h=info()||{};try{sheet(`<section class="h2-sh"><h3>${esc(tx('notice'))}</h3><textarea id="h2-nt" maxlength="300" dir="auto" placeholder="${esc(tx('noticePh'))}">${esc(h.notice||'')}</textarea><small class="h2-cnt"><span id="h2-nc">${(h.notice||'').length}</span>/300</small><button type="button" class="h2-save" onclick="H2.saveNotice()">${esc(tx('save'))}</button></section>`);const a=$('h2-nt');if(a){a.oninput=()=>setText($('h2-nc'),a.value.length);later(()=>a.focus(),260)}}catch(e){}}
async function saveNotice(){const a=$('h2-nt');if(await post({notice:a?a.value:''})){shut();say(tx('saved'))}}
/* settings (owner) */
function seg(key,opts){const v=info()[key]||'all';return `<div class="h2-seg">${opts.map(o=>`<button type="button" class="${v===o?'on':''}" onclick="H2.set('${key}','${o}')">${esc(tx(o))}</button>`).join('')}</div>`}
function plist(key,act){const a=info()[key]||[];if(!a.length)return `<p class="h2-muted">${esc(tx('empty'))}</p>`;return a.map(p=>`<div class="h2-pr"><b dir="auto">${esc(p.name)}</b><button type="button" onclick="H2.mod('${act}',${Number(p.id)})">${esc(tx('undo'))}</button></div>`).join('')}
function present(){const ps=seatedPeople().filter(p=>p.id!==me());if(!ps.length)return `<p class="h2-muted">${esc(tx('nobody'))}</p>`;const muted=new Set((info().muted||[]).map(x=>Number(x.id)));
 return ps.map(p=>`<div class="h2-pr"><span class="h2-rav">${mini(p)}</span><b dir="auto">${esc(p.name)}</b><button type="button" class="${muted.has(p.id)?'on':''}" onclick="H2.mod('${muted.has(p.id)?'unmute':'mute'}',${p.id})">${esc(muted.has(p.id)?tx('undo'):tx('mute'))}</button><button type="button" class="red" onclick="H2.kick(${p.id})">${esc(tx('kick'))}</button></div>`).join('')}
function settingsHtml(){const h=info(),locks=h.locks||[];
 return `<section class="h2-sh h2-set"><h3>${esc(tx('settings'))}</h3>
 <button type="button" class="h2-head" onclick="closeSheet();setTimeout(()=>wk52HallEdit('${esc(CID)}'),200)"><span class="h2-hcov">${h.photo?`<img src="${esc(h.photo)}" alt="">`:`<i>${esc((h.name||'W').charAt(0))}</i>`}</span><span class="h2-ht"><b dir="auto">${esc(h.name||tx('room'))}</b><small>${esc(tx('edit'))} · <bdi>${esc(CID)}</bdi></small></span>${ic('forward')}</button>
 <div class="h2-card"><div class="h2-ch"><span>${ic('mega')}</span><b>${esc(tx('notice'))}</b><button type="button" onclick="closeSheet();setTimeout(H2.notice,200)">${ic('edit')}</button></div><p class="h2-np" dir="auto">${h.notice?esc(h.notice):`<i>${esc(tx('noNotice'))}</i>`}</p></div>
 <div class="h2-card"><div class="h2-ch"><span>${ic('shield')}</span><b>${esc(tx('access'))}</b></div><label>${esc(tx('enter'))}</label>${seg('enter',['all','friends','closed'])}<label>${esc(tx('mic'))}</label>${seg('mic',['all','friends','owner'])}<label>${esc(tx('chat'))}</label>${seg('chat',['all','friends','owner'])}</div>
 <div class="h2-card"><div class="h2-ch"><span>${ic('lock')}</span><b>${esc(tx('seatLocks'))}</b></div><p class="h2-muted">${esc(tx('seatLocksSub'))}</p><div class="h2-locks">${Array.from({length:(CS&&CS.seats||[]).length||10},(_,i)=>`<button type="button" class="${locks.includes(i)?'on':''}" onclick="H2.lockSeat(${i})">${locks.includes(i)?ic('lock'):''}<span>${i+1}</span></button>`).join('')}</div></div>
 <div class="h2-card"><div class="h2-ch"><span>${ic('palette')}</span><b>${esc(tx('bg'))}</b></div><div class="h2-bgs"><button type="button" class="h2-bg h2-gal ${h.bgphoto?'on':''}" onclick="H2.bgPick()"><span ${h.bgphoto?`style="background-image:url('${esc(h.bgphoto)}')"`:''}>${h.bgphoto?'':'＋'}</span><small>${esc(tx('gallery'))}</small></button>${Object.keys(BG).map(k=>`<button type="button" class="h2-bg ${!h.bgphoto&&(h.bg||'')===k?'on':''}" data-bg="${k}" onclick="H2.setBg('${k}')"><span></span><small>${esc(BG[k])}</small></button>`).join('')}</div>${h.bgphoto?`<button type="button" class="h2-link" onclick="H2.bgReset()">${esc(tx('rmPhoto'))}</button>`:''}</div>
 <div class="h2-card"><div class="h2-ch"><span>${ic('user')}</span><b>${esc(tx('people'))}</b></div>${present()}</div>
 <div class="h2-card"><div class="h2-ch"><span>${ic('muted')}</span><b>${esc(tx('muted'))}</b></div>${plist('muted','unmute')}</div>
 <div class="h2-card"><div class="h2-ch"><span>${ic('exit')}</span><b>${esc(tx('banned'))}</b></div>${plist('banned','unban')}</div>
 <button type="button" class="h2-danger" onclick="H2.clear()">${ic('trash')}<span>${esc(tx('clear'))}</span></button></section>`}
function redraw(){const b=document.querySelector('#sheet .h2-set');if(!b||!info())return;const sh=$('sheet'),sc=sh?sh.scrollTop:0;b.outerHTML=settingsHtml();if(sh)sh.scrollTop=sc}
async function settings(){vib();const h=await loadInfo(true);if(!h||!h.is_owner)return;try{sheet(settingsHtml())}catch(e){}}
const setRule=async(k,v)=>{if(await post({[k]:v}))redraw()};
const setBg=async k=>{if(info()?.bgphoto)await post({reset_bgphoto:true});if(await post({bg:k}))redraw()};
const lockSeat=async i=>{const lk=(info()?.locks||[]).includes(i);if(await post({action:lk?'unlock_seat':'lock_seat',i}))redraw()};
const mod=async(a,uid)=>{if(await post({action:a,uid}))redraw()};
function clearChat(){ask(tx('clearQ'),async()=>{if(await post({action:'clear_chat'})){say(tx('cleared'));redraw()}})}
function bgPick(){const f=document.createElement('input');f.type='file';f.accept='image/*';f.onchange=()=>{const file=f.files&&f.files[0];if(!file)return;const url=URL.createObjectURL(file),im=new Image();
 im.onload=async()=>{const W=900,H=1600,c=document.createElement('canvas');c.width=W;c.height=H;const sc=Math.max(W/im.width,H/im.height),w=im.width*sc,h=im.height*sc;c.getContext('2d').drawImage(im,(W-w)/2,(H-h)/2,w,h);URL.revokeObjectURL(url);if(await post({bgphoto:c.toDataURL('image/jpeg',.82)})){say(tx('saved'));redraw()}};im.src=url};f.click()}
const bgReset=async()=>{if(await post({reset_bgphoto:true}))redraw()};

/* ---------------------------------------------------------------- 12 staying in the hall while browsing */
/* Leaving the hall page (seated) keeps the seat and the voice; a bubble brings you back. */
function quietly(fn){const vl=vcLeave,ap=api,tok=(typeof CG!=='undefined')?CG.token:null;
 vcLeave=function(){};
 api=function(p,b){if(typeof p==='string'){if(p.indexOf('/api/cinema/lock/logout')>=0)return Promise.resolve({ok:true});if(b&&b.a==='leave'&&p.indexOf('/api/c')===0)return Promise.resolve({ok:true})}return ap.apply(this,arguments)};
 try{return fn()}finally{vcLeave=vl;api=ap;try{if(tok&&typeof CG!=='undefined'&&!CG.token)CG.token=tok}catch(e){}}}
function minimize(k,sub,realGo){const code=CID,keepCS=CS;
 const r=quietly(()=>realGo(k,sub));
 try{if(!CID){CID=code;CS=keepCS}}catch(e){}
 S.min=true;S.minRoom=code;S.miss=0;keepAlive();bubble();document.body.classList.remove('h2-open','wm78-room-open','wmc-hall-active');try{tg.enableVerticalSwipes&&tg.enableVerticalSwipes()}catch(e){}
 return r}
function keepAlive(){clearInterval(S.ka);S.ka=setInterval(async()=>{
 if(!S.min)return clearInterval(S.ka);
 if(typeof CID==='undefined'||!CID||CID!==S.minRoom)return finishMin();
 try{const j=await api('/api/c/'+S.minRoom+'?v=0');if(!S.min||CID!==S.minRoom)return;
  if(j&&j.ok){S.miss=0;j._cid=S.minRoom;CS=j;try{CVER=j.ver}catch(e){}if(j.mine<0){say(tx('lost'));return fullLeave(false)}}
  else if(++S.miss>=4)return fullLeave(false)}catch(e){if(++S.miss>=6)return fullLeave(false)}
 paintBubble()},3000)}
function finishMin(){S.min=false;clearInterval(S.ka);S.ka=0;if(S.bub){S.bub.remove();S.bub=null}}
function fullLeave(tell){const code=S.minRoom||CID;finishMin();try{vcLeave()}catch(e){}
 if(code&&tell!==false){try{api('/api/c/'+code,{a:'leave'}).catch(()=>{})}catch(e){}}
 try{CID=null;CS=null;CVER=0;CV='hall'}catch(e){}S.room='';try{wmrDockUpdate()}catch(e){}}
function restore(sub,realGo){finishMin();try{CV='hall';CLOG=true}catch(e){}return quietly(()=>realGo('c',sub))}
function bubble(){if(S.bub)return paintBubble();const b=document.createElement('div');b.id='h2-bub';b.dir='ltr';
 b.innerHTML=`<button type="button" class="h2-bmain" aria-label="${esc(tx('backHall'))}"><span class="h2-bring"></span><span class="h2-bic">${ic('cinema')}</span><b class="h2-bn"></b></button><button type="button" class="h2-bmic"></button><button type="button" class="h2-bx" aria-label="${esc(tx('leave'))}">${ic('close')}</button>`;
 b.querySelector('.h2-bmain').onclick=()=>{vib();go('c')};
 b.querySelector('.h2-bmic').onclick=async e=>{e.stopPropagation();vib();try{await vcMute()}catch(_){}paintBubble()};
 b.querySelector('.h2-bx').onclick=e=>{e.stopPropagation();vib();ask(tx('sure'),()=>fullLeave(true))};
 document.body.appendChild(b);S.bub=b;paintBubble()}
function paintBubble(){const b=S.bub;if(!b)return;const on=VC.on&&!VC.mute,m=b.querySelector('.h2-bmic');setHtml(m,ic(on?'mic':'muted'));m.classList.toggle('on',on);m.disabled=!seated();
 let talk=false;try{talk=Object.entries(VC.spk||{}).some(([k,v])=>v&&Number(k)!==me())}catch(e){}b.classList.toggle('talk',talk);
 let n=0;try{n=(CS.seats||[]).filter(Boolean).length}catch(e){}setText(b.querySelector('.h2-bn'),n?String(n):'')}
setInterval(()=>{if(S.min){paintBubble();if(typeof CID==='undefined'||!CID)finishMin()}if(S.bub){const sh=$('sheet'),hide=!!(sh&&sh.classList.contains('show'))||document.body.classList.contains('dt-open');if(S.bub.classList.contains('hide')!==hide)S.bub.classList.toggle('hide',hide)}},500);

/* ---------------------------------------------------------------- 13 engine hooks */
/* each hook does the hall-v2 thing while the hall is on screen and otherwise calls the original */
const old={rHall,drawHall,cinSet,wm70MountHall,wm70HallMessages,spkDraw,vcBar,s22Voice,sxHub,wmcOverlay,rCinema,render,cgRender,go,api,toast,vcMute};
rHall=function(seg){if(!CID)return old.rHall(seg);if(!wpAllowed())return wpLockPage();if(typeof CG!=='undefined'&&!CG.token)return cgRender();if(mounted()){drawHall();return}mount()};
drawHall=function(){if(!mounted())return old.drawHall.apply(this,arguments);if(!CS||!Array.isArray(CS.seats))return;
 paintSeats();paintTop();paintStage();paintVoice();sysTrack();wm70MountHall();
 /* listen to the hall's voices as soon as you sit (the mic itself stays off until you tap it) */
 if(seated()&&!VC.on&&!WMC.voiceJoining&&!(typeof SX!=='undefined'&&SX.joining)&&!S.listen){S.listen=true;const room=CID,ep=WMC.epoch;queueMicrotask(()=>{S.listen=false;if(mounted()&&CID===room&&WMC.epoch===ep&&seated()&&!VC.on)vcJoin()})}};
/* room state from the server: never step back to an older state, and while my seat change is
   on its way only the new seat counts (a late answer can not pull me back) */
cinSet=function(j){try{if(j&&j.ok&&Array.isArray(j.seats)&&String(CID||'')===S.room){
  const ver=Number(j.ver);if(Number.isFinite(ver)&&ver<S.lastVer)return;
  if(S.pend&&Date.now()<S.pend.until){if(j.mine!==S.pend.i)return;S.pend=null}
  else if(CS&&CS._cid===CID&&CS.mine>=0&&j.mine!==CS.mine){if(S.seen!==j.mine){S.seen=j.mine;return}}
  S.seen=null;if(Number.isFinite(ver))S.lastVer=Math.max(S.lastVer,ver)}}catch(e){}
 return old.cinSet.apply(this,arguments)};
wm70MountHall=function(){if(!mounted())return old.wm70MountHall.apply(this,arguments);
 const out=$('wm70-live-messages');
 if(!seated()){S.chatOn=false;if(out&&!out.querySelector('.h2-hint')){S.nodes=new Map();out.innerHTML=`<p class="h2-hint">${esc(tx('sitToChat'))}</p>`}return}
 if(out){const hint=out.querySelector('.h2-hint');if(hint)hint.remove()}
 if(WM70.hall!==CID){WM70.hall=CID;WM70.hallMessages=[];WM70.hallCursor=0;++WM70.hallSeq;WM70.hallBusy=false;WM70.roomPending=null;S.base=null;S.peopleRef=WM70.hallPeople;S.mountAt=Date.now()}
 if(!S.chatOn){S.chatOn=true;welcomeLine();try{wm70PollHall()}catch(e){}}
 chatPaint()};
wm70HallMessages=function(){if(!mounted())return old.wm70HallMessages.apply(this,arguments);chatPaint()};
spkDraw=function(id){old.spkDraw.apply(this,arguments);if(mounted())speaking(id);if(S.min)paintBubble()};
vcBar=function(){return mounted()?'':old.vcBar.apply(this,arguments)};
s22Voice=function(){if(mounted()){const d=$('s22-voice-dock');if(d)d.hidden=true;document.body.classList.remove('s22-hall');paintVoice();return}return old.s22Voice.apply(this,arguments)};
sxHub=function(){if(mounted()){const i=$('hq');if(i)i.placeholder=tx('search');return}return old.sxHub.apply(this,arguments)};try{wmqHubSync=sxHub}catch(e){}
wmcOverlay=function(){if(mounted()&&!CS?.vid){try{sxCancelWelcome()}catch(e){}const o=$('scov');if(o){o.style.display='none';o.innerHTML=''}return}return old.wmcOverlay.apply(this,arguments)};
function cleanup(){if(mounted())return;if(!inHall()||CV!=='hall'){document.body.classList.remove('h2-open','wm78-room-open','wmc-hall-active','wk-typing');try{tg.enableVerticalSwipes&&tg.enableVerticalSwipes()}catch(e){}}if(typeof CID==='undefined'||!CID){if(!S.min)S.room=''}}
rCinema=function(){cleanup();return old.rCinema.apply(this,arguments)};
render=function(){cleanup();return old.render.apply(this,arguments)};
cgRender=function(){cleanup();return old.cgRender.apply(this,arguments)};
go=function(k,sub){
 if(S.min&&k==='c')return restore(sub,old.go);
 if(!S.min&&inHall()&&k!=='c'&&seated()&&CV==='hall')return minimize(k,sub,old.go);
 return old.go.apply(this,arguments)};
/* every "no" from the hall rules is said in plain words, once */
let lastNo=0;
api=async function(){const j=await old.api.apply(this,arguments);try{if(j&&j.err&&/^hall_/.test(j.err)&&TEXT.fa[j.err]){lastNo=Date.now();say(tx(j.err))}}catch(e){}return j};
toast=function(m){try{if(Date.now()-lastNo<1500&&typeof m==='string'&&!LANGS.some(l=>Object.values(TEXT[l]).includes(m)))return;if(typeof m==='string'&&TEXT.fa[m]&&/^hall_/.test(m))m=tx(m)}catch(e){}return old.toast.apply(this,arguments)};
/* the mic does not even switch on when the hall rules say no (voice is peer to peer) */
vcMute=async function(){try{const h=info();if(VC.mute&&h&&h.can&&h.can.mic===false){return say(tx(h.mic==='owner'?'hall_mic_owner':'hall_mic_friends'))}}catch(e){}return old.vcMute.apply(this,arguments)};

/* ---------------------------------------------------------------- 14 start */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#hall>.h2-seat');if(!b||!mounted())return;e.preventDefault();seatTap(Number(b.dataset.i))});
setInterval(()=>{if(mounted()){loadInfo(false);paintVoice()}},2500);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&mounted()){loadInfo(true);kb()}});
(()=>{const l=document.createElement('link');l.rel='stylesheet';l.href='/s/hall2.css?v='+(window.WK_V2_VER||1);document.head.appendChild(l)})();
const api_={exit:exitSheet,idTap,peopleSheet,menu:openMenu,speaker,mic,type,emoji,gift,inbox,send,apps,search,provider,tgFilms,keep,leave,notice,saveNotice,
 set:setRule,setBg,lockSeat,mod,kick,clear:clearChat,bgPick,bgReset,put,game,settings,seat:seatTap,kb,state:S};
window.H2=api_;window.WM78=Object.assign(window.WM78||{},{version:'h2',state:{composing:false}});
/* names other parts of the app already call */
window.wm78Search=search;window.wm78Exit=leave;window.wm78Provider=provider;window.wm78Send=send;window.wm78Seat=seatTap;window.wm78Menu=openMenu;window.wm78Mic=mic;window.wm78Speaker=speaker;
window.wk51Exit=exitSheet;window.wk64Settings=settings;window.wk47Folder=openMenu;window.wk64Emoji=emoji;
try{if(ME?.me&&TAB==='c'&&CV==='hall'&&CID)rHall()}catch(e){}
})();
