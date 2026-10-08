# Browser Internals: Practice test

### 1. A page at `https://shop.example.com` embeds an `<iframe>` from `https://pay.other.net`. With site isolation enabled in Chrome, where does the iframe's JavaScript run?

- [ ] On a separate thread inside the parent page's renderer process
- [x] In a different renderer process from the parent document
- [ ] In the browser process, because it is cross-origin
- [ ] In the GPU process, composited as a texture

> Site isolation places documents from different sites in different renderer processes, so a cross-site iframe becomes an out-of-process iframe. A thread in the same process would share an address space, which is exactly what site isolation exists to prevent. The browser process never runs page script.

### 2. Which of these can continue to update on screen while the main thread is blocked by a long-running script?

- [ ] A `setInterval` that changes `el.style.left`
- [ ] A `requestAnimationFrame` loop that sets `el.style.transform`
- [x] A CSS animation of `transform` on the element
- [ ] A CSS transition of `height`

> A CSS animation of `transform` is handed to the compositor thread and needs no main-thread work per frame. A `requestAnimationFrame` loop sets a compositor-friendly property, but the callback itself runs on the main thread, so it stalls. `height` needs layout, which is main-thread work.

### 3. A user navigates from your page to another site, then presses Back, and your page is restored from the back/forward cache. What is logged during the restore?

```js
window.addEventListener('load', () => console.log('load'));
window.addEventListener('pageshow', (e) => console.log('pageshow', e.persisted));
```

- [ ] `load`, then `pageshow false`
- [ ] `load`, then `pageshow true`
- [x] Only `pageshow true`
- [ ] Nothing, because the page is frozen

> A bfcache restore resumes the existing document, with its JavaScript heap intact, rather than loading it again. `load` and `DOMContentLoaded` do not fire; `pageshow` fires with `persisted` set to true. Any data that may have gone stale (login state, cart contents) should be refreshed in that handler.

### 4. What does this log when the user physically clicks the button?

```js
button.addEventListener('click', () => {
  Promise.resolve().then(() => console.log('A'));
  console.log('B');
});
button.addEventListener('click', () => {
  Promise.resolve().then(() => console.log('C'));
  console.log('D');
});
```

- [ ] B, D, A, C
- [x] B, A, D, C
- [ ] A, B, C, D
- [ ] B, D, C, A

> A microtask checkpoint happens whenever the JavaScript stack empties, which occurs between the two listeners when the browser dispatches the event. So A runs before the second listener. If the click were triggered by `button.click()` from script, the stack would not be empty between listeners and the output would be B, D, A, C.

### 5. The stylesheet takes 3 seconds to load. When does `ran` log, and when is "Hello" painted?

```html
<head>
  <link rel="stylesheet" href="/slow.css">
  <script>console.log('ran');</script>
</head>
<body><p>Hello</p></body>
```

- [ ] `ran` logs immediately; "Hello" paints immediately, unstyled
- [ ] `ran` logs immediately; "Hello" paints after about 3 seconds
- [x] `ran` logs after about 3 seconds; "Hello" paints after about 3 seconds
- [ ] `ran` logs after about 3 seconds; "Hello" paints immediately, unstyled

> A script must wait for stylesheets that precede it, because it could read computed styles. So the inline script is blocked for 3 seconds, and since it is parser-blocking, the parser cannot get past it. The stylesheet is also render-blocking, so nothing paints until it loads. Moving the script above the link lets it run immediately.

### 6. Which resource will the preload scanner find while the parser is blocked?

- [ ] An image set with `background-image` in an external stylesheet
- [ ] An `<img>` element inserted by a React component on the client
- [ ] An `<img data-src="hero.jpg">` waiting for a lazy-loading script
- [x] An `<img src="hero.jpg">` further down the HTML response

> The preload scanner reads the raw HTML from the server and picks out URLs in standard attributes such as `src`, `srcset`, and `href`. It does not execute scripts, does not parse CSS for backgrounds, and does not recognise custom attributes such as `data-src`.

### 7. How many times is layout forced inside this loop, for 100 items?

```js
for (const el of items) {
  el.style.height = container.offsetHeight / 4 + 'px';
}
```

- [ ] 0, because layout is always deferred to the end of the frame
- [ ] 1, because the browser caches `offsetHeight`
- [x] Up to 100, once per iteration after the first write
- [ ] 200, once for the read and once for the write

> Each write to `style.height` invalidates layout. The next read of `offsetHeight` needs an up-to-date value, so the browser runs style and layout synchronously. This repeats every iteration. Reading `container.offsetHeight` once before the loop leaves a single layout at the end of the frame. Writes alone do not trigger layout; they only mark it dirty.

### 8. You change `background-color` on an element that is not on its own composited layer. Which stages must run?

- [ ] Style, layout, paint, composite
- [x] Style, paint, composite
- [ ] Paint only
- [ ] Composite only

> Style always runs to compute the new value. `background-color` cannot affect geometry, so layout is skipped, but the pixels change, so paint and raster run and the result is composited. Only `transform` and `opacity` (and in some cases `filter`) on a composited layer can skip paint.

### 9. A developer adds `will-change: transform` to every card in a grid of 400 cards "for performance". What is the most likely result?

- [ ] Nothing changes, because `will-change` is ignored without an animation
- [ ] Scrolling gets smoother, since each card can move independently
- [ ] Style recalculation becomes slower, because the selector is more complex
- [x] GPU memory use rises sharply and performance may get worse, especially on phones

> `will-change: transform` promotes each element to its own composited layer, and each layer needs its own raster memory (width times height times 4 bytes, times the device pixel ratio squared). Hundreds of layers exhaust GPU memory and add per-frame compositing work. It is not ignored: promotion happens immediately.

### 10. A page delegates touch handling to its root container. Users report that scrolling starts late whenever the page is busy. Why?

```js
document.querySelector('#app').addEventListener('touchstart', (e) => {
  if (e.target.closest('.swipeable')) startSwipe(e);
});
```

- [ ] `touchstart` listeners always run on the compositor thread and slow it down
- [ ] Event delegation makes hit testing slower for every touch
- [ ] `closest()` forces a synchronous layout on every touch
- [x] The listener is not passive, so the compositor must wait for the main thread before it can scroll anywhere inside `#app`

> Because the listener could call `preventDefault()`, the compositor cannot start scrolling until the main thread has run it. With the main thread busy, that wait is the delay. Touch and wheel listeners are passive by default only on `window`, `document`, and `body`; on `#app` you must pass `{ passive: true }`, and use CSS `touch-action` on `.swipeable` to claim the gesture. `closest()` reads no layout.

### 11. In V8, which pair of objects shares a hidden class (Map)?

```js
const a = { x: 1, y: 2 };
const b = { y: 2, x: 1 };
const c = { x: 5 }; c.y = 6;
const d = { x: 1, y: 2, z: 3 };
```

- [ ] `a` and `b`
- [x] `a` and `c`
- [ ] `a` and `d`
- [ ] All four, because they have the same property names

> Hidden classes are determined by the properties and the order in which they were added. `c` adds `x` then `y`, following the same transition chain as `a`. `b` adds them in the opposite order. `d` has a third property, so it sits one transition further along the chain than `a`. Having the same property names is not enough: order of addition is part of the shape.

### 12. Why does this function deoptimise on the final call?

```js
function area(r) { return 3 * r * r; }
for (let i = 0; i < 100000; i++) area(i % 100);
area('7');
```

- [ ] Because functions with multiplication cannot be optimised
- [ ] Because the loop ran too many times and the optimised code expired
- [x] Because the optimised code assumed `r` is a small integer and a guard failed
- [ ] Because strings always throw in arithmetic, which unwinds the optimised frame

> The optimiser specialised `area` using type feedback: every `r` so far was a small integer. The compiled code contains a check for that assumption, and a string fails it, so V8 discards the optimised code and continues in the interpreter (where `'7'` is coerced and the result is 147). Nothing throws.

### 13. Which statement about V8's garbage collector is correct?

- [ ] A minor GC's cost is proportional to the amount of garbage in the young generation
- [ ] Setting a variable to `null` immediately frees the object it referenced
- [ ] Concurrent marking means JavaScript never pauses for garbage collection
- [x] A minor GC's cost is proportional to the amount of surviving data in the young generation

> The scavenger copies live objects out of the young generation and discards everything else wholesale, so dead objects cost nothing to collect. Setting a reference to `null` only makes an object unreachable; collection happens later. Concurrent and incremental marking reduce pauses but do not eliminate them.

### 14. A site loads 40 small images from one HTTP/1.1 host. In the Network panel, many requests show a long "Stalled" phase. Why?

- [ ] The server is rate limiting the client
- [x] The browser allows about six connections per host, and the rest wait in a queue
- [ ] Images are always loaded one at a time at Low priority
- [ ] The preload scanner cannot discover more than six images

> HTTP/1.1 carries one request at a time per connection, and browsers cap connections at six per host. Additional requests queue until a connection is free, which DevTools reports as Stalled or Queueing. HTTP/2 multiplexes many streams over one connection and removes this limit.

### 15. Site A and site B both load `https://cdn.example/lib.js` with `Cache-Control: max-age=31536000`. A user visits A, then B, in a current browser. What happens on B?

- [ ] The file is served from the disk cache, saving a download
- [ ] The file is revalidated with a conditional request and gets a 304
- [x] The file is downloaded again, because the HTTP cache is keyed by top-level site
- [ ] The file is served from the memory cache shared between tabs

> All major browsers partition the HTTP cache by the top-level site to prevent cross-site tracking through cache timing. The entry stored under site A is invisible to site B. The memory cache is per document, not shared between sites.

### 16. An `<img>` for the page's hero is in the HTML with no special attributes. In Chrome, what is its request priority over time?

- [ ] Highest from the start, because it is the LCP element
- [ ] High from the start, like all images in the HTML
- [x] It starts low and is raised once layout determines it is in the viewport
- [ ] Low throughout, unless it is preloaded

> Images start at a low priority because the browser does not yet know whether they are visible. After layout, in-viewport images are boosted. That boost arrives late, which is why `fetchpriority="high"` on the LCP image helps: it tells the browser the importance up front. (Chrome also gives the first few sizeable images a Medium priority.)

### 17. You deploy a new `sw.js`. A user has the site open in one tab and presses reload. The worker does not call `skipWaiting()`. Which version handles the reloaded page's requests?

- [x] The old version; the new one stays in the waiting state
- [ ] The new version, because the reload unloaded the only client
- [ ] Neither; the reload goes directly to the network
- [ ] The new version for the navigation, the old one for subresources

> During a reload the request for the new document is made before the old document is unloaded, so the old worker always has at least one client and is never released. The new version waits until every tab controlled by the old one is closed (or until it calls `skipWaiting()`).

### 18. A user clicks a button and this handler runs. What does the user see?

```js
button.onclick = async () => {
  label.textContent = 'Working…';
  await Promise.resolve();
  const start = performance.now();
  while (performance.now() - start < 3000) {} // heavy work
  label.textContent = 'Done';
};
```

- [ ] "Working…" for three seconds, then "Done"
- [ ] "Working…" briefly, then a frozen page, then "Done"
- [x] The old text for three seconds, then "Done"
- [ ] "Done" immediately, then a three-second freeze

> Awaiting a resolved promise resumes in a microtask, and microtasks run before the browser gets a rendering opportunity. So the heavy loop starts before any frame is produced, and "Working…" is never painted. To let the browser paint, yield with a task: await `scheduler.yield()`, or a `setTimeout`, ideally after a `requestAnimationFrame`.

### 19. Explain the difference between parser-blocking and render-blocking, and give one example of a resource that is each.

> Parser-blocking stops the HTML parser from building more of the DOM. A classic `<script src>` without `async`, `defer`, or `type="module"` does this: the parser stops until the script is fetched and executed (and until earlier stylesheets have loaded). Render-blocking stops the browser from painting, but parsing continues. A `<link rel="stylesheet">` in the head with a matching `media` is render-blocking: the DOM keeps being built, but no frame is drawn until the CSSOM is ready. A parser-blocking script in the head is effectively render-blocking too, since the content after it does not yet exist.

### 20. This component makes scrolling janky on phones. Identify the two internal reasons and rewrite it.

```js
list.addEventListener('touchmove', () => {
  for (const row of rows) {
    const top = row.getBoundingClientRect().top;
    row.style.opacity = top < 100 ? 0.5 : 1;
  }
});
```

> First, the `touchmove` listener is on an element and is not passive, so the compositor must wait for the main thread on every touch move to learn whether `preventDefault()` was called; scrolling cannot run independently of the main thread. Second, the loop interleaves a write (`style.opacity`, which invalidates style) with a read (`getBoundingClientRect()`, which needs clean style and layout), so the browser is forced to recalculate synchronously once per row, on every event, instead of once per frame.
>
> Better: do not listen to touch events at all. An `IntersectionObserver` whose root is shrunk to the top 100px band of the list reports rows entering and leaving that band, off the scroll path:
>
> ```js
> const band = new IntersectionObserver(
>   (entries) => {
>     for (const e of entries) e.target.classList.toggle('dim', e.isIntersecting);
>   },
>   { root: list, rootMargin: `0px 0px -${list.clientHeight - 100}px 0px` },
> );
> rows.forEach((row) => band.observe(row));
> ```
>
> If a listener really is needed, register it with `{ passive: true }`, and inside a `requestAnimationFrame` read every rect first, then do all the writes.

### 21. Describe, in order, the main-thread and off-main-thread stages a frame goes through after a `requestAnimationFrame` callback changes an element's `width`.

> On the main thread: the rAF callback runs; style is recalculated for affected elements; layout runs because `width` affects geometry (then `ResizeObserver` callbacks, which may loop back to style and layout); pre-paint updates the property trees and paint invalidation; paint records display lists; the result is committed to the compositor thread. Off the main thread: the compositor schedules raster of the invalidated tiles on raster workers through the GPU process; when tiles are ready it builds a compositor frame of draw quads and submits it to the display compositor (Viz) in the GPU process, which aggregates frames from all sources and draws to the screen at the next vsync. All of this must fit in about 16.7ms at 60Hz for the frame not to be dropped.

### 22. A colleague says "we should rewrite our React form validation in WebAssembly to make it faster". How do you respond?

> It is very unlikely to help. WebAssembly is suited to CPU-bound computation with predictable performance: codecs, image processing, compression, physics, large parsers, or reusing an existing native library. Form validation is a small amount of string work followed by DOM updates. The cost is in rendering and framework work, which Wasm cannot touch because it has no direct DOM access and must call through JavaScript. Strings must be copied across the boundary, adding overhead, and the Wasm binary adds download and compile time. Modern JIT-compiled JavaScript is already fast for this workload. First profile to find where time actually goes; if a specific pure computation dominates, moving it to a worker would address responsiveness, and only if that computation is still too slow would Wasm be worth evaluating.

### 23. You see different behaviour between Chrome and Safari for a CSS feature. Describe the steps you take before and when filing a bug.

> 1. Determine which is correct: find the relevant spec section (via the Specifications link on MDN) and read the normative text. Check web-platform-tests results on wpt.fyi for that feature.
> 2. Test in Firefox as a third data point, and in the pre-release builds (Chrome Canary, Safari Technology Preview) in case it is already fixed.
> 3. Reduce to a single self-contained HTML file with no framework or external resources, removing everything not needed to show the difference.
> 4. Search the relevant tracker (issues.chromium.org, bugs.webkit.org, bugzilla.mozilla.org) for an existing report; add to it if found.
> 5. Otherwise file: a clear title, steps to reproduce, expected result with the spec link, actual result, browser version and OS, whether it is a regression and from which version, with the reduction and a screenshot attached.
> 6. If the spec itself is ambiguous, raise an issue on the spec's repository instead. Link the bug from the workaround in your code.

### 24. Explain why a service worker should not keep state in global variables, and what to use instead.

> The browser starts a service worker to deliver an event and terminates it when idle (after roughly 30 seconds in Chromium), or at any time under memory pressure. Each start re-evaluates the script from the top, so any global variable is reset. Code that stores, say, a queue of pending requests or an auth token in a global works in testing while DevTools keeps the worker alive, and fails in production. Persist state in IndexedDB or the Cache Storage API, and pass per-request data through messages or the request itself. Also wrap asynchronous work in `event.waitUntil()` so the worker is not killed mid-operation.

### 25. A hot function receives objects from three different API endpoints and reads `.id` and `.name` from each. A profile shows it is slower than expected. Using what you know about inline caches, explain a likely cause and a fix.

> Each property access site has an inline cache keyed by the object's hidden class. If the objects from the three endpoints have different shapes (different property sets or the same properties in different orders, or optional fields added later), the site sees several hidden classes and becomes polymorphic; with more shapes it becomes megamorphic, falling back to a generic lookup that the optimising compiler cannot inline. The fix is to normalise at the boundary: map every response into objects built by one function or class that assigns the same fields in the same order with consistent types (using `null` for missing values). Then the hot function sees one shape and its accesses stay monomorphic. Verify with a benchmark or `--trace-deopt`/IC tracing rather than assuming.

### 26. You add speculation rules to prerender article pages. A week later, analytics shows page views up 40% with no change in real traffic. Explain what happened and how to fix it, and name one other thing you must check before enabling prerendering.

> A prerendered page is fully loaded and its scripts run before the user navigates, and many prerenders are never activated (the user hovered a link and went elsewhere). The analytics snippet ran during prerendering and counted those as views. Fix it by deferring side effects until activation:
>
> ```js
> function whenActivated(fn) {
>   if (document.prerendering) {
>     document.addEventListener('prerenderingchange', fn, { once: true });
>   } else {
>     fn();
>   }
> }
> whenActivated(() => analytics.pageview());
> ```
>
> Also check: that no prerendered URL has side effects on GET (logout, add-to-cart, and "mark as read" links must be excluded from the rules); that server-side counters and ad impressions are not triggered by the speculative request (it carries a `Sec-Purpose` request header you can test for); that content which depends on state changed on the previous page is refreshed on activation; and that the eagerness setting is not wasting users' data and your server capacity.
