/* WAKHAN M9: owner tools inside the profile card, crown/star badges on seats, chats always left-to-right */
(()=>{
const TX={fa:{give:"⭐ دادن اختیار سالن",take:"پس گرفتن اختیار",kick:"🚪 بیرون کردن از سالن",host:"⭐ اختیار سالن دارد",own:"👑 صاحب سالن",ok1:"⭐ اختیار داده شد",ok2:"اختیار پس گرفته شد",ok3:"🚪 بیرون شد",err:"خطا شد، دوباره کوشش کنید",sure:"مطمئن هستید؟"},
ps:{give:"⭐ د تالار اختیار ورکول",take:"اختیار بېرته اخیستل",kick:"🚪 له تالار ایستل",host:"⭐ د تالار اختیار لري",own:"👑 د تالار خاوند",ok1:"⭐ اختیار ورکړل شو",ok2:"اختیار بېرته واخیستل شو",ok3:"🚪 وایستل شو",err:"تېروتنه وشوه",sure:"ډاډه یاست؟"},
en:{give:"⭐ Give hall control",take:"Take control back",kick:"🚪 Remove from hall",host:"⭐ Has hall control",own:"👑 Hall owner",ok1:"⭐ Control given",ok2:"Control taken back",ok3:"🚪 Removed",err:"Something went wrong",sure:"Are you sure?"}};
const T=k=>{const l=(document.documentElement.lang||"fa").slice(0,2);return (TX[l]||(l==="ps"?TX.ps:l==="fa"?TX.fa:TX.en))[k]};
const me=()=>Number((window.ME&&ME.me&&ME.me.id)||0);
const inHall=()=>typeof TAB!=="undefined"&&TAB==="c"&&typeof CID!=="undefined"&&CID&&typeof CS!=="undefined"&&CS;
const say=m=>{try{toast(m)}catch(e){}};
async function post(a,uid){const tg=window.Telegram&&Telegram.WebApp;const r=await fetch("/api/c/"+CID,{method:"POST",headers:{"Content-Type":"application/json","X-Init":(tg&&tg.initData)||""},body:JSON.stringify({a,uid})});return r.json()}
const ask=m=>new Promise(r=>{try{const tg=window.Telegram&&Telegram.WebApp;if(tg&&tg.showConfirm&&tg.isVersionAtLeast&&tg.isVersionAtLeast("6.2"))return tg.showConfirm(m,ok=>r(!!ok))}catch(e){}r(window.confirm(m))});
window.wm91=async(a,uid)=>{if(a==="kick"&&!(await ask(T("sure"))))return;try{const j=await post(a,uid);if(!j.ok)return say(T("err"));if(j.hosts&&CS)CS.hosts=j.hosts;if(a==="kick"){CS.seats=CS.seats.map(v=>v&&Number(v.id)===uid?null:v);try{closeSheet()}catch(e){}}else{try{wm70OpenProfile(uid)}catch(e){}}try{Telegram.WebApp.HapticFeedback.impactOccurred("medium")}catch(e){}say(a==="grant"?T("ok1"):a==="revoke"?T("ok2"):T("ok3"));badges()}catch(e){say(T("err"))}};
function hook(){if(typeof window.wm70ProfileButtons!=="function"||window.wm70ProfileButtons._wm91)return false;const orig=window.wm70ProfileButtons;
const wrapped=function(p){let html=orig.apply(this,arguments);try{const id=Number(p&&p.id);if(!inHall()||!id||id===me())return html;const hosts=CS.hosts||[];const seated=(CS.seats||[]).some(v=>v&&Number(v.id)===id);
let tag="";if(Number(CS.owner)===id)tag=`<div class="wm91-tag own">${T("own")}</div>`;else if(hosts.includes(id))tag=`<div class="wm91-tag">${T("host")}</div>`;
if(Number(CS.owner)===me()&&seated){html+=`<div class="wm91-tools">${hosts.includes(id)?`<button class="wm91-b soft" onclick="wm91('revoke',${id})">${T("take")}</button>`:`<button class="wm91-b gold" onclick="wm91('grant',${id})">${T("give")}</button>`}<button class="wm91-b red" onclick="wm91('kick',${id})">${T("kick")}</button></div>`}
return tag+html}catch(e){return html}};wrapped._wm91=true;window.wm70ProfileButtons=wrapped;return true}
function badges(){if(!inHall())return;const hosts=CS.hosts||[];document.querySelectorAll("#hall .seat[data-u]").forEach(s=>{const id=Number(s.dataset.u);let b=s.querySelector(".wm91-badge");const k=id&&Number(CS.owner)===id?"👑":id&&hosts.includes(id)?"⭐":"";if(!k){if(b)b.remove();return}if(!b){b=document.createElement("span");b.className="wm91-badge";(s.querySelector(".ch")||s).appendChild(b)}b.textContent=k})}
setInterval(()=>{hook();badges()},1200);
const st=document.createElement("style");st.textContent=`
.wm91-tools{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.wm91-b{border:0;border-radius:16px;padding:12px;font-weight:800;font-size:14px;color:#fff;font-family:inherit}
.wm91-b.gold{background:linear-gradient(135deg,#f59e0b,#ef4444);box-shadow:0 12px 26px -14px #f59e0b}
.wm91-b.soft{background:var(--card2,rgba(255,255,255,.12));color:var(--txt,#fff)}
.wm91-b.red{background:rgba(220,38,38,.16);color:#f87171;border:1px solid rgba(248,113,113,.35)}
.wm91-tag{display:inline-block;margin:8px auto 2px;padding:5px 12px;border-radius:999px;font-weight:800;font-size:12px;background:rgba(251,191,36,.14);color:#fbbf24;border:1px solid rgba(251,191,36,.35)}
.wm91-tag.own{background:linear-gradient(135deg,rgba(245,158,11,.25),rgba(239,68,68,.2))}
.wm91-badge{position:absolute;top:-6px;left:-4px;font-size:15px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.6));z-index:3}
.seat .ch{position:relative}
.wm70-dm-messages,.wm70-compose,.wm70-live-compose,.wm70-live-messages,.wm70-thread-head{direction:ltr}
.wm70-message,.wm70-live-message bdi,.wm70-message *{unicode-bidi:plaintext;text-align:start}`;
document.head.appendChild(st);})();
