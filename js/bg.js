/* ===== USC 2222 · bg.js =====
 * Пул фоновых фотографий Марса.
 * Проблема: статический JS НЕ МОЖЕТ листать содержимое каталога img/.
 * Поэтому нужен manifest.json со списком файлов.
 *
 * УСТАНОВКА:
 * 1. Создай /img/manifest.json  (массив имён файлов):
 *    ["mars1.jpg", "mars2.jpg", "mars3.jpg"]
 * 2. Подключи этот скрипт в boot.js  (массив coreScripts):
 *    bootDir + 'bg.js'
 * 3. Убедись, что #usc-bg уже есть в DOM (или инжектится main.js).
 *    Если нет — добавь <div id="usc-bg"></div> сразу после <body>.
 */
(function () {
  var root = window.SITE_ROOT || '';
  var STORAGE_LAST = 'usc-bg-last';

  function pick(pool) {
    var last = '';
    try { last = localStorage.getItem(STORAGE_LAST) || ''; } catch (e) {}
    var pick;
    if (pool.length === 1) {
      pick = pool[0];
    } else {
      do {
        pick = pool[Math.floor(Math.random() * pool.length)];
      } while (pick === last);
    }
    try { localStorage.setItem(STORAGE_LAST, pick); } catch (e) {}
    return pick;
  }

  function apply(url) {
    var img = new Image();
    img.onload = function () {
      document.documentElement.style.setProperty(
        '--bg-photo', 'url("' + url + '")'
      );
    };
    img.src = url;
  }

  fetch(root + 'img/manifest.json', { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('manifest ' + r.status);
      return r.json();
    })
    .then(function (pool) {
      if (!Array.isArray(pool) || !pool.length) return;
      apply(root + 'img/' + pick(pool));
    })
    .catch(function (e) {
      console.warn('[bg] manifest не загрузился:', e.message);
    });
})();
