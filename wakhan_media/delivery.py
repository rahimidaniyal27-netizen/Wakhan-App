"""Signed links and the bandwidth budget.

A link is only good for one person, one asset (or one salon socket) and a few hours, so a copied link stops working outside the app.
The token sits in the URL path, so the relative segment names inside the HLS playlists keep working without any rewrite.
"""
import base64
import hashlib
import hmac
import time
from collections import deque


class Signer:
    def __init__(self, key):
        self.key = bytes.fromhex(key) if len(key) == 64 else key.encode()

    def _sig(self, kind, scope, uid, exp):
        m = hmac.new(self.key, ('%s|%s|%d|%d' % (kind, scope, uid, exp)).encode(), hashlib.sha256).digest()
        return base64.urlsafe_b64encode(m[:16]).decode().rstrip('=')

    def sign(self, kind, scope, uid, ttl):
        exp = int(time.time()) + int(ttl)
        return '%d.%d.%s' % (int(uid), exp, self._sig(kind, scope, int(uid), exp))

    def check(self, kind, scope, token):
        try:
            uid, exp, sig = str(token).split('.', 2)
            uid, exp = int(uid), int(exp)
        except (ValueError, AttributeError):
            return None
        if exp < time.time() or not hmac.compare_digest(sig, self._sig(kind, scope, uid, exp)):
            return None
        return uid


class Meter:
    """bytes sent by /media/hls over the last 10 seconds -> Mbps"""
    WINDOW = 10.0

    def __init__(self):
        self.q = deque()
        self.sum = 0

    def add(self, n):
        t = time.time()
        self.q.append((t, n))
        self.sum += n
        self._trim(t)

    def _trim(self, t):
        while self.q and self.q[0][0] < t - self.WINDOW:
            self.sum -= self.q.popleft()[1]

    def mbps(self):
        self._trim(time.time())
        return self.sum * 8 / self.WINDOW / 1e6


class Budget:
    """which qualities a new player may get, from the current load:
    under 80% of the cap -> all; 80-100% -> only the lowest audio / video rung; the client's own saver choice -> lowest too"""

    def __init__(self, settings, meter):
        self.st, self.meter = settings, meter

    def load(self):
        cap = max(self.st.num('egress_cap_mbps'), 1.0)
        return self.meter.mbps() / cap

    def allowed(self, variants, saver=False):
        names = [v['name'] for v in variants]
        if not names:
            return set()
        if saver or self.load() >= 0.8:
            return {names[0]}
        return set(names)
