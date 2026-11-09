/* =====================================================================
   WAKHAN APP — the sign-in screen of the standalone app.
   Runs only outside Telegram. Inside the Telegram mini app nothing changes.
   Ways in: Google · e-mail + code · Telegram (old accounts). No guests.
   After sign-in the key is kept on the phone and the page restarts signed in
   (the tiny head script in index.html hands the key to the app).
   ===================================================================== */
(()=>{'use strict';
if(!window.WKA||!window.WKA.outside||window.__wkaGate)return;window.__wkaGate=1;
/* signed in already: check the key once; a key that no longer works brings the sign-in screen back */
if(window.WKA.key){fetch('/api/app/me',{headers:{'X-Init':window.WKA.key}}).then(r=>{if(r.status===401){try{localStorage.removeItem('wka_key')}catch(e){}location.replace(location.pathname+'?app=1')}}).catch(()=>{});
 window.wkaLogout=async()=>{try{await fetch('/api/app/logout',{method:'POST',headers:{'X-Init':window.WKA.key}})}catch(e){}try{localStorage.removeItem('wka_key');localStorage.removeItem('wka_user')}catch(e){}location.replace(location.pathname+'?app=1')};return}
const T={
 fa:{welcome:'به واخان خوش آمدی',sub:'موزیک، سینما و سالون‌های زنده با رفیقایت',google:'ادامه با Google',email:'ادامه با ایمیل',telegram:'ادامه با تلگرام',
  emailPh:'ایمیل تو',send:'فرستادن کد',codeSent:'کد 6 رقمی به این ایمیل فرستاده شد:',codePh:'کد 6 رقمی',verify:'تأیید',change:'تغییر ایمیل',resend:'دوباره فرستادن',
  tgWait:'تلگرام باز شد. در بات «✅ بله، وارد شو» ره بزن و بعد به همی‌جا برگرد.',tgOpen:'باز کدن دوبارهٔ تلگرام',back:'برگشت',
  nameTitle:'نامت چیست؟',nameSub:'این نام در سالون‌ها و چت به دیگران نشان داده میشه',namePh:'نام تو',start:'شروع',
  terms:'با ورود، قوانین و حریم خصوصی واخان ره قبول می‌کنی.',or:'یا',
  email_bad:'ایمیل درست نیست',email_off:'ورود با ایمیل هنوز فعال نشده',email_fail:'ایمیل فرستاده نشد؛ دوباره کوشش کو',wait:'کمی صبر کو و دوباره بفرست',
  code_bad:'کد غلط است',code_expired:'کد کهنه شده؛ دوباره بفرست',google_off:'ورود با Google هنوز فعال نشده',google_fail:'ورود با Google نشد',
  rate:'زیاد کوشش کدی؛ یک دقیقه صبر کو',name_short:'نام کوتاه است',err:'نشد؛ دوباره کوشش کو',net:'انترنت وصل نیست'},
 en:{welcome:'Welcome to Wakhan',sub:'Music, cinema and live halls with your friends',google:'Continue with Google',email:'Continue with e-mail',telegram:'Continue with Telegram',
  emailPh:'Your e-mail',send:'Send code',codeSent:'We sent a 6-digit code to:',codePh:'6-digit code',verify:'Verify',change:'Change e-mail',resend:'Send again',
  tgWait:'Telegram opened. Tap “✅ Yes, sign in” in the bot, then come back here.',tgOpen:'Open Telegram again',back:'Back',
  nameTitle:"What's your name?",nameSub:'Shown to others in halls and chats',namePh:'Your name',start:'Start',
  terms:"By signing in you accept Wakhan's terms and privacy.",or:'or',
  email_bad:'That e-mail is not valid',email_off:'E-mail sign-in is not active yet',email_fail:'Could not send the e-mail, try again',wait:'Wait a moment and try again',
  code_bad:'Wrong code',code_expired:'The code expired, send a new one',google_off:'Google sign-in is not active yet',google_fail:'Google sign-in failed',
  rate:'Too many tries, wait a minute',name_short:'Name is too short',err:'Failed, try again',net:'No internet connection'}};
T.ps=Object.assign({},T.fa,{welcome:'واخان ته ښه راغلاست',google:'د Google سره دوام',email:'د برېښنالیک سره دوام',telegram:'د ټلګرام سره دوام',send:'کوډ ولېږه',verify:'تایید',start:'پیل',back:'شاته'});
/* Dari first; the small switch on top changes it (and the app's language with it) */
let lang=(()=>{try{const l=(localStorage.getItem('wka_lang')||localStorage.getItem('wm13_lang')||'fa').slice(0,2).toLowerCase();return T[l]?l:'fa'}catch(e){return 'fa'}})();
const t=k=>T[lang][k]||T.fa[k]||k;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector('#wka '+s);
let CFG={google:'',email:false,telegram:true},EMAIL='',TG=null,BUSY=false,POLLING=false;

async function call(path,body){try{const r=await fetch(path,body===undefined?{headers:{'X-Init':window.WKA.key||''}}:{method:'POST',headers:{'Content-Type':'application/json','X-Init':window.WKA.key||''},body:JSON.stringify(body)});return await r.json()}catch(e){return {ok:false,err:'net'}}}
function say(k){const m=$('.wka-msg');if(m){m.textContent=t(k);m.hidden=!k}}
function busy(on){BUSY=on;document.querySelectorAll('#wka button').forEach(b=>b.disabled=on)}
function done(j){
 try{localStorage.setItem('wka_key',j.key);localStorage.setItem('wka_user',JSON.stringify({id:j.uid,first_name:j.name||''}))}catch(e){}
 window.WKA.key=j.key;
 if(j.new||!j.name)return nameStep();
 location.replace(location.pathname+'?app=1');
}

/* ---------- screens */
const LOGO='<img class="wka-logo" src="/s/wn60_brand.svg" alt="" onerror="this.style.display=\'none\'">';
function shell(inner){const w=document.getElementById('wka');w.dir=lang==='en'?'ltr':'rtl';w.innerHTML=`<div class="wka-langs">${[['fa','دری'],['ps','پښتو'],['en','EN']].map(([k,n])=>`<button type="button" class="${k===lang?'on':''}" data-l="${k}">${n}</button>`).join('')}</div><div class="wka-card">${inner}<p class="wka-msg" role="alert" hidden></p></div><p class="wka-terms">${esc(t('terms'))}</p>`;
 w.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{lang=b.dataset.l;try{localStorage.setItem('wka_lang',lang);localStorage.setItem('wm13_lang',lang)}catch(e){}home()})}
function home(){
 shell(`${LOGO}<h1>${esc(t('welcome'))}</h1><p class="wka-sub">${esc(t('sub'))}</p>
 <div class="wka-btns">
  ${CFG.google?`<div id="wka-g" class="wka-g"></div>`:''}
  <button type="button" class="wka-b" data-a="email"><span class="wka-ic">✉️</span><span>${esc(t('email'))}</span></button>
  <button type="button" class="wka-b tg" data-a="tg"><span class="wka-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 3.5 10.6 13.4"/><path d="M20.5 3.5 14.4 20.5l-3.8-7.1-7.1-3.8Z"/></svg></span><span>${esc(t('telegram'))}</span></button>
 </div>`);
 $('[data-a=email]').onclick=emailStep;$('[data-a=tg]').onclick=tgStep;
 if(CFG.google)loadGoogle();
}
function emailStep(){
 shell(`<button type="button" class="wka-back" data-a="back">‹ ${esc(t('back'))}</button><h2>${esc(t('email'))}</h2>
 <form class="wka-form"><input id="wka-email" type="email" inputmode="email" autocomplete="email" dir="ltr" placeholder="${esc(t('emailPh'))}" value="${esc(EMAIL)}" required><button type="submit" class="wka-main">${esc(t('send'))}</button></form>`);
 $('[data-a=back]').onclick=home;const f=$('.wka-form');setTimeout(()=>$('#wka-email')?.focus(),100);
 f.onsubmit=async e=>{e.preventDefault();if(BUSY)return;EMAIL=$('#wka-email').value.trim().toLowerCase();if(!CFG.email)return say('email_off');busy(true);const j=await call('/api/app/email/send',{email:EMAIL});busy(false);if(!j.ok)return say(j.err||'err');codeStep()}}
function codeStep(){
 shell(`<button type="button" class="wka-back" data-a="back">‹ ${esc(t('change'))}</button><h2>${esc(t('codePh'))}</h2><p class="wka-sub">${esc(t('codeSent'))}<br><b dir="ltr">${esc(EMAIL)}</b></p>
 <form class="wka-form"><input id="wka-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" dir="ltr" class="wka-code" placeholder="••••••" required><button type="submit" class="wka-main">${esc(t('verify'))}</button></form>
 <button type="button" class="wka-link" data-a="resend">${esc(t('resend'))}</button>`);
 $('[data-a=back]').onclick=emailStep;const inp=$('#wka-code');setTimeout(()=>inp.isConnected&&inp.focus(),100);
 const go=async()=>{if(BUSY)return;const code=inp.value.replace(/\D/g,'');if(code.length!==6)return;busy(true);const j=await call('/api/app/email/verify',{email:EMAIL,code});busy(false);if(!j.ok){inp.select();return say(j.err||'err')}done(j)};
 inp.oninput=()=>{inp.value=inp.value.replace(/\D/g,'').slice(0,6);if(inp.value.length===6)go()};
 $('.wka-form').onsubmit=e=>{e.preventDefault();go()};
 $('[data-a=resend]').onclick=async()=>{busy(true);const j=await call('/api/app/email/send',{email:EMAIL});busy(false);say(j.ok?'':(j.err||'err'))}}
async function tgStep(){
 if(BUSY)return;busy(true);const j=await call('/api/app/telegram/start',{});busy(false);if(!j.ok)return say(j.err||'err');TG=j;
 shell(`<button type="button" class="wka-back" data-a="back">‹ ${esc(t('back'))}</button>${LOGO}<h2>${esc(t('telegram'))}</h2><p class="wka-sub">${esc(t('tgWait'))}</p><div class="wka-spin"></div><button type="button" class="wka-main tg" data-a="open">${esc(t('tgOpen'))}</button>`);
 $('[data-a=back]').onclick=()=>{TG=null;home()};$('[data-a=open]').onclick=openTg;openTg();poll()}
function openTg(){if(!TG)return;try{window.location.href=TG.link}catch(e){}}
async function poll(){if(POLLING)return;POLLING=true;try{const code=TG&&TG.code;while(TG&&TG.code===code){const j=await call('/api/app/telegram/poll?code='+encodeURIComponent(code));if(!TG||TG.code!==code)return;
 if(j.ok&&j.key)return done(j);if(!j.ok&&j.err!=='net'){TG=null;say(j.err);setTimeout(home,1800);return}await new Promise(r=>setTimeout(r,document.visibilityState==='visible'?1500:4000))}}finally{POLLING=false}}
function nameStep(){
 shell(`${LOGO}<h2>${esc(t('nameTitle'))}</h2><p class="wka-sub">${esc(t('nameSub'))}</p><form class="wka-form"><input id="wka-name" maxlength="40" autocomplete="name" dir="auto" placeholder="${esc(t('namePh'))}" required><button type="submit" class="wka-main">${esc(t('start'))}</button></form>`);
 const inp=$('#wka-name');try{inp.value=(JSON.parse(localStorage.getItem('wka_user')||'{}').first_name)||''}catch(e){}setTimeout(()=>inp.isConnected&&inp.focus(),100);
 $('.wka-form').onsubmit=async e=>{e.preventDefault();if(BUSY)return;busy(true);const j=await call('/api/app/profile',{name:inp.value});busy(false);if(!j.ok)return say(j.err||'err');
  try{const u=JSON.parse(localStorage.getItem('wka_user')||'{}');u.first_name=j.name;localStorage.setItem('wka_user',JSON.stringify(u))}catch(x){}location.replace(location.pathname+'?app=1')}}
function loadGoogle(){if(window.google&&window.google.accounts)return initGoogle();if(document.getElementById('wka-gsi'))return;const s=document.createElement('script');s.id='wka-gsi';s.src='https://accounts.google.com/gsi/client';s.async=true;
 s.onload=()=>{try{initGoogle()}catch(e){}};document.head.appendChild(s)}
function initGoogle(){const box=document.getElementById('wka-g'),G=window.google;if(!box||!G||!G.accounts)return;
 G.accounts.id.initialize({client_id:CFG.google,ux_mode:'popup',callback:async r=>{busy(true);const j=await call('/api/app/google',{credential:r.credential});busy(false);if(!j.ok)return say(j.err||'google_fail');done(j)}});
 G.accounts.id.renderButton(box,{theme:'filled_black',size:'large',shape:'pill',text:'continue_with',width:Math.min(320,box.clientWidth||320),locale:lang==='en'?'en':'fa'})}

/* ---------- start */
function mount(){if(document.getElementById('wka'))return;const w=document.createElement('div');w.id='wka';w.dir=lang==='en'?'ltr':'rtl';document.body.appendChild(w);document.documentElement.classList.add('wka-on');home();
 call('/api/app/config').then(j=>{if(j&&j.ok){CFG=j;if(!$('#wka-email')&&!$('#wka-code')&&!TG)home()}})}
if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&TG)poll()});
})();
