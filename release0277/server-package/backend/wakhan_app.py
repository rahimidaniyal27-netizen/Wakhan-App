import asyncio, collections, hashlib, hmac, ipaddress, json, os, re, secrets, smtplib, ssl, time
from email.message import EmailMessage
APP_UID_BASE = 10 ** 13

class WakhanApp:
    # A loopback proxy without verified client-IP configuration gets a bounded
    # service-wide budget, rather than locking every user behind one 8/min key.
    SHARED_AUTH_BUDGET = {8: 30, 12: 120, 20: 180}
    CODE_TTL = 600
    KEY_TTL = 180 * 86400
    PREFIX = 'wka1.'
    EMAIL_RX = re.compile('^[^@\\s]{1,64}@[^@\\s]{1,190}\\.[A-Za-z]{2,24}$')

    def __init__(self, ns):
        self.n = ns
        self.mail = {}
        self.rate = collections.OrderedDict()
        self.mail_slots = asyncio.Semaphore(4)

    def init(self):
        if getattr(self, '_ok', False):
            return
        dbx = self.n['dbx']
        dbx("create table if not exists wka_sessions (sid text primary key, uid integer not null, ts integer not null, seen integer not null, agent text not null default '')")
        dbx("create table if not exists wka_accounts (uid integer primary key, kind text not null, created integer not null, email text unique, google text unique, name text not null default '')")
        have = {r[1] for r in self.n['dbq']('pragma table_info(wka_accounts)')}
        for col, kind in (('username', 'text'), ('birth', 'text'), ('done', 'integer not null default 0'), ('blocked', 'integer not null default 0'), ('terms', 'integer not null default 0')):
            if col not in have:
                dbx(f'alter table wka_accounts add column {col} {kind}')
        dbx('create unique index if not exists wka_username_unique on wka_accounts(lower(username)) where username is not null')
        if 'uname_ts' not in {r[1] for r in self.n['dbq']('pragma table_info(wka_accounts)')}:
            dbx('alter table wka_accounts add column uname_ts integer not null default 0')
        dbx('create table if not exists wka_old_names (name text primary key, uid integer not null, until integer not null)')
        dbx("create table if not exists wka_reports (id integer primary key autoincrement, reporter integer not null, target integer not null default 0, hall text not null default '', reason text not null, note text not null default '', ts integer not null, done integer not null default 0)")
        self._ok = True

    def env(self, k, d=''):
        return (os.environ.get(k) or self.dotenv().get(k) or d).strip()

    def dotenv(self):
        if not hasattr(self, '_env'):
            self._env = {}
            try:
                for line in open(os.path.join(self.n['BASE'], '.env'), encoding='utf-8'):
                    if '=' in line and (not line.lstrip().startswith('#')):
                        k, v = line.split('=', 1)
                        self._env[k.strip()] = v.strip().strip('"').strip("'")
            except Exception:
                pass
        return self._env

    def secret(self):
        key = self.n['APP_SESSION_KEY']
        if not isinstance(key, bytes) or len(key) != 32:
            raise RuntimeError('APP_SESSION_KEY_INVALID')
        return key

    def sign(self, sid):
        return hmac.new(self.secret(), sid.encode(), hashlib.sha256).hexdigest()[:32]

    def new_key(self, uid, agent=''):
        if self.n.get('WM_PUBLIC_IDS'):
            self.n['WM_PUBLIC_IDS'].assign(int(uid))
        self.init()
        sid = secrets.token_urlsafe(18)
        now = int(time.time())
        self.n['dbx']('insert into wka_sessions values(?,?,?,?,?)', sid, int(uid), now, now, str(agent or '')[:120])
        return self.PREFIX + sid + '.' + self.sign(sid)

    def key_uid(self, raw):
        try:
            if not isinstance(raw, str) or not re.fullmatch(r'wka1\.[A-Za-z0-9_-]{24}\.[a-f0-9]{32}', raw):
                return (None, None)
            sid, sig = raw[len(self.PREFIX):].rsplit('.', 1)
            if not hmac.compare_digest(self.sign(sid), sig):
                return (None, None)
            self.init()
            r = self.n['dbq']('select uid,seen from wka_sessions where sid=?', sid)
            if not r:
                return (None, None)
            uid, seen = (int(r[0][0]), int(r[0][1]))
            now = int(time.time())
            if now - seen > self.KEY_TTL:
                self.n['dbx']('delete from wka_sessions where sid=?', sid)
                return (None, None)
            if now - seen > 3600:
                self.n['dbx']('update wka_sessions set seen=? where sid=?', now, sid)
            return (uid, sid)
        except Exception:
            return (None, None)

    def check_key(self, raw):
        uid, _sid = self.key_uid(raw)
        if not uid:
            return None
        a = self.account(uid)
        if not a or a['blocked'] or (not a['done']):
            return None
        u = self.user(uid)
        return {'id': uid, 'first_name': u.get('name') or 'Wakhan', 'username': u.get('un') or '', 'language_code': 'fa', 'wakhan_app': True}

    def user(self, uid):
        try:
            r = self.n['dbq']('select name,un from users where uid=?', int(uid))
            if r:
                return {'name': r[0][0] or '', 'un': r[0][1] or ''}
        except Exception:
            pass
        return {}

    def touch_user(self, uid, name, un=''):
        try:
            self.n['dbx']("insert into users values(?,?,?,?) on conflict(uid) do update set name=excluded.name, un=case when excluded.un<>'' then excluded.un else users.un end, ts=excluded.ts", int(uid), (name or '')[:64], un or '', int(time.time()))
        except Exception as e:
            self.n['log'].warning('accounts users row: %s', e)

    def account(self, uid):
        self.init()
        r = self.n['dbq']('select uid,kind,email,google,name,username,birth,done,blocked,terms from wka_accounts where uid=?', int(uid))
        if not r:
            return None
        k = ('uid', 'kind', 'email', 'google', 'name', 'username', 'birth', 'done', 'blocked', 'terms')
        return dict(zip(k, r[0]))

    def ensure(self, uid):
        if not self.account(uid):
            self.n['dbx']('insert into wka_accounts (uid,kind,created,name) values(?,?,?,?)', int(uid), 'app', int(time.time()), self.user(uid).get('name', ''))
        return self.account(uid)

    @staticmethod
    def age(birth):
        try:
            y, m, d = (int(x) for x in str(birth).split('-'))
            import datetime
            b, t = (datetime.date(y, m, d), datetime.date.today())
            if b > t:
                return None
            return t.year - b.year - ((t.month, t.day) < (b.month, b.day))
        except Exception:
            return None
    USER_RX = re.compile('^(?![._])(?!.*[._]{2})[a-z0-9._]{3,24}(?<![._])$')

    def username_free(self, name, uid=None):
        self.init()
        r = self.n['dbq']('select uid from wka_accounts where lower(username)=lower(?)', name)
        if r and (not (uid is not None and int(r[0][0]) == int(uid))):
            return False
        held = self.n['dbq']('select uid from wka_old_names where name=lower(?) and until>?', name, int(time.time()))
        return not held or (uid is not None and int(held[0][0]) == int(uid))

    def find(self, field, value):
        if field not in ('email', 'google', 'facebook', 'apple'):
            raise ValueError('IDENTITY_FIELD_INVALID')
        self.init()
        r = self.n['dbq'](f'select uid from wka_accounts where {field}=?', value)
        return int(r[0][0]) if r else None

    def create(self, field, value, name=''):
        if field not in ('email', 'google', 'facebook', 'apple'):
            raise ValueError('IDENTITY_FIELD_INVALID')
        self.init()
        top = self.n['dbq']('select max(uid) from wka_accounts where uid>=?', APP_UID_BASE)
        uid = max(APP_UID_BASE, int(top[0][0] or 0)) + 1 + secrets.randbelow(7)
        self.n['dbx'](f'insert into wka_accounts (uid,kind,created,{field},name) values(?,?,?,?,?)', uid, 'app', int(time.time()), value, (name or '')[:64])
        if name:
            self.touch_user(uid, name)
        return uid

    def attach(self, uid, field, value):
        if field not in ('email', 'google', 'facebook', 'apple'):
            raise ValueError('IDENTITY_FIELD_INVALID')
        self.init()
        other = self.find(field, value)
        if other and other != int(uid):
            return False
        if not self.n['dbq']('select 1 from wka_accounts where uid=?', int(uid)):
            self.n['dbx']('insert into wka_accounts (uid,kind,created,name) values(?,?,?,?)', int(uid), 'app', int(time.time()), self.user(uid).get('name', ''))
        self.n['dbx'](f'update wka_accounts set {field}=? where uid=?', value, int(uid))
        return True

    def signed_in(self, uid, req, new=False):
        u, a = (self.user(uid), self.ensure(uid))
        if a['blocked']:
            return self.J({'ok': False, 'err': 'too_young'})
        return self.J({'ok': True, 'key': self.new_key(uid, req.headers.get('User-Agent', '')), 'uid': uid, 'name': u.get('name', ''), 'new': bool(new or not a['done']), 'complete': bool(a['done']), 'username': a['username'] or ''})

    def mail_ready(self):
        return bool(self.env('WKA_SMTP_HOST') and self.env('WKA_SMTP_USER') and self.env('WKA_SMTP_PASS'))

    def send_mail(self, to, code):
        host, port = (self.env('WKA_SMTP_HOST'), int(self.env('WKA_SMTP_PORT', '587') or 587))
        user, pw = (self.env('WKA_SMTP_USER'), self.env('WKA_SMTP_PASS'))
        sender = self.env('WKA_MAIL_FROM', user)
        m = EmailMessage()
        m['Subject'] = f'Wakhan · {code}'
        m['From'] = f'Wakhan <{sender}>'
        m['To'] = to
        m.set_content(f'کد ورود به واخان: {code}\n\nاین کد تا 10 دقیقه کار می\u200cکند. اگر تو درخواست نکردی، این ایمیل را نادیده بگیر.\n\nYour Wakhan sign-in code: {code}')
        m.add_alternative(f'<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#0c1020;color:#fff;padding:28px;border-radius:18px;max-width:420px;margin:auto;text-align:center">\n<h2 style="margin:0 0 6px">واخان</h2><p style="color:#b8bdd6;margin:0 0 18px">کد ورود به برنامه</p>\n<div style="font-size:34px;letter-spacing:10px;font-weight:800;background:#1a2140;border-radius:14px;padding:14px 0" dir="ltr">{code}</div>\n<p style="color:#b8bdd6;font-size:13px;margin:18px 0 0">این کد تا 10 دقیقه کار می\u200cکند. اگر تو درخواست نکردی، این ایمیل را نادیده بگیر.</p></div>', subtype='html')
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=ssl.create_default_context(), timeout=20) as s:
                s.login(user, pw)
                s.send_message(m)
        else:
            with smtplib.SMTP(host, port, timeout=20) as s:
                s.starttls(context=ssl.create_default_context())
                s.login(user, pw)
                s.send_message(m)

    @staticmethod
    def h(code, email):
        return hashlib.sha256((email + '|' + code).encode()).hexdigest()

    async def email_send(self, req):
        if self.limited(req, 8):
            return self.J({'ok': False, 'err': 'rate'}, 429)
        if req.headers.get('X-Init') and not self.current(req):
            return self.J({'ok': False, 'err': 'auth'}, 401)
        if req.headers.get('X-Init'):
            account = self.account(self.current(req))
            if not account or account['blocked']:
                return self.J({'ok': False, 'err': 'too_young'}, 403)
        if not self.mail_ready():
            return self.J({'ok': False, 'err': 'email_off'})
        b = await self.body(req)
        email = str(b.get('email', '')).strip().lower()
        if not self.EMAIL_RX.fullmatch(email):
            return self.J({'ok': False, 'err': 'email_bad'})
        now = time.time()
        for address, challenge in list(self.mail.items()):
            if now - challenge['ts'] >= self.CODE_TTL:
                self.mail.pop(address, None)
        old = self.mail.get(email)
        if old and now - old['ts'] < 45:
            return self.J({'ok': False, 'err': 'wait', 'wait': int(45 - (now - old['ts']))})
        if len(self.mail) >= 2048 or self.mail_slots.locked():
            return self.J({'ok': False, 'err': 'rate'}, 429)
        code = f'{secrets.randbelow(10 ** 6):06d}'
        challenge = {'hash': self.h(code, email), 'ts': now, 'tries': 0}
        self.mail[email] = challenge
        await self.mail_slots.acquire()
        try:
            delivery = asyncio.get_running_loop().run_in_executor(None, self.send_mail, email, code)
        except BaseException:
            self.mail_slots.release()
            if self.mail.get(email) is challenge:
                self.mail.pop(email, None)
            raise
        def delivered(future):
            self.mail_slots.release()
            failed = future.cancelled() or future.exception() is not None
            if failed and self.mail.get(email) is challenge:
                self.mail.pop(email, None)
        delivery.add_done_callback(delivered)
        try:
            # Cancelling an HTTP handler must not release a still-running SMTP thread's slot.
            await asyncio.shield(delivery)
        except Exception:
            self.n['log'].warning('accounts email delivery failed')
            if self.mail.get(email) is challenge:
                self.mail.pop(email, None)
            return self.J({'ok': False, 'err': 'email_fail'})
        return self.J({'ok': True})

    async def email_verify(self, req):
        if self.limited(req, 20):
            return self.J({'ok': False, 'err': 'rate'}, 429)
        b = await self.body(req)
        email = str(b.get('email', '')).strip().lower()
        if req.headers.get('X-Init') and not self.current(req):
            return self.J({'ok': False, 'err': 'auth'}, 401)
        if req.headers.get('X-Init'):
            account = self.account(self.current(req))
            if not account or account['blocked']:
                return self.J({'ok': False, 'err': 'too_young'}, 403)
        code = str(b.get('code', ''))
        if not self.EMAIL_RX.fullmatch(email) or not re.fullmatch(r'[0-9]{6}', code):
            return self.J({'ok': False, 'err': 'code_bad'})
        v = self.mail.get(email)
        if not v or time.time() - v['ts'] > self.CODE_TTL:
            self.mail.pop(email, None)
            return self.J({'ok': False, 'err': 'code_expired'})
        v['tries'] += 1
        if v['tries'] > 5:
            self.mail.pop(email, None)
            return self.J({'ok': False, 'err': 'code_expired'})
        if not hmac.compare_digest(v['hash'], self.h(code, email)):
            return self.J({'ok': False, 'err': 'code_bad', 'left': 5 - v['tries']})
        self.mail.pop(email, None)
        cur = self.current(req)
        if cur:
            if not self.attach(cur, 'email', email):
                return self.J({'ok': False, 'err': 'taken'})
            return self.J({'ok': True, 'linked': 'email'})
        uid = self.find('email', email)
        new = uid is None
        if new:
            uid = self.create('email', email)
        return self.signed_in(uid, req, new)

    async def google(self, req, *, nonce=None):
        # The old raw-token endpoint cannot bypass the one-use browser flow.
        if not isinstance(nonce, str) or not re.fullmatch(r'[A-Za-z0-9_-]{43}', nonce):
            return self.J({'ok': False, 'err': 'native_required'}, 409)
        if self.limited(req, 20):
            return self.J({'ok': False, 'err': 'rate'}, 429)
        cid = self.env('WKA_GOOGLE_CLIENT_ID')
        if not cid:
            return self.J({'ok': False, 'err': 'google_off'})
        if req.headers.get('X-Init') and not self.current(req):
            return self.J({'ok': False, 'err': 'auth'}, 401)
        b = await self.body(req)
        credential = b.get('credential')
        try:
            from wakhan_signin import TokenVerifier, SignInError
            if not hasattr(self, '_google_verifier'):
                self._google_verifier = TokenVerifier()
            info = await self._google_verifier.verify('google', credential, cid, nonce)
            if info.get('azp', cid) != cid:
                raise ValueError()
        except Exception:
            self.n['log'].warning('accounts Google verification failed')
            return self.J({'ok': False, 'err': 'google_fail'})
        sub = 'g:' + info['sub']
        email = str(info.get('email', '')).strip().lower() if str(info.get('email_verified')).lower() == 'true' else ''
        if not self.EMAIL_RX.fullmatch(email):
            email = ''
        name = str(info.get('name') or info.get('given_name') or '')[:64]
        if req.headers.get('X-Init') and not self.current(req):
            return self.J({'ok': False, 'err': 'auth'}, 401)
        cur = self.current(req)
        if cur:
            current = self.account(cur)
            if not current or current['blocked']:
                return self.J({'ok': False, 'err': 'auth'}, 401)
            if current['google'] and current['google'] != sub:
                return self.J({'ok': False, 'err': 'taken'}, 409)
            if not self.attach(cur, 'google', sub):
                return self.J({'ok': False, 'err': 'taken'}, 409)
            return self.J({'ok': True, 'linked': 'google'})
        uid = self.find('google', sub)
        if uid is not None:
            return self.signed_in(uid, req)
        if email and self.find('email', email):
            return self.J({'ok': False, 'err': 'account_exists'}, 409)
        uid = self.create('google', sub, name)
        if email:
            self.attach(uid, 'email', email)
        return self.signed_in(uid, req, True)
    TEXT = {'ask': '🔐 <b>ورود به برنامهٔ واخان</b>\n\nیک گوشی می\u200cخواهد با حساب تو وارد برنامهٔ واخان شود.\nاگر خودت هستی «✅ بله، وارد شو» را بزن.\n\n⚠️ اگر این کار را تو شروع نکردی، هیچ دکمه\u200cای را نزن.', 'ok': '✅ <b>ورود انجام شد</b>\n\nحالا به برنامهٔ واخان برگرد؛ خودکار وارد می\u200cشوی.', 'expired': '⌛ این لینک ورود کهنه شده. در برنامه دوباره «ورود با تلگرام» را بزن.', 'yes': '✅ بله، وارد شو', 'no': '✖️ نه، من نبودم', 'back': '📱 برگشت به واخان', 'denied': 'ورود رد شد.'}

    def J(self, d, status=200):
        from aiohttp import web
        return web.json_response(d, status=status, headers={'Cache-Control': 'no-store'})

    async def body(self, req):
        try:
            b = await req.json()
            return b if isinstance(b, dict) else {}
        except Exception:
            return {}

    def limited(self, req, per_min):
        # Only our loopback reverse proxy may supply this dedicated, overwritten header.
        # Never trust client-supplied CF-Connecting-IP or X-Forwarded-For.
        try:
            peer = ipaddress.ip_address(req.remote or '')
            ip = str(peer)
            shared_proxy = peer.is_loopback
            forwarded = req.headers.get('X-Wakhan-Client-IP', '')
            try:
                configured = self.n['dbq']("select v from wkm_settings where k='auth_trusted_proxy_ip'")
                proxy_verified = bool(configured and configured[0][0] == '1')
            except Exception:
                proxy_verified = False
            if peer.is_loopback and proxy_verified and forwarded:
                try:
                    ip = str(ipaddress.ip_address(forwarded))
                    shared_proxy = False
                except ValueError: pass
        except ValueError:
            ip = 'unknown-peer'
            shared_proxy = True
        now = time.monotonic()
        key = (ip, int(per_min))
        attempts = [stamp for stamp in self.rate.get(key, []) if now - stamp < 60]
        budget = self.SHARED_AUTH_BUDGET.get(per_min, per_min) if shared_proxy else per_min
        blocked = len(attempts) >= budget
        if not blocked:
            attempts.append(now)
        self.rate[key] = attempts
        self.rate.move_to_end(key)
        while len(self.rate) > 10000:
            self.rate.popitem(last=False)
        return blocked

    def current(self, req):
        raw = req.headers.get('X-Init', '')
        return self.key_uid(raw)[0] if raw.startswith(self.PREFIX) else None

    async def config(self, req):
        return self.J({'ok': True, 'google': self.env('WKA_GOOGLE_CLIENT_ID'), 'email': self.mail_ready(), 'native': True, 'version': '0.2.11-beta', 'features': ['private_replies', 'chat_media', 'room_tools', 'preferences', 'royal_rooms', 'online_visibility', 'native_room_video', 'free_music_cinema', 'regional_commerce'], 'push': bool(getattr(self, 'push', None) and self.push.key())})

    async def profile(self, req):
        raw = req.headers.get('X-Init', '')
        uid = self.key_uid(raw)[0] if raw.startswith(self.PREFIX) else self.current(req)
        if not uid:
            return self.J({'ok': False, 'err': 'auth'}, 401)
        a = self.ensure(uid)
        if a['blocked']:
            return self.J({'ok': False, 'err': 'too_young'})
        b = await self.body(req)
        if a['done'] and b.get('avatar') and (not b.get('name')) and ('birth' not in b) and ('username' not in b):
            err = await self.save_avatar(uid, b['avatar'])
            return self.J({'ok': False, 'err': err} if err else {'ok': True, 'complete': True})
        name = re.sub('\\s+', ' ', str(b.get('name', ''))).strip()[:40]
        if len(name) < 2:
            return self.J({'ok': False, 'err': 'name_short'})
        if a['done'] and 'birth' not in b and ('username' not in b):
            self.touch_user(uid, name)
            self.n['dbx']('update wka_accounts set name=? where uid=?', name, uid)
            return self.J({'ok': True, 'name': name, 'complete': True})
        user = str(b.get('username', '')).strip().lstrip('@').lower()
        if not self.USER_RX.match(user):
            return self.J({'ok': False, 'err': 'username_bad'})
        if not self.username_free(user, uid):
            return self.J({'ok': False, 'err': 'username_taken'})
        birth = str(b.get('birth', '')).strip()
        age = self.age(birth)
        if age is None or age > 120:
            return self.J({'ok': False, 'err': 'birth_bad'})
        if not b.get('terms'):
            return self.J({'ok': False, 'err': 'terms'})
        if age < 16:
            self.n['dbx']('update wka_accounts set blocked=1, birth=? where uid=?', birth, uid)
            self.n['dbx']('delete from wka_sessions where uid=?', uid)
            return self.J({'ok': False, 'err': 'too_young'})
        if b.get('avatar'):
            err = await self.save_avatar(uid, b['avatar'])
            if err:
                return self.J({'ok': False, 'err': err})
        try:
            self.n['dbx']('update wka_accounts set name=?, username=?, birth=?, terms=1, done=1 where uid=?', name, user, birth, uid)
        except Exception:
            return self.J({'ok': False, 'err': 'username_taken'})
        self.touch_user(uid, name, user)
        return self.J({'ok': True, 'name': name, 'username': user, 'complete': True})

    async def username(self, req):
        u = str(req.query.get('u', '')).strip().lstrip('@').lower()
        raw = req.headers.get('X-Init', '')
        uid = self.key_uid(raw)[0] if raw.startswith(self.PREFIX) else None
        if not self.USER_RX.match(u):
            return self.J({'ok': True, 'free': False, 'err': 'username_bad'})
        return self.J({'ok': True, 'free': self.username_free(u, uid)})

    async def me(self, req):
        uid = self.current(req)
        if not uid:
            return self.J({'ok': False, 'err': 'auth'}, 401)
        a = self.ensure(uid)
        if a['blocked']:
            return self.J({'ok': False, 'err': 'too_young'}, 403)
        ids = self.n.get('WM_PUBLIC_IDS')
        return self.J({'ok': True, 'uid': uid, 'public_id': ids.assign(uid) if ids else None, 'email': a['email'] or '', 'google': bool(a['google']), 'name': self.user(uid).get('name', ''), 'username': a['username'] or '', 'complete': bool(a['done']), 'username_next': self.uname_next(uid)})
    UNAME_DAYS = 14

    def uname_next(self, uid):
        r = self.n['dbq']('select uname_ts from wka_accounts where uid=?', uid)
        ts = int(r[0][0] or 0) if r else 0
        nxt = ts + self.UNAME_DAYS * 86400 if ts else 0
        return nxt if nxt > time.time() else 0

    async def username_change(self, req):
        uid = self.current(req)
        if not uid:
            return self.J({'ok': False, 'err': 'auth'}, 401)
        a = self.ensure(uid)
        if a['blocked']:
            return self.J({'ok': False, 'err': 'too_young'}, 403)
        if not a['done']:
            return self.J({'ok': False, 'err': 'not_done'})
        b = await self.body(req)
        user = str(b.get('username', '')).strip().lstrip('@').lower()
        if not self.USER_RX.match(user):
            return self.J({'ok': False, 'err': 'username_bad'})
        old = (a['username'] or '').lower()
        if user == old:
            return self.J({'ok': True, 'username': user, 'username_next': self.uname_next(uid)})
        nxt = self.uname_next(uid)
        if nxt:
            return self.J({'ok': False, 'err': 'username_wait', 'username_next': nxt})
        if not self.username_free(user, uid):
            return self.J({'ok': False, 'err': 'username_taken'})
        now = int(time.time())
        try:
            self.n['dbx']('update wka_accounts set username=?, uname_ts=? where uid=?', user, now, uid)
        except Exception:
            return self.J({'ok': False, 'err': 'username_taken'})
        self.n['dbx']('delete from wka_old_names where name=?', user)
        if old:
            self.n['dbx']('insert or replace into wka_old_names(name, uid, until) values(?,?,?)', old, uid, now + self.UNAME_DAYS * 86400)
        self.touch_user(uid, (self.user(uid) or {}).get('name') or a['name'] or '', user)
        return self.J({'ok': True, 'username': user, 'username_next': self.uname_next(uid)})

    async def logout(self, req):
        raw = req.headers.get('X-Init', '')
        if raw.startswith(self.PREFIX):
            _uid, sid = self.key_uid(raw)
            if sid:
                self.n['dbx']('delete from wka_sessions where sid=?', sid)
        return self.J({'ok': True})

    async def save_avatar(self, uid, data):
        com = self.n.get('WM_COMMUNITY70')
        if not com:
            return 'err'
        try:
            com.ensure(uid)
            row = com.row(uid)
            await com.save_profile(uid, {'name': row.get('name') or '', 'rev': row['rev'], 'avatar': data})
            return None
        except Exception as e:
            return getattr(e, 'code', None) or 'photo_invalid'

    def own_photo(self, uid):
        try:
            com = self.n['WM_COMMUNITY70']
            name = com.row(uid).get('photo')
            if name:
                return (com.photos / name).read_bytes()
        except Exception:
            pass
        return None

    def avatar_hooks(self):
        profile = self.n.get('WM_SYNC')
        if not profile:
            return
        old_avatar, old_photo = (profile.avatar, profile.photo)

        async def photo(uid):
            return self.own_photo(int(uid)) or await old_photo(uid)

        async def avatar(req):
            from aiohttp import web
            raw = req.match_info.get('u', '')
            if re.fullmatch('\\d{1,19}', raw):
                data = self.own_photo(int(raw))
                if data:
                    return web.Response(body=data, content_type='image/jpeg', headers={'Cache-Control': 'private,max-age=120', 'X-Content-Type-Options': 'nosniff'})
            return await old_avatar(req)
        profile.photo, profile.avatar = (photo, avatar)

    async def resolve(self, req):
        query = str(req.query.get('q', '')).strip()
        uid = None
        if query.isdigit() and len(query) <= 19:
            number = int(query)
            ids = self.n.get('WM_PUBLIC_IDS')
            uid = ids.resolve(number) if ids else None
            if uid is None:
                row = self.n['dbq']('select uid from wka_accounts where uid=? and done=1 and blocked=0', number)
                uid = int(row[0][0]) if row else None
        else:
            query = query.lstrip('@').lower()
            row = self.n['dbq']('select uid from wka_accounts where lower(username)=? and done=1 and blocked=0', query)
            uid = int(row[0][0]) if row else None
        if uid is None:
            return self.J({'ok': False, 'err': 'not_found'})
        user = self.user(uid)
        account = self.account(uid)
        ids = self.n.get('WM_PUBLIC_IDS')
        return self.J({'ok': True, 'uid': uid, 'public_id': ids.get(uid) if ids else None, 'name': user.get('name') or '', 'username': account.get('username') or ''})
    REASONS = ('spam', 'abuse', 'nudity', 'violence', 'fake', 'minor', 'other')

    async def report(self, req):
        uid = int(req['u']['id'])
        b = await self.body(req)
        reason = str(b.get('reason', ''))
        if reason not in self.REASONS:
            return self.J({'ok': False, 'err': 'bad_reason'})
        target = int(b.get('uid') or 0)
        hall = re.sub('[^A-Za-z0-9]', '', str(b.get('hall') or ''))[:12]
        if not target and (not hall):
            return self.J({'ok': False, 'err': 'bad_target'})
        if target == uid:
            return self.J({'ok': False, 'err': 'bad_target'})
        note = re.sub('\\s+', ' ', str(b.get('note') or '')).strip()[:500]
        now = int(time.time())
        recent = self.n['dbq']('select count(*) from wka_reports where reporter=? and ts>?', uid, now - 3600)[0][0]
        if recent >= 20:
            return self.J({'ok': False, 'err': 'slow_down'})
        self.n['dbx']('insert into wka_reports(reporter, target, hall, reason, note, ts) values(?,?,?,?,?,?)', uid, target, hall, reason, note, now)
        if b.get('block') and target:
            try:
                self.n['WM_COMMUNITY70'].friend(uid, {'uid': target, 'action': 'block'})
            except Exception:
                pass
        return self.J({'ok': True})

    async def delete_account(self, req):
        uid = self.current(req)
        if not uid:
            return self.J({'ok': False, 'err': 'auth'}, 401)
        b = await self.body(req)
        a = self.ensure(uid)
        want = (a['username'] or '').lower()
        if want and str(b.get('confirm', '')).strip().lstrip('@').lower() != want:
            return self.J({'ok': False, 'err': 'confirm'})
        self.wipe(uid)
        return self.J({'ok': True})

    def wipe(self, uid):
        community = self.n.get('WM_COMMUNITY70')
        if community and getattr(community, 'room_tools', None):
            community.room_tools.wipe(int(uid))
        ids = self.n.get('WM_PUBLIC_IDS')
        if ids:
            ids.retire(int(uid))
        'everything that belongs to this person, gone (payments stay only as anonymous numbers)'
        uid = int(uid)
        steps = [('delete from wka_sessions where uid=?', (uid,)), ('delete from wka_push where uid=?', (uid,)), ('delete from wka_old_names where uid=?', (uid,)), ('delete from wka_accounts where uid=?', (uid,)), ('delete from wm70_friends where a=? or b=?', (uid, uid)), ('delete from wm70_blocks where actor=? or target=?', (uid, uid)), ('delete from wm70_dm where sender=? or recipient=?', (uid, uid)), ('delete from wm70_reads where uid=? or peer=?', (uid, uid)), ('delete from wm70_room_messages where sender=?', (uid,)), ('delete from wm51_halls where uid=?', (uid,)), ('delete from rooms where owner=?', (uid,)), ('delete from wka_reports where reporter=?', (uid,))]
        com = self.n.get('WM_COMMUNITY70')
        try:
            photo = com.row(uid).get('photo') if com else ''
            if photo:
                (com.photos / photo).unlink(missing_ok=True)
        except Exception:
            pass
        steps.append(('delete from wm70_profiles where uid=?', (uid,)))
        steps.append(('delete from users where uid=?', (uid,)))
        try:
            if getattr(self, 'media', None):
                self.media.wipe(uid)
        except Exception:
            pass
        for q, p in steps:
            try:
                self.n['dbx'](q, *p)
            except Exception:
                pass
        try:
            if com:
                com.changed(uid)
        except Exception:
            pass

    async def page(self, req):
        from aiohttp import web
        from wakhan_legal import render
        name = req.match_info.get('p', '')
        lang = (req.query.get('lang') or req.headers.get('Accept-Language', 'en'))[:2].lower()
        html_ = render(name, lang, self.env('WKA_CONTACT_EMAIL'))
        if not html_:
            raise web.HTTPNotFound()
        return web.Response(text=html_, content_type='text/html', headers={'Cache-Control': 'public, max-age=600'})

    def routes(self, app):
        r = app.router
        r.add_get('/api/app/config', self.config)
        r.add_post('/api/app/email/send', self.email_send)
        r.add_post('/api/app/email/verify', self.email_verify)
        r.add_post('/api/app/google', self.google)
        r.add_post('/api/app/profile', self.profile)
        r.add_get('/api/app/username', self.username)
        r.add_post('/api/app/username/change', self.username_change)
        r.add_get('/api/app/me', self.me)
        r.add_post('/api/app/logout', self.logout)
        r.add_post('/api/app/report', self.n['auth'](self.report))
        r.add_get('/api/app/resolve', self.n['auth'](self.resolve))
        r.add_post('/api/app/delete', self.delete_account)
        r.add_get('/{p:terms|privacy|delete-account}', self.page)
        if getattr(self, 'push', None):
            self.push.routes(app)
        if getattr(self, 'media', None):
            self.media.routes(app)

    def install(self):
        self.init()
        self.n['check_init'] = self.check_key
        community = self.n['WM_COMMUNITY70']
        old_routes = community.routes

        def routes(app):
            old_routes(app)
            self.routes(app)
        community.routes = routes
        self.avatar_hooks()
        from wakhan_push import Push
        self.push = Push(self)
        self.push.install()
        from wakhan_chatmedia import ChatMedia
        self.media = ChatMedia(self)
        self.media.init()
