/* Route selection is local to a room/peer; never invent relay hosts or credentials. */
export function installVoiceRoutes({restart=()=>{},storage=globalThis.localStorage}={}){
 let mode='auto';try{if(storage?.getItem('wk_voice_route')==='tls')mode='tls'}catch{}
 const failures=new Map();
 const key=({room,peer})=>JSON.stringify([String(room||''),Number(peer)]);
 const tlsServers=ice=>(Array.isArray(ice)?ice:[]).flatMap(server=>{
  const urls=(Array.isArray(server.urls)?server.urls:[server.urls]).filter(url=>typeof url==='string'&&/^turns:/i.test(url));
  return urls.length?[{...server,urls}]:[];
 });
 return {
  get mode(){return mode},
  setMode(next){
   if(!['auto','tls'].includes(next))throw Error('invalid_voice_mode');
   if(mode===next)return;mode=next;failures.clear();
   try{storage?.setItem('wk_voice_route',next)}catch{}
   restart();
  },
  reset(){failures.clear()},
  failure(context,why){
   if(!['failed','lost','slow','ring'].includes(why))return;
   const id=key(context);failures.set(id,Math.min(3,(failures.get(id)||0)+1));
   while(failures.size>30)failures.delete(failures.keys().next().value);
  },
  configuration(ice,context){
   const servers=Array.isArray(ice)?ice:[],tls=tlsServers(servers),count=failures.get(key(context))||0;
   if(mode==='tls'){
    if(!tls.length)throw Error('voice_tls_unavailable');
    return {iceServers:tls,iceTransportPolicy:'relay'};
   }
   // On failure retry a genuinely different path, rather than repeating direct ICE.
   if(count>0&&count<3&&tls.length)return {iceServers:tls,iceTransportPolicy:'relay'};
   if(count>=3){
    const relays=servers.flatMap(server=>{
     const urls=(Array.isArray(server.urls)?server.urls:[server.urls]).filter(url=>typeof url==='string'&&/^turns?:/i.test(url));
     return urls.length?[{...server,urls}]:[];
    });
    if(relays.length)return {iceServers:relays,iceTransportPolicy:'relay'};
   }
   return {iceServers:servers};
  }
 };
}
