/* WAKHAN M16: cinema lobby — friend-code search on top, saved halls, no tab bar over the keyboard */
(()=>{"use strict";
const tg=window.Telegram&&Telegram.WebApp;const ME=+((tg&&tg.initDataUnsafe&&tg.initDataUnsafe.user&&tg.initDataUnsafe.user.id)||0);
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KEY="wk_halls";
const TX={fa:{ph:"کد سالون رفیقت…",saved:"سالون‌های ذخیره‌شده",del:"از لیست پاک شد",go:"ورود"},ps:{ph:"د ملګري د تالار کوډ…",saved:"خوندي شوي تالارونه",del:"له لیست څخه لرې شو",go:"ننوتل"},en:{ph:"Friend’s hall code…",saved:"Saved halls",del:"Removed",go:"Join"}};
const L=()=>{const l=document.documentElement.lang||"fa";return l.startsWith("ps")?TX.ps:(l==="fa"||l==="fa-IR")?TX.fa:TX.en};
const tx=s=>{try{return window.WM13?WM13.tr(s):s}catch(e){return s}};
let halls=[];
function loadLocal(){try{halls=JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){halls=[]}if(!Array.isArray(halls))halls=[]}
function save(){const v=JSON.stringify(halls.slice(0,12));try{localStorage.setItem(KEY,v)}catch(e){}try{tg.CloudStorage.setItem(KEY,v,()=>{})}catch(e){}}
loadLocal();try{tg.CloudStorage.getItem(KEY,(e,v)=>{if(!e&&v){try{const c=JSON.parse(v);if(Array.isArray(c)){const m=new Map(c.concat(halls).map(x=>[x.code,x]));halls=[...m.values()].sort((a,b)=>b.ts-a.ts);draw()}}catch(_){}}})}catch(e){}
function remember(code,name){code=String(code||"").toUpperCase();if(!/^[A-Z0-9]{4,8}$/.test(code))return;const old=halls.find(x=>x.code===code);halls=halls.filter(x=>x.code!==code);halls.unshift({code,name:(name||old?.name||"").slice(0,32),ts:Date.now()});save()}
window.wk16Go=function(code){const i=document.getElementById("rc");if(!i)return;i.value=code;try{tg.HapticFeedback.impactOccurred("light")}catch(e){}if(typeof wm75Join==="function")wm75Join()};
window.wk16Del=function(code,ev){ev&&ev.stopPropagation();halls=halls.filter(x=>x.code!==code);save();draw();try{toast(L().del)}catch(e){}};
/* record every hall I enter that is not mine */
setInterval(()=>{try{if(typeof CID!=="undefined"&&CID&&window.CS&&CS.owner&&Number(CS.owner)!==ME){const n=(document.querySelector("#wm78-room .wm78-heading h1")||{}).textContent||"";const h=halls[0];if(!h||h.code!==String(CID).toUpperCase()||(n&&h.name!==n.trim()))remember(CID,n.trim())}}catch(e){}},2500);
const SEARCH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>';
function chips(){if(!halls.length)return "";return `<div class="wk16-saved"><small>${esc(L().saved)}</small><div class="wk16-row">${halls.map(x=>`<button type="button" class="wk16-chip" onclick="wk16Go('${x.code}')"><span class="wk16-av">${esc((x.name||x.code).trim().charAt(0).toUpperCase())}</span><span class="wk16-t"><b>${esc(x.name||x.code)}</b><small>${esc(x.code)}</small></span><i onclick="wk16Del('${x.code}',event)" aria-label="×">×</i></button>`).join("")}</div></div>`}
function draw(){const box=document.getElementById("wk16-saved-slot");if(box)box.innerHTML=chips()}
function mount(){const lobby=document.querySelector(".wm75-lobby");if(!lobby)return;
 if(!lobby.querySelector(".wk16-top")){const form=lobby.querySelector(".wm75-code-form");if(!form)return;const status=document.getElementById("wm75-join-status");
  const top=document.createElement("div");top.className="wk16-top";lobby.insertBefore(top,lobby.firstChild);
  form.classList.add("wk16-form");top.appendChild(form);if(status)top.appendChild(status);
  const slot=document.createElement("div");slot.id="wk16-saved-slot";top.appendChild(slot);
  const inp=form.querySelector("#rc");if(inp)inp.placeholder=L().ph;
  const btn=form.querySelector("#wm75-join");if(btn){btn.innerHTML=SEARCH;btn.setAttribute("aria-label",L().go)}
  const fr=lobby.querySelector(".wm75-friend");if(fr)fr.style.display="none";draw()}}
/* wrap joinRoom so successful joins are saved immediately */
function wrapJoin(){if(typeof joinRoom!=="function"||joinRoom.__wk16)return;const o=joinRoom;const n=async function(code,...a){const r=await o.call(this,code,...a);remember(code,"");return r};n.__wk16=1;try{joinRoom=n}catch(e){}}
/* keyboard open -> hide floating tab bars */
const typing=on=>document.body&&document.body.classList.toggle("wk-typing",on);
const kb=()=>{const vv=window.visualViewport;const inset=vv?Math.max(0,window.innerHeight-vv.height-(vv.offsetTop||0)):0;document.body&&document.body.style.setProperty("--wk-kb",Math.round(inset)+"px")};
try{visualViewport.addEventListener("resize",kb);visualViewport.addEventListener("scroll",kb)}catch(e){}
document.addEventListener("focusin",e=>{const t=e.target;if(t.matches&&t.matches("input:not([type=checkbox]):not([type=radio]),textarea,[contenteditable]")){typing(true);kb();
 if(!t.closest("#wm78-room"))for(const d of [250,500,800])setTimeout(()=>{try{t.scrollIntoView({block:"center",behavior:"smooth"})}catch(_){}},d)}});
document.addEventListener("focusout",()=>setTimeout(()=>{const a=document.activeElement;typing(!!(a&&a.matches&&a.matches("input,textarea,[contenteditable]")))},120));
const st=document.createElement("style");st.textContent=`
body.wk-typing .wm75-tabs,body.wk-typing #nav{display:none!important}
body.wk-typing .wm75-unlock-page .wm75-camera-art,body.wk-typing .wm75-unlock-page .wm75-gate>small,body.wk-typing .wm75-unlock-page .wm75-gate>.wm75-caption{display:none!important}
body.wk-typing .wm75-unlock-page .wm75-gate>h2{font-size:18px!important;margin:4px 0 10px!important}
body.wk-typing .wm75-unlock-page .wm75-gate{padding-top:16px!important}
body.wk-typing #view{padding-bottom:calc(var(--wk-kb,0px) + 24px)!important}
.wk16-top{margin:0 0 16px}
#view .wk16-form{display:flex!important;align-items:center;gap:6px;height:42px!important;min-height:0!important;margin:0!important;padding:4px 4px 4px 14px!important;border-radius:21px;background:var(--card2,rgba(255,255,255,.08));border:1.5px solid color-mix(in srgb,var(--a1,#ec4899) 55%,transparent);box-shadow:0 0 0 4px color-mix(in srgb,var(--a1,#ec4899) 12%,transparent);direction:ltr}
#view .wk16-form input#rc{flex:1;min-width:0;height:100%;border:0!important;background:transparent!important;outline:0;box-shadow:none!important;color:var(--txt);font:600 15px/1 system-ui,-apple-system,sans-serif;letter-spacing:2px;text-transform:uppercase;padding:0!important}
#view .wk16-form input#rc::placeholder{letter-spacing:0;text-transform:none;font-weight:500;opacity:.55}
#view .wk16-form #wm75-join{flex:0 0 34px!important;width:34px!important;min-width:34px!important;max-width:34px!important;height:34px!important;margin:0!important;min-height:0!important;padding:0!important;border-radius:50%!important;display:inline-flex;align-items:center;justify-content:center;background:var(--a1,#ec4899)!important;color:#fff!important;border:0!important}
#view .wk16-form #wm75-join svg{width:19px;height:19px}
.wk16-top .wm75-form-status{margin:6px 4px 0;font-size:12px}
.wk16-saved{margin-top:12px}.wk16-saved>small{display:block;margin:0 4px 6px;font-size:11px;color:var(--mut)}
.wk16-row{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 4px;scrollbar-width:none;direction:ltr}.wk16-row::-webkit-scrollbar{display:none}
.wk16-chip{position:relative;flex:none;display:flex;align-items:center;gap:8px;padding:6px 26px 6px 6px;border-radius:22px;border:1px solid var(--ln);background:var(--card);color:var(--txt);font:inherit}
.wk16-av{width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--a1,#ec4899),var(--a2,#7c3aed));color:#fff;font-weight:800;font-size:14px}
.wk16-t{display:flex;flex-direction:column;align-items:flex-start;line-height:1.2}.wk16-t b{font-size:12.5px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wk16-t small{font:600 10px system-ui;letter-spacing:1px;color:var(--mut)}
.wk16-chip i{position:absolute;top:50%;right:6px;transform:translateY(-50%);width:16px;height:16px;line-height:15px;text-align:center;border-radius:50%;font-style:normal;font-size:12px;color:var(--mut);background:rgba(255,255,255,.06)}
`;document.head.appendChild(st);
let q=0;new MutationObserver(()=>{if(!q)q=requestAnimationFrame(()=>{q=0;mount();wrapJoin()})}).observe(document.documentElement,{childList:true,subtree:true});
mount();wrapJoin();
})();
