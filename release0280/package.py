from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parent;package=root/'server-package'
manifest=json.loads((package/'MANIFEST.json').read_text())
for kind,filename in [('android','Wakhan-0.2.80-unsigned.apk'),('ios','Wakhan-0.2.80-beta.ipa')]:
 meta=json.loads((package/(kind+'-build-result.json')).read_text());digest=hashlib.sha256((package/filename).read_bytes()).hexdigest()
 assert meta['sha256']==digest and meta['build']==95 and meta['version']=='0.2.80-beta'
 manifest[kind+'_sha256']=digest
for name,item in manifest['files'].items():
 assert hashlib.sha256((package/'backend'/name).read_bytes()).hexdigest()==item['sha256'];compile((package/'backend'/name).read_text(),name,'exec')
(package/'MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
archive=root/'Wakhan-0.2.80-iPhone-Android.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for p in sorted(package.rglob('*')):
  if p.is_file()and'__pycache__'not in p.parts:
   assert not p.is_symlink();info=zipfile.ZipInfo(p.relative_to(package).as_posix(),(2026,11,27,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,p.read_bytes())
with zipfile.ZipFile(archive)as z:assert z.testzip()is None
sha=hashlib.sha256(archive.read_bytes()).hexdigest();(root/'SHA256SUMS.txt').write_text(sha+'  '+archive.name+'\n');print(archive.name,sha)
