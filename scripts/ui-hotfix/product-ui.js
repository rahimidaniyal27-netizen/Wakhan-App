/* Native account surfaces shared by iPhone and Android. */
(()=>{'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const WORDS={fa:{back:'برگشت',me:'من',settings:'تنظیمات',help:'راهنمای واخان',admin:'مدیریت واخان',halls:'سالن‌ها',staff:'دستیارها',audit:'سابقه',search:'نام، آیدی یا کد سالن…',add:'افزودن دستیار',remove:'برداشتن دستیار',target:'آیدی واخان یا @یوزرنیم',enabled:'فعال',disabled:'بسته',open:'باز کردن',close:'بستن سالن',empty:'موردی پیدا نشد',error:'دریافت اطلاعات انجام نشد؛ دوباره تلاش کن',saved:'ذخیره شد',retry:'تلاش دوباره',confirm:'این تغییر را انجام بدهم؟',ownerOnly:'این کار فقط برای سازنده است',days:'روز دسترسی',grant:'دادن دسترسی',user:'کاربر',online:'آنلاین'},ps:{back:'شاته',me:'زه',settings:'امستنې',help:'د واخان لارښود',admin:'د واخان مدیریت',halls:'سالونونه',staff:'مرستیالان',audit:'مخینه',search:'نوم، آیډي یا د سالون کوډ…',add:'مرستیال زیات کړئ',remove:'مرستیال لرې کړئ',target:'د واخان آیډي یا @یوزرنیم',enabled:'فعال',disabled:'تړلی',open:'پرانیستل',close:'سالون تړل',empty:'څه ونه موندل شول',error:'بیا هڅه وکړئ',saved:'وساتل شو',retry:'بیا هڅه',confirm:'دا بدلون ترسره شي؟',ownerOnly:'یوازې جوړونکی',days:'د لاسرسي ورځې',grant:'لاسرسی ورکول',user:'کارن',online:'آنلاین'},en:{back:'Back',me:'Me',settings:'Settings',help:'Wakhan help',admin:'Wakhan management',halls:'Rooms',staff:'Assistants',audit:'History',search:'Name, ID or room code…',add:'Add assistant',remove:'Remove assistant',target:'Wakhan ID or @username',enabled:'Open',disabled:'Closed',open:'Open room',close:'Close room',empty:'Nothing here yet',error:'Could not load; try again',saved:'Saved',retry:'Retry',confirm:'Apply this change?',ownerOnly:'Only the owner can do this',days:'Access days',grant:'Grant access',user:'User',online:'Online'}};
 const text=key=>(WORDS[String(document.documentElement.lang||'en').slice(0,2)]||WORDS.en)[key]||key;
 const state={data:null,tab:'halls',query:'',seq:0,loading:false,error:'',started:false};
 function ownDialog(html){sheet(html);const node=document.getElementById('sheet');if(node)node.setAttribute('aria-label',text('help'))}
 function help(){
  const lang=String(document.documentElement.lang||'en').slice(0,2);
  const topics=lang==='fa'?[
   ['ورود و نگه‌داشتن حساب','با همان روش ورود قبلی وارد شو. از بخش تنظیمات، ایمیل بازیابی را به حسابت وصل کن. رمز و کد تأیید را برای کسی نفرست. خروج از حساب، اطلاعات ذخیره‌شده روی سرور را حذف نمی‌کند.'],
   ['گفتگوی خصوصی و ریپلای','در چت خصوصی، پیام را به چپ بکش تا پیش‌نمایش پاسخ بالای کادر نوشتن بیاید. با × آن را لغو کن. زدن نقل‌قولِ پیام فرستاده‌شده، پیام اصلی را نشان می‌دهد. «خوانده شد» بعد از دیدن پیام در چت مخاطب نمایش داده می‌شود.'],
   ['عکس و پیام صوتی','برای عکس، دکمهٔ تصویر را بزن. برای ضبط صدا اجازهٔ میکروفون بده؛ پیش‌نمایش را قبل از فرستادن بررسی کن. فایل آماده‌شده را می‌توانی لغو کنی. اگر اینترنت قطع شد، تلاش دوباره همان پیام را ادامه می‌دهد.'],
   ['سالن، جایگاه‌ها و پس‌زمینه','با زدن جایگاه، بنشین. صاحب سالن می‌تواند تعداد جایگاه‌ها را از ۲ تا ۱۶ تعیین کند و عکس پس‌زمینه بگذارد. وقتی تعداد افراد بیشتر از ظرفیت انتخابی است، اول باید جایگاه‌های اضافی خالی شوند.'],
   ['پخش فیلم و موسیقی در سالن','روی پرده بزن تا کنترل‌ها دیده شوند؛ بعد از ۳ ثانیه محو می‌شوند. «پایان پخش» برای میزبان، پرده را خالی می‌کند و سالن به گفتگوی عادی برمی‌گردد. صدای میکروفون و بلندگو از نوار پایین کنترل می‌شوند.'],
   ['وقتی صدای سالن وصل نمی‌شود','اجازهٔ میکروفون گوشی را بررسی کن. در تنظیمات، «اتصال صدا» را باز کن و مسیر امن را امتحان کن. نتیجهٔ بررسی اتصال به‌تنهایی کیفیت مکالمه را ثابت نمی‌کند؛ با یک نفر صحبت کن. تغییر وای‌فای و اینترنت همراه هم برای پیدا کردن مشکل کمک می‌کند.'],
   ['سکه و پرداخت','قبل از تأیید انتقال، نام و آیدی گیرنده و مبلغ را بررسی کن. سکه برای استفاده داخل واخان است. روش پرداختی که فعال نیست قابل استفاده نیست. سابقهٔ پرداخت و انتقال را از کیف پول ببین.'],
   ['حریم خصوصی و امنیت','در تنظیمات، نمایش آنلاین بودن را روشن یا خاموش کن. خاموش کردنش دایرهٔ سبز را برای دیگران پنهان می‌کند. کاربران مزاحم را از پروفایلشان مسدود یا گزارش کن. حذف حساب از بخش تنظیمات، با خروج از حساب فرق دارد.']
  ]:[
   ['Your account','Use the same sign-in method to return. Link a recovery email in Settings and never share verification codes. Signing out does not delete your server data.'],
   ['Private chat and replies','Swipe a message left to reply. Cancel the preview with ×. Tap a sent quote to jump to the original message. Seen appears after your recipient views the message in the conversation.'],
   ['Photos and voice messages','Choose a photo or record a voice message, then review the preview before sending. Cancel unwanted media. Retry continues the same message after a network failure.'],
   ['Room settings','The room owner can choose 2–16 seats and a custom background photo. Free extra occupied seats before reducing capacity.'],
   ['Playback controls','Tap the cinema screen to show controls. They disappear after three seconds. The host can Stop playback to return to the normal room.'],
   ['Audio connection','Allow microphone access. Open Voice connection in Settings and try Secure relay. A connection check is not a two-way call test: speak with someone to confirm. Try another Wi-Fi or mobile network if needed.'],
   ['Wallet and safety','Check the recipient and amount before transferring coins. Coins are for use inside Wakhan. Only configured payment methods are available.'],
   ['Privacy','Switch online visibility on or off in Settings. Report or block unwanted contacts from their profile. Signing out and deleting an account are different actions.']
  ];
  ownDialog(`<section class="wk-help"><div class="wk-help-head"><button type="button" onclick="closeSheet()" aria-label="${esc(text('back'))}">‹</button><h2>${esc(text('help'))}</h2><span></span></div>${topics.map(([title,body])=>`<details><summary>${esc(title)}</summary><p>${esc(body)}</p></details>`).join('')}</section>`);
 }
 function decorateNavigation(){
  const sheetNode=document.getElementById('sheet');
  if(sheetNode?.classList.contains('show')&&!sheetNode.querySelector('.wk-sheet-backbar,.wk-help-head,.h4-sh-head')){
   const bar=document.createElement('div');bar.className='wk-sheet-backbar';
   const button=document.createElement('button');button.type='button';button.className='wk-back';button.setAttribute('aria-label',text('back'));button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>';button.onclick=()=>closeSheet();bar.append(button);sheetNode.prepend(bar);
  }
  const selector='.h4-sh-head>button,.h2-back,.c3-head>button:first-child,.wk-profile-top>button:first-child,.wk-help-head>button:first-child,.op31-back,.wm75-back,.wf-panel-head>button,.wc23-head>button,.af24-header>button,dialog header [data-close],dialog header .wkr-close';
  for(const button of document.querySelectorAll(selector)){
   button.classList.add('wk-back');
   if(!button.querySelector('svg'))button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>';
  }
 }
 function decorate(){
  decorateNavigation();
  for(const node of document.querySelectorAll('.wk-live-avatar[data-online-user]')){
   const uid=Number(node.dataset.onlineUser),person=WM70.people?.get(uid)||(Number(WM70.self?.id)===uid?WM70.self:null),dot=node.querySelector(':scope>.wk-online-dot');
   if(dot)dot.hidden=person?.online!==true;
  }
 }
 async function load(){
  const seq=++state.seq;state.loading=true;state.error='';if(TAB==='o')render();
  try{const result=await api('/api/app/admin?q='+encodeURIComponent(state.query));if(seq!==state.seq)return;if(!result?.ok)throw Error('admin');state.data=result}
  catch{if(seq===state.seq)state.error=text('error')}
  finally{if(seq===state.seq){state.loading=false;if(TAB==='o')render()}}
 }
 async function action(body){
  if(!confirm(text('confirm')))return;
  try{const result=await api('/api/app/admin',body);if(!result?.ok)throw Error('action');state.data=result;state.error='';if(TAB==='o')render()}
  catch{state.error=text('error');if(TAB==='o')render()}
 }
 function render(){
  if(TAB!=='o')return;const data=state.data,focused=document.activeElement?.id==='wk-admin-search',caret=focused?document.activeElement.selectionStart:0;
  let body='';
  if(state.tab==='halls')body=`<label class="wk-admin-search"><span>⌕</span><input id="wk-admin-search" type="search" value="${esc(state.query)}" placeholder="${esc(text('search'))}"></label><div class="wk-admin-list">${(data?.halls||[]).map(room=>`<article><div><b dir="auto">${esc(room.name)}</b><small>${esc(room.code)} · ${esc(room.owner.name)} · ${room.live}</small></div><button type="button" data-room="${esc(room.code)}" data-enable="${room.enabled?'0':'1'}">${esc(text(room.enabled?'close':'open'))}</button></article>`).join('')}</div>`;
  else if(state.tab==='staff')body=`${data?.owner?`<form id="wk-admin-add"><input name="target" autocomplete="off" placeholder="${esc(text('target'))}" required><button type="submit">${esc(text('add'))}</button></form>`:''}<div class="wk-admin-list">${(data?.staff||[]).map(person=>`<article><div><b dir="auto">${esc(person.name)}</b><small>ID: ${esc(person.public_id)}</small></div>${data.owner?`<button type="button" data-remove="${esc(person.public_id)}">${esc(text('remove'))}</button>`:''}</article>`).join('')}</div>${data?.owner?`<form id="wk-admin-access"><h3>${esc(text('grant'))}</h3><input name="target" placeholder="${esc(text('target'))}" required><input name="days" type="number" min="1" max="365" value="30" aria-label="${esc(text('days'))}"><button type="submit">${esc(text('grant'))}</button></form>`:''}`;
  else body=`<div class="wk-admin-list">${(data?.audit||[]).map(item=>`<article><div><b>${esc(({staff_add:text('add'),staff_remove:text('remove'),room_enable:text('open'),room_disable:text('close')})[item.action]||text('grant'))}</b><small>${esc(item.target)} · ${esc(new Date(item.ts*1000).toLocaleString())}</small></div></article>`).join('')}</div>`;
  const empty=!(data?.[state.tab]||[]).length;
  V().innerHTML=`<main class="wk-admin"><div class="wk-profile-top"><button type="button" data-back aria-label="${esc(text('back'))}">‹</button><b>${esc(text('admin'))}</b><button type="button" data-refresh aria-label="${esc(text('retry'))}">↻</button></div><div class="wk-admin-tabs" role="group">${['halls','staff','audit'].map(tab=>`<button type="button" data-tab="${tab}" aria-pressed="${state.tab===tab}">${esc(text(tab))}</button>`).join('')}</div>${state.error?`<p role="alert">${esc(state.error)}</p>`:''}${state.loading?'<p role="status">…</p>':''}${body}${!state.loading&&!state.error&&empty?`<p class="wk-admin-empty">${esc(text('empty'))}</p>`:''}</main>`;
  const node=V();node.querySelector('[data-back]').onclick=()=>go('m');node.querySelector('[data-refresh]').onclick=load;
  node.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{state.tab=button.dataset.tab;render()});
  const search=node.querySelector('#wk-admin-search');if(search){search.oninput=()=>{state.query=search.value;clearTimeout(state.searchTimer);state.searchTimer=setTimeout(load,300)};if(focused){search.focus({preventScroll:true});search.setSelectionRange?.(caret,caret)}}
  node.querySelectorAll('[data-room]').forEach(button=>button.onclick=()=>action({action:'set_room_enabled',code:button.dataset.room,enabled:button.dataset.enable==='1'}));
  node.querySelectorAll('[data-remove]').forEach(button=>button.onclick=()=>action({action:'set_staff',target:button.dataset.remove,enabled:false}));
  node.querySelector('#wk-admin-add')?.addEventListener('submit',event=>{event.preventDefault();void action({action:'set_staff',target:event.target.elements.target.value.trim(),enabled:true})});
  node.querySelector('#wk-admin-access')?.addEventListener('submit',event=>{event.preventDefault();void action({action:'grant_access',target:event.target.elements.target.value.trim(),days:Number(event.target.elements.days.value)})});
 }
 function start(){
  if(state.started)return;state.started=true;
  const avatar=wm70Avatar;
  wm70Avatar=function(person,...rest){const html=avatar.call(this,person,...rest),frame=person?.frame_style?.frame,art=frame&&typeof af24Art==='function'?af24Art(frame):'';return `<span class="wk-live-avatar" data-online-user="${Number(person?.id)||0}">${html}${art?`<i class="wk-vip-frame" aria-hidden="true">${art}</i>`:''}<i class="wk-online-dot" aria-hidden="true" ${person?.online===true?'':'hidden'}></i></span>`};
  helpSheet=help;window.helpSheet=help;
  op31Render=render;op31Go=function(tab='halls'){state.tab=tab==='team'?'staff':['halls','staff','audit'].includes(tab)?tab:'halls';go('o');void load()};window.op31Go=op31Go;
  window.WakhanPresence?.subscribe(decorate);setInterval(decorate,5000);
  let navPending=false;new MutationObserver(()=>{if(navPending)return;navPending=true;requestAnimationFrame(()=>{navPending=false;decorateNavigation()})}).observe(document.body,{childList:true,subtree:true});
  const theme=()=>{const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=canvas.height=1;ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--a1').trim()||'#4c6ce8';ctx.fillRect(0,0,1,1);const rgb=[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});const luminance=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;document.body.style.setProperty('--wk-on-accent',luminance>.179?'#10131b':'#fff')};
  new MutationObserver(theme).observe(document.body,{attributes:true,attributeFilter:['data-th']});theme();
 }
 window.WakhanProductUI={start,help,admin:()=>op31Go(),text};
})();
