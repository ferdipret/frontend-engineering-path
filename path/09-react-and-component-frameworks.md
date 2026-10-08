# React and Component Frameworks

> Stage: 2 · Professional
> Component-driven UI is how modern frontends are built. Go deep on React, since it dominates the job market, but learn the ideas well enough to pick up Vue, Svelte, or Solid in a week.

## The component model

- [ ] Declarative UI — explain UI as a function of state and why it beats manual DOM updates
- [ ] Components and JSX — write components; know what JSX compiles to
- [ ] Props — pass data and callbacks down; `children` and composition
- [ ] State — `useState`, updater functions, and state as a snapshot
- [ ] Rendering lists — keys, why they matter, and why index keys cause bugs
- [ ] Conditional rendering — patterns and pitfalls (`0 &&`)
- [ ] Events — synthetic events and handler conventions
- [ ] Controlled vs uncontrolled inputs — pick the right one for each form

## Thinking in React

- [ ] Component decomposition — break a design into a component hierarchy
- [ ] Where state lives — lift state up; colocate it as low as possible
- [ ] Derived state — compute during render rather than syncing with effects
- [ ] Purity — keep render free of side effects; understand Strict Mode double-invocation
- [ ] Immutable updates — update objects and arrays without mutation

## Hooks in depth

- [ ] `useEffect` — synchronise with external systems; dependencies and cleanup
- [ ] You might not need an effect — recognise and remove unnecessary effects
- [ ] `useRef` — DOM access and mutable values that don't trigger renders
- [ ] `useReducer` — model complex state transitions
- [ ] `useContext` — share values without prop drilling, and its re-render cost
- [ ] `useMemo` and `useCallback` — when they help and when they're noise; the React Compiler
- [ ] Custom hooks — extract and share stateful logic
- [ ] `useId`, `useSyncExternalStore`, `useLayoutEffect` — know what each is for
- [ ] `useEffectEvent` — read the latest props and state inside an effect without re-running it
- [ ] Rules of hooks — and why they exist

## How React works

- [ ] Render and commit — the phases, and what triggers a re-render
- [ ] Reconciliation — how element type and keys determine state preservation
- [ ] Batching — how state updates are grouped
- [ ] Concurrent features — `useTransition`, `useDeferredValue`, and interruptible rendering
- [ ] Suspense — declarative loading states and the `use` hook
- [ ] Error boundaries — contain rendering failures
- [ ] Portals — render outside the parent DOM hierarchy
- [ ] `<Activity>` and `<ViewTransition>` — hide UI while keeping its state, and animate between UI states

## Patterns

- [ ] Composition patterns — compound components, render props, slots via `children`
- [ ] Forms — actions, `useActionState`, `useOptimistic`, or a library like React Hook Form
- [ ] Headless components — separate behaviour from presentation (Radix, React Aria)
- [ ] Refs and imperative handles — expose imperative APIs sparingly
- [ ] Code splitting — `lazy` and Suspense boundaries
- [ ] Profiling — find wasted renders with React DevTools Profiler
- [ ] Testing components — test behaviour through the rendered output with Testing Library, not implementation details

## Beyond React

- [ ] Signals and fine-grained reactivity — how Solid, Vue, Svelte, and Angular differ from the virtual DOM model
- [ ] Try a second framework — build the same small app in Vue or Svelte
- [ ] Web Components interop — use custom elements inside a framework
- [ ] Build a toy framework — implement a minimal virtual DOM or signals library to demystify it

## Projects

- [ ] Rebuild your vanilla apps — port the to-do and API explorer to React and compare
- [ ] Component library starter — accessible Button, Dialog, Tabs, Combobox, and Toast with TypeScript
- [ ] Multi-step form — validation, async submission, optimistic UI, and error recovery

## Resources

- [react.dev: Learn](https://react.dev/learn)
- [react.dev: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Build your own React](https://pomb.us/build-your-own-react/)
- [Dan Abramov's overreacted.io](https://overreacted.io/)
