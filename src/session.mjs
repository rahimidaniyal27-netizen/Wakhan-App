/* Native account sessions. Device keys persist only through the platform vault. */
export class AuthError extends Error{constructor(code){super(code);this.code=code}}
export function normalizeOrigin(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw Error('invalid_server');return u.origin}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export class SessionBroker{
 constructor({origin,store,fetch}){this.origin=normalizeOrigin(origin);this.store=store;this.raw=fetch;this.session=null}
 valid(value){return !!(value&&/^wka1\.[A-Za-z0-9_-]{24}\.[a-f0-9]{32}$/.test(value.key)&&Number.isSafeInteger(value.user?.id)&&value.user.id>0)}
 async restore(){let saved;try{saved=JSON.parse(await this.store.get('session')||'null')}catch{return null}if(!this.valid(saved)||saved.origin!==this.origin)return null;this.session=saved;return saved}
 async accept(value){const saved={origin:this.origin,key:value.key,user:{id:Number(value.uid),public_id:value.public_id||null,first_name:value.name||''},new:!!value.new};if(!this.valid(saved))throw Error('invalid_session');await this.store.set('session',JSON.stringify(saved));this.session=saved;return saved}
 async request(input,init={},timeout=20000){
  const controller=new AbortController(),parent=init.signal;
  const abort=()=>controller.abort();
  if(parent?.aborted)controller.abort();else parent?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>controller.abort(),timeout);
  const cancelled=new Promise((resolve,reject)=>{if(controller.signal.aborted)reject(new DOMException('Request aborted','AbortError'));else controller.signal.addEventListener('abort',()=>reject(new DOMException('Request aborted','AbortError')),{once:true})});
  try{return await Promise.race([this.raw(input,{...init,signal:controller.signal}),cancelled])}
  finally{clearTimeout(timer);parent?.removeEventListener('abort',abort)}
 }
 async call(path,body,{signed=false}={}){
  if(!path.startsWith('/api/app/'))throw Error('invalid_auth_route');
  const headers={'Content-Type':'application/json'};if(signed&&this.session)headers['X-Init']=this.session.key;
  let response;
  try{response=await this.request(this.origin+path,{method:body===undefined?'GET':'POST',headers,redirect:'error',body:body===undefined?undefined:JSON.stringify(body)},20000)}catch{throw new AuthError('net')}
  let value;try{value=await response.json()}catch{throw new AuthError('server_response')}
  if(!response.ok||!value.ok)throw new AuthError(value.err||'server');return value;
 }
 async config(){return this.call('/api/app/config')}
 async me(){
  const value=await this.call('/api/app/me',undefined,{signed:true});
  if(this.session&&Number(value.uid)===this.session.user.id){
   this.session.user.public_id=value.public_id||null;this.session.user.first_name=value.name||'';
   await this.store.set('session',JSON.stringify(this.session));
  }
  return value;
 }
 async emailSend(email,link=false){return this.call('/api/app/email/send',{email},{signed:link})}
 async emailVerify(email,code,link=false){const value=await this.call('/api/app/email/verify',{email,code},{signed:link});if(value.key)await this.accept(value);return value}
 async name(name){const value=await this.call('/api/app/profile',{name},{signed:true});this.session.user.first_name=value.name;this.session.new=false;await this.store.set('session',JSON.stringify(this.session));return value}
 async startBrowser(provider,link=false){
  if(!['google','facebook'].includes(provider))throw Error('invalid_provider');
  const value=await this.call('/api/app/native/start',{provider,client:'android',link},{signed:link});
  await this.store.set('pair',JSON.stringify({kind:'browser',origin:this.origin,provider,link,...value}));return value;
 }
 async pending(){let value;try{value=JSON.parse(await this.store.get('pair')||'null')}catch{return null}
  if(!value)return null;
  if(value.kind!=='browser'||value.origin!==this.origin||!Number.isFinite(value.expires)||value.expires*1000<Date.now()){
   await this.store.remove('pair');return null;
  }
  return value;
 }
 async poll(value,valid=()=>true){
  if(value.kind!=='browser')throw Error('invalid_handoff');
  const result=await this.call('/api/app/native/poll',{ticket:value.ticket,proof:value.proof});
  if(result.wait||!valid())return null;
  if(result.key)await this.accept(result);else if(!result.linked)throw Error('invalid_session');
  await this.store.remove('pair');return result;
 }
 async fetch(input,init={}){
  const request=typeof Request!=='undefined'&&input instanceof Request?input:null;
  const url=new URL(request?request.url:String(input),this.origin);
  const headers=new Headers(init.headers||request?.headers);
  if(url.origin!==this.origin){headers.delete('X-Init');return this.raw(request?new Request(request,{...init,headers}):input,request?undefined:{...init,headers})}
  if(!url.pathname.startsWith('/api/'))return this.raw(input,init);
  if(!this.session)throw new AuthError('auth');headers.set('X-Init',this.session.key);
  const method=String(init.method||request?.method||'GET').toUpperCase();
  const timeout=/\/poll(?:$|\/)|^\/api\/c\//.test(url.pathname)?35000:/receipt|media/.test(url.pathname)&&method==='POST'?90000:25000;
  const signal=init.signal||request?.signal;
  const options={...init,signal,headers,redirect:'error'};
  const send=()=>this.request(request?new Request(request,options):url.href,request?{signal}:{...options},timeout);
  let response;
  // Financial mutations and sign-in requests are never retried implicitly.
  for(let attempt=0;attempt<2;attempt++){
   try{
    response=await send();
    if(method==='GET'&&attempt===0&&[502,503,504].includes(response.status)&&!signal?.aborted){
     await response.body?.cancel().catch(()=>{});await pause(350);continue;
    }
    break;
   }catch(error){
    if(method!=='GET'||attempt||signal?.aborted||error?.name==='AbortError')throw error;
    await pause(350);
   }
  }
  if(response.status===401){let value;try{value=await response.clone().json()}catch{}
   if(value?.err==='auth'){await this.store.remove('session');this.session=null;globalThis.window?.dispatchEvent(new Event('wakhan-auth-required'))}
  }
  return response;
 }
 async logout(){
  const saved=this.session;this.session=null;await this.store.remove('session');await this.store.remove('pair');
  if(saved)try{await this.request(this.origin+'/api/app/logout',{method:'POST',redirect:'error',headers:{'X-Init':saved.key}},10000)}catch{}
 }
}
