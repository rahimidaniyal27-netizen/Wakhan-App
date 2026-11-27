/* WAKHAN 2.0 — «سالون» part 8: the salon profile.
   Owner: a cinematic cover + a quiet «control centre» of glass tiles (seats & limit, entry, mic, chat, look, members,
   playback assistant, film night). Guests: info, share link (when allowed) and report.
   Data: /api/app/salon/profile|members|assistant|event|report (new wakhan_salon.py). Nothing on the server is rewritten. */
(()=>{
const T={
fa:{title:'پروفایل سالون',seats:'جایگاه‌ها',limit:'حد حضور',people:'{n} نفر',seatsOf:'{n} از {m} جایگاه',entry:'ورود',mic:'میکروفون',chat:'گپ',look:'ظاهر',members:'اعضا',
 assistant:'دستیار پخش',event:'شب فلم',noEvent:'برنامه‌ای نیست',invite:'دعوت',link:'پیوند',report:'گزارش',edit:'ویرایش',owner:'مالک',
 pub:'عمومی',friends:'دوستان',inv:'با دعوت',approval:'پذیرش با تأیید من',approvalD:'مهمان در می‌زند و تو می‌پذیری',free:'آزاد',ask:'با اجازه',on:'روشن',off:'خاموش',
 micD:'روی جایگاه، مایک فقط با اجازهٔ تو روشن شود',chatD:'گپ و واکنش‌ها برای حاضران',save:'ذخیره',cancel:'لغو',saved:'ذخیره شد',offline:'ارتباط قطع شد، دوباره امتحان کنید',
 name:'نام سالون',photo:'عکس سالون',cropT:'تنظیم عکس',cropH:'عکس را بکشید و با دو انگشت بزرگ یا کوچک کنید',cropOk:'تأیید',cropRot:'چرخاندن',cropReset:'از نو',seatsMin:'جایگاه‌های پر کم نمی‌شوند · کمترین {n}',limitLow:'{n} نفر حاضرند؛ کسی بیرون نمی‌شود، فقط ورود تازه تا باز شدن جا بسته می‌ماند',
 dim:'تیرگی پس‌زمینه',gallery:'از گالری',use:'استفاده از این پس‌زمینه',preview:'پیش‌نمایش گپ',p1:'سلام دوستان',p2:'فلم شروع شد؟',
 seated:'روی جایگاه',audience:'تماشاگر',banned:'مسدودشده‌ها',unban:'آزاد کردن',none:'هیچ‌کس',setAsst:'دستیار پخش شود',unAsst:'دستیار پخش نباشد',asstD:'فقط پخش، توقف و عقب‌وپیش',
 lift:'برداشتن',kick:'بیرون‌کردن',ban:'مسدودکردن',seatNo:'جایگاه {n}',evTitle:'عنوان برنامه',evPh:'شب فلم',when:'کی؟',time:'ساعت',remind:'یادآوری برای دعوت‌شده‌ها',
 local:'به وقت دستگاه هر کس نشان داده می‌شود',remove:'حذف برنامه',today:'امروز',tomorrow:'فردا',created:'ساخته‌شده {d}',shareOff:'مالک شریک‌ساختن پیوند را بسته است',
 copied:'پیوند کپی شد',reportQ:'چرا گزارش می‌دهی؟',r1:'محتوای نامناسب',r2:'آزار یا توهین',r3:'هرزنامه',r4:'دیگر',sendR:'فرستادن گزارش',reported:'گزارشت فرستاده شد',
 code:'کد',back:'بازگشت',close:'بستن',assistantNone:'تعیین نشده'},
en:{title:'Salon profile',seats:'Seats',limit:'Limit',people:'{n} people',seatsOf:'{n} of {m} seats',entry:'Entry',mic:'Microphone',chat:'Chat',look:'Look',members:'Members',
 assistant:'Playback assistant',event:'Film night',noEvent:'Nothing planned',invite:'Invite',link:'Link',report:'Report',edit:'Edit',owner:'Owner',
 pub:'Public',friends:'Friends',inv:'Invite only',approval:'I approve entries',approvalD:'Guests knock and you let them in',free:'Free',ask:'Ask',on:'On',off:'Off',
 micD:'On a seat, the mic opens only with your permission',chatD:'Chat and reactions for people present',save:'Save',cancel:'Cancel',saved:'Saved',offline:'Connection lost, try again',
 name:'Salon name',photo:'Salon photo',cropT:'Adjust photo',cropH:'Drag the photo; pinch to zoom in or out',cropOk:'Done',cropRot:'Rotate',cropReset:'Start over',seatsMin:'Taken seats are kept · at least {n}',limitLow:'{n} people are here; nobody is removed, new entries wait until there is room',
 dim:'Background dim',gallery:'From gallery',use:'Use this background',preview:'Chat preview',p1:'Hi everyone',p2:'Has the film started?',
 seated:'On a seat',audience:'Watching',banned:'Blocked',unban:'Unblock',none:'Nobody',setAsst:'Make playback assistant',unAsst:'Remove as assistant',asstD:'Only play, pause and seek',
 lift:'Lift',kick:'Remove',ban:'Block',seatNo:'Seat {n}',evTitle:'Event title',evPh:'Film night',when:'When?',time:'Time',remind:'Remind invited guests',
 local:'Shown in each person\'s own time zone',remove:'Delete event',today:'Today',tomorrow:'Tomorrow',created:'Created {d}',shareOff:'The owner has turned off link sharing',
 copied:'Link copied',reportQ:'Why are you reporting?',r1:'Inappropriate content',r2:'Harassment',r3:'Spam',r4:'Other',sendR:'Send report',reported:'Report sent',
 code:'Code',back:'Back',close:'Close',assistantNone:'Not set'}};
const K=()=>(window.SLR3&&SLR3.k)||null;
const L=()=>{let l='en';try{l=((window.WK2L&&WK2L())||'en').slice(0,2)}catch(e){}return l};
const RTL=()=>['fa','ps','ar','ur'].includes(L());
const t8=(k,v)=>{let s=(window.WK2P&&WK2P('slr8',k))??(T[L()]||T.en)[k]??T.en[k]??k;if(v)for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n||0).toLocaleString('en-US');
const hap=()=>{try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}};
const S=(d,w)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC={chev:'<path d="m15 6-6 6 6 6"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
 seat:'<path d="M5 11V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V11"/><path d="M3.5 12.5a1.5 1.5 0 0 1 3 0V14h11v-1.5a1.5 1.5 0 0 1 3 0V17a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"/><path d="M6 18v1.5M18 18v1.5"/>',
 door:'<path d="M6 20.5V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5v16"/><path d="M4 20.5h16"/><circle cx="14.5" cy="12" r="1" fill="currentColor"/>',
 mic:'<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',chat:'<path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4.5 19.5l1.4-4A7.5 7.5 0 1 1 20 11.5z"/>',
 look:'<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m4 17 4.5-4.5 3.5 3.5 2.5-2.5L20 18"/>',users:'<circle cx="9" cy="8.5" r="3.3"/><path d="M3 19.5c.8-3.3 3.2-5 6-5s5.2 1.7 6 5"/><path d="M15.5 5.5a3.2 3.2 0 0 1 0 6M17.5 14.8c1.8.6 3 2.2 3.5 4.7"/>',
 shield:'<path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',cal:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M8.5 3v4M15.5 3v4"/>',
 invite:'<circle cx="9.5" cy="8" r="3.5"/><path d="M3 19.5c.8-3.3 3.4-5.2 6.5-5.2s5.7 1.9 6.5 5.2M18.5 8v6M15.5 11h6"/>',link:'<path d="M10 14a4.5 4.5 0 0 0 6.4 0l2.8-2.8a4.5 4.5 0 0 0-6.4-6.4L11.5 6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-2.8 2.8a4.5 4.5 0 0 0 6.4 6.4l1.3-1.2"/>',
 flag:'<path d="M5.5 21V4.5"/><path d="M5.5 4.5h11l-2 4 2 4h-11"/>',cam:'<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',more:'<circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/>',
 globe:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.4 3.6 5.2 3.6 8.5s-1.1 6.1-3.6 8.5c-2.5-2.4-3.6-5.2-3.6-8.5s1.1-6.1 3.6-8.5z"/>',lock:'<rect x="5.5" y="10.5" width="13" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
 bell:'<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
 lift:'<path d="M12 4v10M8 8l4-4 4 4"/><path d="M5 19.5h14"/>',ban:'<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',exit:'<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
 trash:'<path d="M5 7h14M10 4h4M7 7l.8 11.5A1.5 1.5 0 0 0 9.3 20h5.4a1.5 1.5 0 0 0 1.5-1.5L17 7"/>'};
async function req(path,body){const j=await api(path,body);if(!j||!j.ok)throw Error((j&&j.err)||'failed');return j}
const ava=(p,c)=>{const k=K();return k?k.ava(p||{},c):''};
function note(m,i){const k=K();if(k)k.note(m,i);else try{toast(m)}catch(e){}}
function sheet(cls){const w=document.createElement('div');w.className='s6 s6-sh s8-sh '+(cls||'');w.dir=RTL()?'rtl':'ltr';document.body.appendChild(w);
 w.addEventListener('click',e=>{if(e.target===w)shut(w)});return w}
function shut(w){if(!w||w.__out)return;w.__out=1;w.classList.add('s6-out');setTimeout(()=>w.remove(),240)}
function page(cls){const w=document.createElement('div');w.className='slr-pg s8 '+(cls||'');w.dir=RTL()?'rtl':'ltr';document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('in'));
 w.close=()=>{w.classList.remove('in');w.classList.add('out');setTimeout(()=>w.remove(),260)};return w}
const MON={fa:['جنوری','فبروری','مارچ','اپریل','می','جون','جولای','اگست','سپتمبر','اکتوبر','نومبر','دسمبر'],en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']};
const WD={fa:['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'],en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']};
const lg=()=>L()==='en'?'en':'fa';
const IDF=(o,d)=>{const l=L();if(l==='fa'||l==='en')return null;try{return new Intl.DateTimeFormat(l+'-u-nu-latn',o).format(d)}catch(e){return null}};
const mon=d=>IDF({month:'short'},d)||MON[lg()][d.getMonth()];
const wday=d=>IDF({weekday:'short'},d)||WD[lg()][d.getDay()];
const hm=d=>String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
const when=ts=>{const d=new Date(ts*1000);return `${wday(d)} ${d.getDate()} ${mon(d)} · ${hm(d)}`};
const BGS=[{id:'pamir',url:'/s/wk2/salon/pamir.jpg'},{id:'valley',url:'/s/wk2/salon/valley.jpg'},{id:'river',url:'/s/wk2/salon/river.jpg'},{id:'redhall',url:'/s/wk2/salon/redhall.jpg'}];
function readImg(file,max){return new Promise((ok,no)=>{const r=new FileReader();r.onerror=no;r.onload=()=>{const im=new Image();im.onerror=no;im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);let q=.86,u=c.toDataURL('image/jpeg',q);while(u.length>850000&&q>.45){q-=.08;u=c.toDataURL('image/jpeg',q)}ok(u)};im.src=r.result};r.readAsDataURL(file)})}
/* the iPhone only reports the chosen photo when the file field is part of the page, so it is placed (hidden) and removed afterwards */
function pickRaw(){return new Promise(ok=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.style.cssText='position:fixed;left:-200px;top:0;width:1px;height:1px;opacity:0';document.body.appendChild(i);
 let done=false;const end=v=>{if(done)return;done=true;setTimeout(()=>i.remove(),400);ok(v)};i.addEventListener('change',()=>end(i.files&&i.files[0]||null));i.addEventListener('cancel',()=>end(null));i.click()})}
async function pickFile(max){const f=await pickRaw();if(!f)return null;try{return await readImg(f,max)}catch(e){note(t8('offline'),'x');return null}}
/* the photo studio: the chosen photo glows softly behind, a drawn light ring marks the round frame; drag in every direction,
   pinch or slide to zoom (out to the whole photo, in up to 4×), turn it in quarter turns, and see the result live in two sizes */
function cropper(src){return new Promise(ok=>{const w=document.createElement('div');w.className='s8-cr';w.dir=RTL()?'rtl':'ltr';
 const I2={rot:'<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4.5h-4.5"/>',reset:'<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4.5h4.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  ok:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',minus:'<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12h7"/>',plus:'<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12h7M12 8.5v7"/>'};
 w.innerHTML=`<i class="s8-amb"></i><i class="s8-blob s8-b1"></i><i class="s8-blob s8-b2"></i>
  <div class="s8-crh"><button class="s8-orb" data-c="x" aria-label="${esc(t8('cancel'))}">${S(IC.x,2)}</button><b>${esc(t8('cropT'))}</b><button class="s8-orb" data-c="rot" aria-label="${esc(t8('cropRot'))}">${S(I2.rot,2)}</button></div>
  <div class="s8-crv"><i class="s8-crb"></i><img alt="" draggable="false"><i class="s8-crd"></i><i class="s8-crg"></i>
   <svg class="s8-crs" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="s8rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0abfc"/><stop offset=".45" stop-color="#a78bfa"/><stop offset=".75" stop-color="#818cf8"/><stop offset="1" stop-color="#f5c983"/></linearGradient></defs>
    <circle cx="50" cy="50" r="44" pathLength="100"/></svg><i class="s8-cro"></i></div>
  <p class="s8-hint">${esc(t8('cropH'))}</p>
  <div class="s8-cpv"><span class="s8-cp1"><img alt=""></span><span class="s8-cp2"><img alt=""></span></div>
  <div class="s8-crz"><button data-c="zo" aria-label="-">${S(I2.minus,1.9)}</button><input type="range" min="0" max="1000" value="0" aria-label="zoom"><button data-c="zi" aria-label="+">${S(I2.plus,1.9)}</button></div>
  <div class="s8-cra"><button class="s8-orb" data-c="reset" aria-label="${esc(t8('cropReset'))}">${S(I2.reset,2)}</button><button class="s8-okb" data-c="ok">${S(I2.ok,2.6)}<span>${esc(t8('cropOk'))}</span></button><i class="s8-orb s8-ghost"></i></div>`;
 document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('in'));w.querySelector('.s8-amb').style.backgroundImage=w.querySelector('.s8-crb').style.backgroundImage=`url("${src}")`;
 const im=w.querySelector('.s8-crv img'),vp=w.querySelector('.s8-crv'),zr=w.querySelector('.s8-crz input'),hint=w.querySelector('.s8-hint');
 let W=0,H=0,D=0,rot=0,z=1.15,x=0,y=0,zmin=.5;const ZMAX=4;
 const dims=()=>rot%180?[H,W]:[W,H];const base=()=>{const [a,b]=dims();return D/Math.min(a,b)};
 const lim=()=>{const [a,b]=dims();zmin=Math.min(a,b)/Math.max(a,b)};
 /* free in every direction: the photo may go until its edge reaches the middle of the circle; the rest is filled with a soft blur of it */
 const clamp=()=>{const s=base()*z,[a,b]=dims(),r=D/2;for(const k of ['x','y']){const half=(k==='x'?a:b)*s/2,m=Math.max(Math.abs(half-r),half);if(k==='x')x=Math.max(-m,Math.min(m,x));else y=Math.max(-m,Math.min(m,y))}};
 const slider=()=>{const p=(Math.log(z)-Math.log(zmin))/(Math.log(ZMAX)-Math.log(zmin));zr.value=Math.round(p*1000);zr.style.setProperty('--p',(p*100).toFixed(1)+'%')};
 let pvT=0;const render=N=>{const c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');const k=N/D,s=base()*z;
  const gr=g.createLinearGradient(0,0,N,N);gr.addColorStop(0,'#2a1846');gr.addColorStop(1,'#120a22');g.fillStyle=gr;g.fillRect(0,0,N,N);
  if('filter' in g){try{g.filter='blur('+Math.round(N/26)+'px) brightness(.7)';const cs=Math.max(N/W,N/H)*1.1;g.drawImage(im,(N-W*cs)/2,(N-H*cs)/2,W*cs,H*cs);g.filter='none'}catch(e){}}
  g.save();g.translate(N/2+x*k,N/2+y*k);g.rotate(rot*Math.PI/180);g.scale(s*k,s*k);g.imageSmoothingQuality='high';g.drawImage(im,-W/2,-H/2);g.restore();return c};
 const preview=()=>{clearTimeout(pvT);pvT=setTimeout(()=>{if(!W)return;const u=render(120).toDataURL('image/jpeg',.8);w.querySelectorAll('.s8-cpv img').forEach(i=>i.src=u)},90)};
 const show=()=>{clamp();im.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) rotate(${rot}deg) scale(${base()*z})`;slider();preview()};
 let moved=false;const touched=()=>{if(!moved){moved=true;hint.classList.add('s8-gone')}};
 im.onload=()=>{W=im.naturalWidth;H=im.naturalHeight;D=vp.getBoundingClientRect().width*.88;im.style.width=W+'px';im.style.height=H+'px';lim();z=Math.max(z,zmin);show();w.classList.add('ready')};im.src=src;
 const pts=new Map();let st=null;
 vp.addEventListener('pointerdown',e=>{e.preventDefault();try{vp.setPointerCapture(e.pointerId)}catch(_){}pts.set(e.pointerId,{x:e.clientX,y:e.clientY});st={x,y,z,pts:new Map(pts)};vp.classList.add('s8-drag')});
 vp.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId)||!st)return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});touched();const a=[...pts.values()],b=[...st.pts.values()];
  if(a.length>=2&&b.length>=2){const d0=Math.hypot(b[0].x-b[1].x,b[0].y-b[1].y)||1,d1=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);z=Math.max(zmin,Math.min(ZMAX,st.z*d1/d0));
   const m0={x:(b[0].x+b[1].x)/2,y:(b[0].y+b[1].y)/2},m1={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};x=st.x*z/st.z+(m1.x-m0.x);y=st.y*z/st.z+(m1.y-m0.y)}
  else if(a.length===1){x=st.x+(a[0].x-b[0].x);y=st.y+(a[0].y-b[0].y)}show()});
 const up=e=>{pts.delete(e.pointerId);st=pts.size?{x,y,z,pts:new Map(pts)}:null;if(!pts.size)vp.classList.remove('s8-drag')};vp.addEventListener('pointerup',up);vp.addEventListener('pointercancel',up);
 const zoomTo=nz=>{const z0=z;z=Math.max(zmin,Math.min(ZMAX,nz));x*=z/z0;y*=z/z0;touched();show()};
 vp.addEventListener('wheel',e=>{e.preventDefault();zoomTo(z*(e.deltaY<0?1.08:.93))},{passive:false});
 zr.addEventListener('input',()=>zoomTo(Math.exp(Math.log(zmin)+(+zr.value/1000)*(Math.log(ZMAX)-Math.log(zmin)))));
 const close=v=>{w.classList.remove('in');w.classList.add('out');setTimeout(()=>w.remove(),320);ok(v)};
 w.addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;const a=b.dataset.c;hap();
  if(a==='x')return close(null);
  if(a==='zi')return zoomTo(z*1.2);if(a==='zo')return zoomTo(z/1.2);
  if(a==='rot'){rot=(rot+90)%360;lim();z=Math.max(z,zmin);vp.classList.remove('s8-turn');void vp.offsetWidth;vp.classList.add('s8-turn');touched();return show()}
  if(a==='reset'){rot=0;x=0;y=0;lim();z=Math.max(1.15,zmin);return show()}
  if(a==='ok'){if(!W)return;const c=render(512);let q=.9,u=c.toDataURL('image/jpeg',q);while(u.length>400000&&q>.5){q-=.08;u=c.toDataURL('image/jpeg',q)}
   w.classList.add('s8-done');setTimeout(()=>close(u),520)}})})}

(()=>{const s=document.createElement('style');s.textContent=".s8 .s8-qa button.s8-follow{position:relative;width:44px;min-width:44px;height:44px;flex:0 0 44px;padding:10px;border-radius:50%;border:1px solid #ead5ff80;color:#edddff;background:radial-gradient(at 25% 15%,#ffffff35,transparent 65%),#b892ed20;box-shadow:inset 0 1px #ffffff60,0 3px 14px #c293ff25;display:grid;place-items:center}.s8 .s8-follow:before{content:'';position:absolute;top:7px;left:10px;width:10px;height:2px;border-radius:50%;background:#fff7;transform:rotate(-35deg)}.s8 .s8-follow[aria-pressed=true]{color:#b9ffe0;border-color:#8ceec185;background-color:#409e7224}.s8 .s8-follow svg{width:22px;height:22px}";document.head.append(s)})();
/* ---------- the profile page */
async function open(code){const k=K();code=code||(k&&k.cid());if(!code)return;const w=page('s8-pf');let P=null;
 w.innerHTML=`<div class="s8-hero s8-sk"></div>`;
 const save=async(set,silent)=>{Object.assign(P,set);try{const j=await req('/api/app/salon/profile',{code,set});Object.assign(P,j.profile||{});window.SLN3?.updateProfile?.(j.profile);if(!silent)note(t8('saved'),'check');try{SLR3.k.reload&&SLR3.k.reload()}catch(_){}return true}catch(e){note(t8('offline'),'x');return false}};
 const tile=(id,ic,label,val,o)=>`<button class="s8-t${o&&o.on?' s8-on':''}${o&&o.wide?' s8-w':''}" data-t="${id}" style="--k:${o&&o.k||0}" ${o&&o.on!=null?`aria-pressed="${!!o.on}"`:''}><i class="s8-ti">${S(ic,1.8)}</i>${o&&o.extra||''}<span class="s8-tv">${val}</span><span class="s8-tl">${esc(label)}</span></button>`;
 let XR={hidden:false,music:'admins',count:null},xb2=null,xRoleNow=null;
 const xHero=()=>{if(P.is_owner)return;const sm=w.querySelector('.s8-id small');if(sm&&XR.count!=null)sm.textContent=XT(num(XR.count)+' عضو',num(XR.count)+G(' members'));
  const ph=w.querySelector('.s8-ph');if(ph&&xRoleNow==='none'&&!ph.querySelector('.s8-xjoin')){const b=document.createElement('button');b.className='s8-xjoin';b.setAttribute('aria-label',XT('عضو شو','Join'));b.innerHTML=S(XI.plus,2.6);
   b.addEventListener('click',async ev=>{ev.stopPropagation();hap();b.disabled=true;try{const j=await api('/api/app/salon/x/join',{code});if(!j||!j.ok)throw Error((j&&j.err)||'x');xRoleNow='member';b.remove();note(XT('عضو این سالون شدی','You joined this salon'),'check');if(xb2&&xb2.reload)xb2.reload();try{SLR3.k.refreshX&&SLR3.k.refreshX()}catch(_){}}catch(er){b.disabled=false;note(er.message==='members_full'?XT('این سالون 200 عضو دارد و پر است','This salon is full (200 members)'):er.message==='private'||er.message==='banned'?XT('نمی‌توانی عضو این سالون شوی','You cannot join this salon'):t8('offline'),'x')}});ph.appendChild(b)}};
 const draw=()=>{draw0();if(!P.is_owner){if(!xb2){xb2=document.createElement('div');xb2.className='s8-xwrap';xCard(xb2,code,{loaded:D=>{XR.count=D.count;xRoleNow=D.role;xHero()}})}w.appendChild(xb2);xHero()}};
 const draw0=()=>{const own=!!P.is_owner;const cover=P.bg||'/s/wk2/salon/pamir.jpg';const mem=P.members_preview||[];
  const priv={public:['globe','pub'],friends:['users','friends'],invite:['lock','inv']}[P.privacy]||['globe','pub'];
  w.innerHTML=`<div class="s8-hero"><img src="${esc(cover)}" alt=""><i class="s8-hs"></i>
    <button class="s8-hb s8-bk" data-x="back" aria-label="${esc(t8('back'))}">${S(IC.chev,2)}</button>${own?`<button class="s8-hb s8-ed" data-x="edit" aria-label="${esc(t8('edit'))}">${S(IC.edit,1.9)}</button>`:''}
    <div class="s8-id"><span class="s8-ph">${P.photo?`<img src="${esc(P.photo)}" alt="">`:ava({id:P.owner&&P.owner.id,name:P.name})}</span><b><bdi>${esc(P.name||'')}</bdi></b>
     <small>${esc(t8('seatsOf',{n:num(P.seated||0),m:num(P.seats||8)}))} · ${esc(t8('people',{n:num(P.present||0)}))}</small>
     <span class="s8-own">${ava(P.owner)}<bdi>${esc((P.owner&&P.owner.name)||'')}</bdi><em>${esc(t8('owner'))}</em></span></div></div>
   <div class="s8-qa">${!own?`<button class="s8-follow" data-x="follow" aria-label="${P.favorite?'لغو دنبال‌کردن سالون':'دنبال‌کردن سالون'}" aria-pressed="${!!P.favorite}" ${typeof P.favorite!=='boolean'?'disabled':''}>${S(P.favorite?'<path d="m6 12 4 4 8-8"/>':'<path d="M12 5v14M5 12h14"/>',2)}</button>`:''}${own||P.share!==false?`<button data-x="invite"><i>${S(IC.invite,1.8)}</i><span>${esc(t8('invite'))}</span></button><button data-x="link"><i>${S(IC.link,1.8)}</i><span>${esc(t8('link'))}</span></button>`:''}
    ${own?`<button data-x="notice" aria-label="ویرایش اعلان"><i>${S(IC.bell,1.8)}</i><span>اعلان</span></button><button data-x="event"><i>${S(IC.cal,1.8)}</i><span>${esc(t8('event'))}</span></button>`:`<button data-x="report"><i>${S(IC.flag,1.8)}</i><span>${esc(t8('report'))}</span></button>`}</div>
   ${P.event?`<button class="s8-ev" data-x="event"><i>${S(IC.cal,1.8)}</i><span><b><bdi>${esc(P.event.title||t8('event'))}</bdi></b><small>${esc(when(P.event.ts))}</small></span>${P.event.remind?`<em>${S(IC.bell,1.8)}</em>`:''}</button>`:''}
   ${own?`<div class="s8-cc">
    ${tile('seats',IC.seat,t8('seats'),`<b>${num(P.seats)}</b><small>${esc(t8('limit'))} ${num(P.limit)}</small>`,{k:0})}
    ${tile('entry',IC[priv[0]],t8('entry'),`<b class="s8-sm">${esc(t8(priv[1]))}</b><small>${P.approval?esc(t8('approval')):''}</small>`,{k:1})}
    ${tile('mic',IC.mic,t8('mic'),`<b class="s8-sm">${esc(t8(P.mic==='ask'?'ask':'free'))}</b>`,{k:2,on:P.mic!=='ask'})}
    ${tile('chat',IC.chat,t8('chat'),`<b class="s8-sm">${esc(t8(P.chat?'on':'off'))}</b>`,{k:3,on:!!P.chat})}
    ${tile('look',IC.look,t8('look'),'',{k:4,extra:`<span class="s8-lk" style="background-image:url('${esc(cover)}')"></span>`})}
    ${tile('members',IC.users,t8('members'),`<span class="s8-st">${mem.slice(0,4).map((m,i)=>`<span style="--i:${i}">${ava(m)}</span>`).join('')}</span><small>${esc(XR.count!=null?XT(num(XR.count)+' عضو',num(XR.count)+G(' members')):t8('people',{n:num(P.present||0)}))}</small>`,{k:5})}
    ${tile('xhide',XR.hidden?XI.eyex:XI.eye,XT('اعضا برای دیگران','Members for others'),`<b class="s8-sm">${esc(XR.hidden?XT('مخفی','Hidden'):XT('پیدا','Visible'))}</b>`,{k:6,on:!!XR.hidden})}${tile('xmusic',XI.music,XT('پخش موسیقی','Music playback'),`<b class="s8-sm">${esc(xRule(XR.music))}</b>`,{k:6})}${tile('assistant',IC.shield,t8('assistant'),P.assistant?`<span class="s8-as">${ava(P.assistant)}<b class="s8-sm"><bdi>${esc(P.assistant.name||'')}</bdi></b></span>`:`<small>${esc(t8('assistantNone'))}</small>`,{k:6,wide:true})}
   </div>`:`<div class="s8-info">
    <div><i>${S(IC.seat,1.7)}</i><span>${esc(t8('seatsOf',{n:num(P.seated||0),m:num(P.seats||8)}))}</span></div>
    <div><i>${S(IC[priv[0]],1.7)}</i><span>${esc(t8(priv[1]))}${P.approval?' · '+esc(t8('approval')):''}</span></div>
    <div><i>${S(IC.mic,1.7)}</i><span>${esc(t8('mic'))} · ${esc(t8(P.mic==='ask'?'ask':'free'))}</span></div>
    ${P.created?`<div><i>${S(IC.info,1.7)}</i><span>${esc(t8('created',{d:when(P.created).split(' · ')[0]}))}</span></div>`:''}
    ${P.share===false?`<p class="s8-nt">${esc(t8('shareOff'))}</p>`:''}</div>`}`};
 try{const j=await req('/api/app/salon/profile?code='+encodeURIComponent(code));P=j.profile}catch(e){w.close();return note(t8('offline'),'x')}
 draw();xGet('/api/app/salon/x/state?code='+encodeURIComponent(code)).then(j=>{if(!j||!w.isConnected)return;XR.hidden=!!(j.rules&&j.rules.hidden);XR.music=(j.rules&&j.rules.music)||'admins';XR.count=j.members;if(P.is_owner)draw();else xHero()});if(!P.is_owner){try{const result=await req('/api/app/rooms?filter=all&q='+encodeURIComponent(code));const room=(result.halls||[]).find(r=>r.code===code);if(room)P.favorite=!!room.favorite;else{const home=await req('/api/app/salon/home');P.favorite=(home.followed||[]).some(r=>r.code===code)}if(w.isConnected)draw()}catch{if(w.isConnected)note(t8('offline'),'x')}}
 w.addEventListener('click',async e=>{const x=e.target.closest('[data-x]');const t=e.target.closest('[data-t]');if(!x&&!t)return;hap();
  if(x){const a=x.dataset.x;
   if(a==='back')return w.close();
   if(a==='follow'){if(P.is_owner||typeof P.favorite!=='boolean'||x.disabled)return;x.disabled=true;try{const favorite=!P.favorite;await req('/api/app/rooms/favorite',{code,favorite});if(!w.isConnected)return;P.favorite=favorite;draw();window.SLN3?.reload?.()}catch{if(x.isConnected)x.disabled=false;note(t8('offline'),'x')}return}
   if(a==='notice')return window.WakhanSalonNotice?.open();if(a==='edit')return editSheet(P,save,draw);
   if(a==='invite'){const fn=window.SLR3_PAGES&&SLR3_PAGES.invite;if(fn)return fn();return}
   if(a==='link'){const u=P.link||(location.origin+'/r/'+code);try{if(navigator.share){await navigator.share({title:P.name,url:u});return}}catch(_){return}try{await navigator.clipboard.writeText(u)}catch(_){}return note(t8('copied'),'check')}
   if(a==='event')return P.is_owner?eventSheet(P,code,draw):null;
   if(a==='report')return reportSheet(code);return}
  const id=t.dataset.t;
  if(id==='mic'){const v=P.mic==='ask'?'free':'ask';await save({mic:v},true);return draw()}
  if(id==='chat'){await save({chat:!P.chat},true);return draw()}
  if(id==='seats')return seatsSheet(P,save,draw);
  if(id==='entry')return entrySheet(P,save,draw);
  if(id==='look')return lookPage(P,save,draw);
  if(id==='xhide'){const v=!XR.hidden;try{const j=await api('/api/app/salon/x/settings',{code,hidden:v});if(!j||!j.ok)throw 0;XR.hidden=v;note(t8('saved'),'check')}catch(_){note(t8('offline'),'x')}return draw()}
  if(id==='xmusic')return xRuleSheet(code,XR,draw);
  if(id==='members'||id==='assistant')return membersPage(P,code,draw)});
 return w}

/* ---------- edit name & photo: a floating glass card, the salon picture in a living light ring, a name field that glows while typing */
function editSheet(P,save,draw){const w=sheet('s8-ed');let photo=P.photo||'';
 const pic=()=>photo?`<img src="${esc(photo)}" alt="">`:ava({id:P.owner&&P.owner.id,name:P.name});
 const d=(nm)=>{const v=nm!=null?nm:(P.name||'');w.innerHTML=`<div class="s6-bx s8-edb"><i class="s8-aur"></i>
  <div class="s8-eh"><button class="s8-pp" data-e="photo" aria-label="${esc(t8('photo'))}"><span class="s8-rc"></span><span class="s8-orbit"></span><span class="s8-ppi">${pic()}</span><i class="s8-cam">${S(IC.cam,1.9)}</i></button></div>
  <label class="s8-fl"><input data-e="name" maxlength="40" value="${esc(v)}" placeholder=" " aria-label="${esc(t8('name'))}"><span>${esc(t8('name'))}</span><em>${num(v.length)}/${num(40)}</em><i class="s8-glow"></i></label>
  <div class="s8-two"><button class="s6-go s8-cl" data-e="x">${esc(t8('cancel'))}</button><button class="s6-go s8-gold" data-e="ok">${S(IC.check||'<path d="m5 12.5 4.5 4.5L19 7.5"/>',2.4)}<span>${esc(t8('save'))}</span></button></div></div>`;
  const i=w.querySelector('[data-e=name]'),c=w.querySelector('.s8-fl em');i.addEventListener('input',()=>{c.textContent=num(i.value.length)+'/'+num(40)})};
 d();
 w.addEventListener('click',async e=>{const b=e.target.closest('[data-e]');if(!b||b.tagName==='INPUT')return;const a=b.dataset.e;hap();
  if(a==='x')return shut(w);
  if(a==='photo'){const big=await pickFile(1600);const u=big&&await cropper(big);if(u){const nm=w.querySelector('[data-e=name]').value;photo=u;d(nm);const pp=w.querySelector('.s8-pp');if(pp){pp.classList.add('s8-new')}}return}
  if(a==='ok'){const name=w.querySelector('[data-e=name]').value.trim();if(!name)return w.querySelector('[data-e=name]').focus();b.disabled=true;const set={name};if(photo!==P.photo)set.photo=photo;if(await save(set)){shut(w);draw()}else b.disabled=false}})}

/* ---------- seats (2–16, shortcuts 2/4/8/12/16) and the separate presence limit */
function seatsSheet(P,save,draw){const w=sheet();let s=P.seats||8,l=P.limit||6;const minS=Math.max(2,P.min_seats||2);
 const d=()=>{const lowL=l<(P.present||0);w.innerHTML=`<div class="s6-bx"><i class="s6-gr"></i><div class="s6-hd"><b>${esc(t8('seats'))}</b><button class="s6-x" data-q="x" aria-label="${esc(t8('close'))}">${S(IC.x,2)}</button></div>
  <div class="s8-big"><button data-q="s-" ${s<=minS?'disabled':''} aria-label="-">${S(IC.minus,2.2)}</button><b>${num(s)}</b><button data-q="s+" ${s>=16?'disabled':''} aria-label="+">${S(IC.plus,2.2)}</button></div>
  <div class="s8-sc">${[2,4,8,12,16].map(n=>`<button class="${n===s?'on':''}" data-n="${n}" ${n<minS?'disabled':''}>${num(n)}</button>`).join('')}</div>
  ${minS>2?`<p class="s8-nt">${esc(t8('seatsMin',{n:num(minS)}))}</p>`:''}
  <div class="s8-row"><i>${S(IC.users,1.8)}</i><span>${esc(t8('limit'))}</span><div class="s8-stp"><button data-q="l-" ${l<=1?'disabled':''}>${S(IC.minus,2.2)}</button><b>${num(l)}</b><button data-q="l+" ${l>=16?'disabled':''}>${S(IC.plus,2.2)}</button></div></div>
  ${lowL?`<p class="s8-nt">${esc(t8('limitLow',{n:num(P.present)}))}</p>`:''}
  <button class="s6-go" data-q="ok">${esc(t8('save'))}</button></div>`};d();
 w.addEventListener('click',async e=>{const n=e.target.closest('[data-n]');if(n&&!n.disabled){hap();s=+n.dataset.n;return d()}const b=e.target.closest('[data-q]');if(!b||b.disabled)return;const a=b.dataset.q;hap();
  if(a==='x')return shut(w);if(a==='s-')s=Math.max(minS,s-1);if(a==='s+')s=Math.min(16,s+1);if(a==='l-')l=Math.max(1,l-1);if(a==='l+')l=Math.min(16,l+1);
  if(a==='ok'){const old={seats:P.seats,limit:P.limit};try{SLR3.k.seatOverride&&SLR3.k.seatOverride(s)}catch(_){}shut(w);draw();save({seats:s,limit:l},true).then(ok=>{if(!ok){try{SLR3.k.seatOverride&&SLR3.k.seatOverride(0)}catch(_){}Object.assign(P,old);draw()}});return}d()})}

/* ---------- entry: who can come in, and whether I approve */
function entrySheet(P,save,draw){const w=sheet();let pv=P.privacy||'public',ap=!!P.approval;
 const d=()=>{w.innerHTML=`<div class="s6-bx"><i class="s6-gr"></i><div class="s6-hd"><b>${esc(t8('entry'))}</b><button class="s6-x" data-q="x" aria-label="${esc(t8('close'))}">${S(IC.x,2)}</button></div>
  <div class="s8-seg">${[['public','globe','pub'],['friends','users','friends'],['invite','lock','inv']].map(o=>`<button class="${pv===o[0]?'on':''}" data-p="${o[0]}" aria-pressed="${pv===o[0]}"><i>${S(IC[o[1]],1.8)}</i><span>${esc(t8(o[2]))}</span></button>`).join('')}</div>
  <button class="s8-sw${ap?' on':''}" data-q="ap" aria-pressed="${ap}"><i>${S(IC.door,1.8)}</i><span><b>${esc(t8('approval'))}</b><small>${esc(t8('approvalD'))}</small></span><em class="s8-tg"><i></i></em></button>
  <button class="s6-go" data-q="ok">${esc(t8('save'))}</button></div>`};d();
 w.addEventListener('click',async e=>{const p=e.target.closest('[data-p]');if(p){hap();pv=p.dataset.p;return d()}const b=e.target.closest('[data-q]');if(!b||b.disabled)return;const a=b.dataset.q;hap();
  if(a==='x')return shut(w);if(a==='ap'){ap=!ap;return d()}if(a==='ok'){b.disabled=true;if(await save({privacy:pv,approval:ap})){shut(w);draw()}else b.disabled=false}})}

/* ---------- look: background, dim, live chat preview */
const BPI={move:'<path d="M12 3v18M3 12h18M12 3 9.5 5.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>',back:'<path d="m15 6-6 6 6 6"/>',reset:'<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4.5h4.5"/>',ok:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',zo:'<circle cx="11" cy="11" r="7"/><path d="M8 11h6M16.5 16.5 21 21"/>',zi:'<circle cx="11" cy="11" r="7"/><path d="M8 11h6M11 8v6M16.5 16.5 21 21"/>'};
/* the salon photo: choose which part of it fills the phone (the frame is the phone's own shape), then the phone cuts exactly that */
function bgPos(src){return new Promise(ok=>{const en=!/^(fa|ps|prs)/.test(String(L()||'fa'));const G=s=>(window.WKG?window.WKG(s):s);const w=document.createElement('div');w.className='s8-bp';w.dir=RTL()?'rtl':'ltr';
 w.innerHTML=`<i class="s8-bpa"></i><div class="s8-bph"><button class="s8-orb" data-p="x" aria-label="${esc(t8('back'))}">${S(BPI.back,2)}</button><b>${esc(en?G('Photo position'):'جای عکس')}</b><button class="s8-orb" data-p="reset" aria-label="reset">${S(BPI.reset,2)}</button></div>
  <div class="s8-bpf"><img alt="" draggable="false"><i class="s8-bpg"></i><div class="s8-bpgh" aria-hidden="true"><div class="s8-bpgt"><i></i><i></i><i></i><em></em><u></u></div><div class="s8-bpgs"><i></i><i></i><i></i><i></i></div><div class="s8-bpgc"><i></i><i></i><em></em></div></div></div>
  <p class="s8-bpt">${esc(en?G('Drag to move · pinch to zoom'):'بکش تا جای عکس عوض شود · با دو انگشت بزرگ کن')}</p>
  <div class="s8-bpz"><button data-p="zo" aria-label="-">${S(BPI.zo,1.9)}</button><input type="range" min="0" max="1000" value="0" aria-label="zoom"><button data-p="zi" aria-label="+">${S(BPI.zi,1.9)}</button></div>
  <div class="s8-bpb"><button class="s8-okb" data-p="ok">${S(BPI.ok,2.6)}<span>${esc(en?G('Confirm'):'تأیید')}</span></button></div>`;
 document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('in'));
 const fr=w.querySelector('.s8-bpf'),im=fr.querySelector('img'),zr=w.querySelector('.s8-bpz input');w.querySelector('.s8-bpa').style.backgroundImage=`url("${src}")`;
 const A=Math.max(1.4,(innerHeight||800)/(innerWidth||390));let FW=0,FH=0,W=0,H=0,s0=1,z=1,x=0,y=0;const ZM=4;
 const size=()=>{const r=w.getBoundingClientRect();let fh=Math.min(r.height*.6,(r.width-64)*A);FH=fh;FW=fh/A;fr.style.width=FW+'px';fr.style.height=FH+'px';if(W){s0=Math.max(FW/W,FH/H)}};
 const clamp=()=>{const sc=s0*z,iw=W*sc,ih=H*sc;x=Math.min(0,Math.max(FW-iw,x));y=Math.min(0,Math.max(FH-ih,y))};
 const draw=()=>{clamp();const sc=s0*z;im.style.width=(W*sc)+'px';im.style.height=(H*sc)+'px';im.style.transform=`translate(${x}px,${y}px)`;zr.value=String(Math.round((z-1)/(ZM-1)*1000))};
 const center=()=>{z=1;const sc=s0;x=(FW-W*sc)/2;y=(FH-H*sc)/2;draw()};
 const zoomTo=(nz,cx,cy)=>{nz=Math.max(1,Math.min(ZM,nz));if(cx==null){cx=FW/2;cy=FH/2}const k=nz/z;x=cx-(cx-x)*k;y=cy-(cy-y)*k;z=nz;draw()};
 im.onload=()=>{W=im.naturalWidth;H=im.naturalHeight;size();center()};im.onerror=()=>{note(t8('offline'),'x');end(null)};im.src=src;
 const ro=()=>{const ox=x/(s0*z),oy=y/(s0*z),oz=z;size();z=oz;x=ox*s0*z;y=oy*s0*z;draw()};addEventListener('resize',ro);
 const pts=new Map();let last=null;
 const mid=()=>{const v=[...pts.values()],r=fr.getBoundingClientRect();return{cx:(v[0].x+v[1].x)/2-r.left,cy:(v[0].y+v[1].y)/2-r.top,d:Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y)}};
 fr.addEventListener('pointerdown',e=>{e.preventDefault();try{fr.setPointerCapture(e.pointerId)}catch(_){}pts.set(e.pointerId,{x:e.clientX,y:e.clientY});last=pts.size===2?mid():{x:e.clientX,y:e.clientY}});
 fr.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;e.preventDefault();pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size>=2){const m=mid();if(last&&last.d){x+=m.cx-last.cx;y+=m.cy-last.cy;zoomTo(z*m.d/last.d,m.cx,m.cy)}last=m}
  else if(last){x+=e.clientX-last.x;y+=e.clientY-last.y;last={x:e.clientX,y:e.clientY};draw()}});
 const up=e=>{pts.delete(e.pointerId);last=pts.size===1?{...[...pts.values()][0]}:pts.size===2?mid():null};fr.addEventListener('pointerup',up);fr.addEventListener('pointercancel',up);
 zr.addEventListener('input',()=>zoomTo(1+zr.value/1000*(ZM-1)));
 const end=v=>{removeEventListener('resize',ro);w.classList.remove('in');setTimeout(()=>w.remove(),260);ok(v)};
 w.addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b)return;const a=b.dataset.p;hap();
  if(a==='x')return end(null);if(a==='reset')return center();if(a==='zo')return zoomTo(z-.35);if(a==='zi')return zoomTo(z+.35);
  if(a==='ok'){try{const sc=s0*z,OW=900,OH=Math.round(900*A),c=document.createElement('canvas');c.width=OW;c.height=OH;c.getContext('2d').drawImage(im,-x/sc,-y/sc,FW/sc,FH/sc,0,0,OW,OH);
   let q=.86,u=c.toDataURL('image/jpeg',q);while(u.length>850000&&q>.45){q-=.08;u=c.toDataURL('image/jpeg',q)}end(u)}catch(err){note(t8('offline'),'x')}}})})}
function lookPage(P,save,draw){const w=page('s8-lp');let bg=P.bg||BGS[0].url,dim=P.dim==null?.35:P.dim;const custom=P.bg&&!BGS.some(b=>b.url===P.bg)?P.bg:null;let up=custom;
 const d=()=>{w.innerHTML=`<div class="r-pgh"><button class="r-pgb" data-l="back" aria-label="${esc(t8('back'))}">${S(IC.chev,2)}</button><div><b>${esc(t8('look'))}</b><small><bdi>${esc(P.name||'')}</bdi></small></div></div>
  <div class="s8-pv"><img src="${esc(bg)}" alt=""><i style="opacity:${dim}"></i>
   <div class="s8-pseats">${'<span></span>'.repeat(8)}</div>
   <div class="s8-pm"><div>${ava({id:9,name:'فرید',avatar:'/ava/9'})}<span><b class="r-mn" style="--n1:#FFD3A5;--n2:#FD9A6B">فرید</b><em>${esc(t8('p1'))}</em></span></div><div>${ava({id:5,name:'لیلا',avatar:'/ava/5'})}<span><b class="r-mn" style="--n1:#C9BCFF;--n2:#8B76FF">لیلا</b><em>${esc(t8('p2'))}</em></span></div></div>
   <span class="s8-pl">${esc(t8('preview'))}</span><button class="s8-ppos" data-l="pos" aria-label="${esc(/^(fa|ps|prs)/.test(String(L()||'fa'))?'جای عکس':'Photo position')}">${S(BPI.move,1.9)}</button></div>
  <div class="s8-bgs"><button class="s8-bga" data-l="gallery" aria-label="${esc(t8('gallery'))}">${S(IC.plus,2)}<span>${esc(t8('gallery'))}</span></button>${(up?[{id:'up',url:up}]:[]).concat(BGS).map(b=>`<button class="s8-bg${b.url===bg?' on':''}" data-b="${esc(b.url)}" style="background-image:url('${esc(b.url)}')">${b.url===bg?`<i>${S(IC.check,2.6)}</i>`:''}</button>`).join('')}</div>
  <div class="s8-dim"><span>${esc(t8('dim'))}</span><input type="range" min="0" max="80" value="${Math.round(dim*100)}" data-l="dim" aria-label="${esc(t8('dim'))}"></div>
  <div class="s8-lf"><button class="s6-go" data-l="use">${esc(t8('use'))}</button></div>`};d();
 w.addEventListener('input',e=>{if(e.target.dataset.l==='dim'){dim=e.target.value/100;const i=w.querySelector('.s8-pv>i');if(i)i.style.opacity=dim}});
 w.addEventListener('click',async e=>{const b=e.target.closest('[data-b]');if(b){hap();bg=b.dataset.b;return d()}const x=e.target.closest('[data-l]');if(!x||x.tagName==='INPUT')return;const a=x.dataset.l;hap();
  if(a==='back')return w.close();
  if(a==='pos'){const u=await bgPos(bg);if(u){up=u;bg=u;d()}return}
  if(a==='gallery'){const u0=await pickFile(1800);const u=u0&&await bgPos(u0);if(u){up=u;bg=u;d()}return}
  if(a==='use'){x.disabled=true;if(await save({bg,dim})){w.close();draw()}else x.disabled=false}})}

/* ---------- members: playback assistant, people present, blocked */
async function membersPage(P,code,draw){const w=page('s8-mp');let M=null;const own=!!P.is_owner;
 const d=()=>{const a=M&&M.assistant;w.innerHTML=`<div class="r-pgh"><button class="r-pgb" data-m="back" aria-label="${esc(t8('back'))}">${S(IC.chev,2)}</button><div><b>${esc(t8('members'))}</b><small>${esc(t8('people',{n:num(M?M.people.length:0)}))}</small></div></div>
  ${!M?'<div class="s8-sk" style="height:70px;border-radius:20px"></div>':`
  <div class="s8-asr"><i class="s8-ti">${S(IC.shield,1.8)}</i><span><b>${esc(t8('assistant'))}</b><small>${esc(t8('asstD'))}</small></span>${a?`<span class="s8-asa">${ava(a)}<bdi>${esc(a.name||'')}</bdi></span>`:`<small class="s8-dim2">${esc(t8('assistantNone'))}</small>`}</div>
  <div class="s8-h">${esc(t8('seated'))}</div>
  <div class="s8-ml">${M.people.filter(p=>p.seat>=0).map((p,i)=>row(p,i,a)).join('')||`<p class="s8-nt">${esc(t8('none'))}</p>`}</div>
  ${M.people.some(p=>p.seat<0)?`<div class="s8-h">${esc(t8('audience'))}</div><div class="s8-ml">${M.people.filter(p=>p.seat<0).map((p,i)=>row(p,i,a)).join('')}</div>`:''}
  ${own&&M.banned.length?`<div class="s8-h">${esc(t8('banned'))}</div><div class="s8-ml">${M.banned.map((p,i)=>`<div class="s8-m" style="--k:${i}">${ava(p)}<span><b><bdi>${esc(p.name||'')}</bdi></b></span><button class="s8-ub" data-ub="${Number(p.id)}">${esc(t8('unban'))}</button></div>`).join('')}</div>`:''}`}`};
 const row=(p,i,a)=>{const me=K()&&Number(p.id)===K().me();const isO=P.owner&&Number(p.id)===Number(P.owner.id);const isA=a&&Number(a.id)===Number(p.id);
  return `<div class="s8-m" style="--k:${i}">${ava(p)}<span><b><bdi>${esc(p.name||'')}</bdi></b><small>${isO?esc(t8('owner')):isA?esc(t8('assistant')):p.seat>=0?esc(t8('seatNo',{n:num(p.seat+1)})):''}</small></span>${isA?`<i class="s8-badge">${S(IC.shield,1.9)}</i>`:''}${own&&!me&&!isO?`<button class="s8-mb" data-u="${Number(p.id)}" aria-label="⋯">${S(IC.more,2)}</button>`:''}</div>`};
 const load=async()=>{try{const j=await req('/api/app/salon/members?code='+encodeURIComponent(code));M=j}catch(e){M={people:[],banned:[],assistant:null}}if(w.isConnected){d();xput()}};
 const xbox=document.createElement('div');xbox.className='s8-xwrap';const xput=()=>{if(xbox.parentNode!==w)w.appendChild(xbox)};
 d();xput();xCard(xbox,code);load();
 w.addEventListener('click',async e=>{const x=e.target.closest('[data-m]');if(x&&x.dataset.m==='back'){hap();return w.close()}
  const ub=e.target.closest('[data-ub]');if(ub){hap();ub.disabled=true;try{await api('/api/v51/hall',{code,action:'unban',uid:+ub.dataset.ub})}catch(_){}M.banned=M.banned.filter(z=>Number(z.id)!==+ub.dataset.ub);d();return xput()}
  const u=e.target.closest('[data-u]');if(u){hap();const p=M.people.find(z=>Number(z.id)===+u.dataset.u);if(p)memberSheet(p,M,code,()=>{d();xput();P.assistant=M.assistant;draw()},load)}})}
const XL=()=>!/^(fa|ps|prs)/.test(String(L()||'fa'));const G=s=>(window.WKG?window.WKG(s):s);const XT=(fa,en)=>XL()?G(en):fa;
const XI={star:'<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',music:'<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6"/>',out:'<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l4-4-4-4M14 12H4"/>',ban:'<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
 lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',inbox:'<path d="M4 13.5 6.2 6a2 2 0 0 1 1.9-1.5h7.8A2 2 0 0 1 17.8 6l2.2 7.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 13.5h4.5l1.5 2h4l1.5-2H20"/>',
 search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',eyex:'<path d="M3 3l18 18"/><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.9 3.5M6.2 7.6C3.9 9.3 2.5 12 2.5 12s3.5 6 9.5 6a9 9 0 0 0 4-.9"/><path d="M9.9 10a3 3 0 0 0 4.1 4.2"/>',
 eye:'<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="3"/>',ok:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',plus:'<path d="M12 5v14M5 12h14"/>'};
const xRule=r=>r==='all'?XT('همه','Everyone'):r==='members'?XT('همهٔ اعضا','All members'):XT('مالک و ادمین‌ها','Owner and admins');
async function xGet(path){try{const j=await api(path);return j&&j.ok?j:null}catch(e){return null}}
async function xRole(code,uid,action){try{const j=await api('/api/app/salon/x/role',{code,uid,action});if(!j||!j.ok)throw Error((j&&j.err)||'x');return true}catch(e){note(e.message==='owner_only'?XT('فقط مالک سالون می‌تواند','Only the owner can'):t8('offline'),'x');return false}}
/* the members card: owner, admins, then members; hidden list for regular members; requests, search and a menu for the owner / admins */
function xCard(box,code,hooks){let D=null,q='';hooks=hooks||{};
 const row=(p,i)=>`<button class="s8-xr" data-xu="${Number(p.id)}" style="--k:${Math.min(i,10)}"><span class="s8-xa">${ava(p)}${p.present?'<i class="s8-xon"></i>':''}</span><span class="s8-xt"><b><bdi>${esc(p.name||'')}</bdi>${p.music&&p.role==='member'?`<i class="s8-xn">${S(XI.music,1.9)}</i>`:''}</b><small>${p.present?esc(XT('در سالون','In the salon')):p.username?'@'+esc(p.username):''}</small></span>${p.role==='owner'?`<em class="s8-xb s8-xbo">${esc(XT('مالک','Owner'))}</em>`:p.role==='admin'?`<em class="s8-xb s8-xba">${esc(XT('ادمین','Admin'))}</em>`:''}</button>`;
 const lists=()=>{const el=box.querySelector('.s8-xls');if(!el||!D)return;const w=q.trim().toLowerCase();const it=D.items.filter(p=>!w||String(p.name||'').toLowerCase().includes(w)||String(p.username||'').toLowerCase().includes(w));
  const st=it.filter(p=>p.role!=='member'),mm=it.filter(p=>p.role==='member');
  el.innerHTML=`<div class="s8-xl">${st.map(row).join('')}</div>${mm.length?`<div class="s8-xsub">${esc(XT('اعضا','Members'))}</div><div class="s8-xl">${mm.map((p,i)=>row(p,i+st.length)).join('')}</div>`:''}${D.hidden&&!D.manage?`<div class="s8-xhd">${S(XI.lock,1.9)}<span>${esc(XT('فهرست اعضای این سالون مخفی است.','This salon’s member list is hidden.'))}</span></div>`:''}`};
 const draw=()=>{if(!D){box.innerHTML='<div class="s8-sk" style="height:140px;border-radius:24px;margin-top:14px"></div>';return}
  box.innerHTML=`<div class="s8-xc"><div class="s8-xh"><b>${esc(XT('اعضا','Members'))}</b><span>${num(D.count)} / ${num(D.cap)}</span></div>
   ${D.hidden&&D.manage?`<p class="s8-xhid">${S(XI.lock,1.9)}<span>${esc(XT('اعضا برای دیگران مخفی است','Members are hidden from others'))}</span></p>`:''}
   ${D.manage&&D.requests&&D.requests.length?`<button class="s8-xrq" data-xq="1"><i>${S(XI.inbox,1.8)}</i><span>${esc(XT('درخواست اجازهٔ پخش','Music requests'))}</span><em>${num(D.requests.length)}</em><b>${S(IC.chev,2)}</b></button>`:''}
   ${D.manage||!D.hidden?`<label class="s8-xs">${S(XI.search,1.9)}<input type="search" autocomplete="off" placeholder="${esc(XT('جستجوی عضو…','Search members…'))}"></label>`:''}<div class="s8-xls"></div></div>`;
  const inp=box.querySelector('.s8-xs input');if(inp){inp.value=q;inp.addEventListener('input',()=>{q=inp.value;lists()})}lists()};
 const load=async()=>{D=await xGet('/api/app/salon/x/members?code='+encodeURIComponent(code))||{items:[],count:0,cap:200,hidden:false,manage:false,role:'none'};if(hooks.loaded)hooks.loaded(D);if(box.isConnected||!box.parentNode)draw()};
 box.addEventListener('click',e=>{const rq=e.target.closest('[data-xq]');if(rq){hap();return xReq(D,code,load)}
  const r=e.target.closest('[data-xu]');if(!r||!D)return;hap();const p=D.items.find(z=>Number(z.id)===+r.dataset.xu);if(!p)return;const me=K()&&K().me();
  if(D.manage&&Number(p.id)!==Number(me)&&p.role!=='owner')return xMenu(p,D,code,load);try{window.wm70OpenProfile&&wm70OpenProfile(Number(p.id))}catch(_){}});
 draw();load();box.reload=load;return box}
function xMenu(p,D,code,after){const w=sheet('s8-xm');const boss=D.role==='owner';const adminOnAdmin=!boss&&p.role==='admin';
 const rows=[];rows.push(['admin',XI.star,p.role==='admin'?XT('برداشتن از ادمینی','Remove admin'):XT('ادمین کردن','Make admin'),'',!boss]);
 if(p.role==='member')rows.push(['music',XI.music,p.music?XT('گرفتن اجازهٔ پخش موسیقی','Take music permission'):XT('دادن اجازهٔ پخش موسیقی','Allow music'),'',false]);
 rows.push(['view',XI.user,XT('دیدن پروفایل','View profile'),'',false]);
 if(!adminOnAdmin){rows.push(['remove',XI.out,XT('حذف از سالون','Remove from salon'),'s8-xd',false]);rows.push(['block',XI.ban,XT('مسدود کردن','Block'),'s8-xd',false])}
 w.innerHTML=`<div class="s6-bx s8-xmb"><i class="s6-gr"></i><div class="s8-xmh">${ava(p)}<span><b><bdi>${esc(p.name||'')}</bdi></b><small>${esc(p.role==='admin'?XT('ادمین','Admin'):XT('عضو','Member'))}${p.present?' · '+esc(XT('در سالون','In the salon')):''}</small></span></div>
  ${rows.map((r,i)=>`<button class="s8-xmr ${r[3]}" data-xa="${r[0]}" style="--k:${i}"${r[4]?' disabled':''}><i>${S(r[1],1.8)}</i><span>${esc(r[2])}</span>${r[4]?`<small>${esc(XT('فقط مالک','Owner only'))}</small>`:''}</button>`).join('')}</div>`;
 w.addEventListener('click',async e=>{const b=e.target.closest('[data-xa]');if(!b||b.disabled)return;hap();const a=b.dataset.xa;
  if(a==='view'){shut(w);try{window.wm70OpenProfile&&wm70OpenProfile(Number(p.id))}catch(_){}return}
  b.disabled=true;const act=a==='admin'?(p.role==='admin'?'unadmin':'admin'):a==='music'?(p.music?'unmusic':'music'):a;
  if(await xRole(code,p.id,act)){shut(w);note(XT('انجام شد','Done'),'check');after()}else b.disabled=false})}
function xReq(D,code,after){const w=sheet('s8-xm');const list=(D&&D.requests)||[];
 const draw=()=>{w.innerHTML=`<div class="s6-bx s8-xmb"><i class="s6-gr"></i><div class="s8-xmh s8-xmh2"><b>${esc(XT('درخواست اجازهٔ پخش','Music requests'))}</b></div>${list.length?list.map((p,i)=>`<div class="s8-xqr" style="--k:${i}">${ava(p)}<span><bdi>${esc(p.name||'')}</bdi></span><button class="s8-xqn" data-xn="${Number(p.id)}" aria-label="${esc(XT('رد','Decline'))}">${S(XI.x,2)}</button><button class="s8-xqy" data-xy="${Number(p.id)}" aria-label="${esc(XT('قبول','Allow'))}">${S(XI.ok,2.2)}</button></div>`).join(''):`<p class="s8-nt">${esc(XT('درخواستی نیست','No requests'))}</p>`}</div>`};draw();
 w.addEventListener('click',async e=>{const y=e.target.closest('[data-xy]'),n=e.target.closest('[data-xn]');const b=y||n;if(!b)return;hap();b.disabled=true;const id=+(b.dataset.xy||b.dataset.xn);
  if(await xRole(code,id,y?'music':'unmusic')){const i=list.findIndex(p=>Number(p.id)===id);if(i>=0)list.splice(i,1);draw();after()}else b.disabled=false})}
function memberSheet(p,M,code,after,reload){const w=sheet();const isA=M.assistant&&Number(M.assistant.id)===Number(p.id);
 const tiles=[['asst',IC.shield,t8(isA?'unAsst':'setAsst'),isA?'s8-on':''],p.seat>=0?['lift',IC.lift,t8('lift'),'']:null,['kick',IC.exit,t8('kick'),'s8-dg'],['ban',IC.ban,t8('ban'),'s8-dg']].filter(Boolean);
 w.innerHTML=`<div class="s6-bx"><i class="s6-gr"></i><div class="s8-mh">${ava(p)}<span><b><bdi>${esc(p.name||'')}</bdi></b>${p.seat>=0?`<small>${esc(t8('seatNo',{n:num(p.seat+1)}))}</small>`:''}</span><button class="s6-x" data-a="x" aria-label="${esc(t8('close'))}">${S(IC.x,2)}</button></div>
  <div class="s8-mt" style="--n:${tiles.length}">${tiles.map((t,i)=>`<button class="s8-mtb ${t[3]}" data-a="${t[0]}" style="--k:${i}"><i>${S(t[1],1.8)}</i><span>${esc(t[2])}</span></button>`).join('')}</div>${isA?'':`<p class="s8-nt">${esc(t8('asstD'))}</p>`}</div>`;
 w.addEventListener('click',async e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a;hap();if(a==='x')return shut(w);b.disabled=true;
  try{if(a==='asst'){const j=await req('/api/app/salon/assistant',{code,uid:isA?0:p.id});M.assistant=j.assistant||null}
   else if(a==='lift'){await req('/api/v51/hall',{code,action:'unseat',uid:p.id});p.seat=-1}
   else if(a==='ban'){await req('/api/v51/hall',{code,action:'ban',uid:p.id});M.people=M.people.filter(z=>z.id!==p.id);M.banned.push(p)}
   else if(a==='kick'){await req('/api/app/salon/kick',{code,uid:p.id});M.people=M.people.filter(z=>z.id!==p.id)}
   shut(w);after()}catch(x){b.disabled=false;note(t8('offline'),'x')}})}

/* ---------- film night: title, day, time (device time), reminder */
function xRuleSheet(code,XR,after){const w=sheet('s8-xm');const opts=['admins','members','all'];
 const draw=()=>{w.innerHTML=`<div class="s6-bx s8-xmb"><i class="s6-gr"></i><div class="s8-xmh s8-xmh2"><b>${esc(XT('چه کسی موسیقی پخش کند؟','Who may play music?'))}</b></div>${opts.map((o,i)=>`<button class="s8-xmr${XR.music===o?' s8-xsel':''}" data-xo="${o}" style="--k:${i}"><i>${S(o==='admins'?XI.star:o==='members'?XI.user:XI.music,1.8)}</i><span>${esc(xRule(o))}</span>${XR.music===o?`<b class="s8-xck">${S(XI.ok,2.4)}</b>`:''}</button>`).join('')}</div>`};draw();
 w.addEventListener('click',async e=>{const b=e.target.closest('[data-xo]');if(!b)return;hap();const v=b.dataset.xo;try{const j=await api('/api/app/salon/x/settings',{code,music:v});if(!j||!j.ok)throw 0;XR.music=v;draw();note(t8('saved'),'check');setTimeout(()=>shut(w),250);after()}catch(_){note(t8('offline'),'x')}})}
function eventSheet(P,code,draw){const w=sheet('s8-evs');const ev=P.event||{};const now=new Date();let day=0,title=ev.title||'',remind=ev.remind!=null?!!ev.remind:true;let tm=ev.ts?hm(new Date(ev.ts*1000)):'20:00';
 if(ev.ts){const a=new Date(ev.ts*1000);a.setHours(0,0,0,0);const b=new Date();b.setHours(0,0,0,0);day=Math.max(0,Math.round((a-b)/864e5))}
 const days=[...Array(14)].map((_,i)=>{const d=new Date(now);d.setDate(now.getDate()+i);return d});
 const d=()=>{w.innerHTML=`<div class="s6-bx"><i class="s6-gr"></i><div class="s6-hd"><b>${esc(t8('event'))}</b><button class="s6-x" data-v="x" aria-label="${esc(t8('close'))}">${S(IC.x,2)}</button></div>
  <label class="s8-in"><input data-v="title" maxlength="60" value="${esc(title)}" placeholder="${esc(t8('evPh'))}" aria-label="${esc(t8('evTitle'))}">${S(IC.edit,1.8)}</label>
  <div class="s8-days">${days.map((x,i)=>`<button class="${i===day?'on':''}" data-d="${i}"><small>${esc(i===0?t8('today'):i===1?t8('tomorrow'):wday(x))}</small><b>${num(x.getDate())}</b><small>${esc(mon(x))}</small></button>`).join('')}</div>
  <div class="s8-row"><i>${S(IC.cal,1.8)}</i><span>${esc(t8('time'))}</span><input class="s8-tm" type="time" data-v="time" value="${esc(tm)}" aria-label="${esc(t8('time'))}"></div>
  <button class="s8-sw${remind?' on':''}" data-v="rm" aria-pressed="${remind}"><i>${S(IC.bell,1.8)}</i><span><b>${esc(t8('remind'))}</b><small>${esc(t8('local'))}</small></span><em class="s8-tg"><i></i></em></button>
  <div class="s8-two">${P.event?`<button class="s6-go s8-cl s8-del" data-v="del" aria-label="${esc(t8('remove'))}">${S(IC.trash,1.9)}</button>`:''}<button class="s6-go" data-v="ok">${esc(t8('save'))}</button></div></div>`};d();
 w.addEventListener('input',e=>{if(e.target.dataset.v==='title')title=e.target.value;if(e.target.dataset.v==='time')tm=e.target.value});
 w.addEventListener('click',async e=>{const dd=e.target.closest('[data-d]');if(dd){hap();day=+dd.dataset.d;title=w.querySelector('[data-v=title]').value;tm=w.querySelector('[data-v=time]').value;const sl=w.querySelector('.s8-days').scrollLeft;d();w.querySelector('.s8-days').scrollLeft=sl;return}
  const b=e.target.closest('[data-v]');if(!b||b.tagName==='INPUT'||b.disabled)return;const a=b.dataset.v;hap();
  if(a==='x')return shut(w);if(a==='rm'){remind=!remind;title=w.querySelector('[data-v=title]').value;tm=w.querySelector('[data-v=time]').value;return d()}
  if(a==='del'){b.disabled=true;try{await req('/api/app/salon/event',{code,remove:true});P.event=null;shut(w);draw()}catch(_){b.disabled=false;note(t8('offline'),'x')}return}
  if(a==='ok'){const [h,m]=(tm||'20:00').split(':').map(Number);const x=new Date(days[day]);x.setHours(h||0,m||0,0,0);const ts=Math.floor(x.getTime()/1000);
   b.disabled=true;try{const j=await req('/api/app/salon/event',{code,title:title.trim()||t8('evPh'),ts,remind});P.event=j.event;shut(w);draw();note(t8('saved'),'check')}catch(_){b.disabled=false;note(t8('offline'),'x')}}})}

/* ---------- report (guests) */
function reportSheet(code){const w=sheet();let r='';
 const d=()=>{w.innerHTML=`<div class="s6-bx"><i class="s6-gr"></i><div class="s6-hd"><b>${esc(t8('reportQ'))}</b><button class="s6-x" data-r="x" aria-label="${esc(t8('close'))}">${S(IC.x,2)}</button></div>
  <div class="s8-rl">${['r1','r2','r3','r4'].map(k=>`<button class="${r===k?'on':''}" data-o="${k}"><i class="s8-rd"></i><span>${esc(t8(k))}</span></button>`).join('')}</div>
  <button class="s6-go" data-r="ok" ${r?'':'disabled'}>${S(IC.flag,1.9)}<span>${esc(t8('sendR'))}</span></button></div>`};d();
 w.addEventListener('click',async e=>{const o=e.target.closest('[data-o]');if(o){hap();r=o.dataset.o;return d()}const b=e.target.closest('[data-r]');if(!b||b.disabled)return;hap();if(b.dataset.r==='x')return shut(w);
  b.disabled=true;try{await req('/api/app/salon/report',{code,reason:r});shut(w);note(t8('reported'),'check')}catch(_){b.disabled=false;note(t8('offline'),'x')}})}

const css=`
/* ---- edit card */
.s8-ed{background:radial-gradient(130% 80% at 50% 100%,rgba(16,6,34,.82),rgba(6,3,14,.6))!important;-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
.s8-ed .s8-edb{position:relative;width:calc(100% - 24px);margin:0 12px calc(10px + env(safe-area-inset-bottom));padding:16px 16px 16px;border-radius:30px;overflow:visible;
 background:linear-gradient(180deg,rgba(70,46,112,.96),rgba(36,24,62,.98) 62%)!important;border:1px solid rgba(214,196,255,.28)!important;box-shadow:0 30px 70px -24px rgba(0,0,0,.85),inset 0 1px 0 rgba(255,255,255,.24)!important;
 animation:s8up .6s cubic-bezier(.2,1.25,.3,1)}
@keyframes s8up{from{transform:translateY(110%)}}
.s8-ed .s6-gr{display:none}
.s8-ed .s8-aur{position:absolute;left:50%;top:-80px;width:300px;height:180px;margin-left:-150px;border-radius:50%;filter:blur(28px);opacity:.75;pointer-events:none;
 background:conic-gradient(from 0deg,rgba(240,171,252,0),rgba(240,171,252,.55),rgba(129,140,248,.5),rgba(245,201,131,.45),rgba(240,171,252,0));animation:s8spin 9s linear infinite}
@keyframes s8spin{to{transform:rotate(360deg)}}
.s8-ed .s8-eh{position:relative;display:flex;justify-content:center;margin:-86px 0 14px}
.s8-ed .s8-pp{position:relative;width:124px;height:124px;border-radius:50%;box-shadow:none;display:grid;place-items:center;animation:s8pop .7s cubic-bezier(.2,1.5,.3,1) .1s both}
@keyframes s8pop{from{transform:scale(.4) translateY(30px);opacity:0}}
.s8-ed .s8-rc{display:block;position:absolute;inset:0;border-radius:50%;padding:3.5px;background:conic-gradient(from 0deg,#f0abfc,#a78bfa,#818cf8,#f5c983,#f0abfc);
 -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:s8spin 6s linear infinite}
.s8-ed .s8-pp::after{content:'';position:absolute;inset:-12px;border-radius:50%;background:radial-gradient(circle,rgba(240,171,252,.35),transparent 68%);animation:s8gl 3.2s ease-in-out infinite;pointer-events:none;z-index:-1}
@keyframes s8gl{50%{transform:scale(1.08);opacity:.6}}
.s8-ed .s8-orbit{display:block;position:absolute;inset:-7px;border-radius:50%;animation:s8spin 4.5s linear infinite;pointer-events:none}
.s8-ed .s8-orbit::before{content:'';position:absolute;top:0;left:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:#fff;box-shadow:0 0 6px 2px rgba(245,201,131,.85),0 0 12px 3px rgba(240,171,252,.5)}
.s8-ed .s8-ppi{position:relative;width:110px;height:110px;border-radius:50%;overflow:hidden;display:grid;place-items:center;box-shadow:0 14px 30px -10px rgba(0,0,0,.7)}
.s8-ed .s8-ppi>img,.s8-ed .s8-ppi>.r-av{width:100%;height:100%;object-fit:cover;display:block;border-radius:50%}
.s8-ed .s8-ppi>.r-av b{font-size:38px}
.s8-ed .s8-pp.s8-new .s8-ppi{animation:s8flip .6s cubic-bezier(.2,1.3,.3,1)}
@keyframes s8flip{0%{transform:scale(.6) rotate(-12deg);filter:brightness(1.8)}100%{transform:none;filter:none}}
.s8-ed .s8-pp>.s8-cam{position:absolute;bottom:2px;inset-inline-end:2px;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;color:#2a1a0c;
 background:linear-gradient(180deg,#f8d49a,#eab676);box-shadow:0 0 0 3px #3a2760,0 8px 18px -6px rgba(234,182,118,.8)}
.s8-ed .s8-cam svg{width:18px;height:18px}
.s8-ed .s8-cam::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:2px solid rgba(245,201,131,.7);animation:s8ping 2.4s ease-out infinite}
@keyframes s8ping{0%{transform:scale(1);opacity:.9}80%,100%{transform:scale(1.6);opacity:0}}
.s8-ed .s8-pp:active .s8-ppi{transform:scale(.95)}
/* name field: the label floats up, the frame lights while typing */
.s8-ed .s8-fl{position:relative;display:block;height:60px;border-radius:18px;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(214,196,255,.26);animation:s8in .5s cubic-bezier(.2,1.2,.3,1) .25s both}
@keyframes s8in{from{opacity:0;transform:translateY(12px)}}
.s8-ed .s8-fl input{position:absolute;inset:0;width:100%;padding:22px 16px 6px 64px;border:0;outline:0!important;box-shadow:none!important;background:none!important;color:#fff;font:inherit;font-size:16.5px;font-weight:800}
.s8-ed[dir=ltr] .s8-fl input{padding:22px 64px 6px 16px}
.s8-ed[dir=ltr] .s8-fl em{left:auto;right:14px}
.s8-ed .s8-fl span{position:absolute;inset-inline-start:16px;top:19px;font-size:15px;font-weight:700;color:rgba(255,255,255,.5);pointer-events:none;transition:all .25s cubic-bezier(.2,1.2,.3,1)}
.s8-ed .s8-fl input:focus+span,.s8-ed .s8-fl input:not(:placeholder-shown)+span{top:8px;font-size:11px;color:#d8b4fe;font-weight:800}
.s8-ed .s8-fl em{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-style:normal;font-size:11px;font-weight:800;opacity:.55;direction:ltr}
.s8-ed .s8-glow{position:absolute;inset:-1.5px;border-radius:19.5px;padding:1.5px;background:conic-gradient(from var(--a,0deg),#f0abfc,#a78bfa,#818cf8,#f5c983,#f0abfc);
 -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .3s;pointer-events:none}
.s8-ed .s8-fl:focus-within .s8-glow{opacity:1;animation:s8spin2 4s linear infinite}
@property --a{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes s8spin2{to{--a:360deg}}
.s8-ed .s8-two{margin-top:16px;animation:s8in .5s cubic-bezier(.2,1.2,.3,1) .35s both}
.s8-ed .s6-go{height:50px;border-radius:16px!important;display:flex;align-items:center;justify-content:center;gap:7px;font-weight:900}
.s8-ed .s6-go svg{width:18px;height:18px}
.s8-ed .s8-gold{position:relative;overflow:hidden;background:linear-gradient(180deg,#f8d49a,#eab676)!important;color:#2a1a0c!important;box-shadow:0 10px 24px -10px rgba(234,182,118,.8)!important}
.s8-ed .s8-gold::after{content:'';position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.65),transparent);animation:s8shine 3.6s ease-in-out 1.2s infinite}
@keyframes s8shine{0%{left:-60%}35%,100%{left:130%}}
/* ---- photo studio */
.s8-cr{position:fixed;inset:0;z-index:2147480010;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;overflow:hidden;
 padding:calc(14px + env(safe-area-inset-top)) 18px calc(18px + env(safe-area-inset-bottom));color:#fff;background:#0c0718;opacity:0;transition:opacity .3s;touch-action:none;font-family:inherit}
.s8-cr.in{opacity:1}.s8-cr.out{opacity:0}
.s8-cr button{border:0;font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;background:none;padding:0}
.s8-amb{position:absolute;inset:-60px;background:center/cover no-repeat;filter:blur(40px) saturate(1.4) brightness(.45);transform:scale(1.15);opacity:.9}
.s8-blob{position:absolute;width:340px;height:340px;border-radius:50%;filter:blur(60px);opacity:.45;pointer-events:none}
.s8-b1{background:#a855f7;left:-120px;top:8%;animation:s8drift 11s ease-in-out infinite alternate}
.s8-b2{background:#f5c983;right:-140px;bottom:6%;opacity:.28;animation:s8drift 13s ease-in-out infinite alternate-reverse}
@keyframes s8drift{to{transform:translate(60px,-40px) scale(1.15)}}
.s8-cr>*:not(.s8-amb):not(.s8-blob){position:relative}
.s8-crh{flex:none;width:min(88vw,360px);display:flex;align-items:center;justify-content:space-between;direction:ltr}
.s8-crh b{font-size:18px;font-weight:900;letter-spacing:.2px;text-shadow:0 2px 12px rgba(168,85,247,.6)}
.s8-orb{width:44px;height:44px;border-radius:50%!important;display:grid;place-items:center;background:rgba(255,255,255,.1)!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),0 8px 20px -10px rgba(0,0,0,.8);transition:transform .15s}
.s8-orb svg{width:19px;height:19px}.s8-orb:active{transform:scale(.88)}
.s8-ghost{visibility:hidden}
.s8-crv{position:relative;flex:none;width:min(84vw,330px,calc(100vh - 380px));height:min(84vw,330px,calc(100vh - 380px));border-radius:30px;overflow:hidden;touch-action:none;cursor:grab;transform:scale(.85);opacity:0;transition:transform .6s cubic-bezier(.2,1.3,.3,1),opacity .4s}
.s8-cr.ready .s8-crv{transform:none;opacity:1}
.s8-crb{position:absolute;inset:-30px;background:center/cover no-repeat;filter:blur(18px) brightness(.7);pointer-events:none}
.s8-crv img{position:absolute;left:50%;top:50%;max-width:none;transform-origin:center;user-select:none;-webkit-user-select:none;pointer-events:none}
.s8-crv.s8-turn img{transition:transform .35s cubic-bezier(.2,1.2,.3,1)}
.s8-crd{position:absolute;inset:6%;border-radius:50%;box-shadow:0 0 0 999px rgba(12,7,24,.66);pointer-events:none}
.s8-crg{position:absolute;inset:6%;border-radius:50%;pointer-events:none;opacity:0;transition:opacity .2s;
 background:linear-gradient(transparent 33.1%,rgba(255,255,255,.22) 33.3%,transparent 33.6%,transparent 66.4%,rgba(255,255,255,.22) 66.6%,transparent 66.9%),linear-gradient(90deg,transparent 33.1%,rgba(255,255,255,.22) 33.3%,transparent 33.6%,transparent 66.4%,rgba(255,255,255,.22) 66.6%,transparent 66.9%)}
.s8-crv.s8-drag .s8-crg{opacity:1}
.s8-crs{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;animation:s8spin 14s linear infinite}
.s8-crs circle{fill:none;stroke:url(#s8rg);stroke-width:1.4;stroke-linecap:round;stroke-dasharray:100;stroke-dashoffset:100;filter:drop-shadow(0 0 3px rgba(240,171,252,.9))}
.s8-cr.ready .s8-crs circle{animation:s8draw 1.1s cubic-bezier(.4,0,.2,1) .2s forwards}
@keyframes s8draw{to{stroke-dashoffset:0}}
.s8-cro{position:absolute;inset:6%;border-radius:50%;pointer-events:none}
.s8-cro::before{content:'';position:absolute;top:0;left:50%;width:7px;height:7px;margin:-3.5px;border-radius:50%;background:#fff;box-shadow:0 0 10px 3px rgba(245,201,131,.9),0 0 22px 6px rgba(240,171,252,.6);opacity:0;transition:opacity .4s 1s}
.s8-cr.ready .s8-cro{animation:s8spin 5s linear infinite}.s8-cr.ready .s8-cro::before{opacity:1}
.s8-cr.s8-done .s8-crs circle{stroke-width:3;transition:stroke-width .3s}
.s8-cr.s8-done .s8-crv{animation:s8yes .5s ease}
@keyframes s8yes{40%{transform:scale(1.04)}}
.s8-hint{margin:0;max-width:300px;text-align:center;font-size:12.5px;line-height:1.7;padding:7px 14px;border-radius:14px;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);transition:opacity .4s,transform .4s}
.s8-hint.s8-gone{opacity:0;transform:translateY(-6px)}
.s8-cpv{display:flex;align-items:center;gap:14px;margin-top:-4px;flex:none}
.s8-cpv span{display:block;border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px rgba(255,255,255,.75),0 6px 14px -6px rgba(0,0,0,.8);background:#21153a}
.s8-cpv img{width:100%;height:100%;object-fit:cover;display:block}
.s8-cp1{width:52px;height:52px}.s8-cp2{width:34px;height:34px}
.s8-crz{display:flex;align-items:center;gap:12px;width:min(84vw,330px);direction:ltr}
.s8-crz button{display:grid;place-items:center;opacity:.8}.s8-crz svg{width:22px;height:22px}
.s8-crz input{flex:1;-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;outline:none;
 background:linear-gradient(90deg,#c084fc,#f5c983) 0/var(--p,0%) 100% no-repeat,rgba(255,255,255,.18)}
.s8-crz input::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgba(192,132,252,.35),0 0 16px rgba(245,201,131,.8);cursor:pointer}
.s8-crz input::-moz-range-thumb{width:24px;height:24px;border:0;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgba(192,132,252,.35),0 0 16px rgba(245,201,131,.8)}
.s8-cra{width:min(84vw,330px);display:flex;align-items:center;justify-content:space-between;gap:14px;direction:ltr}
.s8-okb{flex:1;height:54px;border-radius:18px!important;display:flex;align-items:center;justify-content:center;gap:8px;font-size:16px!important;font-weight:900;color:#2a1a0c!important;position:relative;overflow:hidden;
 background:linear-gradient(180deg,#f8d49a,#eab676)!important;box-shadow:0 12px 28px -10px rgba(234,182,118,.85)}
.s8-okb svg{width:20px;height:20px}
.s8-okb::after{content:'';position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.65),transparent);animation:s8shine 3.6s ease-in-out 1.5s infinite}
.s8-okb:active{transform:scale(.97)}
@media (prefers-reduced-motion:reduce){.s8-ed *,.s8-cr *{animation:none!important}}
.s8{padding-top:0!important}.s8>*{flex-shrink:0}
.s8 button,.s8-sh button{border:0;background:none;padding:0;font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.s8 .r-av,.s8-sh .r-av{position:relative;flex:none;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:hsl(var(--h,260) 40% 40%)}.s8 .r-av img,.s8-sh .r-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.s8 .r-av b,.s8-sh .r-av b{font-weight:900}
.s8-sk{background:linear-gradient(90deg,rgba(255,255,255,.05),rgba(255,255,255,.12),rgba(255,255,255,.05));background-size:200% 100%;animation:s8sk 1.2s infinite}
/* hero */
.s8-hero{position:relative;margin:0 -16px;height:356px;overflow:hidden}
.s8-hero.s8-sk{height:356px}
.s8-hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.04);animation:s8kb 18s ease-in-out infinite alternate}
.s8-hs{position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,9,26,.35),transparent 30%,rgba(14,9,26,.55) 62%,rgba(14,9,26,1))}
.s8-hb{position:absolute;z-index:2;top:max(12px,env(safe-area-inset-top));width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:rgba(10,6,20,.35)!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}
.s8-hb svg{width:19px;height:19px}.s8-bk{left:16px}.s8-ed{right:16px}
.s8-id{position:absolute;inset-inline:16px;bottom:8px;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center}
.s8-ph{width:80px;height:80px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 3px rgba(255,255,255,.85),0 18px 30px -12px rgba(0,0,0,.8);margin-bottom:6px;animation:s8pop .5s cubic-bezier(.2,1.3,.3,1) both}
.s8-ph img{width:100%;height:100%;object-fit:cover;display:block}.s8-ph .r-av{width:100%;height:100%}.s8-ph .r-av b{font-size:32px}
.s8-id>b{font-size:26px;font-weight:900;text-shadow:0 2px 10px rgba(0,0,0,.6)}.s8-id>small{font-size:12.5px;opacity:.75}
.s8-own{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:12px;font-weight:800;opacity:.9}.s8-own .r-av{width:20px;height:20px}.s8-own .r-av b{font-size:9px}.s8-own em{font-style:normal;font-weight:700;opacity:.6}
/* quick actions */
.s8-qa{display:flex;justify-content:center;gap:26px;margin:14px 0 6px}
.s8-qa button{display:flex;flex-direction:column;align-items:center;gap:6px;animation:s8in .4s both}
.s8-qa i{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),inset 0 0 0 1px rgba(255,255,255,.1)}.s8-qa i svg{width:21px;height:21px}
.s8-qa span{font-size:11.5px;font-weight:800;opacity:.85}.s8-qa button:active i{transform:scale(.92)}
.s8-ev{width:100%;display:flex;align-items:center;gap:12px;margin-top:14px;padding:12px 14px;border-radius:20px;text-align:start;background:linear-gradient(120deg,rgba(255,255,255,.12),rgba(255,255,255,.04))!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.s8-ev>i{width:22px;height:22px}.s8-ev>i svg{width:22px;height:22px}.s8-ev>span{flex:1;display:flex;flex-direction:column;gap:2px}.s8-ev b{font-size:14.5px;font-weight:900}.s8-ev small{font-size:12px;opacity:.7}.s8-ev em{width:18px;height:18px;opacity:.8}.s8-ev em svg{width:18px;height:18px}
/* control centre */
.s8-cc{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0 calc(28px + env(safe-area-inset-bottom))}
.s8-t{position:relative;min-height:136px;padding:13px 14px 12px!important;border-radius:24px;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:2px;text-align:start;overflow:hidden;
 background:rgba(255,255,255,.06)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 1px rgba(255,255,255,.08);transition:background .25s,color .25s,transform .15s;animation:s8in .4s both;animation-delay:calc(var(--k)*45ms)}
.s8-t:active{transform:scale(.97)}
.s8-ti{position:absolute;top:12px;inset-inline-start:13px;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.1)}.s8-ti svg{width:19px;height:19px}
.s8-tv{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-height:28px}.s8-t.s8-w .s8-tv{flex-direction:row;align-items:center}.s8-tv b{font-size:30px;font-weight:900;line-height:1}.s8-tv b.s8-sm{font-size:16px}.s8-tv small{font-size:11px;opacity:.6;font-weight:700}
.s8-tl{font-size:12px;font-weight:800;opacity:.65}
.s8-t.s8-on{background:#fff!important;color:#14101c}.s8-t.s8-on .s8-ti{background:rgba(20,16,28,.08)}
.s8-t.s8-w{grid-column:1/-1;min-height:76px;flex-direction:row;align-items:center;justify-content:flex-start;gap:12px;padding-inline-start:60px!important}
.s8-t.s8-w .s8-ti{top:50%;transform:translateY(-50%)}.s8-t.s8-w .s8-tl{order:-1;flex:1;font-size:14px;opacity:.95}.s8-t.s8-w .s8-tv{min-height:0}
.s8-lk{position:absolute;inset:0;background:center/cover no-repeat;opacity:.55;mask-image:linear-gradient(180deg,#000 30%,transparent);-webkit-mask-image:linear-gradient(180deg,#000 30%,transparent)}
.s8-t .s8-lk~.s8-ti{z-index:1;background:rgba(10,6,20,.4)}.s8-t .s8-lk~.s8-tl{position:relative}
.s8-st{display:flex}.s8-st>span{margin-inline-start:-8px}.s8-st>span:first-child{margin-inline-start:0}.s8-st .r-av{width:26px;height:26px;box-shadow:0 0 0 2px #1d1430}.s8-st .r-av b{font-size:10px}
.s8-as{display:flex;align-items:center;gap:7px}.s8-as .r-av{width:26px;height:26px}.s8-as .r-av b{font-size:10px}
/* guest info */
.s8-info{display:flex;flex-direction:column;gap:2px;margin:18px 0 30px}.s8-info>div{display:flex;align-items:center;gap:12px;min-height:46px;font-size:14px;font-weight:700}.s8-info>div>i{width:20px;height:20px;opacity:.7}.s8-info>div>i svg{width:20px;height:20px}
.s8-nt{margin:10px 0 0;text-align:center;font-size:12.5px;opacity:.65;line-height:1.7}
/* sheets */
.s8-sh .s6-hd{margin-bottom:12px}.s8-sh .s6-bx{background:linear-gradient(180deg,rgba(24,15,42,.95),rgba(14,9,26,.985))}
.s8-two{display:flex;gap:10px;margin-top:14px}.s8-two .s6-go{flex:1;margin:0}.s6-go.s8-cl{background:rgba(255,255,255,.1)!important;color:#fff!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}.s6-go.s8-del{flex:none;width:52px}
.s8-eh{display:flex;justify-content:center;margin:4px 0 16px}
.s8-pp{position:relative;width:104px;height:104px;border-radius:50%;box-shadow:0 0 0 3px rgba(255,255,255,.85),0 16px 30px -12px rgba(0,0,0,.8)}
.s8-pp>img,.s8-pp>.r-av{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}.s8-pp>.r-av b{font-size:36px}
.s8-pp>i{position:absolute;bottom:0;inset-inline-end:0;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#14101c;box-shadow:0 6px 14px -4px rgba(0,0,0,.6)}.s8-pp>i svg{width:17px;height:17px}
.s8-in{display:flex;align-items:center;gap:10px;height:52px;padding:0 16px;border-radius:17px;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
.s8-in input{flex:1;min-width:0;border:0;outline:0;background:none;color:#fff;font:inherit;font-size:16px;font-weight:800}.s8-in input::placeholder{color:rgba(255,255,255,.4)}.s8-in svg{width:17px;height:17px;opacity:.5;flex:none}
.s8-in input:focus{outline:none!important;box-shadow:none!important}
.s8-big{display:flex;align-items:center;justify-content:center;gap:26px;margin:4px 0 12px}.s8-big b{min-width:90px;text-align:center;font-size:58px;font-weight:900;line-height:1}
.s8-big button,.s8-stp button{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.1)!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}.s8-big button svg,.s8-stp button svg{width:20px;height:20px}
.s8-big button:disabled,.s8-stp button:disabled{opacity:.3}
.s8-sc{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.s8-sc button{height:40px;border-radius:14px;font-size:15px!important;font-weight:900!important;opacity:.7;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.s8-sc button.on{opacity:1;background:#fff!important;color:#14101c!important;box-shadow:none}.s8-sc button:disabled{opacity:.25}
.s8-row{display:flex;align-items:center;gap:12px;min-height:60px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}.s8-row>i{width:20px;height:20px;opacity:.75}.s8-row>i svg{width:20px;height:20px}.s8-row>span{flex:1;font-size:14.5px;font-weight:800}
.s8-stp{display:flex;align-items:center;gap:12px}.s8-stp b{min-width:28px;text-align:center;font-size:20px;font-weight:900}.s8-stp button{width:38px;height:38px}
.s8-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.s8-seg button{display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 4px!important;border-radius:20px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);opacity:.75;transition:all .2s}
.s8-seg button i svg{width:22px;height:22px}.s8-seg button span{font-size:12.5px;font-weight:800}.s8-seg button.on{opacity:1;background:#fff!important;color:#14101c!important;box-shadow:none}
.s8-sw{width:100%;display:flex;align-items:center;gap:12px;min-height:64px;margin-top:14px;text-align:start}.s8-sw>i{width:20px;height:20px;opacity:.75}.s8-sw>i svg{width:20px;height:20px}
.s8-sw>span{flex:1;display:flex;flex-direction:column;gap:2px}.s8-sw b{font-size:14.5px;font-weight:800}.s8-sw small{font-size:11.5px;opacity:.6}
.s8-tg{flex:none;position:relative;width:50px;height:30px;border-radius:15px;background:rgba(255,255,255,.16);transition:background .25s}.s8-tg i{position:absolute;top:3px;inset-inline-start:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.4);transition:transform .25s cubic-bezier(.2,1.2,.3,1)}
.s8-sw.on .s8-tg{background:#fff!important}.s8-sw.on .s8-tg i{background:#14101c!important;transform:translateX(20px)}.s8-sh[dir=rtl] .s8-sw.on .s8-tg i{transform:translateX(-20px)}
.s8-days{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:14px -16px 0;padding:2px 16px}.s8-days::-webkit-scrollbar{display:none}
.s8-days button{flex:none;width:62px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 0!important;border-radius:18px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);opacity:.75;transition:all .2s}
.s8-days button b{font-size:20px;font-weight:900}.s8-days button small{font-size:10.5px;font-weight:700;opacity:.75}.s8-days button.on{opacity:1;background:#fff!important;color:#14101c!important;box-shadow:none}
.s8-tm{height:40px;padding:0 14px;border-radius:13px;border:0;outline:0;color:#fff;font:inherit;font-size:17px;font-weight:900;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16);direction:ltr;color-scheme:dark}
.s8-rl{display:flex;flex-direction:column;gap:2px}.s8-rl button{display:flex;align-items:center;gap:12px;min-height:50px;font-size:14.5px;font-weight:800;text-align:start}
.s8-rd{width:22px;height:22px;border-radius:50%;box-shadow:inset 0 0 0 1.6px rgba(255,255,255,.45);transition:all .2s}.s8-rl button.on .s8-rd{box-shadow:inset 0 0 0 7px #fff}
/* look page */
.s8-lp{padding-bottom:calc(96px + env(safe-area-inset-bottom))}.s8-lp .r-pgb svg,.s8-mp .r-pgb svg{transform:none!important}
.s8-pv{position:relative;aspect-ratio:3/4;max-height:52vh;width:100%;border-radius:26px;overflow:hidden;box-shadow:0 24px 40px -22px rgba(0,0,0,.9),inset 0 0 0 1px rgba(255,255,255,.12)}
.s8-pv>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.s8-pv>i{position:absolute;inset:0;background:#0a0614;transition:opacity .15s}
.s8-pseats{position:absolute;top:18%;inset-inline:10%;display:grid;grid-template-columns:repeat(4,1fr);gap:12px 14px}.s8-pseats span{aspect-ratio:1;border-radius:50%;border:1.5px solid rgba(255,255,255,.42);background:rgba(8,6,24,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.3);position:relative}.s8-pseats span:after{content:'+';position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,255,255,.8);font-size:15px;font-weight:300}
.s8-pm{position:absolute;inset-inline:14px;bottom:16px;display:flex;flex-direction:column;gap:9px}.s8-pm>div{display:flex;align-items:center;gap:9px}.s8-pm .r-av{width:30px;height:30px}
.s8-pm span{display:flex;flex-direction:column;gap:1px;text-shadow:0 1px 3px rgba(0,0,0,.7)}.s8-pm b{font-size:11.5px;font-weight:900}.s8-pm em{font-style:normal;font-size:13.5px;font-weight:700}
.s8-pl{position:absolute;top:12px;inset-inline-start:12px;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;background:rgba(10,6,20,.45);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
.s8-xwrap{margin-top:14px;padding-bottom:calc(24px + env(safe-area-inset-bottom))}
.slr-pg.s8-mp{background:rgba(12,8,24,.97)!important}.s8-xc{border-radius:26px;border:1.5px solid rgba(255,255,255,.18);background:rgba(24,18,46,.9);padding:14px 12px 8px}
.s8-xh{display:flex;align-items:center;justify-content:space-between;padding:0 4px 8px}.s8-xh b{font-size:16px;font-weight:900}.s8-xh span{font-size:13px;font-weight:800;opacity:.75;direction:ltr}
.s8-xhid{display:flex;align-items:center;gap:6px;color:#ffd66b;font-size:13px;font-weight:800;margin:0 4px 10px}.s8-xhid svg{width:17px;height:17px}
.s8-xrq{width:100%;display:flex;align-items:center;gap:10px;height:56px;padding:0 10px;border-radius:20px;border:1.5px solid rgba(255,255,255,.2);background:rgba(255,255,255,.03);color:#fff;font:inherit;margin-bottom:10px}
.s8-xrq>i{width:38px;height:38px;border-radius:50%;border:1.5px solid rgba(255,255,255,.35);display:grid;place-items:center;flex:none}.s8-xrq>i svg{width:18px;height:18px}
.s8-xrq>span{flex:1;text-align:start;font-size:14.5px;font-weight:900}.s8-xrq>em{font-style:normal;min-width:26px;height:26px;border-radius:13px;background:#9ff5d2;color:#0b2a20;font-size:13px;font-weight:900;display:grid;place-items:center;padding:0 6px}
.s8-xrq>b{width:18px;height:18px;opacity:.7}.s8-xrq>b svg{width:18px;height:18px}
.s8-xs{display:flex;align-items:center;gap:10px;height:46px;padding:0 14px;border-radius:23px;border:1.5px solid rgba(255,255,255,.22);margin-bottom:6px}.s8-xs svg{width:18px;height:18px;opacity:.7;flex:none}
.s8-xs input{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font:inherit;font-size:14.5px}.s8-xs input::placeholder{color:rgba(255,255,255,.5)}
.s8-xl{display:flex;flex-direction:column}
.s8-xr{display:flex;align-items:center;gap:12px;padding:10px 4px;border:0;border-bottom:1px solid rgba(255,255,255,.08);background:none;color:#fff;font:inherit;text-align:start;width:100%}
.s8-xa{position:relative;flex:none}.s8-xa .r-av{width:48px!important;height:48px!important}
.s8-xon{position:absolute;bottom:1px;inset-inline-start:1px;width:12px;height:12px;border-radius:50%;background:#3EE08F;border:2px solid #120c24}
.s8-xt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.s8-xt b{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:900;white-space:nowrap;overflow:hidden}
.s8-xt small{font-size:12px;opacity:.65}.s8-xn{display:grid;color:#9ff5d2}.s8-xn svg{width:15px;height:15px}
.s8-xb{font-style:normal;font-size:12px;font-weight:900;padding:3px 12px;border-radius:999px;flex:none}.s8-xbo{color:#ffd66b;border:1.5px solid rgba(255,214,107,.7)}.s8-xba{color:#9ff5d2;border:1.5px solid rgba(159,245,210,.7)}
.s8-xsub{font-size:12.5px;font-weight:800;opacity:.6;padding:12px 4px 2px}
.s8-xhd{display:flex;flex-direction:column;align-items:center;gap:8px;margin:12px 4px 6px;padding:18px;border-radius:20px;border:1.5px dashed rgba(255,255,255,.25);font-size:13px;opacity:.85;text-align:center}.s8-xhd svg{width:22px;height:22px;color:#ffd66b}
.s8-xmb{padding-bottom:calc(14px + env(safe-area-inset-bottom))}
.s8-xmh{display:flex;align-items:center;gap:12px;padding:4px 4px 12px;border-bottom:1px solid rgba(255,255,255,.1)}.s8-xmh .r-av{width:52px!important;height:52px!important}.s8-xmh b{display:block;font-size:17px;font-weight:900}.s8-xmh small{font-size:12.5px;opacity:.65}
.s8-xmh2 b{font-size:16px}
.s8-xmr{width:100%;display:flex;align-items:center;gap:14px;padding:10px 4px;border:0;border-bottom:1px solid rgba(255,255,255,.08);background:none;color:#fff;font:inherit;font-size:15px;font-weight:800;text-align:start}
.s8-xmr>i{width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(255,255,255,.35);display:grid;place-items:center;flex:none}.s8-xmr>i svg{width:20px;height:20px}
.s8-xmr>span{flex:1}.s8-xmr>small{font-size:12px;opacity:.6}.s8-xmr[disabled]{opacity:.45}
.s8-xmr.s8-xd{color:#ff8b99}.s8-xmr.s8-xd>i{border-color:rgba(255,139,153,.6)}
.s8-xmr.s8-xsel>i{border-color:#9ff5d2;color:#9ff5d2}.s8-xck{width:22px;height:22px;color:#9ff5d2}.s8-xck svg{width:22px;height:22px}
.s8-xqr{display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,.08)}.s8-xqr>span{flex:1;font-weight:800}
.s8-xqr button{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;padding:0}.s8-xqr button svg{width:18px;height:18px}
.s8-xqy{background:#fff!important;color:#14101c!important;border:0}.s8-xqn{background:transparent!important;color:#fff!important;border:1.5px solid rgba(255,255,255,.35)!important}
.s8-ph{position:relative;z-index:3}.s8-ph:has(.s8-xjoin){overflow:visible}.s8-ph>img{border-radius:50%}.s8-xjoin{pointer-events:auto;position:absolute;bottom:-4px;inset-inline-end:-4px;width:30px!important;height:30px!important;border-radius:50%!important;background:#fff!important;color:#14101c!important;border:2px solid rgba(20,16,28,.6)!important;display:grid;place-items:center;padding:0;box-shadow:0 4px 12px rgba(0,0,0,.5);z-index:3}.s8-xjoin svg{width:16px;height:16px}
.s8-ppos{position:absolute;top:10px;inset-inline-end:10px;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;border:1.5px solid rgba(255,255,255,.45);background:rgba(10,6,20,.35);color:#fff;padding:0}.s8-ppos svg{width:19px;height:19px}
.s8-bp{position:fixed;inset:0;z-index:2147480010;display:flex;flex-direction:column;align-items:center;padding:max(12px,env(safe-area-inset-top)) 16px calc(18px + env(safe-area-inset-bottom));background:#0b0a1c;color:#fff;opacity:0;transition:opacity .25s;overflow:hidden;touch-action:none}
.s8-bp.in{opacity:1}
.s8-bpa{position:absolute;inset:-40px;background:center/cover;filter:blur(30px) brightness(.35);pointer-events:none}
.s8-bph{position:relative;width:100%;display:flex;align-items:center;gap:12px;padding:4px 0;direction:ltr}.s8-bph b{flex:1;text-align:center;font-size:18px;font-weight:900}
.s8-bph .s8-orb{width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(255,255,255,.35);background:transparent;color:#fff;display:grid;place-items:center;padding:0}.s8-bph .s8-orb svg{width:20px;height:20px}
.s8-bpf{position:relative;margin-top:14px;border-radius:34px;overflow:hidden;border:2px solid rgba(255,255,255,.85);box-shadow:0 0 0 4000px rgba(5,4,18,.55),0 20px 50px rgba(0,0,0,.6);touch-action:none;flex:none}
.s8-bpf img{position:absolute;left:0;top:0;max-width:none;transform-origin:0 0;user-select:none;-webkit-user-select:none;pointer-events:none}
.s8-bpg{position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.18),rgba(255,255,255,.18)) 33.3% 0/1px 100% no-repeat,linear-gradient(rgba(255,255,255,.18),rgba(255,255,255,.18)) 66.6% 0/1px 100% no-repeat,linear-gradient(rgba(255,255,255,.18),rgba(255,255,255,.18)) 0 33.3%/100% 1px no-repeat,linear-gradient(rgba(255,255,255,.18),rgba(255,255,255,.18)) 0 66.6%/100% 1px no-repeat}
.s8-bpgh{position:absolute;inset:0;pointer-events:none}
.s8-bpgt{position:absolute;top:4%;left:5%;right:5%;height:5%;display:flex;gap:4%;direction:ltr}.s8-bpgt i{aspect-ratio:1;height:100%;border-radius:28%;border:1px solid rgba(255,255,255,.45)}.s8-bpgt em{flex:1}.s8-bpgt u{aspect-ratio:1;height:100%;border-radius:50%;border:1px solid rgba(255,255,255,.6)}
.s8-bpgs{position:absolute;top:15%;left:8%;right:8%;display:grid;grid-template-columns:repeat(4,1fr);gap:4%}.s8-bpgs i{aspect-ratio:1;border-radius:50%;border:1px solid rgba(255,255,255,.55);background:rgba(8,6,24,.22)}
.s8-bpgc{position:absolute;bottom:3%;left:4%;right:4%;height:6%;display:flex;gap:3%;direction:ltr}.s8-bpgc i{aspect-ratio:1;height:100%;border-radius:50%;border:1px solid rgba(255,255,255,.45)}.s8-bpgc em{flex:1;border-radius:99px;border:1px solid rgba(255,255,255,.45)}
.s8-bpt{position:relative;text-align:center;font-size:13px;color:rgba(255,255,255,.75);margin-top:14px;font-weight:700}
.s8-bpz{position:relative;width:100%;display:flex;align-items:center;gap:12px;padding:10px 18px 0;direction:ltr}.s8-bpz button{background:none;border:0;color:#fff;padding:0;display:grid}.s8-bpz svg{width:22px;height:22px}.s8-bpz input{flex:1;accent-color:#fff}
.s8-bpb{position:relative;margin-top:auto;width:100%;display:flex}.s8-bpb .s8-okb{flex:1;height:54px;border-radius:27px;border:0;background:#fff!important;color:#14101c!important;box-shadow:none!important;animation:none!important;display:flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-weight:900;font-size:16px}.s8-bpb .s8-okb svg{width:20px;height:20px}.s8-bpb .s8-okb:before,.s8-bpb .s8-okb:after{display:none!important}
.s8-bgs{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin:16px -16px 0;padding:2px 16px}.s8-bgs::-webkit-scrollbar{display:none}
.s8-bg,.s8-bga{flex:none;position:relative;width:74px;height:98px;border-radius:18px;background:center/cover no-repeat;transition:box-shadow .2s,transform .2s}.s8-bg.on{box-shadow:0 0 0 2.5px #fff;transform:translateY(-2px)}
.s8-bg>i{position:absolute;inset:auto 6px 6px auto;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#14101c}.s8-bg>i svg{width:14px;height:14px}
.s8-bga{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.25);font-size:10.5px;font-weight:800}.s8-bga svg{width:20px;height:20px}
.s8-dim{display:flex;align-items:center;gap:14px;margin-top:18px;font-size:13px;font-weight:800}.s8-dim span{flex:none;opacity:.8}
.s8-dim input{flex:1;-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:rgba(255,255,255,.2);outline:0}.s8-dim input::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.5)}
.s8-lf{position:fixed;inset-inline:0;bottom:0;padding:12px 16px calc(14px + env(safe-area-inset-bottom));background:linear-gradient(180deg,transparent,rgba(14,9,26,.92) 40%)}.s8-lf .s6-go{margin:0}
/* members */
.s8-mp{padding-bottom:30px}
.s8-asr{display:flex;align-items:center;gap:12px;padding:14px;border-radius:22px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.s8-asr .s8-ti{position:static;flex:none}.s8-asr>span{flex:1;display:flex;flex-direction:column;gap:2px}.s8-asr b{font-size:14.5px;font-weight:900}.s8-asr small{font-size:11.5px;opacity:.6}
.s8-asa{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:800}.s8-asa .r-av{width:28px;height:28px}.s8-dim2{font-size:12px;opacity:.55}
.s8-h{margin:22px 2px 6px;font-size:15px;font-weight:900}
.s8-ml{display:flex;flex-direction:column;gap:2px}
.s8-m{display:flex;align-items:center;gap:12px;min-height:60px;animation:s8in .35s both;animation-delay:calc(var(--k)*35ms)}.s8-m>.r-av{width:44px;height:44px}.s8-m>.r-av b{font-size:17px}
.s8-m>span{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.s8-m b{font-size:14.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.s8-m small{font-size:11.5px;opacity:.6}
.s8-badge{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#14101c}.s8-badge svg{width:15px;height:15px}
.s8-mb{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;opacity:.8}.s8-mb svg{width:20px;height:20px}.s8-mb:active{background:rgba(255,255,255,.1)!important}
.s8-ub{height:34px;padding:0 14px!important;border-radius:999px;font-size:12.5px!important;font-weight:800!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}
.s8-mh{display:flex;align-items:center;gap:12px;margin-bottom:16px}.s8-mh>.r-av{width:52px;height:52px;box-shadow:0 0 0 2px rgba(255,255,255,.8)}.s8-mh>.r-av b{font-size:20px}.s8-mh>span{flex:1;display:flex;flex-direction:column;gap:2px}.s8-mh b{font-size:18px;font-weight:900}.s8-mh small{font-size:12px;opacity:.65}
.s8-mt{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:8px}
.s8-mtb{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 4px!important;border-radius:20px;background:rgba(255,255,255,.07)!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);animation:s8in .3s both;animation-delay:calc(var(--k)*40ms)}
.s8-mtb i svg{width:22px;height:22px}.s8-mtb span{font-size:11.5px;font-weight:800;line-height:1.35;text-align:center}.s8-mtb.s8-on{background:#fff!important;color:#14101c}.s8-mtb.s8-dg{color:#FFB3C0}
@keyframes s8in{from{opacity:0;transform:translateY(8px)}}@keyframes s8pop{from{opacity:0;transform:scale(.7)}}@keyframes s8sk{to{background-position:-200% 0}}@keyframes s8kb{to{transform:scale(1.12) translateY(-8px)}}
html.wk-rm .s8 *,html.wk-rm .s8-sh *{animation:none!important}`;
(function(){if(document.getElementById('slr8-css'))return;const s=document.createElement('style');s.id='slr8-css';s.textContent=css;document.head.appendChild(s)})();
window.SLR3_PAGES=window.SLR3_PAGES||{};window.SLR3_PAGES.salon=()=>open();
window.SLR8={open};
})();
