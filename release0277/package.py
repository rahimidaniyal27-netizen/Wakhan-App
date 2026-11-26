from pathlib import Path
import json,hashlib,zipfile
root=Path(__file__).resolve().parent
package=root/'server-package'
manifest=json.loads((package/'MANIFEST.json').read_text())
for name,digest in [('Wakhan-0.2.77-unsigned.apk',manifest['android_sha256']),('Wakhan-0.2.77-beta.ipa',manifest['ios_sha256'])]:
 assert hashlib.sha256((package/name).read_bytes()).hexdigest()==digest
for name,item in manifest['files'].items():
 assert hashlib.sha256((package/'backend'/name).read_bytes()).hexdigest()==item['sha256']
 compile((package/'backend'/name).read_text(),name,'exec')
archive=root/'Wakhan-0.2.77-iPhone-Android.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for p in sorted(package.rglob('*')):
  if p.is_file()and'__pycache__'not in p.parts:
   assert not p.is_symlink()
   info=zipfile.ZipInfo(p.relative_to(package).as_posix(),(2026,11,26,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
   z.writestr(info,p.read_bytes())
with zipfile.ZipFile(archive)as z:assert z.testzip()is None
sha=hashlib.sha256(archive.read_bytes()).hexdigest()
(root/'SHA256SUMS.txt').write_text(sha+'  '+archive.name+'\n')
print(archive.name,archive.stat().st_size,sha)
