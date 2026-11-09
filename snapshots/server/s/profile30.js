/* WAKHAN M30: TopTop-style profile card (own + others) */
(()=>{"use strict";
if(typeof wm70Request!=="function")return;
const tg=window.Telegram&&Telegram.WebApp;
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const I=k=>typeof wi11==="function"?wi11(k):"";
const TX={fa:{owner:"صاحب سالون",host:"اختیار سالون",member:"عضو واخان",friends:"رفیقا",gifts:"هدیه‌ها",kinds:"نوع هدیه",received:"هدیه‌های دریافتی",none:"هنوز هدیه‌ای نگرفته",send:"هدیه",edit:"ویرایش پروفایل",frames:"هاله‌ها",copied:"کپی شد",add:"رفیق شو",sent:"درخواست رفت",friend:"رفیق",accept:"قبول",mention:"منشن",msg:"پیام",give:"دادن اختیار",take:"پس گرفتن اختیار",kick:"بیرون کردن از سالون",block:"بلاک",unblock:"آنبلاک",remove:"حذف رفیق"},
ps:{owner:"د تالار خاوند",host:"د تالار اختیار",member:"د واخان غړی",friends:"ملګري",gifts:"ډالۍ",kinds:"ډولونه",received:"ترلاسه شوې ډالۍ",none:"لا ډالۍ نه ده ترلاسه کړې",send:"ډالۍ",edit:"پروفایل سمول",frames:"هالې",copied:"کاپي شو",add:"ملګری شه",sent:"غوښتنه ولېږل شوه",friend:"ملګری",accept:"منل",mention:"منشن",msg:"پیغام",give:"اختیار ورکول",take:"اختیار اخیستل",kick:"له تالار ایستل",block:"بلاک",unblock:"آنبلاک",remove:"ملګری لرې کول"},
en:{owner:"Hall owner",host:"Co-host",member:"Wakhan member",friends:"Friends",gifts:"Gifts",kinds:"Kinds",received:"Gifts received",none:"No gifts yet",send:"Gift",edit:"Edit profile",frames:"Halos",copied:"Copied",add:"Add friend",sent:"Requested",friend:"Friends",accept:"Accept",mention:"Mention",msg:"Message",give:"Make co-host",take:"Remove co-host",kick:"Kick from hall",block:"Block",unblock:"Unblock",remove:"Remove friend"}};
const T=()=>{const l=document.documentElement.lang||"fa";return l.startsWith("ps")?TX.ps:(l==="fa"||l==="fa-IR")?TX.fa:TX.en};
const meId=()=>Number(ME?.me?.id||0);
const inRoom=()=>typeof TAB!=="undefined"&&TAB==="c"&&typeof CID!=="undefined"&&CID&&(typeof CS!=="undefined"&&CS);
const seated=id=>inRoom()&&(CS.seats||[]).some(v=>v&&Number(v.id)===Number(id));
const hosts=()=>((typeof CS!=="undefined"&&CS)&&CS.hosts)||[];
function roleChip(p){const id=Number(p.id);if(inRoom()&&Number(CS.owner)===id)return `<span class="wp-chip gold">${I("crown")}${esc(T().owner)}</span>`;if(inRoom()&&hosts().map(Number).includes(id))return `<span class="wp-chip star">${I("star")}${esc(T().host)}</span>`;
 const r=p.halo&&p.halo.role;return `<span class="wp-chip">${I("user")}${esc(r&&typeof wm70T==="function"?wm70T(r):T().member)}</span>`}
function relBtn(p){const id=Number(p.id),t=T();switch(p.relation){case"none":return `<button class="wp-ic" onclick="wm70Friend('request',${id})" aria-label="${esc(t.add)}">${I("invite")}</button>`;
 case"incoming":return `<button class="wp-ic on" onclick="wm70Friend('accept',${id})" aria-label="${esc(t.accept)}">${I("check")}</button>`;
 case"outgoing":return `<button class="wp-ic dim" onclick="wm70Friend('cancel',${id})" aria-label="${esc(t.sent)}">${I("clock")}</button>`;
 case"accepted":return `<button class="wp-ic on" aria-label="${esc(t.friend)}">${I("group")}</button>`;default:return ""}}
function card(p){const t=T(),own=Number(p.id)===meId(),gifts=p.gifts||[],total=gifts.reduce((a,v)=>a+Number(v.count||0),0);
 const av=typeof wm70Avatar==="function"?wm70Avatar(p):"";
 const bar=own?`<div class="wp-bar"><button class="wp-ic" onclick="wm70Edit('halos')" aria-label="${esc(t.frames)}">${I("frame")}</button><button class="wp-ic" onclick="wt30Photo()" aria-label="photo">${I("edit")}</button><button class="wp-main" onclick="wm70Edit()">${I("user")}<span>${esc(t.edit)}</span></button></div>`
 :`<div class="wp-bar"><button class="wp-ic" onclick="wp30More(${Number(p.id)})" aria-label="more">${I("more")}</button><button class="wp-ic" onclick="wp30Mention(${Number(p.id)})" aria-label="${esc(t.mention)}"><b class="wp-at">@</b></button><button class="wp-ic" onclick="wm70OpenDM(${Number(p.id)})" aria-label="${esc(t.msg)}">${I("chat")}</button>${relBtn(p)}${p.relation!=="blocked"?`<button class="wp-main" ${seated(p.id)?`onclick="wm70GiftPicker(${Number(p.id)})"`:"disabled"}>${I("gift")}<span>${esc(t.send)}</span></button>`:""}</div>`;
 return `<section class="wp30" dir="ltr"><button class="wp-x" onclick="WM70.modal=null;closeSheet()" aria-label="close">${I("close")}</button>
 <div class="wp-av">${av}</div>
 <h2 class="wp-name" dir="auto">${esc(p.name||"Wakhan")}</h2>
 <button class="wp-id" onclick="wp30Copy('${Number(p.id)}')">ID:${Number(p.id)} ${I("copy")}</button>
 <div class="wp-chips">${roleChip(p)}${p.relation==="accepted"?`<span class="wp-chip green">${I("group")}${esc(t.friend)}</span>`:""}</div>
 <div class="wp-stats"><div><b>${Number(p.friends||0)}</b><small>${esc(t.friends)}</small></div><i></i><div><b>${total}</b><small>${esc(t.gifts)}</small></div><i></i><div><b>${gifts.length}</b><small>${esc(t.kinds)}</small></div></div>
 <h4 class="wp-h">${esc(t.received)}</h4>
 ${gifts.length?`<div class="wp-gifts">${gifts.slice(0,8).map((v,k)=>`<div class="wp-gift g${k%4}">${typeof wm70GiftArt==="function"?wm70GiftArt(v.code):""}<b>×${Number(v.count)}</b></div>`).join("")}</div>`:`<p class="wp-none">${esc(t.none)}</p>`}
 ${bar}</section>`}
window.wp30Copy=id=>{try{navigator.clipboard.writeText(String(id))}catch(e){}try{toast(T().copied)}catch(e){}};
window.wp30Mention=id=>{const p=WM70.people.get(Number(id))||{};const i=document.getElementById("wm70-room-text");try{closeSheet()}catch(e){}WM70.modal=null;if(i){i.value=("@"+(p.name||id)+" "+i.value).trimStart();setTimeout(()=>i.focus(),250)}};
window.wp30More=id=>{const p=WM70.people.get(Number(id))||{},t=T();const owner=inRoom()&&Number(CS.owner)===meId()&&seated(id),isHost=hosts().map(Number).includes(Number(id));
 const rows=[];if(owner&&window.wm90act){rows.push(isHost?`<button onclick="closeSheet();wm90act('revoke',${id})">${I("star")}<span>${esc(t.take)}</span></button>`:`<button onclick="closeSheet();wm90act('grant',${id})">${I("star")}<span>${esc(t.give)}</span></button>`);
  rows.push(`<button class="danger" onclick="wp30Kick(${id})">${I("exit")}<span>${esc(t.kick)}</span></button>`)}
 if(p.relation==="accepted")rows.push(`<button onclick="wm70Friend('remove',${id})">${I("close")}<span>${esc(t.remove)}</span></button>`);
 rows.push(`<button class="danger" onclick="wm70Friend('${p.blocked_by_me?"unblock":"block"}',${id})">${I("lock")}<span>${esc(p.blocked_by_me?t.unblock:t.block)}</span></button>`);
 sheet(`<section class="wp30-menu" dir="ltr"><h3 dir="auto">${esc(p.name||"")}</h3>${rows.join("")}</section>`)};
window.wp30Kick=id=>{const go=()=>{try{closeSheet()}catch(e){}window.wm90act&&wm90act("kick",id)};try{tg.showConfirm(T().kick+"?",ok=>{if(ok)go()})}catch(e){if(confirm(T().kick+"?"))go()}};
/* override profile opening + drawing */
wm70ProfileDraw=function(p){sheet(card(p))};window.wm70ProfileDraw=wm70ProfileDraw;
const open=async function(uid){uid=Number(uid);const seq=++WM70.profileSeq;WM70.modal="profile";WM70.profileId=uid;WM70.gift=null;++WM70.giftSeq;
 const cached=WM70.people&&WM70.people.get(uid);sheet(card(cached||{id:uid,name:"…",friends:0,gifts:[]}));
 try{const r=await wm70Request("profile?uid="+uid);if(seq!==WM70.profileSeq||WM70.modal!=="profile")return;wm70Remember(r.profile);wm70ProfileDraw(r.profile)}catch(e){if(seq===WM70.profileSeq)try{toast(wm70Error(e))}catch(_){}}};
wm70OpenProfile=open;window.wm70OpenProfile=open;
const st=document.createElement("style");st.textContent=`
.wp30{position:relative;display:flex;flex-direction:column;align-items:center;padding:14px 2px 2px;overflow:visible;color:var(--txt)}
.wp30 .wp-x{position:absolute;top:0;right:0;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:var(--txt);display:flex;align-items:center;justify-content:center}.wp30 .wp-x svg{width:18px;height:18px}
.wp-av{margin-top:4px;width:112px;height:112px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 10px 22px rgba(0,0,0,.45))}
.wp-av>*{width:100%!important;height:100%!important;max-width:none!important}
.wp-name{margin:10px 0 2px;font-size:20px;font-weight:800;text-align:center;max-width:90%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wp-id{display:inline-flex;align-items:center;gap:5px;border:0;background:none;color:var(--mut);font:500 12.5px system-ui,-apple-system,sans-serif;padding:2px 6px}.wp-id svg{width:14px;height:14px}
.wp-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:10px 0 14px}
.wp-chip{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 10px;border-radius:12px;font:700 11.5px system-ui,-apple-system,sans-serif;color:#fff;background:linear-gradient(135deg,var(--a1,#8b5cf6),color-mix(in srgb,var(--a1,#8b5cf6) 55%,#000))}
.wp-chip svg{width:13px;height:13px}.wp-chip.gold{background:linear-gradient(135deg,#f5c451,#c98a0c);color:#2a1700}.wp-chip.star{background:linear-gradient(135deg,#60a5fa,#2563eb)}.wp-chip.green{background:linear-gradient(135deg,#34d399,#059669)}
.wp-stats{display:flex;align-items:center;justify-content:space-around;width:100%;padding:12px 6px;border-radius:18px;background:var(--card2,rgba(255,255,255,.07));border:1px solid var(--ln)}
.wp-stats>div{display:flex;flex-direction:column;align-items:center;flex:1}.wp-stats b{font-size:20px;font-weight:800}.wp-stats small{font-size:11px;color:var(--mut)}.wp-stats>i{width:1px;height:28px;background:var(--ln)}
.wp-h{align-self:stretch;margin:16px 4px 8px;font-size:13px;color:var(--mut);font-weight:700}
.wp-gifts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:100%}
.wp-gift{position:relative;aspect-ratio:3/3.6;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px;border:1px solid rgba(255,255,255,.12)}
.wp-gift>*:first-child{width:70%!important;height:auto!important;max-height:62%}
.wp-gift b{font-size:12px}
.wp-gift.g0{background:linear-gradient(170deg,rgba(236,72,153,.32),rgba(236,72,153,.08))}.wp-gift.g1{background:linear-gradient(170deg,rgba(251,146,60,.3),rgba(251,146,60,.08))}.wp-gift.g2{background:linear-gradient(170deg,rgba(52,211,153,.3),rgba(52,211,153,.08))}.wp-gift.g3{background:linear-gradient(170deg,rgba(96,165,250,.3),rgba(96,165,250,.08))}
.wp-none{margin:4px 0 6px;font-size:12px;color:var(--mut)}
.wp-bar{display:flex;align-items:center;gap:8px;width:100%;margin-top:18px}
.wp-ic{flex:none;width:46px;height:46px;border-radius:50%;border:0;background:var(--card2,rgba(255,255,255,.08));color:var(--txt);display:flex;align-items:center;justify-content:center}.wp-ic svg{width:22px;height:22px}.wp-ic.on{color:#34d399}.wp-ic.dim{opacity:.6}
.wp-at{font:800 20px system-ui}
.wp-main{flex:1;height:46px;border-radius:23px;border:0;display:flex;align-items:center;justify-content:center;gap:8px;color:#fff;font:800 15px system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,var(--a1,#ec4899),color-mix(in srgb,var(--a1,#ec4899) 60%,#000));box-shadow:0 8px 20px color-mix(in srgb,var(--a1,#ec4899) 35%,transparent)}.wp-main svg{width:20px;height:20px}.wp-main[disabled]{opacity:.45}
.wp30-menu h3{text-align:center;margin:0 0 10px}.wp30-menu button{display:flex;align-items:center;gap:10px;width:100%;padding:13px 12px;margin:0 0 6px;border-radius:14px;border:1px solid var(--ln);background:var(--card);color:var(--txt);font:600 14px system-ui,-apple-system,sans-serif}.wp30-menu button svg{width:20px;height:20px}.wp30-menu button.danger{color:#fb7185}
`;document.head.appendChild(st);

/* ---- Account page (حساب مه) in TopTop style ---- */
const TA={fa:{plays:"پخش‌ها",likes:"پسندها",friends:"رفیقا",edit:"ویرایش",editT:"ویرایش پروفایل",member:"اشتراک واخان",memberSub:"پلیر و سینمای شخصی، بدون محدودیت",see:"ببین",wallet:"بکس پیسه",sub:"اشتراک و خریدها",halos:"هاله‌ها و قاب‌ها",invite:"معرفی به رفیقا",theme:"رنگ برنامه",lang:"زبان",help:"راهنما",ops:"مدیریت واخان",team:"دستیارها و سکهٔ سازنده",fin:"مدیریت پرداخت‌ها",photo:"عکس پروفایل",name:"نام",halo:"هاله",id:"شناسه",coins:"سکه",gender:"جنسیت",male:"مرد",female:"زن",unset:"انتخاب نشده"},
ps:{plays:"غږونې",likes:"خوښې",friends:"ملګري",edit:"سمول",editT:"پروفایل سمول",member:"د واخان ګډون",memberSub:"شخصي پلیر او سینما",see:"وګورئ",wallet:"بټوه",sub:"ګډون او پېرودنې",halos:"هالې او چوکاټونه",invite:"ملګري راوبلئ",theme:"د اپ رنګ",lang:"ژبه",help:"لارښود",ops:"د واخان مدیریت",team:"مرستیالان",fin:"تادیې",photo:"د پروفایل انځور",name:"نوم",halo:"هاله",id:"ID",coins:"سکې",gender:"جنسیت",male:"نارینه",female:"ښځینه",unset:"نه دی ټاکل شوی"},
en:{plays:"Plays",likes:"Likes",friends:"Friends",edit:"Edit",editT:"Edit profile",member:"Wakhan membership",memberSub:"Personal player & cinema, unlimited",see:"View",wallet:"Wallet",sub:"Plans & purchases",halos:"Halos & frames",invite:"Invite friends",theme:"App colors",lang:"Language",help:"Help",ops:"Wakhan operations",team:"Assistants & creator coins",fin:"Payments",photo:"Profile photo",name:"Name",halo:"Halo",id:"ID",coins:"coins",gender:"Gender",male:"Male",female:"Female",unset:"Not set"}};
const TAx=()=>{const l=document.documentElement.lang||"fa";return l.startsWith("ps")?TA.ps:(l==="fa"||l==="fa-IR")?TA.fa:TA.en};
const tile=(k,c)=>`<span class="wt-tile ${c}">${I(k)}</span>`;
const row=(k,c,label,action,value)=>`<button class="wt-row" onclick="${action}">${c?tile(k,c):`<span class="wt-tile o">${I(k)}</span>`}<span class="wt-l">${esc(label)}</span>${value?`<span class="wt-v">${value}</span>`:""}<span class="wt-chev">${I("back")}</span></button>`;
const has=f=>typeof window[f]==="function";
function meHtml(){const p=WM70.self||{id:ME?.me?.id,name:ME?.me?.name,avatar:"/ava/"+ME?.me?.id},st=ME?.stats||{},t=TAx(),r=p.halo&&p.halo.role;
 let bal="";try{if(window.WC23&&WC23.data&&WC23.data.balance!=null)bal=esc(Number(WC23.data.balance).toFixed(2))+" "+esc(t.coins)}catch(e){}
 let lang="";try{const c=window.WM13?WM13.code():"fa";const l=(window.WM13_DATA?.langs||[]).find(x=>x.c===c);if(l)lang=`<img class="wt-flag" src="/s/flag-${l.f}.webp?v=13" alt="">${esc(l.n)}`}catch(e){}
 const staff=has("wnStaff")&&wnStaff();
 return `<main class="wn-page wt-me">
 <section class="wt-head"><button class="wt-av" onclick="wm70OpenProfile(${Number(p.id)})">${has("wm70Avatar")?wm70Avatar(p):""}</button>
  <div class="wt-info"><b dir="auto">${esc(p.name||"Wakhan")}</b><button class="wt-id" onclick="wp30Copy('${Number(p.id)}')">ID:${Number(p.id)} ${I("copy")}</button>${r?`<span class="wp-chip">${I("crown")}${esc(has("wm70T")?wm70T(r):r)}</span>`:""}</div>
  <button class="wt-edit" onclick="wt30Edit()">${I("edit")}<span>${esc(t.edit)}</span></button></section>
 <section class="wt-stats"><button onclick="go('l')"><b>${Number(st.plays)||0}</b><small>${esc(t.plays)}</small></button><button onclick="go('l',{kind:'favorites'})"><b>${(ME?.favs||[]).length}</b><small>${esc(t.likes)}</small></button><button onclick="wm70OpenFriends()"><b>${Number(p.friends||0)}</b><small>${esc(t.friends)}</small></button></section>
 <button class="wt-member" onclick="go('s')"><span class="wt-mi">${I("diamond")}</span><span class="wt-mt"><b>${esc(t.member)}</b><small>${esc(t.memberSub)}</small></span><span class="wt-cta">${esc(t.see)}</span></button>
 <div class="wt-list">${row("group","blue",t.friends,"wm70OpenFriends()")}${row("frame","pink",t.halos,"wm70Edit('halos')")}${row("wallet","orange",t.wallet,"wc23Open()",bal)}${row("diamond","gold",t.sub,"go('s')")}${row("send","green",t.invite,"wnShare()")}</div>
 <div class="wt-list">${row("palette","purple",t.theme,"themeSheet()")}${row("globe","teal",t.lang,"langSheet()",lang)}${row("help","",t.help,"helpSheet()")}</div>
 ${staff?`<div class="wt-list">${row("shield","green",t.ops,"op31Go()")}${p.roles&&p.roles.includes("creator")?row("crown","gold",t.team,"af24Open()"):""}</div>`:""}
 ${ME?.finance?.allowed?`<div class="wt-list">${row("receipt","blue",t.fin,"wfOpen()")}</div>`:""}
 <div class="wn-version">WAKHAN</div></main>`}
const GK="wk_gender";let GEN="";try{GEN=localStorage.getItem(GK)||""}catch(e){}try{Telegram.WebApp.CloudStorage.getItem(GK,(e,v)=>{if(!e&&v){GEN=v;try{localStorage.setItem(GK,v)}catch(_){}}})}catch(e){}
const gname=()=>{const t=TAx();return GEN==="m"?t.male:GEN==="f"?t.female:t.unset};
window.wt30Gender=function(){const t=TAx();sheet(`<section class="wt-editp"><div class="wt-et"><h3>${esc(t.gender)}</h3><button class="wp-x" onclick="wt30Edit()">${I("close")}</button></div><div class="wt-gen"><button class="${GEN==="m"?"on":""}" onclick="wt30SetG('m')"><b>♂</b><span>${esc(t.male)}</span></button><button class="${GEN==="f"?"on":""}" onclick="wt30SetG('f')"><b>♀</b><span>${esc(t.female)}</span></button></div></section>`)};
window.wt30SetG=function(g){GEN=g;try{localStorage.setItem(GK,g)}catch(e){}try{Telegram.WebApp.CloudStorage.setItem(GK,g,()=>{})}catch(e){}try{Telegram.WebApp.HapticFeedback.impactOccurred("light")}catch(e){}wt30Edit()};
window.wt30Edit=function(){const p=WM70.self||{id:ME?.me?.id,name:ME?.me?.name,avatar:"/ava/"+ME?.me?.id},t=TAx();const r=p.halo&&p.halo.role;
 sheet(`<section class="wt-editp"><div class="wt-et"><h3>${esc(t.editT)}</h3><button class="wp-x" onclick="closeSheet()">${I("close")}</button></div>
 <button class="wt-er" onclick="wt30Photo()"><span>${esc(t.photo)}</span><span class="wt-ev"><span class="wt-thumb">${has("wm70Avatar")?wm70Avatar({...p,halo:null}):""}</span>${I("back")}</span></button>
 <button class="wt-er" onclick="wt30Name()"><span>${esc(t.name)}</span><span class="wt-ev"><b dir="auto">${esc(p.name||"")}</b>${I("back")}</span></button>
 <button class="wt-er" onclick="wm70Edit('halos')"><span>${esc(t.halo)}</span><span class="wt-ev"><b>${esc(r&&has("wm70T")?wm70T(r):"—")}</b>${I("back")}</span></button>
 <button class="wt-er" onclick="wt30Gender()"><span>${esc(t.gender||"Gender")}</span><span class="wt-ev"><b>${esc(gname())}</b>${I("back")}</span></button>
 <button class="wt-er" onclick="wp30Copy('${Number(p.id)}')"><span>${esc(t.id)}</span><span class="wt-ev"><b>${Number(p.id)}</b>${I("copy")}</span></button></section>`)};
const draft=()=>{const p=WM70.self;WM70.modal="edit";WM70.editorTab="photo";WM70.edit={name:p.name,rev:p.rev,photo:null,reset:false};return WM70.edit};
window.wt30Photo=function(){const inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.style.cssText="position:fixed;left:-9999px;opacity:0";document.body.appendChild(inp);
 inp.onchange=async()=>{try{if(!inp.files||!inp.files[0])return;if(!WM70.self&&typeof wm70Load==="function")await wm70Load();if(!WM70.self)return;const ed=draft();await wm70ChoosePhoto(inp);if(WM70.edit===ed&&ed.photo)await wm70SaveProfile()}catch(e){}finally{inp.remove();if(document.querySelector(".wt-me"))try{rMe()}catch(_){}}};
 inp.click()};
window.wt30Name=async function(){if(!WM70.self&&typeof wm70Load==="function")await wm70Load();if(!WM70.self)return;const ed=draft();WM70.editorTab="profile";const t=TAx();
 sheet(`<section class="wt-editp"><div class="wt-et"><h3>${esc(t.name)}</h3><button class="wp-x" onclick="WM70.modal=null;closeSheet()">${I("close")}</button></div><input id="wm70-name" class="wt-in" value="${esc(ed.name||"")}" maxlength="48" autocomplete="off" dir="auto"><button class="wa-main wt-save" onclick="wm70SaveProfile().then(()=>{if(document.querySelector('.wt-me'))rMe()})">${I("check")}<span>${esc(has("wm70T")?wm70T("save"):"OK")}</span></button></section>`);
 setTimeout(()=>{const i=document.getElementById("wm70-name");if(i){i.focus();i.select()}},250)};
if(typeof rMe==="function"){const oldMe=rMe;rMe=function(){if(typeof SUB!=="undefined"&&SUB?.kind==="details")return oldMe.apply(this,arguments);if(typeof V!=="function")return oldMe.apply(this,arguments);V().innerHTML=meHtml();if(!WM70.self&&!WM70.loading&&!WM70.error&&typeof wm70Load==="function")wm70Load().then(()=>{if(document.querySelector(".wt-me"))V().innerHTML=meHtml()}).catch(()=>{})};window.rMe=rMe}
/* «حساب مه» -> «من» everywhere */
const RN={"حساب مه":"من","حساب من":"من"};
function rename(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const k=n.nodeValue.trim();if(RN[k]&&(document.documentElement.lang||"fa").startsWith("fa"))n.nodeValue=n.nodeValue.replace(k,RN[k])}}
try{for(const o of [window.WN60_COPY,typeof WN60_COPY!=="undefined"?WN60_COPY:null])if(o&&o.fa&&o.fa.profile)o.fa.profile="من"}catch(e){}
let rq=0;new MutationObserver(()=>{if(!rq)rq=requestAnimationFrame(()=>{rq=0;if(document.body)rename(document.body)})}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
const st2=document.createElement("style");st2.textContent=`
.wt-me{padding-top:8px!important}
.wt-head{display:flex;align-items:center;gap:14px;margin:6px 0 16px}
.wt-av{flex:none;width:84px;height:84px;padding:0;border:0;background:none}.wt-av>*{width:100%!important;height:100%!important;max-width:none!important}
.wt-info{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:3px}
.wt-info>b{font-size:19px;font-weight:800;color:var(--txt);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wt-id{display:inline-flex;align-items:center;gap:5px;border:0;background:none;padding:0;color:var(--mut);font:500 12.5px system-ui,-apple-system,sans-serif}.wt-id svg{width:14px;height:14px}
.wt-edit{flex:none;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 13px;border-radius:17px;border:1px solid var(--ln);background:transparent;color:var(--txt);font:600 13px system-ui,-apple-system,sans-serif}.wt-edit svg{width:16px;height:16px}
.wt-stats{display:flex;margin:0 0 14px;padding:10px 0;border-radius:18px;background:var(--card);border:1px solid var(--ln)}
.wt-stats button{flex:1;display:flex;flex-direction:column;align-items:center;border:0;background:none;color:var(--txt)}.wt-stats button+button{border-inline-start:1px solid var(--ln)}.wt-stats b{font-size:19px;font-weight:800}.wt-stats small{font-size:11px;color:var(--mut)}
.wt-member{display:flex;align-items:center;gap:12px;width:100%;padding:14px;margin:0 0 14px;border-radius:20px;border:1px solid rgba(245,196,81,.45);background:linear-gradient(120deg,rgba(120,90,20,.55),rgba(60,45,10,.55));color:#fff;text-align:start}
.wt-mi{flex:none;width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f5c451,#c98a0c);color:#2a1700}.wt-mi svg{width:26px;height:26px}
.wt-mt{flex:1;min-width:0;display:flex;flex-direction:column}.wt-mt b{font-size:16px;font-weight:800}.wt-mt small{font-size:11.5px;color:#f5d58a}
.wt-cta{flex:none;padding:8px 14px;border-radius:16px;background:#f5d26b;color:#2a1700;font:800 12.5px system-ui,-apple-system,sans-serif}
.wt-list{margin:0 0 12px;border-radius:20px;background:var(--card);border:1px solid var(--ln);overflow:hidden}
.wt-row{display:flex;align-items:center;gap:12px;width:100%;min-height:56px;padding:8px 14px;border:0;background:none;color:var(--txt);font:600 15px system-ui,-apple-system,sans-serif;text-align:start}
.wt-row+.wt-row{border-top:1px solid var(--ln)}
.wt-l{flex:1;min-width:0}.wt-v{display:inline-flex;align-items:center;gap:6px;color:var(--mut);font-size:12.5px;font-weight:500}.wt-flag{width:22px;height:16px;object-fit:contain}
.wt-chev{display:inline-flex;color:var(--mut)}.wt-chev svg{width:18px;height:18px}
html[dir=ltr] .wt-chev svg,body[dir=ltr] .wt-chev svg{transform:scaleX(-1)}
.wt-tile{flex:none;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff}.wt-tile svg{width:19px;height:19px;stroke-width:2.1}
.wt-tile.o{background:none;color:var(--txt);border:1.6px solid var(--mut)}
.wt-tile.blue{background:linear-gradient(135deg,#60a5fa,#2563eb)}.wt-tile.pink{background:linear-gradient(135deg,#f472b6,#db2777)}.wt-tile.orange{background:linear-gradient(135deg,#fdba74,#ea580c)}.wt-tile.gold{background:linear-gradient(135deg,#fde68a,#d97706)}.wt-tile.green{background:linear-gradient(135deg,#6ee7b7,#059669)}.wt-tile.purple{background:linear-gradient(135deg,#c4b5fd,#7c3aed)}.wt-tile.teal{background:linear-gradient(135deg,#5eead4,#0d9488)}
.wt-editp{padding:2px}.wt-et{position:relative;display:flex;align-items:center;justify-content:center;margin:0 0 10px}.wt-et h3{margin:0;font-size:17px}.wt-et .wp-x{position:absolute;left:0;top:-4px}
.wt-er{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:62px;padding:8px 4px;border:0;border-bottom:1px solid var(--ln);background:none;color:var(--txt);font:600 15px system-ui,-apple-system,sans-serif}
.wt-ev{display:inline-flex;align-items:center;gap:8px;color:var(--mut)}.wt-ev b{color:var(--txt);font-weight:800}.wt-ev svg{width:18px;height:18px}
.wt-in{width:100%;height:50px;margin:6px 0 14px;padding:0 14px;border-radius:14px;border:1px solid var(--ln);background:var(--card2,rgba(255,255,255,.07));color:var(--txt);font:600 16px system-ui,-apple-system,sans-serif}.wt-save{width:100%;flex:none}
.wa-main{height:46px;border-radius:14px;border:0;display:flex;align-items:center;justify-content:center;gap:8px;color:#fff;font:800 15px system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,var(--a1,#8b5cf6),color-mix(in srgb,var(--a1,#8b5cf6) 60%,#000))}.wa-main svg{width:18px;height:18px}
.wt-gen{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px}.wt-gen button{display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px 8px;border-radius:20px;border:1.5px solid var(--ln);background:var(--card);color:var(--txt);font:700 15px system-ui,-apple-system,sans-serif}.wt-gen button b{font-size:34px;line-height:1}.wt-gen button:first-child b{color:#60a5fa}.wt-gen button:last-child b{color:#f472b6}.wt-gen button.on{border-color:var(--a1,#8b5cf6);background:color-mix(in srgb,var(--a1,#8b5cf6) 16%,transparent)}
.wt-thumb{width:46px;height:46px;display:inline-flex}.wt-thumb>*{width:100%!important;height:100%!important}
`;document.head.appendChild(st2);
})();
