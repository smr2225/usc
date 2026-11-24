/* ===== USC 2222 · js/boot.js  (минимальный stub для локального предпросмотра) =====
 * На реальном сайте используется ваш boot.js. Этот загружает только то, что нужно,
 * чтобы страницы каталога/игр рендерились без него: тема, язык, бургер, футер,
 * загрузка эмблемы (embl.js). Хуки те же, что и в основном boot.js:
 *   #main-menu, #lang-switch, #usc-theme-toggle, #menu-toggle, #tr-footer,
 *   body[data-base], #svgCanvas.  Замените на свой boot.js — структура совпадает.
 */
(function () {
  var base = (document.body && document.body.dataset.base) || './';
  window.SITE_ROOT = base;
  var LANGS = ['ru', 'en', 'es', 'fr'];
  var LABELS = { ru: 'RU', en: 'EN', es: 'ES', fr: 'FR' };

  // ---- тема ----
  function applyTheme() {
    var t; try { t = localStorage.getItem('usc-theme'); } catch (e) {}
    document.documentElement.dataset.theme = (t === 'dark' || t === 'light') ? t : 'light';
  }
  applyTheme();
  var tt = document.getElementById('usc-theme-toggle');
  if (tt) tt.addEventListener('click', function () {
    var cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = cur;
    try { localStorage.setItem('usc-theme', cur); } catch (e) {}
  });

  // ---- язык ----
  function curLang() { var l; try { l = localStorage.getItem('usc-lang'); } catch (e) {} return LANGS.indexOf(l) >= 0 ? l : 'ru'; }
  function setLang(l) {
    if (LANGS.indexOf(l) < 0) l = 'ru';
    document.documentElement.lang = l;
    document.documentElement.dataset.lang = l;
    try { localStorage.setItem('usc-lang', l); } catch (e) {}
    window.dispatchEvent(new Event('langChanged'));
  }
  setLang(curLang());

  var ls = document.getElementById('lang-switch');
  if (ls) {
    ls.innerHTML = LANGS.map(function (l) { return '<a data-lang="' + l + '" href="#">' + LABELS[l] + '</a>'; }).join('');
    ls.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-lang]'); if (!a) return;
      e.preventDefault(); setLang(a.getAttribute('data-lang'));
    });
    var refresh = function () {
      ls.querySelectorAll('a').forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('data-lang') === document.documentElement.dataset.lang);
      });
    };
    refresh(); window.addEventListener('langChanged', refresh);
  }

  // ---- бургер ----
  var mt = document.getElementById('menu-toggle'), mm = document.getElementById('main-menu');
  if (mt && mm) mt.addEventListener('click', function () { mm.classList.toggle('open'); });

  // ---- меню: stub (одно звено — на главную). На сайте заполнится вашим boot.js ----
  if (mm && !mm.childElementCount) {
    var d = document.createElement('div'); d.className = 'menu-items';
    var lab = document.documentElement.dataset.lang === 'ru' ? '← На сайт' : '← Home';
    d.innerHTML = '<a href="' + base + '">' + lab + '</a>';
    mm.appendChild(d);
  }

  // ---- футер ----
  var ft = document.getElementById('tr-footer');
  if (ft) ft.textContent = '© 2026 · Марс-2222';

  // ---- эмблема (если на странице есть canvas#svgCanvas) ----
  if (document.getElementById('svgCanvas')) {
    var s = document.createElement('script'); s.src = base + 'js/embl.js';
    document.head.appendChild(s);
  }
})();
