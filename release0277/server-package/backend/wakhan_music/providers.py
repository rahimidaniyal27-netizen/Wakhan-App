"""Provider-owned rankings and explicit rights. Never infer rights from availability."""
import asyncio,base64,json,re,time,urllib.parse
import aiohttp

OML='https://openaudiofoundation.org/open-music-license.pdf'
CC=re.compile(r'^https?://creativecommons\.org/(?:licenses/(by|by-sa)/(?:[1-4]\.0|2\.5)/(?:[a-z]{2}/)?|publicdomain/zero/1\.0/)$',re.I)
def license_ok(value):return isinstance(value,str) and bool(CC.fullmatch(value))
def https(value):
    try:
        u=urllib.parse.urlsplit(str(value));return u.scheme=='https' and bool(u.hostname) and not u.username and not u.password and u.port in (None,443)
    except ValueError:return False

def duration(value):
    try:
        parts=str(value).split(':');v=0
        for p in parts:v=v*60+float(p)
        return v if 0<v<=7200 else 0
    except (TypeError,ValueError):return 0

def archive_id(album,name):return 'ia.'+base64.urlsafe_b64encode(json.dumps([album,name],separators=(',',':')).encode()).decode().rstrip('=')
def decode_archive(value):
    if not isinstance(value,str) or not value.startswith('ia.') or len(value)>1100:raise ValueError('track')
    a,n=json.loads(base64.urlsafe_b64decode(value[3:]+'='*(-len(value[3:])%4)))
    if not isinstance(a,str) or not re.fullmatch(r'[A-Za-z0-9_.-]{1,180}',a) or not isinstance(n,str) or len(n)>500 or any(x in ('','..','.') for x in n.split('/')) or '\\' in n:raise ValueError('track')
    return a,n

def archive_tracks(item,rank=1,popularity=0):
    m=item.get('metadata') or {};album=m.get('identifier','');lic=m.get('licenseurl');lic=lic[0] if isinstance(lic,list) and len(lic)==1 else lic
    if not license_ok(lic) or not re.fullmatch(r'[A-Za-z0-9_.-]{1,180}',album):return []
    files=item.get('files') or []
    art=[f for f in files if f.get('source')=='original' and f.get('format') in ('JPEG','PNG') and int(f.get('size') or 0)<8000000 and re.search(r'(?:cover|front|folder|artwork)',f.get('name',''),re.I)]
    if not art:return [] # Spectrograms, generic Archive thumbnails and artist portraits are not covers.
    art.sort(key=lambda f:(not bool(re.search(r'(?:front|cover1?\.)',f['name'],re.I)),len(f['name'])))
    base='https://archive.org/download/'+urllib.parse.quote(album,safe='')+'/'
    cover=base+urllib.parse.quote(art[0]['name'],safe='/')
    creator=m.get('creator') or m.get('title') or 'Internet Archive';creator=' / '.join(creator) if isinstance(creator,list) else creator
    tracks=[]
    for f in files:
        name=f.get('name','');d=duration(f.get('length'))
        if f.get('format') not in ('VBR MP3','MP3') or not name.lower().endswith('.mp3') or not d or int(f.get('size') or 0)>120*1024*1024:continue
        if any(p in ('..','.') for p in name.split('/')):continue
        tracks.append(dict(id=archive_id(album,name),provider='archive',title=str(f.get('title') or name.rsplit('/',1)[-1][:-4])[:200],artist=str(creator)[:150],album=str(m.get('title',''))[:200],cover=cover,duration=d,source_url='https://archive.org/details/'+album,license=lic,attribution=str(creator)+' · '+str(m.get('title','')),downloadable=True,persistent=True,stream=base+urllib.parse.quote(name,safe='/'),source_rank=rank,metric='album_downloads',popularity=popularity))
    return tracks

def audius_track(x,rank=1):
    ident=x.get('id','');art=x.get('artwork') or {};cover=art.get('480x480') or art.get('1000x1000');lic=x.get('license');user=x.get('user') or {}
    # Unknown alternate licences, NC, ARR and gated/API-opt-out records are excluded.
    allowed=lic is None or lic=='' or license_ok(lic)
    if not re.fullmatch(r'[A-Za-z0-9]{1,30}',ident) or not allowed or x.get('is_streamable') is not True or x.get('is_available') is False or x.get('is_stream_gated') or x.get('is_unlisted') or x.get('is_delete') or x.get('allowed_api_keys') or not https(cover):return None
    path=x.get('permalink','')
    if not isinstance(path,str) or not path.startswith('/') or path.startswith('//'):return None
    artist=str(user.get('name') or user.get('handle') or 'Audius')[:150]
    # API Terms §Content/Data Protection permit session-only caching: never offline.
    return dict(id='au.'+ident,provider='audius',title=str(x.get('title',''))[:200],artist=artist,genre=str(x.get('genre')or '')[:80],language=str(x.get('language')or '')[:20],cover=cover,duration=duration(x.get('duration')),source_url='https://audius.co'+path,license={'Attribution CC BY':'https://creativecommons.org/licenses/by/4.0/','Attribution-ShareAlike CC BY-SA':'https://creativecommons.org/licenses/by-sa/4.0/','Creative Commons CC0':'https://creativecommons.org/publicdomain/zero/1.0/'}.get(lic,lic or OML),attribution=artist+' · Audius',downloadable=False,persistent=False,stream='https://api.audius.co/v1/tracks/'+ident+'/stream?app_name=Wakhan',source_rank=rank,metric='weekly_trending',popularity=max(0,int(x.get('play_count') or 0)))

def ccmixter_tracks(items):
    result=[]
    for rank,x in enumerate(items,1):
        if not license_ok(x.get('license_url')):continue
        files=x.get('files') or []
        art=next((f for f in files if (f.get('file_format_info') or {}).get('mime_type') in ('image/jpeg','image/png') and https(f.get('download_url'))),None)
        if not art:continue
        f=next((f for f in files if (f.get('file_format_info') or {}).get('mime_type')=='audio/mpeg' and str(f.get('download_url','')).startswith('https://ccmixter.org/content/')),None)
        if not f:continue
        result.append(dict(id='cc.'+str(x['upload_id']),provider='ccmixter',title=str(x.get('upload_name',''))[:200],artist=str(x.get('user_real_name') or x.get('user_name',''))[:150],cover=art['download_url'],duration=duration((f.get('file_format_info') or {}).get('ps')),source_url=x['file_page_url'],license=x['license_url'],attribution=str(x.get('user_real_name',''))+' · ccMixter',downloadable=True,persistent=True,stream=f['download_url'],source_rank=rank,metric='provider_rank',popularity=int(x.get('upload_num_scores') or 0)))
    return result

def merge_rankings(groups,limit=50):
    # Rank-normalised round robin: provider counters are not comparable. Never sum
    # plays with album downloads or describe this as a global listening chart.
    found=[];seen=set();n=max((len(g) for g in groups),default=0)
    for i in range(n):
        for group in groups:
            if i>=len(group):continue
            item=group[i];key=(item['artist'].casefold().strip(),item['title'].casefold().strip())
            if key in seen:continue
            seen.add(key);found.append(dict(item,rank=len(found)+1))
            if len(found)>=limit:return found
    return found

class Providers:
    def __init__(self):self.session=None;self.archive_metadata={};self.archive_tasks={}
    async def start(self):self.session=aiohttp.ClientSession(trust_env=True,timeout=aiohttp.ClientTimeout(total=16),headers={'User-Agent':'Wakhan/0.2.40 (+https://music.kabulcafe.uk)'})
    async def close(self):
        for task in self.archive_tasks.values():task.cancel()
        if self.archive_tasks:await asyncio.gather(*self.archive_tasks.values(),return_exceptions=True)
        if self.session:await self.session.close()
    async def get(self,url,params=None):
        # All callers construct URLs from fixed API origins, never arbitrary client URLs.
        async with self.session.get(url,params=params,allow_redirects=False) as r:
            if r.status!=200:raise ValueError('provider_unavailable')
            body=bytearray()
            async for chunk in r.content.iter_chunked(65536):
                body.extend(chunk)
                if len(body)>6*1024*1024:raise ValueError('provider_size')
            return json.loads(body)
    async def archive_item(self,ident):
        now=time.monotonic();cached=self.archive_metadata.get(ident)
        if cached and now-cached[0]<600:return cached[1]
        if ident in self.archive_tasks:return await asyncio.shield(self.archive_tasks[ident])
        async def fetch():
            value=await self.get('https://archive.org/metadata/'+urllib.parse.quote(ident,safe=''));self.archive_metadata[ident]=(time.monotonic(),value)
            while len(self.archive_metadata)>1000:self.archive_metadata.pop(next(iter(self.archive_metadata)))
            return value
        task=asyncio.create_task(fetch());self.archive_tasks[ident]=task
        def done(value):
            if self.archive_tasks.get(ident) is value:self.archive_tasks.pop(ident,None)
            if not value.cancelled():value.exception()
        task.add_done_callback(done)
        return await asyncio.shield(task)
    async def audius(self,query=None):
        path='search' if query else 'trending';params={'app_name':'Wakhan','limit':'100'}
        params.update({'query':query,'sort_method':'popular'} if query else {'time':'week'})
        j=await self.get('https://api.audius.co/v1/tracks/'+path,params)
        return [t for i,x in enumerate(j.get('data') or [],1) if (t:=audius_track(x,i))]
    async def archive(self,query=None):
        q='mediatype:audio AND collection:netlabels AND licenseurl:*by* AND NOT licenseurl:*nc* AND NOT licenseurl:*nd*'
        if query:q+=' AND ('+' AND '.join('"'+re.sub(r'[^\w\s-]',' ',w)+'"' for w in query.split()[:8])+')'
        j=await self.get('https://archive.org/advancedsearch.php',{'q':q,'output':'json','rows':'35','sort[]':'downloads desc','fl[]':'identifier,downloads'})
        sem=asyncio.Semaphore(8)
        async def one(pair):
            i,x=pair
            async with sem:
                try:return archive_tracks(await self.archive_item(x['identifier']),i+1,x.get('downloads',0))[:2]
                except (ValueError,aiohttp.ClientError,TimeoutError):return []
        albums=await asyncio.gather(*(one(x) for x in enumerate(j.get('response',{}).get('docs') or [])))
        return [t for album in albums for t in album]
    async def ccmixter(self,query=None):
        params={'f':'json','tags':'remix','sort':'rank','limit':'100','lic':'by'}
        if query:params['search']=query
        return ccmixter_tracks(await self.get('https://ccmixter.org/api/query',params))
    async def catalog(self,query=None):
        names=['audius','archive','ccmixter'];values=await asyncio.gather(*(asyncio.wait_for(getattr(self,n)(query),14) for n in names),return_exceptions=True)
        groups=[v for v in values if isinstance(v,list)]
        status=[dict(id=n,available=isinstance(v,list),count=len(v) if isinstance(v,list) else 0) for n,v in zip(names,values)]
        return dict(ok=True,items=merge_rankings(groups),sources=status,updated=time.time(),ranking='provider_rank_round_robin',partial=any(not isinstance(v,list) for v in values))
    async def resolve(self,ident):
        if ident.startswith('au.') and re.fullmatch(r'au\.[A-Za-z0-9]{1,30}',ident):
            data=(await self.get('https://api.audius.co/v1/tracks/'+ident[3:],{'app_name':'Wakhan'})).get('data');data=data[0] if isinstance(data,list) and data else data
            item=audius_track(data or {})
            if item:return item
        elif ident.startswith('ia.'):
            album,name=decode_archive(ident)
            tracks=archive_tracks(await self.get('https://archive.org/metadata/'+urllib.parse.quote(album,safe='')))
            for t in tracks:
                if t['id']==ident:return t
        elif re.fullmatch(r'cc\.[0-9]{1,12}',ident):
            values=ccmixter_tracks(await self.get('https://ccmixter.org/api/query',{'f':'json','ids':ident[3:]}))
            for t in values:
                if t['id']==ident:return t
        raise ValueError('track_unavailable')
