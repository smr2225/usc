// svts/svts.js  (исправленная версия v2)
//
// ИЗМЕНЕНИЯ vs оригинала:
//  1. FIX: при смене языка телеметрия НЕ пересчитывается — только пере-
//     форматируются тексты с уже посчитанными значениями.
//  2. Для этого значения (radiation %, earthDist, ceresDist, tau, meteorIdx,
//     phobosVisible, deimosVisible) хранятся в объекте lastValues.
//  3. Функции calculate* разделены на расчёт (calculate*) и форматирование
//     (format*) — расчёт только при DOMContentLoaded, форматирование при
//     смене языка.

let svtsData = null;
let currentMarsHour = 12;
const lastValues = {}; // здесь хранятся последние посчитанные значения

async function loadSvtsData() {
  try {
    const response = await fetch('svts.json');
    svtsData = await response.json();
  } catch (e) {
    console.error('Ошибка загрузки svts.json:', e);
  }
}

function getText(id, lang) {
  if (!svtsData) return '';
  const item = svtsData.find(x => x.id === id);
  return item ? (item[lang] || item.ru) : '';
}

function applySvtsTranslations(lang) {
  const ids = ["title", "telemetry_global", "entry_time_label", "mars_rad", "mars_meteor", "mars_dust", "mars_sun", "mars_moons", "mars_dist", "access_title", "access_text", "roots_title", "roots_text"];
  ids.forEach(id => {
    const el = document.getElementById('tr-' + id);
    if (el) el.textContent = getText(id, lang);
  });
}

// === ВРЕМЯ ВХОДА ===
// Считаем один раз, пере-форматируем при смене языка.
function calculateEntryTime() {
    const now = new Date();
    const earthPeruMs = now.getTime() - (5 * 3600 * 1000);
    const earthPeru = new Date(earthPeruMs);
    earthPeru.setFullYear(2226);
    const earthIso = earthPeru.toISOString();
    lastValues.earthTimeStr = `${earthIso.substring(8,10)}.${earthIso.substring(5,7)}.${earthIso.substring(0,4)} ${earthIso.substring(11,16)}`;

    const epoch = new Date('2225-09-09T00:00:00Z').getTime();
    const diffMs = earthPeru.getTime() - epoch;
    const marsSolInMs = 1.02749125 * 24 * 3600 * 1000;
    const totalSols = diffMs / marsSolInMs;

    const marsYear = Math.floor(totalSols / 668.5);
    const solsIntoYear = totalSols % 668.5;
    const marsMonth = Math.floor(solsIntoYear / 55.7) + 1;
    const marsDay = Math.floor(solsIntoYear % 55.7) + 1;

    const safeDay = marsDay < 1 ? 1 : marsDay;
    const safeMonth = marsMonth < 1 ? 1 : marsMonth;
    lastValues.marsDateStr = `${String(safeDay).padStart(2, '0')}.${String(safeMonth).padStart(2, '0')}.${String(marsYear).padStart(4, '0')}`;

    const fractionalSol = totalSols - Math.floor(totalSols);
    const marsTimeOfDayMs = fractionalSol * 24 * 3600 * 1000;
    const marsTimeObj = new Date(marsTimeOfDayMs);
    lastValues.marsTimeStr = marsTimeObj.toISOString().substring(11, 16);

    currentMarsHour = marsTimeObj.getUTCHours() + (marsTimeObj.getUTCMinutes() / 60);
    formatEntryTime();
}
function formatEntryTime() {
    if (!lastValues.marsTimeStr) return;
    const lang = document.documentElement.dataset.lang || 'ru';
    const template = getText('entry_time_text', lang) || "{mars_time} / {earth_time}";
    document.getElementById('entry-time').textContent =
        template.replace('{mars_time}', lastValues.marsTimeStr)
                .replace('{mars_date}', lastValues.marsDateStr)
                .replace('{earth_time}', lastValues.earthTimeStr);
}

// === РАДИАЦИЯ ===
function calculateRadiation() {
    let current;
    if (currentMarsHour < 6 || currentMarsHour > 18) {
        current = Math.floor(5 + Math.random() * 15);
    } else {
        current = Math.floor(100 + Math.random() * 250);
    }
    lastValues.radCurrent = current;
    formatRadiation();
}
function formatRadiation() {
    if (lastValues.radCurrent === undefined) return;
    const lang = document.documentElement.dataset.lang || 'ru';
    const labels = { ru: "от нормы", en: "of norm", es: "de la norma", fr: "de la norme" };
    document.getElementById('mars-rad').textContent =
        `${lastValues.radCurrent}% ${labels[lang] || labels.ru}`;
}

// === СОЛНЦЕ ===
function calculateSunInclination() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const declination = 25 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 668);
    const hourAngle = (currentMarsHour - 12) * 15;
    let elevation = Math.sin(hourAngle * Math.PI / 180) * 90;
    let totalElevation = elevation + declination;
    if (totalElevation > 90) totalElevation = 90;
    if (totalElevation < -90) totalElevation = -90;
    lastValues.sunElevation = totalElevation;
    formatSunInclination();
}
function formatSunInclination() {
    if (lastValues.sunElevation === undefined) return;
    document.getElementById('mars-sun').textContent = `${lastValues.sunElevation.toFixed(1)}°`;
}

// === СПУТНИКИ ===
function calculateMoons() {
    const hour = new Date().getHours();
    lastValues.phobosVisible = hour % 4 < 2;
    lastValues.deimosVisible = hour % 8 < 4;
    formatMoons();
}
function formatMoons() {
    if (lastValues.phobosVisible === undefined) return;
    const lang = document.documentElement.dataset.lang || 'ru';
    const labels = {
        ru: { phobos: "Фобос", deimos: "Деймос", visible: "виден", hidden: "за горизонтом" },
        en: { phobos: "Phobos", deimos: "Deimos", visible: "visible", hidden: "below horizon" },
        es: { phobos: "Fobos", deimos: "Deimos", visible: "visible", hidden: "bajo el horizonte" },
        fr: { phobos: "Phobos", deimos: "Deimos", visible: "visible", hidden: "sous l'horizon" }
    };
    const L = labels[lang] || labels.ru;
    document.getElementById('mars-moons').textContent =
        `${L.phobos}: ${lastValues.phobosVisible ? L.visible : L.hidden} | ${L.deimos}: ${lastValues.deimosVisible ? L.visible : L.hidden}`;
}

// === ДИСТАНЦИЯ ===
function calculateDistance() {
    lastValues.earthDist = (54.6 + Math.random() * 346.4).toFixed(1);
    lastValues.earthDelay = (lastValues.earthDist * 1000000 / 299792.458).toFixed(1);
    lastValues.ceresDist = (150 + Math.random() * 100).toFixed(1);
    lastValues.ceresDelay = (lastValues.ceresDist * 1000000 / 299792.458).toFixed(1);
    formatDistance();
}
function formatDistance() {
    if (lastValues.earthDist === undefined) return;
    document.getElementById('mars-dist').innerHTML =
        `Земля: ${lastValues.earthDist} млн км (${lastValues.earthDelay} с)<br>Церера: ${lastValues.ceresDist} млн км (${lastValues.ceresDelay} с)`;
}

// === МЕТЕОРИТЫ ===
function calculateMeteor() {
    lastValues.meteorIdx = Math.floor(Math.random() * 4);
    formatMeteor();
}
function formatMeteor() {
    if (lastValues.meteorIdx === undefined) return;
    const lang = document.documentElement.dataset.lang || 'ru';
    const levels = {
      ru: ["Низкая", "Умеренная", "Повышенная", "Внимание: рой"],
      en: ["Low", "Moderate", "Elevated", "Attention: swarm"],
      es: ["Baja", "Moderada", "Elevada", "Atención: enjambre"],
      fr: ["Faible", "Modérée", "Élevée", "Attention: essaim"]
    };
    const activeLevels = levels[lang] || levels.ru;
    document.getElementById('mars-meteor').textContent = activeLevels[lastValues.meteorIdx];
}

// === ПЫЛЬ ===
function calculateDust() {
    const tau = (Math.random() * 5).toFixed(2);
    lastValues.tau = tau;
    let statusIdx = 0;
    if (tau > 1) statusIdx = 2;
    else if (tau > 0.5) statusIdx = 1;
    lastValues.dustStatusIdx = statusIdx;
    formatDust();
}
function formatDust() {
    if (lastValues.tau === undefined) return;
    const lang = document.documentElement.dataset.lang || 'ru';
    const statuses = {
      ru: ["Ясно", "Дымка", "Пыльная буря"],
      en: ["Clear", "Haze", "Dust storm"],
      es: ["Claro", "Neblina", "Tormenta de polvo"],
      fr: ["Clair", "Brume", "Tempête de poussière"]
    };
    const activeStatuses = statuses[lang] || statuses.ru;
    document.getElementById('mars-dust').textContent =
        `τ ${lastValues.tau} (${activeStatuses[lastValues.dustStatusIdx]})`;
}

// === ОБРАБОТЧИКИ ===
// FIX: при смене языка только пере-форматируем. Без пересчёта.
window.addEventListener('langChanged', (e) => {
    const lang = e.detail;
    applySvtsTranslations(lang);
    formatEntryTime();
    formatRadiation();
    formatSunInclination();
    formatMoons();
    formatDistance();
    formatMeteor();
    formatDust();
});

document.addEventListener('DOMContentLoaded', async () => {
    await loadSvtsData();
    const lang = document.documentElement.dataset.lang || 'ru';
    applySvtsTranslations(lang);
    // Первый (и единственный) расчёт всех значений
    calculateEntryTime();
    calculateRadiation();
    calculateSunInclination();
    calculateMoons();
    calculateDistance();
    calculateMeteor();
    calculateDust();
});
