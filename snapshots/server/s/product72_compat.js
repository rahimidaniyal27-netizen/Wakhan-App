/* Keep the existing palette controls without starting the retired icon atlas. */
const WN61_KEYS=['brand','play','pause','back','forward','previous','next','repeat','queue','volume_down','volume_up','download','app','headphones','group','cinema','library','heart','search','settings','user','shield','crown','star','diamond','wallet','gift','coin','add','close','check','error','help','globe','clock','shuffle','edit','trash','mail','link','more','lock','home','youtube','soundcloud','send','receipt','sort','folder'];
const WN61_EMOJI={motion:load('wn61_motion')!=='off',nodes:new Set(),observer:null,scheduled:false,serial:0};
function wn61SetMotion(){}
function wn61Wake(){}
function wn61Scan(){}
function wn61StartMotion(){}
