# React and Component Frameworks: Guide

## Toolkit

### DevTools and tooling

Install the **React Developer Tools** browser extension first. It adds two panels to DevTools. *Components* shows the component tree with each component's props, state, hooks, and the context it reads; you can edit state in place, click the "eye" icon to jump to the DOM node, and click the `<>` icon to jump to source. *Profiler* records commits and shows which components rendered and how long each took. Open the gear icon in either panel and turn on "Highlight updates when components render" (Components settings) and "Record why each component rendered while profiling" (Profiler settings); those two switches answer most performance questions.

Since React 19.2, development builds also emit **React Performance Tracks** into the Chrome DevTools *Performance* panel: a Scheduler track showing work by priority (blocking, transition, suspense, idle) and a Components track showing render and effect durations alongside network and layout. Use it when you need to correlate React work with what the browser was doing.

Scaffold with **Vite** (`npm create vite@latest my-app -- --template react-ts`) for a client-rendered app, or a framework (Next.js, React Router) when you need routing and server rendering. Create React App is deprecated.

Lint with **`eslint-plugin-react-hooks`**. Its `recommended` config enforces the Rules of Hooks and exhaustive dependencies, and since v6 also ships the React Compiler's diagnostics (purity, ref access in render, set-state-in-effect, and so on) whether or not you run the compiler. Treat its warnings as bugs rather than suppressing them.

The **React Compiler** (`babel-plugin-react-compiler`, stable since 1.0 in October 2025) memoizes components and hooks at build time. Components it has optimised show a "Memo ✨" badge in React DevTools.

For quick experiments use the sandboxes embedded in react.dev, the [React Compiler Playground](https://playground.react.dev/) to see compiled output, and StackBlitz (`https://vite.new/react-ts`) for a full project in the browser.

### Testing and verifying your work

Test components the way a user uses them. **React Testing Library** renders a component into a DOM and gives you queries that mirror accessibility (`getByRole('button', { name: /save/i })`, `getByLabelText`), and `@testing-library/user-event` simulates real interaction sequences (pointer, keyboard, focus) rather than firing a single synthetic event. Run it under **Vitest** with `jsdom` or `happy-dom`, or use Vitest's browser mode or **Playwright component testing** when you need real layout, focus, or scroll behaviour, which jsdom does not implement.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('increments', async () => {
  const user = userEvent.setup();
  render(<Counter />);
  await user.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

Assert on what is rendered, not on state or which hooks ran. If a refactor that keeps behaviour identical breaks a test, the test was coupled to implementation. Use `findBy*` (which waits) for anything asynchronous instead of sleeping, and test custom hooks with `renderHook` only when they are a shared library; otherwise test them through a component.

Keep `<StrictMode>` on in development. It double-invokes render functions and runs an extra setup/cleanup cycle for effects so that impure renders and missing cleanups show up immediately. A component that behaves differently under Strict Mode has a bug.

"Done" for a component means: it renders correctly for every prop combination including empty, loading, and error; it works with keyboard only; a screen reader announces it sensibly (check the accessibility tree in DevTools, and run `axe` via `vitest-axe` or the axe DevTools extension); the console is free of React warnings (keys, controlled/uncontrolled switches, hydration mismatches); and the Profiler shows no surprising re-renders during common interactions.

### Tricks and gotchas

- To reset a component's state, change its `key`. `<Form key={userId} />` gives you a fresh form per user with no effect and no manual reset code.
- `console.log` in a component logs twice in development because of Strict Mode. That is expected; do not remove Strict Mode to "fix" it.
- State updates are not applied until the next render. Reading the state variable right after `setX` gives the old value; if you need the next value, compute it into a local variable first.
- An object or function created during render is a new reference every time. That is what invalidates `memo`, effect dependencies, and context consumers, and it is what the React Compiler fixes automatically.
- `{count && <List />}` renders `0` when `count` is 0. Write `count > 0 &&`.
- Never define a component inside another component. Its identity changes every render, so React unmounts and remounts it, destroying state and DOM each time.
- If an effect only exists to set state from other props or state, delete it and compute the value during render.
- Before reaching for `memo`, try moving state down or passing the expensive subtree as `children`; elements passed as props keep their identity when the parent's own state changes.
- In React 19, `ref` is a regular prop for function components, `<Context value={…}>` replaces `<Context.Provider>`, and ref callbacks may return a cleanup function. Older codebases use `forwardRef`; it still works but is no longer needed.
- `onChange` in React fires on every keystroke (it behaves like the native `input` event), unlike the native `change` event, which fires on commit.
- Select a component in the Components panel and it becomes `$r` in the console; `$r.props` is handy for poking at live values.
- Hydration mismatch warnings almost always come from rendering something that differs between server and client (`Date.now()`, `window` checks, locale formatting). Fix the cause; do not silence with `suppressHydrationWarning` except for genuinely unavoidable text such as timestamps.

### Official references

- [react.dev: Learn React](https://react.dev/learn) — the official course; the "Adding Interactivity", "Managing State", and "Escape Hatches" chapters are the core of this module.
- [react.dev: API reference](https://react.dev/reference/react) — every hook, component, and API with caveats and troubleshooting sections.
- [react.dev: Rules of React](https://react.dev/reference/rules) — the purity and hook rules that the compiler and linter assume.
- [react.dev: React Compiler](https://react.dev/learn/react-compiler/introduction) — what the compiler does, installation, and incremental adoption.
- [react.dev: eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks) — every lint rule and what it catches.
- [react.dev: React Developer Tools](https://react.dev/learn/react-developer-tools) — installing and using the extension.
- [react.dev: Blog](https://react.dev/blog) — release posts; read the React 19, 19.2, and 19.3 posts to know what is current.
- [Testing Library: React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) — the standard component testing approach.
- [WAI-ARIA Authoring Practices Guide: Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) — the keyboard and ARIA contract for every common widget you will build.
- [Vue](https://vuejs.org/guide/introduction.html), [Svelte](https://svelte.dev/docs/svelte/overview), [Solid](https://docs.solidjs.com/), and [Angular](https://angular.dev/overview) docs — for the "Beyond React" section.

## Skills

### Declarative UI

In imperative DOM code you write the *transitions*: when the request finishes, hide the spinner, enable the button, append the rows. With n pieces of state there are roughly n² transitions between UI configurations, and every one you forget is a bug where the screen shows something the data does not justify. Declarative UI flips this: you write a function from the current state to what the screen should look like, and the framework works out which DOM operations get from the previous output to the new one.

```jsx
function Status({ status, error }) {
  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <p role="alert">{error.message}</p>;
  return <p>Saved</p>;
}
```

There is no code here for "going from error back to loading". You only describe each state, so the UI cannot drift out of sync with the data. The costs are real but usually worth it: the framework has to do work to find the difference (rendering and diffing in React, dependency tracking in signal-based frameworks), and you give up direct control of when the DOM is touched, which is why escape hatches like refs and effects exist for focus, measurement, and third-party widgets.

The common mistake when starting out is carrying imperative habits over: reaching for a ref to toggle a class, or writing an effect that "updates" one piece of state when another changes. If you find yourself describing *how to change* the screen rather than *what it should be*, step back and ask which state the UI depends on.

**Try it:** Write a small form (text input, submit button, success and error messages) twice: once with `document.querySelector` and manual updates, once in React. List every state the form can be in (empty, typing, submitting, success, error) and count the lines in the vanilla version that exist only to move between them.

**Resources**
- [react.dev: Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state)
- [react.dev: Thinking in React](https://react.dev/learn/thinking-in-react)

### Components and JSX

A component is a JavaScript function whose name starts with a capital letter and which returns something React can render: JSX, a string, a number, an array, or `null`. JSX is syntax, not a template language. The compiler (Babel, SWC, esbuild, or TypeScript) turns each tag into a function call that returns a plain object describing what you want:

```jsx
const el = <Button kind="primary" onClick={save}>Save</Button>;

// compiles, with the automatic runtime, to roughly:
import { jsx as _jsx } from 'react/jsx-runtime';
const el = _jsx(Button, { kind: 'primary', onClick: save, children: 'Save' });
// => { type: Button, props: { kind: 'primary', onClick: save, children: 'Save' }, key: null }
```

That object is a *React element*: cheap, immutable, and not a DOM node. Writing `<Button />` does not call `Button`; React calls it later, during rendering. This is why you must never call a component as a plain function (`Button()`): its hooks would be attached to the caller.

The rules that trip people up follow from JSX being JavaScript. Lowercase tags (`<div>`) become strings and mean host elements; capitalised tags are variable references, so `<item.icon />` fails but `const Icon = item.icon; <Icon />` works. A component returns one root, so wrap siblings in a fragment (`<>…</>`). Attributes are camelCased DOM properties (`className`, `htmlFor`, `tabIndex`), `style` takes an object, and `{}` holds any expression but not statements. Strings in `{}` are escaped, which is what protects you from injection; `dangerouslySetInnerHTML` is the deliberate bypass.

Older code has `import React from 'react'` at the top of every file because the classic transform compiled to `React.createElement`. The automatic runtime removed that need.

**Try it:** Paste a component with nested children, a fragment, and a `.map()` into the [Babel REPL](https://babeljs.io/repl) with the React preset set to the automatic runtime. Read the output and find `jsx` versus `jsxs`, where `key` goes, and how `children` is passed.

**Resources**
- [react.dev: Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx)
- [react.dev: JavaScript in JSX with Curly Braces](https://react.dev/learn/javascript-in-jsx-with-curly-braces)
- [react.dev: createElement](https://react.dev/reference/react/createElement)

### Props

Props are the arguments to a component: a single object, read-only, passed from parent to child. Data flows down; when a child needs to tell the parent something, the parent passes a function down and the child calls it. Naming convention: `onSomething` for the prop, `handleSomething` for the function that implements it.

```tsx
type AlertProps = {
  tone?: 'info' | 'danger';
  onDismiss?: () => void;
  children: React.ReactNode;
};

function Alert({ tone = 'info', onDismiss, children }: AlertProps) {
  return (
    <div role="alert" className={`alert alert-${tone}`}>
      {children}
      {onDismiss && <button onClick={onDismiss}>Dismiss</button>}
    </div>
  );
}
```

`children` is just the prop that receives whatever you nest between the tags. It is the most important composition tool in React: a `Card` that accepts `children` does not need to know what goes inside it, so you do not end up with `title`, `subtitle`, `showFooter`, and `footerButtonLabel` props. Any prop can hold JSX, so a layout with several holes takes `header={<Nav />}` and `sidebar={<Filters />}`.

Details that matter: defaults in destructuring apply only for `undefined`, not `null`. Never mutate props; they belong to the parent, and the object is frozen in development. Spreading (`<input {...rest} />`) is useful for wrapper components but forwards everything, so destructure the props you consume first to avoid leaking unknown attributes to the DOM. Every render creates new object, array, and function props, so "the same props" by value are different by reference; this matters for memoisation, not for correctness.

*Prop drilling* (passing a prop through layers that do not use it) is often a sign to restructure with `children` before reaching for context: if the top-level component renders `<Layout><Profile user={user} /></Layout>`, `Layout` never needs to see `user`.

**Try it:** Build a `Card` with `title`, `actions`, and `children` slots, then use it for three unrelated pieces of UI without adding any boolean props. Then pass a number, then `null`, to a prop with a default and observe which triggers the default.

**Resources**
- [react.dev: Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
- [react.dev: Passing Data Deeply with Context (alternatives section)](https://react.dev/learn/passing-data-deeply-with-context#before-you-use-context)

### State

State is memory that belongs to a component instance and survives between renders. `useState(initial)` returns the value for *this* render and a setter. Calling the setter does not change the variable; it asks React to render again with a new value.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    setCount(count + 1);
    console.log(count); // still 0
  }
  // after the click, count is 1, not 2
}
```

Each render is a snapshot: `count` is a constant inside it, and every handler, effect, and timeout created during that render sees that render's value forever. Both calls above compute `0 + 1`. When the next state depends on the previous one, pass an updater function; React queues it and feeds each one the result of the last:

```jsx
setCount(c => c + 1);
setCount(c => c + 1); // 2
```

The same snapshot rule explains "stale closure" bugs: a `setTimeout` callback alerts the value from when it was scheduled, not the latest.

Other details. React compares the new value with `Object.is` and skips the re-render if it is identical, so mutating an object and setting the same reference does nothing. The initial value is used only on the first render; `useState(expensive())` still *calls* `expensive` every render, so pass the function itself, `useState(expensive)`, for lazy initialisation. To store a function in state you need `useState(() => fn)`. State is tied to the component's position in the tree, not the function, so two `<Counter />`s are independent. And keep state minimal: do not store anything you can compute from props or other state.

**Try it:** Write a counter with a "+3" button that calls `setCount(count + 1)` three times, see it add one, and fix it with updaters. Then add a button that does `setTimeout(() => alert(count), 3000)`, click it, increment several times, and explain the alerted value.

**Resources**
- [react.dev: State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
- [react.dev: Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- [react.dev: useState](https://react.dev/reference/react/useState)

### Rendering lists

You render a list by mapping data to elements, and every element in the array needs a `key` that is stable and unique among its siblings. The key is how React matches an element in this render with one from the last render. With keys, React can tell "item `b` moved from index 1 to index 0" from "the item at index 0 changed its contents", and it keeps each item's DOM node and component state attached to the right piece of data.

```jsx
<ul>
  {todos.map(todo => (
    <TodoRow key={todo.id} todo={todo} />
  ))}
</ul>
```

Using the array index as the key is the same as having no key (it is React's fallback, plus a warning). It works only for lists that never reorder, insert, delete, or filter. When they do, index 0 is still "the first row" to React, so the first row's state (an input's uncontrolled text, a checkbox, focus, an expanded flag, a running animation) stays in place while the data shifts underneath it. Delete the first of three rows whose inputs you have typed into and the *last* row's DOM disappears while the text stays on the wrong items.

Do not generate keys during render (`key={Math.random()}` or `crypto.randomUUID()`): every render gets new keys, so every row is destroyed and recreated, losing state and focus and wasting work. Generate the ID when the item is created and store it with the data. Use database IDs when you have them.

Other points: the key goes on the outermost element returned from `map`, including a `<Fragment key={…}>` when you return several siblings (the `<>` shorthand cannot take a key). Keys need to be unique only among siblings. `key` is not passed to the component as a prop; pass the ID separately if the child needs it.

**Try it:** Render a list of rows each containing an uncontrolled `<input>`, with a "prepend item" and a "shuffle" button. Type into the inputs, then use the buttons with `key={index}` and again with `key={item.id}`. Watch the Elements panel to see which DOM nodes flash.

**Resources**
- [react.dev: Rendering Lists](https://react.dev/learn/rendering-lists)
- [react.dev: Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)

### Conditional rendering

JSX has no `if` attribute; you use JavaScript. The options are an early `return`, the ternary `cond ? <A /> : <B />`, logical AND `cond && <A />`, and assigning JSX to a variable before the return. React renders nothing for `false`, `null`, `undefined`, and `true`, which is what makes `&&` work.

The trap is that `&&` returns its left operand when that operand is falsy, and not every falsy value renders as nothing. `0` and `NaN` are numbers, and React renders numbers:

```jsx
{items.length && <List items={items} />}      // renders "0" when empty
{items.length > 0 && <List items={items} />}  // correct
{!!items.length && <List items={items} />}    // also correct
```

An empty string renders nothing on the web but breaks React Native (text must be inside `<Text>`), so make the left side a real boolean as a habit.

The second thing to understand is how conditions interact with state. React keeps state by position in the tree. `cond ? <Counter /> : <Counter />` is the *same* position and type, so the state survives the switch; give them different keys if they should be independent. Conversely, `{show && <Panel />}` unmounts `Panel` when hidden and its state is lost. If you need to hide something but keep its state, either lift the state up, hide it with CSS, or wrap it in `<Activity>`, which has its own entry later in this guide.

For more than two branches, nested ternaries get unreadable quickly. Prefer early returns, a small sub-component, or a lookup object keyed by status. Returning `null` from a component is legitimate but note the component still mounts and its hooks still run; if the parent can decide, put the condition there.

**Try it:** Render `{count && <p>Items: {count}</p>}` with `count` at 0 and inspect the DOM for the stray `0`. Then build a two-tab UI where each tab holds a text input, toggle between conditional rendering and hiding with the `hidden` attribute, and see which one keeps the typed text.

**Resources**
- [react.dev: Conditional Rendering](https://react.dev/learn/conditional-rendering)
- [react.dev: Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)

### Events

You attach handlers with camelCase props and pass a function, not a call: `onClick={handleClick}` or `onClick={() => remove(id)}`. Writing `onClick={remove(id)}` runs `remove` during render, which is the classic infinite-loop bug when it sets state.

Handlers receive a `SyntheticEvent`, a thin cross-browser wrapper with the same interface as the native event (`target`, `currentTarget`, `preventDefault()`, `stopPropagation()`) plus `nativeEvent` when you need the original. React does not attach a listener to each node. It registers one listener per event type on the root container and dispatches through the *React* tree, which has consequences:

- Events from a portal bubble to the portal's React parent, even though it is elsewhere in the DOM.
- `e.stopPropagation()` stops React propagation, but a native listener added with `addEventListener` on an ancestor inside the root may already have run, or still run, in an order you did not expect. Avoid mixing the two systems on the same path.
- `onChange` on inputs fires on every edit (like native `input`), not on blur.
- `onScroll` does not bubble. `onMouseEnter`/`onMouseLeave` do not bubble either; that is how the native events work.
- React registers `touchstart`, `touchmove`, and `wheel` as passive, so `preventDefault()` inside `onWheel` or `onTouchMove` is ignored. Attach a non-passive native listener through a ref if you must block scrolling.
- Add `Capture` for the capture phase: `onClickCapture`.

Return `false` does nothing; call `e.preventDefault()`. Event objects are no longer pooled (since React 17), so reading `e.target` asynchronously is safe.

Handlers are the right place for side effects: they run in response to a specific user action, outside rendering. Use real interactive elements (`<button>`, `<a>`) rather than `onClick` on a `<div>`, or you lose keyboard and screen reader support.

**Try it:** Put `onClick` handlers on a button, its parent, and its grandparent, and add `onClickCapture` on the grandparent. Predict the log order, then check. Add `document.addEventListener('click', …)` and see where it lands relative to the React handlers, with and without `e.stopPropagation()`.

**Resources**
- [react.dev: Responding to Events](https://react.dev/learn/responding-to-events)
- [react.dev: Common components: React event object](https://react.dev/reference/react-dom/components/common#react-event-object)

### Controlled vs uncontrolled inputs

A form field's value has to live somewhere. In an *uncontrolled* input it lives in the DOM: you give it `defaultValue` (or `defaultChecked`) and read it when you need it, through `FormData` on submit or a ref. In a *controlled* input it lives in React state: you pass `value` and an `onChange` that updates that state, and the input always shows exactly what state says.

```jsx
// uncontrolled: the DOM owns the value
<form action={formData => save(formData.get('email'))}>
  <input name="email" type="email" defaultValue={user.email} required />
</form>

// controlled: React owns the value
const [email, setEmail] = useState(user.email);
<input value={email} onChange={e => setEmail(e.target.value)} />
```

Choose controlled when the UI must react to each keystroke: live validation, formatting or masking, a dependent field, a disabled submit button, a character counter, a search-as-you-type box. Choose uncontrolled for plain "fill in and submit" forms; there is less code, no re-render per keystroke, native validation works, and it fits React 19 form actions and libraries like React Hook Form, which are built on uncontrolled inputs for exactly these reasons. `<input type="file">` is always uncontrolled.

Mistakes to recognise. Passing `value` without `onChange` makes a read-only field and logs a warning. Letting `value` go from `undefined` to a string logs "changing an uncontrolled input to be controlled"; initialise state to `''`, not `undefined` or `null`. A controlled input must be updated synchronously from `e.target.value`; setting it after an `await` or debouncing the state update makes the caret jump and drops characters. Debounce the *consumer* of the value, not the input. `defaultValue` is read only on mount, so changing it later does nothing; change the `key` to reset. And a `<textarea>` takes `value`, a `<select>` takes `value` on the select rather than `selected` on options.

**Try it:** Build a sign-up form uncontrolled with `FormData` and native `required`/`type="email"` validation. Then add a requirement that needs control (a password strength meter, or a "confirm email" field that shows a mismatch live) and convert only the fields that need it.

**Resources**
- [react.dev: input](https://react.dev/reference/react-dom/components/input)
- [react.dev: form](https://react.dev/reference/react-dom/components/form)
- [MDN: FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

### Component decomposition

Given a design, you break it into a tree of components before writing any logic. The react.dev method is worth following literally: draw boxes around every piece of the mockup, name them, arrange them into a hierarchy, build a static version with props only, and only then decide where state goes.

Where to draw the lines is a judgement call, and these heuristics help. A component should do one thing; if its description needs "and", it may be two. Component boundaries often follow the data model: a `ProductTable` with `ProductRow`s mirrors an array of products. Split when a piece is reused, when it has its own state that the rest does not care about, or when a part re-renders far more often than its surroundings (isolating a fast-changing input keeps the rest of the page out of its renders). Do not split merely because a file is long; a 200-line component that reads top to bottom is often easier to follow than six 30-line fragments connected by eight props each.

Good signs: props read like a sentence, the component can be rendered in isolation in a test or Storybook, and it has no knowledge of where it is used. Bad signs: boolean props that select between unrelated layouts (`isCompact`, `isModal`, `isAdmin`), a component that accepts fifteen props and passes twelve through, or a "god component" that fetches, transforms, and lays out.

It is useful to separate components that know about your app (they fetch, read the router, know what a "user" is) from generic UI components (`Button`, `Dialog`, `Table`) that take plain props. The second kind is reusable and easy to test; keep domain knowledge out of it. Prefer composition over configuration: instead of `<Page showSidebar sidebarItems={…} />`, let the caller pass `<Page sidebar={<Sidebar … />}>`.

**Try it:** Take a screenshot of a real product page (a GitHub issue list or an email inbox). Draw and name the component boxes, write the tree as an indented outline, then for each component write its props as a TypeScript type. Notice which ones needed no props about the app at all.

**Resources**
- [react.dev: Thinking in React](https://react.dev/learn/thinking-in-react)
- [react.dev: Your First Component](https://react.dev/learn/your-first-component)

### Where state lives

For each piece of state, find every component that reads it or changes it. The state belongs in their closest common ancestor, and no higher. That one rule covers both directions:

*Lifting up.* When two siblings need the same value, neither can own it. Move the state to their parent, pass the value down as a prop and a setter (or a more specific callback) down for changes. The children become controlled by the parent; the parent is the single source of truth.

*Colocating (pushing down).* State placed higher than necessary makes every component below the owner re-render when it changes, and makes the owner harder to understand. If only the search box needs the draft text, the draft lives in the search box, and only the submitted query is lifted.

```jsx
function Accordion({ items }) {
  const [openId, setOpenId] = useState(null); // lifted: panels are mutually exclusive
  return items.map(item => (
    <Panel key={item.id} open={item.id === openId} onToggle={() => setOpenId(item.id)}>
      {item.body}
    </Panel>
  ));
}
```

If the panels opened independently, `open` would move back into `Panel`. The requirement decides, not habit.

A component can also offer both: accept an optional `value`/`onChange` and fall back to internal state when they are absent, the way `<input>` does. Headless libraries rely on this "controllable state" pattern.

Before lifting to a global store, ask whether the value is really client state. Data from the server belongs in a query cache, filters and the current tab often belong in the URL, and form values belong to the form. What remains for truly global state is usually small: theme, auth session, a few UI preferences.

**Try it:** Build two temperature inputs (Celsius and Fahrenheit) that stay in sync. First attempt it with state in each input and note why it cannot work without effects; then lift a single `{ value, scale }` to the parent and derive both displays.

**Resources**
- [react.dev: Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- [react.dev: Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)

### Derived state

If a value can be computed from props or existing state, compute it during render. Do not store it in state and do not keep it in sync with an effect.

```jsx
// wrong: duplicated state, an extra render, and a frame showing stale data
const [visible, setVisible] = useState([]);
useEffect(() => {
  setVisible(todos.filter(t => matches(t, filter)));
}, [todos, filter]);

// right
const visible = todos.filter(t => matches(t, filter));
```

The effect version renders once with the old `visible`, commits it, runs the effect, sets state, and renders again. It is slower, and for one commit the screen shows a combination that never should exist. Stored copies also drift: someone adds a third input to the calculation and forgets the dependency.

The same applies to flags (`const isValid = email.includes('@')`), counts, totals, sorted lists, and "selected item" objects. Store the *ID* of the selection and look the object up during render; storing the object itself gives you a stale copy when the list updates.

If the calculation is genuinely expensive (measure with `console.time` before assuming), cache it with `useMemo`, or let the React Compiler do so. That is still derivation; you have only told React it may reuse the last result.

Initialising state from a prop (`useState(props.initialColor)`) is the one legitimate copy: the prop is read once and later changes are ignored, so name the prop `initial…` or `default…` to make that clear. When the copy should reset because the entity changed, pass a `key`. The rare case where you must adjust state in response to a prop change can be done by calling the setter during render behind a comparison with the previous value, but treat needing it as a design smell.

**Try it:** Take a component holding `firstName`, `lastName`, and `fullName` in state with an effect syncing the third. Remove the state and the effect. Then, with the Profiler recording, compare the number of commits per keystroke before and after.

**Resources**
- [react.dev: You Might Not Need an Effect: Updating state based on props or state](https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
- [react.dev: Choosing the State Structure: Avoid redundant state](https://react.dev/learn/choosing-the-state-structure#avoid-redundant-state)

### Purity

React assumes that rendering is a pure calculation: given the same props, state, and context, a component returns the same JSX, and it does not change anything that existed before it was called. React relies on this to render components in any order, skip renders whose inputs have not changed, pause and restart a render (concurrent rendering), render something and throw the result away (Suspense), and to let the compiler cache output.

Impure things you must not do while rendering: mutate props, state, or any variable declared outside the component; read or write `ref.current`; call `Math.random()`, `Date.now()`, or read `localStorage`/`window` size to decide output; make network requests; touch the DOM; set state unconditionally. *Local* mutation is fine: building an array with `push` inside the component is pure from the outside because nothing else can see it.

```jsx
let guest = 0;
function Cup() {
  guest = guest + 1;             // impure: mutates something outside
  return <h2>Tea for guest #{guest}</h2>;
}
```

Side effects belong in event handlers (caused by a user action) or, failing that, in effects (caused by the component being on screen).

`<StrictMode>` exists to surface violations. In development only, it calls component functions, `useState`/`useMemo`/`useReducer` initialisers, updater functions, and reducers twice; it mounts, unmounts, and remounts every component once so that each effect runs setup, cleanup, setup; and it runs ref callbacks an extra time. A pure component produces identical results on both calls, so you notice nothing. The `Cup` above shows 2, 4, 6. An effect without cleanup opens two connections. Production builds do none of this. If double invocation breaks your code, the code was already broken for features like Activity, Fast Refresh, and transitions; fix it rather than removing Strict Mode.

**Try it:** Render three `<Cup />`s under `<StrictMode>` and observe the numbers, then fix it by passing `guest` as a prop. Next, write an effect that calls `addEventListener` without cleanup, log from the handler, and count how many times it fires per event.

**Resources**
- [react.dev: Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [react.dev: StrictMode](https://react.dev/reference/react/StrictMode)
- [react.dev: Components and Hooks must be pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure)

### Immutable updates

Treat everything in state as read-only. To change it, create a new value and pass that to the setter. There are two reasons. React decides whether anything changed with `Object.is`, so mutating an object and setting the same reference is skipped entirely. And previous renders, memoised children, and effect dependencies all hold references to the old value; mutation changes it under them.

```js
// objects: copy, then override
setUser({ ...user, address: { ...user.address, city: 'Oslo' } });

// arrays
setItems([...items, item]);                                  // add
setItems(items.filter(i => i.id !== id));                    // remove
setItems(items.map(i => (i.id === id ? { ...i, done: true } : i))); // update one
setItems(items.toSorted(byName));                            // sort without mutating
setItems(items.with(index, value));                          // replace at index
```

Mutating methods to avoid on state: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, and direct assignment (`arr[i] = x`, `obj.a = b`). Their non-mutating counterparts `toSorted`, `toReversed`, `toSpliced`, and `with` are available in all current browsers.

Spread is shallow. `{ ...user }` creates a new outer object whose `address` is the *same* nested object, so `copy.address.city = 'Oslo'` still mutates state. You must copy every level along the path to the change, and only those levels; untouched branches keep their references, which is what lets memoised children skip work. `structuredClone(state)` avoids mutation but replaces every reference, so everything re-renders.

Deeply nested updates are the cue to flatten the state shape (store entities by ID) or to use Immer, where you write mutations against a draft and it produces the minimal immutable update: `updateUser(draft => { draft.address.city = 'Oslo'; })` with `useImmer`. Redux Toolkit uses Immer internally.

**Try it:** Hold a list of `{ id, title, tags: [] }` objects in state. Implement "add a tag to item X" three ways: a buggy version that mutates (confirm the UI does not update, or updates only on the next unrelated render), a correct spread version, and an Immer version.

**Resources**
- [react.dev: Updating Objects in State](https://react.dev/learn/updating-objects-in-state)
- [react.dev: Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state)
- [Immer: Introduction](https://immerjs.github.io/immer/)

### `useEffect`

An effect synchronises your component with something outside React: a WebSocket, a browser API subscription, a third-party widget, a timer, the document title. It runs after React has committed the render to the DOM. The mental model is not "lifecycle" but "start synchronising / stop synchronising": setup starts it for the current props and state, cleanup stops it.

```jsx
useEffect(() => {
  const connection = createConnection(serverUrl, roomId);
  connection.connect();
  return () => connection.disconnect();
}, [serverUrl, roomId]);
```

The dependency array lists every reactive value the effect reads (props, state, and anything computed from them). React compares each with `Object.is` after every render; if any changed it runs the previous cleanup with the old values, then setup with the new. No array means after every render; `[]` means the effect uses no reactive values. You do not choose the dependencies: the code inside the effect determines them, and the `react-hooks/exhaustive-deps` lint rule checks. If you do not want the effect to re-run when something changes, change the code so it no longer depends on it: move an object or function inside the effect, use an updater (`setCount(c => c + 1)`) instead of reading state, or move non-reactive logic into an Effect Event (see the `useEffectEvent` entry).

Cleanup is not optional for anything that subscribes, connects, or schedules. For fetching, use it to ignore or abort a stale response. In Strict Mode, development runs setup, cleanup, setup on mount; if that sequence is visible to the user, the cleanup is wrong.

Common mistakes: object or function dependencies created during render (the effect runs every time), suppressing the lint rule, using `async` directly as the effect function (it returns a promise, not a cleanup), and setting state unconditionally (infinite loop).

**Try it:** Write a `useEffect` that subscribes to `window` `resize` and stores the width. Verify cleanup with `getEventListeners(window)` in the Chrome console after unmounting. Then write a chat-room effect that depends on `roomId` and log connect/disconnect as you switch rooms.

**Resources**
- [react.dev: Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [react.dev: Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects)
- [react.dev: Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)

### You might not need an effect

Effects are for synchronising with systems outside React. If no external system is involved, an effect is the wrong tool, and it costs you an extra render, a frame of inconsistent UI, and code whose order of execution is hard to follow. Learn to recognise the unnecessary ones:

- *Transforming data for rendering.* Setting state from other state or props in an effect. Compute it during render instead, with `useMemo` if it is expensive.
- *Handling a user event.* Logic that should happen because the user clicked belongs in the click handler. An effect that watches `submitted` become `true` and then posts the form has lost the information about *why* it is running and will re-fire on remount.
- *Resetting state when a prop changes.* Give the component a `key` so React recreates it.
- *Notifying a parent.* Calling `onChange(value)` from an effect after state changes; instead call the parent's callback in the same event handler that sets the state, or lift the state up.
- *Chains of effects*, each setting state that triggers the next. Calculate the whole next state in the event handler or a reducer.
- *Initialising the app.* Code that must run once per page load belongs at module scope or before `createRoot`, not in an effect that Strict Mode runs twice.
- *Subscribing to an external store.* Use `useSyncExternalStore`.

```jsx
// before
useEffect(() => { setSelection(null); }, [items]);
// after: derive instead of resetting
const selection = items.find(i => i.id === selectedId) ?? null;
```

Data fetching in an effect is legitimate but has many traps (races, no caching, waterfalls, no server rendering), so use a framework's data loading or a query library, which handle them for you.

The test to apply: *why does this code run?* If it is because the user did something, it is an event handler. If it is because the component is being displayed and needs to stay connected to something outside React, it is an effect.

**Try it:** Search a codebase (yours or an open source one) for `useEffect` and classify ten of them against the list above. Rewrite at least two without an effect and confirm with the Profiler that the commit count per interaction dropped.

**Resources**
- [react.dev: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [react.dev: Separating Events from Effects](https://react.dev/learn/separating-events-from-effects)

### `useRef`

`useRef(initial)` returns an object `{ current: initial }` that stays the same object for the component's whole life. Changing `current` does not cause a render and React never reads it. That gives it two uses.

*A handle to a DOM node.* Pass the ref to an element's `ref` attribute and React sets `current` to the node on commit and back to `null` on unmount. Use it for what the declarative model cannot express: focus, scroll, measurement, text selection, media playback, and handing a node to a non-React library.

```jsx
function Search() {
  const inputRef = useRef(null);
  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current.focus()}>Focus</button>
    </>
  );
}
```

*An instance variable.* A value that must persist between renders but that the UI does not display: a timer ID, an `AbortController`, the previous value of a prop, a "has this fired" flag.

The rule: do not read or write `ref.current` during rendering (lazy initialisation with `if (ref.current === null)` is the one accepted exception). Rendering must be pure and a ref is mutable shared memory, so output that depends on it can be stale or inconsistent. If the screen should show the value, it is state. Read and write refs in event handlers and effects. The compiler's lint rules flag violations.

Other details. A *ref callback* (`ref={node => …}`) runs when the node attaches; in React 19 it can return a cleanup function, which is the cleanest way to set up an observer on a node and to handle lists of refs (store nodes in a `Map`). The ref is not set during the first render, so `ref.current` is `null` there. Do not use a ref to change DOM that React manages (removing children, changing text); React will not know and may crash on the next update. In React 19 function components receive `ref` as an ordinary prop.

**Try it:** Build a stopwatch that stores the interval ID in a ref and elapsed time in state. Then try storing the elapsed time in a ref instead and observe that the display never updates. Finally, write a ref callback that attaches a `ResizeObserver` and returns a cleanup.

**Resources**
- [react.dev: Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs)
- [react.dev: Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)
- [react.dev: useRef](https://react.dev/reference/react/useRef)

### `useReducer`

When a component has several state values that change together, or many handlers that each update state in slightly different ways, move the update logic into a reducer: a pure function `(state, action) => nextState`. Handlers then describe *what happened* by dispatching an action, and all the rules for how state changes sit in one place.

```tsx
type State = { status: 'idle' | 'loading' | 'error'; items: Item[]; error?: string };
type Action =
  | { type: 'fetch_started' }
  | { type: 'fetch_succeeded'; items: Item[] }
  | { type: 'fetch_failed'; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'fetch_started':   return { ...state, status: 'loading', error: undefined };
    case 'fetch_succeeded': return { status: 'idle', items: action.items };
    case 'fetch_failed':    return { ...state, status: 'error', error: action.error };
  }
}

const [state, dispatch] = useReducer(reducer, { status: 'idle', items: [] });
```

What you gain: one update can change several fields atomically, so you never render a half-updated combination; the reducer is a plain function you can unit test without rendering anything; a typed action union documents every way the state can change; and `dispatch` has a stable identity, so you can pass it down (often through context) without memoisation concerns.

Rules: the reducer must be pure (no requests, timers, or mutation; Strict Mode calls it twice to check) and must return a new object for changed state. Name actions after events (`'item_added'`), not setters (`'set_items'`), or you have rebuilt `useState` with more ceremony. Like `setState`, `dispatch` schedules a render; state is unchanged in the current closure. For lazy initial state use the third argument: `useReducer(reducer, arg, init)`.

`useState` is fine for independent values. Reach for a reducer when the next state depends on the previous one in non-trivial ways, when you see the same three setters called together repeatedly, or when you want to forbid certain transitions, which is the first step towards a state machine.

**Try it:** Convert a to-do component that has `useState` for the list, the filter, and the item being edited into a single reducer with typed actions. Write three unit tests for the reducer that render nothing.

**Resources**
- [react.dev: Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- [react.dev: useReducer](https://react.dev/reference/react/useReducer)

### `useContext`

Context lets a component provide a value to its entire subtree without passing it through every level. You create a context with a default, provide a value, and read it anywhere below.

```jsx
const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext value={theme}>
      <Page />
    </ThemeContext>
  );
}

function Button() {
  const theme = useContext(ThemeContext); // or use(ThemeContext)
  return <button className={`btn-${theme}`}>OK</button>;
}
```

React 19 lets you render the context object itself as the provider; `<ThemeContext.Provider>` is the older spelling. A component reads from the nearest provider *above* it, and gets the default only when there is none. `use(Context)` does the same job and may be called conditionally.

The cost you need to understand: when the provider's `value` changes (by `Object.is`), **every** component that reads that context re-renders, and `memo` on those components or on anything between does not stop it. There is no selector; a component that reads `user.name` re-renders when `user.settings` changes. Consequences:

- An inline `value={{ user, setUser }}` is a new object every time the provider's parent renders, so all consumers re-render every time. Memoise it (or let the compiler).
- Split by rate of change and by concern: state in one context and `dispatch` in another, so components that only dispatch never re-render.
- Keep fast-changing values (mouse position, input text, scroll offset) out of context; use an external store with selectors.

Good uses are low-frequency, widely needed values: theme, locale, current user, a router, and the implicit link between compound component parts. Context is a transport mechanism (dependency injection), not a state manager; the state still lives in a `useState` or `useReducer` somewhere. Wrap access in a custom hook (`useTheme()`) that throws when the provider is missing; it gives better errors and hides the context object.

**Try it:** Put `{ count, setCount, theme }` in one context with two consumers, one reading only `theme`. Use the Profiler's "why did this render" to see the `theme` consumer re-render on each count change. Split into two contexts and compare.

**Resources**
- [react.dev: Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [react.dev: useContext](https://react.dev/reference/react/useContext)
- [react.dev: Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)

### `useMemo` and `useCallback`

`useMemo(fn, deps)` caches the result of a calculation between renders until a dependency changes. `useCallback(fn, deps)` caches a function itself; it is `useMemo(() => fn, deps)`. Neither makes the first render faster, and both cost a comparison and memory on every render.

There are exactly three reasons to use them by hand:

1. The calculation is measurably slow (think a millisecond or more: filtering thousands of items, heavy parsing) and its inputs change rarely.
2. You pass the value to a component wrapped in `memo`, and a fresh reference each render would defeat it.
3. The value is a dependency of an effect or another memoised value, and a fresh reference would re-run it every render.

```jsx
const visible = useMemo(() => filterTodos(todos, tab), [todos, tab]);
const handleSave = useCallback(item => onSave(listId, item), [onSave, listId]);
return <TodoList items={visible} onSave={handleSave} />; // TodoList is memo()
```

Where they are noise: wrapping cheap expressions, memoising a handler passed to a plain `<button>`, or memoising props for a child that is not memoised (it re-renders anyway). `useCallback` alone prevents nothing. Memoisation is also fragile: a single non-memoised prop anywhere in the chain breaks it silently. And it is a performance hint only; React may discard the cache, so code must still be correct without it.

The **React Compiler** changes the default. It is a build-time plugin, stable since version 1.0, that analyses each component and hook and inserts fine-grained memoisation automatically, including for values after conditionals where you could not write a hook. With it enabled you write plain code and keep manual `useMemo`/`useCallback` only as an escape hatch, for example to pin an effect dependency. It requires your code to follow the Rules of React and skips components that break them (the lint rules tell you which). It does not memoise across components or fix an inherently slow render. Existing memoisation can stay; remove it only with testing.

**Try it:** Build a list of 5,000 items with a filter and an unrelated counter. Measure the filter with `console.time`, add `useMemo`, and confirm the counter click no longer pays for it. Then paste the unmemoised component into the [React Compiler Playground](https://playground.react.dev/) and read what it generates.

**Resources**
- [react.dev: useMemo](https://react.dev/reference/react/useMemo)
- [react.dev: useCallback](https://react.dev/reference/react/useCallback)
- [react.dev: React Compiler introduction](https://react.dev/learn/react-compiler/introduction)

### Custom hooks

A custom hook is a function whose name starts with `use` and that calls other hooks. It lets you extract stateful logic (state plus the effects and handlers that go with it) out of a component so it can be named, reused, and tested.

```jsx
function useOnlineStatus() {
  return useSyncExternalStore(
    callback => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,
    () => true, // server snapshot
  );
}

function SaveButton() {
  const online = useOnlineStatus();
  return <button disabled={!online}>{online ? 'Save' : 'Reconnecting…'}</button>;
}
```

Custom hooks share *logic*, not *state*. Two components that call `useOnlineStatus()` each get their own state and subscription; if they must share one value, lift the state up or put it in a store. Because a hook re-runs on every render of its host component, it always receives the latest props and state, and passing a value from one hook into another keeps them in sync.

Design guidance. Name the hook after what it does for the caller (`useChatRoom`, `useDebouncedValue`, `useMediaQuery`), not after a lifecycle (`useMount`, `useEffectOnce`); lifecycle wrappers hide dependencies from the linter and fight React's model. Only use the `use` prefix if the function calls hooks; a plain helper should be a plain function so it can be called anywhere. Return whatever is most ergonomic: a single value, a tuple for a state-like pair, or an object for several named values. If the hook accepts a callback that an effect calls, wrap it in `useEffectEvent` inside the hook so callers do not have to memoise it.

A custom hook is also the best place to hide an effect. Components that call `useEffect` directly are harder to read than ones that call `useWindowListener('pointermove', handler)`, and when a better primitive arrives you change one file.

**Try it:** Extract a `useLocalStorage(key, initial)` hook that returns `[value, setValue]`, handles JSON parse errors, and (stretch) uses `useSyncExternalStore` with the `storage` event so two tabs stay in sync. Test it with `renderHook` from React Testing Library.

**Resources**
- [react.dev: Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [react.dev: useEffectEvent](https://react.dev/reference/react/useEffectEvent)

### `useId`, `useSyncExternalStore`, `useLayoutEffect`

Three specialised hooks; know the problem each solves.

**`useId()`** returns a unique string that is stable for the component instance and identical on the server and the client, so hydration does not mismatch. Use it to connect elements for accessibility: `htmlFor`/`id`, `aria-describedby`, `aria-labelledby`. Call it once and add suffixes for several IDs (`${id}-hint`). Do not use it for list keys (those come from your data) and do not depend on the exact format of the string, which has changed between React versions.

```jsx
const id = useId();
<label htmlFor={id}>Email</label>
<input id={id} aria-describedby={`${id}-hint`} />
<p id={`${id}-hint`}>We never share it.</p>
```

**`useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)`** reads a value from a source outside React (a state library's store, `navigator.onLine`, `matchMedia`, the URL) safely under concurrent rendering. `subscribe` registers a callback and returns an unsubscribe function; `getSnapshot` returns the current value. Two requirements: `getSnapshot` must return the same reference when nothing has changed (returning a fresh object each call causes an infinite loop), and `subscribe` should be defined outside the component or memoised or React resubscribes every render. Updates from it are always synchronous, so they cannot be deferred by a transition. Zustand, Redux, and most stores are built on it.

**`useLayoutEffect`** has the same signature as `useEffect` but runs synchronously after React updates the DOM and *before* the browser paints. Use it when you must measure layout and then render again without the user seeing the intermediate frame: positioning a tooltip from `getBoundingClientRect()`, or restoring scroll position. It blocks painting, so keep it rare and fast. It does not run on the server; anything depending on it should render only on the client.

**Try it:** Build a tooltip that measures its own height and flips below the target when there is no room above. Implement it with `useEffect`, throttle the CPU 6x in DevTools, and watch for the flicker; switch to `useLayoutEffect` and compare.

**Resources**
- [react.dev: useId](https://react.dev/reference/react/useId)
- [react.dev: useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [react.dev: useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)

### `useEffectEvent`

Everything an effect reads from props or state is a dependency, and a changed dependency re-runs the effect. Usually that is right. Sometimes an effect needs to *read* a value without *reacting* to it: a chat connection should reconnect when `roomId` changes, but not because the user switched `theme`, even though the "connected" notification uses the theme.

```jsx
function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme); // always the latest theme
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', () => onConnected());
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // theme is not a dependency, and neither is onConnected
}
```

`useEffectEvent(callback)` returns a function, an *Effect Event*, that sees the latest props and state whenever it is called and is not reactive. It splits an effect into the part that should synchronise (the connection, keyed on `roomId`) and the part that is really an event that happens to fire from inside the effect. It has been stable since React 19.2. Before it existed, people suppressed the dependency lint rule, which freezes stale values, or hand-rolled a "latest ref" (`ref.current = callback` in an effect); this replaces both.

The restrictions are strict and the linter enforces them. Call an Effect Event only from inside effects (`useEffect`, `useLayoutEffect`, `useInsertionEffect`) or from another Effect Event in the same component; never during render and not from ordinary event handlers. Do not pass it to other components or hooks. Do not put it in a dependency array: its identity deliberately changes every render, so listing it would re-run the effect each time and expose the mistake. Declare it right next to the effect that uses it.

Do not use it to silence dependencies you find inconvenient. If the effect *should* re-run when a value changes (a different `roomId`, a different URL to fetch), that value is a real dependency. Pass such values as arguments to the Effect Event when you want the value from the moment the effect ran: `onVisit(url)` logs the URL that triggered the effect, while reading `cartCount` inside the event gets the latest count without re-logging on every cart change.

The typical uses: callbacks from props that a custom hook's effect calls (so callers need not memoise them), analytics that include incidental state, and timers or subscriptions whose handlers need current values.

**Try it:** Write `useInterval(callback, delay)`. First put `callback` in the effect's dependencies and pass an inline arrow function; log how often the interval is torn down and recreated. Then wrap the callback with `useEffectEvent` so the interval restarts only when `delay` changes, and confirm the callback still sees fresh state.

**Resources**
- [react.dev: useEffectEvent](https://react.dev/reference/react/useEffectEvent)
- [react.dev: Separating Events from Effects](https://react.dev/learn/separating-events-from-effects)

### Rules of hooks

Two rules. Call hooks only at the top level of a component or custom hook: not inside conditions, loops, nested functions, `try`/`catch`, or after an early `return`. And call hooks only from React function components or custom hooks, not from ordinary functions, class components, or event handlers.

The reason is the implementation. React does not know your variable names. For each component instance it keeps a list of hook slots, and on every render it walks that list in order: the first `useState` call gets slot 0, the next hook gets slot 1, and so on. If a hook is skipped on some renders, every later hook reads the wrong slot.

```jsx
function Form({ showName }) {
  if (showName) {
    const [name, setName] = useState(''); // slot 0, but only sometimes
  }
  const [email, setEmail] = useState(''); // slot 0 or slot 1?
}
```

When `showName` flips, `email` receives what used to be `name`'s state. React detects a change in the number of hooks and throws "Rendered more hooks than during the previous render", but a swap of two hooks of the same kind would be silent corruption. Fixed order is the price of an API with no names or keys.

The fix is always to call the hook unconditionally and put the condition inside it or after it: `useEffect(() => { if (!enabled) return; … })`, or move the conditional part into a child component that is itself conditionally rendered.

The exception is `use`, which is not a hook in this sense: it may be called in conditions and loops (though not in `try`/`catch`), because it does not occupy a slot.

`eslint-plugin-react-hooks` enforces both rules through naming: anything called `useSomething` is treated as a hook, anything capitalised as a component. That is why the naming conventions are mandatory rather than stylistic. The broader "Rules of React" (purity, immutable props and state, never calling components directly) are what the compiler relies on.

**Try it:** Write the conditional-hook component above, toggle the prop, and read the error. Then implement a 20-line toy `useState` backed by a module-level array and an index reset before each "render"; call it conditionally and watch the values shift.

**Resources**
- [react.dev: Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [react.dev: Rules of React](https://react.dev/reference/rules)

### Render and commit

Every update to the screen goes through three steps. A **trigger**: the initial `root.render()`, or a state update (a setter, `dispatch`, a context value change, or an external store notification). The **render phase**: React calls your component functions, starting from the component whose state changed and continuing down through its children, and compares the returned elements with the previous ones to work out what must change. The **commit phase**: React applies the minimal set of DOM mutations, attaches refs, runs layout effects, lets the browser paint, and then runs passive effects.

"Rendering" therefore means *calling your function*, not touching the DOM. A component can render a thousand times and cause zero DOM writes if its output is the same. The render phase must be pure because React may run it more than once, pause it, or discard it; the commit phase is synchronous and happens once.

What causes a component to re-render:

1. Its own state changed.
2. Its parent re-rendered. This is the one people miss: by default React re-renders *all* descendants of the component that updated, whether or not their props changed.
3. A context it reads changed.

"Props changed" is not on the list. Props are only compared if the component is wrapped in `memo` (or the React Compiler has memoised the element); then React skips it when every prop is `Object.is`-equal to last time. React also bails out when a setter is called with a value identical to the current state.

Re-rendering is usually cheap, and avoiding it is not a goal in itself. It becomes a problem when a render is slow or a very large subtree re-renders on a high-frequency event such as typing or dragging. The structural fixes come first: keep state close to where it is used, and pass expensive subtrees as `children` so their elements are created by a component that did not re-render.

**Try it:** Add `console.log('render', name)` to a parent, a child, and a grandchild. Update the parent's state and note that all three log. Wrap the child in `memo` and observe; then pass it an inline object prop and watch memo fail. Finally, restructure so the stateful part takes the child as `children` with no `memo` at all.

**Resources**
- [react.dev: Render and Commit](https://react.dev/learn/render-and-commit)
- [react.dev: memo](https://react.dev/reference/react/memo)

### Reconciliation

After a render, React has a new tree of elements and must decide, for each one, whether it is "the same component as before" (update it, keep its state and DOM) or a different one (destroy the old, mount the new). The rule is positional: an element at the same position in the tree, with the same type and the same key as last time, is the same instance. React does not attempt a general tree diff; it compares level by level, which is what makes it linear in the size of the tree.

Consequences you can predict from that rule:

- Same type, same position: state is preserved even if the JSX expressions differ. `isA ? <Counter name="a" /> : <Counter name="b" />` is one counter whose prop changes.
- Different type at the same position: the old subtree is unmounted, including all descendants and their state. Changing a wrapper from `<div>` to `<section>` resets everything inside it.
- A different `key` at the same position means a different instance, so changing a key resets state deliberately: `<Chat key={contactId} />`.
- Among siblings, keys identify children regardless of order; without keys, the index is used.

Position is in the tree React sees, not in your source. `{show && <A />}<B />` gives `B` the same position either way, because `false` still occupies a slot.

This explains why components must not be defined inside other components:

```jsx
function Page() {
  function Field() { return <input />; } // new function identity every render
  return <Field />;
}
```

Each render of `Page` creates a new `Field` type, React sees a different type at that position, and it remounts the input, so focus and typed text vanish on every parent update. Define components at module scope.

Historically the internal structure was explained as a "virtual DOM"; the current implementation is the Fiber tree, where each fiber holds an instance's state, hooks, and links to its parent, child, and sibling.

**Try it:** Render `{isFancy ? <Counter isFancy /> : <Counter />}` with a checkbox and confirm the count survives toggling. Wrap one branch in a `<div>` and see the state reset. Then add different keys to both and observe again.

**Resources**
- [react.dev: Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [React legacy docs: Reconciliation](https://legacy.reactjs.org/docs/reconciliation.html)

### Batching

React does not re-render at each `setState` call. It queues the updates made during the current task and processes them together in one render and one commit. A handler that calls three setters produces one render, and you never see a state where only the first has applied.

```jsx
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  setItems([]);
  // one render after the handler returns
}
```

Since React 18 (with `createRoot`) batching is automatic everywhere: in event handlers, promise callbacks, `setTimeout`, and native event listeners. Before 18 only updates inside React event handlers were batched, which is why older articles recommend `unstable_batchedUpdates`.

Within a batch React processes the queue in order for each state variable: a plain value replaces the pending value, an updater function receives the pending value. So `setN(n + 5); setN(n => n + 1);` from `n = 0` yields 6, and `setN(n => n + 1); setN(42);` yields 42.

An `await` ends the batch: updates before it and after it are in different tasks, so they produce separate renders. That is usually what you want (show a spinner, then show the result).

If you need the DOM updated synchronously, for example to scroll to a newly added list item, wrap the update in `flushSync` from `react-dom`:

```jsx
flushSync(() => setTodos([...todos, todo]));
listRef.current.lastChild.scrollIntoView();
```

It forces a synchronous render and commit, defeats batching, and can hurt performance, so use it sparingly and never inside an effect or during render.

Batching is distinct from *prioritisation*. Updates in a transition are batched too, but they render at a lower priority and can be interrupted by urgent ones. Since React 19.3, separate transitions also render independently rather than being entangled into one.

**Try it:** Log from a component body, then call three setters in a click handler, in a `setTimeout`, and around an `await`, and count renders in each case. Add `flushSync` around one of them and count again.

**Resources**
- [react.dev: Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- [react.dev: flushSync](https://react.dev/reference/react-dom/flushSync)
- [react.dev blog: React v18.0 (automatic batching)](https://react.dev/blog/2022/03/29/react-v18)

### Concurrent features

By default a render is urgent and, once started, runs to completion. If it takes 300 ms, input is blocked for 300 ms. Concurrent rendering lets you mark some updates as non-urgent *transitions*. React renders them in the background in small slices, yields to the browser between slices, and abandons the work if something newer arrives. Nothing is committed until the whole transition render is ready, so the user keeps seeing and interacting with the current screen.

`useTransition` marks state updates:

```jsx
const [isPending, startTransition] = useTransition();

function selectTab(next) {
  startTransition(() => setTab(next)); // rendering the new tab can be interrupted
}
```

`isPending` lets you show feedback (dim the old content) while it works. In React 19 the function passed to `startTransition` may be async, which makes it an *Action*; `isPending` stays true until it settles. One limitation to remember: state updates after an `await` inside it must be wrapped in another `startTransition` to be treated as part of the transition.

`useDeferredValue` is for when you do not control the update, such as a prop or input value:

```jsx
const deferredQuery = useDeferredValue(query);
// <input value={query} /> updates immediately
// <Results query={deferredQuery} /> re-renders in the background
```

React first re-renders with the old deferred value (fast, if `Results` is memoised or compiled), then attempts the new one in the background. Unlike debouncing there is no fixed delay: a fast device shows results immediately, a slow one skips intermediate values.

What these do not do: they do not make the render itself faster and they do not move work off the main thread. They only work if the slow part is in *rendering* many components (which can yield between components), not a single long function. You cannot use a transition for a controlled input's own value; that must update synchronously. Transitions also change Suspense behaviour: already-visible content stays on screen instead of being replaced by a fallback. Transitions are also what trigger `<ViewTransition>` animations, covered in their own entry.

**Try it:** Render a list of 10,000 rows filtered by a text input, with an artificial 0.1 ms loop in each row. Type quickly and feel the lag. Add `useDeferredValue` plus `memo` on the list and compare. Record both in the Performance panel and look at the React Scheduler track.

**Resources**
- [react.dev: useTransition](https://react.dev/reference/react/useTransition)
- [react.dev: useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [react.dev blog: React 19.3](https://react.dev/blog/2026/09/09/react-19-3)

### Suspense

`<Suspense fallback={…}>` lets a part of the tree declare "I am not ready yet". When a component inside the boundary *suspends*, React shows the nearest boundary's fallback and swaps the real content in when it is ready. The loading state is declared by where you place boundaries rather than by `isLoading` checks in every component.

What can suspend: a component loaded with `lazy`, a call to `use(promise)`, and data libraries that integrate with Suspense (framework loaders, TanStack Query's `useSuspenseQuery`, Relay). A plain `fetch` inside `useEffect` does not.

```jsx
function Albums({ albumsPromise }) {
  const albums = use(albumsPromise); // suspends until resolved
  return <ul>{albums.map(a => <li key={a.id}>{a.title}</li>)}</ul>;
}

<ErrorBoundary fallback={<p>Could not load albums.</p>}>
  <Suspense fallback={<AlbumsSkeleton />}>
    <Albums albumsPromise={albumsPromise} />
  </Suspense>
</ErrorBoundary>
```

`use` reads a promise (or a context). If the promise is pending the component suspends; if it rejected, the error goes to the nearest error boundary; otherwise `use` returns the value. The critical rule is that the promise must be *stable across renders*. A promise created during render (`use(fetch(url))`) is a new one each time, so the component suspends forever. Create promises outside rendering (a route loader, an event handler, a Server Component passing it as a prop) or get them from a cache. `use` can be called conditionally but not inside `try`/`catch`.

Behaviour worth knowing. React does not preserve state for a tree that suspended before its first mount; it retries from scratch. If already-visible content suspends again, React hides it and shows the fallback, which is jarring, unless the update was a transition, in which case React keeps the old content until the new is ready. Boundaries nest, so you choose what reveals together: one boundary for a whole page gives a single spinner, several give progressive reveal. Too many produce "popcorn" loading. On the server, Suspense boundaries are the units of streaming HTML and selective hydration.

**Try it:** Write a module-level `Map` cache that stores promises by URL, read it with `use` in a component wrapped in Suspense and an error boundary, and add a button that changes the URL. See the fallback flash, then wrap the state update in `startTransition` and see the old content stay.

**Resources**
- [react.dev: Suspense](https://react.dev/reference/react/Suspense)
- [react.dev: use](https://react.dev/reference/react/use)

### Error boundaries

If a component throws while rendering and nothing catches it, React unmounts the entire root and the user gets a blank page. An error boundary is a component that catches errors thrown by its descendants during rendering and shows a fallback instead, so one broken widget does not take down the application.

Boundaries must still be class components; there is no hook equivalent. `static getDerivedStateFromError(error)` returns state that switches to the fallback, and `componentDidCatch(error, info)` is for logging (`info.componentStack` tells you where). In practice use the `react-error-boundary` package, which wraps this:

```jsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  fallbackRender={({ error, resetErrorBoundary }) => (
    <div role="alert">
      <p>Something went wrong.</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )}
  onError={(error, info) => report(error, info.componentStack)}
  resetKeys={[userId]}
>
  <Profile userId={userId} />
</ErrorBoundary>
```

What boundaries catch: errors in render, in effects and lifecycle methods, in a rejected promise read with `use`, and errors thrown inside the function passed to `startTransition`. What they do not catch: event handlers, asynchronous callbacks (`setTimeout`, promise chains you started yourself), server rendering, and errors in the boundary itself. For handlers use `try`/`catch` and set error state; `react-error-boundary`'s `useErrorBoundary().showBoundary(error)` lets you forward such errors to the boundary.

Placement is a design decision, like Suspense. One boundary at the root is the last resort ("something went wrong, reload"). Add boundaries around independently useful regions: each route, each dashboard widget, a comments section. Always give a way to recover: a retry that resets the boundary, and reset automatically when the input that caused the failure changes (`resetKeys`).

For reporting, React 19's `createRoot` accepts `onCaughtError`, `onUncaughtError`, and `onRecoverableError` options, which give you one place to send every error to your monitoring service. In development React shows its own error overlay over the boundary; dismiss it to see your fallback.

**Try it:** Create a component that throws when a prop is `true`. Without a boundary, observe the whole app unmount. Add a boundary with a retry button. Then throw inside an `onClick` and confirm the boundary does not catch it; fix that with `showBoundary`.

**Resources**
- [react.dev: Component: Catching rendering errors with an Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [GitHub: react-error-boundary](https://github.com/bvaughn/react-error-boundary)
- [react.dev: createRoot (error handling options)](https://react.dev/reference/react-dom/client/createRoot)

### Portals

`createPortal(children, domNode)` renders children into a different DOM node from the one their parent renders into, while keeping them in the same place in the *React* tree.

```jsx
import { createPortal } from 'react-dom';

function Modal({ children }) {
  return createPortal(
    <div className="modal-backdrop">{children}</div>,
    document.body,
  );
}
```

The reason to use one is CSS, not React. A tooltip, dropdown, or modal rendered inside a container with `overflow: hidden`, a `transform`, or its own stacking context gets clipped or trapped beneath other content regardless of `z-index`. Moving its DOM to `document.body` escapes that.

Because only the DOM location changes, everything about React still follows the component tree: the portal content reads context from its React ancestors, re-renders with them, and is unmounted with them. Events also propagate through the React tree. A click inside a portalled modal bubbles to the `onClick` of the component that rendered the modal, even though in the DOM the modal is not inside it. That is convenient for things like closing a menu, and surprising when a click in a dialog triggers a handler on the table row that opened it. Stop propagation at the portal root if you do not want this.

A portal only moves DOM. It does not give you a dialog's behaviour, and you remain responsible for accessibility: moving focus in, trapping it, restoring it on close, `Escape` to dismiss, making the rest of the page inert, and `aria-modal` and labelling.

The platform now does much of this for you. A `<dialog>` opened with `showModal()` and elements with the `popover` attribute render in the browser's *top layer*, above everything regardless of stacking contexts, with focus handling and `Escape` built in. For modals and popovers, prefer those (or a headless library that uses them) and keep portals for cases they do not cover. During server rendering `document` does not exist, so render portals only on the client.

**Try it:** Put a modal inside a card with `overflow: hidden` and `transform: translateZ(0)` and see it clipped. Fix it with a portal. Add an `onClick` logger on the card and click inside the modal to see React bubbling; then rebuild the modal with `<dialog>` and `showModal()` and compare how much code you need.

**Resources**
- [react.dev: createPortal](https://react.dev/reference/react-dom/createPortal)
- [MDN: The dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
- [MDN: Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)

### `<Activity>` and `<ViewTransition>`

Two built-in components that change what happens when UI appears and disappears.

**`<Activity>`** (stable since React 19.2) hides a subtree without throwing it away. With conditional rendering, `{show && <Panel />}` unmounts the panel: its state, its DOM, and anything typed into it are gone. With Activity:

```jsx
<Activity mode={tab === 'drafts' ? 'visible' : 'hidden'}>
  <Drafts />
</Activity>
```

When `mode` is `'hidden'`, React hides the children with `display: none`, keeps their state and DOM, **cleans up their effects** (subscriptions stop, as if unmounted), and still re-renders them for new props, but at a lower priority than visible content. When it becomes visible again, effects are set up again and the user finds everything as they left it: form drafts, scroll position, expanded rows. It is the right tool for tabs, back-navigation, and sidebars. You can also render something hidden *before* it is needed, so its code and Suspense-enabled data are ready when the user gets there, and hidden boundaries hydrate later, which speeds up page load.

Consequences to plan for. Because effects are destroyed and recreated, components must tolerate that, which is exactly what Strict Mode checks. Because the DOM stays alive, DOM-level activity continues: a `<video>` keeps playing while hidden unless you pause it in a layout effect cleanup. And hidden trees still cost memory and background rendering, so do not keep hundreds alive.

**`<ViewTransition>`** (stable in React 19.3) animates changes using the browser's View Transition API. Wrap an element and React animates it when it enters, exits, updates, or, for two boundaries with the same `name`, morphs from one to the other as a shared element.

```jsx
function setTabWithAnimation(next) {
  startTransition(() => setTab(next));
}

<ViewTransition key={tab} enter="slide-in" exit="slide-out">
  <TabPanel tab={tab} />
</ViewTransition>
```

Animations run only for updates that are Transitions: inside `startTransition`, a `useDeferredValue` update, or a Suspense boundary revealing. A plain `setState` does not animate. The default is a cross-fade; customise with class names you style through `::view-transition-old(.slide-out)` and `::view-transition-new(.slide-in)`, and vary the animation by cause with `addTransitionType`. Put the `<ViewTransition>` above any DOM element in the component for enter and exit to trigger, keep `name`s unique among mounted boundaries, and note that `flushSync` skips the animation. React does not disable animations for `prefers-reduced-motion`; you must do so in CSS. In browsers without the View Transition API the update simply applies without animating. The two components work together: an Activity becoming visible or hidden inside a ViewTransition triggers enter and exit.

**Try it:** Build two tabs, each with a text input and a component that logs from an effect's setup and cleanup. Compare `&&` with `<Activity>`: which keeps the typed text, and what do the effect logs show on each switch? Then wrap the panels in `<ViewTransition>`, switch tabs inside `startTransition`, and add a reduced-motion override.

**Resources**
- [react.dev: Activity](https://react.dev/reference/react/Activity)
- [react.dev: ViewTransition](https://react.dev/reference/react/ViewTransition)
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)

### Composition patterns

Composition is how you make components flexible without piling up props. The patterns, from simplest to most involved:

**Slots via `children` and element props.** Accept JSX rather than configuration. `<Card header={<Title />} footer={<Actions />}>…</Card>` lets the caller put anything in each slot, and the card needs no knowledge of it. This also helps performance: elements created by the caller do not re-render when the card's own state changes.

**Compound components.** A set of components designed to be used together, sharing implicit state through context, like `<select>` and `<option>`.

```jsx
<Tabs defaultValue="account">
  <Tabs.List>
    <Tabs.Trigger value="account">Account</Tabs.Trigger>
    <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="account">…</Tabs.Panel>
  <Tabs.Panel value="billing">…</Tabs.Panel>
</Tabs>
```

`Tabs` owns the active value and provides it through context; `Trigger` and `Panel` read it. The caller controls markup, order, and styling of each part, and you avoid a `tabs={[{ label, content, icon, disabled }]}` prop that grows forever. Have the parts throw a clear error when used outside the root. Avoid the older `Children.map` plus `cloneElement` approach; it breaks as soon as someone wraps a child in another element.

**Render props.** A prop (often `children`) that is a function receiving internal state and returning JSX: `<Listbox>{({ open }) => <Chevron flipped={open} />}</Listbox>`. Custom hooks replaced most uses, but render props remain right when the component must control *where* or *how many times* the caller's JSX renders, such as a virtualised list's `renderRow`.

**Polymorphism.** Letting the caller change the rendered element, through an `as` prop or Radix's `asChild`, which merges the component's props and ref onto the child you supply so a `Button` can render as a router `Link`.

Higher-order components (`withRouter(Component)`) are the legacy version of all this; recognise them, do not write new ones.

**Try it:** Build an `Accordion` with `Accordion.Item`, `Accordion.Trigger`, and `Accordion.Content` using context, supporting both single and multiple open items. Then try to express the same flexibility with a single `items` array prop and note what you cannot do.

**Resources**
- [react.dev: Passing Props to a Component: Passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)
- [Radix Primitives: Composition](https://www.radix-ui.com/primitives/docs/guides/composition)
- [react.dev: cloneElement (alternatives)](https://react.dev/reference/react/cloneElement#alternatives)

### Forms

React 19 gave forms a built-in data flow. Pass a function to `<form action>` and React calls it with the form's `FormData` on submit, inside a transition, and resets uncontrolled fields when it succeeds. Three hooks build on that:

- `useActionState(fn, initialState)` wraps an action whose return value becomes state. It returns `[state, formAction, isPending]`; `fn` receives `(previousState, formData)`. Use the returned state for validation errors and results.
- `useFormStatus()` (from `react-dom`) reads the pending status of the *parent* `<form>` from a child component, so a reusable submit button needs no props. It does not work in the component that renders the form itself.
- `useOptimistic(state, updateFn)` shows a temporary value while an action is in flight, and reverts to the real state automatically when the action finishes or fails.

```jsx
async function updateName(prevState, formData) {
  const name = formData.get('name');
  if (!name) return { error: 'Name is required', name };
  try {
    await api.saveName(name);
    return { error: null, name };
  } catch {
    return { error: 'Could not save. Try again.', name };
  }
}

function NameForm({ current }) {
  const [state, formAction, isPending] = useActionState(updateName, { error: null, name: current });
  return (
    <form action={formAction}>
      <label>Name <input name="name" defaultValue={state.name} aria-invalid={!!state.error} /></label>
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={isPending}>{isPending ? 'Saving…' : 'Save'}</button>
    </form>
  );
}
```

Return the submitted values on error so the fields are not wiped by the automatic reset. In a framework with Server Functions the same form works before JavaScript loads.

Actions cover submit-time flows well. For large client-side forms (per-field validation as you type, touched/dirty tracking, field arrays, dependent fields) use a library. **React Hook Form** keeps inputs uncontrolled and subscribes components only to the form state they read, so typing does not re-render the form; pair it with a schema (Zod, Valibot) through a resolver and reuse the schema on the server. TanStack Form is a typed alternative.

Whatever you use: every input needs a label, errors are linked with `aria-describedby` and announced, focus moves to the first invalid field on a failed submit, and the server validates again because client validation is only a convenience.

**Try it:** Build the form above with a fake API that fails randomly. Add a `SubmitButton` using `useFormStatus`, and an optimistic "saved name" display with `useOptimistic`. Then rebuild it with React Hook Form and a Zod schema and compare render counts while typing.

**Resources**
- [react.dev: form](https://react.dev/reference/react-dom/components/form)
- [react.dev: useActionState](https://react.dev/reference/react/useActionState)
- [React Hook Form: Get Started](https://react-hook-form.com/get-started)

### Headless components

A headless component library gives you behaviour, state, keyboard interaction, focus management, and ARIA wiring, and no styles. You bring the markup and CSS. This matters because the hard part of a combobox, menu, dialog, or date picker is not how it looks: it is roving focus, typeahead, `Escape` and outside-click dismissal, focus trapping and restoration, screen reader announcements, collision-aware positioning, touch behaviour, and right-to-left support. Styled component kits bundle a look you then fight; hand-rolled widgets usually fail accessibility audits.

The main options for React. **Radix Primitives** (`npm install radix-ui`) exposes compound components with unstyled parts and `data-state` attributes to style against:

```jsx
import { Dialog } from 'radix-ui';

<Dialog.Root>
  <Dialog.Trigger className="btn">Edit profile</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="overlay" />
    <Dialog.Content className="dialog">
      <Dialog.Title>Edit profile</Dialog.Title>
      <Dialog.Close className="btn">Done</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**React Aria** (Adobe) offers both components and lower-level hooks (`useButton`, `useComboBox`), with the most thorough accessibility, internationalisation, and mobile testing of the group. **Base UI** (from members of the Radix, MUI, and Floating UI teams) and **Ark UI** are similar in spirit; **Headless UI** is a smaller set from the Tailwind team. shadcn/ui is not a library but copy-in styled code built on these primitives.

How to work with them: learn the anatomy (which parts are required, such as a dialog needing a title), style states through the data attributes or render-prop state they expose instead of tracking your own, and use controlled props (`open`, `onOpenChange`) only when you need to drive state from outside. Always check the result against the matching WAI-ARIA Authoring Practices pattern with a keyboard and a screen reader; headless does not mean you cannot break it.

Building one widget yourself against the APG is still valuable, because it teaches you what the library is doing.

**Try it:** Implement a dropdown menu from scratch: arrow keys, Home/End, typeahead, `Escape`, focus return, outside click. Time-box it to 20 minutes, list what is still missing against the APG Menu Button pattern, then build the same menu with Radix or React Aria and style it.

**Resources**
- [Radix Primitives: Introduction](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [React Aria: Getting started](https://react-spectrum.adobe.com/react-aria/getting-started.html)
- [WAI-ARIA APG: Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)

### Refs and imperative handles

Most parent-to-child communication is props. Occasionally a parent needs to *command* a child: focus this input, scroll to this row, play this video, open this dialog. These are actions, not state, and expressing them as props (`shouldFocus={true}`, then resetting it) is awkward. Refs are the escape hatch.

In React 19 a function component receives `ref` as a normal prop and can forward it to a DOM node:

```tsx
function TextField({ label, ref, ...props }: Props & { ref?: React.Ref<HTMLInputElement> }) {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} ref={ref} {...props} />
    </>
  );
}
```

In React 18 and earlier you must wrap the component in `forwardRef((props, ref) => …)`; you will see that throughout existing code and libraries.

Exposing the raw DOM node hands the parent everything, including the ability to change styles or remove children behind React's back. `useImperativeHandle` lets you expose a small, intentional API instead:

```jsx
function VideoPlayer({ src, ref }) {
  const videoRef = useRef(null);
  useImperativeHandle(ref, () => ({
    play: () => videoRef.current.play(),
    pause: () => videoRef.current.pause(),
  }), []);
  return <video ref={videoRef} src={src} />;
}
```

Use this sparingly. Every imperative method is behaviour the parent can trigger at any time, in any order, which is harder to reason about than props. If something can be a prop, make it a prop: a dialog's visibility is `open`, not `ref.current.open()`. Legitimate imperative APIs are the ones the DOM itself models as methods: focus, scroll, selection, media playback, animation triggers, and form `reset`.

Design-system components should nearly always forward `ref` to their root or primary element so that consumers can measure them, focus them, and compose them with tooltips, popovers, and `asChild`-style slots. When a component needs the ref itself *and* must forward it, merge them with a small callback ref that assigns to both.

**Try it:** Build a `CodeInput` of six single-character inputs. Expose `focus()` and `clear()` through `useImperativeHandle`, call them from a parent's "Resend code" button, and confirm in the Components panel that the parent's ref holds only those two methods.

**Resources**
- [react.dev: useImperativeHandle](https://react.dev/reference/react/useImperativeHandle)
- [react.dev: Manipulating the DOM with Refs: Accessing another component's DOM nodes](https://react.dev/learn/manipulating-the-dom-with-refs#accessing-another-components-dom-nodes)
- [react.dev: forwardRef](https://react.dev/reference/react/forwardRef)

### Code splitting

A single bundle makes every user download the code for every screen before seeing the first. Code splitting breaks the application into chunks loaded on demand. The primitive is the dynamic `import()`, which bundlers turn into a separate file; `lazy` adapts it to a component, and Suspense shows a fallback while the chunk downloads.

```jsx
import { lazy, Suspense } from 'react';

const Settings = lazy(() => import('./routes/Settings.jsx')); // module scope

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {route === 'settings' ? <Settings /> : <Home />}
    </Suspense>
  );
}
```

Rules: declare `lazy` components at the top level of a module, never inside a component (a new lazy component per render resets state every time). The imported module must have the component as its `default` export; for a named export use `import('./x').then(m => ({ default: m.Named }))`. A failed chunk load (offline, or a stale tab after a deploy has removed old hashed files) rejects and goes to the nearest error boundary, so have one and offer a reload.

Where to split. Routes are the highest-value boundary, and frameworks and routers do it automatically. Beyond that, split what is heavy and not needed at first paint: a rich text editor, a charting library, a modal's contents, an admin-only area. Do not split small components; each chunk adds a request and a possible loading state, and too many produce a spinner cascade.

Make it feel instant by preloading on intent: call the same `import('./routes/Settings.jsx')` on link hover or focus, and the browser caches the module before the click. Wrap navigation in a transition so the current page stays visible instead of flashing a fallback.

Verify with tools rather than guessing: the Network panel shows which chunks load when, DevTools *Coverage* shows unused bytes on first load, and a bundle visualiser (`rollup-plugin-visualizer`, or `vite-bundle-analyzer`) shows what is in each chunk and catches a heavy library that was accidentally pulled into the entry chunk by a static import.

**Try it:** In a Vite app, lazy-load a route that imports a large dependency. Throttle the network to "Slow 4G" and watch the chunk request and the fallback. Add hover preloading and a transition, then block the chunk URL in the Network panel to check that your error boundary handles the failure.

**Resources**
- [react.dev: lazy](https://react.dev/reference/react/lazy)
- [MDN: import() dynamic import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [web.dev: Reduce JavaScript payloads with code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)

### Profiling

Do not optimise renders by intuition. Measure, find the specific slow thing, fix it, and measure again.

The workflow with React DevTools' **Profiler** tab: in its settings enable "Record why each component rendered while profiling". Press record, perform the slow interaction once, and stop. Each bar in the top-right chart is a commit; its height is how long it took. Select a commit to see the *flamegraph*: the component tree where width is render time (including children), coloured components rendered in that commit, and grey ones did not. The *ranked* view sorts components by their own render time, which is the fastest way to the culprit. Click a component for "Why did this render?": hooks changed, props changed (and which), parent rendered, or context changed.

What to look for. A commit that is long because one component is slow: fix the component (memoise the calculation, virtualise the long list). A commit that is long because hundreds of cheap components rendered when only one needed to: fix the structure (move state down, pass `children`, split a context, then `memo` or the compiler). Many commits for one interaction: often effect chains setting state, which should be derived values.

Complementary tools. "Highlight updates when components render" gives a live visual of what re-renders as you type. The Chrome **Performance** panel shows React's Scheduler and Components tracks next to main-thread tasks, layout, and paint, so you can tell whether the time is React at all; a 4x or 6x CPU throttle approximates a mid-range phone. The `<Profiler id onRender>` component reports timings programmatically for automated measurement.

Caveats: development builds are several times slower than production and Strict Mode doubles renders, so use the profiler for relative comparisons and causes, and confirm real numbers with a production build (frameworks and bundlers offer a profiling build of `react-dom`). A "wasted" render that takes 0.2 ms is not worth fixing. Field metrics, particularly Interaction to Next Paint, tell you whether users feel it.

**Try it:** Take an app with a text input above a 500-row list where the input state lives in the common parent. Profile five keystrokes, read why the rows rendered, then fix it twice: once by moving the input state into its own component, once with `memo` on the row. Compare commit durations.

**Resources**
- [react.dev: React Developer Tools](https://react.dev/learn/react-developer-tools)
- [react.dev: Profiler](https://react.dev/reference/react/Profiler)
- [react.dev: React Performance tracks](https://react.dev/reference/dev-tools/react-performance-tracks)

### Testing components

A component test should resemble how the component is used: render it, find elements the way a user would, interact, and assert on what appears. It should not know which hooks the component calls, what its state is named, or how it is split into children. That is the whole philosophy of Testing Library, and it is why such tests survive refactoring. The Testing module covers runners, mocking, and strategy in depth; this entry is the React-specific core.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('adds a todo and clears the input', async () => {
  const user = userEvent.setup();
  render(<TodoApp />);

  const input = screen.getByRole('textbox', { name: /new todo/i });
  await user.type(input, 'Buy milk{Enter}');

  expect(screen.getByRole('listitem')).toHaveTextContent('Buy milk');
  expect(input).toHaveValue('');
});
```

The habits that matter:

- **Query by role and accessible name first** (`getByRole`, `getByLabelText`), then by text. If you cannot find an element that way, a screen reader user probably cannot either. `getByTestId` is the last resort.
- **Know the three query families.** `getBy*` throws if absent, `queryBy*` returns `null` (use it to assert something is *not* there), and `findBy*` returns a promise that retries until the element appears, which is how you wait for asynchronous UI. Do not sleep, and do not wrap everything in `waitFor`.
- **Use `user-event`, not `fireEvent`.** `user.click` and `user.type` produce the full sequence of events a real interaction does, including focus and keyboard events. Always `await` them.
- **Render with real providers.** Write a small `renderWithProviders` helper that wraps the router, query client, and theme, rather than mocking hooks. Mock at the network boundary (MSW), not your own modules.
- **Do not test implementation details**: no asserting on state, no checking that a child received certain props, no shallow rendering, and no snapshot of a whole tree standing in for assertions.

"`not wrapped in act(...)`" warnings mean something updated state after your test stopped watching; the fix is almost always to await the UI change with `findBy*`, not to add `act` by hand. jsdom has no layout, so sizes, scrolling, and real focus visibility need a browser runner (Vitest browser mode or Playwright). Test custom hooks through a component unless they are a shared library, in which case use `renderHook`.

**Try it:** Take a component you wrote earlier and write three tests using only `getByRole`/`findByRole` queries and `user-event`. Then refactor the component's internals (swap `useState` for `useReducer`, or extract a child) without touching behaviour. If any test fails, work out which implementation detail it depended on.

**Resources**
- [Testing Library: React Testing Library introduction](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library: About queries](https://testing-library.com/docs/queries/about/)
- [Testing Library: user-event introduction](https://testing-library.com/docs/user-event/intro/)

### Signals and fine-grained reactivity

React's model is coarse: when state changes, the component function re-runs, produces a new element tree, and React diffs it to find the DOM changes. Signal-based frameworks track dependencies at the level of individual values instead.

A **signal** is a container for a value that records who reads it. A **computed** (derived, memo) is a cached calculation that tracks the signals it read. An **effect** re-runs when its dependencies change. Reading a signal inside a computed or effect subscribes automatically, so there are no dependency arrays. When a signal is written, only the computations and DOM bindings that actually read it update.

```js
// Solid
const [count, setCount] = createSignal(0);
const double = createMemo(() => count() * 2);
return <button onClick={() => setCount(c => c + 1)}>{double()}</button>;
```

In Solid the component function runs **once**. The JSX compiles to real DOM creation plus an effect that updates that one text node. There is no re-render, no virtual DOM diff, and no stale closure problem, but you must not destructure props or read a signal outside a tracking scope, or you lose reactivity.

The others apply the same idea differently. **Vue** uses `ref()` and `reactive()` (proxies) with `computed()`; components re-render through a virtual DOM, but only components whose dependencies changed, and the compiler marks static parts. Vue's Vapor Mode, arriving with 3.6 (release candidate at the time of writing), compiles opted-in components to direct DOM updates without a virtual DOM. **Svelte 5** uses compiler-recognised *runes*: `$state`, `$derived`, `$effect`. **Angular** has `signal()`, `computed()`, and `effect()`, and uses them to run change detection without Zone.js. **Preact** offers signals as an add-on. A TC39 proposal (Stage 1) aims to standardise the core so libraries can interoperate.

Trade-offs: fine-grained updates are efficient by default and need no memoisation, whereas React re-runs more code and relies on the compiler to skip it. React's model is plain values and plain functions, top to bottom, with one rule: render is pure. Signals introduce a reactive graph you have to keep intact. Neither is simply better; knowing both models makes you better at each.

**Try it:** In the [Solid playground](https://playground.solidjs.com/), build a counter and put a `console.log` in the component body and another inside `createEffect`. Click and see which logs. Then destructure a prop in a child component and observe it stop updating.

**Resources**
- [Solid docs: Intro to reactivity](https://docs.solidjs.com/concepts/intro-to-reactivity)
- [Vue docs: Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [TC39: Signals proposal](https://github.com/tc39/proposal-signals)

### Try a second framework

Building one small app in another framework is the fastest way to separate "how UIs work" from "how React does it". Pick an app you have already built (the to-do list with filtering and persistence, or the API explorer) so that all your attention goes to the framework.

Map the concepts as you go:

| Concept | React | Vue 3 | Svelte 5 |
| --- | --- | --- | --- |
| Component file | `.jsx`/`.tsx` function | `.vue` single-file component | `.svelte` file |
| State | `useState` | `ref()`, `reactive()` | `$state()` |
| Derived | compute in render, `useMemo` | `computed()` | `$derived()` |
| Side effect | `useEffect` | `watch`, `watchEffect`, `onMounted` | `$effect()` |
| Props | function argument | `defineProps()` | `$props()` |
| Child to parent | callback prop | `emit` / `defineEmits()` | callback prop |
| Two-way binding | `value` + `onChange` | `v-model` | `bind:value` |
| Lists | `.map()` with `key` | `v-for` with `:key` | `{#each items as item (item.id)}` |
| Conditionals | JS expressions | `v-if` / `v-else` | `{#if}` / `{:else}` |
| Slots | `children`, element props | `<slot>`, named slots | snippets, `{@render}` |
| Styling | bring your own | `<style scoped>` | scoped `<style>` by default |

Things to notice while you work. Templates are a restricted language the compiler can analyse, which is where Vue and Svelte get much of their performance; JSX is plain JavaScript and more flexible. Mutation is allowed and tracked (`todos.push(item)` works in Vue's `reactive` and Svelte's `$state`), the opposite of React's immutable updates. Dependencies are tracked automatically, so there are no dependency arrays and far fewer stale closures. Both ship scoped styles, transitions, and two-way binding in the box; React leaves those to the ecosystem. Each has an official meta-framework (Nuxt, SvelteKit) and official DevTools.

Scaffold with `npm create vue@latest` or `npx sv create`, and do the official interactive tutorial first; each takes an hour or two and is the best introduction available.

**Try it:** Port your to-do app. Afterwards write down three things the second framework made easier than React, three it made harder, and one React habit you had to unlearn. Compare the production bundle sizes of both versions with `npm run build`.

**Resources**
- [Vue: Tutorial](https://vuejs.org/tutorial/)
- [Svelte: Tutorial](https://svelte.dev/tutorial/svelte/welcome-to-svelte)
- [Vue docs: Introduction](https://vuejs.org/guide/introduction.html)

### Web Components interop

Custom elements are DOM elements, so in principle any framework can render them: `<my-rating value="4"></my-rating>` is just a tag. The friction is in three places: how data gets in, how events get out, and server rendering.

**Data in: attributes versus properties.** HTML attributes are strings. Rich data (objects, arrays, functions) must be set as JavaScript *properties* on the element. Frameworks have to decide which to use for each prop in your template. React 19 added full support: for a custom element, if a property with the prop's name exists on the element instance React assigns the property, otherwise it sets an attribute. Before React 19 everything was stringified into attributes, so objects became `"[object Object]"` and you needed a ref and manual assignment; you will find wrapper libraries (such as `@lit/react`) in older codebases for that reason. Vue applies a similar "property if it exists" check and offers the `.prop` modifier; Svelte and Angular handle properties too.

**Events out.** Custom elements communicate with `CustomEvent`s. In React 19 a prop that starts with `on` on a custom element registers a listener for the event named by the rest of the prop, matched case-sensitively: `onmy-change={handler}` listens for `my-change`. The handler receives the native event, with the payload in `e.detail`. For anything unusual, attach with `addEventListener` through a ref.

**Other details.** Use `class`-related props as normal (`className` works). Children map to slots; assign with the `slot` attribute. Styles inside a shadow root are isolated: your global CSS does not reach in except through inherited properties, CSS custom properties, and `::part()`. In TypeScript, declare the element in JSX's `IntrinsicElements` to get type checking. For SSR, a custom element renders as an empty tag until its script upgrades it unless the component supports Declarative Shadow DOM; expect a flash or layout shift otherwise. Vue needs `compilerOptions.isCustomElement` so it does not try to resolve the tag as a Vue component.

Custom Elements Everywhere tracks how well each framework passes a standard interop test suite.

**Try it:** Write a tiny `<x-counter>` custom element with a `count` property, an `items` array property, and a `count-change` event. Use it from React 19: pass the array, listen for the event, and inspect in DevTools whether each prop ended up as an attribute or a property.

**Resources**
- [react.dev: Custom HTML elements](https://react.dev/reference/react-dom/components#custom-html-elements)
- [MDN: Using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
- [Custom Elements Everywhere](https://custom-elements-everywhere.com/)

### Build a toy framework

Frameworks stop being magic once you have written a 150-line version of one. Build either model, or both.

**A virtual DOM renderer.** Four pieces: `h(type, props, ...children)` returns a plain object; `mount(vnode, container)` creates real DOM from it; `patch(oldVnode, newVnode)` compares the two and applies the difference (replace the node if the type differs, otherwise update changed props and recurse into children, first by index and then by key); and a `useState` that stores values in an array indexed by call order and triggers a re-render. Writing `patch` teaches you why keys exist, and writing `useState` teaches you why hooks cannot be conditional.

**A signals library.** This fits in about 40 lines:

```js
let activeEffect = null;

export function signal(value) {
  const subscribers = new Set();
  return {
    get value() {
      if (activeEffect) subscribers.add(activeEffect);
      return value;
    },
    set value(next) {
      if (Object.is(next, value)) return;
      value = next;
      for (const run of [...subscribers]) run();
    },
  };
}

export function effect(fn) {
  const run = () => {
    const previous = activeEffect;
    activeEffect = run;
    try { fn(); } finally { activeEffect = previous; }
  };
  run();
}

export function computed(fn) {
  const result = signal(undefined);
  effect(() => { result.value = fn(); });
  return result;
}

const count = signal(1);
const double = computed(() => count.value * 2);
effect(() => { document.title = `${double.value}`; });
count.value = 5; // title becomes "10"
```

The trick is the global `activeEffect`: reading a signal while an effect runs registers the subscription. Then discover what real libraries add: clearing stale dependencies before each run (so a branch that is no longer taken stops subscribing), batching writes, lazy computeds that recalculate only when read, glitch-free ordering so a computed never sees half-updated inputs, and disposal.

Keep the goal modest. You are not building something to use; you are building a mental model, and afterwards the source code and docs of real frameworks become much easier to read.

**Try it:** Follow "Build your own React" through the `createElement`, render, and reconciliation steps, typing the code rather than pasting it. Then extend the signals code above so an effect unsubscribes from signals it no longer reads, and write a test that proves it with a conditional read.

**Resources**
- [Rodrigo Pombo: Build your own React](https://pomb.us/build-your-own-react/)
- [Solid docs: Fine-grained reactivity](https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity)
- [Vue docs: Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html)

### Rebuild your vanilla apps

Porting something you already built isolates what React changes, because the requirements are fixed. Take the to-do app and the API explorer from the earlier modules and rebuild them with Vite's `react-ts` template.

Work in this order. Start from the static markup: paste your HTML into components, fix the JSX differences, and break it into a hierarchy. Identify the minimal state (the to-do array, the filter, the draft text; for the explorer, the request inputs and a response status) and decide where each piece lives. Everything else, including the visible list, counts, and "all done" flags, is derived during render. Add interactions as handlers with immutable updates. Persistence to `localStorage` is your first real effect, or better, a `useLocalStorage` custom hook with a lazy initialiser for the first read. For the API explorer, model the request as one status value (`idle`, `loading`, `success`, `error`), abort stale requests in effect cleanup, and render all four states.

Hold the port to the same bar as the original, and higher: keyboard operable, labelled inputs, focus that goes somewhere sensible after adding or deleting an item, no console warnings, Strict Mode on. Write a handful of React Testing Library tests for the main flows (add, complete, filter, delete, reload restores state).

Then do the comparison the checklist asks for, in writing. Which bugs from the vanilla version became impossible? How many lines existed only to keep the DOM in sync? What did you gain (structure, derived values, testability) and what did it cost (bundle size, a build step, new failure modes like stale closures and effect dependencies)? Compare the Network panel's transferred JavaScript and a Lighthouse run for both. The honest answer for a small app is that vanilla is lighter; the point is to see where the crossover is.

**Try it:** Before writing any code, list every `querySelector`, `innerHTML`, `classList`, and `addEventListener` call in the vanilla to-do app and label each with what it becomes in React: state, derived value, JSX, handler, or effect. Almost none should be effects.

**Resources**
- [react.dev: Thinking in React](https://react.dev/learn/thinking-in-react)
- [Vite: Getting Started](https://vite.dev/guide/)
- [react.dev: Tutorial: Tic-Tac-Toe](https://react.dev/learn/tutorial-tic-tac-toe)

### Component library starter

Build five components that cover the hard problems of UI engineering: Button, Dialog, Tabs, Combobox, and Toast. Use TypeScript in strict mode and treat the WAI-ARIA Authoring Practices as the specification.

What each one teaches:

- **Button**: API design. Extend `React.ComponentProps<'button'>` so every native attribute works, forward `ref`, default `type="button"`, add `variant` and `size`, and a loading state that keeps the button focusable (`aria-disabled`, not `disabled`). Support rendering as a link.
- **Dialog**: use the native `<dialog>` with `showModal()` for the top layer, focus trapping, and `Escape`; add a labelled title, focus return to the trigger, and controlled and uncontrolled `open`.
- **Tabs**: compound components over context; roving `tabindex`, arrow keys, Home/End, `aria-selected`, `aria-controls`, and IDs from `useId`.
- **Combobox**: the hardest. A text input with a popup listbox, `aria-activedescendant` for the virtual focus, filtering, keyboard selection, and announcing result counts. Budget most of your time here.
- **Toast**: an imperative API (`toast('Saved')`) backed by an external store and `useSyncExternalStore`, a live region (`role="status"`), timers that pause on hover and focus, and no focus stealing.

Engineering around them: design tokens as CSS custom properties, styles that consumers can override (`className` passthrough and `data-state` attributes), Storybook or a simple gallery page with every state, and tests using Testing Library with `user-event` for keyboard paths plus `axe` checks. Test with a real screen reader at least once per component (NVDA on Windows, VoiceOver on macOS).

Decide and write down your position on controlled versus uncontrolled props, how refs are forwarded, and naming conventions, and apply it consistently; consistency is what makes a library feel designed. When stuck, read how Radix or React Aria solved the same problem. Building these yourself is the exercise; in production you would normally build on a headless library.

**Try it:** Before coding the Combobox, operate the APG's editable combobox example with only the keyboard and with a screen reader running. Write down every key and announcement as acceptance criteria, then turn each into a test.

**Resources**
- [WAI-ARIA APG: Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [WAI-ARIA APG: Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/docs/basic/setup)

### Multi-step form

A wizard is a compact exercise in state design. Build something realistic: account details, then address, then plan selection, then review and submit, against a mock API that is slow and fails sometimes.

Decisions to make deliberately:

- **Where the data lives.** One object for the whole form, owned above the steps (a reducer, or one React Hook Form instance spanning all steps). Steps that own their own state lose it when they unmount.
- **The current step is state too**, and it belongs in the URL (`?step=2` or a route per step) so Back, Forward, and refresh work. Guard against deep-linking into step 3 with steps 1 and 2 incomplete.
- **Validation.** A schema per step (Zod or Valibot), validated when the user tries to advance, with the full schema validated again on submit and again on the server. Validate on blur, then on change once a field has an error; do not shout at people while they type. Handle async checks ("is this username taken") with debouncing and cancellation.
- **Submission** is a small state machine: `editing`, `submitting`, `succeeded`, `failed`. Disable double submits, and map server field errors back to the right step and field.
- **Optimistic UI.** Show the result immediately where it is safe (for example the new plan in the header) with `useOptimistic` or a query library, and roll back with a visible message on failure.
- **Error recovery.** Keep everything the user typed when a request fails. Offer retry. Persist a draft to `sessionStorage` so a refresh does not wipe the form, and clear it on success. Warn before leaving with unsaved changes.
- **Accessibility.** On step change move focus to the step heading, announce "Step 2 of 4", provide an error summary linking to invalid fields, and make sure every error is associated with its input.

Mock the API with MSW so you can script the failures: a 422 with field errors, a 500, a timeout, and a slow success.

**Try it:** Write the reducer and its types first with no UI: state, actions (`next`, `back`, `field_changed`, `submit_started`, `submit_failed`, `submit_succeeded`), and unit tests for transitions, including that `next` is refused when the current step is invalid. Then attach the components.

**Resources**
- [react.dev: useOptimistic](https://react.dev/reference/react/useOptimistic)
- [React Hook Form: Advanced Usage (wizard forms)](https://react-hook-form.com/advanced-usage)
- [W3C WAI: Multi-page Forms tutorial](https://www.w3.org/WAI/tutorials/forms/multi-page/)
