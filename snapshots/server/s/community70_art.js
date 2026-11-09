/* Original semantic gift and avatar-frame artwork. No borrowed emoji packs. */
let WM70_ART_SERIAL=0;
function wm70ArtBase(content,colors=['#d4faff','#3c83d6'],cls=''){
 const id='wm70-art-'+(++WM70_ART_SERIAL),light=colors[0],dark=colors[1];
 return `<svg class="wm70-art ${cls}" style="--wm70-glow:${dark}" viewBox="0 0 160 160" aria-hidden="true"><defs><linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".42" stop-color="${dark}"/><stop offset=".72" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient><radialGradient id="${id}-p" cx=".3" cy=".2" r=".9"><stop stop-color="#ffffff"/><stop offset=".32" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></radialGradient><linearGradient id="${id}-f" x1="0" y1="1" x2=".3" y2="0"><stop stop-color="${dark}"/><stop offset=".55" stop-color="${light}"/><stop offset="1" stop-color="#fff6b4"/></linearGradient></defs>${content.replaceAll('@G',`url(#${id}-g)`).replaceAll('@P',`url(#${id}-p)`).replaceAll('@F',`url(#${id}-f)`)}</svg>`;
}
function wm70Flame(x,y,scale=1,delay=0){return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="wm70-fire" style="--motion-delay:${delay}s"><path d="M0 23C-21 9-14-6-4-21C-8-8 1-7 2-16C12-7 22 9 10 21C6 27-1 27 0 23Z" fill="@F" stroke="#fff1b4" stroke-width=".6"/><path d="M1 20C-7 13-2 6 4-1C3 8 12 13 7 20Z" fill="#fff8db" opacity=".9"/></g></g>`}
function wm70Bird(x,y,scale=1,delay=0){
 const feather=`<path d="M0 1C-16-8-29-10-40-31L-33-7L-46-14C-39 7-20 17-3 12Z" fill="@P" stroke="#ffffffae" stroke-width=".8"/><path d="M-6 7L-32-15M-9 11L-32-5" stroke="#ffffff99" fill="none" stroke-width="1"/>`;
 return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="wm70-bird" style="--motion-delay:${delay}s"><g class="wm70-wing">${feather}</g><g transform="scale(-1 1)"><g class="wm70-wing">${feather}</g></g><path d="M0-7C-9 0-7 13 0 23C7 13 9 0 0-7Z" fill="@P"/><circle cx="0" cy="-7" r="5" fill="#fff7e5"/><path d="M4-8L10-5L4-3" fill="#d9ad64"/></g></g>`;
}
function wm70Flower(x,y,scale=1,delay=0){let petals='';for(let i=0;i<7;i++)petals+=`<ellipse cx="0" cy="-9" rx="6" ry="12" transform="rotate(${i*360/7})" fill="@P" stroke="#fff9" stroke-width=".5"/>`;return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="wm70-flower" style="--motion-delay:${delay}s">${petals}<circle r="5" fill="#fff1ba"/></g></g>`}
function wm70Effect(kind,frame=false){
 const ring=`<circle cx="80" cy="80" r="58" fill="none" stroke="@G" stroke-width="5"/><circle cx="80" cy="80" r="62" fill="none" stroke="#fff8" stroke-width="1"/>`;
 if(frame&&['lotus','butterfly','moon','lightning','shield','mountain'].includes(kind))return ring+`<g transform="translate(80 139) scale(.36) translate(-80 -80)">${wm70Effect(kind,false)}</g>`;
 if(kind==='fire'||kind==='phoenix'){
  let flames='';for(let i=0;i<(frame?16:7);i++){const a=i*360/(frame?16:7);flames+=frame?`<g transform="rotate(${a} 80 80)">${wm70Flame(80,20,.5,-i*.21)}</g>`:wm70Flame(42+i*12,83-Math.sin(i)*7,.8,-i*.17)}
  return (frame?ring:'')+flames+(kind==='phoenix'?wm70Bird(80,82,.9):'');
 }
 if(kind==='birds')return(frame?ring:'')+wm70Bird(80,frame?20:82,frame?.62:1,-.4)+(frame?wm70Bird(80,139,.38,-1):'');
 if(kind==='petals'||kind==='rose'||kind==='lotus'||kind==='leaves'){
  let content=frame?ring:'';
  if(kind==='rose'){content+=`<path d="M80 88v49M80 114Q49 120 49 96Q72 96 80 112M80 102Q103 102 111 84Q86 86 80 102" fill="#65ad84" stroke="#3c8465" stroke-width="3"/>`+wm70Flower(80,65,1.5);return content}
  if(kind==='lotus'){
   for(let i=-2;i<=2;i++)content+=`<g transform="rotate(${i*25} 80 114)"><path class="wm70-sway" d="M80 114C48 92 64 65 80 42C96 65 112 92 80 114Z" fill="@P" stroke="#fff9" stroke-width="1"/></g>`;
   return content;
  }
  if(kind==='leaves'){for(let i=0;i<10;i++){const a=i*36;content+=`<g transform="rotate(${a} 80 80)"><path class="wm70-sway" d="M80 27Q55 12 67 0Q88 0 80 27Z" fill="@P" stroke="#efffe9" stroke-width=".6"/><path d="M80 27L69 7" stroke="#efffe9" fill="none" stroke-width=".7"/></g>`}return content}
  if(frame){for(let i=0;i<8;i++){const a=i*PI70/4;content+=wm70Flower(80+61*Math.cos(a),80+61*Math.sin(a),.36,-i*.24)}}
  else content+=wm70Flower(80,82,1.25);
  for(let i=0;i<8;i++)content+=`<g class="wm70-petal" style="--motion-delay:${-i*.48}s;--drift:${i%2?9:-9}px"><path d="M${23+i*16} ${20+(i*17)%75}q-14-13-1-21q15 5 1 21" fill="@P"/></g>`;
  return content;
 }
 if(['water','wave','waterfall','aurora'].includes(kind)){
  let content=frame?ring:'';
  if(kind==='waterfall'){
   for(let i=0;i<7;i++)content+=`<path class="wm70-waterfall" style="--motion-delay:${-i*.23}s" d="M${43+i*12} 37Q${38+i*12} 80 ${45+i*12} 121" stroke="@G" fill="none" stroke-width="${i%2?5:8}" stroke-linecap="round"/>`;
  }else{
   for(let i=0;i<4;i++)content+=`<path class="wm70-river" style="--motion-delay:${-i*.7}s" d="M${frame?14:22} ${frame?122+i*5:64+i*14}C45 ${frame?96+i*5:40+i*14} 101 ${frame?150+i*5:111+i*9} ${frame?145:138} ${frame?119+i*5:70+i*14}" fill="none" stroke="@G" stroke-width="${kind==='aurora'?10:6}" stroke-linecap="round" opacity="${.9-i*.12}"/>`;
  }
  return content;
 }
 if(['heart','cosmic_heart','ice_heart'].includes(kind))return `<g class="wm70-heart"><path d="M80 126L33 81C5 48 52 20 80 52C108 20 155 48 127 81Z" fill="@P" stroke="#fff9" stroke-width="2"/><path d="M37 65Q35 45 57 48" fill="none" stroke="#fff9" stroke-width="5" stroke-linecap="round"/>${kind==='cosmic_heart'?'<path class="wm70-spark" d="M98 54v16m-8-8h16M59 87v11m-5-6h10" stroke="#fff" stroke-width="2"/>':''}${kind==='ice_heart'?'<path d="M80 55v55M50 75l57 22M54 105l54-30" stroke="#e8ffff99" fill="none" stroke-width="2"/>':''}</g>`;
 if(kind==='butterfly')return `<g transform="translate(80 80)"><g class="wm70-wing"><path d="M0 5C-75-80-69 52-9 23C-54 19-35 80 0 18" fill="@P" stroke="#fff9"/></g><g transform="scale(-1 1)"><g class="wm70-wing"><path d="M0 5C-75-80-69 52-9 23C-54 19-35 80 0 18" fill="@P" stroke="#fff9"/></g></g><ellipse rx="5" ry="28" fill="@G"/></g>`;
 if(kind==='moon')return (frame?ring:'')+`<g class="wm70-orbit"><path d="M103 31C49 31 40 103 106 119C64 141 24 105 38 62C46 40 74 24 103 31Z" fill="@P" stroke="#fff9"/></g>`;
 if(kind==='ice'){
  let content=frame?ring:'';for(let i=0;i<8;i++)content+=`<g transform="rotate(${i*45} 80 80)"><path class="wm70-spark" d="M80 ${frame?8:26}L86 ${frame?21:48}L80 ${frame?31:61}L74 ${frame?21:48}Z" fill="@P"/></g>`;return content;
 }
 if(kind==='lightning')return (frame?ring:'')+`<g class="wm70-spark"><path d="M83 14L41 84H75L62 145L119 64H86L102 14Z" fill="@P" stroke="#fff7" stroke-width="2"/></g>`;
 if(kind==='dragon')return ring+`<g class="wm70-sway"><path d="M19 102C-1 49 39 5 62 19L53 39L39 27L26 48L37 66L22 84L33 111M141 102C161 49 121 5 98 19L107 39L121 27L134 48L123 66L138 84L127 111" fill="@P" stroke="#fff9" stroke-width="2"/><path d="M50 18L40 3L36 23M110 18L120 3L124 23" fill="@G"/></g>`;
 if(kind==='shield'||kind==='mountain')return (frame?ring:'')+`<path class="wm70-sway" d="${kind==='shield'?'M80 16L123 36L116 96L80 139L44 96L37 36Z':'M17 127L62 36L82 76L104 42L145 127Z'}" fill="@P" stroke="#fff9" stroke-width="2"/>`;
 if(kind==='pearl')return ring+`<g class="wm70-heart"><circle cx="80" cy="20" r="13" fill="@P"/><circle cx="80" cy="140" r="9" fill="@P"/></g>`;
 if(kind==='sun'){
  let rays='';for(let i=0;i<12;i++)rays+=`<path transform="rotate(${i*30} 80 80)" d="M80 10L86 29L80 37L74 29Z" fill="@P"/>`;
  return `<g class="wm70-orbit">${rays}</g>`+(frame?ring:'<circle cx="80" cy="80" r="35" fill="@P"/>');
 }
 if(kind==='comet')return (frame?ring:'')+`<g class="wm70-sway" ${frame?'transform="translate(80 20) scale(.45) translate(-80 -80)"':''}><path d="M23 121Q47 94 75 79M33 131Q62 112 88 84M25 101L73 72" fill="none" stroke="@G" stroke-width="7" stroke-linecap="round"/><path d="M99 31L106 52L127 59L106 67L98 88L91 67L70 60L91 52Z" fill="@P" stroke="#fff8"/></g>`;
 let stars='';for(let i=0;i<9;i++){const a=i*2.39996,r=frame?61:25+(i%3)*12,x=80+r*Math.cos(a),y=80+r*Math.sin(a);stars+=`<path class="wm70-spark" style="--motion-delay:${-i*.23}s" d="M${x} ${y-5}l2 4 4 1-4 2-2 4-1-4-4-2 4-1Z" fill="#fff3da"/>`}
 return (frame?ring:`<ellipse cx="80" cy="80" rx="53" ry="21" transform="rotate(-28 80 80)" fill="none" stroke="@G" stroke-width="9"/>`)+`<g class="wm70-orbit">${stars}</g>`;
}
const PI70=Math.PI;
function wm70HaloArt(value){
 if(!value)return '';
 const effect=wm70Effect(value.effect,true),feminine=value.variant==='feminine',masculine=value.variant==='masculine';
 const variant=feminine?wm70Flower(26,118,.55)+wm70Flower(134,118,.55):masculine?'<path d="M16 64L6 79L22 106L29 98M144 64L154 79L138 106L131 98" fill="@G" stroke="#fff8"/>':'';
 const crest=value.role==='creator'?'<path d="M57 19L53 3L70 12L80 0L90 12L107 3L103 19Z" fill="@P" stroke="#fff7"/>':value.role==='assistant'?'<path d="M72 15L80 3L88 15L80 28Z" fill="@P"/>':value.role==='owner'?'<path d="M69 17V6H75V11H85V6H91V17Z" fill="@P"/>':'<circle cx="80" cy="16" r="5" fill="@P"/>';
 return wm70ArtBase(`<g class="wm70-halo-body wm70-effect-${value.motion}">${effect}${variant}${crest}</g>`,value.colors,'wm70-halo-art');
}
function wm70GiftArt(gift){
 const item=typeof gift==='string'?WM70.gifts.find(v=>v.code===gift):gift;
 if(!item)return wnIcon('coin');
 const colors=item.code==='blue_fire'?['#bafaff','#347de5']:item.effect==='fire'||item.effect==='phoenix'?['#ffe2a1','#eb593e']:item.effect==='rose'||item.effect==='petals'?['#ffe0ed','#d66d9d']:item.effect==='birds'?['#fff4d5','#9ab7df']:['#c7f7ff','#7473d6'];
 return wm70ArtBase(wm70Effect(item.effect,false),colors,'wm70-gift-art');
}
