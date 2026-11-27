"""WAKHAN 2.0 «سینما › سالون» (parts 1-9). Part 1: the salon list (my salon, followed, joined, recent), discovering salons,
creating the personal salon and checking a code before entering.

Built on what the server already has, nothing rewritten:
  rooms + wm_personal_cinemas (one durable salon per account, its code never changes),
  wm51_halls (name, photo, who may enter / speak), wm51_visits (recent), wka_room_favorites (followed),
  wka_room_layout (seats 2-16), wka_room_meta (topic), CIN / CV (what is playing, who is present and speaking).
New: wks_salon (decor + how many may be present) and wks_members (joined salons).
The old name «دنج» is only an interface word; codes, owners, links and history stay as they are.

Parts 2-9 (same rules: the room engine is used as it is, nothing rewritten):
  knocking at the door (wks_knocks; the owner admits / rejects; «admit and raise the limit by one» is one checked step),
  how many may be present (wks_salon.cap) and «I approve entries» (wks_salon.approval), invites (wks_members via 'invite'),
  the audience, removing someone (the engine's own kick), closing the chat for one person (wks_chatban, enforced on the
  room chat), the playback assistant (the engine's room_hosts, one per salon), the play queue (the engine's queue_v12 +
  friends' suggestions waiting for the owner), playing Wakhan Archive / YouTube for everyone (only versions with the
  group-playback right), checking a pasted link, the salon profile (name, photo, background, dim, seats, limit, entry,
  mic, chat), members, the film night (wks_events) and reports (the existing wka_reports).

Privacy (the hall's existing «enter» rule): all = public, friends = owner's friends, closed = invite (members + the owner).
A private salon is listed only to the people allowed into it; the same check runs when entering.
"""
import asyncio
import hashlib
import random
import re
import time
import unicodedata

from urllib.parse import quote as quote_url

from wakhan_me import MeError

DECORS = ('pamir', 'valley', 'redhall', 'river')
PRIVACY = {'all': 'all', 'friends': 'friends', 'invite': 'closed'}
PRIVACY_BACK = {'all': 'all', 'friends': 'friends', 'closed': 'invite'}
MIC = ('all', 'friends', 'owner')
CODE = re.compile(r'^[A-Z0-9]{4,8}$')
KEY = re.compile(r'^[a-f0-9]{32}$')
ART = '/s/wk2/salon/'


class Salon:
    def __init__(self, app, me):
        self.app, self.n, self.me = app, app.n, me
        self.db = self.n['DB']

    # ------------------------------------------------------------ setup
    def init(self):
        with self.db:
            self.db.executescript("""
CREATE TABLE IF NOT EXISTS wks_salon(code TEXT PRIMARY KEY,decor TEXT NOT NULL DEFAULT 'pamir',cap INTEGER NOT NULL DEFAULT 0,ts INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS wks_members(code TEXT NOT NULL,uid INTEGER NOT NULL,via TEXT NOT NULL DEFAULT 'admit',ts INTEGER NOT NULL,PRIMARY KEY(code,uid));
CREATE INDEX IF NOT EXISTS wks_members_uid ON wks_members(uid,ts);
CREATE TABLE IF NOT EXISTS wks_ops(uid INTEGER NOT NULL,key TEXT NOT NULL,code TEXT NOT NULL,ts INTEGER NOT NULL,PRIMARY KEY(uid,key));
CREATE TABLE IF NOT EXISTS wks_knocks(code TEXT NOT NULL,uid INTEGER NOT NULL,status TEXT NOT NULL,ts INTEGER NOT NULL,PRIMARY KEY(code,uid));
CREATE TABLE IF NOT EXISTS wks_chatban(code TEXT NOT NULL,uid INTEGER NOT NULL,ts INTEGER NOT NULL,PRIMARY KEY(code,uid));
CREATE TABLE IF NOT EXISTS wks_events(code TEXT PRIMARY KEY,title TEXT NOT NULL,ts INTEGER NOT NULL,remind INTEGER NOT NULL DEFAULT 1,made INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS wks_chatfrom(code TEXT NOT NULL,uid INTEGER NOT NULL,since INTEGER NOT NULL DEFAULT 0,left_at INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(code,uid));
""")
            cols = {r[1] for r in self.db.execute('PRAGMA table_info(wks_salon)')}
            for col, ddl in (('dim', 'REAL NOT NULL DEFAULT 0.25'), ('approval', 'INTEGER NOT NULL DEFAULT 0'), ('share', 'INTEGER NOT NULL DEFAULT 1')):
                if col not in cols:
                    self.db.execute('ALTER TABLE wks_salon ADD COLUMN %s %s' % (col, ddl))

    def hooks(self):
        """members of an invite salon may enter it (the hall's own rule says «closed» to everyone but the owner)"""
        hall = self.n.get('WM_HALL51')
        if not hall or getattr(hall.allowed, 'wks', False):
            return
        old = hall.allowed

        def decide(code, uid, what):
            r = old(code, uid, what)
            try:
                if what == 'enter':
                    if r in ('hall_closed', 'hall_friends') and (self.member(code, uid) or self.admitted(code, uid)):
                        return None
                    if r is None:
                        return self.door(code, uid)
                elif what == 'chat' and r is None and self.chat_banned(code, uid):
                    return 'salon_chat_off'
            except Exception:
                pass
            return r

        def allowed(code, uid, what):
            r = decide(code, uid, what)
            if what == 'enter' and r is None:
                try:
                    self.came_in(code, uid)
                except Exception:
                    pass
            return r
        allowed.wks = True
        hall.allowed = allowed
        self.hook_chat()
        self.hook_audience()

    # ------------------------------------------------------------ chat after leaving
    # Someone who leaves the salon and comes back sees only the messages written after their return;
    # people who stayed keep seeing the earlier ones. (Minimising is not leaving.)
    def came_in(self, code, uid):
        code, uid = str(code or '').upper(), int(uid)
        if not code:
            return
        row = self.db.execute('SELECT since,left_at FROM wks_chatfrom WHERE code=? AND uid=?', (code, uid)).fetchone()
        now = int(time.time())
        left = bool(row and row[1] and now - row[1] >= 3)       # requests still in flight right after leaving do not count
        if left or uid not in self.present(code):
            with self.db:
                self.db.execute('INSERT INTO wks_chatfrom(code,uid,since,left_at) VALUES(?,?,?,0) ON CONFLICT(code,uid) DO UPDATE SET since=excluded.since,left_at=0', (code, uid, now))

    def chat_since(self, code, uid):
        row = self.db.execute('SELECT since FROM wks_chatfrom WHERE code=? AND uid=?', (str(code or '').upper(), int(uid))).fetchone()
        return int(row[0]) if row and row[0] else 0

    def hook_chat(self):
        com = self.n.get('WM_COMMUNITY70')
        orig = getattr(com, 'room_messages', None)
        if not callable(orig) or getattr(orig, 'wks', False):
            return
        import inspect
        try:
            names = list(inspect.signature(orig).parameters)
        except (TypeError, ValueError):
            names = []

        def who(a, k):
            got = dict(zip(names, a))
            got.update(k)
            uid = got.get('uid', got.get('viewer', a[0] if a else None))
            code = got.get('code', got.get('room', a[1] if len(a) > 1 else None))
            return uid, code

        def keep(result, a, k):
            try:
                uid, code = who(a, k)
                since = self.chat_since(code, uid) if uid is not None and code else 0
                if since and isinstance(result, dict) and isinstance(result.get('messages'), list):
                    result['messages'] = [m for m in result['messages'] if int((m or {}).get('ts') or 0) >= since]
            except Exception:
                pass
            return result

        def room_messages(*a, **k):
            result = orig(*a, **k)
            if inspect.isawaitable(result):
                async def later():
                    return keep(await result, a, k)
                return later()
            return keep(result, a, k)
        room_messages.wks = True
        com.room_messages = room_messages

    def hook_audience(self):
        """people watching from the audience (inside the salon, not on a seat) read and write the salon chat too;
        the community module only knows seats, so a missing seat is accepted for someone present in a salon"""
        com = self.n.get('WM_COMMUNITY70')
        orig = getattr(com, 'room', None)
        if not callable(orig) or getattr(orig, 'wks', False):
            return
        import inspect

        async def room(uid, code, *a, **k):
            try:
                return await orig(uid, code, *a, **k)
            except Exception as e:
                if getattr(e, 'code', None) != 'seat_required' or not isinstance(code, str):
                    raise
                c = self.n['CIN'].get('r:' + code)
                try:
                    inside = c is not None and self.n['room_ok'](code) and int(uid) in self.present(code) and int(uid) not in (c.get('ban') or ())
                except Exception:
                    inside = False
                if not inside:
                    raise
                ent = getattr(com, 'personal', None)
                if ent is not None:
                    got = ent.entitlement(uid)
                    got = await got if inspect.isawaitable(got) else got
                    if not (got or {}).get('allowed'):
                        raise type(e)('subscription', 403)
                return c
        room.wks = True
        com.room = room

    async def api_left(self, req, uid):
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        with self.db:
            self.db.execute('INSERT INTO wks_chatfrom(code,uid,since,left_at) VALUES(?,?,0,?) ON CONFLICT(code,uid) DO UPDATE SET left_at=excluded.left_at', (code, uid, int(time.time())))
        return {'ok': True}

    def wipe(self, uid):
        with self.db:
            self.db.execute('DELETE FROM wks_members WHERE uid=?', (int(uid),))
            self.db.execute('DELETE FROM wks_knocks WHERE uid=?', (int(uid),))
            self.db.execute('DELETE FROM wks_chatban WHERE uid=?', (int(uid),))
            self.db.execute('DELETE FROM wks_chatfrom WHERE uid=?', (int(uid),))
            self.db.execute('DELETE FROM wks_ops WHERE uid=?', (int(uid),))

    # ------------------------------------------------------------ helpers
    @property
    def hall(self):
        return self.n['WM_HALL51']

    def q(self, sql, *a):
        return self.db.execute(sql, a).fetchall()

    def member(self, code, uid):
        return bool(self.q('SELECT 1 FROM wks_members WHERE code=? AND uid=?', code, int(uid)))

    def friend(self, a, b):
        try:
            return self.n['WM_COMMUNITY70'].relation(int(a), int(b)) == 'accepted'
        except Exception:
            return False

    def room_ok(self, code):
        try:
            return bool(self.n['room_ok'](code))
        except Exception:
            return False

    def live(self, code):
        """people present, and what the salon is doing: watching / music / talking / idle"""
        c = (self.n.get('CIN') or {}).get('r:' + code) or {}
        v = (self.n.get('CV') or {}).get('r:' + code) or {}
        people = {int(x['id']) for x in (c.get('seats') or []) if x}
        voice = v.get('m') or {}
        people |= {int(k) for k in voice}
        status, now = 'idle', ''
        if c.get('playing') and (c.get('vid') or c.get('media')):
            media = c.get('media') if isinstance(c.get('media'), dict) else {}
            kind = str(media.get('kind') or '')
            music = kind in ('soundcloud', 'audio', 'music') or c.get('provider') == 'soundcloud' or str(c.get('vid') or '').startswith('sc:')
            status = 'music' if music else 'watching'
            now = str(c.get('title') or media.get('title') or '')[:80]
        elif any(not int(m.get('mute', 1)) for m in voice.values() if isinstance(m, dict)):
            status = 'talking'
        return len(people), status, now

    def seats(self, code):
        r = self.q('SELECT seats FROM wka_room_layout WHERE code=?', code) if self.has('wka_room_layout') else []
        return int(r[0][0]) if r else 10

    def has(self, table):
        return bool(self.q("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", table))

    def visible(self, code, viewer, info=None):
        """may this person see the salon in a list?"""
        info = info or self.hall.info(code, viewer)
        if not info or not info.get('configured'):
            return False
        owner = int(info['owner_id'])
        if owner == int(viewer) or self.member(code, viewer):
            return True
        if self.hall.banned(owner, int(viewer), 'ban'):
            return False
        if info.get('enter') == 'friends':
            return self.friend(owner, viewer)
        return info.get('enter') != 'closed'

    def row(self, code, viewer, info=None, **extra):
        info = info or self.hall.info(code, viewer)
        if not info or not info.get('configured'):
            return None
        n, status, now = self.live(code)
        extra_row = self.q('SELECT decor,cap FROM wks_salon WHERE code=?', code)
        decor, cap = extra_row[0] if extra_row else ('pamir', 0)
        seats = self.seats(code)
        topic = ''
        if self.has('wka_room_meta'):
            t = self.q('SELECT topic FROM wka_room_meta WHERE code=?', code)
            topic = t[0][0] if t else ''
        out = {'configured': True, 'notice': str(info.get('notice') or '')[:300], 'code': code, 'name': info.get('name') or '', 'photo': info.get('photo') or None, 'decor': decor if decor in DECORS else 'pamir',
               'live': n, 'status': status, 'now': now, 'seats': seats, 'cap': int(cap) or seats, 'privacy': PRIVACY_BACK.get(info.get('enter'), 'all'),
               'topic': topic, 'owner': int(info['owner_id'])}
        out.update(extra)
        return out

    def mine_code(self, uid):
        # Listing must never reserve a room or rewrite its ownership.
        r = self.q('SELECT code FROM wm_personal_cinemas WHERE uid=?', int(uid))
        return r[0][0] if r else None

    # ------------------------------------------------------------ API
    async def api_home(self, req, uid):
        mine = self.mine_code(uid)
        seen = {mine} if mine else set()

        def collect(rows, **kw):
            out = []
            for code, ts in rows:
                if code in seen or not self.room_ok(code):
                    continue
                info = self.hall.info(code, uid)
                if not info or not self.visible(code, uid, info):
                    continue
                seen.add(code)
                r = self.row(code, uid, info, **({'visited': int(ts)} if kw.get('visit') else {}))
                if r:
                    out.append(r)
                if len(out) >= 50:
                    break
            return out
        followed = collect(self.q('SELECT code,ts FROM wka_room_favorites WHERE uid=? ORDER BY ts DESC LIMIT 120', uid) if self.has('wka_room_favorites') else [])
        joined = collect(self.q('SELECT code,ts FROM wks_members WHERE uid=? ORDER BY ts DESC LIMIT 120', uid))
        recent = collect(self.q('SELECT code,ts FROM wm51_visits WHERE uid=? ORDER BY ts DESC LIMIT 120', uid) if self.has('wm51_visits') else [], visit=True)
        return {'ok': True, 'mine': self.row(mine, uid) if mine and self.room_ok(mine) else None,
                'followed': followed, 'joined': joined, 'recent': recent}

    async def api_discover(self, req, uid):
        f = str(req.query.get('f') or 'all')
        if f not in ('all', 'watch', 'music', 'talk', 'friends'):
            raise MeError('bad_input')
        q = re.sub(r'\s+', ' ', str(req.query.get('q') or '')).strip()[:40]
        self.me.slow(uid, 'salon_find', 60, 60)
        out = []
        for h in self.hall.directory(uid, q):
            code = h['code']
            info = self.hall.info(code, uid)
            if not info or not self.visible(code, uid, info):
                continue
            r = self.row(code, uid, info)
            if not r:
                continue
            if f == 'watch' and r['status'] != 'watching' or f == 'music' and r['status'] != 'music' or f == 'talk' and r['status'] != 'talking':
                continue
            if f == 'friends' and not self.friend(r['owner'], uid):
                continue
            r['friend'] = self.friend(r['owner'], uid)
            out.append(r)
        order = {'watching': 0, 'music': 1, 'talking': 2, 'idle': 3}
        out.sort(key=lambda r: (order.get(r['status'], 3), -r['live']))
        return {'ok': True, 'items': out[:60]}

    async def api_check(self, req, uid):
        b = await self.me.body(req)
        self.me.slow(uid, 'salon_code', 30, 60)
        code = re.sub(r'[^A-Z0-9]', '', str(b.get('code') or '').upper())[:8]
        if not CODE.match(code):
            raise MeError('bad_code')
        if not self.room_ok(code):
            raise MeError('not_found', 404)
        info = self.hall.info(code, uid)
        if not info:
            raise MeError('not_found', 404)
        err = self.hall.allowed(code, uid, 'enter')
        reason = {'hall_closed': 'invite', 'hall_friends': 'friends', 'hall_banned': 'banned'}.get(err, 'closed') if err else None
        return {'ok': True, 'code': code, 'name': info.get('name') or '', 'can_enter': err is None, 'reason': reason}

    async def api_create(self, req, uid):
        b = await self.me.body(req)
        key = str(b.get('client_key') or '')
        if not KEY.match(key):
            raise MeError('bad_input')
        done = self.q('SELECT code FROM wks_ops WHERE uid=? AND key=?', uid, key)      # the same request again (e.g. after the connection dropped)
        if done and self.room_ok(done[0][0]):
            return {'ok': True, 'code': done[0][0], 'existing': False}
        existing = self.mine_code(uid)
        if existing and (self.hall.info(existing, uid) or {}).get('configured'):
            return {'ok': True, 'code': existing, 'existing': True}
        name = ' '.join(''.join(c for c in str(b.get('name') or '') if not unicodedata.category(c).startswith('C')).split())[:40]
        if not name:
            raise MeError('name')
        seats = b.get('seats')
        if type(seats) is not int or not 2 <= seats <= 16:
            raise MeError('bad_input')
        privacy, mic = b.get('privacy'), b.get('mic')
        if privacy not in PRIVACY or mic not in MIC:
            raise MeError('bad_input')
        decor, photo = b.get('decor'), b.get('photo')
        if photo is not None and not isinstance(photo, str):
            raise MeError('bad_input')
        if not photo and decor not in DECORS:
            raise MeError('bad_input')
        self.me.slow(uid, 'salon_create', 3, 60)
        photo_key = ''
        if photo:
            try:
                data = await asyncio.to_thread(self.hall.photo_bytes, photo)
            except ValueError as e:
                raise MeError(str(e) or 'photo_invalid')
            photo_key = self.hall.store(data)
        self.hall.init()
        now = int(time.time())
        alphabet = self.n.get('ROOMCH') or 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        code = None
        with self.db:                                    # one transaction: the code, the salon and its settings appear together
            again = self.q('SELECT code FROM wm_personal_cinemas WHERE uid=?', uid)
            if again:
                code = again[0][0]
                if (self.hall.info(code, uid) or {}).get('configured'):
                    if photo_key:
                        (self.hall.dir / photo_key).unlink(missing_ok=True)
                    return {'ok': True, 'code': code, 'existing': True}
                if not self.room_ok(code) or self.owner_of(code) != int(uid):
                    raise MeError('not_found', 404)
                self.db.execute('UPDATE wm_personal_cinemas SET name=? WHERE uid=?', (name, uid))
            else:
                for _ in range(40):
                    c = ''.join(random.choice(alphabet) for _ in range(6))
                    if self.q('SELECT 1 FROM rooms WHERE code=?', c) or self.q('SELECT 1 FROM wm_personal_cinemas WHERE code=?', c):
                        continue
                    try:
                        if self.n['wmr_code_revoked'](c):
                            continue
                    except Exception:
                        pass
                    code = c
                    break
                if not code:
                    raise MeError('server', 503)
                self.db.execute('INSERT INTO rooms VALUES(?,?,?)', (code, uid, now))
                self.db.execute('INSERT INTO wm_personal_cinemas VALUES(?,?,?,?)', (uid, code, name, now))
            self.db.execute('INSERT INTO wm51_halls(uid,ts) VALUES(?,?) ON CONFLICT(uid) DO NOTHING', (uid, now))
            self.db.execute('UPDATE wm51_halls SET name=?,photo=?,enter=?,mic=?,ts=? WHERE uid=?', (name, photo_key, PRIVACY[privacy], mic, now, uid))
            if self.has('wka_room_layout'):
                self.db.execute('INSERT INTO wka_room_layout(code,seats) VALUES(?,?) ON CONFLICT(code) DO UPDATE SET seats=excluded.seats', (code, seats))
            self.db.execute('INSERT OR REPLACE INTO wks_salon(code,decor,cap,ts) VALUES(?,?,?,?)', (code, decor if decor in DECORS else 'pamir', seats, now))
            self.db.execute('INSERT OR REPLACE INTO wks_ops VALUES(?,?,?,?)', (uid, key, code, now))
        return {'ok': True, 'code': code, 'existing': False}

    # ============================================================ parts 2-9
    KNOCK_TTL = 600            # a knock waits 10 minutes
    ADMIT_TTL = 300            # an admission stays valid 5 minutes
    PRESENT = 45               # seconds since the last poll that still count as «present»

    def ns(self, name):
        return self.n[name]

    def state(self, code):
        return (self.n.get('CIN') or {}).get('r:' + code)

    def present(self, code):
        c = self.state(code)
        if not c:
            return []
        now, ban = time.time(), c.get('ban') or set()
        seated = {int(x['id']) for x in c['seats'] if x}
        return [int(u) for u, t in (c.get('seen') or {}).items() if (now - t < self.PRESENT or int(u) in seated) and int(u) not in ban]

    def setting(self, code):
        r = self.q('SELECT decor,cap,dim,approval,share FROM wks_salon WHERE code=?', code)
        seats = self.seats(code)
        if not r:
            return {'decor': 'pamir', 'limit': seats, 'dim': .25, 'approval': False, 'share': True}
        decor, cap, dim, approval, share = r[0]
        return {'decor': decor if decor in DECORS else 'pamir', 'limit': int(cap) if cap and 1 <= int(cap) <= 16 else seats, 'dim': float(dim if dim is not None else .25),
                'approval': bool(approval), 'share': bool(share if share is not None else 1)}

    def put(self, code, **kv):
        now = int(time.time())
        with self.db:
            self.db.execute('INSERT INTO wks_salon(code,decor,cap,ts) VALUES(?,?,?,?) ON CONFLICT(code) DO NOTHING', (code, 'pamir', self.seats(code), now))
            for k, v in kv.items():
                self.db.execute('UPDATE wks_salon SET %s=?,ts=? WHERE code=?' % {'limit': 'cap'}.get(k, k), (v, now, code))

    def owner_of(self, code):
        try:
            return self.hall.owner(code)
        except Exception:
            return None

    def is_owner(self, code, uid):
        return int(uid) == (self.owner_of(code) or -1) or int(uid) == int(self.n.get('OWNER') or 0)

    def can_play(self, code, uid):
        try:
            return bool(self.n['room_can'](code, int(uid)))
        except Exception:
            return self.is_owner(code, uid)

    def need_owner(self, code, uid):
        if not self.room_ok(code):
            raise MeError('not_found', 404)
        if not self.is_owner(code, uid):
            raise MeError('owner_only', 403)

    def code_of(self, value):
        code = re.sub(r'[^A-Z0-9]', '', str(value or '').upper())[:8]
        if not CODE.match(code):
            raise MeError('bad_code')
        return code

    def target(self, value):
        try:
            t = int(value)
        except (TypeError, ValueError):
            raise MeError('bad_user')
        if not 0 < t < 2 ** 53:
            raise MeError('bad_user')
        return t

    def person(self, uid, viewer=0):
        p = {}
        try:
            p = self.n['WM_COMMUNITY70'].public(int(uid), int(viewer)) or {}
        except Exception:
            p = {}
        name = p.get('name') or p.get('first_name')
        if not name:
            try:
                name = self.hall.uname(int(uid))
            except Exception:
                name = ''
        return {'id': int(uid), 'name': name or '', 'username': p.get('username') or '', 'avatar': p.get('avatar') or '/ava/%d' % int(uid)}

    def admitted(self, code, uid):
        r = self.q("SELECT ts FROM wks_knocks WHERE code=? AND uid=? AND status='admitted'", code, int(uid))
        return bool(r and time.time() - r[0][0] < self.ADMIT_TTL)

    def chat_banned(self, code, uid):
        return bool(self.q('SELECT 1 FROM wks_chatban WHERE code=? AND uid=?', code, int(uid)))

    def door(self, code, uid):
        """None = may come in; otherwise the person has to knock (approval on, or the salon is full)"""
        uid = int(uid)
        if self.is_owner(code, uid):
            return None
        c = self.state(code)
        if c and (uid in self.present(code) or any(x and int(x['id']) == uid for x in c['seats'])):
            return None
        if self.admitted(code, uid):
            return None
        st = self.setting(code)
        if st['approval'] and not self.member(code, uid):
            return 'salon_knock'
        if len(self.present(code)) >= st['limit']:
            return 'salon_full'
        return None

    def bg(self, code, owner):
        try:
            p = self.hall.settings(owner).get('bgphoto')
        except Exception:
            p = None
        return p or ART + self.setting(code)['decor'] + '.jpg'

    # ------------------------------------------------------------ entering: check (with the door) / knock / admit / reject
    async def api_check2(self, req, uid):
        r = await self.api_check(req, uid)
        if r.get('can_enter'):
            return r
        code = r['code']
        err = self.hall.allowed(code, uid, 'enter')
        reason = {'hall_closed': 'invite', 'hall_friends': 'friends', 'hall_banned': 'banned', 'salon_full': 'full', 'salon_knock': 'approval'}.get(err, r.get('reason') or 'closed')
        st = self.setting(code)
        own = self.owner_of(code)
        r.update(reason=reason, knock=reason in ('invite', 'friends', 'full', 'approval'), present=len(self.present(code)), limit=st['limit'], bg=self.bg(code, own))
        k = self.q('SELECT status,ts FROM wks_knocks WHERE code=? AND uid=?', code, uid)
        if k and k[0][0] == 'pending' and time.time() - k[0][1] < self.KNOCK_TTL:
            r['knocked'] = True
        return r

    async def api_knock(self, req, uid):
        if req.method == 'GET':
            code = self.code_of(req.query.get('code'))
            k = self.q('SELECT status,ts FROM wks_knocks WHERE code=? AND uid=?', code, uid)
            if not k:
                return {'ok': True, 'status': 'none'}
            status, ts = k[0]
            age = time.time() - ts
            if status == 'pending' and age > self.KNOCK_TTL or status == 'admitted' and age > self.ADMIT_TTL:
                status = 'expired'
            own = self.owner_of(code)
            return {'ok': True, 'status': status, 'by': self.person(own, uid)['name'] if own else ''}
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        if not self.room_ok(code):
            raise MeError('not_found', 404)
        own = self.owner_of(code)
        if own is not None and self.hall.banned(own, uid, 'ban'):
            raise MeError('hall_banned', 403)
        self.me.slow(uid, 'salon_knock', 12, 60)
        now = int(time.time())
        with self.db:
            k = self.q('SELECT status,ts FROM wks_knocks WHERE code=? AND uid=?', code, uid)
            if not (k and k[0][0] == 'pending' and now - k[0][1] < self.KNOCK_TTL):        # never a second request while one waits
                self.db.execute('INSERT OR REPLACE INTO wks_knocks VALUES(?,?,?,?)', (code, uid, 'pending', now))
        return {'ok': True, 'status': 'pending'}

    async def api_knock_cancel(self, req, uid):
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        with self.db:
            self.db.execute("UPDATE wks_knocks SET status='cancelled',ts=? WHERE code=? AND uid=? AND status='pending'", (int(time.time()), code, uid))
        return {'ok': True}

    async def api_admit(self, req, uid):
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        self.need_owner(code, uid)
        t = self.target(b.get('uid'))
        raise_ = b.get('raise') is True
        now = int(time.time())
        with self.db:                                    # checked and written in one step: two answers at once cannot overfill the salon
            k = self.q('SELECT status,ts FROM wks_knocks WHERE code=? AND uid=?', code, t)
            if not k or k[0][0] != 'pending' or now - k[0][1] > self.KNOCK_TTL:
                raise MeError('expired', 409)
            st = self.setting(code)
            limit, present = st['limit'], len([p for p in self.present(code) if p != t])
            if raise_:
                if limit >= 16:
                    raise MeError('full', 409)
                limit += 1
                self.db.execute('INSERT INTO wks_salon(code,decor,cap,ts) VALUES(?,?,?,?) ON CONFLICT(code) DO NOTHING', (code, 'pamir', self.seats(code), now))
                self.db.execute('UPDATE wks_salon SET cap=?,ts=? WHERE code=?', (limit, now, code))
            elif present >= limit:
                raise MeError('full', 409)
            self.db.execute("UPDATE wks_knocks SET status='admitted',ts=? WHERE code=? AND uid=?", (now, code, t))
            self.db.execute('INSERT OR IGNORE INTO wks_members VALUES(?,?,?,?)', (code, t, 'admit', now))
        return {'ok': True, 'limit': limit}

    async def api_reject(self, req, uid):
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        self.need_owner(code, uid)
        t = self.target(b.get('uid'))
        with self.db:
            self.db.execute("UPDATE wks_knocks SET status='rejected',ts=? WHERE code=? AND uid=? AND status='pending'", (int(time.time()), code, t))
        return {'ok': True}

    # ------------------------------------------------------------ inside: room, audience, invite, remove, chat ban
    async def api_room(self, req, uid):
        code = self.code_of(req.query.get('code'))
        info = self.hall.info(code, uid) if self.room_ok(code) else None
        if not info:
            raise MeError('not_found', 404)
        own = int(info['owner_id'])
        st = self.setting(code)
        return {'ok': True, 'code': code, 'name': info.get('name') or '', 'decor': st['decor'], 'bg': self.bg(code, own), 'dim': st['dim'],
                'photo': info.get('photo'), 'configured': bool(info.get('configured')), 'owner': self.person(own, uid), 'is_owner': self.is_owner(code, uid), 'cap': self.seats(code),
                'limit': st['limit'], 'event': self.event(code)}

    async def api_audience(self, req, uid):
        code = self.code_of(req.query.get('code'))
        c = self.state(code)
        own = self.owner_of(code)
        kicked = bool(c and uid in (c.get('ban') or set()))
        seated = {int(x['id']) for x in (c['seats'] if c else []) if x}
        present = self.present(code)
        voice = ((self.n.get('CV') or {}).get('r:' + code) or {}).get('m') or {}
        out = {'ok': True, 'kicked': kicked, 'present': len(present), 'limit': self.setting(code)['limit'],
               'people': [self.person(p, uid) for p in present if p not in seated][:40],
               'mic': {str(k): int(v.get('mute', 1)) for k, v in voice.items() if isinstance(v, dict)},
               'me_mic_locked': bool(own is not None and own != uid and self.hall.banned(own, uid, 'mute')),
               'me_chat_banned': self.chat_banned(code, uid)}
        if self.is_owner(code, uid):
            now = int(time.time())
            out['knocks'] = [dict(self.person(k, uid), ts=ts) for k, ts in self.q("SELECT uid,ts FROM wks_knocks WHERE code=? AND status='pending' AND ts>? ORDER BY ts", code, now - self.KNOCK_TTL)]
            out['chat_banned'] = [r[0] for r in self.q('SELECT uid FROM wks_chatban WHERE code=?', code)]
        return out

    async def api_invite(self, req, uid):
        if req.method == 'GET':
            code = self.code_of(req.query.get('code'))
            if not self.room_ok(code):
                raise MeError('not_found', 404)
            invited = {r[0] for r in self.q("SELECT uid FROM wks_members WHERE code=? AND via='invite'", code)}
            online = set()
            try:
                online = {int(x) for x in self.n['WM_PRESENCE'].online()}
            except Exception:
                pass
            try:
                fr = self.n['WM_COMMUNITY70'].friends(uid).get('friends') or []
            except Exception:
                fr = []
            friends = [{'id': int(f['id']), 'name': f.get('name') or '', 'avatar': f.get('avatar') or '/ava/%d' % int(f['id']),
                        'online': bool(f.get('online')) or int(f['id']) in online, 'invited': int(f['id']) in invited} for f in fr if f.get('id')]
            return {'ok': True, 'code': code, 'link': 'https://music.kabulcafe.uk/r/' + code, 'friends': friends}
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        if not self.room_ok(code):
            raise MeError('not_found', 404)
        t = self.target(b.get('uid'))
        if not (self.is_owner(code, uid) or self.member(code, uid) or uid in self.present(code)):
            raise MeError('forbidden', 403)
        if not self.friend(uid, t):
            raise MeError('not_friends', 403)
        self.me.slow(uid, 'salon_invite', 30, 60)
        with self.db:
            self.db.execute('INSERT OR IGNORE INTO wks_members VALUES(?,?,?,?)', (code, t, 'invite', int(time.time())))
        try:                                             # a private message with the link, through the existing chat
            await self.n['WM_COMMUNITY70'].send_dm(uid, {'to': t, 'text': 'https://music.kabulcafe.uk/r/' + code})
        except Exception:
            pass
        return {'ok': True}

    async def api_kick(self, req, uid):
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        self.need_owner(code, uid)
        t = self.target(b.get('uid'))
        if t == uid:
            raise MeError('bad_user')
        c = self.n['cin']('r:' + code)
        c.setdefault('ban', set()).add(t)
        try:
            self.db.execute('DELETE FROM room_hosts WHERE code=? AND uid=?', (code, t))
            self.db.commit()
        except Exception:
            pass
        self.hall.kick(code, t)
        c['seen'].pop(t, None)
        self.n['cbump'](c)
        return {'ok': True}

    async def api_chatban(self, req, uid):
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        self.need_owner(code, uid)
        t = self.target(b.get('uid'))
        with self.db:
            if b.get('on'):
                self.db.execute('INSERT OR REPLACE INTO wks_chatban VALUES(?,?,?)', (code, t, int(time.time())))
            else:
                self.db.execute('DELETE FROM wks_chatban WHERE code=? AND uid=?', (code, t))
        return {'ok': True, 'banned': [r[0] for r in self.q('SELECT uid FROM wks_chatban WHERE code=?', code)]}

    # ------------------------------------------------------------ playing for everyone: archive / YouTube, queue, link check
    def load(self, code, uid, value, thumb=''):
        """put something on the screen of the salon, exactly like the engine's own «load» does"""
        c = self.n['cin']('r:' + code)
        try:
            self.n['WM_CINEMA'].remember(c)
        except Exception:
            pass
        c.update(value, t=0.0, playing=True, ts=time.time(), by=self.person(uid)['name'], wks_thumb=thumb)
        try:
            self.n['WM_SYNC'].mark_action(c, 'load')
        except Exception:
            pass
        self.n['cbump'](c)
        return c

    def close_screen(self, code, uid):
        """the owner / playback assistant closes the screen for everyone (the queue stays)"""
        c = self.n['cin']('r:' + code)
        if not c.get('vid'):
            return c
        try:
            self.n['WM_CINEMA'].remember(c)
        except Exception:
            pass
        c.update(provider='youtube', media=None, vid='', title='', ch='', t=0.0, playing=False, ts=time.time(), by=self.person(uid)['name'], wks_thumb='')
        try:
            self.n['WM_SYNC'].mark_action(c, 'end')
        except Exception:
            pass
        self.n['cbump'](c)
        return c

    async def api_screen(self, req, uid):
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        if not self.room_ok(code):
            raise MeError('not_found', 404)
        if not self.can_play(code, uid):
            raise MeError('host', 403)
        if b.get('action') != 'close':
            raise MeError('bad_input')
        self.close_screen(code, uid)
        return {'ok': True}

    YT_SEEN = {}

    async def yt_check(self, vid):
        """YouTube answers 401/403 for videos whose owner does not allow other apps, 404 for removed / private ones"""
        hit = self.YT_SEEN.get(vid)
        if hit and time.time() - hit[1] < 3600:
            return hit[0]
        verdict = None
        try:
            import aiohttp
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=3)) as s:   # never hold «play» long
                async with s.get('https://www.youtube.com/oembed?format=json&url=' + quote_url('https://www.youtube.com/watch?v=' + vid)) as r:
                    verdict = 'unplayable' if r.status in (401, 403) else 'not_found' if r.status == 404 else None
        except Exception:
            return None                                   # YouTube not reachable: do not block
        if len(self.YT_SEEN) > 2000:
            self.YT_SEEN.clear()
        self.YT_SEEN[vid] = (verdict, time.time())
        return verdict

    async def entry(self, uid, item, need_room=True):
        """a queue / screen entry for a YouTube video or a Wakhan Archive version"""
        src = str(item.get('src') or '')
        if src == 'youtube':
            vid = str(item.get('ref') or item.get('vid') or '')
            if not re.fullmatch(r'[\w-]{11}', vid):
                raise MeError('bad_link')
            bad = await self.yt_check(vid)
            if bad:
                raise MeError(bad)
            return {'vid': vid, 'title': str(item.get('title') or '')[:150], 'ch': str(item.get('ch') or '')[:60], 'provider': 'youtube', 'media': None}, 'https://i.ytimg.com/vi/%s/mqdefault.jpg' % vid
        if src == 'archive':
            arc = self.n['WKS_ARCHIVE']
            tid, ep, sid = str(item.get('ref') or item.get('id') or ''), str(item.get('ep') or ''), str(item.get('version') or '') or None
            media, row = await arc.media(tid, ep, sid, need_room=need_room)
            title = str(item.get('title') or media.get('title') or row['title'])[:150]
            from wakhan_archive import NAMES
            vid = 'wm12:' + hashlib.sha256((row['provider'] + row['url']).encode()).hexdigest()[:24]
            return {'vid': vid, 'title': title, 'ch': NAMES.get(row['provider'], ''), 'provider': 'archive' if row['provider'] in ('commons', 'peertube') else row['provider'], 'media': media}, row['thumb'] or str(item.get('thumb') or '')
        raise MeError('bad_input')

    async def api_play(self, req, uid):
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        if not self.room_ok(code):
            raise MeError('not_found', 404)
        if not self.can_play(code, uid):
            raise MeError('host', 403)
        kind = b.get('kind')
        if kind == 'youtube':
            value, thumb = await self.entry(uid, {'src': 'youtube', 'ref': b.get('vid'), 'title': b.get('title'), 'ch': b.get('ch')})
        elif kind == 'archive':
            value, thumb = await self.entry(uid, {'src': 'archive', 'ref': b.get('id'), 'ep': b.get('ep'), 'version': b.get('version')})
        else:
            raise MeError('bad_input')
        self.load(code, uid, value, thumb)
        return {'ok': True}

    def queue_view(self, code, uid):
        c = self.state(code) or {}
        def card(x):
            return {'id': x.get('wks_id') or 0, 'title': x.get('title') or '', 'src': 'youtube' if x.get('provider') == 'youtube' else 'archive',
                    'thumb': x.get('wks_thumb') or ('https://i.ytimg.com/vi/%s/mqdefault.jpg' % x['vid'] if x.get('provider') == 'youtube' else ''), 'by': x.get('wks_by')}
        now = None
        if c.get('vid'):
            now = {'title': c.get('title') or '', 'src': 'youtube' if c.get('provider', 'youtube') == 'youtube' else 'archive',
                   'thumb': c.get('wks_thumb') or ('https://i.ytimg.com/vi/%s/mqdefault.jpg' % c['vid'] if c.get('provider', 'youtube') == 'youtube' else ''),
                   't': round(float(self.n['cpos'](c)) if 'cpos' in self.n else float(c.get('t') or 0), 1), 'd': 0}
        return {'ok': True, 'host': self.can_play(code, uid), 'now': now, 'next': [card(x) for x in c.get('queue_v12') or []],
                'pending': [dict(p['card'], by=p['by']) for p in c.get('wks_pend') or []]}

    async def api_queue(self, req, uid):
        if req.method == 'GET':
            code = self.code_of(req.query.get('code'))
            return self.queue_view(code, uid)
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        if not self.room_ok(code):
            raise MeError('not_found', 404)
        a, host = b.get('action'), self.can_play(code, uid)
        c = self.n['cin']('r:' + code)
        q = c.setdefault('queue_v12', [])
        pend = c.setdefault('wks_pend', [])
        seq = c.setdefault('wks_seq', [0])
        who = self.person(uid)
        if a == 'add':
            item = b.get('item') if isinstance(b.get('item'), dict) else {}
            self.me.slow(uid, 'salon_queue', 20, 60)
            if host:
                if len(q) >= 25:
                    raise MeError('queue_full', 409)
                value, thumb = await self.entry(uid, item)
                seq[0] += 1
                q.append(dict(value, wks_id=seq[0], wks_thumb=thumb, wks_by=who))
            else:
                if len(pend) >= 25 or sum(1 for p in pend if p['by']['id'] == uid) >= 3:
                    raise MeError('queue_full', 409)
                await self.entry(uid, item, need_room=True)          # checked now: a suggestion that cannot play is refused at once
                seq[0] += 1
                card = {'id': seq[0], 'title': str(item.get('title') or '')[:150], 'src': 'youtube' if item.get('src') == 'youtube' else 'archive', 'thumb': str(item.get('thumb') or '')[:300]}
                pend.append({'card': card, 'item': {k: item.get(k) for k in ('src', 'ref', 'vid', 'id', 'ep', 'version', 'title', 'ch', 'thumb')}, 'by': who})
        elif a in ('approve', 'reject', 'remove', 'move', 'play'):
            if not host:
                raise MeError('host', 403)
            i = int(b.get('id') or 0)
            if a == 'approve':
                p = next((x for x in pend if x['card']['id'] == i), None)
                if not p:
                    raise MeError('gone', 409)
                if len(q) >= 25:
                    raise MeError('queue_full', 409)
                value, thumb = await self.entry(p['by']['id'], p['item'])
                pend.remove(p)
                q.append(dict(value, wks_id=i, wks_thumb=thumb or p['card']['thumb'], wks_by=p['by']))
            elif a in ('reject', 'remove'):
                c['wks_pend'] = [x for x in pend if x['card']['id'] != i]
                c['queue_v12'] = [x for x in q if x.get('wks_id') != i]
            elif a == 'move':
                x = next((x for x in q if x.get('wks_id') == i), None)
                if x:
                    q.remove(x)
                    q.insert(max(0, min(len(q), int(b.get('to') or 0))), x)
            elif a == 'play':
                item = b.get('item') if isinstance(b.get('item'), dict) else {}
                value, thumb = await self.entry(uid, item)
                self.load(code, uid, value, thumb)
        else:
            raise MeError('bad_input')
        self.n['cbump'](c)
        return self.queue_view(code, uid)

    async def api_link(self, req, uid):
        b = await self.me.body(req)
        url = str(b.get('url') or '').strip()[:400]
        m = re.search(r'(?:youtu\.be/|[?&]v=|/shorts/|/embed/|/live/)([A-Za-z0-9_-]{11})', url)
        if not m or not re.match(r'^https?://([a-z0-9-]+\.)*(youtube\.com|youtu\.be)/', url, re.I):
            return {'ok': False, 'err': 'bad_link'}
        self.me.slow(uid, 'salon_link', 20, 60)
        vid = m.group(1)
        title = ''
        try:                                              # YouTube itself answers 401 / 404 for videos that may not be shown in other apps
            import aiohttp
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=4)) as s:
                async with s.get('https://www.youtube.com/oembed?format=json&url=' + quote_url('https://www.youtube.com/watch?v=' + vid)) as r:
                    if r.status in (401, 403):
                        return {'ok': False, 'err': 'unplayable'}
                    if r.status == 404:
                        return {'ok': False, 'err': 'not_found'}
                    if r.status == 200:
                        title = str((await r.json(content_type=None)).get('title') or '')[:150]
        except Exception:
            pass
        return {'ok': True, 'item': {'src': 'youtube', 'ref': vid, 'title': title or 'YouTube', 'thumb': 'https://i.ytimg.com/vi/%s/mqdefault.jpg' % vid}}

    async def api_wallet(self, req, uid):
        units = int(self.n['WM_WALLET'].balance(uid) or 0)
        return {'ok': True, 'balance': '%.2f' % (units / 100)}

    async def api_hosting(self, req, uid):
        """salons where this person may start playback (own salon first, then the ones where they are the assistant)"""
        out = []
        mine = self.mine_code(uid)
        if mine and self.room_ok(mine):
            r = self.row(mine, uid)
            if r:
                out.append(dict(r, own=True))
        for code, in self.q('SELECT code FROM room_hosts WHERE uid=? LIMIT 20', uid):
            if code != mine and self.room_ok(code):
                r = self.row(code, uid)
                if r:
                    out.append(dict(r, own=False))
        return {'ok': True, 'items': out}

    # ------------------------------------------------------------ the salon profile, members, assistant, film night, report
    def event(self, code):
        r = self.q('SELECT title,ts,remind FROM wks_events WHERE code=?', code)
        if not r or r[0][1] < time.time() - 6 * 3600:
            return None
        return {'title': r[0][0], 'ts': int(r[0][1]), 'remind': bool(r[0][2])}

    def profile(self, code, uid):
        info = self.hall.info(code, uid)
        if not info:
            raise MeError('not_found', 404)
        own = int(info['owner_id'])
        st, c = self.setting(code), self.state(code)
        seated = [i for i, x in enumerate(c['seats']) if x] if c else []
        hosts = [h for h in self.q('SELECT uid FROM room_hosts WHERE code=?', code)]
        present = self.present(code)
        priv = PRIVACY_BACK.get(info.get('enter'), 'all')
        return {'code': code, 'configured': bool(info.get('configured')), 'name': info.get('name') or '', 'photo': info.get('photo'), 'bg': self.bg(code, own), 'dim': st['dim'],
                'owner': self.person(own, uid), 'is_owner': self.is_owner(code, uid), 'seats': self.seats(code), 'limit': st['limit'],
                'present': len(present), 'seated': len(seated), 'min_seats': max(2, (max(seated) + 1) if seated else 2),
                'privacy': priv, 'approval': st['approval'], 'mic': 'ask' if info.get('mic') == 'owner' else 'free', 'chat': info.get('chat') != 'owner',
                'assistant': self.person(hosts[0][0], uid) if hosts else None, 'share': st['share'], 'event': self.event(code),
                'created': int(info.get('ts') or 0) or None, 'members_preview': [self.person(p, uid) for p in present[:4]],
                'link': 'https://music.kabulcafe.uk/r/' + code}

    async def api_profile(self, req, uid):
        if req.method == 'GET':
            code = self.code_of(req.query.get('code'))
            if not self.room_ok(code):
                raise MeError('not_found', 404)
            return {'ok': True, 'profile': self.profile(code, uid)}
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        self.need_owner(code, uid)
        s = b.get('set') if isinstance(b.get('set'), dict) else {}
        own = self.owner_of(code)
        now = int(time.time())
        self.hall.init()
        # Reject a failed photo/name before publishing a partly completed profile.
        if 'name' in s and not self.hall.clean(s.get('name')):
            raise MeError('name')
        photo_change, photo_key, old_photo = False, '', ''
        if 'photo' in s:
            row = self.q('SELECT photo FROM wm51_halls WHERE uid=?', own)
            old_photo = row[0][0] if row else ''
            value = s['photo']
            if value is None or value == '':
                photo_change = True
            elif isinstance(value, str) and value.startswith('data:'):
                self.me.slow(uid, 'salon_photo', 6, 60)
                try:
                    async with self.hall.jobs:
                        data = await asyncio.to_thread(self.hall.photo_bytes, value)
                except ValueError as e:
                    raise MeError(str(e) or 'photo_invalid')
                photo_key, photo_change = self.hall.store(data), True
            elif value != self.hall.photo_url(old_photo):
                raise MeError('photo_invalid')
        self.db.execute('INSERT INTO wm51_halls(uid,ts) VALUES(?,?) ON CONFLICT(uid) DO NOTHING', (own, now))
        self.db.commit()
        if 'name' in s:
            name = self.hall.clean(s.get('name'))
            if not name:
                raise MeError('name')
            with self.db:
                self.db.execute('UPDATE wm51_halls SET name=?,ts=? WHERE uid=?', (name, now, own))
                self.db.execute('UPDATE wm_personal_cinemas SET name=? WHERE uid=?', (name, own))
        if photo_change:
            with self.db:
                self.db.execute('UPDATE wm51_halls SET photo=?,ts=? WHERE uid=?', (photo_key, now, own))
            if old_photo and old_photo != photo_key and re.fullmatch(r'[a-f0-9]{32}\.jpg', old_photo):
                (self.hall.dir / old_photo).unlink(missing_ok=True)
        if 'bg' in s and isinstance(s['bg'], str):
            m = re.fullmatch(r'/s/wk2/salon/(%s)\.jpg' % '|'.join(DECORS), s['bg'])
            if m:
                self.put(code, decor=m.group(1))
                with self.db:
                    self.db.execute("UPDATE wm51_halls SET bgphoto='' WHERE uid=?", (own,))
            elif s['bg'].startswith('data:'):
                self.me.slow(uid, 'salon_photo', 6, 60)
                try:
                    data = await asyncio.to_thread(self.hall.bg_bytes, s['bg'])
                except ValueError as e:
                    raise MeError(str(e) or 'photo_invalid')
                key = self.hall.store(data)
                with self.db:
                    self.db.execute('UPDATE wm51_halls SET bgphoto=? WHERE uid=?', (key, own))
        if 'dim' in s:
            d = float(s['dim'])
            if not 0 <= d <= .8:
                raise MeError('bad_input')
            self.put(code, dim=round(d, 2))
        if 'seats' in s:
            n = s['seats']
            if type(n) is not int or not 2 <= n <= 16:
                raise MeError('bad_input')
            c = self.state(code)
            if c and any(c['seats'][n:]):                 # taken seats are never removed
                raise MeError('seats_occupied', 409)
            with self.db:
                self.db.execute('INSERT INTO wka_room_layout(code,seats) VALUES(?,?) ON CONFLICT(code) DO UPDATE SET seats=excluded.seats', (code, n))
            if c:
                c['seats'] = c['seats'][:n] + [None] * max(0, n - len(c['seats']))
                self.n['cbump'](c)
        if 'limit' in s:
            n = s['limit']
            if type(n) is not int or not 1 <= n <= 16:
                raise MeError('bad_input')
            self.put(code, limit=n)                        # nobody present is removed; new people wait until there is room
        if 'privacy' in s:
            if s['privacy'] not in PRIVACY:
                raise MeError('bad_input')
            with self.db:
                self.db.execute('UPDATE wm51_halls SET enter=? WHERE uid=?', (PRIVACY[s['privacy']], own))
        if 'approval' in s:
            self.put(code, approval=1 if s['approval'] else 0)
        if 'mic' in s:
            if s['mic'] not in ('free', 'ask'):
                raise MeError('bad_input')
            with self.db:
                self.db.execute('UPDATE wm51_halls SET mic=? WHERE uid=?', ('owner' if s['mic'] == 'ask' else 'all', own))
        if 'chat' in s:
            with self.db:
                self.db.execute('UPDATE wm51_halls SET chat=? WHERE uid=?', ('all' if s['chat'] else 'owner', own))
        if 'share' in s:
            self.put(code, share=1 if s['share'] else 0)
        c = self.state(code)
        if c:
            self.n['cbump'](c)
        return {'ok': True, 'profile': self.profile(code, uid)}

    async def api_members(self, req, uid):
        code = self.code_of(req.query.get('code'))
        if not self.room_ok(code):
            raise MeError('not_found', 404)
        c = self.state(code)
        seat = {int(x['id']): i for i, x in enumerate(c['seats'] if c else []) if x}
        people = [dict(self.person(p, uid), seat=seat.get(p, -1)) for p in self.present(code)]
        people.sort(key=lambda p: (p['seat'] < 0, p['seat']))
        hosts = self.q('SELECT uid FROM room_hosts WHERE code=?', code)
        banned = []
        if self.is_owner(code, uid):
            own = self.owner_of(code)
            banned = [self.person(r[0], uid) for r in self.q("SELECT uid FROM wm51_bans WHERE owner=? AND kind='ban' ORDER BY ts DESC LIMIT 100", own)]
        return {'ok': True, 'people': people, 'banned': banned, 'assistant': self.person(hosts[0][0], uid) if hosts else None}

    async def api_assistant(self, req, uid):
        """one playback assistant per salon: play, pause, seek and choose — nothing else (the engine's room_hosts)"""
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        self.need_owner(code, uid)
        t = int(b.get('uid') or 0)
        with self.db:
            self.db.execute('DELETE FROM room_hosts WHERE code=?', (code,))
            if t:
                if t == self.owner_of(code):
                    raise MeError('bad_user')
                self.db.execute('INSERT OR IGNORE INTO room_hosts VALUES(?,?)', (code, t))
        c = self.state(code)
        if c:
            self.n['cbump'](c)
        return {'ok': True, 'assistant': self.person(t, uid) if t else None}

    async def api_event(self, req, uid):
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        self.need_owner(code, uid)
        if b.get('remove'):
            with self.db:
                self.db.execute('DELETE FROM wks_events WHERE code=?', (code,))
            return {'ok': True, 'event': None}
        title = self.hall.clean(b.get('title')) or 'Film night'
        ts = int(b.get('ts') or 0)
        now = int(time.time())
        if not now - 3600 <= ts <= now + 60 * 86400:
            raise MeError('bad_input')
        with self.db:
            self.db.execute('INSERT OR REPLACE INTO wks_events VALUES(?,?,?,?,?)', (code, title[:60], ts, 1 if b.get('remind') else 0, now))
        return {'ok': True, 'event': self.event(code)}

    async def api_report(self, req, uid):
        b = await self.me.body(req)
        code = self.code_of(b.get('code'))
        reason = str(b.get('reason') or '')
        if reason not in ('r1', 'r2', 'r3', 'r4'):
            raise MeError('bad_input')
        self.me.slow(uid, 'salon_report', 5, 3600)
        with self.db:
            self.db.execute('INSERT INTO wka_reports(reporter,target,hall,reason,note,ts) VALUES(?,?,?,?,?,?)',
                            (uid, int(self.owner_of(code) or 0), code, {'r1': 'content', 'r2': 'harassment', 'r3': 'spam', 'r4': 'other'}[reason], 'salon', int(time.time())))
        return {'ok': True}

    def routes(self, app):
        h = self.me.handler
        app.router.add_get('/api/app/salon/home', h(self.api_home))
        app.router.add_get('/api/app/salon/discover', h(self.api_discover))
        app.router.add_post('/api/app/salon/check', h(self.api_check2))
        app.router.add_post('/api/app/salon/create', h(self.api_create))
        for verb, path, fn in (('GET', 'knock', self.api_knock), ('POST', 'knock', self.api_knock), ('POST', 'knock/cancel', self.api_knock_cancel),
                               ('POST', 'admit', self.api_admit), ('POST', 'reject', self.api_reject), ('GET', 'room', self.api_room),
                               ('GET', 'audience', self.api_audience), ('GET', 'invite', self.api_invite), ('POST', 'invite', self.api_invite),
                               ('POST', 'kick', self.api_kick), ('POST', 'chatban', self.api_chatban), ('POST', 'play', self.api_play),
                               ('GET', 'queue', self.api_queue), ('POST', 'queue', self.api_queue), ('POST', 'link', self.api_link),
                               ('GET', 'wallet', self.api_wallet), ('GET', 'hosting', self.api_hosting), ('GET', 'profile', self.api_profile),
                               ('POST', 'profile', self.api_profile), ('GET', 'members', self.api_members), ('POST', 'assistant', self.api_assistant),
                               ('POST', 'event', self.api_event), ('POST', 'report', self.api_report), ('POST', 'left', self.api_left), ('POST', 'screen', self.api_screen)):
            app.router.add_route(verb, '/api/app/salon/' + path, h(fn))
