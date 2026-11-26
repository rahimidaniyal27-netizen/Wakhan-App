import asyncio,collections,json,time,re
from pathlib import Path
from .discovery import Discovery
from .preferences import Preferences
from .playback import Playback
from .audio_resolver import AudioUnavailable

def install(app,namespace):
    from aiohttp import web
    p=Discovery(namespace);preferences=Preferences(namespace['DB']);rates=collections.OrderedDict();playback=Playback(namespace)
    def limited(uid):
        now=time.monotonic();q=rates.setdefault(uid,collections.deque())
        while q and q[0]<now-60:q.popleft()
        if len(q)>=45:return True
        q.append(now);rates.move_to_end(uid)
        while len(rates)>5000:rates.popitem(last=False)
        return False
    def add(path,handler,method='GET'):
        async def route(req):
            if limited(int(req['u']['id'])):return namespace['J'](dict(ok=False,err='slow'),429)
            try:
                value=await handler(req);response=namespace['J'](value);response.headers['Cache-Control']='no-store';return response
            except web.HTTPException:raise
            except AudioUnavailable as exc:return namespace['J'](dict(ok=False,err=exc.code),exc.status)
            except (ValueError,TypeError,json.JSONDecodeError):return namespace['J'](dict(ok=False,err='track_unavailable'),400)
            except Exception as exc:
                if isinstance(exc,asyncio.CancelledError):raise
                return namespace['J'](dict(ok=False,err='music_unavailable'),503)
        app.router.add_route(method,'/api/app/music'+path,namespace['auth'](route))
    async def chart(req):return await p.catalog()
    async def search(req):
        q=str(req.query.get('q','')).strip()
        if not 1<=len(q)<=120:raise ValueError('query')
        return await p.catalog(q)
    async def resolve(req):
        ident=str(req.query.get('id',''))
        if len(ident)>1200:raise ValueError('track')
        return dict(ok=True,item=await p.resolve(ident))
    async def recommendations(req):
        uid=int(req['u']['id']);language=str(req['u'].get('language_code') or 'fa')[:2]
        value=await p.catalog(preferences.query(uid,language))
        return dict(ok=True,items=preferences.rank(uid,value['items']),personalized=bool(preferences.profile(uid)),updated=value['updated'],partial=value.get('partial',False))
    async def listen(req):
        body=await req.json();ident=str(body.get('id',''))
        if len(ident)>1200:raise ValueError('track')
        item=await p.resolve(ident);recorded=preferences.listen(int(req['u']['id']),item,body.get('seconds',0))
        return dict(ok=True,recorded=recorded)
    add('/recommendations',recommendations);add('/listen',listen,'POST')
    add('/chart',chart);add('/search',search);add('/resolve',resolve)
    add('/audio-start',playback.start)
    app.router.add_get('/api/app/music/play/{key}/{file}',playback.stream)
    namespace['WKM_PLAYBACK']=playback
    async def media(req):
        # Native players cannot carry X-Init. Reuse the existing signed,
        # account-bound media lease and entitlement; never accept an input URL.
        filename=req.match_info['file'];token=str(req.query.get('lease',''))
        if not re.fullmatch(r'[A-Za-z0-9_-][A-Za-z0-9_.-]{0,239}',filename) or not filename.lower().endswith(('.mp3','.m4a','.aac','.ogg','.opus','.wav','.flac','.webm')):raise web.HTTPNotFound()
        personal=namespace.get('WM_PERSONAL')
        if not personal or not token or len(token)>4096:raise web.HTTPForbidden()
        try:
            lease=personal.verify(token,'media');uid=lease.get('uid')
            if type(uid)is not int or lease.get('file')!=filename:raise ValueError('lease')
            account=namespace['DB'].execute('SELECT done,blocked FROM wka_accounts WHERE uid=?',(uid,)).fetchone()
            if not account or not account[0] or account[1] or not (await personal.entitlement(uid))['allowed']:raise ValueError('account')
        except (ValueError,KeyError,TypeError):raise web.HTTPForbidden()
        cache=Path(namespace['CACHE']).resolve();target=cache/filename
        if target.is_symlink() or target.resolve().parent!=cache or not target.is_file():raise web.HTTPNotFound()
        return web.FileResponse(target,headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'})
    app.router.add_get('/api/app/music/media/{file}',media)
    async def start(app):await p.start()
    async def close(app):
        await playback.close()
        await p.close()
    app.on_startup.append(start);app.on_cleanup.append(close)
    namespace['WKM_MUSIC']=p
