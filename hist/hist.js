// hist/hist.js
//
// Загружает hist.json, рендерит абзацы рассказа.
// При смене языка — пере-рендер без перезагрузки (как в svts.js).

let histData = null;
let lastBodyHTML = '';   // кэш HTML структуры (для переиспользования при смене языка)

async function loadHistData() {
  try {
    const response = await fetch('hist.json');
    histData = await response.json();
  } catch (e) {
    console.error('Ошибка загрузки hist.json:', e);
  }
}

function getText(id, lang) {
  if (!histData) return '';
  const item = histData.find(x => x.id === id);
  return item ? (item[lang] || item.ru || '') : '';
}

// Проверка, является ли абзац репликой диалога.
// Диалоги в разных языках начинаются с: «—», «-», «"», «"», «„», «"», ««», «'—'», «'-'».
function isDialogue(text) {
  if (!text) return false;
  const first = text.trim()[0];
  return ['—', '-', '–', '−', '"', '"', '„', '«', '"', "'"].includes(first);
}

function applyHistTranslations(lang) {
  // Метаданные
  const title = getText('title', lang);
  document.title = `ССГ 2222 — ${title}`;
  document.getElementById('tr-title').textContent = getText('subtitle', lang);
  document.getElementById('tr-category').textContent = getText('category', lang);
  document.getElementById('tr-story-title').textContent = title;
  document.getElementById('tr-story-subtitle').textContent = getText('subtitle', lang);

  // Тело рассказа
  const body = document.getElementById('hist-body');
  if (!body || !histData) return;

  // Если структуру ещё не построили — строим
  if (!lastBodyHTML) {
    const paragraphs = histData.filter(x => x.id.startsWith('p'));
    const html = paragraphs.map(p => {
      const cls = isDialogue(p[lang] || p.ru) ? 'dialogue' : '';
      return `<p class="${cls}" data-id="${p.id}">${p[lang] || p.ru || ''}</p>`;
    }).join('');
    body.innerHTML = html;
    lastBodyHTML = html;
  } else {
    // Только обновляем текст в существующих <p>
    const paragraphs = histData.filter(x => x.id.startsWith('p'));
    paragraphs.forEach(p => {
      const el = body.querySelector(`[data-id="${p.id}"]`);
      if (!el) return;
      const text = p[lang] || p.ru || '';
      el.textContent = text;
      // Перепроверим класс dialogue (мог измениться, т.к. в разных языках
      // диалоги могут начинаться с разных символов)
      if (isDialogue(text)) {
        el.classList.add('dialogue');
      } else {
        el.classList.remove('dialogue');
      }
    });
  }
}

window.addEventListener('langChanged', (e) => {
  applyHistTranslations(e.detail);
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadHistData();
  const lang = document.documentElement.dataset.lang || 'ru';
  applyHistTranslations(lang);
});
