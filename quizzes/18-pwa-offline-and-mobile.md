# PWAs, Offline, and Mobile: Practice test

### 1. A user has your site open in one tab. You deploy a new service worker that does not call `skipWaiting()`. The user reloads the tab. Which worker controls the reloaded page?

- [ ] The new one, because reload always activates the latest worker
- [ ] Neither; a reload bypasses the service worker
- [x] The old one; the new worker stays in the waiting state
- [ ] The new one, but only for requests made after `DOMContentLoaded`

> The new worker activates only when no pages are controlled by the old one. During a reload the browser requests the new document before the old one is torn down, so there is never a moment with zero clients. The user must close every tab for the origin, or the worker must call `skipWaiting()`.

### 2. Which caching strategy suits a JavaScript bundle served at `/assets/app.4f8a1c.js`, where the hash changes whenever the content does?

- [ ] Network first, so users always get the newest code
- [x] Cache first, because the content at that URL can never change
- [ ] Stale-while-revalidate, to refresh it in the background
- [ ] Network only, because scripts must not be cached by a service worker

> A content-hashed URL is immutable: a new build produces a new URL. Cache first gives instant responses with no risk of staleness. Network first and stale-while-revalidate both waste a request revalidating something that cannot have changed.

### 3. What is wrong with this install handler?

```js
self.addEventListener('install', (event) => {
  caches.open('shell-v1').then((cache) =>
    cache.addAll(['/', '/app.js', '/app.css'])
  );
});
```

- [ ] `caches` is not available inside a service worker
- [ ] `addAll` cannot cache the root URL `/`
- [ ] The cache must be opened in the `activate` event
- [x] The promise is not passed to `event.waitUntil()`, so install can finish (or the worker be stopped) before caching completes

> Without `event.waitUntil(promise)`, the browser considers the install complete as soon as the handler returns. The worker can activate with an empty or partial cache, and a caching failure will not fail the install. Wrap the chain in `event.waitUntil(...)`.

### 4. This fetch handler works once per URL, then throws on later use of the cached entry or returns an empty body. Why?

```js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(async (hit) => {
      if (hit) return hit;
      const res = await fetch(event.request);
      const cache = await caches.open('runtime');
      cache.put(event.request, res);
      return res;
    })
  );
});
```

- [x] The response body can only be read once; it must be cloned before being stored
- [ ] `cache.put` cannot be used in a fetch handler
- [ ] `caches.match` returns a promise that must be awaited twice
- [ ] `event.request` has already been consumed by `fetch`

> A `Response` body is a one-shot stream. Here the same response object is given to both the cache and the page, so one of the two consumers fails with a "body already used" error. Use `cache.put(event.request, res.clone())`. The handler should also check `res.ok` before caching.

### 5. In Chrome, which of these is NOT required for the browser to offer installation and fire `beforeinstallprompt`?

- [ ] A manifest with `name` or `short_name`
- [ ] Icons at 192px and 512px
- [x] A registered service worker with a `fetch` handler
- [ ] Being served over HTTPS

> Chrome dropped the service worker requirement for installability. It still needs HTTPS, a manifest with a name, the two icon sizes, a `start_url`, and an app-like `display` value, plus some user engagement. You still want a service worker so the installed app works offline.

### 6. What does iOS Safari do when your page listens for `beforeinstallprompt`?

- [ ] It fires the event after the user has visited twice
- [ ] It fires the event only for sites with a valid manifest
- [ ] It fires the event only inside a Home Screen web app
- [x] Nothing; the event is never fired, and installation happens only through the share sheet

> `beforeinstallprompt` is a Chromium feature. Safari has no programmatic install prompt on iOS, iPadOS, or macOS. Users install with Share, Add to Home Screen. You can only show your own instruction to guide them.

### 7. A manifest lists a single icon with `"purpose": "any maskable"`. What is the practical problem?

- [ ] The manifest fails to parse and the app is not installable
- [x] The same image is used both uncropped and cropped to a shape, so it looks wrong in one of those roles
- [ ] Android ignores icons that declare more than one purpose
- [ ] iOS refuses icons with a `purpose` member

> A maskable icon needs padding so its important content survives being cropped to a circle or squircle. Used as a regular ("any") icon, that padding makes it look small; an unpadded icon used as maskable gets its edges cut off. Provide separate images for each purpose.

### 8. This code fails with `TransactionInactiveError` on the `put`. Why?

```js
const tx = db.transaction('notes', 'readwrite');
const store = tx.objectStore('notes');
const note = await store.get(id);          // using the idb wrapper
const res = await fetch(`/api/notes/${id}`);
const fresh = await res.json();
await store.put({ ...note, ...fresh });
```

- [ ] `readwrite` transactions cannot perform reads
- [ ] `store.get` must be called before `objectStore`
- [x] The transaction auto-committed while the code was awaiting the network
- [ ] `fetch` is not allowed while an IndexedDB connection is open

> An IndexedDB transaction stays active only while it has pending requests. Once control returns to the event loop with nothing pending, as it does while waiting for `fetch`, the transaction commits. Do the network request first, then open a transaction and perform the reads and writes without awaiting anything else in between.

### 9. Which statement about browser storage eviction is correct?

- [ ] Browsers delete the oldest individual cache entries first when space is low
- [ ] Data in IndexedDB is never evicted; only Cache Storage is
- [ ] Calling `navigator.storage.persist()` guarantees a `true` result once the app has a service worker
- [x] Under storage pressure, the browser removes all of an origin's data together, least recently used origins first

> Eviction is per origin and all-or-nothing: IndexedDB, Cache Storage, and OPFS go together, so you never see partial data. `persist()` is a request the browser may deny (Chromium uses engagement heuristics, Firefox asks the user), so a `false` result is normal.

### 10. A release shipped a service worker that serves a broken cached `index.html` cache-first. Which action reliably recovers users who already have it?

- [ ] Deploy fixed HTML; users get it on their next visit
- [x] Deploy a new worker at the same `sw.js` URL that skips waiting, clears caches, and unregisters itself
- [ ] Rename the worker to `sw-v2.js` and register that from the fixed HTML
- [ ] Ask users to hard-reload, which permanently bypasses the worker

> The broken worker answers navigations from its cache, so users never see the fixed HTML, and therefore never run a new `register()` call for a renamed file. A hard reload bypasses the worker for that one load only. The one request that always reaches the network is the browser's update check for the registered script URL, so the fix has to be delivered there.

### 11. On a phone, a hero section styled `height: 100vh` has its bottom cut off when the page first loads. What is the cause and the simplest fix?

- [ ] The viewport meta tag is missing; add `width=device-width`
- [x] `100vh` is the height with browser toolbars retracted; use `100svh`
- [ ] Safe-area insets are not applied; add `env(safe-area-inset-bottom)`
- [ ] The device pixel ratio is being ignored; use `100dvw`

> On mobile, `vh` is based on the largest viewport, the one you get after toolbars slide away. With toolbars visible, the element is taller than the visible area. `svh` is defined against the small viewport and always fits. `dvh` would also fit but changes size as the toolbars move.

### 12. A swipeable card uses pointer events. On a phone, diagonal drags stop after a few pixels and `pointercancel` fires. What fixes it?

```js
card.addEventListener('pointermove', onDrag);
card.addEventListener('pointercancel', () => console.log('cancelled'));
```

- [ ] Add `{ passive: false }` to the `pointermove` listener and call `preventDefault()`
- [ ] Switch to `mousemove`, which is not cancelled
- [x] Declare `touch-action: pan-y` (or `none`) on the card in CSS
- [ ] Set `user-select: none` on the card

> The browser claimed the gesture for scrolling and cancelled the pointer stream. `touch-action` tells the browser, before any script runs, which gestures it may handle itself. `pan-y` leaves vertical scrolling to the browser and delivers horizontal movement to you. Calling `preventDefault()` on pointer events does not stop scrolling.

### 13. Which markup is best for a six-digit SMS verification code?

- [ ] `<input type="number" maxlength="6">`
- [ ] `<input type="tel" autocomplete="off">`
- [ ] `<input type="password" inputmode="decimal">`
- [x] `<input type="text" inputmode="numeric" autocomplete="one-time-code">`

> `inputmode="numeric"` shows a digit keypad while `type="text"` preserves leading zeros and avoids number-input quirks (`maxlength` is ignored on `type="number"`). `autocomplete="one-time-code"` lets the OS offer the code from the incoming message.

### 14. A chat app has a composer with `position: fixed; bottom: 0`. On an iPhone, focusing the input hides the composer behind the keyboard. Why?

- [ ] iOS does not support `position: fixed`
- [ ] The safe-area inset is missing from the composer's padding
- [x] The keyboard shrinks only the visual viewport; fixed elements are positioned against the layout viewport, which does not change
- [ ] The viewport meta tag lacks `viewport-fit=cover`

> On iOS (and by default in Chrome on Android) the on-screen keyboard overlays the layout viewport and only the visual viewport gets smaller. Fixed positioning follows the layout viewport. Use the `visualViewport` API to offset the composer, or restructure so the composer is in normal flow. `interactive-widget=resizes-content` fixes it on Android but is not supported by Safari.

### 15. You precache with `cache.addAll(['/', '/app.js', '/logo.png', '/old-banner.png'])` and `/old-banner.png` now returns 404. What happens?

- [ ] The three valid files are cached and the 404 is skipped
- [ ] The 404 response is cached and served offline
- [ ] Installation succeeds, but the worker logs a warning
- [x] `addAll` rejects, nothing is added, and the install fails if the promise was passed to `waitUntil`

> `addAll` is atomic and treats any non-OK response as a failure. The new worker is discarded and the previous one (if any) keeps running. This is why generated precache manifests are safer than hand-maintained lists.

### 16. Your app queues offline edits and replays them with Background Sync only. A user on an iPhone edits a note in airplane mode, then reconnects. What happens?

- [ ] The `sync` event fires as soon as the phone is back online
- [x] Nothing is sent, because Safari does not implement Background Sync
- [ ] The edit is sent the next time a push notification arrives
- [ ] iOS replays the request automatically from its own network queue

> Background Sync is Chromium-only. On Safari and Firefox `registration.sync` is undefined. A robust app also flushes its outbox on startup, on the `online` event, and when the page becomes visible, and treats Background Sync as an enhancement.

### 17. What does a React Native `<View>` become at runtime on iOS?

- [ ] A `<div>` inside a hidden `WKWebView`
- [ ] A canvas drawing produced by the Hermes engine
- [x] A native `UIView` created by the framework's renderer
- [ ] A SwiftUI view compiled ahead of time from JSX

> React Native renders real platform views; there is no web view or DOM. JavaScript runs in Hermes and the Fabric renderer creates and updates native views. That is the difference from Capacitor-style hybrids, which render HTML inside a web view.

### 18. Compared with Electron, what is the main technical trade-off of Tauri?

- [ ] It cannot access the file system
- [ ] It requires users to install Node.js
- [ ] It only runs on Windows
- [x] It uses the OS web view, so installers are small but your UI runs on different engines per platform

> Tauri uses WebView2 on Windows, WKWebView on macOS, and WebKitGTK on Linux, so you save bundling Chromium but must test against three engines. Electron ships its own Chromium, giving identical rendering everywhere at the cost of size and memory.

### 19. You package a PWA for Google Play as a Trusted Web Activity. It ran full-screen when you installed your local build, but the version downloaded from Play shows a browser URL bar. What is the most likely cause?

- [ ] Play requires TWAs to show the URL for security
- [ ] The manifest's `display` is not `fullscreen`
- [x] `assetlinks.json` lists your local signing key's fingerprint, but Play re-signed the app with a different key
- [ ] The service worker failed to install on the device

> A TWA runs without browser UI only if Digital Asset Links verification succeeds: the site's `/.well-known/assetlinks.json` must list the package name and the SHA-256 fingerprint of the certificate that signed the installed app. With Play App Signing, Google signs the distributed build, so you must add the fingerprint shown in the Play Console. On failure the app falls back to a Custom Tab with a URL bar.

### 20. Write a `fetch` handler for navigation requests that tries the network with a 3-second timeout, falls back to the cached page, and finally to `/offline.html`.

> ```js
> const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
>
> self.addEventListener('fetch', (event) => {
>   if (event.request.mode !== 'navigate') return;
>   event.respondWith((async () => {
>     const cache = await caches.open('pages');
>     try {
>       const res = await Promise.race([fetch(event.request), timeout(3000)]);
>       if (res.ok) event.waitUntil(cache.put(event.request, res.clone()));
>       return res;
>     } catch {
>       return (await cache.match(event.request)) ?? (await caches.match('/offline.html'));
>     }
>   })());
> });
> ```
>
> The timeout matters because on a poor connection `fetch` may hang for a long time rather than reject. The response is cloned before caching because a body can be read once, only OK responses are stored, and `/offline.html` must have been precached during install.

### 21. Explain why calling `self.skipWaiting()` unconditionally in `install` can break a single-page app, and describe a safer update flow.

> `skipWaiting()` activates the new worker while pages loaded by the old version are still open. Those pages are running the old HTML and JavaScript, which reference the old build's hashed chunks. If the new worker's `activate` step deletes the old precache, a lazy `import()` or a late asset request from the old page gets a 404 (or a new, incompatible file), and the app fails in ways that are hard to reproduce.
>
> Safer: let the new worker wait. On the page, detect it (`registration.waiting`, or `updatefound` followed by the worker reaching `installed` while `navigator.serviceWorker.controller` exists) and show a "New version available" prompt. When the user accepts, `postMessage({ type: 'SKIP_WAITING' })` to the waiting worker, which then calls `skipWaiting()`. Listen for `controllerchange` and reload once, so every tab picks up matching HTML, JavaScript, and worker. Avoid prompting or reloading while the user has unsaved input.

### 22. A user edits a note offline on their phone and on their laptop, then both reconnect. Describe how your sync design detects the conflict and two ways to resolve it, with the trade-off of each.

> Detection: every note carries a server-assigned version (or ETag). Each client remembers the version it last saw and sends it with the update, for example `If-Match: "7"`. The first device to sync succeeds and the server moves to version 8. The second device's request still says 7, so the server answers `412 Precondition Failed` (or 409) with the current note. Relying on device timestamps instead is unsafe, because clocks differ.
>
> Resolution options:
> - Last write wins: the later request simply overwrites. Trivial to build, but one person's edit is silently lost.
> - Field-level or three-way merge: compare both versions against the common base; changes to different fields (or different parts of the text) are combined automatically, and only true overlaps need a decision. More code, far fewer lost edits.
> - Ask the user: show both versions and let them choose or combine. Never loses data, but interrupts the user and does not scale to frequent conflicts.
> - CRDTs (such as Yjs or Automerge): edits merge deterministically without a central decision. Best for collaborative text, at the cost of library size, storage overhead, and a different data model.
>
> Whichever is used, operations need idempotency keys so retries are safe, and deletes need tombstones so a deleted note is not resurrected by the other device.

### 23. List four things that behave differently for an installed web app on iOS compared with the same PWA installed from Chrome on Android.

> Any four of:
> - Install flow: no `beforeinstallprompt` or install button; the user must use Share, Add to Home Screen.
> - Storage: the Home Screen app has storage separate from Safari, so the user starts logged out; on Android the installed app shares the browser's storage.
> - Background work: no Background Sync, Periodic Sync, or Background Fetch; queued work must be flushed when the app is open.
> - Push: available only after installation to the Home Screen (16.4 and later), not in a normal Safari tab; permission must be requested from a user gesture.
> - Capabilities: no Share Target, File Handling, Web Bluetooth, WebUSB, or Web NFC.
> - Engine: always WebKit, whatever browser the user installed.
> - Manifest handling: `apple-touch-icon` takes precedence for the icon, splash screens need `apple-touch-startup-image`, and `fullscreen`/`minimal-ui` display modes are not honoured as such.
> - Keyboard and viewport: `interactive-widget` is unsupported, so the keyboard always overlays the layout viewport.

### 24. How would you save in-progress form state so that it survives the OS killing your backgrounded web app on a low-memory phone? Explain which event you use and why.

> Persist the draft to IndexedDB (or `sessionStorage` for small values) on `visibilitychange` when `document.visibilityState === 'hidden'`, and also debounce saves while the user types. Restore on load.
>
> ```js
> document.addEventListener('visibilitychange', () => {
>   if (document.visibilityState === 'hidden') saveDraft(readForm());
> });
> ```
>
> `visibilitychange` to hidden is the last event that fires reliably on mobile when the user switches apps or locks the screen. After that the OS may freeze or kill the page without running any more code, so `beforeunload` and `unload` cannot be relied on (and `unload` also blocks the back/forward cache). `pagehide` is a reasonable addition for navigations. The save should be synchronous or very quick, since the page may be frozen immediately afterwards.

### 25. A teammate proposes precaching the entire site (2,000 pages and all images, about 180MB) so "everything works offline". What are the problems, and what would you do instead?

> Problems: the precache downloads on the first visit, in the background, on whatever connection the user has, costing data and battery for content they may never open; install fails entirely if any single URL fails; every deployment re-downloads whatever changed; the storage is subject to quota and can trigger eviction of the whole origin, taking the user's own data with it; and on iOS large storage use is especially fragile.
>
> Instead: precache only the app shell (the HTML, CSS, JavaScript, and fonts needed to render any page) and an offline fallback. Use runtime caching for content as it is visited, with expiration limits (`maxEntries`, `maxAgeSeconds`). Offer an explicit "Save for offline" action for the content users care about, show storage use with `navigator.storage.estimate()`, request `navigator.storage.persist()`, and respect `saveData`.

### 26. Write a kill-switch service worker and list the deployment conditions that must hold for it to reach users.

> ```js
> self.addEventListener('install', () => self.skipWaiting());
> self.addEventListener('activate', (event) => {
>   event.waitUntil((async () => {
>     for (const key of await caches.keys()) await caches.delete(key);
>     await self.registration.unregister();
>     for (const client of await self.clients.matchAll({ type: 'window' })) {
>       client.navigate(client.url);
>     }
>   })());
> });
> ```
>
> Conditions: it must be served at exactly the URL of the worker it replaces, since that is the only URL the browser checks for updates; that URL must not be cached by the CDN or served with a long `max-age` (browsers cap this at 24 hours, but that is still a day of breakage); the page must stop calling `register()` in the same deploy, or a worker is installed again; it has no `fetch` handler, so requests fall through to the network; and the file must stay deployed for a long time, because users pick it up only on their next visit. It should clear caches but leave user data in IndexedDB alone.
