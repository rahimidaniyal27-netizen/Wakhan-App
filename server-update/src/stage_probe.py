"""Actual native service/data/source gate. Report contains no user rows or secrets."""
import asyncio
import json
from pathlib import Path
import subprocess
import sys
import time
from aiohttp.test_utils import TestClient,TestServer
from native_runtime import create_app


def decode(source,headers,video):
    command=['ffmpeg','-v','error','-nostdin','-threads','1','-rw_timeout','7000000']
    if headers:command+=['-headers',''.join(k+': '+v+'\r\n' for k,v in headers.items())]
    command+=['-i',source,'-t','3', '-an' if video else '-vn','-f','null','-']
    try:
        result=subprocess.run(command,capture_output=True,timeout=25)
        return result.returncode==0
    except (OSError,subprocess.TimeoutExpired):return False


async def main():
    settings=json.loads(Path(sys.argv[1]).read_text())
    report={'native_service':False,'existing_session':False,'source':{'ok':False}}
    app=create_app(settings,workers=False);ns=app['wakhan_namespace']
    async with TestClient(TestServer(app)) as client:
        response=await client.get('/health');report['native_service']=response.status==200 and (await response.json()).get('standalone') is True
        owner=int(settings['owner'])
        # Reuse an existing session ID from the database copy. The exact old app
        # signing key was migrated separately; no session or key is printed.
        rows=ns['dbq']('select sid from wka_sessions where uid=? order by seen desc limit 1',owner)
        if not rows:raise RuntimeError('OWNER_EXISTING_SESSION_NOT_FOUND')
        sid=rows[0][0];key=ns['WM_APP'].PREFIX+sid+'.'+ns['WM_APP'].sign(sid)
        response=await client.get('/api/me',headers={'X-Init':key})
        value=await response.json();report['existing_session']=response.status==200 and value.get('me',{}).get('id')==owner
        report['owner_public_id']=value.get('me',{}).get('public_id')
        response=await client.get('/api/app/config');config=await response.json()
        report['google_configured']=bool(config.get('google'));report['native_config']=bool(config.get('native'))
        report['removed_routes']={}
        for path in ('/api/app/telegram/poll','/api/v60/helper','/api/g/-100123'):
            response=await client.get(path);report['removed_routes'][path]=response.status==404
        report['forbidden_sdk_loaded']=any(name in sys.modules for name in ('aiogram','pyrogram','pytgcalls','ntgcalls'))
        report['counts']={}
        for table in ('users','wka_accounts','wka_sessions','wm_coin_accounts','wm_coin_ops','wm70_dm','wm51_halls','rooms'):
            report['counts'][table]=ns['dbq']('select count(*) from '+table)[0][0]
        report['source']['started']=True
        start=time.monotonic()
        try:
            track=await asyncio.to_thread(ns['WM_VIDEO'].extract,'https://www.youtube.com/watch?v=oSbzN0OZYMM')
            video=await asyncio.to_thread(decode,track['path'],track.get('_v_headers'),True)
            audio=await asyncio.to_thread(decode,track.get('_v_audio_path') or track['path'],track.get('_v_headers'),False)
            report['source'].update(ok=video and audio,video_decoded=video,audio_decoded=audio)
        except Exception as error:
            report['source']['error_type']=type(error).__name__
            code=str(error)
            if code in ('source_worker_failed','no_readable_video','source_differs','blocked','size','failed','timeout'):
                report['source']['error_code']=code
        report['source']['seconds']=round(time.monotonic()-start,3)
    # Only JSON with flags/counts. Never return the source track or signed media URLs.
    print(json.dumps(report),flush=True)


if __name__=='__main__':asyncio.run(main())
