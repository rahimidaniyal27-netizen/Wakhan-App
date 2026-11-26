"""One catalogue: direct licensed audio plus official YouTube/SoundCloud embeds."""
import asyncio,base64,collections,json,re,time,urllib.parse
from concurrent.futures import ThreadPoolExecutor
from .providers import Providers,merge_rankings,duration,https

def external_id(provider,value):
    if provider=='youtube' and re.fullmatch(r'[A-Za-z0-9_-]{11}',str(value)):return 'yt.'+value
    if provider=='soundcloud':
        u=urllib.parse.urlsplit(str(value));host=(u.hostname or '').lower()
        if u.scheme!='https' or host not in ('soundcloud.com','www.soundcloud.com') or u.username or u.password or u.port not in (None,443) or not re.fullmatch(r'/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+/?',u.path):raise ValueError('track')
        value='https://soundcloud.com'+u.path.rstrip('/')
        return 'sc.'+base64.urlsafe_b64encode(value.encode()).decode().rstrip('=')
    raise ValueError('track')

def decode_external(ident):
    if re.fullmatch(r'yt\.[A-Za-z0-9_-]{11}',ident):return 'youtube','https://www.youtube.com/watch?v='+ident[3:]
    if ident.startswith('sc.') and len(ident)<650:
        try:url=base64.urlsafe_b64decode(ident[3:]+'='*(-len(ident[3:])%4)).decode()
        except Exception:raise ValueError('track')
        if external_id('soundcloud',url)==ident:return 'soundcloud',url
    raise ValueError('track')

def external_track(provider,x):
    try:
        ident=external_id(provider,str(x.get('id') or '') if provider=='youtube' else x.get('url'))
        source=decode_external(ident)[1];cover=x.get('thumb') or x.get('cover') or ''
        if provider=='youtube' and not https(cover):cover='https://i.ytimg.com/vi/'+ident[3:]+'/hqdefault.jpg'
        if not https(cover):return None
        artist=str(x.get('ch') or x.get('artist') or x.get('uploader') or provider)[:150]
        return dict(id=ident,provider=provider,title=str(x.get('title') or '')[:200],artist=artist,cover=cover,duration=duration(x.get('duration') or x.get('dur')),source_url=source,stream=source,embed=True,license='online-playback',attribution=artist+' · '+provider,downloadable=False,persistent=False,metric='search_relevance')
    except (ValueError,TypeError):return None

class Discovery(Providers):
    def __init__(self,namespace):
        super().__init__();self.n=namespace;self.cache=collections.OrderedDict();self.pending={};self.search_limit=asyncio.Semaphore(3);self.tracks=collections.OrderedDict();self.executor=ThreadPoolExecutor(max_workers=3,thread_name_prefix="wkm-metadata")
    def remember(self,items):
        now=time.monotonic()
        for t in items:self.tracks[t['id']]=(now,t);self.tracks.move_to_end(t['id'])
        while len(self.tracks)>2000:self.tracks.popitem(last=False)
        return items
    async def shared(self,key,work,ttl=180):
        old=self.cache.get(key);now=time.monotonic()
        if old and now-old[0]<ttl:return old[1]
        if key in self.pending:return await asyncio.shield(self.pending[key])
        if len(self.pending)>=64:raise ValueError('busy')
        async def run():
            try:
                value=await work();self.cache[key]=(time.monotonic(),value);self.cache.move_to_end(key)
                while len(self.cache)>100:self.cache.popitem(last=False)
                return value
            finally:self.pending.pop(key,None)
        task=asyncio.create_task(run());self.pending[key]=task
        task.add_done_callback(lambda t:None if t.cancelled() else t.exception())
        return await asyncio.shield(task)
    async def external(self,provider,query):
        async def work():
            flat=self.n.get('_flat')
            if not callable(flat):raise ValueError('provider_unavailable')
            # Only canonical provider links or plain search text reach metadata extraction.
            if query.startswith(('https://','http://')):
                if provider=='soundcloud':target=decode_external(external_id(provider,query))[1]
                else:
                    u=urllib.parse.urlsplit(query)
                    if u.scheme!='https' or u.hostname not in ('youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be') or u.username or u.password or u.port not in (None,443):raise ValueError('url')
                    ident=u.path.strip('/') if u.hostname=='youtu.be' else urllib.parse.parse_qs(u.query).get('v',[''])[0]
                    if not ident:
                        m=re.fullmatch(r'/(?:shorts|embed|live)/([A-Za-z0-9_-]{11})/?',u.path);ident=m[1]if m else ''
                    target=decode_external(external_id(provider,ident))[1]
            else:target=('ytsearch15:'if provider=='youtube'else 'scsearch15:')+query
            async with self.search_limit:values=await asyncio.wait_for(asyncio.get_running_loop().run_in_executor(self.executor,flat,target,15),16)
            return self.remember([t for x in values if (t:=external_track(provider,x))])
        return await self.shared((provider,query.casefold()),work,240)
    async def catalog(self,query=None):
        async def work():
            if not query:
                value=await super(Discovery,self).catalog();self.remember(value['items']);return value
            values=await asyncio.gather(asyncio.wait_for(super(Discovery,self).catalog(query),16),self.external('youtube',query),self.external('soundcloud',query),return_exceptions=True)
            groups=[values[0].get('items',[]) if isinstance(values[0],dict) else []]+[v if isinstance(v,list)else []for v in values[1:]]
            items=merge_rankings(groups);self.remember(items)
            return dict(ok=True,items=items,updated=time.time(),ranking='unified_search',partial=any(isinstance(v,Exception)for v in values))
        return await self.shared(('catalog',query.casefold()if query else ''),work,30 if not query else 180)
    async def resolve(self,ident):
        old=self.tracks.get(ident)
        if ident.startswith(('yt.','sc.')):
            provider,url=decode_external(ident)
            if old and time.monotonic()-old[0]<21600:return old[1]
            values=await self.external(provider,url)
            for t in values:
                if t['id']==ident:return t
            raise ValueError('track_unavailable')
        return await super().resolve(ident)
    async def close(self):
        for task in list(self.pending.values()):task.cancel()
        if self.pending:await asyncio.gather(*list(self.pending.values()),return_exceptions=True)
        self.executor.shutdown(wait=False,cancel_futures=True)
        await super().close()
