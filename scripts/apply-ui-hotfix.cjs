// Apply the reviewed chat and navigation changes to the existing native bundle.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ast=require('./ui-hotfix/js_ast_tools.cjs');
const Module=require('node:module'),parser=new Module('hotfix-parser');parser._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],'hotfix-parser');
const read=p=>fs.readFileSync(path.join(__dirname,'ui-hotfix',p),'utf8');
function chat(source){
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
 const engine=bundle.programs.find(p=>p.id==='community70_chat.js');engine.code=patchFunctions(engine.code,'chat/engine-functions.js','wm70PollDM');
 const voice=bundle.programs[9];voice.code=ast.replace(voice.code,'vcMute',read('performance/microphone-function.js').trim(),'assignment');
 if(voice.code.includes('function wmqNotifyMute('))voice.code=ast.replace(voice.code,'wmqNotifyMute',read('performance/mute-sync.js').trim(),'declaration');else voice.code+='\n'+read('performance/mute-sync.js');
 const hall=bundle.programs.find(p=>p.id==='hall2.js');hall.code=patchFunctions(hall.code,'hall/royal-functions.js','paintSeats');
 if(!hall.code.includes('setSeats:royalSetSeats'))hall.code=hall.code.replace('const api_={','const api_={setSeats:royalSetSeats,royalBackground,stop:royalStop,');
 const settings=ast.find(hall.code,'settingsHtml','declaration');let html=hall.code.slice(settings.start,settings.end);
 if(!html.includes('royalLayoutSettings()'))html=html.replace('<section class="h2-sh h2-set"><h3>${esc(tx(\'settings\'))}</h3>','<section class="h2-sh h2-set"><div class="h4-sh-head"><button type="button" onclick="closeSheet()" aria-label="${esc(royalWords(\'close\'))}">‹</button><h3>${esc(tx(\'settings\'))}</h3><span></span></div>${royalLayoutSettings()}');
 hall.code=hall.code.slice(0,settings.start)+html+hall.code.slice(settings.end);
 const marker='/* WAKHAN_ROYAL_STYLE_V1 */';if(hall.code.includes(marker))hall.code=hall.code.slice(0,hall.code.indexOf(marker));
 hall.code+='\n'+marker+'\n(()=>{const css=document.createElement("style");css.id="h4-royal";css.textContent='+JSON.stringify(read('hall/royal.css'))+';document.head.append(css)})();\n';
 const profile=bundle.programs.find(p=>p.id==='profile30.js');
 const top='<main class="wn-page wt-me">';
 if(!profile.code.includes('wk-profile-top'))profile.code=profile.code.replace(top,top+'<div class="wk-profile-top"><button type="button" onclick="go(\'h\')" aria-label="${esc(document.documentElement.lang.startsWith(\'fa\')?\'برگشت\':\'Back\')}">‹</button><b>${esc(t.profile||\'Wakhan\')}</b><button type="button" onclick="WAKHAN_NATIVE_N1.settings()" aria-label="${esc(WAKHAN_NATIVE_N1.accountLabel)}">⚙</button></div>');
 const last=bundle.programs[bundle.programs.length-1],productMarker='/* WAKHAN_NATIVE_PRODUCT_UI */';
 if(last.code.includes(productMarker))last.code=last.code.slice(0,last.code.indexOf(productMarker));
 last.code+='\n'+productMarker+'\n'+read('product-ui.js');
 const admin=bundle.programs.find(p=>p.id==='inline-28.js');
 const heading='<div class="op31-heading">${op31Icon()}';
 if(admin.code.includes(heading))admin.code=admin.code.replace(heading,'<div class="op31-heading"><button type="button" class="op31-back" onclick="go(\'m\')" aria-label="${LG===\'fa\'?\'برگشت\':LG===\'ps\'?\'شاته\':\'Back\'}">‹</button>');
 const rawError="OP31.error=op31T(j?.err||'error');";
 admin.code=admin.code.replace(rawError,"OP31.error=op31T(Object.prototype.hasOwnProperty.call(OPS31_COPY.en,j?.err)?j.err:'error');");
 admin.code=admin.code.replace("Object.hasOwn(OPS31_COPY.en,j?.err)","Object.prototype.hasOwnProperty.call(OPS31_COPY.en,j?.err)");
 for(const program of bundle.programs)new vm.Script(program.code,{filename:program.id});
 fs.writeFileSync(file,JSON.stringify(bundle));
 const release=path.join(path.dirname(file),'wakhan-release.json');
 if(fs.existsSync(release)){const meta=JSON.parse(fs.readFileSync(release,'utf8'));meta.shell_sha256=require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex');fs.writeFileSync(release,JSON.stringify(meta,null,2)+'\n')}
 console.log('PATCHED',file);
}
