"""Honor site-declared availability before the existing video readability checks."""
import copy
import threading
from concurrent.futures import Future
from urllib.parse import urlsplit, parse_qs
MEDIA_WORKER_SECONDS = 105
MEDIA_PARENT_SECONDS = 110
MEDIA_VALIDATION_SECONDS = 32
MEDIA_MAX_PROBES = 8
MEDIA_CACHE_SECONDS = 90
MEDIA_CACHE_ENTRIES = 32
MEDIA_PARALLEL_SOURCES = 2
_MEDIA_PROGRESS = {}

def media_progress(phase, **values):
    _MEDIA_PROGRESS.update(phase=phase, **values)

def media_cache_expiry(track):
    ttl = MEDIA_CACHE_SECONDS
    for field in ('path', '_v_audio_path'):
        value = track.get(field)
        if not isinstance(value, str):
            continue
        try:
            expiry = parse_qs(urlsplit(value).query).get('expire', [])
            if expiry:
                ttl = min(ttl, max(0, float(expiry[0]) - time.time() - 30))
        except (ValueError, TypeError):
            ttl = 0
    return time.monotonic() + ttl

def _extract_with_progress(downloader, *args, **kwargs):
    media_progress('extract')
    return downloader.extract_info(*args, **kwargs)
import ast
import json
import math
import os
from pathlib import Path
import re
import shutil
import signal
import subprocess
import sys
# Load the private challenge solver before yt-dlp caches optional dependencies
# in this isolated video worker, just as the audio worker does.
_js_libs = Path(__file__).resolve().parent / 'youtube-js-v1' / 'libs'
if _js_libs.is_dir() and str(_js_libs) not in sys.path:
    sys.path.insert(0, str(_js_libs))
import tempfile
import time
FORMAT = 'best[height<=720][vcodec^=avc1][acodec^=mp4a]'

class VideoReadinessError(Exception):
    pass

def header_map(general, specific):
    result = dict(general or {})
    result.update(specific or {})
    if len(result) > 64:
        raise ValueError('headers')
    if any((not isinstance(k, str) or not re.fullmatch("[!#$%&'*+.^_`|~0-9A-Za-z-]+", k) or (not isinstance(v, str)) or ('\r' in v) or ('\n' in v) for k, v in result.items())):
        raise ValueError('headers')
    return result

class Readable:

    def __init__(self):
        self.cache = {}
        self.checks = 0
        self.waited = 0.0
        self.deadline = None

    def ready(self, fmt):
        if self.deadline is None:
            self.deadline = time.monotonic() + MEDIA_VALIDATION_SECONDS
        media_progress('availability', checks=self.checks, waited_seconds=round(self.waited, 3))
        try:
            available = float(fmt.get('available_at') or 0)
        except (ValueError, TypeError):
            return False
        if not math.isfinite(available):
            return False
        delay = max(0, available - time.time())
        if not delay:
            return time.monotonic() < self.deadline
        delay += 0.25
        if delay > 20 - self.waited or delay > self.deadline - time.monotonic():
            return False
        start = time.monotonic()
        time.sleep(delay)
        self.waited += max(0, time.monotonic() - start)
        media_progress('availability', checks=self.checks, waited_seconds=round(self.waited, 3))
        return time.time() >= available and time.monotonic() < self.deadline

    def streams(self, url, headers):
        key = (url, tuple(sorted(headers.items())))
        if key in self.cache:
            return self.cache[key]
        if self.deadline is None:
            self.deadline = time.monotonic() + MEDIA_VALIDATION_SECONDS
        remaining = self.deadline - time.monotonic()
        if self.checks >= MEDIA_MAX_PROBES or remaining <= 0:
            media_progress('probe_budget', checks=self.checks, waited_seconds=round(self.waited, 3))
            return []
        self.checks += 1
        timeout = min(5, remaining)
        media_progress('probe', checks=self.checks, waited_seconds=round(self.waited, 3))
        command = ['ffprobe', '-v', 'error', '-rw_timeout', str(max(1000, int(min(4, timeout) * 1000000)))]
        if headers:
            command += ['-headers', ''.join((k + ': ' + v + '\r\n' for k, v in headers.items()))]
        command += ['-show_entries', 'stream=codec_type,width,height,codec_name', '-of', 'json', url]
        try:
            done = subprocess.run(command, capture_output=True, timeout=timeout)
            data = json.loads(done.stdout) if done.returncode == 0 else {}
        except (subprocess.TimeoutExpired, ValueError):
            data = {}
        value = data.get('streams', [])
        self.cache[key] = value
        return value

    def usable(self, fmt, headers):
        if not self.ready(fmt):
            return False
        streams = self.streams(fmt['url'], headers)
        need_video = fmt.get('vcodec') not in (None, 'none')
        need_audio = fmt.get('acodec') not in (None, 'none')
        video = any((s.get('codec_type') == 'video' and s.get('width', 0) > 0 and (s.get('height', 0) > 0) for s in streams))
        audio = any((s.get('codec_type') == 'audio' for s in streams))
        return (not need_video or video) and (not need_audio or audio) and bool(streams)

def resolve(root, url, temporary):
    import yt_dlp
    tree = ast.parse((root / 'app_core.py').read_text())
    nodes = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name in ('_opts', '_meta') or (isinstance(n, ast.Assign) and any((isinstance(v, ast.Name) and v.id == 'YT_OPTS' for v in n.targets)))]
    if len(nodes) != 3:
        return {'ok': False, 'reason': 'source_differs'}
    ns = {'os': os, 're': re, 'yt_dlp': yt_dlp, 'DATA': str(root / 'data'), 'CACHE': str(root / 'cache')}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), 'isolated-source-options', 'exec'), ns)
    options = ns['_opts'](format=FORMAT, skip_download=True, check_formats='selected')
    cookie = options.pop('cookiefile', None)
    if cookie and Path(cookie).is_file():
        private = temporary / 'cookies.txt'
        shutil.copyfile(cookie, private)
        private.chmod(384)
        options['cookiefile'] = str(private)

    class Quiet:

        def debug(self, *args):
            pass

        def warning(self, *args):
            pass

        def error(self, *args):
            pass
    options.update(logger=Quiet(), quiet=True, no_warnings=True, socket_timeout=6, retries=0, extractor_retries=0, cachedir=str(temporary / 'cache'), paths={'temp': str(temporary)})
    readable = Readable()
    with yt_dlp.YoutubeDL(options) as downloader:

        def check(formats, warning=True):
            for fmt in formats:
                if fmt.get('url') and readable.usable(fmt, header_map(downloader.params.get('http_headers'), fmt.get('http_headers'))):
                    yield fmt
        downloader._check_formats = check
        info = _extract_with_progress(downloader, url, download=False)
        if not info or info.get('_type') in ('playlist', 'multi_video'):
            return {'ok': False, 'reason': 'failed'}
        duration = float(info.get('duration') or 0)
        if info.get('is_live') or not 0 < duration <= 21600:
            return {'ok': False, 'reason': 'size'}
        selected = info.get('requested_formats') or [info]
        video = next((f for f in selected if f.get('vcodec') not in (None, 'none') and f.get('url')), None)
        audio = next((f for f in selected if f.get('acodec') not in (None, 'none') and f.get('url')), None)
        headers = header_map(info.get('http_headers'), video.get('http_headers') if video else None)
        valid = bool(video and readable.usable(video, headers) and (not audio or readable.usable(audio, headers)))
        if not valid:
            for fmt in reversed(info.get('formats') or []):
                if not fmt.get('url') or not 0 < int(fmt.get('height') or 0) <= 720 or fmt.get('vcodec') in (None, 'none') or (fmt.get('acodec') in (None, 'none')):
                    continue
                candidate = header_map(info.get('http_headers'), fmt.get('http_headers'))
                if readable.usable(fmt, candidate):
                    video = audio = fmt
                    headers = candidate
                    valid = True
                    break
        if not valid:
            return {'ok': False, 'reason': 'no_readable_video', 'checked': readable.checks, 'waited_seconds': round(readable.waited, 3)}
        track = ns['_meta'](info, url)
        track.update(path=video['url'], _v_audio_path=audio['url'] if audio and audio['url'] != video['url'] else None, _v_headers=headers, _wm_video=True, stream=1, _v_provider='youtube', _v_resolved=time.monotonic())
        track['_v_height'] = int(video.get('height') or 0)
        actual = next((s for s in readable.streams(video['url'], headers) if s.get('codec_type') == 'video'), {})
        return {'ok': True, 'track': track, 'checked': readable.checks, 'waited_seconds': round(readable.waited, 3), 'video_width': int(actual.get('width') or 0), 'video_height': int(actual.get('height') or 0)}

def worker():
    job = json.loads(sys.stdin.read(16384))
    started = time.monotonic()
    _MEDIA_PROGRESS.clear()
    media_progress('options', checks=0, waited_seconds=0)
    signal.signal(signal.SIGALRM, lambda *_: (_ for _ in ()).throw(TimeoutError()))
    signal.alarm(MEDIA_WORKER_SECONDS)
    try:
        result = resolve(Path(job['root']), job['url'], Path(job['temporary']))
    except Exception as error:
        message = str(error).lower()
        reason = 'blocked' if 'not a bot' in message or 'sign in to confirm' in message else 'timeout' if isinstance(error, TimeoutError) else 'no_readable_video'
        result = {'ok': False, 'reason': reason}
    finally:
        signal.alarm(0)
    result.update(phase=_MEDIA_PROGRESS.get('phase', 'options'), elapsed_seconds=round(time.monotonic() - started, 3), checks=_MEDIA_PROGRESS.get('checks', result.get('checked', 0)), waited_seconds=_MEDIA_PROGRESS.get('waited_seconds', result.get('waited_seconds', 0)))
    print(json.dumps(result), flush=True)

class ReadableVideo:

    def __init__(self, namespace):
        self.n = namespace
        self._media_lock = threading.RLock()
        self._media_cache = {}
        self._media_jobs = {}

    def extract(self, url):
        with self._media_lock:
            hit = self._media_cache.get(url)
            if hit and hit[0] > time.monotonic():
                return copy.deepcopy(hit[1])
            if hit:
                self._media_cache.pop(url, None)
            future = self._media_jobs.get(url)
            owner = future is None
            if owner:
                if len(self._media_jobs) >= MEDIA_PARALLEL_SOURCES:
                    raise VideoReadinessError('source_busy')
                future = Future()
                self._media_jobs[url] = future
        if not owner:
            return copy.deepcopy(future.result(timeout=MEDIA_PARENT_SECONDS + 5))
        try:
            track = self._extract_uncached(url)
            saved = copy.deepcopy(track)
            with self._media_lock:
                now = time.monotonic()
                for key, (expiry, _) in list(self._media_cache.items()):
                    if expiry <= now:
                        self._media_cache.pop(key, None)
                while len(self._media_cache) >= MEDIA_CACHE_ENTRIES:
                    self._media_cache.pop(next(iter(self._media_cache)))
                self._media_cache[url] = (media_cache_expiry(saved), saved)
            future.set_result(saved)
            return copy.deepcopy(saved)
        except BaseException as error:
            future.set_exception(error)
            raise
        finally:
            with self._media_lock:
                self._media_jobs.pop(url, None)

    def _extract_uncached(self, url):
        root = Path(__file__).resolve().parent
        with tempfile.TemporaryDirectory(prefix='wakhan-video47-') as folder:
            job = {'root': str(root), 'url': url, 'temporary': folder}
            process = subprocess.Popen([sys.executable, str(Path(__file__).resolve()), '--worker'], cwd=root, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True)
            try:
                stdout, stderr = process.communicate(json.dumps(job), timeout=MEDIA_PARENT_SECONDS)
                result = json.loads(stdout)
            except BaseException:
                if process.poll() is None:
                    os.killpg(process.pid, signal.SIGKILL)
                process.communicate()
                raise VideoReadinessError('source_worker_failed') from None
            self.n['log'].info('WM_RESOLVER48 ok=%s checked=%s waited=%s', bool(result.get('ok')), int(result.get('checked', 0)), float(result.get('waited_seconds', 0)))
            self.n['WM_RESOLVER_STATUS'] = {k: result[k] for k in ('ok', 'reason', 'phase', 'elapsed_seconds', 'checks', 'waited_seconds') if k in result}
            if not result.get('ok'):
                reason = result.get('reason')
                if reason in ('size', 'failed'):
                    raise ValueError(reason)
                if reason == 'blocked':
                    raise RuntimeError("Sign in to confirm you're not a bot")
                raise VideoReadinessError('no_readable_video')
            self.n['log'].info('WM_RESOLVER48 video_width=%d video_height=%d', int(result.get('video_width', 0)), int(result.get('video_height', 0)))
            track = result['track']
            track['_v_resolved'] = time.monotonic()
            return track

    def install(self):
        self.n['WM_VIDEO'].extract = self.extract
if __name__ == '__main__' and '--worker' in sys.argv:
    worker()
