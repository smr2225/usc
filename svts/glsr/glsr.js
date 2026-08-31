// glsr/glsr.js  (v2)
//
// Глоссарий. Источник: glsr.json — термины и сокращения из статьи 25
// Конституции + ГТО из рассказа «Командировка».
//
// Поддержка смены языка: при langChanged только обновляет textContent.

let glsrData = null;

async function loadGlsrData() {
  try {
    const response = await fetch('glsr.json');
    glsrData = await response.json();
  } catch (e) {
    console.error('Ошибка загрузки glsr.json:', e);
  }
}

function getText(id, lang) {
  if (!glsrData) return '';
  const item = glsrData.find(x => x.id === id);
  return item ? (item[lang] || item.ru || '') : '';
}

// Разбить "термин — определение" на две части.
// Возвращает { term, def }. Если " — " нет, def пустой.
function splitTermDef(text) {
  if (!text) return { term: '', def: '' };
  // Ищем первое " — " (с любым типом тире)
  const m = text.match(/^(.+?)\s*[—–-]\s+(.+)$/);
  if (m) return { term: m[1].trim(), def: m[2].trim() };
  return { term: text.trim(), def: '' };
}

function applyGlsrTranslations(lang) {
  if (!glsrData) return;

  // Метаданные
  const title = getText('title', lang);
  document.title = `ССГ 2222 — ${title}`;
  document.getElementById('tr-title').textContent = title;
  document.getElementById('tr-subtitle').textContent = getText('subtitle', lang);
  document.getElementById('tr-intro').textContent = getText('intro', lang);

  // Тело
  const body = document.getElementById('glsr-body');
  if (!body) return;

  // Если структура ещё не построена — строим
  if (!body.children.length) {
    const fragment = document.createDocumentFragment();
    glsrData.forEach(item => {
      if (item.id === 'title' || item.id === 'subtitle' || item.id === 'intro') return;

      if (item.type === 'section') {
        const h2 = document.createElement('h2');
        h2.className = 'glsr-section-title';
        h2.dataset.id = item.id;
        h2.textContent = item[lang] || item.ru;
        fragment.appendChild(h2);
      } else if (item.type === 'entry') {
        const { term, def } = splitTermDef(item[lang] || item.ru);
        const div = document.createElement('div');
        div.className = 'glsr-entry';
        div.dataset.id = item.id;
        if (def) {
          div.innerHTML = `<span class="glsr-term"></span><span class="glsr-def"></span>`;
          div.querySelector('.glsr-term').textContent = term + ' — ';
          div.querySelector('.glsr-def').textContent = def;
        } else {
          div.innerHTML = `<span class="glsr-term"></span>`;
          div.querySelector('.glsr-term').textContent = term;
        }
        fragment.appendChild(div);
      }
    });
    body.appendChild(fragment);
  } else {
    // Только обновляем тексты в существующих элементах
    glsrData.forEach(item => {
      if (item.id === 'title' || item.id === 'subtitle' || item.id === 'intro') return;
      const el = body.querySelector(`[data-id="${item.id}"]`);
      if (!el) return;
      const text = item[lang] || item.ru;
      if (item.type === 'section') {
        el.textContent = text;
      } else if (item.type === 'entry') {
        const { term, def } = splitTermDef(text);
        if (def) {
          if (!el.querySelector('.glsr-term')) {
            el.innerHTML = `<span class="glsr-term"></span><span class="glsr-def"></span>`;
          }
          el.querySelector('.glsr-term').textContent = term + ' — ';
          el.querySelector('.glsr-def').textContent = def;
        } else {
          el.innerHTML = `<span class="glsr-term"></span>`;
          el.querySelector('.glsr-term').textContent = term;
        }
      }
    });
  }
}

window.addEventListener('langChanged', (e) => {
  applyGlsrTranslations(e.detail);
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadGlsrData();
  const lang = document.documentElement.dataset.lang || 'ru';
  applyGlsrTranslations(lang);
});
