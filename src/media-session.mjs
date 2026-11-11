/* Android foreground support follows actual playback/voice intent and microphone state. */
export function installMediaSession({session,enabled}) {
 if(!enabled)return {sync(){},stop(){},async shutdown(){}};
 let last='',stopped=false,scheduled=0,disposed=false;
 const status=()=>{
  let hall=false,microphone=false,playing=false,preparing=false;
  const recording=window.WakhanChatAudio?.recording===true;
  try{hall=typeof VC!=='undefined'&&!!VC.on;microphone=hall&&!VC.mute&&!!VC.stream?.getAudioTracks().some(t=>t.readyState==='live'&&t.enabled)}catch{}
  try{playing=typeof au!=='undefined'&&!au.paused&&!au.ended;preparing=typeof LOADING!=='undefined'&&!!LOADING&&typeof CUR!=='undefined'&&!!CUR}catch{}
  if(!playing)playing=Array.from(document.querySelectorAll('audio,video')).some(el=>!el.paused&&!el.ended&&!el.muted&&el.readyState>0);
  return {active:!stopped&&(hall||playing||preparing||recording),hall:!stopped&&hall,microphone:!stopped&&(microphone||recording)};
 };
 async function sync(){
  scheduled=0;if(disposed)return;
  const value=status(),key=JSON.stringify(value);if(key===last)return;
  last=key;
  try{await session.update(value)}catch{last=''}
 }
 const soon=()=>{if(!scheduled&&!disposed)scheduled=setTimeout(sync,0)};
 const intent=()=>{stopped=false;soon()};
 function stop(){
  stopped=true;
  try{window.C2?.stopAudio?.()}catch{}
  try{if(typeof playTok!=='undefined')playTok++}catch{}
  try{if(typeof vcLeave==='function')vcLeave()}catch{}
  try{if(typeof au!=='undefined')au.pause()}catch{}
  document.querySelectorAll('audio,video').forEach(el=>{try{el.pause()}catch{}});
  try{if(typeof YTP!=='undefined')YTP?.pauseVideo?.()}catch{}
  try{if(typeof WMC!=='undefined')WMC.player?.pause?.()}catch{}
  soon();
 }
 for(const name of ['playCur','playFrom','togglePlay','nextTrack','wnPlay','vcJoin','vcMute','vcLeave','cinLeave']){
  const original=window[name];if(typeof original!=='function')continue;
  window[name]=function(...args){
   if(!['vcLeave','cinLeave'].includes(name))stopped=false;
   const result=original.apply(this,args);soon();
   if(result&&typeof result.finally==='function')result.finally(soon).catch(()=>{});
   return result;
  };
 }
 const play=event=>{
  if(stopped){try{event.target.pause()}catch{}return}
  soon();
 };
 document.addEventListener('play',play,true);
 for(const name of ['pause','ended','emptied'])document.addEventListener(name,soon,true);
 document.addEventListener('visibilitychange',soon);
 window.addEventListener('focus',soon);
 session.addListener('stop',stop).catch(()=>{});
 session.addListener('unavailable',()=>{last=''}).catch(()=>{});
 // State changes sometimes originate in an older renderer rather than a hooked button.
 // This check never captures audio or plays a silent keepalive.
 const timer=setInterval(soon,2500);
 soon();
 async function shutdown(){
  stop();disposed=true;clearInterval(timer);clearTimeout(scheduled);
  try{await session.update({active:false,hall:false,microphone:false})}catch{}
 }
 return {sync,intent,stop,shutdown,dispose:shutdown};
}
