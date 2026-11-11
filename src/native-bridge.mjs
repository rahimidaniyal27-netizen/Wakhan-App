/* App-owned UI bridge: authenticated native sessions and local preferences only. */
export function installNativeBridge({broker,browser,haptics,app,statusBar,platform='android',languageCode='en'}){
 const listeners=new Map(),back=new Set();let stable=innerHeight,active=true;
 const fire=name=>(listeners.get(name)||new Set()).forEach(fn=>{try{fn()}catch{}});
 async function open(value){
  const url=new URL(value);
  if(url.protocol!=='https:')return;
  await browser.open({url:url.href});
 }
 const storage={
  getItems(keys,cb){try{cb(null,Object.fromEntries(keys.map(k=>[k,localStorage.getItem('wm_native_pref_'+k)||''])))}catch(e){cb(e,{})}},
  setItem(k,v,cb){try{localStorage.setItem('wm_native_pref_'+k,String(v));cb?.(null,true)}catch(e){cb?.(e,false)}},
  getItem(k,cb){this.getItems([k],(e,v)=>cb(e,v[k]))},
  removeItem(k,cb){localStorage.removeItem('wm_native_pref_'+k);cb?.(null,true)}
 };
 const bridge={sessionKey:broker.session.key,userInfo:{user:{...broker.session.user,language_code:languageCode}},platform,version:'0.2.11',
  get isActive(){return active},get isFullscreen(){return !!document.fullscreenElement},
  requestFullscreen(){document.documentElement.requestFullscreen?.().catch(()=>{})},exitFullscreen(){document.exitFullscreen?.().catch(()=>{})},
  colorScheme:'dark',themeParams:{bg_color:'#071019',text_color:'#f4f7fa'},
  get viewportHeight(){return window.visualViewport?.height||innerHeight},get viewportStableHeight(){return stable},
  Storage:storage,ready(){},expand(){},disableVerticalSwipes(){},enableVerticalSwipes(){},enableClosingConfirmation(){},disableClosingConfirmation(){},
  isExpanded:true,isVersionAtLeast(){return false},
  onEvent(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn)},
  offEvent(name,fn){listeners.get(name)?.delete(fn)},
  BackButton:{show(){},hide(){},onClick(fn){back.add(fn)},offClick(fn){back.delete(fn)}},
  HapticFeedback:{impactOccurred(style){haptics.impact({style:style==='heavy'?'HEAVY':style==='medium'?'MEDIUM':'LIGHT'}).catch(()=>{})},notificationOccurred(){haptics.notification({type:'SUCCESS'}).catch(()=>{})},selectionChanged(){haptics.selectionChanged().catch(()=>{})}},
  openLink:open,showAlert(text,cb){alert(text);cb?.()},showConfirm(text,cb){cb?.(confirm(text))},
  showPopup(value,cb){alert(value.message||value.title||'');cb?.('ok')},close(){app.minimizeApp().catch(()=>{})},
  setBackgroundColor(){},setBottomBarColor(){},setHeaderColor(color){if(/^#[0-9a-f]{6}$/i.test(color)){statusBar.setBackgroundColor({color}).catch(()=>{});const n=parseInt(color.slice(1),16),light=((n>>16)*.299+((n>>8)&255)*.587+(n&255)*.114)>150;statusBar.setStyle({style:light?'LIGHT':'DARK'}).catch(()=>{})}}
 };
 window.WakhanNative=bridge;
 window.WAKHAN_NATIVE_N1={version:2,origin:broker.origin};
 window.addEventListener('resize',()=>{if(!document.activeElement?.matches('input,textarea,[contenteditable=true]'))stable=innerHeight;fire('viewportChanged')});
 window.visualViewport?.addEventListener('resize',()=>fire('viewportChanged'));
 return {open,fire,back,setActive(value){active=!!value;fire(active?'activated':'deactivated')}};
}
