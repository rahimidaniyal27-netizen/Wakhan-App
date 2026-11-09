/* WAKHAN tab bar — fast and smooth like Telegram:
   a floating glass bar, a glass "lens" that glides to the chosen tab,
   the tab changes on finger-down (no click delay), the new page fades in quickly,
   and the lens can be dragged across the tabs. */
(()=>{'use strict';if(window.WKTB)return;
const nav=()=>document.getElementById('nav');
let lastX=null,lastW=null,fromX=null,fromW=null,dragging=false,fired=false,blockUntil=0,blockBtn=null;
const css=`
#nav.tb2{--tb2-h:64px;position:fixed!important;left:12px!important;right:12px!important;width:auto!important;max-width:560px!important;margin:0 auto!important;
 bottom:calc(10px + env(safe-area-inset-bottom,0px))!important;height:var(--tb2-h)!important;padding:5px!important;border-radius:999px!important;
 border:1px solid rgba(255,255,255,.14)!important;background:rgba(22,18,40,.80)!important;
 backdrop-filter:blur(22px) saturate(1.6)!important;-webkit-backdrop-filter:blur(22px) saturate(1.6)!important;
 box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.10)!important;overflow:visible!important;touch-action:none;transform:none!important}
html.wk-light #nav.tb2,body.light #nav.tb2{background:rgba(255,255,255,.72)!important;border-color:rgba(0,0,0,.08)!important}
#nav.tb2>button{position:relative;z-index:2;min-height:0!important;height:100%!important;border-radius:999px!important;background:none!important;
 transition:color .2s,transform .25s cubic-bezier(.3,1.5,.5,1);-webkit-tap-highlight-color:transparent;font-size:10px!important;line-height:1.5!important;padding:0 2px!important}
#nav.tb2>button:active{transform:scale(.92)}
#nav.tb2>button.on{color:var(--a1,#8b5cf6)!important}
#nav.tb2>button>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
#nav.tb2 .wm-i,#nav.tb2 .wm81-icon{width:26px!important;height:26px!important;margin:0 auto 2px!important}
.tb2-lens{position:absolute;z-index:1;top:5px;bottom:5px;left:0;width:60px;border-radius:999px;pointer-events:none;
 background:linear-gradient(180deg,rgba(255,255,255,.20),rgba(255,255,255,.07));
 box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 -1px 0 rgba(255,255,255,.06),0 2px 10px rgba(0,0,0,.18);
 transition:transform .42s cubic-bezier(.25,1.25,.4,1),width .42s cubic-bezier(.25,1.25,.4,1),opacity .2s;will-change:transform}
html.wk-light .tb2-lens,body.light .tb2-lens{background:rgba(0,0,0,.07)}
.tb2-lens.drag{transition:width .2s;transform-origin:center}
.tb2-lens.drag.big{scale:1.08 1.12}
.tb2-lens.pop{animation:tb2-pop .42s cubic-bezier(.25,1.25,.4,1)}
@keyframes tb2-pop{40%{scale:1.10 .92}}
body.tb2-on .fade{animation:tb2-in .16s ease-out!important}
@keyframes tb2-in{from{opacity:0;transform:translateY(4px)}}
body.tb2-on{--wm72-nav:70px}
@media (prefers-reduced-motion:reduce){.tb2-lens{transition:none}body.tb2-on .fade{animation:none!important}}`;
try{const st=document.createElement('style');st.id='tb2-css';st.textContent=css;document.head.appendChild(st)}catch(e){}

function lens(n){let l=n.querySelector(':scope>.tb2-lens');if(!l){l=document.createElement('i');l.className='tb2-lens';n.prepend(l)}return l}
function place(n,btn,anim){const l=lens(n);if(!btn){l.style.opacity='0';return}
 const nr=n.getBoundingClientRect(),br=btn.getBoundingClientRect(),x=br.left-nr.left,w=br.width;
 if(!anim||lastX===null){l.style.transition='none';l.style.transform=`translateX(${x}px)`;l.style.width=w+'px';void l.offsetWidth;l.style.transition=''}
 else{if(l.style.transform==='')l.style.transform=`translateX(${lastX}px)`;l.style.transform=`translateX(${x}px)`;l.style.width=w+'px'}
 l.style.opacity='1';lastX=x;lastW=w}
/* renderNav() rebuilds the bar each time — keep the lens where it was, then glide it */
function dress(){const n=nav();if(!n)return;if(!n.classList.contains('tb2')){n.classList.add('tb2');document.body.classList.add('tb2-on')}
 const l=lens(n);if(!l.dataset.k){const sx=fromX!==null?fromX:lastX,sw=fromX!==null?fromW:lastW;l.dataset.k='1';
  if(sx!==null){l.style.transition='none';l.style.transform=`translateX(${sx}px)`;l.style.width=(sw||60)+'px';void l.offsetWidth;l.style.transition='';lastX=sx;lastW=sw}
  if(fromX!==null){fromX=null;l.classList.add('pop')}}
 if(!dragging)requestAnimationFrame(()=>place(n,n.querySelector(':scope>button.on'),true))}
function btnAt(n,x){for(const b of n.querySelectorAll(':scope>button')){const r=b.getBoundingClientRect();if(x>=r.left&&x<=r.right)return b}return null}
function choose(b){if(!b||b.classList.contains('on'))return;fired=true;blockBtn=b;blockUntil=Date.now()+700;try{b.click()}finally{fired=false}}

let downX=0,downB=null,moved=false;
document.addEventListener('pointerdown',e=>{const n=nav();if(!n||!n.contains(e.target))return;const b=e.target.closest('#nav>button');if(!b)return;
 downX=e.clientX;downB=b;moved=false;dragging=false;
 if(!b.classList.contains('on')){fromX=lastX;fromW=lastW;setTimeout(()=>{fromX=null},150)}place(n,b,true);const l=lens(n);l.classList.remove('pop');void l.offsetWidth;l.classList.add('pop');
 choose(b)},true);                                   // switch at once on finger-down, like Telegram
document.addEventListener('pointermove',e=>{const n=nav();if(!downB||!n)return;if(!moved&&Math.abs(e.clientX-downX)<8)return;
 moved=true;dragging=true;const l=lens(n);l.classList.add('drag','big');const nr=n.getBoundingClientRect(),w=lastW||60;
 const x=Math.max(5,Math.min(nr.width-w-5,e.clientX-nr.left-w/2));l.style.transform=`translateX(${x}px)`;lastX=x},true);
function up(e){const n=nav();if(!downB||!n){downB=null;return}const l=lens(n);l.classList.remove('drag','big');
 if(moved){dragging=false;const b=btnAt(n,e.clientX);if(b&&!b.classList.contains('on'))choose(b);place(n,n.querySelector(':scope>button.on')||b,true)}
 dragging=false;downB=null}
document.addEventListener('pointerup',up,true);document.addEventListener('pointercancel',up,true);
/* the real click that follows the finger-down must not switch twice */
document.addEventListener('click',e=>{if(fired)return;const b=e.target.closest&&e.target.closest('#nav>button');if(!b)return;
 if(Date.now()<blockUntil||moved){e.stopImmediatePropagation();e.preventDefault()}},true);

try{new MutationObserver(ms=>{const n=nav();if(!n)return;if(!n.classList.contains('tb2')||ms.some(m=>m.target===n))dress()}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){setInterval(dress,500)}
addEventListener('resize',()=>{const n=nav();if(n)place(n,n.querySelector(':scope>button.on'),false)});
dress();window.WKTB={dress};
})();
