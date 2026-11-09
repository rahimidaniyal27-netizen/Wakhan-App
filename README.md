# Wakhan Android project

سورس مستقل پروژهٔ اندروید واخان (Capacitor)، نسخهٔ 0.1.0-beta.
این ZIP شامل سورس رابط، پروژهٔ Android Studio، فایل‌های لازم رابط M81 و تست‌های اندروید است. بستهٔ نصب سرور یا پروژهٔ iOS در آن نیست.

## Build

Requirements: Node 22.12+ / 24, npm, Python 3, full JDK 21, Android SDK platform/build-tools 36.

```bash
npm ci
npm run build
npm run sync
cd android
chmod +x gradlew
./gradlew --max-workers=2 :app:assembleDebug
```

Open the `android/` directory in Android Studio after npm install/sync.
Output: android/app/build/outputs/apk/debug/app-debug.apk
Set ANDROID_HOME or create android/local.properties for your SDK. Native dependencies come from npm; node_modules, SDK caches and signing keys are excluded. Gradle creates a new debug key in the new build environment.

```bash
node --test --test-isolation=none tests/*.test.mjs
```

Application ID: app.wakhan.music; minSdk 24; target/compileSdk 36.
The app connects to https://music.kabulcafe.uk. It needs the existing M81/N1 backend and a signed-in Wakhan account at runtime. Google is configured on that server; email/Facebook require their separate provider settings.
This is beta source, not an iOS or store release. The previous APK was built and signature-checked; physical Android device validation remains outstanding.

Packaging: the asset-root path in scripts/prepare-web.py was adapted so this project is self-contained. Approved Home headphones bytes are preserved.
