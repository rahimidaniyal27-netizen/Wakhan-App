#!/usr/bin/env python3
"""Private owner-side Gmail SMTP setup for Wakhan. No new mobile build.

Defaults to read-only --status. --configure prompts on /dev/tty, verifies a
real emailed setup code, privately backs up runtime JSON, changes only the five
existing WKA_SMTP_*/WKA_MAIL_FROM settings and restarts only wakhan-app.
No account or session is created; no database, SSH, firewall or VPN is edited.
"""
import argparse,contextlib,getpass,hashlib,hmac,io,json,os,re,signal,smtplib,ssl,stat,subprocess,tempfile,time,warnings
from email.message import EmailMessage
from pathlib import Path
import pwd
import secrets
import urllib.request

APP=Path('/opt/wakhan-app-0.2.11-li9z037x')
SERVICE='wakhan-app'
KEYS=('WKA_SMTP_HOST','WKA_SMTP_PORT','WKA_SMTP_USER','WKA_SMTP_PASS','WKA_MAIL_FROM')


def require(ok,code):
    if not ok:raise RuntimeError(code)


def run(args):
    r=subprocess.run(args,capture_output=True,timeout=60)
    require(r.returncode==0,'COMMAND_FAILED:'+args[0]);return r.stdout.decode().strip()


def regular(path,maxsize=2_000_000):
    require(path.is_file()and not path.is_symlink()and path.stat().st_size<=maxsize,'CONFIG_MISSING_OR_LINK')


def load_context():
    require(run(['systemctl','is-active',SERVICE])=='active','WAKHAN_NOT_ACTIVE')
    require(run(['systemctl','show',SERVICE,'--property=User','--value'])=='musicbot','SERVICE_USER_CHANGED')
    owner=pwd.getpwnam('musicbot')
    pid=int(run(['systemctl','show',SERVICE,'--property=MainPID','--value']));require(pid>1,'SERVICE_PID_MISSING')
    cwd=Path(f'/proc/{pid}/cwd').resolve()
    args=[os.fsdecode(v)for v in Path(f'/proc/{pid}/cmdline').read_bytes().split(b'\0')if v]
    require('--config'in args and'python'in Path(args[0]).name,'SERVICE_COMMAND_UNREVIEWED')
    runtime=next((cwd/Path(v)for v in args[1:]if v.endswith('native_runtime.py')),None)
    require(runtime is not None and runtime.resolve()==(APP/'native_runtime.py').resolve(),'RUNTIME_PATH_CHANGED')
    path=cwd/args[args.index('--config')+1];regular(path)
    st=path.stat();require(st.st_uid in(0,owner.pw_uid)and not st.st_mode&0o022,'UNTRUSTED_CONFIG_OWNER_OR_MODE')
    parent=path.parent.stat();require(parent.st_uid in(0,owner.pw_uid)and not parent.st_mode&0o022,'UNTRUSTED_CONFIG_DIRECTORY')
    raw=path.read_bytes();settings=json.loads(raw)
    require(Path(settings['base']).resolve()==APP.resolve()and int(settings.get('port',10010))==10010,'CONFIG_BASE_OR_PORT_CHANGED')
    require(isinstance(settings.get('env',{}),dict),'CONFIG_ENV_INVALID')
    process_env={}
    for item in Path(f'/proc/{pid}/environ').read_bytes().split(b'\0'):
        if b'='in item:
            k,v=item.split(b'=',1);process_env[os.fsdecode(k)]=os.fsdecode(v)
    return dict(path=path,raw=raw,settings=settings,st=st,owner=owner,process_env=process_env)


def effective_status(context):
    env=context['settings'].get('env',{});active=context['process_env']
    return {key:bool(active.get(key)or env.get(key))for key in KEYS}


def configuration(settings,email,password):
    require(isinstance(email,str)and re.fullmatch(r'[A-Za-z0-9._%+\-]{1,64}@(gmail\.com|googlemail\.com)',email),'USE_GMAIL_SENDER_ADDRESS')
    password=password.replace(' ','')
    require(re.fullmatch(r'[A-Za-z]{16}',password)is not None,'USE_16_LETTER_GOOGLE_APP_PASSWORD')
    values=dict(WKA_SMTP_HOST='smtp.gmail.com',WKA_SMTP_PORT='587',WKA_SMTP_USER=email,WKA_SMTP_PASS=password,WKA_MAIL_FROM=email)
    result=json.loads(json.dumps(settings));result['env']={**result.get('env',{}),**values}
    return result,values


def check_overrides(context,values):
    for key,value in values.items():
        active=context['process_env'].get(key)
        require(not active or active==value,'SYSTEMD_ENV_OVERRIDE:'+key)


def test_delivery(email,password):
    code=f'{secrets.randbelow(10**6):06d}'
    message=EmailMessage();message['Subject']='Wakhan · آزمایش ارسال کد';message['From']='Wakhan <'+email+'>';message['To']=email
    message.set_content('کد آزمایشی تنظیم ایمیل واخان: '+code+'\n\nاین کد را فقط در ترمینال تنظیم ایمیل وارد کنید؛ این پیام حسابی در واخان ایجاد نمی‌کند.\nSetup test code: '+code)
    try:
        with smtplib.SMTP('smtp.gmail.com',587,timeout=20)as client:
            client.starttls(context=ssl.create_default_context());client.login(email,password)
            rejected=client.send_message(message)
            require(not rejected,'SMTP_RECIPIENT_REJECTED')
    except smtplib.SMTPAuthenticationError:
        raise RuntimeError('GMAIL_APP_PASSWORD_REJECTED')from None
    except(ssl.SSLError,smtplib.SMTPException,OSError):
        raise RuntimeError('GMAIL_SMTP_CONNECTION_OR_DELIVERY_FAILED')from None
    return code


def live_config():
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open('http://127.0.0.1:10010/api/app/config',timeout=3)as r:
        require(r.status==200,'APP_CONFIG_UNAVAILABLE');return json.load(r)


def healthy(email_enabled):
    for _ in range(20):
        try:
            value=live_config()
            if value.get('ok')and(bool(value.get('email'))==email_enabled):return value
        except Exception:pass
        time.sleep(1)
    raise RuntimeError('EMAIL_CONFIG_HEALTH_FAILED')


def atomic(path,raw,uid,gid,mode):
    fd,name=tempfile.mkstemp(prefix='.wakhan-mail-',dir=path.parent)
    try:
        with os.fdopen(fd,'wb')as output:output.write(raw);output.flush();os.fsync(output.fileno())
        os.chown(name,uid,gid);os.chmod(name,mode);os.replace(name,path)
        descriptor=os.open(path.parent,os.O_RDONLY|os.O_DIRECTORY)
        try:os.fsync(descriptor)
        finally:os.close(descriptor)
    finally:
        with contextlib.suppress(FileNotFoundError):os.unlink(name)


def apply(context,updated):
    path=context['path'];original=context['raw'];st=context['st'];owner=context['owner']
    require(path.read_bytes()==original,'CONFIG_CHANGED_DURING_SETUP')
    baseline=live_config()
    backup=Path(tempfile.mkdtemp(prefix='wakhan-email-backup-',dir='/root'))
    (backup/'runtime-config.json').write_bytes(original);os.chmod(backup/'runtime-config.json',0o600)
    (backup/'metadata.json').write_text(json.dumps(dict(uid=st.st_uid,gid=st.st_gid,mode=stat.S_IMODE(st.st_mode),sha256=hashlib.sha256(original).hexdigest())))
    # The service must read the new secret, while unrelated local users cannot.
    uid=st.st_uid;gid=owner.pw_gid if uid==0 else st.st_gid;mode=0o640 if uid==0 else 0o600
    started=False
    try:
        atomic(path,(json.dumps(updated,ensure_ascii=False,indent=2)+'\n').encode(),uid,gid,mode)
        started=True;run(['systemctl','restart',SERVICE]);value=healthy(True)
        require(value.get('google')==baseline.get('google')and value.get('signin')==baseline.get('signin'),'OTHER_SIGNIN_SETTINGS_CHANGED')
    except BaseException:
        atomic(path,original,st.st_uid,st.st_gid,stat.S_IMODE(st.st_mode))
        if started:run(['systemctl','restart',SERVICE]);healthy(bool(baseline.get('email')))
        print('تنظیم قبلی برگشت؛ دیتابیس و حساب‌ها تغییر نکردند.');raise
    return backup


def prompt(terminal,label,default=''):
    terminal.write(label+(' ['+default+']'if default else'')+': ');terminal.flush();value=terminal.readline()
    require(bool(value),'TERMINAL_CLOSED');return value.strip()or default


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--configure',action='store_true');args=parser.parse_args()
    require(os.geteuid()==0,'RUN_AS_ROOT');os.umask(0o077);context=load_context()
    status=effective_status(context)
    print('وضعیت تنظیمات: '+', '.join(key+('=تنظیم‌شده'if ready else'=خالی')for key,ready in status.items()))
    if not args.configure:print('فقط بررسی شد؛ برای تنظیم خصوصی: python3 setup-email.py --configure');return
    try:terminal=io.TextIOWrapper(io.FileIO('/dev/tty','r+'),encoding='utf-8',line_buffering=True)
    except OSError:raise RuntimeError('INTERACTIVE_TERMINAL_REQUIRED')from None
    with terminal:
        require(os.isatty(terminal.fileno()),'INTERACTIVE_TERMINAL_REQUIRED')
        email=prompt(terminal,'Gmail فرستندهٔ واخان','wakhaninfo@gmail.com').lower()
        with warnings.catch_warnings():
            warnings.simplefilter('error',getpass.GetPassWarning)
            password=getpass.getpass('App Password گوگل،16حرفی و مخفی: ',stream=terminal)
        updated,values=configuration(context['settings'],email,password)
        check_overrides(context,values)
        print('در حال ارسال یک کد آزمایشی به همان Gmail؛ هنوز تنظیمات سرور تغییر نکرده‌اند.',flush=True)
        code=test_delivery(email,values['WKA_SMTP_PASS']);sent=time.monotonic()
        for attempt in range(3):
            typed=prompt(terminal,'کد6رقمی پیام آزمایشی در Inbox یا Spam').translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩','01234567890123456789'))
            require(time.monotonic()-sent<600,'SETUP_CODE_EXPIRED')
            if hmac.compare_digest(typed,code):break
            print('کد مطابق نیست.')
        else:raise RuntimeError('SETUP_CODE_NOT_CONFIRMED')
        backup=apply(context,updated)
        print('ارسال ایمیل و دریافت کد تأیید شد؛ ورود ایمیلی واخان فعال است.')
        print('برنامه را کامل ببندید و دوباره باز کنید؛ گزینهٔ ایمیل فعال می‌شود.')
        print('پشتیبان خصوصی تنظیمات: '+str(backup))
        print('این پوشه شامل تنظیم خصوصی است؛ آن را ارسال نکنید.')


if __name__=='__main__':
    def interrupted(signum,frame):raise KeyboardInterrupt()
    signal.signal(signal.SIGTERM,interrupted)
    print('\033[1;30;43m ▼▼▼ خروجی از اینجا ▼▼▼ \033[0m',flush=True)
    try:main()
    except BaseException as exc:
        print('STOP: '+(str(exc)if type(exc)is RuntimeError else type(exc).__name__));raise SystemExit(1)
    finally:print('\033[1;30;43m ▲▲▲ تا اینجا ▲▲▲ \033[0m',flush=True)
