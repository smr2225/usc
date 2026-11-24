/* ===== USC 2222 · game/icsa/icsa.js =====
 * Интерактивная 3D-модель звёздчатого икосаэдра (compound of 5 tetrahedra).
 * Геометрия — из shape.json (построен из asset/geometry.json). Рендер — three.js.
 * Вращение мышью/пальцем, масштаб колесом, «разобрать/собрать» — развести тетраэдры.
 */
(async () => {
await new Promise(ok => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', ok) : ok());

const rows = await fetch('icsa.json').then(r => r.json()).catch(() => []);
const TX = {}; rows.forEach(r => TX[r.id] = r);
const tr = (id, ...a) => {
  const lang = document.documentElement.dataset.lang || 'ru';
  const r = TX[id];
  let x = r ? (r[lang] || r.ru || id) : id;
  a.forEach((v, i) => { x = x.split('{' + i + '}').join(v); });
  return x;
};

const canvas = document.getElementById('ico');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
catch (e) {
  const stage = canvas.parentElement;
  stage.innerHTML = '<div style="color:#c2b09c;padding:2rem;text-align:center">' + tr('no_webgl') + '</div>';
  return;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x0a0a14, 1);

const data = await fetch('shape.json').then(r => r.json());
const V = data.vertices;
const FACES = data.faces;            // [i0, i1, i2, colorIdx, planeId]
const PALETTE = data.palette;
const NG = PALETTE.length;

// --- видимые рёбра: ребро между двумя гранями одной группы с разным planeId (или граничное) ---
const edgeMap = {};
for (let i = 0; i < FACES.length; i++) {
  const tri = [FACES[i][0], FACES[i][1], FACES[i][2]];
  for (let k = 0; k < 3; k++) {
    const a = tri[k], b = tri[(k + 1) % 3];
    const key = (a < b ? a + '_' + b : b + '_' + a);
    (edgeMap[key] = edgeMap[key] || []).push(i);
  }
}
const faceColor = i => FACES[i][3];
const facePlane = i => FACES[i][4];
const gedge = []; for (let i = 0; i < NG; i++) gedge.push([]);
for (const key in edgeMap) {
  const lst = edgeMap[key];
  const parts = key.split('_'), aa = +parts[0], bb = +parts[1];
  let visible = false, col = -1;
  if (lst.length === 1) { visible = true; col = faceColor(lst[0]); }
  else {
    const f0 = lst[0];
    const sameColor = lst.every(i => faceColor(i) === faceColor(f0));
    const planes = new Set(lst.map(i => facePlane(i)));
    if (sameColor ? planes.size > 1 : true) { visible = true; col = faceColor(f0); }
  }
  if (visible && col >= 0 && col < NG) gedge[col].push(aa, bb);
}

// --- центроид фигуры и центроиды групп ---
let cx = 0, cy = 0, cz = 0, cn = 0;
const gcent = []; for (let i = 0; i < NG; i++) gcent.push([]);
for (let i = 0; i < FACES.length; i++) {
  const f = FACES[i];
  const p0 = V[f[0]], p1 = V[f[1]], p2 = V[f[2]];
  const tx = (p0[0] + p1[0] + p2[0]) / 3, ty = (p0[1] + p1[1] + p2[1]) / 3, tz = (p0[2] + p1[2] + p2[2]) / 3;
  gcent[f[3]].push([tx, ty, tz]);
  cx += tx; cy += ty; cz += tz; cn++;
}
cx /= cn; cy /= cn; cz /= cn;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(0, 0, 5.2);

const root = new THREE.Group();
scene.add(root);
const subs = [], dirs = [];
for (let c = 0; c < NG; c++) {
  const pos = [];
  for (let i = 0; i < FACES.length; i++) {
    if (FACES[i][3] !== c) continue;
    const f = FACES[i];
    for (const vi of [f[0], f[1], f[2]]) pos.push(V[vi][0], V[vi][1], V[vi][2]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color: PALETTE[c], transparent: true, opacity: 0.82, side: THREE.DoubleSide
  }));

  const eg = gedge[c], eg2 = [];
  for (let i = 0; i < eg.length; i += 2) {
    const A = V[eg[i]], B = V[eg[i + 1]];
    eg2.push(A[0], A[1], A[2], B[0], B[1], B[2]);
  }
  let lines = null;
  if (eg2.length) {
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(eg2, 3));
    lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.9 }));
  }

  const sub = new THREE.Group();
  sub.add(mesh); if (lines) sub.add(lines);
  root.add(sub); subs.push(sub);

  let dx = 0, dy = 0, dz = 0; const arr = gcent[c];
  for (const p of arr) { dx += p[0] - cx; dy += p[1] - cy; dz += p[2] - cz; }
  if (arr.length) { dx /= arr.length; dy /= arr.length; dz /= arr.length; }
  const len = Math.hypot(dx, dy, dz) || 1;
  dirs.push(new THREE.Vector3(dx / len, dy / len, dz / len));
}

// --- взаимодействие ---
let autoRotate = true, dragging = false, lx = 0, ly = 0;
let explode = 0, explodeTarget = 0;
const ROT = 0.005;

canvas.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (er) {} });
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointercancel', () => { dragging = false; });
canvas.addEventListener('pointermove', e => {
  if (!dragging) return;
  root.rotation.y += (e.clientX - lx) * 0.01;
  root.rotation.x += (e.clientY - ly) * 0.01;
  lx = e.clientX; ly = e.clientY;
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  camera.position.z = Math.max(2.8, Math.min(9, camera.position.z + e.deltaY * 0.003));
}, { passive: false });

const bRot = document.getElementById('btn-rotate');
const bExp = document.getElementById('btn-explode');
bRot.addEventListener('click', () => { autoRotate = !autoRotate; bRot.textContent = autoRotate ? tr('btn_rotate_off') : tr('btn_rotate_on'); });
bExp.addEventListener('click', () => {
  explodeTarget = explodeTarget > 0 ? 0 : 1.7;
  bExp.textContent = explodeTarget > 0 ? tr('btn_assemble') : tr('btn_explode');
});

function resize() {
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(r.width)), h = Math.max(1, Math.floor(r.height));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function tick() {
  if (autoRotate && !dragging) root.rotation.y += ROT;
  explode += (explodeTarget - explode) * 0.08;
  for (let c = 0; c < NG; c++) subs[c].position.copy(dirs[c]).multiplyScalar(explode);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

// --- i18n ---
function applyTexts() {
  document.title = tr('doc_title');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n); });
  bRot.textContent = autoRotate ? tr('btn_rotate_off') : tr('btn_rotate_on');
  bExp.textContent = explodeTarget > 0 ? tr('btn_assemble') : tr('btn_explode');
}
window.addEventListener('langChanged', applyTexts);
applyTexts();
})();
