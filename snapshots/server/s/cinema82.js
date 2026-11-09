/* Cinema hierarchy and restored navigation. Room, auth, media, fetch and form handlers remain authoritative. */
(()=>{
'use strict';if(window.WM82||typeof WM75==='undefined'||typeof nhTabs!=='function')return;
nhTabs=function(){return `<nav class="wm82-cinema-tabs nh-tabs wmc-home-tabs" aria-label="${h(nhT('navigation'))}">${['home','hall','hist'].map((key,i)=>`<button type="button" class="${CV===key?'is-active':''}" ${CV===key?'aria-current="page"':''} onclick="wmcPage('${key}')">${WM75.icon(['home','hall','history'][i])}<span>${h(nhT(key))}</span></button>`).join('')}</nav>`};
function arrange(){
 if(TAB!=='c'||CID||!CG.token||!wpAllowed())return;
 const view=V(),lobby=view?.querySelector('.wm75-lobby');if(!lobby)return;
 lobby.classList.add('wm82-lobby');const own=lobby.querySelector('#wmp-own-slot'),friend=lobby.querySelector('.wm75-friend');
 // Move the original nodes: drafts, focus, async slot updates and handlers stay attached.
 if(own&&friend&&own.nextElementSibling!==friend)lobby.insertBefore(own,friend);
 const page=view.querySelector('.wm75-page');
 if(page&&!page.querySelector('.wm82-cinema-tabs')){page.querySelectorAll(':scope > .wm75-tabs,:scope > .nh-tabs,:scope > .wmc-home-tabs').forEach(n=>n.remove());page.querySelector('.wm75-heading')?.insertAdjacentHTML('afterend',nhTabs())}
}
const originalLobby=rRoomGate;rRoomGate=function(...args){const value=originalLobby.apply(this,args);arrange();return value};
window.WM82={version:82,arrange};arrange();
})();
