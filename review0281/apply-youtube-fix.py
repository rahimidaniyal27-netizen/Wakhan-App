#!/usr/bin/env python3
"""Owner-operated server-only YouTube/salon fix. Default is preflight, --apply installs.

No native build, signing-key/configuration/SSH/VPN change. Restarts only wakhan-app.
Code rollback never restores or deletes user data. Secrets stay on this server.
"""
import argparse
import contextlib
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

APP=Path('/opt/wakhan-app-0.2.11-li9z037x')
SERVICE='wakhan-app'
SOURCE='eaf201549a6f82a89572680cff0ec6587bc84b1a'
BASE='https://raw.githubusercontent.com/rahimidaniyal27-netizen/Wakhan-App/'+SOURCE+'/review0281/'
FILES=[{'path': 'native_room_video.py', 'before': '58db10a4c09b7496c6fa74e66e496ecd866cf17a5b9561e4bc367cb630759778', 'after': '49744f86fe7dce106aee79a1e661e81a31e7573754bd4b25092510380e9e4c0c'}, {'path': 'wakhan_music/audio_resolver.py', 'before': '4fb89344a83e969e0c0553a1aa697d9b53da4d19d24d2df97ef3b1670bb9a053', 'after': 'bde202595cab0d3d83e7345bd24479fceb9f1a4c43d0c1cbcd4e9a66ebffaa0a'}, {'path': 'wakhan_hall51.py', 'before': '08e7a9c4ca2aebc6724e4227a3f936e44ee30099a8f34c26715dcc95090afb60', 'after': '5fc1ef162c495c0b10d2a253b3031f2d3b6ba87487351d686cf7af7b1468f813'}, {'path': 'wakhan_salon.py', 'before': '962b8238e8c7d4ab656c4b9795051a20c917c089802d91427c76c638a5f17d90', 'after': 'eb8709f0ff94083b93b9baf34133931053d77153914b695576662ca2f2959038'}, {'path': 'wakhan_room_tools.py', 'before': '1b59f9dfd6e985e60562408f92ba25036f17183fb387143c2cb35800dafba233', 'after': '88b5f178c272c68c8ed0319ba97b43542f378beddbcf0f8bc4d8d527580fc194'}, {'path': 'room_tools.py', 'before': '1b59f9dfd6e985e60562408f92ba25036f17183fb387143c2cb35800dafba233', 'after': '88b5f178c272c68c8ed0319ba97b43542f378beddbcf0f8bc4d8d527580fc194'}]
PROBE_SHA='cee23c39d06a8a53b68b4222f4e3e601f678eecbc63077b55b7c3690fecdbb18'
CONTRACTS={'wakhan_app.py':'98a4d336d5d8912f830d8522bd0a1330201b04701a2d4aa2fd9ee7a4b383fa00',
           'native_runtime.py':'0eff6f9a66fdd3633150ef223f6752c4a601cb2599123d3e6b59119686b2d965',
           'native_wakhan2.py':'e802ae8c3d629718fffdd91d803cb11327034927c86fc56b641668f9121e937a',
           'wakhan_music/__init__.py':'a2368f2c5bd2fb5b92b8d04dfd10742019614d0be77bfc607cda296240a913ad',
           'wakhan_music/playback.py':'261f7661b6e92d77426ff812df79968d2f3e4086e6351d9c6319a25a28641cf1'}


def require(value,code):
    if not value:raise RuntimeError(code)


def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def regular(path):
    require(path.is_file() and not path.is_symlink() and path.stat().st_size<=2_000_000,'SOURCE_FILE_UNAVAILABLE')


def command(args,timeout=35,**kw):
    try:p=subprocess.run([str(v)for v in args],capture_output=True,timeout=timeout,**kw)
    except (OSError,subprocess.TimeoutExpired):raise RuntimeError('COMMAND_UNAVAILABLE_OR_TIMEOUT')from None
    require(p.returncode==0,'SERVICE_OR_CHECK_COMMAND_FAILED')
    return p.stdout


def current(app,allow_partial=False):
    for name,digest in CONTRACTS.items():
        regular(app/name);require(sha(app/name)==digest,'CURRENT_RUNTIME_CHANGED')
    values=[]
    for item in FILES:
        regular(app/item['path']);digest=sha(app/item['path'])
        require(digest in (item['before'],item['after']),'CURRENT_SOURCE_CHANGED')
        values.append(digest==item['after'])
    require(allow_partial or all(values) or not any(values),'PARTIAL_UPDATE_REQUIRES_REVIEW')
    return all(values)


def service_context(app):
    require(command(['systemctl','is-active',SERVICE]).strip()==b'active','WAKHAN_NOT_ACTIVE')
    require(command(['systemctl','show',SERVICE,'--property=User','--value']).strip()==b'musicbot','UNREVIEWED_SERVICE_USER')
    owner=pwd.getpwnam('musicbot')
    pid=int(command(['systemctl','show',SERVICE,'--property=MainPID','--value']).strip())
    proc=Path('/proc')/str(pid);cwd=(proc/'cwd').resolve()
    args=[v.decode()for v in (proc/'cmdline').read_bytes().split(b'\0')if v]
    require('--config'in args and any((cwd/v).resolve()==app/'native_runtime.py'for v in args[1:]if v.endswith('native_runtime.py')),'UNREVIEWED_SERVICE_COMMAND')
    settings=json.loads((cwd/args[args.index('--config')+1]).read_text())
    require(Path(settings['base']).resolve()==app and int(settings.get('port',10010))==10010,'RUNTIME_LOCATION_CHANGED')
    env={}
    for item in (proc/'environ').read_bytes().split(b'\0'):
        if b'='in item:
            key,value=item.split(b'=',1);env[os.fsdecode(key)]=os.fsdecode(value)
    python=args[0]if Path(args[0]).is_absolute()else str(cwd/args[0])
    return owner,python,env


def download(path,digest,target):
    with urllib.request.urlopen(BASE+path,timeout=20)as response:raw=response.read(2_000_001)
    require(len(raw)<=2_000_000 and hashlib.sha256(raw).hexdigest()==digest,'DOWNLOAD_CHECKSUM_FAILED')
    compile(raw,str(target),'exec')
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes(raw);target.chmod(0o644)


def fetch_payload(stage):
    for item in FILES:download('server-source/'+item['path'],item['after'],stage/item['path'])
    download('check-live-audio.py',PROBE_SHA,stage/'sound_probe.py')
    for directory in stage.rglob('*'):
        if directory.is_dir():directory.chmod(0o755)


def probe_module(stage):
    spec=importlib.util.spec_from_file_location('_wk_owner_sound_probe',stage/'sound_probe.py')
    module=importlib.util.module_from_spec(spec);previous=sys.dont_write_bytecode
    try:sys.dont_write_bytecode=True;spec.loader.exec_module(module)
    finally:sys.dont_write_bytecode=previous
    return module


def target_video(probe,app,link=None):
    if link:
        u=urllib.parse.urlsplit(link)
        require(u.scheme=='https' and u.hostname in ('www.youtube.com','youtube.com','m.youtube.com','music.youtube.com','youtu.be') and not u.username and not u.password and not u.port,'INVALID_YOUTUBE_LINK')
        vid=u.path.strip('/')if u.hostname=='youtu.be'else(urllib.parse.parse_qs(u.query).get('v')or[''])[0]
    else:
        base,token=probe.context(app)
        status,home=probe.api(base,token,'/api/app/salon/home');code=(home.get('mine')or{}).get('code','')
        require(status==200 and re.fullmatch('[A-Z0-9]{4,8}',code),'SELECT_YOUTUBE_IN_YOUR_OWN_SALON_FIRST')
        status,room=probe.api(base,token,'/api/c/'+code+'?v=-1')
        require(status==200,'OWNER_SALON_UNAVAILABLE');vid=room.get('vid','')
    require(isinstance(vid,str)and re.fullmatch('[A-Za-z0-9_-]{11}',vid),'SELECT_YOUTUBE_IN_YOUR_OWN_SALON_FIRST')
    return vid


PRECHECK=r'''
import ast,asyncio,functools,importlib.util,json,os,re,socket,sys
from pathlib import Path
import yt_dlp
root,source,vid=Path(sys.argv[1]),Path(sys.argv[2]),sys.argv[3]
sys.path.insert(0,str(root))
tree=ast.parse((root/'app_core.py').read_text())
nodes=[n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='_opts' or isinstance(n,ast.Assign)and any(isinstance(v,ast.Name)and v.id=='YT_OPTS'for v in n.targets)]
if len(nodes)!=2:raise RuntimeError('SOURCE_OPTIONS_CHANGED')
ns={'os':os,'re':re,'yt_dlp':yt_dlp,'DATA':str(root/'data'),'CACHE':str(root/'cache')}
exec(compile(ast.Module(body=nodes,type_ignores=[]),'existing-youtube-options','exec'),ns)
spec=importlib.util.spec_from_file_location('_wk_candidate_audio',source)
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
capabilities={'source_configuration_exists':(root/'wakhan_youtube_v39.py').is_file(),
              'token_key_readable':os.access(root/'data/browser-v39.key',os.R_OK)}
try:
 with socket.create_connection(('127.0.0.1',4417),timeout=0.5):capabilities['token_endpoint_reachable']=True
except OSError:capabilities['token_endpoint_reachable']=False
async def main():
 resolver=module.AudioResolver(ns,worker=functools.partial(module.run_worker,source_root=root))
 try:
  audio=await resolver.get('https://www.youtube.com/watch?v='+vid,'youtube')
  print(json.dumps({'ok':True,'kind':audio.get('kind'),'source_valid':module.allowed_audio_url(audio.get('url'),'youtube'),'capabilities':capabilities}))
 except module.AudioUnavailable as e:print(json.dumps({'ok':False,'err':e.code,'reason':e.reason,'capabilities':capabilities}))
 finally:await resolver.close()
asyncio.run(main())
'''


class PreflightFailure(RuntimeError):
    def __init__(self,code,capabilities):
        super().__init__(code)
        self.capabilities={k:bool(capabilities.get(k))for k in('source_configuration_exists','token_key_readable','token_endpoint_reachable')}


def candidate_check(app,stage,owner,python,env,vid):
    raw=command([python,'-c',PRECHECK,app,stage/'wakhan_music/audio_resolver.py',vid],timeout=22,
                cwd=app,env=env,user=owner.pw_uid,group=owner.pw_gid,extra_groups=[])
    require(len(raw)<64000,'UNEXPECTED_CHECK_OUTPUT')
    value=json.loads(raw)
    if not(value.get('ok')and value.get('source_valid')and value.get('kind')=='file'):
        reason=str(value.get('reason')or value.get('err','FORMAT')).upper()
        require(re.fullmatch('[A-Z_]+',reason),'UNEXPECTED_CHECK_ERROR')
        raise PreflightFailure('YOUTUBE_CANDIDATE_NOT_READY_'+reason,value.get('capabilities')or{})
    return {'ok':True,'kind':'file'}


def atomic(path,data,uid,gid,mode):
    fd,name=tempfile.mkstemp(prefix='.wk-audio-fix-',dir=path.parent)
    try:
        with os.fdopen(fd,'wb')as f:f.write(data);f.flush();os.fsync(f.fileno())
        os.chown(name,uid,gid);os.chmod(name,mode);os.replace(name,path)
        fd=os.open(path.parent,os.O_RDONLY|os.O_DIRECTORY)
        try:os.fsync(fd)
        finally:os.close(fd)
    finally:Path(name).unlink(missing_ok=True)


def snapshot(app,backup):
    records=[]
    for item in FILES:
        path=app/item['path'];regular(path);require(sha(path)==item['before'],'SOURCE_CHANGED_BEFORE_UPDATE')
        s=path.stat();target=backup/'files'/item['path'];target.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
        target.write_bytes(path.read_bytes());target.chmod(0o600)
        records.append(dict(item,uid=s.st_uid,gid=s.st_gid,mode=stat.S_IMODE(s.st_mode)))
    (backup/'restore.json').write_text(json.dumps(records,indent=2)+'\n');(backup/'restore.json').chmod(0o600)
    return records


def restore(app,backup):
    records=json.loads((backup/'restore.json').read_text())
    require(len(records)==len(FILES)and{r['path']for r in records}=={r['path']for r in FILES},'UNRECOGNIZED_BACKUP')
    expected={r['path']:r for r in FILES}
    # Validate everything before restoring any file; never overwrite unrelated edits.
    for r in records:
        require(r['before']==expected[r['path']]['before']and r['after']==expected[r['path']]['after'],'BACKUP_CONTRACT_CHANGED')
        regular(app/r['path']);regular(backup/'files'/r['path'])
        require(sha(app/r['path'])in(r['before'],r['after'])and sha(backup/'files'/r['path'])==r['before'],'ROLLBACK_SOURCE_CHANGED')
    for r in records:atomic(app/r['path'],(backup/'files'/r['path']).read_bytes(),r['uid'],r['gid'],r['mode'])


def public_json(path):
    req=urllib.request.Request('http://127.0.0.1:10010'+path,headers={'User-Agent':'Wakhan-owner-update/1.0'})
    try:
        with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(req,timeout=5)as response:return response.status,json.loads(response.read(200000))
    except urllib.error.HTTPError as error:return error.code,{}
    except (OSError,ValueError):return None,{}


def healthy(config):
    for _ in range(30):
        status,value=public_json('/health')
        if status==200 and value.get('ok'):break
        time.sleep(0.5)
    else:raise RuntimeError('HEALTH_CHECK_FAILED')
    require(public_json('/api/app/config')==(200,config),'SIGNIN_CONFIGURATION_CHANGED')
    require(public_json('/api/app/music/chart')[0]in(401,403),'MEDIA_AUTHORIZATION_CHANGED')


def apply_files(app,stage,backup,verify):
    records=snapshot(app,backup)
    try:
        command(['systemctl','stop',SERVICE])
        for r in records:
            require(sha(app/r['path'])==r['before'],'SOURCE_CHANGED_DURING_UPDATE')
        for r in records:atomic(app/r['path'],(stage/r['path']).read_bytes(),r['uid'],r['gid'],r['mode'])
        command(['systemctl','start',SERVICE]);verify()
    except BaseException:
        command(['systemctl','stop',SERVICE])
        try:restore(app,backup)
        finally:command(['systemctl','start',SERVICE])
        raise


def write_report(directory,result):
    fd,name=tempfile.mkstemp(prefix='wakhan-youtube-fix-result-',suffix='.zip',dir=directory);os.close(fd)
    path=Path(name);path.chmod(0o600)
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED)as z:z.writestr('RESULT.json',json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print('گزارش بررسی:',path)
    print('SHA256:',sha(path))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    mode=parser.add_mutually_exclusive_group();mode.add_argument('--apply',action='store_true');mode.add_argument('--rollback',type=Path)
    parser.add_argument('--link',help='Optional public YouTube song link. No credentials.')
    args=parser.parse_args();require(os.geteuid()==0,'RUN_AS_ROOT')
    already=current(APP,allow_partial=bool(args.rollback));owner,python,env=service_context(APP)
    status,config=public_json('/api/app/config');require(status==200,'CONFIG_HEALTH_FAILED')
    if args.rollback:
        require(str(args.rollback.resolve()).startswith('/root/wakhan-youtube-code-backup-'),'INVALID_BACKUP_PATH')
        command(['systemctl','stop',SERVICE])
        try:restore(APP,args.rollback.resolve())
        finally:command(['systemctl','start',SERVICE])
        healthy(config);print('کد قبلی برگشت؛ داده‌های کاربران حذف یا بازگردانی نشدند.');return
    if already:
        healthy(config);print('اصلاح سرور قبلاً نصب شده است. آهنگ یوتیوب را دوباره انتخاب کن.');return
    with tempfile.TemporaryDirectory(prefix='wakhan-youtube-stage-')as name:
        stage=Path(name);fetch_payload(stage);os.chown(stage,owner.pw_uid,owner.pw_gid)
        probe=probe_module(stage);vid=target_video(probe,APP,args.link)
        # Compile with the actual service interpreter before stopping anything.
        command([python,'-c','import pathlib,sys;[compile(p.read_bytes(),str(p),"exec")for p in pathlib.Path(sys.argv[1]).rglob("*.py")]',stage],
                cwd=APP,env=env,user=owner.pw_uid,group=owner.pw_gid,extra_groups=[])
        print('بررسی دریافت یوتیوب با سورس اصلاح‌شده؛ هنوز سرویس تغییر نکرده است.',flush=True)
        try:checked=candidate_check(APP,stage,owner,python,env,vid)
        except RuntimeError as error:
            code=str(error)if re.fullmatch('[A-Z_]+',str(error))else'YOUTUBE_PRECHECK_FAILED'
            report={'installed':False,'service_changed':False,'precheck_error':code}
            if isinstance(error,PreflightFailure):report['capabilities']=error.capabilities
            write_report(Path('/root'),report)
            raise
        require(current(APP)is False,'SOURCE_CHANGED_BEFORE_INSTALL')
        if not args.apply:
            print('بررسی موفق بود؛ برای نصب همین فرمان را با --apply اجرا کن.');return
        backup=Path(tempfile.mkdtemp(prefix='wakhan-youtube-code-backup-',dir='/root'));backup.chmod(0o700)
        result={'installed':False,'native_build_created':False,'source_precheck':checked,'files':FILES,'rolled_back':False}
        def verify():
            healthy(config)
            base,token=probe.context(APP)
            status,value=probe.api(base,token,'/api/app/music/audio-start?id=yt.'+vid,22)
            require(status==200 and value.get('ok'),'UPDATED_YOUTUBE_PREPARATION_FAILED')
            audio=probe.diagnose(probe.playable(value.get('src'),base))
            result['youtube_audio']=audio
            require(audio.get('audio_track_seen')and audio.get('exit_code')==0,'UPDATED_YOUTUBE_DECODING_FAILED')
        try:
            apply_files(APP,stage,backup,verify);result['installed']=True
        except BaseException:
            result['rolled_back']=all(sha(APP/item['path'])==item['before']for item in FILES)
            write_report(Path('/root'),result);healthy(config)
            print('کد قبلی خودکار برگشت. پشتیبان خصوصی:'if result['rolled_back']else'برگشت کد کامل نشد؛ پشتیبان خصوصی:',backup)
            raise
        write_report(Path('/root'),result)
        print('اصلاح سرور یوتیوب و پروفایل سالون نصب شد؛ فایل نصبی گوشی تغییر نکرد.')
        print('پشتیبان خصوصی:',backup)
        print('برگشت کد بدون حذف داده: python3 /root/wakhan-fix-youtube.py --rollback '+str(backup))
        print('حالا در برنامه آهنگ یوتیوب را دوباره انتخاب کن؛ نتیجهٔ آیفون و اندروید را بگو.')


if __name__=='__main__':
    try:main()
    except Exception as error:
        code=str(error)if isinstance(error,RuntimeError)and re.fullmatch('[A-Z_]+',str(error))else 'UPDATE_STOPPED_WITHOUT_EXPOSING_PRIVATE_DETAILS'
        raise SystemExit('STOP: '+code)
