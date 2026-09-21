// cnst/cnst.js
let cnstData = null;

async function loadCnstData() {
  try {
    const response = await fetch('cnst.json');
    cnstData = await response.json();
  } catch (e) {
    console.error('Ошибка загрузки cnst.json:', e);
  }
}

function getText(id, lang) {
  if (!cnstData) return '';
  const item = cnstData.find(x => x.id === id);
  return item ? (item[lang] || item.ru) : '';
}

// Чистим дублирующиеся номера в начале текста
function cleanText(text) {
  if (!text) return '';
  let cleaned = text.replace(/^Статья\s*\d+\.\s*/i, '');
  cleaned = cleaned.replace(/^\d+\.\d+\.\d+\.\s*/, ''); // Для 18.7.1.
  cleaned = cleaned.replace(/^\d+\.\d+\.\s*/, '');     // Для 18.7.
  cleaned = cleaned.replace(/^Преамбула\.\s*/i, '');
  return cleaned.trim();
}

function renderConstitution(lang) {
  if (!cnstData) return;

  const titleText = getText('title', lang);
  const titlePrefix = { ru: "Конституция. ", en: "Constitution. ", es: "Constitución. ", fr: "Constitution. " };
  const fullTitle = (titlePrefix[lang] || titlePrefix.ru) + titleText;

  document.title = `ССГ 2222 — ${fullTitle}`;
  document.getElementById('tr-title').textContent = fullTitle;

  const fullTitleLabel = { ru: "Полная редакция", en: "Full Edition", es: "Edición Completa", fr: "Édition Complète" };
  document.getElementById('tr-full-title').textContent = fullTitleLabel[lang] || fullTitleLabel.ru;

  const shortContent = document.getElementById('cnst-short-content');
  const fullContent = document.getElementById('cnst-full-content');
  shortContent.innerHTML = '';
  fullContent.innerHTML = '';

  const preambleLabel = { ru: "Преамбула", en: "Preamble", es: "Preámbulo", fr: "Préambule" };
  const articleLabel = { ru: "Статья", en: "Article", es: "Artículo", fr: "Article" };

  let currentBlock = null;

  cnstData.forEach(item => {
    if (item.id === 'title') return;
    const text = cleanText(item[lang] || item.ru);

    // Паттерны для определения уровня
    const artMatch = item.id.match(/^art(\d+)$/);
    const pointMatch = item.id.match(/^art(\d+)_(\d+)$/);
    const subPointMatch = item.id.match(/^art(\d+)_(\d+)_(\d+)$/);

    if (item.id === 'preamble') {
      // Краткая редакция
      shortContent.innerHTML += `<div class="cnst-block"><h3><a href="#preamble">${preambleLabel[lang] || preambleLabel.ru}. ${text}</a></h3></div>`;
      // Полная редакция
      currentBlock = document.createElement('div');
      currentBlock.className = 'cnst-block';
      currentBlock.innerHTML = `<h3 id="preamble">${preambleLabel[lang] || preambleLabel.ru}. ${text}</h3>`;
      fullContent.appendChild(currentBlock);

    } else if (artMatch) {
      const num = artMatch[1];
      const labelText = `${articleLabel[lang] || articleLabel.ru} ${num}.`;
      
      // Краткая редакция
      shortContent.innerHTML += `<div class="cnst-block"><h3><a href="#${item.id}">${labelText} ${text}</a></h3></div>`;
      // Полная редакция
      currentBlock = document.createElement('div');
      currentBlock.className = 'cnst-block';
      currentBlock.innerHTML = `<h3 id="${item.id}">${labelText} ${text}</h3>`;
      fullContent.appendChild(currentBlock);

    } else if (pointMatch) {
      const numStr = `${pointMatch[1]}.${pointMatch[2]}.`;
      const p = document.createElement('div');
      p.className = 'cnst-point';
      p.innerHTML = `<span class="point-num">${numStr}</span><span class="point-text">${text}</span>`;
      if (currentBlock) currentBlock.appendChild(p);

    } else if (subPointMatch) {
      const numStr = `${subPointMatch[1]}.${subPointMatch[2]}.${subPointMatch[3]}.`;
      const p = document.createElement('div');
      p.className = 'cnst-subpoint';
      p.innerHTML = `<span class="point-num">${numStr}</span><span class="point-text">${text}</span>`;
      if (currentBlock) currentBlock.appendChild(p);
    }
  });
}

window.addEventListener('langChanged', (e) => {
  renderConstitution(e.detail);
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadCnstData();
  const lang = document.documentElement.dataset.lang || 'ru';
  renderConstitution(lang);
});