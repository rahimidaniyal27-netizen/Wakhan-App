"""Audio metadata only. Uses the server's existing source options, not its video probe/transcoder."""
import asyncio
import collections
from contextlib import nullcontext
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import shutil
import signal
import sys
import tempfile
import time
from urllib.parse import parse_qs, urlsplit


class AudioUnavailable(Exception):
    def __init__(self, code='audio_unavailable', status=502):
        self.code, self.status = code, status
        self.reason = None
        super().__init__(code)


SOURCE_REASONS = frozenset(('youtube_verification_required', 'youtube_token_service_unavailable',
    'audio_format_unavailable', 'source_tls_error', 'source_access_denied', 'source_timeout',
    'source_network_error', 'audio_metadata_rejected', 'source_extraction_failed'))


def source_failure(error):
    # Only fixed enum values can leave a worker, never extractor messages which
    # may include signed CDN URLs, cookies, keys or local configuration paths.
    if isinstance(error, AudioUnavailable):
        return 'audio_metadata_rejected'
    message = str(error).lower()
    if 'not a bot' in message or 'sign in to confirm' in message:
        return 'youtube_verification_required'
    if 'token' in message and any(x in message for x in ('failed', 'unavailable', 'error')):
        return 'youtube_token_service_unavailable'
    if 'requested format' in message or 'format is not available' in message:
        return 'audio_format_unavailable'
    if any(x in message for x in ('certificate', 'ssl', 'tls')):
        return 'source_tls_error'
    if '403' in message or 'forbidden' in message:
        return 'source_access_denied'
    if any(x in message for x in ('timed out', 'timeout')):
        return 'source_timeout'
    if any(x in message for x in ('connection', 'network', 'resolve host')):
        return 'source_network_error'
    return 'source_extraction_failed'


def allowed_audio_url(url, provider):
    try:
        if not isinstance(url, str) or len(url) > 16384 or any(c in url for c in '\r\n\\'):
            return False
        p = urlsplit(url)
        if p.scheme != 'https' or p.username or p.password or p.fragment or p.port not in (None, 443):
            return False
        domains = ('googlevideo.com',) if provider == 'youtube' else ('sndcdn.com', 'soundcloud.com') if provider == 'soundcloud' else ()
        host = (p.hostname or '').lower()
        return any(host == d or host.endswith('.' + d) for d in domains)
    except (ValueError, TypeError):
        return False


def audio_headers(value):
    # Never propagate the app's auth, cookies, or arbitrary extractor headers to a CDN.
    out = {}
    for key, value in (value or {}).items():
        if key.lower() not in ('user-agent', 'referer', 'origin', 'accept'):
            continue
        if not isinstance(value, str) or '\r' in value or '\n' in value or len(value) > 4096:
            raise AudioUnavailable()
        out[key] = value
    return out


def worker_source_options(provider, options, source_root=None):
    """Initialize process-local provider registration in this worker as well.

    Passing extractor_args across stdin cannot pass imported plugin modules or
    yt-dlp's provider registry. Load only the app-owned configuration module;
    source_root is supplied by the server process, never by the public API.
    """
    options = dict(options)
    if provider != 'youtube':
        return options
    root = Path(source_root).resolve() if source_root else Path(__file__).resolve().parents[1]
    config = root / 'wakhan_youtube_v39.py'
    if not config.is_file():
        if 'youtubepot-wakhanbrowser' in (options.get('extractor_args') or {}):
            raise AudioUnavailable('youtube_setup', 503)
        return options
    try:
        location = str(root)
        if location not in sys.path:
            sys.path.insert(0, location)
        name = '_wakhan_audio_source_configuration'
        module = sys.modules.get(name)
        if module is None or Path(module.__file__).resolve() != config.resolve():
            spec = importlib.util.spec_from_file_location(name, config)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            sys.modules[name] = module
        configured = module.configure(options)
        if not isinstance(configured, dict):
            raise ValueError()
        return configured
    except Exception:
        raise AudioUnavailable('youtube_setup', 503) from None


def compatible_muxed(fmt,provider):
    # Keep audio-only first. A bounded H.264/AAC progressive MP4 is the
    # compatible fallback when YouTube offers no separate audio resource.
    try:height=float(fmt.get('height') or 0)
    except (ValueError,TypeError):return False
    video=str(fmt.get('vcodec') or '');audio=str(fmt.get('acodec') or '')
    return (provider=='youtube' and fmt.get('ext')=='mp4' and fmt.get('protocol')=='https'
        and not fmt.get('has_drm') and not fmt.get('fragments') and math.isfinite(height) and 0<height<=360
        and (video=='h264' or video.startswith('avc1.'))
        and (audio=='aac' or audio=='mp4a' or audio.startswith('mp4a.')))


def resolve_audio(url, provider, options, workspace=None, source_root=None):
    options = worker_source_options(provider, options, source_root)
    import yt_dlp
    selector='bestaudio[ext=m4a][protocol=https]/bestaudio[ext=m4a][protocol=http]/bestaudio[ext=mp3][protocol=https]/bestaudio[ext=mp3][protocol=http]/bestaudio[protocol^=m3u8]'
    if provider=='youtube':
        selector+='/best[ext=mp4][protocol=https][height<=360][vcodec^=avc1][acodec^=mp4a]/best[ext=mp4][protocol=https][height<=360][vcodec=h264][acodec=aac]'
    options.update(format=selector,
                   skip_download=True, noplaylist=True, check_formats=False, quiet=True,
                   no_warnings=True, socket_timeout=5, retries=0, extractor_retries=0,
                   cachedir=False, nocheckcertificate=False)
    class Quiet:
        def debug(self, *a): pass
        def warning(self, *a): pass
        def error(self, *a): pass
    options['logger'] = Quiet()
    # yt-dlp may save cookies on exit; keep the configured source cookie file unchanged.
    context=nullcontext(workspace)if workspace is not None else tempfile.TemporaryDirectory(prefix='wakhan-audio-metadata-')
    with context as directory:
        cookie = options.get('cookiefile')
        if cookie:
            source = Path(cookie)
            if source.is_file():
                private = Path(directory) / 'cookies.txt'
                shutil.copyfile(source, private)
                private.chmod(0o600)
                options['cookiefile'] = str(private)
            else:
                options.pop('cookiefile', None)
        options['paths'] = {'temp': directory}
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(url, download=False)
        if not info or info.get('_type') in ('playlist', 'multi_video') or info.get('is_live'):
            raise AudioUnavailable()
        if provider=='youtube' and info.get('id')!=(parse_qs(urlsplit(url).query).get('v') or [''])[0]:
            raise AudioUnavailable()
        duration = float(info.get('duration') or 0)
        if not math.isfinite(duration) or not 0 < duration <= 21600:
            raise AudioUnavailable()
        selected = info.get('requested_formats') or [info]
        selected = [f for f in selected if f.get('acodec') not in (None, 'none')]
        if len(selected) != 1:
            raise AudioUnavailable()
        fmt = selected[0]
        muxed=compatible_muxed(fmt,provider)
        if fmt.get('has_drm') or fmt.get('vcodec')!='none' and not muxed:
            raise AudioUnavailable()
        src = fmt.get('url')
        if not allowed_audio_url(src, provider):
            raise AudioUnavailable()
        hls = str(fmt.get('protocol') or '').startswith('m3u8') or urlsplit(src).path.endswith('.m3u8')
        if not hls:
            if fmt.get('fragments') or fmt.get('protocol')not in (None,'https','http'):
                raise AudioUnavailable()
            if fmt.get('ext') not in ('m4a','mp4','mp3') or not str(fmt.get('acodec')).startswith(('mp4a','aac','mp3')):
                raise AudioUnavailable()
        headers = audio_headers(dict(info.get('http_headers') or {}, **(fmt.get('http_headers') or {})))
        result = {'url': src, 'kind': 'hls' if hls else 'file', 'ext': 'm3u8' if hls else 'mp3' if fmt.get('ext') == 'mp3' else 'm4a',
                'duration': duration, 'headers': headers, 'proxy':options.get('proxy'), 'title': str(info.get('title') or '')[:200]}
        if provider=='youtube':
            # Respect the source's advertised readiness; a listed format can
            # legitimately reject early requests before this timestamp.
            try:available=float(fmt.get('available_at') or 0)
            except (TypeError,ValueError):raise AudioUnavailable()
            if not math.isfinite(available):raise AudioUnavailable()
            wait=max(0,available-time.time()+0.25) if available>time.time() else 0
            if wait>20:raise AudioUnavailable('audio_not_ready',503)
            if wait:time.sleep(wait)
            result['ready_wait_seconds']=round(wait,3)
        if muxed:result['muxed']=True
        return result


async def run_worker(url, provider, options, timeout=None, command=None, source_root=None):
    if timeout is None:timeout=32 if provider=='youtube' else 12
    command = command or [sys.executable, str(Path(__file__).resolve()), '--worker']
    # The parent owns this folder, so timeout/cancellation also removes the cookie copy.
    with tempfile.TemporaryDirectory(prefix='wakhan-audio-worker-')as workspace:
        process = await asyncio.create_subprocess_exec(*command, stdin=asyncio.subprocess.PIPE,
                        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL, start_new_session=True)
        try:
            data = json.dumps({'url': url, 'provider': provider, 'options': options, 'workspace':workspace,
                               'source_root':str(Path(source_root).resolve() if source_root else Path(__file__).resolve().parents[1])}).encode()
            stdout, _ = await asyncio.wait_for(process.communicate(data), timeout)
            if process.returncode or len(stdout) > 131072:
                raise AudioUnavailable()
            value = json.loads(stdout)
            if not value.get('ok'):
                code = value.get('err') if value.get('err') in ('audio_timeout', 'youtube_setup') else 'audio_unavailable'
                error = AudioUnavailable(code, {'audio_timeout':504, 'youtube_setup':503}.get(code, 422))
                error.reason = value.get('reason') if value.get('reason') in SOURCE_REASONS else None
                raise error
            return value['audio']
        except asyncio.TimeoutError:
            raise AudioUnavailable('audio_timeout', 504) from None
        except (ValueError, KeyError, TypeError):
            raise AudioUnavailable() from None
        finally:
            if process.returncode is None:
                try: os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError: pass
                await process.wait()


class AudioResolver:
    def __init__(self, namespace, worker=run_worker):
        self.n, self.worker = namespace, worker
        self.cache, self.jobs = collections.OrderedDict(), {}
        self.waiters = collections.Counter()
        self.slots = asyncio.Semaphore(2)

    async def get(self, url, provider):
        key = (provider, url)
        hit = self.cache.get(key)
        if hit and hit[0] > time.monotonic():
            return hit[1]
        if key not in self.jobs:
            if len(self.jobs) >= 8:
                raise AudioUnavailable('source_busy', 429)
            async def fetch():
                async with self.slots:
                    opts = self.n.get('_opts')
                    if not callable(opts):
                        raise AudioUnavailable('audio_resolver_unavailable', 503)
                    # Only options relevant to authentication, configured network access and extraction.
                    allowed = ('proxy', 'geo_verification_proxy', 'source_address', 'cookiefile', 'http_headers',
                               'extractor_args', 'js_runtimes', 'remote_components')
                    raw = opts(format='bestaudio[ext=m4a]/bestaudio', skip_download=True)
                    if raw.get('proxy')is None:
                        from urllib.request import getproxies,proxy_bypass
                        host=urlsplit(url).hostname
                        raw['proxy']=None if proxy_bypass(host)else (getproxies().get('https')or getproxies().get('all'))
                    options = {k: v for k, v in raw.items() if k in allowed}
                    options = json.loads(json.dumps(options, default=lambda v: list(v) if isinstance(v, set) else None))
                    audio = await self.worker(url, provider, options)
                    if not allowed_audio_url(audio.get('url'), provider):
                        raise AudioUnavailable()
                    ttl = 180
                    try:
                        expires = (parse_qs(urlsplit(audio['url']).query).get('expire') or [None])[0]
                        if expires: ttl = min(ttl, max(0, float(expires) - time.time() - 30))
                    except (ValueError, TypeError): ttl = 0
                    self.cache[key] = (time.monotonic() + ttl, audio)
                    self.cache.move_to_end(key)
                    while len(self.cache) > 256: self.cache.popitem(last=False)
                    return audio
            task = asyncio.create_task(fetch())
            self.jobs[key] = task
            def done(t):
                if self.jobs.get(key) is t: self.jobs.pop(key, None)
                if not t.cancelled(): t.exception()
            task.add_done_callback(done)
        # Abandoning one request must not cancel another listener's shared preparation.
        task=self.jobs[key];self.waiters[key]+=1
        try: return await asyncio.wait_for(asyncio.shield(task), 34 if provider=='youtube' else 14)
        except asyncio.TimeoutError: raise AudioUnavailable('audio_timeout', 504) from None
        finally:
            self.waiters[key]-=1
            if not self.waiters[key]:
                self.waiters.pop(key,None)
                if not task.done():
                    if self.jobs.get(key)is task:self.jobs.pop(key,None)
                    task.cancel()

    async def close(self):
        tasks = list(self.jobs.values())
        for task in tasks: task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        self.cache.clear()


if __name__ == '__main__' and '--worker' in sys.argv:
    try:
        data = json.loads(sys.stdin.read(65536))
        result = {'ok': True, 'audio': resolve_audio(data['url'], data['provider'], data['options'],data.get('workspace'),data.get('source_root'))}
    except Exception as error:
        result = {'ok': False, 'err': error.code if isinstance(error, AudioUnavailable) and error.code == 'youtube_setup' else 'audio_timeout' if isinstance(error, TimeoutError) else 'audio_unavailable'}
        if result['err'] == 'audio_unavailable':
            result['reason'] = source_failure(error)
    print(json.dumps(result, ensure_ascii=True), flush=True)
