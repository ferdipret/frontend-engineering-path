# React and Component Frameworks: Practice test

### 1. What does this JSX compile to with the modern (automatic) JSX runtime?

```jsx
const el = <Greeting name="Ada">Hi</Greeting>;
```

- [ ] A call to `Greeting({ name: 'Ada', children: 'Hi' })`, which runs the component immediately
- [x] A call like `jsx(Greeting, { name: 'Ada', children: 'Hi' })`, which returns a plain object describing the element
- [ ] A call to `document.createElement('Greeting')` followed by `setAttribute`
- [ ] A template string that React parses at runtime

> JSX is compiled to a function call (`jsx` from `react/jsx-runtime`, or `React.createElement` with the classic runtime) that returns a React element: a plain object with `type` and `props`. The component function is not called at that point; React calls it later during rendering. That is why you never call components yourself.

### 2. The cart is empty. What appears in the DOM?

```jsx
function Cart({ items }) {
  return (
    <div>
      {items.length && <ItemList items={items} />}
    </div>
  );
}
```

- [ ] An empty `<div>`
- [ ] Nothing at all; the component returns `null`
- [x] A `<div>` containing the text `0`
- [ ] An error, because `&&` needs a boolean

> `0 && anything` evaluates to `0`, and React renders numbers. Only `false`, `null`, `undefined`, and `true` render nothing. Use `items.length > 0 &&` or a ternary.

### 3. After one click, what is logged and what does the button show?

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  function handleClick() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(c => c + 1);
    console.log(count);
  }
  return <button onClick={handleClick}>{count}</button>;
}
```

- [x] Logs 0; the button shows 2
- [ ] Logs 3; the button shows 3
- [ ] Logs 0; the button shows 1
- [ ] Logs 0; the button shows 3

> `count` is a constant for this render (0), so the log is 0 and the first two calls both queue "replace with 1". The third is an updater that receives the pending value 1 and returns 2. React processes the queue in order during the next render.

### 4. A list of rows, each with an uncontrolled text input, uses `key={index}`. The user types "A" in row 1 and "B" in row 2, then deletes row 1 (the item is removed from the array). What do they see?

- [ ] One row whose input contains "B", as expected
- [x] One row showing the second item's label, but with "A" in its input
- [ ] Both inputs are cleared because the list re-rendered
- [ ] React throws a duplicate key error

> With index keys, the remaining row has key `0`, which React matches to the DOM and state that previously belonged to key `0`: the input containing "A". The row with key `1` is the one removed. Props update to the second item's data but the uncontrolled input's DOM state stays put. A stable ID as key fixes it.

### 5. Why is this component a problem?

```jsx
function ProductPage({ product }) {
  function PriceTag() {
    const [showTax, setShowTax] = useState(false);
    return <button onClick={() => setShowTax(!showTax)}>{format(product.price, showTax)}</button>;
  }
  return <section><h1>{product.name}</h1><PriceTag /></section>;
}
```

- [ ] Hooks cannot be used in nested functions, so `useState` throws
- [ ] `PriceTag` cannot read `product` because it is not passed as a prop
- [ ] Nothing is wrong; this is a common way to keep helpers private
- [x] `PriceTag` is a new component type on every render of `ProductPage`, so React unmounts and remounts it and `showTax` resets

> Each render of `ProductPage` creates a new `PriceTag` function. Reconciliation compares types by identity, sees a different type at that position, and destroys the old subtree including its state and DOM. It works on first render and breaks whenever the parent re-renders. Define components at module scope and pass data as props.

### 6. Explain what "state as a snapshot" means, using this code. What does the alert show if the user clicks "Send" and then types more within five seconds?

```jsx
function Form() {
  const [text, setText] = useState('');
  function handleSend() {
    setTimeout(() => alert(text), 5000);
  }
  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </>
  );
}
```

> The alert shows the text as it was when "Send" was clicked. Each render has its own `text` constant, and the functions created during that render close over that value. Calling `setText` does not change the existing variable; it triggers a new render with a new `text` and a new `handleSend`. The timeout callback belongs to the earlier render, so it sees the earlier value. This is usually the correct behaviour (you send what the user saw when they clicked). If you truly need the latest value in an asynchronous callback, read it from a ref that you keep updated, or restructure so the value is passed explicitly.

### 7. A component stores `firstName` and `lastName` in state. Which is the best way to get `fullName`?

- [ ] A third `useState` updated inside both `onChange` handlers
- [ ] A third `useState` updated by a `useEffect` that depends on `[firstName, lastName]`
- [x] `const fullName = firstName + ' ' + lastName;` in the component body
- [ ] A `useRef` assigned during render

> It is derivable, so compute it during render. The effect version adds an extra render and briefly shows a stale combination; duplicating it in handlers invites drift when a new handler forgets. A ref written during render breaks purity and would not be a reason to re-render.

### 8. What is wrong with this effect, and what happens?

```jsx
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const options = { includePosts: true };

  useEffect(() => {
    fetchUser(userId, options).then(setUser);
  }, [userId, options]);

  return <UserCard user={user} />;
}
```

- [ ] `fetchUser` cannot be called in an effect; it must be in an event handler
- [x] `options` is a new object each render, so the effect re-runs after every render: fetch, set state, render, fetch again, forever
- [ ] `setUser` is missing from the dependency array, so `user` is never updated
- [ ] Nothing; `options` has the same contents, so React treats it as unchanged

> Dependencies are compared with `Object.is`, and an object literal created in the component body is a different reference each render. Setting state causes a render, which creates a new `options`, which re-runs the effect. Move the object inside the effect, hoist it to module scope, or depend on primitives. (The effect also lacks protection against a stale response when `userId` changes.) State setters are stable and need not be listed.

### 9. This component shows wrong data when the user switches quickly between profiles. Explain the bug and fix it.

```jsx
function Bio({ personId }) {
  const [bio, setBio] = useState(null);
  useEffect(() => {
    fetchBio(personId).then(result => setBio(result));
  }, [personId]);
  return <p>{bio ?? 'Loading…'}</p>;
}
```

> It is a race condition. Switching from A to B starts two requests; if A's response arrives after B's, `setBio` runs with A's data while B is selected. Responses do not arrive in request order. Fix it with cleanup so the outdated effect ignores its result:
>
> ```jsx
> useEffect(() => {
>   let ignore = false;
>   setBio(null);
>   fetchBio(personId).then(result => {
>     if (!ignore) setBio(result);
>   });
>   return () => { ignore = true; };
> }, [personId]);
> ```
>
> Better, pass an `AbortController` signal to `fetch` and abort in cleanup, which also cancels the network request. In a real app use a query library or framework loader, which handle this plus caching and deduplication.

### 10. In development with `<StrictMode>`, a component's effect logs "connected" twice on mount. What should you conclude?

- [ ] There is a bug in React 19; remove `<StrictMode>`
- [ ] The component is being rendered by two parents
- [ ] The dependency array is wrong
- [x] This is deliberate: React runs setup, cleanup, setup to check that your cleanup properly undoes the setup. It does not happen in production

> Strict Mode double-invokes effects (and render functions) in development to expose missing cleanup and impure rendering. If the sequence connect, disconnect, connect is indistinguishable to the user from a single connect, your effect is correct. If you see two live connections, the cleanup is missing.

### 11. A page-view logger should fire when `url` changes and include the current cart size, but must not fire again when only the cart changes. Which version is correct?

```jsx
// A
useEffect(() => {
  logVisit(url, cartCount);
}, [url, cartCount]);

// B
useEffect(() => {
  logVisit(url, cartCount);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [url]);

// C
const onVisit = useEffectEvent((visitedUrl) => {
  logVisit(visitedUrl, cartCount);
});
useEffect(() => {
  onVisit(url);
}, [url]);

// D
const onVisit = useEffectEvent((visitedUrl) => {
  logVisit(visitedUrl, cartCount);
});
useEffect(() => {
  onVisit(url);
}, [url, onVisit]);
```

- [ ] A
- [ ] B
- [x] C
- [ ] D

> A logs a visit every time the cart changes. B works by accident today but suppresses the linter, so any dependency added later is silently missed and stale values go unnoticed. C separates the reactive part (`url`, a real dependency, passed as an argument) from the non-reactive read (`cartCount`, always the latest inside the Effect Event). D lists the Effect Event as a dependency: its identity changes on every render by design, so the effect would run after every render, and the linter flags it.

### 12. What does this render after the checkbox is toggled, given the user had clicked the counter up to 5 first?

```jsx
function App() {
  const [fancy, setFancy] = useState(false);
  return (
    <div>
      {fancy ? <Counter className="fancy" /> : <Counter />}
      <input type="checkbox" checked={fancy} onChange={e => setFancy(e.target.checked)} />
    </div>
  );
}
```

- [ ] The count resets to 0 because a different `<Counter />` JSX expression is rendered
- [x] The count stays at 5 because a `Counter` is at the same position in the tree in both cases
- [ ] The count resets to 0 because the `className` prop changed
- [ ] React warns about missing keys

> React identifies component instances by position, type, and key. Both branches produce a `Counter` as the first child of the `div`, so it is the same instance receiving new props. To reset it, give the branches different keys or render them at different positions.

### 13. How do you reset all of `EditForm`'s internal state when the user selects a different contact, without writing an effect?

> Give it a key that identifies the entity: `<EditForm key={contact.id} contact={contact} />`. When the key changes React treats it as a different component instance: it unmounts the old one and mounts a new one, so every `useState` initialiser inside runs again with the new contact. This is simpler and more reliable than an effect that calls several setters when `contact.id` changes, which would render once with stale state first and is easy to leave incomplete when new state is added.

### 14. A settings screen has two tabs. The "Profile" tab contains a half-filled form and a component that subscribes to a WebSocket in an effect. The user switches to the other tab and back. With `<Activity mode={tab === 'profile' ? 'visible' : 'hidden'}>` around the profile tab, what happens?

- [ ] The form is reset and the WebSocket subscription stays open throughout
- [ ] The form keeps its values and the WebSocket subscription stays open throughout
- [x] The form keeps its values; the subscription's effect is cleaned up while hidden and set up again when visible
- [ ] The form is reset and the subscription is recreated, exactly as with `{tab === 'profile' && <Profile />}`

> A hidden Activity keeps the subtree's state and DOM (hidden with `display: none`) but destroys its effects, so subscriptions do not run in the background; they are recreated when it becomes visible. Conditional rendering with `&&` unmounts everything, losing the form state. Hiding with CSS alone would keep the state but leave the subscription running.

### 15. `ThemeContext` provides `{ theme, toggle }` created inline in `App`'s render. `Toolbar` is wrapped in `memo` and has a child `ThemedButton` that calls `useContext(ThemeContext)`. `App` re-renders because of unrelated state. What re-renders?

- [ ] Nothing below `App`, because `memo` on `Toolbar` blocks it
- [ ] `Toolbar` and `ThemedButton`
- [x] `ThemedButton` only (assuming `Toolbar`'s props are unchanged), because the context value is a new object and context updates pass through `memo`
- [ ] Nothing, because the theme itself did not change

> The inline object is a new reference every render, so by `Object.is` the context value changed and every consumer re-renders. `memo` only compares props; it does not stop context-triggered renders of descendants. `Toolbar` itself is skipped. Memoise the value (`useMemo`, or the React Compiler) so consumers re-render only when `theme` actually changes.

### 16. Which statement about `useMemo` and `useCallback` is correct?

- [ ] Wrapping every handler in `useCallback` makes child components skip re-rendering
- [ ] `useMemo` guarantees the calculation runs only once for the life of the component
- [ ] With the React Compiler enabled, `useMemo` and `useCallback` throw an error
- [x] `useCallback` only helps when the function's identity matters: a prop to a memoised child, or a dependency of an effect or another memo

> A stable function reference does nothing on its own; the child re-renders with its parent unless it is memoised. `useMemo` recomputes when dependencies change and React may discard the cache. The React Compiler adds memoisation automatically and coexists with manual hooks, which remain as an escape hatch.

### 17. Why does React require hooks to be called unconditionally and in the same order on every render?

> React does not identify hooks by name. For each component instance it stores hook state in an ordered list and matches each hook call to a slot by call order: first call, slot 0; second call, slot 1. If a hook is skipped by a condition, an early return, or a loop that runs a different number of times, every hook after it reads the slot belonging to a different hook, so state would be handed to the wrong variable. React can detect a change in the total count and throw, but not every mismatch. Keeping the order fixed is what allows the API to work without keys or names. The fix is to call the hook always and put the condition inside it, or move the conditional part into its own component.

### 18. What does this log on a click? (React 18 or later with `createRoot`.)

```jsx
function Demo() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  console.log('render');

  async function handleClick() {
    setA(1);
    setB(1);
    await Promise.resolve();
    setA(2);
    setB(2);
  }
  return <button onClick={handleClick}>{a + b}</button>;
}
```

- [ ] "render" four times, once per setter
- [ ] "render" once, because everything in one handler is batched
- [x] "render" twice: one render for the two updates before the `await`, one for the two after
- [ ] "render" three times

> React batches all updates made within the same task. The two before the `await` are one batch. The continuation after `await` runs later as a microtask, outside that batch, and its two updates are batched together (automatic batching applies outside event handlers since React 18). In Strict Mode development each render logs twice, but the number of renders is two.

### 19. A parent holds `query` state for a search input and renders `<Results query={query} />`, which is slow. Typing feels laggy. Which change keeps the input responsive without a fixed delay?

- [ ] Wrap `setQuery` in `startTransition` and keep passing `query` as the input's `value`
- [x] Keep the input bound to `query`, pass `useDeferredValue(query)` to a memoised `Results`
- [ ] Move the filtering into a `useEffect`
- [ ] Wrap `Results` in `<Suspense>`

> `useDeferredValue` lets the input re-render immediately with the new text while `Results` re-renders in the background with a lagging value, and that background render is interruptible. `Results` must be memoised (or compiled) so the urgent render can skip it. A controlled input's own value cannot be updated in a transition: it would lag behind the keystrokes. An effect or a Suspense boundary does not make rendering interruptible.

### 20. Which error will an error boundary around `Widget` catch?

```jsx
function Widget({ data }) {
  useEffect(() => {
    setTimeout(() => { throw new Error('A'); }, 1000);
  }, []);

  function handleClick() {
    throw new Error('B');
  }

  if (!data) throw new Error('C');

  return <button onClick={handleClick}>{data.label}</button>;
}
```

- [ ] A, B, and C
- [ ] B and C
- [ ] A and C
- [x] Only C

> Error boundaries catch errors thrown during rendering (C), in effects and lifecycle methods, and in transitions. An error inside a `setTimeout` callback (A) happens later, outside React's call stack, and an event handler error (B) is not part of rendering. Handle those with `try`/`catch` and state, or forward them to the boundary (for example `showBoundary` from `react-error-boundary`).

### 21. A modal is rendered with `createPortal(..., document.body)` from inside a table row that has an `onClick` handler. The user clicks a button inside the modal. Does the row's `onClick` fire, and why?

> Yes. A portal changes where the DOM nodes are placed, not where the component sits in the React tree. React dispatches events along the React tree, so the click bubbles from the modal's button to the row component that rendered the portal, even though in the DOM the modal is a child of `body` and not inside the row. Context works the same way. To prevent it, call `e.stopPropagation()` on a wrapper inside the portal, or render the modal from a component that is not a descendant of the row.

### 22. This component never shows the albums; it flashes the fallback forever. Why?

```jsx
function Albums({ artistId }) {
  const albums = use(fetch(`/api/artists/${artistId}/albums`).then(r => r.json()));
  return <ul>{albums.map(a => <li key={a.id}>{a.title}</li>)}</ul>;
}
// rendered inside <Suspense fallback={<Spinner />}>
```

- [x] A new promise is created on every render, so each time React retries the component it suspends again on a different pending promise
- [ ] `use` cannot be given a promise in client components
- [ ] `fetch` must be wrapped in `useEffect`
- [ ] `use` must be the last statement in the component

> `use` suspends on a pending promise and React re-renders the component when it settles. That re-render calls `fetch` again and produces a brand-new pending promise, so it suspends again. The promise must be stable across renders: create it outside render (a loader, an event handler, a parent Server Component) or read it from a cache keyed by `artistId`.

### 23. You build a `<Tabs>` component. Compare an API that takes `tabs={[{ label, content }]}` with a compound-component API (`Tabs.List`, `Tabs.Trigger`, `Tabs.Panel`). How does the compound version share state, and what does it buy you?

> The array API is quick to use but every new requirement becomes another field or prop: icons, badges, disabled tabs, a tooltip on one trigger, custom ordering, a link in the tab list. The component must anticipate everything. With compound components, `Tabs` owns the active value (and accepts `value`/`onValueChange` to be controlled) and provides it, plus a setter and generated IDs, through context. `Trigger` and `Panel` read that context to know whether they are selected and to wire `aria-controls`/`aria-labelledby`. The caller writes the markup, so they can wrap, reorder, style, or interleave parts freely, while the keyboard behaviour and ARIA stay inside the library. Costs: more verbose usage, parts must be used inside the root (throw a helpful error otherwise), and the context value should be memoised.

### 24. A teammate wrote this test. It passes, but it broke last week when the component was refactored from `useState` to `useReducer` with no change in behaviour. What is wrong with it, and how would you rewrite it?

```jsx
test('toggles', () => {
  const { container } = render(<Accordion title="Details">Hidden text</Accordion>);
  fireEvent.click(container.querySelector('.accordion__header'));
  expect(mockSetState).toHaveBeenCalledWith(true);
  expect(container.querySelector('.accordion__body--open')).not.toBeNull();
});
```

> The test is coupled to implementation details: it finds elements by CSS class names, asserts that a mocked state setter was called, and checks a modifier class instead of what the user perceives. None of those are behaviour, so a refactor or a styling change breaks it while a real bug (for example the button not being keyboard-operable or not exposing its state) passes. Test through the rendered, accessible output:
>
> ```jsx
> test('reveals its content when the header is activated', async () => {
>   const user = userEvent.setup();
>   render(<Accordion title="Details">Hidden text</Accordion>);
>
>   const header = screen.getByRole('button', { name: 'Details' });
>   expect(header).toHaveAttribute('aria-expanded', 'false');
>   expect(screen.queryByText('Hidden text')).not.toBeInTheDocument();
>
>   await user.click(header);
>
>   expect(header).toHaveAttribute('aria-expanded', 'true');
>   expect(screen.getByText('Hidden text')).toBeVisible();
> });
> ```
>
> Querying by role and name proves the header is a real, labelled button; `user-event` simulates a full interaction; `queryBy*` is used for the absence check; and nothing refers to state, hooks, or class names, so internal refactors cannot break it.

### 25. In Solid, how many times does `console.log('body')` run if the button is clicked three times, and why is that different from React?

```jsx
function Counter() {
  const [count, setCount] = createSignal(0);
  console.log('body');
  return <button onClick={() => setCount(count() + 1)}>{count()}</button>;
}
```

- [ ] Four times: once on mount and once per click
- [ ] Never, because Solid compiles the component away
- [x] Once: the component function runs a single time, and only the text node bound to `count()` updates
- [ ] Eight times, because of double rendering in development

> In Solid a component is a setup function that runs once. The compiler turns `{count()}` into an effect that subscribes to the signal and updates that one text node when it changes. In React the component function is the unit of update: every state change re-runs it and React diffs the output. This is the core difference between fine-grained reactivity and the re-render model.

### 26. A form's submit button should show "Saving…" while the form's action runs. A teammate wrote this and the button never changes. What is wrong and how do you fix it?

```jsx
import { useFormStatus } from 'react-dom';

function ProfileForm({ action }) {
  const { pending } = useFormStatus();
  return (
    <form action={action}>
      <input name="name" />
      <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
    </form>
  );
}
```

> `useFormStatus` reports the status of a *parent* `<form>`: it must be called from a component rendered inside the form. Here it is called in the same component that renders the form, so there is no parent form and `pending` is always `false`. Extract the button into its own component (`function SubmitButton() { const { pending } = useFormStatus(); … }`) and render it inside the form, or use the `isPending` value returned by `useActionState`/`useTransition` in `ProfileForm`.

### 27. You profile a keystroke in a search box and see a 90 ms commit in which 400 `Row` components rendered with the reason "the parent component rendered". Describe how you would fix it, in order of preference.

> First check whether the rows need to render at all: their data did not change, only the input text did. (1) Move the state down: put the input and its state in their own component so the list is no longer a descendant of the component that updates, or pass the list as `children` to the stateful component so the row elements keep their identity. No memoisation needed. (2) If the list does depend on the query, defer it: pass `useDeferredValue(query)` to the list so typing stays responsive. (3) Memoise `Row` (enable the React Compiler, or use `memo`) and make sure its props are stable, as an inline object or callback would defeat it. (4) If 400 rows are inherently expensive, virtualise the list so only visible rows mount. Re-profile after each change, and confirm with a production build, because development and Strict Mode inflate timings.
