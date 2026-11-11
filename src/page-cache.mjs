/* In-memory tab views. The existing media nodes remain attached while hidden. */
export function installPageCache({root,route,afterResume=()=>{},maxPages=10}){
 if(!root)throw Error('view_host_missing');
 root.replaceChildren();root.dataset.wkViewHost='1';
 const entries=new Map(),stats={created:0,hits:0,writes:0,skippedWrites:0};let current=null,navigating=null,serial=0;
 const descriptor=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
 const style=document.createElement('style');style.textContent='[data-wk-page]{display:contents}[data-wk-page][hidden]{display:none!important}';document.head.append(style);
 const usable=element=>!!element.querySelector('main,form,button,input,textarea,iframe,video,audio,[role=main]');
 const state=()=>{try{return route()}catch{return {tab:'h',sub:null,context:''}}};
 const signature=sub=>{try{return JSON.stringify(sub||null)}catch{return 'uncacheable'}};
 const key=s=>String(s.tab||'h');
 function get(s=state()){
  const id=key(s);let entry=entries.get(id);
  if(!entry){
   const element=document.createElement('section');element.dataset.wkPage=id;element.hidden=true;element.inert=true;root.append(element);
   entry={id,element,sub:s.sub||null,signature:signature(s.sub),context:s.context||'',ready:false,scroll:0,lastHTML:null};entries.set(id,entry);stats.created++;
   Object.defineProperty(element,'innerHTML',{configurable:true,get(){return descriptor.get.call(this)},set(value){
    value=String(value);if(value===entry.lastHTML&&this.childNodes.length){stats.skippedWrites++;return}
    stats.writes++;descriptor.set.call(this,value);entry.lastHTML=value;entry.ready=usable(this);const now=state();entry.sub=now.sub||null;entry.signature=signature(now.sub);entry.context=now.context||'';
   }});
  }
  return entry;
 }
 function activate(entry){
  if(current===entry)return entry.element;
  if(current){current.scroll=window.scrollY;current.element.hidden=true;current.element.inert=true;delete current.element.dataset.wkPageActive}
  entry.element.hidden=false;entry.element.inert=false;entry.element.dataset.wkPageActive='1';current=entry;
  return entry.element;
 }
 function view(){return activate(get())}
 function prune(){
  // Media and unfinished forms remain attached. Only empty transient panes can
  // be removed automatically; the fixed set of top-level tabs stays bounded.
  if(entries.size<=maxPages)return;
  for(const [id,e]of entries){if(e!==current&&!e.ready){e.element.remove();entries.delete(id);if(entries.size<=maxPages)break}}
 }
 function bind({getGo,setGo,getRender,setRender,onResume=()=>{}}){
  const original=getGo();
  setGo(function(tab,sub){
   const before=state(),target={tab,sub:sub===undefined&&String(tab)!==key(before)?entries.get(String(tab))?.sub||null:sub||null};
   const cached=entries.get(String(tab)),render=getRender();const invocation=++serial;
   const requestedSignature=signature(target.sub);navigating={from:key(before),to:String(tab)};
   let restored=false;
   setRender(function(...args){
    const actual=state();
    if(cached?.ready&&actual.tab===tab&&cached.signature===requestedSignature&&cached.context===(actual.context||'')){
     activate(cached);stats.hits++;restored=true;return;
    }
    return render.apply(this,args);
   });
   try{
    const result=original.call(this,tab,target.sub);
    const entry=get();entry.ready=usable(entry.element);
    onResume(state().tab,entry.element);afterResume(state().tab,entry.element);
    const scroll=restored?entry.scroll:0;
    requestAnimationFrame(()=>{if(serial===invocation&&current===entry)window.scrollTo({top:scroll,behavior:'instant'})});
    prune();return result;
   }finally{setRender(render);navigating=null}
  });
 }
 function preservingCinema(){return navigating?.from==='c'&&navigating.to!=='c'&&state().preserveMedia===true&&!!entries.get('c')?.element.querySelector('iframe,video,audio,#wm78-room')}
 function clear(){for(const entry of entries.values())entry.element.remove();entries.clear();current=null}
 return {view,bind,clear,preservingCinema,stats,has:tab=>entries.has(String(tab)),active:()=>current?.id};
}

export function bindPageNavigation(pages){
 pages.bind({getGo:()=>go,setGo:fn=>{go=fn},getRender:()=>render,setRender:fn=>{render=fn},onResume:(tab,pane)=>{
  try{cinMode()}catch{}
  document.body.classList.toggle('dt-open',tab==='d'&&!!pane.querySelector('#c2-thread'));
  document.body.classList.toggle('wk-typing',false);
  const hall=tab==='c'&&!!pane.querySelector('#wm78-room');for(const cls of ['h2-open','wm78-room-open','wmc-hall-active'])document.body.classList.toggle(cls,hall);
  try{setBack()}catch{}
  try{if(tab==='p'&&typeof showRes==='function')showRes()}catch{}
 }});
}
