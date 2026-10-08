# Browser Internals: Guide

## Toolkit

### DevTools and tooling

The Chrome DevTools **Performance** panel is the main instrument for this module. Record with CPU throttling at 4x or more, then read the tracks top to bottom: **Frames** (dropped and partially presented frames), **Interactions**, **Main** (the flame chart of tasks, where purple is style and layout, green is paint, yellow is script), **Thread pool**, **Compositor**, and **GPU**. Click any event and read the **Summary**, **Bottom-up**, and **Call tree** tabs. Tick **Enable CSS selector stats** in the capture settings when style recalculation is the problem, and enable **Layout shift** and **Forced reflow** insights in the sidebar.

Open the **Rendering** drawer tab (Command Menu, "Show Rendering") for **Paint flashing**, **Layer borders**, **Frame Rendering Stats**, and **Scrolling performance issues**. The **Layers** panel shows every composited layer, its memory cost, and the compositing reason. The **Network** panel gains a **Priority** column (right-click the header) and shows `(memory cache)`, `(disk cache)`, and `(ServiceWorker)` in the Size column. The **Memory** panel takes heap snapshots and allocation timelines. The **Application** panel shows service workers, storage, and back/forward cache eligibility.

Chrome's internal pages go deeper: `chrome://process-internals` (site isolation and process assignment), `chrome://gpu`, `chrome://net-export` (capture a NetLog, then open it in the NetLog viewer), `chrome://serviceworker-internals`, `chrome://tracing` or [ui.perfetto.dev](https://ui.perfetto.dev/) for full traces across every process, and the Chrome Task Manager (Shift+Esc on Windows) for per-process memory and CPU.

For the JavaScript engine, Node shares V8 with Chrome, so `node --trace-opt --trace-deopt file.js` and `node --allow-natives-syntax` (which unlocks `%HaveSameMap(a, b)` and `%OptimizeFunctionOnNextCall(fn)`) let you observe optimisation from a terminal. Firefox's Profiler (profiler.firefox.com) and Safari's Web Inspector Timelines tab are the equivalents for Gecko and WebKit; use them, because the three engines disagree on details.

### Testing and verifying your work

Knowledge about internals is only useful if you can confirm it on a real page, so every claim in this module should be checked with a measurement.

- **Predict, then record.** Before recording a trace, write down which stages you expect to see (style, layout, paint, composite). Then record and compare. A change to `transform` on a promoted layer should show no Layout or Paint events on the main thread; if it does, your mental model or your CSS is wrong.
- **Use lab throttling.** A fast laptop hides everything. Use 4x to 20x CPU slowdown and a throttled network profile, and test in an incognito window so extensions do not pollute the trace.
- **Verify with user timing.** Wrap suspicious code in `performance.mark()` and `performance.measure()`; the measures appear in the Timings track next to the browser's own events.
- **Confirm in the field.** The Long Animation Frames API (`PerformanceObserver` with `type: 'long-animation-frame'`, Chromium only at the time of writing) reports script, style, and layout time per slow frame from real users. The `event` and `layout-shift` entry types cover interaction latency and shifts.
- **Check engine behaviour directly.** For V8 claims, run a small script under `node --trace-deopt` or use `%GetOptimizationStatus`. Microbenchmarks lie easily: the optimiser removes dead code, so always consume results and compare several runs.
- **Cross-browser.** Run the same reduction in Chrome, Firefox, and Safari. If they differ, read the spec to learn which one is right, then consult web-platform-tests at wpt.fyi for the existing test results.

"Done" means you can point to the specific trace event, spec step, or log line that supports your explanation, not that the explanation sounds plausible.

### Tricks and gotchas

- Reading a layout property (`offsetHeight`, `getBoundingClientRect()`, `scrollTop`, `getComputedStyle().width`) after writing styles forces a synchronous style and layout. Batch all reads before all writes in a frame.
- `will-change: transform` on many elements is a memory problem, not an optimisation. Each layer costs roughly width x height x 4 bytes, multiplied by the device pixel ratio squared.
- An element that overlaps a composited layer and paints above it must also be composited. One promoted element low in the z-order can silently promote dozens of others; check the Layers panel's "compositing reasons".
- A non-passive `touchstart` or `wheel` listener forces the compositor to wait for the main thread before scrolling. Listeners added to `window`, `document`, and `body` are passive by default; ones on other elements are not.
- Microtasks run until the queue is empty. A promise loop that keeps scheduling more microtasks blocks rendering exactly like a `while (true)`.
- `setTimeout(fn, 0)` is clamped to 4ms after five nested levels and to once per second or less in background tabs. Use `scheduler.postTask()` or `scheduler.yield()` where available (Chromium and Firefox; not Safari at the time of writing) with a `setTimeout` fallback.
- In DevTools, a red triangle on a task means it exceeded 50ms. The hatched part is the excess.
- "Disable cache" in the Network panel only applies while DevTools is open, and it also bypasses the memory cache, so it changes resource timing more than you might expect.
- Shared CDN caching across sites no longer exists: every major browser partitions the HTTP cache by top-level site.
- Deleting properties, adding properties in different orders, and mixing integers with doubles or holes in one array all change V8's internal representation. Initialise every field in the constructor, in the same order.
- `requestAnimationFrame` does not fire in background tabs. Never use it as a general timer.

### Official references

- [Chrome: Inside look at modern web browser, part 1](https://developer.chrome.com/blog/inside-browser-part1) — the four-part overview of processes, navigation, rendering, and input.
- [Chrome: RenderingNG](https://developer.chrome.com/docs/chromium/renderingng) — the authoritative series on Chromium's current rendering architecture.
- [HTML Standard: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops) — the normative definition of tasks, microtasks, and rendering updates.
- [HTML Standard: Parsing HTML documents](https://html.spec.whatwg.org/multipage/parsing.html) — the tokeniser and tree construction algorithms.
- [ECMAScript Language Specification](https://tc39.es/ecma262/) — the JavaScript language itself.
- [V8 blog](https://v8.dev/blog) — primary source for V8's compilers, object model, and garbage collector.
- [WebKit blog](https://webkit.org/blog/) — JavaScriptCore and WebKit engineering posts and Safari release notes.
- [Web Browser Engineering](https://browser.engineering/) — a free book that builds a browser from scratch; the best way to learn why the pipeline has its shape.
- [Chrome DevTools: Performance features reference](https://developer.chrome.com/docs/devtools/performance/reference) — every control and track in the Performance panel.
- [Service Workers specification](https://w3c.github.io/ServiceWorker/) — lifecycle and fetch handling as specified.
- [Web Platform Status](https://webstatus.dev/) — Baseline status and browser support for every tracked feature.

## Skills

### Multi-process architecture

A modern browser is a set of cooperating operating-system processes. In Chromium, the **browser process** owns the UI, the navigation state, and all privileged decisions. **Renderer processes** run Blink and V8 inside a sandbox: they parse, style, lay out, and run your JavaScript, but cannot touch the network, disk, or other windows directly. The **GPU process** (also called Viz) rasterises and draws, and aggregates frames from every renderer and from the browser UI. The **network service** performs all fetching, and utility processes handle storage, audio, and similar work. Processes talk over Mojo IPC.

The split buys stability (one tab crashing does not kill the rest) and security (a compromised renderer is boxed in). **Site isolation** tightens it: documents from different *sites* (scheme plus registrable domain, so `a.example.com` and `b.example.com` share one) never share a renderer process. A cross-site `<iframe>` therefore lives in a different process from its parent (an out-of-process iframe), which is what makes Spectre-style memory reads between sites impractical. Chrome enables this for all sites on desktop and for a subset of sites on memory-constrained Android devices. Firefox ships the equivalent (Fission), and WebKit has been building its own.

Practical consequences: each process has fixed overhead, so many cross-site iframes cost real memory; a busy main thread in one renderer does not stall a cross-site iframe; and `SharedArrayBuffer` requires cross-origin isolation (`Cross-Origin-Opener-Policy: same-origin` plus `Cross-Origin-Embedder-Policy`) because the process boundary is the security guarantee.

**Try it:** Open a page that embeds a cross-site iframe (a YouTube embed works). Open Chrome's Task Manager (Shift+Esc) and find the separate "Subframe" process. Then open `chrome://process-internals`, look at the Frame Trees tab, and match each frame to its process and SiteInstance.

**Resources**
- [Chrome: Inside look at modern web browser, part 1](https://developer.chrome.com/blog/inside-browser-part1)
- [Chromium: Site Isolation](https://www.chromium.org/Home/chromium-security/site-isolation/)
- [Chrome: RenderingNG architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture)

### Navigation

A navigation is driven by the browser process, not the page. The sequence in Chromium:

1. The browser process decides the input is a URL and asks the current document to run `beforeunload` handlers if it has any.
2. If a service worker is registered for the URL's scope, it is started and given the request; otherwise the network service starts the request. Redirects are followed here, with each hop re-checked.
3. When response headers arrive, the browser sniffs the MIME type, runs safety checks, and decides whether this is a download or a document. In parallel it has usually already started (or chosen) a renderer process for the target site.
4. **Commit**: the browser sends the response stream to the chosen renderer. The renderer confirms, and at that moment the address bar, security indicator, and session history update. The old document gets `pagehide` and `visibilitychange`, and either enters the back/forward cache or is destroyed.
5. The renderer parses and renders. Chrome keeps showing the old page's pixels for same-origin navigations until the new document paints something ("paint holding"), which avoids a white flash.

Details that matter in practice: not every navigation runs this sequence. A back/forward cache restore or the activation of a prerendered page swaps in a document that already exists (see the next entry). And time before commit (redirects, service worker startup, server think time) is invisible to the page's own JavaScript but counts toward TTFB.

**Try it:** Record a Performance trace with reload on a site you maintain. Find the navigation start, the main document's request and response in the Network track, and the first paint marker in the Timings track. Then read `performance.getEntriesByType('navigation')[0]` in the console and match `redirectStart`, `workerStart`, `responseStart`, and `domInteractive` to what the trace shows.

**Resources**
- [Chrome: Inside look at modern web browser, part 2](https://developer.chrome.com/blog/inside-browser-part2)
- [MDN: PerformanceNavigationTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming)
- [HTML Standard: Navigation and session history](https://html.spec.whatwg.org/multipage/browsing-the-web.html)

### Back/forward cache and prerendering

Both features make a navigation instant by having the destination document ready before the user asks for it. One keeps a page you left; the other builds a page you have not visited yet.

The **back/forward cache** (bfcache) stores a complete snapshot of a page, including the JavaScript heap, when you navigate away. The page is frozen: timers stop and promises do not resolve. Going back resumes it exactly as it was, with no network, parse, or script work. All major browsers have one. `load` and `DOMContentLoaded` do not fire again; you observe the transitions with `pagehide` and `pageshow`:

```js
window.addEventListener('pageshow', (event) => {
  if (event.persisted) refreshStaleData();   // restored from bfcache
});
window.addEventListener('pagehide', (event) => {
  if (event.persisted) closeConnections();   // about to be frozen, not destroyed
});
```

A page is only eligible if freezing it is safe. The usual blockers are an `unload` listener (never use it; use `pagehide`), `Cache-Control: no-store` on the document, a non-null `window.opener`, and connections left open: IndexedDB transactions, in-flight `fetch()`, WebRTC, and in some browsers WebSockets. A third-party script that adds `unload` blocks it for your whole page. The consequence people miss is staleness: a restored page shows whatever it showed before, so a logged-out user can see a logged-in page. Revalidate on `pageshow`.

**Prerendering** loads and renders a page in a hidden renderer before the click. You request it with speculation rules:

```html
<script type="speculationrules">
{ "prerender": [{ "where": { "href_matches": "/articles/*" }, "eagerness": "moderate" }] }
</script>
```

`eagerness` controls the trigger: `eager` speculates as early as possible, `moderate` when the user hovers or starts pressing a link, `conservative` only on pointer or touch down. `prefetch` in place of `prerender` fetches just the document. On click, the prerendered page is *activated*: it becomes the tab's document with no visible load. While prerendering, `document.prerendering` is true, the page's scripts run, and intrusive APIs (permission prompts, for example) are deferred until activation. So analytics and anything with side effects must wait for the `prerenderingchange` event, or you will count views that never happened. Chrome caps concurrent prerenders and skips them under conditions such as data saver or low memory, and URLs with side effects (a logout link) must be excluded. Prerendering through speculation rules is a Chromium feature at the time of writing; treat it as an enhancement and check current support in other engines.

**Try it:** In DevTools open Application, Back/forward cache, and run the test on a site you maintain; fix one reported blocker. Then add the speculation rule above to a multi-page site, open Application, Speculative loads, hover a link, and watch its status change to "Ready".

**Resources**
- [web.dev: Back/forward cache](https://web.dev/articles/bfcache)
- [Chrome: Prerender pages in Chrome for instant page navigations](https://developer.chrome.com/docs/web-platform/prerender-pages)
- [MDN: Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)

### The main thread

Each renderer has one main thread, and almost everything you write runs on it: JavaScript execution, HTML parsing, style calculation, layout, paint recording, most event dispatch, timers, garbage collection pauses, and the callbacks of nearly every web API. These do not run in parallel; they queue. A 200ms script means a 200ms delay to the click that arrived during it, and to the frame that should have been produced.

What runs elsewhere: the compositor thread (scrolling, pinch zoom, and animations of `transform` and `opacity` on composited layers), raster and image-decode workers, the network service, and your own Web Workers and worklets. That is why a page can scroll smoothly while being completely unresponsive to taps.

The working rule is that a task over 50ms is a **long task**, because input arriving during it cannot be handled within the roughly 100ms that feels instant. The fix is to break work up and yield so the browser can run input handlers and render:

```js
const yieldToMain = () =>
  globalThis.scheduler?.yield?.() ?? new Promise((resolve) => setTimeout(resolve));

async function processAll(items) {
  let last = performance.now();
  for (const item of items) {
    process(item);
    if (performance.now() - last > 40) {
      await yieldToMain();
      last = performance.now();
    }
  }
}
```

`scheduler.yield()` resumes your function ahead of other queued tasks, which `setTimeout` does not; it is in Chromium and Firefox but not Safari at the time of writing, hence the fallback. Awaiting an already-resolved promise does *not* yield: microtasks run before the browser gets control back. Third-party scripts, hydration, and large JSON parsing are the usual offenders. Move pure computation to a worker.

**Try it:** Record a trace of a heavy page with 4x CPU throttling. In the Main track, find the three longest tasks, and use the Bottom-up tab to name the function and the category (scripting, rendering, painting) responsible for each.

**Resources**
- [web.dev: Optimize long tasks](https://web.dev/articles/optimize-long-tasks)
- [Chrome: Inside look at modern web browser, part 3](https://developer.chrome.com/blog/inside-browser-part3)
- [MDN: Scheduler.yield()](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield)

### Parsing

The HTML parser turns bytes into a DOM in two specified stages. The **tokeniser** is a state machine that consumes characters and emits tokens: start tags, end tags, text, comments, doctype. **Tree construction** consumes tokens and builds nodes, using an "insertion mode" and a stack of open elements. It is fully specified including error recovery, so every browser produces the same tree from broken markup. That is why `<p>one<p>two` gives two sibling paragraphs, why a `<div>` inside a `<table>` is moved in front of the table ("foster parenting"), and why a missing `<tbody>` appears in the DOM. HTML is not parsed by a general grammar; you cannot reason about it like XML.

Parsing is incremental. The browser parses as bytes arrive and can paint a partial document, which is why streaming HTML from the server and putting critical content early in the document both work.

When the parser is blocked on a script, a second, simpler pass called the **preload scanner** (or speculative parser) reads ahead through the raw markup and starts fetching resources it finds: `<img src>`, `<link rel="stylesheet">`, `<script src>`, `srcset`. It only sees what is in the HTML the server sent. It cannot find:

- images set by CSS `background-image`
- anything injected by JavaScript, including client-rendered markup
- `<img>` using `data-src` for JavaScript lazy loading
- fonts referenced inside stylesheets

For those, use `<link rel="preload">` or, better, put the resource in the markup. A JavaScript-rendered hero image is the classic way to make LCP slow, because discovery waits for the script to download, compile, and run.

**Try it:** Open DevTools on a page and compare View Source with the Elements panel for a table without `<tbody>` and a paragraph with an unclosed tag. Then, in the Network panel, add the Initiator column and find one resource discovered by "parser" and one discovered by a script; compare their start times.

**Resources**
- [HTML Standard: Parsing HTML documents](https://html.spec.whatwg.org/multipage/parsing.html)
- [web.dev: Don't fight the browser preload scanner](https://web.dev/articles/preload-scanner)
- [web.dev: How browsers work](https://web.dev/articles/howbrowserswork)

### Parser blocking

Two different kinds of blocking are routinely confused.

**Parser-blocking**: a classic `<script>` without `async` or `defer` stops the parser until the script has downloaded and executed, because it could call `document.write()`. Worse, a script must also wait for every stylesheet that precedes it to finish loading, since it might read computed styles. So a slow stylesheet followed by an inline script blocks parsing even though CSS itself never blocks the parser.

**Render-blocking**: stylesheets in the `<head>` do not stop the parser, but the browser will not paint until they have loaded, to avoid a flash of unstyled content. A `<link>` whose `media` does not match is still downloaded but at low priority and without blocking render.

| Markup | Blocks parser | Executes |
| --- | --- | --- |
| `<script src>` | yes | immediately, in order |
| `<script defer src>` | no | after parsing, in order, before `DOMContentLoaded` |
| `<script async src>` | no | whenever it arrives, any order |
| `<script type="module" src>` | no | deferred by default; `async` makes it async |
| inline `<script>` | yes | immediately, after pending stylesheets |

Common mistakes: `defer` on an inline classic script does nothing; `async` scripts have no order guarantee, so two that depend on each other break intermittently; a dynamically inserted `<script>` is async by default (set `script.async = false` to preserve order); and an `@import` inside a stylesheet chains another render-blocking request that the preload scanner cannot see. `DOMContentLoaded` waits for deferred and module scripts, not for async ones or images.

**Try it:** Create a page with a `<link>` to a stylesheet delayed by 3 seconds (use DevTools request blocking or a tiny local server) followed by an inline `<script>console.log('ran')</script>` and then some text. Record when the log appears. Move the script above the link and compare.

**Resources**
- [HTML Standard: The script element](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element)
- [web.dev: Render-blocking CSS](https://web.dev/articles/critical-rendering-path/render-blocking-css)
- [MDN: The script element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script)

### CSSOM and style

Style calculation answers one question for every element: what is the computed value of every CSS property? The browser parses stylesheets into the CSSOM (rule objects you can inspect through `document.styleSheets`), then for each element finds the matching rules, sorts the declarations by the cascade (origin, layers, specificity, order), applies inheritance and initial values, and resolves relative values where it can. The output is a `ComputedStyle` per element.

Engines do not test every selector against every element. Rules are indexed by their **rightmost compound selector** (the "key" selector): by ID, class, tag, or a universal bucket. For an element, the engine looks up only the buckets it could match, then walks the selector **right to left**, checking ancestors. A selector like `.nav a` is first matched as "is this an `a`?", then "does it have a `.nav` ancestor?". Blink uses Bloom filters of ancestor identifiers to reject most candidates quickly.

Recalculation is incremental. When a class changes, Blink consults precomputed **invalidation sets** to decide which descendants or siblings could possibly be affected, rather than restyling the whole document. Costs therefore come from:

- broad invalidation: toggling a class on `<body>`, or changing an inherited custom property on `:root`, can restyle every element
- a very large DOM
- selectors with expensive rightmost parts (`*`, `[class*="x"]`) or heavy `:has()` use that widens what must be rechecked

In practice selector micro-optimisation rarely matters; the *number of elements restyled* does. Scope changes to the smallest subtree, and register custom properties with `@property` and `inherits: false` when they do not need to cascade down.

**Try it:** In the Performance panel's capture settings enable CSS selector stats, record while toggling a class on `<body>`, then click the Recalculate Style event and open Selector Stats. Sort by elapsed time and by match attempts. Move the class to a smaller container and compare element counts.

**Resources**
- [web.dev: Reduce the scope and complexity of style calculations](https://web.dev/articles/reduce-the-scope-and-complexity-of-style-calculations)
- [Chrome DevTools: Analyze CSS selector performance](https://developer.chrome.com/docs/devtools/performance/selector-stats)
- [Chrome: BlinkNG](https://developer.chrome.com/docs/chromium/blinkng)

### Layout

Layout computes geometry: the size and position of every box. Its input is not the DOM but a **layout tree** (box tree) derived from DOM plus computed style. `display: none` elements have no box; `display: contents` elements have no box but their children do; pseudo-elements like `::before` do; and the engine inserts anonymous boxes, for example to wrap bare text next to a block.

Each box participates in a **formatting context** that defines the rules: block, inline, flex, grid, or table. An element that establishes a new block formatting context (`display: flow-root`, `overflow` other than `visible`, flex and grid items, and so on) contains its floats and stops margins collapsing through it. In Chromium's LayoutNG, layout is a function: a parent passes a child a *constraint space* (available size and similar) and gets back an immutable *fragment*. Because inputs and outputs are explicit, results can be cached and reused when constraints do not change.

Layout is invalidated when geometry could change: DOM insertions and removals, text changes, style changes to properties such as `width`, `margin`, `font-size`, or `display`, viewport resizes, and font or image loads. Dirtiness propagates up to the nearest layout root and then layout walks down. Containment (`contain: layout`, `contain: size`, `content-visibility: auto`) creates boundaries so that changes inside cannot affect the outside.

The worst pattern is **layout thrashing**: interleaving writes and reads so that each read forces a fresh synchronous layout.

```js
// Thrashes: one forced layout per iteration
for (const el of items) el.style.width = container.offsetWidth / 2 + 'px';

// One layout
const w = container.offsetWidth / 2;
for (const el of items) el.style.width = w + 'px';
```

**Try it:** Write the thrashing loop above over 500 elements and record a trace. Find the purple Layout events with the "Forced reflow" warning and the call stack that points to your line. Fix it and confirm a single Layout remains.

**Resources**
- [web.dev: Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- [Chrome: LayoutNG](https://developer.chrome.com/docs/chromium/layoutng)
- [Paul Irish: What forces layout / reflow](https://gist.github.com/paulirish/5d52fb081b3570c81e3a)

### Paint and layers

Paint does not produce pixels. It walks the layout tree in stacking order and records a **display list**: a sequence of drawing commands such as "draw rectangle", "draw text run", "draw image". The order follows the CSS painting algorithm: within each stacking context, backgrounds and borders, then negative z-index children, in-flow blocks, floats, inline content, and positioned descendants by z-index. This is why `z-index` only competes inside its own stacking context.

Alongside the display list, Chromium builds four **property trees** (transform, clip, effect, scroll) that describe how each chunk of paint commands is positioned, clipped, blended, and scrolled. Separating "what to draw" from "where and how" is what lets the compositor move things without repainting.

**Layerisation** then groups paint chunks into composited layers. Each layer is rasterised independently and can be moved, faded, or scrolled by the compositor alone. Things that typically get their own layer:

- `will-change: transform` (or `opacity`, `filter`), and 3D transforms
- an element with a running animation or transition on `transform` or `opacity`
- `<video>`, `<canvas>`, and cross-process `<iframe>` content
- scrollable containers (so scrolling does not repaint)
- `position: fixed` and `sticky` in many cases, and `backdrop-filter`
- anything that must draw above another composited layer it overlaps

Layers are a trade. They make later changes cheap but cost GPU memory and add compositing work per frame. A 1000 by 1000 CSS pixel layer on a 3x phone is about 36MB. Promote only what actually animates, and remove `will-change` afterwards if you set it from script.

**Try it:** Open the Layers panel on a page with a sticky header and a CSS animation. For each layer read the "Compositing reasons" and memory estimate. Then add `will-change: transform` to a list item class and watch the layer count and memory change.

**Resources**
- [Chrome: Key data structures in RenderingNG](https://developer.chrome.com/docs/chromium/renderingng-data-structures)
- [web.dev: Stick to compositor-only properties and manage layer count](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)
- [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)

### Compositing

After paint, the main thread **commits** its output (layers, display lists, property trees) to the **compositor thread** in the same renderer process. From there the main thread is free, and the rest of the frame happens without it.

The compositor divides each layer into **tiles** and schedules them for **rasterisation**: turning display-list commands into pixels in GPU textures. Tiles near the viewport come first. Raster in Chromium is GPU-accelerated through Skia, with image decoding on worker threads. If you scroll faster than tiles can be rastered, you see blank or low-resolution areas (checkerboarding) rather than a frozen page.

Once tiles are ready, the compositor builds a **compositor frame**: a list of quads ("draw this tile texture at this position with this transform and opacity"). The frame goes to the display compositor (Viz) in the GPU process, which aggregates frames from every renderer process and the browser UI and issues the final draw to the screen.

Because the compositor owns the property trees, it can change a transform, an opacity, or a scroll offset and produce a new frame without style, layout, or paint. That is the entire basis of "compositor-only" animations and of smooth scrolling under a busy main thread. Two things break it:

- **Main-thread dependencies for input**: some input cannot be handled by the compositor alone and must wait for the main thread (see Input handling and scrolling).
- **Raster invalidation**: if content inside the layer changes every frame (animating `background-position` or `width`), the tiles must be re-rastered even though the layer exists.

**Try it:** In the Rendering tab enable "Layer borders" and scroll a long page: watch tiles appear at the edges of each layer. Then run a `while` loop that blocks the main thread for 3 seconds from the console, and during it try scrolling and watch a CSS `transform` animation. Note what keeps moving and what freezes.

**Resources**
- [Chrome: RenderingNG architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture)
- [Chrome: Inside look at modern web browser, part 3](https://developer.chrome.com/blog/inside-browser-part3)
- [Chrome: Inside look at modern web browser, part 4](https://developer.chrome.com/blog/inside-browser-part4)

### Input handling and scrolling

Input arrives in the browser process, which only knows which tab it belongs to. It forwards the event to that tab's renderer, where the **compositor thread** receives it first. What happens next decides whether the interaction can be smooth while the main thread is busy.

For a scroll gesture (wheel, touch drag, trackpad), the compositor **hit tests** against its own copy of the layer and property trees to find the scroller under the pointer. If nothing on the main thread could object, it updates the scroll offset itself and produces a frame immediately. The main thread is told afterwards, which is why `scroll` events report a position that has already been displayed and can never cancel a scroll.

The compositor cannot do this if a script might call `preventDefault()`. Regions of the page covered by a non-passive `touchstart`, `touchmove`, or `wheel` listener are recorded as needing the main thread. For input landing there, the compositor must send the event to the main thread and *wait for the listener to return* before it scrolls. If the main thread is in a 200ms task, the scroll starts 200ms late.

```js
// Blocks compositor scrolling over the element while the listener runs
el.addEventListener('wheel', onWheel);
// Promises not to cancel: scrolling proceeds without waiting
el.addEventListener('wheel', onWheel, { passive: true });
```

Browsers treat these listeners as passive by default only when they are on `window`, `document`, or `body`. On any other element, including a root container used for event delegation, you must say so. If you really need to cancel a gesture, prefer declaring it in CSS with `touch-action` or `overscroll-behavior`, which the compositor can read without running script.

Other things that push scrolling to the main thread: a scroller that could not be given its own composited layer, and effects that must repaint on scroll such as `background-attachment: fixed`. Scroll-linked effects written in a `scroll` handler always lag the compositor by at least a frame; scroll-driven animations (`animation-timeline: scroll()`) and `position: sticky` run in step with it.

Discrete events (`click`, `keydown`, `pointerdown`) always go to the main thread, where hit testing against the layout tree finds the target element and the event is dispatched. Continuous events (`pointermove`, `touchmove`, `wheel`) are coalesced and delivered once per frame; `getCoalescedEvents()` recovers the intermediate points for drawing apps.

**Try it:** In the Rendering tab enable "Scrolling performance issues" on a page with touch or wheel listeners and find the regions flagged as slow. Add a non-passive `wheel` listener that busy-loops for 100ms to a scrollable element, feel the scroll, then add `{ passive: true }` and compare.

**Resources**
- [Chrome: Inside look at modern web browser, part 4](https://developer.chrome.com/blog/inside-browser-part4)
- [MDN: EventTarget.addEventListener(), using passive listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#using_passive_listeners)
- [Chrome: RenderingNG architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture)

### The frame lifecycle

A display at 60Hz refreshes every 16.7ms; at 120Hz, every 8.3ms. To show a visual change, the browser must run a fixed sequence inside that window. When the compositor decides a main-thread frame is needed, the order in a renderer is:

1. **Input**: continuous events (`pointermove`, `touchmove`, `wheel`, `scroll`) are coalesced and delivered once per frame, just before rAF.
2. **`requestAnimationFrame` callbacks**: your last chance to mutate before the browser reads.
3. **Style** recalculation.
4. **Layout**, followed by `ResizeObserver` callbacks. If those change layout, style and layout rerun, looping until settled.
5. **Pre-paint**: update property trees and decide what to repaint.
6. `IntersectionObserver` notifications are computed.
7. **Paint**: record display lists.
8. **Commit** to the compositor thread, then raster, then **draw** in the GPU process.

Your code does not get the full 16.7ms. Raster, compositing, and browser overhead need a share, so budget roughly 10ms of main-thread work per frame at 60Hz, and far less at 120Hz. If the main thread misses the deadline, the compositor can still present a frame with updated scroll and compositor animations but stale main-thread content; DevTools shows that as a partially presented frame.

Useful facts: several `rAF` callbacks requested in one frame all run in the same frame, in registration order; a `rAF` requested *inside* a `rAF` callback runs next frame; style changes made in a `rAF` are applied in that frame; reading layout inside a `rAF` after writing still forces a synchronous layout. Work that is not visual does not belong in `rAF`; use `requestIdleCallback` or a scheduler task so it does not eat the frame budget.

**Try it:** Record a short trace of an animation driven by `requestAnimationFrame`. Zoom into one frame in the Main track and find, in order, Animation Frame Fired, Recalculate Style, Layout, Pre-paint, Paint, and Commit. Note the duration of each and how much of 16.7ms remains.

**Resources**
- [web.dev: Rendering performance](https://web.dev/articles/rendering-performance)
- [HTML Standard: Update the rendering](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering)
- [Chrome: RenderingNG architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture)

### Invalidation

Every style change invalidates some suffix of the pipeline. Knowing which lets you predict cost before measuring.

| Change | Style | Layout | Paint | Composite |
| --- | --- | --- | --- | --- |
| `width`, `height`, `margin`, `padding`, `top`, `font-size`, `display`, text content | yes | yes | yes | yes |
| `color`, `background-color`, `box-shadow`, `outline`, `visibility`, `border-radius` | yes | no | yes | yes |
| `transform`, `opacity` on an element with its own layer | yes | no | no | yes |

Style always runs: the browser must work out what changed. The savings come from skipping the later stages.

The details that catch people:

- "Composite only" depends on the element having its own composited layer. Animations and transitions on `transform` and `opacity` promote the element automatically for their duration and run on the compositor thread, so they continue during main-thread jank. Setting `el.style.transform` from JavaScript every frame still needs the main thread to run your script and style.
- `filter` and `backdrop-filter` can be compositor-driven too, but they are expensive to raster.
- Layout changes are not local by default. Changing one element's height can move everything after it. `position: absolute` or containment limits the blast radius.
- Paint invalidation is by region and by layer. A small colour change inside a huge layer re-rasters only the damaged tiles, but a change on a non-promoted element that overlaps many others repaints them all.
- Scroll-driven animations that animate `transform` or `opacity` run on the compositor in browsers that support them.

The standard technique for animating size or position is FLIP: measure first and last positions, apply an inverse `transform`, and animate the transform back to none, so only compositing happens during the animation.

**Try it:** Build a box with three buttons that animate `left`, `background-color`, and `transform` respectively. Enable Paint flashing and record each. Confirm which of Layout and Paint events appear per frame for each, and which animation survives a deliberately blocked main thread.

**Resources**
- [web.dev: How to create high-performance CSS animations](https://web.dev/articles/animations-guide)
- [web.dev: Simplify paint complexity and reduce paint areas](https://web.dev/articles/simplify-paint-complexity-and-reduce-paint-areas)
- [MDN: CSS and JavaScript animation performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)

### Engine pipeline

JavaScript engines do not compile your whole program to machine code up front; they start cheaply and spend compile time only on code that proves hot. In V8:

1. **Parse**: source to AST. Functions not called immediately are only *pre-parsed* (checked for syntax errors and scope information) and fully parsed on first call, so unused code costs little beyond download.
2. **Ignition**: the AST becomes compact bytecode, run by an interpreter. While running, it records **type feedback**: which object shapes and value types each operation saw.
3. **Sparkplug**: a non-optimising compiler that translates bytecode to machine code almost instantly. No speculation, modest speedup.
4. **Maglev**: a fast optimising compiler that uses the feedback to generate decent code quickly.
5. **TurboFan**: the top tier, with expensive optimisations (inlining, escape analysis, loop optimisation) for the hottest code.

Functions tier up based on invocation and loop counts, with compilation on background threads; long-running loops switch mid-execution through on-stack replacement. Optimised code is **speculative**: it assumes the types seen so far will continue, guarded by checks. A failed check throws the code away (see Deoptimisation).

Other engines have the same shape with different names: JavaScriptCore uses LLInt, Baseline, DFG, and FTL; SpiderMonkey uses a baseline interpreter, Baseline JIT, and Warp/Ion.

What follows for you: startup cost is dominated by parse and compile of code that runs once, so shipping less JavaScript beats any micro-optimisation; engines cache compiled bytecode for scripts fetched repeatedly, which works best with stable, long-cached files; and benchmarks of cold code measure the interpreter, not the optimiser. Type-stable, boring code is fast code.

**Try it:** Write a function that sums an array, call it in a loop 100,000 times, and run `node --trace-opt file.js`. Read the log lines showing the function being marked and compiled by each tier. Then run `node --print-bytecode --print-bytecode-filter=sum file.js` and read the bytecode.

**Resources**
- [V8: Maglev, V8's fastest optimizing JIT](https://v8.dev/blog/maglev)
- [V8: Sparkplug, a non-optimizing JavaScript compiler](https://v8.dev/blog/sparkplug)
- [V8: Ignition](https://v8.dev/docs/ignition)

### Hidden classes and inline caches

JavaScript objects look like dictionaries, but engines implement them as fixed-layout structs. Each object points to a **hidden class** (V8 calls it a Map, others a Shape or Structure) that records which properties exist and at which offset. Objects created the same way share a hidden class. Adding a property moves the object to a new hidden class along a *transition chain*, so order matters:

```js
const a = { x: 1, y: 2 };
const b = { y: 2, x: 1 };   // different hidden class from a
const c = { x: 1 }; c.y = 2; // same hidden class as a
```

An **inline cache** (IC) sits at each property access site in your code. The first time `p.x` runs, the engine looks up `x`, then remembers "for hidden class H, `x` is at offset 12". Next time, one pointer comparison and one load. The cache has states:

- **monomorphic**: one shape seen. Fastest, and the optimiser can inline through it.
- **polymorphic**: a handful of shapes (up to four in V8). A short chain of checks.
- **megamorphic**: too many. Falls back to a global hash lookup, and the optimiser gives up on the site.

Things that hurt: creating "the same" object in different property orders, adding properties conditionally after construction, `delete obj.prop` (which can push an object into slow dictionary mode), and passing many unrelated object types through one hot utility function. Arrays have the analogous **elements kinds**: an array of small integers is stored more compactly than doubles, which beat generic values, and a hole (`arr[100] = 1` on an empty array) makes it "holey" permanently.

The practical rule: initialise all fields in the constructor or literal, always in the same order, with consistent types, and use `null` rather than leaving a field off.

**Try it:** Run `node --allow-natives-syntax` and evaluate `%HaveSameMap({x:1,y:2}, {y:2,x:1})` and `%HaveSameMap({x:1,y:2}, {x:3,y:4})`. Then benchmark a function reading `.x` when fed one shape versus ten shapes.

**Resources**
- [V8: Maps (hidden classes) in V8](https://v8.dev/docs/hidden-classes)
- [Mathias Bynens: JavaScript engine fundamentals, shapes and inline caches](https://mathiasbynens.be/notes/shapes-ics)
- [V8: Elements kinds in V8](https://v8.dev/blog/elements-kinds)

### Deoptimisation

Optimised machine code is built on assumptions drawn from type feedback: "this argument is always a small integer", "this object always has hidden class H", "this array has no holes". Each assumption is protected by a cheap guard. When a guard fails, the engine **deoptimises**: it discards the optimised frame, reconstructs the equivalent interpreter state, and resumes in bytecode. The function may be re-optimised later with broader assumptions.

A single deopt costs microseconds. The problem is repetition: code that optimises, deopts, re-optimises, and deopts again spends its time compiling. V8 eventually stops trying for a function that keeps bailing out.

Typical triggers:

- a new hidden class at a monomorphic site ("wrong map")
- an integer operation overflowing the small-integer range, or producing a double or `-0`
- reading out of bounds or reading a hole from an array
- a value that was always a number becoming `undefined` or a string
- changing an object's shape or a prototype that optimised code depended on

```js
function add(a, b) { return a + b; }
for (let i = 0; i < 1e5; i++) add(i, 1); // optimised for small integers
add('1', 2);                             // deopt: not a number
```

Things that are *not* a problem in current engines, despite old advice: `try`/`catch`, `let` and `const`, `arguments` used normally, and `for...of`. Do not contort code to avoid deopts you have not measured. Keep hot functions type-stable, do not mix numbers and strings in the same variable, and keep arrays dense and homogeneous. TypeScript does not guarantee this at runtime, but code that type-checks cleanly without unions in hot paths is usually well-behaved.

**Try it:** Save the snippet above and run `node --trace-opt --trace-deopt file.js`. Find the line reporting the bailout and its reason. Then change the last call to `add(1.5, 2)` and observe whether and why it deopts.

**Resources**
- [Benedikt Meurer (V8 team): An introduction to speculative optimization in V8](https://benediktmeurer.de/2017/12/13/an-introduction-to-speculative-optimization-in-v8/)
- [V8: TurboFan](https://v8.dev/docs/turbofan)
- [WebKit: Speculation in JavaScriptCore](https://webkit.org/blog/10308/speculation-in-javascriptcore/)

### Garbage collection

An object stays alive while it is **reachable** from a root: the global object, the current call stack, or anything those reference. The collector frees what is unreachable. You cannot trigger or predict it from code; you can only control what stays reachable.

V8's collector is **generational**, built on the observation that most objects die young. New objects go in the young generation. A minor GC (the scavenger) copies survivors and discards the rest, so its cost scales with the amount of *live* data, not garbage; short-lived temporaries are nearly free. Objects surviving two scavenges are promoted to the old generation, which is collected by mark-sweep-compact: mark everything reachable, sweep the rest, and occasionally compact to reduce fragmentation.

To avoid long pauses, the major collector is:

- **incremental**: marking is split into small steps interleaved with your JavaScript
- **concurrent**: helper threads mark and sweep while JavaScript runs
- **parallel**: during a pause, several threads share the work

Pauses still exist, and they land on the main thread. Allocation-heavy code in animation loops produces frequent minor GCs that show up as jitter; reuse objects in per-frame hot paths if a trace shows it.

A **leak** in JavaScript means unintentionally reachable memory. The usual causes: listeners never removed, timers never cleared, growing `Map`s and arrays used as caches, closures capturing large scopes, and detached DOM subtrees still referenced from JavaScript. `WeakMap`, `WeakRef`, and `AbortController` for listener cleanup are the tools. `WeakMap` keys do not keep their values alive, which makes it the correct structure for per-object metadata.

**Try it:** Create a page with a button that appends 1,000 nodes to an array and removes them from the DOM. In the Memory panel take a heap snapshot, click the button five times, take another, and use the Comparison view filtered to "Detached" to find the retained nodes and their retaining path.

**Resources**
- [V8: Trash talk, the Orinoco garbage collector](https://v8.dev/blog/trash-talk)
- [Chrome DevTools: Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems)
- [MDN: Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management)

### Event loop in detail

The HTML Standard defines the event loop, not ECMAScript. Its model:

- There are several **task queues** (timers, user input, networking, and so on), not one. On each turn, the browser *chooses* a queue and runs its oldest runnable **task**. Browsers use this freedom to prioritise input over timers.
- After the task, and more generally whenever the JavaScript call stack empties, the browser performs a **microtask checkpoint**: it runs microtasks until the queue is empty, including ones queued during the checkpoint. Promise reactions, `queueMicrotask`, and `MutationObserver` callbacks are microtasks.
- When there is a **rendering opportunity** (typically once per display refresh, and not at all for hidden tabs), the browser runs "update the rendering": dispatch resize and scroll events, evaluate media queries, update animations, run `requestAnimationFrame` callbacks, recalculate style and layout, run `ResizeObserver` callbacks, compute `IntersectionObserver` entries, and paint.

Consequences worth memorising:

```js
button.addEventListener('click', () => {
  Promise.resolve().then(() => console.log('micro 1'));
  console.log('listener 1');
});
button.addEventListener('click', () => {
  Promise.resolve().then(() => console.log('micro 2'));
  console.log('listener 2');
});
```

A real click logs `listener 1, micro 1, listener 2, micro 2`, because the stack empties between listeners. Calling `button.click()` from script logs both listeners first: the stack is not empty until your script returns.

Other traps: the DOM never renders between two synchronous statements, so toggling a class off and on in one task does nothing visible; an `await` on a resolved promise does not let the browser paint; and `setTimeout(fn, 0)` runs in a later task, usually but not necessarily after the next render. Workers have their own event loops without rendering steps.

**Try it:** Predict, then run, the click example both ways. Next, write a button handler that sets `el.textContent = 'Working'` and then blocks for two seconds; explain why the text never appears and fix it by yielding with a task, not a microtask.

**Resources**
- [HTML Standard: Event loop processing model](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)
- [MDN: Using microtasks in JavaScript with queueMicrotask()](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)
- [Jake Archibald: Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)

### WebAssembly

WebAssembly (Wasm) is a compact binary instruction format for a stack-based virtual machine, designed as a compilation target for languages such as C, C++, Rust, Go, and, with the garbage-collection extension, Kotlin and Dart. A module is validated and compiled to machine code by the same engine that runs JavaScript, inside the same sandbox, with the same origin restrictions. It has no access to the DOM or any web API except through functions you import from JavaScript.

```js
const { instance } = await WebAssembly.instantiateStreaming(
  fetch('/add.wasm'),            // must be served as application/wasm
  { env: { log: console.log } }  // imports
);
console.log(instance.exports.add(2, 3));
```

Core Wasm values are numbers (`i32`, `i64`, `f32`, `f64`) plus references. Strings, objects, and arrays do not cross the boundary for free: the classic approach is to copy bytes into the module's linear memory (an `ArrayBuffer` you can view from JavaScript) and pass a pointer and length. Toolchains generate that glue for you (`wasm-bindgen` for Rust, Emscripten for C/C++). Each boundary crossing is cheap but not zero, so chatty designs that call into Wasm thousands of times per frame lose the benefit.

Use it for: CPU-bound work with predictable performance (codecs, image and video processing, compression, cryptography, physics, parsers), and for reusing existing native libraries such as SQLite, FFmpeg, or a PDF engine. Do not use it to speed up ordinary UI code: DOM work is the bottleneck there, well-optimised JavaScript is competitive, and Wasm binaries add download and compile cost. Wasm is not automatically faster; it is more *predictable*, with no warm-up tiers or deopts. Run heavy modules in a worker; threads require `SharedArrayBuffer` and therefore cross-origin isolation.

**Try it:** Follow MDN's guide to compile a small Rust or C function to Wasm, load it with `instantiateStreaming`, and benchmark it against a JavaScript version over a large typed array. Then pass a string in and inspect the generated glue code.

**Resources**
- [MDN: WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [MDN: Loading and running WebAssembly code](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Loading_and_running)
- [WebAssembly.org: Specifications](https://webassembly.org/specs/)

### Connection management

Opening a connection is expensive: DNS lookup, TCP handshake, TLS handshake, each a round trip or more. Browsers therefore pool and reuse connections, and the rules differ by protocol.

**HTTP/1.1**: one request at a time per connection. Browsers open up to six connections per host and queue the rest; that queueing is the "Stalled" time in DevTools. This limit motivated old hacks such as domain sharding and sprite sheets.

**HTTP/2**: one TCP connection per origin carries many concurrent **streams**, with header compression and prioritisation. Sharding now hurts, since it forces extra connections and splits prioritisation. A browser can even reuse one connection for different hostnames if the certificate covers them and they resolve to the same IP (connection coalescing). The weakness is TCP head-of-line blocking: one lost packet stalls every stream until it is retransmitted.

**HTTP/3** runs over **QUIC**, a UDP-based transport with TLS 1.3 built in. Streams are independent, so loss on one does not block others; the handshake takes one round trip, or zero on resumption; and connections survive a change of network (Wi-Fi to cellular) because they are identified by a connection ID rather than an IP and port. Browsers discover HTTP/3 through the `Alt-Svc` response header or an HTTPS DNS record, so the first visit often uses HTTP/2.

What you control: use few origins; add `<link rel="preconnect">` for the one or two critical third-party origins (each idle connection costs something, so do not spray them); remember that credentialed and anonymous requests use *separate* connections, which is why fonts need `preconnect` with `crossorigin`; and keep connections warm rather than relying on many short bursts.

**Try it:** In the Network panel add the Protocol and Connection ID columns and reload a site. Count distinct connections per origin and note which are `h2` and `h3`. Click a request, open Timing, and identify which requests paid for DNS, connect, and TLS and which reused a connection.

**Resources**
- [MDN: Connection management in HTTP/1.x](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Connection_management_in_HTTP_1.x)
- [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html)
- [web.dev: Establish network connections early](https://web.dev/articles/preconnect-and-dns-prefetch)

### Resource prioritisation

A page requests far more than the network can deliver at once, so the browser assigns each request a priority and uses it to order requests, to delay some, and to signal the server (HTTP/2 and HTTP/3 carry priority hints so the server can order responses on a shared connection).

Chromium's defaults, roughly:

| Resource | Default priority |
| --- | --- |
| Main document, render-blocking CSS, fonts | Highest |
| Parser-blocking script in `<head>`, preloads, `fetch()` | High |
| Script late in the document, first few large images | Medium |
| `async` and `defer` scripts, images, non-matching CSS | Low |
| Prefetches | Lowest |

Priorities are revised as the browser learns more: an image starts Low and is boosted to High once layout shows it is in the viewport. That boost comes late, which is the main reason an LCP image loads slower than it should. Chrome also limits concurrent low-priority requests while the document's head is still being processed, so that critical resources get the bandwidth.

You adjust this with the `fetchpriority` attribute, supported in all major engines:

```html
<img src="hero.avif" fetchpriority="high" alt="">
<img src="carousel-3.avif" fetchpriority="low" loading="lazy" alt="">
<link rel="preload" as="image" href="hero.avif" fetchpriority="high">
<script src="analytics.js" async fetchpriority="low"></script>
```

It is a hint relative to the type's default, not an absolute level. Mistakes: marking many things `high`, which cancels out; preloading resources without the right `as`, which gets a wrong priority and a double download; `loading="lazy"` on the LCP image; and hiding the hero in a CSS background, where it is discovered late and cannot be boosted without a preload. Other engines use different heuristics, so verify in each.

**Try it:** Open the Network panel, enable the Priority column and "Big request rows" to see initial and final priority. Reload a page with a hero image and find its priority change. Add `fetchpriority="high"` and compare the image's start time and LCP.

**Resources**
- [web.dev: Optimize resource loading with the Fetch Priority API](https://web.dev/articles/fetch-priority)
- [MDN: HTMLImageElement.fetchPriority](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/fetchPriority)
- [RFC 9218: Extensible Prioritization Scheme for HTTP](https://www.rfc-editor.org/rfc/rfc9218.html)

### HTTP cache

"The cache" is several caches checked in order. In Chromium a request passes through:

1. The **memory cache** in the renderer: resources already used by the current document (and preloads). It matches loosely on URL and type, barely consults HTTP headers, and dies with the page. This is why the same image used twenty times is one request, and why DevTools shows `(memory cache)`.
2. The **service worker**, if one controls the page, which may answer from the Cache Storage API. That is a separate, script-managed store with no automatic expiry.
3. The **HTTP cache** (disk cache) in the network service, which follows the HTTP caching rules.

The HTTP cache stores a response if headers allow it and serves it without contacting the server while it is **fresh** (`Cache-Control: max-age`). Once stale it **revalidates** with `If-None-Match` (ETag) or `If-Modified-Since`; a `304 Not Modified` costs a round trip but no body. `no-cache` means "store, but revalidate every time"; `no-store` means "do not store". With no freshness headers at all, browsers guess a lifetime from `Last-Modified`, which produces confusing stale responses. The durable recipe is content-hashed filenames with `max-age=31536000, immutable` for assets, and `no-cache` for HTML.

**Cache partitioning**: to stop sites probing each other's caches for tracking, every major browser keys the HTTP cache by the top-level site (Chrome also by the frame's site) in addition to the URL. A library fetched from a public CDN on site A is downloaded again on site B. The old argument for shared CDNs is gone; self-host your dependencies and save a connection.

Reload semantics differ too: a normal reload revalidates the main document, and a hard reload bypasses the cache entirely.

**Try it:** Load a page twice with DevTools open and "Disable cache" off. In the Size column classify each response as memory cache, disk cache, 304, or full download, and explain each from its response headers. Then press reload and hard reload and see what changes.

**Resources**
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [web.dev: Prevent unnecessary network requests with the HTTP Cache](https://web.dev/articles/http-cache)
- [Chrome: Gaining security and privacy by partitioning the cache](https://developer.chrome.com/blog/http-cache-partitioning)

### Service worker lifecycle

A service worker is an event-driven worker that the browser starts and stops at will, registered for a URL **scope**, that can intercept network requests from pages in that scope. The lifecycle exists to guarantee one thing: a page is controlled by exactly one version for its whole life.

- **Register**: `navigator.serviceWorker.register('/sw.js')`. The default scope is the script's directory, which is why the file belongs at the root.
- **Install**: the `install` event fires once per version. `event.waitUntil(promise)` keeps the worker alive and fails the install if the promise rejects. This is where you precache.
- **Waiting**: if an older version still controls any open client, the new one waits. Refreshing a single tab does not release it, because the new document is requested before the old one unloads.
- **Activate**: fires when the old version has no clients, or immediately after `skipWaiting()`. Clean up old caches here.
- **Fetch**: an active worker receives `fetch` events for navigations and subresources of controlled pages. Pages loaded before activation are not controlled until reloaded or until `clients.claim()`.

Inside the browser: the worker is terminated after about 30 seconds idle and restarted for the next event, so global variables are not state. Starting a stopped worker delays the navigation it must handle; **navigation preload** lets the network request start in parallel. Update checks happen on navigation to an in-scope page and on events such as push; the browser fetches the script (ignoring the HTTP cache for the top-level script by default) and installs a new version if it or its imports differ by a single byte. A `fetch` handler that does nothing useful still costs startup time, so do not register an empty one; Chromium's static routing API (`event.addRoutes()` in `install`) can bypass the worker for declared routes.

**Try it:** Register a worker that logs in `install`, `activate`, and `fetch`. Change one byte, reload, and watch the new version sit in "waiting" in Application, Service workers. Close all tabs for the origin, reopen, and see it activate. Then view the same in `chrome://serviceworker-internals`.

**Resources**
- [web.dev: The service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [Service Workers specification](https://w3c.github.io/ServiceWorker/)
- [MDN: Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)

### Read a spec

Specifications are the only place where behaviour is defined rather than described. MDN tells you what usually happens; the spec tells you what must happen, including the edge cases. Three families cover most questions: the WHATWG **HTML Standard** (parsing, the event loop, navigation, forms, most DOM-adjacent APIs) and its sibling standards (DOM, Fetch, URL); the CSS Working Group's modular **CSS specifications**; and TC39's **ECMAScript** specification.

How to read one:

- Start from MDN. Every reference page has a "Specifications" section linking to the exact anchor. Do not start from the table of contents.
- Specs are written as **algorithms**: numbered steps in a stilted, precise English. Read them like code. Terms in italics or links are defined elsewhere; follow the link rather than guessing.
- Learn the conventions. In ECMAScript, `? Foo()` means "call Foo and return early if it throws", `! Foo()` asserts it cannot throw, and `[[DoubleBrackets]]` name internal slots and methods. In web specs, the Infra Standard defines words such as "list", "ordered map", and "in parallel".
- Normative text (requirements with "must") binds implementations. Notes and examples, usually in green boxes, are explanatory.
- For CSS, prefer the Editor's Draft at `drafts.csswg.org` for the current thinking, and check each module's status: a Working Draft may describe things no browser ships. Property definition tables tell you the initial value, whether it inherits, and what percentages refer to.
- The HTML Standard has a "developer's edition" that hides implementer-only detail.

A spec says what is correct, not what browsers do. Pair it with web-platform-tests results to see who conforms.

**Try it:** Answer from the specs, with a link to the exact step: (1) why does `[] + {}` evaluate to `"[object Object]"`? (2) Which is run first in "update the rendering": `requestAnimationFrame` callbacks or `ResizeObserver` callbacks? (3) What is the initial value of `min-width` on a flex item, and why does that cause overflow?

**Resources**
- [HTML Standard](https://html.spec.whatwg.org/multipage/)
- [Timothy Gu: How to read the ECMAScript specification](https://timothygu.me/es-howto/)
- [W3C CSS Working Group: Understanding the CSS specifications](https://www.w3.org/Style/CSS/read)

### Track platform changes

The platform ships new features every few weeks: Chrome and Firefox release roughly every four weeks, and Safari ships several feature releases a year alongside OS updates. You need a routine for knowing what exists and what is safe to use, without reading everything.

**Baseline** is the shared answer to "can I use this?". A feature is *Baseline Newly available* when it works in the current stable versions of Chrome, Edge, Firefox, and Safari (desktop and mobile), and *Widely available* 30 months later. MDN shows the Baseline badge at the top of each reference page, and Web Platform Status (webstatus.dev) lets you query and filter the whole feature set. Many teams adopt "Widely available" as their default and treat anything newer as progressive enhancement with a fallback.

**Interop** is an annual agreement among browser vendors to fix a chosen list of features so they pass the same web-platform-tests. The Interop dashboard on wpt.fyi shows per-browser scores. A feature in an Interop focus area is one you can expect to become reliable within the year; Interop 2026 includes, among others, anchor positioning, view transitions, scroll-driven animations, and the Navigation API.

**Release notes**: read the per-release notes for Chrome, Firefox (on MDN), and Safari (on the WebKit blog). For what is coming, Chrome Platform Status lists features by milestone, and each engine publishes its position on proposals (Mozilla and WebKit "standards positions").

Practical habits: subscribe to the three release-note feeds; check Baseline before adopting a feature; configure your tools to match your target (Browserslist supports Baseline queries, and linters can warn on features outside it); and when support is partial, feature-detect with `@supports` or `in` checks rather than user-agent sniffing.

**Try it:** Pick three features you want to use (for example CSS anchor positioning, the View Transitions API, and `scheduler.yield()`). For each, find its Baseline status on webstatus.dev, the version each browser shipped it in, and whether it is in the current Interop. Decide how you would ship each today.

**Resources**
- [web.dev: Baseline](https://web.dev/baseline)
- [Web Platform Status](https://webstatus.dev/)
- [web.dev: Interop 2026](https://web.dev/blog/interop-2026)

### File a browser bug

Browsers have bugs, and well-reported ones get fixed. The work is mostly in proving that it is a browser bug and making it trivial for an engineer to see.

1. **Confirm it is a bug.** Compare Chrome, Firefox, and Safari. Read the spec to determine the correct behaviour; a difference between browsers means at least one is wrong, but possibly the one you favoured. Test in the nightly build (Chrome Canary, Firefox Nightly, Safari Technology Preview): it may already be fixed.
2. **Search first.** Look in the tracker for existing reports and add a star or a useful comment rather than a duplicate. Check web-platform-tests for a failing test covering it.
3. **Reduce.** Produce the smallest single HTML file that shows the problem: no framework, no build step, no external resources, ideally under 30 lines. Delete things until removing anything more makes the bug disappear. Half the time the reduction reveals a mistake in your own code.
4. **Report.** State the steps to reproduce, the *expected* result with a spec link, the *actual* result, the exact browser version and OS, and whether it is a regression (worked in version N, broken in N+1). Attach the reduction as a file or a live URL, plus a screenshot or trace for visual and performance issues.

Where to file: Chromium at issues.chromium.org, WebKit at bugs.webkit.org, Firefox at bugzilla.mozilla.org. If browsers disagree and the spec is ambiguous, the bug belongs on the specification's GitHub repository instead.

Tone matters. Describe the user impact and how widely it applies; do not demand timelines. A regression with a reduced test case and a bisected version range is the kind of report that gets triaged the same week. Afterwards, respond to questions promptly and link the issue from the workaround in your code so it can be removed later.

**Try it:** Take a rendering or behaviour difference you have hit between two browsers (or pick an open failing test on wpt.fyi). Write a reduction of under 30 lines and a full report with expected, actual, versions, and spec link. Search the tracker to see whether it already exists.

**Resources**
- [web.dev: How to file a good browser bug](https://web.dev/articles/how-to-file-a-good-bug)
- [WebKit: Reporting bugs](https://webkit.org/reporting-bugs/)
- [Chromium: Bug reporting guidelines](https://www.chromium.org/for-testers/bug-reporting-guidelines/)

### Trace a frame

This exercise turns the pipeline from a diagram into something you have seen. The goal is to record one frame and name every stage in it.

Set up a page that changes layout each frame, for example a `requestAnimationFrame` loop that sets `el.style.width`. Open the Performance panel, enable 4x CPU throttling, and record two seconds. Then:

1. In the **Frames** track, click one frame. Note its duration and whether it was presented, partially presented, or dropped.
2. In the **Main** track under that frame, find the task and label each child event: **Animation Frame Fired** (your rAF callback), **Recalculate Style**, **Layout**, **Pre-paint**, **Paint**, **Layerize**, and **Commit**. Click each and read the Summary: element counts for style, nodes needing layout, and the layout root.
3. Expand the **Compositor** thread and the raster worker tracks. Find the raster tasks and the frame submission that follow the commit.
4. Expand the **GPU** track for the final draw.
5. Add up the main-thread time and compare it with the frame budget.

Now change the animation to use `transform` instead of `width` and record again. Layout and Paint should vanish from the per-frame work. Change it to a CSS animation and the main thread should be idle while frames continue.

For more depth, record the same thing with `chrome://tracing` or the Perfetto UI, which shows every process: the browser process delivering input, the renderer main and compositor threads, and Viz in the GPU process, linked by flow arrows.

Common confusions: the events are nested inside a task, so read by start time, not vertical position; small "System" gaps are browser overhead; and a frame with no main-thread work is normal for compositor-only updates.

**Try it:** Take a screenshot of one frame from your trace and annotate it with the name, duration, and owning thread of every stage from input to draw. Do it for the `width` version and the `transform` version and write two sentences on the difference.

**Resources**
- [Chrome DevTools: Analyze runtime performance](https://developer.chrome.com/docs/devtools/performance)
- [Chrome DevTools: Performance features reference](https://developer.chrome.com/docs/devtools/performance/reference)
- [Perfetto: Trace viewer](https://ui.perfetto.dev/)

### Explain a jank

Jank is a visible stutter: a frame that should have been shown was late or skipped. "The page feels slow" is not a diagnosis. The skill here is attributing a specific dropped frame to a specific stage and line of code, and proving the fix.

A method that works:

1. **Reproduce reliably.** Find the exact interaction (scrolling a list, opening a menu, typing) and throttle the CPU until it is obvious. If you cannot reproduce it, you cannot verify a fix.
2. **Record only that interaction**, a few seconds at most.
3. **Find the bad frames** in the Frames track (red or yellow) and the long tasks above them. Use the Interactions track when the symptom is input delay.
4. **Attribute.** Look at the colour and the Bottom-up tab for the offending task:

| Symptom in trace | Stage | Typical cause |
| --- | --- | --- |
| Long yellow blocks | Script | heavy handler, hydration, synchronous parsing |
| Minor/Major GC events | GC | allocation in a hot loop |
| Large Recalculate Style | Style | class toggled high in the tree, huge DOM |
| Repeated Layout with forced reflow warning | Layout | read-after-write thrashing |
| Long Paint or raster tasks | Paint/raster | large blurred shadows, filters, big repaints |
| Main thread idle but frames dropped | Compositor/GPU | too many or too large layers, expensive filters |

5. **State a hypothesis** in one sentence: "Scrolling janks because the scroll handler reads `offsetTop` after writing `style.top`, forcing layout of 4,000 nodes each frame."
6. **Change one thing, re-record, compare** the same frames. If the event did not shrink, the hypothesis was wrong.

Do not stop at the first long task: verify that it coincides with the dropped frames. And do not fix by guesswork such as adding `will-change`; that often moves cost to memory and raster.

**Try it:** Build a list of 2,000 rows where a scroll listener sets each visible row's width based on `getBoundingClientRect()`. Record the jank, write the one-sentence attribution, fix it (batch reads, or use `IntersectionObserver`, or `content-visibility: auto`), and show before and after frame times.

**Resources**
- [Chrome DevTools: Analyze runtime performance](https://developer.chrome.com/docs/devtools/performance)
- [Chrome: Long Animation Frames API](https://developer.chrome.com/docs/web-platform/long-animation-frames)
- [web.dev: Rendering performance](https://web.dev/articles/rendering-performance)
