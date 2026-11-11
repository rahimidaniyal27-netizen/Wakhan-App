# Wakhan client 0.2.12 beta / build 26

Restores animated room bars, plain photo editor thumbnails and authoritative room covers; unifies fullscreen controls, viewport restoration, profile safe-area navigation and the glass room footer.

The mobile release uses the verified 0.2.11 backend. `client-update0212/build-upgrade.py` packages a signed-Android build/publisher that verifies the exact active runtime and existing signer, publishes the download atomically, and preserves the preceding APK for rollback. It does not stop services or migrate the live database. iPhone IPA is built on macOS and signed on the user's PC through Sideloadly.

See `client-update0212/README-fa.md`. Device audio and iOS orientation remain handset verification items; store readiness is false.

Build 26 uses iOS keyboard frame notifications and their animation timing instead of delayed native WebView resizing. Ordinary phone screens stay portrait; video fullscreen alone enables rotation, and all fullscreen exit paths restore portrait.
