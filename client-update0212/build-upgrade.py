"""Build 26 updates the mobile client while retaining the verified 0211 server."""
import ast,base64,hashlib,io,json,zipfile
from pathlib import Path


ROOT=Path(__file__).resolve().parent
PROJECT=ROOT.parent
RELEASE=PROJECT/'delivery0212'
ORIGINAL=PROJECT/'server-update/wakhan-update-028.py'



def constants(source):
    return {node.targets[0].id:ast.literal_eval(node.value) for node in ast.parse(source).body if isinstance(node,ast.Assign) and len(node.targets)==1 and isinstance(node.targets[0],ast.Name) and node.targets[0].id in ('PAYLOAD','PAYLOAD_SHA256')}


def payload(file,expected):
    assert hashlib.sha256(file.read_bytes()).hexdigest()==expected
    value=constants(file.read_text());raw=base64.b64decode(value['PAYLOAD']);assert hashlib.sha256(raw).hexdigest()==value['PAYLOAD_SHA256'];return zipfile.ZipFile(io.BytesIO(raw))


def package():
    with payload(ORIGINAL,'56fb34c1c40f77745d85eff0c6d97ff741b77be4890771c6240c8a4c0e47b741') as archive:android=archive.read('build_android.py')
    runtime_sha='8b29c0ba460603784a34af67accab757c10b9d0430811945d7ec977d5f6413c3'
    files={'operator_common.py':(ROOT/'operator-common.py').read_bytes(),'build_android028.py':android}
    names={str(file.relative_to(PROJECT)) for folder in ('src','scripts/ui-hotfix') for file in (PROJECT/folder).rglob('*') if file.is_file()}
    names.update({'scripts/apply-ui-hotfix.cjs','public/royal-seat.webp','public/wakhan-release.json','package.json','capacitor.config.json','android/app/src/main/AndroidManifest.xml','android/app/src/main/java/app/wakhan/music/WakhanLocalePlugin.java'})
    for name in names:files['client-overlay/'+name]=(PROJECT/name).read_bytes()
    buffer=io.BytesIO()
    with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for name,body in sorted(files.items()):
            entry=zipfile.ZipInfo(name,date_time=(2026,11,11,0,0,0));entry.compress_type=zipfile.ZIP_DEFLATED;archive.writestr(entry,body)
    raw=buffer.getvalue();code='#!/usr/bin/env python3\nPAYLOAD='+repr(base64.b64encode(raw).decode())+'\nPAYLOAD_SHA256='+repr(hashlib.sha256(raw).hexdigest())+'\nANDROID_BUILDER_SHA256='+repr(hashlib.sha256(android).hexdigest())+'\nRUNTIME_SHA256='+repr(runtime_sha)+'\n'+(ROOT/'template.py').read_text()
    compile(code,'wakhan-client-0212.py','exec');RELEASE.mkdir(exist_ok=True);file=RELEASE/'wakhan-client-0212.py';file.write_text(code)
    manifest={'helper_sha256':hashlib.sha256(code.encode()).hexdigest(),'payload_sha256':hashlib.sha256(raw).hexdigest(),'embedded_files':{name:hashlib.sha256(body).hexdigest() for name,body in files.items()}}
    (RELEASE/'payload-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'helper':str(file),'bytes':file.stat().st_size,'sha256':manifest['helper_sha256'],'files':len(files)}));return code,files


if __name__=='__main__':
    package()
    import shutil
    for name in ('README-fa.md','release-gates.json'):shutil.copyfile(ROOT/name,RELEASE/name)
    ipa=PROJECT/'Wakhan-0.2.12-beta.ipa';result=PROJECT/'ios-build-result.json'
    if ipa.exists() and result.exists():
        report=json.loads(result.read_text());assert report['ok'] and report['build']==26 and report['version']=='0.2.12-beta';assert hashlib.sha256(ipa.read_bytes()).hexdigest()==report['sha256']
        for file in (ipa,result):shutil.copyfile(file,RELEASE/file.name)
    checks={file.name:hashlib.sha256(file.read_bytes()).hexdigest() for file in RELEASE.iterdir() if file.is_file() and file.name!='checksums.json'}
    (RELEASE/'checksums.json').write_text(json.dumps(checks,indent=2)+'\n')
    target=PROJECT/'Wakhan-Consolidated-0.2.12-beta.zip'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for file in sorted(RELEASE.iterdir()):archive.write(file,file.name)
    print(json.dumps({'bundle':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'server_executed':False}))
