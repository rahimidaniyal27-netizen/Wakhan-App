#!/usr/bin/env bash
# GitHub macOS builds an unsigned device IPA; Sideloadly signs it on Windows.
set -euo pipefail
npm ci --no-audit --no-fund --loglevel=error
export WAKHAN_BUILD_PLATFORM=ios
npm run prepare:web
npm test
python3 -m unittest discover -s tests -p 'test_ios_package.py' -q
npm run build
[ -d ios ] || npx cap add ios
npx cap sync ios
cp ios-assets/native/*.swift ios/App/App/
if ! ruby -e "require 'xcodeproj'" >/dev/null 2>&1; then
  gem install --user-install --no-document xcodeproj --version 1.27.0
fi
ruby ios-assets/native/add_files.rb
python3 scripts/configure-ios.py ios/App/App/Info.plist
IC=ios/App/App/Assets.xcassets/AppIcon.appiconset
rm -rf "$IC"
mkdir -p "$IC"
cp ios-assets/AppIcon-1024.png "$IC/AppIcon-1024.png"
cat > "$IC/Contents.json" <<'J'
{"images":[{"filename":"AppIcon-1024.png","idiom":"universal","platform":"ios","size":"1024x1024"}],"info":{"author":"xcode","version":1}}
J
V=$(node -p "require('./package.json').version")
C=$(node -p "require('./package.json').wakhanBuild")
export WAKHAN_VERSION="$V" WAKHAN_BUILD="$C"
xcodebuild -version
cd ios/App
if [ -d App.xcworkspace ]; then T=(-workspace App.xcworkspace); else T=(-project App.xcodeproj); fi
xcodebuild "${T[@]}" -scheme App -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath build MARKETING_VERSION="${V%%-*}" CURRENT_PROJECT_VERSION="$C" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" build > ../../ios-build.log 2>&1 || {
    grep -E 'error:|warning: .*override' ../../ios-build.log | sort -u | head -15 || true
    tail -10 ../../ios-build.log
    exit 65
  }
tail -3 ../../ios-build.log
APP=$(find build/Build/Products/Release-iphoneos -maxdepth 1 -name '*.app' -type d -print)
if [ -z "$APP" ] || [[ "$APP" == *$'\n'* ]]; then echo 'Expected exactly one iOS app'; exit 1; fi
rm -rf Payload
mkdir Payload
cp -R "$APP" Payload/
zip -qry "../../Wakhan-$V.ipa" Payload
cd ../..
python3 scripts/verify-ios.py "Wakhan-$V.ipa"
