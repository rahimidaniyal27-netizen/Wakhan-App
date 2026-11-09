/* =====================================================================
   WAKHAN CHATS v2 — chats list, friends, requests and private chat in
   one clean module (replaces social36 + the chat parts of social52).

   Engines that stay and are only *used* here (community70):
     WM70.inbox / WM70.friends / WM70.messages, wm70PollDM, wm70SendDM,
     wm70Friend, wm70RefreshFriends, wm70Request, wm70OpenProfile.

   Rule of this file: draw once, then touch only what changed —
   the list is not rebuilt while you scroll it, and a private chat only
   adds the new messages instead of drawing the whole thread again.
   Sections:  1 texts · 2 helpers · 3 chats list · 4 private chat ·
              5 keyboard · 6 engine hooks · 7 start
   ===================================================================== */
(()=>{'use strict';
if(!window.WK_V2||window.C2)return;
if(typeof WM70==='undefined'||typeof wm70ChatDraw!=='function')return;

/* ---------------------------------------------------------------- 1 texts */
const TEXT={
 fa:{title:'چت‌ها',search:'جستجوی رفیق یا آیدی…',friends:'رفیقا',requests:'درخواست‌های رفاقت',reqSub:'نفر منتظر جواب تو',empty:'هنوز چتی نداری',emptySub:'از پروفایل رفیقایت در سالون پیام بده',
  nofriends:'هنوز رفیقی نداری',noreq:'درخواستی نیست',accept:'قبول',decline:'رد',sent:'فرستاده شد',you:'تو: ',msg:'پیام',noResult:'کسی پیدا نشد',loading:'در حال جستجو…',
  write:'پیام بنویس…',today:'امروز',yesterday:'دیروز',friend:'برای پیام دادن اول رفیق شوین',first:'اولین پیام ره بفرست 👋',older:'پیام‌های قبلی'},
 en:{title:'Chats',search:'Search friends or ID…',friends:'Friends',requests:'Friend requests',reqSub:'waiting for your answer',empty:'No chats yet',emptySub:'Message friends from their profile in a hall',
  nofriends:'No friends yet',noreq:'No requests',accept:'Accept',decline:'Decline',sent:'Sent',you:'You: ',msg:'Message',noResult:'Nobody found',loading:'Searching…',
  write:'Message…',today:'Today',yesterday:'Yesterday',friend:'Become friends to send messages',first:'Say hi 👋',older:'Older messages'}};
TEXT.ps=Object.assign({},TEXT.fa,{title:'خبرې',search:'ملګری یا ID ولټوئ…',friends:'ملګري',requests:'د ملګرتیا غوښتنې',empty:'لا خبرې نشته',accept:'منل',decline:'ردول',sent:'لېږل شوې',you:'تاسو: ',msg:'پیغام',
 write:'پیغام ولیکئ…',today:'نن',yesterday:'پرون',friend:'د پیغام لپاره لومړی ملګري شئ',first:'لومړی پیغام ولېږئ 👋',older:'پخواني پیغامونه'});
const tx=k=>{let l='fa';try{l=String((typeof LG!=='undefined'&&LG)||document.documentElement.lang||'fa').slice(0,2)}catch(e){}return (TEXT[['fa','ps','en'].includes(l)?l:'en'][k])||TEXT.fa[k]||k};

/* ---------------------------------------------------------------- 2 helpers */
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic=k=>typeof wi11==='function'?wi11(k):'';
const me=()=>{try{return Number(ME.me.id)||0}catch(e){return 0}};
const av=p=>{try{return wm70Avatar(p)}catch(e){return ''}};
const pad=v=>String(v).padStart(2,'0');
const hm=ts=>{const d=new Date(ts*1000);return pad(d.getHours())+':'+pad(d.getMinutes())};
function when(ts){ts=Number(ts||0);if(!ts)return '';const d=new Date(ts*1000),n=new Date();return d.toDateString()===n.toDateString()?hm(ts):pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function day(ts){const d=new Date(ts*1000),n=new Date(),y=new Date(n-864e5);if(d.toDateString()===n.toDateString())return tx('today');if(d.toDateString()===y.toDateString())return tx('yesterday');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
const S={listKey:'',bodyHtml:'',peer:0,rows:new Map(),first:0,lastDay:'',last:null,echo:[],raf:0};

/* ---------------------------------------------------------------- 3 chats list */
function convRow(p){const last=(Number(p.sender)===me()?tx('you'):'')+(p.last||'');return `<button type="button" class="sc-row" onclick="wm70OpenDM(${Number(p.id)})"><span class="sc-av">${av(p)}</span><span class="sc-mid"><b dir="auto">${esc(p.name)}</b><small dir="auto">${esc(last.slice(0,80))}</small></span><span class="sc-end"><time>${esc(when(p.ts))}</time>${p.unread?`<i class="sc-badge">${Number(p.unread)>99?'99+':Number(p.unread)}</i>`:''}</span></button>`}
function friendRow(p){return `<div class="sc-row"><button type="button" class="sc-av" onclick="wm70OpenProfile(${Number(p.id)})">${av(p)}</button><span class="sc-mid" onclick="wm70OpenProfile(${Number(p.id)})"><b dir="auto">${esc(p.name)}</b><small>ID ${Number(p.id)}</small></span><button type="button" class="sc-pill" onclick="wm70OpenDM(${Number(p.id)})">${ic('chat')}<span>${esc(tx('msg'))}</span></button></div>`}
function reqRow(p){const inc=p.relation==='incoming';return `<div class="sc-row"><button type="button" class="sc-av" onclick="wm70OpenProfile(${Number(p.id)})">${av(p)}</button><span class="sc-mid"><b dir="auto">${esc(p.name)}</b><small>ID ${Number(p.id)}</small></span>${inc?`<button type="button" class="sc-pill ok" onclick="wm70Friend('accept',${Number(p.id)})">${esc(tx('accept'))}</button><button type="button" class="sc-pill ghost" onclick="wm70Friend('decline',${Number(p.id)})">${esc(tx('decline'))}</button>`:`<button type="button" class="sc-pill ghost" onclick="wm70Friend('cancel',${Number(p.id)})">${esc(tx('sent'))}</button>`}</div>`}
function headHtml(tab){const inc=((WM70.friends||{}).incoming||[]).length;
 if(tab!=='messages')return `<div class="sc-head c2-head"><button type="button" class="sc-ic" onclick="C2.tab('messages')" aria-label="back">${ic('back')}</button><h1>${esc(tx(tab==='friends'?'friends':'requests'))}</h1><span class="sc-sp"></span></div>`;
 return `<div class="sc-head c2-head"><h1>${esc(tx('title'))}</h1><span class="sc-sp"></span><button type="button" class="sc-ic" onclick="C2.tab('friends')" aria-label="${esc(tx('friends'))}">${ic('group')}</button><button type="button" class="sc-ic" onclick="C2.tab('requests')" aria-label="${esc(tx('requests'))}">${ic('invite')}<i class="sc-dot" ${inc?'':'hidden'}></i></button></div>
 <form class="sc-search c2-search" onsubmit="event.preventDefault();wm70Search()">${ic('search')}<input id="wm70-search" type="search" placeholder="${esc(tx('search'))}" maxlength="60" enterkeyhint="search" autocomplete="off"></form><div id="wm70-search-results" class="sc-list sc-res"></div>`}
function bodyHtml(tab){const v=WM70.friends||{},friends=v.friends||[],inc=v.incoming||[],out=v.outgoing||[];
 if(tab==='friends')return `<div class="sc-list">${friends.length?friends.map(friendRow).join(''):`<p class="sc-empty">${esc(tx('nofriends'))}</p>`}</div>`;
 if(tab==='requests'){const all=[...inc,...out];return `<div class="sc-list">${all.length?all.map(reqRow).join(''):`<p class="sc-empty">${esc(tx('noreq'))}</p>`}</div>`}
 const list=WM70.inbox||[];
 return (friends.length?`<h4 class="sc-h">${esc(tx('friends'))}</h4><div class="sc-friends">${friends.slice(0,20).map(p=>`<button type="button" onclick="wm70OpenDM(${Number(p.id)})"><span class="sc-fav">${av(p)}</span><small dir="auto">${esc(p.name)}</small></button>`).join('')}</div>`:'')+
  `<div class="sc-list">${inc.length?`<button type="button" class="sc-row" onclick="C2.tab('requests')"><span class="sc-sys blue">${ic('invite')}</span><span class="sc-mid"><b>${esc(tx('requests'))}</b><small>${inc.length} ${esc(tx('reqSub'))}</small></span><span class="sc-end"><i class="sc-badge">${inc.length}</i></span></button>`:''}${list.map(convRow).join('')}${!list.length&&!inc.length?`<div class="sc-none"><span class="sc-sys teal">${ic('chat')}</span><b>${esc(tx('empty'))}</b><small>${esc(tx('emptySub'))}</small></div>`:''}</div>`}
function drawList(){if(typeof TAB==='undefined'||TAB!=='d')return;if(WM70.peer)return drawThread();
 document.body.classList.remove('dt-open');
 if(!WM70.friends&&!S.loading){S.loading=true;wm70RefreshFriends().then(()=>{S.loading=false;drawList()}).catch(()=>{S.loading=false})}
 const tab=['friends','requests'].includes(WM70.tab)?WM70.tab:'messages';
 let page=document.querySelector('#view>.c2-list');
 const key=tab+'|'+(((WM70.friends||{}).incoming||[]).length?1:0);
 if(!page||S.listKey!==key){V().innerHTML=`<main class="wn-page sc-page c2-list" data-tab="${tab}">${headHtml(tab)}<div class="c2-body"></div></main>`;page=document.querySelector('#view>.c2-list');S.listKey=key;S.bodyHtml=''}
 const html=bodyHtml(tab);if(html!==S.bodyHtml){S.bodyHtml=html;page.querySelector('.c2-body').innerHTML=html}}
async function search(){const input=$('wm70-search'),out=$('wm70-search-results');if(!input||!out)return;const q=input.value.trim();const seq=S.sq=(S.sq||0)+1;
 if(q.length<2){out.innerHTML='';return}out.innerHTML=`<p class="sc-empty">${esc(tx('loading'))}</p>`;
 try{const r=await wm70Request('search?q='+encodeURIComponent(q));if(seq!==S.sq||!out.isConnected)return;for(const p of r.users||[])wm70Remember(p);out.innerHTML=(r.users||[]).length?r.users.map(friendRow).join(''):`<p class="sc-empty">${esc(tx('noResult'))}</p>`}
 catch(e){if(seq===S.sq&&out.isConnected)out.innerHTML=`<p class="sc-empty">${esc(wm70Error(e))}</p>`}}

/* ---------------------------------------------------------------- 4 private chat */
function back(){WM70.peer=null;++WM70.dmSeq;document.body.classList.remove('dt-open','wk-typing');S.peer=0;S.listKey='';drawList();try{wm70RefreshSocial()}catch(e){}}
function drawThread(){const peer=Number(WM70.peer),p=WM70.people.get(peer)||{id:peer,name:'Wakhan'};document.body.classList.add('dt-open');
 V().innerHTML=`<main class="dt-page c2-thread" id="c2-thread" dir="ltr">
 <div class="dt-head"><button type="button" class="dt-ic" onclick="C2.back()" aria-label="back">${ic('back')}</button><button type="button" class="dt-who" onclick="wm70OpenProfile(${peer})"><span class="dt-av">${av(p)}</span><span class="dt-nm"><b dir="auto">${esc(p.name)}</b><small>ID ${peer}</small></span></button><button type="button" class="dt-ic" onclick="wm70PeerMenu(${peer})" aria-label="more">${ic('more')}</button></div>
 <div id="wm70-dm-messages" class="dt-msgs"></div><p id="wm70-dm-notice" class="dt-notice" hidden></p>
 <form class="dt-compose wm70-compose" onsubmit="event.preventDefault();C2.send()"><textarea id="wm70-dm-text" rows="1" maxlength="2000" placeholder="${esc(tx('write'))}" dir="auto" enterkeyhint="send"></textarea><button type="submit" onpointerdown="event.preventDefault()" aria-label="send">${ic('send')}</button></form></main>`;
 S.peer=peer;S.rows=new Map();S.first=0;S.lastDay='';S.last=null;S.echo=[];
 const ta=$('wm70-dm-text');ta.addEventListener('input',()=>{ta.style.height='42px';ta.style.height=Math.min(Math.max(42,ta.scrollHeight+2),120)+'px'});
 ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!/Mobi|iPhone|Android/.test(navigator.userAgent)){e.preventDefault();send()}});
 kb();drawMessages()}
function rowEl(m,mine){const r=document.createElement('div');r.className='dt-row '+(mine?'me':'them')+' tail';if(m.id)r.dataset.id=String(m.id);
 r.innerHTML=`<div class="dt-b"><bdi dir="auto" class="wm70-native-emoji">${esc(m.text)}</bdi><span class="dt-t">${hm(m.ts||Date.now()/1000)}${mine?'<i class="dt-tick">✓✓</i>':''}</span></div>`;return r}
function place(out,m){const mine=Number(m.sender)===me(),d=day(m.ts);
 if(d!==S.lastDay){const sep=document.createElement('div');sep.className='dt-day';sep.innerHTML=`<span>${esc(d)}</span>`;out.appendChild(sep);S.lastDay=d;S.last=null}
 if(S.last&&Number(S.last.m.sender)===Number(m.sender)&&m.ts-S.last.m.ts<=300)S.last.el.classList.remove('tail');
 const el=rowEl(m,mine);out.appendChild(el);S.rows.set(String(m.id),el);S.last={m,el}}
function drawMessages(){const out=$('wm70-dm-messages');if(!out||Number(WM70.peer)!==S.peer)return;const ms=WM70.messages||[];
 const stick=out.scrollHeight-out.scrollTop-out.clientHeight<120||!out.dataset.init;
 /* older messages came in at the top (or a different chat): draw once from scratch */
 if(ms.length&&S.first&&Number(ms[0].id)<S.first){out.innerHTML='';S.rows=new Map();S.lastDay='';S.last=null;S.first=0}
 if(!S.first&&ms.length){S.first=Number(ms[0].id);out.innerHTML=ms.length>=30?`<button type="button" class="dt-older" onclick="wm70Older()">${esc(tx('older'))}</button>`:''}
 const empty=out.querySelector('.dt-empty');if(empty&&ms.length)empty.remove();
 for(const m of ms){if(S.rows.has(String(m.id)))continue;dropEcho(m);place(out,m)}
 for(const e of S.echo)out.appendChild(e.el); /* my unsent text stays at the bottom */
 if(!ms.length&&!S.echo.length&&!out.querySelector('.dt-empty'))out.innerHTML=`<div class="dt-empty">${esc(tx('first'))}</div>`;
 if(stick){out.scrollTop=out.scrollHeight;out.dataset.init=1}
 const n=$('wm70-dm-notice');if(n){const msg=WM70.dmError||(!WM70.dmCanSend?tx('friend'):'');if(n.textContent!==msg)n.textContent=msg;n.hidden=!msg}
 const b=document.querySelector('#c2-thread .dt-compose button');if(b){const off=!WM70.dmCanSend||!!WM70.dmBusy;if(b.disabled!==off)b.disabled=off}}
function dropEcho(m){if(Number(m.sender)!==me())return;const e=S.echo.find(x=>x.text===String(m.text||'').trim());if(!e)return;clearTimeout(e.t);e.el.remove();S.echo=S.echo.filter(x=>x!==e)}
async function send(){const ta=$('wm70-dm-text'),text=ta&&ta.value.trim();if(!text||WM70.dmBusy||!WM70.dmCanSend)return;
 const out=$('wm70-dm-messages'),el=rowEl({text,ts:Date.now()/1000},true);el.classList.add('pending');const e={text,el,t:setTimeout(()=>{el.remove();S.echo=S.echo.filter(x=>x!==e)},15000)};S.echo.push(e);
 if(out){const empty=out.querySelector('.dt-empty');if(empty)empty.remove();out.appendChild(el);out.scrollTop=out.scrollHeight}
 try{await wm70SendDM()}catch(x){}
 if(ta.value.trim()===text){clearTimeout(e.t);el.remove();S.echo=S.echo.filter(x=>x!==e)} /* not sent: the text is still in the box */
 else{ta.style.height='42px'}
 drawMessages()}

/* ---------------------------------------------------------------- 5 keyboard (iPhone) */
/* The chat page is sized to the visible part of the screen: when the keyboard opens the page
   gets shorter from the bottom, the header stays on top and the text box sits on the keyboard. */
function kb(){S.raf=0;const pg=$('c2-thread');if(!pg)return;const vv=window.__h2vv||window.visualViewport;
 const h=Math.round(vv?vv.height:window.innerHeight),top=Math.round(vv?Math.max(0,vv.offsetTop):0);
 if(pg.style.getPropertyValue('--c2-h')!==h+'px')pg.style.setProperty('--c2-h',h+'px');
 const tf=top?`translate3d(0,${top}px,0)`:'';if(pg.style.transform!==tf)pg.style.transform=tf;
 const typing=document.activeElement&&document.activeElement.id==='wm70-dm-text';
 if(pg.classList.contains('is-typing')!==typing){pg.classList.toggle('is-typing',typing);document.body.classList.toggle('wk-typing',typing);const o=$('wm70-dm-messages');if(o)requestAnimationFrame(()=>{o.scrollTop=o.scrollHeight})}}
const kbSoon=()=>{if(!S.raf)S.raf=requestAnimationFrame(kb)};
(()=>{const vv=window.visualViewport;if(vv){vv.addEventListener('resize',kbSoon);vv.addEventListener('scroll',kbSoon)}window.addEventListener('resize',kbSoon);
 document.addEventListener('focusin',e=>{if(e.target&&e.target.id==='wm70-dm-text'){kb();for(const t of [80,200,400,700])setTimeout(kbSoon,t)}});
 document.addEventListener('focusout',e=>{if(e.target&&e.target.id==='wm70-dm-text')for(const t of [60,250,500])setTimeout(kbSoon,t)});
 try{tg.onEvent('viewportChanged',kbSoon)}catch(e){}})();

/* ---------------------------------------------------------------- 6 engine hooks */
wm70ChatDraw=drawList;window.wm70ChatDraw=drawList;
wm70ThreadDraw=drawThread;window.wm70ThreadDraw=drawThread;
wm70DMMessages=drawMessages;window.wm70DMMessages=drawMessages;
wm70Search=search;window.wm70Search=search;
window.dt46Back=back;
/* opening a private chat from anywhere (profile, hall, inbox sheet) */
const oldOpen=wm70OpenDM;wm70OpenDM=async function(uid){S.peer=0;return oldOpen.apply(this,arguments)};window.wm70OpenDM=wm70OpenDM;

/* ---------------------------------------------------------------- 7 start */
setInterval(()=>{if(document.body.classList.contains('dt-open')&&(typeof TAB==='undefined'||TAB!=='d'||!WM70.peer||!$('c2-thread')))document.body.classList.remove('dt-open')},700);
(()=>{const l=document.createElement('link');l.rel='stylesheet';l.href='/s/chat2.css?v='+(window.WK_V2_VER||1);document.head.appendChild(l)})();
window.C2={tab:t=>{WM70.tab=t;S.listKey='';drawList()},back,send,kb,state:S};
try{if(typeof TAB!=='undefined'&&TAB==='d')drawList()}catch(e){}
})();
