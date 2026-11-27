# Active audio/salon follow-up

Source-only work after deployed0.2.80/build95. No native installer or production update has been created.

## Reviewed input

The owner supplied the current server-source report ZIP SHA256 `f30b069ab401f8156cec5465cdb125073cd3a5474f4a16a3a2947425d7a12ce0`. Its photo file and directory are present and readable. The archived source does not contain audio samples or device playback state.

## Prepared changes

`client-source/`: canonical photo-save refresh, removal of stale24-hour background-as-photo caching,5s visible directory/participant metadata refresh, bounded failed-photo retries, stale-response protection and unchanged-DOM preservation. Native autoplay that becomes paused is no longer incorrectly reported successful. The original layout is preserved.

`server-source/`: configured-only salon listings, optional real photos, reserved-room setup with stable code/UID, atomic photo persistence, explicit removal and photo validation before name publication. `MANIFEST.json` pins actual reviewed input/output hashes. These files are NOT deployed; do not overwrite an unrelated or changed server.

Validation:187Node tests,8Chromium profile scenarios,10SQLite/server profile tests pass. These are not physical-phone or live-provider verification. Reported silence remains unresolved.

## Owner live sound diagnosis

`check-live-audio.py` makes ordinary GETs using ONLY the configured owner’s existing session. It creates no account/session and sends no queue/control commands. The private key is read only locally to reconstruct that existing session; credentials, URLs, account names and audio samples are never exported. API requests cannot go through environment proxies or redirects. FFmpeg runs asmusicbot, receives media URLs onstdin, decodes five seconds and exports only codec/signal metrics. Normal authentication/presence timestamps may refresh as when the owner opens their salon. Code, settings, service state, SSH and VPN are unchanged.

Run while music is playing in the owner’s own salon. Optional `--link` accepts a public YouTube/SoundCloud song link. Output is a private `wakhan-live-audio-*.zip` containing only `AUDIO-RESULT.json`.5tests pass including real local file/HLS decoding, session-owner scoping/no DBwrite, redaction and both SoundCloud audio paths. This diagnostic is not an installer.


## Prepared server-only update after the live YouTube failure report

The owner live report SHA256 `1f03b3a18d7bdf163534c08384f7c457c81feba2d3659eb99a1cf2b723e9df75` proves personal YouTube preparation failed with422; salon decoding timed out. Archive/Audius had nonzero decoded audio and the owner reports SoundCloud working.

The isolated audio child did not inherit the app’s in-process configured YouTube provider registration. The correction initializes that same existing provider in each audio worker. An actual parent/child regression reproduces failure on the uploaded baseline and succeeds with the correction. It does not install another provider or change private configuration. The salon’s explicit music mode reuses the personal audio resolver/cache and configured network route; ordinary movie playback remains on its existing video path. Authorized, ranged AAC bytes are decoded through the actual new salon HTTP handler in the fixture test. Unscoped upstream playlists are never handed to clients; HLS-only salon sources retain the pre-existing muxed-video fallback.

`apply-youtube-fix.py` is the owner-operated installer, default preflight, explicit `--apply`. It pins six reviewed source files, downloads immutable checksummed payloads, compiles with the current service interpreter and tests the actual selected YouTube song with the candidate worker BEFORE stopping the app. The candidate must return a compatible file source. It then privately backs up only source files, updates them atomically, restarts ONLYwakhan-app, checks login config/unauthenticated media protection and decodes actual YouTube audio through the protected personal endpoint. Failed postchecks restore source without rewinding user data. The queue may need its song selected again after the app service restart. No native build, APK publication, signing-key/config/SSH/VPN change is included.

Validation:118existing Python server tests,5worker cases,8salon audio cases,7installer cases and10profile cases pass. Fixtures prove process isolation, real AAC decoding, configured proxy use, member revocation and rollback retaining a new DB message. These do not substitute for the owner’s live provider preflight or phone playback check. An owner preflight failure exports only fixed error codes and three provider-availability booleans; no raw extractor text, URLs, keys, cookies, user names or private configuration is included.

Live server installation remains pending the owner’s execution. The prepared client changes stay for the next requested native release.
