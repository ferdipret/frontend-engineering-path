# Rendering, Routing, and Meta-frameworks: Guide

## Toolkit

### DevTools and tooling

- **View Source versus Elements.** `Ctrl+U` (View Source) shows the HTML the server sent; the Elements panel shows the DOM after JavaScript ran. The difference between the two is the single fastest way to tell how a page is rendered. An empty `<div id="root">` in the source means client rendering; full content means SSR or static.
- **Network panel.** Click the document request and read the Response tab for the raw HTML and the Timing tab for *Waiting for server response* (TTFB). For a streamed page, the *Content Download* bar is long because the response stays open. Set throttling to *Slow 4G* and tick *Disable cache* to see what real users see. Filter by `Fetch/XHR` to watch RSC payloads (`?_rsc=` in Next.js) and loader requests on client navigations.
- **Disable JavaScript.** Command menu (`Ctrl+Shift+P`) then *Disable JavaScript*, then reload. What remains is what crawlers without rendering, link unfurlers, and users on a failed bundle get.
- **Performance panel.** Record a reload with 4x CPU throttling. Look for the gap between FCP/LCP markers and the end of the long tasks: that gap is hydration. The panel's live metrics view shows LCP, CLS, and INP for the current page.
- **`curl`.** `curl -sN https://site/page` prints a streamed response chunk by chunk (`-N` disables buffering). `curl -sI` shows status and cache headers such as `cache-control`, `age`, and `x-nextjs-cache`.
- **React Developer Tools.** The Components tab lets you suspend a boundary or force an error boundary to see fallbacks. The Profiler shows what hydrated and re-rendered.
- **Lighthouse.** In DevTools or `npx lighthouse <url> --view`. Run it against a production build, never the dev server.
- **Framework tooling.** `next build` prints a route table marking each route as static or dynamic; the Next.js dev overlay explains hydration mismatches and blocking routes. `npx react-router routes` prints the route tree. `astro check` type-checks content collections. `npx vite-bundle-visualizer` or `next experimental-analyze` shows what each route ships.

### Testing and verifying your work

Verify rendering claims against the wire, not against your assumptions. For each route you care about, check four things on a production build (`next build && next start`, `astro build && astro preview`, `vite build && vite preview`):

1. **What HTML arrives.** `curl -s <url>` and search for the main content and the `<title>`. If it is missing, crawlers and unfurlers will not see it either.
2. **What caches.** Request the page twice with `curl -sI` and compare `cache-control`, `age`, and any framework cache header. Change the data and confirm your invalidation path (a server action, a webhook, a time window) actually produces fresh HTML.
3. **What hydrates cleanly.** Load with the console open. A hydration warning is a bug, not noise: React throws away and re-renders the mismatched subtree.
4. **What ships.** Read the bundle analyser output per route and check that a heavy dependency used on one route is not in the shared chunk.

Automate the important ones. Playwright can assert on server HTML with `request.get(url)` and `expect(await res.text()).toContain(...)`, run a context with `javaScriptEnabled: false` to prove forms work before hydration, and assert redirects for protected routes with an unauthenticated context. Test route protection at the data layer too: call the server action or API route directly without a session and expect a 401 or 403.

For SEO, use the URL Inspection tool in Google Search Console to see the rendered HTML Google stored, and the Rich Results Test for JSON-LD. For performance, compare Lighthouse runs across strategies with the same throttling, and trust field data (CrUX, your own `web-vitals` reporting) over lab numbers. "Done" means the HTML, the cache headers, the bundle, and the unauthenticated behaviour all match what you intended, and you checked each one.

### Tricks and gotchas

- The dev server lies about performance and caching. Next.js renders every page on demand in development; always measure a production build.
- A Client Component in Next.js still renders on the server for the initial HTML. `"use client"` means "also ships to and hydrates in the browser", not "skips SSR".
- `"use client"` marks a module boundary. Everything that file imports joins the client bundle, so put the directive as low in the tree as you can.
- Once the first streamed chunk is sent, the status code and headers are fixed. A redirect or 404 discovered later cannot change the HTTP status; do those checks before anything suspends.
- A reverse proxy that buffers responses (nginx by default, some corporate proxies) silently turns streaming into one big late response. Check with `curl -N`.
- Server actions and API routes are public HTTP endpoints. Hiding the button is not authorisation; check the session inside every one.
- In Next.js 15 and later, `params`, `searchParams`, `cookies()`, and `headers()` are asynchronous and must be awaited, and `fetch` is not cached unless you opt in.
- Next.js 16 renamed `middleware.ts` to `proxy.ts` and runs it on the Node.js runtime. Old tutorials that say "middleware runs on the edge" describe earlier versions.
- A variable prefixed `NEXT_PUBLIC_` or `VITE_` is inlined into the JavaScript at build time. It is public forever, and changing it needs a rebuild.
- Sequential `await`s in one component are a waterfall. Start the promises first, then `await Promise.all`.
- After a deploy, users with an open tab may request chunks that no longer exist. Handle the chunk load error (Vite fires `vite:preloadError`) by reloading.
- Client-side navigations do not move focus or announce the new page by themselves. Check with a screen reader, not just your eyes.
- `noindex` only works if the page can be crawled. Blocking the URL in `robots.txt` stops Google from ever seeing the tag.

### Official references

- [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web) - the canonical comparison of CSR, SSR, static rendering, and hydration variants.
- [React: Server Components reference](https://react.dev/reference/rsc/server-components) - what Server Components, `"use client"`, and Server Functions are, independent of any framework.
- [React DOM: Server APIs](https://react.dev/reference/react-dom/server) - `renderToPipeableStream`, `renderToReadableStream`, and the prerender APIs that frameworks build on.
- [Next.js: App Router documentation](https://nextjs.org/docs/app) - routing, rendering, caching, and deployment for the App Router.
- [React Router: Picking a mode](https://reactrouter.com/start/modes) - declarative, data, and framework modes and what each gives you.
- [Astro: Islands architecture](https://docs.astro.build/en/concepts/islands/) - client and server islands explained by the framework that popularised them.
- [Vite: Server-side rendering](https://vite.dev/guide/ssr) - the low-level SSR primitives every Vite-based framework uses.
- [MDN: History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) - the browser API underneath every client-side router.
- [Google Search Central: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) - how Googlebot crawls, renders, and indexes JavaScript pages.
- [Schema.org: Getting started](https://schema.org/docs/gs.html) - the vocabulary used by JSON-LD structured data.

## Skills

### Client-side rendering

In client-side rendering (CSR) the server sends a nearly empty HTML document and a script. The browser downloads the bundle, parses and runs it, the app builds the DOM, and only then fetches its data and renders real content.

```html
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index-4f2a.js"></script>
</body>
```

The sequence matters because each step waits for the previous one: HTML, then JavaScript, then data, then content. The user sees a blank page (or whatever static shell you put in `index.html`) until the bundle executes, and a spinner until the data arrives. First Contentful Paint and Largest Contentful Paint both sit behind the JavaScript, so they scale with bundle size and device speed, not just network speed. A mid-range phone can take several times longer than your laptop to parse the same bundle.

CSR has real advantages: hosting is a folder of static files on a CDN, there is no server to scale, navigations after the first load are instant, and the mental model is simple. It suits apps behind a login (dashboards, editors, internal tools) where SEO is irrelevant and users return with a warm cache. It suits public content badly: link unfurlers and many crawlers do not run JavaScript, so they see the empty shell.

Common mistakes: fetching data only after the app mounts when you could start the request earlier (in a route loader or with `<link rel="preload">`), forgetting the server fallback so that deep links 404, and putting nothing in the static shell. An inlined header and skeleton in `index.html` paint before any JavaScript runs.

**Try it:** Create an app with `npm create vite@latest` (React template), build it, and serve it with `npx vite preview`. Open View Source and confirm the body is empty. In the Network panel, throttle to Slow 4G and note when the first content appears relative to when the script finishes. Then disable JavaScript and reload.

**Resources**
- [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)
- [web.dev: Client-side rendering of HTML and interactivity](https://web.dev/articles/client-side-rendering-of-html-and-interactivity)

### Server-side rendering

In server-side rendering (SSR) the server runs your components for each request and responds with complete HTML. The browser can paint content as soon as the HTML arrives, before any JavaScript loads. The page then hydrates to become interactive.

The trade is between three moments. **Time to First Byte** gets worse, because the server must fetch data and render before it can respond; a slow database query delays everything, including the `<head>`. **First and Largest Contentful Paint** usually get better, because content is in the first response instead of behind a bundle. **Interactivity** is unchanged or slightly worse: the same JavaScript still has to download and hydrate, and until it does the page looks ready but buttons do nothing. That window is the weak spot of SSR; keep it short by shipping less JavaScript, and make critical controls work without it (real links, real `<form>` elements).

SSR is the right default when content depends on the request: a logged-in user, a cookie, a search query, fresh inventory. It costs a running server (or serverless function) per request, so cache whatever you can. A `Cache-Control: s-maxage=60, stale-while-revalidate=300` header on a public SSR page lets a CDN absorb almost all traffic.

Code that runs on the server has no `window`, `document`, or `localStorage`, and it serves many users at once. A module-level variable holding user data is shared between requests, which is a data leak, not a cache.

```js
// Wrong on a server: one object shared by every request
let currentUser = null;
```

**Try it:** Run `curl -s -o /dev/null -w "%{time_starttransfer}\n"` against an SSR page that awaits a slow query, then against a static page. Add an artificial `await new Promise(r => setTimeout(r, 2000))` to the server render and watch TTFB move by exactly two seconds.

**Resources**
- [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)
- [Vite: Server-side rendering](https://vite.dev/guide/ssr)
- [web.dev: Optimize Time to First Byte](https://web.dev/articles/optimize-ttfb)

### Static generation

Static site generation (SSG) runs the same server render at build time and writes the HTML to files. Requests are served from a CDN with no computation, which gives the best possible TTFB, the lowest cost, and nothing to fall over under load. The limits are that content is as old as the last build, every visitor gets the same HTML, and build time grows with page count.

For dynamic routes you tell the framework which paths exist. In Next.js:

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}
```

**Incremental static regeneration** (ISR) removes the "rebuild everything" problem. A page is generated once, cached, and regenerated in the background, either after a time window or when you invalidate it on demand. It follows stale-while-revalidate semantics: the request that arrives after the window still gets the old page instantly and triggers the regeneration, and the next visitor gets the new one. Paths not generated at build time can be rendered on first request and cached from then on. With Next.js Cache Components you express this with `"use cache"` plus `cacheLife` and `cacheTag`; in the previous model with `export const revalidate = 3600` or `fetch(url, { next: { revalidate: 3600 } })`.

Mistakes to avoid: using time-based revalidation where a CMS webhook calling `revalidateTag` would be both fresher and cheaper, reading cookies or headers in a page you expected to be static (which makes it dynamic), and forgetting that personalised parts need a different strategy, such as a client fetch or a streamed hole.

**Try it:** In a Next.js app, build a page that prints `new Date().toISOString()`. Run `next build && next start`, reload several times, and confirm the time is frozen. Add time-based revalidation of 10 seconds and observe which reload shows the new time.

**Resources**
- [Next.js: Incremental Static Regeneration](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
- [Next.js: generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)

### Hydration

Hydration is how server-rendered HTML becomes an app. The browser already has the DOM; the framework runs your components on the client, builds its internal tree, matches it against the existing DOM, and attaches event handlers and state instead of creating new elements. In React this is `hydrateRoot(domNode, <App />)`.

The cost is that you pay for rendering twice. The server rendered the page, and now the client downloads all component code and the data needed to re-render (serialised into the HTML, so it is sent twice as well), then executes every component. Until that finishes, the page is visible but inert. On slow devices this is hundreds of milliseconds to seconds of main-thread work that directly hurts INP.

A **hydration mismatch** happens when the client's first render does not produce what the server sent. Typical causes:

- Values that differ per environment: `Date.now()`, `Math.random()`, locale or time-zone formatting.
- Branching on `typeof window !== 'undefined'` or reading `localStorage` during render.
- Invalid nesting such as `<div>` inside `<p>`, which the HTML parser repairs before React sees it.
- Browser extensions that modify the DOM.

React reports the diff, then discards the server HTML for that subtree and renders it on the client, which is slower and can flash. Fix the cause: render the same thing on both sides first, then update in an effect.

```jsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
return <span>{mounted ? new Date().toLocaleTimeString() : ''}</span>;
```

`suppressHydrationWarning` silences one element's text or attribute mismatch (a timestamp, say); it does not fix anything and only applies one level deep. For external stores, `useSyncExternalStore` takes a `getServerSnapshot` for exactly this purpose.

**Try it:** In an SSR app render `{Math.random()}` in a component. Read the hydration error and note which value ends up on screen. Then record a Performance trace with 6x CPU throttling and find the hydration task after first paint.

**Resources**
- [React: hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Next.js: Text content does not match server-rendered HTML](https://nextjs.org/docs/messages/react-hydration-error)

### Streaming SSR

Classic SSR is all-or-nothing: the server waits for all data, renders everything, and sends one response, so the slowest query sets TTFB. Streaming SSR sends HTML as it becomes ready over a single chunked response. In React, `<Suspense>` boundaries mark the seams.

```jsx
<Layout>
  <ProductHeader id={id} />
  <Suspense fallback={<ReviewsSkeleton />}>
    <Reviews id={id} />
  </Suspense>
</Layout>
```

The server immediately flushes the *shell*: everything outside suspended boundaries, with fallbacks in place. When `Reviews` finishes, React appends its HTML to the same response inside a hidden `<template>`-style container along with a small inline script that moves it into the fallback's position. No client framework code is needed for that swap, so content can appear before the bundle loads. The underlying APIs are `renderToPipeableStream` (Node) and `renderToReadableStream` (Web Streams); frameworks call them for you. In Next.js a `loading.tsx` file is a Suspense boundary around the page.

Streaming also enables **selective hydration**: React hydrates boundaries independently as their code and HTML arrive, and prioritises the one the user interacts with.

Details that bite:

- The status code and headers are sent with the first chunk. A `notFound()` or redirect after that cannot change the status, so do those checks before the first suspension.
- Anything that buffers the response (a proxy, some compression middleware, certain serverless platforms) defeats streaming.
- Too many small boundaries produce a page that pops in piece by piece and shifts layout. Give fallbacks the same dimensions as the content and group related content under one boundary.
- An error inside a boundary after the shell is sent falls back to client rendering for that boundary.

**Try it:** Create a Next.js page with a component that awaits a 3-second timer inside `<Suspense>`. Run `curl -N` against it and watch the shell arrive, a pause, then the rest. Find the inline script that swaps the content in.

**Resources**
- [React: renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream)
- [React 18 working group: New Suspense SSR architecture](https://github.com/reactwg/react-18/discussions/37)
- [Next.js: Streaming](https://nextjs.org/docs/app/guides/streaming)

### Partial prerendering

Static generation and server rendering used to be a per-route choice: one cookie read made the whole page dynamic. Partial prerendering (PPR) makes the choice per component. At build time the framework renders the route as far as it can and saves the result as a **static shell**: the layout, everything that depends on no request data, anything you explicitly cached, and the Suspense *fallbacks* for the parts it could not finish. At request time the shell is sent immediately, from a CDN if you have one, and the server renders the unfinished parts and streams them into the same response.

```tsx
export default function ProductPage({ params }: PageProps<'/products/[id]'>) {
  return (
    <>
      <ProductDetails params={params} />   {/* "use cache": in the shell */}
      <Suspense fallback={<CartSkeleton />}>
        <CartSummary />                    {/* reads cookies(): streamed */}
      </Suspense>
    </>
  );
}
```

The user gets static-site TTFB and a meaningful first paint, and the personalised part arrives a moment later without a second request from the browser. It is streaming SSR where the shell was rendered ahead of time.

In Next.js 16 this is the rendering model you get when `cacheComponents: true` is set. The rules are strict and enforced:

- A component that reads `cookies()`, `headers()`, `searchParams`, or uncached data must be inside a `<Suspense>` boundary or marked `"use cache"`. Otherwise the dev overlay reports a blocking route, because nothing could be prerendered above it.
- Suspense does not make anything dynamic; it only marks where a hole is allowed.
- `Date.now()`, `Math.random()`, and similar need `await connection()` first (per request) or a cache (shared).
- The lower in the tree you read request data, the larger the shell. Pass the `params` promise down instead of awaiting it in a layout.
- Crawlers are detected and given a fully rendered document instead of a shell.

Size the fallbacks to match the final content, or the streamed parts cause layout shift. Astro's server islands (`server:defer`) reach a similar result differently: the page is fully static and each island is fetched with its own request.

**Try it:** Enable `cacheComponents` in a Next.js app. Build a page with a static heading, a cached list, and a component that reads a cookie inside `<Suspense>`. Run `next build && next start`, then `curl -N` the page and identify the shell, the fallback, and the streamed chunk. Move the cookie read into the layout and read the error.

**Resources**
- [Next.js: Caching (prerendering with Cache Components)](https://nextjs.org/docs/app/getting-started/caching#prerendering)
- [Next.js: cacheComponents configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [Astro: Server islands](https://docs.astro.build/en/guides/server-islands/)

### Partial and selective hydration

Full hydration re-runs the whole page on the client even though most of a typical page (text, images, navigation) never changes. Three approaches reduce that cost.

**Islands architecture** inverts the default. The page is static HTML with no framework runtime, and you opt individual components into hydration. Each island loads and hydrates independently. In Astro the directive says when:

```astro
<Header />                         <!-- HTML only, zero JS -->
<SearchBox client:load />          <!-- hydrate immediately -->
<Comments client:visible />        <!-- hydrate when scrolled into view -->
<Chart client:idle />              <!-- hydrate when the main thread is idle -->
```

Islands do not share a component tree, so they cannot share React context; use a small external store, custom events, or the URL to communicate. Astro's *server islands* (`server:defer`) apply the same idea to server rendering: a static page with a hole that is filled by a separate request.

**Selective hydration** is React's version inside a single tree: Suspense boundaries hydrate separately and in priority order. Everything still hydrates eventually. **React Server Components** go further by never sending the code for server-only components at all.

**Resumability**, used by Qwik, skips hydration altogether. The server serialises application state and listener locations into the HTML. A tiny global listener waits for an event, then lazy-loads only the handler needed for that interaction and resumes from the serialised state. Start-up cost stays roughly constant as the app grows, in exchange for a different programming model and more requests on first interaction.

The mistake to avoid is choosing an islands framework for something that is really an application. When most of the page is interactive and state flows everywhere, islands become a coordination problem.

**Try it:** Create an Astro project with `npm create astro@latest`, add a React counter, and render it once with no directive and once with `client:visible` far down the page. Watch the Network panel as you scroll: the component's JavaScript loads only when it enters the viewport.

**Resources**
- [Astro: Islands architecture](https://docs.astro.build/en/concepts/islands/)
- [Astro: Client directives reference](https://docs.astro.build/en/reference/directives-reference/#client-directives)
- [Qwik: Resumable versus hydration](https://qwik.dev/docs/concepts/resumable/)

### React Server Components

React Server Components (RSC) split your component tree across two environments. **Server Components** run only on the server, at build time or per request. They can be `async`, read the database or file system directly, and their code never reaches the browser. They cannot use state, effects, event handlers, or browser APIs. **Client Components** are the components you already know; they are marked by `"use client"` at the top of a file.

```tsx
// app/post/[id]/page.tsx: a Server Component by default
import LikeButton from './like-button';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await db.post.find(id);
  return (
    <article>
      <h1>{post.title}</h1>
      <LikeButton postId={post.id} initialLikes={post.likes} />
    </article>
  );
}
```

```tsx
// app/post/[id]/like-button.tsx
'use client';
import { useState } from 'react';

export default function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  return <button onClick={() => setLikes(likes + 1)}>{likes} likes</button>;
}
```

Three things people get wrong:

- `"use client"` is a boundary in the *module graph*, not a per-component switch. Everything the file imports becomes client code. You do not add it to every interactive file, only to the entry points from server to client.
- Client Components are still rendered to HTML on the server for the initial load. "Client" means they also hydrate.
- Props that cross the boundary are serialised. Strings, numbers, plain objects, arrays, `Date`, `Map`, `Set`, promises, and JSX are fine. Functions (other than Server Functions) and class instances are not, so you cannot pass an `onClick` from a Server Component.

A Client Component cannot import a Server Component, but it can receive one as `children`, which is how you wrap server content in a client provider or modal. The server output is the *RSC payload*, a serialised tree that React uses to update the page on navigation without losing client state. Add `import 'server-only'` to modules that must never be bundled for the client.

**Try it:** In a Next.js app, import a large library (a markdown parser, for example) in a Server Component and confirm it is absent from the client bundle. Add `"use client"` to that file, rebuild, and compare the route's size in the build output.

**Resources**
- [React: Server Components](https://react.dev/reference/rsc/server-components)
- [React: 'use client' directive](https://react.dev/reference/rsc/use-client)
- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

### Server actions

A Server Function is an `async` function marked with `"use server"` that client code can call as if it were local. The framework replaces it with a reference; calling it sends a POST request, runs the function on the server, and returns the serialised result. React calls it a *Server Action* when it is passed to a form's `action` prop or invoked inside a transition.

```tsx
// app/actions.ts
'use server';
import { updateTag } from 'next/cache';

export async function addComment(_prev: { error?: string }, formData: FormData) {
  const session = await verifySession();
  if (!session) return { error: 'Sign in to comment.' };

  const body = String(formData.get('body') ?? '').trim();
  if (body.length < 2) return { error: 'Comment is too short.' };

  await db.comment.create({ body, authorId: session.userId });
  updateTag('comments');
  return {};
}
```

```tsx
'use client';
import { useActionState } from 'react';
import { addComment } from './actions';

export function CommentForm() {
  const [state, formAction, pending] = useActionState(addComment, {});
  return (
    <form action={formAction}>
      <textarea name="body" required />
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>Post</button>
    </form>
  );
}
```

What the convenience hides:

- Every Server Function is a public endpoint. Anyone can call it with any arguments, so authenticate, authorise, and validate inside it every time. TypeScript types are not validation.
- Return expected failures as values; throw only for the unexpected.
- A form with a Server Action works before hydration, because it is a real form POST.
- Mutations must invalidate what they changed (`updateTag`, `revalidateTag`, `revalidatePath` in Next.js), or the UI shows stale data.
- They are designed for mutations. Next.js runs a client's actions one at a time, so using them to fetch data serialises your requests.
- Use `useOptimistic` to show the result before the server confirms.

**Try it:** Build the form above. Submit with JavaScript disabled and confirm it still works. Then copy the request from the Network panel as cURL, change the payload, replay it, and confirm your validation rejects it.

**Resources**
- [React: Server Functions](https://react.dev/reference/rsc/server-functions)
- [React: useActionState](https://react.dev/reference/react/useActionState)
- [Next.js: Data security](https://nextjs.org/docs/app/guides/data-security)

### Edge rendering

Edge rendering runs your server code in the CDN's points of presence, close to the user, instead of in one region. The runtimes (Cloudflare Workers, Deno Deploy, Vercel's edge runtime, Netlify Edge Functions) are mostly V8 isolates rather than Node.js processes. Isolates start in milliseconds, which removes cold starts, and expose web-standard APIs: `fetch`, `Request`, `Response`, `URL`, Web Streams, and Web Crypto.

The constraints follow from that design:

- **Not full Node.js.** Historically there was no `fs`, no raw TCP sockets, and no native addons. Cloudflare's `nodejs_compat` flag now covers much of the Node API surface, but you must still check each dependency.
- **Limits.** CPU time per request and bundle size are capped far below a normal server.
- **Databases.** A traditional Postgres connection needs TCP and a pool. From the edge you use an HTTP-based driver, a connection proxy, or a globally replicated store.
- **Data gravity.** This is the one that matters most. If the function runs in Sydney and the database is in Virginia, each query crosses the planet. Three sequential queries from the edge are slower than one hop to a server sitting next to the database.

So the edge is excellent for work that needs no origin data: redirects, rewrites, geolocation, A/B bucketing, reading a signed cookie, serving cached HTML. For data-heavy rendering, run the compute in the database's region and let the CDN cache the output.

The industry has moved accordingly. Next.js 16 runs `proxy.ts` on Node.js and its docs describe the `runtime = 'edge'` segment option as deprecated; partial prerendering serves a static shell from the CDN and streams the dynamic parts from a regional server, which gets most of the benefit without the constraints.

**Try it:** Create a Worker with `npm create cloudflare@latest`, return `request.cf.country` in the response, and deploy it. Then try `import fs from 'node:fs'` and read a file; read the error, enable `nodejs_compat`, and see what changes.

**Resources**
- [Cloudflare Workers: Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
- [Cloudflare Workers: How Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/)
- [WinterTC: Minimum Common Web Platform API](https://min-common-api.proposal.wintertc.org/)

### Choosing a strategy

Rendering is a per-route decision, and often a per-component one. Ask four questions about each page:

1. **Is it public and should it be found?** Search results and link previews need content and metadata in the initial HTML.
2. **Is the content the same for everyone?** If yes, it can be generated once and cached.
3. **How fresh must it be?** Seconds, minutes, or "whenever someone publishes".
4. **How interactive is it?** A document with a few widgets and an editor are different problems.

| Page | Strategy | Why |
| --- | --- | --- |
| Marketing page, docs, blog post | Static, revalidated on publish | Same for everyone, changes rarely |
| Product page with stock level | Static shell plus a streamed or client-fetched hole | Mostly shared, one fresh value |
| Search results, account page | SSR per request | Depends on the query or the user |
| Dashboard behind login | CSR or SSR shell with client data | No SEO need, highly interactive |
| Editor, design tool | CSR | It is an application, not a document |

Prefer the most static option that meets the freshness requirement, because static is fastest, cheapest, and most resilient. Move to the server only for the part that needs it: with Suspense streaming and partial prerendering, one slow or personalised component no longer forces the whole route to be dynamic.

Mistakes: choosing one mode for the whole product because the framework's default pushed you there, server-rendering a page per request when a 60-second cache would be indistinguishable to users, and making a page dynamic by accident (reading a cookie in the root layout opts every route under it out of static rendering in the pre-Cache-Components model). Weigh operations too. SSR needs a server with monitoring and capacity; a static export needs a bucket.

**Try it:** Take a site you know well and list its five most important page types. For each, answer the four questions and pick a strategy. Then check what the site does with View Source and `curl -sI`.

**Resources**
- [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)
- [Next.js: Caching](https://nextjs.org/docs/app/getting-started/caching)
- [patterns.dev: Rendering patterns](https://www.patterns.dev/)

### Client-side routing

A client-side router makes a single HTML document behave like many pages. It does three jobs: intercept navigation, change the URL without a page load, and render the component that matches the new URL.

Stripped down, it looks like this:

```js
document.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || link.origin !== location.origin) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  history.pushState({}, '', link.href);
  render(location.pathname);
});

window.addEventListener('popstate', () => render(location.pathname));
```

`history.pushState` adds an entry and changes the address bar but fires no event and loads nothing; that is why the router renders manually. `popstate` fires when the user goes back or forward. `replaceState` changes the URL without adding an entry, which is what you want for filters and redirects. The modifier-key checks are why you should use the router's `<Link>` (which renders a real `<a href>`) rather than an `onClick` on a `<div>`: users expect middle-click, Ctrl+click, and "copy link address" to work.

Things the browser used to do that are now your router's job: scroll position, focus, the document title, pending indicators, and aborting an in-flight navigation when another starts.

The server must cooperate. A request for `/settings/profile` has to return `index.html`, or deep links and refreshes 404. Configure a fallback (Vite's dev and preview servers do this by default; in production use a rewrite rule).

The newer **Navigation API** (`navigation.addEventListener('navigate', …)` with `event.intercept()`) gives one event for every kind of navigation and handles much of this for you. It is supported in Chromium and has shipped in the other engines more recently, so check the compatibility table before relying on it without a fallback.

**Try it:** Write the 15-line router above in a plain HTML file with three links. Verify back and forward work, that Ctrl+click opens a new tab, and that refreshing on a deep URL fails until you serve with a fallback (`npx serve -s`).

**Resources**
- [MDN: Working with the History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)
- [MDN: Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API)
- [React Router: Picking a mode](https://reactrouter.com/start/modes)

### File-based routing

File-based routing derives the route table from the file system, so the URL structure is visible in the folder tree. The Next.js App Router conventions are the most widely used:

| File or folder | Meaning |
| --- | --- |
| `app/blog/page.tsx` | The page for `/blog`. A folder is only routable if it has `page` or `route`. |
| `app/blog/layout.tsx` | UI that wraps `/blog` and everything under it |
| `app/blog/[slug]/page.tsx` | Dynamic segment: `/blog/hello` |
| `app/docs/[...path]/page.tsx` | Catch-all; `[[...path]]` also matches `/docs` |
| `app/(marketing)/about/page.tsx` | Route group: organises files, not part of the URL |
| `app/_components/` | Private folder, never routable |
| `loading.tsx`, `error.tsx`, `not-found.tsx` | Suspense fallback, error boundary, 404 UI for the segment |
| `route.ts` | An HTTP endpoint instead of a page |

The key idea is **nested layouts**. Each URL segment can contribute a layout, and layouts nest like the folders do. On navigation between two pages that share a layout, the layout does not re-render or lose state: a sidebar keeps its scroll position and an input keeps its text. That is also a trap: a layout cannot read `searchParams`, and an auth check placed only in a layout is not re-run on every navigation.

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

Other frameworks differ in spelling, not substance: SvelteKit uses `+page.svelte` and `+layout.svelte`; Astro uses `src/pages/blog/[slug].astro`; React Router's framework mode declares routes in `app/routes.ts` and offers file conventions through `@react-router/fs-routes`; TanStack Router generates a fully typed route tree from files.

In current Next.js, `params` is a promise: `const { slug } = await params`. More specific routes win over dynamic ones, and two folders that resolve to the same URL are a build error.

**Try it:** In a Next.js app create `app/(shop)/products/[id]/page.tsx` with a layout in `(shop)` containing a text input. Type in the input, navigate between two product pages with `<Link>`, and confirm the input keeps its value.

**Resources**
- [Next.js: Project structure and file conventions](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js: Layouts and pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- [React Router: Routing](https://reactrouter.com/start/framework/routing)

### Data loading

The classic SPA pattern is fetch-on-render: a component mounts, an effect fetches, a spinner shows, then children mount and start their own fetches. Nested components produce a **waterfall**, where each request starts only after the previous one finishes, even when they do not depend on each other.

Route-level data loading fixes this by moving fetching out of components and attaching it to the route. When a navigation starts, the router knows every matching route (root layout, section layout, page) and runs all of their loaders in parallel, alongside loading the route's code.

```tsx
// React Router framework mode: app/routes/product.tsx
import type { Route } from './+types/product';

export async function loader({ params }: Route.LoaderArgs) {
  const [product, reviews] = await Promise.all([
    getProduct(params.id),
    getReviews(params.id),
  ]);
  return { product, reviews };
}

export default function Product({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.product.name}</h1>;
}
```

With Server Components the component is the loader, and waterfalls return in a new form:

```tsx
const user = await getUser(id);      // waits
const orders = await getOrders(id);  // starts only after user resolves
```

Start independent work first, then await it together: `const [user, orders] = await Promise.all([getUser(id), getOrders(id)])`. A real dependency (you need the user's team before fetching the team's projects) is a legitimate sequence; move it into one query or one backend call if it is hot.

Not everything should block. Return slow, non-critical data as an un-awaited promise and render it under `<Suspense>` so the page shows without it. Deduplicate repeated reads within one render with React's `cache()`. On the client, a query library such as TanStack Query adds caching, deduplication, and background refresh on top of loaders.

**Try it:** Build a page that needs three independent endpoints, each delayed by one second. Implement it with nested `useEffect` fetches, then with one loader using `Promise.all`. Compare the Network panel's waterfall view: three seconds in a staircase versus one second side by side.

**Resources**
- [React Router: Data loading](https://reactrouter.com/start/framework/data-loading)
- [Next.js: Fetching data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [React: cache](https://react.dev/reference/react/cache)

### Navigation UX

A full page load gives users a loading indicator, scroll reset, focus reset, and a title announcement for free. A client-side navigation gives none of them unless the router or you provide it.

**Pending states.** If the next route needs data, tell the user something is happening within about 100 ms, or the click feels ignored. React Router exposes `useNavigation()`; Next.js offers `loading.tsx` for an instant skeleton and `useLinkStatus()` for per-link feedback. Keep the old page visible with a subtle indicator for fast navigations rather than flashing a skeleton.

```tsx
import { useNavigation } from 'react-router';

function GlobalSpinner() {
  const navigation = useNavigation();
  return navigation.state === 'loading' ? <ProgressBar /> : null;
}
```

**Scroll restoration.** New navigations should start at the top; back and forward should return to where the user was. Browsers do this for documents (`history.scrollRestoration`), but in an SPA the content may not exist yet when the browser tries. Frameworks handle it (React Router's `<ScrollRestoration />`, Next.js by default); nested scroll containers are where it usually breaks.

**Focus and announcements.** After a client navigation, focus stays on the link that was clicked, which may no longer exist, and screen readers announce nothing. Move focus to the new page's main heading or container (`tabIndex={-1}` then `.focus()`), and make sure the document title updates. Next.js includes a route announcer; verify what your router does rather than assuming.

**Prefetching.** Loading the next route's code and data before the click makes navigation feel instant. Next.js `<Link>` prefetches links as they enter the viewport in production; React Router's `<Link prefetch="intent">` prefetches on hover or focus. For multi-page sites, the Speculation Rules API lets the browser prefetch or prerender whole documents. Prefetching costs requests, so do not prefetch pages with expensive or personalised data indiscriminately.

**Try it:** With a screen reader running (NVDA or VoiceOver), navigate between two routes of an SPA you built. Note what is announced and where focus lands. Then fix it by focusing the `<h1>` after navigation and compare.

**Resources**
- [React Router: Pending UI](https://reactrouter.com/start/framework/pending-ui)
- [Next.js: Linking and navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [MDN: Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)

### Route-level code splitting

A bundler turns every dynamic `import()` into a separate chunk that is fetched on demand. Splitting at route boundaries is the highest-value split: a user on the login page should not download the charting library used by the reports page.

Meta-frameworks do this automatically, one chunk group per route plus shared chunks. In a hand-rolled SPA you do it yourself:

```tsx
import { lazy, Suspense } from 'react';

const Reports = lazy(() => import('./routes/reports'));

<Suspense fallback={<PageSkeleton />}>
  <Reports />
</Suspense>
```

With React Router in data mode, prefer the route's `lazy` property over `React.lazy`. It lets the router fetch the route's code *in parallel with* its data during navigation, instead of rendering, suspending for code, mounting, and only then fetching.

```ts
{ path: 'reports', lazy: () => import('./routes/reports') }
```

What to check and what goes wrong:

- **Shared chunks.** A large dependency imported by two routes is hoisted into a common chunk that both load. Import a heavy library from one barrel file used everywhere and it lands in the entry bundle. Read the analyser output.
- **Split below the route too.** Modals, editors, and charts that appear only on interaction can be loaded when needed (`next/dynamic`, `React.lazy`).
- **Do not over-split.** Dozens of tiny chunks cost more in requests than they save.
- **Stale deployments.** A user with yesterday's tab clicks a link that requests yesterday's chunk hash, which is gone. Catch the failure and reload; Vite dispatches a `vite:preloadError` event for this.
- **Prefetch.** A split route without prefetching trades a smaller initial load for a slower first navigation.
- Server Components shift the problem: server-only code is never shipped, and each `"use client"` boundary is a natural split point.

**Try it:** In a Vite app, statically import a route that uses a large library and run `npx vite-bundle-visualizer`. Convert the route to `lazy`, rebuild, and compare the entry chunk size. Then watch the Network panel load the chunk on navigation.

**Resources**
- [React: lazy](https://react.dev/reference/react/lazy)
- [Next.js: Lazy loading](https://nextjs.org/docs/app/guides/lazy-loading)
- [web.dev: Reduce JavaScript payloads with code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)

### Error and not-found handling

An uncaught render error in React unmounts the whole tree, leaving a blank page. Error boundaries contain the damage, and routers let you attach one per route segment so that a failing widget takes out its own panel while the navigation and sidebar stay usable.

In Next.js, `error.tsx` wraps a segment's page and children:

```tsx
'use client';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div role="alert">
      <p>Could not load invoices.</p>
      <button onClick={() => retry()}>Try again</button>
    </div>
  );
}
```

It must be a Client Component. `retry` (stable since Next.js 16.3) re-fetches and re-renders the segment; the older `reset` only re-renders. In production, errors thrown in Server Components reach the client with a generic message and a `digest` that you match against server logs, so details do not leak. An `error.tsx` does not catch errors in the `layout.tsx` of its own segment; the parent's boundary does, and `global-error.tsx` (which must render its own `<html>` and `<body>`) catches root layout failures. React Router's equivalent is an `ErrorBoundary` export in the route module.

Separate two kinds of failure. **Expected** errors (validation failed, item out of stock) are part of the UI: return them as values and render them. **Unexpected** errors are thrown and caught by a boundary, logged, and offered a retry.

**Not found** is a different outcome, not an error. Call `notFound()` when a record does not exist, and the nearest `not-found.tsx` renders with a 404 status. Getting the status right matters: an SPA that shows "Not found" with HTTP 200 is a *soft 404* that search engines may index. Error boundaries do not catch errors in event handlers or asynchronous callbacks; handle those where they occur.

**Try it:** Add `error.tsx` to a nested segment and throw from its page. Confirm the parent layout stays interactive. Then request a missing ID and check the status with `curl -sI`. In React DevTools, use the error boundary toggle to trigger the fallback without changing code.

**Resources**
- [Next.js: Error handling](https://nextjs.org/docs/app/getting-started/error-handling)
- [Next.js: error.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [React Router: Error boundaries](https://reactrouter.com/how-to/error-boundary)

### Route protection

There are three places to check access, and they provide different guarantees.

**1. A request interceptor** runs before rendering: `proxy.ts` in Next.js 16 (formerly `middleware.ts`), middleware in React Router, hooks in SvelteKit. It is the right place for a fast, optimistic redirect based on the session cookie.

```ts
// proxy.ts
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (!request.cookies.has('session')) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
}

export const config = { matcher: ['/dashboard/:path*'] };
```

It runs on every matched request, including prefetches, so keep it to reading and verifying the cookie; no database calls.

**2. The page or loader** checks the session and redirects or renders a 403.

**3. The data layer** is where security actually lives. Every function that reads or writes protected data verifies the session and the user's permission itself. Next.js recommends a *data access layer*: a server-only module where `verifySession()` (memoised with React's `cache`) is called by every data function, and which returns only the fields the UI needs.

The rule: a redirect is UX, an authorisation check next to the data is security. Client-side guards (`if (!user) return <Navigate to="/login" />`) only stop honest users; the JavaScript and API are still reachable. Specific traps:

- A layout check does not re-run on client navigation between its child pages, and it does not stop child segments or server actions from executing.
- Server actions and route handlers are endpoints. A matcher that skips a path also skips the actions posted to it.
- Validate the `next` redirect target is a same-origin path, or you have built an open redirect.
- Return 401 for "not signed in" and 403 for "signed in, not allowed"; do not leak whether a resource exists if that is sensitive.

**Try it:** Protect a `/dashboard` route with a proxy redirect only. Then call the server action or API route behind it directly with `curl`, without a cookie, and observe that it succeeds. Add the check to the data layer and repeat.

**Resources**
- [Next.js: Authentication](https://nextjs.org/docs/app/guides/authentication)
- [Next.js: proxy.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [React Router: Middleware](https://reactrouter.com/how-to/middleware)

### Next.js

Next.js is the most widely deployed React meta-framework. The App Router (the `app/` directory) is built on Server Components: pages and layouts are Server Components by default, data is fetched with `async`/`await` inside them, mutations use Server Actions, and UI streams through Suspense. As of late 2026 the current line is Next.js 16, with Turbopack as the default bundler.

A minimal data-driven page:

```tsx
// app/posts/page.tsx
import Link from 'next/link';

export default async function Posts() {
  const posts = await getPosts();
  return (
    <ul>
      {posts.map((p) => (
        <li key={p.id}><Link href={`/posts/${p.slug}`}>{p.title}</Link></li>
      ))}
    </ul>
  );
}
```

What you need to be productive:

- **File conventions**: `page`, `layout`, `loading`, `error`, `not-found`, `route`, plus `proxy.ts` at the root.
- **Async request APIs**: `params`, `searchParams`, `cookies()`, and `headers()` are promises.
- **Built-ins that do real work**: `next/image`, `next/font`, `next/link` (prefetching), and the Metadata API. See *Framework image and font optimisation*.
- **Caching**: `fetch` is uncached by default. With `cacheComponents: true` you mark cacheable work with `"use cache"` and routes are partially prerendered. See *Partial prerendering* and *Caching layers*.
- **Deployment**: Vercel is the zero-config path; a Node.js server or container also works (see *Self-hosting and deployment targets*). `output: 'export'` produces static files only and disables every feature that needs a server.

Read the `next build` output. It lists every route with its rendering mode and size, and it is the quickest way to catch a page that became dynamic by accident. The Pages Router (`pages/`, `getServerSideProps`) is still supported and you will meet it in older codebases, but new work uses the App Router.

**Try it:** Run `npx create-next-app@latest`, add a dynamic route with `generateStaticParams`, a form with a Server Action, and a `loading.tsx`. Run `next build`, read the route table, and deploy it.

**Resources**
- [Next.js: App Router documentation](https://nextjs.org/docs/app)
- [Next.js Learn: Dashboard app course](https://nextjs.org/learn/dashboard-app)
- [Next.js: Deploying](https://nextjs.org/docs/app/getting-started/deploying)

### Caching layers

A meta-framework can cache at several levels, and "why is this stale?" is only answerable if you know which level served the response. Next.js is the reference example. Its long-standing model has four caches:

| Cache | Stores | Lives | Invalidate with |
| --- | --- | --- | --- |
| Request memoisation | Results of identical `fetch` or `cache()` calls | One server render | Nothing; it ends with the request |
| Data cache | Results of `fetch` and cached functions | Across requests and deployments | `revalidateTag`, `revalidatePath`, time |
| Full route cache | Rendered HTML and RSC payload of static routes | Until revalidated or redeployed | Revalidating its data, or a deploy |
| Client router cache | RSC payloads of visited and prefetched routes | The browser session, with time limits | `router.refresh()`, a server action that revalidates |

Since Next.js 15, `fetch` is not cached unless you opt in. Next.js 16 adds **Cache Components** (`cacheComponents: true`), which replaces route-level switches with an explicit directive:

```tsx
import { cacheLife, cacheTag } from 'next/cache';

export async function getProducts() {
  'use cache';
  cacheLife('hours');
  cacheTag('products');
  return db.product.findMany();
}
```

Arguments and captured values become part of the cache key. Cached output joins the prerendered shell (see *Partial prerendering*).

Invalidation has two flavours. `revalidateTag('products', 'max')` marks entries stale and serves the old value while refreshing in the background: right for a CMS webhook. `updateTag('products')` expires immediately so the user who just made a change sees it: right inside a Server Action, and only allowed there. `revalidatePath` is the blunt instrument.

Around the framework sit the CDN and the browser's HTTP cache, each with their own rules. Debug from the outside in: response headers first, then the framework. And remember the default in-memory cache is per server instance, so on serverless it rarely survives between requests unless you configure a shared handler.

**Try it:** Cache a function that returns the current time with `cacheLife('minutes')` and a tag. Add a button whose Server Action calls `updateTag`. Reload to see the frozen time, click the button, and see it change. Swap in `revalidateTag` and note that the first reload still shows the old value.

**Resources**
- [Next.js: Caching](https://nextjs.org/docs/app/getting-started/caching)
- [Next.js: Revalidating](https://nextjs.org/docs/app/getting-started/revalidating)
- [Next.js: Caching and revalidating (previous model)](https://nextjs.org/docs/app/guides/caching-without-cache-components)

### An alternative

Building the same small app in a second framework is the fastest way to separate "how the web works" from "how Next.js does it". The serious alternatives each make a different bet.

- **React Router (framework mode)** is the continuation of Remix; v8 was released in June 2026. Routes are modules that export a `loader`, an `action`, and a component, and mutations are form posts that revalidate loaders automatically. It leans on web standards (`Request`, `Response`, `FormData`), has stable middleware, and runs on Vite. RSC support exists but is still marked unstable.
- **TanStack Start** is built on TanStack Router and Vite. Its distinguishing feature is end-to-end type safety: route params, search params, and loader data are fully inferred, and `createServerFn` gives typed RPC. It is client-first with SSR and streaming. Its docs currently describe it as a release candidate with a stable API.
- **Astro** is HTML-first with islands; covered in the next entry.
- **SvelteKit** pairs Svelte's compiler (no virtual DOM, small bundles) with `+page.server.ts` load functions, form actions, and deployment adapters.
- **Nuxt** is Vue's meta-framework: file routing, auto-imports, `useFetch` and `useAsyncData`, and the Nitro server engine that deploys almost anywhere.

A React Router route module, for comparison with a Next.js page:

```tsx
import type { Route } from './+types/contact';
import { Form, redirect } from 'react-router';

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  await saveMessage(String(form.get('message')));
  return redirect('/thanks');
}

export default function Contact() {
  return (
    <Form method="post">
      <textarea name="message" required />
      <button>Send</button>
    </Form>
  );
}
```

When comparing, look at the same things each time: where data loads, how mutations invalidate it, what is cached and where, how much JavaScript ships, and where it can be deployed.

**Try it:** Rebuild one feature you already built in Next.js (a list page, a detail page, and a create form) in React Router framework mode with `npx create-react-router@latest`. Write down three things that were easier and three that were harder.

**Resources**
- [React Router: Framework mode installation](https://reactrouter.com/start/framework/installation)
- [TanStack Start: Overview](https://tanstack.com/start/latest/docs/framework/react/overview)
- [SvelteKit: Introduction](https://svelte.dev/docs/kit/introduction)

### Content sites

A content site (documentation, blog, marketing, portfolio) is mostly text and images that are the same for every visitor and change when someone publishes. For that shape, an app framework is the wrong default. Rendering a blog post with React in Next.js still ships React, the router, and hydration code for content that never changes on the client. Astro ships zero JavaScript unless you add an island.

What a content-focused framework gives you:

- **Zero-JS by default**, which makes good Core Web Vitals the starting point rather than a project.
- **Content collections**: Markdown, MDX, or CMS entries with a schema, so a missing `title` or malformed date fails the build instead of rendering `undefined`.
- **Framework-agnostic islands**: use React, Svelte, Vue, or plain web components for the few interactive parts.
- **Cheap, robust hosting**: static files on any CDN.
- **Cross-document view transitions**, so a multi-page site can still animate between pages.

```astro
---
import { getCollection } from 'astro:content';
const posts = await getCollection('blog');
---
<ul>
  {posts.map((post) => <li><a href={`/blog/${post.id}/`}>{post.data.title}</a></li>)}
</ul>
```

Other good tools in this space: Eleventy (very simple, template-based), Hugo (extremely fast builds for huge sites), VitePress and Starlight (documentation).

The line to watch is interactivity and personalisation. Once most pages have logged-in state, shared client state across the page, or app-like flows, islands turn into a tangle and an app framework fits better. Many organisations sensibly run both: Astro for the marketing site and docs, an app framework for the product at `app.example.com`. Astro can server-render on demand and has server islands for the occasional dynamic fragment, so "we need one personalised component" is not by itself a reason to leave.

**Try it:** Build a three-page blog in Astro with a content collection and one interactive island. Run `astro build` and inspect `dist/`: count the JavaScript files and bytes. Compare with a `create-next-app` build of the same content.

**Resources**
- [Astro: Why Astro?](https://docs.astro.build/en/concepts/why-astro/)
- [Astro: Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Eleventy: Getting started](https://www.11ty.dev/docs/)

### Framework-free option

A meta-framework buys you server rendering, routing conventions, and a deployment story, and charges you in complexity: a server to run, caching semantics to learn, and a larger upgrade surface. Many applications do not need the purchase.

Vite plus a client router is enough when:

- The app lives behind a login, so SEO and link previews do not matter.
- Users are on reasonable devices and return often, so the bundle is cached.
- You already have a separate API (another team's backend, a BaaS such as Supabase or Firebase).
- You want to deploy static files to a bucket and never think about server capacity.
- The app is embedded elsewhere: an Electron or Tauri shell, a browser extension, a widget inside another site.

A solid setup is Vite, React, TanStack Router or React Router in data mode (both give loaders, nested routes, and code splitting without a server), and TanStack Query for server state.

```ts
import { createBrowserRouter } from 'react-router';

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('./routes/root'),
    children: [
      { index: true, lazy: () => import('./routes/home') },
      { path: 'projects/:id', lazy: () => import('./routes/project') },
    ],
  },
]);
```

What you take on yourself: the server fallback to `index.html`, a sensible static shell, metadata, error tracking, and environment configuration. What you give up: content in the initial HTML, streaming, and server-only code.

Signals that you have outgrown it: public pages that need to rank or unfurl, an LCP problem that is really a "content is behind JavaScript" problem, or a growing pile of hand-written endpoints whose only client is this UI. The path up is gentle. React Router's framework mode has an SPA mode and can prerender selected routes, so you can adopt server rendering route by route rather than rewriting.

**Try it:** Build a small authenticated dashboard with Vite, a router with loaders, and TanStack Query against a public API. Deploy `dist/` to a static host with a rewrite rule. List what you would have got from a meta-framework that you actually missed.

**Resources**
- [Vite: Getting started](https://vite.dev/guide/)
- [React Router: Picking a mode](https://reactrouter.com/start/modes)
- [Vite: Deploying a static site](https://vite.dev/guide/static-deploy)

### Environment variables

Environment variables configure an app per environment without code changes. In a frontend build they come in two kinds that must never be confused: **server secrets** (database URLs, API keys, signing secrets) and **public client config** (the analytics ID, the public API base URL).

Build tools enforce the split with a prefix. Only variables with the prefix are exposed to browser code:

| Tool | Public prefix | Access |
| --- | --- | --- |
| Next.js | `NEXT_PUBLIC_` | `process.env.NEXT_PUBLIC_X` |
| Vite | `VITE_` | `import.meta.env.VITE_X` |
| Astro | `PUBLIC_` | `import.meta.env.PUBLIC_X` |

The mechanism is textual replacement at **build time**: the bundler substitutes the literal value into the JavaScript. Consequences:

- A public variable is readable by anyone who opens DevTools. Putting a secret behind the public prefix publishes it, and removing it later does not un-leak it; rotate the key.
- Changing a public variable requires a rebuild. One Docker image promoted from staging to production carries staging's public values unless you inject runtime config another way (a server-rendered `<script>` with config, or an endpoint).
- Dynamic access like `process.env[name]` is not replaced and yields `undefined` in the browser.

Unprefixed variables are available only to server code: Server Components, route handlers, loaders, actions. Add `import 'server-only'` to modules that read secrets so an accidental client import fails the build.

Practices worth adopting: keep `.env.local` out of git and commit a `.env.example`; validate variables at startup with a schema so a missing one fails fast with a clear message; and remember that "public" keys still need server-side protection (domain restrictions, row-level security).

```ts
import * as z from 'zod';

export const env = z.object({
  DATABASE_URL: z.url(),
  SESSION_SECRET: z.string().min(32),
}).parse(process.env);
```

**Try it:** Add `SECRET_KEY=abc123` and `NEXT_PUBLIC_SITE=demo` to `.env.local`. Log both from a Client Component and build. Search the files in `.next/static` for each value and see which one is there.

**Resources**
- [Next.js: Environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Vite: Env variables and modes](https://vite.dev/guide/env-and-mode)

### Backend for frontend

A backend for frontend (BFF) is a thin server layer owned by the UI team that sits between the browser and the real backend services. It exists to give one particular frontend exactly the data it needs in the shape it needs.

What it does:

- **Aggregates**: one request from the browser fans out to several services on a fast internal network and returns one response.
- **Shapes**: returns the six fields the card needs rather than a 200-field record, with names the UI uses.
- **Hides secrets**: holds the third-party API key and the service credentials; the browser never sees them.
- **Handles the session**: turns an `HttpOnly` cookie into whatever token the downstream services want, so tokens never live in JavaScript.
- **Sets cache headers** suited to the UI.

In Next.js this is a route handler:

```ts
// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const [profile, invoices] = await Promise.all([
    billing.getProfile(session.userId),
    billing.getInvoices(session.userId, { limit: 5 }),
  ]);

  return NextResponse.json({
    name: profile.displayName,
    invoices: invoices.map((i) => ({ id: i.id, total: i.amountDue, due: i.dueDate })),
  });
}
```

With Server Components, the component tree itself often plays this role: a Server Component calls the services directly and passes shaped props down, with no HTTP endpoint at all. You still write route handlers for things other clients call: webhooks, mobile apps, OAuth callbacks, file downloads, and client-side polling.

Mistakes: calling your own route handler from a Server Component (an extra network hop; call the function directly), letting business rules accumulate in the BFF until it is a second backend, returning raw upstream objects (which leaks fields and couples the UI to another team's schema), and skipping validation because "only our UI calls it". Validate input and check authorisation as you would for any public API.

**Try it:** Pick a page that makes three client-side API calls. Write one route handler that makes them in parallel on the server and returns a single minimal JSON object. Compare the request count and transferred bytes in the Network panel before and after.

**Resources**
- [Next.js: Backend for Frontend guide](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [Next.js: Route handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Sam Newman: Backends for Frontends pattern](https://samnewman.io/patterns/architectural/bff/)

### Framework image and font optimisation

Images and fonts are the usual causes of slow LCP and layout shift, and the fixes are well known but tedious by hand. Framework components apply them for you.

**Images.** `next/image` renders an `<img>` and does the following:

```tsx
import Image from 'next/image';
import hero from './hero.jpg';

<Image src={hero} alt="Workshop interior" sizes="(min-width: 60rem) 50vw, 100vw" preload placeholder="blur" />
```

- **Reserves space.** It requires `width` and `height` (read automatically from a static import) or `fill`, so the browser knows the aspect ratio before the file loads and nothing shifts.
- **Generates `srcset`.** Each width is produced on demand by the image optimiser at `/_next/image`, resized and converted to WebP or AVIF according to the request's `Accept` header, then cached.
- **Lazy-loads by default.** For the LCP image, opt out: `preload` adds a `<link rel="preload">` (it replaced `priority`, which is deprecated in Next.js 16), or use `loading="eager"` with `fetchPriority="high"`.

What it cannot do is know your layout. Without an accurate `sizes`, the browser assumes the image is as wide as the viewport and downloads a file far larger than needed. Remote images must be allowed in `images.remotePatterns`, which stops your optimiser being used as an open proxy. The optimiser is a running service: it costs CPU on your server or money on a platform, and it does not exist in a static export (use a custom `loader` pointing at an image CDN). Astro's `<Image />` and `<Picture />` do the same work at build time for local images.

**Fonts.** `next/font` downloads font files at build time and serves them from your own origin, so there is no request to a third party. It subsets, preloads the files a route uses, and generates a fallback font with adjusted metrics (`size-adjust` and ascent overrides) so that the swap from fallback to web font barely moves the text.

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={inter.variable}><body>{children}</body></html>;
}
```

Call the loader once at module scope and share the result; each call creates a separate font instance. Prefer a variable font over several static weights. Astro 6 has an equivalent Fonts API.

**Try it:** Put a large hero photo on a page with a plain `<img>` and no dimensions, and record LCP and CLS in Lighthouse. Replace it with the framework image component with correct `sizes` and preloading. Compare the metrics, then check in the Network panel which file width and format were actually downloaded on a phone-sized viewport.

**Resources**
- [Next.js: Image optimization](https://nextjs.org/docs/app/getting-started/images)
- [Next.js: Font optimization](https://nextjs.org/docs/app/getting-started/fonts)
- [Astro: Images](https://docs.astro.build/en/guides/images/)

### Self-hosting and deployment targets

A framework app can be deployed in three shapes. A **managed platform** (Vercel, Netlify, Cloudflare) wires up the CDN, functions, caches, and image service for you. A **static export** is a folder of files with no server features. In between is **self-hosting**: you run the framework's server yourself, as a Node.js process (`next build && next start`) or in a container.

For containers, `output: 'standalone'` in `next.config.ts` traces the files the server needs and writes a minimal `server.js` bundle:

```dockerfile
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

The static and public folders are not included in the standalone output, which is the most common reason a self-hosted app loads with no CSS.

Everything works when self-hosted, but you now own what the platform did:

- **A reverse proxy** for TLS, compression, and HTTP/2. It must not buffer, or streaming and partial prerendering degrade to one late response (nginx: `X-Accel-Buffering: no`).
- **Shared caches.** The default cache is in memory and on local disk, per instance. With several replicas, each has different cached pages and an invalidation reaches only one. Configure a shared cache handler (Redis or similar).
- **Consistency across instances.** During a rolling deploy, old and new versions serve traffic together. Set a deployment ID so clients detect version skew, and set the Server Actions encryption key explicitly so every instance can decrypt action payloads.
- **Image optimisation load.** Resizing uses CPU and memory on your server; put a CDN in front or use an external loader.
- **A CDN** for static assets and cacheable HTML, respecting the `Cache-Control` headers the framework emits.
- **Operations.** Health checks, graceful shutdown, log collection, error tracking and tracing (`instrumentation.ts`), runtime environment variables, and capacity planning.

Other frameworks make the target explicit through adapters: SvelteKit and Astro have a Node adapter among others, and React Router ships server templates for Node and containers. Next.js exposes an adapter API for platforms as well.

**Try it:** Build a Next.js app with `output: 'standalone'`, write the Dockerfile above with a builder stage, and run two containers behind nginx. Revalidate a cached page through one instance and observe that the other still serves the old version.

**Resources**
- [Next.js: Self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js: Deploying](https://nextjs.org/docs/app/getting-started/deploying)
- [React Router: Deploying](https://reactrouter.com/start/framework/deploying)

### Crawlability

Google processes a page in phases: it **crawls** the URL (fetching the HTML and extracting links from `<a href>` attributes), queues the page for **rendering** in a headless Chromium, and then **indexes** the rendered result. Rendering JavaScript is real but deferred. The page can wait in the render queue, so content that exists only after JavaScript runs is indexed later than content in the initial HTML.

What that means for a client-rendered app:

- Googlebot does not click, scroll, or type. Content behind a "load more" button or revealed on scroll is not seen. Links must be real `<a href="/path">` elements; a `<div onClick>` is not a link.
- Use the History API for routes, not `#fragments`. Google treats fragment URLs as the same page.
- A missing page that returns HTTP 200 with "Not found" text is a soft 404. Either have the server return a real 404 or add a `noindex` robots meta tag.
- If JavaScript fails or times out during rendering, the page is indexed empty.
- Other consumers are stricter than Google. Social link unfurlers (Slack, X, LinkedIn, iMessage) read only the initial HTML, and many AI and smaller search crawlers do not execute JavaScript at all.

This is why server rendering or prerendering helps: titles, descriptions, canonical tags, structured data, and content are in the first response, visible to every crawler without waiting for a render queue. Google's own guidance still calls server-side or pre-rendering "a great idea" for both users and crawlers. *Dynamic rendering* (serving prerendered HTML only to bots) is described by Google as a workaround, not a long-term solution.

Performance is part of crawlability: slow responses reduce how much of a large site gets crawled, and Core Web Vitals feed ranking.

**Try it:** Take a client-rendered page and run `curl -s <url> | grep -i "<title>"`, then search the output for a sentence from the page body. Then use URL Inspection in Search Console (or the Rich Results Test) to view the rendered HTML Google sees and compare the two.

**Resources**
- [Google Search Central: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google Search Central: Fix Search-related JavaScript problems](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript)

### Metadata

Metadata lives in `<head>` and tells search engines and social platforms what a page is. Each route needs its own.

- **`<title>`**: unique per page, specific first, brand last (`Blue Widget – Acme`). It is the tab label, the bookmark name, and usually the search result headline.
- **`<meta name="description">`**: a sentence or two that may be used as the snippet. It does not affect ranking but affects whether people click.
- **`<link rel="canonical">`**: the one preferred URL when several show the same content (tracking parameters, sort orders, trailing slashes). Use an absolute URL. A wrong canonical can remove a page from results.
- **Open Graph**: `og:title`, `og:description`, `og:image`, `og:url`, `og:type` control link previews. Images should be absolute URLs, around 1200×630. Add `twitter:card` with `summary_large_image` for large previews on X.
- **`<meta name="robots" content="noindex">`** for pages that should not appear in search.

In Next.js you export metadata from a layout or page, and the framework merges it down the route tree:

```tsx
import type { Metadata } from 'next';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { title: post.title, images: [post.coverUrl] },
  };
}
```

Set `metadataBase` in the root layout so relative URLs resolve, and use `title: { template: '%s – Acme', default: 'Acme' }` for consistent suffixes. The `getPost` call is deduplicated with the page's own call if you wrap it in React's `cache()`. Other frameworks have equivalents: a `meta` export in React Router, `<svelte:head>` in SvelteKit, `useSeoMeta` in Nuxt.

The essential point: metadata must be in the server HTML. Unfurlers do not run JavaScript, so a title set in `useEffect` gives every shared link the same generic preview.

**Try it:** Add `generateMetadata` to a dynamic route. Verify with `curl -s <url> | grep -E "og:|canonical|<title>"`. Then paste a deployed URL into a chat app and check the preview.

**Resources**
- [Next.js: Metadata and OG images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [The Open Graph protocol](https://ogp.me/)
- [Google Search Central: Consolidate duplicate URLs with canonicals](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

### Sitemaps and robots

A **sitemap** is an XML file listing the URLs you want indexed. It helps discovery on large sites, new sites with few inbound links, and pages that are poorly linked internally. It is a hint, not a command. Include only canonical, indexable URLs that return 200. `lastmod` is used by Google if it is consistently accurate; `priority` and `changefreq` are ignored. A single file holds at most 50,000 URLs or 50 MB uncompressed; beyond that, split it and use a sitemap index.

**`robots.txt`** sits at the root of the origin and tells crawlers which paths they may fetch.

```text
User-agent: *
Disallow: /admin/
Disallow: /api/
Allow: /

Sitemap: https://example.com/sitemap.xml
```

The distinction that trips people up: `robots.txt` controls **crawling**, not **indexing**. A disallowed URL can still appear in results (with no snippet) if other sites link to it. To keep a page out of the index, allow crawling and serve a `noindex` meta tag or `X-Robots-Tag` header; if the crawler cannot fetch the page, it never sees the `noindex`. And `robots.txt` is public and advisory, so it is not access control.

Generate both from your data rather than maintaining them by hand. In Next.js:

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  return [
    { url: 'https://example.com', lastModified: new Date() },
    ...posts.map((p) => ({
      url: `https://example.com/blog/${p.slug}`,
      lastModified: p.updatedAt,
    })),
  ];
}
```

`app/robots.ts` works the same way. Astro has the `@astrojs/sitemap` integration. A common production accident is shipping a staging `Disallow: /` to production, or leaving staging crawlable; generate the file from the environment and protect staging with authentication.

**Try it:** Add `app/sitemap.ts` and `app/robots.ts` to a Next.js app, open `/sitemap.xml` and `/robots.txt`, and validate the output. Then submit the sitemap in Search Console for a site you own.

**Resources**
- [Google Search Central: Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google Search Central: Introduction to robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Next.js: sitemap.xml file convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)

### Structured data

Structured data describes a page's content in a machine-readable vocabulary so search engines can understand it and show **rich results**: review stars, prices, breadcrumbs, recipe cards, event dates. The vocabulary is Schema.org and the recommended format is JSON-LD, a `<script type="application/ld+json">` block that is separate from your markup.

```tsx
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.imageUrl,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <h1>{product.name}</h1>
    </>
  );
}
```

The `replace` matters. `JSON.stringify` does not escape `<`, so a product description containing `</script>` would close the tag and inject HTML. Escaping `<` as `<` prevents that.

Rules that decide whether it works:

- Mark up only what is visible on the page. Describing content users cannot see violates Google's guidelines and can earn a manual action.
- Each rich result type has required and recommended properties; missing a required one disqualifies the page for that feature.
- Valid markup makes a page *eligible* for rich results. It does not guarantee them, and it is not a direct ranking boost.
- Keep it in the server-rendered HTML and generate it from the same data as the page so the two cannot drift.
- Useful types: `Article`, `Product`, `BreadcrumbList`, `Organization`, `Event`, `Recipe`, `VideoObject`. Google has reduced the visibility of some types (FAQ and How-to) over time, so check the current search gallery before investing.

For type safety, the `schema-dts` package provides TypeScript types for the Schema.org vocabulary.

**Try it:** Add `Article` JSON-LD to a blog post page, deploy or tunnel it, and run it through the Rich Results Test. Remove a required property and read the error. Then put `</script>` in the title and confirm your escaping holds.

**Resources**
- [Google Search Central: Introduction to structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Next.js: JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld)
- [Schema.org: Getting started](https://schema.org/docs/gs.html)

### Same app, three ways

Build one small blog (an index of posts, a post page, and one interactive element such as a like button) three times, changing only the rendering strategy, then measure. The point is to feel the trade-offs rather than read about them.

Keep the variables controlled: the same content source (a folder of Markdown or a small JSON API with an artificial 300 ms delay), the same styles, the same components where possible.

1. **CSR**: Vite, React, and a client router. Posts are fetched in the browser.
2. **SSR**: the same UI rendered per request. Use Next.js with a request-time data read, or React Router framework mode with loaders.
3. **Static**: prerender every post at build time (`generateStaticParams`, React Router's `prerender` option, or Astro).

Deploy all three, or at minimum run production builds locally. Then for each, record:

| Measure | How |
| --- | --- |
| TTFB, FCP, LCP, TBT | Lighthouse, mobile preset, three runs, take the median |
| HTML content without JS | `curl -s` and View Source |
| JavaScript transferred | Network panel, filter JS, read the footer total |
| Behaviour with JS disabled | Reload and try the links |
| Link preview | Paste the URL into a chat app |

Expect CSR to have the fastest TTFB and the slowest LCP, SSR the reverse on TTFB with a better LCP, and static to win both. Expect Total Blocking Time to be similar across all three if they ship the same JavaScript, which is the lesson about hydration. Then try to break the expectations: add streaming to the SSR version, add a CDN cache header, or convert the static version to Astro with the like button as the only island, and measure again.

Write the results up in a short table with a paragraph per strategy on when you would choose it. That document is a better interview artefact than the code.

**Try it:** Start with the CSR version and get its Lighthouse numbers before writing the others, so you have a baseline. Make a prediction for each metric before each subsequent measurement and note where you were wrong.

**Resources**
- [Chrome for Developers: Lighthouse overview](https://developer.chrome.com/docs/lighthouse/overview)
- [web.dev: Web Vitals](https://web.dev/articles/vitals)
- [React Router: Pre-rendering](https://reactrouter.com/how-to/pre-rendering)

### Full-stack app

This project proves you can ship a complete product: sign-up, persistent data, server rendering, mutations, and a production deployment. Choose something small with real data relationships, such as a bookmark manager, a habit tracker, or a team task board.

A sensible stack: Next.js App Router, Postgres (a hosted provider such as Neon or Supabase), an ORM (Drizzle or Prisma), an auth library (Better Auth, Auth.js, or Clerk), and Zod for validation. Do not write your own password handling.

Build it in this order, since each step depends on the one before:

1. **Schema and data layer.** Define tables and migrations. Write a server-only data access module; every function takes or derives the current user and filters by it.
2. **Auth.** Sign-up, sign-in, sign-out, and a session cookie that is `HttpOnly`, `Secure`, and `SameSite=Lax`.
3. **Read paths.** Server Components that call the data layer. Add `loading.tsx` and Suspense where a query is slow.
4. **Mutations.** Server Actions that validate with Zod, check the session, write, and invalidate. Add `useActionState` for errors and `useOptimistic` for one interaction.
5. **Edges.** `error.tsx`, `not-found.tsx`, empty states, a proxy redirect for signed-out users, metadata.
6. **Deploy.** Environment variables in the host, migrations as a deploy step, a preview deployment per pull request.

Acceptance checks that separate a demo from an app:

- User A cannot read or modify user B's data by changing an ID in the URL or replaying a request with different arguments.
- Every form works with a slow network and shows pending and error states.
- A database failure produces a useful error page, not a blank screen.
- No secret appears in the client bundle.
- A Playwright test covers sign-in, create, edit, and delete.

**Try it:** Before building features, write the authorisation test: create two users, have one create a record, and assert the other gets a 404 or 403 when requesting it and when calling the update action. Keep that test green for the rest of the project.

**Resources**
- [Next.js Learn: Dashboard app course](https://nextjs.org/learn/dashboard-app)
- [Next.js: Authentication](https://nextjs.org/docs/app/guides/authentication)
- [Next.js: Mutating data](https://nextjs.org/docs/app/getting-started/mutating-data)
