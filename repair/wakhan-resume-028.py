"""Resume the authorized 028 update with bounded media resolution and preserved release signing."""
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import tempfile
from upgrade_resolver028 import upgrade
from probe_diagnostics028 import sanitized

ORIGINAL=Path('/root/wakhan-update-028.py')
ORIGINAL_SHA256='56fb34c1c40f77745d85eff0c6d97ff741b77be4890771c6240c8a4c0e47b741'
PROBE_SHA256='a40fe091d4282392e10a86b09035b97dbbef5a43e01004f3fbfd4c7a58a0af4b'


def read_operator():
    if ORIGINAL.is_symlink() or hashlib.sha256(ORIGINAL.read_bytes()).hexdigest()!=ORIGINAL_SHA256:raise RuntimeError('ORIGINAL_028_INSTALLER_DIFFERS')
    spec=importlib.util.spec_from_file_location('reviewed_update028',ORIGINAL)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module


def replace_owned(operator,path,body):
    if path.is_symlink():raise RuntimeError('STAGED_CODE_SYMLINK_FORBIDDEN')
    previous=path.stat();operator.atomic(path,body,previous.st_mode&0o777);os.chown(path,previous.st_uid,previous.st_gid)


def install_media_fix(operator,root):
    path=root/'wakhan_resolver_v43.py'
    body=path.read_text();patched=upgrade(body)
    if patched!=body:replace_owned(operator,path,patched.encode())
    probe=root/'release_probe.py';new=(Path(__file__).parent/'release_probe028.py').read_bytes()
    before=probe.read_bytes()
    if before!=new:
        if hashlib.sha256(before).hexdigest()!=PROBE_SHA256:raise RuntimeError('STAGED_PROBE_REVISION_DIFFERS')
        replace_owned(operator,probe,new)
    return hashlib.sha256(patched.encode()).hexdigest()


def instrument(operator,report):
    base=operator.command
    def command(args,code='SYSTEM_COMMAND_FAILED',timeout=60,check=True,cwd=None):
        files=[Path(str(value)) for value in args if str(value).endswith('/release_probe.py')]
        if not files:return base(args,code=code,timeout=timeout,check=check,cwd=cwd)
        root=files[0].parent
        if root.parent!=Path('/opt') or not root.name.startswith('wakhan-app-0.2.8-') or root.is_symlink():raise RuntimeError('UNREVIEWED_PROBE_ROOT')
        report['stage']=str(root);report['media_patch_sha256']=install_media_fix(operator,root)
        result=base(args,code=code,timeout=timeout,check=False,cwd=cwd)
        if result.returncode:
            report['isolated_backend_failure']=sanitized(result)
            log=root/'private/resume-probe.private.log'
            fd=os.open(log,os.O_WRONLY|os.O_CREAT|os.O_TRUNC|os.O_NOFOLLOW,0o600)
            with os.fdopen(fd,'w') as stream:stream.write(result.stdout+'\n'+result.stderr)
            raise RuntimeError(code if re.fullmatch('[A-Z0-9_]+',code) else 'PROBE_FAILED')
        return result
    operator.command=command


def execute(operator,report):
    completed=operator.STATE/'completed.json';installed=operator.STATE/'installed.json'
    if completed.exists():
        previous=json.loads(completed.read_text());settings=json.loads(Path(previous['release']).joinpath('private/app.json').read_text())
        operator.wait_live(settings);report.update(previous,already_installed=True);return
    if installed.exists():
        previous=json.loads(installed.read_text())
        if not previous.get('media_repair_applied'):raise RuntimeError('UNREVIEWED_PREVIOUS_NATIVE_INSTALL')
        settings=json.loads(Path(previous['release']).joinpath('private/app.json').read_text());operator.wait_live(settings);report.update(previous)
        operator.retire_legacy(Path(previous['private_backup']),report)
        report.update(ok=True,legacy_accounts_removed_or_absent=True);operator.atomic(completed,json.dumps(report).encode());return
    operator.require(not operator.active('wakhan-app.service'),'NATIVE_SERVICE_UNEXPECTEDLY_ACTIVE')
    work=Path(tempfile.mkdtemp(prefix='resume-payload-',dir=operator.STATE));operator.unpack(work)
    # APK creation is reversible and independent of the remote video sample.
    # A media failure must still prevent replacing the live backend.
    print('BUILDING_ANDROID_WITH_EXISTING_RELEASE_KEY',flush=True)
    operator.build_android(work,report)
    print('ANDROID_APK_READY; TESTING_BACKEND_MEDIA_BEFORE_CUTOVER',flush=True)
    root,python,settings=operator.stage(work,report)
    backup=operator.cutover(root,python,settings,report)
    report.update(release=str(root),media_repair_applied=True)
    operator.atomic(installed,json.dumps(report).encode())
    operator.retire_legacy(backup,report)
    report.update(ok=True,legacy_accounts_removed_or_absent=True)
    operator.atomic(completed,json.dumps(report).encode())


def main():
    if os.geteuid()!=0:raise SystemExit('RUN_AS_ROOT_ON_WAKHAN_SERVER')
    os.umask(0o077);operator=read_operator()
    operator.require(not operator.STATE.is_symlink(),'UPDATE_STATE_SYMLINK_FORBIDDEN');operator.STATE.mkdir(mode=0o700,exist_ok=True)
    lock=(operator.STATE/'update.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    report={'ok':False,'version':'0.2.8-beta','build':22,'store_ready':False,'device_audio_verified':False,'services_changed':False,'backend_live':False,'live_database_changed':False,'database_backup_restored':False,'resume_media_fix':True}
    try:
        instrument(operator,report);execute(operator,report)
        print('CONSOLIDATED_UPDATE_READY_FOR_DEVICE_TEST',flush=True)
    except BaseException as error:
        message=str(error);report['error']=message if re.fullmatch('[A-Z0-9_]+',message or '') else type(error).__name__
        print('UPDATE_NEEDS_REVIEW:',report['error'],flush=True)
        if report.get('android',{}).get('ok'):print('ANDROID_APK_READY:',report['android']['apk'],flush=True)
    finally:operator.save_report(report)


if __name__=='__main__':main()
