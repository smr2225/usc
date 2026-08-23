// js/layout.js
function renderMenu(lang, base) {
  const data = getTrns();
  if (!data) return '';
  
  const path = location.pathname;
  let html = `<a class="brand-link" href="${base}index.html">${data.site.brand[lang] || data.site.brand.ru} · ${data.site.year}</a>`;
  html += data.menu.map(m => {
    var active = path.indexOf('/' + m.code + '/') !== -1 ? ' class="active"' : '';
    return `<a${active} href="${base}${m.code}/${m.code}.html">${m[lang] || m.en}</a>`;
  }).join('');
  return html;
}

function renderLangLinks(current) {
  return [{ code: 'en' }, { code: 'es' }, { code: 'fr' }, { code: 'ru' }].map(l =>
    `<a class="${l.code === current ? 'active' : ''}" data-lang="${l.code}">${l.code}</a>`
  ).join('');
}

async function buildChrome() {
  const body = document.body;
  const base = window.SITE_ROOT || './';
    
  // ЖЕМНЕЕ ЖДЕМ ЗАГРУЗКИ СЛОВАРЕЙ
  if (typeof loadTrns === 'function') {
    await loadTrns();
  }
  
  const data = getTrns();
  if (!data) return;

  const lang = document.documentElement.dataset.lang || 'ru';

  // Шапка
  let header = document.querySelector('.site-header');
  if (!header) {
    header = document.createElement('header');
    header.className = 'site-header';
    body.prepend(header);
  }

  if (body.classList.contains('gateway')) {
    header.innerHTML = `<button id="usc-theme-toggle">◐</button>`;
  } else {
    header.innerHTML = `
      <nav class="site-menu">${renderMenu(lang, base)}</nav>
      <nav class="lang-switch">${renderLangLinks(lang)}</nav>
      <button id="usc-theme-toggle">◐</button>`;
  }

  // Подвал
  let footer = document.querySelector('.site-footer');
  if (!footer) {
    footer = document.createElement('footer');
    footer.className = 'site-footer';
    body.append(footer);
  }
  footer.innerHTML = `
    <span>${data.footer[lang] || data.footer.en}</span>
    <a href="${data.site.telegram}" target="_blank" rel="noopener">Telegram</a>`;

  // Передаем кнопку темы в main.js для привязки логики
  const toggleBtn = document.getElementById('usc-theme-toggle');
  if (toggleBtn && typeof bindThemeToggle === 'function') {
    bindThemeToggle(toggleBtn);
  }
}

// Функция запуска
function initLayout() {
  if (document.body.dataset.inject === 'chrome') {
    buildChrome();
  }
}

// Умный запуск
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLayout);
} else {
  initLayout();
}

// Перестраиваем интерфейс при смене языка
window.addEventListener('langChanged', () => {
  buildChrome();
});