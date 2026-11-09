/* WAKHAN M56: cinema lobby in TopTop style.
   Top text tabs (Halls · Home · History), friend-code search, "my hall" card with photo/name/edit,
   and lists of saved / recently visited halls with photo, name, people inside and what is playing. */
(function(){
"use strict";
if(window.__wk56)return;window.__wk56=1;
const T={
 fa:{all:"همه سالون‌ها",locked:"ای سالون قفل است",friendsOnly:"فقط رفیقا",ph2:"نام سالون، صاحبش یا کد…",noneOpen:"فعلاً سالونی پیدا نشد",owner:"صاحب",halls:"سالون‌ها",home:"خانه",hist:"تاریخچه",ph:"کد سالون رفیقت…",mine:"سالون مه",edit:"ویرایش",invite:"دعوت",copy:"کپی کد",rotate:"کد تازه",perm:"همیشگی",code:"کد",saved:"ذخیره‌شده",recent:"تازه رفتی",empty:"هنوز سالونی اینجا نیست",emptySub:"کد سالون رفیقت ره بالا بزن؛ هر سالونی که بری خودش اینجا ذخیره میشه.",none:"دیگه چیزی نیست",create:"سالون خودت ره جور کو",createSub:"یک سالون همیشگی با کد ثابت، نام و عکس خودت",namePh:"نام سالونت",make:"جور کو",idle:"آماده برای پخش",bad:"کد درست نیست",removed:"از لیست پاک شد",enter:"ورود"},
 ps:{all:"ټول سالونونه",locked:"دا سالون تړل شوی",friendsOnly:"یوازې ملګري",ph2:"د سالون نوم، خاوند یا کوډ…",noneOpen:"اوس مهال سالون ونه موندل شو",owner:"خاوند",halls:"سالونونه",home:"کور",hist:"تاریخچه",ph:"د ملګري د سالون کوډ…",mine:"زما سالون",edit:"سمول",invite:"بلنه",copy:"کوډ کاپي",rotate:"نوی کوډ",perm:"تل",code:"کوډ",saved:"خوندي",recent:"وروستي",empty:"لا تر اوسه سالون نشته",emptySub:"د ملګري د سالون کوډ پورته ولیکه؛ هر سالون چې ورځې دلته خوندي کېږي.",none:"نور څه نشته",create:"خپل سالون جوړ کړه",createSub:"یو تلپاتې سالون د ثابت کوډ، نوم او انځور سره",namePh:"د سالون نوم",make:"جوړول",idle:"د غږولو لپاره چمتو",bad:"کوډ سم نه دی",removed:"له لیست لرې شو",enter:"ننوتل"},
 en:{all:"All halls",locked:"This hall is locked",friendsOnly:"Friends only",ph2:"Hall name, owner or code…",noneOpen:"No halls found yet",owner:"Owner",halls:"Halls",home:"Home",hist:"History",ph:"Friend's hall code…",mine:"My hall",edit:"Edit",invite:"Invite",copy:"Copy code",rotate:"New code",perm:"Permanent",code:"Code",saved:"Saved",recent:"Recent",empty:"No halls here yet",emptySub:"Type a friend's hall code above; every hall you visit is saved here.",none:"Nothing more",create:"Create your own hall",createSub:"A permanent hall with a fixed code, your name and photo",namePh:"Hall name",make:"Create",idle:"Ready to play",bad:"Invalid code",removed:"Removed",enter:"Enter"}};
const tx=()=>{const l=document.documentElement.lang||"fa";return l.startsWith("ps")?T.ps:l.startsWith("fa")?T.fa:T.en};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const vib=()=>{try{hap()}catch(e){}};
const say=m=>{try{toast(m)}catch(e){}};
const v=k=>{try{return {TAB:()=>TAB,CID:()=>CID,CV:()=>CV,WMP:()=>WMP,CG:()=>CG}[k]()}catch(e){return undefined}};
const tg=window.Telegram&&Telegram.WebApp;
const I={
 search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
 pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
 invite:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/></svg>',
 copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/></svg>',
 rot:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>',
 x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 7l10 10M17 7 7 17"/></svg>',
 plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'};

/* ---------- saved halls (same storage as before: wk_halls) + recent (wm_rooms) */
const KEY="wk_halls";
function saved(){try{const a=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(a)?a:[]}catch(e){return []}}
function setSaved(a){const s=JSON.stringify(a.slice(0,24));try{localStorage.setItem(KEY,s)}catch(e){}try{tg.CloudStorage.setItem(KEY,s,()=>{})}catch(e){}}
function recent(){try{const a=JSON.parse(localStorage.getItem("wm_rooms")||"[]");return Array.isArray(a)?a:[]}catch(e){return []}}
try{tg.CloudStorage.getItem(KEY,(e,val)=>{if(e||!val)return;try{const c=JSON.parse(val);if(!Array.isArray(c))return;const m=new Map(c.concat(saved()).map(x=>[x.code,x]));setSaved([...m.values()].sort((a,b)=>(b.ts||0)-(a.ts||0)));draw(true)}catch(_){}})}catch(e){}
const mineCode=()=>{const m=v("WMP");return m&&m.mine&&m.mine.code||""};
/* every hall I enter that is not mine is saved automatically */
setInterval(()=>{const c=v("CID");if(!c||c===mineCode())return;const a=saved();if(a[0]&&a[0].code===c)return;setSaved([{code:c,name:(a.find(x=>x.code===c)||{}).name||"",ts:Date.now()},...a.filter(x=>x.code!==c)])},3000);

/* ---------- hall info (name, photo, live) */
const INFO={};let infoAt=0;
async function loadInfo(codes,force){
 codes=[...new Set(codes.filter(Boolean))];if(!codes.length)return;
 if(!force&&Date.now()-infoAt<15000&&codes.every(c=>INFO[c]))return;infoAt=Date.now();
 try{const j=await api("/api/v51/hall?codes="+codes.slice(0,24).join(","));if(j&&j.ok){for(const c of codes)if(j.halls[c])INFO[c]=j.halls[c];draw(true)}}catch(e){}
}
const pic=(h,code,cls)=>h&&h.photo?`<img class="${cls}" src="${esc(h.photo)}" alt="">`:`<span class="${cls} wk56-ini">${esc(((h&&h.name)||code||"W").trim().charAt(0).toUpperCase())}</span>`;
const bars='<i class="wk56-eq"><b></b><b></b><b></b></i>';

/* ---------- render */
let LIST=(()=>{try{return localStorage.getItem("wk56_list2")||"all"}catch(e){return "all"}})();let ALL=null,ALLQ="",allAt=0
function topTabs(){const t=tx(),cv=v("CV");return `<div class="wk56-top">${[["hall",t.halls],["home",t.home],["hist",t.hist]].map(([k,l])=>`<button type="button" class="${cv===k?"on":""}" onclick="wk56Page('${k}')">${esc(l)}</button>`).join("")}</div>`}
function searchBar(){const t=tx();return `<form class="wk56-find" onsubmit="event.preventDefault();wk56Join()"><input id="wk56-code" maxlength="40" autocomplete="off" spellcheck="false" placeholder="${esc(t.ph2)}" dir="auto" oninput="wk56Find(this.value)"><button type="submit" aria-label="${esc(t.enter)}">${I.search}</button></form>`}
function mineCard(){
 const t=tx(),m=v("WMP");
 if(!m||!m.mine){
  if(m&&!m.loaded)return `<div class="wk56-mine wk56-skel"></div>`;
  return `<div class="wk56-mine wk56-new"><span class="wk56-mpic wk56-plus">${I.plus}</span><div class="wk56-mt"><b>${esc(t.create)}</b><small>${esc(t.createSub)}</small><div class="wk56-mk"><input id="wk56-name" maxlength="40" dir="auto" placeholder="${esc(t.namePh)}"><button type="button" onclick="wk56Create()">${esc(t.make)}</button></div></div></div>`}
 const c=m.mine.code,h=INFO[c]||{name:m.mine.name},live=h.live||0;
 return `<div class="wk56-mine" onclick="wk56Enter('${esc(c)}')"><span class="wk56-mwrap">${pic(h,c,"wk56-mpic")}<button type="button" class="wk56-cam" onclick="event.stopPropagation();wk56Edit('${esc(c)}')" aria-label="${esc(t.edit)}">${I.pen}</button></span>
 <div class="wk56-mt"><small class="wk56-lab">${esc(t.mine)} · ${esc(t.perm)}</small><b dir="auto">${esc(h.name||m.mine.name||"")}</b><small dir="auto">${h.now?esc(h.now):esc(t.code)+" <bdi>"+esc(c)+"</bdi>"}</small></div>
 <span class="wk56-live">${bars}${live}</span></div>
 <div class="wk56-acts"><button type="button" onclick="wk56Edit('${esc(c)}')">${I.pen}<span>${esc(t.edit)}</span></button><button type="button" onclick="try{wmpShareMine()}catch(e){}">${I.invite}<span>${esc(t.invite)}</span></button><button type="button" onclick="wk56Copy('${esc(c)}')">${I.copy}<span>${esc(t.copy)}</span></button><button type="button" onclick="try{wmrConfirmRotate()}catch(e){}">${I.rot}<span>${esc(t.rotate)}</span></button></div>`;
}
/* every hall on the server — anyone can walk in, unless the owner locked it */
const LOCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
function allRows(){const t=tx();if(ALL===null)return `<div class="wk56-mine wk56-skel"></div>`;if(!ALL.length)return `<div class="wk56-empty"><b>${esc(t.noneOpen)}</b></div>`;
 return ALL.map(h=>{INFO[h.code]=Object.assign(INFO[h.code]||{},h);const shut=!h.can_enter;return `<div class="wk56-row${shut?' wk56-shut':''}" onclick="wk56Open('${esc(h.code)}')">${pic(h,h.code,"wk56-rpic")}<div class="wk56-rt"><b dir="auto">${esc(h.name||h.code)}</b><small dir="auto">${h.now?esc(h.now):(esc(t.owner)+': '+esc(h.owner_name||''))}</small></div>${shut?`<span class="wk56-lock" title="${esc(h.locked?t.locked:t.friendsOnly)}">${LOCK}</span>`:''}<span class="wk56-live">${bars}${h.live||0}</span></div>`}).join('')}
function rows(){
 if(LIST==="all")return allRows();
 const t=tx(),mc=mineCode();
 const list=LIST==="recent"?recent().map(c=>({code:c})):saved();
 const items=list.filter(x=>x&&x.code&&x.code!==mc);
 if(!items.length)return `<div class="wk56-empty"><b>${esc(t.empty)}</b><small>${esc(t.emptySub)}</small></div>`;
 return items.map(x=>{const h=INFO[x.code]||{name:x.name};return `<div class="wk56-row" onclick="wk56Enter('${esc(x.code)}')">${pic(h,x.code,"wk56-rpic")}<div class="wk56-rt"><b dir="auto">${esc(h.name||x.name||x.code)}</b><small dir="auto">${h.now?esc(h.now):esc(t.code)+" <bdi>"+esc(x.code)+"</bdi>"}</small></div><span class="wk56-live">${bars}${h.live||0}</span>${LIST==="saved"?`<button type="button" class="wk56-del" onclick="event.stopPropagation();wk56Del('${esc(x.code)}')" aria-label="×">${I.x}</button>`:""}</div>`}).join("")+`<p class="wk56-none">${esc(t.none)}</p>`;
}
function lobbyHtml(){const t=tx();return `${searchBar()}<div id="wk56-mine-slot">${mineCard()}</div><div class="wk56-chips">${[["all",t.all],["saved",t.saved],["recent",t.recent]].map(([k,l])=>`<button type="button" class="${LIST===k?"on":""}" onclick="wk56List('${k}')">${esc(l)}</button>`).join("")}</div><div id="wk56-rows">${rows()}</div>`}

function page(){const m=document.querySelector("#view>main.wm75-page,#view>.wmc:not(#wm78-room)");if(!m)return null;if(v("TAB")!=="c"||v("CID"))return null;return m}
function draw(soft){
 const m=page();if(!m)return;
 let top=m.querySelector(":scope>.wk56-top");if(!top){m.insertAdjacentHTML("afterbegin",topTabs());}else{const cv=v("CV");top.querySelectorAll("button").forEach((b,i)=>b.classList.toggle("on",["hall","home","hist"][i]===cv))}
 if(!m.classList.contains("wk56-page"))m.classList.add("wk56-page");
 const cg=v("CG");const isLobby=v("CV")==="hall"&&(!cg||!!cg.token);
 if(m.classList.contains("wk56-on")!==isLobby)m.classList.toggle("wk56-on",isLobby);
 if(!isLobby){m.querySelector(":scope>.wk56")?.remove();return}
 let box=m.querySelector(":scope>.wk56");
 if(!box){box=document.createElement("div");box.className="wk56";m.appendChild(box);box.innerHTML=lobbyHtml();const mm=v("WMP");if(mm&&!mm.loaded&&!mm.loading)try{wmpFetchMine()}catch(e){}load();return}
 if(soft){const ms=box.querySelector("#wk56-mine-slot"),rs=box.querySelector("#wk56-rows");const a=mineCard(),b=rows();if(ms&&ms.dataset.h!==a&&!(document.activeElement&&document.activeElement.id==="wk56-name")){ms.innerHTML=a;ms.dataset.h=a}if(rs&&rs.dataset.h!==b){rs.innerHTML=b;rs.dataset.h=b}}
}
let visitsAt=0;
async function visits(){if(Date.now()-visitsAt<20000)return;visitsAt=Date.now();try{const j=await api("/api/v51/hall?mine=visits");if(!j||!j.ok||!Array.isArray(j.halls))return;const have=saved(),map=new Map(have.map(x=>[x.code,x]));let ch=false;
 for(const h of j.halls){INFO[h.code]=h;if(!map.has(h.code)){map.set(h.code,{code:h.code,name:h.name||"",ts:1});ch=true}}if(ch)setSaved([...map.values()].sort((a,b)=>(b.ts||0)-(a.ts||0)));draw(true)}catch(e){}}
async function loadAll(force){if(!force&&Date.now()-allAt<12000)return;allAt=Date.now();const q=ALLQ;try{const j=await api('/api/v51/hall?all=1&q='+encodeURIComponent(q));if(j&&j.ok&&Array.isArray(j.halls)&&q===ALLQ){ALL=j.halls;draw(true)}}catch(e){}}
function load(force){const codes=[mineCode(),...saved().map(x=>x.code),...recent()];loadInfo(codes,force);visits();loadAll(force)}
window.wk56Refresh=()=>{load(true);draw(true)};
setInterval(()=>{draw(true)},400);
setInterval(()=>{if(page())load(false)},15000);
let lastMine="";setInterval(()=>{const c=mineCode();if(c&&c!==lastMine){lastMine=c;load(true)}},1000);

/* ---------- actions */
window.wk56Page=k=>{vib();try{wmcPage(k)}catch(e){}};
window.wk56List=k=>{vib();LIST=k;try{localStorage.setItem("wk56_list2",k)}catch(e){}const m=page();if(!m)return;m.querySelectorAll(".wk56-chips button").forEach(b=>b.classList.toggle("on",b.getAttribute("onclick").includes("'"+k+"'")));const rs=m.querySelector("#wk56-rows");if(rs){rs.innerHTML=rows();rs.dataset.h=rs.innerHTML}load(false)};
window.wk56Enter=c=>{vib();if(!c)return;try{enterRoom(c)}catch(e){}};
window.wk56Open=c=>{const h=(ALL||[]).find(x=>x.code===c);if(h&&!h.can_enter){vib();return say(h.locked?tx().locked:tx().friendsOnly)}wk56Enter(c)};
let findT=0;window.wk56Find=q=>{clearTimeout(findT);findT=setTimeout(()=>{ALLQ=String(q||'').trim();if(LIST!=='all')wk56List('all');loadAll(true)},350)};
window.wk56Join=()=>{const i=document.getElementById("wk56-code");const raw=String(i&&i.value||"").trim();const c=raw.toUpperCase();i.blur();
 /* a code goes straight in; anything else is a search */
 if(/^[A-Z0-9]{4,8}$/.test(c)&&!(ALL||[]).some(h=>(h.name||"").toLowerCase()===raw.toLowerCase()))return wk56Open(c);ALLQ=raw;if(LIST!=="all")wk56List("all");loadAll(true)};
window.wk56Edit=c=>{try{wk52HallEdit(c)}catch(e){}};
window.wk56Copy=c=>{vib();try{wmpCopy()}catch(e){try{navigator.clipboard.writeText(c)}catch(_){}}};
window.wk56Del=c=>{vib();setSaved(saved().filter(x=>x.code!==c));say(tx().removed);draw(true)};
window.wk56Create=async()=>{const i=document.getElementById("wk56-name");const name=String(i&&i.value||"").trim();vib();
 try{const j=await api("/api/room/new",{a:"create",name});if(!j||!j.ok)return say("…");const m=v("WMP");if(m){m.mine=j.cinema;m.loaded=true}load(true);draw(true)}catch(e){}};


/* no cinema password: keep a permanent session marker so the gate never appears (the server no longer asks) */
(function noGate(){try{if(typeof CG==="undefined")return setTimeout(noGate,300);const TOK="0".repeat(64);
 Object.defineProperty(CG,"token",{configurable:true,get(){return TOK},set(){}});
 Object.defineProperty(CG,"expires",{configurable:true,get(){return Math.floor(Date.now()/1000)+86400*3650},set(){}});
 try{CG.configured=true}catch(e){}}catch(e){}})();
/* cinema home: search goes to the very top, right under the tabs */
setInterval(()=>{const m=document.querySelector("#view>.wmc.wk56-page:not(#wm78-room)");if(!m)return;const f=m.querySelector(":scope>form.wmc-home-search,:scope>form.wmc-search");const top=m.querySelector(":scope>.wk56-top");if(f&&top&&top.nextElementSibling!==f)top.after(f)},300);

/* history: the same video watched many times is shown once */
(function dedupe(){if(typeof rYHist==="undefined")return setTimeout(dedupe,400);const o=rYHist;rYHist=function(){try{if(typeof ME!=="undefined"&&ME&&Array.isArray(ME.yhist)){const seen=new Set();ME.yhist=ME.yhist.filter(x=>{const k=x&&(x.vid||x.id||x.url||x.title);if(!k||seen.has(k))return false;seen.add(k);return true})}}catch(e){}return o.apply(this,arguments)}})();


/* SPEED: (1) theme colours read from <body> are cached, so the app does not recompute every style on each page change;
   (2) the scroll-to-top during a tab change waits for the next frame instead of forcing an extra layout mid-render */
(function(){if(window.__wkGcs)return;try{
 const real=window.getComputedStyle.bind(window);let C={k:"",v:{}};
 const key=()=>{const d=document.documentElement,b=document.body;return (d.className||"")+"|"+(d.getAttribute("style")||"")+"|"+(d.dataset.theme||"")+"|"+(b?(b.dataset.wnTheme||"")+"|"+[...b.classList].filter(c=>/theme|dawn|midnight|orbit|light|dark/.test(c)).join(","):"")};
 window.getComputedStyle=function(el,pseudo){
  if(el&&el===document.body&&!pseudo){const cs=real(el);const k=key();if(C.k!==k)C={k,v:{}};const c=C;
   return new Proxy(cs,{get(t,p){if(p==="getPropertyValue")return n=>{n=String(n);if(n.startsWith("--")){if(!(n in c.v))c.v[n]=t.getPropertyValue(n);return c.v[n]}return t.getPropertyValue(n)};const v=t[p];return typeof v==="function"?v.bind(t):v}})}
  return real(el,pseudo)};
 window.addEventListener("wk-theme",()=>{C={k:"",v:{}}});
}catch(e){}})();
(function fastGo(){if(typeof go==="undefined")return setTimeout(fastGo,300);const og=go;const rs=window.scrollTo.bind(window);
 go=function(){let want=false;window.scrollTo=function(){want=true};let r;try{r=og.apply(this,arguments)}finally{window.scrollTo=rs}
  if(want)requestAnimationFrame(()=>{try{rs(0,0)}catch(e){}});return r}})();

/* SPEED (3): the bottom bar reacts on finger-down (not after the finger lifts), so a tab change starts ~100 ms earlier */
(function(){let fast={k:"",t:0};
 document.addEventListener("pointerdown",e=>{try{if(e.button>0)return;const b=e.target.closest&&e.target.closest("#nav>button");if(!b)return;const m=(b.getAttribute("onclick")||"").match(/go\('(\w+)'\)/);if(!m||typeof TAB==="undefined"||m[1]===TAB)return;
  fast={k:m[1],t:Date.now()};b.classList.add("on");requestAnimationFrame(()=>{try{go(m[1])}catch(_){}})}catch(_){}},{capture:true,passive:true});
 document.addEventListener("click",e=>{try{const b=e.target.closest&&e.target.closest("#nav>button");if(!b)return;const m=(b.getAttribute("onclick")||"").match(/go\('(\w+)'\)/);if(m&&m[1]===fast.k&&Date.now()-fast.t<1200){e.stopPropagation();e.preventDefault()}}catch(_){}},true);
})();
/* run all page touch-ups in the same frame as the page change (no flash of the old layout) */
const SYNC=[()=>{try{const home=TAB==="h";if(document.body.classList.contains("wk47-home")!==home)document.body.classList.toggle("wk47-home",home)}catch(e){}},()=>draw(true)];
function syncAll(){for(const f of SYNC)try{f()}catch(e){}}
(function wrapGo(){if(typeof go==="undefined")return setTimeout(wrapGo,300);const og=go;go=function(){const r=og.apply(this,arguments);syncAll();return r}})();
new MutationObserver(syncAll).observe(document.getElementById("view")||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
const st=document.createElement("style");st.textContent=`
#view .wk56-page .wm75-heading,#view .wk56-page .wm75-tabs,#view .wk56-page .mx-ctabs,#view .wk56-page .wm82-cinema-tabs,#view .wk56-page .nh-tabs{display:none!important}
#view .wk56-page.wk56-on>*:not(.wk56):not(.wk56-top){display:none!important}
#view .wk56-page{padding-top:6px!important}
.wk56-top{display:flex;align-items:baseline;gap:18px;padding:4px 4px 12px;direction:inherit}
.wk56-top button{border:0;background:none;padding:0;color:var(--mut,#8aa);font:800 19px system-ui,-apple-system,sans-serif;transition:color .2s,font-size .2s}
.wk56-top button.on{color:var(--txt,#fff);font-size:27px}
.wk56-find{display:flex;align-items:center;gap:8px;height:48px;padding:0 5px 0 16px;margin:0 0 14px;border-radius:24px;background:var(--card2,rgba(255,255,255,.07));border:1px solid var(--ln,rgba(255,255,255,.1))}
html[dir=rtl] .wk56-find,body[dir=rtl] .wk56-find{padding:0 16px 0 5px}
.wk56-find input{flex:1;min-width:0;height:100%;border:0!important;background:transparent!important;color:var(--txt);font:600 15px system-ui,-apple-system,sans-serif;letter-spacing:.5px;outline:0;box-shadow:none!important;padding:0!important;text-transform:uppercase}
.wk56-find input::placeholder{text-transform:none;letter-spacing:0;color:var(--mut)}
.wk56-find button{flex:0 0 38px;width:38px;height:38px;border-radius:50%;border:0;display:grid;place-items:center;background:var(--a1,#10b981);color:#fff}.wk56-find svg{width:19px;height:19px}
.wk56-mine{position:relative;display:flex;align-items:center;gap:13px;padding:12px;border-radius:20px;background:linear-gradient(135deg,color-mix(in srgb,var(--a1,#10b981) 20%,var(--card,#16302a)),var(--card,#16302a));border:1px solid color-mix(in srgb,var(--a1,#10b981) 28%,transparent);cursor:pointer}
.wk56-mine.wk56-skel{height:96px;opacity:.5}
.wk56-mwrap{position:relative;flex:0 0 76px;width:76px;height:76px}
.wk56-mpic{display:block;width:76px;height:76px;border-radius:16px;object-fit:cover}
.wk56-ini{display:flex!important;align-items:center;justify-content:center;line-height:1;overflow:hidden;background:linear-gradient(135deg,var(--a1,#10b981),color-mix(in srgb,var(--a1,#10b981) 45%,#000));color:#fff;font:800 28px system-ui,-apple-system,sans-serif}
.wk56-cam{position:absolute;right:-5px;bottom:-5px;width:28px;height:28px;border-radius:50%;border:0;display:grid;place-items:center;background:var(--txt,#fff);color:var(--bg,#0f2a22);box-shadow:0 0 0 3px var(--card,#16302a)}.wk56-cam svg{width:14px;height:14px}
.wk56-mt,.wk56-rt{flex:1;min-width:0}
.wk56-mt b,.wk56-rt b{display:block;font-size:16.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--txt)}
.wk56-mt small,.wk56-rt small{display:block;margin-top:3px;font-size:12.5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wk56-mt .wk56-lab{margin:0 0 3px;font-size:11px;font-weight:700;color:var(--a1,#10b981)}
.wk56-live{display:inline-flex;align-items:center;gap:5px;align-self:flex-end;font:700 13px system-ui,-apple-system,sans-serif;color:var(--mut)}
.wk56-eq{display:inline-flex;align-items:flex-end;gap:2px;height:13px}.wk56-eq b{width:3px;border-radius:2px;background:var(--a1,#10b981);animation:wk56e 1s ease-in-out infinite}.wk56-eq b:nth-child(1){height:60%}.wk56-eq b:nth-child(2){height:100%;animation-delay:.2s}.wk56-eq b:nth-child(3){height:75%;animation-delay:.4s}
@keyframes wk56e{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(1)}}.wk56-eq b{transform-origin:bottom}
.wk56-acts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0 18px}
.wk56-acts button{display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 2px;border-radius:14px;border:1px solid var(--ln,rgba(255,255,255,.1));background:var(--card2,rgba(255,255,255,.05));color:var(--txt);font:700 11.5px system-ui,-apple-system,sans-serif}
.wk56-acts svg{width:20px;height:20px}
.wk56-new{cursor:default;margin-bottom:18px}.wk56-plus{display:grid;place-items:center;flex:0 0 76px;background:color-mix(in srgb,var(--a1,#10b981) 25%,transparent);color:var(--a1,#10b981)}.wk56-plus svg{width:30px;height:30px}
.wk56-new .wk56-mt small{white-space:normal}
.wk56-mk{display:flex;gap:8px;margin-top:10px}.wk56-mk input{flex:1;min-width:0;height:40px;border-radius:12px;border:1px solid var(--ln,rgba(255,255,255,.14));background:rgba(255,255,255,.06);color:var(--txt);padding:0 12px;font:600 14px system-ui,-apple-system,sans-serif;outline:0}
.wk56-mk button{height:40px;padding:0 16px;border-radius:12px;border:0;background:var(--a1,#10b981);color:#fff;font:800 13px system-ui,-apple-system,sans-serif}
.wk56-chips{display:flex;gap:8px;margin:0 0 12px}
.wk56-chips button{height:36px;padding:0 18px;border-radius:18px;border:0;background:var(--card2,rgba(255,255,255,.08));color:var(--mut);font:700 14px system-ui,-apple-system,sans-serif}
.wk56-chips button.on{background:var(--a1,#10b981);color:#fff}
.wk56-row{position:relative;display:flex;align-items:center;gap:12px;padding:10px;margin:0 0 10px;border-radius:18px;background:var(--card,rgba(255,255,255,.05));border:1px solid var(--ln,rgba(255,255,255,.07));cursor:pointer}
.wk56-rpic{display:block;flex:0 0 64px;width:64px;height:64px;border-radius:14px;object-fit:cover}.wk56-rpic.wk56-ini{font-size:24px}
.wk56-del{position:absolute;top:6px;inset-inline-end:6px;width:24px;height:24px;border-radius:50%;border:0;display:grid;place-items:center;background:rgba(0,0,0,.25);color:var(--mut)}.wk56-del svg{width:12px;height:12px}
.wk56-row .wk56-live{margin-inline-end:4px}
.wk56-empty{text-align:center;padding:26px 16px;border-radius:18px;border:1px dashed var(--ln,rgba(255,255,255,.14))}.wk56-empty b{display:block;font-size:15px}.wk56-empty small{display:block;margin-top:6px;font-size:12.5px;color:var(--mut);line-height:1.7}
.wk56-none{text-align:center;color:var(--mut);font-size:12.5px;margin:12px 0 4px}

body #view .wk56-top button{border:0!important;background:none!important;padding:0!important;margin:0!important;min-height:0!important;height:auto!important;box-shadow:none!important;color:var(--mut,#8aa)!important;font:800 18px system-ui,-apple-system,sans-serif!important;width:auto!important}
body #view .wk56-top button.on{color:var(--txt,#fff)!important;font-size:27px!important}
body #view .wk56-find button{flex:0 0 38px!important;width:38px!important;height:38px!important;min-height:0!important;padding:0!important;border-radius:50%!important;border:0!important;background:var(--a1,#10b981)!important;color:#fff!important;display:grid!important;place-items:center!important}
body #view .wk56-find button svg{width:19px!important;height:19px!important}
body #view .wk56-cam{position:absolute!important;right:-5px;bottom:-5px;width:28px!important;height:28px!important;min-height:0!important;padding:0!important;border-radius:50%!important;border:0!important;display:grid!important;place-items:center!important;background:var(--txt,#fff)!important;color:var(--bg,#0f2a22)!important;box-shadow:0 0 0 3px var(--card,#16302a)!important}
body #view .wk56-cam svg{width:14px!important;height:14px!important}
body #view .wk56-acts button{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:5px!important;min-height:62px!important;height:auto!important;padding:10px 2px!important;border-radius:14px!important;border:1px solid var(--ln,rgba(255,255,255,.1))!important;background:var(--card2,rgba(255,255,255,.05))!important;color:var(--txt)!important;font:700 11.5px system-ui,-apple-system,sans-serif!important;box-shadow:none!important}
body #view .wk56-acts button svg{width:20px!important;height:20px!important}
body #view .wk56-chips button{height:36px!important;min-height:0!important;padding:0 18px!important;border-radius:18px!important;border:0!important;background:var(--card2,rgba(255,255,255,.08))!important;color:var(--mut)!important;font:700 14px system-ui,-apple-system,sans-serif!important;box-shadow:none!important;width:auto!important}
body #view .wk56-chips button.on{background:var(--a1,#10b981)!important;color:#fff!important}
body #view .wk56-del{position:absolute!important;top:6px;inset-inline-end:6px;width:24px!important;height:24px!important;min-height:0!important;padding:0!important;border-radius:50%!important;border:0!important;display:grid!important;place-items:center!important;background:rgba(0,0,0,.25)!important;color:var(--mut)!important}
body #view .wk56-mk button{height:40px!important;min-height:0!important;padding:0 16px!important;border-radius:12px!important;border:0!important;background:var(--a1,#10b981)!important;color:#fff!important;font:800 13px system-ui,-apple-system,sans-serif!important;width:auto!important}
#view .wk56-page>form.wmc-home-search{margin-top:0!important;margin-bottom:12px!important}

/* the app's bottom bar (Home · Music · Cinema · Chats · Me) stays visible on cinema pages; only the hall itself is full screen */
body.cinema:not(.wm78-room-open):not(.wmc-theater):not(.wm76-keyboard):not(.wk-typing):not(.dt-open)>#nav{display:grid!important}
body.cinema:not(.wm78-room-open) #view{padding-bottom:calc(96px + env(safe-area-inset-bottom,0px))!important}
#view .nh-grid>*,#view .wk56-row,#view .sc-row{content-visibility:auto;contain-intrinsic-size:auto 120px}
#nav>button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
`;document.head.appendChild(st);
})();

(function(){const st=document.createElement("style");st.textContent=`.wk56-row.wk56-shut{opacity:.7}.wk56-lock{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:rgba(251,113,133,.14);color:#fb7185;flex:none;margin-inline-end:6px}.wk56-lock svg{width:15px;height:15px}`;document.head.appendChild(st)})();
