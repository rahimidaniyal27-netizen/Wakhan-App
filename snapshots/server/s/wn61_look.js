/* Mini App appearance only. No source, playback, group-call or role hooks. */
const WN61_TEXT={
 fa:{"colors":"رنگ و ظاهر","choose":"رنگ دلخواهت ره انتخاب کو","custom":"رنگ دلخواهت","motion":"حرکت آیکن‌های سه‌بعدی","on":"روشن","off":"خاموش","hint":"انتخابت برای دفعهٔ بعد هم ثبت می‌مانه."},
 ps:{colors:'رنګ او بڼه',choose:'خپل خوښ رنګ وټاکئ',custom:'خپل رنګ',motion:'د درې‌بعدي نښو حرکت',on:'روښانه',off:'بند',hint:'ستاسو ټاکنه د بل ځل لپاره خوندي کېږي.'},
 en:{colors:'Colors & appearance',choose:'Make it your color',custom:'Custom accent',motion:'Animated 3D icons',on:'On',off:'Off',hint:'Your choice is saved for your next visit.'}
};
const WN61_PALETTE=['--bg','--bg2','--card','--card2','--ln','--txt','--mut','--a1','--a2','--a3','--ok','--bad','--sh'];
function wn61T(key){return(WN61_TEXT[LG]||WN61_TEXT.fa)[key]||key}
function wn61ThemeKey(value){
 if(value==='dawn')return'light';if(value==='shab')return'saffron';
 if(THEMES.some(item=>item[0]===value))return value;
 const previous=load('th');return THEMES.some(item=>item[0]===previous)?previous:'shahi';
}
function wn61ApplyTheme(value){
 const chosen=wn61ThemeKey(value),body=document.body;
 // Sample the actual original theme while the Orbit60 override is absent.
 delete body.dataset.wnTheme;for(const name of WN61_PALETTE)body.style.removeProperty(name);
 wnLegacyApplyTheme(chosen);
 const native=getComputedStyle(body),palette={};for(const name of WN61_PALETTE)palette[name]=native.getPropertyValue(name).trim();
 body.dataset.wnTheme=chosen;
 for(const[name,color]of Object.entries(palette))if(color)body.style.setProperty(name,color);
 let custom=null;try{custom=JSON.parse(load('wn61_custom')||'null')}catch(error){}
 if(custom&&custom.theme===chosen&&/^#[0-9a-f]{6}$/i.test(custom.color||'')){
  body.style.setProperty('--a1',custom.color);body.style.setProperty('--a2',custom.color);
 }
 body.style.setProperty('--wn-soft','color-mix(in srgb,var(--a1) 18%,transparent)');body.style.setProperty('--wn-accent-ink','#fff');
 WN60.theme=chosen;
 try{tg?.setHeaderColor?.(palette['--bg']);tg?.setBackgroundColor?.(palette['--bg']);tg?.setBottomBarColor?.(palette['--bg'])}catch(error){}
}
applyTheme=wn61ApplyTheme;wnApplyTheme=wn61ApplyTheme;
for(const[key,names]of THEMES)for(const[language,index]of [['fa',0],['ps',1],['en',2]])WN60_COPY[language][key]=names[index];
themeSheet=function(){
 const index=LG==='ps'?1:LG==='en'?2:0,accent=getComputedStyle(document.body).getPropertyValue('--a1').trim(),hex=/^#[0-9a-f]{6}$/i.test(accent)?accent:'#4688ff';
 sheet(`<section class="wn61-colors"><h3>${wnIcon('settings')}${h(wn61T('colors'))}</h3><p>${h(wn61T('choose'))}</p><div class="wn61-swatches">${THEMES.map(([key,names,first,second])=>`<button type="button" class="wn61-swatch ${key===WN60.theme?'on':''}" style="--sw1:${first};--sw2:${second}" onclick="setTheme('${key}')" aria-pressed="${key===WN60.theme}"><span class="wn61-color-orb">${key===WN60.theme?'✓':''}</span><b>${h(names[index])}</b></button>`).join('')}</div><label class="wn61-custom"><span>${wnIcon('edit')}${h(wn61T('custom'))}</span><input aria-label="${h(wn61T('custom'))}" type="color" value="${hex}" onchange="wn61CustomColor(this.value)"></label><button type="button" class="wn61-motion" onclick="wn61ToggleMotion()" aria-pressed="${WN61_EMOJI.motion}"><span>${wnIcon('headphones')}${h(wn61T('motion'))}</span><b>${h(wn61T(WN61_EMOJI.motion?'on':'off'))}</b></button><small>${h(wn61T('hint'))}</small></section>`);
};
setTheme=function(value){store('wn61_custom',null);wn61ApplyTheme(value);store('wn_theme61',WN60.theme);store('wn_theme60',WN60.theme);store('th',TH);themeSheet();if(TAB==='m'&&ME)rMe();hap()};
function wn61CustomColor(color){if(!/^#[0-9a-f]{6}$/i.test(color))return;store('wn61_custom',JSON.stringify({theme:WN60.theme,color}));wn61ApplyTheme(WN60.theme);themeSheet();hap()}
function wn61ToggleMotion(){WN61_EMOJI.motion=!WN61_EMOJI.motion;store('wn61_motion',WN61_EMOJI.motion?'on':'off');wn61Wake();themeSheet()}
function wn61Appearance(){
 const logo=document.getElementById('wm-music-brand-v1');
 if(logo){logo.innerHTML='<img class="lg" src="/s/wn61_logo.svg?v=61" width="40" height="40" alt="Wakhan Music">';logo.classList.add('wn61-original-logo')}
 const header=document.querySelector('header');
 if(header&&!document.getElementById('wn61-theme-button')){
  const button=document.createElement('button');button.id='wn61-theme-button';button.className='wn61-theme-button';button.type='button';button.setAttribute('aria-label',wn61T('colors'));button.onclick=()=>themeSheet();button.innerHTML='<span class="wn61-palette-dot"></span>';
  const language=header.querySelector('.lgp');if(language)header.insertBefore(button,language);else header.appendChild(button);
 }
 wn61ApplyTheme(load('wn_theme61')||load('wn_theme60')||load('th')||TH);wn61StartMotion();if(ME)render();
}
wn61Appearance();
