"""Extract native web/media/room functions without executing legacy startup."""
import ast
import builtins
from pathlib import Path
import symtable

ROOTS = '''dbx dbq J auth _cache_init _cache_get _cache_put api_search api_stream
audio_file api_fav api_clear api_room_new api_room_check api_cin api_cinctl api_turn
api_cv_poll api_cv cin_sweep cache_clean api_yhist web_static'''.split()
IMPORTS = '''import asyncio, base64, hashlib, hmac, json, logging, os, random, re, sqlite3, subprocess, time
from aiohttp import web
import yt_dlp
'''
OVERRIDES = {
    'check_init': '''
def check_init(raw):
    if not isinstance(raw, str) or not re.fullmatch(r'wka1\\.[A-Za-z0-9_-]{24}\\.[a-f0-9]{32}', raw):
        return None
    return WM_APP.check_key(raw)
''',
    'api_turn': '''
@auth
async def api_turn(req):
    ice = [{'urls': ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478']}]
    secret, host = ENV.get('TURN_SECRET'), ENV.get('TURN_HOST')
    if secret and host:
        user = '%d:%s' % (int(time.time()) + 3600, req['u']['id'])
        credential = base64.b64encode(hmac.new(secret.encode(), user.encode(), hashlib.sha1).digest()).decode()
        port = ENV.get('TURN_PORT', '3478')
        urls = ['turn:%s:%s?transport=udp' % (host, port), 'turn:%s:%s?transport=tcp' % (host, port)]
        tls_host = ENV.get('TURN_TLS_HOST')
        if tls_host:
            urls.append('turns:%s:%s?transport=tcp' % (tls_host, ENV.get('TURN_TLS_PORT', '5349')))
        ice.append({'urls': urls, 'username': user, 'credential': credential})
    return J({'ok': True, 'ice': ice})
''',
}
OVERRIDES['cin_sweep'] = '''
async def cin_sweep():
    while True:
        await asyncio.sleep(15)
        now = time.time()
        for cid, room in list(CV.items()):
            gone = [uid for uid, member in room['m'].items() if now - member['t'] > 120]
            for uid in gone:
                room['m'].pop(uid, None)
                room['q'].pop(uid, None)
            if gone:
                cvbump(room, cid)
        for cinema in list(CIN.values()):
            changed = False
            voice = CV.get(cinema.get('cid'))
            for index, seat in enumerate(cinema['seats']):
                if not seat:
                    continue
                uid = seat['id']
                member = voice['m'].get(uid) if voice else None
                # A healthy voice poll is authenticated activity even when the
                # cinema page's own polling is suspended in the background.
                last = max(cinema['seen'].get(uid, 0), member['t'] if member else 0)
                grace = 120 if member else 50
                if now - last > grace:
                    cinema['seats'][index] = None
                    if voice and voice['m'].pop(uid, None):
                        voice['q'].pop(uid, None)
                        cvbump(voice)
                    changed = True
            if changed:
                if not any(cinema['seats']):
                    cinema['t'] = cpos(cinema)
                    cinema['playing'] = False
                cbump(cinema)
'''
FORBIDDEN = {'bot','dp','router','TOKEN','ME','AS','app','call','KM','KB','Client','PyTgCalls'}
PROVIDED = set('''BASE DATA CACHE WEB ENV OWNER PORT MAXDUR LONG DB log WM_APP
WM_CINEMA WM_EXPERIENCE WM_PERSONAL WM_PERSONAL_PROTECTED WM_SYNC
my_groups WM_HOME WM_ACCESS WM_IDENTITY WM_FINANCE'''.split())


def generate(source, output):
    tree=ast.parse(source)
    definitions={node.name:node for node in tree.body if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef,ast.ClassDef))}
    assignments={}
    for node in tree.body:
        if isinstance(node,ast.Assign):
            for target in node.targets:
                if isinstance(target,ast.Name):assignments[target.id]=node
    for name,code in OVERRIDES.items():definitions[name]=ast.parse(code).body[0]
    selected=set();todo=list(ROOTS)
    while todo:
        name=todo.pop()
        if name in selected:continue
        selected.add(name)
        for node in ast.walk(definitions[name]):
            if isinstance(node,ast.Name) and isinstance(node.ctx,ast.Load) and node.id in definitions and node.id not in selected:
                todo.append(node.id)
    for name in selected:
        refs={n.id for n in ast.walk(definitions[name]) if isinstance(n,ast.Name) and isinstance(n.ctx,ast.Load)}
        if refs&FORBIDDEN:
            raise ValueError('UNPORTED_CORE_DEPENDENCY: '+name+':'+','.join(sorted(refs&FORBIDDEN)))
    used_assign={'YCAT'}
    for name in selected:
        for node in ast.walk(definitions[name]):
            if isinstance(node,ast.Name) and isinstance(node.ctx,ast.Load) and node.id in assignments and node.id not in PROVIDED:
                used_assign.add(node.id)
    changed=True
    while changed:
        changed=False
        for name in list(used_assign):
            for node in ast.walk(assignments[name]):
                if isinstance(node,ast.Name) and isinstance(node.ctx,ast.Load) and node.id in assignments and node.id not in used_assign and node.id not in PROVIDED:
                    used_assign.add(node.id);changed=True
    nodes=ast.parse(IMPORTS).body
    # Constants/cache dictionaries precede functions; original function order preserves decorators.
    nodes += [node for node in tree.body if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id in used_assign for t in node.targets)]
    for node in tree.body:
        if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef,ast.ClassDef)) and node.name in selected:
            nodes.append(definitions[node.name])
    text=ast.unparse(ast.Module(body=nodes,type_ignores=[]))+'\n'
    if 'REDACTED_FOR_SOURCE_REVIEW' in text:
        raise ValueError('UNREPLACED_REVIEW_REDACTION')
    symbols=symtable.symtable(text,'app-core','exec')
    globals_=set()
    def walk(table):
        for symbol in table.get_symbols():
            if symbol.is_global() and symbol.is_referenced():globals_.add(symbol.get_name())
        for child in table.get_children():walk(child)
    walk(symbols)
    defined={s.get_name() for s in symbols.get_symbols() if s.is_assigned() or s.is_imported()}
    missing=globals_-defined-PROVIDED-set(dir(builtins))
    if missing:raise ValueError('UNRESOLVED_CORE_GLOBALS: '+','.join(sorted(missing)))
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(text)
    return {'functions':len(selected),'state':sorted(used_assign)}


if __name__=='__main__':
    root=Path(__file__).resolve().parent.parent
    print(generate((root/'source/backend-review/bot.review.py').read_text(),root/'candidate/standalone/app_core.py'))
