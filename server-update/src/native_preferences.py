"""Account-scoped notification preferences and authenticated report review."""
import time
from aiohttp import web

FIELDS=('dm','friends','gifts','previews')


class Preferences:
    def __init__(self,namespace):
        self.n,self.db=namespace,namespace['DB']
        self.db.executescript('''
CREATE TABLE IF NOT EXISTS wka_notification_preferences(uid INTEGER PRIMARY KEY,dm INTEGER NOT NULL DEFAULT 1,friends INTEGER NOT NULL DEFAULT 1,gifts INTEGER NOT NULL DEFAULT 1,previews INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS wka_report_reviews(report_id INTEGER PRIMARY KEY,reviewer INTEGER NOT NULL,ts INTEGER NOT NULL);
''');self.db.commit()
        push=getattr(namespace['WM_APP'],'push',None)
        if push:
            old_send=push.send
            async def send(uid,kind,sender,extra=''):
                values=self.values(uid);field={'dm':'dm','friend_req':'friends','friend_ok':'friends','gift':'gifts'}.get(kind)
                if field and not values[field]:return
                await old_send(uid,kind,sender,extra if values['previews'] else '')
            push.send=send
        self.staff=namespace['WM_OPS'].staff

    def values(self,uid):
        row=self.db.execute('SELECT dm,friends,gifts,previews FROM wka_notification_preferences WHERE uid=?',(uid,)).fetchone()
        return dict(zip(FIELDS,[bool(value) for value in row] if row else [True]*4))

    async def preferences(self,req):
        uid=int(req['u']['id'])
        if req.method=='POST':
            try:body=await req.clone(client_max_size=4096).json()
            except Exception:return self.n['J']({'ok':False,'err':'bad'},400)
            if not isinstance(body,dict) or set(body)-set(FIELDS) or any(type(value) is not bool for value in body.values()):
                return self.n['J']({'ok':False,'err':'bad'},400)
            values=dict(self.values(uid),**body)
            with self.db:self.db.execute('INSERT INTO wka_notification_preferences VALUES(?,?,?,?,?) ON CONFLICT(uid) DO UPDATE SET dm=excluded.dm,friends=excluded.friends,gifts=excluded.gifts,previews=excluded.previews',(uid,*(int(values[field]) for field in FIELDS)))
        push=getattr(self.n['WM_APP'],'push',None)
        return self.n['J']({'ok':True,'notifications':self.values(uid),'phone_push_configured':bool(push and push.key()),'moderator':bool(self.staff(uid))})

    async def reports(self,req):
        uid=int(req['u']['id'])
        if not self.staff(uid):return self.n['J']({'ok':False,'err':'forbidden'},403)
        if req.method=='POST':
            try:body=await req.clone(client_max_size=4096).json()
            except Exception:return self.n['J']({'ok':False,'err':'bad'},400)
            if not isinstance(body,dict) or type(body.get('id')) is not int or body['id']<1 or body.get('action')!='reviewed':return self.n['J']({'ok':False,'err':'bad'},400)
            if not self.db.execute('SELECT 1 FROM wka_reports WHERE id=?',(body['id'],)).fetchone():return self.n['J']({'ok':False,'err':'not_found'},404)
            with self.db:
                self.db.execute('UPDATE wka_reports SET done=1 WHERE id=?',(body['id'],))
                self.db.execute('INSERT OR IGNORE INTO wka_report_reviews VALUES(?,?,?)',(body['id'],uid,int(time.time())))
            return self.n['J']({'ok':True})
        state=req.query.get('state','pending')
        if state not in ('pending','done','all'):return self.n['J']({'ok':False,'err':'bad'},400)
        where='' if state=='all' else ' WHERE done='+('0' if state=='pending' else '1')
        rows=self.db.execute('SELECT id,reporter,target,hall,reason,note,ts,done FROM wka_reports'+where+' ORDER BY id DESC LIMIT 60').fetchall()
        reports=[]
        for rid,reporter,target,hall,reason,note,ts,done in rows:
            reports.append({'id':rid,'reporter':self.n['WM_COMMUNITY70'].public(reporter,uid),'target':self.n['WM_COMMUNITY70'].public(target,uid) if target else None,'hall':hall,'reason':reason,'note':note,'ts':ts,'done':bool(done)})
        return self.n['J']({'ok':True,'reports':reports})

    def routes(self,app):
        auth=self.n['auth']
        app.router.add_get('/api/app/preferences',auth(self.preferences));app.router.add_post('/api/app/preferences',auth(self.preferences))
        app.router.add_get('/api/app/moderation/reports',auth(self.reports));app.router.add_post('/api/app/moderation/reports',auth(self.reports))


def install(app,namespace):
    value=Preferences(namespace);value.routes(app);namespace['WM_PREFERENCES']=value;return value
