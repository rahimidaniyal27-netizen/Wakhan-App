const COPY={
 de:{title:"Mitteilungen",dm:"Private Nachrichten",friends:"Freundschaftsanfragen und Bestätigungen",gifts:"Geschenke",previews:"Nachrichtentext in Mitteilungen anzeigen",enable:"Mitteilungen aktivieren",unavailable:"Mitteilungen sind noch nicht aktiv. Deine Auswahl wird gespeichert.",buildUnavailable:"Mitteilungen sind in dieser Version nicht aktiviert.",permission:"Prüfe die Berechtigung in den Geräteeinstellungen.",registered:"Registrierung angefordert.",saved:"Gespeichert",error:"Bitte erneut versuchen",reports:"Nutzermeldungen",empty:"Keine Meldungen zu prüfen",review:"Geprüft",all:"Alle Meldungen",pending:"Offene Meldungen",profile:"Profil ansehen",close:"Zurück"},
 fa:{title:'اعلان‌ها',dm:'پیام خصوصی',friends:'درخواست و پذیرش دوستی',gifts:'هدیه‌ها',previews:'نمایش متن پیام روی اعلان',enable:'فعال‌کردن اعلان گوشی',unavailable:'اعلان گوشی هنوز فعال نشده است؛ انتخاب‌هایت ذخیره می‌شوند.',buildUnavailable:'در این نسخه اعلان گوشی فعال نیست.',permission:'اجازهٔ اعلان را در تنظیمات گوشی بررسی کن.',registered:'درخواست فعال‌سازی ثبت شد.',saved:'ذخیره شد',error:'نشد؛ دوباره تلاش کن',reports:'گزارش‌های کاربران',empty:'گزارشی برای بررسی نیست',review:'بررسی شد',all:'همهٔ گزارش‌ها',pending:'بررسی‌نشده‌ها',profile:'دیدن پروفایل',close:'بستن'},
 ps:{title:'خبرتیاوې',dm:'شخصي پیغام',friends:'د ملګرتیا غوښتنه او منل',gifts:'ډالۍ',previews:'په خبرتیا کې د پیغام متن',enable:'د موبایل خبرتیاوې فعالې کړئ',unavailable:'د موبایل خبرتیاوې لا فعالې نه دي؛ ټاکنې ساتل کېږي.',buildUnavailable:'په دې نسخه کې د موبایل خبرتیا نشته.',permission:'د موبایل په امستنو کې د خبرتیا اجازه وګورئ.',registered:'د فعالولو غوښتنه ثبت شوه.',saved:'وساتل شو',error:'بیا هڅه وکړئ',reports:'د کاروونکو راپورونه',empty:'د کتنې راپور نشته',review:'وکتل شو',all:'ټول راپورونه',pending:'نه کتل شوي',profile:'پروفایل وګورئ',close:'تړل'},
 en:{title:'Notifications',dm:'Private messages',friends:'Friend requests and acceptance',gifts:'Gifts',previews:'Show message text in notifications',enable:'Enable phone notifications',unavailable:'Phone notifications are not active yet. Your choices are saved.',buildUnavailable:'Phone notifications are not enabled in this build.',permission:'Check notification permission in phone settings.',registered:'Notification registration requested.',saved:'Saved',error:'Could not complete; try again',reports:'User reports',empty:'No reports to review',review:'Reviewed',all:'All reports',pending:'Pending reports',profile:'View profile',close:'Close'}
};
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function preferencesButton({request,enablePush,openProfile,language=()=>document.documentElement.lang,document:doc=globalThis.document}={}){
 const tx=COPY[String(language()).slice(0,2)]||COPY.en;
 const section=doc.createElement('section');section.className='wka-notifications';section.style.cssText='margin-block:10px;padding:12px 16px;border:1px solid var(--ln,#ffffff20);border-radius:14px;background:var(--card2,#ffffff08)';
 section.innerHTML=`<b>${escape(tx.title)}</b><div data-options></div><p role="status" style="font-size:12px;line-height:1.6"></p><button type="button" data-enable disabled style="min-height:44px;padding:8px 14px;border-radius:12px;border:1px solid #ffffff20;background:#ffffff0a;color:inherit;font:inherit">${escape(tx.enable)}</button>`;
 const status=value=>{section.querySelector('[role=status]').textContent=value};
 const call=async(path,body)=>{const result=await request(path,body);if(!result?.ok)throw Error('request_failed');return result};
 const inputs={};
 for(const field of ['dm','friends','gifts','previews']){
  const label=doc.createElement('label');label.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;font-size:13px';
  const name=doc.createElement('span');name.textContent=tx[field];const input=doc.createElement('input');input.type='checkbox';input.disabled=true;input.dataset.preference=field;input.style.cssText='width:20px;height:20px;accent-color:var(--a1,#7c3aed)';
  inputs[field]=input;label.append(name,input);section.querySelector('[data-options]').append(label);
  input.onchange=async()=>{const value=input.checked;input.disabled=true;try{await call('/api/app/preferences',{[field]:value});status(tx.saved)}catch{input.checked=!value;status(tx.error)}finally{input.disabled=false}};
 }
 const enable=section.querySelector('[data-enable]');
 enable.onclick=async()=>{enable.disabled=true;try{const result=await enablePush();status(!result?.supported?tx.buildUnavailable:result.permission==='granted'?tx.registered:tx.permission)}catch{status(tx.error)}finally{enable.disabled=false}};
 call('/api/app/preferences').then(result=>{
  for(const [field,input]of Object.entries(inputs)){input.checked=result.notifications[field];input.disabled=false}
  enable.disabled=!result.phone_push_configured;if(!result.phone_push_configured)status(tx.unavailable);
  if(result.moderator){const reports=doc.createElement('button');reports.type='button';reports.textContent=tx.reports;reports.dataset.reports='';reports.style.cssText='display:block;margin-top:10px;min-height:44px;width:100%;border-radius:12px;border:1px solid #ffffff20;background:#ffffff0a;color:inherit;font:inherit';reports.onclick=()=>showReports();section.append(reports)}
 }).catch(()=>status(tx.error));
 function showReports(){
  if(doc.getElementById('wka-reports'))return;
  const dialog=doc.createElement('dialog');dialog.className='wkr';dialog.id='wka-reports';dialog.dir=['fa','ps','ar','ur'].includes(String(language()).slice(0,2))?'rtl':'ltr';
  dialog.innerHTML=`<header><h2>${escape(tx.reports)}</h2><button type="button" class="wkr-close" aria-label="${escape(tx.close)}">×</button></header><button type="button" data-filter>${escape(tx.all)}</button><p role="status"></p><div class="wkr-list"></div>`;
  dialog.querySelector('.wkr-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());dialog.addEventListener('cancel',()=>dialog.remove());
  doc.body.append(dialog);dialog.showModal();let state='pending',serial=0;
  dialog.querySelector('[data-filter]').onclick=()=>{state=state==='pending'?'all':'pending';dialog.querySelector('[data-filter]').textContent=state==='pending'?tx.all:tx.pending;load()};
  async function load(){const seq=++serial;try{const result=await call('/api/app/moderation/reports?state='+state);if(!dialog.isConnected||seq!==serial)return;
   const list=dialog.querySelector('.wkr-list');list.replaceChildren();dialog.querySelector('[role=status]').textContent=result.reports.length?'':tx.empty;
   for(const report of result.reports){const row=doc.createElement('article');row.className='wkr-card';row.innerHTML=`<h3 dir="auto">${escape(report.target?.name||report.hall||report.reason)}</h3><p dir="auto">${escape(report.reason)}</p><p dir="auto">${escape(report.note)}</p><small>${escape(report.reporter.name)} · ${escape(new Date(report.ts*1000).toLocaleString())}</small><div class="wkr-actions">${report.target?`<button type="button" data-profile>${escape(tx.profile)}</button>`:''}${!report.done?`<button type="button" data-reviewed>${escape(tx.review)}</button>`:''}</div>`;
    row.querySelector('[data-profile]')?.addEventListener('click',()=>{dialog.close();openProfile(report.target.id)});
    row.querySelector('[data-reviewed]')?.addEventListener('click',async event=>{event.target.disabled=true;try{await call('/api/app/moderation/reports',{id:report.id,action:'reviewed'});load()}catch{dialog.querySelector('[role=status]').textContent=tx.error;event.target.disabled=false}});list.append(row)}
  }catch{if(dialog.isConnected)dialog.querySelector('[role=status]').textContent=tx.error}}
  load();
 }
 return section;
}
