# Wakhan 0.2.9-beta · build 23

Android and iPhone client for `app.wakhan.music`.

The `codex/royal-0.2.9` branch builds with `.github/workflows/royal-029.yml`.
The consolidated artifact contains the actual device IPA, the matching guarded
native-server upgrade, Persian installation instructions, and checksums.
Read `server-update029/README-fa.md`. The previous `server-update/` helper is
retained as an immutable build input; do not rerun the old 028 installer.

The Android workflow compiles a debug build. The operator builds and verifies
an APK and AAB with the existing private release key on the owner's server.
No signing keys or server credentials belong in this repository.

This update adds a transparent room composer above the keyboard, compact live
room messages, approved individual red velvet cinema seats, owner-selected
2–16 seat layouts and backgrounds, cinema-screen controls and Stop playback.
It also fixes physical-left navigation and iPhone safe areas, cinema icon labels,
swipe replies, tiny read receipts, private online visibility, native help and
native hall/staff management. Rendering remains cached across tab changes.

The matching server upgrade stages a database copy and tests the actual leased
room MP4 route for audio, video and byte ranges before switching the native
service. The current live database is preserved. Service rollback never restores
an old ledger over newer transactions. The original 028 deployment must already
be installed; this is not the legacy bot migration.

Automated browser/backend tests and successful native compilation do not prove
real handset keyboard, recording, background playback or Iranian carrier access.
Test these on the new APK/IPA, including Irancell without VPN. This remains a
beta: free iPhone sideloading expires, iPhone push and store IAP are not enabled,
and this package is not store-ready.
