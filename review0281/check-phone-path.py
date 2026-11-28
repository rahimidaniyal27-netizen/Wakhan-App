#!/usr/bin/env python3
"""Read the installed routes and compare local/public media delivery without deploying anything."""
import collections,datetime,hashlib,importlib.util,json,os,re,stat,subprocess,sys,tempfile,time
from pathlib import Path
import urllib.request,urllib.error,urllib.parse
APP=Path('/opt/wakhan-app-0.2.11-li9z037x');ORIGIN='https://music.kabulcafe.uk'
REPAIR=Path('/root/wakhan-repair-youtube-route.py');REPAIR_SHA='850c7da4d22d94b08406fc59eb06470fe572ffe1c557c57559fd5d63c52e3b8c'
INSTALLER=Path('/root/wakhan-youtube-route-backup-ufo2rc34/installer.py');INSTALLER_SHA='6c090c6f2462df996bb4b4ee3cb4a06e1e38c1710f23b77930f397178028ad0f'
ANDROID='Wakhan/0.2.80 (Linux;Android 14) AndroidXMedia3/1.7.1'
APPLE='AppleCoreMedia/1.0.0.22A3354 (iPhone; U; CPU OS 18_0 like Mac OS X; en_us)'

def require(value,code):
 if not value:raise RuntimeError(code)
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);sys.dont_write_bytecode=True;spec.loader.exec_module(module);return module
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*a,**kw):return None

def sample(url,method='GET',range_value='bytes=0-1',agent=ANDROID,origin=None):
 headers={'User-Agent':agent,'Accept-Encoding':'identity'}
 if range_value:headers['Range']=range_value
 if origin:headers['Origin']=origin
 started=time.monotonic();value={'method':method,'range':range_value,'status':None}
 try:
  opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
  request=urllib.request.Request(url,method=method,headers=headers)
  try:response=opener.open(request,timeout=8)
  except urllib.error.HTTPError as error:response=error
  with response:
   value['status']=response.status
   mime=response.headers.get('Content-Type','').split(';')[0].lower()
   value['mime']=mime if mime in ('video/mp4','audio/mp4','audio/mpeg','audio/aac','audio/x-m4a','application/octet-stream','application/json','text/html','text/plain','application/vnd.apple.mpegurl','application/x-mpegurl') else 'other'
   for name,key,pattern in [('Content-Length','content_length',r'\d{1,15}'),('Content-Range','content_range',r'bytes (?:\d{1,15}-\d{1,15}|\*)/(?:\d{1,15}|\*)'),('Accept-Ranges','accept_ranges',r'bytes|none')]:
    raw=response.headers.get(name,'');value[key]=raw if re.fullmatch(pattern,raw) else None
   value['cors_origin_matches']=response.headers.get('Access-Control-Allow-Origin')==origin if origin else None
   if method!='HEAD':value['sample_bytes']=len(response.read(65536 if range_value=='bytes=0-65535' else 2)) if response.status in (200,206) else 0
 except Exception as error:
  value['reason']='network_timeout' if isinstance(error,TimeoutError) or 'timed out' in str(error).lower() else 'network_or_tls_failure'
 value['seconds']=round(time.monotonic()-started,2);return value

def agent_kind(value):
 value=value.lower()
 if any(x in value for x in ('exo','media3')):return 'android_native'
 if 'applecoremedia' in value:return 'ios_native'
 if 'android' in value:return 'android_web'
 if 'iphone' in value or 'ipad' in value:return 'ios_web'
 if 'lavf' in value or 'ffmpeg' in value:return 'ffmpeg'
 return 'other'
def route_kind(raw):
 path=urllib.parse.urlsplit(raw).path
 if path=='/api/app/music/audio-start':return 'personal_prepare'
 if path.startswith('/api/app/music/play/'):return 'personal_media'
 if re.fullmatch('/api/app/rooms/[^/]+/video',path):return 'salon_media'
 if path.startswith('/api/v60/audio'):return 'legacy_prepare'
 if path.startswith('/a/'):return 'legacy_media'
 return None

def access_summary(folder=Path('/var/log/nginx'),now=None):
 now=now or datetime.datetime.now(datetime.timezone.utc);counts=collections.Counter();records=0;files=0
 pattern=re.compile(r'\[([^\]]+)\]\s+"(GET|HEAD|POST|OPTIONS) ([^"\s]+) HTTP/[0-9.]+"\s+(\d{3})\s+(\d+|-)')
 for path in sorted(folder.glob('*access*.log'))[:12]:
  try:
   if not path.is_file() or not stat.S_ISREG(path.stat().st_mode):continue
   with path.open('rb') as stream:stream.seek(max(0,path.stat().st_size-524288));lines=stream.read(524288).decode('utf-8','replace').splitlines()[-1500:]
   files+=1
  except OSError:continue
  for line in lines:
   match=pattern.search(line)
   if not match:continue
   try:when=datetime.datetime.strptime(match[1],'%d/%b/%Y:%H:%M:%S %z')
   except ValueError:continue
   if not 0<=(now-when).total_seconds()<=1200:continue
   kind=route_kind(match[3])
   if not kind:continue
   quoted=re.findall(r'"([^"\n]*)"',line);agent=agent_kind(quoted[2] if len(quoted)>2 else '')
   counts[(kind,match[2],int(match[4]),agent)]+=1;records+=1
 return {'window_minutes':20,'readable_files':files,'matching_requests':records,'groups':[{'route':kind,'method':method,'status':status,'client':agent,'count':count} for (kind,method,status,agent),count in sorted(counts.items())]}

def journal_summary():
 try:
  p=subprocess.run(['journalctl','-u','wakhan-app.service','--since','20 minutes ago','--no-pager','-o','cat','-n','350'],capture_output=True,timeout=8)
  text=p.stdout.decode('utf-8','replace')
  return {key:text.count(key) for key in ('ROOM_VIDEO source_unavailable','audio_timeout','source_access_denied','audio_metadata_rejected','audio_network_config')}
 except Exception:return {'available':False}

def public_media(raw,base,probe):
 local=probe.playable(raw,base);public=urllib.parse.urljoin(ORIGIN,raw);parts=urllib.parse.urlsplit(public)
 require(parts.scheme=='https' and parts.netloc=='music.kabulcafe.uk' and local.startswith(base+'/'),'UNREVIEWED_MEDIA_SOURCE')
 return local,public

def check_media(probe,base,raw):
 local,public=public_media(raw,base,probe)
 result={'local_range':sample(local),'public_android':sample(public,range_value='bytes=0-65535'),'public_ios_probe':sample(public,agent=APPLE),'public_head':sample(public,method='HEAD'),'public_web_origin':sample(public,origin='https://localhost')}
 if result['public_android'].get('status') in (200,206) and result['public_android'].get('sample_bytes',0)>0:result['public_audio']=probe.diagnose(public,timeout=20)
 if result['local_range'].get('status') in (200,206) and not result.get('public_audio',{}).get('audio_signal_confirmed'):result['local_audio']=probe.diagnose(local,timeout=20)
 return result

def fixed_error(data):
 value=data.get('err');allowed={'auth','subscription','subscription_required','audio_timeout','audio_unavailable','source_busy','audio_resolver_unavailable','youtube_setup','audio_not_ready','forbidden','not_found'};return value if value in allowed else 'other' if value else None

def run(module,probe):
 base,token=probe.context(APP);result={'code_changed':False,'service_changed':False,'new_session_created':False,'tests':[],'recent_phone_requests':access_summary(),'server_error_counts':journal_summary()}
 status,home=probe.api(base,token,'/api/app/salon/home');mine=home.get('mine') or {};code=mine.get('code');room={}
 if status==200 and isinstance(code,str) and re.fullmatch('[A-Z0-9]{4,8}',code):
  status,room=probe.api(base,token,'/api/c/'+code+'?v=-1');media=room.get('media') or {}
  result['salon']={'state_status':status,'owner_present':isinstance(room.get('mine'),int) and room['mine']>=0,'playing':room.get('playing') is True,'music_mode':room.get('wkm_music') is True,'media_kind':media.get('kind') if media.get('kind') in ('native','soundcloud','youtube') else 'other'}
  if status==200 and result['salon']['owner_present'] and media.get('kind')=='native' and media.get('formats'):
   result['tests'].append(dict(label='salon.current',**check_media(probe,base,media['formats'][0].get('url'))))
 videos=[('personal.reference','HKDb1xi2uGE')];vid=room.get('vid')
 if isinstance(vid,str) and re.fullmatch('[A-Za-z0-9_-]{11}',vid) and vid!='HKDb1xi2uGE':videos.insert(0,('personal.current_salon_song',vid))
 for label,vid in videos:
  started=time.monotonic();status,data=probe.api(base,token,'/api/app/music/audio-start?id=yt.'+vid,40);elapsed=round(time.monotonic()-started,2)
  item={'label':label,'prepare_status':status,'prepare_seconds':elapsed,'client_20s_timeout_exceeded':elapsed>=20,'error':fixed_error(data)}
  if status==200 and data.get('ok'):item.update(check_media(probe,base,data.get('src')))
  result['tests'].append(item)
 return result

def main():
 require(os.geteuid()==0,'RUN_AS_ROOT');require(sha(REPAIR)==REPAIR_SHA and sha(INSTALLER)==INSTALLER_SHA,'REVIEWED_FILES_CHANGED')
 route=load('_wk_installed_route',REPAIR);module=load('_wk_original_installer',INSTALLER)
 module.FILES=route.contract(module,'matched');module.CONTRACTS.pop('wakhan_music/playback.py');require(module.current(APP),'CURRENT_ROUTE_SOURCE_CHANGED')
 with tempfile.TemporaryDirectory(prefix='wakhan-phone-path-') as folder:
  stage=Path(folder);module.download('check-live-audio.py',module.PROBE_SHA,stage/'sound_probe.py');probe=module.probe_module(stage)
  print('بررسی آهنگ فعلی، مسیر عمومی و درخواست‌های گوشی؛ بدون نصب یا تغییر سرویس.',flush=True)
  print(json.dumps(run(module,probe),ensure_ascii=False,indent=2),flush=True)
if __name__=='__main__':
 try:main()
 except Exception as error:
  code=str(error) if isinstance(error,RuntimeError) and re.fullmatch('[A-Z_]+',str(error)) else 'PHONE_PATH_CHECK_STOPPED'
  raise SystemExit('STOP: '+code)
