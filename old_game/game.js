/* ===== USC 2222 · game/game.js — каталог игр =====
 * Грузит game.json, рисует карточки с эмблемами (SVG), переключает язык.
 * Структура game.json: { ui:{...}, games:[ {id,href,icon,title:{ru,en,es,fr},desc:{...}}, ... ] }
 * href:null → карточка «Ждите следующих» (без ссылки). В меню сайта каталог не входит —
 * вход через эмблему (js/embl.js → game/game.html).
 */
(async () => {
  await new Promise(ok => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', ok) : ok());

  const data = await fetch('game.json').then(r => r.json()).catch(() => null);
  if (!data) { document.getElementById('gm-catalog').textContent = 'game.json not found'; return; }

  const TX = {};
  Object.entries(data.ui || {}).forEach(([k, v]) => { TX[k] = v; });
  const tr = (id, ...a) => {
    const lang = document.documentElement.dataset.lang || 'ru';
    const r = TX[id];
    let x = r ? (r[lang] || r.ru || id) : id;
    a.forEach((v, i) => { x = x.split('{' + i + '}').join(v); });
    return x;
  };

  const root = document.getElementById('gm-catalog');

  function render() {
    const games = data.games || [];
    const lang = document.documentElement.dataset.lang || 'ru';
    root.innerHTML = games.map(g => {
      const t = (g.title && (g.title[lang] || g.title.ru)) || g.id;
      const d = (g.desc && (g.desc[lang] || g.desc.ru)) || '';
      const soon = !g.href;
      const cls = 'gmc-card' + (soon ? ' soon' : '');
      const previewBg = 'gmc-preview ' + (g.icon || 'default');
      const emblem = '<img class="gmc-emblem" src="emblems/' + (g.icon || 'default') + '.svg" alt="">';
      const tag = soon ? 'span' : 'a';
      const href = soon ? '' : ' href="' + g.href + '"';
      const label = soon ? tr('soon') : tr('play');
      return '<' + tag + ' class="' + cls + '"' + href + '>' +
        '<div class="' + previewBg + '">' + emblem + '</div>' +
        '<div class="gmc-body"><h2>' + t + '</h2><p>' + d + '</p>' +
        '<span class="gmc-play">' + label + ' →</span></div>' +
        '</' + tag + '>';
    }).join('');
  }

  function applyTexts() {
    document.title = 'ССГ 2222 — ' + tr('title');
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n); });
    // Эмблема в hero каталога ведёт на главную сайта (../); подпись — на языке сайта.
    const a = document.querySelector('.hero-emblem .emblem-link');
    if (a) { const h = tr('home'); a.title = h; a.setAttribute('aria-label', h); }
    render();
  }

  window.addEventListener('langChanged', applyTexts);
  applyTexts();
})();
