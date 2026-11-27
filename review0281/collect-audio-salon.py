#!/usr/bin/env python3
"""Read-only audio/salon review. Never installs, restarts or changes configuration.

Only fixed Python source files and aggregate photo metadata are exported.
No database, private settings, mail credentials, photos or sessions enter the ZIP.
"""
import argparse
import ast
import collections
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import stat
import subprocess
import tempfile
import time
import urllib.request
import zipfile

APP = Path('/opt/wakhan-app-0.2.11-li9z037x')
SOURCES = (
    'wakhan_salon.py', 'wakhan_hall51.py', 'wakhan_room_tools.py', 'room_tools.py',
    'native_wakhan2.py', 'native_room_core.py', 'native_room_video.py',
    'wakhan_room_video_resolver.py', 'wakhan_home_rankings.py',
    'wakhan_media/api.py', 'wakhan_media/adapters.py', 'wakhan_media/delivery.py',
    'wakhan_media/salon_music.py', 'wakhan_music/audio_resolver.py',
    'wakhan_music/playback.py', 'native_runtime.py', 'wakhan_security.py',
)
PATTERNS = (
    rb'GOCSPX-[A-Za-z0-9_-]{20,}', rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})',
    rb'AIza[A-Za-z0-9_-]{35}', rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    rb'\b[0-9]{8,12}:[A-Za-z0-9_-]{35}\b', rb'wka1\.[A-Za-z0-9_-]{24}\.[a-f0-9]{32}',
)


def source_is_safe(raw):
    if any(re.search(p, raw) for p in PATTERNS):
        return False
    try:
        tree = ast.parse(raw)
    except (SyntaxError, ValueError):
        return False
    for node in ast.walk(tree):
        if isinstance(node, ast.Dict):
            for key, value in zip(node.keys, node.values):
                if isinstance(key, ast.Constant) and isinstance(key.value, str) and re.search(r'SECRET|PASSWORD|SMTP_PASS|API_KEY|SIGN_KEY|SESSION_KEY|PRIVATE_KEY|ACCESS_TOKEN', key.value, re.I):
                    if any(isinstance(v, ast.Constant) and isinstance(v.value, (str, bytes)) and len(v.value) >= 16 for v in ast.walk(value)):
                        return False
        if not isinstance(node, (ast.Assign, ast.AnnAssign)):
            continue
        targets = node.targets if isinstance(node, ast.Assign) else [node.target]
        for target in targets:
            label = target.id if isinstance(target, ast.Name) else target.attr if isinstance(target, ast.Attribute) else ''
            if label.upper().endswith(('_PATH', '_FILE', '_NAME', '_PREFIX', '_URL', '_ENV', '_KEYS')):
                continue
            if not re.search(r'SECRET|PASSWORD|SMTP_PASS|API_KEY|SIGN_KEY|SESSION_KEY|PRIVATE_KEY|ACCESS_TOKEN', label, re.I):
                continue
            if any(isinstance(v, ast.Constant) and isinstance(v.value, (str, bytes)) and len(v.value) >= 16 for v in ast.walk(node.value)):
                return False
    return True


def command(args):
    try:
        p = subprocess.run(args, stdin=subprocess.DEVNULL, capture_output=True, timeout=8, check=False)
        return p.returncode, p.stdout[:64000].decode('utf-8', 'replace')
    except (OSError, subprocess.TimeoutExpired):
        return None, ''


def metadata(path):
    try:
        s = path.stat()
        return {'exists': True, 'mode': format(stat.S_IMODE(s.st_mode), '04o'), 'owner_uid': s.st_uid,
                'group_gid': s.st_gid, 'directory': stat.S_ISDIR(s.st_mode), 'symlink': path.is_symlink()}
    except OSError:
        return {'exists': False}


def collect(root, output):
    facts = {'read_only': True, 'created_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
             'source': {}, 'photos': {}, 'database': {}, 'public_http': {}}
    rc, status = command(['systemctl', 'show', 'wakhan-app', '--property=User,Group,ActiveState,MainPID'])
    service = dict(line.split('=', 1) for line in status.splitlines() if '=' in line)
    facts['service'] = {k: service.get(k, '') for k in ('User', 'Group', 'ActiveState')}
    settings = {}
    try:
        pid = int(service.get('MainPID', '0'))
        if pid > 0:
            args = Path('/proc', str(pid), 'cmdline').read_bytes().decode().split('\0')
            if '--config' in args:
                path = Path(args[args.index('--config') + 1])
                if not path.is_absolute():
                    path = Path('/proc', str(pid), 'cwd').resolve() / path
                value = json.loads(path.read_text())
                # Discard all other settings immediately; never export config contents.
                settings = {k: value[k] for k in ('database', 'data') if isinstance(value.get(k), str)}
                del value
    except (OSError, ValueError, IndexError):
        pass
    folder = root / 'data' / 'wm51_halls'
    facts['photos']['directory'] = metadata(folder)
    payload = {}
    for name in SOURCES:
        path = root / name
        if path.is_symlink() or not path.is_file() or not path.resolve().is_relative_to(root.resolve()) or path.stat().st_size > 2_000_000:
            facts['source'][name] = {'included': False, 'reason': 'missing, linked or oversized'}
            continue
        raw = path.read_bytes()
        facts['source'][name] = {'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)}
        if not source_is_safe(raw):
            facts['source'][name].update(included=False, reason='source withheld by credential/syntax guard')
            continue
        payload['source/' + name] = raw
        facts['source'][name]['included'] = True
    database = Path(settings.get('database') or root / 'data' / 'music.db')
    if not database.is_absolute():
        database = root / database
    if database.is_file():
        con = None
        try:
            con = sqlite3.connect(database.resolve().as_uri() + '?mode=ro', uri=True, timeout=2)
            con.execute('PRAGMA query_only=ON')
            cols = {r[1] for r in con.execute('PRAGMA table_info(wm51_halls)')}
            if {'name', 'photo'} <= cols:
                rows = con.execute('SELECT name,photo FROM wm51_halls').fetchall()
                counts = collections.Counter()
                modes = collections.Counter()
                for name, key in rows:
                    counts['rows'] += 1
                    counts['named'] += bool(str(name or '').strip())
                    counts['with_photo'] += bool(key)
                    if not key:
                        continue
                    if not isinstance(key, str) or not re.fullmatch(r'[a-f0-9]{32}\.jpg', key):
                        counts['invalid_photo_keys'] += 1
                        continue
                    p = folder / key
                    if p.is_symlink() or not p.is_file():
                        counts['missing_photo_files'] += 1
                    else:
                        counts['existing_photo_files'] += 1
                        modes[format(stat.S_IMODE(p.stat().st_mode), '04o')] += 1
                facts['database'] = {'aggregate_only': True, 'salons': dict(counts)}
                facts['photos']['file_modes'] = dict(modes)
        except (OSError, sqlite3.Error):
            facts['database'] = {'aggregate_only': True, 'check_failed': True}
        finally:
            if con is not None:
                con.close()
    for path in ('/api/app/latest', '/api/app/config', '/s/wk2/salon/pamir.jpg', '/api/v51/hallphoto/' + '0' * 32 + '.jpg'):
        request = urllib.request.Request('https://music.kabulcafe.uk' + path,
            headers={'User-Agent': 'Wakhan-audio-salon-owner-review/1.0'})
        try:
            with urllib.request.urlopen(request, timeout=8) as response:
                info = {'status': response.status, 'content_type': response.headers.get('Content-Type', ''),
                        'cache_control': response.headers.get('Cache-Control', '')}
                if path == '/api/app/latest':
                    value = json.loads(response.read(8000))
                    info['release'] = {k: value.get(k) for k in ('version', 'build')}
                elif path == '/api/app/config':
                    value = json.loads(response.read(64000))
                    info['email_available'] = bool(value.get('email'))
                facts['public_http'][path] = info
        except Exception as e:
            facts['public_http'][path] = {'status': getattr(e, 'code', None), 'failed': True}
    payload['REVIEW.json'] = (json.dumps(facts, ensure_ascii=False, indent=2) + '\n').encode()
    output.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd, name = tempfile.mkstemp(prefix='wakhan-audio-salon-review-' + time.strftime('%Y%m%d-%H%M%S') + '-', suffix='.zip', dir=output)
    os.close(fd)
    result = Path(name)
    result.chmod(0o600)
    with zipfile.ZipFile(result, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, raw in payload.items():
            z.writestr(name, raw)
    return result, hashlib.sha256(result.read_bytes()).hexdigest()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=APP)
    parser.add_argument('--output-dir', type=Path, default=Path('/root'))
    args = parser.parse_args()
    if not args.root.is_dir():
        raise SystemExit('Application directory missing; nothing changed.')
    path, digest = collect(args.root, args.output_dir)
    print('بستهٔ بررسی:', path)
    print('SHA256:', digest)
    print('فقط گزارش ساخته شد؛ کد، تنظیمات، سرویس‌ها، SSH و VPN تغییر نکردند.')
    print('فایل ZIP را برای بررسی بفرستید؛ هیچ پسورد یا کدی لازم نیست.')
