"""Streaming engine: one FFmpeg job per asset -> HLS (fMP4) in several qualities, a disk cache with LRU, and the rights gate.

The same asset is never fetched or transcoded twice: the asset id is a hash of (source, ref, kind), a running job is shared,
and a finished one is served from disk to every salon and every listener.
"""
import asyncio
import json
import os
import resource
import shutil
import time

from .adapters import AdapterError

SEG = 4                                         # seconds per segment
AUDIO_LADDER = (('a64', 64), ('a96', 96), ('a160', 160))
VIDEO_LADDER = (('v360', 360, 800), ('v720', 720, 2500))
VIDEO_AUDIO_K = 96


class RightsError(AdapterError):
    pass


def _limits():
    try:
        os.nice(10)
        resource.setrlimit(resource.RLIMIT_AS, (3 << 30, 3 << 30))
    except Exception:
        pass


async def probe(path):
    p = await asyncio.create_subprocess_exec('ffprobe', '-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', path,
                                             stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL)
    try:
        out, _ = await asyncio.wait_for(p.communicate(), 30)
    except asyncio.TimeoutError:
        p.kill()
        raise AdapterError('probe_timeout')
    try:
        j = json.loads(out or b'{}')
    except ValueError:
        j = {}
    st = j.get('streams') or []
    v = next((s for s in st if s.get('codec_type') == 'video' and not (s.get('disposition') or {}).get('attached_pic')), None)
    a = next((s for s in st if s.get('codec_type') == 'audio'), None)
    try:
        dur = float((j.get('format') or {}).get('duration') or 0)
    except ValueError:
        dur = 0.0
    if not a and not v:
        raise AdapterError('bad_media')
    return {'duration': dur, 'audio': bool(a), 'video': bool(v),
            'w': int((v or {}).get('width') or 0), 'h': int((v or {}).get('height') or 0)}


def variants(info, kind):
    """the qualities this asset gets; video only when the source has a picture and the item is a video"""
    if kind == 'video' and info['video']:
        h = info['h'] or 360
        rungs = [r for r in VIDEO_LADDER if r[1] <= max(h, 360)]
        out = []
        for name, height, kb in rungs:
            w = int(round((info['w'] or 640) * height / max(h, 1) / 2.0)) * 2
            out.append({'name': name, 'kind': 'video', 'h': height, 'w': w, 'kbps': kb,
                        'bw': (kb + VIDEO_AUDIO_K) * 1100, 'codecs': 'avc1.4d401f,mp4a.40.2' if info['audio'] else 'avc1.4d401f'})
        return out
    return [{'name': n, 'kind': 'audio', 'kbps': k, 'bw': k * 1100, 'codecs': 'mp4a.40.2'} for n, k in AUDIO_LADDER]


def ffmpeg_args(src, out, info, vs):
    base = ['ffmpeg', '-nostdin', '-hide_banner', '-v', 'error', '-y', '-i', src]
    hls = ['-f', 'hls', '-hls_time', str(SEG), '-hls_playlist_type', 'event', '-hls_segment_type', 'fmp4',
           '-hls_flags', 'independent_segments+temp_file', '-hls_fmp4_init_filename', 'init.mp4',
           '-hls_segment_filename', os.path.join(out, '%v', 's%05d.m4s')]
    if vs[0]['kind'] == 'audio':
        a = base + ['-vn']
        for _ in vs:
            a += ['-map', '0:a:0']
        a += ['-c:a', 'aac', '-ar', '44100', '-ac', '2']
        for i, v in enumerate(vs):
            a += ['-b:a:%d' % i, '%dk' % v['kbps']]
        smap = ' '.join('a:%d,name:%s' % (i, v['name']) for i, v in enumerate(vs))
    else:
        n = len(vs)
        chains = ';'.join('[s%d]scale=-2:%d[o%d]' % (i, v['h'], i) for i, v in enumerate(vs))
        split = '[0:v]split=%d%s;' % (n, ''.join('[s%d]' % i for i in range(n)))
        a = base + ['-filter_complex', split + chains]
        for i in range(n):
            a += ['-map', '[o%d]' % i]
            if info['audio']:
                a += ['-map', '0:a:0']
        a += ['-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main', '-level', '3.1', '-pix_fmt', 'yuv420p',
              '-force_key_frames', 'expr:gte(t,n_forced*%d)' % SEG, '-sc_threshold', '0']
        for i, v in enumerate(vs):
            a += ['-b:v:%d' % i, '%dk' % v['kbps'], '-maxrate:v:%d' % i, '%dk' % int(v['kbps'] * 1.07),
                  '-bufsize:v:%d' % i, '%dk' % int(v['kbps'] * 1.5)]
        if info['audio']:
            a += ['-c:a', 'aac', '-ar', '44100', '-ac', '2', '-b:a', '%dk' % VIDEO_AUDIO_K]
        smap = ' '.join(('v:%d,a:%d,name:%s' % (i, i, v['name'])) if info['audio'] else ('v:%d,name:%s' % (i, v['name']))
                        for i, v in enumerate(vs))
    return a + hls + ['-var_stream_map', smap, os.path.join(out, '%v', 'index.m3u8')]


def master_text(vs, allowed=None):
    lines = ['#EXTM3U', '#EXT-X-VERSION:7', '#EXT-X-INDEPENDENT-SEGMENTS']
    for v in vs:
        if allowed is not None and v['name'] not in allowed:
            continue
        inf = 'BANDWIDTH=%d,AVERAGE-BANDWIDTH=%d,CODECS="%s"' % (v['bw'], int(v['bw'] * 0.9), v['codecs'])
        if v['kind'] == 'video':
            inf += ',RESOLUTION=%dx%d' % (v['w'], v['h'])
        lines += ['#EXT-X-STREAM-INF:' + inf, v['name'] + '/index.m3u8']
    return '\n'.join(lines) + '\n'


def segments(path):
    try:
        with open(path, encoding='utf-8') as f:
            t = f.read()
    except OSError:
        return 0, False
    return t.count('#EXTINF'), '#EXT-X-ENDLIST' in t


def dir_bytes(d):
    total = 0
    for root, _, files in os.walk(d):
        for f in files:
            try:
                total += os.path.getsize(os.path.join(root, f))
            except OSError:
                pass
    return total


class Job:
    def __init__(self, aid):
        self.aid = aid
        self.state = 'queued'            # queued | running | ready | done | failed
        self.err = ''
        self.ready = asyncio.Event()     # 2 segments of every quality exist: playback can start
        self.finished = asyncio.Event()
        self.task = None
        self.started = time.time()


class Engine:
    def __init__(self, db, settings, log=None):
        self.db, self.st, self.log = db, settings, log
        self.jobs = {}
        self.sem = {}
        self.active = set()              # assets in use by a salon right now (never evicted)

    def init(self):
        with self.db:
            self.db.execute("""CREATE TABLE IF NOT EXISTS wkm_assets(id TEXT PRIMARY KEY, src TEXT NOT NULL, ref TEXT NOT NULL, kind TEXT NOT NULL,
                cache TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', duration REAL NOT NULL DEFAULT 0, variants TEXT NOT NULL DEFAULT '[]',
                bytes INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, used INTEGER NOT NULL, state TEXT NOT NULL, err TEXT NOT NULL DEFAULT '')""")
        self.sem = {'audio': asyncio.Semaphore(int(self.st.num('audio_jobs')) or 1),
                    'video': asyncio.Semaphore(int(self.st.num('video_jobs')) or 1)}
        os.makedirs(self.hls_root(), exist_ok=True)
        # a job that was running when the server stopped is not finished: start it again on first use
        with self.db:
            self.db.execute("UPDATE wkm_assets SET state='stale' WHERE state IN ('queued','running','ready')")

    def hls_root(self):
        return os.path.join(self.st.get('root'), 'hls')

    def folder(self, aid):
        return os.path.join(self.hls_root(), aid)

    def row(self, aid):
        r = self.db.execute('SELECT id,src,ref,kind,cache,title,duration,variants,bytes,state,err FROM wkm_assets WHERE id=?', (aid,)).fetchone()
        if not r:
            return None
        keys = ('id', 'src', 'ref', 'kind', 'cache', 'title', 'duration', 'variants', 'bytes', 'state', 'err')
        d = dict(zip(keys, r))
        d['variants'] = json.loads(d['variants'] or '[]')
        return d

    def touch(self, aid):
        with self.db:
            self.db.execute('UPDATE wkm_assets SET used=? WHERE id=?', (int(time.time()), aid))

    def status(self, aid):
        j = self.jobs.get(aid)
        if j:
            return j.state
        r = self.row(aid)
        return r['state'] if r else 'none'

    # -------------------------------------------------------------------------------- the gate + the job
    def ensure(self, item):
        """rights gate, then one shared job per asset; returns (asset id, Job or None when it is already on disk)"""
        p = item.policy
        if p.mode != 'relay' or not item.input:
            raise RightsError('not_relayable', 403)
        aid = item.asset_id
        j = self.jobs.get(aid)
        if j and j.state != 'failed':
            return aid, j
        r = self.row(aid)
        if r and r['state'] == 'done' and os.path.isfile(os.path.join(self.folder(aid), 'done')):
            self.touch(aid)
            return aid, None
        j = Job(aid)
        self.jobs[aid] = j
        now = int(time.time())
        with self.db:
            self.db.execute("INSERT OR REPLACE INTO wkm_assets(id,src,ref,kind,cache,title,duration,variants,bytes,created,used,state,err) "
                            "VALUES(?,?,?,?,?,?,?,'[]',0,?,?,'queued','')", (aid, item.src, item.ref, item.kind, p.cache, item.title,
                                                                            float(item.duration or 0), now, now))
        j.task = asyncio.ensure_future(self._run(j, item))
        return aid, j

    async def wait_ready(self, aid, timeout=60):
        j = self.jobs.get(aid)
        if not j:
            return self.status(aid) in ('done', 'ready')
        try:
            await asyncio.wait_for(asyncio.shield(j.ready.wait()), timeout)
        except asyncio.TimeoutError:
            return False
        return j.state in ('ready', 'done')

    def _set(self, aid, **kw):
        cols = ','.join('%s=?' % k for k in kw)
        with self.db:
            self.db.execute('UPDATE wkm_assets SET %s WHERE id=?' % cols, (*kw.values(), aid))

    async def _run(self, j, item):
        out = self.folder(j.aid)
        kind = 'video' if item.kind == 'video' else 'audio'
        try:
            info = await probe(item.input)
            vs = variants(info, kind)
            shutil.rmtree(out, ignore_errors=True)
            for v in vs:
                os.makedirs(os.path.join(out, v['name']), exist_ok=True)
            with open(os.path.join(out, 'master.m3u8'), 'w', encoding='utf-8') as f:
                f.write(master_text(vs))
            self._set(j.aid, variants=json.dumps(vs), duration=info['duration'] or float(item.duration or 0))
            async with self.sem[vs[0]['kind']]:
                j.state = 'running'
                self._set(j.aid, state='running')
                p = await asyncio.create_subprocess_exec(*ffmpeg_args(item.input, out, info, vs), stdout=asyncio.subprocess.DEVNULL,
                                                         stderr=asyncio.subprocess.PIPE, preexec_fn=_limits)
                limit = time.time() + max(info['duration'], 60) * 3 + 180
                errbuf = asyncio.ensure_future(p.stderr.read())
                while p.returncode is None:
                    if not j.ready.is_set() and all(segments(os.path.join(out, v['name'], 'index.m3u8'))[0] >= 2 or
                                                    segments(os.path.join(out, v['name'], 'index.m3u8'))[1] for v in vs):
                        j.state = 'ready'
                        self._set(j.aid, state='ready')
                        j.ready.set()
                    if time.time() > limit:
                        p.kill()
                        raise AdapterError('transcode_timeout')
                    try:
                        await asyncio.wait_for(p.wait(), 0.3)
                    except asyncio.TimeoutError:
                        pass
                err = (await errbuf).decode('utf-8', 'replace')[-400:]
                if p.returncode != 0:
                    raise AdapterError('ffmpeg_%d: %s' % (p.returncode, err.strip()[:200]))
            open(os.path.join(out, 'done'), 'w').close()
            j.state = 'done'
            self._set(j.aid, state='done', bytes=dir_bytes(out), used=int(time.time()))
        except Exception as e:
            j.state, j.err = 'failed', getattr(e, 'code', '') or type(e).__name__
            self._set(j.aid, state='failed', err=j.err[:300])
            shutil.rmtree(out, ignore_errors=True)
            if self.log:
                self.log.warning('wakhan_media job %s failed: %s', j.aid, j.err)
        finally:
            j.ready.set()
            j.finished.set()
            if self.jobs.get(j.aid) is j and j.state != 'failed':
                self.jobs.pop(j.aid, None)
            await self.evict()

    # -------------------------------------------------------------------------------- disk
    async def evict(self):
        quota = self.st.num('store_gb') * (1 << 30)
        stale = time.time() - self.st.num('session_hours') * 3600
        busy = self.active | set(self.jobs)
        rows = self.db.execute("SELECT id,cache,bytes,used FROM wkm_assets WHERE state IN ('done','failed','stale') ORDER BY used ASC").fetchall()
        total = sum(r[2] for r in rows)
        for aid, cache, size, used in rows:
            if aid in busy:
                continue
            if cache == 'session' and used < stale or cache == 'none' or total > quota:
                self.drop(aid)
                total -= size

    def drop(self, aid):
        shutil.rmtree(self.folder(aid), ignore_errors=True)
        with self.db:
            self.db.execute('DELETE FROM wkm_assets WHERE id=?', (aid,))

    def usage(self):
        r = self.db.execute("SELECT COUNT(*), COALESCE(SUM(bytes),0) FROM wkm_assets WHERE state='done'").fetchone()
        return {'assets': r[0], 'bytes': r[1], 'jobs': {a: j.state for a, j in self.jobs.items()}}
