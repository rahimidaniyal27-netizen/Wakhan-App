const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ast=require('../scripts/ui-hotfix/js_ast_tools.cjs');
const bundle=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../public/wakhan-shell.json'),'utf8'));
const source=bundle.programs[9].code,mic=ast.find(source,'vcMute'),sync=ast.find(source,'wmqNotifyMute','declaration');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const requests=[],track={enabled:true,readyState:'live'};
 const ctx={CS:{mine:0},CID:'OLD123',WMC:{epoch:1},WMQ:{token:1},SX:{mic:{getAudioTracks:()=>[track]}},VC:{on:true,cid:'OLD123',mute:false,spk:{}},ME:{me:{id:1}},hap(){},drawHall(){},setTimeout,clearTimeout,api(url,body){return new Promise(resolve=>requests.push({url,body,resolve}))}};
 vm.createContext(ctx);vm.runInContext(source.slice(sync.start,sync.end)+';vcMute='+source.slice(mic.start,mic.end),ctx);
 return {ctx,requests,track};
}
(async()=>{
 let f=fixture();await f.ctx.vcMute();assert.equal(f.track.enabled,false);assert.equal(f.ctx.SX.micBusy,false);assert.equal(f.requests.length,1);
 await f.ctx.vcMute();assert.equal(f.track.enabled,true);assert.equal(f.ctx.VC.mute,false);assert.equal(f.ctx.SX.micBusy,false);assert.equal(f.requests.length,1,'rapid taps coalesce while the first acknowledgement is delayed');
 f.requests[0].resolve({ok:true});await flush();assert.equal(f.requests.length,2);assert.equal(f.requests[1].body.m,0);f.requests[1].resolve({ok:true});await flush();assert.equal(f.ctx.SX.muteSync.running,false);
 f=fixture();await f.ctx.vcMute();await f.ctx.vcMute();f.ctx.CID='NEW456';f.ctx.VC.cid='NEW456';f.ctx.WMC.epoch++;f.ctx.WMQ.token++;f.requests[0].resolve({ok:true});await flush();assert.equal(f.requests.length,1,'an old room must not receive a delayed second toggle');
 console.log('PASS: actual bundled mic toggles immediately while ACK is pending; latest state coalesces and old room work is cancelled');
})().catch(error=>{console.error(error);process.exitCode=1});
