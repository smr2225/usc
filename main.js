// USC 2222 — общий каркас
const SITE = {
  year: 2222,
  defaultLang: 'en',
  sourceLang: 'ru',
  telegram: 'https://t.me/s_mars_r',
  langs: [ // по алфавиту кодов
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'ru', name: 'Русский' },
  ],
};
const LANG_KEY = 'usc-lang';

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  if (body.classList.contains('gateway')) initGateway();
  if (body.dataset.inject === 'chrome') injectChrome();
});

// --- гейтвей: авто-редирект + запоминание выбора ---
function initGateway() {
  const saved = localStorage.getItem(LANG_KEY);
  // hash #choose позволяет вернуться к выбору и сбросить авто-редирект
  if (saved && location.hash !== '#choose' && SITE.langs.some(l => l.code === saved)) {
    location.replace(saved + '/');
    return;
  }
  document.querySelectorAll('.gw-quote').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      localStorage.setItem(LANG_KEY, a.dataset.lang);
      location.href = a.getAttribute('href');
    });
  });
}

// --- лендинги: инжект шапки и подвала ---
function injectChrome() {
  const body = document.body;
  const lang = document.documentElement.dataset.lang || SITE.defaultLang;
  const base = body.dataset.base || '';

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="brand">MARS · ${SITE.year}</div>
    <nav class="lang-switch">${langLinks(lang, base)}</nav>`;

  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <span>© ${SITE.year} USC</span>
    <a href="${SITE.telegram}" target="_blank" rel="noopener">Telegram</a>`;

  body.prepend(header);
  body.append(footer);
}

function langLinks(current, base) {
  return SITE.langs.map(l =>
    `<a class="${l.code === current ? 'active' : ''}" href="${base}${l.code}/">${l.code}</a>`
  ).join('');
}
/* USC 2222 · темы и ротация подложек */
(function () {
  'use strict';

  var POOL = { dark: 2, light: 2 };   /* сколько файлов: img/bd01.. / bl01.. */
  var LS_T = 'usc-theme', LS_B = 'usc-bg';
  var L = { ru: ['Светлая', 'Тёмная'], en: ['Light', 'Dark'],
            fr: ['Claire', 'Sombre'], es: ['Clara', 'Oscura'] };

  var css = ''
    + '#usc-bg{position:fixed;inset:0;z-index:-1;'
    + 'background-image:var(--bg-overlay),var(--bg-photo,none),var(--bg-gradient);'
    + 'background-size:auto,cover,auto;background-position:center;background-repeat:no-repeat}'
    + '#usc-theme-toggle{background:none;border:1px solid var(--border);color:var(--text);'
    + 'cursor:pointer;padding:.15em .5em;font-size:1rem;line-height:1.2}'
    + 'html[data-theme="dark"]{'
    + '--bg-gradient:linear-gradient(180deg,#120b08,#3d1f14);'
    + '--bg-overlay:linear-gradient(180deg,rgba(9,5,3,.84),rgba(24,12,7,.66));'
    + '--text:#e9ded2;--muted:#b3a291;--link:#e8925f;--accent:#c1440e;'
    + '--panel:rgba(14,8,5,.55);--border:rgba(233,222,210,.16)}'
    + 'html[data-theme="light"]{'
    + '--bg-gradient:linear-gradient(180deg,#ecd3b6,#7a3b1d);'
    + '--bg-overlay:linear-gradient(180deg,rgba(243,226,203,.86),rgba(222,186,150,.68));'
    + '--text:#2b1a10;--muted:#6d4c36;--link:#a33c0a;--accent:#c1440e;'
    + '--panel:rgba(255,246,234,.55);--border:rgba(74,40,20,.20)}'
    + 'body{margin:0;color:var(--text);background:var(--bg-gradient);'
    + 'font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}'
    + 'a{color:var(--link)}';

  function base() {
    var b = document.documentElement.getAttribute('data-base')
      || (document.body && document.body.getAttribute('data-base'));
    if (b) return b;
    var seg = location.pathname.replace(/\/$/, '').split('/');
    var d = seg.length - 2, s = '';
    while (d-- > 0) s += '../';
    return s;
  }
  function sys() {
    return (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  function theme() {
    var t; try { t = localStorage.getItem(LS_T); } catch (e) {}
    return (t === 'dark' || t === 'light') ? t : sys();
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function lbl() {
    var m = location.pathname.match(/\/(ru|en|fr|es)\//);
    return (m && L[m[1]]) || L.en;
  }
  function pick(t) {
    var n = POOL[t] || 0;
    if (!n) return;
    var last = ''; try { last = localStorage.getItem(LS_B) || ''; } catch (e) {}
    var k = 1 + Math.floor(Math.random() * n);
    if (n > 1 && t + ':' + k === last) k = (k % n) + 1;
    try { localStorage.setItem(LS_B, t + ':' + k); } catch (e) {}
    var name = (t === 'dark' ? 'bd' : 'bl') + pad(k) + '.jpg';
    document.documentElement.style.setProperty('--bg-photo', 'url("' + base() + 'img/' + name + '")');
  }
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    pick(t);
  }

  /* сразу, до отрисовки */
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);
  var cur = theme();
  document.documentElement.setAttribute('data-theme', cur);

  document.addEventListener('DOMContentLoaded', function () {
    var bg = document.createElement('div');
    bg.id = 'usc-bg';
    document.body.insertBefore(bg, document.body.firstChild);
    pick(cur);

    var hdr = document.querySelector('header');
    if (hdr) {
      var b = document.createElement('button');
      b.type = 'button';
      b.id = 'usc-theme-toggle';
      b.textContent = '◐';
      b.title = lbl()[cur === 'dark' ? 0 : 1];
      b.addEventListener('click', function () {
        cur = (cur === 'dark') ? 'light' : 'dark';
        try { localStorage.setItem(LS_T, cur); } catch (e) {}
        setTheme(cur);
        b.title = lbl()[cur === 'dark' ? 0 : 1];
      });
      hdr.appendChild(b);
    }
  });
})();