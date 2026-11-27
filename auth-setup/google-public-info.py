#!/usr/bin/env python3
"""Read only the installed APK's public certificate and current public OAuth ID.
No key store, password, database, private config or service is changed/read.
"""
from pathlib import Path
import json,os,re,subprocess,urllib.request


def main():
    apk=Path('/opt/wakhan-app-0.2.11-li9z037x/releases/Wakhan.apk')
    if not apk.is_file()or apk.is_symlink():raise RuntimeError('INSTALLED_APK_NOT_FOUND')
    choices=[]
    for base in ['/opt/android-sdk/build-tools','/opt/android-sdk-linux/build-tools','/usr/lib/android-sdk/build-tools']:
        p=Path(base)
        if p.is_dir():choices.extend(x for x in p.iterdir()if re.fullmatch(r'\d+\.\d+\.\d+',x.name))
    choices.sort(key=lambda p:tuple(map(int,p.name.split('.'))),reverse=True)
    tool=next((x/'apksigner'for x in choices if os.access(x/'apksigner',os.X_OK)),None)
    if not tool:raise RuntimeError('APKSIGNER_MISSING')
    result=subprocess.run([str(tool),'verify','--print-certs',str(apk)],capture_output=True,text=True,timeout=45)
    if result.returncode:raise RuntimeError('INSTALLED_APK_SIGNATURE_INVALID')
    fingerprints=re.findall(r'^Signer #\d+ certificate SHA-1 digest: ([a-fA-F0-9]{40})$',result.stdout,re.M)
    if len(fingerprints)!=1:raise RuntimeError('SINGLE_ANDROID_CERTIFICATE_REQUIRED')
    op=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with op.open('http://127.0.0.1:10010/api/app/config',timeout=5)as response:config=json.load(response)
    client=config.get('google','')
    if not isinstance(client,str)or not re.fullmatch(r'[A-Za-z0-9_-]+\.apps\.googleusercontent\.com',client):raise RuntimeError('PUBLIC_WEB_CLIENT_ID_MISSING')
    raw=fingerprints[0].upper()
    print('Package / Bundle ID: app.wakhan.music')
    print('Android SHA-1: '+':'.join(raw[i:i+2]for i in range(0,40,2)))
    print('Existing Web Client ID: '+client)
    print('هیچ فایلی یا سرویسی تغییر نکرد؛ این اطلاعات عمومی‌اند.')


if __name__=='__main__':
    try:main()
    except Exception as exc:print('STOP: '+(str(exc)if type(exc)is RuntimeError else type(exc).__name__));raise SystemExit(1)
