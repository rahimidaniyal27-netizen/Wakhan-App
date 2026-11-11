"""Extract and transform account modules, never import the old server entry point.

Release generation must use the hash-verified originals on the user's server.
Review-source generation is only for the isolated tests in this workspace.
"""
import ast
from pathlib import Path


ACCOUNT_REPLACEMENTS = {
    '__init__': '''
def __init__(self, ns):
    self.n = ns
    self.mail = {}
    self.rate = {}
''',
    'secret': '''
def secret(self):
    key = self.n['APP_SESSION_KEY']
    if not isinstance(key, bytes) or len(key) != 32:
        raise RuntimeError('APP_SESSION_KEY_INVALID')
    return key
''',
    'current': '''
def current(self, req):
    raw = req.headers.get('X-Init', '')
    return self.key_uid(raw)[0] if raw.startswith(self.PREFIX) else None
''',
    'config': '''
async def config(self, req):
    return self.J({'ok': True, 'google': self.env('WKA_GOOGLE_CLIENT_ID'),
        'email': self.mail_ready(), 'native': True, 'version':'0.2.8-beta',
        'features':['private_replies','chat_media','room_tools','preferences'],
        'push': bool(getattr(self, 'push', None) and self.push.key())})
''',
    'ensure': '''
def ensure(self, uid):
    if not self.account(uid):
        self.n['dbx']('insert into wka_accounts (uid,kind,created,name) values(?,?,?,?)',
            int(uid), 'app', int(time.time()), self.user(uid).get('name', ''))
    return self.account(uid)
''',
    'me': '''
async def me(self, req):
    uid = self.current(req)
    if not uid:
        return self.J({'ok': False, 'err': 'auth'}, 401)
    a = self.ensure(uid)
    if a['blocked']:
        return self.J({'ok': False, 'err': 'too_young'}, 403)
    ids=self.n.get('WM_PUBLIC_IDS')
    return self.J({'ok': True, 'uid': uid, 'public_id':ids.assign(uid) if ids else None, 'email': a['email'] or '',
        'google': bool(a['google']), 'name': self.user(uid).get('name', ''),
        'username': a['username'] or '', 'complete': bool(a['done']),
        'username_next': self.uname_next(uid)})
''',
    'avatar_hooks': '''
def avatar_hooks(self):
    profile = self.n.get('WM_SYNC')
    if not profile:
        return
    old_avatar, old_photo = profile.avatar, profile.photo
    async def photo(uid):
        return self.own_photo(int(uid)) or await old_photo(uid)
    async def avatar(req):
        from aiohttp import web
        raw = req.match_info.get('u', '')
        if re.fullmatch(r'\\d{1,19}', raw):
            data = self.own_photo(int(raw))
            if data:
                return web.Response(body=data, content_type='image/jpeg', headers={
                    'Cache-Control':'private,max-age=120', 'X-Content-Type-Options':'nosniff'})
        return await old_avatar(req)
    profile.photo, profile.avatar = photo, avatar
''',
    'resolve': '''
async def resolve(self,req):
    query=str(req.query.get('q','')).strip()
    uid=None
    if query.isdigit() and len(query)<=19:
        number=int(query);ids=self.n.get('WM_PUBLIC_IDS')
        uid=ids.resolve(number) if ids else None
        if uid is None:
            row=self.n['dbq']('select uid from wka_accounts where uid=? and done=1 and blocked=0',number)
            uid=int(row[0][0]) if row else None
    else:
        query=query.lstrip('@').lower()
        row=self.n['dbq']('select uid from wka_accounts where lower(username)=? and done=1 and blocked=0',query)
        uid=int(row[0][0]) if row else None
    if uid is None:return self.J({'ok':False,'err':'not_found'})
    user=self.user(uid);account=self.account(uid);ids=self.n.get('WM_PUBLIC_IDS')
    return self.J({'ok':True,'uid':uid,'public_id':ids.get(uid) if ids else None,
        'name':user.get('name') or '', 'username':account.get('username') or ''})
''',
    'install': '''
def install(self):
    self.init()
    self.n['check_init'] = self.check_key
    community = self.n['WM_COMMUNITY70']
    old_routes = community.routes
    def routes(app):
        old_routes(app)
        self.routes(app)
    community.routes = routes
    self.avatar_hooks()
    from wakhan_push import Push
    self.push = Push(self)
    self.push.install()
    from wakhan_chatmedia import ChatMedia
    self.media = ChatMedia(self)
    self.media.init()
''',
}

NATIVE_INSTALL = '''
def install(self):
    self.init()
    old_config = self.a.config
    async def config(req):
        response = await old_config(req)
        value = json.loads(response.body)
        value.update(native=True, facebook=self.facebook_ready())
        return self.a.J(value, response.status)
    self.a.config = config
    old_me = self.a.me
    async def me(req):
        response = await old_me(req)
        value = json.loads(response.body)
        if value.get('ok'):
            rows = self.n['dbq']('select facebook from wka_accounts where uid=?', value['uid'])
            value['facebook'] = bool(rows and rows[0][0])
        return self.a.J(value, response.status)
    self.a.me = me
    old_routes = self.a.routes
    def routes(app):
        if native_cors not in app.middlewares:
            app.middlewares.append(native_cors)
        old_routes(app)
        router = app.router
        router.add_post('/api/app/native/start', self.start)
        router.add_get('/app-auth', self.browser)
        router.add_get('/app-auth/confirm', self.confirmation)
        router.add_post('/api/app/native/google', self.google)
        router.add_get('/api/app/native/facebook/callback', self.facebook_callback)
        router.add_post('/api/app/native/confirm', self.confirm)
        router.add_post('/api/app/native/poll', self.poll)
    self.a.routes = routes
'''


class RemoveDocs(ast.NodeTransformer):
    def _body(self, node):
        self.generic_visit(node)
        if node.body and isinstance(node.body[0], ast.Expr) and isinstance(node.body[0].value, ast.Constant) and isinstance(node.body[0].value.value, str):
            node.body.pop(0)
        if not node.body:
            node.body.append(ast.Pass())
        return node
    visit_FunctionDef = visit_AsyncFunctionDef = visit_ClassDef = _body


def account_tree(source):
    tree = ast.parse(source)
    cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'WakhanApp')
    remove = {'bot_username', 'tg_start', 'tg_poll', 'on_start', 'on_button', 'bot_hooks'}
    new_body = []
    for node in cls.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if node.name in remove:
                continue
            if node.name in ACCOUNT_REPLACEMENTS:
                node = ast.parse(ACCOUNT_REPLACEMENTS[node.name]).body[0]
            elif node.name == 'routes':
                node.body = [stmt for stmt in node.body if '/api/app/telegram/' not in ast.unparse(stmt)]
            elif node.name == 'report':
                # Keep report validation, rate limit, app block and database write.
                # Its old final try block sends a bot notification and is removed.
                node.body = [stmt for stmt in node.body if not (isinstance(stmt, ast.Try) and "self.n['bot']" in ast.unparse(stmt))]
            elif node.name == 'attach':
                class AppKind(ast.NodeTransformer):
                    def visit_IfExp(self, expression):
                        if isinstance(expression.body, ast.Constant) and expression.body.value == 'tg' and isinstance(expression.orelse, ast.Constant) and expression.orelse.value == 'app':
                            return ast.copy_location(ast.Constant('app'), expression)
                        return self.generic_visit(expression)
                node = AppKind().visit(node)
            elif node.name == 'new_key':
                node.body.insert(0,ast.parse("if self.n.get('WM_PUBLIC_IDS'): self.n['WM_PUBLIC_IDS'].assign(int(uid))").body[0])
            elif node.name == 'wipe':
                node.body[0:0]=ast.parse("community=self.n.get('WM_COMMUNITY70')\nif community and getattr(community,'room_tools',None):community.room_tools.wipe(int(uid))\nids=self.n.get('WM_PUBLIC_IDS')\nif ids:ids.retire(int(uid))").body
        elif isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'TG_TTL' for t in node.targets):
            continue
        new_body.append(node)
    cls.body = new_body
    tree = RemoveDocs().visit(tree)
    ast.fix_missing_locations(tree)
    return tree


def native_tree(source):
    tree = ast.parse(source)
    cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'NativeApp')
    cls.body = [ast.parse(NATIVE_INSTALL).body[0] if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and n.name == 'install' else n for n in cls.body]
    tree = RemoveDocs().visit(tree)
    ast.fix_missing_locations(tree)
    return tree


def generate(sources, output, review=False):
    output.mkdir(parents=True, exist_ok=True)
    suffix = '.review.py' if review else '.py'
    for name, transform in [('wakhan_app', account_tree), ('wakhan_app_native_n1', native_tree)]:
        text = ast.unparse(transform((sources/(name+suffix)).read_text())) + '\n'
        if not review and 'REDACTED_FOR_SOURCE_REVIEW' in text:
            raise ValueError('REDACTED_REVIEW_FILE_IS_NOT_A_RELEASE_SOURCE')
        for token in ('aiogram', 'pyrogram', 'pytgcalls', "self.n['bot']", "self.n['TOKEN']", '/api/app/telegram/', 'tg://', 'https://t.me/'):
            if token in text:
                raise ValueError('MESSAGING_DEPENDENCY_REMAINS: '+name)
        compile(text, str(output/(name+'.py')), 'exec')
        (output/(name+'.py')).write_text(text)


if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent
    generate(root/'source/backend-review', root/'candidate/standalone', review=True)
    print('ACCOUNT_MIGRATION_REVIEW_CANDIDATE_READY; nothing installed')
