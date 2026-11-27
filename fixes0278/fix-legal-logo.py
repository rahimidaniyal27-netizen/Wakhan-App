#!/usr/bin/env python3
"""Replace only the legal header placeholder with the original Wakhan logo.
Owner-operated; backs up the source and restarts only wakhan-app.
No database, authentication configuration, SSH or VPN changes.
"""
import argparse,base64,contextlib,hashlib,json,os
from pathlib import Path
import pwd,stat,subprocess,tempfile,time,urllib.request,signal

APP=Path('/opt/wakhan-app-0.2.11-li9z037x')
SERVICE='wakhan-app'
OLD='<div class="logo">W</div>'
BRAND_B64='PHN2ZyBpZD0id2stYnJhbmQtbG9nby12MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTI4IDEyOCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByb2xlPSJpbWciIGFyaWEtbGFiZWw9ItmI2KfYrtin2YYg2YXZiNiy24zaqSI+CjxkZWZzPjxjbGlwUGF0aCBpZD0id2stYnJhbmQtY2xpcC12MSI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIHJ4PSIzMCIvPjwvY2xpcFBhdGg+PGxpbmVhckdyYWRpZW50IGlkPSJ3ay1icmFuZC1zaGFkb3ctdjEiIHgxPSIuMiIgeTE9Ii4yIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIHN0b3AtY29sb3I9IiMwMDBkNTQiIHN0b3Atb3BhY2l0eT0iLjY1Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDAwZDU0IiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz4KPGcgY2xpcC1wYXRoPSJ1cmwoI3drLWJyYW5kLWNsaXAtdjEpIj48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iIzAwNDdmZiIvPgo8cGF0aCBkPSJNNDUuNCAzNC4zIDEyOCAxMjhINzhMNDkuNCA5NS4xIDI2LjggNDEuMVpNODIuMyAzNC4zIDEyOCA5MFYxMjhIMTAwTDc3LjEgOTUuMVoiIGZpbGw9InVybCgjd2stYnJhbmQtc2hhZG93LXYxKSIvPgo8cGF0aCBkPSJNMjYuOCA0MS4xIDQ1LjQgMzQuM0MzOC44IDQ0LjIgMzguMCA1OS45IDQ2LjMgNzMuNEw2NCA0My45IDgwLjggNzMuNEM4OC4xIDU5LjcgOTAuMCA0NC4yIDgyLjMgMzQuM0wxMDAuNSA0MS4xQzEwMSA2Mi4wIDkxLjQgODIuOSA3Ny4xIDk1LjFMNjMuNyA2NS4zIDQ5LjQgOTUuMUMzNC42IDgyLjIgMjUuOSA2MS44IDI2LjggNDEuMVoiIGZpbGw9IiNmZmYiLz48L2c+PC9zdmc+'
NEW='<img class="logo" src="data:image/svg+xml;base64,'+BRAND_B64+'" alt="Wakhan" width="44" height="44" style="display:block;background:none;flex:none">'


def require(ok,code):
    if not ok:raise RuntimeError(code)


def transform(source):
    if source.count(NEW)==1 and OLD not in source:return source
    require(source.count(OLD)==1,'LEGAL_TEMPLATE_CHANGED')
    result=source.replace(OLD,NEW,1)
    compile(result,'wakhan_legal2.py','exec')
    return result


def run(args):
    r=subprocess.run(args,capture_output=True,timeout=60)
    require(r.returncode==0,'COMMAND_FAILED:'+args[0]);return r.stdout.decode().strip()


def page(kind,lang):
    op=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with op.open('http://127.0.0.1:10010/'+kind+'?lang='+lang,timeout=5)as response:
        require(response.status==200,'LEGAL_PAGE_UNAVAILABLE')
        raw=response.read(500001);require(len(raw)<500001,'LEGAL_PAGE_TOO_LARGE');return raw.decode()


def pages():return {(k,l):page(k,l)for k in ('terms','privacy')for l in ('fa','en')}


def healthy():
    for _ in range(20):
        try:return pages()
        except Exception:time.sleep(1)
    raise RuntimeError('LEGAL_HEALTH_FAILED')


def atomic(path,raw,st):
    fd,tmp=tempfile.mkstemp(prefix='.legal-logo-',dir=path.parent)
    try:
        with os.fdopen(fd,'wb')as f:f.write(raw);f.flush();os.fsync(f.fileno())
        os.chown(tmp,st.st_uid,st.st_gid);os.chmod(tmp,stat.S_IMODE(st.st_mode));os.replace(tmp,path)
    finally:
        with contextlib.suppress(FileNotFoundError):os.unlink(tmp)


def bytecode(path):
    cache=path.parent/'__pycache__';require(not cache.is_symlink(),'BYTECODE_DIRECTORY_LINK')
    if cache.is_dir():
        for p in cache.glob('wakhan_legal2.*.pyc'):
            require(not p.is_symlink(),'BYTECODE_LINK');p.unlink()


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--apply',action='store_true');args=parser.parse_args()
    require(os.geteuid()==0,'RUN_AS_ROOT');os.umask(0o077)
    path=APP/'wakhan_legal2.py';owner=pwd.getpwnam('musicbot').pw_uid
    require(APP.is_dir()and not APP.is_symlink(),'APPLICATION_PATH_CHANGED')
    require(path.is_file()and not path.is_symlink()and path.stat().st_size<500000,'LEGAL_SOURCE_MISSING_OR_LINK')
    st=path.stat();require(st.st_uid in (0,owner)and not st.st_mode&0o022,'LEGAL_SOURCE_PERMISSIONS')
    require(run(['systemctl','is-active',SERVICE])=='active','WAKHAN_NOT_ACTIVE')
    raw=path.read_bytes();source=raw.decode();changed=transform(source);before=pages()
    if changed==source:
        require(all(NEW in v for v in before.values()),'LEGAL_MODULE_NOT_ACTIVE')
        print('لوگوی اصلی از قبل در هر دو صفحه فعال است.');return
    require(all(v.count(OLD)==1 for v in before.values()),'LEGAL_ROUTES_CHANGED')
    if not args.apply:print('بررسی موفق؛ برای اعمال: python3 fix-legal-logo.py --apply');return
    backup=Path(tempfile.mkdtemp(prefix='wakhan-legal-logo-backup-',dir='/root'))
    (backup/'wakhan_legal2.py').write_bytes(raw)
    (backup/'metadata.json').write_text(json.dumps(dict(sha256=hashlib.sha256(raw).hexdigest(),uid=st.st_uid,gid=st.st_gid,mode=stat.S_IMODE(st.st_mode))))
    stopped=False
    try:
        require(path.read_bytes()==raw,'LEGAL_SOURCE_CHANGED_DURING_PREFLIGHT')
        stopped=True;run(['systemctl','stop',SERVICE]);require(path.read_bytes()==raw,'LEGAL_SOURCE_CHANGED_DURING_STOP')
        atomic(path,changed.encode(),st);bytecode(path);run(['systemctl','start',SERVICE]);after=healthy()
        require(all(after[key]==text.replace(OLD,NEW,1)for key,text in before.items()),'LEGAL_CONTENT_CHANGED')
    except BaseException:
        if stopped:
            run(['systemctl','stop',SERVICE]);atomic(path,raw,st);bytecode(path);run(['systemctl','start',SERVICE]);healthy()
            print('فایل قبلی برگشت.')
        raise
    print('لوگوی اصلی در شرایط استفاده و حریم خصوصی فعال شد؛ متن‌ها حفظ شدند.')
    print('پشتیبان خصوصی: '+str(backup))


if __name__=='__main__':
    def interrupted(signum,frame):raise KeyboardInterrupt()
    signal.signal(signal.SIGTERM,interrupted)
    print('\033[1;30;43m ▼▼▼ خروجی از اینجا ▼▼▼ \033[0m',flush=True)
    try:main()
    except BaseException as exc:
        print('STOP: '+(str(exc)if type(exc)is RuntimeError else type(exc).__name__));raise SystemExit(1)
    finally:print('\033[1;30;43m ▲▲▲ تا اینجا ▲▲▲ \033[0m',flush=True)
