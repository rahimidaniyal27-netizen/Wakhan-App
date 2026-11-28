#!/usr/bin/env python3
"""Collect bounded, sanitized server evidence. No installation, restart or SQL writes."""
import argparse
import ast
import collections
import contextlib
import datetime
import hashlib
import hmac
import importlib.util
import io
import json
import os
from pathlib import Path
import platform
import re
import shutil
import signal
import sqlite3
import stat
import struct
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import zipfile

APP=Path('/opt/wakhan-app-0.2.11-li9z037x')
BROWSER=Path('/opt/wakhan-browser-v39')
STATE=Path('/var/lib/wakhan-browser-v39')
ASSETS={
 'installer.py':('0295fc02c57947e3e053c1df916a9e6934e0f7f3','review0281/apply-youtube-muxed.py','6c090c6f2462df996bb4b4ee3cb4a06e1e38c1710f23b77930f397178028ad0f'),
 'browser.py':('a10025a15614c528108f1246558dc653d13c4e41','review0281/check-browser-start.py','f935e0ede95be83a7b916ca255f3de0c09f1e3030376bc980e267a2d0ae2f36e'),
 'transport.py':('acfcedd19a595d9d631497cb69bd8053c95c4aaa','review0281/check-youtube-transport-v3.py','7e67551a883f4c122d41adc3e767c9b59ee64731e49eeb5f04c2930ae8109e28'),
}
KNOWN_PUBLIC=set('''55273ec14f750d170fe183ebfaa27b0e67be9f8536d3ff682a217794535fe7e4
5a67810a8c6c9113c1531dc160757d57954c3c869b8fd40fe3737c95eb610441
70877678abc1a36e0200120ebb09eb40d5d0b23202f2d54f9fe302157d6463b7
ec1a3bc495a09c786281334845028e0890907a3957edefc8f629a6f1bda98987'''.split())
PUBLIC_LITERALS=set('''youtube soundcloud extractor_args player_client fetch_pot mweb web tv auto node deno bun quickjs js_runtimes remote_components path ejs:github ejs:npm youtubepot-wakhanbrowser key_file data/browser-v39.key youtube-v39-plugin yt_dlp_plugins.extractor.wakhan_browser_provider cookiefile http_headers proxy /usr/bin/node /usr/local/bin/node /usr/bin/deno /usr/local/bin/deno youtube-js-v1 youtube-js-v2 libs bin/node'''.split())
SERVICE_FIELDS=('ActiveState','SubState','User','Group','MainPID','NRestarts','Result','Restart','RestartUSec','MemoryCurrent','MemoryPeak','MemoryMax','TasksCurrent','KillMode','PrivateTmp','PrivateNetwork','ProtectSystem','NoNewPrivileges','StandardOutput','StandardError','WatchdogUSec','TimeoutStartUSec','OOMPolicy')
LOG_RULES={
 'out_of_memory':('out of memory','oom-kill','killed process'),
 'display_failure':('missing x server','cannot open display','authorization required','ozone_platform_x11','failed to initialize platform'),
 'sandbox_failure':('no usable sandbox','suid sandbox','operation not permitted'),
 'profile_lock':('singletonlock','profile appears to be in use','processsingleton'),
 'browser_start_failure':('browser_start_failed','failed to connect to browser'),
 'timeout':('timeout','timed out'), 'source_failure':('source_unavailable','no_readable_video','audio_unavailable'),
 'http_403':('403 forbidden','http error 403'), 'http_502':('502 bad gateway','http error 502'),
 'sqlite_locked':('database is locked',),'sqlite_error':('sqlite3.','database disk image is malformed'),
 'permission_failure':('permission denied',),'disk_full':('no space left on device',),
 'websocket_failure':('websocket','invalidstatus'), 'python_exception':('traceback (most recent call last)',),
}


def digest(raw):return hashlib.sha256(raw).hexdigest()

def command(args,timeout=8,**kw):
    try:
        p=subprocess.run([str(v) for v in args],stdin=subprocess.DEVNULL,capture_output=True,timeout=timeout,**kw)
        return p.returncode,p.stdout[:2_000_000],p.stderr[:64_000]
    except (OSError,subprocess.TimeoutExpired):return None,b'',b''

def metadata(path):
    try:
        s=path.lstat()
        return {'exists':True,'mode':format(stat.S_IMODE(s.st_mode),'04o'),'uid':s.st_uid,'gid':s.st_gid,'symlink':stat.S_ISLNK(s.st_mode),'bytes':s.st_size}
    except OSError:return {'exists':False}

def json_member(value):return (json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()


def source_review(raw):
    """Unknown source is never exported with arbitrary literal strings or comments."""
    tree=ast.parse(raw)
    if digest(raw) in KNOWN_PUBLIC:return raw,'verified_public_source'
    class SecretValues(ast.NodeTransformer):
        def sensitive(self,label):
            return bool(re.search(r'SECRET|PASSWORD|PASSWD|TOKEN|API_HASH|API_KEY|PRIVATE_KEY|AUTH_KEY|SIGN_KEY|SESSION_KEY|MASTERKEY|SMTP_PASS',label,re.I))
        def visit_Assign(self,node):
            labels=[v.id if isinstance(v,ast.Name) else v.attr if isinstance(v,ast.Attribute) else '' for v in node.targets]
            if any(self.sensitive(v) for v in labels):node.value=ast.Constant(value='<redacted>');return node
            return self.generic_visit(node)
        def visit_AnnAssign(self,node):
            label=node.target.id if isinstance(node.target,ast.Name) else ''
            if self.sensitive(label):node.value=ast.Constant(value='<redacted>');return node
            return self.generic_visit(node)
        def visit_Dict(self,node):
            for index,key in enumerate(node.keys):
                if isinstance(key,ast.Constant) and isinstance(key.value,str) and self.sensitive(key.value):node.values[index]=ast.Constant(value='<redacted>')
            return self.generic_visit(node)
    tree=SecretValues().visit(tree);ast.fix_missing_locations(tree)
    for node in ast.walk(tree):
        if isinstance(node,ast.Constant):
            if isinstance(node.value,str) and node.value not in PUBLIC_LITERALS:node.value='<redacted>'
            elif isinstance(node.value,bytes):node.value=b'<redacted>'
            elif type(node.value) in (int,float) and (abs(node.value)>65535 or node.value!=node.value):node.value=0
    return ('# Sanitized review copy. DO NOT DEPLOY.\n'+ast.unparse(tree)+'\n').encode(),'sanitized_source'


def sources(app):
    files={};facts={};paths=[]
    for folder in (app,app/'wakhan_music',app/'wakhan_media'):
        if folder.is_dir():paths.extend(sorted(folder.glob('*.py'))[:80])
    paths.extend([BROWSER/'browser_helper.py',BROWSER/'wakhan_browser_provider.py',app/'youtube-v39-plugin/yt_dlp_plugins/extractor/wakhan_browser_provider.py'])
    total=0
    for path in paths:
        label='app/'+str(path.relative_to(app)) if path.is_relative_to(app) else 'browser/'+path.name
        try:
            if path.is_symlink() or not path.is_file() or path.stat().st_size>1_000_000:continue
            raw=path.read_bytes();total+=len(raw)
            if total>8_000_000:break
            facts[label]={'sha256':digest(raw),'bytes':len(raw),'mode':metadata(path).get('mode')}
            content,kind=source_review(raw);facts[label]['review']=kind;files['source/'+label]=content
        except (OSError,SyntaxError,ValueError,RecursionError):facts[label]={'review':'unavailable_or_not_parseable'}
    return files,facts


def service(name):
    rc,out,_=command(['systemctl','show',name,'--property='+','.join(SERVICE_FIELDS)])
    if rc:return {'available':False}
    values=dict(line.split('=',1) for line in out.decode('utf-8','replace').splitlines() if '=' in line)
    result={key:values.get(key,'') for key in SERVICE_FIELDS}
    for key in ('MainPID','NRestarts','MemoryCurrent','MemoryPeak','TasksCurrent'):
        try:result[key]=int(result[key])
        except (ValueError,TypeError):result[key]=None
    return result


def process_context(pid,expected_script):
    if not isinstance(pid,int) or pid<=0:return None
    proc=Path('/proc')/str(pid)
    try:
        args=[os.fsdecode(v) for v in (proc/'cmdline').read_bytes().split(b'\0') if v]
        if not any(Path(v).name==expected_script for v in args[1:]):return None
        env={}
        for value in (proc/'environ').read_bytes().split(b'\0'):
            if b'=' in value:
                key,entry=value.split(b'=',1);env[os.fsdecode(key)]=os.fsdecode(entry)
        cwd=(proc/'cwd').resolve();python=args[0] if Path(args[0]).is_absolute() else str(cwd/args[0])
        return {'python':python,'args':args,'env':dict(env,PYTHONDONTWRITEBYTECODE='1'),'uid':proc.stat().st_uid,'gid':proc.stat().st_gid,'cwd':cwd,'pid':pid}
    except (OSError,ValueError):return None


def process_snapshot(pid):
    result={'process_counts':{},'oom_events':{}}
    if not isinstance(pid,int) or pid<=0:return result
    proc=Path('/proc')/str(pid)
    try:
        cgroup=next(v.split(':',2)[2] for v in (proc/'cgroup').read_text().splitlines() if v.startswith('0::'))
        base=(Path('/sys/fs/cgroup')/cgroup.lstrip('/')).resolve()
        if not base.is_relative_to(Path('/sys/fs/cgroup')):return result
        counts=collections.Counter();xservers=[]
        for text in (base/'cgroup.procs').read_text().split()[:4096]:
            if not text.isdigit():continue
            p=Path('/proc')/text
            try:
                args=[os.fsdecode(v) for v in (p/'cmdline').read_bytes().split(b'\0') if v]
                name=Path(args[0]).name if args else 'other';kind=name if name in ('chrome','chrome_crashpad_handler','Xvfb','ffmpeg','ffprobe') else 'python' if name.startswith('python') else 'other'
                counts[kind]+=1
                if name=='Xvfb':xservers.append({'noreset':'-noreset' in args,'no_tcp':'-nolisten' in args and 'tcp' in args,'auth_option':'-auth' in args})
            except OSError:pass
        result.update(process_counts=dict(counts),xserver_flags=xservers)
        for filename in ('memory.events','memory.events.local'):
            try:result['oom_events'][filename]={line.split()[0]:int(line.split()[1]) for line in (base/filename).read_text().splitlines() if len(line.split())==2}
            except (OSError,ValueError):pass
    except (OSError,StopIteration,ValueError):pass
    return result


def log_summary(name):
    rc,out,_=command(['journalctl','-u',name,'--since','24 hours ago','-n','600','-o','json','--no-pager'],timeout=10)
    counts=collections.Counter();last={};seen=0
    for line in out.decode('utf-8','replace').splitlines():
        try:
            value=json.loads(line);message=value.get('MESSAGE','')
            if not isinstance(message,str):continue
            seen+=1;text=message.lower()
            for key,patterns in LOG_RULES.items():
                if any(pattern in text for pattern in patterns):
                    counts[key]+=1
                    if str(value.get('__REALTIME_TIMESTAMP','')).isdigit():last[key]=int(value['__REALTIME_TIMESTAMP'])
        except (ValueError,TypeError):pass
    return {'available':rc==0,'records_scanned':seen,'fixed_error_counts':dict(counts),'last_event_microseconds':last,'raw_log_exported':False}


def browser_state(pid=None):
    result={'xauthority':metadata(STATE/'Xauthority'),'chrome':metadata(BROWSER/'chrome-linux64/chrome'),'sandbox':metadata(BROWSER/'chrome-linux64/chrome_sandbox'),'service_key_permissions':metadata(BROWSER/'service.key'),'profile_lock_present':(STATE/'profile/SingletonLock').is_symlink() or (STATE/'profile/SingletonLock').exists()}
    try:
        target=os.readlink(STATE/'profile/SingletonLock');pid=target.rsplit('-',1)[-1]
        result['profile_lock_pid_alive']=pid.isdigit() and (Path('/proc')/pid).exists()
    except OSError:pass
    try:
        raw=(STATE/'Xauthority').read_bytes()[:4096];offset=2;fields=[]
        for _ in range(4):
            size=struct.unpack('>H',raw[offset:offset+2])[0];offset+=2;fields.append(raw[offset:offset+size]);offset+=size
        number=fields[1].decode('ascii')
        if isinstance(pid,int) and pid>0 and re.fullmatch('[0-9]{1,5}',number):
            socket=Path('/proc')/str(pid)/'root/tmp/.X11-unix'/('X'+number)
            result['live_namespace_display_socket_present']=stat.S_ISSOCK(socket.stat().st_mode) if socket.exists() else False
    except (OSError,ValueError,struct.error,IndexError):pass
    return result


def read_settings(ctx):
    if not ctx:return {}
    args=ctx['args']
    try:
        if '--config' not in args:return {}
        path=Path(args[args.index('--config')+1]);path=path if path.is_absolute() else ctx['cwd']/path
        value=json.loads(path.read_text());settings={key:value[key] for key in ('database','session_key_file','base','data') if isinstance(value.get(key),str)}
        settings['_config_path']=path
        return settings
    except (OSError,ValueError,IndexError):return {}

DB_CHILD=r'''
import collections,contextlib,json,os,re,sqlite3,sys,time
from pathlib import Path
value=json.loads(sys.stdin.read(16000));path=Path(value['database']);started=time.monotonic();result={'read_only':True}
try:
 with contextlib.closing(sqlite3.connect(path.resolve().as_uri()+'?mode=ro',uri=True,timeout=3)) as db:
  db.execute('PRAGMA query_only=ON');db.set_progress_handler(lambda:1 if time.monotonic()-started>10 else 0,10000)
  row=db.execute('PRAGMA quick_check(1)').fetchone();result['quick_check_ok']=bool(row and row[0]=='ok')
  for key in ('page_count','page_size','freelist_count','journal_mode'):result[key]=db.execute('PRAGMA '+key).fetchone()[0]
  tables={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
  result['table_counts']={name:db.execute('SELECT count(*) FROM "'+name+'"').fetchone()[0] for name in ('wka_accounts','wka_sessions','wm51_halls') if name in tables}
  if 'wm51_halls' in tables:
   columns={r[1] for r in db.execute('PRAGMA table_info(wm51_halls)')}
   if {'name','photo'}<=columns:
    counts=collections.Counter();modes=collections.Counter();folder=Path(value['photos'])
    for name,key in db.execute('SELECT name,photo FROM wm51_halls'):
     counts['total']+=1;counts['configured']+=bool(str(name or '').strip());counts['photo_assigned']+=bool(key)
     if not key:continue
     if not isinstance(key,str) or not re.fullmatch('[a-f0-9]{32}[.]jpg',key):counts['invalid_photo_keys']+=1;continue
     f=folder/key
     if f.is_symlink() or not f.is_file():counts['missing_photo_files']+=1
     else:counts['existing_photo_files']+=1;modes[format(f.stat().st_mode&0o777,'04o')]+=1
    result['salons']=dict(counts);result['photo_modes']=dict(modes)
 result['completed']=True
except Exception as e:result.update(completed=False,error_type=type(e).__name__)
print(json.dumps(result))
'''

def database_review(ctx,settings,app):
    if not ctx or not settings.get('database'):return {'available':False}
    path=Path(settings['database']);path=path if path.is_absolute() else ctx['cwd']/path
    args=[ctx['python'],'-c',DB_CHILD]
    try:
        p=subprocess.run(args,input=json.dumps({'database':str(path),'photos':str(app/'data/wm51_halls')}).encode(),capture_output=True,timeout=15,cwd=ctx['cwd'],env=ctx['env'],user=ctx['uid'],group=ctx['gid'],extra_groups=[])
        result=json.loads(p.stdout);result['permissions']=metadata(path);return result
    except Exception:return {'available':False,'diagnostic_failed':True}


def dependencies(ctx,names):
    if not ctx:return {'available':False}
    code="import importlib.metadata,json,sys;out={'python':'.'.join(map(str,sys.version_info[:3]))};\nfor name in sys.argv[1:]:\n try:out[name]=importlib.metadata.version(name)\n except importlib.metadata.PackageNotFoundError:out[name]=None\nprint(json.dumps(out))"
    rc,out,_=command([ctx['python'],'-c',code,*names],cwd=ctx['cwd'],env=ctx['env'],user=ctx['uid'],group=ctx['gid'],extra_groups=[])
    try:return json.loads(out) if rc==0 else {'available':False}
    except ValueError:return {'available':False}


def token_health(app):
    result={'http_status':None,'browser_started':None,'last_error':'unavailable'}
    try:
        key=(app/'data/browser-v39.key').read_text().strip()
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self,*a,**kw):return None
        opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
        req=urllib.request.Request('http://127.0.0.1:4417/health',headers={'Authorization':'Bearer '+key})
        with opener.open(req,timeout=3) as response:
            value=json.loads(response.read(16000));error=value.get('last_error')
            result.update(http_status=response.status,browser_started=value.get('browser_started') is True,last_error=error if error in ('browser_timeout','browser_start_failed','webpo_unavailable','webpo_not_ready','webpo_invalid_response','browser_mint_failed',None) else 'other')
    except urllib.error.HTTPError as error:result['http_status']=error.code
    except Exception:pass
    return result


def http_review():
    result={};opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for path in ('/health','/api/app/config','/api/app/latest','/api/app/music/chart'):
        started=time.monotonic()
        try:
            with opener.open('http://127.0.0.1:10010'+path,timeout=4) as response:
                body=response.read(32000);entry={'status':response.status,'milliseconds':round(1000*(time.monotonic()-started),1)}
                if path=='/api/app/config':
                    value=json.loads(body);entry['readiness']={key:bool(value.get(key)) for key in ('email','google','native_google','apple')}
                if path=='/api/app/latest':
                    value=json.loads(body);entry['build']=value.get('build') if type(value.get('build')) is int else None
                    entry['version']=str(value.get('version')) if re.fullmatch('[0-9A-Za-z.+_-]{1,40}',str(value.get('version'))) else 'other'
                result[path]=entry
        except urllib.error.HTTPError as error:result[path]={'status':error.code}
        except Exception:result[path]={'status':None,'failed':True}
    for label,url in (('public_latest','https://music.kabulcafe.uk/api/app/latest'),('public_health','https://music.kabulcafe.uk/health')):
        started=time.monotonic()
        try:
            with opener.open(url,timeout=4) as response:
                result[label]={'status':response.status,'milliseconds':round(1000*(time.monotonic()-started),1),'security_headers_present':{name:bool(response.headers.get(name)) for name in ('Strict-Transport-Security','Content-Security-Policy','X-Content-Type-Options')}}
        except urllib.error.HTTPError as error:result[label]={'status':error.code}
        except Exception as error:result[label]={'status':None,'error_type':type(error).__name__}
    return result


def host_review(app):
    result={'system':platform.system(),'kernel':platform.release(),'machine':platform.machine(),'review_python':platform.python_version(),'load_average':list(os.getloadavg())}
    try:result['memory_kib']={line.split(':',1)[0]:int(line.split()[1]) for line in Path('/proc/meminfo').read_text().splitlines() if line.split(':',1)[0] in ('MemTotal','MemAvailable','SwapTotal','SwapFree')}
    except (OSError,ValueError):pass
    try:
        usage=shutil.disk_usage(app);v=os.statvfs(app);result['disk']={'total_bytes':usage.total,'used_bytes':usage.used,'free_bytes':usage.free,'free_inodes':v.f_favail}
    except OSError:pass
    return result


def fetch_asset(name,stage):
    commit,path,sha=ASSETS[name]
    url='https://raw.githubusercontent.com/rahimidaniyal27-netizen/Wakhan-App/'+commit+'/'+path
    with urllib.request.urlopen(url,timeout=20) as response:raw=response.read(2_000_001)
    if len(raw)>2_000_000 or digest(raw)!=sha:raise ValueError('ASSET_CHECKSUM')
    compile(raw,name,'exec');target=stage/name;target.write_bytes(raw);target.chmod(0o600);return target

PROBE_WRAPPER="import contextlib,importlib.util,io,json,sys;name,path,installer=sys.argv[1:];spec=importlib.util.spec_from_file_location('_wk_full_'+name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.INSTALLER=__import__('pathlib').Path(installer);stream=io.StringIO();\ntry:\n with contextlib.redirect_stdout(stream):m.main()\n raw=stream.getvalue();at=raw.find('{');value=json.loads(raw[at:]);print(json.dumps(value))\nexcept Exception as e:\n print(json.dumps({'diagnostic_failed':True,'error_type':type(e).__name__}))\n"

def run_probe(name,stage,timeout):
    try:
        path=fetch_asset(name+'.py',stage)
        p=subprocess.Popen([sys.executable,'-c',PROBE_WRAPPER,name,str(path),str(stage/'installer.py')],stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
        try:out,_=p.communicate(timeout=timeout)
        except subprocess.TimeoutExpired:
            try:os.killpg(p.pid,signal.SIGKILL)
            except ProcessLookupError:pass
            p.communicate();return {'diagnostic_timeout':True}
        value=json.loads(out)
        return value if isinstance(value,dict) else {'diagnostic_failed':True}
    except Exception as error:return {'diagnostic_failed':True,'error_type':type(error).__name__}


def private_runtimes(app):
    result={}
    for name in ('youtube-js-v1','youtube-js-v2'):
        folder=app/name;node=folder/'bin/node';info={'directory':metadata(folder),'node':metadata(node)}
        try:
            data=json.loads((folder/'runtime.json').read_text());files=data.get('files') or {};info['manifest_file_count']=len(files)
            expected=files.get('bin/node')
            if node.is_file() and not node.is_symlink() and node.stat().st_size<200_000_000 and re.fullmatch('[a-f0-9]{64}',str(expected)):
                h=hashlib.sha256()
                with node.open('rb') as stream:
                    for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
                info['node_matches_manifest']=h.hexdigest()==expected
        except (OSError,ValueError,TypeError,AttributeError):pass
        for label,file,variable in (('extractor','libs/yt_dlp/version.py','__version__'),('ejs','libs/yt_dlp_ejs/_version.py','version')):
            try:
                path=folder/file
                if path.stat().st_size>20000:continue
                tree=ast.parse(path.read_bytes())
                for entry in tree.body:
                    if isinstance(entry,ast.Assign) and any(isinstance(t,ast.Name) and t.id==variable for t in entry.targets) and isinstance(entry.value,ast.Constant) and isinstance(entry.value.value,str) and re.fullmatch('[0-9.]{1,30}',entry.value.value):info[label+'_version']=entry.value.value
            except (OSError,ValueError,SyntaxError):pass
        result[name]=info
    return result


def previous_playback_reports(directory=Path('/root')):
    results=[]
    try:paths=sorted(directory.glob('wakhan-youtube-fix-result-*.zip'),key=lambda p:p.stat().st_mtime,reverse=True)[:6]
    except OSError:return results
    for path in paths:
        try:
            if path.is_symlink() or path.stat().st_size>300_000:continue
            with zipfile.ZipFile(path) as archive:
                info=archive.getinfo('RESULT.json')
                if info.file_size>200_000:continue
                value=json.loads(archive.read(info))
            item={key:value.get(key) is True for key in ('installed','rolled_back')}
            pre=value.get('source_precheck') or {};item['source_precheck_ok']=pre.get('ok') is True
            audio=value.get('youtube_audio') or {};safe={}
            for key in ('audio_track_seen','audio_signal_confirmed'):
                if type(audio.get(key)) is bool:safe[key]=audio[key]
            if type(audio.get('exit_code')) is int and -255<=audio['exit_code']<=255:safe['exit_code']=audio['exit_code']
            if audio.get('status') in ('signal_present','decoded_silence','decode_unconfirmed','decode_timeout'):safe['status']=audio['status']
            if audio.get('codec') in ('aac','mp3','opus','vorbis'):safe['codec']=audio['codec']
            item['audio']=safe;results.append(item)
        except (OSError,ValueError,KeyError,zipfile.BadZipFile,TypeError):pass
    return results


def collect(app=APP,output=Path('/root'),run_probes=True):
    print('۱/۵ بررسی سرویس‌ها، منابع و خطاهای سرور…',flush=True)
    report={'created_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'application_changed':False,'services_restarted':False,'database_rows_exported':False,'scope':'server and playback; phone UI reproduction is separate'}
    report['host']=host_review(app);report['services']={name:service(name) for name in ('wakhan-app.service','wakhan-youtube-browser.service','nginx.service')}
    report['logs']={name:log_summary(name) for name in ('wakhan-app.service','wakhan-youtube-browser.service')}
    report['processes']={name:process_snapshot(report['services'][name].get('MainPID')) for name in ('wakhan-app.service','wakhan-youtube-browser.service')}
    app_ctx=process_context(report['services']['wakhan-app.service'].get('MainPID'),'native_runtime.py');browser_ctx=process_context(report['services']['wakhan-youtube-browser.service'].get('MainPID'),'browser_helper.py')
    print('۲/۵ بررسی سلامت دیتابیس، مجوزها و وابستگی‌ها…',flush=True)
    settings=read_settings(app_ctx);report['database']=database_review(app_ctx,settings,app)
    report['private_runtimes']=private_runtimes(app)
    report['dependencies']={'app':dependencies(app_ctx,['aiohttp','aiohttp-socks','yt-dlp','yt-dlp-ejs','google-auth','cryptography']),'browser':dependencies(browser_ctx,['nodriver','websockets','wrapt'])}
    report['permissions']={'photo_directory':metadata(app/'data/wm51_halls'),'browser':browser_state(report['services']['wakhan-youtube-browser.service'].get('MainPID'))}
    for key,label in (('session_key_file','session_key'),('_config_path','runtime_configuration')):
        if settings.get(key):
            path=Path(settings[key]);path=path if path.is_absolute() else app_ctx['cwd']/path;report['permissions'][label]=metadata(path)
    try:
        report['permissions']['token_key_files_match']=hmac.compare_digest((app/'data/browser-v39.key').read_bytes().strip(),(BROWSER/'service.key').read_bytes().strip())
    except OSError:pass
    print('۳/۵ بررسی پاسخ API و تهیهٔ نسخهٔ امن سورس…',flush=True)
    report['http']=http_review();report['token_health']=token_health(app);report['previous_playback_reports']=previous_playback_reports();payload,report['source']=sources(app)
    with tempfile.TemporaryDirectory(prefix='wakhan-complete-review-') as folder:
        stage=Path(folder)
        print('۴/۵ بررسی مستقل اجرای مرورگر…',flush=True)
        if run_probes:report['browser_start_probe']=run_probe('browser',stage,30)
        else:report['browser_start_probe']={'skipped':'probe_disabled'}
        print('۵/۵ بررسی دریافت و رمزگشایی پخش…',flush=True)
        if run_probes and report['token_health'].get('browser_started') is True:
            try:
                fetch_asset('installer.py',stage);report['transport_probe']=run_probe('transport',stage,95)
            except Exception as error:report['transport_probe']={'diagnostic_failed':True,'error_type':type(error).__name__}
        else:report['transport_probe']={'skipped':'token_browser_unavailable' if run_probes else 'probe_disabled'}
    report['findings']=[]
    if report['token_health'].get('browser_started') is False:report['findings'].append('TOKEN_BROWSER_NOT_RUNNING')
    if report['database'].get('quick_check_ok') is False:report['findings'].append('DATABASE_CHECK_FAILED')
    if report['browser_start_probe'].get('error_flags'):report['findings'].extend('BROWSER_'+v.upper() for v in report['browser_start_probe']['error_flags'])
    payload['REPORT.json']=json_member(report)
    payload['README-fa.txt']='این بسته شامل گزارش سرور و سورس‌های عمومی یا پاک‌سازی‌شده است. نسخه‌های پاک‌سازی‌شده برای نصب نیستند. دیتابیس، کلیدها، تنظیمات خصوصی، عکس کاربران و متن خام لاگ‌ها ارسال نشده‌اند. سرویس‌ها ری‌استارت نشده‌اند. بررسی سرور جای آزمایش کیبورد و رابط کاربری روی گوشی را نمی‌گیرد.\n'.encode()
    output.mkdir(parents=True,exist_ok=True)
    fd,name=tempfile.mkstemp(prefix='wakhan-complete-review-'+time.strftime('%Y%m%d-%H%M%S')+'-',suffix='.zip',dir=output);os.close(fd)
    result=Path(name);result.chmod(0o600)
    with zipfile.ZipFile(result,'w',zipfile.ZIP_DEFLATED) as archive:
        for name,raw in payload.items():archive.writestr(name,raw)
    print('بستهٔ گزارش:',result)
    print('نام فایل:',result.name)
    print('تعداد فایل:',len(payload))
    print('SHA256:',digest(result.read_bytes()))
    print('یافته‌های اولیه:',', '.join(report['findings']) or 'گزارش برای بررسی دقیق آماده است')
    print('هیچ سرویس، کد برنامه، SSH، VPN یا دادهٔ کاربری تغییر نکرد.')
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,default=Path('/root'));parser.add_argument('--no-probes',action='store_true');args=parser.parse_args()
    if os.geteuid()!=0:raise SystemExit('STOP: RUN_AS_ROOT')
    collect(app=APP,output=args.output,run_probes=not args.no_probes)

if __name__=='__main__':
    try:main()
    except Exception as error:
        print(json.dumps({'review_failed':True,'error_type':type(error).__name__,'application_changed':False,'services_restarted':False},ensure_ascii=False));raise SystemExit(1)
