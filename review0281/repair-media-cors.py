#!/usr/bin/env python3
"""Guarded correction of streamed app-origin headers; no native build or account changes."""
import argparse,fcntl,hashlib,importlib.util,json,os,re,subprocess,sys,tempfile,zipfile
from pathlib import Path
import urllib.request,urllib.error,urllib.parse
APP=Path('/opt/wakhan-app-0.2.11-li9z037x');BACKUPS=Path('/root');ORIGIN='https://music.kabulcafe.uk'
ROUTE=Path('/root/wakhan-repair-youtube-route.py');ROUTE_SHA='850c7da4d22d94b08406fc59eb06470fe572ffe1c557c57559fd5d63c52e3b8c'
INSTALLER=Path('/root/wakhan-youtube-route-backup-ufo2rc34/installer.py');INSTALLER_SHA='6c090c6f2462df996bb4b4ee3cb4a06e1e38c1710f23b77930f397178028ad0f'
BEFORE='782365847803cc749cbae94b9256edbc9afc216203fd139208a35a472310ba9d';AFTER='73f8ca24876f63b83fc1795053009e7fcd54d9c5ee84f4db720e00fda0b3f85f'
FILE={'path':'wakhan_app_native_n1.py','before':BEFORE,'after':AFTER}
PAYLOAD='https://raw.githubusercontent.com/rahimidaniyal27-netizen/Wakhan-App/fe89838863c67d704bad1288a4447e7a86d2665d/review0281/cors-source/wakhan_app_native_n1.py'

def require(value,code):
 if not value:raise RuntimeError(code)
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);sys.dont_write_bytecode=True;spec.loader.exec_module(module);return module
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kw):return None

def request_headers(url,origin):
 req=urllib.request.Request(url,headers={'Origin':origin,'Range':'bytes=0-1','Accept-Encoding':'identity','User-Agent':'Wakhan-media-header-check/1.0'})
 opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
 try:response=opener.open(req,timeout=40)
 except urllib.error.HTTPError as error:response=error
 with response:
  return {'status':response.status,'origin_matches':response.headers.get('Access-Control-Allow-Origin')==origin,'origin_header_present':bool(response.headers.get('Access-Control-Allow-Origin')),'vary_origin':'origin' in response.headers.get('Vary','').lower(),'sample_bytes':len(response.read(2)) if response.status in (200,206) else 0}

def media_check(raw,probe,base):
 local=probe.playable(raw,base);public=urllib.parse.urljoin(ORIGIN,raw)
 require(local.startswith(base+'/') and urllib.parse.urlsplit(public).netloc=='music.kabulcafe.uk','UNREVIEWED_MEDIA_SOURCE')
 checks={}
 for origin,label in [('capacitor://localhost','ios'),('https://localhost','android')]:
  value=request_headers(public,origin);checks[label]=value
  require(value['status'] in (200,206) and value['origin_matches'] and value['vary_origin'] and value['sample_bytes']==2,'PUBLIC_STREAM_CORS_NOT_CONFIRMED')
 value=request_headers(public,'https://untrusted.invalid');checks['untrusted']=value
 require(not value['origin_header_present'],'UNTRUSTED_ORIGIN_WAS_ALLOWED')
 return checks

def verify(module,probe,config,result):
 module.healthy(config);base,token=probe.context(APP)
 status,value=probe.api(base,token,'/api/app/music/audio-start?id=yt.HKDb1xi2uGE',40)
 require(status==200 and value.get('ok'),'PERSONAL_PREPARATION_FAILED')
 result['personal_cors']=media_check(value.get('src'),probe,base)
 public=urllib.parse.urljoin(ORIGIN,value['src']);audio=probe.diagnose(public);result['public_audio']=audio
 require(audio.get('exit_code')==0 and audio.get('audio_signal_confirmed'),'PUBLIC_AUDIO_NOT_CONFIRMED')
 status,home=probe.api(base,token,'/api/app/salon/home');code=(home.get('mine')or{}).get('code')
 result['salon_cors']={'checked':False}
 if status==200 and isinstance(code,str) and re.fullmatch('[A-Z0-9]{4,8}',code):
  status,state=probe.api(base,token,'/api/c/'+code+'?v=-1');media=state.get('media')or{}
  if status==200 and type(state.get('mine'))is int and state['mine']>=0 and media.get('kind')=='native' and media.get('formats'):
   result['salon_cors']=dict(checked=True,**media_check(media['formats'][0].get('url'),probe,base))

def report(result):
 fd,name=tempfile.mkstemp(prefix='wakhan-media-cors-result-',suffix='.zip',dir=BACKUPS);os.close(fd);path=Path(name);path.chmod(0o600)
 with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED)as z:z.writestr('RESULT.json',json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(result,ensure_ascii=False,indent=2));print('گزارش نتیجه:',path)

def main():
 parser=argparse.ArgumentParser(description=__doc__);mode=parser.add_mutually_exclusive_group(required=True);mode.add_argument('--apply',action='store_true');mode.add_argument('--rollback',type=Path);args=parser.parse_args();require(os.geteuid()==0,'RUN_AS_ROOT')
 if args.rollback:
  backup=args.rollback.resolve();require(backup.parent==BACKUPS and backup.name.startswith('wakhan-media-cors-backup-'),'INVALID_BACKUP')
  installer=backup/'installer.py';require(sha(installer)==INSTALLER_SHA,'BACKUP_INSTALLER_CHANGED');module=load('_wk_cors_installer',installer);module.FILES=[FILE]
  try:module.command(['systemctl','stop',module.SERVICE]);module.restore(APP,backup)
  finally:module.command(['systemctl','start',module.SERVICE])
  print('کد قبلی هدرها برگشت؛ اصلاح پخش یوتیوب و اطلاعات کاربران حفظ شدند.');return
 require(sha(ROUTE)==ROUTE_SHA and sha(INSTALLER)==INSTALLER_SHA,'REVIEWED_INSTALLER_CHANGED')
 route=load('_wk_installed_route',ROUTE);module=load('_wk_cors_installer',INSTALLER)
 module.FILES=route.contract(module,'matched');module.CONTRACTS.pop('wakhan_music/playback.py');require(module.current(APP),'INSTALLED_PLAYBACK_SOURCE_CHANGED')
 path=APP/FILE['path'];require(path.is_file()and not path.is_symlink()and sha(path)==BEFORE,'NATIVE_HEADER_SOURCE_CHANGED')
 owner,python,env=module.service_context(APP)
 status,config=module.public_json('/api/app/config');require(status==200,'CONFIG_HEALTH_FAILED')
 with tempfile.TemporaryDirectory(prefix='wakhan-cors-stage-')as folder:
  stage=Path(folder);target=stage/FILE['path']
  with urllib.request.urlopen(PAYLOAD,timeout=20)as response:raw=response.read(2_000_001)
  require(len(raw)<=2_000_000 and hashlib.sha256(raw).hexdigest()==AFTER,'PAYLOAD_CHECKSUM_FAILED');compile(raw,'reviewed-native-headers','exec');target.write_bytes(raw);target.chmod(0o644)
  module.command([python,'-c','import sys;compile(sys.stdin.read(),"reviewed-native-headers","exec")'],input=raw,cwd=APP,env=env,user=owner.pw_uid,group=owner.pw_gid,extra_groups=[])
  module.download('check-live-audio.py',module.PROBE_SHA,stage/'sound_probe.py');probe=module.probe_module(stage)
  backup=Path(tempfile.mkdtemp(prefix='wakhan-media-cors-backup-',dir=BACKUPS));backup.chmod(0o700)
  (backup/'installer.py').write_bytes(INSTALLER.read_bytes());(backup/'installer.py').chmod(0o600)
  result={'installed':False,'user_database_restored_or_deleted':False,'native_build_created':False,'phone_playback_confirmed':False}
  module.FILES=[FILE]
  print('نصب اصلاح زمان ارسال هدر فایل؛ سپس آزمون عمومی آیفون، اندروید و مجوز دسترسی.',flush=True)
  try:module.apply_files(APP,stage,backup,lambda:verify(module,probe,config,result));result['installed']=True
  except BaseException:result['rolled_back']=sha(path)==BEFORE;report(result);print('پشتیبان خصوصی:',backup);raise
  report(result);print('پشتیبان خصوصی:',backup);print('برگشت کد: python3 /root/wakhan-repair-media-cors.py --rollback '+str(backup));print('هدرهای مسیر عمومی تأیید شدند؛ پخش خود آیفون را دوباره امتحان کن.')
if __name__=='__main__':
 try:
  with open('/root/.wakhan-combined-repair.lock','a')as lock:
   try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
   except BlockingIOError:raise RuntimeError('ANOTHER_REPAIR_IS_RUNNING')
   main()
 except Exception as error:
  code=str(error)if isinstance(error,RuntimeError)and re.fullmatch('[A-Z_]+',str(error))else'MEDIA_HEADER_REPAIR_STOPPED';raise SystemExit('STOP: '+code)
