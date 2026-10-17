// js/embl.js
async function initEmblem() {
  const canvas = document.getElementById('svgCanvas');
  if (!canvas) return; 

  // Эмблема — ссылка на игру (game/game.html). Подпись — на языке сайта.
  if (!canvas.closest('a')) {
    const link = document.createElement('a');
    link.className = 'emblem-link';
    link.href = (window.SITE_ROOT || './') + 'game/game.html';
    canvas.parentNode.insertBefore(link, canvas);
    link.appendChild(canvas);
    const T = { ru: 'Головоломка', en: 'Puzzle', es: 'Rompecabezas', fr: 'Casse-tête' };
    const setT = () => {
      const t = T[document.documentElement.dataset.lang] || T.ru;
      link.title = t; link.setAttribute('aria-label', t);
    };
    setT();
    window.addEventListener('langChanged', setT);
  }

  const base = window.SITE_ROOT || '';
  const dataUrl = base + 'asset/geometry.json';

  try {
    const response = await fetch(dataUrl);
    const data = await response.json();
    
    const ctx = canvas.getContext('2d');
    const vertices = data.vertices;
    const polygons = data.polygons; // Файл уже очищен, фильтровать не надо!

    // Вычисление видимых ребер (один раз при загрузке)
    const edgeMap = {};
    for (let i=0; i<polygons.length; i++) {
        const p = polygons[i];
        for (let j=0; j<p.verts.length; j++) {
            const v1 = p.verts[j], v2 = p.verts[(j+1)%p.verts.length];
            const key = Math.min(v1,v2) + "_" + Math.max(v1,v2);
            if (!edgeMap[key]) edgeMap[key] = [];
            edgeMap[key].push(i);
        }
    }

    for (let i=0; i<polygons.length; i++) {
        const p = polygons[i];
        p.visibleEdges = [];
        for (let j=0; j<p.verts.length; j++) {
            const v1 = p.verts[j], v2 = p.verts[(j+1)%p.verts.length];
            const key = Math.min(v1,v2) + "_" + Math.max(v1,v2);
            let isHidden = false;
            for (const k of edgeMap[key]) {
                if (k === i) continue;
                const p2 = polygons[k];
                if (p2.planeId === p.planeId) { isHidden = true; break; }
            }
            if (!isHidden) p.visibleEdges.push([v1, v2]);
        }
    }

    // Настройка четкости на Retina/4K экранах
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.width; // Берем из HTML (240 или 180)
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx.scale(dpr, dpr);
    ctx.translate(size / 2, size / 2); // Центрируем

    // Цвета
    const colors = ['#FF4136', '#0074D9', '#2ECC40', '#FFDC00', '#B10DC9'];
    const svgScale = 55; 
    let time = (Date.now() / 1000) * 0.3; 

    function rotateXYZ(p, t) {
        const ax = t * 0.70, ay = t * 1.00, az = t * 0.45;
        let y1 = p[1]*Math.cos(ax) - p[2]*Math.sin(ax);
        let z1 = p[1]*Math.sin(ax) + p[2]*Math.cos(ax);
        let x1 = p[0];
        let x2 = x1*Math.cos(ay) + z1*Math.sin(ay);
        let z2 = -x1*Math.sin(ay) + z1*Math.cos(ay);
        let y2 = y1;
        let x3 = x2*Math.cos(az) - y2*Math.sin(az);
        let y3 = x2*Math.sin(az) + y2*Math.cos(az);
        return [x3, y3, z2];
    }

    function animate() {
        time += 0.01;
        ctx.clearRect(-size/2, -size/2, size, size);
        
        const rotVerts = vertices.map(v => rotateXYZ(v, time));
        
        let renderData = [];
        for (let i = 0; i < polygons.length; i++) {
            const p = polygons[i];
            let zSum = 0;
            for (let idx of p.verts) zSum += rotVerts[idx][2];
            renderData.push({ polyIdx: i, z: zSum / p.verts.length });
        }

        renderData.sort((a, b) => a.z - b.z);

        for (let i = 0; i < renderData.length; i++) {
            const r = renderData[i];
            const p = polygons[r.polyIdx];
            const color = colors[p.colorIdx] || '#fff';
            
            ctx.beginPath();
            for (let j=0; j<p.verts.length; j++) {
                const v = rotVerts[p.verts[j]];
                if (j === 0) ctx.moveTo(v[0]*svgScale, v[1]*svgScale);
                else ctx.lineTo(v[0]*svgScale, v[1]*svgScale);
            }
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.globalAlpha = (0.35 + ((r.z + 2) / 4) * 0.5);
            ctx.fill();
            
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            for (let j=0; j<p.visibleEdges.length; j++) {
                const v1 = rotVerts[p.visibleEdges[j][0]];
                const v2 = rotVerts[p.visibleEdges[j][1]];
                ctx.moveTo(v1[0]*svgScale, v1[1]*svgScale);
                ctx.lineTo(v2[0]*svgScale, v2[1]*svgScale);
            }
            ctx.stroke();
        }
        requestAnimationFrame(animate);
    }
    animate();
  } catch (err) {
      console.error("Ошибка загрузки эмблемы:", err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEmblem);
} else {
  initEmblem();
}