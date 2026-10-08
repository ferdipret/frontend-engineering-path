# HTML: Practice test

### 1. What is the job of `<!doctype html>`?

- [ ] It tells the browser which version of HTML the page uses, so the right features are enabled
- [x] It switches the browser into standards mode instead of quirks mode
- [ ] It declares the character encoding of the document
- [ ] It is required for the page to render at all

> The doctype is a mode switch. Without it browsers render in quirks mode, emulating old layout bugs. HTML has no versions to select, the encoding is declared by `<meta charset>`, and a page without a doctype still renders, only differently.

### 2. A page has no viewport meta tag. What happens on a phone?

- [ ] The page is laid out at the phone's width but with larger text
- [ ] The page refuses to load on mobile browsers
- [ ] Media queries still match the real device width, but images overflow
- [x] The browser lays the page out on a wide virtual viewport (about 980px) and scales it down

> Mobile browsers assume a desktop-era page unless told otherwise, so they use a wide layout viewport and zoom out. Because the layout viewport is ~980px, `max-width` media queries for small screens do not match either. `width=device-width, initial-scale=1` fixes both.

### 3. What does the DOM look like after the browser parses this?

```html
<p>Before <div>Box</div> after</p>
```

- [ ] One `<p>` containing the text and the `<div>`, exactly as written
- [ ] One `<p>` containing the text, with the `<div>` converted to a `<span>`
- [x] A `<p>` with "Before", then the `<div>`, then the text " after", then an empty `<p>`
- [ ] The whole fragment is discarded as invalid

> A `<p>` may only contain phrasing content, and the parser closes an open `<p>` when it sees a `<div>` start tag. The stray `</p>` at the end then creates an empty paragraph. Browsers never discard or convert; they recover by defined rules, which is why the DOM can differ from your source.

### 4. Which input is disabled?

```html
<input id="a" disabled>
<input id="b" disabled="false">
<input id="c" disabled="">
```

- [ ] Only `a`
- [ ] `a` and `c`
- [x] All three
- [ ] `a` and `b`

> `disabled` is a boolean attribute: its presence means true and its value is ignored. `disabled="false"` is a classic bug, often produced by templates that stringify a boolean. To enable the control, the attribute must be absent.

### 5. A design calls for a small, light-grey heading above each card in a sidebar, under the page's `<h2>` "Related articles". What should you use?

- [ ] `<h6>`, because it is the smallest heading
- [ ] `<p class="card-title">`, because it should not look like a heading
- [ ] `<h1>` inside each card's `<article>`, because sections restart the outline
- [x] `<h3>`, styled with CSS to the size the design wants

> The level comes from the outline: these headings are one level below the `<h2>`. Appearance is CSS's job. The idea that sectioning elements restart heading levels (the "outline algorithm") was never implemented by browsers or screen readers and was removed from the standard.

### 6. In which case does `<header>` create a `banner` landmark?

- [x] When it is a direct child of `<body>`, not nested in sectioning content or `<main>`
- [ ] Always
- [ ] Only when it contains an `<h1>`
- [ ] When it is the first child of an `<article>`

> A `<header>` scoped to the page maps to the `banner` role. Inside `<article>`, `<section>`, `<aside>`, `<nav>`, or `<main>` it is just the header of that part and has no landmark role. The same scoping applies to `<footer>` and `contentinfo`.

### 7. What is wrong with this control?

```html
<a href="#" class="btn" onclick="toggleMenu()">Menu</a>
```

- [ ] Nothing; a link styled as a button is fine
- [ ] It should use `href="javascript:void(0)"` so the page does not jump
- [x] It performs an action rather than navigating, so it should be a `<button type="button">`
- [ ] It needs `role="link"`

> A link is for going to a URL. This one goes nowhere: it is announced as a link, does not respond to Space, offers a meaningless "open in new tab", and scrolls to the top unless the handler prevents it. A `<button>` gives the right role and keyboard behaviour for free. Styling a real link to look like a button is fine; the problem here is the behaviour.

### 8. A form is submitted with the fields in this state. What is the query string?

```html
<form action="/s" method="get">
  <input name="q" value="tea">
  <input id="city" value="Oslo">
  <input type="checkbox" name="fresh">
  <input type="checkbox" name="organic" checked>
  <input name="ref" value="home" disabled>
  <button>Search</button>
</form>
```

- [ ] `?q=tea&city=Oslo&fresh=off&organic=on&ref=home`
- [ ] `?q=tea&fresh=false&organic=true`
- [ ] `?q=tea&organic=on&ref=home`
- [x] `?q=tea&organic=on`

> Only controls with a `name` that are not disabled are submitted, and checkboxes only when checked. The city input has an `id` but no `name`; the unchecked box sends nothing at all (not `off` or `false`); the disabled input is skipped. A checked checkbox with no `value` sends `on`. The button has no `name`, so it contributes nothing.

### 9. A screen reader announces this field as "edit text, blank". Why?

```html
<label for="user-email">Email</label>
<input name="user-email" type="email" placeholder="you@example.com">
```

- [ ] `type="email"` inputs cannot have labels
- [x] `for` must match the input's `id`, and the input has only a `name`
- [ ] The placeholder overrides the label
- [ ] The label must wrap the input

> `for` references an `id`. With no matching id the label is associated with nothing, so the input has no accessible name (some browsers fall back to the placeholder, which is unreliable). Add `id="user-email"` to the input. Wrapping would also work, but it is not required.

### 10. You need a field for a six-digit SMS verification code. Which markup is best?

- [ ] `<input type="number" name="code">`
- [ ] `<input type="tel" name="code" maxlength="6">`
- [x] `<input type="text" name="code" inputmode="numeric" pattern="[0-9]{6}" autocomplete="one-time-code">`
- [ ] Six `<input type="text" maxlength="1">` elements

> A code is a string of digits, not a quantity. `type="number"` strips leading zeros, accepts `e` and `-`, and adds spin buttons. `inputmode="numeric"` gives the digit keyboard, `pattern` validates, and `one-time-code` lets the OS offer the code from the SMS. Six separate inputs break autofill and paste.

### 11. With this CSS and markup, when does the red border first appear?

```html
<style>
  input:invalid { border: 2px solid red; }
</style>
<input type="email" name="email" required>
```

- [ ] After the user types an invalid address and leaves the field
- [ ] Only after the form is submitted
- [x] Immediately on page load
- [ ] Never, because `:invalid` only applies to `pattern`

> An empty required field is invalid from the start, and `:invalid` reflects current validity regardless of interaction. To show errors only after the user has edited the field or attempted to submit, use `:user-invalid`.

### 12. Which `alt` is right for a company logo that is the only content of a link to the home page?

```html
<a href="/"><img src="acme-logo.svg" alt="???"></a>
```

- [x] `alt="Acme home"`
- [ ] `alt=""`
- [ ] `alt="Logo"`
- [ ] Omit the `alt` attribute

> When an image is the sole content of a link, its `alt` is the link's accessible name, so it should say where the link goes. Empty `alt` would leave a link with no name; "Logo" says nothing useful; a missing `alt` may cause the file name or URL to be read.

### 13. Viewport is 400 CSS px wide with a device pixel ratio of 2. Which file does the browser most likely request?

```html
<img src="p-800.jpg"
     srcset="p-400.jpg 400w, p-800.jpg 800w, p-1600.jpg 1600w"
     sizes="(min-width: 800px) 50vw, 100vw"
     alt="…">
```

- [ ] `p-400.jpg`, because the viewport is 400px wide
- [x] `p-800.jpg`
- [ ] `p-1600.jpg`, because the largest is always chosen on high-density screens
- [ ] `p-800.jpg`, but only because it is in `src`

> The media condition does not match at 400px, so the slot is `100vw` = 400 CSS px. At 2× density the browser wants about 800 device pixels and picks the 800w candidate. `src` is only the fallback for browsers without `srcset` support.

### 14. Which image should get `loading="lazy"`?

- [ ] The hero image at the top of the page
- [ ] The site logo in the header
- [x] Product photos in a grid far below the fold
- [ ] All images, to save as much bandwidth as possible

> Lazy loading defers the fetch until the image nears the viewport, which is ideal for off-screen content. On above-the-fold images it delays the request until after layout and hurts Largest Contentful Paint. The hero should load eagerly, usually with `fetchpriority="high"`.

### 15. What does this code log, assuming the script is in the `<head>` and the `<h1>` is in the `<body>`?

```html
<script>
  console.log(document.querySelector('h1'));
</script>
```

- [ ] The `<h1>` element
- [ ] `undefined`
- [x] `null`
- [ ] It throws a `ReferenceError`

> A classic script without `defer` runs the moment the parser reaches it, before the body has been parsed, so the element does not exist yet and `querySelector` returns `null`. Note that `defer` would not help here, because it only applies to scripts with `src`; `type="module"` would, since inline modules are deferred.

### 16. Two scripts are loaded like this, and `app.js` uses a global defined by `lib.js`. What is the risk?

```html
<script src="/lib.js" async></script>
<script src="/app.js" async></script>
```

- [ ] None; scripts always execute in document order
- [ ] Both block HTML parsing while downloading
- [ ] `async` scripts never run before `DOMContentLoaded`, so the page may appear broken until then
- [x] `app.js` may execute before `lib.js` if it finishes downloading first

> `async` scripts run as soon as each arrives, in no guaranteed order. If `app.js` is smaller or cached, it runs first and fails. Use `defer` (or modules with `import`), which downloads in parallel but executes in document order after parsing.

### 17. What do these lines log?

```html
<li id="item" data-product-id="42" data-in-stock>Mug</li>
```

```js
const el = document.getElementById('item');
console.log(el.dataset.productId + 1);
console.log(Boolean(el.dataset.inStock));
```

- [ ] `43` then `true`
- [x] `"421"` then `false`
- [ ] `"421"` then `true`
- [ ] `undefined` then `false`

> `dataset` values are always strings, so `+ 1` concatenates. A `data-*` attribute with no value yields the empty string, which is falsy even though the attribute is present. Use `Number(el.dataset.productId)` and `'inStock' in el.dataset`.

### 18. What is the difference between opening a `<dialog>` with `showModal()` and with `show()`?

- [ ] `showModal()` centres the dialog; `show()` is identical otherwise
- [ ] `show()` is the modern replacement for `showModal()`
- [x] `showModal()` puts it in the top layer, makes the rest of the page inert, adds a backdrop, and enables closing with Esc; `show()` does none of these
- [ ] `showModal()` requires a `<form method="dialog">` inside

> Only `showModal()` gives modal behaviour: top layer, inert page, `::backdrop`, Esc handling. `show()` (and the `open` attribute) displays a non-modal dialog in normal flow that the user can click and tab away from.

### 19. You need a "More actions" menu that closes when the user clicks elsewhere, and a "Session expired, sign in again" prompt the user must deal with. Which elements fit?

- [ ] `popover` for both
- [ ] `<dialog>` opened with `showModal()` for both
- [x] `popover` for the menu; `<dialog>` with `showModal()` for the prompt
- [ ] `<details>` for the menu; `popover="manual"` for the prompt

> A popover is non-modal with light dismiss: right for menus and other transient UI. A blocking prompt needs the page to be inert and focus contained, which is what a modal dialog provides. A manual popover would leave the rest of the page usable.

### 20. There is no JavaScript on this page. What happens when the user presses the first button, then the second?

```html
<button type="button" commandfor="help" command="show-modal">Help</button>

<dialog id="help">
  <p>Press ? for shortcuts.</p>
  <button type="button" commandfor="help" command="close" value="ok">Got it</button>
</dialog>
```

- [ ] Nothing; `<dialog>` can only be opened by calling `showModal()` from script
- [ ] The dialog opens non-modally, and the second button does nothing without a `<form method="dialog">`
- [ ] The dialog opens as a modal, but the second button fires a `command` event that needs a listener to close it
- [x] The dialog opens as a modal with backdrop and inert page; the second button closes it and sets `returnValue` to `"ok"`

> `command="show-modal"` is the declarative equivalent of `showModal()`, with full modal behaviour, and `command="close"` is the equivalent of `close()`, passing the button's `value` as the dialog's `returnValue`. Only custom commands (prefixed with `--`) rely on a `command` event listener. Invoker commands are Baseline since December 2025, so older browsers need a click-handler fallback.

### 21. The banner below stays visible even though it has the `hidden` attribute. Why?

```html
<style>
  .banner { display: flex; gap: 1rem; }
</style>
<div class="banner" hidden>Your trial has ended.</div>
```

- [ ] `hidden` only works on form controls
- [ ] `hidden` needs a value: `hidden="true"`
- [x] `hidden` is implemented as `display: none` in the browser's stylesheet, and the author's `display: flex` overrides it
- [ ] `hidden` hides the element from screen readers only, not visually

> The attribute's effect comes from a low-priority user-agent style rule, so any author rule that sets `display` on the element wins. The common guard is `[hidden] { display: none !important; }`. `hidden` is boolean (no value needed) and, when it works, hides content from everyone, not just assistive technology.

### 22. A slide-out navigation drawer is closed by moving it off-screen with `transform: translateX(-100%)` and setting `aria-hidden="true"` on it. Keyboard users report that focus "disappears" for several Tab presses. Explain the bug and give the fix.

> The drawer is only moved, not removed from rendering, so its links are still focusable: Tab walks through them while they are off-screen, and the focus indicator is nowhere to be seen. `aria-hidden="true"` makes it worse rather than better: it removes the drawer from the accessibility tree without affecting focus, so a screen reader user lands on controls that are announced as nothing.
>
> The fix is to make the closed drawer non-interactive, not merely invisible. Add the `inert` attribute while it is closed and remove it when it opens: `inert` blocks focus, clicks, and find-in-page, and hides the subtree from assistive technology in one step, so `aria-hidden` is no longer needed. If the slide animation is not required, `hidden` (or `display: none`) does the same and also stops rendering. While the drawer is open as an overlay, the page behind it should in turn be inert, or the drawer should be a `<dialog>` opened with `showModal()`, which does that automatically.

### 23. This table is read by a screen reader as a grid of unrelated values. List what is missing and rewrite it.

```html
<table>
  <tr><td></td><td>Mon</td><td>Tue</td></tr>
  <tr><td>Open</td><td>09:00</td><td>09:00</td></tr>
  <tr><td>Close</td><td>17:00</td><td>20:00</td></tr>
</table>
```

> It has no caption (so no name), and no header cells: every cell is a `<td>`, so nothing tells assistive technology that "Mon" describes a column or "Open" a row.
>
> ```html
> <table>
>   <caption>Opening hours</caption>
>   <thead>
>     <tr>
>       <td></td>
>       <th scope="col">Mon</th>
>       <th scope="col">Tue</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">Open</th>
>       <td><time>09:00</time></td>
>       <td><time>09:00</time></td>
>     </tr>
>     <tr>
>       <th scope="row">Close</th>
>       <td><time>17:00</time></td>
>       <td><time>20:00</time></td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> Now moving to the cell "20:00" announces "Tue, Close, 20:00". The `<time>` elements are optional polish; the caption, `<th>`, and `scope` are the essentials.

### 24. Explain the difference between `alt=""` and leaving the `alt` attribute off, and when an empty `alt` is the right choice.

> `alt=""` is an explicit statement that the image is decorative or redundant: assistive technology skips it entirely. A missing `alt` means the author provided no information, and a screen reader may fall back to announcing the file name or URL, which is noise; it is also a validation error. Empty `alt` is right when the image adds nothing a non-sighted user needs: a decorative flourish, a mood photo, an icon next to text that already says the same thing, or an image whose content is fully given by an adjacent caption or text. It is wrong when the image is the only content of a link or button (the control would have no name) or when the image conveys information not available elsewhere.

### 25. A teammate built this and says "it works when I click it". List the problems and give the fix.

```html
<div class="btn" onclick="save()">Save</div>
```

> The element has no semantics or keyboard support:
>
> - It is not focusable, so keyboard users cannot reach it.
> - It does not respond to Enter or Space.
> - It has no role, so a screen reader announces only the text "Save", not that it is a button.
> - It cannot be disabled natively, does not submit a form, and gets no focus indicator.
>
> Patching it requires `role="button"`, `tabindex="0"`, key handlers for Enter and Space, and manual disabled handling. The fix is one element that does all of that already:
>
> ```html
> <button type="button" class="btn" onclick="save()">Save</button>
> ```
>
> If it submits a form, omit `type="button"` and listen for the form's `submit` event instead of the click.

### 26. Write the HTML for a sign-in form (email and password) that works without JavaScript and cooperates with password managers. Explain each attribute choice.

> ```html
> <form action="/login" method="post">
>   <label for="email">Email</label>
>   <input id="email" name="email" type="email" autocomplete="username" required>
>
>   <label for="password">Password</label>
>   <input id="password" name="password" type="password" autocomplete="current-password" required>
>
>   <button>Sign in</button>
> </form>
> ```
>
> - `method="post"` keeps credentials out of the URL, history, and logs; `action` is where they are sent.
> - Each input has a `name` (so it is submitted), an `id` matched by a `label for` (accessible name and click target).
> - `type="email"` gives the right mobile keyboard and basic syntax validation; `type="password"` masks input.
> - `autocomplete="username"` marks the account identifier even though it is an email address, and `current-password` tells the manager to fill a saved password rather than generate one (that would be `new-password` on a sign-up form).
> - `required` blocks empty submission without script.
> - The `<button>` is a submit button by default, and pressing Enter in either field submits too.
>
> The server must still validate and should respond to a successful POST with a redirect.

### 27. Compare a classic `<script src>` in the head with no attributes, with `defer`, and with `async`: what does each do to HTML parsing, and when does it execute? Which would you use for your application bundle and which for an analytics snippet?

> - **No attribute**: the parser stops when it reaches the tag, waits for the download, runs the script, then resumes. The page is blank for that whole time, and the script cannot see elements that come after it.
> - **`defer`**: the script downloads in parallel while parsing continues. It runs after the document has been fully parsed, just before `DOMContentLoaded`, and deferred scripts run in document order.
> - **`async`**: downloads in parallel, then runs as soon as it arrives, pausing the parser at whatever point it has reached. Order between async scripts is not guaranteed, and it may run before or after the DOM is complete.
>
> Use `defer` (or `type="module"`, which is deferred by default) for application code: it needs the DOM and often depends on other scripts in order. Use `async` for independent third-party scripts such as analytics, which depend on nothing and should not hold up anything.

### 28. Users report the page "jumps" while loading, and Lighthouse reports a poor Largest Contentful Paint for the hero image. Identify the problems in this markup and fix it.

```html
<img src="hero-2400.jpg" loading="lazy" alt="Mountain trail at sunrise">
<h1>Plan your next hike</h1>
```

> Three problems:
>
> 1. No `width` and `height`. The browser cannot reserve space, so the image has zero height until it loads and then pushes the heading down: a layout shift.
> 2. `loading="lazy"` on an above-the-fold image. The browser waits for layout before deciding to fetch it, delaying the LCP element.
> 3. One 2400px file for every device. Phones download far more than they can display.
>
> ```html
> <img
>   src="hero-1200.jpg"
>   srcset="hero-600.jpg 600w, hero-1200.jpg 1200w, hero-2400.jpg 2400w"
>   sizes="100vw"
>   width="2400" height="1350"
>   fetchpriority="high"
>   alt="Mountain trail at sunrise">
> <h1>Plan your next hike</h1>
> ```
>
> `width`/`height` give the aspect ratio (with `height: auto` in CSS it still scales), removing `lazy` restores eager loading, `fetchpriority="high"` tells the browser to fetch it ahead of other images, and `srcset`/`sizes` let each device pick an appropriate file. Serving AVIF or WebP through `<picture>` would cut the bytes further.

### 29. A product page looks perfect in the browser, but when its URL is shared in a chat app the preview shows no title or image. The Open Graph tags are added by client-side JavaScript after the app loads. Explain the cause and the fix.

> Link-preview bots fetch the URL and read the HTML that the server returns; most do not execute JavaScript. Since the `og:` tags are inserted by script, the bot sees a head without them and has nothing to build a card from. The fix is to put the metadata into the server response for each URL: server-side rendering, static generation, or at least a server or edge function that injects the right `<meta property="og:title">`, `og:description`, `og:image` (an absolute URL, roughly 1200×630, not SVG), and `og:url` into the head per route. Verify with `curl -s URL | grep "og:"`, which shows what a bot sees, and then use the platform's preview debugger to refresh its cached copy.

### 30. Why is `allow-scripts allow-same-origin` a dangerous `sandbox` value for an iframe that shows HTML served from your own origin, and what should you do instead?

> A sandbox without `allow-same-origin` forces the framed document into a unique opaque origin, so its scripts cannot touch the parent page, its cookies, or its storage. Adding `allow-same-origin` gives the frame its real origin back. If that origin is the same as the parent's and scripts are allowed, the framed script can access `window.parent.document`, find its own `<iframe>` element, remove the `sandbox` attribute, and reload itself with no restrictions, or simply act on the parent page directly. The sandbox is then decorative. For untrusted HTML, either omit `allow-same-origin` (use `sandbox="allow-scripts"`, possibly with `srcdoc`), or serve the content from a separate origin so that same-origin policy isolates it even with both tokens.
