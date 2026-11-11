"""Upgrade the verified native 0210 service; stage and test before the short cutover."""
import ast,base64,fcntl,hashlib,io,json,os,pwd,shutil,sqlite3,sys,tempfile,time,zipfile
from pathlib import Path

LIVE=Path('/opt/wakhan-app-0.2.10-tw3q6yba')
STATE=Path('/opt/wakhan-update-0.2.11')
UNIT=Path('/etc/systemd/system/wakhan-app.service')
REPORT=Path('/root/wakhan-0211-result.zip')
PYTHON=Path('/opt/wakhan-app-stage-20261110-100826-8x_4se3m/.venv/bin/python')


def unpack(work):
    raw=base64.b64decode(PAYLOAD)
    if hashlib.sha256(raw).hexdigest()!=PAYLOAD_SHA256:raise RuntimeError('UPDATE_PAYLOAD_INVALID')
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        if any(Path(name).is_absolute() or '..' in Path(name).parts for name in archive.namelist()):raise RuntimeError('UPDATE_PAYLOAD_PATH_INVALID')
        archive.extractall(work)
    sys.path.insert(0,str(work))


def build_android(work,report):
    from operator_common import load,atomic,require,sha
    saved=STATE/'android.json'
    if saved.exists():
        result=json.loads(saved.read_text());require(result.get('payload_sha256')==PAYLOAD_SHA256,'PREVIOUS_0211_BUILD_DIFFERENT')
        require(sha(result['apk'])==result['apk_sha256'] and sha(result['aab'])==result['aab_sha256'],'PREVIOUS_0211_ARTIFACT_CHANGED')
    else:
        source=(work/'build_android028.py').read_text();require(hashlib.sha256(source.encode()).hexdigest()==ANDROID_BUILDER_SHA256,'ORIGINAL_BUILDER_CHANGED')
        tree=ast.parse(source)
        class Version(ast.NodeTransformer):
            def visit_Assign(self,node):
                if any(isinstance(target,ast.Name) and target.id in ('PAYLOAD','PAYLOAD_SHA256','SOURCE_MAIN_SHA256','EXPECTED_SIGNERS') for target in node.targets):return node
                return self.generic_visit(node)
            def visit_Constant(self,node):
                value=node.value
                if type(value) is int and value==22:node.value=25
                elif isinstance(value,str):node.value=value.replace('0.2.8','0.2.11').replace(r'0\.2\.8',r'0\.2\.11').replace('beta28','beta211').replace('versionCode 22','versionCode 25').replace("versionCode='22'","versionCode='25'") if value!='22' else '25'
                return node
        tree=Version().visit(tree);ast.fix_missing_locations(tree);target=work/'build_android0211.py';target.write_text(ast.unparse(tree)+'\n')
        builder=load('build_android0211',target);original=builder.run
        def run(args,cwd,phase,result,timeout=1200):
            if phase=='WEB_BUILD':
                project=Path(cwd)
                for file in (work/'client-overlay').rglob('*'):
                    if file.is_file():
                        destination=project/file.relative_to(work/'client-overlay');destination.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(file,destination)
                original(['node',project/'scripts/apply-ui-hotfix.cjs',project/'public/wakhan-shell.json'],project,'APPLY_0211_CLIENT',result)
                payload=project.parent/'payload/public'
                for name in ('wakhan-shell.json','wakhan-release.json'):shutil.copyfile(project/'public'/name,payload/name)
            return original(args,cwd,phase,result,timeout)
        builder.run=run
        result={'ok':False,'store_ready':False,'device_audio_verified':False}
        require(not builder.APK.exists() and not builder.AAB.exists(),'UNOWNED_0211_OUTPUT_EXISTS');builder.execute(result)
        result['payload_sha256']=PAYLOAD_SHA256;atomic(saved,json.dumps(result).encode())
    report['android']=result


def current():
    from operator_common import require,active,command,sha,live_get,owner_key
    require(active('wakhan-app.service') and not active('wakhan-music.service'),'EXPECTED_NATIVE_0210_SERVICE_REQUIRED')
    require(not LIVE.is_symlink() and sha(LIVE/'native_runtime.py')==RUNTIME_0210_SHA256,'NATIVE_0210_SOURCE_CHANGED')
    require(sha(LIVE/'wakhan_resolver_v43.py')=='69c7b6a2f367a988cdb63eb668c1d060bbc8105ce123bca5f386b3a4cbad6c58','REVIEWED_READABLE_RESOLVER_REQUIRED')
    execution=command(['systemctl','show','wakhan-app.service','-p','ExecStart','--value']).stdout
    require(str(LIVE/'native_runtime.py') in execution,'NATIVE_SERVICE_COMMAND_CHANGED')
    settings=json.loads((LIVE/'private/app.json').read_text());require(Path(settings['database']).resolve()==Path('/opt/wakhan-music/data/music.db'),'EXPECTED_CURRENT_DATABASE_REQUIRED')
    require(live_get('/health').get('version')=='0.2.10-beta','EXPECTED_LIVE_0210_REQUIRED')
    require(live_get('/api/me',owner_key(settings)).get('me',{}).get('public_id')==77777777,'EXISTING_OWNER_SESSION_REQUIRED')
    require(PYTHON.is_file(),'PRESERVED_MEDIA_ENVIRONMENT_REQUIRED')
    return settings


def ownership(root):
    account=pwd.getpwnam('musicbot');root.chmod(0o750);os.chown(root,0,account.pw_gid)
    for parent,folders,files in os.walk(root,followlinks=False):
        for name in folders+files:
            file=Path(parent)/name
            if file.is_symlink():continue
            private=file.is_relative_to(root/'private') or file.is_relative_to(root/'data')
            file.chmod((0o700 if private else 0o750) if file.is_dir() else (0o600 if private else 0o640));os.chown(file,account.pw_uid,account.pw_gid)


def probe(work,root,media,report):
    from operator_common import command,require,load
    print('TESTING_ACTUAL_ROOM_PLAYBACK' if media else 'CHECKING_CURRENT_SESSION_AND_LEDGER',flush=True)
    args=['runuser','-u','musicbot','--',PYTHON,root/'release_probe.py',root/'private/app.json']+([] if media else ['--no-media'])
    result=command(args,cwd=root,check=False,timeout=240 if media else 90)
    if result.returncode:
        report['probe_failure']=load('diagnostics0211',work/'diagnose028.py').sanitized(result)
        (root/'private/probe.private.log').write_text(result.stdout+'\n'+result.stderr);(root/'private/probe.private.log').chmod(0o600)
        raise RuntimeError('NATIVE_0211_PROBE_FAILED')
    lines=[line for line in result.stdout.splitlines() if line.startswith('{')];require(lines,'PROBE_REPORT_MISSING')
    value=json.loads(lines[-1]);report['isolated_probe' if media else 'live_migration_probe']=value;require(value.get('ok'),'NATIVE_0211_RELEASE_GATE_FAILED')


def stage(work,old,report):
    from operator_common import database_copy,require,atomic
    from upgrade_chat import upgrade_community
    build={"ast":ast};tree=ast.parse((work/'native_room_video.py').read_text())
    generator=next(node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name=='muxed_resolver')
    exec(compile(ast.Module(body=[generator],type_ignores=[]),'owned-room-resolver-generator','exec'),build)
    root=Path(tempfile.mkdtemp(prefix='wakhan-app-0.2.11-',dir='/opt'));report['stage']=str(root)
    for file in LIVE.glob('*.py'):
        require(not file.is_symlink(),'UNREVIEWED_NATIVE_SOURCE_SYMLINK');compile(file.read_text(),file.name,'exec');shutil.copyfile(file,root/file.name)
    for name in OWNED:shutil.copyfile(work/name,root/name)
    (root/'wakhan_room_tools.py').write_bytes((work/'room_tools.py').read_bytes())
    community=root/'wakhan_community_v70.py';community.write_text(ast.unparse(upgrade_community(ast.parse(community.read_text())))+'\n')
    account=root/'wakhan_app.py';account_tree=ast.parse(account.read_text())
    config=next(node for node in ast.walk(account_tree) if isinstance(node,ast.AsyncFunctionDef) and node.name=='config')
    flags=0
    for node in ast.walk(config):
        if isinstance(node,ast.Dict):
            for key,value in zip(node.keys,node.values):
                if isinstance(key,ast.Constant) and key.value=='version' and isinstance(value,ast.Constant):value.value='0.2.11-beta'
                if isinstance(key,ast.Constant) and key.value=='features' and isinstance(value,ast.List):
                    existing={item.value for item in value.elts if isinstance(item,ast.Constant)}
                    value.elts.extend(ast.Constant(name) for name in ('royal_rooms','online_visibility','native_room_video','free_music_cinema','regional_commerce') if name not in existing);flags+=1
    require(flags==1,'NATIVE_CONFIG_FEATURES_CHANGED');ast.fix_missing_locations(account_tree);account.write_text(ast.unparse(account_tree)+'\n')
    (root/'wakhan_room_video_resolver.py').write_text(build['muxed_resolver']((LIVE/'wakhan_resolver_v43.py').read_text()))
    original_data=Path(old['data']).resolve();data=root/'data'
    shutil.copytree(original_data,data,symlinks=False,ignore=shutil.ignore_patterns('music.db','music.db-wal','music.db-shm'))
    database_copy(Path(old['database']).resolve(),data/'music.db')
    (root/'cache').symlink_to(Path(old['base'])/'cache',target_is_directory=True)
    shutil.copytree(LIVE/'web',root/'web',symlinks=False)
    if (LIVE/'youtube-v39-plugin').is_dir():shutil.copytree(LIVE/'youtube-v39-plugin',root/'youtube-v39-plugin',symlinks=False)
    private=root/'private';shutil.copytree(LIVE/'private',private,symlinks=False,ignore=shutil.ignore_patterns('*.log'))
    key=private/'app-session.key';shutil.copyfile(old['session_key_file'],key)
    settings=dict(old,base=str(root),data=str(data),database=str(data/'music.db'),session_key_file=str(key));settings.pop('remove_legacy_accounts',None)
    fcm=settings.get('env',{}).get('WKA_FCM_KEY')
    if fcm and Path(fcm).is_relative_to(LIVE/'private'):settings['env']['WKA_FCM_KEY']=str(private/Path(fcm).name)
    atomic(private/'app.json',json.dumps(settings).encode());ownership(root);probe(work,root,True,report)
    return root,settings


def switch(work,root,settings,old,report):
    from operator_common import require,atomic,command,unit_text,database_copy,ledger_fingerprint,live_get,owner_key,active
    require(active('wakhan-app.service'),'NATIVE_SERVICE_STOPPED_DURING_BUILD')
    before_unit=UNIT.read_bytes();backup=STATE/'private-backup';backup.mkdir(mode=0o700,exist_ok=True);atomic(backup/'wakhan-app.service',before_unit)
    report['private_backup']=str(backup)
    releases=root/'releases';releases.mkdir(mode=0o750);releases.chmod(0o750)
    shutil.copyfile(report['android']['apk'],releases/'Wakhan.apk');ownership(root);releases.chmod(0o750)
    # Prepared rollback restores code/service only. Never restore an old ledger.
    rollback="import pathlib,subprocess\nu=pathlib.Path(%r);b=pathlib.Path(%r)\nsubprocess.run(['systemctl','stop','wakhan-app.service'],check=False)\nu.write_bytes(b.read_bytes());u.chmod(0o644)\nsubprocess.run(['systemctl','daemon-reload'],check=True)\nsubprocess.run(['systemctl','start','wakhan-app.service'],check=True)\nprint('Previous code restored; current database retained')\n"%(str(UNIT),str(backup/'wakhan-app.service'))
    atomic(STATE/'rollback.py',rollback.encode())
    command(['systemctl','stop','wakhan-app.service']);report['services_changed']=True
    try:
        database=Path(old['database']).resolve();database_copy(database,backup/'music-before-0211.db');before=ledger_fingerprint(database)
        shutil.move(str(root/'data'),str(backup/('probe-data-'+root.name)));(root/'data').symlink_to(Path(old['data']).resolve(),target_is_directory=True)
        settings.update(data=old['data'],database=old['database']);atomic(root/'private/app.json',json.dumps(settings).encode());ownership(root)
        report['live_database_changed']=True;probe(work,root,False,report)
        require(before==ledger_fingerprint(database),'FINANCIAL_LEDGER_CHANGED_DURING_MIGRATION')
        atomic(UNIT,unit_text(root,PYTHON).encode(),0o644);command(['systemctl','daemon-reload']);command(['systemctl','start','wakhan-app.service'])
        for attempt in range(30):
            try:
                if live_get('/health').get('version')=='0.2.11-beta' and live_get('/api/me',owner_key(settings)).get('me',{}).get('public_id')==77777777:break
            except Exception:pass
            time.sleep(1)
        else:raise RuntimeError('NEW_NATIVE_HEALTH_FAILED')
        require(active('coturn.service') and active('cloudflared.service'),'VOICE_OR_TUNNEL_SERVICE_REGRESSION')
        report.update(ok=True,backend_live=True,ledger_preserved=True,existing_session_verified=True)
        atomic(STATE/'installed.json',json.dumps({'payload_sha256':PAYLOAD_SHA256,'root':str(root)}).encode())
    except BaseException:
        command(['systemctl','stop','wakhan-app.service'],check=False);atomic(UNIT,before_unit,0o644);command(['systemctl','daemon-reload'],check=False)
        report['rollback_service_restored']=command(['systemctl','start','wakhan-app.service'],check=False).returncode==0
        report['database_backup_restored']=False;raise


def main():
    if os.geteuid()!=0:raise SystemExit('RUN_AS_ROOT')
    os.umask(0o077);STATE.mkdir(mode=0o700,exist_ok=True)
    with (STATE/'update.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        report={'ok':False,'version':'0.2.11-beta','services_changed':False,'live_database_changed':False,'device_verified':False,'store_ready':False}
        try:
            with tempfile.TemporaryDirectory(prefix='wakhan-0211-',dir='/root') as temporary:
                work=Path(temporary);unpack(work)
                from operator_common import require
                if (STATE/'installed.json').exists():
                    installed=json.loads((STATE/'installed.json').read_text());require(installed['payload_sha256']==PAYLOAD_SHA256,'DIFFERENT_0211_ALREADY_INSTALLED')
                    from operator_common import live_get,owner_key,sha
                    settings=json.loads((Path(installed['root'])/'private/app.json').read_text())
                    require(live_get('/health').get('version')=='0.2.11-beta' and live_get('/api/me',owner_key(settings)).get('me',{}).get('public_id')==77777777,'INSTALLED_0211_HEALTH_FAILED')
                    android=json.loads((STATE/'android.json').read_text());require(sha(android['apk'])==android['apk_sha256'],'INSTALLED_0211_APK_CHANGED')
                    report.update(ok=True,already_installed=True,backend_live=True,existing_session_verified=True,android=android)
                else:
                    old=current();build_android(work,report);root,settings=stage(work,old,report);switch(work,root,settings,old,report)
        except Exception as error:
            code=str(error);report['error']=code if isinstance(error,RuntimeError) and code.isupper() and len(code)<140 else type(error).__name__;print('UPDATE_NEEDS_REVIEW: '+report['error'],flush=True)
        with zipfile.ZipFile(REPORT,'w',zipfile.ZIP_DEFLATED) as archive:archive.writestr('result.json',json.dumps(report,indent=2))
        REPORT.chmod(0o600);print('REPORT_READY: '+str(REPORT),flush=True)


if __name__=='__main__':main()
