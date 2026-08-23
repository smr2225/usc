// js/ui.js
let UI_DATA = null;

async function loadUiData() {
  if (UI_DATA) return UI_DATA;
  try {
    const base = document.body.dataset.base || '';
    const response = await fetch(base + 'asset/ui.json');
    UI_DATA = await response.json();
    return UI_DATA;
  } catch (e) {
    console.error('Ошибка загрузки ui.json:', e);
    return null;
  }
}

function bgLabels() {
  var m = document.documentElement.dataset.lang || 'ru';
  return (UI_DATA && UI_DATA.bg_labels[m]) || ['Light', 'Dark'];
}

function menuLinks(lang, base) {
  var path = location.pathname;
  var html = `<a class="brand-link" href="${base}index.html">${UI_DATA.site.brand[lang] || UI_DATA.site.brand.ru} · ${UI_DATA.site.year}</a>`;
  html += UI_DATA.menu.map(m => {
    var active = path.indexOf('/' + m.code + '/') !== -1 ? ' class="active"' : '';
    return `<a${active} href="${base}${m.code}/${m.code}.html">${m[lang] || m.en}</a>`;
  }).join('');
  return html;
}

function langLinks(current) {
  return [{ code: 'en' }, { code: 'es' }, { code: 'fr' }, { code: 'ru' }].map(l =>
    `<a class="${l.code === current ? 'active' : ''}" data-lang="${l.code}">${l.code}</a>`
  ).join('');
}

function injectChrome() {
  const body = document.body;
  const lang = document.documentElement.dataset.lang || 'ru';
  const base = body.dataset.base !== undefined ? body.dataset.base : './';
  const site = UI_DATA.site;

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
      <nav class="site-menu">${menuLinks(lang, base)}</nav>
      <nav class="lang-switch">${langLinks(lang)}</nav>
      <button id="usc-theme-toggle">◐</button>`;
  }

  let footer = document.querySelector('.site-footer');
  if (!footer) {
    footer = document.createElement('footer');
    footer.className = 'site-footer';
    body.append(footer);
  }
  footer.innerHTML = `
    <span>${UI_DATA.footer[lang] || UI_DATA.footer.en}</span>
    <a href="${site.telegram}" target="_blank" rel="noopener">Telegram</a>`;

  const toggleBtn = document.getElementById('usc-theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      let cur = document.documentElement.getAttribute('data-theme');
      cur = (cur === 'dark') ? 'light' : 'dark';
      try { localStorage.setItem('usc-theme', cur); } catch (e) {}
      document.documentElement.setAttribute('data-theme', cur);
      if (typeof pickBackground === 'function') pickBackground(cur);
      this.title = bgLabels()[cur === 'dark' ? 0 : 1];
    });
  }
}

// Перехват кликов по кнопкам языка
document.body.addEventListener('click', (e) => {
  const langLink = e.target.closest('.lang-switch a');
  if (langLink) {
    e.preventDefault();
    const newLang = langLink.dataset.lang;
    try { localStorage.setItem('usc-lang', newLang); } catch (e) {}
    document.documentElement.lang = newLang;
    document.documentElement.dataset.lang = newLang;
    
    // Перестраиваем интерфейс на новом языке
    injectChrome();
    
    // Оповещаем локальные скрипты (svts, clnd) о смене языка
    window.dispatchEvent(new CustomEvent('langChanged', { detail: newLang }));
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadUiData();
  if (document.body.dataset.inject === 'chrome') {
    injectChrome();
  }
});