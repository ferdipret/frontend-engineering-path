# State Management and Data Fetching: Guide

## Toolkit

### DevTools and tooling

The **Network panel** is your primary instrument. Filter by `Fetch/XHR`, click a request, and read Headers (status, `Cache-Control`, `Set-Cookie`, CORS headers), Payload, Response, and Timing. Use the throttling dropdown ("Slow 4G", "Offline", or a custom profile) to make loading states and races visible, right-click a request to *Block request URL* to simulate failure, and use *Copy as fetch* or *Copy as cURL* to replay one. Tick "Preserve log" across navigations. The *WS* filter shows WebSocket frames; an `EventSource` connection has an *EventStream* tab listing each event.

The **Application panel** shows what is persisted: Local and Session Storage, IndexedDB, Cookies (with their `HttpOnly`, `Secure`, `SameSite` flags), Cache Storage, and Service Workers, where MSW's worker appears. "Clear site data" resets everything when you test rehydration and migrations.

**TanStack Query DevTools** (`@tanstack/react-query-devtools`) render a floating panel listing every query with its key, status (fresh, stale, fetching, paused, inactive), data, and observer count, with buttons to refetch, invalidate, reset, and trigger loading or error states for a query. It is the quickest way to answer "why did this refetch" and "is this key what I think it is".

**Redux DevTools** shows each dispatched action, the state diff it produced, and lets you time-travel. It works with Redux Toolkit out of the box and with Zustand through its `devtools` middleware.

**React DevTools Profiler** with "Record why each component rendered" tells you whether a store or context change re-rendered more than it should.

For modelling, the **Stately** visual editor and the XState inspector draw a machine and show the live state and events. For APIs: **GraphiQL** or Apollo Sandbox to explore a GraphQL schema, **Swagger UI** or Scalar for OpenAPI documents, `openapi-typescript` to generate types, and `curl` or Bruno for manual requests. **MSW** (`npx msw init public/`) intercepts requests at the network level, so mocked calls still show up in the Network panel.

### Testing and verifying your work

Test state logic at the level where it lives. Reducers, selectors, state machines, and URL-parsing functions are pure: unit test them directly with tables of inputs and outputs, with no rendering. For a machine, assert that each event in each state leads to the expected next state, and that forbidden transitions are ignored.

Test data-fetching components as integration tests: render the component with a real `QueryClient` (create a new one per test, with `retry: false` so failures surface immediately and `gcTime: Infinity` to avoid timers lingering) and mock the network with MSW rather than mocking `fetch` or your hooks. Then your test exercises the real URL, method, headers, and parsing.

```ts
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/todos', () => HttpResponse.json([{ id: 1, title: 'Write tests' }])),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('shows an error state', async () => {
  server.use(http.get('/api/todos', () => new HttpResponse(null, { status: 500 })));
  renderWithClient(<TodoList />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i);
});
```

For every asynchronous view, cover loading, success, empty, and error, plus the mutation paths: success, failure with rollback, and the pending state. Use `delay()` from MSW to hold a response open while you assert on the pending UI.

Manual checks that catch what tests miss: throttle to Slow 4G and click quickly between items (races); go offline mid-mutation; open two tabs (stale data, auth changes, persisted-state conflicts); reload on every screen and use Back and Forward (URL state); change the persisted schema and reload with old data in storage (migrations); let the access token expire (refresh flow).

"Done" means every view handles all four async states, the URL reproduces the view, no state is stored twice, writes update or invalidate every affected query, and nothing flashes or shows data from a previous selection.

### Tricks and gotchas

- Classify before you choose a tool. Most "we need a state library" problems are server state, and vanish once a query library owns it.
- `staleTime` defaults to `0` in TanStack Query: cached data is shown instantly but refetched on every mount and window focus. Set a sensible global default (even 30 to 60 seconds) instead of turning refetch flags off one by one.
- `staleTime` is how long data is considered fresh; `gcTime` is how long *unused* data stays in memory. They are unrelated.
- Query keys are dependency arrays. Every variable the query function uses must be in the key, or two different requests share one cache entry.
- Never copy query data into `useState` to "have it locally". You now have two sources of truth and the copy will not receive background updates. Derive with `select` or in render.
- `isPending` means "no data yet"; `isFetching` means "a request is in flight", including background refetches. Show a skeleton for the first and at most a subtle indicator for the second.
- `fetch` does not reject on 404 or 500. Check `response.ok` and throw, or your query library will treat errors as successes.
- In optimistic updates, cancel in-flight queries for the key first (`queryClient.cancelQueries`), or a slow refetch will overwrite your optimistic value.
- A Zustand selector that returns a new object or array each call re-renders every time, and can loop. Select primitives, or wrap with `useShallow`.
- Do not put non-serialisable values (class instances, promises, DOM nodes, functions) in a Redux store or anything you persist.
- Version persisted state from day one. Old data in a user's `localStorage` will outlive every assumption in your code.
- Debounce the request, not the input. The text field updates on every keystroke; the query key uses a debounced or deferred copy.
- An access token in `localStorage` is readable by any script on the page, including a compromised dependency. Prefer `HttpOnly` cookies.
- Client-side route guards are a user experience feature. The server must authorise every request.

### Official references

- [TanStack Query: Overview](https://tanstack.com/query/latest/docs/framework/react/overview) — the main query library docs; read "Important Defaults" and the Guides section in order.
- [TkDodo: Practical React Query](https://tkdodo.eu/blog/practical-react-query) — the maintainer's blog series; the best explanation of the mental model.
- [SWR: Getting Started](https://swr.vercel.app/docs/getting-started) — the lighter alternative from Vercel.
- [Redux: Style Guide](https://redux.js.org/style-guide/) — the official rules and recommendations for Redux code.
- [Redux Toolkit: Getting Started](https://redux-toolkit.js.org/introduction/getting-started) — the standard way to write Redux today.
- [Zustand: Introduction](https://zustand.docs.pmnd.rs/learn/getting-started/introduction) and [Jotai: Documentation](https://jotai.org/docs) — small external store libraries.
- [Stately: XState docs](https://stately.ai/docs/xstate) — state machines and the actor model.
- [react.dev: Managing State](https://react.dev/learn/managing-state) — state structure, lifting, reducers, and context.
- [MSW: Documentation](https://mswjs.io/docs/) — API mocking in the browser and in Node.
- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) and [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) — methods, status codes, caching, and conditional requests.
- [GraphQL: Learn](https://graphql.org/learn/) — the query language and type system.
- [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) and [MDN: Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) — the real-time transports.

## Skills

### Classify state

Before choosing a tool, decide what kind of state you are dealing with. Each kind has a natural home, and most state-management pain comes from putting state in the wrong one.

| Kind | What it is | Where it belongs |
| --- | --- | --- |
| Server cache | Data owned by the backend that you hold a copy of: users, orders, search results | A query library or framework loader |
| URL state | What identifies this view: route params, filters, sort, page, selected tab, open item | The URL (path and search params) |
| Form state | Values, touched and dirty flags, validation errors, submission status | The form: the DOM, a form library, or local state |
| Local UI state | Open/closed, hover, the active accordion panel, a draft in one widget | `useState`/`useReducer` in the component that uses it |
| Global client state | Client-owned and needed in distant places: theme, sidebar collapsed, a multi-step selection, a client-side cart | Context for low-frequency values, an external store otherwise |

Some ask a sixth: *browser and device state* such as online status, media queries, and permissions. Subscribe to those with `useSyncExternalStore` rather than copying them.

Questions that classify quickly. Who owns the truth: the server or this client? Should a reload or a shared link reproduce it? How many components need it and how far apart are they? How often does it change? Does it need to survive the session?

The classic mistake is treating everything as global client state: fetching in an effect, dispatching the result into a global store, and then hand-writing loading flags, caching, deduplication, and invalidation. Once server data moves to a query cache and view parameters move to the URL, what is left for a global store is usually a handful of values, and sometimes nothing.

The opposite mistake also happens: storing the selected filter in component state so it is lost on refresh, or pushing ephemeral UI state (a tooltip's open flag) into a global store where every change notifies the application.

**Try it:** Open an application you have built and list every `useState`, context, and store field in a spreadsheet. Label each with one of the five kinds and with where it currently lives. Mark every mismatch, and pick the two that cause the most code to exist.

**Resources**
- [react.dev: Managing State](https://react.dev/learn/managing-state)
- [TanStack Query: Does TanStack Query replace client state managers?](https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state)
- [TkDodo: React Query as a State Manager](https://tkdodo.eu/blog/react-query-as-a-state-manager)

### URL as state

If a user would expect a view to survive a reload, be bookmarkable, or be shareable by copying the address bar, the state that defines it belongs in the URL: search text, filters, sort order, page, selected tab, the ID of an open item or modal. The URL becomes the single source of truth and components read from it instead of keeping their own copy.

```tsx
import { useSearchParams } from 'react-router';

function ProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get('sort') ?? 'newest';
  const page = Number(searchParams.get('page') ?? '1');

  function changeSort(next: string) {
    setSearchParams(prev => {
      prev.set('sort', next);
      prev.delete('page'); // new sort, back to page 1
      return prev;
    });
  }
  // …
}
```

Decisions that matter:

- **Push or replace.** Changing a tab or page should add a history entry so Back undoes it. Typing in a search box should *replace* the entry, or Back steps through every keystroke.
- **Treat it as untrusted input.** Anyone can edit a URL. Parse and validate every param (a schema works well), clamp numbers, and fall back to defaults rather than crashing.
- **Everything is a string.** Decide how you encode numbers, booleans, dates, and arrays (`?tag=a&tag=b` with `getAll` is the standard form) and keep it consistent.
- **Omit defaults** so URLs stay short and canonical, and reset dependent params (page) when a filter changes.
- **Debounce writes** from text inputs: keep the keystroke state local for responsiveness and commit to the URL after a pause.
- **Use the same parsed values as your query key**, so the URL drives the data: change the URL, the key changes, the right data loads.

Do not put secrets or personal data in URLs; they end up in history, logs, and `Referer` headers. Path segments suit identity (`/orders/123`), search params suit optional view state, and the hash is not sent to the server. Typed helpers exist: `nuqs` for React frameworks, and TanStack Router has validated, typed search params built in. Without a router, the primitives are `URLSearchParams`, `history.pushState`/`replaceState`, and the `popstate` event.

**Try it:** Build a filterable list where search text, a category select, sort, and page all live in search params. Then verify: reload reproduces the view, Back undoes a filter but not individual keystrokes, a hand-edited `?page=abc` falls back to page 1, and opening the copied URL in a private window shows the same thing.

**Resources**
- [MDN: URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [React Router: useSearchParams](https://reactrouter.com/api/hooks/useSearchParams)
- [MDN: Working with the History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)

### Single source of truth

Every fact your UI depends on should be stored in exactly one place. Everything else that needs it reads from that place or derives from it. When the same fact is stored twice, the copies must be kept in sync by code, and any path that updates one and not the other produces a screen that contradicts itself.

The forms duplication takes:

- **Derived data stored as state**: `items` and `itemCount`, `firstName`/`lastName` and `fullName`. Compute it.
- **A copied object instead of a reference**: storing `selectedUser` (the whole object) next to `users`. When the list refreshes, the selection is stale. Store `selectedUserId` and look it up.
- **Props mirrored into state**: `useState(props.value)` ignores later prop changes. Either the parent owns it (controlled) or the child does (with an `initialValue` prop and a `key` to reset).
- **Server data copied into a client store or `useState`**: the query cache already holds it. A second copy never sees background refetches.
- **URL state mirrored into component state**: read the URL directly.
- **The same entity nested in several places**: a post's author object embedded in fifty posts. Normalise: keep entities in a map by ID and reference them by ID.

```ts
// before: two places must agree
const [todos, setTodos] = useState<Todo[]>([]);
const [selected, setSelected] = useState<Todo | null>(null);

// after: one fact, one derivation
const [todos, setTodos] = useState<Todo[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);
const selected = todos.find(t => t.id === selectedId) ?? null;
```

The derived version also handles deletion for free: if the selected to-do is removed, `selected` becomes `null` with no extra code.

There is one legitimate, deliberate fork: a *draft*. An edit form copies server data so the user can change it without affecting the saved version. Make the fork explicit, with a clear moment it is created (opening the form, or a `key` change) and a clear moment it is merged back (save) or discarded (cancel).

A useful test for any state variable: "if this changed, what else would have to change with it?" If the answer is another state variable, one of them should be derived.

**Try it:** Build a list with a detail panel where the list refetches every five seconds from a mock API that changes item titles. Store the selected *object* first and watch the panel go stale; switch to storing the ID and deriving.

**Resources**
- [react.dev: Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- [Redux: Normalizing State Shape](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape)

### State machines

A finite state machine describes behaviour as a fixed set of states, the events that can occur, and for each state which events cause a transition to which next state. The system is in exactly one state at a time, and an event that is not listed for the current state does nothing. That last property is the point: instead of guarding every handler with `if (!isLoading && !hasSubmitted && …)`, illegal sequences are simply not in the table.

You do not need a library. A reducer keyed on the current state is a state machine:

```ts
type State = 'idle' | 'submitting' | 'success' | 'error';
type Event = 'SUBMIT' | 'RESOLVE' | 'REJECT' | 'RESET';

const transitions: Record<State, Partial<Record<Event, State>>> = {
  idle:       { SUBMIT: 'submitting' },
  submitting: { RESOLVE: 'success', REJECT: 'error' },
  success:    { RESET: 'idle' },
  error:      { SUBMIT: 'submitting', RESET: 'idle' },
};

const reducer = (state: State, event: Event): State => transitions[state][event] ?? state;
```

A second `SUBMIT` while `submitting` is ignored without any flag.

**XState** (v5) adds what the table lacks: *context* (extended data such as the error or retry count), *guards* (conditional transitions), entry/exit *actions*, *invoked actors* (a promise or subscription that runs while in a state and is cancelled on exit), delayed transitions, and *statecharts*: hierarchical and parallel states that prevent the state explosion you get when modelling independent concerns in one flat list. You define machines with `setup({ types, actions, guards, actors }).createMachine({…})`, run them with `createActor(machine).start()`, and use `useMachine` or `useActor` from `@xstate/react`. Machines can be visualised and simulated in Stately's editor, which makes them good documentation for designers and QA.

Use a machine for flows with real sequencing: multi-step forms, checkout, authentication, media players, drag and drop, connection management with reconnects, upload with pause and resume. Do not use one for a boolean toggle or for plain server data. Drawing the states and arrows on paper before coding is worthwhile even when you implement it with `useReducer`.

**Try it:** Model a file upload with states `idle`, `uploading`, `paused`, `done`, and `failed`, and events `START`, `PAUSE`, `RESUME`, `PROGRESS`, `FINISH`, `FAIL`, `RETRY`. Implement it as a transition table, write tests that every unlisted event leaves the state unchanged, then rebuild it in XState and view it in the visualiser.

**Resources**
- [Stately: XState docs](https://stately.ai/docs/xstate)
- [Stately: Setup API](https://stately.ai/docs/setup)
- [Statecharts.dev: What is a statechart?](https://statecharts.dev/)

### Make impossible states impossible

If your types allow a combination of values that should never occur, some code path will eventually produce it. The usual offender is several booleans describing one thing:

```ts
type State = {
  isLoading: boolean;
  isError: boolean;
  data?: User;
  error?: Error;
};
```

Three independent fields give this type sixteen or so shapes, of which four are meaningful. What does `isLoading: true, isError: true` render? What stops `data` and `error` both being set? Every component has to decide, and they decide differently.

Model the states as a discriminated union instead: one literal field that says which state you are in, and each variant carrying only the data that exists in that state.

```ts
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };

function View({ state }: { state: State }) {
  switch (state.status) {
    case 'idle':    return null;
    case 'loading': return <Spinner />;
    case 'success': return <Profile user={state.data} />; // data is User, not User | undefined
    case 'error':   return <ErrorMessage error={state.error} />;
    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
}
```

TypeScript narrows on `status`, so `state.data` only exists where it is real, with no optional chaining and no non-null assertions. The `never` assignment makes the compiler fail when someone adds a fifth state and forgets a branch.

The same idea applies beyond async status. Component props: `{ variant: 'link'; href: string } | { variant: 'button'; onClick: () => void }` instead of two optional props that might both be missing. A modal: `{ kind: 'closed' } | { kind: 'editing'; itemId: string }` instead of `isOpen` plus a nullable ID. A selection of none, one, or many.

Be realistic about what "state" means, though. A query result that has data *and* is refetching is a legitimate combination; TanStack Query models it as two orthogonal axes (`status` for the data, `fetchStatus` for the request). The aim is not the fewest states, it is that every representable value means something.

**Try it:** Find a component with two or more related booleans (`isOpen`/`isEditing`/`isSaving` is typical). Write out the truth table, cross out the rows that should never happen, and replace the booleans with a union containing only the remaining rows. Let the compiler errors lead you through the refactor.

**Resources**
- [TypeScript Handbook: Discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [TypeScript Handbook: Exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
- [react.dev: Choosing the State Structure: Avoid contradictions in state](https://react.dev/learn/choosing-the-state-structure#avoid-contradictions-in-state)

### Context limits

Context is a way to pass a value down the tree without props. It is not a store, and it has one property that limits it as a state manager: when a provider's value changes, **every** component that reads that context re-renders. There are no selectors. A component that uses only `state.user.name` re-renders when `state.cart` changes, and `memo` does not prevent it because the update comes through context, not props.

When this becomes a real problem:

- **One big context** holding unrelated values, so any change re-renders all consumers.
- **High-frequency updates**: text input, pointer position, drag state, scroll offset, timers. Dozens of updates a second multiplied by every consumer.
- **Unstable values**: `<Ctx value={{ user, logout }}>` creates a new object on every render of the provider's parent, so consumers re-render even when nothing changed.
- **Many consumers of one changing value**, such as hundreds of table cells reading a "selected cell" context: selecting one re-renders all of them.

Mitigations, in order. Memoise the value, or rely on the React Compiler to do so. Split contexts by concern and by rate of change; the standard split is state in one context and `dispatch` or actions (which are stable) in another, so components that only trigger changes never re-render. Move the provider down so it wraps only the subtree that needs it. Keep state out of context altogether by passing JSX as `children`.

When those are not enough, you need subscriptions with selectors, and that means an external store: Zustand, Jotai, Redux, or your own with `useSyncExternalStore`. A useful hybrid is to put the *store instance* in context (it never changes, so there are no context re-renders) and subscribe to slices of it with selectors. That gives you scoping and testability from context, and precise updates from the store.

Context remains the right tool for values that change rarely and are needed widely: theme, locale, the authenticated user, feature flags, and wiring between compound component parts.

**Try it:** Render a 30 by 30 grid of cells that each read `{ hoveredId, setHoveredId }` from a context and highlight when hovered. Profile moving the mouse across it. Then replace the context with a Zustand store and a selector `s => s.hoveredId === id` per cell, and profile again.

**Resources**
- [react.dev: useContext: Optimizing re-renders when passing objects and functions](https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions)
- [react.dev: Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [react.dev: useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)

### External stores

An external store holds state outside the React tree and lets components subscribe to parts of it. That gives you what context lacks: updates reach only the components whose selected slice changed, state can be read and written outside components (in event buses, route loaders, tests), and logic is not tied to a component's lifetime.

**Zustand**: one small store per concern, a hook with a selector, almost no ceremony.

```ts
import { create } from 'zustand';

type CartState = {
  items: Record<string, number>;
  add: (id: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()((set) => ({
  items: {},
  add: (id) => set((s) => ({ items: { ...s.items, [id]: (s.items[id] ?? 0) + 1 } })),
  clear: () => set({ items: {} }),
}));

// in a component: re-renders only when this one count changes
const count = useCart((s) => s.items[productId] ?? 0);
```

**Jotai**: bottom-up *atoms*. Each atom is a small piece of state; derived atoms compute from others and form a dependency graph. Components subscribe to exactly the atoms they read. It suits state made of many small interdependent pieces (an editor, a spreadsheet, complex filters), at the cost of the state being spread across many definitions.

**Redux Toolkit**: one store, updated only by dispatched actions through reducers. More structure and more code, in exchange for predictability at scale: every change is a named, serialisable event you can log, replay, and inspect in Redux DevTools; conventions that large teams share; middleware; and RTK Query for server data.

How to choose. First remove server state (query library) and URL state from the picture. If little remains, React state and a bit of context are enough. For modest shared client state, Zustand is the low-friction default. Choose Redux Toolkit when many people touch complex client-side logic and you value enforced structure and tooling, or when the codebase already uses it. Choose Jotai when state is naturally atomic and heavily derived. Signal-based stores (Preact Signals, Valtio's proxies) and XState's store are further options. All of these integrate with React through `useSyncExternalStore`, and none is a substitute for deciding where state should live.

**Try it:** Implement a cart (add, remove, quantity, total) three times: with context and `useReducer`, with Zustand, and with a Redux Toolkit slice. Compare lines of code, what re-renders when one item's quantity changes (use the Profiler), and how you would test each.

**Resources**
- [Zustand: Introduction](https://zustand.docs.pmnd.rs/learn/getting-started/introduction)
- [Jotai: Core: atom](https://jotai.org/docs/core/atom)
- [Redux Toolkit: Quick Start](https://redux-toolkit.js.org/tutorials/quick-start)

### Redux concepts

Redux is one store holding one state tree that can only change in one way. You will meet it in many existing codebases, so learn both the model and its two eras.

The model: the **store** holds state. To change it you **dispatch** an **action**, a plain object with a `type` (and usually a `payload`) describing what happened. A **reducer**, a pure function `(state, action) => newState`, calculates the next state without mutating. **Selectors** are functions that read and derive values from state. **Middleware** sits between dispatch and the reducers and is where side effects go: thunks (functions that dispatch, used for async work), listeners, logging.

Modern Redux uses **Redux Toolkit**:

```ts
import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

const todosSlice = createSlice({
  name: 'todos',
  initialState: [] as Todo[],
  reducers: {
    todoAdded(state, action: PayloadAction<Todo>) {
      state.push(action.payload); // Immer turns this "mutation" into an immutable update
    },
    todoToggled(state, action: PayloadAction<string>) {
      const todo = state.find(t => t.id === action.payload);
      if (todo) todo.done = !todo.done;
    },
  },
});

export const { todoAdded, todoToggled } = todosSlice.actions;
export const store = configureStore({ reducer: { todos: todosSlice.reducer } });
```

Components use `useSelector(selectTodos)` and `useDispatch()` from `react-redux`.

**Legacy Redux** (before roughly 2019) looks different, and you should be able to read it: action type constants (`const ADD_TODO = 'ADD_TODO'`), hand-written action creators, reducers as `switch` statements with nested spreads, `combineReducers`, `createStore` with `applyMiddleware(thunk)`, and components wired with `connect(mapStateToProps, mapDispatchToProps)(Component)` instead of hooks. Async work may be in thunks, in `redux-saga` (generator functions with `take`, `call`, `put`), or in `redux-observable` (RxJS). To find your way around: locate where the store is created, list the reducers passed to `combineReducers` to learn the state shape, then follow one feature from the component's `connect` or `useSelector`, to the action it dispatches, to the reducer case, to any middleware that reacts.

The official style guide's key rules: do not mutate state, keep state and actions serialisable, put logic in reducers, model actions as events rather than setters, normalise entities, and keep server data in RTK Query (or another query library) rather than hand-written thunks.

**Try it:** Open the Redux DevTools on a site that uses Redux (or the official counter template from `npx degit reduxjs/redux-templates/packages/vite-template-redux my-app`). Perform an action, read the dispatched action and the state diff, and jump back in time. Then convert one `switch` reducer written in legacy style to `createSlice`.

**Resources**
- [Redux: Redux Essentials, Part 1: Overview and Concepts](https://redux.js.org/tutorials/essentials/part-1-overview-concepts)
- [Redux: Style Guide](https://redux.js.org/style-guide/)
- [Redux: Migrating to Modern Redux](https://redux.js.org/usage/migrating-to-modern-redux)

### Selectors and subscriptions

A store notifies subscribers whenever anything in it changes. A selector is how a component says which part it cares about: the hook runs your selector after every store update, compares the result with the previous result, and re-renders the component only if they differ. The default comparison is reference equality (`===` in react-redux, `Object.is` in Zustand).

Two consequences follow directly.

*Select as little as possible.* `const state = useStore()` or `useSelector(s => s)` subscribes to everything. `useStore(s => s.user.name)` re-renders only when the name changes.

*A selector that builds a new object or array returns a "different" result every time.*

```ts
// re-renders on every store change, and in Zustand v5 can cause an infinite loop
const { name, email } = useUserStore(s => ({ name: s.name, email: s.email }));
const active = useSelector(s => s.todos.filter(t => !t.done));
```

Fixes: call the hook once per primitive (`const name = useUserStore(s => s.name)`), which is the simplest and often the best; use a shallow comparison (`useShallow` in Zustand, `shallowEqual` as the second argument to `useSelector`); or memoise the derivation so it returns the same reference when its inputs are unchanged. Reselect's `createSelector`, re-exported by Redux Toolkit, does this:

```ts
const selectTodos = (s: RootState) => s.todos;
const selectActiveTodos = createSelector([selectTodos], todos => todos.filter(t => !t.done));
```

The input selectors run on every call and must be cheap; the result function runs only when an input changes. A default memoised selector has a cache of one, so a parameterised selector shared by many components with different arguments thrashes; create one selector instance per component or use a selector factory.

Good practice beyond performance: keep the store minimal and derive everything else in selectors; define selectors next to the store so components do not know its shape; and for lists, have the parent select an array of IDs and let each row select its own item by ID, so changing one item re-renders one row. Selectors run very often, so keep them pure and fast, and never let them return something that depends on anything other than their arguments. TanStack Query's `select` option is the same idea applied to cached server data.

**Try it:** In a Zustand or Redux app, write a selector returning `s.items.filter(...)` and log renders while an unrelated field changes. Fix it three ways (primitive selections, shallow equality, memoised selector) and confirm each with the Profiler.

**Resources**
- [Redux: Deriving Data with Selectors](https://redux.js.org/usage/deriving-data-selectors)
- [Zustand: useShallow](https://zustand.docs.pmnd.rs/reference/hooks/use-shallow)
- [React Redux: Hooks](https://react-redux.js.org/api/hooks)

### Persistence

Persisting state means writing it somewhere that outlives the page (`localStorage`, `sessionStorage`, IndexedDB) and reading it back on load, which is called rehydration. The writing is easy. The difficulty is that the data you read back was written by an *older version of your code*, possibly months ago, possibly edited or corrupted, and your new code must cope.

Rules that keep this safe:

- **Persist the minimum.** Preferences, drafts, a client-side cart. Not server data (refetch it), not derived data, not transient UI state, and never secrets or tokens.
- **Version it and migrate.** Store a version number with the data. On load, if the version is older, run migrations step by step; if it is unknown or migration fails, discard and fall back to defaults.
- **Validate on read.** Wrap `JSON.parse` in `try`/`catch` and check the shape with a schema. Treat storage as untrusted input.
- **Writes can fail.** `setItem` throws when the quota is exceeded and in some private modes. Catch it.
- **JSON loses types.** `Date` becomes a string, `Map`, `Set`, and `undefined` do not survive. Convert explicitly.

Zustand's `persist` middleware covers most of this:

```ts
export const useSettings = create<Settings>()(
  persist(
    (set) => ({ theme: 'system', density: 'comfortable', setTheme: (theme) => set({ theme }) }),
    {
      name: 'settings',
      version: 2,
      partialize: (s) => ({ theme: s.theme, density: s.density }),
      migrate: (persisted: any, version) => {
        if (version < 2) persisted.density = persisted.compact ? 'compact' : 'comfortable';
        return persisted;
      },
    },
  ),
);
```

Other things to handle. `localStorage` is synchronous and blocks the main thread, so keep it small and throttle writes; use IndexedDB (through `idb-keyval` or similar) for anything large. With server rendering, the server cannot see browser storage, so the first client render must match the server's HTML and the stored value is applied afterwards, or you get a hydration mismatch; for theme, an inline script that sets a class before paint avoids a flash. Other tabs can change the same key: listen for the `storage` event or use `BroadcastChannel`. Clear user-specific persisted state on logout. Query libraries can persist their cache too (TanStack Query's `persistQueryClient`), with a `buster` string playing the role of the version.

**Try it:** Persist a settings store at version 1. Reload and confirm it rehydrates. Change the shape (rename a field), bump the version, and write the migration. Then hand-edit the stored JSON in the Application panel to something invalid and make sure the app starts with defaults rather than crashing.

**Resources**
- [Zustand: persist middleware](https://zustand.docs.pmnd.rs/reference/middlewares/persist)
- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

### Server state is a cache

Data you fetch from an API is not your application's state. The truth lives in a database you do not control; other users, other tabs, and background jobs change it without telling you. What the client holds is a **snapshot** taken at some moment, and it starts ageing immediately. Thinking of it as a cache rather than as state changes the questions you ask.

With client state you ask "what is the value?". With a cache you ask: how old is this copy and is that acceptable? When should I refresh it? Who else is asking for the same thing right now, and can we share one request? What do I show while refreshing? After I write, which cached entries are now wrong? When can I throw this away?

The older approach treated fetched data as owned state: fetch in an effect, put the result in a global store, add `isLoading` and `error` fields by hand. That leaves all of those questions unanswered. The data is fetched once and trusted forever, or refetched on every mount with a spinner. Two components that need the same data either duplicate the request or depend on a third to have loaded it. Nothing updates when the user returns to the tab an hour later.

A query library is a purpose-built cache that answers them: entries identified by a key, deduplication of concurrent requests, a freshness policy, **stale-while-revalidate** (show the cached copy immediately and refresh it in the background), refetching on triggers like window focus and reconnect, garbage collection of unused entries, and explicit invalidation after writes.

Practical consequences. Do not copy query data into `useState` or a store; read it from the cache wherever it is needed, and calling the same hook in ten components is fine because they share one entry and one request. Do not "edit" cached data in place as if you owned it; send a mutation, then invalidate or update the cache from the server's response. Transform with `select` or during render rather than storing a transformed copy. And decide freshness per kind of data: a list of countries can be fresh for a day, an account balance perhaps not at all.

**Try it:** Fetch a list with `useEffect` and `useState` in two sibling components and count the requests in the Network panel. Replace both with one `useQuery` hook sharing a key. Then switch to another tab for a minute, change the data on the server (or in your mock), return, and watch the background refetch.

**Resources**
- [TanStack Query: Overview](https://tanstack.com/query/latest/docs/framework/react/overview)
- [TkDodo: React Query as a State Manager](https://tkdodo.eu/blog/react-query-as-a-state-manager)
- [web.dev: Keeping things fresh with stale-while-revalidate](https://web.dev/articles/stale-while-revalidate)

### Query libraries

TanStack Query and SWR implement the server cache. You give them a **key** that identifies the data and a function that fetches it; they give you the cached data, status, and automatic refetching.

```tsx
import { queryOptions, useQuery } from '@tanstack/react-query';

const todosQuery = (filters: Filters) =>
  queryOptions({
    queryKey: ['todos', 'list', filters],
    queryFn: ({ signal }) => fetchTodos(filters, signal),
    staleTime: 60_000,
  });

function Todos({ filters }: { filters: Filters }) {
  const { data, isPending, isError, error, isFetching } = useQuery(todosQuery(filters));
  // …
}
```

**Keys** are arrays, hashed deterministically (object key order does not matter). The key must contain everything the query function depends on: change `filters` and you get a different cache entry and a fetch, exactly like an effect's dependency array. Structure keys from general to specific (`['todos', 'list', filters]`, `['todos', 'detail', id]`) so you can invalidate a whole group by prefix. Defining options once with `queryOptions` keeps key and function together and typed for reuse in `useQuery`, prefetching, and `setQueryData`.

**`staleTime`** is how long fetched data counts as fresh. The default is `0`: data is stale at once. Stale data is still returned from the cache immediately, but it is refetched in the background on the triggers: a component using the query mounts, the window regains focus, the network reconnects, or the key is invalidated. Fresh data is never refetched by those triggers. Most "why does it keep refetching" questions are answered by setting an appropriate `staleTime`, globally and per query. **`gcTime`** (default five minutes) is different: how long an entry with no mounted observers is kept before being deleted.

**Status** has two axes. `status` (`pending`, `error`, `success`) is about whether you have data; `fetchStatus` (`fetching`, `paused`, `idle`) is about the request. `isLoading` is `isPending && isFetching`: the first load. Other essentials: `enabled: false` (or `skipToken`) for dependent queries, `select` to transform or pick part of the data, `placeholderData: keepPreviousData` to avoid a flash when the key changes, `refetchInterval` for polling, and `useSuspenseQuery` to integrate with Suspense. Failed queries retry three times with backoff by default. Your `queryFn` must throw on failure, so check `response.ok`.

SWR offers the same core model with a smaller API: `useSWR(key, fetcher)`, deduplication, focus and reconnect revalidation, and `mutate` for updates. TanStack Query has more for mutations, infinite queries, and fine-grained cache control.

**Try it:** Add the TanStack Query DevTools to an app. With the default `staleTime`, mount and unmount a component and switch windows, watching the refetches. Set `staleTime: 60_000` and repeat. Then leave a variable out of a query key on purpose and observe the wrong data being shown.

**Resources**
- [TanStack Query: Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [TanStack Query: Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [SWR: Getting Started](https://swr.vercel.app/docs/getting-started)

### Framework data loading

A client query library fetches after a component renders. Frameworks can fetch *before* or *while* rendering, tied to the route, and for many applications that replaces a client-side cache altogether.

**Route loaders** (React Router in framework mode, TanStack Router, and others) attach a function to each route. On navigation the router runs the loaders for every matching route segment in parallel, then renders with the data already available:

```tsx
// app/routes/product.tsx (React Router framework mode)
import type { Route } from './+types/product';

export async function loader({ params }: Route.LoaderArgs) {
  const product = await db.getProduct(params.pid);
  if (!product) throw new Response('Not found', { status: 404 });
  return product;
}

export default function Product({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.name}</h1>;
}
```

The `loader` runs on the server and is stripped from the client bundle; a `clientLoader` runs in the browser instead. After a route `action` (a mutation) completes, the router re-runs the loaders on the page automatically, so the screen is revalidated without any invalidation code. Because loaders start from the URL rather than from components, nested routes do not produce request waterfalls.

**Server Components** go further: the component itself is `async`, runs only on the server, and can read the database or call an API directly. Its code and its data-fetching dependencies never reach the browser; only the rendered output does.

```tsx
// Next.js App Router
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  return <ProductView product={product} />;
}
```

Slow parts are wrapped in `<Suspense>` and streamed in as they finish. To avoid sequential awaits, start requests together (`Promise.all`) or pass an un-awaited promise to a Client Component that reads it with `use`. Mutations are Server Functions that then tell the framework which cached data to refresh. Caching rules are framework-specific and have changed between Next.js versions (in the current version `fetch` is not cached unless you opt in), so read the current docs rather than assuming.

How this compares with a query library. Framework loading gives you data in the first HTML, no client fetching code, no loading spinners on first paint, secrets kept on the server, and smaller bundles. What it does not give you by default is a client cache with background refetching on focus, polling, infinite queries, fine-grained optimistic cache updates, or offline support: the data is as fresh as the last navigation or revalidation. Highly interactive, frequently updating screens still benefit from a query library, and the two combine well: prefetch in the loader or Server Component and hand the data to the client cache (`ensureQueryData` in a loader, or dehydrate and hydrate the `QueryClient`), so the page renders with data and then stays live.

**Try it:** Scaffold a React Router framework app (`npx create-react-router@latest`) with a list route and a nested detail route, each with a loader that has an artificial delay. Watch the Network panel on navigation to confirm the loaders run in parallel, then add an `action` that edits an item and observe the loaders re-run without any code from you.

**Resources**
- [React Router: Data Loading](https://reactrouter.com/start/framework/data-loading)
- [Next.js: Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [react.dev: Server Components](https://react.dev/reference/rsc/server-components)

### Mutations and invalidation

A query reads; a mutation writes. After a successful write, some of what you have cached is wrong, and the cache cannot know which entries unless you tell it. There are two ways.

**Invalidate.** Mark the affected queries stale. Active ones refetch immediately; inactive ones refetch when next used. This is the default choice because the server remains the source of truth and you cannot compute the wrong result.

```tsx
const queryClient = useQueryClient();

const addTodo = useMutation({
  mutationFn: (input: NewTodo) => api.createTodo(input),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
});

<button disabled={addTodo.isPending} onClick={() => addTodo.mutate({ title })}>Add</button>
```

`invalidateQueries({ queryKey: ['todos'] })` matches by prefix, so it covers `['todos', 'list', …]` and `['todos', 'detail', 5]`. This is why hierarchical keys pay off. If you return the promise from `onSuccess`, the mutation stays pending until the refetch completes, which keeps the button disabled until the list is actually up to date.

**Update directly.** When the response contains the new entity, write it into the cache with `setQueryData` and skip a round trip:

```ts
onSuccess: (saved) => {
  queryClient.setQueryData(['todos', 'detail', saved.id], saved);
  queryClient.invalidateQueries({ queryKey: ['todos', 'list'] });
},
```

Updates must be immutable. Updating a detail entry by hand is easy; updating lists is not, because sorting, filtering, and pagination decide whether and where the item appears, so invalidate those.

Things people get wrong. Forgetting an affected query: creating a comment also changes the post's comment count and maybe a dashboard total. Calling `refetch()` on one query from a component instead of invalidating by key, which misses every other consumer. Putting logic that must run in the per-call callbacks of `mutate(vars, { onSuccess })`: those are skipped if the component unmounts first, while callbacks on `useMutation` always run, so cache work belongs there and navigation or toasts belong on the call. Expecting mutations to retry (they do not by default, since writes may not be idempotent). And double submits: disable the control while `isPending`. Use `mutateAsync` only when you need the promise, and catch its errors.

Many teams add a global rule in the `MutationCache` `onSuccess` that invalidates everything, or everything matching the mutation's `meta`, and refine later.

**Try it:** Build a list and a detail view backed by MSW. Add a rename mutation with no cache handling and see the stale title. Fix it with invalidation, watching the refetch in the Network panel, then switch the detail query to `setQueryData` from the response and note which requests disappear.

**Resources**
- [TanStack Query: Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [TanStack Query: Invalidation from Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)
- [TkDodo: Mastering Mutations in React Query](https://tkdodo.eu/blog/mastering-mutations-in-react-query)

### Optimistic updates

An optimistic update shows the result of a write before the server confirms it, on the assumption it will succeed. Done well, the interface feels instant. Done carelessly, it shows users things that did not happen. Use it where success is very likely, the result is predictable on the client, and a rollback is not alarming: toggles, likes, reordering, renaming, adding to a list. Avoid it for payments, anything with server-computed results, and destructive actions that are confusing to "un-happen".

There are two techniques in TanStack Query. The simpler one does not touch the cache: while the mutation is pending, render its `variables` as a temporary item.

```tsx
const addTodo = useMutation({
  mutationFn: api.createTodo,
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
});
// in the list:
{addTodo.isPending && <li style={{ opacity: 0.5 }}>{addTodo.variables.title}</li>}
```

When the change must appear in several places, write to the cache and keep a snapshot to restore:

```ts
useMutation({
  mutationFn: api.toggleTodo,
  onMutate: async (id: string) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });          // 1
    const previous = queryClient.getQueryData<Todo[]>(['todos']);      // 2
    queryClient.setQueryData<Todo[]>(['todos'], (old = []) =>          // 3
      old.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
    return { previous };
  },
  onError: (_err, _id, context) => {
    queryClient.setQueryData(['todos'], context?.previous);            // 4
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }), // 5
});
```

Each step exists for a reason. (1) Cancel in-flight refetches, or a response that left the server before your write will overwrite the optimistic value. (2) Snapshot for rollback. (3) Apply the change immutably. (4) Restore on failure, and tell the user. (5) Refetch either way so the cache converges on the server's truth, including server-generated fields.

Harder cases: several mutations in flight on the same data (restoring a snapshot can undo a later optimistic change; invalidate only when no other mutation is pending, via `queryClient.isMutating()`), and optimistic items with temporary IDs that must be swapped for real ones. React's own `useOptimistic` covers the same need for state driven by Actions: the optimistic value lives only for the duration of the action and reverts automatically.

**Try it:** Implement a "like" toggle against an MSW handler with a two-second delay that fails 30% of the time. Verify the instant flip, the rollback with an error toast, and, by clicking rapidly, that the final state always matches the server.

**Resources**
- [TanStack Query: Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [react.dev: useOptimistic](https://react.dev/reference/react/useOptimistic)
- [TkDodo: Concurrent Optimistic Updates in React Query](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)

### Pagination and infinite scroll

Large collections are fetched in pages, and there are two ways to say which page.

**Offset pagination** (`?page=3&per_page=20` or `?offset=40&limit=20`) is simple, lets users jump to any page, and can report a total. Its weaknesses: the database must scan and discard the skipped rows, so deep pages get slow; and if rows are inserted or deleted while the user pages, the window shifts and they see duplicates or miss items.

**Cursor pagination** (`?after=eyJpZCI6MTIzfQ&limit=20`) asks for "the next N items after this one", where the cursor is an opaque token encoding the last item's sort key. It is stable under inserts and fast at any depth because it uses an index seek. You cannot jump to page 37 and usually get no total. Treat the cursor as opaque; do not parse it. Use offset for admin tables with page numbers, and cursors for feeds, timelines, and anything that changes while being read.

In TanStack Query, numbered pages are ordinary queries with the page in the key; add `placeholderData: keepPreviousData` so the old page stays visible (with `isPlaceholderData` to dim it) instead of flashing a spinner. Infinite lists use `useInfiniteQuery`:

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam, signal }) => fetchFeed({ cursor: pageParam, signal }),
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
const items = data?.pages.flatMap(p => p.items) ?? [];
```

Trigger the next page with an `IntersectionObserver` on a sentinel element near the end, guarded by `hasNextPage && !isFetchingNextPage`. Provide a "Load more" button as well: it is the accessible fallback, and infinite scroll makes footers unreachable.

**Preserving scroll position** when the user opens an item and comes back depends on two things: the data must still be there, and the page must be tall enough to scroll to. A query cache gives you the first, since all loaded pages render synchronously from cache on return. The router or browser handles the second (`history.scrollRestoration`, or your router's scroll restoration) provided content is not loaded after the restore. If you virtualise the list (TanStack Virtual), which you should past a few hundred rows, save and restore the virtualiser's offset yourself. A refetch of an infinite query refetches every loaded page in order; cap that with `maxPages`.

**Try it:** Build an infinite feed against a cursor-based mock. Scroll several pages down, open an item on a detail route, press Back, and confirm you land where you were with no loading flash. Then insert an item at the top on the server and compare what a cursor API and an offset API return for "page 2".

**Resources**
- [TanStack Query: Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)
- [TanStack Query: Paginated Queries](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries)
- [MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

### Race conditions

Requests do not complete in the order you sent them. If the user types "re" then "react", or clicks item A then item B, two requests are in flight; if the first is slower, its response arrives last and overwrites the correct result. The UI then shows data for something the user is no longer looking at. It is intermittent, depends on network timing, and rarely reproduces on a fast local connection, which is why it survives to production.

There are two fixes: ignore the stale response, or cancel the stale request.

```jsx
useEffect(() => {
  const controller = new AbortController();
  setStatus('loading');

  fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => { setResults(data); setStatus('success'); })
    .catch(err => {
      if (err.name === 'AbortError') return; // expected: a newer request replaced this one
      setStatus('error');
    });

  return () => controller.abort();
}, [query]);
```

When `query` changes, cleanup aborts the previous request before the new effect starts, so its promise rejects with `AbortError` and can never set state. Aborting also saves bandwidth and frees a connection, although the server may still finish the work. The simpler "ignore" version uses a boolean set in cleanup (`let ignore = false; … if (!ignore) setResults(data)`), and works for any promise, not only `fetch`. `AbortSignal.timeout(ms)` and `AbortSignal.any([a, b])` combine timeouts with manual cancellation.

Query libraries remove this class of bug for reads: each key has its own cache entry, the component displays the entry for the *current* key, and a late response for an old key just fills that old entry. TanStack Query also passes a `signal` to your `queryFn`; forward it to `fetch` and requests are cancelled when nothing is using the query any more.

Races are not limited to reads. Two quick mutations (toggle on, toggle off) can arrive at the server out of order; serialise them (TanStack Query mutation `scope`), disable the control while pending, or send absolute values rather than "toggle". Debouncing reduces how often races happen but does not prevent them. A response that arrives after the component unmounts, or after the user logged out, is the same problem.

**Try it:** Build a search box with a mock API whose delay is random between 100 and 2000 ms. Type quickly and watch wrong results appear. Fix it with `AbortController`, and confirm in the Network panel that superseded requests show as "(canceled)".

**Resources**
- [react.dev: You Might Not Need an Effect: Fetching data](https://react.dev/learn/you-might-not-need-an-effect#fetching-data)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [TanStack Query: Query Cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)

### Loading, empty, and error states

Every view that depends on asynchronous data has at least four states, and the "happy path with data" is only one of them. Design and build all of them, for every such view.

**Loading.** Distinguish the first load (no data to show) from a background refresh (you have data). For the first, prefer a skeleton that matches the final layout, so nothing shifts when content arrives; avoid showing any indicator for the first couple of hundred milliseconds, because a spinner that flashes for 80 ms feels slower than none. For a refresh, keep showing the existing data and at most add a subtle indicator. Never replace content with a spinner because a refetch started.

**Empty.** A successful response with nothing in it is not an error and not a blank screen. Say why and what to do next, and distinguish "you have no projects yet" (offer to create one) from "no projects match these filters" (offer to clear them).

**Error.** Say what failed in plain language, keep whatever is still usable on screen, and offer a retry. Distinguish causes when the action differs: offline, not found (404), not allowed (403), session expired (401, so sign in again), and a generic failure. If a background refetch fails while you have cached data, keep the data and show a non-blocking notice rather than replacing the view.

**Success**, including partial data, very long content, and a single item.

With TanStack Query, check in an order that keeps stale data visible:

```tsx
const { data, isPending, isError, error, refetch, isFetching } = useQuery(todosQuery);

if (isPending) return <TodoSkeleton />;
if (isError && !data) return <ErrorState error={error} onRetry={refetch} />;
if (data.length === 0) return <EmptyState />;
return <TodoList todos={data} refreshing={isFetching} />;
```

Alternatively make it structural: `useSuspenseQuery` with a `<Suspense>` boundary for loading and an error boundary for errors, so the component body only handles success and empty. Mutations have their own versions: a pending button, inline field errors, and a failure message that preserves what the user typed.

Accessibility: mark the loading region with `aria-busy="true"`, announce completion or results through a polite live region (`role="status"`), use `role="alert"` for errors, and move focus sensibly after a retry. Check for layout shift between states.

**Try it:** Take one data view and force each state using MSW handlers: a 3-second delay, an empty array, a 500, and a network error. Add a background-refetch failure while data is on screen. Capture a screenshot of each and check that none is blank, shifted, or silent to a screen reader.

**Resources**
- [TkDodo: Status Checks in React Query](https://tkdodo.eu/blog/status-checks-in-react-query)
- [react.dev: Suspense](https://react.dev/reference/react/Suspense)
- [MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)

### Retries and backoff

Some failures are transient: a dropped connection, a gateway timeout, a server restarting, a rate limit. Retrying them automatically hides the blip from the user. Retrying badly makes things worse: if every client retries immediately and in lockstep, a struggling server receives a multiple of its normal load at the worst moment.

What to retry. Network errors and timeouts, `408`, `429`, and `5xx` responses such as `502`, `503`, `504`. Do not retry other `4xx` responses: a `400`, `401`, `403`, `404`, or `422` will fail identically every time and needs a different response (fix input, sign in, show not found).

What is safe to retry. `GET`, `HEAD`, `PUT`, and `DELETE` are idempotent by definition: repeating them has the same effect as doing them once. `POST` is not; a retried "create order" whose first attempt actually succeeded creates two orders. Only retry non-idempotent writes if the API supports an idempotency key (a unique ID sent in a header such as `Idempotency-Key`, which the server uses to recognise a duplicate).

How to wait. Use **exponential backoff**: double the delay each attempt, with a cap. Add **jitter**, a random component, so that clients which failed together do not retry together. Honour a `Retry-After` header when the server sends one. Limit the number of attempts, and stop when the request is aborted.

```ts
function retryDelay(attempt: number, base = 500, cap = 30_000) {
  const exponential = Math.min(cap, base * 2 ** attempt);
  return Math.random() * exponential; // "full jitter"
}
```

TanStack Query retries failed queries three times by default with `Math.min(1000 * 2 ** attemptIndex, 30000)` and pauses retries while the browser is offline. Mutations are not retried by default. Customise it so permanent errors fail fast:

```ts
retry: (failureCount, error) =>
  failureCount < 3 && !(error instanceof HttpError && error.status >= 400 && error.status < 500 && error.status !== 429),
```

Remember the user is waiting during retries: three attempts with backoff means several seconds of "loading" before an error appears, so keep counts low for interactive requests and show progress for long ones. In tests, set `retry: false` or failures take seconds to surface. For reconnecting WebSockets and polling loops, the same backoff-with-jitter rule applies.

**Try it:** Write `fetchWithRetry(url, { retries, signal })` that retries only on network errors, 429, and 5xx, uses full jitter, respects `Retry-After`, and stops on abort. Test it against an MSW handler that fails twice then succeeds, and log the delays.

**Resources**
- [TanStack Query: Query Retries](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries)
- [AWS Architecture Blog: Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [MDN: Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After)

### Prefetching

If you can predict what the user will need next, fetch it before they ask and the transition appears instant. The time between a pointer entering a link and the click is typically a few hundred milliseconds, which is often enough for a small API response.

Signals of intent, from strongest to weakest: `pointerdown` or `touchstart` (the click is almost certain), hover or keyboard focus on a link, the link scrolling into the viewport, and simply being on a page where the next step is obvious (page 2 of a list, the next step of a wizard).

```tsx
function TodoLink({ id, title }: { id: string; title: string }) {
  const queryClient = useQueryClient();
  const prefetch = () =>
    queryClient.prefetchQuery({ ...todoDetailQuery(id), staleTime: 30_000 });

  return (
    <Link to={`/todos/${id}`} onMouseEnter={prefetch} onFocus={prefetch}>
      {title}
    </Link>
  );
}
```

`prefetchQuery` fills the cache and never throws. The `staleTime` matters twice: it stops repeated hovers from refetching data that is already fresh, and the destination query needs a non-zero `staleTime` too, or it will refetch on mount anyway (you still get instant display of the prefetched data, plus a background request). For the next page of a paginated list, prefetch in an effect when the current page's data arrives. In route loaders, `queryClient.ensureQueryData(options)` returns cached data or fetches it, which starts the request before the route's components render and avoids request waterfalls. If the detail view can be approximated from the list item you already have, seed it with `initialData` or `placeholderData`.

Prefetch the code as well as the data: call the same dynamic `import()` your lazy route uses. Routers such as React Router, TanStack Router, and Next.js do both through link props (`prefetch="intent"`, `preload="intent"`). For full document navigations, the browser's Speculation Rules API can prefetch or prerender the next page in Chromium-based browsers; check support before relying on it.

Costs: prefetching spends the user's data and your server's capacity on requests that may never be used. Add a short hover delay (50 to 100 ms) to skip pointer fly-bys, do not prefetch hundreds of links in a viewport, respect `navigator.connection.saveData` where available, and only prefetch safe, idempotent `GET`s.

**Try it:** Add hover prefetching to a list-to-detail navigation and throttle the network to Slow 4G. Compare the click-to-content time with and without. Watch the Network panel and the Query DevTools to confirm a second hover inside the `staleTime` triggers no request.

**Resources**
- [TanStack Query: Prefetching & Router Integration](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching)
- [MDN: Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)

### REST

REST, as practised, means modelling your API as **resources** identified by URLs and manipulated with standard HTTP methods. Being fluent in its conventions lets you read any API quickly and argue for a sensible design when you are consulted.

Resources are nouns, usually plural: `/orders`, `/orders/123`, `/orders/123/items`. The method is the verb:

| Method | Meaning | Safe | Idempotent |
| --- | --- | --- | --- |
| `GET` | Read | Yes | Yes |
| `POST` | Create, or a non-idempotent action | No | No |
| `PUT` | Replace the whole resource | No | Yes |
| `PATCH` | Partially update | No | Not necessarily |
| `DELETE` | Remove | No | Yes |

Safe means no side effects, so it can be cached and prefetched. Idempotent means repeating it has the same effect as once, so it can be retried.

Status codes you must handle correctly: `200` OK; `201` Created (often with a `Location` header); `204` No Content (do not call `.json()`); `304` Not Modified; `400` malformed request; `401` not authenticated; `403` authenticated but not allowed; `404` not found; `409` conflict; `422` validation failed; `429` rate limited; `5xx` server faults. Remember `fetch` resolves for all of these; check `response.ok`.

Collection conventions are less standardised, so read each API's docs: pagination by `page`/`per_page`, `offset`/`limit`, or a cursor, with the next link in the body or a `Link` header; filtering through query params (`?status=open&assignee=me`); sorting (`?sort=-created_at`); and field selection (`?fields=id,title`). Good error bodies are machine-readable; the standard format is Problem Details (`application/problem+json`, RFC 9457) with `type`, `title`, `status`, and `detail`.

HTTP features worth using from the client: `ETag` with `If-None-Match` for cheap revalidation, `ETag` with `If-Match` for optimistic concurrency (the server rejects your update with `412` if someone else changed the resource), `Cache-Control`, and content negotiation with `Accept`.

REST's typical frustrations are over-fetching (the endpoint returns more than the view needs), under-fetching (one view needs five endpoints, sometimes in sequence), and no built-in type contract. OpenAPI addresses the last; GraphQL and backend-for-frontend endpoints address the first two.

**Try it:** Explore a public REST API such as GitHub's with `curl -i`. Request a list, follow the `Link` header to the next page, send the returned `ETag` back in `If-None-Match` and get a `304`, and trigger a `404` and a `422` to read the error bodies.

**Resources**
- [MDN: HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods)
- [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)

### GraphQL

GraphQL is a query language over a typed schema. The server publishes types and fields; the client sends a document describing exactly the fields it wants, across related objects, and gets JSON of the same shape back from a single endpoint (normally `POST /graphql`).

```graphql
query IssuePage($id: ID!) {
  issue(id: $id) {
    id
    title
    author { ...AuthorChip }
    comments(first: 10) {
      edges { node { id body author { ...AuthorChip } } }
      pageInfo { hasNextPage endCursor }
    }
  }
}

fragment AuthorChip on User {
  id
  name
  avatarUrl
}

mutation RenameIssue($id: ID!, $title: String!) {
  updateIssue(id: $id, title: $title) { id title }
}
```

**Queries** read, **mutations** write (and return the fields you want to see afterwards), **subscriptions** stream. **Variables** keep values out of the query string. **Fragments** are reusable field selections; the important practice is *colocation*: each component declares a fragment for the data it needs, and parent queries compose them, so adding a field to a component does not mean editing a distant query.

Differences from REST that affect client code. Responses are almost always HTTP `200`; failures are reported in an `errors` array, possibly alongside partial `data`, so you must inspect the body. HTTP caching does not apply to `POST`, so caching is the client's job. And the schema is introspectable, which enables code generation: GraphQL Code Generator or `gql.tada` gives you TypeScript types for every operation.

A **normalised cache** (Apollo Client's `InMemoryCache`, urql's Graphcache, Relay's store) is the distinctive client feature. It splits each response into individual objects stored by `__typename` plus `id` (for example `User:42`), and queries hold references to them. When a mutation returns `{ id, title }` for `Issue:7`, every query on screen that includes that issue updates automatically, with no invalidation code. The limits: objects need stable IDs (always select `id`), and the cache cannot know that a *new* object belongs in some list, or that a deleted one should leave it, so list additions and removals need a manual cache update or a refetch. Normalised caches are also harder to debug than a document cache; using TanStack Query with `graphql-request` is a legitimate simpler choice.

Know the server-side risks too: N+1 resolver queries, arbitrarily expensive queries (mitigated with depth limits and persisted queries), and Relay-style cursor connections as the pagination convention.

**Try it:** In GitHub's GraphQL Explorer, write a query for a repository's last five issues with author names, extract a fragment, and add a variable. Then, in a small Apollo Client app, run a mutation that returns `id` and a changed field and watch a separate list query update without a refetch using Apollo DevTools' cache inspector.

**Resources**
- [GraphQL: Queries](https://graphql.org/learn/queries/)
- [Apollo Client: Caching overview](https://www.apollographql.com/docs/react/caching/overview)
- [GraphQL: Serving over HTTP](https://graphql.org/learn/serving-over-http/)

### Type-safe APIs

TypeScript checks your code, but an API response arrives at runtime as `any` in disguise: `await res.json()` can be typed as whatever you claim. If the backend renames a field, your types still say the old name and nothing fails until a user hits it. Type-safe API tooling closes the gap by deriving client types from the same source as the server.

**tRPC** is for a TypeScript client and server in one repository. You define procedures on the server with input validation, export the router's *type* only, and the client infers everything from it, with no generated files:

```ts
// server
export const appRouter = router({
  userById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => db.user.findUnique({ where: { id: input.id } })),
});
export type AppRouter = typeof appRouter;

// client (tRPC v11 with TanStack Query)
const trpc = useTRPC();
const user = useQuery(trpc.userById.queryOptions({ id: '42' }));
```

Rename a field on the server and the client fails to compile; "go to definition" jumps into server code. The cost is coupling: it does not serve non-TypeScript clients or public APIs.

**OpenAPI code generation** works with any backend language. The API is described by an OpenAPI document, and tools generate TypeScript from it: `openapi-typescript` emits types only, and `openapi-fetch` is a tiny typed `fetch` wrapper over them, so `client.GET('/users/{id}', { params: { path: { id } } })` has checked paths, params, and response bodies. Orval and Hey API generate complete clients and TanStack Query hooks. Regenerate in CI and fail the build when the committed output is stale, or the types drift like hand-written ones. The quality of the result is the quality of the spec: a response typed as a loose object buys you nothing. GraphQL gets the same benefit from its schema through code generation.

Generated and inferred types still describe what the server *promised*, not what it actually sent. Checking the data at runtime is a separate skill, covered in the next entry, "Validating API responses".

**Try it:** Take a public OpenAPI document (the Swagger Petstore works), run `npx openapi-typescript <url> -o schema.d.ts`, and call an endpoint with `openapi-fetch`. Misspell a path and a response field to see the compile errors. Then change the server (or the spec) so a field is renamed, regenerate, and follow the compile errors.

**Resources**
- [tRPC: TanStack React Query setup](https://trpc.io/docs/client/tanstack-react-query/setup)
- [OpenAPI TypeScript: Introduction](https://openapi-ts.dev/introduction)
- [OpenAPI TypeScript: openapi-fetch](https://openapi-ts.dev/openapi-fetch/)

### Validating API responses

`response.json()` returns `any`. Whatever type you attach to it afterwards is something you asserted, not something that was checked:

```ts
const user = (await res.json()) as User; // a claim; nothing verifies it
```

If the server sends `null` for a field you typed as `string`, renames a property, returns an error object with status 200, or a proxy returns an HTML error page, TypeScript is silent and the failure surfaces far away: `Cannot read properties of undefined` in some component, or `NaN` in a total, or bad data written to a cache and persisted. The fix is to **parse** at the boundary: check the shape at runtime, once, at the point the data enters your program, and give the rest of the code a value whose type is actually true.

```ts
import * as z from 'zod';

const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  role: z.enum(['admin', 'member']),
});
type User = z.infer<typeof User>; // the type is derived from the schema

async function fetchUser(id: string, signal?: AbortSignal): Promise<User> {
  const res = await fetch(`/api/users/${id}`, { signal });
  if (!res.ok) throw new HttpError(res.status);
  return User.parse(await res.json()); // throws if the shape is wrong
}
```

There is one definition, the schema, and the static type is inferred from it, so they cannot drift apart. `parse` throws; `safeParse` returns `{ success, data }` or `{ success, error }` when you want to branch without exceptions. Put the call inside your query function so that a mismatch becomes an ordinary query error with a useful message naming the path that failed, handled by your error state and reported to monitoring, instead of a crash during render.

Design decisions:

- **Be strict about what you use, tolerant of the rest.** Object schemas ignore unknown keys by default, so a server adding a field does not break old clients. Do not validate fields you never read.
- **Transform while you parse**: turn ISO strings into `Date`s, rename snake_case, supply defaults. The output of parsing can be your application's model rather than the wire format.
- **Decide what a failure means.** For a critical record, fail the request. For one bad item in a list of five hundred, you may prefer to drop and report it.
- **Cost.** Validation takes CPU time and schema libraries add bundle size. It is negligible for typical responses; for very large payloads, validate a sample or only in development, and consider a smaller library such as Valibot.

Zod, Valibot, and ArkType all implement the Standard Schema interface, so libraries such as tRPC, TanStack Form, and TanStack Router accept any of them. The same rule covers every untyped input: `localStorage`, URL search params, `postMessage`, WebSocket messages, and form data. Generated types from OpenAPI or GraphQL narrow the risk but still describe a promise, so parse where being wrong would be costly.

**Try it:** Add a schema to one endpoint in an existing app and call `parse` in the query function. With MSW, return a response with a missing field, a `null`, and a string where a number is expected. Read each error message, and confirm the UI shows its error state rather than crashing.

**Resources**
- [Zod: Defining schemas](https://zod.dev/api)
- [TypeScript Handbook: Narrowing (type predicates)](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [Standard Schema](https://standardschema.dev/)

### Real time

When the server needs to tell the client something without being asked, there are three options. Pick the simplest that meets the requirement.

**Polling.** Ask again every N seconds (`refetchInterval` in a query library). It works through any infrastructure, needs nothing special on the server, and recovers from failure by itself. Updates are delayed by up to the interval and most requests return nothing new. It is the right answer when a delay of several seconds is acceptable: dashboards, job status, notification counts. Stop polling in background tabs and use conditional requests (`ETag`) to keep it cheap.

**Server-Sent Events.** One long-lived HTTP response over which the server streams text events; the browser API is `EventSource`.

```js
const source = new EventSource('/api/events', { withCredentials: true });
source.addEventListener('price', (e) => update(JSON.parse(e.data)));
source.onerror = () => { /* the browser reconnects automatically */ };
```

It is one-directional (server to client), reconnects automatically, and resends the last event's ID in a `Last-Event-ID` header so the server can replay what was missed. It is plain HTTP, so proxies, auth cookies, and compression work. Limits: text only, no custom request headers with `EventSource` (use cookies, or read a `fetch` stream yourself if you need an `Authorization` header), and under HTTP/1.1 browsers allow about six connections per origin, which several tabs can exhaust; HTTP/2 removes that problem. It suits feeds, notifications, progress, and streamed AI responses.

**WebSockets.** A persistent, bidirectional, low-overhead channel after an HTTP upgrade (`wss://`), carrying text or binary. Needed when the client also sends frequently and latency matters: chat, multiplayer, collaborative editing, presence. You implement the rest yourself or adopt a library (Socket.IO, PartyKit, Ably and similar services): reconnection with backoff and jitter, heartbeats to detect dead connections, resubscribing and catching up after a reconnect, message ordering and acknowledgement, authentication (the browser API cannot set headers; cookies are sent on the handshake, so check the `Origin` on the server, or authenticate with a short-lived ticket), and scaling stateful connections behind load balancers. The standard `WebSocket` API has no backpressure. WebTransport over HTTP/3 is a newer alternative for low-latency and unreliable streams; check browser support before relying on it.

Integrating with a query cache: on each event either invalidate the relevant query (simple, always correct) or write the payload in with `setQueryData` (faster, more code). After any reconnect, refetch, because events were missed.

**Try it:** Build a live counter three ways against a small Node server: polling every two seconds, an SSE endpoint, and a WebSocket. For each, kill and restart the server and note what the client does unaided. Inspect the EventStream and WS Messages tabs in the Network panel.

**Resources**
- [MDN: Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [MDN: Writing WebSocket client applications](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
- [WHATWG HTML: Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)

### Authentication flows

Authentication establishes who the user is; the frontend's job is to carry proof of that on each request without exposing it. There are two families.

**Session cookies.** After login the server stores a session and sets a cookie containing an opaque ID. The browser attaches it automatically to requests to that site. Set it with `HttpOnly` (JavaScript cannot read it, so cross-site scripting cannot steal it), `Secure` (HTTPS only), and `SameSite=Lax` or `Strict`. Because the browser sends cookies automatically, you must defend against cross-site request forgery: `SameSite` does most of the work, backed by CSRF tokens or `Origin` checks on state-changing requests. Logout is real: the server deletes the session. Cross-origin API calls need `credentials: 'include'` and matching CORS configuration.

**Tokens.** The server issues a signed access token (commonly a JWT) that the client sends as `Authorization: Bearer …`. The server need not store sessions, and it works across domains and for mobile clients. A JWT cannot be revoked before it expires, so access tokens are short-lived (minutes) and paired with a longer-lived **refresh token** used to obtain new ones; refresh tokens should rotate on each use so a stolen one is detected. The frontend's problem is storage: anything in `localStorage` is readable by any script on the page. Safer arrangements keep the access token in memory only and the refresh token in an `HttpOnly` cookie, or use a backend-for-frontend that holds the tokens server-side and gives the browser only a session cookie, which is what current OAuth guidance for browser apps recommends. With a third-party identity provider, use the Authorization Code flow with PKCE through a maintained library; never the implicit flow.

Refresh handling is where client bugs live. When requests fail with `401`, refresh once and replay them. If five requests fail together, they must share a single refresh call (keep one in-flight promise and have the others await it), or rotation invalidates the tokens they race to use. If the refresh itself fails, clear all user state, including the query cache, and send the user to login with a return URL.

**Protecting routes** on the client means checking auth in a route loader or guard and redirecting, so protected screens do not flash. This is purely cosmetic: all JavaScript and all route code is public, and only the server can enforce access, on every request. Also handle other tabs (broadcast logout with `BroadcastChannel`), and never put tokens in URLs.

**Try it:** With MSW, mock a login, a protected `GET /me`, and a `/refresh` endpoint, with access tokens that expire after 10 seconds. Fire three protected requests at once after expiry and verify in the Network panel that exactly one refresh happens and all three succeed on replay.

**Resources**
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [IETF: OAuth 2.0 for Browser-Based Applications](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)

### Mocking

Frontend work should not wait for a backend, and tests should not depend on one. Mock Service Worker intercepts requests at the network level: in the browser through a Service Worker, in Node (Vitest, Jest) by intercepting the request modules. Your application code is unchanged: it calls the real `fetch` with real URLs, and the request appears in the Network panel. That is the advantage over stubbing `fetch` or mocking your API module, which bypass the very code (URL building, headers, parsing, error handling) most likely to be wrong.

```ts
// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';

let todos = [{ id: '1', title: 'Learn MSW', done: false }];

export const handlers = [
  http.get('/api/todos', async () => {
    await delay(400);
    return HttpResponse.json(todos);
  }),
  http.post('/api/todos', async ({ request }) => {
    const body = (await request.json()) as { title?: string };
    if (!body.title) {
      return HttpResponse.json({ errors: { title: 'Required' } }, { status: 422 });
    }
    const todo = { id: crypto.randomUUID(), title: body.title, done: false };
    todos = [...todos, todo];
    return HttpResponse.json(todo, { status: 201 });
  }),
];
```

In the browser, generate the worker file once with `npx msw init public/`, then start it before rendering, in development only:

```ts
if (import.meta.env.DEV) {
  const { setupWorker } = await import('msw/browser');
  await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass' });
}
```

In tests, use `setupServer(...handlers)` from `msw/node` with `listen`, `resetHandlers`, and `close` in the lifecycle hooks, set `onUnhandledRequest: 'error'` so an unmocked call fails loudly, and override per test with `server.use(...)` to produce a 500, an empty list, or a slow response. The same handlers serve development, unit tests, Storybook, and Playwright.

Practices that keep mocks valuable. Agree the contract with the backend first, ideally as an OpenAPI document or GraphQL schema, and type the handlers from it so mocks cannot silently drift from the real API. Make them stateful and realistic: latency, validation errors, pagination, and auth failures, since those are what you need to build against. Use `HttpResponse.error()` for a network failure and `passthrough()` to let a request reach the real server. MSW also handles GraphQL (`graphql.query`) and WebSockets (`ws.link`). Finally, mocks prove your client matches your understanding of the API, not the API itself; keep a few end-to-end or contract tests against the real thing.

**Try it:** Add MSW to an app whose backend "is not ready": write stateful handlers for list, create, and delete, and build the UI against them. Then reuse the handlers in a Vitest test and add one `server.use` override that makes the create fail with a 422.

**Resources**
- [MSW: Quick start](https://mswjs.io/docs/quick-start)
- [MSW: Browser integration](https://mswjs.io/docs/integrations/browser)
- [MSW: Node.js integration](https://mswjs.io/docs/integrations/node)

### Offline and sync

An application works offline when three things hold: its code loads without a network (a service worker serving a cached app shell), it can read data without a network (a local copy), and it can accept writes without a network and deliver them later. The third is the hard one.

**Detecting connectivity.** `navigator.onLine` and the `online`/`offline` events only know whether the device has a network interface. `true` does not mean your server is reachable. Treat request failure as the real signal and the events as hints to retry.

**Queueing writes (the outbox pattern).** When a write cannot be sent, record it durably and apply it optimistically to the local data:

1. Append the mutation to a queue in IndexedDB (not memory: the tab may close), with a client-generated ID.
2. Update the local view immediately and mark the item as pending.
3. When connectivity returns, replay the queue in order, with backoff.
4. Each mutation carries its ID as an idempotency key, because a request may have reached the server before the connection dropped and will be sent again.

Generate entity IDs on the client (UUIDs) so that queued operations can refer to objects the server has not seen yet.

**Reconciling.** While you were offline, the server's data may have changed. Strategies, from simplest: *last write wins* (later timestamp overwrites; silently loses data, and client clocks cannot be trusted); *version checks* (send the version you edited with `If-Match`, and on a `409` or `412` response refetch and either merge field by field or ask the user); *operation-based* mutations that merge naturally ("add tag X" rather than "tags = [X, Y]"); and CRDTs, which make concurrent edits converge by construction. Decide per kind of data: a "like" can be last-write-wins, a long text document cannot. Always show sync status in the UI (pending, failed, conflicted) and never drop a failed write silently.

**Tooling.** TanStack Query pauses mutations while offline (`networkMode: 'online'`), can persist the cache and paused mutations with `persistQueryClient`, and resumes them on reconnect; you must register default mutation functions so resumed mutations know what to call after a reload. Workbox's Background Sync module queues failed requests in a service worker and replays them, using the Background Sync API where available (Chromium-based browsers only at the time of writing) and falling back to replaying on next start elsewhere. Beyond a simple queue, consider a sync engine rather than building one.

**Try it:** Add an offline outbox to a to-do app: IndexedDB queue, optimistic items with a "pending" badge, replay on the `online` event. Test with DevTools set to Offline: create three items, close the tab, reopen, go online, and confirm each arrives exactly once.

**Resources**
- [TanStack Query: Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode)
- [MDN: Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [web.dev: The offline cookbook](https://web.dev/articles/offline-cookbook)

### Local-first

Local-first software inverts the usual architecture. The primary copy of the data lives in a database on the user's device; the application reads and writes it directly, so every interaction is instant and works offline; and synchronisation with a server and other devices happens in the background. The server becomes a peer that relays, backs up, and authorises, not the place where the truth lives. You do not need to build this at this stage, but you should know what it solves and what the terms mean.

The problems it addresses: latency (no spinner for every click), offline use, real-time collaboration, and the amount of code spent on fetching, caching, invalidation, and optimistic updates, all of which a sync engine replaces with "query the local database, subscribe to changes".

The central difficulty is that several replicas are edited concurrently and must end up identical. **CRDTs** (conflict-free replicated data types) are data structures designed so that replicas can apply the same set of changes in any order and converge to the same state without coordination. Simple examples: a grow-only counter, a last-writer-wins register, an observed-remove set. Practical libraries provide rich types (maps, lists, collaborative text): **Yjs** and **Automerge** are the main ones in JavaScript. Convergence is guaranteed; a result that matches user intent is not. Two people editing the same sentence produce a merged sentence that may be nonsense, and CRDTs carry metadata that grows with history. The older alternative, operational transformation (used by Google Docs), needs a central server to order operations.

**Sync engines** package the whole pipeline: a local store (IndexedDB, or SQLite compiled to WebAssembly on the Origin Private File System), reactive queries, a protocol that syncs a subset of server data to each client, and conflict handling. Examples include Zero, ElectricSQL, PowerSync, Replicache, Jazz, InstantDB, Triplit, and TanStack DB as a client-side layer. Many are server-authoritative rather than pure CRDT: clients apply changes optimistically and the server decides the final order, which is simpler when you need permissions and validation. Linear and Figma are the well-known products built this way.

The costs are real: schema migrations across clients running old versions, partial sync and authorisation (which rows may this user hold locally?), storage limits and eviction, and initial sync time. It suits collaborative, document-like, and productivity applications; it is a poor fit where the server must be the only authority, such as payments or inventory.

**Try it:** Follow the Yjs getting-started guide to bind a shared `Y.Text` or `Y.Array` to a simple UI and open it in two browser windows. Disconnect one, edit both, reconnect, and observe the merge. Note one result that converged but that a human would not have chosen.

**Resources**
- [Ink & Switch: Local-first software](https://www.inkandswitch.com/essay/local-first/)
- [crdt.tech: About CRDTs](https://crdt.tech/)
- [Yjs: Introduction](https://docs.yjs.dev/)

### Undo and redo

Undo requires the ability to get back to an earlier state. There are three ways to build it, with different costs.

**Snapshots.** Keep a history shaped as `{ past: State[], present: State, future: State[] }`. A new change pushes `present` onto `past`, sets the new `present`, and clears `future`. Undo pops from `past` and pushes the current state onto `future`; redo is the reverse.

```ts
function undoable<S, A>(reducer: (s: S, a: A) => S, limit = 100) {
  type History = { past: S[]; present: S; future: S[] };
  return (h: History, action: A | { type: 'undo' } | { type: 'redo' }): History => {
    const type = (action as { type?: string }).type;
    if (type === 'undo') {
      if (!h.past.length) return h;
      return { past: h.past.slice(0, -1), present: h.past.at(-1)!, future: [h.present, ...h.future] };
    }
    if (type === 'redo') {
      if (!h.future.length) return h;
      return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
    }
    const present = reducer(h.present, action as A);
    if (present === h.present) return h;
    return { past: [...h.past, h.present].slice(-limit), present, future: [] };
  };
}
```

With immutable updates, snapshots are cheap because unchanged parts are shared between versions. This is the right first implementation.

**Patches.** Record what changed and how to reverse it. Immer's `produceWithPatches` returns patches and inverse patches for each update; undo applies the inverse. This uses far less memory for large documents and patches can be sent over the network.

**Commands.** Each operation is an object with `do` and `undo`. More code, but necessary when changes have external effects or must be undone selectively.

The engineering is in the details. Decide what is undoable: document content, yes; selection, zoom, and scroll, usually not, so keep them outside the history. Group changes into user-meaningful steps: a drag is one undo, not three hundred, and typing is coalesced into words or pauses; start a transaction on pointer down and commit on pointer up. Cap the history. Clear redo on any new change. Map Ctrl/Cmd+Z and Ctrl+Y or Cmd+Shift+Z, but leave native undo alone when focus is in a text field. Undoing something already saved to the server means sending a compensating request, which can fail. In collaborative editors, undo must reverse only *your* changes, not your collaborators'; Yjs's `UndoManager` does this by tracking the origin of each change.

**Try it:** Build a small drawing or kanban editor on `useReducer`, wrap the reducer with `undoable`, and wire up the keyboard shortcuts. Then make a drag produce a single history entry, and exclude the current selection from history.

**Resources**
- [Redux: Implementing Undo History](https://redux.js.org/usage/implementing-undo-history)
- [Immer: Patches](https://immerjs.github.io/immer/patches/)
- [Yjs: Y.UndoManager](https://docs.yjs.dev/api/undo-manager)

### Data-heavy dashboard

Build a table over a few thousand rows where the server does the sorting, filtering, and pagination, and the URL is the only place the table's state is stored. This project forces every idea in the module to work together.

The architecture is a straight line: **URL → parsed params → query key → request → rows**. Controls do not hold state; they write to the URL. The table does not hold state; it renders the query result for the current URL.

```ts
const params = parseTableParams(searchParams); // validated: { q, status, sort, dir, page, pageSize }
const query = useQuery({
  queryKey: ['orders', 'list', params],
  queryFn: ({ signal }) => fetchOrders(params, signal),
  placeholderData: keepPreviousData,
  staleTime: 30_000,
});
```

Requirements to implement and verify:

- Parse and validate search params with a schema; invalid or missing values fall back to defaults, and defaults are omitted from the URL.
- Changing a filter or sort resets `page` to 1. A page beyond the last (after filtering) is handled, not shown as an empty table.
- The search input keeps local text for responsiveness and commits to the URL after a debounce with `replace`; sort and page changes `push`.
- While a new page loads, the previous rows stay visible and dimmed (`isPlaceholderData`); no layout jump. Prefetch the next page.
- Out-of-order responses cannot show the wrong page (the query key guarantees it; also forward the abort signal).
- Loading skeleton on first load, an empty state that distinguishes "no data" from "no matches", an error state with retry.
- Sortable column headers are buttons with `aria-sort`; the table has a caption; result count changes are announced politely.
- A row action (for example changing status) uses a mutation with an optimistic update and invalidates the list.

Use **TanStack Table** in manual mode (`manualSorting`, `manualFiltering`, `manualPagination`) for column definitions, visibility, and row selection, with its state derived from the URL. Mock the API with MSW handlers that really sort, filter, and paginate a generated dataset, and add latency. Stretch goals: column visibility and page size persisted to `localStorage`, saved views as shareable links, virtualised rows with TanStack Virtual, CSV export of the current filter.

**Try it:** Acceptance test, by hand: apply a search, a filter, a sort, and go to page 3. Copy the URL into a new private window and get the identical view. Press Back four times and watch each change undo in order. Throttle to Slow 4G and click through pages rapidly; the visible rows must always match the page number shown.

**Resources**
- [TanStack Table: Overview](https://tanstack.com/table/latest/docs/overview)
- [TanStack Query: Paginated Queries](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries)
- [WAI-ARIA APG: Sortable table example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/)

### Real-time app

Build a chat room or a shared list that several browser windows can edit at once. The interesting work is not the happy path; it is what happens when messages are slow, lost, duplicated, or reordered, and when the connection drops.

A workable design:

- **Server**: a small Node WebSocket server (the `ws` package) that keeps messages in memory, assigns each an increasing sequence number, broadcasts to all clients, and offers `GET /messages?after=<seq>` for catching up.
- **Initial load**: fetch history over HTTP through a query, then open the socket. Keep one source of truth, the query cache, and have socket events write into it with `setQueryData`.
- **Sending** is optimistic. Generate a client ID (`crypto.randomUUID()`), append the message locally with status `sending`, and send it. The server echoes it back with the same client ID plus its sequence number and timestamp; replace the pending entry, do not append a second one. If no acknowledgement arrives within a timeout, mark it `failed` and offer retry. The client ID also makes resends idempotent on the server.
- **Ordering**: display by server sequence, not arrival time or client clock. Pending messages go at the end.
- **Connection state** is a state machine: `connecting`, `open`, `reconnecting`, `closed`. Show it in the UI. Detect dead connections with a heartbeat (ping, and expect a pong within a few seconds), because a dropped network often produces no `close` event for a long time.
- **Reconnection**: exponential backoff with jitter, reset after a successful connection, and reconnect immediately on the `online` event or when the tab becomes visible. After reconnecting, fetch everything after the last sequence number you have, deduplicate by ID, and resend messages still marked `sending`.
- **Cleanup**: close the socket and clear timers when the component unmounts; survive Strict Mode's mount, unmount, mount without leaving two sockets open.

Add presence or typing indicators as ephemeral state that is never persisted and expires on its own. Keep the UI accessible: new messages in a `role="log"` region, and do not yank scroll position when the user has scrolled up to read history; show a "new messages" button instead.

Test adversarially. Use DevTools Offline mode mid-send, restart the server, throttle the network, open three windows and send simultaneously, and put the laptop to sleep. Every message must appear exactly once, in the same order, in every window.

**Try it:** Write the reconnection logic as a pure function or small class first, `nextDelay(attempt)` plus a state machine with injected timers, and unit test it with fake timers: backoff grows, is capped, has jitter, and resets on success. Then attach it to a real socket.

**Resources**
- [MDN: Writing WebSocket client applications](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
- [TanStack Query: Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [TkDodo: Using WebSockets with React Query](https://tkdodo.eu/blog/using-web-sockets-with-react-query)
