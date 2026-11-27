#!/usr/bin/env python3
"""Bounded standalone browser startup diagnosis; no service/code/settings updates."""
import json
import os
from pathlib import Path
import pwd
import re
import signal
import struct
import subprocess
import tempfile

ROOT=Path('/opt/wakhan-browser-v39')
STATE=Path('/var/lib/wakhan-browser-v39')
SERVICE='wakhan-youtube-browser.service'
FLAGS={'missing_library':('cannot open shared object','error while loading shared libraries'),
       'sandbox_failure':('no usable sandbox','suid sandbox','sandbox_linux','operation not permitted','failed to move to new namespace'),
       'display_failure':('missing x server','cannot open display','authorization required','ozone_platform_x11','failed to initialize platform'),
       'profile_locked':('singletonlock','profile appears to be in use','processsingleton'),
       'permission_denied':('permission denied',),
       'cdp_connection_failed':('failed to connect to browser','connection refused'),
       'event_loop_failure':('no current event loop','no running event loop','event loop is closed'),
       'websocket_failure':('websocket','invalidstatus'),
       'python_api_changed':('unexpected keyword argument','has no attribute','was never awaited')}

CHILD=r'''
import asyncio,contextlib,importlib.metadata,json,logging,os,sys,tempfile
from pathlib import Path
sys.dont_write_bytecode=True
root=Path(sys.argv[1]);chrome=root/'chrome-linux64/chrome'
sys.path.insert(0,str(root/'libs'))
logging.disable(logging.CRITICAL)
import nodriver
FLAGS=json.loads(sys.argv[2]);children=[]
async def run():
 result={'browser_connected':False,'python_version':'.'.join(map(str,sys.version_info[:3])),'error_flags':[]}
 original=asyncio.create_subprocess_exec
 async def capture(*args,**kw):
  process=await original(*args,**kw);children.append(process);return process
 asyncio.create_subprocess_exec=capture
 browser=None;error='';stderr=b''
 with tempfile.TemporaryDirectory(prefix='wakhan-browser-start-test-') as folder:
  try:
   config=nodriver.Config(browser_executable_path=str(chrome),user_data_dir=folder,headless=False,sandbox=True,
      browser_args=['--no-first-run','--disable-dev-shm-usage','--lang=en-US'])
   config._default_browser_args=[v for v in config._default_browser_args if not v.startswith('--remote-allow-origins=')]
   browser=await asyncio.wait_for(nodriver.start(config=config),12)
   result['browser_connected']=True
  except Exception as exc:
   error=str(exc).lower();result['exception_type']=type(exc).__name__ if type(exc).__name__ in ('RuntimeError','TypeError','AttributeError','TimeoutError','Exception','FileNotFoundError','PermissionError','ValueError','ConnectionError') else 'other'
  finally:
   # Stop only processes created by this isolated diagnostic. Never stop the live helper.
   for process in children:
    if process.returncode is None:
     with contextlib.suppress(ProcessLookupError):process.terminate()
    try:out,err=await asyncio.wait_for(process.communicate(),2)
    except asyncio.TimeoutError:
     with contextlib.suppress(ProcessLookupError):process.kill()
     out,err=await process.communicate()
    stderr+=(err or b'')[:65536]
    result['chrome_exit_code']=process.returncode
   result['chrome_started']=bool(children)
   message=error+' '+stderr.decode('utf-8','replace').lower()
   result['error_flags']=[key for key,patterns in FLAGS.items() if any(p in message for p in patterns)]
 print('WK_BROWSER_RESULT '+json.dumps(result),flush=True)
 await asyncio.sleep(0)
asyncio.run(run())
'''


def display_number(raw):
    """Read only the non-secret display number from the Xauthority record."""
    offset=2;fields=[]
    for _ in range(4):
        size=struct.unpack('>H',raw[offset:offset+2])[0];offset+=2
        fields.append(raw[offset:offset+size]);offset+=size
    value=fields[1].decode('ascii')
    if not re.fullmatch('[0-9]{1,5}',value):raise ValueError()
    return ':'+value


def classify(raw):
    message=raw.decode('utf-8','replace').lower()
    return [key for key,patterns in FLAGS.items() if any(v in message for v in patterns)]


def parse_child(raw):
    result={}
    for line in raw.decode('utf-8','replace').splitlines():
        if not line.startswith('WK_BROWSER_RESULT '):continue
        try:
            value=json.loads(line[18:])
            for key in ('browser_connected','chrome_started'):
                if type(value.get(key)) is bool:result[key]=value[key]
            if re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+',str(value.get('python_version',''))):result['python_version']=value['python_version']
            if type(value.get('chrome_exit_code')) is int:result['chrome_exit_code']=value['chrome_exit_code']
            if value.get('exception_type') in ('RuntimeError','TypeError','AttributeError','TimeoutError','Exception','FileNotFoundError','PermissionError','ValueError','ConnectionError','other'):result['exception_type']=value['exception_type']
            result['error_flags']=[v for v in value.get('error_flags',[]) if isinstance(v,str) and v in FLAGS]
        except (ValueError,TypeError,AttributeError):pass
    return result


def command(args,**kw):
    result=subprocess.run(args,capture_output=True,timeout=8,**kw)
    if result.returncode:raise ValueError()
    return result.stdout


def main():
    if os.geteuid()!=0:raise ValueError()
    uid=pwd.getpwnam('wakhan-browser')
    if command(['systemctl','show',SERVICE,'--property=User','--value']).strip()!=b'wakhan-browser':raise ValueError()
    pid=int(command(['systemctl','show',SERVICE,'--property=MainPID','--value']).strip())
    if pid<=0:raise ValueError()
    proc=Path('/proc')/str(pid);args=[os.fsdecode(v) for v in (proc/'cmdline').read_bytes().split(b'\0') if v]
    if str(ROOT/'browser_helper.py') not in args or '--chrome' not in args or args[args.index('--chrome')+1]!=str(ROOT/'chrome-linux64/chrome'):raise ValueError()
    env={}
    for v in (proc/'environ').read_bytes().split(b'\0'):
        if b'=' in v:
            key,value=v.split(b'=',1);env[os.fsdecode(key)]=os.fsdecode(value)
    authority=STATE/'Xauthority'
    env.update(DISPLAY=display_number(authority.read_bytes()),XAUTHORITY=str(authority),PYTHONDONTWRITEBYTECODE='1')
    chrome=ROOT/'chrome-linux64/chrome';sandbox=chrome.parent/'chrome_sandbox'
    report={'service_changed':False,'installed':False,'temporary_profile':True,
            'chrome_exists':chrome.is_file(),'xauthority_exists':authority.is_file(),
            'sandbox_root_owned':sandbox.stat().st_uid==0,'sandbox_setuid':bool(sandbox.stat().st_mode&0o4000),
            'profile_lock_exists':(STATE/'profile/SingletonLock').is_symlink() or (STATE/'profile/SingletonLock').exists()}
    ldd=subprocess.run(['ldd',str(chrome)],capture_output=True,timeout=8)
    report['missing_shared_libraries']=b'not found' in ldd.stdout
    print('آزمایش مرورگر با پروفایل موقت؛ سرویس اصلی متوقف یا تغییر نمی‌کند.',flush=True)
    # Share only the live mount namespace to reach its PrivateTmp X display.
    # Drop root before importing browser libraries or launching Chrome; sandbox stays enabled.
    cmd=['nsenter','--target',str(pid),'--mount','--','setpriv','--reuid='+str(uid.pw_uid),
         '--regid='+str(uid.pw_gid),'--clear-groups','--',args[0],'-c',CHILD,str(ROOT),json.dumps(FLAGS)]
    process=subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,cwd='/',start_new_session=True)
    try:out,err=process.communicate(timeout=20)
    except subprocess.TimeoutExpired:
        try:os.killpg(process.pid,signal.SIGKILL)
        except ProcessLookupError:pass
        out,err=process.communicate();report['probe_timeout']=True
    report.update(parse_child(out))
    if 'browser_connected' not in report:report['probe_failed']=True;report['error_flags']=classify(err)
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':
    try:main()
    except Exception:raise SystemExit('STOP: BROWSER_START_CHECK_UNAVAILABLE_NO_SERVICE_CHANGE')
