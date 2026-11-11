"""One guarded 028 build/cutover. Existing database is retained, never restored over transactions."""
import base64
from datetime import datetime,timezone
import fcntl
import hashlib
import hmac
import importlib.util
import io
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
from urllib.request import Request,urlopen
import zipfile

SOURCE=Path('/opt/wakhan-music')
OLD_STAGE=Path('/opt/wakhan-app-stage-20261110-100826-8x_4se3m')
STATE=Path('/opt/wakhan-update-0.2.8')
REPORT=Path('/root/wakhan-028-result.zip')
UNIT=Path('/etc/systemd/system/wakhan-app.service')
OWNER=8878966292
TLS_URL='turns:turn.kabulcafe.uk:443?transport=tcp'
ENV_KEYS={'TURN_HOST','TURN_PORT','TURN_SECRET','TURN_TLS_HOST','TURN_TLS_PORT','WKA_GOOGLE_CLIENT_ID','WKA_CONTACT_EMAIL','WKA_FACEBOOK_APP_ID','WKA_FACEBOOK_APP_SECRET','WKA_SMTP_HOST','WKA_SMTP_PORT','WKA_SMTP_USER','WKA_SMTP_PASS','WKA_MAIL_FROM','WKA_FCM_KEY'}


def require(value,code):
    if not value:raise RuntimeError(code)


def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def atomic(path,data,mode=0o600):
    path=Path(path);temporary=path.with_name(path.name+'.028-tmp')
    fd=os.open(temporary,os.O_WRONLY|os.O_CREAT|os.O_TRUNC|os.O_NOFOLLOW,mode)
    with os.fdopen(fd,'wb') as stream:
        stream.write(data);stream.flush();os.fsync(stream.fileno())
    temporary.chmod(mode);temporary.replace(path)


def command(args,code='SYSTEM_COMMAND_FAILED',timeout=60,check=True,cwd=None):
    result=subprocess.run([str(x) for x in args],capture_output=True,text=True,timeout=timeout,cwd=cwd)
    if check:require(result.returncode==0,code)
    return result


def active(name):return command(['systemctl','is-active','--quiet',name],check=False).returncode==0


def verify_sources(root,expected):
    for name,digest in expected.items():
        path=root/name;require(path.is_file() and not path.is_symlink(),'SOURCE_FILE_MISSING')
        body=path.read_bytes()
        if hashlib.sha256(body).hexdigest()==digest:continue
        insertion=(', '+repr(TLS_URL)).encode()
        if name=='bot.py' and body.count(insertion)==1 and hashlib.sha256(body.replace(insertion,b'',1)).hexdigest()==digest:continue
        raise RuntimeError('SOURCE_REVISION_CHANGED_'+name.replace('.','_').upper())


def database_copy(source,target):
    begin=time.monotonic()
    def progress(*unused):require(time.monotonic()-begin<60,'DATABASE_SNAPSHOT_TIMEOUT')
    with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True,timeout=10) as old,sqlite3.connect(target) as copy:
        old.backup(copy,pages=256,progress=progress,sleep=.05)
        require(copy.execute('pragma quick_check').fetchone()[0]=='ok','DATABASE_SNAPSHOT_INVALID')
    target.chmod(0o600)


def ledger_fingerprint(database):
    result={}
    with sqlite3.connect(database.as_uri()+'?mode=ro',uri=True,timeout=10) as db:
        for table in ('wm_coin_accounts','wm_coin_ops'):
            if not db.execute("select 1 from sqlite_master where type='table' and name=?",(table,)).fetchone():continue
            count=len(db.execute('pragma table_info('+table+')').fetchall())
            digest=hashlib.sha256()
            for row in db.execute('select * from '+table+' order by '+','.join(str(i+1) for i in range(count))):digest.update(repr(row).encode())
            result[table]=digest.hexdigest()
    return result


def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module


def unpack(work):
    raw=base64.b64decode(PAYLOAD);require(hashlib.sha256(raw).hexdigest()==PAYLOAD_SHA256,'UPDATE_PAYLOAD_INVALID')
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        for item in archive.infolist():
            path=Path(item.filename);require(not path.is_absolute() and '..' not in path.parts,'UPDATE_PATH_INVALID')
        archive.extractall(work)
    sys.path.insert(0,str(work))


def owner_key(settings):
    key=Path(settings['session_key_file']).read_bytes();require(len(key)==32,'PRESERVED_SESSION_KEY_INVALID')
    with sqlite3.connect(Path(settings['database']).as_uri()+'?mode=ro',uri=True,timeout=10) as db:
        row=db.execute('select sid from wka_sessions where uid=? order by seen desc limit 1',(OWNER,)).fetchone()
    require(bool(row),'OWNER_EXISTING_SESSION_NOT_FOUND');sid=row[0]
    return 'wka1.'+sid+'.'+hmac.new(key,sid.encode(),hashlib.sha256).hexdigest()[:32]


def live_get(path,key=None):
    request=Request('http://127.0.0.1:10010'+path,headers={'X-Init':key} if key else {})
    # A local loopback request; inherited NO_PROXY keeps it out of public routing.
    with urlopen(request,timeout=5) as response:return json.loads(response.read(1_000_000))


def wait_live(settings):
    key=owner_key(settings)
    for attempt in range(30):
        try:
            h=live_get('/health');me=live_get('/api/me',key)
            if h.get('standalone') and h.get('version')=='0.2.8-beta' and me.get('me',{}).get('id')==OWNER:
                require(live_get('/api/v70/inbox',key).get('reply_supported'),'LIVE_REPLIES_UNAVAILABLE')
                require(live_get('/api/app/preferences',key).get('moderator'),'LIVE_PREFERENCES_UNAVAILABLE')
                require(live_get('/api/app/rooms',key).get('ok'),'LIVE_ROOM_TOOLS_UNAVAILABLE')
                return me.get('me',{}).get('public_id')
        except Exception:pass
        time.sleep(1)
    raise RuntimeError('LIVE_NATIVE_HEALTH_FAILED')


def relay_configuration():
    config=Path('/etc/turnserver.conf')
    pid=command(['systemctl','show','coturn.service','-p','MainPID','--value']).stdout.strip()
    if pid.isdigit() and int(pid)>0:
        args=(Path('/proc')/pid/'cmdline').read_bytes().decode(errors='replace').split('\0')
        for i,value in enumerate(args[:-1]):
            if value in ('-c','--config'):config=Path(args[i+1])
    require(config.is_file() and not config.is_symlink(),'COTURN_CONFIGURATION_MISSING')
    values={}
    for line in config.read_text().splitlines():
        line=line.strip()
        if not line or line.startswith('#'):continue
        key,sep,value=line.partition('=');values[key.strip()]=value.strip().strip('"').strip("'") if sep else True
    require(isinstance(values.get('static-auth-secret'),str) and values['static-auth-secret'],'COTURN_AUTH_SECRET_MISSING')
    require(str(values.get('tls-listening-port'))=='443','COTURN_TLS_443_NOT_CONFIGURED')
    low=int(values.get('min-port',0));high=int(values.get('max-port',0))
    require(1024<=low<=high<=65535 and high-low<=512,'RELAY_PORT_RANGE_UNREVIEWED')
    return values,low,high


def voice_preflight(work,settings,report):
    require(active('coturn.service') and active('cloudflared.service'),'EXISTING_VOICE_OR_TUNNEL_NOT_ACTIVE')
    require(not active('xray.service') and not active('hysteria-server.service'),'UNEXPECTED_ACTIVE_RETIRED_VPN_SERVICE')
    ips={x[4][0] for x in socket.getaddrinfo('turn.kabulcafe.uk',443,socket.AF_INET,socket.SOCK_STREAM)}
    require(ips=={'2.31.72.140'},'TURN_DNS_DIFFERS')
    values,low,high=relay_configuration()
    settings['env'].update(TURN_HOST='turn.kabulcafe.uk',TURN_PORT='3478',TURN_SECRET=values['static-auth-secret'],TURN_TLS_HOST='turn.kabulcafe.uk',TURN_TLS_PORT='443')
    probe=load('relay_probe028',work/'relay_probe.py')
    username=str(int(time.time())+600)+':028-probe'
    password=base64.b64encode(hmac.new(values['static-auth-secret'].encode(),username.encode(),hashlib.sha1).digest()).decode()
    results=[]
    for port,tcp,tls in ((3478,False,None),(3478,True,None),(443,True,'turn.kabulcafe.uk')):
        result=probe.allocate('2.31.72.140',port,username,password,tcp=tcp,tls_hostname=tls)
        results.append(result)
        require(result.get('allocated') and not result.get('unauthenticated_allocate') and (not tls or result.get('tls_verified')),'SERVER_RELAY_PROBE_FAILED')
    report['voice']={'server_local_probes':results,'relay_udp_range':[low,high],'irancell_without_vpn_verified':False,'provider_firewall_verified':False}
    ufw=shutil.which('ufw')
    if ufw:
        status=command([ufw,'status']).stdout
        if re.search(r'Status:\s+active',status):
            for port,protocol in (('3478','udp'),('3478','tcp'),('443','tcp'),(str(low)+':'+str(high),'udp')):
                command([ufw,'allow',port+'/'+protocol],code='HOST_RELAY_FIREWALL_FAILED')
            report['voice']['host_firewall']='active_required_relay_ports_allowed'
        else:report['voice']['host_firewall']='ufw_inactive_or_unrecognized'
    else:report['voice']['host_firewall']='ufw_not_installed'


def stage(work,report):
    verify_sources(SOURCE,SOURCE_HASHES)
    require(not OLD_STAGE.is_symlink() and (OLD_STAGE/'private/app.json').is_file(),'PREVIOUS_NATIVE_STAGE_NOT_FOUND')
    old=json.loads((OLD_STAGE/'private/app.json').read_text())
    execution=command(['systemctl','show','wakhan-music.service','-p','ExecStart','--value']).stdout
    directory=command(['systemctl','show','wakhan-music.service','-p','WorkingDirectory','--value']).stdout.strip()
    require((str(SOURCE/'bot.py') in execution or ('bot.py' in execution and directory==str(SOURCE))),'UNREVIEWED_LEGACY_SERVICE_COMMAND')
    existing=dict(old,database=str(SOURCE/'data/music.db'))
    require(live_get('/api/me',owner_key(existing)).get('me',{}).get('id')==OWNER,'CURRENT_OWNER_SESSION_KEY_DIFFERS')
    account=pwd.getpwnam('musicbot');python=OLD_STAGE/'.venv/bin/python'
    require(python.is_file(),'NATIVE_MEDIA_ENVIRONMENT_NOT_FOUND')
    root=Path(tempfile.mkdtemp(prefix='wakhan-app-0.2.8-',dir='/opt'));root.chmod(0o750);os.chown(root,0,account.pw_gid)
    private=root/'private';private.mkdir(mode=0o700);os.chown(private,account.pw_uid,account.pw_gid)
    for name in ('native_runtime.py','native_profiles.py','native_receipts.py','native_preferences.py','native_migrations.py','public_ids.py','session_keys.py','stage_probe.py','release_probe.py'):
        shutil.copyfile(work/name,root/name)
    for name in ('build_accounts','build_finance','build_native_modules'):load(name,work/(name+'.py')).generate(SOURCE,root,review=False)
    load('build_core',work/'build_core.py').generate((SOURCE/'bot.py').read_text(),root/'app_core.py')
    data=root/'data';data.mkdir(mode=0o700)
    database_copy(SOURCE/'data/music.db',data/'music.db')
    for name in ('ava','wm70_avatars','wm51_halls','dm_media','library_v60','player_v60','browser-v39.key','cookies.txt','firebase-key.json','receipts'):
        original=SOURCE/'data'/name
        if not original.exists():continue
        require(not original.is_symlink(),'UNREVIEWED_DATA_SYMLINK')
        if original.is_dir():shutil.copytree(original,data/name,symlinks=False)
        else:shutil.copyfile(original,data/name)
    if (SOURCE/'youtube-v39-plugin').exists():shutil.copytree(SOURCE/'youtube-v39-plugin',root/'youtube-v39-plugin')
    (root/'cache').symlink_to(SOURCE/'cache',target_is_directory=True)
    web=root/'web';web.mkdir(mode=0o750)
    for file in (SOURCE/'web').iterdir():
        if file.is_file() and not file.is_symlink() and file.suffix.lower() in {'.png','.jpg','.jpeg','.webp','.svg','.gif','.mp4','.woff','.woff2','.ttf','.css'}:shutil.copyfile(file,web/file.name)
    keyfile=private/'app-session.key';key=Path(old['session_key_file']).read_bytes();require(len(key)==32,'PRESERVED_SESSION_KEY_INVALID')
    keyfile.write_bytes(key);keyfile.chmod(0o600)
    settings={'base':str(root),'data':str(data),'database':str(data/'music.db'),'owner':OWNER,'port':10010,'session_key_file':str(keyfile),'env':{k:v for k,v in old.get('env',{}).items() if k in ENV_KEYS},'remove_legacy_accounts':[8434419791,8584042529]}
    fcm=settings['env'].get('WKA_FCM_KEY')
    if fcm:
        require(Path(fcm).is_file(),'PRESERVED_PUSH_KEY_MISSING');shutil.copyfile(fcm,private/'firebase-key.json');settings['env']['WKA_FCM_KEY']=str(private/'firebase-key.json')
    voice_preflight(work,settings,report)
    config=private/'app.json';atomic(config,json.dumps(settings).encode())
    # Do not follow data/cache or interpreter symlinks when setting ownership.
    for parent,folders,files in os.walk(root,followlinks=False):
        base=Path(parent)
        for name in files:
            file=base/name
            if file.is_symlink():continue
            file.chmod(0o600 if file.is_relative_to(private) or file.is_relative_to(data) else 0o640);os.chown(file,account.pw_uid,account.pw_gid)
        for name in folders:
            folder=base/name
            if folder.is_symlink():continue
            folder.chmod(0o700 if folder.is_relative_to(private) or folder.is_relative_to(data) else 0o750);os.chown(folder,account.pw_uid,account.pw_gid)
    print('PROBING_NATIVE_BACKEND_AND_REAL_MEDIA',flush=True)
    result=command(['runuser','-u','musicbot','--',python,root/'release_probe.py',config],code='ISOLATED_NATIVE_PROBE_FAILED',timeout=180,cwd=root)
    lines=[line for line in result.stdout.splitlines() if line.startswith('{')];require(lines,'ISOLATED_PROBE_REPORT_MISSING')
    report['isolated_backend']=json.loads(lines[-1]);require(report['isolated_backend'].get('ok'),'ISOLATED_RELEASE_GATE_FAILED')
    return root,python,settings


def build_android(work,report):
    saved=STATE/'android.json'
    if saved.exists():
        built=json.loads(saved.read_text())
        require(built.get('ok') and sha(built['apk'])==built['apk_sha256'] and sha(built['aab'])==built['aab_sha256'],'PREVIOUS_ANDROID_ARTIFACT_CHANGED')
        require(built.get('update_payload_sha256')==PAYLOAD_SHA256,'PREVIOUS_ANDROID_BUILD_USES_DIFFERENT_UPDATE')
    else:
        built={'ok':False,'device_audio_verified':False,'store_ready':False}
        builder=load('builder028',work/'build_android.py')
        require(not builder.APK.exists() and not builder.AAB.exists(),'EXISTING_028_OUTPUT_NOT_OWNED_BY_THIS_UPDATE')
        builder.execute(built);built['update_payload_sha256']=PAYLOAD_SHA256;atomic(saved,json.dumps(built).encode())
    report['android']=built


def unit_text(root,python):
    return ('[Unit]\nDescription=Wakhan standalone application\nAfter=network-online.target\nWants=network-online.target\n'
        '[Service]\nUser=musicbot\nGroup=musicbot\nUMask=0077\nWorkingDirectory='+str(root)+'\nExecStart='+str(python)+' '+str(root/'native_runtime.py')+' --config '+str(root/'private/app.json')+'\nRestart=on-failure\nRestartSec=3\nTimeoutStopSec=25\nNoNewPrivileges=true\nPrivateTmp=true\n'
        '[Install]\nWantedBy=multi-user.target\n')


def cutover(root,python,settings,report):
    require(active('wakhan-music.service'),'LEGACY_SERVICE_NOT_ACTIVE_BEFORE_CUTOVER')
    require(not UNIT.exists() and not UNIT.is_symlink(),'NATIVE_SERVICE_ALREADY_EXISTS')
    backup=STATE/'private-backup';backup.mkdir(mode=0o700,exist_ok=True)
    report['private_backup']=str(backup)
    for name in ('bot.py','.env'):
        if (SOURCE/name).exists():shutil.copyfile(SOURCE/name,backup/name);(backup/name).chmod(0o600)
    restore=[]
    for name in ('bot.py','.env'):
        path=SOURCE/name
        if path.exists():
            info=path.stat();restore.append({'source':str(path),'copy':str(backup/name),'mode':info.st_mode&0o777,'uid':info.st_uid,'gid':info.st_gid})
    atomic(backup/'restore-files.json',json.dumps(restore).encode())
    old_enabled=command(['systemctl','is-enabled','wakhan-music.service'],check=False).stdout.strip()=='enabled'
    # Store a concrete rollback that deliberately never restores a database snapshot.
    rollback="""import json,os,pathlib,shutil,subprocess
root=pathlib.Path(%r);source=pathlib.Path(%r)
subprocess.run(['systemctl','stop','wakhan-app.service'],check=False)
for item in json.loads((root/'restore-files.json').read_text()):
    if pathlib.Path(item['copy']).exists():
        shutil.copyfile(item['copy'],item['source'])
        os.chmod(item['source'],item['mode']);os.chown(item['source'],item['uid'],item['gid'])
subprocess.run(['systemctl','disable','wakhan-app.service'],check=False)
subprocess.run(['systemctl','daemon-reload'],check=True)
subprocess.run(['systemctl',%r,'wakhan-music.service'],check=True)
subprocess.run(['systemctl','start','wakhan-music.service'],check=True)
print('Legacy service restored; current database retained')
"""%(str(backup),str(SOURCE),'enable' if old_enabled else 'disable')
    atomic(STATE/'rollback.py',rollback.encode())
    # Switch the release's data path to the current database only after probe completion.
    shutil.move(str(root/'data'),str(backup/('probe-data-'+root.name)))
    (root/'data').symlink_to(SOURCE/'data',target_is_directory=True)
    settings.update(data=str(SOURCE/'data'),database=str(SOURCE/'data/music.db'))
    atomic(root/'private/app.json',json.dumps(settings).encode());account=pwd.getpwnam('musicbot');os.chown(root/'private/app.json',account.pw_uid,account.pw_gid)
    release=root/'releases';release.mkdir(mode=0o750);os.chown(release,0,account.pw_gid)
    shutil.copyfile(report['android']['apk'],release/'Wakhan.apk');(release/'Wakhan.apk').chmod(0o640);os.chown(release/'Wakhan.apk',0,account.pw_gid)
    switched=False
    try:
        print('SWITCHING_APP_TO_NATIVE_SERVICE',flush=True)
        command(['systemctl','stop','wakhan-music.service']);switched=True;report['services_changed']=True
        database_copy(SOURCE/'data/music.db',backup/'music-before-028.db')
        before=ledger_fingerprint(SOURCE/'data/music.db')
        # Run the migration on the fresh live DB while the old app is stopped
        # and the replacement public listener has not started accepting traffic.
        report['live_database_changed']=True
        migrated=command(['runuser','-u','musicbot','--',python,root/'release_probe.py',root/'private/app.json','--no-media'],code='LIVE_MIGRATION_PROBE_FAILED',timeout=90,cwd=root)
        flags=[line for line in migrated.stdout.splitlines() if line.startswith('{')]
        require(flags and json.loads(flags[-1]).get('ok'),'LIVE_MIGRATION_RELEASE_GATE_FAILED')
        require(before==ledger_fingerprint(SOURCE/'data/music.db'),'FINANCIAL_LEDGER_CHANGED_DURING_MIGRATION')
        report['live_migration']=json.loads(flags[-1])
        atomic(UNIT,unit_text(root,python).encode(),0o644)
        command(['systemctl','daemon-reload']);command(['systemctl','start','wakhan-app.service'])
        public=wait_live(settings)
        require(active('coturn.service') and active('cloudflared.service'),'VOICE_OR_TUNNEL_REGRESSION')
        command(['systemctl','enable','wakhan-app.service']);command(['systemctl','disable','wakhan-music.service'])
        report.update(backend_live=True,ledger_preserved=True,existing_session_verified=True,owner_public_id=public,live_database_changed=True)
    except BaseException:
        if switched:
            command(['systemctl','stop','wakhan-app.service'],check=False)
            if UNIT.exists():UNIT.unlink()
            command(['systemctl','daemon-reload'],check=False)
            if old_enabled:command(['systemctl','enable','wakhan-music.service'],check=False)
            restarted=command(['systemctl','start','wakhan-music.service'],check=False).returncode==0
            report['rollback_service_restored']=restarted;report['database_backup_restored']=False
        raise
    return backup


def retire_legacy(backup,report):
    require(active('wakhan-app.service') and not active('wakhan-music.service'),'NATIVE_CUTOVER_NOT_HEALTHY')
    # Keep private rollback material; provider browser and its environment remain intact.
    bot=SOURCE/'bot.py'
    info=bot.stat()
    atomic(bot,b'raise SystemExit("Legacy Telegram service retired; use wakhan-app.service")\n',0o640)
    os.chown(bot,info.st_uid,info.st_gid)
    env=SOURCE/'.env'
    if env.is_file():
        info=env.stat()
        forbidden={'BOT_TOKEN','API_ID','API_HASH','SESSION_STRING','ASSISTANT_SESSION','TG_SESSION','TELEGRAM_TOKEN'}
        lines=[line for line in env.read_text().splitlines() if line.partition('=')[0].strip() not in forbidden]
        atomic(env,('\n'.join(lines)+'\n').encode())
        os.chown(env,info.st_uid,info.st_gid)
    archived=[]
    for name in ('assistant.session','assistant.session-journal'):
        path=SOURCE/'data'/name
        if path.is_file() and not path.is_symlink():
            info=path.stat();target=backup/name
            restore=json.loads((backup/'restore-files.json').read_text())
            if not any(x['source']==str(path) for x in restore):restore.append({'source':str(path),'copy':str(target),'mode':info.st_mode&0o777,'uid':info.st_uid,'gid':info.st_gid})
            atomic(backup/'restore-files.json',json.dumps(restore).encode())
            shutil.move(str(path),str(target));target.chmod(0o600);archived.append(name)
    for name in ('xray.service','hysteria-server.service'):
        require(not active(name),'UNEXPECTED_ACTIVE_RETIRED_VPN_SERVICE')
        command(['systemctl','disable',name],check=False)
    vpn_archived=0
    for path in map(Path,('/usr/local/etc/xray/config.json','/etc/xray/config.json','/etc/hysteria/config.yaml','/etc/hysteria/config.yml')):
        if path.is_file() and not path.is_symlink():
            target=backup/('retired-vpn-'+hashlib.sha256(str(path).encode()).hexdigest()[:12]+path.suffix)
            require(not target.exists(),'RETIRED_VPN_ARCHIVE_ALREADY_EXISTS')
            shutil.move(str(path),str(target));target.chmod(0o600);vpn_archived+=1
            try:path.parent.rmdir()
            except OSError:pass
    report['cleanup']={'telegram_runtime_retired':True,'active_bot_settings_removed':True,'legacy_sessions_archived':len(archived),'private_rollback_retained':True,'provider_runtime_preserved':True,'old_provider_shared_venv_packages_retained':True,'vpn_services_inactive':True,'vpn_configurations_archived':vpn_archived}


def save_report(value):
    stream=io.BytesIO()
    with zipfile.ZipFile(stream,'w',zipfile.ZIP_DEFLATED) as z:z.writestr('update-result.json',json.dumps(value,ensure_ascii=False,indent=2))
    atomic(REPORT,stream.getvalue());print('REPORT_READY:',REPORT,flush=True)


def main():
    require(os.geteuid()==0,'RUN_AS_ROOT_ON_WAKHAN_SERVER');os.umask(0o077)
    require(not STATE.is_symlink(),'UPDATE_STATE_SYMLINK_FORBIDDEN');STATE.mkdir(mode=0o700,exist_ok=True);STATE.chmod(0o700)
    lock=(STATE/'update.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    report={'ok':False,'version':'0.2.8-beta','build':22,'store_ready':False,'device_audio_verified':False,'services_changed':False,'backend_live':False,'live_database_changed':False,'database_backup_restored':False}
    try:
        completed=STATE/'completed.json'
        if completed.exists():
            previous=json.loads(completed.read_text());settings=json.loads(Path(previous['release']) .joinpath('private/app.json').read_text());wait_live(settings)
            require(active('wakhan-app.service'),'PREVIOUS_NATIVE_SERVICE_NOT_ACTIVE');report.update(previous,already_installed=True)
        elif (STATE/'installed.json').exists():
            previous=json.loads((STATE/'installed.json').read_text());settings=json.loads(Path(previous['release']).joinpath('private/app.json').read_text())
            wait_live(settings);report.update(previous)
            retire_legacy(Path(previous['private_backup']),report)
            report.update(ok=True,legacy_accounts_removed_or_absent=True)
            atomic(completed,json.dumps(report).encode())
        else:
            work=Path(tempfile.mkdtemp(prefix='payload-',dir=STATE));unpack(work)
            require(not active('wakhan-app.service'),'NATIVE_SERVICE_UNEXPECTEDLY_ACTIVE')
            root,python,settings=stage(work,report)
            build_android(work,report)
            backup=cutover(root,python,settings,report)
            report['release']=str(root);atomic(STATE/'installed.json',json.dumps(report).encode())
            retire_legacy(backup,report)
            report.update(ok=True,release=str(root),legacy_accounts_removed_or_absent=True)
            atomic(completed,json.dumps(report).encode())
        print('CONSOLIDATED_UPDATE_READY_FOR_DEVICE_TEST',flush=True)
    except BaseException as error:
        message=str(error);report['error']=message if re.fullmatch(r'[A-Z0-9_]+',message or '') else type(error).__name__
        print('UPDATE_NEEDS_REVIEW:',report['error'],flush=True)
    finally:save_report(report)


if __name__=='__main__':main()
