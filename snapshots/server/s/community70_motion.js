/* One shared GPU context animates the approved, original rendered artwork.
   The photo is a separate DOM layer: no effect ever modifies the user's image. */
const WM70_VERTEX=`
attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=vec2((a_position.x+1.0)*.5,(1.0-a_position.y)*.5);gl_Position=vec4(a_position,0.0,1.0);}
`;
const WM70_FRAGMENT=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_atlas;
uniform vec4 u_cell;
uniform float u_time;
uniform float u_kind;
uniform float u_hole;
uniform vec3 u_color;
varying vec2 v_uv;
const float PI=3.14159265;
float hash(float n){return fract(sin(n*127.1+311.7)*43758.5453);}
mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float segment(vec2 p,vec2 a,vec2 b){vec2 v=b-a;return length(p-a-v*clamp(dot(p-a,v)/dot(v,v),0.0,1.0));}
float bolt(vec2 p,float seed){
 vec2 last=vec2(.42+hash(seed)*.17,-.03);float dist=1.0;
 for(int j=1;j<8;j++){
  float n=float(j);vec2 next=vec2(.5+(hash(seed+n*7.1)-.5)*.24,n*.15-.03);
  dist=min(dist,segment(p,last,next));
  if(j==3||j==5){float sign=hash(seed+n)>.5?1.0:-1.0;vec2 branch=next+vec2(sign*(.12+hash(n+seed)*.12),.13);vec2 bend=mix(next,branch,.55)+vec2(-sign*.035,.025);dist=min(dist,segment(p,next,bend));dist=min(dist,segment(p,bend,branch));}
  last=next;
 }
 return dist;
}
vec4 source(vec2 p){
 float inside=smoothstep(.005,.018,p.x)*(1.0-smoothstep(.982,.995,p.x))*smoothstep(.005,.018,p.y)*(1.0-smoothstep(.982,.995,p.y));
 vec4 s=texture2D(u_atlas,u_cell.xy+clamp(p,.002,.998)*u_cell.zw);
 s.a=smoothstep(.18,.82,s.a)*inside;
 return s;
}
void main(){
 vec2 p=v_uv,d=p-.5;float r=length(d),a=atan(d.y,d.x),t=u_time;
 float rim=smoothstep(.245,.32,r),outer=1.0-smoothstep(.46,.52,r);
 vec2 q=p;
 bool fiery=u_kind<.5||abs(u_kind-4.0)<.5||(u_kind>10.5&&u_kind<14.5);
 if(abs(u_kind-15.0)<.5){
  q=(p-.5)/(1.0+.018*sin(t*3.0))+.5;
 }else if(fiery){
  float fire=sin(p.y*27.0-t*3.0)+.45*sin(p.x*38.0+p.y*11.0+t*4.0);
  q+=vec2(fire*.0055,sin(p.x*32.0+t*2.2)*.004)*rim;
 }else if(abs(u_kind-1.0)<.5||abs(u_kind-6.0)<.5){
  q+=vec2(-d.y,d.x)*sin(a*9.0-t*2.0+r*17.0)*.027*rim;
 }else if(abs(u_kind-3.0)<.5||abs(u_kind-9.0)<.5){
  float top=exp(-length((p-vec2(.32,.20))*vec2(3.5,4.0)));
  float low=exp(-length((p-vec2(.69,.78))*vec2(3.5,4.0)));
  q.x+=sin(t*4.8)*(top-low)*.018*rim;q.y+=sin(t*2.4)*.003*rim;
 }else if(abs(u_kind-8.0)<.5){
  q=turn(t*.08)*d+.5;
 }else if(abs(u_kind-7.0)<.5||abs(u_kind-2.0)<.5){
  q.x+=sin(t*1.2+p.y*7.0)*.0035*rim;
 }else if(abs(u_kind-10.0)<.5){
  q+=vec2(-d.y,d.x)*sin(a*7.0-t*.7)*.018*rim;
 }
 vec4 ink=source(q);vec3 glow=vec3(0.0);float extra=0.0;
 if(fiery){
  ink.rgb*=1.0+.045*sin(t*7.1+p.y*20.0);
  for(int i=0;i<8;i++){
   float n=float(i),life=fract(t*.18+hash(n+3.0));
   float ang=hash(n+12.0)*PI*2.0;vec2 start=vec2(cos(ang),sin(ang))*.39+.5;
   vec2 pos=start+vec2(sin(t+n)*.015,-life*.16);
   float dot=exp(-length((p-pos)*vec2(1.0,.65))*340.0)*(1.0-life);
   extra+=dot*.8;glow+=mix(u_color,vec3(1.0,.85,.4),.55)*dot;
  }
 }else if(abs(u_kind-2.0)<.5||abs(u_kind-7.0)<.5){
  for(int i=0;i<7;i++){
   float n=float(i),life=fract(t*.11+hash(n+2.0));
   float side=mod(n,2.0)<.5?.17:.83;
   vec2 pos=vec2(side+sin(life*7.0+n)*.065,.04+life*.90);
   vec2 z=turn(t*.7+n)*(p-pos);
   float petal=1.0-smoothstep(.7,1.0,length(z/vec2(.012,.021)));
   petal*=sin(life*PI)*.8;extra+=petal;glow+=mix(u_color,vec3(1.0,.73,.85),.7)*petal;
  }
 }else if(abs(u_kind-1.0)<.5){
  for(int i=0;i<6;i++){
   float n=float(i),life=fract(t*.16+hash(n));float ang=n*1.047+t*.15;
   vec2 pos=vec2(cos(ang),sin(ang))*(.39+life*.055)+.5;
   float drop=exp(-length((p-pos)/vec2(.005,.008))*2.0)*sin(life*PI);
   extra+=drop;glow+=vec3(.65,.96,1.0)*drop;
  }
 }else if(abs(u_kind-5.0)<.5||abs(u_kind-8.0)<.5||abs(u_kind-6.0)<.5){
  for(int i=0;i<6;i++){
   float n=float(i),ang=n*1.047+t*(.10+hash(n)*.12),dist=.36+hash(n+9.0)*.09;
   vec2 z=p-(vec2(cos(ang),sin(ang))*dist+.5);
   float star=exp(-length(z)*430.0)+exp(-abs(z.x)*720.0-abs(z.y)*120.0)*.3+exp(-abs(z.y)*720.0-abs(z.x)*120.0)*.3;
   star*=.35+.65*pow(.5+.5*sin(t*2.0+n),3.0);extra+=star;glow+=vec3(.85,.95,1.0)*star;
  }
 }
 float lightning=step(abs(u_kind-10.0),.5);
 if(lightning>.5){
  float event=floor(t/3.4),phase=mod(t,3.4),peak=.24+hash(event+17.0)*.28;
  float flash=exp(-pow((phase-peak)/.047,2.0))+.65*exp(-pow((phase-peak-.12)/.037,2.0));
  float distance=bolt(p,event*9.3+13.0);
  float core=(1.0-smoothstep(.001,.0035,distance))*flash;
  float corona=exp(-distance*85.0)*flash;
  extra+=core*.95+corona*.38+flash*.035;
  glow+=vec3(.96,.98,1.0)*core+mix(u_color,vec3(.35,.55,1.0),.5)*corona*.7+vec3(.35,.45,.7)*flash*.05;
 }
 float clearPhoto=lightning>.5?smoothstep(.245,.278,r):smoothstep(.145,.18,r);
 float hole=mix(1.0,clearPhoto,u_hole);
 float energyMask=mix(hole,1.0,lightning)*outer;
 float alpha=clamp(ink.a*hole+extra*energyMask,0.0,1.0);
 vec3 rgb=(ink.rgb*ink.a*hole+glow*energyMask)/max(alpha,.001);
 gl_FragColor=vec4(clamp(rgb,0.0,1.0),alpha);
}
`;
const WM70_SHEETS=new Set(['creator_red','creator_elements','assistant_feminine','assistant_masculine','owner_feminine','owner_masculine','subscriber_feminine','subscriber_masculine','gifts']);
const WM70_KINDS={fire:0,water:1,wave:1,petals:2,rose:2,birds:3,phoenix:4,ice:5,aurora:6,leaves:7,galaxy:8,butterfly:9,lightning:10,storm:10,dragon:11,lion:12,sun:13,lava:14};
const wm70VectorHalo=wm70HaloArt;
wm70HaloArt=function(value){
 if(!value||!Number.isInteger(value.art)||value.art<0||value.art>9)return wm70VectorHalo(value);
 const variant=value.role==='creator'?'masculine':value.variant==='masculine'?'masculine':'feminine';
 const sheet=value.role==='creator'?(value.art<4?'creator_red':'creator_elements'):value.role+'_'+variant;
 if(!WM70_SHEETS.has(sheet))return '';
 const index=value.role==='creator'&&value.art>=4?value.art-4:value.art,cols=sheet==='creator_elements'?3:5;
 const color=/^#[a-f0-9]{6}$/i.test(value.colors?.[0])?value.colors[0]:'#b7eaff';
 return `<span class="wm70-real-halo" data-sheet="${sheet}" data-index="${index}" data-kind="${WM70_KINDS[value.effect]??0}" data-hole="1" data-light="${color}" style="--wm70-glow:${color}"><span class="wm70-real-poster" style="background-image:url('/s/wm70_${sheet}.webp?v=70');background-size:${cols*100}% 200%;background-position:${index%cols/(cols-1)*100}% ${Math.floor(index/cols)*100}%"></span><canvas aria-hidden="true"></canvas></span>`;
};

const WM70_MOTION={nodes:new Set(),visible:new Set(),images:new Map(),textures:new Map(),raf:0,last:0,ready:false,reduced:null};
const wm70VectorGift=wm70GiftArt;
wm70GiftArt=function(gift){
 const item=typeof gift==='string'?WM70.gifts.find(v=>v.code===gift):gift;
 if(!item||!Number.isInteger(item.art)||item.art<0||item.art>19)return wm70VectorGift(gift);
 const kind=['heart','cosmic_heart','ice_heart'].includes(item.effect)?15:WM70_KINDS[item.effect]??6;
 const index=item.art,color=item.code==='blue_fire'?'#77d9ff':item.effect==='fire'||item.effect==='phoenix'?'#ffbd6b':item.effect==='rose'||item.effect==='petals'?'#f2b1d9':'#a5dfff';
 return `<span class="wm70-art wm70-real-halo wm70-real-gift" data-sheet="gifts" data-index="${index}" data-kind="${kind}" data-hole="0" data-light="${color}" style="--wm70-glow:${color}"><span class="wm70-real-poster" style="background-image:url('/s/wm70_gifts.webp?v=70');background-size:500% 400%;background-position:${index%5*25}% ${Math.floor(index/5)/3*100}%"></span><canvas aria-hidden="true"></canvas></span>`;
};
function wm70MotionOn(){return !WM70_MOTION.reduced?.matches&&(typeof WN61_EMOJI==='undefined'||WN61_EMOJI.motion!==false)}
if(typeof wn61ToggleMotion==='function'){const old=wn61ToggleMotion;wn61ToggleMotion=function(){const value=old();for(const node of WM70_MOTION.nodes)node.dataset.wm70Painted='';wm70MotionSchedule();return value}}
function wm70MotionInit(){
 if(WM70_MOTION.ready)return;WM70_MOTION.ready=true;
 const state=WM70_MOTION,paper=document.createElement('canvas');paper.width=paper.height=320;
 let gl;
 try{gl=paper.getContext('webgl',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:false,powerPreference:'low-power'})}catch(error){}
 if(!gl)return;
 function shader(type,source){const value=gl.createShader(type);gl.shaderSource(value,source);gl.compileShader(value);if(!gl.getShaderParameter(value,gl.COMPILE_STATUS))throw Error('shader');return value}
 try{const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,WM70_VERTEX));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,WM70_FRAGMENT));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('program');gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);state.uniforms=Object.fromEntries(['u_atlas','u_cell','u_time','u_kind','u_hole','u_color'].map(name=>[name,gl.getUniformLocation(program,name)]));state.gl=gl;state.paper=paper}
 catch(error){return}
 state.reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 state.reduced?.addEventListener?.('change',()=>{for(const n of state.nodes)n.dataset.wm70Painted='';wm70MotionSchedule()});
 const observer=window.IntersectionObserver?new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)state.visible.add(entry.target);else state.visible.delete(entry.target)}wm70MotionSchedule()},{rootMargin:'15px'}):null;
 state.observe=function(){
  for(const node of document.querySelectorAll('.wm70-real-halo:not([data-wm70-motion])')){node.dataset.wm70Motion='1';state.nodes.add(node);if(observer)observer.observe(node);else state.visible.add(node)}
  for(const node of state.nodes)if(!node.isConnected){observer?.unobserve(node);state.nodes.delete(node);state.visible.delete(node)}
  wm70MotionSchedule();
 };
 let queued=false;
 new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;state.observe()})}).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){cancelAnimationFrame(state.raf);state.raf=0}else wm70MotionSchedule()});
 paper.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(state.raf);state.raf=0;state.gl=null;for(const n of state.nodes)n.classList.remove('wm70-painted')});
 state.observe();
}
function wm70MotionSchedule(){const s=WM70_MOTION;if(s.gl&&!s.raf&&s.visible.size&&document.visibilityState!=='hidden')s.raf=requestAnimationFrame(wm70MotionFrame)}
function wm70MotionTrim(active){const s=WM70_MOTION;for(const [sheet,texture] of s.textures){if(s.textures.size<=4)break;if(!active.has(sheet)){s.gl.deleteTexture(texture);s.textures.delete(sheet);s.images.delete(sheet)}}}
function wm70MotionTexture(sheet){
 const s=WM70_MOTION;if(s.textures.has(sheet))return s.textures.get(sheet);
 if(!s.images.has(sheet)){
  const image=new Image();s.images.set(sheet,image);
  image.onload=()=>{if(!s.gl)return;const gl=s.gl,value=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,value);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);s.textures.set(sheet,value);wm70MotionSchedule()};
  image.src='/s/wm70_'+sheet+'.webp?v=70';
 }
 return null;
}
function wm70MotionFrame(now){
 const s=WM70_MOTION;s.raf=0;if(!s.gl||document.visibilityState==='hidden')return;
 if(now-s.last<50){wm70MotionSchedule();return}s.last=now;
 const gl=s.gl,u=s.uniforms;let animate=false;
 for(const node of s.visible){
  if(!node.isConnected)continue;
  if(!wm70MotionOn()&&node.dataset.wm70Painted==='1')continue;
  const sheet=node.dataset.sheet,texture=wm70MotionTexture(sheet);if(!texture)continue;
  const canvas=node.querySelector('canvas');if(!canvas)continue;
  const size=Math.max(100,Math.min(320,Math.round(node.getBoundingClientRect().width*Math.min(2,window.devicePixelRatio||1))));
  if(canvas.width!==size||canvas.height!==size){canvas.width=canvas.height=size}
  gl.viewport(0,0,size,size);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(u.u_atlas,0);
  const cols=sheet==='creator_elements'?3:5,rows=sheet==='gifts'?4:2,index=Number(node.dataset.index);
  gl.uniform4f(u.u_cell,(index%cols)/cols,Math.floor(index/cols)/rows,1/cols,1/rows);gl.uniform1f(u.u_time,wm70MotionOn()?now/1000:0);gl.uniform1f(u.u_kind,Number(node.dataset.kind));
  gl.uniform1f(u.u_hole,node.dataset.hole==='0'?0:1);
  const hex=node.dataset.light;gl.uniform3f(u.u_color,parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255);gl.drawArrays(gl.TRIANGLES,0,6);
  const ctx=canvas.getContext('2d');if(!ctx)continue;ctx.clearRect(0,0,size,size);ctx.drawImage(s.paper,0,320-size,size,size,0,0,size,size);node.classList.add('wm70-painted');node.dataset.wm70Painted='1';if(wm70MotionOn())animate=true;
 }
 wm70MotionTrim(new Set(Array.from(s.visible).filter(n=>n.isConnected).map(n=>n.dataset.sheet)));
 if(animate)wm70MotionSchedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wm70MotionInit,{once:true});else wm70MotionInit();
