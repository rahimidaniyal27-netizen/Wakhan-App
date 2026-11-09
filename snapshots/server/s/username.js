/* WAKHAN @username everywhere a person is chosen: send coins, gift coins, assistants.
   The fields take @username (a number still works); the name is looked up before sending. */
(()=>{'use strict';if(window.WKUN)return;
const FIELDS=['wc23-recipient','af24-staff-uid','af24-target'];
const TX={fa:['یوزنیم','@یوزنیم','کسی با این یوزنیم پیدا نشد'],ps:['کارن‌نوم','@کارن‌نوم','په دې کارن‌نوم څوک ونه موندل شو'],en:['Username','@username','Nobody with this username'],
 de:['Benutzername','@benutzername','Niemand mit diesem Benutzernamen'],tr:['Kullanıcı adı','@kullaniciadi','Bu kullanıcı adıyla kimse yok'],ar:['اسم المستخدم','@اسم_المستخدم','لا يوجد أحد بهذا الاسم'],
 ru:['Имя пользователя','@имя','Никого с таким именем'],fr:["Nom d'utilisateur",'@nom','Personne avec ce nom'],es:['Usuario','@usuario','Nadie con ese usuario'],ur:['صارف نام','@صارف','اس نام کا کوئی نہیں']};
const t=i=>{let l='en';try{l=(localStorage.getItem('wm13_lang')||document.documentElement.lang||'en').slice(0,2)}catch(e){}return (TX[l]||TX.en)[i]};
const say=m=>{try{toast(m)}catch(e){}};
function dress(){for(const id of FIELDS){const el=document.getElementById(id);if(!el||el.dataset.wkun)continue;el.dataset.wkun='1';
 el.setAttribute('inputmode','text');el.setAttribute('autocapitalize','off');el.setAttribute('autocomplete','off');el.setAttribute('spellcheck','false');el.placeholder=t(1);
 const lab=el.closest('label');if(lab)for(const n of lab.childNodes)if(n.nodeType===3&&n.textContent.trim()){n.textContent=t(0);break}
 const hint=document.createElement('small');hint.className='wkun-hint';el.after(hint);
 let tm=0;el.addEventListener('input',()=>{clearTimeout(tm);hint.textContent='';const v=el.value.trim();if(v.length<3||/^\d+$/.test(v))return;tm=setTimeout(async()=>{const r=await look(v);if(el.value.trim()!==v)return;hint.textContent=r?'✓ '+(r.name||'')+(r.username?' · @'+r.username:''):'✕ '+t(2);hint.classList.toggle('bad',!r)},450)})}}
async function look(v){try{const r=await api('/api/app/resolve?u='+encodeURIComponent(v.replace(/^@/,'')));return r&&r.ok?r:null}catch(e){return null}}
/* before the original action runs, a @username in its field becomes the person's number */
async function prep(id){const el=document.getElementById(id);if(!el)return true;const v=el.value.trim();if(!v||/^\d+$/.test(v))return true;
 const r=await look(v);if(!r){say(t(2));return false}el.value=String(r.uid);return true}
function wrap(name,id){const f=window[name];if(typeof f!=='function'||f.__wkun)return false;const g=async function(...a){if(!(await prep(id)))return;return f.apply(this,a)};g.__wkun=1;window[name]=g;try{eval(name+'=g')}catch(e){}return true}
function hook(){wrap('wc23TransferQuote','wc23-recipient');wrap('af24Add','af24-staff-uid');wrap('af24MintQuote','af24-target');dress()}
const css=document.createElement('style');css.textContent='.wkun-hint{display:block;min-height:16px;margin-top:4px;font-size:12px;color:#22c55e}.wkun-hint.bad{color:#f43f5e}';document.head.appendChild(css);
try{new MutationObserver(()=>{clearTimeout(hook.t);hook.t=setTimeout(hook,80)}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){setInterval(hook,1000)}
hook();window.WKUN={look};
})();
