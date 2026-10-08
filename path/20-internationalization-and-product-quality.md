# Internationalisation and Product Quality

> Stage: 3 · Advanced
> The concerns that separate a demo from a product used by real people around the world: language, analytics, experiments, and resilience.

## Internationalisation

- [ ] i18n vs l10n — separate making an app translatable from translating it
- [ ] Message extraction — externalise strings with keys or source-text approaches
- [ ] ICU MessageFormat — plurals, gender, and select; never concatenate translated strings
- [ ] `Intl` formatting — dates, numbers, currencies, lists, relative time, collation
- [ ] Time zones — store instants in UTC, keep future local events as wall time plus zone, display local, and handle DST
- [ ] Right-to-left — `dir`, logical properties, and mirrored layouts
- [ ] Text expansion — design for strings 40% longer and for CJK
- [ ] Text segmentation — count, truncate, and wrap by grapheme, word, and sentence with `Intl.Segmenter`
- [ ] Locale-aware input — names, addresses, phone numbers, number and date entry, and IME composition
- [ ] Locale routing and detection — URLs, `Accept-Language`, `hreflang`
- [ ] Fonts and scripts — coverage and fallbacks for non-Latin scripts
- [ ] Translation workflow — integrate a TMS and keep translations in sync

## Analytics and experimentation

- [ ] Event tracking — design a consistent event taxonomy
- [ ] Product analytics — funnels, retention, and what the tools measure
- [ ] Feature flags — ship dark, roll out gradually, and clean up afterwards
- [ ] A/B testing — assignment, exposure, and avoiding flicker and layout shift
- [ ] Privacy-respecting measurement — consent, anonymisation, and sampling

## Resilience

- [ ] Progressive enhancement — core flows work when JS fails or is slow
- [ ] Graceful degradation — handle missing features, blocked scripts, and failed requests
- [ ] Error boundaries and fallbacks — fail a part, not the whole page
- [ ] Error monitoring — capture errors with context and source maps (Sentry or similar)
- [ ] Empty, loading, error, partial states — designed for every view
- [ ] Browser support policy — define, test, and communicate it

## UX engineering

- [ ] Form UX — inline validation timing, error recovery, preserving input
- [ ] Perceived speed — optimistic updates, skeletons, transitions
- [ ] Navigation UX — back button, deep links, scroll restoration all work
- [ ] Content resilience — long names, missing images, huge numbers, zero items
- [ ] Usability testing — watch real users and act on what you see

## Projects

- [ ] Localise an app — two languages including one RTL, with correct plurals and formatting
- [ ] Flagged rollout — ship a feature behind a flag with tracking and a kill switch

## Resources

- [MDN: Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [W3C Internationalization](https://www.w3.org/International/)
- [FormatJS](https://formatjs.github.io/)
- [Resilient Web Design (free book)](https://resilientwebdesign.com/)
