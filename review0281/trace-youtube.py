#!/usr/bin/env python3
"""Owner-only bounded YouTube diagnosis. No deployment or service/config changes."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time

INSTALLER = Path('/root/wakhan-fix-youtube.py')
PIN = '67d36db2fd7c5394def2f662ebd785ce9a8b7d89826d020fa52d240bd184f93d'
EVENTS = {'configuration', 'extraction', 'youtube_request', 'token_request', 'cdn_request', 'other_request',
          'request_returned', 'request_failed', 'metadata_ready', 'extraction_failed'}
ERRORS = {'browser_timeout', 'browser_start_failed', 'webpo_unavailable', 'webpo_not_ready',
          'webpo_invalid_response', 'browser_mint_failed', 'browser_token_unavailable'}

CHILD = r'''
import ast,importlib.util,json,os,re,sys,time,urllib.request,urllib.parse
from pathlib import Path
import yt_dlp
root,source=Path(sys.argv[1]),Path(sys.argv[2])
sys.dont_write_bytecode=True
sys.path.insert(0,str(root))
start=time.monotonic()
def event(stage):
 print('WKDIAG '+json.dumps({'stage':stage,'seconds':round(time.monotonic()-start,2)}),file=sys.stderr,flush=True)
def destination(url):
 try:
  if hasattr(url,'get_full_url'):url=url.get_full_url()
  elif hasattr(url,'url'):url=url.url
  host=urllib.parse.urlsplit(str(url)).hostname or ''
  if host=='127.0.0.1':return 'token_request'
  if host=='youtube.com' or host.endswith('.youtube.com'):return 'youtube_request'
  if host.endswith('.googlevideo.com'):return 'cdn_request'
 except Exception:pass
 return 'other_request'
# Authenticated loopback health. Never print the key, headers, URL, response text or stack.
health={'status':None,'browser_started':None,'last_error':'unavailable'}
try:
 key=(root/'data/browser-v39.key').read_text().strip()
 class NoRedirect(urllib.request.HTTPRedirectHandler):
  def redirect_request(self,*a,**kw):return None
 opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
 req=urllib.request.Request('http://127.0.0.1:4417/health',headers={'Authorization':'Bearer '+key})
 with opener.open(req,timeout=3) as response:
  value=json.loads(response.read(16000));health['status']=response.status
  health['browser_started']=value.get('browser_started') is True
  error=value.get('last_error')
  allowed={'browser_timeout','browser_start_failed','webpo_unavailable','webpo_not_ready','webpo_invalid_response','browser_mint_failed','browser_token_unavailable'}
  health['last_error']=None if error is None else error if error in allowed else 'other'
except Exception:pass
print('WKHEALTH '+json.dumps(health),file=sys.stderr,flush=True)
original_open=urllib.request.OpenerDirector.open
def traced_open(self,url,*args,**kw):
 event(destination(url))
 try:
  result=original_open(self,url,*args,**kw);event('request_returned');return result
 except BaseException:event('request_failed');raise
urllib.request.OpenerDirector.open=traced_open
original_urlopen=yt_dlp.YoutubeDL.urlopen
def traced_ydl(self,url,*args,**kw):
 event(destination(url))
 try:
  result=original_urlopen(self,url,*args,**kw);event('request_returned');return result
 except BaseException:event('request_failed');raise
yt_dlp.YoutubeDL.urlopen=traced_ydl
try:
 event('configuration')
 tree=ast.parse((root/'app_core.py').read_text())
 nodes=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='_opts' or isinstance(n,ast.Assign) and any(isinstance(v,ast.Name) and v.id=='YT_OPTS' for v in n.targets)]
 if len(nodes)!=2:raise ValueError()
 ns={'os':os,'re':re,'yt_dlp':yt_dlp,'DATA':str(root/'data'),'CACHE':str(root/'cache')}
 exec(compile(ast.Module(body=nodes,type_ignores=[]),'source-options','exec'),ns)
 spec=importlib.util.spec_from_file_location('_wk_audio_trace',source)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 raw=ns['_opts'](skip_download=True)
 allowed=('proxy','geo_verification_proxy','source_address','cookiefile','http_headers','extractor_args','js_runtimes','remote_components')
 if raw.get('proxy') is None:
  from urllib.request import getproxies,proxy_bypass
  raw['proxy']=None if proxy_bypass('www.youtube.com') else getproxies().get('https') or getproxies().get('all')
 options={k:v for k,v in raw.items() if k in allowed}
 event('extraction')
 value=module.resolve_audio('https://www.youtube.com/watch?v=HKDb1xi2uGE','youtube',options,source_root=root)
 event('metadata_ready')
 print('WKRESULT '+json.dumps({'ok':True,'kind':value.get('kind') if value.get('kind') in ('file','hls') else 'other'}),file=sys.stderr,flush=True)
except Exception as error:
 event('extraction_failed')
 reason=module.source_failure(error) if 'module' in globals() and hasattr(module,'source_failure') else 'source_extraction_failed'
 print('WKRESULT '+json.dumps({'ok':False,'reason':reason}),file=sys.stderr,flush=True)
'''


def parse_trace(raw):
    result={'events':[]}
    for line in raw.decode('utf-8','replace').splitlines():
        try:
            if line.startswith('WKDIAG '):
                value=json.loads(line[7:]);stage=value.get('stage');seconds=value.get('seconds')
                if stage in EVENTS and isinstance(seconds,(float,int)) and 0<=seconds<=60:
                    result['events'].append({'stage':stage,'seconds':seconds})
            elif line.startswith('WKHEALTH '):
                value=json.loads(line[9:])
                result['token_health']={'status':value.get('status') if value.get('status') in (None,200) else None,
                    'browser_started':value.get('browser_started') if type(value.get('browser_started')) is bool else None,
                    'last_error':value.get('last_error') if value.get('last_error') in ERRORS|{None,'other','unavailable'} else 'other'}
            elif line.startswith('WKRESULT '):
                value=json.loads(line[9:]);result['metadata_ok']=value.get('ok') is True
                if value.get('kind') in ('file','hls'):result['kind']=value['kind']
                if value.get('reason') in {'youtube_verification_required','youtube_token_service_unavailable','audio_format_unavailable','source_tls_error','source_access_denied','source_timeout','source_network_error','audio_metadata_rejected','source_extraction_failed'}:result['reason']=value['reason']
        except (ValueError,TypeError,AttributeError):continue
    result['events']=result['events'][-80:]
    return result


def main():
    if os.geteuid()!=0:raise RuntimeError('RUN_AS_ROOT')
    if hashlib.sha256(INSTALLER.read_bytes()).hexdigest()!=PIN:raise RuntimeError('REVIEWED_CHECKER_NOT_FOUND')
    spec=importlib.util.spec_from_file_location('_wk_checked_installer',INSTALLER)
    module=importlib.util.module_from_spec(spec);sys.dont_write_bytecode=True;spec.loader.exec_module(module)
    module.current(module.APP)
    owner,python,env=module.service_context(module.APP)
    env=dict(env,PYTHONDONTWRITEBYTECODE='1')
    with tempfile.TemporaryDirectory(prefix='wakhan-youtube-trace-') as directory:
        stage=Path(directory);module.fetch_payload(stage);os.chown(stage,owner.pw_uid,owner.pw_gid)
        print('بررسی مرحله‌ای یوتیوب؛ حداکثر حدود ۴۰ ثانیه، بدون نصب یا تغییر سرویس.',flush=True)
        started=time.monotonic()
        process=subprocess.Popen([python,'-c',CHILD,str(module.APP),str(stage/'wakhan_music/audio_resolver.py')],
            stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,cwd=module.APP,env=env,
            user=owner.pw_uid,group=owner.pw_gid,extra_groups=[],start_new_session=True)
        timeout=False
        try:_,raw=process.communicate(timeout=35)
        except subprocess.TimeoutExpired:
            import signal
            timeout=True
            try:os.killpg(process.pid,signal.SIGKILL)
            except ProcessLookupError:pass
            _,raw=process.communicate()
        report=parse_trace(raw)
        report.update(elapsed_seconds=round(time.monotonic()-started,2),diagnostic_timeout=timeout,
                      installed=False,service_changed=False)
        print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':
    try:main()
    except Exception:raise SystemExit('STOP: DIAGNOSTIC_UNAVAILABLE_NO_SERVICE_CHANGE')
