"""WAKHAN chat extras: message reactions, one pinned message per chat and a typing indicator.

It sits beside native_chat.py and never edits it. Every rule (who may see a chat, blocks,
deleted or hidden messages) is taken from the installed chat service (ns['WM_CHAT2']).
Routes: POST /api/app/chatx/react · /api/app/chatx/pin · /api/app/chatx/typing
History and inbox results gain message['reactions'], result['pinned'] and result['typing'].
"""
import re
import time

from wakhan_community_v70 import CommunityError

VERSION = 1
EMOJI = re.compile(r'[^\w\s<>"\'&;:/\\]{1,8}')
ERRORS = {
    'forbidden': 'اجازهٔ انجام این کار را ندارید.',
    'not_found': 'این پیام دیگر در دسترس نیست.',
    'bad_input': 'اطلاعات واردشده درست نیست.',
    'slow': 'درخواست‌ها بسیار پی‌هم‌اند. کمی بعد دوباره تلاش کنید.',
    'blocked': 'به دلیل مسدودسازی، این گفتگو در دسترس نیست.',
    'privacy': 'تنظیمات حریم خصوصی این کاربر اجازهٔ این کار را نمی‌دهد.',
    'request_pending': 'تا پذیرفته‌شدن درخواست، پیام دیگری فرستاده نمی‌شود.',
}
TYPING_SECONDS = 6


def number(value, zero=False):
    if isinstance(value, bool):
        raise CommunityError('bad_input')
    try:
        v = int(value)
    except (ValueError, TypeError, OverflowError):
        raise CommunityError('bad_input')
    if not (0 if zero else 1) <= v < 2**53:
        raise CommunityError('bad_input')
    return v


class ChatPlus:
    def __init__(self, ns):
        self.n = ns
        self.chat = ns['WM_CHAT2']
        self.db = self.chat.db
        self.typing = {}
        with self.db:
            self.db.execute('''CREATE TABLE IF NOT EXISTS wkchatx_reactions(
                kind TEXT NOT NULL, cid TEXT NOT NULL, mid INTEGER NOT NULL, uid INTEGER NOT NULL,
                emoji TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY(kind,cid,mid,uid))''')
            self.db.execute('CREATE INDEX IF NOT EXISTS wkchatx_reactions_mid ON wkchatx_reactions(kind,cid,mid)')
            self.db.execute('''CREATE TABLE IF NOT EXISTS wkchatx_pins(
                kind TEXT NOT NULL, cid TEXT NOT NULL, mid INTEGER NOT NULL, by_uid INTEGER NOT NULL,
                ts INTEGER NOT NULL, PRIMARY KEY(kind,cid))''')
        self.wrap()

    # ---- read side: decorate the chat service results without changing its rules
    def reactions(self, c, mid):
        rows = self.db.execute('SELECT emoji,count(*),max(uid=?) FROM wkchatx_reactions WHERE kind=? AND cid=? AND mid=? GROUP BY emoji ORDER BY min(ts)',
                               (c['uid'], c['kind'], c['cid'], mid)).fetchall()
        return [dict(emoji=e, count=n, mine=bool(m)) for e, n, m in rows]

    def pinned(self, c):
        r = self.db.execute('SELECT mid FROM wkchatx_pins WHERE kind=? AND cid=?', (c['kind'], c['cid'])).fetchone()
        if not r:
            return None
        row = self.chat.row(c, r[0])
        if not row:
            return None
        try:
            name = self.chat.person(row[1], c['uid'])['name']
        except CommunityError:
            name = ''
        return dict(id=row[0], sender=row[1], name=name, text=row[2][:240])

    def typing_names(self, c):
        now = time.monotonic()
        bucket = self.typing.get((c['kind'], c['cid']), {})
        names = []
        for uid, at in list(bucket.items()):
            if now - at > TYPING_SECONDS:
                bucket.pop(uid, None)
                continue
            if uid == c['uid'] or self.chat.blocked(uid, c['uid']):
                continue
            try:
                names.append(self.chat.person(uid, c['uid'])['name'])
            except CommunityError:
                pass
        return names

    def wrap(self):
        chat, plus = self.chat, self
        message, history = chat.message, chat.history

        def message_plus(c, row):
            out = message(c, row)
            try:
                found = plus.reactions(c, out['id'])
                if found:
                    out['reactions'] = found
            except Exception:
                pass
            return out

        def history_plus(uid, kind, target, *args, **kw):
            result = history(uid, kind, target, *args, **kw)
            try:
                c = chat.context(uid, kind, target)
                result['pinned'] = plus.pinned(c)
                result['typing'] = plus.typing_names(c)
            except CommunityError:
                pass
            return result

        chat.message = message_plus
        chat.history = history_plus

    # ---- write side
    def target(self, uid, b):
        kind = b.get('kind', 'dm')
        if kind not in ('dm', 'group'):
            raise CommunityError('bad_input')
        return self.chat.context(uid, kind, number(b.get('target')))

    def react(self, uid, b):
        c = self.target(uid, b)
        mid = number(b.get('id'))
        emoji = b.get('emoji')
        if emoji is not None and (not isinstance(emoji, str) or not EMOJI.fullmatch(emoji)):
            raise CommunityError('bad_input')
        self.chat.com.limited(uid, 'chatx_react', 20, 6)
        with self.db:
            row = self.chat.row(c, mid)
            if not row or row[7] == 'system':
                raise CommunityError('not_found', 404)
            old = self.db.execute('SELECT emoji FROM wkchatx_reactions WHERE kind=? AND cid=? AND mid=? AND uid=?',
                                  (c['kind'], c['cid'], mid, uid)).fetchone()
            if emoji is None or (old and old[0] == emoji):
                self.db.execute('DELETE FROM wkchatx_reactions WHERE kind=? AND cid=? AND mid=? AND uid=?', (c['kind'], c['cid'], mid, uid))
            else:
                self.db.execute('''INSERT INTO wkchatx_reactions VALUES(?,?,?,?,?,?)
                    ON CONFLICT(kind,cid,mid,uid) DO UPDATE SET emoji=excluded.emoji,ts=excluded.ts''',
                                (c['kind'], c['cid'], mid, uid, emoji, int(time.time())))
            self.chat.event(c, 'react', mid)
        return dict(ok=True, id=mid, reactions=self.reactions(c, mid))

    def pin(self, uid, b):
        c = self.target(uid, b)
        mid = number(b.get('id', 0), True)
        if c['kind'] == 'group' and c.get('role') not in ('owner', 'admin'):
            raise CommunityError('forbidden', 403)
        self.chat.com.limited(uid, 'chatx_pin', 8, 6)
        with self.db:
            old = self.db.execute('SELECT mid FROM wkchatx_pins WHERE kind=? AND cid=?', (c['kind'], c['cid'])).fetchone()
            if mid:
                row = self.chat.row(c, mid)
                if not row or row[7] == 'system':
                    raise CommunityError('not_found', 404)
                self.db.execute('''INSERT INTO wkchatx_pins VALUES(?,?,?,?,?)
                    ON CONFLICT(kind,cid) DO UPDATE SET mid=excluded.mid,by_uid=excluded.by_uid,ts=excluded.ts''',
                                (c['kind'], c['cid'], mid, uid, int(time.time())))
                self.chat.event(c, 'pin', mid)
            else:
                self.db.execute('DELETE FROM wkchatx_pins WHERE kind=? AND cid=?', (c['kind'], c['cid']))
            if old and old[0] != mid:
                self.chat.event(c, 'pin', old[0])
        return dict(ok=True, pinned=self.pinned(c))

    def set_typing(self, uid, b):
        c = self.target(uid, b)
        bucket = self.typing.setdefault((c['kind'], c['cid']), {})
        if b.get('on') is False:
            bucket.pop(uid, None)
        else:
            bucket[uid] = time.monotonic()
        if len(self.typing) > 5000:
            now = time.monotonic()
            for key in [k for k, v in self.typing.items() if not any(now - t < TYPING_SECONDS for t in v.values())]:
                self.typing.pop(key, None)
        return dict(ok=True)

    async def api(self, req):
        uid = int(req['u']['id'])
        b = await self.chat.com.body(req)
        if not isinstance(b, dict):
            raise CommunityError('bad_input')
        part = req.match_info['part']
        if part == 'react':
            return self.react(uid, b)
        if part == 'pin':
            return self.pin(uid, b)
        if part == 'typing':
            return self.set_typing(uid, b)
        if part == 'version':
            return dict(ok=True, version=VERSION, features=['reactions', 'pin', 'typing'])
        raise CommunityError('not_found', 404)

    def routes(self, app):
        async def safe(req):
            try:
                return self.n['J'](await self.api(req))
            except CommunityError as e:
                return self.n['J'](dict(ok=False, err=e.code, message=ERRORS.get(e.code, ERRORS['bad_input'])), e.status)
            except (ValueError, TypeError, KeyError, OverflowError):
                return self.n['J'](dict(ok=False, err='bad_input', message=ERRORS['bad_input']), 400)
        app.router.add_route('POST', '/api/app/chatx/{part}', self.n['auth'](safe))


def install(app, ns):
    plus = ChatPlus(ns)
    ns['WM_CHAT_PLUS'] = plus
    plus.routes(app)
    return plus
