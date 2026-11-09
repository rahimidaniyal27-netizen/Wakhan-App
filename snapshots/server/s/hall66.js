/* WAKHAN M66: the hall laid out like a TopTop voice room — everything transparent over the background.
   Top bar (back · cover/name/ID · people · ⋯), seats 2 + 4 + 4, people count, chat floating on the picture,
   and a slim bottom bar (speaker · mic · emoji · "say something…" · ⋯ · gift · chats). The text box only
   appears while typing. Changing seat is one tap; the seat menu is only for entering / long-press (owner). */
(function(){
"use strict";
if(window.__wk66)return;window.__wk66=1;
const T={fa:{say:"یک چیزی بگو…",gift:"تحفه برای کی؟",noOne:"کسی روی جایگاه نیست",id:"آیدی",msgs:"پیام‌ها",noMsgs:"هنوز پیامی نداری",you:"تو: "},en:{say:"Say something…",gift:"Gift for whom?",noOne:"Nobody is seated",id:"ID",msgs:"Messages",noMsgs:"No messages yet",you:"You: "}};T.ps=T.fa;
const tx=()=>{const l=document.documentElement.lang||"fa";return l.startsWith("ps")?T.ps:l.startsWith("fa")?T.fa:T.en};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const vib=()=>{try{hap()}catch(e){}};
const svg=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I={back:svg('<path d="m15 5-7 7 7 7"/>'),more:svg('<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>'),
 menu:svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),gift:svg('<rect x="3.5" y="9" width="17" height="11.5" rx="2"/><path d="M12 9v11.5M3.5 13h17M12 9S10.5 4 8 4.5 7 9 12 9Zm0 0s1.5-5 4-4.5S17 9 12 9Z"/>'),
 chat:svg('<path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.3A7.5 7.5 0 1 1 20 11.5Z"/>'),emoji:svg('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5s1.3 1.8 3.5 1.8 3.5-1.8 3.5-1.8M9 9.8h.01M15 9.8h.01"/>'),
 user:svg('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>')};
const info=()=>{try{const c=CID;return (window.wk52InfoCache&&wk52InfoCache[c])||null}catch(e){return null}};

/* hall identity for the top bar (shares social52's cache through its API) */
let HI=null,HIc="",HIt=0;
async function hall(){const c=(typeof CID!=="undefined"&&CID)||"";if(!c)return null;if(HI&&HIc===c&&Date.now()-HIt<20000)return HI;HIc=c;HIt=Date.now();
 try{if(window.wk52Info){HI=await wk52Info(c,false)}else{const j=await api("/api/v51/hall?code="+c);HI=j&&j.ok?j.hall:null}}catch(e){}return HI}

function seated(){try{return (CS&&CS.seats||[]).filter(Boolean)}catch(e){return []}}
function av(p){try{return wm70Avatar(p)}catch(e){return `<b>${esc((p.name||"?").charAt(0))}</b>`}}

function build(){
 const r=document.getElementById("wm78-room");if(!r)return;const t=tx();
 /* seats are updated one by one instead of rebuilding all ten (no flashing, pictures are not reloaded) */
 const hallEl=document.getElementById("hall");if(hallEl&&!hallEl.__wkm){hallEl.__wkm=1;const d=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");
  Object.defineProperty(hallEl,"innerHTML",{configurable:true,get(){return d.get.call(this)},set(v){try{const tp=document.createElement("template");d.set.call(tp,v);const nw=[...tp.content.children],old=[...this.children];
   if(nw.length!==old.length||!old.length){d.set.call(this,v);[...this.children].forEach((c,k)=>{c.__src=nw[k]?nw[k].outerHTML:""});return}
   const nz=x=>(x||"").replace(/ disabled(="[^"]*")?/g,"");nw.forEach((n,k)=>{const src=n.outerHTML,ok=old[k];if(ok.__src===src)return;if(nz(ok.__src)===nz(src)){ok.disabled=n.disabled;ok.__src=src;return}n.__src=src;ok.replaceWith(n)})}catch(e){d.set.call(this,v)}}})}
 if(!r.__wk66){r.__wk66=1;const cl=r.classList,ot=cl.toggle.bind(cl),oa=cl.add.bind(cl);cl.toggle=function(n,f){return ot(n==="is-writing"?"wk-kb":n,f)};cl.add=function(...n){return oa(...n.map(x=>x==="is-writing"?"wk-kb":x))};cl.remove("is-writing");
  const full=Math.max(window.innerHeight,Number(window.Telegram&&Telegram.WebApp&&Telegram.WebApp.viewportStableHeight)||0);document.body.style.setProperty("--wk66-full",full+"px")}
 /* top bar */
 let top=r.querySelector(":scope>.wk66-top");
 if(!top){top=document.createElement("div");top.className="wk66-top";top.innerHTML=`<button type="button" class="wk66-back" aria-label="back">${I.back}</button><button type="button" class="wk66-id"><span class="wk66-cov"></span><span class="wk66-nm"><b dir="auto"></b><small></small></span></button><span class="wk66-sp"></span><span class="wk66-ppl"></span><button type="button" class="wk66-more" aria-label="more">${I.more}</button>`;
  top.querySelector(".wk66-back").onclick=()=>{vib();try{(window.wk51Exit||wi11Exit)()}catch(e){}};
  top.querySelector(".wk66-more").onclick=()=>{try{wk47Folder()}catch(e){}};
  top.querySelector(".wk66-id").onclick=()=>{try{if(HI&&HI.is_owner&&window.wk64Settings)wk64Settings();else if(window.wk52HallEdit)wk52HallEdit()}catch(e){}};
  r.prepend(top)}
 const h=HI&&HIc===CID?HI:null,code=(typeof CID!=="undefined"&&CID)||"";
 const cov=h&&h.photo?`<img src="${esc(h.photo)}" alt="">`:`<i>${esc(((h&&h.name)||"W").charAt(0))}</i>`;
 const covEl=top.querySelector(".wk66-cov");if(covEl.dataset.h!==cov){covEl.innerHTML=cov;covEl.dataset.h=cov}
 const nm=top.querySelector(".wk66-nm b"),id=top.querySelector(".wk66-nm small");const name=(h&&h.name)||"";if(nm.textContent!==name)nm.textContent=name;const own=(h&&(h.owner_name||((typeof CS!=="undefined"&&CS&&CS.seats||[]).find(x=>x&&Number(x.id)===Number(h.owner_id))||{}).name))||"";const idh=own?`${(typeof wi11==="function"?wi11("crown"):"")}<span dir="auto">${esc(own)}</span>`:esc(t.id+": "+code);if(id.dataset.h!==idh){id.innerHTML=idh;id.dataset.h=idh}
 const ss=seated(),ppl=ss.slice(0,3).map(p=>`<span>${av(p)}</span>`).join("")+`<em>${ss.length}</em>`,pe=top.querySelector(".wk66-ppl");if(pe.dataset.h!==ppl){pe.innerHTML=ppl;pe.dataset.h=ppl}
 /* people count row under the seats */
 const sb=r.querySelector(".wm78-seats-block");
 if(sb){let c=sb.querySelector(".wk66-count");if(!c){c=document.createElement("div");c.className="wk66-count";sb.appendChild(c)}const ct=`${I.user}<span>${ss.length}</span>`;if(c.dataset.h!==ct){c.innerHTML=ct;c.dataset.h=ct}}
 /* bottom bar */
 const foot=document.getElementById("wm78-footer");
 if(foot){let bar=foot.querySelector(".wk66-bar");
  if(!bar){bar=document.createElement("div");bar.className="wk66-bar";bar.innerHTML=`<span class="wk66-l"></span><button type="button" class="wk66-emo" aria-label="emoji">${I.emoji}</button><button type="button" class="wk66-say">${esc(t.say)}</button><button type="button" class="wk66-menu" aria-label="menu">${I.menu}</button><button type="button" class="wk66-gift" aria-label="gift">${I.gift}</button><button type="button" class="wk66-chat" aria-label="chats">${I.chat}<i class="wk66-dot"></i></button>`;
   bar.querySelector(".wk66-emo").onclick=()=>{try{wk64Emoji()}catch(e){}};
   bar.querySelector(".wk66-say").onclick=()=>openType();
   bar.querySelector(".wk66-menu").onclick=()=>{try{wk47Folder()}catch(e){}};
   bar.querySelector(".wk66-gift").onclick=giftPick;
   bar.querySelector(".wk66-chat").onclick=msgs;
   foot.prepend(bar)}
  const l=bar.querySelector(".wk66-l");for(const idn of ["wm78-speaker","wm78-mic"]){const b=document.getElementById(idn);if(b&&b.parentElement!==l)l.appendChild(b)}
  try{if(!r.classList.contains("wk-kb")&&!r.classList.contains("wk66-typing")){const sbx=r.querySelector(".wm78-seats-block"),nm=r.querySelector("#wm78-no-media");let topY=0;for(const el of [sbx,nm])if(el&&el.offsetParent){const b=el.getBoundingClientRect();if(b.height)topY=Math.max(topY,b.bottom)}
   const fy=foot.getBoundingClientRect().top;const tv=Math.round(topY+4)+"px",bv=Math.max(0,Math.round(window.innerHeight-fy+2))+"px";if(r.style.getPropertyValue("--wk66-ct")!==tv)r.style.setProperty("--wk66-ct",tv);if(r.style.getPropertyValue("--wk66-cb")!==bv)r.style.setProperty("--wk66-cb",bv)}}catch(e){}
  let unread=0;try{unread=Number(WM70.unread||0)||(WM70.friends&&WM70.friends.incoming||[]).length}catch(e){}bar.querySelector(".wk66-dot").hidden=!unread}
}
function openType(){vib();const r=document.getElementById("wm78-room");if(!r)return;r.classList.add("wk66-typing");const i=document.getElementById("wm70-room-text");if(i){i.focus();setTimeout(()=>{try{i.focus()}catch(e){}},60)}}
document.addEventListener("focusout",e=>{if(e.target&&e.target.id==="wm70-room-text")setTimeout(()=>{const i=document.getElementById("wm70-room-text"),r=document.getElementById("wm78-room");if(r&&i&&document.activeElement!==i&&!i.value.trim())r.classList.remove("wk66-typing")},180)});
document.addEventListener("focusin",e=>{if(e.target&&e.target.id==="wm70-room-text"){const r=document.getElementById("wm78-room");if(r)r.classList.add("wk66-typing")}});
function giftPick(){vib();const t=tx(),me=(typeof ME!=="undefined"&&ME.me&&String(ME.me.id))||"";const ps=seated().filter(p=>String(p.id)!==me);
 try{sheet(`<section class="wk64-sh"><h3>${esc(t.gift)}</h3>${ps.length?`<div class="wk66-gl">${ps.map(p=>`<button type="button" onclick="closeSheet();setTimeout(()=>wm70GiftPicker(${Number(p.id)}),180)"><span>${av(p)}</span><b dir="auto">${esc(p.name)}</b></button>`).join("")}</div>`:`<p class="wk64-muted" style="text-align:center">${esc(t.noOne)}</p>`}</section>`)}catch(e){}}

async function msgs(){vib();const t=tx();let list=[];try{const v=await wm70Request("inbox");list=(v&&v.inbox)||v||[];if(Array.isArray(list))WM70.inbox=list;else list=WM70.inbox||[]}catch(e){try{list=WM70.inbox||[]}catch(_){}}
 const me=(typeof ME!=="undefined"&&ME.me&&String(ME.me.id))||"";
 try{sheet(`<section class="wk66-msgs"><h3>${esc(t.msgs)}</h3>${list.length?list.slice(0,40).map(p=>`<button type="button" onclick="wm70OpenDM(${Number(p.id)})"><span class="wk66-mav">${av(p)}</span><span class="wk66-mt"><b dir="auto">${esc(p.name)}</b><small dir="auto">${esc(((String(p.sender)===me?t.you:"")+(p.last||"")).slice(0,70))}</small></span>${p.unread?`<i>${Number(p.unread)>99?"99+":Number(p.unread)}</i>`:""}</button>`).join(""):`<p class="wk64-muted" style="text-align:center;padding:24px 0">${esc(t.noMsgs)}</p>`}</section>`)}catch(e){}}
/* while typing: everything stays where it is, the room dims, chat rises above the text box (TopTop) */
document.addEventListener("pointerdown",e=>{const r=document.getElementById("wm78-room");if(!r||!r.classList.contains("wk66-typing"))return;if(e.target.closest&&e.target.closest("#wm78-footer,#sheet,.wm78-messages"))return;const i=document.getElementById("wm70-room-text");if(i){i.blur()}r.classList.remove("wk66-typing")},true);

/* iPhone keyboard: the seats must never move. Two cases:
   (a) Telegram shrinks the whole page -> the room shrinks with it, chat gets smaller, seats stay on top;
   (b) only the visible area shrinks (iOS slides the page up) -> slide the room back down by the same amount. */
(function(){const vv=window.visualViewport;if(!vv)return;let raf=0;
 const scrollers=()=>[document.scrollingElement,document.documentElement,document.body,document.getElementById("view")].filter(Boolean);
 function fix(){raf=0;const r=document.getElementById("wm78-room");if(!r)return;const typing=r.classList.contains("wk66-typing")||r.classList.contains("wk-kb");
  if(!typing){if(r.style.transform)r.style.transform="";r.style.removeProperty("--wk66-fb");r.style.removeProperty("--wk66-h");return}
  for(const el of scrollers())if(el.scrollTop)el.scrollTop=0;if(window.scrollY)window.scrollTo(0,0);
  const full=parseFloat(getComputedStyle(document.body).getPropertyValue("--wk66-full"))||window.innerHeight;const ih=window.innerHeight;
  let h,off,fb;
  if(ih<full-80){const top0=Math.max(0,r.getBoundingClientRect().top-(parseFloat((r.style.transform.match(/-?\d+(\.\d+)?/)||[0])[0])||0));h=Math.round(ih-top0);off=0;fb=Math.max(0,Math.round(ih-vv.height-(vv.offsetTop||0)))}
  else{const kb=vv.height<ih-80;h=full;off=kb?Math.max(0,Math.round(vv.offsetTop||0)):0;fb=kb?Math.max(0,Math.round(full-vv.height)):0}
  const tr=off?`translateY(${off}px)`:"";if(r.style.transform!==tr)r.style.transform=tr;
  if(r.style.getPropertyValue("--wk66-h")!==h+"px")r.style.setProperty("--wk66-h",h+"px");if(r.style.getPropertyValue("--wk66-fb")!==fb+"px")r.style.setProperty("--wk66-fb",fb+"px")}
 vv.addEventListener("resize",fix);vv.addEventListener("scroll",fix);window.addEventListener("scroll",fix,{passive:true});window.addEventListener("resize",fix);
 document.addEventListener("scroll",fix,{capture:true,passive:true});
 document.addEventListener("focusin",()=>{fix();for(const t of [60,150,300,500,800])setTimeout(fix,t)});
 document.addEventListener("focusout",()=>{for(const t of [50,200,400,800])setTimeout(fix,t)});
})();
let q=0;const run=()=>{q=0;try{build()}catch(e){}};
new MutationObserver(()=>{if(!q&&document.getElementById("wm78-room")){q=1;Promise.resolve().then(run)}}).observe(document.getElementById("view")||document.body,{childList:true,subtree:true});
setInterval(async()=>{if(document.getElementById("wm78-room")){await hall();run()}},1500);

/* one tap = move seat (no long-press menu any more); taps are ignored while a move is still finishing */
(function(){let busyUntil=0;
 document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#hall>.wm78-seat.is-empty");if(!b)return;let mine=-1;try{mine=CS.mine}catch(_){}
  if(mine<0||b.classList.contains("wk-locked"))return;
  e.stopImmediatePropagation();e.preventDefault();
  const now=Date.now();if(now<busyUntil)return;busyUntil=now+900;
  const i=[...b.parentElement.children].indexOf(b);vib();try{wm78Seat(i)}catch(_){try{cinSit(i)}catch(__){}}},true);
})();
const st=document.createElement("style");st.textContent=`
/* layout */
#view #wm78-room{padding-top:0!important}
#view #wm78-room .wm78-section-title{display:none!important}
.wk66-top{display:flex;align-items:center;gap:8px;padding:6px 0 10px;direction:ltr;flex:none;position:relative;z-index:5}
body #view .wk66-top button{border:0!important;background:none!important;padding:0!important;min-height:0!important;color:#fff!important;box-shadow:none!important}
.wk66-back svg,.wk66-more svg{width:24px;height:24px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
body #view .wk66-id{display:flex!important;align-items:center;gap:8px;min-width:0;max-width:56%;text-align:left}
.wk66-cov{flex:0 0 36px;width:36px;height:36px;border-radius:9px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,var(--a1,#10b981),color-mix(in srgb,var(--a1,#10b981) 45%,#000))}
.wk66-cov img{width:100%;height:100%;object-fit:cover}.wk66-cov i{font:800 16px system-ui;color:#fff;font-style:normal}
.wk66-nm{min-width:0}.wk66-nm b{display:block;font-size:14px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 3px rgba(0,0,0,.7)}
.wk66-nm small{display:flex;align-items:center;gap:4px;min-width:0;font-size:11px;font-weight:700;color:rgba(255,255,255,.82);text-shadow:0 1px 2px rgba(0,0,0,.7)}.wk66-nm small svg{flex:none;width:13px!important;height:13px!important;color:#f5c451}.wk66-nm small span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wk66-sp{flex:1}
.wk66-ppl{display:flex;align-items:center}.wk66-ppl>span{width:26px;height:26px;border-radius:50%;overflow:hidden;margin-left:-8px;box-shadow:0 0 0 1.5px rgba(0,0,0,.35);display:block}.wk66-ppl>span>*{width:100%!important;height:100%!important}
.wk66-ppl em{font-style:normal;font:700 11px system-ui;color:#fff;margin-left:5px;padding:2px 7px;border-radius:10px;background:rgba(0,0,0,.3)}
/* seats: 2 on top, then 4 + 4, all glass */
body #view #wm78-room #hall{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:16px 18px!important;direction:ltr!important;zoom:1!important;padding:6px 14px 0!important}
body #view #wm78-room #hall>.wm78-seat:nth-child(1){grid-column:2}
body #view #wm78-room #hall>.wm78-seat:nth-child(2){grid-column:3}
body #view #wm78-room #hall>.wm78-seat:nth-child(3){grid-column:1}
body #view #wm78-room:not(.is-writing) .wm78-chat{top:var(--wk66-ct,auto)!important;bottom:var(--wk66-cb,112px)!important;height:auto!important}
body #view .wk66-l>button>span,body #view .wk66-l>button>b{display:none!important}
body #view .wk66-l>button{font-size:0!important}
.wk66-ppl>span{font-size:10px!important}.wk66-ppl>span *{font-size:10px!important}
body #view #wm78-room #hall>.wm78-seat{min-height:0!important;padding:6px 0 4px!important;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
body #view #wm78-room #hall .wm78-seat-face{max-width:62px!important}
body #view #wm78-room #hall .wm78-seat.is-empty .wm78-seat-face{max-width:50px!important;width:78%!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.14)!important}
body #view #wm78-room.wk-idle #hall .wm78-seat-face{max-width:70px!important}
body #view #wm78-room.wk-idle #hall .wm78-seat.is-empty .wm78-seat-face{max-width:58px!important}
body #view #wm78-room #hall .wm78-seat>b{font-size:11px!important;color:#fff!important}
body #view #wm78-room #hall .wm78-seat.is-empty>b{font-size:10px!important;color:rgba(255,255,255,.55)!important;font-weight:500!important}
body #view #wm78-room.is-writing #hall{grid-template-columns:repeat(10,minmax(0,1fr))!important;gap:0!important}
body #view #wm78-room.is-writing #hall>.wm78-seat:nth-child(-n+3){grid-column:auto}
.wk66-count{display:flex;justify-content:flex-end;align-items:center;gap:4px;padding:2px 8px 0;color:rgba(255,255,255,.8);font:600 11.5px system-ui;direction:ltr;text-shadow:0 1px 2px rgba(0,0,0,.7)}.wk66-count svg{width:13px;height:13px}
body #view #wm78-room.wk-idle #wm78-no-media{margin:6px 0 0!important}
/* chat: TopTop rows */
body #view #wm78-room .wm78-message-avatar img{width:24px!important;height:24px!important}
body #view #wm78-room .wm78-message{gap:6px!important}
body #view #wm78-room .wm78-message .wm78-message-name{font-size:12px!important;color:rgba(255,255,255,.92)!important}
body #view #wm78-room .wk64-notice{background:transparent!important;border:0!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;padding:2px 0!important;flex-wrap:wrap}
body #view #wm78-room .wk64-notice .wk64-ni{color:#fff!important}
body #view #wm78-room .wk64-notice p{text-shadow:0 1px 3px rgba(0,0,0,.9);font-weight:600}
body #view #wm78-room .wk64-notice button{order:3;flex:0 0 auto!important;width:auto!important;height:24px!important;padding:0 12px!important;margin-left:30px;border-radius:12px!important;background:#fff!important;color:#111!important;font:700 11.5px system-ui!important}
body #view #wm78-room .wk64-notice button svg{display:none}
body #view #wm78-room .wk64-notice button:after{content:"ویرایش"}
html[lang^=en] body #view #wm78-room .wk64-notice button:after{content:"Edit"}
/* bottom bar */
body #view #wm78-room .wm78-voice-controls{display:none!important}
body #view #wm78-room:not(.wk66-typing) #wm70-live-compose{position:absolute!important;left:-9999px!important;opacity:0!important;pointer-events:none}
body #view #wm78-room.wk66-typing .wk66-bar{display:none!important}
body #view #wm78-room .wm78-footer{background:none!important}
.wk66-bar{display:flex;align-items:center;gap:4px;height:46px;direction:ltr}
.wk66-l{display:flex;gap:2px}
body #view .wk66-bar button,body #view .wk66-l>button{flex:0 0 40px;width:40px!important;height:40px!important;min-width:0!important;max-width:none!important;padding:0!important;margin:0!important;border:0!important;border-radius:50%!important;background:none!important;color:#fff!important;display:grid!important;place-items:center!important;box-shadow:none!important;backdrop-filter:none!important;position:relative}
body #view .wk66-bar svg,body #view .wk66-l>button svg{width:23px!important;height:23px!important;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
body #view #wm78-room .wk66-l>#wm78-mic.is-live{background:none!important;color:#4ade80!important}
body #view #wm78-room .wk66-l>#wm78-mic:not(.is-live){color:#fff!important;opacity:.9}
body #view .wk66-bar .wk66-say{flex:1 1 auto;width:auto!important;border-radius:0!important;justify-content:start;display:flex!important;align-items:center;color:rgba(255,255,255,.65)!important;font:500 14px system-ui!important;text-align:left;padding:0 6px!important;white-space:nowrap;overflow:hidden;min-width:0}
.wk66-dot{position:absolute;top:7px;right:7px;width:8px;height:8px;border-radius:50%;background:#ef4444}
.wk66-gl{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
#sheet .wk66-gl button{display:flex;flex-direction:column;align-items:center;gap:6px;border:0;background:none;color:var(--txt);font:600 12px system-ui;padding:0}
.wk66-gl span{width:54px;height:54px;border-radius:50%;overflow:hidden;display:block}.wk66-gl span>*{width:100%!important;height:100%!important}
/* everything see-through on the background */
body #view #wm78-room .wm78-chat,body #view #wm78-room .wm78-seats-block{background:none!important;border:0!important}

/* typing like TopTop */
body #view #wm78-room.wk-kb,body #view #wm78-room.wk66-typing{height:var(--wk66-h,var(--wk66-full,100dvh))!important}
body #view #wm78-room.wk66-typing:after{content:"";position:fixed;inset:0;background:rgba(0,0,0,.25);z-index:39;pointer-events:none}
body #view #wm78-room.wk66-typing .wm78-chat{z-index:41!important}
body #view #wm78-room.wk66-typing .wm78-messages>*{opacity:1!important}
body #view #wm78-room.wk66-typing .wm78-footer{z-index:43!important;background:rgba(14,14,20,.96)!important;border-top:0!important;padding:8px 12px calc(8px + env(safe-area-inset-bottom))!important}
body #view #wm78-room.wk-kb .wm78-footer{padding-bottom:8px!important}
body #view #wm78-room.wk66-typing #wm70-live-compose{background:rgba(255,255,255,.1)!important;border:0!important;border-radius:22px!important;height:44px!important;padding:0 4px 0 14px!important;display:flex!important;align-items:center}
body #view #wm78-room #wm70-live-compose .wk64-emo{display:none!important}
body #view #wm78-room.wk66-typing #wm78-send{width:36px!important;height:36px!important;border-radius:50%!important;background:#2dd4bf!important;color:#0b1512!important}
body #view #wm78-room.wk-kb .wm78-seats-block,body #view #wm78-room.wk-kb #wmc-stage,body #view #wm78-room.wk-kb #wm78-no-media{display:revert}
.wk66-msgs h3{margin:2px 0 12px;text-align:center;font-size:17px}
#sheet .wk66-msgs button{width:100%;display:flex;align-items:center;gap:12px;padding:10px 4px;border:0;border-bottom:1px solid var(--ln,rgba(255,255,255,.06));background:none;color:var(--txt);text-align:start;font:inherit}
.wk66-mav{flex:0 0 46px;width:46px;height:46px;border-radius:50%;overflow:hidden;display:block}.wk66-mav>*{width:100%!important;height:100%!important}
.wk66-mt{flex:1;min-width:0}.wk66-mt b{display:block;font-size:15px}.wk66-mt small{display:block;margin-top:2px;color:var(--mut);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wk66-msgs i{font-style:normal;min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:#ef4444;color:#fff;font:700 11px/20px system-ui;text-align:center}

body #view #wm78-room.wk66-typing .wm78-footer{position:absolute!important;bottom:var(--wk66-fb,var(--wm78-keyboard-inset,0px))!important}
body #view #wm78-room.wk66-typing .wm78-chat{position:absolute!important;top:var(--wk66-ct,58px)!important;bottom:calc(var(--wk66-fb,0px) + 64px)!important;min-height:56px}
body #view #wm78-room.wk66-typing:after{position:absolute!important}
html:has(#wm78-room.wk66-typing),html:has(#wm78-room.wk66-typing) body{overflow:hidden!important;overscroll-behavior:none}
body #view #wm78-room.wk66-typing #wm78-no-media,body #view #wm78-room.wk-kb #wm78-no-media{display:none!important}
/* empty chat space never blocks the seats underneath */
body #view #wm78-room:not(.wk66-typing) .wm78-messages{pointer-events:none!important}
body #view #wm78-room:not(.wk66-typing) .wm78-messages>*{pointer-events:auto}
/* no dimming of the seats while a seat change is being saved */
body #view #wm78-room #hall .wm78-seat:disabled,body #view #wm78-room #hall .wm78-seat[disabled]{opacity:1!important;filter:none!important}
body #view #wm78-room #hall .wm78-seat,body #view #wm78-room #hall .wm78-seat *{animation:none!important;transition:none!important}
body #view #wm78-room #hall .wm78-seat .wm78-seat-face:after{animation:revert!important}
`;document.head.appendChild(st);
})();
