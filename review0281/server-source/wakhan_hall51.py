import asyncio, base64, html, io, json, os, re, secrets, tempfile, time, unicodedata
from pathlib import Path

class Hall51:

    def __init__(self, ns):
        self.n = ns
        self.dir = Path(ns['BASE']) / 'data' / 'wm51_halls'
        self.dir.mkdir(parents=True, exist_ok=True)
        self.jobs = asyncio.Semaphore(2)
        self.rate = {}
        self.visited = {}

    def init(self):
        if getattr(self, '_ok', False):
            return
        dbx, dbq = (self.n['dbx'], self.n['dbq'])
        dbx("create table if not exists wm51_halls (uid integer primary key, name text not null default '', photo text not null default '', ts integer not null)")
        cols = {r[1] for r in dbq('pragma table_info(wm51_halls)')}
        for col, ddl in (('notice', "text not null default ''"), ('enter', "text not null default 'all'"), ('mic', "text not null default 'all'"), ('chat', "text not null default 'all'"), ('bg', "text not null default ''"), ('clear_id', 'integer not null default 0'), ('bgphoto', "text not null default ''"), ('locks', "text not null default ''")):
            if col not in cols:
                dbx(f'alter table wm51_halls add column {col} {ddl}')
        dbx('create table if not exists wm51_bans (owner integer not null, uid integer not null, kind text not null, ts integer not null, primary key(owner, uid, kind))')
        dbx('create table if not exists wm51_visits (uid integer not null, code text not null, ts integer not null, primary key(uid, code))')
        self._ok = True
    SET = {'enter': ('all', 'friends', 'closed'), 'mic': ('all', 'friends', 'owner'), 'chat': ('all', 'friends', 'owner')}
    BGS = ('', 'night', 'aurora', 'sunset', 'ocean', 'forest', 'royal', 'rose')

    def settings(self, owner):
        self.init()
        r = self.n['dbq']('select notice,enter,mic,chat,bg,clear_id,bgphoto,locks from wm51_halls where uid=?', owner)
        if not r:
            return {'notice': '', 'enter': 'all', 'mic': 'all', 'chat': 'all', 'bg': '', 'clear_id': 0, 'bgphoto': None, 'locks': []}
        n, e, m, c, b, cl, bp, lk = r[0]
        locks = sorted({int(x) for x in str(lk or '').split(',') if x.strip().isdigit()})
        return {'notice': n or '', 'enter': e or 'all', 'mic': m or 'all', 'chat': c or 'all', 'bg': b or '', 'clear_id': int(cl or 0), 'bgphoto': '/api/v51/hallphoto/' + bp if bp else None, 'locks': locks}

    def banned(self, owner, uid, kind):
        return bool(self.n['dbq']('select 1 from wm51_bans where owner=? and uid=? and kind=?', owner, uid, kind))

    def friend(self, a, b):
        try:
            return self.n['WM_COMMUNITY70'].relation(a, b) == 'accepted'
        except Exception:
            return False

    def allowed(self, code, uid, what):
        """None when allowed, otherwise an error code. The owner can always do everything."""
        owner = self.owner(code)
        if owner is None or int(uid) == owner:
            return None
        if self.banned(owner, uid, 'ban'):
            return 'hall_banned'
        st = self.settings(owner)
        if what == 'enter':
            if st['enter'] == 'closed':
                return 'hall_closed'
            if st['enter'] == 'friends' and (not self.friend(owner, uid)):
                return 'hall_friends'
        elif what in ('mic', 'chat'):
            if self.banned(owner, uid, 'mute'):
                return 'hall_muted'
            v = st[what]
            if v == 'owner':
                return 'hall_' + what + '_owner'
            if v == 'friends' and (not self.friend(owner, uid)):
                return 'hall_' + what + '_friends'
        return None

    def kick(self, code, uid):
        try:
            c = self.n['CIN'].get('r:' + code)
            if c:
                changed = False
                for i, x in enumerate(c['seats']):
                    if x and int(x['id']) == int(uid):
                        c['seats'][i] = None
                        changed = True
                if changed and 'cbump' in self.n:
                    self.n['cbump'](c)
            v = self.n.get('CV', {}).get('r:' + code)
            if v and v['m'].pop(int(uid), None) is not None and ('cvbump' in self.n):
                self.n['cvbump'](v)
        except Exception:
            pass

    def owner(self, code):
        rows = self.n['dbq']('select * from rooms where code=?', code)
        if rows and rows[0][1] is not None:
            return int(rows[0][1])
        try:
            rows = self.n['dbq']('select uid from wm_personal_cinemas where code=?', code)
            return int(rows[0][0]) if rows else None
        except Exception:
            return None

    def info(self, code, viewer=None):
        uid = self.owner(code)
        if uid is None:
            return None
        row = self.n['dbq']('select name,photo,ts from wm51_halls where uid=?', uid)
        name, photo, ts = row[0] if row else ('', '', 0)
        # Only an explicitly saved salon name completes setup. Personal account
        # names and reserved cinema codes are not public salon profiles.
        configured = bool(str(name or '').strip())
        if not name:
            try:
                p = self.n['dbq']('select name from wm_personal_cinemas where uid=?', uid)
                name = p[0][0] if p else ''
            except Exception:
                name = ''
        if not name:
            name = self.user_name(uid)
        live, now = (0, '')
        try:
            c = self.n['CIN'].get('r:' + code)
            if c:
                live = sum((1 for x in c.get('seats') or [] if x))
                if c.get('playing'):
                    now = str(c.get('title') or ((c.get('media') or {}).get('title') if isinstance(c.get('media'), dict) else '') or '')[:80]
        except Exception:
            pass
        st = self.settings(uid)
        own = viewer is not None and int(viewer) == uid
        extra = {}
        if own:
            ids = self.n['dbq']('select uid,kind from wm51_bans where owner=? order by ts desc limit 200', uid)
            names = {}
            for b_uid, _k in ids:
                if b_uid not in names:
                    names[b_uid] = self.uname(b_uid)
            extra = {'muted': [{'id': i, 'name': names[i]} for i, k in ids if k == 'mute'], 'banned': [{'id': i, 'name': names[i]} for i, k in ids if k == 'ban']}
        elif viewer is not None:
            extra = {'can': {k: self.allowed(code, int(viewer), k) is None for k in ('enter', 'mic', 'chat')}}
        return {**st, **extra, 'live': live, 'now': now, 'code': code, 'owner_id': uid, 'owner_name': self.uname(uid), 'is_owner': viewer is not None and int(viewer) == uid, 'name': name, 'photo': self.photo_url(photo) if configured else None, 'custom': configured, 'configured': configured}

    def photo_url(self, key):
        if not isinstance(key, str) or not re.fullmatch(r'[a-f0-9]{32}\.jpg', key):
            return None
        path = self.dir / key
        if path.is_symlink() or not path.is_file():
            return None
        return '/api/v51/hallphoto/' + key

    def directory(self, viewer, q=''):
        """every hall on the server for everyone: live ones first, then the most recently used.
        Locked / friends-only halls are listed too (with their state); halls that banned the viewer are left out."""
        q = re.sub('\\s+', ' ', q).strip().lower()[:40]
        live = {}
        try:
            for k, c in list(self.n['CIN'].items()):
                if isinstance(k, str) and k.startswith('r:') and isinstance(c, dict):
                    n = sum((1 for x in c.get('seats') or [] if x))
                    if n:
                        live[k[2:]] = n
        except Exception:
            pass
        codes = sorted(live, key=lambda c: -live[c])
        try:
            for r in self.n['dbq']('select code from wm_personal_cinemas order by created_at desc limit 400'):
                codes.append(r[0])
        except Exception:
            pass
        revoked = self.n.get('wmr_code_revoked') or (lambda c: False)
        try:
            for r in self.n['dbq']('select * from rooms order by 3 desc limit 300'):
                if r[0] not in live and r[1] is not None:
                    codes.append(r[0])
        except Exception:
            pass
        codes = [c for c in codes if c in live or not self._revoked(revoked, c)]
        out, seen, owners = ([], set(), set())
        for c in codes:
            if c in seen or len(out) >= 80:
                continue
            seen.add(c)
            v = self.info(c, viewer)
            if not v or not v['configured'] or v['owner_id'] == int(viewer) or self.banned(v['owner_id'], int(viewer), 'ban'):
                continue
            if v['owner_id'] in owners:
                continue
            owners.add(v['owner_id'])
            if q and q not in (v['name'] or '').lower() and (q not in c.lower()) and (q not in (v['owner_name'] or '').lower()):
                continue
            can = (v.get('can') or {}).get('enter', True)
            out.append({'code': c, 'name': v['name'], 'photo': v['photo'], 'configured': True, 'owner_name': v['owner_name'], 'live': v['live'], 'now': v['now'], 'enter': v['enter'], 'can_enter': bool(can), 'locked': v['enter'] == 'closed'})
        return out

    @staticmethod
    def _revoked(fn, c):
        try:
            return bool(fn(c))
        except Exception:
            return False

    @staticmethod
    def code(value):
        return re.sub('[^A-Z0-9]', '', str(value or '').upper())[:8]

    @staticmethod
    def clean(value):
        value = ''.join((c for c in str(value or '') if not unicodedata.category(c).startswith('C')))
        return ' '.join(value.split())[:40]

    def photo_bytes(self, encoded):
        from PIL import Image, ImageOps
        if not isinstance(encoded, str) or len(encoded) > 2000000:
            raise ValueError('photo_size')
        m = re.fullmatch('data:image/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)', encoded)
        if not m:
            raise ValueError('photo_invalid')
        raw = base64.b64decode(m[1], validate=True)
        with Image.open(io.BytesIO(raw)) as im:
            if im.width * im.height > 16000000 or im.width < 32 or im.height < 32:
                raise ValueError('photo_invalid')
            im = ImageOps.exif_transpose(im).convert('RGB')
            s = min(im.size)
            im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width - s) // 2 + s, (im.height - s) // 2 + s)).resize((512, 512))
            buf = io.BytesIO()
            im.save(buf, 'JPEG', quality=88, optimize=True)
            return buf.getvalue()

    def bg_bytes(self, encoded):
        from PIL import Image, ImageOps
        if not isinstance(encoded, str) or len(encoded) > 2000000:
            raise ValueError('photo_size')
        m = re.fullmatch('data:image/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)', encoded)
        if not m:
            raise ValueError('photo_invalid')
        with Image.open(io.BytesIO(base64.b64decode(m[1], validate=True))) as im:
            if im.width * im.height > 30000000 or im.width < 64 or im.height < 64:
                raise ValueError('photo_invalid')
            im = ImageOps.fit(ImageOps.exif_transpose(im).convert('RGB'), (900, 1600), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, 'JPEG', quality=84, optimize=True, progressive=True)
            return buf.getvalue()

    def store(self, data):
        key = secrets.token_hex(16) + '.jpg'
        fd, tmp = tempfile.mkstemp(prefix='.h-', dir=self.dir)
        try:
            with os.fdopen(fd, 'wb') as f:
                f.write(data)
                f.flush()
                os.fsync(f.fileno())
            os.chmod(tmp, 0o644)
            os.replace(tmp, self.dir / key)
            directory = os.open(self.dir, os.O_RDONLY | os.O_DIRECTORY)
            try:
                os.fsync(directory)
            finally:
                os.close(directory)
        finally:
            Path(tmp).unlink(missing_ok=True)
        return key

    async def body(self, req):
        raw = bytearray()
        async for chunk in req.content.iter_chunked(65536):
            raw.extend(chunk)
            if len(raw) > 2100000:
                raise ValueError('body_size')
        value = json.loads(raw or b'{}')
        if not isinstance(value, dict):
            raise ValueError('bad_body')
        return value

    async def api(self, req):
        J = self.n['J']
        uid = int(req['u']['id'])
        self.init()
        try:
            if req.method == 'GET':
                if req.query.get('mine') == 'visits':
                    rows = self.n['dbq']('select code from wm51_visits where uid=? order by ts desc limit 30', uid)
                    out = []
                    for c, in rows:
                        v = self.info(c, uid)
                        if v and v['configured'] and v['owner_id'] != uid:
                            out.append(v)
                    return J({'ok': True, 'halls': out})
                if req.query.get('all'):
                    return J({'ok': True, 'halls': self.directory(uid, str(req.query.get('q') or ''))})
                if req.query.get('codes'):
                    out = {}
                    for c in [self.code(x) for x in req.query['codes'].split(',')][:24]:
                        if c and c not in out:
                            v = self.info(c, uid)
                            if v and v['configured']:
                                out[c] = v
                    return J({'ok': True, 'halls': out})
                v = self.info(self.code(req.query.get('code')), uid)
                return J({'ok': True, 'hall': v}) if v else J({'ok': False, 'err': 'room_missing'}, 404)
            body = await self.body(req)
            code = self.code(body.get('code'))
            if self.owner(code) != uid:
                return J({'ok': False, 'err': 'owner_only'}, 403)
            now = time.time()
            if body.get('photo') and now - self.rate.get(uid, 0) < 2:
                return J({'ok': False, 'err': 'slow'}, 429)
            if body.get('photo'):
                self.rate[uid] = now
            act = body.get('action')
            if act in ('mute', 'unmute', 'ban', 'unban'):
                target = int(body.get('uid') or 0)
                if not target or target == uid:
                    return J({'ok': False, 'err': 'bad_user'}, 400)
                kind = 'mute' if act in ('mute', 'unmute') else 'ban'
                if act in ('mute', 'ban'):
                    self.n['dbx']('insert or replace into wm51_bans values(?,?,?,?)', uid, target, kind, int(now))
                    if kind == 'ban':
                        self.kick(code, target)
                    else:
                        try:
                            v = self.n.get('CV', {}).get('r:' + code)
                            if v and int(target) in v['m']:
                                v['m'][int(target)]['mute'] = 1
                                self.n['cvbump'](v, 'r:' + code)
                        except Exception:
                            pass
                else:
                    self.n['dbx']('delete from wm51_bans where owner=? and uid=? and kind=?', uid, target, kind)
                return J({'ok': True, 'hall': self.info(code, uid)})
            if act in ('lock_seat', 'unlock_seat'):
                i = int(body.get('i', -1))
                if not 0 <= i < 64:
                    return J({'ok': False, 'err': 'bad_seat'}, 400)
                self.n['dbx']('insert into wm51_halls(uid,ts) values(?,?) on conflict(uid) do nothing', uid, int(now))
                locks = set(self.settings(uid)['locks'])
                (locks.add if act == 'lock_seat' else locks.discard)(i)
                self.n['dbx']('update wm51_halls set locks=? where uid=?', ','.join((str(x) for x in sorted(locks))), uid)
                return J({'ok': True, 'hall': self.info(code, uid)})
            if act == 'unseat':
                target = int(body.get('uid') or 0)
                if target and target != uid:
                    self.kick(code, target)
                return J({'ok': True, 'hall': self.info(code, uid)})
            if act == 'clear_chat':
                top = 0
                try:
                    db = self.n['WM_COMMUNITY70'].db
                    top = db.execute('select coalesce(max(id),0) from wm70_room_messages where room=?', (code,)).fetchone()[0]
                except Exception:
                    pass
                self.n['dbx']('insert into wm51_halls(uid,ts) values(?,?) on conflict(uid) do nothing', uid, int(now))
                self.n['dbx']('update wm51_halls set clear_id=? where uid=?', int(top), uid)
                return J({'ok': True, 'hall': self.info(code, uid)})
            self.n['dbx']('insert into wm51_halls(uid,ts) values(?,?) on conflict(uid) do nothing', uid, int(now))
            for k, ok in self.SET.items():
                if k in body:
                    if body[k] not in ok:
                        return J({'ok': False, 'err': 'bad_' + k}, 400)
                    self.n['dbx'](f'update wm51_halls set {k}=? where uid=?', body[k], uid)
            if 'bg' in body:
                if body['bg'] not in self.BGS:
                    return J({'ok': False, 'err': 'bad_bg'}, 400)
                self.n['dbx']('update wm51_halls set bg=? where uid=?', body['bg'], uid)
            if 'notice' in body:
                n = ''.join((c for c in str(body.get('notice') or '') if c == '\n' or not unicodedata.category(c).startswith('C')))
                self.n['dbx']('update wm51_halls set notice=? where uid=?', n.strip()[:300], uid)
            if body.get('bgphoto') or body.get('reset_bgphoto') is True:
                old_bg = (self.n['dbq']('select bgphoto from wm51_halls where uid=?', uid) or [('',)])[0][0]
                key = ''
                if body.get('bgphoto'):
                    async with self.jobs:
                        data = await asyncio.to_thread(self.bg_bytes, body['bgphoto'])
                    key = self.store(data)
                self.n['dbx']('update wm51_halls set bgphoto=? where uid=?', key, uid)
                if old_bg and old_bg != key:
                    (self.dir / old_bg).unlink(missing_ok=True)
            if not any((k in body for k in ('name', 'photo', 'reset_photo'))):
                return J({'ok': True, 'hall': self.info(code, uid)})
            row = self.n['dbq']('select name,photo from wm51_halls where uid=?', uid)
            name, old = row[0] if row else ('', '')
            if 'name' in body:
                name = self.clean(body.get('name'))
            photo = old
            if body.get('photo'):
                async with self.jobs:
                    data = await asyncio.to_thread(self.photo_bytes, body['photo'])
                key = self.store(data)
                photo = key
            elif body.get('reset_photo') is True:
                photo = ''
            self.n['dbx']('update wm51_halls set name=?, photo=?, ts=? where uid=?', name, photo, int(now), uid)
            if name:
                try:
                    self.n['dbx']('update wm_personal_cinemas set name=? where uid=?', name, uid)
                except Exception:
                    pass
            if old and old != photo:
                (self.dir / old).unlink(missing_ok=True)
            return J({'ok': True, 'hall': self.info(code, uid)})
        except ValueError as e:
            return J({'ok': False, 'err': str(e) or 'bad_input'}, 400)
        except Exception as e:
            return J({'ok': False, 'err': 'server', 'detail': type(e).__name__ + ': ' + str(e)[:160]}, 500)

    async def photo(self, req):
        from aiohttp import web
        key = req.match_info['f']
        if not re.fullmatch('[a-f0-9]{32}\\.jpg', key):
            raise web.HTTPNotFound()
        p = self.dir / key
        if not p.is_file() or p.is_symlink():
            raise web.HTTPNotFound()
        return web.FileResponse(p, headers={'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff'})

    def routes(self, app):
        auth = self.n['auth']
        app.router.add_get('/api/v51/hall', auth(self.api))
        app.router.add_post('/api/v51/hall', auth(self.api))
        app.router.add_get('/api/v51/hallphoto/{f}', self.photo)

    def uname(self, uid):
        try:
            r = self.n['WM_COMMUNITY70'].db.execute('select name from wm70_profiles where uid=?', (uid,)).fetchall()
            if r and r[0][0]:
                return r[0][0]
        except Exception:
            pass
        return self.user_name(uid) or str(uid)

    def user_name(self, uid):
        try:
            if not hasattr(self, '_ucols'):
                cols = [r[1] for r in self.n['dbq']('pragma table_info(users)')]
                idc = next((c for c in ('uid', 'user_id', 'id', 'tg_id', 'chat_id') if c in cols), None)
                nmc = next((c for c in ('name', 'first_name', 'full_name', 'username') if c in cols), None)
                self._ucols = (idc, nmc)
            idc, nmc = self._ucols
            if not idc or not nmc:
                return ''
            r = self.n['dbq'](f'select {nmc} from users where {idc}=?', uid)
            return (r[0][0] if r else '') or ''
        except Exception:
            return ''

    def install(self):
        self.init()
        self.enforce()
        self.fast_web()
        community = self.n['WM_COMMUNITY70']
        old_routes = community.routes

        def routes(app):
            old_routes(app)
            self.routes(app)
        community.routes = routes

    def enforce(self):
        ns = self.n
        J = ns['J']
        me = self

        def who(req):
            try:
                u = ns['check_init'](req.headers.get('X-Init', ''))
                return int(u['id']) if u else None
            except Exception:
                return None

        def code_of(req):
            return re.sub('[^A-Z0-9]', '', str(req.match_info.get('g', '')).upper())[:8]
        if 'api_cinctl' in ns:
            old_ctl = ns['api_cinctl']

            async def api_cinctl(req):
                try:
                    uid, code = (who(req), code_of(req))
                    if uid and code:
                        body = await req.json()
                        if isinstance(body, dict) and body.get('a') in ('join', 'sit') and (not me.seated(code, uid)):
                            err = me.allowed(code, uid, 'enter')
                            if err:
                                return J({'ok': False, 'err': err}, 403)
                        owner = me.owner(code)
                        if isinstance(body, dict) and owner is not None and (uid != owner) and (body.get('a') in ('join', 'sit')):
                            locks = set(me.settings(owner)['locks'])
                            if locks:
                                if body.get('a') == 'sit':
                                    if int(body.get('i', -1)) in locks:
                                        return J({'ok': False, 'err': 'hall_seat_locked'}, 403)
                                elif not me.seated(code, uid):
                                    c = ns['CIN'].get('r:' + code)
                                    seats = c['seats'] if c else []
                                    free = next((i for i, x in enumerate(seats) if not x and i not in locks), -1)
                                    if c and free < 0:
                                        return J({'ok': False, 'err': 'full'}, 409)
                                    if free >= 0:
                                        req._read_bytes = json.dumps({'a': 'sit', 'i': free}).encode()
                except Exception:
                    pass
                return await old_ctl(req)
            ns['api_cinctl'] = api_cinctl
        if 'api_cin' in ns:
            old_cin = ns['api_cin']

            async def api_cin(req):
                try:
                    uid, code = (who(req), code_of(req))
                    if uid and code and (not me.seated(code, uid)):
                        err = me.allowed(code, uid, 'enter')
                        if err:
                            return J({'ok': False, 'err': err}, 403)
                    if uid and code:
                        own = me.owner(code)
                        if own is not None and own != uid:
                            now = int(time.time())
                            last = me.visited.get((uid, code), 0)
                            if now - last > 60:
                                me.visited[uid, code] = now
                                me.init()
                                ns['dbx']('insert into wm51_visits values(?,?,?) on conflict(uid, code) do update set ts=excluded.ts', uid, code, now)
                except Exception:
                    pass
                return await old_cin(req)
            ns['api_cin'] = api_cin
        if 'api_cv' in ns:
            old_cv = ns['api_cv']

            async def api_cv(req):
                try:
                    uid, code = (who(req), code_of(req))
                    if uid and code:
                        body = await req.json()
                        if isinstance(body, dict) and body.get('a') == 'mute' and (str(body.get('m')) in ('0', 'False', 'false')):
                            err = me.allowed(code, uid, 'mic')
                            if err:
                                return J({'ok': False, 'err': err}, 403)
                except Exception:
                    pass
                return await old_cv(req)
            ns['api_cv'] = api_cv
        try:
            import wakhan_community_v70 as cm
            com = ns['WM_COMMUNITY70']
            old_send = com.send_room

            async def send_room(uid, body):
                code = str(body.get('room') or '')
                err = me.allowed(code, uid, 'chat')
                if err:
                    raise cm.CommunityError(err, 403)
                return await old_send(uid, body)
            com.send_room = send_room
            old_msgs = com.room_messages

            def room_messages(uid, code, after):
                res = old_msgs(uid, code, after)
                try:
                    owner = me.owner(code)
                    cl = me.settings(owner)['clear_id'] if owner is not None else 0
                    if cl:
                        res['messages'] = [m for m in res.get('messages', []) if int(m.get('id') or 0) > cl]
                except Exception:
                    pass
                return res
            com.room_messages = room_messages
        except Exception:
            pass

    def fast_web(self):
        import gzip, hashlib
        from aiohttp import web
        ns = self.n
        WEB = ns.get('WEB')
        if not WEB:
            return
        TYPES = {'.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4'}
        TEXT = {'.js', '.css', '.svg', '.html'}
        cache = {}

        def load(p):
            st = os.stat(p)
            key = (st.st_mtime_ns, st.st_size)
            c = cache.get(p)
            if c and c[0] == key:
                return c
            with open(p, 'rb') as f:
                raw = f.read()
            ext = os.path.splitext(p)[1].lower()
            gz = gzip.compress(raw, 6) if ext in TEXT and len(raw) > 1024 else None
            c = (key, raw, gz, '"' + hashlib.md5(raw).hexdigest()[:20] + '"', TYPES.get(ext, 'application/octet-stream'))
            cache[p] = c
            return c

        def respond(req, p, cc):
            if os.path.getsize(p) > 3 * 1024 * 1024:
                return web.FileResponse(p, headers={'Cache-Control': cc})
            _k, raw, gz, etag, ctype = load(p)
            h = {'Cache-Control': cc, 'ETag': etag, 'Vary': 'Accept-Encoding', 'X-Content-Type-Options': 'nosniff'}
            inm = req.headers.get('If-None-Match', '')
            if inm and etag in inm:
                return web.Response(status=304, headers=h)
            h['Content-Type'] = ctype
            if gz is not None and 'gzip' in req.headers.get('Accept-Encoding', ''):
                h['Content-Encoding'] = 'gzip'
                return web.Response(body=gz, headers=h)
            return web.Response(body=raw, headers=h)

        async def web_index(req):
            return respond(req, os.path.join(WEB, 'index.html'), 'no-cache')

        async def web_static(req):
            n = req.match_info['f']
            if not re.fullmatch('[\\w.\\-]+\\.(png|jpg|mp4|js|css|svg|webp|woff2)', n):
                raise web.HTTPNotFound()
            p = os.path.join(WEB, n)
            if not os.path.isfile(p):
                raise web.HTTPNotFound()
            cc = 'public, max-age=31536000, immutable' if 'v' in req.query else 'public, max-age=3600'
            return respond(req, p, cc)
        ns['web_index'] = web_index
        ns['web_static'] = web_static
