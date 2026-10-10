# Web Performance: Guide

## Toolkit

### DevTools and tooling

- **Chrome DevTools Performance panel.** Opening it shows live LCP, CLS, and INP for the current page, and it can overlay CrUX field data for the same URL so you can see whether your machine resembles your users. Press record (or "Record and reload") for a trace: the Network, Frames, Interactions, Layout shifts, and Main tracks plus the Insights sidebar, which names the LCP phases, render-blocking requests, layout shift culprits, and forced reflows. Set CPU and network throttling in the panel's settings before you record.
- **Lighthouse** (DevTools panel, `npx lighthouse <url> --view`, or PageSpeed Insights). A lab audit on an emulated mid-range phone. Use it for diagnosis and regression checks, not as the measure of real experience.
- **PageSpeed Insights and CrUX.** PSI shows 28-day field data from the Chrome UX Report on top and a Lighthouse run below. CrUX Vis and the CrUX History API show the weekly trend.
- **Network panel.** Enable the Priority, Protocol, and Content-Encoding columns (right-click the header row). Check "Disable cache" for cold-load testing, and uncheck it when testing caching.
- **Coverage** (Command Menu, "Show Coverage"): unused bytes of JS and CSS on this page load.
- **Rendering tab** (Command Menu, "Show Rendering"): paint flashing, layout shift regions, layer borders, and a frame rate meter.
- **Memory panel**: heap snapshots, allocation timeline, and allocation sampling. **Performance monitor** shows live JS heap, DOM nodes, and listeners.
- **Application > Background services > Back/forward cache**: tests whether the page is bfcache-eligible and lists the reasons if not.
- **WebPageTest**: real devices and locations, filmstrips, and a waterfall you can share by URL.
- **`web-vitals`** library for field measurement, and the Web Vitals extension's successor features now built into the Performance panel.
- **Bundle tools**: `rollup-plugin-visualizer` or `vite-bundle-visualizer` for treemaps, `source-map-explorer` for any bundle with source maps, `size-limit` for budgets.
- **React DevTools Profiler** for commit-by-commit render timing and "why did this render".

### Testing and verifying your work

Performance work is done when field data improves, not when a Lighthouse score goes up. The loop is: measure, form a hypothesis about the bottleneck, change one thing, measure again.

In the lab, make runs comparable. Use an Incognito window or a clean profile so extensions do not pollute the trace, fix the throttling settings (4x CPU slowdown or a calibrated "mid-tier mobile" preset, and Slow 4G), and run several times, since single runs vary by 10% or more. Lighthouse CI takes the median of several runs for this reason. Compare traces before and after rather than scores: did the LCP request start earlier, did the long task shrink, did the layout shift disappear from the Layout shifts track?

For load changes, test both cold cache ("Disable cache" on, or "Clear site data") and warm cache (repeat visit), and test a back navigation for bfcache. For interaction changes, record the interaction under CPU throttling and read the Interactions track: input delay, processing duration, and presentation delay should each be accounted for.

In the field, ship the `web-vitals` attribution build and watch the 75th percentile per page type and device class for at least a week before and after. CrUX is a 28-day rolling window, so a fix takes up to four weeks to show fully there; your own RUM shows it the same day.

"Done" for a page is: LCP at or under 2.5 s, INP at or under 200 ms, and CLS at or under 0.1 at the 75th percentile on mobile, a budget in CI that fails a pull request which regresses them, and a written note of what was changed and what it moved.

### Tricks and gotchas

- Your development machine is several times faster than the median phone. An interaction that takes 40 ms on your laptop can take 300 ms on a budget Android device. Always throttle CPU.
- DevTools "Disable cache" only applies while DevTools is open, and it hides caching bugs. Turn it off to test repeat visits.
- `loading="lazy"` on the LCP image is one of the most common LCP regressions. So is an LCP image set as a CSS `background-image`, which the preload scanner cannot see.
- Preloading is a zero-sum reprioritisation. Preload three fonts and five images and you have delayed the thing that mattered.
- A `preload` for a font without `crossorigin` is fetched twice.
- Lighthouse's TBT correlates with INP but is not INP. A page with a perfect TBT can still have a slow click handler.
- CLS in the field accumulates over the whole page life; Lighthouse only sees the load. If field CLS is bad and lab CLS is zero, look at shifts after scrolling or interaction.
- `will-change` on many elements uses GPU memory and can make things slower. Add it just before an animation and remove it afterwards.
- Reading `offsetHeight`, `getBoundingClientRect()`, or `getComputedStyle()` after a style write forces a synchronous layout. In a loop, that is layout thrashing.
- `console.log` of large objects in hot paths, and DevTools itself being open, distort timings and retain objects in memory.
- An `unload` listener (often added by an old third-party script) makes a page ineligible for bfcache in Firefox and is being phased out in Chrome. Use `pagehide`.
- Measure with the production build. Development builds of React and other frameworks are several times slower.
- Averages hide the problem. Report the 75th percentile, and look at the 95th when hunting.

### Official references

- [web.dev: Learn Performance](https://web.dev/learn/performance) - the structured course covering loading, images, fonts, JavaScript, and workers.
- [web.dev: Web Vitals](https://web.dev/articles/vitals) - definitions and thresholds for the Core Web Vitals.
- [Chrome DevTools: Performance panel reference](https://developer.chrome.com/docs/devtools/performance/reference) - every track, setting, and shortcut in the panel.
- [Chrome for Developers: CrUX documentation](https://developer.chrome.com/docs/crux) - how field data is collected, and the API, BigQuery, and history datasets.
- [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) - which metrics make up the score and their weights.
- [MDN: Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API) - `PerformanceObserver`, entry types, and User Timing.
- [GoogleChrome/web-vitals](https://github.com/GoogleChrome/web-vitals) - the library that measures the vitals the way Chrome's tools do.
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) - the caching model, freshness, and validation.
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html) - the normative definition of `Cache-Control` semantics.
- [High Performance Browser Networking](https://hpbn.co/) - Ilya Grigorik's free book on TCP, TLS, HTTP/2, and mobile networks.

## Skills

### Why it matters

Speed changes behaviour. People abandon pages that take too long to show content, complete fewer purchases when interactions lag, and return less often to sites that feel slow. The published case studies are consistent: retailers and publishers that cut LCP or INP report measurable gains in conversion, bounce rate, and pages per session. You do not need to quote someone else's number, though; the convincing version is your own data, with conversion rate plotted against LCP bucket from your RUM.

Performance is also an inclusion issue. The devices your team uses are not the devices most people own. A mid-range Android phone has a fraction of the single-core performance of a current iPhone or laptop, and many users are on congested mobile networks with high latency. JavaScript-heavy pages that are fine on fast hardware become unusable on slow hardware, and the people affected are disproportionately those with less money, in rural areas, or in emerging markets. Slow pages also cost users battery and data.

Finally, Core Web Vitals are a (modest) ranking signal in Google Search through the page experience system, and they are evaluated on field data at the 75th percentile, so your slowest quarter of visits is what counts.

The mistake to avoid is treating performance as a one-off project. It regresses with every feature unless something (a budget, a CI check, a dashboard someone looks at) holds the line.

**Try it:** Open one of your own projects in Chrome with DevTools set to 6x CPU slowdown and "Slow 4G", cache disabled. Use it for five minutes as a real user would: navigate, type, open menus. Write down every moment you waited or were unsure whether a click registered.

**Resources**
- [web.dev: Why does speed matter?](https://web.dev/learn/performance/why-speed-matters)
- [web.dev: The business impact of Core Web Vitals](https://web.dev/case-studies/vitals-business-impact)
- [WPO Stats: case studies linking performance to business metrics](https://wpostats.com/)

### Core Web Vitals

Three field metrics, each judged at the 75th percentile of page views, split by mobile and desktop.

| Metric | Measures | Good | Poor |
| --- | --- | --- | --- |
| LCP (Largest Contentful Paint) | When the largest image or text block in the viewport rendered | ≤ 2.5 s | > 4 s |
| INP (Interaction to Next Paint) | Latency of the slowest click, tap, or key press, from input to the next frame painted | ≤ 200 ms | > 500 ms |
| CLS (Cumulative Layout Shift) | How much visible content moved unexpectedly | ≤ 0.1 | > 0.25 |

Details that matter. LCP candidates are images, video posters, elements with a CSS background image, and block-level text; the candidate can change as the page loads, and reporting stops at the first user interaction. INP replaced First Input Delay in March 2024. It observes every interaction over the page's life and reports roughly the worst one (for pages with many interactions, one outlier per 50 is ignored). Scrolling and hovering are not interactions. CLS is not a sum over the whole visit: shifts are grouped into session windows (gaps under 1 s, at most 5 s long) and the largest window is reported. Shifts within 500 ms of a user input are excluded, and each shift's score is impact fraction times distance fraction, so it is unitless.

All three are measured for the top-level page including its iframes in CrUX, but JavaScript in your page cannot see inside cross-origin iframes, which is one reason your RUM and CrUX differ.

Browser support: LCP and INP became measurable in all major engines when Safari 26.2 shipped the Largest Contentful Paint and Event Timing APIs in December 2025. The Layout Instability API behind CLS is still Chromium-only.

**Try it:** Open the Performance panel on any news site without recording. Read the live LCP, CLS, and INP values, click the LCP element link to see which node it is, then interact with a menu and watch INP update with the interaction's phases.

**Resources**
- [web.dev: Web Vitals](https://web.dev/articles/vitals)
- [web.dev: Interaction to Next Paint](https://web.dev/articles/inp)
- [web.dev: How the Core Web Vitals thresholds were defined](https://web.dev/articles/defining-core-web-vitals-thresholds)

### Other metrics

These are diagnostic metrics: they explain a Core Web Vital rather than describe the experience by themselves.

- **TTFB (Time to First Byte)**: from navigation start to the first byte of the HTML response. It includes redirects, service worker startup, DNS, connection, TLS, and server time. Good is 800 ms or less. Every loading metric sits on top of TTFB, so a 1.8 s TTFB makes a 2.5 s LCP nearly impossible. Fix it with CDN caching of HTML, fewer redirects, and faster server rendering.
- **FCP (First Contentful Paint)**: first text or image painted. Good is 1.8 s or less. A large gap between TTFB and FCP points at render-blocking CSS or scripts in the `<head>`. A large gap between FCP and LCP points at a late-discovered or slow LCP resource.
- **TBT (Total Blocking Time)**: a lab metric. For every main-thread task longer than 50 ms between FCP and Time to Interactive, sum the portion over 50 ms. A 120 ms task contributes 70 ms. Lighthouse weights it at 30% of the performance score because it is the best lab proxy for responsiveness, but it measures load-time blocking only and no real interaction.
- **Speed Index**: how quickly the viewport filled in visually, from a filmstrip. Useful for comparing two builds of the same page.

Read them as a chain: TTFB, then FCP, then LCP. Find the largest gap and work there. Do not optimise a diagnostic metric for its own sake; a faster FCP that shows a spinner sooner has not helped anyone.

```js
const [nav] = performance.getEntriesByType('navigation');
console.log('TTFB', nav.responseStart, 'DOMContentLoaded', nav.domContentLoadedEventEnd);
```

**Try it:** Run Lighthouse on a page and write down TTFB, FCP, LCP, and TBT. Compute the three gaps (0 to TTFB, TTFB to FCP, FCP to LCP) and state, for the largest, what kind of problem it suggests.

**Resources**
- [web.dev: Time to First Byte](https://web.dev/articles/ttfb)
- [web.dev: Total Blocking Time](https://web.dev/articles/tbt)
- [web.dev: First Contentful Paint](https://web.dev/articles/fcp)

### Lab vs field data

Lab data comes from one synthetic page load in a controlled environment: Lighthouse, WebPageTest, a DevTools trace. Field data (real-user monitoring, RUM) comes from actual visits. The Chrome UX Report (CrUX) is the public field dataset: opted-in Chrome users, aggregated over a rolling 28 days, reported at the 75th percentile per origin and, for popular enough pages, per URL. It is what Search uses and what PageSpeed Insights shows at the top.

They disagree for understandable reasons:

- **Device and network.** Lighthouse emulates one mid-range phone on throttled 4G. Your users are a distribution, and it may be faster or slower than that.
- **Cache and navigation type.** Lab loads are cold. Real visits include warm caches, bfcache restores, and prerendered pages, all of which make field LCP better.
- **Interaction.** The lab does not click anything, so it has no INP, and it only sees layout shifts during load. Field CLS includes shifts after scrolling.
- **Content.** Logged-in state, consent banners, personalisation, A/B tests, and ads change which element is the LCP.
- **The LCP element itself** can differ by viewport size.

Use each for what it is good at. The field tells you whether there is a problem and for whom; the lab lets you reproduce and debug it. When they conflict, the field wins, because it is the experience people had. A Lighthouse score of 100 with failing CrUX data means your lab setup is not representative. A poor Lighthouse score with passing CrUX data usually means your real users have better devices than the emulated one.

Sites with too little Chrome traffic have no CrUX data; you need your own RUM.

**Try it:** Run PageSpeed Insights on a popular site. Compare the field LCP and CLS at the top with the lab values below, and list two concrete reasons that could explain each difference.

**Resources**
- [web.dev: Why lab and field data can be different](https://web.dev/articles/lab-and-field-data-differences)
- [Chrome for Developers: CrUX methodology](https://developer.chrome.com/docs/crux/methodology)

### Real user monitoring

The `web-vitals` library (version 5 at the time of writing) measures the vitals the same way Chrome's tools do and handles the edge cases: bfcache restores, prerendered pages, background tabs, and when a metric is final.

```js
import { onCLS, onINP, onLCP } from 'web-vitals/attribution';

function send(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,          // 'good' | 'needs-improvement' | 'poor'
    id: metric.id,                  // unique per page load, for de-duplication
    navigationType: metric.navigationType,
    page: location.pathname,
    target: metric.attribution.interactionTarget ?? metric.attribution.target,
  });
  navigator.sendBeacon('/vitals', body);
}

onCLS(send); onINP(send); onLCP(send);
```

Callbacks fire when the value is final, which for CLS and INP is when the page is hidden, so the library reports on `visibilitychange`. Use `navigator.sendBeacon` or `fetch` with `keepalive: true`; an ordinary request may be cancelled as the page goes away. A metric can report more than once (for example after a bfcache restore), so store by `id` and keep the latest value.

The attribution build is what makes RUM actionable: for LCP it gives the element and the four phase durations, for INP the target selector, interaction type, the three phases, and the Long Animation Frame entries, for CLS the largest shift's element.

Analyse by percentile, never by mean. Report p75 to match CrUX, and segment by page template, device class, connection type (`navigator.connection.effectiveType` where available), and navigation type. A global p75 hides that your product page is fine and your search page is failing. Sample if volume is high, but sample by session, not by event.

Remember that CLS is not measurable in Safari or Firefox, so your CLS data is Chromium-only.

**Try it:** Add the snippet to a project with `send` replaced by `console.log`. Load the page, click something, then switch tabs to trigger the final reports. Read the `attribution` object for each metric.

**Resources**
- [GoogleChrome/web-vitals: README](https://github.com/GoogleChrome/web-vitals)
- [web.dev: Best practices for measuring Web Vitals in the field](https://web.dev/articles/vitals-field-measurement-best-practices)
- [web.dev: Debug performance in the field](https://web.dev/articles/debug-performance-in-the-field)

### Performance panel

A trace is a recording of everything the browser did. Use "Record and reload" for load problems and plain record for interactions: start, perform the interaction once, stop. Keep recordings short.

Read it top to bottom. The overview strip shows CPU activity coloured by category (yellow scripting, purple rendering, green painting) and screenshots. Below it:

- **Network**: each request as a bar. The thin left whisker is queueing and connection, the solid part is download. Priority is shown on hover; render-blocking requests are flagged.
- **Frames** and **Animations**: dropped or partially presented frames.
- **Interactions**: one bar per interaction, with whiskers for input delay and presentation delay. Bars over 200 ms are flagged.
- **Layout shifts**: clusters of shifts; click one to see which elements moved.
- **Main**: a flame chart of main-thread tasks. Width is time, depth is the call stack. A grey bar with a red hatched corner is a long task (over 50 ms); the hatched part is the blocking portion.

The bottom drawer has Summary, Bottom-up (self time aggregated by function, the fastest route to "what is expensive"), Call tree, and Event log. The Insights sidebar turns the trace into findings: LCP by phase, LCP request discovery, render-blocking requests, layout shift culprits, forced reflow, third parties, and so on, and clicking one highlights the relevant region.

Practical habits: enable throttling first, select a range by dragging in the overview, use W/A/S/D to zoom and pan, tick "Dim 3rd parties" to focus on your own code, and add your own `performance.measure()` calls so they appear in the Timings track. Save traces (the download icon) to attach to bug reports and compare before and after.

**Try it:** Record a reload of a content-heavy site with 4x CPU slowdown. Find the LCP marker, the longest task in the Main track, and use Bottom-up to name the function with the largest self time.

**Resources**
- [Chrome DevTools: Analyze runtime performance](https://developer.chrome.com/docs/devtools/performance)
- [Chrome DevTools: Performance features reference](https://developer.chrome.com/docs/devtools/performance/reference)

### Test like your users

Your laptop on office Wi-Fi is the best case your site will ever see. Find out what your users have (your analytics or RUM gives device models, and CrUX gives the connection-type and device split) and test against the 75th percentile of that, not against yourself.

In DevTools, the Performance panel's settings offer CPU throttling as a fixed multiplier (4x, 6x, 20x) and as calibrated presets ("low-tier mobile", "mid-tier mobile") that DevTools computes by benchmarking your machine, which is more meaningful than a fixed number on a fast laptop. Network presets (Fast 4G, Slow 4G, 3G) add latency and cap throughput. Lighthouse's mobile run uses a simulated slow 4G connection and a 4x CPU slowdown.

Throttling is an approximation. It slows the main thread uniformly but does not reproduce a phone's slower storage, thermal throttling, small caches, memory pressure, or GPU. So keep one real mid-range Android phone on your desk. Connect it by USB, enable USB debugging, open `chrome://inspect/#devices` on your computer, and you get full DevTools, including Performance traces, against the real device. For iOS, use Safari's Web Inspector with a connected iPhone.

Other conditions worth reproducing: a cold cache and a warm cache, a logged-in user with real data volumes, the consent banner shown (it is often the LCP element or a CLS source for first-time visitors), a long session rather than a fresh load, and low-memory situations where the browser discards tabs.

WebPageTest runs tests on real devices in real locations if you do not own the hardware.

**Try it:** Connect an Android phone via `chrome://inspect`, record a Performance trace of one interaction in your app, then record the same interaction on desktop with 4x throttling. Compare the processing durations.

**Resources**
- [Chrome DevTools: Remote debug Android devices](https://developer.chrome.com/docs/devtools/remote-debugging)
- [Chrome DevTools: Performance reference, throttling](https://developer.chrome.com/docs/devtools/performance/reference)
- [WebPageTest](https://www.webpagetest.org/)

### Performance APIs

The browser exposes its timing data as performance entries, and `PerformanceObserver` is how you subscribe to them.

```js
const po = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.entryType, entry.name, entry.startTime, entry.duration);
  }
});
po.observe({ type: 'long-animation-frame', buffered: true });
```

`buffered: true` delivers entries recorded before the observer was created, which matters because your script runs after much of the load. Use one `observe()` call per `type`. Useful types: `navigation` and `resource` (network timing per request; cross-origin details require the `Timing-Allow-Origin` header), `paint`, `largest-contentful-paint`, `layout-shift`, `event` (Event Timing, the raw data for INP), `longtask`, and `long-animation-frame`. Check `PerformanceObserver.supportedEntryTypes` before observing.

**User Timing** lets you add your own entries, which then show up in DevTools traces and can be sent to RUM:

```js
performance.mark('search:start');
await runSearch(query);
performance.measure('search', { start: 'search:start', detail: { query } });
```

**Long Animation Frames (LoAF)** replaces Long Tasks for diagnosing responsiveness. An entry is reported for any frame taking over 50 ms and includes `blockingDuration`, `renderStart`, `styleAndLayoutStart`, and a `scripts` array attributing time to specific scripts: source URL, function name, invoker (for example `BUTTON#save.onclick`), and `forcedStyleAndLayoutDuration`. That is enough to say which script made an interaction slow in the field. LoAF is Chromium-only at the time of writing, so treat it as diagnostic data from a subset of users.

All timestamps are `DOMHighResTimeStamp` values relative to `performance.timeOrigin`; use `performance.now()`, not `Date.now()`, for durations.

**Try it:** Paste the observer above into the console of a heavy web app, interact for a minute, and for the worst entry read `scripts[0].sourceURL`, `invoker`, and `duration`.

**Resources**
- [MDN: PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
- [MDN: User timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/User_timing)
- [Chrome for Developers: Long Animation Frames API](https://developer.chrome.com/docs/web-platform/long-animation-frames)

### Critical rendering path

To paint anything the browser must parse HTML into the DOM, fetch and parse CSS into the CSSOM, combine them into the render tree, run layout, and paint. Two kinds of resources stall that sequence.

**Render-blocking**: stylesheets. The browser will not paint until every `<link rel="stylesheet">` in the `<head>` whose `media` matches has downloaded and parsed, because painting unstyled content and then restyling it is worse. **Parser-blocking**: classic `<script>` tags without `async` or `defer`. The parser stops, the script downloads and runs, and it must also wait for any pending stylesheet above it, since the script might read styles.

The preload scanner softens this: a secondary parser scans ahead in the raw HTML and starts fetching resources it finds. It only sees what is in the markup. Anything injected by JavaScript, referenced from CSS (background images, fonts, `@import`), or hidden behind a data attribute is discovered late.

Unblocking:

- Use `defer` (ordered, runs after parsing) or `type="module"` (deferred by default) for scripts. Use `async` only for independent scripts.
- Keep CSS small and in as few requests as possible. Avoid `@import` in CSS, which creates a serial chain. Split by `media` so print styles do not block.
- Inlining the CSS needed for the first viewport removes a request, at the cost of not caching it. It helps most on single-visit landing pages.
- Server-render the HTML for the first view so content does not depend on a JavaScript bundle.
- Send the HTML early and streamed. The first roughly 14 KB arrives in the initial congestion window, so put the `<head>` and critical markup there.

```html
<link rel="stylesheet" href="/app.css">
<link rel="stylesheet" href="/print.css" media="print">
<script src="/app.js" defer></script>
```

**Try it:** In the Network panel, right-click a stylesheet and choose "Block request URL", reload, and see what renders. Then record a trace and open the "Render-blocking requests" insight to see each blocking resource.

**Resources**
- [web.dev: Understanding the critical path](https://web.dev/learn/performance/understanding-the-critical-path)
- [web.dev: Critical rendering path](https://web.dev/articles/critical-rendering-path)
- [MDN: The script element, async and defer](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script)

### Resource hints

Hints tell the browser about work it could not discover early by itself.

- **`preconnect`** opens DNS, TCP, and TLS to an origin ahead of the first request. Use it for one or two critical cross-origin hosts (your image CDN, your font host). Connections cost CPU and are closed if unused within about 10 seconds. **`dns-prefetch`** does the DNS step only and is a cheap fallback.
- **`preload`** fetches a specific resource at high priority now. It needs a correct `as` (otherwise it is double-fetched or mis-prioritised), and fonts need `crossorigin` even on the same origin. Use it for late-discovered critical resources: a font referenced from CSS, a hero image set in CSS. `modulepreload` is the equivalent for ES modules.
- **`fetchpriority`** (`high`, `low`, `auto`) adjusts priority relative to the default for that resource type. It is available in all major browsers. Images start at low priority, so `fetchpriority="high"` on the LCP `<img>` is one of the cheapest wins there is.
- **Speculation rules** replace `<link rel="prerender">` and most uses of `rel="prefetch"` for navigations. A JSON script tells the browser which links to prefetch (fetch the document) or prerender (load and render it fully in a hidden tab so navigation is instant).

```html
<link rel="preconnect" href="https://img.example-cdn.com">
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<img src="/hero.avif" fetchpriority="high" alt="" width="1200" height="600">
<script type="speculationrules">
{ "prerender": [{ "where": { "href_matches": "/products/*" }, "eagerness": "moderate" }] }
</script>
```

`eagerness` runs from `conservative` (on pointer down) through `moderate` (on hover) to `eager` and `immediate`. Speculation rules ship in Chromium browsers; elsewhere they are ignored, so they are a safe progressive enhancement. Exclude URLs with side effects such as logout or add-to-cart, and make analytics prerender-aware.

The common mistake is overuse. Every hint takes bandwidth and priority from something else.

**Try it:** Add `fetchpriority="high"` to a hero image, then compare the Priority column and request start time in the Network panel before and after under Slow 4G.

**Resources**
- [web.dev: Assist the browser with resource hints](https://web.dev/learn/performance/resource-hints)
- [web.dev: Optimize resource loading with the Fetch Priority API](https://web.dev/articles/fetch-priority)
- [Chrome for Developers: Prerender pages for instant navigations](https://developer.chrome.com/docs/web-platform/prerender-pages)

### Optimise LCP

First identify the element. The Performance panel's live view and the "LCP by phase" insight name it; in the field, `web-vitals` attribution reports its selector. It is often not what you assume: a cookie banner paragraph, a heading, or a different image on mobile.

LCP time splits into four phases, and each has its own fixes:

1. **Time to First Byte.** Cache HTML at the CDN, remove redirects, speed up the server. Nothing can start before the HTML arrives.
2. **Resource load delay**: from TTFB until the LCP resource starts downloading. This is usually the largest and most fixable phase. The image must be discoverable in the HTML source as an `<img>` with `src`/`srcset` (not a CSS background, not injected by JavaScript, not `loading="lazy"`), and marked `fetchpriority="high"`. If it must come from CSS or JS, preload it.
3. **Resource load duration**: download time. Serve a correctly sized AVIF or WebP from a CDN, on the same origin or a preconnected one.
4. **Element render delay**: from download finished to painted. Caused by render-blocking CSS, by JavaScript that must run before the element exists (client-side rendering), or by a busy main thread. Server-render the element and keep blocking resources small.

For a text LCP there is no resource; the phases collapse to TTFB plus render delay, and web fonts with `font-display: block` are the usual culprit.

A good target is for the resource to start loading immediately after the HTML arrives, with load delay and render delay near zero. Client-rendered pages where the image URL is only known after an API call fail this by construction; move that data into the initial HTML.

```html
<link rel="preload" as="image" href="/hero-800.avif"
      imagesrcset="/hero-800.avif 800w, /hero-1600.avif 1600w" imagesizes="100vw"
      fetchpriority="high">
```

**Try it:** Record a reload trace of a page with a hero image, open the "LCP by phase" insight, and note the four durations. Fix the largest one and record again.

**Resources**
- [web.dev: Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp)
- [web.dev: Largest Contentful Paint](https://web.dev/articles/lcp)

### Images

Images are usually the largest share of page weight and usually the LCP element. Four things to get right.

**Format.** AVIF compresses best for photographs and is supported in all current browsers; WebP is a solid fallback; JPEG and PNG are the legacy baseline. Use SVG for icons and logos. Let `<picture>` or, better, an image CDN's content negotiation on the `Accept` header choose.

**Size.** Never send a 2400-pixel image to a 400-pixel slot. Provide several widths with `srcset` and tell the browser the rendered width with `sizes`, so it can pick before layout:

```html
<img
  src="/img/shoe-800.jpg"
  srcset="/img/shoe-400.jpg 400w, /img/shoe-800.jpg 800w, /img/shoe-1600.jpg 1600w"
  sizes="(min-width: 900px) 50vw, 100vw"
  width="800" height="600" alt="Blue running shoe"
  loading="lazy" decoding="async">
```

A wrong `sizes` (the default is `100vw`) makes the browser download far more than it needs. Cap at 2x device pixel ratio; 3x is not visibly better.

**Dimensions.** Always set `width` and `height` (or `aspect-ratio`) so the browser reserves space before the image loads. This is the main CLS defence.

**Laziness.** `loading="lazy"` defers images until they approach the viewport. Apply it to everything below the fold, and never to the LCP image or anything in the first viewport.

An **image CDN** (Cloudinary, imgix, Cloudflare Images, or your framework's image component backed by one) does resizing, format negotiation, and quality tuning from URL parameters, which is far more reliable than a build step. Framework components such as `next/image` generate the `srcset` and enforce dimensions for you.

Also check: animated GIFs (replace with `<video muted autoplay loop playsinline>`), and unoptimised SVGs (run SVGO).

**Try it:** Take a large JPEG into Squoosh, export AVIF and WebP at visually equal quality, and compare sizes. Then use the DevTools Network panel to check which `srcset` candidate a page actually downloads at two viewport widths.

**Resources**
- [web.dev: Learn Images](https://web.dev/learn/images)
- [web.dev: Image performance](https://web.dev/learn/performance/image-performance)
- [MDN: Responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images)

### Fonts

Web fonts cause two problems: text that is invisible or late (hurting FCP and LCP) and text that reflows when the font arrives (hurting CLS).

`font-display` sets the behaviour while the font loads. `block` hides text for up to about 3 seconds. `swap` shows fallback text immediately and swaps whenever the font arrives, which is good for LCP and risky for CLS. `fallback` gives a very short block period and a roughly 3 second swap window, after which the fallback stays. `optional` gives a very short block period and no swap: the font is used only if it is already available, which means no layout shift at all, at the price of first-time visitors seeing the fallback.

Reduce the cost of the swap by making the fallback occupy the same space, using metric overrides on a local fallback face:

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin.woff2') format('woff2');
  font-display: swap;
  unicode-range: U+0000-00FF, U+2000-206F;
}
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
body { font-family: 'Inter', 'Inter Fallback', sans-serif; }
```

Tools such as Fontaine, Capsize, and `next/font` compute those numbers for you.

Load fewer bytes: WOFF2 only, subset to the scripts you use (`unicode-range` lets the browser skip subsets it does not need), and prefer one variable font over many static weights. Self-host; since browsers partitioned their caches by site, a shared font CDN gives no cross-site cache benefit and costs an extra connection. Preload only the one or two fonts used above the fold, with `crossorigin`.

A system font stack has zero cost and is a legitimate choice for UI text.

**Try it:** On a page with a web font, set "Slow 4G", reload, and watch the text. Change `font-display` between `block`, `swap`, and `optional` and note what you see and what the Layout shifts track records.

**Resources**
- [web.dev: Optimize web fonts](https://web.dev/learn/performance/optimize-web-fonts)
- [web.dev: Best practices for fonts](https://web.dev/articles/font-best-practices)
- [Chrome for Developers: Improved font fallbacks](https://developer.chrome.com/blog/font-fallbacks)

### JavaScript cost

JavaScript is the most expensive resource per byte. After download it must be parsed, compiled, and executed on the main thread, and on a slow phone execution dominates. Compression helps transfer size only; 300 KB of gzipped script is over a megabyte to parse.

**Ship less.** Audit dependencies with a bundle treemap. Typical findings: a date library where `Intl` would do, an entire utility library imported for two functions, two versions of the same package, polyfills for browsers you no longer support, and a large library used on one route but loaded on all. Check a package's cost before adding it. Use ES module builds and named imports so tree shaking works, and mark your own packages `"sideEffects": false` where true.

**Split.** A dynamic `import()` creates a separate chunk loaded on demand. Split by route first (frameworks do this for you), then by interaction for heavy widgets:

```js
button.addEventListener('click', async () => {
  const { openEditor } = await import('./editor.js');
  openEditor();
});
```

Preload the chunk on hover or when the button scrolls into view so the click does not wait on the network.

**Defer.** Use `defer` or modules, load non-critical code after the page is interactive, and consider whether the code is needed on the client at all. Choosing a rendering strategy that hydrates less removes whole categories of client JavaScript; see "Rendering strategy and performance".

**Remove.** The Coverage panel shows bytes unused during a page load. Unused on load does not mean unused, but 60% unused in the main bundle means the split points are wrong.

Set your build target to current browsers so you do not transpile modern syntax into larger, slower code.

**Try it:** Run `npx vite-bundle-visualizer` (or your bundler's equivalent) on a project. Identify the three largest modules and, for each, decide whether to remove, replace, or lazy-load it.

**Resources**
- [web.dev: Code-split JavaScript](https://web.dev/learn/performance/code-split-javascript)
- [Chrome DevTools: Coverage, find unused JavaScript and CSS](https://developer.chrome.com/docs/devtools/coverage)
- [Vite: Building for production](https://vite.dev/guide/build)

### Rendering strategy and performance

Where and when HTML is produced decides what LCP and INP can be before you optimise anything else.

- **Client-side rendering (CSR)**: the server sends an empty shell; content appears after the bundle downloads, runs, and usually fetches data. TTFB is fast, but LCP waits on JavaScript, and the LCP resource is invisible to the preload scanner.
- **Static generation (SSG)**: HTML is built ahead of time and served from a CDN. Best TTFB and LCP; suits content that is the same for everyone.
- **Server-side rendering (SSR)**: HTML is rendered per request. Content is in the first response, so LCP no longer depends on the bundle, but slow data fetching now shows up as TTFB.
- **Streaming SSR**: the server flushes the `<head>` and shell at once and sends slower parts as they resolve (React's `renderToPipeableStream` with `<Suspense>` boundaries). The browser starts fetching CSS, fonts, and the LCP image while the server is still working. Do not put the LCP element behind a slow boundary.

Server HTML is not interactive until **hydration**: the framework downloads the component code, re-runs it, and attaches listeners. That is typically the largest long task of the page load. During it the page looks ready but clicks wait, which appears as input delay in INP. Remedies, in rising order of ambition:

- Hydrate less: **islands** (Astro, Fresh) ship JavaScript only for interactive components and leave the rest as static HTML; React Server Components keep server-only components out of the bundle.
- Hydrate later or in pieces: React hydrates `<Suspense>` boundaries separately and prioritises the one the user interacts with; Astro's `client:visible` and `client:idle` defer islands.
- Skip it: resumable frameworks such as Qwik serialise state into the HTML and load handlers on demand.

```astro
<Header />                       <!-- static HTML, no JS -->
<Carousel client:visible />      <!-- hydrates when scrolled into view -->
```

Also watch the serialised data: SSR embeds the props for hydration in the HTML, so a large payload is sent twice, once as markup and once as JSON.

Choose per route. Marketing and content pages want SSG or islands; a logged-in dashboard may accept CSR.

**Try it:** Take a server-rendered app, record a load trace with 4x CPU throttling, and find the hydration task in the Main track. Note its duration and what happens if you click a button before it finishes.

**Resources**
- [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)
- [React: renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream)
- [Astro Docs: Islands architecture](https://docs.astro.build/en/concepts/islands/)

### Third-party scripts

Analytics, tag managers, A/B testing, chat widgets, ads, and embeds run with full access to your page and main thread, and nobody on your team reviews their code. They are frequently the largest source of long tasks and the hardest to fix, because the request to add them came from another department.

**Audit.** In a Performance trace, the Summary tab can group by third party and the Insights sidebar lists third parties by transfer size and main-thread time. In the Network panel, right-click a request and "Block request domain" to see the page without it. Keep an inventory: script, owner, purpose, cost. Remove what no one can justify; tag managers accumulate dead tags.

**Defer.** Load with `async` or `defer`, or inject after load or on first interaction. Never let a third-party script be render-blocking. A/B testing tools that hide the page until they run are an LCP problem by design; prefer server-side experiments.

**Facade.** Replace a heavy embed with a static preview that loads the real thing on click. A YouTube iframe costs over a megabyte; a thumbnail with a play button costs one image. The same applies to chat widgets and maps.

**Sandbox.** Run scripts off the main thread in a web worker (Partytown does this for scripts that tolerate it), or isolate widgets in an `<iframe>` with `loading="lazy"` so their work happens in another document.

Also: `preconnect` to the one or two origins that are critical, self-host where licensing allows to avoid a connection, and reserve space for anything a third party injects so it does not shift layout. Track third-party cost over time, since vendors change their scripts without telling you.

```html
<script src="https://analytics.example.com/a.js" async></script>
<iframe src="https://maps.example.com/embed" loading="lazy" width="600" height="400" title="Map"></iframe>
```

**Try it:** On a commercial site, record a trace, tick "Dim 3rd parties", and note how much of the main thread remains bright. Then block the top third-party domain and compare TBT.

**Resources**
- [Chrome for Developers: Lazy load third-party resources with facades](https://developer.chrome.com/docs/lighthouse/performance/third-party-facades)
- [web.dev: Efficiently load third-party JavaScript](https://web.dev/articles/efficiently-load-third-party-javascript)
- [Partytown documentation](https://partytown.qwik.dev/)

### HTTP caching

The fastest request is the one never made. `Cache-Control` on a response tells browsers and CDNs how long they may reuse it.

- `max-age=N`: fresh for N seconds; no request is made while fresh. `s-maxage` overrides it for shared caches (CDNs).
- `no-cache`: may be stored, but must be revalidated with the server before each use. It does not mean "do not cache".
- `no-store`: do not store at all. Use for sensitive responses.
- `private`: browser only, not CDNs. `public`: any cache.
- `immutable`: do not revalidate even on reload.
- `stale-while-revalidate=N`: after expiry, serve the stale copy for up to N seconds while refetching in the background.

Revalidation uses validators. The server sends `ETag` (or `Last-Modified`); the browser sends `If-None-Match`; if unchanged the server answers `304 Not Modified` with no body. That saves bytes but not the round trip.

The standard pattern has two halves:

```http
# /assets/app.3f9a1c.js  (content hash in the file name)
Cache-Control: public, max-age=31536000, immutable

# /index.html
Cache-Control: no-cache
```

Hashed assets never change, so cache them for a year. The HTML that references them must always be revalidated, so a deploy is picked up immediately. The classic bug is a long `max-age` on HTML or on unhashed files such as `/app.js`: users are stuck on the old version and you cannot purge their browsers.

With no `Cache-Control` at all, browsers apply heuristic caching based on `Last-Modified`, which is unpredictable. Always set it explicitly. Remember `Vary` when a response depends on a request header such as `Accept-Encoding` or `Accept`.

A service worker adds a programmable cache on top, but get HTTP caching right first.

**Try it:** Load a site twice with "Disable cache" off. In the Network panel's Size column, find which responses say "(memory cache)" or "(disk cache)", which return 304, and which are refetched. Read each one's `Cache-Control` header and explain the behaviour.

**Resources**
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)
- [Jake Archibald: Caching best practices and max-age gotchas](https://jakearchibald.com/2016/caching-best-practices/)

### CDN and compression

A content delivery network puts servers near users. That cuts latency for every round trip (DNS, TCP, TLS, request) and, when it caches the response, removes your origin server from the path entirely. Static assets belong on a CDN without question. The bigger win is caching HTML at the edge: with `s-maxage` plus `stale-while-revalidate`, or static generation, TTFB drops to tens of milliseconds. Know your cache key (URL, plus any `Vary` headers), keep cookies and needless query strings out of it, and check the hit ratio. Response headers such as `cf-cache-status`, `x-cache`, or `age` tell you whether a response was a hit.

**Compression.** Text resources (HTML, CSS, JS, JSON, SVG) should be compressed. Brotli (`Content-Encoding: br`) beats gzip by roughly 15 to 20% on text and is supported everywhere over HTTPS. Use the maximum level (11) for static files compressed at build time, and a moderate level (4 to 6) for dynamic responses where compression time counts. Zstandard is available in Chromium and Firefox and is fast for dynamic content. Do not compress already-compressed formats such as JPEG, AVIF, or WOFF2. Verify with the Content-Encoding column in the Network panel; a missing encoding on a JSON API is a common oversight.

**Protocol.** HTTP/2 multiplexes many requests over one connection, which makes old tricks like domain sharding and sprite sheets counterproductive. HTTP/3 runs over QUIC, removing TCP head-of-line blocking and speeding up connection setup, which helps most on lossy mobile networks. Both let the browser signal request priority, and a good server sends critical resources first; a poor one sends everything interleaved. `103 Early Hints` lets a server or CDN send `preload` and `preconnect` hints while it is still generating the HTML.

**Try it:** In the Network panel, enable the Protocol and Content-Encoding columns on your deployed site. Find any text response without `br` or `zstd`, and check the HTML response headers for a CDN cache status.

**Resources**
- [web.dev: Content delivery networks](https://web.dev/articles/content-delivery-networks)
- [MDN: Compression in HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression)
- [High Performance Browser Networking: HTTP/2](https://hpbn.co/http2/)

### Service worker caching for speed

A service worker is a script that sits between your pages and the network and can answer requests from the Cache Storage API. It cannot help the first visit, since it is installed during it, but it can make every later visit start from local storage instead of the network.

**Precaching** stores a known list of versioned assets (the app shell, bundles, fonts) at install time. Build tools generate the list with hashes; with Workbox:

```js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST);
registerRoute(({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({ cacheName: 'images' }));
```

**Runtime strategies** decide per request: cache-first for hashed assets, stale-while-revalidate for things that may be slightly old, network-first for HTML and API data that must be fresh, with the cache as the offline fallback.

The catch is startup. If the service worker is not running when the user navigates, the browser must boot it before the request can even be dispatched, which adds tens to hundreds of milliseconds on a phone. For a network-first navigation that is pure loss. **Navigation preload** fixes it: the browser sends the navigation request in parallel with booting the worker, and the handler uses that response.

```js
self.addEventListener('activate', (event) => {
  event.waitUntil(self.registration.navigationPreload?.enable());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith((async () => {
    const preloaded = await event.preloadResponse;
    return preloaded ?? fetch(event.request);
  })());
});
```

Mistakes that hurt: serving HTML cache-first without an update path, so users stay on an old version; precaching everything, which wastes data on install; handling requests you do not need to (return without calling `respondWith` and the browser handles them normally); and caching `sw.js` itself for a long time. Do not register a service worker that has an empty fetch handler; it adds startup cost for nothing. Always keep a way to ship a replacement worker that clears caches and unregisters.

Get HTTP caching right first; the service worker builds on it.

**Try it:** Add a Workbox precache to a project, load it twice, and compare the Network panel's Size column ("(ServiceWorker)") and the navigation timing on the second load. Then tick "Offline" in the Application panel's Service workers pane and reload.

**Resources**
- [Chrome for Developers: Workbox, strategies for service worker caching](https://developer.chrome.com/docs/workbox/caching-strategies-overview)
- [web.dev: Speed up service worker with navigation preloads](https://web.dev/blog/navigation-preload)
- [MDN: NavigationPreloadManager](https://developer.mozilla.org/en-US/docs/Web/API/NavigationPreloadManager)

### Prevent CLS

A layout shift happens when a visible element changes position between frames without the user causing it. The fix is almost always the same: reserve the space before the content arrives.

- **Images and video**: set `width` and `height` attributes. The browser derives an aspect ratio from them and reserves the box even when CSS makes the image fluid (`width: 100%; height: auto`). For other elements use the `aspect-ratio` property.
- **Ads, embeds, iframes**: give the container a `min-height` matching the most common size. Do not collapse the slot when no ad fills it.
- **Late content**: banners, consent notices, and "app install" bars inserted at the top push everything down. Overlay them (fixed or sticky positioning) or reserve their space. Insert new content below the viewport or in response to a user action.
- **Fonts**: a fallback with different metrics reflows text when the web font swaps in. Use metric overrides or `font-display: optional`.
- **Client-rendered regions**: a skeleton that has the same dimensions as the final content. A spinner that is replaced by a taller block is a shift.
- **Animations**: animate `transform`, not `top`, `height`, or `margin`. Transforms do not count as layout shifts.

Shifts within 500 ms of a discrete user input are excluded, so expanding an accordion on click is fine, provided the response is fast. If a click triggers a fetch that takes a second and then inserts content, that shift counts.

bfcache also helps: a restored page has no load-time shifts.

To debug, use the Layout shifts track in a Performance trace, which shows each shift's score and the nodes that moved, and enable "Layout shift regions" in the Rendering tab. For field-only shifts, `web-vitals` attribution reports `largestShiftTarget`.

```css
.ad-slot { min-height: 250px; }
.hero img { width: 100%; height: auto; aspect-ratio: 16 / 9; }
```

**Try it:** Throttle to Slow 4G, record a reload of a news site, and click each cluster in the Layout shifts track. For each, name the element that moved and what was inserted above it.

**Resources**
- [web.dev: Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [web.dev: Cumulative Layout Shift](https://web.dev/articles/cls)

### Optimise INP

An interaction's latency has three parts. **Input delay**: the time before your handlers start, because the main thread is busy with something else (a long task, another handler, hydration). **Processing duration**: your event handlers running. **Presentation delay**: style, layout, paint, and compositing until the frame appears. Find out which dominates before changing anything; the Interactions track in a trace and `web-vitals` attribution both give the split.

The main thread can do one thing at a time, and a task cannot be interrupted. So the core technique is to break long work into pieces and yield between them so the browser can handle input and paint.

```js
function yieldToMain() {
  if (globalThis.scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

saveButton.addEventListener('click', async () => {
  showSpinner();              // the visual feedback: do this first
  await yieldToMain();        // let the browser paint it
  validateForm();
  await yieldToMain();
  sendAnalytics();
});
```

`scheduler.yield()` returns a promise that resolves in a new task and, unlike `setTimeout`, puts the continuation at the front of the queue so other scripts do not jump in. It ships in Chromium and Firefox but not Safari at the time of writing, hence the fallback.

Reduce handler work: update the UI the user is waiting for first and defer the rest (analytics, persistence) with `scheduler.postTask` or `requestIdleCallback`. Debounce input handlers. Avoid layout thrashing inside handlers. For presentation delay, keep the DOM small, limit how much a state change re-renders, and use `content-visibility` for off-screen sections.

For input delay during load, the cause is usually script evaluation and hydration; ship less JavaScript and split long startup tasks. In frameworks, mark non-urgent updates with transitions (React's `startTransition`) so typing stays responsive.

**Try it:** With 4x CPU throttling, record a trace of a slow interaction in an app you know. Read the three phases from the Interactions track, then add one `await yieldToMain()` after the visible update and record again.

**Resources**
- [web.dev: Optimize Interaction to Next Paint](https://web.dev/articles/optimize-inp)
- [web.dev: Optimize long tasks](https://web.dev/articles/optimize-long-tasks)
- [MDN: Scheduler.yield()](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield)

### Layout thrashing

The browser is lazy about layout. When you change a style, it marks layout as dirty and waits until the next frame to recompute. But if you then read a property that depends on layout (`offsetWidth`, `offsetTop`, `clientHeight`, `scrollTop`, `getBoundingClientRect()`, `getComputedStyle()`), it has to compute layout right now to give you a correct answer. That is a forced synchronous layout, or forced reflow. Do it in a loop, alternating write and read, and you run layout once per iteration instead of once per frame. That is layout thrashing.

```js
// Thrashes: each iteration writes, then the next read forces layout
for (const box of boxes) {
  box.style.width = container.offsetWidth / 2 + 'px';
}

// Fixed: read once, then write
const half = container.offsetWidth / 2;
for (const box of boxes) {
  box.style.width = half + 'px';
}
```

The rule is to batch: do all reads, then all writes. When code is spread across components that cannot coordinate, schedule writes in `requestAnimationFrame` and keep reads before them, or use a small scheduler such as FastDOM. Better still, avoid measuring at all. CSS can usually do what the measurement was for: flexbox and grid for sizing, container queries for responsive components, `position: sticky` for sticking, `aspect-ratio` for proportions. Use `ResizeObserver` and `IntersectionObserver` instead of reading sizes and positions in scroll or resize handlers; their callbacks deliver measurements without forcing layout.

In a trace, forced layouts appear as purple Layout events nested inside yellow script, with a warning naming the line that triggered it, and the "Forced reflow" insight lists the worst call sites. The LoAF API reports `forcedStyleAndLayoutDuration` per script in the field.

**Try it:** Write a loop that sets the height of 500 elements from another element's `offsetHeight` read inside the loop. Record a trace, find the forced reflow warning, then hoist the read and compare the task's duration.

**Resources**
- [web.dev: Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- [Paul Irish: What forces layout/reflow](https://gist.github.com/paulirish/5d52fb081b3570c81e3a)

### Rendering cost

After JavaScript runs, each frame goes through style recalculation, layout, paint, and compositing. With a large DOM, each stage can take tens of milliseconds, and that is the presentation delay part of INP.

**Style recalculation** cost grows with the number of elements affected times the complexity of matching. Changing a class on `<body>` can invalidate the whole document. Keep changes local, keep the DOM small (Lighthouse warns above roughly 1,400 nodes), and be wary of broad `:has()` or universal selectors on very large pages. The Performance panel's "Selector stats" option shows which selectors cost the most.

**Layout** scope is normally the whole document, since a change anywhere can move anything. CSS containment narrows it. `contain: layout paint` promises that nothing inside affects the outside. `content-visibility: auto` goes further: the browser skips style, layout, and paint for the element's subtree entirely while it is off-screen, and renders it as it approaches the viewport.

```css
.article-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 600px; /* placeholder height; "auto" remembers the real one */
}
```

Without `contain-intrinsic-size` the skipped sections have zero height and the scrollbar jumps as they render. The content stays in the DOM, so find-in-page, anchor links, and the accessibility tree still work, which is its advantage over virtualisation. `content-visibility` is available in all current major browsers.

**Paint** cost depends on area and effects. Large blurs, shadows, and filters are expensive; "Paint flashing" in the Rendering tab shows what repaints. Reduce the painted area and move animating elements to their own compositor layer.

Avoid work in the first place: batch DOM updates, remove nodes that are never visible, and do not animate layout properties.

**Try it:** Build a page with 200 long sections. Record a load trace and note the Rendering time in the Summary. Add `content-visibility: auto` with a `contain-intrinsic-size` and record again.

**Resources**
- [web.dev: content-visibility](https://web.dev/articles/content-visibility)
- [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility)
- [web.dev: Rendering performance](https://web.dev/articles/rendering-performance)

### Compositor-only animation

The compositor thread assembles painted layers into the frame. It can move, scale, rotate, and fade a layer without involving the main thread. So an animation that only changes `transform` or `opacity` keeps running smoothly even while JavaScript blocks the main thread, and it skips layout and paint on every frame. (`filter` and, in newer browsers, some other properties can also be composited.)

Animate anything else and every frame costs more: `width`, `height`, `top`, `left`, `margin` trigger layout, paint, and composite; `background-color`, `box-shadow`, `color` trigger paint and composite.

```css
/* Slow: layout every frame */
.panel { transition: left 300ms; }
.panel.open { left: 0; }

/* Fast: compositor only */
.panel { transform: translateX(-100%); transition: transform 300ms; }
.panel.open { transform: translateX(0); }
```

To animate a size change, use the FLIP technique: measure first and last positions, apply an inverse transform, then animate the transform to zero. View Transitions do this for you.

For an element to be animated by the compositor it needs its own layer. Browsers promote automatically when a transform or opacity animation starts. `will-change: transform` promotes ahead of time, avoiding a first-frame hitch, but each layer costs GPU memory (width times height times 4 bytes, times the device pixel ratio squared). Putting `will-change` on hundreds of elements or on `*` exhausts memory on phones and slows everything. Apply it only to elements about to animate and remove it afterwards.

CSS animations, transitions, and the Web Animations API can all run on the compositor. A `requestAnimationFrame` loop that sets `style.transform` runs on the main thread every frame, so it stutters when the thread is busy. Scroll-driven animations (`animation-timeline`) also run off the main thread where supported.

Respect `prefers-reduced-motion`.

**Try it:** Animate a box with `left`, then with `transform`. In the Rendering tab enable "Paint flashing", and in the Performance panel compare the Main track during each. Then run a `while` loop that blocks for 2 seconds and see which animation keeps moving.

**Resources**
- [web.dev: How to create high-performance CSS animations](https://web.dev/articles/animations-guide)
- [web.dev: Stick to compositor-only properties and manage layer count](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)
- [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)

### Virtualisation

Ten thousand rows means ten thousand subtrees to create, style, lay out, and keep in memory, even though forty are visible. Virtualisation (windowing) renders only the rows in or near the viewport, inside a container whose total height matches the full list so the scrollbar behaves. As you scroll, rows are recycled.

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

function Rows({ items }) {
  const parentRef = useRef(null);
  const v = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 8,
  });
  return (
    <div ref={parentRef} style={{ height: 480, overflow: 'auto' }}>
      <div style={{ height: v.getTotalSize(), position: 'relative' }}>
        {v.getVirtualItems().map((row) => (
          <div key={row.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%',
            height: row.size, transform: `translateY(${row.start}px)` }}>
            {items[row.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

`overscan` renders a few extra rows either side so fast scrolling does not show blanks. Variable-height rows need measuring (`measureElement`), which is where most bugs come from.

The costs are real. Find-in-page (Ctrl+F) cannot find rows that are not in the DOM. Screen readers lose the list's true size unless you set `aria-rowcount`, `aria-rowindex`, or `aria-setsize`/`aria-posinset`. Keyboard focus is lost when a focused row is recycled. Anchor links and scroll restoration need extra care.

So consider the alternatives first. Pagination or "load more" is simpler and often better UX. `content-visibility: auto` keeps everything in the DOM while skipping rendering work for off-screen items, which handles a few thousand items well. Reach for virtualisation when the list is truly long (many thousands), rows are expensive, or data is effectively unbounded.

Use a maintained library: TanStack Virtual, `react-window`, `react-virtuoso`, or your grid component's built-in support.

**Try it:** Render 20,000 rows plainly and note the DOM node count in the Performance monitor and the time to render. Switch to a virtualiser and compare. Then try Ctrl+F for a row far down the list.

**Resources**
- [TanStack Virtual documentation](https://tanstack.com/virtual/latest)
- [web.dev: Virtualize large lists with react-window](https://web.dev/articles/virtualize-long-lists-react-window)

### Framework rendering

In React, a component re-renders when its state changes, its parent re-renders, or a context it reads changes. Rendering means calling the function and diffing the result; it is usually cheap, and the DOM is only touched where output changed. It becomes a problem when a small update re-renders a large tree, or a moderately expensive one runs on every keystroke.

Measure first. The React DevTools Profiler records each commit, shows which components rendered and for how long, and (with "Record why each component rendered" enabled) the reason. "Highlight updates when components render" gives a quick visual. Always profile a production build or the profiling build; development mode is much slower.

Fix structure before reaching for memoisation:

- **Colocate state.** State that lives at the top re-renders everything below it. Move it down to the component that uses it.
- **Lift content up.** Pass expensive subtrees as `children`; they are created by the parent and are not re-rendered when the wrapper's state changes.
- **Split contexts.** One context holding a large object re-renders every consumer on any change. Separate frequently changing values from stable ones, or use a store with selectors (`useSyncExternalStore`, Zustand, Redux) so components subscribe to slices.
- **Stable keys** on lists, never the array index for reorderable data.

Then memoise: `memo` skips a re-render when props are shallow-equal, and `useMemo`/`useCallback` keep prop identities stable so `memo` can work. React Compiler, stable since late 2025, applies this memoisation automatically at build time for code that follows the Rules of React, which removes most manual `useMemo` and `useCallback`.

For updates that are heavy by nature, `useTransition` and `useDeferredValue` keep input responsive by letting React interrupt the low-priority render.

The same ideas apply elsewhere: Vue and Solid track dependencies finely by default, Angular uses signals and `OnPush`. Understand your framework's update granularity.

**Try it:** Open the Profiler on an app with a text input high in the tree, record while typing, and find components that re-rendered without their output changing. Move the input's state into its own component and record again.

**Resources**
- [React: memo](https://react.dev/reference/react/memo)
- [React: React Compiler](https://react.dev/learn/react-compiler)
- [React: Profiler component](https://react.dev/reference/react/Profiler)

### Off-main-thread work

Some work cannot be made short: parsing a large file, filtering a hundred thousand records, image processing, compression, syntax highlighting, running a WASM module. Yielding helps the page stay responsive but stretches the total time. A Web Worker runs the work on another thread, leaving the main thread free.

```js
// main.js
const worker = new Worker(new URL('./search.worker.js', import.meta.url), { type: 'module' });
worker.postMessage({ query, records });
worker.onmessage = (e) => render(e.data);

// search.worker.js
self.onmessage = (e) => {
  const { query, records } = e.data;
  self.postMessage(records.filter((r) => r.name.includes(query)));
};
```

The `new URL(..., import.meta.url)` form is what Vite and other bundlers recognise to bundle the worker.

Workers have no DOM, no `window`, and no shared variables. Communication is by `postMessage`, which copies data with the structured clone algorithm. Copying a large object costs time on both threads, and that can exceed what you saved. Options: transfer ownership of an `ArrayBuffer`, `ImageBitmap`, or `OffscreenCanvas` (zero copy, but the sender loses it) by listing it in the transfer list; keep the data in the worker and send only queries and results; or share memory with `SharedArrayBuffer`, which requires cross-origin isolation.

```js
worker.postMessage(buffer, [buffer]); // transferred, not copied
```

Comlink wraps the message passing in an async function-call interface, which makes workers pleasant to use. Create workers once and reuse them; startup costs tens of milliseconds. A pool of `navigator.hardwareConcurrency - 1` workers suits parallel jobs.

Workers do not help when the slow part is DOM work or rendering. For that, reduce the work. `OffscreenCanvas` lets canvas drawing move to a worker.

**Try it:** Write a function that sorts two million random numbers on a button click while a CSS-independent `requestAnimationFrame` counter runs. Watch the counter freeze. Move the sort into a worker and watch it keep ticking.

**Resources**
- [MDN: Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [web.dev: An overview of web workers](https://web.dev/learn/performance/web-worker-overview)
- [GoogleChromeLabs/comlink](https://github.com/GoogleChromeLabs/comlink)

### Memory leaks

JavaScript is garbage collected: an object is freed when nothing reachable from a root (the global object, the current stack, active closures) references it. A leak is an object you no longer need that is still reachable. In a long-lived single-page app, leaks accumulate until the tab is slow, janky from garbage collection pauses, or killed by the browser on a low-memory phone.

The usual causes:

- Event listeners on `window`, `document`, or long-lived elements that are never removed, each holding its closure and everything it captured.
- `setInterval` timers and observers (`IntersectionObserver`, `ResizeObserver`, subscriptions, WebSocket handlers) not cleaned up when a component unmounts.
- Detached DOM: nodes removed from the document but still referenced from JavaScript (a variable, a cache, a closure).
- Unbounded caches and arrays: a `Map` that only grows.
- Closures that capture large objects unintentionally.

```js
useEffect(() => {
  const controller = new AbortController();
  window.addEventListener('resize', onResize, { signal: controller.signal });
  const id = setInterval(poll, 5000);
  return () => { controller.abort(); clearInterval(id); };
}, []);
```

To find one, use the Memory panel's three-snapshot technique. Take a heap snapshot, perform the suspect action and undo it (open and close a dialog, navigate to a route and back) several times, force garbage collection (the bin icon), and take another snapshot. Switch the second snapshot to "Comparison" view and sort by delta: objects whose count grew by exactly the number of repetitions are your leak. Filter by "Detached" to find detached DOM trees. Select an object and read the Retainers pane from the bottom up to see what holds it.

The "Allocations on timeline" profile shows blue bars for allocations that are still alive; bars that stay blue after you have undone the action are leaks. The Performance monitor's JS heap and DOM node counts give a quick live signal.

Use `WeakMap` and `WeakRef` for caches keyed by objects.

**Try it:** Create a component that adds a `resize` listener without cleanup. Mount and unmount it ten times, take snapshots before and after, and use the Comparison view and Retainers to trace the leak to the listener.

**Resources**
- [Chrome DevTools: Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems)
- [Chrome DevTools: Record heap snapshots](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots)
- [MDN: Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management)

### Back/forward cache

The back/forward cache (bfcache) keeps a complete snapshot of a page, including its JavaScript heap, in memory when the user navigates away. Pressing back or forward restores it instantly: no network, no script execution, no layout shifts. A meaningful share of navigations are back or forward navigations, especially on mobile, so eligibility is one of the highest-value, lowest-effort optimisations available. All major browsers have a bfcache.

Things that make a page ineligible:

- An **`unload` event listener**. Use `pagehide` instead. Chrome is phasing out `unload` altogether, and you can prevent third-party scripts adding one with `Permissions-Policy: unload=()`.
- **`Cache-Control: no-store`** on the document. Chrome has started allowing some `no-store` pages into bfcache when it is safe, but do not count on it. Use `no-store` only for pages that truly must never be restored, and prefer `no-cache` or `max-age=0` otherwise.
- **Open connections** when the page is hidden: WebSockets, WebRTC, in-progress IndexedDB transactions, held Web Locks. Close them in `pagehide` and reopen in `pageshow`.
- A `window.opener` reference, from a window opened without `rel="noopener"`.

Because the page is resumed rather than reloaded, your code must cope with waking up stale:

```js
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    refreshCartCount();      // data may have changed while frozen
    reconnectSocket();
  }
});
```

A `beforeunload` listener is acceptable only when added conditionally, while there are unsaved changes, and removed afterwards. After logout, make sure a restored page cannot show the previous user's data: check session state in `pageshow` and reload if it has changed.

Test in DevTools under Application > Back/forward cache: "Test back/forward cache" navigates away and back and lists blocking reasons, including which frame caused them. In the field, the `notRestoredReasons` property on the navigation timing entry reports why a restore failed, in Chromium.

**Try it:** Run the bfcache test in DevTools on three sites you use. For any that fail, read the reasons and identify whether your own code or a third party is responsible.

**Resources**
- [web.dev: Back/forward cache](https://web.dev/articles/bfcache)
- [Chrome DevTools: Test back/forward cache](https://developer.chrome.com/docs/devtools/application/back-forward-cache)
- [Chrome for Developers: Deprecating the unload event](https://developer.chrome.com/docs/web-platform/deprecating-unload)

### Performance budgets

A budget is a limit the team agrees not to exceed. Without one, every feature adds a little and nobody decides that the page should be slow; it simply becomes slow.

There are three kinds, and you want a mix:

- **Quantity budgets**: bytes of JavaScript, CSS, images, and fonts; number of requests; number of third-party scripts. Cheap to measure at build time, deterministic, and the earliest warning. Budget compressed size for the network and keep an eye on uncompressed size for parse cost.
- **Milestone budgets**: LCP, TBT, CLS, INP. Closer to user experience, but noisy in the lab and slow to arrive from the field.
- **Rule budgets**: a Lighthouse performance score or specific audits passing.

Set them from evidence. Start from where you are (do not get worse), from your users' devices and the Core Web Vitals thresholds (LCP 2.5 s on a mid-range phone on 4G leaves room for roughly 150 to 200 KB of compressed critical-path JavaScript, less if the server is slow), and from competitors' numbers. Budget per page type; a marketing page and a dashboard have different needs.

```json
{
  "size-limit": [
    { "name": "entry", "path": "dist/assets/index-*.js", "limit": "90 kB" },
    { "name": "all js", "path": "dist/assets/*.js", "limit": "250 kB" },
    { "name": "css", "path": "dist/assets/*.css", "limit": "20 kB" }
  ]
}
```

A budget only works if exceeding it has consequences. When a change goes over, the choices are: optimise the new feature, remove or lazy-load something else to make room, or consciously raise the budget with the reason recorded. Raising it silently defeats the purpose.

Bundlers also support this natively: Vite warns via `build.chunkSizeWarningLimit` and webpack via `performance.maxAssetSize` with `hints: 'error'`.

**Try it:** Measure the compressed JS, CSS, and image bytes of your project's main page from the Network panel footer. Write a `size-limit` configuration with limits 5% above the current values and run `npx size-limit`.

**Resources**
- [web.dev: Performance budgets 101](https://web.dev/articles/performance-budgets-101)
- [web.dev: Your first performance budget](https://web.dev/articles/your-first-performance-budget)
- [size-limit: README](https://github.com/ai/size-limit)

### CI enforcement

A budget nobody checks is a wish. Put the check in the pull request pipeline so regressions are caught when they are one commit old and the author still has context.

**Bundle size checks** are the most reliable: they are deterministic and fast. `size-limit` with its GitHub Action comments the size difference on each PR and fails when a limit is exceeded. Alternatives include `bundlewatch` and your bundler's own limits.

**Lighthouse CI** runs Lighthouse against a built preview of your site and asserts on results.

```js
// lighthouserc.cjs
module.exports = {
  ci: {
    collect: { staticDistDir: './dist', numberOfRuns: 5 },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
```

Run it with `npx @lhci/cli autorun`. `numberOfRuns` matters: CI machines are noisy, and LHCI asserts against the median run. Assert on individual metrics rather than only the composite score, which moves for reasons unrelated to your change. Use `warn` for noisy assertions and `error` for ones you trust, and leave headroom so a 3% wobble does not block merges; a flaky gate gets disabled.

Lab checks in CI cannot measure INP, since nothing is clicked. Cover interactions with a scripted user flow (Lighthouse user flows via Puppeteer, or a Playwright test that records long tasks) or rely on TBT as the proxy and RUM alerts for the real thing.

Complement CI with post-deploy monitoring: scheduled synthetic runs against production and alerts on field p75.

**Try it:** Add `@lhci/cli` to a project, write the config above, and run `autorun` locally. Then add a large unused dependency to the entry file and confirm an assertion fails.

**Resources**
- [Lighthouse CI: Getting started](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)
- [Lighthouse CI: Configuration and assertions](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)
- [size-limit GitHub Action](https://github.com/andresz1/size-limit-action)

### Regression hunting

Your p75 LCP went from 2.1 s to 2.9 s. Finding out why is detective work, and it goes faster if you have set things up in advance.

**Confirm it is real.** Check the sample size, and whether the traffic mix changed (a marketing campaign bringing users from slower regions or devices looks exactly like a regression). Segment by page type, device, country, browser version, and navigation type. A regression in one segment is a strong clue; a uniform shift suggests infrastructure.

**Find when it started.** This is why every RUM beacon should carry a release identifier (commit hash or build number) and why deploys should be marked on dashboards. Compare the metric's distribution by release. Remember CrUX is a 28-day rolling average, so a step change shows there as a slow slope beginning on the day of the change; the CrUX History API gives weekly points. Your own RUM shows the step directly.

**List what changed around then.** Your deploys, but also things outside your repository: a tag manager change, a third-party script's new version, a CDN or cache configuration change, an A/B test starting, a new consent banner, a browser release (Chrome changes how metrics are measured from time to time, and publishes a changelog), or a CMS editor uploading a huge hero image.

**Narrow down.** Use attribution data: did the LCP element change, which LCP phase grew, which script appears in slow INP's LoAF entries? Reproduce in the lab with the old and new builds and compare traces. If there are many commits, bisect: build and test the midpoint, as `git bisect` does, using a scripted Lighthouse run as the test.

**Fix, verify, and prevent.** Confirm recovery in RUM, then add the CI check or alert that would have caught it.

Feature flags help both ways: they let you turn a suspect off in production, but they also cause regressions that no deploy explains, so record flag changes too.

**Try it:** Check out a commit from a month ago and today's head of one of your projects. Run Lighthouse five times on each build, compare medians, and for the largest difference identify the commit responsible with `git bisect`.

**Resources**
- [web.dev: Debug performance in the field](https://web.dev/articles/debug-performance-in-the-field)
- [Chrome for Developers: CrUX History API](https://developer.chrome.com/docs/crux/history-api)
- [Chromium: Core Web Vitals metrics changelog](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/README.md)

### Perceived performance

People judge speed by how the wait feels, not by a stopwatch. The classic thresholds: a response within about 100 ms feels instantaneous, within 1 second keeps the user's flow of thought, and beyond that attention drifts. When you cannot make something faster, you can still make it feel better, and you should also make sure nothing feels broken.

- **Immediate feedback.** Every tap should produce a visible change in the next frame: a pressed state, a spinner in the button, a disabled state. A click with no acknowledgement gets clicked again.
- **Optimistic UI.** For actions that nearly always succeed (like, add to list, send a message), update the interface at once and reconcile when the server answers, rolling back with a clear message on failure. React's `useOptimistic` and query libraries' optimistic mutations support this. Do not use it for payments or anything irreversible.
- **Skeleton screens.** Show the layout of what is coming instead of a blank page or centred spinner. The skeleton must match the final dimensions, or it causes layout shift. Do not flash it: if content arrives within about 200 ms, show nothing.
- **Progressive rendering.** Stream HTML and show the shell and above-the-fold content first. Use low-quality image placeholders or a dominant colour.
- **Predict.** Prefetch or prerender the likely next page on hover; preload a route's code when its link is visible.
- **Smooth transitions.** The View Transition API animates between states, which makes a navigation feel continuous.
- **Progress, not spinners,** for long operations: a determinate bar and a description of what is happening.

Be honest. A skeleton that hides a 6 second wait is still a 6 second wait, and tricks that paint early while the page cannot respond to input make things worse. Perceived performance is a complement to real performance.

**Try it:** Pick one action in your app that waits on the network. Under Slow 4G, implement an optimistic update with rollback on failure, and compare how the two versions feel. Force a failure to check the rollback.

**Resources**
- [web.dev: Measure performance with the RAIL model](https://web.dev/articles/rail)
- [React: useOptimistic](https://react.dev/reference/react/useOptimistic)
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)

### Making the case

Engineers care about milliseconds; the people who set priorities care about revenue, cost, and risk. Performance work gets funded when you translate.

**Tie the metric to money using your own data.** Join RUM to analytics and plot conversion rate (or bounce, or engagement) by LCP or INP bucket. The slope gives you a defensible statement: "sessions with LCP under 2.5 s convert at 3.1%, those over 4 s at 1.9%; 30% of mobile sessions are over 4 s". Be careful about causation. Users with fast devices differ in other ways, so present it as correlation and propose an experiment.

**Run the experiment.** An A/B test of a performance improvement (or, where you cannot build it yet, a small artificial slowdown for a small share of traffic) gives a causal number that nobody can dismiss.

**Use external evidence as support, not as the argument.** Published case studies show the direction; your numbers show the size.

**Show it.** A side-by-side filmstrip or video of your site and a competitor's on a mid-range phone lands harder than a table. Let stakeholders use the site on a throttled device.

**Frame the cost of not acting.** Core Web Vitals affect search ranking; slow pages raise paid-acquisition costs because landing page experience matters; slow apps generate support tickets and abandoned carts.

**Propose something specific.** Not "improve performance" but "ship a responsive hero image and preload it: two days of work, expected to move mobile p75 LCP from 3.4 s to 2.6 s, affecting 40% of landing sessions". Prioritise by impact over effort, start with a quick visible win, report the result afterwards, and ask for the budget and CI check that will keep it.

Avoid leading with a Lighthouse score. It is a lab number, it is easy to game, and it invites the wrong goal.

**Try it:** Write a one-page proposal for a single performance fix on a real project: the current field metric and who is affected, the proposed change and effort, the expected metric change, and the business outcome you would measure.

**Resources**
- [web.dev: The business impact of Core Web Vitals](https://web.dev/case-studies/vitals-business-impact)
- [web.dev: Relating site speed and business metrics](https://web.dev/articles/site-speed-and-business-metrics)
- [WPO Stats](https://wpostats.com/)

### Performance audit

An audit turns measurement into a ranked list of work. Pick a real site, ideally one with CrUX data, and follow a fixed method.

1. **Field first.** Look up the origin and its key URLs in PageSpeed Insights or the CrUX API. Record p75 LCP, INP, CLS, and TTFB for mobile and desktop, and the share of good, needs-improvement, and poor experiences. This tells you which metrics fail and is your baseline.
2. **Choose pages.** One of each important template: home, listing, detail, checkout or form.
3. **Lab diagnosis.** For each, run Lighthouse (mobile, several runs) and WebPageTest, and record a DevTools trace with throttling. For LCP: identify the element and phase breakdown. For CLS: the shifting elements. For INP: script the main interactions (open menu, type in search, add to cart) and read their phases. Capture the request waterfall, the bundle composition, third-party cost, cache headers, compression, and image formats.
4. **Findings.** Write each as: observation with evidence (a screenshot of the trace or waterfall), the cause, the recommended fix, the estimated effort, and the expected effect on a named metric.
5. **Prioritise.** Rank by impact over effort. Group into quick wins, medium projects, and structural changes.

Estimate impact honestly. From a trace you can say "the LCP image starts 900 ms after the HTML arrives because it is injected by JavaScript; making it discoverable should recover most of that". Give ranges, and state assumptions.

Keep the report short: a one-paragraph summary a non-engineer can read, a table of the top five recommendations, then the detail. Include the test conditions (device, throttling, location, date) so results are reproducible.

**Try it:** Audit one page of a site you use daily. Produce a table of five findings with evidence, fix, effort (S/M/L), and expected metric change, ordered by priority.

**Resources**
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [web.dev: The most effective ways to improve Core Web Vitals](https://web.dev/articles/top-cwv)
- [Chrome for Developers: Lighthouse overview](https://developer.chrome.com/docs/lighthouse/overview)

### Fix a slow app

The discipline here is the method, not any single trick: change one thing, measure, write it down.

Start from an app with real problems. Use one of your own early projects, or build the slowness in on purpose: a large unoptimised hero image loaded by JavaScript, a web font with `font-display: block`, images without dimensions, a banner injected at the top after load, a render-blocking third-party script, one giant bundle with a heavy charting library, a list of 5,000 rows, and a click handler that does 400 ms of synchronous work.

Set up measurement before touching anything. Decide the test conditions (Lighthouse mobile, five runs, median; plus a throttled DevTools trace of two named interactions) and record the baseline for LCP, CLS, TBT, and the interaction latencies. Deploy it so you can test on a real phone.

Then work in order of impact, typically:

1. LCP: make the hero image discoverable, sized, modern format, `fetchpriority="high"`; remove render-blocking resources; fix font loading.
2. CLS: dimensions on media, reserve space for the banner, font fallback metrics.
3. JavaScript: code-split routes, lazy-load the chart, remove dead dependencies, defer the third party.
4. INP: yield in the slow handler, move heavy computation to a worker, virtualise or use `content-visibility` on the list.
5. Caching and compression: hashed assets with a long `max-age`, Brotli.

After each fix, re-measure under the same conditions and log: what you changed, the commit, before and after numbers, and whether it did what you expected. Some fixes will do nothing or make things worse; record those too, because understanding why is where the learning is.

Finish with all three vitals in the good range on a real mid-range phone, and add a CI budget so it stays that way.

**Try it:** Create the changelog file first, with a table of columns: change, commit, LCP, CLS, TBT, interaction latency, notes. Fill in the baseline row before writing any fix.

**Resources**
- [web.dev: Learn Performance](https://web.dev/learn/performance)
- [web.dev: Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp)
- [web.dev: Optimize Interaction to Next Paint](https://web.dev/articles/optimize-inp)

### RUM dashboard

Building your own small RUM pipeline teaches you what the commercial products do and why field data is messy.

**Collect.** Use `web-vitals` (attribution build) and send each metric with context: metric name, value, rating, `id`, page path or route template, navigation type, release identifier, viewport width or a device class, and `navigator.connection?.effectiveType`. Send with `navigator.sendBeacon`. Do not collect personal data: no user identifiers, no full URLs with query strings, no IP addresses stored. That keeps you clear of most consent questions, but check the rules that apply to you.

**Ingest.** A single endpoint (a serverless function is enough) that validates the payload, drops malformed or absurd values, and appends a row to a database (SQLite, Postgres, or an analytics store such as ClickHouse or BigQuery). Since CLS and INP may report more than once per page, upsert by metric `id` or keep the last value.

```sql
SELECT date_trunc('day', ts) AS day, name,
       percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75
FROM vitals
WHERE page = '/product/:id' AND device = 'mobile'
GROUP BY 1, 2 ORDER BY 1;
```

**Chart.** For each metric show the p75 over time with the good and poor thresholds as reference lines, the distribution as good / needs improvement / poor stacked bars, and breakdowns by page and device. Mark deploys on the time axis. Add a table of the most common LCP elements and slowest INP targets from the attribution data; this is what makes the dashboard useful for debugging.

**Sanity-check** against CrUX for the same origin if it has data. Expect differences: CrUX is Chrome only, 28-day, and includes iframes.

Things you will learn: p75 is unstable with few samples (show the count), bots and background tabs pollute data, and Safari and Firefox report no CLS.

**Try it:** Deploy the collection endpoint and the snippet to one project, generate traffic from two devices over a day, and produce one chart: p75 LCP by day with the 2.5 s threshold marked.

**Resources**
- [GoogleChrome/web-vitals: Send the results to an analytics endpoint](https://github.com/GoogleChrome/web-vitals#send-the-results-to-an-analytics-endpoint)
- [web.dev: Getting started with measuring Web Vitals](https://web.dev/articles/vitals-measurement-getting-started)
- [MDN: Navigator.sendBeacon()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)
