# Rendering, Routing, and Meta-frameworks: Practice test

### 1. You open View Source on a page and the `<body>` contains only this. What does it tell you?

```html
<div id="root"></div>
<script type="module" src="/assets/index-9c1e.js"></script>
```

- [ ] The page is statically generated and the content is cached on a CDN
- [x] The page is client-side rendered; content appears only after the script downloads and runs
- [ ] The page uses streaming SSR and the content has not arrived yet
- [ ] The page uses React Server Components with a client boundary at the root

> View Source shows the HTML the server sent. An empty root element means the server sent no content, so the browser must download, parse, and execute the bundle before anything renders. A streamed page would still show its shell and fallbacks in the source, and a static or RSC page would contain the rendered content.

### 2. Compared with client-side rendering of the same page, per-request server-side rendering typically changes the metrics how?

- [ ] Faster TTFB, slower LCP, and no hydration cost
- [ ] Faster TTFB, faster LCP, and a smaller JavaScript bundle
- [x] Slower TTFB, faster FCP and LCP, and the same JavaScript still has to load and hydrate
- [ ] Slower TTFB, slower LCP, but faster time to interactive

> The server has to fetch data and render before responding, so the first byte arrives later. But that response already contains content, so paint happens without waiting for the bundle. SSR alone does not reduce the JavaScript: the same code downloads and hydrates, so interactivity is not improved.

### 3. A statically generated page uses time-based revalidation of 60 seconds. It was generated at 12:00:00. Requests arrive at 12:00:30, 12:01:30, and 12:01:40. Which requests receive the HTML generated at 12:00:00?

- [ ] Only the first
- [ ] All three
- [ ] None; each request regenerates the page
- [x] The first and the second; the third gets the regenerated page

> Revalidation is stale-while-revalidate. The 12:00:30 request is inside the window and gets the cached page. The 12:01:30 request is outside the window, but it is still served the stale page immediately while regeneration starts in the background. Once that finishes, the 12:01:40 request gets the new page. People often expect the first request after expiry to be the one that sees fresh content.

### 4. This component is server-rendered and then hydrated. What happens?

```jsx
function Greeting() {
  const hour = new Date().getHours();
  return <p>{hour < 12 ? 'Good morning' : 'Good afternoon'}</p>;
}
```

- [ ] It always works, because React re-renders on the client anyway
- [ ] It throws on the server because `Date` is not available there
- [x] It can produce a hydration mismatch when the server's clock or time zone gives a different branch from the user's
- [ ] It works as long as the component is marked `"use client"`

> Hydration expects the client's first render to match the server's HTML. A server in UTC and a user in another time zone can land on different sides of the comparison, so the text differs and React reports a mismatch, then re-renders that subtree on the client. `"use client"` does not help: Client Components are still rendered on the server for the initial HTML. Render a neutral value first and set the greeting in an effect, or compute it from a time zone the server knows.

### 5. Explain what hydration is and why a server-rendered page can look ready but not respond to clicks.

> Hydration is the client-side step that turns server-rendered HTML into a running app: the framework downloads the component code, re-runs the components to build its internal tree, matches that against the existing DOM, and attaches event handlers and state. Until it finishes, the HTML is visible because the browser painted it as soon as it arrived, but no handlers are attached, so buttons do nothing. The length of this gap depends on how much JavaScript must download and execute, which is why it is worst on slow devices. You shorten it by shipping less client code (Server Components, islands, code splitting), by streaming with Suspense so boundaries hydrate independently, and by making critical controls work without JavaScript, using real links and real forms.

### 6. What does the user see first when this page is requested with streaming SSR, and what arrives later?

```jsx
export default function Page() {
  return (
    <main>
      <h1>Order #1042</h1>
      <Suspense fallback={<p>Loading tracking…</p>}>
        <Tracking />   {/* awaits a 3-second API call */}
      </Suspense>
    </main>
  );
}
```

- [ ] Nothing for three seconds, then the full page
- [x] The heading and "Loading tracking…" immediately, then the tracking content replaces the fallback in the same response
- [ ] The heading immediately; the tracking content is fetched by a separate client request after hydration
- [ ] The fallback only; the heading waits for the boundary to resolve

> The shell (everything outside the suspended boundary, plus the fallback) is flushed straight away. When `Tracking` resolves, its HTML is appended to the same open response with a small inline script that swaps it into place. No second request is made and the swap does not wait for the app's JavaScript.

### 7. This Next.js page is built with `cacheComponents: true`. What does a CDN-served request receive first, and what happens next?

```tsx
export default function Page() {
  return (
    <>
      <h1>Store</h1>
      <FeaturedProducts />            {/* async, marked "use cache" */}
      <Suspense fallback={<p>Loading cart…</p>}>
        <Cart />                      {/* async, reads cookies() */}
      </Suspense>
    </>
  );
}
```

- [ ] Only the heading; both async components are rendered per request and streamed
- [ ] Nothing until the cart is ready, because reading cookies makes the whole route dynamic
- [x] A prerendered shell containing the heading, the featured products, and "Loading cart…"; the cart is then rendered on the server and streamed into the same response
- [ ] The full page including the cart, prerendered at build time for an anonymous user

> With partial prerendering the build renders everything it can: static markup, cached components, and Suspense fallbacks become the static shell. The component that reads cookies cannot be prerendered, so its fallback goes in the shell and its real output is streamed at request time. In the older model a cookie read made the entire route dynamic, which is the misconception behind the second option.

### 8. Which statement about `"use client"` is correct?

- [ ] Components in a `"use client"` file are not rendered on the server
- [ ] Every component that uses state needs its own `"use client"` directive
- [ ] It makes the component's props available to Server Components
- [x] It marks a module as an entry point into the client bundle, and everything that module imports becomes client code

> The directive defines a boundary in the module graph. The file and its transitive imports are bundled for the browser. Components inside it are still server-rendered to HTML for the first load and then hydrated. You only need the directive at the boundary files, not in every interactive component beneath them.

### 9. Why does this fail, and what are two ways to fix it?

```tsx
// app/page.tsx (Server Component)
import Button from './button'; // has "use client"

export default function Page() {
  function handleClick() {
    console.log('clicked');
  }
  return <Button onClick={handleClick}>Save</Button>;
}
```

> Props passed from a Server Component to a Client Component are serialised and sent over the network. A plain function cannot be serialised, so React rejects `onClick={handleClick}`. Fix one: move the handler into the Client Component (or into another Client Component that wraps the button), since event handlers belong on the client. Fix two: if the click should run server code, make it a Server Function by marking it with `"use server"` and making it `async`; Server Functions are the one kind of function that can cross the boundary because React passes a reference to them rather than the code.

### 10. A teammate writes this server action and says it is safe because the delete button is only rendered for admins. What is wrong?

```ts
'use server';

export async function deleteUser(id: string) {
  await db.user.delete({ where: { id } });
  revalidatePath('/admin/users');
}
```

- [ ] `revalidatePath` cannot be called from a server action
- [ ] Server actions cannot accept arguments other than `FormData`
- [x] The action is a public POST endpoint; anyone can invoke it with any `id` regardless of what the UI renders
- [ ] The action must be defined inside the component that uses it to be secure

> Every Server Function is reachable over HTTP. Hiding the button changes what honest users see, not what a request can do. The action must verify the session and check that the caller is an admin, and should validate `id`, before touching the database.

### 11. A function deployed to an edge runtime renders a page by making three sequential queries to a Postgres database in a single US region. A user in Australia finds it slower than the previous single-region Node.js deployment. Why?

- [ ] Edge runtimes have longer cold starts than Node.js servers
- [ ] Edge runtimes cannot stream responses
- [ ] The CDN is caching the database responses incorrectly
- [x] The function now runs near the user, so each of the three queries makes a long round trip to the distant database

> Moving compute to the edge shortens the user-to-function hop but lengthens every function-to-database hop. Three sequential queries pay that long round trip three times, where the regional server sat next to the database and paid it once for the whole response. Edge runtimes have very short cold starts and do support streaming. Put data-heavy rendering near the data, and use the edge for work that needs no origin access.

### 12. For each of these pages, choose a rendering strategy and justify it in a sentence: (a) a documentation page, (b) a product page showing live stock, (c) an account settings page, (d) a collaborative whiteboard.

> (a) Static generation, revalidated when docs are published: the content is identical for everyone and changes rarely, so serve it from a CDN. (b) A static or cached shell with the stock level as a streamed hole under Suspense or a client fetch: the description and images are shared, only one value needs to be fresh. (c) Server rendering per request (or a client-rendered page behind login): the content depends on the user's session and has no SEO value, so it must not be cached publicly. (d) Client-side rendering: it is a highly interactive application with real-time state and no need for indexable HTML; a server-rendered shell adds little. The general principle is to choose the most static option that meets each page's freshness and personalisation needs, per route rather than per app.

### 13. In this hand-written router, clicking a link updates the URL and the page. Pressing the browser's Back button changes the URL but the page content stays the same. What is missing?

```js
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a || a.origin !== location.origin) return;
  e.preventDefault();
  history.pushState({}, '', a.href);
  render(location.pathname);
});
```

- [ ] A call to `history.go()` after `pushState`
- [x] A `popstate` listener that calls `render`
- [ ] A `hashchange` listener that calls `render`
- [ ] `pushState` should be `replaceState`

> `pushState` does not fire any event, which is why the click handler renders manually. Back and Forward fire `popstate` on `window`, and nothing is listening for it, so the URL changes with no re-render. `hashchange` only fires for fragment changes. The handler should also ignore modified clicks (Ctrl, Cmd, middle button) so opening in a new tab still works.

### 14. In a Next.js App Router app, a user types into a search box that lives in `app/dashboard/layout.tsx`, then clicks a `<Link>` from `/dashboard/invoices` to `/dashboard/customers`. What happens to the text?

- [ ] It is cleared, because every navigation re-renders the whole route
- [ ] It is cleared, unless the layout is marked `"use client"`
- [x] It is kept, because a layout shared by both routes is preserved across the navigation
- [ ] It is kept only if the value is stored in the URL

> Layouts persist across navigations between their child segments: they are not re-rendered and their client state is retained. Only the segment that changed is replaced. The same behaviour is why an auth check placed only in a layout is not re-run when moving between child pages.

### 15. This Server Component takes about 900 ms. Each call takes 300 ms and none depends on another. Rewrite the data loading so it takes about 300 ms, and say when a sequential version would be justified.

```tsx
export default async function Dashboard() {
  const user = await getUser();
  const projects = await getProjects();
  const notifications = await getNotifications();
  return <View user={user} projects={projects} notifications={notifications} />;
}
```

> Each `await` pauses the function before the next call starts, so the requests run one after another. Start them all first and await them together:
>
> ```tsx
> const [user, projects, notifications] = await Promise.all([
>   getUser(),
>   getProjects(),
>   getNotifications(),
> ]);
> ```
>
> Sequential fetching is justified only when there is a real dependency, such as needing the user's team ID before fetching that team's projects; even then it is worth pushing the join into one query or one backend call. If one of the three is slow and not essential, another option is to not await it at the page level and render it in its own component under `<Suspense>` so it does not block the rest.

### 16. After a client-side navigation in a single-page app, which of these does the browser do for you automatically?

- [ ] Move keyboard focus to the top of the new page
- [ ] Announce the new page title to screen readers
- [ ] Restore the scroll position of nested scroll containers on Back
- [x] None of these; the router or your code must handle them

> A full document load resets focus, announces the title, and manages scroll. `history.pushState` does none of that. Focus stays on the clicked element (which may no longer exist), nothing is announced, and scroll handling is up to the router. Frameworks cover some of it, but you should verify with a keyboard and a screen reader.

### 17. A route is split with `React.lazy`, and its component fetches data in an effect on mount. Why is navigation to it slower than necessary, and what is the better structure?

- [ ] `React.lazy` disables prefetching, so the chunk is always fetched twice
- [x] The code must download before the component can mount and start its fetch, so code and data load in sequence; a route-level `lazy` with a loader lets the router fetch both in parallel
- [ ] Lazy components cannot use effects until a second render
- [ ] The Suspense fallback blocks the network until it has painted

> With `React.lazy` plus fetch-on-mount, the data request cannot begin until the chunk has arrived and the component has rendered: a waterfall of code, then data. When the route definition owns both the lazy import and the loader, the router knows about both at navigation time and starts them together.

### 18. In Next.js, `app/dashboard/error.tsx` exists. Which error does it NOT catch?

- [ ] An error thrown while rendering `app/dashboard/page.tsx`
- [ ] An error thrown while rendering `app/dashboard/settings/page.tsx`
- [x] An error thrown while rendering `app/dashboard/layout.tsx`
- [ ] An error thrown by a Server Component rendered inside `app/dashboard/page.tsx`

> The error boundary created by `error.tsx` is rendered inside the layout of the same segment, so it wraps the page and nested segments but not that layout. A layout error bubbles to the parent segment's boundary, and root layout errors are handled by `global-error.tsx`. Errors in nested pages bubble up to the nearest boundary, which is this one.

### 19. Your app redirects unauthenticated users to `/login` from `proxy.ts` for all `/dashboard` routes, and has no other checks. Describe two ways protected data could still be exposed, and where the checks should live.

> First, server actions and route handlers are separate entry points. An action is a POST to a route, and an API route may sit outside the matcher (it is common to exclude `/api`); either can be called directly with `curl` and will run without any session check. Second, the proxy check is usually optimistic: it confirms a cookie exists or verifies its signature but does not check that this user may access this particular record, so a signed-in user can read another user's data by changing an ID. A matcher change or moving a route can also silently drop coverage. The redirect is a UX convenience. Authorisation belongs in the data access layer: every function that reads or writes protected data verifies the session and the user's permission for that specific resource, and returns only the fields the caller is allowed to see. Server actions and route handlers call that layer, so the check cannot be skipped.

### 20. A Server Action updates a product and must make sure the user who made the edit sees the new value on the page they are redirected to. With Next.js Cache Components, which call fits?

- [ ] `revalidateTag('products', 'max')`, because it refreshes in the background
- [x] `updateTag('products')`, because it expires the entry immediately so the next read is fresh
- [ ] `router.refresh()`, because server caches are cleared from the client
- [ ] Nothing; `"use cache"` entries are per request

> `updateTag` is designed for read-your-own-writes inside Server Actions: the cached entry is expired at once and the following render fetches fresh data. `revalidateTag` with a profile uses stale-while-revalidate, so the user could be shown the old value once more; it suits webhook-driven content updates. `router.refresh()` re-requests the current route but does not invalidate server-side cached data.

### 21. A team adds `NEXT_PUBLIC_API_URL` to their hosting dashboard, builds one Docker image, and promotes that same image from staging to production with a different value set in production. Production still calls the staging API. Why?

- [ ] Environment variables in Docker are read only on the first container start
- [ ] `NEXT_PUBLIC_` variables are cached by the CDN
- [ ] Production builds ignore variables that are not in `.env.production`
- [x] Public variables are inlined into the JavaScript at build time, so the image contains the value from when it was built

> The bundler replaces `process.env.NEXT_PUBLIC_API_URL` with a string literal during `next build`. Changing the variable at runtime changes nothing in the already-built client bundle. Either build per environment, or deliver runtime configuration another way, for example by reading an unprefixed variable on the server and passing it to the client.

### 22. When does a plain Vite single-page app with a client router beat a meta-framework, and what are the signs you have outgrown it?

> It wins when the app is behind a login (no SEO or link preview needs), users return often with a warm cache, a separate API already exists, and you value deploying static files with no server to operate. Internal tools, dashboards, editors, and embedded apps fit this. You keep full control and a simpler mental model, with loaders, nested routes, and code splitting available from the router. Signs you have outgrown it: public pages that must rank or produce link previews; an LCP problem caused by content being behind the bundle and data fetch; secrets or tokens that should not be in the browser; and a growing set of endpoints written only to serve this UI. At that point a framework's server rendering and server-side data layer earn their complexity, and tools like React Router let you adopt them route by route.

### 23. A hero image rendered with `next/image` is displayed 400 px wide inside a sidebar layout on desktop, but the Network panel shows a 1920 px file being downloaded. The component has `width`, `height`, and `alt` set. What is missing?

- [ ] The `quality` prop, which defaults to the largest size
- [x] An accurate `sizes` attribute; without it the browser assumes the image spans the viewport and picks a large candidate from the `srcset`
- [ ] `loading="lazy"`, which also selects smaller files
- [ ] A static import, because remote images are never resized

> The component generates a `srcset` of widths, but only the browser chooses among them, and it does so before layout using `sizes`. With no `sizes`, the assumption is 100vw. Telling it the truth, for example `sizes="(min-width: 60rem) 400px, 100vw"`, lets it pick a file near 400 px (times the device pixel ratio). Lazy loading changes when a file loads, not which one.

### 24. A team self-hosts a Next.js app as three container replicas behind a load balancer. After an editor publishes a change and the CMS webhook calls `revalidateTag`, users see the old and new versions of the page alternately. Explain why, and name two other things the team is now responsible for that a managed platform would handle.

> The default cache is stored per instance, in memory and on local disk. The webhook request reaches one replica, which invalidates its own cache; the other two still hold the old entry and keep serving it until their own time-based revalidation, so responses depend on which replica the load balancer picks. The fix is a shared cache handler (for example Redis-backed) so that all instances read and invalidate the same store. Other responsibilities of self-hosting include: a reverse proxy that terminates TLS, compresses, and does not buffer streamed responses; a CDN in front for static assets and cacheable HTML; the CPU and memory cost of on-demand image optimisation; keeping the Server Actions encryption key and deployment ID consistent across instances during rolling deploys; and operations such as health checks, graceful shutdown, logging, and tracing.

### 25. A site wants its `/internal-report` page kept out of Google. Someone adds `Disallow: /internal-report` to `robots.txt` and also adds `<meta name="robots" content="noindex">` to the page. The URL still appears in search results without a snippet. Why?

- [ ] `noindex` only works as an HTTP header, not a meta tag
- [x] The `Disallow` rule stops Googlebot fetching the page, so it never sees the `noindex`, and the URL can still be indexed from external links
- [ ] `robots.txt` rules take several months to apply
- [ ] The sitemap overrides both rules

> `robots.txt` controls crawling, not indexing. A blocked URL that is linked from elsewhere can be indexed without content. For `noindex` to work the page must be crawlable so the directive can be read. Remove the `Disallow`, keep the `noindex`, and for anything truly private require authentication, because both mechanisms are advisory.

### 26. A page's title and Open Graph tags are set like this in a client-rendered app. Google eventually shows the right title, but links shared in Slack show a generic preview. Why, and what is the fix?

```jsx
useEffect(() => {
  document.title = post.title;
  document
    .querySelector('meta[property="og:title"]')
    ?.setAttribute('content', post.title);
}, [post]);
```

> Google renders JavaScript (after a delay), so it eventually sees the updated title. Link unfurlers such as Slack, LinkedIn, and iMessage fetch the HTML once and do not execute JavaScript, so they read whatever was in the server response: the generic tags from `index.html`. The fix is to put per-route metadata into the initial HTML by server-rendering or prerendering the page and using the framework's metadata API, for example `generateMetadata` in Next.js, which also keeps the canonical URL and description correct for every crawler.

### 27. What is the security problem in this structured-data snippet when `product.description` comes from user-generated content?

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@type': 'Product', description: product.description }) }}
/>
```

- [ ] JSON-LD must be in an external file to be valid
- [ ] `JSON.stringify` throws on strings containing quotes
- [x] `JSON.stringify` does not escape `<`, so a description containing `</script>` closes the tag and lets the rest be parsed as HTML
- [ ] Search engines execute JSON-LD as JavaScript

> The HTML parser ends a script element at the first `</script>` regardless of JSON string quoting. Anything after it is parsed as markup, which is an XSS vector. Escape `<` in the serialised output, for example `.replace(/</g, '\\u003c')`, which is still valid JSON.

### 28. You build the same blog as CSR, SSR, and static, all using the same React components, and run Lighthouse. LCP differs a lot between them, but Total Blocking Time is nearly identical. Explain why.

> LCP measures when the main content is painted. That depends on when content reaches the browser: after the bundle and data fetch for CSR, in the first response for SSR and static, with static also having the fastest TTFB. Total Blocking Time measures main-thread work that blocks input, and it is dominated by JavaScript execution. All three versions ship essentially the same component code, and the SSR and static versions must hydrate, which means running those same components on the client. So the JavaScript cost is the same; only its timing relative to paint changed. To reduce TBT you have to ship and execute less JavaScript: Server Components, islands, code splitting, or removing dependencies. Changing where the HTML is generated does not do that.
