/* WAKHAN coin — a real 3D gold coin with the blue Wakhan W, turning slowly (pure CSS, no images).
   Used for the wallet coin and the coin chip in the header. Respects "reduce motion". */
(()=>{'use strict';if(window.WKCOIN)return;
const W='M26.8 41.1 45.4 34.3C38.8 44.2 38.0 59.9 46.3 73.4L64 43.9 80.8 73.4C88.1 59.7 90.0 44.2 82.3 34.3L100.5 41.1C101 62.0 91.4 82.9 77.1 95.1L63.7 65.3 49.4 95.1C34.6 82.2 25.9 61.8 26.8 41.1Z';
let n=0;
function face(back){const id='wkc'+(++n);
 return `<svg viewBox="0 0 128 128" aria-hidden="true" focusable="false"><defs>
<radialGradient id="${id}g" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#fff6c4"/><stop offset=".35" stop-color="#f7cf55"/><stop offset=".72" stop-color="#d69a17"/><stop offset="1" stop-color="#8a5a04"/></radialGradient>
<radialGradient id="${id}b" cx="38%" cy="30%" r="78%"><stop offset="0" stop-color="#5f8bff"/><stop offset=".45" stop-color="#0d4dff"/><stop offset="1" stop-color="#001a8a"/></radialGradient>
<linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfdcff"/></linearGradient>
<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<circle cx="64" cy="64" r="63" fill="url(#${id}g)"/>
<circle cx="64" cy="64" r="57" fill="none" stroke="#7a4d02" stroke-opacity=".45" stroke-width="2.2" stroke-dasharray="2.2 3.3"/>
<circle cx="64" cy="64" r="52" fill="#9a6408"/>
<circle cx="64" cy="64" r="50" fill="url(#${id}b)"/>
<circle cx="64" cy="64" r="50" fill="none" stroke="#ffe08a" stroke-opacity=".7" stroke-width="1.4"/>
<g transform="translate(64 66) scale(.62) translate(-64 -64)">${back?`<text x="64" y="80" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="46" fill="url(#${id}w)">WAKHAN</text>`:`<path d="${W}" fill="#00125e" opacity=".45" transform="translate(2.5 3)"/><path d="${W}" fill="url(#${id}w)"/>`}</g>
<path d="M14 52A52 52 0 0 1 98 18" fill="none" stroke="url(#${id}s)" stroke-width="9" stroke-linecap="round" opacity=".8"/></svg>`}
function coin(size,mode){const s=Number(size)||96,layers=Math.max(6,Math.round(s/7));let edge='';
 for(let i=0;i<layers;i++)edge+=`<i class="wkc-e" style="--z:${(i/(layers-1)-.5).toFixed(3)}"></i>`;
 return `<span class="wkc wkc-${mode||'spin'}" style="--s:${s}px" aria-hidden="true"><span class="wkc-r">${edge}<span class="wkc-f">${face(false)}</span><span class="wkc-b">${face(true)}</span></span><span class="wkc-glow"></span></span>`}
const css=`.wkc{position:relative;display:inline-block;width:var(--s);height:var(--s);perspective:calc(var(--s)*7);flex:none;vertical-align:middle}
.wkc-r{position:absolute;inset:0;transform-style:preserve-3d;animation:wkc-turn 7s cubic-bezier(.45,0,.2,1) infinite}
.wkc-chip .wkc-r{animation-duration:9s}
.wkc-f,.wkc-b{position:absolute;inset:0;border-radius:50%;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.wkc-f{transform:translateZ(calc(var(--s)*.055))}.wkc-b{transform:rotateY(180deg) translateZ(calc(var(--s)*.055))}
.wkc-f svg,.wkc-b svg{width:100%;height:100%;display:block}
.wkc-e{position:absolute;inset:1%;border-radius:50%;background:linear-gradient(90deg,#6b4202,#e7b63a 30%,#fff1a8 50%,#c98a0f 70%,#6b4202);transform:translateZ(calc(var(--z)*var(--s)*.11))}
.wkc-glow{position:absolute;inset:-14%;border-radius:50%;background:radial-gradient(circle,rgba(255,214,90,.35),rgba(255,214,90,0) 62%);z-index:-1;animation:wkc-glow 3.5s ease-in-out infinite;pointer-events:none}
.wkc-chip .wkc-glow{display:none}
@keyframes wkc-turn{0%{transform:rotateY(0) rotateX(8deg)}38%{transform:rotateY(360deg) rotateX(8deg)}50%{transform:rotateY(360deg) rotateX(-6deg) translateY(-4%)}62%{transform:rotateY(360deg) rotateX(8deg)}100%{transform:rotateY(360deg) rotateX(8deg)}}
@keyframes wkc-glow{50%{opacity:.45;transform:scale(.92)}}
@media (prefers-reduced-motion:reduce){.wkc-r,.wkc-glow{animation:none}}
.wc23-coin.wkc-host{background:none!important;box-shadow:none!important;border:0!important;color:transparent!important;overflow:visible!important;display:inline-flex!important;align-items:center;justify-content:center}`;
/* header chip: redrawn by its own code, so it gets the coin face as a picture that turns in 3D */
const chipFace='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" '+face(false).slice(5).replace(/url\(#/g,'url(#'));
const chipCss=`.wk47-coin i{font-size:0!important;color:transparent!important;background:url("${chipFace}") center/contain no-repeat!important;box-shadow:0 2px 6px rgba(120,70,0,.45)!important;animation:wkc-chip 8s cubic-bezier(.45,0,.2,1) infinite}
@keyframes wkc-chip{0%{transform:perspective(80px) rotateY(0)}30%{transform:perspective(80px) rotateY(360deg)}100%{transform:perspective(80px) rotateY(360deg)}}
@media (prefers-reduced-motion:reduce){.wk47-coin i{animation:none}}`;
try{const st=document.createElement('style');st.textContent=css+chipCss;(document.head||document.documentElement).appendChild(st)}catch(e){}
/* put the coin into the wallet and the header chip (they are redrawn often, so keep checking) */
function fit(){
 for(const el of document.querySelectorAll('.wc23-coin:not(.wkc-host)')){const s=Math.round(Math.max(el.getBoundingClientRect().width,el.getBoundingClientRect().height))||96;el.classList.add('wkc-host');el.innerHTML=coin(Math.max(28,s),'spin')}
}
try{new MutationObserver(()=>{clearTimeout(fit.t);fit.t=setTimeout(fit,60)}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){setInterval(fit,1000)}
window.WKCOIN={html:coin,fit};fit();
})();
