"""Read-only source/schema export for the real Home leaderboard integration."""
import ast, hashlib, json, os, re, sqlite3, subprocess, tempfile, zipfile
from pathlib import Path

SECRET = re.compile(r'password|passwd|secret|credential|private.?key|api.?hash|api.?key|token|session.?key|hmac.?key', re.I)
TOKEN = re.compile(r'\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|[0-9]{6,}:[A-Za-z0-9_-]{20,}|sk_(?:live|test)_[A-Za-z0-9_]{16,}|wka1\.[A-Za-z0-9_-]{24}\.[a-f0-9]{32}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b')

class Redact(ast.NodeTransformer):
    def visit_Constant(self, node):
        if isinstance(node.value, str):
            node.value = TOKEN.sub('REDACTED_FOR_REVIEW', node.value)
            if '-----BEGIN ' in node.value and 'PRIVATE KEY-----' in node.value:
                node.value = 'REDACTED_FOR_REVIEW'
        return node
    def visit_Assign(self, node):
        node = self.generic_visit(node)
        if any(SECRET.search(getattr(t, 'id', getattr(t, 'attr', ''))) for t in node.targets):
            if isinstance(node.value, ast.Constant) and isinstance(node.value.value, (str, bytes)):
                node.value = ast.copy_location(ast.Constant('REDACTED_FOR_REVIEW'), node.value)
        return node
    def visit_AnnAssign(self, node):
        node = self.generic_visit(node)
        name = getattr(node.target, 'id', getattr(node.target, 'attr', ''))
        if SECRET.search(name) and isinstance(node.value, ast.Constant) and isinstance(node.value.value, (str, bytes)):
            node.value = ast.copy_location(ast.Constant('REDACTED_FOR_REVIEW'), node.value)
        return node
    def visit_Call(self, node):
        node = self.generic_visit(node)
        if isinstance(node.func, ast.Attribute) and node.func.attr in ('get', 'getenv') and len(node.args)>1:
            key, value = node.args[:2]
            if isinstance(key, ast.Constant) and isinstance(key.value, str) and SECRET.search(key.value) and isinstance(value, ast.Constant) and isinstance(value.value, (str, bytes)):
                node.args[1] = ast.copy_location(ast.Constant('REDACTED_FOR_REVIEW'), value)
        for keyword in node.keywords:
            if keyword.arg and SECRET.search(keyword.arg) and isinstance(keyword.value, ast.Constant) and isinstance(keyword.value.value, (str, bytes)):
                keyword.value = ast.copy_location(ast.Constant('REDACTED_FOR_REVIEW'), keyword.value)
        return node
    def visit_Dict(self, node):
        node = self.generic_visit(node)
        for i, key in enumerate(node.keys):
            value = node.values[i]
            if isinstance(key, ast.Constant) and isinstance(key.value, str) and SECRET.search(key.value):
                if isinstance(value, ast.Constant) and isinstance(value.value, (str, bytes)):
                    node.values[i] = ast.copy_location(ast.Constant('REDACTED_FOR_REVIEW'), value)
        return node

def collect():
    result = subprocess.run(['systemctl', 'show', 'wakhan-app.service', '-p', 'WorkingDirectory', '--value'], capture_output=True, text=True, check=True)
    root = Path(result.stdout.strip())
    if not root.is_absolute() or not (root / 'native_runtime.py').is_file():
        raise SystemExit('CURRENT_BACKEND_NOT_FOUND')
    settings = json.loads((root / 'private/app.json').read_text())
    database = Path(settings['database'])
    report = {'backend_root': str(root), 'database': str(database), 'source_files': [], 'schema': {}, 'errors': [], 'client_projects': []}
    fd, output = tempfile.mkstemp(prefix='wakhan-home-live-review-', suffix='.zip', dir='/root')
    total = 0
    skip = {'private', 'data', 'uploads', 'sessions', 'cache', 'releases', 'node_modules', '.git', '.venv', 'venv', '__pycache__', 'backups'}
    with os.fdopen(fd, 'wb') as handle, zipfile.ZipFile(handle, 'w', zipfile.ZIP_DEFLATED) as z:
        for folder, dirs, names in os.walk(root, followlinks=False):
            base = Path(folder)
            dirs[:] = [d for d in dirs if d not in skip and not d.startswith('.') and not (base/d).is_symlink() and len(base.relative_to(root).parts)<3]
            for name in names:
                p = base/name
                if p.suffix!='.py' or p.is_symlink() or p.stat().st_size>2_000_000:
                    continue
                try:
                    raw = p.read_bytes()
                    tree = Redact().visit(ast.parse(raw))
                    ast.fix_missing_locations(tree)
                    review = '# REVIEW COPY ONLY; DO NOT DEPLOY. Literal credentials redacted.\n'+ast.unparse(tree)+'\n'
                    total += len(review.encode())
                    if total>16*1024*1024:
                        raise RuntimeError('REVIEW_SIZE_LIMIT')
                    rel = p.relative_to(root).as_posix()
                    z.writestr('backend-review/'+rel, review)
                    report['source_files'].append({'path':rel, 'original_sha256':hashlib.sha256(raw).hexdigest()})
                except (OSError, SyntaxError, UnicodeError) as e:
                    report['errors'].append({'file':p.relative_to(root).as_posix(), 'error':type(e).__name__})
        with sqlite3.connect(database.resolve().as_uri()+'?mode=ro', uri=True, timeout=10) as db:
            for (name,) in db.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%'"):
                if re.search(r'session|token|auth|secret|pair|login|credential', name, re.I):
                    continue
                quoted = '"'+name.replace('"','""')+'"'
                report['schema'][name] = [{'name':r[1], 'type':r[2], 'notnull':r[3], 'pk':r[5]} for r in db.execute('pragma table_info('+quoted+')')]
        apk = root/'releases/Wakhan.apk'
        if apk.is_file():
            with zipfile.ZipFile(apk) as installed:
                report['public_client'] = json.loads(installed.read('assets/public/wakhan-release.json'))
            report['public_apk_sha256'] = hashlib.sha256(apk.read_bytes()).hexdigest()
        for p in Path('/opt/wakhan-android').glob('wakhan-*/project/package.json'):
            try:
                package = json.loads(p.read_text())
                report['client_projects'].append({'path':str(p.parent), 'version':package.get('version'), 'build':package.get('wakhanBuild'), 'mtime':p.stat().st_mtime})
            except (OSError, ValueError):
                pass
        report['client_projects'] = sorted(report['client_projects'], key=lambda p:p['mtime'], reverse=True)[:5]
        z.writestr('REPORT.json', json.dumps(report, ensure_ascii=False, indent=2))
        z.writestr('README.txt', 'Read-only source/schema review. No database rows, .env files, private configuration, sessions or signing keys are included. Never deploy backend-review copies.\n')
    print('READY:', output)
    print('FILES:', len(report['source_files']))
    print('SHA256:', hashlib.sha256(Path(output).read_bytes()).hexdigest())

if __name__=='__main__':
    collect()
