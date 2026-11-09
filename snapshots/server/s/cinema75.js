/* WAKHAN CINEMA 75: presentation only. Existing gate, room and playback engines stay authoritative. */
(()=>{
'use strict';
if(window.WM75||typeof WMP==='undefined'||typeof CG==='undefined')return;
const COPY={fa:{"joinHint":"کد رفیقت ره بته؛ یک‌جا ببینین.","ownHint":"سینمایت همیشه با همی حساب در دسترس است.","copy":"کاپی کدن کد سینما","join":"ورود","back":"پس رفتن","menu":"منوی سینما","invalid":"کد سینما باید ۴ تا ۸ حرف یا عدد انگلیسی باشد.","joining":"در حال ورود…","joinFailed":"داخل نشد؛ دوباره کوشش کو.","password":"رمز سینما","confirm":"تکرار رمز","show":"نشان‌دادن رمز","hide":"پت کدن رمز"},en:{joinHint:'Enter your friend’s code to watch together.',ownHint:'Your cinema stays connected to your account.',copy:'Copy cinema code',join:'Join',back:'Back',menu:'Cinema menu',invalid:'Use a cinema code of 4–8 English letters or digits.',joining:'Joining…',joinFailed:'Could not join. Please try again.',password:'Cinema password',confirm:'Repeat password',show:'Show password',hide:'Hide password'},ps:{joinHint:'د ملګري کوډ ولیکئ او یوځای وګورئ.',ownHint:'ستاسو سینما له همدې حساب سره خوندي ده.',copy:'د سینما کوډ کاپي',join:'ننوتل',back:'شاته',menu:'د سینما مېنو',invalid:'کوډ باید له ۴ تر ۸ انګلیسي تورو یا شمېرو وي.',joining:'ننوتل…',joinFailed:'ننوتل ونه شول؛ بیا هڅه وکړئ.',password:'د سینما رمز',confirm:'رمز بیا ولیکئ',show:'رمز وښایئ',hide:'رمز پټ کړئ'}};
const tr=k=>(COPY[LG]||COPY.fa)[k]||COPY.en[k]||k,state={joining:false};
const paths={home:'<path d="m3 11 9-8 9 8v10h-6v-7H9v7H3Z"/>',hall:'<path d="M3 4h18v11H3ZM6 15v6m12-6v6M2 21h20"/><path d="m10 7 5 3-5 3Z"/>',history:'<path d="M3 11a9 9 0 1 1 2.6 7.2M3 4v7h7m2-5v6l4 2"/>',copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',invite:'<path d="m3 4 19 8L3 20l3-8Zm3 8h16"/>',rotate:'<path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/>',enter:'<path d="M14 3h7v18h-7M3 12h13m-5-5 5 5-5 5"/>',add:'<path d="M12 4v16M4 12h16"/>',back:'<path d="m15 5-7 7 7 7"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',ticket:'<path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Zm12 0v3m0 3v2m0 3v3"/>'};
function icon(key){return `<svg class="wm75-icon" data-wm75-icon="${h(key)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[key]||paths.hall}</svg>`}
function art(key='popcorn',cls=''){return `<span class="wm75-art ${h(cls)}" data-wm75-art="${key}" aria-hidden="true"><img src="/s/wm75_${key}.webp?v=75" alt="" width="192" height="192" decoding="async" draggable="false" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="wm75-art-fallback" hidden>${icon('hall')}</span></span>`}
function layout(){document.body.classList.add('wm75-lobby-mode')}
function head(tabs=true){return `<header class="wm75-heading"><button type="button" onclick="go('p')" aria-label="${h(tr('back'))}">${icon('back')}</button><div><small>WAKHAN CINEMA</small><h1>${h(wmpT('brand'))}</h1></div>${art('popcorn','wm75-heading-art')}</header>${tabs?nhTabs():''}`}
const oldIcon=wnIcon;wnIcon=function(key,cls=''){if(['cinema','popcorn','film','movie'].includes(key))return art('popcorn',cls);if(['camera','vintage_camera'].includes(key))return art('camera',cls);return oldIcon(key,cls)};
const oldAe=ae;
ae=function(value,cls=''){
 const clean=String(value).replace(/[\ufe0e\ufe0f]/g,'');
 if(['🍿','🎬'].includes(clean))return art('popcorn',cls);
 if(clean==='🎥')return art('camera',cls);
 if(TAB==='c'){const key={'🎟':'ticket','🏠':'home','🕘':'history','🕒':'history','📤':'invite','🔐':'rotate'}[clean];if(key)return icon(key)}
 return oldAe(value,cls);
};
nhTabs=function(){return `<nav class="wm75-tabs" aria-label="${h(nhT('navigation'))}">${['home','hall','hist'].map((key,i)=>`<button type="button" ${CV===key?'class="is-active" aria-current="page"':''} onclick="wmcPage('${key}')">${icon(['home','hall','history'][i])}<span>${h(nhT(key))}</span></button>`).join('')}</nav>`};
wmcHomeHead=function(){layout();return head()};
wmpBrand=function(){return `<div class="wm75-brand">${art()}<b>${h(wmpT('brand'))}</b></div>`};
const oldHead=wmcHead;wmcHead=function(){if(CID)return oldHead();layout();return head(false)};
wmpMineMarkup=function(){
 if(WMP.mine){const c=WMP.mine;return `<div class="wm75-own"><div class="wm75-own-title">${icon('hall')}<div><small>${h(wmpT('mine'))}</small><h2 dir="auto">${h(c.name)}</h2></div><span class="wm75-permanent">${h(wmpT('permanent'))}</span></div><p class="wm75-caption">${h(tr('ownHint'))}</p><div class="wm75-code"><div><small>${h(wmpT('code'))}</small><bdi>${h(c.code)}</bdi></div><button type="button" onclick="wmpCopy()" aria-label="${h(tr('copy'))}">${icon('copy')}</button></div><div class="wm75-own-actions"><button type="button" class="wm75-primary" onclick="wmpEnterMine()">${icon('enter')}<span>${h(wmpT('join'))}</span></button><button type="button" class="wm75-secondary" onclick="wmpShareMine()">${icon('invite')}<span>${h(wmpT('invite'))}</span></button></div><button type="button" class="wm75-change-code" onclick="wmrConfirmRotate()" ${WMR.rotating?'disabled':''}>${icon('rotate')}<span>${h(wmrT('rotate'))}</span></button></div>`}
 if(WMP.error)return `<div class="wm75-load-state"><p role="alert">${h(wmpT('failed'))}</p><button type="button" class="wm75-secondary" onclick="wmpFetchMine()">${h(wmpT('retry'))}</button></div>`;
 if(!WMP.loaded)return `<div class="wm75-load-state" role="status"><span class="wm75-spinner" aria-hidden="true"></span>${h(wmpT('loading'))}</div>`;
 const name=typeof WM70!=='undefined'&&WM70.self?.name||ME?.me?.name||'';
 return `<div class="wm75-create"><h2>${h(wmpT('mine'))}</h2><p class="wm75-caption">${h(wmpT('create_hint'))}</p><form onsubmit="event.preventDefault();wmpCreate()"><label for="wmp-name">${h(wmpT('name'))}</label><input id="wmp-name" maxlength="60" autocomplete="off" value="${h(name)}" dir="auto"><button id="wmp-create" type="submit" class="wm75-primary" ${WMP.busy?'disabled':''}>${icon('add')}<span>${h(wmpT(WMP.busy?'creating':'create'))}</span></button></form></div>`;
};
rRoomGate=function(){
 if(!wpAllowed())return wpLockPage();if(!CG.token)return cgRender();
 document.body.classList.remove('wmc-hall-active');layout();
 V().innerHTML=`<main class="wm75-page">${head()}<section class="wm75-lobby" aria-label="${h(wmpT('brand'))}"><div class="wm75-intro">${art('popcorn','wm75-lobby-art')}<div><h2>${h(wmpT('brand'))}</h2><p>${h(wmpT('hint'))}</p></div></div><div class="wm75-friend"><h2>${h(wmpT('friend'))}</h2><p class="wm75-caption">${h(tr('joinHint'))}</p><form class="wm75-code-form" onsubmit="event.preventDefault();wm75Join()"><label class="wm75-visually-hidden" for="rc">${h(wmpT('friend_code'))}</label><input id="rc" maxlength="8" minlength="4" autocapitalize="characters" autocomplete="off" spellcheck="false" dir="ltr" inputmode="text" enterkeyhint="go" placeholder="${h(wmpT('friend_code'))}" aria-describedby="wm75-join-status" ${state.joining?'disabled':''}><button id="wm75-join" class="wm75-primary" type="submit" ${state.joining?'disabled':''}>${icon('enter')}<span>${h(tr(state.joining?'joining':'join'))}</span></button></form><p id="wm75-join-status" class="wm75-form-status" role="status" aria-live="polite"></p></div><div id="wmp-own-slot" class="wm75-own-slot">${wmpMineMarkup()}</div></section></main>`;
 // Update only the own-cinema slot when the request completes: the friend's draft keeps its focus and text.
 wmpFetchMine();
};
window.wm75Join=async function(){
 if(state.joining||!CG.token)return;const input=document.getElementById('rc'),status=document.getElementById('wm75-join-status'),button=document.getElementById('wm75-join'),code=String(input?.value||'').trim().toUpperCase();
 if(!/^[A-Z0-9]{4,8}$/.test(code)){if(status)status.textContent=tr('invalid');input?.focus();return}
 state.joining=true;if(status)status.textContent=tr('joining');if(button)button.disabled=true;if(input)input.disabled=true;
 let failed=false;try{await joinRoom(code)}catch(error){failed=true;if(status?.isConnected)status.textContent=tr('joinFailed')}finally{state.joining=false;if(button?.isConnected)button.disabled=false;if(input?.isConnected)input.disabled=false;if(status?.isConnected&&!failed)status.textContent=''}
};
function passwordField(id,label,autocomplete,placeholder){return `<label for="${id}">${h(label)}</label><div class="wm75-password"><input id="${id}" type="password" autocomplete="${autocomplete}" minlength="6" maxlength="128" required placeholder="${h(placeholder)}"><button type="button" onclick="wm75Password('${id}',this)" aria-label="${h(tr('show'))}" aria-pressed="false">${icon('eye')}</button></div>`}
window.wm75Password=function(id,button){const input=document.getElementById(id);if(!input||!['cg-password','cg-confirm'].includes(id))return;const show=input.type==='password';input.type=show?'text':'password';button.setAttribute('aria-pressed',String(show));button.setAttribute('aria-label',tr(show?'hide':'show'))};
cgMarkup=function(){
 layout();const setup=CG.configured===false;
 return `<main class="wm75-page wm75-unlock-page">${head(false)}<section class="wm75-gate" aria-label="${h(cgT(setup?'setup':'unlock'))}">${art('camera','wm75-camera-art')}<small>${h(cgT('title'))}</small><h2>${h(cgT(setup?'setup':'unlock'))}</h2><p class="wm75-caption">${h(cgT('hint'))}</p>${CG.loading?`<div class="wm75-load-state" role="status"><span class="wm75-spinner" aria-hidden="true"></span>${h(wmpT('loading'))}</div>`:CG.configured===null?`<button type="button" class="wm75-secondary" onclick="cgStatus()">${h(cgT('retry'))}</button>`:`<form onsubmit="event.preventDefault();cgSubmit()">${passwordField('cg-password',tr('password'),setup?'new-password':'current-password',cgT('password'))}${setup?passwordField('cg-confirm',tr('confirm'),'new-password',cgT('confirm')):''}<button class="wm75-primary" type="submit" ${CG.busy?'disabled aria-busy="true"':''}>${icon('enter')}<span>${h(cgT(setup?'create':'enter'))}</span></button></form>${CG.recovery?`<button type="button" class="wm75-recover" onclick="tg?.openTelegramLink(CG.recovery)">${h(cgT('forgot'))}</button>`:''}`}${CG.error?`<p role="alert" class="wm75-error">${h(cgT(CG.error))}</p>`:''}</section></main>`;
};
// Product72 also renders some category art through a private helper. Replace those
// specific legacy nodes after rendering, so Home and bottom navigation share the brand.
function rebrand(root=document){
 for(const node of root.querySelectorAll('[data-wn-key="cinema"]')){
  if(!node.isConnected)continue;const holder=document.createElement('span');holder.innerHTML=art();node.replaceWith(holder.firstElementChild);
 }
}
const oldCinema=rCinema;rCinema=function(){document.body.classList.remove('wm75-lobby-mode');const value=oldCinema();rebrand();return value};
const oldNav=renderNav;renderNav=function(){const value=oldNav();rebrand();return value};
const oldRender=render;render=function(){if(TAB!=='c')document.body.classList.remove('wm75-lobby-mode');const value=oldRender();rebrand();return value};
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;rebrand()})});
for(const id of ['view','nav','sheet']){const target=document.getElementById(id);if(target)observer.observe(target,{childList:true,subtree:true})}
window.WM75={version:75,icon,art,state,rebrand};
renderNav();if(TAB==='c')rCinema();
})();
