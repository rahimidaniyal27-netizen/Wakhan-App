/* WAKHAN M51: persistent hall (TopTop style). Leaving the hall page keeps your seat, voice and mic alive;
   a small floating bubble brings you back. The exit button asks: keep the hall, or really leave. */
(function(){
"use strict";
if(window.__wk51)return;window.__wk51=1;
const T={
 fa:{keep:"نگه داشتن سالون",keepSub:"صدا و مایک روشن می‌مانه و بقیه اپ ره می‌گردی",leave:"ترک سالون",leaveSub:"از جایگاه بلند می‌شی و صدا قطع میشه",cancel:"لغو",back:"برگشت به سالون",mic:"مایک",lost:"جایگاهت در سالون آزاد شد",sure:"از سالون بیرون می‌شی؟"},
 ps:{keep:"سالون وساته",keepSub:"غږ او مایک روښانه پاتې کېږي او نور اپ ګورې",leave:"سالون پرېږده",leaveSub:"له ځایه پاڅېږې او غږ بندېږي",cancel:"لغوه",back:"سالون ته ستنېدل",mic:"مایک",lost:"ستا ځای په سالون کې خالي شو",sure:"له سالون څخه وځې؟"},
 en:{keep:"Keep the hall",keepSub:"Voice and mic stay on while you browse the app",leave:"Leave hall",leaveSub:"You give up your seat and voice ends",cancel:"Cancel",back:"Back to hall",mic:"Mic",lost:"Your seat in the hall was released",sure:"Leave the hall?"}};
const tx=()=>{const l=document.documentElement.lang||"fa";return l.startsWith("ps")?T.ps:(l==="fa"||l==="fa-IR"||l.startsWith("fa"))?T.fa:T.en};
const HAS={TAB:()=>typeof TAB,CID:()=>typeof CID,CS:()=>typeof CS,CG:()=>typeof CG,CV:()=>typeof CV,VC:()=>typeof VC};
const has=n=>{try{return HAS[n]()!=="undefined"}catch(e){return false}};
const vib=()=>{try{hap()}catch(e){}};
const I={
 hall:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="11" rx="2.5"/><path d="M8 20h8M12 16v4"/><path d="m10.5 8.5 4 2-4 2Z" fill="currentColor"/></svg>',
 mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
 muted:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15 10.5V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 4.6 2.5M5.5 11a6.5 6.5 0 0 0 10.3 5.3M18.5 11a6.4 6.4 0 0 1-.6 2.7M12 17.5V21M4 4l16 16"/></svg>',
 x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 7l10 10M17 7 7 17"/></svg>',
 keep:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v4a2 2 0 0 0 2 2h4M20 10V6a2 2 0 0 0-2-2h-4"/><rect x="12" y="12" width="8" height="8" rx="2"/></svg>',
 leave:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10"/></svg>'};

let MIN=false,KA=null,BUB=null,ROOM=null,MISS=0;
const inHall=()=>has("TAB")&&TAB==="c"&&has("CID")&&!!CID;
const seated=()=>has("CS")&&CS&&CS.mine>=0;

/* run the original navigation, but without dropping voice, the seat, or the cinema password session */
function softGo(k,sub,realGo){
 const code=CID,keepCS=CS,tok=has("CG")?CG.token:null,exp=has("CG")?CG.expires:0;
 const vl=vcLeave,ap=api;
 vcLeave=function(){};
 api=function(p,b){if(typeof p==="string"){if(p.indexOf("/api/cinema/lock/logout")>=0)return Promise.resolve({ok:true});if(b&&b.a==="leave"&&p.indexOf("/api/c")===0)return Promise.resolve({ok:true})}return ap.apply(this,arguments)};
 try{return realGo(k,sub)}finally{
  vcLeave=vl;api=ap;
  if(has("CG")&&tok){CG.token=tok;CG.expires=exp}
  if(!CID){CID=code;CS=keepCS}
  ROOM=code;MIN=true;MISS=0;startKA();bubble();
 }
}
function startKA(){clearInterval(KA);KA=setInterval(async()=>{
 if(!MIN)return clearInterval(KA);
 if(!has("CID")||!CID||CID!==ROOM){return finish(false)}
 try{const j=await api("/api/c/"+ROOM+"?v=0");if(!MIN||CID!==ROOM)return;
  if(j&&j.ok){MISS=0;j._cid=ROOM;CS=j;try{CVER=j.ver}catch(e){}if(j.mine<0){try{toast(tx().lost)}catch(e){}return fullLeave(false)}}
  else if(++MISS>=4)return fullLeave(false);
 }catch(e){if(++MISS>=6)fullLeave(false)}
 paint();
},3000)}
function finish(){MIN=false;clearInterval(KA);KA=null;if(BUB){BUB.remove();BUB=null}}
function fullLeave(tellServer){
 const code=ROOM||(has("CID")?CID:null);finish();
 try{vcLeave()}catch(e){}
 if(code&&tellServer!==false){try{api("/api/c/"+code,{a:"leave"}).catch(()=>{})}catch(e){}}
 try{CID=null;CS=null;CVER=0;CV="hall"}catch(e){}
 try{wmrDockUpdate()}catch(e){}
}
function restore(sub,realGo){
 finish();try{CV="hall";CLOG=true}catch(e){}
 return realGo("c",sub);
}
function bubble(){
 if(BUB)return paint();
 const b=document.createElement("div");b.id="wk51-bub";b.dir="ltr";
 b.innerHTML=`<button type="button" class="wk51-main" aria-label="${tx().back}"><span class="wk51-ring"></span><span class="wk51-ic">${I.hall}</span><span class="wk51-eq"><i></i><i></i><i></i></span><b class="wk51-n"></b></button><button type="button" class="wk51-mic" aria-label="${tx().mic}"></button><button type="button" class="wk51-x" aria-label="${tx().leave}">${I.x}</button>`;
 b.querySelector(".wk51-main").onclick=()=>{vib();go("c")};
 b.querySelector(".wk51-mic").onclick=async e=>{e.stopPropagation();vib();try{await vcMute()}catch(_){}paint()};
 b.querySelector(".wk51-x").onclick=e=>{e.stopPropagation();vib();const doit=ok=>{if(ok)fullLeave(true)};try{tg.showConfirm(tx().sure,doit)}catch(_){doit(confirm(tx().sure))}};
 document.body.appendChild(b);BUB=b;paint();
}
function paint(){
 if(!BUB)return;
 const on=has("VC")&&VC.on&&!VC.mute;const m=BUB.querySelector(".wk51-mic");
 const html=on?I.mic:I.muted;if(m.dataset.s!==String(on)){m.innerHTML=html;m.dataset.s=String(on)}
 m.classList.toggle("on",on);m.disabled=!seated();
 let talk=false;try{const me=ME.me.id;talk=Object.entries(VC.spk||{}).some(([k,v])=>v&&String(k)!==String(me))}catch(e){}
 BUB.classList.toggle("talk",talk);
 let n=0;try{n=(CS.seats||[]).filter(Boolean).length}catch(e){}
 BUB.querySelector(".wk51-n").textContent=n?String(n):"";
}
setInterval(()=>{if(MIN)paint();if(BUB){const sh=document.getElementById("sheet");const hide=!!(sh&&sh.classList.contains("show"));if(BUB.classList.contains("wk51-hide")!==hide)BUB.classList.toggle("wk51-hide",hide)}},400);

/* the exit button in the hall: keep or leave (TopTop) */
window.wk51Exit=function(){
 vib();const t=tx();
 const html=`<section class="wk51-sh"><h3>${t.sure}</h3><button type="button" class="wk51-opt" onclick="wk51Keep()"><span class="wk51-oi">${I.keep}</span><span><b>${t.keep}</b><small>${t.keepSub}</small></span></button><button type="button" class="wk51-opt wk51-red" onclick="wk51Leave()"><span class="wk51-oi">${I.leave}</span><span><b>${t.leave}</b><small>${t.leaveSub}</small></span></button><button type="button" class="wk51-cancel" onclick="closeSheet()">${t.cancel}</button></section>`;
 try{sheet(html)}catch(e){if(confirm(t.sure))wk51Leave()}
};
window.wk51Keep=function(){try{closeSheet()}catch(e){}go("h")};
window.wk51Leave=function(){try{closeSheet()}catch(e){}try{wm78Exit()}catch(e){try{exitRoom()}catch(_){}}};

const realGo=go;
go=function(k,sub){
 if(MIN&&k==="c")return restore(sub,realGo);
 if(!MIN&&inHall()&&k!=="c"&&seated()&&has("CV")&&CV==="hall")return softGo(k,sub,realGo);
 return realGo.apply(this,arguments);
};
/* if something else closes the room (kicked, locked, left elsewhere) remove the bubble */
setInterval(()=>{if(MIN&&(!has("CID")||!CID))finish()},1000);

const st=document.createElement("style");st.textContent=`
#wk51-bub{position:fixed;right:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);z-index:9000;width:66px;height:66px;animation:wk51in .35s cubic-bezier(.2,1.4,.4,1)}
@keyframes wk51in{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}
.wk51-main{position:absolute;inset:0;border-radius:50%;border:0;padding:0;display:grid;place-items:center;color:#fff;background:radial-gradient(circle at 30% 25%,color-mix(in srgb,var(--a1,#10b981) 85%,#fff),var(--a1,#10b981) 45%,color-mix(in srgb,var(--a1,#10b981) 45%,#000));box-shadow:0 10px 26px rgba(0,0,0,.45),inset 0 0 0 2px rgba(255,255,255,.22)}
.wk51-ic svg{width:28px;height:28px;display:block;transition:opacity .2s}
.wk51-ring{position:absolute;inset:-5px;border-radius:50%;border:2px solid var(--a1,#10b981);opacity:0}
#wk51-bub.talk .wk51-ring{animation:wk51p 1.2s ease-out infinite}
@keyframes wk51p{0%{transform:scale(.9);opacity:.85}100%{transform:scale(1.25);opacity:0}}
.wk51-eq{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:none;gap:2px;align-items:flex-end;height:12px}
.wk51-eq i{width:3px;border-radius:2px;background:#fff;animation:wk51e .7s ease-in-out infinite}
.wk51-eq i:nth-child(2){animation-delay:.15s}.wk51-eq i:nth-child(3){animation-delay:.3s}
@keyframes wk51e{0%,100%{height:3px}50%{height:12px}}
#wk51-bub.talk .wk51-eq{display:flex}#wk51-bub.talk .wk51-ic svg{opacity:.35}
.wk51-n{position:absolute;top:-3px;left:-3px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#0b1512;color:#fff;font:800 11px/20px system-ui,-apple-system,sans-serif;box-shadow:0 0 0 2px var(--a1,#10b981)}
.wk51-n:empty{display:none}
.wk51-mic,.wk51-x{position:absolute;width:26px;height:26px;border-radius:50%;border:0;padding:0;display:grid;place-items:center;box-shadow:0 3px 10px rgba(0,0,0,.4)}
.wk51-mic{bottom:-4px;left:-6px;background:#1f2a27;color:#fb7185}.wk51-mic.on{background:#22c55e;color:#fff}.wk51-mic:disabled{opacity:.5}
.wk51-x{top:-6px;right:-6px;background:rgba(15,20,19,.92);color:#fff}
.wk51-mic svg,.wk51-x svg{width:15px;height:15px}
body.wk-typing #wk51-bub,#wk51-bub.wk51-hide,body.dt-open #wk51-bub{display:none}
.wk51-sh{padding:4px 2px 2px}.wk51-sh h3{margin:2px 0 14px;text-align:center;font-size:17px}
.wk51-opt{width:100%;display:flex;align-items:center;gap:12px;padding:13px 14px;margin:0 0 10px;border-radius:18px;border:1px solid var(--ln,rgba(255,255,255,.12));background:var(--card,rgba(255,255,255,.05));color:var(--txt,#fff);text-align:start;font:inherit}
.wk51-opt b{display:block;font-size:15px}.wk51-opt small{display:block;margin-top:2px;font-size:12px;color:var(--mut,#9aa)}
.wk51-oi{flex:0 0 42px;height:42px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--a1,#10b981) 22%,transparent);color:var(--a1,#10b981)}
.wk51-oi svg{width:22px;height:22px}
.wk51-red .wk51-oi{background:rgba(251,113,133,.16);color:#fb7185}.wk51-red b{color:#fb7185}
.wk51-cancel{width:100%;height:46px;border-radius:16px;border:0;background:transparent;color:var(--mut,#9aa);font:700 14px system-ui,-apple-system,sans-serif}
`;document.head.appendChild(st);
})();
