import {normalizeMusicQuery} from './search-normalization.mjs';

const WORDS={
 fa:{discover:'پیدا کردن دنج',tools:'صف آهنگ و بازی',all:'همه',favorites:'علاقه‌مندی‌ها',friends:'رفیقا',recent:'تازه رفته‌ها',events:'برنامه‌ها',search:'جستجو',name:'نام، موضوع یا کد دنج…',enter:'ورود',closed:'بسته',empty:'چیزی پیدا نشد',close:'بستن',queue:'صف آهنگ',game:'بازی گروهی',settings:'موضوع و برنامه',add:'پیشنهاد آهنگ',vote:'رأی',play:'پخش',remove:'برداشتن',language:'زبان',topic:'موضوع',event:'نام برنامه',starts:'زمان شروع',save:'ذخیره',saved:'ذخیره شد',error:'نشد؛ دوباره تلاش کن',loading:'در حال دریافت…',noQueue:'هنوز آهنگی پیشنهاد نشده',queueHint:'آهنگ پیشنهاد کن و رأی بده؛ پخش با میزبان است.',gameTitle:'حدس عدد',gameHint:'یک عدد از ۱ تا ۲۰ انتخاب کن. هر نفر یک حدس دارد؛ نزدیک‌ترین حدس برنده است. این بازی سکه یا شرط‌بندی ندارد.',start:'شروع دور ۳۰ ثانیه‌ای',finish:'پایان دور',guess:'ثبت حدس',wait:'منتظر شروع میزبان',yourGuess:'حدس تو',answer:'عدد این دور',remaining:'ثانیه مانده',submitted:'ثبت شد',count:'حدس',emptyGame:'کسی حدس نزد',noStart:'برنامه‌ای تنظیم نشده',favorite:'علاقه‌مندی',friendCount:'رفیق در دنج',live:'نفر حاضر',refresh:'تازه‌سازی',optional:'اختیاری'},
 ps:{discover:'دنج پیدا کړئ',tools:'د سندرو کتار او لوبه',all:'ټول',favorites:'خوښ شوي',friends:'ملګري',recent:'وروستي',events:'پروګرامونه',search:'لټون',name:'نوم، موضوع یا د دنج کوډ…',enter:'ننوتل',closed:'تړلی',empty:'څه ونه موندل شول',close:'تړل',queue:'د سندرو کتار',game:'ډله‌ییزه لوبه',settings:'موضوع او پروګرام',add:'سندره وړاندیز کړئ',vote:'رایه',play:'غږول',remove:'لرې کول',language:'ژبه',topic:'موضوع',event:'د پروګرام نوم',starts:'د پیل وخت',save:'ساتل',saved:'وساتل شو',error:'بیا هڅه وکړئ',loading:'را اخیستل کېږي…',noQueue:'لا سندره نه ده وړاندیز شوې',queueHint:'سندره وړاندیز او رایه ورکړئ؛ کوربه یې غږوي.',gameTitle:'شمېره اټکل کړئ',gameHint:'له ۱ تر ۲۰ یوه شمېره وټاکئ. هر کس یو اټکل لري؛ تر ټولو نږدې اټکل ګټي. سکې او شرط نشته.',start:'۳۰ ثانیې پړاو پیل',finish:'پړاو پای',guess:'اټکل ثبت',wait:'د کوربه پیل ته انتظار',yourGuess:'ستاسو اټکل',answer:'د پړاو شمېره',remaining:'ثانیې پاتې',submitted:'ثبت شو',count:'اټکل',emptyGame:'چا اټکل ونه کړ',noStart:'پروګرام نشته',favorite:'خوښ شوی',friendCount:'ملګري په دنج کې',live:'ګډونوال',refresh:'تازه کول',optional:'اختیاري'},
 en:{discover:'Find a hall',tools:'Song queue and game',all:'All',favorites:'Favorites',friends:'Friends',recent:'Recent',events:'Events',search:'Search',name:'Hall name, topic or code…',enter:'Join',closed:'Closed',empty:'Nothing found',close:'Close',queue:'Song queue',game:'Group game',settings:'Topic and event',add:'Suggest a song',vote:'Vote',play:'Play',remove:'Remove',language:'Language',topic:'Topic',event:'Event name',starts:'Start time',save:'Save',saved:'Saved',error:'Could not complete; try again',loading:'Loading…',noQueue:'No songs suggested yet',queueHint:'Suggest songs and vote. The host controls playback.',gameTitle:'Guess the number',gameHint:'Choose a number from 1 to 20. One guess per person; the closest guess wins. No coins or betting.',start:'Start a 30-second round',finish:'Finish round',guess:'Submit guess',wait:'Waiting for the host',yourGuess:'Your guess',answer:'Round number',remaining:'seconds left',submitted:'Submitted',count:'guesses',emptyGame:'No guesses',noStart:'No event scheduled',favorite:'Favorite',friendCount:'friends here',live:'people here',refresh:'Refresh',optional:'Optional'}
};
const LANGUAGES=[['','—'],['fa','فارسی / دری'],['ps','پښتو'],['en','English'],['ar','العربية'],['de','Deutsch'],['ur','اردو'],['other','Other']];
const h=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');

export function installRoomTools({request,getContext,getUser,enter,play,language=()=>document.documentElement.lang,document:doc=globalThis.document}={}){
 const words=()=>WORDS[String(language()).slice(0,2)]||WORDS.en;
 const date=timestamp=>timestamp?new Date(timestamp*1000).toLocaleString():'';
 const cache=new Map();let active=null;
 const call=async(path,body)=>{const result=await request(path,body);if(!result?.ok)throw Error(result?.err||'network');return result};
 if(!doc.getElementById('wkr-style')){
  const style=doc.createElement('style');style.id='wkr-style';style.textContent=`
  .wkr{box-sizing:border-box;width:min(620px,calc(100vw - 20px));max-height:90dvh;overflow:auto;padding:16px;border:1px solid #ffffff25;border-radius:20px;background:var(--bg2,#171327);color:var(--txt,#fff);font:inherit}
  .wkr::backdrop{background:#0009}.wkr *{box-sizing:border-box}.wkr header{display:flex!important;position:static!important;gap:8px;align-items:center;padding:0!important;background:none!important}.wkr h2{flex:1;margin:0;font-size:19px}.wkr h3{font-size:15px;margin:8px 0}.wkr button,.wkr select,.wkr input{min-height:44px;border:1px solid #ffffff20;border-radius:10px;padding:8px 12px;background:#ffffff09;color:inherit;font:inherit;box-shadow:none}.wkr button{cursor:pointer}.wkr button:disabled{opacity:.5}.wkr select{background:var(--bg2,#171327)}.wkr button[data-primary]{background:var(--a1,#7c3aed);color:#fff;border-color:transparent}.wkr .wkr-tabs{display:flex;gap:6px;overflow:auto;padding:12px 0}.wkr .wkr-tabs button{white-space:nowrap;flex:none}.wkr .wkr-tabs button[aria-pressed=true]{background:var(--a1,#7c3aed);color:white}.wkr form{display:flex;gap:8px;flex-wrap:wrap}.wkr input[type=search]{flex:1;min-width:120px;width:100%;font-size:16px}.wkr [role=status]{font-size:12px;line-height:1.6;min-height:20px;margin:5px 0}.wkr-list{display:flex;flex-direction:column;gap:10px}.wkr-card{border:1px solid #ffffff15;background:#ffffff04;border-radius:14px;padding:12px}.wkr-card-top{display:flex;gap:10px;align-items:center}.wkr-card-top>div{flex:1;min-width:0}.wkr-card p,.wkr small{font-size:12px;line-height:1.6;opacity:.78;margin:3px 0}.wkr-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.wkr-form{display:flex!important;flex-direction:column;gap:10px}.wkr-form label{display:flex;flex-direction:column;gap:5px;font-size:13px}.wkr-game-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.wkr-game-grid button{min-width:0;padding:6px}.wkr-game-grid button[aria-pressed=true]{background:var(--a1,#7c3aed)}.wkr-search-results{margin-top:10px}.wkr [hidden]{display:none!important}.wkr-discover{display:block;width:100%;min-height:48px;margin:10px 0;padding:10px 16px;border:1px solid #ffffff25;border-radius:14px;background:var(--a1,#7c3aed);color:white;font:inherit}
  `;doc.head.append(style);
 }
 function modal(title){
  active?.close();const node=doc.createElement('dialog');node.className='wkr';node.dir=['fa','ps','ar','ur'].includes(String(language()).slice(0,2))?'rtl':'ltr';
  node.innerHTML='<header><h2></h2><button type="button" data-close>×</button></header><p role="status"></p><div data-body></div>';
  node.querySelector('h2').textContent=title;node.querySelector('[data-close]').setAttribute('aria-label',words().close);
  node.querySelector('[data-close]').className='wkr-close';
  const value={node,closed:false,cleanup:null,close(){if(value.closed)return;value.closed=true;value.cleanup?.();node.remove();if(active===value)active=null}};
  node.querySelector('[data-close]').onclick=value.close;node.addEventListener('cancel',value.close);node.addEventListener('close',value.close);
  node.querySelector('header').style.position='static';doc.body.append(node);node.showModal();active=value;return value;
 }
 const status=(dialog,value)=>{if(!dialog.closed)dialog.node.querySelector('[role=status]').textContent=value};
 function openDirectory(){
  const tx=words(),dialog=modal(tx.discover),body=dialog.node.querySelector('[data-body]');let filter='all',serial=0;
  body.innerHTML='<div class="wkr-tabs" role="group"></div><form><input type="search" maxlength="60"><select data-language></select><button type="submit"></button></form><div class="wkr-list" style="margin-top:12px"></div>';
  const nav=body.querySelector('.wkr-tabs'),input=body.querySelector('input'),select=body.querySelector('select');input.placeholder=tx.name;input.setAttribute('aria-label',tx.search);
  body.querySelector('form button').textContent=tx.search;select.setAttribute('aria-label',tx.language);
  for(const [value,label]of LANGUAGES){const option=doc.createElement('option');option.value=value;option.textContent=value?label:tx.all;select.append(option)}
  for(const name of ['all','favorites','friends','recent','events']){const button=doc.createElement('button');button.type='button';button.textContent=tx[name];button.onclick=()=>{filter=name;load()};button.dataset.filter=name;nav.append(button)}
  async function load(force=false){
   const seq=++serial,query=new URLSearchParams({filter,language:select.value,q:normalizeMusicQuery(input.value)}),id=query.toString();
   for(const button of nav.children)button.setAttribute('aria-pressed',String(button.dataset.filter===filter));
   status(dialog,tx.loading);
   try{
    let result=cache.get(id);
    if(force||!result||Date.now()-result.at>30000){result={value:await call('/api/app/rooms?'+query),at:Date.now()};cache.set(id,result);while(cache.size>12)cache.delete(cache.keys().next().value)}
    if(dialog.closed||seq!==serial)return;
    const list=body.querySelector('.wkr-list');list.replaceChildren();
    for(const room of result.value.halls){
     const card=doc.createElement('article');card.className='wkr-card';
     card.innerHTML=`<div class="wkr-card-top"><div><h3 dir="auto">${h(room.name)}</h3><small dir="auto">${h(room.topic||room.owner_name||room.code)}</small></div><button type="button" data-star aria-label="${h(tx.favorite)}" aria-pressed="${!!room.favorite}">${room.favorite?'★':'☆'}</button></div><p>${Number(room.now)||0} ${h(tx.live)}${room.friends_present?' · '+Number(room.friends_present)+' '+h(tx.friendCount):''}</p>${room.starts?`<p dir="auto">${h(room.event_title)} · ${h(date(room.starts))}</p>`:''}<div class="wkr-actions"><button type="button" data-enter data-primary ${room.can_enter===false?'disabled':''}>${h(room.can_enter===false?tx.closed:tx.enter)}</button></div>`;
     card.querySelector('[data-enter]').onclick=()=>{dialog.close();enter(room.code)};
     card.querySelector('[data-star]').onclick=async event=>{event.currentTarget.disabled=true;try{await call('/api/app/rooms/favorite',{code:room.code,favorite:!room.favorite});cache.clear();await load(true)}catch{status(dialog,tx.error);event.target.disabled=false}};
     list.append(card);
    }
    status(dialog,result.value.halls.length?'':tx.empty);
   }catch{if(seq===serial)status(dialog,tx.error)}
  }
  body.querySelector('form').onsubmit=event=>{event.preventDefault();load(true)};select.onchange=()=>load();load();
 }

 function openActivity(){
  const room=getContext()?.room;if(!room)return;
  const tx=words(),dialog=modal(tx.tools),body=dialog.node.querySelector('[data-body]');
  let data=null,tab='queue',polling=false,view='',signature='',searchSeq=0,receivedAt=Date.now();
  body.innerHTML='<div class="wkr-tabs" role="group"></div><div data-content></div>';
  const nav=body.querySelector('.wkr-tabs'),content=body.querySelector('[data-content]');
  async function action(payload){
   try{status(dialog,tx.loading);const result=await call('/api/app/rooms/'+room+'/activity',payload);if(dialog.closed)return;data=result;receivedAt=Date.now();render();status(dialog,'');return result}catch{status(dialog,tx.error);return null}
  }
  async function refresh(){
   if(polling||dialog.closed||doc.visibilityState==='hidden'||getContext()?.room!==room)return;
   polling=true;
   try{const result=await call('/api/app/rooms/'+room+'/activity');if(!dialog.closed){data=result;receivedAt=Date.now();render();status(dialog,'')}}catch{status(dialog,tx.error)}finally{polling=false}
  }
  function render(){
   if(!data||dialog.closed)return;
   const tabs=data.owner?['queue','game','settings']:['queue','game'];
   if(nav.children.length!==tabs.length){nav.replaceChildren();for(const name of tabs){const button=doc.createElement('button');button.type='button';button.textContent=tx[name];button.dataset.tab=name;button.onclick=()=>{tab=name;render()};nav.append(button)}}
   for(const button of nav.children)button.setAttribute('aria-pressed',String(button.dataset.tab===tab));
   if(view!==tab){view=tab;signature='';content.replaceChildren();if(tab==='queue')queueView();else if(tab==='settings')settingsView()}
   if(tab==='queue')drawQueue();else if(tab==='game')gameView();
  }
  function queueView(){
   content.innerHTML=`<p>${h(tx.queueHint)}</p><form><select data-provider><option value="youtube">YouTube</option><option value="soundcloud">SoundCloud</option></select><input type="search" maxlength="120" placeholder="${h(tx.add)}" aria-label="${h(tx.search)}"><button type="submit">${h(tx.search)}</button></form><div class="wkr-search-results"></div><div class="wkr-list" style="margin-top:12px" data-queue></div>`;
   const form=content.querySelector('form');
   form.onsubmit=async event=>{
    event.preventDefault();const q=normalizeMusicQuery(form.querySelector('input').value);if(!q)return;const seq=++searchSeq,provider=form.querySelector('select').value;status(dialog,tx.loading);
    try{
     const result=await call('/api/cinema/search?'+new URLSearchParams({provider,q}));if(dialog.closed||seq!==searchSeq||tab!=='queue')return;
     const results=content.querySelector('.wkr-search-results');results.replaceChildren();
     for(const track of result.items||[]){const button=doc.createElement('button');button.type='button';button.style.cssText='display:block;width:100%;margin-block:6px;text-align:start';button.textContent='+ '+track.title;
      const intent={action:'add',provider,track_id:provider==='youtube'?String(track.id||''):'',url:track.url||'',title:String(track.title||'').slice(0,180),client_key:key()};
      button.onclick=async()=>{button.disabled=true;const result=await action(intent);if(result){button.textContent=tx.submitted}else button.disabled=false};results.append(button)}
     status(dialog,result.items?.length?'':tx.empty);
    }catch{status(dialog,tx.error)}
   };
  }
  function drawQueue(){
   const sig=JSON.stringify([data.queue,data.host]);if(signature===sig)return;signature=sig;
   const list=content.querySelector('[data-queue]');list.replaceChildren();
   for(const item of data.queue){
    const row=doc.createElement('article');row.className='wkr-card';row.innerHTML=`<h3 dir="auto">${h(item.title)}</h3><small>${h(item.provider==='youtube'?'YouTube':'SoundCloud')}</small><div class="wkr-actions"><button type="button" data-vote aria-pressed="${!!item.voted}">${h(tx.vote)} · ${Number(item.votes)}</button>${data.host?`<button type="button" data-play data-primary>${h(tx.play)}</button>`:''}${data.host||Number(item.uid)===Number(getUser())?`<button type="button" data-remove>${h(tx.remove)}</button>`:''}</div>`;
    row.querySelector('[data-vote]').onclick=()=>action({action:'vote',id:item.id,voted:!item.voted});
    row.querySelector('[data-remove]')?.addEventListener('click',()=>action({action:'remove',id:item.id}));
    row.querySelector('[data-play]')?.addEventListener('click',async event=>{event.target.disabled=true;try{await play(room,item);await action({action:'played',id:item.id})}catch{status(dialog,tx.error);event.target.disabled=false}});
    list.append(row);
   }
   if(!data.queue.length){const empty=doc.createElement('p');empty.textContent=tx.noQueue;list.append(empty)}
  }
  function gameView(){
   const game=data.game,sig=JSON.stringify([game,data.host]);if(signature===sig)return;signature=sig;
   content.innerHTML=`<h3>${h(tx.gameTitle)}</h3><p>${h(tx.gameHint)}</p>`;
   if(!game||game.finished){
    if(game){const result=doc.createElement('div');result.className='wkr-card';result.innerHTML=`<b>${h(tx.answer)}: ${Number(game.answer)}</b>`;
     for(const [index,row]of (game.results||[]).entries()){const line=doc.createElement('p');line.dir='auto';line.textContent=(index===0?'🏆 ':'')+row.person.name+': '+row.value;result.append(line)}content.append(result)}
    if(data.host){const start=doc.createElement('button');start.type='button';start.textContent=tx.start;start.dataset.primary='';start.onclick=()=>action({action:'start_game'});content.append(start)}
    else{const wait=doc.createElement('p');wait.textContent=tx.wait;content.append(wait)}
    return;
   }
   const counter=doc.createElement('p');counter.dataset.countdown=game.ends;content.append(counter);countdown();
   const count=doc.createElement('p');count.textContent=game.count+' '+tx.count;content.append(count);
   if(game.mine!==null){const mine=doc.createElement('b');mine.textContent=tx.yourGuess+': '+game.mine;content.append(mine)}
   else{const grid=doc.createElement('div');grid.className='wkr-game-grid';for(let value=1;value<=20;value++){const button=doc.createElement('button');button.type='button';button.textContent=String(value);button.onclick=()=>{for(const b of grid.children)b.disabled=true;action({action:'guess',round:game.id,value}).then(result=>{if(!result)for(const b of grid.children)b.disabled=false})};grid.append(button)}content.append(grid)}
   if(data.host){const finish=doc.createElement('button');finish.type='button';finish.textContent=tx.finish;finish.style.marginTop='12px';finish.onclick=()=>action({action:'end_game',round:game.id});content.append(finish)}
  }
  function countdown(){const counter=content.querySelector('[data-countdown]');if(counter)counter.textContent=Math.max(0,Number(counter.dataset.countdown)-(data.server_now+Math.floor(Math.max(0,Date.now()-receivedAt)/1000)))+' '+tx.remaining}
  function settingsView(){
   const meta=data.meta;
   content.innerHTML=`<form class="wkr-form"><label>${h(tx.language)}<select name="language">${LANGUAGES.filter(([value])=>value).map(([value,label])=>`<option value="${value}">${h(label)}</option>`).join('')}</select></label><label>${h(tx.topic)}<input name="topic" maxlength="40"></label><label>${h(tx.event)}<input name="event_title" maxlength="80" placeholder="${h(tx.optional)}"></label><label>${h(tx.starts)}<input name="starts" type="datetime-local"></label><button type="submit" data-primary>${h(tx.save)}</button></form>`;
   const form=content.querySelector('form');form.elements.language.value=meta.language;form.elements.topic.value=meta.topic;form.elements.event_title.value=meta.event_title;
   if(meta.starts){const date=new Date(meta.starts*1000);form.elements.starts.value=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16)}
   form.onsubmit=async event=>{event.preventDefault();const starts=form.elements.starts.value?Math.floor(new Date(form.elements.starts.value).getTime()/1000):0;
    try{await call('/api/app/rooms/'+room+'/meta',{language:form.elements.language.value,topic:form.elements.topic.value,event_title:form.elements.event_title.value,starts});cache.clear();status(dialog,tx.saved)}catch{status(dialog,tx.error)}};
  }
  const timer=setInterval(()=>{countdown();refresh()},3000);dialog.cleanup=()=>clearInterval(timer);refresh();
 }
 function decorateLobby(){
  if(getContext()?.tab!=='c'||getContext()?.room)return;
  const root=globalThis.window.WakhanPages?.view();if(!root||root.querySelector('.wkr-discover'))return;
  const button=doc.createElement('button');button.type='button';button.className='wkr-discover';button.textContent=words().discover;button.onclick=openDirectory;
  (root.querySelector('main')||root.firstElementChild||root).prepend(button);
 }
 for(const name of ['rCinema','rRoomGate']){const original=globalThis.window[name];if(typeof original==='function')globalThis.window[name]=function(...args){const result=original.apply(this,args);decorateLobby();return result}}
 if(globalThis.window.H2?.menu){const original=globalThis.window.H2.menu;globalThis.window.H2.menu=async function(...args){await original.apply(this,args);const grid=doc.querySelector('#sheet .h2-grid');if(grid&&!grid.querySelector('[data-room-tools]')){const button=doc.createElement('button');button.type='button';button.dataset.roomTools='';button.textContent=words().tools;button.onclick=()=>{globalThis.window.closeSheet?.();openActivity()};grid.prepend(button)}}}
 return {openDirectory,openActivity,decorateLobby,close(){active?.close()},clear(){active?.close();cache.clear()}};
}
