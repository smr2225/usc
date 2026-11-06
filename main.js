// main.js
const THEME_KEY = 'usc-theme';

(function () {
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (saved !== 'dark' && saved !== 'light') {
    saved = (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', saved);
})();

function basePath() {
  return window.SITE_ROOT || './';
}

function bgLabels() {
  var m = document.documentElement.dataset.lang || 'ru';
  if (typeof getTrns === 'function' && getTrns()) {
    return getTrns().bg_labels[m] || ['Light', 'Dark'];
  }
  return ['Light', 'Dark'];
}

function bindThemeToggle(btn) {
  var cur = document.documentElement.getAttribute('data-theme');
  btn.title = bgLabels()[cur === 'dark' ? 0 : 1];
  btn.addEventListener('click', function () {
    cur = (cur === 'dark') ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, cur); } catch ( e) {}
    document.documentElement.setAttribute('data-theme', cur);
    this.title = bgLabels()[cur === 'dark' ? 0 : 1];
  });
}