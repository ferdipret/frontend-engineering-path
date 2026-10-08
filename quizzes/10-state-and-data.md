# State Management and Data Fetching: Practice test

### 1. A product list page has a search box, a category filter, and pagination. Users complain that refreshing the page or sharing a link loses their filters. Where should that state live?

- [ ] In a global store such as Zustand or Redux, so it survives navigation
- [ ] In `localStorage`, restored on load
- [x] In the URL's search params, read by the components and used in the query key
- [ ] In a context provider at the root of the app

> State that defines what a view shows, and that should survive reload and be shareable, is URL state. A global store survives in-app navigation but not a reload or a shared link; `localStorage` restores your last filters on your device but does not make a link reproduce the view, and applies the same filters to every tab.

### 2. Which of these is server state?

- [ ] Whether the sidebar is collapsed
- [ ] The text the user has typed into an unsaved comment box
- [x] The list of comments on a post
- [ ] Which tab is selected in a settings dialog

> Server state is data owned by the backend that the client holds a possibly outdated copy of. The comment list can change without this client doing anything. The others are local UI or form state owned by the client (the selected tab might be URL state).

### 3. What is the problem with this state, and what is the fix?

```tsx
const [users, setUsers] = useState<User[]>([]);
const [selectedUser, setSelectedUser] = useState<User | null>(null);

// when a row is clicked:
setSelectedUser(user);
// when the list is refreshed:
setUsers(freshUsers);
```

- [ ] `users` should be in a ref because it is large
- [x] The selected user is a copy, so after a refresh it can show outdated data; store `selectedUserId` and derive the user from `users`
- [ ] `selectedUser` should be `undefined` rather than `null`
- [ ] Both should be combined in one `useState` object so they update together

> The same fact (a user's data) is stored twice. When `users` is replaced, `selectedUser` still points to the old object, and nothing removes it if that user was deleted. Storing only the ID and computing `users.find(u => u.id === selectedUserId)` during render keeps a single source of truth. Merging into one object does not remove the duplication.

### 4. How many distinct values can this type represent, and how many make sense? Rewrite it so that only meaningful states are representable.

```ts
type RequestState = {
  isLoading: boolean;
  isError: boolean;
  data: Order[] | null;
  errorMessage: string | null;
};
```

> Two booleans and two nullable fields give 2 × 2 × 2 × 2 = 16 combinations (ignoring the contents). Only about four are meaningful: idle, loading, success with data, error with a message. The rest are contradictions such as `isLoading` and `isError` both true, or data and an error message together, and each consumer has to guess what they mean. Use a discriminated union:
>
> ```ts
> type RequestState =
>   | { status: 'idle' }
>   | { status: 'loading' }
>   | { status: 'success'; data: Order[] }
>   | { status: 'error'; message: string };
> ```
>
> Now `data` exists only in `success` and TypeScript narrows on `status`, so no null checks or non-null assertions are needed, and a `switch` with a `never` default catches unhandled states. (If you want to model "has data and is refetching", add that explicitly, for example an `isRefetching` flag on the `success` variant.)

### 5. With this transition table, what is the state after the events `SUBMIT`, `SUBMIT`, `REJECT`, `RESET`, `RESOLVE`?

```ts
const transitions = {
  idle:       { SUBMIT: 'submitting' },
  submitting: { RESOLVE: 'success', REJECT: 'error' },
  success:    { RESET: 'idle' },
  error:      { SUBMIT: 'submitting', RESET: 'idle' },
};
const next = (state, event) => transitions[state][event] ?? state;
// initial state: 'idle'
```

- [ ] `success`
- [ ] `error`
- [ ] `submitting`
- [x] `idle`

> idle → SUBMIT → submitting. The second SUBMIT is not defined for `submitting`, so it is ignored (this is how a machine prevents double submission without a flag). REJECT → error. RESET → idle. RESOLVE is not defined for `idle`, so the state stays `idle`.

### 6. A context provides `{ user, cart, theme }` as one object from a single provider. A `ThemeToggle` component reads only `theme` from it. The user adds an item to the cart. What happens to `ThemeToggle`?

- [ ] Nothing; React tracks which properties each consumer reads
- [ ] It re-renders only if it is not wrapped in `memo`
- [x] It re-renders, because any change to the context value re-renders every consumer of that context
- [ ] It unmounts and remounts

> Context has no selectors. When the provided value changes by `Object.is`, every component that reads that context re-renders, regardless of which fields it uses, and `memo` does not block context updates. Split the context by concern, or use an external store with selectors.

### 7. This component re-renders on every store update (and with Zustand v5 may throw a "maximum update depth" error). Why, and what are two fixes?

```tsx
function Profile() {
  const { name, email } = useUserStore((s) => ({ name: s.name, email: s.email }));
  return <p>{name} ({email})</p>;
}
```

> The selector builds a new object each time it runs. The store hook compares the selector's result with the previous one by reference (`Object.is`), and a fresh object is never equal to the last, so the component is considered changed after every store update; because `useSyncExternalStore` requires a stable snapshot when nothing changed, it can loop. Fixes: (1) select primitives separately, `const name = useUserStore(s => s.name); const email = useUserStore(s => s.email);`, since strings compare by value; (2) wrap the selector with `useShallow` from `zustand/react/shallow`, which compares the object's top-level fields. In Redux the equivalents are separate `useSelector` calls, `shallowEqual`, or a memoised `createSelector`.

### 8. In TanStack Query v5 with default options, a component using `useQuery({ queryKey: ['todos'], queryFn })` unmounts and a minute later mounts again. What does the user see, and what happens on the network?

- [ ] A loading state, then data; the cache was cleared on unmount
- [ ] The cached data, and no request, because the data is still in the cache
- [x] The cached data immediately, plus a background refetch, because the data is stale
- [ ] An error, because the query was garbage collected

> The default `staleTime` is 0, so data is stale as soon as it arrives; a mount with stale data triggers a background refetch while the cached data is displayed (stale-while-revalidate). The entry is still there because `gcTime` defaults to five minutes. With `staleTime: 5 * 60_000` there would be no request.

### 9. What is the bug here?

```tsx
function useProject(projectId: string, includeArchived: boolean) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId, { includeArchived }),
  });
}
```

- [ ] `queryFn` must not close over variables; they must be read from the key
- [ ] The key should be a string, not an array
- [ ] `fetchProject` must be wrapped in `useCallback`
- [x] `includeArchived` affects the result but is not in the key, so both variants share one cache entry and toggling it does not refetch

> A query key must include every variable the query function depends on, like an effect's dependency array. Here toggling `includeArchived` leaves the key unchanged: no new fetch, and whichever variant was fetched first is served for both. The key should be `['project', projectId, { includeArchived }]`.

### 10. Explain the difference between `staleTime` and `gcTime`, and between `isPending` and `isFetching`.

> `staleTime` is how long fetched data is treated as fresh. While fresh, the automatic triggers (mount, window focus, reconnect) do not refetch it. After that it is stale: still served from the cache, but refetched in the background on those triggers. The default is 0. `gcTime` is how long a cache entry that no mounted component is using is kept in memory before it is deleted (default five minutes). It has nothing to do with freshness; it only affects whether there is anything to show instantly when the query is used again.
>
> `isPending` means the query has no data yet (status `pending`). `isFetching` means a request is in flight right now, which includes background refetches when data already exists. First load: both true (that combination is `isLoading`). Background refresh: `isPending` false, `isFetching` true, so you should keep showing the data and at most show a small indicator.

### 11. A team moves a product page from "`useQuery` in the component" to a route loader (or an async Server Component) with no client query library. Which capability do they lose unless they add something back?

- [ ] Having the data available on first render without a loading spinner
- [ ] Keeping API credentials out of the browser bundle
- [x] Automatic background refetching of that data while the user stays on the page, such as on window focus or on an interval
- [ ] Refreshing the page's data after a form submission handled by a route action

> Loaders and Server Components fetch per navigation (or per revalidation), so the data is as fresh as the last time the route loaded. A client query cache is what provides stale-while-revalidate behaviour, focus refetching, and polling during a long stay on one screen. The first two options are things framework loading gives you, and routers re-run loaders automatically after an action. If you need live data, prefetch in the loader and hand it to a client cache.

### 12. After a successful "add todo" mutation, the list on screen does not show the new item until the window is refocused. Which is the most appropriate fix?

```tsx
const addTodo = useMutation({ mutationFn: api.createTodo });
```

- [ ] Set `staleTime: 0` on the list query
- [x] Add `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] })`
- [ ] Call `window.location.reload()` in `onSuccess`
- [ ] Set `refetchInterval: 1000` on the list query

> The cache cannot know a write made its entries wrong; you tell it by invalidating the affected keys, which refetches active queries. `staleTime: 0` is already the default and only affects the automatic triggers (which is why refocusing "fixes" it). Polling every second or reloading are wasteful ways to hide the missing invalidation.

### 13. In this optimistic update, what is the purpose of the `cancelQueries` call?

```ts
onMutate: async (updated) => {
  await queryClient.cancelQueries({ queryKey: ['todos'] });
  const previous = queryClient.getQueryData(['todos']);
  queryClient.setQueryData(['todos'], (old) => old.map(t => t.id === updated.id ? updated : t));
  return { previous };
},
```

- [x] To stop an in-flight refetch from resolving afterwards and overwriting the optimistic value with older server data
- [ ] To abort the mutation if the user clicks twice
- [ ] To clear the cache so `setQueryData` can write to it
- [ ] To prevent the `onSettled` invalidation from running

> If a refetch of `['todos']` is already in flight, its response reflects the server before your write. When it lands, it would replace your optimistic data and the UI would flicker back to the old value until the next refetch. Cancelling outgoing queries for the key first prevents that. The snapshot (`previous`) is what `onError` uses to roll back.

### 14. A search box fetches results in an effect. Users report that after typing quickly, results for an earlier, shorter query sometimes replace the correct ones. Find the cause and fix the code.

```jsx
useEffect(() => {
  fetch(`/api/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(setResults);
}, [query]);
```

> Each change to `query` starts a new request without doing anything about the previous one. Responses can arrive in any order, so a slow response for "re" can land after the fast response for "react" and overwrite it. Abort (or ignore) the superseded request in the effect's cleanup, and handle HTTP errors while you are there:
>
> ```jsx
> useEffect(() => {
>   const controller = new AbortController();
>   fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
>     .then(res => {
>       if (!res.ok) throw new Error(`HTTP ${res.status}`);
>       return res.json();
>     })
>     .then(setResults)
>     .catch(err => {
>       if (err.name !== 'AbortError') setError(err);
>     });
>   return () => controller.abort();
> }, [query]);
> ```
>
> Debouncing would reduce the number of requests but does not remove the race. A query library with `query` in the key solves it structurally, because the component only ever reads the entry for the current key.

### 15. Which request is unsafe to retry automatically after a timeout, unless the API supports idempotency keys?

- [ ] `GET /orders/42`
- [ ] `PUT /orders/42` with the full order body
- [ ] `DELETE /orders/42`
- [x] `POST /orders`

> A timeout does not tell you whether the server processed the request. `GET` is safe, and `PUT` and `DELETE` are idempotent: repeating them leaves the same result. Repeating a `POST` that creates a resource can create a duplicate order. With an idempotency key the server can recognise the retry and return the original result.

### 16. Why add random jitter to exponential backoff?

- [ ] To make the total wait shorter on average for each client
- [ ] Because browsers throttle timers that fire at exact intervals
- [x] So that many clients that failed at the same moment do not all retry at the same moments and overload the recovering server together
- [ ] To prevent the retry from being served from the HTTP cache

> When a server hiccups, every client fails at once. With pure exponential backoff they all retry at 1 s, 2 s, 4 s in synchronised waves. Randomising the delay spreads the load over time. Jitter is about the herd, not the individual client.

### 17. What does this code log when the server responds with status 404 and a JSON body `{"message":"Not found"}`?

```js
async function load() {
  try {
    const res = await fetch('/api/items/999');
    const data = await res.json();
    console.log('ok', data.message);
  } catch (err) {
    console.log('failed', err.message);
  }
}
```

- [x] `ok Not found`
- [ ] `failed Not found`
- [ ] `failed 404`
- [ ] Nothing is logged

> `fetch` only rejects on network failure or abort. A 404 is a completed HTTP response, so execution continues, the body parses, and the success path runs with an error payload. Check `res.ok` and throw; otherwise a query library will cache the error body as if it were data and never show an error state or retry.

### 18. The API starts returning `"price": null` for discontinued products. What happens with each version of `fetchProduct`, and which is better?

```ts
type Product = { id: string; name: string; price: number };

// Version A
async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Product;
}

// Version B
const ProductSchema = z.object({ id: z.string(), name: z.string(), price: z.number() });

async function fetchProduct(id: string) {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ProductSchema.parse(await res.json());
}

// used in a component as: product.price.toFixed(2)
```

> In version A, `as Product` is an unchecked assertion. The function resolves successfully with an object whose `price` is `null` while its type says `number`. TypeScript reports nothing, the query succeeds, the bad value is cached, and the failure appears later and elsewhere: `product.price.toFixed(2)` throws `Cannot read properties of null` during render, which takes down the tree up to the nearest error boundary and tells you nothing about the cause.
>
> In version B, `parse` checks the data where it enters the program and throws an error that names the failing path (`price`: expected number, received null). The query ends in its error state, so the normal error UI and retry apply, monitoring gets a precise message, and no invalid data reaches the cache or components. The static type is inferred from the schema, so type and check cannot drift. B is better. The real fix is then to make the schema match reality (`price: z.number().nullable()`), at which point the compiler forces every use of `price` to handle `null`.

### 19. An endpoint returns 20 items per page, newest first. While a user is reading page 1, three new items are created. They then load page 2 using `?page=2&per_page=20`. What do they see, and how does cursor pagination avoid it?

> With offset pagination, "page 2" means "skip 20, take 20" over the list as it is now. Three new items at the top push everything down by three, so the first three items of page 2 are the last three the user already saw on page 1: duplicates. (Deletions cause the opposite: items skipped.) Cursor pagination asks for "20 items after this specific item" (`?after=<cursor>`), where the cursor encodes the last item's sort key. New items at the top do not change what comes after that item, so the next page is exactly the continuation. Cursors are also faster for deep pages because the database seeks by index instead of scanning and discarding rows. The trade-offs: no jumping to an arbitrary page and usually no total count.

### 20. You need to show the progress of a server-side export job that takes about a minute; the client never sends anything after starting it. Which transport is the most appropriate?

- [ ] A WebSocket, because it is the only option for server-initiated messages
- [x] Server-Sent Events, or simple polling every few seconds
- [ ] WebTransport, because it has the lowest latency
- [ ] A long `fetch` with `keepalive: true`

> Communication is one-directional and low-frequency. SSE gives a server-to-client stream over plain HTTP with automatic reconnection; polling a status endpoint every couple of seconds is even simpler and perfectly adequate here. A WebSocket adds bidirectional capability you do not need, along with reconnection, heartbeat, and infrastructure work you would have to do yourself.

### 21. An app stores its JWT access token in `localStorage` and attaches it to requests in an `Authorization` header. What is the main risk, and what is a safer arrangement?

- [ ] CSRF: other sites can make the browser send the token automatically
- [ ] The token is sent to every domain the page loads resources from
- [ ] `localStorage` is cleared when the tab closes, logging the user out
- [x] XSS: any script running on the page can read the token and send it elsewhere; an `HttpOnly` cookie cannot be read by JavaScript

> `localStorage` is readable by all JavaScript on the origin, so one injected script or compromised dependency can exfiltrate the token and use it from anywhere. A session ID or token in an `HttpOnly`, `Secure`, `SameSite` cookie is not readable by scripts. Cookies introduce CSRF, which `SameSite` and CSRF tokens address; a bearer token in a header is not vulnerable to CSRF, which is why the first option is the wrong risk. `localStorage` persists across tabs and restarts.

### 22. After an access token expires, a dashboard fires six requests that all receive 401. Describe what a correct refresh implementation does, and the bug a naive one has.

> A naive interceptor makes each failed request call the refresh endpoint itself. Six refreshes run concurrently; with refresh-token rotation, the first one invalidates the token the other five present, so they fail (and may trigger theft detection that revokes the whole session), logging the user out at random. Even without rotation it is wasted work and the requests race to store different tokens.
>
> The correct approach is single-flight: keep one shared promise for an in-progress refresh. The first 401 starts the refresh and stores the promise; every other 401 awaits the same promise. When it resolves, each request is replayed once with the new credentials (mark it so a second 401 does not loop). If the refresh fails, clear user state including cached queries, notify other tabs, and redirect to login with a return URL. Refreshing proactively shortly before expiry reduces how often this path runs but does not replace it.

### 23. A team mocks their API in tests with `vi.spyOn(globalThis, 'fetch').mockResolvedValue({ json: async () => data })`. What does switching to MSW give them?

- [ ] Faster tests, because MSW skips the network stack
- [ ] Automatic generation of mock data from TypeScript types
- [x] The real request path is exercised: URL, method, headers, body serialisation, status handling, and response parsing run as in production, and the same handlers work in the browser
- [ ] Nothing in tests; MSW is only useful in the browser

> A stubbed `fetch` returns the same fake object whatever URL or method was called, and the fake often lacks `ok`, `status`, and headers, so bugs in request construction and error handling go unnoticed. MSW intercepts at the network level, so handlers match on method and URL and return real `Response` objects. The handlers are reusable for development, Storybook, and end-to-end tests. It is not faster, and it does not generate data.

### 24. With a normalised GraphQL cache (for example Apollo Client), a mutation returns `{ updateIssue: { id: "7", __typename: "Issue", title: "New title" } }`. A list query and a detail query on screen both include issue 7. What happens, and what would be different if the mutation created a new issue?

> The cache stores each object once under an identifier built from `__typename` and `id` (`Issue:7`), and query results hold references to it. Writing the mutation response merges the new `title` into `Issue:7`, and every active query that references it re-renders with the new title, with no refetch and no invalidation code. This only works if the mutation selects `id` and the fields that changed.
>
> A newly created issue gets its own cache entry, but no existing list refers to it, and the cache cannot know which lists it belongs in or at what position (that depends on server-side filters and sorting). You must update the list field manually (`cache.modify` or an `update` function), or refetch the affected queries. Deletions have the same problem in reverse: evict the object or refetch.

### 25. Using the `undoable` history shape `{ past, present, future }`, what are `past`, `present`, and `future` after: start at `0`, apply `+1`, apply `+1`, undo, apply `+10`?

- [ ] past `[0, 1, 2]`, present `11`, future `[]`
- [ ] past `[0, 1]`, present `11`, future `[2]`
- [ ] past `[0]`, present `1`, future `[2, 11]`
- [x] past `[0, 1]`, present `11`, future `[]`

> After two increments: past `[0, 1]`, present `2`. Undo: past `[0]`, present `1`, future `[2]`. A new change pushes the present onto past and clears the redo stack: past `[0, 1]`, present `11`, future `[]`. Redo history is discarded whenever a new change is made, since it no longer follows from the current state.

### 26. You are adding offline support: a user can create items while offline and they are sent when the connection returns. Explain why each queued mutation needs a client-generated ID, and where the queue must be stored.

> The ID serves two purposes. First, idempotency: a request may have reached the server just before the connection dropped, with the response lost. The client cannot tell, so it must resend, and the server uses the ID (as the entity's ID or an idempotency key) to recognise the duplicate instead of creating the item twice. Second, references: later queued operations ("rename that item", "add a child to it") need to refer to an entity the server has not assigned an ID to yet, and the optimistic UI needs a stable key for it.
>
> The queue must be in durable storage, normally IndexedDB, not in memory or component state, because the user may close the tab or the browser may discard it before connectivity returns. Replay in order when back online, with backoff, treat `navigator.onLine` only as a hint, show pending and failed states in the UI, and decide how to handle conflicts when the server's data changed in the meantime (for example a version check with `If-Match` and a merge or prompt on `409`/`412`).
