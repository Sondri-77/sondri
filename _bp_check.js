
const PRINT=/print-pdf/gi.test(location.search), ES=/[?&]lang=es/.test(location.search);
if(PRINT) document.documentElement.classList.add('print-pdf');
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
if(ES){
  document.documentElement.lang='es-CL'; document.title='TripVan × Sondri — El plano';
  $$('[data-es]').forEach(e=>e.innerHTML=e.dataset.es);
  $$('[data-say-es]').forEach(e=>e.dataset.say=e.dataset.sayEs);
  $('#nv-en').classList.remove('on'); $('#nv-es').classList.add('on');
  $('#nv-back').href='es.html#/8'; $('#back2').href='es.html';
}
gsap.ticker.lagSmoothing(0); gsap.config({nullTargetWarn:false});
{ let lf=-1; setInterval(()=>{ if(gsap.ticker.frame===lf) gsap.ticker.tick(); lf=gsap.ticker.frame; },50); }

/* ============ 1. WebGL background: dithered Andes at night, blueprint palette ============ */
const U={pan:0,warm:.2,mx:.7,my:.5,click:99};
(function(){
  if(PRINT) return;
  const cv=$('#bg'), gl=cv.getContext('webgl',{antialias:false,premultipliedAlpha:false}); if(!gl) return;
  const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fs=`precision mediump float;
  uniform vec2 uRes; uniform float uTime,uPan,uWarm,uClick; uniform vec2 uMouse;
  float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
  float B2(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}
  float B4(vec2 a){return B2(.5*a)*.25+B2(a);}
  float B8(vec2 a){return B4(.5*a)*.25+B2(a);}
  void main(){
    vec2 cell=floor(gl_FragCoord.xy); vec2 uv=cell/uRes; float asp=uRes.x/uRes.y;
    float v=mix(.30,.03,smoothstep(.1,1.,uv.y)); float sky=1.;
    for(int k=0;k<3;k++){ float fk=float(k); float base=.42-fk*.13;
      float h=base+(fbm(vec2(uv.x*(1.3+fk*.9)+uPan*(.10+.14*fk)+fk*7.3,fk*3.1))-.5)*(.30-fk*.04);
      if(uv.y<h){ sky=0.; v=.30-fk*.08; v+=smoothstep(.03,.0,h-uv.y)*(fk<1.?.5:.2); v+=(noise(uv*vec2(60.,90.)+fk*13.)-.5)*.10; v-=(h-uv.y)*.5; } }
    float st=h21(cell*.731+.5); if(sky>.5&&st>.992) v=.6+.4*sin(uTime*2.+st*90.);
    vec2 m=vec2(uMouse.x*asp,uMouse.y), q=vec2(uv.x*asp,uv.y); float d=distance(q,m);
    v+=.2*exp(-d*d*28.); v+=.35*exp(-pow((d-uClick*.9)*22.,2.))*exp(-uClick*1.4);
    float l=floor(clamp(v,0.,1.)*3.4+B8(gl_FragCoord.xy));
    vec3 c0=vec3(.02,.05,.085), c1=vec3(.05,.13,.21), c2=vec3(.09,.27,.40), c3=mix(vec3(.50,.83,1.),vec3(1.,.80,.47),uWarm);
    gl_FragColor=vec4(l<.5?c0:l<1.5?c1:l<2.5?c2:c3,1.);
  }`;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.error(gl.getShaderInfoLog(o));return o;};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const L=n=>gl.getUniformLocation(pr,n), uRes=L('uRes'),uTime=L('uTime'),uPan=L('uPan'),uWarm=L('uWarm'),uMouse=L('uMouse'),uClick=L('uClick');
  const sm={x:U.mx,y:U.my};
  function resize(){cv.width=Math.ceil(innerWidth/3);cv.height=Math.ceil(innerHeight/3);gl.viewport(0,0,cv.width,cv.height);}
  addEventListener('resize',resize);resize();
  addEventListener('pointermove',e=>{U.mx=e.clientX/innerWidth;U.my=1-e.clientY/innerHeight;});
  addEventListener('pointerdown',e=>{U.mx=e.clientX/innerWidth;U.my=1-e.clientY/innerHeight;sm.x=U.mx;sm.y=U.my;U.click=0;});
  let last=performance.now();
  gsap.ticker.add(()=>{ const now=performance.now(), dt=(now-last)/1000; last=now; U.click+=dt;
    sm.x+=(U.mx-sm.x)*.06; sm.y+=(U.my-sm.y)*.06;
    gl.uniform2f(uRes,cv.width,cv.height);gl.uniform1f(uTime,now/1000);gl.uniform1f(uPan,U.pan);gl.uniform1f(uWarm,U.warm);gl.uniform2f(uMouse,sm.x,sm.y);gl.uniform1f(uClick,U.click);
    gl.drawArrays(gl.TRIANGLES,0,3); });
})();

/* ============ 2. Reveal ============ */
Reveal.initialize({width:1600,height:900,margin:0,minScale:.2,maxScale:2,center:false,hash:true,controls:true,controlsTutorial:false,progress:false,transition:'fade',backgroundTransition:'none'}).then(()=>{
  if(PRINT) return;
  $('.reveal .slides').appendChild($('#stage'));
  $$('.reveal .slides section').forEach(s=>gsap.set(s.querySelectorAll('.a-up'),{opacity:0,y:26}));
  initRaco(); initScene(); initPhones();
  setTimeout(()=>$('#hint').style.opacity=0,12000);
  Reveal.addKeyBinding({keyCode:73,key:'I',description:'Replay intro'},()=>{ Reveal.slide(0); startIntro(); });
  if(Reveal.getIndices().h===0) startIntro(); else onSlide(Reveal.getCurrentSlide(),Reveal.getIndices().h);
});
Reveal.on('slidechanged',e=>{ if(!PRINT) onSlide(e.currentSlide,e.indexh); });

function onSlide(s,idx){
  if(IN.on) return;
  gsap.fromTo(s.querySelectorAll('.a-up'),{opacity:0,y:26},{opacity:1,y:0,duration:.65,ease:'power3.out',stagger:.055});
  const n=Reveal.getTotalSlides();
  $('#pageno').textContent=String(idx+1).padStart(2,'0')+' / '+String(n).padStart(2,'0');
  gsap.to('#prog i',{width:((idx+1)/n*100)+'%',duration:.8,ease:'power2.out'});
  gsap.to(U,{pan:idx*1.1,warm:idx>=4?.75:.2,duration:2.2,ease:'power2.inOut'});
  const off=s.dataset.scene==='off';
  gsap.to('#scene',{autoAlpha:off?0:1,duration:.5});
  setStage(+s.dataset.stage);
  PH.pause(); PH2.pause(); if(s.dataset.phones==='1') PH.restart(); if(s.dataset.phones==='2') PH2.restart();
  if(!off && s.dataset.raco){ const [x,p]=s.dataset.raco.split(','); RC.pending=s.dataset.say||''; racoTo(+x,p); }
}

/* ============ 3. The house: built stage by stage ============ */
const SC={n:-1};
function initScene(){
  gsap.set('#frame .st',{scaleY:0,transformOrigin:'50% 100%'});
  $$('#truss path').forEach(p=>{ const l=p.getTotalLength(); p.style.strokeDasharray=l; p.style.strokeDashoffset=l; p.dataset.len=l; });
  SC.mix=gsap.timeline({repeat:-1,paused:true}).to('#mx-st',{x:6,duration:.35,yoyo:true,repeat:1,ease:'sine.inOut'},0).fromTo('#mx-flow',{strokeDashoffset:0},{strokeDashoffset:-26,duration:.7,ease:'none'},0);
  gsap.to('#smoke circle',{y:-16,x:6,opacity:0,duration:2.6,repeat:-1,stagger:.5,ease:'sine.out'});
}
function setStage(n){
  const prev=SC.n, fwd=n>prev; if(n===prev) return; SC.n=n;
  const A=(k)=>fwd&&n===k;                       // animate the big build for stage k
  gsap.killTweensOf(['#conc','#form','#mixer','#lumber','#frame .st','#frame .pl','#truss path','#fin','#roof','#walls','#fin .win','#door','#garden','#chim','#bpl']);
  [1,2,3].forEach(i=>$('#lb'+i).classList.toggle('on',n===0||i===n));
  gsap.to('#bpl',{opacity:n===3?.15:1,duration:.5});
  // 01 — pour
  gsap.to('#form',{opacity:n>=1?1:0,duration:.4});
  gsap.to('#mixer',{opacity:n===1?1:0,duration:.4});
  gsap.to('#conc',{attr:{width:n>=1?480:0},duration:A(1)?3.4:.35,delay:A(1)?1.5:0,ease:'none'});
  n===1?SC.mix.play():SC.mix.pause();
  // 02 — frame
  gsap.to('#lumber',{opacity:n===2?1:0,duration:.4});
  const d2=A(2)?1.7:0;
  gsap.to('#frame .st',{scaleY:n>=2?1:0,duration:A(2)?.4:.25,stagger:A(2)?.24:0,delay:d2,ease:A(2)?'back.out(1.7)':'power1.out'});
  gsap.to('#frame .pl',{opacity:n>=2?1:0,duration:.4,delay:A(2)?d2+2.5:0});
  $$('#truss path').forEach((p,i)=>gsap.to(p,{strokeDashoffset:n>=2?0:+p.dataset.len,duration:A(2)?.5:.25,delay:A(2)?d2+2.9+i*.22:0,ease:'power2.out'}));
  // 03 — finish
  if(n>=3){
    gsap.to('#fin',{opacity:1,duration:.3,delay:A(3)?.9:0});
    if(A(3)){
      gsap.fromTo('#walls',{scaleY:0,transformOrigin:'50% 100%'},{scaleY:1,duration:.9,delay:.9,ease:'power2.out'});
      gsap.fromTo('#roof',{y:-160,opacity:0},{y:0,opacity:1,duration:.9,delay:1.6,ease:'bounce.out'});
      gsap.fromTo('#chim',{opacity:0},{opacity:1,duration:.4,delay:2.2});
      gsap.fromTo('#door',{opacity:0,scale:.6,transformOrigin:'50% 100%'},{opacity:1,scale:1,duration:.5,delay:2.3,ease:'back.out(2)'});
      gsap.fromTo('#fin .win',{opacity:0},{opacity:1,duration:.25,delay:2.6,stagger:.25});
      gsap.fromTo('#garden',{opacity:0,y:10},{opacity:1,y:0,duration:.6,delay:3.2});
    } else gsap.set(['#walls','#roof','#chim','#door','#fin .win','#garden'],{opacity:1,scaleY:1,scale:1,y:0});
  } else gsap.to('#fin',{opacity:0,duration:.35});
}

/* ============ 4. Raco on the building site ============ */
const RC={x:-140,s:.58,face:1,pending:''};
function applyR(){ gsap.set('#raco-wrap',{x:RC.x-110,y:470+12*RC.s-323,scale:RC.s}); }
function initRaco(){
  RC.bubble=$('#bubble'); RC.sayEl=$('#say'); applyR();
  gsap.set('.lid',{scaleY:0,transformOrigin:'50% 0%'});
  RC.walk=gsap.timeline({paused:true,repeat:-1})
    .to(['#leg-fn','#leg-bf'],{rotate:20,duration:.2,ease:'sine.inOut',transformOrigin:'50% 0%'},0).to(['#leg-ff','#leg-bn'],{rotate:-20,duration:.2,ease:'sine.inOut',transformOrigin:'50% 0%'},0)
    .to(['#leg-fn','#leg-bf'],{rotate:-20,duration:.4,ease:'sine.inOut'},.2).to(['#leg-ff','#leg-bn'],{rotate:20,duration:.4,ease:'sine.inOut'},.2)
    .to(['#leg-fn','#leg-bf'],{rotate:0,duration:.2,ease:'sine.inOut'},.6).to(['#leg-ff','#leg-bn'],{rotate:0,duration:.2,ease:'sine.inOut'},.6)
    .to('#r-all',{y:-6,duration:.2,yoyo:true,repeat:3,ease:'sine.inOut'},0);
  (function blink(){gsap.timeline({onComplete:()=>gsap.delayedCall(2+Math.random()*3.5,blink)}).to('.lid',{scaleY:1,duration:.07}).to('.lid',{scaleY:0,duration:.12});})();
  gsap.to('#r-medal',{rotate:7,svgOrigin:'209 270',duration:1.6,yoyo:true,repeat:-1,ease:'sine.inOut'});
  gsap.to('#r-tail',{rotate:8,svgOrigin:'50 270',duration:1.1,yoyo:true,repeat:-1,ease:'sine.inOut'});
}
function face(d){ if(d===RC.face) return; RC.face=d; gsap.to('#raco-flip',{scaleX:d,duration:.2}); }
function stopWalk(){ RC.walk.pause(); gsap.to(['#leg-fn','#leg-ff','#leg-bn','#leg-bf'],{rotate:0,duration:.2}); gsap.to('#r-all',{y:0,duration:.2}); }
const PT=[], T=t=>(PT.push(t),t);              // pose tweens, tracked so the walk cycle is never killed with them
function resetPose(){
  PT.forEach(t=>t.kill()); PT.length=0;
  T(gsap.to('#r-head',{rotate:0,duration:.3})); T(gsap.to('#leg-fn',{rotate:0,duration:.25})); T(gsap.to('#r-all',{y:0,scaleY:1,rotate:0,duration:.2}));
  T(gsap.to('#r-hammer',{opacity:0,duration:.15})); T(gsap.to('#r-mouth',{opacity:1,duration:.2})); T(gsap.to('#r-mouth-open',{opacity:0,duration:.2}));
}
function doPose(p){
  PT.forEach(t=>t.kill()); PT.length=0;
  const H={svgOrigin:'212 150'}, LO={transformOrigin:'50% 0%'}, grin=()=>{T(gsap.to('#r-mouth-open',{opacity:1,duration:.15}));T(gsap.to('#r-mouth',{opacity:0,duration:.15}));};
  if(p==='wave'){ grin(); T(gsap.timeline().to('#leg-fn',{...LO,rotate:-70,duration:.3,ease:'back.out(2)'}).to('#leg-fn',{rotate:-50,duration:.18,yoyo:true,repeat:5,ease:'sine.inOut'}).to('#leg-fn',{rotate:0,duration:.4})); }
  if(p==='pour'){ T(gsap.to('#leg-fn',{...LO,rotate:-58,duration:.4,ease:'back.out(2)'})); T(gsap.to('#r-head',{...H,rotate:9,duration:.5,yoyo:true,repeat:-1,ease:'sine.inOut'})); }
  if(p==='hammer'){ T(gsap.to('#r-hammer',{opacity:1,duration:.2})); T(gsap.to('#r-head',{...H,rotate:8,duration:.3}));
    T(gsap.fromTo('#leg-fn',{...LO,rotate:-118},{rotate:-64,duration:.2,ease:'power3.in',yoyo:true,repeat:-1,repeatDelay:.14}));
    T(gsap.to('#r-all',{y:-3,duration:.2,yoyo:true,repeat:-1,repeatDelay:.14,ease:'power2.in'})); }
  if(p==='jump'||p==='celebrate'){ grin(); T(gsap.timeline({repeat:p==='celebrate'?2:0}).to('#r-all',{scaleY:.9,transformOrigin:'50% 100%',duration:.1}).to('#r-all',{y:-64,scaleY:1.05,duration:.3,ease:'power2.out'}).to('#r-all',{y:0,scaleY:1,duration:.34,ease:'power2.in'}));
    if(p==='celebrate') T(gsap.delayedCall(2.6,confetti)); else confetti(); }
}
function say(t){
  const b=RC.bubble; gsap.killTweensOf(b); clearInterval(RC.typer); if(!t){ gsap.set(b,{opacity:0}); return; }
  RC.sayEl.textContent=t; const left=gsap.utils.clamp(0,470,RC.x-50); b.style.left=left+'px'; b.style.top=(470-284*RC.s-b.offsetHeight-12)+'px';
  b.style.setProperty('--tail',gsap.utils.clamp(16,196,RC.x+26-left)+'px'); RC.sayEl.textContent='';
  gsap.fromTo(b,{opacity:0,scale:.6,transformOrigin:'30% 100%'},{opacity:1,scale:1,duration:.4,ease:'back.out(2)'});
  let i=0; RC.typer=setInterval(()=>{RC.sayEl.textContent=t.slice(0,++i); if(i>=t.length) clearInterval(RC.typer);},22);
  gsap.to(b,{opacity:0,duration:.5,delay:Math.max(5.5,t.length*.08)});
}
function racoTo(x,p){
  if(RC.tl) RC.tl.kill(); if(RC.dc) RC.dc.kill(); resetPose(); say('');
  const d=Math.abs(x-RC.x);
  RC.tl=gsap.timeline({onComplete:()=>{ stopWalk(); face(1); RC.dc=gsap.delayedCall(.25,()=>{ doPose(p); say(RC.pending); }); }});
  if(d>4) RC.tl.call(()=>{ face(x>RC.x?1:-1); RC.walk.play(); }).to(RC,{x,duration:gsap.utils.clamp(.5,1.8,d/110),ease:'sine.inOut',onUpdate:applyR});
  else RC.tl.to({},{duration:.05});
}
function confetti(){
  const cols=['#ffcc78','#7fd3ff','#E8F3F8','#F7C062','#5fc4bc'];
  for(let i=0;i<60;i++){ const d=document.createElement('div');
    d.style.cssText=`position:absolute;width:${6+Math.random()*8}px;height:${4+Math.random()*6}px;background:${cols[i%5]};border-radius:2px;left:${RC.x}px;top:330px;`;
    $('#scene').appendChild(d);
    gsap.to(d,{x:(Math.random()-.3)*700,y:-180-Math.random()*300,rotate:Math.random()*720,duration:1+Math.random()*.6,ease:'power2.out'});
    gsap.to(d,{y:'+=560',opacity:0,duration:1.5,delay:1,ease:'power1.in',onComplete:()=>d.remove()}); }
}

/* ============ 5. Animated app mockups ============ */
let PH, PH2;
function initPhones(){
  const C=2*Math.PI*40; $('#tr-fg').style.strokeDasharray=C;
  const ml=$('#mc-line'), mlen=ml.getTotalLength(); ml.style.strokeDasharray=mlen;
  const k={a:0,b:0,c:0};
  PH=gsap.timeline({paused:true,repeat:-1,repeatDelay:2})
    .set('#rok',{opacity:0,y:20}).set('#rs',{opacity:1,y:0}).set('#tap',{opacity:0,scale:1}).set('#deal',{opacity:0,y:8}).set('#cb',{opacity:1,scale:1}).set('#gt1',{opacity:1}).set('#gt2',{opacity:0}).set('#mt',{scale:0})
    .fromTo('#tr-fg',{strokeDashoffset:C},{strokeDashoffset:C*.06,duration:1.4,ease:'power2.out'},.6)
    .fromTo('.tb u',{width:'0%'},{width:i=>$$('.tb u')[i].dataset.w+'%',duration:1,stagger:.12,ease:'power2.out'},.7)
    .fromTo('#rbg',{scale:1},{scale:1.14,duration:8,ease:'none'},0)
    .fromTo('#rp',{width:'0%'},{width:'100%',duration:8,ease:'none'},0)
    .to('#tap',{opacity:1,duration:.2},3).fromTo('#tap',{scale:1.6},{scale:.8,duration:.3,ease:'power2.in'},3.1).to('#rb',{scale:.92,duration:.1,yoyo:true,repeat:1},3.4).to('#tap',{opacity:0,scale:2,duration:.3},3.5)
    .to('#rs',{opacity:0,y:20,duration:.3},3.7).to('#rok',{opacity:1,y:0,duration:.5,ease:'back.out(2)'},3.9)
    .to('#mt',{scale:1,duration:.5,ease:'back.out(3)'},1.4)
    .to('#cb',{scale:.95,duration:.1,yoyo:true,repeat:1},4.6).to('#cb',{opacity:.45,duration:.3},4.8).to('#deal',{opacity:1,y:0,duration:.5,ease:'back.out(2)'},5)
    .fromTo(k,{a:0,b:0,c:0},{a:128,b:312,c:6.4,duration:2.4,ease:'power2.out',onUpdate(){ $('#k1').textContent=Math.round(k.a)+'K'; $('#k2').textContent=Math.round(k.b); $('#k3').textContent=k.c.toFixed(1)+'×'; }},.8)
    .fromTo(ml,{strokeDashoffset:mlen},{strokeDashoffset:0,duration:2.4,ease:'power2.inOut'},.8).fromTo('#mc-area',{opacity:0},{opacity:1,duration:1},2.4)
    .fromTo('#gb',{width:'0%'},{width:'100%',duration:4.5,ease:'power1.inOut'},1.2).to('#gt1',{opacity:0,duration:.2},5.7).to('#gt2',{opacity:1,duration:.3},5.8)
    .to({}, {duration:.1},8.5);
  // second set: map, live trip, creator profile, business dashboard
  const rt=$('#mp-route'), rl=rt.getTotalLength(), vn=$('#mp-van'), o={t:0}, n={bk:0,earn:0,v1:0,v2:0,v3:0}, clp=x=>Math.round(x).toLocaleString('es-CL');
  PH2=gsap.timeline({paused:true,repeat:-1,repeatDelay:2})
    .set('#tl .ts i',{backgroundColor:'#1c2c38',scale:1}).set('#rate',{opacity:0,y:8})
    .fromTo('.mp-pin',{scale:0,transformOrigin:'50% 50%'},{scale:1,duration:.4,stagger:.25,ease:'back.out(3)'},.5)
    .fromTo(o,{t:0},{t:1,duration:6,ease:'sine.inOut',onUpdate(){ const p=rt.getPointAtLength(o.t*rl); vn.setAttribute('transform',`translate(${p.x},${p.y})`); }},.8)
    .to('#tl .ts:nth-child(-n+3) i',{backgroundColor:'#5fc4bc',duration:.3,stagger:.7},.8)
    .to('#tl .ts.now i',{backgroundColor:'#ffcc78',duration:.3},3)
    .to('#tl .ts.now i',{scale:1.7,duration:.5,yoyo:true,repeat:7,ease:'sine.inOut'},3.2)
    .to('#rate',{opacity:1,y:0,duration:.5,ease:'back.out(2)'},4.2)
    .fromTo('#g3 div',{opacity:0,scale:.7},{opacity:1,scale:1,duration:.4,stagger:.12,ease:'back.out(2)'},.6)
    .fromTo(n,{bk:0,earn:0,v1:0,v2:0,v3:0},{bk:126,earn:1920000,v1:312,v2:87,v3:486000,duration:2.6,ease:'power2.out',onUpdate(){ $('#c-bk').textContent=Math.round(n.bk); $('#c-earn').textContent=clp(n.earn); $('#v1').textContent=Math.round(n.v1); $('#v2').textContent=Math.round(n.v2); $('#v3').textContent=clp(n.v3); }},1)
    .fromTo('#vb u',{scaleY:0},{scaleY:1,duration:.7,stagger:.1,ease:'back.out(1.6)'},.8)
    .fromTo('#pay',{scale:1},{scale:1.05,duration:.25,yoyo:true,repeat:1},3.8)
    .to({}, {duration:.1},8);
}

/* ============ 6. Intro: Raco's spaceship flies through the rotating blueprint ============ */
const IN={on:false,rot:0,draw:0,house:0,hs:1,grid:0,charts:0,shipA:0,shipT:0,follow:0,away:0,chart:0,curve:0,rocket:0,last:0};
let icv,ictx,W=0,H=0,DPR=1; const parts=[], trail=[], fly=[];
const SEG=(()=>{ const s=[], L=(a,b)=>s.push([a,b]);
  const A=[-1,0,-.7],B=[1,0,-.7],C=[1,0,.7],D=[-1,0,.7],E=[-1,1.2,-.7],F=[1,1.2,-.7],G=[1,1.2,.7],Hh=[-1,1.2,.7],R1=[-1,1.9,0],R2=[1,1.9,0];
  L(A,B);L(B,C);L(C,D);L(D,A);L(A,E);L(B,F);L(C,G);L(D,Hh);L(E,F);L(F,G);L(G,Hh);L(Hh,E);L(E,R1);L(Hh,R1);L(F,R2);L(G,R2);L(R1,R2);
  const q=(x0,y0,x1,y1,z)=>{L([x0,y0,z],[x0,y1,z]);L([x0,y1,z],[x1,y1,z]);L([x1,y1,z],[x1,y0,z]);L([x1,y0,z],[x0,y0,z]);};
  q(-.2,0,.2,.75,.7); q(-.8,.45,-.42,.85,.7); q(.42,.45,.8,.85,.7); q(-.8,.45,-.42,.85,-.7); q(.42,.45,.8,.85,-.7);
  L([0,0,-.7],[0,0,.7]); L([-1,0,0],[0,0,0]); L([.35,0,-.7],[.35,0,0]); L([0,0,0],[1,0,0]);
  L([-1,0,1.15],[1,0,1.15]); L([-1,0,1.05],[-1,0,1.25]); L([1,0,1.05],[1,0,1.25]); L([1.4,0,-.7],[1.4,0,.7]); L([1.3,0,-.7],[1.5,0,-.7]); L([1.3,0,.7],[1.5,0,.7]);
  // elevation dimensions, foundation footing, rafters, centre lines
  L([-1.35,0,.7],[-1.35,1.2,.7]); L([-1.45,0,.7],[-1.25,0,.7]); L([-1.45,1.2,.7],[-1.25,1.2,.7]); L([-1.6,0,0],[-1.6,1.9,0]); L([-1.7,1.9,0],[-1.5,1.9,0]); L([-1.7,0,0],[-1.5,0,0]);
  const f=-.14; L([-1.1,f,-.8],[1.1,f,-.8]); L([1.1,f,-.8],[1.1,f,.8]); L([1.1,f,.8],[-1.1,f,.8]); L([-1.1,f,.8],[-1.1,f,-.8]); [[-1.1,-.8],[1.1,-.8],[1.1,.8],[-1.1,.8]].forEach(([x,z])=>L([x,f,z],[x,0,z]));
  for(let i=1;i<6;i++){ const x=-1+i/3; L([x,1.2,-.7],[x,1.9,0]); L([x,1.2,.7],[x,1.9,0]); }
  for(let i=1;i<8;i++){ const x=-1+i*.25; L([x,0,-.7],[x,1.2,-.7]); }
  return s; })();
const NODES=[[-1,0,-.7],[1,0,-.7],[1,0,.7],[-1,0,.7],[-1,1.2,-.7],[1,1.2,-.7],[1,1.2,.7],[-1,1.2,.7],[-1,1.9,0],[1,1.9,0]];
const LAB=[{p:[0,0,1.15],t:'12.40 m',dx:2,dy:3},{p:[1.4,0,0],t:'8.60 m',dx:3,dy:2},{p:[-1.35,.6,.7],t:'h 3.20',dx:-3,dy:-1},{p:[-1.6,1.9,0],t:'▲ +5.10',dx:-2,dy:-2},
  {p:[0,.75,.7],t:'D-01 0.90×2.10',dx:4,dy:-3},{p:[.61,.85,.7],t:'W-02',dx:4,dy:-5},
  {p:[.9,-.14,.8],t:'01 · FOUNDATION  C25',dx:5,dy:4,g:1},{p:[1,.7,-.7],t:'02 · FRAMING  2×4 @ 0.40',dx:5,dy:-2,g:1},{p:[.4,1.72,-.18],t:'03 · ROOF  30°',dx:5,dy:-4,g:1}];
function rotY(p,a,k){ const c=Math.cos(a), s=Math.sin(a); return [(p[0]*c+p[2]*s)*k,p[1]*k,(-p[0]*s+p[2]*c)*k]; }
function proj(p){ const ct=Math.cos(.3), st=Math.sin(.3); const y=p[1]-.75; const y2=y*ct-p[2]*st, z2=y*st+p[2]*ct+4.8; const f=H*1.2; return [W/2+p[0]*f/z2, H*.52-y2*f/z2, z2]; }
function line(a,b,t){ ictx.beginPath(); ictx.moveTo(a[0],a[1]); ictx.lineTo(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t); ictx.stroke(); }
function gcurve(p){ return (Math.exp(4.6*p)-1)/(Math.exp(4.6)-1); }
function chartPt(p){ const x0=W*.24,x1=W*.66,y0=H*.8,y1=H*.26; return [x0+(x1-x0)*p, y0-(y0-y1)*gcurve(p)]; }
function burst(x,y,n,pow){
  const cols=['#ffcc78','#ffe7b3','#7fd3ff','#ffffff','#ff9f7a','#5fc4bc'];
  for(let i=0;i<n;i++){ const a=Math.random()*6.283, sp=(.25+Math.random())*pow*H;
    parts.push({x,y,px:x,py:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,age:0,c:cols[(Math.random()*cols.length)|0],r:(1.6+Math.random()*2)*DPR,star:(.6+Math.random()*1.2)*DPR,tw:Math.random()*6}); }
}
function drawIntro_v1(){   /* superseded by the chase-camera intro at the end of this script */
  if(!IN.on) return;
  const now=performance.now(), dt=Math.min(.05,(now-IN.last)/1000); IN.last=now; const c=ictx;
  c.clearRect(0,0,W,H); c.lineCap='round';
  // graphs flying by
  if(IN.charts>.01){ fly.forEach(o=>{ o.z-=dt*(4+o.sp)*IN.charts; if(o.z<.7){ o.z=13+Math.random()*3; const a=Math.random()*6.283, r=1.6+Math.random()*2.6; o.x=Math.cos(a)*r; o.y=Math.sin(a)*r*.6; }
      const f=H*.9, sx=W/2+o.x*f/o.z, sy=H/2+o.y*f/o.z, sz=f*.42/o.z, al=Math.min(1,(15-o.z)/4)*Math.min(1,(o.z-.7)/1.2)*IN.charts*.9;
      c.globalAlpha=al; c.strokeStyle=c.fillStyle=o.gold?'#ffcc78':'#7fd3ff'; c.lineWidth=Math.max(1,sz*.05);
      if(o.type===0){ for(let i=0;i<5;i++){ const h=sz*[.14,.24,.4,.64,1][i]; c.fillRect(sx+i*sz*.22,sy-h,sz*.15,h); } c.beginPath(); c.moveTo(sx-sz*.05,sy+sz*.04); c.lineTo(sx+sz*1.15,sy+sz*.04); c.stroke(); }
      else { c.beginPath(); for(let i=0;i<=12;i++){ const p=i/12, X=sx+p*sz*1.1, Y=sy-gcurve(p)*sz; i?c.lineTo(X,Y):c.moveTo(X,Y); } c.stroke();
        const X=sx+sz*1.1, Y=sy-sz; c.beginPath(); c.moveTo(X,Y-sz*.12); c.lineTo(X+sz*.09,Y+sz*.08); c.lineTo(X-sz*.12,Y+sz*.03); c.closePath(); c.fill();
        if(o.type===2){ c.font=`700 ${Math.max(8,sz*.22)}px Space Mono, monospace`; c.fillText(o.txt,sx,sy+sz*.32); } }
    }); c.globalAlpha=1; }
  // rotating blueprint house
  if(IN.house>.01){
    c.strokeStyle='#7fd3ff'; c.shadowColor='#7fd3ff'; c.shadowBlur=8*DPR;
    c.globalAlpha=.22*IN.house*IN.grid; c.lineWidth=1*DPR;
    for(let i=-6;i<=6;i++){ line(proj(rotY([i*.5,0,-3],IN.rot,IN.hs)),proj(rotY([i*.5,0,3],IN.rot,IN.hs)),1); line(proj(rotY([-3,0,i*.5],IN.rot,IN.hs)),proj(rotY([3,0,i*.5],IN.rot,IN.hs)),1); }
    c.globalAlpha=IN.house; c.lineWidth=2*DPR;
    SEG.forEach((s,i)=>{ const t=gsap.utils.clamp(0,1,IN.draw*SEG.length-i); if(t>0) line(proj(rotY(s[0],IN.rot,IN.hs)),proj(rotY(s[1],IN.rot,IN.hs)),t); });
    c.shadowBlur=0;
    // --- technical drawing layer: survey rings, nodes, dimensions, callouts, HUD ---
    const RP=p=>proj(rotY(p,IN.rot,IN.hs)), tech=IN.house*IN.grid, fs=H*.0155;
    c.lineWidth=1*DPR; c.globalAlpha=.4*tech;
    [1.7,2.5,3.3].forEach((r,ri)=>{ c.setLineDash(ri===1?[4*DPR,6*DPR]:[]); c.beginPath(); for(let i=0;i<=72;i++){ const a=i/72*6.283, q=RP([Math.cos(a)*r,0,Math.sin(a)*r]); i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]); } c.stroke(); });
    c.setLineDash([]);
    c.font=`${fs*.8}px Space Mono, monospace`; c.fillStyle='#7fd3ff'; c.textAlign='center';
    for(let d=0;d<360;d+=15){ const a=d/57.296, q1=RP([Math.cos(a)*3.3,0,Math.sin(a)*3.3]), q2=RP([Math.cos(a)*(d%45?3.4:3.5),0,Math.sin(a)*(d%45?3.4:3.5)]); line(q1,q2,1);
      if(d%45===0){ const q=RP([Math.cos(a)*3.75,0,Math.sin(a)*3.75]); c.fillText(String(d).padStart(3,'0')+'°',q[0],q[1]); } }
    const dn=gsap.utils.clamp(0,1,IN.draw*2.2-1);                               // annotations fade in once the frame exists
    c.globalAlpha=tech*dn;
    NODES.forEach(v=>{ const q=RP(v); c.beginPath(); c.arc(q[0],q[1],3.2*DPR,0,6.283); c.fillStyle='#04101c'; c.fill(); c.stroke(); });
    const ax=[-2.7,0,2.7], o=RP(ax); [['X',[.55,0,0]],['Y',[0,.55,0]],['Z',[0,0,-.55]]].forEach(([n,d])=>{ const e=RP([ax[0]+d[0],d[1],ax[2]+d[2]]); c.strokeStyle='#ffcc78'; line(o,e,1); c.fillStyle='#ffcc78'; c.fillText(n,e[0]+(e[0]-o[0])*.25,e[1]+(e[1]-o[1])*.25); });
    c.strokeStyle='#7fd3ff';
    LAB.forEach(l=>{ const q=RP(l.p), tx=q[0]+l.dx*fs, ty=q[1]+l.dy*fs; c.beginPath(); c.moveTo(q[0],q[1]); c.lineTo(tx,ty); c.lineTo(tx+(l.dx>0?1:-1)*fs*1.2,ty); c.strokeStyle=c.fillStyle=l.g?'#ffcc78':'#7fd3ff'; c.stroke();
      c.beginPath(); c.arc(q[0],q[1],2*DPR,0,6.283); c.fill(); c.textAlign=l.dx>0?'left':'right'; c.font=`${l.g?'700 ':''}${fs}px Space Mono, monospace`; c.fillText(l.t,tx+(l.dx>0?1.6:-1.6)*fs,ty+fs*.35); });
    // HUD (screen space)
    c.globalAlpha=tech*.9; c.strokeStyle=c.fillStyle='#7fd3ff'; c.lineWidth=1.5*DPR; c.textAlign='left'; c.font=`${fs}px Space Mono, monospace`;
    const m=H*.05, b=H*.045; [[m,m,1,1],[W-m,m,-1,1],[m,H-m,1,-1],[W-m,H-m,-1,-1]].forEach(([x,y,sx2,sy2])=>{ c.beginPath(); c.moveTo(x+b*sx2,y); c.lineTo(x,y); c.lineTo(x,y+b*sy2); c.stroke(); });
    const deg=(((IN.rot+.5)*57.296)%360+360)%360;
    [['ROT  '+deg.toFixed(1).padStart(5,'0')+'°'],['ELEV 17.2°'],['SCALE 1:100'],['GRID 0.50 m'],['SEG  '+Math.min(SEG.length,Math.round(IN.draw*SEG.length))+'/'+SEG.length]].forEach((r,i)=>c.fillText(r[0],W-m-fs*11,m+fs*(2.2+i*1.5)));
    const bx=m+fs, by=H-m-fs*6.4, bw=fs*21, bh=fs*5.6; c.strokeRect(bx,by,bw,bh); c.beginPath(); c.moveTo(bx,by+bh*.36); c.lineTo(bx+bw,by+bh*.36); c.moveTo(bx+bw*.62,by+bh*.36); c.lineTo(bx+bw*.62,by+bh); c.stroke();
    c.font=`700 ${fs*1.15}px Space Mono, monospace`; c.fillText('TRIPVAN · DIGITAL HOUSE',bx+fs*.7,by+fs*1.4);
    c.font=`${fs*.85}px Space Mono, monospace`; c.fillText('DWG TV-001 · SHEET 2/2',bx+fs*.7,by+fs*3.2); c.fillText('DRAWN: SONDRI · CHK: RACO',bx+fs*.7,by+fs*4.6); c.fillText('REV A',bx+bw*.62+fs*.7,by+fs*3.2); c.fillText('2026',bx+bw*.62+fs*.7,by+fs*4.6);
    const sy0=(now/2600%1)*H; const sg=c.createLinearGradient(0,sy0-H*.08,0,sy0); sg.addColorStop(0,'rgba(127,211,255,0)'); sg.addColorStop(1,'rgba(127,211,255,.16)'); c.globalAlpha=tech; c.fillStyle=sg; c.fillRect(0,sy0-H*.08,W,H*.08);
    c.globalAlpha=1; c.textAlign='left';
  }
  // big ROI chart
  if(IN.chart>.01){
    const x0=W*.24,x1=W*.66,y0=H*.8,y1=H*.26;
    c.globalAlpha=IN.chart*.5; c.strokeStyle='#7fd3ff'; c.lineWidth=1*DPR;
    for(let i=1;i<=5;i++){ const y=y0-(y0-y1)*i/5; c.beginPath(); c.moveTo(x0,y); c.lineTo(x1,y); c.stroke(); }
    c.globalAlpha=IN.chart; c.lineWidth=2.5*DPR; c.beginPath(); c.moveTo(x0,y1-H*.04); c.lineTo(x0,y0); c.lineTo(x1+W*.04,y0); c.stroke();
    c.fillStyle='#7fd3ff'; c.font=`700 ${H*.022}px Space Mono, monospace`; c.fillText('ROI',x0-H*.07,y1-H*.02);
    ['01','02','03'].forEach((t,i)=>c.fillText(t,x0+(x1-x0)*(.18+i*.33),y0+H*.04));
    if(IN.curve>0){
      const N=60; c.beginPath(); c.moveTo(x0,y0);
      for(let i=0;i<=N;i++){ const pt=chartPt(IN.curve*i/N); c.lineTo(pt[0],pt[1]); }
      const tip=chartPt(IN.curve); c.lineTo(tip[0],y0); c.closePath();
      const g=c.createLinearGradient(0,y1,0,y0); g.addColorStop(0,'rgba(255,204,120,.5)'); g.addColorStop(1,'rgba(255,204,120,0)'); c.fillStyle=g; c.fill();
      c.beginPath(); for(let i=0;i<=N;i++){ const pt=chartPt(IN.curve*i/N); i?c.lineTo(pt[0],pt[1]):c.moveTo(pt[0],pt[1]); }
      c.strokeStyle='#ffcc78'; c.lineWidth=5*DPR; c.shadowColor='#ffcc78'; c.shadowBlur=24*DPR; c.stroke();
      if(IN.rocket>0){ const ry=tip[1]-(tip[1]-H*.1)*IN.rocket; c.beginPath(); c.moveTo(tip[0],tip[1]); c.lineTo(tip[0],ry); c.stroke(); c.fillStyle='#fff'; c.beginPath(); c.arc(tip[0],ry,7*DPR,0,6.283); c.fill(); }
      else { c.fillStyle='#fff'; c.beginPath(); c.arc(tip[0],tip[1],6*DPR,0,6.283); c.fill(); }
      c.shadowBlur=0;
    }
    c.globalAlpha=1;
  }
  // ship (DOM) + trail
  // flight path lives in the blueprint's own space, so the whole scene turns together:
  // in through the front door, across the rooms, out the back, up and over the roof, round again
  const t=IN.shipT, P=[1.7*Math.sin(2*t)*Math.abs(Math.sin(t)),.5+.42*Math.sin(1.7*t)+.9*Math.pow(Math.sin(t*.5),8),2.7*Math.sin(t)], sp=proj(rotY(P,IN.rot,1));
  const tip=chartPt(IN.curve); let sx=sp[0]+(tip[0]-sp[0])*IN.follow, sy=sp[1]+(tip[1]-H*.07-sp[1])*IN.follow;
  sx+=IN.away*W*.55; sy-=IN.away*H*.5;
  const k=(1-IN.follow)*(4.3/sp[2])+IN.follow*.8, sc=k*(H/900)/DPR*.95;
  const el=$('#ship'), cx=sx/DPR, cy=sy/DPR, vx=cx-(IN.px||cx), vy=cy-(IN.py||cy); IN.px=cx; IN.py=cy;
  if(Math.abs(vx)>.4) IN.dir=vx>0?1:-1;
  IN.tilt=(IN.tilt||0)+((gsap.utils.clamp(-24,24,vy*3)*(IN.dir||1))-(IN.tilt||0))*.15;
  el.style.opacity=IN.shipA; el.style.zIndex=(sp[2]>4.8&&IN.follow<.5)?1:3;
  el.style.transform=`translate(${cx-110}px,${cy-66}px) scale(${sc*(IN.dir||1)},${sc}) rotate(${IN.tilt}deg)`;
  if(IN.shipA>.05){ trail.push([sx,sy,sc]); if(trail.length>26) trail.shift(); trail.forEach((p,i)=>{ c.globalAlpha=i/26*.5*IN.shipA; c.fillStyle='#ffe7b3'; c.beginPath(); c.arc(p[0],p[1]+10*p[2]*DPR,(1+i/26*5)*p[2]*DPR,0,6.283); c.fill(); }); c.globalAlpha=1; }
  // fireworks → stars
  for(const p of parts){ p.age+=dt; p.px=p.x; p.py=p.y; const dr=Math.pow(.955,dt*60); p.vx*=dr; p.vy*=dr; if(p.age<1.1) p.vy+=H*.12*dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
    const s=gsap.utils.clamp(0,1,(p.age-1.2)/1.6);                          // 0 = firework, 1 = star
    c.globalAlpha=(1-s)+s*(.55+.45*Math.sin(now/300+p.tw)); c.strokeStyle=c.fillStyle=s>.6?'#eaf6ff':p.c;
    if(s<.5){ c.lineWidth=p.r*(1-s); c.beginPath(); c.moveTo(p.px,p.py); c.lineTo(p.x,p.y); c.stroke(); }
    c.beginPath(); c.arc(p.x,p.y,p.r*(1-s)+p.star*s,0,6.283); c.fill(); }
  c.globalAlpha=1;
}
function startIntro_v1(){   /* superseded */
  if(IN.on) return; IN.on=true;
  const html=document.documentElement; html.classList.add('intro-on'); Reveal.configure({keyboard:false});
  icv=$('#bi-cv'); ictx=icv.getContext('2d'); DPR=Math.min(devicePixelRatio||1,1.5);
  const rs=()=>{ W=icv.width=innerWidth*DPR; H=icv.height=innerHeight*DPR; }; rs(); addEventListener('resize',rs);
  parts.length=0; trail.length=0; fly.length=0;
  for(let i=0;i<16;i++){ const a=Math.random()*6.283, r=1.6+Math.random()*2.6; fly.push({x:Math.cos(a)*r,y:Math.sin(a)*r*.6,z:2+Math.random()*13,sp:Math.random()*3,type:i%3,gold:i%2,txt:['ROI ↑','+38%','×6.4','+120%','×12'][i%5]}); }
  Object.assign(IN,{rot:-.5,draw:0,house:1,hs:1,grid:0,charts:0,shipA:0,shipT:-.9,follow:0,away:0,chart:0,curve:0,rocket:0,last:performance.now(),px:0,py:0,tilt:0,dir:1});
  gsap.set('#stage',{opacity:0}); gsap.set($$('.reveal .slides section')[0].querySelectorAll('.a-up'),{opacity:0});
  gsap.set('#intro',{opacity:1}); gsap.set('#bi-grid',{opacity:1}); gsap.set(['#bi-dim','#bi-cap','#bi-title','#bi-sub'],{opacity:0});
  $$('#bi-title .w').forEach(w=>{ if(!w.dataset.split){ w.dataset.split=1; w.innerHTML=[...w.textContent].map(ch=>`<span class="ch">${ch}</span>`).join(''); }});
  gsap.ticker.add(drawIntro);
  const FW=[[.66,.1,150,.55],[.3,.2,90,.4],[.82,.3,90,.42],[.5,.14,110,.46],[.16,.36,70,.36],[.9,.14,70,.36],[.42,.34,80,.38]];
  const tl=gsap.timeline({onComplete:finish});
  tl.fromTo('#bi-cap',{opacity:0,letterSpacing:'.2em'},{opacity:1,letterSpacing:'.6em',duration:1.4,ease:'power2.out'},.2)
    .to(IN,{grid:1,duration:1},.5).to(IN,{draw:1,duration:3.6,ease:'power1.inOut'},.7)
    .to(IN,{rot:-.5+Math.PI*2,duration:7.6,ease:'sine.inOut'},1)
    .to(IN,{shipA:1,duration:.5},1.5).to(IN,{shipT:-.9+Math.PI*4,duration:7.2,ease:'none'},1.5)
    .to(IN,{charts:1,duration:1.2},2.2).to('#bi-cap',{opacity:0,duration:.6},3)
    .to(IN,{house:0,hs:.55,duration:1,ease:'power2.in'},8.3).to(IN,{charts:0,duration:1},8.6)
    .to(IN,{chart:1,duration:.8},8.7).to(IN,{follow:1,duration:1.1,ease:'power2.inOut'},8.6)
    .to(IN,{curve:1,duration:2.5,ease:'power1.in'},9.4)
    .to(IN,{rocket:1,duration:.4,ease:'power2.in'},11.9).to(IN,{away:1,duration:1.1,ease:'power2.in'},11.9)
    .call(()=>{ const t=chartPt(1); burst(t[0],H*.1,170,.6); },[],12.3)
    .to('#bi-grid',{opacity:0,duration:1.4},12.2).to(IN,{chart:0,duration:1},12.4).to(IN,{shipA:0,duration:.3},12.9);
  FW.slice(1).forEach((f,i)=>tl.call(()=>burst(W*f[0],H*f[1],f[2],f[3]),[],12.6+i*.24));
  tl.to('#bi-dim',{opacity:.55,duration:1.2},14.2)
    .set('#bi-title',{opacity:1},14.6)
    .fromTo('#bi-title .ch',{opacity:0,scale:2.6,filter:'blur(14px)'},{opacity:1,scale:1,filter:'blur(0px)',duration:.7,ease:'expo.out',stagger:.045},14.6)
    .fromTo('#bi-title .plus',{opacity:0,rotate:-180,scale:0},{opacity:1,rotate:0,scale:1,duration:.6,ease:'back.out(3)'},14.95)
    .fromTo('#bi-sub',{opacity:0,letterSpacing:'.1em'},{opacity:1,letterSpacing:'.55em',duration:1.2,ease:'power2.out'},15.3)
    .to('#intro',{opacity:0,duration:1.3,ease:'power2.inOut'},17.6);
  const skip=()=>{ if(tl.progress()<1) tl.progress(1); }, onKey=e=>{ e.preventDefault(); skip(); };
  addEventListener('keydown',onKey,true); $('#bi-skip').addEventListener('click',skip);
  function finish(){
    removeEventListener('keydown',onKey,true); $('#bi-skip').removeEventListener('click',skip); removeEventListener('resize',rs);
    gsap.ticker.remove(drawIntro); IN.on=false; parts.length=0;
    html.classList.remove('intro-on'); Reveal.configure({keyboard:true});
    gsap.to('#stage',{opacity:1,duration:.6}); SC.n=-1; RC.x=-140; applyR();
    onSlide(Reveal.getCurrentSlide(),Reveal.getIndices().h);
  }
}

/* ============ 7. Intro v2 — chase camera: we follow Raco's fighter from behind as it
   flies through the blueprint house; then the ROI curve launches like a firework. ============ */
const v3={sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add:(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k],dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];},
  lerp:(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]};
const CAM={C:[0,1,-6],T:[0,.6,0],R:[1,0,0],U:[0,1,0],Z:[0,0,1]}, NEAR=.12;
// flight path: in through the back wall, across the rooms, out the front door, a wide turn, back in, up under the roof
function fpath(t){ return [1.7*Math.sin(2*t)*Math.abs(Math.sin(t)), .5+.38*Math.sin(1.7*t)+.75*Math.pow(Math.sin(t*.5),8), 2.7*Math.sin(t)]; }
function camUpdate(dt){
  const P=fpath(IN.shipT), F=v3.norm(v3.sub(fpath(IN.shipT+.06),P)), Fh=v3.norm([F[0],F[1]*.35,F[2]]);
  const Cd=v3.add(v3.add(P,Fh,-IN.cd),[0,1,0],.3+IN.cd*.14), Td=v3.add(P,Fh,1.2);
  const k=IN.snap?1:Math.min(1,dt*3); IN.snap=0;
  CAM.C=v3.lerp(CAM.C,Cd,k); CAM.T=v3.lerp(CAM.T,Td,k);
  CAM.Z=v3.norm(v3.sub(CAM.T,CAM.C)); CAM.R=v3.norm(v3.cross([0,1,0],CAM.Z)); CAM.U=v3.cross(CAM.Z,CAM.R);
  IN.hdg=((Math.atan2(F[0],F[2])*57.296)+360)%360; return P;
}
function V(p){ const d=v3.sub(p,CAM.C); return [v3.dot(d,CAM.R),v3.dot(d,CAM.U),v3.dot(d,CAM.Z)]; }
function S(v){ const f=H*.95/v[2]; return [W/2+v[0]*f,H*.56-v[1]*f,v[2]]; }
function P2(p){ const v=V(p); return v[2]<NEAR?null:S(v); }
function seg(a,b,t){                                   // add one near-clipped 3D segment to the current path
  let va=V(a), vb=V(b); if(t!==undefined&&t<1) vb=v3.lerp(va,vb,t);
  if(va[2]<NEAR&&vb[2]<NEAR) return;
  if(va[2]<NEAR) va=v3.lerp(va,vb,(NEAR-va[2])/(vb[2]-va[2])); else if(vb[2]<NEAR) vb=v3.lerp(vb,va,(NEAR-vb[2])/(va[2]-vb[2]));
  const s1=S(va), s2=S(vb); ictx.moveTo(s1[0],s1[1]); ictx.lineTo(s2[0],s2[1]);
}
const RINGS=[1.7,2.5,3.3].map(r=>Array.from({length:61},(_,i)=>[Math.cos(i/60*6.283)*r,0,Math.sin(i/60*6.283)*r]));
const SHIP_REAR=`<svg viewBox="0 0 200 120">
  <path d="M100 62 L6 42 L6 54 L100 78 Z" fill="#aebcc4" stroke="#56707f" stroke-width="2"/><path d="M100 62 L194 42 L194 54 L100 78 Z" fill="#aebcc4" stroke="#56707f" stroke-width="2"/>
  <path d="M100 72 L42 106 L50 111 L100 84 Z" fill="#8fa0aa" stroke="#56707f" stroke-width="2"/><path d="M100 72 L158 106 L150 111 L100 84 Z" fill="#8fa0aa" stroke="#56707f" stroke-width="2"/>
  <path d="M30 50 L62 57 M170 50 L138 57" stroke="#ffcc78" stroke-width="6"/>
  <circle cx="6" cy="48" r="6" fill="#56707f"/><circle cx="194" cy="48" r="6" fill="#56707f"/><circle cx="6" cy="48" r="2.5" fill="#ff8a6b"/><circle cx="194" cy="48" r="2.5" fill="#ff8a6b"/>
  <ellipse cx="93" cy="34" rx="3.6" ry="10" fill="#9A5E2C" transform="rotate(-8 93 34)"/><ellipse cx="107" cy="34" rx="3.6" ry="10" fill="#B8743A" transform="rotate(8 107 34)"/>
  <ellipse cx="100" cy="50" rx="11" ry="12" fill="#C07A3D"/>
  <path d="M87 47 Q87 31 100 30 Q113 31 113 47 Z" fill="#ffcc78"/><rect x="85" y="45" width="30" height="4" rx="2" fill="#F7C062"/>
  <ellipse cx="100" cy="70" rx="27" ry="23" fill="#e8eef0" stroke="#56707f" stroke-width="2"/>
  <path d="M79 60 Q100 16 121 60" fill="rgba(127,211,255,.22)" stroke="#bfe9ff" stroke-width="2"/>
  <rect x="88" y="62" width="24" height="7" rx="2" fill="#1E5153"/>
  <circle cx="80" cy="78" r="11" fill="#465c69"/><circle cx="120" cy="78" r="11" fill="#465c69"/>
  <g id="ship-glow"><circle cx="80" cy="78" r="7.5" fill="#7fd3ff"/><circle cx="120" cy="78" r="7.5" fill="#7fd3ff"/><circle cx="80" cy="78" r="3.5" fill="#fff"/><circle cx="120" cy="78" r="3.5" fill="#fff"/></g>
</svg>`;
function burst2(x,y,n,pow,cash){
  burst(x,y,n,pow);
  for(let i=0;i<(cash||0);i++){ const a=Math.random()*6.283, sp=(.2+Math.random()*.5)*pow*H; parts.push({x,y,px:x,py:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-H*.1,age:0,life:2.4+Math.random(),glyph:'$',c:'#7be0a0',r:H*.03*(.7+Math.random()*.7),tw:0,star:0}); }
}
function drawBill(x,y,ang,al){
  const c=ictx, w=H*.12, h=H*.055; c.save(); c.globalAlpha=al; c.translate(x,y); c.rotate(ang+Math.sin(performance.now()/130)*.14); c.translate(w*.1,-h*.95);
  c.shadowColor='#7be0a0'; c.shadowBlur=18*DPR; c.fillStyle='#2f9e5e'; c.fillRect(-w/2,-h/2,w,h); c.shadowBlur=0;
  c.strokeStyle='#d8f5e1'; c.lineWidth=2*DPR; c.strokeRect(-w/2+h*.12,-h/2+h*.12,w-h*.24,h-h*.24);
  c.fillStyle='#d8f5e1'; c.beginPath(); c.arc(0,0,h*.3,0,6.283); c.fill();
  c.fillStyle='#1d6b3e'; c.font=`700 ${h*.5}px Space Grotesk, sans-serif`; c.textAlign='center'; c.textBaseline='middle'; c.fillText('$',0,h*.03);
  c.fillStyle='#d8f5e1'; c.font=`700 ${h*.26}px Space Mono, monospace`; c.fillText('100',-w*.33,-h*.2); c.fillText('100',w*.33,h*.22);
  c.restore(); c.textAlign='left'; c.textBaseline='alphabetic';
}
function drawIntro(){
  if(!IN.on) return;
  const now=performance.now(), dt=Math.min(.05,(now-IN.last)/1000); IN.last=now; const c=ictx, cl=gsap.utils.clamp;
  c.clearRect(0,0,W,H); c.lineCap='round'; c.setLineDash([]); c.shadowBlur=0;
  const P=camUpdate(dt);
  // graphs streaming past
  if(IN.charts>.01){ fly.forEach(o=>{ o.z-=dt*(2.6+o.sp*.6)*IN.charts; if(o.z<.7){ o.z=13+Math.random()*3; const a=Math.random()*6.283, r=1.8+Math.random()*2.6; o.x=Math.cos(a)*r; o.y=Math.sin(a)*r*.6; }
      const f=H*.9, sx=W/2+o.x*f/o.z, sy=H/2+o.y*f/o.z, sz=f*.42/o.z, al=Math.min(1,(15-o.z)/4)*Math.min(1,(o.z-.7)/1.2)*IN.charts*.8;
      c.globalAlpha=al; c.strokeStyle=c.fillStyle=o.gold?'#ffcc78':'#7fd3ff'; c.lineWidth=Math.max(1,sz*.05);
      if(o.type===0){ for(let i=0;i<5;i++){ const h=sz*[.14,.24,.4,.64,1][i]; c.fillRect(sx+i*sz*.22,sy-h,sz*.15,h); } }
      else { c.beginPath(); for(let i=0;i<=10;i++){ const p=i/10, X=sx+p*sz*1.1, Y=sy-gcurve(p)*sz; i?c.lineTo(X,Y):c.moveTo(X,Y); } c.stroke();
        if(o.type===2){ c.font=`700 ${Math.max(8,sz*.22)}px Space Mono, monospace`; c.fillText(o.txt,sx,sy+sz*.32); } }
    }); c.globalAlpha=1; }
  // the blueprint, seen from the chase camera
  if(IN.house>.01){
    const tech=IN.house*IN.grid, fs=H*.0155; c.strokeStyle='#7fd3ff';
    c.beginPath(); for(let i=-8;i<=8;i++){ seg([i*.5,0,-4],[i*.5,0,4]); seg([-4,0,i*.5],[4,0,i*.5]); }
    c.lineWidth=1*DPR; c.globalAlpha=.15*tech; c.stroke();
    c.beginPath(); RINGS.forEach(r=>{ for(let i=0;i<60;i++) seg(r[i],r[i+1]); });
    for(let d=0;d<360;d+=15){ const a=d/57.296, e=d%45?3.42:3.55; seg([Math.cos(a)*3.3,0,Math.sin(a)*3.3],[Math.cos(a)*e,0,Math.sin(a)*e]); }
    c.globalAlpha=.4*tech; c.stroke();
    c.beginPath(); SEG.forEach((s,i)=>{ const t=cl(0,1,IN.draw*SEG.length-i); if(t>0) seg(s[0],s[1],t); });
    c.globalAlpha=.16*IN.house; c.lineWidth=7*DPR; c.stroke();            // soft glow pass (cheaper than shadowBlur)
    c.globalAlpha=IN.house; c.lineWidth=2*DPR; c.stroke();
    const dn=cl(0,1,IN.draw*2.2-1); c.lineWidth=1.2*DPR; c.globalAlpha=tech*dn;
    NODES.forEach(v=>{ const q=P2(v); if(!q) return; c.beginPath(); c.arc(q[0],q[1],Math.min(9,26/q[2])*DPR,0,6.283); c.fillStyle='#04101c'; c.fill(); c.stroke(); });
    LAB.forEach(l=>{ const q=P2(l.p); if(!q||q[2]>9) return; const tx=q[0]+l.dx*fs, ty=q[1]+l.dy*fs; c.strokeStyle=c.fillStyle=l.g?'#ffcc78':'#7fd3ff';
      c.beginPath(); c.moveTo(q[0],q[1]); c.lineTo(tx,ty); c.lineTo(tx+(l.dx>0?1:-1)*fs*1.2,ty); c.stroke(); c.beginPath(); c.arc(q[0],q[1],2*DPR,0,6.283); c.fill();
      c.textAlign=l.dx>0?'left':'right'; c.font=`${l.g?'700 ':''}${fs}px Space Mono, monospace`; c.fillText(l.t,tx+(l.dx>0?1.6:-1.6)*fs,ty+fs*.35); });
    // HUD
    c.globalAlpha=tech*.9; c.strokeStyle=c.fillStyle='#7fd3ff'; c.lineWidth=1.5*DPR; c.textAlign='left'; c.font=`${fs}px Space Mono, monospace`;
    const m=H*.05, b=H*.045; [[m,m,1,1],[W-m,m,-1,1],[m,H-m,1,-1],[W-m,H-m,-1,-1]].forEach(([x,y,ax,ay])=>{ c.beginPath(); c.moveTo(x+b*ax,y); c.lineTo(x,y); c.lineTo(x,y+b*ay); c.stroke(); });
    ['HDG  '+(IN.hdg||0).toFixed(1).padStart(5,'0')+'°','ALT  '+(P[1]*2.67).toFixed(2)+' m','SCALE 1:100','GRID 0.50 m','SEG  '+Math.min(SEG.length,Math.round(IN.draw*SEG.length))+'/'+SEG.length].forEach((r,i)=>c.fillText(r,W-m-fs*11,m+fs*(2.2+i*1.5)));
    const bx=m+fs, by=H-m-fs*6.4, bw=fs*21, bh=fs*5.6; c.strokeRect(bx,by,bw,bh); c.beginPath(); c.moveTo(bx,by+bh*.36); c.lineTo(bx+bw,by+bh*.36); c.moveTo(bx+bw*.62,by+bh*.36); c.lineTo(bx+bw*.62,by+bh); c.stroke();
    c.font=`700 ${fs*1.15}px Space Mono, monospace`; c.fillText('TRIPVAN · DIGITAL HOUSE',bx+fs*.7,by+fs*1.4);
    c.font=`${fs*.85}px Space Mono, monospace`; c.fillText('DWG TV-001 · SHEET 2/2',bx+fs*.7,by+fs*3.2); c.fillText('DRAWN: SONDRI · CHK: RACO',bx+fs*.7,by+fs*4.6); c.fillText('REV A',bx+bw*.62+fs*.7,by+fs*3.2); c.fillText('2026',bx+bw*.62+fs*.7,by+fs*4.6);
    c.globalAlpha=1;
  }
  // the fighter, seen from behind
  const el=$('#ship'), sp=P2(P);
  if(sp){ const cx=sp[0]/DPR, cy=sp[1]/DPR, sc=1.75/sp[2]*(H/DPR/900);
    const vx=IN.px?(cx-IN.px)/Math.max(dt,.001):0; IN.px=cx; IN.roll=(IN.roll||0)+(cl(-38,38,vx*.09)-(IN.roll||0))*Math.min(1,dt*4);
    el.style.opacity=IN.shipA; el.style.zIndex=3; el.style.transform=`translate(${cx-110}px,${cy-66+Math.sin(now/420)*4}px) scale(${sc}) rotate(${IN.roll}deg)`;
    const g=el.querySelector('#ship-glow'); if(g) g.setAttribute('opacity',.7+.3*Math.sin(now/45)); }
  // ROI chart: the curve launches like a firework, with a dollar bill riding the tip
  if(IN.chart>.01){
    const x0=W*.24,x1=W*.66,y0=H*.8,y1=H*.26;
    c.globalAlpha=IN.chart*.5; c.strokeStyle='#7fd3ff'; c.lineWidth=1*DPR; c.beginPath();
    for(let i=1;i<=5;i++){ const y=y0-(y0-y1)*i/5; c.moveTo(x0,y); c.lineTo(x1,y); } c.stroke();
    c.globalAlpha=IN.chart; c.lineWidth=2.5*DPR; c.beginPath(); c.moveTo(x0,y1-H*.04); c.lineTo(x0,y0); c.lineTo(x1+W*.04,y0); c.stroke();
    c.fillStyle='#7fd3ff'; c.font=`700 ${H*.022}px Space Mono, monospace`; c.fillText('ROI',x0-H*.07,y1-H*.02);
    ['01','02','03'].forEach((t,i)=>c.fillText(t,x0+(x1-x0)*(.18+i*.33),y0+H*.04));
    if(IN.curve>0){
      const N=48, tip=chartPt(IN.curve), prev=chartPt(Math.max(0,IN.curve-.02)), ang=Math.atan2(tip[1]-prev[1],tip[0]-prev[0]);
      c.beginPath(); c.moveTo(x0,y0); for(let i=0;i<=N;i++){ const pt=chartPt(IN.curve*i/N); c.lineTo(pt[0],pt[1]); } c.lineTo(tip[0],y0); c.closePath();
      const g=c.createLinearGradient(0,y1,0,y0); g.addColorStop(0,'rgba(255,204,120,.45)'); g.addColorStop(1,'rgba(255,204,120,0)'); c.fillStyle=g; c.fill();
      c.beginPath(); for(let i=0;i<=N;i++){ const pt=chartPt(IN.curve*i/N); i?c.lineTo(pt[0],pt[1]):c.moveTo(pt[0],pt[1]); }
      const ry=tip[1]-(tip[1]-H*.1)*IN.rocket; if(IN.rocket>0) c.lineTo(tip[0],ry);
      c.strokeStyle='#ffcc78'; c.globalAlpha=IN.chart*.25; c.lineWidth=16*DPR; c.stroke(); c.globalAlpha=IN.chart; c.lineWidth=5*DPR; c.stroke();
      const hx=tip[0], hy=IN.rocket>0?ry:tip[1], ha=IN.rocket>0?-1.571:ang;
      if(IN.bill>.01){                                                    // sparks shoot back from the head, firework-style
        for(let i=0;i<5;i++){ const a=ha+3.1416+(Math.random()-.5)*1.1, s=(.12+Math.random()*.4)*H;
          parts.push({x:hx,y:hy,px:hx,py:hy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,age:0,life:.35+Math.random()*.6,c:['#ffcc78','#fff','#ffe7b3','#ff9f7a'][i%4],r:(1.2+Math.random()*1.8)*DPR,star:0,tw:0}); }
        c.fillStyle='#fff'; c.beginPath(); c.arc(hx,hy,8*DPR,0,6.283); c.fill();
        drawBill(hx,hy,ha,IN.bill*IN.chart);
      }
    }
    c.globalAlpha=1;
  }
  // fireworks → stars (plus short-lived sparks and floating $)
  for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.age+=dt; if(p.life&&p.age>p.life){ parts.splice(i,1); continue; }
    p.px=p.x; p.py=p.y; const dr=Math.pow(.955,dt*60); p.vx*=dr; p.vy*=dr; if(p.age<1.1) p.vy+=H*.12*dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
    if(p.glyph){ c.globalAlpha=1-p.age/p.life; c.fillStyle=p.c; c.font=`700 ${p.r}px Space Grotesk, sans-serif`; c.fillText(p.glyph,p.x,p.y); continue; }
    if(p.life){ c.globalAlpha=1-p.age/p.life; c.strokeStyle=p.c; c.lineWidth=p.r; c.beginPath(); c.moveTo(p.px,p.py); c.lineTo(p.x,p.y); c.stroke(); continue; }
    const s=cl(0,1,(p.age-1.2)/1.6);
    c.globalAlpha=(1-s)+s*(.55+.45*Math.sin(now/300+p.tw)); c.strokeStyle=c.fillStyle=s>.6?'#eaf6ff':p.c;
    if(s<.5){ c.lineWidth=p.r*(1-s); c.beginPath(); c.moveTo(p.px,p.py); c.lineTo(p.x,p.y); c.stroke(); }
    c.beginPath(); c.arc(p.x,p.y,p.r*(1-s)+p.star*s,0,6.283); c.fill(); }
  c.globalAlpha=1;
}
function startIntro(){
  if(IN.on) return; IN.on=true;
  const html=document.documentElement; html.classList.add('intro-on'); Reveal.configure({keyboard:false});
  icv=$('#bi-cv'); ictx=icv.getContext('2d'); DPR=Math.min(devicePixelRatio||1,1.25);
  const rs=()=>{ W=icv.width=Math.round(innerWidth*DPR); H=icv.height=Math.round(innerHeight*DPR); }; rs(); addEventListener('resize',rs);
  $('#ship').innerHTML=SHIP_REAR;
  parts.length=0; fly.length=0;
  for(let i=0;i<14;i++){ const a=Math.random()*6.283, r=1.8+Math.random()*2.6; fly.push({x:Math.cos(a)*r,y:Math.sin(a)*r*.6,z:2+Math.random()*13,sp:Math.random()*3,type:i%3,gold:i%2,txt:['ROI ↑','+38%','×6.4','+120%','×12'][i%5]}); }
  const T0=-1.25;
  Object.assign(IN,{draw:0,house:1,grid:0,charts:0,shipA:0,shipT:T0,cd:4.6,chart:0,curve:0,rocket:0,bill:0,snap:1,px:0,roll:0,last:performance.now()});
  gsap.set('#stage',{opacity:0}); gsap.set($$('.reveal .slides section')[0].querySelectorAll('.a-up'),{opacity:0});
  gsap.set('#intro',{opacity:1}); gsap.set('#bi-grid',{opacity:1}); gsap.set(['#bi-dim','#bi-cap','#bi-title','#bi-sub'],{opacity:0});
  $$('#bi-title .w').forEach(w=>{ if(!w.dataset.split){ w.dataset.split=1; w.innerHTML=[...w.textContent].map(ch=>`<span class="ch">${ch}</span>`).join(''); }});
  gsap.ticker.add(drawIntro);
  const FW=[[.3,.2,90,.4],[.82,.3,90,.42],[.5,.14,110,.46],[.16,.36,70,.36],[.9,.14,70,.36],[.42,.34,80,.38]];
  const tl=gsap.timeline({onComplete:finish});
  tl.fromTo('#bi-cap',{opacity:0,letterSpacing:'.2em'},{opacity:1,letterSpacing:'.6em',duration:1.4,ease:'power2.out'},.2)
    .to(IN,{grid:1,duration:1.2},.4).to(IN,{draw:1,duration:3.8,ease:'power1.inOut'},.6)
    .to(IN,{shipA:1,duration:.8},1).to(IN,{cd:1.75,duration:3.6,ease:'power2.inOut'},1)
    .to(IN,{shipT:T0+Math.PI*2,duration:10.5,ease:'sine.inOut'},1.2)              // one slow lap through the house
    .to(IN,{charts:1,duration:1.5},2.6).to('#bi-cap',{opacity:0,duration:.6},3.2)
    .to(IN,{cd:7,duration:1.6,ease:'power2.in'},10.6).to(IN,{shipA:0,duration:.7},11.5)     // the fighter pulls away
    .to(IN,{house:0,duration:1.2,ease:'power2.in'},11).to(IN,{charts:0,duration:1},11.2)
    .to(IN,{chart:1,duration:.8},11.6).to(IN,{bill:1,duration:.3},12.2)
    .to(IN,{curve:1,duration:2.9,ease:'power1.in'},12.2)
    .to(IN,{rocket:1,duration:.45,ease:'power2.in'},15.1)
    .call(()=>{ const t=chartPt(1); IN.bill=0; burst2(t[0],H*.1,170,.6,16); },[],15.55)
    .to('#bi-grid',{opacity:0,duration:1.4},15.4).to(IN,{chart:0,duration:1},15.7);
  FW.forEach((f,i)=>tl.call(()=>burst2(W*f[0],H*f[1],f[2],f[3],4),[],15.9+i*.26));
  tl.to('#bi-dim',{opacity:.55,duration:1.2},17.6)
    .set('#bi-title',{opacity:1},18)
    .fromTo('#bi-title .ch',{opacity:0,scale:2.6,filter:'blur(14px)'},{opacity:1,scale:1,filter:'blur(0px)',duration:.7,ease:'expo.out',stagger:.045},18)
    .fromTo('#bi-title .plus',{opacity:0,rotate:-180,scale:0},{opacity:1,rotate:0,scale:1,duration:.6,ease:'back.out(3)'},18.35)
    .fromTo('#bi-sub',{opacity:0,letterSpacing:'.1em'},{opacity:1,letterSpacing:'.55em',duration:1.2,ease:'power2.out'},18.7)
    .to('#intro',{opacity:0,duration:1.3,ease:'power2.inOut'},21);
  const skip=()=>{ if(tl.progress()<1) tl.progress(1); }, onKey=e=>{ e.preventDefault(); skip(); };
  addEventListener('keydown',onKey,true); $('#bi-skip').addEventListener('click',skip);
  function finish(){
    removeEventListener('keydown',onKey,true); $('#bi-skip').removeEventListener('click',skip); removeEventListener('resize',rs);
    gsap.ticker.remove(drawIntro); IN.on=false; parts.length=0;
    html.classList.remove('intro-on'); Reveal.configure({keyboard:true});
    gsap.to('#stage',{opacity:1,duration:.6}); SC.n=-1; RC.x=-140; applyR();
    onSlide(Reveal.getCurrentSlide(),Reveal.getIndices().h);
  }
}
