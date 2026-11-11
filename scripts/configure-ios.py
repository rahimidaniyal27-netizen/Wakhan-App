"""Configure the generated iOS target without removing existing URL schemes."""
import plistlib,sys
from pathlib import Path

def configure(value):
    value.update(CFBundleDisplayName='Wakhan',
        NSMicrophoneUsageDescription='Wakhan uses the microphone when you speak in a hall or record a voice message.',
        NSCameraUsageDescription='Wakhan uses the camera when you take a photo to share or use on your profile.',
        NSPhotoLibraryUsageDescription='Wakhan uses your photos when you choose a photo to share or use on your profile.')
    value['UIBackgroundModes']=list(dict.fromkeys(value.get('UIBackgroundModes',[])+['audio']))
    schemes=value.setdefault('CFBundleURLTypes',[])
    if not any('wakhan' in row.get('CFBundleURLSchemes',[]) for row in schemes):
        schemes.append({'CFBundleURLName':'app.wakhan.music','CFBundleURLSchemes':['wakhan']})
    return value

if __name__=='__main__':
    path=Path(sys.argv[1]);path.write_bytes(plistlib.dumps(configure(plistlib.loads(path.read_bytes()))))
    print('iOS microphone, audio background mode and native auth callback configured.')
