"""M81 companion: system-browser Google/Facebook, one-use device handoff and native media CORS.
No bot tokens, provider secrets or account keys are exposed in redirect URLs.
"""
import asyncio, hashlib, hmac, html, json, re, secrets, time
from aiohttp import web
ORIGIN = 'https://music.kabulcafe.uk'
APP_ORIGINS = frozenset(('https://localhost', 'capacitor://localhost'))

def sha(value):
    return hashlib.sha256(value.encode()).hexdigest()

class NativeApp:

    def __init__(self, ns, accounts):
        self.n, self.a = (ns, accounts)
        self.pending = {}
        self.states = {}
        self.lock = asyncio.Semaphore(4)

    def env(self, key, default=''):
        return self.a.env(key, default)

    def facebook_ready(self):
        return bool(re.fullmatch('[0-9]{5,30}', self.env('WKA_FACEBOOK_APP_ID')) and self.env('WKA_FACEBOOK_APP_SECRET'))

    def init(self):
        self.a.init()
        if 'facebook' not in {r[1] for r in self.n['dbq']('pragma table_info(wka_accounts)')}:
            self.n['dbx']('alter table wka_accounts add column facebook text')
        self.n['dbx']('create unique index if not exists wka_facebook_unique on wka_accounts(facebook) where facebook is not null')

    def get(self, ticket):
        if not isinstance(ticket, str):
            return None
        row = self.pending.get(ticket)
        if not row or row['expires'] <= time.time():
            self.pending.pop(ticket, None)
            return None
        return row

    def cookie(self, req, ticket, row):
        value = req.cookies.get('wka_native', '')
        return hmac.compare_digest(sha(value), row.get('cookie', '')) and value.startswith(ticket + '.')

    def csrf(self, req, body):
        ticket = body.get('ticket', '')
        row = self.get(ticket)
        if not row or not self.cookie(req, ticket, row) or (not hmac.compare_digest(str(body.get('csrf', '')).encode(), row.get('csrf', '').encode())):
            return (None, None)
        return (ticket, row)

    async def start(self, req):
        if self.a.limited(req, 12):
            return self.a.J({'ok': False, 'err': 'rate'}, 429)
        b = await self.a.body(req)
        provider = b.get('provider')
        if provider == 'facebook' and (not self.facebook_ready()):
            return self.a.J({'ok': False, 'err': 'facebook_off'}, 409)
        if provider == 'google' and (not self.env('WKA_GOOGLE_CLIENT_ID')):
            return self.a.J({'ok': False, 'err': 'google_off'}, 409)
        if provider not in ('google', 'facebook'):
            return self.a.J({'ok': False, 'err': 'bad'}, 400)
        for ticket in list(self.pending):
            self.get(ticket)
        for key, ticket in list(self.states.items()):
            if ticket not in self.pending:
                self.states.pop(key, None)
        if len(self.pending) >= 1024:
            return self.a.J({'ok': False, 'err': 'rate'}, 429)
        ticket = secrets.token_urlsafe(18)
        proof = secrets.token_urlsafe(32)
        row = {'provider': provider, 'nonce': secrets.token_urlsafe(32), 'proof': sha(proof), 'expires': time.time() + 300, 'state': 'new', 'uid': None, 'client': 'web' if b.get('client') == 'web' else 'android', 'link_uid': None, 'link_sid': None}
        if b.get('link') is True:
            uid, sid = self.a.key_uid(req.headers.get('X-Init', ''))
            if not uid:
                return self.a.J({'ok': False, 'err': 'auth'}, 401)
            row.update(link_uid=uid, link_sid=sid)
        from wakhan_signin import account_intent, SignInError
        try:
            row['intent'] = account_intent(b, link=bool(row.get('link_uid')))
        except SignInError as exc:
            return self.a.J({'ok': False, 'err': exc.code}, exc.status)
        self.pending[ticket] = row
        return self.a.J({'ok': True, 'ticket': ticket, 'proof': proof, 'expires': int(row['expires']), 'display_code': ticket[:6].upper(), 'url': ORIGIN + '/app-auth?ticket=' + ticket, 'intent': row['intent']})

    def frame(self, title, body):
        return web.Response(text='<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Wakhan · ' + html.escape(title) + '</title><style>body{background:#071019;color:#f4f7fb;font:15px/2 Tahoma,Arial;margin:0;padding:30px 22px}main{max-width:420px;margin:8vh auto}h1{font-size:24px}p{color:#a8bbca}button,a{font:inherit;border-radius:12px;border:0;background:#39c9ae;color:#082b23;padding:12px 22px;display:inline-block;text-decoration:none}code{font:700 25px/2 system-ui;letter-spacing:3px}button:disabled{opacity:.5}</style><main><b style="letter-spacing:4px;font-family:system-ui">WAKHAN</b><h1>' + html.escape(title) + '</h1>' + body + '</main></html>', content_type='text/html', headers={'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff'})

    def finish_page(self, ticket, row):
        code = html.escape(ticket[:6].upper())
        name = html.escape(self.a.user(row['uid']).get('name') or 'Wakhan')
        values = json.dumps({'ticket': ticket, 'csrf': row['csrf']}).replace('<', '\\u003c')
        body = '<p>حساب: <b>' + name + '</b></p><p>فقط اگر همین کد در اپ خودت دیده می\u200cشود، ورود ره تأیید کو.</p><code dir="ltr">' + code + '</code><p><button id="confirm">تأیید ورود</button></p><p id="status"></p><a id="back" hidden href="' + ('/?app=1' if row['client'] == 'web' else 'wakhan://auth') + '">برگشت به واخان</a><script>const data=' + values + ';document.getElementById("confirm").onclick=async function(){this.disabled=true;try{const r=await fetch("/api/app/native/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}),j=await r.json();if(!j.ok)throw Error();document.getElementById("status").textContent="ورود تأیید شد؛ به واخان برگرد.";document.getElementById("back").hidden=false}catch(e){this.disabled=false;document.getElementById("status").textContent="تأیید نشد؛ دوباره کوشش کو."}};</script>'
        return self.frame('تأیید ورود به واخان', body)

    async def browser(self, req):
        ticket = req.query.get('ticket', '')
        row = self.get(ticket)
        if not row:
            return self.frame('درخواست ختم شده', '<p>از اپ واخان دوباره کوشش کو.</p>')
        if row['state'] != 'new':
            return self.frame('درخواست استفاده شده', '<p>از اپ واخان دوباره کوشش کو.</p>')
        cookie = ticket + '.' + secrets.token_urlsafe(24)
        row['cookie'] = sha(cookie)
        row['csrf'] = secrets.token_urlsafe(24)
        row['state'] = 'browser'
        if row['provider'] == 'facebook':
            state = secrets.token_urlsafe(32)
            self.states[sha(state)] = ticket
            from urllib.parse import urlencode
            version = self.env('WKA_FACEBOOK_GRAPH_VERSION', 'v24.0')
            if not re.fullmatch('v[0-9]{1,2}\\.0', version):
                version = 'v24.0'
            row['graph'] = version
            url = 'https://www.facebook.com/' + version + '/dialog/oauth?' + urlencode({'client_id': self.env('WKA_FACEBOOK_APP_ID'), 'redirect_uri': ORIGIN + '/api/app/native/facebook/callback', 'state': state, 'response_type': 'code', 'scope': 'public_profile,email'})
            response = web.HTTPFound(url)
        else:
            values = json.dumps({'ticket': ticket, 'csrf': row['csrf'], 'client': self.env('WKA_GOOGLE_CLIENT_ID'), 'nonce': row['nonce']}).replace('<', '\\u003c')
            response = self.frame('ورود با Google', '<p>با حساب Google خودت وارد شو. پس از تأیید، به اپ واخان برگرد.</p><div id="google"></div><p id="status"></p><script>const cfg=' + values + ';function ready(){google.accounts.id.initialize({client_id:cfg.client,nonce:cfg.nonce,ux_mode:"popup",callback:async value=>{document.getElementById("status").textContent="در حال بررسی…";try{const r=await fetch("/api/app/native/google",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticket:cfg.ticket,csrf:cfg.csrf,credential:value.credential})}),j=await r.json();if(!j.ok){const messages={no_account:"حسابی پیدا نشد؛ از بخش ثبت‌نام حساب بسازید.",account_exists:"این حساب موجود است؛ از بخش ورود وارد شوید.",registration_incomplete:"ثبت‌نام کامل نشده؛ از بخش ثبت‌نام ادامه دهید."};document.getElementById("status").textContent=messages[j.err]||"ورود انجام نشد؛ دوباره تلاش کنید.";if(messages[j.err]){const back=document.createElement("a");back.href="wakhan://auth";back.textContent="برگشت به واخان";document.getElementById("status").appendChild(back)}return}location.replace("/app-auth/confirm?ticket="+encodeURIComponent(cfg.ticket))}catch(e){document.getElementById("status").textContent="ورود انجام نشد؛ دوباره کوشش کو."}}});google.accounts.id.renderButton(document.getElementById("google"),{theme:"filled_black",size:"large",shape:"pill"})}</script><script src="https://accounts.google.com/gsi/client" async onload="ready()"></script>')
        response.set_cookie('wka_native', cookie, secure=True, httponly=True, samesite='Lax', max_age=300, path='/')
        return response

    def link_valid(self, row):
        if not row.get('link_uid'):
            return True
        records = self.n['dbq']('select uid,seen from wka_sessions where sid=?', row.get('link_sid'))
        return bool(records and int(records[0][0]) == row['link_uid'] and (time.time() - int(records[0][1]) < self.a.KEY_TTL))

    async def google(self, req):
        body = await self.a.body(req)
        ticket, row = self.csrf(req, body)
        if not row or row['provider'] != 'google' or row['state'] != 'browser':
            return self.a.J({'ok': False, 'err': 'state'}, 403)
        row['state'] = 'verifying'
        request = req
        if row.get('link_uid'):
            if not self.link_valid(row):
                return self.a.J({'ok': False, 'err': 'auth'}, 401)
            owner = self

            class LinkedRequest:
                headers = {**req.headers, 'X-Init': owner.a.PREFIX + row['link_sid'] + '.' + owner.a.sign(row['link_sid'])}
                remote = req.remote

                async def json(self):
                    return body
            request = LinkedRequest()
        response = await self.a.google(request, nonce=row['nonce'], intent=row.get('intent', 'auto'))
        value = json.loads(response.body)
        if not value.get('ok'):
            if value.get('err') in ('no_account', 'account_exists', 'registration_incomplete'):
                row.update(state='rejected', error=value['err'])
            else:
                row['state'] = 'browser'
            return response
        if row.get('link_uid'):
            if value.get('key'):
                _, sid = self.a.key_uid(value['key'])
                if sid:
                    self.n['dbx']('delete from wka_sessions where sid=?', sid)
            if value.get('linked') != 'google' or not self.link_valid(row):
                return self.a.J({'ok': False, 'err': 'auth'}, 401)
            uid = row['link_uid']
        else:
            uid, sid = self.a.key_uid(value.get('key', ''))
            if not uid:
                return self.a.J({'ok': False, 'err': 'auth'}, 401)
            self.n['dbx']('delete from wka_sessions where sid=?', sid)
        row['uid'] = uid
        row['state'] = 'identified'
        return self.a.J({'ok': True})

    async def facebook_callback(self, req):
        state = req.query.get('state', '')
        ticket = self.states.pop(sha(state), None) if isinstance(state, str) and len(state) <= 100 else None
        row = self.get(ticket)
        if not row or row['provider'] != 'facebook' or row['state'] != 'browser' or (not self.cookie(req, ticket, row)):
            return self.frame('ورود تأیید نشد', '<p>درخواست ورود معتبر نیست. از اپ دوباره کوشش کو.</p>')
        row['state'] = 'verifying'
        code = req.query.get('code', '')
        if not code or len(code) > 2048:
            return self.frame('ورود لغو شد', '<p>هیچ حسابی وارد نشد. به اپ برگرد.</p>')
        try:
            import aiohttp
            root = 'https://graph.facebook.com/' + row['graph']
            app_id = self.env('WKA_FACEBOOK_APP_ID')
            secret = self.env('WKA_FACEBOOK_APP_SECRET')
            async with self.lock:
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as session:
                    async with session.post(root + '/oauth/access_token', data={'client_id': app_id, 'client_secret': secret, 'redirect_uri': ORIGIN + '/api/app/native/facebook/callback', 'code': code}) as r:
                        token = await r.json(content_type=None)
                    access = token.get('access_token')
                    if not isinstance(access, str) or not access:
                        raise ValueError('facebook_failed')
                    async with session.get(root + '/debug_token', params={'input_token': access}, headers={'Authorization': 'Bearer ' + app_id + '|' + secret}) as r:
                        debug = (await r.json(content_type=None)).get('data', {})
                    if not debug.get('is_valid') or str(debug.get('app_id')) != app_id or (not debug.get('user_id')):
                        raise ValueError('facebook_failed')
                    async with session.get(root + '/me', params={'fields': 'id,name', 'appsecret_proof': hmac.new(secret.encode(), access.encode(), hashlib.sha256).hexdigest()}, headers={'Authorization': 'Bearer ' + access}) as r:
                        profile = await r.json(content_type=None)
            if str(profile.get('id')) != str(debug['user_id']):
                raise ValueError('facebook_failed')
            if not self.link_valid(row):
                raise ValueError('auth')
            row['uid'] = self.facebook_identity(profile, row.get('link_uid'), row.get('intent', 'auto'))
            row['state'] = 'identified'
            return self.finish_page(ticket, row)
        except Exception as exc:
            if type(exc) is ValueError and str(exc) in ('no_account', 'account_exists', 'registration_incomplete'):
                row.update(state='rejected', error=str(exc))
            self.n['log'].warning('Wakhan Facebook sign-in failed')
            return self.frame('ورود انجام نشد', '<p>از اپ واخان دوباره کوشش کو.</p>')

    def facebook_identity(self, profile, link_uid=None, intent='auto'):
        subject = str(profile.get('id', ''))
        if not re.fullmatch('[0-9]{1,40}', subject):
            raise ValueError('facebook_failed')
        self.init()
        subject = 'fb:' + subject
        uid = self.a.find('facebook', subject)
        if link_uid:
            if not self.a.attach(link_uid, 'facebook', subject):
                raise ValueError('taken')
            return link_uid
        from wakhan_signin import intent_error
        mode_error = intent_error(self.a, uid, intent)
        if mode_error:
            raise ValueError(mode_error)
        if uid is None:
            uid = self.a.create('facebook', subject, str(profile.get('name') or 'Wakhan')[:64])
        return uid

    async def confirmation(self, req):
        ticket = req.query.get('ticket', '')
        row = self.get(ticket)
        if not row or row['state'] != 'identified' or (not self.cookie(req, ticket, row)):
            return self.frame('درخواست معتبر نیست', '<p>از اپ دوباره کوشش کو.</p>')
        return self.finish_page(ticket, row)

    async def confirm(self, req):
        ticket, row = self.csrf(req, await self.a.body(req))
        if not row or row['state'] != 'identified' or (not row['uid']) or (not self.link_valid(row)):
            return self.a.J({'ok': False, 'err': 'state'}, 403)
        row['state'] = 'approved'
        return self.a.J({'ok': True})

    async def poll(self, req):
        body = await self.a.body(req)
        ticket = body.get('ticket', '')
        proof = body.get('proof', '')
        row = self.get(ticket)
        if not row or not isinstance(proof, str) or (not hmac.compare_digest(sha(proof), row['proof'])):
            return self.a.J({'ok': False, 'err': 'code_expired'}, 401)
        if row['state'] == 'rejected':
            self.pending.pop(ticket, None)
            return self.a.J({'ok': False, 'err': row['error']}, 409)
        if row['state'] != 'approved':
            return self.a.J({'ok': True, 'wait': True})
        self.pending.pop(ticket, None)
        if row.get('link_uid'):
            if not self.link_valid(row):
                return self.a.J({'ok': False, 'err': 'auth'}, 401)
            return self.a.J({'ok': True, 'linked': row['provider'], 'uid': row['uid']})
        from wakhan_signin import intent_error
        mode_error = intent_error(self.a, row['uid'], row.get('intent', 'auto'))
        if mode_error:
            return self.a.J({'ok': False, 'err': mode_error}, 409)
        return self.a.signed_in(row['uid'], req)

    def install(self):
        self.init()
        old_config = self.a.config

        async def config(req):
            response = await old_config(req)
            value = json.loads(response.body)
            value.update(native=True, facebook=self.facebook_ready())
            return self.a.J(value, response.status)
        self.a.config = config
        old_me = self.a.me

        async def me(req):
            response = await old_me(req)
            value = json.loads(response.body)
            if value.get('ok'):
                rows = self.n['dbq']('select facebook from wka_accounts where uid=?', value['uid'])
                value['facebook'] = bool(rows and rows[0][0])
            return self.a.J(value, response.status)
        self.a.me = me
        old_routes = self.a.routes

        def routes(app):
            if native_cors not in app.middlewares:
                app.middlewares.append(native_cors)
            old_routes(app)
            router = app.router
            router.add_post('/api/app/native/start', self.start)
            router.add_get('/app-auth', self.browser)
            router.add_get('/app-auth/confirm', self.confirmation)
            router.add_post('/api/app/native/google', self.google)
            router.add_get('/api/app/native/facebook/callback', self.facebook_callback)
            router.add_post('/api/app/native/confirm', self.confirm)
            router.add_post('/api/app/native/poll', self.poll)
        self.a.routes = routes

        from wakhan_signin import install as install_signin
        install_signin(self.a)

@web.middleware
async def native_cors(req, handler):
    origin = req.headers.get('Origin')
    if req.method == 'OPTIONS' and origin in APP_ORIGINS and (req.headers.get('Access-Control-Request-Method') in ('GET', 'POST')):
        response = web.Response(status=204)
    else:
        try:
            response = await handler(req)
        except web.HTTPException as error:
            response = error
    if origin in APP_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Vary'] = 'Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Init, X-Cinema-Session, Range'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Range, Content-Length, Accept-Ranges'
    return response
