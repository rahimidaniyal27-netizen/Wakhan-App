"""Port app-facing modules, with no legacy messaging startup or SDK imports."""
import ast
from pathlib import Path
from upgrade_chat import upgrade_community,upgrade_media,upgrade_push

ROOTS={
 'Community':{'__init__','routes','install'},
 'Hall51':{'__init__','install'},
 'Identity':{'__init__','personal','profile','api_profile'},
 'Frames':{'__init__','api'},
}
REPLACEMENTS={
 ('Community','roles'):'''
async def roles(self,uid):
    return self.display_roles(uid)
''',
 ('Community','display_roles'):'''
def display_roles(self,uid):
    roles=self.base_roles(uid)
    if roles and roles[0] in ('creator','assistant'):return roles
    try:
        hall=self.db.execute('select 1 from wm51_halls where uid=?',(uid,)).fetchone()
        if hall:roles.insert(0,'owner')
    except Exception:pass
    return roles
''',
 ('Hall51','install'):'''
def install(self):
    self.init();self.enforce();self.fast_web()
    community=self.n['WM_COMMUNITY70'];old_routes=community.routes
    def routes(app):
        old_routes(app);self.routes(app)
    community.routes=routes
''',
 ('Identity','profile'):'''
async def profile(self,uid,context=None):
    uid=int(uid);now=int(time.time())
    if uid==self.n['OWNER']:
        primary=self.badge('creator',100)
    else:
        primary=self.personal(uid) or self.badge('member',10)
    return {'primary':primary,'secondary':None,'server_now':now}
''',
}
PURE=('wakhan_community_catalog_v70','wakhan_profile_compat_v77','wakhan_library_v60',
 'wakhan_audio_player_v60','wakhan_audio_v17','wakhan_experience_v9','wakhan_home_v16',
 'wakhan_cinema_v12','wakhan_chatmedia','wakhan_push','wakhan_youtube_v39','wakhan_legal')
CLASSES={'wakhan_community_v70':'Community','wakhan_hall51':'Hall51','wakhan_identity_v7':'Identity','wakhan_frames_v24':'Frames'}
BLOCKED=('aiogram','pyrogram','pytgcalls',"self.n['bot']","self.n['router']","self.n['ME']",'tg://','https://t.me/')


def selected_tree(source,clsname):
    tree=ast.parse(source)
    if clsname=='Community':tree=upgrade_community(tree)
    cls=next(node for node in tree.body if isinstance(node,ast.ClassDef) and node.name==clsname)
    methods={node.name:ast.parse(REPLACEMENTS[(clsname,node.name)]).body[0] if (clsname,node.name) in REPLACEMENTS else node for node in cls.body if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef))}
    selected=set();todo=list(ROOTS[clsname])
    while todo:
        name=todo.pop()
        if name in selected:continue
        selected.add(name)
        for node in ast.walk(methods[name]):
            if isinstance(node,ast.Attribute) and isinstance(node.value,ast.Name) and node.value.id in ('self',clsname) and node.attr in methods and node.attr not in selected:todo.append(node.attr)
    cls.body=[methods[node.name] if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)) else node for node in cls.body if not isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)) or node.name in selected]
    if clsname=='Community':
        method=methods['public']
        for node in ast.walk(method):
            if isinstance(node,ast.Dict) and any(isinstance(k,ast.Constant) and k.value=='avatar' for k in node.keys):
                node.keys.append(ast.Constant('public_id'))
                node.values.append(ast.parse("self.n['WM_PUBLIC_IDS'].get(uid)",mode='eval').body)
    ast.fix_missing_locations(tree)
    return tree


def generate(sources,output,review=False):
    output.mkdir(parents=True,exist_ok=True)
    owned=(Path(__file__).parent/'room_tools.py').read_text()
    compile(owned,str(output/'wakhan_room_tools.py'),'exec')
    (output/'wakhan_room_tools.py').write_text(owned)
    suffix='.review.py' if review else '.py'
    for name in (*PURE,*CLASSES,'wakhan_resolver_v43'):
        text=(sources/(name+suffix)).read_text()
        tree=selected_tree(text,CLASSES[name]) if name in CLASSES else ast.parse(text)
        if name=='wakhan_chatmedia':tree=upgrade_media(tree)
        if name=='wakhan_push':tree=upgrade_push(tree)
        if name=='wakhan_resolver_v43':
            class CorePath(ast.NodeTransformer):
                def visit_Constant(self,node):
                    if node.value=='bot.py':return ast.copy_location(ast.Constant('app_core.py'),node)
                    return node
            tree=CorePath().visit(tree)
        text=ast.unparse(tree)+'\n'
        for token in BLOCKED:
            if token in text:raise ValueError('UNPORTED_NATIVE_MODULE: '+name+':'+token)
        if not review and 'REDACTED_FOR_SOURCE_REVIEW' in text:raise ValueError('REDACTED_REVIEW_FILE_IS_NOT_A_RELEASE_SOURCE')
        compile(text,str(output/(name+'.py')),'exec')
        (output/(name+'.py')).write_text(text)


if __name__=='__main__':
    root=Path(__file__).resolve().parent.parent
    generate(root/'source/backend-review',root/'candidate/standalone',review=True)
    print('NATIVE_MODULES_READY')
