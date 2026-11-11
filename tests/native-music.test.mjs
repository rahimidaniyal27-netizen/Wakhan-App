import test from 'node:test';
import assert from 'node:assert/strict';
import {installNativeMusic} from '../src/native-music.mjs';

function fixture(){
 let onState,finishListener,clock=10000;const actions=[],listeners=[];
 class Audio extends EventTarget{paused=true;ended=false;currentTime=0;duration=90;src='';readyState=0;play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}load(){}removeAttribute(key){this[key]=''}}
 const original=new Audio(),scope={apSource:async()=>{actions.push('html');return true}};
 let listenerReady=Promise.resolve({remove(){listeners.push('removed')}});
 const player={addListener(name,callback){onState=callback;return listenerReady},control:async value=>{actions.push(value);return {}},loadTrack:async value=>{actions.push(value);return {id:value.id,ready:true,playing:value.playing,wanted:value.playing,duration:90,position:value.position}},stopAll:async()=>actions.push('stopAll')};
 const music=installNativeMusic({player,enabled:true,origin:'https://music.kabulcafe.uk',now:()=>clock});
 const audio=music.wrap(original);music.bind(scope);
 return {music,audio,scope,actions,player,emit:v=>onState(v),listeners,advance:t=>clock+=t,holdListener(){listenerReady=new Promise(r=>finishListener=r)},releaseListener(){finishListener({remove(){}})}};
}

test('native personal music keeps its source and position across buffering; pause and seek keep intent',async()=>{
 const f=fixture();try{
  const events=[];for(const name of ['play','loadedmetadata','waiting','ended'])f.audio.addEventListener(name,()=>events.push(name));
  assert.equal(await f.scope.apSource({src:'/a/song.m4a?lease=private',title:'Song'},5,true,1),true);
  const load=f.actions.find(x=>x.source);assert.equal(load.source,'https://music.kabulcafe.uk/a/song.m4a?lease=private');assert.equal(f.audio.paused,false);
  f.advance(2000);assert.equal(f.audio.currentTime,7);
  f.emit({id:load.id,buffering:true,wanted:true,position:7,duration:90});assert.equal(f.audio.paused,false);assert.equal(f.music.active,true);
  assert.equal(f.actions.filter(x=>x.source).length,1,'network buffering must not reload the track');
  f.audio.pause();assert.equal(f.audio.paused,true);f.audio.currentTime=12;
  assert.equal(f.actions.at(-1).action,'seek');assert.equal(f.actions.at(-1).position,12);
  await f.audio.play();assert.equal(f.audio.paused,false);assert.ok(events.includes('waiting'));
 }finally{await f.music.shutdown()}
});

test('a replaced source ignores stale native events and cancellation prevents late playback',async()=>{
 const f=fixture();try{
  await f.scope.apSource({src:'/a/first.m4a'},0,true,1);const first=f.actions.find(x=>x.source);
  await f.scope.apSource({src:'/a/second.m4a'},0,true,2);const second=f.actions.filter(x=>x.source).at(-1);
  f.emit({id:first.id,ended:true,position:90});assert.equal(f.audio.ended,false);assert.ok(f.audio.src.includes('second'));
  f.audio.removeAttribute('src');f.emit({id:second.id,ready:true,playing:true,wanted:true});assert.equal(f.music.ownsPlayback,false);
  assert.equal(f.actions.at(-1).action,'stop');
 }finally{await f.music.shutdown()}
});

test('pending listener setup cannot start music after logout; untrusted sources stay outside native player',async()=>{
 let callback,release,loads=0,stopped=0;
 const wait=new Promise(r=>release=r),scope={apSource:async()=>true};
 const player={addListener:(_,cb)=>{callback=cb;return wait},loadTrack:async()=>{loads++;return{}},control:async()=>{},stopAll:async()=>{stopped++}};
 class Audio extends EventTarget{play(){return Promise.resolve()}pause(){}load(){}removeAttribute(){}}
 const m=installNativeMusic({player,enabled:true,origin:'https://music.kabulcafe.uk'});m.wrap(new Audio());m.bind(scope);
 const preparing=scope.apSource({src:'/a/test.m4a'},0,true,1);const closing=m.shutdown();release({remove(){}});
 assert.equal(await preparing,false);await closing;assert.equal(loads,0);assert.equal(stopped,1);
 const f=fixture();try{
  await f.scope.apSource({src:'https://other.example/a/private.m4a'},0,true,1);
  assert.equal(f.actions.includes('html'),true);assert.equal(f.actions.some(x=>x.source),false);
 }finally{await f.music.shutdown()}
});
