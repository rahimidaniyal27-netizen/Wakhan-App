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
