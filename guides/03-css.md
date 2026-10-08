# CSS: Guide

## Toolkit

### DevTools and tooling

Most CSS debugging happens in the Elements panel (Chrome, Edge) or the Inspector (Firefox). Learn these parts of it properly:

- **Styles pane.** Rules are listed in winning order; losing declarations are struck through. Hover a selector to see its specificity. Layers appear as `@layer` headers, and declarations that have no effect (for example `align-items` on a non-flex box) are greyed out with a tooltip that tells you why. Click any value and use the arrow keys to nudge it (Shift for 10, Alt for 0.1).
- **Computed pane.** Shows the final value of every property and, when you expand it, the rule it came from. This is where you go when the Styles pane is too noisy. It also draws the box model with real numbers.
- **Layout badges.** Click the `grid`, `flex`, `subgrid`, `container`, or `scroll` badge next to a node to overlay tracks, line numbers, gaps, and free space. The Layout pane has the display options (line names, area names, track sizes).
- **Force state.** The `:hov` button forces `:hover`, `:focus-visible`, `:active`, and friends so that you can inspect states that disappear when you move the mouse.
- **Rendering tab** (Command Menu, then "Show Rendering"). Emulate `prefers-color-scheme`, `prefers-reduced-motion`, `forced-colors`, and the `print` media type, and enable paint flashing and layout-shift regions.
- **Animations panel.** Slow down, scrub, and replay transitions, keyframe animations, and view transitions.
- **Device toolbar.** Resize freely rather than only picking device presets; drag from 320px upwards and watch where the layout breaks.

Outside the browser: [Stylelint](https://stylelint.io/) with `stylelint-config-standard` catches invalid values, duplicate properties, and unknown properties in your editor and CI. Prettier formats CSS. Your editor's CSS language server shows MDN summaries and Baseline status on hover. For quick experiments use CodePen or a local HTML file; for support questions use the compatibility table at the bottom of each MDN page, [caniuse.com](https://caniuse.com/), or [webstatus.dev](https://webstatus.dev/).

### Testing and verifying your work

CSS has no compiler to tell you that a layout is wrong, so "done" means you checked it under the conditions that break layouts. A practical checklist for any component or page:

1. **Width.** Drag the viewport from 320px to very wide. Nothing should scroll horizontally, overlap, or get clipped. Check between your breakpoints, not only at them.
2. **Content.** Replace the tidy placeholder text with a very long word, a very long title, no content at all, and three times as many items. Most layout bugs are content bugs.
3. **Zoom and text size.** Zoom to 200% and 400%, and raise the browser's default font size to 24px. Layouts built with `rem` and intrinsic sizing survive; layouts built with fixed pixel heights do not.
4. **Direction.** Set `dir="rtl"` on `<html>`. If you used logical properties, the layout mirrors correctly.
5. **Preferences.** In the Rendering tab, switch to dark, reduced motion, and forced colours.
6. **Input.** Tab through the page and confirm that every interactive element shows a visible focus indicator. Test hover styles on a touch device or with touch emulation.
7. **Browsers.** Check in Chromium, Firefox, and Safari (or WebKit through Playwright if you do not own a Mac).

Automate what you can. Stylelint in CI catches syntax and typo-level mistakes. Visual regression tests with Playwright's `expect(page).toHaveScreenshot()` catch unintended changes at chosen viewport sizes. An axe-core scan (browser extension or `@axe-core/playwright`) reports contrast failures. Lighthouse flags layout shift, which is frequently a CSS problem: images without dimensions and fonts that swap to different metrics.

When something is off, do not guess. Inspect the element, read the Computed pane, and find out which rule produced the value.

### Tricks and gotchas

- Add `outline: 1px solid red` to `*` temporarily to see every box. Outlines take up no space, so the layout does not change while you debug.
- To find what causes horizontal scroll, run `document.querySelectorAll('*').forEach(el => { if (el.offsetWidth > document.documentElement.offsetWidth) console.log(el) })` in the Console.
- Flex and grid items have `min-width: auto`, so they refuse to shrink below their content. Long words and `<pre>` blocks overflow until you set `min-width: 0` on the item.
- `1fr` means `minmax(auto, 1fr)`. Use `minmax(0, 1fr)` when a track must not grow to fit wide content.
- A percentage `height` only works when the parent has a definite height. Prefer `min-height`, flex, or grid over chains of `height: 100%`.
- `100vh` is taller than the visible area on mobile when the browser toolbar is showing. Use `100dvh` or `100svh`.
- `position: sticky` silently fails when any ancestor between it and the intended scroller has `overflow` set to `hidden`, `auto`, or `scroll`.
- `transform`, `filter`, and `opacity` below 1 create stacking contexts, and `transform` and `filter` also turn the element into the containing block for `position: fixed` descendants.
- Vertical margins collapse in normal flow but never inside flex or grid containers. Use `gap` for spacing between siblings and the problem goes away.
- Unitless `line-height` inherits as a ratio; `line-height: 1.5em` inherits as a computed pixel length and breaks on larger headings.
- Put the `animation-timeline` declaration after the `animation` shorthand, because the shorthand resets it.
- Never remove a focus outline without replacing it. Style `:focus-visible` instead.
- Any browser drops a declaration it does not understand, so write the fallback first and the modern value second.

### Official references

- [MDN: CSS reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference) — every property, selector, at-rule, and function, with compatibility tables.
- [web.dev: Learn CSS](https://web.dev/learn/css) — a structured course from the Chrome team that covers the whole language.
- [CSS Working Group: current work](https://www.w3.org/Style/CSS/current-work) — the index of all CSS specifications and their status.
- [CSS Cascading and Inheritance Level 5](https://drafts.csswg.org/css-cascade-5/) — the cascade, layers, and inheritance, defined precisely.
- [CSS Display Level 3](https://drafts.csswg.org/css-display-3/) — formatting contexts, `display` values, and the box tree.
- [CSS Grid Layout Level 2](https://drafts.csswg.org/css-grid-2/) — the grid specification, including subgrid.
- [CSS Flexible Box Layout Level 1](https://drafts.csswg.org/css-flexbox-1/) — the flexbox specification, including the flex sizing algorithm.
- [web.dev: Baseline](https://web.dev/baseline) — what "widely available" and "newly available" mean and how to use them in decisions.
- [Chrome for Developers: CSS and UI](https://developer.chrome.com/docs/css-ui) — guides to the newer features such as anchor positioning, scroll-driven animations, and view transitions.
- [Chrome DevTools: View and change CSS](https://developer.chrome.com/docs/devtools/css) — the official guide to the Styles and Computed panes.
- [Stylelint: Getting started](https://stylelint.io/user-guide/get-started) — how to set up the linter.

## Skills

### Selectors

A selector is a pattern that the browser matches against elements. The basic kinds are type (`button`), class (`.card`), ID (`#main`), attribute (`[type="email"]`), and universal (`*`). You join them without spaces to form a compound selector (`a.button[target]`), and you join compounds with combinators: descendant (space), child (`>`), next sibling (`+`), and subsequent sibling (`~`).

Browsers match selectors from right to left. `.nav a` means "an `a` that has an ancestor matching `.nav`", so the rightmost compound is the subject, the element that actually gets styled.

Attribute selectors have operators worth memorising: `[href^="https"]` (starts with), `[href$=".pdf"]` (ends with), `[class*="col-"]` (contains), and `[lang|="en"]` (exactly `en` or starts with `en-`). Add ` i` before the bracket closes for case-insensitive matching.

Pseudo-classes select by state or structure: `:hover`, `:focus-visible`, `:checked`, `:disabled`, `:user-invalid`, `:first-child`, `:nth-child(2n + 1)`, `:not(.active)`. Pseudo-elements, written with two colons, style a part of an element or a generated box: `::before`, `::after`, `::placeholder`, `::marker`, `::selection`.

```css
li:nth-child(odd of .visible) { }  /* odd among the .visible items only */
input:not([type="checkbox"], [type="radio"]) { }
```

Common mistakes: confusing `:nth-child()` (counts all siblings) with `:nth-of-type()` (counts siblings of the same tag); forgetting that `.a .b` matches at any depth; and writing `::before` without a `content` declaration, which renders nothing.

**Try it:** Open any large site, and in the DevTools Console run `$$('a[href^="http"]:not([href*="' + location.host + '"])')` to list every external link. Then write selectors for "every second table row", "a label directly followed by a required input", and "the last paragraph in each article", and test each one with `$$()`.

**Resources**
- [MDN: CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors)
- [web.dev: Learn CSS, Selectors](https://web.dev/learn/css/selectors)
- [Selectors Level 4](https://drafts.csswg.org/selectors-4/)

### The cascade

The cascade is the algorithm that picks one winning declaration for each property on each element. It compares competing declarations on a fixed sequence of criteria and stops at the first one that separates them:

1. **Origin and importance.** For normal declarations: user-agent styles lose to user styles, which lose to author styles (yours). `!important` reverses that order, and puts important declarations above all normal ones. Running animations sit above normal author styles, and transitions sit above everything.
2. **Context.** Relevant with shadow DOM: for normal declarations the outer document wins over styles inside a shadow tree.
3. **Inline styles.** A `style` attribute beats any selector-based rule of the same origin and importance.
4. **Layers.** Later `@layer`s beat earlier ones, and unlayered styles beat all layers.
5. **Specificity.**
6. **Scope proximity** (with `@scope`).
7. **Order of appearance.** The last declaration wins.

The important consequence is that specificity is only step five. A selector with three IDs inside an early layer loses to a single class in a later layer, and nothing in your stylesheet beats a declaration that the user marked `!important`.

Remember also that the cascade works per property. Two rules can both "win" on one element, each supplying different properties.

```css
@layer base, components;
@layer components { .btn { color: white; } }
@layer base { #sidebar .btn { color: black; } }  /* loses: earlier layer */
```

A frequent mistake is treating `!important` as "more specificity". It moves the declaration to a different step, which is why the only way to override it is another `!important`.

**Try it:** Create one `<button>` and five competing `color` declarations: a browser default, a type selector, a class, an inline style, and one `!important`. Predict the winner, then remove the winner and predict again until none remain. Confirm each step in the Styles pane.

**Resources**
- [MDN: Introduction to the CSS cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade)
- [web.dev: Learn CSS, The cascade](https://web.dev/learn/css/the-cascade)
- [CSS Cascading and Inheritance Level 5: Cascade sorting order](https://drafts.csswg.org/css-cascade-5/#cascade-sort)

### Specificity

When two declarations come from the same origin and layer, the one whose selector has higher specificity wins. Specificity is three numbers compared from left to right: the count of ID selectors, then the count of classes, attribute selectors, and pseudo-classes, then the count of type selectors and pseudo-elements. `#nav .link` is (1,1,0) and beats `ul li a.link` at (0,1,3), because the first column is compared first. No number of classes outranks one ID.

The universal selector and combinators add nothing. The functional pseudo-classes have special rules:

```css
:is(#main, .card) p { }     /* (1,0,1): takes its most specific argument */
:not(#main) p { }           /* (1,0,1): same rule as :is() */
:has(> img) { }             /* (0,0,1): same rule as :is() */
:where(#main, .card) p { }  /* (0,0,1): :where() always contributes zero */
```

Note the trap in the first line: `:is(#main, .card) p` has ID-level specificity even when the element matched through `.card`. The nesting selector `&` behaves like `:is()` wrapped around the parent selector list, so the same trap exists in nested CSS.

Inline styles are not part of specificity; they win at an earlier cascade step. `!important` is also not specificity.

The usual failure is escalation: someone adds an ID to win, the next person adds `!important`, and soon nothing can be overridden cleanly. Keep specificity low and flat (single classes), write resets and defaults inside `:where()` so that any class overrides them, and use cascade layers to settle precedence between groups of styles. If you need a small boost without changing meaning, repeat the class: `.btn.btn`.

**Try it:** Write down the specificity of `a:hover`, `nav > ul li.active a`, `:where(.card) h2`, `:is(.card, #promo) h2`, and `[data-state="open"]::before`. Then put them in a stylesheet and hover each selector in the Styles pane to check your answers.

**Resources**
- [MDN: Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity)
- [Selectors Level 4: Calculating a selector's specificity](https://drafts.csswg.org/selectors/#specificity-rules)
- [web.dev: Learn CSS, Specificity](https://web.dev/learn/css/specificity)

### Inheritance

When no declaration sets a property on an element, the value comes from one of two places. Inherited properties take the parent's computed value. Non-inherited properties take the property's initial value. As a rule of thumb, properties about text inherit (`color`, `font-*`, `line-height`, `text-align`, `letter-spacing`, `visibility`, `cursor`, `list-style`) and properties about boxes do not (`margin`, `padding`, `border`, `background`, `width`, `display`, `position`). Custom properties inherit by default.

Four keywords work on every property and let you control this explicitly:

- `inherit` takes the parent's computed value, even for a property that does not normally inherit.
- `initial` uses the specification's initial value, which is not the browser's default style. `display: initial` is `inline`, even on a `<div>`.
- `unset` behaves as `inherit` for inherited properties and as `initial` for the rest.
- `revert` rolls back to what the previous origin would have given, which in practice means the browser's default stylesheet. `display: revert` on a `<div>` is `block`. This is usually what people want when they reach for `initial`.

There is also `revert-layer`, which rolls back to the value from the previous cascade layer.

```css
button { font: inherit; color: inherit; }  /* form controls do not inherit fonts by default */
.reset { all: unset; }                     /* every property; display becomes inline */
```

Because inheritance passes computed values, `font-size: 1.5em` on a parent is inherited by children as a pixel length, not as "1.5em again". Unitless `line-height` is the notable exception: the number itself inherits and is recomputed against each element's font size.

**Try it:** Put a `<button>` and an `<input>` inside a container with a custom font. Observe that they ignore it, then fix it with `font: inherit`. Next set `display: initial` and then `display: revert` on a `<li>` and explain the difference you see in the Computed pane.

**Resources**
- [MDN: Inheritance](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Inheritance)
- [MDN: revert](https://developer.mozilla.org/en-US/docs/Web/CSS/revert)
- [web.dev: Learn CSS, Inheritance](https://web.dev/learn/css/inheritance)

### The box model

Every element generates a box with four nested areas: content, padding, border, and margin. Backgrounds paint under the content and padding (and under the border, by default). Margin is always transparent and sits outside the box.

The `box-sizing` property decides what `width` and `height` measure. With the initial value, `content-box`, `width: 300px` sets the content area, and padding and border are added on top, so the element is wider than 300px. With `border-box`, the 300px includes padding and border, which matches how people think about size. Almost every project starts with this rule:

```css
*, *::before, *::after { box-sizing: border-box; }
```

Details that the simple picture leaves out:

- Percentage padding and margin, including top and bottom, resolve against the *inline size* (width) of the containing block. That is surprising, and it is the basis of the old "padding-top aspect ratio" trick that `aspect-ratio` has replaced.
- Vertical padding, border, and margin on an inline element (a `<span>`) paint, but do not push lines apart. Use `display: inline-block` if you need them to affect layout.
- `margin: auto` absorbs free space. In block layout that only works horizontally and only with a definite width; in flex and grid it works in both axes.
- Margins can be negative. Padding cannot.
- `outline` and `box-shadow` are drawn outside the border but take up no space and never cause layout to change.

A typical bug is `width: 100%` plus padding on a `content-box` element, which overflows its parent by twice the padding.

**Try it:** Create a `div` with `width: 200px; padding: 20px; border: 5px solid`. Read its rendered width in the box model diagram of the Computed pane, toggle `box-sizing`, and read it again. Then give it `padding-top: 50%` and resize the parent's width to see which dimension the percentage follows.

**Resources**
- [MDN: Introduction to the CSS box model](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Introduction_to_the_CSS_box_model)
- [MDN: box-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing)
- [web.dev: Learn CSS, Box model](https://web.dev/learn/css/box-model)

### Units

Choose a unit by asking what the length should respond to.

- `px` is a fixed CSS pixel. It does not follow the user's font-size preference. Use it for things that should not scale with text: borders, shadows, small offsets.
- `rem` is relative to the root font size, which is 16px unless the user has changed it. Use it for font sizes and for most spacing, so that the design respects that preference.
- `em` is relative to the element's own font size (or the parent's, when used in `font-size` itself). Use it for things that should scale with the local text, such as button padding or icon size. Nested `em` font sizes compound.
- `%` is relative to something that depends on the property: the containing block's width for `width`, `margin`, and `padding`; the element's own size for `translate`; the parent's font size for `font-size`.
- `ch` is the width of the `0` glyph in the current font. `max-inline-size: 65ch` is a good line length for body text.
- `vw` and `vh` are 1% of the viewport. On mobile, `vh` refers to the large viewport (toolbars retracted), so `100vh` overflows when the toolbars are visible. `svh` is the small viewport, `lvh` the large, and `dvh` the dynamic one that changes as toolbars move. Use `min-height: 100dvh` for full-height layouts, or `100svh` if you do not want the size to change during scroll.
- `fr` is valid only in grid track lists and means a share of the leftover space.
- `cqi` and `cqb` are 1% of a query container's inline or block size.
- `lh` is the element's computed line height, handy for sizing things to a number of lines.

Mistakes to avoid: setting `html { font-size: 62.5% }` to make arithmetic easy, which breaks third-party components that assume 16px; using `px` in media queries (use `em` or `rem`, so that breakpoints respond to text zoom); and using viewport units alone for font size, which stops text from responding to zoom.

**Try it:** Build a button with `padding: 0.5em 1em` and a second one with `0.5rem 1rem`. Change each button's `font-size` and note which padding follows. Then change your browser's default font size in its settings and note which of your page's lengths respond.

**Resources**
- [MDN: CSS values and units](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Values_and_Units)
- [web.dev: The large, small, and dynamic viewport units](https://web.dev/blog/viewport-units)
- [web.dev: Learn CSS, Sizing units](https://web.dev/learn/css/sizing)

### Custom properties

A custom property is a property whose name starts with `--`. It takes part in the cascade and inherits like any other property, and you read it with `var()`.

```css
:root { --accent: oklch(60% 0.2 260); --gap: 1rem; }
.card { padding: var(--gap); border-color: var(--accent); }
.card.compact { --gap: 0.5rem; }            /* scoped override */
.badge { color: var(--badge-color, var(--accent)); }  /* fallback */
```

The mental model is that these are *inherited properties*, not variables in the programming sense. Setting `--gap` on `.card.compact` changes it for that element and its descendants only. This is what makes them good for theming and for component APIs: a component reads `var(--button-bg, blue)`, and any ancestor can set `--button-bg`.

Details that catch people out:

- The fallback in `var(--x, fallback)` is used only when `--x` is not set at all (or is the guaranteed-invalid value). It is not used when `--x` holds a value that is wrong for the property.
- If substitution yields an invalid value, for example `color: var(--gap)`, the declaration becomes "invalid at computed-value time" and the property behaves as `unset`. The browser does not fall back to an earlier `color` declaration in the cascade, because it has already discarded those.
- Values are token sequences, not strings. You cannot build a unit by concatenation: `var(--n)px` is invalid. Write `calc(var(--n) * 1px)`.
- Names are case-sensitive.
- You cannot use `var()` in a media query condition or in a selector.

By default the browser does not know a custom property's type, so it cannot animate it or reject a wrong value. Registering the property fixes both; see the `@property` entry.

From JavaScript, read with `getComputedStyle(el).getPropertyValue('--accent')` and write with `el.style.setProperty('--accent', 'red')`.

**Try it:** Build a `.button` that reads `--button-bg` and `--button-fg` with fallbacks. Create a `.danger` variant and a `.toolbar` parent that each change only custom properties, never `background` directly. Then deliberately set `--button-bg: 12px` and observe what the background becomes.

**Resources**
- [MDN: Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)
- [MDN: var()](https://developer.mozilla.org/en-US/docs/Web/CSS/var)
- [CSS Custom Properties for Cascading Variables Level 1](https://drafts.csswg.org/css-variables/)

### `@property`

An ordinary custom property is untyped: to the browser, `--angle: 45deg` is a list of tokens with no meaning until it is substituted somewhere. Two things follow. The browser cannot interpolate it, so a transition or animation of the property flips from one value to the other at the halfway point. And it cannot tell a bad value from a good one. `@property` registers a custom property with a type, an inheritance rule, and an initial value.

```css
@property --angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.ring {
  background: conic-gradient(from var(--angle), gold, crimson, gold);
  animation: spin 4s linear infinite;
}
@keyframes spin { to { --angle: 360deg; } }
```

Gradients cannot be animated directly, but once `--angle` is known to be an angle, the browser can animate *it*, and the gradient is recomputed on every frame.

The three descriptors:

- **`syntax`** is a string naming the type: `"<length>"`, `"<number>"`, `"<percentage>"`, `"<length-percentage>"`, `"<color>"`, `"<angle>"`, `"<time>"`, `"<integer>"`, `"<image>"`, `"<transform-function>"`, or `"<custom-ident>"`. Combine with `|` for alternatives (`"<length> | auto"`), and add `+` or `#` for space-separated or comma-separated lists. `"*"` accepts anything, and gives no animation.
- **`inherits`** is required. Choose `false` for values that belong to one component, so that they do not leak into nested components.
- **`initial-value`** is required unless the syntax is `"*"`. It must be computationally independent: `10px` is allowed, but `2em` and `var(--other)` are not.

If any descriptor is missing or invalid, the whole rule is ignored without an error, which is the usual reason that "it does not animate".

What registration changes:

- **A real default.** With no declaration anywhere, `var(--angle)` yields the initial value, so no fallback argument is needed.
- **Validation.** A declaration whose value does not match the syntax is invalid at computed-value time, and the property takes its inherited or initial value. An unregistered property would pass the bad value on.
- **Computed values.** A registered `<length>` is resolved where it is declared. `--gap: 2em` becomes a pixel length on that element, and descendants inherit the pixels. Unregistered, each descendant would resolve `2em` against its own font size.

Registrations are global to the document. They are not scoped by selector or layer, a later rule with the same name replaces an earlier one, and `@property` rules inside a shadow tree are ignored. The JavaScript equivalent is `CSS.registerProperty({ name, syntax, inherits, initialValue })`, which throws if the name has already been registered.

`@property` is supported in all current browsers (Firefox was last, in 2024). Animations of custom properties run on the main thread, so they are not as cheap as animating `transform` or `opacity`.

**Try it:** Give a button a `linear-gradient` background built from `--stop: 20%`, and change `--stop` to `80%` on hover with `transition: --stop 400ms`. Observe that it jumps. Register `--stop` as a `<percentage>` and watch it animate. Then remove `inherits` from the rule and confirm in DevTools that the registration has been dropped.

**Resources**
- [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)
- [web.dev: @property: giving superpowers to CSS variables](https://web.dev/articles/at-property)
- [CSS Properties and Values API Level 1](https://drafts.css-houdini.org/css-properties-values-api/)

### Values and functions

The math functions let you compute lengths (and numbers, angles, and times) from mixed units, which the browser resolves at layout time.

`calc()` does arithmetic. The `+` and `-` operators need whitespace on both sides (`calc(100% - 2rem)`); `*` and `/` do not, but at least one operand of `*` must be a plain number, and the right side of `/` must be a number.

`min()` and `max()` take a list and return the smallest or largest. The naming trips everyone up at first: `min()` sets a *maximum* and `max()` sets a *minimum*.

```css
.wrapper { width: min(100% - 2rem, 70rem); }       /* fluid, but never wider than 70rem */
.tap-target { min-height: max(44px, 2.75rem); }    /* never smaller than 44px */
h1 { font-size: clamp(1.75rem, 1.2rem + 2.5vw, 3rem); }
```

`clamp(MIN, VAL, MAX)` is exactly `max(MIN, min(VAL, MAX))`: the preferred value, limited to a range. If the minimum is larger than the maximum, the minimum wins.

You can write arithmetic directly inside `min()`, `max()`, and `clamp()` without wrapping it in `calc()`. All of them accept `var()`, so `calc(var(--columns) * var(--col-width))` works as long as the types multiply correctly. A unitless custom property cannot be added to a length; multiply it by `1px` or `1rem` first.

Newer math functions are available in all current browsers: `round()`, `mod()`, `rem()`, `abs()`, `sign()`, and the trigonometric functions. Check the MDN compatibility table before relying on them for older browsers.

One thing `calc()` cannot do is mix intrinsic keywords with lengths: `calc(auto - 1rem)` is invalid, which is why animating to `height: auto` needs a separate mechanism.

**Try it:** Write a centred page wrapper in one declaration using `min()`, then rewrite it using `max-width` and `margin-inline: auto` with padding, and compare. Next write a `clamp()` font size and find, by resizing, the exact viewport widths at which it stops growing and stops shrinking.

**Resources**
- [MDN: calc()](https://developer.mozilla.org/en-US/docs/Web/CSS/calc)
- [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [web.dev: CSS min(), max(), and clamp()](https://web.dev/articles/min-max-clamp)

### Normal flow

Normal flow is how boxes are laid out when you apply no layout CSS at all. It has two modes. Block-level boxes (`<div>`, `<p>`, `<h1>`, `<section>`) stack in the block direction, one below the other, and by default fill the available inline size. Inline-level boxes (`<span>`, `<a>`, `<em>`, text) flow along a line and wrap into line boxes when they run out of room. `width` and `height` have no effect on a non-replaced inline box, and its vertical margins are ignored.

A block container holds either only block-level boxes or only inline-level content. If you mix them, the browser wraps the runs of inline content in anonymous block boxes.

Margin collapsing is the part of normal flow that surprises people. Adjoining margins in the block direction merge into a single margin equal to the larger of the two. It happens in three situations:

- Between adjacent siblings: a paragraph with `margin-bottom: 2rem` followed by one with `margin-top: 1rem` are 2rem apart, not 3rem.
- Between a parent and its first or last child, when nothing separates them (no padding, border, or inline content). The child's margin "escapes" and appears outside the parent.
- On an empty block, whose own top and bottom margins collapse together.

Margins do not collapse horizontally, across a block formatting context boundary, or inside flex and grid containers. To stop a child's margin escaping, make the parent establish a new block formatting context with `display: flow-root`, or give it padding.

A block formatting context (BFC) is an independent region of block layout. It contains its floats, does not overlap outside floats, and stops margins collapsing through it. `overflow` other than `visible`, `display: flow-root`, flex and grid items, and absolutely positioned elements all create one.

**Try it:** Put an `<h1>` with a top margin inside a `<header>` with a background colour and no padding. Observe the gap that appears *above* the header. Fix it three ways (padding, `display: flow-root`, `display: flex` on the parent) and explain why each works.

**Resources**
- [MDN: Block and inline layout in normal flow](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Block_and_inline_layout_in_normal_flow)
- [MDN: Mastering margin collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing)
- [MDN: Block formatting context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Block_formatting_context)

### `display`

The `display` property answers two questions at once. The *outer* display type says how the box takes part in its parent's layout (`block` or `inline`). The *inner* display type says how its children are laid out (`flow`, `flow-root`, `flex`, `grid`). The familiar single keywords are shorthands: `block` is `block flow`, `flex` is `block flex`, `inline-flex` is `inline flex`, and `inline-block` is `inline flow-root`. The two-keyword syntax is supported in all current browsers.

- `block` starts on a new line and fills the available inline size.
- `inline` flows with text. `width`, `height`, and vertical margins do not apply.
- `inline-block` flows with text on the outside but is a block container inside, so it accepts dimensions. It sits on the text baseline, which explains the small gap under inline-block elements and images; `vertical-align: middle` or `display: block` removes it.
- `flow-root` is a block box that establishes a new block formatting context. It is the clean way to contain floats and stop margins collapsing through an element.
- `none` removes the element and its descendants from both rendering and the accessibility tree. Compare `visibility: hidden`, which keeps the space but hides the element, and `opacity: 0`, which hides it visually but keeps it interactive and announced.
- `contents` removes the element's own box, so that its children take part in the grandparent's layout as if the element were not there. Its margin, padding, border, and background vanish. It has a history of accessibility bugs when used on elements with semantics such as buttons, lists, and tables, so apply it to plain wrapper `<div>`s, and prefer subgrid when the goal is alignment.

Some things change `display` for you: flex and grid items are "blockified", so a `<span>` that is a flex item behaves as a block and accepts width and height. Floated and absolutely positioned elements are blockified as well.

**Try it:** Take a `<ul>` whose `<li>` items each wrap a link and an icon. Make the `<ul>` a grid, set `display: contents` on the `<li>`s, and watch the children become grid items. Then check the accessibility tree in DevTools to see whether list semantics survived.

**Resources**
- [MDN: display](https://developer.mozilla.org/en-US/docs/Web/CSS/display)
- [MDN: Using the multi-keyword syntax with CSS display](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/multi-keyword_syntax_of_display)
- [CSS Display Level 3](https://drafts.csswg.org/css-display-3/)

### Flexbox

Flexbox lays out items along one axis and lets them grow, shrink, and align. `display: flex` on a container makes its children flex items. `flex-direction` sets the main axis (`row` by default, following the inline direction); the cross axis is perpendicular to it. `justify-content` distributes free space on the main axis, `align-items` aligns items on the cross axis, and `gap` puts space between items.

The `flex` shorthand sets `flex-grow`, `flex-shrink`, and `flex-basis`. The keyword forms are worth knowing by heart:

| Declaration | Expands to | Meaning |
| --- | --- | --- |
| `flex: initial` | `0 1 auto` | Sized by content, may shrink, will not grow |
| `flex: auto` | `1 1 auto` | Sized by content, then shares leftover space |
| `flex: 1` | `1 1 0%` | Ignores content size, shares all space equally |
| `flex: none` | `0 0 auto` | Rigid at content size |

The difference between `flex: 1` and `flex: auto` is the basis. With a basis of 0, all the space is "leftover" and items end up equal. With `auto`, content size is reserved first and only the remainder is shared, so items with more content stay larger.

The most common bug: flex items have `min-width: auto`, so an item will not shrink below its min-content size. A long URL or a `<pre>` forces the item, and the page, to overflow. Fix it with `min-width: 0` (or `overflow: hidden`) on the item.

Other points: `flex-wrap: wrap` makes each line an independent flex container, so items do not line up in columns across lines (use grid for that). `align-content` only applies when there are multiple lines. `margin-inline-start: auto` on an item pushes it and everything after it to the far end, which is the standard way to split a toolbar. Avoid `order` and `row-reverse` for anything meaningful, because they change visual order without changing keyboard and screen-reader order.

**Try it:** Build a header with a logo, a nav list, and a button pushed to the right with an auto margin. Then put a very long unbroken string in one nav item, watch it overflow, and fix it with `min-width: 0` and `overflow-wrap: anywhere`. Use the flex overlay in DevTools to see the free space.

**Resources**
- [MDN: Basic concepts of flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox)
- [MDN: Controlling ratios of flex items along the main axis](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Controlling_ratios_of_flex_items_along_the_main_axis)
- [web.dev: Learn CSS, Flexbox](https://web.dev/learn/css/flexbox)

### Grid

Grid lays out items in two dimensions at once. You define tracks (rows and columns) on the container, and items are placed into the cells either automatically or by line number or name.

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
  gap: 1rem;
}
.page {
  display: grid;
  grid-template: "header header" auto
                 "nav    main"   1fr
                 / 15rem minmax(0, 1fr);
  min-height: 100dvh;
}
.page > header { grid-area: header; }
```

The `fr` unit distributes the space left over after fixed and content-sized tracks are resolved. `1fr` is really `minmax(auto, 1fr)`, so a track will grow to fit unbreakable content and blow out the layout; `minmax(0, 1fr)` removes that floor.

`repeat(auto-fill, minmax(16rem, 1fr))` creates as many columns as fit. `auto-fit` does the same and then collapses empty tracks to zero, so a few items stretch to fill the row, whereas with `auto-fill` they stay at column width with empty columns beside them. The `min(16rem, 100%)` inside `minmax()` prevents overflow in containers narrower than 16rem.

Named areas (`grid-template-areas`) give you an ASCII-art map of the layout which you can rearrange in a media query without touching the items. Each row string must have the same number of cells, areas must be rectangles, and `.` marks an empty cell.

The explicit grid is what you define with `grid-template-*`. Items placed outside it, or more items than cells, create implicit tracks, which are sized by `grid-auto-rows` and `grid-auto-columns` (default `auto`). `grid-auto-flow: dense` backfills holes, at the cost of visual order no longer matching source order.

Line numbers start at 1, and negative numbers count from the end of the *explicit* grid, so `grid-column: 1 / -1` spans all explicit columns. Alignment uses `justify-items` and `align-items` for items within their cells, and `justify-content` and `align-content` for the tracks within the container. `place-items: center` centres in both axes.

**Try it:** Build a card gallery with the `auto-fit` pattern above and resize from 320px to 1600px. Switch to `auto-fill` with only two cards and note the difference. Then turn on the grid overlay with line numbers and place one card with `grid-column: 1 / -1`.

**Resources**
- [MDN: Basic concepts of grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout)
- [web.dev: Learn CSS, Grid](https://web.dev/learn/css/grid)
- [CSS-Tricks: A Complete Guide to CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)

### Subgrid

Grid only places the direct children of the grid container. The children of those children know nothing about the parent's tracks, which makes one common design hard: a row of cards in which every card's title, body, and footer line up with the neighbours', whatever the content length. Subgrid solves this. A grid item that is itself a grid can set `grid-template-columns: subgrid` or `grid-template-rows: subgrid` (or both) to adopt the parent's tracks for the area it spans, instead of defining its own.

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1.5rem;
}
.card {
  display: grid;
  grid-row: span 3;              /* the card occupies three parent rows */
  grid-template-rows: subgrid;   /* and its children use those rows */
  gap: 0.5rem;                   /* may override the inherited gap */
}
```

Each card spans three implicit rows of the parent. Because the rows are shared, the tallest title in a row sets the title row's height for every card in that row.

What to remember:

- The subgrid must span the tracks it wants to share. The number of tracks it gets equals its span, so `grid-row: span 3` is what gives it three rows.
- A subgridded axis cannot have implicit tracks. Extra children pile into the last track.
- The subgrid inherits the parent's `gap` but can set its own.
- Line names from the parent pass through, and the subgrid can add its own names: `grid-template-columns: subgrid [start] [middle] [end]`.
- Line numbers inside the subgrid restart at 1.
- Content inside a subgrid contributes to the parent's track sizing, which is the whole point.

Subgrid is supported in all major browsers and has been since 2023. Before it, the workaround was `display: contents`, which discards the wrapper's box and can damage semantics.

**Try it:** Build three cards with a heading, a paragraph, and a link, with very different text lengths. First make each card an independent grid and note the misaligned links. Then apply the subgrid pattern above and inspect the parent with the grid overlay to see the shared row lines.

**Resources**
- [MDN: Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid)
- [web.dev: CSS subgrid](https://web.dev/articles/css-subgrid)
- [CSS Grid Layout Level 2: Subgrids](https://drafts.csswg.org/css-grid-2/#subgrids)

### Positioning

The `position` property takes an element out of, or offsets it from, where normal layout would place it. The inset properties (`top`, `right`, `bottom`, `left`, or the logical `inset-block-start` and so on, and the `inset` shorthand) say where.

- `static` is the default. Insets and `z-index` do nothing.
- `relative` keeps the element's space in the flow and offsets it visually from there. Its main use is to make the element a containing block for absolutely positioned descendants.
- `absolute` removes the element from flow. It is positioned against the padding box of its nearest ancestor that has a `position` other than `static`. If there is none, it uses the initial containing block (roughly the viewport at the top of the page).
- `fixed` removes the element from flow and positions it against the viewport, so it stays put during scrolling.
- `sticky` is a hybrid: it behaves as `relative` until its nearest scrolling ancestor is scrolled past the inset threshold you give, and then it sticks, but only within the bounds of its parent.

The containing block is the concept that explains the surprises. An ancestor with `transform`, `filter`, `perspective`, `backdrop-filter`, `will-change` naming one of those, or `contain: paint` or `layout` becomes the containing block for `fixed` *and* `absolute` descendants. That is why a "fixed" modal inside a transformed card scrolls with the page.

Sticky fails for three recurring reasons: no inset is set (`top: 0` is required); an ancestor has `overflow: hidden`, `auto`, or `scroll`, which makes that ancestor the scroller it sticks to; or the parent is no taller than the sticky element, leaving no room to travel.

`inset: 0` with `position: absolute` stretches a box to its containing block. With an explicit size and `margin: auto`, it centres it.

**Try it:** Make a table with a `position: sticky; top: 0` header inside a wrapper. Add `overflow-x: auto` to the wrapper and watch the header stop sticking to the page. Then create a `position: fixed` box inside an element with `transform: translateX(0)` and scroll.

**Resources**
- [MDN: position](https://developer.mozilla.org/en-US/docs/Web/CSS/position)
- [MDN: Layout and the containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block)
- [web.dev: Learn CSS, Z-index and stacking contexts](https://web.dev/learn/css/z-index)

### Floats

A float is taken out of normal flow and pushed to one side of its container, and the *text* that follows wraps around it. That is the job floats were designed for, and it is still the only way to do it: a picture in an article with the paragraphs flowing around it.

```css
.figure {
  float: inline-start;              /* or left / right / inline-end */
  inline-size: 40%;
  margin: 0 1.5rem 1rem 0;
}
.avatar {
  float: left;
  border-radius: 50%;
  shape-outside: circle(50%);       /* text follows the curve, not the box */
  shape-margin: 0.75rem;
}
.article { display: flow-root; }    /* contain the floats */
.article h2 { clear: both; }        /* never start a heading beside a float */
```

How floats behave:

- The float is removed from flow, so the block boxes that follow slide *under* it as though it were not there. Only their line boxes are shortened. This is why a following block's background and border run behind the float while its text wraps.
- A float never contributes to its parent's height. A parent that contains only floats collapses to zero height, and a float taller than the surrounding text hangs out of the bottom of its container.
- `float` makes the element block-level, and `width: auto` shrinks to fit its content.
- `float` has no effect on flex or grid items, or on absolutely positioned elements.

Two tools deal with the consequences. `clear: left`, `right`, or `both` on a later element moves it below earlier floats. To make a parent *contain* its floats, turn it into a block formatting context with `display: flow-root`.

`shape-outside` changes the outline that the text wraps around. It takes `circle()`, `ellipse()`, `inset()`, `polygon()`, or an image whose alpha channel defines the shape (the image must be same-origin or served with CORS headers). It applies only to floats, and it does not clip the element; pair it with `clip-path` or `border-radius` if the visible shape should match.

You will also meet floats used for *page layout* in code written before flexbox and grid: columns given `float: left` and percentage widths, wrapped in a row with a "clearfix":

```css
.clearfix::after { content: ""; display: table; clear: both; }
```

The pseudo-element is a cleared box at the end of the container, which forces the container to extend past its floats. Other signs are `overflow: hidden` on a wrapper with no apparent reason (it creates a block formatting context, and so contains floats), and an empty element with `clear: both`. When you maintain such code, replace the float grid with flexbox or grid, and the clearfix with `display: flow-root`. Do not write new layouts with floats.

**Try it:** Float an image in a long article and give it `shape-outside: circle(50%)`; turn on the shape overlay in DevTools by clicking the icon beside the value. Then put two floated columns inside a wrapper that has a background colour, watch the background vanish, and restore it first with a clearfix and then with `display: flow-root`.

**Resources**
- [MDN: float](https://developer.mozilla.org/en-US/docs/Web/CSS/float)
- [MDN: Floats (Learn web development)](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Floats)
- [MDN: shape-outside](https://developer.mozilla.org/en-US/docs/Web/CSS/shape-outside)

### Stacking contexts

`z-index` does not set a global depth. It orders an element *within its stacking context*, and a stacking context is flattened into a single layer in its parent's context. Once a group is flattened, nothing inside it can rise above, or sink below, anything outside it, no matter what number you use.

So `z-index: 9999` "doesn't work" for one of two reasons:

1. The element is not positioned (and is not a flex or grid item), so `z-index` does not apply at all.
2. An ancestor forms a stacking context that itself sits below the thing you want to cover. Your 9999 only competes with siblings inside that ancestor.

What creates a stacking context is a longer list than most people expect: the root element; `position: relative` or `absolute` with a `z-index` other than `auto`; `position: fixed` or `sticky`; a flex or grid item with a `z-index` other than `auto`; `opacity` less than 1; any `transform`, `filter`, `backdrop-filter`, `perspective`, `clip-path`, or `mask`; `mix-blend-mode` other than `normal`; `isolation: isolate`; `will-change` naming one of these properties; and `contain: paint` or `layout`.

```css
.header { position: relative; z-index: 2; }
.main   { position: relative; z-index: 1; }   /* creates a context */
.main .modal { position: fixed; z-index: 9999; }  /* still under .header */
```

To debug, walk up the ancestors from the stuck element and look for the properties above, then compare the *ancestor contexts*, not the element itself. To fix, either lift the element out of the trapping ancestor in the DOM or raise that ancestor.

Two tools remove most `z-index` battles. `isolation: isolate` on a component creates a context deliberately, so internal `z-index` values cannot leak out. And the top layer, used by `<dialog>` opened with `showModal()` and by the Popover API, renders above every stacking context in the document, with no `z-index` needed.

**Try it:** Reproduce the example above and confirm that the modal is hidden behind the header. Fix it without changing any `z-index` value on the modal. Then add `opacity: 0.99` to an unrelated wrapper around some overlapping elements and observe how the paint order changes.

**Resources**
- [MDN: Stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context)
- [Josh W. Comeau: What the heck, z-index??](https://www.joshwcomeau.com/css/stacking-contexts/)
- [web.dev: Learn CSS, Z-index and stacking contexts](https://web.dev/learn/css/z-index)

### Overflow and scrolling

Overflow is what happens when content is larger than its box. `overflow: visible` (the default) lets it spill out and paint over neighbours. `hidden` clips and prevents user scrolling, though the box can still be scrolled by script and by focus. `scroll` always shows scrollbars. `auto` shows them only when needed. `clip` clips without creating a scroll container at all.

Any value other than `visible` and `clip` makes the element a *scroll container*, and that has side effects: it establishes a block formatting context, it becomes the reference box for `position: sticky` descendants, and it clips them. You also cannot have one axis visible and the other scrolling: if you set `overflow-x: auto`, a `visible` `overflow-y` computes to `auto`. Use `overflow-x: clip` when you want to clip one axis and leave the other visible.

Useful companions:

- `scrollbar-gutter: stable` reserves space for the scrollbar so that content does not shift when it appears.
- `overscroll-behavior: contain` stops scroll chaining, so reaching the end of a modal or sidebar does not start scrolling the page behind it, and it suppresses pull-to-refresh on that element.
- `scroll-behavior: smooth` animates programmatic and anchor scrolling. Put it inside a `prefers-reduced-motion: no-preference` query.
- `scroll-margin-top` on targets, or `scroll-padding-top` on the scroller, keeps anchored headings from hiding under a sticky header.

Scroll snap makes a scroller settle on particular positions:

```css
.carousel {
  display: flex; overflow-x: auto;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
}
.carousel > * { flex: 0 0 80%; scroll-snap-align: center; }
```

`mandatory` always snaps; `proximity` snaps only when the scroll ends near a snap point. Avoid `mandatory` when an item can be larger than the scroller, because parts of it may become unreachable.

A scrollable region that contains no focusable element must still be reachable by keyboard. Chrome and Firefox make such scrollers focusable automatically, but Safari does not, so adding `tabindex="0"` with an accessible name remains the dependable approach.

**Try it:** Build the carousel above with five slides. Try both `mandatory` and `proximity`. Then put a tall scrollable panel in a page that also scrolls, scroll the panel to its end, and note the page starting to move. Add `overscroll-behavior: contain` and try again.

**Resources**
- [MDN: overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow)
- [MDN: Basic concepts of scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap/Basic_concepts)
- [MDN: overscroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior)

### Sizing

There are two ways for a box to get its size. *Extrinsic* sizing comes from the context: a fixed length, a percentage of the parent, or stretching to fill the container. *Intrinsic* sizing comes from the content. Robust layouts lean on intrinsic sizes and use extrinsic values as limits.

The intrinsic keywords:

- `min-content` is the smallest size the box can take without overflowing: for text, the width of the longest word.
- `max-content` is the size the content would take with unlimited room: for text, the whole paragraph on one line.
- `fit-content` is "shrink to fit": use the available space, but never less than `min-content` and never more than `max-content`. This is how floats, inline-blocks, and absolutely positioned boxes size by default.

```css
.tag    { width: fit-content; }            /* a block as wide as its text */
.dialog { width: min(90vw, 40rem); max-height: 80dvh; }
.thumb  { aspect-ratio: 16 / 9; width: 100%; object-fit: cover; }
```

`width: auto` on a block does not mean the same as `width: 100%`. `auto` fills the containing block *including* the element's margins; `100%` sets the box to the full width and then adds margins, which overflows.

Percentage heights resolve only when the parent's height is definite. If the parent's height comes from its content, `height: 50%` behaves as `auto`.

`aspect-ratio` derives one dimension from the other when only one is set. It is a preference, not a constraint: content taller than the ratio allows will stretch the box, because of the automatic minimum size. Add `min-height: 0` or `overflow: hidden` to enforce it. The `width` and `height` attributes on `<img>` give the browser an aspect ratio before the image loads, which prevents layout shift.

Prefer `max-width` to `width`, and `min-height` to `height`. A fixed height is a promise that the content will never grow, and text always grows.

**Try it:** Give three identical paragraphs `width: min-content`, `max-content`, and `fit-content` inside a 300px parent and compare them. Then make a box with `aspect-ratio: 1` and `width: 10rem`, fill it with a long paragraph, and work out why it is no longer square.

**Resources**
- [web.dev: Learn CSS, Sizing units](https://web.dev/learn/css/sizing)
- [MDN: aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)
- [CSS Box Sizing Level 3](https://drafts.csswg.org/css-sizing-3/)

### Logical properties

Physical properties name sides of the screen: left, right, top, bottom. Logical properties name directions relative to the flow of text: *inline* is the direction a line of text runs, and *block* is the direction in which lines and paragraphs stack. In English, inline is left to right and block is top to bottom. In Arabic or Hebrew, inline runs right to left. In vertical Japanese, inline runs top to bottom.

| Physical | Logical |
| --- | --- |
| `width`, `height` | `inline-size`, `block-size` |
| `margin-left`, `margin-right` | `margin-inline-start`, `margin-inline-end` |
| `padding-top` and `padding-bottom` together | `padding-block` |
| `left: 0; right: 0` | `inset-inline: 0` |
| `border-top-left-radius` | `border-start-start-radius` |
| `text-align: left` | `text-align: start` |

If you write `margin-inline-start: 1rem` on an icon's label, the space appears on the left in English and on the right in Arabic, with no extra CSS. With `margin-left`, you would need a separate rule for `[dir="rtl"]`.

Flexbox and grid are already logical: `row` follows the inline direction, and `justify-content: flex-start` means the start of the line, not the left. Mixing them with physical margins is what produces half-mirrored layouts.

The shorthands are a reason to use logical properties even if you never ship a right-to-left language. `margin-inline: auto` centres without touching the block margins, and `padding-block: 1rem` sets top and bottom without resetting the sides.

Not everything has a logical form. The four-value `margin` and `padding` shorthands remain physical, and transforms and `background-position` keywords are physical. Media queries still use `width`, since the viewport has no writing mode.

Use physical properties when the meaning truly is physical: a shadow that falls downwards, or an element pinned to the top of the viewport.

**Try it:** Take a card with an icon, text, and a close button in the corner, written with physical properties. Add `dir="rtl"` to `<html>` and list what looks wrong. Convert every declaration to its logical form and check again, then try `writing-mode: vertical-rl` on the card.

**Resources**
- [MDN: CSS logical properties and values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)
- [web.dev: Learn CSS, Logical properties](https://web.dev/learn/css/logical-properties)

### Mobile-first

Mobile-first means that the styles outside any media query describe the narrow layout, and `min-width` queries add complexity as room becomes available. It works well because the narrow layout is usually the simple one (a single column in source order), which is close to what normal flow gives you for free. You add columns; you do not undo them.

```css
.layout { display: grid; gap: 1rem; }              /* one column everywhere */

@media (width >= 48em) {
  .layout { grid-template-columns: 15rem 1fr; }    /* sidebar when it fits */
}
```

The alternative, desktop-first with `max-width` queries, forces you to write overrides that cancel earlier rules, and the smallest devices have to process the most CSS.

Practical guidance:

- Include `<meta name="viewport" content="width=device-width, initial-scale=1">`. Without it, phones render the page at about 980px wide and scale it down, and none of your queries behave as intended.
- Choose breakpoints where *your content* breaks, by widening the window until the layout looks wrong, and not at device widths. There is no reliable list of device sizes.
- Write breakpoints in `em` so that they respond to the user's font size.
- Many layouts need no breakpoints at all. `flex-wrap`, `repeat(auto-fit, minmax(...))`, `min()`, and `clamp()` adapt continuously. Use media queries for changes of structure, such as a sidebar appearing.
- Start testing at 320 CSS pixels. That is the width required by the WCAG reflow criterion and the size of the smallest phones still in use.
- "Mobile" is not only about width. Small screens usually mean touch input, no hover, and a slower network, so check `hover` and `pointer` queries and keep touch targets at least 24 by 24 CSS pixels, preferably 44.

Mobile-first is a way of writing CSS, not a way of designing only for phones. Wide layouts deserve the same care; they are simply expressed as additions.

**Try it:** Take a page you wrote desktop-first, or any three-column layout. Delete every media query, make it work as a single column at 320px, then add back `min-width` queries only at the widths where the content starts to look stretched. Count the lines of CSS before and after.

**Resources**
- [MDN: Responsive web design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design)
- [web.dev: Learn Responsive Design](https://web.dev/learn/design)

### Media queries

A media query applies a block of CSS only when a condition about the device or the user's preferences is true. The condition can test the viewport, the input devices, or settings in the operating system.

```css
@media (width >= 48em) { }                          /* range syntax */
@media (48em <= width < 80em) { }
@media (prefers-color-scheme: dark) { }
@media (prefers-reduced-motion: no-preference) { .hero { animation: rise 600ms; } }
@media (hover: hover) and (pointer: fine) { .card:hover { translate: 0 -2px; } }
```

The range syntax (`width >= 48em`) is supported in all current browsers and is clearer than `min-width`, especially for exclusive bounds. Combine conditions with `and`, `or`, and `not`, and separate alternatives with commas.

What you should know about each feature:

- **Width.** Lengths in `em` or `rem` refer to the browser's default font size, not to your `html` font size, so `48em` is 768px at default settings and scales when the user enlarges text.
- **`prefers-color-scheme`** reports the user's light or dark preference.
- **`prefers-reduced-motion`** reports a system setting used by people with vestibular disorders. Write motion inside `no-preference`, or remove it inside `reduce`. Reduced does not have to mean none: a fade is usually fine where a slide is not.
- **`hover` and `pointer`** describe the *primary* input device. `(hover: none)` and `(pointer: coarse)` describe a touchscreen. `any-hover` and `any-pointer` test whether *any* available input qualifies, which matters for laptops with touchscreens. Never hide essential content behind hover alone.
- **Others worth knowing:** `prefers-contrast`, `forced-colors` (Windows high contrast), `orientation`, `print`, and `resolution`.

Media queries add no specificity, so order still decides between equal selectors, which is why mobile-first files list queries in ascending order. They can be nested inside rules with native nesting. From JavaScript, `matchMedia('(width >= 48em)')` returns an object with `.matches` and a `change` event.

You cannot use `var()` in a query condition, because custom properties belong to elements and a query is evaluated against the document.

**Try it:** Add a hover lift effect to a card and wrap it in a `hover` and `pointer` query. In DevTools, turn on device emulation with touch and confirm that the effect is not applied. Then open the Rendering tab, emulate `prefers-reduced-motion: reduce`, and make every animation on your page respect it.

**Resources**
- [MDN: Using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries)
- [MDN: @media](https://developer.mozilla.org/en-US/docs/Web/CSS/@media)
- [web.dev: Learn Responsive Design, Media queries](https://web.dev/learn/design/media-queries)

### Container queries

A media query asks about the viewport. A component, however, usually cares about the space *it* has: the same card may sit in a wide main column and in a narrow sidebar on the same page. A container query lets descendants respond to the size of an ancestor.

```css
.card-wrapper { container: card / inline-size; }   /* name / type */

.card { display: grid; gap: 1rem; }

@container card (inline-size > 30em) {
  .card { grid-template-columns: 12rem 1fr; }
}
```

There are two steps. First, declare a container with `container-type` (and optionally `container-name`). `inline-size` is nearly always the type you want; `size` lets you query both axes but requires the container to have a height that does not depend on its content. Second, write `@container` rules. Each element inside looks up its nearest ancestor container (with the given name, if any) and evaluates the condition against it.

Rules that people run into:

- An element cannot query itself. The `@container` rule styles descendants of the container. That is why the example has a wrapper. This restriction prevents loops in which a style changes the size that triggered the style.
- `container-type: inline-size` applies inline-size containment: the container's width can no longer depend on its children. A container that was shrink-to-fit (a float, an inline-block, or an `auto`-sized flex item) may collapse to zero width. Give it a width from its context.
- Earlier implementations also applied layout containment, which made every container a stacking context and a containing block for fixed-position descendants. The specification has since dropped that requirement and browsers are removing it, so do not rely on either behaviour: test in each engine if your container holds fixed-position or `z-index`ed content.
- Container query length units are available inside: `cqi` is 1% of the container's inline size. `font-size: clamp(1rem, 4cqi, 2rem)` scales a heading with its component.

Size queries are supported in every major browser. *Style queries* test the computed value of a custom property on the container, as in `@container style(--variant: compact)`. They work without `container-type`, since every element is a style container. Firefox was the last engine to ship them, in 2026, so check the compatibility table if you support older versions.

Use media queries for page-level layout and user preferences, and container queries for components.

**Try it:** Build the card above and place the same markup in a 20rem sidebar and a 50rem main column. Confirm that the two instances lay out differently at one viewport width. Click the `container` badge in DevTools to see the container's bounds.

**Resources**
- [MDN: CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [MDN: @container](https://developer.mozilla.org/en-US/docs/Web/CSS/@container)
- [web.dev: Learn CSS, Container queries](https://web.dev/learn/css/container-queries)

### Fluid type and space

Instead of jumping between fixed sizes at breakpoints, a fluid value scales smoothly between a minimum and a maximum as the viewport (or container) grows. `clamp()` expresses it in one declaration.

```css
h1 { font-size: clamp(2rem, 1.43rem + 2.86vw, 4rem); }
.section { padding-block: clamp(2rem, 1rem + 5vw, 6rem); }
```

The middle argument is a straight line: a `rem` intercept plus a `vw` slope. To derive it, decide the size at two viewport widths. For 2rem at 320px (20rem) and 4rem at 1440px (90rem):

1. Slope is (4 − 2) / (90 − 20) = 0.0286, so 2.86vw.
2. Intercept is 2 − 0.0286 × 20 = 1.43rem.

Below 320px the minimum applies, and above 1440px the maximum applies.

The accessibility point matters more than the arithmetic. A font size written only in `vw` does not change when the user zooms, because zooming does not change the viewport width in `vw` terms the way it changes `rem`. That can fail WCAG's requirement that text be resizable to 200%. Always include a `rem` component in the preferred value and write the bounds in `rem`, and test by zooming to 200% to check that the text really does get larger. Keep the ratio between maximum and minimum modest (about 2.5 or less) for the same reason.

Fluid scales work best as a small set of custom properties (`--step-0` to `--step-5`, `--space-s` to `--space-xl`) generated together, so that the ratios between steps stay consistent. Inside a component, use `cqi` in place of `vw` to scale with the container.

Do not make everything fluid. Body text is comfortable in a narrow range of roughly 1rem to 1.25rem. Headings and large section spacing benefit most.

**Try it:** Calculate by hand a `clamp()` for a heading that is 1.5rem at 360px and 3rem at 1200px. Apply it, then check the computed font size in DevTools at 360px, 780px, and 1200px against your prediction. Finally zoom to 200% and confirm the text grows.

**Resources**
- [web.dev: CSS min(), max(), and clamp()](https://web.dev/articles/min-max-clamp)
- [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [Utopia: Fluid type scale calculator](https://utopia.fyi/type/calculator/)

### Responsive images in CSS

HTML chooses *which file* to download (`srcset`, `sizes`, `<picture>`). CSS decides how the image *fits its box*, and it handles decorative images that are not in the HTML at all.

For `<img>` and `<video>`, start with a reset so that images never overflow their container and keep their ratio:

```css
img, video { max-inline-size: 100%; block-size: auto; }
```

When the box's shape differs from the image's, `object-fit` controls the result. `fill` (the default) stretches and distorts. `cover` fills the box and crops the excess. `contain` shows the whole image and leaves empty bands. `scale-down` behaves as `contain` but never enlarges. `object-position` chooses which part survives cropping, for example `object-position: 50% 20%` to keep faces in frame.

```css
.avatar { inline-size: 4rem; aspect-ratio: 1; object-fit: cover; border-radius: 50%; }
```

For backgrounds, `background-size: cover` and `contain` are the counterparts, `background-position` sets the focal point, and `background-repeat: no-repeat` is nearly always wanted. A percentage `background-position` aligns the same point of the image and the box: `100% 100%` puts the image's bottom-right corner at the box's bottom-right corner.

`image-set()` is `srcset` for CSS. It lets the browser choose by pixel density and by supported format:

```css
.hero {
  background-image: url("hero.jpg");                 /* fallback */
  background-image: image-set(
    url("hero.avif") type("image/avif"),
    url("hero.jpg") type("image/jpeg"));
}
```

You can also swap background files inside media queries, since browsers generally download only the background images for rules that apply.

Background images have costs. They are invisible to assistive technology and have no `alt`, the preload scanner cannot discover them early, and they cannot use `loading="lazy"`. If an image is content, or it is the largest thing on screen, use `<img>` with `object-fit` in place of a background. Keep the `width` and `height` attributes on `<img>` so that the browser reserves the right space.

**Try it:** Put a wide landscape photo into a square box using `<img>`, and cycle `object-fit` through all its values. Use `object-position` to keep the subject visible in the `cover` case. Then rebuild it as a `background-image` and list what you lost.

**Resources**
- [MDN: object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)
- [MDN: image-set()](https://developer.mozilla.org/en-US/docs/Web/CSS/image/image-set)
- [MDN: background-size](https://developer.mozilla.org/en-US/docs/Web/CSS/background-size)

### Print styles

People print, and save as PDF, more than developers assume: invoices, tickets, recipes, articles, documentation. Without print styles they get the navigation bar, the cookie banner, and content cut off in mid-table. A print stylesheet is usually fifty lines.

```css
@media print {
  nav, .sidebar, .cookie-banner, button, video { display: none !important; }

  body { font: 11pt/1.4 Georgia, serif; color: #000; background: #fff; }
  main { max-width: none; margin: 0; }

  h2, h3 { break-after: avoid; }                       /* keep headings with their text */
  figure, table, pre, blockquote { break-inside: avoid; }
  .chapter { break-before: page; }
  p { orphans: 3; widows: 3; }

  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.9em; }
}

@page { size: A4; margin: 2cm; }
@page :first { margin-top: 3cm; }
```

The ideas behind it:

- **Remove what cannot work on paper:** navigation, controls, adverts, media players. Expand what is hidden behind interaction, such as collapsed accordions and truncated text.
- **Linearise.** Drop multi-column page layouts to a single column and remove fixed widths and heights. A `position: fixed` element is repeated on every page; `sticky` elements should become `static`.
- **Control fragmentation.** `break-before`, `break-after`, and `break-inside` are the current properties; the `page-break-*` names are legacy aliases. They are requests, not guarantees: the browser breaks inside a box that is taller than a page whatever you ask. Fragmentation inside flex and grid containers is less dependable than in block layout, so switch large containers to `display: block` for print. `orphans` and `widows` set the minimum number of lines left at the bottom and top of a page; Firefox does not support them.
- **`@page`** sets the paper size and margins, with the `:first`, `:left`, and `:right` pseudo-classes. Page margin boxes such as `@top-center`, for running headers and page numbers, work only in Chromium at the time of writing. Otherwise, headers and footers are the browser's own, which the user can turn off in the print dialog.
- **Colour.** Browsers omit backgrounds by default to save ink. Do not rely on a background for meaning or contrast. `print-color-adjust: exact` asks the browser to keep backgrounds and colours on a particular element, such as a chart legend. Force a light theme: a dark-mode page should not print white text.
- **Units.** `pt`, `cm`, `mm`, and `in` are accurate on paper, and are appropriate here.
- A `<thead>` is repeated at the top of every page that a table spans.

Images marked `loading="lazy"` that have not been scrolled into view may be missing from the printout.

To test without wasting paper, open the Rendering tab in DevTools and set "Emulate CSS media type" to `print`, which lets you inspect the print styles like any others. Then check the real print preview (and "Save as PDF") for the page breaks, which emulation does not show. Test in more than one browser, as print engines differ more than screen rendering does.

**Try it:** Open a long article or a recipe page that you have built and look at its print preview. Write a print stylesheet that hides the chrome, prints link URLs, keeps headings attached to the following paragraph, and never splits a figure across pages. Check the result as a PDF from two browsers.

**Resources**
- [MDN: Printing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing)
- [MDN: @page](https://developer.mozilla.org/en-US/docs/Web/CSS/@page)
- [MDN: break-inside](https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside)

### Typography

Good typography in CSS comes down to a handful of properties set with care.

**Font stacks.** `font-family` is a prioritised list ending in a generic family. The browser uses the first font that is available, per character. `font-family: system-ui, sans-serif` uses the operating system's interface font and costs no download. Quote names that contain spaces.

**Line height.** Use a unitless number, as in `line-height: 1.5`. A unitless value is inherited as a ratio and recomputed for each element's font size. A value with a unit is inherited as a fixed length, so a large heading ends up with overlapping lines. Body text wants about 1.5; large headings want about 1.1 to 1.2.

**Weight.** `font-weight` takes 1 to 1000; `400` is normal and `700` is bold. If the font has no matching weight file, the browser picks the nearest one or synthesises bold by smearing the glyphs, which looks poor. `font-synthesis: none` turns that off so that the gap becomes obvious.

**Measure.** Line length affects readability. Aim for roughly 45 to 75 characters: `max-inline-size: 65ch`.

**Wrapping.** `text-wrap: balance` makes the lines of a block roughly equal in length, which suits headings and captions. Browsers apply it only to short blocks (a handful of lines), because it is expensive. `text-wrap: pretty` improves paragraphs by avoiding a single short word on the last line; Firefox does not support it at the time of writing, and it degrades harmlessly. `overflow-wrap: anywhere` breaks long strings such as URLs to prevent overflow, and `hyphens: auto` needs a correct `lang` attribute.

```css
body { font: 1rem/1.5 system-ui, sans-serif; }
h1, h2 { line-height: 1.15; text-wrap: balance; }
p { max-inline-size: 65ch; text-wrap: pretty; }
```

Also useful: `font-variant-numeric: tabular-nums` for columns of numbers that must align, `letter-spacing` in `em` for uppercase labels, and a spacing rhythm built from margins on one side only.

Keep body text at 1rem or larger, and never set the root font size in pixels, because that overrides the user's preference.

**Try it:** Set a long article in a single column with no styles. Apply the six declarations above one at a time and note what each changes. Then use the Fonts section of the Computed pane (or the Fonts tab in Firefox) to see which font file actually rendered each element.

**Resources**
- [web.dev: Learn CSS, Typography](https://web.dev/learn/css/typography)
- [MDN: text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap)
- [MDN: line-height](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height)

### Web fonts

`@font-face` tells the browser about a font file and the family name, weight, and style it provides. The file is downloaded only when some text on the page needs that exact combination.

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-var.woff2") format("woff2");
  font-weight: 100 900;          /* a variable font's weight range */
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF;    /* Latin subset */
}
```

WOFF2 is the only format you need to serve today.

`font-display` controls what happens while the file loads. `block` hides the text for up to about three seconds (a flash of invisible text). `swap` shows fallback text at once and swaps when the font arrives, which keeps text readable but can shift the layout. `fallback` gives a very short block period and a short swap window. `optional` uses the web font only if it is already available almost immediately, so there is never a late swap; it is the best choice for performance when the brand font is not essential.

To reduce the shift caused by swapping, define a fallback face whose metrics match the web font, using `size-adjust`, `ascent-override`, and `descent-override` on an `@font-face` that points at `local("Arial")`.

A **variable font** holds a whole range of weights, and sometimes widths or slants, in one file. Declare the range in `@font-face` and then use ordinary `font-weight: 550`. Reach for `font-variation-settings` only for custom axes, because it does not cascade per axis.

**Subsetting** removes glyphs you do not need, which can cut a file from hundreds of kilobytes to tens. `unicode-range` lets you split a family into several files, and the browser downloads only those that cover characters on the page.

For loading: self-host the fonts (a third-party host gives no shared-cache benefit any more), preload only the one or two most important files with `<link rel="preload" as="font" type="font/woff2" crossorigin>` (the `crossorigin` attribute is required even for the same origin), and limit the number of families.

**Try it:** Load a variable font with the rule above. In the Network panel, throttle to Slow 4G and reload with `font-display` set to `block`, `swap`, and `optional` in turn, describing what you see each time. Then check in the Network panel that an unused weight was not downloaded.

**Resources**
- [MDN: @font-face](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face)
- [web.dev: Best practices for fonts](https://web.dev/articles/font-best-practices)
- [MDN: Variable fonts guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide)

### Colour

CSS offers several notations for the same colours, plus newer ones that reach colours the old notations cannot.

- **Hex** (`#1e90ff`, with an optional alpha as in `#1e90ff80`) and **`rgb()`** describe sRGB channels. They are compact, but hard to adjust by eye.
- **`hsl()`** uses hue, saturation, and lightness. It is easier to reason about, but its lightness is not perceptual: `hsl(60 100% 50%)` (yellow) looks far brighter than `hsl(240 100% 50%)` (blue), though both claim 50%.
- **`oklch()`** uses lightness, chroma, and hue in a perceptually uniform space. Equal changes in L look like equal changes in brightness, whatever the hue. That makes it the right tool for building palettes: fix L and C, rotate H, and the colours match in visual weight. It can also describe colours outside sRGB, on displays that support wider gamuts.

```css
:root {
  --brand: oklch(62% 0.19 255);
  --brand-hover: oklch(from var(--brand) calc(l - 0.08) c h);   /* relative colour */
  --brand-subtle: color-mix(in oklch, var(--brand) 15%, white);
  --overlay: rgb(0 0 0 / 0.5);
}
```

The modern syntax uses spaces between channels, with a slash before the alpha. `color-mix(in <space>, a P%, b)` blends two colours; the interpolation space changes the result, and `oklch` or `oklab` avoid the muddy midpoints that sRGB produces. Relative colour syntax (`oklch(from <colour> l c h)`) derives one colour from another by altering channels. Both are available in all current browsers.

`currentColor` refers to the element's `color` value and is the default for borders and SVG fills that you want to follow the text. `transparent` in a gradient can produce a grey fringe in older interpolation, so prefer a zero-alpha version of the same colour.

**Contrast.** WCAG 2 requires a contrast ratio of at least 4.5:1 for body text, 3:1 for large text (about 24px, or 19px bold), and 3:1 for interface components and focus indicators. Click any colour swatch in DevTools to see the ratio, with a line on the picker showing the passing region. Never use colour as the only way to convey a state.

**Try it:** Create five swatches at the same `hsl()` saturation and lightness with different hues, and five at the same `oklch()` L and C. Compare how even each row looks. Then derive hover and disabled variants of a button colour with `color-mix()` and check the text contrast of each in the DevTools colour picker.

**Resources**
- [MDN: color value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value)
- [Chrome for Developers: High definition CSS color guide](https://developer.chrome.com/docs/css-ui/high-definition-css-color-guide)
- [MDN: color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)

### Backgrounds, borders, shadows

**Backgrounds.** An element can have several background layers, separated by commas; the first one listed is on top, and `background-color` is always at the bottom. Gradients are images, so they go in `background-image` and respond to `background-size`, `background-position`, and `background-repeat`.

```css
.hero {
  background:
    linear-gradient(to bottom, rgb(0 0 0 / 0), rgb(0 0 0 / 0.6)),
    url("photo.jpg") center / cover no-repeat;
}
```

`linear-gradient()`, `radial-gradient()`, and `conic-gradient()` take colour stops. Two stops at the same position make a hard edge, which is how stripes and pie charts are drawn. You can choose the interpolation space, as in `linear-gradient(in oklch, blue, yellow)`, to avoid a grey middle. `background-clip: text` with a transparent text colour paints the background through the glyphs.

**Borders and radius.** `border-radius` accepts percentages (`50%` makes an ellipse, or a circle on a square) and a slash syntax for elliptical corners. Use a very large length such as `999px` for a pill shape, because `50%` would make an ellipse on a non-square box. When you nest rounded boxes, the inner radius should equal the outer radius minus the gap between them. A border takes up space; if you need a ring that does not affect layout, use `outline` or an inset `box-shadow`.

**Shadows.** `box-shadow: x y blur spread colour` paints outside the border box, follows `border-radius`, and never affects layout. Several comma-separated shadows, each soft and low in opacity, look more natural than one heavy shadow. The `inset` keyword draws inside. For shapes that are not rectangles (a transparent PNG, a clipped element), use `filter: drop-shadow()`.

**Outline.** An outline is drawn outside the border, takes no space, and follows the border radius. Its main job is the focus indicator. Never write `outline: none` without providing a replacement. Style `:focus-visible` instead, so that keyboard users get a clear ring and mouse clicks do not show one:

```css
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
```

In forced-colours mode, backgrounds and shadows are removed but outlines and borders remain, which is another reason to keep real outlines.

**Try it:** Build a card with a two-layer background (gradient over image), a layered soft shadow made of three `box-shadow` values, and a focus ring using `outline-offset`. Emulate `forced-colors: active` in the Rendering tab and note what still shows.

**Resources**
- [MDN: CSS backgrounds and borders](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_backgrounds_and_borders)
- [web.dev: Learn CSS, Gradients](https://web.dev/learn/css/gradients)
- [web.dev: Learn CSS, Shadows](https://web.dev/learn/css/shadows)

### Transitions

A transition animates a property from its old computed value to its new one whenever that value changes, whatever the cause: a hover, a class toggle, a media query.

```css
.button {
  background: var(--brand);
  transition: background-color 150ms ease-out, translate 150ms ease-out;
}
.button:hover { background: var(--brand-hover); translate: 0 -1px; }
```

Put the `transition` on the base state, not on the `:hover` rule, so that it runs in both directions. The shorthand takes property, duration, easing, and delay; the first time value is the duration.

**Properties.** Name the properties you intend to animate. `transition: all` animates anything that changes, including things you did not expect (a theme switch animating every colour on the page), and makes the browser do extra work.

**Duration.** Interface feedback feels right at about 100 to 300ms. Longer than about 400ms feels slow for small elements.

**Easing.** `ease-out` (fast start, gentle stop) suits elements entering or responding to input. `ease-in` suits elements leaving. `linear` suits only colour, opacity, and continuous motion. `cubic-bezier()` gives custom curves, and the DevTools easing editor lets you drag the handles. The `linear()` function takes a list of points and can approximate springs and bounces.

**What cannot be interpolated.** A transition needs two values of the same kind. `height: 0` to `height: auto` does not animate, because `auto` is not a length. The dependable workaround is a grid wrapper that transitions `grid-template-rows` from `0fr` to `1fr`, with `overflow: hidden` on the child. Chromium also supports `interpolate-size: allow-keywords`, which makes `auto` animatable; other engines do not support it yet, so treat it as an enhancement.

**Appearing and disappearing.** An element that has just been rendered has no "before" value, and `display` switches instantly, so a plain transition cannot animate an element in from, or out to, `display: none`. That needs `@starting-style` and `transition-behavior: allow-discrete`, which the entry on entry and exit animations covers.

Wrap non-essential motion in a `prefers-reduced-motion` query.

**Try it:** Animate a panel open and closed with the `grid-template-rows` technique. Then give a button a colour and position transition, and compare `ease-out`, `ease-in`, and a custom `cubic-bezier()` drawn in the DevTools easing editor. Use the Animations panel at 10% speed to inspect both.

**Resources**
- [MDN: Using CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions)
- [MDN: transition](https://developer.mozilla.org/en-US/docs/Web/CSS/transition)
- [web.dev: Learn CSS, Transitions](https://web.dev/learn/css/transitions)

### Keyframe animations

Transitions go from A to B when something changes. Keyframe animations describe a sequence of states and can run on their own, loop, alternate, and pause.

```css
@keyframes pulse {
  from { scale: 1; opacity: 1; }
  50%  { scale: 1.08; opacity: 0.7; }
  to   { scale: 1; opacity: 1; }
}
.badge { animation: pulse 1.2s ease-in-out infinite; }

@keyframes slide-in { from { translate: 0 1rem; opacity: 0; } }
.toast { animation: slide-in 300ms ease-out both; }
```

If you leave out the `from` or `to` keyframe, the browser uses the element's own current style for it, which is why `slide-in` needs only a `from`.

The shorthand sets name, duration, easing, delay, iteration count, direction, fill mode, and play state. The easing applies *between each pair of keyframes*, not across the whole animation.

**Fill modes** control what happens outside the active period. By default, the animated styles apply only while the animation runs, so an element snaps back at the end. `forwards` keeps the final keyframe. `backwards` applies the first keyframe during the delay. `both` does both. Keep in mind that animation declarations override normal author declarations in the cascade, so a `forwards` animation will hold a property against later class changes.

**Cost.** The browser's rendering pipeline is style, layout, paint, and composite. Animating `width`, `height`, `top`, `margin`, or anything else that affects geometry triggers layout on every frame. Animating `background-color` or `box-shadow` triggers paint. `transform` (and the individual `translate`, `scale`, and `rotate` properties) and `opacity` can be handled by the compositor alone, off the main thread, so they stay smooth even while JavaScript is busy. Prefer them. To animate a shadow cheaply, cross-fade the opacity of a pseudo-element that carries the shadow.

Use `will-change` sparingly, and only on an element that is about to animate, because each promoted layer costs memory.

Respect `prefers-reduced-motion`: remove looping and large movements, and keep short fades. `animation-play-state: paused` gives you pause on hover. In JavaScript, `element.getAnimations()` returns the running animations, and the `animationend` event fires on completion.

**Try it:** Write a loading spinner with `rotate` and a skeleton shimmer with a moving gradient. Open the Performance panel, record a few seconds of each, and compare the main-thread work. Then enable paint flashing in the Rendering tab to see which one repaints.

**Resources**
- [MDN: Using CSS animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations)
- [web.dev: How to create high-performance CSS animations](https://web.dev/articles/animations-guide)
- [web.dev: Learn CSS, Animations](https://web.dev/learn/css/animations)

### Entry and exit animations

Two facts stop an ordinary transition from animating an element in and out of existence. First, a transition needs a previous computed style to start from, and an element that was `display: none` (or was not in the DOM) has none, so it simply appears in its final state. Second, `display` is a discrete property: when it changes to `none`, the element is gone at once, before any fade can be seen. Two features solve one problem each.

**`@starting-style`** supplies the "before" values for an element's first style update, that is, when it is first rendered or when it changes from `display: none`. **`transition-behavior: allow-discrete`** lets a discrete property take part in a transition. For `display` in particular, the browser keeps the element visible for the *whole* duration: when hiding, it switches to `none` at the end, and when showing, it switches at the start.

```css
[popover] {
  opacity: 0;
  scale: 0.95;
  transition:
    opacity 200ms, scale 200ms,
    display 200ms allow-discrete,
    overlay 200ms allow-discrete;
}
[popover]:popover-open {
  opacity: 1;
  scale: 1;

  @starting-style { opacity: 0; scale: 0.95; }
}
```

Read it as three states. The base rule is the *exit* state: where the element animates to when it closes. The `:popover-open` rule is the visible state. The `@starting-style` block is the *entry* state: where it animates from when it opens. The entry and exit states can differ, for example sliding in from below and fading out in place.

Details that cause trouble:

- `@starting-style` adds no specificity. If you write it as a separate block instead of nesting it, it must come *after* the open-state rule, or the open-state declarations override it.
- `overlay` keeps a popover or modal dialog in the top layer while it animates out. Without it, the element drops out of the top layer immediately and may vanish behind other content. You cannot set `overlay` yourself; you can only list it in a transition.
- For `<dialog>`, use `dialog[open]` as the visible state, and transition `::backdrop` in the same way with its own rules.
- The same technique works for an element inserted into the DOM: `@starting-style` gives it its entry state. Removal from the DOM cannot be animated in CSS, since the element has gone; hide it first, and remove it on `transitionend`.

Browser support is uneven, and you should know exactly where. `@starting-style` works in all current browsers, so entry animations work everywhere. Transitioning `display` works in Chrome, Edge, and Safari, but not in Firefox at the time of writing, and `overlay` is Chromium-only. In a browser without them, the element opens with its animation and closes instantly, which is a perfectly acceptable fallback, and needs no extra code.

Keyframe animations are the alternative for entry: an `animation` on the open state runs when the element is first rendered, in every browser. Exit by keyframes has the same `display` limitation.

Keep these animations short (150 to 250ms), and reduce them to a simple fade, or nothing, under `prefers-reduced-motion: reduce`.

**Try it:** Build a `popover` menu with the CSS above, and inspect it in the Animations panel at 10% speed. Remove the `display` and `overlay` lines and observe what happens on close. Then animate a `<dialog>` opened with `showModal()`, including its `::backdrop`, and compare opening and closing in Chrome and Firefox.

**Resources**
- [MDN: @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)
- [MDN: transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior)
- [Chrome for Developers: Four new CSS features for smooth entry and exit animations](https://developer.chrome.com/blog/entry-exit-animations)

### Transforms

A transform changes how an element is *drawn* after layout has finished. The element keeps its original place in the flow, and its neighbours do not move. That is why transforms are cheap to animate, and also why a scaled-up element overlaps its siblings instead of pushing them away.

```css
.card:hover { transform: translateY(-4px) scale(1.02); }
.icon { rotate: 90deg; }                 /* individual property */
.centered { position: absolute; top: 50%; left: 50%; translate: -50% -50%; }
```

There are two ways to write them. The `transform` property takes a list of functions. The individual properties `translate`, `rotate`, and `scale` each set one kind, are supported in all current browsers, and are easier to animate and override independently, since changing `scale` on hover does not wipe out a `translate` set elsewhere.

**Order matters** in a `transform` list. Each function changes the coordinate system for the functions after it, so `translateX(100px) rotate(45deg)` moves and then spins in place, while `rotate(45deg) translateX(100px)` moves along the rotated axis and ends up somewhere else. The individual properties always apply in a fixed order (`translate`, then `rotate`, then `scale`), followed by `transform`.

**Percentages** in `translate` refer to the element's own size, not its parent's. That is the basis of the centring trick above, and it is what makes `translate: 0 100%` slide an element by exactly its own height.

**`transform-origin`** is the fixed point around which rotation and scaling happen. It defaults to the centre. `transform-origin: top left` makes a dropdown appear to grow from its corner.

Side effects to remember: any transform creates a stacking context and makes the element the containing block for `position: fixed` and `absolute` descendants. Transforms do not apply to non-replaced inline boxes, so give a `<span>` `display: inline-block` first. Transformed text can look blurry if it lands on a fractional pixel. `getBoundingClientRect()` reports the transformed box, while `offsetWidth` reports the layout box.

For 3D, `perspective` on the parent sets the viewing distance, and `rotateX()`, `rotateY()`, and `translateZ()` move in depth.

**Try it:** Apply `translateX(100px) rotate(45deg)` and then the reverse order to two identical squares and explain the difference. Change `transform-origin` on a rotating square to each corner. Then confirm in the box model diagram that a `scale: 2` element's layout size did not change.

**Resources**
- [MDN: transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
- [MDN: Using CSS transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transforms/Using_CSS_transforms)
- [MDN: transform-origin](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin)

### Dark mode

A proper dark mode has three parts: tell the browser which schemes you support, define your colours as tokens that change with the scheme, and let the user override the system setting.

`color-scheme` is the part that people skip. It tells the browser which schemes the page supports, and the browser then renders everything it controls to match: the default canvas and text colours, form controls, scrollbars, and the system colours.

```css
:root {
  color-scheme: light dark;                       /* follow the system */
  --bg: light-dark(#ffffff, #121417);
  --text: light-dark(#1a1c1e, #e6e8eb);
  --surface: light-dark(#f3f4f6, #1d2126);
}
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }

body { background: var(--bg); color: var(--text); }
```

The `light-dark()` function returns its first value when the used colour scheme is light and its second when it is dark. Because it follows `color-scheme`, the manual override needs only the two extra rules above; no token is defined twice. It is supported in all current browsers. For older ones, the equivalent is to define the tokens on `:root`, redefine them inside `@media (prefers-color-scheme: dark)`, and again under `[data-theme="dark"]`.

Also add `<meta name="color-scheme" content="light dark">` to the `<head>`, so that the browser paints the correct background before the CSS arrives.

For the toggle, store the user's choice (for example in `localStorage`) and set `data-theme` on `<html>` from a small inline script in the `<head>`, before first paint. Doing it later produces a flash of the wrong theme. Offer three options: light, dark, and system.

Design notes: dark mode is not inverted light mode. Avoid pure black backgrounds with pure white text, which is harsh; convey elevation with lighter surfaces, since shadows barely show; reduce the chroma of saturated brand colours; and recheck contrast for every pair. Give components *semantic* tokens (`--surface`, `--text-muted`, `--border`), not raw palette names, so that they never need their own dark rules. Images may need attention too: `<picture>` with a `media="(prefers-color-scheme: dark)"` source can swap them.

**Try it:** Implement the tokens above with a three-way toggle. Emulate `prefers-color-scheme` in the Rendering tab and confirm that "system" follows it while "light" and "dark" do not. Remove `color-scheme` and look at what happens to a default `<input>`, a `<select>`, and the scrollbar.

**Resources**
- [MDN: color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)
- [MDN: light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
- [web.dev: Improved dark mode default styling with the color-scheme CSS property](https://web.dev/articles/color-scheme)

### Nesting

Native nesting lets you write a rule inside another rule; the inner selector is resolved relative to the outer one. It is supported in all current browsers, with no preprocessor.

```css
.card {
  padding: 1rem;

  .title { font-weight: 600; }            /* .card .title */
  > img { border-radius: 0.5rem; }        /* .card > img */
  &:hover { box-shadow: 0 2px 8px rgb(0 0 0 / 0.2); }   /* .card:hover */
  &.featured { border-color: gold; }      /* .card.featured */
  .sidebar & { padding: 0.5rem; }         /* .sidebar .card */

  @media (width >= 40em) { padding: 2rem; }
}
```

The `&` nesting selector stands for the parent selector. If you leave it out, the nested selector is treated as a descendant, as if `& ` were written in front. You need `&` whenever the selector must attach directly to the parent (`&:hover`, `&.active`, `&::before`) or when the parent should appear somewhere other than the start.

Differences from Sass that catch people out:

- `&` is a selector, not a string. `&__title` does not produce `.card__title`; it is invalid. BEM-style concatenation is not possible in native nesting.
- `&` behaves like `:is()` around the parent selector list. So with `#a, .b { & p { } }`, the nested rule has the specificity of `#a` even where the match came through `.b`.
- Because of that `:is()` behaviour, a parent selector that contains a pseudo-element cannot be nested under.

Declarations written after a nested rule now stay in their written position in the cascade. Earlier implementations hoisted them above the nested rules; for clarity, put your declarations first anyway.

At-rules such as `@media`, `@container`, `@supports`, and `@layer` can be nested directly, with declarations inside them applying to the parent selector. That keeps a component's responsive behaviour next to its base styles.

Do not nest deeply. Each level adds a descendant combinator and specificity, and three levels in you have recreated the long, fragile selectors that nesting was meant to tidy. Nest states, modifiers, and at-rules; think twice before nesting child elements.

**Try it:** Rewrite a flat component stylesheet (base, hover, focus, a modifier, one child, one media query) as a single nested block. In the Styles pane, check how the nested rules are displayed and what specificity they have. Then nest under a parent list with an ID and a class, and observe the specificity.

**Resources**
- [MDN: Using CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting)
- [MDN: & nesting selector](https://developer.mozilla.org/en-US/docs/Web/CSS/Nesting_selector)
- [MDN: CSS nesting and specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Nesting_and_specificity)

### `:has()`

`:has()` matches an element if the relative selector you pass matches something starting from that element. It is often called the parent selector, but it is more general: it lets the *subject* of a rule depend on what comes after it or inside it.

```css
.card:has(img) { grid-template-columns: 8rem 1fr; }        /* a card containing an image */
.field:has(:user-invalid) label { color: var(--danger); }  /* style a label by its input's state */
h2:has(+ p) { margin-block-end: 0.25rem; }                 /* an h2 directly followed by a p */
li:has(~ li:hover) { opacity: 0.6; }                       /* earlier siblings of the hovered item */
html:has(dialog[open]) { overflow: hidden; }               /* lock page scroll when a modal is open */
form:not(:has(:invalid)) button { }                        /* when nothing is invalid */
```

The argument is a relative selector, so it can begin with a combinator: `:has(> img)` means a direct child, `:has(+ p)` the next sibling, and `:has(~ .x)` any later sibling. With no combinator it means any descendant.

What to know:

- **Specificity.** `:has()` takes the specificity of its most specific argument, like `:is()` and `:not()`.
- **Limits.** You cannot nest `:has()` inside `:has()`, and pseudo-elements are not allowed inside it.
- **Unforgiving list.** If any selector in the argument list is invalid, the whole rule is dropped. An unsupported pseudo-class in one argument kills the lot, so split risky selectors into separate rules.
- **Performance.** Browsers have optimised `:has()` well, but a rule like `body:has(.x)` must be re-evaluated when anything under `body` changes. Anchor it to the closest practical ancestor and prefer the child combinator where you can.
- **Feature detection.** `@supports selector(:has(a))`.

`:has()` is supported in every major browser and has replaced a great deal of JavaScript that toggled classes on parents, such as `.is-open` and `.has-error`. Combined with `:checked` on a hidden input, it can drive purely CSS state: `body:has(#menu-toggle:checked) .nav { display: block; }`.

**Try it:** Build a form in which each field wrapper turns red when its input is `:user-invalid`, and the submit button is dimmed while the form contains any `:invalid` control, with no JavaScript. Then build a list in which hovering one item dims all the *others*, using `:has()` and `:not()`.

**Resources**
- [MDN: :has()](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)
- [WebKit: Using :has() as a CSS Parent Selector and much more](https://webkit.org/blog/13096/css-has-pseudo-class/)
- [Selectors Level 4: The relational pseudo-class](https://drafts.csswg.org/selectors-4/#relational)

### Cascade layers

Cascade layers let you decide the order of precedence between groups of styles explicitly, instead of fighting over specificity and source order. A declaration in a later layer beats one in an earlier layer, whatever their selectors' specificity.

```css
@layer reset, base, components, utilities;      /* this line sets the order */

@layer reset { * { margin: 0; } }
@layer components { .card .title { color: navy; } }
@layer utilities { .text-red { color: red; } }  /* wins over .card .title */

@import url("vendor.css") layer(vendor);        /* put third-party CSS in a layer */
```

The order is fixed by the *first appearance* of each layer name. Declaring them all up front in one statement makes that order obvious and independent of where the code ends up.

Rules to learn:

- **Unlayered styles win.** Any normal declaration outside every layer beats all layered declarations. That is convenient for migration (wrap the old or third-party CSS in a layer and your new CSS wins automatically), but it means that one stray unlayered rule overrides your whole layer system.
- **`!important` reverses the order.** Among important declarations, earlier layers beat later ones, and layered important beats unlayered important. This lets a reset layer protect something that must not be overridden.
- **Specificity still works within a layer.** Layers are compared first; only if two declarations are in the same layer does specificity decide.
- **Layers can nest.** Write `@layer components.buttons { }` or nest the blocks.
- **`revert-layer`** rolls a property back to the value from earlier layers.
- Anonymous layers (`@layer { }`) cannot be added to later.

Putting a third-party stylesheet into a low layer ends the specificity wars with frameworks: your single-class rule in a later layer overrides their three-class selector. This is how current CSS frameworks structure their own output.

Layers control precedence only. They do not scope selectors, so a rule in the `components` layer still matches everywhere.

DevTools shows layer membership and order in the Styles pane.

**Try it:** Take a page that uses a CSS library, or write a fake "vendor" file with high-specificity selectors. Import it into a `vendor` layer, declare `@layer vendor, app;`, and override it from `app` using single classes only. Then move one of your rules outside all layers and observe that it wins regardless.

**Resources**
- [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [MDN: Cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers)
- [Chrome for Developers: Cascade layers are coming to your browser](https://developer.chrome.com/blog/cascade-layers)

### `@scope`

`@scope` limits where a set of rules applies. You give it a root, and optionally a lower limit, and the rules inside match only elements between the two.

```css
@scope (.card) to (.card-content) {
  :scope { border: 1px solid; }         /* the .card itself */
  img { border-radius: 0.5rem; }        /* images in the card, but not inside .card-content */
  .title { font-weight: 600; }
}
```

The `to (...)` clause creates a "donut": styles reach from the root down to the limit and stop, so content nested in the hole (user-generated HTML, or another component) is not affected. No ordinary selector can express that.

`@scope` also adds a step to the cascade called **scope proximity**. When two scoped declarations have equal specificity, the one whose scope root is fewer DOM steps from the element wins, whatever the source order. This fixes the classic nested-theme problem:

```css
@scope (.light) { a { color: darkblue; } }
@scope (.dark)  { a { color: lightblue; } }
```

A link inside `.dark` inside `.light` gets light blue, and a link inside `.light` inside `.dark` gets dark blue, because the nearest root wins. With plain descendant selectors, whichever rule came last would win in both cases. Proximity is checked after specificity and before source order.

Specificity is worth understanding here. The scope root in the `@scope` prelude adds nothing to the specificity of the rules inside. A bare selector such as `img` is treated as if `:where(:scope)` came before it. The `&` selector inside `@scope` is treated the same way and also adds nothing. Writing `:scope` explicitly adds pseudo-class specificity, (0,1,0).

A `<style>` element containing `@scope { ... }` with no prelude scopes its rules to the style element's parent, which is useful for component fragments rendered on the server.

`@scope` shipped in Chrome and Safari first, and Firefox added it at the end of 2025, so it is now available in all three engines but not in older versions. It is not style encapsulation like shadow DOM: outside styles still reach in. It only restrains your own selectors.

**Try it:** Build a `.card` that contains a `.card-content` slot filled with arbitrary HTML, including an `<img>`. Style card images with `@scope` so that the slotted image is unaffected. Then recreate the nested light and dark example and swap the source order of the two rules to prove that proximity decides.

**Resources**
- [MDN: @scope](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope)
- [Chrome for Developers: Limit the reach of your selectors with the CSS @scope at-rule](https://developer.chrome.com/docs/css-ui/at-scope)
- [CSS Cascading and Inheritance Level 6: Scoping styles](https://drafts.csswg.org/css-cascade-6/#scoped-styles)

### `@supports`

`@supports` applies a block of CSS only if the browser understands a given declaration or selector. It is the tool for progressive enhancement: ship a baseline that works everywhere, then layer on the better version where it is available.

```css
.tooltip { position: absolute; top: 100%; left: 0; }          /* baseline */

@supports (anchor-name: --a) {
  .tooltip { position-anchor: --trigger; position-area: block-end; }
}

@supports selector(:has(a)) { }
@supports not (animation-timeline: scroll()) { }
@supports (display: grid) and (not (grid-template-rows: subgrid)) { }
@supports font-tech(variations) { }
```

The test is a property and value pair in parentheses. The browser asks itself, "would I parse this declaration?" You must give a complete declaration; `@supports (gap)` is invalid. `selector()` tests selector support. Combine tests with `and`, `or`, and `not`, with parentheses to group.

You often do not need `@supports` at all. Browsers discard declarations they do not understand, so two declarations in a row give you a fallback:

```css
.box { height: 100vh; height: 100dvh; }
```

Reach for `@supports` when the enhancement needs *several declarations that only make sense together*, or when the fallback must be undone. A lone `display: grid` followed by grid-specific properties needs no query, since the grid properties are ignored on a non-grid box; but a fallback `margin` that you must remove when grid is present does.

Limits:

- It tests parsing, not correctness. A browser with a buggy or partial implementation still answers yes. `gap` is the classic example: `(gap: 1rem)` was true in browsers that supported it for grid but not for flexbox.
- A browser too old to know `@supports` skips the whole block, which is the safe behaviour.
- A custom property declaration always passes, since any value is valid.

In JavaScript, `CSS.supports('display', 'grid')` or `CSS.supports('selector(:has(a))')` gives the same answer.

Write the fallback first, outside the query, and make sure the page is usable with it. The enhancement is extra.

**Try it:** Pick a feature that at least one of your installed browsers lacks (check MDN). Build a component with a baseline layout and an `@supports` enhancement, and open it in both browsers. Then run `CSS.supports()` in each Console for five recent features and compare with the MDN tables.

**Resources**
- [MDN: @supports](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports)
- [MDN: Using feature queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_conditional_rules/Using_feature_queries)

### View transitions

The View Transition API animates between two states of the page. The browser takes a snapshot of the old state, lets you change the DOM, takes a snapshot of the new state, and animates between the two, with a cross-fade by default.

For a change within one document, wrap the DOM update in a call:

```js
function update() { list.replaceChildren(...newItems); }

if (!document.startViewTransition) update();
else document.startViewTransition(update);
```

For navigation between pages of a multi-page site, both pages opt in with CSS and no JavaScript is needed:

```css
@view-transition { navigation: auto; }
```

During a transition the browser builds a tree of pseudo-elements on top of the page: `::view-transition`, containing a `::view-transition-group()` for each named element, which holds `::view-transition-old()` and `::view-transition-new()`. By default there is one group, `root`, for the whole page. Giving an element a `view-transition-name` puts it in its own group, and the browser then animates its position and size from old to new. That is how a thumbnail appears to grow into a hero image, even when the two are different elements.

```css
.thumb.selected { view-transition-name: hero; }
.detail img { view-transition-name: hero; }
::view-transition-group(hero) { animation-duration: 300ms; }
```

You customise with ordinary CSS animations on those pseudo-elements.

Rules and traps:

- Each `view-transition-name` must be unique among rendered elements at the time of each snapshot. A duplicate makes the transition skip. For lists, assign names per item, or use `view-transition-class` to style many groups with one rule.
- The snapshots are images. While the transition runs, the page underneath is not interactive, so keep durations short.
- The update callback may return a promise, and the browser waits for it. Slow work there freezes the old snapshot on screen.
- Cross-document transitions work only for same-origin navigations.
- Respect `prefers-reduced-motion` by disabling or simplifying the animations.

Same-document transitions are available in Chrome, Safari, and Firefox. Cross-document transitions are available in Chrome and Safari; Firefox has not shipped them at the time of writing, and there the navigation simply happens without animation. That makes the feature safe to use as an enhancement.

**Try it:** Build a list in which clicking an item reorders or filters it, and wrap the update in `startViewTransition`. Then give each item a unique `view-transition-name` and watch items slide to their new positions. Slow it down in the Animations panel and inspect the `::view-transition` tree in the Elements panel.

**Resources**
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Chrome for Developers: Smooth transitions with the View Transition API](https://developer.chrome.com/docs/web-platform/view-transitions)
- [MDN: Using the View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using)

### Scroll-driven animations

Normally a CSS animation advances with time. A scroll-driven animation advances with scroll position: its progress goes from 0% to 100% as a scroller moves, or as an element crosses the viewport. You write ordinary `@keyframes` and attach a different timeline.

```css
/* A reading progress bar tied to page scroll */
@keyframes grow { from { scale: 0 1; } to { scale: 1 1; } }
.progress {
  position: fixed; inset: 0 0 auto 0; height: 4px;
  transform-origin: left; background: var(--accent);
  animation: grow linear both;
  animation-timeline: scroll(root block);
}

/* Reveal each card as it enters the viewport */
@keyframes reveal { from { opacity: 0; translate: 0 2rem; } }
.card {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}
```

There are two kinds of timeline. `scroll()` tracks how far a scroll container has scrolled; its arguments choose the scroller (`nearest`, `root`, or `self`) and the axis. `view()` tracks an element's own journey through its scroller's visible area, from first appearing at one edge to leaving at the other.

`animation-range` selects the part of that journey to use. The named ranges are `entry` (coming in), `exit` (going out), `cover` (from the first pixel visible to the last pixel gone), and `contain` (while fully visible).

Things that go wrong:

- The `animation` shorthand resets `animation-timeline`, so declare the timeline *after* the shorthand.
- Duration means nothing here. Leave it out (it defaults to `auto`), and use `linear` easing so that progress maps directly to scroll.
- Use a fill mode of `both`, so that the element holds its start and end states outside the range.
- To drive an animation from a scroller that is not an ancestor, name the timeline (`scroll-timeline-name` or `view-timeline-name`) and hoist it with `timeline-scope` on a common ancestor.

When the keyframes animate only `transform` and `opacity`, the animation runs on the compositor and stays smooth even when the main thread is busy, which scroll event listeners in JavaScript cannot do.

Support: Chrome and Edge, and Safari from version 26. Firefox has it only in pre-release builds at the time of writing. So wrap the rules in `@supports (animation-timeline: scroll())` and make sure the content is visible and usable without them; otherwise the animation would run once on a time basis, or not at all. Also put them inside `@media (prefers-reduced-motion: no-preference)`.

**Try it:** Add the progress bar above to a long article. Then make images fade and scale in with a `view()` timeline, and experiment with `animation-range: entry 0% cover 40%`. Open the page in a browser without support and confirm that nothing is hidden.

**Resources**
- [MDN: CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations)
- [Chrome for Developers: Animate elements on scroll with scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
- [Scroll-driven Animations: demos and tools](https://scroll-driven-animations.style/)

### Anchor positioning

Anchor positioning lets you place one element relative to another, anywhere in the DOM, in CSS alone. Until now, tooltips, menus, and popovers needed JavaScript to measure the trigger and compute coordinates, and more JavaScript to flip the popup when it hit the edge of the viewport.

```css
.trigger { anchor-name: --menu-button; }

.menu {
  position: absolute;                 /* or fixed */
  position-anchor: --menu-button;
  position-area: block-end span-inline-end;   /* below, aligned to the start edge */
  margin-block-start: 0.5rem;
  position-try-fallbacks: flip-block, flip-inline;
}
```

There are three steps. Name the anchor with `anchor-name` (a dashed identifier). Tie the positioned element to it with `position-anchor`. Then place it, in one of two ways:

- `position-area` puts the element in one cell of an imaginary 3 by 3 grid drawn around the anchor: `top`, `bottom right`, `block-end span-inline-end`, and so on. This covers most needs.
- The `anchor()` function, used in inset properties, refers to a specific edge of the anchor: `top: anchor(bottom); left: anchor(left);`. `anchor-size()` reads its dimensions, as in `min-width: anchor-size(width)`. Use these when you need exact control.

`position-try-fallbacks` lists alternatives that the browser tries, in order, when the element would overflow its containing block. `flip-block` and `flip-inline` mirror the placement. You can write custom options with `@position-try`. `position-visibility: anchors-visible` hides the element when its anchor has scrolled out of view.

Requirements and traps:

- The positioned element must be `absolute` or `fixed`.
- The anchor must be laid out before the positioned element and be visible to it: roughly, it must come earlier in the DOM or be in an ancestor's scope, and must not be inside a different containing block that prevents the reference.
- With repeated components, every trigger has the same `anchor-name`, and each popup would find the last one. Put `anchor-scope: --menu-button` on each component's wrapper to keep the names local.

Anchor positioning pairs with the Popover API: the popover is in the top layer, so it escapes overflow clipping and stacking contexts, and anchor positioning places it. A popover opened by a button with `popovertarget` gets that button as an implicit anchor in supporting browsers.

Support arrived in Chrome first, in Safari 26, and in Firefox 147 in early 2026, so it is in all three engines but absent from older versions. Guard it with `@supports (anchor-name: --a)` and give a simple fallback position.

**Try it:** Build a button that opens a `popover` menu and position the menu under the button with `position-area`. Add `position-try-fallbacks: flip-block`, scroll the button to the bottom of the viewport, and watch the menu flip above it. Then duplicate the component three times and fix the resulting bug with `anchor-scope`.

**Resources**
- [MDN: Using CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using)
- [Chrome for Developers: Introducing the CSS anchor positioning API](https://developer.chrome.com/blog/anchor-positioning-api)
- [CSS Anchor Positioning specification](https://drafts.csswg.org/css-anchor-position-1/)

### Recreate three layouts

This project proves that you can turn a design into robust CSS without a framework doing the thinking. Each of the three layouts exercises a different skill.

**Marketing page.** A hero, alternating feature rows, a pricing table, and a footer. This is about vertical rhythm, fluid type and spacing, a centred wrapper (`width: min(100% - 2rem, 70rem); margin-inline: auto`), and images that keep their ratio. Feature rows are two-column grids that collapse to one.

**Dashboard shell.** A header, a sidebar, a scrolling main area, and perhaps a footer. This is grid with named areas and independent scrolling:

```css
.shell {
  display: grid; height: 100dvh;
  grid-template: "header header" auto "nav main" minmax(0, 1fr) / 15rem minmax(0, 1fr);
}
.shell > main { grid-area: main; overflow: auto; }
```

The `minmax(0, 1fr)` tracks are what allow `main` to scroll instead of stretching the page. On narrow screens the sidebar becomes an off-canvas panel or a top bar.

**Card gallery.** `repeat(auto-fit, minmax(min(16rem, 100%), 1fr))` with `gap`, cards with equal heights and aligned footers (subgrid, or a column flexbox with `margin-block-start: auto` on the footer), and images with `aspect-ratio` and `object-fit: cover`.

How to work:

1. Choose real sites to copy, and take screenshots at three widths.
2. Write semantic HTML first, with no classes for layout. Check that it reads sensibly unstyled.
3. Style the 320px layout, then widen the window and add a query only when something breaks.
4. Use custom properties for colour, spacing, and type scales from the start.

Definition of done: no horizontal scroll from 320px to 2560px; no fixed heights on anything containing text; works at 200% zoom and at a 24px default font size; survives a title three times longer than the design; correct with `dir="rtl"`; visible focus styles; and the same in Chromium, Firefox, and Safari.

**Try it:** Start with the dashboard shell, as it is the smallest. Build only the four regions with background colours, make `main` scroll independently with fifty paragraphs of filler, and collapse the sidebar under 48em. When that works at every width, fill in the content.

**Resources**
- [web.dev: Ten modern layouts in one line of CSS](https://web.dev/articles/one-line-layouts)
- [MDN: CSS layout cookbook](https://developer.mozilla.org/en-US/docs/Web/CSS/Layout_cookbook)
- [MDN: Realizing common layouts using grids](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Realizing_common_layouts_using_grids)

### Themeable component set

This project is about designing an *API in CSS*: components that can be restyled and re-themed by changing custom properties, without editing their rules. It is how design systems work.

Structure the tokens in three tiers:

1. **Primitive tokens** are raw values: `--blue-600: oklch(55% 0.2 260)`, `--space-3: 0.75rem`.
2. **Semantic tokens** describe purpose and point at primitives: `--color-surface`, `--color-text`, `--color-accent`, `--color-border`, `--color-danger`. Themes change *only this tier*.
3. **Component tokens** are optional hooks with fallbacks: `--button-bg`.

```css
:root {
  color-scheme: light dark;
  --color-surface: light-dark(#fff, #1b1e23);
  --color-text: light-dark(#1a1c1e, #e6e8eb);
  --color-accent: light-dark(oklch(55% 0.2 260), oklch(75% 0.14 260));
}

.button {
  background: var(--button-bg, var(--color-accent));
  color: var(--button-fg, white);
  padding: 0.5em 1em;
  border: 1px solid transparent;
  border-radius: var(--radius, 0.5rem);
  font: inherit;
}
.button:hover { background: color-mix(in oklch, var(--button-bg, var(--color-accent)), black 12%); }
.button:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.button[data-variant="danger"] { --button-bg: var(--color-danger); }
```

The variant changes a variable and nothing else, so hover, focus, and dark mode all continue to work.

Every component must handle each state: default, hover, focus-visible, active, disabled, and, for inputs, invalid (use `:user-invalid`, so that errors do not show before the user has typed). Build the following:

- **Buttons:** primary, secondary, ghost, and danger, in two sizes, using `em` padding so that size follows `font-size`.
- **Inputs:** text, select, checkbox, and radio, with labels, help text, and error text. `accent-color` themes native checkboxes and radios in one line.
- **Cards:** a surface with a border or elevation, where elevation in dark mode is a lighter surface and not a stronger shadow.

Put the tokens and components in cascade layers (`@layer tokens, base, components`), so that a consumer's overrides win without specificity tricks.

Definition of done: switching theme changes no component rule; every text and background pair passes 4.5:1 in both themes; all focus rings are visible in both themes; and the set still works under `forced-colors: active`.

**Try it:** After building the light and dark themes, add a third "high contrast" theme by writing only a new block of semantic tokens under `[data-theme="contrast"]`. If you have to touch a component rule to make it work, your token structure has a leak; find it and fix it.

**Resources**
- [MDN: Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)
- [web.dev: Building a button component](https://web.dev/articles/building/a-button-component)
- [MDN: accent-color](https://developer.mozilla.org/en-US/docs/Web/CSS/accent-color)

### CSS-only interactions

The aim is to learn how much state HTML and CSS can carry on their own, and where the limits are. The sources of state available without JavaScript are: native elements (`<details>`, `<dialog>` with invoker attributes, `popover`), form controls (`:checked`, `:focus-within`, `:user-invalid`), the URL (`:target`), and scroll position.

**Accordion.** Use `<details>` and `<summary>`. Give several `<details>` elements the same `name` attribute and the browser makes them exclusive: opening one closes the others. This is supported in all current browsers, and you get keyboard support, find-in-page, and correct semantics for free. Style the marker with `summary::marker` or replace it, and style open state with `details[open]` (or the `:open` pseudo-class where it is supported). The content part is exposed as `::details-content`, which is what you animate. Animating to full height needs `interpolate-size: allow-keywords`, which is Chromium-only at present, so in other browsers the panel opens without animation, which is acceptable.

**Tabs.** There is no native tabs element. The classic CSS-only approach uses radio buttons, one per tab, and shows the panel that matches the checked radio:

```css
.tabs:has(#tab-2:checked) #panel-2 { display: block; }
```

Radios give you arrow-key navigation within the group. Be honest about the limit: this does not expose `tablist`, `tab`, and `tabpanel` roles to assistive technology, and the full pattern needs JavaScript to manage `aria-selected` and focus. Part of the exercise is understanding that gap.

**Carousel.** A horizontal scroller with scroll snap is a complete, accessible carousel as it stands: it works with touch, trackpad, and keyboard.

```css
.carousel { display: flex; gap: 1rem; overflow-x: auto; scroll-snap-type: x mandatory; }
.carousel > * { flex: 0 0 min(80%, 24rem); scroll-snap-align: center; }
```

Chromium also supports generated controls: `::scroll-button()` for previous and next buttons and `::scroll-marker` for dots, with the browser managing their state. Firefox and Safari do not support these yet, so use `@supports selector(::scroll-button(*))` and treat them as an enhancement over the plain scroller.

Finish by testing each widget with the keyboard only and with a screen reader, and writing down what works and what does not.

**Try it:** Build the exclusive accordion first, in under ten minutes, using only `<details name="faq">`. Confirm that browser find-in-page opens a closed panel that contains the search term. Then build the radio-based tabs and inspect them in the accessibility tree to see what roles are announced.

**Resources**
- [MDN: details element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details)
- [Chrome for Developers: Carousels with CSS](https://developer.chrome.com/blog/carousels-with-css)
- [MDN: Creating CSS carousels](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_overflow/CSS_carousels)
