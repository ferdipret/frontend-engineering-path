# Web Performance

> Stage: 3 · Advanced
> Performance is user experience measured in milliseconds. Learn to measure first, find the real bottleneck, fix it, and keep it fixed.

## Measuring

- [ ] Why it matters - connect speed to conversion, retention, and accessibility on slow devices
- [ ] Core Web Vitals - LCP, INP, and CLS: what each measures and the good thresholds
- [ ] Other metrics - TTFB, FCP, TBT, and when each is diagnostic
- [ ] Lab vs field data - Lighthouse vs real-user data (CrUX), and why they disagree
- [ ] Real user monitoring - collect vitals with the `web-vitals` library and segment by percentile
- [ ] Performance panel - record and read a trace: main thread, long tasks, network, frames
- [ ] Test like your users - throttle CPU and network; test on a mid-range phone
- [ ] Performance APIs - `PerformanceObserver`, User Timing marks and measures, Long Animation Frames

## Loading

- [ ] Critical rendering path - what blocks first paint and how to unblock it
- [ ] Resource hints - `preload`, `preconnect`, `dns-prefetch`, `fetchpriority`, speculation rules
- [ ] Optimise LCP - find the LCP element and shorten each of its phases
- [ ] Images - modern formats (AVIF, WebP), correct sizing, lazy loading, an image CDN
- [ ] Fonts - `font-display`, preloading, subsetting, avoiding layout shift with metric overrides
- [ ] JavaScript cost - ship less; split, defer, and remove
- [ ] Rendering strategy and performance - how SSR, streaming, hydration, and islands move LCP and INP
- [ ] Third-party scripts - audit, defer, facade, or sandbox them
- [ ] HTTP caching - `Cache-Control`, immutable hashed assets, `ETag`, `stale-while-revalidate`
- [ ] CDN and compression - edge caching, Brotli, HTTP/2+ prioritisation
- [ ] Service worker caching for speed - precaching, navigation preload, and serving repeat visits from cache
- [ ] Prevent CLS - reserve space for media, ads, and late-loading content

## Runtime

- [ ] Optimise INP - break up long tasks, yield to the main thread, reduce handler work
- [ ] Layout thrashing - avoid forced synchronous layout; batch reads and writes
- [ ] Rendering cost - reduce style recalculation, layout scope, and paint; use `content-visibility`
- [ ] Compositor-only animation - animate `transform` and `opacity`; use `will-change` sparingly
- [ ] Virtualisation - render only visible rows in long lists
- [ ] Framework rendering - eliminate wasted re-renders; memoise and split state appropriately
- [ ] Off-main-thread work - Web Workers for heavy computation
- [ ] Memory leaks - find them with heap snapshots and allocation timelines
- [ ] Back/forward cache - keep pages bfcache-eligible

## Keeping it fast

- [ ] Performance budgets - set limits on bundle size and metrics
- [ ] CI enforcement - Lighthouse CI or bundle-size checks that fail PRs
- [ ] Regression hunting - correlate a metric regression with a deploy
- [ ] Perceived performance - skeletons, optimistic UI, and instant feedback
- [ ] Making the case - present performance work in business terms

## Projects

- [ ] Performance audit - profile a real site, write a prioritised report, estimate impact
- [ ] Fix a slow app - take a deliberately slow app to all-green Core Web Vitals and document each fix
- [ ] RUM dashboard - collect and chart web vitals from one of your deployed projects

## Resources

- [web.dev: Learn Performance](https://web.dev/learn/performance)
- [web.dev: Core Web Vitals](https://web.dev/articles/vitals)
- [web.dev: Optimize INP](https://web.dev/articles/optimize-inp)
- [High Performance Browser Networking](https://hpbn.co/)
