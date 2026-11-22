"""WAKHAN chat extras, beside native_chat.py (which stays untouched).

v1: reactions, one pinned message per chat, typing indicator.
v2: video and file messages (chunked upload), channels and public lounges (up to 500 members),
    stories (24 h), disappearing messages, screenshot notices, one-to-one voice/video call signalling.
Every visibility rule (who may see a chat, blocks, deleted or hidden messages) comes from the
installed chat service (ns['WM_CHAT2']). Routes live under /api/app/chatx/.
"""
import base64
import os
import re
import secrets
import time

from wakhan_community_v70 import CommunityError, clean

VERSION = 2
FEATURES = ['reactions', 'pin', 'typing', 'video', 'file', 'spaces', 'stories', 'ttl', 'screenshot', 'calls']
EMOJI = re.compile(r'[^\w\s<>"\'&;:/\\]{1,8}')
UPLOAD_ID = re.compile(r'^[A-Za-z0-9_-]{20,40}$')
MEDIA_ID = re.compile(r'^[A-Za-z0-9_-]{16,40}$')
ERRORS = {
    'forbidden': 'اجازهٔ انجام این کار را ندارید.',
    'not_found': 'این مورد دیگر در دسترس نیست.',
    'bad_input': 'اطلاعات واردشده درست نیست.',
    'bad_text': 'اطلاعات واردشده درست نیست.',
    'empty_text': 'نام را بنویسید.',
    'slow': 'درخواست‌ها بسیار پی‌هم‌اند. کمی بعد دوباره تلاش کنید.',
    'blocked': 'به دلیل مسدودسازی، این گفتگو در دسترس نیست.',
    'privacy': 'تنظیمات حریم خصوصی این کاربر اجازهٔ این کار را نمی‌دهد.',
    'request_pending': 'تا پذیرفته‌شدن درخواست، پیام دیگری فرستاده نمی‌شود.',
    'too_big': 'اندازهٔ فایل بیشتر از حد مجاز است.',
    'full': 'ظرفیت این گروپ پر است.',
    'busy': 'این کاربر در تماس دیگری است.',
    'channel': 'در کانال فقط مدیران پیام می‌فرستند.',
    'body_size': 'اندازهٔ فایل بیشتر از حد مجاز است.',
}
TYPING_SECONDS = 6
LIMITS = {'video': 50_000_000, 'file': 25_000_000}
CHUNK = 1_500_000
MAX_MEMBERS = 500
TTL_CHOICES = (0, 3600, 86400, 604800)
STORY_SECONDS = 86400
RING_SECONDS = 45
VIDEO_MIME = {'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/x-m4v': 'm4v'}
SAFE_FILE_MIME = {
    'application/pdf': 'pdf', 'application/zip': 'zip', 'text/plain': 'txt', 'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/wav': 'wav', 'audio/ogg': 'ogg',
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/heic': 'heic',
    'video/mp4': 'mp4', 'video/quicktime': 'mov', 'application/epub+zip': 'epub',
}


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


def clock(seconds):
    seconds = max(0, int(seconds))
    return '%02d:%02d' % (seconds // 60, seconds % 60)


class ChatPlus:
    def __init__(self, ns):
        self.n = ns
        self.chat = ns['WM_CHAT2']
        self.db = self.chat.db
        self.typing = {}
        self.uploads = {}
        self.calls = {}
        self.user_call = {}
        self.last_expire = 0
        self.media_dir = os.path.join(ns.get('BASE') or os.getcwd(), 'data', 'dm_media')
        os.makedirs(self.media_dir, exist_ok=True)
        with self.db:
            for sql in (
                '''CREATE TABLE IF NOT EXISTS wkchatx_reactions(kind TEXT NOT NULL, cid TEXT NOT NULL, mid INTEGER NOT NULL,
                   uid INTEGER NOT NULL, emoji TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY(kind,cid,mid,uid))''',
                'CREATE INDEX IF NOT EXISTS wkchatx_reactions_mid ON wkchatx_reactions(kind,cid,mid)',
                '''CREATE TABLE IF NOT EXISTS wkchatx_pins(kind TEXT NOT NULL, cid TEXT NOT NULL, mid INTEGER NOT NULL,
                   by_uid INTEGER NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY(kind,cid))''',
                'CREATE TABLE IF NOT EXISTS wkchatx_files(id TEXT PRIMARY KEY, name TEXT NOT NULL, size INTEGER NOT NULL)',
                '''CREATE TABLE IF NOT EXISTS wkchatx_spaces(gid INTEGER PRIMARY KEY, type TEXT NOT NULL DEFAULT 'group',
                   public INTEGER NOT NULL DEFAULT 0, about TEXT NOT NULL DEFAULT '', ts INTEGER NOT NULL)''',
                '''CREATE TABLE IF NOT EXISTS wkchatx_stories(id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER NOT NULL,
                   media TEXT NOT NULL, kind TEXT NOT NULL, caption TEXT NOT NULL DEFAULT '', ts INTEGER NOT NULL, expires INTEGER NOT NULL)''',
                'CREATE INDEX IF NOT EXISTS wkchatx_stories_live ON wkchatx_stories(expires)',
                '''CREATE TABLE IF NOT EXISTS wkchatx_story_views(story INTEGER NOT NULL, uid INTEGER NOT NULL, ts INTEGER NOT NULL,
                   PRIMARY KEY(story,uid))''',
                '''CREATE TABLE IF NOT EXISTS wkchatx_ttl(kind TEXT NOT NULL, cid TEXT NOT NULL, seconds INTEGER NOT NULL,
                   by_uid INTEGER NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY(kind,cid))''',
                '''CREATE TABLE IF NOT EXISTS wkchatx_expiry(kind TEXT NOT NULL, cid TEXT NOT NULL, mid INTEGER NOT NULL,
                   expires INTEGER NOT NULL, PRIMARY KEY(kind,cid,mid))''',
                'CREATE INDEX IF NOT EXISTS wkchatx_expiry_due ON wkchatx_expiry(expires)',
            ):
                self.db.execute(sql)
        self.wrap()

    # ------------------------------------------------------------------ helpers
    def now(self):
        return int(time.time())

    def one(self, sql, *args):
        return self.db.execute(sql, args).fetchone()

    def name_of(self, uid, viewer):
        try:
            return self.chat.person(uid, viewer)['name']
        except CommunityError:
            return ''

    def space(self, gid):
        r = self.one('SELECT type,public,about FROM wkchatx_spaces WHERE gid=?', gid)
        return dict(type=r[0], public=bool(r[1]), about=r[2]) if r else dict(type='group', public=False, about='')

    def system_message(self, c, uid, text):
        """A grey notice line inside a conversation, written through the chat tables the service already reads."""
        key = secrets.token_hex(16)
        if c['kind'] == 'dm':
            mid = self.db.execute('INSERT INTO wm70_dm(sender,recipient,text,client_key,ts) VALUES(?,?,?,?,?)',
                                  (uid, c['id'], text, key, self.now())).lastrowid
            self.db.execute("INSERT INTO wkchat_dm_meta(mid,kind) VALUES(?, 'system') ON CONFLICT(mid) DO UPDATE SET kind='system'", (mid,))
        else:
            mid = self.db.execute("INSERT INTO wkchat_messages(gid,sender,text,client_key,ts,kind) VALUES(?,?,?,?,?,'system')",
                                  (c['id'], uid, text, key, self.now())).lastrowid
        self.chat.event(c, 'send', mid)
        return mid

    # ------------------------------------------------------------------ read side
    def reactions(self, c, mid):
        rows = self.db.execute('SELECT emoji,count(*),max(uid=?) FROM wkchatx_reactions WHERE kind=? AND cid=? AND mid=? GROUP BY emoji ORDER BY min(ts)',
                               (c['uid'], c['kind'], c['cid'], mid)).fetchall()
        return [dict(emoji=e, count=n, mine=bool(m)) for e, n, m in rows]

    def pinned(self, c):
        r = self.one('SELECT mid FROM wkchatx_pins WHERE kind=? AND cid=?', c['kind'], c['cid'])
        if not r:
            return None
        row = self.chat.row(c, r[0])
        if not row:
            return None
        return dict(id=row[0], sender=row[1], name=self.name_of(row[1], c['uid']), text=row[2][:240])

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
            name = self.name_of(uid, c['uid'])
            if name:
                names.append(name)
        return names

    def ttl(self, c):
        r = self.one('SELECT seconds FROM wkchatx_ttl WHERE kind=? AND cid=?', c['kind'], c['cid'])
        return r[0] if r else 0

    def expire(self, force=False):
        now = self.now()
        if not force and now - self.last_expire < 20:
            return
        self.last_expire = now
        due = self.db.execute('SELECT kind,cid,mid FROM wkchatx_expiry WHERE expires<=? LIMIT 500', (now,)).fetchall()
        if not due:
            return
        with self.db:
            for kind, cid, mid in due:
                if kind == 'dm':
                    self.db.execute('INSERT INTO wkchat_dm_meta(mid,deleted) VALUES(?,?) ON CONFLICT(mid) DO UPDATE SET deleted=excluded.deleted', (mid, now))
                else:
                    self.db.execute('UPDATE wkchat_messages SET deleted=? WHERE id=? AND deleted=0', (now, mid))
                self.db.execute('INSERT INTO wkchat_events(kind,cid,target,action,mid,ts) VALUES(?,?,NULL,?,?,?)', (kind, cid, 'delete_all', mid, now))
                self.db.execute('DELETE FROM wkchatx_expiry WHERE kind=? AND cid=? AND mid=?', (kind, cid, mid))

    def wrap(self):
        chat, plus = self.chat, self
        message, history, send, group_info, inbox = chat.message, chat.history, chat.send, chat.group_info, chat.inbox

        def message_plus(c, row):
            out = message(c, row)
            try:
                found = plus.reactions(c, out['id'])
                if found:
                    out['reactions'] = found
                for item in out.get('media') or []:
                    if item.get('kind') in ('video', 'file'):
                        f = plus.one('SELECT name,size FROM wkchatx_files WHERE id=?', item['id'])
                        if f:
                            item['name'], item['size'] = f
                exp = plus.one('SELECT expires FROM wkchatx_expiry WHERE kind=? AND cid=? AND mid=?', c['kind'], c['cid'], out['id'])
                if exp:
                    out['expires'] = exp[0]
            except Exception:
                pass
            return out

        def history_plus(uid, kind, target, *args, **kw):
            plus.expire()
            result = history(uid, kind, target, *args, **kw)
            try:
                c = chat.context(uid, kind, target)
                result['pinned'] = plus.pinned(c)
                result['typing'] = plus.typing_names(c)
                result['ttl'] = plus.ttl(c)
                if kind == 'group':
                    result['space'] = plus.space(c['id'])
            except CommunityError:
                pass
            return result

        def send_plus(uid, kind, target, body):
            if kind == 'group':
                c = chat.context(uid, kind, target)
                if plus.space(c['id'])['type'] == 'channel' and c.get('role') not in ('owner', 'admin'):
                    raise CommunityError('channel', 403)
            result = send(uid, kind, target, body)
            try:
                if result.get('ok') and not result.get('duplicate'):
                    c = chat.context(uid, kind, target)
                    seconds = plus.ttl(c)
                    if seconds:
                        with plus.db:
                            plus.db.execute('INSERT OR IGNORE INTO wkchatx_expiry VALUES(?,?,?,?)', (c['kind'], c['cid'], result['id'], plus.now() + seconds))
                    bucket = plus.typing.get((c['kind'], c['cid']))
                    if bucket:
                        bucket.pop(uid, None)
            except Exception:
                pass
            return result

        def group_info_plus(uid, gid, members=True):
            out = group_info(uid, gid, members)
            try:
                total = plus.one('SELECT count(*) FROM wkchat_members WHERE gid=? AND active=1', gid)[0]
                out['count'] = total
                out.update(plus.space(gid))
            except Exception:
                pass
            return out

        def inbox_plus(uid):
            plus.expire()
            return inbox(uid)

        chat.message = message_plus
        chat.history = history_plus
        chat.send = send_plus
        chat.group_info = group_info_plus
        chat.inbox = inbox_plus

    # ------------------------------------------------------------------ v1 write side
    def target(self, uid, b, write=False):
        kind = b.get('kind', 'dm')
        if kind not in ('dm', 'group'):
            raise CommunityError('bad_input')
        return self.chat.context(uid, kind, number(b.get('target')), write=write)

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
            old = self.one('SELECT emoji FROM wkchatx_reactions WHERE kind=? AND cid=? AND mid=? AND uid=?', c['kind'], c['cid'], mid, uid)
            if emoji is None or (old and old[0] == emoji):
                self.db.execute('DELETE FROM wkchatx_reactions WHERE kind=? AND cid=? AND mid=? AND uid=?', (c['kind'], c['cid'], mid, uid))
            else:
                self.db.execute('''INSERT INTO wkchatx_reactions VALUES(?,?,?,?,?,?)
                    ON CONFLICT(kind,cid,mid,uid) DO UPDATE SET emoji=excluded.emoji,ts=excluded.ts''',
                                (c['kind'], c['cid'], mid, uid, emoji, self.now()))
            self.chat.event(c, 'react', mid)
        return dict(ok=True, id=mid, reactions=self.reactions(c, mid))

    def pin(self, uid, b):
        c = self.target(uid, b)
        mid = number(b.get('id', 0), True)
        if c['kind'] == 'group' and c.get('role') not in ('owner', 'admin'):
            raise CommunityError('forbidden', 403)
        self.chat.com.limited(uid, 'chatx_pin', 8, 6)
        with self.db:
            old = self.one('SELECT mid FROM wkchatx_pins WHERE kind=? AND cid=?', c['kind'], c['cid'])
            if mid:
                row = self.chat.row(c, mid)
                if not row or row[7] == 'system':
                    raise CommunityError('not_found', 404)
                self.db.execute('''INSERT INTO wkchatx_pins VALUES(?,?,?,?,?)
                    ON CONFLICT(kind,cid) DO UPDATE SET mid=excluded.mid,by_uid=excluded.by_uid,ts=excluded.ts''',
                                (c['kind'], c['cid'], mid, uid, self.now()))
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

    # ------------------------------------------------------------------ v2: video and file upload in parts
    def upload_start(self, uid, b):
        kind = b.get('kind')
        if kind not in LIMITS:
            raise CommunityError('bad_input')
        size = number(b.get('size'))
        if size > LIMITS[kind]:
            raise CommunityError('too_big', 413)
        name = clean(str(b.get('name') or ('video.mp4' if kind == 'video' else 'file')), 120)
        name = re.sub(r'[\\/\x00]', '_', name)[:120] or 'file'
        mime = str(b.get('mime') or '').lower().split(';')[0].strip()
        if kind == 'video':
            if mime not in VIDEO_MIME:
                raise CommunityError('bad_input')
            ext = VIDEO_MIME[mime]
        else:
            ext = SAFE_FILE_MIME.get(mime)
            if not ext:
                mime, ext = 'application/octet-stream', 'bin'
        dur = number(b.get('dur', 0), True)
        if dur > 3600:
            raise CommunityError('bad_input')
        self.chat.com.limited(uid, 'chatx_upload', 6, 60)
        now = time.time()
        for key, up in list(self.uploads.items()):
            if now - up['t'] > 3600:
                self.drop_upload(key)
        if sum(1 for up in self.uploads.values() if up['uid'] == uid) >= 3:
            raise CommunityError('slow', 429)
        key = secrets.token_urlsafe(18)
        path = os.path.join(self.media_dir, '.part_' + key)
        open(path, 'xb').close()
        self.uploads[key] = dict(uid=uid, kind=kind, name=name, size=size, mime=mime, ext=ext, dur=dur, got=0, part=0, path=path, t=now)
        return dict(ok=True, id=key, chunk=CHUNK)

    def drop_upload(self, key):
        up = self.uploads.pop(key, None)
        if up:
            try:
                os.remove(up['path'])
            except OSError:
                pass

    def upload_part(self, uid, b):
        key = str(b.get('id') or '')
        up = self.uploads.get(key)
        if not UPLOAD_ID.fullmatch(key) or not up or up['uid'] != uid:
            raise CommunityError('not_found', 404)
        part = number(b.get('i'), True)
        data = b.get('data')
        if not isinstance(data, str):
            raise CommunityError('bad_input')
        if part == up['part'] - 1:
            return dict(ok=True, got=up['got'], duplicate=True)
        if part != up['part']:
            raise CommunityError('bad_input')
        try:
            raw = base64.b64decode(data, validate=True)
        except Exception:
            raise CommunityError('bad_input')
        if not raw or len(raw) > CHUNK or up['got'] + len(raw) > up['size']:
            self.drop_upload(key)
            raise CommunityError('too_big', 413)
        with open(up['path'], 'ab') as f:
            f.write(raw)
        up['got'] += len(raw)
        up['part'] += 1
        up['t'] = time.time()
        return dict(ok=True, got=up['got'])

    def upload_done(self, uid, b):
        key = str(b.get('id') or '')
        up = self.uploads.get(key)
        if not UPLOAD_ID.fullmatch(key) or not up or up['uid'] != uid:
            raise CommunityError('not_found', 404)
        if up['got'] != up['size']:
            self.drop_upload(key)
            raise CommunityError('bad_input')
        if up['kind'] == 'video':
            with open(up['path'], 'rb') as f:
                head = f.read(16)
            if not (head[4:8] == b'ftyp' or head[:4] == b'\x1a\x45\xdf\xa3'):
                self.drop_upload(key)
                raise CommunityError('bad_input')
        mid = secrets.token_urlsafe(18)
        final = mid + '.' + up['ext']
        os.replace(up['path'], os.path.join(self.media_dir, final))
        self.uploads.pop(key, None)
        with self.db:
            self.db.execute('INSERT INTO wkm_media(id,owner,kind,mime,file,dur,ts) VALUES(?,?,?,?,?,?,?)',
                            (mid, uid, up['kind'], up['mime'], final, up['dur'], self.now()))
            self.db.execute('INSERT INTO wkchatx_files VALUES(?,?,?)', (mid, up['name'], up['size']))
        return dict(ok=True, id=mid, kind=up['kind'], name=up['name'], size=up['size'], dur=up['dur'])

    # ------------------------------------------------------------------ v2: channels, lounges, big groups
    def create_space(self, uid, b):
        kind = b.get('type')
        if kind not in ('group', 'channel', 'lounge'):
            raise CommunityError('bad_input')
        name = clean(b.get('name'), 80)
        about = clean(str(b.get('about') or ''), 300, empty=True)
        public = bool(b.get('public', kind != 'group'))
        ids = b.get('members') or []
        if not isinstance(ids, list) or len(ids) > 100:
            raise CommunityError('bad_input')
        ids = set(number(p) for p in ids) - {uid}
        avatar = str(b.get('avatar') or '')
        self.chat.com.limited(uid, 'chat2_group', 3, 60)
        if any(not self.chat.invite_allowed(p, uid) for p in ids):
            raise CommunityError('privacy', 403)
        if avatar:
            self.chat.own_image(uid, avatar)
        now = self.now()
        with self.db:
            gid = self.db.execute('INSERT INTO wkchat_groups(name,owner,avatar,created) VALUES(?,?,?,?)', (name, uid, avatar, now)).lastrowid
            self.db.executemany('INSERT INTO wkchat_members VALUES(?,?,?,?,?)', [(gid, p, 'owner' if p == uid else 'member', 1, now) for p in ids | {uid}])
            self.db.execute('INSERT INTO wkchatx_spaces VALUES(?,?,?,?,?)', (gid, kind, int(public), about, now))
            c = dict(kind='group', id=gid, cid=str(gid), uid=uid)
            self.system_message(c, uid, {'group': 'گروپ ساخته شد.', 'channel': 'کانال ساخته شد.', 'lounge': 'لانژ ساخته شد.'}[kind])
        return dict(ok=True, id=gid)

    def edit_space(self, uid, b):
        c = self.target(uid, dict(kind='group', target=b.get('target')))
        if c.get('role') not in ('owner', 'admin'):
            raise CommunityError('forbidden', 403)
        sp = self.space(c['id'])
        about = clean(str(b.get('about', sp['about']) or ''), 300, empty=True)
        public = bool(b.get('public', sp['public']))
        with self.db:
            self.db.execute('''INSERT INTO wkchatx_spaces VALUES(?,?,?,?,?) ON CONFLICT(gid) DO UPDATE SET public=excluded.public,about=excluded.about''',
                            (c['id'], sp['type'], int(public), about, self.now()))
            self.chat.event(c, 'group')
        return dict(ok=True, space=self.space(c['id']))

    def discover(self, uid, b):
        q = str(b.get('q') or '').strip()[:40]
        kind = b.get('type')
        sql = '''SELECT g.id,g.name,g.avatar,s.type,s.about,(SELECT count(*) FROM wkchat_members m WHERE m.gid=g.id AND m.active=1) n,
                 EXISTS(SELECT 1 FROM wkchat_members m WHERE m.gid=g.id AND m.uid=? AND m.active=1) joined
                 FROM wkchatx_spaces s JOIN wkchat_groups g ON g.id=s.gid WHERE s.public=1'''
        args = [uid]
        if kind in ('channel', 'lounge', 'group'):
            sql += ' AND s.type=?'
            args.append(kind)
        if q:
            sql += ' AND (g.name LIKE ? OR s.about LIKE ?)'
            args += ['%' + q + '%', '%' + q + '%']
        rows = self.db.execute(sql + ' ORDER BY n DESC, g.id DESC LIMIT 60', args).fetchall()
        return dict(ok=True, items=[dict(id=r[0], name=r[1], avatar='/api/app/chat/image/' + r[2] if r[2] else None, type=r[3], about=r[4], count=r[5], joined=bool(r[6])) for r in rows])

    def join(self, uid, b):
        gid = number(b.get('target'))
        sp = self.one('SELECT public FROM wkchatx_spaces WHERE gid=?', gid)
        if not sp or not sp[0]:
            raise CommunityError('forbidden', 403)
        count = self.one('SELECT count(*) FROM wkchat_members WHERE gid=? AND active=1', gid)[0]
        if count >= MAX_MEMBERS:
            raise CommunityError('full', 403)
        self.chat.com.limited(uid, 'chatx_join', 6, 60)
        with self.db:
            self.db.execute("INSERT INTO wkchat_members VALUES(?,?,'member',1,?) ON CONFLICT(gid,uid) DO UPDATE SET active=1,joined=excluded.joined", (gid, uid, self.now()))
            self.chat.event(dict(kind='group', cid=str(gid)), 'group')
        return dict(ok=True, id=gid)

    def add_members(self, uid, b):
        c = self.target(uid, dict(kind='group', target=b.get('target')))
        if c.get('role') not in ('owner', 'admin'):
            raise CommunityError('forbidden', 403)
        people = b.get('members')
        if not isinstance(people, list) or not 1 <= len(people) <= 50:
            raise CommunityError('bad_input')
        people = set(number(p) for p in people)
        count = self.one('SELECT count(*) FROM wkchat_members WHERE gid=? AND active=1', c['id'])[0]
        if count + len(people) > MAX_MEMBERS:
            raise CommunityError('full', 403)
        if any(not self.chat.invite_allowed(p, uid) for p in people):
            raise CommunityError('privacy', 403)
        with self.db:
            for p in people:
                self.db.execute("INSERT INTO wkchat_members VALUES(?,?,'member',1,?) ON CONFLICT(gid,uid) DO UPDATE SET active=1,joined=excluded.joined", (c['id'], p, self.now()))
            self.chat.event(c, 'group')
        return dict(ok=True)

    # ------------------------------------------------------------------ v2: stories
    def story_allowed(self, viewer, author):
        if viewer == author:
            return True
        if self.chat.blocked(viewer, author):
            return False
        try:
            return bool(self.chat.social.is_friend(viewer, author))
        except Exception:
            return False

    def story_post(self, uid, b):
        media = str(b.get('media') or '')
        if not MEDIA_ID.fullmatch(media):
            raise CommunityError('bad_input')
        r = self.one('SELECT kind FROM wkm_media WHERE id=? AND owner=?', media, uid)
        if not r or r[0] not in ('image', 'video'):
            raise CommunityError('forbidden', 403)
        caption = clean(str(b.get('caption') or ''), 200, empty=True)
        self.chat.com.limited(uid, 'chatx_story', 10, 300)
        now = self.now()
        with self.db:
            sid = self.db.execute('INSERT INTO wkchatx_stories(uid,media,kind,caption,ts,expires) VALUES(?,?,?,?,?,?)',
                                  (uid, media, r[0], caption, now, now + STORY_SECONDS)).lastrowid
        return dict(ok=True, id=sid)

    def stories(self, uid, b):
        now = self.now()
        rows = self.db.execute('SELECT id,uid,kind,caption,ts FROM wkchatx_stories WHERE expires>? ORDER BY ts LIMIT 800', (now,)).fetchall()
        seen = {r[0] for r in self.db.execute('SELECT story FROM wkchatx_story_views WHERE uid=? AND ts>?', (uid, now - STORY_SECONDS - 60))}
        groups, allowed = {}, {}
        for sid, author, kind, caption, ts in rows:
            if author not in allowed:
                allowed[author] = self.story_allowed(uid, author)
            if not allowed[author]:
                continue
            groups.setdefault(author, []).append(dict(id=sid, kind=kind, caption=caption, ts=ts, seen=sid in seen or author == uid))
        out = []
        for author, items in groups.items():
            try:
                person = self.chat.person(author, uid)
            except CommunityError:
                continue
            out.append(dict(person=person, mine=author == uid, items=items, unseen=any(not i['seen'] for i in items), last=items[-1]['ts']))
        out.sort(key=lambda g: (not g['mine'], not g['unseen'], -g['last']))
        return dict(ok=True, groups=out)

    def story_view(self, uid, b):
        sid = number(b.get('id'))
        r = self.one('SELECT uid FROM wkchatx_stories WHERE id=? AND expires>?', sid, self.now())
        if not r or not self.story_allowed(uid, r[0]):
            raise CommunityError('not_found', 404)
        if r[0] != uid:
            with self.db:
                self.db.execute('INSERT OR IGNORE INTO wkchatx_story_views VALUES(?,?,?)', (sid, uid, self.now()))
        return dict(ok=True)

    def story_viewers(self, uid, b):
        sid = number(b.get('id'))
        r = self.one('SELECT uid FROM wkchatx_stories WHERE id=?', sid)
        if not r or r[0] != uid:
            raise CommunityError('forbidden', 403)
        people = []
        for viewer, ts in self.db.execute('SELECT uid,ts FROM wkchatx_story_views WHERE story=? ORDER BY ts DESC LIMIT 200', (sid,)).fetchall():
            try:
                people.append(dict(self.chat.person(viewer, uid), ts=ts))
            except CommunityError:
                pass
        return dict(ok=True, viewers=people)

    def story_delete(self, uid, b):
        sid = number(b.get('id'))
        with self.db:
            self.db.execute('DELETE FROM wkchatx_stories WHERE id=? AND uid=?', (sid, uid))
            self.db.execute('DELETE FROM wkchatx_story_views WHERE story=?', (sid,))
        return dict(ok=True)

    async def story_media(self, req):
        from aiohttp import web
        uid = int(req['u']['id'])
        try:
            sid = number(req.match_info.get('id'))
        except CommunityError:
            raise web.HTTPNotFound()
        r = self.one('SELECT s.uid,m.mime,m.file FROM wkchatx_stories s JOIN wkm_media m ON m.id=s.media WHERE s.id=? AND s.expires>?', sid, self.now())
        if not r or not self.story_allowed(uid, r[0]):
            raise web.HTTPNotFound()
        path = os.path.join(self.media_dir, r[2])
        if not os.path.isfile(path):
            raise web.HTTPNotFound()
        return web.FileResponse(path, headers={'Content-Type': r[1], 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'})

    # ------------------------------------------------------------------ v2: disappearing messages and screenshot notices
    def set_ttl(self, uid, b):
        c = self.target(uid, b, write=True)
        seconds = number(b.get('seconds', 0), True)
        if seconds not in TTL_CHOICES:
            raise CommunityError('bad_input')
        if c['kind'] == 'group' and c.get('role') not in ('owner', 'admin'):
            raise CommunityError('forbidden', 403)
        self.chat.com.limited(uid, 'chatx_ttl', 6, 60)
        label = {0: 'خاموش', 3600: '1 ساعت', 86400: '24 ساعت', 604800: '7 روز'}[seconds]
        name = self.name_of(uid, uid)
        with self.db:
            if seconds:
                self.db.execute('INSERT INTO wkchatx_ttl VALUES(?,?,?,?,?) ON CONFLICT(kind,cid) DO UPDATE SET seconds=excluded.seconds,by_uid=excluded.by_uid,ts=excluded.ts',
                                (c['kind'], c['cid'], seconds, uid, self.now()))
            else:
                self.db.execute('DELETE FROM wkchatx_ttl WHERE kind=? AND cid=?', (c['kind'], c['cid']))
            self.system_message(c, uid, '⏱ %s پیام محوشونده را %s کرد.' % (name, 'خاموش' if not seconds else 'روی ' + label))
        return dict(ok=True, ttl=seconds)

    def screenshot(self, uid, b):
        c = self.target(uid, b)
        self.chat.com.limited(uid, 'chatx_shot', 2, 20)
        with self.db:
            self.system_message(c, uid, '📸 %s از گفتگو اسکرین‌شات گرفت.' % self.name_of(uid, uid))
        return dict(ok=True)

    # ------------------------------------------------------------------ v2: one-to-one call signalling
    def call_log(self, call, text):
        try:
            c = self.chat.context(call['a'], 'dm', call['b'])
            with self.db:
                self.system_message(c, call['a'], text)
        except CommunityError:
            pass

    def end_call(self, call, reason, by=0):
        if call['state'] == 'ended':
            return
        was = call['state']
        call['state'], call['reason'], call['ended'] = 'ended', reason, time.time()
        for u in (call['a'], call['b']):
            if self.user_call.get(u) == call['id']:
                self.user_call.pop(u, None)
        kind = 'تماس تصویری' if call['video'] else 'تماس صوتی'
        if was == 'active':
            self.call_log(call, '📞 %s · %s' % (kind, clock(time.time() - call['t_ans'])))
        else:
            self.call_log(call, '📞 %s %s' % (kind, 'رد شد' if reason == 'declined' else 'بی‌پاسخ'))

    def tidy_calls(self):
        now = time.time()
        for cid, call in list(self.calls.items()):
            if call['state'] == 'ringing' and now - call['t0'] > RING_SECONDS:
                self.end_call(call, 'missed')
            if call['state'] == 'ended' and now - call['ended'] > 60:
                self.calls.pop(cid, None)

    def call_view(self, call, uid):
        side = 'a' if uid == call['a'] else 'b'
        other = 'b' if side == 'a' else 'a'
        return dict(id=call['id'], state=call['state'], reason=call.get('reason'), video=call['video'], role='caller' if side == 'a' else 'callee',
                    peer=call[other], answer=call.get('answer') if side == 'a' else None, offer=call.get('offer') if side == 'b' else None)

    def call_start(self, uid, b):
        self.tidy_calls()
        c = self.chat.context(uid, 'dm', number(b.get('target')), write=True)
        peer = c['id']
        sdp = b.get('sdp')
        if not isinstance(sdp, str) or len(sdp) > 20000:
            raise CommunityError('bad_input')
        self.chat.com.limited(uid, 'chatx_call', 6, 60)
        if self.user_call.get(uid) in self.calls or self.user_call.get(peer) in self.calls:
            raise CommunityError('busy', 409)
        cid = secrets.token_urlsafe(12)
        call = dict(id=cid, a=uid, b=peer, video=bool(b.get('video')), state='ringing', offer=sdp, answer=None,
                    ice=dict(a=[], b=[]), t0=time.time(), t_ans=0)
        self.calls[cid] = call
        self.user_call[uid] = self.user_call[peer] = cid
        return dict(ok=True, call=self.call_view(call, uid))

    def call_get(self, uid, b):
        call = self.calls.get(str(b.get('id') or ''))
        if not call or uid not in (call['a'], call['b']):
            raise CommunityError('not_found', 404)
        return call

    def call_poll(self, uid, b):
        self.tidy_calls()
        out = dict(ok=True, incoming=None, call=None)
        cid = self.user_call.get(uid)
        call = self.calls.get(cid) if cid else None
        if call and call['b'] == uid and call['state'] == 'ringing':
            view = self.call_view(call, uid)
            try:
                view['person'] = self.chat.person(call['a'], uid)
            except CommunityError:
                view['person'] = dict(id=call['a'], name='')
            out['incoming'] = view
        if b.get('id'):
            call = self.calls.get(str(b['id']))
            if call and uid in (call['a'], call['b']):
                side = 'b' if uid == call['a'] else 'a'
                since = number(b.get('since', 0), True)
                view = self.call_view(call, uid)
                view['ice'] = call['ice'][side][since:]
                view['ice_next'] = len(call['ice'][side])
                out['call'] = view
            else:
                out['call'] = dict(id=b['id'], state='ended', reason='gone')
        return out

    def call_answer(self, uid, b):
        call = self.call_get(uid, b)
        sdp = b.get('sdp')
        if call['b'] != uid or call['state'] != 'ringing' or not isinstance(sdp, str) or len(sdp) > 20000:
            raise CommunityError('bad_input')
        call['answer'], call['state'], call['t_ans'] = sdp, 'active', time.time()
        return dict(ok=True, call=self.call_view(call, uid))

    def call_ice(self, uid, b):
        call = self.call_get(uid, b)
        items = b.get('candidates')
        if not isinstance(items, list) or len(items) > 30:
            raise CommunityError('bad_input')
        side = 'a' if uid == call['a'] else 'b'
        for item in items:
            if isinstance(item, dict) and len(str(item)) < 2000 and len(call['ice'][side]) < 120:
                call['ice'][side].append(item)
        return dict(ok=True)

    def call_end(self, uid, b):
        call = self.call_get(uid, b)
        reason = 'declined' if call['state'] == 'ringing' and uid == call['b'] else 'cancelled' if call['state'] == 'ringing' else 'hangup'
        self.end_call(call, reason, uid)
        return dict(ok=True)

    # ------------------------------------------------------------------ routing
    async def api(self, req):
        uid = int(req['u']['id'])
        part = req.match_info['part']
        b = await self.chat.com.body(req, large=part == 'media_part')
        if not isinstance(b, dict):
            raise CommunityError('bad_input')
        handler = {
            'react': self.react, 'pin': self.pin, 'typing': self.set_typing,
            'upload_start': self.upload_start, 'media_part': self.upload_part, 'upload_done': self.upload_done,
            'create_space': self.create_space, 'edit_space': self.edit_space, 'discover': self.discover, 'join': self.join, 'add_members': self.add_members,
            'story_post': self.story_post, 'stories': self.stories, 'story_view': self.story_view, 'story_viewers': self.story_viewers, 'story_delete': self.story_delete,
            'ttl': self.set_ttl, 'screenshot': self.screenshot,
            'call_start': self.call_start, 'call_poll': self.call_poll, 'call_answer': self.call_answer, 'call_ice': self.call_ice, 'call_end': self.call_end,
        }.get(part)
        if handler:
            return handler(uid, b)
        if part == 'version':
            return dict(ok=True, version=VERSION, features=FEATURES)
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
        app.router.add_get('/api/app/chatx/story/{id}', self.n['auth'](self.story_media))


def install(app, ns):
    plus = ChatPlus(ns)
    ns['WM_CHAT_PLUS'] = plus
    plus.routes(app)
    return plus
