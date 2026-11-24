/* ===== USC 2222 · game/smrs/smrs.js =====
 * Симуляция посадки на Марс. Порт встроенного скрипта из sitmars.html с i18n
 * (smrs.json). Внешний chrome и переводы — как в остальных разделах сайта:
 * tr(), data-i18n, событие langChanged. Физика/рельеф/рендер неизменны.
 * Звук — из файлов в каталоге игры (smrs-bgm.mp3, smrs-crash.mp3); если файлов
 * нет — игра молчит и не падает.
 */
(async () => {
await new Promise(ok => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', ok) : ok());
const rows = await fetch('smrs.json').then(r => r.json());
const TX = {}; rows.forEach(r => TX[r.id] = r);
const tr = (id, ...a) => {
  const lang = document.documentElement.dataset.lang || 'ru';
  const r = TX[id];
  let x = r ? (r[lang] || r.ru || id) : id;
  a.forEach((v, i) => { x = x.split('{' + i + '}').join(v); });
  return x;
};

var WM=1024,SC=2,N=WM*SC,CM=512,SR=5,LR=10,ISP=300,G0=9.81,W=720,C=360,PR=20;
var LEVELS=[
 {t:'lv1',alt:600,vh:-15,vx:-1,vy:1,ox:60,oy:-40,fuel:1500,pd:60,pb:.5,guide:1},
 {t:'lv2',alt:1000,vh:-25,vx:-2,vy:2,ox:100,oy:-80,fuel:1400,pd:50,pb:.5,guide:0},
 {t:'lv3',alt:2000,vh:-30,vx:-2,vy:2,ox:120,oy:-90,fuel:1200,pd:40,pb:.5,guide:0},
 {t:'lv4',alt:2000,vh:-40,vx:-3,vy:3,ox:250,oy:-200,fuel:900,pd:30,pb:.8,guide:0},
 {t:'lv5',alt:2500,vh:-50,vx:-4,vy:-4,ox:350,oy:280,fuel:700,pd:24,pb:1.3,guide:0}];
var FIELDS=[
 ['alt','f_alt',2000,'м'],
 ['vh','f_vh',-30,'м/с'],
 ['vx','f_vx',-2,'м/с'],
 ['vy','f_vy',2,'м/с'],
 ['ox','f_ox',120,'м'],
 ['oy','f_oy',-90,'м'],
 ['dry','f_dry',4000,'кг'],
 ['fuel','f_fuel',1200,'кг'],
 ['fv','f_fv',45,'кН'],
 ['fh','f_fh',8,'кН'],
 ['g','f_g',3.71,'м/с²'],
 ['pd','f_pd',40,'м'],
 ['pb','f_pb',0.5,'м']
];
var grid=document.getElementById('grid');
grid.insertAdjacentHTML('beforeend','<label for="lvl" data-i18n="level_label"></label><select id="lvl">'+LEVELS.map(function(l,i){return '<option value="'+i+'"'+(i===2?' selected':'')+' data-i18n="'+l.t+'"></option>';}).join('')+'</select><span></span>');
FIELDS.forEach(function(f){
  grid.insertAdjacentHTML('beforeend','<label for="f_'+f[0]+'" data-i18n="'+f[1]+'"></label><input id="f_'+f[0]+'" type="number" step="any" value="'+f[2]+'"><span class="u">'+f[3]+'</span>');
});
grid.insertAdjacentHTML('beforeend','<label for="f_guide" data-i18n="f_guide"></label><input id="f_guide" type="checkbox"><span></span>');
grid.insertAdjacentHTML('beforeend','<label for="vol" data-i18n="f_vol"></label><input id="vol" type="range" min="0" max="100" step="5" value="30"><span class="u" id="volv">30 %</span>');
var bgmEl=document.getElementById('vol');
/* ---------- звук (из файлов в каталоге игры) ----------
 * smrs-bgm.mp3   — фоновая музыка, лупом весь полёт (стартует по клику «Начать»).
 * smrs-crash.mp3 — стингер на крушение / жёсткую посадку.
 * Файлов нет — игра молчит и не падает (HTMLAudio error → audioOk=false). */
var bgm=new Audio('smrs-bgm.mp3'); bgm.loop=true; bgm.preload='auto'; bgm.volume=0.3;
var crashSnd=new Audio('smrs-crash.mp3'); crashSnd.preload='auto'; crashSnd.volume=1;
var audioOk={bgm:true,crash:true};
bgm.addEventListener('error',function(){audioOk.bgm=false;});
crashSnd.addEventListener('error',function(){audioOk.crash=false;});
function curVol(){var v=parseFloat(bgmEl.value)/100;return isNaN(v)?0:v;}
bgmEl.oninput=function(){document.getElementById('volv').textContent=this.value+' %';if(audioOk.bgm)bgm.volume=Math.min(1,this.value/100*0.55);};
function initAudio(){/* HTMLAudio не требует AudioContext; жест пользователя уже был (клик) */}
function startBgm(){var v=curVol();if(audioOk.bgm&&v>0){bgm.volume=Math.min(1,v*0.55);var p=bgm.play();if(p&&p.catch)p.catch(function(){});}}
function stopBgm(){try{bgm.pause();}catch(e){}try{bgm.currentTime=0;}catch(e){}}
function sound(kind){
  var v=curVol();if(!(v>0))return;
  if(kind==='crash'||kind==='hard'){
    stopBgm();
    if(audioOk.crash){crashSnd.volume=Math.min(1,v*(kind==='hard'?0.5:1));try{crashSnd.currentTime=0;}catch(e){}var p=crashSnd.play();if(p&&p.catch)p.catch(function(){});}
  }
}
function setLevel(i){
  var l=LEVELS[i];document.getElementById('lvl').value=i;
  Object.keys(l).forEach(function(k){if(k==='t')return;
    if(k==='guide')document.getElementById('f_guide').checked=!!l.guide;else document.getElementById('f_'+k).value=l[k];});
}
document.getElementById('lvl').onchange=function(){setLevel(+this.value);};
setLevel(2);
var PROWS=[['pH','p_pH'],['pVh','p_pVh'],['pVx','p_pVx'],['pVy','p_pVy'],['pTh','p_pTh'],['pLv','p_pLv'],['pTx','p_pTx'],['pTy','p_pTy'],['pF','p_pF'],['pM','p_pM'],['pX','p_pX'],['pY','p_pY'],['pL','p_pL'],['pT','p_pT']];
var panel=document.getElementById('panel');
PROWS.forEach(function(r){panel.insertAdjacentHTML('beforeend','<div><span data-i18n="'+r[1]+'"></span><b id="'+r[0]+'"></b></div>');});
var pe={};PROWS.forEach(function(r){pe[r[0]]=document.getElementById(r[0]);});

var cv=document.getElementById('c'),ctx=cv.getContext('2d');
var hm=new Float32Array(N*N),map=document.createElement('canvas');map.width=map.height=N;
var LEGS=[[LR,0],[0,-LR],[-LR,0],[0,LR]];
var P,S,run=false,last=0,keys={},level=0,lastParams,fuel0=1,REC=[],recAcc=0,passed=false;
var rp={on:false,t:0,playing:true,last:0};

/* ---------- рельеф ---------- */
function sm(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);}
function lattice(lamM,amp,add){
  var lam=lamM*SC,n=Math.ceil(N/lam)+2,L=new Float32Array(n*n),i,x,y;
  for(i=0;i<L.length;i++)L[i]=Math.random()*2-1;
  for(y=0;y<N;y++){var fy=y/lam,iy=Math.floor(fy),ty=sm(fy-iy);
    for(x=0;x<N;x++){var fx=x/lam,ix=Math.floor(fx),tx=sm(fx-ix),k=iy*n+ix;
      add[y*N+x]+=((L[k]*(1-tx)+L[k+1]*tx)*(1-ty)+(L[k+n]*(1-tx)+L[k+n+1]*tx)*ty)*amp;}}
}
function genTerrain(p){
  PR=p.pd/2;
  var rough=new Float32Array(N*N),fine=new Float32Array(N*N),i,x,y;
  lattice(256,6,rough);lattice(96,2.5,rough);lattice(32,1,rough);lattice(12,.4,rough);lattice(5,.25,fine);
  function bump(arr,cm,rm,cym,fn){
    var cx=cm*SC,cy=cym*SC,r=rm*SC,y0=Math.max(0,Math.floor(cy-r*1.5)),y1=Math.min(N,Math.ceil(cy+r*1.5)),x0=Math.max(0,Math.floor(cx-r*1.5)),x1=Math.min(N,Math.ceil(cx+r*1.5));
    for(var yy=y0;yy<y1;yy++)for(var xx=x0;xx<x1;xx++)arr[yy*N+xx]+=fn(Math.hypot(xx-cx,yy-cy)/r);
  }
  for(i=0;i<40;i++){var r=8+Math.random()*32,d=r*.2;
    bump(rough,Math.random()*WM,r,Math.random()*WM,function(t){return t<1?-d*(1-t*t):.35*d*Math.exp(-Math.pow((t-1.08)/.15,2));});}
  for(i=0;i<1200;i++){var rr=.7+Math.random()*2.3;
    bump(rough,Math.random()*WM,rr,Math.random()*WM,function(t){return t<1?rr*.8*(1-t):0;});}
  for(y=0;y<N;y++)for(x=0;x<N;x++){
    var f=sm((Math.hypot(x/SC-CM,y/SC-CM)-PR)/35);
    hm[y*N+x]=f*rough[y*N+x]+(1-f)*fine[y*N+x];}
  if(p.pb>.5){
    var cnt=Math.round(6+(p.pb-.5)*10);
    for(i=0;i<cnt;i++){
      var a=Math.random()*6.283,rd=Math.sqrt(Math.random())*PR*.95,rk=1.2+Math.random()*1,hk=p.pb*(.6+Math.random()*.4);
      bump(hm,CM+Math.cos(a)*rd,rk,CM+Math.sin(a)*rd,function(t){return t<1?hk*(1-t):0;});}
  }
  var im=ctx.createImageData(N,N),dt=im.data;
  for(y=0;y<N;y++)for(x=0;x<N;x++){
    var xl=hm[y*N+Math.max(0,x-1)],xr=hm[y*N+Math.min(N-1,x+1)],yu=hm[Math.max(0,y-1)*N+x],yd=hm[Math.min(N-1,y+1)*N+x];
    var l=.88+((xl-xr)+(yu-yd))*1.3;l=Math.max(.62,Math.min(1.12,l));
    var sp=(Math.random()-.5)*10,o=(y*N+x)*4;
    dt[o]=Math.min(255,232*l+sp);dt[o+1]=Math.min(255,198*l+sp*.8);dt[o+2]=Math.min(255,156*l+sp*.6);dt[o+3]=255;}
  map.getContext('2d').putImageData(im,0,0);
}
function gnd(x,y){
  var ix=Math.max(0,Math.min(N-1,Math.round(x*SC))),iy=Math.max(0,Math.min(N-1,Math.round(y*SC)));
  return hm[iy*N+ix];
}

/* ---------- симуляция ---------- */
function begin(p){
  P=p;S={x:CM+p.ox,y:CM-p.oy,z:p.alt,vx:p.vx,vy:-p.vy,vz:p.vh,fuel:p.fuel,t:0};
  fuel0=Math.max(1,p.fuel);level=0;run=true;REC=[];recAcc=0;rp.on=false;
  document.getElementById('rbar').style.display='none';
  document.getElementById('res').style.display='none';
  last=performance.now();requestAnimationFrame(loop);
}
function readParams(){
  var p={};
  FIELDS.forEach(function(f){var v=parseFloat(document.getElementById('f_'+f[0]).value);p[f[0]]=isNaN(v)?f[2]:v;});
  p.alt=Math.max(30,Math.min(5000,p.alt));p.dry=Math.max(100,p.dry);p.fuel=Math.max(0,p.fuel);
  p.pd=Math.max(10,p.pd);p.pb=Math.max(0,p.pb);
  p.fv=Math.max(1,p.fv)*1000;p.fh=Math.max(1,p.fh)*1000;
  p.guide=document.getElementById('f_guide').checked;
  return p;
}
function thrust(){
  var has=S.fuel>0;
  return {v:has?level/100*P.fv:0,
    x:has?((keys.ArrowLeft?1:0)-(keys.ArrowRight?1:0)):0,
    y:has?((keys.ArrowUp?1:0)-(keys.ArrowDown?1:0)):0};
}
function rec(T){REC.push([S.x,S.y,S.z,S.vx,S.vy,S.vz,S.fuel,level,T.v,T.x,T.y,S.t]);}
function step(dt){
  var m=P.dry+S.fuel,T=thrust(),Fx=T.x*P.fh,Fy=T.y*P.fh;
  S.fuel=Math.max(0,S.fuel-(T.v+Math.abs(Fx)+Math.abs(Fy))/(ISP*G0)*dt);
  S.vx+=Fx/m*dt;S.vy+=Fy/m*dt;S.vz+=(T.v/m-P.g)*dt;
  S.x+=S.vx*dt;S.y+=S.vy*dt;S.z+=S.vz*dt;S.t+=dt;
  recAcc+=dt;if(recAcc>=1/30){recAcc-=1/30;rec(T);}
  var gs=LEGS.map(function(l){return gnd(S.x+l[0],S.y+l[1]);});
  var gmax=Math.max.apply(null,gs),gmin=Math.min.apply(null,gs);
  if(S.z<=gmax){S.z=gmax;rec(T);land(gmax-gmin,T);}
}
function land(spread,T){
  run=false;
  var vv=-S.vz,vh=Math.hypot(S.vx,S.vy);
  var on=LEGS.every(function(l){return Math.hypot(S.x+l[0]-CM,S.y+l[1]-CM)<=PR;});
  var type,kind='ok';
  if(spread>1){type=tr('type_crash_rough');kind='crash';}
  else if(vv<=1.5&&vh<=.5)type=tr('type_soft');
  else if(vv<=3.5&&vh<=1.5){type=tr('type_hard');kind='hard';}
  else{type=tr('type_crash_impact');kind='crash';}
  passed=on&&kind!=='crash';
  var li=+document.getElementById('lvl').value;
  document.getElementById('next').style.display=(passed&&li<LEVELS.length-1)?'inline-block':'none';
  document.getElementById('rt').textContent=type;
  document.getElementById('rp').innerHTML=(on?tr('res_on_pad'):tr('res_off_pad'))+'<br>'+tr('res_detail',vv.toFixed(1),vh.toFixed(1),spread.toFixed(2),S.fuel.toFixed(0));
  document.getElementById('res').style.display='flex';
  draw(T,level);sound(kind);
}

/* ---------- отрисовка ---------- */
var INK='#2a140d',SHIP='#3d3a40',OR='#e8590c',RD='#d0101e',YL='#e6a800',BL='#1f5fd1',GR='#1b8a3a';
var TOR='#a83d00',TRD='#a00a14',TYL='#85600a',TBL='#174aa5',TGR='#0f6a2a',AX='#0b5a28';
function ln(x0,y0,x1,y1,col,w){ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='butt';ctx.stroke();}
function arrow(x0,y0,x1,y1,col,w){
  var d=Math.hypot(x1-x0,y1-y0);if(d<3)return;
  ln(x0,y0,x1,y1,col,w);
  if(d<14)return;
  var a=Math.atan2(y1-y0,x1-x0),h=15;
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1-h*Math.cos(a-.4),y1-h*Math.sin(a-.4));ctx.lineTo(x1-h*Math.cos(a+.4),y1-h*Math.sin(a+.4));ctx.closePath();ctx.fillStyle=col;ctx.fill();
}
function txt(s,x,y,col,al,size){ctx.font='bold '+(size||16)+'px Georgia';ctx.textAlign=al||'left';ctx.fillStyle=col;ctx.fillText(s,x,y);}
function draw(T,lvl){
  var R=Math.max(0,S.z-gnd(S.x,S.y)),fp=Math.max(48,R*1.4),s=W/fp;
  var m=P.dry+S.fuel,vv=-S.vz,vh=Math.hypot(S.vx,S.vy),aUp=P.fv/m-P.g;
  var D=LEGS.map(function(l){return S.z-gnd(S.x+l[0],S.y+l[1]);});
  ctx.fillStyle='#dcbb92';ctx.fillRect(0,0,W,W);
  ctx.save();ctx.translate(C,C);ctx.scale(s,s);ctx.translate(-S.x,-S.y);
  ctx.imageSmoothingEnabled=true;ctx.drawImage(map,0,0,WM,WM);
  ctx.beginPath();ctx.arc(CM,CM,PR,0,6.3);ctx.fillStyle='rgba(40,170,80,.26)';ctx.fill();
  ctx.lineWidth=3/s;ctx.strokeStyle='#12803a';ctx.stroke();
  var ae=PR+4;
  ctx.lineWidth=2/s;ctx.strokeStyle=AX;ctx.beginPath();ctx.moveTo(CM-ae,CM);ctx.lineTo(CM+ae,CM);ctx.moveTo(CM,CM-ae);ctx.lineTo(CM,CM+ae);ctx.stroke();
  ctx.restore();
  if(s*PR>=24){
    var ax=function(wx,wy,t,al,dx,dy){var px=C+(wx-S.x)*s,py=C+(wy-S.y)*s;txt(t,Math.max(14,Math.min(W-14,px+dx)),Math.max(18,Math.min(W-8,py+dy)),AX,al,15);};
    ax(CM+ae,CM,'+X','left',6,5);ax(CM-ae,CM,'−X','right',-6,5);ax(CM,CM-ae,'+Y','center',0,-6);ax(CM,CM+ae,'−Y','center',0,18);
  }
  txt('+X',W-8,C+5,'#6e4a38','right',14);txt('−X',8,C+5,'#6e4a38','left',14);
  txt('+Y',C,18,'#6e4a38','center',14);txt('−Y',C,W-8,'#6e4a38','center',14);
  var wr=[],badV=false;
  if(S.fuel<=0)wr.push(tr('w_no_fuel'));
  else if(S.fuel<fuel0*.1)wr.push(tr('w_low_fuel'));
  if(vv>0&&R>0&&(aUp<=0?vv>3.5:vv*vv/(2*aUp)>R-3)){wr.push(tr('w_brake'));badV=true;}
  if(R<60&&vv>3.5){wr.push(tr('w_hi_vh'));badV=true;}
  if(R<100&&vh>1.5)wr.push(tr('w_drift'));
  var showL=s>=4,rS=Math.max(3,SR*s);
  LEGS.forEach(function(l,i){
    var px=C+l[0]*s,py=C+l[1]*s;
    if(showL)ln(C,C,px,py,SHIP,3);
    ctx.beginPath();ctx.arc(px,py,showL?6:2.5,0,6.3);ctx.fillStyle='#1f78d1';ctx.fill();
    if(showL)txt(D[i].toFixed(1),px+(l[0]>0?12:l[0]<0?-12:0),py+(l[1]>0?28:l[1]<0?-14:6),INK,l[0]<0?'right':l[0]>0?'left':'center',15);
  });
  ctx.beginPath();ctx.arc(C,C,rS,0,6.3);ctx.fillStyle=SHIP;ctx.fill();
  var k=Math.min(1,300/Math.max(1,25*vh)),vx=C+S.vx*25*k,vy=C+S.vy*25*k;
  arrow(C,C,vx,vy,OR,4);
  if(vh>.05)txt(S.vx.toFixed(1)+' '+(-S.vy).toFixed(1),vx+(vx>=C?10:-10),vy+(vy>=C?22:-10),TOR,vx>=C?'left':'right',15);
  if(T.x||T.y){
    var mg=Math.hypot(T.x,T.y),ux=T.x/mg,uy=T.y/mg,tip=rS+4,tail=tip+90*Math.min(1,mg);
    arrow(C-ux*tail,C-uy*tail,C-ux*tip,C-uy*tip,YL,5);
    var lx=C-ux*(tail+6),ly=C-uy*(tail+6);
    txt((T.x*P.fh/1000).toFixed(0)+' '+(-T.y*P.fh/1000).toFixed(0),lx,ly+(uy>0?-4:18),TYL,'center',15);
  }
  var g0=C+Math.max(LR*s+50,80),gs=30,hl=Math.min(190,46*Math.log(1+R)/Math.LN10);
  var vl=Math.max(-170,Math.min(170,Math.sqrt(Math.abs(S.vz))*30*(S.vz>=0?1:-1))),tl=T.v/P.fv*170,fl=S.fuel/fuel0*170;
  ln(g0-14,C,g0+3*gs+14,C,SHIP,1.5);
  [1,10,100,1000].forEach(function(d){var y=C-46*Math.log(1+d)/Math.LN10;ln(g0-12,y,g0-6,y,BL,2);});
  ln(g0,C,g0,C-hl,BL,7);
  txt(R<100?R.toFixed(1):R.toFixed(0),g0,C-hl-6,TBL,'center',13);
  ln(g0+gs,C,g0+gs,C-vl,RD,7);
  txt(S.vz.toFixed(1),g0+gs,vl>=0?C-vl-6:C-vl+16,TRD,'center',13);
  if(P.guide){
    var vs=Math.sqrt(2*.7*Math.max(aUp,.1)*Math.max(R-3,0))+1,gy=C+Math.min(170,Math.sqrt(vs)*30);
    ln(g0+gs-12,gy,g0+gs+12,gy,INK,3);
  }
  ln(g0+2*gs,C,g0+2*gs,C+tl,YL,7);
  txt((T.v/1000).toFixed(1),g0+2*gs,C+tl+16,TYL,'center',13);
  ln(g0+3*gs,C,g0+3*gs,C-fl,GR,7);
  txt(S.fuel.toFixed(0),g0+3*gs,C-fl-6,TGR,'center',13);
  var wy=C-Math.max(110,LR*s+54);
  wr.forEach(function(w,i){txt(w,C,wy-i*28,'#b00000','center',20);});
  if(S.fuel<=0&&run)txt(tr('accel_x10'),C,W-30,INK,'center',16);
  pe.pH.textContent=R.toFixed(1);pe.pVh.textContent=S.vz.toFixed(2);pe.pVx.textContent=S.vx.toFixed(2);pe.pVy.textContent=(-S.vy).toFixed(2);
  pe.pTh.textContent=(T.v/1000).toFixed(1);pe.pLv.textContent=lvl;
  pe.pTx.textContent=(T.x*P.fh/1000).toFixed(1);pe.pTy.textContent=(-T.y*P.fh/1000).toFixed(1);
  pe.pF.textContent=S.fuel.toFixed(0);pe.pM.textContent=m.toFixed(0);
  pe.pX.textContent=(S.x-CM).toFixed(0);pe.pY.textContent=(CM-S.y).toFixed(0);
  pe.pL.textContent=D.map(function(d){return d.toFixed(1);}).join(' ');pe.pT.textContent=S.t.toFixed(0);
}
function loop(t){
  if(!run)return;
  if(S.fuel<=0)level=0;
  var mult=S.fuel<=0?10:1;
  var dt=Math.min(.05,(t-last)/1000)*mult;last=t;
  var n=Math.min(200,Math.ceil(dt/(1/120)));
  for(var i=0;i<n&&run;i++)step(dt/n);
  if(run){draw(thrust(),level);requestAnimationFrame(loop);}
}

/* ---------- просмотр ---------- */
var seek=document.getElementById('rseek'),spd=document.getElementById('rspd'),pbtn=document.getElementById('rplay');
function setFrame(i){var f=REC[i];S={x:f[0],y:f[1],z:f[2],vx:f[3],vy:f[4],vz:f[5],fuel:f[6],t:f[11]};draw({v:f[8],x:f[9],y:f[10]},f[7]);}
function rloop(ts){
  if(!rp.on)return;
  if(rp.playing)rp.t+=(ts-rp.last)/1000*parseFloat(spd.value);
  rp.last=ts;
  var i=Math.min(REC.length-1,Math.max(0,Math.floor(rp.t*30)));
  if(i>=REC.length-1&&rp.playing){rp.playing=false;pbtn.textContent=tr('replay_restart');}
  setFrame(i);seek.value=i;
  requestAnimationFrame(rloop);
}
document.getElementById('replay').onclick=function(){
  if(!REC.length)return;
  stopBgm();
  document.getElementById('res').style.display='none';
  document.getElementById('rbar').style.display='flex';
  seek.max=REC.length-1;rp.on=true;rp.t=0;rp.playing=true;rp.last=performance.now();pbtn.textContent=tr('pause');
  requestAnimationFrame(rloop);
};
pbtn.onclick=function(){
  if(!rp.playing&&Math.floor(rp.t*30)>=REC.length-1)rp.t=0;
  rp.playing=!rp.playing;pbtn.textContent=rp.playing?tr('pause'):tr('play');
};
seek.oninput=function(){rp.t=this.value/30;};
document.getElementById('rclose').onclick=function(){
  rp.on=false;document.getElementById('rbar').style.display='none';
  setFrame(REC.length-1);document.getElementById('res').style.display='flex';
};

/* ---------- управление ---------- */
addEventListener('keydown',function(e){
  var c=e.code;
  if(c.indexOf('Arrow')===0){keys[c]=true;if(run)e.preventDefault();}
  else if(c==='KeyX'&&run){level=Math.min(100,level+5);e.preventDefault();}
  else if(c==='KeyS'&&run){level=Math.max(0,level-5);e.preventDefault();}
});
addEventListener('keyup',function(e){if(e.code.indexOf('Arrow')===0)keys[e.code]=false;});
function show(sim){
  document.getElementById('setup').style.display=sim?'none':'block';
  document.getElementById('sim').style.display=sim?'flex':'none';
}
function startFlow(){
  initAudio();stopBgm();startBgm();rp.on=false;run=false;
  lastParams=readParams();show(true);
  document.getElementById('res').style.display='none';document.getElementById('rbar').style.display='none';
  ctx.fillStyle='#dcbb92';ctx.fillRect(0,0,W,W);txt(tr('gen_terrain'),C,C,INK,'center',22);
  setTimeout(function(){genTerrain(lastParams);P=lastParams;begin(lastParams);},40);
}
document.getElementById('start').onclick=startFlow;
document.getElementById('again').onclick=function(){initAudio();stopBgm();startBgm();begin(lastParams);};
document.getElementById('next').onclick=function(){setLevel(+document.getElementById('lvl').value+1);startFlow();};
document.getElementById('setupBtn').onclick=function(){run=false;rp.on=false;stopBgm();show(false);};

/* ---------- переводы интерфейса ---------- */
function applyTexts(){
  document.title=tr('doc_title');
  document.querySelectorAll('[data-i18n]').forEach(function(el){el.textContent=tr(el.dataset.i18n);});
  var sh=document.getElementById('sm-simhint');
  if(sh)sh.innerHTML=[tr('hint_sim_1'),tr('hint_sim_2'),tr('hint_sim_3'),tr('hint_sim_4'),tr('hint_sim_5')].join('<br>');
  if(rp&&rp.on&&pbtn){
    pbtn.textContent=rp.playing?tr('pause'):(Math.floor(rp.t*30)>=REC.length-1?tr('replay_restart'):tr('play'));
  }
}
window.addEventListener('langChanged',applyTexts);
applyTexts();
})();
