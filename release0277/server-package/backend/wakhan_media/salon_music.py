"""One salon search and one queue, using the existing authenticated salon engine.

Only metadata is aggregated here. Playback still uses the existing provider players;
no new stream extraction, download or proxy is introduced. Install at app startup.
"""
import asyncio
import hashlib
import math
import re
import time
import unicodedata
import uuid
from urllib.parse import urlsplit, urlunsplit

from .adapters import AdapterError


def sc_url(value):
    try:
        p = urlsplit(str(value or ''))
        if (p.scheme != 'https' or p.hostname not in ('soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com')
                or p.username or p.password or p.port or len(p.path.strip('/').split('/')) != 2
                or not all(p.path.strip('/').split('/')) or len(value) > 1600):
            raise ValueError()
        return urlunsplit(('https', 'soundcloud.com', p.path.rstrip('/'), '', ''))
    except (ValueError, TypeError, AttributeError):
        raise AdapterError('bad_link')


def seconds(value):
    try:
        value = float(value or 0)
        return value if math.isfinite(value) and 0 <= value <= 86400 else 0
    except (ValueError, TypeError, OverflowError):
        return 0


def text(value):
    value = unicodedata.normalize('NFKC', str(value or '')).casefold().translate(str.maketrans('يك', 'یک'))
    return ' '.join(re.findall(r'[^\W_]+', value))


class SalonMusic:
    def __init__(self, media, salon):
        self.m, self.s, self.n = media, salon, salon.n
        self.memo, self.inflight = {}, {}
        self._slots = asyncio.Semaphore(4)
        self._legacy_sc = asyncio.Semaphore(2)

    def check(self, code, uid, control=False):
        code = self.s.code_of(code)
        if not self.s.room_ok(code):
            raise AdapterError('not_found', 404)
        if not self.m.can_view(code, uid):
            raise AdapterError('member', 403)
        if control and not self.s.can_play(code, uid):
            raise AdapterError('music_perm', 403)
        return code

    def view(self, code, uid):
        return self.n['cview'](self.n['cin']('r:' + code), uid)

    def hooks(self):
        """Extend entry validation, retain the existing queue, permissions and moderation."""
        for name in ('cin', 'cview', 'cpos', 'cbump'):
            if not callable(self.n.get(name)):
                raise RuntimeError('salon_music_contract_missing:' + name)
        if not callable(getattr(self.n.get('WM_SYNC'), 'mark_action', None)):
            raise RuntimeError('salon_music_contract_missing:WM_SYNC')
        if getattr(self.s, '_unified_music', False):
            raise RuntimeError('salon_music_already_installed')
        self.s._unified_music = True
        entry, load, queue_view, cview = self.s.entry, self.s.load, self.s.queue_view, self.n['cview']

        async def music_entry(uid, item, need_room=True):
            if item.get('src') in ('sc', 'soundcloud'):
                url = sc_url(item.get('ref') or item.get('url'))
                value = {'provider': 'soundcloud', 'vid': 'sc:' + hashlib.sha256(url.encode()).hexdigest()[:20],
                         'media': {'kind': 'soundcloud', 'url': url}, 'title': str(item.get('title') or '')[:150],
                         'ch': str(item.get('ch') or '')[:60], 'wkm_music': True,
                         'wkm_duration': seconds(item.get('dur') or item.get('duration'))}
                return value, str(item.get('thumb') or '')[:500]
            try:
                value, thumb = await entry(uid, item, need_room=need_room)
            except Exception as e:
                if hasattr(e, 'code'):
                    raise AdapterError(e.code, getattr(e, 'status', 400)) from None
                raise
            # Explicitly replace the flag: archive/video entries must not inherit music mode.
            value = dict(value, wkm_music=bool(item.get('music')), wkm_duration=seconds(item.get('dur')))
            return value, thumb

        def music_load(code, uid, value, thumb=''):
            value = dict(value, wkm_generation=uuid.uuid4().hex,
                         wkm_duration=seconds(value.get('wkm_duration')),
                         wkm_music=bool(value.get('wkm_music') or value.get('provider') == 'soundcloud'))
            c = load(code, uid, value, thumb)
            if value.get('wkm_music') or value.get('provider') == 'soundcloud':
                c['wks_music'] = {'uid': int(uid), 'vid': c['vid'], 'src': value.get('provider', 'youtube')}
            else:
                c.pop('wks_music', None)
            return c

        def music_view(c, uid, *a, **kw):
            if c.get('vid') and not c.get('wkm_generation'):
                c['wkm_generation'] = uuid.uuid4().hex
            out = cview(c, uid, *a, **kw)
            out['music_generation'] = c.get('wkm_generation', '')
            out['music_duration'] = seconds(c.get('wkm_duration'))
            return out

        def source(x):
            return 'soundcloud' if x.get('provider') == 'soundcloud' else 'youtube' if x.get('provider') == 'youtube' else 'archive'

        def music_queue(code, uid):
            out = queue_view(code, uid)
            c = self.s.state(code) or {}
            if out.get('now'):
                out['now']['src'] = source(c)
            values = {v.get('wks_id'): v for v in c.get('queue_v12', [])}
            for card in out.get('next', []):
                if card['id'] in values:
                    card['src'] = source(values[card['id']])
            pending = {p['card']['id']: p['item'] for p in c.get('wks_pend', [])}
            for card in out.get('pending', []):
                if pending.get(card['id'], {}).get('src') in ('sc', 'soundcloud'):
                    card['src'] = 'soundcloud'
            return out

        self.s.entry, self.s.load, self.s.queue_view = music_entry, music_load, music_queue
        self.n['cview'] = music_view

    async def _sc(self, q):
        # The installed server already supplies this metadata search. Call it once,
        # without a second HTTP request through /api/search's per-user rate limiter.
        flat = self.n.get('_flat')
        if not callable(flat):
            raise AdapterError('soundcloud_search_off', 503)
        async with self._legacy_sc:
            # Shield keeps the slot occupied until the actual worker finishes, even
            # when the caller's source deadline expires.
            task = asyncio.create_task(asyncio.to_thread(flat, 'scsearch12:' + q, 12))
            try:
                return await asyncio.shield(task)
            except asyncio.CancelledError:
                await task
                raise

    async def _source(self, name, q):
        async with self._slots:
            try:
                if name == 'soundcloud':
                    rows = await self._sc(q)
                    out = []
                    for row in rows:
                        try:
                            url = sc_url(row.get('url'))
                        except AdapterError:
                            continue
                        out.append({'src': 'sc', 'ref': url, 'url': url, 'title': str(row.get('title') or '')[:150],
                                    'ch': str(row.get('artist') or row.get('ch') or row.get('user') or '')[:100],
                                    'thumb': str(row.get('thumb') or row.get('artwork') or row.get('image') or '')[:1000],
                                    'dur': seconds(row.get('dur') or row.get('duration'))})
                    return out, None
                adapter = self.m.yt if name == 'youtube' else self.m.up
                rows = await adapter.search(q, 12, 0)
                return [{'src': row.src, 'ref': row.ref, 'id': row.ref if row.src == 'yt' else '',
                         'title': row.title, 'ch': row.artist, 'thumb': row.thumb,
                         'dur': seconds(row.duration)} for row in rows], None
            except AdapterError as e:
                return [], e.code
            except Exception:
                return [], 'source_unavailable'

    async def _search(self, q):
        names = ('youtube', 'soundcloud', 'wakhan')
        tasks = {name: asyncio.create_task(self._source(name, q)) for name in names}
        # One unavailable provider does not discard the other provider's answers.
        done, pending = await asyncio.wait(tasks.values(), timeout=8)
        groups, status = [], {}
        for name in names:
            task = tasks[name]
            if task in pending:
                task.cancel()
                task.add_done_callback(lambda t: t.exception() if not t.cancelled() else None)
                rows, err = [], 'timeout'
            else:
                rows, err = task.result()
            groups.append(rows)
            status[name] = {'status': 'unavailable' if err else 'ok', 'count': len(rows)}
            if err:
                status[name]['err'] = err
        tokens, seen, ranked = set(text(q).split()), set(), []
        for group_index, rows in enumerate(groups):
            for rank, row in enumerate(rows):
                identity = (row['src'], row['ref'])
                if identity in seen:
                    continue
                seen.add(identity)
                words = set(text(row['title'] + ' ' + row['ch']).split())
                score = len(tokens & words) / max(1, len(tokens)) + 0.25 / (rank + 1)
                ranked.append((-score, rank, group_index, row))
        ranked.sort(key=lambda x: x[:3])
        # Do not collapse different recordings merely because their titles match.
        return {'ok': True, 'items': [r[3] for r in ranked[:36]], 'sources': status}

    async def search(self, req, uid):
        q = str(req.query.get('q') or '').strip()[:100]
        if len(q) < 2:
            return {'ok': True, 'items': [], 'sources': {}}
        self.m.slow(uid, 'salon_music_search', 60, 60)
        key = text(q)
        hit = self.memo.get(key)
        if hit and hit[0] > time.monotonic():
            return hit[1]
        task = self.inflight.get(key)
        if task is None:
            if len(self.inflight) >= 16:
                raise AdapterError('slow_down', 429)
            task = asyncio.create_task(self._search(q))
            self.inflight[key] = task
            def finished(t):
                self.inflight.pop(key, None)
                if not t.cancelled() and t.exception() is None:
                    result = t.result()
                    # Partial failures are short-lived, so recovery is seen promptly.
                    ttl = 15 if any(s['status'] != 'ok' for s in result['sources'].values()) else 120
                    self.memo[key] = (time.monotonic() + ttl, result)
                    while len(self.memo) > 200:
                        self.memo.pop(next(iter(self.memo)))
            task.add_done_callback(finished)
        return await asyncio.shield(task)

    async def queue(self, req, uid):
        b = await self.s.me.body(req) if req.method != 'GET' else None
        code = self.check(b.get('code') if b else req.query.get('code'), uid)
        if b is None:
            return self.s.queue_view(code, uid)
        if b.get('action') != 'add':
            class BodyRequest:
                method = req.method
                async def json(self):
                    return b
            try:
                return await self.s.api_queue(BodyRequest(), uid)
            except Exception as e:
                if hasattr(e, 'code'):
                    raise AdapterError(e.code, getattr(e, 'status', 400)) from None
                raise
        item = b.get('item')
        if not isinstance(item, dict):
            raise AdapterError('bad_input')
        self.m.slow(uid, 'salon_music_queue', 20, 60)
        value, thumb = await self.s.entry(uid, item)
        # Validation can await the provider: recheck permission and capacity AFTER it.
        self.check(code, uid)
        c = self.n['cin']('r:' + code)
        q, pending = c.setdefault('queue_v12', []), c.setdefault('wks_pend', [])
        host = self.s.can_play(code, uid)
        if len(q if host else pending) >= 25 or (not host and sum(p['by']['id'] == uid for p in pending) >= 3):
            raise AdapterError('queue_full', 409)
        who = self.s.person(uid)
        seq = c.setdefault('wks_seq', [0])
        seq[0] += 1
        if host:
            q.append(dict(value, wks_id=seq[0], wks_thumb=thumb, wks_by=who))
        else:
            src = 'soundcloud' if value.get('provider') == 'soundcloud' else item.get('src')
            card = {'id': seq[0], 'title': value.get('title', ''), 'src': src, 'thumb': thumb}
            keep = {key: item.get(key) for key in ('src', 'ref', 'vid', 'id', 'ep', 'version', 'title', 'ch', 'thumb', 'music', 'dur')}
            pending.append({'card': card, 'item': keep, 'by': who})
        self.n['cbump'](c)
        return self.s.queue_view(code, uid)

    async def play(self, req, uid):
        b = await self.s.me.body(req)
        code = self.check(b.get('code'), uid, True)
        self.m.slow(uid, 'salon_music_play', 20, 60)
        item = dict(b.get('item') or {}, music=True)
        value, thumb = await self.s.entry(uid, item)
        # Provider validation may await a network response: permissions must still hold.
        self.check(code, uid, True)
        self.s.load(code, uid, value, thumb)
        return {'ok': True, 'state': self.view(code, uid)}

    async def advance(self, req, uid):
        b = await self.s.me.body(req)
        code = self.check(b.get('code'), uid, True)
        c = self.n['cin']('r:' + code)
        # No await from this check through load: one transition is atomic on aiohttp's loop.
        generation = c.get('wkm_generation')
        if (not generation or b.get('generation') != generation or b.get('vid') != c.get('vid')
                or b.get('revision') != c.get('timeline_revision', 0)):
            return {'ok': True, 'stale': True, 'state': self.view(code, uid)}
        reason = b.get('reason')
        if reason not in ('end', 'next', 'unplayable'):
            raise AdapterError('bad_input')
        if reason == 'end':
            duration = seconds(b.get('duration')) or seconds(c.get('wkm_duration'))
            position = seconds(self.n['cpos'](c))
            if not c.get('playing') or not duration or position < duration - 2:
                return {'ok': True, 'ignored': True, 'state': self.view(code, uid)}
        self.m.slow(uid, 'salon_music_advance', 30, 60)
        queue = c.setdefault('queue_v12', [])
        if queue:
            value = queue.pop(0)
            self.s.load(code, uid, value, value.get('wks_thumb', ''))
            return {'ok': True, 'state': self.view(code, uid)}
        if reason == 'unplayable':
            self.s.close_screen(code, uid)
            return {'ok': True, 'state': self.view(code, uid)}
        if not c.get('vid'):
            return {'ok': True, 'state': self.view(code, uid)}
        # Same media element + same source; only the authoritative timeline changes.
        c.update(t=0.0, playing=True, ts=time.time(), wkm_generation=uuid.uuid4().hex)
        self.n['WM_SYNC'].mark_action(c, 'play')
        self.n['cbump'](c)
        return {'ok': True, 'repeat': True, 'state': self.view(code, uid)}

    def routes(self, app):
        for verb, path, handler in [('GET', 'search', self.search), ('GET', 'queue', self.queue),
                                    ('POST', 'queue', self.queue), ('POST', 'play', self.play),
                                    ('POST', 'advance', self.advance)]:
            app.router.add_route(verb, '/api/media/salon/' + path, self.m.h(handler))
