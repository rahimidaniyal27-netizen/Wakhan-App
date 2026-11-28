"""Private, loopback-only WebPoClient service. See THIRD_PARTY_LICENSES."""
import argparse
import asyncio
import concurrent.futures
import hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import logging
import os
from pathlib import Path
import signal
import secrets
import struct
import subprocess
import sys
import threading
import tempfile
import time

# Dependencies are private to this helper process, never the music process.
sys.path.insert(0,str(Path(__file__).resolve().parent/'libs'))
import nodriver

WEBPO = "window.top['havuokmhhs-0']?.bevasrs?.wpc"


class BrowserManager:
    def __init__(self, chrome, state):
        self.chrome=chrome
        self.state=state
        self.browser=None
        self.lock=asyncio.Lock()
        self.cache={}
        self.last_error=None
        self.ready=False
        self.profile=None

    async def start(self):
        self.ready=False
        if self.profile is not None:self.profile.cleanup()
        self.profile=tempfile.TemporaryDirectory(prefix='wakhan-token-browser-')
        config=nodriver.Config(browser_executable_path=self.chrome,
            user_data_dir=self.profile.name,headless=False,sandbox=True,
            browser_args=['--no-first-run','--disable-dev-shm-usage','--lang=en-US'])
        # DevTools is loopback-only; don't permit arbitrary Origin headers.
        config._default_browser_args=[x for x in config._default_browser_args if not x.startswith('--remote-allow-origins=')]
        try:self.browser=await nodriver.start(config=config)
        except BaseException:
            for browser in list(nodriver.core.util.get_registered_instances()):
                try:browser.stop()
                except Exception:pass
            self.profile.cleanup();self.profile=None
            raise
        await self.browser.cookies.clear()
        await self.browser.get('https://www.youtube.com?themeRefresh=1&hl=en')
        self.ready=True
        self.last_error=None

    async def close(self):
        self.ready=False
        if self.browser:
            browser=self.browser;self.browser=None
            try:browser.stop()
            except Exception:pass
            process=getattr(browser,'_process',None)
            if process and process.returncode is None:
                try:await asyncio.wait_for(process.wait(),2)
                except asyncio.TimeoutError:
                    try:process.kill()
                    except ProcessLookupError:pass
                    try:await asyncio.wait_for(process.wait(),2)
                    except asyncio.TimeoutError:pass
        self.cache.clear()
        if self.profile is not None:self.profile.cleanup();self.profile=None


    async def mint(self,binding,context):
        async with self.lock:
            key=(binding,context)
            cached=self.cache.get(key)
            if cached and cached[0]>time.monotonic():return cached[1]
            if not self.browser or self.browser.stopped:
                await self.start()
            tab=self.browser.main_tab
            for _ in range(12):
                if await tab.evaluate('!!'+WEBPO):break
                # Decline optional cookies if Google's consent page is shown;
                # this does not attempt to answer account/human challenges.
                await tab.evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>/^(Reject all|Alle ablehnen)$/i.test(x.innerText.trim()));if(b)b.click();return !!b})()")
                await asyncio.sleep(1)
            else:raise RuntimeError('webpo_unavailable')
            # Mirrors the MIT-licensed WPC provider's content-binding API.
            params=json.dumps({'c':binding,'mc':False,'me':False})
            code=f"{WEBPO}().then(client=>client.mws({params})).catch(e=>{{if(String(e).includes('SDF:notready'))return 'backoff';throw e;}})"
            for _ in range(12):
                token=await tab.evaluate(code,await_promise=True)
                if token!='backoff':break
                await asyncio.sleep(1)
            else:raise RuntimeError('webpo_not_ready')
            if not isinstance(token,str) or not 8<len(token)<16384:
                raise RuntimeError('webpo_invalid_response')
            self.cache[key]=(time.monotonic()+300,token)
            self.last_error=None
            if len(self.cache)>256:
                self.cache={k:v for k,v in self.cache.items() if v[0]>time.monotonic()}
            return token


def serve(chrome,state,key,port=4417,display_process=None,monitor_interval=1,startup_grace=12):
    loop=asyncio.new_event_loop()
    manager=BrowserManager(chrome,state)
    thread=threading.Thread(target=loop.run_forever,daemon=True);thread.start()
    async def warm():
        try:
            async with manager.lock:await asyncio.wait_for(manager.start(),25)
        except Exception:manager.last_error='browser_start_failed'
    asyncio.run_coroutine_threadsafe(warm(),loop)
    def display_alive():return display_process is None or display_process.poll() is None
    def browser_alive():
        try:return bool(manager.browser and not manager.browser.stopped)
        except Exception:return False
    def healthy():return display_alive() and manager.ready and browser_alive() and manager.last_error is None
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass
        def reply(self,status,data):
            body=json.dumps(data).encode()
            self.send_response(status);self.send_header('Content-Type','application/json')
            self.send_header('Content-Length',str(len(body)));self.end_headers()
            try:self.wfile.write(body)
            except (BrokenPipeError,ConnectionResetError):pass
        def authorized(self):
            return not self.headers.get('Origin') and self.headers.get('Sec-Fetch-Site','').lower()!='cross-site' and hmac.compare_digest(self.headers.get('Authorization',''),'Bearer '+key)
        def do_GET(self):
            if not self.authorized():return self.reply(403,{'error':'forbidden'})
            if self.path=='/health':return self.reply(200 if healthy() else 503,{'version':'wakhan-browser-1','recovery_version':1,'ready':healthy(),'browser_started':browser_alive(),'display_started':display_alive(),'last_error':manager.last_error})
            self.reply(404,{'error':'not_found'})
        def do_POST(self):
            if not self.authorized():return self.reply(403,{'error':'forbidden'})
            if self.path!='/token':return self.reply(404,{'error':'not_found'})
            if not display_alive():return self.reply(503,{'error':'display_unavailable'})
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=4096:raise ValueError()
                data=json.loads(self.rfile.read(length))
                binding=data['binding'];context=data['context']
                if not isinstance(binding,str) or not 1<=len(binding)<=1024 or any(ord(x)<32 for x in binding) or context not in ('gvs','player','subs'):raise ValueError()
            except (ValueError,KeyError,TypeError):return self.reply(400,{'error':'invalid_request'})
            future=asyncio.run_coroutine_threadsafe(manager.mint(binding,context),loop)
            try:token=future.result(timeout=55)
            except concurrent.futures.TimeoutError:
                future.cancel();manager.last_error='browser_timeout';return self.reply(503,{'error':'browser_timeout'})
            except Exception as error:
                # Browser/CDP exceptions may contain page data; never echo them.
                manager.last_error=str(error) if type(error) is RuntimeError and str(error) in ('webpo_unavailable','webpo_not_ready','webpo_invalid_response') else 'browser_start_failed' if not manager.browser else 'browser_mint_failed'
                return self.reply(503,{'error':'browser_token_unavailable'})
            self.reply(200,{'token':token})
    server=ThreadingHTTPServer(('127.0.0.1',port),Handler);server.daemon_threads=True
    stopping=threading.Event();restart=threading.Event();started=time.monotonic()
    def supervise():
        while not stopping.wait(monitor_interval):
            if not display_alive():
                manager.last_error='display_stopped';manager.ready=False
            elif manager.ready and not browser_alive():
                manager.last_error='browser_stopped';manager.ready=False
            elif not (manager.last_error in ('browser_start_failed','browser_timeout','browser_mint_failed','webpo_unavailable','webpo_not_ready','webpo_invalid_response') and time.monotonic()-started>=startup_grace):
                continue
            restart.set();server.shutdown();return
    watcher=threading.Thread(target=supervise,daemon=True);watcher.start()
    try:server.serve_forever(poll_interval=0.2)
    finally:
        stopping.set();server.server_close()
        async def shutdown():
            current=asyncio.current_task()
            pending=[task for task in asyncio.all_tasks() if task is not current]
            for task in pending:task.cancel()
            if pending:await asyncio.gather(*pending,return_exceptions=True)
            await manager.close()
        try:asyncio.run_coroutine_threadsafe(shutdown(),loop).result(timeout=5)
        except Exception:pass
        loop.call_soon_threadsafe(loop.stop);thread.join(timeout=2);watcher.join(timeout=1)
        loop.close()
    if restart.is_set():raise RuntimeError('SUPERVISED_CHILD_STOPPED')


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--chrome',required=True);parser.add_argument('--state',type=Path,required=True);parser.add_argument('--key',type=Path,required=True);args=parser.parse_args()
    logging.disable(logging.CRITICAL)
    if os.geteuid()==0:raise SystemExit('HELPER_MUST_BE_UNPRIVILEGED')
    args.state.mkdir(mode=0o700,parents=True,exist_ok=True)
    display_context=tempfile_display(args.state)
    with display_context as display:
        os.environ['DISPLAY']=display
        serve(args.chrome,args.state,args.key.read_text().strip(),display_process=display_context.child)


class tempfile_display:
    def __init__(self,state):self.state=state;self.child=None
    def authorization(self,number,cookie):
        fields=(b'',str(number).encode(),b'MIT-MAGIC-COOKIE-1',cookie)
        data=struct.pack('>H',65535)+b''.join(struct.pack('>H',len(value))+value for value in fields)
        path=self.state/'Xauthority'
        fd,name=tempfile.mkstemp(prefix='.Xauthority-',dir=self.state)
        try:
            with os.fdopen(fd,'wb') as stream:stream.write(data);stream.flush();os.fsync(stream.fileno())
            os.chmod(name,0o600);os.replace(name,path)
        finally:Path(name).unlink(missing_ok=True)
        return path
    def __enter__(self):
        cookie=secrets.token_bytes(16)
        auth=self.authorization(0,cookie)
        read_fd,write_fd=os.pipe()
        try:
            self.child=subprocess.Popen(['/usr/bin/Xvfb','-noreset','-displayfd',str(write_fd),'-screen','0','1280x720x24','-nolisten','tcp','-auth',str(auth)],
                pass_fds=(write_fd,),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        finally:os.close(write_fd)
        import select
        try:
            ready,_,_=select.select([read_fd],[],[],10)
            value=os.read(read_fd,32).decode().strip() if ready else ''
            if not value.isdecimal():raise RuntimeError('display_start_failed')
            self.authorization(value,cookie)
            os.environ['XAUTHORITY']=str(auth)
            return ':'+value
        except BaseException:
            self.__exit__(None,None,None);raise
        finally:os.close(read_fd)
    def __exit__(self,*args):
        if self.child and self.child.poll() is None:
            self.child.terminate()
            try:self.child.wait(timeout=5)
            except subprocess.TimeoutExpired:self.child.kill();self.child.wait()


if __name__=='__main__':
    signal.signal(signal.SIGTERM,lambda *_:sys.exit(0))
    try:main()
    except Exception:raise SystemExit('BROWSER_HELPER_FAILED')
