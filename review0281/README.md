# Active audio/salon follow-up

`collect-audio-salon.py` is an owner-operated read-only collector. It does not install these client files.

`client-source/` contains the two corrected salon programs extracted from the isolated current build95 source. No APK/IPA or live backend change is included. The aggregate client tests pass182/182; eight browser scenarios verify profile refresh and retry behavior.

The stale24-hour thumbnail/background cache was removed. Chosen photos now refresh from authoritative responses, late pre-save responses are discarded, concurrent directory requests are shared, unchanged cards are retained, and inactive tabs do not poll. Failed same-server hash-named photo loads have up to three retries. Unconfigured rooms are omitted when the server marks `configured:false`; current backend enforcement remains pending review.

Music-without-sound is NOT diagnosed or fixed yet. Awaiting the owner review ZIP and affected device/platform information. Do not treat these source files as an installable release or deploy historical salon sources.
