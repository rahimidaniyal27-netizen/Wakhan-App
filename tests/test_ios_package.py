"""Exercise the actual IPA metadata gate with local synthetic binaries."""
import importlib.util,json,os,plistlib,struct,tempfile,unittest,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def load(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/(name+'.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

class IOSPackage(unittest.TestCase):
    def test_config_preserves_existing_schemes_and_background_modes(self):
        configure=load('configure-ios').configure
        data={'UIBackgroundModes':['fetch'],'CFBundleURLTypes':[{'CFBundleURLSchemes':['existing']}]}
        configure(data);configure(data)
        self.assertEqual(data['UIBackgroundModes'],['fetch','audio'])
        self.assertEqual(len(data['CFBundleURLTypes']),2)
        self.assertEqual(data['CFBundleURLTypes'][0]['CFBundleURLSchemes'],['existing'])
        self.assertIn('wakhan',data['CFBundleURLTypes'][1]['CFBundleURLSchemes'])

    def make_ipa(self,path,version=None,push=False,plugin=True,architecture=0x100000c):
        package=json.loads((ROOT/'package.json').read_text())
        info={'CFBundleIdentifier':'app.wakhan.music','CFBundleShortVersionString':version or package['version'].split('-')[0],'CFBundleVersion':str(package['wakhanBuild']),'CFBundleExecutable':'App','UIBackgroundModes':['audio'],'NSMicrophoneUsageDescription':'Hall voice and voice messages'}
        binary=struct.pack('<III',0xfeedfacf,architecture,0)+(b'WakhanAudioSessionPlugin' if plugin else b'OtherClass')
        with zipfile.ZipFile(path,'w') as z:
            prefix='Payload/App.app/'
            z.writestr(prefix+'Info.plist',plistlib.dumps(info));z.writestr(prefix+'App',binary)
            z.writestr(prefix+'public/build-flags.json',json.dumps({'push':push}))
            z.writestr(prefix+'public/wakhan-shell.json',(ROOT/'public/wakhan-shell.json').read_bytes())

    def test_success_and_reject_wrong_version_push_missing_plugin_simulator(self):
        verify=load('verify-ios').verify
        previous=Path.cwd();os.chdir(ROOT)
        try:
            with tempfile.TemporaryDirectory() as folder:
                path=Path(folder)/'test.ipa';self.make_ipa(path)
                result=verify(path);self.assertTrue(result['ok']);self.assertFalse(result['signed']);self.assertFalse(result['device_audio_verified'])
                for changes,reason in [({'version':'0.2.5'},'IOS_BINARY_VERSION_MISMATCH'),({'push':True},'FREE_SIDELOAD_MUST_NOT_ENABLE_PUSH'),({'plugin':False},'IOS_NATIVE_AUDIO_PLUGIN_MISSING'),({'architecture':0x1000007},'IOS_DEVICE_ARM64_REQUIRED')]:
                    self.make_ipa(path,**changes)
                    with self.assertRaisesRegex(RuntimeError,reason):verify(path)
        finally:os.chdir(previous)

if __name__=='__main__':unittest.main()
