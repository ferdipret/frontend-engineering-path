# Accessibility: Guide

## Toolkit

### DevTools and tooling

Most accessibility debugging happens in tools you already have open.

- **Chrome DevTools, Elements panel, Accessibility tab.** Select a node to see its computed role, name, description, and states, plus which attribute or content supplied the name. Tick "Enable full-page accessibility tree" (then reload DevTools) to get a toggle in the Elements panel that swaps the DOM view for the accessibility tree.
- **Chrome DevTools colour picker.** Click a colour swatch in the Styles pane to see the contrast ratio against the background, with AA and AAA threshold lines drawn on the picker. Hovering an element with the inspect tool shows contrast, name, role, and keyboard-focusability in the tooltip.
- **Rendering tab** (Command Menu, "Show Rendering"). Emulate `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`, and vision deficiencies such as blurred vision and the common forms of colour blindness.
- **Firefox Accessibility Inspector.** Its "Check for issues" menu audits contrast, keyboard, and text labels, and "Show Tabbing Order" overlays numbered focus stops on the page, which no other browser tool does as well.
- **axe DevTools** browser extension and **Lighthouse** run the axe-core rule engine against the rendered page. **Accessibility Insights for Web** adds a guided manual assessment and a tab-stop visualiser.
- **Console.** Add a live expression for `document.activeElement` to watch focus move as you press Tab. `getComputedStyle(el).outlineStyle` settles arguments about whether a focus ring exists.
- **Linting.** `eslint-plugin-jsx-a11y` (or the equivalent for your framework) flags missing alt text, unlabeled controls, and click handlers on non-interactive elements as you type.
- **Screen readers and voice control.** NVDA (free, Windows) with Firefox or Chrome, VoiceOver (built in, macOS and iOS) with Safari, TalkBack on Android, and the built-in Voice Control (Apple) or Voice Access (Windows, Android) for speech input. NVDA's Speech Viewer (NVDA menu, Tools) shows spoken output as text so you can test without audio and paste results into bug reports.
- **Zoom and reflow.** Device mode set to 320 CSS pixels wide, and browser zoom at 200% and 400%.

### Testing and verifying your work

No single method is enough. Use a layered routine and do the cheap layers constantly.

1. **Automated scan** on every page and significant state (menus open, errors showing, dialogs open). axe or Lighthouse takes seconds. Fix everything it reports; a clean scan means the easy failures are gone, not that the page is accessible.
2. **Keyboard pass.** Put the mouse away. Tab through the whole page: every interactive element reachable, in a sensible order, with a clearly visible focus indicator, operable with Enter, Space, arrows, and Escape as appropriate, and no traps. Complete the core task end to end.
3. **Screen reader pass.** With NVDA or VoiceOver, navigate by headings and landmarks first, then complete the same task. Listen for: every control announcing a name, role, and state; state changes announced when they happen; nothing announced that is hidden; nothing visible that is silent.
4. **Visual checks.** Zoom to 200% and 400%, set a 320px viewport, enable reduced motion, emulate forced colours, and check contrast for text, focus indicators, and control boundaries.
5. **Content check.** Read headings as an outline, read link text out of context, and review alt text and error messages.

"Done" for a component means it meets the relevant WCAG 2.2 AA criteria, matches the expected keyboard interaction for its pattern (the ARIA Authoring Practices Guide is the reference), and you have personally operated it with a keyboard and at least one screen reader. Record what you tested with: browser, assistive technology, and versions.

Lock in the result with tests. Query by role and accessible name in component tests (`getByRole('button', { name: 'Save' })`), which fails when semantics regress, and add an axe scan to end-to-end tests. Automation guards against regressions; it does not replace the manual passes, and nothing replaces testing with disabled users when you can arrange it.

### Tricks and gotchas

- The accessible name is what matters, not the visible text. An icon button with no name is announced as just "button". Check the computed name in DevTools instead of guessing.
- `aria-label` is ignored on elements with no role (`<div>`, `<span>`) and is not translated by most browser translation tools. Prefer visible text, or `aria-labelledby` pointing at visible text.
- `display: none` and `visibility: hidden` remove content for everyone. `opacity: 0` and off-screen positioning hide it visually but leave it focusable and announced. Know which one you intend.
- A visually hidden utility class (clip-based, not `display: none`) is the correct way to provide text only to screen readers.
- `outline: none` without a replacement is the most common keyboard failure. Style `:focus-visible` instead.
- Box shadows and background colours disappear in forced colours mode. Keep a real `outline` (it can be `2px solid transparent` under a box-shadow design) so Windows High Contrast users still get a focus ring.
- Positive `tabindex` values create a separate, earlier tab order and always end badly. Use only `0` and `-1`.
- A `<div>` with `role="button"` still needs `tabindex="0"`, Enter and Space handlers, and disabled handling. A `<button>` has all of that already.
- `aria-hidden="true"` on a focusable element, or on an ancestor of one, produces a focus stop that announces nothing. Use `inert` or `hidden` when content should be out of reach.
- A live region must be in the DOM, empty, before you put the message in it. Inserting a populated region often announces nothing.
- CSS `order`, `flex-direction: row-reverse`, and grid placement change visual order but not DOM order, so focus and reading order can diverge from what sighted users see.
- `placeholder` is not a label: it vanishes on input, usually fails contrast, and is not reliably announced as the name.
- Safari on macOS does not Tab to links by default. Enable "Press Tab to highlight each item on a webpage" in Safari settings before concluding your tab order is broken.
- Screen readers differ. A fix for one can break another, so retest in at least two when you add ARIA.

### Official references

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): the normative standard; the success criteria are the testable requirements.
- [How to Meet WCAG (Quick Reference)](https://www.w3.org/WAI/WCAG22/quickref/): filterable list of every criterion with sufficient techniques and failures.
- [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/): the intent, examples, and edge cases behind each criterion.
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/): expected roles, states, and keyboard behaviour for common widgets, with working examples.
- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/): the specification of every role, state, and property.
- [ARIA in HTML](https://www.w3.org/TR/html-aria/): which roles and attributes are allowed on which HTML elements, and each element's implicit role.
- [Accessible Name and Description Computation 1.2](https://www.w3.org/TR/accname-1.2/): the algorithm browsers use to compute names.
- [MDN: Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility): practical documentation for ARIA attributes and HTML semantics.
- [web.dev: Learn Accessibility](https://web.dev/learn/accessibility): a structured course covering the whole area.
- [WAI Tutorials](https://www.w3.org/WAI/tutorials/): W3C's worked guidance on images, forms, tables, menus, and page structure.
- [axe-core rule descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md): what each automated rule checks and which WCAG criterion it maps to.

## Skills

### Who it's for

Accessibility is about whether people with disabilities can use what you build, and the group is far larger and more varied than "blind people using screen readers". The World Health Organization estimates around one in six people worldwide has a significant disability. Think in four functional areas, each with its own technology and its own failure modes:

- **Vision**: blindness (screen readers, braille displays), low vision (zoom, magnifiers, high contrast, large text), colour vision deficiency (around 1 in 12 men).
- **Hearing**: deaf and hard-of-hearing users rely on captions and transcripts, and may have a sign language as their first language.
- **Motor**: tremor, paralysis, repetitive strain, or missing limbs mean keyboard-only use, switch devices, voice control, eye tracking, and a need for large targets and no time pressure.
- **Cognitive and neurological**: dyslexia, ADHD, autism, memory impairments, anxiety, seizure and vestibular disorders. These users need clear language, consistency, forgiving forms, and control over motion.

The second axis is duration. A disability can be **permanent** (one arm), **temporary** (a broken arm), or **situational** (holding a baby). Deaf, an ear infection, a loud bar. Blind, dilated pupils after an eye exam, a phone in bright sunlight. Situational examples are not there to trivialise disability; they show that the same design decision helps a much wider population, and that everyone moves in and out of these groups, especially with age.

The practical consequence is that you cannot design for one "disabled user". A carousel that is perfectly announced to a screen reader can still be unusable for someone with a tremor or a vestibular disorder. When you review a feature, walk the four areas in turn and ask what breaks for each.

**Try it:** Use a site you know well for ten minutes in each of these conditions: keyboard only, browser zoom at 400%, sound off on a video, and with DevTools emulating blurred vision. Write down the first thing that blocked you in each.

**Resources**
- [W3C WAI: How People with Disabilities Use the Web](https://www.w3.org/WAI/people-use-web/)
- [W3C WAI: Diverse Abilities and Barriers](https://www.w3.org/WAI/people-use-web/abilities-barriers/)
- [web.dev: What is digital accessibility, and why does it matter?](https://web.dev/learn/accessibility/why)

### WCAG

The Web Content Accessibility Guidelines are the W3C standard that almost every law, contract, and audit refers to. The current version is WCAG 2.2 (a W3C Recommendation since October 2023, and also published as ISO/IEC 40500:2025). It is organised under four principles, POUR:

- **Perceivable**: users can perceive the content (text alternatives, captions, contrast, reflow).
- **Operable**: users can operate the interface (keyboard, enough time, no seizure triggers, navigable, target size).
- **Understandable**: content and behaviour are understandable (readable, predictable, input assistance).
- **Robust**: content works with current and future user agents and assistive technology (name, role, value; status messages).

Under the principles are 13 guidelines and 86 testable **success criteria**, each with a level. **A** (31 criteria) is the floor: without it some users are completely blocked. **AA** (24 more) is the standard target named in legislation and contracts. **AAA** (31 more) is a higher bar that is not expected for whole sites, though individual AAA criteria are often worth meeting. Conformance at a level means meeting every criterion at that level and below, for the complete page and complete processes.

Things people get wrong:

- The criteria are normative; the *techniques* are not. A technique is one known way to pass, not a requirement.
- WCAG is technology-agnostic and written as testable statements, so it is terse. Read the "Understanding" document for a criterion before arguing about it.
- 2.2 is backwards compatible with 2.1 and 2.0: it added nine criteria and removed one (see WCAG 2.2 additions), so content that meets 2.2 also meets the earlier versions.
- Meeting AA is a minimum for usability, not proof of it.
- WCAG 3.0 is a working draft with a different structure. It is years from being a standard; do not build to it.

**Try it:** Open the Quick Reference, filter to level A and AA, and pick five criteria you have never read. For each, read the Understanding page and find one place in your own project where it applies.

**Resources**
- [W3C WAI: WCAG 2 Overview](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [W3C WAI: What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [Understanding Conformance](https://www.w3.org/WAI/WCAG22/Understanding/conformance)

### Legal context

You are not a lawyer and do not need to be, but you should know that web accessibility is a legal requirement in most markets and roughly what the law points to. In nearly every case the technical yardstick is WCAG at level AA.

- **United States.** The Americans with Disabilities Act predates the web, but courts and the Department of Justice treat websites of businesses open to the public (Title III) as covered, and thousands of lawsuits are filed each year. For state and local government (Title II) the DOJ's 2024 rule explicitly requires WCAG 2.1 AA for web content and mobile apps; in April 2026 the compliance dates were pushed back a year, to April 2027 for larger entities and April 2028 for smaller ones. Section 508 covers federal agencies and what they buy.
- **European Union.** The European Accessibility Act (Directive 2019/882) has applied since 28 June 2025 to products and services sold to EU consumers, including e-commerce, banking, e-books, and transport ticketing, regardless of where the company is based. Microenterprises providing services are exempt. The harmonised standard is EN 301 549, which incorporates WCAG. The separate Web Accessibility Directive covers public sector sites.
- **Elsewhere.** The UK Equality Act and public sector regulations, Canada's ACA and Ontario's AODA, Australia's Disability Discrimination Act, and many more. W3C maintains a list by country.

What this means for an engineer:

- "We'll add accessibility later" is a liability decision, not only a quality one. Raise it as such.
- Procurement often requires a conformance report (a VPAT/ACR). The claims in it are yours to make true.
- Overlay widgets that promise instant compliance do not fix the underlying code and have not protected companies from lawsuits.
- Laws lag the standard; build to WCAG 2.2 AA and you satisfy rules that cite 2.0 or 2.1.

Details and deadlines change, so check the primary source for your jurisdiction and involve legal counsel for actual compliance questions.

**Try it:** Find which accessibility law applies to a product you work on or use, which WCAG version and level it references, and whether the organisation publishes an accessibility statement. Summarise it in five sentences.

**Resources**
- [W3C WAI: Web Accessibility Laws and Policies](https://www.w3.org/WAI/policies/)
- [ADA.gov: Fact sheet on the web and mobile app accessibility rule](https://www.ada.gov/resources/2024-03-08-web-rule/)
- [European Commission: European Accessibility Act](https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/european-accessibility-act-eaa_en)

### The accessibility tree

Assistive technology does not read your DOM or your pixels. The browser builds a second tree, derived from the DOM and CSS, and exposes it through the operating system's accessibility API (UI Automation on Windows, NSAccessibility on macOS, and so on). Screen readers, voice control, and switch software talk to that API.

Each node in the tree has four kinds of information:

- **Role**: what it is (`button`, `link`, `heading`, `textbox`, `navigation`).
- **Name**: what it is called ("Add to basket").
- **State and properties**: `expanded`, `checked`, `disabled`, `required`, heading level, current value.
- **Description** (optional): extra help text.

Native HTML supplies these for free. `<button>Save</button>` yields role `button`, name "Save", focusable, activatable. `<div class="btn">Save</div>` yields a generic node containing text: nothing tells assistive technology it can be pressed.

What is in the tree differs from the DOM. Elements hidden with `display: none`, `visibility: hidden`, `hidden`, or `inert` are removed, as is anything under `aria-hidden="true"`. Purely presentational wrappers are pruned or flattened. CSS matters too: `display: contents` and `list-style: none` have historically altered semantics in some browsers, and generated content from `::before` is included in names.

ARIA attributes change only this tree. `role="button"` changes how the node is announced; it adds no focusability, keyboard behaviour, or click handling. That is the root of most ARIA bugs: the tree says one thing and the behaviour says another.

Voice control makes the tree's importance concrete: a user says "click Add to basket", and the software finds the node whose role is clickable and whose name matches. No name, or a name that differs from the visible label, and the command fails.

**Try it:** In Chrome DevTools enable the full-page accessibility tree and switch to it on a page you built. Find three elements whose role is `generic` but which users interact with, and one with an empty or unhelpful name. Compare with the same page in Firefox's Accessibility Inspector.

**Resources**
- [web.dev: The accessibility tree](https://web.dev/articles/the-accessibility-tree)
- [MDN: Accessibility tree](https://developer.mozilla.org/en-US/docs/Glossary/Accessibility_tree)
- [Chrome for Developers: Full accessibility tree in Chrome DevTools](https://developer.chrome.com/blog/full-accessibility-tree)

### Semantic HTML first

Native elements carry role, name computation, states, focusability, and keyboard behaviour that have been implemented and tested across browsers and assistive technologies for decades. Choosing the right element is the single highest-leverage accessibility decision, and it costs nothing.

Compare what you must rebuild if you start from a `<div>`:

```html
<!-- Everything built in -->
<button type="button" disabled>Save</button>

<!-- Everything by hand, and still worse -->
<div role="button" tabindex="0" aria-disabled="true"
     onclick="save()" onkeydown="/* Enter and Space, prevent scroll, ignore when disabled */">
  Save
</div>
```

The element choices that matter most:

- **Actions vs navigation.** `<button>` does something on the page; `<a href>` goes somewhere. A link without `href` is not focusable. Screen reader users list links and buttons separately, so the wrong choice misleads them.
- **Landmarks.** `<header>`, `<nav>`, `<main>` (one per page), `<aside>`, `<footer>`, and `<section>` with a label. Screen reader users jump between these.
- **Headings.** `<h1>` to `<h6>` in a logical outline with no skipped levels. Headings are the most used navigation method among screen reader users. Choose the level by structure, never by font size.
- **Lists and tables.** `<ul>`/`<ol>` announce item counts. Data tables need `<th>` with `scope` and a `<caption>`. Do not use tables for layout.
- **Forms.** `<label>`, `<fieldset>`/`<legend>`, the right `type` and `autocomplete`, and real `<select>`, checkbox, and radio inputs.
- **Disclosure and dialogs.** `<details>`/`<summary>` and `<dialog>` give you correct behaviour without scripting.

Common mistakes: clickable `<div>`s and `<span>`s, headings chosen for size, `<a>` with a click handler and no `href`, several `<main>` elements, and using `<br>` or bold text in place of lists and headings. Styling is never a reason to avoid the right element; every native element can be restyled.

**Try it:** Take a component you built from `<div>`s. Rebuild it with native elements only, no ARIA, then compare both versions in the accessibility tree and by tabbing through them. Count the lines of JavaScript you could delete.

**Resources**
- [web.dev: Content structure](https://web.dev/learn/accessibility/structure)
- [MDN: HTML, a good basis for accessibility](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML)
- [W3C: ARIA in HTML](https://www.w3.org/TR/html-aria/)

### Keyboard operability

Every function must be operable with a keyboard alone (WCAG 2.1.1), and the user must be able to move focus away from anything they can move it into (2.1.2, no keyboard trap). Keyboard support is the foundation for screen readers, switch devices, voice control, and many other input methods, which all drive the page through the same focus and activation model.

The baseline keys users expect:

| Key | Action |
| --- | --- |
| Tab / Shift+Tab | Move to the next / previous focusable element |
| Enter | Activate links and buttons, submit forms |
| Space | Activate buttons, toggle checkboxes, open selects |
| Arrow keys | Move within a composite widget: radio group, tabs, menu, listbox, slider |
| Escape | Close a dialog, menu, or popover |

Native controls implement all of this. Custom ones need it written:

```js
el.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault(); // stop Space from scrolling the page
    activate();
  }
});
```

Where things usually break:

- Click handlers on non-focusable elements (`<div>`, `<img>`, table rows).
- Functionality available only on hover: tooltips, menus that open on `mouseenter`, row actions that appear on hover. Anything shown on hover must also show on focus.
- Drag-and-drop, sliders, and canvas interactions with no keyboard alternative. They need a single-pointer alternative as well (see WCAG 2.2 additions).
- Scrollable regions that cannot be focused. A scroll container with no focusable content needs `tabindex="0"` plus a name and role so keyboard users can scroll it.
- Custom widgets that make every item a tab stop. A composite widget should be one tab stop with arrow keys inside (roving `tabindex`).
- Single-key shortcuts without a way to turn them off or remap them (2.1.4), which misfire for voice control users.

**Try it:** Unplug or ignore your mouse and complete the main flow of an app you built: navigate, open a menu, fill a form, submit, dismiss a dialog. List every point where you got stuck or lost track of focus.

**Resources**
- [Understanding SC 2.1.1: Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
- [ARIA APG: Developing a keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [WebAIM: Keyboard accessibility](https://webaim.org/techniques/keyboard/)

### Focus order

The tab sequence follows DOM order. If the DOM order matches the visual and logical order, focus order is correct for free (WCAG 2.4.3). Problems appear when CSS rearranges things: `order` in flex and grid, `flex-direction: row-reverse`, grid placement, absolute positioning, and floats all change where things appear without changing where they are in the DOM. The fix is to reorder the DOM, not to patch with `tabindex`.

`tabindex` has three meaningful settings:

- **`tabindex="0"`** puts an element in the tab sequence at its DOM position. Use it only on custom interactive widgets that are not natively focusable.
- **`tabindex="-1"`** makes an element focusable by script (`el.focus()`) or by click, but skips it when tabbing. Use it for focus management targets (headings, containers, dialog content) and for the non-active items in a roving-tabindex widget.
- **Positive values** jump the element ahead of everything with `0` or no `tabindex`, ordered by value. One positive value creates two competing orders, and every later change has to maintain both. Never use them.

```html
<h1 id="page-title" tabindex="-1">Order confirmed</h1>
<div role="tablist">
  <button role="tab" aria-selected="true" tabindex="0">Details</button>
  <button role="tab" aria-selected="false" tabindex="-1">Reviews</button>
</div>
```

Other points:

- Do not put `tabindex="0"` on headings, paragraphs, or other static content "so screen readers can reach it". Screen readers have their own reading cursor; extra tab stops just slow keyboard users down.
- Off-screen content that is merely positioned away or transparent (a closed drawer, a hidden slide) remains in the tab order. Use `hidden`, `display: none`, or `inert`.
- Content injected at the end of `<body>` (toasts, popovers) is at the end of the tab order, far from its trigger. Move focus deliberately or render it adjacent to the trigger; the Popover API handles focus navigation order for popovers it controls.

**Try it:** In Firefox's Accessibility Inspector enable "Show Tabbing Order" on a page that uses CSS grid or flex reordering. Find any place where the numbers jump around visually and fix it by changing the DOM order.

**Resources**
- [MDN: tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex)
- [Understanding SC 2.4.3: Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)
- [web.dev: Focus](https://web.dev/learn/accessibility/focus)

### Visible focus

Keyboard users need to see where they are at all times (WCAG 2.4.7). The focus indicator is their cursor. Removing it, usually with `outline: none` to satisfy a design review, makes a site unusable for them.

`:focus` matches whenever an element has focus, including after a mouse click, which is why designers object to rings on clicked buttons. `:focus-visible` matches only when the browser judges an indicator is needed: keyboard navigation, and always for text inputs. Browsers' default styles already use it, so the right approach is to restyle it, never to remove it.

```css
:focus-visible {
  outline: 3px solid var(--focus-ring, #1a56db);
  outline-offset: 2px;
}

/* Only if you support very old browsers: remove the ring for mouse focus, keep it otherwise */
:focus:not(:focus-visible) {
  outline: none;
}
```

What "obvious" means in practice:

- **Thick enough and contrasting.** Aim for at least 2 CSS pixels, with 3:1 contrast between the focused and unfocused states and against adjacent colours. WCAG 2.4.13 Focus Appearance (AAA) defines this precisely and is a good target.
- **Works on every background.** A single-colour ring disappears somewhere. A two-colour ring (dark outline plus a light `box-shadow`, or the reverse) is visible on anything.
- **Use `outline`, not only `box-shadow` or `border`.** Outlines do not affect layout, follow `border-radius` in current browsers, and survive forced colours mode, where shadows are dropped (see Forced colours mode).
- **Not clipped.** `overflow: hidden` on a parent cuts off outlines; `outline-offset` with a negative value draws inside.
- **Not covered.** WCAG 2.4.11 Focus Not Obscured (AA) requires the focused element not be entirely hidden by sticky headers, cookie banners, or chat widgets. `scroll-padding-top` on the scroll container fixes most sticky-header cases.

For custom widgets where focus is on a container but an inner item is active (`aria-activedescendant`), style the active item so the visual indicator follows the logical one. `:focus-within` is useful for highlighting a whole group.

**Try it:** Tab through your project and screenshot the focus indicator on five different components. Then enable forced colours emulation in the DevTools Rendering tab and repeat. Replace every indicator that is faint, clipped, or missing with a consistent `:focus-visible` style.

**Resources**
- [MDN: :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
- [Understanding SC 2.4.7: Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- [Understanding SC 2.4.11: Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)

### Focus management

On a traditional page load the browser resets focus and the screen reader announces the new page. In a JavaScript-driven interface you change the content yourself, so you also have to decide where focus goes. If you do nothing, focus stays on an element that may no longer be relevant, or falls back to `<body>` when the focused element is removed, and the keyboard user starts again from the top.

The rule: when an action removes or replaces the content containing focus, or opens new content the user must deal with, move focus on purpose to the most useful place.

- **Route changes in a single-page app.** Update `document.title`, then move focus to the new view's `<h1>` (with `tabindex="-1"`) or its main container. This both announces the new page and puts the next Tab at the start of the content. Some frameworks announce route changes for you; verify what yours does.
- **Dialogs.** On open, focus moves inside. On close, focus returns to the element that opened it. `<dialog>` with `showModal()` does both.
- **Deletions.** After removing an item, focus the next item, the previous one if it was last, or the list's heading or an "empty" message if none remain.
- **Revealed content.** After "Load more", focus the first new item. After expanding inline content, focus usually stays on the toggle.
- **Errors.** After a failed submit, focus the error summary or the first invalid field.

```js
function focusHeading() {
  const heading = document.querySelector('main h1');
  heading?.setAttribute('tabindex', '-1');
  heading?.focus();
}
```

Mistakes to avoid: moving focus when the user did not cause a change (stealing focus for a toast or a live update; use a live region instead); focusing an element before it is rendered or while it is still `display: none`; using the `autofocus` attribute on page load in the middle of a long page; and forgetting `{ preventScroll: true }` when you manage scroll position separately. Do not move focus on every state change; staying put is correct for most in-place updates.

**Try it:** In a small SPA, add a live expression for `document.activeElement` in the Console. Navigate between routes, open and close a dialog, and delete a list item. Wherever the expression shows `body`, add deliberate focus handling.

**Resources**
- [web.dev: JavaScript and accessibility](https://web.dev/learn/accessibility/javascript)
- [MDN: HTMLElement.focus()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)
- [Gatsby: What we learned from user testing of accessible client-side routing techniques](https://www.gatsbyjs.com/blog/2019-07-11-user-testing-accessible-client-routing/)

### Focus trapping

A modal dialog demands attention: the page behind it must be unavailable until it is dismissed. That means Tab must not escape into the background, screen reader reading cursors must not wander there, and pointer clicks must not reach it. A visual overlay alone does none of this.

The platform now provides it. `<dialog>` opened with `showModal()`:

- renders in the top layer above everything, with a `::backdrop`;
- makes the rest of the document inert, so it is unfocusable, unclickable, and hidden from assistive technology;
- moves focus into the dialog (to the first focusable element, or the one marked `autofocus`);
- closes on Escape and returns focus to the previously focused element.

```html
<button type="button" id="open">Delete account</button>

<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Delete your account?</h2>
  <p>This cannot be undone.</p>
  <form method="dialog">
    <button value="cancel" autofocus>Cancel</button>
    <button value="delete">Delete</button>
  </form>
</dialog>

<script>
  const dialog = document.getElementById('confirm');
  document.getElementById('open').addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('close', () => console.log(dialog.returnValue));
</script>
```

Note `dialog.show()` and the bare `open` attribute create a *non-modal* dialog with no inertness or trapping.

When you cannot use `<dialog>`, for example a full-screen drawer in an existing component library, apply the `inert` attribute to the sibling content outside the modal. `inert` removes a subtree from the tab order, from pointer events, and from the accessibility tree, which is exactly what hand-written "focus trap" loops try to approximate by intercepting Tab on the first and last elements. Those loops do not stop a screen reader's virtual cursor and break when content changes.

Details to get right: give the dialog an accessible name; put initial focus on the least destructive action, or on the heading or dialog itself for long content; always provide a visible close button; and make sure nested modals restore focus in order. The `closedby` attribute (for light dismiss) and `command`/`commandfor` buttons that open dialogs without JavaScript are newer; check current browser support on MDN before relying on them.

**Try it:** Build the dialog above. Verify with the keyboard that Tab cycles only inside it, Escape closes it, and focus returns to the trigger. Then open it with `show()` instead and observe what is lost. Finally inspect the background in the accessibility tree while the modal is open.

**Resources**
- [MDN: The dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
- [MDN: inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)
- [ARIA APG: Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

### Skip links

A keyboard user arriving on a page should not have to press Tab through a logo, a search field, and forty navigation links on every page before reaching the content. WCAG 2.4.1 Bypass Blocks requires a way past repeated content. Landmarks and headings satisfy it for screen reader users, who can jump by region; a skip link is what serves sighted keyboard users, switch users, and people using screen magnification.

A skip link is an ordinary in-page link, placed as the first focusable element, usually hidden until focused:

```html
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <header>…</header>
  <main id="main" tabindex="-1">…</main>
</body>
```

```css
.skip-link {
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-start: 0.5rem;
  transform: translateY(-200%);
}
.skip-link:focus {
  transform: translateY(0);
}
```

Details that decide whether it works:

- **Hide it off-screen, not with `display: none` or `visibility: hidden`**, which would remove it from the tab order. It must become clearly visible when focused, with good contrast and above any sticky header (`z-index`).
- **The target must exist and take the navigation.** Following a fragment link moves the browser's sequential focus starting point to the target, so the next Tab continues from there. Adding `tabindex="-1"` to the target makes it actually receive focus, which is more robust across browsers and assistive technologies and gets it announced.
- **Check what the focused target looks like.** A ring around the whole of `<main>` is distracting. Whether `:focus-visible` matches on a container reached this way varies, so look, and if needed suppress the outline on that one target only.
- **Single-page apps:** make sure your router does not intercept the hash link and treat it as a route.
- One link is normally enough. Pages with a long filter sidebar or data table may add "Skip to results" before that block.

Remember the reverse case as well: after an in-page navigation, the user should not land back at the top of the header.

**Try it:** Load a major news site and press Tab once. Note whether a skip link appears, whether it is visible, and whether pressing Enter then Tab lands inside the content. Add one to your own project and test it in two browsers.

**Resources**
- [WebAIM: "Skip navigation" links](https://webaim.org/techniques/skipnav/)
- [Understanding SC 2.4.1: Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html)
- [WCAG Technique G1: Adding a link at the top of each page that goes directly to the main content area](https://www.w3.org/WAI/WCAG22/Techniques/general/G1)

### The first rule of ARIA

The W3C's "Using ARIA" note opens with this rule: if a native HTML element or attribute already has the semantics and behaviour you need, use it instead of repurposing another element and adding an ARIA role, state, or property.

The reason is that ARIA only changes what is reported in the accessibility tree. It adds no behaviour. `role="checkbox"` on a `<div>` makes a screen reader say "checkbox", and then nothing works: no focus, no Space to toggle, no `checked` state, no form submission, no label association. You now owe all of that in JavaScript, and any piece you miss is a lie told to the user. WebAIM's annual survey of the top million home pages consistently finds that pages using ARIA have more detected errors on average than pages without it. Hence the saying "no ARIA is better than bad ARIA".

The other rules from the same note are worth knowing:

1. Do not change native semantics unless you really have to. Write `<h2><button>…</button></h2>`, not `<h2 role="button">`.
2. All interactive ARIA controls must be usable with the keyboard.
3. Do not use `role="presentation"` or `aria-hidden="true"` on a focusable element.
4. All interactive elements must have an accessible name.

When ARIA *is* the right tool:

- Widgets with no native equivalent: tabs, combobox with a custom listbox, tree view, menu bar.
- State that HTML cannot express: `aria-expanded`, `aria-current`, `aria-pressed`, `aria-invalid`.
- Relationships and names: `aria-labelledby`, `aria-describedby`, `aria-controls`.
- Live regions for dynamic updates.
- Hiding decorative content with `aria-hidden`.

Redundant ARIA (`<nav role="navigation">`, `<button role="button">`) is harmless noise. Conflicting ARIA (`<a href role="button">` that still behaves like a link, `aria-label` that contradicts visible text) is harmful. Before adding an attribute, ask what native element would do the job, and test the result with a screen reader.

**Try it:** Search a codebase for `role=`. For each match decide: replace with a native element, remove as redundant, or keep because nothing native exists. For those you keep, verify keyboard behaviour and states are all implemented.

**Resources**
- [W3C: Using ARIA](https://www.w3.org/TR/using-aria/)
- [ARIA APG: Read me first](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
- [web.dev: ARIA and HTML](https://web.dev/learn/accessibility/aria-html)

### Accessible names

The accessible name is the text that identifies an element to assistive technology: what a screen reader announces with the role, and what a voice control user says to activate it. Every interactive element, landmark of which there are several, image with meaning, and dialog needs one.

Browsers compute the name with a defined algorithm, taking the first source that yields text, roughly in this order:

1. `aria-labelledby`: the text of the referenced elements, in the order listed.
2. `aria-label`: the attribute's string.
3. The host language's native mechanism: `<label>` for form controls, `alt` for images, `<legend>` for a fieldset, `<caption>` for a table.
4. The element's own text content, for roles that allow naming from content (buttons, links, headings, tabs, options).
5. `title` (and for inputs, `placeholder`) as a last resort.

```html
<!-- Name: "Remove Blue shirt". It can reference itself and hidden elements. -->
<li>
  <span id="item-3">Blue shirt</span>
  <button id="rm-3" aria-label="Remove" aria-labelledby="rm-3 item-3">×</button>
</li>

<!-- Name from label; description from aria-describedby -->
<label for="pw">Password</label>
<input id="pw" type="password" aria-describedby="pw-hint">
<p id="pw-hint">At least 12 characters.</p>
```

`aria-describedby` supplies the accessible *description*, announced after the name and role, usually after a pause, and sometimes not at all depending on verbosity settings. Use it for hints and error messages, not for essential identification.

Rules that prevent most bugs:

- `aria-labelledby` and `aria-label` override content. `<button aria-label="Close">Dismiss</button>` is named "Close", and the visible text is lost to screen readers.
- The visible label must be contained in the accessible name (WCAG 2.5.3 Label in Name), or speech users cannot activate the control by saying what they see (see Voice control).
- `aria-label` and `aria-labelledby` do nothing on generic elements with no role; naming is prohibited there.
- Names must be distinguishing. Ten buttons all named "Edit" are useless in a list of controls.
- Do not put the role in the name ("Submit button" is read "Submit button, button").
- Prefer visible text. It helps everyone and gets translated.

**Try it:** In Chrome DevTools, open the Accessibility tab for five controls on a page and expand "Name". It shows each candidate source and which one won. Find one control where the winning source surprised you and fix it.

**Resources**
- [ARIA APG: Providing accessible names and descriptions](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/)
- [W3C: Accessible Name and Description Computation 1.2](https://www.w3.org/TR/accname-1.2/)
- [Understanding SC 2.5.3: Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)

### Roles, states, properties

ARIA has three kinds of attribute. A **role** says what an element is and does not change during its life. **Properties** describe mostly static characteristics and relationships (`aria-label`, `aria-controls`, `aria-haspopup`). **States** change as the user interacts and must be kept in sync by your JavaScript; a stale state is worse than none.

The four you will use most:

- **`aria-expanded`** (`true`/`false`) goes on the *control* that shows or hides something, not on the thing shown. Omit it entirely when the control does not expand anything.
- **`aria-selected`** marks the chosen item in a `tablist`, `listbox`, `grid`, or `tree`. It is only valid on those roles' children (`tab`, `option`, `gridcell`, `row`, `treeitem`). It is not for "the current page" or a toggled button.
- **`aria-current`** marks the current item within a set of related links or steps: `page` for the current page in navigation, `step` in a progress indicator, `date` in a calendar, or `true`.
- **`aria-hidden="true"`** removes an element and all its descendants from the accessibility tree while leaving them visible. Use it for decorative icons and duplicated content.

```html
<button type="button" aria-expanded="false" aria-controls="filters">Filters</button>
<div id="filters" hidden>…</div>

<nav aria-label="Main">
  <a href="/orders" aria-current="page">Orders</a>
</nav>

<button type="button"><svg aria-hidden="true" focusable="false">…</svg> Download</button>
```

Related states to know: `aria-pressed` for toggle buttons, `aria-checked` for custom checkboxes, radios, and switches, `aria-disabled` (announces disabled but, unlike the `disabled` attribute, keeps the element focusable and does not block activation; you must do that), and `aria-invalid` for fields with errors.

Common mistakes:

- `aria-hidden="true"` on, or around, something focusable. Keyboard users land on a control that announces nothing.
- `aria-hidden="false"` to try to reveal content hidden by CSS; it does not work reliably.
- Toggling a class for the visual state and forgetting the ARIA state. Style from the attribute instead (`[aria-expanded="true"] + .panel`) so the two cannot drift.
- Using a role without its required children, parents, or states. Check the role's definition in the spec.

**Try it:** Build a disclosure button that toggles a panel. Drive the panel's visibility and the chevron rotation purely from `aria-expanded` in CSS, so the only JavaScript is flipping the attribute. Confirm the state change is announced by a screen reader.

**Resources**
- [MDN: ARIA states and properties](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes)
- [WAI-ARIA 1.2: Supported states and properties](https://www.w3.org/TR/wai-aria-1.2/#state_prop_def)
- [MDN: aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current)

### Live regions

A screen reader announces what is under its cursor. When content changes elsewhere on the page (a "Saved" toast, a result count, a validation message) the user hears nothing unless the change happens in a live region. WCAG 4.1.3 Status Messages requires that such messages be announced without moving focus.

A live region is an element the browser watches for content changes:

- **`aria-live="polite"`**: announce when the screen reader is idle. Right for almost everything.
- **`aria-live="assertive"`**: interrupt whatever is being read. Only for urgent, time-critical messages.
- **`role="status"`** is a polite region with `aria-atomic="true"` implied. **`role="alert"`** is an assertive one.
- **`aria-atomic="true"`** reads the entire region on any change; without it only the changed nodes are read.
- `<output>` has an implicit `status` role.

```html
<div role="status" class="visually-hidden" id="announcer"></div>

<script>
  const announcer = document.getElementById('announcer');
  function announce(message) {
    announcer.textContent = '';
    requestAnimationFrame(() => { announcer.textContent = message; });
  }
  announce('12 results found');
</script>
```

The rule that causes most failures: the region must already exist in the DOM, and be exposed, before its content changes. Rendering a new element that already contains the message (as most toast components do) is unreliable; many browser and screen reader combinations announce nothing. Render an empty region at page load and change its text. Clearing first, as above, ensures a repeated identical message is announced again.

Other guidance:

- Keep messages short and plain text. Links or buttons inside a live region are announced as text, not as something operable.
- Do not put live regions on large or frequently updating containers; a chat log or a ticking timer becomes a stream of interruptions. Throttle, or announce a summary ("3 new messages").
- Do not use a live region when moving focus is the right answer, such as a dialog opening or an error summary after submit. Do not do both, or the user hears it twice.
- `role="alert"` on an inline field error interrupts typing; use `aria-describedby` on the field instead.
- Hidden regions (`display: none`) are not announced. Use a visually hidden class.
- A newer `ariaNotify()` method for announcing a string directly is available in some browsers but not all; treat it as an enhancement.

**Try it:** Build a search filter that updates a result list as you type. With NVDA or VoiceOver running, add a debounced `role="status"` announcement of the result count. Then try injecting the region together with its text and observe whether it is announced.

**Resources**
- [MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)
- [Understanding SC 4.1.3: Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- [WAI-ARIA 1.2: status role](https://www.w3.org/TR/wai-aria-1.2/#status)

### Authoring patterns

The ARIA Authoring Practices Guide (APG) documents, for each common widget, the roles, states, and properties it needs and the keyboard interaction users expect. When you build a custom widget, the APG pattern is the specification you implement. Deviating from it means users who know the pattern from every other application cannot operate yours.

The four patterns to learn first:

- **Disclosure.** A `<button>` with `aria-expanded` controlling a region. Enter or Space toggles. This simple pattern is the correct one for accordions, "show more", and, importantly, website navigation dropdowns.
- **Tabs.** A `tablist` containing `tab` elements, each with `aria-selected` and `aria-controls`, and matching `tabpanel` elements labelled by their tab. The tab list is a single tab stop using roving `tabindex`: Left/Right arrows move between tabs, Home/End jump to the ends, and Tab moves into the panel. Activation can be automatic on focus (fine when panels are already loaded) or manual with Enter/Space.
- **Menu and menu button.** `role="menu"` with `menuitem` children is for application-style menus of actions, like a desktop app's Edit menu. It carries strict expectations: arrow keys between items, Escape closes and returns focus to the button, type-ahead, and screen readers switch interaction mode. Do not use it for site navigation.
- **Combobox.** An `<input role="combobox">` with `aria-expanded`, `aria-controls` pointing at a `listbox` popup, and `aria-autocomplete`. Focus stays in the input; Down/Up arrows move a visual highlight through options and `aria-activedescendant` on the input tells assistive technology which option is active. Enter selects, Escape closes. This is the hardest common widget to get right.

How to use the APG well:

- Read the "Read me first" page. The examples demonstrate ARIA semantics; they are not production-ready components and are not guaranteed to work across every assistive technology, especially on touch devices.
- Check for a native option first: `<details>`, `<dialog>`, `<select>`, `<datalist>`, and the Popover API cover a lot.
- Implement the whole keyboard table, not half.
- Prefer a well-tested headless component library to writing a combobox from scratch in production; build one from scratch to learn.
- Test with real screen readers. Conformance to the pattern is necessary, not sufficient.

**Try it:** Implement the tabs pattern from the APG's description without looking at its example code: roles, `aria-selected`, roving `tabindex`, arrow keys, Home and End. Then compare your behaviour key by key with the APG example.

**Resources**
- [ARIA APG: Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [ARIA APG: Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [ARIA APG: Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

### Colour contrast

Low contrast is the most common accessibility failure on the web: WebAIM's yearly analysis of a million home pages finds it on roughly four in five. It affects people with low vision and colour vision deficiencies, and everyone on a phone outdoors.

The WCAG 2.2 AA requirements, expressed as a ratio between the relative luminance of two colours from 1:1 to 21:1:

- **4.5:1** for normal text (SC 1.4.3).
- **3:1** for large text: at least 24px, or about 18.66px and bold.
- **3:1** for user interface components and meaningful graphics (SC 1.4.11): input borders, the boundary of a button if that is what identifies it, focus indicators, checkbox outlines, icons that convey information, chart segments.

Exempt: disabled controls, purely decorative elements, and logos. AAA raises text to 7:1 and 4.5:1.

Where the measurement gets tricky: text over images or gradients (test the worst spot, or add a solid backing or scrim), semi-transparent colours (the effective colour is the blend), placeholder text (it must meet 4.5:1 too), hover and focus states, and both light and dark themes. Thin fonts read worse than the ratio suggests.

Separately, **SC 1.4.1 Use of Color** says colour must not be the only way information is conveyed. Typical failures and fixes:

- Links in body text distinguished only by colour: underline them (or ensure 3:1 against surrounding text plus a non-colour cue on hover and focus).
- A red border as the only sign of an invalid field: add an icon and a text message.
- Chart series told apart by colour alone: add patterns, direct labels, or distinct shapes.
- Status dots (green/red): add text or an icon with a different shape.

```css
.field[aria-invalid="true"] {
  border: 2px solid #b42318;               /* 3:1+ against white */
  background: url(error.svg) no-repeat right 0.5rem center; /* not colour alone */
}
```

Build contrast into the design tokens so that approved pairs are the only pairs available, instead of checking after the fact.

**Try it:** Open Chrome DevTools, run CSS Overview on your project, and review the "Contrast issues" list. Then enable each "Emulate vision deficiencies" option in the Rendering tab and check whether any information in your UI now depends on a colour you can no longer distinguish.

**Resources**
- [Understanding SC 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [Understanding SC 1.4.11: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [WebAIM: Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Text alternatives

Any non-text content that carries information needs a text equivalent (WCAG 1.1.1), so that it can be spoken, shown in braille, searched, and translated.

**Images.** The `alt` attribute should convey the image's purpose in its context, not describe its pixels. Ask: if the image were removed, what text would I put in its place?

```html
<img src="chart.png" alt="Sales rose from 1.2M in January to 2.1M in June.">  <!-- informative -->
<img src="divider.svg" alt="">                                              <!-- decorative: empty alt -->
<a href="/"><img src="logo.svg" alt="Acme home"></a>                        <!-- functional: describe the action -->
<button type="button" aria-label="Close"><svg aria-hidden="true" focusable="false">…</svg></button>
```

- An image with no `alt` attribute at all is announced by its file name. Decorative images need `alt=""`, which removes them from the accessibility tree.
- Functional images (inside links and buttons) describe the destination or action, not the picture.
- Do not start with "Image of"; the role is already announced. Do say "screenshot", "chart", or "portrait" when the type is relevant.
- Complex images (charts, diagrams) get a short alt plus a longer description or data table nearby.
- Images of text should be real text instead (1.4.5), except logos.
- CSS background images have no alt; do not use them for content.
- Icon fonts and inline SVG icons next to visible text should be hidden with `aria-hidden="true"`.

**Audio and video.** Prerecorded video with sound needs synchronised **captions** (1.2.2, level A), which include speaker identification and meaningful sounds, not just dialogue. Auto-generated captions are a starting draft and must be corrected. Live video needs captions at AA. Video whose visuals carry information not in the soundtrack needs **audio description** (1.2.5, AA). Audio-only content such as podcasts needs a **transcript**; a transcript is also valuable for video because it is searchable and skimmable, and serves deafblind users via braille.

```html
<video controls>
  <source src="demo.mp4" type="video/mp4">
  <track kind="captions" src="demo.en.vtt" srclang="en" label="English" default>
</video>
```

Media players must themselves be keyboard operable, and nothing should autoplay with sound.

**Try it:** Go through every image on one page of your project and classify it with the W3C alt decision tree as informative, decorative, functional, or complex. Rewrite the alt text accordingly, then listen to the page with a screen reader and judge whether it makes sense without seeing it.

**Resources**
- [W3C WAI: An alt decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/)
- [W3C WAI: Making audio and video media accessible](https://www.w3.org/WAI/media/av/)
- [web.dev: Images](https://web.dev/learn/accessibility/images)

### Zoom and reflow

People with low vision enlarge content, often a lot, and many more people simply prefer bigger text. Three WCAG criteria apply:

- **1.4.4 Resize Text (AA):** text can be scaled to 200% without loss of content or function.
- **1.4.10 Reflow (AA):** content works at a viewport width of 320 CSS pixels (and 256 pixels high for horizontally scrolling content) without scrolling in two dimensions. 320px is what a 1280px-wide window becomes at 400% browser zoom, so this is the "400% zoom" requirement. Content that inherently needs two dimensions, such as data tables, maps, diagrams, and toolbars, is excepted, but only that part.
- **1.4.12 Text Spacing (AA):** nothing breaks when users increase line height to 1.5, paragraph spacing to 2 times the font size, letter spacing to 0.12em, and word spacing to 0.16em.

Browser zoom scales CSS pixels, so a responsive layout that works on a small phone is most of the way there: zooming on desktop triggers your narrow-viewport media queries. What breaks in practice:

- Fixed heights on containers of text (`height: 48px` on a button or card), which clip or overlap when text grows or wraps. Use `min-height` and padding.
- Sticky headers, footers, and cookie banners that are fine at 100% and cover most of the viewport at 400%. Unstick them at small viewport heights.
- Horizontal scrolling from fixed widths, wide tables, long unbroken strings, and `white-space: nowrap`.
- `<meta name="viewport" content="..., user-scalable=no">` or `maximum-scale=1`, which block pinch zoom. Never set them.
- Font sizes in `px` are fine for browser zoom but ignore the user's default font size setting; use `rem` for text and for media query breakpoints (`em`) so layouts respond to larger default text too.
- Text truncated with ellipsis and no way to read the rest.
- Content that appears on hover (tooltips) and cannot be moved to with a magnified viewport (1.4.13).

```css
.card { min-block-size: 4rem; padding: 1rem; }      /* grows with its text */
.table-wrap { overflow-x: auto; }                    /* only the table scrolls */
```

**Try it:** Set your browser window to 1280px wide and zoom to 400%. Complete a core task. Then zoom to 200% and separately set the browser's default font size to 32px. Note every overlap, clipped label, and horizontal scrollbar, and fix the causes.

**Resources**
- [Understanding SC 1.4.10: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [Understanding SC 1.4.4: Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)
- [Understanding SC 1.4.12: Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)

### Target size

Small, tightly packed targets are hard to hit for people with tremors, limited dexterity, or large fingers, and for anyone using a phone one-handed on a moving train. Mis-taps are worst when the neighbouring target is destructive.

WCAG 2.2 added **2.5.8 Target Size (Minimum)** at level AA: pointer targets must be at least **24 by 24 CSS pixels**, with these exceptions:

- **Spacing:** a smaller target passes if a 24px-diameter circle centred on it does not intersect another target or that target's circle.
- **Inline:** links within a sentence or block of text are exempt.
- **Equivalent:** another control on the page that meets the size does the same thing.
- **User agent control:** unstyled native controls.
- **Essential:** the size is legally required or essential to the information, such as pins on a map.

24px is a floor, not a goal. **2.5.5 Target Size (Enhanced)**, AAA, asks for 44 by 44 CSS pixels, which matches Apple's guidance of 44pt; Android's Material guidance is 48dp. Aim for 44 to 48px on primary and touch-first controls.

The target is the clickable area, not the visible glyph. You can keep a 16px icon and enlarge its hit area:

```css
.icon-button {
  min-inline-size: 44px;
  min-block-size: 44px;
  display: inline-grid;
  place-items: center;
}

/* Or extend the hit area without changing layout */
.small-link { position: relative; }
.small-link::after { content: ''; position: absolute; inset: -10px; }
```

With the pseudo-element approach, make sure enlarged areas of neighbours do not overlap.

Usual offenders: close buttons on dialogs and toasts, icon-only toolbars, pagination numbers, carousel dots, table row action icons, tag "remove" crosses, custom checkboxes and radios whose label is not clickable, and footer link lists with tight line spacing. Wrapping a checkbox in its `<label>` (or using `for`) makes the whole label a target for free.

Also use media queries to adapt: `@media (pointer: coarse)` lets you increase sizes and spacing for touch input without changing the dense desktop layout.

**Try it:** In DevTools device mode, inspect the five smallest interactive elements in your project and read their box dimensions. Bring every one to at least 24 by 24, and primary actions to 44 by 44, without changing the visible icon size.

**Resources**
- [Understanding SC 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [web.dev: Accessible tap targets](https://web.dev/articles/accessible-tap-targets)

### WCAG 2.2 additions

WCAG 2.2 added nine success criteria. Focus Not Obscured and Target Size (Minimum) are covered in the entries on visible focus and target size. Four others change how you build common features, and audits now check them.

**2.5.7 Dragging Movements (AA).** Anything done by dragging must also be doable with a single pointer without dragging, unless dragging is essential. People with tremors, and people using a head pointer, eye tracking, or a switch, cannot hold and move at once. Keyboard support does not satisfy this criterion, because it is about pointer users. Give a sortable list "Move up" and "Move down" buttons, a slider clickable track or stepper buttons, a kanban card a "Move to…" menu, and a map pan buttons.

**3.3.8 Accessible Authentication (Minimum) (AA).** A login step must not depend on a cognitive function test, meaning remembering, transcribing, or solving something, unless there is an alternative or a mechanism to help. In practice:

```html
<input type="email" name="email" autocomplete="username">
<input type="password" name="password" autocomplete="current-password">
<input type="text" name="code" inputmode="numeric" autocomplete="one-time-code">
```

- Never block paste or autofill; a password manager is the "mechanism". Correct `autocomplete` tokens make it work.
- Offer passkeys (WebAuthn), email magic links, or third-party sign-in.
- A one-time code is acceptable if it can be pasted or autofilled, not if it must be retyped from memory in split boxes that reject paste.
- Puzzle CAPTCHAs fail. Recognising objects is allowed at AA, though not at AAA (3.3.9), and is still a barrier for many people.

**3.3.7 Redundant Entry (A).** Within one process, do not ask for the same information twice. Auto-populate it or let the user select it: "Billing address same as delivery", carrying search criteria into a booking form. Exceptions are re-entry that is essential, for security such as confirming a new password, or data that is no longer valid. Remember this when a multi-step form loses state on Back.

**3.2.6 Consistent Help (A).** If help mechanisms (contact details, a chat launcher, a help link, an FAQ) appear on multiple pages, they appear in the same relative order on each. It does not require you to provide help, only to keep it where people learned to find it. A shared layout component satisfies it; a chat widget that moves between corners does not.

WCAG 2.2 also removed 4.1.1 Parsing, so duplicate IDs are no longer a failure in themselves, only when they break names or relationships.

**Try it:** On a site with a login and a multi-step form, check four things: can you paste into the password and code fields, does a password manager fill them, is anything asked twice, and is help in the same place on every step. Then find one drag interaction and operate it using single clicks only.

**Resources**
- [W3C WAI: What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [Understanding SC 2.5.7: Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- [Understanding SC 3.3.8: Accessible Authentication (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)

### Reduced motion

Large-scale motion on screen, such as parallax, zooming transitions, sliding panels, and autoplaying carousels, can trigger dizziness, nausea, and migraines in people with vestibular disorders, and distracts people with attention-related conditions. Operating systems offer a "reduce motion" setting, and the `prefers-reduced-motion` media query exposes it to your CSS and JavaScript.

```css
.panel {
  transition: transform 300ms ease, opacity 300ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .panel {
    transition: opacity 150ms ease; /* keep a gentle fade, drop the movement */
  }
}
```

```js
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!reduceMotion.matches) startParallax();
reduceMotion.addEventListener('change', (event) => { /* react if the user toggles it */ });
```

"Reduce" does not mean "remove all animation". Replace movement, scaling, and rotation with opacity or colour changes, or with an instant state change. Animation that communicates state, such as a spinner or a progress bar, can stay, toned down. A blanket rule that sets every `animation-duration` and `transition-duration` to nearly zero is a reasonable safety net, but it can break code waiting for `transitionend` and it removes helpful feedback, so prefer writing motion as an enhancement inside `@media (prefers-reduced-motion: no-preference)`.

Do not forget JavaScript-driven motion: smooth scrolling (`scroll-behavior: smooth` and `scrollIntoView({ behavior: 'smooth' })`), view transitions, canvas and WebGL effects, animated libraries, and autoplaying video or GIFs.

The related WCAG criteria:

- **2.2.2 Pause, Stop, Hide (A):** anything that moves, blinks, or scrolls automatically for more than five seconds alongside other content needs a way to pause it. This applies whatever the user's motion preference.
- **2.3.1 Three Flashes (A):** nothing flashes more than three times a second; this is a seizure risk.
- **2.3.3 Animation from Interactions (AAA):** motion triggered by interaction can be disabled unless essential.

Respecting the OS setting is the minimum. An in-page control for motion is better still, because many people who are affected do not know the system setting exists.

**Try it:** In the DevTools Rendering tab set "Emulate CSS media feature prefers-reduced-motion" to "reduce" and go through your project. List every animation that still moves, including scroll behaviour and any library-driven effects, and give each a reduced alternative.

**Resources**
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [web.dev: Animation and motion](https://web.dev/learn/accessibility/motion)
- [Understanding SC 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

### Forced colours mode

Some users replace every website's colours with a small palette of their own choosing. On Windows this is **Contrast themes** (Settings, Accessibility, Contrast themes; formerly High Contrast mode), used by people with low vision, light sensitivity, and migraines. Many choose a dark theme with bright text; it is not always "high" contrast. Browsers respond with forced colours mode.

In forced colours mode the browser overrides, on every element: `color`, `background-color`, border, outline, and text-decoration colours, and SVG `fill` and `stroke`. It sets `box-shadow` and `text-shadow` to `none`. Background images are kept, with a solid backplate drawn behind text. Layout, spacing, and border *widths* are untouched.

So anything you conveyed purely with a background colour or a shadow vanishes:

- Buttons and cards distinguished only by background fill merge into the page. Give them a border, which can be transparent in normal mode; it becomes visible when colours are forced.
- Focus rings made from `box-shadow` disappear. Use `outline`, or keep `outline: 2px solid transparent` beneath the shadow.
- Selected, checked, and current states shown by background alone are lost. Custom toggles and checkboxes built from backgrounds become empty boxes.
- Icons with hard-coded fills may become invisible. Use `fill: currentColor`.

Fix what remains with the `forced-colors` media query and CSS **system colours**, keywords that resolve to the user's palette:

```css
.button { border: 2px solid transparent; }          /* appears in forced colours */

@media (forced-colors: active) {
  .tab[aria-selected="true"] { border-block-end: 3px solid Highlight; }
  .toggle[aria-checked="true"] .thumb { background: Highlight; }
  .icon { fill: CanvasText; }
  .swatch { forced-color-adjust: none; }            /* a colour sample must keep its real colour */
}
```

The pairs to use together are `Canvas`/`CanvasText`, `ButtonFace`/`ButtonText`, `Field`/`FieldText`, `Highlight`/`HighlightText`, plus `LinkText` and `GrayText` for disabled content. Never hard-code a hex value inside the query, and use `forced-color-adjust: none` sparingly.

`prefers-contrast` is a different, softer signal: `more` (for example macOS "Increase contrast"), `less`, or `custom`, which is what matches when forced colours are active. With `more`, your own colours still apply, and you respond by strengthening borders and removing translucency.

Semantic HTML helps here too: native controls adapt automatically.

**Try it:** In the DevTools Rendering tab set "Emulate CSS media feature forced-colors" to "active" and walk through your project. Then, if you have Windows, switch on a contrast theme and repeat with a real one. List everything whose boundary, state, or focus indicator disappeared, and fix each with a border, outline, or system colour.

**Resources**
- [MDN: forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)
- [MDN: System colors](https://developer.mozilla.org/en-US/docs/Web/CSS/system-color)
- [MDN: prefers-contrast](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast)

### Accessible forms

Forms are where users give you money and data, and where accessibility failures block them completely. Four things must be right.

**Labels.** Every control has a visible, programmatically associated label: `<label for>` matching the input's `id`, or the input nested in the label. The label gives the accessible name and enlarges the click target. A placeholder is not a label.

**Grouping.** Related controls, especially radio buttons and checkbox sets, go in a `<fieldset>` with a `<legend>` asking the question. Without it a screen reader user hears "Yes, radio button" with no idea what is being asked.

**Instructions and input purpose.** Put hints before or directly after the label and attach them with `aria-describedby`. Mark required fields in text (not only an asterisk) and with the `required` attribute. Use the correct `type` and `autocomplete` tokens (`email`, `given-name`, `one-time-code`); this is WCAG 1.3.5 and enables autofill, which helps people with motor and cognitive disabilities most.

**Errors.** Identify the field in error in text (3.3.1) and say how to fix it (3.3.3), tied to the field:

```html
<label for="email">Email address</label>
<input id="email" name="email" type="email" autocomplete="email" required
       aria-invalid="true" aria-describedby="email-error">
<p id="email-error">Enter an email address in the format name@example.com</p>
```

For a submitted form with errors, add an **error summary** at the top: a heading such as "There is a problem", a list of links each pointing to its field, and focus moved to the summary on submit. Also prefix the page `<title>` with "Error:". The summary tells users how many problems there are; the inline messages give context at each field.

Mistakes to avoid:

- Validating on every keystroke or on blur of an empty field, which announces errors before the user has finished. Validate on submit, then re-validate a field as the user corrects it.
- Disabling the submit button until the form is valid. Users cannot tell what is wrong, and disabled buttons are not focusable.
- Error messages that say "Invalid input". Say what is expected.
- Clearing the form on error, asking for information already entered, or blocking paste in password and code fields (see WCAG 2.2 additions).
- Relying on `aria-errormessage`; support is inconsistent, so use `aria-describedby`.

**Try it:** Build a three-field sign-up form with a radio group. Submit it empty and implement an error summary that receives focus and links to each field. Test the whole flow with a screen reader and with the keyboard alone.

**Resources**
- [W3C WAI: Forms tutorial](https://www.w3.org/WAI/tutorials/forms/)
- [GOV.UK Design System: Error summary](https://design-system.service.gov.uk/components/error-summary/)
- [web.dev: Forms](https://web.dev/learn/accessibility/forms)

### Clear language

Content is part of the interface. Plain wording helps people with cognitive and learning disabilities, people reading in a second language, people using translation tools, and anyone in a hurry. It is also the cheapest accessibility improvement there is.

**Plain wording.** Use short sentences and common words. Put the most important information first. Write in the active voice and address the user as "you". Explain or avoid jargon and abbreviations. Break long text into short paragraphs and lists. WCAG's reading-level criterion (3.1.5) is AAA, but the page language (`<html lang="en">`, 3.1.1) is level A and essential: it selects the screen reader's pronunciation rules and enables hyphenation and translation. Mark passages in another language with their own `lang` attribute.

**Link text.** Screen reader users often pull up a list of all links on the page, out of context. Link text has to make sense alone (2.4.4).

```html
<!-- Poor -->
<p>To read the 2026 annual report, <a href="/report.pdf">click here</a>.</p>

<!-- Better -->
<p>Read the <a href="/report.pdf">2026 annual report (PDF, 2.4 MB)</a>.</p>
```

Avoid "click here", "read more", "learn more", and raw URLs. If a design repeats "Read more" on every card, extend the name with visually hidden text or `aria-labelledby`, keeping the visible words at the start of the name. Tell users when a link opens a new tab or downloads a file. Links with the same text should go to the same place.

**Headings and labels.** Headings must describe the section they introduce (2.4.6), front-loading the distinguishing words, because users scan and navigate by them. "Delivery options" beats "Options"; "Step 2: Payment" beats "Next". The same applies to button labels: "Save changes" and "Delete account" tell users what will happen, where "OK" and "Submit" do not. The page `<title>` should be unique and put the page-specific part first.

**Microcopy and errors.** Error messages should say what happened and how to fix it, without blame or codes. Be consistent: the same action has the same name everywhere (3.2.4). Do not rely on shape, colour, or position alone in instructions ("press the green button on the right").

**Try it:** List all headings on a page (most screen readers and the axe or WAVE extensions can show the outline), then all links. Read each list without looking at the page. Rewrite anything that is ambiguous out of context, and run one paragraph of body text through a readability checker.

**Resources**
- [W3C WAI: Writing for web accessibility](https://www.w3.org/WAI/tips/writing/)
- [Understanding SC 2.4.4: Link Purpose (In Context)](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html)
- [Understanding SC 2.4.6: Headings and Labels](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html)

### Keyboard-only pass

A keyboard pass is the highest-value manual test: it takes minutes, needs no extra software, and finds problems that also affect screen reader, switch, and voice users. Do it for every feature before you call it finished.

Setup: on macOS, enable "Keyboard navigation" in System Settings so Tab reaches all controls, and in Safari enable "Press Tab to highlight each item on a webpage". Then put the mouse out of reach.

The procedure, per page or flow:

1. **Load the page and press Tab once.** Is there a skip link, and does it work?
2. **Tab through everything.** For each stop ask: can I see where focus is? Is the order logical, following the visual layout? Did focus go anywhere invisible (an off-screen menu, a hidden panel)? Is anything interactive skipped?
3. **Operate every control.** Enter on links and buttons, Space on buttons and checkboxes, arrows in radio groups, selects, tabs, menus, and sliders, Escape to close overlays.
4. **Open every overlay** (menu, dialog, popover, date picker). Does focus move into it? Is focus contained in modals? Does Escape close it, and does focus return to the trigger?
5. **Trigger dynamic changes.** Submit a form with errors, delete an item, load more results, change route. Where is focus afterwards?
6. **Shift+Tab backwards** through the same path. Reverse order exposes traps that forward order hides.
7. **Complete the core task end to end**: sign up, search, add to basket, check out.

Things to watch for specifically: focus disappearing for several Tab presses (hidden focusable elements), a focus ring obscured by a sticky header, embedded widgets and iframes (maps, video players, chat) that trap focus, content that is only revealed on hover, and custom controls that respond to click but not to Enter or Space.

Use the Console live expression `document.activeElement` when you lose track of focus. Record each failure with the page, the element, the key pressed, what happened, and what should have happened; that is a ready-made bug report.

**Try it:** Run the seven steps on the checkout or sign-up flow of a well-known site, then on your own project. Write up at least three findings for each in the bug-report format above.

**Resources**
- [web.dev: Manual accessibility testing](https://web.dev/learn/accessibility/test-manual)
- [W3C WAI: Easy Checks, a first review of web accessibility](https://www.w3.org/WAI/test-evaluate/preliminary/)
- [WebAIM: Keyboard accessibility](https://webaim.org/techniques/keyboard/)

### Screen reader basics

You cannot know how your work is announced without listening to it. You do not need expert fluency; you need enough to navigate a page, operate a form, and notice when something is wrong. Learn one desktop screen reader properly and a second one a little, using the browser pairings real users use: NVDA with Firefox or Chrome on Windows, JAWS with Chrome, and VoiceOver with Safari on macOS. Phones work differently and have their own entry (see Mobile screen readers).

Screen readers on desktop have two modes. In **browse mode** (the virtual cursor) arrow keys read through all content, and single letters jump by element type. In **focus mode** (forms mode) keystrokes go to the page so you can type and use widgets. NVDA switches automatically and plays a sound; many "my keyboard handler doesn't fire" bugs are browse mode intercepting the key.

Essential NVDA commands (the NVDA key is Insert or Caps Lock):

| Action | Keys |
| --- | --- |
| Stop speech | Ctrl |
| Read next / previous item | Down / Up arrow |
| Next heading, landmark, form field, button, link | H, D, F, B, K (add Shift for previous) |
| Elements list | NVDA+F7 |
| Toggle browse / focus mode | NVDA+Space |
| Read from here | NVDA+Down arrow |

Essential VoiceOver commands on macOS (VO is Control+Option):

| Action | Keys |
| --- | --- |
| Turn on / off | Command+F5 |
| Next / previous item | VO+Right / VO+Left |
| Activate | VO+Space |
| Rotor (headings, links, landmarks, form controls) | VO+U |
| Read from here | VO+A |

A basic test routine: let it read the page title, list the headings and landmarks and check they form a sensible outline, Tab through interactive elements listening for name, role, and state on each, operate each widget and confirm state changes are announced, trigger dynamic updates and errors, and finally read the content linearly to catch reading-order and hidden-content problems.

Tips: turn on NVDA's Speech Viewer to see output as text. Do not test by looking at the screen and tabbing; much content is only reached with the reading cursor. Do not "fix" something for one screen reader without checking another. And remember you are a novice: real users are faster, use different strategies, and are the only reliable judges of usability.

**Try it:** Install NVDA or turn on VoiceOver. With the screen dimmed or your eyes closed, find the main heading of a news site, navigate to its search field, and run a search. Then do the same on your own project and note every announcement that was missing, wrong, or confusing.

**Resources**
- [web.dev: Assistive technology testing](https://web.dev/learn/accessibility/test-assistive-technology)
- [WebAIM: Using NVDA to evaluate web accessibility](https://webaim.org/articles/nvda/)
- [WebAIM: Using VoiceOver to evaluate web accessibility](https://webaim.org/articles/voiceover/)

### Mobile screen readers

On phones, screen reader users are a large share of your assistive technology audience, and the interaction model is different enough from desktop that a component passing with NVDA can fail completely on a phone. There is no Tab key and no arrow keys. The user moves an *accessibility focus* through the accessibility tree by touch, and the screen reader, not your page, receives the gestures.

The core gestures are the same idea on both platforms:

| Action | VoiceOver (iOS, Safari) | TalkBack (Android, Chrome) |
| --- | --- | --- |
| Next / previous item | Swipe right / left | Swipe right / left |
| Activate | Double-tap | Double-tap |
| Explore by touch | Drag one finger | Drag one finger |
| Jump by headings, links, controls | Rotor: rotate two fingers, then swipe up / down | Reading controls: swipe up-then-down to pick, then swipe up / down |
| Scroll | Three-finger swipe | Two-finger swipe |
| Read from here | Two-finger swipe down | TalkBack menu, "Read from next item" |

Turn VoiceOver on in Settings, Accessibility, and assign it to the Accessibility Shortcut (triple-click the side button) so you can toggle it quickly. Turn TalkBack on in Settings, Accessibility, with the volume-keys shortcut. Learn how to switch each off before you start. Gestures vary by OS version, so check the vendor's current list.

What fails on mobile that desktop testing misses:

- **Keyboard-only widgets.** A custom listbox, slider, or tab list driven by `keydown` arrow handlers receives no key events. Each option must be reachable by swipe and activate on `click`, which is what a double-tap sends. Native `<select>` and `<input type="range">` just work.
- **Custom gestures.** Your swipe, long-press, and drag handlers never fire, because the screen reader consumes the touches. Provide buttons.
- **Modals that are not really modal.** Swiping walks straight out of a `<div>` overlay into the page behind unless the background is inert.
- **Hover- or focus-dependent content**, and `aria-activedescendant` patterns, which have weaker support on touch.
- **Reading order.** Swipe order is DOM order, so visual reordering is very noticeable.
- **Tiny or adjacent targets** in explore-by-touch, and fixed bars that cover the focused item.

To debug, connect the phone to a desktop: Safari's Web Inspector for iOS (enable Web Inspector on the device), and `chrome://inspect` for Android. Both show the DOM and let you inspect accessibility properties while the screen reader runs. VoiceOver's Caption Panel and TalkBack's speech output display show announcements as text.

**Try it:** With VoiceOver or TalkBack on, and without looking at the screen for the first attempt, open your project, navigate by headings to the main content, open a menu or dialog, fill one form field, and submit. Note every element you could not reach by swiping or could not activate by double-tap.

**Resources**
- [Apple Support: Learn VoiceOver gestures on iPhone](https://support.apple.com/guide/iphone/learn-voiceover-gestures-iph3e2e2281/ios)
- [Android Accessibility Help: Use TalkBack gestures](https://support.google.com/accessibility/android/answer/6151827)
- [web.dev: Assistive technology testing](https://web.dev/learn/accessibility/test-assistive-technology)

### Voice control

Voice control software lets people operate a computer entirely by speech. It is used by people with limited or no use of their hands and by people with repetitive strain injuries, most of whom can see the screen. The main products are Voice Control on macOS and iOS, Voice Access on Windows and Android, and Dragon on Windows.

Users work in two ways. They speak a control's visible label ("Click Add to basket", "Tap Search"), and the software looks in the accessibility tree for an actionable element whose accessible name matches. When that fails, they fall back to "Show numbers", which overlays a number on every element exposed as interactive, or to a coordinate grid, which is slow.

That makes the requirements concrete:

- **The accessible name must contain the visible label** (WCAG 2.5.3 Label in Name), ideally starting with it.

```html
<!-- Fails: user says "Click Search", name is "Find products" -->
<button aria-label="Find products">Search</button>

<!-- Works: visible words come first, extra context after -->
<a href="/posts/42" aria-label="Read more: Reducing bundle size">Read more</a>
```

- **Controls must be exposed as controls.** A clickable `<div>` gets no number and matches no "click" command. Real `<button>`, `<a href>`, and form elements do.
- **Icon-only buttons need a guessable name.** The user cannot see an `aria-label`. Prefer visible text, or at least a tooltip that shows the same word as the name.
- **Make names unique where you can.** Twelve "Edit" buttons force a disambiguation step for each command.
- **Dictation needs real text fields.** `<input>`, `<textarea>`, and properly exposed `contenteditable` regions accept dictated text; canvas-based or heavily scripted editors often do not.
- **Do not use single-character keyboard shortcuts** without a way to turn them off or remap them (2.1.4). Dictated words are delivered as keystrokes and can trigger a storm of shortcuts.
- **Nothing hover-only**, and no time limits that expire while someone is speaking a long command.

Voice control testing is quick and catches a class of bug no automated tool reports well: an element that looks labelled, has a name, and still cannot be spoken.

**Try it:** Turn on Voice Control (macOS: System Settings, Accessibility, Voice Control) or Voice Access (Windows 11: Settings, Accessibility, Speech). Say "Show numbers" on your project and look for interactive things with no number. Then try to activate every button and link in one flow by speaking its visible text, and fix each one that needed a number.

**Resources**
- [Understanding SC 2.5.3: Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)
- [W3C WAI: Web accessibility perspectives, voice recognition](https://www.w3.org/WAI/perspective-videos/voice/)
- [Understanding SC 2.1.4: Character Key Shortcuts](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html)

### Automated checks

Automated tools run rules against the rendered DOM and report definite failures. The dominant engine is **axe-core**, which powers the axe DevTools extension, Lighthouse's accessibility category, and most testing integrations.

How to run them:

- **axe DevTools extension:** open DevTools, go to the axe tab, scan the page. Each issue shows the element, the rule, the WCAG criterion, and how to fix it.
- **Lighthouse:** DevTools Lighthouse panel, Accessibility category. It runs a subset of axe rules and produces a weighted score.
- **In the Console or a script:** `axe.run()` after loading the library, for custom reporting.

What they catch well: missing alt attributes, form controls without names, insufficient text contrast (when the background is a solid colour), invalid ARIA attributes and roles, missing page language, duplicate IDs used by ARIA, and missing document title.

What they cannot judge: whether alt text is *accurate*, whether focus order is logical, whether a custom widget is keyboard operable, whether focus is managed after a route change or dialog, whether a live region announces at the right time, whether headings describe their content, whether an error message is helpful, or whether the reading order makes sense. Automated tools find a minority of issues; estimates range from about a third of WCAG criteria to a little over half of issues by volume, depending on how you count. The failures they miss tend to be the ones that block people completely.

Consequences:

- A Lighthouse accessibility score of 100 means no automated rule failed. It is entirely possible to build a page that scores 100 and cannot be used with a keyboard.
- Zero violations is a necessary baseline, not a claim of conformance.
- Scan every state, not just the initial load: open the menu, the dialog, the error state, the dark theme. Tools only see what is in the DOM at that moment.
- axe also reports "incomplete" or "needs review" items (for example contrast over an image). Review them manually; do not ignore them.
- Treat each rule as a pointer to a class of problem. If one image lacks alt text, audit how images are authored.

axe is designed to minimise false positives, so when it reports a violation, assume it is real.

**Try it:** Run axe DevTools and Lighthouse on the same page and compare the results. Fix every violation. Then deliberately build a page with a clickable `<div>`, a wrong-but-present alt text, and an illogical focus order, and confirm that both tools pass it.

**Resources**
- [web.dev: Automated accessibility testing](https://web.dev/learn/accessibility/test-automated)
- [Chrome for Developers: Lighthouse accessibility scoring](https://developer.chrome.com/docs/lighthouse/accessibility/scoring)
- [axe-core on GitHub](https://github.com/dequelabs/axe-core)

### Accessibility in CI

Manual testing finds problems; automation stops them coming back. Putting accessibility checks in the pipeline makes a regression fail the build like any other bug. Work at three levels.

**Lint (as you type).** `eslint-plugin-jsx-a11y` for JSX, or the equivalent plugin for Vue, Svelte, or Angular templates, catches missing alt text, unlabeled inputs, and click handlers on non-interactive elements statically.

**Component tests.** Querying by role and accessible name is itself an accessibility assertion: `getByRole('button', { name: 'Save' })` fails if the element stops being a button or loses its name. Add an axe scan of the rendered component with `jest-axe` or `vitest-axe`. Note that jsdom does no layout, so contrast rules cannot run there.

**End-to-end tests.** A real browser gives real results, including contrast. With Playwright:

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('checkout has no detectable accessibility violations', async ({ page }) => {
  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Pay now' }).click(); // reach the error state

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

Extend this with keyboard assertions, which axe cannot make: `await page.keyboard.press('Tab')` followed by `await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()`, or opening a dialog and asserting where focus lands and returns. Playwright's ARIA snapshots (`toMatchAriaSnapshot`) assert the accessibility tree structure of a region and catch semantic regressions.

Making it stick:

- Scan meaningful states, not only page load.
- Introducing checks to an existing codebase: record current violations as a baseline, or temporarily `disableRules` or `exclude` known issues with a linked ticket, so the build fails only on *new* problems. Then burn the list down.
- Scope with `include` to test a component region; remember `exclude` drops an element and all its descendants.
- Print the violation's rule ID, help URL, and target selector in the failure output so the fix is obvious.
- Storybook's accessibility addon runs axe per story and can run in CI through its test runner, which covers component states cheaply.

CI checks inherit the limits of automation. Keep the manual keyboard and screen reader passes in your definition of done.

**Try it:** Add `@axe-core/playwright` to a project and write one test that scans a page in its default state and one after opening a dialog. Then add a test that Tabs to the first control and asserts focus. Break the page on purpose and watch each test fail.

**Resources**
- [Playwright: Accessibility testing](https://playwright.dev/docs/accessibility-testing)
- [Testing Library: ByRole queries](https://testing-library.com/docs/queries/byrole/)
- [Storybook: Accessibility tests](https://storybook.js.org/docs/writing-tests/accessibility-testing)

### Accessibility DevTools

Browser DevTools let you see what assistive technology will be told without starting a screen reader, which makes them the fastest way to debug names, roles, and states.

**Chrome and Edge**

- **Elements panel, Accessibility tab** (next to Styles and Computed). For the selected node it shows the ancestor chain in the accessibility tree, the ARIA attributes, and **Computed Properties**: name, role, description, and states such as focusable, expanded, or invalid. Expand "Name" to see every candidate source (`aria-labelledby`, `aria-label`, label, contents, title) with the losing ones struck through. This answers "why is it announcing that?" directly.
- **Full-page accessibility tree.** Tick the option in the Accessibility tab, reload DevTools, and a button at the top right of the Elements tree switches between DOM and accessibility tree. Ignored nodes are removed, so you see the page as assistive technology does.
- **Source order viewer** in the same tab overlays the DOM order on the page, useful for spotting CSS reordering.
- **Inspect tooltip.** Hovering in inspect mode shows name, role, contrast ratio, and whether the element is keyboard-focusable.
- **Colour picker contrast** in the Styles pane, with AA and AAA lines and suggested passing colours.
- **CSS Overview panel** lists all low-contrast text pairs on the page.
- **Rendering tab** emulates vision deficiencies and the `prefers-reduced-motion`, `prefers-contrast`, `prefers-color-scheme`, and `forced-colors` media features.
- **Lighthouse panel** runs the axe-based audit, and the **Issues** panel surfaces some accessibility problems as you browse.

**Firefox**

- The dedicated **Accessibility panel** shows the whole tree with properties for each node, a "Check for issues" menu (contrast, keyboard, text labels), a colour-vision simulator, and **Show Tabbing Order**, which draws numbered markers on every tab stop.

How to use them in practice: when a control is announced wrongly, select it and read the computed name and role first. If the node is missing from the tree, look for `aria-hidden`, `hidden`, `display: none`, or `inert` on an ancestor. If a state is not announced, check whether the attribute is on the element that has the role and focus. Use the tree to verify structure: landmarks present, heading levels sensible, lists exposed as lists.

DevTools show what the browser exposes, not what each screen reader does with it. Confirm important behaviour, especially live regions and complex widgets, with a real screen reader.

**Try it:** Pick a component with a bug report like "screen reader says 'button' with no label". Using only the Accessibility tab, find which name source is empty and fix it. Then view the same page in the full accessibility tree and in Firefox's panel and note three differences from the DOM.

**Resources**
- [Chrome for Developers: Accessibility features reference](https://developer.chrome.com/docs/devtools/accessibility/reference)
- [Firefox Source Docs: Accessibility Inspector](https://firefox-source-docs.mozilla.org/devtools-user/accessibility_inspector/index.html)
- [Chrome for Developers: Emulate CSS media features and vision deficiencies](https://developer.chrome.com/docs/devtools/rendering/emulate-css)

### Audit a real site

An audit evaluates a site against WCAG and reports what fails, who it affects, and how to fix it. Doing one on a live site you did not build trains you to see problems quickly and to communicate them so they get fixed.

A workable method, adapted from the W3C's WCAG-EM methodology:

1. **Scope.** State the target (WCAG 2.2 level AA), the pages, and the environments (for example Chrome with NVDA, Safari with VoiceOver, 320px viewport).
2. **Sample.** Choose 5 to 10 pages that cover the templates and one complete process: home, a listing, a detail page, a form, search results, and a checkout or sign-up flow from start to finish.
3. **Test each page** in layers: automated scan, keyboard pass, screen reader pass, zoom and reflow, contrast, motion, then content (headings, links, alt text, errors).
4. **Record each issue** in a consistent structure.
5. **Summarise** with the most serious and most repeated problems first.

A good issue entry contains:

| Field | Example |
| --- | --- |
| Title | Mobile menu button has no accessible name |
| Location | Header, all pages, below 768px |
| WCAG criterion | 4.1.2 Name, Role, Value (A) |
| Who is affected | Screen reader and voice control users |
| Steps and actual result | Tab to the hamburger icon with NVDA: announces "button" only |
| Expected | Announces "Menu, button, collapsed" |
| Severity | Critical: blocks all navigation on mobile |
| Fix | Add visible or visually hidden text "Menu" and `aria-expanded` |

Rate severity by user impact, not by WCAG level: **critical** (blocks a task with no workaround), **serious** (major difficulty or a painful workaround), **moderate** (frustrating but passable), **minor** (annoyance). A level A failure in a footer link may matter less than an AA failure on the pay button.

Advice from practice: map every issue to the most specific success criterion and read its Understanding page before you cite it. Report a pattern once with all its locations, since fixing the shared component fixes them all. Include a code-level recommendation, not just "make accessible". Note what works well, too. And be honest about limits: a sample-based audit by one person is not a conformance certification.

**Try it:** Audit three pages and one flow of a public site (a local council, a cinema, or a shop). Produce a report with at least ten issues in the format above, sorted by severity, and a one-paragraph executive summary.

**Resources**
- [W3C WAI: WCAG-EM, Website Accessibility Conformance Evaluation Methodology](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/)
- [W3C WAI: Evaluating web accessibility overview](https://www.w3.org/WAI/test-evaluate/)
- [How to Meet WCAG (Quick Reference)](https://www.w3.org/WAI/WCAG22/quickref/)

### Accessible modal and combobox

These two widgets exercise nearly every skill in this module: semantics, naming, focus management, keyboard interaction, states, and live announcements. Build both without a component library, then verify with real assistive technology.

**Modal dialog.** Use `<dialog>` and `showModal()`. Requirements to verify:

- It has an accessible name (`aria-labelledby` pointing at its heading).
- Opening moves focus inside, to the first sensible control or the one marked `autofocus`.
- Tab and Shift+Tab stay inside; the background is inert to keyboard, pointer, and screen reader cursor.
- Escape and a visible close button both close it, and focus returns to the trigger.
- It works at 320px and 400% zoom, with content scrollable inside.
- The screen reader announces the dialog role and name on open.

Then build it a second time from `<div role="dialog" aria-modal="true">` with `inert` on the rest of the page, to understand what the native element does for you.

**Combobox with autocomplete.** Follow the APG "editable combobox with list autocomplete" pattern:

```html
<label for="city">City</label>
<input id="city" type="text" role="combobox" autocomplete="off"
       aria-expanded="false" aria-controls="city-list" aria-autocomplete="list">
<ul id="city-list" role="listbox" aria-label="Cities" hidden>
  <li id="city-opt-0" role="option" aria-selected="false">Lisbon</li>
</ul>
<div role="status" class="visually-hidden"></div>
```

- DOM focus never leaves the input. Down and Up arrows move the active option, and you set `aria-activedescendant` on the input to that option's `id`, with `aria-selected="true"` on it and a visible highlight that is scrolled into view.
- Typing filters the list and sets `aria-expanded`. Enter selects the active option and closes; Escape closes and, pressed again, clears; Tab moves on.
- Options are also clickable, without the input losing its value on blur (handle `mousedown` or `pointerdown` carefully).
- Announce the number of results through the status region, debounced, and announce "No results".
- Remove `aria-activedescendant` when no option is active.

Verification is the point of the exercise. Test each widget with the keyboard alone, with NVDA in Firefox or Chrome, and with VoiceOver in Safari, and on a phone with TalkBack or VoiceOver if you can. Write down exactly what each announces at every step and compare it with the APG example in the same screen reader. Expect differences between screen readers, and expect to find at least one bug you could not see.

**Try it:** Build both widgets on one page. Record a two-minute screen capture with the screen reader's speech viewer or caption panel visible while you open the modal, use the combobox inside it, select a value, and close. Run axe on each state.

**Resources**
- [ARIA APG: Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [ARIA APG: Editable combobox with list autocomplete example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/)
- [MDN: The dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
