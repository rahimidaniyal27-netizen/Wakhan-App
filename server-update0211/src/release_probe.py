"""Probe the actual isolated 0211 service without logging account data or credentials."""
import asyncio
import json
from pathlib import Path
import sys
import time
import urllib.request
from aiohttp.test_utils import TestClient,TestServer
from native_runtime import create_app
from stage_probe import decode


def provider_health(settings):
    result={}
    try:
        key=(Path(settings['data'])/'browser-v39.key').read_text().strip()
        request=urllib.request.Request('http://127.0.0.1:4417/health',headers={'Authorization':'Bearer '+key})
        opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(request,timeout=4) as response:value=json.loads(response.read(16384));result['status']=response.status
        for name in ('ready','browser_started'):
            if type(value.get(name)) is bool:result[name]=value[name]
        if value.get('last_error') in (None,'browser_timeout','browser_start_failed','browser_token_unavailable','webpo_unavailable','webpo_not_ready','webpo_invalid_response','browser_mint_failed'):result['last_error']=value.get('last_error')
    except Exception as error:
        result['reachable']=False;result['error_type']=type(error).__name__
        if type(getattr(error,'code',None)) is int:result['status']=error.code
    return result


async def run(settings,media=True):
    app=create_app(settings,workers=False);ns=app['wakhan_namespace'];owner=int(settings['owner'])
    result={}
    async with TestClient(TestServer(app)) as client:
        rows=ns['dbq']('select sid from wka_sessions where uid=? order by seen desc limit 1',owner)
        if not rows:raise RuntimeError('OWNER_EXISTING_SESSION_NOT_FOUND')
        sid=rows[0][0];key=ns['WM_APP'].PREFIX+sid+'.'+ns['WM_APP'].sign(sid);headers={'X-Init':key}
        async def get(path,auth=True):
            response=await client.get(path,headers=headers if auth else {})
            if response.status!=200:raise RuntimeError('RELEASE_API_PROBE_FAILED_'+str(response.status)+'_'+path.replace('/','_'))
            return await response.json()
        health=await get('/health',False);config=await get('/api/app/config',False);me=await get('/api/me')
        result['expected_version']='0.2.11-beta';result['config_version']=config.get('version')
        result['version_matches']=health.get('version')==result['expected_version'] and config.get('version')==result['expected_version']
        result['version']=health.get('version');result['standalone']=health.get('standalone') is True
        result['existing_session']=me.get('me',{}).get('id')==owner
        result['owner_public_id']=me.get('me',{}).get('public_id')
        result['features']=config.get('features',[])
        store=await get('/api/app/commerce?country=DE')
        result['commerce_catalog']=store.get('currency')=='EUR' and [p['months'] for p in store.get('plans',[])]==[1,6,12]
        result['free_core']=me.get('entitlement',{}).get('free_core') is True
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
            started=time.monotonic()
            try:
                response=await client.post('/api/room/new',headers=headers,json={'name':'Wakhan isolated playback check'})
                if response.status!=200:raise RuntimeError('PROBE_ROOM_CREATE_FAILED')
                code=(await response.json())['code']
                response=await client.post('/api/c/'+code,headers=headers,json={'a':'join'})
                if response.status!=200:raise RuntimeError('PROBE_ROOM_JOIN_FAILED')
                response=await client.post('/api/c/'+code,headers=headers,json={'a':'load','vid':'oSbzN0OZYMM','title':'Isolated playback check'})
                state=await response.json()
                if response.status!=200 or state.get('media',{}).get('kind')!='native':raise RuntimeError('PROBE_NATIVE_VIDEO_MISSING')
                url=state['media']['formats'][0]['url']
                response=await client.head(url)
                if response.status!=200:raise RuntimeError('PROBE_ROOM_VIDEO_NOT_READY')
                proxy=str(client.make_url(url))
                video,audio=await asyncio.gather(asyncio.to_thread(decode,proxy,None,True),asyncio.to_thread(decode,proxy,None,False))
                response=await client.get(url,headers={'Range':'bytes=0-1023'});ranged=response.status==206 and len(await response.read())==1024
                result['media'].update(ok=video and audio and ranged,video_decoded=video,audio_decoded=audio,room_proxy=True,range_supported=ranged)
            except Exception as error:
                result['media']['error_type']=type(error).__name__
                if str(error) in ('source_timeout','no_readable_video','source_busy','source_worker_failed','blocked','size','failed','timeout','source_differs'):result['media']['reason']=str(error)
                state=ns.get('WM_RESOLVER_STATUS',{});public={}
                if state.get('phase') in ('options','extract','availability','probe','probe_budget','worker_start','worker_deadline'):public['phase']=state['phase']
                if state.get('reason') in ('timeout','no_readable_video','source_busy','source_worker_failed','blocked','size','failed','source_differs'):public['reason']=state['reason']
                for name in ('elapsed_seconds','checks','waited_seconds'):
                    if type(state.get(name)) in (int,float):public[name]=state[name]
                if public:result['media']['resolver']=public
            result['media']['seconds']=round(time.monotonic()-started,3)
            if not result['media']['ok']:result['media']['provider']=await asyncio.to_thread(provider_health,settings)
        result['online_visibility']=(await get('/api/app/presence')).get('ok') is True
        result['native_administration']=(await get('/api/app/admin')).get('ok') is True
        required=('standalone','existing_session','replies','room_tools','preferences','report_review','tls_443_advertised','legacy_accounts_absent','online_visibility','native_administration','commerce_catalog','free_core','version_matches')
        result['failed_checks']=[name for name in required if result.get(name) is not True]
        if result['forbidden_sdk_loaded']:result['failed_checks'].append('forbidden_sdk_loaded')
        if not result['media']['ok']:result['failed_checks'].append('media')
        result['ok']=not result['failed_checks']
    return result


if __name__=='__main__':
    print(json.dumps(asyncio.run(run(json.loads(Path(sys.argv[1]).read_text()),'--no-media' not in sys.argv))),flush=True)
