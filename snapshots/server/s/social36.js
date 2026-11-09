/* WAKHAN M36: Chats page in TopTop style (title + actions, search, friends row, clean conversation list) */
(()=>{"use strict";
if(typeof wm70ChatDraw!=="function")return;
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const I=k=>typeof wi11==="function"?wi11(k):"";
const TX={fa:{title:"چت‌ها",search:"جستجوی رفیق یا آیدی…",friends:"رفیقا",requests:"درخواست‌های رفاقت",reqSub:"نفر منتظر جواب تو",empty:"هنوز چتی نداری",emptySub:"از پروفایل رفیقایت در سالون پیام بده",nofriends:"هنوز رفیقی نداری",accept:"قبول",decline:"رد",sent:"فرستاده شد",you:"تو: ",back:"چت‌ها",msg:"پیام"},
ps:{title:"خبرې",search:"ملګری یا ID ولټوئ…",friends:"ملګري",requests:"د ملګرتیا غوښتنې",reqSub:"کسان ستاسو ځواب ته منتظر دي",empty:"لا خبرې نشته",emptySub:"په تالار کې د ملګرو له پروفایل پیغام ولېږئ",nofriends:"لا ملګري نشته",accept:"منل",decline:"ردول",sent:"لېږل شوې",you:"تاسو: ",back:"خبرې",msg:"پیغام"},
en:{title:"Chats",search:"Search friends or ID…",friends:"Friends",requests:"Friend requests",reqSub:"waiting for your answer",empty:"No chats yet",emptySub:"Message friends from their profile in a hall",nofriends:"No friends yet",accept:"Accept",decline:"Decline",sent:"Sent",you:"You: ",back:"Chats",msg:"Message"}};
const T=()=>{const l=document.documentElement.lang||"fa";return l.startsWith("ps")?TX.ps:(l==="fa"||l==="fa-IR")?TX.fa:TX.en};
const me=()=>Number(ME?.me?.id||0);
function when(ts){ts=Number(ts||0);if(!ts)return"";const d=new Date(ts*1000),n=new Date();const p=v=>String(v).padStart(2,"0");return d.toDateString()===n.toDateString()?p(d.getHours())+":"+p(d.getMinutes()):p(d.getMonth()+1)+"-"+p(d.getDate())}
const av=p=>typeof wm70Avatar==="function"?wm70Avatar(p):"";
function convRow(p){const t=T(),last=(Number(p.sender)===me()?t.you:"")+(p.last||"");return `<button class="sc-row" onclick="wm70OpenDM(${Number(p.id)})"><span class="sc-av">${av(p)}</span><span class="sc-mid"><b dir="auto">${esc(p.name)}</b><small dir="auto">${esc(last.slice(0,80))}</small></span><span class="sc-end"><time>${esc(when(p.ts))}</time>${p.unread?`<i class="sc-badge">${Number(p.unread)>99?"99+":Number(p.unread)}</i>`:""}</span></button>`}
function friendRow(p){return `<div class="sc-row"><button class="sc-av" onclick="wm70OpenProfile(${Number(p.id)})">${av(p)}</button><span class="sc-mid" onclick="wm70OpenProfile(${Number(p.id)})"><b dir="auto">${esc(p.name)}</b><small>ID ${Number(p.id)}</small></span><button class="sc-pill" onclick="wm70OpenDM(${Number(p.id)})">${I("chat")}<span>${esc(T().msg)}</span></button></div>`}
function reqRow(p){const t=T(),inc=p.relation==="incoming";return `<div class="sc-row"><button class="sc-av" onclick="wm70OpenProfile(${Number(p.id)})">${av(p)}</button><span class="sc-mid"><b dir="auto">${esc(p.name)}</b><small>ID ${Number(p.id)}</small></span>${inc?`<button class="sc-pill ok" onclick="wm70Friend('accept',${Number(p.id)})">${esc(t.accept)}</button><button class="sc-pill ghost" onclick="wm70Friend('decline',${Number(p.id)})">${esc(t.decline)}</button>`:`<button class="sc-pill ghost" onclick="wm70Friend('cancel',${Number(p.id)})">${esc(t.sent)}</button>`}</div>`}
function head(title,backTab){const v=WM70.friends||{},inc=(v.incoming||[]).length;return `<header class="sc-head">${backTab?`<button class="sc-ic" onclick="WM70.tab='messages';wm70ChatDraw()">${I("back")}</button>`:""}<h1>${esc(title)}</h1><span class="sc-sp"></span>${backTab?"":`<button class="sc-ic" onclick="WM70.tab='friends';wm70ChatDraw()" aria-label="${esc(T().friends)}">${I("group")}</button><button class="sc-ic" onclick="WM70.tab='requests';wm70ChatDraw()" aria-label="${esc(T().requests)}">${I("invite")}${inc?'<i class="sc-dot"></i>':""}</button>`}</header>`}
function draw(){if(typeof TAB==="undefined"||TAB!=="d")return;if(WM70.peer)return wm70ThreadDraw();const t=T(),v=WM70.friends||{},friends=v.friends||[],inc=v.incoming||[],out=v.outgoing||[];
 if(!WM70.friends&&!WM70.__scLoad){WM70.__scLoad=1;wm70RefreshFriends().then(()=>{WM70.__scLoad=0;draw()}).catch(()=>{WM70.__scLoad=0})}
 let body="";
 if(WM70.tab==="friends")body=head(t.friends,1)+`<div class="sc-list">${friends.length?friends.map(friendRow).join(""):`<p class="sc-empty">${esc(t.nofriends)}</p>`}</div>`;
 else if(WM70.tab==="requests")body=head(t.requests,1)+`<div class="sc-list">${[...inc,...out].length?[...inc,...out].map(reqRow).join(""):`<p class="sc-empty">—</p>`}</div>`;
 else{const list=WM70.inbox||[];
  body=head(t.title)+`<form class="sc-search" onsubmit="event.preventDefault();wm70Search()">${I("search")}<input id="wm70-search" type="search" placeholder="${esc(t.search)}" maxlength="60" enterkeyhint="search"></form><div id="wm70-search-results" class="sc-list sc-res"></div>`+
  (friends.length?`<h4 class="sc-h">${esc(t.friends)}</h4><div class="sc-friends">${friends.slice(0,20).map(p=>`<button onclick="wm70OpenDM(${Number(p.id)})"><span class="sc-fav">${av(p)}</span><small dir="auto">${esc(p.name)}</small></button>`).join("")}</div>`:"")+
  `<div class="sc-list">${inc.length?`<button class="sc-row" onclick="WM70.tab='requests';wm70ChatDraw()"><span class="sc-sys blue">${I("invite")}</span><span class="sc-mid"><b>${esc(t.requests)}</b><small>${inc.length} ${esc(t.reqSub)}</small></span><span class="sc-end"><i class="sc-badge">${inc.length}</i></span></button>`:""}${list.map(convRow).join("")}${!list.length&&!inc.length?`<div class="sc-none"><span class="sc-sys teal">${I("chat")}</span><b>${esc(t.empty)}</b><small>${esc(t.emptySub)}</small></div>`:""}</div>`}
 V().innerHTML=`<main class="wn-page sc-page">${body}</main>`}
wm70ChatDraw=draw;window.wm70ChatDraw=draw;
/* search results in the same row style */
if(typeof wm70Search==="function"){const old=wm70Search;wm70Search=async function(){await old.apply(this,arguments);const out=document.getElementById("wm70-search-results");if(!out)return;const rows=[...out.querySelectorAll(".wm70-peer-row")];if(!rows.length)return;
 const ids=rows.map(r=>{const m=/wm70OpenProfile\((\d+)\)/.exec(r.innerHTML);return m&&Number(m[1])}).filter(Boolean);out.innerHTML=ids.map(id=>friendRow(WM70.people.get(id)||{id,name:String(id)})).join("")};window.wm70Search=wm70Search}
const st=document.createElement("style");st.textContent=`
.sc-page{padding-top:6px!important}
.sc-head{display:flex;align-items:center;gap:6px;margin:4px 0 12px}.sc-head h1{margin:0;font-size:26px;font-weight:800;color:var(--txt)}.sc-sp{flex:1}
.sc-ic{position:relative;width:42px;height:42px;border-radius:50%;border:0;background:none;color:var(--txt);display:flex;align-items:center;justify-content:center}.sc-ic svg{width:25px;height:25px}
.sc-dot{position:absolute;top:7px;right:7px;width:9px;height:9px;border-radius:50%;background:#f43f5e;box-shadow:0 0 0 2px var(--bg)}
.sc-search{display:flex;align-items:center;gap:10px;height:46px;padding:0 16px;margin:0 0 16px;border-radius:23px;background:var(--card2,rgba(255,255,255,.08));color:var(--mut)}.sc-search svg{width:20px;height:20px;flex:none}
.sc-search input{flex:1;min-width:0;height:100%;border:0!important;background:transparent!important;color:var(--txt);font:500 15px system-ui,-apple-system,sans-serif;outline:0;box-shadow:none!important;padding:0!important}
.sc-h{margin:0 2px 10px;font-size:14px;font-weight:800;color:var(--txt)}
.sc-friends{display:flex;gap:14px;overflow-x:auto;padding:0 2px 16px;scrollbar-width:none}.sc-friends::-webkit-scrollbar{display:none}
.sc-friends button{flex:none;width:68px;display:flex;flex-direction:column;align-items:center;gap:5px;border:0;background:none;color:var(--mut);padding:0}
.sc-fav{width:62px;height:62px;display:flex}.sc-fav>*{width:100%!important;height:100%!important}.sc-friends small{max-width:66px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px}
.sc-list{display:flex;flex-direction:column}
.sc-row{display:flex;align-items:center;gap:12px;width:100%;min-height:72px;padding:6px 2px;border:0;background:none;color:var(--txt);text-align:start;font:inherit}
.sc-av{flex:none;width:56px;height:56px;padding:0;border:0;background:none;display:flex}.sc-av>*{width:100%!important;height:100%!important}
.sc-mid{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:3px}.sc-mid>*{max-width:100%}.sc-mid b{font-size:16px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sc-mid small{font-size:13.5px;color:var(--mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sc-end{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:6px;align-self:stretch;justify-content:center}.sc-end time{font-size:12px;color:var(--mut)}
.sc-badge{min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#f43f5e;color:#fff;font:800 12px/22px system-ui;text-align:center;font-style:normal}
.sc-sys{flex:none;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff}.sc-sys svg{width:28px;height:28px;stroke-width:2}.sc-sys.blue{background:linear-gradient(135deg,#60a5fa,#2563eb)}.sc-sys.teal{background:linear-gradient(135deg,#5eead4,#0d9488)}
.sc-pill{flex:none;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px;border-radius:17px;border:0;background:var(--a1,#8b5cf6);color:#fff;font:700 13px system-ui,-apple-system,sans-serif}.sc-pill svg{width:16px;height:16px}.sc-pill.ok{background:#10b981}.sc-pill.ghost{background:var(--card2,rgba(255,255,255,.08));color:var(--txt)}
.sc-empty{text-align:center;color:var(--mut);padding:30px 0}
.sc-none{display:flex;flex-direction:column;align-items:center;gap:8px;padding:40px 10px;text-align:center}.sc-none b{font-size:16px}.sc-none small{color:var(--mut)}
.sc-res:empty{display:none}
`;document.head.appendChild(st);
if(typeof TAB!=="undefined"&&TAB==="d"&&!WM70.peer)draw();
})();
/* ---- M46: private chat thread in TopTop / Telegram style ---- */
(()=>{"use strict";
if(typeof wm70ThreadDraw!=="function")return;
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const I=k=>typeof wi11==="function"?wi11(k):"";
const TX={fa:{write:"پیام بنویس…",today:"امروز",yesterday:"دیروز",friend:"برای پیام دادن اول رفیق شوید",empty:"اولین پیام را بفرست 👋",older:"پیام‌های قبلی"},ps:{write:"پیغام ولیکئ…",today:"نن",yesterday:"پرون",friend:"د پیغام لپاره لومړی ملګري شئ",empty:"لومړی پیغام ولېږئ 👋",older:"پخواني پیغامونه"},en:{write:"Message…",today:"Today",yesterday:"Yesterday",friend:"Become friends to send messages",empty:"Say hi 👋",older:"Older messages"}};
const T=()=>{const l=document.documentElement.lang||"fa";return l.startsWith("ps")?TX.ps:(l==="fa"||l==="fa-IR")?TX.fa:TX.en};
const me=()=>Number(ME?.me?.id||0);
const hm=ts=>{const d=new Date(ts*1000);return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
function dayLabel(ts){const d=new Date(ts*1000),n=new Date(),y=new Date(n-864e5);if(d.toDateString()===n.toDateString())return T().today;if(d.toDateString()===y.toDateString())return T().yesterday;return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
const back=()=>{WM70.peer=null;++WM70.dmSeq;document.body.classList.remove("dt-open");wm70ChatDraw();try{wm70RefreshSocial()}catch(e){}};
window.dt46Back=back;
wm70ThreadDraw=function(){const p=WM70.people.get(WM70.peer)||{id:WM70.peer,name:"Wakhan"},t=T();document.body.classList.add("dt-open");
 V().innerHTML=`<main class="dt-page" dir="ltr"><header class="dt-head"><button class="dt-ic" onclick="dt46Back()" aria-label="back">${I("back")}</button><button class="dt-who" onclick="wm70OpenProfile(${Number(WM70.peer)})"><span class="dt-av">${typeof wm70Avatar==="function"?wm70Avatar(p):""}</span><span class="dt-nm"><b dir="auto">${esc(p.name)}</b><small>ID ${Number(p.id)}</small></span></button><button class="dt-ic" onclick="wm70PeerMenu(${Number(WM70.peer)})" aria-label="more">${I("more")}</button></header>
 <div id="wm70-dm-messages" class="dt-msgs"></div><p id="wm70-dm-notice" class="dt-notice"></p>
 <form class="dt-compose wm70-compose" onsubmit="event.preventDefault();wm70SendDM()"><textarea id="wm70-dm-text" rows="1" maxlength="2000" placeholder="${esc(t.write)}" dir="auto" enterkeyhint="send" oninput="this.style.height='42px';this.style.height=Math.min(Math.max(42,this.scrollHeight+2),120)+'px'"></textarea><button type="submit" aria-label="send">${I("send")}</button></form></main>`;
 const ta=document.getElementById("wm70-dm-text");ta.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!/Mobi|iPhone|Android/.test(navigator.userAgent)){e.preventDefault();wm70SendDM()}});
 wm70DMMessages()};
window.wm70ThreadDraw=wm70ThreadDraw;
wm70DMMessages=function(){const out=document.getElementById("wm70-dm-messages");if(!out)return;const t=T(),bottom=out.scrollHeight-out.scrollTop-out.clientHeight<120;
 const ms=WM70.messages||[];let html=ms.length>=30?`<button class="dt-older" onclick="wm70Older()">${esc(t.older)}</button>`:"";let lastDay="";
 ms.forEach((m,i)=>{const day=dayLabel(m.ts);if(day!==lastDay){html+=`<div class="dt-day"><span>${esc(day)}</span></div>`;lastDay=day}
  const mine=Number(m.sender)===me(),nx=ms[i+1],tail=!nx||Number(nx.sender)!==Number(m.sender)||nx.ts-m.ts>300||dayLabel(nx.ts)!==day;
  html+=`<div class="dt-row ${mine?"me":"them"} ${tail?"tail":""}"><div class="dt-b"><bdi dir="auto" class="wm70-native-emoji">${esc(m.text)}</bdi><span class="dt-t">${hm(m.ts)}${mine?`<i class="dt-tick">✓✓</i>`:""}</span></div></div>`});
 if(!ms.length)html+=`<div class="dt-empty">${esc(t.empty)}</div>`;
 out.innerHTML=html;if(bottom||!out.dataset.init){out.scrollTop=out.scrollHeight;out.dataset.init=1}
 const n=document.getElementById("wm70-dm-notice");if(n){const msg=WM70.dmError||(!WM70.dmCanSend?t.friend:"");n.textContent=msg;n.hidden=!msg}
 const b=document.querySelector(".dt-compose button");if(b)b.disabled=!WM70.dmCanSend||WM70.dmBusy};
window.wm70DMMessages=wm70DMMessages;
/* keep the page sized to the visible viewport (keyboard) */
const fit=()=>{const vv=window.visualViewport;if(!vv)return;document.documentElement.style.setProperty("--dt-h",Math.round(vv.height)+"px");document.documentElement.style.setProperty("--dt-top",Math.round(vv.offsetTop||0)+"px");const o=document.getElementById("wm70-dm-messages");if(o&&document.activeElement&&document.activeElement.id==="wm70-dm-text")o.scrollTop=o.scrollHeight};
try{visualViewport.addEventListener("resize",fit);visualViewport.addEventListener("scroll",fit)}catch(e){}fit();
/* leaving the chats tab closes the thread view state */
setInterval(()=>{if(document.body.classList.contains("dt-open")&&(typeof TAB==="undefined"||TAB!=="d"||!WM70.peer||!document.querySelector(".dt-page")))document.body.classList.remove("dt-open")},700);
const st=document.createElement("style");st.textContent=`
body.dt-open #nav,body.dt-open header:not(.dt-head){display:none!important}
.dt-page{position:fixed;left:0;right:0;top:var(--dt-top,0px);height:var(--dt-h,100dvh);max-width:760px;margin:0 auto;z-index:60;display:flex;flex-direction:column;background:var(--bg)}
.dt-head{flex:none;display:flex;align-items:center;gap:4px;padding:8px 8px;border-bottom:1px solid var(--ln);background:color-mix(in srgb,var(--bg2,var(--bg)) 92%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.dt-ic{flex:none;width:40px;height:40px;border-radius:50%;border:0;background:none;color:var(--txt);display:flex;align-items:center;justify-content:center}.dt-ic svg{width:24px;height:24px}
.dt-who{flex:1;min-width:0;display:flex;align-items:center;gap:10px;border:0;background:none;color:var(--txt);text-align:start;padding:0}
.dt-av{flex:none;width:42px;height:42px;display:flex}.dt-av>*{width:100%!important;height:100%!important}
.dt-nm{min-width:0;display:flex;flex-direction:column;align-items:flex-start}.dt-nm b{font-size:16px;font-weight:800;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dt-nm small{font-size:11.5px;color:var(--mut)}
.dt-msgs{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:10px 12px 6px;display:flex;flex-direction:column;gap:2px}
.dt-msgs>*:first-child{margin-top:auto}
.dt-day{display:flex;justify-content:center;margin:10px 0 6px}.dt-day span{padding:3px 12px;border-radius:12px;background:var(--card2,rgba(255,255,255,.08));color:var(--mut);font:600 11.5px system-ui,-apple-system,sans-serif}
.dt-row{display:flex}.dt-row.me{justify-content:flex-end}.dt-row.tail{margin-bottom:6px}
.dt-b{position:relative;max-width:78%;padding:7px 11px 6px;border-radius:18px;font:500 15px/1.45 system-ui,-apple-system,sans-serif;color:var(--txt);white-space:pre-wrap;overflow-wrap:anywhere;box-shadow:0 1px 2px rgba(0,0,0,.18)}
.dt-b bdi{unicode-bidi:plaintext}
.dt-row.them .dt-b{background:var(--card2,rgba(255,255,255,.09));border:1px solid var(--ln)}
.dt-row.me .dt-b{background:linear-gradient(135deg,var(--a1,#8b5cf6),color-mix(in srgb,var(--a1,#8b5cf6) 65%,#000));color:#fff;border:0}
.dt-row.them.tail .dt-b{border-bottom-left-radius:5px}.dt-row.me.tail .dt-b{border-bottom-right-radius:5px}
.dt-t{float:right;margin:6px 0 -2px 10px;font-size:10.5px;opacity:.7;display:inline-flex;gap:3px;align-items:center}.dt-tick{font-style:normal;font-size:10px;letter-spacing:-3px;margin-right:2px}
.dt-older{align-self:center;margin:4px 0 8px;padding:6px 14px;border-radius:14px;border:1px solid var(--ln);background:var(--card);color:var(--mut);font:600 12px system-ui}
.dt-empty{align-self:center;margin:auto 0;color:var(--mut);font-size:14px}
.dt-notice{flex:none;margin:0;padding:6px 14px;text-align:center;font-size:12px;color:var(--mut)}.dt-notice[hidden]{display:none}
.dt-compose{flex:none;display:flex;align-items:flex-end;gap:8px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));border-top:1px solid var(--ln);background:var(--bg)}
.dt-compose textarea{flex:1;box-sizing:border-box!important;height:42px;min-height:42px!important;max-height:120px;margin:0!important;resize:none;padding:10px 16px;border-radius:21px;border:1px solid var(--ln);background:var(--card2,rgba(255,255,255,.07));color:var(--txt);font:500 15px/1.4 system-ui,-apple-system,sans-serif;outline:0}
.dt-compose textarea:focus{border-color:color-mix(in srgb,var(--a1,#8b5cf6) 60%,transparent)}
.dt-compose button{flex:none;width:42px;height:42px;border-radius:50%;border:0;background:var(--a1,#8b5cf6);color:#fff;display:flex;align-items:center;justify-content:center}.dt-compose button svg{width:20px;height:20px;stroke-width:2.1}.dt-compose button:disabled{opacity:.4}
`;document.head.appendChild(st);
})();
