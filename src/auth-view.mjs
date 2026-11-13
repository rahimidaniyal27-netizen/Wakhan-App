/* Shared by the actual native sign-in screen and the reviewable offline preview. */
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const helpIcon='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 4V6a2 2 0 0 1 2-2Z"/><path d="M9 9c0-4 7-4 6 0-.5 2-3 2-3 4m0 2v.1"/></svg>';
/* WAKHAN 2.0 welcome screen: WAKHAN colours (ice white, or purple dark when the phone is dark), formal text,
   three full-width sign-in buttons that show only the provider's icon and name (no «Continue with…»). main.mjs adds the sign-in / sign-up tabs before .native87-welcome-actions and the
   legal links at its end; both are styled here. */
const WK2A_CSS=`
body.native87-auth:has(.wk2a-hero),#native87-root.native87-welcome:has(.wk2a-hero){--a-bg:#EEF3FA;--a-bg2:#E2EAF6;--a-glow:rgba(91,140,255,.28);--a-card:#FFFFFF;--a-line:#CFD6DF;--a-tx:#12161C;--a-tx2:#5A6472;--a-ac:#1F5EFF;--a-seg:#E1E7F0;--a-on:#FFFFFF;background:radial-gradient(120% 60% at 50% 0%,var(--a-glow),transparent 70%),linear-gradient(180deg,var(--a-bg),var(--a-bg2))!important;color:var(--a-tx)!important}
@media (prefers-color-scheme:dark){body.native87-auth:has(.wk2a-hero),#native87-root.native87-welcome:has(.wk2a-hero){--a-bg:#10091C;--a-bg2:#150C25;--a-glow:rgba(168,85,247,.32);--a-card:#1E1232;--a-line:#3A2858;--a-tx:#F2F7FF;--a-tx2:#C8B6E3;--a-ac:#AB74FF;--a-seg:#1E1232;--a-on:#302047}}
#native87-root.native87-welcome:has(.wk2a-hero){display:flex;flex-direction:column;min-height:100dvh;box-sizing:border-box;padding:calc(10px + env(safe-area-inset-top,0px)) 22px calc(18px + env(safe-area-inset-bottom,0px));max-width:520px;margin:0 auto;font-family:-apple-system,system-ui,'SF Arabic','Noto Sans Arabic','Segoe UI',Vazirmatn,sans-serif}
.wk2a-top{display:flex;justify-content:flex-end;min-height:44px;align-items:center}
.wk2a-help{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 14px;border-radius:19px;border:1px solid var(--a-line);background:color-mix(in srgb,var(--a-card) 70%,transparent);color:var(--a-tx);font:inherit;font-size:13.5px;font-weight:600;-webkit-tap-highlight-color:transparent}
.wk2a-hero{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:18px 0 22px;min-height:230px}
.wk2a-hero img{width:96px;height:96px;border-radius:26px;box-shadow:0 18px 40px -12px color-mix(in srgb,var(--a-ac) 55%,transparent)}
.wk2a-hero h1{margin:18px 0 6px;font:800 40px/1.05 -apple-system,system-ui,'Segoe UI',sans-serif;letter-spacing:-.5px;color:var(--a-tx)}
.wk2a-hero p{margin:0;max-width:300px;font-size:15px;line-height:1.7;color:var(--a-tx2)}
#native87-root:has(.wk2a-hero) .wk-tabs{display:flex!important;gap:4px;margin:0 0 16px!important;padding:4px!important;border-radius:16px!important;background:var(--a-seg)!important;border:0!important}
#native87-root:has(.wk2a-hero) .wk-tabs button{flex:1;height:42px;border:0!important;border-radius:12px!important;background:transparent!important;color:var(--a-tx2)!important;font:inherit;font-size:15px!important;font-weight:700!important;box-shadow:none!important;padding:0!important}
#native87-root:has(.wk2a-hero) .wk-tabs button.on{background:var(--a-on)!important;color:var(--a-tx)!important;box-shadow:0 2px 8px rgba(20,30,50,.12)!important}
.wk2a-methods{display:flex;flex-direction:column;gap:12px}
.wk2a-btn{position:relative;display:flex;align-items:center;justify-content:center;gap:12px;width:100%;height:56px;padding:0 54px;border-radius:16px;border:1px solid var(--a-line);background:var(--a-card);color:var(--a-tx);font:inherit;font-size:16px;font-weight:700;-webkit-tap-highlight-color:transparent;transition:transform .12s}
.wk2a-btn:active{transform:scale(.98)}
.wk2a-btn .ic{position:absolute;inset-inline-start:16px;top:50%;width:26px;height:26px;margin-top:-13px;display:flex;align-items:center;justify-content:center}
.wk2a-btn .ic svg{width:24px;height:24px}
.wk2a-btn.is-google{background:#FFFFFF;color:#12161C;border-color:var(--a-line)}
.wk2a-btn.is-facebook{background:#1877F2;color:#FFFFFF;border-color:#1877F2}
.wk2a-btn.is-facebook .ic circle{fill:#FFFFFF}.wk2a-btn.is-facebook .ic path{fill:#1877F2}
.wk2a-btn.is-email{background:transparent;color:var(--a-tx)}
.wk2a-btn[aria-disabled=true]{opacity:.5}
.wk2a-btn .st{position:absolute;inset-inline-end:14px;font-size:11px;font-weight:600;opacity:.8}
.wk2a-or{display:flex;align-items:center;gap:12px;margin:2px 0;color:var(--a-tx2);font-size:13px}
.wk2a-or:before,.wk2a-or:after{content:"";flex:1;height:1px;background:var(--a-line)}
#native87-root:has(.wk2a-hero) .native87-error{min-height:20px;margin:10px 0 0;text-align:center;font-size:13.5px}
.wk2a-foot{margin:14px 0 4px!important;text-align:center;font-size:12.5px!important;line-height:1.7;color:var(--a-tx2)!important}
#native87-root:has(.wk2a-hero) .wk-legal{margin:0!important;text-align:center;font-size:13px}
#native87-root:has(.wk2a-hero) .wk-legal a{color:var(--a-ac)!important;font-weight:700;text-decoration:none}`;
/* WAKHAN 2.0 flow screens (e-mail, code, waiting for Google/Facebook, name, sign-up form): same colours as the welcome
   screen, the back button is a round arrow on the left (as everywhere in Wakhan); the logo is only on the welcome screen. Markup stays in main.mjs. */
const WK2F_CSS=`
body.native87-auth:has(#native87-root[data-screen=flow]),#native87-root[data-screen=flow]{--a-bg:#EEF3FA;--a-card:#FFFFFF;--a-line:#CFD6DF;--a-tx:#12161C;--a-tx2:#5A6472;--a-ac:#1F5EFF;--a-acs:rgba(31,94,255,.14);--a-err:#D92D45;background:var(--a-bg)!important;color:var(--a-tx)!important;color-scheme:light}
@media (prefers-color-scheme:dark){body.native87-auth:has(#native87-root[data-screen=flow]),#native87-root[data-screen=flow]{--a-bg:#10091C;--a-card:#1E1232;--a-line:#3A2858;--a-tx:#F2F7FF;--a-tx2:#C8B6E3;--a-ac:#AB74FF;--a-acs:rgba(171,116,255,.18);--a-err:#FF6B7F;color-scheme:dark}}
#native87-root[data-screen=flow]{position:relative;justify-content:flex-start!important;padding-top:calc(84px + env(safe-area-inset-top,0px))!important;font-family:-apple-system,system-ui,'SF Arabic','Noto Sans Arabic','Segoe UI',Vazirmatn,sans-serif}
#native87-root[data-screen=flow] .native87-wordmark{display:none!important}
#native87-root[data-screen=flow] .native87-wordmark img{width:64px!important;height:64px!important;border-radius:18px;box-shadow:0 14px 30px -12px color-mix(in srgb,var(--a-ac) 60%,transparent)}
#native87-root[data-screen=flow] .native87-wordmark>div{display:none}
#native87-root[data-screen=flow] h1{margin:0 0 8px!important;text-align:center;font-size:26px!important;font-weight:800!important;line-height:1.5!important;color:var(--a-tx)!important}
#native87-root[data-screen=flow] p{text-align:center;font-size:14px!important;line-height:1.8!important;color:var(--a-tx2)!important;margin:0 0 18px!important}
#native87-root[data-screen=flow] .native87-field{margin:18px 0 0!important;font-size:13px!important;font-weight:600;color:var(--a-tx2)!important}
#native87-root[data-screen=flow] .native87-field input:not(.wk-user input),#native87-root[data-screen=flow] .native87-field select{height:56px!important;border:1px solid var(--a-line)!important;border-radius:16px!important;background:var(--a-card)!important;color:var(--a-tx)!important;font-size:16px!important;box-shadow:none!important}
#native87-root[data-screen=flow] .native87-field input:focus{border-color:var(--a-ac)!important;box-shadow:0 0 0 4px var(--a-acs)!important}
#native87-root[data-screen=flow] #code{text-align:center;font-size:26px!important;font-weight:700;letter-spacing:12px;padding-inline-start:28px!important}
#native87-root[data-screen=flow] .native87-primary{height:56px;min-height:56px!important;margin-top:20px!important;border-radius:16px!important;background:var(--a-ac)!important;color:#fff!important;font-size:16px!important;font-weight:700!important;border:0!important}
#native87-root[data-screen=flow] .native87-primary[disabled]{opacity:.6}
#native87-root[data-screen=flow] .native87-secondary:not(#auth-back){min-height:48px!important;margin-top:8px!important;border:0!important;background:transparent!important;color:var(--a-ac)!important;font-size:15px!important;font-weight:700!important}
#native87-root[data-screen=flow] #auth-back{display:flex!important;align-items:center;justify-content:center;position:absolute;top:calc(14px + env(safe-area-inset-top,0px));left:18px;right:auto;width:44px!important;height:44px!important;min-height:44px!important;margin:0!important;padding:0!important;border-radius:50%!important;border:1px solid var(--a-line)!important;background:var(--a-card)!important;font-size:0!important;color:transparent!important}
#native87-root[data-screen=flow] #auth-back:before{content:"";display:block;flex:none;width:22px;height:22px;background:var(--a-tx);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m15 5-7 7 7 7'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m15 5-7 7 7 7'/%3E%3C/svg%3E") center/contain no-repeat}
#native87-root[data-screen=flow] .native87-code{background:var(--a-card)!important;border:1px solid var(--a-line)!important;color:var(--a-ac)!important;border-radius:18px!important}
#native87-root[data-screen=flow] .native87-wait{color:var(--a-tx2)!important;font-size:0!important}
#native87-root[data-screen=flow] .native87-wait:before{border-color:var(--a-line)!important;border-top-color:var(--a-ac)!important}
#native87-root[data-screen=flow] .native87-error{color:var(--a-err)!important;font-size:13.5px!important}
#native87-root[data-screen=flow] .wk-note{margin:0 0 6px!important;padding:12px 14px!important;border-radius:14px!important;background:var(--a-acs)!important;color:var(--a-tx)!important;font-size:13.5px!important;line-height:1.7!important;text-align:center}
#native87-root[data-screen=flow] .wk-pic{margin:14px 0 4px!important}
#native87-root[data-screen=flow] .wk-ava{width:96px!important;height:96px!important;background-color:var(--a-card)!important;border:1.5px dashed var(--a-line)!important;color:var(--a-tx2)!important}
#native87-root[data-screen=flow] .wk-ava.on{border:2.5px solid var(--a-ac)!important}
#native87-root[data-screen=flow] .wk-pic b{color:var(--a-ac)!important;font-size:14px!important}
#native87-root[data-screen=flow] .wk-user{min-height:56px!important;margin-top:8px;border:1px solid var(--a-line)!important;border-radius:16px!important;background:var(--a-card)!important;padding:0 14px!important}
#native87-root[data-screen=flow] .wk-user:focus-within{border-color:var(--a-ac)!important;box-shadow:0 0 0 4px var(--a-acs)}
#native87-root[data-screen=flow] .wk-user b{color:var(--a-tx2)!important;font-size:17px}
#native87-root[data-screen=flow] .wk-user input{height:54px!important;min-height:54px!important;margin:0!important;padding:0 4px!important;color:var(--a-tx)!important;font-size:16px!important;border:0!important;background:none!important;box-shadow:none!important}
#native87-root[data-screen=flow] .wk-birth{gap:8px!important;margin-top:8px!important}
#native87-root[data-screen=flow] .wk-birth select{height:54px!important;min-height:54px!important;border:1px solid var(--a-line)!important;border-radius:16px!important;background-color:var(--a-card)!important;color:var(--a-tx)!important;font-size:15px!important;font-weight:600}
#native87-root[data-screen=flow] .wk-hint{margin-top:6px!important;font-size:12.5px!important;font-weight:500;color:var(--a-tx2)!important}
#native87-root[data-screen=flow] .wk-hint.ok{color:#16A34A!important}#native87-root[data-screen=flow] .wk-hint.bad{color:var(--a-err)!important}
#native87-root[data-screen=flow] .wk-check{align-items:center!important;margin:20px 0 6px!important;padding:14px!important;border-radius:16px;background:var(--a-card);border:1px solid var(--a-line);font-size:14px!important;color:var(--a-tx)!important}
#native87-root[data-screen=flow] .wk-check input{width:22px!important;height:22px!important;margin:0!important;accent-color:var(--a-ac)!important}
#native87-root[data-screen=flow] .wk-legal{margin:10px 0 0!important;font-size:13px!important;color:var(--a-tx2)!important}
#native87-root[data-screen=flow] .wk-legal a{color:var(--a-ac)!important;font-weight:700;text-decoration:none!important}`;
try{if(typeof document!=='undefined'&&!document.getElementById('wk2f-css')){const s=document.createElement('style');s.id='wk2f-css';s.textContent=WK2F_CSS;(document.head||document.documentElement).appendChild(s)}}catch(e){}
export function welcomeMarkup({lang,copy,icons,brandSrc,available}){
 const t=k=>copy[lang]?.[k]||copy.en[k]||k;
 const btn=id=>{const ready=!!available[id],label=t(id),em=String(t('emailShort')),name={google:'Google',facebook:'Facebook'}[id]||(em.charAt(0).toLocaleUpperCase(lang)+em.slice(1));return `<button type="button" class="wk2a-btn is-${id}" data-provider="${id}" aria-label="${esc(label+(ready?'':' · '+t('unavailable')))}" aria-disabled="${!ready}"><span class="ic" aria-hidden="true">${icons[id]}</span><span dir="auto">${esc(name)}</span>${ready?'':'<span class="st">'+esc(t('unavailable'))+'</span>'}</button>`};
 return `<style id="wk2a-css">${WK2A_CSS}</style><header class="wk2a-top"><button type="button" class="wk2a-help" data-auth-help>${helpIcon}<span dir="auto">${esc(t('help'))}</span></button></header><section class="wk2a-hero" aria-label="Wakhan"><img src="${esc(brandSrc)}" alt="" width="96" height="96" fetchpriority="high" draggable="false"><h1 lang="en" dir="ltr">Wakhan</h1><p>${esc(t('sub'))}</p></section><section class="native87-welcome-actions wk2a-act" aria-label="${esc(t('title'))}"><div class="wk2a-methods">${btn('google')}${btn('facebook')}<div class="wk2a-or" aria-hidden="true">${esc(t('or'))}</div>${btn('email')}</div><div id="auth-error" class="native87-error" role="alert" aria-live="polite"></div><p class="native87-welcome-footer wk2a-foot">${esc(t('footer'))}</p></section>`;
}
const WK2H_CSS=`.native87-help-dialog{--h-card:#FFFFFF;--h-tx:#12161C;--h-tx2:#5A6472;--h-line:#CFD6DF;--h-ac:#1F5EFF;background:var(--h-card)!important;color:var(--h-tx)!important;border:1px solid var(--h-line)!important;border-radius:22px!important;font-family:-apple-system,system-ui,'SF Arabic','Noto Sans Arabic','Segoe UI',Vazirmatn,sans-serif}
@media (prefers-color-scheme:dark){.native87-help-dialog{--h-card:#1E1232;--h-tx:#F2F7FF;--h-tx2:#C8B6E3;--h-line:#3A2858;--h-ac:#AB74FF}}
.native87-help-dialog h2,.native87-help-dialog h3{color:var(--h-tx)!important}.native87-help-dialog p{color:var(--h-tx2)!important;line-height:1.8!important}
.native87-help-dialog .native87-help-heading button{width:38px;height:38px;border-radius:50%;border:0!important;outline:none!important;box-shadow:none!important;background:color-mix(in srgb,var(--h-tx) 8%,transparent)!important;color:var(--h-tx)!important;display:flex;align-items:center;justify-content:center}
.native87-help-dialog .native87-primary{background:var(--h-ac)!important;color:#fff!important;border:0!important;border-radius:16px!important;outline:none!important}
.native87-help-dialog::backdrop{background:rgba(10,12,20,.45);backdrop-filter:blur(3px)}`;
export function helpMarkup({lang,copy}){const t=k=>copy[lang]?.[k]||copy.en[k]||k;return `<style>${WK2H_CSS}</style><div class="native87-help-heading"><h2>${esc(t('helpTitle'))}</h2><button type="button" data-help-close aria-label="${esc(t('close'))}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>${[['helpOld','old'],['helpCode','helpCodeBody'],['helpOther','helpOtherBody']].map(([q,a])=>`<section><h3>${esc(t(q))}</h3><p>${esc(t(a))}</p></section>`).join('')}<button type="button" class="native87-primary" data-help-close>${esc(t('close'))}</button>`}
