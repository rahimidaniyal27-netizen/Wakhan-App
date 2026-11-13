/* One fullscreen HUD; keep iPhone playback inline so native and web controls do not overlap. */
(()=>{'use strict';
 let mounted=false,repairs=[];
 function geometry(){
  for(const timer of repairs)clearTimeout(timer);repairs=[];
  if(WMC.expanded)return;
  for(const delay of [0,120,320,700])repairs.push(setTimeout(()=>{
   if(WMC.expanded||document.activeElement?.matches('input,textarea'))return;
   const state=window.H2?.state;if(state){state.royalFullHeight=0;state.royalWidth=0;state.royalKeyboardUntil=0}
   window.H2?.kb();
  },delay));
 }
 function start(){
  if(mounted)return;mounted=true;
  wmcExpand=function(on){
   const stage=document.getElementById('wmc-stage'),want=typeof on==='boolean'?on:!WMC.expanded;if(!stage)return;
   WMC.expanded=want;WMC.tgFull=false;
   void window.WakhanOrientation?.setFullscreen(want);
   wmcSyncFullscreen();nxControls();window.H2?.reveal(true);
   if(!want){
    if(document.fullscreenElement)Promise.resolve(document.exitFullscreen?.()).catch(()=>{});
    geometry();
   }else if(!document.documentElement.classList.contains('wk-ios')&&stage.requestFullscreen){
    Promise.resolve(stage.requestFullscreen()).catch(()=>{});
   }
  };
  window.wmcExpand=wmcExpand;
  nfWake=function(){if(WMC.expanded)window.H2?.reveal(true)};
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){if(WMC.expanded&&!document.documentElement.classList.contains('wk-ios')){WMC.expanded=false;void window.WakhanOrientation?.setFullscreen(false);wmcSyncFullscreen()}geometry()}});
  document.addEventListener('webkitendfullscreen',event=>{if(event.target===NX.video&&WMC.expanded)wmcExpand(false);else geometry()},true);
  const back=window.wkaBack;if(back)window.wkaBack=function(...args){if(WMC.expanded)return wmcExpand(false);return back.apply(this,args)};
  window.addEventListener('orientationchange',geometry);
  window.addEventListener('resize',()=>{if(!WMC.expanded)geometry()});
 }
 window.WakhanFullscreen={start,geometry};
})();
