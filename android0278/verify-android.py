import hashlib,json,os,re,subprocess,zipfile
from pathlib import Path
meta=json.loads(Path('../../delivery0278/SOURCE.json').read_text())
source=Path('android/app/build/outputs/apk/release/app-release-unsigned.apk');output=Path('Wakhan-0.2.78-unsigned.apk')
aapt=Path(os.environ['ANDROID_HOME'])/'build-tools/36.0.0/aapt2'
badging=subprocess.check_output([aapt,'dump','badging',source],text=True)
package=re.search(r"package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'",badging)
assert package and package.groups()==('app.wakhan.music','93','0.2.78-beta')
with zipfile.ZipFile(source)as z:
 assert z.testzip()is None
 assert hashlib.sha256(z.read('assets/public/wakhan-shell.json')).hexdigest()==meta['shell_sha256']
 release=json.loads(z.read('assets/public/wakhan-release.json'));assert release['build']==93 and release['version']=='0.2.78-beta'
 dex=b''.join(z.read(n)for n in z.namelist()if n.endswith('.dex'))
 for marker in [b'WakhanVault',b'WakhanSignIn',b'wakhan.personal']:assert marker in dex,marker
output.write_bytes(source.read_bytes())
result=dict(version='0.2.78-beta',build=93,package='app.wakhan.music',signed=False,installation='Requires signing with original release key on owner server',sha256=hashlib.sha256(output.read_bytes()).hexdigest(),source_sha256=meta['source_sha256'],shell_sha256=meta['shell_sha256'],client_tests=177,device_verified=False,backend_update_required=False)
Path('android-build-result.json').write_text(json.dumps(result,indent=2)+'\n')
print('Verified Android actual manifest, native plugin classes, embedded shell and release build93')
