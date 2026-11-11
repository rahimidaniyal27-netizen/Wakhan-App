export function normalizeMusicQuery(value){
 const query=String(value||'').trim();
 if(/^https?:\/\//i.test(query))return query;
 return query.normalize('NFKC').replace(/[كيى]/g,c=>({'ك':'ک','ي':'ی','ى':'ی'}[c])).replace(/[\u064b-\u065f\u0640]/g,'').replace(/\s+/g,' ');
}

export function installSearchNormalization(target=globalThis.window){
 if(!target||typeof target.api!=='function'||target.api.wakhanQueryNormalization)return;
 const original=target.api;
 function api(path,...args){
  if(typeof path==='string'){
   const index=path.indexOf('?'),pathname=index<0?path:path.slice(0,index);
   if(['/api/search','/api/cinema/search'].includes(pathname)&&index>=0){
    const query=new URLSearchParams(path.slice(index+1));
    if(query.has('q'))query.set('q',normalizeMusicQuery(query.get('q')));
    path=pathname+'?'+query;
   }
  }
  return original.call(this,path,...args);
 }
 api.wakhanQueryNormalization=true;target.api=api;
}
