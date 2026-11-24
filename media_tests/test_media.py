"""End-to-end tests of wakhan_media with real FFmpeg, a real aiohttp server and 16 WebSocket clients.

Run:  python3 -m pytest -q tests
"""
import asyncio
import json
import os
import sqlite3
import subprocess
import sys
import tempfile
import time

import pytest
from aiohttp import FormData, web
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from wakhan_media.api import Media  # noqa: E402
from wakhan_media.config import Settings  # noqa: E402

CODE = 'WK7H2Q'
OWNER, ADMIN, GUEST, OUTSIDER = 1, 2, 3, 99
VIEWERS = {OWNER, ADMIN, GUEST} | set(range(100, 116))         # 19 people inside
FIX = tempfile.mkdtemp()


def make(path, *args):
    if not os.path.exists(path):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', *args, path], check=True)
    return path


TONE = make(os.path.join(FIX, 'tone.mp3'), '-f', 'lavfi', '-i', 'sine=frequency=440:duration=40', '-c:a', 'libmp3lame', '-b:a', '128k')
CLIP = make(os.path.join(FIX, 'clip.mp4'), '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=25:duration=12', '-f', 'lavfi', '-i',
            'sine=frequency=330:duration=12', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-shortest')


class Access:
    def __init__(self):
        self.closed = []

    def can_view(self, code, uid):
        return code == CODE and uid in VIEWERS

    def can_control(self, code, uid):
        return code == CODE and uid in (OWNER, ADMIN)

    def close_screen(self, code, uid):
        self.closed.append((code, uid))


def auth(fn):
    async def w(req):
        uid = req.headers.get('X-Uid')
        if not uid:
            return web.json_response({'ok': False, 'err': 'auth'}, status=401)
        req['u'] = {'id': int(uid)}
        return await fn(req)
    return w


class Env:
    async def __aenter__(self):
        self.root = tempfile.mkdtemp()
        self.db = sqlite3.connect(':memory:')
        st = Settings(self.db)
        st.init()
        st.set('root', self.root)
        self.access = Access()
        self.m = Media(self.db, st, auth, self.access)
        self.m.init()
        app = web.Application(client_max_size=64 << 20)
        self.m.routes(app)
        self.c = TestClient(TestServer(app))
        await self.c.start_server()
        return self

    async def __aexit__(self, *a):
        await self.c.close()

    async def get(self, path, uid=None, **kw):
        r = await self.c.get(path, headers={'X-Uid': str(uid)} if uid else {}, **kw)
        return r.status, (await r.json() if r.content_type == 'application/json' else await r.read())

    async def post(self, path, body, uid):
        r = await self.c.post(path, json=body, headers={'X-Uid': str(uid)})
        return r.status, await r.json()

    async def upload(self, uid, path, title, rights='1', code=None):
        fd = FormData()
        fd.add_field('file', open(path, 'rb'), filename=os.path.basename(path))
        fd.add_field('title', title)
        fd.add_field('artist', 'Test Artist')
        fd.add_field('rights', rights)
        if code:
            fd.add_field('code', code)
        r = await self.c.post('/api/media/upload', data=fd, headers={'X-Uid': str(uid)})
        return r.status, await r.json()

    async def socket(self, uid):
        s, t = await self.post('/api/media/ticket', {'code': CODE}, uid)
        assert s == 200, t
        ws = await self.c.ws_connect(t['url'])
        return ws


async def recv(ws, kind, timeout=8.0, pred=None):
    end = time.time() + timeout
    while time.time() < end:
        m = await ws.receive(timeout=max(0.05, end - time.time()))
        if m.type.name != 'TEXT':
            continue
        d = json.loads(m.data)
        if d.get('type') == kind and (pred is None or pred(d)):
            return d
    raise AssertionError('no %s message' % kind)


def run(coro):
    return asyncio.run(asyncio.wait_for(coro, 240))


# ------------------------------------------------------------------------------------------------------------- tests
def test_upload_rights_and_transcode():
    async def t():
        async with Env() as e:
            s, j = await e.upload(GUEST, TONE, 'Song A', rights='0')
            assert s == 400 and j['err'] == 'rights_needed'
            s, j = await e.upload(GUEST, TONE, 'Song A')
            assert s == 200 and j['ok'], j
            assert j['item']['policy']['mode'] == 'relay' and j['item']['kind'] == 'audio'
            assert await e.m.engine.wait_ready(j['asset'], 30)
            s, j2 = await e.get('/api/media/search?q=song', GUEST)
            assert [i['title'] for i in j2['items']] == ['Song A']
            assert j2['errors'] == {'yt': 'youtube_search_off'}
            s, j3 = await e.get('/api/media/mine', GUEST)
            assert len(j3['items']) == 1
            s, j4 = await e.upload(GUEST, CLIP, 'Clip', code=CODE)          # a guest may not upload video for the salon
            assert s == 403 and j4['err'] == 'video_owner_only'
    run(t())


def test_play_permissions_signed_hls_and_abr():
    async def t():
        async with Env() as e:
            _, up = await e.upload(OWNER, TONE, 'Song B')
            ref = up['item']['ref']
            s, j = await e.post('/api/media/play', {'code': CODE, 'src': 'up', 'ref': ref}, GUEST)
            assert s == 403
            s, j = await e.post('/api/media/play', {'code': CODE, 'src': 'up', 'ref': ref}, OWNER)
            assert s == 200 and j['state']['asset'] == up['asset'] and j['state']['url'], j
            assert e.access.closed == [(CODE, OWNER)]                    # the salon's YouTube screen was closed
            url = j['state']['url']
            s, master = await e.get(url)
            text = master.decode()
            assert s == 200 and text.count('#EXT-X-STREAM-INF') == 3 and 'a64/index.m3u8' in text and 'a160/index.m3u8' in text
            base = url.rsplit('/', 1)[0]
            await e.m.engine.wait_ready(up['asset'], 30)
            s, idx = await e.get(base + '/a96/index.m3u8')
            idx = idx.decode()
            assert s == 200 and '#EXTINF' in idx
            init = [l for l in idx.splitlines() if l.startswith('#EXT-X-MAP')][0].split('"')[1]
            seg = [l for l in idx.splitlines() if l.endswith('.m4s')][0]
            s, b = await e.get(base + '/a96/' + init)
            assert s == 200 and len(b) > 100
            s, b = await e.get(base + '/a96/' + seg)
            assert s == 200 and len(b) > 1000
            bad = url.replace('/media/hls/', '/media/hls/9').replace('master', 'master')
            s, _ = await e.get(bad)
            assert s == 404
            s, _ = await e.get(base + '/../../etc/passwd')
            assert s == 404
            # the budget: over 80% of the cap a new player only gets the lowest quality
            e.m.meter.add(int(e.m.st.num('egress_cap_mbps') * 1e6 / 8 * 10))
            s, master = await e.get(url)
            assert master.decode().count('#EXT-X-STREAM-INF') == 1 and 'a64/' in master.decode()
            s, h = await e.get('/api/media/health')
            assert h['ok'] and h['load'] >= 0.8
    run(t())


def test_sixteen_clients_stay_in_sync_and_reconnect():
    async def t():
        async with Env() as e:
            _, up = await e.upload(OWNER, TONE, 'Song C')
            await e.m.engine.wait_ready(up['asset'], 30)
            people = [OWNER, ADMIN, GUEST] + list(range(100, 113))          # 16 people
            socks = []
            for uid in people:
                ws = await e.socket(uid)
                await recv(ws, 'hello')
                await recv(ws, 'state')
                socks.append(ws)
            s, _ = await e.post('/api/media/ticket', {'code': CODE}, OUTSIDER)
            assert s == 403
            # clock
            await socks[3].send_str(json.dumps({'type': 'ping', 'c': 123}))
            p = await recv(socks[3], 'pong')
            assert p['c'] == 123 and abs(p['s'] - time.time() * 1000) < 2000
            # owner plays -> all 16 get the same t0 and their own signed URL
            t_send = time.time()
            await e.post('/api/media/play', {'code': CODE, 'src': 'up', 'ref': up['item']['ref']}, OWNER)
            states = [(await recv(ws, 'state', pred=lambda d: d['state']['asset']))['state'] for ws in socks]
            assert time.time() - t_send < 3
            assert len({st['t0'] for st in states}) == 1 and states[0]['playing'] and states[0]['ready']
            assert len({st['url'] for st in states}) == 16                   # one link per person
            assert states[0]['control'] and not states[2]['control']
            # a guest may not pause
            await socks[2].send_str(json.dumps({'type': 'ctl', 'a': 'pause'}))
            assert (await recv(socks[2], 'error'))['err'] == 'host'
            # admin pauses through the socket -> everyone paused at the same point
            await socks[1].send_str(json.dumps({'type': 'ctl', 'a': 'pause'}))
            paused = [(await recv(ws, 'state', pred=lambda d: not d['state']['playing']))['state'] for ws in socks]
            assert len({st['paused_at'] for st in paused}) == 1
            # seek to 20 s while paused, then play: t0 = start + lead - 20 s for all
            await socks[0].send_str(json.dumps({'type': 'ctl', 'a': 'seek', 'pos': 20}))
            sk = [(await recv(ws, 'state', pred=lambda d: d['state']['paused_at'] == 20))['state'] for ws in socks]
            assert len(sk) == 16
            await socks[0].send_str(json.dumps({'type': 'ctl', 'a': 'play'}))
            pl = [(await recv(ws, 'state', pred=lambda d: d['state']['playing']))['state'] for ws in socks]
            t0 = {st['t0'] for st in pl}
            assert len(t0) == 1
            pos = (time.time() * 1000 - t0.pop()) / 1000
            assert 17.5 < pos < 21                                          # 20 s minus the 1.2 s lead, plus test time
            v = pl[5]['v']
            # reconnect: a dropped phone comes back and asks with its last version
            await socks[5].close()
            ws = await e.socket(people[5])
            await recv(ws, 'hello')
            st = (await recv(ws, 'state'))['state']
            assert st['v'] == v and st['playing']
            await ws.send_str(json.dumps({'type': 'resume', 'v': v}))
            with pytest.raises(AssertionError):
                await recv(ws, 'state', timeout=0.6)                        # nothing changed -> nothing re-sent
            await ws.send_str(json.dumps({'type': 'resume', 'v': v - 1}))
            assert (await recv(ws, 'state'))['state']['v'] == v
            # stop clears it for everyone
            await e.post('/api/media/ctl', {'code': CODE, 'a': 'stop'}, OWNER)
            assert (await recv(socks[9], 'state', pred=lambda d: d['state']['asset'] is None))['state']['url'] == ''
            for w in socks + [ws]:
                await w.close()
    run(t())


def test_same_track_is_transcoded_once_and_video_ladder():
    async def t():
        async with Env() as e:
            _, up = await e.upload(OWNER, CLIP, 'Clip', code=CODE)
            assert up['item']['kind'] == 'video'
            jobs_before = len(e.m.engine.jobs)
            for _ in range(5):                                            # five plays while it is still transcoding
                s, j = await e.post('/api/media/play', {'code': CODE, 'src': 'up', 'ref': up['item']['ref']}, ADMIN)
                assert s == 200
            assert len(e.m.engine.jobs) <= max(jobs_before, 1)
            assert e.db.execute('SELECT COUNT(*) FROM wkm_assets').fetchone()[0] == 1
            assert await e.m.engine.wait_ready(up['asset'], 60)
            s, master = await e.get(j['state']['url'])
            text = master.decode()
            assert 'RESOLUTION=640x360' in text and 'RESOLUTION=1280x720' in text
            s, low = await e.get(j['state']['url'] + '?q=low')
            assert low.decode().count('#EXT-X-STREAM-INF') == 1
    run(t())


def test_ready_waits_then_everyone_starts_together():
    async def t():
        async with Env() as e:
            _, up = await e.upload(OWNER, CLIP, 'Clip 2', code=CODE)
            job = e.m.engine.jobs.get(up['asset'])
            if job:
                await job.finished.wait()
            e.m.engine.drop(up['asset'])                                   # force a fresh transcode on play
            ws = await e.socket(GUEST)
            await recv(ws, 'hello')
            await recv(ws, 'state')
            s, j = await e.post('/api/media/play', {'code': CODE, 'src': 'up', 'ref': up['item']['ref']}, OWNER)
            first = j['state']
            if not first['ready']:
                assert first['t0'] is None
                st = (await recv(ws, 'state', timeout=60, pred=lambda d: d['state']['ready']))['state']
                assert st['t0'] and st['t0'] > st['now']                   # starts a moment in the future, together
            await ws.close()
    run(t())


def test_youtube_is_search_and_embed_only():
    async def t():
        async with Env() as e:
            # a fake YouTube Data API answering like the real one
            api = web.Application()

            async def search(req):
                assert req.query['key'] == 'K' and req.query['type'] == 'video'
                return web.json_response({'items': [{'id': {'videoId': 'dQw4w9WgXcQ'}}, {'id': {'videoId': 'aaaaaaaaaaa'}}]})

            async def videos(req):
                return web.json_response({'items': [
                    {'id': 'dQw4w9WgXcQ', 'snippet': {'title': 'Song Y', 'channelTitle': 'Chan', 'thumbnails': {'high': {'url': 'https://i.ytimg.com/x.jpg'}}},
                     'contentDetails': {'duration': 'PT3M33S'}, 'status': {'embeddable': True}},
                    {'id': 'aaaaaaaaaaa', 'snippet': {'title': 'Not embeddable'}, 'contentDetails': {'duration': 'PT1M'}, 'status': {'embeddable': False}}]})
            api.router.add_get('/youtube/v3/search', search)
            api.router.add_get('/youtube/v3/videos', videos)
            fake = TestServer(api)
            await fake.start_server()
            e.m.yt.API = str(fake.make_url('/youtube/v3/'))
            e.m.st.set('youtube_api_key', 'K')
            s, j = await e.get('/api/media/search?q=song&src=yt', GUEST)
            assert s == 200 and [i['ref'] for i in j['items']] == ['dQw4w9WgXcQ'], j
            it = j['items'][0]
            assert it['duration'] == 213 and it['policy']['mode'] == 'embed' and not it['policy']['background']
            # relay something, then play YouTube: the relay stops and the app is told to use the embed path
            _, up = await e.upload(OWNER, TONE, 'Song D')
            await e.post('/api/media/play', {'code': CODE, 'src': 'up', 'ref': up['item']['ref']}, OWNER)
            s, j = await e.post('/api/media/play', {'code': CODE, 'src': 'yt', 'ref': 'dQw4w9WgXcQ'}, OWNER)
            assert s == 200 and j['embed']['ref'] == 'dQw4w9WgXcQ'
            assert e.m.sync.room(CODE).asset is None
            assert not os.path.exists(os.path.join(e.root, 'hls', 'dQw4w9WgXcQ'))
            s, j = await e.post('/api/media/play', {'code': CODE, 'src': 'yt', 'ref': '../etc'}, OWNER)
            assert s == 400
            await fake.close()
            await e.m.http().close()
    run(t())


def test_remove_and_report():
    async def t():
        async with Env() as e:
            _, up = await e.upload(GUEST, TONE, 'Song E')
            await e.m.engine.wait_ready(up['asset'], 30)
            s, j = await e.post('/api/media/remove', {'ref': up['item']['ref']}, OWNER)
            assert s == 403
            s, j = await e.post('/api/media/report', {'src': 'up', 'ref': up['item']['ref'], 'why': 'not theirs'}, OWNER)
            assert s == 200
            s, j = await e.post('/api/media/remove', {'ref': up['item']['ref']}, GUEST)
            assert s == 200
            assert not os.path.exists(e.m.engine.folder(up['asset']))
            s, j = await e.get('/api/media/search?q=song&src=up', GUEST)
            assert j['items'] == []
    run(t())
