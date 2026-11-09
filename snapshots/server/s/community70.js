/* Final integration: retain original player, finance, operations and cinema engines. */
Object.assign(WM70_COPY.fa,{"teamCoins":"دستیارها و سکهٔ سازنده"});Object.assign(WM70_COPY.ps,{teamCoins:'مرستیالان او د جوړوونکي سکې'});Object.assign(WM70_COPY.en,{teamCoins:'Team & creator coin grants'});
const wm70LegacyFrameOpen=af24Open,wm70LegacyFrameTab=af24Tab,wm70LegacyFrameDraw=af24Draw;
af24Open=function(){if(!WM70.self?.roles?.includes('creator'))return wm70Edit('halos');AF24.tab='staff';return wm70LegacyFrameOpen()};
af24Tab=function(tab){if(tab==='gallery'){af24Close();return wm70Edit('halos')}return wm70LegacyFrameTab(tab)};
af24Draw=function(){wm70LegacyFrameDraw();if(AF24.tab==='staff')document.querySelectorAll('#af24-panel .af24-grid').forEach(node=>node.remove())};
for(const language of ['fa','ps','en']){AF24_COPY[language].staffFrames=WM70_COPY[language].halos;AF24_COPY[language].staffNote=WM70_COPY[language].halos+' · 10';}
const wm70LegacySpProfile=spProfile;
spProfile=function(profile){return wm70LegacySpProfile(WM70.self&&Number(profile?.id)===Number(WM70.self.id)?{...profile,name:WM70.self.name,avatar_url:WM70.self.avatar}:profile)};
const wm70LegacySpImages=spImages;
spImages=function(root){const images=[];if(root?.matches?.('img'))images.push(root);root?.querySelectorAll?.('img').forEach(image=>images.push(image));for(const image of images)if(!image.closest('.wm70-avatar')&&!image.dataset.wm70Avatar)wm70LegacySpImages(image)};
const wm70LegacyCloseSheet=closeSheet;
closeSheet=function(){WM70.modal=null;WM70.gift=null;++WM70.profileSeq;++WM70.giftSeq;return wm70LegacyCloseSheet()};
for(const language of ['fa','ps','en'])WC23_COPY[language].send=WM70_COPY[language].coinTransfer;
const wm70WalletDraw=wc23Draw;
wc23Draw=function(){if(WC23.tab==='send')WC23.gift='';wm70WalletDraw();if(WC23.tab==='send'&&!WC23.quote)document.querySelectorAll('#wc23-panel .wc23-card .wc23-grid').forEach(node=>node.remove())};
wc23ChooseGift=function(){toast(wm70T('giftHere'))};
w29Gift=code=>wm70GiftArt(code);
wnGifts=function(){toast(wm70T('giftHere'));go('c')};
const wm70LegacySeatRing=p27SeatRing;
p27SeatRing=function(style){return style?.source===70?wm70HaloArt(style):wm70LegacySeatRing(style)};
const wm70OldHall=drawHall;
drawHall=function(){wm70OldHall();wm70MountHall()};
const wm70OldMusic=wnMusic;
wnMusic=function(){wm70OldMusic();const page=document.querySelector('.wn-music');if(page&&!page.querySelector('.wm70-library-entry'))page.insertAdjacentHTML('afterbegin',`<button class="wn-banner wm70-library-entry" onclick="go('l')">${wnIcon('library')}<span><b>${h(wm70T('library'))}</b><p>${h(wnT('fromBoth'))}</p></span><span>‹</span></button>`)};
rPlayer=wnMusic;
const wm70LegacyRender=render;
render=function(){if(TAB==='d'){cinMode();wm70ChatDraw();renderNav()}else wm70LegacyRender()};
renderNav=function(){const active=TAB==='l'?'p':TAB==='g'?'h':TAB;document.getElementById('nav').innerHTML=[['h','home',wnT('home')],['p','headphones',wnT('music')],['c','cinema',wnT('cinema')],['d','mail',wm70T('chat')],['m','user',wnT('profile')]].map(([key,icon,label])=>`<button class="${active===key?'on':''}" onclick="go('${key}')" aria-label="${h(label)}" ${active===key?'aria-current="page"':''}>${wnIcon(icon)}<span>${h(label)}</span>${key==='d'&&WM70.unread?`<i class="wm70-nav-unread">${Math.min(99,WM70.unread)}</i>`:''}</button>`).join('')};
setInterval(()=>{if(!ME?.me||document.visibilityState==='hidden')return;if(!WM70.loading&&Date.now()-WM70.lastSelf>45000)wm70Load();if(TAB==='d'&&WM70.peer)wm70PollDM();if(TAB==='c'&&CID)wm70PollHall();if(Date.now()-WM70.lastInbox>5000)wm70RefreshSocial()},1400);
const WM70_ART_NODES=new Set();
const WM70_ART_OBSERVER=window.IntersectionObserver?new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle('wm70-offscreen',!entry.isIntersecting)},{rootMargin:'30px'}):null;
let wm70ArtworkQueued=false;
function wm70ObserveArtwork(){for(const node of document.querySelectorAll('svg.wm70-art:not([data-wm70-observed])')){node.dataset.wm70Observed='1';WM70_ART_NODES.add(node);WM70_ART_OBSERVER?.observe(node)}for(const node of WM70_ART_NODES)if(!node.isConnected){WM70_ART_OBSERVER?.unobserve(node);WM70_ART_NODES.delete(node)}}
new MutationObserver(()=>{if(wm70ArtworkQueued)return;wm70ArtworkQueued=true;requestAnimationFrame(()=>{wm70ArtworkQueued=false;wm70ObserveArtwork()})}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('visibilitychange',()=>document.body.classList.toggle('wm70-suspended',document.visibilityState==='hidden'));
wm70ObserveArtwork();
if(ME?.me){wm70Load();wm70RefreshSocial();render()}
