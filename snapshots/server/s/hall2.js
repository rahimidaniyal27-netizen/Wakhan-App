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
 let n=0;try{n=(CS.seats||[]).filter(Boolean).length}catch(e){}setText(b.querySelector('.h2-bn'),n?String(n):'');
 /* the hall's own picture in the bubble (first letter when the hall has none) */
 let h={};try{h=info()||{}}catch(e){}const key=(h.photo||'')+'|'+(h.name||''),ic_=b.querySelector('.h2-bic');
 if(ic_&&ic_.dataset.k!==key){ic_.dataset.k=key;ic_.classList.toggle('pic',!!h.photo);setHtml(ic_,h.photo?`<img src="${esc(h.photo)}" alt="" onerror="this.parentNode.classList.remove('pic');this.replaceWith(document.createTextNode('${esc((h.name||'W').charAt(0)).replace(/'/g,'')}'))">`:(h.name?`<i>${esc(h.name.charAt(0))}</i>`:ic('cinema')))}}
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
(()=>{const s=document.createElement('style');s.id='h2-css';s.textContent="/* =====================================================================\n   WAKHAN HALL v2 — styles. Everything is scoped to .h2 (the hall) or\n   to sheets the hall opens (.h2-*). Glass over the hall background.\n   1 page   2 top bar   3 stage   4 seats   5 chat   6 footer\n   7 search panel   8 sheets   9 settings   10 bubble\n   ===================================================================== */\n\n/* ---------- 1 page */\nhtml:has(body.h2-open),body.h2-open{overflow:hidden!important;overscroll-behavior:none}\nbody.h2-open #view{padding:0!important}\nbody #view #wm78-room.h2{\n --h2-acc:var(--a1,#10b981);--h2-glass:rgba(255,255,255,.1);--h2-line:rgba(255,255,255,.14);--h2-dim:rgba(255,255,255,.62);\n position:fixed;left:0;right:0;top:0;z-index:30;height:var(--h2-h,100dvh);max-width:760px;margin:0 auto;padding:0!important;\n display:flex;flex-direction:column;overflow:hidden;color:#fff;\n font-family:Vazirmatn,system-ui,-apple-system,sans-serif;-webkit-tap-highlight-color:transparent;\n background:radial-gradient(120% 65% at 50% 0%,color-mix(in srgb,var(--h2-acc) 34%,#141a2c) 0%,#0c1020 55%,#06070d 100%)}\n#wm78-room.h2 button{font-family:inherit;-webkit-user-select:none;user-select:none;touch-action:manipulation}\n#wm78-room.h2 .h2-i,#wm78-room.h2 svg.wi{width:22px;height:22px;display:block;flex:none}\n#wm78-room.h2[data-bg=night]{background:radial-gradient(ellipse at 50% 0%,#24305e 0%,#0b1024 60%,#05060f 100%)}\n#wm78-room.h2[data-bg=aurora]{background:linear-gradient(160deg,#0b3b3a 0%,#123a5c 45%,#2a1450 100%)}\n#wm78-room.h2[data-bg=sunset]{background:linear-gradient(170deg,#4a1d3f 0%,#7a2e2e 45%,#1d0f1f 100%)}\n#wm78-room.h2[data-bg=ocean]{background:linear-gradient(180deg,#06324a 0%,#0a1f3d 55%,#050b1a 100%)}\n#wm78-room.h2[data-bg=forest]{background:linear-gradient(180deg,#123d27 0%,#0b2418 55%,#050e09 100%)}\n#wm78-room.h2[data-bg=royal]{background:radial-gradient(ellipse at 50% 10%,#2c3fd6 0%,#141f7a 45%,#070b2e 100%)}\n#wm78-room.h2[data-bg=rose]{background:linear-gradient(170deg,#5a1f45 0%,#3a1238 50%,#140611 100%)}\n#wm78-room.h2.has-photo{background:linear-gradient(180deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,.15) 30%,rgba(0,0,0,.25) 62%,rgba(0,0,0,.78) 100%),var(--h2-photo) center/cover no-repeat}\n\n/* ---------- 2 top bar */\n.h2-top{flex:none;display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top,0px)) 10px 6px;direction:ltr}\n.h2-btn{flex:none;width:38px;height:38px;border-radius:50%;border:0;padding:0;display:grid;place-items:center;color:#fff;background:var(--h2-glass);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}\n.h2-id{min-width:0;max-width:56%;display:flex;align-items:center;gap:8px;height:42px;padding:3px 12px 3px 3px;border-radius:21px;border:0;color:#fff;background:rgba(0,0,0,.28);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);text-align:start}\n.h2-cov{flex:none;width:36px;height:36px;border-radius:12px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,var(--h2-acc),color-mix(in srgb,var(--h2-acc) 45%,#000))}\n.h2-cov img{width:100%;height:100%;object-fit:cover}.h2-cov i{font:900 16px/1 inherit;font-style:normal}\n.h2-nm{min-width:0;display:flex;flex-direction:column;line-height:1.25}\n.h2-nm b{font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.h2-nm small{display:flex;align-items:center;gap:4px;min-width:0;font-size:11px;font-weight:700;color:rgba(255,255,255,.82)}\n.h2-nm small .h2-i,.h2-nm small svg{width:13px!important;height:13px!important;color:#f5c451}\n.h2-nm small span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.h2-fill{flex:1}\n.h2-ppl{flex:none;display:flex;align-items:center;height:32px;padding:0 4px 0 4px;border:0;border-radius:16px;background:rgba(0,0,0,.28);color:#fff}\n.h2-ppl>span{width:24px;height:24px;margin-left:-8px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 1.5px #10131f}.h2-ppl>span:first-child{margin-left:0}\n.h2-ppl em{font:800 12px/1 inherit;font-style:normal;padding:0 6px 0 5px}\n.h2-mini{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;background:rgba(255,255,255,.08)}\n\n/* ---------- 3 stage */\n#wm78-room.h2 .h2-stage{flex:none;position:relative;margin:2px 10px 4px;border-radius:16px;overflow:hidden;background:#04060a;border:1px solid var(--h2-line)}\n#wm78-room.h2 .h2-stage .screen{min-height:0;height:auto;position:relative;width:100%;aspect-ratio:16/9;max-height:calc(var(--h2-h,100dvh) * .32);margin:0 auto;overflow:hidden;background:#04060a}\n#wm78-room.h2 .h2-stage .screen>video,#wm78-room.h2 .h2-stage .screen>iframe,#wm78-room.h2 .h2-stage #yt{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}\n#wm78-room.h2 .h2-stage .wmc-stage-toolbar{padding:2px 6px;min-height:36px}\n#wm78-room.h2 .h2-stage .wmc-controls button,#wm78-room.h2 .h2-stage .wmc-view-controls button{height:34px;min-height:34px;width:34px;padding:7px}\n#wm78-room.h2 .h2-stage #vbarw{display:none!important}\nbody.wmc-theater #wm78-room.h2 #wmc-stage.wmc-expanded{position:fixed;inset:0;margin:0;border:0;border-radius:0;z-index:50}\nbody.wmc-theater #wm78-room.h2 #wmc-stage.wmc-expanded .screen{width:100%;height:100%;max-height:none;aspect-ratio:auto}\n.h2-title{flex:none;margin:0 14px 2px;font-size:12px;font-weight:700;color:var(--h2-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}\n.h2-title:empty{display:none}\n\n/* ---------- 4 seats: 2 on top, then 4 + 4 */\n.h2-seats{flex:none;display:grid;grid-template-columns:repeat(4,1fr);gap:10px 6px;padding:6px 14px 4px}\n.h2-seat:nth-child(1){grid-column:2}.h2-seat:nth-child(2){grid-column:3}.h2-seat:nth-child(3){grid-column:1}\n.h2-seat{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0;padding:0;border:0;background:none;color:#fff;cursor:pointer}\n.h2-seat,.h2-seat *{transition:none!important;animation:none}\n.h2-face{position:relative;width:52px;height:52px;border-radius:50%;display:grid;place-items:center}\n.h2-av{position:absolute;inset:0;display:grid;place-items:center;border-radius:50%}\n.h2-av>.wm70-avatar,.h2-av>span{width:100%!important;height:100%!important;font-size:inherit}\n.h2-seat.is-empty .h2-av{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:rgba(255,255,255,.75)}\n.h2-seat.is-empty .h2-av .h2-i,.h2-seat.is-empty .h2-av svg{width:20px;height:20px}\n.h2-seat.is-locked .h2-av{color:#fb7185;border-color:rgba(251,113,133,.45);background:rgba(251,113,133,.12)}\n.h2-mic{position:absolute;right:-2px;bottom:-2px;z-index:6;width:19px;height:19px;border-radius:50%;display:grid;place-items:center;background:#22c55e;color:#fff;box-shadow:0 0 0 2px rgba(10,12,20,.85);font-style:normal}\n.h2-mic:empty{display:none}.h2-mic .h2-i,.h2-mic svg{width:11px!important;height:11px!important}\n.h2-seat.is-muted .h2-mic{background:#1e2230;color:#fb7185}\n.h2-name{max-width:100%;font-size:11px;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 3px rgba(0,0,0,.85)}\n.h2-seat.is-empty .h2-name{color:var(--h2-dim);font-weight:600}\n.h2-seat.is-me .h2-av{box-shadow:0 0 0 2px var(--h2-acc)}\n.h2-seat.is-host .h2-name{color:#ffd76a}\n.h2-seat.is-speaking .h2-face::after{content:\"\";position:absolute;inset:-5px;border-radius:50%;border:2px solid var(--h2-acc);animation:h2talk 1.1s ease-out infinite!important;pointer-events:none}\n@keyframes h2talk{0%{transform:scale(.92);opacity:.95}100%{transform:scale(1.18);opacity:0}}\n/* nothing playing: seats go to the top and get bigger */\n.h2.is-idle .h2-seats{gap:18px 6px;padding-top:14px}\n.h2.is-idle .h2-face{width:66px;height:66px}\n.h2.is-idle .h2-seat.is-empty .h2-av .h2-i,.h2.is-idle .h2-seat.is-empty .h2-av svg{width:24px;height:24px}\n.h2.is-idle .h2-name{font-size:12px}\n.h2.is-idle .h2-mic{width:22px;height:22px}\n.h2-pick{flex:none;display:flex;justify-content:center;padding:8px 0 2px}\n.h2-pick[hidden]{display:none}\n.h2-pick button{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 20px;border:0;border-radius:20px;color:#fff;font:800 13.5px inherit;background:linear-gradient(135deg,var(--h2-acc),color-mix(in srgb,var(--h2-acc) 55%,#000));box-shadow:0 8px 22px color-mix(in srgb,var(--h2-acc) 30%,transparent)}\n.h2-pick .h2-i,.h2-pick svg{width:18px!important;height:18px!important}\n\n/* ---------- 5 chat (between the seats and the footer — never on top of the seats) */\n.h2-chat{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;padding:4px 12px 0}\n.h2-notice{flex:none;display:flex;align-items:flex-start;gap:8px;margin:2px 0 6px;padding:7px 10px;border-radius:14px;background:rgba(0,0,0,.32);border:1px solid color-mix(in srgb,var(--h2-acc) 35%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}\n.h2-notice[hidden]{display:none}\n.h2-ni{flex:none;color:var(--h2-acc)}.h2-ni .h2-i{width:19px;height:19px}\n.h2-notice p{flex:1;margin:1px 0 0;font-size:12.5px;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;word-break:break-word}\n.h2-notice p i{color:var(--h2-dim);font-style:normal}\n.h2-notice button{flex:none;width:28px;height:28px;border:0;border-radius:50%;padding:0;display:grid;place-items:center;background:rgba(255,255,255,.12);color:#fff}\n.h2-notice button .h2-i,.h2-notice button svg{width:14px;height:14px}\nbody #view #wm78-room.h2 .h2-msgs{flex:1 1 auto;min-height:0;max-height:none;display:flex;flex-direction:column;gap:7px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:14px 0 8px;\n -webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 22px);mask-image:linear-gradient(to bottom,transparent 0,#000 22px);scrollbar-width:none}\n.h2-msgs::-webkit-scrollbar{display:none}\n.h2-msgs>:first-child{margin-top:auto}\n.h2-msg{display:flex;align-items:flex-start;gap:8px;max-width:88%}\n.h2-mav{flex:none;width:30px;height:30px;padding:0;border:0;border-radius:50%;background:none;box-shadow:0 0 0 1.5px rgba(255,255,255,.22)}\n.h2-mb{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:2px}\n.h2-mname{padding:0;border:0;background:none;color:color-mix(in srgb,var(--h2-acc) 55%,#fff);font:800 11.5px/1.3 inherit;text-shadow:0 1px 3px rgba(0,0,0,.9);max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.h2-msg.is-own .h2-mname{color:#ffd76a}\n.h2-mb p{margin:0;padding:6px 11px;border-radius:4px 14px 14px 14px;background:rgba(0,0,0,.34);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-size:14px;font-weight:600;line-height:1.55;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere}\n[dir=rtl] .h2-mb p,html[dir=rtl] .h2-mb p{border-radius:14px 4px 14px 14px}\n.h2-msg.is-pending{opacity:.55}\n.h2-giftline{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:14px;background:linear-gradient(135deg,rgba(255,196,81,.25),rgba(255,120,80,.18));font-size:12.5px;font-weight:800}\n.h2-giftline img,.h2-giftline svg,.h2-giftline>*:first-child{width:34px;height:34px;flex:none}\n.h2-sys{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;max-width:92%;padding:4px 10px;border-radius:12px;background:rgba(255,255,255,.1);font-size:12px;line-height:1.5;color:rgba(255,255,255,.85)}\n.h2-sys .h2-i,.h2-sys svg{width:14px!important;height:14px!important;opacity:.8}\n.h2-sys b{font-weight:800}\n.h2-sys.welcome{background:color-mix(in srgb,var(--h2-acc) 22%,rgba(0,0,0,.25));color:#fff}\n.h2-hint{margin:auto 0 6px;align-self:center;padding:7px 14px;border-radius:14px;background:rgba(0,0,0,.3);font-size:12.5px;color:var(--h2-dim)}\n\n/* ---------- 6 footer */\n.h2-foot{flex:none;position:relative;padding:6px 10px calc(8px + env(safe-area-inset-bottom,0px))}\n.h2-bar{display:flex;align-items:center;gap:7px;direction:ltr}\n.h2-rb{position:relative;flex:none;width:40px;height:40px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;color:#fff;background:var(--h2-glass);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}\n.h2-rb:disabled{opacity:.45}\n#wm78-mic{color:#fb7185}#wm78-mic.is-on{color:#fff;background:linear-gradient(135deg,#22c55e,#15803d)}\n#wm78-speaker.is-off{color:#fb7185}\n.h2-gold{background:linear-gradient(135deg,#ffcf5c,#ff8a3d)!important;color:#3a1d00!important}\n.h2-dot{position:absolute;top:6px;right:7px;width:8px;height:8px;border-radius:50%;background:#ff4d6d;box-shadow:0 0 0 2px rgba(10,12,20,.9)}\n.h2-dot[hidden]{display:none}\n.h2-say{flex:1;min-width:0;height:40px;padding:0 14px;border:0;border-radius:20px;background:var(--h2-glass);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:rgba(255,255,255,.72);font:600 13.5px inherit;text-align:start;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;direction:rtl}\nhtml[lang^=en] .h2-say{direction:ltr}\n.h2-compose{position:absolute;left:10px;right:10px;bottom:calc(8px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:7px;opacity:0;pointer-events:none;direction:ltr}\n.h2-compose input{flex:1;min-width:0;height:42px;padding:0 15px;border-radius:21px;border:1px solid var(--h2-line);background:rgba(255,255,255,.12);color:#fff;font:500 16px inherit;outline:0;-webkit-appearance:none;appearance:none}\n.h2-compose input::placeholder{color:rgba(255,255,255,.55)}\n.h2-send{flex:none;width:42px;height:42px;border:0;border-radius:50%;padding:0;display:grid;place-items:center;color:#fff;background:var(--h2-acc)}\n.h2-send:disabled{opacity:.5}\n/* typing: the bar turns into the text box, right on the keyboard; seats stay, chat shrinks */\n.h2.is-typing .h2-bar{visibility:hidden}\n.h2.is-typing .h2-compose{opacity:1;pointer-events:auto;bottom:8px}\n.h2.is-typing .h2-foot{padding-bottom:8px}\n.h2.is-typing .h2-pick,.h2.is-typing .h2-title,.h2.is-typing .h2-stage .wmc-stage-toolbar,.h2.is-typing .h2-notice{display:none!important}\n#wm78-room.h2.is-typing:not(.is-idle) .h2-stage .screen{min-height:0;max-height:calc(var(--h2-h,100dvh) * .22)}\n.h2.is-typing .h2-seats{gap:6px 6px;padding-top:4px}\n.h2.is-typing .h2-face{width:40px;height:40px}\n.h2.is-typing .h2-name{display:none}\n\n/* ---------- 7 search panel */\n.h2-disc{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px;background:rgba(8,10,18,.96);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}\n.h2-disc[hidden]{display:none}\n.h2-disc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;direction:ltr}\n.h2-chip{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px;border:0;border-radius:18px;background:var(--h2-glass);color:#fff;font:700 13px inherit}\n.h2-chip .h2-i,.h2-chip svg{width:18px!important;height:18px!important}\n.h2-search{display:flex;gap:8px;margin-bottom:10px}\n.h2-search input{flex:1;min-width:0;height:44px;padding:0 16px;border-radius:22px;border:1px solid var(--h2-line);background:rgba(255,255,255,.08);color:#fff;font:500 16px inherit;outline:0}\n.h2-search button{flex:none;width:44px;height:44px;border:0;border-radius:50%;display:grid;place-items:center;background:var(--h2-acc);color:#fff;padding:0}\n.h2-disc #yres{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch}\n\n/* ---------- 8 sheets */\n.h2-sh{padding:2px 2px 6px}\n.h2-sh h3{margin:2px 0 6px;text-align:center;font-size:17px}\n.h2-sub{margin:0 0 14px;text-align:center;font-size:12.5px;color:var(--mut)}.h2-sub bdi{letter-spacing:1.5px;font-weight:800}\n.h2-sh>h3+*:not(.h2-sub){margin-top:10px}\n.h2-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}\n#sheet .h2-grid button{display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 4px 12px;border-radius:18px;border:1px solid var(--ln);background:var(--card);color:var(--txt);font:700 12px inherit}\n.h2-grid button>span{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--a1,#10b981) 22%,transparent);color:var(--txt)}\n.h2-grid button>span svg{width:22px;height:22px}\n#sheet .h2-grid button.gold>span{background:rgba(245,196,81,.2);color:#f5c451}\n#sheet .h2-grid button.red{color:#fb7185}#sheet .h2-grid button.red>span{background:rgba(251,113,133,.15);color:#fb7185}\n.h2-list{display:flex;flex-direction:column;gap:2px;padding:4px 0}\n#sheet .h2-list button{height:52px;border:0;border-radius:14px;background:transparent;color:var(--txt);font:700 15.5px inherit}\n#sheet .h2-list button.red{color:#fb7185}\n#sheet .h2-cancel{width:100%;height:48px;margin-top:4px;border:0;border-top:1px solid var(--ln);border-radius:0;background:none;color:var(--mut);font:700 14.5px inherit}\n.h2-apps{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}\n#sheet .h2-apps button{display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 4px 12px;border-radius:18px;border:1px solid var(--ln);background:var(--card);color:var(--txt);font:700 12px inherit}\n#sheet .h2-apps button.on{border-color:var(--a1,#10b981);box-shadow:0 0 0 1px var(--a1,#10b981) inset}\n.h2-apps img,.h2-tg{width:44px;height:44px;border-radius:12px;object-fit:cover}\n.h2-tg{display:grid;place-items:center;background:#2aabee;color:#fff}.h2-tg svg{width:24px;height:24px}\n#sheet .h2-opt{width:100%;display:flex;align-items:center;gap:12px;padding:13px 14px;margin:0 0 10px;border-radius:18px;border:1px solid var(--ln);background:var(--card);color:var(--txt);text-align:start;font:inherit}\n.h2-opt b{display:block;font-size:15px}.h2-opt small{display:block;margin-top:2px;font-size:12px;color:var(--mut)}\n.h2-oi{flex:none;width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--a1,#10b981) 22%,transparent);color:var(--a1,#10b981)}\n.h2-oi svg{width:22px;height:22px}\n#sheet .h2-opt.red b{color:#fb7185}#sheet .h2-opt.red .h2-oi{background:rgba(251,113,133,.16);color:#fb7185}\n.h2-rows{display:flex;flex-direction:column}\n#sheet .h2-row{display:flex;align-items:center;gap:12px;padding:10px 4px;border:0;border-bottom:1px solid var(--ln);background:none;color:var(--txt);text-align:start;font:inherit}\n#sheet .h2-row:last-child{border-bottom:0}\n.h2-rav{flex:none;width:40px;height:40px;border-radius:50%;overflow:hidden;display:block}\n.h2-row>b,.h2-rt{flex:1;min-width:0}.h2-row>b{font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.h2-row>svg{width:18px;height:18px;color:#f5c451}\n.h2-rt b{display:block;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.h2-rt small{display:block;margin-top:2px;font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.h2-badge{min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:#ff4d6d;color:#fff;font:800 11px/20px inherit;font-style:normal;text-align:center}\n.h2-people{display:grid;grid-template-columns:repeat(4,1fr);gap:12px 6px}\n#sheet .h2-people button{display:flex;flex-direction:column;align-items:center;gap:6px;border:0;background:none;color:var(--txt);font:700 12px inherit;padding:0}\n.h2-people span{width:54px;height:54px;border-radius:50%;overflow:hidden}.h2-people b{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.h2-muted{margin:4px 0;color:var(--mut);font-size:12.5px;text-align:center}\n.h2-emos{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}\n#sheet .h2-emos button{height:48px;border:0;border-radius:14px;background:rgba(255,255,255,.05);font-size:25px;padding:0}\n.h2-games{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}\n#sheet .h2-games button{height:52px;border-radius:16px;border:1px solid color-mix(in srgb,var(--a1,#10b981) 40%,transparent);background:color-mix(in srgb,var(--a1,#10b981) 14%,transparent);color:var(--txt);font:800 14px inherit;display:flex;align-items:center;justify-content:center;gap:8px}\n#h2-nt{width:100%;box-sizing:border-box;min-height:130px;border-radius:16px;border:1px solid var(--ln);background:rgba(255,255,255,.06);color:var(--txt);padding:12px 14px;font:500 15px/1.7 inherit;outline:0;resize:none}\n#h2-nt:focus{border-color:var(--a1,#10b981)}\n.h2-cnt{display:block;text-align:end;color:var(--mut);font-size:11px;margin:4px 4px 0}\n#sheet .h2-save{width:100%;height:48px;margin-top:12px;border-radius:16px;border:0;background:var(--a1,#10b981);color:#fff;font:800 15px inherit}\n\n/* ---------- 9 settings */\n#sheet .h2-head{width:100%;display:flex;align-items:center;gap:12px;padding:10px;margin:8px 0 12px;border-radius:18px;border:1px solid var(--ln);background:linear-gradient(135deg,color-mix(in srgb,var(--a1,#10b981) 18%,transparent),transparent);color:var(--txt);text-align:start;font:inherit}\n.h2-head>svg{width:18px;height:18px;opacity:.6}\n[dir=rtl] .h2-head>svg,html[dir=rtl] .h2-head>svg{transform:scaleX(-1)}\n.h2-hcov{flex:none;width:56px;height:56px;border-radius:14px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,var(--a1,#10b981),color-mix(in srgb,var(--a1,#10b981) 45%,#000))}\n.h2-hcov img{width:100%;height:100%;object-fit:cover}.h2-hcov i{font:800 22px inherit;color:#fff;font-style:normal}\n.h2-ht{flex:1;min-width:0}.h2-ht b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.h2-ht small{display:block;margin-top:2px;font-size:12px;color:var(--mut)}\n.h2-card{padding:12px;margin:0 0 10px;border-radius:18px;background:var(--card,rgba(255,255,255,.05));border:1px solid var(--ln)}\n.h2-ch{display:flex;align-items:center;gap:8px;margin-bottom:8px}.h2-ch>span{color:var(--a1,#10b981);display:grid}.h2-ch>span svg{width:19px;height:19px}.h2-ch b{flex:1;font-size:14.5px}\n#sheet .h2-ch button{width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:var(--txt);display:grid;place-items:center;padding:0}.h2-ch button svg{width:14px;height:14px}\n.h2-np{margin:0;font-size:13px;line-height:1.7;white-space:pre-wrap}.h2-np i{color:var(--mut);font-style:normal}\n.h2-card label{display:block;margin:10px 2px 6px;font-size:12px;color:var(--mut)}\n.h2-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border-radius:14px;background:rgba(0,0,0,.2)}\n#sheet .h2-seg button{height:36px;border:0;border-radius:10px;background:transparent;color:var(--mut);font:700 13px inherit;padding:0}\n#sheet .h2-seg button.on{background:var(--a1,#10b981);color:#fff}\n.h2-locks{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:8px}\n#sheet .h2-locks button{height:44px;border-radius:14px;border:1px solid var(--ln);background:rgba(255,255,255,.05);color:var(--txt);font:800 14px inherit;display:flex;align-items:center;justify-content:center;gap:4px;padding:0}\n#sheet .h2-locks button.on{background:rgba(251,113,133,.2);border-color:rgba(251,113,133,.5);color:#fb7185}.h2-locks svg{width:14px;height:14px}\n.h2-bgs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}\n#sheet .h2-bg{display:flex;flex-direction:column;align-items:center;gap:5px;border:0;background:none;padding:0;color:var(--mut);font:600 11px inherit}\n.h2-bg span{width:100%;aspect-ratio:3/4;border-radius:12px;border:2px solid transparent;box-sizing:border-box;background:#0f1424}\n.h2-bg.on span{border-color:var(--a1,#10b981)}.h2-bg.on{color:var(--txt)}\n.h2-bg[data-bg=night] span{background:radial-gradient(ellipse at 50% 0%,#24305e,#05060f)}.h2-bg[data-bg=aurora] span{background:linear-gradient(160deg,#0b3b3a,#2a1450)}.h2-bg[data-bg=sunset] span{background:linear-gradient(170deg,#4a1d3f,#7a2e2e,#1d0f1f)}.h2-bg[data-bg=ocean] span{background:linear-gradient(180deg,#06324a,#050b1a)}.h2-bg[data-bg=forest] span{background:linear-gradient(180deg,#123d27,#050e09)}.h2-bg[data-bg=royal] span{background:radial-gradient(ellipse at 50% 10%,#2c3fd6,#070b2e)}.h2-bg[data-bg=rose] span{background:linear-gradient(170deg,#5a1f45,#140611)}\n.h2-gal span{display:grid;place-items:center;background:rgba(255,255,255,.06) center/cover;border:1px dashed rgba(255,255,255,.25)!important;font-size:22px;color:var(--mut)}\n#sheet .h2-link{display:block;margin:10px auto 0;border:0;background:none;color:#fb7185;font:700 12.5px inherit}\n.h2-pr{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--ln)}.h2-pr:first-of-type{border-top:0}\n.h2-pr .h2-rav{width:36px;height:36px}\n.h2-pr b{flex:1;min-width:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n#sheet .h2-pr button{height:32px;padding:0 12px;border-radius:16px;border:1px solid var(--ln);background:rgba(255,255,255,.06);color:var(--txt);font:700 12px inherit}\n#sheet .h2-pr button.on{background:var(--a1,#10b981);border-color:transparent;color:#fff}#sheet .h2-pr button.red{color:#fb7185;border-color:rgba(251,113,133,.35)}\n#sheet .h2-danger{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;height:46px;margin-top:4px;border-radius:16px;border:1px solid rgba(251,113,133,.35);background:rgba(251,113,133,.08);color:#fb7185;font:800 14px inherit}\n.h2-danger svg{width:18px;height:18px}\n\n/* ---------- 10 bubble (hall kept while browsing) */\n#h2-bub{position:fixed;right:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);z-index:9000;width:64px;height:64px;animation:h2in .35s cubic-bezier(.2,1.4,.4,1)}\n#h2-bub.hide,body.wk-typing #h2-bub{display:none}\n@keyframes h2in{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}\n.h2-bmain{position:absolute;inset:0;border-radius:50%;border:0;padding:0;display:grid;place-items:center;color:#fff;background:radial-gradient(circle at 30% 25%,color-mix(in srgb,var(--a1,#10b981) 85%,#fff),var(--a1,#10b981) 45%,color-mix(in srgb,var(--a1,#10b981) 45%,#000));box-shadow:0 10px 26px rgba(0,0,0,.45),inset 0 0 0 2px rgba(255,255,255,.22)}\n.h2-bic svg{width:28px;height:28px;display:block}\n.h2-bring{position:absolute;inset:-5px;border-radius:50%;border:2px solid var(--a1,#10b981);opacity:0}\n#h2-bub.talk .h2-bring{animation:h2talk 1.2s ease-out infinite}\n.h2-bn{position:absolute;top:-3px;left:-3px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#0b1512;color:#fff;font:800 11px/20px system-ui,sans-serif;box-shadow:0 0 0 2px var(--a1,#10b981)}\n.h2-bn:empty{display:none}\n.h2-bmic,.h2-bx{position:absolute;width:26px;height:26px;border-radius:50%;border:0;padding:0;display:grid;place-items:center;box-shadow:0 3px 10px rgba(0,0,0,.4)}\n.h2-bmic{bottom:-4px;left:-6px;background:#1f2a27;color:#fb7185}.h2-bmic.on{background:#22c55e;color:#fff}.h2-bmic:disabled{opacity:.5}\n.h2-bx{top:-6px;right:-6px;background:rgba(15,20,19,.92);color:#fff}\n.h2-bmic svg,.h2-bx svg{width:15px;height:15px}\n\n/* minimized hall shows the hall picture */\n.h2-bic{width:100%;height:100%;display:grid;place-items:center;border-radius:50%;overflow:hidden}.h2-bic.pic{padding:3px;box-sizing:border-box}.h2-bic img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}.h2-bic i{font-style:normal;font-weight:900;font-size:26px}\n/* minimized hall: a small round bubble with the hall's picture inside */\n#h2-bub{width:58px!important;height:58px!important;overflow:visible}\n#h2-bub .h2-bmain{position:absolute!important;inset:0!important;width:58px!important;height:58px!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border-radius:50%!important}\n#h2-bub .h2-bic{position:absolute;inset:0;width:100%!important;height:100%!important;border-radius:50%!important;overflow:hidden!important}\n#h2-bub .h2-bic.pic{padding:3px!important;box-sizing:border-box!important}\n#h2-bub .h2-bic img{width:100%!important;height:100%!important;max-width:100%!important;object-fit:cover!important;border-radius:50%!important;display:block!important}\n#h2-bub .h2-bmic,#h2-bub .h2-bx{min-width:0!important;min-height:0!important;margin:0!important;width:24px!important;height:24px!important}\n#h2-bub .h2-bring{border-radius:50%!important}\n";document.head.appendChild(s)})();
const api_={exit:exitSheet,idTap,peopleSheet,menu:openMenu,speaker,mic,type,emoji,gift,inbox,send,apps,search,provider,tgFilms,keep,leave,notice,saveNotice,
 set:setRule,setBg,lockSeat,mod,kick,clear:clearChat,bgPick,bgReset,put,game,settings,seat:seatTap,kb,state:S};
window.H2=api_;window.WM78=Object.assign(window.WM78||{},{version:'h2',state:{composing:false}});
/* names other parts of the app already call */
window.wm78Search=search;window.wm78Exit=leave;window.wm78Provider=provider;window.wm78Send=send;window.wm78Seat=seatTap;window.wm78Menu=openMenu;window.wm78Mic=mic;window.wm78Speaker=speaker;
window.wk51Exit=exitSheet;window.wk64Settings=settings;window.wk47Folder=openMenu;window.wk64Emoji=emoji;
try{if(ME?.me&&TAB==='c'&&CV==='hall'&&CID)rHall()}catch(e){}
})();
