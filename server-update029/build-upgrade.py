"""Create the native-028 upgrade without regenerating or overwriting old releases."""
import ast,base64,hashlib,io,json,zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parent
PROJECT=ROOT.parent
RELEASE=PROJECT/'delivery029'
ORIGINAL=PROJECT/'server-update/wakhan-update-028.py'
OWNED=('native_runtime.py','native_social.py','native_admin.py','native_room_core.py','native_room_video.py','room_tools.py','upgrade_chat.py','release_probe.py','diagnose028.py')


def constants(source):
    return {node.targets[0].id:ast.literal_eval(node.value) for node in ast.parse(source).body if isinstance(node,ast.Assign) and len(node.targets)==1 and isinstance(node.targets[0],ast.Name) and node.targets[0].id in ('PAYLOAD','PAYLOAD_SHA256')}


def common():
    source=ORIGINAL.read_text();tree=ast.parse(source)
    names={'require','sha','atomic','command','active','database_copy','ledger_fingerprint','load','owner_key','live_get','unit_text'}
    selected=[node for node in tree.body if isinstance(node,(ast.Import,ast.ImportFrom)) or isinstance(node,ast.FunctionDef) and node.name in names or isinstance(node,ast.Assign) and any(isinstance(target,ast.Name) and target.id=='OWNER' for target in node.targets)]
    assert {node.name for node in selected if isinstance(node,ast.FunctionDef)}==names
    return (ast.unparse(ast.Module(body=selected,type_ignores=[])).replace('.028-tmp','.029-tmp')+'\n').encode()


def package():
    assert hashlib.sha256(ORIGINAL.read_bytes()).hexdigest()=='56fb34c1c40f77745d85eff0c6d97ff741b77be4890771c6240c8a4c0e47b741'
    old=constants(ORIGINAL.read_text());payload=base64.b64decode(old['PAYLOAD']);assert hashlib.sha256(payload).hexdigest()==old['PAYLOAD_SHA256']
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        android=archive.read('build_android.py');runtime=archive.read('native_runtime.py')
    files={name:(ROOT/'src'/name).read_bytes() for name in OWNED};files['operator_common.py']=common();files['build_android028.py']=android
    names={str(file.relative_to(PROJECT)) for file in (PROJECT/'scripts/ui-hotfix').rglob('*') if file.is_file()}
    names.update({'src/main.mjs','src/native-bridge.mjs','src/ui-insets.css','src/product-polish.css','src/presence.mjs','src/launch-intro.mjs','scripts/apply-ui-hotfix.cjs','public/royal-seat.webp','public/wakhan-release.json','package.json'})
    for name in names:
        if name.startswith(('src/','scripts/ui-hotfix/')) or name in ('scripts/apply-ui-hotfix.cjs','public/royal-seat.webp','public/wakhan-release.json','package.json'):
            files['client-overlay/'+name]=(PROJECT/name).read_bytes()
    buffer=io.BytesIO()
    with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for name,body in sorted(files.items()):
            entry=zipfile.ZipInfo(name,date_time=(2026,11,11,0,0,0));entry.compress_type=zipfile.ZIP_DEFLATED;archive.writestr(entry,body)
    raw=buffer.getvalue()
    code='#!/usr/bin/env python3\nPAYLOAD='+repr(base64.b64encode(raw).decode())+'\nPAYLOAD_SHA256='+repr(hashlib.sha256(raw).hexdigest())+'\nANDROID_BUILDER_SHA256='+repr(hashlib.sha256(android).hexdigest())+'\nRUNTIME_028_SHA256='+repr(hashlib.sha256(runtime).hexdigest())+'\nOWNED='+repr(OWNED)+'\n'+(ROOT/'src/update029_template.py').read_text()
    compile(code,'wakhan-update-029.py','exec');RELEASE.mkdir(exist_ok=True)
    file=RELEASE/'wakhan-update-029.py';file.write_text(code)
    manifest={'helper_sha256':hashlib.sha256(code.encode()).hexdigest(),'payload_sha256':hashlib.sha256(raw).hexdigest(),'embedded_files':{name:hashlib.sha256(body).hexdigest() for name,body in files.items()}}
    (RELEASE/'payload-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({'helper':str(file),'bytes':file.stat().st_size,'sha256':manifest['helper_sha256'],'embedded_files':len(files)}))
    return code,files


if __name__=='__main__':
    package()
    import shutil
    for name in ('README-fa.md','release-gates.json'):shutil.copyfile(ROOT/name,RELEASE/name)
    ipa=PROJECT/'Wakhan-0.2.9-beta.ipa';result=PROJECT/'ios-build-result.json'
    if ipa.exists() and result.exists():
        report=json.loads(result.read_text());assert report['ok'] and report['build']==23 and report['version']=='0.2.9-beta';assert hashlib.sha256(ipa.read_bytes()).hexdigest()==report['sha256']
        for file in (ipa,result):shutil.copyfile(file,RELEASE/file.name)
    checks={file.name:hashlib.sha256(file.read_bytes()).hexdigest() for file in RELEASE.iterdir() if file.is_file() and file.name!='checksums.json'}
    (RELEASE/'checksums.json').write_text(json.dumps(checks,indent=2)+'\n')
    target=PROJECT/'Wakhan-Consolidated-0.2.9-beta.zip'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for file in sorted(RELEASE.iterdir()):archive.write(file,file.name)
    print(json.dumps({'bundle':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'server_executed':False}))
