# Web Performance: Practice test

### 1. Which set lists the three Core Web Vitals with their "good" thresholds at the 75th percentile?

- [ ] FCP ≤ 1.8 s, FID ≤ 100 ms, CLS ≤ 0.1
- [x] LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1
- [ ] LCP ≤ 4 s, INP ≤ 500 ms, CLS ≤ 0.25
- [ ] LCP ≤ 2.5 s, TBT ≤ 200 ms, CLS ≤ 0.1

> The Core Web Vitals are LCP, INP, and CLS, with good thresholds of 2.5 s, 200 ms, and 0.1. FID was replaced by INP in March 2024. The 4 s / 500 ms / 0.25 values are the boundaries of "poor", and TBT is a lab-only diagnostic metric, not a Core Web Vital.

### 2. A page scores 98 in Lighthouse but fails LCP in the Chrome UX Report. Which explanation is most plausible?

- [ ] CrUX is wrong; Lighthouse measures the real page
- [ ] Lighthouse scores are cached for 28 days
- [x] Real users have slower devices or networks, or see different content (such as a consent banner or personalised hero), than the lab run
- [ ] CrUX measures LCP from the first user interaction rather than navigation start

> Lab data is one synthetic load under fixed conditions; field data is the distribution of real visits. When they disagree, the field is the truth about what users experienced, and the usual causes are device, network, cache state, and content differences. It is CrUX, not Lighthouse, that uses a 28-day window.

### 3. What does this image markup do to LCP if it is the hero image at the top of the page?

```html
<img src="/hero.avif" loading="lazy" alt="" width="1600" height="800">
```

- [ ] Nothing; `loading="lazy"` only affects images below the fold
- [ ] It improves LCP by deferring other images
- [ ] It causes layout shift because lazy images have no reserved space
- [x] It delays LCP, because the browser waits until layout to decide whether to load a lazy image, and it loses the preload scanner's early fetch

> A lazy image cannot be fetched by the preload scanner; the browser must run layout first to know it is in the viewport. That adds resource load delay to the LCP element. The `width` and `height` are present, so space is reserved and there is no shift. The fix is to remove `loading="lazy"` and add `fetchpriority="high"`.

### 4. Which response header is correct for `/assets/app.8c1f3e.js`, where the hash changes whenever the content changes?

- [ ] `Cache-Control: no-cache`
- [ ] `Cache-Control: no-store`
- [x] `Cache-Control: public, max-age=31536000, immutable`
- [ ] `Cache-Control: max-age=0, must-revalidate`

> A content-hashed URL never changes its content, so it can be cached for a year and marked `immutable` so browsers skip revalidation even on reload. `no-cache` and `max-age=0` force a round trip on every use, and `no-store` prevents caching entirely. The HTML that references the hashed file is what should use `no-cache`.

### 5. What does `Cache-Control: no-cache` mean?

- [ ] The response must not be stored by any cache
- [x] The response may be stored, but must be revalidated with the server before each reuse
- [ ] The response may only be stored by the browser, not by CDNs
- [ ] The response is cached for the session only

> `no-cache` allows storage but requires revalidation (typically a conditional request answered with 304). The directive that forbids storage is `no-store`, and the one that restricts to the browser cache is `private`.

### 6. How many forced synchronous layouts does this loop cause for 100 items, and why?

```js
for (const item of items) {
  item.style.height = list.offsetHeight / items.length + 'px';
}
```

- [ ] None; the browser batches all style changes until the next frame
- [ ] One, on the first read
- [x] Up to 100; each write invalidates layout and the next iteration's `offsetHeight` read forces it to be recomputed
- [ ] 100, because writing `style.height` always runs layout immediately

> Writing a style only marks layout dirty. Reading a layout-dependent property while layout is dirty forces the browser to compute it synchronously. Alternating write then read on each iteration forces layout every time (after the first, which may already be clean). Reading `list.offsetHeight` once before the loop reduces it to a single layout at the next frame.

### 7. Explain the difference between TBT and INP, and why a page can have a good TBT but a poor INP.

> TBT (Total Blocking Time) is a lab metric: the sum of the portions of main-thread tasks beyond 50 ms between First Contentful Paint and Time to Interactive during a scripted page load. No interaction happens. INP (Interaction to Next Paint) is a field metric: across all real clicks, taps, and key presses during the page's life, roughly the slowest one, measured from input to the next frame painted.
>
> TBT only sees load-time blocking. A page can load with very little main-thread work and still have a click handler that runs 400 ms of synchronous code, re-renders a huge component tree, or triggers expensive layout. That interaction makes INP poor while TBT stays good. TBT is a useful proxy for the input-delay part of early interactions, but you must test actual interactions (and collect field data) to know INP.

### 8. Which animation can keep running smoothly while a long JavaScript task blocks the main thread?

- [ ] A CSS transition on `height`
- [ ] A `requestAnimationFrame` loop that sets `element.style.transform`
- [ ] A CSS animation on `background-color`
- [x] A CSS animation on `transform`

> CSS animations of `transform` and `opacity` can be handed to the compositor thread, which does not need the main thread to produce frames. `height` requires layout and `background-color` requires paint, both on the main thread. A `requestAnimationFrame` loop is JavaScript, so it cannot run while the main thread is blocked, even though it sets a compositable property.

### 9. A font is preloaded like this and the Network panel shows it downloaded twice. What is wrong?

```html
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2">
```

- [ ] `as="font"` should be `as="style"`
- [x] The `crossorigin` attribute is missing; fonts are fetched in CORS mode, so the non-CORS preload does not match the later request
- [ ] Fonts cannot be preloaded
- [ ] The `type` attribute makes the browser treat it as a different resource

> Font requests always use anonymous CORS mode, even on the same origin. A preload without `crossorigin` is fetched in a different mode, so the browser cannot reuse it for the real font request and fetches again. Adding `crossorigin` fixes it.

### 10. A server-rendered React page shows its content quickly, but for the first two seconds on a mid-range phone, tapping the menu button does nothing. What is the most likely cause?

- [ ] The server is still streaming the HTML
- [ ] The menu button's CSS has not loaded
- [x] The page has not hydrated yet: the JavaScript that attaches event handlers is still downloading or executing as a long task
- [ ] Server-rendered pages cannot handle clicks until the load event fires

> Server-rendered HTML is visible before it is interactive. Hydration downloads the component code, re-runs it, and attaches listeners, and it is usually the longest task of the load. Taps during it are delayed (high input delay, which hurts INP) or lost. Ship less client JavaScript (islands, server components), hydrate in smaller prioritised pieces, or defer non-critical islands.

### 11. Rewrite this click handler so the user sees feedback quickly, and explain what your change does to INP.

```js
button.addEventListener('click', () => {
  button.textContent = 'Saving…';
  const data = buildHugeReport();      // ~300 ms synchronous
  trackEvent('save_clicked', data);    // ~50 ms synchronous
  upload(data);
});
```

> ```js
> function yieldToMain() {
>   if (globalThis.scheduler?.yield) return scheduler.yield();
>   return new Promise((resolve) => setTimeout(resolve, 0));
> }
>
> button.addEventListener('click', async () => {
>   button.textContent = 'Saving…';
>   await yieldToMain();               // browser can paint the new label here
>   const data = buildHugeReport();
>   await yieldToMain();
>   trackEvent('save_clicked', data);
>   upload(data);
> });
> ```
>
> INP measures from the input to the next paint. In the original, the label change cannot be painted until the whole handler finishes, so the interaction takes 350 ms or more. Yielding right after the visual update ends the current task, letting the browser render a frame; the interaction's latency becomes just the short first part. The heavy work still blocks the main thread afterwards, so a second click during it would have high input delay. The better follow-up is to move `buildHugeReport` to a Web Worker or break it into chunks, and to schedule analytics at low priority.

### 12. In the CLS calculation, which statement is correct?

- [ ] CLS is the sum of every layout shift from page load to unload
- [ ] CLS counts every shift, including those caused by clicking a button
- [x] CLS is the largest "session window" of shifts, and shifts within 500 ms of a discrete user input are excluded
- [ ] CLS is measured in pixels moved

> Shifts are grouped into windows (shifts less than 1 s apart, a window lasting at most 5 s) and the worst window is reported, so long-lived pages are not penalised endlessly. Shifts shortly after user input are expected and excluded. The score is unitless: impact fraction multiplied by distance fraction.

### 13. Which change most directly reduces the "resource load delay" phase of LCP for a hero image?

- [ ] Compressing the image further
- [ ] Moving the image to a CDN
- [x] Putting the image in the initial HTML as an `<img>` with `fetchpriority="high"` instead of setting it from JavaScript
- [ ] Adding `decoding="async"`

> Resource load delay is the gap between the HTML arriving and the LCP resource starting to download. It is caused by late discovery (CSS backgrounds, JS-injected images, lazy loading) and low priority. Making the image discoverable by the preload scanner and high priority removes the delay. Compression and CDNs reduce load duration, a different phase.

### 14. What will the user see with this font configuration on a slow connection where the font takes 5 seconds to load, and what is the CLS risk?

```css
@font-face {
  font-family: 'Brand';
  src: url('/brand.woff2') format('woff2');
  font-display: swap;
}
body { font-family: 'Brand', Georgia, serif; }
```

- [ ] Invisible text for 3 seconds, then Georgia, then never Brand
- [ ] Invisible text for 5 seconds, then Brand
- [ ] Georgia permanently; Brand is used only on the next visit
- [x] Georgia immediately, then a swap to Brand at 5 seconds, which can shift layout if the two fonts have different metrics

> `swap` has an extremely short block period and an unlimited swap period: fallback text shows at once and is replaced whenever the font arrives. Because Georgia and Brand have different widths and line heights, text reflows at the swap. The first option describes something close to `fallback` after a long block, the second `block`, and the third `optional`. Metric overrides (`size-adjust`, `ascent-override`) on a fallback face reduce the shift.

### 15. Explain what the preload scanner is and name three ways developers accidentally defeat it.

> The preload scanner is a lightweight secondary HTML parser that runs ahead of the main parser. While the main parser is blocked (for example waiting for a script or stylesheet), the scanner reads the raw markup and starts fetching the resources it finds: images, scripts, stylesheets, and preloads. It is why resources referenced in HTML start downloading early.
>
> It only sees what is in the HTML markup as delivered. Ways to defeat it: setting the important image as a CSS `background-image` (it is found only after the CSS is downloaded and applied); injecting images or scripts with JavaScript, including client-side rendering the whole above-the-fold content; using `loading="lazy"` on above-the-fold images; using `data-src` with a JavaScript lazy-loader; chaining stylesheets with `@import`; and loading fonts referenced only from CSS. The fixes are to put critical resources in the markup, or to add a `<link rel="preload">` for those that cannot be.

### 16. A list page renders 8,000 rows and scrolling is janky. A colleague suggests virtualising. Which is a real cost of virtualisation you should raise?

- [ ] It increases memory use because rows are duplicated
- [x] Browser find-in-page and assistive technology cannot reach rows that are not in the DOM unless you add extra handling
- [ ] It prevents the list from being keyboard focusable at all
- [ ] It only works in React

> Virtualisation removes off-screen rows from the DOM, so Ctrl+F does not find them and screen readers do not know the list's size without ARIA attributes such as `aria-rowcount`. It reduces memory, works in any framework, and focus can be managed. `content-visibility: auto` or pagination may be a better trade for a few thousand rows.

### 17. What is the likely leak here, and how do you fix it?

```jsx
function Clock() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener('focus', () => setNow(Date.now()));
  }, []);
  return <time>{new Date(now).toLocaleTimeString()}</time>;
}
```

> The effect starts an interval and adds a `window` listener but returns no cleanup function. When `Clock` unmounts, the interval keeps firing and the listener stays registered. Both closures reference `setNow`, which keeps the component's internals alive, and each mount adds another timer and listener. Over many mounts the page accumulates timers, listeners, and retained memory.
>
> ```jsx
> useEffect(() => {
>   const tick = () => setNow(Date.now());
>   const id = setInterval(tick, 1000);
>   window.addEventListener('focus', tick);
>   return () => {
>     clearInterval(id);
>     window.removeEventListener('focus', tick);
>   };
> }, []);
> ```
>
> To confirm in DevTools: mount and unmount the component several times, force garbage collection, take a heap snapshot, and compare it with one taken before. The Comparison view shows closures growing by the number of mounts, and the Retainers pane shows the timer and the `window` listener holding them.

### 18. Which of these prevents a page from entering the back/forward cache in every major browser that enforces the rule, and is the recommended thing to remove first?

- [x] An `unload` event listener
- [ ] A `pagehide` event listener
- [ ] A `visibilitychange` event listener
- [ ] A `pageshow` event listener

> `unload` is unreliable and has historically made pages ineligible for bfcache; Chrome is also phasing the event out. `pagehide` and `visibilitychange` are the recommended replacements, and `pageshow` (with `event.persisted`) is how you detect a bfcache restore.

### 19. What does the `sizes` attribute do in this markup, and what happens if you omit it?

```html
<img srcset="a-400.jpg 400w, a-800.jpg 800w, a-1600.jpg 1600w"
     sizes="(min-width: 900px) 33vw, 100vw" src="a-800.jpg" alt="">
```

- [ ] It sets the rendered CSS width of the image; omitting it makes the image 0 pixels wide
- [ ] It lists the allowed file sizes in kilobytes
- [x] It tells the browser how wide the image will be displayed so it can choose a candidate before layout; omitted, the browser assumes `100vw` and often downloads a larger file than needed
- [ ] It is required only for the `<picture>` element

> With `w` descriptors the browser needs the slot width to choose, and it must choose before CSS is loaded. `sizes` supplies that. The default of `100vw` means a three-column layout on desktop would download an image three times wider than necessary. It does not affect the rendered size; CSS does.

### 20. You moved a 600 ms data transformation into a Web Worker, but the page still freezes for about 250 ms when the result arrives. What is the most likely cause?

- [ ] Workers run on the main thread unless created with `type: 'module'`
- [ ] `postMessage` is synchronous and blocks until the worker finishes
- [x] The result is a very large object, and structured cloning it across the thread boundary (plus rendering it) costs main-thread time
- [ ] The worker cannot access the DOM, so the browser reruns the code on the main thread

> `postMessage` copies data by structured clone, and deserialising a large object graph happens on the receiving thread. Send less (only what the UI needs), transfer `ArrayBuffer`s instead of copying, or keep the data in the worker and query it. Workers always run off the main thread and `postMessage` is asynchronous.

### 21. You are setting up Lighthouse CI. Explain why you would set `numberOfRuns` above 1, why you would assert on specific metrics instead of only the performance score, and what Lighthouse CI cannot tell you.

> Lab measurements vary between runs, especially on shared CI machines: CPU contention, network jitter, and timing differences shift metrics by 10% or more. Running several times and asserting on the median makes the check stable enough that a failure means something; a flaky gate gets ignored or disabled.
>
> The composite score is a weighted blend of several metrics passed through scoring curves. It can change for reasons unrelated to the pull request, and it hides which thing regressed. Asserting on LCP, CLS, TBT, and byte budgets individually gives a precise, actionable failure ("LCP exceeded 2500 ms") and lets you set strictness per metric (`error` for stable ones, `warn` for noisy ones).
>
> Lighthouse CI is lab-only. It performs a page load and does not interact, so it cannot measure INP; it sees only load-time CLS; it tests one emulated device and network; and it runs against a preview build without real third-party behaviour, real data, or real cache states. It catches regressions early, but only RUM tells you what users experience, so pair it with field monitoring and alerts.

### 22. What does `scheduler.yield()` offer over `setTimeout(fn, 0)` for breaking up a long task?

- [ ] It runs the continuation on a worker thread
- [ ] It guarantees the continuation runs before the next paint
- [ ] It is supported in every browser, whereas `setTimeout` is throttled
- [x] The continuation is queued ahead of other pending tasks, so your work resumes before unrelated scripts get a turn

> Both end the current task so the browser can handle input and render. With `setTimeout`, the continuation goes to the back of the task queue and other scripts may run first, stretching total time. `scheduler.yield()` prioritises the continuation. It is not available in Safari at the time of writing, so feature-detect and fall back to `setTimeout`.

### 23. A React form has an input at the top of a large page component, and typing is slow. Describe how you would diagnose it and two structural fixes you would try before adding `memo`.

> Diagnose with a production build. Record in the React DevTools Profiler while typing, with "record why each component rendered" enabled. Look at the commits per keystroke: which components rendered, how long each took, and why (state change in a parent, props changed, context changed). Also record a DevTools Performance trace with CPU throttling to see whether time goes to React rendering (processing duration) or to style and layout afterwards (presentation delay).
>
> The usual finding is that the input's state lives in the big page component, so each keystroke re-renders the entire tree.
>
> Structural fixes: (1) Colocate the state: move the input and its `useState` into a small child component so only it re-renders on each keystroke, and pass the value up only on submit or blur. (2) Pass expensive subtrees as `children` of the stateful component, so their elements are created by the parent and are not re-rendered when the wrapper's state changes. Others: split a large context so consumers of stable values do not re-render, or have components subscribe to slices of a store via selectors.
>
> If the heavy render is inherent (filtering a big list as you type), keep the input responsive with `useDeferredValue` or `useTransition`, and consider virtualising the list. Then apply `memo`, or enable React Compiler to memoise automatically.

### 24. Which statement about `content-visibility: auto` is correct?

- [ ] It removes off-screen elements from the DOM, like virtualisation
- [x] It lets the browser skip style, layout, and paint for off-screen subtrees while keeping them in the DOM, and needs `contain-intrinsic-size` to avoid scrollbar jumps
- [ ] It is equivalent to `display: none` until the element is scrolled into view, so the content is hidden from find-in-page
- [ ] It promotes the element to its own compositor layer

> The content stays in the DOM and remains reachable by find-in-page and assistive technology; only rendering work is skipped while off-screen. Without an intrinsic size, skipped sections are treated as zero height, which makes the scrollbar jump as they render.

### 25. Your RUM dashboard shows p75 LCP for the whole site jumped from 2.2 s to 3.0 s on Tuesday. No deploy happened that day. List the investigation steps you would take.

> 1. Check it is real: sample counts before and after, and whether the change is a step or noise.
> 2. Segment: by page template, device class, country, browser and version, connection type, and navigation type. If one segment explains it (for example mobile traffic from one country), the traffic mix may have changed, such as a campaign bringing new users, rather than the site getting slower.
> 3. Look for non-deploy changes on Tuesday: tag manager publishes, third-party script updates, A/B tests or feature flags switched on, CDN or cache configuration changes or a purge (check cache hit ratio and TTFB), a new consent banner, content changes such as an editor uploading a large hero image, and browser releases or metric definition changes.
> 4. Use attribution data: did the LCP element change? Which LCP phase grew: TTFB (server or CDN), resource load delay (discovery or priority), load duration (bigger image, slower host), or render delay (blocking script)?
> 5. Reproduce in the lab on an affected page and compare a trace and waterfall with a saved earlier one or with a build with the suspect flag or tag disabled.
> 6. Fix or roll back the cause, confirm recovery in RUM, and add monitoring for that class of change (for example alerting on TTFB or on third-party bytes, and recording flag and tag changes as dashboard annotations).

### 26. A site registers a service worker that handles navigations network-first. Field data shows TTFB for repeat visits got slightly worse after it shipped. Explain why, and how to fix it without giving up the service worker.

> When the user navigates and the service worker is not already running, the browser must start it (load and evaluate the script) before it can dispatch the `fetch` event. Only then does the handler call `fetch()` for the page. On a phone that startup can take tens to hundreds of milliseconds, and with a network-first strategy nothing is gained in return, so the delay is added straight to TTFB.
>
> Fix: enable navigation preload. In the `activate` handler call `self.registration.navigationPreload.enable()`. The browser then sends the navigation request in parallel with booting the worker, and the `fetch` handler uses `await event.preloadResponse` (falling back to `fetch(event.request)` when it is undefined). The network request no longer waits for worker startup.
>
> Other improvements: keep the service worker script small so it boots quickly; do not call `respondWith` for requests you do not need to handle; and consider serving a precached app shell or stale-while-revalidate HTML where slightly stale content is acceptable, which makes repeat navigations faster than the network instead of merely equal to it.

### 27. Which is the best use of `<link rel="preconnect">`?

- [ ] Adding one for every third-party origin the page might use
- [ ] Adding one for your own origin to speed up the HTML request
- [x] Adding one for the one or two cross-origin hosts that serve critical resources early in the load, such as the image CDN for the LCP image
- [ ] Replacing `preload` for same-origin fonts

> A preconnect performs DNS, TCP, and TLS ahead of time, saving a few hundred milliseconds on the first request to that origin. Each one costs CPU and competes for bandwidth, and unused connections are closed after a few seconds, so limit it to critical origins. Your own origin is already connected, and same-origin fonts need `preload`, not `preconnect`.
