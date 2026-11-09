/* WAKHAN M35: living halos — every halo moves like the real thing (fire burns, storm swirls, water flows, snow falls…)
   + a clean halo picker: one tap selects. Royal Eclipse and Burning Phoenix keep their original art. */
(()=>{"use strict";
if(typeof wm70HaloArt!=="function")return;
const KEEP=new Set(["legacy24_eclipse","legacy24_phoenix"]);
const MAP={fire:"fire",flame:"fire",bloom:"fire",phoenix:"phoenix",dragon:"dragon",lion:"lion",water:"water",lightning:"lightning",thunder:"lightning",storm:"storm",ice:"ice",aurora:"aurora",wave:"wave",petals:"petals",smallbloom:"petals",birds:"birds",falcon:"birds",leaves:"leaves",shield:"leaves",galaxy:"galaxy",orbit:"galaxy",smallorbit:"galaxy",butterfly:"butterfly",sun:"sun",wings:"wings",smallwings:"wings",crown:"crown",wolf:"mist",rain:"rain"};
const DEF={fire:["#ffd27a","#e2342b"],phoenix:["#ffe08a","#e0452c"],dragon:["#ffcf6a","#c9281f"],lion:["#ffe08a","#c98a1b"],water:["#a8f4ff","#2a7bd4"],lightning:["#e9d5ff","#7c3aed"],storm:["#cdeefc","#36566a"],ice:["#f0ffff","#7cc4ec"],aurora:["#b9ffd0","#7a4fd0"],wave:["#dcfbff","#1f6fc8"],petals:["#ffd6ec","#d0559a"],birds:["#ffffff","#7a8fd0"],leaves:["#c6ffd6","#21876a"],galaxy:["#d6e4ff","#5b3fc0"],butterfly:["#f2dcff","#8a5ad6"],sun:["#fff3b0","#f0a01e"],wings:["#ffffff","#a9c7ff"],crown:["#fff0b0","#c99418"],mist:["#e8eef8","#7b8aa6"],rain:["#cfe9ff","#3d6fb0"]};
const hex=c=>{const m=/^#?([0-9a-f]{6})$/i.exec(c||"");return m?[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)):[255,255,255]};
const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
function fxOf(v){const k=v&&(v.effect||v.frame);return MAP[k]||(FX[k]?k:"fire")}
function colorsOf(v,fx){const c=(v&&Array.isArray(v.colors)&&v.colors.length>=2&&/^#/.test(v.colors[0]))?v.colors:DEF[fx];return [hex(c[0]),hex(c[1])]}
/* deterministic random */
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000}}
const TAU=Math.PI*2;
/* ---------------- effects: draw(ctx, S (canvas px), R (avatar radius px), t (s), c1, c2, P (particles)) ---------------- */
const FX={};
function glowRing(x,S,R,c,a,w){const cx=S/2;x.save();x.globalCompositeOperation="lighter";const g=x.createRadialGradient(cx,cx,R*0.92,cx,cx,R+w);g.addColorStop(0,rgba(c,0));g.addColorStop(.35,rgba(c,a));g.addColorStop(1,rgba(c,0));x.fillStyle=g;x.beginPath();x.arc(cx,cx,R+w,0,TAU);x.fill();x.restore()}
function blob(x,px,py,r,inner,outer,a){const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,rgba(inner,a));g.addColorStop(.45,rgba(outer,a*.55));g.addColorStop(1,rgba(outer,0));x.fillStyle=g;x.beginPath();x.arc(px,py,r,0,TAU);x.fill()}
/* FIRE: flames emitted around the ring, rising and flickering */
FX.fire=(x,S,R,t,c1,c2,P)=>{const cx=S/2,n=P.n;glowRing(x,S,R,c2,.55,S*.07);x.save();x.globalCompositeOperation="lighter";
 for(let i=0;i<n;i++){const p=P.a[i],life=(t*p.sp+p.ph)%1,ang=p.ang+Math.sin(t*2+p.ph*9)*.05;const rr=R*(1.0+life*.42*p.k);const px=cx+Math.cos(ang)*rr,py=cx+Math.sin(ang)*rr-life*life*S*.16*p.up;
  const r=S*(.06+.06*p.k)*(1-life*.65);const hot=mix([255,255,235],c1,Math.min(1,life*2));blob(x,px,py,r,hot,mix(c1,c2,life),(1-life)*.75)}
 x.restore()};
/* PHOENIX: fire + two flaming wings that flap */
FX.phoenix=(x,S,R,t,c1,c2,P)=>{FX.fire(x,S,R,t,c1,c2,P);const cx=S/2,f=Math.sin(t*3.2)*.18;x.save();x.globalCompositeOperation="lighter";
 for(const s of[-1,1]){for(let k=0;k<7;k++){const a=-Math.PI/2+s*(.95+k*.16+f*(1+k*.15));const len=R*(.55+k*.07);const bx=cx+Math.cos(a)*R*1.02,by=cx+Math.sin(a)*R*1.02;
  for(let j=1;j<=6;j++){const q=j/6;blob(x,bx+Math.cos(a)*len*q,by+Math.sin(a)*len*q-q*q*S*.03,S*.035*(1-q*.6),mix([255,250,220],c1,q),c2,.42*(1-q*.5))}}}
 x.restore()};
/* DRAGON: a fiery serpent racing around the ring with a glowing trail */
FX.dragon=(x,S,R,t,c1,c2,P)=>{const cx=S/2;glowRing(x,S,R,c2,.45,S*.06);x.save();x.globalCompositeOperation="lighter";
 for(const off of[0,Math.PI]){const head=t*1.6+off;for(let i=0;i<34;i++){const a=head-i*.075,w=Math.sin(a*5+t*3)*S*.018;const rr=R*1.1+w;const px=cx+Math.cos(a)*rr,py=cx+Math.sin(a)*rr;const q=i/34;
  blob(x,px,py,S*(.055-.035*q),mix([255,250,220],c1,q),c2,.8*(1-q))}
  const hx=cx+Math.cos(head)*R*1.1,hy=cx+Math.sin(head)*R*1.1;blob(x,hx,hy,S*.07,[255,255,240],c1,.9)}
 FX.fire(x,S,R,t*0.7,c1,c2,{n:Math.min(18,P.n),a:P.a});x.restore()};
/* LION / SUN: golden rays that breathe and turn */
FX.sun=(x,S,R,t,c1,c2)=>{const cx=S/2;glowRing(x,S,R,c1,.6,S*.08);x.save();x.globalCompositeOperation="lighter";x.translate(cx,cx);x.rotate(t*.25);
 for(let i=0;i<24;i++){const a=i/24*TAU,len=R*(.22+.1*Math.sin(t*2.4+i*1.7));const g=x.createLinearGradient(Math.cos(a)*R,Math.sin(a)*R,Math.cos(a)*(R+len),Math.sin(a)*(R+len));g.addColorStop(0,rgba(mix([255,255,230],c1,.3),.9));g.addColorStop(1,rgba(c2,0));
  x.strokeStyle=g;x.lineWidth=S*(i%2?.018:.03);x.lineCap="round";x.beginPath();x.moveTo(Math.cos(a)*R*1.01,Math.sin(a)*R*1.01);x.lineTo(Math.cos(a)*(R+len),Math.sin(a)*(R+len));x.stroke()}x.restore()};
FX.lion=(x,S,R,t,c1,c2,P)=>{const cx=S/2;FX.sun(x,S,R,t,c1,c2);x.save();x.globalCompositeOperation="lighter";
 for(let i=0;i<48;i++){const a=i/48*TAU+Math.sin(t*1.5+i)*.04,len=R*(.18+.1*Math.sin(t*2+i*2.3));x.strokeStyle=rgba(mix(c1,c2,(i%5)/5),.55);x.lineWidth=S*.012;x.beginPath();
  x.moveTo(cx+Math.cos(a)*R,cx+Math.sin(a)*R);x.quadraticCurveTo(cx+Math.cos(a+.1)*(R+len*.6),cx+Math.sin(a+.1)*(R+len*.6),cx+Math.cos(a+.18)*(R+len),cx+Math.sin(a+.18)*(R+len));x.stroke()}x.restore()};
/* WATER: flowing liquid rings + droplets */
FX.water=(x,S,R,t,c1,c2,P)=>{const cx=S/2;glowRing(x,S,R,c2,.4,S*.06);x.save();x.globalCompositeOperation="lighter";
 for(let k=0;k<4;k++){x.beginPath();for(let i=0;i<=120;i++){const a=i/120*TAU,rr=R*(1.04+k*.045)+Math.sin(a*6+t*(2.2+k*.5)+k)*S*.012;const px=cx+Math.cos(a)*rr,py=cx+Math.sin(a)*rr;i?x.lineTo(px,py):x.moveTo(px,py)}
  x.strokeStyle=rgba(mix(c1,c2,k/4),.55-k*.1);x.lineWidth=S*(.022-k*.004);x.stroke()}
 for(let i=0;i<P.n;i+=2){const p=P.a[i],a=p.ang+t*.6*(p.k>.5?1:-1),rr=R*(1.08+.06*Math.sin(t*2+p.ph*7));blob(x,cx+Math.cos(a)*rr,cx+Math.sin(a)*rr,S*.018,[255,255,255],c1,.7)}x.restore()};
/* RAIN: drops falling through the ring with splashes on it */
FX.rain=(x,S,R,t,c1,c2,P)=>{const cx=S/2;glowRing(x,S,R,c2,.35,S*.05);x.save();x.globalCompositeOperation="lighter";
 for(let i=0;i<P.n;i++){const p=P.a[i],y=((t*p.sp*1.6+p.ph)%1)*S*1.1-S*.05,xx=p.x*S;x.strokeStyle=rgba(c1,.65);x.lineWidth=S*.008;x.beginPath();x.moveTo(xx,y);x.lineTo(xx-S*.01,y+S*.06);x.stroke()}
 for(let i=0;i<10;i++){const p=P.a[i],ph=(t*1.3+p.ph)%1,a=-Math.PI*(.15+.7*p.x),px=cx+Math.cos(a)*R,py=cx+Math.sin(a)*R;x.strokeStyle=rgba(c1,(1-ph)*.7);x.lineWidth=S*.006;x.beginPath();x.ellipse(px,py,S*.04*ph,S*.012*ph,0,0,TAU);x.stroke()}x.restore()};
/* LIGHTNING: crackling electric arcs around the ring */
function bolt(x,ax,ay,bx,by,d,r){if(d<=0){x.lineTo(bx,by);return}const mx=(ax+bx)/2+(r()-.5)*Math.hypot(bx-ax,by-ay)*.35,my=(ay+by)/2+(r()-.5)*Math.hypot(bx-ax,by-ay)*.35;bolt(x,ax,ay,mx,my,d-1,r);bolt(x,mx,my,bx,by,d-1,r)}
FX.lightning=(x,S,R,t,c1,c2)=>{const cx=S/2,step=Math.floor(t*12);glowRing(x,S,R,c2,.5+.3*Math.abs(Math.sin(t*9)),S*.08);x.save();x.globalCompositeOperation="lighter";x.lineJoin="round";
 for(let k=0;k<3;k++){const r=rng(step*7+k*131+1);const a0=r()*TAU,a1=a0+.6+r()*.9;const rr=R*(1.06+r()*.12);x.beginPath();x.moveTo(cx+Math.cos(a0)*rr,cx+Math.sin(a0)*rr);
  for(let i=1;i<=6;i++){const a=a0+(a1-a0)*i/6;x.lineTo(cx+Math.cos(a)*(rr+(r()-.5)*S*.06),cx+Math.sin(a)*(rr+(r()-.5)*S*.06))}
  x.strokeStyle=rgba(c1,.35);x.lineWidth=S*.03;x.stroke();x.strokeStyle=rgba([255,255,255],.95);x.lineWidth=S*.008;x.stroke()}
 if(step%9===0){const r=rng(step+5);const a=r()*TAU;x.beginPath();x.moveTo(cx+Math.cos(a)*R,cx+Math.sin(a)*R);bolt(x,cx+Math.cos(a)*R,cx+Math.sin(a)*R,cx+Math.cos(a)*S*.5,cx+Math.sin(a)*S*.5,4,r);x.strokeStyle=rgba([255,255,255],.9);x.lineWidth=S*.007;x.stroke()}
 x.restore()};
/* STORM: dark clouds swirling around, rain streaks and lightning flashes */
FX.storm=(x,S,R,t,c1,c2,P)=>{const cx=S/2;x.save();
 for(let i=0;i<P.n;i++){const p=P.a[i],a=p.ang+t*(.7+p.k*.5),rr=R*(1.06+p.k*.2);blob(x,cx+Math.cos(a)*rr,cx+Math.sin(a)*rr,S*(.08+.06*p.k),mix(c1,[200,210,225],.5),mix(c2,[120,130,150],.5),.55)}
 x.globalCompositeOperation="lighter";x.strokeStyle=rgba(c1,.45);x.lineWidth=S*.006;
 for(let i=0;i<P.n;i++){const p=P.a[i],a=p.ang*3+t*1.1,rr=R*(1.04+((t*p.sp+p.ph)%1)*.3);const px=cx+Math.cos(a)*rr,py=cx+Math.sin(a)*rr;x.beginPath();x.moveTo(px,py);x.lineTo(px-Math.sin(a)*S*.035,py+Math.cos(a)*S*.035);x.stroke()}
 if(Math.floor(t*10)%23<2)FX.lightning(x,S,R,t,[255,255,255],c1);x.restore()};
/* ICE: frost crystals glinting + snow drifting */
FX.ice=(x,S,R,t,c1,c2,P)=>{const cx=S/2;glowRing(x,S,R,c2,.45,S*.06);x.save();x.globalCompositeOperation="lighter";
 for(let i=0;i<18;i++){const a=i/18*TAU,len=R*(.14+.08*((i*7)%3)/2),tw=.5+.5*Math.sin(t*2.5+i*1.9);x.strokeStyle=rgba(mix([255,255,255],c1,.3),.55+.4*tw);x.lineWidth=S*.01;
  const bx=cx+Math.cos(a)*R,by=cx+Math.sin(a)*R,ex=cx+Math.cos(a)*(R+len),ey=cx+Math.sin(a)*(R+len);x.beginPath();x.moveTo(bx,by);x.lineTo(ex,ey);
  for(const s of[-1,1]){const mx=bx+(ex-bx)*.55,my=by+(ey-by)*.55;x.moveTo(mx,my);x.lineTo(mx+Math.cos(a+s*.7)*len*.35,my+Math.sin(a+s*.7)*len*.35)}x.stroke();if(tw>.92)blob(x,ex,ey,S*.035,[255,255,255],c1,.9)}
 for(let i=0;i<P.n;i++){const p=P.a[i],y=((t*p.sp*.35+p.ph)%1)*S,xx=p.x*S+Math.sin(t+p.ph*9)*S*.02;blob(x,xx,y,S*.012*(.6+p.k),[255,255,255],c1,.8)}x.restore()};
/* AURORA: soft curtains of light flowing around */
FX.aurora=(x,S,R,t,c1,c2)=>{const cx=S/2;x.save();x.globalCompositeOperation="lighter";
 for(let k=0;k<3;k++){for(let i=0;i<90;i++){const a=i/90*TAU,h=R*(.12+.14*(.5+.5*Math.sin(a*3+t*(1+k*.3)+k*2)));const col=mix(c1,c2,(Math.sin(a*2+t+k)+1)/2);
  const g=x.createLinearGradient(cx+Math.cos(a)*R,cx+Math.sin(a)*R,cx+Math.cos(a)*(R+h),cx+Math.sin(a)*(R+h));g.addColorStop(0,rgba(col,.0));g.addColorStop(.3,rgba(col,.22));g.addColorStop(1,rgba(col,0));
  x.strokeStyle=g;x.lineWidth=S*.03;x.beginPath();x.moveTo(cx+Math.cos(a)*R,cx+Math.sin(a)*R);x.lineTo(cx+Math.cos(a)*(R+h),cx+Math.sin(a)*(R+h));x.stroke()}}x.restore()};
/* WAVE: ocean crests rolling around with foam */
FX.wave=(x,S,R,t,c1,c2,P)=>{const cx=S/2;x.save();x.globalCompositeOperation="lighter";
 for(let k=0;k<3;k++){x.beginPath();for(let i=0;i<=140;i++){const a=i/140*TAU,crest=Math.pow(Math.max(0,Math.sin(a*8-t*2.6+k*1.3)),3);const rr=R*1.03+k*S*.02+crest*S*.05;i?x.lineTo(cx+Math.cos(a)*rr,cx+Math.sin(a)*rr):x.moveTo(cx+Math.cos(a)*rr,cx+Math.sin(a)*rr)}
  x.strokeStyle=rgba(mix(c2,c1,k/2),.6);x.lineWidth=S*.02;x.stroke()}
 for(let i=0;i<P.n;i++){const p=P.a[i],a=p.ang-t*.33,life=(t*p.sp+p.ph)%1,rr=R*1.12+life*S*.05;blob(x,cx+Math.cos(a)*rr,cx+Math.sin(a)*rr,S*.014,[255,255,255],c1,(1-life)*.8)}x.restore()};
/* PETALS: blossoms drifting down and spinning */
function petal(x,px,py,r,rot,c,a){x.save();x.translate(px,py);x.rotate(rot);x.fillStyle=rgba(c,a);x.beginPath();x.ellipse(0,0,r,r*.55,0,0,TAU);x.fill();x.fillStyle=rgba([255,255,255],a*.35);x.beginPath();x.ellipse(-r*.2,-r*.12,r*.45,r*.2,0,0,TAU);x.fill();x.restore()}
FX.petals=(x,S,R,t,c1,c2,P)=>{const cx=S/2;glowRing(x,S,R,c2,.35,S*.05);for(let i=0;i<12;i++){const a=i/12*TAU+t*.15;petal(x,cx+Math.cos(a)*R*1.05,cx+Math.sin(a)*R*1.05,S*.04,a+t,mix(c1,c2,.3),.85)}
 for(let i=0;i<P.n;i++){const p=P.a[i],life=(t*p.sp*.4+p.ph)%1,px=p.x*S+Math.sin(t*1.5+p.ph*9)*S*.05,py=life*S*1.1-S*.05;petal(x,px,py,S*.028*(.7+p.k*.6),t*2*p.k+p.ph*9,mix(c1,c2,p.k),.9)}};
/* LEAVES: a vine of leaves swaying in the wind */
function leaf(x,px,py,r,rot,c,a){x.save();x.translate(px,py);x.rotate(rot);x.fillStyle=rgba(c,a);x.beginPath();x.moveTo(0,-r);x.quadraticCurveTo(r*.75,0,0,r);x.quadraticCurveTo(-r*.75,0,0,-r);x.fill();x.strokeStyle=rgba([255,255,255],a*.35);x.lineWidth=r*.12;x.beginPath();x.moveTo(0,-r*.8);x.lineTo(0,r*.8);x.stroke();x.restore()}
FX.leaves=(x,S,R,t,c1,c2,P)=>{const cx=S/2;x.strokeStyle=rgba(c2,.8);x.lineWidth=S*.012;x.beginPath();x.arc(cx,cx,R*1.04,0,TAU);x.stroke();
 for(let i=0;i<22;i++){const a=i/22*TAU,sw=Math.sin(t*2+i*.8)*.35,out=i%2?1:-1;leaf(x,cx+Math.cos(a)*R*(1.04+out*.03),cx+Math.sin(a)*R*(1.04+out*.03),S*.045,a+Math.PI/2+out*.8+sw,mix(c1,c2,(i%3)/3),.9)}
 for(let i=0;i<4;i++){const p=P.a[i],life=(t*p.sp*.3+p.ph)%1;leaf(x,p.x*S+Math.sin(t+p.ph*7)*S*.06,life*S,S*.03,t*2+p.ph*9,c1,.8*(1-life))}};
/* BIRDS: birds gliding around the ring, wings beating */
function bird(x,px,py,s,ang,flap,c){x.save();x.translate(px,py);x.rotate(ang);x.strokeStyle=rgba(c,.95);x.lineWidth=s*.18;x.lineCap="round";const w=Math.sin(flap)*s*.55;x.beginPath();x.moveTo(-s,-w);x.quadraticCurveTo(-s*.4,-s*.1,0,0);x.quadraticCurveTo(s*.4,-s*.1,s,-w);x.stroke();x.restore()}
FX.birds=(x,S,R,t,c1,c2)=>{const cx=S/2;glowRing(x,S,R,c2,.35,S*.05);for(let i=0;i<4;i++){const a=t*.7+i*TAU/4,rr=R*(1.16+.05*Math.sin(t*1.3+i));bird(x,cx+Math.cos(a)*rr,cx+Math.sin(a)*rr,S*.075,a+Math.PI/2,t*9+i,i%2?c1:[255,255,255])}};
/* BUTTERFLY: fluttering butterflies */
function fly(x,px,py,s,ang,flap,c1,c2){x.save();x.translate(px,py);x.rotate(ang);const f=.25+.75*Math.abs(Math.sin(flap));for(const sd of[-1,1]){x.save();x.scale(sd*f,1);x.fillStyle=rgba(c1,.9);x.beginPath();x.ellipse(s*.45,-s*.25,s*.5,s*.35,-.4,0,TAU);x.fill();x.fillStyle=rgba(c2,.9);x.beginPath();x.ellipse(s*.35,s*.28,s*.32,s*.24,.4,0,TAU);x.fill();x.restore()}x.fillStyle="rgba(30,20,40,.9)";x.fillRect(-s*.05,-s*.45,s*.1,s*.9);x.restore()}
FX.butterfly=(x,S,R,t,c1,c2)=>{const cx=S/2;glowRing(x,S,R,c2,.3,S*.05);for(let i=0;i<3;i++){const a=t*.5+i*TAU/3+Math.sin(t*1.7+i)*.3,rr=R*(1.15+.06*Math.sin(t*2.3+i*2));fly(x,cx+Math.cos(a)*rr,cx+Math.sin(a)*rr,S*.08,a+Math.PI/2+Math.sin(t*3+i)*.4,t*14+i,c1,c2)}};
/* GALAXY: a turning spiral nebula with orbiting stars */
FX.galaxy=(x,S,R,t,c1,c2,P)=>{const cx=S/2;x.save();x.globalCompositeOperation="lighter";
 for(let i=0;i<70;i++){const a=i/70*TAU*2+t*.35,rr=R*(1.02+(i%35)/35*.22);blob(x,cx+Math.cos(a)*rr,cx+Math.sin(a)*rr,S*.04,mix(c1,c2,(i%35)/35),c2,.18)}
 for(let i=0;i<P.n;i++){const p=P.a[i],a=p.ang+t*(.3+p.k*.6),rr=R*(1.04+p.k*.24),tw=.5+.5*Math.sin(t*4+p.ph*20);blob(x,cx+Math.cos(a)*rr,cx+Math.sin(a)*rr,S*(.008+.014*tw),[255,255,255],c1,.95)}x.restore()};
/* WINGS: soft angel wings of light, slowly beating */
FX.wings=(x,S,R,t,c1,c2)=>{const cx=S/2,f=Math.sin(t*1.8)*.12;glowRing(x,S,R,c1,.5,S*.06);x.save();x.globalCompositeOperation="lighter";
 for(const s of[-1,1])for(let k=0;k<9;k++){const d=.3-k*.13-f,a=s<0?Math.PI+d:-d,len=R*(.34+k*.04);x.strokeStyle=rgba(mix([255,255,255],c2,k/12),.55);x.lineWidth=S*.026;x.lineCap="round";
  const bx=cx+Math.cos(a)*R*1.0,by=cx+Math.sin(a)*R*1.0;x.beginPath();x.moveTo(bx,by);x.quadraticCurveTo(bx+Math.cos(a)*len*.6,by+Math.sin(a)*len*.6-len*.3,bx+Math.cos(a)*len,by+Math.sin(a)*len-len*.12);x.stroke()}
 x.restore()};
/* CROWN: a golden crown above with a travelling gleam */
FX.crown=(x,S,R,t,c1,c2)=>{const cx=S/2;FX.sun(x,S,R,t*.5,c1,c2);const w=R*.9,h=R*.42,y0=cx-R*1.02;x.save();const g=x.createLinearGradient(cx-w/2,0,cx+w/2,0);const p=(t*.5%1);g.addColorStop(0,rgba(c2,1));g.addColorStop(Math.max(0,p-.08),rgba(c1,1));g.addColorStop(p,rgba([255,255,255],1));g.addColorStop(Math.min(1,p+.08),rgba(c1,1));g.addColorStop(1,rgba(c2,1));
 x.fillStyle=g;x.beginPath();x.moveTo(cx-w/2,y0);x.lineTo(cx-w/2,y0-h*.55);x.lineTo(cx-w/4,y0-h*.25);x.lineTo(cx,y0-h);x.lineTo(cx+w/4,y0-h*.25);x.lineTo(cx+w/2,y0-h*.55);x.lineTo(cx+w/2,y0);x.closePath();x.fill();
 for(const k of[-.5,0,.5])blob(x,cx+k*w,y0-(k?h*.55:h),S*.022,[255,255,255],[255,80,120],1);x.restore()};
/* MIST: silver fog drifting around (silver wolf) */
FX.mist=(x,S,R,t,c1,c2,P)=>{const cx=S/2;for(let i=0;i<P.n;i++){const p=P.a[i],a=p.ang+t*.25*(p.k>.5?1:-1),rr=R*(1.08+.12*Math.sin(t*.8+p.ph*6));blob(x,cx+Math.cos(a)*rr,cx+Math.sin(a)*rr,S*(.08+.05*p.k),c1,c2,.28)}glowRing(x,S,R,c1,.4,S*.05)};

/* 3D metal frame: bevelled ring + moving specular + gems (makes every halo a real frame around the photo) */
const METAL={fire:[[255,214,120],[150,50,10]],phoenix:[[255,220,130],[150,60,10]],dragon:[[255,210,110],[140,40,10]],lion:[[255,226,140],[150,95,20]],sun:[[255,236,160],[170,110,20]],crown:[[255,232,150],[160,105,15]],
 water:[[210,240,255],[40,90,160]],rain:[[220,235,250],[60,90,140]],wave:[[215,245,255],[30,90,170]],ice:[[240,252,255],[110,160,205]],storm:[[215,225,240],[70,85,110]],mist:[[235,240,248],[110,120,140]],
 lightning:[[235,215,255],[90,50,170]],aurora:[[220,255,235],[80,60,160]],galaxy:[[220,215,255],[60,45,150]],petals:[[255,225,240],[170,70,120]],butterfly:[[245,225,255],[120,70,180]],leaves:[[225,255,225],[40,120,80]],birds:[[245,245,255],[110,120,170]],wings:[[255,255,255],[150,170,210]]};
function frame3d(x,S,R,t,fx,c1){const cx=S/2,m=METAL[fx]||[[255,220,140],[140,90,20]],w=R*.2,r0=R*1.0;
 x.save();
 /* drop shadow */
 x.beginPath();x.arc(cx,cx+R*.04,r0+w*.55,0,TAU);x.arc(cx,cx+R*.04,r0-w*.1,0,TAU,true);x.fillStyle="rgba(0,0,0,.45)";x.filter="blur("+(R*.05)+"px)";x.fill("evenodd");x.filter="none";
 /* bevel: concentric strokes, bright in the middle, dark at the edges, lit from the top-left */
 const N=10;for(let i=0;i<N;i++){const q=i/(N-1),prof=Math.sin(q*Math.PI);const rr=r0+(q-.15)*w;
  const g=x.createLinearGradient(cx-rr,cx-rr,cx+rr,cx+rr);const hi=mix(m[1],m[0],.35+.65*prof),lo=mix(m[1],[0,0,0],.35*(1-prof));
  g.addColorStop(0,rgba(mix(hi,[255,255,255],.35*prof),1));g.addColorStop(.5,rgba(hi,1));g.addColorStop(1,rgba(lo,1));x.strokeStyle=g;x.lineWidth=w/N*1.6;x.beginPath();x.arc(cx,cx,rr,0,TAU);x.stroke()}
 /* thin inner and outer lines */
 x.lineWidth=R*.018;x.strokeStyle=rgba(mix(m[0],[255,255,255],.5),.9);x.beginPath();x.arc(cx,cx,r0-w*.15,0,TAU);x.stroke();x.strokeStyle=rgba(m[1],.9);x.beginPath();x.arc(cx,cx,r0+w*.85,0,TAU);x.stroke();
 /* travelling specular glint */
 x.globalCompositeOperation="lighter";const a=(t*.9)%TAU;for(let k=0;k<14;k++){const aa=a-k*.035;x.strokeStyle=rgba([255,255,255],.55*(1-k/14));x.lineWidth=w*.45;x.lineCap="round";x.beginPath();x.arc(cx,cx,r0+w*.35,aa-.03,aa+.03);x.stroke()}
 /* gems at 4 points, twinkling */
 for(let k=0;k<4;k++){const aa=-Math.PI/2+k*Math.PI/2,gx=cx+Math.cos(aa)*(r0+w*.35),gy=cx+Math.sin(aa)*(r0+w*.35),gr=w*(k?.42:.6);x.globalCompositeOperation="source-over";
  const gg=x.createRadialGradient(gx-gr*.3,gy-gr*.3,gr*.1,gx,gy,gr);gg.addColorStop(0,"#fff");gg.addColorStop(.35,rgba(mix(c1,[255,255,255],.2),1));gg.addColorStop(1,rgba(mix(c1,[0,0,0],.5),1));x.fillStyle=gg;x.beginPath();x.arc(gx,gy,gr,0,TAU);x.fill();
  x.lineWidth=R*.02;x.strokeStyle=rgba(m[0],1);x.stroke();const tw=Math.max(0,Math.sin(t*3+k*1.7));if(tw>.6){x.globalCompositeOperation="lighter";blob(x,gx-gr*.3,gy-gr*.3,gr*1.6*tw,[255,255,255],c1,.7*tw)}}
 x.restore()}
/* ---------------- engine ---------------- */
const nodes=new Set(),vis=new Set();let raf=0,t0=performance.now();
const io=("IntersectionObserver" in window)?new IntersectionObserver(es=>{for(const e of es)e.isIntersecting?vis.add(e.target):vis.delete(e.target)}):null;
function setup(c){if(c.__h)return;c.__h=1;const fx=c.dataset.fx,v={effect:fx,colors:[c.dataset.c1,c.dataset.c2]};const r=rng(parseInt(c.dataset.seed||"7",10));const n={fire:40,phoenix:34,dragon:18,storm:16,rain:26,ice:16,water:20,wave:18,petals:12,galaxy:30,mist:14,leaves:4}[fx]||20;
 c.__p={n,a:Array.from({length:n},(_,i)=>({ang:i/n*TAU+r()*.3,ph:r(),sp:.55+r()*.7,k:r(),x:r(),up:.6+r()*.8}))};c.__c=[hex(c.dataset.c1),hex(c.dataset.c2)];nodes.add(c);io?io.observe(c):vis.add(c)}
function frame(now){raf=0;const t=(now-t0)/1000;const dpr=Math.min(2,window.devicePixelRatio||1);let any=false;
 for(const c of nodes){if(!c.isConnected){nodes.delete(c);vis.delete(c);io&&io.unobserve(c);continue}if(!vis.has(c))continue;any=true;
  const w=c.clientWidth;if(!w)continue;const px=Math.round(w*dpr);if(c.width!==px){c.width=c.height=px}
  const small=w<44;if(small&&c.__drawn&&((now|0)%3))continue; /* tiny halos (chat) animate at a lower rate */
  const x=c.getContext("2d");x.clearRect(0,0,px,px);const R=px*.40/1.5;
  try{const fx=c.dataset.fx;(FX[fx]||FX.fire)(x,px,R*1.16,t,c.__c[0],c.__c[1],c.__p);frame3d(x,px,R,t,fx,c.__c[0]);if(fx==='crown'||fx==='phoenix'||fx==='wings'||fx==='butterfly'||fx==='birds'){x.save();x.globalCompositeOperation='source-over';(FX[fx])(x,px,R*1.16,t,c.__c[0],c.__c[1],c.__p);x.restore()}}catch(e){}
  /* keep the photo clean: cut the centre */
  x.save();x.globalCompositeOperation="destination-out";x.beginPath();x.arc(px/2,px/2,R*.985,0,TAU);x.fill();x.restore();c.__drawn=1}
 if(any||nodes.size)raf=requestAnimationFrame(frame)}
function kick(){if(!raf)raf=requestAnimationFrame(frame)}
const scan=()=>{for(const c of document.querySelectorAll("canvas.wk-halo:not([data-ready])")){c.dataset.ready=1;setup(c)}kick()};
new MutationObserver(()=>scan()).observe(document.documentElement,{childList:true,subtree:true});
/* ---------------- hook the avatar halo ---------------- */
/* painted + animated Wakhan halos (from artwork) */
const IMG={creator_dragon:"c1",creator_lion:"c2",creator_thunder:"c3",creator_flame:"c4",creator_storm:"c5",creator_ice:"c6",creator_river:"c7",creator_aurora:"c8",
 assistant_flare:"a1",assistant_cascade:"a2",assistant_frost:"a3",assistant_phoenix:"a4",assistant_swallow:"a5",assistant_butterfly:"a6",assistant_rose:"a7",assistant_breeze:"a8",
 owner_hearth:"o1",owner_branch:"o2",owner_falcon:"o3",owner_stream:"o4",owner_phoenix:"o5",owner_orchard:"o6",owner_aurora:"o7",owner_frost:"o8",
 subscriber_lagoon:"s1",subscriber_ember:"s2",subscriber_phoenix:"s3",subscriber_stardust:"s4",subscriber_blossom:"s5",subscriber_butterfly:"s6",subscriber_dove:"s7",subscriber_silk:"s8"};
const HID=new Set(["creator_phoenix","creator_ocean","assistant_emerald","assistant_cosmos","owner_constellation","owner_butterfly","subscriber_frost","subscriber_garden"]);
const NAMES={c1:["امپراتور اژدها","Dragon Emperor"],c2:["شیرشاه","Lion King"],c3:["خدای رعد","Thunder God"],c4:["تاج آتش","Inferno Crown"],c5:["عقاب سیاه","Black Eagle"],c6:["گرگ آلفا","Alpha Wolf"],c7:["سامورایی سایه","Shadow Samurai"],c8:["شش‌بال فرمانروا","Sovereign Wings"],
 a1:["گریفین فولادی","Steel Griffin"],a2:["شوالیهٔ طوفان","Storm Knight"],a3:["گرگ یخی","Ice Wolf"],a4:["شاهین صاعقه","Lightning Falcon"],a5:["قوی بلوری","Crystal Swan"],a6:["پروانهٔ ماه","Moon Butterfly"],a7:["نیلوفر یخی","Frost Lotus"],a8:["پری نور ستاره","Starlight Fairy"],o1:["شیر صحرا","Desert Lion"],o2:["گوزن جنگل","Forest Stag"],o3:["شاهین طلایی","Golden Falcon"],o4:["سه‌شاخهٔ اقیانوس","Ocean Trident"],o5:["ملکهٔ طاووس","Peacock Queen"],o6:["باغ رز","Rose Garden"],o7:["نیلوفر طلایی","Golden Lotus"],o8:["پری مرجان","Coral Mermaid"],s1:["دنباله‌دار آبی","Blue Comet"],s2:["شعلهٔ آبی","Blue Flame"],s3:["ببر نئونی","Neon Tiger"],s4:["گرگ کهکشانی","Galaxy Wolf"],s5:["ساکورا","Sakura"],s6:["پروانهٔ صورتی","Pink Butterfly"],s7:["قوی مرواریدی","Pearl Swan"],s8:["رؤیای تک‌شاخ","Unicorn Dream"]};
window.WK_HALO={IMG,HID,NAMES};
const original=wm70HaloArt;let seed=1;
wm70HaloArt=function(v){if(v&&IMG[v.id])return `<img class="wk-halo-img" data-k="${IMG[v.id]}" src="/s/halo-${IMG[v.id]}.webp?v=45" alt="" decoding="async" draggable="false">`;if(!v||!v.id||KEEP.has(v.id))return original.apply(this,arguments);const fx=fxOf(v),[a,b]=colorsOf(v,fx);
 const h=s=>"#"+s.map(n=>n.toString(16).padStart(2,"0")).join("");
 return `<canvas class="wk-halo" data-fx="${fx}" data-c1="${h(a)}" data-c2="${h(b)}" data-seed="${(seed++%97)+3}" aria-hidden="true"></canvas>`};
window.wm70HaloArt=wm70HaloArt;
/* ---------------- halo picker: only halos, one tap selects ---------------- */
const TX={fa:{title:"هاله‌ها",none:"بدون هاله",sel:"انتخاب شد",lock:"این هاله برای نقش دیگری است"},ps:{title:"هالې",none:"بې هالې",sel:"وټاکل شو",lock:"دا هاله د بل رول لپاره ده"},en:{title:"Halos",none:"No halo",sel:"Selected",lock:"This halo belongs to another role"}};
const T=()=>{const l=document.documentElement.lang||"fa";return l.startsWith("ps")?TX.ps:(l==="fa"||l==="fa-IR")?TX.fa:TX.en};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nm=v=>{try{const k=IMG[v.id];if(k&&NAMES[k]){const l=document.documentElement.lang||"fa";return (l.startsWith("fa")||l.startsWith("ps"))?NAMES[k][0]:NAMES[k][1]}return typeof wm70Name==="function"?wm70Name(v):(v.name&&(v.name.fa||v.name.en))||v.id}catch(e){return v.id}};
async function catalog(){if(WM70.halosAll&&WM70.halosAll.length)return WM70.halosAll.filter(v=>!HID.has(v.id));try{const r=await wm70Request("halos");if(r&&Array.isArray(r.halos))WM70.halosAll=r.halos}catch(e){}return (WM70.halosAll||WM70.halos||[]).filter(v=>!HID.has(v.id))}
const vr=(v,own)=>(own&&own.id===v.id&&own.variant)||(Array.isArray(v.variants)&&v.variants.length?(v.variants.includes(own&&own.variant)?own.variant:v.variants[0]):(v.variant||''));
const GROUPS=[["creator","سازنده","Creator"],["assistant","دستیارها","Assistants"],["owner","مالکین گروپ","Group owners"],["subscriber","مشترکین","Subscribers"],["other","کلاسیک","Classic"]];
function grid(list){const own=WM70.self&&WM70.self.halo,t=T(),me=WM70.self||{id:ME?.me?.id,name:ME?.me?.name,avatar:"/ava/"+ME?.me?.id};
 const ok=list.filter(v=>v.allowed!==false);const seen=new Set();const items=ok.filter(v=>!seen.has(v.id)&&seen.add(v.id));
 return `<section class="wh35" dir="ltr"><div class="wh-top"><h3>${esc(t.title)}</h3><button class="wh-x" onclick="WM70.modal=null;closeSheet()">✕</button></div>
 <div class="wh-grid"><button class="wh-it ${own?"":"on"}" onclick="wh35Pick('none','')"><span class="wh-av">${wm70Avatar({...me,halo:null})}</span><b>${esc(t.none)}</b></button>
 </div>${GROUPS.map(([r,fa,en])=>{const g=items.filter(v=>(v.role||"")===r||(r==="other"&&!GROUPS.some(x=>x[0]===v.role)));if(!g.length)return "";const l=document.documentElement.lang||"fa";return `<h4 class="wh-h">${esc(l.startsWith("fa")||l.startsWith("ps")?fa:en)}</h4><div class="wh-grid">${g.map(v=>{const on=own&&own.id===v.id;return `<button class="wh-it ${on?"on":""}" onclick="wh35Pick('${esc(v.id)}','${esc(vr(v,own))}')"><span class="wh-av">${wm70Avatar({...me,halo:{...v,variant:vr(v,own)}})}</span><b>${esc(nm(v))}</b></button>`}).join("")}</div>`}).join("")}</section>`}
window.wh35Open=async function(){WM70.modal="halos35";sheet(`<section class="wh35"><p style="text-align:center;opacity:.6">…</p></section>`);if(!WM70.self&&typeof wm70Load==="function")await wm70Load().catch(()=>{});const list=await catalog();if(WM70.modal!=="halos35")return;sheet(grid(list))};
window.wh35Pick=async function(id,variant){try{Telegram.WebApp.HapticFeedback.impactOccurred("light")}catch(e){}
 document.querySelectorAll(".wh35 .wh-it").forEach(b=>b.classList.remove("on"));const btn=[...document.querySelectorAll(".wh35 .wh-it")].find(b=>(b.getAttribute("onclick")||"").includes(`'${id}'`));btn&&btn.classList.add("on");
 try{const r=await wm70Request("self",{action:"halo",halo:id,variant:id==="none"?"":variant});if(r&&r.profile&&typeof wm70ApplySelf==="function")wm70ApplySelf(r.profile);try{toast(T().sel)}catch(e){}}
 catch(e){try{toast(typeof wm70Error==="function"?wm70Error(e):T().lock)}catch(_){}}if(WM70.modal==="halos35")sheet(grid(await catalog()));if(document.querySelector(".wt-me")&&typeof rMe==="function")rMe()};
/* route every “halos” entry to the clean picker */
const oldEdit=window.wm70Edit;if(typeof oldEdit==="function"){wm70Edit=function(tab){if(tab==="halos")return wh35Open();return oldEdit.apply(this,arguments)};window.wm70Edit=wm70Edit}
const st=document.createElement("style");st.textContent=`
:has(>.wm70-avatar-halo img.wk-halo-img){container-type:size;--wkf:.6}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=a1]){--wkf:0.6761}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=a2]){--wkf:0.6448}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=a3]){--wkf:0.5979}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=a4]){--wkf:0.6448}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=a5]){--wkf:0.6448}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=a6]){--wkf:0.5433}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=a7]){--wkf:0.6683}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=a8]){--wkf:0.6995}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=c1]){--wkf:0.5979}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=c2]){--wkf:0.5667}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=c3]){--wkf:0.6058}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=c4]){--wkf:0.6058}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=c5]){--wkf:0.6058}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=c6]){--wkf:0.5979}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=c7]){--wkf:0.5511}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=c8]){--wkf:0.532}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=o1]){--wkf:0.5823}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=o2]){--wkf:0.512}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=o3]){--wkf:0.6292}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=o4]){--wkf:0.6093}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=o5]){--wkf:0.5979}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=o6]){--wkf:0.6058}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=o7]){--wkf:0.6448}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=s1]){--wkf:0.6917}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=s2]){--wkf:0.5823}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=s3]){--wkf:0.637}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=s4]){--wkf:0.637}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=s5]){--wkf:0.6995}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=s6]){--wkf:0.7108}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=s7]){--wkf:0.5901}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=s8]){--wkf:0.6058}
:has(>.wm70-avatar-halo img.wk-halo-img[data-k=o8]){--wkf:0.6058}
.wm70-avatar-halo:has(img.wk-halo-img){position:absolute!important;inset:0!important;left:0!important;top:0!important;width:100%!important;height:100%!important;overflow:visible!important;background:none!important;display:block!important;transform:none!important;clip-path:none!important;mask:none!important;-webkit-mask:none!important}
.wm70-avatar-halo img.wk-halo-img{position:absolute!important;inset:auto!important;left:50%!important;top:50%!important;width:min(100cqw,100cqh)!important;height:min(100cqw,100cqh)!important;transform:translate(-50%,-50%)!important;max-width:none!important;margin:0!important;pointer-events:none;z-index:2;object-fit:contain!important;border-radius:0!important;border:0!important;background:none!important;filter:none!important}
:has(>.wm70-avatar-halo img.wk-halo-img)>img,:has(>.wm70-avatar-halo img.wk-halo-img)>.wm70-avatar-fallback{position:absolute!important;inset:auto!important;left:50%!important;top:50%!important;right:auto!important;bottom:auto!important;width:calc(min(100cqw,100cqh)*var(--wkf))!important;height:calc(min(100cqw,100cqh)*var(--wkf))!important;transform:translate(-50%,-50%)!important;border-radius:50%!important;object-fit:cover!important;margin:0!important;max-width:none!important}
.wm70-avatar-halo canvas.wk-halo{position:absolute;left:-25%;top:-25%;width:150%;height:150%;pointer-events:none;z-index:2}
.wm70-avatar-halo:has(canvas.wk-halo){overflow:visible!important;background:none!important}
.wh35 .wh-top{position:relative;display:flex;justify-content:center;align-items:center;margin:0 0 14px}.wh35 h3{margin:0;font-size:17px}
.wh35 .wh-x{position:absolute;left:0;top:-4px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:var(--txt);font-size:15px}
.wh-h{margin:14px 2px 8px;font-size:13px;color:var(--mut);font-weight:800}.wh-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.wh-it{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 4px 10px;border-radius:18px;border:1.5px solid var(--ln);background:var(--card);color:var(--txt);font:600 11.5px system-ui,-apple-system,sans-serif;transition:transform .12s}
.wh-it:active{transform:scale(.95)}.wh-it.on{border-color:var(--a1,#8b5cf6);background:color-mix(in srgb,var(--a1,#8b5cf6) 16%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--a1,#8b5cf6) 22%,transparent)}
.wh-av{width:76px;height:76px;display:flex;align-items:center;justify-content:center}.wh-av>.wm70-avatar{width:64px!important;height:64px!important}
.wh-it b{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
`;document.head.appendChild(st);
scan();
})();
