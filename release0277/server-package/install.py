#!/usr/bin/env python3
"""Owner-operated Wakhan 0.2.77 update. Default is read-only preflight.

--apply signs Android with the existing local key, backs up code/SQLite/APK,
updates only the manifest's Wakhan files and restarts only wakhan-app.
--rollback BACKUP restores code and published files, NEVER rewinds user data.
No private configuration, database or key is included in the result ZIP.
"""
import argparse
import ast
import contextlib
import hashlib
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import signal
import sqlite3
import stat
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import zipfile

APP = Path('/opt/wakhan-app-0.2.11-li9z037x')
KEYS = Path('/opt/wakhan-android/keys/release.properties')
SERVICE = 'wakhan-app'
ROOT = Path(__file__).resolve().parent
VERSION, BUILD = '0.2.77-beta', 92


def require(ok, code):
    if not ok:
        raise RuntimeError(code)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(args, **kwargs):
    result = subprocess.run([str(v) for v in args], capture_output=True, timeout=kwargs.pop('timeout', 60), **kwargs)
    require(result.returncode == 0, 'COMMAND_FAILED:' + Path(str(args[0])).name)
    return result.stdout.decode('utf-8', 'replace')


def regular(path, maximum=32_000_000):
    require(path.is_file() and not path.is_symlink(), 'FILE_MISSING_OR_LINK:' + path.name)
    require(path.stat().st_size <= maximum, 'FILE_TOO_LARGE:' + path.name)


def atomic(path, raw, uid, gid, mode):
    fd, name = tempfile.mkstemp(prefix='.wk277-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(raw); f.flush(); os.fsync(f.fileno())
        os.chown(name, uid, gid); os.chmod(name, mode)
        os.replace(name, path)
        dirfd = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try: os.fsync(dirfd)
        finally: os.close(dirfd)
    finally:
        with contextlib.suppress(FileNotFoundError): os.unlink(name)


def trusted_directory(path, owner):
    require(path.is_dir() and path.stat().st_uid in (0, owner) and not path.stat().st_mode & 0o022,
            'UNTRUSTED_DIRECTORY:' + path.name)
    return path.resolve()


def validate_payload(root, app, manifest):
    for name, item in manifest['files'].items():
        rel = Path(name)
        require(not rel.is_absolute() and '..' not in rel.parts and len(rel.parts) <= 2, 'BAD_PAYLOAD_PATH')
        src = root / 'backend' / rel
        regular(src, 2_000_000)
        require(sha(src) == item['sha256'], 'PAYLOAD_CHANGED:' + name)
        ast.parse(src.read_text(), filename=name)
        dst = app / rel
        require(not dst.parent.is_symlink() and dst.parent.resolve().is_relative_to(app.resolve()), 'SOURCE_DIRECTORY_LINK:' + name)
        if dst.exists() or dst.is_symlink():
            regular(dst, 2_000_000)
            require(sha(dst) in {item['sha256'], item.get('before')}, 'CURRENT_SOURCE_CHANGED:' + name)
        else:
            require(item.get('before') is None, 'CURRENT_SOURCE_MISSING:' + name)
    for name, digest in manifest.get('unchanged', {}).items():
        regular(app / name, 2_000_000)
        require(sha(app / name) == digest, 'CURRENT_CONTRACT_CHANGED:' + name)


def context(app):
    require(run(['systemctl', 'is-active', SERVICE]).strip() == 'active', 'WAKHAN_NOT_ACTIVE')
    pid = int(run(['systemctl', 'show', SERVICE, '--property=MainPID', '--value']).strip())
    require(pid > 1, 'SERVICE_PID_MISSING')
    user = run(['systemctl', 'show', SERVICE, '--property=User', '--value']).strip()
    require(user == 'musicbot', 'UNREVIEWED_SERVICE_USER')
    owner = pwd.getpwnam(user)
    args = [v.decode() for v in Path(f'/proc/{pid}/cmdline').read_bytes().split(b'\0') if v]
    require(len(args) >= 4 and '--config' in args and 'python' in Path(args[0]).name, 'UNREVIEWED_SERVICE_COMMAND')
    cwd = Path(f'/proc/{pid}/cwd').resolve()
    runtime = next((Path(v) for v in args[1:] if v.endswith('native_runtime.py')), None)
    require(runtime is not None and (cwd / runtime).resolve() == app / 'native_runtime.py', 'UNREVIEWED_RUNTIME_PATH')
    config_path = cwd / args[args.index('--config') + 1]
    regular(config_path, 2_000_000)
    config = json.loads(config_path.read_text())
    require(Path(config['base']).resolve() == app and int(config.get('port', 10010)) == 10010, 'CONFIG_BASE_OR_PORT_CHANGED')
    database = Path(config['database'])
    regular(database, 32 * 1024**3)
    require(database.samefile(app / 'data/music.db'), 'UNREVIEWED_DATABASE_PATH')
    require(database.stat().st_uid == owner.pw_uid and database.stat().st_mode & 0o777 == 0o600, 'DATABASE_PERMISSION_NOT_600')
    key = Path(config['session_key_file'])
    regular(key, 32)
    require(key.stat().st_size == 32, 'SESSION_KEY_INVALID')
    env = {}
    for value in Path(f'/proc/{pid}/environ').read_bytes().split(b'\0'):
        if b'=' in value:
            k, v = value.split(b'=', 1); env[os.fsdecode(k)] = os.fsdecode(v)
    # Keep the service interpreter spelling: resolving its venv symlink loses the venv.
    interpreter = str(cwd / args[0]) if not Path(args[0]).is_absolute() else args[0]
    run([interpreter, '-c', 'import aiohttp,cryptography,yt_dlp;from cryptography.hazmat.primitives.asymmetric import rsa'], env=env, cwd=app, timeout=20)
    for cmd in ('ffmpeg', 'ffprobe'):
        require(shutil.which(cmd, path=env.get('PATH')), 'DEPENDENCY_MISSING:' + cmd)
    return owner, database


def build_tools():
    candidates = []
    for base in ('/opt/android-sdk/build-tools', '/opt/android-sdk-linux/build-tools', '/usr/lib/android-sdk/build-tools'):
        path = Path(base)
        if path.is_dir():
            candidates.extend(p for p in path.iterdir() if re.fullmatch(r'\d+\.\d+\.\d+', p.name))
    candidates.sort(key=lambda p: tuple(map(int, p.name.split('.'))), reverse=True)
    for p in candidates:
        if all(os.access(p / cmd, os.X_OK) for cmd in ('apksigner', 'zipalign')):
            return p
    raise RuntimeError('ANDROID_BUILD_TOOLS_MISSING')


def certificate(tool, apk):
    text = run([tool / 'apksigner', 'verify', '--print-certs', apk])
    values = re.findall(r'^Signer #\d+ certificate SHA-256 digest: ([0-9a-fA-F]{64})$', text, re.M)
    require(len(values) == 1, 'ANDROID_CERTIFICATE_UNVERIFIED')
    return values[0].lower()


def properties(path):
    regular(path, 65536)
    out = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith(('#', '!')): continue
        m = re.match(r'([^=:\s]+)\s*[=:]\s*(.*)', line)
        if m: out[m[1].lower()] = m[2].strip()
    def get(name):
        matches = [v for k, v in out.items() if k == name.lower() or k.endswith('.' + name.lower())]
        require(len(matches) <= 1, 'AMBIGUOUS_SIGNING_PROPERTY')
        return matches[0] if matches else ''
    return get


def sign_android(root, releases, work, manifest):
    source = root / 'Wakhan-0.2.77-unsigned.apk'
    regular(source, 150_000_000)
    require(sha(source) == manifest['android_sha256'], 'ANDROID_SHA_MISMATCH')
    tool = build_tools()
    original = releases / 'Wakhan.apk'
    regular(original, 150_000_000)
    expected_cert = certificate(tool, original)
    get = properties(KEYS)
    store, sp, alias = get('storeFile'), get('storePassword'), get('keyAlias')
    kp = get('keyPassword') or sp
    require(store and sp, 'SIGNING_PROPERTIES_INCOMPLETE')
    store = KEYS.parent / store
    regular(store, 2_000_000)
    env = dict(os.environ, WK277_SP=sp, WK277_KP=kp)
    aligned, signed = work / 'aligned.apk', work / 'Wakhan-0.2.77.apk'
    run([tool / 'zipalign', '-f', '-P', '16', '4', source, aligned])
    command = [tool / 'apksigner', 'sign', '--ks', store, '--ks-pass', 'env:WK277_SP', '--key-pass', 'env:WK277_KP', '--out', signed]
    if alias: command.extend(['--ks-key-alias', alias])
    run(command + [aligned], env=env, timeout=120)
    require(certificate(tool, signed) == expected_cert, 'ANDROID_CERTIFICATE_CHANGED')
    run([tool / 'zipalign', '-c', '-P', '16', '4', signed])
    return signed


def snapshot(paths, backup):
    records = {}
    for name, path in paths.items():
        if path.exists() or path.is_symlink():
            regular(path, 150_000_000)
            st = path.stat(); saved = backup / 'files' / name
            saved.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            saved.write_bytes(path.read_bytes()); saved.chmod(0o600)
            records[name] = dict(existed=True, uid=st.st_uid, gid=st.st_gid, mode=stat.S_IMODE(st.st_mode), sha256=sha(saved))
        else:
            records[name] = dict(existed=False)
    (backup / 'restore.json').write_text(json.dumps(records, indent=2) + '\n')
    return records


def restore(paths, backup):
    records = json.loads((backup / 'restore.json').read_text())
    for name, item in records.items():
        path = paths[name]
        if item['existed']:
            source = backup / 'files' / name
            require(sha(source) == item['sha256'], 'BACKUP_CHANGED:' + name)
            atomic(path, source.read_bytes(), item['uid'], item['gid'], item['mode'])
        else:
            path.unlink(missing_ok=True)
    clear_bytecode(paths)


def clear_bytecode(paths):
    for name, path in paths.items():
        if not name.endswith('.py'): continue
        cache = path.parent / '__pycache__'
        require(not cache.is_symlink(), 'BYTECODE_DIRECTORY_LINK')
        if cache.is_dir():
            for p in cache.glob(path.stem + '.*.pyc'):
                require(not p.is_symlink(), 'BYTECODE_LINK')
                p.unlink()


def backup_database(database, backup):
    target = backup / 'database.sqlite3'
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600); os.close(fd)
    deadline = time.monotonic() + 45
    def progress(status, remaining, total):
        require(time.monotonic() < deadline, 'DATABASE_BACKUP_TIMEOUT')
    with sqlite3.connect(database.as_uri() + '?mode=ro', uri=True, timeout=5) as src, sqlite3.connect(target) as dst:
        src.backup(dst, pages=128, progress=progress)
        require(dst.execute('pragma quick_check').fetchone()[0] == 'ok', 'DATABASE_BACKUP_INVALID')


def health(updated):
    base = 'http://127.0.0.1:10010'
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    def get(path):
        try:
            with opener.open(base + path, timeout=3) as res: return res.status, res.read(65536)
        except urllib.error.HTTPError as exc: return exc.code, exc.read(65536)
    last = None
    for _ in range(20):
        try:
            status, raw = get('/health')
            require(status == 200 and json.loads(raw).get('ok'), 'HEALTH_FAILED')
            if updated:
                status, raw = get('/api/app/signin/config')
                require(status == 200 and json.loads(raw).get('signin', {}).get('version') == 1, 'SIGNIN_ROUTES_MISSING')
                status, raw = get('/api/app/music/audio-start?id=invalid')
                require(status in (401, 403), 'MUSIC_AUTH_ROUTE_MISSING')
            return
        except Exception as exc: last = exc; time.sleep(1)
    raise RuntimeError('HEALTH_CHECK_FAILED') from last


def paths_for(app, releases, manifest):
    result = {name: app / name for name in manifest['files']}
    result.update({'releases/Wakhan.apk': releases / 'Wakhan.apk', 'releases/latest.json': releases / 'latest.json'})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument('--apply', action='store_true')
    modes.add_argument('--rollback', type=Path)
    args = parser.parse_args()
    require(os.geteuid() == 0, 'RUN_AS_ROOT')
    os.umask(0o077)
    app = APP.resolve()
    require(APP.is_dir() and not APP.is_symlink(), 'APPLICATION_DIRECTORY_CHANGED')
    owner = pwd.getpwnam('musicbot')
    trusted_directory(app, owner.pw_uid)
    releases = trusted_directory(app / 'releases', owner.pw_uid)
    manifest = json.loads((ROOT / 'MANIFEST.json').read_text())
    require(manifest['version'] == VERSION and manifest['build'] == BUILD, 'MANIFEST_VERSION_CHANGED')
    paths = paths_for(app, releases, manifest)
    if args.rollback:
        backup = args.rollback.resolve()
        require(backup.parent == Path('/root') and backup.name.startswith('wakhan-0277-backup-') and backup.stat().st_uid == 0 and not backup.stat().st_mode & 0o077, 'INVALID_BACKUP_DIRECTORY')
        require(json.loads((backup / 'deployment.json').read_text())['manifest_sha256'] == sha(ROOT / 'MANIFEST.json'), 'BACKUP_RELEASE_MISMATCH')
        run(['systemctl', 'stop', SERVICE]); restore(paths, backup); run(['systemctl', 'start', SERVICE]); health(False)
        print('کد و فایل نصب قبلی برگشت؛ دیتابیس و پیام‌های تازه حفظ شدند.'); return
    validate_payload(ROOT, app, manifest)
    for path in paths.values():
        trusted_directory(path.parent, owner.pw_uid)
    if (releases / 'latest.json').exists():
        regular(releases / 'latest.json', 65536)
        require(int(json.loads((releases / 'latest.json').read_text()).get('build', 0)) <= BUILD, 'NEWER_APP_ALREADY_PUBLISHED')
    owner, database = context(app)
    health(False)
    apk = ROOT / 'Wakhan-0.2.77-unsigned.apk'
    regular(apk, 150_000_000)
    require(sha(apk) == manifest['android_sha256'], 'ANDROID_SHA_MISMATCH')
    regular(KEYS, 65536); build_tools()
    require(shutil.disk_usage(app).free > database.stat().st_size * 2 + 1024**3 and shutil.disk_usage('/root').free > database.stat().st_size * 2 + 512*1024**2, 'BACKUP_DISK_SPACE_LOW')
    print('بررسی سورس، دیتابیس، وابستگی‌ها و سلامت سرویس موفق بود.')
    if not args.apply:
        print('فقط بررسی شد؛ هیچ فایلی تغییر نکرد. برای نصب: python3 install.py --apply'); return
    with tempfile.TemporaryDirectory(prefix='wakhan-0277-sign-', dir='/root') as tmp:
        signed = sign_android(ROOT, releases, Path(tmp), manifest)
        print('امضای اندروید با گواهی نسخهٔ فعلی برابر است.')
        # Repeat the live hashes after signing and immediately before stopping.
        validate_payload(ROOT, app, manifest)
        backup = Path(tempfile.mkdtemp(prefix='wakhan-0277-backup-', dir='/root'))
        (backup / 'deployment.json').write_text(json.dumps({'version':VERSION,'build':BUILD,'manifest_sha256':sha(ROOT/'MANIFEST.json')}))
        records = snapshot(paths, backup)
        stopped = False
        try:
            stopped = True
            run(['systemctl', 'stop', SERVICE])
            validate_payload(ROOT, app, manifest)
            backup_database(database.resolve(), backup)
            for name in manifest['files']:
                dst = paths[name]
                old = records[name]
                atomic(dst, (ROOT / 'backend' / name).read_bytes(), old.get('uid', owner.pw_uid), old.get('gid', owner.pw_gid), old.get('mode', 0o640))
            clear_bytecode(paths)
            run(['systemctl', 'start', SERVICE]); health(True)
            existing = records['releases/Wakhan.apk']
            atomic(paths['releases/Wakhan.apk'], signed.read_bytes(), existing['uid'], existing['gid'], existing['mode'])
            latest = json.loads(paths['releases/latest.json'].read_text()) if records['releases/latest.json']['existed'] else {}
            latest.update(version=VERSION, build=BUILD, sha256=sha(signed), url='https://music.kabulcafe.uk/download/Wakhan.apk?build=92')
            old = records['releases/latest.json']
            atomic(paths['releases/latest.json'], (json.dumps(latest,indent=2)+'\n').encode(), old.get('uid',owner.pw_uid), old.get('gid',owner.pw_gid), old.get('mode',0o644))
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            with opener.open('http://127.0.0.1:10010/download/Wakhan.apk', timeout=20) as response:
                h = hashlib.sha256()
                while chunk := response.read(128*1024): h.update(chunk)
                require(h.hexdigest() == sha(signed), 'PUBLISHED_APK_MISMATCH')
            with opener.open('http://127.0.0.1:10010/api/app/latest', timeout=5) as response:
                require(json.load(response).get('build') == BUILD, 'LATEST_BUILD_MISMATCH')
        except BaseException:
            if stopped:
                run(['systemctl', 'stop', SERVICE])
                restore(paths, backup)
                run(['systemctl', 'start', SERVICE]); health(False)
                print('تغییر کد و فایل نصب برگشت؛ دیتابیس بازگردانی نشد تا دادهٔ تازه از بین نرود.')
            raise
        report = dict(version=VERSION, build=BUILD, success=True, android_signed=True, android_sha256=sha(signed), backup=str(backup), device_verified=False, database_restored=False, touched_services=[SERVICE])
        result = Path('/root/wakhan-0277-result.zip')
        with zipfile.ZipFile(result,'w',zipfile.ZIP_DEFLATED) as z:
            z.writestr('RESULT.json',json.dumps(report,indent=2)+'\n')
            z.write(signed,'Wakhan-0.2.77.apk')
        os.chmod(result,0o600)
        print('نصب موفق: 0.2.77-beta / build92')
        print('اندروید: https://music.kabulcafe.uk/download/Wakhan.apk?build=92')
        print('پشتیبان خصوصی: ' + str(backup))
        print('گزارش و APK امضاشده: ' + str(result))
        print('برگشت کد بدون حذف داده: python3 ' + str(ROOT/'install.py') + ' --rollback ' + str(backup))


if __name__ == '__main__':
    def interrupted(signum, frame): raise KeyboardInterrupt()
    signal.signal(signal.SIGTERM, interrupted)
    print('\033[1;30;43m ▼▼▼ خروجی از اینجا ▼▼▼ \033[0m', flush=True)
    try:
        main()
    except BaseException as exc:
        # Exception text only from fixed internal codes, never subprocess logs/config.
        print('STOP: ' + (str(exc) if type(exc) is RuntimeError else type(exc).__name__), flush=True)
        sys.exit(1)
    finally:
        print('\033[1;30;43m ▲▲▲ تا اینجا ▲▲▲ \033[0m', flush=True)
