"""Private, range-aware audio relay. Sends the first bytes without a full-file conversion.

Only server-resolved audio CDN resources are accepted. Login, account status and
existing personal-music entitlement are rechecked for every media/key/segment request.
"""
import asyncio
import collections
import hashlib
import re
import time
from urllib.parse import urljoin, urlsplit

import aiohttp
from aiohttp import web

from .audio_resolver import AudioResolver, AudioUnavailable, allowed_audio_url, audio_headers
from .discovery import decode_external

KEY = re.compile(r'^[a-f0-9]{32}$')
FILE = re.compile(r'^(audio\.(?:m4a|mp3)|index\.m3u8|segment\.(?:ts|m4s|mp4|bin))$')
RANGE = re.compile(r'^bytes=(?:[0-9]{1,12}-[0-9]{0,12}|-[0-9]{1,12})$')
URI = re.compile(r'URI="([^"\r\n]+)"')
PRIVATE = {'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Accel-Buffering':'no'}


class Playback:
    def __init__(self, namespace, resolver=None, allowed=allowed_audio_url, resource_limit=4096):
        self.n = namespace
        self.resolver = resolver or AudioResolver(namespace)
        self.allowed = allowed
        self.resources = collections.OrderedDict()
        self.resource_limit=resource_limit;self.last_seen={}
        self.active = collections.Counter()
        self.sessions = {}
        self.proxy_active=collections.Counter()
        self.pool = asyncio.Semaphore(64)

    def http(self,proxy=None):
        session=self.sessions.get(proxy)
        if session is None or session.closed:
            if proxy not in self.sessions and len(self.sessions)>=4:
                old=next((k for k in self.sessions if not self.proxy_active[k]),None)
                if old is None and None not in self.sessions:raise AudioUnavailable('source_busy',429)
                if self.proxy_active[old]:raise AudioUnavailable('source_busy',429)
                asyncio.create_task(self.sessions.pop(old).close())
            if proxy and str(proxy).lower().startswith(('socks4://','socks4a://','socks5://','socks5h://')):
                try:
                    from aiohttp_socks import ProxyConnector
                    normalized=proxy.replace('socks5h://','socks5://',1).replace('socks4a://','socks4://',1)
                    connector=ProxyConnector.from_url(normalized,limit=64,limit_per_host=16,rdns=True)
                except (ImportError,ValueError):raise AudioUnavailable('audio_network_config',503)from None
            elif proxy and urlsplit(proxy).scheme not in ('http','https'):
                raise AudioUnavailable('audio_network_config',503)
            else:connector=aiohttp.TCPConnector(limit=64,limit_per_host=16,ttl_dns_cache=300)
            session=aiohttp.ClientSession(trust_env=False,auto_decompress=False,cookie_jar=aiohttp.DummyCookieJar(),
                        timeout=aiohttp.ClientTimeout(total=None,connect=4,sock_read=12),connector=connector)
            self.sessions[proxy]=session
        return session

    async def account(self, uid):
        if type(uid) is not int or uid <= 0:
            raise web.HTTPForbidden()
        row = self.n['DB'].execute('SELECT done,blocked FROM wka_accounts WHERE uid=?', (uid,)).fetchone()
        if not row or not row[0] or row[1]:
            raise web.HTTPForbidden()
        personal = self.n.get('WM_PERSONAL')
        if not personal or not (await personal.entitlement(uid))['allowed']:
            raise AudioUnavailable('subscription_required', 403)
        return personal

    def put(self, url, provider, headers, *, root=None, kind='file', ext='m4a', duration=0, proxy=None):
        if not self.allowed(url, provider):
            raise AudioUnavailable()
        key = hashlib.sha256((provider + '|' + (root or '') + '|' + url).encode()).hexdigest()[:32]
        now = time.monotonic()
        value = {'key': key, 'root': root or key, 'url': url, 'provider': provider, 'headers': audio_headers(headers),
                 'kind': kind, 'ext': ext, 'duration': duration, 'proxy':proxy, 'expires': now + max(900, min(25200, duration + 900))}
        # Reclaim whole idle tracks. Evicting individual live HLS segments would
        # break a playlist which has already been handed to a player.
        if key not in self.resources and len(self.resources)>=self.resource_limit:
            idle=next((k for k,t in self.last_seen.items()if now-t>60 and k!=value['root']),None)
            if idle is None:raise AudioUnavailable('source_busy',429)
            for old in [k for k,v in self.resources.items()if v['root']==idle]:self.resources.pop(old,None)
            self.last_seen.pop(idle,None)
        self.resources[key] = value
        self.resources.move_to_end(key)
        self.last_seen[value['root']]=now
        return value

    @staticmethod
    def path(resource, token):
        name = 'index.m3u8' if resource['kind'] == 'hls' else 'audio.' + resource['ext'] if resource['ext'] in ('mp3', 'm4a') else 'segment.' + resource['ext']
        from urllib.parse import quote
        return '/api/app/music/play/' + resource['key'] + '/' + name + '?lease=' + quote(token, safe='')

    async def start(self, req):
        uid = int(req['u']['id'])
        await self.account(uid)
        ident = str(req.query.get('id') or '')
        provider, canonical = decode_external(ident)
        task=asyncio.create_task(self.resolver.get(canonical,provider))
        try:
            while not task.done():
                transport=getattr(req,'transport',None)
                if transport is not None and transport.is_closing():raise asyncio.CancelledError()
                await asyncio.wait({task},timeout=0.1)
            audio=await task
        finally:
            if not task.done():
                task.cancel()
                await asyncio.gather(task,return_exceptions=True)
        personal = await self.account(uid)  # permissions may have changed during extraction
        value = self.put(audio['url'], provider, audio.get('headers', {}), kind=audio['kind'],
                         ext=audio['ext'], duration=audio['duration'],proxy=audio.get('proxy'))
        token = personal.media_lease(uid, 'wkmplay_' + value['root'])
        return {'ok': True, 'playback': 'audio', 'src': self.path(value, token), 'dur': audio['duration'], 'provider': provider}

    async def resource(self, req):
        key, name = req.match_info['key'], req.match_info['file']
        if not KEY.fullmatch(key) or not FILE.fullmatch(name):
            raise web.HTTPNotFound()
        token = str(req.query.get('lease') or '')
        personal = self.n.get('WM_PERSONAL')
        if not personal or not token or len(token) > 4096:
            raise web.HTTPForbidden()
        try:
            lease = personal.verify(token, 'media')
            uid = lease.get('uid')
            personal = await self.account(uid)
        except (ValueError, KeyError, TypeError, AudioUnavailable):
            raise web.HTTPForbidden() from None
        value = self.resources.get(key)
        if value is None or value['expires'] < time.monotonic():
            raise web.HTTPNotFound()
        if lease.get('file') != 'wkmplay_' + value['root']:
            raise web.HTTPForbidden()
        self.resources.move_to_end(key)
        self.last_seen[value['root']]=time.monotonic()
        return uid, value, token

    async def upstream(self, value, range_header=None, head=False):
        url = value['url']
        headers = dict(value['headers'], **{'Accept-Encoding': 'identity'})
        if range_header:
            if not RANGE.fullmatch(range_header):
                raise web.HTTPRequestRangeNotSatisfiable()
            parts = range_header[6:].split('-')
            if parts[0] and parts[1] and int(parts[0]) > int(parts[1]):
                raise web.HTTPRequestRangeNotSatisfiable()
            if not parts[0] and int(parts[1]) <= 0:
                raise web.HTTPRequestRangeNotSatisfiable()
            headers['Range'] = range_header
        for _ in range(4):
            if not self.allowed(url, value['provider']):
                raise AudioUnavailable()
            proxy=value.get('proxy');http_proxy=proxy if proxy and urlsplit(proxy).scheme in ('http','https')else None
            response = await asyncio.wait_for(self.http(proxy).request('HEAD' if head else 'GET',url, headers=headers, allow_redirects=False,proxy=http_proxy), 8)
            if response.status in (301, 302, 303, 307, 308):
                location = response.headers.get('Location')
                response.close()
                if not location: raise AudioUnavailable()
                url = urljoin(url, location)
                continue
            if response.status not in (200, 206):
                status = response.status
                response.close()
                if status == 416: raise web.HTTPRequestRangeNotSatisfiable()
                raise AudioUnavailable()
            if response.headers.get('Content-Encoding', 'identity').lower() != 'identity':
                response.close()
                raise AudioUnavailable()
            return response, url
        raise AudioUnavailable()

    async def playlist(self, value, response, url, token):
        body = bytearray()
        async for chunk in response.content.iter_chunked(32768):
            body.extend(chunk)
            if len(body) > 1048576: raise AudioUnavailable()
        try: original = body.decode('utf-8-sig')
        except UnicodeError: raise AudioUnavailable() from None
        if not original.startswith('#EXTM3U') or len(original.splitlines()) > 5000:
            raise AudioUnavailable()
        if re.search(r'CODECS="[^"\n]*(?:avc1|hev1|hvc1|vp09|av01)', original, re.I):
            raise AudioUnavailable()
        # Every URI, including encryption keys and init segments, keeps the same
        # account lease and root scope. Never send a raw upstream URL to the player.
        def route(raw, kind=None):
            target = urljoin(url, raw)
            ext = urlsplit(target).path.lower()
            hls = kind == 'hls' or ext.endswith('.m3u8')
            suffix = 'm3u8' if hls else 'mp4' if ext.endswith('.mp4') else 'm4s' if ext.endswith('.m4s') else 'ts' if ext.endswith('.ts') else 'bin'
            child = self.put(target, value['provider'], value['headers'], root=value['root'],
                             kind='hls' if hls else 'segment', ext=suffix, duration=value['duration'],proxy=value.get('proxy'))
            return self.path(child, token)
        lines, variant = [], False
        for line in original.splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith('#'):
                line = route(stripped, 'hls' if variant else None)
                variant = False
            elif stripped.startswith('#'):
                if 'URI=' in stripped and not URI.search(stripped):
                    raise AudioUnavailable()
                line = URI.sub(lambda m: 'URI="' + route(m.group(1)) + '"', line)
                if stripped.startswith('#EXT-X-STREAM-INF:'): variant = True
            lines.append(line)
        return web.Response(text='\n'.join(lines) + '\n', content_type='application/vnd.apple.mpegurl', headers=PRIVATE)

    async def stream(self, req):
        response = None
        uid = None
        acquired = False
        try:
            uid, value, token = await self.resource(req)
            if self.active[uid] >= 4:
                raise web.HTTPTooManyRequests()
            self.active[uid] += 1
            self.proxy_active[value.get('proxy')]+=1
            try:
                await asyncio.wait_for(self.pool.acquire(), 1)
                acquired = True
                response, url = await self.upstream(value, None if value['kind']=='hls'else req.headers.get('Range'), head=req.method=='HEAD' and value['kind']!='hls')
                if value['kind'] == 'hls':
                    return await self.playlist(value, response, url, token)
                ctype = response.headers.get('Content-Type', 'application/octet-stream').split(';')[0].lower()
                if ctype not in ('audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/x-m4a', 'application/octet-stream',
                                 'video/mp2t', 'video/iso.segment', 'video/mp4', 'binary/octet-stream'):
                    raise AudioUnavailable()
                if response.content_length is not None and response.content_length > 1073741824:
                    raise AudioUnavailable()
                headers = dict(PRIVATE, **{'Content-Type': ctype})
                for name in ('Content-Length', 'Content-Range', 'Accept-Ranges'):
                    if name in response.headers: headers[name] = response.headers[name]
                if req.method=='HEAD':return web.Response(status=response.status,headers=headers)
                # Wait for real payload before committing a successful response.
                first = await response.content.read(16384)
                if not first: raise AudioUnavailable()
                downstream = web.StreamResponse(status=response.status, headers=headers)
                await downstream.prepare(req)
                await asyncio.wait_for(downstream.write(first), 15)
                total = len(first)
                async for chunk in response.content.iter_chunked(32768):
                    total += len(chunk)
                    if total > 1073741824: raise ConnectionError('audio_size')
                    await asyncio.wait_for(downstream.write(chunk), 15)
                await downstream.write_eof()
                return downstream
            finally:
                proxy=value.get('proxy');self.proxy_active[proxy]-=1
                if not self.proxy_active[proxy]:self.proxy_active.pop(proxy,None)
                self.active[uid] -= 1
                if not self.active[uid]: self.active.pop(uid, None)
        except web.HTTPException as error:
            error.headers.update(PRIVATE);raise
        except (AudioUnavailable, aiohttp.ClientError, asyncio.TimeoutError, ConnectionError):
            if 'downstream' in locals() and downstream.prepared:
                req.transport.close() if req.transport else None
                return downstream
            raise web.HTTPBadGateway(headers=PRIVATE) from None
        finally:
            if response is not None: response.close()
            if acquired: self.pool.release()

    async def close(self):
        await self.resolver.close()
        for session in self.sessions.values():await session.close()
        self.sessions.clear()
        self.resources.clear();self.last_seen.clear()
