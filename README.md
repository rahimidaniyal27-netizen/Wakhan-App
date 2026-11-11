# Wakhan 0.2.10 beta

Music, cinema rooms and core chat/voice are free. This update fixes room keyboard overlays, navigation, seat layout, photo backgrounds and playback controls, and introduces a regional wallet storefront. Paid membership currently enables the implemented VIP badge and frame collection; proposed host scheduling/multiple-room features are not included.

The `polish-0210.yml` workflow builds an unsigned device IPA for Windows Sideloadly, compiles Android and packages one matching server upgrade. The server upgrade requires the actual deployed native 0.2.9 service, stages and tests real picture/audio/Range before cutover, and preserves the current ledger and original Android signing key. Archived source installers are build inputs, not installation steps.

Online payment adapters are disabled until the owner configures a verified merchant account. Only verified payment events can grant coins or membership; a checkout return cannot grant anything. StoreKit/Play Billing are not enabled. Real A13/iPhone audio, carrier and keyboard testing remains required.

See `server-update0210/README-fa.md` for the one-file installation and private merchant setup.
