export function launchIntro({document:doc=globalThis.document,window:win=globalThis.window}={}){
 if(win.__wkLaunchShown)return;win.__wkLaunchShown=true;
 const node=doc.createElement('div');node.id='wk-launch-intro';node.setAttribute('aria-hidden','true');
 node.innerHTML="<div class=\"wm-intro-lockup\"><svg class=\"wm-intro-mark\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"20 25 87 80\" width=\"96\" height=\"96\" focusable=\"false\"><path fill=\"#fff\" d=\"M26.8 41.1 45.4 34.3C38.8 44.2 38.0 59.9 46.3 73.4L64 43.9 80.8 73.4C88.1 59.7 90.0 44.2 82.3 34.3L100.5 41.1C101 62.0 91.4 82.9 77.1 95.1L63.7 65.3 49.4 95.1C34.6 82.2 25.9 61.8 26.8 41.1Z\"/></svg><div class=\"wm-intro-name\"><div class=\"wm-intro-words\"><span class=\"wm-intro-akhan\"><span>A</span><span>K</span><span>H</span><span>A</span><span>N</span></span><span class=\"wm-intro-live\"><span>L</span><span>i</span><span>v</span><span>e</span></span></div></div></div>";doc.documentElement.append(node);
 let closed=false;
 function close(){if(closed)return;closed=true;node.classList.add('wk-intro-out');setTimeout(()=>node.remove(),280)}
 node.addEventListener('pointerdown',close,{once:true});setTimeout(close,1720);
 return close;
}
