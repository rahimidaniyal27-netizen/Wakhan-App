export function installSharing({origin}){
 async function share(text){
  try{if(navigator.share){await navigator.share({title:'Wakhan',text});return}
   await navigator.clipboard.writeText(text);window.WakhanNative?.showAlert(document.documentElement.lang==='en'?'Copied':'کاپی شد');
  }catch(error){if(error?.name!=='AbortError')window.WakhanNative?.showAlert(text)}
 }
 const app=()=>share(origin+'/');
 const room=code=>{if(!/^[A-Za-z0-9_-]{3,40}$/.test(String(code)))return;return share('Wakhan\n'+(document.documentElement.lang==='en'?'Hall code: ':'کد دنج: ')+code+'\n'+origin+'/')};
 window.WakhanSharing={app,room};return window.WakhanSharing;
}
