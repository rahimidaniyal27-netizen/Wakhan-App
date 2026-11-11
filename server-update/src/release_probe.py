"""Probe the actual isolated 028 service without logging account data or credentials."""
import asyncio
import json
from pathlib import Path
import sys
from aiohttp.test_utils import TestClient,TestServer
from native_runtime import create_app
from stage_probe import decode


async def run(settings,media=True):
    app=create_app(settings,workers=False);ns=app['wakhan_namespace'];owner=int(settings['owner'])
    result={}
    async with TestClient(TestServer(app)) as client:
        rows=ns['dbq']('select sid from wka_sessions where uid=? order by seen desc limit 1',owner)
        if not rows:raise RuntimeError('OWNER_EXISTING_SESSION_NOT_FOUND')
        sid=rows[0][0];key=ns['WM_APP'].PREFIX+sid+'.'+ns['WM_APP'].sign(sid);headers={'X-Init':key}
        async def get(path,auth=True):
            response=await client.get(path,headers=headers if auth else {})
            if response.status!=200:raise RuntimeError('RELEASE_API_PROBE_FAILED')
            return await response.json()
        health=await get('/health',False);config=await get('/api/app/config',False);me=await get('/api/me')
        result['version']=health.get('version');result['standalone']=health.get('standalone') is True
        result['existing_session']=me.get('me',{}).get('id')==owner
        result['owner_public_id']=me.get('me',{}).get('public_id')
        result['features']=config.get('features',[])
        result['replies']=(await get('/api/v70/inbox')).get('reply_supported') is True
        result['room_tools']=(await get('/api/app/rooms')).get('ok') is True
        result['preferences']=(await get('/api/app/preferences')).get('moderator') is True
        result['report_review']=(await get('/api/app/moderation/reports')).get('ok') is True
        ice=(await get('/api/turn')).get('ice',[])
        result['tls_443_advertised']=any('turns:turn.kabulcafe.uk:443?transport=tcp' in ([x.get('urls')] if isinstance(x.get('urls'),str) else x.get('urls',[])) for x in ice)
        result['forbidden_sdk_loaded']=any(name in sys.modules for name in ('aiogram','pyrogram','pytgcalls','ntgcalls'))
        result['legacy_accounts_absent']=not ns['dbq']('select uid from wka_accounts where uid in (?,?)',8434419791,8584042529)
        result['media']={'checked':bool(media),'ok':not media}
        if media:
            track=await asyncio.to_thread(ns['WM_VIDEO'].extract,'https://www.youtube.com/watch?v=oSbzN0OZYMM')
            video=await asyncio.to_thread(decode,track['path'],track.get('_v_headers'),True)
            audio=await asyncio.to_thread(decode,track.get('_v_audio_path') or track['path'],track.get('_v_headers'),False)
            result['media'].update(ok=video and audio,video_decoded=video,audio_decoded=audio)
        result['ok']=all(result.get(x) for x in ('standalone','existing_session','replies','room_tools','preferences','report_review','tls_443_advertised','legacy_accounts_absent')) and not result['forbidden_sdk_loaded'] and result['media']['ok'] and result['version']=='0.2.8-beta'
    return result


if __name__=='__main__':
    print(json.dumps(asyncio.run(run(json.loads(Path(sys.argv[1]).read_text()),'--no-media' not in sys.argv))),flush=True)
