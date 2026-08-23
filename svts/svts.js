// svts/svts.js
let svtsData = null;
let currentMarsHour = 12; // Глобальная переменная для часа Марса

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

function calculateEntryTime() {
    const lang = document.documentElement.dataset.lang || 'ru';
    const now = new Date();
    
    // Земное время (Перуаньское, UTC-5).
    const earthPeruMs = now.getTime() - (5 * 3600 * 1000);
    const earthPeru = new Date(earthPeruMs);
    earthPeru.setFullYear(2226); // Гарантируем год после начала эпохи ССГ
    const earthIso = earthPeru.toISOString();
    const earthTimeStr = `${earthIso.substring(8,10)}.${earthIso.substring(5,7)}.${earthIso.substring(0,4)} ${earthIso.substring(11,16)}`;
    
    // Марсианская эпоха: 09.09.2225 (0 меридиан, гора Олимп)
    const epoch = new Date('2225-09-09T00:00:00Z').getTime();
    const diffMs = earthPeru.getTime() - epoch;
    
    // Марсианские сутки = 1.02749125 земных суток
    const marsSolInMs = 1.02749125 * 24 * 3600 * 1000;
    const totalSols = diffMs / marsSolInMs;
    
    // Расчет даты
    const marsYear = Math.floor(totalSols / 668.5);
    const solsIntoYear = totalSols % 668.5;
    const marsMonth = Math.floor(solsIntoYear / 55.7) + 1;
    const marsDay = Math.floor(solsIntoYear % 55.7) + 1;
    
    const safeDay = marsDay < 1 ? 1 : marsDay;
    const safeMonth = marsMonth < 1 ? 1 : marsMonth;
    const marsDateStr = `${String(safeDay).padStart(2, '0')}.${String(safeMonth).padStart(2, '0')}.${String(marsYear).padStart(4, '0')}`;
    
    // Расчет марсианского времени
    const fractionalSol = totalSols - Math.floor(totalSols);
    const marsTimeOfDayMs = fractionalSol * 24 * 3600 * 1000;
    const marsTimeObj = new Date(marsTimeOfDayMs);
    const marsTimeStr = marsTimeObj.toISOString().substring(11, 16); // Формат HH:MM
    
    // Сохраняем час для других расчетов (радиация, солнце)
    currentMarsHour = marsTimeObj.getUTCHours() + (marsTimeObj.getUTCMinutes() / 60);
    
    const template = getText('entry_time_text', lang) || "{mars_time} / {earth_time}";
    document.getElementById('entry-time').textContent = template.replace('{mars_time}', marsTimeStr).replace('{mars_date}', marsDateStr).replace('{earth_time}', earthTimeStr);
}

function calculateRadiation() {
    const lang = document.documentElement.dataset.lang || 'ru';
    const labels = { ru: "от нормы", en: "of norm", es: "de la norma", fr: "de la norme" };
    
    // Если ночь (с 18:00 до 06:00), радиация падает до фоновых значений
    let current;
    if (currentMarsHour < 6 || currentMarsHour > 18) {
        current = Math.floor(5 + Math.random() * 15); // 5-20% ночью
    } else {
        current = Math.floor(100 + Math.random() * 250); // 100-350% днем
    }
    
    document.getElementById('mars-rad').textContent = `${current}% ${labels[lang] || labels.ru}`;
}

function calculateSunInclination() {
    // Сезонное наклонение (от -25 до +25)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const declination = 25 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 668);
    
    // Высота Солнца над горизонтом (для экватора, 1 кластер)
    // В 12:00 - максимум, в 00:00 - минимум (под горизонтом)
    const hourAngle = (currentMarsHour - 12) * 15; // 15 градусов в час
    let elevation = Math.sin(hourAngle * Math.PI / 180) * 90; // Упрощенная модель высоты
    
    // Складываем с сезонным наклонением
    let totalElevation = elevation + declination;
    if (totalElevation > 90) totalElevation = 90;
    if (totalElevation < -90) totalElevation = -90;
    
    document.getElementById('mars-sun').textContent = `${totalElevation.toFixed(1)}°`;
}

function calculateMoons() {
    const lang = document.documentElement.dataset.lang || 'ru';
    const hour = new Date().getHours();
    const phobosVisible = hour % 4 < 2;
    const deimosVisible = hour % 8 < 4;
    const labels = {
        ru: { phobos: "Фобос", deimos: "Деймос", visible: "виден", hidden: "за горизонтом" },
        en: { phobos: "Phobos", deimos: "Deimos", visible: "visible", hidden: "below horizon" },
        es: { phobos: "Fobos", deimos: "Deimos", visible: "visible", hidden: "bajo el horizonte" },
        fr: { phobos: "Phobos", deimos: "Deimos", visible: "visible", hidden: "sous l'horizon" }
    };
    const L = labels[lang] || labels.ru;
    document.getElementById('mars-moons').textContent = `${L.phobos}: ${phobosVisible ? L.visible : L.hidden} | ${L.deimos}: ${deimosVisible ? L.visible : L.hidden}`;
}

function calculateDistance() {
    const lang = document.documentElement.dataset.lang || 'ru';
    // Земля: от 54.6 до 401 млн км
    const earthDist = (54.6 + Math.random() * 346.4).toFixed(1);
    const earthDelay = (earthDist * 1000000 / 299792.458).toFixed(1);
    
    // Церера (главный пояс)
    const ceresDist = (150 + Math.random() * 100).toFixed(1);
    const ceresDelay = (ceresDist * 1000000 / 299792.458).toFixed(1);
    
    document.getElementById('mars-dist').innerHTML = `Земля: ${earthDist} млн км (${earthDelay} с)<br>Церера: ${ceresDist} млн км (${ceresDelay} с)`;
}

function calculateMeteor() {
    const lang = document.documentElement.dataset.lang || 'ru';
    const levels = {
      ru: ["Низкая", "Умеренная", "Повышенная", "Внимание: рой"],
      en: ["Low", "Moderate", "Elevated", "Attention: swarm"],
      es: ["Baja", "Moderada", "Elevada", "Atención: enjambre"],
      fr: ["Faible", "Modérée", "Élevée", "Attention: essaim"]
    };
    const activeLevels = levels[lang] || levels.ru;
    document.getElementById('mars-meteor').textContent = activeLevels[Math.floor(Math.random() * activeLevels.length)];
}

function calculateDust() {
    const lang = document.documentElement.dataset.lang || 'ru';
    const tau = (Math.random() * 5).toFixed(2);
    const statuses = {
      ru: ["Ясно", "Дымка", "Пыльная буря"],
      en: ["Clear", "Haze", "Dust storm"],
      es: ["Claro", "Neblina", "Tormenta de polvo"],
      fr: ["Clair", "Brume", "Tempête de poussière"]
    };
    const activeStatuses = statuses[lang] || statuses.ru;
    let status = activeStatuses[0];
    if (tau > 1) status = activeStatuses[2];
    else if (tau > 0.5) status = activeStatuses[1];
    document.getElementById('mars-dust').textContent = `τ ${tau} (${status})`;
}

window.addEventListener('langChanged', (e) => {
    const lang = e.detail;
    applySvtsTranslations(lang);
    calculateEntryTime(); // Сначала считаем время, чтобы обновить currentMarsHour
    calculateRadiation();
    calculateSunInclination();
    calculateMoons();
    calculateDistance();
    calculateMeteor();
    calculateDust();
});

document.addEventListener('DOMContentLoaded', async () => {
    await loadSvtsData();
    const lang = document.documentElement.dataset.lang || 'ru';
    
    applySvtsTranslations(lang);
    calculateEntryTime(); // Сначала считаем время, чтобы обновить currentMarsHour
    calculateRadiation();
    calculateSunInclination();
    calculateMoons();
    calculateDistance();
    calculateMeteor();
    calculateDust();
});