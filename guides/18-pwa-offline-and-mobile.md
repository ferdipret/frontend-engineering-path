# PWAs, Offline, and Mobile: Guide

## Toolkit

### DevTools and tooling

The Chrome DevTools **Application** panel is where PWA work happens. **Manifest** shows the parsed manifest, icon previews (including a maskable safe-zone toggle), and installability warnings. **Service workers** shows each registration's state, lets you tick **Offline**, **Update on reload**, and **Bypass for network**, and has buttons to push, sync, stop, and unregister. **Storage** shows usage against quota, simulates a custom quota, and has **Clear site data**. **Cache storage** and **IndexedDB** browse stored data, and **Background services** records push, background sync, and notification events even while DevTools is closed. `chrome://serviceworker-internals` lists every registration in the profile.

Device simulation: the **device toolbar** (Ctrl+Shift+M) emulates viewport size, device pixel ratio, and touch, and the Network and Performance panels provide network and CPU throttling, including CPU presets calibrated to your machine. The **Sensors** drawer fakes geolocation and orientation. Emulation does not reproduce a real phone's CPU, memory, browser chrome, or on-screen keyboard, so treat it as a first pass.

Real devices: `chrome://inspect/#devices` attaches desktop DevTools to Chrome on a USB-connected Android phone, with port forwarding so the phone can reach your `localhost`. For iOS you need a Mac: enable Web Inspector on the device (Settings, Apps, Safari, Advanced) and use Safari's Develop menu. Xcode's iOS Simulator and Android Studio's emulator cover OS versions you do not own.

Build tooling: **Workbox** (v7) generates and powers service workers, via `workbox-build`, `workbox-cli`, or a bundler plugin; **vite-plugin-pwa** wraps it for Vite projects. **Lighthouse** audits performance and best practices (its dedicated PWA category was removed in 2024, so rely on the Application panel for installability). **PWABuilder** and **Bubblewrap** package a PWA for app stores. For local HTTPS on a phone, use `adb reverse`, a tunnel, or a locally trusted certificate from `mkcert`.

### Testing and verifying your work

A PWA has more states than a normal site, so test them deliberately.

- **Offline**: tick Offline in the Service workers pane (this affects the worker's own fetches, unlike some throttling presets) and reload. Then test properly with airplane mode on a real phone. Also test **lie-fi**: a "Slow 4G" or custom profile with high latency, where requests hang rather than fail. Timeouts matter more than the offline case.
- **First visit versus repeat visit**: clear site data, load once, go offline, reload. The first load is not controlled by a worker unless you call `clients.claim()`, so check what was actually cached.
- **Updates**: deploy a changed worker while a tab is open. Verify the waiting state, your update prompt, and that after accepting, every open tab ends on the new version with no mixed assets.
- **Automated**: Playwright can drive this with `context.setOffline(true)` and `context.serviceWorkers()`; Chromium runs service workers in Playwright, but Playwright's WebKit build is not iOS Safari and cannot replace a device test. Unit-test your sync queue and conflict logic as plain functions with a fake IndexedDB.
- **Install**: install on Android Chrome, desktop Chrome or Edge, and iOS (Add to Home Screen). Check the icon, name, splash, start URL, standalone display, and that links out of scope open correctly.
- **Storage**: use the Storage pane's quota override to simulate a full disk and confirm you handle `QuotaExceededError`.
- **Mobile polish**: on a real phone, check safe areas in both orientations, every form field's keyboard, tap targets, and scroll behaviour with the keyboard open.

"Done" means: works after a cold start in airplane mode, survives an update mid-session, loses no user data across offline edits, and feels right on one mid-range Android phone and one iPhone.

### Tricks and gotchas

- Never cache `sw.js` itself with a long `max-age`, and never rename it per build. Serve it with `Cache-Control: no-cache` at a stable URL.
- Keep a tested kill-switch worker in the repository before you need one (see Service worker kill switch).
- `cache.addAll()` is atomic: one 404 fails the whole install. Precache only files that definitely exist.
- A response can be read once. `cache.put(request, response.clone())` before returning it.
- Opaque (`no-cors`) responses have status 0, cannot be inspected, and are padded by megabytes each in Chrome's quota accounting. Request cross-origin assets with CORS.
- IndexedDB transactions commit as soon as they have no pending requests. Awaiting a `fetch()` inside one kills it.
- Refreshing one tab does not activate a waiting worker. Close all tabs or use `skipWaiting()`.
- `navigator.onLine === true` only means a network interface exists. Treat a failed request as the real signal.
- On iOS, an installed web app has storage separate from Safari. The user is logged out on first launch.
- iOS zooms the page when focusing an input whose font size is below 16px. Do not fix this by disabling zoom.
- `100vh` is taller than the visible area on mobile when browser bars are showing. Use `100svh` or `100dvh`.
- `env(safe-area-inset-*)` is zero unless the viewport meta tag includes `viewport-fit=cover`.
- Ask for notification permission only after a user action that explains why. Browsers penalise sites that prompt on load.
- Test on a cheap Android phone. Your development machine is five to ten times faster than the median device.

### Official references

- [web.dev: Learn PWA](https://web.dev/learn/pwa) - the structured course covering every topic in this module.
- [MDN: Progressive web apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) - guides and reference, including manifest members.
- [Chrome: Workbox](https://developer.chrome.com/docs/workbox) - official documentation for every Workbox module.
- [Service Workers specification](https://w3c.github.io/ServiceWorker/) - normative lifecycle and Cache API definitions.
- [Web Application Manifest specification](https://www.w3.org/TR/appmanifest/) - the manifest members as specified.
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) - API reference with compatibility tables.
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - per-browser limits and eviction rules.
- [Chrome: Capabilities](https://developer.chrome.com/docs/capabilities) - documentation for Project Fugu APIs.
- [WebKit blog](https://webkit.org/blog/) - the primary source for what each Safari release supports.
- [Chrome DevTools: Remote debug Android devices](https://developer.chrome.com/docs/devtools/remote-debugging) - setting up `chrome://inspect`.
- [Workbox releases on GitHub](https://github.com/GoogleChrome/workbox/releases) - current version and changelog.

## Skills

### Lifecycle

A service worker moves through fixed states, and safe updating depends on respecting them. On the page:

```js
if ('serviceWorker' in navigator) {
  const reg = await navigator.serviceWorker.register('/sw.js');
}
```

**Registration** downloads the script. The scope defaults to the script's directory, so serve it from the root. **Install** fires once for that version; precache inside `event.waitUntil()`, and if the promise rejects the version is discarded. If no worker currently controls pages, the new one activates straight away. Otherwise it enters **waiting** until every tab controlled by the old version is closed. Reloading one tab is not enough, because the new page is requested before the old one goes away. **Activate** is the moment to delete old caches, since the old version can no longer be using them.

Two calls shortcut this. `self.skipWaiting()` activates the new worker immediately, even with pages still open. `self.clients.claim()` makes an active worker take control of pages that loaded without one. Both are fine on first install. On update, `skipWaiting()` means a page that loaded with version 1's HTML and JavaScript is suddenly served by version 2's worker; if that worker has deleted version 1's cached chunks, lazy imports fail. Only skip waiting if you then reload the page, or if your caching is compatible across versions.

The browser checks for an update on each navigation in scope and when you call `reg.update()`; any byte difference in the script or its imports triggers a new install. Serve `sw.js` with `Cache-Control: no-cache`. Long-lived single-page apps should call `reg.update()` periodically, because users may never navigate.

**Try it:** Write a worker that logs each lifecycle event with a version string. Deploy v1, then v2 with a tab open, and watch DevTools show v2 waiting. Reload (still waiting), then close and reopen the tab. Repeat with `skipWaiting()` and note what the already-open page experiences.

**Resources**
- [web.dev: The service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [web.dev Learn PWA: Service workers](https://web.dev/learn/pwa/service-workers)
- [MDN: Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)

### Caching strategies

In a `fetch` handler you decide, per request, where the response comes from. There are a handful of named strategies, and the skill is matching each to a kind of resource.

| Strategy | Behaviour | Use for |
| --- | --- | --- |
| Cache first | Serve from cache; go to network only on a miss | Content-hashed JS/CSS, fonts, images that never change at a URL |
| Network first | Try network; fall back to cache on failure or timeout | HTML documents, API data that should be fresh |
| Stale-while-revalidate | Serve cache immediately; update the cache in the background | Avatars, non-critical API data, unversioned assets |
| Network only | Never cache | Non-GET requests, payments, analytics |
| Cache only | Never touch network | Precached app shell files |

```js
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;            // let the browser handle it
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
  }
});
```

Details that separate working from broken:

- **Network first needs a timeout.** On a bad connection, `fetch` may hang for a minute before failing. Race it against a timer of a few seconds and fall back to cache.
- **Stale-while-revalidate shows old data once.** The update lands in the cache for *next* time. If the user must see the new value, notify the page (for example with `BroadcastChannel`) when the cache changes.
- **Cache first on an unversioned URL is permanent.** If `/app.js` is cache-first, users never get the new one. Use it only for URLs whose content cannot change.
- Check `response.ok` before caching, or you will store error pages.
- Not calling `respondWith()` lets the request go to the network normally, which is the right default for anything you have not thought about.

**Try it:** Implement network-first with a 3-second timeout for navigations and stale-while-revalidate for `/api/` GET requests. Throttle to a slow profile, then go offline, and confirm each route behaves as designed. Check which responses the Network panel attributes to the service worker.

**Resources**
- [web.dev: The offline cookbook](https://web.dev/articles/offline-cookbook)
- [Chrome Workbox: Strategies for service worker caching](https://developer.chrome.com/docs/workbox/caching-strategies-overview)
- [web.dev Learn PWA: Serving](https://web.dev/learn/pwa/serving)

### Cache Storage API

`caches` is an origin-scoped store of named caches, each mapping requests to responses. It is available in pages and workers, is entirely under your control, and ignores HTTP cache headers: nothing expires unless you delete it.

The **app shell** pattern precaches the minimal HTML, CSS, and JavaScript needed to render the UI, so the app starts instantly and offline. Version the cache name and clean up on activate:

```js
const CACHE = 'shell-v7';
const SHELL = ['/', '/app.3f9a.js', '/app.8c1d.css', '/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});
```

Things to know:

- `cache.addAll()` fetches every URL and rejects if any response is not OK, failing the install. That is what you want: no half-installed versions.
- `cache.addAll()` and `cache.add()` go through the HTTP cache. If your assets are not content-hashed, you can precache a stale copy; request with `new Request(url, { cache: 'reload' })` to avoid it.
- Matching is by URL and method (GET only), and respects the response's `Vary` header. Query strings matter unless you pass `{ ignoreSearch: true }`.
- A `Response` body is a stream that can be consumed once. To both return and store a response, `clone()` it first.
- Delete old caches in `activate`, not `install`: during install the previous version is still serving pages from them.
- Separate caches by lifetime: a versioned precache, and a runtime cache for things fetched later, with your own size or age limits. Nothing evicts individual entries for you.
- For a single-page app, answer navigations with the cached `/index.html` regardless of path.

**Try it:** Build the worker above for a small static site, load it, and inspect Application, Cache storage. Bump the version, change a file, and verify the old cache is deleted only after the new worker activates. Then add a URL that 404s to `SHELL` and observe the install failure in DevTools.

**Resources**
- [MDN: CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
- [MDN: Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [web.dev Learn PWA: Caching](https://web.dev/learn/pwa/caching)

### Workbox

Workbox is Google's set of libraries for service workers. Hand-written workers fail in the same ways every time: a precache list that drifts from the build output, missing timeouts, caches that grow forever, opaque responses stored blindly, and update races. Workbox encodes the fixes. Version 7 is current.

It has two halves. **Build tools** (`workbox-build`, `workbox-cli`, bundler plugins) scan your build output and produce a **precache manifest**: a list of URLs with revision hashes. In `generateSW` mode they write the whole worker from configuration; in `injectManifest` mode they inject the manifest into a worker you write, at `self.__WB_MANIFEST`. **Runtime modules** provide routing and strategies:

```js
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({ cacheName: 'api' })
);
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 3600 })],
  })
);
```

Precaching updates only files whose revision changed, and serves a consistent set per version. Other modules worth knowing: `workbox-window` (registration and update events on the page), `workbox-background-sync` (a retry queue that falls back gracefully where the Background Sync API is missing), `workbox-cacheable-response`, and `workbox-recipes`.

Choose `generateSW` for a standard app; choose `injectManifest` when you need push handlers or custom logic. With Vite, `vite-plugin-pwa` drives Workbox for you. Do not precache everything: a 20MB precache is downloaded on first visit over the user's data plan. Keep it to the shell and let runtime caching handle the rest.

**Try it:** Add Workbox to a Vite or plain static project using `injectManifest`. Build twice with one file changed, and compare the generated manifests. In DevTools, confirm only the changed file is re-downloaded on update.

**Resources**
- [Chrome: Workbox](https://developer.chrome.com/docs/workbox)
- [Chrome Workbox: workbox-precaching](https://developer.chrome.com/docs/workbox/modules/workbox-precaching)
- [Vite PWA: Guide](https://vite-pwa-org.netlify.app/guide/)

### Update UX

When a new version is waiting, you have three choices: do nothing (it activates the next time all tabs close), activate silently, or ask the user. For an app people keep open for days, doing nothing means they run stale code indefinitely, and silent activation risks breaking the page under them. The standard pattern is a prompt: "A new version is available. Reload".

The mechanics:

```js
// page
const reg = await navigator.serviceWorker.register('/sw.js');

function watch(worker) {
  worker.addEventListener('statechange', () => {
    // installed + an existing controller means this is an update, not first install
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      showUpdateToast(() => worker.postMessage({ type: 'SKIP_WAITING' }));
    }
  });
}
if (reg.waiting && navigator.serviceWorker.controller) {
  showUpdateToast(() => reg.waiting.postMessage({ type: 'SKIP_WAITING' }));
}
reg.addEventListener('updatefound', () => watch(reg.installing));

let reloading = false;
navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (reloading) return;
  reloading = true;
  location.reload();
});
```

```js
// sw.js
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
```

Points people miss: check `reg.waiting` on load, because the worker may have finished installing during a previous visit; `controllerchange` fires in *every* open tab, so all of them reload, which is correct but means you should not prompt while a user has unsaved input (save drafts first, or defer); the reload guard prevents a loop when "Update on reload" is ticked in DevTools; and call `reg.update()` on an interval or on `visibilitychange` so long-lived tabs notice new deployments. `workbox-window` wraps this as `wb.addEventListener('waiting', …)` and `wb.messageSkipWaiting()`.

Keep the prompt unobtrusive and never block the UI on it. For critical fixes, a server-provided "minimum version" check that forces a reload at a safe moment is a reasonable escalation.

**Try it:** Implement the toast flow. Open the app in two tabs, deploy a new worker, accept the prompt in one tab, and verify both tabs reload onto the new version exactly once.

**Resources**
- [Chrome Workbox: Handling service worker updates with immediacy](https://developer.chrome.com/docs/workbox/handling-service-worker-updates)
- [web.dev Learn PWA: Update](https://web.dev/learn/pwa/update)
- [Chrome Workbox: workbox-window](https://developer.chrome.com/docs/workbox/modules/workbox-window)

### Service worker kill switch

A service worker sits between your users and your server, and it keeps running after the deploy that created it is gone. A bad one, for example a cache-first rule on HTML or a precache that points at deleted files, can serve a broken app indefinitely. Returning visitors never reach your fixed HTML, because the broken worker answers the navigation. Deleting `sw.js` from the server does not reliably help either, and it leaves you with nothing to deliver a fix through.

What saves you is the update check. On every navigation in scope the browser re-fetches the worker script from the network, so a replacement at the **same URL** always gets through. The kill switch is a worker whose only job is to remove itself:

```js
// sw.js: deployed in place of the broken worker
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: 'window' });
    for (const client of windows) client.navigate(client.url);
  })());
});
```

`skipWaiting()` is correct here: waiting politely would leave users on the broken version. There is deliberately no `fetch` handler, so every request goes to the network. Unregistering takes effect once the pages are reloaded, which is what `client.navigate()` does.

What makes it work when you need it:

- The worker URL must never change between builds, and must be served with `Cache-Control: no-cache`. Browsers cap HTTP caching of worker scripts at 24 hours, so a long `max-age` can delay your fix by up to a day.
- Remove the `register()` call from the page in the same deploy, or the page reinstalls a worker straight away. Leave the kill-switch file in place for months; users return late.
- Users are only reached on their next visit. You cannot push a fix to someone who does not open the site.
- If user data in IndexedDB is intact, do not delete it; clear only caches.
- The `Clear-Site-Data: "storage"` response header also removes registrations and all storage for the origin. It is blunter (it wipes user data) and only helps on responses that actually come from your server.

Rehearse this once before launch. Recovery that has never been tested usually fails on a detail such as a CDN caching `sw.js`.

**Try it:** Deploy a deliberately broken worker that answers every navigation with "Oops". Confirm that fixing the HTML alone changes nothing. Then deploy the kill switch at the same URL, reload once, and verify in Application, Service workers that the registration and caches are gone.

**Resources**
- [Chrome Workbox: Remove buggy service workers](https://developer.chrome.com/docs/workbox/remove-buggy-service-workers)
- [MDN: ServiceWorkerRegistration.unregister()](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/unregister)
- [MDN: Clear-Site-Data header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data)

### Background sync and push

**Background Sync** lets a service worker finish work after the page is gone. The page registers a tag; when the browser next has connectivity it wakes the worker with a `sync` event, retrying with backoff if your promise rejects.

```js
// page: after writing the mutation to IndexedDB
const reg = await navigator.serviceWorker.ready;
if ('sync' in reg) await reg.sync.register('outbox');
else flushOutbox(); // fallback

// sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'outbox') event.waitUntil(flushOutbox());
});
```

It is Chromium-only. Safari and Firefox do not implement it, so you must also flush the queue on app start, on the `online` event, and when the page becomes visible. Treat Background Sync as an enhancement over that baseline. Periodic Background Sync is likewise Chromium-only and requires an installed app.

**Push** has three parts: the page subscribes (`reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` with your VAPID public key) and sends the subscription to your server; the server sends an encrypted message to the subscription's endpoint using the Web Push protocol (use a library such as `web-push`); the browser wakes the worker with a `push` event, which must show a notification:

```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(self.registration.showNotification(data.title ?? 'Update', { body: data.body, data: { url: data.url } }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

Silent pushes are not allowed; browsers revoke subscriptions that fail to notify. On iOS and iPadOS, push works only for web apps added to the Home Screen (16.4 and later). Safari also supports **Declarative Web Push** (18.4 and later), where a standard JSON payload describes the notification and no service worker code is needed to show it.

Responsibility: request permission from a user gesture, after explaining the value; send only what the user asked for; make unsubscribing easy; and handle `410 Gone` from the push service by deleting the subscription.

**Try it:** In Application, Service workers, use the Push and Sync buttons to fire test events at your worker. Then register a sync while offline, go online, and watch Background services, Background sync record it.

**Resources**
- [MDN: Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [WebKit: Meet Declarative Web Push](https://webkit.org/blog/16535/meet-declarative-web-push/)

### Web app manifest

The manifest is a JSON file that tells the browser how your site should behave as an installed app. Link it from every page with `<link rel="manifest" href="/manifest.webmanifest">`.

```json
{
  "id": "/",
  "name": "Field Notes",
  "short_name": "Notes",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0b57d0",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "New note", "url": "/new", "icons": [{ "src": "/icons/new-96.png", "sizes": "96x96" }] }
  ]
}
```

What each member really does:

- `id` is the app's identity. Set it explicitly so you can change `start_url` later without the browser treating it as a different app.
- `name` appears in install dialogs; `short_name` under the icon, where roughly 12 characters fit.
- `start_url` is what opens on launch. It must be within `scope`, and it must work offline.
- `scope` defines which URLs are "inside" the app. Navigating outside it shows browser UI or opens the browser.
- `display` is `standalone` (no browser UI), `minimal-ui`, `fullscreen`, or `browser`. `display_override` lists preferred modes with fallback, such as `window-controls-overlay` on desktop.
- `icons`: provide 192 and 512 pixel PNGs, plus a separate `maskable` icon whose important content sits within the central 80% circle, because Android crops icons to device-specific shapes. Do not mark one image `"any maskable"`; it looks wrong in one of the two roles.
- `theme_color` tints the title bar or status bar; `background_color` fills the splash screen before your CSS loads.
- `shortcuts` appear on long-press or right-click of the icon. `screenshots` and `description` give Chrome a richer install dialog.

In standalone mode there is no back button or URL bar, so your UI must provide navigation. Style it with `@media (display-mode: standalone)`.

**Try it:** Add a manifest to a project and open Application, Manifest. Fix every warning, toggle "Show only the minimum safe area for maskable icons", and install the app. Long-press the icon to check shortcuts.

**Resources**
- [MDN: Web application manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest)
- [web.dev Learn PWA: Web app manifest](https://web.dev/learn/pwa/web-app-manifest)
- [W3C: Web Application Manifest](https://www.w3.org/TR/appmanifest/)

### Installability

Installing gives a web app an icon, its own window, and a place in the OS app switcher. Each browser decides differently when to offer it.

**Chromium** (Chrome, Edge, Samsung Internet) shows its own install UI and fires `beforeinstallprompt` when the page is served over HTTPS and has a manifest with `name` or `short_name`, 192px and 512px icons, `start_url`, a `display` of `standalone`, `fullscreen`, `minimal-ui`, or `window-controls-overlay`, and `prefer_related_applications` not set to true, and after the user has interacted with the page for a short time. A service worker is no longer required for the prompt, though without one the installed app shows the browser's offline page. Chrome also lets users install any page manually from the menu.

To offer your own install button, capture the event:

```js
let deferred;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();          // suppress the default mini-infobar
  deferred = e;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  deferred.prompt();           // must be called from a user gesture
  const { outcome } = await deferred.userChoice;  // 'accepted' | 'dismissed'
  deferred = null;
  installButton.hidden = true;
});
window.addEventListener('appinstalled', () => { installButton.hidden = true; });
```

The event can be used once and is not fired if the app is already installed.

**Safari** has no `beforeinstallprompt` and no prompt at all. On iOS and iPadOS the user chooses Share, then Add to Home Screen (available from Safari and from other iOS browsers); on macOS, File, then Add to Dock. Your only tool is a short, dismissible instruction shown to iOS users who are not already in standalone mode. **Firefox** installs on Android; on desktop, support is limited and platform-dependent, so check the current state.

Detect installed mode with `matchMedia('(display-mode: standalone)').matches` (and the legacy `navigator.standalone` on iOS). Promote installation at a moment of demonstrated value, such as after a second visit or a completed task, not on first load.

**Try it:** Add the install button flow to a PWA. Use Application, Manifest to confirm installability, install, and verify the button hides. Then open the site in iOS Safari or the Simulator and design the fallback instruction.

**Resources**
- [web.dev: What does it take to be installable?](https://web.dev/articles/install-criteria)
- [web.dev Learn PWA: Installation prompt](https://web.dev/learn/pwa/installation-prompt)
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

### App-like capabilities

Project Fugu is the cross-company effort, led from Chromium, to give web apps capabilities that once required native code. Many of these ship only in Chromium, some are in all browsers, and a few are deliberately rejected by Apple and Mozilla on privacy grounds. Treat every one as progressive enhancement.

**Badging**: `navigator.setAppBadge(3)` and `navigator.clearAppBadge()` put a count on the app icon. Works for installed apps in desktop Chromium and in Safari (macOS, and iOS Home Screen apps with notification permission).

**Web Share**: `navigator.share({ title, text, url, files })` opens the OS share sheet. Broadly supported; must be called from a user gesture.

**Share Target**: makes your installed app appear *in* the share sheet. Declared in the manifest, Chromium only:

```json
"share_target": {
  "action": "/share", "method": "POST", "enctype": "multipart/form-data",
  "params": { "title": "title", "text": "text", "files": [{ "name": "media", "accept": ["image/*"] }] }
}
```

A POST share arrives as a navigation that your service worker's `fetch` handler must intercept.

**File handling**: a `file_handlers` manifest member registers the installed app as an opener for file types; files arrive via `launchQueue.setConsumer()`. Desktop Chromium only. The related File System Access API (`showOpenFilePicker()`) gives read and write access to user-chosen files, also Chromium only; the origin private file system is the cross-browser part.

Others: `protocol_handlers`, Window Controls Overlay, Screen Wake Lock (all major browsers), Web Bluetooth, WebUSB, Web Serial, WebHID, and Web NFC (Chromium only; not planned by Safari or Firefox).

The discipline is feature detection with a real fallback:

```js
if ('setAppBadge' in navigator) navigator.setAppBadge(unread).catch(() => {});
if (navigator.canShare?.({ files })) await navigator.share({ files });
else downloadInstead(files);
```

Never gate core functionality on a Chromium-only API unless you control the deployment environment, such as a kiosk or internal tool.

**Try it:** Add Web Share with a copy-link fallback and app badging to a PWA. Then add a `share_target`, install on Android, and share a URL from another app into yours.

**Resources**
- [Chrome: Capabilities](https://developer.chrome.com/docs/capabilities)
- [MDN: Badging API](https://developer.mozilla.org/en-US/docs/Web/API/Badging_API)
- [web.dev Learn PWA: Capabilities](https://web.dev/learn/pwa/capabilities)

### Platform differences

On iPhone and iPad, your PWA runs on WebKit regardless of which browser the user chose: Apple requires every browser on iOS to use it, with carve-outs in a few jurisdictions that have had little practical effect so far. So "does it work on iOS" means "does it work in WebKit, in a Home Screen web app".

What works, as of Safari 26 (2025 to 2026):

- Service workers, Cache Storage, IndexedDB, and OPFS.
- The web app manifest, including icons (an `apple-touch-icon` link takes precedence if present).
- Add to Home Screen from the share sheet, from Safari and other iOS browsers. Since iOS 26, every site added to the Home Screen opens as a web app by default, with or without a manifest; the user can switch off "Open as Web App".
- Web Push and the Badging API for Home Screen web apps (iOS 16.4 and later), plus Declarative Web Push (18.4 and later).
- Web Share, Screen Wake Lock, `standalone` display.

What does not:

- No `beforeinstallprompt` or any programmatic install prompt.
- No Background Sync, Periodic Background Sync, or Background Fetch.
- No Share Target, File Handling, or File System Access pickers.
- No Web Bluetooth, WebUSB, Web NFC, or Web Serial.
- `display: fullscreen` and `minimal-ui` are not honoured as such.
- Push is unavailable in ordinary Safari tabs on iOS; installation is a prerequisite.

Behavioural differences that bite: a Home Screen app has **separate storage** from Safari, so cookies and login state do not carry over; the system may kill a backgrounded web app and restart it cold, so persist state eagerly; Safari deletes script-writable storage for sites not used in seven days of browser use, though Home Screen apps are exempt; splash screens need `apple-touch-startup-image` links rather than manifest data; and iOS draws under the status bar only with `viewport-fit=cover` and the `apple-mobile-web-app-status-bar-style` meta tag.

Safari on macOS supports Add to Dock for any site, with push and badging. Verify claims against the WebKit release notes rather than old blog posts; this area changes yearly.

**Try it:** Install your PWA on an iPhone or the iOS Simulator. Write down five differences from Android Chrome: install flow, login state, push permission flow, status bar, and what happens after the app has been backgrounded for an hour.

**Resources**
- [WebKit: News from WWDC25, web technology coming in Safari 26](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/)
- [WebKit: Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Maximiliano Firtman: iOS PWA compatibility notes](https://firt.dev/notes/pwa-ios/)

### App store distribution

A PWA needs no store, but stores are where many users look for apps and where some organisations require you to be. Each store takes a different kind of package, and the same web app sits inside each.

**Google Play** accepts a **Trusted Web Activity** (TWA): a small Android app that opens your PWA full-screen in the user's installed browser (Chrome by default), not in a web view. You keep the real browser engine, storage, service worker, and push. Ownership is proved with **Digital Asset Links**: the app names your domain, and your site serves `/.well-known/assetlinks.json` listing the app's package name and signing certificate fingerprint.

```sh
npx @bubblewrap/cli init --manifest=https://example.com/manifest.webmanifest
npx @bubblewrap/cli build     # produces a signed app bundle and APK
```

If verification fails, the app opens as a Custom Tab with a URL bar. The usual cause is Play App Signing: Google re-signs your upload, so the fingerprint in `assetlinks.json` must be the one shown in the Play Console, not your local key. Selling digital goods inside a Play-distributed app brings Play's billing rules into scope.

**Microsoft Store** accepts PWAs directly. PWABuilder generates a Windows package that runs your site in the Edge engine; you reserve the app name in Partner Center and upload it. Windows integrates manifest features such as shortcuts and file handlers.

**Apple's App Store** has no PWA submission path. You ship a native app whose content is your site in a `WKWebView`, generated by PWABuilder's iOS package or built with Capacitor. This is a hybrid app, with the differences that implies: service workers work only for domains declared as app-bound, web push is replaced by native push through APNs, and App Review rejects apps that are only a wrapped website, so add native value such as push, offline content, or device integration.

For all stores: you now maintain listings, screenshots, privacy declarations, and review cycles, but web content still updates from your server without a store release. Detect the wrapper (a TWA sets `document.referrer` to `android-app://<package>` on launch) to adjust payment flows and to hide "install" prompts. Keep the installable PWA available on the web as well; the store build is an additional channel.

**Try it:** Run your PWA's URL through PWABuilder and read its report. Generate the Android package with Bubblewrap, install the APK on a device, and get `assetlinks.json` right so the URL bar disappears. Note which signing fingerprint you would need after uploading to Play.

**Resources**
- [Chrome: Trusted Web Activity quick start](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start)
- [Microsoft Edge: Publish a PWA to the Microsoft Store](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/microsoft-store)
- [Apple: App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Offline UX

Technical offline support is wasted if the interface does not tell people what is happening. Users need to know three things: whether they are connected, what they can still do, and what happened to the thing they just did.

Detecting connectivity is unreliable by nature. `navigator.onLine` and the `online`/`offline` events tell you whether a network interface exists, not whether your server is reachable; captive portals and dead Wi-Fi report "online". Use the events as hints and treat actual request outcomes as truth:

```js
window.addEventListener('offline', () => setStatus('offline'));
window.addEventListener('online', () => { setStatus('reconnecting'); flushOutbox(); });
```

Design principles that hold up:

- **Do not block.** Never replace the app with a full-screen "You are offline" page if cached content exists. Show the content with a small, persistent indicator.
- **Be honest about freshness.** Label cached data with its age ("Updated 2 hours ago").
- **Show per-item state.** An edit made offline should appear immediately, marked "Saved on this device" or "Pending", then change to "Synced". A failed sync needs a visible retry.
- **Disable what cannot work**, with an explanation, rather than letting it fail. Payment and search against the server are typical examples.
- **Make availability explicit.** If only some content is downloaded, mark it, and offer a "Make available offline" control for the rest.
- **Provide an offline fallback page** for navigations to uncached URLs, styled like the app, with links to what is available.
- **Announce changes accessibly** with a polite live region (`role="status"`), and do not rely on colour alone.
- **Handle slow, not just absent.** Show cached content first and time out requests, so a weak signal does not mean a blank screen.

Avoid alarming language. Offline is a normal state on a train, not an error.

**Try it:** Take an app with a list and a form. In DevTools set Offline, then walk through: load the list, open an uncached detail page, submit the form. Write down every place the UI is silent or wrong, and fix the worst three.

**Resources**
- [web.dev: Offline UX design guidelines](https://web.dev/articles/offline-ux-design-guidelines)
- [web.dev Learn PWA: Offline data](https://web.dev/learn/pwa/offline-data)
- [MDN: Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)

### Client databases

`localStorage` is synchronous, string-only, limited to about 5MB, and unavailable in workers. Real offline data needs one of three options.

**IndexedDB** is the built-in transactional object store, available in pages and workers in every browser. It stores structured-cloneable values (objects, `Blob`s, typed arrays) in object stores with indexes. The raw API is event-based and awkward, so most people use a thin promise wrapper such as `idb`, or a higher-level library such as Dexie.

```js
import { openDB } from 'idb';
const db = await openDB('notes', 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) db.createObjectStore('notes', { keyPath: 'id' });
    if (oldVersion < 2) db.createObjectStore('outbox', { autoIncrement: true });
  },
});
await db.put('notes', { id: crypto.randomUUID(), text: 'hi', updatedAt: Date.now() });
```

The rules that trip people up: schema changes happen only in the upgrade callback, driven by an integer version; a transaction **auto-commits** when it has no pending requests at the end of a task, so awaiting `fetch` or a timer inside one makes later operations throw `TransactionInactiveError`; and an open connection in another tab blocks upgrades unless you handle `versionchange` by closing.

**OPFS** (origin private file system) is a real file system private to your origin, reached through `navigator.storage.getDirectory()`. In a dedicated worker, `createSyncAccessHandle()` gives fast synchronous reads and writes, which is what makes databases on top of it practical. It is available in all major browsers.

**SQLite via WebAssembly** gives you SQL, joins, and full-text search. The official `@sqlite.org/sqlite-wasm` build persists to OPFS and must run in a worker. Its default OPFS backend needs `SharedArrayBuffer`, and therefore the COOP and COEP headers; the alternative `opfs-sahpool` backend does not, at the cost of supporting a single connection. Expect several hundred kilobytes of Wasm.

Choose IndexedDB for key-value and simple indexed data; choose SQLite when you need relational queries or share a schema with a native app. All three count against the same quota and are evicted together.

**Try it:** Build a notes store with `idb`, add an index on `updatedAt` in a version 2 upgrade, and query the ten most recent notes with a cursor. Then deliberately `await fetch()` in the middle of a transaction and read the error.

**Resources**
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [MDN: Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
- [SQLite: sqlite3 WebAssembly and JavaScript documentation](https://sqlite.org/wasm/doc/trunk/index.md)

### Sync and conflicts

Offline writes follow the **outbox pattern**: apply the change to the local database immediately, append a record of it to a queue in the same transaction, update the UI optimistically, and replay the queue against the server when you can.

```js
async function saveNote(note) {
  const tx = db.transaction(['notes', 'outbox'], 'readwrite');
  tx.objectStore('notes').put(note);
  tx.objectStore('outbox').add({ opId: crypto.randomUUID(), type: 'upsert', note });
  await tx.done;
  requestSync();
}
```

Requirements for a queue you can trust:

- **Client-generated IDs** (UUIDs) so records can be created offline without a server round trip.
- **Idempotency.** A request may succeed on the server while the response is lost. Send the `opId` as an idempotency key so a retry is harmless.
- **Order.** Replay in sequence per record; a delete must not overtake the create.
- **Error classes.** Retry network errors and 5xx with backoff. A 4xx will never succeed; remove it from the queue and surface it to the user.
- **One flusher at a time**, guarded with the Web Locks API (`navigator.locks.request('outbox', …)`), since several tabs share the queue.

Conflicts arise when the server copy changed while you were offline. Detect them with a version number or ETag per record: send `If-Match`, and treat `412 Precondition Failed` as a conflict. Then pick a policy:

- **Last write wins**: simplest, silently discards someone's work, and depends on clocks, so use server-assigned versions rather than device time.
- **Field-level merge**: changes to different fields both survive; real conflicts are rarer.
- **Ask the user**: show both versions. Appropriate for long text.
- **CRDTs** (Yjs, Automerge): data structures that merge automatically and deterministically. The right tool for collaborative editing, with added size and complexity.

Deletes need **tombstones**: a deleted marker that syncs, otherwise another device resurrects the record. Pull changes with a cursor ("everything since version N") rather than refetching everything.

**Try it:** Implement the outbox for a notes app with a mock server that stores a version per note. Edit the same note on two browser profiles while one is offline, reconnect, and make the 412 path show a "keep mine / keep theirs" choice.

**Resources**
- [web.dev Learn PWA: Offline data](https://web.dev/learn/pwa/offline-data)
- [Chrome Workbox: workbox-background-sync](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync)
- [Ink & Switch: Local-first software](https://www.inkandswitch.com/essay/local-first/)

### Storage limits

IndexedDB, Cache Storage, OPFS, and service worker registrations share one quota per origin. Current limits are generous: Chromium allows an origin up to about 60% of total disk size; Firefox allows the smaller of 10% of disk or 10GiB in the default mode; Safari allows about 60% of disk for sites in the browser and in Home Screen web apps, and less inside other apps' embedded web views. Private browsing modes get far less, and cross-origin iframes get a fraction of the parent's quota.

Ask rather than assume:

```js
const { usage, quota } = await navigator.storage.estimate();
console.log(`${(usage / 1e6).toFixed(1)}MB of ${(quota / 1e6).toFixed(0)}MB`);
```

These are estimates, deliberately imprecise for privacy. Exceeding quota makes the write fail with `QuotaExceededError`, which you must catch around `cache.put()`, IndexedDB transactions (it arrives as the transaction's abort error), and OPFS writes.

**Eviction** is the bigger risk. By default storage is "best effort": when the device is short of space, the browser deletes whole origins, least recently used first. It never deletes part of an origin's data, so you will not find a database with half its records, but everything can vanish. Safari additionally removes script-writable storage for sites with no user interaction in seven days of browser use; Home Screen web apps are exempt.

Request **persistent storage** to opt out of automatic eviction:

```js
const persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist());
```

Chromium decides silently from engagement signals such as installation, notification permission, and bookmarking. Firefox asks the user. Safari decides by heuristics. A `false` result is normal; call it again after the user installs the app.

Design accordingly: treat local storage as a cache of server data plus an outbox, sync unsynced changes promptly, show the user their storage use, cap runtime caches with expiration, and request CORS for cross-origin resources, because opaque responses are heavily padded in quota accounting.

**Try it:** Log `estimate()` and `persisted()` in your PWA. In Application, Storage, tick "Simulate custom storage quota", set 1MB, and trigger a large cache write. Add handling that frees old runtime caches and reports the failure.

**Resources**
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [web.dev: Storage for the web](https://web.dev/articles/storage-for-the-web)
- [WebKit: Updates to storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)

### Viewport

Without a viewport meta tag, mobile browsers lay the page out at about 980px wide and shrink it to fit. The tag opts into a layout viewport that matches the device:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Do not add `user-scalable=no` or `maximum-scale=1`. They are an accessibility failure, and iOS ignores them anyway.

There are two viewports. The **layout viewport** is what CSS lays out against. The **visual viewport** is the part currently visible, which shrinks when the user pinch-zooms or the keyboard opens; the `window.visualViewport` API exposes it.

The classic `vh` problem: mobile browser toolbars retract as you scroll, so the visible height changes. `100vh` equals the *largest* possible viewport, so a `height: 100vh` hero is cut off when the toolbars are showing. The newer units, supported in all current browsers, make the choice explicit:

| Unit | Meaning |
| --- | --- |
| `svh` | small viewport: toolbars expanded |
| `lvh` | large viewport: toolbars retracted |
| `dvh` | dynamic: tracks the current state |

Use `min-height: 100svh` for full-screen sections, since it never overflows and does not change while scrolling. `dvh` resizes as toolbars move, which can cause layout shifts, so reserve it for cases such as a fixed app frame. None of these units respond to the on-screen keyboard.

**Safe areas**: on devices with notches, rounded corners, or a home indicator, `viewport-fit=cover` lets your page extend edge to edge, and `env()` tells you where content is unsafe:

```css
.app-bar { padding-top: max(12px, env(safe-area-inset-top)); }
.tab-bar { padding-bottom: env(safe-area-inset-bottom); }
.page    { padding-inline: max(16px, env(safe-area-inset-left)) max(16px, env(safe-area-inset-right)); }
```

Without `viewport-fit=cover` the insets are all zero. Landscape orientation is where the left and right insets matter, and installed standalone apps need the top inset because there is no browser bar.

**Try it:** Build a page with a `100vh` hero and a fixed bottom bar. On a real phone, observe the hero overflow and the bar colliding with the home indicator. Fix with `svh` and safe-area padding, and check both orientations.

**Resources**
- [MDN: Viewport meta element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport)
- [web.dev: The large, small, and dynamic viewport units](https://web.dev/blog/viewport-units)
- [MDN: env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env)

### Touch

**Pointer Events** are the single input model for mouse, touch, and pen. Use `pointerdown`, `pointermove`, `pointerup`, and `pointercancel`, and check `event.pointerType` only when behaviour must differ. `click` still fires for taps and remains the right event for activating controls, since it also covers keyboard.

The essential concept is that the browser and your code compete for touches. When the user drags, the browser may decide it is a scroll or zoom; it then fires `pointercancel` and you receive nothing further. **`touch-action`** is a CSS declaration, read before any JavaScript runs, of which gestures the browser may handle on an element:

```css
.carousel { touch-action: pan-y; }        /* browser scrolls vertically; you get horizontal drags */
.canvas   { touch-action: none; }         /* you handle everything */
button    { touch-action: manipulation; } /* pan and pinch allowed; no double-tap zoom */
```

```js
el.addEventListener('pointerdown', (e) => {
  el.setPointerCapture(e.pointerId);   // keep receiving events if the finger leaves el
});
el.addEventListener('pointermove', (e) => { if (el.hasPointerCapture(e.pointerId)) drag(e); });
el.addEventListener('pointercancel', reset);  // always handle this
```

The historic 300ms tap delay existed so browsers could wait for a possible double-tap zoom. It is gone on any page with `width=device-width` in the viewport tag; `touch-action: manipulation` removes double-tap zoom explicitly. You do not need a "fast click" library.

Other points: `touchstart` and `touchmove` listeners block scrolling unless passive, which is another reason to prefer pointer events with `touch-action`; hover does not exist on touch, so put hover-only styles behind `@media (hover: hover)` and never hide essential actions behind hover; make targets at least 24 by 24 CSS pixels (the WCAG 2.2 minimum), and 44 to 48 for primary controls, with spacing between them; use `overscroll-behavior: contain` on modals and scrollable panels to stop scroll chaining and accidental pull-to-refresh; and for multi-touch, track pointers by `pointerId` in a `Map`.

**Try it:** Build a horizontally swipeable card with pointer events. First omit `touch-action` and log `pointercancel` when you drag diagonally on a phone. Add `touch-action: pan-y` and pointer capture, and confirm horizontal drags are yours and vertical scrolling still works.

**Resources**
- [MDN: Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [MDN: touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)
- [Chrome: 300ms tap delay, gone away](https://developer.chrome.com/blog/300ms-tap-delay-gone-away)

### Virtual keyboard

On a phone, the keyboard is part of your form's UI, and you choose which one appears.

`type` sets semantics and validation; **`inputmode`** sets only the keyboard layout: `text`, `numeric` (digits), `decimal` (digits and a separator), `tel`, `email`, `url`, `search`, and `none`. **`enterkeyhint`** labels the action key: `enter`, `done`, `go`, `next`, `previous`, `search`, or `send`. `autocomplete` lets the OS fill values, and `autocapitalize` and `autocorrect` control text assistance.

```html
<input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" enterkeyhint="done">
<input type="email" autocomplete="email" autocapitalize="none" enterkeyhint="next">
<input type="text" inputmode="decimal" enterkeyhint="done">
```

Prefer `type="text"` with `inputmode="numeric"` over `type="number"` for card numbers, postcodes, and codes: `type="number"` strips leading zeros, changes value on scroll in some browsers, and accepts `e`. Keep input font size at 16px or more, or iOS zooms in on focus.

**Layout when the keyboard opens**: on iOS, and by default in Chrome on Android, the keyboard shrinks only the *visual* viewport. The layout viewport, `vh` and `dvh` units, and `position: fixed; bottom: 0` elements do not move, so a fixed bottom bar ends up hidden behind the keyboard. Options:

- Avoid the problem: keep the submit control in the scrolling content, close to the field. The browser scrolls the focused field into view on its own.
- In Chrome and Firefox on Android, add `interactive-widget=resizes-content` to the viewport meta tag so the layout viewport resizes. Safari does not support it.
- Use `window.visualViewport` (`resize` and `scroll` events, `height`, `offsetTop`) to position an element above the keyboard. This works everywhere.
- The VirtualKeyboard API (`navigator.virtualKeyboard.overlaysContent = true` with `env(keyboard-inset-height)`) is Chromium-only.

Also submit on the Enter key by using a real `<form>`, move focus to the next field where it helps, and do not autofocus a field on page load on mobile, since it opens the keyboard over the content.

**Try it:** Build a chat screen with a composer fixed at the bottom. On a real iPhone and Android phone, focus the input and see where the composer goes. Fix it with `visualViewport`, then set `inputmode` and `enterkeyhint="send"` and check the keyboard.

**Resources**
- [MDN: inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)
- [MDN: enterkeyhint](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint)
- [Chrome: Prepare for viewport resize behavior changes](https://developer.chrome.com/blog/viewport-resize-behavior)

### Real-device testing

Emulators and the DevTools device toolbar get layout roughly right. They do not reproduce real CPU speed, thermal throttling, memory pressure, the on-screen keyboard, browser toolbars, touch latency, or WebKit on iOS. You need at least one mid-range Android phone and one iPhone, and a way to attach DevTools to each.

**Android (Chrome, Edge, Samsung Internet, and WebViews)**:

1. On the phone, enable Developer options (tap Build number seven times) and turn on USB debugging.
2. Connect by USB, open `chrome://inspect/#devices` on your computer, and accept the prompt on the phone.
3. Click **inspect** beside a tab. You get full DevTools, with a live screencast.
4. Enable **Port forwarding** (for example 5173 to `localhost:5173`), or run `adb reverse tcp:5173 tcp:5173`. The phone then loads `http://localhost:5173`, which counts as a secure context, so service workers work without certificates.

Firefox for Android uses `about:debugging` in desktop Firefox.

**iOS and iPadOS** require a Mac:

1. On the device: Settings, Apps, Safari, Advanced, turn on Web Inspector.
2. On the Mac: Safari, Settings, Advanced, enable features for web developers.
3. Connect by cable; the device appears in Safari's **Develop** menu, listing its tabs, Home Screen web apps, and inspectable web views. Service workers appear there too.

The iOS Simulator in Xcode is inspectable the same way and is accurate for layout and API support, though not for performance. Without a Mac, a cloud device service is the practical option. Playwright's WebKit build is useful for catching engine differences in CI but is not iOS Safari.

To reach a dev server from a phone on Wi-Fi, bind it to the network (`vite --host`), but remember that a plain `http://192.168.x.x` address is not a secure context, so service workers and many APIs will not run. Use port forwarding, a tunnel, or `mkcert`.

Keep a short manual script: install, launch offline, rotate, fill a form, background for a minute, return.

**Try it:** Attach DevTools to your phone, load your dev server through port forwarding, and record a Performance trace of one interaction on the device. Compare the main-thread time with the same trace on your laptop.

**Resources**
- [Chrome DevTools: Remote debug Android devices](https://developer.chrome.com/docs/devtools/remote-debugging)
- [Apple: Inspecting iOS and iPadOS](https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios)
- [WebKit: Enabling Web Inspector](https://webkit.org/web-inspector/enabling-web-inspector/)

### Constrained devices

The typical phone on the web is not a flagship. A budget Android device has a CPU several times slower than a developer laptop in single-thread work, 2 to 4GB of RAM shared with everything else, slow flash storage, and a connection the user pays for by the megabyte.

**CPU**: JavaScript parse, compile, and execution dominate. A bundle that boots in 300ms on your machine can take two or three seconds. Ship less JavaScript, split by route, avoid hydrating what is not interactive, keep tasks under 50ms, and move heavy work to workers. Test with DevTools CPU throttling as a rough guide, and on a real low-end phone as the truth.

**Memory**: when memory is short, the OS kills background tabs and web apps without notice. The page gets no event at that point, so save state earlier, on `visibilitychange` to hidden, which is the last event you can rely on. Do not use `unload` or `beforeunload` for this. Large images are the usual memory hog: a decoded 4000 by 3000 photo is 48MB regardless of file size, so serve appropriately sized images with `srcset`. Virtualise long lists and avoid large in-memory caches.

**Network**: latency hurts more than bandwidth, and connections drop. Cache aggressively with a service worker, compress, and avoid request waterfalls. Respect explicit user preference:

```js
const conn = navigator.connection;               // Chromium only
const lite = conn?.saveData || /2g/.test(conn?.effectiveType ?? '');
if (!lite) preloadNextPage();
```

The server can read the `Save-Data: on` request header (also Chromium-only). `navigator.deviceMemory` and `navigator.hardwareConcurrency` give coarse hardware hints. Because these signals are missing in Safari and Firefox, make the light path the default and enhance upward, rather than the reverse.

Battery and heat: continuous animation, polling, and wake locks drain batteries and cause thermal throttling, which slows the CPU further. Pause work when the page is hidden, and honour `prefers-reduced-motion`.

A performance budget makes this enforceable: for example, under 200KB of compressed JavaScript on the critical path and responsive interactions on a throttled mid-tier profile, checked in CI.

**Try it:** Throttle to 6x CPU and "Slow 4G", load your app, and record the time until you can interact. Then implement one of: state saving on `visibilitychange`, a `saveData` light mode, or route-level code splitting, and measure again.

**Resources**
- [web.dev: Adaptive serving based on network quality](https://web.dev/articles/adaptive-serving-based-on-network-quality)
- [Chrome: Page Lifecycle API](https://developer.chrome.com/docs/web-platform/page-lifecycle-api)
- [MDN: Save-Data header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Save-Data)

### React Native basics

React Native lets you write React components that render **native platform views** rather than DOM elements. `<View>` becomes a `UIView` on iOS and an `android.view.View` on Android; `<Text>` becomes a native text view. There is no HTML, no CSS, and no browser. Your JavaScript runs in the Hermes engine inside a native app.

```jsx
import { View, Text, Pressable, StyleSheet } from 'react-native';

export function Counter({ count, onIncrement }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Count: {count}</Text>
      <Pressable onPress={onIncrement}><Text>Add</Text></Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  label: { fontSize: 18, fontWeight: '600' },
});
```

What transfers from the web: React itself (components, hooks, state), TypeScript, and most of your non-UI logic. What does not: styles are JavaScript objects with a subset of CSS and no cascade or selectors; layout is flexbox only (via the Yoga engine) and defaults to `flexDirection: 'column'`; all text must be inside `<Text>`; there is no `<a>` or URL-based navigation by default, so you use a navigation library; and long lists need `FlatList`.

The architecture today (the "New Architecture", the only one since version 0.82) has three parts: **JSI**, which lets JavaScript hold direct references to native objects instead of passing serialised messages over a bridge; **Fabric**, the renderer, which supports synchronous layout and concurrent React; and **TurboModules**, lazily loaded native modules with typed interfaces. The React Native team recommends starting with a framework, and **Expo** is the one they point to: it supplies the build service, file-based routing, over-the-air updates, and a large set of native modules.

Choose it when you need app-store presence with native look, feel, and performance, native APIs the web lacks, and your team already knows React. Do not choose it for content sites, anything that depends on links and search, or when a PWA meets the requirements: you take on native builds, store review, and two platforms' quirks.

**Try it:** Run `npx create-expo-app@latest`, open it in Expo Go on your phone, and rebuild a small component from a web project. List every place you had to change your approach to styling, text, lists, or navigation.

**Resources**
- [React Native: Introduction](https://reactnative.dev/docs/getting-started)
- [React Native: Architecture overview](https://reactnative.dev/architecture/landing-page)
- [Expo: Documentation](https://docs.expo.dev/)

### Web views and hybrids

A **web view** is a browser engine embedded in a native app as a UI component: `WKWebView` on iOS (WebKit) and `android.webkit.WebView` on Android (Chromium, updated through the Play Store). A hybrid app is a native shell whose interface is your web app in a web view, plus a bridge that lets JavaScript call native code.

**Capacitor** (version 8 is current) is the standard toolkit. You build your web app as usual, and Capacitor copies the output into real Xcode and Android Studio projects that you own and commit. Plugins expose native features through JavaScript:

```js
import { Camera, CameraResultType } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

const photo = await Camera.getPhoto({ resultType: CameraResultType.Uri, quality: 80 });
if (Capacitor.isNativePlatform()) { /* native-only behaviour */ }
```

```sh
npm run build && npx cap sync   # copy web assets and update native plugins
npx cap open ios                # open in Xcode
```

Things that differ from a browser: the app is served from a local origin (`capacitor://localhost` on iOS, `https://localhost` on Android), so CORS, cookies, and OAuth redirects need configuring; service workers are generally unavailable in `WKWebView`, and unnecessary because assets are bundled; there is no browser UI, so you handle back navigation, links, and safe areas; Android users may have an outdated System WebView; and web view storage can be cleared by the OS, so keep important data in native storage plugins. Debug with `chrome://inspect` and Safari's Develop menu exactly as for a browser.

Related options: store packaging for an existing PWA, including Trusted Web Activities, is covered under App store distribution. Many native apps also embed web views for individual screens, where the considerations are the bridge, shared authentication, and matching native look.

Trade-offs: one codebase and web skills, against rendering performance bounded by the web view and a non-native feel unless you invest in it. Apple's review guidelines reject apps that are merely a repackaged website, so add real app value.

**Try it:** Add Capacitor to an existing web project, run it on an Android emulator or device, attach `chrome://inspect`, and call one native plugin (Camera, Share, or Haptics). Note what breaks compared with the browser.

**Resources**
- [Capacitor: Documentation](https://capacitorjs.com/docs)
- [Capacitor: Development workflow](https://capacitorjs.com/docs/basics/workflow)
- [Apple: WKWebView](https://developer.apple.com/documentation/webkit/wkwebview)

### Desktop

There are three ways to put a web UI on the desktop, and they differ in what they bundle.

**Electron** ships a full copy of Chromium and Node.js with your app. A **main process** (Node) creates windows and has full OS access; each window is a **renderer process** running your web code; a **preload script** bridges the two.

```js
// preload.js
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('files', {
  open: () => ipcRenderer.invoke('dialog:open'),
});
```

You get identical rendering on every OS, the newest web features, and the whole npm ecosystem, at the cost of installers around 100MB or more, high baseline memory, and the responsibility of shipping Chromium security updates (a new major arrives about every eight weeks, with only the latest three supported). Security is your job: keep `contextIsolation` and the sandbox on, `nodeIntegration` off, expose narrow functions rather than `ipcRenderer` itself, and never load remote content with privileges.

**Tauri** (version 2) uses the operating system's own web view (WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux) with a Rust core process. Installers are a few megabytes and memory use is lower. Privileged work is written as Rust commands called through `invoke()`, and a capability system restricts what each window may call. The costs: you now target three rendering engines, including WebKit quirks on macOS and an older WebKitGTK on Linux, so cross-platform testing is mandatory; native code means Rust; and the plugin ecosystem is smaller. Tauri 2 also builds for iOS and Android.

**An installed PWA** has no native layer at all: no installer, automatic updates, the browser's sandbox, and, in Chromium, file handling, protocol handling, and window controls overlay. It cannot spawn processes, access arbitrary files, or run without a supported browser.

Decide by need: deep OS integration and rendering consistency with a JavaScript team points to Electron; small footprint and tighter security with willingness to write Rust points to Tauri; neither needed points to a PWA. Whichever you pick, plan code signing, notarisation on macOS, and auto-update from day one.

**Try it:** Scaffold the same one-screen app with `npm create electron-vite@latest` (or Electron Forge) and `npm create tauri-app@latest`. Build both, and compare installer size, idle memory, and how each exposes an "open file" dialog to the UI.

**Resources**
- [Electron: Process model](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [Electron: Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Tauri: Process model](https://v2.tauri.app/concept/process-model/)

### Offline-capable PWA

This project combines the whole module: an installable notes app that works with no network and syncs when one returns. Build it in layers, and verify each before adding the next.

1. **App and data**: a single-page notes UI (list, edit, delete) that reads and writes only IndexedDB. Use client-generated UUIDs, an `updatedAt`, a `version` from the server, and a `deleted` tombstone flag. The UI never waits on the network.
2. **Shell caching**: add a service worker with Workbox `injectManifest`. Precache the shell, serve navigations from the cached `index.html`, and confirm a cold start in airplane mode.
3. **Installability**: manifest with `id`, icons including maskable, `standalone` display, and theme colours. Add a custom install button for Chromium and an instruction hint for iOS.
4. **Sync**: a small server (any stack) with `GET /notes?since=<cursor>` and `PUT /notes/:id` using `If-Match`. Client-side, an outbox store written in the same transaction as each edit, flushed on start, on `online`, on `visibilitychange`, and via Background Sync where present. Use an idempotency key per operation and a Web Lock so only one tab flushes.
5. **Conflicts**: on `412`, apply a defined policy. Start with field-level merge of title and body, falling back to a "keep mine / keep theirs" dialog.
6. **UX**: per-note status (pending, synced, failed), a connectivity indicator, "last synced" time, and an update toast for new versions.
7. **Resilience**: call `navigator.storage.persist()`, handle `QuotaExceededError`, and ship a kill-switch worker.

Acceptance tests to run by hand, on a real phone: create three notes in airplane mode, kill the app, reopen, and see them; reconnect and see them on a second device; edit the same note on both devices offline, reconnect both, and lose nothing silently; deploy a new version mid-session and update without losing a draft.

The common failure is building sync first. Get local-only working perfectly, then add the server as a replication target.

**Try it:** Build layers 1 to 3 in one sitting and install the result on your phone. Use it for real notes for a day before writing any sync code; the bugs you find in local-first behaviour are cheaper to fix now.

**Resources**
- [web.dev: Learn PWA](https://web.dev/learn/pwa)
- [MDN: Offline and background operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [Chrome Workbox: workbox-background-sync](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync)

### Mobile polish pass

Take a project you built earlier on a desktop and make it feel right on a phone. This is a review discipline more than a feature: go through the app on a real device with a checklist, fix what you find, and measure.

**Layout and viewport**
- Correct viewport meta tag; no horizontal scroll at 320 CSS pixels wide.
- Full-height sections use `svh` or `dvh`, not `vh`.
- Safe-area insets applied to fixed headers, bottom bars, and landscape side edges.
- Text is at least 16px for body and inputs; nothing requires zoom, and zoom is not disabled.

**Touch**
- Targets at least 44 by 44 CSS pixels for primary actions, with spacing.
- No hover-only functionality; hover styles are behind `@media (hover: hover)`.
- Pressed states respond immediately (`:active`), with the default tap highlight replaced deliberately, not just removed.
- Custom gestures declare `touch-action`; modals use `overscroll-behavior: contain`.
- The page does not scroll behind an open dialog.

**Forms**
- Every field has the right `type`, `inputmode`, `autocomplete`, and `enterkeyhint`.
- The focused field and the submit button stay visible with the keyboard open.
- Errors are shown inline next to the field.

**Performance and feel**
- Interactions respond within 100ms on a mid-range Android phone; long work shows progress.
- Animations use `transform` and `opacity` and respect `prefers-reduced-motion`.
- Images are sized for the device with `srcset` and reserve their space.
- State survives being backgrounded and killed: save on `visibilitychange`.

**App feel (if installable)**
- Standalone mode has its own back navigation and no dead ends.
- `theme-color` matches the UI in light and dark schemes.
- Launches to useful content offline.

Work in passes: record yourself using the app with one thumb, note every hesitation, fix, and repeat. Ask someone else to try it without instructions. Run a Lighthouse mobile audit and a field-style trace through remote debugging to confirm the improvements in numbers, not impressions.

**Try it:** Pick one earlier project. Spend 20 minutes using it on your phone and write down at least ten issues against the checklist above. Fix the five worst, then repeat the session and compare.

**Resources**
- [web.dev Learn PWA: App design](https://web.dev/learn/pwa/app-design)
- [web.dev: Accessible tap targets](https://web.dev/articles/accessible-tap-targets)
- [W3C: Understanding WCAG 2.2 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
