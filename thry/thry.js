// thry/thry.js
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

  const linksBox = document.getElementById('tr-links');
  if (linksBox) {
    const links = [
      { url: 'sc_kn/sc_kn.html', id: 'link_sc_kn' }
    ];
    linksBox.innerHTML = links.map(l => 
      `<li><a href="${l.url}" class="thry-link">${getText(l.id, lang)}</a></li>`
    ).join('');
  }
}

window.addEventListener('langChanged', (e) => {
  renderThry(e.detail);
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadThryData();
  const lang = document.documentElement.dataset.lang || 'ru';
  renderThry(lang);
});