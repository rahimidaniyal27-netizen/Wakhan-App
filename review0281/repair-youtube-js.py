#!/usr/bin/env python3
"""Owner-operated private JS runtime repair, followed by the reviewed server updater."""
import argparse
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

INSTALLER=Path('/root/wakhan-fix-youtube.py')
BACKUPS=Path('/root')
INSTALLER_SHA='67d36db2fd7c5394def2f662ebd785ce9a8b7d89826d020fa52d240bd184f93d'
CONFIG_SHA='ec1a3bc495a09c786281334845028e0890907a3957edefc8f629a6f1bda98987'
NODE_URL='https://nodejs.org/dist/v24.22.3/node-v24.22.3-linux-x64.tar.xz'
NODE_SHA='4f2b175a6d53a5c617a80dba2676238a0688cef28c6da4eba35c7d844e66fcfb'
EJS_URL='https://files.pythonhosted.org/packages/e3/bd/520769863744b669440a924271a6159ddd82ad5ae26b4ac4d4b69e9f8d44/yt_dlp_ejs-0.8.0-py3-none-any.whl'
EJS_SHA='79300e5fca7f937a1eeede11f0456862c1b41107ce1d726871e0207424f4bdb4'


def require(value,code):
    if not value:raise RuntimeError(code)


def sha(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()


def patch_config(raw):
    require(hashlib.sha256(raw).hexdigest()==CONFIG_SHA,'YOUTUBE_CONFIGURATION_CHANGED')
    source=raw.decode()
    old="    root=Path(__file__).resolve().parent\n"
    require(source.count(old)==1 and source.count('    return result\n')==1,'CONFIGURATION_SHAPE_CHANGED')
    source=source.replace(old,old+"    runtime=root/'youtube-js-v1'\n    libs=str(runtime/'libs')\n    if libs not in sys.path:sys.path.insert(0,libs)\n")
    source=source.replace('    return result\n',"    result['js_runtimes']={'node':{'path':str(runtime/'bin/node')}}\n    result['remote_components']=[]\n    return result\n")
    compile(source,'reviewed-youtube-configuration','exec')
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


def unpack(node,wheel,target):
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
    for path in [target,*target.rglob('*')]:
        if path.is_dir():path.chmod(0o755)
    metadata={'node_archive_sha256':NODE_SHA,'ejs_wheel_sha256':EJS_SHA,
              'files':{str(path.relative_to(target)):sha(path) for path in target.rglob('*') if path.is_file()}}
    (target/'runtime.json').write_text(json.dumps(metadata,indent=2)+'\n');(target/'runtime.json').chmod(0o644)


def run(module,args,owner,env,**kwargs):
    return module.command(args,cwd=module.APP,env=env,user=owner.pw_uid,group=owner.pw_gid,extra_groups=[],**kwargs)


def restore_config(module,backup,record):
    path=module.APP/'wakhan_youtube_v39.py'
    require(sha(path) in (CONFIG_SHA,record['after']),'ROLLBACK_CONFIGURATION_CHANGED')
    require(sha(backup/'configuration.py')==CONFIG_SHA,'ROLLBACK_BACKUP_CHANGED')
    module.atomic(path,(backup/'configuration.py').read_bytes(),record['uid'],record['gid'],record['mode'])


def write_state(backup,value):
    path=backup/'restore.json';path.write_text(json.dumps(value,indent=2)+'\n');path.chmod(0o600)


def runtime_valid(runtime):
    if not runtime.is_dir() or runtime.is_symlink():return False
    try:
        data=json.loads((runtime/'runtime.json').read_text())
        if data.get('node_archive_sha256')!=NODE_SHA or data.get('ejs_wheel_sha256')!=EJS_SHA:return False
        files=data['files']
        actual={str(p.relative_to(runtime)) for p in runtime.rglob('*') if p.is_file() and p.name!='runtime.json'}
        if set(files)!=actual or not {'bin/node','libs/yt_dlp_ejs/__init__.py'}<=actual:return False
        return all(not (runtime/name).is_symlink() and sha(runtime/name)==digest for name,digest in files.items())
    except (OSError,ValueError,KeyError,TypeError):return False


def load_installer():
    spec=importlib.util.spec_from_file_location('_wk_server_installer',INSTALLER)
    module=importlib.util.module_from_spec(spec);sys.dont_write_bytecode=True;spec.loader.exec_module(module)
    return module


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    mode=parser.add_mutually_exclusive_group(required=True);mode.add_argument('--apply',action='store_true');mode.add_argument('--rollback',type=Path)
    args=parser.parse_args()
    require(os.geteuid()==0,'RUN_AS_ROOT')
    require(sha(INSTALLER)==INSTALLER_SHA,'REVIEWED_UPDATER_CHANGED')
    module=load_installer()
    module.current(module.APP,allow_partial=bool(args.rollback));owner,python,env=module.service_context(module.APP)
    env=dict(env,PYTHONDONTWRITEBYTECODE='1')
    if args.rollback:
        backup=args.rollback.resolve()
        require(backup.parent==BACKUPS and backup.name.startswith('wakhan-youtube-js-backup-'),'INVALID_BACKUP')
        record=json.loads((backup/'restore.json').read_text())
        require(record.get('configuration_before')==CONFIG_SHA,'UNREVIEWED_BACKUP')
        code=Path(record['code_backup']) if record.get('code_backup') else None
        if code:
            require(code.parent==BACKUPS and code.name.startswith('wakhan-youtube-code-backup-'),'INVALID_CODE_BACKUP')
        # Validate config before stopping anything; code restore validates every source.
        require(sha(module.APP/'wakhan_youtube_v39.py') in (CONFIG_SHA,record['after']),'ROLLBACK_CONFIGURATION_CHANGED')
        require(sha(backup/'configuration.py')==CONFIG_SHA,'ROLLBACK_BACKUP_CHANGED')
        try:
            module.command(['systemctl','stop',module.SERVICE])
            if code:module.restore(module.APP,code)
            restore_config(module,backup,record)
        finally:module.command(['systemctl','start',module.SERVICE])
        print('کد و تنظیم اجرای جاوااسکریپت برگشتند؛ داده‌های کاربران بازگردانی یا حذف نشدند.');return
    require(platform.machine()=='x86_64','UNSUPPORTED_MACHINE')
    require(module.current(module.APP) is False,'SERVER_UPDATE_ALREADY_INSTALLED_REQUIRES_REVIEW')
    configuration=module.APP/'wakhan_youtube_v39.py'
    require(configuration.is_file() and not configuration.is_symlink(),'YOUTUBE_CONFIGURATION_UNAVAILABLE')
    raw=configuration.read_bytes();patched=patch_config(raw)
    # Read the existing extractor's required solver version as the actual service user.
    version=run(module,[python,'-c','from yt_dlp.extractor.youtube.jsc._builtin import vendor;print(vendor.VERSION)'],owner,env).decode().strip()
    print('نسخهٔ موردنیاز حل‌کننده:',version,flush=True)
    require(version=='0.8.0','EXTRACTOR_SOLVER_VERSION_REQUIRES_REVIEW')
    runtime=module.APP/'youtube-js-v1'
    require(not runtime.exists() or runtime_valid(runtime),'PRIVATE_RUNTIME_ALREADY_EXISTS_REQUIRES_REVIEW')
    backup=Path(tempfile.mkdtemp(prefix='wakhan-youtube-js-backup-',dir=BACKUPS));backup.chmod(0o700)
    s=configuration.stat();record={'configuration_before':CONFIG_SHA,'after':hashlib.sha256(patched).hexdigest(),
         'uid':s.st_uid,'gid':s.st_gid,'mode':stat.S_IMODE(s.st_mode),'installed':False,'code_backup':None}
    (backup/'configuration.py').write_bytes(raw);(backup/'configuration.py').chmod(0o600);write_state(backup,record)
    print('دریافت Node و حل‌کننده با checksum ثابت، در مسیر جداگانهٔ واخان.',flush=True)
    if not runtime.exists():
        with tempfile.TemporaryDirectory(prefix='wakhan-js-download-') as folder:
            stage=Path(folder);node=stage/'node.tar.xz';wheel=stage/'ejs.whl'
            fetch(NODE_URL,NODE_SHA,node,70_000_000);fetch(EJS_URL,EJS_SHA,wheel,2_000_000)
            incoming=Path(tempfile.mkdtemp(prefix='.youtube-js-new-',dir=module.APP))
            try:
                unpack(node,wheel,incoming)
                # Only the unprivileged service user executes the runtime/package.
                require(run(module,[incoming/'bin/node','--version'],owner,env).strip()==b'v24.22.3','NODE_RUNTIME_NOT_READY')
                require(run(module,[incoming/'bin/node','--permission','-e','console.log(2+2)'],owner,env).strip()==b'4','NODE_EXECUTION_FAILED')
                code='import sys;sys.path.insert(0,sys.argv[1]);import yt_dlp_ejs,yt_dlp_ejs.yt.solver;assert yt_dlp_ejs.version=="0.8.0";assert len(yt_dlp_ejs.yt.solver.core())>100;print("ok")'
                require(run(module,[python,'-c',code,incoming/'libs'],owner,env).strip()==b'ok','EJS_PACKAGE_NOT_READY')
                require(sha(configuration)==CONFIG_SHA and not runtime.exists(),'SOURCE_CHANGED_DURING_DOWNLOAD')
                os.replace(incoming,runtime)
            finally:
                if incoming.exists():shutil.rmtree(incoming)
    before=set(BACKUPS.glob('wakhan-youtube-code-backup-*'))
    print('اجرای بررسی و نصب اصلاح سرور؛ نیازی به نسخهٔ نصبی جدید گوشی نیست.',flush=True)
    try:
        module.atomic(configuration,patched,record['uid'],record['gid'],record['mode'])
        result=subprocess.run([sys.executable,str(INSTALLER),'--apply','--link','https://youtu.be/HKDb1xi2uGE'],timeout=180)
        after=set(BACKUPS.glob('wakhan-youtube-code-backup-*'))-before
        require(len(after)<=1,'UNEXPECTED_PARALLEL_UPDATE')
        if after:record['code_backup']=str(next(iter(after)))
        write_state(backup,record)
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
            restore_config(module,backup,record)
        finally:module.command(['systemctl','start',module.SERVICE])
        print('تنظیم قبلی جاوااسکریپت برگشت. پشتیبان خصوصی:',backup,flush=True)
        print('مسیر runtime خصوصی حفظ شد؛ چیزی از داده‌های کاربران حذف نشد.',flush=True)
        raise
    print('اصلاح جاوااسکریپت و سرور نصب شد؛ رمزگشایی آهنگ یوتیوب روی سرور تأیید شد.')
    print('پشتیبان خصوصی:',backup)
    print('برگشت بدون حذف داده: python3 /root/wakhan-repair-youtube-js.py --rollback '+str(backup))
    print('حالا آهنگ یوتیوب را داخل و بیرون سالون دوباره انتخاب کن و صدای گوشی را امتحان کن.')


if __name__=='__main__':
    try:main()
    except Exception as error:
        code=str(error) if isinstance(error,RuntimeError) and __import__('re').fullmatch('[A-Z_]+',str(error)) else 'JS_REPAIR_STOPPED_WITHOUT_EXPOSING_PRIVATE_DETAILS'
        raise SystemExit('STOP: '+code)
