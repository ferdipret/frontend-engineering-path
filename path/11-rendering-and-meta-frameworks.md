# Rendering, Routing, and Meta-frameworks

> Stage: 2 · Professional
> Where and when HTML gets generated is the biggest architectural decision in a frontend. Know every rendering strategy and what each costs.

## Rendering strategies

- [ ] Client-side rendering — how an SPA boots and what the user sees while it does
- [ ] Server-side rendering — render HTML per request; time to first byte vs interactivity
- [ ] Static generation — prerender at build time; incremental regeneration
- [ ] Hydration — what it is, what it costs, and how hydration mismatches happen
- [ ] Streaming SSR — send HTML in chunks with Suspense boundaries
- [ ] Partial prerendering — serve a static shell immediately and stream the dynamic parts into it
- [ ] Partial and selective hydration — islands architecture and resumability
- [ ] React Server Components — server vs client components, the `"use client"` boundary, serialisable props
- [ ] Server actions — mutate from the client without hand-written endpoints
- [ ] Edge rendering — run at the CDN edge and its runtime constraints
- [ ] Choosing a strategy — match rendering mode to each page's needs

## Routing

- [ ] Client-side routing — how routers intercept navigation and manage history
- [ ] File-based routing — layouts, nested routes, dynamic segments
- [ ] Data loading — route loaders, parallel fetching, avoiding waterfalls
- [ ] Navigation UX — pending states, scroll restoration, focus management, prefetching
- [ ] Route-level code splitting — ship only what a route needs
- [ ] Error and not-found handling — per-route error boundaries
- [ ] Route protection — auth guards, redirects, and middleware

## Meta-frameworks

- [ ] Next.js — build and deploy an app with the App Router
- [ ] Caching layers — understand what your framework caches (requests, data, rendered routes), how you opt in, and how to invalidate it
- [ ] An alternative — build something with React Router (framework mode), TanStack Start, Astro, SvelteKit, or Nuxt
- [ ] Content sites — know when Astro or a static generator beats an app framework
- [ ] Framework-free option — know when Vite plus a router is enough
- [ ] Environment variables — separate server secrets from public client config
- [ ] Backend for frontend — write API routes that shape data for the UI
- [ ] Framework image and font optimisation — use the built-in image and font components and know what they do for you
- [ ] Self-hosting and deployment targets — run a framework app on your own Node server or container, and what you take on by doing so

## SEO and discoverability

- [ ] Crawlability — how search engines render JS, and why SSR helps
- [ ] Metadata — titles, descriptions, canonical URLs, Open Graph, per-route
- [ ] Sitemaps and robots — generate and configure them
- [ ] Structured data — add JSON-LD for rich results

## Projects

- [ ] Same app, three ways — build a small blog as CSR, SSR, and static; compare with Lighthouse
- [ ] Full-stack app — auth, database, server rendering, mutations, and deployment

## Resources

- [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)
- [Next.js Learn](https://nextjs.org/learn)
- [patterns.dev: Rendering patterns](https://www.patterns.dev/)
- [Astro: Islands architecture](https://docs.astro.build/en/concepts/islands/)
