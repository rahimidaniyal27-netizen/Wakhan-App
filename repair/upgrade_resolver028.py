"""Upgrade verified generated resolver code; no redacted source is deployed."""
import ast
from pathlib import Path

SUPPORT='''
import copy
import threading
from concurrent.futures import Future
from urllib.parse import urlsplit,parse_qs
MEDIA_WORKER_SECONDS=105
MEDIA_PARENT_SECONDS=110
MEDIA_VALIDATION_SECONDS=32
MEDIA_MAX_PROBES=8
MEDIA_CACHE_SECONDS=90
MEDIA_CACHE_ENTRIES=32
MEDIA_PARALLEL_SOURCES=2
_MEDIA_PROGRESS={}

def media_progress(phase,**values):
    _MEDIA_PROGRESS.update(phase=phase,**values)

def media_cache_expiry(track):
    ttl=MEDIA_CACHE_SECONDS
    for field in ('path','_v_audio_path'):
        value=track.get(field)
        if not isinstance(value,str):continue
        try:
            expiry=parse_qs(urlsplit(value).query).get('expire',[])
            if expiry:ttl=min(ttl,max(0,float(expiry[0])-time.time()-30))
        except (ValueError,TypeError):ttl=0
    return time.monotonic()+ttl
'''

INIT='''
def __init__(self):
    self.cache={};self.checks=0;self.waited=0.0;self.deadline=None
'''

READY='''
def ready(self,fmt):
    if self.deadline is None:self.deadline=time.monotonic()+MEDIA_VALIDATION_SECONDS
    media_progress('availability',checks=self.checks,waited_seconds=round(self.waited,3))
    try:available=float(fmt.get('available_at') or 0)
    except (ValueError,TypeError):return False
    if not math.isfinite(available):return False
    delay=max(0,available-time.time())
    if not delay:return time.monotonic()<self.deadline
    delay+=.25
    if delay>20-self.waited or delay>self.deadline-time.monotonic():return False
    start=time.monotonic();time.sleep(delay);self.waited+=max(0,time.monotonic()-start)
    media_progress('availability',checks=self.checks,waited_seconds=round(self.waited,3))
    return time.time()>=available and time.monotonic()<self.deadline
'''

STREAMS='''
def streams(self,url,headers):
    key=(url,tuple(sorted(headers.items())))
    if key in self.cache:return self.cache[key]
    if self.deadline is None:self.deadline=time.monotonic()+MEDIA_VALIDATION_SECONDS
    remaining=self.deadline-time.monotonic()
    if self.checks>=MEDIA_MAX_PROBES or remaining<=0:
        media_progress('probe_budget',checks=self.checks,waited_seconds=round(self.waited,3))
        return []
    self.checks+=1;timeout=min(5,remaining)
    media_progress('probe',checks=self.checks,waited_seconds=round(self.waited,3))
    command=['ffprobe','-v','error','-rw_timeout',str(max(1000,int(min(4,timeout)*1000000)))]
    if headers:command+=['-headers',''.join(k+': '+v+'\\r\\n' for k,v in headers.items())]
    command+=['-show_entries','stream=codec_type,width,height,codec_name','-of','json',url]
    try:
        done=subprocess.run(command,capture_output=True,timeout=timeout)
        data=json.loads(done.stdout) if done.returncode==0 else {}
    except (subprocess.TimeoutExpired,ValueError):data={}
    value=data.get('streams',[]);self.cache[key]=value;return value
'''

WORKER='''
def worker():
    job=json.loads(sys.stdin.read(16384));started=time.monotonic()
    _MEDIA_PROGRESS.clear();media_progress('options',checks=0,waited_seconds=0)
    signal.signal(signal.SIGALRM,lambda *_: (_ for _ in ()).throw(TimeoutError()))
    signal.alarm(MEDIA_WORKER_SECONDS)
    try:result=resolve(Path(job['root']),job['url'],Path(job['temporary']))
    except Exception as error:
        message=str(error).lower()
        reason='blocked' if 'not a bot' in message or 'sign in to confirm' in message else 'timeout' if isinstance(error,TimeoutError) else 'no_readable_video'
        result={'ok':False,'reason':reason}
    finally:signal.alarm(0)
    result.update(phase=_MEDIA_PROGRESS.get('phase','options'),elapsed_seconds=round(time.monotonic()-started,3),checks=_MEDIA_PROGRESS.get('checks',result.get('checked',0)),waited_seconds=_MEDIA_PROGRESS.get('waited_seconds',result.get('waited_seconds',0)))
    print(json.dumps(result),flush=True)
'''

VIDEO_INIT='''
def __init__(self,namespace):
    self.n=namespace;self._media_lock=threading.RLock();self._media_cache={};self._media_jobs={}
'''

VIDEO_EXTRACT='''
def extract(self,url):
    with self._media_lock:
        hit=self._media_cache.get(url)
        if hit and hit[0]>time.monotonic():return copy.deepcopy(hit[1])
        if hit:self._media_cache.pop(url,None)
        future=self._media_jobs.get(url);owner=future is None
        if owner:
            if len(self._media_jobs)>=MEDIA_PARALLEL_SOURCES:raise VideoReadinessError('source_busy')
            future=Future();self._media_jobs[url]=future
    if not owner:return copy.deepcopy(future.result(timeout=MEDIA_PARENT_SECONDS+5))
    try:
        track=self._extract_uncached(url);saved=copy.deepcopy(track)
        with self._media_lock:
            now=time.monotonic()
            for key,(expiry,_) in list(self._media_cache.items()):
                if expiry<=now:self._media_cache.pop(key,None)
            while len(self._media_cache)>=MEDIA_CACHE_ENTRIES:self._media_cache.pop(next(iter(self._media_cache)))
            self._media_cache[url]=(media_cache_expiry(saved),saved)
        future.set_result(saved);return copy.deepcopy(saved)
    except BaseException as error:
        future.set_exception(error);raise
    finally:
        with self._media_lock:self._media_jobs.pop(url,None)
'''


def function(code):return ast.parse(code).body[0]


def upgrade(source):
    tree=ast.parse(source)
    if any(isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MEDIA_WORKER_SECONDS' for t in n.targets) for n in tree.body):return source
    classes={n.name:n for n in tree.body if isinstance(n,ast.ClassDef)}
    if not {'Readable','ReadableVideo','VideoReadinessError'}<=set(classes):raise RuntimeError('RESOLVER_LAYOUT_DIFFERS')
    readable=classes['Readable'];video=classes['ReadableVideo']
    methods={n.name:n for n in video.body if isinstance(n,ast.FunctionDef)}
    if not {'__init__','extract','install'}<=set(methods):raise RuntimeError('RESOLVER_METHODS_DIFFER')
    raw=methods['extract'];calls=[n for n in ast.walk(raw) if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='communicate']
    deadlines=[kw for call in calls for kw in call.keywords if kw.arg=='timeout' and isinstance(kw.value,ast.Constant) and kw.value.value==43]
    if len(deadlines)!=1:raise RuntimeError('RESOLVER_DEADLINE_DIFFERS')
    deadlines[0].value=ast.Name(id='MEDIA_PARENT_SECONDS',ctx=ast.Load())
    raw.name='_extract_uncached'
    # Capture only fixed worker metrics in the namespace for a private deployment report.
    marker=next((i for i,n in enumerate(raw.body) if isinstance(n,ast.With)),None)
    if marker is None:raise RuntimeError('RESOLVER_PROCESS_BOUNDARY_DIFFERS')
    class Status(ast.NodeTransformer):
        def visit_If(self,node):
            self.generic_visit(node)
            if ast.unparse(node.test)=="not result.get('ok')":
                return [ast.parse("self.n['WM_RESOLVER_STATUS']={k:result[k] for k in ('ok','reason','phase','elapsed_seconds','checks','waited_seconds') if k in result}").body[0],node]
            return node
    raw=Status().visit(raw)
    video.body=[n for n in video.body if not isinstance(n,ast.FunctionDef) or n.name not in ('__init__','_extract_uncached')]
    video.body[:0]=[function(VIDEO_INIT),function(VIDEO_EXTRACT),raw]
    replacements={'__init__':INIT,'ready':READY,'streams':STREAMS}
    readable.body=[function(replacements[n.name]) if isinstance(n,ast.FunctionDef) and n.name in replacements else n for n in readable.body]
    for i,node in enumerate(tree.body):
        if isinstance(node,ast.FunctionDef) and node.name=='worker':tree.body[i]=function(WORKER)
        if isinstance(node,ast.FunctionDef) and node.name=='resolve':
            for n in ast.walk(node):
                if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='info' for t in n.targets) and isinstance(n.value,ast.Call) and isinstance(n.value.func,ast.Attribute) and n.value.func.attr=='extract_info':
                    # This is the actual request whose provider can take 60 seconds.
                    n.value=ast.Call(func=ast.Name(id='_extract_with_progress',ctx=ast.Load()),args=[n.value.func.value,*n.value.args],keywords=n.value.keywords)
    support=ast.parse(SUPPORT+"\ndef _extract_with_progress(downloader,*args,**kwargs):\n    media_progress('extract')\n    return downloader.extract_info(*args,**kwargs)\n").body
    # Retain the module docstring before introducing owned support code.
    at=1 if tree.body and isinstance(tree.body[0],ast.Expr) and isinstance(tree.body[0].value,ast.Constant) and isinstance(tree.body[0].value.value,str) else 0
    tree.body[at:at]=support
    ast.fix_missing_locations(tree);text=ast.unparse(tree)+'\n';compile(text,'native-media-resolver','exec');return text


def patch(path):
    path=Path(path);old=path.read_text();new=upgrade(old)
    if new!=old:path.write_text(new)
    return new!=old
