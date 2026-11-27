"""Native Google / Apple sign-in. Install before the existing account routes.

Uses WakhanApp's existing UIDs, sessions and profile completion rules. No balance,
purchase or Facebook identity tables are rewritten. Configuration contains only
public OAuth client IDs; no Apple signing key is needed to verify native tokens.
"""
import asyncio
import base64
import hashlib
import hmac
import json
import math
import re
import secrets
import sqlite3
import time

import aiohttp
from aiohttp import web
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa


class SignInError(Exception):
    def __init__(self, code, status=400):
        self.code, self.status = code, status


def account_intent(data, *, link=False):
    intent = data.get('intent', 'auto')
    if not isinstance(intent, str) or intent not in ('auto', 'signin', 'register', 'link'):
        raise SignInError('bad_request')
    if link:
        return 'link'
    if intent == 'link':
        raise SignInError('auth', 401)
    return intent


def intent_error(accounts, uid, intent):
    # The selected mode never chooses another UID or merges by email.
    # Legacy clients omit intent and retain their existing verified-provider flow.
    if intent in ('auto', 'link'):
        return None
    if uid is None:
        return 'no_account' if intent == 'signin' else None
    account = accounts.account(uid)
    if not account:
        return 'no_account'
    if account.get('blocked'):
        return 'too_young'
    if intent == 'register' and account.get('done'):
        return 'account_exists'
    if intent == 'signin' and not account.get('done'):
        return 'registration_incomplete'
    return None


def b64(raw):
    if not isinstance(raw, str) or not re.fullmatch(r'[A-Za-z0-9_-]+', raw):
        raise SignInError('provider_fail')
    try:
        return base64.urlsafe_b64decode(raw + '=' * (-len(raw) % 4))
    except Exception:
        raise SignInError('provider_fail') from None


class TokenVerifier:
    """Fixed issuers/JWKS endpoints; never follow a URL from a token header."""
    URLS = {'google': 'https://www.googleapis.com/oauth2/v3/certs',
            'apple': 'https://appleid.apple.com/auth/keys'}
    ISSUERS = {'google': ('https://accounts.google.com', 'accounts.google.com'),
               'apple': ('https://appleid.apple.com',)}

    def __init__(self):
        self.cache = {}
        self.locks = {p: asyncio.Lock() for p in self.URLS}

    async def keys(self, provider, kid):
        async with self.locks[provider]:
            now = time.monotonic()
            cached = self.cache.get(provider)
            if cached and cached[0] > now and kid in cached[2]:
                return cached[2][kid]
            # Unknown kids cannot trigger an unbounded upstream request flood.
            if cached and now - cached[1] < 60:
                raise SignInError('provider_fail')
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=8),
                                             trust_env=False) as session:
                async with session.get(self.URLS[provider], allow_redirects=False) as res:
                    if res.status != 200 or res.content_length and res.content_length > 65536:
                        raise SignInError('provider_fail', 503)
                    raw = bytearray()
                    async for part in res.content.iter_chunked(8192):
                        raw.extend(part)
                        if len(raw) > 65536:
                            raise SignInError('provider_fail', 503)
                    data = json.loads(raw)
            found = {}
            for key in data.get('keys', [])[:16]:
                if key.get('kty') != 'RSA' or key.get('use', 'sig') != 'sig' or key.get('alg', 'RS256') != 'RS256':
                    continue
                modulus, exponent = int.from_bytes(b64(key['n']), 'big'), int.from_bytes(b64(key['e']), 'big')
                if not 2048 <= modulus.bit_length() <= 8192 or exponent != 65537:
                    continue
                found[str(key['kid'])] = rsa.RSAPublicNumbers(exponent, modulus).public_key()
            self.cache[provider] = (now + 3600, now, found)
            if kid not in found:
                raise SignInError('provider_fail')
            return found[kid]

    async def verify(self, provider, token, audience, nonce):
        if provider not in self.URLS or not isinstance(token, str) or not 50 <= len(token) <= 16384:
            raise SignInError('provider_fail')
        try:
            head, body, signature = token.split('.')
            header, claims = json.loads(b64(head)), json.loads(b64(body))
            if not isinstance(header, dict) or not isinstance(claims, dict):
                raise ValueError()
            if header.get('alg') != 'RS256' or not isinstance(header.get('kid'), str) or len(header['kid']) > 200 or header.get('crit'):
                raise ValueError()
            key = await self.keys(provider, header['kid'])
            key.verify(b64(signature), (head + '.' + body).encode('ascii'), padding.PKCS1v15(), hashes.SHA256())
            now = time.time()
            exp, issued = claims.get('exp'), claims.get('iat')
            if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in (exp, issued)):
                raise ValueError()
            if exp <= now or issued > now + 30 or issued < now - 600:
                raise ValueError()
            if claims.get('iss') not in self.ISSUERS[provider] or claims.get('aud') != audience:
                raise ValueError()
            if not isinstance(claims.get('nonce'), str) or not hmac.compare_digest(claims['nonce'], nonce):
                raise ValueError()
            if not isinstance(claims.get('sub'), str) or not 1 <= len(claims['sub']) <= 255:
                raise ValueError()
            if 'azp' in claims and not isinstance(claims['azp'], str):
                raise ValueError()
            return claims
        except SignInError:
            raise
        except asyncio.CancelledError:
            raise
        except Exception:
            raise SignInError('provider_fail') from None


class NativeSignIn:
    TTL = 300

    def __init__(self, accounts, *, google_ios_client_id='', google_android_client_ids=(),
                 apple_enabled=False, apple_client_id='app.wakhan.music', verifier=None):
        self.a, self.n = accounts, accounts.n
        self.google_web = accounts.env('WKA_GOOGLE_CLIENT_ID')
        self.google_ios = google_ios_client_id.strip()
        self.google_android = tuple(google_android_client_ids)
        self.apple_client = apple_client_id
        self.apple_enabled = bool(apple_enabled)
        self.verifier = verifier or TokenVerifier()

    def init(self):
        self.a.init()
        columns = {row[1] for row in self.n['dbq']('pragma table_info(wka_accounts)')}
        if 'apple' not in columns:
            self.n['dbx']('alter table wka_accounts add column apple text')
        self.n['dbx']('create unique index if not exists wka_apple_unique on wka_accounts(apple) where apple is not null')
        self.n['dbx']('''create table if not exists wka_signin_challenges (
            id text primary key, proof text not null, provider text not null,
            platform text not null, nonce text not null, audience text not null,
            uid integer, sid text, expires integer not null, used integer not null default 0, intent text not null default 'auto')''')
        if 'intent' not in {r[1] for r in self.n['dbq']('pragma table_info(wka_signin_challenges)')}:
            self.n['dbx']("alter table wka_signin_challenges add column intent text not null default 'auto'")

    async def config(self, req):
        # Old iPhone binaries have the plugin but no embedded GID client IDs.
        # Advertise native Google only to a client which reports its own readiness.
        platform = req.query.get('platform', '')
        ready = req.query.get('native_google') == '1' and platform in ('ios', 'android')
        return self.a.J({'ok': True, 'email': self.a.mail_ready(), 'signin': {
            'version': 1, 'intent_version': 1, 'capability_version': 1,
            'google': {'android': bool(ready and platform == 'android' and self.google_web and self.google_android),
                       'ios': bool(ready and platform == 'ios' and self.google_web and self.google_ios)},
            'apple': {'ios': self.apple_enabled}}})

    def owner(self, req):
        raw = req.headers.get('X-Init', '')
        if not raw:
            return None, None
        uid, sid = self.a.key_uid(raw) if raw.startswith(self.a.PREFIX) else (None, None)
        if not uid or not sid:
            raise SignInError('auth', 401)
        account = self.a.account(uid)
        if not account or account['blocked']:
            raise SignInError('too_young', 403)
        return uid, sid

    async def body(self, req):
        if req.content_type != 'application/json' or req.content_length and req.content_length > 20000:
            raise SignInError('bad_request')
        try:
            raw = await req.content.read(20001)
            if len(raw) > 20000:
                raise ValueError()
            value = json.loads(raw)
            if not isinstance(value, dict):
                raise ValueError()
            return value
        except (ValueError, UnicodeError):
            raise SignInError('bad_request') from None

    def route(self, handler):
        async def call(req):
            try:
                if self.a.limited(req, 12):
                    raise SignInError('rate', 429)
                return await handler(req)
            except SignInError as error:
                return self.a.J({'ok': False, 'err': error.code}, error.status)
            except (aiohttp.ClientError, TimeoutError):
                return self.a.J({'ok': False, 'err': 'provider_fail'}, 503)
        return call

    async def challenge(self, req):
        data = await self.body(req)
        provider, platform = data.get('provider'), data.get('platform')
        if provider not in ('google', 'apple') or platform not in ('ios', 'android') or type(data.get('link', False)) is not bool:
            raise SignInError('provider_bad')
        uid, sid = self.owner(req)
        if data.get('link') and not uid or not data.get('link') and uid:
            raise SignInError('auth', 401)
        intent = account_intent(data, link=bool(uid))
        if provider == 'apple':
            if platform != 'ios' or not self.apple_enabled:
                raise SignInError('apple_off', 503)
            client, audience = self.apple_client, self.apple_client
        else:
            if not self.google_web or platform == 'ios' and not self.google_ios or platform == 'android' and not self.google_android:
                raise SignInError('google_off', 503)
            client = self.google_ios if platform == 'ios' else self.google_web
            audience = self.google_web
        now = int(time.time())
        self.n['dbx']('delete from wka_signin_challenges where expires<? or used=1', now)
        if self.n['dbq']('select count(*) from wka_signin_challenges')[0][0] >= 2048:
            raise SignInError('rate', 429)
        challenge, proof, nonce = (secrets.token_urlsafe(32) for _ in range(3))
        self.n['dbx']('''insert into wka_signin_challenges
            (id,proof,provider,platform,nonce,audience,uid,sid,expires,intent) values(?,?,?,?,?,?,?,?,?,?)''',
            challenge, hashlib.sha256(proof.encode()).hexdigest(), provider, platform, nonce, audience, uid, sid, now + self.TTL, intent)
        return self.a.J({'ok': True, 'challenge': challenge, 'proof': proof, 'nonce': nonce,
                         'client_id': client, 'server_client_id': self.google_web if provider == 'google' else '',
                         'expires': now + self.TTL})

    async def exchange(self, req):
        data = await self.body(req)
        challenge, proof = data.get('challenge', ''), data.get('proof', '')
        if not isinstance(challenge, str) or not isinstance(proof, str) or not re.fullmatch(r'[A-Za-z0-9_-]{43}', challenge) or not re.fullmatch(r'[A-Za-z0-9_-]{43}', proof):
            raise SignInError('challenge_expired')
        rows = self.n['dbq']('select proof,provider,platform,nonce,audience,uid,sid,expires,used,intent from wka_signin_challenges where id=?', challenge)
        if not rows:
            raise SignInError('challenge_expired')
        digest, provider, platform, nonce, audience, uid, sid, expires, used, intent = rows[0]
        if used or expires <= time.time() or not hmac.compare_digest(digest, hashlib.sha256(proof.encode()).hexdigest()):
            raise SignInError('challenge_expired')
        if self.owner(req) != (uid, sid):
            raise SignInError('auth', 401)
        # One verification attempt per challenge, including invalid tokens.
        self.n['dbx']('update wka_signin_challenges set used=1 where id=? and used=0', challenge)
        if self.n['dbq']('select changes()')[0][0] != 1:
            raise SignInError('challenge_expired')
        claims = await self.verifier.verify(provider, data.get('id_token'), audience, nonce)
        if expires <= time.time():
            raise SignInError('challenge_expired')
        allowed_azp = {audience, self.google_ios} if platform == 'ios' else {audience, *self.google_android}
        if provider == 'google' and claims.get('azp', audience) not in allowed_azp:
            raise SignInError('provider_fail')
        # Revocation while the external signature check was in flight wins.
        if self.owner(req) != (uid, sid):
            raise SignInError('auth', 401)
        subject = ('g:' if provider == 'google' else 'a:') + claims['sub']
        existing = self.a.find(provider, subject)
        if uid:
            if existing and existing != uid:
                raise SignInError('taken', 409)
            current = self.n['dbq']('select ' + provider + ' from wka_accounts where uid=?', uid)[0][0]
            if current and current != subject:
                raise SignInError('already_linked', 409)
            try:
                if not self.a.attach(uid, provider, subject):
                    raise SignInError('taken', 409)
            except sqlite3.IntegrityError:
                raise SignInError('taken', 409) from None
            return self.a.J({'ok': True, 'linked': provider, 'uid': uid})
        mode_error = intent_error(self.a, existing, intent)
        if mode_error:
            raise SignInError(mode_error, 409)
        if existing:
            return self.a.signed_in(existing, req)
        verified_email = str(claims.get('email_verified', '')).lower() == 'true'
        email = str(claims.get('email', '')).strip().lower() if verified_email else ''
        if not re.fullmatch(r'[^@\s]{1,64}@[^@\s]{1,190}\.[A-Za-z]{2,24}', email):
            email = ''
        # Email match alone never takes over an old account, including Apple
        # relay addresses. Sign into that account first, then explicitly link.
        if email and self.a.find('email', email):
            raise SignInError('account_exists', 409)
        name = str(claims.get('name') or claims.get('given_name') or '')[:64]
        try:
            created = self.a.create(provider, subject, name)
        except sqlite3.IntegrityError:
            existing = self.a.find(provider, subject)
            if not existing:
                raise
            mode_error = intent_error(self.a, existing, intent)
            if mode_error:
                raise SignInError(mode_error, 409)
            return self.a.signed_in(existing, req)
        # A verified provider email may belong to this newly created account.
        # It never selects or merges an existing account. A later email-code
        # login can therefore recover the same UID rather than creating a duplicate.
        if email:
            try:
                self.a.attach(created, 'email', email)
            except sqlite3.IntegrityError:
                # Another account won the unique email binding concurrently.
                # Its identity is preserved; this provider login still owns created.
                pass
        return self.a.signed_in(created, req, True)

    async def me(self, req, original):
        response = await original(req)
        value = json.loads(response.body)
        if value.get('ok') and value.get('uid'):
            row = self.n['dbq']('select apple from wka_accounts where uid=?', int(value['uid']))
            value['apple'] = bool(row and row[0][0])
        return self.a.J(value, response.status)

    def install(self):
        """Call after NativeApp.install(), before accounts.routes(app) runs."""
        self.init()
        old_routes, old_me, old_config = self.a.routes, self.a.me, self.a.config
        async def config(req):
            response = await old_config(req)
            value = json.loads(response.body)
            if value.get('ok'):
                value.update(json.loads((await self.config(req)).body))
            return self.a.J(value, response.status)
        self.a.config = config
        async def me(req):
            return await self.me(req, old_me)
        self.a.me = me
        def routes(app):
            old_routes(app)
            from wakhan_security import install as install_security
            install_security(app)
            app.router.add_get('/api/app/signin/config', self.config)
            app.router.add_post('/api/app/signin/challenge', self.route(self.challenge))
            app.router.add_post('/api/app/signin/exchange', self.route(self.exchange))
        self.a.routes = routes
        self.n['WM_SIGNIN'] = self
        return self


def install(accounts):
    """Public settings live next to native-settings.json; never read private keys."""
    from pathlib import Path
    existing = accounts.n.get('WM_SIGNIN')
    if existing:
        return existing
    path = Path(accounts.n['BASE']) / 'signin-public.json'
    config = json.loads(path.read_text()) if path.is_file() else {}
    if not isinstance(config, dict):
        raise RuntimeError('SIGNIN_PUBLIC_CONFIG_INVALID')
    cid = re.compile(r'^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$')
    ios = config.get('google_ios_client_id', '')
    android = config.get('google_android_client_ids', [])
    apple = config.get('apple_enabled', False)
    web = config.get('google_server_client_id', '')
    if not isinstance(web, str) or web and (not cid.fullmatch(web) or web != accounts.env('WKA_GOOGLE_CLIENT_ID')):
        raise RuntimeError('SIGNIN_SERVER_CLIENT_MISMATCH')
    if not isinstance(ios, str) or ios and not cid.fullmatch(ios) or not isinstance(android, list) or len(android) > 8 or any(not isinstance(v, str) or not cid.fullmatch(v) for v in android) or type(apple) is not bool:
        raise RuntimeError('SIGNIN_PUBLIC_CONFIG_INVALID')
    return NativeSignIn(accounts, google_ios_client_id=ios,
                        google_android_client_ids=android, apple_enabled=apple).install()
