#!/usr/bin/env python3
"""Read-only source/transport/decoder comparison. No app deployment or restart."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import urllib.error
import tempfile

INSTALLER=Path('/root/wakhan-fix-youtube-muxed.py')
PIN='6c090c6f2462df996bb4b4ee3cb4a06e1e38c1710f23b77930f397178028ad0f'
CHECK_STAGE='startup'
CHILD=r'''
import ast,asyncio,collections,functools,hashlib,importlib.util,ipaddress,json,logging,os,re,secrets,shutil,sys,tempfile,time,urllib.request,urllib.error
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
root,stage=Path(sys.argv[1]),Path(sys.argv[2]);sys.dont_write_bytecode=True
sys.path[:0]=[str(root/'youtube-js-v2/libs'),str(root)]
logging.disable(logging.CRITICAL)
import aiohttp,yt_dlp
from aiohttp import web
from yt_dlp.networking import Request
from yt_dlp.version import __version__

def event(value):print('WKSTAGE '+value,file=sys.stderr,flush=True)
def reason(text):
 text=str(text).lower()
 for key,patterns in [('http_403',('403','forbidden')),('http_401',('401','unauthorized')),('http_502',('502','bad gateway')),('http_404',('404','not found')),('tls_failure',('certificate','ssl','tls')),('network_timeout',('timeout','timed out')),('protocol_rejected',('not on whitelist','protocol not found')),('format_rejected',('not on allowed_extensions','extension is not among')),('mp4_header_missing',('moov atom not found',)),('truncated_file',('partial file','end of file')),('invalid_media',('invalid data found','invalid argument')),('network_failure',('connect','resolve host'))]:
  if any(p in text for p in patterns):return key
 return 'unclassified_failure'
def family(address):
 try:return ipaddress.ip_address(address).version
 except ValueError:return None
def mime(value):
 value=str(value).split(';')[0].lower()
 return value if value in ('video/mp4','audio/mp4','audio/mpeg','application/octet-stream','text/plain','text/html') else 'other'

def token_health():
 result={'http_status':None,'browser_started':None,'last_error':'health_unavailable'}
 try:
  key=(root/'data/browser-v39.key').read_text().strip()
  class NoRedirect(urllib.request.HTTPRedirectHandler):
   def redirect_request(self,*a,**kw):return None
  opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
  req=urllib.request.Request('http://127.0.0.1:4417/health',headers={'Authorization':'Bearer '+key})
  with opener.open(req,timeout=3) as response:
   value=json.loads(response.read(16000));result['http_status']=response.status;result['browser_started']=value.get('browser_started') is True
   error=value.get('last_error')
   allowed={'browser_timeout','browser_start_failed','webpo_unavailable','webpo_not_ready','webpo_invalid_response','browser_mint_failed','browser_token_unavailable'}
   result['last_error']=None if error is None else error if error in allowed else 'other'
 except urllib.error.HTTPError as error:result['http_status']=error.code
 except Exception:pass
 return result


def selected_transport(source,filename):
 tree=ast.parse(source)
 klass=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Playback')
 methods=[n for n in klass.body if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name in ('http','upstream')]
 if len(methods)!=2:raise ValueError()
 klass.body=methods
 code=ast.Module(body=[klass],type_ignores=[]);ast.fix_missing_locations(code)
 ns={'aiohttp':aiohttp,'asyncio':asyncio,'web':web,'urlsplit':urlsplit,'urljoin':__import__('urllib.parse',fromlist=['urljoin']).urljoin,'RANGE':re.compile(r'^bytes=(?:[0-9]{1,12}-[0-9]{0,12}|-[0-9]{1,12})$'),'AudioUnavailable':audio_module.AudioUnavailable}
 exec(compile(code,filename,'exec'),ns)
 transport=ns['Playback']();transport.sessions={};transport.proxy_active=collections.Counter();transport.allowed=audio_module.allowed_audio_url
 return transport

def ytdlp_sample(audio,options):
 opts=dict(options,logger=Quiet(),quiet=True,no_warnings=True,cachedir=False,socket_timeout=5,retries=0)
 with tempfile.TemporaryDirectory(prefix='wakhan-cdn-cookie-') as folder:
  if opts.get('cookiefile'):
   cookie=Path(opts.pop('cookiefile'))
   if cookie.is_file():
    copy=Path(folder)/'cookies.txt';shutil.copyfile(cookie,copy);copy.chmod(0o600);opts['cookiefile']=str(copy)
  try:
   with yt_dlp.YoutubeDL(opts) as ydl:
    headers=dict(audio.get('headers') or {},Range='bytes=0-65535',**{'Accept-Encoding':'identity'})
    response=ydl.urlopen(Request(audio['url'],headers=headers))
    try:return {'http_status':int(response.status),'mime':mime(response.headers.get('Content-Type')),'sample_bytes':len(response.read(65536))}
    finally:response.close()
  except Exception as error:return {'reason':reason(error)}
class Quiet:
 def debug(self,*a):pass
 def warning(self,*a):pass
 def error(self,*a):pass

async def decode(url):
 content="ffconcat version 1.0\nfile '"+url+"'\n"
 args=['ffmpeg','-hide_banner','-nostdin','-v','info','-rw_timeout','6000000','-protocol_whitelist','pipe,file,http,https,tcp,tls,crypto','-probesize','2097152','-analyzeduration','5000000','-f','concat','-safe','0','-i','pipe:0','-map','0:a:0','-vn','-t','1','-f','null','-']
 env=os.environ.copy()
 for key in ('http_proxy','HTTP_PROXY','https_proxy','HTTPS_PROXY','all_proxy','ALL_PROXY'):env.pop(key,None)
 env['no_proxy']=env['NO_PROXY']='127.0.0.1,localhost'
 process=await asyncio.create_subprocess_exec(*args,stdin=asyncio.subprocess.PIPE,stdout=asyncio.subprocess.DEVNULL,stderr=asyncio.subprocess.PIPE,env=env)
 task=asyncio.create_task(process.communicate(content.encode()));timed_out=False
 try:_,log=await asyncio.wait_for(asyncio.shield(task),15)
 except asyncio.TimeoutError:
  timed_out=True
  if process.returncode is None:process.kill()
  _,log=await task
 text=log.decode('utf-8','replace');codec=re.search(r'Audio:\s*([A-Za-z0-9_]+)',text)
 result={'exit_code':process.returncode,'timed_out':timed_out,'audio_track_seen':bool(codec)}
 if codec:result['codec']=codec[1] if codec[1] in ('aac','mp3','opus','vorbis') else 'other'
 if process.returncode or timed_out:result['reason']='network_timeout' if timed_out else reason(text)
 return result

async def main():
 report={'service_changed':False,'code_changed':False,'extractor_version':__version__,'diagnostic_metadata_budget_seconds':34,'token_health_before':token_health()}
 tree=ast.parse((root/'app_core.py').read_text());nodes=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='_opts' or isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='YT_OPTS' for t in n.targets)]
 if len(nodes)!=2:raise ValueError()
 ns={'os':os,'re':re,'yt_dlp':yt_dlp,'DATA':str(root/'data'),'CACHE':str(root/'cache')};exec(compile(ast.Module(body=nodes,type_ignores=[]),'existing-source-options','exec'),ns)
 original=ns['_opts']
 def options(**kw):
  value=original(**kw);value['js_runtimes']={'node':{'path':str(root/'youtube-js-v2/bin/node')}};value['remote_components']=[];return value
 namespace={'_opts':options}
 bootstrap=stage/'audio-entry.py'
 # This public temporary wrapper is already prepared by the root launcher.
 worker=functools.partial(audio_module.run_worker,command=[sys.executable,str(bootstrap),str(root),str(stage/'wakhan_music/audio_resolver.py')],source_root=root)
 resolver=audio_module.AudioResolver(namespace,worker=worker)
 transport=selected_transport((root/'wakhan_music/playback.py').read_bytes(),'reviewed-playback-transport')
 runner=None;responses=[]
 original_http=transport.http
 def observed_http(proxy):
  session=original_http(proxy)
  if not getattr(session,'_wk_diagnostic_wrapped',False):
   request=session.request
   async def observed(*a,**kw):
    response=await request(*a,**kw)
    peer=response.connection.transport.get_extra_info('peername') if response.connection and response.connection.transport else None
    responses.append({'http_status':response.status,'mime':mime(response.headers.get('Content-Type')),'peer_ip_version':family(peer[0]) if peer else None})
    return response
   session.request=observed;session._wk_diagnostic_wrapped=True
  return session
 transport.http=observed_http
 try:
  event('metadata');metadata_started=time.monotonic()
  try:audio=await resolver.get('https://www.youtube.com/watch?v=HKDb1xi2uGE','youtube')
  except Exception as error:
   report['metadata']={'ok':False,'reason':reason(error),'seconds':round(time.monotonic()-metadata_started,2),'error_code':getattr(error,'code',None) if getattr(error,'code',None) in ('audio_timeout','audio_unavailable','youtube_setup','source_busy') else None,'source_reason':getattr(error,'reason',None) if getattr(error,'reason',None) in getattr(audio_module,'SOURCE_REASONS',()) else None};report['token_health_after']=token_health();return report
  proxy=audio.get('proxy');scheme=urlsplit(proxy).scheme if proxy else 'none'
  bound=(parse_qs(urlsplit(audio['url']).query).get('ip') or [''])[0]
  report['token_health_after']=token_health()
  report['metadata']={'ok':True,'seconds':round(time.monotonic()-metadata_started,2),'muxed':audio.get('muxed') is True,'signed_ip_version':family(bound),'proxy_type':scheme if scheme in ('none','http','https','socks4','socks4a','socks5','socks5h') else 'other'}
  value=dict(audio,provider='youtube');event('aiohttp_cdn')
  try:
   response,_=await transport.upstream(value,'bytes=0-65535')
   try:report['aiohttp_cdn']={'sample_bytes':len(await asyncio.wait_for(response.content.read(65536),6))}
   finally:response.close()
  except Exception as error:report['aiohttp_cdn']={'reason':reason(error)}
  if responses:report['aiohttp_cdn'].update(responses[-1])
  event('ytdlp_cdn');report['ytdlp_cdn']=await asyncio.wait_for(asyncio.to_thread(ytdlp_sample,audio,options()),8)
  if report['aiohttp_cdn'].get('http_status') not in (200,206):return report
  secret=secrets.token_hex(24)
  async def relay(req):
   if req.match_info['secret']!=secret:raise web.HTTPForbidden()
   upstream=None;out=None
   try:
    upstream,_=await transport.upstream(value,req.headers.get('Range'))
    headers={k:v for k,v in upstream.headers.items() if k.lower() in ('content-type','content-length','content-range','accept-ranges')}
    out=web.StreamResponse(status=upstream.status,headers=headers);await out.prepare(req)
    async for chunk in upstream.content.iter_chunked(32768):await out.write(chunk)
    await out.write_eof();return out
   except (ConnectionError,asyncio.CancelledError):
    if out is not None:return out
    raise
   except Exception:
    if out is not None:return out
    raise web.HTTPBadGateway() from None
   finally:
    if upstream is not None:upstream.close()
  app=web.Application();app.router.add_get('/{secret}/audio.m4a',relay)
  runner=web.AppRunner(app,access_log=None,shutdown_timeout=1);await runner.setup()
  site=web.TCPSite(runner,'127.0.0.1',0);await site.start();port=site._server.sockets[0].getsockname()[1]
  event('local_relay_decode');report['local_relay_decode']=await decode('http://127.0.0.1:'+str(port)+'/'+secret+'/audio.m4a')
  report['relay_http_responses']=responses[-4:]
  return report
 finally:
  if runner:await runner.cleanup()
  await resolver.close()
  for session in transport.sessions.values():await session.close()

spec=importlib.util.spec_from_file_location('_wk_transport_audio',stage/'wakhan_music/audio_resolver.py');audio_module=importlib.util.module_from_spec(spec);spec.loader.exec_module(audio_module)
try:print(json.dumps(asyncio.run(main())))
except Exception as error:print(json.dumps({'diagnostic_failed':True,'reason':reason(error),'service_changed':False,'code_changed':False}))
'''
BOOTSTRAP="import sys,runpy;from pathlib import Path;root,source=Path(sys.argv[1]),sys.argv[2];sys.path[:0]=[str(root/'youtube-js-v2/libs'),str(root)];sys.argv=[source,'--worker'];runpy.run_path(source,run_name='__main__')\n"


def extend_diagnostic_budget(stage):
    # Only the downloaded temporary diagnostic copy changes. APP sources and
    # production playback budgets stay exactly as they were.
    path=stage/'wakhan_music/audio_resolver.py';source=path.read_text()
    if source.count('timeout=12, command=None')!=1 or source.count('asyncio.shield(task), 14)')!=1:
        raise RuntimeError('DIAGNOSTIC_BUDGET_SHAPE_CHANGED')
    source=source.replace('timeout=12, command=None','timeout=32, command=None').replace('asyncio.shield(task), 14)','asyncio.shield(task), 34)')
    compile(source,'temporary-diagnostic-audio','exec');path.write_text(source)


def main():
    global CHECK_STAGE
    CHECK_STAGE='launcher_validation'
    if os.geteuid()!=0:raise ValueError()
    if hashlib.sha256(INSTALLER.read_bytes()).hexdigest()!=PIN:raise ValueError()
    CHECK_STAGE='installer_import'
    spec=importlib.util.spec_from_file_location('_wk_transport_installer',INSTALLER)
    module=importlib.util.module_from_spec(spec);sys.dont_write_bytecode=True;spec.loader.exec_module(module)
    CHECK_STAGE='source_validation'
    module.current(module.APP)
    CHECK_STAGE='service_context'
    owner,python,env=module.service_context(module.APP)
    CHECK_STAGE='private_runtime'
    if not (module.APP/'youtube-js-v2/bin/node').is_file():raise ValueError()
    with tempfile.TemporaryDirectory(prefix='wakhan-transport-diagnostic-') as folder:
        CHECK_STAGE='temporary_source_download'
        stage=Path(folder);module.fetch_payload(stage)
        extend_diagnostic_budget(stage)
        (stage/'audio-entry.py').write_text(BOOTSTRAP);(stage/'audio-entry.py').chmod(0o644)
        (stage/'transport-check.py').write_text(CHILD);(stage/'transport-check.py').chmod(0o644)
        os.chown(stage,owner.pw_uid,owner.pw_gid)
        print('بررسی مستقیم فایل و رمزگشایی مسیر موقت محلی؛ بدون نصب یا تغییر سرویس.',flush=True)
        CHECK_STAGE='child_start'
        process=subprocess.Popen([python,str(stage/'transport-check.py'),str(module.APP),str(stage)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,cwd=module.APP,env=dict(env,PYTHONDONTWRITEBYTECODE='1'),user=owner.pw_uid,group=owner.pw_gid,extra_groups=[],start_new_session=True)
        try:
            CHECK_STAGE='child_execution'
            out,err=process.communicate(timeout=80)
            CHECK_STAGE='child_result'
            if len(out)>16000:raise ValueError()
            value=json.loads(out)
        except subprocess.TimeoutExpired:
            try:os.killpg(process.pid,signal.SIGKILL)
            except ProcessLookupError:pass
            out,err=process.communicate();stages=[v[8:] for v in err.decode('utf-8','replace').splitlines() if v.startswith('WKSTAGE ')]
            value={'diagnostic_timeout':True,'last_stage':stages[-1] if stages and stages[-1] in ('metadata','aiohttp_cdn','ytdlp_cdn','local_relay_decode') else 'unknown','service_changed':False,'code_changed':False}
        print(json.dumps(value,ensure_ascii=False,indent=2))


if __name__=='__main__':
    try:main()
    except Exception as error:
        allowed={'CURRENT_SOURCE_CHANGED','CURRENT_RUNTIME_CHANGED','SOURCE_FILE_UNAVAILABLE','PARTIAL_UPDATE_REQUIRES_REVIEW','WAKHAN_NOT_ACTIVE','UNREVIEWED_SERVICE_USER','UNREVIEWED_SERVICE_COMMAND','RUNTIME_LOCATION_CHANGED','COMMAND_UNAVAILABLE_OR_TIMEOUT','SERVICE_OR_CHECK_COMMAND_FAILED','DOWNLOAD_CHECKSUM_FAILED','DIAGNOSTIC_BUDGET_SHAPE_CHANGED'}
        print(json.dumps({'diagnostic_failed':True,'stage':CHECK_STAGE,'error_type':type(error).__name__,'error_code':str(error) if isinstance(error,RuntimeError) and str(error) in allowed else None,'http_status':error.code if isinstance(error,urllib.error.HTTPError) else None,'service_changed':False,'code_changed':False},ensure_ascii=False,indent=2))
        raise SystemExit(1)
