// USC 2222 — общий каркас
const SITE = {
  year: 2222,
  brand: 'Марс',
  telegram: 'https://t.me/s_mars_r',
  langs: [ // по алфавиту кодов
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'ru', name: 'Русский' },
  ],
};
const LANG_KEY = 'usc-lang';
const THEME_KEY = 'usc-theme';
const BG_KEY = 'usc-bg';
const BG_POOL = { dark: 2, light: 2 }; // число файлов: img/bd01.. / bl01..
const BG_LABELS = {
  ru: ['Светлая', 'Тёмная'], en: ['Light', 'Dark'],
  fr: ['Claire', 'Sombre'], es: ['Clara', 'Oscura']
};

// --- тема: ставим сразу, до отрисовки ---
(function () {
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (saved !== 'dark' && saved !== 'light') {
    saved = (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', saved);
})();

// --- атрибут lang по языку страницы (против автоперевода) ---
(function () {
  var m = location.pathname.match(/\/(ru|en|fr|es)\//);
  if (m) document.documentElement.lang = m[1];
})();

document.addEventListener('DOMContentLoaded', () => {
  initBackground();
  const body = document.body;
  if (body.classList.contains('gateway')) initGateway();
  if (body.dataset.inject === 'chrome') injectChrome();
});

// --- гейтвей: выбор языка, без авто-редиректа ---
function initGateway() {
  document.querySelectorAll('.gw-quote').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      try { localStorage.setItem(LANG_KEY, a.dataset.lang); } catch (e) {}
      location.href = a.getAttribute('href');
    });
  });
}

// --- фон: случайное фото из пула, без повтора подряд ---
function basePath() {
  var b = document.documentElement.getAttribute('data-base') || document.body.getAttribute('data-base');
  if (b) return b;
  var seg = location.pathname.replace(/\/$/, '').split('/');
  var d = seg.length - 2, s = '';
  while (d-- > 0) s += '../';
  return s;
}
function initBackground() {
  var bg = document.createElement('div');
  bg.id = 'usc-bg';
  document.body.insertBefore(bg, document.body.firstChild);
  pickBackground(document.documentElement.getAttribute('data-theme'));
}
function pickBackground(theme) {
  var n = BG_POOL[theme] || 0;
  if (!n) return;
  var last = ''; try { last = localStorage.getItem(BG_KEY) || ''; } catch (e) {}
  var k = 1 + Math.floor(Math.random() * n);
  if (n > 1 && theme + ':' + k === last) k = (k % n) + 1;
  try { localStorage.setItem(BG_KEY, theme + ':' + k); } catch (e) {}
  var name = (theme === 'dark' ? 'bd' : 'bl') + (k < 10 ? '0' : '') + k + '.jpg';
  document.documentElement.style.setProperty('--bg-photo', 'url("' + basePath() + 'img/' + name + '")');
}

// --- лендинги: шапка и подвал ---
function injectChrome() {
  const body = document.body;
  const lang = document.documentElement.dataset.lang || document.documentElement.lang || 'en';
  const base = body.dataset.base || basePath();

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <a class="brand" href="${base}index.html">${SITE.brand} · ${SITE.year}</a>
    <nav class="lang-switch">${langLinks(lang, base)}</nav>`;

  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <span>© ${SITE.year} ${SITE.brand}</span>
    <a href="${SITE.telegram}" target="_blank" rel="noopener">Telegram</a>`;

  body.prepend(header);
  body.append(footer);

  themeToggle(header);
}

function langLinks(current, base) {
  return SITE.langs.map(l =>
    `<a class="${l.code === current ? 'active' : ''}" href="${base}${l.code}/">${l.code}</a>`
  ).join('');
}

// --- кнопка смены темы ---
function themeToggle(header) {
  var cur = document.documentElement.getAttribute('data-theme');
  var labels = bgLabels();
  var b = document.createElement('button');
  b.type = 'button';
  b.id = 'usc-theme-toggle';
  b.textContent = '◐';
  b.title = labels[cur === 'dark' ? 0 : 1];
  b.addEventListener('click', function () {
    cur = (cur === 'dark') ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, cur); } catch (e) {}
    document.documentElement.setAttribute('data-theme', cur);
    pickBackground(cur);
    b.title = labels[cur === 'dark' ? 0 : 1];
  });
  header.appendChild(b);
}
function bgLabels() {
  var m = location.pathname.match(/\/(ru|en|fr|es)\//);
  return (m && BG_LABELS[m[1]]) || BG_LABELS.en;
}