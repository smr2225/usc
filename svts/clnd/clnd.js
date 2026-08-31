// clnd/clnd.js
let clndData = null;

async function loadClndData() {
  try {
    const response = await fetch('clnd.json');
    clndData = await response.json();
  } catch (e) {
    console.error('Ошибка загрузки clnd.json:', e);
  }
}

function getText(id, lang) {
  if (!clndData) return '';
  const item = clndData.find(x => x.id === id);
  return item ? (item[lang] || item.ru) : '';
}

function applyClndTranslations(lang) {
  const ids = ["clnd-title", "clnd-epoch", "clnd-col1-title", "clnd-col1-text", "clnd-col2-title", "clnd-col2-text", "clnd-col3-title", "clnd-col3-text", "clnd-col4-title", "clnd-col4-text"];
  ids.forEach(id => {
    const el = document.getElementById('tr-' + id);
    if (el) el.textContent = getText(id, lang);
  });
}

function generateCalendar(lang) {
  const grid = document.getElementById('clnd-grid');
  if (!grid || !clndData) return;
  grid.innerHTML = '';

  const monthsArr = getText('months', lang);
  const weekdaysArr = getText('weekdays', lang);
  // Короткие месяцы: Январь (1), Май (5), Ноябрь (11). В массиве они под индексами 1, 5, 11 (т.к. Декабрь сдвинулся в начало)
  const shortMonths = [1, 5, 11]; 

  for (let m = 0; m < 12; m++) {
    const daysInMonth = shortMonths.includes(m) ? 55 : 56;
    
    const monthEl = document.createElement('div');
    monthEl.className = 'clnd-month';
    
    const headerEl = document.createElement('div');
    headerEl.className = 'clnd-month-header';
    headerEl.innerHTML = `<span class="clnd-month-name">${monthsArr[m]}</span>`;
    monthEl.appendChild(headerEl);

    const weekdaysEl = document.createElement('div');
    weekdaysEl.className = 'clnd-weekdays';
    weekdaysArr.forEach(wd => {
      const wdSpan = document.createElement('span');
      wdSpan.textContent = wd;
      weekdaysEl.appendChild(wdSpan);
    });
    monthEl.appendChild(weekdaysEl);

    const daysEl = document.createElement('div');
    daysEl.className = 'clnd-days';
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'clnd-day';
      dayEl.textContent = d;
      
      let dayOfWeek = d % 7;
      if (dayOfWeek === 6 || dayOfWeek === 0) dayEl.classList.add('weekend');
      
      // Праздники: 1 Янв, 44 Мар, 14 Июл, 24 Окт
      if ((m === 1 && d === 1) || (m === 3 && d === 44) || (m === 7 && d === 14) || (m === 10 && d === 24)) {
        dayEl.classList.add('holiday');
      }
      
      daysEl.appendChild(dayEl);
    }
    monthEl.appendChild(daysEl);
    grid.appendChild(monthEl);
  }
}

function updateClnd(lang) {
    if (clndData) {
        applyClndTranslations(lang);
        generateCalendar(lang);
    }
}

window.addEventListener('langChanged', (e) => {
    updateClnd(e.detail);
});

document.addEventListener('DOMContentLoaded', async () => {
    await loadClndData();
    const lang = document.documentElement.dataset.lang || 'ru';
    updateClnd(lang);
});