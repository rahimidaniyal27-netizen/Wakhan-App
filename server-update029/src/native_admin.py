"""Native hall moderation and staff management, without external group lookups."""
import re
import time


class Administration:
    def __init__(self, namespace):
        self.n,self.db=namespace,namespace['DB']
        self.db.executescript('''
CREATE TABLE IF NOT EXISTS wka_admin_actions(id INTEGER PRIMARY KEY,actor INTEGER NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL,ts INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS wka_disabled_halls(code TEXT PRIMARY KEY,actor INTEGER NOT NULL,ts INTEGER NOT NULL);
''');self.db.commit()
        room_ok=namespace['room_ok']
        namespace['room_ok']=lambda code:room_ok(code) and not self.db.execute('SELECT 1 FROM wka_disabled_halls WHERE code=?',(code,)).fetchone()

    def target(self, value):
        if not isinstance(value,(str,int)) or type(value) is bool:return None
        raw=str(value).strip()
        if re.fullmatch(r'[0-9]{1,16}',raw):
            uid=self.n['WM_PUBLIC_IDS'].resolve(int(raw))
            if not uid and self.db.execute('SELECT 1 FROM users WHERE uid=?',(int(raw),)).fetchone():uid=int(raw)
        elif re.fullmatch(r'@?[A-Za-z][A-Za-z0-9_]{2,31}',raw):
            row=self.db.execute('SELECT uid FROM users WHERE lower(un)=lower(?)',(raw.lstrip('@'),)).fetchone();uid=row[0] if row else None
        else:return None
        return uid if uid and self.db.execute('SELECT 1 FROM wka_accounts WHERE uid=? AND done=1 AND blocked=0',(uid,)).fetchone() else None

    async def handle(self,req):
        actor=int(req['u']['id']);owner=actor==self.n['OWNER']
        if not self.n['WM_OPS'].staff(actor):return self.n['J']({'ok':False,'err':'forbidden'},403)
        if req.method=='POST':
            try:body=await req.clone(client_max_size=4096).json()
            except Exception:return self.n['J']({'ok':False,'err':'bad'},400)
            if not isinstance(body,dict):return self.n['J']({'ok':False,'err':'bad'},400)
            action=body.get('action');now=int(time.time())
            if action=='set_staff':
                if not owner:return self.n['J']({'ok':False,'err':'owner_only'},403)
                target=self.target(body.get('target'));enabled=body.get('enabled')
                if not target or target==self.n['OWNER'] or type(enabled) is not bool:return self.n['J']({'ok':False,'err':'bad_target'},400)
                with self.db:
                    if enabled:
                        self.db.execute('INSERT INTO wka_app_staff VALUES(?,?,?) ON CONFLICT(uid) DO NOTHING',(target,actor,now))
                        self.db.execute('INSERT INTO wm_frame_staff VALUES(?,?,?) ON CONFLICT(uid) DO NOTHING',(target,actor,now))
                    else:
                        self.db.execute('DELETE FROM wka_app_staff WHERE uid=?',(target,))
                        self.db.execute('DELETE FROM wm_frame_staff WHERE uid=?',(target,))
                        self.db.execute('DELETE FROM wm_frame_choices WHERE uid=?',(target,))
                    self.db.execute('INSERT INTO wka_admin_actions(actor,action,target,ts) VALUES(?,?,?,?)',(actor,'staff_add' if enabled else 'staff_remove',str(target),now))
            elif action=='set_room_enabled':
                code=body.get('code');enabled=body.get('enabled')
                if not isinstance(code,str) or not re.fullmatch('[A-Z0-9]{6,8}',code) or type(enabled) is not bool or not self.db.execute('SELECT 1 FROM rooms WHERE code=?',(code,)).fetchone():return self.n['J']({'ok':False,'err':'bad_room'},400)
                with self.db:
                    if enabled:self.db.execute('DELETE FROM wka_disabled_halls WHERE code=?',(code,))
                    else:self.db.execute('INSERT INTO wka_disabled_halls VALUES(?,?,?) ON CONFLICT(code) DO UPDATE SET actor=excluded.actor,ts=excluded.ts',(code,actor,now))
                    self.db.execute('INSERT INTO wka_admin_actions(actor,action,target,ts) VALUES(?,?,?,?)',(actor,'room_enable' if enabled else 'room_disable',code,now))
                if not enabled:
                    state=self.n['CIN'].get('r:'+code)
                    if state:state.update(seats=[None]*len(state['seats']),vid='',media=None,playing=False,queue_v12=[]);self.n['cbump'](state)
                    voice=self.n['CV'].pop('r:'+code,None)
                    if voice and voice.get('ev'):voice['ev'].set()
            elif action=='grant_access':
                if not owner:return self.n['J']({'ok':False,'err':'owner_only'},403)
                target=self.target(body.get('target'));days=body.get('days')
                if not target or target==self.n['OWNER'] or type(days) is not int or not 1<=days<=365:return self.n['J']({'ok':False,'err':'bad'},400)
                row=self.db.execute('SELECT until FROM wka_native_access WHERE uid=?',(target,)).fetchone()
                if row and row[0]==0:return self.n['J']({'ok':False,'err':'permanent_access'},409)
                until=max(now,int(row[0]) if row else now)+days*86400
                with self.db:
                    self.db.execute('INSERT INTO wka_native_access VALUES(?,?) ON CONFLICT(uid) DO UPDATE SET until=excluded.until',(target,until))
                    self.db.execute('INSERT INTO wka_admin_actions(actor,action,target,ts) VALUES(?,?,?,?)',(actor,'access_days_'+str(days),str(target),now))
            else:return self.n['J']({'ok':False,'err':'bad_action'},400)
        people=self.n['WM_COMMUNITY70'];query=req.query.get('q','').strip().casefold()[:60]
        columns={row[1] for row in self.db.execute('PRAGMA table_info(rooms)')};owner_column='owner' if 'owner' in columns else 'uid'
        rows=self.db.execute('SELECT r.code,r.'+owner_column+',u.name FROM rooms r LEFT JOIN users u ON u.uid=r.'+owner_column+' ORDER BY r.ts DESC LIMIT 200').fetchall();halls=[]
        for code,uid,name in rows:
            if self.n['wmr_code_revoked'](code):continue
            metadata=self.n['WM_HALL51'].info(code,actor);room_name=(metadata or {}).get('name') or name or 'Wakhan'
            if query and query not in (code+' '+str(room_name)+' '+str(self.n['WM_PUBLIC_IDS'].get(uid))).casefold():continue
            state=self.n['CIN'].get('r:'+code) or {}
            halls.append({'code':code,'name':room_name,'owner':people.public(uid,actor),'enabled':not bool(self.db.execute('SELECT 1 FROM wka_disabled_halls WHERE code=?',(code,)).fetchone()),'live':sum(bool(p) for p in state.get('seats',[]))})
        staff=[people.public(uid,actor) for (uid,) in self.db.execute('SELECT uid FROM wka_app_staff ORDER BY ts')]
        audit=[{'action':action,'target':target,'ts':stamp} for action,target,stamp in self.db.execute('SELECT action,target,ts FROM wka_admin_actions ORDER BY id DESC LIMIT 50')]
        return self.n['J']({'ok':True,'owner':owner,'halls':halls,'staff':staff,'audit':audit})

    def routes(self,app):
        for method in ('GET','POST'):app.router.add_route(method,'/api/app/admin',self.n['auth'](self.handle))


def install(app,namespace):
    value=Administration(namespace);value.routes(app);namespace['WM_ADMIN']=value;return value
