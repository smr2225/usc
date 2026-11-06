/* ===== USC 2222 · bg.js =====
 * Единый менеджер фонов Марса.
 * Manifest: /img/manifest.json
 * Формат: { "dark": {"from":1,"to":5}, "light": {"from":1,"to":7} }
 * Маска: dark → n001.webp, light → d001.webp (padding 3).
 */
(function () {
  var root = window.SITE_ROOT || '';
  var STORAGE_LAST = 'usc-bg-last';
  var CACHE_KEY = 'usc-bg-manifest';
  var manifest = null;

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  function loadManifest() {
    if (manifest) return Promise.resolve(manifest);
    try {
      var cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        manifest = JSON.parse(cached);
        return Promise.resolve(manifest);
      }
    } catch (e) {}
    return fetch(root + 'img/manifest.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('manifest ' + r.status);
        return r.json();
      })
      .then(function (data) {
        manifest = data;
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
        return manifest;
      });
  }

  function pad3(n) {
    return n < 10 ? '00' + n : (n < 100 ? '0' + n : '' + n);
  }

  function pick(theme) {
    var range = (manifest && manifest[theme]) || {};
    var from = range.from || 1;
    var to = range.to || 0;
    if (to < from) return null;
    var last = -1;
    try { last = parseInt(localStorage.getItem(STORAGE_LAST + ':' + theme), 10) || -1; } catch (e) {}
    var k;
    if (to === from) {
      k = from;
    } else {
      do {
        k = from + Math.floor(Math.random() * (to - from + 1));
      } while (k === last);
    }
    try { localStorage.setItem(STORAGE_LAST + ':' + theme, k); } catch (e) {}
    var prefix = (theme === 'dark') ? 'n' : 'd';
    return prefix + pad3(k) + '.webp';
  }

  function apply(filename) {
    var url = root + 'img/' + filename;
    var img = new Image();
    img.onload = function () {
      document.documentElement.style.setProperty('--bg-photo', 'url("' + url + '")');
    };
    img.onerror = function () {
      console.warn('[bg] не загрузилась:', url);
    };
    img.src = url;
  }

  function refresh() {
    var theme = getTheme();
    loadManifest().then(function () {
      var f = pick(theme);
      if (f) apply(f);
    }).catch(function (e) {
      console.warn('[bg] manifest не загрузился:', e.message);
    });
  }

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].attributeName === 'data-theme') {
        refresh();
        return;
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }
})();