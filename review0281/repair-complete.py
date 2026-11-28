#!/usr/bin/env python3
"""Guarded repair for evidence captured 2026-11-28. No SSH/VPN/data/native-build changes."""
import argparse
import contextlib
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import pwd
import re
import signal
import stat
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import zipfile

APP=Path('/opt/wakhan-app-0.2.11-li9z037x')
ROOT=Path('/opt/wakhan-browser-v39')
STATE=Path('/var/lib/wakhan-browser-v39')
SERVICE='wakhan-youtube-browser.service'
BACKUPS=Path('/root')
BEFORE='55273ec14f750d170fe183ebfaa27b0e67be9f8536d3ff682a217794535fe7e4'
AFTER='1efc4af89c249071537684d47891b772d2b5f2abf0c7bfb6bfefce999a1a4b65'
ASSETS={
 'browser.py':('a6c3a09d7167ac5fd98d7a79c6afd9d35a6dddaf','review0281/browser-recovery/browser_helper.py',AFTER),
 'installer.py':('0295fc02c57947e3e053c1df916a9e6934e0f7f3','review0281/apply-youtube-muxed.py','6c090c6f2462df996bb4b4ee3cb4a06e1e38c1710f23b77930f397178028ad0f'),
 'app-fix.py':('9b3d0283532ed01f9623a7f9aafea4ab6bc83aa5','review0281/repair-youtube-js-v5.py','eca73e3f07f40ae33fd76616811f1e60b1283ecd726de4aaa9b0c32d2993921c'),
 'transport.py':('acfcedd19a595d9d631497cb69bd8053c95c4aaa','review0281/check-youtube-transport-v3.py','7e67551a883f4c122d41adc3e767c9b59ee64731e49eeb5f04c2930ae8109e28'),
}

def require(value,code):
    if not value:raise RuntimeError(code)

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def command(args,timeout=25,**kw):
    p=subprocess.run([str(v) for v in args],capture_output=True,timeout=timeout,**kw)
    require(p.returncode==0,'COMMAND_FAILED');return p.stdout

def fetch(name,stage):
    commit,path,expected=ASSETS[name]
    with urllib.request.urlopen('https://raw.githubusercontent.com/rahimidaniyal27-netizen/Wakhan-App/'+commit+'/'+path,timeout=20) as r:raw=r.read(2_000_001)
    require(len(raw)<=2_000_000 and hashlib.sha256(raw).hexdigest()==expected,'ASSET_CHECKSUM_FAILED')
    compile(raw,name,'exec');target=stage/name;target.write_bytes(raw);target.chmod(0o600);return target

def load(path,name):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);sys.dont_write_bytecode=True;spec.loader.exec_module(m);return m

def context():
    for key,expected in {'User':'wakhan-browser','Restart':'on-failure','KillMode':'control-group','PrivateTmp':'yes','NoNewPrivileges':'no'}.items():
        require(command(['systemctl','show',SERVICE,'--property='+key,'--value']).strip().decode()==expected,'BROWSER_SERVICE_POLICY_CHANGED')
    pid=int(command(['systemctl','show',SERVICE,'--property=MainPID','--value']).strip());require(pid>0,'BROWSER_SERVICE_NOT_RUNNING')
    proc=Path('/proc')/str(pid);args=[os.fsdecode(v) for v in (proc/'cmdline').read_bytes().split(b'\0') if v]
    require(str(ROOT/'browser_helper.py') in args,'BROWSER_COMMAND_CHANGED')
    for option,value in (('--chrome',str(ROOT/'chrome-linux64/chrome')),('--state',str(STATE)),('--key',str(ROOT/'service.key'))):
        require(option in args and args[args.index(option)+1]==value,'BROWSER_ARGUMENTS_CHANGED')
    owner=pwd.getpwnam('wakhan-browser');env={}
    for item in (proc/'environ').read_bytes().split(b'\0'):
        if b'=' in item:
            key,value=item.split(b'=',1);env[os.fsdecode(key)]=os.fsdecode(value)
    require(Path(args[0]).is_absolute(),'BROWSER_INTERPRETER_CHANGED')
    require(Path('/usr/bin/Xvfb').is_file(),'XVFB_BINARY_MISSING')
    return owner,args[0],dict(env,PYTHONDONTWRITEBYTECODE='1')

def health():
    try:
        key=(APP/'data/browser-v39.key').read_text().strip()
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self,*a,**kw):return None
        opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
        req=urllib.request.Request('http://127.0.0.1:4417/health',headers={'Authorization':'Bearer '+key})
        try:response=opener.open(req,timeout=2)
        except urllib.error.HTTPError as error:response=error
        with response:
            value=json.loads(response.read(16000));return {'http_status':response.status,'ready':value.get('ready') is True,'browser_started':value.get('browser_started') is True,'display_started':value.get('display_started') is True,'recovery_version':value.get('recovery_version') if value.get('recovery_version')==1 else None}
    except Exception:return {'http_status':None,'ready':False}

def wait_ready(seconds=60):
    deadline=time.monotonic()+seconds;success=0
    while time.monotonic()<deadline:
        value=health()
        success=success+1 if value.get('http_status')==200 and value.get('ready') and value.get('browser_started') and value.get('display_started') and value.get('recovery_version')==1 else 0
        if success>=3:return value
        time.sleep(1)
    raise RuntimeError('BROWSER_RECOVERY_NOT_READY')

def save(backup,value):
    p=backup/'STATE.json';p.write_text(json.dumps(value,indent=2)+'\n');p.chmod(0o600)

def restore_browser(module,backup,record):
    path=ROOT/'browser_helper.py';require(not path.is_symlink() and sha(path) in (BEFORE,AFTER),'BROWSER_SOURCE_CHANGED_DURING_ROLLBACK')
    require(sha(backup/'browser-before.py')==record['browser_before'],'BROWSER_BACKUP_CHANGED')
    module.atomic(path,(backup/'browser-before.py').read_bytes(),record['uid'],record['gid'],record['mode'])

def install_browser(module,source,backup,record):
    path=ROOT/'browser_helper.py'
    require(not path.is_symlink() and sha(path)==BEFORE,'BROWSER_SOURCE_CHANGED_BEFORE_INSTALL')
    try:
        command(['systemctl','stop',SERVICE])
        require(sha(path)==BEFORE,'BROWSER_SOURCE_CHANGED_DURING_INSTALL')
        module.atomic(path,source,record['uid'],record['gid'],record['mode'])
        command(['systemctl','start',SERVICE]);ready=wait_ready();record['browser_installed']=True;save(backup,record);return ready
    except BaseException:
        try:
            command(['systemctl','stop',SERVICE]);restore_browser(module,backup,record)
        finally:command(['systemctl','start',SERVICE])
        raise

def transport_test(path,installer):
    wrapper="import contextlib,importlib.util,io,json,sys;spec=importlib.util.spec_from_file_location('_wk_check',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.INSTALLER=__import__('pathlib').Path(sys.argv[2]);stream=io.StringIO();\nwith contextlib.redirect_stdout(stream):m.main()\nraw=stream.getvalue();print(json.dumps(json.loads(raw[raw.find('{'):])) )"
    p=subprocess.Popen([sys.executable,'-c',wrapper,str(path),str(installer)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
    try:out,_=p.communicate(timeout=100)
    except subprocess.TimeoutExpired:
        try:os.killpg(p.pid,signal.SIGKILL)
        except ProcessLookupError:pass
        p.communicate();return {'diagnostic_timeout':True}
    try:return json.loads(out)
    except ValueError:return {'diagnostic_failed':True}

def readable(value):
    sample=value.get('aiohttp_cdn') or {};decode=value.get('local_relay_decode') or {}
    return sample.get('http_status') in (200,206) and sample.get('sample_bytes',0)>0 and decode.get('audio_track_seen') is True and decode.get('exit_code')==0

def verify_live(module,stage):
    try:
        module.fetch_payload(stage);probe=module.probe_module(stage)
        base,token=probe.context(APP)
        status,value=probe.api(base,token,'/api/app/music/audio-start?id=yt.HKDb1xi2uGE',22)
        if status!=200 or not value.get('ok'):return {'verified':False,'preparation_status':status}
        decoded=probe.diagnose(probe.playable(value.get('src'),base))
        return {'verified':bool(decoded.get('audio_track_seen') and decoded.get('exit_code')==0),'audio':decoded}
    except Exception:return {'verified':False,'diagnostic_failed':True}


def run_app_fix(program,installer,arguments):
    # Use the pinned private backup for both apply and offline rollback.
    # Let the nested updater finish its own bounded checks and rollback;
    # killing its parent on an arbitrary wall timeout can interrupt recovery.
    wrapper="import importlib.util,pathlib,re,sys;spec=importlib.util.spec_from_file_location('_wk_app_fix',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.INSTALLER=pathlib.Path(sys.argv[2]);sys.argv=[sys.argv[1]]+sys.argv[3:];\ntry:m.main()\nexcept Exception as error:raise SystemExit('STOP: '+(str(error) if isinstance(error,RuntimeError) and re.fullmatch('[A-Z_]+',str(error)) else 'APPLICATION_REPAIR_STOPPED'))"
    return subprocess.run([sys.executable,'-c',wrapper,str(program),str(installer),*map(str,arguments)]).returncode


def report_zip(record):
    fd,name=tempfile.mkstemp(prefix='wakhan-combined-result-',suffix='.zip',dir=BACKUPS);os.close(fd)
    p=Path(name);p.chmod(0o600)
    with zipfile.ZipFile(p,'w',zipfile.ZIP_DEFLATED) as z:z.writestr('RESULT.json',json.dumps(record,ensure_ascii=False,indent=2)+'\n')
    print('گزارش نتیجه:',p);print('SHA256:',sha(p))

def main():
    parser=argparse.ArgumentParser(description=__doc__);mode=parser.add_mutually_exclusive_group(required=True);mode.add_argument('--apply',action='store_true');mode.add_argument('--rollback',type=Path);args=parser.parse_args()
    require(os.geteuid()==0,'RUN_AS_ROOT')
    with tempfile.TemporaryDirectory(prefix='wakhan-combined-stage-') as folder:
        stage=Path(folder)
        if args.rollback:
            backup=args.rollback.resolve();require(backup.parent==BACKUPS and backup.name.startswith('wakhan-combined-backup-'),'INVALID_BACKUP')
            record=json.loads((backup/'STATE.json').read_text());require(record.get('browser_before')==BEFORE,'UNREVIEWED_BACKUP')
            installer=backup/'installer.py';require(sha(installer)==ASSETS['installer.py'][2],'BACKUP_INSTALLER_CHANGED');module=load(installer,'_wk_guarded_installer')
            if record.get('application_changed'):
                program=backup/'app-fix.py';require(sha(program)==ASSETS['app-fix.py'][2],'BACKUP_APP_FIX_CHANGED');require(record.get('app_backup'),'APP_BACKUP_NOT_RECORDED')
                require(run_app_fix(program,installer,['--rollback',record['app_backup']])==0,'APP_ROLLBACK_FAILED')
            try:command(['systemctl','stop',SERVICE]);restore_browser(module,backup,record)
            finally:command(['systemctl','start',SERVICE])
            print('کدهای قبلی برگشتند؛ داده‌های کاربران بازگردانی یا حذف نشدند.');return
        installer=fetch('installer.py',stage);module=load(installer,'_wk_guarded_installer')
        already=module.current(APP);owner,python,env=context();path=ROOT/'browser_helper.py'
        require(path.is_file() and not path.is_symlink() and sha(path) in (BEFORE,AFTER),'UNREVIEWED_BROWSER_SOURCE')
        source=fetch('browser.py',stage).read_bytes()
        command([python,'-c','import sys;compile(sys.stdin.read(),"reviewed-browser-helper","exec")'],input=source,cwd=ROOT,env=env,user=owner.pw_uid,group=owner.pw_gid,extra_groups=[])
        print('۱/۳ اصلاح نظارت و بازیابی نمایشگر و مرورگر، با حفظ کلیدها و پروفایل قبلی.',flush=True)
        new_browser=sha(path)==BEFORE
        if new_browser:
            backup=Path(tempfile.mkdtemp(prefix='wakhan-combined-backup-',dir=BACKUPS));backup.chmod(0o700);st=path.stat()
            record={'browser_before':BEFORE,'browser_after':AFTER,'uid':st.st_uid,'gid':st.st_gid,'mode':stat.S_IMODE(st.st_mode),'browser_installed':False,'application_installed':already,'application_changed':False,'playback_verified':False,'app_backup':None,'native_build_created':False,'database_restored_or_deleted':False}
            (backup/'browser-before.py').write_bytes(path.read_bytes());(backup/'browser-before.py').chmod(0o600)
            (backup/'installer.py').write_bytes(installer.read_bytes());(backup/'installer.py').chmod(0o600);save(backup,record)
        else:
            candidates=[]
            for candidate in BACKUPS.glob('wakhan-combined-backup-*'):
                try:
                    value=json.loads((candidate/'STATE.json').read_text())
                    if value.get('browser_before')==BEFORE and value.get('browser_after')==AFTER and sha(candidate/'browser-before.py')==BEFORE:candidates.append((candidate.stat().st_mtime,candidate,value))
                except (OSError,ValueError):pass
            require(bool(candidates),'BROWSER_EXISTING_BACKUP_REQUIRED')
            _,backup,record=max(candidates,key=lambda v:v[0])
        try:
            record['browser_health']=install_browser(module,source,backup,record) if new_browser else wait_ready()
            print('مرورگر و نمایشگر آماده‌اند؛ نظارت بر مرگ پردازش‌ها فعال است.',flush=True)
            print('۲/۳ بررسی خواندن فایل واقعی یوتیوب پیش از تغییر برنامه.',flush=True)
            check=fetch('transport.py',stage);record['transport']=transport_test(check,installer)
            if readable(record['transport']):
                print('۳/۳ اعمال اصلاح پخش و پروفایل سالون، سپس آزمون رمزگشایی.',flush=True)
                if not already:
                    before=set(BACKUPS.glob('wakhan-youtube-js-backup-*'));program=fetch('app-fix.py',stage)
                    (backup/'app-fix.py').write_bytes(program.read_bytes());(backup/'app-fix.py').chmod(0o600)
                    app_returncode=run_app_fix(program,backup/'installer.py',['--apply'])
                    created=set(BACKUPS.glob('wakhan-youtube-js-backup-*'))-before
                    if len(created)==1:record['app_backup']=str(next(iter(created)))
                    record['application_installed']=app_returncode==0 and module.current(APP)
                    record['application_changed']=record['application_installed']
                    record['playback_verified']=record['application_installed']
                else:
                    record['application_installed']=True
                    record['live_verification']=verify_live(module,stage)
                    record['playback_verified']=record['live_verification'].get('verified') is True
            else:
                record['playback_verified']=False
                record['application_installed']=already
                print('مرورگر اصلاح شد؛ آزمون دریافت فایل هنوز موفق نیست و برنامه تغییر نکرد.',flush=True)
            save(backup,record);report_zip(record)
            print('پشتیبان خصوصی:',backup)
            print('برگشت کد بدون حذف داده: python3 /root/wakhan-repair-complete.py --rollback '+str(backup))
            if record['playback_verified']:print('اصلاح سرور و آزمون صدای یوتیوب موفق بود. حالا پخش داخل و بیرون سالون را روی گوشی امتحان کن.')
            else:print('اصلاح مرورگر حفظ شد. فایل گزارش نتیجه را برای ادامهٔ رفع مسیر پخش بفرست.')
        except BaseException:
            record['browser_health']=health();save(backup,record);report_zip(record);print('پشتیبان خصوصی:',backup);raise

if __name__=='__main__':
    try:
        with open('/root/.wakhan-combined-repair.lock','a') as lock:
            try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
            except BlockingIOError:raise RuntimeError('ANOTHER_REPAIR_IS_RUNNING')
            main()
    except Exception as error:
        value=str(error) if isinstance(error,RuntimeError) and re.fullmatch('[A-Z_]{1,100}',str(error)) else 'COMBINED_REPAIR_STOPPED'
        raise SystemExit('STOP: '+value)
