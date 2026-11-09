/* WAKHAN M47: no top brand bar (pages start at the top), sub-tabs back in the page, nothing floats over the keyboard */
(()=>{"use strict";
const st=document.createElement("style");st.id="fix47";st.textContent=`
body:not(.wk47-home) header.wk47-brandbar{display:none!important}
header.wk47-brandbar .lgp,header.wk47-brandbar #wn61-theme-button,header.wk47-brandbar .wn61-theme-button{display:none!important}
.wk47-coin{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 14px 0 6px;border-radius:19px;border:1px solid rgba(245,196,81,.45);background:linear-gradient(135deg,rgba(245,196,81,.18),rgba(201,138,12,.1));color:var(--txt);font:800 14px system-ui,-apple-system,sans-serif;direction:ltr}
.wk47-coin i{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#fff3b0,#f5c451 45%,#b7790a);color:#5a3700;font:900 13px/1 system-ui;font-style:normal;box-shadow:inset 0 -2px 0 rgba(0,0,0,.2)}
#wm-intro-v2.wk47-force{display:grid!important;animation:wm-intro-exit-v2 .28s ease 1.55s both!important}
#wm-intro-v2.wk47-force .wm-intro-mark{animation:wm-intro-mark-v2 .5s cubic-bezier(.2,.8,.2,1) both!important}
#wm-intro-v2.wk47-force .wm-intro-name{animation:wm-intro-open-v2 .55s cubic-bezier(.2,.8,.2,1) .5s both!important}
#wk47-old{direction:ltr;position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;gap:12px;background:#0047ff;color:#fff;font-family:Arial,Helvetica,sans-serif;animation:wk47out .35s ease 1.7s both;pointer-events:none}
#wk47-intro img{width:92px;height:92px;animation:wk47pop .55s cubic-bezier(.2,.8,.2,1) both}
#wk47-intro div{overflow:hidden;width:0;animation:wk47open .55s cubic-bezier(.2,.8,.2,1) .45s both;white-space:nowrap}
#wk47-intro b{display:block;font-size:42px;font-weight:900;letter-spacing:2px;line-height:1}#wk47-intro small{display:block;font-size:15px;letter-spacing:7px;margin-top:4px}
@keyframes wk47pop{from{transform:scale(.3) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}@keyframes wk47open{to{width:210px}}@keyframes wk47out{to{opacity:0;visibility:hidden}}
body.wk47-nohead:not(.wk47-home) #view{padding-top:calc(env(safe-area-inset-top) + 10px)!important;margin-top:0!important}
#view nav.wm76-music-tabs,#view nav.wm75-tabs,#view nav.wm72-music-tabs,#view .wm76-music-tabs,#view .wm75-tabs{position:static!important;transform:none!important;left:auto!important;right:auto!important;bottom:auto!important;top:auto!important;width:auto!important;max-width:none!important;z-index:auto!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
#view nav.wm76-music-tabs{display:flex!important;background:none!important;border-radius:0!important;padding:0!important;margin:0 0 18px!important;height:auto!important}
#view nav.wm75-tabs{display:grid!important;margin:0 0 16px!important;height:auto!important}
body.wk-typing #nav,body.wk-typing #mini,body.wk-typing .wm75-tabs{display:none!important}
`;document.head.appendChild(st);
const INTRO="<div class=\"wm-intro-lockup\"><svg class=\"wm-intro-mark\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"20 25 87 80\" width=\"96\" height=\"96\" focusable=\"false\"><path fill=\"#fff\" d=\"M26.8 41.1 45.4 34.3C38.8 44.2 38.0 59.9 46.3 73.4L64 43.9 80.8 73.4C88.1 59.7 90.0 44.2 82.3 34.3L100.5 41.1C101 62.0 91.4 82.9 77.1 95.1L63.7 65.3 49.4 95.1C34.6 82.2 25.9 61.8 26.8 41.1Z\"/></svg><div class=\"wm-intro-name\"><div class=\"wm-intro-words\"><span class=\"wm-intro-akhan\"><span>A</span><span>K</span><span>H</span><span>A</span><span>N</span></span><span class=\"wm-intro-music\"><span>M</span><span>U</span><span>S</span><span>I</span><span>C</span></span></div></div></div>";
(()=>{let o=document.getElementById("wm-intro-v2");if(!o){o=document.createElement("div");o.id="wm-intro-v2";o.setAttribute("aria-hidden","true");o.innerHTML=INTRO;(document.body||document.documentElement).appendChild(o)}
 o.classList.add("wk47-force");setTimeout(()=>{o.style.display="none"},2100)})();
function coin(h){let c=h.querySelector(".wk47-coin");if(!c){c=document.createElement("button");c.type="button";c.className="wk47-coin";c.onclick=()=>{try{wc23Open()}catch(e){}};h.appendChild(c);try{if(typeof wc23Refresh==="function")wc23Refresh(false)}catch(e){}}
 let b="…";try{if(typeof WC23!=="undefined"&&WC23.data&&WC23.data.balance!=null)b=Number(WC23.data.balance).toLocaleString("en-US",{maximumFractionDigits:2})}catch(e){}const html=`<i>W</i><span>${b}</span>`;if(c.innerHTML!==html)c.innerHTML=html}
setInterval(()=>{const home=typeof TAB!=="undefined"&&TAB==="h";document.body&&document.body.classList.toggle("wk47-home",home);const h=document.querySelector("header.wk47-brandbar");if(h&&home)coin(h)},500);
function homeCls(){try{const home=typeof TAB!=="undefined"&&TAB==="h";if(document.body&&document.body.classList.contains("wk47-home")!==home)document.body.classList.toggle("wk47-home",home)}catch(e){}}
function brand(){homeCls();const b=document.getElementById("wm-music-brand-v1");const h=b&&b.closest("header");if(h&&!h.classList.contains("wk47-brandbar")){h.classList.add("wk47-brandbar");document.body.classList.add("wk47-nohead")}}
const typing=on=>document.body&&document.body.classList.toggle("wk-typing",on);
document.addEventListener("focusin",e=>{const t=e.target;if(t.matches&&t.matches("input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,[contenteditable]"))typing(true)});
document.addEventListener("focusout",()=>setTimeout(()=>{const a=document.activeElement;typing(!!(a&&a.matches&&a.matches("input,textarea,[contenteditable]")))},120));
new MutationObserver(brand).observe(document.documentElement,{childList:true,subtree:true});brand();
})();

/* M79: the bottom bar is redrawn by several parts of the app every few seconds even when nothing
   changed; that swapped the icons and made them blink. Same content -> nothing is touched. */
(function navGuard(){const nav=document.getElementById("nav");if(!nav)return setTimeout(navGuard,300);if(nav.__wkGuard)return;nav.__wkGuard=1;
 const d=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");
 Object.defineProperty(nav,"innerHTML",{configurable:true,get(){return d.get.call(this)},set(v){v=String(v);if(v===this.__wkRaw&&this.children.length)return;this.__wkRaw=v;d.set.call(this,v)}})})();
