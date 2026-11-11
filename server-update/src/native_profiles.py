"""Native profile images and roles; no external messaging identity lookups."""
import hashlib
import html
from pathlib import Path
import re
import secrets
from aiohttp import web


class Authority:
    def __init__(self,namespace):
        self.n,self.db=namespace,namespace['DB']
        self.db.execute('create table if not exists wka_app_staff(uid integer primary key,issuer integer not null,ts integer not null)')
        self.db.commit()

    def staff(self,uid):
        return uid==self.n['OWNER'] or bool(self.db.execute('select 1 from wka_app_staff where uid=?',(uid,)).fetchone())


class Profiles:
    def __init__(self,namespace):
        self.n,self.db=namespace,namespace['DB']
        self.photos=Path(namespace['DATA'])/'ava'
        self.photos.mkdir(parents=True,exist_ok=True,mode=0o700)

    def profile(self,user):
        uid=int(user['id']);row=self.db.execute('select name,un from users where uid=?',(uid,)).fetchone()
        name=(row[0] if row else None) or 'Wakhan'
        username=(row[1] if row else None) or ''
        return {'id':uid,'public_id':self.n['WM_PUBLIC_IDS'].get(uid),'name':name,'first_name':name,
            'last_name':'','username':username,'language_code':user.get('language_code','fa'),
            'avatar_url':'/ava/'+str(uid),'fallback_avatar_url':'/ava/'+str(uid),
            'photo_url':None,'provider':'wakhan','verified':True}

    async def api_profile(self,request):
        return self.n['J']({'ok':True,'profile':self.profile(request['u'])})

    @staticmethod
    def view(state):
        provider=state.get('provider') or ('soundcloud' if (state.get('media') or {}).get('kind')=='soundcloud' else 'youtube')
        if not state.get('sync_epoch'):state['sync_epoch']=secrets.token_hex(8)
        return {'provider':provider,'browse_language':state.get('browse_language','dari'),
            'sync_epoch':state['sync_epoch'],'room':str(state.get('cid','')).removeprefix('r:'),
            'timeline_revision':state.get('timeline_revision',0),'last_action':state.get('last_action','')}

    @staticmethod
    def mark_action(state,action):
        state['timeline_revision']=int(state.get('timeline_revision',0))+1
        state['last_action']=action

    async def select_provider(self,request,state,user,body):
        provider=body.get('provider');language=body.get('language',state.get('browse_language','dari'))
        if provider not in ('youtube','soundcloud') or language not in ('dari','pashto','persian'):
            return self.n['J']({'ok':False,'err':'bad'},400)
        if state.get('provider')!=provider or state.get('browse_language')!=language:
            state.update(provider=provider,browse_language=language)
            self.n['cbump'](state)
        return self.n['J'](self.n['cview'](state,user.id))

    @staticmethod
    def mime(data):
        if data.startswith(b'\xff\xd8\xff'):return 'image/jpeg'
        if data.startswith(b'\x89PNG\r\n\x1a\n'):return 'image/png'
        if data[:4]==b'RIFF' and data[8:12]==b'WEBP':return 'image/webp'
        return None

    async def photo(self,uid):
        account=self.n.get('WM_APP')
        data=account.own_photo(uid) if account else None
        if data:return data
        path=self.photos/(str(int(uid))+'.jpg')
        if path.is_symlink() or not path.is_file() or path.stat().st_size>5_000_000:return None
        value=path.read_bytes()
        return value if self.mime(value) else None

    async def avatar(self,request):
        raw=request.match_info.get('u','')
        if not re.fullmatch(r'[0-9]{1,19}',raw) or not 0<int(raw)<2**63:
            raise web.HTTPNotFound()
        uid=int(raw);data=await self.photo(uid)
        headers={'X-Content-Type-Options':'nosniff','Cache-Control':'private,max-age=120'}
        if data:return web.Response(body=data,content_type=self.mime(data),headers=headers)
        row=self.db.execute('select name from users where uid=?',(uid,)).fetchone()
        letter=html.escape(str(row[0] if row and row[0] else 'W')[0])
        color='#'+hashlib.sha256(raw.encode()).hexdigest()[:6]
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="{color}"/><text x="64" y="84" text-anchor="middle" fill="white" font-family="sans-serif" font-size="64">{letter}</text></svg>'
        return web.Response(text=svg,content_type='image/svg+xml',headers=headers)
