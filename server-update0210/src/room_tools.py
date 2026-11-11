"""Room discovery, shared requests/votes and a lightweight, non-financial group game."""
import json
import asyncio
import base64
import hashlib
import io
import os
from pathlib import Path
import re
import secrets
import time
import unicodedata
from urllib.parse import urlsplit,urlunsplit
from aiohttp import web


class RoomToolError(Exception):
    def __init__(self,code,status=400):self.code,self.status=code,status


def text(value,limit,empty=False):
    if not isinstance(value,str) or len(value)>limit:raise RoomToolError('bad_text')
    value=unicodedata.normalize('NFC',value).strip()
    value=''.join(c for c in value if not unicodedata.category(c).startswith('C') or c in '\u200c\u200d')
    if not value and not empty:raise RoomToolError('empty_text')
    return value


def normalized(value):
    value=unicodedata.normalize('NFKC',str(value)).translate(str.maketrans('كيى','کیی'))
    return ' '.join(''.join(c for c in value if not '\u064b'<=c<='\u065f' and c!='\u0640').casefold().split())


class RoomTools:
    LANGUAGES=('fa','ps','en','ar','de','ur','other')

    def __init__(self,community):
        self.community,self.n,self.db=community,community.n,community.db
        self.db.executescript('''
CREATE TABLE IF NOT EXISTS wka_room_meta(code TEXT PRIMARY KEY,language TEXT NOT NULL DEFAULT 'other',topic TEXT NOT NULL DEFAULT '',event_title TEXT NOT NULL DEFAULT '',starts INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS wka_room_layout(code TEXT PRIMARY KEY,seats INTEGER NOT NULL DEFAULT 10 CHECK(seats BETWEEN 2 AND 16),background TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS wka_room_favorites(uid INTEGER NOT NULL,code TEXT NOT NULL,ts INTEGER NOT NULL,PRIMARY KEY(uid,code));
CREATE TABLE IF NOT EXISTS wka_room_requests(id INTEGER PRIMARY KEY AUTOINCREMENT,code TEXT NOT NULL,uid INTEGER NOT NULL,provider TEXT NOT NULL,track_id TEXT NOT NULL,title TEXT NOT NULL,url TEXT NOT NULL,client_key TEXT NOT NULL,ts INTEGER NOT NULL,state TEXT NOT NULL DEFAULT 'waiting',UNIQUE(uid,client_key));
CREATE INDEX IF NOT EXISTS wka_room_request_history ON wka_room_requests(code,state,id);
CREATE TABLE IF NOT EXISTS wka_room_votes(request_id INTEGER NOT NULL REFERENCES wka_room_requests(id) ON DELETE CASCADE,uid INTEGER NOT NULL,PRIMARY KEY(request_id,uid));
CREATE TABLE IF NOT EXISTS wka_room_rounds(id INTEGER PRIMARY KEY AUTOINCREMENT,code TEXT NOT NULL,answer INTEGER NOT NULL,starts INTEGER NOT NULL,ends INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS wka_room_round_history ON wka_room_rounds(code,id);
CREATE TABLE IF NOT EXISTS wka_room_guesses(round_id INTEGER NOT NULL REFERENCES wka_room_rounds(id) ON DELETE CASCADE,uid INTEGER NOT NULL,value INTEGER NOT NULL,ts INTEGER NOT NULL,PRIMARY KEY(round_id,uid));
''')
        self.db.commit()
        self.install_layout()

    def layout(self,code):
        row=self.db.execute('SELECT seats,background FROM wka_room_layout WHERE code=?',(code,)).fetchone()
        return {'seat_count':row[0] if row else 10,'background_revision':row[1][:-4] if row and row[1] else ''}

    def install_layout(self):
        original=self.n['cin'];view=self.n['cview']
        def cinema(cid):
            state=original(cid)
            if str(cid).startswith('r:'):
                count=self.layout(str(cid)[2:])['seat_count']
                if len(state['seats'])<count:state['seats'].extend([None]*(count-len(state['seats'])))
                elif len(state['seats'])>count and not any(state['seats'][count:]):state['seats']=state['seats'][:count]
            return state
        def public(state,uid):
            result=view(state,uid)
            if str(state.get('cid','')).startswith('r:'):result['room_layout']=self.layout(state['cid'][2:])
            return result
        self.n['cin']=cinema;self.n['cview']=public

    async def room_layout(self,req):
        uid=int(req['u']['id']);code=req.match_info['code'];hall=self.hall(code,uid)
        if req.method=='POST':
            if not hall['is_owner']:raise RoomToolError('host',403)
            body=await self.body(req);count=self.integer(body.get('seat_count'),2,16)
            state=self.n['CIN'].get('r:'+code)
            occupied=[person for person in state['seats'] if person] if state else []
            if len(occupied)>count:raise RoomToolError('seats_occupied',409)
            with self.db:self.db.execute('INSERT INTO wka_room_layout(code,seats) VALUES(?,?) ON CONFLICT(code) DO UPDATE SET seats=excluded.seats',(code,count))
            if state:
                kept=state['seats'][:count]+[None]*max(0,count-len(state['seats']))
                for person in state['seats'][count:]:
                    if person:kept[next(i for i,value in enumerate(kept) if value is None)]=person
                state['seats']=kept;self.n['cbump'](state)
        return self.n['J']({'ok':True,'layout':self.layout(code)})

    async def background(self,req):
        uid=int(req['u']['id']);code=req.match_info['code'];hall=self.hall(code,uid)
        folder=Path(self.n['DATA'])/'room-backgrounds'
        if req.method=='GET':
            row=self.db.execute('SELECT background FROM wka_room_layout WHERE code=?',(code,)).fetchone()
            if not row or not re.fullmatch(r'[a-f0-9]{64}\.jpg',row[0]):raise RoomToolError('not_found',404)
            return web.FileResponse(folder/row[0],headers={'Content-Type':'image/jpeg','Cache-Control':'private, max-age=60','X-Content-Type-Options':'nosniff'})
        if not hall['is_owner']:raise RoomToolError('host',403)
        try:body=await req.clone(client_max_size=3000000).json()
        except Exception:raise RoomToolError('bad_image',400)
        if not isinstance(body,dict):raise RoomToolError('bad_image')
        if body.get('remove') is True:
            with self.db:self.db.execute("INSERT INTO wka_room_layout(code,background) VALUES(?,'') ON CONFLICT(code) DO UPDATE SET background=''",(code,))
        else:
            data=body.get('data')
            if not isinstance(data,str) or len(data)>2800000:raise RoomToolError('bad_image')
            match=re.fullmatch(r'data:image/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)',data)
            if not match:raise RoomToolError('bad_image')
            self.community.limited(uid,'room_background',3,10)
            def encode():
                from PIL import Image,ImageOps
                with Image.open(io.BytesIO(base64.b64decode(match[1],validate=True))) as original:
                    if original.width*original.height>12000000:raise ValueError('image_size')
                    original.load();image=ImageOps.exif_transpose(original).convert('RGB');image.thumbnail((1440,1920))
                    stream=io.BytesIO();image.save(stream,format='JPEG',quality=85,optimize=True);return stream.getvalue()
            try:value=await asyncio.to_thread(encode)
            except Exception:raise RoomToolError('bad_image')
            name=hashlib.sha256(value).hexdigest()+'.jpg';folder.mkdir(mode=0o700,exist_ok=True)
            destination=folder/name
            if not destination.exists():
                fd=os.open(destination,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
                with os.fdopen(fd,'wb') as file:file.write(value)
            with self.db:self.db.execute('INSERT INTO wka_room_layout(code,background) VALUES(?,?) ON CONFLICT(code) DO UPDATE SET background=excluded.background',(code,name))
        state=self.n['CIN'].get('r:'+code)
        if state:self.n['cbump'](state)
        return self.n['J']({'ok':True,'layout':self.layout(code)})

    async def stop_playback(self,req):
        uid=int(req['u']['id']);code=req.match_info['code'];self.hall(code,uid);self.host(code,uid)
        state=self.n['cin']('r:'+code)
        if not any(person and int(person['id'])==uid for person in state['seats']):raise RoomToolError('seat',403)
        state.update(vid='',media=None,title='',ch='',playing=False,t=0.0,ts=time.time(),by='',queue_v12=[])
        self.n['WM_SYNC'].mark_action(state,'load');self.n['cbump'](state)
        return self.n['J'](self.n['cview'](state,uid))

    def hall(self,code,uid):
        if not re.fullmatch(r'[A-Z0-9]{6,8}',code):raise RoomToolError('bad_room')
        hall=self.n['WM_HALL51'].info(code,uid)
        if not hall:raise RoomToolError('room_missing',404)
        error=self.n['WM_HALL51'].allowed(code,uid,'enter')
        if error:raise RoomToolError(error,403)
        return hall

    def host(self,code,uid):
        if not self.n['room_can'](code,uid):raise RoomToolError('host',403)

    async def body(self,req):
        try:value=await req.clone(client_max_size=16000).json()
        except Exception:raise RoomToolError('bad')
        if not isinstance(value,dict):raise RoomToolError('bad')
        return value

    @staticmethod
    def integer(value,minimum=1,maximum=2**53-1):
        if type(value) is not int or not minimum<=value<=maximum:raise RoomToolError('bad')
        return value

    def meta(self,code):
        row=self.db.execute('SELECT language,topic,event_title,starts FROM wka_room_meta WHERE code=?',(code,)).fetchone()
        return dict(dict(zip(('language','topic','event_title','starts'),row or ('other','','',0))),**self.layout(code))

    async def directory(self,req):
        uid=int(req['u']['id']);query=normalized(req.query.get('q',''))[:60]
        wanted=req.query.get('filter','all');language=req.query.get('language','')
        if wanted not in ('all','favorites','friends','recent','events'):raise RoomToolError('bad')
        favorite={r[0] for r in self.db.execute('SELECT code FROM wka_room_favorites WHERE uid=?',(uid,))}
        recent=dict(self.db.execute('SELECT code,ts FROM wm51_visits WHERE uid=? ORDER BY ts DESC LIMIT 100',(uid,)))
        friends=set()
        for a,b in self.db.execute("SELECT a,b FROM wm70_friends WHERE state='accepted' AND (a=? OR b=?)",(uid,uid)):
            peer=b if a==uid else a
            if not self.community.blocked(uid,peer):friends.add(peer)
        halls=self.n['WM_HALL51'].directory(uid)
        # The original directory omits one's own hall; include it for favorites/return.
        columns={row[1] for row in self.db.execute('PRAGMA table_info(rooms)')}
        owner_column='owner' if 'owner' in columns else 'uid'
        owner_codes=[r[0] for r in self.db.execute('SELECT code FROM rooms WHERE '+owner_column+'=? ORDER BY ts DESC LIMIT 1',(uid,))] if owner_column in columns else []
        for code in owner_codes:
            if not self.n['room_ok'](code) or self.n['wmr_code_revoked'](code):continue
            if not any(item['code']==code for item in halls):
                own=self.n['WM_HALL51'].info(code,uid)
                if own:halls.insert(0,{'code':code,'name':own['name'],'photo':own['photo'],'owner_name':own['owner_name'],'live':own['live'],'now':own['now'],'can_enter':True,'locked':False})
        result=[];now=int(time.time())
        for hall in halls:
            code=hall['code'];metadata=self.meta(code)
            state=self.n['CIN'].get('r:'+code) or {}
            present=sum(1 for person in state.get('seats',[]) if person and int(person['id']) in friends)
            friend_owner=self.n['WM_HALL51'].owner(code) in friends
            item=dict(hall,**metadata,favorite=code in favorite,friends_present=present,friend_owner=friend_owner,last_visit=recent.get(code,0))
            if language and metadata['language']!=language:continue
            if wanted=='favorites' and code not in favorite:continue
            if wanted=='recent' and code not in recent:continue
            if wanted=='friends' and not (present or friend_owner):continue
            if wanted=='events' and not now-3600<metadata['starts']<now+180*86400:continue
            if query and query not in normalized(' '.join(str(item.get(key,'')) for key in ('name','owner_name','code','topic','event_title'))):continue
            result.append(item)
        result.sort(key=lambda item:(-int(item['favorite']),-int(item['friends_present']),-int(item['live']),-int(item['last_visit'])))
        return self.n['J']({'ok':True,'halls':result[:80]})

    async def favorite(self,req):
        uid=int(req['u']['id']);body=await self.body(req);code=body.get('code')
        if not isinstance(code,str):raise RoomToolError('bad_room')
        self.hall(code,uid)
        if type(body.get('favorite')) is not bool:raise RoomToolError('bad')
        with self.db:
            if body['favorite']:self.db.execute('INSERT INTO wka_room_favorites VALUES(?,?,?) ON CONFLICT(uid,code) DO UPDATE SET ts=excluded.ts',(uid,code,int(time.time())))
            else:self.db.execute('DELETE FROM wka_room_favorites WHERE uid=? AND code=?',(uid,code))
        return self.n['J']({'ok':True})

    async def metadata(self,req):
        uid=int(req['u']['id']);code=req.match_info['code'];hall=self.hall(code,uid)
        if not hall['is_owner']:raise RoomToolError('host',403)
        body=await self.body(req);language=body.get('language','other')
        if language not in self.LANGUAGES:raise RoomToolError('bad_language')
        topic=text(body.get('topic',''),40,True);title=text(body.get('event_title',''),80,True)
        starts=self.integer(body.get('starts',0),0,int(time.time())+180*86400)
        with self.db:self.db.execute('INSERT INTO wka_room_meta VALUES(?,?,?,?,?) ON CONFLICT(code) DO UPDATE SET language=excluded.language,topic=excluded.topic,event_title=excluded.event_title,starts=excluded.starts',(code,language,topic,title,starts))
        return self.n['J']({'ok':True,'meta':self.meta(code)})

    def queue(self,code,uid):
        rows=self.db.execute('''SELECT q.id,q.uid,q.provider,q.track_id,q.title,q.url,count(v.uid),max(CASE WHEN v.uid=? THEN 1 ELSE 0 END)
FROM wka_room_requests q LEFT JOIN wka_room_votes v ON v.request_id=q.id
WHERE q.code=? AND q.state='waiting' GROUP BY q.id ORDER BY count(v.uid) DESC,q.id LIMIT 25''',(uid,code)).fetchall()
        return [dict(zip(('id','uid','provider','track_id','title','url','votes','voted'),row)) for row in rows]

    def game(self,code,uid):
        row=self.db.execute('SELECT id,answer,starts,ends FROM wka_room_rounds WHERE code=? ORDER BY id DESC LIMIT 1',(code,)).fetchone()
        if not row:return None
        rid,answer,starts,ends=row;closed=time.time()>=ends
        guesses=self.db.execute('SELECT uid,value,ts FROM wka_room_guesses WHERE round_id=? ORDER BY ts,uid',(rid,)).fetchall()
        result={'id':rid,'starts':starts,'ends':ends,'finished':closed,'count':len(guesses),'mine':next((value for player,value,_ in guesses if player==uid),None)}
        if closed:
            result['answer']=answer
            result['results']=[{'person':self.community.public(player,uid),'value':value,'distance':abs(value-answer)} for player,value,_ in sorted(guesses,key=lambda row:(abs(row[1]-answer),row[2],row[0]))]
        return result

    async def activity(self,req):
        uid=int(req['u']['id']);code=req.match_info['code'];hall=self.hall(code,uid)
        await self.community.room(uid,code)
        if req.method=='POST':
            self.community.limited(uid,'room_tools',12,4)
            body=await self.body(req);action=body.get('action')
            if action=='add':
                provider=body.get('provider');title=text(body.get('title'),180);track=text(body.get('track_id',''),120,True)
                key=self.community.key(body.get('client_key'))
                if provider=='youtube':
                    if not re.fullmatch(r'[A-Za-z0-9_-]{11}',track):raise RoomToolError('bad_source')
                    url='https://www.youtube.com/watch?v='+track
                elif provider=='soundcloud':
                    value=body.get('url')
                    if not isinstance(value,str) or len(value)>1600:raise RoomToolError('bad_source')
                    try:parts=urlsplit(value);port=parts.port
                    except ValueError:raise RoomToolError('bad_source')
                    if parts.scheme!='https' or parts.hostname not in ('soundcloud.com','www.soundcloud.com','m.soundcloud.com') or parts.username or parts.password or port not in (None,443) or not parts.path.strip('/'):
                        raise RoomToolError('bad_source')
                    url=urlunsplit(('https',parts.hostname,parts.path,'',''));track=''
                else:raise RoomToolError('bad_source')
                previous=self.db.execute('SELECT code,provider,track_id,title,url FROM wka_room_requests WHERE uid=? AND client_key=?',(uid,key)).fetchone()
                intent=(code,provider,track,title,url)
                if previous and tuple(previous)!=intent:raise RoomToolError('intent_mismatch',409)
                if not previous:
                    if self.db.execute("SELECT count(*) FROM wka_room_requests WHERE code=? AND state='waiting'",(code,)).fetchone()[0]>=25:raise RoomToolError('queue_full',409)
                    with self.db:self.db.execute('INSERT INTO wka_room_requests(code,uid,provider,track_id,title,url,client_key,ts) VALUES(?,?,?,?,?,?,?,?)',(*intent[:1],uid,*intent[1:],key,int(time.time())))
            elif action in ('vote','remove','played'):
                rid=self.integer(body.get('id'))
                row=self.db.execute("SELECT uid FROM wka_room_requests WHERE id=? AND code=? AND state='waiting'",(rid,code)).fetchone()
                if not row:raise RoomToolError('request_missing',404)
                if action=='vote':
                    if type(body.get('voted')) is not bool:raise RoomToolError('bad')
                    with self.db:
                        if body['voted']:self.db.execute('INSERT OR IGNORE INTO wka_room_votes VALUES(?,?)',(rid,uid))
                        else:self.db.execute('DELETE FROM wka_room_votes WHERE request_id=? AND uid=?',(rid,uid))
                else:
                    if action=='played' or row[0]!=uid:self.host(code,uid)
                    with self.db:self.db.execute('UPDATE wka_room_requests SET state=? WHERE id=?',('played' if action=='played' else 'removed',rid))
            elif action=='start_game':
                self.host(code,uid)
                current=self.game(code,uid)
                if current and not current['finished']:raise RoomToolError('game_running',409)
                now=int(time.time())
                with self.db:self.db.execute('INSERT INTO wka_room_rounds(code,answer,starts,ends) VALUES(?,?,?,?)',(code,1+secrets.randbelow(20),now,now+30))
            elif action=='guess':
                value=self.integer(body.get('value'),1,20);rid=self.integer(body.get('round'))
                game=self.game(code,uid)
                if not game or game['id']!=rid or game['finished']:raise RoomToolError('round_finished',409)
                previous=self.db.execute('SELECT value FROM wka_room_guesses WHERE round_id=? AND uid=?',(rid,uid)).fetchone()
                if previous and previous[0]!=value:raise RoomToolError('already_guessed',409)
                with self.db:self.db.execute('INSERT OR IGNORE INTO wka_room_guesses VALUES(?,?,?,?)',(rid,uid,value,int(time.time()*1000)))
            elif action=='end_game':
                self.host(code,uid);rid=self.integer(body.get('round'))
                game=self.game(code,uid)
                if not game or game['id']!=rid:raise RoomToolError('round_finished',409)
                with self.db:self.db.execute('UPDATE wka_room_rounds SET ends=min(ends,?) WHERE id=?',(int(time.time()),rid))
            else:raise RoomToolError('bad_action')
        return self.n['J']({'ok':True,'meta':self.meta(code),'queue':self.queue(code,uid),'game':self.game(code,uid),'host':bool(self.n['room_can'](code,uid)),'owner':bool(hall['is_owner']),'server_now':int(time.time())})

    def routes(self,app):
        def guarded(handler):
            async def call(req):
                try:return await handler(req)
                except RoomToolError as error:return self.n['J']({'ok':False,'err':error.code},error.status)
                except Exception as error:
                    if hasattr(error,'code') and hasattr(error,'status'):return self.n['J']({'ok':False,'err':error.code},error.status)
                    raise
            return self.n['auth'](call)
        app.router.add_get('/api/app/rooms',guarded(self.directory))
        app.router.add_post('/api/app/rooms/favorite',guarded(self.favorite))
        app.router.add_post('/api/app/rooms/{code}/meta',guarded(self.metadata))
        app.router.add_get('/api/app/rooms/{code}/layout',guarded(self.room_layout))
        app.router.add_post('/api/app/rooms/{code}/layout',guarded(self.room_layout))
        app.router.add_get('/api/app/rooms/{code}/background',guarded(self.background))
        app.router.add_post('/api/app/rooms/{code}/background',guarded(self.background))
        app.router.add_post('/api/app/rooms/{code}/stop',guarded(self.stop_playback))
        app.router.add_get('/api/app/rooms/{code}/activity',guarded(self.activity))
        app.router.add_post('/api/app/rooms/{code}/activity',guarded(self.activity))

    def wipe(self,uid):
        """Remove this account's new social data, retaining unrelated financial rows."""
        columns={row[1] for row in self.db.execute('PRAGMA table_info(rooms)')}
        owner_column='owner' if 'owner' in columns else 'uid'
        owned=[row[0] for row in self.db.execute('SELECT code FROM rooms WHERE '+owner_column+'=?',(uid,))] if owner_column in columns else []
        with self.db:
            if self.db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='wka_app_staff'").fetchone():self.db.execute('DELETE FROM wka_app_staff WHERE uid=?',(uid,))
            if self.db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='wka_presence_preferences'").fetchone():self.db.execute('DELETE FROM wka_presence_preferences WHERE uid=?',(uid,))
            if self.db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='wka_notification_preferences'").fetchone():self.db.execute('DELETE FROM wka_notification_preferences WHERE uid=?',(uid,))
            if self.db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='wka_report_reviews'").fetchone():self.db.execute('DELETE FROM wka_report_reviews WHERE reviewer=? OR report_id IN (SELECT id FROM wka_reports WHERE reporter=?)',(uid,uid))
            self.db.execute('DELETE FROM wm70_dm_replies WHERE message_id IN (SELECT id FROM wm70_dm WHERE sender=? OR recipient=?)',(uid,uid))
            self.db.execute('DELETE FROM wka_room_votes WHERE uid=? OR request_id IN (SELECT id FROM wka_room_requests WHERE uid=?)',(uid,uid))
            self.db.execute('DELETE FROM wka_room_requests WHERE uid=?',(uid,))
            self.db.execute('DELETE FROM wka_room_guesses WHERE uid=?',(uid,))
            self.db.execute('DELETE FROM wka_room_favorites WHERE uid=?',(uid,))
            self.db.execute('DELETE FROM wm51_visits WHERE uid=?',(uid,))
            for code in owned:
                self.db.execute('DELETE FROM wka_room_votes WHERE request_id IN (SELECT id FROM wka_room_requests WHERE code=?)',(code,))
                self.db.execute('DELETE FROM wka_room_requests WHERE code=?',(code,))
                self.db.execute('DELETE FROM wka_room_guesses WHERE round_id IN (SELECT id FROM wka_room_rounds WHERE code=?)',(code,))
                for table in ('wka_room_rounds','wka_room_meta','wka_room_layout','wka_room_favorites','wm51_visits'):
                    self.db.execute('DELETE FROM '+table+' WHERE code=?',(code,))
                if self.db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='wka_disabled_halls'").fetchone():self.db.execute('DELETE FROM wka_disabled_halls WHERE code=?',(code,))
        for cid,state in list(self.n.get('CIN',{}).items()):
            if not isinstance(state,dict):continue
            seats=state.get('seats',[])
            if any(person and int(person['id'])==int(uid) for person in seats):
                state['seats']=[None if person and int(person['id'])==int(uid) else person for person in seats]
                state.get('seen',{}).pop(uid,None);self.n['cbump'](state)
        for cid,state in list(self.n.get('CV',{}).items()):
            if state.get('m',{}).pop(uid,None) is not None:
                state.get('q',{}).pop(uid,None);self.n['cvbump'](state,cid)
        presence=self.n.get('WM_PRESENCE')
        if presence:presence.sessions.pop(uid,None);presence.visible.pop(uid,None)
