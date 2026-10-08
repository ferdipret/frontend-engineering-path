# Internationalisation and Product Quality: Practice test

### 1. Which of these tasks is internationalisation rather than localisation?

- [ ] Translating the checkout page into Brazilian Portuguese
- [ ] Choosing which payment methods to offer in Germany
- [x] Replacing hard-coded strings and `count === 1` checks with messages that use ICU plurals
- [ ] Having a native speaker review the tone of the Japanese onboarding emails

> Internationalisation is the one-off engineering work that makes the product able to be adapted: externalised messages, plural-aware formatting, locale-aware dates and numbers, flexible and bidirectional layout. Localisation is the per-market work done on top of that: translating, reviewing, and adapting content and offers. The other three options are all work for a specific locale.

### 2. What is wrong with this code from an i18n point of view?

```js
const label = t('you_have') + ' ' + count + ' ' + (count === 1 ? t('message') : t('messages'));
```

- [ ] Nothing, as long as all three keys are translated in every locale
- [ ] `count` should be formatted with `toFixed(0)` before concatenating
- [ ] The keys should be camelCase so that extraction tools can find them
- [x] It fixes the word order and assumes two plural forms, so it cannot be translated correctly into many languages

> Translators receive three fragments with no context, cannot reorder the sentence, and get only a singular/plural choice. Many languages place the number elsewhere, need agreement between words, and have more plural forms (Russian has four categories, Arabic six). The fix is a single message with an ICU plural: `{count, plural, one {You have # message} other {You have # messages}}`, where each branch holds the whole sentence.

### 3. What does this log?

```js
const ru = new Intl.PluralRules('ru');
const en = new Intl.PluralRules('en');
console.log(ru.select(21), ru.select(5), en.select(0));
```

- [ ] `other many zero`
- [x] `one many other`
- [ ] `many many zero`
- [ ] `one few other`

> Plural categories are grammatical classes, not literal numbers. In Russian, `one` applies to numbers ending in 1 except those ending in 11, so 21 is `one`; 5 to 20 and numbers ending in 5 to 9 or 0 are `many` (`few` is for endings 2 to 4, excluding 12 to 14). English has only `one` and `other`, and 0 is `other` ("0 messages"); the `zero` category is used by languages such as Arabic, not English. If you want special text for zero, use the exact match `=0` in the message.

### 4. What is the result?

```js
const items = ['item 10', 'Item 1', 'item 9'];
const a = [...items].sort();
const b = [...items].sort(new Intl.Collator('en', { numeric: true, sensitivity: 'base' }).compare);
```

- [ ] `a` and `b` are both `['Item 1', 'item 9', 'item 10']`
- [ ] `a` is `['item 10', 'item 9', 'Item 1']` and `b` is `['Item 1', 'item 10', 'item 9']`
- [x] `a` is `['Item 1', 'item 10', 'item 9']` and `b` is `['Item 1', 'item 9', 'item 10']`
- [ ] `a` is `['Item 1', 'item 9', 'item 10']` and `b` is `['item 10', 'item 9', 'Item 1']`

> The default sort compares UTF-16 code units: uppercase "I" (73) sorts before lowercase "i" (105), and "item 10" sorts before "item 9" because the character "1" precedes "9". The collator with `numeric: true` compares digit sequences as numbers, and `sensitivity: 'base'` ignores case, so the order is 1, 9, 10. This is why user-visible lists should be sorted with `Intl.Collator`.

### 5. A user in Los Angeles (UTC-8 on this date) picks 8 March 2026 as a due date. The app stores the string `2026-03-08` and later runs this. What is displayed?

```js
new Date('2026-03-08').toLocaleDateString('en-US');
```

- [ ] `3/8/2026`, because a date string with no time is treated as local midnight
- [ ] `Invalid Date`, because the string has no time component
- [ ] `3/8/2026`, because `toLocaleDateString` ignores the time zone
- [x] `3/7/2026`, because a date-only ISO string is parsed as UTC midnight, which is the previous afternoon in Los Angeles

> Date-only ISO strings are parsed as UTC, while date-time strings without an offset are parsed as local time. Midnight UTC on 8 March is 16:00 on 7 March in Los Angeles, so the formatted local date is the 7th. A calendar date is not an instant: keep it as a plain date (`Temporal.PlainDate`, or parse the parts and build a local date) and do not run it through a time zone conversion.

### 6. Clocks in New York go forward one hour at 02:00 on 8 March 2026. This code runs with the time zone set to `America/New_York`. What is logged?

```js
const start = new Date(2026, 2, 7, 12, 0); // 7 March, 12:00 local
const next = new Date(start.getTime() + 24 * 60 * 60 * 1000);
console.log(next.getHours());
```

- [ ] 12
- [ ] 11
- [x] 13
- [ ] 0

> Adding 24 hours of elapsed time moves the instant forward exactly 24 hours, but 8 March has only 23 hours of wall-clock time in New York. Noon EST plus 24 hours is 13:00 EDT. "The same time tomorrow" is calendar arithmetic and must be done in calendar units in the relevant zone: `start.setDate(start.getDate() + 1)` for the local zone, or `zonedDateTime.add({ days: 1 })` with Temporal.

### 7. This card looks right in English. With `<html dir="rtl">` the icon sits on the wrong side of the text and the text hugs the wrong edge. Which change fixes it with one set of rules for both directions?

```css
.card { display: flex; text-align: left; }
.card .icon { margin-right: 12px; }
```

- [x] Use `text-align: start` and `margin-inline-end: 12px`
- [ ] Add `direction: rtl` to `.card`
- [ ] Add `flex-direction: row-reverse` to `.card`
- [ ] Use `text-align: right` and `margin-left: 12px`

> Flexbox already lays the row out in the inline direction, so the icon correctly moves to the right in RTL; the physical `margin-right` and `text-align: left` are what stay behind. Logical values (`start`, `margin-inline-end`) follow the direction automatically. Swapping to `right`/`margin-left` just breaks LTR instead, `row-reverse` would double-flip the order in RTL, and direction belongs in the HTML `dir` attribute, which is already set.

### 8. What does this log?

```js
const flag = '🇯🇵';
const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
console.log(flag.length, [...flag].length, [...seg.segment(flag)].length);
```

- [ ] `1 1 1`
- [ ] `2 2 1`
- [ ] `4 4 2`
- [x] `4 2 1`

> A flag emoji is two regional indicator code points, each outside the Basic Multilingual Plane and so stored as two UTF-16 code units. `length` counts code units (4), string iteration yields code points (2), and the grapheme segmenter yields what the user sees as one character (1). This is why `slice` and `length` are unsafe for truncating or counting user-visible text, and why a character counter must say which unit it counts.

### 9. A chat input sends the message when Enter is pressed. Japanese users report that messages are sent half-written while they are still choosing characters. What is the fix?

```js
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') send(input.value);
});
```

- [ ] Listen for `keyup` instead of `keydown`, because composition has finished by then
- [x] Return early when `e.isComposing` is true (or `e.keyCode === 229`), because that Enter confirms an IME candidate
- [ ] Set `lang="ja"` on the input so the browser stops firing key events during composition
- [ ] Debounce `send` by 300ms so the composition has time to finish

> With an input method editor, the user types phonetic keys, picks a candidate, and presses Enter to confirm it. That Enter still produces a `keydown`, but with `isComposing` set; Safari fires it just after `compositionend`, which is why the legacy `keyCode === 229` check is added. `keyup` has the same problem, `lang` does not change event behaviour, and a debounce only delays sending the wrong text. The same rule applies to formatting or filtering input on every keystroke: wait for `compositionend`.

### 10. A site has English and German versions of its pricing page. Which `hreflang` setup is correct?

- [ ] Only the English page lists both versions, because it is the original
- [ ] Each page lists only the *other* language, using relative URLs
- [ ] Both pages list both versions, using `hreflang="uk"` for English and `hreflang="ge"` for German
- [x] Both pages list both versions (including themselves) with absolute URLs, plus an `x-default`

> `hreflang` annotations must be reciprocal: every version lists every version, itself included, or search engines ignore them. URLs must be absolute, and values are language codes with an optional region (`en`, `de`, `en-GB`); `uk` is the code for Ukrainian and `ge` is not a language code. `x-default` names the page for users who match none of the listed languages.

### 11. Which event design is best for tracking that a user started a trial from different places in the app?

- [ ] `homepage_green_cta_click`, `pricing_page_button_click`, and `SettingsUpgradeClicked`
- [x] One event `Trial Started` with a `source` property whose allowed values are `homepage`, `pricing`, and `settings`, fired when the server confirms the trial
- [ ] One event `click` with a `selector` property holding the CSS selector of the element
- [ ] One event `Trial Started` with the user's email and full name as properties so support can look them up

> A good taxonomy names the business fact once, in a consistent grammar, and puts variation in typed properties, so a single query answers "how many trials started, and from where". Firing on confirmation records the outcome, not an attempt. UI-named events break at the next redesign and use three naming styles; a generic click event pushes all meaning into brittle selectors; and personal data does not belong in event properties, since the user id already links the event to the account.

### 12. This React app shows a blank page for some users. The flag provider's host is on several ad-block lists. What is the design flaw?

```jsx
function App() {
  const [flags, setFlags] = useState(null);
  useEffect(() => {
    flagClient.fetchAll().then(setFlags);
  }, []);
  if (!flags) return null;
  return <Routes flags={flags} />;
}
```

- [ ] Flags should be fetched in `useLayoutEffect` so they arrive before paint
- [ ] `fetchAll` should be called once per route, not once per app
- [x] Rendering depends on the flag request succeeding; a blocked or failed request leaves the app blank instead of falling back to defaults
- [ ] Feature flags must be evaluated on the server and can never be read in client code

> If the request is blocked, the promise rejects (or never settles), `flags` stays `null`, and nothing renders. Flag evaluation must always have safe defaults and a time limit: render with defaults immediately or after a short timeout, catch the rejection, and treat the flag service as an enhancement. Bootstrapping flag values into the server-rendered HTML avoids both the wait and the flash. Client-side flags are fine for UI; they just must not be the only enforcement of access.

### 13. An experiment changes the layout of the checkout page. Users are assigned to a variant, and an exposure event is logged, when they first land on the homepage. Only 8% of visitors ever reach checkout. What is the consequence?

- [ ] The experiment will show a sample ratio mismatch between control and treatment
- [ ] Nothing: analysing everyone who was assigned is the correct intention-to-treat approach for product experiments
- [ ] The test will finish sooner, because more users are included
- [x] The 92% who never saw the change add noise and dilute the measured effect, so a real difference is much harder to detect

> Exposure should be logged when a user actually encounters the difference, here when the checkout page renders. Including users who could not have been affected adds identical behaviour to both groups, shrinking the observed effect and requiring a far larger sample. It does not by itself cause a sample ratio mismatch, because both groups are diluted equally; SRM points to a bug in assignment or logging.

### 14. A client-side A/B testing script loads asynchronously, then replaces the hero heading and image for users in the variant. Users see the original for a moment, then the content jumps. Which fix addresses the cause?

- [ ] Add an anti-flicker snippet that hides `<body>` until the script has run
- [ ] Load the testing script with `defer` instead of `async`
- [ ] Wrap the swap in `requestAnimationFrame` so it happens before the next paint
- [x] Decide the variant on the server or at the edge, so the first HTML already contains the right content

> The flash exists because the page is rendered before the decision is known. Making the decision before the HTML is produced (server or edge assignment, or assignments bootstrapped into the document) removes the swap entirely, along with its layout shift. Hiding the page trades the flicker for a blank screen and worse LCP, and if the script is slow or blocked the page stays hidden until a timeout. `defer` and `requestAnimationFrame` do not make the script arrive before first paint.

### 15. The `Profile` component below is wrapped in an error boundary. Which of the errors does the boundary catch?

```jsx
function Profile({ user }) {
  useEffect(() => {
    setTimeout(() => { throw new Error('A'); }, 1000);
  }, []);

  function handleClick() {
    throw new Error('B');
  }

  if (!user.name) throw new Error('C');

  return <button onClick={handleClick}>{user.name}</button>;
}
```

- [ ] A, B, and C
- [ ] B and C
- [x] Only C
- [ ] Only A and B

> Error boundaries catch errors thrown while rendering (and in lifecycle methods and constructors) of the components below them. C is thrown during render, so it is caught. B is thrown in an event handler and A in a timer callback, both outside React's render phase; they go to the global `error` handler instead. Handle those with `try/catch` and state, or pass them to the boundary explicitly, for example with `showBoundary` from `react-error-boundary`.

### 16. Your error monitoring shows thousands of events with the message "Script error." and no stack trace. What is the most likely cause and fix?

- [ ] Source maps were not uploaded; upload them for the release
- [x] The errors come from a script on another origin loaded without CORS; add `crossorigin="anonymous"` to the script tag and serve it with `Access-Control-Allow-Origin`
- [ ] Code is throwing strings instead of `Error` objects; enable a lint rule against it
- [ ] The SDK's sample rate is too low; raise it to 1.0

> For a script from a different origin that was not loaded with CORS, the browser hides error details from `window.onerror` to avoid leaking information, reporting only "Script error.". Loading it with the `crossorigin` attribute and the matching response header restores the message and stack. Missing source maps give you a minified but present stack; thrown strings give a message without a stack; the sample rate affects volume, not content.

### 17. A required email field shows a red border and an error message the moment the page loads, before the user has typed anything. The CSS is below. What is the best fix?

```css
input:invalid { border-color: red; }
input:invalid + .error { display: block; }
```

- [ ] Remove the `required` attribute and validate only on the server
- [ ] Use `input:not(:focus):invalid` so the error hides while typing
- [x] Use `:user-invalid`, which matches only after the user has interacted with the field
- [ ] Add `novalidate` to the form so the browser stops marking the field invalid

> `:invalid` reflects validity at all times, and an empty required field is invalid from the start. `:user-invalid` matches only after the user has changed the field and left it, or tried to submit, which is the "do not complain before they have had a chance" behaviour you want. Hiding the error on focus still shows it at page load, and `novalidate` only disables the browser's own blocking and bubbles; it does not change which pseudo-classes match.

### 18. A team's policy says "we support Baseline Widely available". What does that commit them to?

- [ ] Supporting every browser with more than 0.5% global usage
- [ ] Using only features that are in a W3C Recommendation
- [ ] Supporting the latest version of Chrome only, since other browsers follow it
- [x] Using, without fallbacks, features that have worked across Chrome, Edge, Firefox, and Safari (desktop and mobile) for at least 30 months

> Baseline is defined by feature availability in the core browser set. "Newly available" means the feature works in the latest version of all of them; "Widely available" means 30 months have passed since that point. It is not a usage-share threshold (that is what Browserslist's `> 0.5%` query expresses) and has nothing to do with specification status. Browserslist accepts `baseline widely available` as a query, so the policy can be enforced by the build.

### 19. A product list has a search box that filters as you type and writes the query to the URL with the code below. Users complain about the Back button. Why, and what is the fix?

```js
input.addEventListener('input', () => {
  const url = new URL(location.href);
  url.searchParams.set('q', input.value);
  history.pushState({}, '', url);
  render();
});
```

- [x] Every keystroke adds a history entry, so Back steps through each letter; use `history.replaceState` for refinements of the same view
- [ ] `pushState` reloads the page, losing the input's focus; use `location.hash` instead
- [ ] The query should not be stored in the URL at all; keep it in component state
- [ ] `pushState` does not fire `popstate`, so `render()` never runs when the URL changes

> Typing "shoes" pushes five entries, so leaving the page takes six presses of Back. Refining the current view should replace the current entry; push only for what a user would consider a new place (or push once when the search is committed). Keeping the query in the URL is right, since it makes the results shareable and reload-safe. `pushState` does not reload, and although it indeed does not fire `popstate`, the code calls `render()` directly; you still need a `popstate` listener to handle Back and Forward.

### 20. Rewrite this as a single ICU message, and explain why the result is better for translators.

```js
const text = name + ' ' + t('invited') + ' ' + n + ' ' + (n === 1 ? t('person') : t('people')) + ' ' + t('to_the_project');
```

> One message containing the whole sentence, with the plural branches wrapping the full text:
>
> ```
> {n, plural,
>   one {{name} invited # person to the project}
>   other {{name} invited # people to the project}
> }
> ```
>
> Called as `formatMessage(messages.invited, { name, n })`, with a description for the translator such as "Activity feed entry; name is the inviter's display name, n is the number of invitees".
>
> It is better because the translator sees a complete sentence with context, can reorder the name, number, and verb as their grammar requires, and can add the plural categories their language has (`few` and `many` for Polish or Russian, six categories for Arabic) with different wording in each. `#` formats the number for the locale. The original gives five disconnected fragments, fixes English word order, and can only ever choose between two forms. If the verb must agree with the inviter's gender in some language, a `select` on a gender argument can wrap the plural.

### 21. Your app schedules a recurring team meeting "every Monday at 09:00 in Berlin" and stores each occurrence as a UTC timestamp. Explain what goes wrong and what you should store instead.

> Berlin is UTC+1 in winter and UTC+2 in summer. If you compute one UTC time (say 08:00Z) and repeat it weekly, the meeting shows at 09:00 in winter but 10:00 after the March DST change, because the same UTC instant maps to a different wall-clock time. Precomputing each occurrence in UTC using today's rules avoids that but is still fragile: time zone rules are set by governments and change, sometimes at short notice, so a UTC value computed last year for a future date can become wrong.
>
> The user's intent is a wall-clock time in a place. Store exactly that: the local time (`09:00`), the recurrence rule (weekly on Monday), and the IANA zone ID (`Europe/Berlin`). Compute the instant of each occurrence when you need it, using current time zone data: for display, convert that instant into each viewer's own zone. `Temporal.ZonedDateTime` (or a library with zone support) does this, including resolving the edge cases where a local time does not exist or occurs twice on a transition day.
>
> "Store UTC" remains right for things that already happened, such as when a message was sent, because a past instant never changes. Offsets such as `+01:00` are not a substitute for the zone ID, since an offset says nothing about future DST changes.

### 22. A checkout form has `<input type="number" name="amount">` and reads it with `Number(input.value)`. German customers report that entering "12,50" sometimes submits an empty amount, and a shipping form rejects addresses without a ZIP code and names containing "ß" or an apostrophe. Explain what is wrong and how you would rebuild these inputs.

> The amount: `type="number"` accepts and displays decimals according to rules that differ between browsers and depend on the browser's or page's language, and when it considers the text invalid, `value` is an empty string with no error you can read. So "12,50" works in one browser and yields nothing in another. `Number('12,50')` is `NaN` in any case, because JavaScript's parser only understands a dot.
>
> Rebuild it as `<input type="text" inputmode="decimal">`, which gives a numeric keypad without the number input's behaviour, and parse the text yourself against the active locale: derive the group and decimal separators from `Intl.NumberFormat(locale).formatToParts()`, strip whitespace and group separators, replace the decimal separator with a dot, and validate the result. Show the parsed amount back to the user formatted with `Intl.NumberFormat`, so that a misinterpretation ("1,5" read as 15 under a US locale) is visible before they pay. Send the server an unambiguous value such as integer minor units.
>
> The address and name: the validation encodes one country's conventions. Ask for the country first and vary the form by country: postcode optional or absent, its format validated only for that country, no mandatory state, free-form address lines. Names should be a single full-name field that accepts any letters, marks, spaces, apostrophes, and hyphens, with a generous length limit and no forced capitalisation. Add `autocomplete` tokens so browsers fill the fields, accept phone numbers in any format and normalise them with libphonenumber, and make sure server-side validation and the database (UTF-8 throughout) accept the same input.

### 23. This "like" button uses an optimistic update. Describe two bugs and fix them.

```jsx
function LikeButton({ post }) {
  const [liked, setLiked] = useState(post.liked);

  async function toggle() {
    setLiked(!liked);
    await fetch(`/api/posts/${post.id}/like`, { method: 'POST', body: JSON.stringify({ liked: !liked }) });
  }

  return <button onClick={toggle} aria-pressed={liked}>Like</button>;
}
```

> Bug 1, no failure handling. `fetch` only rejects on network failure, and the code neither catches that nor checks `response.ok`. If the request fails, the button keeps showing the optimistic state forever, and the user believes an action succeeded that did not. An optimistic update needs a rollback and a message.
>
> Bug 2, races on rapid clicks. Two quick clicks send two requests that may arrive or complete out of order, so the server can end up with the opposite state from the UI. Either ignore clicks while a request is in flight, or make sure only the latest intent wins (abort the previous request, or send the desired final state and ignore stale responses).
>
> ```jsx
> function LikeButton({ post }) {
>   const [liked, setLiked] = useState(post.liked);
>   const [pending, setPending] = useState(false);
>   const [error, setError] = useState(null);
>
>   async function toggle() {
>     if (pending) return;
>     const previous = liked;
>     const next = !liked;
>     setLiked(next);
>     setPending(true);
>     setError(null);
>     try {
>       const res = await fetch(`/api/posts/${post.id}/like`, {
>         method: 'PUT',
>         headers: { 'Content-Type': 'application/json' },
>         body: JSON.stringify({ liked: next }),
>       });
>       if (!res.ok) throw new Error(`HTTP ${res.status}`);
>     } catch {
>       setLiked(previous);
>       setError('Could not update. Try again.');
>     } finally {
>       setPending(false);
>     }
>   }
>
>   return (
>     <>
>       <button onClick={toggle} aria-pressed={liked}>Like</button>
>       {error && <p role="alert">{error}</p>}
>     </>
>   );
> }
> ```
>
> Using an idempotent request that sets the desired state (rather than "toggle") makes retries and duplicates safe. In React 19, `useOptimistic` with an action handles the revert for you.

### 24. A production error report shows the stack `at t (app.3f9a1c.js:1:48213)`. Explain what source maps are, how you would set them up so the report shows original file names and lines, and what you should be careful about.

> Production JavaScript is bundled and minified, so positions in a stack trace refer to the generated file. A source map is a JSON file produced by the build that maps each generated position back to the original file, line, column, and name. A monitoring service that has the map for exactly that build can translate ("symbolicate") the stack into `saveDraft (src/editor/save.ts:42:11)`.
>
> Set-up: enable source map generation in the bundler; in CI, after building, upload the maps to the monitoring service using its CLI or bundler plugin, associated with a release identifier that the SDK also sends with each event (Sentry's plugins additionally inject debug IDs so each file is matched to its map exactly). Do this for every deploy, before the new code receives traffic, or early errors arrive unsymbolicated.
>
> Care points. The maps must correspond to the deployed files byte for byte, so upload from the same build that is deployed, not a rebuild. Decide whether to publish the maps: they expose your original source, so many teams generate "hidden" maps (no `sourceMappingURL` comment, files not deployed to the public server) and give them only to the monitoring service. Keep old releases' maps for as long as those versions can still be running in users' browsers. And remember that symbolication does not help with "Script error." from cross-origin scripts, which is a CORS problem.

### 25. You are reviewing a pull request that adds analytics to a site with EU users. Loading works like this. List the problems and describe a correct approach.

```html
<script async src="https://cdn.analytics.example/sdk.js"></script>
<script>
  window.addEventListener('load', () => {
    analytics.init('KEY');
    analytics.identify(user.email);
    analytics.track('Search', { query: searchInput.value, url: location.href });
    if (localStorage.getItem('consent') === 'yes') analytics.enableCookies();
  });
</script>
```

> Problems:
>
> 1. The SDK loads and sends data before any consent decision. Under ePrivacy rules, storing or reading identifiers on the device for analytics requires prior consent, and the request itself transmits the IP address and other data to a third party. The consent check only gates one feature, after tracking has already happened.
> 2. It identifies users by email address, which is directly identifying personal data sent to a vendor. Use an internal opaque id.
> 3. It sends the raw search query, which can contain names, addresses, or health terms, and the full URL, which may include tokens or ids in the query string.
> 4. It assumes `analytics` exists. If the script is blocked by a content blocker or fails to load, `analytics.init` throws and may break other code in the handler.
> 5. Calls are scattered inline rather than going through one module, so the rules cannot be enforced consistently.
>
> A correct approach: a consent module records a per-purpose choice (reject as easy as accept, revocable, honouring Global Privacy Control where applicable). The analytics SDK is injected only after analytics consent is given. All tracking goes through one wrapper that checks consent, tolerates the SDK being absent, strips or coarsens properties (query length instead of text, a route pattern instead of the full URL), and uses a pseudonymous id. Business-critical counts come from server-side data, since consented client data is incomplete by design. Policy details come from the organisation's privacy counsel; the code must implement them faithfully.

### 26. A team lead says "we deployed the new checkout behind a feature flag, so we are safe". Describe what else must be true for that claim to hold, covering rollout, measurement, the kill switch, and clean-up.

> A flag is only as safe as the process around it.
>
> Rollout: the flag defaults to off, and that default is what users get if the flag service is unreachable. Bucketing is deterministic and sticky per user, so people do not flip between old and new, and exposure increases in stages (internal, a few percent, 25, 50, 100) with time at each stage to observe. Anything security-relevant is also enforced on the server, because client flags only hide UI.
>
> Measurement: an exposure event records who actually saw which version; the success metric (orders completed) and guardrails (error rate, performance) can be compared between flagged and unflagged users; errors in monitoring are tagged with the flag state; and rollback thresholds were agreed before the rollout began.
>
> Kill switch: turning the flag off has been tested in production conditions, and the team knows how long it takes to reach every client. Clients that read flags only at page load will keep running the broken path in long-lived tabs, so updates must be streamed or polled, and the behaviour for a user who is mid-checkout when the switch flips has been decided. The old code path still works, which means it is still being tested in CI with the flag off.
>
> Clean-up: the flag has an owner and a removal date. Once the feature is at 100 percent and stable, the flag, the conditional, the legacy branch, and the exposure event are deleted and the flag is archived. Leftover flags multiply the states that need testing and have caused outages when stale flags were toggled or reused.

### 27. This row layout breaks when a user has a very long email address: the row becomes wider than the card and the "Remove" button is pushed out of view. Explain why and fix it.

```html
<li class="member">
  <img class="avatar" src="…" alt="" width="32" height="32" />
  <span class="email">a.very.long.address.with.no.spaces@subdomain.example-company.com</span>
  <button>Remove</button>
</li>
```

```css
.member { display: flex; align-items: center; gap: 12px; }
.email { flex: 1; }
```

> A flex item's default `min-width` is `auto`, which means it will not shrink below its content's minimum size. An email address has almost no break opportunities, so its minimum width is nearly the full string. `flex: 1` allows the span to shrink in principle, but `min-width: auto` forbids it, so the row overflows the card and the button is pushed out.
>
> Let the item shrink, then decide how the text should behave:
>
> ```css
> .email {
>   flex: 1;
>   min-width: 0;            /* allow shrinking below content width */
>   overflow-wrap: anywhere; /* wrap the long string onto more lines */
> }
> .member button { flex-shrink: 0; }
> ```
>
> If the design calls for a single line, truncate instead of wrapping: `overflow: hidden; white-space: nowrap; text-overflow: ellipsis;` and make the full address available elsewhere (a detail view, or at least a `title`), because two addresses that differ only at the end become indistinguishable. Add this case to the component's stress fixture so it stays fixed.

### 28. You have one afternoon and five volunteers to usability-test a new onboarding flow. Describe how you would run the sessions and how you would turn what you see into changes.

> Preparation: decide what you need to learn (can a new user get from sign-up to their first project without help?). Write three or four tasks as scenarios with a goal and no UI vocabulary, such as "You have just joined your team's workspace. Set things up so you can start tracking your first piece of work." Run a pilot on a colleague to catch broken tasks. Recruit people who resemble real users, not teammates who know the product.
>
> Running each session (about 30 minutes): explain that the product is being tested, not the participant, and ask them to think aloud. Record the screen and voice with consent. Give one task at a time, then stay quiet. Do not explain, hint, or defend the design; if asked what something does, ask what they would expect. Intervene only when someone is completely stuck, and note it as a failure. One person moderates and another takes notes with timestamps. Afterwards ask a few open questions about what was confusing.
>
> Capturing: record observations as behaviour, for example "P3 clicked 'Skip' looking for a way back, then abandoned", along with task success, hesitations, wrong turns, and quotes. Keep observations separate from interpretations and from solutions. Weight what people did above what they said they liked.
>
> Acting: straight after the last session, group observations across participants. Prioritise by frequency (how many of the five hit it) and severity (blocked, slowed, or just irritated). Turn the top three to five issues into tickets with a short video clip attached, which persuades better than a report. Fix them, then test again with new participants to confirm the fixes worked and to find the next layer of problems. Five people will not give you statistics, but they reliably expose the most serious problems in the flow you tested.
