(() => {
const c=document.querySelector('#game'),x=c.getContext('2d'),menu=document.querySelector('#menu'),win=document.querySelector('#win'),G=610;let W=1200,H=720;c.width=W;c.height=H;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),opts={wind:false,wall:false,angle:true,power:true};let pausedPhase=null;let P=[],A=[],blood=[],notes=[],birds=[],birdClock=0,reward=null,wall=null,wind=0,active=0,phase='menu',aim=null,hold=0,last=0,cam={x:600,y:360,z:1,tx:600,ty:360,tz:1};
const player=(id,px,dir,color)=>({id,x:px,dir,color,hp:100,state:'idle',pose:0,drawPower:0,aimAngle:0,stats:{shots:0,hits:0,misses:0,damage:0,head:0,torso:0,arm:0,leg:0}});
function rollWind(){wind=opts.wind?Math.round((Math.random()<.5?-1:1)*(8+Math.random()*26)):0}function focus(snap){let p=P[active];if(!p)return;cam.tx=p.x;cam.ty=G-110;cam.tz=viewZoom(1.45);if(snap){cam.x=cam.tx;cam.y=cam.ty;cam.z=cam.tz}}
function start(){pausedPhase=null;document.querySelector('#resume').hidden=true;let gap=3240+Math.random()*480;P=[player(0,W/2-gap/2,1,'#e8614e'),player(1,W/2+gap/2,-1,'#4a82c7')];A=[];blood=[];notes=[];birds=[];birdClock=8+Math.random()*8;reward=null;active=0;aim=null;phase='aim';wall=opts.wall&&Math.random()<.65?{x:W/2+(Math.random()-.5)*150,h:125+Math.random()*150,w:18+Math.random()*18}:null;rollWind();focus(true);menu.classList.add('hidden');win.classList.add('hidden')}
function point(e){let r=c.getBoundingClientRect(),sx=(e.clientX-r.left)*W/r.width,sy=(e.clientY-r.top)*H/r.height;return{x:(sx-W/2)/cam.z+cam.x,y:(sy-H/2)/cam.z+cam.y}}
function down(e){if(phase!=='aim'||!P[active])return;e.preventDefault();let q=point(e),p=P[active];if(Math.hypot(q.x-p.x,q.y-(G-95))>165)return;aim={start:q,current:q};p.state='aim';p.pose=0;c.setPointerCapture?.(e.pointerId)}function move(e){if(!aim||phase!=='aim')return;e.preventDefault();aim.current=point(e)}function up(e){if(!aim||phase!=='aim')return;let p=P[active],dx=aim.start.x-aim.current.x,dy=aim.start.y-aim.current.y,length=Math.hypot(dx,dy),pull=clamp(length,0,170);aim=null;if(pull<12){p.state='idle';return}let speed=510+pull/170*450;A.push({x:p.x+p.dir*28,y:G-110,vx:dx/length*speed*3,vy:dy/length*speed,angle:Math.atan2(dy,dx),owner:p,stuck:null});p.stats.shots++;p.state='release';p.pose=0;phase='flight';cam.tz=viewZoom(1.55);(c.hasPointerCapture?.(e.pointerId)&&c.releasePointerCapture(e.pointerId))}c.addEventListener('pointerdown',down);c.addEventListener('pointermove',move);window.addEventListener('pointerup',up);c.addEventListener('pointercancel',()=>{aim=null;if(P[active])P[active].state='idle'});
function hit(a,p){let z=[['head',p.x,G-145,21,60],['torso',p.x,G-102,21,34],['arm',p.x-p.dir*34,G-102,13,18],['leg',p.x-p.dir*20,G-45,13,18]];for(let [name,px,py,r,dmg] of z)if(Math.hypot((a.x-p.x)/(name==='head'?1:1.45)+p.x-px,a.y-py)<r)return{name,dmg};return null}
function stick(a,kind,p,h){a.angle=Math.atan2(a.vy,a.vx);a.stuck={kind,p,h};a.vx=a.vy=0;cam.x=cam.tx=a.x;cam.y=cam.ty=a.y;if(!p){a.owner.stats.misses++;return}p.hp=Math.max(0,p.hp-h.dmg);p.state='hit';p.pose=0;a.owner.stats.hits++;a.owner.stats.damage+=h.dmg;a.owner.stats[h.name]++;for(let i=0;i<22;i++)blood.push({x:a.x,y:a.y,vx:(Math.random()-.5)*145,vy:-25-Math.random()*135,life:.4+Math.random()*.4});notes.push({text:`${h.name.toUpperCase()}  -${h.dmg} HP`,x:a.x,y:a.y-32,life:1});if(p.hp<=0)finish(a.owner)}
function finish(p){if(!p)return;phase='over';let s=p.stats,acc=s.shots?Math.round(s.hits/s.shots*100):0;document.querySelector('#winner').textContent=`P${p.id+1} WINS`;document.querySelector('#stats').innerHTML=`<div class="stat"><b>${s.shots}</b><small>Arrows fired</small></div><div class="stat"><b>${s.hits}</b><small>Hits landed</small></div><div class="stat"><b>${s.damage}</b><small>Damage dealt</small></div><div class="stat"><b>${acc}%</b><small>Accuracy</small></div>`;win.classList.remove('hidden')}
function next(){active=1-active;phase='travel';aim=null;P.forEach(p=>p.state='idle');rollWind();focus()}
function update(dt){if(phase!=='menu'&&phase!=='over'){cam.x+=(cam.tx-cam.x)*Math.min(1,dt*4);cam.y+=(cam.ty-cam.y)*Math.min(1,dt*4);cam.z+=(cam.tz-cam.z)*Math.min(1,dt*4)}if(phase==='menu'||phase==='over'||P.length!==2)return;if(phase==='travel'&&Math.abs(cam.x-cam.tx)<2&&Math.abs(cam.y-cam.ty)<2)phase='aim';if(reward&&(reward.life-=dt)<=0)reward=null;P.forEach(p=>{const target=p.state==='aim'&&aim?clamp(Math.hypot(aim.start.x-aim.current.x,aim.start.y-aim.current.y)/170,0,1):0;p.drawPower+=(target-p.drawPower)*Math.min(1,dt*14);if(p.state==='aim'&&aim){const dx=(aim.start.x-aim.current.x)*p.dir,dy=aim.start.y-aim.current.y;p.aimAngle+=(clamp(Math.atan2(dy,Math.max(1,dx*3)),-1.2,1.2)-p.aimAngle)*Math.min(1,dt*16)}p.pose+=dt*(p.state==='aim'?8:4);if((p.state==='release'||p.state==='hit')&&p.pose>(p.state==='release'?1.8:.55))p.state='idle'});if((birdClock-=dt)<=0){birds.push({x:cam.x-W/(2*cam.z)-45,y:Math.min(G-180,cam.y-H/(2*cam.z)+80+Math.random()*90),v:75+Math.random()*45,flap:0,life:70});birdClock=11+Math.random()*11.5}birds=birds.filter(b=>b.life===undefined||(b.life-=dt)>0||Math.abs(b.x-cam.x)<W/(2*cam.z)+50);birds.forEach(b=>{b.x+=b.v*dt;b.flap+=dt*12});for(let a of A){if(a.stuck)continue;a.vx+=wind*dt*21;a.vy+=420*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.angle=Math.atan2(a.vy,a.vx);if(phase==='flight'){cam.x=cam.tx=a.x;cam.y=cam.ty=a.y;cam.z=cam.tz=viewZoom(1.55)}let struck=false;for(let p of P)if(p&&p!==a.owner){let h=hit(a,p);if(h){stick(a,'player',p,h);struck=true;break}}if(struck)continue;for(let i=birds.length-1;i>=0;i--){let b=birds[i];if(Math.hypot(a.x-b.x,a.y-b.y)<18){birds.splice(i,1);const healed=Math.min(15,100-a.owner.hp);a.owner.hp+=healed;reward={text:healed?`BIRD HIT! P${a.owner.id+1} recovered +${healed} HP`:`BIRD HIT! P${a.owner.id+1} is already at full health`,life:3.5};break}}if(struck)continue;if(wall&&a.x>wall.x-wall.w/2&&a.x<wall.x+wall.w/2&&a.y>G-wall.h)stick(a,'wall');else if(a.y>=G){a.y=G;stick(a,'ground')}}blood=blood.filter(q=>(q.life-=dt)>0);blood.forEach(q=>{q.vy+=360*dt;q.x+=q.vx*dt;q.y+=q.vy*dt});notes=notes.filter(q=>(q.life-=dt)>0);if(phase==='flight'&&A.length>0&&A[A.length-1].stuck&&phase!=='over'){phase='impact';hold=.8}if(phase==='impact'&&(hold-=dt)<=0&&phase!=='over'){cam.tz=1.2;next()}}
function arrow(a){x.save();x.translate(a.x,a.y);x.rotate(a.angle);x.strokeStyle='#885332';x.lineWidth=3;x.beginPath();x.moveTo(-20,0);x.lineTo(18,0);x.stroke();x.fillStyle='#364148';x.beginPath();x.moveTo(18,0);x.lineTo(10,-5);x.lineTo(10,5);x.fill();x.restore()}
function person(p){
  const aiming=p.state==='aim',release=p.state==='release',injured=p.state==='hit';
  const tension=p.drawPower, recoil=release?Math.sin(Math.min(1,p.pose/1.8)*Math.PI)*5:0;
  const lean=injured?-p.dir*11: -p.dir*(tension*3+recoil);
  const shoulder={x:p.x+lean,y:G-111},hip={x:p.x,y:G-67};
  const angle=aiming||release?p.aimAngle:0;
  const forward={x:p.dir*Math.cos(angle),y:Math.sin(angle)},normal={x:-p.dir*Math.sin(angle),y:Math.cos(angle)};
  const reach=aiming||release?53:31;
  const hand={x:shoulder.x+forward.x*reach,y:shoulder.y+forward.y*reach+(aiming||release?0:20)};
  const releaseProgress=release?Math.min(1,p.pose/.8):0;
  const pull=aiming?tension*34:release?(1-releaseProgress)*34:0;
  const rear={x:hand.x-forward.x*(19+pull),y:hand.y-forward.y*(19+pull)};
  const elbow={x:shoulder.x-p.dir*(19+pull*.5),y:shoulder.y+18-pull*.55};
  x.save();x.strokeStyle='#24272e';x.lineWidth=7;x.lineCap='round';x.lineJoin='round';
  x.fillStyle=p.color;x.beginPath();x.arc(p.x+lean,G-145,22,0,Math.PI*2);x.fill();x.stroke();
  x.translate(p.x,0);x.scale(1.45,1);x.translate(-p.x,0);
  x.beginPath();x.moveTo(p.x+lean,G-123);x.lineTo(hip.x,hip.y);
  x.moveTo(hip.x,hip.y);x.lineTo(p.x-18,G-32);x.lineTo(p.x-30,G-3.5);x.lineTo(p.x-38,G-3.5);
  x.moveTo(hip.x,hip.y);x.lineTo(p.x+18,G-32);x.lineTo(p.x+30,G-3.5);x.lineTo(p.x+38,G-3.5);
  x.moveTo(shoulder.x,shoulder.y);x.lineTo(shoulder.x+forward.x*27,shoulder.y+forward.y*27+3);x.lineTo(hand.x,hand.y);
  x.moveTo(shoulder.x,shoulder.y);x.lineTo(elbow.x,elbow.y);x.lineTo(rear.x,rear.y);x.stroke();
  const top={x:hand.x+normal.x*34,y:hand.y+normal.y*34},bottom={x:hand.x-normal.x*34,y:hand.y-normal.y*34};
  x.strokeStyle='#975934';x.lineWidth=3;x.beginPath();x.moveTo(top.x,top.y);x.quadraticCurveTo(hand.x+forward.x*24,hand.y+forward.y*24,bottom.x,bottom.y);x.stroke();
  x.strokeStyle='#8c928d';x.lineWidth=1.5;x.beginPath();x.moveTo(top.x,top.y);x.lineTo(rear.x,rear.y);x.lineTo(bottom.x,bottom.y);x.stroke();
  if(aiming){x.strokeStyle='#885332';x.lineWidth=2;x.beginPath();x.moveTo(rear.x,rear.y);x.lineTo(hand.x+forward.x*24,hand.y+forward.y*24);x.stroke()}
  x.restore();
}
function hud(){if(!P.length||phase==='menu')return;x.fillStyle='#24272e';x.font='700 14px "Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';P.forEach((p,i)=>{let px=i?W-(W<650?126:218):20;x.fillText(`P${i+1}  ${p.hp} HP`,px,35);x.fillStyle=p.color;x.fillRect(px,44,(W<650?106:170)*p.hp/100,8);x.fillStyle='#24272e'});x.textAlign='center';x.fillStyle='#69717b';x.font='700 12px "Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';x.fillText(phase==='aim'?`P${active+1}: PULL BACK & RELEASE`:phase==='flight'?'ARROW IN FLIGHT':'IMPACT',W/2,W<650?80:35);if(wind)x.fillText(`${wind<0?'←':'→'} ${Math.abs(wind)}`,W/2,W<650?104:58);if(phase==='aim'){x.globalAlpha=.48;x.fillStyle='#dc6d3b';x.font='800 24px "Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';x.fillText(P[active].dir>0?'→':'←',W/2,W<650?166:124);x.globalAlpha=1}x.textAlign='left'}
function assist(){if(!aim||(!opts.angle&&!opts.power))return;let dx=aim.start.x-aim.current.x,dy=aim.start.y-aim.current.y,d=clamp(Math.hypot(dx,dy),0,170),vals=[];if(opts.angle)vals.push(`ANGLE ${Math.round(Math.atan2(-dy,Math.abs(dx))*180/Math.PI)}°`);if(opts.power)vals.push(`FORCE ${Math.round(d/1.7)}%`);x.fillStyle='#24272e';x.font='700 13px "Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';x.textAlign='center';x.fillText(vals.join('     '),W/2,W<650?134:82);x.textAlign='left'}
function cloud(px,py,size){x.save();x.fillStyle='#e9eef0';for(let [ox,oy,r] of [[-28,4,22],[-5,-6,28],[21,2,23],[43,8,17]]){x.beginPath();x.ellipse(px+ox*size,py+oy*size,r*size,r*.52*size,0,0,Math.PI*2);x.fill()}x.restore()}
function bird(b,ctx=x){
 ctx.save();ctx.translate(b.x,b.y+Math.sin(b.flap*.35)*3);
 ctx.strokeStyle='#69727c';ctx.fillStyle='#69727c';ctx.lineWidth=2;ctx.lineCap='round';
 const flap=Math.sin(b.flap)*10;
 ctx.beginPath();ctx.moveTo(-17,-flap);ctx.quadraticCurveTo(-8,-5,0,2);ctx.quadraticCurveTo(8,-5,17,-flap);ctx.stroke();
 ctx.beginPath();ctx.ellipse(0,2,5,2.5,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(4,1);ctx.lineTo(8,2);ctx.lineTo(4,3);ctx.fill();ctx.restore();
}
function viewZoom(base){return base*Math.min(1,W/700,H/500)}
function resizeView(){
 const r=c.getBoundingClientRect();if(!r.width||!r.height)return;
 const changed=W!==r.width||H!==r.height;W=r.width;H=r.height;
 const dpr=Math.min(window.devicePixelRatio||1,2);
 if(c.width!==Math.round(W*dpr)||c.height!==Math.round(H*dpr)){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);x.setTransform(dpr,0,0,dpr,0,0)}
 if(changed&&phase==='aim')focus();
}
let menuTime=0;
function drawMenuBirds(dt){
 if(phase!=='menu')return;menuTime+=dt;
 const canvas=document.querySelector('#menuSky'),ctx=canvas.getContext('2d'),r=canvas.getBoundingClientRect();
 if(!r.width||!r.height)return;
 const dpr=Math.min(window.devicePixelRatio||1,2);
 if(canvas.width!==Math.round(r.width*dpr)||canvas.height!==Math.round(r.height*dpr)){canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr)}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);
 for(let i=0;i<3;i++){const duration=12+i*2,progress=((menuTime+i*5)%duration)/duration;
 bird({x:-35+progress*(r.width+70),y:50+i*36,flap:menuTime*9+i*2},ctx)}
}
function draw(){resizeView();x.clearRect(0,0,W,H);x.save();x.translate(W/2,H/2);x.scale(cam.z,cam.z);x.translate(-cam.x,-cam.y);x.fillStyle='#f9f9f6';const left=cam.x-W/(2*cam.z)-100,right=cam.x+W/(2*cam.z)+100,top=cam.y-H/(2*cam.z)-100,bottom=cam.y+H/(2*cam.z)+100;x.fillRect(left,top,right-left,bottom-top);for(let i=Math.floor(left/310);i<=Math.ceil(right/310);i++){const n=((i%3)+3)%3;cloud(i*310+70,-150+n*105,.8+n*.18)}x.fillStyle='#ecece7';x.fillRect(left,G,right-left,Math.max(0,bottom-G));x.strokeStyle='#d5d8d3';x.lineWidth=2;x.beginPath();x.moveTo(left,G+.5);x.lineTo(right,G+.5);x.stroke();if(wall){x.fillStyle='#d9ddd7';x.fillRect(wall.x-wall.w/2,G-wall.h,wall.w,wall.h);x.strokeStyle='#bbc0b9';x.strokeRect(wall.x-wall.w/2,G-wall.h,wall.w,wall.h)}P.forEach(person);birds.forEach(b=>bird(b));A.forEach(arrow);blood.forEach(q=>{x.fillStyle='#c73730';x.beginPath();x.arc(q.x,q.y,3,0,Math.PI*2);x.fill()});notes.forEach(q=>{x.globalAlpha=Math.min(1,q.life*2);x.fillStyle='#b62c27';x.font='800 13px "Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';x.textAlign='center';x.fillText(q.text,q.x,q.y-(1-q.life)*24)});if(aim){let p=P[active],dx=aim.start.x-aim.current.x,dy=aim.start.y-aim.current.y,d=Math.hypot(dx,dy)||1;x.setLineDash([7,6]);x.strokeStyle='#dc6d3b';x.lineWidth=3;x.beginPath();x.moveTo(p.x,G-108);x.lineTo(p.x+dx/d*115,G-108+dy/d*115);x.stroke();x.setLineDash([])}x.restore();hud();assist();if(reward){x.save();x.fillStyle='#e6f1e6';x.fillRect(16,H-130,W-32,42);x.fillStyle='#356644';x.textAlign='center';x.font='700 18px "Marker Felt", "Chalkboard SE", cursive';x.fillText(reward.text,W/2,H-103, W-48);x.restore()}requestAnimationFrame(loop)}
const tipMessages = [
  'Pull backward to shoot forward.',
  'A longer pull gives your arrow more power.',
  'Pull downward to aim higher.',
  'Headshots deal the most damage.',
  'Hit a passing bird to recover up to 15 HP.',
  'Wind and walls start off. Enable them in Settings.',
  'Open Menu to pause; Resume returns to your match.'
];
let tipClock=0,tipIndex=0;
const tipElements=[document.querySelector('#menuTip'),document.querySelector('#endTip')];
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
function updateTips(dt){
  if(phase!=='menu'&&phase!=='over')return;
  tipClock+=dt;
  if(tipClock>=7){tipClock%=7;tipIndex=(tipIndex+1)%tipMessages.length}
  const opacity=reducedMotion?.matches?1:Math.min(1,tipClock/.4,(7-tipClock)/.4);
  tipElements.forEach(el=>{el.textContent=tipMessages[tipIndex];el.style.opacity=String(Math.max(0,opacity))});
}
function loop(t){let dt=Math.min(.05,(t-last)/1000||0);last=t;drawMenuBirds(dt);updateTips(dt);while(dt>0){const step=Math.min(dt,1/480);update(step);dt-=step}draw()}
function main(){
  if(phase==='menu')return;
  if(P.length===2&&phase!=='over'){
    pausedPhase=phase;aim=null;
    if(P[active]?.state==='aim')P[active].state='idle';
  }else{
    pausedPhase=null;P=[];A=[];blood=[];notes=[];birds=[];reward=null;wall=null;aim=null;
  }
  phase='menu';
  document.querySelector('#resume').hidden=!pausedPhase;
  win.classList.add('hidden');menu.classList.remove('hidden');
}
function resume(){
  if(!pausedPhase||P.length!==2)return;
  phase=pausedPhase;pausedPhase=null;last=0;
  document.querySelector('#resume').hidden=true;
  menu.classList.add('hidden');
}
document.querySelector('#resume').onclick=resume;
document.querySelector('#newGame').onclick=start;document.querySelector('#again').onclick=start;document.querySelector('#toMenu').onclick=main;document.querySelector('#matchMenu').onclick=main;document.querySelector('#settingsButton').onclick=()=>{let q=document.querySelector('#settings'),h=q.classList.toggle('hidden');document.querySelector('#settingsButton').setAttribute('aria-expanded',String(!h))};[['windToggle','wind'],['wallToggle','wall'],['angleToggle','angle'],['powerToggle','power']].forEach(([id,key])=>{let el=document.querySelector('#'+id);if(el)el.onchange=e=>{opts[key]=e.target.checked;if(key==='wind'&&!opts.wind)wind=0;if(key==='wall'&&!opts.wall)wall=null}});requestAnimationFrame(loop)
})();
