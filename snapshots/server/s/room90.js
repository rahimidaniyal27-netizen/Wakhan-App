/* WAKHAN M7: hall roles - owner controls, co-hosts, kick */
(()=>{const tg=window.Telegram&&Telegram.WebApp;const ME=+((tg&&tg.initDataUnsafe&&tg.initDataUnsafe.user&&tg.initDataUnsafe.user.id)||0);
const TX={fa:{host:"🔒 کنترل سالن فقط برای صاحب سالن یا کسی است که اختیار گرفته",kicked:"🚪 صاحب سالن شما را بیرون کرده است",manage:"مدیریت سالن",title:"👑 مدیریت سالن",sub:"به دوستانت اختیار پخش بده یا پس بگیر",give:"⭐ دادن اختیار",take:"پس گرفتن",kick:"بیرون",empty:"هنوز کسی در سالن نیست",hostb:"دارای اختیار",given:"⭐ اختیار داده شد",taken:"اختیار پس گرفته شد",out:"🚪 بیرون شد",err:"خطا شد، دوباره کوشش کنید"},
ps:{host:"🔒 د تالار کنټرول یوازې د تالار د خاوند یا هغه چا لپاره دی چې اختیار لري",kicked:"🚪 د تالار خاوند تاسو ایستلي یاست",manage:"د تالار مدیریت",title:"👑 د تالار مدیریت",sub:"ملګرو ته د غږولو اختیار ورکړئ یا یې بېرته واخلئ",give:"⭐ اختیار ورکول",take:"بېرته اخیستل",kick:"ایستل",empty:"لا په تالار کې څوک نشته",hostb:"اختیار لري",given:"⭐ اختیار ورکړل شو",taken:"اختیار بېرته واخیستل شو",out:"🚪 وایستل شو",err:"تېروتنه وشوه"},
en:{host:"🔒 Only the hall owner or a co-host can control playback",kicked:"🚪 The hall owner removed you",manage:"Manage hall",title:"👑 Manage hall",sub:"Give friends control of playback or take it back",give:"⭐ Make co-host",take:"Remove",kick:"Kick",empty:"Nobody else is in the hall yet",hostb:"Co-host",given:"⭐ Co-host added",taken:"Co-host removed",out:"🚪 Removed",err:"Something went wrong"}};
const L=()=>{const l=(document.documentElement.lang||"fa").slice(0,2);return TX[l]||(l==="fa"?TX.fa:TX.en)};
let S=null,CODE=null,AT=0;const of=window.fetch.bind(window);
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(m){let e=document.getElementById("wm90t");if(!e){e=document.createElement("div");e.id="wm90t";document.body.appendChild(e)}e.textContent=m;e.className="on";clearTimeout(e._t);e._t=setTimeout(()=>e.className="",2600)}
window.fetch=async function(u,o){const r=await of(u,o);try{const url=String((u&&u.url)||u);const m=url.match(/\/api\/c\/([A-Za-z0-9]{4,8})(?:[?#]|$)/);if(m){r.clone().json().then(j=>{if(!j)return;if(j.seats){S=j;CODE=m[1].toUpperCase();AT=Date.now();draw()}if(j.err==="host")toast(L().host);if(j.err==="kicked")toast(L().kicked)}).catch(()=>{})}}catch(e){}return r};
function owner(){return S&&ME&&(S.owner===ME)}
function draw(){let b=document.getElementById("wm90b");const show=owner()&&Date.now()-AT<45000;if(!show){if(b)b.remove();return}
if(!b){b=document.createElement("button");b.id="wm90b";b.onclick=sheet;document.body.appendChild(b)}b.innerHTML="👑 "+esc(L().manage)}
setInterval(draw,5000);
async function act(a,uid){try{const r=await of("/api/c/"+CODE,{method:"POST",headers:{"Content-Type":"application/json","X-Init":(tg&&tg.initData)||""},body:JSON.stringify({a,uid})});const j=await r.json();if(!j.ok)return toast(L().err);if(j.hosts&&S)S.hosts=j.hosts;if(a==="kick"&&S)S.seats=S.seats.map(x=>x&&x.id===uid?null:x);try{tg&&tg.HapticFeedback&&tg.HapticFeedback.impactOccurred("medium")}catch(e){}toast(a==="grant"?L().given:a==="revoke"?L().taken:L().out);sheet()}catch(e){toast(L().err)}}
window.wm90act=act;
function sheet(){const t=L();let ov=document.getElementById("wm90o");if(!ov){ov=document.createElement("div");ov.id="wm90o";ov.onclick=e=>{if(e.target===ov)ov.remove()};document.body.appendChild(ov)}
const ppl=(S&&S.seats||[]).filter(x=>x&&x.id!==ME);const hs=(S&&S.hosts)||[];
ov.innerHTML=`<div class="wm90s"><i class="wm90g"></i><h3>${esc(t.title)}</h3><p>${esc(t.sub)}</p><div class="wm90c">${esc(CODE||"")}</div>${ppl.length?ppl.map(x=>{const h=hs.includes(x.id);return `<div class="wm90r"><img src="/ava/${x.id}" onerror="this.style.visibility='hidden'"><div class="wm90n"><b>${esc(x.name)}</b>${h?`<span>⭐ ${esc(t.hostb)}</span>`:""}</div>${h?`<button class="wm90x" onclick="wm90act('revoke',${x.id})">${esc(t.take)}</button>`:`<button class="wm90y" onclick="wm90act('grant',${x.id})">${esc(t.give)}</button>`}<button class="wm90k" onclick="wm90act('kick',${x.id})">🚪</button></div>`}).join(""):`<div class="wm90e">${esc(t.empty)}</div>`}</div>`}
const st=document.createElement("style");st.textContent=`#wm90b{position:fixed;left:14px;bottom:calc(64px + env(safe-area-inset-bottom));z-index:60;padding:10px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font:800 13px Vazirmatn,system-ui,sans-serif;box-shadow:0 14px 30px -12px rgba(245,158,11,.7)}
#wm90o{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center}
.wm90s{width:100%;max-width:560px;max-height:82vh;overflow:auto;background:#161226;color:#f4f1ff;border-radius:28px 28px 0 0;padding:10px 16px calc(24px + env(safe-area-inset-bottom));font-family:Vazirmatn,system-ui,sans-serif;direction:rtl;border:1px solid rgba(255,255,255,.1)}
.wm90g{display:block;width:42px;height:5px;border-radius:9px;background:rgba(255,255,255,.2);margin:2px auto 14px}
.wm90s h3{margin:0;font-size:19px;font-weight:900}.wm90s p{margin:6px 0 10px;color:#a9a2c7;font-size:13px}
.wm90c{display:inline-block;direction:ltr;letter-spacing:4px;font-weight:900;font-size:18px;padding:6px 14px;border-radius:12px;background:rgba(255,255,255,.07);margin-bottom:12px}
.wm90r{display:flex;align-items:center;gap:10px;padding:10px;border-radius:18px;background:rgba(255,255,255,.06);margin-bottom:8px}
.wm90r img{width:44px;height:44px;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,#8b5cf6,#3b82f6)}
.wm90n{flex:1;min-width:0}.wm90n b{display:block;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wm90n span{font-size:11.5px;color:#fbbf24;font-weight:800}
.wm90y,.wm90x,.wm90k{border:0;border-radius:13px;padding:9px 12px;font:800 12.5px Vazirmatn,system-ui,sans-serif;color:#fff}
.wm90y{background:linear-gradient(135deg,#f59e0b,#ef4444)}.wm90x{background:rgba(255,255,255,.12)}.wm90k{background:#dc2626}
.wm90e{text-align:center;color:#a9a2c7;padding:24px}
#wm90t{position:fixed;top:calc(72px + env(safe-area-inset-top));left:50%;transform:translateX(-50%) translateY(-20px);opacity:0;z-index:90;max-width:88%;text-align:center;padding:11px 16px;border-radius:16px;background:#1d1830;color:#fff;font:700 13.5px Vazirmatn,system-ui,sans-serif;border:1px solid rgba(255,255,255,.12);transition:.3s;pointer-events:none}
#wm90t.on{opacity:1;transform:translateX(-50%)}`;document.head.appendChild(st)})();
