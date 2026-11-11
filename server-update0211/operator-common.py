import base64
from datetime import datetime, timezone
import fcntl
import hashlib
import hmac
import importlib.util
import io
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
from urllib.request import Request, urlopen
import zipfile
OWNER = 8878966292

def require(value, code):
    if not value:
        raise RuntimeError(code)

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def atomic(path, data, mode=384):
    path = Path(path)
    temporary = path.with_name(path.name + '.0211-tmp')
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, mode)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())
    temporary.chmod(mode)
    temporary.replace(path)

def command(args, code='SYSTEM_COMMAND_FAILED', timeout=60, check=True, cwd=None):
    result = subprocess.run([str(x) for x in args], capture_output=True, text=True, timeout=timeout, cwd=cwd)
    if check:
        require(result.returncode == 0, code)
    return result

def active(name):
    return command(['systemctl', 'is-active', '--quiet', name], check=False).returncode == 0

def database_copy(source, target):
    begin = time.monotonic()

    def progress(*unused):
        require(time.monotonic() - begin < 60, 'DATABASE_SNAPSHOT_TIMEOUT')
    with sqlite3.connect(source.as_uri() + '?mode=ro', uri=True, timeout=10) as old, sqlite3.connect(target) as copy:
        old.backup(copy, pages=256, progress=progress, sleep=0.05)
        require(copy.execute('pragma quick_check').fetchone()[0] == 'ok', 'DATABASE_SNAPSHOT_INVALID')
    target.chmod(384)

def ledger_fingerprint(database):
    result = {}
    with sqlite3.connect(database.as_uri() + '?mode=ro', uri=True, timeout=10) as db:
        for table in ('wm_coin_accounts', 'wm_coin_ops'):
            if not db.execute("select 1 from sqlite_master where type='table' and name=?", (table,)).fetchone():
                continue
            count = len(db.execute('pragma table_info(' + table + ')').fetchall())
            digest = hashlib.sha256()
            for row in db.execute('select * from ' + table + ' order by ' + ','.join((str(i + 1) for i in range(count)))):
                digest.update(repr(row).encode())
            result[table] = digest.hexdigest()
    return result

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def owner_key(settings):
    key = Path(settings['session_key_file']).read_bytes()
    require(len(key) == 32, 'PRESERVED_SESSION_KEY_INVALID')
    with sqlite3.connect(Path(settings['database']).as_uri() + '?mode=ro', uri=True, timeout=10) as db:
        row = db.execute('select sid from wka_sessions where uid=? order by seen desc limit 1', (OWNER,)).fetchone()
    require(bool(row), 'OWNER_EXISTING_SESSION_NOT_FOUND')
    sid = row[0]
    return 'wka1.' + sid + '.' + hmac.new(key, sid.encode(), hashlib.sha256).hexdigest()[:32]

def live_get(path, key=None):
    request = Request('http://127.0.0.1:10010' + path, headers={'X-Init': key} if key else {})
    with urlopen(request, timeout=5) as response:
        return json.loads(response.read(1000000))

def unit_text(root, python):
    return '[Unit]\nDescription=Wakhan standalone application\nAfter=network-online.target\nWants=network-online.target\n[Service]\nUser=musicbot\nGroup=musicbot\nUMask=0077\nWorkingDirectory=' + str(root) + '\nExecStart=' + str(python) + ' ' + str(root / 'native_runtime.py') + ' --config ' + str(root / 'private/app.json') + '\nRestart=on-failure\nRestartSec=3\nTimeoutStopSec=25\nNoNewPrivileges=true\nPrivateTmp=true\n[Install]\nWantedBy=multi-user.target\n'
