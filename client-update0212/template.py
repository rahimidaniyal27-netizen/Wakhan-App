"""Publish client build 26 while retaining the verified 0211 backend and ledger."""
import ast,base64,fcntl,hashlib,io,json,os,shutil,tempfile,zipfile
from pathlib import Path

LIVE=Path('/opt/wakhan-app-0.2.11-li9z037x')
STATE=Path('/opt/wakhan-client-0.2.12')
UNIT=Path('/etc/systemd/system/wakhan-app.service')
REPORT=Path('/root/wakhan-0212-result.zip')
PREVIOUS_APK='002600326e0afc9caf7a0bafc1152b8b469a65c6f09c45461aaf6969eb578ea4'


def unpack(work):
    raw=base64.b64decode(PAYLOAD)
    if hashlib.sha256(raw).hexdigest()!=PAYLOAD_SHA256:raise RuntimeError('CLIENT_PAYLOAD_INVALID')
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        if any(Path(name).is_absolute() or '..' in Path(name).parts for name in archive.namelist()):raise RuntimeError('CLIENT_PAYLOAD_PATH_INVALID')
        archive.extractall(work)
    import sys
    sys.path.insert(0,str(work))


def current():
    from operator_common import require,active,command,sha,live_get,owner_key
    require(active('wakhan-app.service'),'EXPECTED_NATIVE_0211_SERVICE_REQUIRED')
    require(not LIVE.is_symlink() and sha(LIVE/'native_runtime.py')==RUNTIME_SHA256,'NATIVE_0211_SOURCE_CHANGED')
    execution=command(['systemctl','show','wakhan-app.service','-p','ExecStart','--value']).stdout
    require(str(LIVE/'native_runtime.py') in execution,'NATIVE_SERVICE_COMMAND_CHANGED')
    require(live_get('/health').get('version')=='0.2.11-beta','EXPECTED_LIVE_0211_REQUIRED')
    settings=json.loads((LIVE/'private/app.json').read_text())
    require(Path(settings['database']).resolve()==Path('/opt/wakhan-music/data/music.db'),'EXPECTED_CURRENT_DATABASE_REQUIRED')
    require(live_get('/api/me',owner_key(settings)).get('me',{}).get('public_id')==77777777,'EXISTING_OWNER_SESSION_REQUIRED')
    require((LIVE/'releases').is_dir() and not (LIVE/'releases').is_symlink(),'EXPECTED_DOWNLOAD_DIRECTORY_REQUIRED')
    return settings


def build_android(work,report):
    from operator_common import load,atomic,require,sha
    saved=STATE/'android.json'
    if saved.exists():
        result=json.loads(saved.read_text());require(result.get('payload_sha256')==PAYLOAD_SHA256,'PREVIOUS_0212_BUILD_DIFFERENT')
        require(sha(result['apk'])==result['apk_sha256'] and sha(result['aab'])==result['aab_sha256'],'PREVIOUS_0212_ARTIFACT_CHANGED')
    else:
        source=(work/'build_android028.py').read_text();require(hashlib.sha256(source.encode()).hexdigest()==ANDROID_BUILDER_SHA256,'ORIGINAL_BUILDER_CHANGED')
        class Version(ast.NodeTransformer):
            def visit_Assign(self,node):
                if any(isinstance(target,ast.Name) and target.id in ('PAYLOAD','PAYLOAD_SHA256','SOURCE_MAIN_SHA256','EXPECTED_SIGNERS') for target in node.targets):return node
                return self.generic_visit(node)
            def visit_Constant(self,node):
                value=node.value
                if type(value) is int and value==22:node.value=26
                elif isinstance(value,str):node.value=value.replace('0.2.8','0.2.12').replace(r'0\.2\.8',r'0\.2\.12').replace('beta28','beta212').replace('versionCode 22','versionCode 26').replace("versionCode='22'","versionCode='26'") if value!='22' else '26'
                return node
        tree=Version().visit(ast.parse(source));ast.fix_missing_locations(tree)
        target=work/'build_android0212.py';target.write_text(ast.unparse(tree)+'\n')
        builder=load('build_android0212',target);original=builder.run
        def run(args,cwd,phase,result,timeout=1200):
            if phase=='WEB_BUILD':
                project=Path(cwd)
                for file in (work/'client-overlay').rglob('*'):
                    if file.is_file():
                        destination=project/file.relative_to(work/'client-overlay');destination.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(file,destination)
                original(['node',project/'scripts/apply-ui-hotfix.cjs',project/'public/wakhan-shell.json'],project,'APPLY_0212_CLIENT',result)
                payload=project.parent/'payload/public'
                for name in ('wakhan-shell.json','wakhan-release.json'):shutil.copyfile(project/'public'/name,payload/name)
            return original(args,cwd,phase,result,timeout)
        builder.run=run;result={'ok':False,'store_ready':False,'device_audio_verified':False}
        require(not builder.APK.exists() and not builder.AAB.exists(),'UNOWNED_0212_OUTPUT_EXISTS');builder.execute(result)
        result['payload_sha256']=PAYLOAD_SHA256;atomic(saved,json.dumps(result).encode())
    report['android']=result


def replace_download(source,target,owner):
    temporary=target.with_name('.Wakhan.apk-0212-tmp')
    fd=os.open(temporary,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
    try:
        with os.fdopen(fd,'wb') as out,source.open('rb') as inp:
            shutil.copyfileobj(inp,out);out.flush();os.fsync(out.fileno())
        os.chown(temporary,owner.st_uid,owner.st_gid);temporary.chmod(owner.st_mode&0o777);os.replace(temporary,target)
    finally:
        if temporary.exists():temporary.unlink()


def publish(report):
    from operator_common import require,sha,atomic,live_get
    current();target=LIVE/'releases/Wakhan.apk';require(not target.is_symlink(),'DOWNLOAD_SYMLINK_CHANGED')
    source=Path(report['android']['apk']);expected=report['android']['apk_sha256'];require(sha(source)==expected,'SIGNED_APK_CHANGED')
    installed=STATE/'installed.json'
    if installed.exists():
        value=json.loads(installed.read_text());require(value['payload_sha256']==PAYLOAD_SHA256 and sha(target)==expected,'INSTALLED_CLIENT_CHANGED')
        report.update(ok=True,already_installed=True,backend_live=True,backend_version='0.2.11-beta');return
    require(sha(target)==PREVIOUS_APK,'PREVIOUS_PUBLISHED_APK_CHANGED')
    owner=target.stat();backup=STATE/'previous-Wakhan.apk';shutil.copyfile(target,backup);backup.chmod(0o600)
    before_unit=hashlib.sha256(UNIT.read_bytes()).hexdigest()
    try:
        replace_download(source,target,owner);require(sha(target)==expected,'PUBLISHED_APK_CHECKSUM_FAILED')
        require(hashlib.sha256(UNIT.read_bytes()).hexdigest()==before_unit,'NATIVE_SERVICE_UNIT_CHANGED')
        require(live_get('/health').get('version')=='0.2.11-beta','NATIVE_SERVICE_HEALTH_CHANGED')
        atomic(installed,json.dumps({'payload_sha256':PAYLOAD_SHA256,'apk_sha256':expected,'version':'0.2.12-beta','build':26,'backend_root':str(LIVE)}).encode())
        report.update(ok=True,backend_live=True,backend_version='0.2.11-beta',download_published=True,previous_apk_retained=True)
    except BaseException:
        replace_download(backup,target,owner);report['previous_download_restored']=sha(target)==PREVIOUS_APK;raise


def main():
    if os.geteuid()!=0:raise SystemExit('RUN_AS_ROOT')
    os.umask(0o077);STATE.mkdir(mode=0o700,exist_ok=True)
    with (STATE/'update.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        report={'ok':False,'version':'0.2.12-beta','build':26,'services_changed':False,'live_database_changed':False,'device_verified':False,'store_ready':False}
        try:
            with tempfile.TemporaryDirectory(prefix='wakhan-client-0212-',dir='/root') as temporary:
                work=Path(temporary);unpack(work);current();build_android(work,report);publish(report)
        except Exception as error:
            code=str(error);report['error']=code if isinstance(error,RuntimeError) and code.isupper() and len(code)<140 else type(error).__name__;print('UPDATE_NEEDS_REVIEW: '+report['error'],flush=True)
        with zipfile.ZipFile(REPORT,'w',zipfile.ZIP_DEFLATED) as archive:archive.writestr('result.json',json.dumps(report,indent=2))
        REPORT.chmod(0o600);print('REPORT_READY: '+str(REPORT),flush=True)


if __name__=='__main__':main()
