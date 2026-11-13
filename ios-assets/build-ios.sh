#!/usr/bin/env bash
# Builds an UNSIGNED Wakhan.ipa on a macOS runner. Sideloadly (free Apple ID) signs it on install.
set -euo pipefail
npm install --no-audit --no-fund --loglevel=error
echo '{"push":false}' > public/build-flags.json   # no push with a free Apple ID
npx vite build --config vite.beta.config.mjs   # app bundle (public/wakhan-shell.json) is already final; never rebuild it from the old snapshot
[ -d ios ] || npx cap add ios
npx cap sync ios
cp ios-assets/native/*.swift ios/App/App/
(gem list -i xcodeproj >/dev/null 2>&1 || gem install --user-install xcodeproj >/dev/null) && ruby ios-assets/native/add_files.rb || ruby -I"$(gem env gemdir)" ios-assets/native/add_files.rb
grep -q MainViewController ios/App/App/Base.lproj/Main.storyboard
PL=ios/App/App/Info.plist; B=/usr/libexec/PlistBuddy
set_kv(){ $B -c "Set :$1 $2" "$PL" 2>/dev/null || $B -c "Add :$1 string $2" "$PL"; }
set_kv CFBundleDisplayName "Wakhan"
set_kv NSMicrophoneUsageDescription "Wakhan uses the microphone when you speak in a hall."
set_kv NSCameraUsageDescription "Wakhan uses the camera when you take a profile photo."
set_kv NSPhotoLibraryUsageDescription "Wakhan uses your photos when you choose a profile photo."
$B -c "Delete :UIBackgroundModes" "$PL" 2>/dev/null || true
$B -c "Add :UIBackgroundModes array" "$PL" && $B -c "Add :UIBackgroundModes:0 string audio" "$PL"
# app icon (single 1024 image, Xcode makes the rest)
IC=ios/App/App/Assets.xcassets/AppIcon.appiconset; rm -rf "$IC"; mkdir -p "$IC"; cp ios-assets/AppIcon-1024.png "$IC/AppIcon-1024.png"
cat > "$IC/Contents.json" <<'J'
{"images":[{"filename":"AppIcon-1024.png","idiom":"universal","platform":"ios","size":"1024x1024"}],"info":{"author":"xcode","version":1}}
J
V=$(grep -o 'versionName "[^"]*"' android/app/build.gradle | cut -d'"' -f2); C=$(grep -o 'versionCode [0-9]*' android/app/build.gradle | grep -o '[0-9]*')
cd ios/App
if [ -d App.xcworkspace ]; then T=(-workspace App.xcworkspace); else T=(-project App.xcodeproj); fi
xcodebuild "${T[@]}" -scheme App -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath build MARKETING_VERSION="${V%%-*}" CURRENT_PROJECT_VERSION="$C" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" build > /tmp/xb.log 2>&1 || { grep -E 'error:|warning: .*override' /tmp/xb.log | sort -u | head -15 | while read -r l; do echo "::error::$l"; done; tail -5 /tmp/xb.log; exit 65; }
tail -3 /tmp/xb.log
APP=$(find build/Build/Products/Release-iphoneos -maxdepth 1 -name '*.app' | head -1)
rm -rf Payload && mkdir Payload && cp -R "$APP" Payload/
zip -qry "../../Wakhan-$V.ipa" Payload && cd ../.. && ls -la Wakhan-*.ipa
