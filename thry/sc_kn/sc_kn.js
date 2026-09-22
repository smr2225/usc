// thry/sc_kn/sc_kn.js
let scData = null;

async function loadScData() {
  try {
    const response = await fetch('sc_kn.json');
    scData = await response.json();
  } catch (e) {
    console.error('Load error:', e);
  }
}

function getText(id, lang) {
  if (!scData) return '';
  const item = scData.find(x => x.id === id);
  return item ? (item[lang] || item.ru || '') : '';
}

function renderSc(lang) {
  if (!scData) return;
  
  const title = getText('title', lang);
  document.title = `ССГ 2222 — ${title}`;
  document.getElementById('tr-title').textContent = title;
  document.getElementById('tr-subtitle').textContent = getText('subtitle', lang);

  // Кнопка возврата
  const backLink = document.getElementById('tr-back');
  if (backLink) {
    backLink.textContent = getText('back', lang);
    backLink.href = '../thry.html';
  }

  const container = document.getElementById('sc-content');
  let html = '';

  scData.forEach(item => {
    if (item.id === 'title' || item.id === 'subtitle' || item.id === 'back') return;
    
    const txt = item[lang] || item.ru || '';
    if (item.id.startsWith('sec_')) {
      html += `<h2 class="sc-sec-title">${txt}</h2>`;
    } else if (item.id.startsWith('sc_')) {
      // Извлекаем номер из ID (например, sc_01 -> 1)
      const numMatch = item.id.match(/^sc_0*(\d+)$/);
      const num = numMatch ? numMatch[1] : '';
      // Оборачиваем в flex-контейнер для ровного выравнивания текста
      html += `<div class="sc-item"><span class="sc-num">${num}.</span><span class="sc-text">${txt}</span></div>`;
    }
  });
  
  container.innerHTML = html;
}

window.addEventListener('langChanged', (e) => {
  renderSc(e.detail);
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadScData();
  const lang = document.documentElement.dataset.lang || 'ru';
  renderSc(lang);
});