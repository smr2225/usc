// game/game.js
// Каталог игр. Загружает game.json и подставляет тексты карточек.
// При смене языка — пере-рендер.

let gameData = null;

async function loadGameData() {
  try {
    const response = await fetch('game.json');
    gameData = await response.json();
  } catch (e) {
    console.error('Ошибка загрузки game.json:', e);
  }
}

function getText(id, lang) {
  if (!gameData) return '';
  const item = gameData.find(x => x.id === id);
  return item ? (item[lang] || item.ru || '') : '';
}

function renderGame(lang) {
  if (!gameData) return;
  const title = getText('title', lang);
  document.title = `ССГ 2222 — ${title}`;
  document.getElementById('tr-title').textContent = title;
  document.getElementById('tr-subtitle').textContent = getText('subtitle', lang);
  document.getElementById('tr-card_icsa_name').textContent = getText('card_icsa_name', lang);
  document.getElementById('tr-card_icsa_desc').textContent = getText('card_icsa_desc', lang);
  document.getElementById('tr-card_smrs_name').textContent = getText('card_smrs_name', lang);
  document.getElementById('tr-card_smrs_desc').textContent = getText('card_smrs_desc', lang);
  document.getElementById('tr-card_klds_name').textContent = getText('card_klds_name', lang);
  document.getElementById('tr-card_klds_desc').textContent = getText('card_klds_desc', lang);
  document.getElementById('tr-card_more_name').textContent = getText('card_more_name', lang);
  document.getElementById('tr-card_more_desc').textContent = getText('card_more_desc', lang);
}

window.addEventListener('langChanged', (e) => {
  renderGame(e.detail);
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadGameData();
  const lang = document.documentElement.dataset.lang || 'ru';
  renderGame(lang);
});
