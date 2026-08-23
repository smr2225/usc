// js/trns.js
let TRNS_DATA = null;
let trnsPromise = null;

// Возвращает Promise. Если уже скачано - возвращает мгновенно.
function loadTrns() {
  if (!trnsPromise) {
    trnsPromise = (async () => {
      try {
        const base = document.body.dataset.base || '';
        const response = await fetch(base + 'asset/ui.json');
        TRNS_DATA = await response.json();
      } catch (e) {
        console.error('Ошибка загрузки ui.json:', e);
      }
    })();
  }
  return trnsPromise;
}

function getTrns() {
  return TRNS_DATA;
}

function initLangSwitcher() {
  document.body.addEventListener('click', (e) => {
    const langLink = e.target.closest('.lang-switch a');
    if (langLink) {
      e.preventDefault();
      const newLang = langLink.dataset.lang;
      try { localStorage.setItem('usc-lang', newLang); } catch (e) {}
      document.documentElement.lang = newLang;
      document.documentElement.dataset.lang = newLang;
      
      document.querySelectorAll('.lang-switch a').forEach(a => a.classList.remove('active'));
      langLink.classList.add('active');
      
      // Оповещаем локальные скрипты (cnst, clnd) о смене языка
      window.dispatchEvent(new CustomEvent('langChanged', { detail: newLang }));
    }
  });
}

// Запускаем скачивание словаря сразу при загрузке файла
loadTrns();

// Умный запуск слушателя кликов
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLangSwitcher);
} else {
  initLangSwitcher();
}