# The DOM and Browser APIs: Practice test

### 1. Given this markup, what does the code log?

```html
<ul id="list">
  <li>One</li>
  <li>Two</li>
</ul>
```

```js
const list = document.querySelector('#list');
console.log(list.childNodes.length, list.children.length);
```

- [ ] 2 2
- [ ] 3 2
- [x] 5 2
- [ ] 2 5

> `children` contains only elements: the two `<li>`s. `childNodes` contains every node, including the whitespace text nodes: one before the first `<li>`, one between the two, and one after the second, giving 3 text nodes plus 2 elements. "3 2" is the tempting answer if you forget the text node before the first item or after the last.

### 2. A user types "hello" into `<input id="q" value="start">`. What do these two expressions return afterwards?

```js
q.value;
q.getAttribute('value');
```

- [ ] `"hello"` and `"hello"`
- [x] `"hello"` and `"start"`
- [ ] `"start"` and `"hello"`
- [ ] `"start"` and `"start"`

> The `value` attribute holds the initial value from the markup; the `value` property holds the current state. Typing changes the property only. Always read form state from properties (`value`, `checked`), not attributes.

### 3. Which statement about `event.preventDefault()` and `event.stopPropagation()` is correct?

- [ ] `preventDefault()` stops the event from reaching ancestor listeners
- [ ] `stopPropagation()` cancels the browser's default action, such as following a link
- [ ] Calling either one has the same effect as returning `false` from a listener added with `addEventListener`
- [x] `preventDefault()` cancels the default action but the event keeps propagating; `stopPropagation()` stops propagation but the default action still happens

> They are independent. One concerns what the browser does by default (navigate, submit, type); the other concerns which listeners get to see the event. Returning `false` only has an effect in `on*` handler properties and attributes, not in `addEventListener` listeners.

### 4. Why does this listener not get removed?

```js
button.addEventListener('click', () => save(data));
// later
button.removeEventListener('click', () => save(data));
```

- [x] The two arrow functions are different function objects, and removal requires the same reference
- [ ] `removeEventListener` only works for listeners registered with `{ once: true }`
- [ ] Arrow functions cannot be removed; only function declarations can
- [ ] The listener must be removed in the capture phase

> `removeEventListener` matches on type, function identity, and the capture flag. Two arrow functions with identical source are still two objects. Keep a reference to the function, or pass `{ signal }` from an `AbortController` and call `abort()`.

### 5. What does this log when the `<span>` inside the button is clicked?

```html
<div id="outer">
  <button id="btn"><span>Save</span></button>
</div>
```

```js
outer.addEventListener('click', (e) => {
  console.log(e.target.tagName, e.currentTarget.tagName);
});
```

- [ ] BUTTON DIV
- [ ] DIV DIV
- [x] SPAN DIV
- [ ] SPAN BUTTON

> `target` is the innermost node the event originated on, here the `<span>`. `currentTarget` is the element whose listener is running, the `<div>`. This is why delegated handlers use `e.target.closest('button')` rather than testing `e.target` directly.

### 6. This delegated handler sometimes does nothing when a user clicks a delete button that contains an icon. Explain the bug and fix it.

```js
list.addEventListener('click', (event) => {
  if (event.target.matches('button.delete')) {
    event.target.parentElement.remove();
  }
});
```

> When the click lands on the icon inside the button, `event.target` is the icon element, not the button, so `matches('button.delete')` is false. Use `closest`, which walks up from the target, and also find the row with `closest` instead of assuming the button's direct parent is the row:
>
> ```js
> list.addEventListener('click', (event) => {
>   const button = event.target.closest('button.delete');
>   if (!button || !list.contains(button)) return;
>   button.closest('li').remove();
> });
> ```
>
> The `list.contains` check guards against `closest` matching an ancestor outside the list.

### 7. A page renders a comment with `el.innerHTML = comment`. Which payload executes script?

- [ ] `<script>alert(1)</script>`, because the parser runs inserted scripts
- [x] `<img src="x" onerror="alert(1)">`, because event handler attributes still run
- [ ] Neither; `innerHTML` strips anything executable
- [ ] Both run, in order

> Scripts inserted via `innerHTML` are marked as already started and never execute, which lulls people into thinking it is safe. Event handler attributes, `javascript:` URLs, and `<iframe srcdoc>` all still work. Use `textContent` for text, or `setHTML()`/DOMPurify when you must render untrusted markup.

### 8. What is wrong with this code, and what is the result?

```js
const res = await fetch('/api/user/42');
const user = await res.json();
showProfile(user);
```

- [ ] `fetch` needs `.then()`; it cannot be awaited
- [ ] `res.json()` is synchronous, so the second `await` breaks it
- [ ] Nothing: a 404 or 500 rejects the `fetch` promise, so `showProfile` is never reached with bad data
- [x] It never checks `res.ok`, so a 404 or 500 response is parsed and passed to `showProfile` (or throws a confusing `SyntaxError` if the error body is HTML)

> `fetch` rejects only when no response is obtained (network failure, CORS block, abort). HTTP error statuses resolve normally. Check `res.ok` and throw before reading the body.

### 9. What does this log?

```js
const url = new URL('https://example.com/search');
url.searchParams.set('q', 'a&b');
url.searchParams.append('tag', 'x');
url.searchParams.append('tag', 'y');
url.searchParams.set('tag', 'z');
console.log(url.search);
```

- [ ] `?q=a&b&tag=x&tag=y&tag=z`
- [ ] `?q=a%26b&tag=x&tag=y&tag=z`
- [x] `?q=a%26b&tag=z`
- [ ] `?q=a&b&tag=z`

> `URLSearchParams` percent-encodes the `&` in the value so it is not read as a separator. `set` replaces every existing value for the key, so the two appended `tag` values are removed and one `tag=z` remains.

### 10. A `fetch` from `https://app.example.com` to `https://api.example.com` fails with `TypeError: Failed to fetch`, yet the server logs show it handled the request and returned 200. What is the most likely cause?

- [ ] The request was blocked before leaving the browser because the domains differ
- [x] The response lacked an `Access-Control-Allow-Origin` header permitting the app's origin, so the browser withheld it from script
- [ ] The server must be on the same port for subdomains to share an origin
- [ ] `fetch` cannot make cross-origin requests; a `<script>` tag is required

> For a simple request the browser sends it, then checks the response headers. Without a matching `Access-Control-Allow-Origin` it refuses to expose the response to JavaScript, even though the server did its work. The detailed reason appears in the Console, not in the error object. The fix is on the server (or a same-origin proxy).

### 11. A colleague suggests fixing a CORS error by adding `mode: 'no-cors'` to the `fetch` call. Explain what that does and why it is not a fix.

> `mode: 'no-cors'` tells the browser to send the request without requiring CORS permission, restricted to simple methods and headers, and in exchange gives back an *opaque* response: `status` is 0, `ok` is false, headers are empty, and the body cannot be read. The error goes away but so does the data, so it is useless for calling an API. It exists for cases like a service worker caching a cross-origin image it never needs to inspect. Real fixes: have the API send `Access-Control-Allow-Origin` (plus `Allow-Methods`/`Allow-Headers` for preflighted requests, and `Allow-Credentials` with an explicit origin if cookies are involved), or route the call through your own same-origin backend or dev-server proxy, since CORS is enforced only by browsers.

### 12. What happens when a user types "ab" quickly, if the request for "a" takes 2 seconds and the request for "ab" takes 200 ms?

```js
input.addEventListener('input', async () => {
  const res = await fetch(`/search?q=${encodeURIComponent(input.value)}`);
  render(await res.json());
});
```

- [ ] Only the results for "ab" are ever rendered, because the browser cancels the earlier request
- [ ] The results for "a" render first, then "ab"
- [ ] The second `fetch` waits for the first to complete
- [x] The results for "ab" render first and are then overwritten by the stale results for "a"

> Requests are independent and responses can arrive in any order. Nothing cancels the first request, so its slower response renders last and the UI shows results for "a" while the input says "ab". Abort the previous request with an `AbortController` before starting a new one (and debounce the input).

### 13. What does this code log if the server takes 5 seconds to respond?

```js
try {
  await fetch('/slow', { signal: AbortSignal.timeout(1000) });
} catch (err) {
  console.log(err.name);
}
```

- [x] `TimeoutError`
- [ ] `AbortError`
- [ ] `TypeError`
- [ ] Nothing; `fetch` ignores signals it did not create

> A signal from `AbortSignal.timeout()` aborts with a `TimeoutError` `DOMException`, which lets you distinguish a timeout from a manual `controller.abort()` (which gives `AbortError`). `TypeError` is what a network failure produces.

### 14. What does this log, assuming storage was empty beforehand?

```js
localStorage.setItem('count', 1);
localStorage.setItem('user', { name: 'Ada' });
console.log(localStorage.getItem('count') + 1, localStorage.getItem('user'), localStorage.getItem('nope'));
```

- [ ] `2`, `{ name: 'Ada' }`, `undefined`
- [ ] `"11"`, `'{"name":"Ada"}'`, `null`
- [x] `"11"`, `"[object Object]"`, `null`
- [ ] `2`, `"[object Object]"`, `undefined`

> Web Storage stores strings only and coerces everything with `String()`. The number becomes `"1"`, so `+ 1` concatenates to `"11"`; the object becomes `"[object Object]"` and its data is lost. A missing key returns `null`. Serialise with `JSON.stringify` and parse on the way out.

### 15. Why should a session cookie be marked `HttpOnly`?

- [ ] It encrypts the cookie value in transit
- [ ] It stops the cookie from being sent on cross-site requests
- [x] It hides the cookie from `document.cookie`, so script injected through an XSS bug cannot read and exfiltrate it
- [ ] It restricts the cookie to HTTP, preventing use over HTTPS

> `HttpOnly` removes the cookie from JavaScript's view while the browser still attaches it to requests. Encryption in transit is the job of HTTPS and the `Secure` attribute; cross-site sending is controlled by `SameSite`. `HttpOnly` limits what an XSS attacker can steal, although injected script can still make requests that carry the cookie.

### 16. A user clicks a link handled by this router, then presses the browser's Back button. The URL changes back but the old view stays on screen. Why, and what is missing?

```js
function go(path) {
  history.pushState(null, '', path);
  render(path);
}
```

> `pushState` changes the URL and adds a history entry, and the code renders after calling it, so forward navigation works. Pressing Back does not call `go`; the browser moves to the previous entry, changes the URL, and fires `popstate` on `window`. Nothing listens for it, so nothing re-renders. Add:
>
> ```js
> window.addEventListener('popstate', () => render(location.pathname));
> ```
>
> The router should also render once on initial load, and the server must return the app for every route so that reloading a deep URL works. With the Navigation API, a single `navigate` event handler with `event.intercept()` covers links, Back/Forward, and programmatic navigation.

### 17. A router uses the Navigation API. The user clicks a link to `/reports` (whose loader takes 3 seconds) and one second later clicks a link to `/home`. What happens to the first navigation?

```js
navigation.addEventListener('navigate', (event) => {
  if (!event.canIntercept || event.hashChange) return;
  const url = new URL(event.destination.url);
  event.intercept({
    async handler() {
      const res = await fetch(`/api${url.pathname}`, { signal: event.signal });
      render(await res.json());
    },
  });
});
```

- [ ] Both loaders finish, and whichever response arrives last is rendered
- [ ] The second click is ignored until the first handler settles
- [x] The first navigation's `event.signal` aborts, cancelling its `fetch`, so only `/home` renders
- [ ] The browser falls back to a full page load for `/home`

> When a new navigation starts while an intercepted one is still in progress, the browser aborts the earlier one: its `signal` fires and its `fetch` rejects with `AbortError`, so the stale response is never rendered. With the History API you have to build this yourself with an `AbortController` per navigation; here it is part of the event.

### 18. An `IntersectionObserver` is created and `observe(el)` is called on an element far below the fold. When does the callback first run?

- [ ] Never, until the element scrolls into view
- [ ] Synchronously, inside the `observe()` call
- [ ] On the next `scroll` event
- [x] Asynchronously, shortly after `observe()`, with `isIntersecting: false`

> The observer always delivers an initial entry describing the element's current state, whether or not it intersects. Code that treats any callback as "now visible" will misfire immediately; always check `entry.isIntersecting`.

### 19. What is the problem with this animation?

```js
let x = 0;
function step() {
  x += 5;
  box.style.transform = `translateX(${x}px)`;
  if (x < 600) requestAnimationFrame(step);
}
requestAnimationFrame(step);
```

- [ ] `requestAnimationFrame` must be called with `setInterval` to repeat
- [x] Speed depends on the display's refresh rate: it finishes in 2 seconds at 60 Hz but 1 second at 120 Hz, and slows down if frames drop
- [ ] `transform` cannot be animated from JavaScript
- [ ] The callback runs after paint, so each frame is one behind

> rAF callbacks fire once per rendered frame, and frame rate varies by device and load. Moving a fixed distance per frame ties speed to frame rate. Use the timestamp passed to the callback to compute progress from elapsed time. rAF callbacks run before style, layout, and paint for that frame, not after.

### 20. After this runs, the box animates to the right and then jumps back to where it started. Why?

```js
box.animate(
  [{ transform: 'translateX(0)' }, { transform: 'translateX(200px)' }],
  { duration: 300, easing: 'ease-out' },
);
```

- [ ] `element.animate()` requires `iterations: 1` to keep its end state
- [ ] `transform` cannot be animated with the Web Animations API
- [ ] The animation was garbage-collected because its return value was not stored
- [x] An animation's effect applies only while it is active; when it finishes, the element shows its underlying style, which was never changed

> By default (`fill: 'none'`) an animation stops affecting the element once it ends. Either set the final state as the element's real style and animate to it (`box.style.transform = 'translateX(200px)'` before animating from the old value), or call `animation.commitStyles()` then `animation.cancel()` after it finishes. `fill: 'forwards'` also holds the end state, but keeps the animation alive and overriding later style changes, so it is the least preferable fix.

### 21. What does this log?

```js
const el = document.createElement('div');
el.addEventListener('ping', () => console.log('B'));
console.log('A');
el.dispatchEvent(new CustomEvent('ping'));
console.log('C');
```

- [ ] A, C, B
- [x] A, B, C
- [ ] B, A, C
- [ ] A, C (the listener never runs because the element is not in the document)

> `dispatchEvent` is synchronous: all listeners run before it returns. That differs from events caused by user input, which are queued as tasks. The element does not need to be in the document to receive an event dispatched directly on it.

### 22. A button inside a component's shadow root dispatches `new CustomEvent('change-requested', { detail })`. A listener on `document` never hears it. Which options are needed?

- [ ] `{ cancelable: true }`
- [ ] `{ bubbles: true }` only
- [ ] `{ composed: true }` only
- [x] `{ bubbles: true, composed: true }`

> Both default to `false` for events you construct. `bubbles` lets the event travel up through ancestors; `composed` lets it cross the shadow boundary into the light DOM. With `composed` alone the event still does not bubble, so an ordinary (non-capturing) listener on `document` never runs; with `bubbles` alone it stops at the shadow root.

### 23. Why does this code corrupt some text when the response contains non-ASCII characters?

```js
const reader = res.body.getReader();
let text = '';
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  text += new TextDecoder().decode(value);
}
```

- [ ] `getReader()` returns strings already, so decoding twice corrupts them
- [ ] `TextDecoder` defaults to UTF-16
- [x] A multi-byte character can be split across two chunks, and a fresh decoder for each chunk cannot join the halves
- [ ] The loop must use `for await` instead of `reader.read()`

> Chunk boundaries are arbitrary byte positions. In UTF-8 a character can be 2 to 4 bytes, so a chunk may end mid-character; decoding it alone yields a replacement character. Create one decoder and call `decode(value, { stream: true })`, or pipe the body through `new TextDecoderStream()`.

### 24. This IndexedDB code (using the `idb` wrapper) throws `TransactionInactiveError` on the `put`. Explain why and how to restructure it.

```js
const tx = db.transaction('articles', 'readwrite');
const existing = await tx.store.get(id);
const fresh = await fetch(`/api/articles/${id}`).then((r) => r.json());
await tx.store.put({ ...existing, ...fresh });
await tx.done;
```

> An IndexedDB transaction stays active only while it has pending requests; once control returns to the event loop with none outstanding, it auto-commits. Awaiting the `fetch` yields to the event loop for a long time with no IndexedDB request pending, so the transaction completes, and the later `put` is issued against a finished transaction. Do the unrelated async work outside the transaction: fetch first, then open the transaction and do the read and write back to back.
>
> ```js
> const fresh = await fetch(`/api/articles/${id}`).then((r) => r.json());
> const tx = db.transaction('articles', 'readwrite');
> const existing = await tx.store.get(id);
> await tx.store.put({ ...existing, ...fresh });
> await tx.done;
> ```

### 25. What is logged?

```js
const worker = new Worker('worker.js'); // echoes nothing; just receives
const buffer = new ArrayBuffer(1024);
worker.postMessage({ buffer }, [buffer]);
console.log(buffer.byteLength);
```

- [x] 0
- [ ] 1024
- [ ] `undefined`
- [ ] It throws, because `ArrayBuffer` cannot be sent to a worker

> Listing the buffer in the transfer list moves ownership to the worker instead of copying. The sender's `ArrayBuffer` is detached and reports a `byteLength` of 0. Without the second argument the buffer would be copied by structured clone and the log would be 1024.

### 26. Where should you save unsent form data or send final analytics so that it reliably happens when a user leaves on mobile?

- [ ] In a `window` `unload` listener
- [ ] In a `beforeunload` listener, using a synchronous XHR
- [x] In a `visibilitychange` listener when `document.visibilityState` becomes `'hidden'`, using `sendBeacon` or `fetch` with `keepalive`
- [ ] In a `DOMContentLoaded` listener, registered with `{ once: true }`

> On mobile, users switch apps and the OS may later kill the tab with no further events, so `unload` and `beforeunload` often never fire. They also make the page ineligible for the back/forward cache. The switch to `hidden` is the last reliably observable moment, and `sendBeacon`/`keepalive` requests are allowed to outlive the page.

### 27. Your app keeps a short-lived access token and refreshes it when it expires. Users with several tabs open are being logged out at random, and the server logs show multiple refresh requests arriving at the same moment with the same single-use refresh token. Explain the cause and write a fix using a browser API.

> Each tab runs its own copy of the app. When the token expires, every open tab notices independently and sends a refresh request. The refresh token is single-use, so the first request succeeds and rotates it, and the others present a token that is now invalid; the server rejects them (and may revoke the session), logging those tabs out.
>
> The work must be done by one tab at a time. The Web Locks API provides a cross-tab mutex for the origin:
>
> ```js
> async function getValidToken() {
>   const current = readToken();
>   if (current && !isExpired(current)) return current;
>
>   return navigator.locks.request('token-refresh', async () => {
>     // Another tab may have refreshed while we waited for the lock
>     const latest = readToken();
>     if (latest && !isExpired(latest)) return latest;
>
>     const fresh = await requestNewToken();
>     saveToken(fresh);          // shared storage the other tabs read
>     return fresh;
>   });
> }
> ```
>
> The lock is held until the callback's promise settles and is released automatically if the tab closes. The re-check inside the lock is essential: the tabs that waited find the fresh token and do not refresh again. A `BroadcastChannel` can additionally announce the new token (or a logout) so other tabs update in-memory state immediately.

### 28. A component adds listeners to `window` and `document` and starts a `fetch` when it mounts. Write a mount/unmount pair that guarantees everything is cleaned up, and explain why your approach is robust.

> Use one `AbortController` per mount and pass its signal to everything:
>
> ```js
> function mount(el) {
>   const controller = new AbortController();
>   const { signal } = controller;
>
>   window.addEventListener('resize', () => layout(el), { signal });
>   document.addEventListener('keydown', (e) => onKey(e, el), { signal });
>
>   fetch('/api/data', { signal })
>     .then((res) => {
>       if (!res.ok) throw new Error(`HTTP ${res.status}`);
>       return res.json();
>     })
>     .then((data) => render(el, data))
>     .catch((err) => {
>       if (err.name !== 'AbortError') showError(el, err);
>     });
>
>   return () => controller.abort();   // unmount
> }
> ```
>
> Calling the returned function removes both listeners and cancels the request in one step. It is robust because removal does not depend on keeping matching function references or capture flags (the usual way `removeEventListener` silently fails), it works with anonymous functions, and anything added later is covered as long as it receives the same signal. The `AbortError` check stops an expected cancellation from being shown as a failure, and stops a late response rendering into a removed component.

### 29. Users report that typing in a filter box is laggy on a page showing 5,000 rows. The handler recalculates and re-renders on every `input` event. Describe how you would diagnose the cause and three different techniques that could fix it, saying when each is appropriate.

> Diagnose first: record typing in the Performance panel (with 4x CPU throttling to mimic slower devices) and look at the main thread for long tasks on each keystroke. The breakdown shows whether time goes to scripting (the filter logic), to rendering (style, layout, and paint from replacing thousands of nodes), or to forced reflows from reading layout between writes.
>
> Fixes, depending on what the trace shows:
>
> - **Do less work per keystroke.** Debounce the handler by 150 to 300 ms so filtering runs once the user pauses; this is the cheapest fix when the work is acceptable occasionally but not on every key.
> - **Do less DOM work.** Rendering is usually the real cost. Toggle a `hidden` attribute on existing rows rather than rebuilding them, render only the first N matches with a "show more", apply `content-visibility: auto`, or virtualise the list so only visible rows exist.
> - **Move or split the computation.** If filtering itself is slow (fuzzy matching, large data), run it in a Web Worker and post back matching ids, or break the loop into chunks that `await scheduler.yield()` (with a `setTimeout` fallback for Safari) so input stays responsive.
>
> Also avoid layout thrashing by batching reads before writes, and cancel stale work: if a new keystroke arrives, abort the previous computation so its result is not rendered.

### 30. Your site wants to show browser notifications for order updates. Describe a responsible permission flow, including what happens when the user says no.

> Do not call `Notification.requestPermission()` on page load: the user has no context, will likely block, and a block is effectively permanent because the site cannot prompt again. Instead:
>
> 1. Feature-detect (`'Notification' in window`) and check the current state (`Notification.permission`, or `navigator.permissions.query({ name: 'notifications' })`) so you only show relevant UI.
> 2. Offer the feature at a moment the benefit is obvious, such as after placing an order: a button like "Notify me when my order ships", with a sentence saying what will be sent and how often.
> 3. Call `requestPermission()` from that button's click handler, since browsers require or strongly favour a user gesture.
> 4. If the result is `'granted'`, confirm and subscribe. If `'default'` (dismissed), leave the offer available without nagging. If `'denied'`, hide the prompt UI, fall back to email or in-app updates, and optionally explain that notifications can be re-enabled in the browser's site settings.
>
> The app must work fully without the permission. Notifications delivered while the site is closed additionally need a service worker and a push subscription.
