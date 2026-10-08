# Accessibility: Practice test

### 1. Which of these is an example of a *situational* disability?

- [ ] A user who has been blind since birth
- [ ] A user recovering from wrist surgery who cannot use a mouse for six weeks
- [x] A user holding a sleeping baby who can only use one hand
- [ ] A user with dyslexia

> Situational limitations come from the current environment or circumstances and end when those change. Blindness from birth and dyslexia are permanent; a healing injury is temporary. The three categories matter because the same design decision (here, full one-handed or keyboard operability) serves all of them.

### 2. A contract says the site must "conform to WCAG 2.2 level AA". What does that require?

- [ ] Meeting only the success criteria labelled AA
- [x] Meeting every level A and level AA success criterion
- [ ] Meeting all A, AA, and AAA success criteria
- [ ] Scoring 100 in Lighthouse's accessibility category

> Conformance levels are cumulative: AA means all A criteria plus all AA criteria. AAA is not required and is not expected for whole sites. A Lighthouse score reflects only the automated rules that ran and is not a measure of WCAG conformance.

### 3. What does a screen reader announce when focus lands on this element?

```html
<div class="btn btn-primary" onclick="save()">Save</div>
```

- [ ] "Save, button"
- [ ] "Save, clickable button, press Enter to activate"
- [ ] Nothing, because `<div>` elements are hidden from assistive technology
- [x] It cannot receive keyboard focus at all; in reading mode it is just the text "Save"

> A `<div>` has no implicit role, is not focusable, and has no keyboard behaviour. The class names and the click handler mean nothing to the accessibility tree, so keyboard users can never reach it and screen reader users hear plain text with no hint that it is actionable. A `<button>` provides role, focus, and Enter/Space activation for free.

### 4. Which `tabindex` usage is correct for a heading that should receive focus after a client-side route change?

- [ ] `tabindex="0"`, so it is also in the normal tab order
- [x] `tabindex="-1"`, so it can be focused by script but is skipped when tabbing
- [ ] `tabindex="1"`, so it is first in the tab order
- [ ] No `tabindex`; headings are focusable by default

> `tabindex="-1"` makes an element programmatically focusable without adding a tab stop, which is what you want for a focus management target. `tabindex="0"` would make every user Tab through a non-interactive heading. Positive values create a second, competing tab order and should never be used. Headings are not focusable by default.

### 5. A designer asks you to remove the focus ring that appears when buttons are clicked with a mouse. What is the right CSS?

- [ ] `button:focus { outline: none; }`
- [ ] `* { outline: 0 !important; }`
- [x] Style `button:focus-visible` with a clear outline and leave plain `:focus` unstyled
- [ ] `button { pointer-events: none; }` while the mouse is in use

> `:focus-visible` matches when the browser determines a focus indicator is needed, chiefly keyboard navigation, so the ring appears for keyboard users and not on mouse click. Removing the outline on `:focus` removes it for keyboard users too, which fails WCAG 2.4.7 and makes the page unusable without a pointer.

### 6. What is the accessible name of this button?

```html
<button aria-label="Close">Dismiss notification</button>
```

- [x] "Close"
- [ ] "Dismiss notification"
- [ ] "Close Dismiss notification"
- [ ] "Dismiss notification Close"

> In the name computation, `aria-label` takes precedence over the element's content, so the name is "Close" and the visible text is not announced. This also fails WCAG 2.5.3 Label in Name: a voice control user saying "click Dismiss notification" will not match the control. Names are not concatenated from multiple sources unless `aria-labelledby` lists several IDs.

### 7. What is wrong with this markup?

```html
<a href="/settings" aria-hidden="true">
  <svg>…</svg>
</a>
```

- [ ] Nothing; `aria-hidden` correctly hides the decorative icon
- [ ] `aria-hidden` removes the link from the tab order, so keyboard users cannot reach it
- [x] The link is still focusable but is removed from the accessibility tree, so focus lands on something that announces nothing
- [ ] `aria-hidden` is not allowed on `<a>` elements and will be ignored

> `aria-hidden="true"` removes the element and its descendants from the accessibility tree but does not affect focusability. Keyboard users Tab to the link and a screen reader says nothing useful. The intended fix is to put `aria-hidden="true"` on the `<svg>` and give the link a name, for example `aria-label="Settings"` or visually hidden text.

### 8. Where does `aria-expanded` belong in a disclosure widget?

```html
<button id="toggle">Filters</button>
<div id="panel" hidden>…</div>
```

- [ ] On `#panel`, set to `true` when it is visible
- [x] On `#toggle`, set to `false` when the panel is hidden and `true` when shown
- [ ] On both elements, kept in sync
- [ ] On the nearest common parent of the two

> `aria-expanded` describes the control that does the expanding, because that is the element the user is focused on when they need to know the state. The panel's visibility is conveyed by it being present or absent in the accessibility tree. Putting the attribute on the panel announces nothing when the user is on the button.

### 9. A "Saved" toast is appended to the page like this, but screen readers announce nothing. What is the most likely reason?

```js
const toast = document.createElement('div');
toast.setAttribute('role', 'status');
toast.textContent = 'Changes saved';
document.body.append(toast);
```

- [ ] `role="status"` is not a live region; only `aria-live` works
- [ ] Live regions must use `aria-live="assertive"` to be announced
- [ ] `textContent` changes are not observed; you must use `innerHTML`
- [x] The live region was inserted already containing its message; it needs to exist in the DOM before its content changes

> Browsers and screen readers announce *changes* to a live region they are already tracking. A region inserted together with its content is often not announced. Render an empty `role="status"` container up front and set its text when there is something to say. `role="status"` is a polite live region, and polite is the right level for a save confirmation.

### 10. Which pair fails WCAG 2.2 level AA contrast requirements?

- [ ] 16px regular body text at 4.6:1
- [ ] 24px regular heading text at 3.2:1
- [x] 16px regular placeholder text at 3.2:1
- [ ] A text input border at 3.1:1 against the page background

> Normal-size text needs 4.5:1, and placeholder text is text, so 3.2:1 fails. Large text (24px, or about 18.66px bold) needs only 3:1, so the heading passes. User interface component boundaries need 3:1 under SC 1.4.11, so the input border passes.

### 11. A user with a Windows contrast theme reports that they cannot see keyboard focus on your buttons. What is the cause?

```css
.button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px #1a56db;
}
```

- [x] Forced colours mode removes box shadows, and the outline that would have survived was turned off
- [ ] `:focus-visible` does not match in forced colours mode
- [ ] Forced colours mode disables all focus indicators by design
- [ ] The blue fails contrast against the user's theme background

> In forced colours mode the browser sets `box-shadow` to `none` and replaces colours with the user's palette, so a shadow-only focus ring vanishes. Outlines are kept and recoloured. Keep a real outline, for example `outline: 2px solid transparent` underneath the shadow, which becomes visible when colours are forced. The specific blue is irrelevant because author colours are overridden.

### 12. Which implementation hides content visually but keeps it available to screen readers?

- [ ] `display: none`
- [ ] `visibility: hidden`
- [ ] The `hidden` attribute
- [x] A clip-based "visually hidden" class (1px size, `overflow: hidden`, `clip-path: inset(50%)`, absolute position)

> `display: none`, `visibility: hidden`, and `hidden` remove content from the accessibility tree as well as from view. A visually hidden class keeps the element rendered at a tiny clipped size, so it stays in the tree and is read. Use it for skip link resting states, extra link context, and live region containers.

### 13. A user sets their browser to 400% zoom on a 1280px-wide window. Which WCAG requirement applies, and what must be true?

- [ ] 1.4.4 Resize Text: text must be scalable to 400%
- [x] 1.4.10 Reflow: content must work at 320 CSS pixels wide without scrolling in two dimensions
- [ ] 2.5.8 Target Size: all targets must be at least 44 by 44 pixels
- [ ] 1.4.12 Text Spacing: line height must be at least 4 times the font size

> 1280 divided by 4 is 320 CSS pixels, which is why Reflow is described as the 400% zoom requirement. Content must reflow into a single column without horizontal scrolling, apart from content such as data tables and maps that needs two dimensions. Resize Text requires 200%, and Target Size (Minimum) requires 24 by 24.

### 14. A task board lets users reorder cards by dragging them with a mouse or finger. It also supports reordering with the keyboard (Space to pick up, arrow keys to move). Does it meet WCAG 2.2 SC 2.5.7 Dragging Movements?

- [ ] Yes, because a keyboard alternative exists
- [ ] Yes, because drag and drop is always considered essential
- [x] No; it needs a way to reorder with single pointer actions, such as "Move up" and "Move down" buttons or a "Move to" menu
- [ ] No; drag and drop is prohibited at level AA

> 2.5.7 is about people who use a pointer but cannot perform a press-hold-move gesture, for example with a head pointer, eye tracking, or a tremor. A keyboard alternative satisfies 2.1.1 Keyboard, not this criterion. The fix is a single-pointer alternative that needs only taps or clicks. Dragging is not banned, and it only counts as essential when there is truly no other way to achieve the function.

### 15. This test passes. What does that tell you?

```ts
const results = await new AxeBuilder({ page }).analyze();
expect(results.violations).toEqual([]);
```

- [ ] The page conforms to WCAG 2.2 AA
- [ ] The page is usable with a keyboard and a screen reader
- [x] No automated axe rule detected a failure in the DOM state present when the scan ran
- [ ] Every image on the page has accurate alternative text

> axe checks what is mechanically detectable in the current DOM: missing names, invalid ARIA, measurable contrast, and so on. It cannot judge focus order, keyboard operability of custom widgets, focus management, or whether alt text is accurate, and it does not see states you did not open. Automated checks catch a minority of issues, so a clean scan is a baseline, not conformance.

### 16. A speech-input user says "Click Search" and nothing happens. Which change fixes it best?

```html
<button type="submit" aria-label="Find products">Search</button>
```

- [ ] Add `title="Search"` to the button
- [ ] Add `role="search"` to the button
- [ ] Change the label to `aria-label="Find products button"`
- [x] Remove the `aria-label` so the accessible name is the visible text "Search"

> Voice control software matches spoken words against the accessible name. Here `aria-label` overrides the content, so the name is "Find products" and "Search" matches nothing. This fails SC 2.5.3 Label in Name. Removing the override is the simplest fix; if more context were needed, the name should start with the visible word, for example "Search products". `title` does not change the name when `aria-label` is present, and `role="search"` is a landmark role that would stop the element being a button.

### 17. A site navigation bar has dropdowns of page links. Which ARIA pattern should the dropdowns use?

- [ ] `role="menu"` with `role="menuitem"` on each link
- [x] The disclosure pattern: a `<button aria-expanded>` that shows and hides a list of ordinary links
- [ ] `role="listbox"` with `role="option"` on each link
- [ ] `role="tablist"` with each dropdown as a `tabpanel`

> `role="menu"` is for application-style menus of actions and promises specific keyboard behaviour (arrow keys, type-ahead) and screen reader interaction modes. Site navigation is a set of links, and users expect to Tab through them. A disclosure button toggling a list of links is simpler, matches expectations, and is what the APG recommends for navigation.

### 18. In an editable combobox following the APG pattern, where is DOM focus while the user arrows through the suggestions?

- [ ] On the currently highlighted `option` element
- [ ] On the `listbox` container
- [x] On the input, with `aria-activedescendant` pointing at the highlighted option
- [ ] It alternates between the input and the option on each key press

> Focus stays in the text input so the user can keep typing. The input's `aria-activedescendant` references the `id` of the active option, which tells assistive technology which option to announce, and you style that option as highlighted. Moving real focus into the list would break typing and is the roving-tabindex approach used by other widgets such as tabs.

### 19. Review this form field. Which change matters most for a screen reader user?

```html
<input type="email" placeholder="Email address" class="error">
<span class="error-text">Invalid</span>
```

- [ ] Change `type="email"` to `type="text"` so validation is consistent
- [ ] Add `title="Email address"` to the input
- [ ] Make the error text red and bold
- [x] Add a `<label>` for the input, and connect a specific error message with `aria-describedby` plus `aria-invalid="true"`

> The field has no reliable accessible name (a placeholder is not a label and disappears on input), the error is not associated with the field, and the error state is conveyed only by a class. A real label, `aria-invalid`, and an `aria-describedby` reference to a message that explains what is expected fix all three. Colour and weight alone fail SC 1.4.1, and `title` is a weak last-resort name.

### 20. Explain the "first rule of ARIA" and why adding `role="button"` to a `<div>` is not equivalent to using a `<button>`.

> The first rule says that if a native HTML element or attribute provides the semantics and behaviour you need, use it instead of repurposing another element with ARIA.
>
> ARIA only changes what the accessibility tree reports. `role="button"` makes assistive technology announce "button", but the `<div>` is still not focusable, does not respond to Enter or Space, has no disabled behaviour, does not submit forms, and is not styled by `:disabled`. You would need to add `tabindex="0"`, key handlers for both keys (preventing Space from scrolling), and `aria-disabled` handling yourself. Anything you miss creates a mismatch between what is announced and what works. A `<button>` provides all of this, tested across browsers and assistive technologies.

### 21. A single-page app swaps the main view when a link is clicked. A screen reader user reports that "nothing happens" when they activate navigation links. Explain the cause and how to fix it.

> In a full page load the browser resets focus and the screen reader announces the new page title. In a client-side route change the URL and DOM change silently: focus stays on the clicked link (or drops to `<body>` if that link was removed), nothing is announced, and the user has no indication the view changed.
>
> Fix it by treating the route change like a page load: update `document.title`, then move focus to a sensible target in the new view, usually the `<h1>` with `tabindex="-1"` or the main container, so the new heading is announced and the next Tab starts in the new content. An alternative or addition is announcing the new page name through a polite live region. Check what your router or framework already does, and verify with a screen reader.

### 22. Write the HTML for a modal confirmation dialog using platform features, and list what the browser handles for you that a `<div>`-based modal would need scripted.

> ```html
> <button type="button" id="open">Delete project</button>
>
> <dialog id="confirm" aria-labelledby="confirm-title">
>   <h2 id="confirm-title">Delete this project?</h2>
>   <p>This cannot be undone.</p>
>   <form method="dialog">
>     <button value="cancel" autofocus>Cancel</button>
>     <button value="delete">Delete</button>
>   </form>
> </dialog>
>
> <script>
>   const dialog = document.getElementById('confirm');
>   document.getElementById('open').addEventListener('click', () => dialog.showModal());
> </script>
> ```
>
> With `showModal()` the browser: gives the element the dialog role and modal semantics; renders it in the top layer with a backdrop; makes everything outside it inert, so it cannot be focused, clicked, or reached by a screen reader's cursor; moves focus into the dialog (to the `autofocus` element); closes it on Escape; closes it when a `method="dialog"` form is submitted and sets `returnValue`; and restores focus to the previously focused element on close. A `<div role="dialog" aria-modal="true">` needs every one of those implemented by hand, typically with `inert` on the rest of the page.

### 23. You are asked to make a custom tab component accessible. Describe the roles, states, and keyboard behaviour it needs.

> Roles and relationships: a container with `role="tablist"` (named with `aria-label` or `aria-labelledby`), each tab a `<button role="tab">` with `aria-controls` pointing at its panel, and each panel `role="tabpanel"` with `aria-labelledby` pointing at its tab.
>
> States: the active tab has `aria-selected="true"` and the others `false`. Only the active panel is shown; the others are `hidden`.
>
> Keyboard: the tab list is a single tab stop using roving tabindex, so the selected tab has `tabindex="0"` and the rest `tabindex="-1"`. Left and Right arrows move focus between tabs (wrapping), Home and End go to the first and last. Tab moves from the tab list into the active panel (give the panel `tabindex="0"` if it has no focusable content). Tabs either activate automatically when focused, which is fine when panels are already rendered, or manually with Enter or Space when showing a panel is expensive.
>
> Finally, test it with a screen reader: it should announce something like "Details, tab, selected, 1 of 3".

### 24. A custom dropdown works well with a desktop keyboard and NVDA: focus stays on the trigger, arrow keys move through the options, Enter selects. A TalkBack user on Android reports they cannot choose an option. Explain why, and how you would fix and test it.

> Touch screen readers have no Tab or arrow keys. The user swipes to move an accessibility focus through the elements in the accessibility tree and double-taps to activate, which the page receives as a `click`. A widget driven entirely by `keydown` handlers gets no key events, so the options never become active. If the options are only tracked with `aria-activedescendant`, or are not individually exposed and clickable, the user cannot reach or select them. The page's own touch gestures do not help either, because the screen reader consumes the touches.
>
> Fix: make every option a real element in the tree with the right role and name, reachable by swiping, that selects on `click`; make the trigger toggle on `click`; when the list is open, make sure it follows the trigger in DOM order (or move focus into it) and that the rest of the page is not in the way. Or use a native `<select>`, which the platform handles.
>
> Test on real devices with TalkBack in Chrome and VoiceOver in Safari on iOS: swipe to the control, double-tap to open, swipe through options, double-tap to select, and listen for the new value being announced. Use `chrome://inspect` or Safari's Web Inspector to inspect the page from a desktop while the screen reader runs.

### 25. A page scores 100 for accessibility in Lighthouse. List at least four significant accessibility problems it could still have, and how you would find each.

> Lighthouse runs a subset of axe rules, which only detect mechanically checkable failures. A page with a perfect score can still have:
>
> - Custom controls that do not work with the keyboard, or a keyboard trap. Found with a keyboard-only pass.
> - An illogical focus order or invisible focus indicator on some components. Found by tabbing through the page, or with Firefox's tabbing-order overlay.
> - No focus management on route changes, dialogs, or deletions. Found by watching `document.activeElement` during those interactions.
> - Alt text that is present but wrong or unhelpful, vague link text, or headings that do not describe their sections. Found by reading the content and listening with a screen reader.
> - Dynamic updates (results, errors, toasts) that are never announced. Found with a screen reader.
> - Problems only in states the scan did not see: an open menu, an error state, a dark theme.
> - Reflow failures at 320px or 400% zoom, and motion that ignores `prefers-reduced-motion`. Found with zoom, device mode, and the Rendering tab.
> - Contrast failures over images or gradients, which automation flags only as "needs review".

### 26. Find the accessibility problems in this card and rewrite it.

```html
<div class="card" onclick="location.href='/posts/42'">
  <img src="cover.jpg">
  <div class="title" style="font-size: 24px; font-weight: bold">Reducing bundle size</div>
  <span class="tag" style="color: #aaa; background: #fff">Performance</span>
  <a href="/posts/42">Read more</a>
</div>
```

> Problems: the clickable `<div>` is not focusable or keyboard operable and has no role; the image has no `alt` attribute, so its file name may be announced; the title is styled text and not a heading, so it is missing from the heading outline; the tag text at `#aaa` on white is about 2.3:1 and fails the 4.5:1 contrast requirement; and "Read more" is ambiguous out of context and repeats on every card.
>
> ```html
> <article class="card">
>   <img src="cover.jpg" alt="">
>   <h3><a href="/posts/42">Reducing bundle size</a></h3>
>   <p class="tag">Performance</p>
> </article>
> ```
>
> ```css
> .card { position: relative; }
> .card h3 a::after { content: ''; position: absolute; inset: 0; } /* whole card clickable */
> .card:focus-within { outline: 3px solid #1a56db; outline-offset: 2px; }
> .tag { color: #595959; } /* about 7:1 on white */
> ```
>
> The heading contains one real link whose text describes the destination, and a pseudo-element stretches its hit area over the card, so there is a single tab stop with a meaningful name. The cover image is decorative here, so it has empty alt text; if it conveyed information it would need a description. The heading level should fit the page outline.

### 27. Explain the difference between `aria-label`, `aria-labelledby`, and `aria-describedby`, and give a suitable use for each.

> `aria-labelledby` and `aria-label` both set the accessible **name**, the primary identifier announced with the role. `aria-labelledby` takes one or more element IDs and uses their text, so it reuses visible text, can combine several elements, and has the highest precedence in the name computation. Use it to name a dialog from its heading, or a "Remove" button from its own label plus the item's title.
>
> `aria-label` supplies the name as a string in the attribute. Use it when no visible text exists, such as an icon-only close button or to distinguish two `<nav>` landmarks. It overrides the element's content, is invisible to sighted users, is often not translated, and has no effect on elements without a role.
>
> `aria-describedby` sets the accessible **description**: supplementary text announced after the name and role, and sometimes skipped depending on user settings. Use it to attach hint text and error messages to form fields. It must not carry information essential to identifying the control.

### 28. You have one day to audit a web app before a release. Describe your approach and how you would report what you find.

> Scope it: target WCAG 2.2 AA, and pick the pages and the one or two flows that matter most (sign in, the core task, checkout), covering each distinct template.
>
> Test in layers, cheapest first. Run axe on every page and important state and note the violations. Do a keyboard-only pass of each flow, checking reachability, order, visible focus, traps, overlays, and where focus goes after dynamic changes. Do a screen reader pass (NVDA with Firefox or Chrome, or VoiceOver with Safari) checking names, roles, states, headings and landmarks, and announcements of errors and updates. Check 200% and 400% zoom, a 320px viewport, contrast, reduced motion, and forced colours. Read headings, link text, alt text, and error messages for clarity.
>
> Report each issue with: a short title, location, the WCAG success criterion, who is affected, steps to reproduce with actual and expected results, severity by user impact (critical blocks a task; serious, moderate, minor), and a concrete fix. Group repeated problems by shared component. Lead the report with a summary of blockers that should stop the release, and state the limits: which pages and assistive technologies were covered, and that a one-day sample is not a conformance certification.
