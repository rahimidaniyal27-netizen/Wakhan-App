const COPY={
 fa:{title:'اتصال صدا',close:'بستن',mode:'روش اتصال',auto:'خودکار',tls:'مسیر امن',test:'بررسی اتصال',busy:'در حال بررسی…',copy:'کپی گزارش',copied:'کپی شد',failed:'اتصال برقرار نشد',ready:'اتصال به سرور برقرار شد',unknown:'بررسی نشد',notice:'این بررسی به میکروفون دسترسی ندارد. برای تأیید صدا باید با یک نفر در سالون صحبت کنی.',detail:'جزئیات برای پشتیبانی',off:'بدون VPN',on:'با VPN',done:'بررسی تمام شد',empty:'مسیر صدا از سرور دریافت نشد',cancel:'آزمون لغو شد',change:'روش اتصال عوض شد؛ اگر در سالون باشی صدا دوباره وصل می‌شود.'},
 ps:{title:'د غږ اړیکه',close:'تړل',mode:'د اړیکې لاره',auto:'خپله',tls:'خوندي لاره',test:'اړیکه وازمویئ',busy:'ازمویل کېږي…',copy:'راپور کاپي',copied:'کاپي شو',failed:'اړیکه ونشوه',ready:'له سرور سره اړیکه وشوه',unknown:'ونه ازمویل شوه',notice:'دا ازموینه مایکروفون نه کاروي. د غږ د تایید لپاره په سالون کې له بل کس سره خبرې وکړئ.',detail:'د مرستې لپاره جزییات',off:'بې VPN',on:'له VPN سره',done:'ازموینه بشپړه شوه',empty:'د غږ لاره له سرور نه ترلاسه شوه',cancel:'ازموینه لغوه شوه',change:'د اړیکې لاره بدله شوه؛ د سالون غږ بیا نښلي.'},
 en:{title:'Voice connection',close:'Close',mode:'Connection mode',auto:'Automatic',tls:'Secure relay',test:'Check connection',busy:'Checking…',copy:'Copy report',copied:'Copied',failed:'Connection failed',ready:'Connected to relay server',unknown:'Not tested',notice:'This check does not access your microphone. Confirm two-way audio by speaking with someone in a hall.',detail:'Support details',off:'Without VPN',on:'With VPN',done:'Check complete',empty:'No voice relay received from server',cancel:'Check cancelled',change:'Connection mode changed. Hall audio will reconnect if active.'}
};

export function voiceSettingsButton({diagnostics,routes,language=()=>document.documentElement.lang||'en',document:doc=globalThis.document}={}){
 const words=()=>COPY[String(language()).slice(0,2)]||COPY.en;
 const button=doc.createElement('button');button.type='button';button.className='wka-voice-settings';button.textContent=words().title;
 button.style.cssText='display:block;width:100%;min-height:48px;margin-block:10px;padding:12px 16px;border-radius:14px;border:1px solid var(--ln,#ffffff20);background:var(--card2,#ffffff08);color:inherit;font:inherit;text-align:start';
 button.onclick=()=>{
  if(doc.getElementById('wka-voice-settings'))return;
  const text=words(),dialog=doc.createElement('dialog');dialog.id='wka-voice-settings';dialog.dir=['fa','ps','ar','ur'].includes(String(language()).slice(0,2))?'rtl':'ltr';
  dialog.style.cssText='width:min(480px,calc(100vw - 32px));max-height:85dvh;box-sizing:border-box;overflow:auto;border:1px solid #ffffff30;border-radius:20px;padding:20px;background:var(--bg2,#171327);color:var(--txt,#fff);font:inherit';
  dialog.innerHTML='<form method="dialog"><button data-close type="submit" style="float:inline-end;min-width:44px;min-height:44px;border:0;border-radius:12px;background:#ffffff12;color:inherit">×</button></form><h2></h2><label data-label></label><select data-mode style="display:block;width:100%;min-height:48px;margin:10px 0;font:inherit;background:var(--bg,#171327);color:inherit;border-radius:12px;padding:8px"></select><p data-notice style="font-size:13px;line-height:1.6"></p><select data-vpn style="min-height:44px;max-width:100%;font:inherit;background:var(--bg,#171327);color:inherit;border-radius:10px;padding:8px"></select><p role="status" aria-live="polite" data-status></p><ul data-results></ul><button data-test type="button" style="min-height:48px;padding:10px 18px;border:0;border-radius:12px;background:var(--a1,#7c3aed);color:white;font:inherit"></button><details style="margin-top:14px"><summary></summary><textarea readonly dir="ltr" data-report style="box-sizing:border-box;width:100%;height:150px;margin-top:10px;resize:vertical;font:11px monospace;background:#0003;color:inherit"></textarea><button data-copy type="button" style="min-height:44px;padding:8px;font:inherit"></button></details>';
  const find=selector=>dialog.querySelector(selector);
  find('h2').textContent=text.title;find('[data-close]').setAttribute('aria-label',text.close);find('[data-close]').className='wka-voice-close';find('[data-label]').textContent=text.mode;find('[data-notice]').textContent=text.notice;
  const mode=find('[data-mode]');mode.setAttribute('aria-label',text.mode);
  for(const [value,label]of [['auto',text.auto],['tls',text.tls]]){const option=doc.createElement('option');option.value=value;option.textContent=label;mode.append(option)}
  mode.value=routes.mode;mode.onchange=()=>{routes.setMode(mode.value);find('[data-status]').textContent=text.change};
  const vpn=find('[data-vpn]');vpn.setAttribute('aria-label','VPN');
  for(const [value,label]of [['off',text.off],['on',text.on]]){const option=doc.createElement('option');option.value=value;option.textContent=label;vpn.append(option)}
  find('summary').textContent=text.detail;find('[data-test]').textContent=text.test;find('[data-copy]').textContent=text.copy;
  let closed=false;
  const close=()=>{closed=true;diagnostics.cancel();dialog.remove()};dialog.addEventListener('close',close);
  find('[data-test]').onclick=async()=>{
   const test=find('[data-test]');test.disabled=true;find('[data-status]').textContent=text.busy;find('[data-results]').replaceChildren();
   const vpnState=vpn.value,modeState=routes.mode;mode.disabled=true;vpn.disabled=true;
   try{
    const report=await diagnostics.check();const peers=await diagnostics.snapshot();if(closed)return;
    find('[data-report]').value=JSON.stringify({...report,mode:modeState,vpn:vpnState,peers},null,2);
    find('[data-status]').textContent=report.status==='cancelled'?text.cancel:report.status==='complete'?text.done:text.empty;
    for(const path of report.paths){const row=doc.createElement('li');row.textContent=path.transport.toUpperCase()+': '+(path.status==='relay_allocated'?text.ready:path.status==='cancelled'?text.cancel:path.status==='unsupported'?text.unknown:text.failed);find('[data-results]').append(row)}
   }finally{if(!closed){test.disabled=false;mode.disabled=false;vpn.disabled=false}}
  };
  find('[data-copy]').onclick=async()=>{
   const report=find('[data-report]');if(!report.value)return;
   try{await navigator.clipboard.writeText(report.value);find('[data-status]').textContent=text.copied}catch{report.focus();report.select()}
  };
  doc.body.append(dialog);dialog.showModal();
 };
 return button;
}
