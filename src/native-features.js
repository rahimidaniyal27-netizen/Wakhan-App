/* Account controls for the standalone client. Loaded after the existing app modules. */
(() => {
  const bridge = window.WAKHAN_NATIVE_N1;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.wnNativeN1Back = function () {
    if (document.getElementById('sheet')?.classList.contains('show')) { closeSheet(); return; }
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
