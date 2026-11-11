"""Standalone Wakhan HTTP service. No messaging SDK, bot polling or group-call client."""
import asyncio
from contextlib import suppress
import json
import logging
from pathlib import Path
import sqlite3
import time
from aiohttp import web
from session_keys import read_key
from public_ids import PublicIds
from native_profiles import Authority, Profiles
from native_receipts import Receipts
from native_preferences import install as install_preferences
from native_social import install as install_social
from native_admin import install as install_administration
from native_room_core import upgrade as upgrade_room_core
from native_room_video import install as install_room_video
from native_migrations import cleanup_legacy_accounts
from wakhan_app import WakhanApp
from wakhan_app_native_n1 import NativeApp
from wakhan_personal_v4 import PersonalPlans, PROTECTED
from wakhan_finance_v6 import Finance
from wakhan_checkout_v8 import Checkout
from wakhan_wallet_v23 import Wallet
from wakhan_identity_v7 import Identity
from wakhan_experience_v9 import Experience
from wakhan_cinema_v12 import Cinema
from wakhan_community_v70 import Community
from wakhan_hall51 import Hall51
from wakhan_frames_v24 import Frames
from wakhan_audio_v17 import AudioPlayer
from wakhan_audio_player_v60 import AudioService
from wakhan_library_v60 import LibraryAPI
from wakhan_home_v16 import HomeFeed
from wakhan_resolver_v43 import ReadableVideo

ENV_KEYS=frozenset(('TURN_HOST','TURN_PORT','TURN_SECRET','TURN_TLS_HOST','TURN_TLS_PORT',
    'WKA_GOOGLE_CLIENT_ID','WKA_CONTACT_EMAIL','WKA_FACEBOOK_APP_ID','WKA_FACEBOOK_APP_SECRET',
    'WKA_SMTP_HOST','WKA_SMTP_PORT','WKA_SMTP_USER','WKA_SMTP_PASS','WKA_MAIL_FROM','WKA_FCM_KEY'))


def create_app(settings,workers=True):
    root=Path(settings['base']).resolve();data=Path(settings['data']).resolve()
    database=Path(settings['database']).resolve()
    if not database.is_file():raise RuntimeError('MIGRATED_DATABASE_NOT_FOUND')
    supplied=settings.get('env',{})
    if set(supplied)-ENV_KEYS:raise RuntimeError('UNREVIEWED_NATIVE_CONFIGURATION_KEY')
    env={key:str(value) for key,value in supplied.items()}
    db=sqlite3.connect(database,check_same_thread=False,timeout=10)
    db.execute('pragma foreign_keys=on')
    db.execute('create table if not exists wka_native_access(uid integer primary key,until integer not null)');db.commit()
    db.execute('create table if not exists room_hosts(code text not null,uid integer not null,primary key(code,uid))');db.commit()
    logger=logging.getLogger('wakhan.app')
    ns={'__name__':'wakhan_native_core','BASE':str(root),'DATA':str(data),'CACHE':str(root/'cache'),
        'WEB':str(root/'web'),'DB':db,'ENV':env,'OWNER':int(settings['owner']),
        'PORT':int(settings.get('port',10010)),'MAXDUR':21600,'LONG':1500,'log':logger,
        'APP_SESSION_KEY':read_key(settings['session_key_file']),'WM_PERSONAL_PROTECTED':PROTECTED}
    for folder in (data,root/'cache',root/'web'):folder.mkdir(parents=True,exist_ok=True)
    exec(compile(upgrade_room_core((root/'app_core.py').read_text()),str(root/'app_core.py'),'exec'),ns)
    async def my_groups(uid):return []
    ns['my_groups']=my_groups
    accounts=WakhanApp(ns);accounts._env=env.copy();accounts.init()
    ns['WM_APP']=accounts
    row=db.execute('select done,blocked from wka_accounts where uid=?',(ns['OWNER'],)).fetchone()
    if not row or not row[0] or row[1]:raise RuntimeError('OWNER_NATIVE_ACCOUNT_NOT_READY')
    authority=Authority(ns);ns['WM_OPS']=authority
    ns['WM_PUBLIC_IDS']=PublicIds(db)
    ns['WM_PUBLIC_IDS'].assign_existing(ns['OWNER'])
    ns['WM_SYNC']=Profiles(ns)
    ns['WM_PERSONAL']=PersonalPlans(ns)
    ns['WM_FINANCE']=Finance(ns)
    ns['WM_IDENTITY']=Identity(ns)
    ns['WM_CHECKOUT']=Checkout(ns)
    ns['WM_WALLET']=Wallet(ns)
    ns['WM_RECEIPTS']=Receipts(ns)
    ns['WM_FRAMES']=Frames(ns)
    ns['WM_EXPERIENCE']=Experience(ns)
    ns['WM_CINEMA']=Cinema(ns)
    ns['WM_COMMUNITY70']=Community(ns);ns['WM_COMMUNITY70'].install()
    ns['WM_HALL51']=Hall51(ns);ns['WM_HALL51'].install()
    accounts.install()
    ns['WM_APP_NATIVE_N1']=NativeApp(ns,accounts);ns['WM_APP_NATIVE_N1'].install()
    ns['WM_AUDIO']=AudioPlayer(ns);ns['WM_AUDIO'].install()
    ns['WM_VIDEO']=ReadableVideo(ns)
    ns['WM_AUDIO_SERVICE']=AudioService(ns)
    ns['WM_LIBRARY']=LibraryAPI(ns)
    ns['WM_HOME']=HomeFeed(ns)
    ns['_cache_init']()
    app=web.Application(client_max_size=7_000_000)
    app['wakhan_namespace']=ns
    ns['WM_COMMUNITY70'].routes(app)
    ns['WM_RECEIPTS'].routes(app)
    install_preferences(app,ns)
    install_social(app,ns)
    install_administration(app,ns)
    install_room_video(app,ns)
    app['wakhan_migration']=cleanup_legacy_accounts(ns,accounts,settings.get('remove_legacy_accounts'))

    async def health(request):
        return ns['J']({'ok':True,'service':'wakhan-app','standalone':True,'version':'0.2.9-beta'})
    async def landing(request):
        return web.Response(text='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wakhan</title><main dir="rtl"><h1>واخان</h1><a href="/download/Wakhan.apk">دریافت برنامهٔ واخان</a></main>',content_type='text/html')
    async def download(request):
        path=root/'releases/Wakhan.apk'
        if not path.is_file():raise web.HTTPNotFound()
        return web.FileResponse(path,headers={'Content-Type':'application/vnd.android.package-archive','Cache-Control':'no-store'})
    async def cinema_lock(request):
        return ns['J']({'ok':True,'configured':False,'unlocked':True,'retry_after':0})
    async def me(request):
        uid=int(request['u']['id'])
        return ns['J']({'ok':True,'me':ns['WM_SYNC'].profile(request['u']),
            'identity':await ns['WM_IDENTITY'].profile(uid),'entitlement':await ns['WM_PERSONAL'].entitlement(uid),
            'finance':ns['WM_FINANCE'].summary(uid),'groups':[],
            'srch':[r[0] for r in ns['dbq']("select q from searches where uid=? and kind='m' order by ts desc limit 12",uid)],
            'ysrch':[r[0] for r in ns['dbq']("select q from searches where uid=? and kind='y' order by ts desc limit 12",uid)],
            'yhist':[dict(zip(('vid','title','ch'),row)) for row in ns['dbq']('select vid,title,ch from ythist where uid=? order by ts desc limit 20',uid)],
            'favs':[dict(zip(('url','title','thumb','dur','src'),row)) for row in ns['dbq']('select url,title,thumb,dur,src from favs where uid=? order by ts desc limit 50',uid)],
            'phist':[dict(zip(('url','title','thumb','dur'),row)) for row in ns['dbq']('select url,title,thumb,dur from phist where uid=? order by ts desc limit 20',uid)],
            'un':request['u'].get('username',''),'stats':{'plays':ns['dbq']('select count(*) from phist where uid=?',uid)[0][0],
                'srch':ns['dbq']('select count(*) from searches where uid=?',uid)[0][0],
                'watched':ns['dbq']('select count(*) from ythist where uid=?',uid)[0][0]}})
    app.router.add_get('/',landing);app.router.add_get('/health',health);app.router.add_get('/download/Wakhan.apk',download)
    app.router.add_get('/s/{f}',ns['web_static']);app.router.add_get('/a/{f}',ns['audio_file'])
    app.router.add_get('/ava/{u}',ns['WM_SYNC'].avatar)
    app.router.add_get('/api/me',ns['auth'](me));app.router.add_get('/api/profile',ns['auth'](ns['WM_SYNC'].api_profile))
    for verb,path,handler,wrapped in [
        ('GET','/api/identity',ns['WM_IDENTITY'].api_profile,True),
        ('GET','/api/personal',ns['WM_PERSONAL'].catalog,True),('POST','/api/personal/order',ns['WM_PERSONAL'].order,True),
        ('POST','/api/personal/trial',ns['WM_PERSONAL'].trial,True),
        ('GET','/api/search',ns['api_search'],False),('GET','/api/stream',ns['api_stream'],False),
        ('POST','/api/fav',ns['api_fav'],False),('POST','/api/clear',ns['api_clear'],False),
        ('GET','/api/yfeed',ns['WM_HOME'].feed,True),('POST','/api/yhist',ns['api_yhist'],False),
        ('GET','/api/cinema/search',ns['WM_CINEMA'].api_search,True),('GET','/api/cinema/providers',ns['WM_CINEMA'].api_providers,True),
        ('GET','/api/cinema/lock',cinema_lock,True),
        ('GET','/api/turn',ns['api_turn'],False),('POST','/api/room/new',ns['api_room_new'],False),('GET','/api/room/{g}',ns['api_room_check'],False),
        ('GET','/api/c/{g}',ns['api_cin'],False),('POST','/api/c/{g}',ns['api_cinctl'],False),
        ('GET','/api/cv/{g}/poll',ns['api_cv_poll'],False),('POST','/api/cv/{g}',ns['api_cv'],False),
        ('GET','/api/wallet',ns['WM_WALLET'].api,True),('POST','/api/wallet',ns['WM_WALLET'].api,True),
        ('GET','/api/checkout',ns['WM_CHECKOUT'].api_catalog,True),('POST','/api/checkout/prepare',ns['WM_CHECKOUT'].api_prepare,True),
        ('GET','/api/checkout/status',ns['WM_CHECKOUT'].api_status,True),
        ('GET','/api/finance',ns['WM_FINANCE'].api_summary,True),('GET','/api/finance/orders',ns['WM_FINANCE'].api_orders,True),
        ('POST','/api/finance/seen',ns['WM_FINANCE'].api_seen,True),('POST','/api/finance/review',ns['WM_FINANCE'].api_review,True),
        ('GET','/api/finance/staff',ns['WM_FINANCE'].api_staff,True),('POST','/api/finance/staff',ns['WM_FINANCE'].api_staff,True),
        ('GET','/api/finance/receivers',ns['WM_FINANCE'].api_receivers,True),('POST','/api/finance/receivers',ns['WM_FINANCE'].api_receivers,True),
        ('GET','/api/finance/receipt/{kind}/{id}',ns['WM_FINANCE'].api_receipt,True),
        ('GET','/api/frames',ns['WM_FRAMES'].api,True),('POST','/api/frames',ns['WM_FRAMES'].api,True),
        ('GET','/api/v60/library',ns['WM_LIBRARY'].api,True),('POST','/api/v60/library',ns['WM_LIBRARY'].api,True),
        ('GET','/api/v60/audio',ns['WM_AUDIO_SERVICE'].api,True),
    ]:
        app.router.add_route(verb,path,ns['auth'](handler) if wrapped else handler)

    async def background(application):
        tasks=[asyncio.create_task(ns[name]()) for name in ('cin_sweep','cache_clean')] if workers else []
        yield
        for task in tasks:task.cancel()
        for task in tasks:
            with suppress(asyncio.CancelledError):await task
        await ns['WM_AUDIO_SERVICE'].close()
        await ns['WM_ROOM_VIDEO'].close()
        db.close()
    app.cleanup_ctx.append(background)
    return app


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--config',required=True);args=parser.parse_args()
    settings=json.loads(Path(args.config).read_text())
    logging.basicConfig(level=logging.INFO)
    web.run_app(create_app(settings),host='127.0.0.1',port=int(settings.get('port',10010)),print=None,access_log=None)
