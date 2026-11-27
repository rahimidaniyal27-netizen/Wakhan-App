import hashlib,json,plistlib,zipfile
from pathlib import Path
p=Path('.');meta=json.loads(Path('../../delivery0278/SOURCE.json').read_text())
for name,key in [('SceneDelegate.swift','scene_sha256'),('MainViewController.swift','ios_controller_sha256')]:
 assert hashlib.sha256((p/'ios/App/App'/name).read_bytes()).hexdigest()==meta[key],name
scene=(p/'ios/App/App/SceneDelegate.swift').read_text()
assert 'rootViewController = MainViewController()'in scene and 'rootViewController = CAPBridgeViewController()'not in scene
output=p/'Wakhan-0.2.78-beta.ipa'
with zipfile.ZipFile(output)as z:
 assert z.testzip()is None
 n=next(n for n in z.namelist()if n.count('/')==2 and n.endswith('.app/Info.plist'))
 info=plistlib.loads(z.read(n));assert info['CFBundleIdentifier']=='app.wakhan.music'and info['CFBundleShortVersionString']=='0.2.78'and str(info['CFBundleVersion'])=='93'
 scene_config=info['UIApplicationSceneManifest']['UISceneConfigurations']['UIWindowSceneSessionRoleApplication'][0]
 assert scene_config['UISceneDelegateClassName']=='App.SceneDelegate'
 base=n.rsplit('/',1)[0];binary=z.read(base+'/'+info['CFBundleExecutable'])
 for marker in [b'MainViewController',b'WakhanBridgeViewController',b'WakhanVaultPlugin',b'WakhanSignInPlugin',b'WakhanMusicPlugin']:assert marker in binary,marker
 assert hashlib.sha256(z.read(base+'/public/wakhan-shell.json')).hexdigest()==meta['shell_sha256']
 release=json.loads(z.read(base+'/public/wakhan-release.json'));assert release['build']==93 and release['server_update_required']is False
result=dict(version='0.2.78-beta',build=93,signed=False,installation='Sideloadly; unsigned IPA',sha256=hashlib.sha256(output.read_bytes()).hexdigest(),shell_sha256=meta['shell_sha256'],scene_sha256=meta['scene_sha256'],native_entrypoint_verified=True,client_tests=177,device_verified=False,server_update_required=False)
Path('ios-build-result.json').write_text(json.dumps(result,indent=2)+'\n');print('Verified IPA build93, actual compiled scene source, native controller and embedded release')
