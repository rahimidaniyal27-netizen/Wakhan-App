"""Foreground presence with server-enforced visibility; no last-seen disclosure."""
import re
import time


class Presence:
    def __init__(self, namespace):
        self.n, self.db = namespace, namespace['DB']
        self.db.execute('CREATE TABLE IF NOT EXISTS wka_presence_preferences(uid INTEGER PRIMARY KEY,visible INTEGER NOT NULL DEFAULT 1 CHECK(visible IN (0,1)))')
        self.db.commit()
        self.visible = dict(self.db.execute('SELECT uid,visible FROM wka_presence_preferences'))
        self.sessions = {}
        self.sweep = time.monotonic()
        community = namespace['WM_COMMUNITY70']
        public = community.public

        def profile(uid, viewer, *args, **kwargs):
            value = public(uid, viewer, *args, **kwargs)
            value['online'] = not (viewer and community.blocked(viewer, uid)) and self.online(uid)
            return value

        community.public = profile

    def online(self, uid):
        if not self.visible.get(int(uid), True):
            return False
        now = time.monotonic()
        return any(now - updated < 55 for updated in self.sessions.get(int(uid), {}).values())

    async def handle(self, req):
        uid = int(req['u']['id'])
        if req.method == 'POST':
            try:
                body = await req.clone(client_max_size=2048).json()
            except Exception:
                return self.n['J']({'ok': False, 'err': 'bad'}, 400)
            if not isinstance(body, dict) or set(body) - {'visible', 'active', 'device'}:
                return self.n['J']({'ok': False, 'err': 'bad'}, 400)
            if 'visible' in body and type(body['visible']) is not bool:
                return self.n['J']({'ok': False, 'err': 'bad'}, 400)
            if 'active' in body and (type(body['active']) is not bool or not isinstance(body.get('device'), str) or not re.fullmatch(r'[a-f0-9]{32}', body['device'])):
                return self.n['J']({'ok': False, 'err': 'bad'}, 400)
            if 'visible' in body:
                with self.db:
                    self.db.execute('INSERT INTO wka_presence_preferences VALUES(?,?) ON CONFLICT(uid) DO UPDATE SET visible=excluded.visible', (uid, int(body['visible'])))
                self.visible[uid] = body['visible']
            now = time.monotonic()
            if now-self.sweep>60:
                self.sessions={actor:{device:updated for device,updated in devices.items() if now-updated<55} for actor,devices in self.sessions.items()}
                self.sessions={actor:devices for actor,devices in self.sessions.items() if devices}
                self.sweep=now
            if 'active' in body:
                devices=self.sessions.setdefault(uid,{})
                key = body['device']
                if body['active']:
                    if key not in devices and len(devices) >= 8:
                        devices.pop(min(devices, key=devices.get), None)
                    devices[key] = now
                else:
                    devices.pop(key, None)
        result={'ok': True, 'visible': bool(self.visible.get(uid, True))}
        query=req.query.get('users','')
        if query:
            values=query.split(',')
            if len(values)>80 or any(not re.fullmatch(r'[0-9]{1,16}',value) for value in values):return self.n['J']({'ok':False,'err':'bad'},400)
            community=self.n['WM_COMMUNITY70']
            result['online']={value:bool(self.online(int(value)) and not community.blocked(uid,int(value))) for value in values}
        return self.n['J'](result)

    def routes(self, app):
        for method in ('GET', 'POST'):
            app.router.add_route(method, '/api/app/presence', self.n['auth'](self.handle))


def install(app, namespace):
    value = Presence(namespace)
    value.routes(app)
    namespace['WM_PRESENCE'] = value
    return value
