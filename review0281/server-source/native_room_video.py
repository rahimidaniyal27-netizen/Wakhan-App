"""Room-scoped native MP4 playback with leased, range-aware server streaming."""
import asyncio
import ast
import time
from urllib.parse import urlencode,urlsplit,urljoin
import re
import aiohttp
from aiohttp import web


def muxed_resolver(source):
    tree=ast.parse(source)
    formats=[node for node in tree.body if isinstance(node,ast.Assign) and any(isinstance(target,ast.Name) and target.id=='FORMAT' for target in node.targets)]
    if len(formats)!=1 or 'MEDIA_WORKER_SECONDS' not in source:raise RuntimeError('REVIEWED_VIDEO_RESOLVER_REQUIRED')
    formats[0].value=ast.Constant('best[height<=720][vcodec^=avc1][acodec^=mp4a]')
    function=next(node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name=='resolve')
    updates=[node for node in ast.walk(function) if isinstance(node,ast.Expr) and isinstance(node.value,ast.Call) and isinstance(node.value.func,ast.Attribute) and isinstance(node.value.func.value,ast.Name) and node.value.func.value.id=='track' and node.value.func.attr=='update']
    if len(updates)!=1:raise RuntimeError('VIDEO_TRACK_SHAPE_CHANGED')
    class Metadata(ast.NodeTransformer):
        def visit_Expr(self,node):
            if node is updates[0]:return [node,*ast.parse("track['_v_height']=int(video.get('height') or 0)").body]
            return self.generic_visit(node)
    Metadata().visit(function)
    ast.fix_missing_locations(tree);return ast.unparse(tree)+'\n'


class RoomVideo:
    def __init__(self,namespace):
        from wakhan_room_video_resolver import ReadableVideo
        self.n=namespace;self.resolver=ReadableVideo(namespace);self.active={};self.metadata={};self.session=None
        view=namespace['cview']
        def room_view(state,uid):
            value=view(state,uid);vid=state.get('vid','');code=str(state.get('cid',''))[2:]
            if re.fullmatch(r'[A-Za-z0-9_-]{11}',str(vid)) and not state.get('media') and state.get('provider','youtube')=='youtube':
                token=self.n['WM_PERSONAL'].sign({'purpose':'room_video','uid':int(uid),'room':code,'vid':vid,'expires':int(time.time()//3600)*3600+8*3600})
                url='/api/app/rooms/'+code+'/video?'+urlencode({'vid':vid,'lease':token})
                value['media']={'kind':'native','provider':'youtube','title':value.get('title',''),'formats':[{'height':self.metadata.get(vid,{}).get('height',0),'url':url}]}
            return value
        namespace['cview']=room_view

    @staticmethod
    def allowed_source(url):
        try:
            parsed=urlsplit(url);host=(parsed.hostname or '').lower()
            return parsed.scheme=='https' and not parsed.username and not parsed.password and parsed.port in (None,443) and (host=='googlevideo.com' or host.endswith('.googlevideo.com'))
        except (TypeError,ValueError):return False

    def authorize(self,req):
        try:value=self.n['WM_PERSONAL'].verify(req.query.get('lease'),'room_video')
        except ValueError:raise web.HTTPForbidden()
        code=req.match_info['code'];vid=req.query.get('vid','');uid=value.get('uid')
        if type(uid) is not int or value.get('room')!=code or value.get('vid')!=vid or not re.fullmatch(r'[A-Za-z0-9_-]{11}',vid):raise web.HTTPForbidden()
        state=self.n['CIN'].get('r:'+code)
        account=self.n['DB'].execute('SELECT done,blocked FROM wka_accounts WHERE uid=?',(uid,)).fetchone()
        present=bool(state and (any(person and int(person['id'])==uid for person in state['seats']) or time.time()-state.get('seen',{}).get(uid,0)<90))
        if not account or not account[0] or account[1] or not state or state.get('vid')!=vid or not self.n['room_ok'](code) or not present or self.n['WM_HALL51'].allowed(code,uid,'enter'):raise web.HTTPForbidden()
        return uid,vid

    async def source(self,vid,music=False):
        if music:
            # A song does not need the cinema's video-format probe. Reuse the
            # same bounded audio resolver/cache used by personal music while
            # retaining the salon's own membership-scoped lease and endpoint.
            playback=self.n.get('WKM_PLAYBACK')
            if playback is None:raise ValueError('room_audio_not_configured')
            audio=await playback.resolver.get('https://www.youtube.com/watch?v='+vid,'youtube')
            if audio.get('kind')=='file':
                if not self.allowed_source(audio.get('url')):raise ValueError('audio_source')
                self.metadata[vid]={'height':0}
                if len(self.metadata)>128:self.metadata.pop(next(iter(self.metadata)))
                return {'path':audio['url'],'_v_headers':audio.get('headers',{}),
                        '_v_proxy':audio.get('proxy'),'_v_audio_only':True}
            # Do not hand an upstream playlist with unscoped keys/segments to
            # a phone. The existing muxed-video route remains the HLS fallback.
            if audio.get('kind')!='hls':raise ValueError('room_audio_format')
        track=await asyncio.wait_for(asyncio.to_thread(self.resolver.extract,'https://www.youtube.com/watch?v='+vid),80)
        if track.get('_v_audio_path') or not self.allowed_source(track.get('path')):raise ValueError('muxed_video_required')
        self.metadata[vid]={'height':int(track.get('_v_height') or 0)}
        if len(self.metadata)>128:self.metadata.pop(next(iter(self.metadata)))
        return track

    async def upstream(self,track,range_value):
        audio=bool(track.get('_v_audio_only'))
        if audio:
            session=self.n['WKM_PLAYBACK'].http(track.get('_v_proxy'))
        else:
            if self.session is None:self.session=aiohttp.ClientSession(auto_decompress=False,timeout=aiohttp.ClientTimeout(total=None,sock_connect=10,sock_read=25))
            session=self.session
        headers={key:value for key,value in (track.get('_v_headers') or {}).items() if key.lower() not in ('host','range','accept-encoding','content-length','connection')}
        headers['Accept-Encoding']='identity'
        if range_value:headers['Range']=range_value
        url=track['path']
        for _ in range(3):
            if not self.allowed_source(url):raise ValueError('video_source')
            proxy=track.get('_v_proxy') if audio else None
            http_proxy=proxy if proxy and urlsplit(proxy).scheme in ('http','https') else None
            response=await session.get(url,headers=headers,allow_redirects=False,**({'proxy':http_proxy} if audio else {}))
            if audio and response.headers.get('Content-Encoding','identity').lower()!='identity':
                response.close();raise ValueError('audio_encoding')
            if response.status not in (301,302,303,307,308):return response
            url=urljoin(url,response.headers.get('Location',''));response.close()
        raise ValueError('video_redirect')

    async def stream(self,req):
        uid,vid=self.authorize(req);range_value=req.headers.get('Range','')
        if range_value and not re.fullmatch(r'bytes=(?:[0-9]{1,12}-[0-9]{0,12}|-[0-9]{1,12})',range_value):raise web.HTTPRequestRangeNotSatisfiable()
        if self.active.get(uid,0)>=4 or sum(self.active.values())>=48:raise web.HTTPServiceUnavailable(headers={'Retry-After':'2'})
        self.active[uid]=self.active.get(uid,0)+1;response=None;downstream=None;network=None;proxy=None
        try:
            state=self.n['CIN'].get('r:'+req.match_info['code']) or {}
            track=await self.source(vid,music=bool(state.get('wkm_music')))
            # A stop, kick or visibility-rule change during preparation revokes the lease.
            self.authorize(req)
            if track.get('_v_audio_only'):
                network=self.n['WKM_PLAYBACK'];proxy=track.get('_v_proxy');network.proxy_active[proxy]+=1
            response=await self.upstream(track,range_value)
            if response.status not in (200,206,416):raise web.HTTPBadGateway()
            types=('audio/mp4','audio/mpeg','audio/aac','audio/x-m4a','application/octet-stream') if track.get('_v_audio_only') else ('video/mp4','application/octet-stream')
            if response.status!=416 and response.headers.get('Content-Type','application/octet-stream').split(';')[0] not in types:raise web.HTTPBadGateway()
            headers={key:value for key,value in response.headers.items() if key.lower() in ('content-type','content-length','content-range','accept-ranges','etag','last-modified')}
            headers.update({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'})
            downstream=web.StreamResponse(status=response.status,headers=headers);await downstream.prepare(req)
            if req.method!='HEAD':
                transferred=0
                async for chunk in response.content.iter_chunked(65536):
                    transferred+=len(chunk)
                    if transferred>2_000_000_000:break
                    await downstream.write(chunk)
            await downstream.write_eof();return downstream
        except web.HTTPException:raise
        except asyncio.CancelledError:raise
        except ConnectionError:
            if isinstance(downstream,web.StreamResponse):return downstream
            raise
        except Exception:
            self.n['log'].warning('ROOM_VIDEO source_unavailable=1')
            if downstream is not None:return downstream
            raise web.HTTPBadGateway() from None
        finally:
            if response:response.close()
            if network is not None:
                network.proxy_active[proxy]-=1
                if not network.proxy_active[proxy]:network.proxy_active.pop(proxy,None)
            self.active[uid]=max(0,self.active.get(uid,1)-1)
            if not self.active[uid]:self.active.pop(uid,None)

    async def close(self):
        if self.session is not None:await self.session.close()

    def routes(self,app):
        for method in ('GET','HEAD'):app.router.add_route(method,'/api/app/rooms/{code}/video',self.stream)


def install(app,namespace):
    value=RoomVideo(namespace);value.routes(app);namespace['WM_ROOM_VIDEO']=value;return value
