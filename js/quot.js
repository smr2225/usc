// js/quot.js
let QUOTES_DATA = [];

async function loadQuotes() {
  if (QUOTES_DATA.length > 0) return;
  try {
    const base = window.SITE_ROOT || '';
    const response = await fetch(base + 'asset/quot.json');
    QUOTES_DATA = await response.json();
  } catch (e) {
    console.error('Ошибка загрузки quot.json:', e);
  }
}

function pickQuotes(n, key) {
  if (QUOTES_DATA.length === 0) return [];
  var lastKey = 'usc-q-' + key, last = [];
  try { last = JSON.parse(localStorage.getItem(lastKey)) || []; } catch (e) {}
  var source = QUOTES_DATA.map((_, i) => i).filter(i => last.indexOf(i) === -1);
  if (source.length < n) source = QUOTES_DATA.map((_, i) => i);
  var idxs = [];
  while (idxs.length < n && source.length) {
    idxs.push(source.splice(Math.floor(Math.random() * source.length), 1)[0]);
  }
  try { localStorage.setItem(lastKey, JSON.stringify(idxs)); } catch (e) {}
  return idxs.map(i => QUOTES_DATA[i]);
}

function injectEpigraph() {
  var target = document.querySelector('.hero-epigraph');
  if (!target) return; 
  var lang = document.documentElement.dataset.lang || 'ru';
  var q = pickQuotes(1, 'ep')[0];
  if (q) target.textContent = '«' + (q[lang] || q.ru) + '»';
}

async function initGateway() {
  await loadQuotes();
  var qs = pickQuotes(4, 'gw');
  document.querySelectorAll('.gw-quote').forEach((a, i) => {
    var text = a.querySelector('.gw-text');
    if (qs[i] && text) text.textContent = qs[i][a.dataset.lang] || qs[i].ru;
    a.addEventListener('click', e => {
      e.preventDefault();
      try { localStorage.setItem('usc-lang', a.dataset.lang); } catch (e) {}
      location.href = a.getAttribute('href');
    });
  });
}

async function init() {
  await loadQuotes();
  if (document.body.classList.contains('gateway')) {
    initGateway();
  }
  injectEpigraph();
}

// Умный запуск
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('langChanged', () => {
  injectEpigraph();
});