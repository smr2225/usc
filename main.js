const THEME_KEY = 'usc-theme';
const BG_KEY = 'usc-bg';
const BG_POOL = { dark: 2, light: 2 };

(function () {
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (saved !== 'dark' && saved !== 'light') {
    saved = (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', saved);
})();

function basePath() {
  var b = document.documentElement.getAttribute('data-base') || document.body.getAttribute('data-base');
  return b !== undefined ? b : './';
}

function initBackground() {
  var bg = document.createElement('div');
  bg.id = 'usc-bg';
  document.body.insertBefore(bg, document.body.firstChild);
  pickBackground(document.documentElement.getAttribute('data-theme'));
}

function pickBackground(theme) {
  var n = BG_POOL[theme] || 0;
  if (!n) return;
  var last = ''; try { last = localStorage.getItem(BG_KEY) || ''; } catch (e) {}
  var k = 1 + Math.floor(Math.random() * n);
  if (n > 1 && theme + ':' + k === last) k = (k % n) + 1;
  try { localStorage.setItem(BG_KEY, theme + ':' + k); } catch (e) {}
  var name = (theme === 'dark' ? 'bd' : 'bl') + (k < 10 ? '0' : '') + k + '.jpg';
  var root = basePath() || './';
  document.documentElement.style.setProperty('--bg-photo', 'url("' + root + 'img/' + name + '")');
}

document.addEventListener('DOMContentLoaded', () => {
  initBackground();
});