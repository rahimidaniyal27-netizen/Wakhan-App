/* Personal Mini App player only. Existing source, entitlement, FX and VC engines remain authoritative. */
(()=>{
'use strict';
if(window.WM74||typeof WN60==='undefined'||typeof au==='undefined')return;
const TEXT={
 fa:{"playing":"در حال پخش","seek":"زمان پخش","play":"پخش","pause":"توقف موقت","previous":"آهنگ قبلی","next":"آهنگ بعدی","shuffle":"پخش درهم","repeat":"تکرار","queue":"صف پخش","like":"پسندیدن","unlike":"برداشتن پسند","back":"بستن پلیر","playlist":"اضافه کدن به پلی‌لیست","group":"پخش در گروپ","fx":"صدای چرخشی 8D","on":"روشن","off":"خاموش","preparing":"آماده میشه…","seeking":"جای آهنگ عوض میشه…","buffering":"صدا آماده میشه…","seekFailed":"جای آهنگ عوض نشد؛ دوباره کوشش کو.","art":"کاور آهنگ","retry":"دوباره کوشش کو","audio":"صوتی"},
 en:{playing:'Now playing',seek:'Playback position',play:'Play',pause:'Pause',previous:'Previous track',next:'Next track',shuffle:'Shuffle',repeat:'Repeat',queue:'Queue',like:'Like',unlike:'Unlike',back:'Close player',playlist:'Add to playlist',group:'Play in a group',fx:'Rotating 8D audio',on:'On',off:'Off',preparing:'Preparing…',seeking:'Seeking…',buffering:'Buffering…',seekFailed:'Could not seek. Please try again.',art:'Album artwork',retry:'Retry',audio:'Audio'},
 ps:{playing:'اوس غږېږي',seek:'د غږولو وخت',play:'غږول',pause:'تمول',previous:'مخکینۍ سندره',next:'راتلونکې سندره',shuffle:'تصادفي غږول',repeat:'تکرار',queue:'د سندرو کتار',like:'خوښول',unlike:'خوښونه لرې کول',back:'پلیر بندول',playlist:'پلی‌لیست ته زیاتول',group:'په ګروپ کې غږول',fx:'څرخېدونکی 8D غږ',on:'روښانه',off:'بند',preparing:'چمتو کېږي…',seeking:'وخت بدلېږي…',buffering:'غږ ترلاسه کېږي…',seekFailed:'وخت بدل نه شو؛ بیا هڅه وکړئ.',art:'د سندرې انځور',retry:'بیا هڅه',audio:'غږیز'}
};
const tr=key=>(TEXT[LG]||TEXT.fa)[key]||TEXT.en[key]||key;
const paths={
 play:'<path d="m9 4 12 8-12 8Z" fill="currentColor" stroke="none"/>',
 pause:'<path d="M7 5h4v14H7Zm6 0h4v14h-4Z" fill="currentColor" stroke="none"/>',
 previous:'<path d="M5 5h2v14H5Zm13 0L8 12l10 7Z" fill="currentColor" stroke="none"/>',
 next:'<path d="M17 5h2v14h-2ZM6 5l10 7-10 7Z" fill="currentColor" stroke="none"/>',
 shuffle:'<path d="M3 6h3c5 0 7 12 12 12h3M17 14l4 4-4 4M3 18h3c2 0 4-3 6-6s4-6 6-6h3M17 2l4 4-4 4"/>',
 repeat:'<path d="m17 2 4 4-4 4M3 10V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 14v2a2 2 0 0 1-2 2H3"/>',
 queue:'<path d="M3 5h18M3 10h18M3 15h10M3 20h10"/><path d="m17 14 5 4-5 4Z" fill="currentColor" stroke="none"/>',
 close:'<path d="m5 8 7 7 7-7"/>',
 heart:'<path class="wm74-heart-shape" d="M20.8 4.8a5.3 5.3 0 0 0-7.5 0L12 6.1l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.7a5.3 5.3 0 0 0 0-7.5Z"/>',
 add:'<path d="M12 4v16M4 12h16"/>',
 music:'<path d="M10 18V5l10-2v13M10 8l10-2"/><ellipse cx="6" cy="18" rx="4" ry="3"/><ellipse cx="16" cy="16" rx="4" ry="3"/>'
};
const icon=(key,cls='')=>`<svg class="wm74-icon ${key==='heart'?'wm74-heart ':''}${h(cls)}" data-player74="${h(key)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[key]||''}</svg>`;
const state={open:false,key:'',drag:false,dirty:false,preview:null,dragKey:null,pointer:null,pending:null,raf:0,lastPaint:-Infinity,els:{},likes:new Map(),waiting:false,notice:''};
const byId=id=>document.getElementById(id);
const canonical=track=>{try{return wnCanonical(track?.url||'')}catch(error){return String(track?.url||'')}};
const trackKey=()=>canonical(CUR)+'|'+String(AP.seq)+'|'+String(au.currentSrc||AP.source||au.src||'');
const finite=value=>Number.isFinite(Number(value))?Number(value):0;
function duration(){if(!CUR?.ready||LOADING)return Math.max(0,finite(CUR?.dur));const native=Number(au.duration);return Number.isFinite(native)&&native>0?native:Math.max(0,finite(CUR?.dur))}
function clamp(value,total=duration()){return Math.max(0,Math.min(total,finite(value)))}
function clock(value){const n=Math.max(0,Math.floor(finite(value))),s=String(n%60).padStart(2,'0'),m=Math.floor(n/60);return m>=60?Math.floor(m/60)+':'+String(m%60).padStart(2,'0')+':'+s:m+':'+s}
function actual(){return !CUR?.ready||LOADING?0:clamp(au.currentTime)}
function ready(){return !!CUR?.ready&&!LOADING&&!AP.busy&&au.readyState>=1&&Number.isFinite(Number(au.duration))&&Number(au.duration)>0&&(typeof wpAllowed!=='function'||wpAllowed())}
function visible(){const root=byId('fp');return document.visibilityState!=='hidden'&&!!root?.classList.contains('show')&&root.classList.contains('wm74-player')}
function existsLiked(track){const key=canonical(track);return (ME?.favs||[]).some(item=>canonical(item)===key)}
function liked(track){return state.likes.get(canonical(track))?.desired??existsLiked(track)}
function text(node,value){if(node&&node.textContent!==value)node.textContent=value}
function cancelDrag(){state.drag=false;state.dirty=false;state.preview=null;state.dragKey=null;state.pointer=null;state.els.seekBox?.classList.remove('is-scrubbing')}
function syncKey(){const key=trackKey();if(key!==state.key){cancelDrag();state.pending=null;state.waiting=false;state.notice='';state.key=key}return key}
function buffered(total){let end=0;try{for(let i=0;i<au.buffered.length;i++)end=Math.max(end,au.buffered.end(i))}catch(error){}return total>0?Math.min(100,Math.max(0,end/total*100)):0}
function paintHeart(button,track=CUR){if(!button||!track)return;const on=liked(track);button.classList.toggle('is-liked',on);button.classList.toggle('on',on);button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',tr(on?'unlike':'like'));button.disabled=state.likes.has(canonical(track))}
function controls(){
 const e=state.els;if(!e.play)return;
 const wait=!!LOADING||!CUR?.ready,shape=wait?'busy':au.paused?'play':'pause';
 if(e.play.dataset.shape!==shape){e.play.innerHTML=wait?'<span class="wm74-spinner" aria-hidden="true"></span>':icon(shape);e.play.dataset.shape=shape}
 e.play.disabled=wait;e.play.setAttribute('aria-label',tr(wait?'preparing':au.paused?'play':'pause'));e.play.setAttribute('aria-busy',String(wait));
 paintHeart(e.heart);
 for(const [node,on] of [[e.shuffle,!!WN60.shuffle],[e.repeat,!!WN60.repeat]])if(node){node.classList.toggle('is-on',on);node.setAttribute('aria-pressed',String(on))}
 if(e.repeat){e.repeat.classList.toggle('repeat-one',WN60.repeat===2);e.repeat.setAttribute('aria-label',tr('repeat')+(WN60.repeat===2?' · 1':''))}
 for(const node of [e.previous,e.next])if(node)node.disabled=!QUEUE.length;
 if(e.fx){e.fx.disabled=AP.busy||LOADING||!CUR?.ready;e.fx.setAttribute('aria-pressed',String(!!FX8));e.fx.classList.toggle('is-on',!!FX8);text(e.fxState,tr(AP.busy?'preparing':FX8?'on':'off'))}
}
function paint(){
 syncKey();if(!state.els.range)return;
 const e=state.els,total=duration();
 if(state.pending&&state.pending.key!==state.key)state.pending=null;
 if(state.pending&&performance.now()>state.pending.until&&!au.seeking){state.pending=null;state.notice=tr('seekFailed')}
 const position=clamp(state.drag&&state.preview!==null?state.preview:state.pending?state.pending.target:actual(),total),percent=total?position/total*100:0;
 if(!state.drag){e.range.max=String(total||1);e.range.value=String(position)}
 e.range.disabled=!ready();e.range.setAttribute('aria-valuetext',clock(position)+' / '+(total?clock(total):'—:—'));
 e.seekBox.style.setProperty('--wm74-progress',percent+'%');e.fill.style.width=percent+'%';e.buffer.style.width=buffered(total)+'%';
 text(e.elapsed,clock(position));text(e.total,total?clock(total):'—:—');text(e.preview,clock(position));
 const status=LOADING?tr('preparing'):state.pending?tr('seeking'):state.waiting&&!au.paused?tr('buffering'):state.notice||WN60.error||'';
 text(e.status,status);controls();
}
function frame(now){state.raf=0;if(!visible())return;if(now-state.lastPaint>=50){state.lastPaint=now;paint()}if(!au.paused||state.drag||state.pending)state.raf=requestAnimationFrame(frame)}
function schedule(){if(visible()&&!state.raf&&(!au.paused||state.drag||state.pending))state.raf=requestAnimationFrame(frame)}
function update(){if(visible()){paint();schedule()}}
function begin(event){
 if(!ready())return;syncKey();state.drag=true;state.dirty=false;state.dragKey=state.key;state.preview=actual();state.pointer=event?.pointerId??null;state.notice='';state.els.seekBox.classList.add('is-scrubbing');schedule();
}
function input(event){
 if(!ready())return;if(!state.drag)begin(event);if(!state.drag||state.dragKey!==trackKey())return;
 state.preview=clamp(event?.target?.value??state.els.range.value);state.dirty=true;state.els.seekBox.classList.add('is-scrubbing');paint();
}
function seek(value,key=trackKey()){
 if(!ready()||key!==trackKey())return false;
 const target=clamp(value);state.pending={target,key,until:performance.now()+5000};state.notice='';
 try{au.currentTime=target}catch(error){state.pending=null;state.notice=tr('seekFailed');update();return false}
 update();return true;
}
function finish(){
 if(!state.drag)return;const key=state.dragKey,value=state.preview,dirty=state.dirty;cancelDrag();if(dirty&&key===trackKey())seek(value,key);else update();
}
function cancel(){if(!state.drag)return;cancelDrag();update()}
function keyboard(event){
 if(!ready())return;const total=duration(),base=state.pending?.target??actual(),step=event.shiftKey?15:5;let target;
 switch(event.key){case'ArrowLeft':case'ArrowDown':target=base-step;break;case'ArrowRight':case'ArrowUp':target=base+step;break;case'Home':target=0;break;case'End':target=total;break;case'PageDown':target=base-total*.1;break;case'PageUp':target=base+total*.1;break;default:return}
 event.preventDefault();cancelDrag();seek(target);
}
function bind(){
 const ids={range:'wm74-seek',seekBox:'wm74-seek-box',fill:'wm74-progress',buffer:'wm74-buffer',elapsed:'wm74-elapsed',total:'wm74-duration',preview:'wm74-preview',status:'wm74-status',play:'wm74-play',heart:'wm74-like',shuffle:'wm74-shuffle',repeat:'wm74-repeat',previous:'wm74-previous',next:'wm74-next',fx:'wm74-fx',fxState:'wm74-fx-state'};
 state.els=Object.fromEntries(Object.entries(ids).map(([key,id])=>[key,byId(id)]));
 const range=state.els.range;range.addEventListener('pointerdown',begin);range.addEventListener('input',input);range.addEventListener('change',finish);range.addEventListener('pointerup',finish);range.addEventListener('pointercancel',cancel);range.addEventListener('keydown',keyboard);
 // Older WebViews dispatch touch events without Pointer Events.
 if(!window.PointerEvent){range.addEventListener('touchstart',begin,{passive:true});range.addEventListener('touchend',finish);range.addEventListener('touchcancel',cancel)}
}
function cover(){return `<div class="wm74-cover">${CUR.thumb?`<img src="${h(CUR.thumb)}" alt="${h(tr('art'))}" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false">`:''}<span class="wm74-cover-fallback" ${CUR.thumb?'hidden':''}>${icon('music')}</span></div>`}
drawFP=function(){
 if(!CUR)return;syncKey();cancelDrag();const root=byId('fp'),provider=wnProvider(CUR),total=duration(),position=actual(),name=provider==='sc'?'SoundCloud':provider==='yt'?'YouTube':'Wakhan';
 root.classList.remove('py21-mode');root.classList.add('wm74-player');
 root.innerHTML=`<main class="wm74-shell"><div class="wm74-top"><button type="button" onclick="closeFP()" aria-label="${h(tr('back'))}">${icon('close')}</button><div><small>${h(tr('playing'))}</small><b>${h(name)} · ${h(tr('audio'))}</b></div><button type="button" onclick="wnQueueSheet()" aria-label="${h(tr('queue'))}">${icon('queue')}</button></div>${cover()}<div class="wm74-track"><div><h1 dir="auto">${h(CUR.title||'Wakhan Music')}</h1><p dir="auto">${h(CUR.artist||CUR.ch||'')}</p></div><button type="button" id="wm74-like" class="${liked(CUR)?'is-liked':''}" onclick="favToggle('CUR',0,this)" aria-label="${h(tr(liked(CUR)?'unlike':'like'))}" aria-pressed="${liked(CUR)}">${icon('heart')}</button></div><div class="wm74-timeline"><div id="wm74-seek-box" class="wm74-seek-box" style="--wm74-progress:${total?position/total*100:0}%"><div class="wm74-rail" aria-hidden="true"><i id="wm74-buffer"></i><i id="wm74-progress" style="width:${total?position/total*100:0}%"></i></div><output id="wm74-preview" class="wm74-preview" aria-hidden="true">${clock(position)}</output><input id="wm74-seek" type="range" min="0" max="${total||1}" step="0.01" value="${position}" aria-label="${h(tr('seek'))}" dir="ltr" ${ready()?'':'disabled'}></div><div class="wm74-times" dir="ltr"><span id="wm74-elapsed">${clock(position)}</span><span id="wm74-duration">${total?clock(total):'—:—'}</span></div></div><div class="wm74-controls" dir="ltr"><button type="button" id="wm74-shuffle" onclick="wm74Shuffle()" aria-label="${h(tr('shuffle'))}" aria-pressed="${!!WN60.shuffle}">${icon('shuffle')}</button><button type="button" id="wm74-previous" onclick="nextTrack(-1)" aria-label="${h(tr('previous'))}">${icon('previous')}</button><button type="button" id="wm74-play" class="wm74-main-play" onclick="togglePlay()" aria-label="${h(tr(au.paused?'play':'pause'))}">${icon(au.paused?'play':'pause')}</button><button type="button" id="wm74-next" onclick="nextTrack(1)" aria-label="${h(tr('next'))}">${icon('next')}</button><button type="button" id="wm74-repeat" onclick="wnLoop()" aria-label="${h(tr('repeat'))}" aria-pressed="${!!WN60.repeat}">${icon('repeat')}<small class="wm74-repeat-one">1</small></button></div><div class="wm74-actions"><button type="button" onclick="wnSaveTrack('CUR',0)">${icon('add')}<span>${h(tr('playlist'))}</span></button>${ME?.groups?.length?`<button type="button" onclick="toGroup('CUR',0)">${h(tr('group'))}</button>`:''}${provider==='sc'?`<button type="button" id="wm74-fx" class="wm74-fx" onclick="fx8()" aria-label="${h(tr('fx'))}" aria-pressed="${!!FX8}"><bdi>8D</bdi><span id="wm74-fx-state">${h(tr(FX8?'on':'off'))}</span></button>`:''}</div><p id="wm74-status" class="wm74-status" role="status" aria-live="polite"></p>${WN60.error&&!LOADING?`<button type="button" class="wm74-retry" onclick="playCur()">${h(tr('retry'))}</button>`:''}</main>`;
 bind();paint();schedule();
};
window.wm74Shuffle=function(){WN60.shuffle=!WN60.shuffle;controls();if(typeof hap==='function')hap()};
const oldClose=closeFP;closeFP=function(){cancelDrag();state.pending=null;if(state.raf)cancelAnimationFrame(state.raf);state.raf=0;return oldClose()};
const oldMini=miniUpd;miniUpd=function(){oldMini();const button=byId('mpp');if(button&&CUR){button.classList.add('wm74-mini-play');button.innerHTML=LOADING?'<span class="wm74-spinner" aria-hidden="true"></span>':icon(au.paused?'play':'pause');button.setAttribute('aria-label',tr(LOADING?'preparing':au.paused?'play':'pause'))}const next=byId('mini')?.querySelector('button[onclick*="nextTrack"]');if(next)next.innerHTML=icon('next')};
const oldIcon=wnIcon;wnIcon=function(key,cls=''){return key==='heart'?icon('heart',cls):oldIcon(key,cls)};
const oldFav=favToggle;
favToggle=async function(list,index,button){
 const track=listOf(list)?.[index];if(!track)return;const key=canonical(track);if(state.likes.has(key)||button?.disabled)return;
 state.likes.set(key,{desired:!existsLiked(track)});paintHeart(button,track);if(canonical(CUR)===key)paintHeart(state.els.heart);
 try{return await oldFav(list,index,button)}finally{state.likes.delete(key);paintHeart(button,track);if(visible())paintHeart(state.els.heart);document.querySelectorAll('.wn-row-action .wm74-heart').forEach(node=>{const b=node.closest('button');if(b)b.classList.toggle('wm74-liked',b.classList.contains('on'))})}
};
for(const name of ['timeupdate','durationchange','loadedmetadata','canplay','progress','play','playing','pause','seeking','seeked','waiting','stalled','error','emptied'])au.addEventListener(name,()=>{
 if(name==='emptied'){cancelDrag();state.pending=null;state.notice=''}
 if(name==='waiting'||name==='stalled')state.waiting=true;
 if(name==='playing'||name==='canplay'||name==='seeked')state.waiting=false;
 if(name==='seeked'&&state.pending&&state.pending.key===trackKey()&&Math.abs(finite(au.currentTime)-state.pending.target)<.3)state.pending=null;
 if(name==='error')state.waiting=false;
 if(name==='error'&&state.pending){state.pending=null;state.notice=tr('seekFailed')}
 update();
});
window.addEventListener('pointerup',event=>{if(state.drag&&(state.pointer===null||event.pointerId===state.pointer))finish()});
window.addEventListener('pointercancel',cancel);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){cancelDrag();if(state.raf)cancelAnimationFrame(state.raf);state.raf=0}else update()});
window.WM74={state,icon,clock,duration,ready,seek,begin,input,finish,cancel,keyboard,paint,controls,trackKey,liked,version:74};
miniUpd();if(byId('fp')?.classList.contains('show')&&CUR)drawFP();
})();
