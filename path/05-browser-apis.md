# The DOM and Browser APIs

> Stage: 1 · Foundations
> Where JavaScript meets the page. Build real interfaces with no framework so you know what frameworks are doing for you.

## The DOM

- [ ] DOM tree - nodes vs elements, and how HTML becomes a tree
- [ ] Querying - `querySelector`, `querySelectorAll`, `closest`, `matches`
- [ ] Reading and writing - `textContent`, attributes vs properties, `classList`, `dataset`, `style`
- [ ] Creating and moving nodes - `createElement`, `append`, `remove`, `replaceWith`, `DocumentFragment`
- [ ] `innerHTML` and safety - why it's an XSS risk and what to use instead
- [ ] `template` element - clone markup efficiently
- [ ] Geometry - `getBoundingClientRect`, offset/client/scroll dimensions

## Events

- [ ] Listeners - `addEventListener`, options (`once`, `passive`, `signal`), removal
- [ ] Propagation - capture, target, bubble; `stopPropagation` vs `preventDefault`
- [ ] Event delegation - handle many children with one listener
- [ ] Pointer and keyboard events - `pointerdown`, `keydown`, `key` vs `code`
- [ ] Form events - `input`, `change`, `submit`, and `FormData`
- [ ] Custom events - dispatch and listen for your own
- [ ] Page lifecycle - `DOMContentLoaded`, `load`, `visibilitychange`, `pagehide`

## Networking

- [ ] `fetch` - requests, responses, headers, JSON, error handling (a 404 doesn't reject)
- [ ] Aborting and timeouts - `AbortController`, `AbortSignal.timeout`
- [ ] `URL` and `URLSearchParams` - build and parse URLs properly
- [ ] CORS basics - understand why a cross-origin request failed
- [ ] Streams - read a response body incrementally

## Storage and state

- [ ] `localStorage` and `sessionStorage` - capabilities, limits, synchronous cost
- [ ] Cookies from JS - `document.cookie` and why `HttpOnly` exists
- [ ] IndexedDB - store structured data client-side (with a wrapper like `idb`)
- [ ] History API - `pushState`, `replaceState`, and `popstate`
- [ ] Navigation API - intercept navigations with the `navigate` event instead of patching links and `popstate`

## Observers and scheduling

- [ ] `IntersectionObserver` - lazy loading and scroll-triggered behaviour
- [ ] `ResizeObserver` - respond to element size changes
- [ ] `MutationObserver` - watch DOM changes
- [ ] `requestAnimationFrame` - schedule visual updates
- [ ] Web Animations API - create, control, and await animations from JavaScript with `element.animate()`
- [ ] `requestIdleCallback` and `scheduler.postTask` - defer low-priority work

## Other platform features

- [ ] Web Workers - move heavy computation off the main thread
- [ ] `BroadcastChannel` and Web Locks - message between tabs and coordinate work so only one tab does it
- [ ] Clipboard, Share, and Fullscreen APIs - integrate with the device
- [ ] File handling - `File`, `Blob`, `FileReader`, drag and drop, object URLs
- [ ] Geolocation, notifications, permissions - request permissions responsibly
- [ ] `Intl` - format dates, numbers, lists, and relative times
- [ ] Web Components - custom elements, shadow DOM, slots

## Projects

- [ ] Vanilla to-do app - add, edit, filter, persist to `localStorage`, fully keyboard operable
- [ ] API explorer - search a public API with debounced input, loading, empty, and error states, and request cancellation
- [ ] Vanilla SPA router - client-side routing with the History API and no libraries
- [ ] Infinite image gallery - lazy loading with `IntersectionObserver`

## Resources

- [MDN: Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [javascript.info: Browser - Document, Events, Interfaces](https://javascript.info/ui)
