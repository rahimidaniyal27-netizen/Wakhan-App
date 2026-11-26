import hashlib,json,plistlib,sys,zipfile
from pathlib import Path
kind=sys.argv[1];shell=hashlib.sha256(Path('public/wakhan-shell.json').read_bytes()).hexdigest()
meta=json.loads(Path('../../delivery0277/SOURCE.json').read_text());assert shell==meta['shell_sha256']
assert json.loads(Path('package.json').read_text())['wakhanBuild']==92
if kind=='ios':
 output=Path('Wakhan-0.2.77-beta.ipa')
 with zipfile.ZipFile(output)as z:
  assert z.testzip()is None
  path=next(n for n in z.namelist()if n.count('/')==2 and n.endswith('.app/Info.plist'))
  info=plistlib.loads(z.read(path));assert info['CFBundleIdentifier']=='app.wakhan.music'and info['CFBundleShortVersionString']=='0.2.77'and str(info['CFBundleVersion'])=='92'
  base=path.rsplit('/',1)[0];binary=z.read(base+'/'+info['CFBundleExecutable'])
  for marker in [b'WakhanVaultPlugin',b'WakhanSignInPlugin',b'WakhanMusicPlugin']:assert marker in binary,marker
  assert hashlib.sha256(z.read(base+'/public/wakhan-shell.json')).hexdigest()==shell
 result='ios-build-result.json';installation='Sideloadly; unsigned IPA'
else:
 original=Path('android/app/build/outputs/apk/release/app-release-unsigned.apk');output=Path('Wakhan-0.2.77-unsigned.apk');output.write_bytes(original.read_bytes())
 with zipfile.ZipFile(output)as z:
  assert z.testzip()is None
  assert hashlib.sha256(z.read('assets/public/wakhan-shell.json')).hexdigest()==shell
  dex=b''.join(z.read(n)for n in z.namelist()if n.endswith('.dex'))
  for marker in [b'WakhanVault',b'WakhanSignIn',b'wakhan.personal']:assert marker in dex,marker
 result='android-build-result.json';installation='Requires original release key signing on owner server; raw APK is not installable'
Path(result).write_text(json.dumps(dict(version='0.2.77-beta',build=92,signed=False,installation=installation,sha256=hashlib.sha256(output.read_bytes()).hexdigest(),shell_sha256=shell,device_verified=False),indent=2)+'\n')
print(output.name,hashlib.sha256(output.read_bytes()).hexdigest())
