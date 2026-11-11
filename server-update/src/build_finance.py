"""Keep the existing transactional ledger, replace messaging payment workflows."""
import ast
from pathlib import Path

MANUAL = ('irr','usdt','ton','sepa','revolut','afn')
OVERRIDES = {
('PersonalPlans','entitlement'): '''
async def entitlement(self, uid):
    uid=int(uid); now=int(time.time())
    row=self.db.execute('select until from wm_personal_subs where uid=?',(uid,)).fetchone()
    until=int(row[0]) if row else 0
    if uid==self.n['OWNER']:
        return {'allowed':True,'via':'creator','until':until,'server_now':now}
    if until>now:
        trial=self.db.execute('select until from wm_personal_trials where uid=?',(uid,)).fetchone()
        return {'allowed':True,'via':'trial' if trial and until==trial[0] else 'personal','until':until,'server_now':now}
    grant=self.db.execute('select until from wka_native_access where uid=?',(uid,)).fetchone()
    if grant and (int(grant[0])==0 or int(grant[0])>now):
        return {'allowed':True,'via':'app','until':int(grant[0]),'server_now':now}
    return {'allowed':False,'via':None,'until':until,'server_now':now}
''',
('Checkout','__init__'): '''
def __init__(self,ns):
    self.n,self.db=ns,ns['DB'];self.finance=ns['WM_FINANCE'];self.personal=ns['WM_PERSONAL']
    self.db.executescript("""create table if not exists wm_checkout_meta(
      kind text not null,oid integer not null,uid integer not null,method text not null,
      cur text not null,amount text not null,destination text not null,reference text not null,
      nonce text not null,issued integer not null,expires integer not null,deadline integer not null,
      lang text not null,client_key text not null,photo text,note text,payload text,invoice_link text,
      primary key(kind,oid),unique(uid,client_key),unique(payload));""")
    self.install_finance()
''',
('Checkout','methods'): '''
def methods(self):
    return [{'code':m,'cur':'eur' if m in ('sepa','revolut') else m,'configured':bool(self.receiver(m)),
      'network':'TON' if m in ('ton','usdt') else None} for m in ('irr','usdt','ton','sepa','revolut','afn')]
''',
('Checkout','eligible'): '''
async def eligible(self,uid,kind,cid,months):
    if kind!='personal' or type(months) is not int or months not in (1,3,12):
        raise ValueError('bad_plan')
    return 0
''',
('Checkout','public_bill'): '''
def public_bill(self,bill):
    data={k:v for k,v in bill.items() if k not in ('uid','nonce','photo','note','payload','client_key')}
    data['resume_key']=bill['client_key']
    data['proof_url']=None
    data['receipt_in_app']=bool(bill['method'] in ('irr','usdt','ton','sepa','revolut','afn') and bill['deadline']>time.time() and bill['status'] in ('draft','wait'))
    return data
''',
('Checkout','support_contact'): '''
async def support_contact(self):
    owner=int(self.n['OWNER'])
    return {'owner_id':owner,'public_id':self.n['WM_PUBLIC_IDS'].get(owner),'action':'profile'}
''',
('Checkout','install_finance'): '''
def install_finance(self):
    original=self.finance.order
    def order(kind,oid):
        data=original(kind,oid);bill=self.bill(kind,oid) if kind in TABLES else None
        if data and bill:
            data.update(method=bill['method'],reference=bill['reference'],has_photo=bool(bill['photo']),proof=bill['note'] or data['proof'],lang=bill['lang'])
        return data
    async def receipt(req):
        return await self.n['WM_RECEIPTS'].preview(req)
    self.finance.order=order;self.finance.api_receipt=receipt
''',
('Wallet','install_checkout'): '''
def install_checkout(self):
    import wakhan_checkout_v8
    wakhan_checkout_v8.TABLES['wallet']='wm_coin_topups'
''',
('Wallet','invoice'): '''
async def invoice(self,bill):
    if bill['method'] not in ('irr','usdt','ton','sepa','revolut','afn'):
        raise ValueError('bad_method')
    return bill
''',
('Finance','api_review'): '''
async def api_review(self,req):
    try:
        body=await req.json()
        if not isinstance(body,dict):raise ValueError('bad')
        result=self.decide(int(req['u']['id']),body.get('kind'),body.get('id'),body.get('action'))
        return self.n['J'](dict(result,ok=True))
    except PermissionError as error:
        return self.n['J']({'ok':False,'err':str(error)},403)
    except (ValueError,TypeError) as error:
        return self.n['J']({'ok':False,'err':str(error)},409)
''',
('Finance','api_receipt'): '''
async def api_receipt(self,req):
    return await self.n['WM_RECEIPTS'].preview(req)
''',
('Finance','proof_url'): '''
def proof_url(self,oid,nonce):
    return None
''',
}
ROOTS = {
    'PersonalPlans':set('''__init__ entitlement catalog order trial sign verify media_lease media_allowed decide'''.split()),
    'Finance':set('''__init__ summary api_summary api_orders api_seen api_review api_staff api_receivers api_receipt role require buyer customer_orders receiver'''.split()),
    'Checkout':set('''__init__ api_catalog api_prepare api_status methods receiver support_contact public_bill bill eligible'''.split()),
    'Wallet':set('''__init__ api move decide order purchase_order'''.split()),
}


def modify(class_name,method):
    name=method.name
    replacement=OVERRIDES.get((class_name,name))
    if replacement:return ast.parse(replacement).body[0]
    if class_name=='PersonalPlans' and name=='order':
        method.body=[node for node in method.body if not (isinstance(node,ast.If) and "self.n['bot']" in ast.unparse(node))]
    if class_name=='PersonalPlans' and name=='catalog':
        method.body=[node for node in method.body if not (isinstance(node,ast.If) and 'WM_STARS' in ast.unparse(node))]
        class NoStars(ast.NodeTransformer):
            def visit_Dict(self,node):
                self.generic_visit(node)
                for index,key in enumerate(node.keys):
                    if isinstance(key,ast.Constant) and key.value=='stars':node.values[index]=ast.parse("{'configured':False,'prices':{},'deferred':True}",mode='eval').body
                return node
        method=NoStars().visit(method)
    if class_name=='Checkout' and name=='api_catalog':
        method.body.insert(0,ast.parse("if req.query.get('kind','personal')!='personal': return self.n['J']({'ok':False,'err':'bad'},400)").body[0])
        method.body=[node for node in method.body if not (isinstance(node,ast.If) and 'WM_STARS' in ast.unparse(node))]
        class Pricing(ast.NodeTransformer):
            def visit_Try(self,node):
                if 'self.stars_amount' in ast.unparse(node):
                    return ast.parse("p['stars']=None").body[0]
                return self.generic_visit(node)
        method=Pricing().visit(method)
    if class_name=='Checkout' and name=='prepare':
        class ManualOnly(ast.NodeTransformer):
            def visit_If(self,node):
                if isinstance(node.test,ast.Name) and node.test.id=='stars':
                    return [self.visit(child) for child in node.orelse]
                return self.generic_visit(node)
            def visit_IfExp(self,node):
                if isinstance(node.test,ast.Name) and node.test.id=='stars':return self.visit(node.orelse)
                return self.generic_visit(node)
        method=ManualOnly().visit(method)
        method.body.insert(0,ast.parse("if stars: raise ValueError('bad_method')").body[0])
    if class_name=='Checkout' and name=='plan':
        method.body=[node for node in method.body if not (isinstance(node,ast.If) and 'self.group_plan' in ast.unparse(node))]
    if class_name=='Finance' and name=='decide':
        method.body.insert(0,ast.parse("if kind!='personal': raise ValueError('bad')").body[0])
    if class_name=='Finance' and name=='buyer':
        for node in ast.walk(method):
            if isinstance(node,ast.Dict) and any(isinstance(key,ast.Constant) and key.value=='username' for key in node.keys):
                node.keys.append(ast.Constant('public_id'))
                node.values.append(ast.parse("self.n['WM_PUBLIC_IDS'].get(uid) if self.n.get('WM_PUBLIC_IDS') else None",mode='eval').body)
    if class_name=='Wallet' and name=='transfer_quote':
        method.body.insert(1,ast.parse("""if self.n.get('WM_PUBLIC_IDS') and type(target) is int:
    resolved=self.n['WM_PUBLIC_IDS'].resolve(target)
    if resolved is not None:target=resolved
""").body[0])
    if class_name=='Wallet' and name in ('topup_quote','topup'):
        for index,node in enumerate(method.body):
            if isinstance(node,ast.Assign) and any(isinstance(target,ast.Name) and target.id=='method' for target in node.targets):
                method.body.insert(index+1,ast.parse("if method not in ('irr','usdt','ton','sepa','revolut','afn'): raise ValueError('bad_method')").body[0]);break
    if class_name=='Wallet' and name=='purchase_quote':
        class PersonalPrice(ast.NodeTransformer):
            def visit_IfExp(self,node):
                if 'self.checkout.group_plan' in ast.unparse(node):return self.visit(node.body)
                return self.generic_visit(node)
        method=PersonalPrice().visit(method)
    return method


def transform(source, wanted):
    tree=ast.parse(source)
    for cls in tree.body:
        if not isinstance(cls,ast.ClassDef) or cls.name not in ROOTS:continue
        if cls.name!=wanted:continue
        methods={node.name:modify(cls.name,node) for node in cls.body if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef))}
        roots=ROOTS[cls.name];selected=set();todo=list(roots)
        while todo:
            name=todo.pop()
            if name in selected:continue
            if name not in methods:raise ValueError('METHOD_NOT_FOUND: '+cls.name+'.'+name)
            selected.add(name)
            for node in ast.walk(methods[name]):
                if isinstance(node,ast.Attribute) and isinstance(node.value,ast.Name) and node.value.id in ('self',cls.name) and node.attr in methods and node.attr not in selected:todo.append(node.attr)
        cls.body=[methods[node.name] if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)) else node for node in cls.body if not isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)) or node.name in selected]
    # Private payment destinations are retained from the database, never reseeded from public source.
    tree.body=[node for node in tree.body if not (isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='EUROPE' for t in node.targets))]
    ast.fix_missing_locations(tree)
    text=ast.unparse(tree)+'\n'
    for bad in ('aiogram','pyrogram','pytgcalls',"self.n['bot']","self.n['router']","self.n['ME']",'tg://','https://t.me/'):
        if bad in text:raise ValueError('UNPORTED_FINANCIAL_DEPENDENCY: '+wanted+':'+bad)
    compile(text,'native-finance','exec')
    return text


def generate(source_root,output,review=False):
    output.mkdir(parents=True,exist_ok=True)
    names={'wakhan_personal_v4':'PersonalPlans','wakhan_finance_v6':'Finance','wakhan_checkout_v8':'Checkout','wakhan_wallet_v23':'Wallet'}
    for file_name,cls in names.items():
        source=(source_root/(file_name+('.review.py' if review else '.py'))).read_text()
        text=transform(source,cls)
        if not review and 'REDACTED_FOR_SOURCE_REVIEW' in text:raise ValueError('REDACTED_REVIEW_FILE_IS_NOT_A_RELEASE_SOURCE')
        (output/(file_name+'.py')).write_text(text)


if __name__=='__main__':
    root=Path(__file__).resolve().parent.parent
    generate(root/'source/backend-review',root/'candidate/standalone',review=True)
    print('NATIVE_LEDGER_AND_PAYMENT_CANDIDATES_READY')
