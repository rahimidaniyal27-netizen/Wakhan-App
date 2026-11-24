"""Salon clock. The server is the only time source: for each salon it keeps which asset plays, the server time when its second 0
was (t0, ms) or where it is paused, and a version number. Every phone computes its own position from that, so someone who joins
late lands on the same second, and every change reaches everyone through the salon's WebSocket.
"""
import asyncio
import json
import time


def now_ms():
    return int(time.time() * 1000)


class Room:
    __slots__ = ('code', 'v', 'asset', 'src', 'ref', 'kind', 'title', 'artist', 'thumb', 'duration', 'by', 'ready',
                 't0', 'paused_at', 'playing', 'socks', 'updated')

    def __init__(self, code):
        self.code = code
        self.v = 0
        self.asset = None
        self.src = self.ref = self.kind = self.title = self.artist = self.thumb = ''
        self.duration = 0.0
        self.by = 0
        self.ready = False
        self.t0 = None
        self.paused_at = 0.0
        self.playing = False
        self.socks = {}            # ws -> uid
        self.updated = time.time()

    def pos(self, at=None):
        if not self.asset:
            return 0.0
        if not self.playing or self.t0 is None:
            return float(self.paused_at)
        p = ((at or now_ms()) - self.t0) / 1000.0
        return max(0.0, min(p, self.duration or p))

    def ended(self):
        return bool(self.asset and self.playing and self.t0 is not None and self.duration and self.pos() >= self.duration)

    def view(self):
        return {'v': self.v, 'asset': self.asset, 'src': self.src, 'ref': self.ref, 'kind': self.kind, 'title': self.title,
                'artist': self.artist, 'thumb': self.thumb, 'duration': self.duration, 'by': self.by, 'ready': self.ready,
                'playing': self.playing, 't0': self.t0, 'paused_at': round(self.paused_at, 3), 'now': now_ms(),
                'listeners': len(set(self.socks.values()))}


class Sync:
    LEAD_MS = 1200       # a start is announced this far ahead so every phone begins on the same moment

    def __init__(self, can_control, url_for, on_load=None, on_change=None):
        self.rooms = {}
        self.can_control = can_control      # (code, uid) -> bool
        self.url_for = url_for              # (asset, uid) -> signed HLS master URL
        self.on_load = on_load              # (code, uid) -> None   (closes the salon's YouTube screen)
        self.on_change = on_change          # (room) -> None        (keeps engine.active right)

    def room(self, code):
        r = self.rooms.get(code)
        if not r:
            r = self.rooms[code] = Room(code)
        return r

    # -------------------------------------------------------------------------------- changes
    def _bump(self, r):
        r.v += 1
        r.updated = time.time()
        if self.on_change:
            self.on_change(r)
        asyncio.ensure_future(self.broadcast(r))

    def load(self, code, uid, aid, item, ready):
        r = self.room(code)
        r.asset, r.src, r.ref, r.kind = aid, item.src, item.ref, item.kind
        r.title, r.artist, r.thumb, r.duration = item.title, item.artist, item.thumb, float(item.duration or 0)
        r.by, r.ready, r.playing, r.paused_at = int(uid), bool(ready), True, 0.0
        r.t0 = now_ms() + self.LEAD_MS if ready else None
        if self.on_load:
            try:
                self.on_load(code, uid)
            except Exception:
                pass
        self._bump(r)
        return r

    def mark_ready(self, aid, duration=None):
        for r in self.rooms.values():
            if r.asset == aid and not r.ready:
                r.ready = True
                if duration:
                    r.duration = float(duration)
                if r.playing and r.t0 is None:
                    r.t0 = now_ms() + self.LEAD_MS - int(r.paused_at * 1000)
                self._bump(r)

    def fail(self, aid, err):
        for r in self.rooms.values():
            if r.asset == aid:
                self._clear(r)
                asyncio.ensure_future(self.send_all(r, {'type': 'error', 'err': err}))
                self._bump(r)

    def _clear(self, r):
        r.asset, r.ready, r.playing, r.t0, r.paused_at = None, False, False, None, 0.0
        r.src = r.ref = r.kind = r.title = r.artist = r.thumb = ''
        r.duration, r.by = 0.0, 0

    def control(self, code, uid, action, pos=None):
        """play | pause | seek | stop - owner, admins and people with music permission only"""
        if not self.can_control(code, uid):
            raise PermissionError('host')
        r = self.room(code)
        if action == 'stop':
            self._clear(r)
        elif not r.asset:
            raise LookupError('nothing')
        elif action == 'pause':
            if r.playing:
                r.paused_at, r.playing, r.t0 = r.pos(), False, None
        elif action == 'play':
            if not r.playing:
                r.playing = True
                r.t0 = (now_ms() + self.LEAD_MS - int(r.paused_at * 1000)) if r.ready else None
        elif action == 'seek':
            p = max(0.0, float(pos or 0))
            if r.duration:
                p = min(p, max(r.duration - 0.5, 0))
            r.paused_at = p
            if r.playing and r.ready:
                r.t0 = now_ms() + 400 - int(p * 1000)
        else:
            raise ValueError('bad_action')
        self._bump(r)
        return r

    # -------------------------------------------------------------------------------- sockets
    async def send(self, ws, msg):
        try:
            await ws.send_str(json.dumps(msg, separators=(',', ':')))
            return True
        except Exception:
            return False

    async def send_all(self, r, msg):
        for ws in list(r.socks):
            if not await self.send(ws, msg):
                r.socks.pop(ws, None)

    def state_for(self, r, uid):
        st = r.view()
        st['url'] = self.url_for(r.asset, uid) if r.asset else ''
        st['control'] = bool(self.can_control(r.code, uid))
        return {'type': 'state', 'state': st}

    async def broadcast(self, r):
        for ws, uid in list(r.socks.items()):
            if not await self.send(ws, self.state_for(r, uid)):
                r.socks.pop(ws, None)

    async def handle(self, ws, code, uid, cap):
        """one phone's socket: hello -> state; then ping/pong for the clock, resume after a reconnect, controls"""
        r = self.room(code)
        if len(r.socks) >= cap:
            await self.send(ws, {'type': 'error', 'err': 'full'})
            return
        r.socks[ws] = uid
        try:
            await self.send(ws, {'type': 'hello', 'now': now_ms()})
            await self.send(ws, self.state_for(r, uid))
            asyncio.ensure_future(self.send_all(r, {'type': 'listeners', 'n': len(set(r.socks.values()))}))
            async for m in ws:
                if getattr(m, 'type', None) is not None and getattr(m.type, 'name', '') != 'TEXT':
                    if m.type.name in ('CLOSE', 'CLOSING', 'CLOSED', 'ERROR'):
                        break
                    continue
                try:
                    msg = json.loads(m.data)
                except (ValueError, TypeError):
                    continue
                t = msg.get('type')
                if t == 'ping':
                    await self.send(ws, {'type': 'pong', 'c': msg.get('c'), 's': now_ms()})
                elif t == 'resume':
                    if int(msg.get('v') or -1) != r.v:
                        await self.send(ws, self.state_for(r, uid))
                elif t == 'ctl':
                    try:
                        self.control(code, uid, str(msg.get('a') or ''), msg.get('pos'))
                    except PermissionError:
                        await self.send(ws, {'type': 'error', 'err': 'host'})
                    except (LookupError, ValueError) as e:
                        await self.send(ws, {'type': 'error', 'err': str(e) or 'bad'})
                elif t == 'ended' and r.ended():
                    pass                                   # the queue of the salon decides what comes next
        finally:
            r.socks.pop(ws, None)
            asyncio.ensure_future(self.send_all(r, {'type': 'listeners', 'n': len(set(r.socks.values()))}))

    def sweep(self):
        """forget empty salons that have been quiet for an hour"""
        old = time.time() - 3600
        for code in [c for c, r in self.rooms.items() if not r.socks and r.updated < old]:
            self.rooms.pop(code, None)
