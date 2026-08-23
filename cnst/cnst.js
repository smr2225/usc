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

// Удаление дублирующихся заголовков/номеров в начале текста
function cleanText(text) {
    if (!text) return '';
    let cleaned = text.replace(/^Статья\s*\d+\.\s*/i, '');
    cleaned = cleaned.replace(/^\d+\.\d+\.\s*/, '');
    cleaned = cleaned.replace(/^Преамбула\.\s*/i, '');
    return cleaned.trim();
}

function renderConstitution(lang) {
    if (!cnstData) return;
    
    const titleText = getText('title', lang);
    // Добавили точку после слова Конституция
    const titlePrefix = { ru: "Конституция. ", en: "Constitution. ", es: "Constitución. ", fr: "Constitution. " };
    const fullTitle = (titlePrefix[lang] || titlePrefix.ru) + titleText;
    
    // Меняем заголовок вкладки браузера
    document.title = `ССГ 2222 — ${fullTitle}`;
    document.getElementById('tr-title').textContent = fullTitle;

    // Заголовок полной редакции
    const fullTitleLabel = { ru: "Полная редакция", en: "Full Edition", es: "Edición Completa", fr: "Édition Complète" };
    document.getElementById('tr-full-title').textContent = fullTitleLabel[lang] || fullTitleLabel.ru;

    const shortContent = document.getElementById('cnst-short-content');
    const fullContent = document.getElementById('cnst-full-content');
    shortContent.innerHTML = '';
    fullContent.innerHTML = '';

    const preambleLabel = { ru: "Преамбула", en: "Preamble", es: "Preámbulo", fr: "Préambule" };
    const articleLabel = { ru: "Статья", en: "Article", es: "Artículo", fr: "Article" };

    // 1. Рендер Краткой редакции (только статьи, формат h3, обернуты в ссылки)
    cnstData.forEach(item => {
        if (item.id === 'title') return;
        const text = cleanText(item[lang] || item.ru);

        if (item.id === 'preamble') {
            shortContent.innerHTML += `<div class="cnst-block"><h3><a href="#preamble">${preambleLabel[lang] || preambleLabel.ru}. ${text}</a></h3></div>`;
        } else if (item.id.match(/^art\d+$/)) {
            const num = item.id.match(/^art(\d+)$/)[1];
            const labelText = `${articleLabel[lang] || articleLabel.ru} ${num}.`;
            shortContent.innerHTML += `<div class="cnst-block"><h3><a href="#${item.id}">${labelText} ${text}</a></h3></div>`;
        }
    });

    // 2. Рендер Полной редакции (статьи с id + пункты под ними)
    cnstData.forEach(item => {
        if (item.id === 'title') return;
        const text = cleanText(item[lang] || item.ru);

        const artMatch = item.id.match(/^art(\d+)$/);
        const pointMatch = item.id.match(/^art(\d+)_(\d+)$/);

        if (item.id === 'preamble') {
            fullContent.innerHTML += `<div class="cnst-block"><h3 id="preamble">${preambleLabel[lang] || preambleLabel.ru}. ${text}</h3></div>`;
        } else if (artMatch) {
            const num = artMatch[1];
            const labelText = `${articleLabel[lang] || articleLabel.ru} ${num}.`;
            fullContent.innerHTML += `<div class="cnst-block"><h3 id="${item.id}">${labelText} ${text}</h3></div>`;
        } else if (pointMatch) {
            const artNum = pointMatch[1];
            const pointNum = pointMatch[2];
            const numStr = `${artNum}.${pointNum}.`;
            
            const lastBlock = fullContent.lastChild;
            if (lastBlock && lastBlock.classList.contains('cnst-block')) {
                const p = document.createElement('div');
                p.className = 'cnst-point';
                p.innerHTML = `<span class="point-num">${numStr}</span><span class="point-text">${text}</span>`;
                lastBlock.appendChild(p);
            }
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