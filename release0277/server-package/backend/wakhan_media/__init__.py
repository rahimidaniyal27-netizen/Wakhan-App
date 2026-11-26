"""WAKHAN media engine: source adapters -> rights gate -> FFmpeg HLS (ABR) -> signed delivery + bandwidth budget -> salon sync.

Hooked into native_wakhan2.py right after the salon (one line); nothing existing is rewritten.
"""
from .config import Settings


class SalonAccess:
    """who may watch / control, taken from the salon itself (owner, admins, music permission, the salon's music rule)"""

    def __init__(self, salon):
        self.s = salon

    def can_view(self, code, uid):
        s = self.s
        if not s.room_ok(code):
            return False
        if int(uid) in set(s.present(code)) or s.can_play(code, uid):
            return True
        member = getattr(s, 'member', None)
        return bool(member and member(code, uid))

    def can_control(self, code, uid):
        return bool(self.s.room_ok(code) and self.s.can_play(code, uid))

    def close_screen(self, code, uid):
        self.s.close_screen(code, uid)


def install(app, salon):
    from .api import Media
    n = salon.n
    st = Settings(salon.db)
    st.init()
    m = Media(salon.db, st, n['auth'], SalonAccess(salon), n.get('log'))
    m.init()
    m.routes(app)
    n['WKM_MEDIA'] = m
    _yield_to_youtube(salon, m)
    from .salon_music import SalonMusic
    music = SalonMusic(m, salon)
    music.hooks()
    music.routes(app)
    m.salon_music = music
    return m


def _yield_to_youtube(salon, m):
    """when the salon puts a YouTube video / archive film on its screen, the relayed track stops for everyone"""
    old = getattr(salon, 'load', None)
    if not callable(old) or getattr(old, 'wkm', False):
        return

    def load(code, uid, *a, **k):
        r = m.sync.rooms.get(code)
        if r is not None and r.asset:
            m.sync._clear(r)
            m.sync._bump(r)
        return old(code, uid, *a, **k)
    load.wkm = True
    salon.load = load
