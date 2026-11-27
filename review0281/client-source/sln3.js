/* WAKHAN 2.0 — «سینما» › «سالون» (built new). Part 1: the salon list (my salon, followed / joined / recent), discovering
   salons, creating the personal salon and entering with a code. The old name «دنج» becomes «سالون» in the interface only:
   codes, owners, members, links and history stay exactly as they are (server: wakhan_salon.py on the existing tables).
   Inside a salon the current hall keeps working until its own part is rebuilt. */
(()=>{if(window.SLN3)return;
const T={
fa:{cinema:'سینما',salon:'سالون',home:'خانه',history:'تاریخچه',search:'جستجو',mine:'سالون من',mineNone:'سالون شخصی خود را بسازید',
 followed:'دنبال‌شده‌ها',joined:'عضوشده‌ها',recent:'بازدیدهای اخیر',recentNote:'سالون‌هایی که بازدید کرده‌اید و هنوز اضافه نکرده‌اید.',
 emptyFollowed:'هنوز سالونی را دنبال نکرده‌اید.',emptyJoined:'هنوز عضو سالونی نشده‌اید.',emptyRecent:'بازدید تازه‌ای ندارید.',
 discover:'کشف سالون‌ها',secMine:'سالون‌های من',create:'ساخت سالون',joinCode:'ورود با کد',
 st_watching:'در حال تماشا',st_music:'در حال شنیدن موسیقی',st_talking:'در حال گفتگو',st_idle:'آماده',private:'خصوصی',memberOf:'عضو این سالون هستید',
 visitToday:'امروز وارد شدید',visitYesterday:'دیروز وارد شدید',visitDays:'{n} روز پیش وارد شدید',visitLong:'مدتی پیش وارد شدید',people:'{n} نفر حاضر',
 findPh:'نام سالون یا فلم',f_all:'همه',f_watch:'تماشا',f_music:'موسیقی',f_talk:'گفتگو',f_friends:'دوستان من',
 noSalons:'سالونی پیدا نشد.',noSalonsD:'نام دیگری را جستجو کنید یا سالون خود را بسازید.',
 createT:'ساخت سالون',createS:'تنظیم سالون شخصی',name:'نام سالون',namePh:'مثلاً شب دوستان واخان',edit:'ویرایش',seats:'شمار جایگاه‌ها',seatsD:'2 تا 16 جایگاه',seatsV:'{n} جایگاه',
 privacy:'حریم سالون',privacyD:'عمومی، دوستان یا با دعوت',p_all:'عمومی',p_friends:'دوستان',p_invite:'با دعوت',
 p_allD:'همه می‌توانند سالون را ببینند و وارد شوند.',p_friendsD:'فقط دوستان شما می‌توانند وارد شوند.',p_inviteD:'فقط دعوت‌شده‌ها و کسانی که می‌پذیرید وارد می‌شوند.',
 decor:'دکور سالون',decorD:'پیش‌نمایش پیش از ساخت',open:'بازکردن',gallery:'عکس از گالری',
 mic:'اجازهٔ میکروفون',m_all:'همه',m_friends:'دوستان',m_owner:'با اجازه',m_allD:'همه می‌توانند صحبت کنند.',m_friendsD:'فقط دوستان شما صحبت می‌کنند.',m_ownerD:'فقط با اجازهٔ میزبان',
 save:'ذخیره',cancel:'لغو',done:'تأیید',creating:'در حال ساخت…',created:'سالون شما ساخته شد.',already:'شما سالون شخصی دارید.',
 joinT:'ورود با کد',joinS:'سالون',joinBanner:'ورود به سالون دوستان',codeL:'کد سالون',codePh:'کد را وارد کنید',codeHelp:'میزبان می‌تواند کد یا پیوند دعوت را با شما شریک بسازد.',enter:'ورود به سالون',checking:'در حال بررسی…',
 badCode:'کد سالون درست نیست.',noRoom:'سالونی با این کد پیدا نشد.',err:'کار انجام نشد. دوباره تلاش کنید.',offline:'اتصال برقرار نیست. دوباره تلاش کنید.',back:'بازگشت',
 enter_closed:'ورود به این سالون فعلاً بسته است.',enter_friends:'این سالون ویژهٔ دوستان میزبان است.',enter_banned:'امکان ورود به این سالون را ندارید.',enter_invite:'ورود به این سالون با دعوت است.',
 soon:'این بخش در مرحلهٔ بعد ساخته می‌شود.',archive:'آرشیف واخان',watch:'تماشا',c_all:'همه',c_film:'فلم',c_series:'سریال',c_doc:'مستند',
 k_film:'فلم',k_series:'سریال',k_doc:'مستند',featured:'برگزیده',seasons:'{n} فصل',yt:'یوتیوب',ytD:'جستجو و پلیر جداگانه',archPh:'جستجو در آرشیف فلم و سریال',ytHint:'ویدیوهای یوتیوب جدا از آرشیف جستجو می‌شوند و در پلیر رسمی یوتیوب باز می‌شوند.',ytSearch:'جستجو در یوتیوب',ytPh:'جستجو در یوتیوب',yc_foryou:'برای شما',yc_music:'موسیقی',yc_film:'فلم',yc_series:'سریال',yc_doc:'مستند',yc_news:'خبر',yc_comedy:'طنز',yc_sport:'ورزش',yc_kids:'کودکان',ytNewMusic:'آهنگ‌های تازه',ytPickD:'هر بار که بیایید، چیزهای تازه',views:'{n} بازدید',nK:'{n} هزار',nM:'{n} میلیون',ago_n:'همین حالا',ago_m:'{n} دقیقه پیش',ago_h:'{n} ساعت پیش',ago_d:'{n} روز پیش',ago_w:'{n} هفته پیش',ago_mo:'{n} ماه پیش',ago_y:'{n} سال پیش',pullD:'پایین بکشید',pullR:'رها کنید تا موضوعات تازه بیاید',pullL:'در حال تازه‌سازی…',fresh:'موضوعات تازه آمد',inSalon:'در سالون',live:'زنده',ytEmpty:'فعلاً ویدیویی نیست',ytEmptyD:'کمی بعد دوباره امتحان کنید یا صفحه را پایین بکشید.',again2:'باز هم از آرشیف واخان',kn_title:'ورود به سالون',kn_yes:'درخواستت پذیرفته شد',kn_in:'ورود',kn_later:'بعداً',kn_yesD:'{n} در را برایت باز کرد',kn_knock:'در زدن',kn_sent:'درخواستت فرستاده شد · منتظر پاسخ مالک',kn_full:'سالون پُر است',kn_fullD:'فعلاً {n} نفر در سالون حضور دارند. می‌توانی برای مالک درخواست ورود بفرستی.',kn_closed:'ورود با اجازهٔ مالک',kn_closedD:'این سالون با دعوت است. در بزن تا مالک ورودت را بپذیرد.',kn_friends:'ویژهٔ دوستان مالک',kn_friendsD:'این سالون ویژهٔ دوستان مالک است. در بزن تا مالک ورودت را بپذیرد.',kn_go:'در زدن و فرستادن درخواست',kn_wait:'منتظر پاسخ مالک هستی',kn_waitD:'درخواست ورودت برای مالک فرستاده شد. پس از پذیرش و بازشدن جا، خودت وارد می‌شوی.',kn_cancel:'لغو درخواست',kn_no:'درخواستت پذیرفته نشد',kn_noD:'می‌توانی به فهرست سالون‌ها برگردی.',kn_back:'برگشت به فهرست سالون‌ها',kn_gone:'درخواستت منقضی شد',kn_ppl:'{n} از {m} نفر',p_play:'پخش',p_cont:'ادامه',p_watch:'تماشا',p_left:'{n} دقیقه مانده',p_min:'{n} دقیقه',p_season:'فصل {n}',p_next:'بعدی',p_upNext:'قسمت‌های بعدی',p_nextEp:'قسمت بعدی',p_inSec:'تا {n} ثانیه',p_now:'پخش',p_fs:'تمام صفحه',p_fsx:'خروج از تمام صفحه',p_more:'بیشتر',p_less:'کمتر',p_watched:'دیده شده',p_eps:'{n} قسمت',p_r10:'10 ثانیه عقب',p_f10:'10 ثانیه جلو',p_pause:'توقف',p_seek:'جای پخش',p_last:'آخرین قسمت را دیدید',again2D:'به ترتیب تازه',
 noTitles:'عنوانی پیدا نشد.',noTitlesD:'نام دیگری را جستجو کنید.',archEmpty:'آرشیف به‌زودی پر می‌شود.',archEmptyD:'فلم‌ها و سریال‌های مجاز اینجا نشان داده می‌شوند.',
 cont:'ادامهٔ تماشا',half:'نیمه‌تمام',full:'کامل دیده شد',resume:'ادامه',fromStart:'از اول',left:'{t} مانده',today:'امروز',yesterday:'دیروز',ep:'فصل {s}، قسمت {e}',
 histEmpty:'تاریخچهٔ تماشا خالی است',histEmptyD:'ویدیوی نیمه‌تمام اینجا برای ادامه می‌ماند.',goHome:'رفتن به خانهٔ سینما',more:'گزینه‌های بیشتر',
 clearHist:'پاک‌کردن تاریخچه',clearQ:'تاریخچهٔ تماشا پاک شود؟',clearD:'جای ادامهٔ همهٔ فلم‌ها و قسمت‌ها هم پاک می‌شود.',clear:'پاک شود',cleared:'تاریخچه پاک شد.',removeOne:'حذف از تاریخچه',d_pamir:'غروب پامیر',d_valley:'درهٔ شب',d_redhall:'سلطنتی سرخ',d_river:'دریای پامیر',photo:'عکس شما',
 slow:'لطفاً چند لحظه صبر کنید.',nameReq:'نام سالون را بنویسید.'},
en:{cinema:'Cinema',salon:'Salon',home:'Home',history:'History',search:'Search',mine:'My salon',mineNone:'Create your own salon',
 followed:'Following',joined:'Joined',recent:'Recent visits',recentNote:'Salons you visited and have not added yet.',
 emptyFollowed:'You are not following any salon yet.',emptyJoined:'You have not joined a salon yet.',emptyRecent:'No recent visits.',
 discover:'Discover salons',secMine:'My salons',create:'Create salon',joinCode:'Enter with code',
 st_watching:'Watching now',st_music:'Listening to music',st_talking:'Talking now',st_idle:'Ready',private:'Private',memberOf:'You are a member',
 visitToday:'Visited today',visitYesterday:'Visited yesterday',visitDays:'Visited {n} days ago',visitLong:'Visited a while ago',people:'{n} present',
 findPh:'Salon or film name',f_all:'All',f_watch:'Watch',f_music:'Music',f_talk:'Talking',f_friends:'My friends',
 noSalons:'No salons found.',noSalonsD:'Search another name or create your own salon.',
 createT:'Create salon',createS:'Set up your personal salon',name:'Salon name',namePh:'e.g. Wakhan friends night',edit:'Edit',seats:'Seats',seatsD:'2 to 16 seats',seatsV:'{n} seats',
 privacy:'Salon privacy',privacyD:'Public, friends or invite',p_all:'Public',p_friends:'Friends',p_invite:'Invite',
 p_allD:'Everyone can see and enter the salon.',p_friendsD:'Only your friends can enter.',p_inviteD:'Only invited people and those you admit can enter.',
 decor:'Salon decor',decorD:'Preview before creating',open:'Open',gallery:'Photo from gallery',
 mic:'Microphone permission',m_all:'Everyone',m_friends:'Friends',m_owner:'With permission',m_allD:'Everyone can speak.',m_friendsD:'Only your friends can speak.',m_ownerD:'Only with the host\'s permission',
 save:'Save',cancel:'Cancel',done:'Done',creating:'Creating…',created:'Your salon is ready.',already:'You already have a personal salon.',
 joinT:'Enter with code',joinS:'Salon',joinBanner:'Join a friend\'s salon',codeL:'Salon code',codePh:'Enter the code',codeHelp:'The host can share the code or an invite link with you.',enter:'Enter salon',checking:'Checking…',
 badCode:'The salon code is not valid.',noRoom:'No salon found with this code.',err:'That did not work. Please try again.',offline:'No connection. Please try again.',back:'Back',
 enter_closed:'This salon is closed for now.',enter_friends:'This salon is for the host\'s friends.',enter_banned:'You cannot enter this salon.',enter_invite:'This salon is invite only.',
 soon:'This part is built in the next step.',archive:'Wakhan Archive',watch:'Watch',c_all:'All',c_film:'Films',c_series:'Series',c_doc:'Documentary',
 k_film:'Film',k_series:'Series',k_doc:'Documentary',featured:'Featured',seasons:'{n} seasons',yt:'YouTube',ytD:'Separate search and player',archPh:'Search films and series in the archive',ytHint:'YouTube videos are searched apart from the archive and open in the official YouTube player.',ytSearch:'Search YouTube',ytPh:'Search YouTube',yc_foryou:'For you',yc_music:'Music',yc_film:'Films',yc_series:'Series',yc_doc:'Documentary',yc_news:'News',yc_comedy:'Comedy',yc_sport:'Sport',yc_kids:'Kids',ytNewMusic:'New music',ytPickD:'Something new every visit',views:'{n} views',nK:'{n}K',nM:'{n}M',ago_n:'just now',ago_m:'{n} min ago',ago_h:'{n} h ago',ago_d:'{n} days ago',ago_w:'{n} weeks ago',ago_mo:'{n} months ago',ago_y:'{n} years ago',pullD:'Pull down',pullR:'Release for fresh topics',pullL:'Refreshing…',fresh:'Fresh topics are here',inSalon:'In salon',live:'Live',ytEmpty:'No videos right now',ytEmptyD:'Try again a bit later or pull down to refresh.',again2:'More from the Wakhan archive',kn_title:'Enter the salon',kn_yes:'You were let in',kn_in:'Enter',kn_later:'Later',kn_yesD:'{n} opened the door for you',kn_knock:'Knock',kn_sent:'Request sent · waiting for the owner',kn_full:'The salon is full',kn_fullD:'{n} people are in the salon right now. You can send the owner a request to come in.',kn_closed:'Owner\'s permission',kn_closedD:'This salon is invite only. Knock and the owner can let you in.',kn_friends:'For the owner\'s friends',kn_friendsD:'This salon is for the owner\'s friends. Knock and the owner can let you in.',kn_go:'Knock and send a request',kn_wait:'Waiting for the owner',kn_waitD:'Your request was sent to the owner. Once accepted and a place is free, you go straight in.',kn_cancel:'Cancel request',kn_no:'Your request was not accepted',kn_noD:'You can go back to the list of salons.',kn_back:'Back to salons',kn_gone:'Your request expired',kn_ppl:'{n} of {m} people',p_play:'Play',p_cont:'Continue',p_watch:'Watch',p_left:'{n} min left',p_min:'{n} min',p_season:'Season {n}',p_next:'Next',p_upNext:'Up next',p_nextEp:'Next episode',p_inSec:'in {n}s',p_now:'Play',p_fs:'Full screen',p_fsx:'Exit full screen',p_more:'More',p_less:'Less',p_watched:'Watched',p_eps:'{n} episodes',p_r10:'Back 10 seconds',p_f10:'Forward 10 seconds',p_pause:'Pause',p_seek:'Position',p_last:'You watched the last episode',again2D:'In a fresh order',
 noTitles:'No titles found.',noTitlesD:'Try another name.',archEmpty:'The archive is filling up soon.',archEmptyD:'Films and series with permission appear here.',
 cont:'Continue watching',half:'In progress',full:'Watched',resume:'Resume',fromStart:'From the start',left:'{t} left',today:'Today',yesterday:'Yesterday',ep:'Season {s}, episode {e}',
 histEmpty:'Your watch history is empty',histEmptyD:'Unfinished videos stay here so you can continue.',goHome:'Go to cinema home',more:'More options',
 clearHist:'Clear history',clearQ:'Clear your watch history?',clearD:'Where you stopped in every film and episode is cleared too.',clear:'Clear',cleared:'History cleared.',removeOne:'Remove from history',d_pamir:'Pamir sunset',d_valley:'Night valley',d_redhall:'Royal red',d_river:'Pamir river',photo:'Your photo',
 slow:'Please wait a moment.',nameReq:'Write a salon name.'}};
const L=()=>{let l='en';try{l=((window.WK2L&&WK2L())||'en').slice(0,2)}catch(e){}return l};
const RTL=()=>['fa','ps','ar','ur'].includes(L());
const tx=(k,v)=>{let s=(window.WK2P&&WK2P('sln3',k))??(T[L()]||T.en)[k]??T.en[k]??k;if(v&&typeof s==='string')for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const say=m=>{try{toast(m)}catch(e){}};
const hap=()=>{try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}};
const call=(p,b)=>{try{return api(p,b)}catch(e){return Promise.reject(e)}};
/* really leaving (not minimising): the chat starts fresh for you when you come back */
const leftSalon=code=>{try{if(code)call('/api/app/salon/left',{code}).catch(()=>{})}catch(e){}};
const num=n=>Number(n||0).toLocaleString('en-US');
const ART='/s/wk2/salon/';
const DECOR=['pamir','valley','redhall','river'];
const I={
 door:'<path d="M5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h8A1.5 1.5 0 0 1 16 5v15.5"/><path d="M3 20.5h16"/><path d="M16 6.5l3 .8V20.5"/><circle cx="12.6" cy="12.5" r=".9" fill="currentColor"/>',
 pause:'<rect x="6.5" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none"/>',fs:'<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/>',fsx:'<path d="M9 4v3.5A1.5 1.5 0 0 1 7.5 9H4M20 9h-3.5A1.5 1.5 0 0 1 15 7.5V4M15 20v-3.5a1.5 1.5 0 0 1 1.5-1.5H20M4 15h3.5A1.5 1.5 0 0 1 9 16.5V20"/>',r10:'<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"/><path d="M4.5 4.5V9H9"/><text x="12.4" y="15.3" font-size="7" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui">10</text>',f10:'<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9"/><path d="M19.5 4.5V9H15"/><text x="11.6" y="15.3" font-size="7" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui">10</text>',
 search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',back:'<path d="m9 5 7 7-7 7"/>',
 people:'<circle cx="9" cy="8" r="3.4"/><path d="M2.8 19.5c.9-3.2 3.3-5 6.2-5s5.3 1.8 6.2 5"/><path d="M16 4.7a3.4 3.4 0 0 1 0 6.6M17.8 14.6c1.7.7 2.9 2.4 3.4 4.9"/>',
 eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
 pen:'<path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M17.6 3.6a2 2 0 0 1 2.8 2.8L12 14.8 8.5 15.5l.7-3.5z"/>',
 seat:'<path d="M6 11V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4"/><path d="M4 11a2 2 0 0 1 2 2v2h12v-2a2 2 0 1 1 2 2v3H4v-3a2 2 0 0 1 0-4z"/><path d="M6 18v2M18 18v2"/>',
 lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5"/>',
 image:'<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-5-5-9 8.5"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
 play:'<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',dots:'<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',trash:'<path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12.5h10L18 7M9.5 7V4.5h5V7"/>',restart:'<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>',key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14.5 8.5l2 2"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="m5 12.5 4 4 10-10"/>',minus:'<path d="M5 12h14"/>',
 chat:'<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>',film:'<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M7.5 5v14M16.5 5v14M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4"/>',
 alert:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.8v5M12 16v.2"/>'};
const sv=(k,c,w)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${c?` class="${c}"`:''}>${I[k]}</svg>`;
const img=(src,alt,cls)=>src?`<img${cls?` class="${cls}"`:''} src="${esc(src)}" alt="${esc(alt||'')}" loading="lazy" onload="this.style.visibility=''" onerror="window.SLN3?.photoError(this)">`:`<span class="sl-ph${cls?' '+cls:''}">${sv('film')}</span>`;
const photo=s=>s&&typeof s.photo==='string'?s.photo:'';
const wide=s=>s&&s.photo?s.photo:ART+((s&&DECOR.includes(s.decor)?s.decor:'pamir'))+(['pamir','valley'].includes(s&&s.decor||'pamir')?'_wide':'')+'.jpg';

/* ---------- styles: theme tokens; the salon accent is the soft lilac of the design (the theme accent in light mode) */
const css=`
.sl,.slp,.sl-sh{--s-bg:var(--wk-bg,#10091C);--s-card:var(--wk-surface,#1E1232);--s-card2:var(--wk-surface2,#302047);--s-line:color-mix(in srgb,var(--wk-border,#68449A) 42%,transparent);
 --s-tx:var(--wk-text,#F2F7FF);--s-tx2:var(--wk-text2,#C8B6E3);--s-acc:color-mix(in srgb,var(--wk-accent,#9E6FFF) 46%,#fff);--s-onacc:#1B0F2E;--s-teal:#5FE0C8;--s-rose:#FF8FA3;--s-gold:#F2C46B;
 color:var(--s-tx);font-family:inherit;-webkit-tap-highlight-color:transparent}
html.wkt-light .sl,html.wkt-light .slp,html.wkt-light .sl-sh{--s-acc:var(--wk-accent,#1F5EFF);--s-onacc:#fff;--s-teal:#0E9F87;--s-rose:#D9415E;--s-gold:#B7791F}
:where(.sl,.slp,.sl-sh) button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;margin:0;min-height:0;box-shadow:none;text-transform:none;letter-spacing:normal}
.sl{margin:0 calc(50% - 50vw);padding:max(14px,env(safe-area-inset-top)) 16px calc(110px + env(safe-area-inset-bottom,0px));min-height:100%;background:var(--s-bg)}
/* the page above (#view) already leaves the status bar + 10px on every tab without a header; no second gap here */
.sl{padding-top:2px}
body.sl-on>header{display:none!important}
/* the old «back to menu» pill sat behind the Kino tab; the cinema has its own tabs now */
body.sl-on>#cback,body.cinema>#cback{display:none!important}
.sl-top{display:flex;align-items:center;gap:8px;margin:0 0 12px}
.sl-tabs{position:relative;flex:1;display:grid;grid-template-columns:repeat(3,1fr);height:48px}
.sl-tabs button{position:relative;z-index:1;display:grid;place-items:center;color:var(--s-tx2)!important;font-size:16px!important;font-weight:500!important;letter-spacing:-.1px}
.sl-tabs button span{display:inline-block;transition:transform .18s ease,color .18s ease,opacity .18s;transform-origin:center 65%;opacity:.8}
.sl-tabs button.on{color:var(--s-tx)!important;font-weight:800!important}.sl-tabs button.on span{transform:scale(1.375);opacity:1}
.sl-tabs i{position:absolute;bottom:2px;width:calc(100% / 3);height:4px;inset-inline-start:0;display:flex;justify-content:center;transform:translateX(calc(var(--ti,0) * 100% * var(--dir,1)));transition:transform .42s cubic-bezier(.5,1.6,.4,.9)}
.sl-tabs i.mv:before{animation:slstretch .42s cubic-bezier(.3,.8,.3,1)}
@keyframes slstretch{0%{width:26px}35%{width:64px;opacity:.9}100%{width:26px}}
.sl-tabs i:before{content:"";width:26px;height:4px;border-radius:2px;background:linear-gradient(90deg,var(--s-acc),var(--wk-accent,#9E6FFF));box-shadow:0 0 12px color-mix(in srgb,var(--wk-accent,#9E6FFF) 70%,transparent)}
.sl[dir=rtl] .sl-tabs i{--dir:-1}
.sl .sl-sr input:focus,.sl .sl-sr input:focus-visible,.slp .sl-sr input:focus,.slp .sl-code input:focus{outline:none!important;box-shadow:none!important;border:0!important}
.sl input[type=search]::-webkit-search-cancel-button,.sl input[type=search]::-webkit-search-decoration{-webkit-appearance:none;display:none}
.sl .sl-sr:focus-within{border-color:color-mix(in srgb,var(--wk-accent,#9E6FFF) 60%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--wk-accent,#9E6FFF) 18%,transparent)}
.sl-sbar{height:58px}.sl-sbar .sl-sr{flex:1;margin:0;height:48px;border-radius:24px;transform-origin:var(--so,left) center;animation:slgrow .34s cubic-bezier(.2,.9,.2,1)}
.sl[dir=rtl] .sl-sbar .sl-sr{--so:left}.sl[dir=ltr] .sl-sbar .sl-sr{--so:right}
@keyframes slgrow{from{opacity:0;transform:scaleX(.25)}to{opacity:1;transform:none}}
html.wk-rm .sl-sbar .sl-sr{animation:none}
.sl-body.in-f,.sl-body.in-b,.sl-body .tk,.sl-body .sl-sk,.sl-body .sl-row,.sl-body .sl-card,.sl-body .yv,.sl-sbar .sl-sr{animation:none!important}
.sl-ib.gl{width:42px;height:42px;border-radius:50%;background:color-mix(in srgb,var(--s-card) 70%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}.sl-ib.gl svg{width:20px;height:20px}
html.wk-rm .sl-tabs button span,html.wk-rm .sl-tabs i{transition:none}
.sl-flt{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none;padding:1px}.sl-flt::-webkit-scrollbar{display:none}
.sl-flt button{flex:none;height:34px;padding:0 14px!important;border-radius:17px;background:var(--s-card)!important;border:1px solid var(--s-line)!important;color:var(--s-tx2)!important;font-size:12.5px!important;font-weight:600!important;white-space:nowrap;transition:background .2s,color .2s,transform .12s}
.sl-flt button:active{transform:scale(.95)}
.sl-flt button.on{background:var(--s-acc)!important;border-color:transparent!important;color:var(--s-onacc)!important;font-weight:800!important;box-shadow:0 4px 14px -6px color-mix(in srgb,var(--s-acc) 80%,transparent)}
.sl-rows{min-height:20px}
/* every salon is a cinema ticket: a stub with the people present, cut by two notches and a perforation */
.sl-list{display:flex;flex-direction:column;gap:10px}
.tk{--stub:74px;--n:9px;position:relative;display:flex;align-items:stretch;width:100%;min-height:76px;text-align:start;filter:drop-shadow(0 8px 14px rgba(0,0,0,.28));transition:transform .2s cubic-bezier(.3,.7,.3,1.3)}
.tk:active{transform:scale(.975) rotate(-.4deg)}
.tk .bg{position:absolute;inset:0;border-radius:18px;background:linear-gradient(115deg,color-mix(in srgb,var(--s-card) 100%,#fff 4%),var(--s-card) 60%,color-mix(in srgb,var(--wk-accent,#9E6FFF) 10%,var(--s-card)));border:1px solid var(--s-line);
 -webkit-mask:radial-gradient(circle var(--n) at var(--cut) 0,#0000 97%,#000) top/100% 51% no-repeat,radial-gradient(circle var(--n) at var(--cut) 100%,#0000 97%,#000) bottom/100% 51% no-repeat;
 mask:radial-gradient(circle var(--n) at var(--cut) 0,#0000 97%,#000) top/100% 51% no-repeat,radial-gradient(circle var(--n) at var(--cut) 100%,#0000 97%,#000) bottom/100% 51% no-repeat;overflow:hidden}
.sl[dir=rtl] .tk{--cut:var(--stub)}.sl[dir=ltr] .tk{--cut:calc(100% - var(--stub))}
.tk .bg:after{content:"";position:absolute;top:12px;bottom:12px;inset-inline-end:var(--stub);border-inline-end:2px dashed color-mix(in srgb,var(--s-tx) 18%,transparent)}
.tk .mn{position:relative;flex:1;min-width:0;display:flex;align-items:center;gap:12px;padding:10px 14px 10px 10px;padding-inline:12px 14px}
.tk .th{width:54px;height:54px;flex:none;border-radius:14px;overflow:hidden;background:var(--s-card2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 4px 10px -4px rgba(0,0,0,.5)}
.tk .th img{width:100%;height:100%;object-fit:cover;display:block}
.tk .tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.tk b{font-size:15px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tk small{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--s-tx2);white-space:nowrap;overflow:hidden}.tk small span{overflow:hidden;text-overflow:ellipsis}
.tk small i{width:6px;height:6px;border-radius:50%;flex:none;background:#9AA3B5}
.tk.chat small i{background:#B79CFF}
.tk .st{position:relative;width:var(--stub);flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--s-tx2);direction:ltr}
.tk .st svg{width:17px;height:17px;opacity:.85}
.tk .st b{font-size:17px;font-weight:800;color:var(--s-tx);line-height:1.1}.tk .st b em{font-style:normal;font-size:11px;font-weight:600;color:var(--s-tx2)}
/* on air: gold stub, a light that sweeps across the ticket, a breathing dot */
.tk.onair .bg{background:linear-gradient(115deg,color-mix(in srgb,#F2C46B 10%,var(--s-card)),var(--s-card) 55%,color-mix(in srgb,var(--wk-accent,#9E6FFF) 16%,var(--s-card)));border-color:color-mix(in srgb,#F2C46B 38%,transparent)}
.tk.onair .bg:before{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,236,190,.13) 50%,transparent 65%);transform:translateX(-120%);animation:slshine 4.2s ease-in-out infinite}
@keyframes slshine{0%,55%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
.tk.onair .st{color:#F2C46B}.tk.onair .st b{background:linear-gradient(180deg,#FFE3A1,#E7A93C);-webkit-background-clip:text;background-clip:text;color:transparent}
.tk.onair small{color:var(--s-teal)}.tk.onair small i{background:#3EE08F;animation:slpulse 1.8s infinite}
/* music: rose stub and a little equaliser; talking: teal stub and a voice wave */
.tk.music .bg{background:linear-gradient(115deg,color-mix(in srgb,#FF7EC8 10%,var(--s-card)),var(--s-card) 55%,color-mix(in srgb,var(--wk-accent,#9E6FFF) 14%,var(--s-card)));border-color:color-mix(in srgb,#FF7EC8 34%,transparent)}
.tk.music .st,.tk.music small{color:#FF9AD5}.tk.music .st b{color:#FFB5E1}
.tk.talk .bg{background:linear-gradient(115deg,color-mix(in srgb,#5FE0C8 10%,var(--s-card)),var(--s-card) 55%,color-mix(in srgb,var(--wk-accent,#9E6FFF) 14%,var(--s-card)));border-color:color-mix(in srgb,#5FE0C8 34%,transparent)}
.tk.talk .st,.tk.talk small{color:var(--s-teal)}.tk.talk .st b{color:#9FF3E2}
html.wkt-light .tk.music .st,html.wkt-light .tk.music small,html.wkt-light .tk.music .st b{color:#C2307F}html.wkt-light .tk.talk .st b{color:#0E8F7A}
.tk small i.eq{width:16px;height:14px;border-radius:0;background:none;display:flex;align-items:flex-end;gap:2.5px}
.tk small i.eq s{flex:1;height:100%;border-radius:1px;background:currentColor;transform-origin:bottom;animation:sleq .9s ease-in-out infinite}
.tk small i.eq s:nth-child(2){animation-delay:-.3s;animation-duration:.7s}.tk small i.eq s:nth-child(3){animation-delay:-.6s;animation-duration:1.1s}
.tk.talk small i.eq s{animation-name:slwave;border-radius:2px}
@keyframes sleq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
@keyframes slwave{0%,100%{transform:scaleY(.45)}30%{transform:scaleY(1)}60%{transform:scaleY(.2)}}
html.wk-rm .tk.onair .bg:before,html.wk-rm .tk.onair small i,html.wk-rm .tk small i.eq s{animation:none}
.sl-body .tk{animation:slrise .45s cubic-bezier(.2,.8,.2,1) both}.sl-body .tk:nth-child(2){animation-delay:.05s}.sl-body .tk:nth-child(3){animation-delay:.1s}.sl-body .tk:nth-child(n+4){animation-delay:.15s}
/* «سالون من»: a golden pass */
.tk.pass{--stub:64px;min-height:84px;margin-bottom:14px}
.tk.pass .bg{background:linear-gradient(120deg,color-mix(in srgb,var(--wk-accent,#9E6FFF) 36%,var(--s-card)),color-mix(in srgb,var(--wk-accent,#9E6FFF) 12%,var(--s-card)) 60%,color-mix(in srgb,#F2C46B 16%,var(--s-card)));border-color:color-mix(in srgb,var(--wk-accent,#9E6FFF) 50%,transparent)}
.tk.pass .th{width:60px;height:60px;border-radius:16px}.tk.pass .tx b{font-size:16.5px}
.tk.pass .lb{display:inline-flex;align-self:flex-start;align-items:center;height:18px;padding:0 8px;border-radius:9px;font-size:10.5px;font-weight:800;letter-spacing:.2px;color:#2A1A00;background:linear-gradient(90deg,#FFE3A1,#E7A93C)}
.tk.pass .st svg{width:22px;height:22px;opacity:1;color:var(--s-tx)}.sl[dir=rtl] .tk.pass .st svg{transform:scaleX(-1)}
.tk.pass .th svg{width:26px;height:26px;color:var(--s-acc)}.tk.pass .th{display:grid;place-items:center}
.sl-note{margin:12px 2px 0;font-size:12.5px;line-height:1.7;color:var(--s-tx2)}
.sl-empty{padding:22px 12px;text-align:center;font-size:13.5px;color:var(--s-tx2);border-radius:18px;border:1px dashed var(--s-line)}
.sl-sec{position:relative;display:grid;grid-template-columns:1fr 1fr;padding:4px;border-radius:999px;background:color-mix(in srgb,var(--s-card) 80%,transparent);border:1px solid var(--s-line);margin-bottom:16px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.sl-sec:before{content:"";position:absolute;top:4px;bottom:4px;inset-inline-start:4px;width:calc(50% - 4px);will-change:transform;border-radius:999px;background:linear-gradient(135deg,color-mix(in srgb,var(--wk-accent,#9E6FFF) 42%,var(--s-card)),color-mix(in srgb,var(--wk-accent,#9E6FFF) 22%,var(--s-card)));box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 6px 18px -6px color-mix(in srgb,var(--wk-accent,#9E6FFF) 60%,transparent);transform:translateX(calc(var(--si,0) * 100% * var(--dir,1)));transition:transform .5s cubic-bezier(.34,1.45,.5,1)}
.sl-sec.mv:before{animation:slsquish .5s ease}
@keyframes slsquish{0%{scale:1 1}30%{scale:1.08 .86}60%{scale:.97 1.04}100%{scale:1 1}}
.sl[dir=rtl] .sl-sec{--dir:-1}
.sl-sec button{position:relative;z-index:1;height:44px;border-radius:999px;font-size:14.5px!important;font-weight:600!important;color:var(--s-tx2)!important;transition:color .18s}
.sl-sec button.on{color:var(--s-tx)!important;font-weight:800!important}
html.wk-rm .sl-sec:before,html.wk-rm .sl-sec button{transition:none;animation:none}
.sl-body{position:relative}
.sl-body.in-f{animation:slinF .38s cubic-bezier(.2,.8,.2,1)}.sl-body.in-b{animation:slinB .38s cubic-bezier(.2,.8,.2,1)}
@keyframes slinF{from{opacity:0;transform:translateX(calc(var(--dir,1) * 34px)) scale(.985);filter:none}to{opacity:1;transform:none;filter:none}}
@keyframes slinB{from{opacity:0;transform:translateX(calc(var(--dir,1) * -34px)) scale(.985);filter:none}to{opacity:1;transform:none;filter:none}}
.sl[dir=rtl] .sl-body{--dir:-1}
.sl-body .sl-sk,.sl-body .sl-row,.sl-body .sl-card{animation:slrise .45s cubic-bezier(.2,.8,.2,1) both}
.sl-body .sl-row:nth-child(2),.sl-body .sl-card:nth-child(2){animation-delay:.04s}.sl-body .sl-row:nth-child(3),.sl-body .sl-card:nth-child(3){animation-delay:.08s}.sl-body .sl-row:nth-child(n+4),.sl-body .sl-card:nth-child(n+4){animation-delay:.12s}
@keyframes slrise{from{opacity:0;transform:translateY(10px)}}
html.wk-rm .sl-body,html.wk-rm .sl-body *,html.wk-rm .sl-tabs i:before{animation:none!important}
.sl-qk{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.sl-qk button{display:flex;align-items:center;gap:10px;min-height:66px;padding:10px 12px!important;border-radius:18px;background:var(--s-card)!important;border:1px solid var(--s-line)!important;text-align:start}
.sl-qk .ic{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;flex:none}.sl-qk .ic svg{width:21px;height:21px}
.sl-qk .tx{min-width:0}.sl-qk b{display:block;font-size:14px;font-weight:800;line-height:1.3}.sl-qk small{display:block;margin-top:3px;font-size:11.5px;color:var(--s-tx2);line-height:1.4}
.sl-disc{display:flex;align-items:center;gap:14px;width:100%;margin-top:34px;padding:12px 2px 16px;border-bottom:1px solid var(--s-line);text-align:start}
.sl-disc .ic{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:color-mix(in srgb,var(--s-rose) 16%,var(--s-card));color:var(--s-rose);flex:none}.sl-disc .ic svg{width:24px;height:24px}
.sl-disc .tx{flex:1}.sl-disc b{display:block;font-size:17px;font-weight:800}.sl-disc small{display:block;margin-top:5px;font-size:13px;color:var(--s-tx2)}
.sl-disc .go{color:var(--s-rose);font-size:14px;font-weight:700}
.sl-acts{display:flex;gap:12px;margin-top:20px}
.sl-btn{height:50px;padding:0 22px;border-radius:25px;font-size:15px!important;font-weight:800!important;background:var(--s-acc)!important;color:var(--s-onacc)!important}
.sl-btn.ol{background:var(--s-card)!important;color:var(--s-acc)!important;border:1px solid var(--s-line)!important;font-weight:700!important}
.sl-sk{height:94px;border-radius:18px;margin-bottom:10px;background:linear-gradient(90deg,var(--s-card) 25%,var(--s-card2) 50%,var(--s-card) 75%);background-size:200% 100%;animation:slsk 1.3s infinite}
@keyframes slsk{to{background-position:-200% 0}}html.wk-rm .sl-sk{animation:none}
.sl-ph{display:grid;place-items:center;width:100%;height:100%;color:var(--s-tx2);background:var(--s-card2)}.sl-ph svg{width:40%;height:40%}
/* «خانه»: cinematic carousel, posters, YouTube */
.hx{margin:0 0 14px}
.hx-tr{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;border-radius:24px;gap:0}.hx-tr::-webkit-scrollbar{display:none}
.hx-sl{position:relative;flex:0 0 100%;height:214px;scroll-snap-align:center;overflow:hidden;border-radius:24px;text-align:start;isolation:isolate}
.hx-sl .im{position:absolute;inset:0;z-index:-2}.hx-sl .im img{width:100%;height:100%;object-fit:cover;animation:slkb 16s ease-in-out infinite alternate;transform-origin:70% 40%}
@keyframes slkb{from{transform:scale(1)}to{transform:scale(1.09)}}
.hx-sl .vg{position:absolute;inset:0;z-index:-1;background:linear-gradient(0deg,rgba(9,4,16,.88),rgba(9,4,16,.15) 55%,rgba(9,4,16,.35)),radial-gradient(120% 90% at 50% 40%,transparent 55%,rgba(9,4,16,.55))}
.hx-sl .bd{position:absolute;top:14px;inset-inline-end:14px;height:28px;padding:0 12px;border-radius:14px;display:grid;place-items:center;font-size:11.5px;font-weight:800;color:#FFD98A;background:rgba(20,10,30,.55);border:1px solid rgba(255,217,138,.35);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.hx-sl .tx{position:absolute;bottom:18px;inset-inline-start:20px;inset-inline-end:120px;color:#fff}.hx-sl .tx b{display:block;font-size:30px;font-weight:900;line-height:1.2;text-shadow:0 3px 14px rgba(0,0,0,.6)}.hx-sl .tx small{display:block;margin-top:4px;font-size:13px;opacity:.85}
.hx-sl .go{position:absolute;bottom:18px;inset-inline-end:16px;display:flex;align-items:center;gap:6px;height:44px;padding:0 18px;border-radius:22px;background:linear-gradient(180deg,#FFE0A3,#F2B95A);color:#2A1700;font-size:15px;font-weight:800;box-shadow:0 8px 22px -8px rgba(242,185,90,.8)}
.hx-sl .go svg{width:16px;height:16px}
.hx-dt{display:flex;justify-content:center;gap:5px;margin-top:9px}.hx-dt i{width:6px;height:6px;border-radius:3px;background:color-mix(in srgb,var(--s-tx) 25%,transparent);transition:width .3s,background .3s}.hx-dt i.on{width:20px;background:#F2C46B}
html.wk-rm .hx-sl .im img{animation:none}
.pg{display:block;column-count:2;column-gap:12px;margin-bottom:16px}.pg>*{break-inside:avoid;-webkit-column-break-inside:avoid;margin:0 0 16px!important;width:100%}
.pc{display:flex;flex-direction:column;gap:7px;text-align:center;transition:transform .18s}.pc:active{transform:scale(.96)}
.pc{min-width:0;width:100%;text-align:start!important;display:flex!important}
.pc .im{position:relative;display:block;width:100%;aspect-ratio:2/3;border-radius:18px;overflow:hidden;background:var(--s-card2);box-shadow:0 12px 24px -14px rgba(0,0,0,.8),inset 0 0 0 1px rgba(255,255,255,.08)}
.pc .im img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.pc .im.wide{aspect-ratio:16/9}

.pc .pl{position:absolute;z-index:1;bottom:8px;inset-inline-end:8px;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:#fff;background:rgba(255,255,255,.18);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.3)}.pc .pl svg{width:13px;height:13px;margin-inline-start:1px}
.pc .im:after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.14),transparent 35%)}
.pc .kd{position:absolute;top:7px;inset-inline-start:7px;z-index:1;height:20px;padding:0 7px;border-radius:10px;display:grid;place-items:center;font-size:10px;font-weight:800;color:#fff;background:rgba(15,8,26,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.pc b{font-size:13px;font-weight:800;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;white-space:normal;padding:0 3px}
.pc small{font-size:11px;color:var(--s-tx2);padding:0 3px;margin-top:-4px}
.sl-sk.pk{display:block;height:auto;aspect-ratio:2/3;border-radius:18px;margin:0}.pk.pkw{aspect-ratio:16/9}
.ytc{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px!important;border-radius:20px;background:linear-gradient(110deg,color-mix(in srgb,#FF0000 9%,var(--s-card)),var(--s-card) 60%)!important;border:1px solid var(--s-line)!important;text-align:start;margin-top:4px}
.ytc .lg{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,#FF0000 14%,var(--s-card));flex:none}.ytc .lg svg{width:28px;height:20px}
.ytc .tx{flex:1}.ytc b{display:block;font-size:16px;font-weight:800}.ytc small{display:block;margin-top:3px;font-size:12.5px;color:var(--s-tx2)}
.ytc .ch svg{width:18px;height:18px;color:var(--s-rose)}.sl[dir=rtl] .ytc .ch svg{transform:scaleX(-1)}
.sl-sec .ytm{width:20px;height:14px;margin-inline-end:6px;vertical-align:-2px}
.yflt{margin:0 -16px 14px;padding:1px 16px}.yflt button{height:32px;padding:0 13px!important;font-size:12px!important}
.yflt .sp{display:inline-block;width:12px;height:12px;margin-inline-end:5px;vertical-align:-1px;background:conic-gradient(from 0deg,#FF4D6D,#FFB547,#7CE0FF,#B48CFF,#FF4D6D);border-radius:50%;-webkit-mask:radial-gradient(circle,transparent 3px,#000 3.5px);mask:radial-gradient(circle,transparent 3px,#000 3.5px)}
.yfd{display:flex;flex-direction:column;gap:22px;transition:opacity .25s}.yfd.dim{opacity:.4}
.yv{display:block;cursor:pointer;-webkit-tap-highlight-color:transparent;animation:slrise .45s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d,0ms);outline:none}
.yv:active .th{transform:scale(.985)}.yv:focus-visible .th{box-shadow:0 0 0 2px var(--s-acc)}
.yv .th{position:relative;display:block;aspect-ratio:16/9;border-radius:20px;overflow:hidden;background:var(--s-card);transition:transform .2s;box-shadow:0 14px 30px -18px rgba(0,0,0,.6)}
.yv .th img,.yv .th .sl-ph{width:100%;height:100%;object-fit:cover;display:block}
.yv .th::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.28),transparent 30%,transparent 70%,rgba(0,0,0,.35));pointer-events:none}
.yv .du,.yv .lv{position:absolute;bottom:10px;inset-inline-end:10px;z-index:1;height:22px;padding:0 7px;border-radius:7px;background:rgba(0,0,0,.72);color:#fff;font-size:11.5px;font-weight:700;display:flex;align-items:center;gap:5px;direction:ltr;font-variant-numeric:tabular-nums}
.yv .lv{background:#E8203A;direction:inherit}.yv .lv i{width:6px;height:6px;border-radius:50%;background:#fff;animation:slblink 1.2s infinite}
@keyframes slblink{50%{opacity:.25}}
:where(.sl) .yv .ys{position:absolute;top:10px;inset-inline-start:10px;z-index:1;height:30px;padding:0 10px 0 9px;border-radius:15px;display:flex;align-items:center;gap:5px;background:rgba(18,12,30,.42);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);border:1px solid rgba(255,255,255,.22);color:#fff;font-size:11.5px;font-weight:700}
.yv .ys svg{width:15px;height:15px}.yv .ys:active{transform:scale(.93)}
.yv .mt{display:flex;gap:11px;padding:11px 4px 0;align-items:flex-start}
.yv .av{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;overflow:hidden;font-size:15px;font-weight:800;color:#fff;background:linear-gradient(140deg,hsl(var(--h) 70% 58%),hsl(calc(var(--h) + 50) 70% 40%))}.yv .av img{width:100%;height:100%;object-fit:cover}
.yv .tx{min-width:0;display:flex;flex-direction:column;gap:4px}.yv .tx b{font-size:14.5px;font-weight:800;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.yv .tx small{font-size:12px;color:var(--s-tx2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.yv.sk{animation:none}.yv.sk .tx{flex:1}.yv.sk .tx i{display:block;height:12px;border-radius:6px;margin-top:4px}
.ysh{margin:0 -16px;padding:16px 0 18px;background:linear-gradient(180deg,color-mix(in srgb,#FF2D55 8%,transparent),transparent);border-radius:26px}
.ysh-hd{display:flex;align-items:center;gap:9px;padding:0 18px 12px}.ysh-hd b{font-size:16px;font-weight:900}
.eqs{display:flex;align-items:flex-end;gap:2px;height:14px}.eqs i{width:3px;height:100%;border-radius:2px;background:#FF4D6D;transform-origin:bottom;animation:sleq 1s ease-in-out infinite}.eqs i:nth-child(2){animation-delay:-.4s}.eqs i:nth-child(3){animation-delay:-.7s}
.ysh-tr{display:flex;gap:12px;overflow-x:auto;padding:0 16px;scrollbar-width:none;scroll-snap-type:x mandatory}.ysh-tr::-webkit-scrollbar{display:none}
.ym{flex:none;width:136px;text-align:start;scroll-snap-align:start;display:flex;flex-direction:column;gap:3px}
.ym .im{position:relative;display:block;width:136px;height:136px;border-radius:22px;overflow:hidden;background:var(--s-card);margin-bottom:6px;box-shadow:0 12px 24px -14px rgba(0,0,0,.6)}
.ym .im img{width:100%;height:100%;object-fit:cover}.ym .pl{position:absolute;bottom:8px;inset-inline-end:8px;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.92);color:#111;box-shadow:0 6px 14px rgba(0,0,0,.35)}.ym .pl svg{width:16px;height:16px}
.ym b{font-size:13px;font-weight:800;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.ym small{font-size:11.5px;color:var(--s-tx2)}
.ypl{position:absolute;top:-58px;inset-inline:0;height:50px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;pointer-events:none;--p:0;opacity:min(1,calc(var(--p)*1.6))}.ypl.ld{opacity:1}
.sl-body{position:relative}
.ypl .rg{position:relative;width:30px;height:30px;display:grid;place-items:center;transform:scale(calc(.6 + var(--p)*.4)) rotate(calc(var(--p)*270deg));opacity:calc(.3 + var(--p)*.7)}
.ypl .rg svg:first-child{position:absolute;inset:0;width:30px;height:30px;transform:rotate(-90deg)}.ypl circle{fill:none;stroke:#FF0000;stroke-width:3;stroke-linecap:round;stroke-dasharray:88;stroke-dashoffset:calc(88 - var(--p)*88)}
.ypl .lg{width:14px;height:10px}.ypl em{font-style:normal;font-size:11px;font-weight:700;color:var(--s-tx2);opacity:var(--p)}
.ypl.rd .rg{transform:scale(1.08)}.ypl.ld .rg{animation:slrot .8s linear infinite;--p:1}.ypl.ld circle{stroke-dashoffset:60}.ypl.ld em{opacity:1}
@keyframes slrot{to{transform:rotate(360deg)}}
.yfr{position:fixed;top:calc(env(safe-area-inset-top,0px) + 70px);left:50%;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:7px;height:38px;padding:0 16px 0 13px;border-radius:19px;background:var(--s-acc);color:var(--s-onacc);font-size:13px;font-weight:800;box-shadow:0 12px 28px -10px color-mix(in srgb,var(--s-acc) 80%,transparent);animation:slfr 2.3s cubic-bezier(.2,.9,.2,1.2) both}.yfr svg{width:16px;height:16px}
@keyframes slfr{0%{opacity:0;transform:translate(-50%,-16px) scale(.9)}12%,82%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-10px)}}
html.wk-rm .yv,html.wk-rm .yfr,html.wk-rm .eqs i,html.wk-rm .ypl.ld .rg{animation:none}
.rnd{grid-column:1/-1;display:flex;align-items:center;gap:12px;margin:14px 0 4px}.rnd i{flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--s-line),transparent)}.rnd span{display:flex;flex-direction:column;align-items:center;gap:2px}.rnd b{font-size:13px;font-weight:800}.rnd small{font-size:11px;color:var(--s-tx2)}
.slp.tpw{overflow-y:auto;overscroll-behavior:contain}.tp{padding-bottom:calc(30px + env(safe-area-inset-bottom))}
.tp-hero{position:relative;height:min(56vh,420px);overflow:hidden}.tp-hero.sl-sk{border-radius:0 0 28px 28px}
.tp-hero .im,.tp-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.tp-hero img{animation:slkb 14s ease-out both alternate}
.tp-hero .vg{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45),transparent 28%,transparent 45%,var(--s-bg) 98%)}
.slp .tp-bk{position:absolute;top:max(14px,env(safe-area-inset-top));left:16px;right:auto;z-index:2;background:rgba(10,8,20,.38)!important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.2)!important;color:#fff!important}
.tp-b{position:relative;margin-top:-86px;padding:0 18px}.tp-b h1{margin:0;font-size:30px;font-weight:900;line-height:1.3;text-shadow:0 2px 18px rgba(0,0,0,.35)}
.tp-m{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin:8px 0 18px;font-size:12.5px;color:var(--s-tx2)}.tp-m span:first-child{color:var(--s-acc);font-weight:800}.tp-m i{width:3px;height:3px;border-radius:50%;background:currentColor;opacity:.5}
.tp-act{display:flex;gap:10px}
:where(.slp) .tp-play{position:relative;flex:1;display:flex;align-items:center;gap:12px;height:62px;padding:0 18px 0 8px;border-radius:22px;overflow:hidden;background:linear-gradient(135deg,#FFD978,#F2B13A);color:#2A1A00;box-shadow:0 14px 30px -14px rgba(242,177,58,.75);text-align:start}
.tp-play .ic{width:46px;height:46px;border-radius:16px;display:grid;place-items:center;background:rgba(42,26,0,.12)}.tp-play .ic svg{width:22px;height:22px}
.tp-play .lb{display:flex;flex-direction:column;gap:1px}.tp-play b{font-size:15.5px;font-weight:900}.tp-play small{font-size:11.5px;font-weight:700;opacity:.7}
.tp-play .pr{position:absolute;inset-inline:0;bottom:0;height:4px;background:rgba(42,26,0,.15)}.tp-play .pr i{display:block;height:100%;background:#2A1A00;border-radius:0 2px 2px 0}
.tp-play:active{transform:scale(.98)}
:where(.slp) .tp-sal{flex:none;width:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:22px;background:var(--s-card);border:1px solid var(--s-line);color:var(--s-tx);font-size:10.5px;font-weight:800}.tp-sal svg{width:22px;height:22px}
.tp-d{margin:18px 2px 0;font-size:13.5px;line-height:1.95;color:var(--s-tx2);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.tp-d.op{-webkit-line-clamp:unset}
:where(.slp) .tp-mr{margin:4px 2px 0;color:var(--s-acc);font-size:12.5px;font-weight:800;background:none;border:0;padding:0}
.tp-ss{margin:22px -18px 12px;padding:1px 18px}.tp-ss button small{margin-inline-start:6px;opacity:.6;font-size:10.5px}
.tp-eps,.pv-up{display:flex;flex-direction:column;gap:10px}
:where(.slp) .ep{display:flex;gap:12px;align-items:center;padding:8px;border-radius:20px;background:var(--s-card);border:1px solid var(--s-line);text-align:start;color:var(--s-tx);animation:slrise .4s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d,0ms)}
.ep .th{position:relative;flex:none;width:132px;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:var(--s-bg)}.ep .th img{width:100%;height:100%;object-fit:cover}
.ep .no{position:absolute;bottom:5px;inset-inline-start:6px;font-size:22px;font-weight:900;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.6);line-height:1}
.ep .pl,.ep .ck{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.45);color:#fff;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}.ep .pl svg{width:14px;height:14px}
.ep .ck{background:#3EE08F;color:#06301A}.ep .ck svg{width:16px;height:16px}
.ep .pr{position:absolute;inset-inline:6px;bottom:4px;height:3px;border-radius:2px;background:rgba(255,255,255,.3)}.ep .pr i{display:block;height:100%;border-radius:2px;background:#F2B13A}
.ep .tx{min-width:0;display:flex;flex-direction:column;gap:4px}.ep .tx b{font-size:14px;font-weight:800;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.ep .tx small{font-size:11.5px;color:var(--s-tx2)}
.ep .tx em{align-self:flex-start;font-style:normal;font-size:10.5px;font-weight:900;padding:2px 8px;border-radius:8px;background:color-mix(in srgb,#F2B13A 22%,transparent);color:#F2B13A}
.ep.dn{opacity:.62}.ep.nx{border-color:color-mix(in srgb,#F2B13A 70%,transparent);background:linear-gradient(110deg,color-mix(in srgb,#F2B13A 12%,var(--s-card)),var(--s-card) 70%);box-shadow:0 10px 26px -16px rgba(242,177,58,.8)}
.slp.pvw{background:#000;overflow-y:auto}.pv{min-height:100%;display:flex;flex-direction:column;background:#000;color:#fff;--s-tx:#fff;--s-tx2:rgba(255,255,255,.62);--s-card:#141019;--s-line:rgba(255,255,255,.08)}
.pv-v{position:relative;margin-top:env(safe-area-inset-top);aspect-ratio:16/9;background:#000;overflow:hidden;touch-action:manipulation}.pv video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}
.pv-ui{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(180deg,rgba(0,0,0,.6),transparent 35%,transparent 60%,rgba(0,0,0,.7));opacity:0;transition:opacity .25s;pointer-events:none}
.pv-ui.on{opacity:1;pointer-events:auto}
:where(.pv) .pv-b{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:transparent;border:0;color:#fff}.pv-b svg{width:24px;height:24px}
.pv-top{display:flex;align-items:center;gap:6px;padding:6px 8px}.pv-tt{display:flex;flex-direction:column;min-width:0}.pv-tt b{font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pv-tt small{font-size:11px;opacity:.75}
.pv-mid{display:flex;align-items:center;justify-content:center;gap:34px;direction:ltr}.pv-mid .pv-b svg{width:30px;height:30px}
:where(.pv) .pv-pp{width:64px;height:64px;background:rgba(255,255,255,.16);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}.pv-pp svg{width:30px!important;height:30px!important}
.pv-b.kk svg{animation:slkk .35s ease}@keyframes slkk{40%{transform:scale(.8) rotate(var(--r,-25deg))}}.pv-mid [data-p=f10]{--r:25deg}
.pv-bot{display:flex;align-items:center;gap:8px;padding:0 6px 6px 12px;direction:ltr}.pv-t{font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums;min-width:34px;text-align:center}
.pv-sk{flex:1;-webkit-appearance:none;appearance:none;height:22px;background:transparent;--v:0%}
.pv-sk::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:linear-gradient(90deg,#F2B13A var(--v),rgba(255,255,255,.3) var(--v))}
.pv-sk::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;margin-top:-5.5px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgba(242,177,58,.35)}
.pv-sk::-moz-range-track{height:4px;border-radius:2px;background:rgba(255,255,255,.3)}.pv-sk::-moz-range-progress{height:4px;background:#F2B13A}
.pv-sp{position:absolute;top:50%;left:50%;width:44px;height:44px;margin:-22px;border-radius:50%;border:3px solid rgba(255,255,255,.18);border-top-color:#F2B13A;opacity:0;animation:slrot .8s linear infinite;pointer-events:none}.pvw.ld .pv-sp{opacity:1}
.pv-nx{position:absolute;inset-inline-end:12px;bottom:46px;width:min(300px,calc(100% - 24px));display:flex;gap:10px;align-items:center;padding:8px;border-radius:18px;background:rgba(20,16,28,.82);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.14);animation:slrise .35s cubic-bezier(.2,.9,.2,1.2)}
.pv-nx[hidden]{display:none}.pv-nx .im{flex:none;width:86px;aspect-ratio:16/9;border-radius:10px;overflow:hidden}.pv-nx .im img{width:100%;height:100%;object-fit:cover}
.pv-nx .tx{min-width:0;flex:1;display:flex;flex-direction:column}.pv-nx .tx small{font-size:10.5px;color:#F2B13A;font-weight:800}.pv-nx .tx b{font-size:12.5px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pv-nx .bt{display:flex;flex-direction:column;gap:4px}
:where(.pv) .pv-nx [data-p=nxgo]{position:relative;display:flex;align-items:center;gap:5px;height:34px;padding:0 12px 0 9px;border-radius:12px;background:#fff;color:#111;font-size:11.5px;font-weight:800;border:0;overflow:hidden}.pv-nx [data-p=nxgo]>svg:not([viewBox="0 0 36 36"]){width:13px;height:13px}
.pv-nx [data-p=nxgo] svg[viewBox="0 0 36 36"]{position:absolute;inset:0;width:100%;height:100%;opacity:0}
.pv-nx [data-p=nxgo]::before{content:"";position:absolute;inset:0;background:rgba(242,177,58,.45);transform-origin:left;transform:scaleX(var(--cd,0));transition:transform 8s linear}
.pv-nx [data-p=nxgo] *{position:relative}
:where(.pv) .pv-nx [data-p=nxno]{height:26px;border-radius:9px;background:transparent;border:0;color:rgba(255,255,255,.7);font-size:11px;font-weight:700}
.pv-in{padding:16px 16px calc(24px + env(safe-area-inset-bottom))}.pv-h{display:block;font-size:20px;font-weight:900}.pv-s{display:block;margin-top:4px;font-size:12.5px;color:var(--s-tx2)}
.pv-up h3{margin:22px 0 2px;font-size:15px;font-weight:900}
.pvw.fs{overflow:hidden}.pvw.fs .pv-v{position:fixed;z-index:3;top:0;left:0;margin:0;aspect-ratio:auto;width:100vh;height:100vw;transform-origin:top left;transform:translateX(100vw) rotate(90deg)}
@media (orientation:landscape){.pvw.fs .pv-v{width:100vw;height:100vh;transform:none}}
.pv-v:fullscreen{width:100vw;height:100vh;aspect-ratio:auto;margin:0}
.pvw.fs .pv-top,.pv-v:fullscreen .pv-top{padding:max(10px,env(safe-area-inset-top)) 16px 6px}.pvw.fs .pv-bot,.pv-v:fullscreen .pv-bot{padding:0 18px 14px 22px}
html.wk-rm .tp-hero img,html.wk-rm .ep,html.wk-rm .pv-nx{animation:none}
.ymore{display:flex;justify-content:center;gap:6px;padding:26px 0 8px}.ymore i{width:8px;height:8px;border-radius:50%;background:var(--s-acc);animation:sldot 1s ease-in-out infinite}.ymore i:nth-child(2){animation-delay:.15s}.ymore i:nth-child(3){animation-delay:.3s}
@keyframes sldot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-6px)}}html.wk-rm .ymore i{animation:none}
.yt0{display:flex;flex-direction:column;align-items:center;text-align:center;padding:40px 18px 10px}
.yt0 .lg{width:96px;height:96px;border-radius:28px;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,color-mix(in srgb,#FF0000 22%,var(--s-card)),var(--s-card));box-shadow:0 0 0 10px color-mix(in srgb,#FF0000 6%,transparent),0 0 60px -12px rgba(255,0,0,.55);margin-bottom:22px}.yt0 .lg svg{width:50px;height:36px}
.yt0 b{font-size:21px;font-weight:900}.yt0 p{margin:10px 6px 24px;font-size:13.5px;line-height:1.8;color:var(--s-tx2)}
.yt0 .sl-btn{display:flex;align-items:center;gap:8px;height:52px;padding:0 26px;border-radius:18px}.yt0 .sl-btn svg{width:19px;height:19px}
.kn-row{position:absolute;z-index:3;display:flex;align-items:center;justify-content:center;gap:10px;padding:0 16px;border-radius:22px;background:rgba(10,6,20,.38);animation:knin .28s ease both}
.tk.kn-on{filter:saturate(.7)}.tk.kn-on>*{opacity:.1;transition:opacity .25s}
@keyframes knin{from{opacity:0;transform:scale(.97)}}
:where(.kn-row) button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.kn-go{height:44px;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 18px;border:0;background:none;color:#fff;font-size:15px;font-weight:900;text-shadow:0 1px 3px rgba(0,0,0,.7)}.kn-go svg{width:19px;height:19px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}.kn-go:active{opacity:.6}.kn-go:disabled{opacity:.5}
.kn-no{height:44px;padding:0 18px;border:0;background:none;color:rgba(255,255,255,.7);font-size:14px;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,.7);position:relative}.kn-no::before{content:"";position:absolute;inset-inline-start:-6px;top:12px;bottom:12px;width:1px;background:rgba(255,255,255,.3)}.kn-no:active{opacity:.6}
.kn-txt{gap:9px;flex-wrap:wrap;justify-content:center;text-align:center;font-size:12.5px;font-weight:700;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.75);background:rgba(10,6,20,.3)}
.kn-dot{width:7px;height:7px;border-radius:50%;background:#fff;flex:none;animation:kndot 1.4s ease-in-out infinite}@keyframes kndot{50%{opacity:.25;transform:scale(.7)}}
.kn-link{background:none;border:0;padding:0;color:#fff;font-size:12.5px;font-weight:900;text-decoration:underline;text-underline-offset:3px;opacity:.85}
.kn-bad{color:rgba(255,255,255,.7);animation:knin .3s ease both,knout .4s ease 4s forwards}@keyframes knout{to{opacity:0}}
.kn-ok{gap:14px}.kn-ok>span{display:flex;align-items:center;gap:6px}.kn-ok>span svg{width:16px;height:16px}
.kn-ban2{position:fixed;z-index:2147480050;top:calc(env(safe-area-inset-top,0px) + 10px);left:12px;right:12px;display:flex;align-items:center;gap:10px;padding:8px 8px 8px 10px;border-radius:20px;color:#fff;background:rgba(12,8,22,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.18);box-shadow:0 14px 34px -14px rgba(0,0,0,.8);animation:knbin .45s cubic-bezier(.2,1.3,.3,1) both;font-family:inherit}
.kn-ban2.out{opacity:0;transform:translateY(-14px);transition:all .3s}
@keyframes knbin{from{opacity:0;transform:translateY(-24px) scale(.96)}}
.kn-ban2 .kn-bt{width:42px;height:42px;border-radius:13px;overflow:hidden;flex:none}.kn-ban2 .kn-bt img{width:100%;height:100%;object-fit:cover}
.kn-ban2 .kn-bx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.kn-ban2 b{font-size:13.5px;font-weight:900}.kn-ban2 small{font-size:11.5px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kn-ban2 button{font:inherit;cursor:pointer;border:0;background:none;color:#fff}
.kn-ban2 .kn-bin{height:38px;padding:0 14px;font-size:14px;font-weight:900;text-shadow:0 1px 2px rgba(0,0,0,.5)}.kn-ban2 .kn-blt{width:30px;height:30px;display:grid;place-items:center;opacity:.6}.kn-ban2 .kn-blt svg{width:14px;height:14px}
.kn-float{position:fixed!important;z-index:2147480000;left:16px!important;right:16px;width:auto!important;top:auto!important;height:64px!important;bottom:calc(96px + env(safe-area-inset-bottom))}
.sl-hint{display:flex;flex-direction:column;align-items:center;gap:10px;padding:46px 20px;color:var(--s-tx2);font-size:13.5px;text-align:center}.sl-hint svg{width:30px;height:30px;opacity:.6}
.hm-grid{transition:opacity .2s}
/* «تاریخچه»: continue card and a timeline by day */
.hc-hd{display:flex;align-items:baseline;justify-content:space-between;margin:2px 2px 10px}.hc-hd b{font-size:19px;font-weight:800}.hc-hd span{font-size:12.5px;font-weight:700;color:var(--s-acc)}
.hc{position:relative;display:block;width:100%;height:206px;border-radius:24px;overflow:hidden;text-align:start;isolation:isolate;margin-bottom:22px;box-shadow:0 18px 34px -20px rgba(0,0,0,.8)}
.hc .im{position:absolute;inset:0;z-index:-2}.hc .im img{width:100%;height:100%;object-fit:cover}
.hc .vg{position:absolute;inset:0;z-index:-1;background:linear-gradient(0deg,rgba(9,4,16,.9),rgba(9,4,16,.1) 60%)}
.hc .tx{position:absolute;bottom:30px;inset-inline-start:20px;color:#fff;display:flex;flex-direction:column;gap:2px}.hc .tx b{font-size:24px;font-weight:900;text-shadow:0 2px 10px rgba(0,0,0,.6)}.hc .tx small{font-size:12px;opacity:.85}
.hc .tx em{font-style:normal;font-size:26px;font-weight:900;color:#FFD98A;direction:ltr;text-align:start;letter-spacing:.5px}.hc .tx em i{font-style:normal;font-size:13px;font-weight:600;color:rgba(255,255,255,.7);margin-inline-start:4px}
.sl[dir=rtl] .hc .tx em{text-align:right}
.hc .go{position:absolute;bottom:30px;inset-inline-end:18px;display:flex;align-items:center;gap:6px;height:44px;padding:0 20px;border-radius:22px;background:var(--s-acc);color:var(--s-onacc);font-size:15px;font-weight:800}.hc .go svg{width:15px;height:15px}
.hc .pr{position:absolute;bottom:12px;inset-inline:18px;height:4px;border-radius:2px;background:rgba(255,255,255,.18);overflow:hidden}.hc .pr i{display:block;height:100%;border-radius:2px;background:linear-gradient(90deg,#F2C46B,#FFE3A1);box-shadow:0 0 10px rgba(242,196,107,.8)}
.tl{position:relative;padding-inline-start:22px}
.tl:before{content:"";position:absolute;top:10px;bottom:10px;inset-inline-start:6px;width:2px;border-radius:1px;background:linear-gradient(180deg,#F2C46B,color-mix(in srgb,var(--wk-accent,#9E6FFF) 70%,transparent) 40%,transparent)}
.tl-d{position:relative;display:flex;align-items:center;margin:16px 0 8px}.tl-d.first{margin-top:4px}
.tl-d .dot{position:absolute;inset-inline-start:-22px;width:14px;height:14px;border-radius:50%;background:var(--s-bg);border:3px solid var(--s-acc)}.tl-d.first .dot{border-color:#F2C46B;box-shadow:0 0 0 4px rgba(242,196,107,.15)}
.tl-d b{font-size:15px;font-weight:800}
.tl-i{position:relative;display:flex;align-items:center;gap:6px;margin-bottom:8px;transition:opacity .2s,transform .2s}.tl-i.gone{opacity:0;transform:translateX(calc(var(--dir,1) * 20px))}
.sl[dir=rtl] .tl-i{--dir:-1}
.tl-b{flex:1;min-width:0;display:flex;align-items:center;gap:12px;padding:8px!important;border-radius:16px;background:var(--s-card)!important;border:1px solid var(--s-line)!important;text-align:start}
.tl-b .im{position:relative;width:104px;aspect-ratio:16/10;flex:none;border-radius:11px;overflow:hidden;background:var(--s-card2)}.tl-b .im img{width:100%;height:100%;object-fit:cover;display:block}
.tl-b .pl{position:absolute;inset:0;display:grid;place-items:center;background:rgba(9,4,16,.28);color:#fff}.tl-b .pl svg{width:22px;height:22px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))}
.tl-b .tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}.tl-b b{font-size:14.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tl-b small{font-size:12px;color:var(--s-tx2)}.tl-b small.ok{color:var(--s-teal)}
.tl-b .pr{display:block;height:3px;border-radius:2px;background:color-mix(in srgb,var(--s-tx) 14%,transparent);overflow:hidden}.tl-b .pr i{display:block;height:100%;background:#FF8FA3;border-radius:2px}.tl-b .pr.ok i{background:var(--s-teal)}
.tl-x{width:34px;height:34px;flex:none;border-radius:50%;display:grid;place-items:center;color:var(--s-tx2)}.tl-x svg{width:16px;height:16px}
.he{display:flex;flex-direction:column;align-items:center;text-align:center;padding:70px 20px 20px}
.he .ic{position:relative;width:104px;height:104px;border-radius:30px;display:grid;place-items:center;background:color-mix(in srgb,var(--wk-accent,#9E6FFF) 18%,var(--s-card));color:var(--s-acc);margin-bottom:26px;box-shadow:0 0 0 10px color-mix(in srgb,var(--wk-accent,#9E6FFF) 6%,transparent),0 0 60px -10px color-mix(in srgb,var(--wk-accent,#9E6FFF) 60%,transparent)}
.he .ic svg{width:44px;height:44px}.he .ic svg path{transform-origin:12px 12px;animation:slhand 6s linear infinite}
@keyframes slhand{to{transform:rotate(360deg)}}html.wk-rm .he .ic svg path{animation:none}
.he b{font-size:21px;font-weight:900}.he p{margin:10px 0 26px;font-size:13.5px;color:var(--s-tx2);line-height:1.8}.he .sl-btn{height:54px;padding:0 32px;border-radius:18px}
.sl-soon{padding:40px 20px;text-align:center;color:var(--s-tx2);font-size:14px;line-height:1.8}

/* ---------- pages above the app (discover, create, enter with code) */
.slp{position:fixed;inset:0;z-index:2147480000;background:var(--s-bg);display:flex;flex-direction:column;animation:slin .22s ease-out}
.slp.out{animation:slout .18s ease-in forwards}
@keyframes slin{from{opacity:0;transform:translateX(calc(var(--sld,-1)*28px))}}@keyframes slout{to{opacity:0;transform:translateX(calc(var(--sld,-1)*28px))}}
html.wk-rm .slp,html.wk-rm .slp.out{animation-duration:.01s}
.slp-hd{display:flex;align-items:flex-start;gap:10px;padding:max(14px,env(safe-area-inset-top)) 16px 10px}
.slp-bk{width:40px;height:46px;display:grid;place-items:center;flex:none}
.ytw{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-top:env(safe-area-inset-top);padding-bottom:calc(24px + env(safe-area-inset-bottom))}
.ytw-top{display:flex;align-items:center;gap:8px;padding:2px 10px 6px;direction:ltr}.ytw-top b{font-size:15px;font-weight:800;letter-spacing:-.2px}.ytw-lg{width:26px;height:19px}
.ytw-v{position:relative;aspect-ratio:16/9;background:#000}
.ytw-fs{position:absolute!important;inset:auto!important;top:8px!important;right:8px!important;left:auto!important;width:36px!important;height:36px!important;z-index:2;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.45)!important;color:#fff;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.ytw-fs svg{width:18px;height:18px}
.fs .ytw-v{position:fixed;z-index:60;top:0;left:0;margin:0;aspect-ratio:auto;width:100vh;height:100vw;transform-origin:top left;transform:translateX(100vw) rotate(90deg)}
@media (orientation:landscape){.fs .ytw-v{width:100vw;height:100vh;transform:none}}
.fs .ytw-fs{top:max(10px,env(safe-area-inset-top))!important;right:max(12px,env(safe-area-inset-right))!important}.ytw-v>:not(.ytw-fs),.ytw-v iframe{position:absolute;inset:0;width:100%!important;height:100%!important;border:0}
.ytw-b{padding:14px 16px 0}.ytw-t{font-size:17px;font-weight:800;line-height:1.45;margin:0 0 12px}
.ytw-ch{display:flex;align-items:center;gap:10px;margin-bottom:14px}.ytw-ch .av{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-weight:900;color:#fff;background:hsl(var(--h),55%,45%);flex:none}.ytw-ch b{display:block;font-size:14px}.ytw-ch small{font-size:12px;color:var(--s-tx2)}
.ytw-go{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:50px;border-radius:25px;font-weight:900;font-size:15px;color:#2a1a00!important;background:linear-gradient(135deg,#FFE7A8,#F2B13A)!important;box-shadow:0 12px 26px -12px rgba(242,177,58,.75)}.ytw-go svg{width:20px;height:20px}
.ytw-mh{font-size:15px;font-weight:800;margin:22px 0 10px}
.ytw-r{display:flex;gap:12px;width:100%;text-align:start;margin-bottom:12px;align-items:flex-start}.ytw-r .im{position:relative;flex:none;width:150px;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:var(--s-card2)}.ytw-r .im img{width:100%;height:100%;object-fit:cover}.ytw-r .du{position:absolute;bottom:5px;inset-inline-end:5px;font-size:11px;font-weight:800;padding:1px 6px;border-radius:6px;background:rgba(0,0,0,.72);color:#fff}
.ytw-r .tx{min-width:0}.ytw-r b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13.5px;line-height:1.45}.ytw-r small{display:block;margin-top:4px;font-size:12px;color:var(--s-tx2)}.slp-bk svg{width:24px;height:24px}
.slp-bk svg{transform:scaleX(-1)}[dir=rtl] .slp-hd>.slp-bk{order:9}.slp-hd>.slp-tt{flex:1;min-width:0}
.slp-tt{flex:1;min-width:0;text-align:start;padding-top:4px}.slp-tt h2{margin:0;font-size:28px;font-weight:800;line-height:1.25}.slp-tt small{display:block;margin-top:6px;font-size:13px;color:var(--s-tx2)}
.slp-bd{flex:1;overflow-y:auto;padding:8px 16px 24px;-webkit-overflow-scrolling:touch}
.sl-dhd{align-items:center;gap:6px;padding-bottom:4px}.sl-dhd .sl-sr{flex:1;margin:0;height:52px}.sl-dhd .slp-bk{width:34px}
.slp-ft{padding:12px 16px max(14px,env(safe-area-inset-bottom))}
.slp-ft .sl-btn{width:100%;height:56px;border-radius:20px}
.slp-ft .sl-btn[disabled]{opacity:.55}
.sl-sr{display:flex;align-items:center;gap:10px;height:56px;padding:0 16px;border-radius:18px;background:var(--s-card);border:1px solid var(--s-line);margin-bottom:12px}
.sl-sr svg{width:22px;height:22px;color:var(--s-tx2);flex:none}.sl-sr input{flex:1;min-width:0;height:100%;background:none;border:0;outline:0;color:var(--s-tx);font:inherit;font-size:15px}.sl-sr input::placeholder{color:var(--s-tx2)}

.sl-cards{display:block}
@property --a{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes slspin{to{--a:360deg}}
@keyframes slpulse{70%{box-shadow:0 0 0 7px rgba(62,224,143,0)}100%{box-shadow:0 0 0 0 rgba(62,224,143,0)}}
.sl-card{position:relative;display:block;width:100%;height:190px;border-radius:22px;overflow:hidden;background:var(--s-card2);text-align:start}
.sl-card img,.sl-card .sl-ph{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sl-card:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,rgba(10,5,18,.82))}
.sl-card .bd{position:absolute;top:14px;inset-inline-end:14px;z-index:1;height:34px;padding:0 16px;border-radius:17px;display:grid;place-items:center;background:var(--s-acc);color:var(--s-onacc);font-size:13px;font-weight:800}
.sl-card .tx{position:absolute;bottom:16px;inset-inline:20px;z-index:1;color:#fff}.sl-card b{display:block;font-size:24px;font-weight:800;text-shadow:0 2px 10px rgba(0,0,0,.4)}.sl-card small{display:block;margin-top:6px;font-size:13px;opacity:.85}
.sl-ban{position:relative;height:176px;border-radius:22px;overflow:hidden;background:var(--s-card2);margin-bottom:22px}
.sl-ban img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.sl-ban:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(10,5,18,.6))}
.sl-ban b{position:absolute;bottom:18px;inset-inline-start:22px;z-index:1;color:#fff;font-size:22px;font-weight:800;text-shadow:0 2px 10px rgba(0,0,0,.5)}
.sl-set{display:flex;align-items:center;gap:14px;width:100%;padding:16px 2px;border-bottom:1px solid var(--s-line);text-align:start}
.sl-set .ic{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;flex:none}.sl-set .ic svg{width:23px;height:23px}
.sl-set .tx{flex:1;min-width:0}.sl-set b{display:block;font-size:16.5px;font-weight:800}.sl-set small{display:block;margin-top:5px;font-size:13px;color:var(--s-tx2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sl-set .v{font-size:14px;font-weight:700;flex:none;max-width:38%;text-align:end}
.c-rose{background:color-mix(in srgb,var(--s-rose) 18%,var(--s-card));color:var(--s-rose)}.c-gold{background:color-mix(in srgb,var(--s-gold) 18%,var(--s-card));color:var(--s-gold)}
.c-acc{background:color-mix(in srgb,var(--s-acc) 18%,var(--s-card));color:var(--s-acc)}.c-teal{background:color-mix(in srgb,var(--s-teal) 18%,var(--s-card));color:var(--s-teal)}
.t-rose{color:var(--s-rose)}.t-gold{color:var(--s-gold)}.t-acc{color:var(--s-acc)}.t-teal{color:var(--s-teal)}
.sl-lbl{display:block;margin:6px 2px 12px;font-size:19px;font-weight:800;text-align:start}
.sl-code{display:flex;align-items:center;gap:12px;height:64px;padding:0 18px;border-radius:20px;background:var(--s-card);border:1px solid color-mix(in srgb,var(--wk-accent,#9E6FFF) 40%,transparent)}
.sl-code input{flex:1;min-width:0;height:100%;background:none;border:0;outline:0;color:var(--s-tx);font:inherit;font-size:20px;font-weight:700;letter-spacing:4px;text-transform:uppercase;direction:ltr;text-align:center}
.sl-code input::placeholder{letter-spacing:0;font-size:15px;font-weight:500;color:var(--s-tx2)}.sl-code svg{width:22px;height:22px;color:var(--s-tx2);flex:none}
.sl-help{margin:16px 4px 0;font-size:13px;line-height:1.8;color:var(--s-tx2)}
.sl-err{display:flex;align-items:center;gap:8px;margin:14px 4px 0;font-size:13px;font-weight:700;color:var(--s-rose)}.sl-err svg{width:18px;height:18px}

/* ---------- small sheet for one setting */
.sl-sh{position:fixed;inset:0;z-index:2147480100;background:rgba(5,2,12,.5);display:flex;align-items:flex-end;justify-content:center;animation:slfade .16s}
@keyframes slfade{from{opacity:0}}
.sl-sh .bx{width:min(100%,520px);max-height:86vh;overflow:auto;border-radius:26px 26px 0 0;background:color-mix(in srgb,var(--s-card) 92%,transparent);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid var(--s-line);border-bottom:0;padding:10px 18px max(18px,env(safe-area-inset-bottom));animation:slup .22s ease-out}
@keyframes slup{from{transform:translateY(30px);opacity:.6}}html.wk-rm .sl-sh,html.wk-rm .sl-sh .bx{animation:none}
.sl-sh .gr{width:40px;height:5px;border-radius:3px;background:var(--s-line);margin:0 auto 14px}
.sl-sh h3{margin:0 0 14px;font-size:18px;font-weight:800;text-align:start}
.sl-sh input.tx{width:100%;height:54px;padding:0 16px;border-radius:16px;background:var(--s-bg);border:1px solid var(--s-line);color:var(--s-tx);font:inherit;font-size:16px;outline:0}
.sl-sh input.tx:focus{border-color:var(--s-acc)}
.sl-sh .cnt{margin:6px 4px 0;font-size:12px;color:var(--s-tx2);text-align:end;direction:ltr}
.sl-opt{display:flex;align-items:center;gap:12px;width:100%;min-height:62px;padding:10px 14px;border-radius:16px;background:var(--s-bg);border:1px solid var(--s-line);margin-bottom:8px;text-align:start}
.sl-opt.on{border-color:var(--s-acc);background:color-mix(in srgb,var(--s-acc) 12%,var(--s-bg))}
.sl-opt .tx{flex:1}.sl-opt b{display:block;font-size:15px;font-weight:800}.sl-opt small{display:block;margin-top:4px;font-size:12.5px;color:var(--s-tx2);line-height:1.6}
.sl-opt .rd{width:24px;height:24px;border-radius:50%;border:2px solid var(--s-line);display:grid;place-items:center;flex:none}.sl-opt.on .rd{border-color:var(--s-acc);background:var(--s-acc);color:var(--s-onacc)}.sl-opt .rd svg{width:15px;height:15px}
.sl-step{display:flex;align-items:center;justify-content:center;gap:24px;margin:6px 0 16px}
.sl-step button{width:52px;height:52px;border-radius:16px;background:var(--s-bg)!important;border:1px solid var(--s-line)!important;display:grid;place-items:center}.sl-step button svg{width:22px;height:22px}
.sl-step button[disabled]{opacity:.35}
.sl-step output{min-width:70px;text-align:center;font-size:40px;font-weight:800;direction:ltr}
.sl-chips{display:flex;gap:8px;justify-content:center;margin-bottom:18px}
.sl-chips button{min-width:48px;height:40px;border-radius:14px;background:var(--s-bg)!important;border:1px solid var(--s-line)!important;font-weight:700!important;direction:ltr}.sl-chips button.on{background:var(--s-acc)!important;color:var(--s-onacc)!important;border-color:transparent!important}
.sl-dec{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.sl-dec button{position:relative;height:104px;border-radius:16px;overflow:hidden;border:2px solid transparent!important;background:var(--s-card2)!important}
.sl-dec button.on{border-color:var(--s-acc)!important}.sl-dec img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sl-dec span{position:absolute;bottom:8px;inset-inline-start:10px;z-index:1;color:#fff;font-size:12.5px;font-weight:700;text-shadow:0 1px 6px rgba(0,0,0,.7)}
.sl-dec button:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(0,0,0,.55))}
.sl-dec .gal{display:grid;place-items:center;color:var(--s-tx2)}.sl-dec .gal:after{display:none}.sl-dec .gal svg{width:26px;height:26px}.sl-dec .gal span{position:static;color:var(--s-tx2);text-shadow:none;margin-top:4px}
.sl-dec .gal div{display:flex;flex-direction:column;align-items:center}
.sl-sh .row2{display:flex;gap:10px;margin-top:14px}.sl-sh .row2 .sl-btn{flex:1}
`;
function style(){if(!document.getElementById('sl-notice-style')){const s=document.createElement('style');s.id='sl-notice-style';s.textContent='.sl .tk .sl-notice{display:block;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;opacity:.7;font-size:11px;line-height:1.6;margin-top:2px}';document.head.append(s)}if(document.getElementById('sln3-css'))return;const s=document.createElement('style');s.id='sln3-css';s.textContent=css;document.head.appendChild(s)}

/* ---------- state */
const S={srch:false,top:'salon',sec:'mine',filter:'followed',data:null,loading:false,offline:false};
let profileEpoch=0,homeLoad=null,discoveryLoad=null;
const D={f:'all',q:'',items:null,seq:0,t:0};
const TOPS=['salon','home','history'],SECS=['mine','discover'];const PREV={top:0,sec:0};
try{const f=localStorage.getItem('sln3_f');if(['followed','joined','recent'].includes(f))S.filter=f}catch(e){}
function host(){try{if(window.WakhanPages&&WakhanPages.view)return WakhanPages.view()}catch(e){}return document.getElementById('view')}
const inRoom=()=>{try{return typeof CID!=='undefined'&&!!CID&&typeof CV!=='undefined'&&CV==='hall'}catch(e){return false}};
const isTab=()=>{try{return typeof TAB!=='undefined'&&TAB==='c'}catch(e){return false}};

function status(s){if(s.status==='watching')return `<small class="w">${esc(tx('st_watching'))}</small>`;if(s.status==='chatting')return `<small>${esc(tx('st_chatting'))}</small>`;return `<small>${esc(s.topic||tx('st_idle'))}</small>`}
function visit(ts){if(!ts)return tx('visitLong');const d=new Date(ts*1000),n=new Date();const days=Math.round((new Date(n.getFullYear(),n.getMonth(),n.getDate())-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);
 if(days<=0)return tx('visitToday');if(days===1)return tx('visitYesterday');if(days<30)return tx('visitDays',{n:num(days)});return tx('visitLong')}
function sub(s,kind){if(kind==='recent')return `<small>${esc(visit(s.visited))}</small>`;if(kind==='joined'&&s.status!=='watching')return `<small>${esc(s.privacy==='invite'?tx('private'):tx('memberOf'))}</small>`;return status(s)}
function noticeSub(s){const text=String(s.notice||'').trim();return text?`<small class="sl-notice" dir="auto">${esc(text)}</small>`:''}
function rowH(s,kind){const st=s.status,cl=st==='watching'?' onair':st==='music'?' music':st==='talking'?' talk':st==='chatting'?' chat':'';const eq=st==='music'||st==='talking'?'<i class="eq"><s></s><s></s><s></s></i>':'<i></i>';
 return `<button class="tk${cl}" data-x="enter" data-code="${esc(s.code)}" aria-label="${esc(s.name)}، ${esc(subT(s,kind))}، ${esc(tx('people',{n:num(s.live)}))}"><span class="bg" aria-hidden="true"></span>
  <span class="mn"><span class="th">${img(photo(s),'')}</span><span class="tx"><b><bdi>${esc(s.name)}</bdi></b>${noticeSub(s)}<small>${eq}<span>${esc(subT(s,kind))}</span></small></span></span>
  <span class="st" aria-hidden="true">${sv('people','',2)}<b>${num(s.live)}${kind==='disc'?`<em>/${num(s.cap||s.seats)}</em>`:''}</b></span></button>`}
function subT(s,kind){if(kind==='recent')return visit(s.visited);const st=s.status;if(st==='watching')return tx('st_watching');if(st==='music')return tx('st_music');if(st==='talking')return tx('st_talking');if(kind==='joined')return s.privacy==='invite'?tx('private'):tx('memberOf');if(kind==='disc')return tx('st_idle');return s.topic||tx('st_idle')}
function mineH(){const m=S.data&&S.data.mine;
 if(!S.data)return '<div class="sl-sk" style="height:84px"></div>';
 if(!m)return `<button class="tk pass" data-x="create"><span class="bg" aria-hidden="true"></span><span class="mn"><span class="th">${sv('plus','',2)}</span><span class="tx"><span class="lb">${esc(tx('mine'))}</span><b>${esc(tx('mineNone'))}</b></span></span><span class="st" aria-hidden="true">${sv('back','',2.2)}</span></button>`;
 return `<button class="tk pass${m.status==='watching'?' onair':''}" data-x="enter" data-code="${esc(m.code)}" aria-label="${esc(tx('mine'))}: ${esc(m.name)}"><span class="bg" aria-hidden="true"></span><span class="mn"><span class="th">${img(photo(m),'')}</span><span class="tx"><span class="lb">${esc(tx('mine'))}</span><b><bdi>${esc(m.name)}</bdi></b>${noticeSub(m)}</span></span><span class="st ppl${m.live?' on':''}" aria-hidden="true">${sv('people','',2)}<b>${num(m.live||0)}</b></span></button>`}
function listH(){if(!S.data)return '<div class="sl-sk" style="height:66px"></div><div class="sl-sk" style="height:66px"></div>';const k=S.filter,items=S.data[k]||[];
 if(!items.length)return `<div class="sl-empty">${esc(tx(k==='followed'?'emptyFollowed':k==='joined'?'emptyJoined':'emptyRecent'))}</div>`;
 return `<div class="sl-list">${items.map(s=>rowH(s,k)).join('')}</div>`+(k==='recent'?`<p class="sl-note">${esc(tx('recentNote'))}</p>`:'')}
function mineSec(){return `${mineH()}
 <div class="sl-flt" role="tablist">${['followed','joined','recent'].map(k=>`<button role="tab" aria-selected="${S.filter===k}" class="${S.filter===k?'on':''}" data-x="filter" data-f="${k}">${esc(tx(k))}</button>`).join('')}</div>
 <div class="sl-rows">${listH()}</div>`}
function cardsH(){if(!D.items)return '<div class="sl-sk" style="height:66px"></div><div class="sl-sk" style="height:66px"></div><div class="sl-sk" style="height:66px"></div>';
 if(!D.items.length)return `<div class="sl-empty" style="padding:40px 16px"><b style="display:block;color:var(--s-tx);font-size:16px;margin-bottom:6px">${esc(tx('noSalons'))}</b>${esc(tx('noSalonsD'))}</div>`;
 return `<div class="sl-list">${D.items.map(s=>rowH(s,'disc')).join('')}</div>`}
function discSec(){return `<div class="sl-flt f4" role="tablist">${['all','watch','music','talk','friends'].map(k=>`<button role="tab" aria-selected="${D.f===k}" class="${D.f===k?'on':''}" data-x="df" data-f="${k}">${esc(tx('f_'+k))}</button>`).join('')}</div>
 <div class="sl-cards">${cardsH()}</div>`}
async function getDisc(){
 const query=D.f+'|'+D.q;if(discoveryLoad&&discoveryLoad.query===query)return discoveryLoad.task;
 const seq=++D.seq,epoch=profileEpoch;
 const task=Promise.resolve().then(async()=>{try{const r=await call('/api/app/salon/discover?f='+D.f+'&q='+encodeURIComponent(D.q));if(seq!==D.seq||epoch!==profileEpoch||!r?.ok)return;
 const items=(r.items||[]).filter(x=>x.configured!==false),changed=JSON.stringify(items)!==JSON.stringify(D.items);D.items=items;
 const box=isTab()&&!inRoom()&&S.top==='salon'&&host()?.querySelector('.sl .sl-cards');if(changed&&box)box.innerHTML=cardsH();
 }catch(e){/* Keep the last good directory; the next visible refresh retries. */}
 finally{if(discoveryLoad?.task===task)discoveryLoad=null}});discoveryLoad={query,task};return task;
}
function salonTab(){if(S.srch)return discSec();return `<div class="sl-sec" role="tablist" style="--si:${S.sec==='discover'&&PREV.top===0?PREV.sec:SECS.indexOf(S.sec)}">${[['mine','secMine'],['discover','discover']].map(([k,l])=>`<button role="tab" aria-selected="${S.sec===k}" class="${S.sec===k?'on':''}" data-x="sec" data-s="${k}">${esc(tx(l))}</button>`).join('')}</div>
 ${S.sec==='discover'?discSec():mineSec()}`}
/* ---------- «خانه»: the Wakhan Archive (featured carousel, categories, posters) and a separate YouTube entry */
const HM={src:'archive',cat:'all',data:null,seq:0,q:'',res:null,rseq:0,t:0,page:0,more:false,mo:false,rd:0,seed:0},HS={data:null};
const kind=k=>tx('k_'+(['film','series','doc'].includes(k)?k:'film'));
function heroH(list){if(!list.length)return '';
 return `<div class="hx" role="region" aria-roledescription="carousel" aria-label="${esc(tx('featured'))}"><div class="hx-tr">${list.map((t,i)=>`<button class="hx-sl" data-x="title" data-id="${esc(t.id)}" aria-label="${esc(t.title)}"><span class="im">${img(t.backdrop||t.poster,'')}</span><span class="vg"></span>
   <span class="bd">${esc(tx('archive'))}</span><span class="tx"><b><bdi>${esc(t.title)}</bdi></b><small>${esc(t.kind==='series'&&t.seasons?kind(t.kind)+' · '+tx('seasons',{n:num(t.seasons)}):(t.tag||kind(t.kind)))}</small></span>
   <span class="go" aria-hidden="true">${sv('play')}<span>${esc(tx('watch'))}</span></span></button>`).join('')}</div>
  ${list.length>1?`<div class="hx-dt" aria-hidden="true">${list.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}</div>`}
function postersH(items){return `<div class="pg">${items.map(t=>`<button class="pc" data-x="title" data-id="${esc(t.id)}" aria-label="${esc(t.title)}، ${esc(kind(t.kind))}"><span class="im${t.cover?'':' wide'}">${img(t.cover?t.poster:(t.frame||t.poster),'')}<span class="kd">${esc(kind(t.kind))}</span><i class="pl" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg></i></span><b><bdi>${esc(t.title)}</bdi></b>${t.year?`<small>${esc(String(t.year))}</small>`:''}</button>`).join('')}</div>`}
function ytH(){return `<button class="ytc" data-x="yt"><span class="lg" aria-hidden="true"><svg viewBox="0 0 28 20"><rect width="28" height="20" rx="5" fill="#FF0000"/><path d="M11.2 5.6v8.8l7.4-4.4z" fill="#fff"/></svg></span><span class="tx"><b>${esc(tx('yt'))}</b><small>${esc(tx('ytD'))}</small></span><span class="ch">${sv('back','',2)}</span></button>`}
function srcSw(){return `<div class="sl-sec" role="tablist" style="--si:${PREV.src||0}">${[['archive','archive'],['youtube','yt']].map(([k,l])=>`<button role="tab" aria-selected="${HM.src===k}" class="${HM.src===k?'on':''}" data-x="hsrc" data-s="${k}">${k==='youtube'?`<svg class="ytm" viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" rx="5" fill="#FF0000"/><path d="M11.2 5.6v8.8l7.4-4.4z" fill="#fff"/></svg>`:''}${esc(tx(l))}</button>`).join('')}</div>`}
/* YouTube «خانه»: a fresh feed on every visit and on pull-down; the server picks and caches it (official API, official player) */
const YT={cat:'foryou',data:null,seq:0,busy:false,page:0,more:false,seed:0,mo:false},YCATS=['foryou','music','film','series','doc','news','comedy','sport','kids'];
const short=n=>{n=Number(n||0);if(n>=1e6)return tx('nM',{n:+(n/1e6).toFixed(n<1e7?1:0)});if(n>=1e3)return tx('nK',{n:Math.round(n/1e3)});return num(n)};
function ago(ts){const s=Math.max(0,Date.now()/1000-ts);if(s<60)return tx('ago_n');const t=[[31536000,'y'],[2592000,'mo'],[604800,'w'],[86400,'d'],[3600,'h'],[60,'m']];for(const[k,u]of t)if(s>=k)return tx('ago_'+u,{n:Math.floor(s/k)})}
const hue=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))%360;return h};
function ytCard(v,i){return `<div class="yv" role="button" tabindex="0" data-x="ytv" data-id="${esc(v.id)}" style="--d:${Math.min(i,6)*45}ms" aria-label="${esc(v.title)}">
 <span class="th">${img(v.thumb,'')}${v.live?`<span class="lv"><i></i>${esc(tx('live'))}</span>`:`<span class="du">${esc(mmss(v.dur))}</span>`}
  <button class="ys" data-x="ytsalon" data-id="${esc(v.id)}" aria-label="${esc(tx('inSalon'))}">${sv('seat')}<span>${esc(tx('inSalon'))}</span></button></span>
 <span class="mt"><span class="av" style="--h:${hue(v.ch)}" aria-hidden="true">${v.chAv?img(v.chAv,''):esc(String(v.ch||'?').trim().charAt(0))}</span>
  <span class="tx"><b><bdi>${esc(v.title)}</bdi></b><small>${[v.ch?`<bdi>${esc(v.ch)}</bdi>`:'',v.views>0?esc(tx('views',{n:short(v.views)})):'',!v.live&&v.ts?esc(ago(v.ts)):''].filter(Boolean).join(' · ')}</small></span></span></div>`}
function ytShelf(list){if(!list||!list.length)return '';return `<div class="ysh"><div class="ysh-hd"><span class="eqs" aria-hidden="true"><i></i><i></i><i></i></span><b>${esc(tx('ytNewMusic'))}</b></div>
 <div class="ysh-tr">${list.map(m=>`<button class="ym" data-x="ytv" data-id="${esc(m.id)}" aria-label="${esc(m.title)}"><span class="im">${img(m.thumb,'')}<span class="pl">${sv('play')}</span></span><b><bdi>${esc(m.title)}</bdi></b><small><bdi>${esc(m.ch)}</bdi></small></button>`).join('')}</div></div>`}
function ytTab(){const chips=`<div class="sl-flt yflt" role="tablist">${YCATS.map(k=>`<button role="tab" aria-selected="${YT.cat===k}" class="${YT.cat===k?'on':''}" data-x="ycat" data-c="${k}">${k==='foryou'?'<i class="sp" aria-hidden="true"></i>':''}${esc(tx('yc_'+k))}</button>`).join('')}</div>`;
 const pull=`<div class="ypl" aria-hidden="true"><span class="rg"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="14"/></svg><svg class="lg" viewBox="0 0 28 20"><rect width="28" height="20" rx="5" fill="#FF0000"/><path d="M11.2 5.6v8.8l7.4-4.4z" fill="#fff"/></svg></span><em>${esc(tx('pullD'))}</em></div>`;
 const d=YT.data;if(!d)return `${pull}${srcSw()}${chips}<div class="yfd">${[0,1].map(()=>`<div class="yv sk"><span class="th sl-sk"></span><span class="mt"><span class="av sl-sk"></span><span class="tx"><i class="sl-sk"></i><i class="sl-sk" style="width:55%"></i></span></span></div>`).join('')}</div>`;
 const v=d.items||[];
 if(!v.length)return `${pull}${srcSw()}${chips}<div class="sl-empty" style="padding:36px 16px"><b style="display:block;color:var(--s-tx);font-size:15px;margin-bottom:4px">${esc(tx('ytEmpty'))}</b>${esc(tx('ytEmptyD'))}</div>`;
 const at=Math.min(2,v.length);
 return `${pull}${srcSw()}${chips}<div class="yfd">${v.slice(0,at).map(ytCard).join('')}${ytShelf(d.music)}${v.slice(at).map((x,i)=>ytCard(x,i+at)).join('')}</div>${YT.more?moreH():''}`}
const moreH=()=>`<div class="ymore" aria-hidden="true"><i></i><i></i><i></i></div>`;
function ytPaint(){if(S.top!=='home'||HM.src!=='youtube'||S.srch)return;const b=host()&&host().querySelector('.sl .sl-body');if(b){const y=window.scrollY;b.innerHTML=homeTab();window.scrollTo(0,y)}}
async function loadYt(quiet){const seq=++YT.seq;YT.mo=false;const g=host()&&host().querySelector('.sl .yfd');if(g&&YT.data)g.classList.add('dim');YT.seed=Math.floor(Math.random()*1e9);YT.page=0;
 try{const r=await call('/api/app/cinema/yt/feed?cat='+YT.cat+'&seed='+YT.seed+'&page=0');if(seq!==YT.seq)return;YT.data=r&&r.ok?r:{items:[],music:[]};YT.more=!!(r&&r.more)}catch(e){if(seq!==YT.seq)return;YT.data=YT.data||{items:[],music:[]};YT.more=false}
 if(!quiet)ytPaint()}
/* endless: the next page comes from the same shuffled pick (same seed), so nothing repeats while scrolling */
async function moreYt(){if(YT.mo||!YT.more||!YT.data)return;YT.mo=true;const seq=YT.seq,p=YT.page+1;
 try{const r=await call('/api/app/cinema/yt/feed?cat='+YT.cat+'&seed='+YT.seed+'&page='+p);if(seq!==YT.seq)return;const it=(r&&r.ok&&r.items)||[];if(!(r&&r.ok))return;YT.page=p;if(!r.more){YT.seed=Math.floor(Math.random()*1e9);YT.page=-1}YT.more=it.length>0||p>0;
  const n=YT.data.items.length;YT.data.items=YT.data.items.concat(it);const g=host()&&host().querySelector('.sl .yfd');
  if(g){g.insertAdjacentHTML('beforeend',it.map((x,i)=>ytCard(x,i)).join(''));const m=g.parentNode.querySelector('.ymore');if(!YT.more&&m)m.remove()}}catch(e){}finally{if(seq===YT.seq)YT.mo=false}}
/* pull down at the top of the YouTube feed: new topics */
function ytPull(v){let y0=null,dy=0,on=false;const top=()=>Math.max(window.scrollY||0,document.scrollingElement?document.scrollingElement.scrollTop:0)<=0;
 const ok=()=>S.top==='home'&&HM.src==='youtube'&&!S.srch&&!YT.busy&&!STACK.length;
 v.addEventListener('touchstart',e=>{if(!ok()||!top()||!e.target.closest('.sl'))return;y0=e.touches[0].clientY;dy=0;on=false},{passive:true});
 /* a «wait for me» finger listener makes every scroll on the page wait for the program; it is attached only while the
    YouTube feed is shown and scrolled to the very top, so all other scrolling in the app stays free */
 const mv=e=>{if(y0==null)return;dy=e.touches[0].clientY-y0;if(dy<=0){if(on)set(0);return}if(!top())return;on=true;e.preventDefault();set(Math.min(110,dy*.5))};let att=false;
 const sync=()=>{const want=ok()&&top()&&isTab()&&!!document.querySelector('.sl');if(want===att)return;att=want;if(want)v.addEventListener('touchmove',mv,{passive:false});else if(y0==null)v.removeEventListener('touchmove',mv,{passive:false});else att=true};
 window.addEventListener('scroll',sync,{passive:true});setInterval(sync,700);sync();
 v.addEventListener('touchend',()=>{if(y0==null)return;y0=null;if(!on)return;on=false;const b=v.querySelector('.sl .sl-body');if(dy*.5>=64)refresh(b);else set(0,true)},{passive:true});
 function set(px,anim){const b=v.querySelector('.sl .sl-body');if(!b)return;b.style.transition=anim?'transform .35s cubic-bezier(.2,.9,.2,1.2)':'none';b.style.transform=px?`translateY(${px}px)`:'';
  const p=b.querySelector('.ypl');if(p){p.style.setProperty('--p',Math.min(1,px/64));p.classList.toggle('rd',px>=64);const em=p.querySelector('em');if(em)em.textContent=tx(px>=64?'pullR':'pullD')}}
 async function refresh(b){YT.busy=true;hap();b.style.transition='transform .25s ease';b.style.transform='translateY(64px)';const p=b.querySelector('.ypl');if(p){p.classList.add('ld');const em=p.querySelector('em');if(em)em.textContent=tx('pullL')}
  const t0=Date.now();await loadYt(true);await new Promise(r=>setTimeout(r,Math.max(0,750-(Date.now()-t0))));YT.busy=false;ytPaint();window.scrollTo(0,0);
  const nb=v.querySelector('.sl .sl-body');if(nb){nb.style.transition='none';nb.style.transform='translateY(64px)';nb.offsetHeight;nb.style.transition='transform .4s cubic-bezier(.2,.9,.2,1.15)';nb.style.transform='';const f=document.createElement('div');f.className='yfr';f.innerHTML=`${sv('check')}<span>${esc(tx('fresh'))}</span>`;nb.closest('.sl').appendChild(f);setTimeout(()=>f.remove(),2300)}}}
function homeTab(){if(!S.srch&&HM.src==='youtube')return ytTab();if(S.srch&&HM.src==='youtube'){if(!HM.q)return `<div class="sl-hint">${sv('search')}<span>${esc(tx('ytPh'))}</span></div>`;if(HM.searchError)return `<div class="sl-empty">${esc(tx('offline'))}</div>`;if(!HM.res)return '<div class="yfd"><div class="sl-sk pk"></div></div>';return HM.res.length?`<div class="yfd">${HM.res.map(ytCard).join('')}</div>`:`<div class="sl-empty">${esc(tx('ytEmpty'))}</div>`;}if(S.srch){if(!HM.q)return `<div class="sl-hint">${sv('search')}<span>${esc(tx('archPh'))}</span></div>`;if(!HM.res)return '<div class="pg"><div class="sl-sk pk"></div><div class="sl-sk pk pkw"></div><div class="sl-sk pk pkw"></div><div class="sl-sk pk"></div></div>';
  return HM.res.length?postersH(HM.res):`<div class="sl-empty" style="padding:40px 16px"><b style="display:block;color:var(--s-tx);font-size:16px;margin-bottom:6px">${esc(tx('noTitles'))}</b>${esc(tx('noTitlesD'))}</div>`}
 const d=HM.data;
 const chips=`<div class="sl-flt" role="tablist">${['all','film','series','doc'].map(k=>`<button role="tab" aria-selected="${HM.cat===k}" class="${HM.cat===k?'on':''}" data-x="hcat" data-c="${k}">${esc(tx('c_'+k))}</button>`).join('')}</div>`;
 if(!d)return `${srcSw()}<div class="sl-sk" style="height:210px;border-radius:24px"></div>${chips}<div class="pg"><div class="sl-sk pk"></div><div class="sl-sk pk pkw"></div><div class="sl-sk pk pkw"></div><div class="sl-sk pk"></div></div>`;
 const items=d.items||[];
 return `${srcSw()}${heroH(d.featured||[])}${chips}<div class="hm-grid">${items.length?postersH(items):`<div class="sl-empty" style="padding:28px 16px"><b style="display:block;color:var(--s-tx);font-size:15px;margin-bottom:4px">${esc(tx('archEmpty'))}</b>${esc(tx('archEmptyD'))}</div>`}</div>${HM.more?moreH():''}`}
async function loadHome(){const seq=++HM.seq;HM.page=0;HM.mo=false;HM.rd=0;HM.seed=1+Math.floor(Math.random()*1e9);try{const r=await call('/api/app/cinema/home?cat='+HM.cat+'&page=0&seed='+HM.seed);if(seq!==HM.seq)return;HM.data=r&&r.ok?r:{featured:[],items:[]};{const f=HM.data.featured;if(Array.isArray(f))for(let i=f.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[f[i],f[j]]=[f[j],f[i]]}}HM.more=((r&&r.items)||[]).length>0}catch(e){if(seq!==HM.seq)return;HM.data=HM.data||{featured:[],items:[]};HM.more=false}
 if(S.top==='home'&&!S.srch){const b=host()&&host().querySelector('.sl .sl-body');if(b){b.innerHTML=homeTab();heroBind(b)}}}
async function moreHome(){if(HM.mo||!HM.more||!HM.data)return;HM.mo=true;const seq=HM.seq,p=HM.page+1;
 try{const r=await call('/api/app/cinema/home?cat='+HM.cat+'&page='+p+(HM.seed?'&seed='+HM.seed:''));if(seq!==HM.seq||!(r&&r.ok))return;const it=r.items||[];HM.page=p;
  const g=host()&&host().querySelector('.sl .hm-grid .pg');if(g&&it.length){const t=document.createElement('div');t.innerHTML=postersH(it);g.append(...t.firstElementChild.children)}
  if(!r.more){if(!HM.data.items.length&&!it.length){HM.more=false;const m=host()&&host().querySelector('.sl .ymore');if(m)m.remove();return}
   HM.rd++;HM.seed=Math.floor(Math.random()*1e9);HM.page=-1;if(g)g.insertAdjacentHTML('beforeend',`<div class="rnd"><i></i><span><b>${esc(tx('again2'))}</b><small>${esc(tx('again2D'))}</small></span><i></i></div>`)}}catch(e){}finally{if(seq===HM.seq)HM.mo=false}}
window.addEventListener('scroll',()=>{if(S.top!=='home'||S.srch||!isTab()||inRoom()||!document.querySelector('.sl'))return;const se=document.scrollingElement||document.documentElement;
 if(window.innerHeight+(window.scrollY||se.scrollTop)<se.scrollHeight-900)return;if(HM.src==='youtube')moreYt();else moreHome()},{passive:true});
async function archSearch(){const seq=++HM.rseq,source=HM.src,query=HM.q;HM.searchError=false;if(!HM.q){HM.res=null;const b=host()&&host().querySelector('.sl .sl-body');if(b)b.innerHTML=homeTab();return}
 try{const b0=host()?.querySelector('.sl .sl-body');if(b0)b0.innerHTML=homeTab();const r=await call((source==='youtube'?'/api/app/cinema/yt/search?q=':'/api/app/cinema/search?q=')+encodeURIComponent(query));if(seq!==HM.rseq||source!==HM.src||query!==HM.q||!S.srch)return;if(!r?.ok)throw Error('search');HM.res=r.items||[]}catch(e){if(seq!==HM.rseq||source!==HM.src||query!==HM.q||!S.srch)return;HM.searchError=true;HM.res=[]}
 const b=host()&&host().querySelector('.sl .sl-body');if(b)b.innerHTML=homeTab()}
/* the carousel: swipe, dots follow, and it moves on by itself every few seconds until touched */
let heroT=0;function heroBind(root){clearInterval(heroT);const tr=root&&root.querySelector('.hx-tr');if(!tr)return;const dots=[...root.querySelectorAll('.hx-dt i')];let touched=false;
 const idx=()=>Math.round(Math.abs(tr.scrollLeft)/tr.clientWidth);
 tr.addEventListener('scroll',()=>{const i=idx();dots.forEach((d,k)=>d.classList.toggle('on',k===i))},{passive:true});
 tr.addEventListener('pointerdown',()=>{touched=true},{passive:true});
 if(dots.length>1&&!document.documentElement.classList.contains('wk-rm'))if(!window.__slActive){window.__slActive=1;window.__slTouch=0;const mark=()=>{window.__slTouch=Date.now()};addEventListener('touchstart',mark,{passive:true,capture:true});addEventListener('touchmove',mark,{passive:true,capture:true});addEventListener('scroll',mark,{passive:true,capture:true})}heroT=setInterval(()=>{if(touched||!document.body.contains(tr))return clearInterval(heroT);if(Date.now()-(window.__slTouch||0)<4000)return;const rr=tr.getBoundingClientRect();if(rr.bottom<0||rr.top>innerHeight)return;const n=(idx()+1)%dots.length;tr.scrollTo({left:(RTL()?-1:1)*n*tr.clientWidth,behavior:'smooth'})},5200)}

/* ---------- «تاریخچه»: continue watching, then a timeline by day; personal times are kept apart from the salons' time */
const mmss=s=>{s=Math.max(0,Math.round(s||0));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')};
function dayName(ts){const d=new Date(ts*1000),n=new Date();const days=Math.round((new Date(n.getFullYear(),n.getMonth(),n.getDate())-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);
 if(days<=0)return tx('today');if(days===1)return tx('yesterday');return d.getFullYear()+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getDate()).padStart(2,'0')}
function histTab(){const d=HS.data;if(!d)return '<div class="sl-sk" style="height:220px;border-radius:24px"></div><div class="sl-sk" style="height:76px"></div><div class="sl-sk" style="height:76px"></div>';
 const c=d.continue,days=d.days||[];
 if(!c&&!days.length)return `<div class="he"><span class="ic">${sv('clock')}</span><b>${esc(tx('histEmpty'))}</b><p>${esc(tx('histEmptyD'))}</p><button class="sl-btn" data-x="top" data-t="home">${esc(tx('goHome'))}</button></div>`;
 const pct=x=>x.dur?Math.min(100,Math.round(100*x.pos/x.dur)):0;
 let out='';
 if(c)out+=`<div class="hc-hd"><b>${esc(tx('cont'))}</b><span>${esc(tx('half'))}</span></div>
  <button class="hc" data-x="resume" data-id="${esc(c.id)}" data-ep="${esc(c.ep||'')}" aria-label="${esc(tx('resume'))}: ${esc(c.title)}"><span class="im">${img(c.backdrop||c.poster,'')}</span><span class="vg"></span>
   <span class="tx"><b><bdi>${esc(c.title)}</bdi></b>${c.s?`<small>${esc(tx('ep',{s:num(c.s),e:num(c.e)}))}</small>`:''}<em>${esc(mmss(c.pos))}<i>/ ${esc(mmss(c.dur))}</i></em></span>
   <span class="go">${sv('play')}<span>${esc(tx('resume'))}</span></span><span class="pr" aria-hidden="true"><i style="width:${pct(c)}%"></i></span></button>`;
 out+=`<div class="tl">${days.map((g,gi)=>`<div class="tl-d${gi?'':' first'}"><span class="dot" aria-hidden="true"></span><b>${esc(dayName(g.day))}</b></div>
  ${g.items.map(x=>{const done=x.done||pct(x)>=97;return `<div class="tl-i"><button class="tl-b" data-x="${done?'again':'resume'}" data-id="${esc(x.id)}" data-ep="${esc(x.ep||'')}"><span class="im">${img(x.poster||x.backdrop,'')}<span class="pl">${sv(done?'restart':'play')}</span></span>
   <span class="tx"><b><bdi>${esc(x.title)}</bdi></b><small class="${done?'ok':''}">${esc(done?tx('full'):x.s?tx('ep',{s:num(x.s),e:num(x.e)}):tx('half'))}</small><span class="pr${done?' ok':''}"><i style="width:${done?100:pct(x)}%"></i></span></span></button>
   <button class="tl-x" data-x="hdel" data-id="${esc(x.id)}" data-ep="${esc(x.ep||'')}" aria-label="${esc(tx('removeOne'))}">${sv('x')}</button></div>`}).join('')}`).join('')}</div>`;
 return out}
async function loadHist(){try{const r=await call('/api/app/cinema/history');HS.data=r&&r.ok?r:{continue:null,days:[]}}catch(e){HS.data=HS.data||{continue:null,days:[]}}
 if(S.top==='history'){const b=host()&&host().querySelector('.sl .sl-body');if(b)b.innerHTML=histTab()}}
function confirmSheet(title,desc,okL,fn){sheet(title,`<p style="margin:-4px 2px 16px;font-size:13.5px;line-height:1.8;color:var(--s-tx2)">${esc(desc)}</p><div class="row2"><button class="sl-btn ol" data-s="x">${esc(tx('cancel'))}</button><button class="sl-btn" data-s="ok" style="background:#E5536B!important;color:#fff!important">${esc(okL)}</button></div>`,(bx,close)=>{bx.addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b)return;close();if(b.dataset.s==='ok')fn()})})}
function topIcons(){if(S.top==='history')return `<button class="sl-ib gl" data-x="hmore" aria-label="${esc(tx('more'))}">${sv('dots')}</button>`;
 if(S.top==='home')return `<button class="sl-ib gl" data-x="search" aria-label="${esc(tx('search'))}">${sv('search')}</button>`;
 return `<button class="sl-ib gl" data-x="search" aria-label="${esc(tx('search'))}">${sv('search')}</button><button class="sl-ib gl" data-x="join" aria-label="${esc(tx('joinCode'))}">${sv('key')}</button>`}
function page(){return `<div class="sl\" dir="${RTL()?'rtl':'ltr'}">
 ${S.srch?`<div class="sl-top sl-sbar"><label class="sl-sr">${sv('search')}<input type="search" data-k="dq" enterkeyhint="search" value="${esc(S.top==='home'?HM.q:D.q)}" placeholder="${esc(tx(S.top==='home'?(HM.src==='youtube'?'ytPh':'archPh'):'findPh'))}" aria-label="${esc(tx('search'))}"></label><button class="sl-ib gl" data-x="unsearch" aria-label="${esc(tx('cancel'))}">${sv('x')}</button></div>`:`<div class="sl-top"><div class="sl-tabs" role="tablist" aria-label="${esc(tx('cinema'))}" style="--ti:${PREV.top}">${[['salon','salon'],['home','home'],['history','history']].map(([k,l])=>`<button role="tab" aria-selected="${S.top===k}" class="${S.top===k?'on':''}" data-x="top" data-t="${k}"><span>${esc(tx(l))}</span></button>`).join('')}<i aria-hidden="true"></i></div>
 ${topIcons()}</div>`}
 <div class="sl-body">${S.top==='salon'?salonTab():S.top==='home'?homeTab():histTab()}</div></div>`}
function draw(anim){if(!isTab()||inRoom())return;const v=host();if(!v)return;style();v.innerHTML=page();document.body.classList.add('sl-on');
 const ti=TOPS.indexOf(S.top),si=S.top==='home'?(HM.src==='youtube'?1:0):SECS.indexOf(S.sec);const dt=ti-PREV.top,ds=si-(S.top==='home'?(PREV.src||0):PREV.sec);
 const body=v.querySelector('.sl .sl-body');if(anim&&body){body.classList.add((anim==='top'?dt:ds)>=0?'in-f':'in-b')}
 if(S.top==='home'&&!S.srch)heroBind(body);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{const t=v.querySelector('.sl .sl-tabs'),c=v.querySelector('.sl .sl-sec');
  if(t){t.style.setProperty('--ti',ti);if(dt){const i=t.querySelector('i');i&&i.classList.add('mv')}}
  if(c){c.style.setProperty('--si',si);if(ds)c.classList.add('mv')}PREV.top=ti;if(S.top==='home')PREV.src=si;else PREV.sec=si}))}
async function load(){
 if(homeLoad)return homeLoad;S.loading=true;const epoch=profileEpoch;
 const task=Promise.resolve().then(async()=>{let changed=false;try{const r=await call('/api/app/salon/home');if(!r?.ok)throw Error('salon_home');if(epoch!==profileEpoch)return;
 const next={...r,mine:r.mine?.configured===false?null:r.mine};for(const k of ['followed','joined','recent'])next[k]=(r[k]||[]).filter(x=>x.configured!==false);
 changed=JSON.stringify(next)!==JSON.stringify(S.data)||S.offline;S.data=next;S.offline=false;
 }catch(e){if(epoch!==profileEpoch)return;changed=!S.offline;S.offline=true;if(!S.data)S.data={mine:null,followed:[],joined:[],recent:[]}}
 finally{S.loading=false;if(homeLoad===task)homeLoad=null;if(changed&&!S.srch&&S.top==='salon'&&S.sec==='mine')draw();if(epoch!==profileEpoch)void refreshProfiles()}});homeLoad=task;return task;
}
function photoError(image){
 image.style.visibility='hidden';if(!image.closest('.sl [data-code] .th'))return;
 const raw=image.getAttribute('src')||'',url=new URL(raw,document.baseURI);
 if(!/^\/api\/v51\/hallphoto\/[a-f0-9]{32}\.jpg$/.test(url.pathname)||url.origin!==new URL(document.baseURI).origin)return;
 const attempt=Number(image.dataset.photoRetry)||0;if(attempt>=3)return;image.dataset.photoRetry=String(attempt+1);
 setTimeout(()=>{if(!image.isConnected||image.getAttribute('src')!==raw||document.hidden)return;url.searchParams.set('retry',String(attempt+1));image.src=url.href},[1000,3000,8000][attempt]);
}
function updateProfile(profile){
 if(!profile?.code)return;++profileEpoch;++D.seq;delete PRE[profile.code];
 const copy={};for(const k of ['name','photo','seats','limit','privacy','configured'])if(k in profile)copy[k]=profile[k];
 for(const items of [S.data?.mine?[S.data.mine]:[],S.data?.followed||[],S.data?.joined||[],S.data?.recent||[],D.items||[]])for(const item of items)if(item.code===profile.code)Object.assign(item,copy);
 discoveryLoad=null;if(isTab()&&!inRoom()&&S.top==='salon')draw();void refreshProfiles();
}
function refreshProfiles(){if(document.hidden||!isTab()||inRoom()||S.top!=='salon')return Promise.resolve();return S.srch||S.sec==='discover'?getDisc():load()}
// One shared directory request for everyone visible here; no per-card polling or stored photo URLs.
setInterval(()=>void refreshProfiles(),5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refreshProfiles()});
window.addEventListener('focus',()=>void refreshProfiles());

/* ---------- entering: the server checks the code and the salon's privacy; the current hall opens the salon */
const PRE={};function preCheck(code){code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length<4)return null;const o=PRE[code];if(o&&Date.now()-o.t<8000)return o.p;const p=call('/api/app/salon/check',{code});p.catch(()=>{});PRE[code]={t:Date.now(),p};return p}
document.addEventListener('pointerdown',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-x=enter][data-code]');if(b)preCheck(b.dataset.code)},true);
function veil(on){let v=document.getElementById('sl-veil');if(!on){if(v){v.classList.add('off');setTimeout(()=>v.remove(),180)}return}if(v)return;v=document.createElement('div');v.id='sl-veil';v.innerHTML='<i></i>';const st=document.getElementById('sl-veil-css')||document.head.appendChild(Object.assign(document.createElement('style'),{id:'sl-veil-css',textContent:'#sl-veil{position:fixed;inset:0;z-index:2147480000;background:radial-gradient(120% 70% at 50% 0%,#2a1d5c,#0d0a1f 70%);display:grid;place-items:center;opacity:1;transition:opacity .18s}#sl-veil.off{opacity:0}#sl-veil i{width:34px;height:34px;border-radius:50%;border:3px solid rgba(255,255,255,.25);border-top-color:#fff;animation:slvs .7s linear infinite}@keyframes slvs{to{transform:rotate(360deg)}}'}));document.body.appendChild(v);setTimeout(()=>veil(false),6000)}
async function enter(code){code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length<4)return {err:'badCode'};
 veil(true);let r;try{r=await (preCheck(code)||call('/api/app/salon/check',{code}))}catch(e){veil(false);return {err:'offline'}}finally{delete PRE[code]}
 if(!r||!r.ok||!r.can_enter)veil(false);else setTimeout(()=>veil(false),120);
 if(!r||!r.ok)return {err:r&&r.err==='not_found'?'noRoom':r&&r.err==='bad_code'?'badCode':r&&(r.err==='slow_down'||r.err==='rate')?'slow':'err'};
 if(!r.can_enter){if(r.knock){knock(r);return {ok:true,knock:true}}return {err:'enter_'+(r.reason||'closed')}}
 closeAll(true);hap();
 try{if(typeof enterRoom==='function'){await enterRoom(r.code);return {ok:true}}}catch(e){}
 return {err:'err'}}

/* ---------- page stack above the app */
const STACK=[];
function push(html,bind){style();const el=document.createElement('div');el.className='slp';el.dir=RTL()?'rtl':'ltr';el.style.setProperty('--sld',el.dir==='rtl'?'-1':'1');el.setAttribute('role','dialog');el.innerHTML=html;document.body.appendChild(el);STACK.push(el);
 try{history.pushState({sln3:STACK.length},'')}catch(e){}
 el.addEventListener('click',e=>{const b=e.target.closest('[data-x=back]');if(b)history.back()});bind&&bind(el);return el}
function drop(){const el=STACK.pop();if(!el)return;try{el._close&&el._close()}catch(e){}if(el.classList.contains('pvw')){PV=null;const t=STACK[STACK.length-1];if(t&&t._re)t._re();if(isTab()&&S.top==='history')loadHist()}el.classList.add('out');setTimeout(()=>el.remove(),190)}
function closeAll(now){while(STACK.length){const el=STACK.pop();if(now)el.remove();else{el.classList.add('out');setTimeout(()=>el.remove(),190)}}}
addEventListener('popstate',()=>{if(STACK.length)drop()});
const head=(t,s,extra)=>`<div class="slp-hd"><button class="slp-bk" data-x="back" aria-label="${esc(tx('back'))}">${sv('back','',2)}</button><div class="slp-tt"><h2>${esc(t)}</h2>${s?`<small>${esc(s)}</small>`:''}</div>${extra||''}</div>`;

/* ---------- create (one personal salon per account; the server keeps the same code on every retry) */
function create(){if(S.data&&S.data.mine){say(tx('already'));return enter(S.data.mine.code)}
 const F={name:'',seats:8,privacy:'all',decor:'pamir',photo:null,mic:'all',key:keyOf()};
 const val={name:()=>F.name||tx('namePh').replace(/^مثلاً |^e\.g\. /,''),seats:()=>tx('seatsV',{n:num(F.seats)}),privacy:()=>tx('p_'+F.privacy),decor:()=>F.photo?tx('photo'):tx('open'),mic:()=>tx('m_'+F.mic)};
 const rowS=(k,ic,c,t,s)=>`<button class="sl-set" data-x="set" data-k="${k}"><span class="ic c-${c}">${sv(ic)}</span><span class="tx"><b>${esc(tx(t))}</b><small data-v="${k}s">${esc(s)}</small></span><span class="v t-${c}" data-v="${k}">${esc(k==='name'?tx('edit'):val[k]())}</span></button>`;
 const el=push(`${head(tx('createT'),tx('createS'))}<div class="slp-bd">
   <div class="sl-ban" data-v="ban">${img(F.photo||wide(F),'')}<b><bdi>${esc(val.name())}</bdi></b></div>
   ${rowS('name','pen','rose','name',val.name())}${rowS('seats','seat','gold','seats',tx('seatsD'))}${rowS('privacy','lock','acc','privacy',tx('privacyD'))}${rowS('decor','image','teal','decor',tx('decorD'))}${rowS('mic','mic','acc','mic',tx('m_'+F.mic+'D'))}
  </div><div class="slp-ft"><button class="sl-btn" data-x="make">${esc(tx('create'))}</button></div>`,el=>{
  el.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;
   if(b.dataset.x==='set')edit(b.dataset.k);
   if(b.dataset.x==='make')make(b)})});
 function refresh(){const q=s=>el.querySelector(`[data-v="${s}"]`);
  q('ban').innerHTML=`${img(F.photo||wide(F),'')}<b><bdi>${esc(val.name())}</bdi></b>`;
  q('names').textContent=val.name();q('seats').textContent=val.seats();q('privacy').textContent=val.privacy();q('decor').textContent=val.decor();q('mic').textContent=val.mic();q('mics').textContent=tx('m_'+F.mic+'D')}
 function edit(k){
  if(k==='name')return sheet(tx('name'),`<input class="tx" maxlength="40" value="${esc(F.name)}" placeholder="${esc(tx('namePh'))}" enterkeyhint="done"><div class="cnt"><span>${F.name.length}</span>/40</div><div class="row2"><button class="sl-btn ol" data-s="x">${esc(tx('cancel'))}</button><button class="sl-btn" data-s="ok">${esc(tx('save'))}</button></div>`,(bx,close)=>{
   const i=bx.querySelector('input');setTimeout(()=>i.focus(),200);i.addEventListener('input',()=>{bx.querySelector('.cnt span').textContent=[...i.value].length});
   const ok=()=>{F.name=i.value.replace(/\s+/g,' ').trim();refresh();close()};i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ok()}});
   bx.addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b)return;if(b.dataset.s==='ok')ok();else close()})});
  if(k==='seats'){let n=F.seats;const body=()=>`<div class="sl-step"><button data-s="-" aria-label="−" ${n<=2?'disabled':''}>${sv('minus','',2.2)}</button><output aria-live="polite">${n}</output><button data-s="+" aria-label="+" ${n>=16?'disabled':''}>${sv('plus','',2.2)}</button></div><div class="sl-chips">${[2,4,8,12,16].map(v=>`<button data-s="${v}" class="${v===n?'on':''}">${v}</button>`).join('')}</div><button class="sl-btn" style="width:100%" data-s="ok">${esc(tx('done'))}</button>`;
   return sheet(tx('seats'),body(),(bx,close)=>{bx.addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b)return;const s=b.dataset.s;
    if(s==='ok'){F.seats=n;refresh();return close()}if(s==='-')n=Math.max(2,n-1);else if(s==='+')n=Math.min(16,n+1);else n=Number(s);hap();bx.querySelector('.in').innerHTML=body()})},true)}
  if(k==='privacy'||k==='mic'){const opts=k==='privacy'?['all','friends','invite']:['all','friends','owner'],pre=k==='privacy'?'p_':'m_';
   return sheet(tx(k==='privacy'?'privacy':'mic'),opts.map(o=>`<button class="sl-opt${F[k]===o?' on':''}" data-s="${o}"><span class="tx"><b>${esc(tx(pre+o))}</b><small>${esc(tx(pre+o+'D'))}</small></span><span class="rd">${F[k]===o?sv('check','',2.6):''}</span></button>`).join(''),(bx,close)=>{
    bx.addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b)return;F[k]=b.dataset.s;hap();refresh();close()})})}
  if(k==='decor')return sheet(tx('decor'),`<div class="sl-dec">${DECOR.map(d=>`<button data-s="${d}" class="${!F.photo&&F.decor===d?'on':''}">${img(ART+d+'.jpg','')}<span>${esc(tx('d_'+d))}</span></button>`).join('')}<button class="gal${F.photo?' on':''}" data-s="gal"><div>${sv('image')}<span>${esc(tx('gallery'))}</span></div></button></div><input type="file" accept="image/*" hidden>`,(bx,close)=>{
   const file=bx.querySelector('input[type=file]');
   bx.addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b)return;if(b.dataset.s==='gal')return file.click();F.decor=b.dataset.s;F.photo=null;hap();refresh();close()});
   file.addEventListener('change',async()=>{const f=file.files&&file.files[0];if(!f)return;try{F.photo=await shrink(f,1280,.84);refresh();close()}catch(e){say(tx('err'))}})})}
 async function make(b){if(!F.name.trim()){say(tx('nameReq'));return edit('name')}
  b.disabled=true;const lbl=b.textContent;b.textContent=tx('creating');
  try{const r=await call('/api/app/salon/create',{name:F.name,seats:F.seats,privacy:F.privacy,mic:F.mic,decor:F.photo?null:F.decor,photo:F.photo,client_key:F.key});
   if(r&&r.ok&&r.code){say(tx(r.existing?'already':'created'));S.data=null;load();await enter(r.code);return}
   say(tx(r&&(r.err==='slow_down'||r.err==='rate')?'slow':r&&r.err==='name'?'nameReq':'err'))}
  catch(e){say(tx('offline'))}
  b.disabled=false;b.textContent=lbl}}
function keyOf(){const a=new Uint8Array(16);crypto.getRandomValues(a);return [...a].map(b=>b.toString(16).padStart(2,'0')).join('')}
function shrink(file,max,q){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);let d=c.toDataURL('image/jpeg',q);while(d.length>900000&&q>.45){q-=.08;d=c.toDataURL('image/jpeg',q)}ok(d)};im.onerror=no;im.src=u})}
function sheet(title,body,bind,wrap){style();const w=document.createElement('div');w.className='sl-sh';w.dir=RTL()?'rtl':'ltr';w.innerHTML=`<div class="bx" role="dialog" aria-label="${esc(title)}"><div class="gr"></div><h3>${esc(title)}</h3><div class="in">${body}</div></div>`;document.body.appendChild(w);
 const close=()=>{w.remove()};w.addEventListener('click',e=>{if(e.target===w)close()});bind&&bind(w.querySelector('.bx'),close);return w}

/* ---------- enter with code */
/* ---------- knocking: no new page. Under the tapped salon two buttons appear (knock / cancel);
   after knocking only a quiet line of text stays there until the owner answers. */
const KNS={};let knObs=null;
function knRowH(code){const k=KNS[code];if(!k)return '';
 if(k.st==='ask')return `<div class="kn-row" data-kc="${esc(code)}" data-st="ask"><button class="kn-go" data-kn="go">${sv('door','',1.8)}<span>${esc(tx('kn_knock'))}</span></button><button class="kn-no" data-kn="no">${esc(tx('cancel'))}</button></div>`;
 if(k.st==='wait')return `<div class="kn-row kn-txt" data-kc="${esc(code)}" data-st="wait"><i class="kn-dot"></i><span>${esc(tx('kn_sent'))}</span><button class="kn-link" data-kn="cancel">${esc(tx('kn_cancel'))}</button></div>`;
 if(k.st==='ok')return `<div class="kn-row kn-txt kn-ok" data-kc="${esc(code)}" data-st="ok"><span>${sv('check','',2.2)}${esc(tx('kn_yes'))}</span><button class="kn-go" data-kn="in">${esc(tx('kn_in'))}</button></div>`;
 if(k.st==='no')return `<div class="kn-row kn-txt kn-bad" data-kc="${esc(code)}" data-st="no"><span>${esc(tx(k.why==='expired'?'kn_gone':'kn_no'))}</span></div>`;return ''}
/* the knock layer sits ON the tapped salon card itself (same size and place), never under it */
function knAttach(){document.querySelectorAll('.kn-row').forEach(x=>{if(!KNS[x.dataset.kc]){const t=document.querySelector('.sl [data-x=enter][data-code="'+x.dataset.kc+'"]');if(t)t.classList.remove('kn-on');x.remove()}});
 for(const code in KNS){const t=document.querySelector('.sl [data-x=enter][data-code="'+code+'"]');let row=document.querySelector('.kn-row[data-kc="'+code+'"]');
  if(!t){if(row&&!row.classList.contains('kn-float'))row.remove();if(!document.querySelector('.sl [data-x=enter]'))knFloat(code);continue}
  const p=t.parentNode;if(getComputedStyle(p).position==='static')p.style.position='relative';
  if(!(row&&row.dataset.st===KNS[code].st&&row.parentNode===p)){if(row)row.remove();t.insertAdjacentHTML('afterend',knRowH(code));row=t.nextElementSibling}
  const a=t.getBoundingClientRect(),b=p.getBoundingClientRect();Object.assign(row.style,{top:(a.top-b.top+p.scrollTop)+'px',left:(a.left-b.left+p.scrollLeft)+'px',width:a.width+'px',height:a.height+'px'});t.classList.add('kn-on')}}
function knFloat(code){let row=document.querySelector('.kn-row.kn-float[data-kc="'+code+'"]');const html=knRowH(code);if(!html){if(row)row.remove();return}if(row&&row.dataset.st===KNS[code].st)return;
 const w=document.createElement('div');w.innerHTML=html;const n=w.firstElementChild;n.classList.add('kn-float');n.dir=RTL()?'rtl':'ltr';if(row)row.replaceWith(n);else document.body.appendChild(n)}
function knock(r){const code=r.code;KNS[code]={st:r.knocked?'wait':'ask',r};if(r.knocked)knWatch(code);knAttach();
 if(!knObs){try{let tm=0;knObs=new MutationObserver(()=>{clearTimeout(tm);tm=setTimeout(knAttach,30)});knObs.observe(document.getElementById('view')||document.body,{childList:true,subtree:true})}catch(e){}
  document.addEventListener('click',async e=>{const b=e.target.closest('[data-kn]');if(!b)return;const row=b.closest('.kn-row');const c=row&&row.dataset.kc;const k=c&&KNS[c];if(!k)return;e.stopPropagation();hap();
   if(b.dataset.kn==='no'){delete KNS[c];return knAttach()}
   if(b.dataset.kn==='go'){b.disabled=true;try{const j=await call('/api/app/salon/knock',{code:c});if(!j||!j.ok)throw j;k.st='wait';knAttach();knWatch(c)}catch(x){b.disabled=false;say(tx(x&&x.err==='full_16'?'kn_full':'offline'))}return}
   if(b.dataset.kn==='in'){knGo(c);return}
   if(b.dataset.kn==='cancel'){try{await call('/api/app/salon/knock/cancel',{code:c})}catch(x){}clearInterval(k.poll);delete KNS[c];knAttach()}},true)}}
async function knGo(code){const k=KNS[code];if(!k)return;delete KNS[code];knAttach();knBannerOff();closeAll(true);window.SLR3_WELCOME={name:k.r.name};
 try{if(typeof TAB!=='undefined'&&TAB!=='c'&&typeof go==='function')go('c')}catch(e){}try{await enterRoom(code)}catch(e){}}
function knBannerOff(){const b=document.querySelector('.kn-ban2');if(b){b.classList.add('out');setTimeout(()=>b.remove(),300)}}
/* a quiet line at the top of whatever screen the person is on: it never pulls them away */
function knBanner(code){const k=KNS[code];if(!k)return;knBannerOff();const b=document.createElement('div');b.className='kn-ban2';b.dir=RTL()?'rtl':'ltr';b.setAttribute('role','status');
 b.innerHTML=`<span class="kn-bt">${img(k.r.bg||ART+'pamir_wide.jpg','')}</span><span class="kn-bx"><b>${esc(tx('kn_yes'))}</b><small><bdi>${esc(tx('kn_yesD',{n:k.r.name||''}))}</bdi></small></span><button class="kn-bin" data-bn="in">${esc(tx('kn_in'))}</button><button class="kn-blt" data-bn="later" aria-label="${esc(tx('kn_later'))}">${sv('x','',2)}</button>`;
 document.body.appendChild(b);try{navigator.vibrate&&navigator.vibrate([14,60,14])}catch(e){}
 b.addEventListener('click',e=>{const x=e.target.closest('[data-bn]');if(!x)return;if(x.dataset.bn==='in')knGo(code);else knBannerOff()});setTimeout(()=>{if(b.isConnected)knBannerOff()},20000)}
function knWatch(code){const k=KNS[code];if(!k)return;clearInterval(k.poll);k.poll=setInterval(async()=>{if(!KNS[code])return clearInterval(k.poll);let j=null;try{j=await call('/api/app/salon/knock?code='+code)}catch(e){return}
  if(!j||!j.ok)return;if(j.status==='admitted'){clearInterval(k.poll);k.st='ok';knAttach();knBanner(code);clearTimeout(k.exp);k.exp=setTimeout(()=>{if(KNS[code]&&KNS[code].st==='ok'){delete KNS[code];knAttach();knBannerOff()}},5*60000)}
  else if(j.status==='rejected'||j.status==='expired'){clearInterval(k.poll);k.st='no';k.why=j.status;knAttach();setTimeout(()=>{if(KNS[code]&&KNS[code].st==='no'){delete KNS[code];knAttach()}},4500)}},2500)}
function join(){const el=push(`${head(tx('joinT'),tx('joinS'))}<div class="slp-bd">
  <div class="sl-ban">${img(ART+'pamir_wide.jpg','')}<b>${esc(tx('joinBanner'))}</b></div>
  <label class="sl-lbl" for="sln3-code">${esc(tx('codeL'))}</label>
  <div class="sl-code">${sv('lock')}<input id="sln3-code" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${esc(tx('codePh'))}" enterkeyhint="go"></div>
  <p class="sl-help">${esc(tx('codeHelp'))}</p><div class="sl-err" hidden></div></div>
  <div class="slp-ft"><button class="sl-btn" data-x="go" disabled>${esc(tx('enter'))}</button></div>`,el=>{
  const i=el.querySelector('input'),b=el.querySelector('[data-x=go]'),er=el.querySelector('.sl-err');
  i.addEventListener('input',()=>{i.value=i.value.toUpperCase().replace(/[^A-Z0-9]/g,'');b.disabled=i.value.length<4;er.hidden=true});
  const go=async()=>{if(b.disabled)return;b.disabled=true;const l=b.textContent;b.textContent=tx('checking');const r=await enter(i.value);if(r&&r.err){er.innerHTML=sv('alert')+esc(tx(r.err));er.hidden=false;b.textContent=l;b.disabled=false}};
  b.addEventListener('click',go);i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go()}});setTimeout(()=>i.focus(),260)})}

/* ---------- a title's page: films get «تماشا»; a series opens on the season you are in, the next episode marked */
function tpEps(d,sn){const se=(d.seasons||[]).find(x=>x.n===sn)||(d.seasons||[])[0];if(!se)return '';const nx=d.next&&d.next.ep;
 return se.eps.map((e,i)=>{const done=e.done||(e.dur&&e.pos/e.dur>=.97),p=done?100:e.dur?Math.round(100*e.pos/e.dur):0,isN=e.ep===nx;
  return `<button class="ep${done?' dn':''}${isN?' nx':''}" data-t="play" data-ep="${esc(e.ep)}" style="--d:${Math.min(i,8)*40}ms"><span class="th">${img(e.thumb||d.backdrop,'')}<span class="no">${num(e.e)}</span>${done?`<span class="ck">${sv('check','',2.4)}</span>`:`<span class="pl">${sv('play')}</span>`}${p&&!done?`<span class="pr"><i style="width:${p}%"></i></span>`:''}</span>
   <span class="tx">${isN?`<em>${esc(tx('p_next'))}</em>`:''}<b><bdi>${esc(e.title)}</bdi></b><small>${esc(done?tx('p_watched'):p?tx('p_left',{n:Math.max(1,Math.round((e.dur-e.pos)/60))}):tx('p_min',{n:Math.max(1,Math.round(e.dur/60))}))}</small></span></button>`}).join('')}
function tpH(d,sn){const ser=d.kind==='series',nx=d.next||{},has=nx.pos>0,p=nx.dur?Math.round(100*(nx.pos||0)/nx.dur):0;
 const lbl=(has?tx('p_cont'):ser?tx('p_play'):tx('p_watch'))+(ser&&nx.s?' · '+tx('ep',{s:num(nx.s),e:num(nx.e)}):'');
 const meta=[kind(d.kind),d.year,ser?tx('seasons',{n:num((d.seasons||[]).length)}):d.dur?tx('p_min',{n:Math.round(d.dur/60)}):'',...(d.genres||[])].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('<i></i>');
 return `<div class="tp-hero"><span class="im">${img(d.backdrop||d.poster,'')}</span><span class="vg"></span><button class="slp-bk tp-bk" data-x="back" aria-label="${esc(tx('back'))}">${sv('back','',2)}</button></div>
 <div class="tp-b"><h1><bdi>${esc(d.title)}</bdi></h1><div class="tp-m">${meta}</div>
  <div class="tp-act"><button class="tp-play" data-t="play" data-ep="${esc(nx.ep||'')}"><span class="ic">${sv('play')}</span><span class="lb"><b>${esc(lbl)}</b>${has?`<small>${esc(tx('p_left',{n:Math.max(1,Math.round((nx.dur-nx.pos)/60))}))}</small>`:''}</span>${has?`<span class="pr"><i style="width:${p}%"></i></span>`:''}</button>
   <button class="tp-sal" data-t="salon" aria-label="${esc(tx('inSalon'))}">${sv('seat')}<span>${esc(tx('inSalon'))}</span></button></div>
  ${d.desc?`<p class="tp-d">${esc(d.desc)}</p><button class="tp-mr" data-t="more">${esc(tx('p_more'))}</button>`:''}
  ${ser?`<div class="sl-flt tp-ss" role="tablist">${d.seasons.map(x=>`<button role="tab" aria-selected="${x.n===sn}" class="${x.n===sn?'on':''}" data-t="season" data-n="${x.n}">${esc(tx('p_season',{n:num(x.n)}))}<small>· ${esc(tx('p_eps',{n:num(x.eps.length)}))}</small></button>`).join('')}</div><div class="tp-eps">${tpEps(d,sn)}</div>`:''}</div>`}
async function openTitle(id){let d=null,sn=1;
 const el=push(`<div class="tp"><div class="tp-hero sl-sk"></div><div class="tp-b"><div class="sl-sk" style="height:30px;width:60%;border-radius:10px"></div><div class="sl-sk" style="height:56px;border-radius:18px;margin-top:18px"></div></div></div>`,el=>{
  el.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(!b||!d)return;const t=b.dataset.t;
   if(t==='play'){hap();return openPlayer(d.id,b.dataset.ep||'',d)}
   if(t==='salon'){hap();const pb=el.querySelector('[data-t=play]');return window.SLR7?SLR7.inSalon(d.id,(pb&&pb.dataset.ep)||''):say(tx('soon'))}
   if(t==='more'){const p=el.querySelector('.tp-d');p.classList.toggle('op');b.textContent=tx(p.classList.contains('op')?'p_less':'p_more');return}
   if(t==='season'){const n=+b.dataset.n;if(n===sn)return;sn=n;hap();el.querySelectorAll('[data-t=season]').forEach(z=>{z.classList.toggle('on',z===b);z.setAttribute('aria-selected',z===b)});const g=el.querySelector('.tp-eps');g.innerHTML=tpEps(d,sn)}})});
 el.classList.add('tpw');
 const paint=async()=>{try{const r=await call('/api/app/cinema/title?id='+encodeURIComponent(id));if(!r||!r.ok)throw 0;d=r;sn=(d.next&&d.next.s)||sn;el.querySelector('.tp').innerHTML=tpH(d,sn);
  const nx=el.querySelector('.ep.nx');if(nx)setTimeout(()=>nx.scrollIntoView({block:'nearest',inline:'nearest'}),50)}catch(e){say(tx('offline'))}};
 el._re=paint;await paint()}

/* ---------- the player: own controls, ±10s, full screen (real when the phone allows it, otherwise the page turns sideways),
   the place is saved every few seconds, and at the end of an episode the next one starts by itself unless cancelled */
let PV=null;
function pvH(){return `<div class="pv"><div class="pv-v"><video playsinline webkit-playsinline preload="auto"></video><div class="pv-sp" aria-hidden="true"></div>
 <div class="pv-ui"><div class="pv-top"><button class="pv-b" data-p="close" aria-label="${esc(tx('back'))}">${sv('x','',2)}</button><span class="pv-tt"><b></b><small></small></span></div>
  <div class="pv-mid"><button class="pv-b" data-p="r10" aria-label="${esc(tx('p_r10'))}">${sv('r10')}</button><button class="pv-b pv-pp" data-p="pp" aria-label="${esc(tx('p_pause'))}">${sv('pause')}</button><button class="pv-b" data-p="f10" aria-label="${esc(tx('p_f10'))}">${sv('f10')}</button></div>
  <div class="pv-bot"><span class="pv-t">0:00</span><input class="pv-sk" type="range" min="0" max="1000" value="0" aria-label="${esc(tx('p_seek'))}"><span class="pv-t pv-d">0:00</span><button class="pv-b pv-fs" data-p="fs" aria-label="${esc(tx('p_fs'))}">${sv('fs','',2)}</button></div></div>
 <div class="pv-nx" hidden><span class="im"></span><span class="tx"><small>${esc(tx('p_nextEp'))}</small><b></b></span><span class="bt"><button data-p="nxgo"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16"/></svg>${sv('play')}<span></span></button><button data-p="nxno">${esc(tx('cancel'))}</button></span></div></div>
 <div class="pv-in"><b class="pv-h"></b><small class="pv-s"></small><div class="pv-up"></div></div></div>`}
async function openPlayer(id,ep,title){const el=push(pvH(),el=>{
  const v=el.querySelector('video'),ui=el.querySelector('.pv-ui'),sk=el.querySelector('.pv-sk'),pp=el.querySelector('.pv-pp'),nxB=el.querySelector('.pv-nx');let hideT=0,saveT=0,cd=0,cur=null,dragging=false;
  PV={el,v,id};
  const show=()=>{ui.classList.add('on');clearTimeout(hideT);if(!v.paused)hideT=setTimeout(()=>ui.classList.remove('on'),3000)};
  const save=()=>{if(!cur||!v.duration)return;call('/api/app/cinema/progress',{id,ep:cur.ep||null,pos:Math.floor(v.currentTime),dur:Math.floor(v.duration)}).catch(()=>{})};
  const upd=()=>{if(!v.duration)return;el.querySelector('.pv-t').textContent=mmss(v.currentTime);el.querySelector('.pv-d').textContent=mmss(v.duration);if(!dragging)sk.value=Math.round(1000*v.currentTime/v.duration);sk.style.setProperty('--v',sk.value/10+'%')};
  const ppI=()=>{pp.innerHTML=sv(v.paused?'play':'pause');pp.setAttribute('aria-label',tx(v.paused?'p_play':'p_pause'))};
  async function load(ep2,from0){clearInterval(cd);nxB.hidden=true;el.classList.add('ld');
   try{const r=await call('/api/app/cinema/play?id='+encodeURIComponent(id)+(ep2?'&ep='+encodeURIComponent(ep2):''));if(!r||!r.ok)throw 0;cur=r;
    el.querySelector('.pv-tt b').textContent=r.title;el.querySelector('.pv-tt small').textContent=r.s?tx('ep',{s:num(r.s),e:num(r.e)})+' · '+r.epTitle:'';
    el.querySelector('.pv-h').textContent=r.title;el.querySelector('.pv-s').textContent=r.s?tx('ep',{s:num(r.s),e:num(r.e)})+' · '+r.epTitle:'';
    const up=r.upNext||[];el.querySelector('.pv-up').innerHTML=up.length?`<h3>${esc(tx('p_upNext'))}</h3>`+up.map(e=>`<button class="ep" data-p="ep" data-ep="${esc(e.ep)}"><span class="th">${img(e.thumb,'')}<span class="no">${num(e.e)}</span><span class="pl">${sv('play')}</span></span><span class="tx"><b><bdi>${esc(e.title)}</bdi></b><small>${esc(tx('p_min',{n:Math.max(1,Math.round(e.dur/60))}))}</small></span></button>`).join(''):'';
    v.src=r.src;v.addEventListener('loadedmetadata',()=>{if(!from0&&r.pos&&r.pos<v.duration-5)v.currentTime=r.pos;el.classList.remove('ld');v.play().catch(()=>{});upd()},{once:true})}catch(e){el.classList.remove('ld');say(tx('offline'))}}
  function upNextCard(){const n=cur&&cur.nextEp;if(!n){say(tx('p_last'));return}nxB.querySelector('.im').innerHTML=img(n.thumb,'');nxB.querySelector('b').textContent=tx('ep',{s:num(n.s),e:num(n.e)})+' · '+n.title;nxB.hidden=false;
   let left=8;const go=nxB.querySelector('[data-p=nxgo]'),sp=go.querySelector('span');sp.textContent=tx('p_inSec',{n:left});go.style.setProperty('--cd','0');requestAnimationFrame(()=>go.style.setProperty('--cd','1'));
   clearInterval(cd);cd=setInterval(()=>{left--;sp.textContent=tx('p_inSec',{n:left});if(left<=0){clearInterval(cd);load(n.ep,true)}},1000)}
  v.addEventListener('timeupdate',upd);v.addEventListener('play',()=>{ppI();show();clearInterval(saveT);saveT=setInterval(save,10000)});v.addEventListener('pause',()=>{ppI();show();save();clearInterval(saveT)});
  v.addEventListener('waiting',()=>el.classList.add('ld'));v.addEventListener('playing',()=>el.classList.remove('ld'));v.addEventListener('ended',()=>{save();ui.classList.add('on');upNextCard()});
  sk.addEventListener('input',()=>{dragging=true;sk.style.setProperty('--v',sk.value/10+'%');if(v.duration)el.querySelector('.pv-t').textContent=mmss(v.duration*sk.value/1000);show()});
  sk.addEventListener('change',()=>{dragging=false;if(v.duration)v.currentTime=v.duration*sk.value/1000});
  el.querySelector('.pv-v').addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b){ui.classList.toggle('on');if(ui.classList.contains('on'))show();return}const p=b.dataset.p;show();
   if(p==='pp'){v.paused?v.play().catch(()=>{}):v.pause();hap()}else if(p==='r10'){v.currentTime=Math.max(0,v.currentTime-10);b.classList.remove('kk');void b.offsetWidth;b.classList.add('kk')}else if(p==='f10'){v.currentTime=Math.min(v.duration||0,v.currentTime+10);b.classList.remove('kk');void b.offsetWidth;b.classList.add('kk')}
   else if(p==='fs')fsToggle(el);else if(p==='close'){if(el.classList.contains('fs')||document.fullscreenElement)return fsToggle(el);history.back()}
   else if(p==='nxgo'){clearInterval(cd);load(cur.nextEp.ep,true)}else if(p==='nxno'){clearInterval(cd);nxB.hidden=true}});
  el.querySelector('.pv-in').addEventListener('click',e=>{const b=e.target.closest('[data-p=ep]');if(b){hap();load(b.dataset.ep,true)}});
  el._close=()=>{try{window.WakhanOrientation&&WakhanOrientation.setFullscreen(false)}catch(_){}save();clearInterval(saveT);clearInterval(cd);try{v.pause()}catch(_){}if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});try{screen.orientation.unlock()}catch(_){}};
  load(ep,false)});el.classList.add('pvw');return el}
async function fsToggle(el){const w=el.querySelector('.pv-v'),b=el.querySelector('.pv-fs');
 const on=!!document.fullscreenElement||el.classList.contains('fs');
 try{window.WakhanOrientation&&WakhanOrientation.setFullscreen(!on)}catch(e){}
 if(on){if(document.fullscreenElement){try{await document.exitFullscreen()}catch(e){}}el.classList.remove('fs');try{screen.orientation.unlock()}catch(e){}}
 else{let real=false;if(document.fullscreenEnabled&&w.requestFullscreen){try{await w.requestFullscreen();real=true;try{await screen.orientation.lock('landscape')}catch(e){}}catch(e){}}if(!real)el.classList.add('fs')}
 const now=!on;b.innerHTML=sv(now?'fsx':'fs','',2);b.setAttribute('aria-label',tx(now?'p_fsx':'p_fs'))}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&PV&&PV.el){const b=PV.el.querySelector('.pv-fs');if(b&&!PV.el.classList.contains('fs')){b.innerHTML=sv('fs','',2)}}});
/* the archive / history buttons open these pages unless another module took them */
const OWN={title:id=>openTitle(id),resume:(id,ep)=>openPlayer(id,ep||''),again:(id,ep)=>openPlayer(id,ep||'')};
/* YouTube: one video in the official player (in the phone app it runs through the Wakhan page) + «play in a salon» */
function ytFind(id){const d=YT.data||{};return [...(d.items||[]),...(d.shelf||[]),...(d.music||[])].find(v=>v&&v.id===id)||{id}}
function ytApi(){const Y=()=>window.YT&&window.YT.Player;return new Promise(ok=>{if(Y())return ok(true);if(!document.getElementById('ytapi')){const sc=document.createElement('script');sc.id='ytapi';sc.src='https://www.youtube.com/iframe_api';document.head.appendChild(sc)}let n=0;const t=setInterval(()=>{if(Y()||++n>100){clearInterval(t);ok(!!Y())}},100)})}
function ytSalonOpen(id){const v=ytFind(id);if(window.SLR7&&SLR7.ytSalon)return SLR7.ytSalon(v);say(tx('soon'))}
/* the player has its own layer above the page: fixed at the top while the list scrolls, a small floating window after back */
let YD=null;
const YDI={min:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
 pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.3" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.3" fill="currentColor"/></svg>',
 play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>'};
function ydCss(){if(document.getElementById('ytd-css'))return;const st=document.createElement('style');st.id='ytd-css';st.textContent=`
.ytw .ytw-v{position:sticky;top:0;z-index:3}
.ytw .ytw-v .ytw-fs{display:none!important}
#ytdock{position:fixed;z-index:2147480001;background:#000;overflow:hidden;border-radius:0;touch-action:none;transition:border-radius .25s,box-shadow .25s}
#ytdock.ydo{transition:top .3s cubic-bezier(.2,.8,.2,1),left .3s cubic-bezier(.2,.8,.2,1),width .3s cubic-bezier(.2,.8,.2,1),height .3s cubic-bezier(.2,.8,.2,1),border-radius .3s,box-shadow .3s}
#ytdock .ydv,#ytdock .ydv iframe,#ytdock .ydv>div{position:absolute;inset:0;width:100%!important;height:100%!important;border:0}
#ytdock .ydt{position:absolute;left:0;right:0;top:0;height:46px;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:0 8px;direction:ltr}
#ytdock .ydt button,#ytdock .ydm button{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:#fff;border:0;padding:0;background:rgba(0,0,0,.42);-webkit-tap-highlight-color:transparent;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 0 0 1px rgba(255,255,255,.22)}
#ytdock button svg{width:18px;height:18px}
#ytdock .ydm{display:none;position:absolute;left:0;right:0;top:0;height:46px;z-index:3;align-items:flex-start;justify-content:space-between;padding:6px;direction:ltr;background:linear-gradient(180deg,rgba(0,0,0,.6),transparent)}
#ytdock .ydm button{width:30px;height:30px;background:rgba(0,0,0,.3)}
#ytdock .ydm button svg{width:15px;height:15px}
#ytdock .ydp{display:none;position:absolute;left:0;right:0;bottom:0;height:2.5px;z-index:3;background:rgba(255,255,255,.25)}
#ytdock .ydp i{position:absolute;left:0;top:0;bottom:0;width:0;background:#fff;box-shadow:0 0 6px #fff}
#ytdock.mini{border-radius:14px;box-shadow:inset 0 1.2px 0 rgba(255,255,255,.85),0 0 0 1px rgba(255,255,255,.3),0 16px 30px -10px rgba(0,0,0,.85)}
#ytdock.mini .ydv{pointer-events:none}
#ytdock.mini .ydt{display:none}
#ytdock.mini .ydm{display:flex}
#ytdock.mini .ydp{display:block}
#ytdock.hid{visibility:hidden}
#ytdock.fs{top:0!important;left:0!important;width:100vh!important;height:100vw!important;transform-origin:top left;transform:translateX(100vw) rotate(90deg);border-radius:0;z-index:2147480002}
@media (orientation:landscape){#ytdock.fs{width:100vw!important;height:100vh!important;transform:none}}
#ytdock.fs .ydt{top:max(6px,env(safe-area-inset-top));padding:0 max(10px,env(safe-area-inset-right))}
`;document.head.appendChild(st)}
function ydMake(v){ydCss();const h=document.createElement('div');h.id='ytdock';h.innerHTML=`<div class="ydv"><div id="slyt"></div></div>
 <div class="ydt"><button data-d="min" aria-label="${esc(tx('back'))}">${YDI.min}</button><button data-d="fs" aria-label="${esc(tx('p_fs'))}">${sv('fs','',2)}</button></div>
 <div class="ydm"><button data-d="pp" aria-label="${esc(tx('p_pause'))}">${YDI.pause}</button><button data-d="x" aria-label="${esc(tx('back'))}">${YDI.x}</button></div><i class="ydp"><i></i></i>`;
 document.body.appendChild(h);YD={host:h,P:null,v,page:null,mini:false,side:'r',y:null,pl:true,raf:0,bar:h.querySelector('.ydp i'),pp:h.querySelector('[data-d=pp]')};
 (async()=>{await ytApi();if(!YD||YD.host!==h||!(window.YT&&window.YT.Player))return;try{YD.P=new window.YT.Player('slyt',{videoId:v.id,width:'100%',height:'100%',playerVars:{autoplay:1,playsinline:1,controls:1,rel:0,modestbranding:1,hl:'en'}})}catch(e){}})();
 ydBind(h);ydLoop();return YD}
function ydClose(){if(!YD)return;const d=YD;YD=null;cancelAnimationFrame(d.raf);clearTimeout(d.raf);if(d.host.classList.contains('fs'))ydFs(false,d);try{d.P&&d.P.destroy&&d.P.destroy()}catch(e){}d.host.remove()}
function ydFs(on,d=YD){if(!d)return;d.host.classList.toggle('fs',on);const b=d.host.querySelector('[data-d=fs]');if(b){b.innerHTML=sv(on?'fsx':'fs','',2);b.setAttribute('aria-label',tx(on?'p_fsx':'p_fs'))}
 try{window.WakhanOrientation&&WakhanOrientation.setFullscreen(on)}catch(_){}try{on?screen.orientation.lock('landscape').catch(()=>{}):screen.orientation.unlock()}catch(_){}}
function ydBox(){const W=Math.round(Math.min(210,innerWidth*.46)),H=Math.round(W*9/16);const nav=document.querySelector('.wk-shared-nav,#nav,nav');let bottom=110;try{const r=nav&&nav.getBoundingClientRect();if(r&&r.height&&r.top>innerHeight/2)bottom=innerHeight-r.top+12}catch(e){}
 const minY=60,maxY=innerHeight-H-bottom;const y=Math.max(minY,Math.min(maxY,YD.y==null?maxY:YD.y));return {W,H,x:YD.side==='l'?12:innerWidth-W-12,y}}
function ydMini(on){if(!YD)return;if(on&&YD.host.classList.contains('fs'))ydFs(false);YD.mini=on;const h=YD.host;h.classList.add('ydo');h.classList.toggle('mini',on);
 if(on){const b=ydBox();Object.assign(h.style,{left:b.x+'px',top:b.y+'px',width:b.W+'px',height:b.H+'px'})}clearTimeout(YD.ot);YD.ot=setTimeout(()=>h.classList.remove('ydo'),320)}
function ydLoop(){if(!YD)return;const d=YD,h=d.host;
 if(!d.mini&&!(d.page&&d.page.isConnected))ydMini(true);
 if(!d.mini&&d.page&&!h.classList.contains('fs')){const slot=d.page.querySelector('.ytw-v');if(slot){const r=slot.getBoundingClientRect();h.style.left=r.left+'px';h.style.top=r.top+'px';h.style.width=r.width+'px';h.style.height=r.height+'px'}
  const top=STACK[STACK.length-1];h.classList.toggle('hid',top!==d.page)}else h.classList.remove('hid');
 if(d.mini){try{const P=d.P,dur=P&&P.getDuration&&P.getDuration(),t=P&&P.getCurrentTime&&P.getCurrentTime();if(dur>0)d.bar.style.width=Math.min(100,t/dur*100)+'%';const sn=P&&P.getPlayerState&&P.getPlayerState();const pl=sn===1||sn===3;if(pl!==d.pl){d.pl=pl;d.pp.innerHTML=pl?YDI.pause:YDI.play;d.pp.setAttribute('aria-label',tx(pl?'p_pause':'p_play'))}}catch(e){}
  /* one sound at a time: a salon on the screen ends the small window */
  try{const sl=document.querySelector('.slr');if(sl&&sl.offsetParent!==null){ydClose();return}}catch(e){}}
 /* the small window only needs a few updates a second; per-frame layout reads made the whole app stutter */
 d.raf=d.mini?setTimeout(()=>{if(YD===d)requestAnimationFrame(ydLoop)},250):requestAnimationFrame(ydLoop)}
function ydBind(h){let sx=0,sy=0,ox=0,oy=0,drag=false,down=false,strip=false;
 h.addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b||!YD)return;e.stopPropagation();hap();const k=b.dataset.d;
  if(k==='min'){if(YD.page&&YD.page.isConnected)history.back();else ydMini(true);return}
  if(k==='fs')return ydFs(!h.classList.contains('fs'));
  if(k==='x')return ydClose();
  if(k==='pp'){try{YD.pl?YD.P.pauseVideo():YD.P.playVideo()}catch(_){}return}});
 h.addEventListener('pointerdown',e=>{if(!YD||e.target.closest('button'))return;strip=!YD.mini&&!!e.target.closest('.ydt');if(!YD.mini&&!strip)return;down=true;drag=false;sx=e.clientX;sy=e.clientY;const r=h.getBoundingClientRect();ox=r.left;oy=r.top;try{h.setPointerCapture(e.pointerId)}catch(_){}});
 h.addEventListener('pointermove',e=>{if(!down||!YD)return;const dx=e.clientX-sx,dy=e.clientY-sy;
  if(strip){if(dy>40){down=false;hap();if(YD.page&&YD.page.isConnected)history.back();else ydMini(true)}return}
  if(!drag&&Math.hypot(dx,dy)>8)drag=true;if(drag){h.style.left=(ox+dx)+'px';h.style.top=(oy+dy)+'px'}});
 const up=e=>{if(!down||!YD)return;down=false;if(strip)return;if(!drag){hap();return openYtv(YD.v.id)}const r=h.getBoundingClientRect();YD.side=r.left+r.width/2<innerWidth/2?'l':'r';YD.y=r.top;ydMini(true)};
 h.addEventListener('pointerup',up);h.addEventListener('pointercancel',()=>{down=false;if(YD&&YD.mini)ydMini(true)})}
function openYtv(id){let v=ytFind(id);
 const more=()=>{const d=YT.data||{};return (d.items||[]).filter(x=>x&&x.id!==v.id).slice(0,12)};
 const info=()=>`<h2 class="ytw-t"><bdi>${esc(v.title||'')}</bdi></h2><div class="ytw-ch"><span class="av" style="--h:${hue(v.ch)}" aria-hidden="true">${esc(String(v.ch||'?').trim().charAt(0))}</span><span><b><bdi>${esc(v.ch||'YouTube')}</bdi></b>${v.views>0?`<small>${esc(tx('views',{n:short(v.views)}))}</small>`:''}</span></div>
  <button class="ytw-go" data-y="salon">${sv('seat')}<span>${esc(tx('inSalon'))}</span></button>
  ${more().length?`<div class="ytw-mh">${esc(tx('yc_foryou'))}</div>${more().map(m=>`<button class="ytw-r" data-y="v" data-id="${esc(m.id)}"><span class="im">${img(m.thumb,'')}<span class="du">${esc(mmss(m.dur))}</span></span><span class="tx"><b><bdi>${esc(m.title)}</bdi></b><small><bdi>${esc(m.ch||'')}</bdi></small></span></button>`).join('')}`:''}`;
 if(YD&&YD.page&&YD.page.isConnected&&!YD.mini)return YD.page;
 const el=push(`<div class="ytw"><div class="ytw-top"><button class="slp-bk" data-x="back" aria-label="${esc(tx('back'))}">${sv('back','',2)}</button><svg class="ytw-lg" viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" rx="5" fill="#FF0000"/><path d="M11.2 5.6v8.8l7.4-4.4z" fill="#fff"/></svg><b>YouTube</b></div><div class="ytw-v"></div><div class="ytw-b">${info()}</div></div>`,el=>{
  if(YD&&YD.v.id!==v.id){YD.v=v;try{YD.P&&YD.P.loadVideoById&&YD.P.loadVideoById(v.id)}catch(_){}}
  if(!YD)ydMake(v);YD.page=el;ydMini(false);
  el._close=()=>{if(YD&&YD.page===el)ydMini(true)};
  el.addEventListener('click',e=>{const b=e.target.closest('[data-y]');if(!b)return;hap();
   if(b.dataset.y==='salon'){ydClose();return ytSalonOpen(v.id)}
   if(b.dataset.y==='v'){v=ytFind(b.dataset.id);if(YD)YD.v=v;el.querySelector('.ytw-b').innerHTML=info();el.querySelector('.ytw').scrollTop=0;try{YD&&YD.P&&YD.P.loadVideoById?YD.P.loadVideoById(v.id):(ydClose(),ydMake(v),YD.page=el)}catch(_){}}})});
 return el}
window.SLN3_CLOSE=()=>{try{closeAll(true)}catch(e){}};

/* ---------- events on the tab */
let bound=null;
function swipeBind(v){if(v.__slSwipe)return;v.__slSwipe=true;let sx=0,sy=0,ok=false,t0=0;
 const scrollsX=el=>{for(let n=el;n&&n!==v;n=n.parentElement){if(n.scrollWidth>n.clientWidth+4){const o=getComputedStyle(n).overflowX;if(o==='auto'||o==='scroll')return true}if(n.matches&&n.matches('.hx-tr,.yv-cats,.sl-chips,input,textarea,[data-x=top]'))return true}return false};
 v.addEventListener('touchstart',e=>{const t=e.touches[0];ok=e.touches.length===1&&!!e.target.closest('.sl')&&!e.target.closest('.slp,.sl-sh')&&!scrollsX(e.target)&&!inRoom()&&!STACK.length;sx=t.clientX;sy=t.clientY;t0=Date.now()},{passive:true});
 v.addEventListener('touchend',e=>{if(!ok)return;ok=false;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.7||Date.now()-t0>700)return;
  const sl=v.querySelector('.sl');const rtl=sl&&getComputedStyle(sl).direction==='rtl';const step=(dx<0)!==rtl?1:-1;const i=TOPS.indexOf(S.top)+step;if(i<0||i>=TOPS.length)return;
  const b=v.querySelector('.sl [data-x=top][data-t="'+TOPS[i]+'"]');if(b)b.click()},{passive:true})}
function bindTab(v){swipeBind(v);if(v.__sln3Bound)return;v.__sln3Bound=true;v.addEventListener('click',e=>{if(!e.target.closest('.sl'))return;const b=e.target.closest('[data-x]');if(!b)return;const x=b.dataset.x;
 if(x==='top'){if(S.top===b.dataset.t)return;if(S.srch){S.srch=false}S.top=b.dataset.t;hap();draw('top');tabData();return}
 if(x==='hsrc'){if(HM.src===b.dataset.s)return;PREV.src=HM.src==='youtube'?1:0;HM.src=b.dataset.s;hap();draw('src');if(HM.src==='archive'&&!HM.data)loadHome();if(HM.src==='youtube')loadYt();return}
 if(x==='ycat'){if(YT.cat===b.dataset.c)return;YT.cat=b.dataset.c;hap();v.querySelectorAll('.sl [data-x=ycat]').forEach(z=>{z.classList.toggle('on',z===b);z.setAttribute('aria-selected',z===b)});b.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});loadYt();return}
 if(x==='ytv'||x==='ytsalon'){const fn=window.SLN3_PAGES&&SLN3_PAGES[x];if(fn)return fn(b.dataset.id);return x==='ytv'?openYtv(b.dataset.id):ytSalonOpen(b.dataset.id)}
 if(x==='hcat'){if(HM.cat===b.dataset.c)return;HM.cat=b.dataset.c;hap();v.querySelectorAll('.sl [data-x=hcat]').forEach(z=>{z.classList.toggle('on',z===b);z.setAttribute('aria-selected',z===b)});const g=v.querySelector('.sl .hm-grid');if(g)g.style.opacity='.45';loadHome();return}
 if(x==='title'||x==='yt'||x==='resume'||x==='again'){const fn=(window.SLN3_PAGES&&SLN3_PAGES[x])||OWN[x];if(fn)return fn(b.dataset.id,b.dataset.ep);return say(tx('soon'))}
 if(x==='hdel'){const row=b.closest('.tl-i');row&&row.classList.add('gone');call('/api/app/cinema/history/remove',{id:b.dataset.id,ep:b.dataset.ep||null}).then(()=>setTimeout(loadHist,220)).catch(()=>{row&&row.classList.remove('gone');say(tx('offline'))});return}
 if(x==='hmore'){if(!HS.data||(!HS.data.continue&&!(HS.data.days||[]).length))return;return sheet(tx('more'),`<button class="sl-opt" data-s="clear"><span class="tx"><b style="color:#FF8A98">${esc(tx('clearHist'))}</b></span><span class="rd" style="border:0;color:#FF8A98">${sv('trash')}</span></button>`,(bx,close)=>{bx.addEventListener('click',e=>{if(!e.target.closest('[data-s]'))return;close();confirmSheet(tx('clearQ'),tx('clearD'),tx('clear'),async()=>{try{const r=await call('/api/app/cinema/history/clear',{});if(r&&r.ok){say(tx('cleared'));HS.data={continue:null,days:[]};draw()}else say(tx('err'))}catch(_){say(tx('offline'))}})})})}
 if(x==='sec'){if(S.sec===b.dataset.s)return;S.sec=b.dataset.s;hap();draw('sec');if(S.sec==='discover'&&!D.items)getDisc();return}
 if(x==='df'){D.f=b.dataset.f;hap();v.querySelectorAll('.sl [data-x=df]').forEach(z=>{z.classList.toggle('on',z===b);z.setAttribute('aria-selected',z===b)});getDisc();return}
 if(x==='filter'){S.filter=b.dataset.f;try{localStorage.setItem('sln3_f',S.filter)}catch(_){}hap();const r=v.querySelector('.sl-rows');v.querySelectorAll('[data-x=filter]').forEach(z=>{z.classList.toggle('on',z===b);z.setAttribute('aria-selected',z===b)});if(r)r.innerHTML=listH();return}
 if(x==='enter'){enter(b.dataset.code).then(r=>{if(r&&r.err)say(tx(r.err))});return}
 if(x==='create')return create();if(x==='join')return join();
 if(x==='search'){S.srch=true;if(S.top==='history')S.top='home';hap();draw('srch');if(S.top==='salon'&&!D.items)getDisc();const i=v.querySelector('.sl input[data-k=dq]');i&&i.focus();return}
 if(x==='unsearch'){S.srch=false;hap();if(S.top==='home'){HM.q='';HM.res=null;draw('srch');if(!HM.data)loadHome();return}const had=D.q;D.q='';draw('srch');if(had)getDisc();return}})
 v.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.sl input[data-k=dq]')&&S.top==='home'){e.preventDefault();clearTimeout(HM.t);HM.q=e.target.value.trim();HM.res=null;void archSearch();return}if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.sl .yv')){e.preventDefault();e.target.click()}});
 v.addEventListener('input',e=>{if(!e.target.matches('.sl input[data-k=dq]'))return;if(S.top==='home'){clearTimeout(HM.t);HM.t=setTimeout(()=>{HM.q=e.target.value.trim();HM.res=null;archSearch()},300);return}clearTimeout(D.t);D.t=setTimeout(()=>{D.q=e.target.value.trim();getDisc()},300)})}

/* ---------- take over the cinema tab outside a salon (the native lobby part loads after us, so claim it again once loaded) */
function tabData(){if(S.top==='home'){if(HM.src==='youtube')loadYt();else if(!HM.data)loadHome()}else if(S.top==='history')loadHist()}
function mine(){draw();load();if(S.top==='salon'&&(S.sec==='discover'||S.srch))getDisc();tabData()}
/* iPhone/Android app: the Kino tab button calls the native lobby (WakhanCinema.open), which draws the old room list over ours.
 Keep its 'opening' flag (the hall needs it) but let it open our salon list instead. */
function tame(){try{const W=window.WakhanCinema;if(!W||W.__sln3)return;W.__sln3=1;
 W.render=function(){if(isTab()&&!inRoom())return mine()};
 W.open=function(){try{document.activeElement&&document.activeElement.blur()}catch(e){}W.opening=true;try{go('c')}finally{W.opening=false}if(isTab()&&!inRoom()&&!document.querySelector('.sl'))mine()}}catch(e){}}
function claim(){tame();try{if(typeof rCinema!=='function')return false;if(rCinema.__sln3)return true;
 const prev=rCinema;const ours=function(){if(inRoom()){if(window.SLR3&&SLR3.ok()){/* Page rendering never leaves the voice room. */closeAll(true);document.body.classList.remove('sl-on');return SLR3.mount()}return prev.apply(this,arguments)}/* The minimised salon owns its media and voice. */return mine()};ours.__sln3=1;rCinema=ours;window.rCinema=ours;
 try{if(typeof exitRoom==='function'&&!exitRoom.__sln3){const ex=exitRoom;const w=function(){const lc=(()=>{try{return CID}catch(e){return null}})();const r=ex.apply(this,arguments);leftSalon(lc);try{CV='home'}catch(e){}closeAll(true);if(isTab()){mine();const top=()=>{try{const h=host();if(h)h.scrollTop=0;document.querySelectorAll('.sl,.sl-body').forEach(n=>{n.scrollTop=0});window.scrollTo(0,0);document.scrollingElement&&(document.scrollingElement.scrollTop=0)}catch(e){}};top();requestAnimationFrame(top);setTimeout(top,250)}return r};w.__sln3=1;exitRoom=w;window.exitRoom=w}}catch(e){}
 return true}catch(e){return false}}
const iv=setInterval(()=>{if(claim()){clearInterval(iv)}},200);setTimeout(()=>clearInterval(iv),20000);
setTimeout(()=>{try{rCinema.__sln3=0}catch(e){}claim();if(isTab()&&!inRoom())mine()},0);
/* the native app part may wrap the cinema tab again later (after sign-in): take it back whenever that happens */
setInterval(()=>{try{tame();if(isTab()&&!inRoom()&&document.querySelector('.wk-cinema-lobby'))mine();const lost=typeof rCinema==='function'&&!rCinema.__sln3,exLost=typeof exitRoom==='function'&&!exitRoom.__sln3;
 if(lost||exLost){if(lost)rCinema.__sln3=0;claim();if(exLost){const ex=exitRoom;const w=function(){const lc=(()=>{try{return CID}catch(e){return null}})();const r=ex.apply(this,arguments);leftSalon(lc);try{CV='home'}catch(e){}closeAll(true);if(isTab()){mine();const top=()=>{try{const h=host();if(h)h.scrollTop=0;document.querySelectorAll('.sl,.sl-body').forEach(n=>{n.scrollTop=0});window.scrollTo(0,0);document.scrollingElement&&(document.scrollingElement.scrollTop=0)}catch(e){}};top();requestAnimationFrame(top);setTimeout(top,250)}return r};w.__sln3=1;exitRoom=w;window.exitRoom=w}
  if(lost&&isTab()&&!inRoom()&&!document.querySelector('.sl'))mine()}}catch(e){}},1000);
const v0=()=>{const v=host();if(v&&v!==bound){bound=v;bindTab(v);ytPull(v)}};setInterval(v0,1000);v0();
try{new MutationObserver(()=>{if(!isTab())document.body.classList.remove('sl-on');v0()}).observe(document.getElementById('view')||document.body,{childList:true})}catch(e){}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&isTab()&&!inRoom()&&!STACK.length)load()});
window.SLN3_PAGES=window.SLN3_PAGES||{};
async function warm(){style();await load();const pane=window.WakhanPages?.pane('c:lobby');if(!pane||isTab())return;pane.innerHTML=page();bindTab(pane)}
try{if(typeof wmcFinishMedia==='function'&&!window.__slLoop){window.__slLoop=1;const fin=wmcFinishMedia;wmcFinishMedia=async function(player,vid){const r=await fin.apply(this,arguments);try{const d=Number(player?.getDuration?.()??player?.duration),v=vid||CS?.vid;setTimeout(()=>{try{if(!CS||!CID||!CS.playing||CS.mine<0||!v||CS.vid!==v||!(d>0)||cExp()<d-1.5)return;api('/api/c/'+encodeURIComponent(CID),{a:'seek',t:0,vid:v}).then(j=>{if(j&&j.ok&&CS&&CS.vid===v)cinSet(j)}).catch(()=>{})}catch(e){}},800)}catch(e){}return r}}}catch(e){}window.SLN3={ytOpen(v){if(!v||!v.id)return;const d=YT.data||(YT.data={});d.shelf=[v,...(d.shelf||[]).filter(x=>x&&x.id!==v.id)];return openYtv(v.id)},warm,reload:load,photoError,updateProfile,refreshProfiles,enter,create,join,tx,esc,sv,style,push,sheet,photo,wide,call};
})();

;(()=>{'use strict';if(window.__slKinoDark)return;window.__slKinoDark=1;try{
const K='html[data-wkt=free_light] #nav',N='html[data-wkt=free_light] body:not([data-wm72-tab=c]) #nav';
const fix=()=>{const e=document.getElementById('wkt-css');if(e&&e.textContent.indexOf(K)>=0)e.textContent=e.textContent.split(K).join(N)};
fix();setTimeout(fix,1200);setTimeout(fix,5000);
const D='html[data-wkt=free_light] body[data-wm72-tab=c]';
const st=document.createElement('style');st.id='sl-kino-dark';
st.textContent=D+'{--wk-bg:#10091C;--wk-surface:#1E1232;--wk-surface2:#302047;--wk-border:#68449A;--wk-text:#F2F7FF;--wk-text2:#C8B6E3;--wk-accent:#9E6FFF;--wk-on-accent:#140820;--wk-accent2:#9E6FFF;--wk-disabled:#5B4A72;--wk-nav:#150C25;--wk-xp-track:#42305D;--wk-xp-fill:#AB74FF;--wk-glow:#A855F7;--wk-g1:#9040FF;--wk-g2:#5B21B6;--wk-shadow:0 8px 24px rgba(0,0,0,.35);color-scheme:dark;background:#10091C!important;color:#F2F7FF}'+
 D+' .sl,'+D+' .slp,'+D+' .sl-sh{--s-acc:color-mix(in srgb,#9E6FFF 46%,#fff);--s-onacc:#1B0F2E;--s-teal:#5FE0C8;--s-rose:#FF8FA3;--s-gold:#F2C46B}'+
 D+' .tk.music .st,'+D+' .tk.music small{color:#FF9AD5}'+D+' .tk.music .st b{color:#FFB5E1}'+D+' .tk.talk .st b{color:#9FF3E2}';
(document.head||document.documentElement).appendChild(st)}catch(e){}})();


