// dscn/dscn.js
// Заглушка Обсуждений. Загружает dscn.json и подставляет тексты.
// При смене языка — пере-рендер.

let dscnData = null;

async function loadDscnData() {
  try {
    const response = await fetch('dscn.json');
    dscnData = await response.json();
  } catch (e) {
    console.error('Ошибка загрузки dscn.json:', e);
  }
}

function getText(id, lang) {
  if (!dscnData) return '';
  const item = dscnData.find(x => x.id === id);
  return item ? (item[lang] || item.ru || '') : '';
}

function renderDscn(lang) {
  if (!dscnData) return;
  const title = getText('title', lang);
  document.title = `ССГ 2222 — ${title}`;
  document.getElementById('tr-title').textContent = title;
  document.getElementById('tr-subtitle').textContent = getText('subtitle', lang);
  document.getElementById('tr-text').textContent = getText('text', lang);
}

window.addEventListener('langChanged', (e) => {
  renderDscn(e.detail);
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadDscnData();
  const lang = document.documentElement.dataset.lang || 'ru';
  renderDscn(lang);
});
