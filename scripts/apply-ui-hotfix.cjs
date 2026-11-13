// Apply the reviewed chat and navigation changes to the existing native bundle.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ast=require('./ui-hotfix/js_ast_tools.cjs');
const Module=require('node:module'),parser=new Module('hotfix-parser');parser._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],'hotfix-parser');
const read=p=>fs.readFileSync(path.join(__dirname,'ui-hotfix',p),'utf8');
function chat(source){
 for(const name of ['scheduleThreadBottom','bindThreadScroll','activateThreadLatest']){try{const n=ast.find(source,name,'declaration');source=source.slice(0,n.start).trimEnd()+'\n'+source.slice(n.end).trimStart()}catch(error){if(!error.message.endsWith(': 0'))throw error}}
 let extra='';
 for(const file of ['chat/thread-functions.js','chat/media-functions.js']){
  const patches=read(file);
  for(const node of parser.exports.parse(patches,{ecmaVersion:'latest'}).body){
   if(node.type!=='FunctionDeclaration')throw Error('Unexpected patch');
   const code=patches.slice(node.start,node.end);
   try{source=ast.replace(source,node.id.name,code,'declaration')}
   catch(error){if(!error.message.endsWith(': 0'))throw error;extra+=code+'\n'}
  }
 }
 const at=ast.find(source,'chatText','declaration').start;
 return source.slice(0,at)+extra+source.slice(at);
}
function patchFunctions(source,file,anchor){
 const patches=read(file);let extra='';
 for(const node of parser.exports.parse(patches,{ecmaVersion:'latest'}).body){
  if(node.type!=='FunctionDeclaration')throw Error('Unexpected function patch');
  const code=patches.slice(node.start,node.end);
  try{source=ast.replace(source,node.id.name,code,'declaration')}
  catch(error){if(!error.message.endsWith(': 0'))throw error;extra+=code+'\n'}
 }
 if(extra){const at=ast.find(source,anchor,'declaration').start;source=source.slice(0,at)+extra+source.slice(at)}
 return source;
}
for(const name of process.argv.slice(2)){
 const file=path.resolve(name),bundle=JSON.parse(fs.readFileSync(file,'utf8'));
 if(bundle.programs.length!==76)throw Error('Unexpected module count');
 const nav=bundle.programs.find(p=>p.id==='search76.js'),thread=bundle.programs.find(p=>p.id==='chat2.js');
 if(!nav||!thread)throw Error('Missing UI modules');
 nav.code=ast.replace(nav.code,'renderNav',read('performance/nav-render-function.js').trim(),'assignment');
 thread.code=chat(thread.code);
 thread.code=thread.code.replace("if(saved)requestAnimationFrame(()=>{const out=$('wm70-dm-messages');if(out&&Number(WM70.peer)===peer)out.scrollTop=saved.scroll})","activateThreadLatest()");
 if(!thread.code.includes('latest:activateThreadLatest'))thread.code=thread.code.replace('window.C2={','window.C2={latest:activateThreadLatest,');
 const chatKb=ast.find(thread.code,'kb','declaration');let chatLayout=thread.code.slice(chatKb.start,chatKb.end);
 chatLayout=chatLayout.replace("if(o)requestAnimationFrame(()=>{o.scrollTop=o.scrollHeight})","if(o&&S.followBottom!==false)scheduleThreadBottom()");
 chatLayout=chatLayout.replace('window.__h2vv||window.visualViewport','window.__h2vv||window.WakhanKeyboard?.viewport()||window.visualViewport');
 thread.code=thread.code.slice(0,chatKb.start)+chatLayout+thread.code.slice(chatKb.end);

 const engine=bundle.programs.find(p=>p.id==='community70_chat.js');engine.code=patchFunctions(engine.code,'chat/engine-functions.js','wm70PollDM');
 const voice=bundle.programs[9];voice.code=ast.replace(voice.code,'vcMute',read('performance/microphone-function.js').trim(),'assignment');
 if(voice.code.includes('function wmqNotifyMute('))voice.code=ast.replace(voice.code,'wmqNotifyMute',read('performance/mute-sync.js').trim(),'declaration');else voice.code+='\n'+read('performance/mute-sync.js');
 const meters=bundle.programs.find(p=>p.id==='voice2.js'),meterMarker='/* Speaking indicators share one bounded visual sampler; media tracks are unchanged. */';
 if(!meters.code.includes(meterMarker))throw Error('Missing bounded audio sampler');
 meters.code=meters.code.slice(0,meters.code.indexOf(meterMarker)).trimEnd()+'\n'+read('performance/voice-meters.js');
 const peer=bundle.programs.find(p=>p.id==='inline-03.js');peer.code=patchFunctions(peer.code,'performance/audio-receive.js','vcPc');
 const hall=bundle.programs.find(p=>p.id==='hall2.js');
 // Canonicalize helper placement so a fresh build and a previously patched
 // working copy produce identical assets, even when new helpers were added.
 for(const node of parser.exports.parse(read('hall/royal-functions.js'),{ecmaVersion:'latest'}).body){
  if(node.id?.name==='paintSeats')continue;
  try{const old=ast.find(hall.code,node.id.name,'declaration');hall.code=hall.code.slice(0,old.start).trimEnd()+'\n'+hall.code.slice(old.end).trimStart()}
  catch(error){if(!error.message.endsWith(': 0'))throw error}
 }
 hall.code=patchFunctions(hall.code,'hall/royal-functions.js','paintSeats');
 hall.code=ast.replace(hall.code,'type',"function type(){if(!seated())return say(tx('sitToChat'));const i=$('wm70-room-text');if(i&&!i.disabled){i.focus({preventScroll:true});kb()}}",'declaration');
 hall.code=ast.replace(hall.code,'go','function(k,sub){return royalNavigate(k,sub)}','assignment');
 const cssChanges=[];
 ast.walk(parser.exports.parse(hall.code,{ecmaVersion:'latest'}),node=>{
  if(node.type==='AssignmentExpression'&&node.left?.type==='MemberExpression'&&node.left.property?.name==='textContent'&&typeof node.right.value==='string'){
   const value=node.right.value;
   if(value.includes('.h2')&&!value.includes('Keyboard opens a transparent'))cssChanges.push({start:node.right.start,end:node.right.end,value:JSON.stringify(value.replaceAll('.is-typing','.is-legacy-typing').replace(/@media\s*\(max-height:\s*(\d+)px\)/g,'@container wk-hall (max-height:$1px)'))});
  }
 });
 for(const change of cssChanges.sort((a,b)=>b.start-a.start))hall.code=hall.code.slice(0,change.start)+change.value+hall.code.slice(change.end);
 if(!hall.code.includes('setSeats:royalSetSeats'))hall.code=hall.code.replace('const api_={','const api_={reveal:royalReveal,setSeats:royalSetSeats,royalBackground,stop:royalStop,');
 if(!hall.code.includes('reveal:royalReveal'))hall.code=hall.code.replace('const api_={','const api_={reveal:royalReveal,');
 hall.code=hall.code.replace(',bgPick,bgReset,',',bgPick:royalBackground,bgReset:()=>royalBackground(true),');
 const settings=ast.find(hall.code,'settingsHtml','declaration');let html=hall.code.slice(settings.start,settings.end);
 if(!html.includes('royalLayoutSettings()'))html=html.replace('<section class="h2-sh h2-set"><h3>${esc(tx(\'settings\'))}</h3>','<section class="h2-sh h2-set"><div class="h4-sh-head"><button type="button" onclick="closeSheet()" aria-label="${esc(royalWords(\'close\'))}">‹</button><h3>${esc(tx(\'settings\'))}</h3><span></span></div>${royalLayoutSettings()}');
 const oldBackground=html.indexOf('<div class="h2-card"><div class="h2-ch"><span>${ic(\'palette\')}');
 if(oldBackground>=0){const following=html.indexOf('<div class="h2-card"><div class="h2-ch"><span>${ic(\'user\')}',oldBackground);if(following<0)throw Error('Background settings boundary changed');html=html.slice(0,oldBackground)+html.slice(following)}
 hall.code=hall.code.slice(0,settings.start)+html+hall.code.slice(settings.end);
 const marker='/* WAKHAN_ROYAL_STYLE_V1 */';if(hall.code.includes(marker))hall.code=hall.code.slice(0,hall.code.indexOf(marker));hall.code=hall.code.trimEnd();
 hall.code+='\n'+marker+'\n(()=>{const css=document.createElement("style");css.id="h4-royal";css.textContent='+JSON.stringify(read('hall/royal.css'))+';document.head.append(css)})();\n';
 // Gallery candidates must never inherit the viewer's currently worn frame.
 for(const module of ['community70_profile.js','profile77.js','halo35.js']){
  const gallery=bundle.programs.find(p=>p.id===module);
  gallery.code=gallery.code.replaceAll('wm70Avatar({...WM70.self,halo:','wm70Avatar({...WM70.self,frame_style:null,halo:').replaceAll('wm70Avatar({...me,halo:','wm70Avatar({...me,frame_style:null,halo:');
 }
 const roomChat=bundle.programs.find(p=>p.id==='community70_hall.js');roomChat.code=patchFunctions(roomChat.code,'hall/chat-poll.js','wm70PollHall');
 const haloFx=bundle.programs.find(p=>p.id==='halo35.js');
 const previousBudgetStart=haloFx.code.indexOf('/* WAKHAN_HALO_BUDGET */');
 if(previousBudgetStart<0){
  haloFx.code=haloFx.code.replace('let raf=0,t0=performance.now();','let raf=0,t0=performance.now();');
  haloFx.code=haloFx.code.replace('e.isIntersecting?vis.add(e.target):vis.delete(e.target)','e.isIntersecting?vis.add(e.target):vis.delete(e.target);kick()');
  haloFx.code=haloFx.code.replace('function frame(now){raf=0;','function frame(now){raf=0;if(document.visibilityState===\'hidden\')return;');
  haloFx.code=haloFx.code.replace('if(!vis.has(c))continue;any=true;',"if(!vis.has(c)||c.closest('[data-wk-overlay-covered],[hidden],[inert]'))continue;any=true;if(c.__drawn&&now-(c.__lastDraw||0)<(window.WakhanRenderMode?.economy?200:65))continue;c.__lastDraw=now;");
  haloFx.code=haloFx.code.replace('if(any||nodes.size)raf=requestAnimationFrame(frame)','if(any)raf=requestAnimationFrame(frame)');
  haloFx.code=haloFx.code.replace('new MutationObserver(()=>scan()).observe',"let scanPending=false;new MutationObserver(()=>{if(!scanPending){scanPending=true;requestAnimationFrame(()=>{scanPending=false;scan()})}}).observe");
  haloFx.code=haloFx.code.replace('function kick(){if(!raf)raf=requestAnimationFrame(frame)}',"function kick(){if(!raf)raf=requestAnimationFrame(frame)}document.addEventListener('visibilitychange',kick);document.addEventListener('wk-overlay-changed',kick);");
  haloFx.code+='\n/* WAKHAN_HALO_BUDGET */';
 }
 const profile=bundle.programs.find(p=>p.id==='profile30.js');
 const top='<main class="wn-page wt-me">';
 if(!profile.code.includes('wk-profile-top'))profile.code=profile.code.replace(top,top+'<div class="wk-profile-top"><button type="button" onclick="go(\'h\')" aria-label="${esc(document.documentElement.lang.startsWith(\'fa\')?\'برگشت\':\'Back\')}">‹</button><b>${esc(t.profile||\'Wakhan\')}</b><button type="button" onclick="WAKHAN_NATIVE_N1.settings()" aria-label="${esc(WAKHAN_NATIVE_N1.accountLabel)}">⚙</button></div>');
 profile.code=profile.code.replace('Personal player & cinema, unlimited','Exclusive frames & VIP badge').replace('پلیر و سینمای شخصی، بدون محدودیت','قاب اختصاصی و نشان VIP').replace('شخصي پلیر او سینما','ځانګړي چوکاټونه او VIP نښه');
 profile.code=profile.code.replace('t.halos,"wm70Edit(\'halos\')"','t.halos,"(AF24.data?.role?af24Open():wm70Edit(\'halos\'))"');
 profile.code=profile.code.replace(/<button type="button" onclick="go\('h'\)" aria-label="\$\{esc\(document.documentElement.lang.startsWith\('fa'\)\?'برگشت':'Back'\)\}">‹<\/button>/,'<span aria-hidden="true"></span>');
 // A photo-edit thumbnail is the photo alone, without the worn frame or presence dot.
 profile.code=profile.code.replaceAll('wm70Avatar({...p,halo:null})','wm70Avatar({...p,halo:null,frame_style:null,online:false,avatar_preview:true})');
 const frames=bundle.programs.find(p=>p.id==='inline-22.js');
 frames.code=ast.replace(frames.code,'af24Add',"function af24Add(){return af24Staff(String(document.getElementById('af24-staff-uid')?.value||'').trim(),true)}",'declaration');
 frames.code=frames.code.replace('uid:Number(AF24.target)','uid:AF24.target').replace('AF24.target=wpDigits(document.getElementById(\'af24-target\')?.value||\'\')','AF24.target=String(document.getElementById(\'af24-target\')?.value||\'\').trim()');
 frames.code=frames.code.replaceAll('${v.id}</bdi>','${v.public_id||v.id}</bdi>').replaceAll('${g.recipient.id}</bdi>','${g.recipient.public_id||g.recipient.id}</bdi>').replaceAll('${AF24.quote.recipient.id}</bdi>','${AF24.quote.recipient.public_id||AF24.quote.recipient.id}</bdi>');
 frames.code=frames.code.replaceAll('Bot creator','Wakhan creator').replaceAll('Only the bot creator can do this.','Only the Wakhan creator can do this.').replaceAll('This account must start the bot first.','This person needs a Wakhan account.').replaceAll('The recipient must have started the bot.','The recipient needs a Wakhan account.').replaceAll('Numeric ID','Wakhan ID or @username').replaceAll('سازندهٔ ربات','سازندهٔ واخان').replaceAll('inputmode="numeric" dir="ltr"','inputmode="text" dir="ltr"');
 const finance=bundle.programs.find(p=>p.id==='inline-07.js');finance.code=finance.code.replace('${h(s.id)}</bdi>','${h(s.public_id||s.id)}</bdi>');
 if(!frames.code.includes('AF24_COPY.en.vip='))frames.code+='\nAF24_COPY.en.vip="VIP member";AF24_COPY.fa.vip="همراه VIP";AF24_COPY.ps.vip="VIP غړی";';
 frames.code=frames.code.replace('await wiRefresh()})','await wiRefresh();await wm70Load();if(TAB===\'m\')rMe();if(TAB===\'c\')drawHall()})');
 const identity=bundle.programs.find(p=>p.id==='inline-08.js');
 if(!identity.code.includes('words.personal_6='))identity.code+='\nfor(const words of Object.values(WI_COPY)){words.personal_6=words.personal_3}';
 // The old polling fallback could decorate a modal backdrop as a page and
 // repeatedly measure every panel. Current surfaces have explicit back controls.
 const compatibility=bundle.programs.find(p=>p.id==='native-n1-features.js');
 compatibility.code=compatibility.code.replace('setInterval(ensureBackButtons, 700);','/* Back controls are supplied by the current surface headers. */');
 compatibility.code=compatibility.code.replace("el.id === 'nav' || el.tagName === 'HEADER'","el.id === 'nav' || el.id === 'ov' || el.id === 'view' || el.inert || el.tagName === 'HEADER'");
 const last=bundle.programs[bundle.programs.length-1],productMarker='/* WAKHAN_NATIVE_PRODUCT_UI */';
 if(last.code.includes(productMarker))last.code=last.code.slice(0,last.code.indexOf(productMarker));last.code=last.code.trimEnd();
 last.code+='\n'+productMarker+'\n'+read('product-ui.js')+'\n'+read('cinema-lobby.js')+'\n'+read('fullscreen-ui.js')+'\n'+read('commerce-ui.js')+'\nif(!window.__wkVoiceAudioUnlock){window.__wkVoiceAudioUnlock=true;document.addEventListener("pointerdown",()=>{if(typeof wmqResumeVoiceAudio==="function")wmqResumeVoiceAudio()},{capture:true,passive:true})}';
 const admin=bundle.programs.find(p=>p.id==='inline-28.js');
 const heading='<div class="op31-heading">${op31Icon()}';
 if(admin.code.includes(heading))admin.code=admin.code.replace(heading,'<div class="op31-heading"><button type="button" class="op31-back" onclick="go(\'m\')" aria-label="${LG===\'fa\'?\'برگشت\':LG===\'ps\'?\'شاته\':\'Back\'}">‹</button>');
 profile.code=profile.code.replace('>⚙</button>',"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"m9.5 3-.6 2.1-2 .9-2-.5-2.4 4.1 1.5 1.6v2L2.5 15l2.4 4.1 2-.5 2 .9.6 2.1h5l.6-2.1 2-.9 2 .5 2.4-4.1-1.5-1.6v-2l1.5-1.6L19.6 5l-2 .5-2-.9L15 3Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg></button>");
 const rawError="OP31.error=op31T(j?.err||'error');";
 admin.code=admin.code.replace(rawError,"OP31.error=op31T(Object.prototype.hasOwnProperty.call(OPS31_COPY.en,j?.err)?j.err:'error');");
 admin.code=admin.code.replace("Object.hasOwn(OPS31_COPY.en,j?.err)","Object.prototype.hasOwnProperty.call(OPS31_COPY.en,j?.err)");
 // The chosen room name belongs to interface copy. Existing room titles and
 // messages come from the API and are never rewritten.
 const roomBrand=value=>value.replaceAll('سالن','دنج').replaceAll('سالون','دنج');
 for(const program of bundle.programs){program.code=roomBrand(program.code);new vm.Script(program.code,{filename:program.id})}
 fs.writeFileSync(file,JSON.stringify(bundle));
 const release=path.join(path.dirname(file),'wakhan-release.json');
 if(fs.existsSync(release)){const meta=JSON.parse(fs.readFileSync(release,'utf8'));meta.shell_sha256=require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex');fs.writeFileSync(release,JSON.stringify(meta,null,2)+'\n')}
 console.log('PATCHED',file);
}
