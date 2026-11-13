/* Cinema opens a directory; room entry is always an explicit choice. */
(()=>{'use strict';
 const state={tab:'mine',filter:'favorites',query:'',halls:[],mine:null,ready:false,busy:false,error:false,at:0,seq:0,ownAt:0,cache:new Map()};
 const copy={fa:{mine:'دنج من',discover:'کشف سالن‌ها',favorites:'دنبال‌شده‌ها',friends:'دوستان',recent:'اخیر',all:'همه',search:'نام، صاحب سالن یا کد…',enter:'ورود به سالن',create:'ساخت دنج من',join:'ورود با کد',code:'کد سالن',empty:'هنوز سالنی در این فهرست نیست',error:'فهرست باز نشد؛ دوباره تلاش کن',retry:'تلاش دوباره',back:'برگشت',people:'نفر',name:'نام دنج من',own:'سالن اختصاصی تو',saved:'دنبال‌کردن',following:'دنبال می‌کنی'},ps:{mine:'زما سینما',discover:'سالونونه',favorites:'تعقیب شوي',friends:'ملګري',recent:'وروستي',all:'ټول',search:'نوم یا د سالون کوډ…',enter:'سالون ته ننوتل',create:'زما سینما جوړه کړئ',join:'په کوډ ننوتل',code:'د سالون کوډ',empty:'لا سالون نشته',error:'بیا هڅه وکړئ',retry:'بیا هڅه',back:'شاته',people:'کسان',name:'د سینما نوم',own:'ستاسو سالون',saved:'تعقیبول',following:'تعقیب شوی'},en:{mine:'My cinema',discover:'Discover',favorites:'Following',friends:'Friends',recent:'Recent',all:'All',search:'Room, host or code…',enter:'Enter room',create:'Create my cinema',join:'Join by code',code:'Room code',empty:'No rooms in this list yet',error:'Could not load rooms. Try again.',retry:'Retry',back:'Back',people:'people',name:'My cinema name',own:'Your own room',saved:'Follow',following:'Following'}};
 const tx=key=>(copy[String(document.documentElement.lang||'en').slice(0,2)]||copy.en)[key]||key;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const isLobby=()=>TAB==='c'&&CV==='lobby';
 const card=(room,own=false)=>`<article class="wk-room-card"><button type="button" data-enter="${esc(room.code)}"><span class="wk-room-photo">${room.photo?`<img src="${esc(room.photo)}" alt="" loading="lazy">`:`<b>${esc((room.name||'W').charAt(0))}</b>`}</span><span class="wk-room-copy"><b dir="auto">${esc(room.name)}</b><small dir="auto">${esc(room.now||room.topic||room.owner_name||tx('own'))}</small><span class="wk-room-code">${esc(room.code)}</span></span><span class="wk-room-count" aria-label="${Number(room.live)||0} ${esc(tx('people'))}"><span class="wk-room-number">${Number(room.live)||0}</span><span class="wk-room-meter" aria-hidden="true"><i></i><i></i><i></i></span></span></button>${own?'':`<button type="button" class="wk-room-follow" data-follow="${esc(room.code)}" aria-pressed="${!!room.favorite}" aria-label="${esc(tx(room.favorite?'following':'saved'))}">${room.favorite?'♥':'♡'}</button>`}</article>`;
 const listKey=()=>state.filter+'|'+state.query;
 function updateHTML(node,html){if(node.__wkHTML!==html){node.innerHTML=html;node.__wkHTML=html}}
 function paintRooms(node,list){
  const existing=new Map([...node.children].map(item=>[item.dataset.room,item]));
  list.forEach((room,index)=>{
   let item=existing.get(room.code);const html=card(room);
   if(!item||item.__wkHTML!==html){const template=document.createElement('template');template.innerHTML=html;const next=template.content.firstElementChild;next.dataset.room=room.code;next.__wkHTML=html;if(item)item.replaceWith(next);item=next}
   existing.delete(room.code);if(node.children[index]!==item)node.insertBefore(item,node.children[index]||null);
  });
  for(const item of existing.values())item.remove();
 }
 function paint(){
  if(!isLobby())return;
  let node=V().querySelector('.wk-cinema-lobby');
  if(!node||node.dataset.language!==document.documentElement.lang){
   document.body.classList.remove('h2-open','wm78-room-open','wmc-hall-active','wm75-lobby-mode','wk-typing');
   V().innerHTML='<main class="wk-cinema-lobby"></main>';node=V().querySelector('.wk-cinema-lobby');
   node.dataset.language=document.documentElement.lang;
   node.innerHTML=`<div class="wk-lobby-top"><div role="group">${['mine','discover'].map(key=>`<button type="button" data-tab="${key}">${esc(tx(key))}</button>`).join('')}</div><button type="button" data-search aria-label="${esc(tx('search'))}">⌕</button></div><form class="wk-lobby-search"><input type="search" value="${esc(state.query)}" placeholder="${esc(tx('search'))}" aria-label="${esc(tx('search'))}"><button type="submit" aria-label="${esc(tx('search'))}">⌕</button></form><div class="wk-lobby-own"></div><div class="wk-lobby-filters" role="group"></div><div class="wk-lobby-rooms"></div><div class="wk-lobby-feedback"></div><form class="wk-lobby-join"><input name="code" maxlength="8" minlength="6" pattern="[A-Za-z0-9]{6,8}" placeholder="${esc(tx('code'))}" aria-label="${esc(tx('code'))}" autocomplete="off"><button type="submit">${esc(tx('join'))}</button></form>`;
   node.onclick=async event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-search'))return node.querySelector('input[type=search]').focus();
    if(button.dataset.tab){if(state.tab===button.dataset.tab)return;state.tab=button.dataset.tab;state.filter=state.tab==='mine'?'favorites':'all';return void refresh()}
    if(button.dataset.filter){if(state.filter===button.dataset.filter)return;state.filter=button.dataset.filter;return void refresh()}
    if(button.dataset.enter)return void enter(button.dataset.enter);
    if(button.hasAttribute('data-retry'))return void refresh();
    if(button.dataset.follow){
     button.disabled=true;const room=state.halls.find(room=>room.code===button.dataset.follow);if(!room)return;
     try{const r=await api('/api/app/rooms/favorite',{code:room.code,favorite:!room.favorite});if(!r.ok)throw Error('follow');state.cache.clear();void refresh()}catch{button.disabled=false}
    }
   };
   node.onsubmit=async event=>{
    event.preventDefault();const form=event.target;
    if(form.matches('.wk-lobby-search')){state.query=form.querySelector('input').value.trim();return void refresh()}
    if(form.matches('.wk-lobby-join'))return void enter(form.elements.code.value.trim().toUpperCase());
    if(form.matches('.wk-lobby-create')){
     const button=form.querySelector('button');button.disabled=true;
     try{const r=await api('/api/room/new',{a:'create',name:form.elements.name.value.trim()});if(!r.ok)throw Error('create');state.mine=r.cinema||{code:r.code,name:form.elements.name.value};WMP.mine=state.mine;WMP.loaded=true;state.ownAt=0;void refresh()}catch{button.disabled=false}
    }
   };
  }
  const list=state.halls.filter(room=>room.code!==state.mine?.code),filters=state.tab==='mine'?['favorites','friends','recent']:['all','friends','recent'];
  node.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-pressed',String(state.tab===button.dataset.tab)));
  const own=node.querySelector('.wk-lobby-own');own.hidden=state.tab!=='mine';
  if(state.tab==='mine')updateHTML(own,state.mine?card(state.mine,true):state.ready?`<form class="wk-lobby-create"><input name="name" maxlength="60" required placeholder="${esc(tx('name'))}" value="${esc(ME?.me?.name||'')}"><button type="submit">${esc(tx('create'))}</button></form>`:'');
  const group=node.querySelector('.wk-lobby-filters');updateHTML(group,filters.map(key=>`<button type="button" data-filter="${key}">${esc(tx(key))}</button>`).join(''));
  group.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(state.filter===button.dataset.filter)));
  const rooms=node.querySelector('.wk-lobby-rooms');paintRooms(rooms,list);rooms.setAttribute('aria-busy',String(state.busy));
  updateHTML(node.querySelector('.wk-lobby-feedback'),state.busy?'<p class="wk-lobby-status" role="status">…</p>':state.error?`<p class="wk-lobby-status" role="alert">${esc(tx('error'))}<button type="button" data-retry>${esc(tx('retry'))}</button></p>`:!list.length?`<p class="wk-lobby-status">${esc(tx('empty'))}</p>`:'');
 }
 async function refresh(){
  if(!isLobby())return;
  const seq=++state.seq,key=listKey(),filter=state.filter,query=state.query,loadOwn=!state.ownAt||Date.now()-state.ownAt>20000;
  state.halls=state.cache.get(key)||[];state.busy=true;state.error=false;paint();
  try{
   const [mine,result]=await Promise.all([loadOwn?api('/api/room/new',{a:'mine'}):Promise.resolve({ok:true,cinema:state.mine}),api('/api/app/rooms?filter='+filter+'&q='+encodeURIComponent(query))]);
   if(seq!==state.seq)return;if(!mine.ok||!result.ok)throw Error('directory');
   let own=mine.cinema||null;
   if(own){
    const listed=(result.halls||[]).find(room=>room.code===own.code),cached=window.H2?.state?.info;
    own={...own,...listed,...(cached?.code===own.code?cached:{})};
    if(loadOwn)try{const detail=await api('/api/v51/hall?code='+encodeURIComponent(own.code));if(detail.ok&&detail.hall?.code===own.code)own={...own,...detail.hall}}catch{}
   }
   if(seq!==state.seq)return;
   state.mine=own;WMP.mine=own;WMP.loaded=true;state.halls=result.halls||[];state.cache.set(key,state.halls);if(state.cache.size>12)state.cache.delete(state.cache.keys().next().value);state.ready=true;state.at=Date.now();if(loadOwn)state.ownAt=state.at;
  }
  catch{if(seq===state.seq)state.error=true}finally{if(seq===state.seq){state.busy=false;paint()}}
 }
 async function enter(code){if(!/^[A-Z0-9]{6,8}$/.test(code))return;document.activeElement?.blur();if(CID===code&&H2.state.min){CV='hall';go('c');return}CV='hall';await enterRoom(code)}
 const controller={opening:false,isLobby,render(){paint();if(!state.busy&&(!state.ready||Date.now()-state.at>20000))void refresh()},open(){document.activeElement?.blur();state.at=0;state.ownAt=0;const cached=window.H2?.state?.info;if(cached?.code){if(state.mine?.code===cached.code)state.mine={...state.mine,...cached};state.halls=state.halls.map(room=>room.code===cached.code?{...room,...cached}:room)}controller.opening=true;try{go('c');if(isLobby())controller.render()}finally{controller.opening=false}}};
 const previous=rCinema;rCinema=function(){if(isLobby())return controller.render();return previous.apply(this,arguments)};
 const leaveRoom=exitRoom;exitRoom=function(...args){const result=leaveRoom.apply(this,args);CV='lobby';controller.open();return result};window.exitRoom=exitRoom;
 window.WakhanCinema=controller;
})();
