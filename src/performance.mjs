/* Rendering changes depend on actual device RAM or the user's reduced-motion setting. */
export function installPerformanceMode({device,document=globalThis.document,navigator=globalThis.navigator,matchMedia=globalThis.matchMedia,storage=globalThis.localStorage}){
 const reduced=!!matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const memory=Number(device?.totalRamBytes)>0?Number(device.totalRamBytes)/(1024**3):Number(navigator?.deviceMemory)||0;
 let preference='auto';try{const saved=storage?.getItem('wk_render_preference');if(['auto','lite','full'].includes(saved))preference=saved}catch{}
 const automatic=!!device?.lowRam||(memory>0&&memory<=4.1)||reduced;
 const state={economy:false,lowData:false,preference,ramGiB:memory?Math.round(memory*10)/10:null,reducedMotion:reduced};
 const apply=()=>{
  state.economy=reduced||preference==='lite'||(preference==='auto'&&automatic);
  state.lowData=preference==='lite'||navigator?.connection?.saveData===true||['slow-2g','2g'].includes(navigator?.connection?.effectiveType);
  state.preference=preference;document.documentElement.classList.toggle('wk-economy',state.economy);
 };
 apply();
 if(!document.getElementById('wk-economy-css')){
  const style=document.createElement('style');style.id='wk-economy-css';
  style.textContent=`html.wk-economy .wm72-photo,html.wk-economy .wm72-photo>img,html.wk-economy .wn-hero-art,html.wk-economy .vinyl,html.wk-economy #vin{animation:none!important}
html.wk-economy #nav,html.wk-economy .c3-head,html.wk-economy .dt-head,html.wk-economy .h2-dock,html.wk-economy .wn-top{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
html.wk-economy .wm72-photo,html.wk-economy .wn-hero-art{filter:none!important}
html.wk-economy{scroll-behavior:auto!important}`;
  document.head.append(style);
 }
 state.setPreference=value=>{
  if(!['auto','lite','full'].includes(value))throw Error('invalid_render_preference');
  preference=value;try{storage?.setItem('wk_render_preference',value)}catch{}apply();
 };
 state.settingsButton=()=>{
  const lang=(document.documentElement.lang||'en').slice(0,2);
  const texts={fa:['ظاهر و مصرف','خودکار','سبک و کم‌مصرف','جلوه‌های کامل','در حالت سبک، جلوه‌ها کمتر و پیام‌های صوتی با انتخاب خودت دریافت می‌شوند.'],ps:['بڼه او مصرف','خپله','سپک او کم مصرف','ټولې اغېزې','په سپک حالت کې اغېزې لږې وي او غږیز پیغامونه په ټاکلو ترلاسه کېږي.'],en:['Appearance and data','Automatic','Light and low data','Full effects','Light mode reduces effects and downloads voice messages when you select them.']}[lang]||['Appearance and data','Automatic','Light and low data','Full effects','Light mode reduces effects and downloads voice messages when you select them.'];
  const section=document.createElement('section');section.className='wka-performance';section.style.cssText='margin-block:10px;padding:12px 16px;border-radius:14px;border:1px solid var(--ln,#ffffff20);background:var(--card2,#ffffff08)';
  const label=document.createElement('label');label.textContent=texts[0];
  const select=document.createElement('select');select.setAttribute('aria-label',texts[0]);select.style.cssText='display:block;width:100%;min-height:44px;margin-top:8px;border-radius:10px;padding:8px;background:var(--bg2,#171327);color:inherit;font:inherit';
  for(const [index,value]of ['auto','lite','full'].entries()){const option=document.createElement('option');option.value=value;option.textContent=texts[index+1];select.append(option)}
  select.value=preference;select.onchange=()=>state.setPreference(select.value);label.append(select);
  const description=document.createElement('p');description.textContent=texts[4];description.style.cssText='font-size:12px;line-height:1.6;opacity:.7;margin-bottom:0';section.append(label,description);return section;
 };
 return state;
}
