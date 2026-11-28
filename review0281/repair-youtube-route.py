#!/usr/bin/env python3
"""Verify source readiness and signed YouTube transport before a source-only deployment."""
import argparse,fcntl,hashlib,importlib.util,json,os,re,signal,subprocess,sys,tempfile,time,zipfile
from pathlib import Path
import urllib.request,urllib.error
APP=Path('/opt/wakhan-app-0.2.11-li9z037x');BACKUPS=Path('/root')
BASE='https://raw.githubusercontent.com/rahimidaniyal27-netizen/Wakhan-App/'
ASSETS={
'installer.py':('0295fc02c57947e3e053c1df916a9e6934e0f7f3','review0281/apply-youtube-muxed.py','6c090c6f2462df996bb4b4ee3cb4a06e1e38c1710f23b77930f397178028ad0f'),
'runtime.py':('9b3d0283532ed01f9623a7f9aafea4ab6bc83aa5','review0281/repair-youtube-js-v5.py','eca73e3f07f40ae33fd76616811f1e60b1283ecd726de4aaa9b0c32d2993921c'),
'transport.py':('acfcedd19a595d9d631497cb69bd8053c95c4aaa','review0281/check-youtube-transport-v3.py','7e67551a883f4c122d41adc3e767c9b59ee64731e49eeb5f04c2930ae8109e28'),
'coordinator.py':('686d70a861335ae09632346746fc265f17af1172','review0281/repair-complete.py','d2d4e488392c80a0cdb1e1361a496a0e889c7a258d0461aa2ea33ca467e3fd65'),
}
PAYLOAD_COMMIT='37a8466786b8c4b10f6482bd1607620c4f90d96f'
CHANGES={
'native_room_video.py':'8913f6e8d729992f4cd5bd51882f2d5e23bca9cdb1991a45698d241fb7d075fa',
'wakhan_music/audio_resolver.py':'be4aed400c1447c1d73203aa8c3094e9f92b04380945746d16291e5210b0ac25',
'wakhan_music/playback.py':'c756a1c9283708888dd9caa806add0406b49277830eccdbc16728530efc770f6',
}
CONFIG_BEFORE='70877678abc1a36e0200120ebb09eb40d5d0b23202f2d54f9fe302157d6463b7'
CONFIG_AFTER={'matched': 'a0d276d21d106358bd11b97dde4cdd84dc67dc24af908fe63b563a60066e2836', 'ipv4': 'eb775d7230a66d8c5dbfb8e63da705bcc16d11b8a230e9cb6bc8be130162e153'}

def require(value,code):
 if not value:raise RuntimeError(code)
def digest(raw):return hashlib.sha256(raw).hexdigest()
def sha(path):return digest(Path(path).read_bytes())
def fetch(commit,path,expected,target):
 with urllib.request.urlopen(BASE+commit+'/'+path,timeout=20) as response:raw=response.read(2_000_001)
 require(len(raw)<=2_000_000 and digest(raw)==expected,'DOWNLOAD_CHECKSUM_FAILED');compile(raw,path,'exec');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw);target.chmod(0o644);return target
def asset(name,stage):return fetch(*ASSETS[name],stage/name)
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);sys.dont_write_bytecode=True;spec.loader.exec_module(module);return module
def once(source,before,after):
 require(source.count(before)==1,'REVIEWED_SOURCE_SHAPE_CHANGED');return source.replace(before,after)
def configuration(runtime,raw,mode):
 require(digest(raw)==CONFIG_BEFORE,'YOUTUBE_CONFIGURATION_CHANGED');value=runtime.patch_config(raw)
 if mode=='ipv4':value=once(value.decode(),"    return result\n","    if not result.get('proxy'):result['source_address']='0.0.0.0'\n    return result\n").encode()
 require(digest(value)==CONFIG_AFTER[mode],'CONFIGURATION_PATCH_CHANGED');return value

def contract(module,mode):
 files=[dict(item,after=CHANGES.get(item['path'],item['after'])) for item in module.FILES]
 files.extend([{'path':'wakhan_music/playback.py','before':module.CONTRACTS['wakhan_music/playback.py'],'after':CHANGES['wakhan_music/playback.py']},{'path':'wakhan_youtube_v39.py','before':CONFIG_BEFORE,'after':CONFIG_AFTER[mode]},{'path':'wakhan_room_video_resolver.py','before':'a57068d5f802d2d95297ad21726b149cac26cab40b8caa2fb2405212516790cc','after':'b3f9d7b78b7d2f748fd3ae88d1b6d6200cf5eca3c3a6932c6f30cd6de32564d0'}])
 return files

def candidate(module,runtime,stage):
 module.fetch_payload(stage)
 for path,expected in CHANGES.items():fetch(PAYLOAD_COMMIT,'review0281/route-source/'+path,expected,stage/path)
 fetch('35bc2ada850a42ba66c301367385d5411a9c80b1','review0281/video-followup-v2/wakhan_room_video_resolver.py','b3f9d7b78b7d2f748fd3ae88d1b6d6200cf5eca3c3a6932c6f30cd6de32564d0',stage/'wakhan_room_video_resolver.py')
 (stage/'wakhan_youtube_v39.py').write_bytes(configuration(runtime,(APP/'wakhan_youtube_v39.py').read_bytes(),'matched'))
 for p in stage.rglob('*'):
  if p.is_dir():p.chmod(0o755)
 stage.chmod(0o755)


def probe_source(diagnostic,mode):
 source=diagnostic.CHILD
 if mode=='ipv4':
  source=once(source,"value=original(**kw);value['js_runtimes']", "value=original(**kw);value['source_address']='0.0.0.0' if not value.get('proxy') else value.get('source_address');value['js_runtimes']")
 source=once(source,"'AudioUnavailable':audio_module.AudioUnavailable}","'AudioUnavailable':audio_module.AudioUnavailable,'ipaddress':ipaddress,'socket':__import__('socket'),'parse_qs':parse_qs}")
 source=once(source,"(root/'wakhan_music/playback.py').read_bytes()", "(stage/'wakhan_music/playback.py').read_bytes()")
 source=once(source,'def observed_http(proxy):\n  session=original_http(proxy)', 'def observed_http(proxy,url=None):\n  session=original_http(proxy,url)')
 source=once(source,"'proxy_type':scheme if scheme in", "'readiness_wait_seconds':audio.get('ready_wait_seconds',0),'proxy_type':scheme if scheme in")
 source=once(source,"'muxed':audio.get('muxed') is True", "'network_mode':"+repr(mode)+",'muxed':audio.get('muxed') is True")
 # Preserve the actual peer family even when a short 403 response has released
 # the connection before aiohttp returns the response to the caller.
 source=once(source,"peer=response.connection.transport.get_extra_info('peername') if response.connection and response.connection.transport else None", "connection=response.connection;protocol=getattr(response,'_protocol',None);channel=connection.transport if connection else getattr(protocol,'transport',None);peer=channel.get_extra_info('peername') if channel else None")
 source=once(source,"opts=dict(options,logger=Quiet()", "options=dict(options);options['source_address']='0.0.0.0' if not audio.get('proxy') and family((parse_qs(urlsplit(audio['url']).query).get('ip') or [''])[0])==4 else '::' if not audio.get('proxy') and family((parse_qs(urlsplit(audio['url']).query).get('ip') or [''])[0])==6 else options.get('source_address');opts=dict(options,logger=Quiet()")
 compile(source,'reviewed-route-probe','exec');return source

def trial(module,diagnostic,stage,owner,python,env,mode):
 (stage/'audio-entry.py').write_text(diagnostic.BOOTSTRAP);(stage/'audio-entry.py').chmod(0o644)
 (stage/'transport-check.py').write_text(probe_source(diagnostic,mode));(stage/'transport-check.py').chmod(0o644)
 child=subprocess.Popen([python,str(stage/'transport-check.py'),str(APP),str(stage)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,cwd=APP,env=dict(env,PYTHONDONTWRITEBYTECODE='1'),user=owner.pw_uid,group=owner.pw_gid,extra_groups=[],start_new_session=True)
 try:out,_=child.communicate(timeout=100)
 except subprocess.TimeoutExpired:
  try:os.killpg(child.pid,signal.SIGKILL)
  except ProcessLookupError:pass
  child.communicate();return {'diagnostic_timeout':True,'network_mode':mode}
 require(len(out)<=16000,'UNEXPECTED_CHECK_OUTPUT')
 try:value=json.loads(out)
 except ValueError:value={'diagnostic_failed':True,'network_mode':mode}
 return value

def readable(value):
 response=value.get('aiohttp_cdn') or {};decode=value.get('local_relay_decode') or {}
 return response.get('http_status') in (200,206) and response.get('sample_bytes',0)>0 and decode.get('audio_track_seen') is True and decode.get('exit_code')==0

def verify(module,probe,config,result):
 module.healthy(config);base,token=probe.context(APP)
 status,value=probe.api(base,token,'/api/app/music/audio-start?id=yt.HKDb1xi2uGE',40)
 require(status==200 and value.get('ok'),'UPDATED_YOUTUBE_PREPARATION_FAILED')
 audio=probe.diagnose(probe.playable(value.get('src'),base));result['application_audio']=audio
 require(audio.get('exit_code')==0 and audio.get('audio_track_seen') and audio.get('audio_signal_confirmed'),'UPDATED_YOUTUBE_SOUND_NOT_CONFIRMED')

def report(result):
 fd,name=tempfile.mkstemp(prefix='wakhan-youtube-route-result-',suffix='.zip',dir=BACKUPS);os.close(fd);path=Path(name);path.chmod(0o600)
 with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:z.writestr('RESULT.json',json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(result,ensure_ascii=False,indent=2),flush=True);print('گزارش نتیجه:',path);print('SHA256:',sha(path))

def main():
 parser=argparse.ArgumentParser(description=__doc__);modes=parser.add_mutually_exclusive_group(required=True);modes.add_argument('--apply',action='store_true');modes.add_argument('--rollback',type=Path);args=parser.parse_args();require(os.geteuid()==0,'RUN_AS_ROOT')
 with tempfile.TemporaryDirectory(prefix='wakhan-route-stage-') as folder:
  stage=Path(folder)
  if args.rollback:
   backup=args.rollback.resolve();require(backup.parent==BACKUPS and backup.name.startswith('wakhan-youtube-route-backup-'),'INVALID_BACKUP')
   state=json.loads((backup/'STATE.json').read_text());require(state.get('mode') in CONFIG_AFTER,'BACKUP_MODE_CHANGED')
   installer=backup/'installer.py';require(sha(installer)==ASSETS['installer.py'][2],'BACKUP_INSTALLER_CHANGED');module=load('_wk_route_installer',installer)
   module.FILES=contract(module,state['mode']);module.CONTRACTS.pop('wakhan_music/playback.py');module.current(APP,allow_partial=True)
   try:module.command(['systemctl','stop',module.SERVICE]);module.restore(APP,backup)
   finally:module.command(['systemctl','start',module.SERVICE])
   print('کدهای قبلی برنامه برگشتند؛ اطلاعات کاربران و اصلاح مرورگر حفظ شدند.');return
  installer=asset('installer.py',stage);module=load('_wk_route_installer',installer)
  require(module.current(APP) is False,'APPLICATION_SOURCE_COHORT_CHANGED')
  owner,python,env=module.service_context(APP)
  runtime=load('_wk_route_runtime',asset('runtime.py',stage))
  require(runtime.runtime_valid(APP/'youtube-js-v2'),'PRIVATE_RUNTIME_CHANGED')
  require(sha(APP/'wakhan_youtube_v39.py')==CONFIG_BEFORE and sha(APP/'wakhan_room_video_resolver.py')==runtime.VIDEO_BEFORE,'YOUTUBE_CONFIGURATION_CHANGED')
  coordinator=load('_wk_route_health',asset('coordinator.py',stage));require(coordinator.health().get('ready') is True,'RECOVERED_BROWSER_NOT_READY')
  diagnostic=load('_wk_route_diagnostic',asset('transport.py',stage))
  candidate(module,runtime,stage)
  result={'installed':False,'application_changed':False,'database_restored_or_deleted':False,'browser_changed':False,'native_build_created':False,'trials':{}}
  chosen=None
  for mode in ('matched','ipv4'):
   print('بررسی فایل واقعی با '+('رعایت زمان آماده‌شدن و IP لینک' if mode=='matched' else 'دریافت لینک تازه و پخش با IPv4')+'؛ هنوز برنامه تغییر نکرده است.',flush=True)
   value=trial(module,diagnostic,stage,owner,python,env,mode);result['trials'][mode]=value
   if readable(value):chosen=mode;break
  if chosen is None:
   report(result);raise RuntimeError('YOUTUBE_CDN_NOT_READABLE_NO_APPLICATION_CHANGE')
  files=contract(module,chosen)
  (stage/'wakhan_youtube_v39.py').write_bytes(configuration(runtime,(APP/'wakhan_youtube_v39.py').read_bytes(),chosen))
  for item in files:require(sha(stage/item['path'])==item['after'],'CANDIDATE_SOURCE_CHANGED')
  module.FILES=files;module.CONTRACTS.pop('wakhan_music/playback.py');require(module.current(APP) is False,'SOURCE_CHANGED_BEFORE_INSTALL')
  status,config=module.public_json('/api/app/config');require(status==200,'CONFIG_HEALTH_FAILED')
  probe=module.probe_module(stage)
  backup=Path(tempfile.mkdtemp(prefix='wakhan-youtube-route-backup-',dir=BACKUPS));backup.chmod(0o700)
  (backup/'installer.py').write_bytes(installer.read_bytes());(backup/'installer.py').chmod(0o600)
  (backup/'STATE.json').write_text(json.dumps({'mode':chosen})+'\n');(backup/'STATE.json').chmod(0o600)
  result['mode']=chosen
  print('آزمون فایل و رمزگشایی موفق بود؛ نصب اصلاحات و بررسی صدای مسیر واقعی برنامه.',flush=True)
  try:
   module.apply_files(APP,stage,backup,lambda:verify(module,probe,config,result));result['installed']=True;result['application_changed']=True
  except BaseException:
   result['rolled_back']=all(sha(APP/item['path'])==item['before'] for item in files);report(result);print('پشتیبان خصوصی:',backup);raise
  report(result);print('پشتیبان خصوصی:',backup);print('برگشت کد: python3 /root/wakhan-repair-youtube-route.py --rollback '+str(backup));print('صدای یوتیوب در مسیر واقعی سرور تأیید شد. حالا داخل و بیرون سالون روی گوشی امتحان کن.')

if __name__=='__main__':
 try:
  with open('/root/.wakhan-combined-repair.lock','a') as lock:
   try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
   except BlockingIOError:raise RuntimeError('ANOTHER_REPAIR_IS_RUNNING')
   main()
 except Exception as error:
  code=str(error) if isinstance(error,RuntimeError) and re.fullmatch('[A-Z_]+',str(error)) else 'YOUTUBE_ROUTE_REPAIR_STOPPED'
  raise SystemExit('STOP: '+code)
