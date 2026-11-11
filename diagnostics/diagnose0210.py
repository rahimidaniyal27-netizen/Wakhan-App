#!/usr/bin/env python3
"""Observe a failed isolated build. Never change production services or its database."""
import hashlib,json,os,subprocess,zipfile
from pathlib import Path

STAGE=Path('/opt/wakhan-app-0.2.10-yw2xuyjy')
PYTHON=Path('/opt/wakhan-app-stage-20261110-100826-8x_4se3m/.venv/bin/python')
EXPECTED={'release_probe.py':'6cfccbbc159a223a49e6892a96af4c83e0d7000660a8bb61009599c1dd409539','native_room_video.py':'58db10a4c09b7496c6fa74e66e496ecd866cf17a5b9561e4bc367cb630759778'}

CHILD=r'''
import asyncio,json,sys
from pathlib import Path
stage=Path(sys.argv[1]);sys.path.insert(0,str(stage))
import native_room_video as video
audit={}
source,upstream,authorize=video.RoomVideo.source,video.RoomVideo.upstream,video.RoomVideo.authorize
async def observed_source(self,vid):
    try:
        value=await source(self,vid);audit['source_resolved']=True;return value
    except Exception as error:
        audit['source_resolved']=False;audit['source_error_type']=type(error).__name__
        if str(error) in ('muxed_video_required','source_busy','no_readable_video','source_worker_failed','size','failed','timeout'):audit['source_error']=str(error)
        raise
async def observed_upstream(self,track,range_value):
    try:
        result=await upstream(self,track,range_value);audit['upstream_status']=result.status
        kind=result.headers.get('Content-Type','').split(';')[0]
        audit['upstream_type']=kind if kind in ('video/mp4','application/octet-stream','text/plain','text/html') else 'other'
        return result
    except Exception as error:audit['upstream_error_type']=type(error).__name__;raise
def observed_authorize(self,request):
    try:return authorize(self,request)
    except Exception as error:
        audit['authorization_error_type']=type(error).__name__
        raise
video.RoomVideo.source=observed_source;video.RoomVideo.upstream=observed_upstream;video.RoomVideo.authorize=observed_authorize
# Add only fixed error codes to the existing sanitized probe. No URLs, headers,
# account rows, provider responses or credentials are ever exported.
code=(stage/'release_probe.py').read_text().replace("if str(error) in (","if str(error) in ('PROBE_ROOM_CREATE_FAILED','PROBE_ROOM_JOIN_FAILED','PROBE_NATIVE_VIDEO_MISSING','PROBE_ROOM_VIDEO_NOT_READY',")
namespace={'__name__':'diagnostic_probe'};exec(compile(code,str(stage/'release_probe.py'),'exec'),namespace)
async def main():
    settings=json.loads((stage/'private/app.json').read_text())
    result=await namespace['run'](settings)
    result['media']['diagnostic']=audit
    result['services_changed']=False;result['live_database_changed']=False
    print(json.dumps(result),flush=True)
asyncio.run(main())
'''


def main():
    if os.geteuid()!=0:raise SystemExit('RUN_AS_ROOT')
    os.umask(0o077)
    if STAGE.is_symlink() or not STAGE.is_dir():raise SystemExit('EXPECTED_ISOLATED_STAGE_MISSING')
    for name,expected in EXPECTED.items():
        path=STAGE/name
        if path.is_symlink() or hashlib.sha256(path.read_bytes()).hexdigest()!=expected:raise SystemExit('STAGED_SOURCE_DIFFERS')
    settings=json.loads((STAGE/'private/app.json').read_text())
    if Path(settings['base']).resolve()!=STAGE or Path(settings['data']).resolve()!=STAGE/'data' or not Path(settings['database']).resolve().is_relative_to(STAGE/'data') or (STAGE/'data').is_symlink():raise SystemExit('ISOLATED_DATABASE_REQUIRED')
    live=subprocess.run(['systemctl','show','wakhan-app.service','-p','ExecStart','--value'],capture_output=True,text=True,check=True)
    if str(STAGE) in live.stdout:raise SystemExit('STAGE_ALREADY_LIVE_DIAGNOSIS_CANCELLED')
    print('CHECKING_ISOLATED_PLAYBACK_ONLY',flush=True)
    try:
        result=subprocess.run(['runuser','-u','musicbot','--',str(PYTHON),'-c',CHILD,str(STAGE)],cwd=STAGE,capture_output=True,text=True,timeout=200)
        if result.returncode:raise ValueError()
        report=json.loads(result.stdout.strip().splitlines()[-1])
    except subprocess.TimeoutExpired:report={'ok':False,'diagnostic_failed':True,'reason':'diagnostic_timeout','services_changed':False,'live_database_changed':False}
    except (ValueError,IndexError):report={'ok':False,'diagnostic_failed':True,'exit_code':result.returncode,'services_changed':False,'live_database_changed':False}
    target=Path('/root/wakhan-0210-diagnostic.zip')
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:archive.writestr('diagnostic.json',json.dumps(report,indent=2))
    target.chmod(0o600);print(json.dumps(report,indent=2));print('REPORT_READY:',target)


if __name__=='__main__':main()
