# State Management and Data Fetching

> Stage: 2 · Professional
> Most frontend complexity is state: where it lives, who owns it, and how it stays in sync with the server. Classify state first, then choose tools.

## Kinds of state

- [ ] Classify state — distinguish server cache, URL, form, local UI, and global client state
- [ ] URL as state — put filters, tabs, and pagination in the URL so views are shareable
- [ ] Single source of truth — avoid duplicated and contradictory state
- [ ] State machines — model flows with explicit states and transitions (XState or a reducer)
- [ ] Make impossible states impossible — use discriminated unions instead of boolean soup

## Client state

- [ ] Context limits — know when context causes re-render problems
- [ ] External stores — use Zustand, Jotai, or Redux Toolkit and explain the trade-offs
- [ ] Redux concepts — actions, reducers, selectors, middleware; read a legacy Redux codebase
- [ ] Selectors and subscriptions — subscribe components to only what they need
- [ ] Persistence — save and rehydrate state safely, with versioning

## Server state

- [ ] Server state is a cache — explain why fetched data isn't yours to "own"
- [ ] Query libraries — use TanStack Query or SWR: keys, stale time, refetching
- [ ] Framework data loading — route loaders and Server Components as an alternative to a client query library
- [ ] Mutations and invalidation — keep the cache correct after writes
- [ ] Optimistic updates — update immediately and roll back on failure
- [ ] Pagination and infinite scroll — cursor vs offset; preserving scroll position
- [ ] Race conditions — cancel or ignore stale responses
- [ ] Loading, empty, and error states — design all of them for every async view
- [ ] Retries and backoff — retry transient failures without hammering the server
- [ ] Prefetching — load data on hover or intent

## APIs

- [ ] REST — resources, verbs, status codes, pagination, and filtering conventions
- [ ] GraphQL — queries, mutations, fragments, and a normalised cache client
- [ ] Type-safe APIs — tRPC or generated clients from OpenAPI
- [ ] Validating API responses — parse data at the network boundary instead of trusting a type assertion
- [ ] Real time — WebSockets, Server-Sent Events, and polling; choose between them
- [ ] Authentication flows — session cookies vs tokens, refresh, and protecting routes
- [ ] Mocking — develop against MSW when the API isn't ready

## Advanced

- [ ] Offline and sync — queue mutations offline and reconcile on reconnect
- [ ] Local-first — know CRDTs and sync engines exist and what problems they solve
- [ ] Undo and redo — implement history for a non-trivial editor

## Projects

- [ ] Data-heavy dashboard — tables with server-side sort, filter, pagination, all reflected in the URL
- [ ] Real-time app — chat or collaborative list with optimistic updates and reconnection

## Resources

- [TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [TkDodo's blog: Practical React Query](https://tkdodo.eu/blog/practical-react-query)
- [Redux: Style Guide](https://redux.js.org/style-guide/)
- [Mock Service Worker](https://mswjs.io/)
