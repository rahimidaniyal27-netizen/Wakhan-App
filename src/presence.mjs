export function installPresence({request,getPeople,getSelf,getUid,document:doc=globalThis.document,window:win=globalThis.window}={}){
 let visible=true,stopped=false,busy=false;
 const device=Array.from(crypto.getRandomValues(new Uint8Array(16)),value=>value.toString(16).padStart(2,'0')).join('');
 const listeners=new Set(),call=async(path,body)=>{const value=await request(path,body);if(!value?.ok)throw Error('presence');return value};
 const publish=()=>{for(const listener of listeners)listener()};
 function local(values){
  const people=getPeople(),self=getSelf();
  for(const [uid,online]of Object.entries(values||{})){const person=people.get(Number(uid));if(person)person.online=online===true;if(Number(self?.id)===Number(uid))self.online=online===true}
  publish();
 }
 async function tick(){
  if(stopped||busy)return;busy=true;
  try{
   const active=doc.visibilityState!=='hidden';
   const value=await call('/api/app/presence',{device,active});if(stopped)return;visible=value.visible;
   if(!active)return;
   const onscreen=[...doc.querySelectorAll('.wk-live-avatar[data-online-user]')].filter(node=>{const box=node.getBoundingClientRect();return box.width>0&&box.height>0&&box.bottom>0&&box.top<win.innerHeight}).map(node=>Number(node.dataset.onlineUser));
   const ids=[...new Set([Number(getUid()),...onscreen,...getPeople().keys()])].filter(uid=>Number.isSafeInteger(uid)&&uid>0).slice(0,80);
   const result=await call('/api/app/presence?users='+ids.join(','));if(!stopped)local(result.online);
  }catch{}finally{busy=false}
 }
 function settings(parent){
  const lang=(doc.documentElement.lang||'en').slice(0,2),words=lang==='fa'?['نمایش آنلاین بودن','وقتی روشن باشد، دیگران دایرهٔ سبز کنار پروفایلت می‌بینند.','ذخیره نشد؛ دوباره تلاش کن']:lang==='ps'?['آنلاین حالت ښکاره کول','نور کسان ستاسو د پروفایل شنه نښه ویني.','بیا هڅه وکړئ']:lang==='de'?['Online-Status anzeigen','Andere sehen einen grünen Punkt neben deinem Profil, wenn diese Option aktiv ist.','Speichern fehlgeschlagen; bitte erneut versuchen']:['Show online status','When enabled, others can see a green dot beside your profile.','Could not save; try again'];
  parent.querySelector('.wk-online-setting')?.remove();
  const section=doc.createElement('section');section.className='wk-online-setting';
  const label=doc.createElement('label'),title=doc.createElement('span'),input=doc.createElement('input'),hint=doc.createElement('small');
  title.textContent=words[0];input.type='checkbox';input.checked=visible;input.disabled=true;hint.textContent=words[1];label.append(title,input);section.append(label,hint);const logout=parent.querySelector('#account-logout');if(logout)logout.before(section);else parent.append(section);
  call('/api/app/presence').then(value=>{visible=value.visible;input.checked=visible;input.disabled=false}).catch(()=>{hint.textContent=words[2]});
  input.onchange=async()=>{const desired=input.checked;input.disabled=true;try{await call('/api/app/presence',{visible:desired});visible=desired;if(!visible)local({[getUid()]:false});hint.textContent=words[1];void tick()}catch{input.checked=visible;hint.textContent=words[2]}finally{input.disabled=false}};
  return section;
 }
 const changed=()=>{if(doc.visibilityState==='hidden')void call('/api/app/presence',{device,active:false}).catch(()=>{});else void tick()};
 doc.addEventListener('visibilitychange',changed);win.addEventListener('focus',tick);void tick();
 const timer=setInterval(tick,20000);
 return {settings,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},async stop(){stopped=true;clearInterval(timer);doc.removeEventListener('visibilitychange',changed);win.removeEventListener('focus',tick);listeners.clear();try{await call('/api/app/presence',{device,active:false})}catch{}},get visible(){return visible}};
}
