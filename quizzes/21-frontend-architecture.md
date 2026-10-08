# Frontend Architecture and System Design: Practice test

### 1. A team organises its app as `components/`, `hooks/`, `api/`, and `utils/`. Adding a "saved searches" feature touched files in all four folders. What is the main architectural problem with this layout?

- [ ] It produces larger bundles because bundlers cannot tree-shake across folders
- [x] Code that changes together is spread apart, so there is no boundary around a feature and nothing shows what belongs to it
- [ ] TypeScript path aliases stop working when folders are named after file types
- [ ] It prevents components from being reused between features

> Grouping by file type scatters each feature across the tree: you cannot see, own, test, or delete a feature as a unit. Grouping by feature or domain keeps things that change together in one place. Bundle size and aliases are unaffected by folder names, and reuse is equally possible in both layouts.

### 2. Which import violates a sensible dependency direction of `app → features → shared`?

```ts
// (A) src/app/routes.tsx
import { CheckoutPage } from '@/features/checkout';

// (B) src/features/checkout/ui/Summary.tsx
import { Button } from '@/shared/ui';

// (C) src/shared/ui/PriceTag.tsx
import { useCart } from '@/features/cart';

// (D) src/features/checkout/model/total.ts
import { formatMoney } from '@/shared/lib/money';
```

- [ ] A
- [ ] B
- [x] C
- [ ] D

> `shared` must be a leaf: generic code that knows nothing about features. In (C) a shared UI component depends on the cart feature, so every consumer of `PriceTag` now drags in the cart, and cart changes can break unrelated screens. The fix is to pass the value in as a prop. A, B, and D all point from more specific to more general code.

### 3. What does adding this field to a package's `package.json` change for consumers?

```json
{
  "name": "@acme/ui",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

- [ ] Nothing at runtime; `exports` is only documentation for editors
- [ ] Consumers can now import any file under `dist/` by path
- [x] `import '@acme/ui'` works, and deep imports such as `@acme/ui/dist/internal/x.js` are refused by Node and bundlers
- [ ] The package can only be consumed with `require`, not `import`

> Once `exports` is defined it is the complete list of entry points. Any subpath not listed fails to resolve, which gives real encapsulation of internals. It is enforced by Node and by bundlers that follow the resolution algorithm, not just advisory.

### 4. This module pair sometimes throws `TypeError: formatUser is not a function` on startup, depending on which file is imported first. Why?

```js
// user.js
import { log } from './logger.js';
export const formatUser = (u) => `${u.name} <${u.email}>`;
log('user module ready');

// logger.js
import { formatUser } from './user.js';
const banner = formatUser({ name: 'system', email: 'sys@example.com' });
export const log = (msg) => console.log(banner, msg);
```

- [ ] `const` exports cannot be imported by other modules
- [ ] Arrow functions are not hoisted, so they can never be exported
- [ ] ES modules are evaluated in parallel, so the order is random
- [x] The two modules form an import cycle, so one of them runs its top-level code before the other has initialised its exports

> With a cycle, whichever module is entered second is evaluated first, and it reads a binding from a module that has not finished evaluating. Depending on entry point you get an uninitialised binding error. Evaluation is deterministic, not parallel; the fix is to break the cycle, for example by moving `formatUser` to a module both can import or by not calling it at module top level.

### 5. A reviewer says this component has "the wrong abstraction". What is the evidence?

```tsx
function DataTable({ rows, isAdmin, isBillingPage, hideFooter, compactOnMobile, onInvoiceClick }: Props) {
  return (
    <table className={compactOnMobile ? 'compact' : ''}>
      {/* ... */}
      {isBillingPage && <InvoiceColumn onClick={onInvoiceClick} />}
      {isAdmin && !isBillingPage && <AdminActions />}
      {!hideFooter && <Footer showTotals={isBillingPage} />}
    </table>
  );
}
```

- [ ] It uses too many JSX conditionals, which are slow to render
- [x] The shared component knows about its individual callers through flags, so each new use adds branches and every change risks every caller
- [ ] Tables should always be built with CSS grid instead of `<table>`
- [ ] Props should be passed through context instead

> Flags like `isBillingPage` mean the abstraction was fitted to callers after the fact. The pattern that was "shared" has diverged, and the component is now harder to change than duplicated code would be. The remedy is to inline it into the callers, remove what each does not use, and extract only what is truly common, or to compose from smaller pieces.

### 6. Explain what "server state is a cache" means for data layer design, and name two bugs you get when you treat it as ordinary component state.

> Data that lives on a server is owned elsewhere, can change without the client knowing, and is wanted by several components at once. The client's copy is therefore a cache with a key, an age, and an invalidation rule, and it should live in a dedicated layer (a query cache, route loaders, or server components) rather than in each component's local state. Treating it as local state (fetch in an effect, store in `useState`) produces: duplicate requests when two components need the same data; inconsistent screens when one copy is updated after a mutation and another is not; race conditions where an older response overwrites a newer one; request waterfalls from parent-then-child fetching; and no shared loading or error handling. A good answer also mentions keeping client-only state (UI state, drafts) separate and putting shareable view state in the URL.

### 7. A Vite app has this in `.env.production`. What is the problem?

```bash
VITE_API_URL=https://api.example.com
VITE_STRIPE_SECRET_KEY=sk_live_abc123
```

- [x] Variables prefixed `VITE_` are inlined into the client bundle at build time, so the secret key is published to every visitor
- [ ] Vite ignores `.env.production`; only `.env` is read
- [ ] `VITE_API_URL` must not contain a protocol
- [ ] Nothing: Vite encrypts `VITE_` variables in the output

> Anything exposed to client code is public, and build-time variables are literally replaced with their values in the JavaScript. A secret key must stay on a server (a BFF or serverless function). Vite does read mode-specific env files, and there is no encryption of inlined values.

### 8. Five requests fail with 401 at the same moment because the access token expired. The API uses rotating refresh tokens. What does this client code get wrong?

```ts
async function api(url: string, init?: RequestInit) {
  let res = await fetch(url, { ...init, credentials: 'include' });
  if (res.status === 401) {
    await fetch('/auth/refresh', { method: 'POST', credentials: 'include' });
    res = await fetch(url, { ...init, credentials: 'include' });
  }
  return res;
}
```

- [ ] It should store the token in `localStorage` before retrying
- [ ] `credentials: 'include'` prevents cookies from being sent
- [ ] It retries the original request, which is never safe
- [x] Each of the five calls starts its own refresh; with rotation, the first one invalidates the token the others are using, and the user is logged out

> This is a refresh stampede. The fix is a single shared in-flight refresh promise that all 401 handlers await, so only one refresh request is made. Moving tokens to `localStorage` would make things worse by exposing them to XSS, and `credentials: 'include'` is what causes cookies to be sent.

### 9. Why is hiding the "Delete project" button for non-admins not sufficient as access control, and what is the UI check actually for?

> Anything in the browser is under the user's control: they can call the API directly, edit the DOM, or change client state. Authorisation must be enforced on the server for every request, and the server must return 403 when it is not allowed. The UI check exists for experience, not security: it avoids offering actions that will fail, explains why something is unavailable, and keeps the interface relevant to the user's role. A good design sends capabilities (for example `project:delete`) with the session so components ask `can('project:delete')` instead of comparing role names, and still handles a 403 gracefully in case the client's view of permissions is stale.

### 10. A frontend has 400 component tests that mock the API with hand-written fixtures. The backend renames `order.total` to `order.totalCents`. All tests pass and production breaks. Which change to the testing architecture addresses this class of failure most directly?

```ts
// test fixture
const order = { id: 'o_1', status: 'paid', total: 4200 };
server.use(http.get('/api/orders/o_1', () => HttpResponse.json(order)));
```

- [ ] Raise the coverage threshold from 80% to 95%
- [ ] Replace the component tests with snapshot tests of the rendered output
- [x] Tie the mocks to the real contract: type fixtures from the API schema or verify them with contract tests in the provider's CI, so a schema change fails a build
- [ ] Mock the `fetchOrder` module instead of the HTTP request

> The tests verified the UI against an imagined response, and nothing checked that the imagined response matches the real API. Generating types and handlers from the OpenAPI or GraphQL schema, or running consumer-driven contract tests, makes the rename a compile or CI failure. Coverage and snapshots measure the same wrong assumption more thoroughly, and mocking your own module moves the mock further from the real boundary. A small set of end-to-end tests over critical journeys is a useful second net, but it is slower and covers fewer paths.

### 11. Given this `turbo.json`, what happens when you run `turbo run build` in a repo where app `web` depends on package `ui`?

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] }
  }
}
```

- [ ] `web` and `ui` build at the same time because tasks always run in parallel
- [x] `ui` builds first, then `web`; on a later run with unchanged inputs, both are restored from cache instead of rebuilt
- [ ] Only `web` builds; dependencies must be built manually
- [ ] `web` builds first so that `ui` can read its output

> `^build` means "run `build` in my dependencies first", so the task graph orders `ui` before `web`. Each task's inputs are hashed, and when the hash matches a previous run the declared `outputs` and logs are replayed from the cache. Independent tasks run in parallel, but a task never runs before the tasks it depends on.

### 12. A CI job runs `turbo run test --affected` on pull requests, but every package is tested on every PR. The checkout step is below. What is the most likely cause?

```yaml
- uses: actions/checkout@v7
- run: npx turbo run test --affected
```

- [ ] `--affected` only works on the `main` branch
- [ ] Turborepo cannot detect changes in test files
- [x] The checkout is shallow, so the base commit is missing and Turborepo treats all packages as changed
- [ ] The `test` task needs `"cache": false` for `--affected` to work

> `--affected` compares the current commit with a base (by default `main`) using git. `actions/checkout` fetches a single commit by default, so the comparison cannot be made and everything is considered changed. Fetch enough history (`fetch-depth: 0` or a suitable depth) so the base exists. Caching is unrelated to change detection.

### 13. In this CODEOWNERS file, who is requested for review when a PR changes `packages/ui/src/tokens/colors.css`?

```text
*                         @acme/platform
/packages/ui/             @acme/design-system
/packages/ui/src/tokens/  @acme/brand
```

- [ ] `@acme/platform`, `@acme/design-system`, and `@acme/brand`
- [ ] `@acme/platform`, because the first matching pattern wins
- [ ] `@acme/design-system` and `@acme/brand`
- [x] `@acme/brand` only, because the last matching pattern takes precedence

> CODEOWNERS does not merge matches: the last pattern in the file that matches a path determines its owners. To have both teams own the tokens folder, list both on that line. This is why files are ordered from general to specific.

### 14. When are micro-frontends justified, and what would you try first? Name at least three costs.

> They are justified when several teams need to build and deploy parts of one product independently, a shared release process is the bottleneck, the product splits cleanly along domain or route lines, and the organisation can fund a platform team for the shell and shared infrastructure. They solve an organisational problem, not a technical one. Costs include: duplicated or mismatched dependencies and larger payloads; version skew between shell and remotes at runtime; inconsistent UX when teams upgrade the design system at different times; harder cross-app concerns (auth, routing, shared state, error handling); more complex local development and end-to-end testing; and operational overhead for many pipelines. First try a modular monolith: one deployable in a monorepo with enforced module boundaries, CODEOWNERS, and fast affected-only CI, which gives most of the team autonomy without runtime composition. If you do split, prefer route-level composition and thin contracts (URLs, events) over shared stores.

### 15. You must rename the `kind` prop to `variant` on `<Button>` across 600 files. Why is a codemod better than a regex replace, and what does a codemod like this still miss?

```js
export default function transformer(file, api) {
  const j = api.jscodeshift;
  return j(file.source)
    .find(j.JSXOpeningElement, { name: { name: 'Button' } })
    .forEach((path) => {
      for (const attr of path.node.attributes) {
        if (attr.type === 'JSXAttribute' && attr.name.name === 'kind') {
          attr.name.name = 'variant';
        }
      }
    })
    .toSource();
}
```

> A regex sees text, so `kind=` would also match other components' props, object keys, strings, and comments, and would miss attributes split across lines. The codemod works on the syntax tree: it only touches JSX attributes named `kind` on elements named `Button`. What it still misses, because it is syntactic and not type-aware: a `Button` imported from a different library (it should check the import declaration), the component imported under another name or re-exported, props passed by spread (`<Button {...props} />` where `props.kind` is set elsewhere), wrappers that forward `kind`, and usages built dynamically. The practical approach is to run with `--dry`, apply, then let the type-checker find the remainder once `kind` is removed from the prop types, and fix those by hand.

### 16. A legacy AngularJS app is being moved to a new framework. Which plan follows the strangler fig pattern?

- [ ] Freeze features for six months, rewrite everything on a branch, and switch on a release day
- [ ] Rewrite the state management layer for the whole app first, then the components, then the routing
- [x] Route one low-risk section to the new app at the proxy, share auth and styling across both, then move further routes one at a time until the old app can be deleted
- [ ] Run both apps on separate domains and let users choose which to use

> The strangler fig replaces a system incrementally behind a routing seam while it stays in production, one vertical slice at a time, with the ability to route back. A big-bang rewrite concentrates risk on one day. Migrating by horizontal layer delivers no working slice until the end. Separate domains with user choice never retires the old system.

### 17. Which pagination design fits a feed where new posts are added constantly, and why?

- [ ] `?page=3&pageSize=20`, because page numbers are easiest to cache
- [ ] `?offset=40&limit=20`, because the client controls exactly which rows it gets
- [ ] Return all posts at once and paginate in the browser
- [x] `?cursor=<opaque>&limit=20`, because a cursor marks a stable position, so inserts at the top do not cause duplicates or gaps

> Offset and page-number pagination count from the current top of the list. When new items are inserted, everything shifts and the next page repeats items already shown (or skips some after deletions). A cursor encodes a position in the ordering, such as the last item's timestamp and ID, so "the next 20 after this one" is stable. The cost is that you cannot jump to an arbitrary page.

### 18. What bug does this autocomplete have, and what is the smallest fix?

```js
input.addEventListener('input', async () => {
  const res = await fetch(`/suggest?q=${encodeURIComponent(input.value)}`);
  render(await res.json());
});
```

- [ ] `encodeURIComponent` corrupts the query, so results never match
- [x] Responses can arrive out of order, so results for an older query can overwrite newer ones; abort the previous request (or ignore stale responses) before rendering
- [ ] `input` events do not fire for keyboard typing, only for paste
- [ ] `await res.json()` cannot be passed directly to a function

> Each keystroke starts a request and nothing guarantees they finish in order: the reply for "re" may land after the reply for "react". Keep an `AbortController`, abort it before each new request, and ignore `AbortError`. Debouncing reduces how often this happens but does not remove the race, so it is not a fix on its own.

### 19. You are designing the keyboard and screen reader behaviour of an autocomplete. Where should DOM focus be while the user arrows through suggestions, and how does assistive technology know which suggestion is active?

> DOM focus stays on the text input the whole time, so the user can keep typing. The input has `role="combobox"`, `aria-expanded`, `aria-controls` pointing at the popup, and `aria-autocomplete="list"`. The popup is a `listbox` containing `option` elements with unique IDs. As the user presses the arrow keys, the component sets `aria-activedescendant` on the input to the ID of the highlighted option (and `aria-selected="true"` on that option), which tells assistive technology which option is active without moving focus. Enter selects the active option, Escape closes the popup, and a polite live region announces how many results are available. Moving real focus into the list would stop typing from working and is the common mistake.

### 20. Two users are offline and both edit the same paragraph. With a CRDT such as Yjs, what is guaranteed when they reconnect?

```js
Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB));
Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));
```

- [x] Both documents end up with identical content regardless of the order updates are applied, but the merged text is not guaranteed to read sensibly
- [ ] The edit with the later timestamp replaces the other user's edit entirely
- [ ] The second update is rejected and that user must resolve the conflict by hand
- [ ] Both documents converge only if a central server orders the operations first

> CRDTs guarantee convergence: replicas that have received the same set of updates reach the same state, with no central ordering required. They do not guarantee that the result matches what either author intended, so concurrent rewrites of one sentence can interleave. Last-write-wins on the whole text would lose an edit, and requiring a server to order operations describes operational transformation.

### 21. A product page's hero image is the LCP element. Which markup is best?

- [ ] `<img src="hero.jpg" loading="lazy" alt="…">`
- [ ] A `<div>` with `background-image: url(hero.jpg)` set in an external stylesheet
- [x] `<img src="hero-800.jpg" srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1600.jpg 1600w" sizes="(max-width: 600px) 100vw, 50vw" width="1600" height="900" fetchpriority="high" alt="…">`
- [ ] An `<img>` inserted by JavaScript after hydration with `decoding="async"`

> The LCP image must be discoverable by the preload scanner in the initial HTML, must not be lazy-loaded, should be prioritised with `fetchpriority="high"`, should be sized correctly through `srcset` and `sizes`, and needs `width` and `height` so space is reserved and there is no layout shift. Lazy loading delays it, a CSS background is found only after the stylesheet is parsed, and a JavaScript-inserted image waits for the bundle.

### 22. You are asked to "design a dashboard that shows live order data". List the clarifying questions you would ask first and, for three of them, say how the answer would change your design.

> Questions: Who uses it and on what devices (desktop in an office, or phones on a warehouse floor)? How many rows or data points are shown at once, and how far back does history go? How live is "live": sub-second, a few seconds, or a minute? How many concurrent viewers? Do users filter, sort, export, or drill in? Does it need to work offline or on poor networks? What are the accessibility and browser requirements? What APIs exist, and can they push updates? What does success look like (a metric or task time)? Examples of answers driving design: (1) Data volume: tens of rows can be rendered directly, while 100,000 rows need server-side filtering and pagination plus a virtualised table. (2) Freshness: a minute means polling with a stale time, which is simple and robust; sub-second means a push channel (SSE or WebSocket), batching updates into animation frames, and thought about back-pressure. (3) Devices: phones on poor networks mean a small bundle, server rendering of the first view, cached last-known data, and layouts that are not wide tables. A strong answer states assumptions when answers are unknown and names the two or three requirements that will get most of the design attention.

### 23. Your team is choosing between two form libraries. One has 40,000 GitHub stars and a single maintainer who released a breaking major version three times in the past year with no migration guides. The other has 6,000 stars, four maintainers at two companies, and ships codemods with each major. What does a sound evaluation conclude, and what else would you check?

- [ ] Choose the first: stars are the best predictor of long-term support
- [ ] Choose neither: forms should always be built in-house
- [ ] Choose the first, because frequent major versions show the project is active
- [x] The second looks healthier on maturity; you would still spike the hardest form you need, measure bundle cost, and judge exit cost and team familiarity before deciding

> Popularity is not health. Maintainer count and funding, how breaking changes are handled, and upgrade tooling tell you what owning the dependency will cost. Maturity is only one criterion, though: fit (does it handle your hardest case, accessibility, SSR, bundle size), exit cost (how much of your code will know about it), and team skill complete the picture. Frequent unassisted breaking changes are a cost you pay on every upgrade.

### 24. Write a short ADR (context, decision, consequences) for this situation: your SPA stores the access token in `localStorage`; a security review flagged it; you decide to move to a BFF that keeps tokens server-side and gives the browser an `HttpOnly` session cookie.

> A model answer: **Title:** Move session handling to a BFF with HttpOnly cookies. **Status:** Accepted. **Context:** The SPA obtains OAuth tokens in the browser and stores them in `localStorage`, where any script running on the page (including a compromised dependency or an XSS payload) can read and exfiltrate them. A security review rated this high risk. We have a Node server available and all API calls already go to one origin. **Decision:** Introduce a backend for frontend that performs the OAuth code flow, stores access and refresh tokens server-side, and issues the browser a session cookie with `HttpOnly; Secure; SameSite=Lax`. The browser calls the BFF, which attaches tokens when calling downstream APIs and refreshes them itself. **Consequences:** Positive: tokens are no longer readable by JavaScript; refresh logic and its race conditions leave the client; one place to enforce auth. Negative: a new service to deploy, scale, and monitor; cookies require CSRF protection (SameSite plus origin checks or tokens) on state-changing requests; the SPA can no longer call third-party APIs directly with the user's token; local development needs the BFF running. **Alternatives considered:** keep tokens in memory only (lost on reload, still reachable by XSS during a session); service-worker token storage (complex, limited benefit). A good answer is brief, includes negative consequences, and names at least one rejected alternative.
