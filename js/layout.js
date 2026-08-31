// js/layout.js  (исправленная версия v3)
//
// ИЗМЕНЕНИЯ vs v2:
//  5. Состояние .open меню хранится в localStorage (переживает перезагрузку
//     и гонку langChanged vs DOMContentLoaded). Фиксит «меню теряется».
//  6. При langChanged больше НЕ перерисовываем меню целиком — обновляем только
//     тексты пунктов через reRenderMenuTexts(), сохраняя классы .open/.active.

function renderMenuItems(lang, base) {
  const data = getTrns();
  if (!data) return '';
  const path = location.pathname;
  let items = [];

  const homeActive = (path === base || path === base + 'index.html') ? 'active' : '';
  items.push(`<a class="${homeActive}" href="${base}index.html">${data.site.brand[lang] || data.site.brand.en} · ${data.site.year}</a>`);

  data.menu.forEach(m => {
    const isParentActive = path.indexOf('/' + m.code + '/') !== -1;
    const parentHref = `${base}${m.code}/${m.code}.html`;

    if (m.children && m.children.length) {
      let subHtml = m.children.map(c => {
        const href = `${base}${m.code}/${c.code}/${c.code}.html`;
        const isActive = path.indexOf('/' + m.code + '/' + c.code + '/') !== -1;
        return `<a class="${isActive ? 'active' : ''}" href="${href}">${c[lang] || c.en}</a>`;
      }).join('');

      items.push(`<div class="menu-group ${isParentActive ? 'parent-active' : ''}">
                <div class="parent-row">
                  <a class="${isParentActive ? 'active' : ''}" href="${parentHref}">${m[lang] || m.en}</a>
                  <button class="sub-toggle" type="button">❯</button>
                </div>
                <div class="submenu">${subHtml}</div>
              </div>`);
    } else {
      items.push(`<a class="${isParentActive ? 'active' : ''}" href="${parentHref}">${m[lang] || m.en}</a>`);
    }
  });
  return items.join('');
}

function renderLangLinks(current) {
  return [{ code: 'en' }, { code: 'es' }, { code: 'fr' }, { code: 'ru' }].map(l =>
    `<a class="${l.code === current ? 'active' : ''}" data-lang="${l.code}">${l.code}</a>`
  ).join('');
}

// FIX v3: состояние .open в localStorage — переживает перезагрузку и перерисовку.
const MENU_OPEN_KEY = 'usc-menu-open';
function readMenuOpen() {
  try { return localStorage.getItem(MENU_OPEN_KEY) === '1'; } catch (e) { return false; }
}
function writeMenuOpen(open) {
  try { localStorage.setItem(MENU_OPEN_KEY, open ? '1' : '0'); } catch (e) {}
}

// FIX v3: обновляем только тексты пунктов меню без полной перерисовки.
// Сохраняет классы .open/.active/.parent-active. Вызывается при langChanged.
function reRenderMenuTexts(lang, base) {
  const data = getTrns();
  if (!data) return;
  const container = document.getElementById('main-menu');
  if (!container) return;

  // Главная ссылка (brand · year)
  const homeLink = container.querySelector('.menu-items > a');
  if (homeLink) homeLink.textContent = `${data.site.brand[lang] || data.site.brand.en} · ${data.site.year}`;

  // Обходим все .menu-group и обновляем тексты
  const groups = container.querySelectorAll('.menu-group');
  groups.forEach(groupEl => {
    const parentLink = groupEl.querySelector('.parent-row > a');
    if (!parentLink) return;
    const href = parentLink.getAttribute('href') || '';
    const match = href.match(/([^/]+)\/[^/]+\.html$/);
    const code = match ? match[1] : null;
    const m = data.menu.find(x => x.code === code);
    if (m) parentLink.textContent = m[lang] || m.en;

    // Дочерние
    const subLinks = groupEl.querySelectorAll('.submenu a');
    subLinks.forEach(a => {
      const subHref = a.getAttribute('href') || '';
      const subMatch = subHref.match(/\/([^/]+)\/([^/]+)\/[^/]+\.html$/);
      if (!subMatch) return;
      const parentCode = subMatch[1];
      const childCode = subMatch[2];
      const parent = data.menu.find(x => x.code === parentCode);
      const child = parent && parent.children ? parent.children.find(c => c.code === childCode) : null;
      if (child) a.textContent = child[lang] || child.en;
    });
  });

  // Одиночные пункты верхнего уровня (без подменю)
  container.querySelectorAll('.menu-items > a:not(.menu-group a)').forEach(a => {
    const href = a.getAttribute('href') || '';
    const match = href.match(/([^/]+)\/[^/]+\.html$/);
    const code = match ? match[1] : null;
    if (!code) return;
    const m = data.menu.find(x => x.code === code);
    if (m) a.textContent = m[lang] || m.en;
  });
}

async function buildChrome() {
  const base = window.SITE_ROOT || './';
  if (typeof loadTrns === 'function') await loadTrns();
  const data = getTrns();
  if (!data) return;

  const lang = document.documentElement.dataset.lang || 'en';
  document.documentElement.classList.add('notranslate');

  // Заполняем меню
  const menuContainer = document.getElementById('main-menu');
  if (menuContainer) {
    // FIX v3: если меню уже отрисовано (есть .menu-items) — просто обновим тексты.
    if (menuContainer.querySelector('.menu-items')) {
      reRenderMenuTexts(lang, base);
    } else {
      // Первичная отрисовка
      menuContainer.innerHTML = `<div class="menu-items">${renderMenuItems(lang, base)}</div>`;

      // FIX v3: восстанавливаем .open из localStorage
      if (readMenuOpen()) menuContainer.classList.add('open');

      // Подменю: auto-open если внутри есть активный
      menuContainer.querySelectorAll('.sub-toggle').forEach(btn => {
        const group = btn.closest('.menu-group');
        if (group.querySelector('.submenu a.active')) group.classList.add('open');
        btn.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          group.classList.toggle('open');
        });
      });

      const menuBtn = document.getElementById('menu-toggle');
      const toggleMenu = (e) => {
        e.stopPropagation();
        const willOpen = !menuContainer.classList.contains('open');
        menuContainer.classList.toggle('open');
        writeMenuOpen(willOpen);
      };
      if (menuBtn) menuBtn.addEventListener('click', toggleMenu);

      const closeMenu = () => {
        menuContainer.classList.remove('open');
        writeMenuOpen(false);
      };

      // Закрытие по клику вне меню
      document.addEventListener('click', (e) => {
        if (!menuContainer.classList.contains('open')) return;
        if (menuContainer.contains(e.target) || (menuBtn && menuBtn.contains(e.target))) return;
        closeMenu();
      });

      // Закрытие по Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
      });
    }
  }

  const langContainer = document.getElementById('lang-switch');
  if (langContainer) langContainer.innerHTML = renderLangLinks(lang);

  const footerText = document.getElementById('tr-footer');
  if (footerText) footerText.innerText = data.footer[lang] || data.footer.en;

  const toggleBtn = document.getElementById('usc-theme-toggle');
  if (toggleBtn && typeof bindThemeToggle === 'function') bindThemeToggle(toggleBtn);
}

function initLayout() { if (document.body.dataset.inject === 'chrome') buildChrome(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLayout);
else initLayout();
// FIX v3: при langChanged — если меню уже отрисовано, только обновляем тексты.
window.addEventListener('langChanged', () => { buildChrome(); });
