import {musicSource} from './music-source.mjs';
/* Personal music uses Android's real media service; the WebView only renders state. */
export function installNativeMusic({player,enabled,origin,now=()=>Date.now()}){
 if(!enabled)return {wrap:element=>element,bind(){},async shutdown(){},get active(){return false},get ownsPlayback(){return false}};
 let element,id='',source='',loaded=false,ready=false,ended=false,wanted=false,playing=false,duration=0,position=0,at=now(),serial=0,pending=null,disposed=false,generation=0;
 const original=new Map();
 const emit=name=>element?.dispatchEvent(new Event(name));
 const control=(action,extra={})=>player.control({id,action,...extra});
 const current=()=>Math.min(duration||Infinity,position+(playing?(now()-at)/1000:0));
 function settle(value){if(pending){clearTimeout(pending.timer);const resolve=pending.resolve;pending=null;resolve(value)}}
 function apply(value){
  if(disposed||!id||value?.id!==id)return;
  const before=playing,wasReady=ready,wasEnded=ended;
  position=Number(value.position)||0;at=now();duration=Number(value.duration)||duration;
  ready=!!value.ready;playing=!!value.playing;wanted=!!value.wanted;ended=!!value.ended;
  if(value.error){playing=false;wanted=false;settle(false);emit('error');return}
  if(ready&&!wasReady){emit('loadedmetadata');emit('canplay')}
  if(ready&&pending){
   if(playing||!pending.autoplay)settle(true);
   else if(!wanted&&!value.buffering)settle(false);
  }
  if(playing&&!before)emit('play');else if(!playing&&before&&!value.buffering&&!wanted&&!ended)emit('pause');
  if(value.buffering)emit('waiting');
  emit('timeupdate');
  if(ended&&!wasEnded){wanted=false;emit('ended')}
 }
 let listener;
 const listening=player.addListener('state',apply).then(value=>{listener=value;if(disposed)return value.remove?.()});
 function valid(value){return musicSource(value,origin)}
 async function stop(){
  generation++;
  const previous=id;settle(false);id='';source='';loaded=false;ready=false;ended=false;wanted=false;playing=false;position=0;duration=0;
  if(previous)await player.control({id:previous,action:'stop'}).catch(()=>{});
 }
 async function prepare(result,start,autoplay,sequence){
  if(disposed||!element)return false;
  const url=valid(result?.src);if(!url)return null;
  const revision=++generation;
  await listening;
  if(disposed||revision!==generation)return false;
  settle(false);
  const previous=id;id=String(now())+'_'+(++serial);source=url;loaded=true;ready=false;ended=false;wanted=!!autoplay;playing=false;position=Math.max(0,Number(start)||0);at=now();duration=0;
  const request=id;
  // Stop the HTML element before the native player owns this source.
  original.get('pause')();original.get('removeAttribute')('src');original.get('load')();
  if(previous)void player.control({id:previous,action:'stop'}).catch(()=>{});
  const completion=new Promise(resolve=>{pending={resolve,autoplay:!!autoplay,timer:setTimeout(()=>{if(id===request){wanted=false;settle(false);void control('pause').catch(()=>{});emit('error')}},25000)}});
  try{
   const state=await player.loadTrack({id:request,source:url,position,title:String(result.title||globalThis.CUR?.title||'Wakhan').slice(0,200),artist:String(result.artist||'').slice(0,120),playing:!!autoplay});
   apply(state);
  }catch{if(id===request){wanted=false;settle(false);emit('error')}}
  return completion;
 }
 function wrap(target){
  if(element)return element===target?proxy:target;
  element=target;
  for(const method of ['play','pause','load','removeAttribute'])original.set(method,target[method].bind(target));
  return proxy;
 }
 const proxy=new Proxy({}, {
  get(_,key){
   if(key==='removeAttribute')return name=>{if(name==='src')void stop();original.get('removeAttribute')(name)};
   if(key==='load'&&!loaded)return ()=>{generation++;original.get('load')()};
   if(key==='nativeMusic')return loaded;
   if(loaded){
    if(key==='paused')return !wanted;if(key==='ended')return ended;if(key==='currentTime')return current();
    if(key==='duration')return duration||NaN;if(key==='readyState')return ready?4:0;
    if(key==='src'||key==='currentSrc')return source;if(key==='error')return null;
    if(key==='play')return ()=>{wanted=true;return control('play').catch(error=>{wanted=false;throw error})};
    if(key==='pause')return ()=>{position=current();at=now();wanted=false;playing=false;void control('pause').catch(()=>{});emit('pause')};
    if(key==='load')return ()=>{};
    if(key==='removeAttribute')return name=>{if(name==='src')void stop();else original.get('removeAttribute')(name)};
   }
   const value=Reflect.get(element,key,element);return typeof value==='function'?value.bind(element):value;
  },
  set(_,key,value){
   if(loaded&&key==='currentTime'){position=Math.max(0,Number(value)||0);at=now();void control('seek',{position}).catch(()=>{});emit('seeking');return true}
   if(key==='src'&&loaded)void stop();
   return Reflect.set(element,key,value,element);
  }
 });
 function bind(scope=window){
  const base=scope.apSource;if(typeof base!=='function')throw Error('PERSONAL_AUDIO_SOURCE_MISSING');
  scope.apSource=async function(result,start,autoplay,sequence){
   if(valid(result?.src))return prepare(result,start,autoplay,sequence);
   await stop();return base.apply(this,arguments);
  };
 }
 async function shutdown(){disposed=true;await stop();await player.stopAll?.();await listening.catch(()=>{});await listener?.remove?.()}
 return {wrap,bind,prepare,shutdown,get active(){return loaded&&(wanted||playing)},get ownsPlayback(){return loaded},state:()=>({ready,ended,wanted,playing,position:current(),duration})};
}
