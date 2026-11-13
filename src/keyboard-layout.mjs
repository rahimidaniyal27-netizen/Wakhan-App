/* iOS reports its keyboard target before the viewport has resized. Keep one
   resize owner and animate composers with the native keyboard notification. */
export function installKeyboardLayout({platform='android'}={}){
 if(platform!=='ios')return null;
 let overlap=0,seen=false,timer=0;
 const html=document.documentElement;
 const layout={viewport(){return seen?{height:Math.max(1,innerHeight-overlap),offsetTop:0,fullHeight:innerHeight}:null}};
 window.WakhanKeyboard=layout;
 window.addEventListener('wakhanKeyboardFrame',event=>{
  const data=event.detail||event;
  if(!Number.isFinite(data.overlap)||!Number.isFinite(data.duration))return;
  overlap=Math.max(0,Math.min(innerHeight,data.overlap));seen=true;
  const duration=Math.max(0,Math.min(1,data.duration));
  const curves=['ease-in-out','ease-in','ease-out','linear'];
  html.style.setProperty('--wk-keyboard-duration',duration+'s');
  html.style.setProperty('--wk-keyboard-curve',curves[data.curve]||'cubic-bezier(.2,.7,.2,1)');
  html.classList.add('wk-keyboard-moving');clearTimeout(timer);
  window.H2?.kb?.();window.C2?.kb?.();
  timer=setTimeout(()=>html.classList.remove('wk-keyboard-moving'),duration*1000+50);
 });
 return layout;
}
