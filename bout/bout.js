// thry.js (Замени thry на код папки)
let stubData = null;

async function loadData() {
  try {
    const response = await fetch('bout.json'); // Замени thry.json
    stubData = await response.json();
  } catch (e) {
    console.error('Ошибка загрузки данных:', e);
  }
}

function getText(id, lang) {
  if (!stubData) return '';
  const item = stubData.find(x => x.id === id);
  return item ? (item[lang] || item.ru) : '';
}

function renderStub(lang) {
  const title = getText('title', lang);
  document.title = `ССГ 2222 — ${title}`;
  document.getElementById('tr-title').textContent = title;
  document.getElementById('tr-subtitle').textContent = getText('subtitle', lang);
  document.getElementById('tr-text').textContent = getText('text', lang);
}

window.addEventListener('langChanged', (e) => {
  renderStub(e.detail);
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  const lang = document.documentElement.dataset.lang || 'ru';
  renderStub(lang);
});