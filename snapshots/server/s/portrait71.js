/* Native RGBA animation playback. Frames are rendered at build time. */
(()=>{
'use strict';
if(window.WM71_NATIVE_ACTIVE||typeof WM70==='undefined')return;
window.WM71_NATIVE_ACTIVE=true;
const manifest=window.WM71_ASSETS||{};
const state={nodes:new Set(),visible:new Set(),reduced:window.matchMedia?.('(prefers-reduced-motion: reduce)'),queued:false,active:new Set()};

const isWeak=()=>navigator.connection?.saveData||Number(navigator.deviceMemory||8)<=4||Number(navigator.hardwareConcurrency||8)<=4;
function keyFor(value,gift=false){
 if(!value)return null;
 const key=gift?'gift_'+value.code:value.id+'_'+(value.role==='creator'?'masculine':value.variant==='masculine'?'masculine':'feminine');
 return Object.prototype.hasOwnProperty.call(manifest,key)?key:null;
}
function art(value,gift=false){
 const key=keyFor(value,gift);if(!key)return '';
 const item=manifest[key],base='/s/wm72_motion_'+key;
 return `<span class="wm71-art ${gift?'wm71-gift':'wm71-profile'}" data-wm71-key="${key}" data-wm71-gift="${gift?'1':'0'}" aria-hidden="true"><img class="wm71-poster" src="${base}.png?v=${item.rev}" width="${item.width}" height="${item.height}" alt="" decoding="async" draggable="false"><img class="wm71-motion" data-src="${base}.webp?v=${item.rev}" width="${item.width}" height="${item.height}" alt="" decoding="async" draggable="false"></span>`;
}
const oldAvatar=wm70Avatar;wm70Avatar=function(value,cls=''){return oldAvatar(value,cls+(keyFor(value?.halo)?' wm71-avatar':''))};
const oldHalo=wm70HaloArt,oldGift=wm70GiftArt;
wm70HaloArt=function(value){return keyFor(value)?art(value):oldHalo(value)};
wm70GiftArt=function(value){const gift=typeof value==='string'?WM70.gifts.find(v=>v.code===value):value;return keyFor(gift,true)?art(gift,true):oldGift(value)};
// The old DOMContentLoaded callback is already registered; its ready guard also
// prevents it from creating a context after the override.
if(typeof WM70_MOTION!=='undefined'){
 WM70_MOTION.ready=true;cancelAnimationFrame(WM70_MOTION.raf);WM70_MOTION.raf=0;
 if(WM70_MOTION.gl){for(const texture of WM70_MOTION.textures.values())WM70_MOTION.gl.deleteTexture(texture);WM70_MOTION.gl.getExtension('WEBGL_lose_context')?.loseContext()}
 WM70_MOTION.gl=null;WM70_MOTION.nodes.clear();WM70_MOTION.visible.clear();
}
if(typeof wm70MotionInit==='function')wm70MotionInit=function(){};
if(typeof wm70MotionSchedule==='function')wm70MotionSchedule=function(){};
function motionOn(){return document.visibilityState!=='hidden'&&!state.reduced?.matches&&(typeof WN61_EMOJI==='undefined'||WN61_EMOJI.motion!==false)}
function running(node,on){
 const image=node.querySelector('.wm71-motion');if(!image)return;
 if(on&&node.dataset.wm71Failed!=='1'){
  if(!image.hasAttribute('src'))image.src=image.dataset.src;
  if(image.complete&&image.naturalWidth)node.classList.add('wm71-playing');
 }else{
  node.classList.remove('wm71-playing');
  // Removing the source stops native decoding; the exact static poster stays.
  if(image.hasAttribute('src'))image.removeAttribute('src');
 }
}
function priority(node){return node.closest('.wm70-editor-preview,.wm70-public-profile,.wm70-profile-head')?0:node.closest('.wm70-live-gift')?1:2}
function refresh(){
 const eligible=[...state.visible].filter(n=>n.isConnected).sort((a,b)=>priority(a)-priority(b));
 const active=new Set(motionOn()?eligible.slice(0,isWeak()?6:12):[]);
 state.active=active;for(const node of state.nodes)running(node,active.has(node));
}
function observe(){
 for(const node of document.querySelectorAll('.wm71-art:not([data-wm71-bound])')){
  node.dataset.wm71Bound='1';state.nodes.add(node);
  const image=node.querySelector('.wm71-motion');
  image?.addEventListener('load',()=>{if(state.active.has(node)&&image.hasAttribute('src')&&image.naturalWidth&&motionOn())node.classList.add('wm71-playing')});
  image?.addEventListener('error',()=>{node.dataset.wm71Failed='1';node.classList.remove('wm71-playing');image.removeAttribute('src')});
  if(state.observer)state.observer.observe(node);else state.visible.add(node);
 }
 for(const node of state.nodes)if(!node.isConnected){running(node,false);state.observer?.unobserve(node);state.nodes.delete(node);state.visible.delete(node)}
 refresh();
}
function mount(){
 if(window.IntersectionObserver)state.observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)state.visible.add(entry.target);else state.visible.delete(entry.target)}refresh()},{rootMargin:'8px'});
 new MutationObserver(()=>{if(state.queued)return;state.queued=true;requestAnimationFrame(()=>{state.queued=false;observe()})}).observe(document.body,{childList:true,subtree:true});
 observe();
}
const oldHall=drawHall;drawHall=function(){oldHall();for(const seat of document.querySelectorAll('#hall .seat[data-u]')){const ch=seat.querySelector('.ch');if(ch?.querySelector('.wm71-profile'))ch.classList.add('wm71-seated')}};
document.addEventListener('visibilitychange',refresh);state.reduced?.addEventListener?.('change',refresh);
if(typeof wn61ToggleMotion==='function'){const old=wn61ToggleMotion;wn61ToggleMotion=function(){const value=old();refresh();return value}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.WM71={art,keyFor,refresh,motionOn,isWeak,state};
})();
