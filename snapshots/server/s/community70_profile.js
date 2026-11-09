const wm70OldMe=rMe;
rMe=function(){
 if(SUB?.kind==='details')return wm70OldMe();
 const p=WM70.self||{id:ME?.me?.id,name:ME?.me?.name,avatar:'/ava/'+ME?.me?.id},stats=ME?.stats||{};
 V().innerHTML=`<main class="wn-page wm70-account"><div class="wn-eyebrow">WAKHAN ACCOUNT</div><h1 class="wn-heading">${h(wnT('profile'))}</h1><section class="wn-profile"><div class="wm70-profile-head"><button class="wm70-identity-button" onclick="wm70Edit()">${wm70Avatar(p)}<span><b class="wn-inline" dir="auto">${h(p.name||'Wakhan')}</b><small>ID ${Number(p.id)}</small></span></button><button class="wm70-edit-link" onclick="wm70Edit()">${h(wm70T('edit'))} ‹</button></div><div class="wn-stats"><div><b>${Number(stats.plays)||0}</b><span>${h(t('plays'))}</span></div><div><b>${(ME?.favs||[]).length}</b><span>${h(wnT('favorites'))}</span></div><div><b>${WM70.self?.friends||0}</b><span>${h(wm70T('friends'))}</span></div></div></section>${WM70.error?`<button class="wm70-notice" onclick="wm70Load()">${h(WM70.error)} · ${h(wm70T('retry'))}</button>`:''}<div class="wn-settings-list">${wnSetting('user',wm70T('edit'),'wm70Edit()')}${wnSetting('group',wm70T('friends'),"wm70OpenFriends()")}${wnSetting('wallet',wnT('wallet'),'wc23Open()')}${wnSetting('diamond',wnT('subscription'),"go('s')")}</div>${wnHeading(wnT('appearance'))}<div class="wn-settings-list">${wnSetting('settings',wnT('appearance'),'themeSheet()')}${wnSetting('globe',wnT('language'),'langSheet()')}${wnSetting('help',wnT('help'),'helpSheet()')}${wnSetting('send',wnT('share'),'wnShare()')}</div>${wnStaff()?wnHeading(wnT('operations'))+`<div class="wn-settings-list">${wnSetting('shield',wnT('operations'),'op31Go()')}${WM70.self?.roles?.includes('creator')?wnSetting('crown',wm70T('teamCoins'),'af24Open()'):''}</div>`:''}${ME?.finance?.allowed?`<div class="wn-settings-list">${wnSetting('receipt',wnT('finance'),'wfOpen()')}</div>`:''}<div class="wn-version">WAKHAN · COMMUNITY 70</div></main>`;
 if(!WM70.self&&!WM70.loading&&!WM70.error)wm70Load();
};
af24Mount=function(){document.getElementById('af24-open')?.remove();document.getElementById('p27-frames-open')?.remove()};
p27FramesMount=af24Mount;
function wm70CaptureEdit(){const name=document.getElementById('wm70-name');if(WM70.edit&&name)WM70.edit.name=name.value}
async function wm70Edit(tab='profile'){
 ++WM70.profileSeq;WM70.modal='edit';WM70.editorTab=tab;
 if(!WM70.self){sheet(`<p>${h(wm70T('loading'))}</p>`);await wm70Load();if(WM70.modal!=='edit')return}
 if(!WM70.self)return toast(WM70.error||wm70T('failed'));
 WM70.edit={name:WM70.self.name,rev:WM70.self.rev,photo:null,reset:false};WM70.haloRole=WM70.self.roles?.[0]||'subscriber';wm70EditDraw();
}
function wm70EditorTab(tab){wm70CaptureEdit();WM70.editorTab=tab;wm70EditDraw()}
function wm70EditDraw(){
 if(WM70.modal!=='edit'||!WM70.edit)return;
 const p={...WM70.self,name:WM70.edit.name,avatar:WM70.edit.photo||(WM70.edit.reset?'/ava/'+ME.me.id:WM70.self.avatar)},tab=WM70.editorTab;
 sheet(`<section class="wm70-editor"><div class="wm70-title"><h3>${h(wm70T('edit'))}</h3><button onclick="WM70.modal=null;closeSheet()">×</button></div><div class="wm70-editor-preview">${wm70Avatar(p)}<b class="wn-inline" dir="auto">${h(p.name)}</b></div><div class="wm70-tabs">${[['profile','details'],['halos','halos'],['photo','photo']].map(([key,label])=>`<button class="${key===tab?'on':''}" onclick="wm70EditorTab('${key}')">${h(wm70T(label))}</button>`).join('')}</div>${tab==='halos'?wm70HaloGallery():tab==='photo'?`<div class="wm70-photo-actions"><label class="wn-primary">${h(wm70T('choosePhoto'))}<input type="file" hidden accept="image/*" onchange="wm70ChoosePhoto(this)"></label><button class="wn-secondary" onclick="WM70.edit.photo=null;WM70.edit.reset=true;wm70EditDraw()">${h(wm70T('resetPhoto'))}</button></div>`:`<label class="wm70-field">${h(wm70T('name'))}<input id="wm70-name" value="${h(WM70.edit.name)}" maxlength="48" autocomplete="off" dir="auto"></label><p class="wm70-muted">${h(wm70T('independent'))}</p>`}${tab!=='halos'?`<button class="wn-primary wm70-save" onclick="wm70SaveProfile()" ${WM70.saving?'disabled':''}>${h(wm70T('save'))}</button>`:''}</section>`);
}
function wm70HaloGallery(){
 const own=WM70.self?.halo,role=WM70.haloRole,items=WM70.halos.filter(v=>v.role===role),variant=role==='creator'?'masculine':WM70.haloPreview||own?.variant||'feminine';
 const genders=role==='creator'?'':`<div class="wm70-tabs">${['feminine','masculine'].map(v=>`<button class="${variant===v?'on':''}" onclick="WM70.haloPreview='${v}';wm70EditDraw()">${h(wm70T(v))}</button>`).join('')}</div>`;
 return `<div class="wm70-role-tabs">${['creator','assistant','owner','subscriber'].map(r=>`<button class="${role===r?'on':''}" onclick="WM70.haloRole='${r}';WM70.haloPreview=null;wm70EditDraw()">${h(wm70T(r))}</button>`).join('')}</div>${genders}<button class="wm70-clear-halo" onclick="wm70ChooseHalo('none','')">${h(wm70T('noFrame'))}</button><div class="wm70-halo-gallery">${items.map(item=>`<article class="${item.allowed?'':'locked'}"><div class="wm70-halo-preview">${wm70Avatar({...WM70.self,halo:{...item,variant}})}</div><b>${h(wm70Name(item))}</b>${item.allowed?`<div class="wm70-variant-buttons"><button class="${own?.id===item.id&&own?.variant===variant?'on':''}" onclick="wm70ChooseHalo('${item.id}','${variant}')">${h(wm70T(own?.id===item.id&&own?.variant===variant?'applied':'choose'))}</button></div>`:`<small>${h(wm70T('locked'))} · ${h(wm70T(item.role))}</small>`}</article>`).join('')}</div>`;
}

async function wm70ChooseHalo(halo,variant){
 if(WM70.saving)return;wm70CaptureEdit();WM70.saving=true;
 try{const value=await wm70Request('self',{action:'halo',halo,variant});wm70ApplySelf(value.profile);toast(wm70T('applied'));if(TAB==='m')rMe();wm70EditDraw()}
 catch(error){toast(wm70Error(error))}finally{WM70.saving=false}
}
async function wm70ChoosePhoto(input){
 const file=input.files?.[0],edit=WM70.edit;if(!file||!edit)return;
 if((!file.type.startsWith('image/')||file.type==='image/svg+xml')||file.size>8*1024*1024)return toast(wm70T('photoSize'));
 const url=URL.createObjectURL(file);
 try{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url});if(image.width*image.height>80000000||!image.width||!image.height)throw Error();const paper=document.createElement('canvas');paper.width=paper.height=640;const ctx=paper.getContext('2d'),side=Math.min(image.width,image.height);ctx.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,640,640);if(WM70.edit!==edit||WM70.modal!=='edit')return;edit.photo=paper.toDataURL('image/jpeg',.86);edit.reset=false;wm70EditDraw()}
 catch(error){toast(wm70T('photoSize'))}finally{URL.revokeObjectURL(url)}
}
async function wm70SaveProfile(){
 if(WM70.saving||!WM70.edit)return;wm70CaptureEdit();const draft=WM70.edit;WM70.saving=true;wm70EditDraw();
 try{const result=await wm70Request('self',{action:'save',name:draft.name,rev:draft.rev,...(draft.photo?{avatar:draft.photo}:{}),reset_avatar:draft.reset});wm70ApplySelf(result.profile);if(WM70.edit===draft&&WM70.modal==='edit'){WM70.modal=null;WM70.edit=null;closeSheet()}if(TAB==='m')rMe();toast(wm70T('saved'))}
 catch(error){if(error.message==='stale'){const j=await wm70Request('self').catch(()=>null);if(j)wm70ApplySelf(j.profile)}toast(wm70Error(error))}
 finally{WM70.saving=false;if(WM70.modal==='edit')wm70EditDraw()}
}
function wm70ProfileButtons(p){
 const relation=p.relation,own=Number(p.id)===Number(ME.me.id);
 if(own)return `<button class="wn-primary" onclick="wm70Edit()">${h(wm70T('edit'))}</button>`;
 const room=TAB==='c'&&CID&&CS?.mine>=0&&CS.seats?.some(v=>v&&Number(v.id)===Number(p.id));
 return `<div class="wm70-actions">${relation==='blocked'&&!p.blocked_by_me?`<span>${h(wm70T('blocked'))}</span>`:relation==='blocked'?`<button class="wn-secondary" onclick="wm70Friend('unblock',${Number(p.id)})">${h(wm70T('unblock'))}</button>`:relation==='incoming'?`<button class="wn-primary" onclick="wm70Friend('accept',${Number(p.id)})">${h(wm70T('accept'))}</button><button class="wn-secondary" onclick="wm70Friend('decline',${Number(p.id)})">${h(wm70T('decline'))}</button>`:relation==='none'?`<button class="wn-primary" onclick="wm70Friend('request',${Number(p.id)})">${h(wm70T('add'))}</button>`:relation==='outgoing'?`<button class="wn-secondary" onclick="wm70Friend('cancel',${Number(p.id)})">${h(wm70T('outgoing'))}</button>`:''}<button class="wn-secondary" onclick="wm70OpenDM(${Number(p.id)})">${h(wm70T('chat'))}</button>${room&&relation!=='blocked'?`<button class="wn-primary" onclick="wm70GiftPicker(${Number(p.id)})">${h(wm70T('gift'))}</button>`:''}<button class="wm70-more" onclick="wm70PeerMenu(${Number(p.id)})">${h(wm70T('more'))}</button></div>`;
}
async function wm70OpenProfile(uid){
 if(Number(uid)===Number(ME?.me?.id))return wm70Edit();
 const seq=++WM70.profileSeq;WM70.modal='profile';WM70.profileId=Number(uid);WM70.gift=null;++WM70.giftSeq;sheet(`<p>${h(wm70T('loading'))}</p>`);
 try{const result=await wm70Request('profile?uid='+Number(uid));if(seq!==WM70.profileSeq||WM70.modal!=='profile')return;wm70Remember(result.profile);wm70ProfileDraw(result.profile)}catch(error){if(seq===WM70.profileSeq)sheet(`<p>${h(wm70Error(error))}</p>`)}
}
function wm70ProfileDraw(p){sheet(`<section class="wm70-public-profile"><div class="wm70-title"><h3>${h(wm70T('profile'))}</h3><button onclick="WM70.modal=null;closeSheet()">×</button></div>${wm70Avatar(p)}<h2 class="wn-inline" dir="auto">${h(p.name)}</h2><small>ID ${Number(p.id)} · ${p.friends||0} ${h(wm70T('friends'))}</small>${wm70ProfileButtons(p)}${p.gifts?.length?`<h3>${h(wm70T('received'))}</h3><div class="wm70-gift-showcase">${p.gifts.map(v=>`<div>${wm70GiftArt(v.code)}<small>×${Number(v.count)}</small></div>`).join('')}</div>`:''}</section>`)}
function wm70PeerMenu(uid){const p=WM70.people.get(Number(uid));if(!p)return;sheet(`<h3 class="wn-inline">${h(p.name)}</h3><div class="wn-sheet-list">${p.relation==='accepted'?`<button onclick="wm70Friend('remove',${uid})">${h(wm70T('remove'))}</button>`:''}<button onclick="wm70Friend('${p.blocked_by_me?'unblock':'block'}',${uid})">${h(wm70T(p.blocked_by_me?'unblock':'block'))}</button><button onclick="wm70OpenProfile(${uid})">${h(wm70T('profile'))}</button></div>`)}
