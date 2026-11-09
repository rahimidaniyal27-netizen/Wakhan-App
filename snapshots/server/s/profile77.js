/* Profile77: remove duplicate identity injection; restore original v24 artwork additively. */
(()=>{
'use strict';if(window.WM77||typeof WM70==='undefined'||typeof AF24_ART==='undefined')return;
const COPY={fa:{"old":"هاله‌های قبلی","new":"هاله‌های تازه","hint":"طرح‌های قبلی‌ات سر جایش است؛ طرح‌های تازه هم اضافه شده."},en:{old:'Original frames',new:'New frames',hint:'Your original frames are kept alongside the new designs.'},ps:{old:'پخواني چوکاټونه',new:'نوي چوکاټونه',hint:'پخواني چوکاټونه د نوو بڼو ترڅنګ ساتل شوي دي.'}};
const tr=k=>(COPY[LG]||COPY.fa)[k],legacy=v=>v?.source===24&&typeof v.frame==='string'&&Object.prototype.hasOwnProperty.call(AF24_ART,v.frame);
function tidy(){const view=V();if(!view)return;view.querySelectorAll(':scope > .wi-compact').forEach(node=>node.remove())}
const originalMount=wiMount;
wiMount=function(){
 const view=V();if(!ME?.me||!view)return;
 if(view.querySelector('.wn-page,.wm76-music,.wm75-page')){
  const context=wiContext(),changed=context!==WI.context;
  if(changed){WI.context=context;WI.profile=null;wiRefresh()}
  tidy();return;
 }
 return originalMount();
};
const originalHome=wnHome;
wnHome=function(){
 const value=originalHome();tidy();const view=V(),modern=view?.querySelector('.wm72-home');
 if(modern)modern.querySelector('.wm72-greeting')?.remove();
 else{const home=view?.querySelector('.wn-page');home?.querySelector(':scope > .wn-heading')?.remove();home?.querySelector(':scope > .wn-eyebrow')?.remove();home?.querySelector(':scope > .wn-subtitle')?.remove()}
 return value;
};
const originalHalo=wm70HaloArt;
wm70HaloArt=function(value){return legacy(value)?`<span class="wm77-original-art" data-wm77-frame="${h(value.frame)}">${af24Art(value.frame)}</span>`:originalHalo(value)};
const originalAvatar=wm70Avatar;
wm70Avatar=function(p,cls=''){return originalAvatar(p,cls+(legacy(p?.halo)?' wm77-original-avatar':''))};
const originalGallery=wm70HaloGallery;
wm70HaloGallery=function(){
 const all=WM70.halos,old=all.filter(v=>v.role===WM70.haloRole&&legacy(v)),own=WM70.self?.halo;
 let current;
 try{
  WM70.halos=all.filter(v=>!legacy(v));
  if(!['feminine','masculine'].includes(WM70.haloPreview))WM70.haloPreview=own?.variant==='masculine'?'masculine':'feminine';
  current=originalGallery();
 }finally{WM70.halos=all}
 if(!old.length)return current;
 const original=`<div class="wm77-collection-heading"><h4>${h(tr('old'))}</h4><small>${old.length}</small></div><div class="wm70-halo-gallery wm77-original-gallery">${old.map(item=>`<article class="${item.allowed?'':'locked'}"><div class="wm70-halo-preview">${wm70Avatar({...WM70.self,halo:{...item,variant:'original'}})}</div><b>${h(wm70Name(item))}</b>${item.allowed?`<button class="${own?.id===item.id?'on':''}" onclick="wm70ChooseHalo('${item.id}','original')">${h(wm70T(own?.id===item.id?'applied':'choose'))}</button>`:`<small>${h(wm70T('locked'))} · ${h(wm70T(item.role))}</small>`}</article>`).join('')}</div><div class="wm77-collection-heading"><h4>${h(tr('new'))}</h4><small>${all.filter(v=>v.role===WM70.haloRole&&!legacy(v)).length}</small></div>`;
 return current.replace('<div class="wm70-halo-gallery">',`<p class="wm77-preserve-hint">${h(tr('hint'))}</p>${original}<div class="wm70-halo-gallery">`);
};
const oldRender=render;render=function(){const result=oldRender();tidy();return result};
const nodes=new Set(),visible=new Set();
function motion(){const on=document.visibilityState!=='hidden'&&(typeof WN61_EMOJI==='undefined'||WN61_EMOJI.motion!==false);for(const node of nodes)node.classList.toggle('wm77-paused',!on||!visible.has(node))}
const intersection=window.IntersectionObserver?new IntersectionObserver(entries=>{for(const entry of entries){entry.isIntersecting?visible.add(entry.target):visible.delete(entry.target)}motion()},{rootMargin:'12px'}):null;
function scan(){
 for(const node of document.querySelectorAll('.wm77-original-art:not([data-wm77-bound])')){node.dataset.wm77Bound='1';nodes.add(node);if(intersection)intersection.observe(node);else visible.add(node)}
 for(const node of nodes)if(!node.isConnected){intersection?.unobserve(node);nodes.delete(node);visible.delete(node)}motion();
}
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;tidy();scan()})});observer.observe(document.body,{childList:true,subtree:true});
document.addEventListener('visibilitychange',motion);
if(typeof wn61ToggleMotion==='function'){const previous=wn61ToggleMotion;wn61ToggleMotion=function(){const value=previous();motion();return value}}
window.WM77={version:77,legacy,tidy,scan,motion};scan();
tidy();if(ME?.me&&TAB==='h')wnHome();else if(ME?.me&&TAB==='m')rMe();
})();
