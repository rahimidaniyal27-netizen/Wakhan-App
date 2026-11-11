"""Collect the actual Xcode IPA and reviewed server helper into one delivery."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

root=Path(__file__).resolve().parent.parent
package=json.loads((root/'package.json').read_text());version=package['version']
ipa=root/('Wakhan-'+version+'.ipa');result=json.loads((root/'ios-build-result.json').read_text())
assert result['ok'] and result['version']==version and result['build']==package['wakhanBuild']
assert hashlib.sha256(ipa.read_bytes()).hexdigest()==result['sha256']
operator=root/'server-update/wakhan-update-028.py'
manifest=json.loads((root/'server-update/payload-manifest.json').read_text())
assert hashlib.sha256(operator.read_bytes()).hexdigest()==manifest['helper_sha256']
out=root/'delivery'
if out.exists():shutil.rmtree(out)
out.mkdir()
for file in (ipa,root/'ios-build-result.json',operator,root/'server-update/README-fa.md',root/'server-update/release-gates.json'):
    shutil.copyfile(file,out/file.name)
checksums={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in out.iterdir() if p.is_file() and p.name!='checksums.json'}
(out/'checksums.json').write_text(json.dumps(checksums,indent=2)+'\n')
target=root/('Wakhan-Consolidated-'+version+'.zip')
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
    for file in sorted(out.iterdir()):archive.write(file,file.name)
print(json.dumps({'bundle':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'ipa_verified':True,'server_executed':False}))
