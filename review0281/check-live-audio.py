#!/usr/bin/env python3
"""Owner-side sound diagnosis, without deployment or service/configuration changes.

Reuses only the configured owner's EXISTING login session to make ordinary GET
requests. Never creates an account/session, signs in as another user, changes the
queue or exports keys/tokens/URLs. FFmpeg decodes five seconds per selected source.
"""
import argparse
import base64
import hashlib
import hmac
import json
import math
import os
from pathlib import Path
import pwd
import re
import shutil
import sqlite3
import stat
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

APP = Path('/opt/wakhan-app-0.2.11-li9z037x')
PIN = '98a4d336d5d8912f830d8522bd0a1330201b04701a2d4aa2fd9ee7a4b383fa00'


def require(value, code):
    if not value:
        raise RuntimeError(code)


def context(root):
    require(os.geteuid() == 0, 'RUN_AS_OWNER_ROOT')
    require(hashlib.sha256((root / 'wakhan_app.py').read_bytes()).hexdigest() == PIN, 'ACCOUNT_SOURCE_CHANGED')
    pid = int(subprocess.run(['systemctl', 'show', 'wakhan-app', '--property=MainPID', '--value'],
        capture_output=True, text=True, check=True, timeout=8).stdout.strip())
    require(pid > 0, 'SERVICE_NOT_RUNNING')
    proc = Path('/proc') / str(pid)
    args = (proc / 'cmdline').read_bytes().decode().split('\0')
    require('--config' in args, 'CONFIG_LOCATION_UNAVAILABLE')
    path = Path(args[args.index('--config') + 1])
    if not path.is_absolute():
        path = (proc / 'cwd').resolve() / path
    settings = json.loads(path.read_text())
    owner, port = int(settings['owner']), int(settings.get('port', 10010))
    require(1024 <= port <= 65535, 'INVALID_APP_PORT')
    database = Path(settings['database'])
    if not database.is_absolute():
        database = (proc / 'cwd').resolve() / database
    with sqlite3.connect(database.resolve().as_uri() + '?mode=ro', uri=True, timeout=2) as db:
        db.execute('PRAGMA query_only=ON')
        row = db.execute('SELECT done,blocked FROM wka_accounts WHERE uid=?', (owner,)).fetchone()
        require(row and row[0] and not row[1], 'OWNER_ACCOUNT_NOT_READY')
        row = db.execute('SELECT sid,seen FROM wka_sessions WHERE uid=? ORDER BY seen DESC LIMIT 1', (owner,)).fetchone()
        require(row and re.fullmatch(r'[A-Za-z0-9_-]{24}', str(row[0])) and time.time() - row[1] < 180 * 86400,
                'OPEN_WAKHAN_WITH_OWNER_ACCOUNT_FIRST')
        sid = row[0]
    key_path = Path(settings['session_key_file'])
    if not key_path.is_absolute():
        key_path = (proc / 'cwd').resolve() / key_path
    fd = os.open(key_path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        st = os.fstat(fd)
        require(stat.S_ISREG(st.st_mode) and not st.st_mode & 0o077, 'PRIVATE_KEY_PERMISSIONS')
        key = os.read(fd, 33)
        require(len(key) == 32, 'PRIVATE_KEY_SIZE')
    finally:
        os.close(fd)
    token = 'wka1.' + sid + '.' + hmac.new(key, sid.encode(), hashlib.sha256).hexdigest()[:32]
    return 'http://127.0.0.1:' + str(port), token


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def api(base, token, path, timeout=18):
    require(path.startswith('/api/') and '\r' not in path and '\n' not in path, 'INVALID_API_PATH')
    req = urllib.request.Request(base + path, headers={'X-Init': token, 'User-Agent': 'Wakhan-owner-sound-check/1.0'})
    try:
        with urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect).open(req, timeout=timeout) as response:
            raw = response.read(2_000_001)
            require(len(raw) <= 2_000_000, 'API_RESPONSE_SIZE')
            return response.status, json.loads(raw)
    except urllib.error.HTTPError as error:
        # Do not export response bodies, which could contain account information.
        return error.code, {}
    except Exception:
        return None, {}


def playable(raw, base):
    require(isinstance(raw, str) and len(raw) < 16000 and not any(c in raw for c in "\r\n\\'"), 'INVALID_MEDIA_URL')
    u = urllib.parse.urlsplit(urllib.parse.urljoin('https://music.kabulcafe.uk', raw))
    require(not u.username and not u.password and not u.fragment and u.port in (None, 443), 'INVALID_MEDIA_URL')
    if u.hostname == 'music.kabulcafe.uk':
        require(u.scheme == 'https' and
            (re.fullmatch(r'/api/app/music/play/[a-f0-9]{32}/(?:audio\.(?:mp3|m4a)|index\.m3u8)', u.path)
             or re.fullmatch(r'/api/app/rooms/[A-Za-z0-9_-]{1,64}/video', u.path)
             or re.fullmatch(r'/(?:a|api/app/music/media)/[A-Za-z0-9_-][A-Za-z0-9_.-]*', u.path)) and
             urllib.parse.parse_qs(u.query).get('lease'), 'INVALID_LEASED_MEDIA')
        # The same app handler and CDN relay, without the public reverse proxy.
        return base + u.path + '?' + u.query
    require(u.scheme == 'https' and
        ((u.hostname == 'archive.org' and re.fullmatch(r'/download/[A-Za-z0-9_.-]{1,180}/.+\.mp3', u.path, re.I) and not u.query)
         or (u.hostname == 'api.audius.co' and re.fullmatch(r'/v1/tracks/[A-Za-z0-9]{1,30}/stream', u.path) and u.query == 'app_name=Wakhan')
         or (u.hostname == 'ccmixter.org' and re.fullmatch(r'/content/[^/]+/[^/]+\.mp3', u.path, re.I) and not u.query)), 'UNREVIEWED_SOURCE')
    return u.geturl()


def diagnose(url, timeout=22):
    # The lease stays in stdin, never in the process command line or report.
    hls = urllib.parse.urlsplit(url).path.endswith('.m3u8')
    content = ('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=256000\n' + url + '\n') if hls else ("ffconcat version 1.0\nfile '" + url + "'\n")
    args = ['ffmpeg', '-hide_banner', '-nostdin', '-v', 'info', '-rw_timeout', '6000000',
            '-protocol_whitelist', 'pipe,file,http,https,tcp,tls,crypto',
            '-probesize', '2097152', '-analyzeduration', '5000000', '-f', 'hls' if hls else 'concat']
    if not hls:
        args += ['-safe', '0']
    args += ['-i', 'pipe:0', '-map', '0:a:0', '-vn', '-t', '5', '-af', 'volumedetect', '-f', 'null', '-']
    options = {'cwd': '/', 'env': os.environ.copy()}
    if urllib.parse.urlsplit(url).hostname == '127.0.0.1':
        for name in ('http_proxy', 'HTTP_PROXY', 'https_proxy', 'HTTPS_PROXY', 'all_proxy', 'ALL_PROXY'):
            options['env'].pop(name, None)
        options['env']['no_proxy'] = options['env']['NO_PROXY'] = '127.0.0.1,localhost'
    if os.geteuid() == 0:
        service = pwd.getpwnam('musicbot')
        options.update(user=service.pw_uid, group=service.pw_gid, extra_groups=[])
    try:
        p = subprocess.run(args, input=content.encode(), stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=timeout, **options)
        result = parse_audio_log(p.stderr.decode('utf-8', 'replace'), p.returncode)
    except subprocess.TimeoutExpired:
        return {'status': 'decode_timeout', 'audio_signal_confirmed': False}
    return result


def parse_audio_log(log, returncode):
    codec = re.search(r'Audio:\s*([A-Za-z0-9_]+)(?:[^\n]*?([0-9]{4,6}) Hz)?', log)
    mean = re.search(r'mean_volume:\s*(-?(?:[0-9.]+|inf)) dB', log)
    peak = re.search(r'max_volume:\s*(-?(?:[0-9.]+|inf)) dB', log)
    result = {'exit_code': returncode, 'audio_track_seen': bool(codec), 'audio_signal_confirmed': False}
    if codec:
        result['codec'] = codec[1]
    if peak and mean:
        p, m = float(peak[1]), float(mean[1])
        result.update(peak_db=p if math.isfinite(p) else None, mean_db=m if math.isfinite(m) else None,
                      audio_signal_confirmed=math.isfinite(p), status='signal_present' if math.isfinite(p) else 'decoded_silence')
    else:
        result['status'] = 'decode_unconfirmed'
    # Never include log fragments, raw URLs, tokens, names or headers.
    return result


def run(root, link=None):
    require(shutil.which('ffmpeg'), 'FFMPEG_NOT_INSTALLED')
    base, token = context(root)
    report = {'created_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'sample_seconds': 5,
              'code_or_configuration_changed': False, 'new_session_created': False, 'tests': []}
    started = time.monotonic()
    status, chart = api(base, token, '/api/app/music/chart')
    report['catalogue_status'] = status
    tracks = chart.get('items') or []
    selected = []
    for provider in ('archive', 'audius', 'ccmixter'):
        t = next((x for x in tracks if x.get('provider') == provider and x.get('stream') and not x.get('embed')), None)
        if t:
            selected.append(('personal.' + provider, t['stream']))
    status, home = api(base, token, '/api/app/salon/home')
    mine = home.get('mine') or {}
    code = mine.get('code')
    video = ''
    soundcloud = ''
    if isinstance(code, str) and re.fullmatch(r'[A-Z0-9]{4,8}', code) and int(mine.get('live') or 0) > 0:
        status, room = api(base, token, '/api/c/' + code + '?v=-1')
        media = room.get('media') or {}
        if status == 200 and media.get('kind') == 'native' and media.get('formats'):
            selected.insert(0, ('salon.current', media['formats'][0].get('url')))
        if re.fullmatch(r'[A-Za-z0-9_-]{11}', str(room.get('vid') or '')):
            video = room['vid']
        if media.get('kind') == 'soundcloud':
            u = urllib.parse.urlsplit(str(media.get('url') or ''))
            if u.scheme == 'https' and u.hostname == 'soundcloud.com' and re.fullmatch(r'/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+', u.path) and not u.query and not u.username and not u.password and not u.port:
                soundcloud = u.geturl()
                # The salon's legacy audio preparation and the personal-music
                # relay are distinct paths. Test both instead of assuming one.
                until = time.monotonic() + 12
                while True:
                    status, data = api(base, token, '/api/stream?u=' + urllib.parse.quote(soundcloud, safe=''))
                    if not data.get('pending') or time.monotonic() >= until:
                        break
                    time.sleep(0.5)
                if status == 200 and data.get('ok') and data.get('src'):
                    selected.insert(0, ('salon.soundcloud', data['src']))
                else:
                    report['tests'].append({'source': 'salon.soundcloud', 'status': 'preparation_pending' if data.get('pending') else 'preparation_failed', 'http_status': status})
    if link:
        u = urllib.parse.urlsplit(link)
        require(u.scheme == 'https' and not u.username and not u.password and not u.port and not u.fragment, 'INVALID_LINK')
        if u.hostname in ('youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'):
            video = u.path.strip('/') if u.hostname == 'youtu.be' else (urllib.parse.parse_qs(u.query).get('v') or [''])[0]
            require(re.fullmatch(r'[A-Za-z0-9_-]{11}', video), 'INVALID_YOUTUBE_LINK')
        elif u.hostname in ('soundcloud.com', 'www.soundcloud.com') and re.fullmatch(r'/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+/?', u.path):
            soundcloud = 'https://soundcloud.com' + u.path.rstrip('/')
        else:
            raise RuntimeError('USE_YOUTUBE_OR_SOUNDCLOUD_LINK')
    if soundcloud:
        ident = 'sc.' + base64.urlsafe_b64encode(soundcloud.encode()).decode().rstrip('=')
        status, data = api(base, token, '/api/app/music/audio-start?id=' + urllib.parse.quote(ident, safe=''), 22)
        if status == 200 and data.get('ok'):
            selected.insert(0, ('personal.soundcloud', data.get('src')))
        else:
            report['tests'].append({'source': 'personal.soundcloud', 'status': 'preparation_failed', 'http_status': status})
    if video:
        status, data = api(base, token, '/api/app/music/audio-start?id=yt.' + video, 22)
        if status == 200 and data.get('ok'):
            selected.insert(0, ('personal.youtube', data.get('src')))
        else:
            report['tests'].append({'source': 'personal.youtube', 'status': 'preparation_failed', 'http_status': status})
    for label, raw in selected[:5]:
        if time.monotonic() - started > 110:
            report['budget_reached'] = True
            break
        try:
            result = diagnose(playable(raw, base))
        except Exception:
            result = {'status': 'source_not_tested', 'audio_signal_confirmed': False}
        report['tests'].append(dict(source=label, **result))
        print(label + ': ' + result['status'], flush=True)
    return report


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root', type=Path, default=APP)
    p.add_argument('--link', help='Optional public YouTube/SoundCloud song link; never a password or session token.')
    p.add_argument('--output-dir', type=Path, default=Path('/root'))
    a = p.parse_args()
    try:
        report = run(a.root, a.link)
        a.output_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        fd, name = tempfile.mkstemp(prefix='wakhan-live-audio-' + time.strftime('%Y%m%d-%H%M%S') + '-', suffix='.zip', dir=a.output_dir)
        os.close(fd)
        path = Path(name)
        path.chmod(0o600)
        with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
            z.writestr('AUDIO-RESULT.json', json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print('بستهٔ بررسی صدا:', path)
        print('SHA256:', hashlib.sha256(path.read_bytes()).hexdigest())
        print('کد، تنظیمات و سرویس‌ها تغییر نکردند؛ فقط درخواست‌های عادی پخش با نشست موجود مالک انجام شد.')
    except Exception as error:
        code = str(error) if isinstance(error, RuntimeError) and re.fullmatch('[A-Z_]+', str(error)) else 'CHECK_COULD_NOT_FINISH'
        raise SystemExit('STOP: ' + code)
