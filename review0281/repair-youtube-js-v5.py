#!/usr/bin/env python3
"""Owner-operated private JS runtime repair, followed by the reviewed server updater."""
import argparse
import ast
import re
import hashlib
import importlib.util
import json
import os
from pathlib import Path,PurePosixPath
import platform
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.request
import zipfile

INSTALLER=Path('/root/wakhan-fix-youtube-muxed.py')
INSTALLER_URL='https://raw.githubusercontent.com/rahimidaniyal27-netizen/Wakhan-App/0295fc02c57947e3e053c1df916a9e6934e0f7f3/review0281/apply-youtube-muxed.py'
BACKUPS=Path('/root')
INSTALLER_SHA='6c090c6f2462df996bb4b4ee3cb4a06e1e38c1710f23b77930f397178028ad0f'
CONFIG_REFERENCE="import copy\nimport importlib\nfrom pathlib import Path\nimport sys\nimport threading\n_loaded = False\n_lock = threading.RLock()\n\ndef configure(options):\n    global _loaded\n    root = Path(__file__).resolve().parent\n    with _lock:\n        if not _loaded:\n            location = str(root / 'youtube-v39-plugin')\n            if location not in sys.path:\n                sys.path.insert(0, location)\n            importlib.invalidate_caches()\n            importlib.import_module('yt_dlp_plugins.extractor.wakhan_browser_provider')\n            _loaded = True\n    result = dict(options)\n    args = copy.deepcopy(result.get('extractor_args') or {})\n    args.setdefault('youtube', {})['player_client'] = ['mweb']\n    args['youtube']['fetch_pot'] = ['auto']\n    args.setdefault('youtubepot-wakhanbrowser', {})['key_file'] = [str(root / 'data/browser-v39.key')]\n    result['extractor_args'] = args\n    return result\n"
VIDEO_BEFORE='a57068d5f802d2d95297ad21726b149cac26cab40b8caa2fb2405212516790cc'
VIDEO_AFTER='b3f9d7b78b7d2f748fd3ae88d1b6d6200cf5eca3c3a6932c6f30cd6de32564d0'
VIDEO_URL='https://raw.githubusercontent.com/rahimidaniyal27-netizen/Wakhan-App/35bc2ada850a42ba66c301367385d5411a9c80b1/review0281/video-followup-v2/wakhan_room_video_resolver.py'
NODE_URL='https://nodejs.org/dist/v24.22.3/node-v24.22.3-linux-x64.tar.xz'
NODE_SHA='4f2b175a6d53a5c617a80dba2676238a0688cef28c6da4eba35c7d844e66fcfb'
EJS_URL='https://files.pythonhosted.org/packages/e3/bd/520769863744b669440a924271a6159ddd82ad5ae26b4ac4d4b69e9f8d44/yt_dlp_ejs-0.8.0-py3-none-any.whl'
EJS_SHA='79300e5fca7f937a1eeede11f0456862c1b41107ce1d726871e0207424f4bdb4'
EXTRACTOR_URL='https://files.pythonhosted.org/packages/30/1e/f4bf64ca733135e609696c6df77a6c22c6d4909b6e293e4563ae51ea335c/yt_dlp-2026.11.23-py3-none-any.whl'
EXTRACTOR_SHA='e9188e0c559905f7ee05acc1ba0b6fb3f310e7565bf6dea5f62b5300e0775e35'


def require(value,code):
    if not value:raise RuntimeError(code)


def sha(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()


def patch_config(raw):
    # Accept only the reviewed behavior, including whitespace/comment-only variants.
    tree=ast.parse(raw)
    digest=hashlib.sha256(ast.dump(tree,include_attributes=False).encode()).hexdigest()
    # AST display defaults differ across Python releases. Compare both trees
    # under this interpreter instead of comparing a precomputed display hash.
    expected=ast.dump(ast.parse(CONFIG_REFERENCE),include_attributes=False)
    if ast.dump(tree,include_attributes=False)!=expected:
        print('شناسهٔ ساختار تنظیمات فعلی:',digest,flush=True)
        raise RuntimeError('YOUTUBE_CONFIGURATION_CHANGED')
    function=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='configure')
    root=next(n for n in function.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='root' for t in n.targets))
    result=function.body[-1]
    require(isinstance(result,ast.Return),'CONFIGURATION_SHAPE_CHANGED')
    lines=raw.decode().splitlines(keepends=True)
    newline='\r\n' if any(v.endswith('\r\n') for v in lines) else '\n'
    indent=re.match('[ \t]*',lines[root.lineno-1]).group()
    insert=["runtime=root/'youtube-js-v2'","libs=str(runtime/'libs')","if libs not in sys.path:sys.path.insert(0,libs)"]
    before_return=["result['js_runtimes']={'node':{'path':str(runtime/'bin/node')}}","result['remote_components']=[]"]
    lines[result.lineno-1:result.lineno-1]=[indent+line+newline for line in before_return]
    lines[root.end_lineno:root.end_lineno]=[indent+line+newline for line in insert]
    source=''.join(lines);compile(source,'reviewed-youtube-configuration','exec')
    return source.encode()


def fetch(url,digest,path,limit):
    started=time.monotonic();total=0
    with urllib.request.urlopen(url,timeout=20) as response,path.open('xb') as output:
        while True:
            chunk=response.read(1024*1024)
            if not chunk:break
            total+=len(chunk)
            require(total<=limit and time.monotonic()-started<180,'RUNTIME_DOWNLOAD_LIMIT')
            output.write(chunk)
    require(sha(path)==digest,'RUNTIME_DOWNLOAD_CHECKSUM_FAILED')


def unpack(node,wheel,target,extractor):
    (target/'bin').mkdir(parents=True)
    (target/'libs').mkdir()
    with tarfile.open(node,'r:xz') as archive:
        member=archive.getmember('node-v24.22.3-linux-x64/bin/node')
        require(member.isfile() and not member.issym() and 0<member.size<200_000_000,'UNEXPECTED_NODE_ARCHIVE')
        with archive.extractfile(member) as src,(target/'bin/node').open('xb') as dst:shutil.copyfileobj(src,dst)
    (target/'bin/node').chmod(0o755)
    with zipfile.ZipFile(wheel) as archive:
        require(archive.testzip() is None and sum(v.file_size for v in archive.infolist())<4_000_000,'UNEXPECTED_EJS_ARCHIVE')
        for item in archive.infolist():
            name=PurePosixPath(item.filename)
            require(not name.is_absolute() and '..' not in name.parts and not stat.S_ISLNK(item.external_attr>>16),'UNSAFE_EJS_ARCHIVE')
            require(name.parts[0] in ('yt_dlp_ejs','yt_dlp_ejs-0.8.0.dist-info'),'UNEXPECTED_EJS_CONTENT')
            path=target/'libs'/str(name)
            if item.is_dir():path.mkdir(parents=True,exist_ok=True);continue
            path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(archive.read(item));path.chmod(0o644)
    unpack_extractor(extractor,target/'libs')
    for path in [target,*target.rglob('*')]:
        if path.is_dir():path.chmod(0o755)
    metadata={'node_archive_sha256':NODE_SHA,'ejs_wheel_sha256':EJS_SHA,'extractor_wheel_sha256':EXTRACTOR_SHA,
              'files':{str(path.relative_to(target)):sha(path) for path in target.rglob('*') if path.is_file()}}
    (target/'runtime.json').write_text(json.dumps(metadata,indent=2)+'\n');(target/'runtime.json').chmod(0o644)


def unpack_extractor(wheel,target):
    with zipfile.ZipFile(wheel) as archive:
        require(archive.testzip() is None and sum(v.file_size for v in archive.infolist())<40_000_000,'UNEXPECTED_EXTRACTOR_ARCHIVE')
        for item in archive.infolist():
            name=PurePosixPath(item.filename)
            require(not name.is_absolute() and '..' not in name.parts and not stat.S_ISLNK(item.external_attr>>16),'UNSAFE_EXTRACTOR_ARCHIVE')
            # Wheel data contains documentation and shell completions; do not install those.
            if name.parts[0]=='yt_dlp-2026.11.23.data':continue
            require(name.parts[0] in ('yt_dlp','yt_dlp-2026.11.23.dist-info'),'UNEXPECTED_EXTRACTOR_CONTENT')
            path=target/str(name)
            if item.is_dir():path.mkdir(parents=True,exist_ok=True);continue
            path.parent.mkdir(parents=True,exist_ok=True)
            require(not path.exists(),'EXTRACTOR_FILE_COLLISION')
            path.write_bytes(archive.read(item));path.chmod(0o644)


def run(module,args,owner,env,**kwargs):
    return module.command(args,cwd=module.APP,env=env,user=owner.pw_uid,group=owner.pw_gid,extra_groups=[],**kwargs)


def restore_config(module,backup,record):
    path=module.APP/'wakhan_youtube_v39.py'
    require(sha(path) in (record['configuration_before'],record['after']),'ROLLBACK_CONFIGURATION_CHANGED')
    require(sha(backup/'configuration.py')==record['configuration_before'],'ROLLBACK_BACKUP_CHANGED')
    patch_config((backup/'configuration.py').read_bytes())
    module.atomic(path,(backup/'configuration.py').read_bytes(),record['uid'],record['gid'],record['mode'])


def restore_video(module,backup,record):
    path=module.APP/'wakhan_room_video_resolver.py'
    require(sha(path) in (VIDEO_BEFORE,VIDEO_AFTER),'ROLLBACK_VIDEO_SOURCE_CHANGED')
    require(sha(backup/'video.py')==VIDEO_BEFORE,'ROLLBACK_VIDEO_BACKUP_CHANGED')
    module.atomic(path,(backup/'video.py').read_bytes(),record['video_uid'],record['video_gid'],record['video_mode'])


def write_state(backup,value):
    path=backup/'restore.json';path.write_text(json.dumps(value,indent=2)+'\n');path.chmod(0o600)


def runtime_valid(runtime):
    if not runtime.is_dir() or runtime.is_symlink():return False
    try:
        data=json.loads((runtime/'runtime.json').read_text())
        if data.get('node_archive_sha256')!=NODE_SHA or data.get('ejs_wheel_sha256')!=EJS_SHA or data.get('extractor_wheel_sha256')!=EXTRACTOR_SHA:return False
        files=data['files']
        actual={str(p.relative_to(runtime)) for p in runtime.rglob('*') if p.is_file() and p.name!='runtime.json'}
        if set(files)!=actual or not {'bin/node','libs/yt_dlp_ejs/__init__.py','libs/yt_dlp/version.py'}<=actual:return False
        return all(not (runtime/name).is_symlink() and sha(runtime/name)==digest for name,digest in files.items())
    except (OSError,ValueError,KeyError,TypeError):return False


def load_installer():
    spec=importlib.util.spec_from_file_location('_wk_server_installer',INSTALLER)
    module=importlib.util.module_from_spec(spec);sys.dont_write_bytecode=True;spec.loader.exec_module(module)
    return module


DIAGNOSTIC=r'''
import ast,json,os,re,shutil,sys,tempfile
from pathlib import Path
root=Path(sys.argv[1]);sys.dont_write_bytecode=True
sys.path[:0]=[str(root/'youtube-js-v2/libs'),str(root)]
import yt_dlp
from yt_dlp.version import __version__
flags=set()
def reason(text):
 text=str(text).lower()
 if 'challenge' in text or 'signature extraction' in text or 'nsig' in text:return 'challenge_failed'
 if 'javascript runtime' in text:return 'runtime_unavailable'
 if 'sabr' in text:return 'sabr'
 if 'token' in text and any(v in text for v in ('fail','missing','unavailable','error')):return 'token_failed'
 if 'sign in to confirm' in text or 'not a bot' in text:return 'verification_required'
 if 'format' in text:return 'formats_unavailable'
 return 'other_warning'
class Quiet:
 def debug(self,*args):pass
 def warning(self,text,*args):flags.add(reason(text))
 def error(self,text,*args):flags.add(reason(text))
result={'extractor_version':__version__,'metadata_ok':False,'node_available':False,'ejs_available':False}
try:
 import yt_dlp_ejs
 result['ejs_available']=yt_dlp_ejs.version=='0.8.0'
 tree=ast.parse((root/'app_core.py').read_text())
 nodes=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='_opts' or isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='YT_OPTS' for t in n.targets)]
 if len(nodes)!=2:raise ValueError()
 ns={'os':os,'re':re,'yt_dlp':yt_dlp,'DATA':str(root/'data'),'CACHE':str(root/'cache')}
 exec(compile(ast.Module(body=nodes,type_ignores=[]),'current-source-options','exec'),ns)
 opts=ns['_opts'](skip_download=True,quiet=True,no_warnings=True,logger=Quiet(),cachedir=False,socket_timeout=5,retries=0,extractor_retries=0)
 with tempfile.TemporaryDirectory(prefix='wakhan-private-source-check-') as folder:
  if opts.get('cookiefile'):
   path=Path(opts['cookiefile']);opts.pop('cookiefile')
   if path.is_file():
    copy=Path(folder)/'cookies.txt';shutil.copyfile(path,copy);copy.chmod(0o600);opts['cookiefile']=str(copy)
  opts['paths']={'temp':folder}
  with yt_dlp.YoutubeDL(opts) as ydl:
   runtime=ydl._js_runtimes.get('node')
   result['node_available']=bool(runtime and runtime.info and runtime.info.supported)
   info=ydl.extract_info('https://www.youtube.com/watch?v=HKDb1xi2uGE',download=False,process=False)
   formats=info.get('formats') or []
   result.update(metadata_ok=True,format_count=len(formats),audio_count=sum(f.get('acodec') not in (None,'none') for f in formats),audio_only_count=sum(f.get('acodec') not in (None,'none') and f.get('vcodec')=='none' for f in formats),muxed_count=sum(f.get('acodec') not in (None,'none') and f.get('vcodec') not in (None,'none') for f in formats))
except Exception as error:flags.add(reason(error))
result['warnings']=sorted(flags)
print(json.dumps(result))
'''


def report_candidate(module,python,owner,env):
    try:
        raw=run(module,[python,'-c',DIAGNOSTIC,module.APP],owner,env,timeout=22)
        value=json.loads(raw)
        output={key:value.get(key) is True for key in ('metadata_ok','node_available','ejs_available')}
        if re.fullmatch(r'[0-9.]{1,20}',str(value.get('extractor_version',''))):output['extractor_version']=value['extractor_version']
        for key in ('format_count','audio_count','audio_only_count','muxed_count'):
            if type(value.get(key)) is int and 0<=value[key]<=10000:output[key]=value[key]
        allowed={'challenge_failed','runtime_unavailable','sabr','token_failed','verification_required','formats_unavailable','other_warning'}
        output['warnings']=[v for v in value.get('warnings',[]) if isinstance(v,str) and v in allowed]
        print('گزارش تکمیلی دریافت:',json.dumps(output,ensure_ascii=False),flush=True)
    except Exception:print('گزارش تکمیلی: DIAGNOSTIC_TIMEOUT_OR_UNAVAILABLE',flush=True)


def ensure_installer():
    if INSTALLER.exists():
        require(INSTALLER.is_file() and not INSTALLER.is_symlink() and sha(INSTALLER)==INSTALLER_SHA,'REVIEWED_UPDATER_CHANGED')
        return
    with tempfile.TemporaryDirectory(prefix='wakhan-muxed-updater-',dir=BACKUPS) as folder:
        target=Path(folder)/'installer.py'
        fetch(INSTALLER_URL,INSTALLER_SHA,target,2_000_000)
        compile(target.read_bytes(),'reviewed-muxed-updater','exec');target.chmod(0o600)
        require(not INSTALLER.exists(),'UPDATER_CHANGED_DURING_DOWNLOAD')
        os.replace(target,INSTALLER)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    mode=parser.add_mutually_exclusive_group(required=True);mode.add_argument('--apply',action='store_true');mode.add_argument('--rollback',type=Path)
    args=parser.parse_args()
    require(os.geteuid()==0,'RUN_AS_ROOT')
    ensure_installer()
    require(sha(INSTALLER)==INSTALLER_SHA,'REVIEWED_UPDATER_CHANGED')
    module=load_installer()
    module.current(module.APP,allow_partial=bool(args.rollback));owner,python,env=module.service_context(module.APP)
    env=dict(env,PYTHONDONTWRITEBYTECODE='1')
    if args.rollback:
        backup=args.rollback.resolve()
        require(backup.parent==BACKUPS and backup.name.startswith('wakhan-youtube-js-backup-'),'INVALID_BACKUP')
        record=json.loads((backup/'restore.json').read_text())
        require(sha(backup/'configuration.py')==record.get('configuration_before'),'UNREVIEWED_BACKUP')
        patch_config((backup/'configuration.py').read_bytes())
        code=Path(record['code_backup']) if record.get('code_backup') else None
        if code:
            require(code.parent==BACKUPS and code.name.startswith('wakhan-youtube-code-backup-'),'INVALID_CODE_BACKUP')
        # Validate config before stopping anything; code restore validates every source.
        require(sha(module.APP/'wakhan_youtube_v39.py') in (record['configuration_before'],record['after']),'ROLLBACK_CONFIGURATION_CHANGED')
        require(sha(backup/'configuration.py')==record['configuration_before'],'ROLLBACK_BACKUP_CHANGED')
        try:
            module.command(['systemctl','stop',module.SERVICE])
            if code:module.restore(module.APP,code)
            restore_video(module,backup,record)
            restore_config(module,backup,record)
        finally:module.command(['systemctl','start',module.SERVICE])
        print('کد و تنظیم اجرای جاوااسکریپت برگشتند؛ داده‌های کاربران بازگردانی یا حذف نشدند.');return
    require(platform.machine()=='x86_64','UNSUPPORTED_MACHINE')
    require(module.current(module.APP) is False,'SERVER_UPDATE_ALREADY_INSTALLED_REQUIRES_REVIEW')
    configuration=module.APP/'wakhan_youtube_v39.py'
    require(configuration.is_file() and not configuration.is_symlink(),'YOUTUBE_CONFIGURATION_UNAVAILABLE')
    raw=configuration.read_bytes();patched=patch_config(raw)
    original_sha=hashlib.sha256(raw).hexdigest()
    video=module.APP/'wakhan_room_video_resolver.py'
    require(video.is_file() and not video.is_symlink() and sha(video)==VIDEO_BEFORE,'VIDEO_SOURCE_CHANGED')
    # Read the existing extractor's required solver version as the actual service user.
    version=run(module,[python,'-c','from yt_dlp.extractor.youtube.jsc._builtin import vendor;print(vendor.VERSION)'],owner,env).decode().strip()
    print('نسخهٔ موردنیاز حل‌کننده:',version,flush=True)
    require(version=='0.8.0','EXTRACTOR_SOLVER_VERSION_REQUIRES_REVIEW')
    runtime=module.APP/'youtube-js-v2'
    require(not runtime.exists() or runtime_valid(runtime),'PRIVATE_RUNTIME_ALREADY_EXISTS_REQUIRES_REVIEW')
    backup=Path(tempfile.mkdtemp(prefix='wakhan-youtube-js-backup-',dir=BACKUPS));backup.chmod(0o700)
    s=configuration.stat();record={'configuration_before':original_sha,'after':hashlib.sha256(patched).hexdigest(),
         'uid':s.st_uid,'gid':s.st_gid,'mode':stat.S_IMODE(s.st_mode),'installed':False,'code_backup':None}
    vs=video.stat();record.update(video_uid=vs.st_uid,video_gid=vs.st_gid,video_mode=stat.S_IMODE(vs.st_mode))
    (backup/'video.py').write_bytes(video.read_bytes());(backup/'video.py').chmod(0o600)
    (backup/'configuration.py').write_bytes(raw);(backup/'configuration.py').chmod(0o600);write_state(backup,record)
    print('دریافت Node، حل‌کننده و نسخهٔ جدید دریافت یوتیوب با checksum ثابت، در مسیر جداگانهٔ واخان.',flush=True)
    if not runtime.exists():
        with tempfile.TemporaryDirectory(prefix='wakhan-js-download-') as folder:
            stage=Path(folder);node=stage/'node.tar.xz';wheel=stage/'ejs.whl';extractor=stage/'extractor.whl'
            fetch(NODE_URL,NODE_SHA,node,70_000_000);fetch(EJS_URL,EJS_SHA,wheel,2_000_000);fetch(EXTRACTOR_URL,EXTRACTOR_SHA,extractor,6_000_000)
            incoming=Path(tempfile.mkdtemp(prefix='.youtube-js-new-',dir=module.APP))
            try:
                unpack(node,wheel,incoming,extractor)
                # Only the unprivileged service user executes the runtime/package.
                require(run(module,[incoming/'bin/node','--version'],owner,env).strip()==b'v24.22.3','NODE_RUNTIME_NOT_READY')
                require(run(module,[incoming/'bin/node','--permission','-e','console.log(2+2)'],owner,env).strip()==b'4','NODE_EXECUTION_FAILED')
                code='import sys;sys.path.insert(0,sys.argv[1]);import yt_dlp_ejs,yt_dlp_ejs.yt.solver;from yt_dlp.version import __version__;assert __version__=="2026.11.23";assert yt_dlp_ejs.version=="0.8.0";assert len(yt_dlp_ejs.yt.solver.core())>100;print("ok")'
                require(run(module,[python,'-c',code,incoming/'libs'],owner,env).strip()==b'ok','EJS_PACKAGE_NOT_READY')
                require(sha(configuration)==original_sha and not runtime.exists(),'SOURCE_CHANGED_DURING_DOWNLOAD')
                os.replace(incoming,runtime)
            finally:
                if incoming.exists():shutil.rmtree(incoming)
    video_payload=backup/'video-after.py'
    fetch(VIDEO_URL,VIDEO_AFTER,video_payload,2_000_000)
    compile(video_payload.read_bytes(),'reviewed-video-worker','exec')
    require(sha(configuration)==original_sha and sha(video)==VIDEO_BEFORE,'SOURCE_CHANGED_BEFORE_REPAIR')
    before=set(BACKUPS.glob('wakhan-youtube-code-backup-*'))
    print('اجرای بررسی و نصب اصلاح سرور؛ نیازی به نسخهٔ نصبی جدید گوشی نیست.',flush=True)
    try:
        module.atomic(configuration,patched,record['uid'],record['gid'],record['mode'])
        module.atomic(video,video_payload.read_bytes(),record['video_uid'],record['video_gid'],record['video_mode'])
        result=subprocess.run([sys.executable,str(INSTALLER),'--apply','--link','https://youtu.be/HKDb1xi2uGE'],timeout=180)
        after=set(BACKUPS.glob('wakhan-youtube-code-backup-*'))-before
        require(len(after)<=1,'UNEXPECTED_PARALLEL_UPDATE')
        if after:record['code_backup']=str(next(iter(after)))
        write_state(backup,record)
        if result.returncode!=0:report_candidate(module,python,owner,env)
        require(result.returncode==0,'SERVER_PREFLIGHT_OR_AUDIO_VERIFICATION_FAILED')
        require(module.current(module.APP),'SERVER_UPDATE_NOT_CONFIRMED')
        record['installed']=True;write_state(backup,record)
    except BaseException:
        candidates=set(BACKUPS.glob('wakhan-youtube-code-backup-*'))-before
        if len(candidates)==1:record['code_backup']=str(next(iter(candidates)))
        write_state(backup,record)
        try:
            module.command(['systemctl','stop',module.SERVICE])
            if record['code_backup']:module.restore(module.APP,Path(record['code_backup']))
            restore_video(module,backup,record)
            restore_config(module,backup,record)
        finally:module.command(['systemctl','start',module.SERVICE])
        print('تنظیم قبلی جاوااسکریپت برگشت. پشتیبان خصوصی:',backup,flush=True)
        print('مسیر runtime خصوصی حفظ شد؛ چیزی از داده‌های کاربران حذف نشد.',flush=True)
        raise
    print('اصلاح جاوااسکریپت و سرور نصب شد؛ رمزگشایی آهنگ یوتیوب روی سرور تأیید شد.')
    print('پشتیبان خصوصی:',backup)
    print('برگشت بدون حذف داده: python3 /root/wakhan-repair-youtube-js-v5.py --rollback '+str(backup))
    print('حالا آهنگ یوتیوب را داخل و بیرون سالون دوباره انتخاب کن و صدای گوشی را امتحان کن.')


if __name__=='__main__':
    try:main()
    except Exception as error:
        code=str(error) if isinstance(error,RuntimeError) and __import__('re').fullmatch('[A-Z_]+',str(error)) else 'JS_REPAIR_STOPPED_WITHOUT_EXPOSING_PRIVATE_DETAILS'
        raise SystemExit('STOP: '+code)
