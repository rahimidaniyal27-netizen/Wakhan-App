/* Freeze only the surfaces behind the foremost modal, preserving their scroll. */
export function installOverlayIsolation(){
 const panels='#sheet.show,#fp.show,#yv.show,#wm-finance-panel,#af24-panel,#wc23-panel,#wk-commerce-panel,#c3-settings,dialog[open]';
 const saved=new Map();let top=null,lock=null,pending=false,lastY=0;
 const stats={updates:0,locks:0};
 function restore(node,state){node.inert=state.inert;delete node.dataset.wkOverlayCovered}
 function sync(){
  pending=false;stats.updates++;const previous=top;
  const visible=[...document.querySelectorAll(panels)].filter(n=>!n.hidden&&getComputedStyle(n).display!=='none'&&n.getBoundingClientRect().height>0);
  const dialogs=visible.filter(n=>n.matches('dialog[open]'));
  top=dialogs.at(-1)||visible.sort((a,b)=>(parseInt(getComputedStyle(a).zIndex)||0)-(parseInt(getComputedStyle(b).zIndex)||0)).at(-1)||null;
  if(top&&!lock){
   const body=document.body,props=['position','top','left','right','width','overflow'];
   lock={y:scrollY,props:Object.fromEntries(props.map(k=>[k,[body.style.getPropertyValue(k),body.style.getPropertyPriority(k)]]))};stats.locks++;
   Object.assign(body.style,{position:'fixed',top:-lock.y+'px',left:'0',right:'0',width:'100%',overflow:'hidden'});
  }
  for(const [node,state]of saved)if(!top||!node.isConnected||node===top||node.contains(top)){restore(node,state);saved.delete(node)}
  if(top)for(const node of document.body.children){
   if(node===top||node.contains(top)||node.matches('script,style,#ov,#toast,#h2-bub'))continue;
   if(!saved.has(node)){saved.set(node,{inert:node.inert});node.inert=true;node.dataset.wkOverlayCovered='1'}
  }
  if(previous!==top)document.dispatchEvent(new Event('wk-overlay-changed'));
  if(!top&&lock){const state=lock;lock=null;for(const [key,[value,priority]]of Object.entries(state.props))value?document.body.style.setProperty(key,value,priority):document.body.style.removeProperty(key);window.scrollTo({top:state.y,behavior:'instant'})}
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(sync)}}
 new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'?r.target.matches?.(panels+',#sheet,#fp,#yv,dialog'):r.target===document.body||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.(panels)||n.querySelector?.(panels)))))schedule()}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open','hidden']});
 function canScroll(target,delta){
  if(!top||!top.contains(target))return false;
  for(let node=target;node&&top.contains(node);node=node.parentElement){if(node instanceof HTMLElement&&/(auto|scroll)/.test(getComputedStyle(node).overflowY)&&node.scrollHeight>node.clientHeight+1&&((delta>0&&node.scrollTop+node.clientHeight<node.scrollHeight-1)||(delta<0&&node.scrollTop>1)))return true}
  return false;
 }
 document.addEventListener('touchstart',e=>{if(e.touches.length===1)lastY=e.touches[0].clientY},{passive:true});
 document.addEventListener('touchmove',e=>{if(!top||e.touches.length!==1)return;const y=e.touches[0].clientY,delta=lastY-y;lastY=y;if(delta&&!canScroll(e.target,delta)&&e.cancelable)e.preventDefault()},{passive:false});
 document.addEventListener('wheel',e=>{if(top&&e.deltaY&&!e.ctrlKey&&!canScroll(e.target,e.deltaY)&&e.cancelable)e.preventDefault()},{passive:false});
 sync();return {sync,stats,get active(){return top}};
}
