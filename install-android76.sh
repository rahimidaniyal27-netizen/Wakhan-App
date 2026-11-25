#!/usr/bin/env bash
# WAKHAN 0.2.76 Android: signs the APK built on GitHub with the ORIGINAL key that stays on this server
# (/opt/wakhan-android/keys), checks it is the same signature as the APK people already have (so it installs as an update),
# then publishes it at https://music.kabulcafe.uk/download/Wakhan.apk and in releases/latest.json.
# Backs up first and goes back by itself when anything fails. Prints no password.
set -uo pipefail
WD=/opt/wakhan-app-0.2.11-li9z037x; REL=$WD/releases; T=$REL/Wakhan.apk; LJ=$REL/latest.json
KEYS=/opt/wakhan-android/keys/release.properties
URL=https://github.com/rahimidaniyal27-netizen/Wakhan-App/releases/download/android-0.2.76-beta/Wakhan-0.2.76-unsigned.apk
SHA=ab43a2a8be6835ef8316ce8a6f2255e8f19defe6ea8967a925b37a3c59b44138
VER=0.2.76-beta; BUILD=91
Y=$'\e[1;30;43m'; G=$'\e[1;32m'; R=$'\e[1;31m'; N=$'\e[0m'
say(){ printf '%s\n' "$*"; }
printf '\n%s ▼▼▼ از اینجا کپی کن ▼▼▼ %s\n' "$Y" "$N"
fin(){ [ -n "${W:-}" ] && rm -rf "$W"; printf '%s ▲▲▲ تا اینجا ▲▲▲ %s\n\n' "$Y" "$N"; exit $1; }
[ "$(id -u)" = 0 ] || { say "${R}❌ با root اجرا کن$N"; fin 1; }
[ -f "$KEYS" ] || { say "${R}❌ کلید امضا پیدا نشد: $KEYS$N"; fin 1; }
[ -d "$REL" ] || { say "${R}❌ پوشهٔ releases پیدا نشد$N"; fin 1; }
BT=$(ls -d /opt/android-sdk/build-tools/* /opt/android-sdk-linux/build-tools/* /usr/lib/android-sdk/build-tools/* 2>/dev/null | sort -V | tail -1)
[ -x "$BT/apksigner" ] && [ -x "$BT/zipalign" ] || { say "${R}❌ apksigner/zipalign پیدا نشد$N"; fin 1; }
command -v java >/dev/null || { say "${R}❌ java نیست$N"; fin 1; }
W=$(mktemp -d /opt/wakhan-android/sign76-XXXXXX)
curl -fsSL "$URL" -o "$W/u.apk" || { say "${R}❌ دانلود APK ناکام شد$N"; fin 1; }
[ "$(sha256sum "$W/u.apk" | cut -d' ' -f1)" = "$SHA" ] || { say "${R}❌ APK خراب رسید (sha)$N"; fin 1; }
say "✅ APK ساخته‌شده روی GitHub رسید و سالم است"
python3 - "$KEYS" "$BT" "$W" <<'PY' || fin 1
import os,re,subprocess,sys
keys,bt,w=sys.argv[1:]
p={}
for line in open(keys,encoding='utf-8',errors='replace'):
    line=line.strip()
    if not line or line[0] in '#!': continue
    m=re.match(r'([^=:\s]+)\s*[=:]\s*(.*)',line)
    if m: p[m.group(1).strip().lower()]=m.group(2).strip()
def get(*names):
    for n in names:
        for k,v in p.items():
            if k==n.lower() or k.endswith(n.lower()): return v
    return ''
store=get('storeFile'); sp=get('storePassword'); alias=get('keyAlias'); kp=get('keyPassword') or sp
if not store or not sp: print('❌ فایل کلید کامل نیست'); sys.exit(1)
if not os.path.isabs(store): store=os.path.join(os.path.dirname(keys),store)
env=dict(os.environ,WK_SP=sp,WK_KP=kp)
r=subprocess.run([bt+'/zipalign','-f','-P','16','4',w+'/u.apk',w+'/a.apk'],capture_output=True)
if r.returncode: print('❌ zipalign:',r.stderr.decode()[-200:]); sys.exit(1)
cmd=[bt+'/apksigner','sign','--ks',store,'--ks-pass','env:WK_SP','--key-pass','env:WK_KP','--out',w+'/s.apk']
if alias: cmd[4:4]=['--ks-key-alias',alias]
r=subprocess.run(cmd+[w+'/a.apk'],capture_output=True,env=env)
if r.returncode: print('❌ امضا ناکام شد:',r.stderr.decode().replace(sp,'***').replace(kp,'***')[-300:]); sys.exit(1)
print('✅ با کلید اصلی امضا شد')
PY
cert(){ "$BT/apksigner" verify --print-certs "$1" 2>/dev/null | grep -m1 'SHA-256 digest' | awk '{print $NF}'; }
NEW=$(cert "$W/s.apk"); [ -n "$NEW" ] || { say "${R}❌ امضای APK تأیید نشد$N"; fin 1; }
if [ -f "$T" ]; then OLD=$(cert "$T"); [ "$OLD" = "$NEW" ] || { say "${R}❌ امضای تازه با نسخهٔ فعلی فرق دارد (آپدیت نصب نمی‌شد). منتشر نشد.$N"; fin 1; }; say "✅ امضا همان امضای نسخهٔ فعلی است (روی نسخهٔ قبلی آپدیت می‌شود)"; fi
NS=$(sha256sum "$W/s.apk" | cut -d' ' -f1)
STAMP=$(date +%Y%m%d-%H%M%S); BK=$REL/Wakhan-before-$VER-$STAMP.apk; BJ=$REL/latest.json.before-$VER-$STAMP
[ -f "$T" ] && cp -p "$T" "$BK"; [ -f "$LJ" ] && cp -p "$LJ" "$BJ"
rollback(){ say "↩️ برگشت به نسخهٔ قبلی…"; [ -f "$BK" ] && cp -p "$BK" "$T"; [ -f "$BJ" ] && cp -p "$BJ" "$LJ"; say "${G}✅ برگشت انجام شد$N"; fin 1; }
OWN=$( [ -f "$T" ] && stat -c %U:%G "$T" || stat -c %U:%G "$REL")
cp "$W/s.apk" "$T.new" && chown "$OWN" "$T.new" && chmod 644 "$T.new" && mv -f "$T.new" "$T" || rollback
python3 - "$LJ" "$VER" "$BUILD" "$NS" <<'PY' || rollback
import json,os,sys,tempfile
lj,ver,build,sha=sys.argv[1:]
d=json.load(open(lj)) if os.path.exists(lj) else {}
d.update(version=ver,build=int(build),sha256=sha,url='https://music.kabulcafe.uk/download/Wakhan.apk?build='+build)
fd,tmp=tempfile.mkstemp(dir=os.path.dirname(lj));os.write(fd,json.dumps(d,indent=2).encode());os.close(fd);os.chmod(tmp,0o644);os.replace(tmp,lj)
PY
D=$(curl -s http://127.0.0.1:10010/download/Wakhan.apk | sha256sum | cut -d' ' -f1)
[ "$D" = "$NS" ] || { say "${R}❌ فایل منتشرشده با فایل امضاشده یکی نیست$N"; rollback; }
L=$(curl -s http://127.0.0.1:10010/api/app/latest | grep -o '"build":[ ]*[0-9]*' | grep -o '[0-9]*$')
say "${G}✅ منتشر شد: نسخهٔ $VER (build $BUILD)   اعلان آپدیت داخل برنامه: build ${L:-?}$N"
say "📥 https://music.kabulcafe.uk/download/Wakhan.apk?build=$BUILD"
say "برگشت دستی اگر لازم شد: cp -p $BK $T && cp -p $BJ $LJ"
fin 0
