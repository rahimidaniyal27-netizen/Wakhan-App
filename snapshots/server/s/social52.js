/* WAKHAN M52: (1) every hall owner can name the hall and give it a photo; (2) friend requests are impossible to miss:
   badge on the Chats tab, a request strip at the top of Chats, a pop-up the moment one arrives, and ?p=friends deep link. */
(function(){
"use strict";
if(window.__wk52)return;window.__wk52=1;
const T={
 fa:{reqs:"درخواست‌های دوستی",newReq:"درخواست دوستی فرستاد",accept:"قبول",see:"دیدن",seeAll:"دیدن همه",people:"نفر منتظر جواب تو هستن",hall:"سالون",edit:"ویرایش سالون",name:"نام سالون",namePh:"مثلاً سالون رفیقا",photo:"عکس سالون",change:"تغییر عکس",remove:"حذف عکس",save:"ذخیره",saved:"سالون ذخیره شد",only:"فقط صاحب سالون می‌تانه نام و عکس ره عوض کنه",code:"کد",err:"ذخیره نشد؛ دوباره کوشش کو",accepted:"حالی دوست هستین",srv:"بخش سرور سالون هنوز نصب نشده؛ نصب M81 ره کامل کو"},
 ps:{reqs:"د ملګرتیا غوښتنې",newReq:"تاته د ملګرتیا غوښتنه ولېږله",accept:"منل",see:"کتل",seeAll:"ټول وګوره",people:"کسان ستا ځواب ته منتظر دي",hall:"سالون",edit:"سالون سمول",name:"د سالون نوم",namePh:"لکه د ملګرو سالون",photo:"د سالون انځور",change:"انځور بدلول",remove:"انځور لرې کول",save:"ساتل",saved:"سالون وساتل شو",only:"یوازې د سالون څښتن نوم او انځور بدلولی شي",code:"کوډ",err:"ونه ساتل شو؛ بیا هڅه وکړه",accepted:"اوس ملګري یاست",srv:"د سرور برخه نه ده نصب شوې"},
 en:{reqs:"Friend requests",newReq:"sent you a friend request",accept:"Accept",see:"View",seeAll:"See all",people:"people are waiting for your answer",hall:"Hall",edit:"Edit hall",name:"Hall name",namePh:"e.g. Friends' hall",photo:"Hall photo",change:"Change photo",remove:"Remove photo",save:"Save",saved:"Hall saved",only:"Only the hall owner can change its name and photo",code:"Code",err:"Not saved, try again",accepted:"You are friends now",srv:"Server part is not installed yet"}};
const tx=()=>{const l=document.documentElement.lang||"fa";return l.startsWith("ps")?T.ps:l.startsWith("fa")?T.fa:T.en};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const vib=()=>{try{hap()}catch(e){}};
const say=m=>{try{toast(m)}catch(e){}};
const g=k=>{try{return {TAB:()=>TAB,CID:()=>CID,WM70:()=>WM70,WMP:()=>WMP}[k]()}catch(e){return undefined}};
const avatar=p=>{try{return wm70Avatar(p)}catch(e){return `<span class="wk52-ini">${esc((p&&p.name||"?").charAt(0))}</span>`}};
const I={
 pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
 cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5Z"/><circle cx="12" cy="12.5" r="3.5"/></svg>',
 user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M19 8v6M16 11h6"/></svg>',
 chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6-6 6 6 6"/></svg>'};

/* ================= friend requests ================= */
let SEEN=new Set();try{SEEN=new Set(JSON.parse(localStorage.getItem("wk52_seen")||"[]"))}catch(e){}
let first=true;
function saveSeen(){try{localStorage.setItem("wk52_seen",JSON.stringify([...SEEN].slice(-300)))}catch(e){}}
function incoming(){const w=g("WM70");return (w&&w.friends&&w.friends.incoming)||[]}
async function poll(){
 try{if(document.visibilityState==="hidden"||typeof wm70Request==="undefined")return;
  const v=await wm70Request("friends");const w=g("WM70");if(!w)return;w.friends=v;
  for(const k of ["friends","incoming","outgoing"])for(const p of v[k]||[])try{wm70Remember(p)}catch(e){}
  const inc=v.incoming||[];
  const fresh=inc.filter(p=>!SEEN.has(String(p.id)));
  for(const p of inc)SEEN.add(String(p.id));saveSeen();
  if(fresh.length&&!(g("TAB")==="d"&&w.tab==="requests"))popup(fresh[0],fresh.length);
  first=false;paintBadge();
  if(g("TAB")==="d")try{wm70ChatDraw()}catch(e){}
 }catch(e){}
}
function paintBadge(){
 const n=incoming().length;
 document.querySelectorAll('#nav button[onclick*="\'d\'"]').forEach(b=>{let i=b.querySelector(".wk52-badge");if(!n){if(i)i.remove();return}if(!i){i=document.createElement("i");i.className="wk52-badge";b.appendChild(i)}const v=n>9?"9+":String(n);if(i.textContent!==v)i.textContent=v});
}
function popup(p,count){
 document.getElementById("wk52-pop")?.remove();const t=tx();
 const d=document.createElement("div");d.id="wk52-pop";
 d.innerHTML=`<button class="wk52-pav" type="button">${avatar(p)}</button><div class="wk52-pt"><b dir="auto">${esc(p.name)}</b><small>${esc(t.newReq)}${count>1?` · +${count-1}`:""}</small></div><button type="button" class="wk52-pok">${esc(t.accept)}</button><button type="button" class="wk52-psee">${esc(t.see)}</button>`;
 const close=()=>{d.classList.add("out");setTimeout(()=>d.remove(),260)};
 d.querySelector(".wk52-pok").onclick=async()=>{vib();try{await wm70Friend("accept",Number(p.id))}catch(e){}close();say(t.accepted);setTimeout(poll,600)};
 d.querySelector(".wk52-psee").onclick=()=>{close();openRequests()};
 d.querySelector(".wk52-pav").onclick=()=>{close();try{wm70OpenProfile(Number(p.id))}catch(e){}};
 document.body.appendChild(d);try{tg.HapticFeedback.notificationOccurred("success")}catch(e){}
 setTimeout(close,9000);
}
function openRequests(){vib();try{if(g("TAB")!=="d")go("d")}catch(e){}setTimeout(()=>{const w=g("WM70");if(w){w.peer=null;w.tab="requests"}try{wm70ChatDraw()}catch(e){}},60)}
window.wk52Requests=openRequests;
function strip(){
 if(window.WK_V2)return; /* chats v2 shows the requests row itself */
 if(g("TAB")!=="d")return;const w=g("WM70");if(!w||w.peer||w.tab==="requests"||w.tab==="friends")return;
 const view=document.getElementById("view");if(!view)return;const head=view.querySelector(".sc-head");const inc=incoming();
 let s=view.querySelector("#wk52-strip");
 if(!inc.length){if(s)s.remove();return}
 const sig=inc.map(p=>p.id).join(",");if(s&&s.dataset.sig===sig)return;
 const t=tx();const html=`<div class="wk52-stack">${inc.slice(0,3).map(p=>`<span>${avatar(p)}</span>`).join("")}</div><div class="wk52-st"><b>${esc(t.reqs)} <i>${inc.length}</i></b><small dir="auto">${esc(inc.slice(0,2).map(p=>p.name).join("، "))}${inc.length>2?"…":""} · ${esc(t.seeAll)}</small></div><span class="wk52-chev">${I.chev}</span>`;
 if(!s){s=document.createElement("button");s.type="button";s.id="wk52-strip";s.onclick=openRequests;if(head)head.after(s);else view.prepend(s)}
 s.dataset.sig=sig;s.innerHTML=html;
}
setTimeout(poll,1500);setInterval(poll,20000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")poll()});
setInterval(paintBadge,700);
try{const sp=new URLSearchParams(location.search).get("p")||"";if(sp==="friends")setTimeout(openRequests,2600)}catch(e){}

/* ================= hall name + photo ================= */
let HC={};try{HC=JSON.parse(localStorage.getItem("wk52_hc")||"{}")||{};for(const k in HC)HC[k].t=0}catch(e){HC={}}
const saveHC=()=>{try{localStorage.setItem("wk52_hc",JSON.stringify(HC))}catch(e){}};
async function hallInfo(code,force){
 if(!code)return null;const c=HC[code];if(c&&!force&&Date.now()-c.t<60000)return c.v;if(c&&c.v&&!force){setTimeout(()=>{HC[code].t=Date.now()-50000;hallInfo(code,true)},0);return c.v}
 try{const j=await api("/api/v51/hall?code="+encodeURIComponent(code));if(j&&j.ok){HC[code]={v:j.hall,t:Date.now()};saveHC();return j.hall}}catch(e){}
 return c?c.v:null;
}
function hallAv(h,big){const n=(h&&h.name||"W").trim().charAt(0).toUpperCase();return h&&h.photo?`<img src="${esc(h.photo)}" alt="">`:`<span class="wk52-hini${big?" big":""}">${esc(n)}</span>`}
let lastSig="";
async function hallChip(){
 const r=document.getElementById("wm78-room");if(!r)return;const code=g("CID");if(!code)return;
 const tt=r.querySelector(".wm78-section-title");if(!tt)return;
 const h=await hallInfo(code);if(!h)return;
 const sig=code+"|"+h.name+"|"+h.photo+"|"+h.is_owner;let b=tt.querySelector(".wk52-hall");
 if(b&&b.dataset.sig===sig)return;
 if(!b){b=document.createElement("button");b.type="button";b.className="wk52-hall";b.onclick=()=>hallSheet();const h2=tt.querySelector("h2");if(h2)h2.replaceWith(b);else tt.prepend(b)}
 b.dataset.sig=sig;b.innerHTML=`<span class="wk52-hav">${hallAv(h)}</span><b dir="auto">${esc(h.name||tx().hall)}</b>${h.is_owner?`<span class="wk52-pen">${I.pen}</span>`:""}`;
}
setInterval(hallChip,800);

let DRAFT=null;
window.wk52HallEdit=hallSheet;window.wk52Info=hallInfo;
async function hallSheet(codeArg){
 vib();const code=(typeof codeArg==="string"&&codeArg)||g("CID");let h=await hallInfo(code,true);
 if(!h){const m=g("WMP");if(m&&m.mine&&m.mine.code===code)h={code,name:m.mine.name||"",photo:null,is_owner:true,custom:true};else h={code,name:"",photo:null,is_owner:false};say(tx().srv)}const t=tx();DRAFT={photo:null,reset:false,code};
 if(!h.is_owner){
  try{sheet(`<section class="wk52-hs"><div class="wk52-hbig">${hallAv(h,true)}</div><h3 dir="auto">${esc(h.name)}</h3><p>${esc(t.code)} · <bdi>${esc(code)}</bdi></p></section>`)}catch(e){}return}
 try{sheet(`<section class="wk52-hs"><h3>${esc(t.edit)}</h3><button type="button" class="wk52-hbig wk52-pick" onclick="wk52Pick()"><span id="wk52-prev">${hallAv(h,true)}</span><i>${I.cam}</i></button>
 <div class="wk52-links"><button type="button" onclick="wk52Pick()">${esc(t.change)}</button>${h.photo?`<button type="button" class="red" onclick="wk52Reset()">${esc(t.remove)}</button>`:""}</div>
 <label class="wk52-lbl">${esc(t.name)}</label><input id="wk52-name" maxlength="40" dir="auto" autocomplete="off" placeholder="${esc(t.namePh)}" value="${esc(h.custom||h.name?h.name:"")}">
 <button type="button" class="wk52-save" onclick="wk52Save()">${esc(t.save)}</button><p class="wk52-note">${esc(t.code)} · <bdi>${esc(code)}</bdi></p></section>`)}catch(e){}
}
window.wk52Pick=function(){
 const f=document.createElement("input");f.type="file";f.accept="image/*";
 f.onchange=()=>{const file=f.files&&f.files[0];if(!file)return;const url=URL.createObjectURL(file);const im=new Image();
  im.onload=()=>{const s=Math.min(im.width,im.height),c=document.createElement("canvas");c.width=c.height=Math.min(640,s);
   c.getContext("2d").drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,c.width,c.height);URL.revokeObjectURL(url);
   DRAFT.photo=c.toDataURL("image/jpeg",.86);DRAFT.reset=false;const p=document.getElementById("wk52-prev");if(p)p.innerHTML=`<img src="${DRAFT.photo}" alt="">`};
  im.src=url};
 f.click();
};
window.wk52Reset=function(){DRAFT.reset=true;DRAFT.photo=null;const p=document.getElementById("wk52-prev");if(p)p.innerHTML=hallAv({name:(document.getElementById("wk52-name")||{}).value},true)};
window.wk52Save=async function(){
 const t=tx(),code=(DRAFT&&DRAFT.code)||g("CID"),btn=document.querySelector(".wk52-save");if(btn){btn.disabled=true;btn.classList.add("busy")}
 const body={code,name:(document.getElementById("wk52-name")||{}).value||""};if(DRAFT.photo)body.photo=DRAFT.photo;else if(DRAFT.reset)body.reset_photo=true;
 try{const j=await api("/api/v51/hall",body);if(!j||!j.ok)throw Error(j&&j.err);
  HC[code]={v:j.hall,t:Date.now()};const m=g("WMP");if(m&&m.mine&&m.mine.code===code)m.mine.name=j.hall.name;
  try{closeSheet()}catch(e){}say(t.saved);vib();hallChip();savedChips(true);try{window.wk56Refresh&&wk56Refresh()}catch(e){}
 }catch(e){say(String(e&&e.message)==="owner_only"?t.only:t.err);if(btn){btn.disabled=false;btn.classList.remove("busy")}}
};

/* lobby: saved halls and own-cinema card show the real hall name and photo */
let chipT=0;
async function savedChips(force){
 const chips=[...document.querySelectorAll(".wk16-chip")];if(!chips.length)return;
 if(!force&&Date.now()-chipT<30000&&chips.every(c=>c.dataset.wk52))return;chipT=Date.now();
 const codes=chips.map(c=>((c.getAttribute("onclick")||"").match(/'([A-Z0-9]{4,8})'/)||[])[1]).filter(Boolean);if(!codes.length)return;
 try{const j=await api("/api/v51/hall?codes="+codes.join(","));if(!j||!j.ok)return;
  for(const c of chips){const code=((c.getAttribute("onclick")||"").match(/'([A-Z0-9]{4,8})'/)||[])[1];const h=j.halls[code];c.dataset.wk52=1;if(!h)continue;HC[code]={v:h,t:Date.now()};
   const av=c.querySelector(".wk16-av"),b=c.querySelector(".wk16-t b");if(av)av.innerHTML=h.photo?`<img src="${esc(h.photo)}" alt="">`:esc((h.name||code).charAt(0).toUpperCase());if(b&&h.name)b.textContent=h.name}
 }catch(e){}
}
setInterval(()=>{if(g("TAB")==="c")savedChips(false)},1500);


/* DM thread: full-width header, and the page never jumps when the keyboard opens or closes */
(function(){const vv=window.visualViewport;if(!vv)return;
 const fix=()=>{if(!document.body.classList.contains("dt-open"))return;const kb=vv.height<window.innerHeight-80;
  if(window.scrollY)window.scrollTo(0,0);document.documentElement.style.setProperty("--dt-top",(kb?Math.round(vv.offsetTop||0):0)+"px");document.documentElement.style.setProperty("--dt-h",Math.round(kb?vv.height:window.innerHeight)+"px")};
 vv.addEventListener("resize",fix);vv.addEventListener("scroll",fix);window.addEventListener("scroll",fix,{passive:true});
 document.addEventListener("focusin",()=>{fix();setTimeout(fix,100);setTimeout(fix,300);setTimeout(fix,600)});document.addEventListener("focusout",()=>{setTimeout(fix,60);setTimeout(fix,350);setTimeout(fix,700)});
})();

(function wrapHalo(){if(typeof wm70HaloArt==="undefined")return setTimeout(wrapHalo,300);if(wm70HaloArt.__wkl)return;const o=wm70HaloArt;const f=function(){const h=o.apply(this,arguments);return typeof h==="string"?h.replace(/\/s\/halo-([a-z]\d)\.webp\?v=\d+/g,"/s/halo-$1-l.webp?v=71"):h};f.__wkl=1;wm70HaloArt=f;window.wm70HaloArt=f})();
/* halos: small avatars use a light still image, big ones a light animation (the full 850 KB animation is never loaded) */
(function(){const RX=/\/s\/halo-([a-z]\d)(?:-l)?\.webp/;
 function pick(img){if(img.dataset.wkl)return;const m=RX.exec(img.getAttribute("src")||"");if(!m)return;img.dataset.wkl=1;
  let w=0;try{const box=img.closest(".wm70-avatar,.wm70-avatar-halo")||img.parentElement;w=box?box.getBoundingClientRect().width:0}catch(e){}
  const inSheet=!!img.closest("#sheet");const still=inSheet?!img.closest(".on,.is-active,[aria-pressed=true],.sel"):(w&&w<=64);
  const want="/s/halo-"+m[1]+(still?"-s":"-l")+".webp?v=71";if(img.getAttribute("src")!==want)img.setAttribute("src",want)}
 function scan(root){if(root.nodeType!==1)return;if(root.matches&&root.matches("img.wk-halo-img"))pick(root);root.querySelectorAll&&root.querySelectorAll("img.wk-halo-img:not([data-wkl])").forEach(pick)}
 new MutationObserver(ms=>{for(const m of ms){if(m.type==="attributes"){const t=m.target;if(t.dataset&&t.dataset.wkl&&/\/s\/halo-[a-z]\d\.webp/.test(t.getAttribute("src")||"")){delete t.dataset.wkl;pick(t)}continue}for(const n of m.addedNodes)scan(n)}}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]});
 scan(document.body||document.documentElement);
})();
const st=document.createElement("style");st.textContent=`
.wk52-badge{position:absolute;top:2px;left:calc(50% + 6px);min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#ef4444;color:#fff;font:800 10px/17px system-ui,-apple-system,sans-serif;font-style:normal;text-align:center;box-shadow:0 0 0 2px var(--bg,#0f2a22);pointer-events:none}
#nav button{position:relative}
#wk52-pop{position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 10px);z-index:9500;display:flex;align-items:center;gap:10px;padding:10px 10px 10px 12px;border-radius:20px;background:color-mix(in srgb,var(--card,#16302a) 92%,transparent);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid var(--ln,rgba(255,255,255,.12));box-shadow:0 14px 36px rgba(0,0,0,.45);animation:wk52in .35s cubic-bezier(.2,1.3,.4,1)}
#wk52-pop.out{transition:.25s;transform:translateY(-130%);opacity:0}
@keyframes wk52in{from{transform:translateY(-130%)}to{transform:none}}
.wk52-pav{flex:0 0 44px;width:44px;height:44px;border-radius:50%;padding:0;border:0;background:none;overflow:hidden}
.wk52-pav>*,.wk52-stack span>*{width:100%!important;height:100%!important}
.wk52-pt{flex:1;min-width:0}.wk52-pt b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wk52-pt small{display:block;font-size:12px;color:var(--mut,#9aa);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wk52-pok,.wk52-psee{height:34px;padding:0 13px;border-radius:17px;border:0;font:800 12.5px system-ui,-apple-system,sans-serif}
.wk52-pok{background:var(--a1,#10b981);color:#fff}.wk52-psee{background:rgba(255,255,255,.1);color:var(--txt,#fff)}
#wk52-strip{width:calc(100% - 24px);margin:4px 12px 10px;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:20px;border:1px solid color-mix(in srgb,var(--a1,#10b981) 40%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--a1,#10b981) 22%,transparent),color-mix(in srgb,var(--a1,#10b981) 6%,transparent));color:var(--txt,#fff);text-align:start;font:inherit}
.wk52-stack{display:flex;flex:0 0 auto}.wk52-stack span{width:38px;height:38px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px var(--bg,#0f2a22);margin-inline-start:-12px;display:block}.wk52-stack span:first-child{margin-inline-start:0}
.wk52-st{flex:1;min-width:0}.wk52-st b{display:flex;align-items:center;gap:6px;font-size:14.5px}.wk52-st b i{font-style:normal;min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:#ef4444;color:#fff;font-size:11px;line-height:20px;text-align:center}
.wk52-st small{display:block;margin-top:2px;font-size:12px;color:var(--mut,#9aa);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wk52-chev svg{width:18px;height:18px;opacity:.6}html[dir=ltr] .wk52-chev svg,body[dir=ltr] .wk52-chev svg{transform:scaleX(-1)}
.wk52-ini,.wk52-hini{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,var(--a1,#10b981),color-mix(in srgb,var(--a1,#10b981) 45%,#000));color:#fff;font-weight:800}
.wk52-hall{display:inline-flex;align-items:center;gap:8px;max-width:72%;padding:3px 10px 3px 3px;border-radius:20px;border:1px solid var(--ln,rgba(255,255,255,.12));background:rgba(255,255,255,.05);color:var(--txt,#fff);font:inherit}
.wk52-hall b{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wk52-hav{flex:0 0 28px;width:28px;height:28px;border-radius:50%;overflow:hidden;display:block}.wk52-hav img{width:100%;height:100%;object-fit:cover;display:block}.wk52-hav .wk52-hini{font-size:13px}
.wk52-pen svg{width:14px;height:14px;opacity:.7;display:block}
.wk52-hs{text-align:center;padding:2px 2px 4px}.wk52-hs h3{margin:2px 0 14px;font-size:17px}.wk52-hs p{margin:6px 0 0;font-size:12px;color:var(--mut,#9aa)}
.wk52-hbig{position:relative;display:block;width:104px;height:104px;margin:0 auto 10px;border-radius:50%;padding:0;border:0;background:none;color:#fff}
.wk52-hbig img,.wk52-hbig>span>img{width:104px;height:104px;border-radius:50%;object-fit:cover;display:block}.wk52-hbig .wk52-hini.big,.wk52-hbig>span{width:104px;height:104px;font-size:40px;display:grid;place-items:center;border-radius:50%;overflow:hidden}
.wk52-hbig i{position:absolute;right:2px;bottom:2px;width:32px;height:32px;border-radius:50%;background:var(--a1,#10b981);display:grid;place-items:center;box-shadow:0 0 0 3px var(--card,#16302a)}.wk52-hbig i svg{width:17px;height:17px}
.wk52-links{display:flex;justify-content:center;gap:16px;margin-bottom:14px}.wk52-links button{border:0;background:none;color:var(--a1,#10b981);font:700 13px system-ui,-apple-system,sans-serif}.wk52-links .red{color:#fb7185}
.wk52-lbl{display:block;text-align:start;font-size:12px;color:var(--mut,#9aa);margin:0 4px 6px}
#wk52-name{width:100%;box-sizing:border-box;height:48px;border-radius:16px;border:1px solid var(--ln,rgba(255,255,255,.14));background:rgba(255,255,255,.06);color:var(--txt,#fff);padding:0 14px;font:600 15px system-ui,-apple-system,sans-serif;outline:none}
#wk52-name:focus{border-color:var(--a1,#10b981)}
.wk52-save{width:100%;height:48px;margin-top:14px;border-radius:16px;border:0;background:var(--a1,#10b981);color:#fff;font:800 15px system-ui,-apple-system,sans-serif}.wk52-save.busy{opacity:.6}
.wk16-av img{width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block}.wk16-av{overflow:hidden}

/* chats: title + actions + search are one clean block (the global <header> bar style is removed) */
#view header.sc-head{position:static!important;max-width:none!important;margin:2px 0 10px!important;padding:0 2px!important;background:none!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;min-height:44px}
#view header.sc-head h1{font-size:28px!important;letter-spacing:-.3px}
#view header.sc-head .sc-ic{width:42px;height:42px;border-radius:50%;background:var(--card2,rgba(255,255,255,.07))!important;border:0!important;display:grid;place-items:center;position:relative}
#view header.sc-head .sc-ic svg{width:21px;height:21px}
#view header.sc-head+.sc-search,#view .sc-search{margin:0 0 14px!important;background:var(--card2,rgba(255,255,255,.07))!important;border:0!important}
body .dt-page header.dt-head{width:100%!important;max-width:none!important;margin:0!important;position:relative!important;top:auto!important;left:auto!important;right:auto!important;border-radius:0!important;box-sizing:border-box!important;min-height:56px}
html:has(body.dt-open),body.dt-open{overflow:hidden!important;overscroll-behavior:none}
`;document.head.appendChild(st);
})();
