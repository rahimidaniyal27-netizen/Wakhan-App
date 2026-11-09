# Standalone language support — N1

The native language catalog contains exactly 18 languages: Dari (Afghanistan),
Pashto, English, German, French, Spanish, Portuguese, Italian, Russian, Arabic,
Turkish, Urdu, Hindi, Bengali, Chinese, Japanese, Korean and Indonesian.

Android's preferred locale list is read by the permission-free WakhanLocale
plugin. The first supported preference wins, including region tags such as
de-DE, fa-AF and bn-BD. Unsupported languages fall back to English. The legacy
Indonesian `in` tag and Dari `prs` tag are accepted too.

Only an explicit Account language selection creates a persistent override.
Selecting Device language removes that override. Returning to the foreground
checks for device language changes when no manual override is active. This
preference stays separate from login credentials and theme choices.

Implemented coverage:

- All native sign-in, code verification, help, account linking and language
  controls have resources for all 18 languages.
- The native app language sheet uses the same catalog, with native language
  names and text-only radio rows. The sign-in page has no manual picker.
- Existing Dari, Pashto and English application resources remain in place.
  The existing 150-label shared app dictionaries cover the other languages;
  Bengali now has the same key coverage as the other 14 dictionaries.
- Right-to-left direction is preserved for Dari, Pashto, Arabic and Urdu.

The 150-label shared dictionary is not a complete translation audit of every
legacy page. Unmapped legacy strings can still appear in English. User names,
song titles and messages must not be translated as interface text.

Validation: 22 Node tests pass, including locale preference persistence,
all 18 sign-in resource sets and shared app dictionary key parity. The actual
71-script M81 bundle also initializes in a DOM adapter with H2/C2 enabled only
for native storage. These checks do not substitute for phone or browser tests.

This change packages the native client. It does not modify the running server,
enable unconfigured identity providers or publish a store release.
