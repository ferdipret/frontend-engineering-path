# Capstone Projects: Practice test

This is a cumulative final exam. It draws on every module in the path, and the questions are harder than a module quiz.

### 1. A user types a query and clicks "Show filters". What happens?

```html
<form action="/search">
  <input name="q" />
  <button onclick="toggleFilters()">Show filters</button>
  <button type="submit">Search</button>
</form>
```

- [ ] The filters toggle and nothing else happens, because the button has a click handler
- [x] The filters toggle, then the form submits and the page navigates to `/search?q=...`
- [ ] Nothing happens, because a form can only contain one button
- [ ] The form submits without running the handler

> A `<button>` inside a form defaults to `type="submit"`. The click handler runs first, then the default action submits the form. The fix is `type="button"` on any button that is not meant to submit. Having a handler does not cancel the default action; only `preventDefault()` does.

### 2. What colour is the button text?

```css
@layer base, components;

@layer components {
  .btn { color: red; }
}
@layer base {
  #cta.btn { color: blue; }
}
.btn { color: green; }
```

```html
<button id="cta" class="btn">Buy</button>
```

- [ ] Blue, because `#cta.btn` has the highest specificity
- [ ] Red, because `components` is the last declared layer
- [x] Green, because unlayered styles beat all layered styles for normal declarations
- [ ] Red, because it appears first in the source

> Cascade layers are compared before specificity. For normal (non-`!important`) declarations, unlayered styles win over every layer, so the plain `.btn` rule wins. If that rule were removed, the answer would be red: `components` comes after `base` in the layer order, and layer order beats the ID selector's specificity.

### 3. What does this log?

```js
async function f() {
  console.log(1);
  await null;
  console.log(2);
}

console.log(0);
f();
setTimeout(() => console.log(3));
Promise.resolve().then(() => console.log(4));
console.log(5);
```

- [ ] 0, 1, 2, 5, 4, 3
- [ ] 0, 5, 1, 2, 4, 3
- [ ] 0, 1, 5, 4, 2, 3
- [x] 0, 1, 5, 2, 4, 3

> An async function runs synchronously until its first `await`, so 0 then 1. `await null` queues the rest of `f` as a microtask. The timer callback is a task, the `.then` callback is a second microtask, and 5 logs synchronously. Microtasks then drain in the order they were queued (2, then 4), and the timer task runs last.

### 4. What does the TypeScript compiler report for this function?

```ts
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string }
  | { status: 'error'; error: Error };

function label(state: State): string {
  switch (state.status) {
    case 'idle':
    case 'loading':
      return 'Loading';
    case 'success':
      return state.data;
    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
}
```

- [x] An error on the `never` assignment, because the `'error'` variant is not handled
- [ ] No error; `default` handles every remaining case
- [ ] An error on `state.data`, because `data` does not exist on every variant
- [ ] An error because a `switch` on a string cannot be exhaustive

> In the `default` branch, `state` has been narrowed to whatever variants remain: here `{ status: 'error'; error: Error }`, which is not assignable to `never`. That is the purpose of the pattern: adding a variant to the union turns every non-exhaustive switch into a compile error. `state.data` is fine because the `'success'` case narrows the type.

### 5. What is the type `Keys`?

```ts
const routes = {
  home: '/',
  user: '/users/:id',
} satisfies Record<string, string>;

type Keys = keyof typeof routes;
```

- [ ] `string`
- [ ] `string | number`
- [x] `'home' | 'user'`
- [ ] `never`

> `satisfies` checks that the value conforms to the type without widening the variable's inferred type, so `routes` keeps its specific keys. Had it been written with an annotation, `const routes: Record<string, string> = ...`, then `keyof typeof routes` would be `string` and you would lose autocompletion and typo checking on route names.

### 6. What does this component display over time?

```jsx
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return <p>{count}</p>;
}
```

- [ ] 0, 1, 2, 3, and so on, one per second
- [x] 0, then 1, and it stays at 1
- [ ] 0 forever
- [ ] It throws, because `count` is missing from the dependency array

> The effect runs once and its callback closes over `count` from the first render, which is 0. Every tick calls `setCount(0 + 1)`. The fix is the updater form, `setCount((c) => c + 1)`, which does not depend on the captured value. A missing dependency is a lint warning, not a runtime error.

### 7. The list shows three rows. The user types "hello" into the first row's input, then clicks Remove on the first row. What do they see?

```jsx
function List() {
  const [items, setItems] = useState(['Apples', 'Bread', 'Cheese']);
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          {item} <input />
          <button onClick={() => setItems(items.filter((_, i) => i !== index))}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] Two rows, Bread and Cheese, both with empty inputs
- [ ] Two rows, Apples and Bread; the wrong item was removed
- [ ] React throws a duplicate key error
- [x] Two rows, Bread and Cheese, and "hello" is now in the input beside Bread

> With index keys, React matches old and new rows by position. After the removal it sees keys 0 and 1 still present and key 2 gone, so it keeps the first two `<li>` DOM nodes, updates their text, and removes the third. The uncontrolled input in the first node keeps its value, which now sits beside "Bread". A stable key such as an item ID fixes it.

### 8. A filter panel on a product listing has category, price range, and sort order. Users want to share filtered views and keep them after a reload. Where should that state live?

- [ ] In a global client store, so every component can read it
- [x] In the URL's search parameters, read by the components that need it
- [ ] In `localStorage`, synchronised on change
- [ ] In component state lifted to the page component

> The URL is the right owner for state that should be shareable, bookmarkable, and survive reload and back or forward navigation. A global store or lifted state is lost on reload and cannot be shared. `localStorage` persists for one user on one device, cannot be sent to a colleague, and silently overrides what a shared link intended.

### 9. In an optimistic update with a server-state library, why do you cancel in-flight queries for that data before writing the optimistic value to the cache?

```ts
onMutate: async (newTodo) => {
  await queryClient.cancelQueries({ queryKey: ['todos'] });
  const previous = queryClient.getQueryData(['todos']);
  queryClient.setQueryData(['todos'], (old = []) => [...old, newTodo]);
  return { previous };
},
onError: (_err, _newTodo, context) => {
  queryClient.setQueryData(['todos'], context?.previous);
},
onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
```

- [ ] To reduce load on the server
- [ ] Because the cache cannot be written while a query is running
- [x] Because a refetch already in flight could resolve afterwards and overwrite the optimistic value with older server data
- [ ] To make the mutation request go out first

> A fetch that started before the mutation returns data that does not include the new item. If it lands after you write the optimistic value, the item disappears from the UI and then reappears when the mutation settles. Cancelling avoids that flicker. The snapshot enables rollback on error, and invalidating on settle reconciles with the server's truth.

### 10. This server-rendered component logs a hydration mismatch warning. Why?

```jsx
export default function Footer() {
  return <p>Page generated at {new Date().toLocaleTimeString()}</p>;
}
```

- [ ] `Date` is not available on the server
- [ ] Template expressions are not allowed in server-rendered text
- [ ] The component is missing a `key`
- [x] The server and the client evaluate the expression at different times, and possibly in different time zones and locales, so the HTML differs from the client's first render

> Hydration expects the client's first render to match the server's HTML. Anything that varies between the two environments (the current time, random values, locale, `window` checks) breaks that. Render a stable value on the server and update it in an effect after hydration, or format the time on one side only.

### 11. Your HTML is served with `Cache-Control: no-cache` and your hashed JavaScript files with `Cache-Control: public, max-age=31536000, immutable`. What does `no-cache` mean for the HTML?

- [ ] The browser must not store the HTML at all
- [ ] The HTML is cached for the session only
- [x] The browser may store it, but must revalidate with the server before each use
- [ ] The CDN may cache it, but browsers may not

> `no-cache` allows storage and requires revalidation (typically a conditional request answered with 304 if unchanged). `no-store` is the directive that forbids storing. This pairing is the standard pattern: HTML always revalidates so it references the latest hashed assets, which can then be cached for a year because their URLs change when their content does.

### 12. This test fails with "Unable to find an element with the text: 1 item", although the feature works in the browser. The count updates after a mocked request resolves. What is the correct fix?

```tsx
test('adds an item to the cart', async () => {
  render(<Cart />);
  await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
  expect(screen.getByText('1 item')).toBeInTheDocument();
});
```

- [ ] Wrap the assertion in `setTimeout` with a 500ms delay
- [ ] Replace `getByText` with `queryByText`
- [ ] Mock the cart component's state setter
- [x] Use `await screen.findByText('1 item')`, which retries until the element appears or a timeout passes

> `getBy*` queries check once, synchronously, and throw. The UI updates only after the request promise resolves and React re-renders, so you need a query that waits: `findBy*` (or `waitFor`). A fixed delay is slow and flaky, `queryByText` returns `null` instead of throwing but still does not wait, and mocking internal state tests the implementation instead of the behaviour.

### 13. A bundle analysis shows all of lodash (about 70 KB minified) in the bundle, although the code uses only `debounce`. Why, and what fixes it?

```js
import _ from 'lodash';

const onResize = _.debounce(handleResize, 200);
```

- [x] The default `lodash` package is CommonJS, which bundlers cannot tree-shake reliably; import from `lodash-es` (or `lodash/debounce`), or write the small function yourself
- [ ] Tree shaking only works in development builds
- [ ] The bundler needs `sideEffects: true` in your `package.json`
- [ ] Minification is disabled

> Tree shaking relies on the static structure of ES module imports and exports. The `lodash` main entry is one CommonJS module with everything attached to an object, so nothing can be removed. `lodash-es` exposes ES modules with named exports, and `lodash/debounce` imports a single file. Setting `sideEffects: true` would tell the bundler to keep more code.

### 14. The hero image is the LCP element. Lab tests show LCP at 4.2 seconds, and the Network panel shows the image request starting late. Which change helps most?

```html
<img src="/hero.jpg" loading="lazy" alt="Spring collection" />
```

- [ ] Add `decoding="async"`
- [ ] Convert the image to a CSS `background-image` so it loads with the stylesheet
- [x] Remove `loading="lazy"`, add `fetchpriority="high"`, serve a correctly sized modern format with `srcset`, and set `width` and `height`
- [ ] Add `rel="preload"` for the page's JavaScript bundle

> Lazy loading an above-the-fold image delays the request until layout shows it is in the viewport, and images start at low priority by default. Removing `lazy` and raising the fetch priority starts the download early; right-sizing shortens it; dimensions prevent layout shift. A CSS background is discovered even later, because the preload scanner cannot see it.

### 15. Users report that clicking "Apply" feels frozen, and the spinner never appears. Why?

```js
applyButton.addEventListener('click', () => {
  spinner.hidden = false;
  const result = computeLayoutFor(allRows); // about 800ms of synchronous work
  renderTable(result);
  spinner.hidden = true;
});
```

- [ ] `hidden` cannot be changed from an event handler
- [ ] The click event must be `async` for DOM changes to apply
- [ ] The spinner needs `will-change: transform`
- [x] The browser cannot paint until the task finishes, so the spinner is shown and hidden within one task and the next paint is delayed by 800ms

> Rendering happens between tasks. The handler blocks the main thread for the whole computation, so no frame is produced with the spinner visible, and Interaction to Next Paint for the click is over 800ms. Yield after showing the spinner (for example `await scheduler.yield()`, with a `setTimeout` fallback where it is unavailable), split the work into chunks, or move it to a Web Worker.

### 16. A session cookie is set with `HttpOnly; Secure; SameSite=Lax`. Which statement is true?

- [ ] The application is now safe from cross-site scripting
- [x] An injected script cannot read the cookie, but it can still send authenticated same-origin requests and act as the user
- [ ] `SameSite=Lax` stops the cookie being sent when the user follows a link from another site
- [ ] `Secure` encrypts the cookie's value in the browser's storage

> `HttpOnly` hides the cookie from JavaScript, which prevents stealing the token, but a script running in your origin can call your API and the browser attaches the cookie. XSS must be prevented at the source: output encoding, sanitising untrusted HTML, and a Content Security Policy. `Lax` still sends the cookie on top-level navigations such as following a link; it withholds it on cross-site subrequests and cross-site form posts. `Secure` restricts the cookie to HTTPS.

### 17. A security review finds this response header. Why does it give little protection against cross-site scripting, and what should replace it?

```http
Content-Security-Policy: script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net
```

- [ ] It is missing `default-src`, so the browser ignores the whole policy
- [ ] `'self'` allows scripts from any subdomain
- [x] `'unsafe-inline'` lets injected inline scripts and event handlers run, and the allowed CDN host serves any package, so an attacker can load a script from it; use a per-response nonce with `'strict-dynamic'` and drop both
- [ ] CSP only applies to stylesheets unless `require-trusted-types-for` is set

> XSS usually injects an inline script or handler, which `'unsafe-inline'` permits. Host allowlists are weak because a host that serves arbitrary user-published files can be used to load attacker-chosen code. A strict policy, `script-src 'nonce-...' 'strict-dynamic'; object-src 'none'; base-uri 'none'`, runs only scripts carrying the server's fresh nonce and the scripts those load. A missing `default-src` does not invalidate the directives that are present, and `'self'` means the exact origin only.

### 18. Which animation is more likely to stay smooth while the main thread is busy, and why?

```css
/* A */
.panel { transition: left 300ms; }
.panel.open { left: 0; }

/* B */
.panel { transition: transform 300ms; }
.panel.open { transform: translateX(0); }
```

- [ ] A, because `left` is a simpler property
- [ ] Both are the same; the browser optimises either
- [ ] A, because `transform` creates a new stacking context
- [x] B, because `transform` can be animated on the compositor without layout or paint on each frame, whereas `left` triggers layout every frame on the main thread

> Changing `left` invalidates layout, so every frame runs style, layout, and paint on the main thread and stutters when that thread is busy. `transform` and `opacity` animations can be handed to the compositor thread, which keeps producing frames independently.

### 19. You deploy a fix to a site with a service worker that precaches the app shell. A user with the site open in two tabs reloads one tab and still sees the old version. Why?

- [ ] The browser's HTTP cache ignores service workers
- [ ] The service worker file is cached forever and is never checked for updates
- [x] The new service worker has installed but is waiting; it does not activate while any tab is still controlled by the old one
- [ ] Service workers only update when the browser restarts

> By default a new service worker waits until every client controlled by the old one has closed, so that one page is never served by two versions. A reload does not release the old worker while the other tab remains open. You can prompt the user to update and call `skipWaiting()` when they accept, then reload the pages. The browser does check the worker script for byte changes on navigation.

### 20. A request to another origin's API works with `curl` but fails in the browser with a CORS error. What is the cause?

```js
await fetch('https://api.example.com/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(order),
});
```

- [ ] The API is down; `curl` shows a cached response
- [ ] `fetch` cannot send JSON to another origin
- [ ] The request needs `mode: 'no-cors'` to succeed and return the data
- [x] The browser sends a preflight `OPTIONS` request because of the JSON content type, and the server's response does not allow your origin, method, or header

> CORS is enforced by browsers, not servers, which is why `curl` is unaffected. A JSON `Content-Type` makes the request non-simple, so the browser asks permission first. The server must answer the preflight with `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers` covering the request. `no-cors` yields an opaque response you cannot read, and does not allow that content type.

### 21. The long product name overflows its card instead of truncating. What is the fix?

```css
.card { display: flex; gap: 12px; width: 300px; }
.card .title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

```html
<div class="card">
  <img src="thumb.jpg" width="48" height="48" alt="" />
  <div class="body">
    <div class="title">Extremely long product name that should be truncated</div>
  </div>
</div>
```

- [ ] Add `flex-wrap: wrap` to `.card`
- [x] Give `.body` `flex: 1` and `min-width: 0`, so that the flex item is allowed to shrink below its content width
- [ ] Add `width: 100%` to `.title`
- [ ] Replace `overflow: hidden` with `overflow: clip`

> Flex items have `min-width: auto`, which stops them shrinking below their content's minimum size; with `nowrap` text that is the full text width. The flex item here is `.body`, not `.title` (so `flex: 1` on `.title` has no effect), and `.body` needs `min-width: 0` to shrink, after which the title's ellipsis takes effect.

### 22. Which implementation handles "You have N new messages" correctly for all locales?

- [ ] `'You have ' + n + ' new message' + (n === 1 ? '' : 's')`
- [ ] A translation key per number from 0 to 100
- [ ] Translate "You have", "new message", and "new messages" separately and join them
- [x] A single message in ICU MessageFormat with plural categories, selected using the locale's plural rules (`Intl.PluralRules`)

> Languages differ in how many plural forms they have (Arabic has six, Japanese one) and in word order, so concatenation and the singular or plural binary both fail. A message format with plural categories gives translators one whole sentence per category, and the runtime picks the category for the number using locale rules.

### 23. Five minutes after a deploy, the error rate on checkout rises from 0.1% to 9%. What should you do first?

- [x] Roll back to the previous deployment or turn off the feature flag, confirm the error rate recovers, then investigate
- [ ] Open the code and start debugging the stack trace
- [ ] Wait fifteen minutes to see whether it settles
- [ ] Write a fix and push it through the pipeline as fast as possible

> Mitigate first. A rollback takes seconds to minutes and stops users being harmed; diagnosis can then happen without time pressure, using the errors already captured. Debugging in place or rolling forward with an untested fix extends the incident, and a hurried fix is how a second incident starts.

### 24. A custom modal is built from `<div>` elements. Which approach meets the accessibility requirements with the least custom code?

- [ ] Add `role="dialog"` to the outer `<div>`
- [x] Use the `<dialog>` element opened with `showModal()`, with an accessible name and a close button
- [ ] Add `tabindex="0"` to every element inside the modal
- [ ] Set `aria-hidden="true"` on the modal while it is closed

> `showModal()` puts the dialog in the top layer, makes the rest of the page inert, moves focus inside, closes on `Escape`, and returns focus to the previously focused element on close. With a `<div>` you must build all of that yourself; `role="dialog"` alone only changes what is announced. You still need to give the dialog a name with `aria-labelledby` or `aria-label`.

### 25. In a codebase organised by feature, `features/checkout` imports a file from deep inside `features/cart/components/internal/`. What is the most durable fix?

- [x] Give each feature a public entry point, export what other features may use, and enforce the boundary with a lint rule
- [ ] Move the file to a `shared/` folder, along with anything else used by two features
- [ ] Add a comment asking people not to import internal files
- [ ] Copy the file into `features/checkout`

> A boundary that is not enforced erodes. A public entry point makes the contract explicit, and a lint rule (import restrictions or a boundaries plugin) makes violations fail CI. Moving everything to `shared/` produces a dumping ground with no owner. Comments are ignored, and copying creates divergence.

### 26. This component has a bug that appears when the user switches products quickly on a slow connection. Explain the bug and write a corrected version.

```tsx
function ProductDetails({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => setProduct(data));
  }, [productId]);

  if (!product) return <Spinner />;
  return <h1>{product.name}</h1>;
}
```

> It is a race condition. If `productId` changes from A to B while A's request is still in flight, both requests are live and whichever resolves last wins. If A is slower, the page shows product A under product B's URL. There are further problems: HTTP errors are not handled (`fetch` resolves on a 404 or 500), there is no error state, and the previous product stays on screen while the next one loads.
>
> ```tsx
> function ProductDetails({ productId }: { productId: string }) {
>   const [state, setState] = useState<
>     { status: 'loading' } | { status: 'error' } | { status: 'success'; product: Product }
>   >({ status: 'loading' });
>
>   useEffect(() => {
>     const controller = new AbortController();
>     setState({ status: 'loading' });
>
>     fetch(`/api/products/${productId}`, { signal: controller.signal })
>       .then((res) => {
>         if (!res.ok) throw new Error(`HTTP ${res.status}`);
>         return res.json();
>       })
>       .then((product: Product) => setState({ status: 'success', product }))
>       .catch((err) => {
>         if (err.name !== 'AbortError') setState({ status: 'error' });
>       });
>
>     return () => controller.abort();
>   }, [productId]);
>
>   if (state.status === 'loading') return <Spinner />;
>   if (state.status === 'error') return <p role="alert">Could not load this product.</p>;
>   return <h1>{state.product.name}</h1>;
> }
> ```
>
> The cleanup function aborts the stale request when `productId` changes or the component unmounts, so only the latest request can set state. In a real application a server-state library handles this, along with caching and deduplication.

### 27. Write a type-safe `pick` function in TypeScript that takes an object and an array of its keys and returns a new object with only those keys. The return type must contain exactly the picked properties, and passing a key that does not exist must be a compile error.

> ```ts
> function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
>   const result = {} as Pick<T, K>;
>   for (const key of keys) {
>     result[key] = obj[key];
>   }
>   return result;
> }
>
> const user = { id: 1, name: 'Ada', email: 'ada@example.com' };
> const summary = pick(user, ['id', 'name']); // { id: number; name: string }
> // pick(user, ['age']);                     // error: '"age"' is not assignable
> ```
>
> `K extends keyof T` constrains the keys to those of `T` and lets TypeScript infer `K` as the union of the literals passed (`'id' | 'name'`), so `Pick<T, K>` is precise. `readonly K[]` also accepts `as const` arrays. The single assertion on the empty object is needed because the object is built up incrementally; it is confined to the function body and the public signature stays fully typed.

### 28. Explain what blocks the first render of this page, and rewrite the `<head>` to get content on screen sooner without changing what the page does.

```html
<head>
  <script src="https://cdn.example.com/analytics.js"></script>
  <link rel="stylesheet" href="/css/all.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter&display=block" />
  <script src="/js/app.js"></script>
</head>
```

> Both scripts are parser-blocking: the HTML parser stops at each one until it is downloaded and executed, and a script must also wait for any stylesheets before it that are still loading. Both stylesheets are render-blocking: nothing paints until they are downloaded and parsed. The third-party font stylesheet adds a connection to another origin and then to the font file host, and `display=block` hides text for up to about three seconds while the font loads.
>
> ```html
> <head>
>   <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />
>   <style>/* critical above-the-fold CSS, with @font-face using font-display: swap */</style>
>   <link rel="stylesheet" href="/css/all.css" />
>   <script src="/js/app.js" defer></script>
>   <script src="https://cdn.example.com/analytics.js" async></script>
> </head>
> ```
>
> Changes: `defer` on the application script, so it downloads in parallel and runs after parsing in document order; `async` on analytics, which nothing depends on; a self-hosted, preloaded font with `font-display: swap` so text paints at once in a fallback; and inlined critical CSS so the first paint does not wait on the full stylesheet. Splitting `all.css` per route is the next step. Marks for identifying parser-blocking versus render-blocking correctly, and for knowing that `defer` preserves order while `async` does not.

### 29. A colleague built this custom dropdown. List the accessibility problems and say how you would fix them.

```html
<div class="dropdown" onclick="toggle()">
  <span class="label">Sort by</span>
  <div class="options" style="display: none">
    <div class="option" onclick="pick('price')">Price</div>
    <div class="option" onclick="pick('date')">Date</div>
  </div>
</div>
```

> Problems:
>
> - It cannot be reached or operated by keyboard: a `<div>` is not focusable and has no key handling.
> - It has no role, so a screen reader announces only the text "Sort by", with no indication that it is interactive.
> - It has no state: nothing conveys expanded or collapsed, or which option is selected.
> - The options are not exposed as options, and there is no arrow-key navigation, no `Escape` to close, and no return of focus to the trigger.
> - There is no visible focus indicator, and nothing links the label to the control.
>
> Fixes, in order of preference:
>
> 1. Use a native `<select>` with a `<label>`. It is accessible, works on every device, and can now be styled much more than it used to be. For a sort control it is almost always sufficient.
> 2. If a custom widget is truly required, follow the ARIA Authoring Practices select-only combobox or listbox pattern: a focusable trigger (`<button>` or an element with `role="combobox"`), `aria-expanded`, `aria-controls` pointing at a `role="listbox"` popup, children with `role="option"` and `aria-selected`, an accessible name via `aria-labelledby`, focus managed with `aria-activedescendant` or roving `tabindex`, and keyboard support for `Enter`, `Space`, arrow keys, `Home`, `End`, `Escape`, and type-ahead.
> 3. Better, use a tested headless component from a library that implements the pattern, and own only the styling.
>
> Then verify with keyboard alone and with at least one screen reader. Marks for reaching for the native element first, and for stating that roles without the matching keyboard behaviour make things worse.

### 30. Design the frontend for a search box with autocomplete suggestions on a large e-commerce site. Cover the main concerns you would raise in a system design interview.

> **Requirements.** Suggestions appear as the user types, from a server endpoint; mouse, touch, and keyboard use; mobile-first; results feel instant; millions of users; no search engine indexing needed for the suggestions.
>
> **Component and API.** An input plus a popup list, following the ARIA combobox pattern: `role="combobox"` on the input with `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, and `aria-activedescendant`; the popup has `role="listbox"` with `role="option"` children. Arrow keys move the active option, `Enter` selects, `Escape` closes, and focus stays in the input throughout. The number of results is announced in a polite live region. Endpoint: `GET /suggest?q=...&limit=8`, returning ranked items with a type (query, product, category).
>
> **Request handling.** Debounce input by roughly 150 to 300ms and set a minimum query length. Cancel the previous request with `AbortController` and, as a second safeguard, discard any response whose query does not match the current input, since out-of-order responses are the classic bug. Handle errors quietly: keep the last good results and never block typing.
>
> **Caching.** An in-memory cache keyed by query, with a size limit and a short lifetime, so that backspacing is instant. HTTP caching on the endpoint (`Cache-Control` with a short `max-age`, cacheable at the CDN, since popular prefixes repeat across users). Possibly prefetch popular suggestions on focus.
>
> **Performance.** Keep the input responsive: no heavy synchronous work per keystroke, cap the list at about 8 to 10 items so no virtualisation is needed, highlight matches cheaply, and reserve space or use an overlay so the popup causes no layout shift. Lazy-load the suggestion code on first focus if it is large. Track INP on the input.
>
> **Resilience and security.** The form works without JavaScript as an ordinary search submission. Escape suggestion text and never inject it as HTML when highlighting. Rate-limit on the server.
>
> **Other.** Recent searches stored locally; right-to-left and input method editor support (do not fire requests during composition; check `isComposing`); analytics on suggestion impressions and clicks; tests for the race condition, the keyboard model, and an axe check.
>
> A strong answer gathers requirements first, draws the data flow, goes deep on the race condition and the accessibility pattern, and raises caching and performance without being asked.

### 31. You are choosing a rendering strategy for three products: (a) a marketing site and blog, (b) a logged-in analytics dashboard, and (c) an e-commerce shop with 50,000 products. Choose for each and defend the choice, including what you give up.

> **(a) Marketing site and blog: static generation,** with a framework that ships little or no JavaScript by default, served from a CDN. Content changes rarely and is the same for everyone, and search visibility and first-load speed matter most. You give up per-request personalisation and need a rebuild or revalidation step when content changes. Add islands of interactivity only where needed.
>
> **(b) Logged-in dashboard: a client-rendered application,** or a meta-framework rendering the shell on the server with data fetched per user. Search engines never see it, every view is personalised, and interactions are frequent and long-lived, so the benefit of server-rendering content is small. The priorities are fast navigation after load, good caching of server state, and code splitting per route. You give up first-load speed, which is mitigated with a small shell, route-level splitting, and skeletons. Server-rendering per request is a reasonable alternative if first load on slow devices matters, at the cost of running servers and handling hydration.
>
> **(c) Shop with 50,000 products: server rendering with caching, or incremental static regeneration,** not a full static build. Product pages need search visibility and a fast LCP, but prices and stock change, and building 50,000 pages on every deploy is slow. Render on demand, cache at the CDN, and revalidate on a timer or when a product changes. Personalised parts such as the cart count and recommendations are streamed or loaded on the client so the page stays cacheable. Cart and checkout are dynamic and never cached. You give up simplicity: cache invalidation needs care, and stale prices must be handled, by revalidating at add-to-cart for example.
>
> Marks for matching the strategy to content type, personalisation, search needs, and update frequency; for naming the cost of each choice; and for noting that one product can mix strategies per route.

### 32. Describe the test strategy for a checkout flow: cart review, address form, payment through a third-party provider's hosted fields, and a confirmation page. Say what you would test at each level and what you would deliberately not test.

> **Static.** Strict TypeScript, with the order and address types shared with or generated from the API contract, so a contract change is a compile error.
>
> **Unit.** Pure logic with many cases: totals, tax, discounts, and rounding in minor units; address and postcode validation per country; mapping API error codes to messages. Table-driven and fast.
>
> **Component and integration**, with the network mocked at the boundary. The address form: required fields, error messages associated with their fields and announced, focus moving to the first invalid field, `autocomplete` attributes present, submission disabled while pending, and server-side validation errors displayed. The cart: quantity changes, removal, the empty state, and the out-of-stock response. Also the error paths: a 500, a timeout, and an expired session. These tests query by role and label, so they double as accessibility checks, with an axe assertion on each state.
>
> **End to end**, a small number in a real browser against a production build with the provider's test mode. One happy path from cart to confirmation using a test card. One declined card, asserting the user can retry without re-entering the address. One covering a double click or a refresh on submit, asserting a single order, which exercises idempotency. If the provider requires an authentication challenge, one test for it.
>
> **Not tested by you.** The provider's hosted fields themselves, which are their responsibility and sit inside a cross-origin iframe; your tests cover your integration and your handling of each outcome. Implementation details such as internal state and which hooks were called. Every validation permutation at the end-to-end level, which belongs lower down.
>
> **Operational.** A synthetic check that runs the happy path in production with a test account on a schedule, an alert on the checkout error rate and on a fall in conversion, and the order webhook handler tested for signature verification and repeated deliveries.

### 33. A single-page application talks to its own API on the same site. Describe how you would handle authentication and the main frontend security defences.

> **Session.** After login, the server sets a session cookie with `HttpOnly` (script cannot read it), `Secure` (HTTPS only), `SameSite=Lax` or `Strict`, a `__Host-` name prefix, and a sensible expiry with rotation at login. Tokens are not stored in `localStorage`, where any injected script can read and exfiltrate them. If the API is on a different site and must use bearer tokens, keep the access token in memory with a short lifetime and the refresh token in an `HttpOnly` cookie, or put a backend-for-frontend in front so the browser only ever holds a cookie.
>
> **CSRF.** Cookies are sent automatically, so state-changing requests need protection: `SameSite` as the baseline, non-GET methods for every mutation, and a CSRF token or a check of the `Origin` or `Sec-Fetch-Site` header on the server as defence in depth.
>
> **XSS.** This is the bigger risk, because an injected script can act as the user whatever the cookie flags. Rely on the framework's escaping, avoid `dangerouslySetInnerHTML` and `innerHTML`, sanitise any HTML that must be rendered with a maintained sanitiser, validate URL schemes before putting user data in `href`, and deploy a strict Content Security Policy based on nonces or hashes, with no `unsafe-inline` for scripts. Trusted Types adds enforcement where supported.
>
> **Authorisation.** Every request is checked on the server. Hiding a button is a matter of user experience and is not a security control. Test that user A cannot read user B's resources by changing an ID.
>
> **Transport and headers.** HTTPS everywhere with HSTS, `X-Content-Type-Options: nosniff`, a `frame-ancestors` directive against clickjacking, and a `Referrer-Policy`.
>
> **Supply chain.** A lockfile, dependency review and automated updates, minimal third-party scripts, and Subresource Integrity for any script loaded from a CDN.
>
> **Operational.** Rate limiting and lockout on login, generic error messages that do not reveal whether an account exists, logout that invalidates the session on the server, and no secrets in the client bundle, since anything shipped to the browser is public.

### 34. Lighthouse reports a performance score of 98 for your product listing page, but field data shows INP at 480ms at the 75th percentile on mobile. Explain how that can happen and how you would find and fix the cause.

> **Why they differ.** Lighthouse loads the page once on a simulated device and does not interact with it, so it does not measure INP at all; Total Blocking Time during load is its nearest proxy. INP is measured across the whole visit on real devices, many of them much slower than the lab profile, with real data, third-party scripts, and extensions. A page can load quickly and still respond slowly to taps on filters twenty seconds later.
>
> **Find it.**
>
> 1. Get attribution from the field. Use the `web-vitals` attribution build to report, for each slow interaction, the target element, the interaction type, and the breakdown into input delay, processing duration, and presentation delay, together with long animation frame script attribution where it is available. Group by element to see which interactions are slow: for example "tap on a filter checkbox".
> 2. Reproduce in the lab. In the DevTools Performance panel with 4x to 6x CPU throttling, or better on a real mid-range Android phone through remote debugging, record that interaction with realistic data.
> 3. Read the trace. Long input delay means the main thread was busy with something else, such as third-party scripts, hydration, or timers. Long processing means your event handlers are slow, for example re-rendering the whole product grid or running synchronous filtering. Long presentation delay means the rendering work is large: big DOM, layout thrashing, expensive styles.
>
> **Fix it, according to the cause.**
>
> - Give feedback first, then do the work: update the checkbox at once and defer the expensive part by yielding (`scheduler.yield()`) or marking the update as a transition.
> - Do less work: memoise, render fewer items (pagination or virtualisation), avoid re-rendering unaffected components, and move heavy computation to the server or a worker.
> - Reduce rendering cost: a smaller DOM, `content-visibility` for off-screen sections, and no forced synchronous layout.
> - Shorten input delay: break up long tasks, and defer or remove third-party scripts.
>
> **Verify in the field.** Ship behind a flag to a percentage of users, compare INP at the 75th percentile for that interaction between the groups, then add a lab regression check, such as a scripted interaction under throttling, so it does not come back.

### 35. Explain the difference between last-write-wins and a CRDT for synchronising shared data, and give an example of an application where each is the right choice.

> **Last-write-wins.** Each value has a version or timestamp, and when two updates conflict, the later one replaces the earlier. It is simple to build and reason about, and it works well when edits are to small independent fields and conflicts are rare. Its weakness is that a concurrent edit is silently discarded: if two people edit the same paragraph, one person's work vanishes. It also depends on how "last" is decided, and client clocks cannot be trusted, so a server usually assigns the order. Applying it per property instead of per document reduces the damage a great deal: two people changing different properties of the same object both succeed.
>
> **CRDT.** A conflict-free replicated data type is a data structure designed so that replicas can apply operations independently, in any order, and still converge to the same state without a central arbiter. For text, each character has a unique identity and position relative to its neighbours, so concurrent insertions at the same place are both kept in a deterministic order. This gives automatic merging, offline editing for long periods, and peer-to-peer topologies. The costs are metadata that grows with history, more complex libraries, and the fact that convergence is not the same as intent: the merged result is consistent, but may not be what either user meant, so some conflicts still need a product decision.
>
> **When each fits.**
>
> - Last-write-wins per property: a settings page, a kanban card's fields, or a design tool's object properties (position, colour) with an always-online server ordering the updates. Simultaneous edits to the same property are rare, and "the later one wins" is what users expect.
> - CRDT: a collaborative text editor or notes application with offline support, where several people type in the same paragraph and devices may be disconnected for hours. Losing keystrokes is unacceptable, and there may be no moment at which a server can arbitrate.
>
> A strong answer notes that this is a spectrum, that presence (cursors) is ephemeral and should not go through either mechanism, and that the choice follows from the offline requirement and the granularity of the data.
