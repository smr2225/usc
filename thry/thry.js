// thry/thry.js
// Заглушка Диамата. Загружает thry.json и подставляет тексты.
// При смене языка — пере-рендер.

let thryData = null;

async function loadThryData() {
  try {
    const response = await fetch('thry.json');
    thryData = await response.json();
  } catch (e) {
    console.error('Ошибка загрузки thry.json:', e);
  }
}

function getText(id, lang) {
  if (!thryData) return '';
  const item = thryData.find(x => x.id === id);
  return item ? (item[lang] || item.ru || '') : '';
}

function renderThry(lang) {
  if (!thryData) return;
  const title = getText('title', lang);
  document.title = `ССГ 2222 — ${title}`;
  document.getElementById('tr-title').textContent = title;
  document.getElementById('tr-subtitle').textContent = getText('subtitle', lang);
  document.getElementById('tr-text').textContent = getText('text', lang);
}

window.addEventListener('langChanged', (e) => {
  renderThry(e.detail);
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadThryData();
  const lang = document.documentElement.dataset.lang || 'ru';
  renderThry(lang);
});
