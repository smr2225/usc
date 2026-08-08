// USC 2222 — общий каркас
const SITE = {
  year: 2222,
  brand: { ru: 'Марс', en: 'Mars', fr: 'Mars', es: 'Marte' },
  telegram: 'https://t.me/s_mars_r',
  langs: [ // по алфавиту кодов
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'ru', name: 'Русский' },
  ],
};

// сквозное меню: коды разделов + названия на 4 языках
const MENU = [
  { code: 'svts', ru: 'Советы',      en: 'Soviets',      fr: 'Soviets',      es: 'Soviets' },
  { code: 'cnst', ru: 'Конституция', en: 'Constitution', fr: 'Constitution', es: 'Constitución' },
  { code: 'thry', ru: 'Диамат',      en: 'Diamat',       fr: 'Diamat',       es: 'Diamat' },
  { code: 'clnd', ru: 'Календарь',   en: 'Calendar',     fr: 'Calendrier',   es: 'Calendario' },
  { code: 'dscn', ru: 'Обсуждения',  en: 'Discussions',  fr: 'Discussions',  es: 'Discusiones' },
  { code: 'hist', ru: 'Истории',     en: 'Stories',      fr: 'Histoires',    es: 'Historias' },
  { code: 'glsr', ru: 'Глоссарий',   en: 'Glossary',     fr: 'Glossaire',    es: 'Glosario' },
  { code: 'bout', ru: 'О сайте',     en: 'About',        fr: 'À propos',     es: 'Acerca de' },
];

const FOOTER = {
  ru: '© Второй марсианский Союз Советов Граждан 2226. Все права принадлежат гражданам.',
  en: '© Second Martian Union of Soviets of Citizens 2226. All rights belong to the citizens.',
  fr: '© Seconde Union Martienne des Soviets de Citoyens 2226. Tous les droits appartiennent aux citoyens.',
  es: '© Segunda Unión Marciana de Soviets de Ciudadanos 2226. Todos los derechos pertenecen a los ciudadanos.',
};

const LANG_KEY = 'usc-lang';
const THEME_KEY = 'usc-theme';
const BG_KEY = 'usc-bg';
const BG_POOL = { dark: 2, light: 2 }; // число файлов: img/bd01.. / bl01..
const BG_LABELS = {
  ru: ['Светлая', 'Тёмная'], en: ['Light', 'Dark'],
  fr: ['Claire', 'Sombre'], es: ['Clara', 'Oscura']
};

// корень сайта (абсолютный путь) — от расположения этого скрипта
const SITE_ROOT = (function () {
  var s = document.currentScript && document.currentScript.src;
  return s ? s.substring(0, s.lastIndexOf('/') + 1) : '';
})();

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

// --- пути ---
function basePath() {
  var b = document.documentElement.getAttribute('data-base') || document.body.getAttribute('data-base');
  return b || SITE_ROOT;
}

// --- фон: случайное фото из пула, без повтора подряд ---
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

// --- лендинги и разделы: шапка (бренд, меню, языки) и подвал ---
function injectChrome() {
  const body = document.body;
  const lang = document.documentElement.dataset.lang || document.documentElement.lang || 'en';
  const base = body.dataset.base || basePath();
  const brand = SITE.brand[lang] || SITE.brand.ru;

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <a class="brand" href="${SITE_ROOT}index.html">${brand} · ${SITE.year}</a>
    <nav class="site-menu">${menuLinks(lang, base)}</nav>
    <nav class="lang-switch">${langLinks(lang, base)}</nav>`;

  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <span>${FOOTER[lang] || FOOTER.en}</span>
    <a href="${SITE.telegram}" target="_blank" rel="noopener">Telegram</a>`;

  body.prepend(header);
  body.append(footer);

  themeToggle(header);
}

function menuLinks(lang, base) {
  var path = location.pathname;
  return MENU.map(m => {
    var active = path.indexOf('/' + m.code + '/') !== -1 ? ' class="active"' : '';
    return `<a${active} href="${base}${m.code}/${m.code}_${lang}.html">${m[lang] || m.en}</a>`;
  }).join('');
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