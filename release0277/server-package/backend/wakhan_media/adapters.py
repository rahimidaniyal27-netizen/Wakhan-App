"""Media providers. The engine never knows a provider by name: it reads the Item and its Policy.

Policy.mode decides everything:
  relay  - the file may be fetched, transcoded to HLS and streamed from the WAKHAN server
  embed  - the provider only allows its own player; the engine builds nothing and the app opens that player

A new provider = one class with search() and resolve(). Nothing else changes.
"""
import hashlib
import json
import os
import re
import time
import urllib.parse
from dataclasses import asdict, dataclass, field


class AdapterError(Exception):
    def __init__(self, code, status=400):
        super().__init__(code)
        self.code, self.status = code, status


@dataclass
class Policy:
    mode: str = 'embed'            # relay | embed
    cache: str = 'none'            # keep | session | none
    background: bool = False       # may keep playing with the screen off
    group: bool = True             # may be played for a whole salon
    attribution: str = ''
    link: str = ''


@dataclass
class Item:
    src: str
    ref: str
    title: str
    artist: str = ''
    duration: float = 0.0
    thumb: str = ''
    kind: str = 'audio'            # audio | video
    policy: Policy = field(default_factory=Policy)
    input: str = ''                # local file the engine reads (relay only)

    def public(self):
        d = asdict(self)
        d.pop('input', None)
        return d

    @property
    def asset_id(self):
        return hashlib.sha1(('%s|%s|%s' % (self.src, self.ref, self.kind)).encode()).hexdigest()[:20]


class Adapter:
    name = ''

    async def search(self, q, limit=15, uid=0):
        return []

    async def resolve(self, ref, uid=0):
        raise AdapterError('not_found', 404)


# --------------------------------------------------------------------------------------------- uploads (relay)
AUDIO_EXT = {'.mp3', '.m4a', '.aac', '.wav', '.ogg', '.opus', '.flac'}
VIDEO_EXT = {'.mp4', '.mov', '.m4v', '.mkv', '.webm'}


class UploadAdapter(Adapter):
    """files people upload with «this is mine / I have the right to play it» - the one source that is fully ours to stream"""
    name = 'up'

    def __init__(self, db, settings):
        self.db, self.st = db, settings

    def init(self):
        with self.db:
            self.db.execute("""CREATE TABLE IF NOT EXISTS wkm_uploads(id TEXT PRIMARY KEY, uid INTEGER NOT NULL, title TEXT NOT NULL,
                artist TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL, dur REAL NOT NULL, path TEXT NOT NULL, bytes INTEGER NOT NULL,
                rights_ts INTEGER NOT NULL, ts INTEGER NOT NULL, removed INTEGER NOT NULL DEFAULT 0)""")
            self.db.execute('CREATE INDEX IF NOT EXISTS wkm_uploads_uid ON wkm_uploads(uid, ts)')

    def folder(self):
        d = os.path.join(self.st.get('root'), 'uploads')
        os.makedirs(d, exist_ok=True)
        return d

    def today(self, uid):
        return self.db.execute('SELECT COUNT(*) FROM wkm_uploads WHERE uid=? AND ts>?', (uid, int(time.time()) - 86400)).fetchone()[0]

    def add(self, uid, path, title, artist, kind, dur, size):
        uid_ = hashlib.sha1(('%s|%s|%s' % (uid, path, time.time())).encode()).hexdigest()[:16]
        now = int(time.time())
        with self.db:
            self.db.execute('INSERT INTO wkm_uploads VALUES(?,?,?,?,?,?,?,?,?,?,0)',
                            (uid_, uid, title[:150], artist[:80], kind, float(dur), path, int(size), now, now))
        return uid_

    def remove(self, ref):
        with self.db:
            self.db.execute('UPDATE wkm_uploads SET removed=1 WHERE id=?', (ref,))

    def _item(self, r):
        rid, uid, title, artist, kind, dur, path = r
        pol = Policy(mode='relay', cache='keep', background=True, group=True, attribution=artist)
        return Item(src=self.name, ref=rid, title=title, artist=artist, duration=dur, kind=kind, policy=pol, input=path)

    async def search(self, q, limit=15, uid=0):
        like = '%' + q.replace('%', '').replace('_', '') + '%'
        rows = self.db.execute('SELECT id,uid,title,artist,kind,dur,path FROM wkm_uploads WHERE removed=0 AND (title LIKE ? OR artist LIKE ?) '
                               'ORDER BY ts DESC LIMIT ?', (like, like, int(limit))).fetchall()
        return [self._item(r) for r in rows]

    async def mine(self, uid, limit=50):
        rows = self.db.execute('SELECT id,uid,title,artist,kind,dur,path FROM wkm_uploads WHERE removed=0 AND uid=? ORDER BY ts DESC LIMIT ?',
                               (uid, int(limit))).fetchall()
        return [self._item(r) for r in rows]

    async def resolve(self, ref, uid=0):
        r = self.db.execute('SELECT id,uid,title,artist,kind,dur,path FROM wkm_uploads WHERE id=? AND removed=0', (str(ref),)).fetchone()
        if not r or not os.path.isfile(r[6]):
            raise AdapterError('not_found', 404)
        return self._item(r)


# --------------------------------------------------------------------------------------------- YouTube (official API, embed only)
ISO = re.compile(r'P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?')
YT_ID = re.compile(r'^[A-Za-z0-9_-]{11}$')


def iso_seconds(v):
    m = ISO.fullmatch(v or '')
    if not m:
        return 0.0
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return float(((d * 24 + h) * 60 + mi) * 60 + s)


class YouTubeAdapter(Adapter):
    """search through the YouTube Data API v3; playback stays in YouTube's own player (Policy.mode = embed).

    YouTube API Services Developer Policies III.E.1.a (no download / cache / store without YouTube's prior written approval),
    III.I.7 (no separating audio), III.I.9 (no background player). A relay of YouTube streams is therefore not built here.
    """
    name = 'yt'
    API = 'https://www.googleapis.com/youtube/v3/'

    def __init__(self, settings, session_factory):
        self.st, self.session = settings, session_factory
        self.memo = {}

    def policy(self, vid):
        return Policy(mode='embed', cache='none', background=False, group=True, attribution='YouTube',
                      link='https://www.youtube.com/watch?v=' + vid)

    async def _get(self, path, **params):
        key = self.st.get('youtube_api_key')
        if not key:
            raise AdapterError('youtube_search_off', 503)
        params['key'] = key
        url = self.API + path + '?' + urllib.parse.urlencode(params)
        async with self.session().get(url, timeout=12) as r:
            body = await r.text()
            if r.status == 403 and 'quota' in body.lower():
                raise AdapterError('youtube_quota', 429)
            if r.status != 200:
                raise AdapterError('youtube_api_%d' % r.status, 502)
            return json.loads(body)

    async def search(self, q, limit=15, uid=0):
        k = (q.lower(), int(limit))
        hit = self.memo.get(k)
        if hit and hit[0] > time.time():
            return hit[1]
        s = await self._get('search', part='snippet', type='video', maxResults=min(int(limit), 25), q=q, safeSearch='moderate')
        ids = [x['id']['videoId'] for x in s.get('items', []) if x.get('id', {}).get('videoId')]
        if not ids:
            return []
        v = await self._get('videos', part='snippet,contentDetails,status', id=','.join(ids))
        out = []
        for x in v.get('items', []):
            if not x.get('status', {}).get('embeddable', True):
                continue
            sn = x.get('snippet', {})
            th = (sn.get('thumbnails') or {})
            thumb = (th.get('high') or th.get('medium') or th.get('default') or {}).get('url', '')
            out.append(Item(src=self.name, ref=x['id'], title=sn.get('title', ''), artist=sn.get('channelTitle', ''),
                            duration=iso_seconds(x.get('contentDetails', {}).get('duration')), thumb=thumb, kind='video',
                            policy=self.policy(x['id'])))
        self.memo[k] = (time.time() + 1800, out)            # search.list is 100 calls a day: same words = same answer for 30 min
        if len(self.memo) > 500:
            self.memo.clear()
        return out

    async def resolve(self, ref, uid=0):
        if not YT_ID.match(str(ref)):
            raise AdapterError('bad_ref')
        return Item(src=self.name, ref=ref, title='', kind='video', policy=self.policy(ref))


class Registry:
    def __init__(self):
        self.by = {}

    def add(self, a):
        self.by[a.name] = a
        return a

    def get(self, name):
        a = self.by.get(name)
        if not a:
            raise AdapterError('bad_source')
        return a

    async def search(self, q, names, limit, uid):
        out, errs = [], {}
        for n in names:
            try:
                out.extend(await self.get(n).search(q, limit, uid))
            except AdapterError as e:
                errs[n] = e.code
        return out, errs
