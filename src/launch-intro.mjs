export function launchIntro({logo,document:doc=globalThis.document,window:win=globalThis.window}={}){
 if(win.__wkLaunchShown)return;win.__wkLaunchShown=true;
 const node=doc.createElement('div');node.id='wk-launch-intro';node.setAttribute('aria-hidden','true');
 const image=doc.createElement('img');image.src=logo;image.alt='';node.append(image);doc.documentElement.append(node);
 let closed=false;
 function close(){if(closed)return;closed=true;node.classList.add('wk-intro-out');setTimeout(()=>node.remove(),180)}
 node.addEventListener('pointerdown',close,{once:true});setTimeout(close,win.matchMedia?.('(prefers-reduced-motion: reduce)').matches?180:800);
 return close;
}
