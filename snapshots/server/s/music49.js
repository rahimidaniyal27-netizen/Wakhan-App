/* WAKHAN M49: one clean Music area — same header and segmented tabs on Search / Library / Liked / Recent */
(()=>{"use strict";
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const I=k=>typeof wi11==="function"?wi11(k):(typeof wnIcon==="function"?wnIcon(k):"");
const TX={fa:{title:"موسیقی",find:"برای تو",lib:"کتابخانه",liked:"پسندها",recent:"تازه شنیدی",sub:"آهنگ‌ها و پلی‌لیست‌های تو"},ps:{title:"موسیقي",find:"ستا لپاره",lib:"کتابتون",liked:"خوښې",recent:"وروستي",sub:"ستاسو سندرې او لیستونه"},en:{title:"Music",find:"For you",lib:"Library",liked:"Liked",recent:"Recent",sub:"Your songs and playlists"}};
const T=()=>{const l=document.documentElement.lang||"fa";return l.startsWith("ps")?TX.ps:(l==="fa"||l==="fa-IR")?TX.fa:TX.en};
const tab=()=>typeof TAB!=="undefined"?TAB:"";const kind=()=>{try{return (typeof SUB!=="undefined"&&SUB&&SUB.kind)||""}catch(e){return ""}};
function active(){if(tab()!=="l")return"find";const k=kind();return k==="favorites"?"liked":k==="history"?"recent":"lib"}
function head(){const t=T(),a=active();const seg=(k,ic,label,act)=>`<button class="mx-seg ${a===k?"on":""}" onclick="${act}" ${a===k?'aria-current="page"':""}>${I(ic)}<span>${esc(label)}</span></button>`;
 return `<div class="mx-head"><div class="mx-tabs" role="tablist">${seg("find","music",t.find,"go('p')")}${seg("lib","library",t.lib,"go('l')")}${seg("liked","heart",t.liked,"go('l',{kind:'favorites'})")}${seg("recent","clock",t.recent,"go('l',{kind:'history'})")}</div></div>`}
function apply(){const main=document.querySelector("#view > main, #view main");if(!main||main.querySelector(":scope>.mx-head"))return;
 const isMusic=main.classList.contains("wm76-music")||main.classList.contains("wm72-music")||main.classList.contains("wn-music");
 const isLib=tab()==="l"&&kind()!=="playlist";
 if(!isMusic&&!isLib)return;
 main.classList.add("mx-page");
 if(isMusic){main.querySelectorAll(":scope>.wm76-heading,:scope>.wm72-page-title,:scope>nav.wm76-music-tabs,:scope>.wm76-music-tabs,:scope>.wm72-music-tabs").forEach(n=>n.remove())}
 if(isLib){main.querySelectorAll(":scope>.wm72-back-library,:scope>button.wn-secondary:first-of-type,:scope>.wn-eyebrow,:scope>.wn-heading,:scope>.wn-library-pins").forEach(n=>n.remove());
  for(const b of main.querySelectorAll(":scope>button"))if(/‹|back|پس/.test(b.textContent)&&b.offsetTop<200)b.remove()}
 main.insertAdjacentHTML("afterbegin",head())}
let q=0;new MutationObserver(()=>{try{apply()}catch(e){}}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
const st=document.createElement("style");st.textContent=`
.mx-head{position:sticky;top:0;z-index:20;margin:0 -16px 16px;padding:10px 16px 12px;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.mx-head{display:block!important}.mx-title{margin:0 2px 12px;font-size:28px;font-weight:900;color:var(--txt);line-height:1.2}
.mx-tabs{display:grid!important;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px;border-radius:16px;background:var(--card2,rgba(255,255,255,.07));border:1px solid var(--ln);position:static!important;transform:none!important;width:auto!important;bottom:auto!important;left:auto!important;box-shadow:none!important}
.mx-seg{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:52px;padding:6px 2px;border:0;border-radius:12px;background:transparent;color:var(--mut);font:700 11.5px system-ui,-apple-system,sans-serif;transition:background .2s,color .2s}
.mx-seg svg{width:20px;height:20px}
.mx-seg.on{background:var(--a1,#8b5cf6);color:#fff;box-shadow:0 6px 16px color-mix(in srgb,var(--a1,#8b5cf6) 35%,transparent)}
.mx-seg:active{transform:scale(.96)}
.mx-page .wn-library-toolbar{margin-top:4px}
`;document.head.appendChild(st);
apply();
/* cinema gate / lobby: heading and card become ONE section */
function cine(){const m=document.querySelector("#view main.wm75-page");if(!m||m.dataset.mx)return;const h=m.querySelector(":scope>.wm75-heading");const card=m.querySelector(":scope>.wm75-gate,:scope>.wm75-lobby,:scope>section");if(!h||!card)return;m.dataset.mx=1;card.classList.add("mx-card");const nv=m.querySelector(":scope>.wm75-tabs");if(nv){nv.classList.add("mx-ctabs");card.prepend(nv)}card.prepend(h);h.classList.add("mx-in")}
new MutationObserver(()=>{try{cine()}catch(e){}}).observe(document.documentElement,{childList:true,subtree:true});
const st2=document.createElement("style");st2.textContent=`
#view .mx-card{margin-top:4px!important;padding-top:14px!important;border-radius:26px!important}
#view .wm75-heading.mx-in{position:relative!important;background:none!important;border:0!important;box-shadow:none!important;margin:0 0 18px!important;padding:0!important;min-height:44px}
#view .wm75-heading.mx-in>button{background:var(--card2,rgba(255,255,255,.08))!important;border:0!important;border-radius:50%!important;width:40px!important;height:40px!important}
#view .mx-card .wm75-tabs.mx-ctabs{position:static!important;transform:none!important;left:auto!important;right:auto!important;bottom:auto!important;width:auto!important;max-width:none!important;display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:4px!important;margin:0 0 16px!important;padding:4px!important;border-radius:16px!important;background:var(--card2,rgba(255,255,255,.07))!important;border:1px solid var(--ln)!important;box-shadow:none!important;backdrop-filter:none!important;z-index:auto!important;height:auto!important}
#view .mx-card .wm75-tabs.mx-ctabs button{display:flex!important;flex-direction:row!important;align-items:center;justify-content:center;gap:6px;min-height:42px!important;border-radius:12px!important;background:transparent!important;color:var(--mut)!important;font:700 12.5px system-ui,-apple-system,sans-serif!important;border:0!important}
#view .mx-card .wm75-tabs.mx-ctabs button.is-active{background:var(--a1,#8b5cf6)!important;color:#fff!important}
#view .mx-card .wm75-tabs.mx-ctabs svg{width:18px!important;height:18px!important}
#view .mx-card>.wm75-intro{display:none!important}
#view .wm75-heading.mx-in .wm75-heading-art,#view .wm75-heading.mx-in>.wm75-art{display:none!important}

body #view .mx-tabs .mx-seg{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;min-height:52px!important;height:auto!important;padding:6px 2px!important;margin:0!important;border:0!important;border-radius:12px!important;background:transparent!important;color:var(--mut)!important;font:700 11.5px system-ui,-apple-system,sans-serif!important;box-shadow:none!important;white-space:nowrap!important}
body #view .mx-tabs .mx-seg.on{background:var(--a1,#8b5cf6)!important;color:#fff!important;box-shadow:0 6px 16px color-mix(in srgb,var(--a1,#8b5cf6) 35%,transparent)!important}
body #view .mx-tabs .mx-seg svg{width:20px!important;height:20px!important}
`;document.head.appendChild(st2);cine();
})();
