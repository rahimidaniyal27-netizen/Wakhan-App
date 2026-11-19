import hashlib,json,shutil,subprocess,sys,zipfile
from pathlib import Path
root=Path('release245');root.mkdir()
source=Path('cinema0245/Wakhan-0.2.45-source.zip');assert hashlib.sha256(source.read_bytes()).hexdigest()=='0a4e400e09ad5a88fb297574a549970bfacbe66c1da596a8f3bf93df6e265030'
input_path=Path('delivery0245/delivery-input.zip')
assert hashlib.sha256(input_path.read_bytes()).hexdigest()=='477374f8d94c9e1706023c39d062e784a70ce7147a5f8e515ab4b0ee1e05a918'
with zipfile.ZipFile(input_path)as z:
 assert z.testzip()is None;z.extractall(root)
for folder,name in [('ios245','Wakhan-0.2.45-beta.ipa'),('android245','app-release-unsigned.apk'),('android245','app-release.aab')]:
 paths=list(Path(folder).rglob(name));assert len(paths)==1;shutil.copy2(paths[0],root/name)
shutil.copy2(source,root/source.name)
subprocess.run([sys.executable,str(root/'verify-native.py'),str(root)],check=True)
for name in ['sign-and-publish.py','backend_update.py','transform_backend.py']:compile((root/name).read_text(),name,'exec')
boot_files=list(Path('browser245').rglob('new-bootstrap-results.json'));assert len(boot_files)==1
boot=json.loads(boot_files[0].read_text());assert {x['engine']for x in boot}=={'chromium','webkit'}
assert all(x['full_bootstrap']and x['intro_removed']and x['home_visible']and x['actual_content_visible_on_next_frame']and x['no_mutation_loop']and not x['errors']for x in boot)
real_files=list(Path('browser245').rglob('real-cinema-browser.json'));assert len(real_files)==1
real=json.loads(real_files[0].read_text());assert real['ok']and not real['errors']and all(x['connection']=='connected'for x in real['rtc'])
for p in Path('browser245').rglob('*'):
 if p.is_file():shutil.copy2(p,root/'review'/('ci-'+p.name))
with zipfile.ZipFile(source)as z:
 assert z.read('source-verification.json')==(root/'source-verification.json').read_bytes()
 m=json.loads(z.read('source-verification.json'));assert m['version']=='0.2.45-beta'and m['build']==60 and m['server_update_required']is True
 for name,digest in m['backend_sha256'].items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==digest,name
 for name in ['backend_update.py','transform_backend.py','backend-baseline.json']:assert z.read('deployment/'+name)==(root/name).read_bytes()
manifest=dict(version='0.2.45-beta',build=60,base_version='0.2.44-beta',base_build=59,server_update_required=True,physical_device_verified=False,installer_revision='0245-clean-cinema-v2-transactional-data-preservation',build_run=44503893061,source_commit='66ab65de5c8d696211f29e23aa63df5e0a2238e0',sha256={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest()for p in sorted(root.rglob('*'))if p.is_file()and p.name!='PACKAGE.json'})
(root/'PACKAGE.json').write_text(json.dumps(manifest,indent=2))
print('VERIFIED Cinema v2 build60, both native platforms and exact source/backend payload.')
