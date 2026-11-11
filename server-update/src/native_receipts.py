"""Authenticated in-app receipt upload and finance preview. Upload never credits coins."""
import asyncio
import base64
import binascii
import io
import os
from pathlib import Path
import re
import tempfile
import time
from aiohttp import web
from PIL import Image, ImageOps

MANUAL = frozenset(('irr','usdt','ton','sepa','revolut','afn'))
TABLES = {'personal':'wm_personal_orders','wallet':'wm_coin_topups'}
LOCAL = re.compile(r'local:([a-f0-9]{32}\.jpg)\Z')


def normalize_photo(value):
    if not isinstance(value,str) or len(value)>6_000_000:
        raise ValueError('photo_invalid')
    match=re.fullmatch(r'data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=\r\n]+)',value)
    if not match:raise ValueError('photo_invalid')
    try:
        raw=base64.b64decode(match[2],validate=True)
        if len(raw)>4_000_000:raise ValueError('photo_invalid')
        with Image.open(io.BytesIO(raw)) as original:
            if original.width*original.height>16_000_000 or original.width<1 or original.height<1:
                raise ValueError('photo_invalid')
            original.load()
            photo=ImageOps.exif_transpose(original).convert('RGB')
            photo.thumbnail((1600,1600))
            output=io.BytesIO();photo.save(output,format='JPEG',quality=86,optimize=True)
            return output.getvalue()
    except (OSError,ValueError,binascii.Error,Image.DecompressionBombError):
        raise ValueError('photo_invalid') from None


class Receipts:
    def __init__(self,ns):
        self.n,self.db=ns,ns['DB']
        self.folder=Path(ns['DATA'])/'receipts'
        self.folder.mkdir(mode=0o700,parents=True,exist_ok=True)
        self.limit=asyncio.Semaphore(2)

    async def upload(self,request):
        path=None
        try:
            body=await request.json()
            if not isinstance(body,dict):raise ValueError('bad')
            uid=int(request['u']['id']);kind=body.get('kind');oid=body.get('id')
            if kind not in TABLES or type(oid) is not int or oid<=0:raise ValueError('bad')
            bill=self.n['WM_CHECKOUT'].bill(kind,oid,uid)
            if not bill:raise ValueError('notfound')
            if bill['method'] not in MANUAL:raise ValueError('bad_method')
            if bill['deadline']<=time.time():raise ValueError('expired')
            if bill['status'] not in ('draft','wait'):raise ValueError('already_reviewed')
            note=str(body.get('note') or '').strip()
            if len(note)>400:raise ValueError('proof_invalid')
            image=body.get('photo')
            if not image and len(note)<4:raise ValueError('proof_required')
            reference=bill.get('photo')
            if image:
                async with self.limit:data=await asyncio.to_thread(normalize_photo,image)
                import secrets
                name=secrets.token_hex(16)+'.jpg';path=self.folder/name
                fd=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY|os.O_NOFOLLOW,0o600)
                with os.fdopen(fd,'wb') as stream:stream.write(data)
                reference='local:'+name
            # Recheck the current bill after awaiting photo processing. A concurrent
            # approval must not be overwritten or moved back to pending.
            with self.db:
                fresh=self.n['WM_CHECKOUT'].bill(kind,oid,uid)
                if not fresh or fresh['status'] not in ('draft','wait'):raise ValueError('already_reviewed')
                if fresh['deadline']<=time.time():raise ValueError('expired')
                if fresh['method'] not in MANUAL:raise ValueError('bad_method')
                changed=self.db.execute('update '+TABLES[kind]+" set status='wait' where id=? and uid=? and status in ('draft','wait')",(oid,uid))
                if changed.rowcount!=1:raise ValueError('already_reviewed')
                self.db.execute('update wm_checkout_meta set photo=?,note=? where kind=? and oid=? and uid=?',(reference,note,kind,oid,uid))
            path=None # The committed file now belongs to this order.
            final=self.n['WM_CHECKOUT'].bill(kind,oid,uid)
            return self.n['J']({'ok':True,'bill':self.n['WM_CHECKOUT'].public_bill(final)})
        except (ValueError,TypeError) as error:
            return self.n['J']({'ok':False,'err':str(error)},400)
        finally:
            if path is not None:path.unlink(missing_ok=True)

    async def preview(self,request):
        try:
            self.n['WM_FINANCE'].require(int(request['u']['id']))
            kind=request.match_info.get('kind');raw=request.match_info.get('id','')
            if kind not in TABLES or not raw.isdigit():raise ValueError('notfound')
            bill=self.n['WM_CHECKOUT'].bill(kind,int(raw))
            if not bill:raise ValueError('notfound')
            match=LOCAL.fullmatch(str(bill.get('photo') or ''))
            if not match:raise ValueError('notfound')
            path=self.folder/match[1]
            if path.is_symlink() or not path.is_file():raise ValueError('notfound')
            return web.FileResponse(path,headers={'Content-Type':'image/jpeg','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'})
        except PermissionError:
            return self.n['J']({'ok':False,'err':'finance_forbidden'},403)
        except (ValueError,TypeError):
            return self.n['J']({'ok':False,'err':'notfound'},404)

    def routes(self,app):
        app.router.add_post('/api/app/payments/receipt',self.n['auth'](self.upload))
