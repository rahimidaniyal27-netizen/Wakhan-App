/* WAKHAN 2.0 — «سالون» › inside the salon (part 3): header, the screen, the royal seats and the bottom bar.
   It runs on the salon engine the app already has: /api/c/<code> (seats, playback), /api/v51/hall (locks, owner tools),
   /api/v70/hall (salon messages) and the voice room. Nothing on the server is rewritten. */
(()=>{
const T={
fa:{seatsOf:'{n} از {m} جایگاه',exit:'خروج',invite:'دعوت',chats:'گپ‌ها',pick:'انتخاب فلم یا آهنگ',notice:'اعلان سالون',write:'پیام بنویسید',send:'فرستادن',
 micOn:'مایک روشن',micOff:'مایک خاموش',spkOn:'صدای سالون روشن',spkOff:'صدای سالون خاموش',tools:'ابزارها',locked:'این جایگاه قفل است',taken:'این جایگاه همین حالا پر شد',
 denied:'شما اجازهٔ نشستن ندارید',offline:'ارتباط قطع شد، دوباره امتحان کنید',lockSeat:'قفل‌کردن جایگاه',unlockSeat:'بازکردن قفل جایگاه',sitHere:'نشستن اینجا',
 mySeat:'جایگاه من',seatN:'جایگاه {n}',change:'تغییر جایگاه',leaveSeat:'ترک جایگاه',pickSeat:'یک جایگاه خالی را لمس کنید',cancel:'لغو',
 plate:'ردیف {r} · صندلی {s}',giftsRx:'هدیه‌های دریافتی',mPm:'بی‌صدا برای من',mMic:'بستن مایک',mChat:'بستن کامنت',mRep:'گزارش و مسدودکردن',giftsN:'{n} هدیه',noGifts:'هنوز هدیه‌ای دریافت نکرده',sendGift:'ارسال هدیه',dm:'پیام خصوصی',follow:'دنبال‌کردن',friend:'رفیق',reqSent:'درخواست فرستاده شد',acceptReq:'پذیرفتن',more:'گزینه‌ها',pMuteOn:'صدای این شخص برای شما قطع است',pMute:'صدای این شخص را فقط برای خودم قطع کن',ownMic:'مایک این شخص در سالون',ownChat:'گپ این شخص در سالون',noTalk:'شما اجازه صحبت کردن ندارید',chatClosed:'ارسال پیام بسته است',giftSeat:'برای هدیه دادن، باید روی صندلی باشد',ppl:'{n} از {m} نفر',atDoor:'{n} پشت دروازه است',moreDoor:'و {n} نفر دیگر',see:'دیدن',reqTitle:'درخواست ورود',atDoorS:'پشت دروازه',limitHit:'سالون به حد ورود رسیده است.',limitHitD:'برای پذیرش {n}، حد ورود را یک نفر بالا ببر.',capNow:'ظرفیت فعلی {n} نفر',capNew:'ظرفیت تازه {n} نفر',raiseAdmit:'افزایش به {n} نفر و پذیرش',admit:'پذیرش',reject:'رد درخواست',fullAll:'پذیرش پس از خالی‌شدن یک جا',welcome:'درخواستت پذیرفته شد',welcomeD:'وارد {n} شدی.',admitted:'{n} وارد سالون شد',rejected:'درخواست {n} رد شد',expiredReq:'این درخواست دیگر معتبر نیست',invT:'دعوت دوستان',invFind:'نام دوست',invLink:'پیوند دعوت',invLinkD:'ویژهٔ همین سالون',copy:'کپی',copied:'کپی شد',code:'کد سالون',friends:'دوستان',invite2:'دعوت',invited:'دعوت شد',online:'آنلاین',offline2:'آفلاین',noFriends:'هنوز دوستی برای دعوت نداری',noMatch:'دوستی با این نام پیدا نشد',share:'فرستادن پیوند',tLift:'برداشتن',tKick:'بیرون‌کردن',tBan:'مسدودکردن',kick:'بیرون‌کردن از سالون',ban:'مسدودکردن از سالون',fullProfile:'پروفایل کامل',holdHint:'برای انجام، نگه دارید',kicked:'{n} از سالون بیرون شد',banned:'{n} از سالون مسدود شد',unseated:'{n} از جایگاه برداشته شد',youKicked:'صاحب سالون شما را از سالون بیرون کرد',seatNo:'جایگاه {n}',standing:'تماشاگر',b15:'15 ثانیه عقب',f15:'15 ثانیه جلو',zoom:'زوم',fsx:'خروج از تمام صفحه',talking:'صحبت می‌کند',fchat:'نوشتن پیام',myProfile:'پروفایل من',tapToMove:'برای عوض کردن جا، کافی است روی یک صندلی خالی بزنید.',leaveD:'از صندلی بلند می‌شوید ولی در سالون می‌مانید و فلم را می‌بینید.',aud:'تماشاگران',you:'شما',audEmpty:'همه نشسته‌اند',standHint:'برای نشستن، روی یک صندلی خالی بزنید',profile:'پروفایل',unseat:'برداشتن از جایگاه',unseatQ:'{n} را از جایگاه برداریم؟',unseatD:'صندلی آزاد می‌شود و {n} در سالون می‌ماند.',
 minimize:'کوچک‌کردن سالون',leave:'ترک سالون',soon:'این بخش به‌زودی',seatEmpty:'جایگاه خالی',seatLocked:'جایگاه قفل',seatOf:'جایگاه {n}',
 play:'پخش',pause:'توقف',vol:'صدای فلم',fs:'تمام صفحه',seek:'جای پخش',left:'جایگاه را ترک کردید',moved:'جایگاه عوض شد',sitFirst:'برای گپ‌زدن روی یک جایگاه بنشینید',owner:'صاحب سالون',chatSub:'برای نوشتن در چت سالون اشتراک لازم است',chatSlow:'کمی آرام‌تر؛ چند ثانیه بعد دوباره بفرست',chatErr:'پیام فرستاده نشد',scrClose:'بستن پرده',scrClosed:'پرده بسته شد',scrArm:'برای بستن پرده، یک بار دیگر بزنید',ytTap:'برای شروع یوتیوب، یک بار روی فلم بزنید',ytErr:'این ویدیو در سالون پخش نمی‌شود',retry:'دوباره'},
en:{seatsOf:'{n} of {m} seats',exit:'Exit',invite:'Invite',chats:'Chats',pick:'Choose a film or song',notice:'Salon notice',write:'Write a message',send:'Send',
 micOn:'Mic on',micOff:'Mic off',spkOn:'Salon sound on',spkOff:'Salon sound off',tools:'Tools',locked:'This seat is locked',taken:'Someone just took this seat',
 denied:'You are not allowed to sit',offline:'Connection lost, try again',lockSeat:'Lock seat',unlockSeat:'Unlock seat',sitHere:'Sit here',
 mySeat:'My seat',seatN:'Seat {n}',change:'Change seat',leaveSeat:'Leave seat',pickSeat:'Tap an empty seat',cancel:'Cancel',
 plate:'Row {r} · Seat {s}',giftsRx:'Gifts received',mPm:'Mute for me',mMic:'Close mic',mChat:'Close comments',mRep:'Report and block',giftsN:'{n} gifts',noGifts:'No gifts received yet',sendGift:'Send gift',dm:'Message',follow:'Follow',friend:'Friend',reqSent:'Request sent',acceptReq:'Accept',more:'Options',pMuteOn:'This person is muted for you',pMute:'Mute this person just for me',ownMic:'This person\'s mic in the salon',ownChat:'This person\'s chat in the salon',noTalk:'You are not allowed to talk',chatClosed:'Sending messages is closed',giftSeat:'They need to be on a seat to receive a gift',ppl:'{n} of {m} people',atDoor:'{n} is at the door',moreDoor:'and {n} more',see:'See',reqTitle:'Request to enter',atDoorS:'At the door',limitHit:'The salon reached its entry limit.',limitHitD:'To let {n} in, raise the limit by one.',capNow:'Now {n} people',capNew:'New {n} people',raiseAdmit:'Raise to {n} and let in',admit:'Let in',reject:'Decline',fullAll:'Let in when a place is free',welcome:'Your request was accepted',welcomeD:'You are in {n}.',admitted:'{n} came in',rejected:'{n} was declined',expiredReq:'This request is no longer valid',invT:'Invite friends',invFind:'Friend\'s name',invLink:'Invite link',invLinkD:'Only for this salon',copy:'Copy',copied:'Copied',code:'Salon code',friends:'Friends',invite2:'Invite',invited:'Invited',online:'Online',offline2:'Offline',noFriends:'No friends to invite yet',noMatch:'No friend with this name',share:'Send the link',tLift:'Off seat',tKick:'Remove',tBan:'Ban',kick:'Remove from salon',ban:'Ban from salon',fullProfile:'Full profile',holdHint:'Hold to do it',kicked:'{n} was removed from the salon',banned:'{n} was banned from the salon',unseated:'{n} was taken off the seat',youKicked:'The owner removed you from the salon',seatNo:'Seat {n}',standing:'Watching',b15:'Back 15 seconds',f15:'Forward 15 seconds',zoom:'Zoom',fsx:'Exit full screen',talking:'is talking',fchat:'Write a message',myProfile:'My profile',tapToMove:'To move, just tap an empty seat.',leaveD:'You stand up but stay in the salon and keep watching.',aud:'Audience',you:'You',audEmpty:'Everyone is seated',standHint:'Tap an empty seat to sit',profile:'Profile',unseat:'Remove from seat',unseatQ:'Remove {n} from the seat?',unseatD:'The seat becomes free and {n} stays in the salon.',
 minimize:'Minimize salon',leave:'Leave salon',soon:'Coming soon',seatEmpty:'Empty seat',seatLocked:'Locked seat',seatOf:'Seat of {n}',
 play:'Play',pause:'Pause',vol:'Film sound',fs:'Full screen',seek:'Position',left:'You left the seat',moved:'Seat changed',sitFirst:'Sit on a seat to chat',owner:'Salon owner',chatSub:'Writing in the salon chat needs a subscription',chatSlow:'A little slower; send again in a few seconds',chatErr:'The message was not sent',scrClose:'Close the screen',scrClosed:'The screen was closed',scrArm:'Tap again to close the screen',ytTap:'Tap the film once to start YouTube',ytErr:'This video can’t play in the salon',retry:'Try again'}};
const L=()=>{let l='en';try{l=((window.WK2L&&WK2L())||'en').slice(0,2)}catch(e){}return l};
const RTL=()=>['fa','ps','ar','ur'].includes(L());
const tx=(k,v)=>{let s=(window.WK2P&&WK2P('slr3',k))??(T[L()]||T.en)[k]??T.en[k]??k;if(v)for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n||0).toLocaleString('en-US');
const hap=()=>{try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}};
const me=()=>{try{return Number(ME.me.id)||0}catch(e){return 0}};const myName=()=>{try{return ME.me.name||''}catch(e){return ''}};
const cs=()=>{try{return typeof CS!=='undefined'?CS:null}catch(e){return null}};
const cid=()=>{try{return typeof CID!=='undefined'?CID:null}catch(e){return null}};
/* draw into the app's page cache (WakhanPages) like the cinema list does; writing #view directly would wipe the cached tabs */
const host=()=>{try{if(window.WakhanPages&&WakhanPages.view)return WakhanPages.view()}catch(e){}return document.getElementById('view')};
const mmss=s=>{s=Math.max(0,Math.round(s||0));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')};
const I={
 flag:'<path d="M5.5 21V4.5"/><path d="M5.5 4.5h11l-2 4 2 4h-11"/>',
 armchair:'<path d="M6.5 11V7.5A2.5 2.5 0 0 1 9 5h6a2.5 2.5 0 0 1 2.5 2.5V11"/><path d="M4.5 11.5a1.5 1.5 0 0 1 3 0V14h9v-2.5a1.5 1.5 0 0 1 3 0V17a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1zM7 18v1.5M17 18v1.5"/>',
 exit:'<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
 invite:'<circle cx="9.5" cy="8" r="3.5"/><path d="M3 19.5c.8-3.3 3.4-5.2 6.5-5.2s5.7 1.9 6.5 5.2M18.5 8v6M15.5 11h6"/>',
 chat:'<path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4.5 19.5l1.4-4A7.5 7.5 0 1 1 20 11.5z"/><circle cx="9" cy="11.6" r=".6" fill="currentColor"/><circle cx="12.5" cy="11.6" r=".6" fill="currentColor"/><circle cx="16" cy="11.6" r=".6" fill="currentColor"/>',
 chev:'<path d="m15 6-6 6 6 6"/>',film:'<rect x="3.5" y="5" width="17" height="12" rx="2.5"/><path d="M8.5 20h7M12 17v3"/>',bell:'<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
 mic:'<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',micx:'<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5M4 4l16 16"/>',
 spk:'<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',spkx:'<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
 grid:'<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
 send:'<path d="M20.5 3.5 3.5 10.6l7 2.4 2.4 7z"/><path d="m10.5 13 10-9.5"/>',lock:'<rect x="5.5" y="10.5" width="13" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
 unlock:'<rect x="5.5" y="10.5" width="13" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 6.8-1.2"/>',swap:'<path d="M7 7h12l-3.5-3.5M17 17H5l3.5 3.5"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',scrx:'<rect x="3" y="4.5" width="18" height="12.5" rx="2.5"/><path d="M8.5 20.5h7M10 8.6l4 4M14 8.6l-4 4"/>',chatx:'<path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4.5 19.5l1.4-4A7.5 7.5 0 1 1 20 11.5z"/><path d="M4 4l16 16"/>',gift:'<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M3 9h18M12 9v11M12 9c-1.6-3.6-6.4-4-6.4-1.3C5.6 9.4 9.4 9 12 9zM12 9c1.6-3.6 6.4-4 6.4-1.3 0 1.7-3.8 1.3-6.4 1.3z"/>',more:'<circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/>',useradd:'<circle cx="9.5" cy="8" r="3.5"/><path d="M3 19.5c.8-3.3 3.4-5.2 6.5-5.2s5.7 1.9 6.5 5.2M18.5 8v6M15.5 11h6"/>',link:'<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',bellk:'<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',back:'<path d="m9 6 6 6-6 6"/>',copy:'<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',door:'<path d="M13 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H13"/><path d="M13 4.2l5 1.3v13l-5 1.3z"/><path d="M15.2 12h.01"/><path d="M2.5 12h5M5 9.5 7.5 12 5 14.5" transform="translate(-0.5 0)"/>',ban:'<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',lock2:'<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/><path d="M12 14.6v2"/>',unlock2:'<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 6.6-1.6"/><path d="M12 14.6v2"/>',card:'<rect x="3.5" y="5" width="17" height="14" rx="3"/><circle cx="9.5" cy="11" r="2.2"/><path d="M6.3 16c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M14.5 10h3M14.5 13h2"/>',lift:'<path d="M6 13V10a2.5 2.5 0 0 1 2.5-2.5"/><path d="M18 13V10a2.5 2.5 0 0 0-2.5-2.5"/><path d="M4.5 13h15a1.5 1.5 0 0 1 1.5 1.5V17H3v-2.5A1.5 1.5 0 0 1 4.5 13zM5.5 17v2.5M18.5 17v2.5"/><path d="M12 10.5V2.8M9.4 5.3 12 2.8l2.6 2.5"/>',sit:'<path d="M6.5 12V8a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v4"/><path d="M4.8 11.5a1.8 1.8 0 0 1 1.8 1.8V14h10.8v-.7a1.8 1.8 0 1 1 3.6 0V17a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 17v-3.7a1.8 1.8 0 0 1 1.8-1.8zM6 18.5V20M18 18.5V20"/>',stand:'<circle cx="12" cy="5" r="2.2"/><path d="M12 8.5v6.5M8.5 21l3.5-6 3.5 6M7.5 12h9"/><path d="M19 4.5l2 2-2 2"/>',eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',play:'<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
 pause:'<rect x="6.5" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
 vol:'<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6"/>',volx:'<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
 fs:'<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/>',
 fsx:'<path d="M9 4v3.5A1.5 1.5 0 0 1 7.5 9H4M20 9h-3.5A1.5 1.5 0 0 1 15 7.5V4M15 20v-3.5a1.5 1.5 0 0 1 1.5-1.5H20M4 15h3.5A1.5 1.5 0 0 1 9 16.5V20"/>',
 b15:'<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"/><path d="M4.5 4.5V9H9"/><text x="12.3" y="15.2" font-size="6.6" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui">15</text>',f15:'<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9"/><path d="M19.5 4.5V9H15"/><text x="11.7" y="15.2" font-size="6.6" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui">15</text>',zin:'<path d="M8 3.5H4.5A1 1 0 0 0 3.5 4.5V8M16 3.5h3.5a1 1 0 0 1 1 1V8M20.5 16v3.5a1 1 0 0 1-1 1H16M8 20.5H4.5a1 1 0 0 1-1-1V16"/><rect x="7.5" y="8" width="9" height="8" rx="1.5"/>',zout:'<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M9 9.5 7 12l2 2.5M15 9.5l2 2.5-2 2.5"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20c1-3.8 4-6 7.5-6s6.5 2.2 7.5 6"/>',minus:'<rect x="4" y="13" width="16" height="6" rx="2"/><path d="M8 9.5h8"/>'};
const sv=(k,w)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;

/* the royal red armchair (2D, drawn here so it stays sharp on every phone) */
const CHAIR=`<svg class="r-ch" viewBox="0 0 100 92" aria-hidden="true"><defs>
 <linearGradient id="slrB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C42A42"/><stop offset=".55" stop-color="#8E1328"/><stop offset="1" stop-color="#5E0716"/></linearGradient>
 <linearGradient id="slrA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B21F37"/><stop offset="1" stop-color="#5A0614"/></linearGradient>
 <linearGradient id="slrS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D0344D"/><stop offset="1" stop-color="#7A0C1F"/></linearGradient>
 <radialGradient id="slrH" cx=".38" cy=".22" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
 <ellipse cx="50" cy="88" rx="40" ry="4" fill="#000" opacity=".35"/>
 <path d="M22 50V22c0-11 12-18 28-18s28 7 28 18v28z" fill="url(#slrB)"/>
 <path d="M22 50V22c0-11 12-18 28-18s28 7 28 18v28z" fill="url(#slrH)"/>
 <g fill="#4A0410" opacity=".55"><circle cx="38" cy="22" r="1.4"/><circle cx="62" cy="22" r="1.4"/><circle cx="50" cy="16" r="1.4"/><circle cx="38" cy="38" r="1.4"/><circle cx="62" cy="38" r="1.4"/><circle cx="50" cy="31" r="1.4"/></g>
 <path d="M28 8.5c6-3 13-4.3 22-4.3" stroke="#fff" stroke-opacity=".25" stroke-width="2" fill="none" stroke-linecap="round"/>
 <rect x="23" y="48" width="54" height="22" rx="9" fill="url(#slrS)"/><path d="M28 51h44" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>
 <rect x="6" y="38" width="20" height="38" rx="9" fill="url(#slrA)"/><rect x="74" y="38" width="20" height="38" rx="9" fill="url(#slrA)"/>
 <rect x="6" y="38" width="20" height="10" rx="5" fill="#D23A52" opacity=".55"/><rect x="74" y="38" width="20" height="10" rx="5" fill="#D23A52" opacity=".55"/>
 <rect x="20" y="66" width="60" height="12" rx="4" fill="#5A0614"/><rect x="14" y="76" width="6" height="9" rx="2" fill="#C9A24A"/><rect x="80" y="76" width="6" height="9" rx="2" fill="#C9A24A"/></svg>`;

const R={pmute:(()=>{try{return new Set(JSON.parse(localStorage.getItem('slr3_pmute')||'[]'))}catch(e){return new Set()}})(),chatBan:[],n:0,aud:[],mounted:false,info:null,room:null,msgs:[],cur:0,pick:false,pend:null,deaf:false,busy:false,acts:0,poll:0,tick:0,last:''};
const owner=()=>!!((R.room&&R.room.is_owner)||(R.info&&R.info.is_owner));
const locks=()=>(R.info&&R.info.locks)||[];
const seats=()=>{const c=cs();let a=(c&&Array.isArray(c.seats))?c.seats:[];const o=R.seatOv;if(o){if(Date.now()>o.until||a.length===o.n)R.seatOv=null;else{a=a.slice(0,o.n);while(a.length<o.n)a.push(null)}}return a};
const mine=()=>{const c=cs();return c&&c.mine!=null?c.mine:-1};
const BAD={has:id=>!!(window.SLR3_BAD&&SLR3_BAD.has(id))};const ava=(p,cls)=>{const id=Number(p&&p.id||0),n=String((p&&p.name)||'W').trim();return `<span class="r-av ${cls||''}" style="--h:${(id*47)%360}"><b>${esc(Array.from(n)[0]||'W')}</b>${BAD.has(id)&&!(p&&p.avatar)?'':`<img src="${esc((p&&p.avatar)||'/ava/'+id)}" alt="" data-sp-bound="1" onerror="(window.SLR3_BAD||(window.SLR3_BAD=new Set)).add(${id});this.remove()">`}</span>`};
const vc=()=>{try{return typeof VC!=='undefined'?VC:null}catch(e){return null}};

/* ---------- layout */
function cols(n){if(n<=4)return n;if(n===6)return 3;if(n===5)return 3;return 4}
/* is this person's mic off? (owner muted them, they are not in the voice room, or they muted themselves) */
function micOff(uid){uid=Number(uid);if(R.info&&(R.info.muted||[]).some(u=>Number(u.id||u)===uid))return true;
 const v=vc();if(uid===me())return !(v&&v.on&&!v.mute);
 if(v&&v.on&&Array.isArray(v.members)&&v.members.length){const m=v.members.find(z=>Number(z.id)===uid);return !m||!!m.mute}
 if(R.mic&&typeof R.mic==='object')return !(String(uid) in R.mic)||!!R.mic[uid];return false}
const ownLocked=uid=>!!(R.info&&(R.info.muted||[]).some(u=>Number(u.id||u)===Number(uid)))||(Number(uid)===me()&&!!R.meLocked);
function seatH(x,i){const lk=!x&&locks().includes(i),m=x&&Number(x.id)===me(),v=vc(),spk=false/* the ring is set by talkSync, so a voice never forces a redraw */,
  mute=x&&micOff(x.id),locked=x&&ownLocked(x.id),pm=x&&R.pmute.has(Number(x.id)),pend=R.pend&&R.pend.i===i;
 const lbl=x?tx('seatOf',{n:x.name||''}):lk?tx('seatLocked'):tx('seatEmpty');
 return `<button class="r-st${x?' r-on':''}${m?' r-me':''}${lk?' r-lk':''}${spk?' r-talk':''}${pend?' r-pd':''}" data-i="${i}" aria-label="${esc(lbl)}"><span class="r-cw">${!x&&!lk?'<b class="r-plus" aria-hidden="true">+</b>':''}
  ${x?`<span class="r-who">${ava(x)}${discH(x)}${spk?'<i class="r-ring" aria-hidden="true"></i><i class="r-ring r2" aria-hidden="true"></i>':''}${locked?`<i class="r-mx r-lockm" aria-label="${esc(tx('micOff'))}">${sv('micx',2.4)}</i>`:pm?`<i class="r-mx" aria-label="${esc(tx('pMuteOn'))}">${sv('spkx',2.4)}</i>`:mute&&!spk?`<i class="r-mx" aria-label="${esc(tx('micOff'))}">${sv('micx',2.4)}</i>`:''}</span>`:lk?`<span class="r-lkb${R.popLk===i?' r-pop':''}">${sv('lock',2)}</span>`:''}</span><span class="r-sn"><bdi>${x?esc(x.name||''):num(i+1)}</bdi></span></button>`}
/* while a film is on the screen the rows become a drawer: only one row is shown, the next rows wait to the right and come in with a
   swipe (dots below show where people sit); without a film all rows are shown as before */
const DEX={"Next": "Als Nächstes", "Tap to hear": "Zum Hören tippen", "Tap to play": "Zum Abspielen tippen", "This salon already has 200 members": "Dieser Salon hat schon 200 Mitglieder", "You cannot join this salon": "Du kannst diesem Salon nicht beitreten", "You joined this salon": "Du bist dem Salon beigetreten", "Music": "Musik", "Next: ": "Als Nächstes: ", "SoundCloud songs can be played now, not queued yet": "SoundCloud-Songs können abgespielt, aber noch nicht eingereiht werden", "Song or singer…": "Song oder Sänger…", "You can’t play music here": "Du darfst hier keine Musik abspielen", "Song not found": "Song nicht gefunden", "Added to the queue": "Zur Warteschlange hinzugefügt", "Add to queue": "Zur Warteschlange", "Ask permission": "Erlaubnis anfragen", "Request sent": "Anfrage gesendet", "Your request was sent": "Deine Anfrage wurde gesendet", "This song can’t be played outside its site": "Dieser Song darf nur auf seiner Seite laufen", "The queue is full": "Die Warteschlange ist voll", "Couldn’t connect, try again": "Keine Verbindung, versuch es nochmal", "Play": "Abspielen", "Suggest a song": "Song vorschlagen", "Suggest": "Vorschlagen", "Suggestion sent": "Vorschlag gesendet", "Nothing found": "Nichts gefunden", "Please wait a moment": "Bitte kurz warten", "Make admin": "Zum Admin machen", "Admin": "Admin", "Members are hidden from others": "Mitglieder sind für andere verborgen", "Members for others": "Mitglieder für andere", "Members": "Mitglieder", "Done": "Erledigt", "This salon is full (200 members)": "Dieser Salon ist voll (200 Mitglieder)", "Remove admin": "Admin entfernen", "Search members…": "Mitglieder suchen…", "Remove from salon": "Aus dem Salon entfernen", "Allow music": "Musik erlauben", "In the salon": "Im Salon", "Music requests": "Musik-Anfragen", "No requests": "Keine Anfragen", "View profile": "Profil ansehen", "Decline": "Ablehnen", "Join": "Beitreten", "Member": "Mitglied", "Only the owner can": "Nur der Besitzer darf das", "Owner only": "Nur Besitzer", "This salon’s member list is hidden.": "Die Mitgliederliste dieses Salons ist verborgen.", "Allow": "Erlauben", "Owner and admins": "Besitzer und Admins", "Owner": "Besitzer", "Hidden": "Verborgen", "Block": "Blockieren", "Everyone": "Alle", "All members": "Alle Mitglieder", "Music playback": "Musik abspielen", "Visible": "Sichtbar", "Who may play music?": "Wer darf Musik abspielen?", "Take music permission": "Musik-Erlaubnis entziehen", "Chat": "Chat", "Confirm": "Bestätigen", "Drag to move · pinch to zoom": "Ziehen zum Verschieben · mit zwei Fingern zoomen", "Photo position": "Bildausschnitt", "Seats": "Plätze", "Viewers": "Zuschauer", "The queue is empty": "Die Warteschlange ist leer", " members": " Mitglieder"};window.WKG=s=>{try{return /^de/.test(String(L()||''))&&DEX[s]||s}catch(e){return s}};const G=window.WKG;
const LNG=()=>!/^(fa|ps|prs)/.test(String(L()||'fa'));
const PPLI='<svg class="r-ppli" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.2c2.3.2 4 1.7 4.5 4.3"/></svg>';
function seatRows(n){if(n<=3)return [n];if(n===4)return [1,2,1];if(n===5)return [2,3];if(n===7)return [1,2,4];const r=n%4,o=r?[r]:[];for(let k=0;k<Math.floor(n/4);k++)o.push(4);return o}
function rowsN(){return seatRows(seats().length).length}
function seatsH(){const s=seats(),n=s.length,L=seatRows(n),R0=L.length;const rows=[],off=[];let p=0;for(let r=0;r<R0;r++){off.push(p);const row=s.slice(p,p+L[r]).map((x,k)=>seatH(x,p+k));
  rows.push(`<div class="r-row r-n${n}${n===3?' r-arc':''}" style="--c:${L[r]}">${row.join('')}</div>`);p+=L[r]}
 const cc=cs();if(!(cc&&cc.vid)||isMus())return rows.join('');
 {const on=s.filter(Boolean).length,big=n>4,en=LNG();
 return `${big?'':`<div class="r-row r-fmini">${s.map((x,k)=>seatH(x,k)).join('')}</div>`}<div class="r-fbar">${big?`<button class="r-fchip" data-a="fseats" aria-label="${esc(en?G('Seats'):'جایگاه‌ها')}">${PPLI}<b>${num(on)}</b></button>`:''}<span class="r-faud">${audH()}</span><span class="r-sp"></span><button class="r-fct" data-a="fchat2" aria-pressed="${!R.chatOff}" aria-label="${esc(en?G('Chat'):'چت')}">${sv(R.chatOff?'chat':'chatx',1.8)}</button></div>${big?`<div class="r-fsh${R.fsh?' on':''}" data-a="fseats"><div class="r-fshb"><i class="r-grab"></i><div class="r-fsht">${PPLI}<b>${esc(en?G('Seats'):'جایگاه‌ها')}</b><small>${num(on)} / ${num(n)}</small></div><div class="r-fsg">${s.map((x,k)=>seatH(x,k)).join('')}</div></div></div>`:''}`}
 const dir=RTL()?'rtl':'ltr',ppl=r=>s.slice(off[r],off[r]+L[r]).some(Boolean);
 return `<div class="r-sdw" dir="ltr">${rows.map((h,r)=>`<div class="r-sdp" dir="${dir}" data-p="${r}">${h}</div>`).join('')}</div><div class="r-sdots" dir="ltr">${rows.map((h,r)=>`<i data-p="${r}" class="${r===0?'on':''}${ppl(r)?' ppl':''}"></i>`).join('')}</div>`}
function seatPage(){const r=root(),sw=r&&r.querySelector('.r-sdw');if(!sw)return;const k=Math.round(sw.scrollLeft/Math.max(1,sw.clientWidth));r.querySelectorAll('.r-sdots i').forEach(d=>d.classList.toggle('on',+d.dataset.p===k))}
/* an archive film plays in the salon's own film element. A YouTube id (11 letters) always means YouTube, even when the room still
   carries the previous archive film's details (that hid the YouTube picture: only its sound was left, and the clock stood at 0:00) */
function pollX(){const code=cid();if(!code)return;try{api('/api/app/salon/x/state?code='+encodeURIComponent(code)).then(j=>{if(!j||!j.ok||cid()!==code)return;const c=cs();R.x=j;R.xv=(c&&c.vid)||'';const k=JSON.stringify([j.role,j.music,j.music_ok,j.rules,j.requests,R.xv]);if(k!==R.xk){R.xk=k;paint()}}).catch(()=>{})}catch(e){}}
/* music (SoundCloud, or a song chosen in «موسیقی») is only heard: the salon keeps its seats-and-chat look and the record on the seat */
function isMus(){if((window.WKM&&WKM.on()&&!WKM.video()))return true;const c=cs();if(!c||!c.vid)return false;if(R.xpend&&R.xpend===c.vid)return true;if(R.xv!==c.vid&&Date.now()-(R.vidAt||0)<2500)return true;const m=c.media||{};if(m.kind==='soundcloud'||c.provider==='soundcloud'||String(c.vid).startsWith('sc:'))return true;const x=R.x&&R.x.music;return !!(x&&x.src==='youtube'&&R.xv===c.vid)}
const NPI={stop:'<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',play:'<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/>',pause:'<rect x="7" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" stroke="none"/>',next:'<path d="M6 5.5v13l9-6.5z" fill="currentColor" stroke="none"/><path d="M18 5.5v13" stroke-width="2.4"/>'};
function stopOnLeave(code){try{code=code||cid();if(!code)return;if(window.WKM&&WKM.on()){const ids=new Set();(R.aud||[]).forEach(p=>p&&p.id&&ids.add(Number(p.id)));seats().forEach(x=>x&&x.id&&ids.add(Number(x.id)));ids.delete(me());if(WKM.mine()||!ids.size)WKM.ctl('stop',null,code)}const c=cs(),m=R.x&&R.x.music;if(!(c&&c.vid)&&!(m&&m.uid))return;const ids=new Set();(R.aud||[]).forEach(p=>p&&p.id&&ids.add(Number(p.id)));seats().forEach(x=>x&&x.id&&ids.add(Number(x.id)));ids.delete(me());if(npMine()||!ids.size){R.x&&(R.x.music=null);api('/api/app/salon/screen',{code,action:'close'}).catch(()=>{})}}catch(e){}}
function npMine(){if((window.WKM&&WKM.on()&&!WKM.video()))return WKM.mine()&&WKM.control();const m=R.x&&R.x.music;return !!(m&&Number(m.uid)===me())}
function npC(){if((window.WKM&&WKM.on()&&!WKM.video())){const W=WKM.st();return {vid:'wkm',title:W.title,playing:!!W.playing}}return cs()}
function npH(){const c=npC();if(!c||!c.vid||!isMus())return '';const t=String(c.title||(c.media&&c.media.title)||'').trim()||'♪';const on=!!c.playing,open=R.npOpen&&npMine();
 return `<div class="r-np${on?' r-npon':''}${open?' r-npopen':''}"><button class="r-np1" data-a="npx" aria-label="${esc(t)}"><i class="r-npd${on?' r-spin':''}" aria-hidden="true"></i><bdi>${esc(t)}</bdi><span class="r-npe" aria-hidden="true"><i></i><i></i><i></i></span></button>${open?`<div class="r-np2"><button class="r-npb r-npx" data-a="npstop" aria-label="stop"></button><button class="r-npb r-npm" data-a="nppp" aria-label="${esc(tx(on?'pause':'play'))}"></button><button class="r-npb" data-a="npnext" aria-label="next"></button></div>`:''}</div>`}
function npPaint(){const r=root();if(!r)return;const w=r.querySelector('.r-npw');if(!w)return;let h=npH();setH(w,h);const b=w.querySelector('.r-np2');if(b){const c=npC();const q=b.querySelectorAll('.r-npb');const S2=(d,x)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${x||1.9}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;q[0].innerHTML=S2(NPI.stop,2);q[1].innerHTML=S2(c&&c.playing?NPI.pause:NPI.play);q[2].innerHTML=S2(NPI.next,1.9)}}
setInterval(()=>{try{if(!R.mounted)return;if(R.npOpen&&Date.now()-(R.npAt||0)>5000)R.npOpen=false;npPaint()}catch(e){}},400);
function discH(x){if((window.WKM&&WKM.on()&&!WKM.video())){const W=WKM.st();return Number(W.by)===Number(x.id)?`<i class="r-disc${W.playing?' r-spin':''}" aria-hidden="true"><i></i></i>`:''}const m=R.x&&R.x.music;if(!m||!isMus()||Number(m.uid)!==Number(x.id))return '';const c=cs();return `<i class="r-disc${c&&c.playing?' r-spin':''}" aria-hidden="true"><i></i></i>`}
function isNat(c){if(/^[\w-]{11}$/.test(String(c&&c.vid||'')))return false;return !!window.WakhanSalonMedia?.native(c,cid())}
function natV(){const r=root();return r&&r.querySelector('.r-scr video.r-nv')||null}
function poster(c){if(isNat(c))return (c.media&&c.media.thumb)||c.thumb||'';return /^[\w-]{11}$/.test(c.vid)?'https://i.ytimg.com/vi/'+c.vid+'/hqdefault.jpg':''}
/* archive versions (Aparat, Farsinama, Internet Archive …) play in the salon's own film element, kept at the salon's time;
   the old cinema engine stays out of the salon (its hall machinery — theater mode, its bars — must not touch this screen) */
function natPick(c){const f=(c.media&&c.media.formats)||[];return (f.filter(x=>(x.height||0)<=720).sort((a,b)=>(b.height||0)-(a.height||0))[0]||f[0]||{}).url||''}
function natExp(){try{return Math.max(0,cExp())}catch(e){return 0}}
function reNat(){const c=cs(),v=natV();if(!v||!isNat(c))return;if(window.WakhanRoomAudio?.restoring?.()||document.hidden&&window.WakhanRoomAudio?.owns?.()){v.pause();return}const url=natPick(c);if(!url)return;
 if(v.dataset.key!==c.vid){const source=c.vid;v.dataset.key=source;v.addEventListener('ended',()=>{if(v===natV()&&cs()?.vid===source)void wmcFinishMedia(v,source)},{once:true});v.src=url;v.addEventListener('loadedmetadata',()=>{try{v.currentTime=natExp()}catch(e){}if(cs()&&cs().playing)v.play().catch(()=>{v.muted=true;v.play().catch(()=>{})})},{once:true});return}
 if(typeof BG!=='undefined'&&BG.on){if(!v.muted)v.muted=true;return}
 try{if(c.playing){if(v.paused)v.play().catch(()=>{});if(isFinite(v.duration)&&v.readyState>1&&Math.abs(v.currentTime-natExp())>2.5)v.currentTime=natExp()}else if(!v.paused)v.pause()}catch(e){}v.muted=!!R.fmute}
function natStop(){document.querySelectorAll('.slr video.r-nv').forEach(v=>{try{v.pause();v.removeAttribute('src');v.load()}catch(e){}})}
function guardEngine(){try{if(typeof nxApplyNative==='function'&&!nxApplyNative.__slr){const o=nxApplyNative;const g=function(){if(document.body.classList.contains('slr-on')||document.querySelector('.s9-card')){try{if(typeof NX!=='undefined'&&NX.video){NX.video.pause();NX.video.removeAttribute('src')}}catch(e){}return}return o.apply(this,arguments)};g.__slr=1;window.nxApplyNative=g}}catch(e){}
 try{document.body.classList.remove('wmc-theater');if(typeof WMC!=='undefined'&&WMC)WMC.expanded=false}catch(e){}}
function wkmStageH(){const W=WKM.st(),bg=esc(W.thumb||''),can=!!W.control;
 return `<div class="r-stg r-ui wkm-st"><div class="r-scr r-nat" style="--bg:url('${bg}')"><div class="r-zw wkm-vh" style="--bg:url('${bg}')"></div><div class="r-shade"></div></div>${fsH()}
  <div class="r-ctl"><button class="r-cb r-pp" data-a="pp" aria-label="${esc(tx(W.playing?'pause':'play'))}">${sv(W.playing?'pause':'play')}</button><span class="r-tm"><b class="r-t0">0:00</b> / <span class="r-t1">0:00</span></span>
   <span class="r-bar r-sk" data-a="seek" role="slider" aria-label="${esc(tx('seek'))}"><i></i></span>
   <button class="r-cb" data-a="vol" aria-label="${esc(tx('vol'))}">${sv(R.fmute?'volx':'vol')}</button><button class="r-cb" data-a="fs" aria-label="${esc(tx('fs'))}">${sv('fs',2)}</button>${can?`<button class="r-cb r-scx" data-a="scx" aria-label="${esc(tx('scrClose'))}">${sv('scrx',1.9)}</button>`:''}</div></div>`}
function stageH(){if((window.WKM&&WKM.video()))return wkmStageH();const c=cs();if(!c||!c.vid)return '';const own=owner();const bg=esc(poster(c));
 return `<div class="r-stg r-ui${isNat(c)?'':' r-ytst'}"><div class="r-scr${isNat(c)?' r-nat':''}" style="--bg:url('${bg}')"><div class="r-zw" style="--bg:url('${bg}')"><div id="yt"></div>${isNat(c)?`<video class="r-nv" playsinline webkit-playsinline preload="auto" poster="${bg}"></video>`:''}</div><div class="r-shade"></div>${isNat(c)?'':'<div class="r-ytc" aria-hidden="true"><i class="r-ytsp"></i><i class="r-ytpl"></i><b class="r-yttap"></b><div class="r-ytnx"></div></div>'}</div>${fsH()}
  <div class="r-ctl"><button class="r-cb r-pp" data-a="pp" aria-label="${esc(tx(c.playing?'pause':'play'))}">${sv(c.playing?'pause':'play')}</button><span class="r-tm"><b class="r-t0">0:00</b> / <span class="r-t1">0:00</span></span>
   <span class="r-bar r-sk" data-a="seek" role="slider" aria-label="${esc(tx('seek'))}"><i></i></span>
   <button class="r-cb" data-a="vol" aria-label="${esc(tx('vol'))}">${sv(R.fmute?'volx':'vol')}</button><button class="r-cb" data-a="fs" aria-label="${esc(tx('fs'))}">${sv('fs',2)}</button>${canCtl()?`<button class="r-cb r-scx" data-a="scx" aria-label="${esc(tx('scrClose'))}">${sv('scrx',1.9)}</button>`:''}</div></div>`}
/* full screen: Netflix-like controls (owner and salon admins only for pause / ±15s / seek), zoom, and the salon living on top of the film:
   messages float in with no bubbles and fade away, and whoever talks shows up in a small pill */
const canCtl=()=>{const c=cs();return !!((c&&c.can)||owner())};
function fsH(){const c=cs();return `<div class="r-fo" aria-hidden="true"><div class="r-fchat"></div><div class="r-ftalk"></div>
 <div class="r-fui"><div class="r-ftop"><button class="r-fb" data-a="fs" aria-label="${esc(tx('fsx'))}">${sv('x',2)}</button><span class="r-ftt"><b><bdi>${esc((c&&c.title)||'')}</bdi></b><small><bdi>${esc((R.room&&R.room.name)||(R.info&&R.info.name)||'')}</bdi></small></span><span style="flex:1"></span><button class="r-fb" data-a="zoom" aria-label="${esc(tx('zoom'))}">${sv(R.zoom?'zout':'zin',1.9)}</button></div>
  <div class="r-fmid">${canCtl()?`<button class="r-fb r-fbig" data-a="b15" aria-label="${esc(tx('b15'))}">${sv('b15',1.7)}</button><button class="r-fb r-fpp" data-a="pp" aria-label="${esc(tx(c&&c.playing?'pause':'play'))}">${sv(c&&c.playing?'pause':'play')}</button><button class="r-fb r-fbig" data-a="f15" aria-label="${esc(tx('f15'))}">${sv('f15',1.7)}</button>`:''}</div>
  <div class="r-fbot"><span class="r-tm"><b class="r-t0">0:00</b></span><span class="r-bar r-sk" data-a="seek" role="slider" aria-label="${esc(tx('seek'))}"><i></i></span><span class="r-tm r-t1">0:00</span>
   <button class="r-fb r-fmic" data-a="mic" aria-label="${esc(tx('micOff'))}">${sv('micx')}</button><button class="r-fb" data-a="fchat" aria-label="${esc(tx('fchat'))}">${sv('chat')}</button><button class="r-fb" data-a="vol" aria-label="${esc(tx('vol'))}">${sv(R.fmute?'volx':'vol')}</button><button class="r-fb" data-a="fs" aria-label="${esc(tx('fsx'))}">${sv('fsx',2)}</button></div></div>
 <form class="r-fin" hidden><input data-k="fmsg" maxlength="500" enterkeyhint="send" autocomplete="off" placeholder="${esc(tx('write'))}" aria-label="${esc(tx('write'))}"><button class="r-fsd" type="submit" aria-label="${esc(tx('send'))}">${DI.up}</button></form></div>`}
function fsMic(){const r=root();const b=r&&r.querySelector('.r-fmic');if(!b)return;const v=vc(),on=R.micBusy?!!R.micWant:(v&&v.on&&!v.mute);b.classList.toggle('r-on',!!on);b.innerHTML=sv(on?'mic':'micx');b.setAttribute('aria-label',tx(on?'micOn':'micOff'))}
function fsType(open){const r=root(),f=r?.querySelector('.r-fin');if(!f)return;if(open&&f.parentElement!==r){R.formParent=f.parentElement;r.append(f)}f.hidden=!open;r.classList.toggle('fty',open);if(open){const i=f.querySelector('input');i.focus({preventScroll:true});fsShow();R.kbUpdate?.()}else{if(f.contains(document.activeElement))document.activeElement.blur();if(R.formParent?.isConnected)R.formParent.append(f);R.formParent=null;R.kbUpdate?.()}}
function fsShow(){const r=root();if(!r||!r.classList.contains('fs'))return;const u=r.querySelector('.r-fui');if(!u)return;u.classList.add('on');clearTimeout(R.fsT);const c=cs();if(c&&c.playing&&!r.classList.contains('fty'))R.fsT=setTimeout(()=>u.classList.remove('on'),3200)}
function fsChat(list){const r=root();if(!r||!r.classList.contains('fs'))return;const box=r.querySelector('.r-fchat');if(!box)return;
 for(const m of list){const d=document.createElement('div');d.className='r-fm';d.innerHTML=`${ava(m.sender)}<span><b class="r-mn" style="${nameC(m.sender&&m.sender.id)}"><bdi>${esc((m.sender&&m.sender.name)||'')}</bdi></b> <bdi>${esc(m.text||'')}</bdi></span>`;box.appendChild(d);setTimeout(()=>d.remove(),8200)}
 while(box.children.length>4)box.firstElementChild.remove()}
function fsTalk(){const r=root();if(!r||!r.classList.contains('fs'))return;const box=r.querySelector('.r-ftalk');if(!box)return;
 const who=seats().filter(x=>x&&talking(x.id)).slice(0,2),key=who.map(x=>x.id).join(',');if(box.dataset.k===key)return;box.dataset.k=key;
 box.innerHTML=who.map(x=>`<span class="r-tp">${ava(x)}<b><bdi>${esc(x.name||'')}</bdi></b><i class="r-wv"><i></i><i></i><i></i><i></i></i></span>`).join('')}
function fsZoom(){const r=root();const z=r&&r.querySelector('.r-zw');if(!z)return;let k=1;if(R.zoom){const b=z.getBoundingClientRect();const w=Math.max(b.width,b.height),h=Math.min(b.width,b.height);const ar=w/h;k=Math.max(ar/(16/9),(16/9)/ar)}z.style.setProperty('--z',k);z.classList.toggle('r-zm',k>1.001)}
function headH(){const c=cs(),n=seats().filter(Boolean).length,m=seats().length,nm=(R.room&&R.room.name)||(R.info&&R.info.name)||'',o=(R.room&&R.room.owner)||{id:R.info&&R.info.owner_id,name:R.info&&R.info.owner_name};
 const ph=(R.room&&R.room.photo)||(R.info&&R.info.photo);
 return `<div class="r-hd"><button class="r-who" data-a="salon">${R.x&&R.x.role==='none'?`<i class="r-jb" data-a="xjoin" aria-label="${esc(LNG()?'Join':'عضو شو')}">+</i>`:''}${ph?`<span class="r-av"><img src="${esc(ph)}" alt=""></span>`:ava(o)}<span class="r-nm"><b><bdi>${esc(nm)}</bdi></b></span><span class="r-cv">${sv('chev',2)}</span></button>
  <span class="r-sp"></span><button class="r-ib" data-a="chats" aria-label="${esc(tx('chats'))}">${sv('chat')}</button><button class="r-ib" data-a="invite" aria-label="${esc(tx('invite'))}">${sv('invite')}</button><button class="r-ib" data-a="exit" aria-label="${esc(tx('exit'))}"><span class="r-esc" aria-hidden="true">⎋</span></button></div>`}
/* every person gets their own two-tone name colour from a small hand-picked palette (always the same for the same person) */
const NAMEC=[['#FFB1CC','#FF7FA0'],['#FFD3A5','#FD9A6B'],['#F6E7B0','#E5BE5C'],['#A8F0D1','#4FD1AE'],['#9BE7FF','#5FA8FF'],['#C9BCFF','#8B76FF'],['#EBB8FF','#BC74FF'],['#FFB8E1','#DE86FF'],['#D8F6A6','#93D65F'],['#B5F2F0','#6CCBE6'],['#FFCBB8','#FF8FA8'],['#F2CCFF','#AE9BFF']];
const nameC=uid=>{const n=Number(uid)||0;const c=NAMEC[((n*2654435761)>>>0)%NAMEC.length];return `--n1:${c[0]};--n2:${c[1]}`};
const GIFTN={rose:['شراره','Flare'],heart:['نبض نیلی','Indigo Pulse'],crown:['بال سپیده','Dawn Wings'],diamond:['قلب کهکشان','Galaxy Heart'],rose_bloom:['رز بهاری','Spring Rose'],petal_rain:['باران گلبرگ','Petal Rain'],river:['رود آبی','Blue River'],phoenix:['ققنوس','Phoenix'],dove:['کبوتر سپید','White Dove'],butterfly:['پروانهٔ آبی','Blue Butterfly'],comet:['دنباله‌دار','Comet'],nebula:['سحاب نیلی','Indigo Nebula'],aurora:['شفق قطبی','Aurora'],lotus:['نیلوفر','Lotus'],blue_fire:['شعلهٔ آبی','Blue Flame'],waterfall:['آبشار','Waterfall'],spring_bird:['پرندهٔ بهاری','Spring Bird'],sunrise:['طلوع سپیده','Sunrise'],ice_heart:['قلب یخی','Ice Heart'],moonlight:['مهتاب','Moonlight']};
const giftName=c=>{const g=GIFTN[c];return g?(L()==='en'?g[1]:g[0]):c};
const giftArt=c=>{try{if(typeof wm70GiftArt==='function'&&typeof WM70!=='undefined'&&WM70.gifts&&WM70.gifts.some(v=>v.code===c))return wm70GiftArt(c)}catch(e){}return sv('gift',1.6)};
function entryFeed(){return window.WakhanSalonNotice?.feed}
function acceptNotice(){entryFeed()?.meta(me(),cid(),R.info);paintMsgs()}
function sysText(x){const en=LNG(),n=x.names,a=n.length>3?n.slice(0,2):n,more=n.length-a.length;const list=a.join(en?', ':'، ')+(more?(en?` and ${num(more)} more`:` و ${num(more)} نفر دیگر`):'');const pl=n.length>1;
 return x.t==='j'?(en?`${list} joined`:`${list} ${pl?'وارد شدند':'وارد شد'}`):(en?`${list} left`:`${list} ${pl?'سالون را ترک کردند':'سالون را ترک کرد'}`)}
function sysAdd(t,names){names=names.filter(Boolean);if(!names.length)return;const lastId=Math.max(0,...(R.msgs||[]).map(m=>Number(m.id)||0));R.sysl=(R.sysl||[]).filter(x=>x.room===cid());
 const p=R.sysl[R.sysl.length-1];if(p&&p.t===t&&p.after===lastId&&Date.now()-p.at<60000){p.names=p.names.concat(names);p.at=Date.now()}else R.sysl.push({kind:'sys',t,after:lastId,names:names.slice(),at:Date.now(),room:cid()});
 const q=R.sysl[R.sysl.length-1];q.text=sysText(q);if(R.sysl.length>12)R.sysl.splice(0,R.sysl.length-12);paintMsgs()}
function joinDiff(){if(!cs())return;const code=cid(),now=new Set(),nm={};seats().forEach(x=>{if(x){now.add(Number(x.id));nm[Number(x.id)]=x.name||''}});(R.aud||[]).forEach(p=>{now.add(Number(p.id));if(!nm[Number(p.id)])nm[Number(p.id)]=p.name||''});now.delete(me());
 const J=R.jd&&R.jd.code===code?R.jd:(R.jd={code,in:new Map(),miss:new Map(),init:false});const joined=[],left=[];
 now.forEach(id=>{J.miss.delete(id);if(!J.in.has(id)&&J.init)joined.push(nm[id]);J.in.set(id,nm[id]||J.in.get(id)||'')});
 J.in.forEach((n,id)=>{if(!now.has(id)){const k=(J.miss.get(id)||0)+1;if(k>=2){J.in.delete(id);J.miss.delete(id);left.push(n)}else J.miss.set(id,k)}});
 J.init=true;if(joined.length)sysAdd('j',joined);if(left.length)sysAdd('l',left)}
function sysMix(list){const S=(R.sysl||[]).filter(x=>x.room===cid());if(!S.length)return list;const out=list.slice();
 S.forEach(x=>{let p=0;for(let k=0;k<out.length;k++){const id=Number(out[k].id);if(out[k].kind==='salon_notice'||out[k].kind==='sys'||(id>0&&id<=x.after))p=k+1}out.splice(p,0,x)});return out}
function msgsH(){const messages=sysMix(entryFeed()?.rows(me(),cid(),R.msgs)||R.msgs);return messages.slice(-41).map(m=>{if(m.kind==='sys')return `<div class="r-sys" role="note"><bdi>${esc(m.text||'')}</bdi></div>`;if(m.kind==='salon_notice')return `<div class="r-mg r-entry-notice" role="note"><span class="r-ma" aria-hidden="true">${sv('bell')}</span><span class="r-mt" dir="auto">${esc(m.text)}</span></div>`;const own=Number(m.sender&&m.sender.id)===me();return `<div class="r-mg${own?' r-own':''}"><button class="r-ma" data-u="${Number(m.sender&&m.sender.id)}" aria-label="${esc(m.sender&&m.sender.name)}">${ava(m.sender)}</button><span class="r-mt"><b class="r-mn" style="${nameC(m.sender&&m.sender.id)}"><bdi>${esc((m.sender&&m.sender.name)||'')}</bdi></b><bdi>${esc(m.text||'')}</bdi></span></div>`}).join('')}
const DI={
 mic:'<svg class="r-di" viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="11" y="18" width="2" height="3.5" rx="1" fill="currentColor"/></svg>',
 micx:'<svg class="r-di" viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="11" y="18" width="2" height="3.5" rx="1" fill="currentColor"/><path d="M4 3.5l16 17" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
 spk:'<svg class="r-di" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9.2c0-.6.4-1 1-1h3L12 4.4c.6-.5 1.5-.1 1.5.7v13.8c0 .8-.9 1.2-1.5.7l-4.5-3.8h-3c-.6 0-1-.4-1-1z"/><path d="M16.3 9a4.3 4.3 0 0 1 0 6M18.8 6.4a8 8 0 0 1 0 11.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 spkx:'<svg class="r-di" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9.2c0-.6.4-1 1-1h3L12 4.4c.6-.5 1.5-.1 1.5.7v13.8c0 .8-.9 1.2-1.5.7l-4.5-3.8h-3c-.6 0-1-.4-1-1z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/></svg>',
 apps:'<svg class="r-di r-dia" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2.6" fill="currentColor"/><rect x="13" y="3" width="8" height="8" rx="2.6" fill="currentColor"/><rect x="3" y="13" width="8" height="8" rx="2.6" fill="currentColor"/><rect x="13" y="13" width="8" height="8" rx="4" fill="currentColor"/></svg>',
 up:'<svg class="r-di r-diu" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M6.5 11.2 12 5.6l5.5 5.6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
function barH(){const v=vc();let on=!!(v&&v.on&&!v.mute)&&!R.meLocked;if(R.micBusy)on=!!R.micWant;const cb=!!R.meChatBan;
 return `<div class="r-bb r-lq"><div class="r-cap"><div class="r-orbs">
  <button class="r-orb r-mic${on?' r-on':''}${R.micBusy?' r-wait':''}${R.meLocked?' r-lockd':''}" data-a="mic" aria-pressed="${on}" aria-label="${esc(tx(on?'micOn':'micOff'))}"><i class="r-halo" aria-hidden="true"></i>${on?DI.mic:DI.micx}</button>
  <button class="r-orb r-spk${R.deaf?'':' r-on'}" data-a="spk" aria-pressed="${!R.deaf}" aria-label="${esc(tx(R.deaf?'spkOff':'spkOn'))}">${R.deaf?DI.spkx:DI.spk}</button>
  <button class="r-orb r-apps" data-a="tools" aria-label="${esc(tx('tools'))}">${DI.apps}</button></div>
  <label class="r-in${cb?' r-cb':''}">${cb?sv('chatx',1.8):''}<input data-k="msg" maxlength="500" enterkeyhint="send" autocomplete="off" ${cb?'disabled':''} placeholder="${esc(tx(cb?'chatClosed':'write'))}" aria-label="${esc(tx('write'))}"></label></div>
  <button class="r-sd" data-a="send" ${cb?'disabled':''} aria-label="${esc(tx('send'))}">${DI.up}</button></div>`}

function page(){const c=cs(),lobby=!(window.WKM&&WKM.video())&&(!c||!c.vid||isMus());R.fsh=false;
 return `<div class="slr${lobby?' lobby':''}${owner()?' own':''}${R.chatOff?' r-chatoff':''}${isMus()?' r-music':''}" data-rows="${rowsN()}" dir="${RTL()?'rtl':'ltr'}"><div class="r-bgi" style="--bg:url('${esc((R.room&&R.room.bg)||'/s/wk2/salon/pamir.jpg')}')"></div><div class="r-bgv"${R.room&&R.room.dim!=null?` style="box-shadow:inset 0 0 0 100vmax rgba(10,6,20,${Number(R.room.dim)||0})"`:''}></div>
  ${headH()}<div class="r-npw"></div><div class="r-stw">${stageH()}</div><div class="r-seats">${seatsH()}</div><div class="r-audw">${audH()}</div>
  
  <div class="r-acts" aria-live="polite"></div><div class="r-msgs">${msgsH()}</div>${barH()}</div>`}

/* ---------- paint parts (the screen is never rebuilt while a film runs) */
function root(){return document.querySelector('#view .slr')}
/* the page is touched only where the picture really changed: every rewrite restarts animations, reloads pictures and wakes
   about a dozen older watchers of the page, which is what made the salon flicker and feel slow */
function setH(el,html){if(el&&el.__h!==html){el.innerHTML=html;el.__h=html}}
function setO(el,html){if(!el||el.__o===html)return el;const t=document.createElement('div');t.innerHTML=html;const n=t.firstElementChild;if(!n)return el;n.__o=html;el.replaceWith(n);return n}
function setT(el,t){if(el&&el.textContent!==t)el.textContent=t}
function paint(full){if(!R.mounted||TAB!=='c'||CV!=='hall')return;const v=host();if(!v)return;let r=root();const c=cs();
 const key=(c&&c.vid?(isNat(c)?'n:'+c.vid:'yt'):'')+'|'+(isNat(c)?'native':'embed')+'|'+seats().length+'|'+(window.WKM&&WKM.on()?(WKM.video()?'wv:'+WKM.st().asset:'wa'):'');if((c&&c.vid||'')!==(R.lastVid||'')){R.lastVid=(c&&c.vid)||'';R.vidAt=Date.now();setTimeout(pollX,0);setTimeout(()=>{try{paint()}catch(e){}},2600);if(r&&c&&c.vid&&!isNat(c)){const sc=r.querySelector('.r-scr');const bg="url('"+esc(poster(c))+"')";if(sc){sc.style.setProperty('--bg',bg);const zw=sc.querySelector('.r-zw');if(zw)zw.style.setProperty('--bg',bg)}}}
 if(full||!r||R.last!==key){const wasFull=!!r?.classList.contains('fs'),wasTyping=!!r?.classList.contains('fty'),draft=r?.querySelector('.r-fin input')?.value||'';R.last=key;style();v.innerHTML=page();document.body.classList.add('slr-on');r=root();bindKb();window.SLR9?.reconcile?.();if(wasFull&&c?.vid){r.classList.add('fs');if(wasTyping){r.querySelector('.r-fin input').value=draft;fsType(true)}}else if(wasFull){window.WakhanOrientation?.setFullscreen(false)}{const mm=r&&r.querySelector('.r-msgs');if(mm){pinMsgs(mm);mm.__seen=1;mm.scrollTop=mm.scrollHeight}}if(r){r.addEventListener('touchstart',e=>{if(R.typing&&e.target.closest('.slr .r-sd')){e.preventDefault();send()}},{passive:false});r.addEventListener('scroll',e=>{if(e.target.classList&&e.target.classList.contains('r-sdw'))seatPage()},{capture:true,passive:true})}if(c&&c.vid)try{if(typeof YTP!=='undefined'&&YTP){try{YTP.destroy()}catch(e){}YTP=null;YTOK=false}document.querySelectorAll('[id=yt]').forEach(e=>{if(!r.contains(e))e.id='yt-old'});if(!isNat(c))ytLoad()}catch(e){}reNat();return}
 r.classList.toggle('lobby',!c||!c.vid||isMus());r.classList.toggle('r-music',isMus());r.classList.toggle('own',owner());r.dataset.rows=String(rowsN());setH(r.querySelector('.r-audw'),audH());
 setO(r.querySelector('.r-hd'),headH());npPaint();
 {const sw0=r.querySelector('.r-sdw'),sl=sw0?sw0.scrollLeft:0;setH(r.querySelector('.r-seats'),seatsH());const sw1=r.querySelector('.r-sdw');if(sw1&&sw1!==sw0&&sl){sw1.scrollLeft=sl;seatPage()}}
 r.querySelectorAll('[data-a=pp]').forEach(pp=>{if(c){setH(pp,sv(c.playing?'pause':'play'));const l=tx(c.playing?'pause':'play');if(pp.getAttribute('aria-label')!==l)pp.setAttribute('aria-label',l)}});
 const b=r.querySelector('.r-bb');if(b&&!b.contains(document.activeElement)&&!(R.downBB&&Date.now()-(R.downAt||0)<800)){const val=(b.querySelector('input')||{}).value||'';const nb=setO(b,barH());if(nb!==b){const ni=nb.querySelector('input');if(ni)ni.value=val}}
 else if(b){const t=document.createElement('div');t.innerHTML=barH();b.querySelectorAll('.r-orbs [data-a=mic],.r-orbs [data-a=spk]').forEach(x=>{const n=t.querySelector('[data-a='+x.dataset.a+']');const nm=h=>h.replace(/ r-live/g,'');if(n&&nm(n.outerHTML)!==nm(x.outerHTML))x.replaceWith(n)})}}
function pinMsgs(m){if(m.__ro)return;m.__pin=true;m.addEventListener('scroll',()=>{m.__pin=m.scrollHeight-m.scrollTop-m.clientHeight<40},{passive:true});
 /* when the space for messages grows or shrinks (keyboard, a knock at the door, the drawer) the newest stay in view */
 try{m.__ro=new ResizeObserver(()=>{if(m.__pin)m.scrollTop=m.scrollHeight});m.__ro.observe(m)}catch(e){m.__ro=1}}
function paintMsgs(){const m=root()&&root().querySelector('.r-msgs');if(!m)return;pinMsgs(m);const html=msgsH();if(m.__h===html)return;const atEnd=!m.__seen||m.__pin!==false;m.innerHTML=html;m.__h=html;m.__seen=1;
 /* new messages keep the newest in view, unless the person has scrolled back to read older ones */
 if(atEnd){m.scrollTop=m.scrollHeight;requestAnimationFrame(()=>{m.scrollTop=m.scrollHeight})}}
/* typing: the messages rise into a clear glass panel above the keyboard; closing the keyboard puts them back */
function typing(on){const r=root();if(!r||R.typing===on)return;R.typing=on;r.classList.toggle('r-typing',on);r.scrollTop=0;{const m0=r.querySelector('.r-msgs');if(m0){m0.__seen=0;m0.__pin=true}}paintMsgs();if(!on)setTimeout(()=>{const m=r.querySelector('.r-msgs');if(m)m.scrollTop=m.scrollHeight},300);const m=r.querySelector('.r-msgs');if(m&&on){requestAnimationFrame(()=>{m.scrollTop=m.scrollHeight});setTimeout(()=>{m.scrollTop=m.scrollHeight},80);setTimeout(()=>{m.scrollTop=m.scrollHeight},400)}}
/* the controls on the picture: shown on a touch, gone after 3.5 s while the film plays, always there while it is paused */
function uiShow(on){const sg=root()&&root().querySelector('.r-stg');if(!sg)return;clearTimeout(R.uiT);R.uiT=0;sg.classList.toggle('r-ui',!!on);if(on)R.uiT=setTimeout(()=>{R.uiT=0;const c=cs();if(c&&c.playing&&!R.seeking&&sg.isConnected)sg.classList.remove('r-ui')},3500)}
/* the film's sound: iOS sometimes brings the film back muted (after the app was in the background, a call, a locked screen) or stopped.
   The salon puts the sound back by itself, but never against the person's own choice: the film's mute button wins */
function filmSound(force){if(window.WakhanRoomAudio?.restoring?.()||document.hidden&&window.WakhanRoomAudio?.owns?.())return;const c=cs();if(!c||!c.vid||(typeof BG!=='undefined'&&BG.on))return;const nv=isNat(c)&&natV();
 if(nv){if(R.fmute){if(!nv.muted)nv.muted=true}else if(nv.muted)nv.muted=false;if(force&&c.playing&&nv.paused)nv.play().catch(()=>{});return}
 const P=typeof YTP!=='undefined'?YTP:null;if(!P||typeof YTOK==='undefined'||!YTOK)return;let st=-1,m=null;try{st=P.getPlayerState();m=P.isMuted?P.isMuted():null}catch(e){return}
 try{if(R.fmute){if(m===false)P.mute()}else if(m===true)P.unMute();
  if(c.playing&&st!==1&&st!==3&&(force||st===2||st===5||st===-1)){if(typeof WMC!=='undefined'&&WMC){WMC.blocked=false;WMC.gesture=true}P.playVideo()}}catch(e){}}
/* time and progress of the screen */
function tickUi(){const r=root();if(!r)return;if((window.WKM&&WKM.video())){try{WKM.ui()}catch(e){}return}{const c0=cs();if(c0&&c0.vid){{const sg=r.querySelector('.r-stg');if(sg){if(!c0.playing){if(!sg.classList.contains('r-ui'))sg.classList.add('r-ui')}else if(sg.classList.contains('r-ui')&&!R.uiT)uiShow(true)}}if(!R.sgAt||Date.now()-R.sgAt>2000){R.sgAt=Date.now();filmSound(false)}}}if(document.body.classList.contains('wmc-theater'))guardEngine();const c=cs();if(!c||!c.vid)return;let cur=0,dur=0;
 const nv=isNat(c)&&natV();if(nv){reNat();cur=nv.currentTime||0;dur=isFinite(nv.duration)?nv.duration:0}else try{cur=YTP.getCurrentTime();dur=YTP.getDuration();if(!isFinite(cur))cur=cExp()}catch(e){try{cur=cExp()}catch(_){}}
 ytHint(r,c);const t0=mmss(cur),t1=mmss(dur||c.dur||0),w=(dur?Math.min(100,100*cur/dur):0).toFixed(1)+'%';r.querySelectorAll('.r-t0').forEach(a=>setT(a,t0));r.querySelectorAll('.r-t1').forEach(b=>setT(b,t1));r.querySelectorAll('.r-bar i').forEach(bar=>{if(bar.style.width!==w)bar.style.width=w})}

/* YouTube on the iPhone starts only after one touch on the film itself (the touch has to land inside YouTube's own player).
   When the film should be playing but has not started, a small note says so; the note lets the touch through to the film. */
const IN_APP=(()=>{try{return !!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform())}catch(e){return false}})();
function ytFree(){if(!IN_APP)return;try{WMC.gesture=true}catch(e){}}
/* every answer from the server passes here first: a YouTube film loses the server's video-file details, on every path */
function ytNoCopy(){try{if(typeof api!=='function'||api.__ytnc)return;const o=api;const w=async function(){const j=await o.apply(this,arguments);try{const m=j&&j.media;if(m&&m.kind==='native'&&(m.provider==='youtube'||/^[\w-]{11}$/.test(String(j.vid||''))))j.media=null}catch(e){}return j};w.__ytnc=1;api=w;window.api=w}catch(e){}}
ytNoCopy();
function ytLead(){const s=seats(),m=mine();if(m<0)return false;for(let i=0;i<s.length;i++){if(s[i])return i===m}return false}
function ytHeal(){if(R.ytHeal&&Date.now()-R.ytHeal<4000)return;R.ytHeal=Date.now();ytFree();try{WMC.blocked=false;cinApply()}catch(e){}try{YTP&&YTP.playVideo&&YTP.playVideo()}catch(e){}}
function ytSkip(c){if(!c||!c.vid||!canCtl())return;window.WakhanSalonMusic&&WakhanSalonMusic.advance('unplayable',null,c.vid).catch(()=>{})}
function ytRepeat(){} /* repeat/advance is decided once by the salon server */
function ytHint(r,c){ytFree();ytRepeat();ytNoCopy();const scr=r.querySelector('.r-scr');if(!scr)return;let want='',code=0;
 /* every reading is taken on its own: a player that is missing or half-made still shows the note (and the line that says why) */
 const P=typeof YTP!=='undefined'?YTP:null,g=(f,x)=>{try{const v=f();return v===undefined?x:v}catch(e){return x}};
 if(!isNat(c)){
  if(g(()=>WMC.error,'')==='youtube'){ytSkip(c)}
  else if(c.playing){const st=P?g(()=>P.getPlayerState(),-1):-1,quiet=P&&typeof P.heard==='function'?P.heard():(P?0:Infinity);
   /* stuck: no player, YouTube has not answered at all, or it is neither playing nor loading */
   const bad=!P||quiet>4000||(st!==1&&st!==3);if(!bad)R.ytBad=0;else{if(!R.ytBad)R.ytBad=Date.now();if(Date.now()-R.ytBad>3500)ytHeal();if(Date.now()-R.ytBad>9000)want='tap'}}else R.ytBad=0}
 let h=scr.querySelector('.r-yth');if(!want){if(h)h.remove();return}
 const dg=(()=>{const d=g(()=>WK_YTP.diag,null),ids=document.querySelectorAll('[id=yt]').length,sh=g(()=>!!(window.YT&&YT.wakhan),false);
  return `yt ${sh?'S':'R'} p${P?(P._f?(P._f.isConnected?'c':'d'):'x'):'0'} ${P&&g(()=>P.isReady(),false)?'r':'-'} ${d?d.msgs+'/'+d.taken+'/'+d.ticks:'-'} n${g(()=>WK_YTP.live.size,'-')} i${ids} ${d?String(d.origin).replace(/^https?:\/\//,'').slice(0,22):''}`})();
 if(h&&h.dataset.k===want+code){const i=h.querySelector('.r-ydg');if(i&&i.textContent!==dg)i.textContent=dg;return}if(h)h.remove();h=document.createElement('div');h.className='r-yth r-yth-'+want;h.dataset.k=want+code;
 h.innerHTML=(want==='tap'?`<span>${sv('play',2)}${esc(tx('ytTap'))}</span>`:`<span>${esc(tx('ytErr'))}${code?` · <bdi>${code}</bdi>`:''}</span><button type="button" data-yr="1">${esc(tx('retry'))}</button>`)+`<i class="r-ydg" dir="ltr">${esc(dg)}</i>`;
 const b=h.querySelector('[data-yr]');if(b)b.onclick=e=>{e.stopPropagation();try{wmcRetryVideo()}catch(_){}h.remove()};scr.appendChild(h)}

/* ---------- small glass notes and action pills above the messages, as in the design */
function note(msg,icon){const a=root()&&root().querySelector('.r-acts');if(!a)return;clearTimeout(R.acts);a.innerHTML=`<div class="r-pill">${icon?sv(icon,2):''}<span>${esc(msg)}</span></div>`;R.acts=setTimeout(()=>{a.innerHTML=''},2600)}
function actions(list){const a=root()&&root().querySelector('.r-acts');if(!a)return;clearTimeout(R.acts);
 a.innerHTML=list.map((x,k)=>`<button class="r-pill r-act${x[3]?' r-red':''}" data-k="${k}">${sv(x[1],2)}<span>${esc(x[0])}</span></button>`).join('');
 a.onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;a.innerHTML='';list[+b.dataset.k][2]()};R.acts=setTimeout(()=>{a.innerHTML=''},5000)}
function sheet(title,sub,body,bind){const w=document.createElement('div');w.className='slr-sh';w.dir=RTL()?'rtl':'ltr';
 w.innerHTML=`<div class="r-bx" role="dialog" aria-label="${esc(title)}"><i class="r-gr"></i><div class="r-sh-hd"><div><b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div><button class="r-xx" data-s="x" aria-label="${esc(tx('cancel'))}">${sv('x',2)}</button></div>${body}</div>`;
 document.body.appendChild(w);const close=()=>{w.classList.add('out');setTimeout(()=>w.remove(),200)};w.addEventListener('click',e=>{if(e.target===w||e.target.closest('[data-s=x]'))close()});bind&&bind(w.querySelector('.r-bx'),close);return close}

/* ---------- seats */
async function sit(i){const c=cs();if(!c||R.busy)return;R.busy=true;hap();const prev=c.seats.slice(),pm=c.mine;
 c.seats=c.seats.map(x=>x&&Number(x.id)===me()?null:x);c.seats[i]={id:me(),name:myName()};c.mine=i;R.pend={i};paint();
 let j=null;try{j=await api('/api/c/'+cid(),{a:'sit',i})}catch(e){}
 R.busy=false;R.pend=null;
 if(!j||!j.ok){c.seats=prev;c.mine=pm;paint();const e=j&&j.err;
  if(e==='hall_seat_locked'){if(R.info&&!locks().includes(i))R.info.locks=locks().concat(i);paint();note(tx('locked'),'lock')}
  else if(e==='taken')note(tx('taken'),'user');else if(e)note(tx('denied'),'lock');else note(tx('offline'),'x');
  try{const k=await api('/api/c/'+cid()+'?v=0');if(k&&k.ok)cinSet(k)}catch(_){}return}
 try{cinSet(j)}catch(e){}filmWake()}
/* after sitting down: start the film only if it is not already running. A YouTube film that already plays in step is left alone,
   because every jump makes YouTube load again and the sound stops for a moment (it did, on each change of seat) */
function filmWake(){const c=cs();if(!c||!c.vid||isNat(c))return;const P=typeof YTP!=='undefined'?YTP:null;
 if(P&&typeof YTOK!=='undefined'&&YTOK&&c.playing){let st=-1,cur=NaN,e=NaN,m=false;try{st=P.getPlayerState();cur=Number(P.getCurrentTime());e=cExp();m=!!(P.isMuted&&P.isMuted())}catch(x){}
  if((st===1||st===3)&&(!isFinite(cur)||Math.abs(cur-e)<2.5)){if(m&&!R.fmute)try{P.unMute()}catch(x){}return}}
 try{unlockYT()}catch(e){}if(R.fmute){const P2=typeof YTP!=='undefined'?YTP:null;[60,600,1500].forEach(t=>setTimeout(()=>{try{P2&&P2.mute()}catch(_){}},t))}}
async function hall(body){try{const j=await api('/api/v51/hall',Object.assign({code:cid()},body));if(j&&j.ok&&j.hall){R.info=j.hall;paint();return true}}catch(e){}note(tx('offline'),'x');return false}
function tapSeat(i){const s=seats(),x=s[i],lk=!x&&locks().includes(i);
 if(x){const uid=Number(x.id);if(uid===me())return mySeat(i);return profile(uid)}
 if(lk){hap();if(owner())return;return note(tx('locked'),'lock')}
 sit(i)}
/* the owner holds a seat for 2 seconds: an empty seat locks, a locked seat opens. No menus, no questions. */
function liftOut(i){const c=cs(),x=c&&c.seats[i];if(!x||!owner()||Number(x.id)===me())return false;const r=root();const st=r.querySelector('.r-st[data-i="'+i+'"]');const av=st&&st.querySelector('.r-who .r-av');
 try{navigator.vibrate&&navigator.vibrate([10,30,24])}catch(e){}
 if(av){const a=av.getBoundingClientRect();const tgt=r.querySelector('.r-aud')||r.querySelector('.r-audw');const t=tgt?tgt.getBoundingClientRect():{left:innerWidth/2,top:a.top+160,width:0,height:0};
  const fl=av.cloneNode(true);fl.classList.add('r-fly');Object.assign(fl.style,{left:a.left+'px',top:a.top+'px',width:a.width+'px',height:a.height+'px',backgroundImage:getComputedStyle(av).backgroundImage});document.body.appendChild(fl);
  const dx=t.left+t.width/2-(a.left+a.width/2),dy=t.top+t.height/2-(a.top+a.height/2);
  fl.animate([{transform:'translate(0,-22%) scale(1.08)',opacity:1},{transform:`translate(${dx*.45}px,${Math.min(dy,0)-60}px) scale(1.15) rotate(-8deg)`,opacity:1,offset:.45},{transform:`translate(${dx}px,${dy}px) scale(.55)`,opacity:.2}],{duration:820,easing:'cubic-bezier(.3,.1,.3,1)'}).onfinish=()=>fl.remove()}
 const prev=c.seats.slice();c.seats[i]=null;R.aud=(R.aud||[]).filter(p=>Number(p.id)!==Number(x.id)).concat([{id:x.id,name:x.name,avatar:x.avatar}]);setTimeout(()=>paint(),80);
 hall({action:'unseat',uid:Number(x.id)}).then(ok=>{if(!ok){c.seats=prev;paint();return}api('/api/c/'+cid()+'?v=0').then(k=>k&&k.ok&&cinSet(k)).catch(()=>{})});return true}
function holdSeat(i){if(!owner())return false;const s=seats();if(s[i])return false;const lk=locks().includes(i);
 try{navigator.vibrate&&navigator.vibrate([12,40,18])}catch(e){}
 if(R.info){R.info.locks=lk?locks().filter(z=>z!==i):locks().concat(i);R.popLk=lk?-1:i;paint();setTimeout(()=>{R.popLk=null},700)}
 hall({action:lk?'unlock_seat':'lock_seat',i}).then(ok=>{if(!ok&&R.info){R.info.locks=lk?locks().concat(i):locks().filter(z=>z!==i);paint()}});return true}
function seatMenuOff(){return false}


/* the seat card: a little stage with a spotlight, the chair and the person on it, and a brass seat plate */
function plate(i){const c=cols(seats().length);return tx('plate',{r:num(Math.floor(i/c)+1),s:num(i%c+1)})}
function seatCard(o){const w=document.createElement('div');w.className='slr-cd';w.dir=RTL()?'rtl':'ltr';
 w.innerHTML=`<div class="r-cx ${o.mode||''}" role="dialog" aria-label="${esc(o.title)}"><button class="r-xx" data-s="x" aria-label="${esc(tx('cancel'))}">${sv('x',2)}</button>
  <div class="r-stage" aria-hidden="true"><i class="r-beam"></i><i class="r-sp s1"></i><i class="r-sp s2"></i><i class="r-sp s3"></i><span class="r-mc">${CHAIR}<span class="r-who">${ava(o.user)}</span>${o.mode==='up'?`<i class="r-arw">${sv('chev',2.4)}</i>`:''}</span></div>
  <span class="r-plate">${sv('swap',2)}<b>${esc(plate(o.i))}</b></span><h3>${esc(o.title)}</h3><p>${esc(o.desc)}</p>
  <div class="r-btns">${o.buttons.map(b=>`<button class="r-bt ${b[2]||''}" data-s="${b[0]}">${b[3]?sv(b[3],2):''}<span>${esc(b[1])}</span></button>`).join('')}</div></div>`;
 document.body.appendChild(w);const close=()=>{w.classList.add('out');setTimeout(()=>w.remove(),260)};
 w.addEventListener('click',e=>{if(e.target===w||e.target.closest('[data-s=x]'))return close();const b=e.target.closest('[data-s]');if(!b)return;close();o.go&&o.go(b.dataset.s)});return close}
function mySeat(i){hap();seatCard({i,user:{id:me(),name:myName()},mode:'me',title:tx('mySeat'),desc:tx('tapToMove'),buttons:[['lv',tx('leaveSeat'),'r-rose','exit'],['pf',tx('myProfile'),'r-ghost','user']],
 go:async s=>{if(s==='pf')return profile(me());if(s!=='lv')return;try{const j=await api('/api/c/'+cid(),{a:'leave'});if(j&&j.ok){try{vcLeave()}catch(_){}cinSet(j);note(tx('left'),'exit');pollAud()}else note(tx('offline'),'x')}catch(_){note(tx('offline'),'x')}}})}
function unseat(x){const i=seats().findIndex(y=>y&&Number(y.id)===Number(x.id));seatCard({i:Math.max(0,i),user:x,mode:'up',title:tx('unseatQ',{n:x.name||''}),desc:tx('unseatD',{n:x.name||''}),
 buttons:[['ok',tx('unseat'),'r-rose','minus'],['x',tx('cancel'),'r-ghost']],
 go:s=>{if(s!=='ok')return;hall({action:'unseat',uid:Number(x.id)}).then(ok=>{if(ok)api('/api/c/'+cid()+'?v=0').then(k=>k&&k.ok&&cinSet(k)).catch(()=>{})})}})}
/* the audience: everyone in the salon who is not on a seat (you too, after leaving your seat) */
function audH(){const a=(R.aud||[]).filter(p=>!seats().some(x=>x&&Number(x.id)===Number(p.id)));const standing=mine()<0;
 if(standing&&!a.some(p=>Number(p.id)===me()))a.unshift({id:me(),name:myName()});
 if(!a.length)return '';a.sort((p,q)=>(Number(q.id)===me())-(Number(p.id)===me()));
 R.audA=a;return `<button class="r-aud r-aud2${standing?' r-standing':''}" data-a="audlist" aria-label="${esc(tx('aud'))} ${num(a.length)}"><i class="r-eye" aria-hidden="true">${sv('eye',2)}</i><b>${num(a.length)}</b></button>`}
function audSheet(){document.querySelectorAll('.slr-al').forEach(x=>x.remove());const a=R.audA||[];if(!a.length)return;const en=LNG();
 const w=document.createElement('div');w.className='slr-al';w.dir=RTL()?'rtl':'ltr';
 w.innerHTML=`<div class="r-alb" role="dialog" aria-label="${esc(en?G('Viewers'):'بیننده‌ها')}"><i class="r-grab"></i><div class="r-fsht">${sv('eye',1.8)}<b>${esc(en?G('Viewers'):'بیننده‌ها')}</b><small>${num(a.length)}</small></div><div class="r-all">${a.map(p=>`<button class="r-alr" data-u="${Number(p.id)}">${ava(p)}<bdi>${esc(Number(p.id)===me()?tx('you'):(p.name||''))}</bdi></button>`).join('')}</div></div>`;
 const off=()=>{w.classList.remove('on');setTimeout(()=>w.remove(),250)};
 w.addEventListener('click',e=>{const r=e.target.closest('.r-alr');if(r){const u=+r.dataset.u;off();if(u!==me())profile(u);return}if(!e.target.closest('.r-alb'))off()});
 document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('on'))}
/* ---------- someone at the door (owner): a small clear card above the messages */
function doorPaint(){const r=root();if(!r)return;let d=r.querySelector('.r-door');const k=owner()&&(R.knocks||[])[0];
 if(!k){if(d){d.classList.add('r-out');setTimeout(()=>d.remove(),220)}return}
 const html=`<span class="r-dav">${ava(k)}<i class="r-dbell">${sv('bellk',2)}</i></span><span class="r-dtx"><b><bdi>${esc(tx('atDoor',{n:k.name||''}))}</bdi></b><small>${k.username?'@'+esc(k.username):''}${R.knocks.length>1?` · ${esc(tx('moreDoor',{n:num(R.knocks.length-1)}))}`:''}</small></span><button class="r-dsee" data-a="door">${esc(tx('see'))}</button>`;
 if(d&&d.dataset.k===String(k.id)+':'+R.knocks.length)return;
 if(!d){d=document.createElement('div');d.className='r-door';const m=r.querySelector('.r-msgs');m.parentNode.insertBefore(d,m);try{navigator.vibrate&&navigator.vibrate(14)}catch(e){}}
 d.dataset.k=String(k.id)+':'+R.knocks.length;d.innerHTML=html}
function admitSheet(k){const lim=R.limit||0,full=lim&&R.present>=lim,can=!full||lim<16;const w=document.createElement('div');w.className='slr-sh slr-ad';w.dir=RTL()?'rtl':'ltr';
 w.innerHTML=`<div class="r-bx" role="dialog" aria-label="${esc(tx('reqTitle'))}"><i class="r-gr"></i><div class="r-sh-hd"><div><b>${esc(tx('reqTitle'))}</b></div><button class="r-xx" data-s="x" aria-label="${esc(tx('cancel'))}">${sv('x',2)}</button></div>
  <div class="r-kp">${ava(k)}<span><b><bdi>${esc(k.name||'')}</bdi></b>${k.username?`<small>@${esc(k.username)}</small>`:''}</span><i class="r-kt">${esc(tx('atDoorS'))}</i></div>
  ${full&&can?`<div class="r-lim"><b>${esc(tx('limitHit'))}</b><small>${esc(tx('limitHitD',{n:k.name||''}))}</small><div class="r-caps"><span>${esc(tx('capNow',{n:num(lim)}))}</span><i>${sv('back',2)}</i><span class="r-new">${esc(tx('capNew',{n:num(lim+1)}))}</span></div></div>`:''}
  ${full&&!can?`<div class="r-lim"><b>${esc(tx('ppl',{n:num(R.present),m:num(lim)}))}</b><small>${esc(tx('fullAll'))}</small></div>`:''}
  <div class="r-two">${can?`<button class="r-op r-pk" data-s="ok">${esc(full?tx('raiseAdmit',{n:num(lim+1)}):tx('admit'))}</button>`:`<button class="r-op" disabled>${esc(tx('fullAll'))}</button>`}<button class="r-op" data-s="no">${esc(tx('reject'))}</button></div></div>`;
 document.body.appendChild(w);const close=()=>{w.classList.add('out');setTimeout(()=>w.remove(),200)};
 w.addEventListener('click',async e=>{if(e.target===w||e.target.closest('[data-s=x]'))return close();const b=e.target.closest('[data-s=ok],[data-s=no]');if(!b||b.disabled)return;b.disabled=true;hap();
  const ok=b.dataset.s==='ok';let j=null;try{j=await api(ok?'/api/app/salon/admit':'/api/app/salon/reject',{code:cid(),uid:Number(k.id),raise:!!(ok&&full)})}catch(x){}
  close();R.knocks=(R.knocks||[]).filter(x=>Number(x.id)!==Number(k.id));doorPaint();
  if(j&&j.ok){if(j.limit)R.limit=j.limit;note(tx(ok?'admitted':'rejected',{n:k.name||''}),ok?'check':'x');pollAud()}else note(tx(j&&(j.err==='expired'||j.err==='gone')?'expiredReq':j&&j.err==='full'?'fullAll':'offline'),'x')})}
/* ---------- invite friends: link, code and the friends list */
async function invitePage(){const w=document.createElement('div');w.className='slr-pg';w.dir=RTL()?'rtl':'ltr';const code=cid();let data=null,q='';
 w.innerHTML=`<div class="r-pgh"><button class="r-pgb" data-i="back" aria-label="${esc(tx('cancel'))}">${sv('back',2)}</button><div><b>${esc(tx('invT'))}</b><small><bdi>${esc((R.room&&R.room.name)||(R.info&&R.info.name)||'')}</bdi></small></div></div>
  <label class="r-srch">${sv('search',1.8)}<input data-i="q" placeholder="${esc(tx('invFind'))}" autocomplete="off" aria-label="${esc(tx('invFind'))}"></label>
  <div class="r-ilinks"><div class="r-il"><i>${sv('link',1.8)}</i><span><b>${esc(tx('invLink'))}</b><small>${esc(tx('invLinkD'))}</small></span><button data-i="copy">${esc(tx('copy'))}</button></div>
  <div class="r-il"><i>${sv('lock',1.8)}</i><span><b>${esc(tx('code'))}</b><small class="r-code">${esc(code)}</small></span><button data-i="copyc">${esc(tx('copy'))}</button></div></div>
  <h4>${esc(tx('friends'))}</h4><div class="r-fl"><div class="r-fsk"></div><div class="r-fsk"></div><div class="r-fsk"></div></div>`;
 document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('in'));
 const close=()=>{w.classList.remove('in');w.classList.add('out');setTimeout(()=>w.remove(),260)};
 const list=()=>{const fl=w.querySelector('.r-fl');if(!data)return;const f=(data.friends||[]).filter(x=>!q||String(x.name||'').toLowerCase().includes(q)||String(x.username||'').toLowerCase().includes(q));
  if(!f.length){fl.innerHTML=`<p class="r-fe">${esc(tx((data.friends||[]).length?'noMatch':'noFriends'))}</p>`;return}
  fl.innerHTML=f.map((x,k)=>`<div class="r-fr" style="--k:${Math.min(k,8)}">${ava(x)}<span><b><bdi>${esc(x.name||'')}</bdi></b><small class="${x.online?'r-on2':''}">${esc(tx(x.online?'online':'offline2'))}</small></span><button class="${x.invited?'r-done2':''}" data-i="inv" data-u="${Number(x.id)}" ${x.invited?'disabled':''}>${x.invited?sv('check',2.2)+'<span>'+esc(tx('invited'))+'</span>':esc(tx('invite2'))}</button></div>`).join('')};
 w.addEventListener('input',e=>{if(e.target.matches('[data-i=q]')){q=e.target.value.trim().toLowerCase();list()}});
 w.addEventListener('click',async e=>{const b=e.target.closest('[data-i]');if(!b)return;const k=b.dataset.i;
  if(k==='back')return close();
  if(k==='copy'||k==='copyc'){const t=k==='copy'?(data&&data.link)||location.origin+'/r/'+code:code;try{await navigator.clipboard.writeText(t)}catch(_){try{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}catch(__){}}hap();b.textContent=tx('copied');b.classList.add('r-ok');setTimeout(()=>{b.textContent=tx('copy');b.classList.remove('r-ok')},1600);return}
  if(k==='inv'&&!b.disabled){b.disabled=true;hap();const uid=+b.dataset.u;try{const j=await api('/api/app/salon/invite',{code,uid});if(!j||!j.ok)throw 0;const x=(data.friends||[]).find(z=>Number(z.id)===uid);if(x)x.invited=true;b.classList.add('r-done2');b.innerHTML=sv('check',2.2)+'<span>'+esc(tx('invited'))+'</span>'}catch(_){b.disabled=false;note(tx('offline'),'x')}}});
 try{data=await api('/api/app/salon/invite?code='+encodeURIComponent(code))}catch(e){}if(!data||!data.ok)data={friends:[]};list()}
const r0=()=>root()||document.createElement('div');
async function pollAud(){if(!R.mounted)return;try{const j=await api('/api/app/salon/audience?code='+encodeURIComponent(cid()));if(j&&j.ok){if(j.kicked){note(tx('youKicked'),'exit');setTimeout(()=>{try{exitRoom()}catch(_){}},1400);return}R.aud=j.people||[];try{joinDiff()}catch(_){}if(j.mic)R.mic=j.mic;const pl=R.present+'/'+R.limit;R.present=j.present||0;R.limit=j.limit||0;R.knocks=j.knocks||[];const lk=!!j.me_mic_locked,cbn=!!j.me_chat_banned;if(lk!==!!R.meLocked||cbn!==!!R.meChatBan){R.meLocked=lk;R.meChatBan=cbn;if(lk){try{const v=vc();if(v&&v.on&&!v.mute)vcMute()}catch(e){}}const bb=r0().querySelector('.r-bb');if(bb&&!bb.contains(document.activeElement)&&!(R.downBB&&Date.now()-(R.downAt||0)<800)){setO(bb,barH())}}R.chatBan=j.chat_banned||R.chatBan;const r=root(),el=r&&r.querySelector('.r-audw');setH(el,audH());setH(r&&r.querySelector('.r-faud'),audH());if(pl!==R.present+'/'+R.limit){setO(r&&r.querySelector('.r-hd'),headH())}doorPaint()}}catch(e){}}
/* every face in the salon (my own too) opens the same clear-glass person card of the design; the old app profile is not used here */
function profile(uid){const fn=window.SLR3_PAGES&&SLR3_PAGES.profile;if(fn)return fn(uid);personCard(Number(uid))}
/* ---------- the person card (salon): the face lifts off its seat and lands in the middle of a glass card with a glowing ring.
   ✕ on the left, ⋯ on the right; the sound, mic and chat switches and report/block live in the ⋯ menu. */
function personCard(uid){const {p,i}=personOf(uid);const self=uid===me();let d=Object.assign({id:uid,name:p.name||(self?myName():''),avatar:p.avatar},p);const own=owner()&&!self;
 document.querySelectorAll('.slr-pc').forEach(x=>x.remove());
 const RM=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();
 const from=(()=>{try{const r=root();if(!r)return null;const ii=personOf(uid).i;let el=ii>=0&&r.querySelector('.r-st[data-i="'+ii+'"] .r-av');
   if(!el)el=[...r.querySelectorAll('[data-u="'+uid+'"] .r-av,[data-u="'+uid+'"].r-av')].find(x=>x.getBoundingClientRect().width>0);return el?el.getBoundingClientRect():null}catch(e){return null}})();
 const w=document.createElement('div');w.className='slr-pc';w.dir=RTL()?'rtl':'ltr';document.body.appendChild(w);
 const st=()=>({pm:R.pmute.has(uid),ml:ownLocked(uid),cb:(R.chatBan||[]).map(Number).includes(uid)});
 const badges=()=>{const s=st();return `${s.ml?`<i class="r-pbd">${sv('micx',2)}</i>`:''}${s.cb?`<i class="r-pbd">${sv('chatx',2)}</i>`:''}${s.pm?`<i class="r-pbd r-pbm">${sv('spkx',2)}</i>`:''}`};
 const rel=()=>{const r=d.relation;if(r==='accepted')return `<button class="r-pb r-soft" disabled>${sv('check',2)}<span>${esc(tx('friend'))}</span></button>`;if(r==='outgoing')return `<button class="r-pb r-soft" data-p="cancel">${sv('check',2)}<span>${esc(tx('reqSent'))}</span></button>`;
  if(r==='incoming')return `<button class="r-pb" data-p="accept">${sv('useradd',1.8)}<span>${esc(tx('acceptReq'))}</span></button>`;return `<button class="r-pb" data-p="follow">${sv('useradd',1.8)}<span>${esc(tx('follow'))}</span></button>`};
 const gifts=()=>{const g=d.gifts||[];const n=g.reduce((a,b)=>a+(b.count||0),0);
  return `<div class="r-gh"><b>${esc(tx('giftsRx'))}</b>${n?`<small>${esc(tx('giftsN',{n:num(n)}))}</small>`:''}</div>${n?`<div class="r-gs">${g.slice(0,6).map((x,k)=>`<span class="r-gt" style="--k:${k}"><i class="r-ga">${giftArt(x.code)}</i><em>${esc(giftName(x.code))}</em><b>${num(x.count)}</b></span>`).join('')}</div>`:`<div class="r-g0">${sv('gift',1.6)}<span>${esc(tx('noGifts'))}</span></div>`}`};
 const idl=()=>d.username?'@'+esc(d.username):d.public_id?'ID:'+esc(d.public_id):'';
 const draw=()=>{const ii=personOf(uid).i;w.innerHTML=`<div class="r-pcb" role="dialog" aria-label="${esc(d.name||'')}"><i class="r-aur"></i>
  <div class="r-phd"><button class="r-pi r-sm" data-p="x" aria-label="${esc(tx('cancel'))}">${sv('x',2)}</button>${self?'<i></i>':`<button class="r-pi r-sm" data-p="more" aria-label="${esc(tx('more'))}">${sv('more',2)}</button>`}</div>
  <div class="r-pfa"><span class="r-ring"><i class="r-rc"></i><i class="r-orb"></i>${ava(d)}</span><span class="r-pbds">${badges()}</span></div>
  <div class="r-pid"><b><bdi>${esc(d.name||'')}</bdi></b>${idl()?`<small>${idl()}</small>`:''}${ii>=0?`<span class="r-pseat">${sv('armchair',1.8)}${esc(tx('seatNo',{n:num(ii+1)}))}</span>`:''}</div>
  <div class="r-pg2">${gifts()}</div>
  ${self?'':`<div class="r-pbs"><button class="r-pb r-main" data-p="gift">${sv('gift',1.8)}<span>${esc(tx('sendGift'))}</span></button><button class="r-pb" data-p="dm">${sv('chat',1.8)}<span>${esc(tx('dm'))}</span></button>${rel()}</div>`}</div>`};
 draw();
 /* the flight: a copy of the face rises from the seat along a soft arc and lands in the ring; then the ring lights up */
 const land=()=>{const ring=w.querySelector('.r-ring');if(!ring)return;ring.classList.add('r-lit');const b=document.createElement('i');b.className='r-burst';
  b.innerHTML='<i class="r-wave"></i>'+Array.from({length:10},(_,k)=>`<i class="r-spk" style="--a:${k*36+(k%2?12:0)}deg;--d:${k%2?58:76}px;--s:${k%3?.7:1}"></i>`).join('');ring.appendChild(b);setTimeout(()=>b.remove(),1300)};
 if(RM||!from){w.classList.add('r-in');setTimeout(land,RM?0:420)}
 else{const ring=w.querySelector('.r-ring .r-av');requestAnimationFrame(()=>{const to=ring.getBoundingClientRect();if(!to.width){w.classList.add('r-in');return land()}
  const f=ring.cloneNode(true);f.classList.add('r-fly');Object.assign(f.style,{left:to.left+'px',top:to.top+'px',width:to.width+'px',height:to.height+'px'});document.body.appendChild(f);ring.style.opacity='0';
  const dx=from.left+from.width/2-(to.left+to.width/2),dy=from.top+from.height/2-(to.top+to.height/2),sc=from.width/to.width;
  w.classList.add('r-in');
  const a=f.animate([{transform:`translate(${dx}px,${dy}px) scale(${sc})`,filter:'brightness(1.4)'},{transform:`translate(${dx*.45}px,${dy*.55-60}px) scale(${(sc+1)/2*1.12})`,offset:.55},{transform:'none',filter:'brightness(1)'}],{duration:640,easing:'cubic-bezier(.3,.7,.2,1)'});
  a.onfinish=()=>{ring.style.opacity='';f.remove();land()};
  setTimeout(()=>{if(f.isConnected){ring.style.opacity='';f.remove()}},1200)})}
 let menu=null;const shut=()=>{if(menu){const m=menu;menu=null;m.classList.add('r-out');setTimeout(()=>m.remove(),200)}};
 const close=()=>{shut();w.classList.add('out');setTimeout(()=>w.remove(),260)};
 const openMenu=btn=>{if(menu)return shut();const s=st();const m=document.createElement('div');m.className='r-pmn';m.setAttribute('role','menu');
  const row=(k,ic,lbl,on,red)=>`<button class="r-mr${on?' r-on':''}${red?' r-red':''}" data-m="${k}" role="menuitemcheckbox" aria-checked="${!!on}"><i class="r-mi">${sv(ic,1.9)}</i><span>${esc(lbl)}</span>${k==='more'?`<i class="r-mch">${sv('chev',2)}</i>`:`<i class="r-sw"><i></i></i>`}</button>`;
  m.innerHTML=row('pm',s.pm?'spkx':'spk',tx('mPm'),s.pm)+(own?row('mic',s.ml?'micx':'mic',tx('mMic'),s.ml,1)+row('chat',s.cb?'chatx':'chat',tx('mChat'),s.cb,1):'')+'<i class="r-mdv"></i>'+row('more','flag',tx('mRep'),false);
  w.querySelector('.r-pcb').appendChild(m);menu=m;
  m.addEventListener('click',async e=>{e.stopPropagation();const b=e.target.closest('[data-m]');if(!b)return;const k=b.dataset.m;hap();
   if(k==='more'){close();try{wp30More(uid)}catch(_){}return}
   b.classList.add('r-busy');
   if(k==='pm'){R.pmute.has(uid)?R.pmute.delete(uid):R.pmute.add(uid);try{localStorage.setItem('slr3_pmute',JSON.stringify([...R.pmute]))}catch(_){}deafen();paint()}
   if(k==='mic'&&own){const on=ownLocked(uid);await hall({action:on?'unmute':'mute',uid})}
   if(k==='chat'&&own){const on=(R.chatBan||[]).map(Number).includes(uid);try{const j=await api('/api/app/salon/chatban',{code:cid(),uid,on:!on});if(j&&j.ok)R.chatBan=j.banned||[];else throw 0}catch(_){note(tx('offline'),'x')}}
   b.classList.remove('r-busy');const n=st(),v=k==='pm'?n.pm:k==='mic'?n.ml:n.cb;b.classList.toggle('r-on',v);b.setAttribute('aria-checked',String(v));
   b.querySelector('.r-mi').innerHTML=sv(k==='pm'?(v?'spkx':'spk'):k==='mic'?(v?'micx':'mic'):(v?'chatx':'chat'),1.9);const bd=w.querySelector('.r-pbds');if(bd)bd.innerHTML=badges()})};
 w.addEventListener('click',async e=>{if(menu&&!e.target.closest('.r-pmn')&&!e.target.closest('[data-p=more]'))shut();if(e.target===w)return close();const b=e.target.closest('[data-p]');if(!b||b.disabled)return;const k=b.dataset.p;hap();
  if(k==='x')return close();
  if(k==='more')return openMenu(b);
  if(k==='dm'){close();try{wm70OpenDM(uid)}catch(_){}return}
  if(k==='gift'){if(personOf(uid).i<0)return note(tx('giftSeat'),'user');const fn=window.SLR3_PAGES&&SLR3_PAGES.gift;close();if(fn)return fn(uid);try{wm70GiftPicker(uid)}catch(_){}return}
  if(k==='follow'||k==='accept'||k==='cancel'){const a=k==='follow'?'request':k;try{await wm70Friend(a,uid)}catch(_){}d.relation=k==='follow'?'outgoing':k==='accept'?'accepted':'none';const keep=w.querySelector('.r-ring').classList.contains('r-lit');draw();w.classList.add('r-in','r-done');if(keep)w.querySelector('.r-ring').classList.add('r-lit')}});
 (async()=>{try{const r=await wm70Request('profile?uid='+uid);if(r&&r.profile){d=Object.assign(d,r.profile);if(w.isConnected&&!menu){const g=w.querySelector('.r-pg2');if(g)g.innerHTML=gifts();const pid=w.querySelector('.r-pid small'),l=idl();if(l&&!pid){const b=w.querySelector('.r-pid b');if(b)b.insertAdjacentHTML('afterend',`<small>${l}</small>`)}const pb=w.querySelector('.r-pbs');if(pb&&d.relation){const old=pb.lastElementChild;if(old)old.outerHTML=rel()}}}}catch(e){}})()}

function personOf(uid){uid=Number(uid);const i=seats().findIndex(x=>x&&Number(x.id)===uid);if(i>=0)return {p:seats()[i],i};const a=(R.aud||[]).find(x=>Number(x.id)===uid);return {p:a||{id:uid,name:''},i:-1}}
/* the owner's tools live in the profile's «⋯» menu, next to block and report: nothing extra on the profile itself */
function modsInto(){}
function moreMenu(uid){if(!R.mounted)return;const sec=document.querySelector('#sheet.show .wp30-menu');if(!sec||sec.classList.contains('slr-mm'))return;
 const {p,i}=personOf(uid);const own=owner()&&Number(uid)!==me();sec.classList.add('slr-mm');sec.dir=RTL()?'rtl':'ltr';
 sec.querySelectorAll('button[onclick*="wp30Kick"]').forEach(b=>b.remove());
 const old=[...sec.querySelectorAll(':scope > button')];
 const h=sec.querySelector('h3');const head=document.createElement('div');head.className='slr-mh';head.innerHTML=`${ava(p.id?p:{id:uid,name:h?h.textContent:''})}<b><bdi>${esc((h&&h.textContent)||p.name||'')}</bdi></b>${i>=0?`<small>${esc(tx('seatNo',{n:num(i+1)}))}</small>`:''}`;if(h)h.replaceWith(head);else sec.prepend(head);
 if(own){const tiles=[i>=0?['lift','lift',tx('tLift'),'',tx('unseat')]:null,['kick','door',tx('tKick'),'r-dg',tx('kick')],['ban','ban',tx('tBan'),'r-dg',tx('ban')]].filter(Boolean);
  const t=document.createElement('div');t.className='slr-mt';t.style.setProperty('--n',tiles.length);
  t.innerHTML=tiles.map((r,k)=>`<button class="slr-mrow ${r[3]}" data-m="${r[0]}" style="--k:${k}" aria-label="${esc(r[4])}"><i>${sv(r[1],1.7)}</i><span>${esc(r[2])}</span></button>`).join('');head.after(t);
  t.querySelectorAll('.slr-mrow').forEach(b=>b.addEventListener('click',()=>{hap();try{closeSheet()}catch(e){}doMod(b.dataset.m,p,i)}))}
 if(old.length){const g=document.createElement('div');g.className='slr-mg2';old.forEach((b,k)=>{b.style.setProperty('--k',k);g.appendChild(b)});sec.appendChild(g)}}
function hookMore(){try{if(typeof wp30More!=='function'||wp30More.__slr)return;const o=wp30More;const w=function(id){const r=o.apply(this,arguments);try{setTimeout(()=>moreMenu(id),0)}catch(e){}return r};w.__slr=1;wp30More=w;window.wp30More=w}catch(e){}}
setInterval(hookMore,1000);hookMore();
async function doMod(m,p,i){const name=p.name||'';const uid=Number(p.id);const c=cs();
 if(i>=0&&c&&c.seats[i]&&Number(c.seats[i].id)===uid){c.seats[i]=null;paint()}
 let ok=false;
 if(m==='lift')ok=await hall({action:'unseat',uid});
 else if(m==='ban')ok=await hall({action:'ban',uid});
 else{try{const j=await api('/api/app/salon/kick',{code:cid(),uid});ok=!!(j&&j.ok)}catch(e){}}
 if(m!=='lift'){R.aud=(R.aud||[]).filter(x=>Number(x.id)!==uid)}else if(ok){R.aud=(R.aud||[]).filter(x=>Number(x.id)!==uid).concat([{id:uid,name,avatar:p.avatar}])}
 try{const k=await api('/api/c/'+cid()+'?v=0');if(k&&k.ok)cinSet(k)}catch(e){}paint();
 if(ok)note(tx(m==='lift'?'unseated':m==='ban'?'banned':'kicked',{n:name}),m==='lift'?'swap':m==='ban'?'lock':'exit');else note(tx('offline'),'x')}

/* ---------- messages of the salon (the existing salon chat; the new chat will plug in here later) */
async function pollMsgs(){if(!R.mounted)return;const room=cid();
 try{const j=await api('/api/v70/hall?room='+encodeURIComponent(room)+'&after='+R.cur);if(!R.mounted||room!==cid()||!j||!j.ok)return;
  entryFeed()?.messages(me(),room,j.messages||[]);const ids=new Set(R.msgs.map(m=>m.id));let n=0;const nw=[];for(const m of j.messages||[])if(m.kind!=='gift'&&!ids.has(m.id)){R.msgs.push(m);nw.push(m);n++}if(R.cur)fsChat(nw);R.msgs=R.msgs.slice(-40);R.cur=j.cursor||R.cur;paintMsgs()}catch(e){}}
async function send(){const r=root();const i=r&&r.querySelector('.r-bb input');if(!i)return;const text=i.value.trim();if(!text)return;
 i.value='';const bb=i.closest('.r-bb');if(bb)bb.classList.remove('r-go');hap();let j=null;try{j=await api('/api/v70/hall',{room:cid(),text,client_key:(()=>{try{const a=new Uint8Array(16);crypto.getRandomValues(a);return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let s='';for(let i=0;i<32;i++)s+=(Math.random()*16|0).toString(16);return s}})()})}catch(e){j=null}
 if(j&&j.ok){pollMsgs();return}i.value=text;const er=j&&j.err||'';
 note(er==='seat_required'?tx('sitFirst'):(er==='salon_chat_off'||er==='hall_muted'||er==='hall_chat'||er==='chat_closed')?tx('chatClosed'):er==='subscription'?tx('chatSub'):er==='rate'||er==='slow'||er==='too_fast'?tx('chatSlow'):er?tx('chatErr')+' ('+er+')':tx('offline'),'x');try{console.warn('salon chat send',er||'no answer')}catch(_){}}

/* ---------- my mic and my speaker (no pop-ups: the icon changes, that is all) */
function flash(msg){const r=root();if(!r)return;let d=r.querySelector('.r-flash');if(d)d.remove();d=document.createElement('div');d.className='r-flash';d.textContent=msg;r.appendChild(d);setTimeout(()=>{d.classList.add('r-out');setTimeout(()=>d.remove(),300)},2200)}
async function micTap(){const v=vc();hap();if(R.meLocked){try{if(v&&v.on&&!v.mute)vcMute()}catch(e){}paint();return flash(tx('noTalk'))}
 if(R.micBusy)return;R.micBusy=true;R.micWant=!(v&&v.on&&!v.mute);micPaint();
 try{if(!v||!v.on){await vcJoin();const w=vc();if(w&&w.on&&w.mute)await vcMute()}else await vcMute()}catch(e){}
 R.micBusy=false;paint();setTimeout(micPaint,400);setTimeout(micPaint,1500)}
function micPaint(){try{fsMic()}catch(e){}const r=root(),b=r&&r.querySelector('.r-bb .r-mic');if(!b)return;const on=R.micBusy?!!R.micWant:!!(vc()&&vc().on&&!vc().mute);b.classList.toggle('r-on',on);b.classList.toggle('r-wait',!!R.micBusy);b.setAttribute('aria-pressed',String(on));b.innerHTML='<i class="r-halo" aria-hidden="true"></i>'+(on?DI.mic:DI.micx)}
function spkTap(){R.deaf=!R.deaf;try{SX.speaker=!R.deaf}catch(e){}hap();deafen();const r=root(),b=r&&r.querySelector('.r-bb .r-spk');if(b){b.classList.toggle('r-on',!R.deaf);b.setAttribute('aria-pressed',String(!R.deaf));b.innerHTML=R.deaf?DI.spkx:DI.spk}paint()}
function deafen(){document.querySelectorAll('audio.vca').forEach(a=>{const id=Number(String(a.id||'').replace('vca',''));a.muted=R.deaf||R.pmute.has(id)})}

/* ---------- screen controls (owner) */
function ctl(a,el,ev){if((window.WKM&&WKM.video())&&['pp','seek','b15','f15','scx'].includes(a)){const W=WKM.st();if(!W.control)return;
  if(a==='pp'){WKM.ctl(W.playing?'pause':'play');fsShow();return}
  if(a==='b15'||a==='f15'){WKM.ctl('seek',Math.max(0,WKM.pos()+(a==='f15'?15:-15)));fsShow();return}
  if(a==='seek'&&ev){const r=el.getBoundingClientRect();let f=(ev.clientX-r.left)/r.width;if(getComputedStyle(el).direction==='rtl')f=1-f;if(W.duration)WKM.ctl('seek',Math.max(0,Math.min(1,f))*W.duration);return}
  if(a==='scx'){if(!el.classList.contains('r-arm')){el.classList.add('r-arm');hap();note(tx('scrArm'),'x');clearTimeout(R.scx);R.scx=setTimeout(()=>el.classList.remove('r-arm'),3000);return}WKM.ctl('stop');return}return}
 const c=cs();if(!c)return;
 if(!canCtl()&&(a==='pp'||a==='seek'))return;
 if(!canCtl()&&(a==='b15'||a==='f15'))return;
 if(a==='pp'){try{cPlay()}catch(e){}fsShow();return}
 if(a==='b15'||a==='f15'){try{cSeek(a==='f15'?15:-15)}catch(e){}el.classList.remove('r-kk');void el.offsetWidth;el.classList.add('r-kk');fsShow();return}
 if(a==='zoom'){R.zoom=!R.zoom;el.innerHTML=sv(R.zoom?'zout':'zin',1.9);fsZoom();fsShow();return}
 if(a==='seek'&&ev){const r=el.getBoundingClientRect();let f=(ev.clientX-r.left)/r.width;if(getComputedStyle(el).direction==='rtl')f=1-f;const nv=isNat(c)&&natV();let d=0;if(nv)d=isFinite(nv.duration)?nv.duration:0;else try{d=YTP.getDuration()}catch(e){}if(!d)return;const to=Math.max(0,Math.min(d,f*d));
  void window.WakhanSalonMedia.seekTo(to);return}
 if(a==='scx'){if(!el.classList.contains('r-arm')){el.classList.add('r-arm');hap();note(tx('scrArm'),'x');clearTimeout(R.scx);R.scx=setTimeout(()=>el.classList.remove('r-arm'),3000);return}
  clearTimeout(R.scx);el.classList.remove('r-arm');el.disabled=true;const r0=root();if(r0&&r0.classList.contains('fs')){const fb=r0.querySelector('.r-ctl [data-a=fs]');if(fb)fb.click()}
  Promise.resolve(window.WakhanSalonMedia.stop()).finally(()=>{if(el.isConnected)el.disabled=false});return}
 if(a==='vol'){R.fmute=!R.fmute;const nv=natV();if(nv)nv.muted=R.fmute;try{R.fmute?YTP.mute():YTP.unMute()}catch(e){}el.innerHTML=sv(R.fmute?'volx':'vol');return}
 if(a==='fs'){const r=root();const on=r.classList.toggle('fs');const nb=r.querySelector('.r-ctl [data-a=fs]');if(nb)nb.innerHTML=sv(on?'fsx':'fs',2);try{window.WakhanOrientation&&WakhanOrientation.setFullscreen(on)}catch(e){}try{on?screen.orientation.lock('landscape').catch(()=>{}):screen.orientation.unlock()}catch(e){}if(!on)fsType(false);else fsMic();
  if(on){R.zoom=false;const zb=r.querySelector('.r-fo [data-a=zoom]');if(zb)zb.innerHTML=sv('zin',1.9);fsZoom();fsShow();clearInterval(R.tk2);R.tk2=setInterval(()=>{if(!r.classList.contains('fs'))return clearInterval(R.tk2);fsTalk()},400)}else{clearInterval(R.tk2);fsZoom()}}}

/* ---------- the keyboard: the bar rides on top of it, the room behind does not move */
/* keyboard: on the iPhone the page height shrinks together with the keyboard, so the full height from before it opened is remembered
   (the same way the old hall does) and the message bar sits right above the keyboard */
try{if(window.Capacitor&&Capacitor.getPlatform&&Capacitor.getPlatform()==='android')document.documentElement.classList.add('wk-android')}catch(e){}
function bindKb(){const vv=window.visualViewport;if(!vv||R.kbB)return;R.kbB=1;
 const typing=()=>{const a=document.activeElement;return !!(a&&a.matches&&a.matches('.slr input,.slr textarea'))};
 const f=()=>{const r=root();if(!r)return;const vis=vv.height,off=vv.offsetTop||0,w=innerWidth,t=typing();
  /* the iPhone app does not resize the page for the keyboard; it reports the keyboard itself */
  if(document.documentElement.classList.contains('wk-android')){const kb=t?Math.max(0,innerHeight-vis-off):0;r.style.setProperty('--kb',kb+'px');r.classList.toggle('kb',kb>60);const H=innerHeight,W=innerWidth;if(R.andW!==W){R.andW=W;R.andH=H;R.andOpen=false}if(!t||!R.andH)R.andH=Math.max(R.andH||0,H);else if(H>R.andH)R.andH=H;if(t){if(H<R.andH-120)R.andOpen=true;else if(R.andOpen&&H>=R.andH-40){R.andOpen=false;const a=document.activeElement;if(a&&a.matches&&a.matches('.slr .r-bb input'))try{a.blur()}catch(e){}}}else R.andOpen=false;return}
  const k=window.WakhanKeyboard&&WakhanKeyboard.viewport&&WakhanKeyboard.viewport();if(k){const kb=t?Math.max(0,Math.round(k.fullHeight-k.height),Math.round(R.capKb||0),Math.round(innerHeight-vv.height-(vv.offsetTop||0))):0;r.style.setProperty('--kb',kb+'px');r.classList.toggle('kb',kb>60);return}
  if(R.capKb!=null){const inset=(screen.height-innerHeight)>60?34:0,kb=t?Math.max(0,Math.round(R.capKb-inset)):0;r.style.setProperty('--kb',kb+'px');r.classList.toggle('kb',kb>60);return}
  if(!t&&(!R.fullH||R.fullW!==w||Date.now()>(R.kbUntil||0)))R.fullH=Math.max(innerHeight,vis+off),R.fullW=w;if(!R.fullH)R.fullH=Math.max(innerHeight,vis+off);
  if(t)R.kbUntil=Date.now()+900;const kb=t?Math.max(0,R.fullH-vis-off,innerHeight-vis-off):0;
  r.style.setProperty('--kb',kb+'px');r.classList.toggle('kb',kb>60);if(off>0&&t)try{window.scrollTo(0,0)}catch(e){}};
 R.kbUpdate=f;vv.addEventListener('resize',f);addEventListener('resize',f);R.andH=innerHeight;['keyboardDidHide','keyboardWillHide'].forEach(n=>addEventListener(n,()=>{if(!document.documentElement.classList.contains('wk-android'))return;R.andOpen=false;const a=document.activeElement;if(a&&a.matches&&a.matches('.slr .r-bb input'))setTimeout(()=>{try{if(document.activeElement===a)a.blur()}catch(e){}},60)}));vv.addEventListener('scroll',f);addEventListener('wakhanKeyboardFrame',()=>setTimeout(f,0));
 addEventListener('keyboardWillShow',e=>{R.capKb=+(e&&e.keyboardHeight)||0;f()});addEventListener('keyboardWillHide',()=>{R.capKb=0;f()});
 document.addEventListener('focusin',()=>{[0,80,250,500,900].forEach(d=>setTimeout(f,d))},true);document.addEventListener('focusout',()=>{[0,120,400].forEach(d=>setTimeout(f,d))},true);
 R.fullH=Math.max(innerHeight,vv.height+(vv.offsetTop||0));R.fullW=innerWidth}

/* ---------- events */
function bind(v){if(v.__slr)return;v.__slr=1;v.addEventListener('pointerdown',wakeAudio,true);v.addEventListener('touchend',wakeAudio,true);
 let hT=0,hEl=null,hX=0,hY=0;const hEnd=()=>{clearTimeout(hT);if(hEl)hEl.classList.remove('r-hold','r-lift');hEl=null};
 v.addEventListener('pointerdown',e=>{const st=e.target.closest('.slr .r-st');if(!st||!owner()||seats()[+st.dataset.i])return;hEnd();hEl=st;hX=e.clientX;hY=e.clientY;st.classList.add('r-hold');
  hT=setTimeout(()=>{const i=+st.dataset.i;hEnd();R.held=Date.now();try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}holdSeat(i)},500)});
 v.addEventListener('pointermove',e=>{if(hEl&&Math.hypot(e.clientX-hX,e.clientY-hY)>12)hEnd()});
 ['pointerup','pointercancel','pointerleave'].forEach(n=>v.addEventListener(n,hEnd));
 v.addEventListener('contextmenu',e=>{if(e.target.closest('.slr .r-st'))e.preventDefault()});
 v.addEventListener('click',e=>{const r=e.target.closest('.slr');if(!r)return;if(R.typing&&!e.target.closest('.r-fin')&&!R.pdIn&&!e.target.closest('.r-bb')&&!e.target.closest('.r-msgs')&&!(R.downBB&&Date.now()-(R.downAt||0)<1500)&&Date.now()-(R.focusAt||0)>700){const a=document.activeElement;if(a&&a.blur)a.blur();return}if(r.classList.contains('fs')&&e.target.closest('.r-stw')&&!e.target.closest('[data-a]')&&!e.target.closest('.r-fin')){if(r.classList.contains('fty')){fsType(false);return}const u=r.querySelector('.r-fui');if(u){if(u.classList.contains('on')){u.classList.remove('on');clearTimeout(R.fsT)}else fsShow()}return}const st=e.target.closest('.r-st');if(st){if(R.held&&Date.now()-R.held<700)return;return tapSeat(+st.dataset.i)}
  const ma=e.target.closest('.r-ma,.r-ap');if(ma){if(+ma.dataset.u===me()&&mine()<0)return note(tx('standHint'),'swap');return profile(+ma.dataset.u)}
  if(!r.classList.contains('fs')){const sg=e.target.closest('.r-stg');if(sg&&!e.target.closest('[data-a]')&&!e.target.closest('.r-yth-err')){uiShow(!sg.classList.contains('r-ui'));return}if(sg)uiShow(true)}
  const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
  if(a==='mic')return micTap().then(fsMic);if(a==='fchat'){const f=r.querySelector('.r-fin');return fsType(f&&f.hidden)}if(a==='spk')return spkTap();if(a==='send')return send();
  if(a==='fseats'){if(e.target.closest('.r-fshb')&&!e.target.closest('.r-grab'))return;R.fsh=!R.fsh;const f=r.querySelector('.r-fsh');if(f)f.classList.toggle('on',R.fsh);return}
  if(a==='fchat2'){R.chatOff=!R.chatOff;r.classList.toggle('r-chatoff',R.chatOff);b.innerHTML=sv(R.chatOff?'chat':'chatx',1.8);b.setAttribute('aria-pressed',String(!R.chatOff));return}
  if(a==='audlist')return audSheet();
  if(a==='xjoin'){b.style.pointerEvents='none';api('/api/app/salon/x/join',{code:cid()}).then(j=>{if(j&&j.ok){note(LNG()?G('You joined this salon'):'عضو این سالون شدی','check');pollX()}else{b.style.pointerEvents='';note(j&&j.err==='members_full'?(LNG()?G('This salon already has 200 members'):'این سالون 200 عضو دارد و پر است'):j&&(j.err==='private'||j.err==='banned')?(LNG()?G('You cannot join this salon'):'نمی‌توانی عضو این سالون شوی'):tx('offline'),'x')}}).catch(()=>{b.style.pointerEvents='';note(tx('offline'),'x')});return}
  if(a==='npx'){if(!npMine())return;R.npOpen=!R.npOpen;R.npAt=Date.now();return npPaint()}
  if(a==='npstop'||a==='nppp'||a==='npnext'){R.npAt=Date.now();const code=cid(),c=cs();b.disabled=true;const done=()=>{b.disabled=false;npPaint()};
   if((window.WKM&&WKM.on()&&!WKM.video())){const W=WKM.st();if(a==='nppp'){WKM.ctl(W.playing?'pause':'play').finally(()=>setTimeout(done,300));return}
    if(a==='npstop'){WKM.ctl('stop').finally(()=>{R.npOpen=false;done()});return}
    WKM.ctl('stop').finally(()=>api('/api/c/'+encodeURIComponent(code),{a:'next'}).then(j=>{if(j&&j.ok){try{cinSet(j)}catch(e){}}else note(LNG()?G('The queue is empty'):'صف خالی است','x');done()}).catch(()=>{note(tx('offline'),'x');done()}));return}
   if(a==='nppp'){try{(window.cPlay||(()=>{}))()}catch(e){}setTimeout(done,500);return}
   if(a==='npnext'){WakhanSalonMusic.advance('next').then(j=>{if(j&&j.ok){try{cinSet(j)}catch(e){}}else note(LNG()?G('The queue is empty'):'صف خالی است','x');done()}).catch(()=>{note(tx('offline'),'x');done()});return}
   (()=>{try{const c0=(typeof CS!=='undefined'&&CS)||null;window.__npStop={vid:(c0&&c0.vid)||'',ver:Number(c0&&c0.ver),at:Date.now()};if(!window.__npGuard&&typeof cinApply==='function'){window.__npGuard=1;const hold=()=>{try{const g=window.__npStop;if(!g||!g.vid||!CS||CS.vid!==g.vid||Date.now()-g.at>20000)return false;const v=Number(CS.ver);return !(Number.isFinite(v)&&Number.isFinite(g.ver)&&v>g.ver)}catch(e){return false}};const quiet=()=>{try{if(typeof YTP!=='undefined'&&YTP&&YTP.getPlayerState&&YTP.getPlayerState()===1)YTP.pauseVideo()}catch(e){}try{if(typeof SX!=='undefined'&&SX.audio&&!SX.audio.paused)SX.audio.pause()}catch(e){}};const ca=cinApply;cinApply=function(){if(hold()){quiet();return}return ca.apply(this,arguments)};if(typeof sxApplyAudio==='function'){const sa=sxApplyAudio;sxApplyAudio=function(){if(hold()){quiet();return}return sa.apply(this,arguments)};try{window.sxApplyAudio=sxApplyAudio}catch(e){}}window.__npHold=hold;window.__npQuiet=quiet}try{if(typeof YTP!=='undefined'&&YTP&&!YTP.__npw&&YTP.playVideo){const pv=YTP.playVideo,sk=YTP.seekTo;YTP.playVideo=function(){if(window.__npHold())return;return pv.apply(this,arguments)};if(sk)YTP.seekTo=function(){if(window.__npHold())return;return sk.apply(this,arguments)};YTP.__npw=1}}catch(e){}try{const a=typeof SX!=='undefined'&&SX.audio;if(a&&!a.__npw){const pl=a.play;a.play=function(){if(window.__npHold())return Promise.resolve();return pl.apply(this,arguments)};a.__npw=1}}catch(e){}clearInterval(window.__npIv);window.__npIv=setInterval(()=>{try{if(window.__npHold())window.__npQuiet();else clearInterval(window.__npIv)}catch(e){clearInterval(window.__npIv)}},200);if(c0)c0.playing=false}catch(e){}try{if(typeof YTP!=='undefined'&&YTP&&YTP.pauseVideo)YTP.pauseVideo()}catch(e){}try{if(typeof SX!=='undefined'&&SX.audio)SX.audio.pause()}catch(e){}document.querySelectorAll('video.r-nv:not(.wkm-v)').forEach(v=>{try{v.pause()}catch(e){}})})();api('/api/app/salon/screen',{code,action:'close'}).then(j=>{if(!j||!j.ok)note(tx('offline'),'x');else{try{if(typeof CS!=='undefined'&&CS){CS.vid='';CS.playing=false;CS.media=null;CS.t=0;if(R.x)R.x.music=null;cinApply()}}catch(e){}}R.npOpen=false;done()}).catch(()=>{note(tx('offline'),'x');done()});return}
  if(a==='mtap'){try{wmcWatch()}catch(e){}try{if(typeof SX!=='undefined'&&SX.audio)SX.audio.play().catch(()=>{})}catch(e){}return}
  if(a==='invite')return invitePage();
  if(a==='door'){const k=(R.knocks||[])[0];if(k)return admitSheet(k);return}
  if(a==='exit'){const fn=window.SLR3_PAGES&&SLR3_PAGES.exit;if(fn)return fn();return actions([[tx('minimize'),'minus',()=>note(tx('soon'))],[tx('leave'),'exit',()=>{try{exitRoom()}catch(_){}},1]])}
  if(['pp','seek','vol','fs','zoom','b15','f15','scx'].includes(a))return ctl(a,b,e);
  const fn=window.SLR3_PAGES&&SLR3_PAGES[a];if(fn)return fn();note(tx('soon'))});
 v.addEventListener('submit',async e=>{const f=e.target.closest('.slr .r-fin');if(!f)return;e.preventDefault();const i=f.querySelector('input');const text=i.value.trim();if(!text)return;i.value='';hap();try{const j=await api('/api/v70/hall',{room:cid(),text,client_key:(()=>{try{const a=new Uint8Array(16);crypto.getRandomValues(a);return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let s='';for(let i=0;i<32;i++)s+=(Math.random()*16|0).toString(16);return s}})()});if(!j||!j.ok)throw 0;pollMsgs()}catch(_){i.value=text}});
 v.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.slr .r-bb input')){e.preventDefault();send()}});
 v.addEventListener('pointerdown',e=>{R.pdIn=!!(e.target.closest&&e.target.closest('.slr .r-bb,.slr .r-msgs'))},true);
 v.addEventListener('mousedown',e=>{if(R.typing&&e.target.closest('.slr .r-sd'))e.preventDefault()});
 /* (the send button's own finger listener lives on the salon page itself, not on the whole app) */
 /* the bar stays exactly where the finger touched it until the keyboard lifts it: if it jumped at once, the iPhone's «click» that
    follows the touch landed beside the bar, counted as a tap outside, and closed the keyboard again before it could open */
 v.addEventListener('focusin',e=>{if(!e.target.matches('.slr .r-bb input'))return;R.focusAt=Date.now();const r=root(),bb=e.target.closest('.r-bb');
  if(r&&bb&&!R.typing){const off=Math.max(6,Math.round(r.getBoundingClientRect().bottom-bb.getBoundingClientRect().bottom));r.style.setProperty('--bb0',off+'px')}typing(true)});
 v.addEventListener('pointerdown',e=>{R.downBB=!!(e.target.closest&&e.target.closest('.slr .r-bb'));R.downAt=Date.now()},true);
 v.addEventListener('focusout',e=>{if(e.target.matches('.slr .r-bb input'))setTimeout(()=>{const a=document.activeElement;if(!(a&&a.matches&&a.matches('.slr .r-bb input')))typing(false)},120)});
 v.addEventListener('input',e=>{if(e.target.matches('.slr .r-bb input')){const b=e.target.closest('.r-bb');b.classList.toggle('r-go',!!e.target.value.trim())}})}

/* ---------- mount / unmount (called by the cinema tab when a salon is open) */
let metaLoad=null,metaSequence=0;
function loadMeta(force=false){
 const code=cid();if(!code)return Promise.resolve();if(!force&&metaLoad?.code===code)return metaLoad.task;
 const seq=++metaSequence;
 const task=Promise.resolve().then(async()=>{try{const [a,b]=await Promise.all([api('/api/v51/hall?code='+encodeURIComponent(code)).catch(()=>null),api('/api/app/salon/room?code='+encodeURIComponent(code)).catch(()=>null)]);
  if(seq!==metaSequence||code!==cid()||!R.mounted)return;
  const nextInfo=a?.ok?a.hall:R.info,nextRoom=b?.ok?b:R.room,changed=JSON.stringify([R.info,R.room])!==JSON.stringify([nextInfo,nextRoom]);
  if(!changed)return;R.info=nextInfo;R.room=nextRoom;acceptNotice();paint();
  try{const r=root();if(r&&R.room){const bi=r.querySelector('.r-bgi');if(bi&&R.room.bg)bi.style.setProperty('--bg',`url('${R.room.bg}')`);const bv=r.querySelector('.r-bgv');if(bv&&R.room.dim!=null)bv.style.boxShadow=`inset 0 0 0 100vmax rgba(10,6,20,${Number(R.room.dim)||0})`}}catch(_){}
 }catch(e){}finally{if(metaLoad?.task===task)metaLoad=null}});metaLoad={code,task};return task;
}
/* only the salon's own film may sound: a YouTube player left behind on another page (the YouTube watch page, the small card)
   is closed when the salon opens, so its sound can never run on under the salon */
function ghostsOff(){try{const L=window.WK_YTP&&WK_YTP.live;if(!L)return;const own=typeof YTP!=='undefined'?YTP:null;for(const p of [...L])if(p!==own&&!p._s9)try{p.destroy()}catch(e){}}catch(e){}}
function mount(){const v=host();if(!v)return;R.mounted=true;++metaSequence;metaLoad=null;R.sysl=[];R.jd=null;R.fsh=false;R.x=null;R.xk='';setTimeout(pollX,600);try{R.deaf=SX.speaker===false}catch(e){}guardEngine();ghostsOff();R.code=cid();entryFeed()?.ensure(me(),R.code);try{window.scrollTo(0,0)}catch(e){}R.msgs=[];R.cur=0;R.aud=[];R.last='';style();bind(v);paint(true);loadMeta();
 /* while the engine is still joining it already asks for the room; start the regular updates right after, not twice at once */
 const go=()=>{try{cinStart()}catch(e){}};if(typeof WMC!=='undefined'&&WMC&&WMC.joining){let n=0;const w=setInterval(()=>{if(!WMC.joining||++n>60){clearInterval(w);if(R.mounted)go()}},80)}else go();
 clearInterval(R.poll);R.poll=setInterval(()=>{if(!alive())return unmount();pollMsgs();deafen();R.n=(R.n||0)+1;if(R.n%2===0){pollAud();pollX();if(!document.hidden)void loadMeta()}},2500);pollMsgs();pollAud();
 clearInterval(R.tick);R.tick=setInterval(tickUi,1000);clearInterval(R.tk);R.tk=setInterval(talkSync,90);
 if(window.SLR3_WELCOME){const w=window.SLR3_WELCOME;window.SLR3_WELCOME=null;setTimeout(()=>welcome(w),700)}}
/* back in front (after the home screen, a call, a locked phone): the film and its sound come back without any touch; if iOS still
   wants one, the first touch anywhere in the salon does it (wakeAudio) */
/* away from the app: iOS stops film pictures (video players) in the background, but not sound-only playback. An archive film
   hands its sound to a hidden sound player at the same second while the app is away (also from the small card), and takes it
   back on return; the lock screen shows the film and the salon */
const BG={a:null,on:false,v:null,vid:''};
function bgVideo(){try{if(alive()){const c=cs();if(c&&isNat(c))return natV()}const cv=document.querySelector('.s9-card video');if(cv&&cv.isConnected)return cv}catch(e){}return null}
function bgOut(){if(window.WakhanRoomAudio?.owns?.())return;try{const c=cs();if(!c||!c.vid||!c.playing||R.fmute||!isNat(c))return;const v=bgVideo();if(!v)return;const src=v.currentSrc||v.src;if(!src)return;
 let a=BG.a;if(!a){a=document.createElement('audio');a.setAttribute('playsinline','');a.preload='auto';a.style.display='none';document.body.appendChild(a);BG.a=a}
 if(a.src!==src)a.src=src;try{a.currentTime=isFinite(v.currentTime)&&v.currentTime>0?v.currentTime:cExp()}catch(e){}a.muted=false;BG.v=v;BG.vid=c.vid;
 const p=a.play();BG.on=true;if(p&&p.catch)p.catch(()=>{BG.on=false;try{v.muted=!!R.fmute}catch(_){}});try{v.muted=true}catch(e){}
 try{if(navigator.mediaSession&&window.MediaMetadata){const room=(R.room&&R.room.name)||(R.info&&R.info.name)||'';navigator.mediaSession.metadata=new MediaMetadata({title:c.title||room,artist:room,artwork:[{src:new URL(poster(c),location.href).href,sizes:'512x512'}]})}}catch(e){}}catch(e){}}
function bgIn(){try{const a=BG.a;if(!a||!BG.on)return;BG.on=false;const t=a.currentTime;a.pause();const v=BG.v&&BG.v.isConnected?BG.v:bgVideo();BG.v=null;
 if(v){try{if(isFinite(t)&&t>0&&Math.abs((v.currentTime||0)-t)>.3)v.currentTime=t}catch(e){}v.muted=!!R.fmute;const c=cs();if(c&&c.playing&&v.paused)v.play().catch(()=>{})}}catch(e){}}
/* while away the salon goes on: a new film or a pause stops the borrowed sound; drifting more than 4 s is put right */
setInterval(()=>{try{if(!BG.on||!BG.a)return;const c=cs();if(!c||!c.playing||c.vid!==BG.vid||R.fmute){BG.a.pause();BG.on=false;return}const e=cExp();if(isFinite(e)&&Math.abs(BG.a.currentTime-e)>4)BG.a.currentTime=e}catch(e){}},2000);
/* 0.2.71: once the salon player has really played here, the next song from the queue may start by itself
   (before, it was only cued and stood still until the person changed seat or tapped) */
const YC={s:-9,playAt:0,waitAt:0,nxk:''};
setInterval(()=>{try{const r=root();const el=r&&r.querySelector('.r-ytc');if(!el)return;const scr=el.parentElement,c=cs();if(!c||!c.vid)return;
 let st=-1;try{st=(typeof YTP!=='undefined'&&YTP&&YTP.getPlayerState)?YTP.getPlayerState():-1}catch(e){}
 {const md=c.media||{};if(md.kind==='soundcloud'||String(c.vid).startsWith('sc:')){try{const au=typeof SX!=='undefined'&&SX.audio;st=au&&!au.paused?1:(c.playing?-1:2)}catch(e){}}}
 const now=Date.now();if(st===1&&YC.s!==1)YC.playAt=now;if(st!==1&&c.playing){if(!YC.waitAt)YC.waitAt=now}else YC.waitAt=0;YC.s=st;
 let m='';if(st===1)m=now-YC.playAt<2500?'load':'';else if(st===0)m='end';else if(c.playing)m=now-YC.waitAt>3500?'tap':'load';else m='pause';
 scr.classList.toggle('r-ytlock',st===1);

 {const mu=r.classList.contains('r-music');r.classList.toggle('r-mtapon',mu&&m==='tap');if(mu&&m==='tap'){const t=r.querySelector('.r-mtap');if(t){const q=t.getBoundingClientRect(),sw=r.querySelector('.r-stw');if(sw&&q.width){sw.style.setProperty('--tx',q.left+'px');sw.style.setProperty('--ty',q.top+'px');sw.style.setProperty('--tw',q.width+'px');sw.style.setProperty('--th',q.height+'px')}}}if(mu&&!r.querySelector('.r-mtap')){const t=document.createElement('button');t.className='r-mtap';t.dataset.a='mtap';t.innerHTML=`${sv('vol',2)}<span>${esc(LNG()?G('Tap to hear'):'برای شنیدن بزن')}</span>`;const a=r.querySelector('.r-audw');if(a)a.after(t)}}
 if(el.dataset.m!==m){el.dataset.m=m;const t=el.querySelector('.r-yttap');if(t)t.textContent=LNG()?G('Tap to play'):'برای پخش بزن'}
 if(m==='end'&&window.SLR6&&SLR6.loadQ){SLR6.loadQ().then(d=>{const x=d&&d.next&&d.next[0];const k=x?String(x.id||x.title):'';if(k===YC.nxk)return;YC.nxk=k;const nx=el.querySelector('.r-ytnx');if(nx)nx.innerHTML=x?`<span class="r-ytth"><img src="${esc(x.thumb||'')}" alt=""></span><span><small>${esc(LNG()?G('Next'):'بعدی')}</small><b><bdi>${esc(x.title||'')}</bdi></b></span>`:''}).catch(()=>{})}
}catch(e){}},250);
setInterval(()=>{try{if(typeof YTP!=='undefined'&&YTP&&typeof YTOK!=='undefined'&&YTOK&&YTP.getPlayerState?.()===1&&typeof WMC!=='undefined'&&!WMC.gesture){WMC.gesture=true;WMC.blocked=false}}catch(e){}},1000);
/* 0.2.71: closing the mic lets the microphone go completely, so the phone returns to full music quality
   and stops lowering the music when you talk while your mic is closed */
try{if(typeof vcMute==='function'&&typeof SX!=='undefined'&&!window.__micRel){window.__micRel=1;const vm=vcMute;vcMute=async function(){const r=await vm.apply(this,arguments);try{if(VC&&VC.mute&&SX.mic&&!SX.micJob){const old=SX.mic;SX.mic=null;wmqSession('play-and-record');if(VC.on){VC.stream=wmqSilent();await wmqReplaceTrack(VC.stream.getAudioTracks()[0])}old.getTracks().forEach(t=>{try{t.stop()}catch(e){}})}}catch(e){}/* 0.2.75: the closed mic is let go (no lowering of the music while you talk) but the phone stays in the same sound mode (no switch, so no cut) */const again=()=>{try{if(!CS||!CS.playing)return;try{const e=Math.max(0,cExp());if(CS.media&&CS.media.kind==='soundcloud'&&SX.audio){const a=SX.audio;if(a.src&&Math.abs((a.currentTime||0)-e)>2){try{a.currentTime=e}catch(_){}}}else if(typeof YTP!=='undefined'&&YTP&&YTP.getCurrentTime){const t=Number(YTP.getCurrentTime());if(Number.isFinite(t)&&Math.abs(t-e)>3)YTP.seekTo(e,true)}}catch(_){}if(typeof YTP!=='undefined'&&YTP&&YTP.getPlayerState&&YTP.getPlayerState()!==1)YTP.playVideo();if(typeof SX!=='undefined'&&SX.audio&&SX.audio.paused&&CS.media&&CS.media.kind==='soundcloud')SX.audio.play().catch(()=>{});document.querySelectorAll('.slr video.r-nv').forEach(v=>{if(v.paused)v.play().catch(()=>{})})}catch(e){}};[150,600,1500,3000].forEach(t=>setTimeout(again,t));return r}}}catch(e){}
document.addEventListener('visibilitychange',()=>{if(document.hidden)bgOut();else bgIn()});addEventListener('pagehide',bgOut);
document.addEventListener('visibilitychange',()=>{if(document.hidden)return;R.backAt=Date.now();[400,1500,3500].forEach(t=>setTimeout(()=>{try{if(alive())filmSound(true)}catch(e){}},t))});
addEventListener('pageshow',()=>{R.backAt=Date.now();setTimeout(()=>{try{if(alive())filmSound(true)}catch(e){}},500)});
function welcome(w){const r=root();if(!r)return;const d=document.createElement('div');d.className='r-wel';d.innerHTML=`<i>${sv('check',2.4)}</i><span><b>${esc(tx('welcome'))}</b><small><bdi>${esc(tx('welcomeD',{n:w.name||''}))}</bdi></small></span>`;r.appendChild(d);setTimeout(()=>{d.classList.add('r-out');setTimeout(()=>d.remove(),300)},3600)}
function alive(){try{return R.mounted&&TAB==='c'&&cid()&&CV==='hall'&&!!root()}catch(e){return false}}
/* speaking rings follow the voice meter live (also your own); iPhone keeps the audio meter asleep until a tap, so wake it on the first touch */
function fspk(r){const st=r.querySelector('.r-stg');if(!st)return;const c=cs(),s=seats();const on=c&&c.vid&&s.length>4?s.filter(x=>x&&talking(x.id)).slice(0,6):[];const k=on.map(x=>x.id).join(',');
 let w=st.querySelector('.r-fspk');if(!w){if(!k)return;w=document.createElement('div');w.className='r-fspk';w.setAttribute('aria-hidden','true');st.appendChild(w)}if(w.__k===k)return;w.__k=k;w.innerHTML=on.map(x=>`<i>${ava(x)}</i>`).join('')}
function talkSync(){const r=root();if(!r)return;meter();const s=seats();r.querySelectorAll('.r-st[data-i]').forEach(b=>{const x=s[+b.dataset.i];b.classList.toggle('r-talk',!!(x&&talking(x.id)))});
 const o=r.querySelector('.r-orb.r-mic');if(o)o.classList.toggle('r-live',o.classList.contains('r-on')&&talking(me()));try{fsTalk()}catch(e){}try{fspk(r)}catch(e){}}
/* Speaking ring. The ring follows the voice itself, at once: my own voice is read from my own microphone, other people's from the
   sound level the voice connection already carries for each of them. Only when neither can be read the engine's guess is used. */
const TALK={me:{on:false,last:0,floor:.004,id:''},peer:{}};
function talking(id){const v=vc();if(!v||!v.on)return false;id=String(id);
 if(id===String(me())){if(v.mute||R.meLocked)return false;return TALK.me.id&&TALK.ac&&TALK.ac.state==='running'?TALK.me.on:!!(v.spk&&v.spk[id])}
 const p=TALK.peer[id];return p&&p.ok?p.on:!!(v.spk&&v.spk[id])}
function micTrack(){const v=vc();const pick=st=>{try{return st&&st.getAudioTracks().find(t=>t.readyState==='live'&&t.enabled)}catch(e){return null}};
 let t=pick(v&&v.stream);if(!t)try{t=pick(typeof SX!=='undefined'&&SX.mic)}catch(e){}return t||null}
/* a fresh sound reader for every microphone session: one made before the iPhone switched to «talk» mode lags seconds behind */
function meterCtx(fresh){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
 if(fresh&&TALK.ac){try{TALK.ac.close()}catch(e){}TALK.ac=null}
 if(!TALK.ac||TALK.ac.state==='closed'){if(!fresh)return null;try{TALK.ac=new AC({latencyHint:'interactive'})}catch(e){try{TALK.ac=new AC()}catch(_){return null}}}
 if(TALK.ac.state!=='running')TALK.ac.resume().catch(()=>{});return TALK.ac}
function meter(){const v=vc(),now=performance.now();
 /* mine */
 const m=TALK.me,t=v&&v.on&&!v.mute?micTrack():null;
 if(!t){if(m.src){try{m.src.disconnect()}catch(e){}m.src=null;m.an=null}if(m.id&&TALK.ac){try{TALK.ac.close()}catch(e){}TALK.ac=null}m.id='';m.on=false}
 else{if(m.id!==t.id){if(m.src)try{m.src.disconnect()}catch(e){}m.src=null;m.an=null;const ac=meterCtx(true);
   if(ac)try{m.an=ac.createAnalyser();m.an.fftSize=512;m.an.smoothingTimeConstant=0;m.src=ac.createMediaStreamSource(new MediaStream([t]));m.src.connect(m.an);m.buf=new Float32Array(m.an.fftSize);m.id=t.id}catch(e){m.an=null;m.id=''}}
  if(m.an&&TALK.ac&&TALK.ac.state==='running'){m.an.getFloatTimeDomainData(m.buf);let q=0;for(let i=0;i<m.buf.length;i++)q+=m.buf[i]*m.buf[i];const rms=Math.sqrt(q/m.buf.length);
   m.floor=rms<m.floor?m.floor*.7+rms*.3:Math.min(.03,m.floor*.995+rms*.005);
   if(rms>Math.max(.012,m.floor*3)){m.on=true;m.last=now}else if(now-m.last>380)m.on=false}
  else if(TALK.ac&&TALK.ac.state!=='running')meterCtx()}
 /* others */
 const pcs=(v&&v.on&&v.pcs)||{};for(const id of Object.keys(TALK.peer))if(!pcs[id])delete TALK.peer[id];
 for(const [id,o] of Object.entries(pcs)){const pc=o&&(o.pc||o);if(!pc||typeof pc.getReceivers!=='function')continue;
  const p=TALK.peer[id]||(TALK.peer[id]={on:false,last:0,ts:-1,ok:false});
  try{const rc=pc.getReceivers().find(x=>x.track&&x.track.kind==='audio');if(!rc||typeof rc.getSynchronizationSources!=='function')continue;
   const ss=rc.getSynchronizationSources()[0];if(!ss||typeof ss.audioLevel!=='number'){continue}p.ok=true;
   const fresh=ss.rtpTimestamp!==p.ts;p.ts=ss.rtpTimestamp;if(fresh&&ss.audioLevel>.02){p.on=true;p.last=now}else if(now-p.last>420)p.on=false}catch(e){}}}
function meterStop(){const m=TALK.me;if(m.src)try{m.src.disconnect()}catch(e){}m.src=null;m.an=null;m.id='';m.on=false;TALK.peer={};if(TALK.ac){try{TALK.ac.close()}catch(e){}TALK.ac=null}}
function wakeAudio(){try{if(R.wokeAt!==R.backAt){R.wokeAt=R.backAt;filmSound(true)}}catch(e){}try{const v=vc();if(v&&v.actx&&v.actx.state!=='running')v.actx.resume().catch(()=>{})}catch(e){}try{meterCtx()}catch(e){}}
try{if(typeof sxApplyAudio==='function'&&!sxApplyAudio.__wk){const o=sxApplyAudio;sxApplyAudio=function(){const r=o.apply(this,arguments);try{const a=SX.audio;if(a&&a.src&&!SX.audioLoading&&CS&&CS.media&&CS.media.kind==='soundcloud'&&SX.audioKey===CS.vid&&!Number.isFinite(a.duration)){const e=Math.max(0,cExp()),sk=a.seekable;if(sk&&sk.length&&sk.end(sk.length-1)>=e&&Math.abs((a.currentTime||0)-e)>2)a.currentTime=e}}catch(_){}return r};sxApplyAudio.__wk=1;window.sxApplyAudio=sxApplyAudio}}catch(e){}
function resumeRoom(){const v=host();if(!v)return;R.mounted=true;++metaSequence;metaLoad=null;bind(v);document.body.classList.add('slr-on');try{paint()}catch(e){}pollMsgs();pollAud();pollX();
 clearInterval(R.poll);R.poll=setInterval(()=>{if(!alive())return unmount();pollMsgs();deafen();R.n=(R.n||0)+1;if(R.n%2===0){pollAud();pollX();if(!document.hidden)void loadMeta()}},2500);
 clearInterval(R.tick);R.tick=setInterval(tickUi,1000);clearInterval(R.tk);R.tk=setInterval(talkSync,90)}
setInterval(()=>{try{if(!R.mounted&&typeof TAB!=='undefined'&&TAB==='c'&&typeof CV!=='undefined'&&CV==='hall'&&cid()){const r=root();if(r&&!r.closest('[hidden]')&&r.getClientRects().length)resumeRoom()}}catch(e){}},400);
function ytBack(){try{if(document.hidden||typeof CS==='undefined'||!CS||!CS.playing||!CS.vid||!/^[\w-]{11}$/.test(String(CS.vid))||isNat(CS))return;if(typeof YTP==='undefined'||!YTP||!YTP.getPlayerState)return;
 const e=Math.max(0,cExp()),st=YTP.getPlayerState(),t=Number(YTP.getCurrentTime&&YTP.getCurrentTime());
 if(st!==1&&st!==3){YTP.seekTo(e,true);YTP.playVideo()}else if(Number.isFinite(t)&&Math.abs(t-e)>2.5)YTP.seekTo(e,true)}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)[250,900,2000,4000].forEach(d=>setTimeout(ytBack,d))});addEventListener('pageshow',()=>[400,1500].forEach(d=>setTimeout(ytBack,d)));
function salonBack(){try{
 const pop=document.querySelector('.s9-pop');if(pop){pop.remove();return true}
 const sh=[...document.querySelectorAll('.s6:not(.s6-out)')].pop();if(sh){const x=sh.querySelector('.s6-x');if(x)x.click();else sh.dispatchEvent(new MouseEvent('click',{bubbles:true}));return true}
 const pc=document.querySelector('.slr-pc');if(pc){const x=pc.querySelector('[data-p=x]');if(x){x.click();return true}}
 const pg=[...document.querySelectorAll('.slr-pg')].filter(p=>!p.classList.contains('out')).pop();if(pg){const b=pg.querySelector('.r-pgb');if(b){b.click();return true}}
 if(alive()&&root()&&window.SLR9&&SLR9.exitMenu){SLR9.exitMenu();return true}}catch(e){}return false}
setInterval(()=>{const f=window.wnNativeN1Back;if(typeof f==='function'&&!f.__slr){const g=function(){if(salonBack())return;return f.apply(this,arguments)};g.__slr=1;window.wnNativeN1Back=g}},1000);
function unmount(){R.mounted=false;natStop();meterStop();clearInterval(R.poll);clearInterval(R.tick);clearInterval(R.tk);document.body.classList.remove('slr-on')}
/* every new state from the salon engine repaints our room */
function hook(){try{if(typeof cinSet!=='function'||cinSet.__slr)return;const o=cinSet;const w=function(j){/* a YouTube film never carries an archive film's file details: left over from the film before, they made the whole engine treat YouTube as an archive film */try{if(j&&j.media&&j.media.kind==='native'&&/^[\w-]{11}$/.test(String(j.vid||'')))j.media=null}catch(e){}const r=o.apply(this,arguments);try{if(alive())paint()}catch(e){}return r};w.__slr=1;cinSet=w;window.cinSet=w}catch(e){}}
setInterval(hook,1000);hook();
try{new MutationObserver(()=>{if(R.mounted&&!root())unmount()}).observe(document.getElementById('view')||document.body,{childList:true})}catch(e){}

let css=`
html body.slr-on{overflow:hidden}html body.slr-on.slr-on>header,html body.slr-on.slr-on #nav#nav,html body.slr-on.slr-on #cback#cback{display:none!important}
.slr{--g:#F2B13A;--gr:#3EE08F;--rd:#FF5A6E;--gl:rgba(32,18,58,.52);--gb:rgba(255,255,255,.14);position:fixed;inset:0;z-index:30;overflow:clip!important;color:#fff;display:flex;flex-direction:column;padding:max(10px,env(safe-area-inset-top)) 14px 0;overflow:hidden;font-family:inherit}
.slr button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.slr .r-bgi{position:fixed;inset:0;background:var(--bg) center/cover no-repeat;z-index:0;transform:scale(1.02)}
.slr .r-bgv{position:fixed;inset:0;z-index:0;background:linear-gradient(180deg,rgba(40,20,90,.55),rgba(40,20,90,.05) 26%,transparent 55%,rgba(20,10,40,.55) 100%)}
.slr>*:not(.r-bgi):not(.r-bgv):not(.r-tray-x){position:relative;z-index:1}
.slr .r-hd{display:flex;align-items:center;gap:8px;min-height:52px}
.slr .r-hd .r-who{display:flex;align-items:center;gap:10px;background:none;border:0;padding:0;min-width:0;text-align:start}
.r-hd .r-who .r-nm{min-width:0;overflow:hidden}.r-hd .r-who .r-nm small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.slr .r-hd .r-who .r-av{width:46px;height:46px;border:2px solid rgba(255,255,255,.75);box-shadow:0 6px 18px rgba(0,0,0,.35)}
.slr .r-nm{display:flex;flex-direction:column;min-width:0}.slr .r-nm b{font-size:19px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 2px 12px rgba(0,0,0,.35)}.slr .r-nm small{font-size:11.5px;opacity:.8}
.slr .r-cv{opacity:.75;display:grid}.slr .r-cv svg{width:15px;height:15px}[dir=ltr].slr .r-cv svg{transform:scaleX(-1)}
.slr .r-sp{flex:1}
.slr .r-ib{width:42px;height:42px;border-radius:15px;display:grid;place-items:center;background:var(--gl);border:1px solid var(--gb);-webkit-backdrop-filter:blur(16px) saturate(1.3);backdrop-filter:blur(16px) saturate(1.3)}.slr .r-ib svg{width:20px;height:20px}.slr .r-ib:active{transform:scale(.92)}
.slr .r-av,.slr-cd .r-av{position:relative;flex:none;display:grid;place-items:center;border-radius:50%;overflow:hidden;background:linear-gradient(140deg,rgba(255,255,255,.28),rgba(255,255,255,.1))}.slr .r-av b,.slr-cd .r-av b{font-size:15px;font-weight:900}.slr .r-av img,.slr-cd .r-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.slr .r-stw{margin-top:12px}.slr .r-stg{border-radius:22px;overflow:hidden;background:rgba(10,6,22,.55);border:1px solid var(--gb);box-shadow:0 22px 50px -24px rgba(0,0,0,.8);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);animation:slrin .45s cubic-bezier(.2,.8,.2,1)}
.slr .r-scr{position:relative;aspect-ratio:16/9;background:#000 var(--bg) center/cover}.slr .r-scr #yt,.slr .r-scr iframe{position:absolute;inset:0;width:100%!important;height:100%!important;border:0}.slr .r-shade{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
.slr .r-ctl{display:flex;align-items:center;gap:10px;height:46px;padding:0 12px;direction:ltr}
.slr .r-cb{width:32px;height:32px;display:grid;place-items:center;background:none;border:0;border-radius:10px}.slr .r-cb svg{width:19px;height:19px}.slr .r-cb:active{background:rgba(255,255,255,.12)}
.slr .r-nat .r-zw #yt,.slr .r-nat .r-zw iframe{visibility:hidden!important}
.slr .r-zw video.r-nv{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:1}
.slr .r-scx{transition:background .2s,color .2s}.slr .r-scx.r-arm{background:#FF4D5E;color:#fff;border-radius:50%;animation:slarm 1s ease-out infinite}@keyframes slarm{0%{box-shadow:0 0 0 0 rgba(255,77,94,.55)}100%{box-shadow:0 0 0 11px rgba(255,77,94,0)}}
.slr .r-tm{font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums;opacity:.9;white-space:nowrap}.slr .r-tm b{font-weight:800}
.slr .r-bar{flex:1;height:22px;display:flex;align-items:center;position:relative}.slr .r-bar::before{content:"";position:absolute;inset-inline:0;height:4px;border-radius:2px;background:rgba(255,255,255,.22)}
.slr .r-bar i{position:relative;height:4px;border-radius:2px;background:linear-gradient(90deg,#CBB6FF,#fff);width:0;transition:width .9s linear}.slr:not(.own) .r-pp{display:none}.slr.own .r-bar.r-sk{cursor:pointer}
.slr .r-seats{margin-top:14px;display:flex;flex-direction:column;gap:12px}
.slr .r-row{display:flex;justify-content:center;align-items:flex-end;gap:2%}
.slr .r-seats:has(.r-sdw){flex:none}.slr .r-sdw{flex:none;display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;overscroll-behavior-x:contain;margin:0 -12px;padding:4px 0 22px}
.slr .r-sdw::-webkit-scrollbar{display:none}
.slr .r-sdp{flex:0 0 100%;scroll-snap-align:start;scroll-snap-stop:always;padding:0 12px;box-sizing:border-box}
.slr .r-sdots{display:flex;justify-content:center;gap:7px;margin-top:-14px;height:8px}
.slr .r-sdots i{width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,.22);transition:width .25s,background .25s}
.slr .r-sdots i.ppl{background:rgba(196,180,255,.6)}
.slr .r-sdots i.on{width:18px;background:#fff}.slr .r-aisle{flex:0 0 7%}
.slr .r-st{position:relative;flex:0 0 calc((100% - 13%) / 4);max-width:92px;background:none;border:0;padding:0;display:flex;flex-direction:column;align-items:center;transition:transform .2s}.slr .r-cw{position:relative;display:block;width:100%;aspect-ratio:100/92}.slr .r-sn{display:block;width:100%;height:17px;margin-top:3px;font-size:11px;font-weight:800;line-height:17px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#F4ECFF;text-shadow:0 1px 4px rgba(0,0,0,.8)}.slr .r-st.r-me .r-sn{color:#fff}
.slr.lobby .r-seats{margin-top:40px;gap:18px}.slr.lobby .r-st{max-width:96px}
.slr .r-cw .r-ch{width:100%;height:100%;display:block;filter:drop-shadow(0 8px 10px rgba(0,0,0,.35))}
.slr .r-st:active{transform:scale(.94)}
.slr .r-st .r-who{position:absolute;left:50%;top:6%;width:46%;aspect-ratio:1;transform:translateX(-50%)}
.slr .r-st .r-who .r-av{width:100%;height:100%;border:2.5px solid #F4ECFF;box-shadow:0 4px 12px rgba(0,0,0,.45)}
.slr .r-st.r-me .r-who .r-av{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.22),0 4px 12px rgba(0,0,0,.45)}


@keyframes slrspk{0%{transform:scale(.9);opacity:1}100%{transform:scale(1.25);opacity:0}}

.slr .r-st .r-lkb{position:absolute;left:50%;top:14%;width:34%;aspect-ratio:1;transform:translateX(-50%);border-radius:50%;display:grid;place-items:center;background:rgba(30,14,46,.62);border:1.5px solid rgba(255,214,140,.7);color:#FFD98A}.slr .r-st .r-lkb svg{width:58%;height:58%}
.slr .r-st.r-pd .r-who{animation:slrpd .9s ease-in-out infinite alternate}@keyframes slrpd{to{opacity:.55}}
.slr .r-st.r-can{animation:slrcan 1.2s ease-in-out infinite}.slr .r-st.r-can .r-ch{filter:drop-shadow(0 0 10px rgba(62,224,143,.75))}@keyframes slrcan{50%{transform:translateY(-3px)}}
.slr .r-lb{display:flex;flex-direction:column;align-items:center;gap:14px}.slr:not(.lobby) .r-lb{display:none}
.slr .r-gold{margin-top:30px;width:min(270px,78%);height:48px;display:flex;align-items:center;justify-content:center;gap:9px;border-radius:16px;border:0;background:linear-gradient(135deg,#FFE29A,#F5B84A);color:#2A1A00;font-size:14.5px;font-weight:900;box-shadow:0 14px 30px -12px rgba(245,184,74,.8)}.slr .r-gold svg{width:19px;height:19px}.slr .r-gold:active{transform:scale(.97)}
.slr .r-ntc{align-self:flex-start;display:flex;align-items:center;gap:7px;background:none;border:0;font-size:13px;font-weight:800;text-shadow:0 2px 10px rgba(0,0,0,.5)}.slr .r-ntc svg{width:17px;height:17px;opacity:.85}
.slr .r-acts{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-height:0;margin-top:18px}
.slr .r-yth{position:absolute;z-index:4;left:10px;right:10px;bottom:10px;display:flex;justify-content:center;align-items:center;gap:8px;pointer-events:none;animation:slrpill .3s cubic-bezier(.2,.9,.2,1.2)}
.slr .r-yth span{display:flex;align-items:center;gap:7px;padding:8px 13px;border-radius:14px;background:rgba(12,8,24,.72);border:1px solid var(--gb);font-size:12.5px;font-weight:800;color:#fff;text-align:center}
.slr .r-yth span svg{width:15px;height:15px;flex:none}
.slr .r-yth{flex-wrap:wrap}.slr .r-ydg{flex-basis:100%;text-align:center;font:600 9px/1.2 ui-monospace,monospace;color:rgba(255,255,255,.45);font-style:normal}
.slr .r-yth-err{top:0;bottom:0;left:0;right:0;flex-direction:column;background:rgba(6,4,14,.72);pointer-events:auto}
.slr .r-yth button{pointer-events:auto;height:34px;padding:0 16px;border-radius:17px;background:var(--g)!important;color:#1a1206;font-weight:900;font-size:13px}
.slr .r-pill{display:flex;align-items:center;gap:8px;height:44px;padding:0 16px;border-radius:15px;background:rgba(40,24,62,.78);border:1px solid var(--gb);-webkit-backdrop-filter:blur(18px) saturate(1.3);backdrop-filter:blur(18px) saturate(1.3);font-size:13px;font-weight:800;box-shadow:0 12px 26px -14px rgba(0,0,0,.7);animation:slrpill .3s cubic-bezier(.2,.9,.2,1.2)}
.slr .r-pill svg{width:17px;height:17px;color:#FFD98A}.slr .r-pill.r-red span,.slr .r-pill.r-red svg{color:#FF9AA7}.slr .r-pill.r-act:active{transform:scale(.96)}
@keyframes slrpill{from{opacity:0;transform:translateY(8px) scale(.96)}}
.slr .r-msgs{margin-top:auto;display:flex;flex-direction:column;justify-content:flex-end;flex:0 1 auto;min-height:0;align-items:flex-start;gap:8px;padding:14px 0 10px;max-height:min(30vh,190px);overflow:hidden;-webkit-mask:linear-gradient(180deg,transparent,rgba(0,0,0,.35) 18%,#000 46%);mask:linear-gradient(180deg,transparent,rgba(0,0,0,.35) 18%,#000 46%);transition:background .3s}
/* messages: they fill all the room left above the bar (at least three stay in view) and scroll back to older ones with a finger */
.slr .r-msgs{flex:1 1 auto;min-height:124px;max-height:none;justify-content:flex-start;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none;touch-action:pan-y;
 -webkit-mask:linear-gradient(180deg,transparent,#000 26px);mask:linear-gradient(180deg,transparent,#000 26px)}
.slr .r-msgs::-webkit-scrollbar{display:none}
/* a knock at the door takes the place for a moment: the bar must always stay on screen */
.slr .r-acts:not(:empty)~.r-msgs{min-height:0}
/* a knock at the door floats as a banner under the header (over the top of the screen), so the chat keeps its three messages */
.slr.slr.slr>.r-door{position:absolute;z-index:9;top:calc(max(10px,env(safe-area-inset-top)) + 60px);left:12px;right:12px;margin:0;background:rgba(22,14,42,.92);box-shadow:0 10px 30px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.18)}
.slr .r-msgs>.r-mg:first-child{margin-top:auto}
.slr.r-typing>.r-msgs.r-msgs{position:absolute;z-index:6;left:10px;right:10px;top:calc(max(10px,env(safe-area-inset-top)) + 60px);bottom:calc(78px + env(safe-area-inset-bottom) + var(--kb,0px));max-height:none;margin:0;padding:16px 12px;justify-content:flex-start;overflow-y:auto;overscroll-behavior:contain;-webkit-mask:none;mask:none;
 border-radius:26px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(0,0,0,.08));border:1px solid rgba(255,255,255,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.25);animation:slrrise .35s cubic-bezier(.2,.9,.2,1)}
.slr.r-typing .r-msgs>.r-mg:first-child{margin-top:auto}
.slr.r-typing>.r-bb.r-bb.r-bb{position:absolute;left:12px;right:12px;bottom:max(var(--bb0,calc(10px + env(safe-area-inset-bottom))),calc(8px + var(--kb,0px)));transition:bottom var(--wk-keyboard-duration,.22s) var(--wk-keyboard-curve,ease-out)}
.slr.kb.r-typing>.r-bb.r-bb.r-bb{bottom:max(var(--bb0,8px),calc(8px + var(--kb,0px)))}.slr.r-typing.kb>.r-bb.r-bb.r-bb{bottom:max(var(--bb0,8px),calc(8px + var(--kb,0px)));margin:0;z-index:7;transform:none!important}
.slr.r-typing .r-mg{animation:none}
/* typing, as in TopTop: the room stays in view (no panel over it); the bar sits right on the keyboard with only the box and send;
   the latest messages float just above the bar, fading out towards the top */
.slr.slr.r-typing>.r-msgs.r-msgs{top:auto;bottom:calc(var(--kb,0px) + 84px);max-height:min(36vh,calc(100% - var(--kb,0px) - 250px));min-height:0;justify-content:flex-end;
 background:none;border:0;border-radius:0;box-shadow:none;padding:14px 4px 4px;-webkit-backdrop-filter:none;backdrop-filter:none;
 -webkit-mask:linear-gradient(180deg,transparent,#000 28%);mask:linear-gradient(180deg,transparent,#000 28%);transition:bottom var(--wk-keyboard-duration,.25s) var(--wk-keyboard-curve,ease-out)}
.slr.r-typing:not(.kb)>.r-msgs.r-msgs{bottom:calc(var(--bb0,10px) + 74px)}
/* a soft dark veil rises from the keyboard so the messages read clearly over the screen and seats (the top of the room stays clear) */
.slr.r-typing::after{content:"";position:absolute;left:0;right:0;bottom:var(--kb,0px);height:calc(min(36vh,100% - var(--kb,0px) - 250px) + 170px);z-index:5;pointer-events:none;
 background:linear-gradient(180deg,rgba(8,5,18,0),rgba(8,5,18,.72) 38%,rgba(8,5,18,.9));transition:bottom var(--wk-keyboard-duration,.25s) var(--wk-keyboard-curve,ease-out)}
.slr.r-typing .r-mg{max-width:92%}
.slr input,.slr textarea{font-size:16px!important}html.wk-android .slr.r-typing>.r-bb.r-bb.r-bb{bottom:calc(8px + var(--kb,0px))!important;margin:0;transform:none!important}html.wk-android .slr.r-typing>.r-msgs.r-msgs{bottom:calc(76px + var(--kb,0px))!important}.slr.r-typing .r-bb .r-orbs{display:none}
.slr.r-typing>.r-bb.r-bb.r-bb{background:rgba(16,10,32,.88);border-color:rgba(255,255,255,.18)}
.slr.r-typing .r-bb .r-sd{opacity:1;background:var(--g,#e9b04f)!important;color:#1a1206}
@keyframes slrrise{from{opacity:0;transform:translateY(30px) scale(.98)}}

.slr .r-ma{padding:0;background:none;border:0}


.slr.kb .r-bb{transform:translateY(calc(-1 * var(--kb) + env(safe-area-inset-bottom)))}

.slr .r-in input{width:100%;background:none;border:0;outline:none;color:#fff;font:inherit;font-size:13.5px}.slr .r-in input::placeholder{color:rgba(255,255,255,.55)}
[dir=rtl].slr .r-sd svg{transform:scaleX(-1)}
.slr.slr.fs>.r-stw.r-stw{position:fixed;z-index:20;top:0;left:0;margin:0;width:100vh;height:100vw;transform-origin:top left;transform:translateX(100vw) rotate(90deg);background:#000}
.slr.fs .r-stg{height:100%;border-radius:0;display:flex;flex-direction:column;border:0}.slr.fs .r-scr{flex:1;aspect-ratio:auto}
@media (orientation:landscape){.slr.slr.fs>.r-stw.r-stw{width:100vw;height:100vh;transform:none}}
.slr .r-audw{display:flex;justify-content:center;margin-top:10px}





@keyframes slrbob{50%{transform:translateY(-3px)}}


.slr-cd{position:fixed;inset:0;z-index:2147480001;display:flex;align-items:flex-end;justify-content:center;padding:0 12px calc(12px + env(safe-area-inset-bottom));background:radial-gradient(120% 70% at 50% 100%,rgba(30,10,60,.6),rgba(8,4,18,.35));animation:slrfade .25s}
.slr-cd.out{opacity:0;transition:opacity .25s}.slr-cd.out .r-cx{transform:translateY(30px) scale(.96);transition:transform .25s}
.slr-cd .r-cx{position:relative;width:min(420px,100%);padding:0 18px 18px;border-radius:30px;text-align:center;color:#fff;overflow:hidden;
 background:linear-gradient(180deg,rgba(66,34,104,.92),rgba(30,14,52,.96) 55%);border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 70px -20px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.12);-webkit-backdrop-filter:blur(26px);backdrop-filter:blur(26px);animation:slrpop .45s cubic-bezier(.2,1.25,.3,1)}
.slr-cd .r-cx::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,transparent 0 22px,rgba(255,255,255,.018) 22px 23px);pointer-events:none}
@keyframes slrpop{from{transform:translateY(60px) scale(.92);opacity:0}}
.slr-cd .r-xx{position:absolute;top:14px;inset-inline-end:14px;z-index:2;width:34px;height:34px;border-radius:12px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff}.slr-cd .r-xx svg{width:15px;height:15px}
.slr-cd .r-stage{position:relative;height:150px;margin:0 -18px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:10px;background:radial-gradient(60% 90% at 50% 100%,rgba(255,214,140,.22),transparent 70%)}
.slr-cd .r-beam{position:absolute;top:-20px;left:50%;width:180px;height:190px;transform:translateX(-50%);background:linear-gradient(180deg,rgba(255,236,190,.35),rgba(255,236,190,0));clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);filter:blur(2px);animation:slrbeam 3.6s ease-in-out infinite}
@keyframes slrbeam{50%{opacity:.6}}
.slr-cd .r-sp{position:absolute;width:5px;height:5px;border-radius:50%;background:#FFE29A;box-shadow:0 0 8px #FFE29A;animation:slrtw 2.2s ease-in-out infinite}.slr-cd .s1{top:38px;left:30%}.slr-cd .s2{top:70px;right:28%;animation-delay:.7s}.slr-cd .s3{top:24px;right:40%;animation-delay:1.3s;width:3px;height:3px}
@keyframes slrtw{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}}
.slr-cd .r-mc{position:relative;width:118px;height:108px;animation:slrin2 .6s cubic-bezier(.2,1.3,.3,1) .1s both}
@keyframes slrin2{from{transform:translateY(20px) scale(.8);opacity:0}}
.slr-cd .r-mc .r-ch{width:100%;height:100%;filter:drop-shadow(0 12px 14px rgba(0,0,0,.45))}
.slr-cd .r-mc .r-who{position:absolute;left:50%;top:4%;width:48%;aspect-ratio:1;transform:translateX(-50%)}
.slr-cd .r-mc .r-av{width:100%;height:100%;border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.5)}
.slr-cd .me .r-mc .r-av{border-color:var(--gr,#3EE08F);box-shadow:0 0 0 5px rgba(62,224,143,.22),0 0 26px rgba(62,224,143,.55)}
.slr-cd .up .r-mc .r-who{animation:slrfloat 1.8s ease-in-out infinite}
@keyframes slrfloat{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-16px)}}
.slr-cd .r-arw{position:absolute;left:50%;top:-30px;width:26px;height:26px;margin-left:-13px;display:grid;place-items:center;border-radius:50%;background:rgba(255,154,167,.2);color:#FF9AA7;animation:slrarw 1.8s ease-in-out infinite}.slr-cd .r-arw svg{width:16px;height:16px;transform:rotate(90deg)}
@keyframes slrarw{0%,100%{transform:translateY(4px);opacity:.4}50%{transform:translateY(-6px);opacity:1}}
.slr-cd .r-plate{position:relative;display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;margin-top:4px;border-radius:9px;background:linear-gradient(180deg,#F7D98B,#C9963A);color:#3A2400;font-size:11.5px;font-weight:900;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),inset 0 -2px 0 rgba(0,0,0,.18),0 6px 14px -6px rgba(201,150,58,.8)}
.slr-cd .r-plate::before,.slr-cd .r-plate::after{content:"";width:4px;height:4px;border-radius:50%;background:#8A6220;box-shadow:inset 0 1px 0 rgba(255,255,255,.4)}.slr-cd .r-plate svg{display:none}
.slr-cd h3{position:relative;margin:14px 0 6px;font-size:21px;font-weight:900}.slr-cd p{position:relative;margin:0 8px 18px;font-size:13px;line-height:1.85;opacity:.78}
.slr-cd .r-btns{position:relative;display:flex;gap:10px}
.slr-cd .r-bt{flex:1;height:54px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:18px;border:0;font:inherit;font-size:15px;font-weight:900;color:#fff;cursor:pointer}
.slr-cd .r-bt svg{width:19px;height:19px}.slr-cd .r-bt:active{transform:scale(.97)}
.slr-cd .r-rose{position:relative;overflow:hidden;background:linear-gradient(135deg,#FFC2CC,#FF7E94 55%,#E8506B);color:#3A0614;box-shadow:0 14px 30px -12px rgba(255,110,140,.9)}
.slr-cd .r-rose::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:slrshine 3.2s ease-in-out infinite}
@keyframes slrshine{0%,60%{left:-60%}100%{left:130%}}
.slr-cd .r-ghost{flex:.7;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16)}
html.wk-rm .slr-cd *{animation:none!important}
.slr .r-zw{position:absolute;inset:0;overflow:hidden}
/* YouTube on the iPhone: nothing around its film blurs, scales or moves (a scaled frame can leave its picture black) */
.slr .r-stg.r-ytst,.slr .r-stg:has(iframe){-webkit-backdrop-filter:none;backdrop-filter:none;animation:none;transform:none}
.slr .r-ytst .r-zw,.slr .r-stg:has(iframe) .r-zw{transform:none!important;transition:none}
.slr .r-ytst .r-scr{background:#000}.slr .r-zw #yt,.slr .r-zw iframe{position:absolute;inset:0;width:100%!important;height:100%!important;border:0}
/* taps on the screen belong to the salon, not to YouTube (no YouTube title, buttons or logo popping up);
   only when the phone asks for one tap to start the sound does the tap go through to the video */
.slr .r-zw iframe{pointer-events:none!important}
.slr .r-scr:has(.r-yth-tap) .r-zw iframe{pointer-events:auto!important}
.slr .r-fo{display:none}.slr.fs .r-ctl{display:none}
/* the controls lie on the picture itself (no dark frame under the film): a soft shadow at the foot of the picture keeps them readable,
   they come with a touch on the screen and leave by themselves while the film plays */
.slr .r-stg{position:relative;background:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;border-color:rgba(255,255,255,.12)}
.slr .r-stg .r-ctl{position:absolute;left:0;right:0;bottom:0;z-index:5;height:58px;padding:12px 12px 0;color:#fff;
 background:linear-gradient(to top,rgba(0,0,0,.6),rgba(0,0,0,.25) 55%,transparent);opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity .3s ease,transform .38s cubic-bezier(.2,1.2,.3,1)}
.slr .r-stg.r-ui .r-ctl{opacity:1;transform:none;pointer-events:auto}
.slr .r-stg .r-ctl .r-cb,.slr .r-stg .r-ctl .r-tm{filter:drop-shadow(0 1px 3px rgba(0,0,0,.7))}
.slr .r-stg .r-ctl .r-bar::before{background:rgba(255,255,255,.35)}
.slr .r-stg .r-yth{transition:bottom .3s}.slr .r-stg.r-ui .r-yth:not(.r-yth-err){bottom:62px}.slr.fs .r-fo{display:block;position:absolute;inset:0;z-index:3;pointer-events:auto}.slr .r-fui{pointer-events:none}.slr .r-fchat,.slr .r-ftalk{pointer-events:none}
.slr.fs .r-scr{background:#000}.slr.fs .r-zw{background:var(--bg) center/contain no-repeat}/* on the iPhone a YouTube picture inside a scaled frame stays black (only the sound plays), so the film is scaled only while zoomed */
.slr .r-stg:has(iframe){-webkit-backdrop-filter:none;backdrop-filter:none}
.slr.fs .r-zw{transition:transform .35s cubic-bezier(.2,.8,.2,1)}.slr.fs .r-zw.r-zm{transform:scale(var(--z,1))}
.slr .r-fui{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;opacity:0;transition:opacity .3s;background:linear-gradient(180deg,rgba(0,0,0,.6),transparent 30%,transparent 62%,rgba(0,0,0,.72))}
.slr .r-fui.on{opacity:1}.slr .r-fui.on button,.slr .r-fui.on .r-bar{pointer-events:auto}
.slr .r-ftop{display:flex;align-items:center;gap:10px;padding:max(12px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) 0 max(18px,env(safe-area-inset-left))}
.slr .r-ftt{display:flex;flex-direction:column;min-width:0}.slr .r-ftt b{font-size:15px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.slr .r-ftt small{font-size:11px;opacity:.7}
.slr .r-fb{width:44px;height:44px;display:grid;place-items:center;background:none;border:0;border-radius:50%;color:#fff}.slr .r-fb svg{width:24px;height:24px}.slr .r-fb:active{background:rgba(255,255,255,.12)}
.slr .r-fmid{display:flex;align-items:center;justify-content:center;gap:56px;direction:ltr}
.slr .r-fbig svg{width:40px;height:40px}.slr .r-fbig.r-kk svg{animation:slrkk .4s ease}.slr [data-a=b15].r-kk{--r:-30deg}.slr [data-a=f15].r-kk{--r:30deg}
@keyframes slrkk{40%{transform:scale(.82) rotate(var(--r,0))}}
.slr .r-fpp{width:76px;height:76px;background:rgba(255,255,255,.14);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}.slr .r-fpp svg{width:38px;height:38px}
.slr .r-fbot{display:flex;align-items:center;gap:12px;padding:0 max(14px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left));direction:ltr}
.slr .r-fbot .r-bar::before{height:5px}.slr .r-fbot .r-bar i{height:5px;background:linear-gradient(90deg,#FF5A7A,#FF2D55)}
.slr .r-fchat{position:absolute;inset-inline-start:max(22px,env(safe-area-inset-right));bottom:70px;width:min(46%,420px);display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.slr .r-fm{display:flex;align-items:center;gap:8px;font-size:13.5px;line-height:1.5;color:rgba(255,255,255,.88);text-shadow:0 1px 2px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6);animation:slrfm 8s ease forwards}
.slr .r-fm .r-av{width:22px;height:22px;flex:none;opacity:.9}.slr .r-fm .r-av b{font-size:10px}.slr .r-fm b.r-mn{font-size:inherit}
@keyframes slrfm{0%{opacity:0;transform:translateY(10px)}6%{opacity:.92;transform:none}80%{opacity:.85}100%{opacity:0;transform:translateY(-6px)}}
.slr .r-ftalk{position:absolute;top:max(14px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);display:flex;gap:8px}
.slr .r-tp{display:flex;align-items:center;gap:6px;height:28px;padding:0 9px 0 3px;border-radius:14px;background:rgba(10,8,20,.32);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid rgba(62,224,143,.3);font-size:11px;white-space:nowrap;opacity:.92;animation:slrpill .3s ease}
.slr .r-tp .r-av{width:22px;height:22px;box-shadow:0 0 0 1.5px var(--gr)}.slr .r-tp .r-av b{font-size:10px}.slr .r-tp b{font-weight:800}
.slr .r-wv{display:flex;align-items:center;gap:2px;height:11px}.slr .r-wv i{width:3px;height:100%;border-radius:2px;background:var(--gr);animation:slrwv .9s ease-in-out infinite}.slr .r-wv i:nth-child(2){animation-delay:-.3s}.slr .r-wv i:nth-child(3){animation-delay:-.6s}.slr .r-wv i:nth-child(4){animation-delay:-.15s}
@keyframes slrwv{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
.slr .r-fin input,.slr .r-fin input:focus,.slr .r-in input,.slr .r-in input:focus{outline:none!important;box-shadow:none!important;border:0!important;background:none!important;-webkit-appearance:none;appearance:none}
.slr .r-fmic{color:#FF8C9A}.slr .r-fmic.r-on{color:var(--gr)}
.slr .r-fin{position:absolute;inset-inline-start:max(18px,env(safe-area-inset-right));bottom:62px;width:min(56%,460px);display:flex;align-items:center;gap:8px;padding:5px 5px 5px 16px;border-radius:22px;background:rgba(12,8,22,.38);border:1px solid rgba(255,255,255,.18);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);pointer-events:auto;animation:slrpill .3s ease}
[dir=rtl].slr .r-fin{padding:5px 16px 5px 5px}.slr .r-fin[hidden]{display:none}
.slr .r-fin input{flex:1;min-width:0;height:36px;background:none;border:0;outline:none;color:#fff;font:inherit;font-size:14px;text-shadow:0 1px 2px rgba(0,0,0,.6)}.slr .r-fin input::placeholder{color:rgba(255,255,255,.6)}
.slr .r-fsd{width:38px;height:38px;flex:none;border-radius:50%;display:grid;place-items:center;border:0;background:linear-gradient(140deg,#FFB3C0,#FF7E94);color:#3A0614}.slr .r-fsd svg{width:17px;height:17px}[dir=rtl].slr .r-fsd svg{transform:scaleX(-1)}
.slr .r-entry-notice .r-ma{display:grid;place-items:center;color:#dac7f8;background:#ffffff0d;border:1px solid #ffffff25}.slr .r-entry-notice .r-ma svg{width:18px;height:18px}.slr .r-entry-notice .r-mt{padding:9px 12px;border:1px solid #ffffff20;border-radius:15px;background:#21172e55;white-space:pre-wrap;overflow-wrap:anywhere;color:#f0e5ff;font-size:13px;line-height:1.8} .slr.fs.fty>.r-fin{position:fixed!important;z-index:70;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));width:auto;bottom:calc(var(--kb,0px) + 8px);transform:none;animation:none}.slr .r-fin input{font-size:16px!important}.slr.fty .r-fchat{bottom:118px}.slr.fty .r-fmid{opacity:0;pointer-events:none}
.slr .r-mg{display:flex;align-items:center;gap:9px;max-width:84%;animation:slrmg .45s cubic-bezier(.2,.9,.2,1.1) both}
@keyframes slrmg{from{opacity:0;transform:translateY(12px) scale(.96);filter:blur(4px)}}
.slr .r-ma .r-av{width:30px;height:30px;border:1.5px solid rgba(255,255,255,.75);box-shadow:0 4px 10px rgba(0,0,0,.35)}
.slr .r-mt{position:relative;display:flex;flex-direction:column;gap:0;padding:0 2px;font-size:13.5px;line-height:1.6;word-break:break-word;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.85),0 0 14px rgba(0,0,0,.45)}

.slr .r-mn{align-self:flex-start;font-size:11.5px;font-weight:900;letter-spacing:.1px;background:linear-gradient(100deg,var(--n1,#C9BCFF),var(--n2,#8B76FF));-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;text-shadow:none;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.75))}
.slr .r-mg.r-own{align-self:flex-start}


.slr .r-bb{position:relative;display:flex;align-items:center;gap:8px;margin:0 -2px calc(10px + env(safe-area-inset-bottom));padding:7px;border-radius:28px;background:rgba(255,255,255,.07);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.18);box-shadow:0 14px 34px -18px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.18);transition:transform .2s}

.slr .r-orbs{display:flex;align-items:center;gap:6px}
.slr .r-orb{position:relative;width:42px;height:42px;flex:none;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(255,255,255,.14);padding:0;color:rgba(255,255,255,.88);background:rgba(255,255,255,.06);transition:transform .2s,background .25s,color .25s}
.slr .r-orb svg{position:relative;width:20px;height:20px}.slr .r-orb:active{transform:scale(.9)}
.slr .r-mic{color:rgba(255,255,255,.55)}
.slr .r-mic.r-on{color:#14101c;background:#fff;border-color:#fff}
.slr .r-halo{position:absolute;inset:-5px;border-radius:50%;border:2px solid transparent}
.slr .r-mic.r-live .r-halo{border-color:rgba(255,255,255,.7);animation:slrhalo 1s ease-out infinite}
@keyframes slrhalo{from{transform:scale(.92);opacity:1}to{transform:scale(1.35);opacity:0}}
.slr .r-spk{color:rgba(255,255,255,.55)}
.slr .r-spk.r-on{color:rgba(255,255,255,.95);background:rgba(255,255,255,.12)}
.slr .r-sw{position:absolute;inset:0;pointer-events:none}.slr .r-sw i{position:absolute;top:50%;left:50%;width:30px;height:30px;margin:-15px;border-radius:50%;border:1.5px solid rgba(255,255,255,.45);clip-path:inset(0 0 0 60%);animation:slrsw 1.8s ease-out infinite}.slr .r-sw i+i{animation-delay:.9s}
@keyframes slrsw{from{transform:scale(.6);opacity:.9}to{transform:scale(1.25);opacity:0}}
.slr .r-apps{border-radius:15px;background:rgba(255,255,255,.06);overflow:hidden}

@keyframes slrshine2{0%,70%{left:-70%}100%{left:130%}}
.slr .r-dots{display:grid;grid-template-columns:repeat(2,8px);gap:4px}.slr .r-dots i{width:7px;height:7px;border-radius:2.5px;background:rgba(255,255,255,.88)}.slr .r-dots i:nth-child(2),.slr .r-dots i:nth-child(3){border-radius:50%}
.slr .r-in{flex:1;min-width:0;height:42px;display:flex;align-items:center;padding:0 15px;border-radius:21px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);transition:background .2s,border-color .2s}
.slr .r-in:focus-within{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.3)}
.slr .r-in input{width:100%;color:#fff;font:inherit;font-size:14px}.slr .r-in input::placeholder{color:rgba(255,255,255,.5)}
.slr .r-sd{width:42px;height:42px;flex:none;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,255,255,.14);padding:0;color:rgba(255,255,255,.5);background:rgba(255,255,255,.06);transition:transform .3s cubic-bezier(.2,1.4,.3,1),background .25s,color .25s}
.slr .r-sd svg{width:19px;height:19px;transition:transform .3s}[dir=rtl].slr .r-sd svg{transform:scaleX(-1)}
.slr .r-bb.r-go .r-sd{color:#14101c;background:#fff;border-color:#fff;transform:scale(1.04)}
.slr .r-bb.r-go .r-sd svg{transform:rotate(-12deg)}[dir=rtl].slr .r-bb.r-go .r-sd svg{transform:scaleX(-1) rotate(-12deg)}

html.wk-rm .slr .r-apps::after,html.wk-rm .slr .r-sw i,html.wk-rm .slr .r-halo{animation:none!important}
.slr .r-st .r-ring{position:absolute;inset:-14%;border-radius:50%;border:2.5px solid var(--gr);box-shadow:0 0 14px rgba(62,224,143,.7);animation:slrspk 1.2s ease-out infinite}.slr .r-st .r-ring.r2{animation-delay:.6s}
.slr .r-st.r-talk .r-who .r-av{border-color:var(--gr);box-shadow:0 0 0 2px rgba(62,224,143,.35),0 0 22px rgba(62,224,143,.85)}
.slr .r-st.r-talk .r-cw .r-ch{filter:drop-shadow(0 0 12px rgba(62,224,143,.45)) drop-shadow(0 8px 10px rgba(0,0,0,.35))}
.slr .r-eqb{position:absolute;left:50%;top:-30%;transform:translateX(-50%);display:flex;align-items:flex-end;gap:2px;height:13px;padding:3px 6px;border-radius:9px;background:linear-gradient(180deg,#8FF5C0,#2FCB7E);box-shadow:0 4px 12px -2px rgba(62,224,143,.9)}
.slr .r-eqb i{width:2.5px;height:100%;border-radius:2px;background:#06301A;transform-origin:bottom;animation:sleqb .8s ease-in-out infinite}.slr .r-eqb i:nth-child(2){animation-delay:-.25s}.slr .r-eqb i:nth-child(3){animation-delay:-.5s}.slr .r-eqb i:nth-child(4){animation-delay:-.1s}
@keyframes sleqb{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
.slr .r-st .r-mx{position:absolute;bottom:-6%;inset-inline-end:-12%;width:38%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;color:#fff;background:rgba(18,12,28,.78);border:1.5px solid rgba(255,255,255,.55);box-shadow:0 3px 8px rgba(0,0,0,.45)}.slr .r-st .r-mx svg{width:62%;height:62%}
.slr .r-aud{position:relative;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 6px 0 10px;border-radius:20px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);animation:slrpill .35s ease}

.slr .r-eye{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;color:rgba(255,255,255,.8);background:rgba(255,255,255,.08)}.slr .r-eye svg{width:14px;height:14px}
.slr .r-ast{display:flex;align-items:center;direction:ltr;padding-inline-start:2px}
.slr .r-ap{position:relative;padding:0;border:0;background:none;margin-left:-9px;animation:slrap .4s cubic-bezier(.2,1.3,.3,1) both;animation-delay:calc(var(--k)*60ms)}.slr .r-ap:first-child{margin-left:0}
@keyframes slrap{from{transform:scale(.4);opacity:0}}
.slr .r-ap .r-av{width:30px;height:30px;border:2px solid #2B1646;box-shadow:0 3px 8px rgba(0,0,0,.4)}.slr .r-ap .r-av b{font-size:12px}
.slr .r-ap.r-me{z-index:2}.slr .r-ap.r-me .r-av{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.3)}
.slr .r-more{margin-left:5px;height:24px;min-width:24px;padding:0 6px;border-radius:12px;display:grid;place-items:center;font-size:10.5px;font-weight:900;background:rgba(255,255,255,.14)}




























.slr .r-st{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;touch-action:manipulation}
.slr .r-st .r-cw{transition:transform .25s cubic-bezier(.2,.8,.2,1),filter .25s}
.slr .r-st.r-hold .r-cw{transform:scale(.9);filter:brightness(.8) drop-shadow(0 0 16px rgba(255,255,255,.35));transition:transform .5s cubic-bezier(.3,0,.2,1),filter .5s}
.slr .r-lkb.r-pop{animation:slrlk .5s cubic-bezier(.2,1.6,.3,1) both}
@keyframes slrlk{from{transform:translateX(-50%) scale(.2) rotate(-25deg);opacity:0}}
.slr .r-st .r-who{transition:transform .35s cubic-bezier(.2,1.6,.3,1)}
.slr .r-st.r-lift .r-who{transform:translate(-50%,-30%) scale(1.08);transition:transform 2s cubic-bezier(.3,0,.2,1)}
.slr .r-st.r-lift .r-who .r-av{box-shadow:0 18px 22px -6px rgba(0,0,0,.6),0 0 0 3px rgba(255,255,255,.35)}
.slr .r-st.r-lift .r-cw .r-ch{filter:brightness(.75) drop-shadow(0 8px 10px rgba(0,0,0,.35));transition:filter 2s}
.r-fly{position:fixed;z-index:2147480002;border-radius:50%;overflow:hidden;pointer-events:none;border:2.5px solid #fff;box-shadow:0 14px 30px rgba(0,0,0,.55);display:grid;place-items:center}
.r-fly img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.r-fly b{font-weight:900;color:#fff}


body.slr-on #sheet:has(.slr-mm){background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.04))!important;-webkit-backdrop-filter:blur(30px) saturate(1.2)!important;backdrop-filter:blur(30px) saturate(1.2)!important;border:1px solid rgba(255,255,255,.16)!important;border-bottom:0!important;box-shadow:0 -20px 50px -20px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.22)!important}
body.slr-on #ov.show{background:rgba(0,0,0,.25)!important}
.slr-mm{padding:2px 2px 6px}
.slr-mm .slr-mh{display:flex;flex-direction:column;align-items:center;gap:4px;margin:2px 0 18px}
.slr-mm .slr-mh .r-av{position:relative;width:58px;height:58px;border-radius:50%;overflow:hidden;display:grid;place-items:center;border:2px solid rgba(255,255,255,.6);box-shadow:0 10px 24px -8px rgba(0,0,0,.6);background:linear-gradient(140deg,rgba(255,255,255,.28),rgba(255,255,255,.1));animation:slrpop .45s cubic-bezier(.2,1.3,.3,1) both}
.slr-mm .slr-mh .r-av b{font-size:22px;font-weight:900;color:#fff}.slr-mm .slr-mh .r-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.slr-mm .slr-mh>b{font-size:17px;font-weight:900;color:#fff;margin-top:6px}.slr-mm .slr-mh small{font-size:11.5px;color:rgba(255,255,255,.6)}
.slr-mm .slr-mt{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:10px;margin-bottom:14px}
.slr-mm .slr-mrow{display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:9px;height:96px;margin:0!important;padding:10px 6px!important;border-radius:22px!important;color:#fff!important;font:800 11.5px/1.35 inherit!important;text-align:center;
 background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.035))!important;border:1px solid rgba(255,255,255,.16)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 12px 24px -16px rgba(0,0,0,.8);
 animation:slrmt .45s cubic-bezier(.2,1.3,.3,1) both;animation-delay:calc(var(--k)*60ms + 60ms);transition:transform .15s}
.slr-mm .slr-mrow:active{transform:scale(.95)}
.slr-mm .slr-mrow i{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}
.slr-mm .slr-mrow i svg{width:21px!important;height:21px!important}

@keyframes slrmt{from{opacity:0;transform:translateY(12px) scale(.92)}}
.slr-mm .slr-mg2{border-radius:20px;overflow:hidden;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14)}
.slr-mm .slr-mg2>button{display:flex!important;align-items:center;gap:12px!important;width:100%;height:54px;margin:0!important;padding:0 14px!important;border:0!important;border-radius:0!important;background:none!important;color:rgba(255,255,255,.92)!important;font:700 14px inherit!important;animation:slrmt .4s ease both;animation-delay:calc(var(--k)*50ms + 180ms)}
.slr-mm .slr-mg2>button+button{border-top:1px solid rgba(255,255,255,.08)!important}
.slr-mm .slr-mg2>button svg{width:32px!important;height:32px!important;padding:7px;border-radius:50%;background:rgba(255,255,255,.08);flex:none}
.slr-mm .slr-mg2>button.danger{color:rgba(255,255,255,.92)!important}
.slr-mm .slr-mg2>button:active{background:rgba(255,255,255,.06)!important}
.slr .r-ppl.r-full{font-weight:900;color:#fff}
.slr .r-door{display:flex;align-items:center;gap:11px;margin-top:10px;padding:10px 10px 10px 12px;border-radius:22px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.18);animation:slrdoor .5s cubic-bezier(.2,1.3,.3,1) both}
.slr .r-door.r-out{opacity:0;transform:translateY(6px);transition:all .2s}
@keyframes slrdoor{from{opacity:0;transform:translateY(16px) scale(.94)}}
.slr .r-dav{position:relative;flex:none}.slr .r-dav .r-av{width:42px;height:42px;border:2px solid rgba(255,255,255,.7)}
.slr .r-dbell{position:absolute;bottom:-3px;inset-inline-end:-5px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#14101c;animation:slrbell 1.6s ease-in-out infinite}.slr .r-dbell svg{width:12px;height:12px}
@keyframes slrbell{0%,60%,100%{transform:rotate(0)}70%{transform:rotate(18deg)}80%{transform:rotate(-14deg)}90%{transform:rotate(8deg)}}
.slr .r-dtx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.slr .r-dtx b{font-size:13.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 3px rgba(0,0,0,.6)}.slr .r-dtx small{font-size:11px;opacity:.7;direction:ltr;text-align:end}
.slr .r-dsee{flex:none;height:36px;padding:0 18px;border-radius:13px;border:0;background:#fff;color:#14101c;font-weight:900;font-size:13px}
.slr-ad .r-kp{display:flex;align-items:center;gap:12px;padding:12px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}
.slr-ad .r-kp .r-av{position:relative;flex:none;width:52px;height:52px;border-radius:50%;overflow:hidden;display:grid;place-items:center;border:2px solid rgba(255,255,255,.7);background:linear-gradient(140deg,rgba(255,255,255,.28),rgba(255,255,255,.1))}.slr-ad .r-kp .r-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.slr-ad .r-kp .r-av b{font-size:18px;font-weight:900}
.slr-ad .r-kp>span:not(.r-av){flex:1;display:flex;flex-direction:column;gap:2px}.slr-ad .r-kp b{font-size:17px;font-weight:900}.slr-ad .r-kp small{font-size:12px;opacity:.65;direction:ltr;text-align:end}
.slr-ad .r-kt{font-style:normal;font-size:11px;font-weight:800;padding:5px 11px;border-radius:11px;background:rgba(255,255,255,.1)}
.slr-ad .r-lim{margin-top:16px;text-align:center}.slr-ad .r-lim b{display:block;font-size:14.5px;font-weight:900}.slr-ad .r-lim small{display:block;margin-top:4px;font-size:12.5px;opacity:.7}
.slr-ad .r-caps{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:12px}.slr-ad .r-caps span{height:34px;padding:0 14px;border-radius:12px;display:flex;align-items:center;font-size:12px;font-weight:800;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14)}
.slr-ad .r-caps .r-new{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.4)}.slr-ad .r-caps i{display:grid;opacity:.6}.slr-ad .r-caps i svg{width:15px;height:15px}[dir=rtl].slr-ad .r-caps i svg{transform:scaleX(-1)}
.slr-ad .r-two{margin-top:16px}.slr-ad .r-op.r-pk{background:#fff!important;color:#14101c!important;flex:1.6}.slr-ad .r-op:disabled{opacity:.55}
.slr-sh.slr-ad .r-bx{background:rgba(22,14,36,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.slr-pg{position:fixed;inset:0;z-index:2147480000;display:flex;flex-direction:column;padding:max(12px,env(safe-area-inset-top)) 16px 0;color:#fff;background:rgba(14,9,26,.86);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);overflow-y:auto;transform:translateX(calc(var(--d,1) * 30px));opacity:0;transition:transform .32s cubic-bezier(.2,.9,.2,1),opacity .25s}
[dir=rtl].slr-pg{--d:-1}.slr-pg.in{transform:none;opacity:1}.slr-pg.out{opacity:0}
.slr-pg button{font:inherit;color:inherit;cursor:pointer}
.slr-pg .r-pgh{display:flex;align-items:center;gap:12px;min-height:52px;margin-bottom:12px}.slr-pg .r-pgh b{display:block;font-size:22px;font-weight:900}.slr-pg .r-pgh small{display:block;font-size:12px;opacity:.6}
.slr-pg .r-pgb{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06)}.slr-pg .r-pgb svg{width:19px;height:19px}[dir=rtl].slr-pg .r-pgh>.r-pgb{order:9}.slr-pg .r-pgh>div{flex:1;min-width:0}
.slr-pg .r-srch{display:flex;align-items:center;gap:10px;height:48px;padding:0 16px;border-radius:17px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)}.slr-pg .r-srch svg{width:18px;height:18px;opacity:.6}
.slr-pg .r-srch input{flex:1;min-width:0;background:none!important;border:0!important;outline:none!important;box-shadow:none!important;color:#fff;font:inherit;font-size:14px}.slr-pg .r-srch input::placeholder{color:rgba(255,255,255,.45)}
.slr-pg .r-ilinks{margin-top:14px;border-radius:20px;overflow:hidden;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
.slr-pg .r-il{display:flex;align-items:center;gap:12px;padding:12px 14px}.slr-pg .r-il+.r-il{border-top:1px solid rgba(255,255,255,.08)}
.slr-pg .r-il>i{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:rgba(255,255,255,.08)}.slr-pg .r-il>i svg{width:19px;height:19px}
.slr-pg .r-il>span{flex:1;display:flex;flex-direction:column;gap:2px}.slr-pg .r-il b{font-size:14px;font-weight:800}.slr-pg .r-il small{font-size:11.5px;opacity:.6}.slr-pg .r-code{direction:ltr;text-align:end;letter-spacing:2px;font-weight:900;opacity:.9!important;font-size:13px!important}
.slr-pg .r-il>button{height:34px;padding:0 15px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);font-size:12.5px;font-weight:800}.slr-pg .r-il>button.r-ok{background:#fff;color:#14101c}
.slr-pg h4{margin:22px 4px 10px;font-size:15px;font-weight:900}
.slr-pg .r-fl{display:flex;flex-direction:column;gap:8px;padding-bottom:calc(20px + env(safe-area-inset-bottom))}
.slr-pg .r-fr{display:flex;align-items:center;gap:12px;padding:9px 10px 9px 12px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);animation:slrmt .4s ease both;animation-delay:calc(var(--k)*40ms)}
.slr-pg .r-fr .r-av{position:relative;width:44px;height:44px;border-radius:50%;overflow:hidden;display:grid;place-items:center;flex:none;background:linear-gradient(140deg,rgba(255,255,255,.28),rgba(255,255,255,.1))}.slr-pg .r-fr .r-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.slr-pg .r-fr .r-av b{font-weight:900}
.slr-pg .r-fr>span{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.slr-pg .r-fr b{font-size:14.5px;font-weight:800}.slr-pg .r-fr small{font-size:11.5px;opacity:.5}.slr-pg .r-fr small.r-on2{opacity:.85}.slr-pg .r-fr small.r-on2::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#3EE08F;margin-inline-end:5px;vertical-align:1px}
.slr-pg .r-fr>button{height:36px;min-width:76px;padding:0 14px;border-radius:13px;border:0;background:#fff;color:#14101c;font-size:12.5px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .25s}
.slr-pg .r-fr>button.r-done2{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.18)}.slr-pg .r-fr>button svg{width:14px;height:14px}
.slr-pg .r-fsk{height:64px;border-radius:18px;background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.09),rgba(255,255,255,.04));background-size:200% 100%;animation:slrsk 1.2s linear infinite}@keyframes slrsk{to{background-position:-200% 0}}
.slr-pg .r-fe{text-align:center;opacity:.6;font-size:13px;padding:24px 0}
.slr .r-wel{position:absolute;z-index:9;left:16px;right:16px;top:calc(max(10px,env(safe-area-inset-top)) + 58px);display:flex;align-items:center;justify-content:center;gap:10px;text-shadow:0 1px 3px rgba(0,0,0,.75),0 0 14px rgba(0,0,0,.4);animation:slrdoor .5s cubic-bezier(.2,1.3,.3,1) both}
.slr .r-wel.r-out{opacity:0;transform:translateY(10px);transition:all .3s}
.slr .r-wel>i{display:grid;color:#fff;flex:none}.slr .r-wel>i svg{width:20px;height:20px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.7))}
.slr .r-wel>span{display:flex;flex-direction:column;gap:2px}.slr .r-wel b{font-size:14.5px;font-weight:900}.slr .r-wel small{font-size:12px;opacity:.75}
.slr .r-st .r-mx.r-lockm{background:#fff;color:#14101c;border-color:#fff}
.slr .r-mic.r-lockd{color:#14101c;background:rgba(255,255,255,.9);border-color:#fff}
.slr .r-mic.r-lockd::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:1.5px dashed rgba(255,255,255,.6)}
.slr .r-in.r-cb{opacity:.75}.slr .r-in.r-cb svg{width:18px;height:18px;opacity:.7;flex:none;margin-inline-end:8px}.slr .r-sd:disabled{opacity:.35}
.slr .r-flash{position:absolute;z-index:9;left:16px;right:16px;bottom:calc(84px + env(safe-area-inset-bottom));text-align:center;font-size:14px;font-weight:900;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.8),0 0 16px rgba(0,0,0,.5);animation:slrpill .3s ease}
.slr .r-flash.r-out{opacity:0;transition:opacity .3s}
.slr-pc{position:fixed;inset:0;z-index:2147480001;display:flex;align-items:flex-end;background:radial-gradient(120% 70% at 50% 100%,rgba(20,8,40,.55),rgba(0,0,0,.18));opacity:0;transition:opacity .25s}
.slr-pc.r-in{opacity:1}
.slr-pc.out{opacity:0;transition:opacity .26s}
.slr-pc.out .r-pcb{transform:translateY(40px) scale(.97);opacity:0;transition:transform .26s ease-in,opacity .26s}
.slr-pc button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.slr-pc .r-pcb{position:relative;width:calc(100% - 24px);margin:0 12px calc(10px + env(safe-area-inset-bottom));padding:12px 16px 16px;border-radius:30px;color:#fff;
 background:linear-gradient(180deg,rgba(70,46,112,.95),rgba(36,24,62,.97) 60%);border:1px solid rgba(214,196,255,.28);
 box-shadow:0 30px 70px -24px rgba(0,0,0,.85),inset 0 1px 0 rgba(255,255,255,.24);transform:translateY(110%);transition:transform .62s cubic-bezier(.2,1.25,.3,1)}
.slr-pc.r-in .r-pcb{transform:none}
.slr-pc.r-done .r-pcb{transition:none}
/* northern lights behind the face */
.slr-pc .r-aur{position:absolute;left:50%;top:-70px;width:300px;height:170px;margin-left:-150px;pointer-events:none;border-radius:50%;filter:blur(26px);opacity:.75;
 background:conic-gradient(from 0deg,rgba(240,171,252,.0),rgba(240,171,252,.55),rgba(129,140,248,.5),rgba(245,201,131,.45),rgba(240,171,252,.0));animation:slraur 9s linear infinite}
@keyframes slraur{to{transform:rotate(360deg)}}
.slr-pc .r-phd{position:relative;display:flex;justify-content:space-between;align-items:center;z-index:2;direction:ltr}
.slr-pc .r-pi{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;padding:0;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(214,196,255,.3);transition:background .2s,transform .15s}
.slr-pc .r-pi svg{width:17px;height:17px}
.slr-pc .r-pi:active{transform:scale(.88)}
/* the face, centred, half outside the card */
.slr-pc .r-pfa{position:relative;display:flex;justify-content:center;margin:-108px 0 0;height:122px;pointer-events:none;z-index:1}
.slr-pc .r-ring{position:relative;width:112px;height:112px;border-radius:50%;display:grid;place-items:center}
.slr-pc .r-rc{position:absolute;inset:0;border-radius:50%;padding:3.5px;background:conic-gradient(from var(--r0,0deg),#f0abfc,#a78bfa,#818cf8,#f5c983,#f0abfc);
 -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.35;transform:scale(.8);transition:opacity .5s,transform .6s cubic-bezier(.2,1.6,.3,1)}
.slr-pc .r-ring.r-lit .r-rc{opacity:1;transform:none;animation:slrrc 6s linear infinite}
@keyframes slrrc{to{rotate:360deg}}
.slr-pc .r-ring::after{content:'';position:absolute;inset:-10px;border-radius:50%;background:radial-gradient(circle,rgba(240,171,252,.35),transparent 68%);opacity:0;transition:opacity .6s}
.slr-pc .r-ring.r-lit::after{opacity:1;animation:slrgl 3.2s ease-in-out infinite}
@keyframes slrgl{50%{transform:scale(1.08);opacity:.65}}
.slr-pc .r-orb{position:absolute;inset:-6px;border-radius:50%;opacity:0;transition:opacity .4s .3s}
.slr-pc .r-orb::before{content:'';position:absolute;top:0;left:50%;width:7px;height:7px;margin:-3.5px;border-radius:50%;background:#fff;box-shadow:0 0 10px 3px rgba(245,201,131,.9),0 0 22px 6px rgba(240,171,252,.6)}
.slr-pc .r-ring.r-lit .r-orb{opacity:1;animation:slrorb 4.5s linear infinite}
@keyframes slrorb{to{transform:rotate(360deg)}}
.slr-pc .r-ring .r-av,.r-av.r-fly{position:relative;width:98px;height:98px;border-radius:50%;overflow:hidden;display:grid;place-items:center;font-size:34px;font-weight:900;color:#fff;box-shadow:0 14px 30px -10px rgba(0,0,0,.7);z-index:1}
.r-av.r-fly{position:fixed!important;z-index:2147480005;margin:0;pointer-events:none;will-change:transform}
.slr-pc .r-ring .r-av img,.r-av.r-fly img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
/* the landing: a soft wave and a few stars */
.slr-pc .r-burst{position:absolute;inset:0;pointer-events:none;z-index:2}
.slr-pc .r-wave{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(245,201,131,.85);animation:slrwave .9s ease-out forwards}
@keyframes slrwave{from{transform:scale(.9);opacity:1}to{transform:scale(1.9);opacity:0;border-width:.5px}}
.slr-pc .r-spk{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px;rotate:var(--a);animation:slrspk2 1.05s cubic-bezier(.15,.8,.3,1) forwards}
.slr-pc .r-spk::before{content:'';position:absolute;inset:0;background:#fff;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);filter:drop-shadow(0 0 4px #f5c983);transform:scale(var(--s))}
@keyframes slrspk2{from{transform:translateY(0) scale(.2);opacity:1}70%{opacity:1}to{transform:translateY(calc(var(--d) * -1)) scale(1);opacity:0}}
.slr-pc .r-pbds{position:absolute;bottom:14px;left:50%;margin-left:26px;display:flex;gap:4px;z-index:3}
.slr-pc .r-pbd{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#e11d48;border:2px solid #2c1d4b;color:#fff;animation:slrpbd .35s cubic-bezier(.2,1.6,.3,1)}
.slr-pc .r-pbd.r-pbm{background:#475569}
.slr-pc .r-pbd svg{width:12px;height:12px}
@keyframes slrpbd{from{transform:scale(0)}}
/* name, id, seat */
.slr-pc .r-pid{display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;margin-top:2px}
.slr-pc .r-pid b{font-size:23px;font-weight:900;line-height:1.15;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
 background:linear-gradient(180deg,#fff 30%,#e9d5ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.slr-pc .r-pid small{font-size:12px;opacity:.66;direction:ltr}
.slr-pc .r-pseat{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:800;padding:4px 11px;border-radius:11px;background:rgba(167,139,250,.24);border:1px solid rgba(196,181,253,.32)}
.slr-pc .r-pseat svg{width:14px;height:14px}
.slr-pc .r-pid,.slr-pc .r-pg2,.slr-pc .r-pbs{opacity:0;transform:translateY(12px);transition:opacity .4s,transform .5s cubic-bezier(.2,1.3,.3,1)}
.slr-pc.r-in .r-pid{opacity:1;transform:none;transition-delay:.32s}
.slr-pc.r-in .r-pg2{opacity:1;transform:none;transition-delay:.42s}
.slr-pc.r-in .r-pbs{opacity:1;transform:none;transition-delay:.52s}
.slr-pc.r-done .r-pid,.slr-pc.r-done .r-pg2,.slr-pc.r-done .r-pbs{transition:none}
/* gifts */
.slr-pc .r-pg2{margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.12)}
.slr-pc .r-gh{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px}
.slr-pc .r-gh b{font-size:15px;font-weight:900}
.slr-pc .r-gh small{font-size:12px;font-weight:800;color:#f5c983}
.slr-pc .r-gs{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.slr-pc .r-gt{--c:244,114,182;position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;padding:14px 6px 10px;border-radius:16px;
 background:linear-gradient(180deg,rgba(var(--c),.2),rgba(var(--c),.08));border:1px solid rgba(var(--c),.38)}
.slr-pc .r-gt:nth-child(3n+2){--c:245,190,90}.slr-pc .r-gt:nth-child(3n){--c:52,211,170}
.slr-pc.r-in .r-gt{animation:slrgt .5s cubic-bezier(.2,1.5,.3,1) both;animation-delay:calc(.45s + var(--k)*70ms)}
@keyframes slrgt{from{transform:scale(.7) translateY(10px);opacity:0}}
.slr-pc .r-ga{width:36px;height:36px;display:grid;place-items:center;filter:drop-shadow(0 0 10px rgba(var(--c),.55))}
.slr-pc .r-ga svg,.slr-pc .r-ga img{width:30px;height:30px;object-fit:contain}
.slr-pc .r-gt em{font-style:normal;font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.slr-pc .r-gt>b{position:absolute;top:6px;inset-inline-start:7px;min-width:19px;height:19px;padding:0 5px;border-radius:10px;display:grid;place-items:center;font-size:10px;font-weight:900;background:rgba(0,0,0,.35)}
.slr-pc .r-g0{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 0 6px;font-size:12.5px;opacity:.72}
.slr-pc .r-g0 svg{width:18px;height:18px}
/* actions */
.slr-pc .r-pbs{display:flex;gap:8px;margin-top:16px}
.slr-pc .r-pb{flex:1;height:46px;display:flex;align-items:center;justify-content:center;gap:7px;border-radius:15px;border:1px solid rgba(214,196,255,.28);background:rgba(255,255,255,.06);color:#fff;font-size:12.5px;font-weight:800;padding:0 8px}
.slr-pc .r-pb svg{width:17px;height:17px;flex:none}
.slr-pc .r-pb span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.slr-pc .r-pb.r-main{position:relative;overflow:hidden;background:linear-gradient(180deg,#f8d49a,#eab676);color:#2a1a0c;border-color:rgba(255,230,180,.8);flex:1.15}
.slr-pc .r-pb.r-main::after{content:'';position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.65),transparent);animation:slrshine 3.6s ease-in-out 1.2s infinite}
@keyframes slrshine{0%{left:-60%}35%,100%{left:130%}}
.slr-pc .r-pb.r-soft{opacity:.8}
.slr-pc .r-pb:active{transform:scale(.97)}
/* the ⋯ menu: a glass panel that unfolds from the button */
.slr-pc .r-pmn{position:absolute;top:58px;right:14px;z-index:5;width:232px;padding:7px;border-radius:20px;
 background:linear-gradient(180deg,rgba(88,62,136,.97),rgba(48,32,82,.98));border:1px solid rgba(214,196,255,.32);box-shadow:0 24px 50px -14px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.25);
 transform-origin:calc(100% - 20px) -8px;animation:slrmn .38s cubic-bezier(.2,1.4,.3,1)}
.slr-pc .r-pmn.r-out{transform:scale(.6);opacity:0;transition:transform .2s ease-in,opacity .2s}
@keyframes slrmn{from{transform:scale(.4) translateY(-10px);opacity:0}}
.slr-pc .r-mr{width:100%;display:flex;align-items:center;gap:11px;padding:10px 10px;border:0;border-radius:14px;background:none;color:#fff;font-size:13.5px;font-weight:800;text-align:start;animation:slrmr .35s cubic-bezier(.2,1.3,.3,1) both}
.slr-pc .r-mr:nth-child(2){animation-delay:.04s}.slr-pc .r-mr:nth-child(3){animation-delay:.08s}.slr-pc .r-mr:nth-child(5){animation-delay:.12s}
@keyframes slrmr{from{opacity:0;transform:translateY(-6px)}}
.slr-pc .r-mr:active{background:rgba(255,255,255,.08)}
.slr-pc .r-mr span{flex:1}
.slr-pc .r-mi{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.09);flex:none;transition:background .25s,color .25s}
.slr-pc .r-mi svg{width:17px;height:17px}
.slr-pc .r-mr.r-on .r-mi{background:rgba(148,163,184,.28)}
.slr-pc .r-mr.r-red.r-on .r-mi{background:rgba(244,63,94,.28);color:#fda4af}
.slr-pc .r-sw{position:relative;width:38px;height:22px;border-radius:11px;background:rgba(255,255,255,.16);flex:none;transition:background .25s}
.slr-pc .r-sw i{position:absolute;top:3px;inset-inline-start:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.35);transition:inset-inline-start .3s cubic-bezier(.2,1.5,.3,1)}
.slr-pc .r-mr.r-on .r-sw{background:#94a3b8}
.slr-pc .r-mr.r-red.r-on .r-sw{background:#e11d48}
.slr-pc .r-mr.r-on .r-sw i{inset-inline-start:19px}
.slr-pc .r-mr.r-busy{opacity:.6;pointer-events:none}
.slr-pc .r-mch{display:grid;opacity:.6}.slr-pc .r-mch svg{width:15px;height:15px}
.slr-pc[dir=ltr] .r-mch svg{transform:scaleX(-1)}
.slr-pc .r-mdv{display:block;height:1px;margin:4px 8px;background:rgba(255,255,255,.12)}
@media (prefers-reduced-motion:reduce){.slr-pc .r-pcb,.slr-pc .r-pid,.slr-pc .r-pg2,.slr-pc .r-pbs{transition:opacity .2s!important}.slr-pc .r-aur,.slr-pc .r-rc,.slr-pc .r-orb,.slr-pc .r-ring::after,.slr-pc .r-pb.r-main::after{animation:none!important}}
@keyframes slrin{from{opacity:0;transform:translateY(-10px) scale(.98)}}
.slr-sh{position:fixed;inset:0;z-index:2147480001;background:rgba(8,4,18,.45);display:flex;align-items:flex-end;animation:slrfade .2s}.slr-sh.out{opacity:0;transition:opacity .2s}
.slr-sh .r-bx{width:100%;padding:10px 16px calc(18px + env(safe-area-inset-bottom));border-radius:28px 28px 0 0;background:linear-gradient(180deg,rgba(54,30,84,.94),rgba(30,16,50,.96));border:1px solid rgba(255,255,255,.12);border-bottom:0;-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);color:#fff;animation:slrup .3s cubic-bezier(.2,.9,.2,1)}
.slr-sh .r-gr{display:block;width:44px;height:5px;border-radius:3px;background:rgba(255,255,255,.3);margin:0 auto 12px}
.slr-sh .r-sh-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}.slr-sh .r-sh-hd b{display:block;font-size:19px;font-weight:900}.slr-sh .r-sh-hd small{display:block;margin-top:4px;font-size:12.5px;opacity:.7;line-height:1.7}
.slr-sh .r-xx{flex:none;width:36px;height:36px;border-radius:12px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.18);background:none;color:#fff}.slr-sh .r-xx svg{width:16px;height:16px}
.slr-sh .r-op{width:100%;height:52px;display:flex;align-items:center;justify-content:center;gap:9px;margin-top:10px;border-radius:16px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.04);color:#fff;font:inherit;font-size:14.5px;font-weight:800}.slr-sh .r-op svg{width:19px;height:19px}.slr-sh .r-op.r-red{color:#FF9AA7}
.slr-sh .r-two{display:flex;gap:10px}.slr-sh .r-two .r-op{flex:1}.slr-sh .r-op.r-pk{background:linear-gradient(140deg,#FFB3C0,#FF8A9D);border:0;color:#3A0614}
@keyframes slrfade{from{opacity:0}}@keyframes slrup{from{transform:translateY(40px);opacity:.6}}
html.wk-rm .slr *,html.wk-rm .slr-sh *{animation:none!important}`;
css+=`
/* ===== 0.2.48 dock: clear liquid glass, white only ===== */
.slr .r-bb.r-lq,.slr.r-typing>.r-bb.r-lq.r-bb.r-bb{display:flex;align-items:center;gap:8px;padding:0;background:none!important;border:0!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;border-radius:0}
.slr .r-lq .r-cap,.slr .r-lq .r-sd,.slr .r-lq .r-orb,.slr .r-entry-notice{position:relative;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,0) 40%,rgba(255,255,255,.04))!important;border:0!important;
 box-shadow:inset 0 1.2px 0 rgba(255,255,255,.85),inset 0 -1px 0 rgba(255,255,255,.28),inset 1px 0 0 rgba(255,255,255,.22),inset -1px 0 0 rgba(255,255,255,.22),inset 0 0 14px rgba(255,255,255,.12),0 10px 26px -12px rgba(0,0,0,.6)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
.slr .r-lq .r-cap::after,.slr .r-lq .r-sd::after,.slr .r-lq .r-orb::after,.slr .r-entry-notice::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(70% 55% at 22% 0%,rgba(255,255,255,.26),transparent 62%),radial-gradient(50% 45% at 85% 105%,rgba(255,255,255,.13),transparent 60%)}
.slr .r-lq .r-cap{flex:1;min-width:0;height:48px;border-radius:24px;display:flex;align-items:center;gap:0;padding-inline:7px 16px}
.slr .r-lq .r-orbs{display:flex;align-items:center;gap:4px;margin-inline-end:12px}
.slr .r-lq .r-orb{width:34px;height:34px;border-radius:50%;color:#fff;display:grid;place-items:center;padding:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .15s,background .2s}
.slr .r-lq .r-orb:active{transform:scale(.88)}
.slr .r-lq .r-orb .r-di{width:18px;height:18px;position:relative;z-index:1}
.slr .r-lq .r-orb .r-dia{width:16px;height:16px}
.slr .r-lq .r-mic:not(.r-on){color:rgba(255,255,255,.62)}
.slr .r-lq .r-spk:not(.r-on){color:rgba(255,255,255,.62)}
.slr .r-lq .r-mic.r-on{background:#fff!important;color:#0b1650;box-shadow:0 0 0 3px rgba(255,255,255,.16),0 0 16px rgba(255,255,255,.45)!important}
.slr .r-lq .r-mic.r-on::after{display:none}
.slr .r-lq .r-mic.r-wait{animation:slrwait 1s ease-in-out infinite}
@keyframes slrwait{50%{opacity:.6}}
.slr .r-lq .r-mic .r-halo{position:absolute;inset:-4px;border-radius:50%;border:1.5px solid transparent;pointer-events:none}
.slr .r-lq .r-mic.r-live .r-halo{border-color:rgba(255,255,255,.7);animation:slrhalo 1s ease-out infinite}
.slr .r-lq .r-mic.r-lockd{background:rgba(255,255,255,.9)!important;color:#0b1650}
.slr .r-lq .r-in{flex:1;min-width:0;height:48px;padding:0;border:0!important;background:none!important;border-radius:0}
.slr .r-lq .r-in:focus-within{background:none!important}
.slr .r-lq .r-in input{font-size:15px;color:#fff}
.slr .r-lq .r-in input::placeholder{color:rgba(255,255,255,.62)}
.slr .r-lq .r-sd,.slr.r-typing .r-lq .r-sd{flex:none;width:48px;height:48px;border-radius:50%;padding:0;display:grid;place-items:center;color:#0b1650!important;opacity:1;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.slr .r-lq .r-sd::before{content:'';position:absolute;inset:7px;border-radius:50%;background:#fff;box-shadow:0 6px 16px -6px rgba(255,255,255,.55),inset 0 -2px 4px rgba(11,22,80,.18)}
.slr .r-lq .r-sd .r-diu{width:18px;height:18px;position:relative;z-index:1}
.slr .r-lq .r-sd:active::before{transform:scale(.9)}
.slr .r-lq .r-sd:disabled{opacity:.45}
[dir=rtl].slr .r-lq .r-sd svg{transform:none}
/* keyboard open: same capsule and drop, only the text box stays */
.slr.r-typing>.r-bb.r-lq.r-bb.r-bb{z-index:9}
.slr.r-typing .r-bb.r-lq .r-sd.r-sd{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,0) 40%,rgba(255,255,255,.04))!important;color:#0b1650!important}
.slr.r-typing .r-lq .r-orbs{display:none}
.slr.r-typing .r-lq .r-cap{padding-inline:18px 16px}
/* full screen typing: right above the keyboard; with the keyboard down it never covers the film controls */
.slr.slr.fs.fty>.r-fin{bottom:max(64px,calc(var(--kb,0px) + 10px))!important}
/* full screen typing box: clear liquid glass, white send button */
.slr .r-fin.r-fin{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,0) 40%,rgba(255,255,255,.04))!important;border:0!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;border-radius:24px;
 box-shadow:inset 0 1.2px 0 rgba(255,255,255,.85),inset 0 -1px 0 rgba(255,255,255,.28),inset 1px 0 0 rgba(255,255,255,.22),inset -1px 0 0 rgba(255,255,255,.22),inset 0 0 14px rgba(255,255,255,.12),0 10px 26px -12px rgba(0,0,0,.6)!important}
.slr .r-fin.r-fin::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(70% 55% at 22% 0%,rgba(255,255,255,.26),transparent 62%)}
.slr .r-fin input{position:relative;z-index:1}
.slr .r-fin input::placeholder{color:rgba(255,255,255,.62)!important}
.slr .r-fsd.r-fsd{position:relative;z-index:1;width:36px;height:36px;background:#fff!important;color:#0b1650!important;box-shadow:0 6px 16px -6px rgba(255,255,255,.55),inset 0 -2px 4px rgba(11,22,80,.18)}
.slr .r-fsd .r-diu{width:17px;height:17px}
[dir=rtl].slr .r-fsd svg{transform:none}
/* no notes over the film: YouTube starts by itself; the hidden marker only lets a tap reach the player */
.slr .r-yth{display:none!important}
/* the salon notice: its own glass pill, white bell */
.slr .r-mg.r-entry-notice{display:inline-flex;align-items:center;gap:8px;max-width:88%;padding:5px 14px 5px 5px;border-radius:18px;align-self:flex-start}
[dir=rtl].slr .r-mg.r-entry-notice{padding:5px 5px 5px 14px}
.slr .r-entry-notice .r-ma{flex:none;width:25px;height:25px;border-radius:50%;background:#fff!important;border:0!important;color:#0b1650!important;display:grid;place-items:center;position:relative;z-index:1}
.slr .r-entry-notice .r-ma svg{width:14px;height:14px}
/* header: chats, invite and exit stay on the left in every language; the salon name sits on the right */
[dir=ltr].slr .r-hd{flex-direction:row-reverse}
[dir=ltr].slr .r-hd .r-who{flex-direction:row-reverse;text-align:right}
[dir=ltr].slr .r-hd .r-nm{align-items:flex-end}
[dir=ltr].slr .r-hd .r-cv svg{transform:none}
.slr .r-entry-notice .r-mt{padding:0!important;border:0!important;background:none!important;font-size:12.5px!important;font-weight:700;line-height:1.7!important;color:#fff!important;position:relative;z-index:1}
`;
css+=`/* ===== 0.2.70 salon look: round glass seats ===== */
html body .slr .r-st .r-ch{display:none!important}
html body .slr .r-row{gap:4%!important;align-items:flex-start!important;justify-content:center!important}
html body .slr .r-st{flex:0 0 20%!important;max-width:84px!important}
html body .slr .r-st .r-cw{position:relative!important;display:block!important;width:100%!important;aspect-ratio:1!important;height:auto!important;border-radius:50%!important;border:1.5px solid rgba(255,255,255,.42)!important;background:transparent!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.32),inset 0 -10px 18px rgba(255,255,255,.04)!important}
html body .slr .r-st.r-on .r-cw{border-color:rgba(255,255,255,.9)!important}
html body .slr .r-st .r-who{top:4px!important;left:4px!important;width:calc(100% - 8px)!important;transform:none!important}
html body .slr .r-st .r-who .r-av{border:0!important;box-shadow:none!important}
html body .slr .r-st .r-lkb{top:50%!important;left:50%!important;transform:translate(-50%,-50%)!important;width:38%!important;background:none!important;border:0!important;color:rgba(255,255,255,.82)!important}
html body .slr .r-plus{position:absolute;inset:0;display:grid;place-items:center;font-size:28px;font-weight:300;line-height:1;color:rgba(255,255,255,.78);font-family:system-ui,sans-serif}
html body .slr .r-st:not(.r-on) .r-sn{color:rgba(255,255,255,.7)!important;font-weight:700!important}
html body .slr .r-st .r-sn{margin-top:5px!important}
html body .slr .r-seats{gap:10px!important}
/* header: no line under the salon name; exit shows the ⎋ sign */
html body .slr .r-hd .r-nm small{display:none!important}
html body .slr .r-esc{font-size:20px;line-height:1;color:#fff;font-family:system-ui,-apple-system,sans-serif}
/* the exit choices (keep / leave): two glass circles, leave in soft red */
/* ===== composer B1: mic + speaker on the left as their own circles, apps inside the writing box, send only while typing.
   Only the look changes: the same buttons, the same input, the same keyboard behaviour. ===== */
html body .slr .r-bb.r-lq{direction:ltr!important;display:flex!important;align-items:center!important;gap:8px!important}
html body .slr .r-bb.r-lq>.r-cap{display:contents!important}
html body .slr .r-bb.r-lq .r-orbs{display:contents!important}
html body .slr .r-bb.r-lq .r-orb{order:1;flex:none!important;width:48px!important;height:48px!important;min-width:48px!important;margin:0!important;border-radius:50%!important;border:1.5px solid rgba(255,255,255,.3)!important;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.03))!important;color:#fff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.22)!important;display:grid!important;place-items:center!important}
html body .slr .r-bb.r-lq .r-orb::after,html body .slr .r-bb.r-lq .r-orb .r-halo{display:none!important}
html body .slr .r-bb.r-lq .r-orb.r-on,html body .slr .r-bb.r-lq .r-orb.r-live{background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.03))!important;color:#fff!important;border-color:rgba(255,255,255,.3)!important}
html body .slr .r-bb.r-lq .r-orb svg{width:22px!important;height:22px!important}
html body .slr .r-bb.r-lq .r-orb.r-spk{order:2}
html body .slr .r-bb.r-lq .r-orb.r-apps{order:3;width:46px!important;min-width:46px!important;border-radius:24px 0 0 24px!important;border-right:0!important;background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.03))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.22)!important;border-color:rgba(255,255,255,.28)!important}
html body .slr .r-bb.r-lq .r-orb.r-apps svg{width:21px!important;height:21px!important}
html body .slr .r-bb.r-lq .r-in{order:4;flex:1!important;min-width:0!important;height:48px!important;margin:0 0 0 -8px!important;border-radius:0 24px 24px 0!important;border:1.5px solid rgba(255,255,255,.28)!important;border-left:0!important;background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.03))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.22)!important;direction:rtl;display:flex!important;align-items:center!important;padding:0 12px!important}
[dir=ltr].slr .r-bb.r-lq .r-in{direction:ltr}
html body .slr .r-bb.r-lq .r-in input{background:none!important;border:0!important}
html body .slr .r-bb.r-lq>.r-sd{order:5}
html body .slr:not(.r-typing) .r-bb.r-lq>.r-sd{display:none!important}
html body .slr.r-typing .r-bb.r-lq .r-in{margin:0!important;border-radius:24px!important;border-left:1.5px solid rgba(255,255,255,.28)!important}
/* ===== messages: 6 / 5 / 4 visible by seat rows, 4 while a film plays; older ones are a scroll away ===== */
html body .slr{--mvh:min(318px,36vh)}
html body .slr[data-rows="3"]{--mvh:min(266px,31vh)}
html body .slr[data-rows="4"]{--mvh:min(214px,26vh)}
html body .slr:not(.lobby){--mvh:min(214px,26vh)}
html body .slr:not(.r-typing) .r-msgs{max-height:var(--mvh)!important}
/* seat layouts by count: 3 = arc, 4 = diamond, 5 = 2+3, 7 = 1+2+4, otherwise rows of 4 with the short row on top */
html body .slr .r-row.r-n2 .r-st,html body .slr .r-row.r-n3 .r-st,html body .slr .r-row.r-n4 .r-st,html body .slr .r-row.r-n5 .r-st{flex:0 0 25%!important;max-width:96px!important}
html body .slr .r-row.r-n7 .r-st{flex:0 0 22%!important;max-width:82px!important}
html body .slr .r-row.r-arc .r-st:nth-child(2){margin-top:-22px}
html body .slr .r-row.r-arc .r-st:nth-child(1),html body .slr .r-row.r-arc .r-st:nth-child(3){margin-top:10px}
html body .slr .r-seats:has(.r-n4){gap:0!important}
/* while typing: mic, speaker and apps step aside (as before), only the box and send stay */
html body .slr.r-typing .r-bb.r-lq .r-orb{display:none!important}
/* ===== film mode: the player a little bigger; 2-4 seats in one small row; 5+ folded into a button; viewers = eye + count ===== */
html body .slr:not(.lobby):not(.fs) .r-stw{margin-left:-8px!important;margin-right:-8px!important}
html body .slr:not(.lobby) .r-audw{display:none!important}
html body .slr .r-row.r-fmini{gap:22px!important}
html body .slr .r-row.r-fmini .r-st{flex:0 0 58px!important;max-width:58px!important}
html body .slr .r-row.r-fmini .r-plus{font-size:20px}
html body .slr .r-fbar{display:flex;align-items:center;gap:8px;margin-top:2px}
html body .slr .r-fbar .r-sp{flex:1}
html body .slr .r-faud:empty{display:none}
html body .slr .r-fchip,html body .slr .r-aud.r-aud2{height:40px!important;border-radius:20px!important;border:1.5px solid rgba(255,255,255,.35)!important;background:transparent!important;color:#fff!important;display:inline-flex!important;align-items:center!important;gap:7px!important;padding:0 13px!important;font:inherit;font-size:14px!important;font-weight:800!important;box-shadow:none!important;animation:none!important}
html body .slr .r-fchip svg{width:19px;height:19px}
html body .slr .r-aud.r-aud2 .r-eye{width:19px!important;height:19px!important;border:0!important;background:none!important;box-shadow:none!important;color:#fff!important}
html body .slr .r-aud.r-aud2 .r-eye svg{width:19px;height:19px}
html body .slr .r-fct{width:40px;height:40px;border-radius:50%;border:1.5px solid rgba(255,255,255,.35);background:transparent;color:#fff;display:grid;place-items:center;padding:0}
html body .slr .r-fct svg{width:19px;height:19px}
html body .slr.r-chatoff:not(.lobby):not(.r-typing) .r-msgs{visibility:hidden!important;pointer-events:none!important}
/* the seats sheet (5+ seats while a film plays) */
html body .slr .r-fsh{position:fixed;inset:0;z-index:60;background:rgba(5,4,20,.45);opacity:0;pointer-events:none;transition:opacity .22s ease}
html body .slr .r-fsh.on{opacity:1;pointer-events:auto}
html body .slr .r-fshb,html body .slr-al .r-alb{position:absolute;left:10px;right:10px;bottom:calc(14px + env(safe-area-inset-bottom));border-radius:30px;padding:12px 14px 18px;border:1.5px solid rgba(255,255,255,.4);background:linear-gradient(180deg,rgba(40,30,90,.78),rgba(15,12,45,.86));-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 20px 50px rgba(0,0,0,.5);transform:translateY(24px);transition:transform .26s cubic-bezier(.2,.8,.2,1);color:#fff}
html body .slr .r-fsh.on .r-fshb,html body .slr-al.on .r-alb{transform:none}
html body .slr .r-grab,html body .slr-al .r-grab{display:block;width:40px;height:4px;border-radius:2px;background:rgba(255,255,255,.45);margin:0 auto 12px}
html body .slr .r-fsht,html body .slr-al .r-fsht{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:900;margin-bottom:12px}
html body .slr .r-fsht svg,html body .slr-al .r-fsht svg{width:19px;height:19px}
html body .slr .r-fsht small,html body .slr-al .r-fsht small{margin-inline-start:auto;font-size:12px;color:rgba(255,255,255,.65);font-weight:700}
html body .slr .r-fsg{display:grid;grid-template-columns:repeat(4,1fr);row-gap:12px;justify-items:center}
html body .slr .r-fsg .r-st{flex:none!important;width:62px!important;max-width:62px!important}
/* whoever talks: very small, in the film's corner */
html body .slr .r-stg{position:relative}
html body .slr .r-fspk{position:absolute;top:10px;left:12px;z-index:6;display:flex;gap:6px;pointer-events:none}
html body .slr .r-fspk i{display:block;width:24px;height:24px;border-radius:50%;overflow:hidden;border:1.5px solid #fff;box-shadow:0 0 0 2px rgba(110,243,197,.55),0 0 8px 2px rgba(110,243,197,.45)}
html body .slr .r-fspk .r-av{width:100%!important;height:100%!important;font-size:10px!important;border:0!important}
html body .slr.fs .r-fspk{display:none}
/* who came in / left: a faint line in the chat */
html body .slr .r-sys{align-self:center;text-align:center;font-size:11.5px;font-weight:700;color:rgba(255,255,255,.5);padding:2px 10px;margin:1px auto;max-width:90%}
/* viewers list */
.slr-al{position:fixed;inset:0;z-index:2147483000;background:rgba(5,4,20,.45);opacity:0;transition:opacity .22s ease;font-family:inherit}
.slr-al.on{opacity:1}
.slr-al .r-all{display:flex;flex-direction:column;gap:6px;max-height:50vh;overflow-y:auto}
.slr-al .r-alr{display:flex;align-items:center;gap:10px;padding:6px 4px;border:0;background:none;color:#fff;font:inherit;font-size:14.5px;font-weight:700;text-align:start}
.slr-al .r-alr .r-av{width:40px;height:40px;border-radius:50%;flex:none}
.slr-al .r-av{position:relative;overflow:hidden;display:grid;place-items:center;background:hsl(var(--h,260) 55% 45%);color:#fff;font-weight:900}
.slr-al .r-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.slr-al .r-alr bdi{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
html body .slr .r-seats:has(.r-fsh.on){position:relative;z-index:70}
/* a person on a seat covers the whole circle: no glass ring around the photo */
html body .slr .r-st.r-on .r-cw{border-color:transparent!important;box-shadow:none!important}
html body .slr .r-st.r-on .r-who{top:0!important;left:0!important;width:100%!important}
html body .slr .r-st.r-on .r-who .r-av{border:0!important;box-shadow:none!important}
html body .slr .r-st.r-on.r-talk .r-cw{box-shadow:0 0 0 2.5px var(--gr),0 0 18px rgba(62,224,143,.75)!important}
/* empty / locked seats: a light dark tint so a busy background shows through a little darker (not opaque) */
html body .slr .r-st:not(.r-on) .r-cw{background:rgba(8,6,24,.22)!important}
/* salon sub-pages (members, look, invite…): the header with the back button never slides under the phone's clock */
.slr-pg>.r-pgh{position:sticky;top:0;z-index:8;margin-left:-16px;margin-right:-16px;padding-left:16px;padding-right:16px;background:rgba(13,9,25,.97);box-shadow:0 -70px 0 0 rgba(13,9,25,.97)}
/* clean YouTube in the salon */
html body .slr .r-scr{position:relative}
html body .slr .r-scr.r-ytlock iframe{pointer-events:none!important}
html body .slr .r-ytc{position:absolute;inset:0;z-index:3;pointer-events:none;background:#000 var(--bg) center/cover no-repeat;opacity:0;transition:opacity .35s ease;border-radius:inherit;overflow:hidden}
html body .slr .r-ytc:before{content:"";position:absolute;inset:0;background:rgba(6,4,20,.45)}
html body .slr .r-ytc[data-m="load"],html body .slr .r-ytc[data-m="pause"],html body .slr .r-ytc[data-m="end"],html body .slr .r-ytc[data-m="tap"]{opacity:1}
html body .slr .r-ytc>i,html body .slr .r-ytc>b,html body .slr .r-ytc>.r-ytnx{position:absolute;display:none}
html body .slr .r-ytsp{left:50%;top:46%;width:38px;height:38px;margin:-19px 0 0 -19px;border-radius:50%;border:2.5px solid rgba(255,255,255,.25);border-top-color:#fff;animation:rytsp .8s linear infinite}
@keyframes rytsp{to{transform:rotate(360deg)}}
html body .slr .r-ytpl{left:50%;top:46%;width:66px;height:66px;margin:-33px 0 0 -33px;border-radius:50%;border:1.5px solid rgba(255,255,255,.7);background:rgba(255,255,255,.08)}
html body .slr .r-ytpl:after{content:"";position:absolute;left:26px;top:20px;border-style:solid;border-width:13px 0 13px 21px;border-color:transparent transparent transparent #fff}
html body .slr .r-ytc[data-m="load"]>.r-ytsp{display:block}
html body .slr .r-ytc[data-m="pause"]>.r-ytpl,html body .slr .r-ytc[data-m="tap"]>.r-ytpl{display:block}
html body .slr .r-yttap{left:0;right:0;top:calc(46% + 44px);text-align:center;font-size:13px;font-weight:800;color:#fff}
html body .slr .r-ytc[data-m="tap"]>.r-yttap{display:block}
html body .slr .r-ytc[data-m="end"]>.r-ytnx:not(:empty){display:flex}
html body .slr .r-ytc[data-m="end"]>.r-ytnx:empty~.r-ytsp,html body .slr .r-ytc[data-m="end"]>.r-ytsp{display:block}
html body .slr .r-ytc[data-m="end"]:has(.r-ytnx:not(:empty))>.r-ytsp{display:none}
html body .slr .r-ytnx{left:14px;right:14px;top:50%;transform:translateY(-50%);align-items:center;gap:12px;padding:10px 12px;border-radius:18px;border:1.5px solid rgba(255,255,255,.35);color:#fff;text-align:start}
html body .slr .r-ytnx .r-ytth{width:58px;height:40px;border-radius:9px;overflow:hidden;flex:none;background:rgba(255,255,255,.1)}
html body .slr .r-ytnx .r-ytth img{width:100%;height:100%;object-fit:cover}
html body .slr .r-ytnx small{display:block;font-size:11.5px;color:rgba(255,255,255,.7);font-weight:700}
html body .slr .r-ytnx b{font-size:14px;font-weight:800;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
html body .slr .r-ytnx>span:last-child{min-width:0}

/* exit menu (approved sample A): a clear glass capsule under the exit button, two circles inside, a small diamond pointing up */
html body .s9-pop .s9-dr{width:82px!important;padding:10px!important;gap:14px!important;border-radius:41px!important;background:rgba(14,10,34,.42)!important;border:1.5px solid rgba(255,255,255,.3)!important;box-shadow:0 22px 44px -18px rgba(0,0,0,.75),inset 0 1px 0 rgba(255,255,255,.3)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
html body .s9-pop .s9-nk{top:-7px!important;width:12px!important;height:12px!important;margin-left:-6px!important;border-radius:2px!important;transform:rotate(45deg);background:rgba(120,100,200,.55)!important;border:0!important;border-left:1.5px solid rgba(255,255,255,.3)!important;border-top:1.5px solid rgba(255,255,255,.3)!important;animation:none!important}
html body .s9-pop .s9-o{width:60px!important;height:60px!important;border-radius:50%!important;border:1.5px solid rgba(255,255,255,.42)!important;background:rgba(22,18,56,.55)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.25)!important;color:#fff!important}
html body .s9-pop .s9-o svg{width:23px!important;height:23px!important}
html body .s9-pop .s9-o.s9-dg{border-color:rgba(255,120,140,.75)!important;color:#ff8b99!important;background:rgba(70,18,44,.55)!important}
/* music: heard only — the film area is put aside (still playing), the salon keeps its seats-and-chat look */
html body .slr.r-music .r-stw{display:block!important;position:fixed!important;left:0!important;bottom:0!important;top:auto!important;width:4px!important;height:4px!important;opacity:.01!important;pointer-events:none!important;margin:0!important;overflow:hidden!important;z-index:-1!important}
/* the small record on the seat of whoever played the song: turns while it plays, stands still on pause */
html body .slr .r-st .r-disc{position:absolute;left:-4%;bottom:-4%;width:40%;aspect-ratio:1;border-radius:50%;z-index:4;border:1.5px solid rgba(255,255,255,.9);box-shadow:0 3px 10px rgba(0,0,0,.6);
 background:radial-gradient(circle,#F2B13A 0 15%,#151018 16% 21%,#2b2530 22% 27%,#151018 28% 36%,#2b2530 37% 43%,#151018 44% 54%,#26202b 55% 64%,#151018 65% 100%)}
html body .slr .r-st .r-disc>i{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 20deg,transparent 0 12%,rgba(255,255,255,.28) 16%,transparent 22% 62%,rgba(255,255,255,.16) 66%,transparent 72%)}
html body .slr .r-st .r-disc.r-spin{animation:rdisc 3.2s linear infinite}
@keyframes rdisc{to{transform:rotate(360deg)}}
/* «+» on the salon picture for someone who is not a member yet */
html body .slr .r-hd .r-who{position:relative}
html body .slr .r-hd .r-jb{position:absolute;bottom:-2px;right:30px;left:auto;width:20px;height:20px;border-radius:50%;background:#fff;color:#14101c;display:grid;place-items:center;font-style:normal;font-size:16px;font-weight:900;line-height:1;box-shadow:0 2px 8px rgba(0,0,0,.5);z-index:3}
/* the song did not start by itself */
html body .slr .r-mtap{display:none;align-self:center;margin:6px auto 0;height:38px;padding:0 16px;border-radius:19px;border:1.5px solid rgba(255,255,255,.5);background:rgba(10,6,24,.35);color:#fff;font:inherit;font-size:13.5px;font-weight:800;align-items:center;gap:8px}
html body .slr .r-mtap svg{width:18px;height:18px}
html body .slr.r-mtapon .r-mtap{display:inline-flex}
/* «برای شنیدن بزن»: the (almost invisible) player itself lies right under the button, so the tap reaches YouTube and the phone lets the sound start */
html body .slr.r-music.r-mtapon .r-stw{left:var(--tx,0)!important;top:var(--ty,0)!important;bottom:auto!important;width:var(--tw,4px)!important;height:var(--th,4px)!important;pointer-events:auto!important;z-index:60!important}
html body .slr.r-music.r-mtapon .r-stw *{pointer-events:auto!important}
html body .slr.r-music.r-mtapon .r-ytc,html body .slr.r-music.r-mtapon .r-ctl,html body .slr.r-music.r-mtapon .r-fo{display:none!important}
html body .slr.r-music .r-mtap{pointer-events:none}
/* «در حال پخش»: tiny capsule under the header, right side */
/* the now-playing capsule has its own fixed row above the seats (kept empty when nothing plays): it never covers a seat and the seats never move */
html body .slr .r-npw{position:relative!important;top:auto!important;right:auto!important;left:auto!important;z-index:40!important;height:32px!important;margin:6px 14px 0!important;flex:none}
html body .slr .r-npw>.r-np{position:absolute;top:0;right:0}
html body .slr:not(.lobby) .r-npw{display:none!important}
/* the seats keep the same place with or without music (room for the now-playing capsule is always kept): nothing jumps */
html body .slr.r-music .r-seats,html body .slr.lobby .r-seats{margin-top:10px!important}
html body .slr.lobby .r-stw:empty{margin-top:0!important}
html body .slr .r-np{direction:rtl;border-radius:16px;border:1.5px solid rgba(255,255,255,.4);background:rgba(10,6,24,.4);max-width:230px}html body .slr .r-np.r-npopen{background:rgba(12,8,26,.9);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
html body .slr .r-np1{display:flex;align-items:center;gap:7px;height:30px;padding:0 10px 0 5px;background:none;border:0;color:#fff;font:inherit;max-width:100%}
html body .slr .r-np1 bdi{font-size:11.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
html body .slr .r-npd{width:20px;height:20px;border-radius:50%;flex:none;border:1px solid rgba(255,255,255,.85);background:radial-gradient(circle,#F2B13A 0 15%,#151018 16% 24%,#2b2530 25% 34%,#151018 35% 48%,#26202b 49% 62%,#151018 63% 100%)}
html body .slr .r-npd.r-spin{animation:rdisc 3.2s linear infinite}
html body .slr .r-npe{display:flex;gap:2px;align-items:flex-end;height:11px;flex:none}
html body .slr .r-npe i{width:2.5px;height:4px;background:#9ff5d2;border-radius:2px}
html body .slr .r-npon .r-npe i{animation:rnpe .9s ease-in-out infinite}html body .slr .r-npon .r-npe i:nth-child(2){animation-delay:.2s}html body .slr .r-npon .r-npe i:nth-child(3){animation-delay:.4s}
@keyframes rnpe{50%{height:11px}}
html body .slr .r-np2{display:flex;justify-content:center;gap:8px;direction:ltr;margin:0 10px;padding:5px 0 6px;border-top:1px solid rgba(255,255,255,.18)}
html body .slr .r-npb{width:26px;height:26px;border-radius:50%;border:1.5px solid rgba(255,255,255,.45);background:transparent;color:#fff;display:grid;place-items:center;padding:0}
html body .slr .r-npb svg{width:12px;height:12px}
html body .slr .r-npb.r-npm{background:#fff;border:0;color:#14101c}
html body .slr .r-npb.r-npx{border-color:rgba(255,120,140,.75);color:#ff8b99}
html body .slr.fs .r-npw{display:none}
/* 0.2.75 salon pages (members, look, invite…): the clock's height lives inside the sticky header, so the back button and the
   title always sit under the clock — also on pages that set their own top padding to 0 (members) */
html body .slr-pg:has(>.r-pgh){padding-top:0!important}
html body .slr-pg>.r-pgh{top:0!important;padding-top:max(14px,env(safe-area-inset-top))!important;padding-bottom:10px;margin-bottom:6px!important;box-shadow:none!important;align-items:center}
html body .slr-pg>.r-pgh b{font-size:20px!important;line-height:1.25}
html body .slr-pg>.r-pgh small{margin-top:2px}
/* 0.2.75 mic-off badge on a seat: smaller and lighter */
html body .slr .r-st .r-mx{width:30%!important;bottom:-2%!important;inset-inline-end:-6%!important;background:rgba(18,12,28,.5)!important;border:1px solid rgba(255,255,255,.35)!important;box-shadow:0 2px 6px rgba(0,0,0,.3)!important;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
html body .slr .r-st .r-mx svg{width:56%!important;height:56%!important;opacity:.9}
html body .slr .r-st .r-mx.r-lockm{background:rgba(255,255,255,.85)!important}
/* 0.2.75 capsule buttons: more room between stop, play/pause and next */
html body .slr .r-np2{gap:22px!important;padding:7px 0 8px!important}
`;
function style(){if(document.getElementById('slr3-css'))return;const s=document.createElement('style');s.id='slr3-css';s.textContent=css;document.head.appendChild(s)}
/* the salon's look is prepared quietly after start, so the first entry does not have to wait for it */
try{setTimeout(()=>{try{(window.requestIdleCallback||(f=>setTimeout(f,0)))(()=>style())}catch(e){}},4000)}catch(e){}
window.SLR3={mount,unmount,paint,ok:()=>true,tx,k:{stopOnLeave:code=>stopOnLeave(code),repaint:()=>{try{paint()}catch(e){}try{npPaint()}catch(e){}},x:()=>R.x||null,refreshX:()=>pollX(),musPending:v=>{R.xpend=v||'';try{paint()}catch(e){}},isMus:()=>isMus(),esc,sv,ava,num,hap,me,cs,cid,seats,mine,owner,canCtl,note,root,RTL,L,giftArt,giftName,nameC,personOf,seatOverride:n=>{R.seatOv=n?{n:Number(n),until:Date.now()+10000}:null;try{paint()}catch(e){}},fmute:()=>!!R.fmute,mic:micTap,speaker:spkTap,deaf:()=>!!R.deaf,setInfo:info=>{R.info=info;R.meLocked=info.can?.mic===false;acceptNotice();paint()},reload:()=>loadMeta(true),room:()=>({name:(R.room&&R.room.name)||(R.info&&R.info.name)||'',photo:(R.room&&R.room.photo)||'',bg:(R.room&&R.room.bg)||''})}};window.SLR3_PAGES=window.SLR3_PAGES||{};window.SLR3_PAGES.invite=window.SLR3_PAGES.invite||invitePage;
})();
/* iPhone: the page itself never moves or changes size (moving it under the clock confused the phone's «safe area» after full
   screen or a tab change, and the page slid down). Instead the strips above and below take the colour of the cinema page, so
   they read as part of it. Every other page keeps the app's usual colour there. */
(()=>{if(window.__wkEdge)return;window.__wkEdge=1;
 const ios=()=>{try{return !!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='ios')}catch(e){return false}};
 if(!ios())return;
 const plug=n=>{try{return (Capacitor.Plugins||{})[n]||null}catch(e){return null}};
 const shown=el=>!!(el&&el.getClientRects().length);
 const hex=c=>{const m=String(c||'').match(/\d+(\.\d+)?/g);if(!m||m.length<3||(m.length>3&&+m[3]===0))return '';return '#'+m.slice(0,3).map(x=>Math.round(+x).toString(16).padStart(2,'0')).join('')};
 const lum=h=>{const n=parseInt(h.slice(1),16);return ((n>>16&255)*.2126+(n>>8&255)*.7152+(n&255)*.0722)/255};
 const BASE='#071019',ROOM='#130c22';let now='',dark=null,n=0;
 /* in case an earlier test version left the page stretched under the clock, it is put back once */
 try{const p=plug('WakhanLocale');if(p&&p.edge)p.edge({full:false}).catch(()=>{})}catch(e){}
 const tick=()=>{const b=document.body;if(!b)return;const fs=[...document.querySelectorAll('.slr.fs,.pvw.fs,.fs .ytw-v')].some(shown);const room=!fs&&shown(document.querySelector('.slr'));
  const sl=b.classList.contains('sl-on')?document.querySelector('.sl'):null;const list=!fs&&!room&&shown(sl);
  if(!fs&&!room&&!list&&++n%4&&now===BASE)return;
  const c=fs?'#000000':room?ROOM:list?(hex(getComputedStyle(sl).backgroundColor)||hex(getComputedStyle(b).backgroundColor)||ROOM):BASE;
  if(c!==now){now=c;const p=plug('WakhanLocale');if(p)try{p.bars({color:c}).catch(()=>{})}catch(e){}}
  /* clock and battery stay readable */
  /* clock and battery stay readable; back on another page they follow that page again */
  const pg=fs||room||list?c:(hex(getComputedStyle(document.documentElement).backgroundColor)||hex(getComputedStyle(b).backgroundColor)||BASE);
  const d=lum(pg)<=.6;if(d!==dark){dark=d;const s=plug('StatusBar');if(s)try{s.setStyle({style:d?'DARK':'LIGHT'}).catch(()=>{})}catch(e){}}};
 setInterval(tick,400);document.addEventListener('visibilitychange',()=>{now='';tick()})})();
