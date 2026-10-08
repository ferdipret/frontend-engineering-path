# PWAs, Offline, and Mobile

> Stage: 3 · Advanced
> Most web traffic is on phones with unreliable networks. Build experiences that install, work offline, and feel native to touch.

## Service workers

- [ ] Lifecycle — registration, install, waiting, activate, and updating safely
- [ ] Caching strategies — cache-first, network-first, stale-while-revalidate, and when to use each
- [ ] Cache Storage API — precache an app shell and manage versions
- [ ] Workbox — use it rather than hand-rolling
- [ ] Update UX — prompt users when a new version is ready
- [ ] Service worker kill switch — recover users from a bad deploy by shipping a worker that unregisters itself
- [ ] Background sync and push — queue work offline; send notifications responsibly

## Installable apps

- [ ] Web app manifest — name, icons, display mode, theme, shortcuts
- [ ] Installability — criteria and the install prompt flow
- [ ] App-like capabilities — badging, file handling, share target, and Project Fugu APIs
- [ ] Platform differences — what iOS Safari supports and doesn't
- [ ] App store distribution — package a PWA for Google Play, the Microsoft Store, and the App Store

## Offline-first

- [ ] Offline UX — communicate connectivity and what's available
- [ ] Client databases — IndexedDB, OPFS, and SQLite via WebAssembly
- [ ] Sync and conflicts — queue mutations and resolve conflicts on reconnect
- [ ] Storage limits — quotas, eviction, and persistent storage requests

## Mobile web

- [ ] Viewport — the meta tag, dynamic viewport units, safe-area insets
- [ ] Touch — pointer events, gestures, `touch-action`, eliminating tap delays
- [ ] Virtual keyboard — `inputmode`, `enterkeyhint`, and layout when the keyboard opens
- [ ] Real-device testing — remote debug on Android and iOS
- [ ] Constrained devices — design for slow CPUs, low memory, and metered data

## Beyond the browser

- [ ] React Native basics — know the model and when it's the right choice
- [ ] Web views and hybrids — Capacitor, and embedding web in native apps
- [ ] Desktop — Electron and Tauri trade-offs

## Projects

- [ ] Offline-capable PWA — an installable notes app that syncs when back online
- [ ] Mobile polish pass — take an earlier project and make it feel great on a real phone

## Resources

- [web.dev: Learn PWA](https://web.dev/learn/pwa)
- [Workbox](https://developer.chrome.com/docs/workbox)
- [MDN: Progressive web apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
