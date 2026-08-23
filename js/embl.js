async function initEmblem() {
  const canvas = document.getElementById('svgCanvas');
  if (!canvas) return; 

  const base = document.body.dataset.base || '';
  const dataUrl = base + 'asset/geometry.json';

  try {
    const response = await fetch(dataUrl);
    const data = await response.json();
    
    const vertices = data.vertices;
    const polygons = data.polygons.map(p => ({ ...p, visibleEdges: [] }));
    const svgNS = "http://www.w3.org/2000/svg";
    const scene = document.getElementById('scene');
    scene.innerHTML = ''; 

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

    const polyElements = [];
    const lineElements = [];
    scene.innerHTML = '';
    
    for (let i = 0; i < polygons.length; i++) {
        const g = document.createElementNS(svgNS, 'g');
        const poly = document.createElementNS(svgNS, 'polygon');
        poly.setAttribute('stroke', 'none');
        g.appendChild(poly);
        
        const lines = [];
        for (let j=0; j<polygons[i].visibleEdges.length; j++) {
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('stroke', '#FFD700');
            line.setAttribute('stroke-width', '0.4');
            line.setAttribute('stroke-opacity', '0.9');
            g.appendChild(line);
            lines.push(line);
        }
        scene.appendChild(g);
        polyElements.push(poly);
        lineElements.push(lines);
    }

    let time = (Date.now() / 1000) * 0.3; 
    const svgScale = 40;

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
        const rotVerts = vertices.map(v => rotateXYZ(v, time));
        
        let renderData = [];
        for (let i = 0; i < polygons.length; i++) {
            const p = polygons[i];
            let zSum = 0;
            for (let idx of p.verts) zSum += rotVerts[idx][2];
            renderData.push({ polyIdx: i, z: zSum / p.verts.length, id: i });
        }

        renderData.sort((a, b) => {
            if (Math.abs(a.z - b.z) < 0.001) return a.id - b.id;
            return a.z - b.z;
        });

        for (let i = 0; i < renderData.length; i++) {
            const r = renderData[i];
            const p = polygons[r.polyIdx];
            const g = polyElements[r.polyIdx].parentNode;
            scene.appendChild(g); 
            
            const polyEl = polyElements[r.polyIdx];
            let ptsStr = "";
            for (let idx of p.verts) {
                ptsStr += `${(rotVerts[idx][0]*svgScale).toFixed(2)},${(rotVerts[idx][1]*svgScale).toFixed(2)} `;
            }
            polyEl.setAttribute('points', ptsStr.trim());
            polyEl.setAttribute('class', `c${p.colorIdx}`);
            polyEl.style.fillOpacity = (0.35 + ((r.z + 2) / 4) * 0.5).toFixed(2);
            
            const lines = lineElements[r.polyIdx];
            for (let j=0; j<lines.length; j++) {
                const v1 = rotVerts[p.visibleEdges[j][0]];
                const v2 = rotVerts[p.visibleEdges[j][1]];
                lines[j].setAttribute('x1', (v1[0]*svgScale).toFixed(2));
                lines[j].setAttribute('y1', (v1[1]*svgScale).toFixed(2));
                lines[j].setAttribute('x2', (v2[0]*svgScale).toFixed(2));
                lines[j].setAttribute('y2', (v2[1]*svgScale).toFixed(2));
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
  } catch (err) {
      console.error("Ошибка загрузки эмблемы:", err);
  }
}

document.addEventListener('DOMContentLoaded', initEmblem);