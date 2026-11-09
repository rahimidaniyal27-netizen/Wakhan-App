/* Account controls for the standalone client. Loaded after the existing app modules. */
(() => {
  const bridge = window.WAKHAN_NATIVE_N1;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  /* ---- back everywhere: the open page on top closes first (Android back key, iPhone edge swipe, own back button) */
  const BACK_RX = /\b(back|close|zur(ü|u)ck|schlie(ß|ss)en|بازگشت|برگشت|بستن|بسته|وتل|تړل)\b/i;
  const visible = el => { const r = el.getBoundingClientRect(), st = getComputedStyle(el); return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden' && Number(st.opacity) > 0.05; };
  function topPanel() {
    const W = innerWidth, H = innerHeight; let best = null, bz = -1;
    for (const el of document.body.querySelectorAll('body > *, #view ~ *, [class*="panel"], [id*="panel"], [class*="-page"], [class*="fullscreen"]')) {
      if (!(el instanceof HTMLElement) || el.id === 'nav' || el.tagName === 'HEADER' || el.id === 'h2-bub' || el.id === 'toast') continue;
      const st = getComputedStyle(el); if (st.position !== 'fixed' || !visible(el)) continue;
      const r = el.getBoundingClientRect(); if (r.width < W * 0.9 || r.height < H * 0.7) continue;   // only full pages
      if (el.closest('#sheet,#fp,#wm78-room,#native87-root,#native87-help,#native-account,.wmc-stage,#wka,#wks') || el.querySelector('#wm78-room,#hall,.wmc-stage')) continue;   // the hall, the player and sign-in keep their own back
      const z = parseInt(st.zIndex, 10) || 0; if (z >= bz) { bz = z; best = el; }
    }
    return best;
  }
  function backButtonIn(panel) {
    const top = panel.getBoundingClientRect().top;
    for (const b of panel.querySelectorAll('button, [role=button], a')) {
      if (!visible(b)) continue; const r = b.getBoundingClientRect(); if (r.top - top > 140) continue;
      const label = ((b.getAttribute('aria-label') || '') + ' ' + (b.className || '') + ' ' + (b.getAttribute('onclick') || '') + ' ' + (b.textContent || '')).trim();
      if (BACK_RX.test(label) || /close|back|wp-x|-x\b|\bx\b/i.test(String(b.className)) || /closeSheet|close|back|hide/i.test(b.getAttribute('onclick') || '')) return b;
    }
    return null;
  }
  function closeTop() {
    const panel = topPanel(); if (!panel) return false;
    const b = backButtonIn(panel) || panel.querySelector('.wkn-back');
    if (b) { b.click(); return true; }
    panel.remove(); return true;
  }
  /* a page that opens without its own back button gets one */
  const BACK_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
  function ensureBackButtons() {
    const panel = topPanel(); if (!panel || panel.querySelector(':scope > .wkn-back') || backButtonIn(panel)) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'wkn-back'; b.setAttribute('aria-label', 'back'); b.innerHTML = BACK_SVG;
    b.onclick = e => { e.stopPropagation(); panel.remove(); try { if (typeof render === 'function') render(); } catch (x) {} };
    panel.prepend(b);
  }
  setInterval(ensureBackButtons, 700);
  const css = document.createElement('style');
  css.textContent = `.wkn-back{position:absolute;top:10px;inset-inline-start:12px;z-index:99;width:42px;height:42px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(10,8,25,.55);color:#fff;display:grid;place-items:center;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
  [dir=rtl] .wkn-back svg,html[dir=rtl] .wkn-back svg{transform:scaleX(-1)}`;
  document.head.appendChild(css);
  /* iPhone has no back key: swipe in from the screen edge */
  let sx = 0, sy = 0, edge = false;
  addEventListener('touchstart', e => { const t = e.touches[0]; const rtl = document.documentElement.dir === 'rtl'; edge = rtl ? t.clientX > innerWidth - 22 : t.clientX < 22; sx = t.clientX; sy = t.clientY; }, {passive: true});
  addEventListener('touchend', e => { if (!edge) return; edge = false; const t = e.changedTouches[0]; const dx = Math.abs(t.clientX - sx), dy = Math.abs(t.clientY - sy); if (dx > 70 && dy < 60) window.wnNativeN1Back(); }, {passive: true});

  window.wnNativeN1Back = function () {
    if (document.getElementById('sheet')?.classList.contains('show')) { closeSheet(); return; }
    if (closeTop()) return;
    if (document.getElementById('fp')?.classList.contains('show')) { closeFP(); return; }
    if (TAB === 'c' && CID) {
      if (window.H2?.menu) H2.menu(); else if (typeof wm78Menu === 'function') wm78Menu();
      return;
    }
    if (TAB !== 'h') { go('h'); return; }
    bridge.minimize();
  };
  window.wkaLogout = () => bridge.logout();
  const originalMe = rMe;
  rMe = function (...args) {
    const result = originalMe.apply(this, args), root = document.getElementById('view');
    if (root && !root.querySelector('.native-n1-account')) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'chip native-n1-account';
      button.style.cssText = 'display:block;margin:22px auto';
      button.textContent = bridge.accountLabel; button.onclick = () => bridge.settings(); root.append(button);
    }
    return result;
  };
  const originalSetLanguage = window.wm13Set;
  if (typeof originalSetLanguage === 'function') window.wm13Set = function (code) {
    bridge.chooseLanguage(code);
    return originalSetLanguage(code);
  };
  window.langSheet = function () {
    const row = (code, name, subtitle, direction, selected) => `<button type="button" data-native-language="${escape(code)}" role="radio" aria-checked="${selected}" class="${selected ? 'on' : ''}"><span><b dir="${escape(direction)}">${escape(name)}</b><small>${escape(subtitle)}</small></span><span class="native-n1-language-radio" aria-hidden="true"></span></button>`;
    const choices = bridge.languageChoices || window.WM13_DATA.langs;
    sheet(`<section class="native-n1-languages" dir="${escape(bridge.languageDirection)}"><h3>${escape(bridge.languageTitle)}</h3><div role="radiogroup" aria-label="${escape(bridge.languageTitle)}">${row('system', bridge.languageSystemLabel, bridge.deviceLanguageName, bridge.languageDirection, bridge.languageAutomatic)}${choices.map(l => row(l.c, l.n, l.s, l.d, !bridge.languageAutomatic && l.c === bridge.languageCode)).join('')}</div></section>`);
    document.getElementById('sheet').querySelectorAll('[data-native-language]').forEach(button => {
      button.onclick = () => button.dataset.nativeLanguage === 'system' ? bridge.useDeviceLanguage() : window.wm13Set(button.dataset.nativeLanguage);
    });
  };
  // English-backed dictionaries can still need right-to-left layout (Arabic/Urdu).
  const direction = () => {
    if (bridge.languageDirection && document.documentElement.dir !== bridge.languageDirection)
      document.documentElement.dir = bridge.languageDirection;
  };
  new MutationObserver(direction).observe(document.documentElement, {attributes:true, attributeFilter:['dir']});
  direction();
})();
boot();
