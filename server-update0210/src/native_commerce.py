"""Regional storefront and idempotent fulfilment from verified provider payments."""
import hashlib,json,re,secrets,time
from decimal import Decimal,InvalidOperation
from urllib.parse import urlsplit
from aiohttp import web
from commerce_catalog import catalog,country,product
from native_payment_gateways import Gateways,GatewayError


class CommerceError(Exception):
    def __init__(self,code,status=400):self.code,self.status=code,status


class Commerce:
    def __init__(self,namespace):
        self.n,self.db=namespace,namespace['DB'];self.gateway=Gateways(namespace['ENV'])
        self.db.executescript('''
CREATE TABLE IF NOT EXISTS wka_commerce_orders(id INTEGER PRIMARY KEY AUTOINCREMENT,token TEXT UNIQUE NOT NULL,uid INTEGER NOT NULL,request_key TEXT NOT NULL,provider TEXT NOT NULL,provider_ref TEXT,sku TEXT NOT NULL,country TEXT NOT NULL,currency TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount>0),coins INTEGER NOT NULL,months INTEGER NOT NULL,state TEXT NOT NULL,created INTEGER NOT NULL,paid INTEGER,checkout_url TEXT,UNIQUE(uid,request_key),UNIQUE(provider,provider_ref));
CREATE TABLE IF NOT EXISTS wka_commerce_events(provider TEXT NOT NULL,event TEXT NOT NULL,order_id INTEGER NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(provider,event));
''');self.db.commit()

    def row(self,token,uid=None):
        if not isinstance(token,str) or not re.fullmatch(r'[a-f0-9]{32}',token):raise CommerceError('order_missing',404)
        cursor=self.db.execute('SELECT * FROM wka_commerce_orders WHERE token=?',(token,));row=cursor.fetchone()
        value=dict(zip([item[0] for item in cursor.description],row)) if row else None
        if not value or uid is not None and value['uid']!=uid:raise CommerceError('order_missing',404)
        return value

    def public(self,order):
        return {key:order[key] for key in ('token','sku','currency','amount','coins','months','state','created','paid')}

    async def catalog(self,req):
        uid=int(req['u']['id']);value=catalog(req.query.get('country','US'))
        value.update(ok=True,balance=self.n['WM_WALLET'].amount(self.n['WM_WALLET'].balance(uid)),entitlement=await self.n['WM_PERSONAL'].entitlement(uid),methods=[{'id':provider,'enabled':self.gateway.enabled(provider,value['currency'])} for provider in ('stripe','paypal')])
        return self.n['J'](value)

    async def create(self,req):
        uid=int(req['u']['id']);body=await self.body(req);key=body.get('client_key');provider=body.get('provider')
        if not isinstance(key,str) or not re.fullmatch('[a-f0-9]{32}',key):raise CommerceError('bad_request_key')
        item=product(body.get('country'),body.get('sku'))
        if not self.gateway.enabled(provider,item['currency']):raise CommerceError('payment_unavailable',503)
        cursor=self.db.execute('SELECT token FROM wka_commerce_orders WHERE uid=? AND request_key=?',(uid,key));existing=cursor.fetchone()
        if existing:
            order=self.row(existing[0],uid)
            if (order['provider'],order['sku'],order['country'])!=(provider,item['sku'],item['country']):raise CommerceError('intent_mismatch',409)
            if order['state']=='paid':return self.n['J'](dict(self.public(order),ok=True))
        else:
            self.n['WM_COMMUNITY70'].limited(uid,'commerce',4,10)
            token=secrets.token_hex(16)
            with self.db:self.db.execute('INSERT INTO wka_commerce_orders(token,uid,request_key,provider,sku,country,currency,amount,coins,months,state,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(token,uid,key,provider,item['sku'],item['country'],item['currency'],item['amount'],item['coins'],item['months'],'created',int(time.time())))
            order=self.row(token,uid)
        if not order['provider_ref']:
            reference,url=await self.gateway.create(provider,order)
            parsed=urlsplit(url or '')
            hosts={'stripe':{'checkout.stripe.com'},'paypal':{'www.paypal.com','paypal.com'}}
            if not isinstance(reference,str) or not reference or len(reference)>200 or parsed.scheme!='https' or parsed.hostname not in hosts[provider] or parsed.username or parsed.password or parsed.port not in (None,443):raise CommerceError('payment_provider_unavailable',502)
            with self.db:self.db.execute("UPDATE wka_commerce_orders SET provider_ref=?,checkout_url=?,state='pending' WHERE id=? AND provider_ref IS NULL",(reference,url,order['id']))
            order=self.row(order['token'],uid)
        return self.n['J'](dict(self.public(order),ok=True,url=order['checkout_url']))

    def fulfill(self,provider,event,reference,currency,amount):
        if not isinstance(event,str) or not 0<len(event)<=200 or not isinstance(reference,str):raise CommerceError('bad_event')
        cursor=self.db.execute('SELECT * FROM wka_commerce_orders WHERE provider=? AND provider_ref=?',(provider,reference));row=cursor.fetchone()
        if not row:return {'ok':True,'ignored':True}
        order=dict(zip([item[0] for item in cursor.description],row))
        if type(amount) is not int or amount!=order['amount'] or currency!=order['currency']:raise CommerceError('payment_amount_mismatch',409)
        with self.db:
            duplicate=self.db.execute('SELECT 1 FROM wka_commerce_events WHERE provider=? AND event=?',(provider,event)).fetchone()
            if duplicate or order['state'] in ('paid','paid_review'):return {'ok':True,'duplicate':True}
            now=int(time.time());account=self.db.execute('SELECT done,blocked FROM wka_accounts WHERE uid=?',(order['uid'],)).fetchone()
            state='paid' if account and account[0] and not account[1] else 'paid_review'
            if state=='paid':
                if order['coins']:
                    key=hashlib.sha256(('commerce:'+str(order['id'])).encode()).hexdigest()[:32]
                    self.n['WM_WALLET'].move('topup',0,order['uid'],order['coins']*100,key,{'provider':provider,'commerce_order':order['id'],'sku':order['sku']})
                else:self.extend(order['uid'],order['months'],'online_v1',order['id'],now)
            self.db.execute('UPDATE wka_commerce_orders SET state=?,paid=? WHERE id=?',(state,now,order['id']))
            self.db.execute('INSERT INTO wka_commerce_events VALUES(?,?,?,?)',(provider,event,order['id'],now))
        return {'ok':True,'state':state}

    def extend(self,uid,months,kind,oid,now):
        if months not in (1,6,12):raise CommerceError('bad_product')
        row=self.db.execute('SELECT until FROM wm_personal_subs WHERE uid=?',(uid,)).fetchone();until=max(now,row[0] if row else 0)+{1:30,6:180,12:365}[months]*86400
        self.db.execute('INSERT INTO wm_personal_subs VALUES(?,?) ON CONFLICT(uid) DO UPDATE SET until=excluded.until',(uid,until))
        self.db.execute('INSERT INTO wm_identity_purchases(kind,oid,uid,months,recognized,until) VALUES(?,?,?,?,?,?)',(kind,oid,uid,months,now,until))

    async def status(self,req):
        uid=int(req['u']['id']);order=self.row(req.match_info['token'],uid)
        if req.method=='POST' and order['provider']=='paypal' and order['state']=='pending':
            value=await self.gateway.capture(order['provider_ref'],order['token'])
            if value.get('id')!=order['provider_ref'] or value.get('status')!='COMPLETED':raise CommerceError('payment_pending',409)
            captures=[capture for unit in value.get('purchase_units',[]) for capture in unit.get('payments',{}).get('captures',[])]
            if len(captures)!=1 or captures[0].get('status')!='COMPLETED':raise CommerceError('payment_pending',409)
            capture=captures[0];amount=capture.get('amount',{});self.fulfill('paypal','capture:'+capture['id'],order['provider_ref'],amount.get('currency_code'),self.minor(amount.get('value')))
            order=self.row(order['token'],uid)
        value=self.public(order);value.update(ok=True,balance=self.n['WM_WALLET'].amount(self.n['WM_WALLET'].balance(uid)),entitlement=await self.n['WM_PERSONAL'].entitlement(uid));return self.n['J'](value)

    async def webhook(self,req):
        raw=await req.clone(client_max_size=256000).read()
        if len(raw)>256000:raise CommerceError('bad_event')
        provider=req.match_info['provider']
        if provider=='stripe':
            event=self.gateway.verify_stripe(raw,req.headers.get('Stripe-Signature',''))
            if event.get('type') not in ('checkout.session.completed','checkout.session.async_payment_succeeded'):return self.n['J']({'ok':True,'ignored':True})
            value=event.get('data',{}).get('object',{})
            if value.get('payment_status')!='paid':return self.n['J']({'ok':True,'pending':True})
            result=self.fulfill(provider,event.get('id'),value.get('id'),str(value.get('currency','')).upper(),value.get('amount_total'))
        elif provider=='paypal':
            try:event=json.loads(raw)
            except ValueError:raise CommerceError('bad_event')
            if not isinstance(event,dict):raise CommerceError('bad_event')
            await self.gateway.verify_paypal(event,req.headers)
            if event.get('event_type')!='PAYMENT.CAPTURE.COMPLETED':return self.n['J']({'ok':True,'ignored':True})
            value=event.get('resource',{});reference=value.get('supplementary_data',{}).get('related_ids',{}).get('order_id');amount=value.get('amount',{})
            if value.get('status')!='COMPLETED':raise CommerceError('payment_pending',409)
            result=self.fulfill(provider,event.get('id'),reference,amount.get('currency_code'),self.minor(amount.get('value')))
        else:raise CommerceError('bad_provider',404)
        return self.n['J'](result)

    async def admin(self,req):
        uid=int(req['u']['id']);self.n['WM_FINANCE'].require(uid)
        cursor=self.db.execute('SELECT token,uid,sku,currency,amount,coins,months,state,created,paid FROM wka_commerce_orders ORDER BY id DESC LIMIT 80')
        rows=[dict(zip([item[0] for item in cursor.description],row)) for row in cursor.fetchall()]
        for row in rows:row['buyer']=self.n['WM_FINANCE'].buyer(row.pop('uid'))
        return self.n['J']({'ok':True,'orders':rows})

    async def buy_coins(self,req):
        uid=int(req['u']['id']);body=await self.body(req);sku=body.get('sku');key=self.n['WM_WALLET'].key(body.get('client_key'))
        item=product(body.get('country'),sku)
        if not item['months']:raise CommerceError('bad_product')
        units={1:50,6:250,12:450}[item['months']]*100;now=int(time.time())
        with self.db:
            oid,created=self.n['WM_WALLET'].move('purchase',uid,0,units,key,{'kind':'personal_v2','months':item['months'],'country':item['country']})
            if created:
                self.extend(uid,item['months'],'coins_v2',oid,now)
                self.db.execute('INSERT INTO wm_coin_purchases(id,uid,product,cid,months,amount,ts) VALUES(?,?,?,?,?,?,?)',(oid,uid,'personal',0,item['months'],self.n['WM_WALLET'].amount(units),now))
        return self.n['J']({'ok':True,'duplicate':not created,'balance':self.n['WM_WALLET'].amount(self.n['WM_WALLET'].balance(uid)),'entitlement':await self.n['WM_PERSONAL'].entitlement(uid)})

    @staticmethod
    def minor(value):
        try:
            number=Decimal(value)*100
            if not number.is_finite() or number!=number.to_integral_value() or not 0<number<100000000:raise ValueError()
            return int(number)
        except (TypeError,ValueError,InvalidOperation):raise CommerceError('bad_amount') from None

    @staticmethod
    async def body(req):
        try:value=await req.clone(client_max_size=4096).json()
        except Exception:raise CommerceError('bad_request')
        if not isinstance(value,dict):raise CommerceError('bad_request')
        return value

    def routes(self,app):
        def guarded(handler,auth=True):
            async def call(req):
                try:return await handler(req)
                except CommerceError as error:return self.n['J']({'ok':False,'err':error.code},error.status)
                except GatewayError as error:return self.n['J']({'ok':False,'err':str(error)},503)
                except (ValueError,PermissionError) as error:return self.n['J']({'ok':False,'err':'payment_request_failed'},403 if isinstance(error,PermissionError) else 400)
            return self.n['auth'](call) if auth else call
        app.router.add_get('/api/app/commerce',guarded(self.catalog));app.router.add_post('/api/app/commerce/orders',guarded(self.create))
        app.router.add_get('/api/app/commerce/orders/{token}',guarded(self.status));app.router.add_post('/api/app/commerce/orders/{token}/capture',guarded(self.status))
        app.router.add_post('/api/app/commerce/buy-with-coins',guarded(self.buy_coins));app.router.add_get('/api/app/commerce/admin/orders',guarded(self.admin))
        app.router.add_post('/api/payments/{provider}/webhook',guarded(self.webhook,False))
        async def returned(req):return web.Response(text='<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wakhan</title><main style="font:18px system-ui;padding:32px"><h1>Wakhan</h1><p>Return to Wakhan to check your payment.</p><p dir="rtl">برای بررسی پرداخت به واخان برگرد.</p></main>',content_type='text/html',headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer'})
        app.router.add_get('/pay/return',returned)


def install(app,namespace):
    value=Commerce(namespace);value.routes(app);namespace['WM_COMMERCE']=value;return value
