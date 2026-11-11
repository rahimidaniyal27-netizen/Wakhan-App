"""Diagnose only the failed disposable stage; never print raw logs or credentials."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import zipfile

PYTHON=Path('/opt/wakhan-app-stage-20261110-100826-8x_4se3m/.venv/bin/python')


def sanitized(result):
    error=result.stderr or '';output={'exit_code':result.returncode}
    patterns={
        'exception':r'(?m)^([A-Za-z_][A-Za-z0-9_.]*(?:Error|Exception)):',
        'missing_module':r"ModuleNotFoundError: No module named ['\"]([A-Za-z_][A-Za-z0-9_.]*)['\"]",
        'missing_table':r'no such table: ([A-Za-z_][A-Za-z0-9_.]*)',
        'missing_column':r'no such column: ([A-Za-z_][A-Za-z0-9_.]*)',
        'api_failure':r'RELEASE_API_PROBE_FAILED_([0-9]{3}_[A-Za-z0-9_]+)',
        'runtime_code':r'RuntimeError: ([A-Z][A-Z0-9_]{2,100})(?:\n|$)',
    }
    for name,pattern in patterns.items():
        values=re.findall(pattern,error)
        if values:output[name]=values[-1]
    frames=re.findall(r'File "[^"\n]*/([A-Za-z0-9_.-]+\.py)", line (\d+)',error)
    output['frames']=[{'file':name,'line':int(line)} for name,line in frames[-10:]]
    for line in (result.stdout or '').splitlines():
        try:value=json.loads(line)
        except ValueError:continue
        if not isinstance(value,dict):continue
        flags={k:v for k,v in value.items() if k in ('ok','standalone','existing_session','replies','room_tools','preferences','report_review','tls_443_advertised','forbidden_sdk_loaded','legacy_accounts_absent') and type(v) is bool}
        if flags:output['probe']=flags
    return output


def failed_stage(root):
    candidates=[]
    for stage in root.glob('wakhan-app-0.2.8-*'):
        config=stage/'private/app.json';probe=stage/'release_probe.py'
        if stage.is_symlink() or not config.is_file() or not probe.is_file():continue
        if (stage/'data').is_symlink():continue
        settings=json.loads(config.read_text())
        if settings.get('base')!=str(stage) or settings.get('data')!=str(stage/'data') or settings.get('database')!=str(stage/'data/music.db'):continue
        if settings.get('owner')!=8878966292:continue
        candidates.append(stage)
    if not candidates:raise RuntimeError('FAILED_ISOLATED_STAGE_NOT_FOUND')
    return max(candidates,key=lambda p:p.stat().st_mtime)


def diagnose(stage,python):
    # Add a fixed endpoint/status marker in memory. Do not alter staged source files.
    original=(stage/'release_probe.py').read_text()
    if hashlib.sha256(original.encode()).hexdigest()!='a40fe091d4282392e10a86b09035b97dbbef5a43e01004f3fbfd4c7a58a0af4b':raise RuntimeError('STAGE_PROBE_CHECKSUM_DIFFERS')
    anchor="raise RuntimeError('RELEASE_API_PROBE_FAILED')"
    if original.count(anchor)!=1:raise RuntimeError('STAGE_PROBE_REVISION_DIFFERS')
    code=original.replace(anchor,"raise RuntimeError('RELEASE_API_PROBE_FAILED_'+str(response.status)+'_'+path.replace('/','_'))")
    invoke="exec(compile("+repr(code)+","+repr(str(stage/'release_probe.py'))+",'exec'),{'__name__':'__main__'})"
    report={'services_changed':False,'live_database_changed':False,'stage':str(stage),'checks':{}}
    for name,extra in (('backend',['--no-media']),('media',[])):
        try:result=subprocess.run(['runuser','-u','musicbot','--',str(python),'-c',invoke,str(stage/'private/app.json'),*extra],capture_output=True,text=True,cwd=stage,timeout=145)
        except subprocess.TimeoutExpired:report['checks'][name]={'timeout':True};break
        report['checks'][name]=sanitized(result)
        # Preserve raw logs on the server only; these files are NOT exported.
        path=stage/'private'/('diagnostic-'+name+'.private.log')
        fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_TRUNC|os.O_NOFOLLOW,0o600)
        with os.fdopen(fd,'w') as stream:stream.write(result.stdout+'\n'+result.stderr)
        if result.returncode:break
    return report


def main():
    if os.geteuid()!=0:raise SystemExit('RUN_AS_ROOT')
    os.umask(0o077)
    report=diagnose(failed_stage(Path('/opt')),PYTHON)
    target=Path('/root/wakhan-028-diagnostic.zip')
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:z.writestr('diagnostic.json',json.dumps(report,indent=2))
    target.chmod(0o600)
    print(json.dumps(report,indent=2));print('REPORT_READY:',target)


if __name__=='__main__':main()
