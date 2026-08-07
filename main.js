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