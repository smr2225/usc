/* Звёздчатый икосаэдр (5 тетраэдров, 60 граней) — головоломка.
 * © 2026 smr2225. Все права защищены. См. LICENSE.
 * Использует three.js (MIT), см. LICENSE-three.txt. */
(async()=>{
// ---- тексты: game.json = [{id, ru, en, es, fr}], язык — как у сайта (data-lang на <html>) ----
await new Promise(ok=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',ok):ok());
const [rows,DATA]=await Promise.all([fetch('game.json').then(r=>r.json()),fetch('shape.json').then(r=>r.json())]);
const TX={};rows.forEach(r=>TX[r.id]=r);
const tr=(id,...a)=>{const lang=document.documentElement.dataset.lang||'ru',r=TX[id];let x=r?(r[lang]||r.ru||id):id;a.forEach((v,i)=>{x=x.split('{'+i+'}').join(v);});return x;};
let LEN,EDGE; // EDGE[i][k] = грань, с которой делит k-е ребро грани i
function buildNeighbors(P){ // P: массив многоугольников (списки 3D-точек); соседи = общий участок ребра ненулевой длины
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const share=(a1,a2,b1,b2)=>{const d=sub(a2,a1),l=Math.hypot(...d);
    if(Math.hypot(...cr(d,sub(b1,a1)))/l>1e-3||Math.hypot(...cr(d,sub(b2,a1)))/l>1e-3)return 0;
    const t1=dot(sub(b1,a1),d)/l,t2=dot(sub(b2,a1),d)/l;
    return Math.max(0,Math.min(l,Math.max(t1,t2))-Math.max(0,Math.min(t1,t2)));};
  const nb=P.map(()=>[]);LEN={};EDGE=P.map(()=>[]);
  for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){
    let hit=0,ba=-1,bb=-1;
    for(let a=0;a<P[i].length;a++)for(let b=0;b<P[j].length;b++){
      const o=share(P[i][a],P[i][(a+1)%P[i].length],P[j][b],P[j][(b+1)%P[j].length]);if(o>hit){hit=o;ba=a;bb=b;}}
    if(hit>1e-3){nb[i].push(j);nb[j].push(i);LEN[i+'_'+j]=LEN[j+'_'+i]=hit;EDGE[i][ba]=j;EDGE[j][bb]=i;}
  }
  return nb;
}

const COL=[0xff2a6d,0x05d9e8,0xfff04a,0x7cff6b,0xb967ff];
const box=document.getElementById('gm-view');
const R=new THREE.WebGLRenderer({antialias:true,alpha:true});
R.setPixelRatio(Math.min(devicePixelRatio,2));box.appendChild(R.domElement);
const S=new THREE.Scene(),Cam=new THREE.PerspectiveCamera(40,1,.1,50);Cam.position.set(0,0,3.1);
S.add(new THREE.AmbientLight(0xffffff,1.0));
const d1=new THREE.DirectionalLight(0xffffff,.45);d1.position.set(2,3,4);S.add(d1);
const d2=new THREE.DirectionalLight(0x88aaff,.35);d2.position.set(-3,-2,-2);S.add(d2);
const G=new THREE.Group();S.add(G);
const lineMat=new THREE.LineBasicMaterial({color:0x0a0a14});
const NB=buildNeighbors(DATA.map(d=>d[1]));
const cent=DATA.map(d=>{const c=[0,0,0];d[1].forEach(p=>{c[0]+=p[0];c[1]+=p[1];c[2]+=p[2];});return new THREE.Vector3(c[0],c[1],c[2]).multiplyScalar(1/d[1].length);});
// соседи упорядочены по углу вокруг центра грани (в её плоскости) — получается кольцо
NB.forEach((n,i)=>{const nv=cent[i].clone().normalize(),u=new THREE.Vector3().subVectors(cent[n[0]],cent[i]),w=new THREE.Vector3().crossVectors(nv,u);
  const ang=j=>{const v=new THREE.Vector3().subVectors(cent[j],cent[i]);return Math.atan2(v.dot(w),v.dot(u));};n.sort((x,y)=>ang(x)-ang(y));});
let level=3,holes=[],sel=-1,target=0;
const NAMES=[0,1,2,3,4].map(i=>tr('col_'+i)),HEX=['#ff2a6d','#05d9e8','#fff04a','#7cff6b','#b967ff'];
const jokerFor=id=>{const a=holes.filter(h=>faces[h].all.includes(id));return a.includes(sel)?sel:(a.length?a[0]:-1);};
const baseEm=i=>level===2?(sel===i?0x303070:0):level===7?(sel===i?0x405080:(sel>=0&&faces[sel].easy.includes(i)?0x1c2438:0)):level===6&&faces[i].goal===target?0x2c2c2c:0;
const faces=DATA.map(([t,P,T],i)=>({id:i,points:P,all:NB[i],goal:t,color:t}));
// лёгкий уровень: только 3 соседа из других тетраэдров (короткие рёбра-стыки); два длинных ребра ведут к граням того же тетраэдра
faces.forEach(f=>{f.easy=f.all.filter(j=>faces[j].goal!==f.goal);
  // средний: 3 стыка + 1 длинное ребро — то, что примыкает к самому длинному из стыков
  const lv=f.easy.reduce((a,b)=>LEN[f.id+'_'+b]>LEN[f.id+'_'+a]?b:a);
  const rd=f.all.filter(j=>faces[j].goal===f.goal).reduce((a,b)=>cent[b].distanceTo(cent[lv])<cent[a].distanceTo(cent[lv])?b:a);
  f.mid=f.all.filter(j=>f.easy.includes(j)||j===rd);});
const ringOf=id=>{if(level===7)return sel>=0&&sel!==id&&faces[sel].easy.includes(id)?[id,sel]:[id];
  if(level<=2){const h=holes.includes(id)?-1:jokerFor(id);return h>=0?[id,h]:[id];}return [id,...(level===4?faces[id].mid:level===5?faces[id].all:faces[id].easy)];};
// Рёбра: линия рисуется только между соседями ОДНОГО цвета — инверсным цветом грани. Разноцветные грани разделены самим цветом.
// Рамка — полоса шириной BORDER_W внутри каждой грани, часть той же геометрии; цвета вершин задаёт paint().
const BORDER_W=.008,V3=THREE.Vector3;
const meshes=faces.map(f=>{
  const P=f.points.map(p=>new V3(...p)),n=P.length,nrm=new V3();
  P.forEach((p,i)=>nrm.add(new V3().crossVectors(p,P[(i+1)%n])));nrm.normalize(); // нормаль Ньюэлла
  const inw=P.map((p,i)=>new V3().crossVectors(nrm,P[(i+1)%n].clone().sub(p).normalize())); // внутрь грани
  const Q=P.map((p,i)=>{const a=inw[(i+n-1)%n],b=inw[i],d=a.clone().add(b).multiplyScalar(BORDER_W/Math.max(.35,1+a.dot(b)));return p.clone().add(d);});
  const pos=[...Q],idx=[...DATA[f.id][2].flat()];
  for(let e=0;e<n;e++){const j=(e+1)%n,o=pos.length;pos.push(P[e],P[j],Q[j],Q[e]);idx.push(o,o+1,o+2,o,o+2,o+3);}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos.flatMap(p=>p.toArray()),3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(new Array(pos.length*3).fill(1),3));
  g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}));
  m.userData.id=f.id;G.add(m);return m;});
function paint(i,c){const f=faces[i],n=f.points.length,col=meshes[i].geometry.attributes.color,a=col.array;
  for(let k=0;k<n;k++){a[3*k]=c.r;a[3*k+1]=c.g;a[3*k+2]=c.b;}
  for(let e=0;e<n;e++){const j=EDGE[i][e],same=f.color>=0&&j!==undefined&&faces[j].color===f.color;
    const r=same?1-c.r:c.r,g2=same?1-c.g:c.g,b=same?1-c.b:c.b;
    for(let v=0;v<4;v++){const o=3*(n+4*e+v);a[o]=r;a[o+1]=g2;a[o+2]=b;}}
  col.needsUpdate=true;}
G.scale.setScalar(.87); // стартовый размер (колесо / щипок — масштаб)
G.quaternion.setFromEuler(new THREE.Euler(Math.random()*6.28,Math.random()*6.28,Math.random()*6.28));
function size(){const w=box.clientWidth,h=box.clientHeight;R.setSize(w,h);Cam.aspect=w/h;Cam.updateProjectionMatrix();}
addEventListener('resize',size);new ResizeObserver(size).observe(box);size();
const WHITE=new THREE.Color(1,1,1),GREY=new THREE.Color(.55,.55,.6);let alpha=.9;
let drag=false,moved=0,lx=0,ly=0,auto=true,zoom=1,hover=-1,moves=0,started=false;
const q=new THREE.Quaternion(),ray=new THREE.Raycaster(),mp=new THREE.Vector2(),st=document.getElementById('gm-st'),spin=document.getElementById('gm-spin');
function pick(e){const r=R.domElement.getBoundingClientRect();mp.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);
  ray.setFromCamera(mp,Cam);const h=ray.intersectObjects(meshes)[0];return h?h.object.userData.id:-1;}
function hl(on){if(hover<0)return;ringOf(hover).forEach((i,k)=>meshes[i].material.emissive.setHex(on?(k?0x1a1a1a:0x404040):baseEm(i)));}
function setSpin(v){auto=v;spin.textContent=tr('btn_spin',tr(v?'on':'off'));}
const ptrs=new Map();let pinch=0;
const pd=()=>{const a=[...ptrs.values()];return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);};
const setZoom=z=>{zoom=Math.min(2.2,Math.max(.5,z));Cam.position.z=3.1/zoom;};
box.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});box.setPointerCapture(e.pointerId);
  if(ptrs.size===1){drag=true;moved=0;lx=e.clientX;ly=e.clientY;}else{pinch=pd();moved=99;}});
function endPtr(e,click){const was=ptrs.size;ptrs.delete(e.pointerId);if(!ptrs.size)drag=false;if(ptrs.size<2)pinch=0;
  if(!click||was!==1||moved>=(e.pointerType==='touch'?10:5))return;
  const id=pick(e);if(id<0)return;
  if(move(id)){moves++;started=true;draw();}
  if(e.pointerType==='touch'){hover=id;hl(1);setTimeout(()=>{hl(0);hover=-1;},500);} // на сенсоре нет наведения: коротко подсвечиваем затронутые грани
}
box.addEventListener('pointerup',e=>endPtr(e,true));box.addEventListener('pointercancel',e=>endPtr(e,false));
box.addEventListener('pointermove',e=>{
  if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2){const d=pd();if(pinch>0)setZoom(zoom*d/pinch);pinch=d;return;} // щипок двумя пальцами — масштаб
  if(!drag){if(e.pointerType==='touch')return;const id=pick(e);if(id!==hover){hl(0);hover=id;hl(1);}return;}
  const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);
  if(moved>=5&&auto)setSpin(false);
  q.setFromEuler(new THREE.Euler(dy*.008,dx*.008,0));G.quaternion.premultiply(q);});
box.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*(e.deltaY>0?.95:1.05));},{passive:false});
// ход: циклический сдвиг по кольцу (уровни 3-6) или обмен с джокером-«дыркой» (уровни 1-2)
function swapJoker(h,id){faces[h].color=faces[id].color;faces[id].color=-1;holes[holes.indexOf(h)]=id;if(sel===h)sel=id;}
function move(id){
  if(level<=2){
    if(holes.includes(id)){if(level===2){sel=sel===id?-1:id;draw();}return false;} // клик по джокеру выбирает его
    const h=jokerFor(id);if(h<0)return false;swapJoker(h,id);return true;}
  if(level===7){ // обмен парой: выбрать грань, затем одного из её 3 соседей из других тетраэдров
    if(sel>=0&&sel!==id&&faces[sel].easy.includes(id)){const a=faces[sel].color;faces[sel].color=faces[id].color;faces[id].color=a;sel=-1;return true;}
    sel=(sel===id)?-1:id;draw();return false;}
  const ring=ringOf(id),old=ring.map(i=>faces[i].color);
  ring.forEach((fid,i)=>{faces[fid].color=old[(i+ring.length-1)%ring.length];});return true;}
const part=()=>level===6?faces.filter(f=>f.goal===target):faces;
const isSolved=()=>faces.every(f=>holes.includes(f.id)||(level===6&&f.goal!==target)||f.color===f.goal);
function draw(){
  if(holes.length&&faces.every(f=>holes.includes(f.id)||f.color===f.goal)){holes.forEach(h=>{faces[h].color=faces[h].goal;});holes=[];sel=-1;} // финиш: джокеры становятся цветными
  const pt=part(),ok=pt.filter(f=>f.color===f.goal).length,won=ok===pt.length;
  faces.forEach((f,i)=>{const c=new THREE.Color(f.color<0?0x14141c:COL[f.color]);
    if(level===6&&f.goal!==target&&!won)c.lerp(GREY,.4);
    paint(i,c);meshes[i].material.emissive.setHex(baseEm(i));});
  const goal=level===6?'<b style="color:'+HEX[target]+'">'+tr('tetra_name',NAMES[target])+'</b> · ':'';
  st.className=won&&started?'win':'';
  if(won&&started)st.innerHTML=tr(level===6?'st_win_tetra':'st_win',moves);
  else if(won)st.innerHTML=tr('st_solved');
  else st.innerHTML=goal+tr('st_progress',moves,ok,pt.length);}
function reset(){holes=[];sel=-1;faces.forEach(f=>f.color=f.goal);moves=0;started=false;draw();}
function shuffle(){
  do{reset();
    if(level===6)target=Math.floor(Math.random()*5);
    if(level<=2){
      while(holes.length<level){const h=Math.floor(Math.random()*faces.length);if(!holes.includes(h))holes.push(h);}
      holes.forEach(h=>faces[h].color=-1);let last=[-1,-1];
      for(let i=0;i<80*level;i++){const h=holes[Math.floor(Math.random()*holes.length)];
        const c=faces[h].all.filter(j=>!holes.includes(j)&&!(h===last[0]&&j===last[1]));
        if(!c.length)continue;const nx=c[Math.floor(Math.random()*c.length)];swapJoker(h,nx);last=[nx,h];}
    }else if(level===7){
      for(let i=0;i<30;i++){const f=faces[Math.floor(Math.random()*faces.length)],g=faces[f.easy[Math.floor(Math.random()*3)]],a=f.color;f.color=g.color;g.color=a;}
    }else for(let i=0;i<50;i++)move(Math.floor(Math.random()*faces.length));
  }while(isSolved());
  moves=0;started=true;draw();}
document.getElementById('gm-lvl').onclick=function(){hl(0);level={6:1,1:7,7:2,2:3,3:4,4:5,5:6}[level];setLevelLabel();renderRules();target=Math.floor(Math.random()*5);reset();hl(1);};
document.getElementById('gm-shuf').onclick=shuffle;document.getElementById('gm-rst').onclick=reset;spin.onclick=()=>setSpin(!auto);
// прозрачность граней и фон
function applyAlpha(){meshes.forEach((m,i)=>{const M=m.material;M.transparent=alpha<1;M.opacity=alpha;M.depthWrite=alpha>=1;});}
document.getElementById('gm-op').oninput=function(){alpha=this.value/100;applyAlpha();};
document.getElementById('gm-rb').onclick=()=>setRules(rulesEl.classList.contains('hide'));
// порядок отрисовки полупрозрачных граней: от дальних к ближним
const tmpV=new THREE.Vector3();
function sortFaces(){G.updateMatrixWorld(true);
  const o=faces.map((f,i)=>[Cam.position.distanceToSquared(tmpV.copy(cent[i]).applyMatrix4(G.matrixWorld)),i]).sort((a,b)=>b[0]-a[0]);
  o.forEach(([,i],r)=>{meshes[i].renderOrder=r*2;});}
// ---- интерфейс: тексты, правила уровня ----
const rulesEl=document.getElementById('gm-rules'),lvlBtn=document.getElementById('gm-lvl');
const RULES_KEY='usc-game-rules'; // 'open' | 'hide' — состояние панели правил запоминается
function setRules(open){rulesEl.classList.toggle('hide',!open);try{localStorage.setItem(RULES_KEY,open?'open':'hide');}catch(e){}size();}
function setLevelLabel(){lvlBtn.textContent=tr('btn_level',tr('lv'+level+'_name'));}
function renderRules(){
  const h=(tag,txt)=>{const e=document.createElement(tag);e.textContent=txt;return e;},ul=document.createElement('ul');
  ['ctl_rotate','ctl_zoom','ctl_move','ctl_hint','ctl_buttons','ctl_goal'].forEach(k=>ul.appendChild(h('li',tr(k))));
  const top=document.createElement('div'),x=h('button','✕');top.className='gm-rules-top';x.type='button';x.onclick=()=>setRules(false);
  top.append(h('span',tr('rules_close')),x);
  rulesEl.replaceChildren(top,h('h3',tr('rules_controls_h')),ul,h('h3',tr('rules_level_h',tr('lv'+level+'_name'))),h('p',tr('lv'+level+'_rule')));}
function applyTexts(){document.title='ССГ 2222 — '+tr('title');
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=tr(el.dataset.i18n);});
  setLevelLabel();renderRules();setSpin(auto);draw();}
window.addEventListener('langChanged',applyTexts); // смена языка в шапке сайта
{let sv=null;try{sv=localStorage.getItem(RULES_KEY);}catch(e){}if(sv===null?innerWidth<=768:sv==='hide')rulesEl.classList.add('hide');}
applyTexts();
applyAlpha();
// случайное автовращение: ось и скорость плавно меняются каждые несколько секунд
const rAxis=new THREE.Vector3(0,1,0),tAxis=new THREE.Vector3(1,0,0);let rSpeed=.005,tSpeed=.005,nextPick=0;
function autoRotate(){
  const now=performance.now();
  if(now>nextPick){tAxis.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();tSpeed=.003+Math.random()*.006;nextPick=now+3500+Math.random()*5000;}
  rAxis.lerp(tAxis,.015).normalize();rSpeed+=(tSpeed-rSpeed)*.015;
  q.setFromAxisAngle(rAxis,rSpeed);G.quaternion.premultiply(q);}
(function loop(){requestAnimationFrame(loop);
  if(auto&&!drag)autoRotate();
  sortFaces();R.render(S,Cam);})();
})();
