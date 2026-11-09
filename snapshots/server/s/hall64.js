/* WAKHAN M64: hall settings (inspired by TopTop, Wakhan's own design).
   Owner: cover/name, pinned announcement, who may enter / use the mic / chat, background, people in the hall
   (mute / remove), muted & removed lists, clear chat. Everyone: sees the announcement and background; the
   server enforces the rules and the app explains a "no" in plain words. */
(function(){
"use strict";
if(window.__wk64)return;window.__wk64=1;
const T={
 fa:{set:"تنظیمات سالون",edit:"ویرایش عکس و نام",notice:"اعلان سالون",noticePh:"یک پیام برای همه که بالای چت سنجاق بمانه…",noNotice:"هنوز اعلانی نگذاشتی",save:"ذخیره",access:"دسترسی‌ها",enter:"کی داخل شده می‌تانه",mic:"کی مایک گرفته می‌تانه",chat:"کی چت کده می‌تانه",all:"همه",friends:"رفیقا",closed:"هیچ‌کس",owner:"فقط مه",bg:"پس‌زمینه",people:"حاضرین سالون",nobody:"به جز تو کسی داخل نیست",mute:"بی‌صدا",kick:"بیرون",muted:"بی‌صدا شده‌ها",banned:"بیرون شده‌ها",empty:"خالی است",undo:"برداشتن",clear:"پاک کدن همهٔ چت",clearQ:"همهٔ پیام‌های چت سالون برای همه پاک شوه؟",kickQ:"از سالون بیرون شوه و دوباره داخل آمده نتانه؟",saved:"ذخیره شد",err:"نشد؛ دوباره کوشش کو",cleared:"چت پاک شد",
  hall_banned:"صاحب سالون تو ره ازی سالون بیرون کده",hall_closed:"ای سالون فعلاً بسته است",hall_friends:"ای سالون فقط برای رفیقای صاحب سالون است",hall_muted:"صاحب سالون تو ره بی‌صدا کده",hall_mic_owner:"مایک ای سالون فقط برای صاحبش است",hall_mic_friends:"مایک فقط برای رفیقای صاحب سالون است",hall_chat_owner:"چت ای سالون فقط برای صاحبش است",hall_chat_friends:"چت فقط برای رفیقای صاحب سالون است",chatOff:"چت برای تو بسته است",pin:"اعلان",lock:"قفل سالون",unlock:"باز کدن سالون",locked:"سالون قفل شد",opened:"سالون باز شد",gallery:"از گالری",rmPhoto:"حذف عکس",sitHere:"اینجا بشین",lockSeat:"قفل این جایگاه",unlockSeat:"باز کدن این جایگاه",profile:"دیدن پروفایل",unseat:"برداشتن از جایگاه",kickHall:"بیرون کدن از سالون",cancel:"لغو",hall_seat_locked:"ای جایگاه قفل است",seatLocks:"قفل جایگاه‌ها",seatLocksSub:"روی شمارهٔ هر جایگاه بزن تا قفل یا باز شوه",dice:"تاس بنداز",lucky:"عدد شانس",diceMsg:"🎲 تاس انداخت: ",luckyMsg:"🍀 عدد شانسش: ",emoji:"شکلک‌ها"},
 en:{set:"Hall settings",edit:"Edit photo & name",notice:"Announcement",noticePh:"A message pinned above the chat for everyone…",noNotice:"No announcement yet",save:"Save",access:"Access",enter:"Who can enter",mic:"Who can use the mic",chat:"Who can chat",all:"Everyone",friends:"Friends",closed:"Nobody",owner:"Only me",bg:"Background",people:"In the hall",nobody:"Nobody else is here",mute:"Mute",kick:"Remove",muted:"Muted",banned:"Removed",empty:"Empty",undo:"Undo",clear:"Clear the whole chat",clearQ:"Clear all hall chat messages for everyone?",kickQ:"Remove from the hall and block re-entry?",saved:"Saved",err:"Failed, try again",cleared:"Chat cleared",
  hall_banned:"The owner removed you from this hall",hall_closed:"This hall is closed right now",hall_friends:"This hall is only for the owner's friends",hall_muted:"The owner muted you",hall_mic_owner:"Only the owner can use the mic here",hall_mic_friends:"Only the owner's friends can use the mic",hall_chat_owner:"Only the owner can chat here",hall_chat_friends:"Only the owner's friends can chat",chatOff:"Chat is closed for you",pin:"Notice",lock:"Lock hall",unlock:"Unlock hall",locked:"Hall locked",opened:"Hall opened",gallery:"From gallery",rmPhoto:"Remove photo",sitHere:"Sit here",lockSeat:"Lock this seat",unlockSeat:"Unlock this seat",profile:"View profile",unseat:"Remove from seat",kickHall:"Remove from hall",cancel:"Cancel",hall_seat_locked:"This seat is locked",seatLocks:"Seat locks",seatLocksSub:"Tap a seat number to lock or unlock it",dice:"Roll dice",lucky:"Lucky number",diceMsg:"🎲 rolled: ",luckyMsg:"🍀 lucky number: ",emoji:"Emoji"}};
T.ps=Object.assign({},T.fa,{set:"د سالون تنظیمات",save:"ساتل",all:"ټول",friends:"ملګري",owner:"یوازې زه",mute:"چوپ",kick:"وباسه"});
const tx=()=>{const l=document.documentElement.lang||"fa";return l.startsWith("ps")?T.ps:l.startsWith("fa")?T.fa:T.en};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const vib=()=>{try{hap()}catch(e){}};
const cid=()=>{try{return CID||""}catch(e){return ""}};
const BG={"":"پیش‌فرض",night:"شب شهر",aurora:"شفق",sunset:"غروب",ocean:"دریا",forest:"جنگل",royal:"شاهانه",rose:"گلابی"};
const I={
 gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
 mega:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
 pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
 lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
 unlock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>',
 chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6-6 6 6 6"/></svg>',
 trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>'};

/* ---------- data */
let H=null,HC="",HT=0;
async function load(force){const c=cid();if(!c)return null;if(!force&&H&&HC===c&&Date.now()-HT<8000)return H;
 try{const j=await api("/api/v51/hall?code="+encodeURIComponent(c));if(j&&j.ok&&j.hall){H=j.hall;HC=c;HT=Date.now();apply()}}catch(e){}return H}
async function post(body){vib();try{const j=await api("/api/v51/hall",Object.assign({code:cid()},body));if(!j||!j.ok)throw Error(j&&j.err||"x");H=j.hall;HT=Date.now();apply();return true}catch(e){say(tx().err);return false}}
function say(m){try{toast(m)}catch(e){}}

/* ---------- plain-words errors for every "no" from the server */
let lastHall=0;
(function wrapApi(){if(typeof api==="undefined")return setTimeout(wrapApi,300);const oa=api;api=async function(){const j=await oa.apply(this,arguments);try{if(j&&j.err&&/^hall_/.test(j.err)){const m=tx()[j.err];if(m){lastHall=Date.now();say(m)}}}catch(e){}return j}})();
(function wrapToast(){if(typeof toast==="undefined")return setTimeout(wrapToast,300);const ot=toast;toast=function(m){try{const t=tx();if(Date.now()-lastHall<1500&&!Object.values(t).includes(m))return;if(typeof m==="string"&&t[m])m=t[m]}catch(e){}return ot.apply(this,arguments)}})();
/* the mic is not even switched on when the rules say no (audio is peer-to-peer, so this matters) */
(function wrapMic(){if(typeof vcMute==="undefined")return setTimeout(wrapMic,400);const om=vcMute;vcMute=async function(){try{if(typeof VC!=="undefined"&&VC.mute&&H&&HC===cid()&&H.can&&H.can.mic===false){const k=tx();say(k[H.mic==="owner"?"hall_mic_owner":"hall_mic_friends"]||k.hall_muted);return}}catch(e){}return om.apply(this,arguments)}})();

/* ---------- apply to the hall: background, pinned notice, chat lock, forced mute, cleared chat */
function apply(){
 const r=document.getElementById("wm78-room");if(!r||!H||HC!==cid())return;
 if((r.dataset.wkbg||"")!==(H.bg||""))r.dataset.wkbg=H.bg||"";
 const img=H.bgphoto?`url("${H.bgphoto}")`:"";if(r.style.getPropertyValue("--wk-bgimg")!==img){if(img)r.style.setProperty("--wk-bgimg",img);else r.style.removeProperty("--wk-bgimg")}
 if(r.classList.contains("wk-photo")!==!!img)r.classList.toggle("wk-photo",!!img);
 const hall=document.getElementById("hall");if(hall){const locks=new Set(H.locks||[]);[...hall.children].forEach((b,i)=>{const lk=locks.has(i)&&b.classList.contains("is-empty");if(b.classList.contains("wk-locked")!==lk)b.classList.toggle("wk-locked",lk);const host=String(b.dataset.wm78Uid||"")===String(H.owner_id);if(b.classList.contains("wk-host")!==host)b.classList.toggle("wk-host",host)})}
 const form=document.getElementById("wm70-live-compose");if(form&&!form.querySelector(".wk64-emo")){const e=document.createElement("button");e.type="button";e.className="wk64-emo";e.setAttribute("aria-label",tx().emoji);e.textContent="😊";e.onclick=wk64Emoji;form.prepend(e)}
 const anchor=document.getElementById("wm70-live-messages");
 if(anchor){let n=r.querySelector(".wk64-notice");const show=!!H.notice||H.is_owner;
  if(!show){if(n)n.remove()}else{const html=`<span class="wk64-ni">${I.mega}</span><p dir="auto">${H.notice?esc(H.notice):`<i>${esc(tx().noNotice)}</i>`}</p>${H.is_owner?`<button type="button" onclick="wk64Notice()" aria-label="edit">${I.pen}</button>`:""}`;
   if(!n){n=document.createElement("div");n.className="wk64-notice"}if(anchor.firstElementChild!==n)anchor.prepend(n);if(n.dataset.h!==html){n.innerHTML=html;n.dataset.h=html}}}
 const inp=document.getElementById("wm70-room-text");
 if(inp&&H.can){const off=H.can.chat===false;if(off&&!inp.dataset.wk64){inp.dataset.wk64=inp.placeholder;inp.placeholder=tx().chatOff;inp.disabled=true}else if(!off&&inp.dataset.wk64){inp.placeholder=inp.dataset.wk64;delete inp.dataset.wk64;inp.disabled=false}}
 try{if(H.can&&H.can.mic===false&&typeof VC!=="undefined"&&VC.on&&!VC.mute){vcMute()}}catch(e){}
 try{if(H.clear_id&&typeof WM70!=="undefined"&&Array.isArray(WM70.hallMessages)){const f=WM70.hallMessages.filter(m=>!(Number(m.id)<=H.clear_id));if(f.length!==WM70.hallMessages.length){WM70.hallMessages=f;try{wm70HallMessages()}catch(e){}}}}catch(e){}
}
setInterval(()=>{if(document.getElementById("wm78-room"))load(false);},2500);
new MutationObserver(()=>{if(document.getElementById("wm78-room"))apply()}).observe(document.getElementById("view")||document.body,{childList:true,subtree:true});

/* ---------- notice editor */
window.wk64Notice=function(){vib();const t=tx();try{sheet(`<section class="wk64-sh"><h3>${esc(t.notice)}</h3><textarea id="wk64-nt" maxlength="300" dir="auto" placeholder="${esc(t.noticePh)}">${esc(H&&H.notice||"")}</textarea><small class="wk64-cnt"><span id="wk64-nc">${(H&&H.notice||"").length}</span>/300</small><button type="button" class="wk64-save" onclick="wk64SaveNotice()">${esc(t.save)}</button></section>`);const a=document.getElementById("wk64-nt");if(a){a.oninput=()=>{const c=document.getElementById("wk64-nc");if(c)c.textContent=a.value.length};setTimeout(()=>a.focus(),250)}}catch(e){}};
window.wk64SaveNotice=async function(){const a=document.getElementById("wk64-nt");if(await post({notice:a?a.value:""})){try{closeSheet()}catch(e){}say(tx().saved)}};

/* ---------- settings sheet */
function seg(key,opts){const t=tx(),v=H[key]||"all";return `<div class="wk64-seg">${opts.map(o=>`<button type="button" class="${v===o?"on":""}" onclick="wk64Set('${key}','${o}')">${esc(t[o])}</button>`).join("")}</div>`}
function people(){const t=tx();let seats=[];try{seats=(CS&&CS.seats||[]).filter(x=>x&&String(x.id)!==String(ME.me.id))}catch(e){}
 if(!seats.length)return `<p class="wk64-muted">${esc(t.nobody)}</p>`;
 const muted=new Set((H.muted||[]).map(x=>String(x.id)));
 return seats.map(p=>`<div class="wk64-pr"><span class="wk64-pav">${(()=>{try{return wm70Avatar(p)}catch(e){return esc((p.name||"?").charAt(0))}})()}</span><b dir="auto">${esc(p.name)}</b><button type="button" class="${muted.has(String(p.id))?"on":""}" onclick="wk64Mod('${muted.has(String(p.id))?"unmute":"mute"}',${Number(p.id)})">${esc(muted.has(String(p.id))?t.undo:t.mute)}</button><button type="button" class="red" onclick="wk64Kick(${Number(p.id)})">${esc(t.kick)}</button></div>`).join("")}
function list(key,act){const t=tx(),a=H[key]||[];if(!a.length)return `<p class="wk64-muted">${esc(t.empty)}</p>`;return a.map(p=>`<div class="wk64-pr"><b dir="auto">${esc(p.name)}</b><button type="button" onclick="wk64Mod('${act}',${Number(p.id)})">${esc(t.undo)}</button></div>`).join("")}
function settingsHtml(){const t=tx(),h=H;
 return `<section class="wk64-sh wk64-set"><h3>${esc(t.set)}</h3>
 <button type="button" class="wk64-top" onclick="closeSheet();setTimeout(()=>wk52HallEdit('${esc(h.code)}'),200)"><span class="wk64-cov">${h.photo?`<img src="${esc(h.photo)}" alt="">`:`<i>${esc((h.name||"W").charAt(0))}</i>`}</span><span class="wk64-tt"><b dir="auto">${esc(h.name)}</b><small>${esc(t.edit)} · <bdi>${esc(h.code)}</bdi></small></span>${I.chev}</button>
 <div class="wk64-card"><div class="wk64-ch"><span>${I.mega}</span><b>${esc(t.notice)}</b><button type="button" onclick="closeSheet();setTimeout(wk64Notice,200)">${I.pen}</button></div><p class="wk64-np" dir="auto">${h.notice?esc(h.notice):`<i>${esc(t.noNotice)}</i>`}</p></div>
 <div class="wk64-card"><div class="wk64-ch"><span>${I.lock}</span><b>${esc(t.access)}</b></div>
  <label>${esc(t.enter)}</label>${seg("enter",["all","friends","closed"])}
  <label>${esc(t.mic)}</label>${seg("mic",["all","friends","owner"])}
  <label>${esc(t.chat)}</label>${seg("chat",["all","friends","owner"])}</div>
 <div class="wk64-card"><div class="wk64-ch"><span>${I.lock}</span><b>${esc(t.seatLocks)}</b></div><p class="wk64-muted">${esc(t.seatLocksSub)}</p><div class="wk64-locks">${Array.from({length:10},(_,i)=>`<button type="button" class="${(h.locks||[]).includes(i)?"on":""}" onclick="wk64Mod2(${i})">${(h.locks||[]).includes(i)?I.lock:""}<span>${i+1}</span></button>`).join("")}</div></div>
 <div class="wk64-card"><div class="wk64-ch"><span>${I.gear}</span><b>${esc(t.bg)}</b></div><div class="wk64-bgs"><button type="button" class="wk64-bg wk64-gal ${h.bgphoto?"on":""}" onclick="wk64BgPick()"><span ${h.bgphoto?`style="background-image:url('${esc(h.bgphoto)}')"`:""}>${h.bgphoto?"":"＋"}</span><small>${esc(t.gallery)}</small></button>${Object.keys(BG).map(k=>`<button type="button" class="wk64-bg ${(h.bg||"")===k?"on":""}" data-wkbg="${k}" onclick="wk64Set('bg','${k}')${h.bgphoto?";wk64BgReset()":""}"><span></span><small>${esc(BG[k])}</small></button>`).join("")}</div>${h.bgphoto?`<button type="button" class="wk64-link" onclick="wk64BgReset()">${esc(t.rmPhoto)}</button>`:""}</div>
 <div class="wk64-card"><div class="wk64-ch"><b>${esc(t.people)}</b></div>${people()}</div>
 <div class="wk64-card"><div class="wk64-ch"><b>${esc(t.muted)}</b></div>${list("muted","unmute")}</div>
 <div class="wk64-card"><div class="wk64-ch"><b>${esc(t.banned)}</b></div>${list("banned","unban")}</div>
 <button type="button" class="wk64-danger" onclick="wk64Clear()">${I.trash}<span>${esc(t.clear)}</span></button></section>`}
function redraw(){const b=document.querySelector("#sheet .wk64-set");if(b){const sc=b.closest("#sheet")?.scrollTop||0;b.outerHTML=settingsHtml();const sh=document.getElementById("sheet");if(sh)sh.scrollTop=sc}}
window.wk64Settings=async function(){vib();const h=await load(true);if(!h||!h.is_owner)return;try{sheet(settingsHtml())}catch(e){}};
window.wk64Set=async function(k,v){if(await post({[k]:v}))redraw()};
window.wk64Mod2=async function(i){const lk=(H.locks||[]).includes(i);if(await post({action:lk?"unlock_seat":"lock_seat",i}))redraw()};
window.wk64Mod=async function(a,uid){if(await post({action:a,uid}))redraw()};
window.wk64Kick=function(uid){const go=async ok=>{if(ok&&await post({action:"ban",uid}))redraw()};try{tg.showConfirm(tx().kickQ,go)}catch(e){go(confirm(tx().kickQ))}};
window.wk64Clear=function(){const go=async ok=>{if(ok&&await post({action:"clear_chat"})){say(tx().cleared);redraw()}};try{tg.showConfirm(tx().clearQ,go)}catch(e){go(confirm(tx().clearQ))}};
window.wk64Lock=async function(){const closed=H&&H.enter==="closed";if(await post({enter:closed?"all":"closed"}))say(tx()[closed?"opened":"locked"])};
const tg=window.Telegram&&Telegram.WebApp;

/* ---------- folder: settings first, lock/unlock, and the hall's real name as title */
(function wrapFolder(){if(typeof wk47Folder==="undefined")return setTimeout(wrapFolder,400);const of=wk47Folder;
 window.wk47Folder=async function(){await load(false);const r=of.apply(this,arguments);try{const s=document.querySelector("#sheet .wf47");if(!s||!H)return r;const t=tx();
  const h3=s.querySelector("h3");if(h3&&H.name)h3.textContent=H.name;
  if(H.is_owner){const g=s.querySelector(".wf-grid");if(g){const mk=(ic,label,act,cls)=>{const b=document.createElement("button");b.type="button";b.className="wf-it "+(cls||"");b.innerHTML=`<span class="wf-ic">${ic}</span><b>${esc(label)}</b>`;b.onclick=()=>{try{closeSheet()}catch(e){}setTimeout(act,180)};return b};
   g.prepend(mk(H.enter==="closed"?I.unlock:I.lock,H.enter==="closed"?t.unlock:t.lock,wk64Lock));g.prepend(mk(I.gear,t.set,wk64Settings,"gold"))}}}catch(e){}return r}})();
/* the hall name chip opens the settings for the owner */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".wk52-hall");if(!b||!H||!H.is_owner)return;e.stopPropagation();e.preventDefault();wk64Settings()},true);


/* ---------- seat menu (owner): sit / lock / profile / mute / remove */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#hall>.wm78-seat");if(!b||!H||HC!==cid())return;const hall=document.getElementById("hall");const i=[...hall.children].indexOf(b);const t=tx();
 if(b.classList.contains("is-empty")){
  const locked=(H.locks||[]).includes(i);
  if(!H.is_owner){if(locked){e.stopPropagation();e.preventDefault();say(t.hall_seat_locked)}return}
  let mine=-1;try{mine=CS.mine}catch(_){}if(mine>=0&&!locked)return;
  e.stopPropagation();e.preventDefault();vib();seatMenu(i);return}
 const uid=Number(b.dataset.wm78Uid);if(!H.is_owner||!uid||String(uid)===String((typeof ME!=="undefined"&&ME.me&&ME.me.id)||""))return;
 e.stopPropagation();e.preventDefault();vib();const muted=(H.muted||[]).some(x=>Number(x.id)===uid);
 menu([[t.profile,()=>{try{wm70OpenProfile(uid)}catch(_){}}],[muted?t.undo+" · "+t.mute:t.mute,()=>post({action:muted?"unmute":"mute",uid})],[t.unseat,()=>post({action:"unseat",uid})],[t.kickHall,()=>wk64Kick(uid),"red"]]);
},true);
function seatMenu(i,long){if(!H||!H.is_owner)return;const t=tx(),locked=(H.locks||[]).includes(i);let mine=-1;try{mine=CS.mine}catch(_){}
 const items=[];if(!locked)items.push([mine>=0?t.sitHere:t.sitHere,()=>{try{wm78Seat(i)}catch(_){try{cinSit(i)}catch(__){}}}]);items.push([locked?t.unlockSeat:t.lockSeat,()=>post({action:locked?"unlock_seat":"lock_seat",i})]);menu(items)}
window.wk64SeatMenu=seatMenu;
function menu(items){const t=tx();window.__wk64m=items;try{sheet(`<section class="wk64-menu">${items.map((x,i)=>`<button type="button" class="${x[2]||""}" onclick="closeSheet();setTimeout(()=>window.__wk64m[${i}][1](),160)">${esc(x[0])}</button>`).join("")}<button type="button" class="wk64-cancel" onclick="closeSheet()">${esc(t.cancel)}</button></section>`)}catch(e){}}

/* ---------- emoji, dice, lucky number */
const EMO="😂 😍 🥰 😎 🤩 😢 😡 👏 🙏 🔥 ❤️ 💔 🌹 🎉 👋 💯 😴 🤔 🙈 💪 🇦🇫 🎶 ✨ 🤝".split(" ");
window.wk64Emoji=function(){vib();const t=tx();try{sheet(`<section class="wk64-sh"><h3>${esc(t.emoji)}</h3><div class="wk64-emos">${EMO.map(x=>`<button type="button" onclick="wk64Put('${x}')">${x}</button>`).join("")}</div><div class="wk64-games"><button type="button" onclick="wk64Game('dice')">🎲 <span>${esc(t.dice)}</span></button><button type="button" onclick="wk64Game('lucky')">🍀 <span>${esc(t.lucky)}</span></button></div></section>`)}catch(e){}};
window.wk64Put=function(x){const i=document.getElementById("wm70-room-text");if(i){i.value+=x;i.dispatchEvent(new Event("input",{bubbles:true}))}try{closeSheet()}catch(e){}setTimeout(()=>{try{i&&i.focus()}catch(e){}},200)};
window.wk64Game=function(k){const t=tx(),i=document.getElementById("wm70-room-text");if(!i)return;const n=k==="dice"?1+Math.floor(Math.random()*6):1+Math.floor(Math.random()*100);const keep=i.value;i.value=(k==="dice"?t.diceMsg:t.luckyMsg)+n;try{closeSheet()}catch(e){}try{wm78Send()}catch(e){try{wm70SendRoom()}catch(_){}}setTimeout(()=>{if(i.value===""&&keep)i.value=keep},300)};

/* ---------- background from gallery */
window.wk64BgPick=function(){const f=document.createElement("input");f.type="file";f.accept="image/*";f.onchange=()=>{const file=f.files&&f.files[0];if(!file)return;const url=URL.createObjectURL(file),im=new Image();im.onload=async()=>{const W=900,Hh=1600,c=document.createElement("canvas");c.width=W;c.height=Hh;const sc=Math.max(W/im.width,Hh/im.height),w=im.width*sc,h=im.height*sc;c.getContext("2d").drawImage(im,(W-w)/2,(Hh-h)/2,w,h);URL.revokeObjectURL(url);if(await post({bgphoto:c.toDataURL("image/jpeg",.82)})){say(tx().saved);redraw()}};im.src=url};f.click()};
window.wk64BgReset=async function(){if(await post({reset_bgphoto:true}))redraw()};
const st=document.createElement("style");st.textContent=`
#view #wm78-room[data-wkbg=night]{background:radial-gradient(ellipse at 50% 0%,#24305e 0%,#0b1024 60%,#05060f 100%)!important}
#view #wm78-room[data-wkbg=aurora]{background:linear-gradient(160deg,#0b3b3a 0%,#123a5c 45%,#2a1450 100%)!important}
#view #wm78-room[data-wkbg=sunset]{background:linear-gradient(170deg,#4a1d3f 0%,#7a2e2e 45%,#1d0f1f 100%)!important}
#view #wm78-room[data-wkbg=ocean]{background:linear-gradient(180deg,#06324a 0%,#0a1f3d 55%,#050b1a 100%)!important}
#view #wm78-room[data-wkbg=forest]{background:linear-gradient(180deg,#123d27 0%,#0b2418 55%,#050e09 100%)!important}
#view #wm78-room[data-wkbg=royal]{background:radial-gradient(ellipse at 50% 10%,#2c3fd6 0%,#141f7a 45%,#070b2e 100%)!important}
#view #wm78-room[data-wkbg=rose]{background:linear-gradient(170deg,#5a1f45 0%,#3a1238 50%,#140611 100%)!important}
.wk64-bg[data-wkbg=""] span{background:var(--bg,#0f2a22)}.wk64-bg[data-wkbg=night] span{background:radial-gradient(ellipse at 50% 0%,#24305e,#05060f)}.wk64-bg[data-wkbg=aurora] span{background:linear-gradient(160deg,#0b3b3a,#2a1450)}.wk64-bg[data-wkbg=sunset] span{background:linear-gradient(170deg,#4a1d3f,#7a2e2e,#1d0f1f)}.wk64-bg[data-wkbg=ocean] span{background:linear-gradient(180deg,#06324a,#050b1a)}.wk64-bg[data-wkbg=forest] span{background:linear-gradient(180deg,#123d27,#050e09)}.wk64-bg[data-wkbg=royal] span{background:radial-gradient(ellipse at 50% 10%,#2c3fd6,#070b2e)}.wk64-bg[data-wkbg=rose] span{background:linear-gradient(170deg,#5a1f45,#140611)}
#view #wm78-room .wk64-notice{position:relative;z-index:3;flex:none;display:flex;align-items:flex-start;gap:8px;margin:2px 0 6px;padding:8px 10px;border-radius:14px;background:color-mix(in srgb,var(--a1,#10b981) 16%,rgba(0,0,0,.25));border:1px solid color-mix(in srgb,var(--a1,#10b981) 35%,transparent);opacity:1!important;pointer-events:auto}
.wk64-notice .wk64-ni{flex:0 0 22px;color:var(--a1,#10b981)}.wk64-notice .wk64-ni svg{width:20px;height:20px}
.wk64-notice p{flex:1;margin:1px 0 0;font-size:12.5px;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;word-break:break-word;color:var(--txt,#fff)}.wk64-notice p i{color:var(--mut);font-style:normal}
body #view .wk64-notice button{flex:0 0 28px;width:28px!important;height:28px!important;min-height:0!important;padding:0!important;border:0!important;border-radius:50%!important;background:rgba(255,255,255,.1)!important;color:var(--txt)!important;display:grid!important;place-items:center}.wk64-notice button svg{width:14px;height:14px}
.wk64-sh{padding:2px 2px 6px}.wk64-sh h3{margin:2px 0 14px;text-align:center;font-size:17px}
#wk64-nt{width:100%;box-sizing:border-box;min-height:130px;border-radius:16px;border:1px solid var(--ln,rgba(255,255,255,.14));background:rgba(255,255,255,.06);color:var(--txt);padding:12px 14px;font:500 15px/1.7 system-ui,-apple-system,sans-serif;outline:0;resize:none}
#wk64-nt:focus{border-color:var(--a1,#10b981)}.wk64-cnt{display:block;text-align:end;color:var(--mut);font-size:11px;margin:4px 4px 0}
#sheet .wk64-save{width:100%;height:48px;margin-top:12px;border-radius:16px;border:0;background:var(--a1,#10b981);color:#fff;font:800 15px system-ui,-apple-system,sans-serif}
#sheet .wk64-top{width:100%;display:flex;align-items:center;gap:12px;padding:10px;margin:0 0 12px;border-radius:18px;border:1px solid var(--ln,rgba(255,255,255,.1));background:linear-gradient(135deg,color-mix(in srgb,var(--a1,#10b981) 18%,transparent),transparent);color:var(--txt);text-align:start;font:inherit}
.wk64-top>svg{width:18px;height:18px;opacity:.6}
.wk64-cov{flex:0 0 56px;width:56px;height:56px;border-radius:14px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,var(--a1,#10b981),color-mix(in srgb,var(--a1,#10b981) 45%,#000))}.wk64-cov img{width:100%;height:100%;object-fit:cover}.wk64-cov i{font:800 22px system-ui;color:#fff;font-style:normal}
.wk64-tt{flex:1;min-width:0}.wk64-tt b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wk64-tt small{display:block;margin-top:2px;font-size:12px;color:var(--mut)}
.wk64-card{padding:12px;margin:0 0 10px;border-radius:18px;background:var(--card,rgba(255,255,255,.05));border:1px solid var(--ln,rgba(255,255,255,.08))}
.wk64-ch{display:flex;align-items:center;gap:8px;margin-bottom:8px}.wk64-ch>span{color:var(--a1,#10b981);display:grid}.wk64-ch>span svg{width:19px;height:19px}.wk64-ch b{flex:1;font-size:14.5px}
#sheet .wk64-ch button{width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:var(--txt);display:grid;place-items:center;padding:0}.wk64-ch button svg{width:14px;height:14px}
.wk64-np{margin:0;font-size:13px;line-height:1.7;color:var(--txt);white-space:pre-wrap}.wk64-np i{color:var(--mut);font-style:normal}
.wk64-card label{display:block;margin:10px 2px 6px;font-size:12px;color:var(--mut)}
.wk64-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border-radius:14px;background:rgba(0,0,0,.2)}
#sheet .wk64-seg button{height:36px;border:0;border-radius:10px;background:transparent;color:var(--mut);font:700 13px system-ui,-apple-system,sans-serif;padding:0}
#sheet .wk64-seg button.on{background:var(--a1,#10b981);color:#fff}
.wk64-bgs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
#sheet .wk64-bg{display:flex;flex-direction:column;align-items:center;gap:5px;border:0;background:none;padding:0;color:var(--mut);font:600 11px system-ui,-apple-system,sans-serif}
.wk64-bg span{width:100%;aspect-ratio:3/4;border-radius:12px;border:2px solid transparent;box-sizing:border-box}.wk64-bg.on span{border-color:var(--a1,#10b981)}.wk64-bg.on{color:var(--txt)}
.wk64-pr{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--ln,rgba(255,255,255,.06))}.wk64-pr:first-of-type{border-top:0}
.wk64-pav{flex:0 0 36px;width:36px;height:36px;border-radius:50%;overflow:hidden;display:block}.wk64-pav>*{width:100%!important;height:100%!important}
.wk64-pr b{flex:1;min-width:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#sheet .wk64-pr button{height:32px;padding:0 12px;border-radius:16px;border:1px solid var(--ln,rgba(255,255,255,.14));background:rgba(255,255,255,.06);color:var(--txt);font:700 12px system-ui,-apple-system,sans-serif}
#sheet .wk64-pr button.on{background:var(--a1,#10b981);border-color:transparent;color:#fff}#sheet .wk64-pr button.red{color:#fb7185;border-color:rgba(251,113,133,.35)}
.wk64-muted{margin:2px 0;color:var(--mut);font-size:12.5px}
#sheet .wk64-danger{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;height:46px;margin-top:4px;border-radius:16px;border:1px solid rgba(251,113,133,.35);background:rgba(251,113,133,.08);color:#fb7185;font:800 14px system-ui,-apple-system,sans-serif}.wk64-danger svg{width:18px;height:18px}

/* glass hall: everything floats over the background */
#view #wm78-room.wk-photo{background:linear-gradient(180deg,rgba(0,0,0,.45) 0%,rgba(0,0,0,.12) 28%,rgba(0,0,0,.18) 60%,rgba(0,0,0,.72) 100%),var(--wk-bgimg) center/cover no-repeat!important}
#view #wm78-room .wm78-seat.is-empty .wm78-seat-face{background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.16)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:rgba(255,255,255,.75)!important}
#view #wm78-room .wm78-seat>b,#view #wm78-room .wm78-seat>small,#view #wm78-room .wm78-section-title{text-shadow:0 1px 3px rgba(0,0,0,.85)}
#view #wm78-room .wm78-seat.wk-locked .wm78-seat-face>*{display:none!important}
#view #wm78-room .wm78-seat.wk-locked .wm78-seat-face:after{content:"";width:46%;height:46%;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round'%3E%3Crect x='5' y='11' width='14' height='10' rx='2.5'/%3E%3Cpath d='M8 11V8a4 4 0 0 1 8 0v3'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round'%3E%3Crect x='5' y='11' width='14' height='10' rx='2.5'/%3E%3Cpath d='M8 11V8a4 4 0 0 1 8 0v3'/%3E%3C/svg%3E") center/contain no-repeat}
#view #wm78-room .wm78-seat.wk-host>b{color:#ffd76a!important}
body #view #wm78-room:not(.is-writing) .wm78-message>div{background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;padding:0 2px!important}
body #view #wm78-room .wm78-message{align-items:flex-start!important;margin:0 0 9px!important}
body #view #wm78-room .wm78-message .wm78-message-name{display:block!important;font-size:12px!important;font-weight:800!important;margin:0 0 1px!important;text-shadow:0 1px 3px rgba(0,0,0,.9)}
body #view #wm78-room .wm78-message p{display:block!important;font-size:14.5px!important;font-weight:700!important;color:#fff!important;text-shadow:0 1px 3px rgba(0,0,0,.95),0 0 8px rgba(0,0,0,.45)}
body #view #wm78-room .wm78-message-avatar img{width:30px!important;height:30px!important;border-radius:50%;box-shadow:0 0 0 1.5px rgba(255,255,255,.25)}
#view #wm78-room .wm78-footer{background:linear-gradient(180deg,transparent,rgba(0,0,0,.35))!important;border:0!important}
#view #wm78-room #wm70-live-compose{background:rgba(255,255,255,.1)!important;border:1px solid rgba(255,255,255,.16)!important;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
#view #wm78-room .wk47-av>button,#view #wm78-room .wk47-folder,#view #wm78-room .wk47-exit{backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
body #view #wm78-room .wk64-emo{flex:0 0 38px;width:38px!important;height:38px!important;min-height:0!important;padding:0!important;margin:0 4px!important;border:0!important;border-radius:50%!important;background:rgba(255,255,255,.1)!important;font-size:19px!important;line-height:38px!important;display:grid!important;place-items:center}
#view #wm78-room .wk64-notice{background:rgba(0,0,0,.35)!important;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.wk64-menu{display:flex;flex-direction:column;gap:2px;padding:4px 0}
#sheet .wk64-menu button{height:52px;border:0;border-radius:14px;background:transparent;color:var(--txt);font:700 15.5px system-ui,-apple-system,sans-serif}
#sheet .wk64-menu button:active{background:rgba(255,255,255,.06)}#sheet .wk64-menu button.red{color:#fb7185}
#sheet .wk64-menu .wk64-cancel{margin-top:6px;border-top:1px solid var(--ln,rgba(255,255,255,.08));border-radius:0;color:var(--mut)}
.wk64-emos{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
#sheet .wk64-emos button{height:48px;border:0;border-radius:14px;background:rgba(255,255,255,.05);font-size:25px;padding:0}
.wk64-games{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
#sheet .wk64-games button{height:52px;border-radius:16px;border:1px solid color-mix(in srgb,var(--a1,#10b981) 40%,transparent);background:color-mix(in srgb,var(--a1,#10b981) 14%,transparent);color:var(--txt);font:800 14px system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px}
.wk64-gal span{display:grid;place-items:center;background:rgba(255,255,255,.06) center/cover;border:1px dashed rgba(255,255,255,.25)!important;font-size:22px;color:var(--mut)}
#sheet .wk64-link{display:block;margin:10px auto 0;border:0;background:none;color:#fb7185;font:700 12.5px system-ui,-apple-system,sans-serif}
.wk64-locks{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:8px}
#sheet .wk64-locks button{height:44px;border-radius:14px;border:1px solid var(--ln,rgba(255,255,255,.14));background:rgba(255,255,255,.05);color:var(--txt);font:800 14px system-ui;display:flex;align-items:center;justify-content:center;gap:4px;padding:0}
#sheet .wk64-locks button.on{background:color-mix(in srgb,#fb7185 22%,transparent);border-color:rgba(251,113,133,.5);color:#fb7185}.wk64-locks svg{width:14px;height:14px}
`;document.head.appendChild(st);
})();
