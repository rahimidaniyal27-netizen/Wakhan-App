"""Add compatible chat features to actual source ASTs, without touching money tables."""
import ast

REPLY_SCHEMA='''
CREATE TABLE IF NOT EXISTS wm70_dm_replies(
 message_id INTEGER PRIMARY KEY REFERENCES wm70_dm(id) ON DELETE CASCADE,
 reply_to INTEGER NOT NULL
);
'''

COMMUNITY_METHODS='''
def reply_detail(self, uid, peer, reply_id):
    if reply_id is None:return None
    row=self.db.execute('SELECT sender,recipient,text FROM wm70_dm WHERE id=?',(reply_id,)).fetchone()
    if not row or (row[0],row[1]) not in ((uid,peer),(peer,uid)):
        return {'id':reply_id,'unavailable':True}
    return {'id':reply_id,'sender':row[0],'text':row[2][:240]}

def send_dm(self, uid, body):
    peer=person(body.get('uid'));text=clean(body.get('text'),2000);key=self.key(body.get('client_key'))
    reply_to=body.get('reply_to')
    if reply_to is not None and (type(reply_to) is not int or not 0<reply_to<2**63):
        raise CommunityError('bad_reply')
    if peer==uid or not self.known(peer):raise CommunityError('bad_user')
    old=self.db.execute('SELECT m.id,m.recipient,m.text,r.reply_to FROM wm70_dm m LEFT JOIN wm70_dm_replies r ON r.message_id=m.id WHERE m.sender=? AND m.client_key=?',(uid,key)).fetchone()
    if old:
        if (old[1],old[2],old[3])!=(peer,text,reply_to):raise CommunityError('intent_mismatch',409)
        return {'ok':True,'id':old[0],'duplicate':True,'reply':self.reply_detail(uid,peer,reply_to),'reply_supported':True}
    if self.relation(uid,peer)!='accepted':raise CommunityError('friend_required',403)
    detail=self.reply_detail(uid,peer,reply_to)
    if detail and detail.get('unavailable'):raise CommunityError('reply_unavailable',404)
    self.limited(uid,'dm',10,4)
    with self.db:
        result=self.db.execute('INSERT INTO wm70_dm(sender,recipient,text,client_key,ts) VALUES(?,?,?,?,?)',(uid,peer,text,key,int(time.time())))
        mid=result.lastrowid
        if reply_to is not None:self.db.execute('INSERT INTO wm70_dm_replies(message_id,reply_to) VALUES(?,?)',(mid,reply_to))
    return {'ok':True,'id':mid,'duplicate':False,'reply':detail,'reply_supported':True}

def dm(self, uid, peer, after=0, before=0):
    person(peer)
    if peer==uid:raise CommunityError('bad_user')
    relation=self.relation(uid,peer)
    exists=self.db.execute('SELECT 1 FROM wm70_dm WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?) LIMIT 1',(uid,peer,peer,uid)).fetchone()
    if relation!='accepted' and not exists:raise CommunityError('friend_required',403)
    query='SELECT m.id,m.sender,m.text,m.ts,r.reply_to,t.sender,t.recipient,t.text,m.client_key FROM wm70_dm m LEFT JOIN wm70_dm_replies r ON r.message_id=m.id LEFT JOIN wm70_dm t ON t.id=r.reply_to WHERE ((m.sender=? AND m.recipient=?) OR (m.sender=? AND m.recipient=?))'
    args=[uid,peer,peer,uid]
    if after:query+=' AND m.id>?';args.append(after)
    if before:query+=' AND m.id<?';args.append(before)
    query+=' ORDER BY m.id '+('ASC' if after else 'DESC')+' LIMIT 60'
    rows=self.db.execute(query,args).fetchall()
    if not after:rows.reverse()
    messages=[]
    for mid,sender,text,ts,reply_to,rs,rr,rt,client_key in rows:
        message={'id':mid,'sender':sender,'text':text,'ts':ts,'client_key':client_key}
        if reply_to is not None:
            message['reply']={'id':reply_to,'sender':rs,'text':rt[:240]} if (rs,rr) in ((uid,peer),(peer,uid)) else {'id':reply_to,'unavailable':True}
        messages.append(message)
    row=self.db.execute('SELECT last_id FROM wm70_reads WHERE uid=? AND peer=?',(peer,uid)).fetchone()
    return {'ok':True,'peer':self.public(peer,uid),'messages':messages,'can_send':relation=='accepted','reply_supported':True,'peer_read_id':int(row[0] or 0) if row else 0}
'''

def replace_methods(cls,source):
    methods={n.name:n for n in ast.parse(source).body}
    result=[]
    for node in cls.body:
        if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)) and node.name in methods:
            result.append(methods.pop(node.name))
        else:result.append(node)
    cls.body=result+list(methods.values())

def upgrade_community(tree):
    cls=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Community')
    init=next(n for n in cls.body if isinstance(n,ast.FunctionDef) and n.name=='__init__')
    scripts=[n for n in ast.walk(init) if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='executescript']
    if len(scripts)!=1 or not scripts[0].args or not isinstance(scripts[0].args[0],ast.Constant):raise ValueError('CHAT_SCHEMA_ANCHOR_CHANGED')
    sql=scripts[0].args[0]
    if 'CREATE TABLE IF NOT EXISTS wm70_dm(' not in sql.value:raise ValueError('CHAT_SCHEMA_CHANGED')
    if 'wm70_dm_replies' not in sql.value:sql.value+=REPLY_SCHEMA
    replace_methods(cls,COMMUNITY_METHODS)
    inbox=next(n for n in cls.body if isinstance(n,ast.FunctionDef) and n.name=='inbox')
    for node in ast.walk(inbox):
        if isinstance(node,ast.Dict) and any(isinstance(k,ast.Constant) and k.value=='threads' for k in node.keys):
            if not any(isinstance(k,ast.Constant) and k.value=='reply_supported' for k in node.keys):
                node.keys.append(ast.Constant('reply_supported'));node.values.append(ast.Constant(True))
    routes=next(n for n in cls.body if isinstance(n,ast.FunctionDef) and n.name=='routes')
    if 'wakhan_room_tools' not in ast.unparse(routes):
        routes.body+=ast.parse("from wakhan_room_tools import RoomTools\nif not getattr(self,'room_tools',None):self.room_tools=RoomTools(self)\nself.room_tools.routes(app)").body
    return ast.fix_missing_locations(tree)

MEDIA_UPLOAD='''
async def upload(self, req):
    from aiohttp import web
    uid=int(req['u']['id'])
    if self.app.limited(req,30):return self.app.J({'ok':False,'err':'slow_down'},429)
    # Apply a bounded limit to this authenticated route only. Legacy web apps use 64KB.
    limit=3400000
    if req.content_length is not None and req.content_length>limit:return self.app.J({'ok':False,'err':'too_big'},413)
    try:b=await req.clone(client_max_size=limit).json()
    except web.HTTPRequestEntityTooLarge:return self.app.J({'ok':False,'err':'too_big'},413)
    except Exception:return self.app.J({'ok':False,'err':'bad'},400)
    if not isinstance(b,dict):return self.app.J({'ok':False,'err':'bad'},400)
    kind=b.get('kind');data=b.get('data')
    if not isinstance(kind,str) or kind not in KINDS or not isinstance(data,str):return self.app.J({'ok':False,'err':'bad_file'},400)
    m=re.fullmatch(r'data:([a-z0-9/+.-]+)(?:;[^,]*)?;base64,([A-Za-z0-9+/=]+)',data,re.I)
    if not m:return self.app.J({'ok':False,'err':'bad_file'},400)
    mime=m.group(1).lower();ext=KINDS[kind].get(mime)
    if not ext:return self.app.J({'ok':False,'err':'bad_type'},400)
    try:raw=base64.b64decode(m.group(2),validate=True)
    except Exception:return self.app.J({'ok':False,'err':'bad_file'},400)
    if not raw or len(raw)>MAX[kind]:return self.app.J({'ok':False,'err':'too_big'},413)
    if kind=='image':
        try:from PIL import Image,ImageOps
        except ImportError:Image=None
        if Image is None:
            sig={b'\\xff\\xd8\\xff':'image/jpeg',b'\\x89PNG':'image/png',b'RIFF':'image/webp'}
            mime=next((v for k,v in sig.items() if raw.startswith(k)),'')
            if not mime or (mime=='image/webp' and raw[8:12]!=b'WEBP'):return self.app.J({'ok':False,'err':'bad_file'},400)
            ext=KINDS['image'][mime]
        else:
            try:
                import io
                image=Image.open(io.BytesIO(raw))
                if image.width*image.height>25000000:raise ValueError('dimensions')
                image=ImageOps.exif_transpose(image);image.thumbnail((1600,1600))
                if image.mode not in ('RGB','L'):image=image.convert('RGB')
                out=io.BytesIO();image.save(out,'JPEG',quality=84,optimize=True)
                raw,mime,ext=out.getvalue(),'image/jpeg','jpg'
            except Exception:return self.app.J({'ok':False,'err':'bad_file'},400)
    try:
        duration=b.get('dur',0)
        if isinstance(duration,bool):raise ValueError('duration')
        duration=int(duration or 0)
        if not 0<=duration<=120:raise ValueError('duration')
    except (ValueError,TypeError,OverflowError):return self.app.J({'ok':False,'err':'bad_duration'},400)
    mid=secrets.token_urlsafe(18);name=mid+'.'+ext;path=os.path.join(self.dir,name)
    try:
        with open(path,'xb') as file:file.write(raw)
        self.n['dbx']('insert into wkm_media(id,owner,kind,mime,file,dur,ts) values(?,?,?,?,?,?,?)',mid,uid,kind,mime,name,duration,int(time.time()))
    except Exception:
        try:os.remove(path)
        except OSError:pass
        raise
    return self.app.J({'ok':True,'id':mid,'kind':kind,'dur':duration})
'''

def upgrade_media(tree):
    cls=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='ChatMedia')
    replace_methods(cls,MEDIA_UPLOAD)
    return ast.fix_missing_locations(tree)

PUSH_METHODS='''
async def off(self,req):
    uid=self.app.current(req)
    if not uid:return self.app.J({'ok':False,'err':'auth'},401)
    body=await self.app.body(req);token=body.get('token','')
    if not isinstance(token,str) or len(token)>4096:return self.app.J({'ok':False,'err':'bad'},400)
    if token:self.n['dbx']('DELETE FROM wka_push WHERE token=? AND uid=?',token,uid)
    return self.app.J({'ok':True})

async def status(self,req):
    uid=self.app.current(req)
    if not uid:return self.app.J({'ok':False,'err':'auth'},401)
    count=self.n['dbq']('SELECT count(*) FROM wka_push WHERE uid=?',uid)[0][0]
    return self.app.J({'ok':True,'ready':bool(self.key()),'phones':count})
'''

def upgrade_push(tree):
    cls=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Push')
    replace_methods(cls,PUSH_METHODS)
    return ast.fix_missing_locations(tree)
