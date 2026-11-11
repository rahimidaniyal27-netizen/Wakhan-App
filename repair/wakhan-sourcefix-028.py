"""Read-only source trials; resume the authorized update only after actual A/V decoding."""
import ast
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import pwd
import signal
import subprocess
import tempfile
import time

STAGE=Path('/opt/wakhan-app-0.2.8-p5x6bo2h')
RESOLVER_SHA='9d9e1f2ffc446601c72a84d515152c580a11626efe66d56d4276ea080be442b8'
PLANS=(('current',None),('h264_aac','bestvideo[height<=720][vcodec^=avc1]+bestaudio[ext=m4a]/best[height<=720][vcodec^=avc1][acodec!=none]/best[height<=720][vcodec!=none]'),('muxed_first','best[height<=720][vcodec!=none][acodec!=none]/bestvideo[height<=720][vcodec^=avc1]+bestaudio[ext=m4a]'))

CHILD=r'''
import ast,contextlib,importlib.util,io,json,os,re,subprocess,sys,time
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
root=Path(sys.argv[1]);temporary=Path(sys.argv[2]);selector=sys.argv[3]
code=(root/'wakhan_resolver_v43.py').read_text()
ns={'__name__':'private_format_trial','__file__':str(root/'wakhan_resolver_v43.py')}
exec(compile(code,str(root/'wakhan_resolver_v43.py'),'exec'),ns)
if selector:ns['FORMAT']=selector
records=[];current={};real_run=subprocess.run
def classify(stderr):
    text=stderr.decode(errors='replace').lower() if isinstance(stderr,bytes) else str(stderr).lower()
    for label,pattern in (
        ('http_403',r'403\s+forbidden|server returned.{0,30}403|http.{0,20}403'),
        ('http_404',r'404\s+not found|server returned.{0,30}404|http.{0,20}404'),
        ('http_429',r'429\s+too many|server returned.{0,30}429|http.{0,20}429'),
        ('http_416',r'416\s+|server returned.{0,30}416'),
        ('tls_error',r'certificate|tls handshake|ssl error'),
        ('network_timeout',r'timed out|timeout'),
        ('network_error',r'connection refused|network is unreachable|connection reset|failed to resolve|name or service not known'),
        ('invalid_media',r'invalid data|moov atom not found|end of file'),
        ('protocol_error',r'protocol not found|not on whitelist|unsupported protocol'),
        ('command_error',r'unrecognized option|option not found|error parsing|invalid argument'),
        ('permission',r'permission denied|operation not permitted')):
        if re.search(pattern,text):return label
    return 'probe_failed'
def run(args,*a,**kw):
    if not args or Path(str(args[0])).name!='ffprobe':return real_run(args,*a,**kw)
    value=dict(current)
    query=parse_qs(urlsplit(str(args[-1])).query);path=urlsplit(str(args[-1])).path
    value['po_token_present']=bool(query.get('pot')) or '/pot/' in path
    value['signature_present']=any(query.get(k) for k in ('sig','signature','lsig'))
    value['header_block_present']='-headers' in args
    try:
        result=real_run(args,*a,**kw);value['exit_code']=result.returncode
        if result.returncode:value['reason']=classify(result.stderr)
        else:
            try:data=json.loads(result.stdout);value['video']=any(s.get('codec_type')=='video' for s in data.get('streams',[]));value['audio']=any(s.get('codec_type')=='audio' for s in data.get('streams',[]))
            except ValueError:value['reason']='invalid_probe_json'
        return result
    except subprocess.TimeoutExpired:value['reason']='network_timeout';raise
    finally:
        if len(records)<8:records.append(value)
subprocess.run=run
usable=ns['Readable'].usable
def check(self,fmt,headers):
    current.clear();current['needs_video']=fmt.get('vcodec') not in (None,'none');current['needs_audio']=fmt.get('acodec') not in (None,'none')
    identity=str(fmt.get('format_id') or '')
    if re.fullmatch(r'\d{1,4}',identity):current['format_id']=identity
    for field in ('vcodec','acodec'):
        value=str(fmt.get(field) or '')
        current[field]=next((name for name in ('avc1','h264','aac','mp4a','vp9','vp09','av01','av1','opus','vorbis','none') if value.startswith(name)),'other')
    return usable(self,fmt,headers)
ns['Readable'].usable=check
job={'root':str(root),'url':'https://www.youtube.com/watch?v=oSbzN0OZYMM','temporary':str(temporary)}
capture=io.StringIO();sys.stdin=io.StringIO(json.dumps(job))
with contextlib.redirect_stdout(capture):ns['worker']()
value=json.loads(capture.getvalue());report={'resolved':value.get('ok') is True,'probes':records}
for name in ('checks','waited_seconds','elapsed_seconds'):
    if type(value.get(name)) in (int,float):report[name]=value[name]
if value.get('reason') in ('timeout','blocked','failed','size','no_readable_video','source_differs'):report['reason']=value['reason']
def decode(source,headers,video):
    args=['ffmpeg','-v','error','-nostdin','-threads','1','-rw_timeout','7000000']
    if headers:args+=['-headers',''.join(k+': '+v+'\r\n' for k,v in headers.items())]
    args+=['-i',source,'-map','0:v:0' if video else '0:a:0','-t','1','-an' if video else '-vn','-progress','pipe:1','-nostats','-f','null','-']
    try:
        result=real_run(args,capture_output=True,timeout=22)
        output=result.stdout.decode(errors='replace')
        progress=[int(v) for v in re.findall(r'^out_time_us=(\d+)$',output,re.M)]
        return result.returncode==0 and any(v>0 for v in progress)
    except (OSError,subprocess.TimeoutExpired):return False
if report['resolved']:
    track=value['track'];report['video_decoded']=decode(track['path'],track.get('_v_headers'),True);report['audio_decoded']=decode(track.get('_v_audio_path') or track['path'],track.get('_v_headers'),False)
report['ok']=bool(report.get('video_decoded') and report.get('audio_decoded'))
print(json.dumps(report),flush=True)
'''


def load_resume():
    root=Path(__file__).parent
    # Integrity of the already supplied resume package is checked before importing it.
    manifest=json.loads((root/'checksums.json').read_text())
    for name in ('wakhan-resume-028.py','upgrade_resolver028.py','release_probe028.py','probe_diagnostics028.py'):
        if hashlib.sha256((root/name).read_bytes()).hexdigest()!=manifest[name]:raise RuntimeError('RESUME_PACKAGE_CHECKSUM_FAILED')
    spec=importlib.util.spec_from_file_location('source_checked_resume028',root/'wakhan-resume-028.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module


def verify_stage():
    if STAGE.is_symlink() or (STAGE/'data').is_symlink():raise RuntimeError('ISOLATED_SOURCE_STAGE_REQUIRED')
    settings=json.loads((STAGE/'private/app.json').read_text())
    if settings.get('base')!=str(STAGE) or settings.get('data')!=str(STAGE/'data') or settings.get('database')!=str(STAGE/'data/music.db') or settings.get('owner')!=8878966292:raise RuntimeError('ISOLATED_SOURCE_CONFIGURATION_DIFFERS')
    if hashlib.sha256((STAGE/'wakhan_resolver_v43.py').read_bytes()).hexdigest()!=RESOLVER_SHA:raise RuntimeError('KNOWN_SOURCE_RESOLVER_DIFFERS')


def trial(python,selector,timeout):
    account=pwd.getpwnam('musicbot')
    with tempfile.TemporaryDirectory(prefix='wakhan-source028-') as folder:
        temporary=Path(folder);temporary.chmod(0o700);os.chown(temporary,account.pw_uid,account.pw_gid)
        process=subprocess.Popen(['runuser','-u','musicbot','--',str(python),'-c',CHILD,str(STAGE),str(temporary),selector or ''],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,cwd=STAGE,start_new_session=True)
        try:
            stdout,stderr=process.communicate(timeout=timeout)
            if process.returncode:
                from probe_diagnostics028 import sanitized
                return dict(sanitized(type('Result',(),{'stdout':stdout,'stderr':stderr,'returncode':process.returncode})()),ok=False)
            return json.loads(stdout)
        except subprocess.TimeoutExpired:
            if process.poll() is None:os.killpg(process.pid,signal.SIGKILL)
            process.communicate();return {'ok':False,'reason':'trial_timeout'}


def change_format(operator,root,selector):
    if selector is None:return hashlib.sha256((root/'wakhan_resolver_v43.py').read_bytes()).hexdigest()
    path=root/'wakhan_resolver_v43.py';tree=ast.parse(path.read_text())
    values=[n for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='FORMAT' for t in n.targets)]
    if len(values)!=1:raise RuntimeError('SOURCE_FORMAT_ASSIGNMENT_DIFFERS')
    values[0].value=ast.Constant(selector);ast.fix_missing_locations(tree)
    body=(ast.unparse(tree)+'\n').encode();compile(body,str(path),'exec')
    previous=path.stat();operator.atomic(path,body,previous.st_mode&0o777);os.chown(path,previous.st_uid,previous.st_gid)
    return hashlib.sha256(body).hexdigest()


def main():
    if os.geteuid()!=0:raise SystemExit('RUN_AS_ROOT')
    os.umask(0o077);resume=load_resume();operator=resume.read_operator()
    if (operator.STATE/'completed.json').exists() or (operator.STATE/'installed.json').exists():resume.main();return
    report={'ok':False,'services_changed':False,'live_database_changed':False,'backend_live':False,'media_format_trials':[]}
    saved=operator.STATE/'android.json'
    if saved.exists():report['android']=json.loads(saved.read_text())
    try:
        verify_stage();python=operator.OLD_STAGE/'.venv/bin/python';deadline=time.monotonic()+240
        selected=None;found=False
        for name,selector in PLANS:
            remaining=deadline-time.monotonic()
            if remaining<45:break
            print('CHECKING_MEDIA_FORMAT:',name,flush=True)
            result=trial(python,selector,min(155,remaining));report['media_format_trials'].append(dict(result,plan=name))
            if result.get('ok'):selected=(name,selector);found=True;break
        if not found:
            report['error']='SOURCE_FORMATS_NOT_READABLE';print('UPDATE_NEEDS_REVIEW:',report['error'],flush=True);operator.save_report(report);return
        print('ACTUAL_VIDEO_AND_AUDIO_DECODED:',selected[0],flush=True)
        base_install=resume.install_media_fix;base_read=resume.read_operator
        def install(op,root):base_install(op,root);return change_format(op,root,selected[1])
        def read():
            op=base_read();save=op.save_report
            def publish(result):result.update(media_format_trials=report['media_format_trials'],selected_media_format=selected[0]);save(result)
            op.save_report=publish;return op
        resume.install_media_fix=install;resume.read_operator=read
        resume.main()
    except BaseException as error:
        text=str(error);report['error']=text if text and all(c.isupper() or c.isdigit() or c=='_' for c in text) else type(error).__name__
        operator.save_report(report)


if __name__=='__main__':main()
