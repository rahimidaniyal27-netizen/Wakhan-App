/* Wakhan product shell: existing audio, cinema, social and purchase engines remain authoritative. */
(()=>{
'use strict';
if(window.WM72||typeof WM70==='undefined')return;
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const state={nodes:new Set(),visible:new Set(),active:new Set(),queued:false,serial:0,reduced:window.matchMedia?.('(prefers-reduced-motion: reduce)')};
const COPY={
 fa:{"welcome":"واخان، جای آهنگ و رفاقت.","discover":"امروز چی گوش می‌کنی؟","search":"آهنگ، آوازخوان یا لینک…","jump":"دسترسی سریع","continue":"از همیجه ادامه بته","recent":"تازه شنیدی","library":"کتابخانهٔ تو","listen":"موسیقی","watch":"سینما با رفیقا","watchHint":"یک‌جا ببینین، چت کنین و خوش باشین","openCinema":"داخل سینما شو","groups":"گروپ‌های تو","groupHint":"آهنگ ره با گروپت شریک کو","musicHint":"پیدا کو، ثبت کو و باز بشنو.","allMusic":"پیدا کدن آهنگ","yourLibrary":"کتابخانه","personal":"پروفایل شخصی","account":"حساب و اشتراک","settings":"تنظیمات","support":"راهنما و کمک","profile":"حساب مه","edit":"تغییرات","wallet":"بکس پیسه","subscription":"اشتراک","friends":"رفیقا","details":"معلومات حساب","back":"پس رفتن","create":"جور کدن پلی‌لیست","newPlaylist":"برای حال‌وهوایت یک پلی‌لیست جور کو","emptyMusic":"آهنگ بعدی‌ات ره پیدا کو","emptyHint":"نام آهنگ یا آوازخوان ره در بخش موسیقی جستجو کو.","more":"بیشتر","viewGroups":"دیدن گروپ‌ها","openChat":"چت‌ها","audio":"پلیر صوتی","chat":"چت‌ها","home":"خانه","appearance":"ظاهر برنامه","hall":"سالون‌ها","cinema":"سینما","noGroups":"گروپ‌هایت ره به واخان وصل کو","noGroupsHint":"ربات ره اضافه کو؛ گروپ‌هایت ایجه پیدا میشن."},
 en:{welcome:'Your space. Your rhythm.',discover:'What sounds good today?',search:'Song, artist or link…',jump:'Your shortcuts',continue:'Pick up where you left off',recent:'Recently played',library:'Your library',listen:'Music',watch:'Cinema, together',watchHint:'Watch, talk and share the moment',openCinema:'Enter cinema',groups:'Your groups',groupHint:'Bring your music to the group',musicHint:'Discover it. Save it. Play it again.',allMusic:'Discover',yourLibrary:'Library',personal:'Personal profile',account:'Account & membership',settings:'Settings',support:'Help & support',profile:'Account',edit:'Edit',wallet:'Wallet',subscription:'Membership',friends:'Friends',details:'Account details',back:'Back',create:'New playlist',newPlaylist:'Make a playlist for your mood',emptyMusic:'Find your next favorite',emptyHint:'Search for a song or artist in Music.',more:'More',viewGroups:'View groups',openChat:'Chats',audio:'Audio player',chat:'Chats',home:'Home',appearance:'Appearance',hall:'Rooms',cinema:'Cinema',noGroups:'Connect your groups to Wakhan',noGroupsHint:'Add the bot to make your groups available here.'},
 ps:{welcome:'ستاسو ځای، ستاسو ریتم.',discover:'نن څه اورئ؟',search:'سندره، سندرغاړی یا لینک…',jump:'چټک لاسرسی',continue:'له همدې ځایه دوام ورکړئ',recent:'وروستي اورېدلي',library:'ستاسو کتابتون',listen:'موسیقي',watch:'سینما له ملګرو سره',watchHint:'کتل، خبرې او ګډې شېبې',openCinema:'سینما ته ننوتل',groups:'ستاسو ګروپونه',groupHint:'موسیقي له خپل ګروپ سره شریکه کړئ',musicHint:'پیدا یې کړئ، وساتئ او بیا یې واورئ.',allMusic:'موسیقي ولټوئ',yourLibrary:'کتابتون',personal:'شخصي پروفایل',account:'حساب او ګډون',settings:'تنظیمات',support:'مرسته او ملاتړ',profile:'زما حساب',edit:'سمول',wallet:'بټوه',subscription:'ګډون',friends:'ملګري',details:'د حساب معلومات',back:'بېرته',create:'نوی پلی‌لیست',newPlaylist:'د خپل مزاج لپاره پلی‌لیست جوړ کړئ',emptyMusic:'خپله بله سندره ومومئ',emptyHint:'د موسیقۍ په برخه کې سندره یا سندرغاړی ولټوئ.',more:'نور',viewGroups:'ګروپونه وګورئ',openChat:'خبرې',audio:'غږیز پلیر',chat:'خبرې',home:'کور',appearance:'بڼه',hall:'سالونونه',cinema:'سینما',noGroups:'خپل ګروپونه له واخان سره ونښلوئ',noGroupsHint:'ربات زیات کړئ، ګروپونه به دلته ښکاره شي.'}
};
const tx=key=>(COPY[LG]||COPY.fa)[key]||COPY.en[key]||key;
const icons={
 chat:'<path d="M9 10h46v33H31L15 54V43H9Z"/><circle cx="22" cy="26" r="3" fill="black"/><circle cx="32" cy="26" r="3" fill="black"/><circle cx="42" cy="26" r="3" fill="black"/>',
 mic:'<rect x="23" y="6" width="18" height="33" rx="9"/><path d="M14 28v5a18 18 0 0 0 36 0v-5M32 51v8M22 59h20" fill="none" stroke="white" stroke-width="5"/>',
 video:'<rect x="7" y="16" width="35" height="32" rx="7"/><path d="m42 25 15-9v32l-15-9Z"/>',
 expand:'<path d="M8 26V8h18M38 8h18v18M56 38v18H38M26 56H8V38" fill="none" stroke="white" stroke-width="6"/>',
 shrink:'<path d="M8 25h17V8M39 8v17h17M56 39H39v17M25 56V39H8" fill="none" stroke="white" stroke-width="6"/>',
 logout:'<path d="M28 9H9v46h19M34 20l14 12-14 12M23 32h31" fill="none" stroke="white" stroke-width="6"/>',
 fire:'<path d="M33 4C38 23 52 24 53 39A21 21 0 0 1 11 39c0-9 6-17 13-24-1 10 4 12 7 14 4-8 5-17 2-25Z"/>',
 spotify:'<circle cx="32" cy="32" r="28"/><path d="M15 24q18-7 35 3M17 34q16-6 30 3M20 44q12-4 23 2" fill="none" stroke="black" stroke-width="5" stroke-linecap="round"/>',
 soundcloud:'<path d="M3 33h4v15H3Zm7-8h4v23h-4Zm7-7h4v30h-4Zm7-5h4v35h-4Zm8 10a14 14 0 0 1 27 5c8 1 7 20-3 20H32Z"/>',
 youtube:'<rect x="3" y="11" width="58" height="42" rx="12"/><path d="m27 21 18 11-18 11Z" fill="black"/>',
 history:'<path d="M13 20a23 23 0 1 1-3 25M13 7v15H2M32 17v17l12 7" fill="none" stroke="white" stroke-width="5"/>',
 transfer:'<path d="M6 20h47L42 9M58 44H11l11 11" fill="none" stroke="white" stroke-width="6" stroke-linejoin="round"/>',
 playlist:'<path d="M7 10h42v7H7Zm0 15h32v7H7Zm0 15h25v7H7ZM46 24h6v25a8 8 0 1 1-6-8Z"/>',
 frame:'<path d="M31 4 45 11 58 25 54 44 42 57 21 57 7 43 5 23 18 9Z"/><circle cx="32" cy="31" r="19" fill="black"/>'
};
const alias={...WN60_ALIAS,messages:'chat',message:'chat',mail:'mail',microphone:'mic',speaker:'volume_up',volume:'volume_up',mute:'volume_down',exit:'logout',film:'cinema',history:'history',orbit:'frame',book:'help',music:'headphones',playlists:'playlist',settings2:'settings',frames:'frame',profile:'user'};

function icon(key,cls=''){
 key=own(icons,key)?key:alias[key]||key;
 if(key==='headphones'||key==='cinema')return `<span class="ae wn-icon wm72-icon wm72-photo ${h(cls)}" data-wn-key="${key}" aria-hidden="true"><img class="wm72-icon-poster" onerror="this.hidden=true;this.parentElement.classList.add('wm72-image-failed')" src="/s/wm72_glass_${key}.png?v=72" alt="" width="352" height="352" decoding="async" draggable="false">${key==='cinema'?'<img class="wm72-icon-animation" data-src="/s/wm72_glass_cinema.webp?v=72" alt="" width="176" height="176" decoding="async" draggable="false">':''}<svg class="wm72-icon-fallback" viewBox="0 0 64 64" fill="#7896ef" aria-hidden="true">${WN60.art[key]||''}</svg></span>`;
 if(key==='brand'||key==='app')return `<img class="ae wn-icon wm72-brand ${h(cls)}" data-wn-key="${key}" src="/s/wn61_logo.svg?v=61" alt="" width="32" height="32">`;
 const shape=icons[key]||WN60.art[key];
 if(!shape)return `<span class="ae wn-icon wm72-unknown ${h(cls)}" data-wn-key="unknown" aria-hidden="true">•</span>`;
 const id='wm72-'+(++state.serial),service=['youtube','soundcloud','spotify'].includes(key),first=key==='spotify'?'#80edab':key==='youtube'?'#ff737d':key==='soundcloud'?'#ffc47f':'#c5efff',second=key==='spotify'?'#13984b':key==='youtube'?'#d90026':key==='soundcloud'?'#f26a13':'#225fdc',last=service?second:'#8759e8';
 return `<svg class="ae wn-icon wm72-icon ${h(cls)}" data-wn-key="${key}" viewBox="0 0 70 70" aria-hidden="true" focusable="false"><defs><mask id="${id}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="70" height="70"><g fill="white">${shape}</g></mask><linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${first}"/><stop offset=".26" stop-color="${second}"/><stop offset=".48" stop-color="${first}"/><stop offset=".62" stop-color="${second}"/><stop offset="1" stop-color="${last}"/></linearGradient></defs><g class="wm72-solid"><g transform="translate(3 4)"><rect width="66" height="66" fill="${last}" mask="url(#${id}-m)"/></g><g transform="translate(1 1)"><rect width="66" height="66" fill="url(#${id}-g)" mask="url(#${id}-m)"/></g></g></svg>`;
}
wnIcon=icon;
wnEmojiKey=function(value){const clean=String(value).replace(/[\ufe0e\ufe0f]/g,'');return clean==='🔥'?'fire':clean==='🎤'||clean==='🎙'?'mic':WN60_EMO[clean]||null};
ae=function(value,cls=''){const key=wnEmojiKey(value);return key?icon(key,cls):`<span class="ae wn-inline ${h(cls)}">${h(value)}</span>`};
wmcIcon=key=>icon(key,'wmc-icon');sxIcon=(key,on=true)=>icon(key==='mic'?(on?'mic':'volume_down'):key==='speaker'?'volume_up':'close','sx-icon');
// Existing observer callbacks call these globals. Stop replacing new SVGs with
// the old crystal atlas, and stop turning unrecognised keyboard emoji into W.
if(typeof wn61Scan==='function')wn61Scan=function(){};
if(typeof WN61_EMOJI!=='undefined'){WN61_EMOJI.observer?.disconnect();WN61_EMOJI.nodes.clear()}
wnObserveNodes=function(root){if(!root)return;scan(root)};
function section(title,action='',label='') {return `<div class="wm72-section-title"><h2>${h(title)}</h2>${action?`<button onclick="${action}">${h(label||tx('more'))} ‹</button>`:''}</div>`}
function compact(track,index,list){return `<button class="wm72-compact" onclick="wnPlay('${list}',${index})"><span class="wm72-compact-art">${wnImage(track)}</span><span><b dir="auto">${h(track.title||'Wakhan Music')}</b><small dir="auto">${h(track.artist||track.ch||'')}</small></span>${icon('play')}</button>`}
function groupsEntry(){const groups=ME?.groups||[];return `<button class="wm72-group-entry" onclick="go('g')">${icon('group')}<span><b>${h(tx('groups'))}</b><small>${groups.length?groups.length+' · '+h(tx('groupHint')):h(tx('noGroupsHint'))}</small></span><span class="wm72-chevron">‹</span></button>`}
wnHome=function(){
 const recent=wnList('WN_RECENT',(ME?.phist||[]).filter(wnProvider).slice(0,8)),first=recent[0],user=WM70.self||ME?.me||{},playlists=WN60.library.items||[];
 V().innerHTML=`<main class="wn-page wm72-home"><div class="wm72-greeting"><div><small>${h(tx('welcome'))}</small><h1>${h(wnT('hello'))} ${h(Array.from(user.name||'Wakhan').slice(0,22).join(''))}</h1></div><button class="wm72-mini-profile" onclick="go('m')" aria-label="${h(tx('profile'))}">${wm70Avatar(user)}</button></div><button class="wm72-home-search" onclick="wm72OpenSearch()">${icon('search')}<span>${h(tx('search'))}</span></button><section class="wm72-feature"><div><small>WAKHAN MUSIC</small><h2>${h(tx('discover'))}</h2><p>${h(wnT('heroBody')).replace(/&lt;br\/?&gt;/g,' ')}</p><button class="wm72-light-button" onclick="go('p')">${h(wnT('listen'))}<span>←</span></button></div><div class="wm72-feature-art">${icon('headphones')}</div></section><div class="wm72-access"><button onclick="go('l')">${icon('library')}<span>${h(tx('library'))}</span></button><button onclick="wm70OpenFriends()">${icon('group')}<span>${h(tx('friends'))}</span></button><button onclick="go('g')">${icon('volume_up')}<span>${h(tx('groups'))}</span></button></div>${first?section(tx('continue'))+compact(first,0,'WN_RECENT'):''}${recent.length?section(tx('recent'),"go('l',{kind:'history'})")+`<div class="wn-horizontal wm72-albums">${recent.map((r,i)=>wnAlbum(r,i,'WN_RECENT')).join('')}</div>`:section(tx('recent'))+`<div class="wm72-empty-inline"><b>${h(tx('emptyMusic'))}</b><p>${h(tx('emptyHint'))}</p></div>`}${section(tx('library'),"go('l')")}${playlists.length?`<div class="wn-library-grid wm72-home-playlists">${playlists.slice(0,4).map(wnPlaylistTile).join('')}</div>`:`<button class="wm72-create-playlist" onclick="wnNameSheet()">${icon('add')}<span><b>${h(tx('newPlaylist'))}</b><small>${h(wnT('fromBoth'))}</small></span><span>‹</span></button>`}<button class="wm72-cinema-feature" onclick="go('c')"><span class="wm72-cinema-copy"><small>WAKHAN CINEMA</small><b>${h(tx('watch'))}</b><span>${h(tx('watchHint'))}</span><em>${h(tx('openCinema'))} ←</em></span><span class="wm72-cinema-art">${icon('cinema')}</span></button>${section(tx('groups'),"go('g')",tx('viewGroups'))}${groupsEntry()}</main>`;
 if(!WN60.library.loaded&&!WN60.library.loading&&!WN60.library.error)wnLoadLibrary();
};
window.wm72OpenSearch=function(){go('p');requestAnimationFrame(()=>document.getElementById('q')?.focus())};
wnMusic=function(){
 if(!wpAllowed())return wpLockPage();
 V().innerHTML=`<main class="wn-page wn-music wm72-music"><div class="wm72-page-title"><div><small>WAKHAN MUSIC</small><h1>${h(tx('listen'))}</h1></div><button class="wm72-icon-button" onclick="go('l')" aria-label="${h(tx('library'))}">${icon('library')}</button></div><div class="wm72-music-tabs"><button class="on" aria-current="page">${h(tx('allMusic'))}</button><button onclick="go('l')">${h(tx('yourLibrary'))}</button><button onclick="go('l',{kind:'favorites'})">${h(wnT('favorites'))}</button></div><form class="wn-search wm72-search" onsubmit="event.preventDefault();doSearch()">${icon('search')}<input id="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="${h(tx('search'))}" value="${h(WN60.queries[SRC])}" aria-label="${h(wnT('search'))}"><button type="submit" aria-label="${h(wnT('search'))}">${icon('forward')}</button></form><div class="wn-sources wm72-sources" role="tablist">${['sc','yt'].map(s=>`<button class="wn-source ${SRC===s?'on':''}" data-wm-source="${s}" role="tab" aria-selected="${SRC===s}" onclick="wmChooseSource('${s}')">${icon(s==='yt'?'youtube':'soundcloud')}<span>${s==='yt'?'YouTube':'SoundCloud'}</span><small>${h(tx('audio'))}</small></button>`).join('')}</div><section id="pres" aria-live="polite"></section></main>`;showRes();
};
rPlayer=wnMusic;
const oldLibrary=wnLibrary;
wnLibrary=function(){oldLibrary();const page=V().querySelector('main');if(page&&!page.querySelector('.wm72-back-library'))page.insertAdjacentHTML('afterbegin',`<button class="wm72-back-library" onclick="go('p')">‹ ${h(tx('listen'))}</button>`)};
const originalMe=rMe;
rMe=function(){
 if(SUB?.kind==='details')return originalMe();
 const p=WM70.self||{id:ME?.me?.id,name:ME?.me?.name,avatar:'/ava/'+ME?.me?.id},stats=ME?.stats||{},balance=WC23.data?.balance;
 V().innerHTML=`<main class="wn-page wm70-account wm72-account"><div class="wm72-page-title"><div><small>WAKHAN ACCOUNT</small><h1>${h(tx('profile'))}</h1></div><button class="wm72-icon-button" onclick="themeSheet()" aria-label="${h(tx('appearance'))}">${icon('settings')}</button></div><section class="wn-profile wm72-profile"><div class="wm70-profile-head"><button class="wm70-identity-button" onclick="wm70Edit()">${wm70Avatar(p)}<span><b class="wn-inline" dir="auto">${h(p.name||'Wakhan')}</b><small>ID <bdi>${Number(p.id)}</bdi></small></span></button><button class="wm70-edit-link" onclick="wm70Edit()">${h(tx('edit'))} ‹</button></div><div class="wn-stats"><button onclick="go('l',{kind:'history'})"><b>${Number(stats.plays)||0}</b><span>${h(t('plays'))}</span></button><button onclick="go('l',{kind:'favorites'})"><b>${(ME?.favs||[]).length}</b><span>${h(wnT('favorites'))}</span></button><button onclick="wm70OpenFriends()"><b>${WM70.self?.friends||0}</b><span>${h(tx('friends'))}</span></button></div></section>${WM70.error?`<button class="wm70-notice" onclick="wm70Load()">${h(WM70.error)} · ${h(wm70T('retry'))}</button>`:''}<div class="wm72-account-quick"><button onclick="wc23Open()">${icon('wallet')}<span><small>${h(tx('wallet'))}</small><b><bdi>${balance===undefined?'—':h(balance)}</bdi> <em>${h(wc23T('coins'))}</em></b></span><i>‹</i></button><button onclick="go('s')">${icon('diamond')}<span><small>${h(tx('subscription'))}</small><b>${h(wnT('subscription'))}</b></span><i>‹</i></button></div>${section(tx('personal'))}<div class="wn-settings-list">${wnSetting('user',wm70T('edit'),'wm70Edit()')}${wnSetting('frame',wm70T('halos'),"wm70Edit('halos')")}${wnSetting('group',tx('friends'),'wm70OpenFriends()')}${wnSetting('user',tx('details'),"go('m',{kind:'details'})")}</div>${section(tx('settings'))}<div class="wn-settings-list">${wnSetting('settings',tx('appearance'),'themeSheet()')}${wnSetting('globe',wnT('language'),'langSheet()')}${wnSetting('help',wnT('help'),'helpSheet()')}${wnSetting('send',wnT('share'),'wnShare()')}</div>${wnStaff()?section(wnT('operations'))+`<div class="wn-settings-list">${wnSetting('shield',wnT('operations'),'op31Go()')}${WM70.self?.roles?.includes('creator')?wnSetting('crown',wm70T('teamCoins'),'af24Open()'):''}</div>`:''}${(ME?.finance?.allowed||(typeof WF!=='undefined'&&WF.summary?.allowed))?`<div class="wn-settings-list">${wnSetting('receipt',wnT('finance'),'wfOpen()')}</div>`:''}<div class="wn-version">WAKHAN</div></main>`;
 if(!WM70.self&&!WM70.loading&&!WM70.error)wm70Load();
};
const oldWalletMount=wc23Mount;wc23Mount=function(){const result=oldWalletMount();if(TAB==='m'&&SUB?.kind!=='details'&&!WM70.modal)rMe();return result};
const oldFinanceAccept=wfAccept;wfAccept=function(summary){const result=oldFinanceAccept(summary);if(TAB==='m'&&SUB?.kind!=='details'&&!WM70.modal)rMe();return result};
renderNav=function(){const active=TAB==='l'?'p':TAB==='g'?'h':TAB;document.getElementById('nav').innerHTML=[['h','home','home'],['p','headphones','listen'],['c','cinema','cinema'],['d','chat','chat'],['m','user','profile']].map(([key,shape,label])=>`<button class="${active===key?'on':''}" onclick="go('${key}')" aria-label="${h(tx(label))}" ${active===key?'aria-current="page"':''}><i class="wm72-nav-art">${icon(shape)}</i><span>${h(tx(label))}</span>${key==='d'&&WM70.unread?`<b class="wm70-nav-unread">${Math.min(99,WM70.unread)}</b>`:''}</button>`).join('')};
const oldCinemaHead=wmcHomeHead;
wmcHomeHead=function(){return `<div class="wm72-cinema-title"><div><small>WAKHAN CINEMA</small><h1>${h(tx('cinema'))}</h1><p>${h(tx('watchHint'))}</p></div>${icon('cinema')}</div>${nhTabs()}`};
const oldCinema=rCinema;rCinema=function(){const result=oldCinema();V().classList.add('wm72-cinema');return result};
const oldRender=render;render=function(){V().classList.remove('wm72-cinema');oldRender();document.body.dataset.wm72Tab=TAB;refresh()};
const oldMini=miniUpd;miniUpd=function(){oldMini();document.body.classList.toggle('wm72-has-mini',!!CUR)};
function weak(){return !!navigator.connection?.saveData||Number(navigator.deviceMemory||8)<=4||Number(navigator.hardwareConcurrency||8)<=4}
function motion(){return document.visibilityState!=='hidden'&&!state.reduced?.matches&&(typeof WN61_EMOJI==='undefined'||WN61_EMOJI.motion!==false)}
function refresh(){
 const accent=getComputedStyle(document.body).getPropertyValue('--a1').trim(),match=/^#([a-f0-9]{6})$/i.exec(accent);
 if(match){const rgb=[0,2,4].map(i=>parseInt(match[1].slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));const l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];document.body.style.setProperty('--wm72-on-accent',1.05/(l+.05)>=4.5?'#fff':'#111729')}
 const active=new Set(motion()?[...state.visible].filter(node=>node.isConnected).slice(0,weak()?8:18):[]);state.active=active;
 for(const node of state.nodes){
  const on=active.has(node);node.classList.toggle('wm72-moving',on);
  const animation=node.querySelector('.wm72-icon-animation');if(!animation)continue;
  if(on&&node.dataset.wm72Failed!=='1'){if(!animation.hasAttribute('src'))animation.src=animation.dataset.src;if(animation.complete&&animation.naturalWidth)node.classList.add('wm72-playback')}
  else{node.classList.remove('wm72-playback');animation.removeAttribute('src')}
 }
 document.body.classList.toggle('wm72-lite',weak());
}
function scan(root=document){
 for(const node of root.querySelectorAll('.wm72-icon:not([data-wm72-bound])')){node.dataset.wm72Bound='1';state.nodes.add(node);const animation=node.querySelector('.wm72-icon-animation');
  animation?.addEventListener('load',()=>{if(state.active.has(node)&&animation.hasAttribute('src')&&animation.naturalWidth)node.classList.add('wm72-playback')});
  animation?.addEventListener('error',()=>{node.dataset.wm72Failed='1';node.classList.remove('wm72-playback');animation.removeAttribute('src')});if(state.observer)state.observer.observe(node);else state.visible.add(node)}
 for(const node of state.nodes)if(!node.isConnected){state.observer?.unobserve(node);state.nodes.delete(node);state.visible.delete(node)}refresh();
}
function mount(){
 document.body.classList.add('wm72-product');document.title='Wakhan Music';
 for(const old of document.querySelectorAll('svg.wn-icon:not(.wm72-icon)')){const holder=document.createElement('span');holder.innerHTML=icon(old.dataset.wnKey||'globe');old.replaceWith(holder.firstElementChild)}
 if(window.IntersectionObserver)state.observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)state.visible.add(entry.target);else state.visible.delete(entry.target)}refresh()},{rootMargin:'16px'});
 new MutationObserver(()=>{if(state.queued)return;state.queued=true;requestAnimationFrame(()=>{state.queued=false;scan()})}).observe(document.body,{childList:true,subtree:true});
 scan();if(ME?.me)render();miniUpd();
}
const oldMotion=wn61ToggleMotion;wn61ToggleMotion=function(){oldMotion();refresh()};
document.addEventListener('visibilitychange',refresh);state.reduced?.addEventListener?.('change',refresh);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.WM72={tx,icon,weak,state,refresh,reference:'4bdb56e1da874720d4c5d07e53a5ca8c30390727aa646ed7f14831234944a6da'};
})();
