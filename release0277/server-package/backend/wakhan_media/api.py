"""HTTP + WebSocket side of the media engine (aiohttp).

  GET  /api/media/search?q=&src=all|up|yt      search (uploads + YouTube Data API)
  GET  /api/media/mine                          my uploads
  POST /api/media/upload                        multipart: file, title, artist, rights=1, code (video: a salon I control)
  POST /api/media/remove   {ref}                remove my upload (and its HLS files)
  POST /api/media/report   {src,ref,why}        report a track
  POST /api/media/play     {code,src,ref}       play for the salon (relay) / answer {embed} for YouTube
  POST /api/media/ctl      {code,a,pos}         play | pause | seek | stop
  GET  /api/media/state?code=                   salon media state (+ my signed URL)
  POST /api/media/ticket   {code}               a 2-minute ticket for the salon socket
  GET  /api/media/ws?code=&tk=                  salon WebSocket (sync, clock, controls)
  GET  /api/media/clock                         server time (ms)
  GET  /api/media/health                        load, jobs, disk
  GET  /media/hls/{tk}/{asset}/{file}           HLS files (signed)
"""
import asyncio
import json
import os
import re
import shutil
import tempfile
import time

from aiohttp import ClientSession, ClientTimeout, TCPConnector, web

from .adapters import VIDEO_EXT, AUDIO_EXT, AdapterError, Item, Policy, Registry, UploadAdapter, YouTubeAdapter
from .delivery import Budget, Meter, Signer
from .engine import Engine, RightsError, probe
from .sync import Sync, now_ms

HLS_FILE = re.compile(r'^(master\.m3u8|[a-z0-9]{2,8}/(index\.m3u8|init(_\d+)?\.mp4|s\d{5}\.m4s))$')
ASSET = re.compile(r'^[0-9a-f]{20}$')
CODE = re.compile(r'^[A-Z0-9]{4,8}$')
HLS_TTL = 6 * 3600
WS_TTL = 120
PRIVATE_HLS = {'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer'}


class Err(Exception):
    def __init__(self, code, status=400):
        super().__init__(code)
        self.code, self.status = code, status


def J(d, status=200):
    return web.json_response(d, status=status, headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}, dumps=lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ':')))


class Media:
    def __init__(self, db, settings, auth, access, log=None):
        """auth(fn) -> aiohttp handler that sets req['u'] (the app's own login check)
        access: object with can_view(code, uid), can_control(code, uid), close_screen(code, uid) (may be missing)"""
        self.db, self.st, self.auth, self.access, self.log = db, settings, auth, access, log
        self.signer = Signer(settings.get('sign_key'))
        self.meter = Meter()
        self.budget = Budget(settings, self.meter)
        self.engine = Engine(db, settings, log)
        self.reg = Registry()
        self.up = self.reg.add(UploadAdapter(db, settings))
        self.yt = self.reg.add(YouTubeAdapter(settings, self.http))
        self.sync = Sync(self.can_control, self.url_for, on_load=self.on_load, on_change=self.on_change, can_view=self.can_view, url_for_room=self.url_for)
        self.rate = {}
        self._http = None
        self._bg = None
        self._upload_users = set()
        self._upload_pending = 0

    def init(self):
        self.engine.init()
        self.up.init()
        with self.db:
            self.db.execute('CREATE TABLE IF NOT EXISTS wkm_reports(src TEXT NOT NULL, ref TEXT NOT NULL, uid INTEGER NOT NULL, why TEXT NOT NULL, ts INTEGER NOT NULL)')

    # ------------------------------------------------------------------------------------------ helpers
    def http(self):
        if self._http is None or self._http.closed:
            self._http = ClientSession(timeout=ClientTimeout(total=15,connect=4,sock_read=12), connector=TCPConnector(limit=32,limit_per_host=8,ttl_dns_cache=300))
        return self._http

    def background(self):
        if self._bg is None or self._bg.done():
            self._bg = asyncio.ensure_future(self._loop())

    async def _loop(self):
        while True:
            await asyncio.sleep(300)
            try:
                self.sync.sweep()
                await self.engine.evict()
            except Exception as e:
                if self.log:
                    self.log.warning('wakhan_media sweep: %s', e)

    def can_view(self, code, uid):
        try:
            return bool(self.access.can_view(code, int(uid)))
        except Exception:
            return False

    def can_control(self, code, uid):
        try:
            return bool(self.access.can_control(code, int(uid)))
        except Exception:
            return False

    def on_load(self, code, uid):
        close = getattr(self.access, 'close_screen', None)
        if close:
            close(code, uid)

    def on_change(self, room):
        self.engine.active = {r.asset for r in self.sync.rooms.values() if r.asset}

    def url_for(self, aid, uid, code=None):
        if not aid:
            return ''
        scope=code+'|'+aid if code else aid
        token=self.signer.sign('hls',scope,uid,HLS_TTL)
        if code:token=code+'.'+token
        return '/media/hls/%s/%s/master.m3u8' % (token,aid)

    def slow(self, uid, key, n, sec):
        t = time.time()
        q = [x for x in self.rate.get((uid, key), []) if x > t - sec]
        if len(q) >= n:
            raise Err('slow_down', 429)
        q.append(t)
        self.rate[(uid, key)] = q
        if len(self.rate) > 20000:
            self.rate.clear()

    def code(self, v):
        c = re.sub(r'[^A-Z0-9]', '', str(v or '').upper())[:8]
        if not CODE.match(c):
            raise Err('bad_code')
        return c

    def h(self, fn):
        async def run(req):
            self.background()
            try:
                return J(await fn(req, int(req['u']['id'])))
            except (Err, AdapterError) as e:
                return J({'ok': False, 'err': e.code}, e.status)
            except PermissionError:
                return J({'ok': False, 'err': 'host'}, 403)
            except LookupError as e:
                return J({'ok': False, 'err': str(e) or 'not_found'}, 404)
            except (ValueError, TypeError, KeyError):
                return J({'ok': False, 'err': 'bad_input'}, 400)
        run.__name__ = fn.__name__
        return self.auth(run)

    async def body(self, req):
        try:
            b = await req.json()
        except Exception:
            raise Err('bad_body')
        if not isinstance(b, dict):
            raise Err('bad_body')
        return b

    # ------------------------------------------------------------------------------------------ search
    async def api_search(self, req, uid):
        q = str(req.query.get('q') or '').strip()[:100]
        if not q:
            return {'ok': True, 'items': []}
        self.slow(uid, 'search', 60, 60)
        src = req.query.get('src') or 'all'
        names = ['up', 'yt'] if src == 'all' else [src]
        items, errs = await self.reg.search(q, names, 15, uid)
        return {'ok': True, 'items': [i.public() for i in items], 'errors': errs}

    async def api_mine(self, req, uid):
        return {'ok': True, 'items': [i.public() for i in await self.up.mine(uid)]}

    # ------------------------------------------------------------------------------------------ upload
    async def api_upload(self, req, uid):
        self.slow(uid, 'upload', 5, 60)
        if uid in self._upload_users or len(self._upload_users) >= 4:
            raise Err('upload_busy', 429)
        self._upload_users.add(uid)
        try:
            return await asyncio.wait_for(self._receive_upload(req, uid), 600)
        except asyncio.TimeoutError:
            raise Err('upload_timeout', 408)
        finally:
            self._upload_users.discard(uid)

    def _upload_budget(self, more=0):
        stored = self.db.execute('SELECT COALESCE(SUM(bytes),0) FROM wkm_uploads WHERE removed=0').fetchone()[0]
        cap = int(self.st.num('upload_store_gb') * (1 << 30))
        disk = shutil.disk_usage(self.up.folder())
        if cap <= 0 or stored + self._upload_pending + more > cap or disk.free - more < max(512 << 20, int(disk.total * 0.02)):
            raise Err('storage_full', 507)

    async def _receive_upload(self, req, uid):
        if self.up.today(uid) >= int(self.st.num('uploads_per_day')):
            raise Err('upload_limit', 429)
        self._upload_budget()
        reader = await req.multipart()
        fields, path, size, ext = {}, None, 0, ''
        reserved = 0
        parts=0
        limit_v = int(self.st.num('upload_video_mb')) << 20
        try:
            while True:
                part = await asyncio.wait_for(reader.next(), 15)
                if part is None:
                    break
                parts+=1
                if parts>12:raise Err('too_many_parts',400)
                if part.name == 'file':
                    if path is not None:raise Err('multiple_files',400)
                    ext = os.path.splitext(part.filename or '')[1].lower()
                    if ext not in AUDIO_EXT | VIDEO_EXT:
                        raise Err('bad_type')
                    fd, path = tempfile.mkstemp(suffix=ext, dir=self.up.folder())
                    with os.fdopen(fd, 'wb') as f:
                        while True:
                            chunk = await asyncio.wait_for(part.read_chunk(1 << 20), 15)
                            if not chunk:
                                break
                            size += len(chunk)
                            limit=int(self.st.num('upload_audio_mb'))<<20 if ext in AUDIO_EXT else limit_v
                            if size > limit:
                                raise Err('too_big', 413)
                            self._upload_budget(len(chunk))
                            self._upload_pending += len(chunk)
                            reserved += len(chunk)
                            f.write(chunk)
                else:
                    value=bytearray()
                    while True:
                        chunk=await asyncio.wait_for(part.read_chunk(4096),15)
                        if not chunk:break
                        value.extend(chunk)
                        if len(value)>4096:raise Err('field_too_big',413)
                    if part.name in ('title','artist','rights','code'):
                        if part.name in fields:raise Err('duplicate_field',400)
                        try:fields[part.name]=bytes(value).decode('utf-8')[:200]
                        except UnicodeDecodeError:raise Err('bad_field',400)
            if not path or not size:
                raise Err('no_file')
            if fields.get('rights') != '1':
                raise Err('rights_needed')
            info = await probe(path, self.engine.probe_slots)
            kind = 'video' if info['video'] and ext in VIDEO_EXT else 'audio'
            if kind == 'audio':
                if size > int(self.st.num('upload_audio_mb')) << 20:
                    raise Err('too_big', 413)
                if info['duration'] > self.st.num('upload_audio_min') * 60:
                    raise Err('too_long')
            else:
                code = self.code(fields.get('code'))
                if not self.can_control(code, uid):
                    raise Err('video_owner_only', 403)
            title = (fields.get('title') or '').strip() or os.path.splitext(os.path.basename(path))[0]
            ref = self.up.add(uid, path, title, (fields.get('artist') or '').strip(), kind, info['duration'], size)
            path = None
        finally:
            self._upload_pending -= reserved
            if path and os.path.exists(path):
                os.remove(path)
        item = await self.up.resolve(ref)
        aid, _ = self.engine.ensure(item)           # transcode now, so playing it later starts at once
        return {'ok': True, 'item': item.public(), 'asset': aid}

    async def api_remove(self, req, uid):
        b = await self.body(req)
        item = await self.up.resolve(str(b.get('ref') or ''))
        own = self.db.execute('SELECT uid FROM wkm_uploads WHERE id=?', (item.ref,)).fetchone()
        if not own or int(own[0]) != uid:
            raise Err('not_yours', 403)
        self.up.remove(item.ref)
        for r in list(self.sync.rooms.values()):
            if r.asset == item.asset_id:
                self.sync._clear(r)
                self.sync._bump(r)
        self.engine.drop(item.asset_id)
        try:
            os.remove(item.input)
        except OSError:
            pass
        return {'ok': True}

    async def api_report(self, req, uid):
        b = await self.body(req)
        self.slow(uid, 'report', 10, 3600)
        with self.db:
            self.db.execute('INSERT INTO wkm_reports VALUES(?,?,?,?,?)', (str(b.get('src') or '')[:8], str(b.get('ref') or '')[:40], uid,
                                                                          str(b.get('why') or '')[:300], int(time.time())))
        return {'ok': True}

    # ------------------------------------------------------------------------------------------ salon
    async def api_play(self, req, uid):
        b = await self.body(req)
        code = self.code(b.get('code'))
        if not self.can_control(code, uid):
            raise Err('host', 403)
        self.slow(uid, 'play', 20, 60)
        item = await self.reg.get(str(b.get('src') or '')).resolve(str(b.get('ref') or ''), uid)
        if item.policy.mode != 'relay':
            # YouTube & co.: their own player only. The app loads it through the salon's existing YouTube path.
            r = self.sync.room(code)
            if r.asset:
                self.sync.control(code, uid, 'stop')
            return {'ok': True, 'embed': {'src': item.src, 'ref': item.ref, 'link': item.policy.link}}
        aid, job = self.engine.ensure(item)
        ready = job is None or job.state in ('ready', 'done')
        row = self.engine.row(aid) or {}
        if row.get('duration'):
            item.duration = row['duration']
        self.sync.load(code, uid, aid, item, ready)
        if not ready:
            asyncio.ensure_future(self._await_ready(aid))
        return {'ok': True, 'state': self.sync.state_for(self.sync.room(code), uid)['state']}

    async def _await_ready(self, aid):
        ok = await self.engine.wait_ready(aid, 120)
        row = self.engine.row(aid) or {}
        if ok:
            self.sync.mark_ready(aid, row.get('duration'))
        else:
            self.sync.fail(aid, row.get('err') or 'not_ready')

    async def api_ctl(self, req, uid):
        b = await self.body(req)
        code = self.code(b.get('code'))
        r = self.sync.control(code, uid, str(b.get('a') or ''), b.get('pos'))
        return {'ok': True, 'state': self.sync.state_for(r, uid)['state']}

    async def api_state(self, req, uid):
        code = self.code(req.query.get('code'))
        if not self.can_view(code, uid):
            raise Err('not_inside', 403)
        return {'ok': True, 'state': self.sync.state_for(self.sync.room(code), uid)['state']}

    async def api_ticket(self, req, uid):
        b = await self.body(req)
        code = self.code(b.get('code'))
        if not self.can_view(code, uid):
            raise Err('not_inside', 403)
        tk = self.signer.sign('ws', code, uid, WS_TTL)
        return {'ok': True, 'url': '/api/media/ws?code=%s&tk=%s' % (code, tk)}

    async def ws(self, req):
        self.background()
        try:
            code = self.code(req.query.get('code'))
        except Err:
            return J({'ok': False, 'err': 'bad_code'}, 400)
        uid = self.signer.check('ws', code, req.query.get('tk'))
        if uid is None:
            return J({'ok': False, 'err': 'auth'}, 401)
        if not self.can_view(code,uid):return J({'ok':False,'err':'not_inside'},403)
        ws = web.WebSocketResponse(heartbeat=20, max_msg_size=8192)
        await ws.prepare(req)
        await self.sync.handle(ws, code, uid, int(self.st.num('room_cap')))
        return ws

    async def clock(self, req):
        return J({'ok': True, 's': now_ms()})

    async def health(self, req):
        u = self.engine.usage()
        return J({'ok': True, 'mbps': round(self.meter.mbps(), 2), 'cap': self.st.num('egress_cap_mbps'), 'load': round(self.budget.load(), 3),
                  'jobs': len(u['jobs']), 'assets': u['assets'], 'gb': round(u['bytes'] / (1 << 30), 3),
                  'rooms': sum(1 for r in self.sync.rooms.values() if r.socks), 'youtube_search': bool(self.st.get('youtube_api_key'))})

    # ------------------------------------------------------------------------------------------ HLS files
    async def hls(self, req):
        aid, name, tk = req.match_info['asset'], req.match_info['file'], req.match_info['tk']
        if not ASSET.fullmatch(aid) or not HLS_FILE.fullmatch(name):raise web.HTTPNotFound()
        first,sep,rest=tk.partition('.')
        if CODE.fullmatch(first) and sep:
            uid=self.signer.check('hls',first+'|'+aid,rest)
            allowed=uid is not None and self.can_view(first,uid)
        else:
            # Already playing clients retain their old URL only while still authorized.
            uid=self.signer.check('hls',aid,tk)
            allowed=uid is not None and any(room.asset==aid and self.can_view(room.code,uid) for room in self.sync.rooms.values())
        if uid is None:raise web.HTTPNotFound()
        if not allowed:raise web.HTTPForbidden()

        folder = self.engine.folder(aid)
        path = os.path.join(folder, name)
        if name == 'master.m3u8':
            row = self.engine.row(aid)
            if row and not row['variants'] and aid in self.engine.jobs:      # still probing: wait for the job's first segments
                await self.engine.wait_ready(aid, 20)
                row = self.engine.row(aid)
            if not row or not row['variants']:
                raise web.HTTPNotFound()
            from .engine import master_text
            allowed = self.budget.allowed(row['variants'], saver=req.query.get('q') == 'low')
            body = master_text(row['variants'], allowed).encode()
            self.meter.add(len(body))
            self.engine.touch(aid)
            return web.Response(body=body, content_type='application/vnd.apple.mpegurl', headers=PRIVATE_HLS)
        if not os.path.isfile(path):
            raise web.HTTPNotFound()
        size = os.path.getsize(path)
        self.meter.add(size)
        if name.endswith('.m3u8'):
            with open(path, 'rb') as f:
                body = f.read()
            done = b'#EXT-X-ENDLIST' in body
            return web.Response(body=body, content_type='application/vnd.apple.mpegurl',
                                headers=PRIVATE_HLS)
        ctype = 'video/mp4' if name.endswith('.mp4') else 'video/iso.segment'
        return web.FileResponse(path, headers={'Content-Type': ctype, **PRIVATE_HLS,
                                               'Access-Control-Allow-Origin': '*'})

    # ------------------------------------------------------------------------------------------ routes
    def routes(self, app):
        r = app.router
        for verb, path, fn in (('GET', 'search', self.api_search), ('GET', 'mine', self.api_mine), ('POST', 'upload', self.api_upload),
                               ('POST', 'remove', self.api_remove), ('POST', 'report', self.api_report), ('POST', 'play', self.api_play),
                               ('POST', 'ctl', self.api_ctl), ('GET', 'state', self.api_state), ('POST', 'ticket', self.api_ticket)):
            r.add_route(verb, '/api/media/' + path, self.h(fn))
        r.add_get('/api/media/ws', self.ws)
        r.add_get('/api/media/clock', self.clock)
        r.add_get('/api/media/health', self.health)
        r.add_get('/media/hls/{tk}/{asset}/{file:.+}', self.hls)
