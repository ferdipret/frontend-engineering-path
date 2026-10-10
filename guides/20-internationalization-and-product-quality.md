# Internationalisation and Product Quality: Guide

## Toolkit

### DevTools and tooling

**Locale and time zone emulation.** In Chrome DevTools open the **Sensors** drawer tab (Command Menu, type "Sensors"). The Location section lets you override the time zone ID and locale, which changes what `Intl` and `Date` report without touching your operating system. In Playwright set `locale` and `timezoneId` per project or per test, and run Node tests with `TZ=America/New_York` (and at least one zone with a non-hour offset, such as `Asia/Kolkata`). To see a page in right-to-left, edit the `<html>` element in the Elements panel and add `dir="rtl"`; it is the fastest RTL audit there is.

**Pseudo-localisation.** Generate a fake locale that accents every character, pads strings by 30 to 40 percent, and wraps them in brackets (`[Ŝéţţîñĝš one two]`). FormatJS's CLI can compile one with `--pseudo-locale`, and most i18n libraries or translation platforms have an equivalent. Untranslated strings, concatenation, and truncation become obvious in one pass.

**Message tooling.** The FormatJS CLI (`formatjs extract`, `formatjs compile`), `eslint-plugin-formatjs`, or your library's equivalent (i18next and Lingui both ship extractors) keep the catalogue in sync with the code. A lint rule against literal strings in JSX catches hard-coded text at review time.

**Network panel.** Use *Request blocking* to block your analytics, flag, and error-reporting hosts and confirm the app still works. Use throttling and "Offline" to see loading and error states. Filter by your analytics endpoint to read event payloads as they are sent; most analytics SDKs also have a debug mode or live event view.

**Application panel.** Inspect cookies and storage to verify nothing is written before consent, test the back/forward cache under *Background services > Back/forward cache*, and clear site data to see first-visit behaviour.

**Rendering tab.** Emulate `prefers-reduced-motion`, and use the *Layout Shift Regions* overlay to catch shifts from late-applied experiments or skeletons that do not match content.

**Error monitoring.** Your Sentry (or similar) project in a development environment, with source maps uploaded, so you can check that a deliberately thrown error arrives with a readable stack, release, and user context.

### Testing and verifying your work

**Internationalisation.** Unit-test message formatting at plural boundaries, not just "1 and 2": 0, 1, 2, 5, 11, 21, and 1.5 across English, a Slavic language, and Arabic exercise every CLDR category. Pin `locale` and `timeZone` explicitly in tests so results do not depend on the CI machine; avoid asserting exact `Intl` output strings where you can, because CLDR data changes between runtime versions (and note that formatted output contains non-breaking and narrow non-breaking spaces). Add CI checks that every key exists in every locale and that ICU syntax parses. Take Playwright screenshots of key screens in the pseudo-locale and in an RTL locale. Test date logic on DST transition days and at midnight boundaries.

**Analytics and experiments.** Validate events against the tracking plan's schema in tests and in development builds. For flags, test both states of every flag in CI, and test the failure mode: flag service unreachable, defaults applied. For experiments, check that assignment is stable for a user, that exposure is logged only when the variant is actually seen, and that group sizes match the intended split.

**Resilience.** Run the core journey with JavaScript disabled (DevTools Command Menu, "Disable JavaScript"), on "Slow 4G" with CPU throttling, and with third-party hosts blocked. Make each API call fail (block it, or mock a 500 and a timeout) and look at every view. Throw an error inside each major component and confirm only that region falls back, and that the error reaches your monitoring with a symbolicated stack.

**UX.** Walk the form with keyboard only and with a screen reader; submit it empty; press Back after a failed submit and after a successful one. Reload on every route and paste every URL into a new tab. Feed each component the content stress set: empty, one item, thousands, a 200-character unbroken string, a missing image, a negative and a huge number.

"Done" means the feature works in the second language, on a bad connection, with the flag off, and when the API fails, and that you have seen a real person use it.

### Tricks and gotchas

- Never build a sentence by concatenating translated fragments or by inserting a translated word into another message. Word order, agreement, and plural forms differ by language; translate whole messages with placeholders.
- `count === 1 ? singular : plural` is English-only. Russian, Polish, and Arabic need three to six forms; use ICU `plural`.
- A language is not a country. Do not use flags for a language picker, and write each language's name in that language ("Deutsch", "日本語").
- `new Date('2026-03-08')` is parsed as UTC midnight, but `new Date('2026-03-08T00:00')` is local time. West of Greenwich the first one displays as the previous day.
- A calendar date (a birthday, a due date) is not an instant. Store it as `YYYY-MM-DD` and never run it through a time zone conversion.
- Cache `Intl` formatters. Constructing `Intl.NumberFormat` or `Intl.DateTimeFormat` is expensive; calling `format` is cheap.
- Use `Intl.Segmenter` to count or truncate user-visible characters. `'👨‍👩‍👧'.length` is 8.
- Check `event.isComposing` before acting on Enter in any text input. For IME users, Enter confirms a candidate; it does not mean "send".
- Set `lang` on `<html>` and on any passage in another language. It drives hyphenation, font selection for Chinese versus Japanese, quotation marks, and screen reader pronunciation.
- Use `dir="auto"` or `<bdi>` around user-generated text so an Arabic name does not reorder the punctuation of an English sentence.
- Send analytics with `navigator.sendBeacon` or `fetch(..., { keepalive: true })` on `visibilitychange`, not in `unload`, which is unreliable on mobile and blocks the back/forward cache.
- Every feature flag is technical debt from the day it is created. Record an owner and a removal date in the same pull request.
- "Script error." with no stack in your monitoring means a cross-origin script loaded without `crossorigin="anonymous"` and CORS headers.
- Do not disable the submit button to signal an invalid form. Let people submit and tell them what to fix.
- A spinner that flashes for 80ms feels slower than no spinner. Delay indicators by a few hundred milliseconds.

### Official references

- [MDN: Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) - the built-in formatting, plural, collation, and segmentation APIs.
- [W3C Internationalization: techniques index](https://www.w3.org/International/techniques/authoring-html) - authoritative guidance on language tags, direction, and text handling in HTML and CSS.
- [Unicode CLDR](https://cldr.unicode.org/) - the locale data behind `Intl`: plural rules, date patterns, currency formats.
- [ICU user guide: Formatting messages](https://unicode-org.github.io/icu/userguide/format_parse/messages/) - the MessageFormat syntax reference.
- [FormatJS documentation](https://formatjs.github.io/docs/getting-started/installation) - react-intl, the extraction CLI, and `Intl` polyfills.
- [MDN: Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) - the modern date and time API, with time zone aware types.
- [Google Search Central: Localized versions of your pages](https://developers.google.com/search/docs/specialty/international/localized-versions) - the `hreflang` rules search engines apply.
- [OpenFeature documentation](https://openfeature.dev/docs/reference/intro) - the vendor-neutral feature flag API standard.
- [Sentry JavaScript documentation](https://docs.sentry.io/platforms/javascript/) - SDK setup, source maps, and enrichment.
- [web.dev: Baseline](https://web.dev/baseline) - the shared definition of which web features are safe to use.
- [React: Error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) - the official reference for containing render errors.
- [Resilient Web Design](https://resilientwebdesign.com/) - Jeremy Keith's short free book on building in layers.

## Skills

### i18n vs l10n

**Internationalisation** (i18n) is engineering work done once: making the product capable of adapting to any language and region without code changes. **Localisation** (l10n) is the work done per market: translating messages, choosing formats, adapting images, examples, legal text, and payment methods. Confusing the two leads teams to treat "going international" as "send the strings to translators", and then discover the code cannot accept what comes back.

What i18n covers in a front end: no user-visible text hard-coded in components; messages with placeholders and plural logic instead of concatenation; dates, numbers, and currencies formatted through `Intl` with an explicit locale; layout that survives longer text and right-to-left direction; fonts that cover the scripts; sorting and searching that respect language rules; locale-aware routing; and a build that can load one locale's catalogue at a time. It also covers what users type, not only what you display (see Locale-aware input).

A **locale** is more than a language. It is identified by a BCP 47 tag such as `en-GB`, `pt-BR`, `zh-Hant-TW`, or `sr-Latn`: language, optional script, optional region. `en-US` and `en-GB` share a language but differ in date order, spelling, and currency. Keep three things separate in your model, because users mix them: the UI language, the regional formats, and the time zone or currency. A German speaker living in the US may want German text, US dates, and dollars.

```js
const locale = new Intl.Locale('zh-Hant-TW');
locale.language; // 'zh'
locale.script;   // 'Hant'
locale.region;   // 'TW'
```

The cost argument is the important one: i18n is cheap when built in from the start and expensive to retrofit, because retrofitting means touching every component. Even a single-language product benefits, since the same work fixes plurals, formats, and layout robustness. The usual first failure after "we'll do it later" is the discovery of hundreds of concatenated sentences.

**Try it:** Take one screen of an app you have built and list everything on it that would have to change for German, Arabic, and Japanese users. Sort the list into "i18n (code change, once)" and "l10n (content, per locale)". Anything you cannot classify is worth discussing.

**Resources**
- [W3C: Localization vs. internationalization](https://www.w3.org/International/questions/qa-i18n)
- [W3C: Language tags in HTML and XML](https://www.w3.org/International/articles/language-tags/)
- [MDN: Intl.Locale](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale)

### Message extraction

Externalising strings means moving every user-visible message out of the code into a catalogue per locale, with the code referring to the message by an identifier. There are two schools.

**Explicit keys**: you invent a key and write the English in a JSON file.

```jsx
t('checkout.payButton') // en.json: { "checkout.payButton": "Pay now" }
```

Keys are stable when the wording changes, but the code no longer shows what the user reads, key names drift from their content, and unused keys accumulate. This is the common i18next style.

**Source text in code**: the default message lives at the call site and a tool extracts it.

```jsx
<FormattedMessage
  defaultMessage="Pay {amount}"
  description="Primary button on the checkout page; submits payment"
  values={{ amount }}
/>
```

```sh
formatjs extract "src/**/*.{ts,tsx}" --out-file lang/en.json \
  --id-interpolation-pattern "[sha512:contenthash:base64:6]"
```

The extractor finds messages by static analysis, generates an id from a hash of the content and description, and writes the source catalogue. Code stays readable, unused messages vanish on the next extraction, and changing the English produces a new id, which correctly marks the old translations as stale. FormatJS and Lingui work this way. The trade-off is that a typo fix in English invalidates every translation of that message unless your translation platform matches them back up.

Whichever you pick, the rules are the same. Messages must be statically analysable: `t('error.' + code)` defeats extraction and unused-key detection, so map codes to explicit messages instead. Every message needs **context for the translator**: a description saying where it appears and what the placeholders are, because "Post", "Save", or "Open" translate differently as nouns and verbs. Do not reuse one message in two places just because the English happens to match. Extract everything a user perceives, including `alt`, `aria-label`, `title`, `placeholder`, error messages, and emails. Enforce it with a lint rule against string literals in JSX, and run extraction in CI so the catalogue never lags the code.

**Try it:** Add FormatJS or your library's extractor to a small app. Externalise one screen, run extraction, and read the generated file as if you were the translator with no access to the UI. Add descriptions until every message is unambiguous.

**Resources**
- [FormatJS: Message extraction](https://formatjs.github.io/docs/getting-started/message-extraction)
- [FormatJS: Message declaration](https://formatjs.github.io/docs/getting-started/message-declaration)
- [i18next: Essentials of the translation function](https://www.i18next.com/translation-function/essentials)

### ICU MessageFormat

ICU MessageFormat is a small language inside the message string that lets the *translator* control grammar that depends on a value. The message is one complete sentence with arguments in braces:

```
{count, plural,
  =0 {No new messages}
  one {# new message}
  other {# new messages}
}
```

`plural` chooses a branch using the locale's CLDR plural rules, and `#` prints the number formatted for the locale. The categories are `zero`, `one`, `two`, `few`, `many`, and `other`; each language uses a subset. English uses `one` and `other`. Japanese uses only `other`. Russian uses `one`, `few`, `many`, and `other`: 1 файл, 2 файла, 5 файлов, and 21 is `one` again. Arabic uses all six. The category names are grammatical classes, not numbers: `one` in Russian matches 1, 21, 31. Use `=0` or `=1` for exact-value text. `other` is always required. `selectordinal` does the same for ordinals (1st, 2nd, 3rd).

`select` switches on a string value, which is how you handle gender or any enumerated case:

```
{gender, select,
  female {{name} updated her profile}
  male {{name} updated his profile}
  other {{name} updated their profile}
}
```

Why concatenation fails: `t('you_have') + ' ' + n + ' ' + t('items')` fixes the word order, gives the translator fragments with no context, and has no way to pick a plural form. Other languages put the number elsewhere, inflect the adjective and verb to agree with the noun, or change the whole sentence by gender. The rule is one message per complete sentence, with the branches wrapping the *whole* sentence, not a single word, so translators can restructure freely. The same applies to inserting a translated noun into another message ("Delete {thing}"): the article and case endings will be wrong in many languages, so write separate messages.

Practical details: an apostrophe quotes literal braces (`'{'`), nested arguments are allowed but keep nesting shallow, and rich text uses tags (`<b>…</b>`) mapped to components by the library. Unicode's MessageFormat 2 is a newer syntax that addresses ICU's limits; it is specified and gaining library support, but the ICU syntax above is what today's catalogues and translation platforms use.

**Try it:** Write a message for "{name} added N photo(s) to her/his/their album" with `select` and `plural`. Format it with `intl-messageformat` for counts 0, 1, 2, 5, and 21, in English and then in Russian or Polish (use a translation tool for a rough draft) and check which plural branch each count selects with `new Intl.PluralRules(locale).select(n)`.

**Resources**
- [ICU user guide: Formatting messages](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [FormatJS: ICU message syntax](https://formatjs.github.io/docs/core-concepts/icu-syntax)
- [Unicode CLDR: Language plural rules chart](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html)

### `Intl` formatting

The `Intl` namespace exposes Unicode CLDR locale data, so you never hand-write a date pattern or thousands separator. Every constructor takes a locale (or a fallback list) and options, and returns a reusable formatter.

```js
new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.5);
// '1.234,50 €'
new Intl.NumberFormat('en-IN').format(1234567);            // '12,34,567'
new Intl.NumberFormat('en', { notation: 'compact' }).format(1234567); // '1.2M'
new Intl.NumberFormat('en', { style: 'unit', unit: 'kilometer-per-hour' }).format(50);

new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' })
  .format(new Date('2026-03-04T12:00:00Z'));               // '4 Mar 2026'

new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-1, 'day'); // 'yesterday'
new Intl.ListFormat('en', { type: 'conjunction' }).format(['A', 'B', 'C']); // 'A, B, and C'
new Intl.PluralRules('ar').select(11);                     // 'many'

['z', 'ä', 'a'].sort(new Intl.Collator('de').compare);     // ['a', 'ä', 'z']
['z', 'ä', 'a'].sort(new Intl.Collator('sv').compare);     // ['a', 'z', 'ä']
```

Things the summary hides. **Currency** is data, not locale: the locale decides how to write an amount, but the currency code must come from your data, and formatting does not convert anything. Yen have no decimals and dinars have three; `Intl` knows. **Dates**: prefer `dateStyle`/`timeStyle` or component options over custom patterns, and do not assume order or separators. Use `formatRange` for intervals and `formatToParts` when you need to style a piece. **Collation**: the default `sort()` compares UTF-16 code units, putting "Z" before "a" and "ä" after "z". `Intl.Collator` sorts by language rules, and its options matter: `numeric: true` orders "item 2" before "item 10", and `sensitivity: 'base'` treats "a", "A", and "á" as equal for search. **Relative time** does not choose the unit for you; you compute "3 hours" versus "2 days". Also available: `Intl.DisplayNames` for names of languages, regions, and currencies, and `Intl.DurationFormat`. `Intl.Segmenter` has its own entry under Text segmentation.

Mistakes: calling `toLocaleString()` with no locale, which uses the *runtime's* locale and therefore mismatches between server and browser, causing hydration errors; constructing a formatter on every render instead of caching it; parsing formatted output back into numbers; and asserting exact strings in tests when the output contains non-breaking spaces and changes with CLDR versions.

**Try it:** In the console, format the same amount, date, and list of three names in `en-US`, `de-DE`, `ja-JP`, `ar-EG`, and `hi-IN`. Then sort a list of names containing accents, mixed case, and embedded numbers with plain `sort()` and with a collator using `numeric` and `sensitivity` options, and explain each difference.

**Resources**
- [MDN: Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
- [MDN: Intl.Collator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator)

### Time zones

Separate three concepts that `Date` blurs together. An **instant** is a point on the universal timeline ("the payment was captured"). A **wall-clock date-time** is what a calendar and clock show somewhere ("9:00 on 3 March"). A **time zone** is a set of rules, named by an IANA identifier such as `Europe/Paris`, that maps one to the other; an **offset** such as `+01:00` is just the result of those rules at one moment. Paris is `+01:00` in winter and `+02:00` in summer, so an offset is not a zone.

The standard practice: store and transmit instants in UTC as ISO 8601 (`2026-03-04T12:00:00Z`), and convert to the viewer's zone only when displaying.

```js
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. 'Europe/Paris'
new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: tz })
  .format(new Date('2026-03-04T12:00:00Z'));
```

"Store UTC" has two important exceptions. A **calendar date** with no time (a birthday, a hotel night) is not an instant: store `YYYY-MM-DD` and never convert it, or it shifts a day for users west of UTC. A **future local event** (a meeting at 09:00 in Berlin next year) should be stored as local date-time plus zone ID, because governments change DST rules and a precomputed UTC value would then be wrong.

DST creates two anomalies in each zone that observes it. On the spring-forward day one hour of wall time does not exist, and on the fall-back day one hour occurs twice. So a day is not always 24 hours: adding `24 * 60 * 60 * 1000` milliseconds to get "tomorrow at the same time" is wrong twice a year, and "midnight" may not exist on some dates in some zones. Do calendar arithmetic in calendar units, in the relevant zone.

`Date` can only do this in the browser's own zone. **Temporal** fixes the model with distinct types (`Instant`, `PlainDate`, `PlainDateTime`, `ZonedDateTime`):

```js
Temporal.ZonedDateTime.from('2026-03-07T12:00[America/New_York]').add({ days: 1 }).toString();
// '2026-03-08T12:00:00-04:00[America/New_York]' : same wall time, offset changed
```

Temporal ships in current Firefox and Chrome but is not yet in every major browser, so it is not Baseline; use a polyfill, or a library such as date-fns with its time zone companion or Luxon, until it is. Always let users see, and where it matters choose, the zone a time is shown in.

**Try it:** Use the DevTools Sensors tab to set the time zone to `America/New_York`. Take `2026-03-07T12:00` local, add 24 hours in milliseconds with `Date`, and format the result; then do the "add one day" with Temporal or a polyfill and compare. Next, log `new Date('2026-03-08')` and `new Date('2026-03-08T00:00')` and explain the difference.

**Resources**
- [MDN: Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)
- [MDN: Temporal.ZonedDateTime](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime)
- [W3C: Working with time and time zones](https://www.w3.org/TR/timezone/)

### Right-to-left

Arabic, Hebrew, Persian, and Urdu are written right to left, and an interface for them is mirrored: the sidebar moves to the right, text aligns right, and "forward" points left. The foundation is one attribute:

```html
<html lang="ar" dir="rtl">
```

`dir` sets the base direction, which flips the inline axis for block layout, flexbox, grid, and tables, and resolves how the Unicode bidirectional algorithm orders mixed text. Set it in HTML, not with the CSS `direction` property, because direction is part of the content's meaning and must survive without styles.

Then write CSS that never says left or right. **Logical properties** refer to the start and end of the inline axis and follow the direction automatically:

```css
.card {
  margin-inline-start: 1rem;      /* not margin-left */
  padding-inline: 1rem 2rem;
  border-inline-end: 1px solid;
  inset-inline-start: 0;          /* not left: 0 */
  text-align: start;              /* not left */
  border-start-start-radius: 8px;
}
```

Flexbox and grid already use logical order, so a row of items reverses with no changes. What does not flip automatically: `transform: translateX()`, physical values you forgot, background positions, `box-shadow` offsets, and anything computed in JavaScript from `left` or `clientX` (sliders, drag logic, carousels, scroll positions, where `scrollLeft` runs negative in RTL). Use the `:dir(rtl)` pseudo-class for the exceptions.

Mirroring is about direction of reading, not a blind flip. Mirror icons that imply direction or progression: back and forward arrows, chevrons, a "send" icon, progress bars. Do not mirror media playback controls (they represent tape direction), clocks, checkmarks, logos, or slashes. Numbers run left to right even inside RTL text, as do phone numbers and Latin-script words.

Mixed-direction text needs isolation. A username or product name in another script, inserted into a sentence, can drag neighbouring punctuation and numbers to the wrong side. Wrap inserted values in `<bdi>` or give user-generated content `dir="auto"`, which picks direction from the first strong character. Inputs for email addresses, URLs, and code should stay `dir="ltr"`.

Test with real Arabic or Hebrew text, since a mirrored English page hides bidi bugs.

**Try it:** Add `dir="rtl"` to the `<html>` element of a site you built and list everything that looks wrong. Convert the physical properties to logical ones until both directions are correct with the same CSS. Then render "User [Arabic name] posted 3 comments" with and without `<bdi>` around the name.

**Resources**
- [W3C: Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir)
- [MDN: CSS logical properties and values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)
- [RTL Styling 101 by Ahmad Shadeed](https://rtlstyling.com/posts/rtl-styling)

### Text expansion

English is compact. Translated into German, Finnish, Russian, or French, UI text typically grows by 30 to 40 percent, and the shorter the string the worse it gets: a five-letter label can double or triple ("Edit" becomes "Bearbeiten", "Save" becomes "Speichern"). German and Finnish also form long compound words with no break opportunities. A layout that fits its English text exactly is broken in most other languages.

Design rules that make layouts survive:

- Let content size the container. Avoid fixed widths and heights on anything containing text; use `min-width`, padding, and intrinsic sizing.
- Let text wrap. Buttons, tabs, table headers, and form labels must tolerate two lines. Flex and grid children need `min-width: 0` to be able to shrink, and long compounds need `overflow-wrap: anywhere` or `hyphens: auto` (which requires a correct `lang`).
- Put labels above inputs, not beside them, so label length cannot squeeze the field.
- Treat truncation with an ellipsis as a last resort, and never for essential information. If you do truncate, the full text must be reachable.
- Never embed text in images.

CJK languages bring different concerns rather than more width. Chinese, Japanese, and Korean are often *shorter* in character count, but the characters are wider, denser, and need more line height and usually a slightly larger size to stay legible. There are no spaces between words in Chinese and Japanese, so lines break between almost any two characters, subject to rules about which punctuation may start or end a line. Control this with `line-break` and `word-break` (`word-break: keep-all` stops Korean breaking mid-word), and do not apply `text-transform: uppercase`, italics, or letter-spacing designed for Latin text; they are meaningless or harmful in these scripts. Thai, Arabic, and Devanagari have tall stacked marks that tight `line-height` clips.

Character counts are not width either; see the Text segmentation entry for counting and truncating correctly.

The working technique is **pseudo-localisation**: run the UI in a generated locale that expands every string by 40 percent with accented characters. Every hard-coded string, clipped button, and overflowing header shows up before any real translation exists.

**Try it:** Take a navigation bar, a button group, and a data table from one of your projects. Replace each label with its German translation, then with a 40 percent longer pseudo-localised version, at a 320px viewport. Fix every overflow without truncating and without changing the English appearance.

**Resources**
- [W3C: Text size in translation](https://www.w3.org/International/articles/article-text-size)
- [MDN: line-break](https://developer.mozilla.org/en-US/docs/Web/CSS/line-break)
- [MDN: overflow-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap)

### Text segmentation

What a user calls "a character" is a **grapheme cluster**, and it does not correspond to anything a JavaScript string exposes directly. A string is a sequence of UTF-16 code units; a code point above U+FFFF takes two of them; and one visible character may be several code points: a letter plus combining accents, an emoji plus a skin-tone modifier, a flag (two regional indicators), or a family emoji joined with zero-width joiners.

```js
'🇯🇵'.length;        // 4 code units
[...'🇯🇵'].length;   // 2 code points
const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });
[...graphemes.segment('🇯🇵')].length; // 1
```

Anything that cuts or counts by `length`, `slice`, or `split('')` can therefore cut a character in half, leaving a broken glyph or changing its meaning. `Intl.Segmenter` implements the Unicode segmentation rules at three granularities. Truncating safely:

```js
function truncate(text, max) {
  let out = '';
  let count = 0;
  for (const { segment } of graphemes.segment(text)) {
    if (count === max) return out + '…';
    out += segment;
    count++;
  }
  return out;
}
truncate('👩🏽‍💻 Ada Lovelace', 5); // '👩🏽‍💻 Ada…'  (slice(0, 5) returns a broken emoji)
```

**Word** granularity matters because many languages do not put spaces between words. `text.split(' ')` gives one "word" for a Japanese, Chinese, or Thai sentence; the segmenter uses dictionaries:

```js
const words = new Intl.Segmenter('ja', { granularity: 'word' });
[...words.segment('吾輩は猫である。')].filter((s) => s.isWordLike).map((s) => s.segment);
// ['吾輩', 'は', '猫', 'で', 'ある']
```

`isWordLike` filters out spaces and punctuation, which gives you word counts, search-term highlighting, and reading-time estimates that work across languages. `segments.containing(index)` returns the segment at a string offset, for "select the word under the cursor". **Sentence** granularity splits on sentence boundaries without being fooled by every full stop, useful for excerpts.

Where it fits and where it does not. Use it for counters ("12/280"), truncation in JavaScript, initials for avatars, and caret movement in custom editors. For **wrapping**, let CSS do the work: the browser already breaks lines by language rules given a correct `lang`, with `overflow-wrap`, `word-break`, `line-break`, and `hyphens` as controls, and `text-overflow` or `line-clamp` truncate visually without cutting characters. Do not insert break opportunities by hand unless you are laying out text on a canvas.

Pitfalls: the HTML `maxlength` attribute counts UTF-16 code units, databases count bytes or code points, and your counter may count graphemes, so decide on one definition, state it, and enforce the same one on the server. Compare and deduplicate text after `normalize('NFC')`, since "é" can be one code point or two. Segmenters are expensive to construct, so create them once and reuse them. `Intl.Segmenter` is Baseline (newly available since 2024) and present in Node, so check it against your support policy before relying on it without a fallback.

**Try it:** Build a character counter for a text area that shows `length`, code points, and graphemes side by side. Type an accented letter, a flag, a skin-toned emoji, and a family emoji, and watch the three numbers diverge. Then add a word count that is correct for both an English and a Japanese sentence.

**Resources**
- [MDN: Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)
- [Unicode Standard Annex #29: Unicode Text Segmentation](https://www.unicode.org/reports/tr29/)
- [MDN: word-break](https://developer.mozilla.org/en-US/docs/Web/CSS/word-break)

### Locale-aware input

Output formatting is handled by `Intl`. Input is harder, because users type in their own conventions and there is no built-in parser. Most international input bugs come from validation that encodes one country's assumptions.

**Names.** People have one name, four names, family name first, no family name, names with apostrophes, hyphens, spaces, and non-Latin scripts. Prefer a single "Full name" field, plus "What should we call you?" if you need a short form. Do not split on spaces, force capitalisation, reject characters, or set short limits.

**Addresses.** Ask for the country first and adapt the form to it: not every country has postcodes, states, or house numbers, and the order of parts differs. Keep free-form address lines, validate postcodes only against the selected country's format, and never require a "state". Add `autocomplete` tokens (`address-line1`, `postal-code`, `country`) so browsers can fill the form.

**Phone numbers.** Use `type="tel"` with `autocomplete="tel"`, accept spaces, dashes, brackets, and a leading `+`, and normalise to E.164 (`+447911123456`) for storage. Validate with [libphonenumber](https://github.com/google/libphonenumber) or a port of it, never with a hand-written pattern.

**Numbers.** Half the world writes the decimal separator as a comma. `type="number"` handles this inconsistently across browsers and locales, silently yields an empty value for input it rejects, and changes on scroll. For amounts, use a text input with `inputmode="decimal"` and parse against the active locale's separators:

```js
function parseLocaleNumber(text, locale) {
  const parts = new Intl.NumberFormat(locale).formatToParts(-12345.6);
  const group = parts.find((p) => p.type === 'group').value;
  const decimal = parts.find((p) => p.type === 'decimal').value;
  const normalised = text.replace(/\s/g, '').replaceAll(group, '').replace(decimal, '.');
  return /^-?\d+(\.\d+)?$/.test(normalised) ? Number(normalised) : NaN;
}
parseLocaleNumber('1.234,5', 'de-DE'); // 1234.5
```

This is strict to one locale by design: "1,5" means 1.5 to a German and is read as 15 under `en-US`. Echo the parsed value back formatted, so a misreading is visible before submission.

**Dates.** "03/04/2026" is March or April depending on the reader. Use `<input type="date">`, which displays in the browser's locale and always submits `YYYY-MM-DD`, or separate labelled day, month, and year fields. For custom pickers, the first day of the week and the calendar system vary by locale. Never parse free-text dates with `new Date(string)`.

**IME composition.** Chinese, Japanese, Korean, and many other users type through an input method editor: keystrokes build a provisional string, the user picks a candidate, and Enter *confirms the candidate*. The browser fires `compositionstart`, `compositionupdate`, and `compositionend` around this, and key events during it have `isComposing` set.

```js
input.addEventListener('keydown', (e) => {
  if (e.isComposing || e.keyCode === 229) return; // still composing; Enter is not "submit"
  if (e.key === 'Enter') send();
});
```

The `keyCode === 229` check covers Safari, which fires the confirming `keydown` after `compositionend`. The classic bugs are a chat box that sends a half-typed message when the user confirms a candidate, and inputs that reformat, filter, or enforce a length limit on every `input` event, which destroys the provisional text. Defer formatting, validation, and search-as-you-type requests until `compositionend`.

**Try it:** Add a Japanese or Chinese input method in your operating system settings (no language knowledge needed: type "nihon", press Space, then Enter). Try it in a chat-style input you built that submits on Enter and in a field that formats as you type, and fix what breaks. Then enter "1.234,5" and "1,234.5" in an amount field under a German and a US locale.

**Resources**
- [W3C: Personal names around the world](https://www.w3.org/International/questions/qa-personal-names)
- [MDN: Element compositionstart event](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionstart_event)
- [MDN: HTML autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)

### Locale routing and detection

Each language version of a page needs its own URL. Search engines index URLs, users share them, and caches key on them; a site that swaps language based on a cookie or header at a single URL gets one language indexed and serves the wrong one from cache. The three URL patterns are a path prefix (`example.com/de/preise`), a subdomain (`de.example.com`), and a country domain (`example.de`). Path prefixes are the simplest to operate and the default in most frameworks.

**Detection** is only for the first visit to a URL with no locale. The priority order: an explicit choice the user made earlier (stored in a cookie), then the `Accept-Language` request header, then a default. `Accept-Language` is an ordered list with weights:

```
Accept-Language: fr-CH, fr;q=0.9, en;q=0.8
```

Match it against your supported locales with a proper algorithm rather than string equality, so `fr-CH` falls back to `fr`. `@formatjs/intl-localematcher` implements the standard matching, and `navigator.languages` is the client-side equivalent. Do not detect language from IP address: location tells you where someone is, not what they read. Redirect only from the locale-less root, never away from an explicit locale URL, and if the response varies by header send `Vary: Accept-Language`. Always provide a visible language switcher that links to the *same page* in the other language and remembers the choice.

**`hreflang`** tells search engines that pages are translations of each other, so they show the right one per user:

```html
<link rel="alternate" hreflang="en" href="https://example.com/en/pricing" />
<link rel="alternate" hreflang="de" href="https://example.com/de/preise" />
<link rel="alternate" hreflang="x-default" href="https://example.com/pricing" />
```

The rules that get broken: annotations must be reciprocal (every version lists every version, including itself), URLs must be absolute, codes are language with optional region (`en-GB`, never `uk` for the United Kingdom), and `x-default` names the fallback. Large sites put the same data in the sitemap instead. Each page should also carry a self-referencing canonical URL and the correct `<html lang>`.

In the app, the locale should be a route parameter that drives which message catalogue is loaded (code-split per locale) and what `lang` and `dir` the document gets, on the server as well as the client. Localised slugs are good for users and SEO but need a mapping so the switcher can find the equivalent page.

**Try it:** Send requests to a locale-aware site (or your own) with `curl -H "Accept-Language: de"` and then `ja`, and observe the redirect and `Vary` header. View source on a multilingual documentation site and check whether its `hreflang` set is reciprocal and includes `x-default`.

**Resources**
- [Google Search Central: Localized versions of your pages](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [MDN: Accept-Language](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Language)
- [Next.js: Internationalization guide](https://nextjs.org/docs/app/guides/internationalization)

### Fonts and scripts

A font contains glyphs for a limited set of characters. When text needs a character the font lacks, the browser walks the `font-family` list and then system fonts looking for one that has it, per character. If nothing does, the user sees an empty box ("tofu"). Your brand font almost certainly covers Latin and perhaps Cyrillic and Greek, and nothing else, so every other script is rendered by a fallback you chose or by whatever the system picks.

Plan the fallback stack per script. For most products the right answer for non-Latin scripts is the platform's own fonts, which are well hinted and cost nothing to download:

```css
:root { font-family: "Brand Sans", system-ui, sans-serif; }
:lang(ja) { font-family: "Brand Sans", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; }
:lang(ar) { font-family: "Brand Sans", "Noto Naskh Arabic", "Geeza Pro", "Segoe UI", sans-serif; line-height: 1.8; }
```

When you must ship a web font for another script, size is the issue: a CJK font has tens of thousands of glyphs and weighs several megabytes. The technique is **subsetting with `unicode-range`**: split the font into many small files, each declaring which code points it covers, and the browser downloads only the files whose range appears on the page. Google Fonts serves CJK fonts this way in around a hundred slices.

```css
@font-face {
  font-family: "Brand Sans";
  src: url("/fonts/brand-cyrillic.woff2") format("woff2");
  unicode-range: U+0400-045F, U+0490-0491, U+2116;
  font-display: swap;
}
```

The `lang` attribute matters for rendering, not only for accessibility. Chinese, Japanese, and Korean share Unicode code points for Han characters whose preferred shapes differ by language (Han unification); the browser picks a language-appropriate font only if it knows the language. Untagged Japanese text can render with Chinese glyph forms, which readers notice immediately.

Typography that works for Latin harms other scripts. Arabic is cursive: `letter-spacing` breaks the joins. CJK has no italics (browsers synthesise an ugly slant; control it with `font-synthesis`) and no upper case. Thai, Devanagari, Arabic, and Vietnamese diacritics need more line height. Many scripts read as small at a size comfortable for Latin; test real text at your body size. Mixed stacks also produce mismatched weights and x-heights, which `size-adjust` in `@font-face` can reduce.

**Try it:** Put a paragraph of Japanese, Arabic, Hindi, and Thai on a page using your usual font stack. In the Elements panel's Computed tab, read the "Rendered Fonts" section to see which font actually drew each run. Then change the Japanese paragraph's `lang` between `ja` and `zh-Hans` and look for glyph differences in characters such as 直 or 骨.

**Resources**
- [MDN: unicode-range](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/unicode-range)
- [W3C: Styling using language attributes](https://www.w3.org/International/questions/qa-css-lang)
- [web.dev: Best practices for fonts](https://web.dev/articles/font-best-practices)

### Translation workflow

Translation is a continuous pipeline, not a hand-off. Strings change with every release, and the workflow has to keep dozens of locale files consistent with the code without anyone emailing spreadsheets.

A **TMS** (translation management system: Crowdin, Lokalise, Phrase, Transifex, Weblate, and others) is the hub. It gives translators an editor with context, a **translation memory** that reuses earlier translations of identical or similar text, a **glossary** to keep terms consistent, review and approval states, screenshots, machine-translation pre-fill, and an API and CLI for automation.

A workable loop:

1. Developers write messages in the source language, with descriptions, in code.
2. CI extracts the source catalogue on every merge to the main branch and pushes it to the TMS.
3. The TMS diffs it: new strings are queued for translation, changed strings are flagged, removed strings are retired.
4. Translators work in the TMS, with screenshots and descriptions for context.
5. The TMS opens a pull request with updated locale files (or CI pulls them on a schedule).
6. CI validates and the build compiles the catalogues.

The source of truth must be unambiguous: the source language lives in the repository, translations live in the TMS, and nobody hand-edits translated files in the repo, or the next sync overwrites the change.

What makes it robust: a **fallback chain** so an untranslated message shows the source language instead of a key or a blank (`pt-BR` to `pt` to `en`), which lets you release without waiting for every locale. CI checks that fail the build on invalid ICU syntax, on placeholders that do not match the source, and optionally on missing keys for launch-critical locales. Stable message ids, so fixing a typo does not discard twenty translations. A way to handle feature branches, which most platforms support through branching or by tagging strings. And pseudo-localisation in development, so untranslatable UI is caught before strings are sent.

Delivery is a design decision too. Bundling catalogues at build time is simple and versioned with the code. Loading them at runtime from a CDN (sometimes called over-the-air) lets translations ship without a deploy but adds a network dependency and a versioning problem. Either way, load only the active locale. Budget for quality: in-context review by a native speaker catches what a string list cannot, such as truncation and wrong tone.

**Try it:** Connect a small repository to a TMS with a free tier (Crowdin and Weblate both offer one for open-source projects). Push the source catalogue from the CLI, translate three strings in the web editor, pull them back, and then change one source string and observe how the platform marks its translations.

**Resources**
- [FormatJS: Message distribution](https://formatjs.github.io/docs/getting-started/message-distribution)
- [Crowdin: GitHub integration](https://support.crowdin.com/github-integration/)
- [Weblate documentation: Continuous localization](https://docs.weblate.org/en/latest/admin/continuous.html)

### Event tracking

An analytics event is a record that something happened: a name, a timestamp, who (a user or anonymous id), and properties describing the context. The engineering problem is consistency. Without a design, the same action ends up as `signup`, `Sign Up`, `user_signed_up`, and `SignupCompleted` from four teams, and no query can be trusted.

A **taxonomy** fixes the vocabulary. Common conventions:

- **Names** follow one grammar and one casing, typically object then past-tense action: `Order Completed`, `Search Performed`, `Invite Sent`. Name the user's action or the business fact, not the UI element; `Blue Button Clicked` dies with the next redesign.
- **Keep names few and put variation in properties.** One `Product Viewed` event with `product_id` and `source`, not `Homepage Product Viewed` and `Search Product Viewed`.
- **Properties** have fixed names, types, and allowed values (`plan: 'free' | 'pro'`), in one casing, with units in the name (`duration_ms`).
- **Global context** is attached automatically: app version, platform, locale, route, experiment assignments.

Write it down in a **tracking plan**: every event, why it exists (what decision it informs), when exactly it fires, its properties, and an owner. Then make the plan executable so the code cannot drift from it:

```ts
type Events = {
  'Order Completed': { order_id: string; total_minor: number; currency: string; item_count: number };
  'Search Performed': { query_length: number; result_count: number };
};

export function track<K extends keyof Events>(name: K, props: Events[K]) {
  analytics.track(name, props);
}
```

All calls go through this one wrapper, which also centralises consent checks, vendor choice, and development-time validation.

Judgement calls matter more than syntax. Track outcomes over interactions: `Order Completed` confirmed by the server is worth more than a click on "Pay", which may have failed. Critical business events are best emitted server-side, where ad blockers and closed tabs cannot lose them. Do not put personal data in properties (a search query can contain a name or an address; record its length, not its text), and do not track everything "just in case": each event is a maintenance cost and a privacy liability. Version or rename deliberately when meaning changes, because a silently redefined event corrupts every historical comparison.

**Try it:** Write a tracking plan for a sign-up and checkout flow: at most eight events, each with a one-line purpose, a precise trigger, and typed properties. Implement the typed `track` wrapper, log events to the console, and walk the flow to check that every event fires exactly once at the moment the plan says.

**Resources**
- [Google Analytics: Set up events](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [PostHog docs: Capturing events](https://posthog.com/docs/product-analytics/capture-events)
- [Amplitude docs: Data planning playbook](https://amplitude.com/docs/data/data-planning-playbook)

### Product analytics

Product analytics tools (Amplitude, Mixpanel, PostHog, and GA4 in part) answer questions about behaviour across users and time, built from your events. You need to know what each analysis actually computes, because the defaults embed assumptions.

A **funnel** measures how many users complete an ordered sequence of events. Its result depends on settings people overlook: the **conversion window** (must the steps happen within an hour, a session, thirty days?), whether steps must be strictly consecutive or may have other events between them, and whether it counts unique users or total attempts. Two people can produce different conversion rates from the same data by choosing different windows. A drop at a step tells you where, never why; pair it with session replay or usability testing.

**Retention** measures whether users come back. A cohort is a group who did a starting event in a period (signed up in week 1); the chart shows the share who did a return event in each later period. "N-day" retention counts users active exactly on day N; "unbounded" or rolling retention counts users active on day N or any later day, and always looks better. Choose the return event carefully: "opened the app" flatters, "did the core action" informs. A retention curve that flattens means you have a durable core; one that decays to zero means you do not, whatever the sign-up numbers say.

Other standard views: **segmentation** (break a metric down by property), **paths** (what users do before or after an event), and **stickiness** (how many days per week users are active).

Know what the numbers are made of. A "user" is an identifier: an anonymous id in a cookie or local storage until login, then merged with a user id by an `identify` call. Cleared storage, multiple devices, and private windows inflate user counts. A "session" is a tool-defined construct, usually ended by 30 minutes of inactivity. Client-side tracking is blocked by a substantial share of browsers and extensions, so absolute numbers undercount and you should trust trends and ratios more than totals. Bots, internal staff, and test accounts need filtering. Send events reliably with `sendBeacon` or `keepalive` on page hide.

Use the data to make decisions: define a small set of metrics tied to user value before launch, and write down what result would change your plan.

**Try it:** In a product analytics tool with a free tier or public demo project, build a three-step funnel. Change the conversion window from one hour to seven days and record how the rate changes. Then build a retention chart and switch between N-day and unbounded retention, and explain the gap in one sentence.

**Resources**
- [PostHog docs: Funnels](https://posthog.com/docs/product-analytics/funnels)
- [PostHog docs: Retention](https://posthog.com/docs/product-analytics/retention)
- [MDN: Navigator.sendBeacon()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)

### Feature flags

A feature flag is a runtime condition that decides whether a code path is active. Its value is separating **deploy** (code reaches production) from **release** (users get the feature). That enables trunk-based development with unfinished work merged but dark, testing in production with internal users, gradual rollouts, and turning a broken feature off in seconds without a rollback.

Flags come in kinds with different lifetimes, and mixing them up causes most flag mess:

- **Release flags**: hide unfinished or newly launched work. Short-lived; removed once fully rolled out.
- **Experiment flags**: assign users to variants for an A/B test. Live for the length of the test.
- **Ops flags** (kill switches): let you disable an expensive or risky subsystem under load. Long-lived by design.
- **Permission flags**: gate features by plan or entitlement. Long-lived, and arguably belong in your entitlement system.

Evaluation takes a flag key, a **context** (user id, plan, country, app version), and a **default**, and applies targeting rules. A percentage rollout hashes a stable id with the flag key into a bucket, so a user stays in the same group on every visit and raising 5 percent to 20 percent only adds users.

```ts
const client = OpenFeature.getClient();
const newCheckout = client.getBooleanValue('new-checkout', false);
```

OpenFeature is the vendor-neutral API; providers exist for LaunchDarkly, Unleash, Flagsmith, PostHog, and others. The default argument is what users get when the flag service is unreachable, so it must be the safe behaviour, and your app must render without waiting indefinitely for flags.

Front-end specifics: a flag in client code hides UI, it does not secure anything. The server must enforce access, and unreleased code and flag names ship in the bundle unless you code-split behind the flag. Evaluate on the server, or bootstrap flag values into the initial HTML, to avoid a flash of the old UI. Keep evaluation at as few decision points as possible rather than scattering `if` statements.

**Clean-up** is the part teams skip. Every flag doubles the states to test, and stale flags have caused serious outages when someone reused or flipped one that guarded dead code. Give each flag an owner and an expiry date when you create it, open the removal ticket at the same time, delete the losing branch and the flag once the rollout reaches 100 percent, and audit regularly.

**Try it:** Add a boolean flag to an app through OpenFeature's in-memory provider. Implement a percentage rollout by hashing a user id, and verify that the same user gets the same answer across reloads and that raising the percentage never removes anyone. Then delete the flag and its dead branch, and count the files you touched.

**Resources**
- [Martin Fowler: Feature Toggles (Pete Hodgson)](https://martinfowler.com/articles/feature-toggles.html)
- [OpenFeature: Introduction](https://openfeature.dev/docs/reference/intro)
- [Unleash docs: Feature flag best practices](https://docs.getunleash.io/topics/feature-flags/feature-flag-best-practices)

### A/B testing

An A/B test randomly splits users between a control and one or more variants, measures a metric for each group, and uses statistics to judge whether the difference is real. Randomisation is what makes it causal: the groups differ only in the change you made. The front end owns three parts where experiments commonly go wrong.

**Assignment** must be random across users and sticky per user. Hash a stable unit id together with the experiment key:

```js
const bucket = hash(`${experimentKey}:${userId}`) % 100; // deterministic, no storage needed
const variant = bucket < 50 ? 'control' : 'treatment';
```

Including the experiment key gives each experiment an independent split. Choose the unit deliberately: a logged-in user id is consistent across devices; an anonymous cookie id is not, and changes at login unless you carry it over.

**Exposure** is the event that says "this user actually encountered the difference". Log it at the moment the variant is rendered, not at assignment. If you change the checkout page but count every assigned visitor, the many who never reached checkout dilute the effect toward zero. Log it once per user per experiment, and analyse only exposed users.

**Flicker and layout shift.** Client-side testing tools that fetch a configuration and then rewrite the DOM show the original content first, then swap it: a visible flash, a layout shift that hurts CLS, and a biased experiment because the variant is slower. The "anti-flicker" snippet that hides the page until the tool loads trades that for a blank screen and worse LCP. The real fixes: decide the variant on the server or at the CDN edge and render the right HTML first time, or bootstrap assignments into the initial HTML so the first client render is already correct. Keep cached pages correct by varying on the assignment cookie at the edge. If a client-side swap is unavoidable, reserve the space.

Statistical hygiene you are expected to know: fix the primary metric and sample size before starting; do not stop the moment the result looks significant (peeking inflates false positives unless the tool uses sequential methods); run whole weeks to cover weekday cycles; watch guardrail metrics such as errors and performance; and check for **sample ratio mismatch**, where a 50/50 test shows 52/48, which signals a bug in assignment or exposure logging and invalidates the result.

**Try it:** Implement deterministic assignment with a string hash, run it over 10,000 generated user ids, and check the split is close to 50/50 and that a second experiment key gives an uncorrelated split. Then render a variant from a client-side fetch with a 300ms delay and record the layout shift in the Performance panel, and fix it by bootstrapping the assignment into the HTML.

**Resources**
- [web.dev: Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [GrowthBook docs: Experimentation problems (peeking, SRM, and more)](https://docs.growthbook.io/using/experimentation-problems)
- [PostHog docs: Experiments](https://posthog.com/docs/experiments)

### Privacy-respecting measurement

Measurement is constrained by law and by respect for users. In the EU and UK two regimes apply together. The ePrivacy rules require **consent before storing or reading anything on the device that is not strictly necessary** for the service the user asked for; that covers cookies, `localStorage`, and similar identifiers used for analytics or advertising. GDPR governs processing of personal data, which includes online identifiers and IP addresses, and requires a lawful basis, minimisation, and honouring user rights. Other jurisdictions (California and several other US states, Brazil, and more) add opt-out rights. This is engineering guidance, not legal advice: your organisation's privacy counsel decides the policy, and you implement it faithfully.

**Consent** in practice: nothing non-essential runs before a choice. That means the analytics script is not *loaded*, not merely "configured to wait". Rejecting must be as easy as accepting, the choice must be stored and revocable, and consent is per purpose (analytics separately from advertising). Build a small consent module that every tracking call goes through:

```js
export function track(name, props) {
  if (!consent.has('analytics')) return;
  analytics.track(name, props);
}
```

Tools such as Google's consent mode adjust tag behaviour from consent signals; understand what they still send when consent is denied. Honour the Global Privacy Control signal (`navigator.globalPrivacyControl`, sent as the `Sec-GPC` header) where the law treats it as an opt-out.

**Anonymisation and minimisation.** True anonymisation is hard; most "anonymous" data is pseudonymous and still personal data. Reduce what you hold: do not send names, emails, or free-text input in event properties; scrub URLs and referrers of tokens and ids before sending; truncate or drop IP addresses; mask inputs in session replay by default; coarsen values (country instead of city, bucketed amounts); and set retention limits. Aggregate, cookieless analytics (Plausible, Fathom, and self-hosted options) answer most traffic questions with no persistent identifier at all.

**Sampling** means recording a fraction of events or sessions. It cuts cost and data held, and for high-volume telemetry (performance traces, session replay) a 5 to 10 percent sample is statistically plenty. Sample by session or user, not per event, so journeys stay intact, and record the sample rate so counts can be scaled back. Never sample rare, critical events such as purchases or errors you need to count.

Consented data is incomplete data. Expect and accept undercounting, and prefer server-side facts for business metrics.

**Try it:** Open a site you work on in a fresh private window with the Network and Application panels open. Before interacting with any consent banner, list every third-party request and every cookie or storage entry. Then reject all, reload, and repeat. Anything non-essential present in either list is a defect.

**Resources**
- [MDN: Navigator.globalPrivacyControl](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/globalPrivacyControl)
- [ICO: Guidance on cookies and similar technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/)
- [Google tag platform: Consent mode](https://developers.google.com/tag-platform/security/guides/consent)

### Progressive enhancement

Progressive enhancement builds in layers: content and core function in HTML, presentation in CSS, and richer behaviour in JavaScript, each layer improving on the one below without being required by it. The reason is the layers' failure behaviour. HTML and CSS are fault tolerant: an unknown element or property is skipped and the rest works. JavaScript is not: one uncaught error, one failed chunk, or one unsupported API can stop everything after it.

"Users without JavaScript" is the wrong mental picture. Almost nobody turns it off; the real cases are everyone *before the script has loaded* on a slow connection, plus requests where it never arrives or never runs: a CDN outage, a flaky train connection, a corporate proxy or content blocker stripping a bundle, a browser extension throwing, an older browser hitting a syntax error. A server-rendered page that needs 4 seconds of JavaScript before a button works is broken for those 4 seconds for everyone.

The practice is to make the core journey work with the baseline, then enhance:

```html
<form action="/search" method="get">
  <label for="q">Search</label>
  <input id="q" name="q" type="search" required />
  <button>Search</button>
</form>
```

That form works with no script. JavaScript can then intercept `submit` to fetch results inline, add suggestions, and update the URL. Links are real `<a href>`, not click handlers on a `<div>`. Disclosure uses `<details>`, dialogs use `<dialog>` or popover, and validation starts with HTML constraints. Enhance behind feature detection so unsupported browsers keep the baseline.

Modern frameworks support this if you let them. Server rendering sends usable HTML; forms wired to server actions (React's `<form action>`, and the form primitives in Next.js, Remix/React Router, and SvelteKit) submit before hydration and are enhanced after. The discipline is to check that things rendered on the server actually *do* something before hydration, and not ship a page of buttons that are inert until the bundle arrives.

It is not all-or-nothing. Decide which flows are core (read the content, sign in, search, buy) and guarantee those. A drawing tool or a spreadsheet legitimately requires JavaScript, and then the baseline is a clear message and a way to get help. The pay-off goes beyond resilience: the baseline is faster, more accessible, and easier to test.

**Try it:** Disable JavaScript in DevTools (Command Menu, "Disable JavaScript") and attempt the core journey of a site you built. Then re-enable it, throttle to "Slow 4G", reload, and try to use the page during the first seconds. List what was unusable and decide which items belong to the core.

**Resources**
- [Resilient Web Design by Jeremy Keith](https://resilientwebdesign.com/)
- [GOV.UK Service Manual: Building a resilient frontend using progressive enhancement](https://www.gov.uk/service-manual/technology/using-progressive-enhancement)
- [React: form (actions and progressive enhancement)](https://react.dev/reference/react-dom/components/form)

### Graceful degradation

Graceful degradation is the complementary view: you built the full experience, and now you make sure each thing that can be missing takes away only itself. Go through the dependencies one category at a time.

**Missing platform features.** Detect before use and provide a path for both outcomes.

```js
if ('share' in navigator) {
  shareButton.addEventListener('click', () => navigator.share({ title, url }));
} else {
  shareButton.addEventListener('click', () => copyToClipboard(url));
}
```

In CSS, `@supports` scopes rules to capable browsers. Detect features, never browser names. Remember that "exists" is not "works": storage can throw in private modes or when full, permissions can be denied, and `navigator.gpu` can exist with no usable adapter. Wrap those calls and handle refusal.

**Blocked or failed third-party scripts.** A significant share of users block analytics, ads, chat widgets, and tag managers. Your code must not assume their globals exist:

```js
window.analytics?.track('Order Completed', props);
```

Load third parties with `async` or `defer` so they never block rendering, never `await` a third-party promise in the critical path without a timeout, and make sure a blocked consent tool, flag service, or experiment script leaves the app in a sensible default state. If payment or login depends on a third party, show an explicit error with an alternative when it fails to load.

**Failed requests.** Networks fail constantly on mobile. Every request needs a timeout (`AbortSignal.timeout(8000)`), a check of `response.ok`, retries with backoff for idempotent reads, and a visible error with a retry action. Decide for each failure whether the page can continue: if recommendations fail, hide the section; if the cart fails, say so. Prefer showing stale cached data with an indication over showing nothing. Failed dynamic imports after a deployment (a chunk that no longer exists) should prompt a reload instead of a white screen. Listen to `online`/`offline` events as a hint, but treat a failed request as the real signal.

**Degraded assets.** Images get `alt` text and reserved dimensions; web fonts fall back with `font-display: swap`; a failed stylesheet should still leave readable, ordered HTML.

The test for all of it is deliberate sabotage, not hope.

**Try it:** In the Network panel's request blocking, block one thing at a time: your analytics host, your font files, your main API, one JavaScript chunk. For each, note whether the page shows a white screen, a broken layout, an infinite spinner, or a sensible reduced experience, and fix the first three.

**Resources**
- [MDN: Implementing feature detection](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Testing/Feature_detection)
- [MDN: @supports](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports)
- [MDN: AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)

### Error boundaries and fallbacks

In React, an error thrown while rendering unmounts the entire tree up to the root unless something catches it, which the user sees as a blank page. An **error boundary** is a component that catches errors thrown by its descendants during rendering and shows a fallback instead. Boundaries must be class components (there is no hook equivalent), so most teams use the `react-error-boundary` package:

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>This section could not be displayed.</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

<ErrorBoundary FallbackComponent={Fallback} onError={reportError} resetKeys={[userId]}>
  <ActivityFeed userId={userId} />
</ErrorBoundary>
```

The limits are the most important thing to know. Boundaries catch errors in rendering, in lifecycle methods, and in constructors of the tree below them. They do **not** catch errors in event handlers, in asynchronous code such as `setTimeout` callbacks or promise chains that are not tied to rendering, during server rendering, or in the boundary's own render. For those, use `try/catch` and set error state yourself, or hand the error to the boundary (`useErrorBoundary().showBoundary(error)`). Errors thrown inside a transition or from a promise read with `use` do reach the nearest boundary.

Placement decides how much the user loses. One boundary at the root only replaces a white screen with an apology. Add boundaries at the level of *independently useful regions*: each route, and each widget on a page whose failure should not take down its neighbours (a recommendations panel, a chart, a comments list). Too many tiny boundaries produce pages riddled with error boxes, so follow the layout's natural seams, usually the same places you put Suspense boundaries.

A good fallback says what failed in plain words, keeps the rest of the page working, and offers recovery: retry (reset the boundary, and reset it automatically when inputs change via `resetKeys`), navigate elsewhere, or reload. Always report the error from `onError`. React 19 also lets you observe errors globally with `onCaughtError`, `onUncaughtError`, and `onRecoverableError` options on `createRoot`. Frameworks build on the same idea: Next.js uses an `error.js` file per route segment, and React Router an `errorElement`/`ErrorBoundary` per route. Other frameworks have equivalents (`onErrorCaptured` in Vue, `<svelte:boundary>` in Svelte).

**Try it:** Add a component that throws when a prop is set, and trigger it on a page with a single root boundary; note how much UI disappears. Add a boundary around just that widget and trigger it again. Then throw inside an `onClick` handler and observe that no boundary catches it.

**Resources**
- [React: Catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [react-error-boundary on GitHub](https://github.com/bvaughn/react-error-boundary)
- [Next.js: Error handling](https://nextjs.org/docs/app/getting-started/error-handling)

### Error monitoring

Users do not report errors; they leave. Error monitoring captures exceptions from real browsers and gives you enough context to reproduce and prioritise them. Sentry is the most common tool; Bugsnag, Rollbar, and Datadog work the same way.

The SDK hooks the two global events, `error` and `unhandledrejection`, and you report handled errors yourself:

```js
Sentry.init({
  dsn: '…',
  release: __APP_VERSION__,
  environment: 'production',
  tracesSampleRate: 0.1,
});

try {
  await saveDraft(draft);
} catch (err) {
  Sentry.captureException(err, { tags: { feature: 'editor' } });
  showSaveFailed();
}
```

**Source maps** make the report usable. Production code is minified, so a raw stack reads `a.js:1:48213`. Generate source maps in the build, upload them to the monitoring service during CI (the Sentry bundler plugins do this and tag each file with a debug ID so maps match exactly), and do not serve them publicly unless you intend to: in Vite, `build.sourcemap: 'hidden'` emits maps without the reference comment. Tie every event to a **release** so you can see which deploy introduced an error and whether a fix worked.

**Context** turns a stack trace into a diagnosis. Attach the user (an internal id, not an email unless policy allows), tags for route, feature, flag and experiment state, and locale; breadcrumbs (the SDK records recent navigation, clicks, console messages, and requests automatically); and the React component stack from your error boundary.

**Noise control** decides whether anyone looks at the dashboard. Much of what arrives is not your bug: browser extensions, injected scripts, bots, and in-app browsers. Filter with `ignoreErrors`, `denyUrls`/`allowUrls`, and `beforeSend`; sample high-volume errors; and fix grouping so one bug is one issue. "Script error." with no detail is a cross-origin script without CORS: add `crossorigin="anonymous"` to the script tag and the `Access-Control-Allow-Origin` header on the host. Throw `Error` objects, not strings, or there is no stack.

Operate it: alert on new issues and on regressions after a release, not on every event; watch the crash-free session rate; triage on a schedule. Treat the tool as a data processor: scrub personal data in `beforeSend`, mask session replay, and respect consent. Ad blockers often block the ingest domain, so many setups proxy it through their own origin with the SDK's `tunnel` option.

**Try it:** Add Sentry (or a similar free tier) to a small production build. Throw an error from a button, find it in the dashboard, and confirm the stack shows your original source file and line, the release, and the breadcrumb of your click. Then remove the source map upload, deploy again, and compare.

**Resources**
- [Sentry docs: JavaScript source maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Sentry docs: Enriching events](https://docs.sentry.io/platforms/javascript/enriching-events/)
- [MDN: Window unhandledrejection event](https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event)

### Empty, loading, error, partial states

Designs show the ideal state: data loaded, a comfortable number of items, nothing wrong. Every view that depends on data has at least four more states, and users spend real time in each.

**Loading.** Decide the pattern by expected duration. Under about a second, show nothing new or keep the previous content. For longer waits, a skeleton that matches the final layout's shape and size prevents layout shift and suggests what is coming; a spinner suits small, indeterminate actions. Distinguish the **first load** (nothing to show) from a **refresh** (keep showing the existing data, with a subtle indicator), since replacing content with a spinner on every refetch is the most common loading mistake. Mark the region with `aria-busy="true"` and announce completion or results politely.

**Empty.** There are different kinds of empty and each needs its own message: first use ("No projects yet" with a clear call to action to create one), no results for a search or filter ("No invoices match 'acme'" with a way to clear the filter), and cleared ("You're all caught up"). An empty table with headers and no explanation looks broken.

**Error.** Say what failed in plain language, what the user can do, and offer a retry. Keep the user's input and context. Distinguish cases that need different actions: offline, not found, not permitted, and server failure. Use `role="alert"` for errors that appear after an action.

**Partial.** Real pages make several requests, and some succeed while others fail; lists are paginated; data can be stale. Show what you have. One failed widget should not blank the dashboard, a failed "load more" should keep the items already shown with an inline retry, and stale data should be labelled rather than hidden.

Model the states so impossible combinations cannot be expressed. Three booleans (`isLoading`, `isError`, `data`) allow eight combinations, most of them nonsense; a discriminated union allows only the real ones:

```ts
type State<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry: () => void }
  | { status: 'empty' }
  | { status: 'success'; data: T; isRefreshing: boolean };
```

Data libraries such as TanStack Query expose the same distinctions (`isPending` versus `isFetching`). Make the states part of the definition of done: a story for each in Storybook, each one reviewed by design, and each reachable in tests through mocked responses.

**Try it:** Pick one data-driven view in a project. Using mocked responses (MSW or your framework's tools), produce all of: first load, slow load of 5 seconds, empty, filtered-to-empty, error, refresh failure with existing data, and one item out of several failing. Screenshot each and fix whichever looks unfinished.

**Resources**
- [React: Suspense](https://react.dev/reference/react/Suspense)
- [TanStack Query: Queries (status and fetchStatus)](https://tanstack.com/query/latest/docs/framework/react/guides/queries)
- [Nielsen Norman Group: Skeleton screens 101](https://www.nngroup.com/articles/skeleton-screens/)

### Browser support policy

A support policy is a written answer to "which browsers do we promise this works in?", agreed with the business, enforced by tooling, and visible to support staff and users. Without one, every bug report from an old browser becomes a negotiation.

**Define it from data and from a standard.** Look at your own analytics for browser, version, and device share (weighted by revenue if you can), then anchor on **Baseline**, the cross-vendor definition of feature availability. *Baseline Newly available* means a feature works in the current versions of Chrome, Edge, Firefox, and Safari on desktop and mobile; *Widely available* means it has been so for 30 months. "We support Baseline Widely available" is a policy that is precise, updates itself over time, and matches the labels on MDN and Can I Use.

Use tiers rather than a yes/no list:

- **Fully supported**: tested every release; bugs are fixed with priority.
- **Functional**: core journeys work through progressive enhancement; cosmetic differences accepted; not routinely tested.
- **Unsupported**: no testing or fixes; the user sees a message if the app cannot run.

**Encode it** so the build enforces it. Browserslist is the shared configuration read by Babel, Autoprefixer, Lightning CSS, ESLint plugins, and bundlers, and it accepts Baseline queries:

```json
{
  "browserslist": ["baseline widely available"]
}
```

Run `npx browserslist` to see exactly which versions that resolves to. Vite's default build target is also Baseline Widely available. Add `eslint-plugin-compat` or Baseline-aware lint rules so using an unsupported API fails in review, and note that transpilers fix syntax, not missing APIs: those need polyfills or feature detection.

**Test it.** Playwright runs Chromium, Firefox, and WebKit in CI, which covers the three engines; WebKit on Linux is close to but not identical to Safari, so check important releases on real Safari and on real iOS and Android devices or a device cloud. Remember that every browser on iOS has historically been WebKit underneath, and that in-app browsers and embedded webviews often lag.

**Communicate it.** Publish the policy in your docs or help centre, give support a short version, review it on a schedule (twice a year is common), and announce removals ahead of time. For unsupported browsers, prefer a working baseline to a block page.

**Try it:** Write a one-page support policy for a project: tiers, the Browserslist query, how it is tested, and the review date. Run `npx browserslist` on the query, then compare the output with your analytics (or public usage data) and estimate what share of users falls outside it.

**Resources**
- [web.dev: Baseline](https://web.dev/baseline)
- [Browserslist: README and query reference](https://github.com/browserslist/browserslist)
- [Playwright: Browsers](https://playwright.dev/docs/browsers)

### Form UX

Forms are where users give you something, so they are where friction costs most. Three areas need engineering care.

**Validation timing.** Validating on every keystroke from the start scolds people for an email address they have not finished typing; validating only on submit makes them hunt for errors afterwards. The pattern that tests best is: do not show an error until the user leaves the field (blur) or submits; once a field is showing an error, re-validate on every input so the error clears the instant it is fixed. In short, be slow to complain and quick to forgive. CSS gives you the first half natively: `:user-invalid` matches only after the user has interacted with the field, unlike `:invalid`, which matches an empty required field on page load.

```css
input:user-invalid { border-color: var(--danger); }
```

**Error messages and recovery.** An error must be next to its field, in text (not colour alone), specific about the fix ("Enter a date in the future", not "Invalid input"), and programmatically connected:

```html
<label for="email">Email</label>
<input id="email" type="email" autocomplete="email"
       aria-invalid="true" aria-describedby="email-error" />
<p id="email-error">Enter an email address in the format name@example.com</p>
```

On a failed submit, move focus to the first invalid field, or to an error summary at the top that links to each field when the form is long. Do not disable the submit button for an invalid form: a disabled button cannot explain itself, is often not focusable, and leaves users stuck. Let them submit and show what to fix. Disable only while a submission is in flight, to prevent duplicates, and show progress.

**Preserving input.** Never lose what someone typed. A server-side validation failure must re-render the form with every value intact (passwords and card security codes excepted). Do not clear fields on error, do not reset the form when a parent re-renders, keep values when moving between steps, save long forms as drafts, and warn before navigation only when there are unsaved changes.

Reduce the work in the first place: ask for less, use the right `type`, `inputmode`, and `autocomplete` tokens so browsers and password managers can fill fields, accept input in any reasonable format (spaces in card numbers, any phone format) and normalise it yourself, never block paste, and mark optional fields rather than required ones when most are required. Client validation is a convenience; the server validates again.

**Try it:** Build a sign-up form with name, email, and password. Implement blur-then-live validation, a server error for "email already registered" returned after a simulated delay, and focus management on failure. Then complete it with keyboard only, with a screen reader, and with a password manager, and confirm nothing you typed is ever lost.

**Resources**
- [MDN: :user-invalid](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid)
- [W3C WAI: Forms tutorial, user notifications](https://www.w3.org/WAI/tutorials/forms/notifications/)
- [GOV.UK Design System: Error summary](https://design-system.service.gov.uk/components/error-summary/)

### Perceived speed

How fast an interface feels depends on feedback and continuity as much as on milliseconds. The long-standing thresholds: under about 100ms a response feels instantaneous; up to about 1 second the user notices the delay but keeps their train of thought; beyond about 10 seconds attention is gone and you need progress indication and the option to do something else. Your first job is immediate acknowledgement of every input, which is what the INP metric measures.

**Optimistic updates** apply the expected result to the UI at once and reconcile when the server answers. Liking a post, toggling a setting, reordering a list, or sending a chat message should not wait for a round trip.

```jsx
const [optimisticTodos, addOptimistic] = useOptimistic(
  todos,
  (current, newTodo) => [...current, { ...newTodo, pending: true }],
);

async function addTodo(formData) {
  const todo = { id: crypto.randomUUID(), title: formData.get('title') };
  addOptimistic(todo);        // shown immediately
  await saveTodo(todo);       // when the action settles, real state replaces it
}
```

React's `useOptimistic` reverts automatically when the action finishes; with TanStack Query you snapshot the cache in `onMutate` and restore it in `onError`. The rules: use it only where success is overwhelmingly likely and the action is reversible; always handle failure by rolling back and telling the user; and guard against out-of-order responses. Do not be optimistic about payments or anything destructive.

**Skeletons** show the page's structure while data loads, which reads as progress and avoids layout shift when content arrives, provided the skeleton matches the real layout's dimensions. They are for waits long enough to notice; flashing one for 100ms is worse than nothing, so delay loading indicators by a few hundred milliseconds and, once shown, keep them briefly to avoid flicker. For long operations, show determinate progress.

**Transitions** preserve continuity. Keep the old content visible while the next view loads instead of blanking the screen (React's `useTransition` does this), and use the View Transition API to animate between states so a change reads as movement, not replacement. Same-document view transitions are available in all current major browsers; cross-document ones are not yet universal, so treat both as an enhancement. Keep animations short (150 to 300ms) and honour `prefers-reduced-motion`.

Other techniques: prefetch on hover or when links enter the viewport, render above-the-fold content first, and preserve scroll and state on back navigation. None of this replaces being fast, and a fake progress bar is a broken promise.

**Try it:** Build a to-do list against a fake API with a 1.5 second delay and a 20 percent failure rate. Implement adding and toggling with optimistic updates, with rollback and a visible message on failure. Then use it on "Slow 4G" and compare it with a version that waits for the server.

**Resources**
- [React: useOptimistic](https://react.dev/reference/react/useOptimistic)
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Nielsen Norman Group: Response times, the 3 important limits](https://www.nngroup.com/articles/response-times-3-important-limits/)

### Navigation UX

Browsers give multi-page sites correct navigation for free: Back returns to the previous page at the previous scroll position, every page has a URL, and reload shows the same thing. A single-page app replaces all of that with its own code, and users notice immediately when any of it is missing.

**The URL is the state that matters.** Anything a user would expect to bookmark, share, or return to belongs in the URL: the route, the selected tab, search terms, filters, sort order, pagination, an open detail view. Component state that should have been URL state is why reloading loses your filters and why a shared link shows the wrong thing. Every URL must also work when loaded directly (a **deep link**), which requires the server to serve the app for every route and the app to initialise itself from the URL alone.

**Back button.** Decide for each state change whether it deserves a history entry. Moving to a new view pushes (`pushState`); refining the current view, such as typing in a filter, replaces (`replaceState`), or Back has to be pressed twenty times to leave the page. Back should close an open modal or drawer when it was opened as a navigation. Never trap the user with redirects that bounce them forward again.

**Scroll restoration.** On a new navigation, scroll to the top (or to the `#fragment` target). On Back and Forward, restore the previous position, which means the content has to be there: if the list refetches and renders empty first, the browser has nothing to scroll to. Cache the data, or restore after render. Browsers do this automatically for same-document history entries when `history.scrollRestoration` is `'auto'`; routers that take over set it to `'manual'` and must do it themselves, including for scrollable containers other than the window. Infinite lists must restore both the loaded items and the position.

**Focus and announcements.** After a client-side navigation, a screen reader user hears nothing unless you act: update `document.title`, and move focus to the new page's main heading or announce the page through a live region.

**Back/forward cache.** For full page loads, browsers can restore a page instantly from memory on Back. Pages are excluded if they register `unload` handlers or hold certain open connections; check eligibility in DevTools' Application panel and use `pagehide`/`pageshow` instead.

The Navigation API (`navigation.addEventListener('navigate', …)` with `event.intercept()`) is a purpose-built replacement for the History API that centralises all of this, including scroll and focus handling. It reached Baseline Newly available in early 2026, so check your support policy before relying on it without a fallback; routers are adopting it underneath you.

**Try it:** In an SPA you built, run this script: apply a filter, scroll halfway down a list, open an item, press Back. Check that the filter, items, and scroll position are restored. Reload, and copy the URL into a new tab. Then open a modal and press Back. Write down every case that behaves differently from a server-rendered site.

**Resources**
- [MDN: Working with the History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)
- [MDN: Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API)
- [web.dev: Back/forward cache](https://web.dev/articles/bfcache)

### Content resilience

Components are designed with tidy sample content and then meet real data. A resilient component keeps its layout and meaning for any content the system can legally hold. Work through the same hostile inputs every time.

**Long text.** Names, titles, emails, and URLs can be far longer than the mock-up, and may contain no spaces at all. Text must wrap or truncate deliberately, never overflow or push siblings off-screen:

```css
.card-title { overflow-wrap: anywhere; }
.row { display: flex; gap: 1rem; }
.row > .name { min-width: 0; }          /* lets a flex child shrink below its content width */
.one-line { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.three-lines { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
```

The `min-width: 0` line fixes the most common overflow bug: flex and grid items refuse to shrink below their content's minimum width by default. When you truncate, make the full value available (expand, detail view, or `title` as a minimum) and never truncate what users need to distinguish items.

**Short and missing text.** A one-character name, a missing optional field, a null where a string was promised. Render a sensible placeholder ("Unnamed project"), not `undefined`, an empty gap, or a crash from `.toUpperCase()` on null.

**Images.** They fail to load, are missing, or arrive with unexpected proportions. Reserve space with `width`/`height` or `aspect-ratio`, use `object-fit: cover` so odd ratios do not distort, give a background colour so text over the image stays readable when it fails, write `alt` text that still makes sense when shown in place of the image, and provide a fallback (initials for avatars).

**Numbers.** Zero, negatives, decimals, and values with many digits. Use `Intl.NumberFormat` with `notation: 'compact'` for counts (1.2M), `font-variant-numeric: tabular-nums` so columns align and do not jitter, and cap badges ("99+"). Check that a price of 1,000,000.00 fits where 9.99 did.

**Counts of items.** Zero (an empty state), one (does the layout look stranded, is the plural right?), an awkward number that leaves an orphan in a grid, and thousands (pagination or virtualisation).

**Unexpected characters.** Emoji, right-to-left text, combining marks, and markup-looking strings. Rely on your framework's escaping rather than building HTML from strings.

Make this routine with a stress fixture: a set of deliberately awful records you render in Storybook or tests for every component. Write CSS defensively by default, assuming content is longer and wider than shown.

**Try it:** Create a fixture with: a 120-character unbroken name, a one-letter name, a null name, a broken image URL, a portrait and a panoramic image, the numbers 0, -5, and 1234567890.123, an Arabic name, and an emoji-only title. Render a card list with zero, one, and 500 of them at 320px and 1440px wide, and fix what breaks.

**Resources**
- [MDN: overflow-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap)
- [Defensive CSS by Ahmad Shadeed](https://defensivecss.dev/)
- [MDN: text-overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/text-overflow)

### Usability testing

Usability testing means watching representative users attempt realistic tasks with your product while you stay quiet. It finds problems that analytics cannot explain and that the team cannot see, because the team knows how the product is supposed to work. It is not a survey, a demo, or a focus group: you observe behaviour, you do not collect opinions.

Engineers should attend sessions. Watching someone fail to find the button you built changes priorities faster than any report.

**How to run a simple moderated test:**

1. Decide what you want to learn and write three to five **tasks** as scenarios with a goal, not instructions: "You were charged twice last month. Find out why", not "Click Billing, then Invoices". Avoid using the words that appear in the UI.
2. Recruit people who resemble real users. Five participants per round uncover most of the serious problems in the flows you test; several small rounds with fixes in between beat one large study.
3. Ask participants to **think aloud**. Explain that you are testing the product, not them.
4. Stay neutral. Do not help, explain, or defend. When they ask "should I click this?", answer "what would you expect to happen?". Let silences run. Step in only when they are truly stuck, and note that you did.
5. Record the screen and audio with consent, and have a second person take notes.

**What to capture:** where people hesitate, backtrack, misread a label, or say one thing and do another; whether each task was completed, with how much difficulty; and direct quotes. Behaviour outranks stated preference: someone who struggled for three minutes and then says "that was easy" has shown you a problem.

**Acting on it** is the half that gets skipped. Straight after each session, write down observations (what happened), separately from interpretations (why) and solutions. After the round, group observations across participants, rate each issue by how many people hit it and how badly it blocked them, and turn the top items into tickets with video clips attached. Fix them, then test again; a fix that has not been retested is a guess.

Variants: unmoderated remote tests scale cheaply but cannot probe; hallway tests with colleagues from other teams catch the obvious problems early; and testing with people who use assistive technology finds accessibility problems that audits miss. Analytics tells you what is happening at scale, usability testing tells you why, and you need both.

**Try it:** Write three scenario tasks for something you have built. Sit one person who has never seen it in front of it, ask them to think aloud, and say nothing for fifteen minutes. Write down every hesitation and wrong turn, then rank the top three issues and fix the first.

**Resources**
- [Nielsen Norman Group: Usability testing 101](https://www.nngroup.com/articles/usability-testing-101/)
- [GOV.UK Service Manual: Using moderated usability testing](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing)
- [Nielsen Norman Group: Why you only need to test with 5 users](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/)

### Localise an app

This project takes an existing small app and makes it work in two languages, one of them right-to-left: English plus Arabic or Hebrew is the natural pair, and Arabic is the harder test because it has six plural categories. The goal is to prove the i18n layer, not to produce perfect translations, though you should have any text you publish checked by a speaker.

Work in this order, because each step exposes problems for the next:

1. **Externalise every string.** Choose a library (react-intl/FormatJS, i18next, Lingui, or your framework's own) and move all user-visible text into messages, including `aria-label`, `alt`, placeholders, validation errors, and the document title. Add a lint rule so new literals fail review.
2. **Pseudo-localise.** Run the app in a pseudo-locale and fix every string that did not change, every concatenation, and every layout that breaks with longer text.
3. **Rewrite messages with ICU.** Replace every `count === 1` ternary with `plural`, and every sentence assembled from parts with one message and placeholders.
4. **Format through `Intl`.** Dates, times, numbers, currency, lists, and relative times all take the active locale. Sort with `Intl.Collator`.
5. **Add locale routing.** Put the locale in the URL, load only that locale's catalogue, set `<html lang>` and `dir` from it on the server render as well as the client, add a language switcher that keeps the user on the same page, and emit `hreflang` links.
6. **Make the layout bidirectional.** Convert physical CSS properties to logical ones, mirror directional icons, check any JavaScript that uses `left`, `clientX`, or `scrollLeft`, and isolate user-generated text with `<bdi>` or `dir="auto"`.
7. **Check fonts.** Confirm which font renders the second script and adjust line height.

```jsx
<IntlProvider locale={locale} messages={messages[locale]}>
  <html lang={locale} dir={isRtl(locale) ? 'rtl' : 'ltr'}>…</html>
</IntlProvider>
```

Verify with tests rather than by eye alone: unit tests for the plural messages at 0, 1, 2, 3, 11, and 100 in both languages; a CI check that both catalogues have the same keys and valid syntax; and Playwright runs with `locale` set, taking screenshots of the main screens in both directions. Finish with a walkthrough by someone who reads the RTL language, who will notice mirrored icons that should not be, awkward line breaks, and numbers or punctuation on the wrong side.

**Try it:** Before starting, search the codebase for string concatenation involving user-visible text and for the pattern `=== 1 ?`. Count the hits; that number is your i18n debt. After finishing, rerun the search, then add a third locale and time how long it takes. If it needs code changes beyond adding a catalogue, the i18n layer is not done.

**Resources**
- [FormatJS: react-intl overview](https://formatjs.github.io/docs/react-intl)
- [W3C: Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir)
- [Playwright: Emulation (locale and timezone)](https://playwright.dev/docs/emulation)

### Flagged rollout

This project ships a real change the way a careful team does: dark behind a flag, exposed gradually, measured, and reversible in seconds. Pick a feature with a measurable outcome, such as a redesigned checkout step or a new search box.

**Set up the flag.** Use a flag service with a free tier (PostHog, Unleash, GrowthBook, Flagsmith) or OpenFeature with a provider, and create one boolean flag with a safe default of off. Record its owner and removal date. Evaluate it at one decision point, and bootstrap the value into the first render so there is no flash of the old UI:

```tsx
function Checkout() {
  const enabled = useFlag('new-checkout', false); // default applies if the service is down
  useEffect(() => {
    track('Feature Exposed', { flag: 'new-checkout', variant: enabled ? 'on' : 'off' });
  }, [enabled]);
  return enabled ? <NewCheckout /> : <LegacyCheckout />;
}
```

Lazy-load `NewCheckout` so users with the flag off do not download it, and enforce anything security-relevant on the server too.

**Add tracking before rollout.** You need three things: the exposure event above for both groups, the success metric (for example `Order Completed`), and guardrails (error rate, a latency or Web Vitals measure). Tag errors in your monitoring tool with the flag state so you can compare groups. Decide in advance what numbers trigger a rollback.

**Roll out in stages.** Internal users first, then 1 to 5 percent, 25, 50, and 100, with a soak period at each stage long enough to see errors and the metric. Bucketing must be sticky so users do not flip between old and new. At each stage compare the flagged group with the rest: errors, performance, and the success metric.

**Prove the kill switch.** A kill switch you have never used is a hypothesis. Turn the flag off in production (or a production-like environment) while you are using the feature, and measure how long until every client is back on the old path. If clients only fetch flags at page load, long-lived tabs stay on the broken version, so use streaming or polling updates and decide what a mid-session switch does to a user halfway through the flow. Also test the app with the flag service blocked.

**Clean up.** After a period at 100 percent, delete the flag, the legacy branch, the conditional, and the exposure event, and archive the flag in the service. The project is finished when the flag is gone, not when the feature is on.

**Try it:** Write the rollout plan as a one-page checklist before you write code: stages, soak times, metrics, rollback thresholds, kill-switch test, and the clean-up date. Execute it, and at the 25 percent stage deliberately trip the kill switch and time the recovery.

**Resources**
- [Martin Fowler: Feature Toggles (Pete Hodgson)](https://martinfowler.com/articles/feature-toggles.html)
- [OpenFeature: Introduction](https://openfeature.dev/docs/reference/intro)
- [PostHog docs: Feature flags](https://posthog.com/docs/feature-flags)
