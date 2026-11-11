# Wakhan 0.2.8-beta · build 22

Independent Android and iPhone client, bundle ID `app.wakhan.music`.

## iPhone test installation

The `codex/consolidated-0.2.8` branch builds an unsigned device IPA with GitHub's
macOS/Xcode runner. Open **Actions → iOS build (unsigned IPA for Sideloadly)**,
select the successful run for this branch, and download **Wakhan-iOS-0.2.8-beta**
from Artifacts. Extract `Wakhan-0.2.8-beta.ipa` from the ZIP on Windows and install
it with Sideloadly using the same Apple ID and bundle settings as before.
Free provisioning normally expires after seven days. This is a test build.

The workflow verifies the actual IPA's bundle ID, version 0.2.8/build 22, arm64
binary, native audio plugin and bundled assets. Successful builds on `main`
also publish a prerelease; branch builds only produce private workflow artifacts.
Previous releases are retained. Push registration is disabled in this free iOS
sideload build. The Android workflow validates a debug compilation; installing
over the existing release APK requires the separately preserved release key.

## Consolidated client changes

- One Android keyboard inset owner, with compact hall layouts for short viewports.
- Attached tab views retain drafts, scroll positions and active media.
- Private-chat quotes, per-conversation drafts, bounded history caching and
  stable retry keys; stale responses cannot send into a different conversation.
- Photo and voice previews, explicit send/cancel, lost-acknowledgement retry and
  one voice-message player at a time. Recording permission races stop safely.
- A compact ten-seat hall, connection status and accessible microphone controls.
- Music request queue, votes, host controls, room topics/languages/events,
  favorite/friend/recent room filters and a shared number-guessing activity.
- Automatic/lite display settings and Arabic/Persian search normalization.
- On-demand, sanitized voice transport diagnostics and a secure relay preference;
  candidate allocation alone does not prove that two-way audio works.
- Notification preferences, explicit device registration and moderator report review.
- Android personal music uses a Media3/ExoPlayer media service with native
  notification controls and audio focus, independently of the WebView renderer.
- Native audio session handles private recording, interruptions, output changes
  and awaited shutdown on logout. Obsolete Telegram client adapters are removed.

## Backend and device gates

Quotes, media uploads, room activities, preferences and moderation require the
matching 0.2.8 native backend. Uploading this repository does **not** migrate the
production database, open relay firewall ports or stop old server services.
The server update is a separate operator step in the consolidated deployment.
User-confirmed coin transfers are preserved; this client update does not alter
the financial ledger or sell store products.

The client has passed local web/HTTP integration checks and simulated native
bridge tests. GitHub supplies the actual Swift/Android compilation check.
Samsung A13 keyboard behavior, real iPhone recording, lock-screen/Bluetooth
behavior and two-way audio on Irancell **without VPN** still require handset
tests. Existing feedback established good audio with VPN, not without VPN.
Store accounts, purchase integration and store acceptance remain release gates.

## Local checks

Node 22.12+ or 24 and Python 3:

```sh
npm ci
npm run prepare:web
npm test
python3 -m unittest discover -s tests -p 'test_ios_package.py' -q
WAKHAN_BUILD_PLATFORM=ios npm run build
```

On macOS with Xcode, run `bash ios-assets/build-ios.sh` for the actual IPA.

