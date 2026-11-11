"""Inspect the actual device IPA before the workflow uploads it."""
import hashlib,json,plistlib,re,struct,sys,zipfile
from pathlib import Path

def verify(path):
    package=json.loads(Path('package.json').read_text())
    with zipfile.ZipFile(path) as z:
        roots=[name[:-len('/Info.plist')] for name in z.namelist() if re.fullmatch(r'Payload/[^/]+\.app/Info\.plist',name)]
        if len(roots)!=1:raise RuntimeError('EXPECTED_SINGLE_IOS_APP')
        root=roots[0];info=plistlib.loads(z.read(root+'/Info.plist'))
        if info.get('CFBundleIdentifier')!='app.wakhan.music':raise RuntimeError('IOS_BUNDLE_IDENTIFIER_CHANGED')
        if info.get('CFBundleShortVersionString')!=package['version'].split('-')[0] or str(info.get('CFBundleVersion'))!=str(package['wakhanBuild']):raise RuntimeError('IOS_BINARY_VERSION_MISMATCH')
        executable=info.get('CFBundleExecutable','')
        if not re.fullmatch(r'[A-Za-z0-9_.-]+',executable):raise RuntimeError('IOS_EXECUTABLE_INVALID')
        binary=z.read(root+'/'+executable)
        if len(binary)<12:raise RuntimeError('IOS_DEVICE_BINARY_INVALID')
        magic=binary[:4];arm64=False
        if magic==b'\xcf\xfa\xed\xfe':arm64=struct.unpack_from('<I',binary,4)[0]==0x100000c
        elif magic in (b'\xca\xfe\xba\xbe',b'\xca\xfe\xba\xbf'):
            count=struct.unpack_from('>I',binary,4)[0];stride=32 if magic[-1]==0xbf else 20
            if count>16 or len(binary)<8+count*stride:raise RuntimeError('IOS_DEVICE_BINARY_INVALID')
            arm64=any(struct.unpack_from('>I',binary,8+i*stride)[0]==0x100000c for i in range(count))
        if not arm64:raise RuntimeError('IOS_DEVICE_ARM64_REQUIRED')
        if b'WakhanAudioSessionPlugin' not in binary:raise RuntimeError('IOS_NATIVE_AUDIO_PLUGIN_MISSING')
        shell=json.loads(z.read(root+'/public/wakhan-shell.json'))
        if shell!=json.loads(Path('public/wakhan-shell.json').read_text()):raise RuntimeError('IOS_CLIENT_ASSETS_MISMATCH')
        flags=json.loads(z.read(root+'/public/build-flags.json'))
        if flags.get('push') is not False:raise RuntimeError('FREE_SIDELOAD_MUST_NOT_ENABLE_PUSH')
        if 'audio' not in info.get('UIBackgroundModes',[]) or not info.get('NSMicrophoneUsageDescription'):raise RuntimeError('IOS_AUDIO_CONFIGURATION_MISSING')
    return {'ok':True,'version':package['version'],'build':package['wakhanBuild'],
            'ipa':str(path),'sha256':hashlib.sha256(Path(path).read_bytes()).hexdigest(),
            'signed':False,'install_method':'Sideloadly','device_audio_verified':False,'store_ready':False,
            'native_audio_plugin_present':True,'device_architecture':'arm64'}

if __name__=='__main__':
    report=verify(sys.argv[1]);Path('ios-build-result.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
