function(){
 const active=TAB==='l'?'p':TAB==='g'?'h':TAB,nav=byId('nav');if(!nav)return;
 const tabs=[['h','home','home'],['p','music','music'],['c','cinema','cinema'],['d','chat','chat'],['m','account','account']];
 let buttons=[...nav.querySelectorAll(':scope>button')],changed=false;
 if(!nav.__wkPersistent||buttons.length!==tabs.length){
  nav.innerHTML=tabs.map(([tab,shape,label])=>`<button type="button" data-wk-tab="${tab}" onclick="go('${tab}')" aria-label="${h(tr(label))}">${shape==='cinema'&&window.WM75?WM75.art():icon(shape)}<span data-wk-nav-label>${h(tr(label))}</span></button>`).join('');
  buttons=[...nav.querySelectorAll(':scope>button')];nav.__wkPersistent=true;changed=true;
 }
 tabs.forEach(([tab,shape,label],index)=>{
  const button=buttons[index],selected=active===tab,text=tr(label);
  if(button.classList.contains('on')!==selected){button.classList.toggle('on',selected);changed=true}
  if(selected){if(button.getAttribute('aria-current')!=='page')button.setAttribute('aria-current','page')}else if(button.hasAttribute('aria-current'))button.removeAttribute('aria-current');
  if(button.getAttribute('aria-label')!==text){button.setAttribute('aria-label',text);changed=true}
  const span=button.querySelector(':scope>[data-wk-nav-label]');if(span&&span.textContent!==text){span.textContent=text;changed=true}
  const unread=tab==='d'&&typeof WM70!=='undefined'?Math.min(99,Number(WM70.unread)||0):0;let badge=button.querySelector('.wm76-unread');
  if(unread){if(!badge){badge=document.createElement('b');badge.className='wm76-unread';button.append(badge)}if(badge.textContent!==String(unread))badge.textContent=String(unread)}else badge?.remove();
 });
 if(!nav.classList.contains('wm76-nav'))nav.classList.add('wm76-nav');
 if(changed)window.WKTB?.dress();
}
