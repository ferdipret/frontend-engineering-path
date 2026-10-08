# CSS: Practice test

### 1. Which colour is the paragraph?

```html
<p id="intro" class="lead">Hello</p>
```

```css
p.lead { color: green; }
#intro { color: blue; }
.lead.lead.lead { color: red; }
p { color: black !important; }
```

- [ ] Blue, because an ID outranks any number of classes
- [ ] Red, because it has the most selectors
- [x] Black, because `!important` is decided before specificity
- [ ] Green, because it combines a type and a class

> Importance is settled at an earlier step of the cascade than specificity, so the `!important` declaration wins even though `p` has the lowest specificity of the four. Without it, blue would win: (1,0,0) beats (0,3,0), because the ID column is compared first.

### 2. A `div` has `width: 300px; padding: 20px; border: 5px solid;` and no `box-sizing` declaration. How wide is the rendered box, border edge to border edge?

- [ ] 300px
- [ ] 340px
- [ ] 325px
- [x] 350px

> The initial value is `content-box`, so `width` sets the content area only. Padding (20 + 20) and border (5 + 5) are added: 350px. With `box-sizing: border-box` it would be 300px, with a 250px content area.

### 3. Which of these properties is inherited by default?

- [x] `line-height`
- [ ] `padding`
- [ ] `border`
- [ ] `background-color`

> Text-related properties such as `color`, `font-family`, and `line-height` inherit. Box-related properties do not. A child often *looks* as though it inherited the background, but that is because its own background is transparent and the parent's shows through.

### 4. Two paragraphs are stacked in normal flow. The first has `margin-bottom: 32px` and the second has `margin-top: 20px`. How far apart are they?

- [ ] 52px
- [x] 32px
- [ ] 20px
- [ ] 12px

> Adjacent vertical margins of block boxes in normal flow collapse to the larger of the two. They would add up to 52px if the parent were a flex or grid container, because margins never collapse there.

### 5. A wrapper with a background colour contains two columns, each with `float: left`, and nothing else. The background does not show. What is the cleanest fix?

- [ ] Add `clear: both` to the wrapper
- [x] Add `display: flow-root` to the wrapper
- [ ] Add `height: 100%` to the wrapper
- [ ] Add `float: none` to the second column

> Floats are out of flow and do not contribute to their parent's height, so the wrapper is zero pixels tall. `display: flow-root` makes the wrapper a block formatting context, which contains its floats. `clear` on the wrapper affects where the wrapper itself sits relative to *earlier* floats, not whether it encloses its own. The older equivalents are a clearfix pseudo-element and `overflow: hidden`.

### 6. What does `flex: 1` expand to?

- [ ] `flex: 1 1 auto`
- [ ] `flex: 1 0 auto`
- [ ] `flex: 0 1 100%`
- [x] `flex: 1 1 0%`

> A single unitless number sets `flex-grow` and gives a `flex-basis` of zero, so items ignore their content size and share all the space in proportion to their grow factors. `1 1 auto` is `flex: auto`, which reserves each item's content size first and shares only the remainder.

### 7. What is the specificity of this selector?

```css
:is(#sidebar, .panel) :where(.title, #heading) a:not(.external)
```

- [x] (1,1,1)
- [ ] (0,2,1)
- [ ] (2,1,1)
- [ ] (1,2,1)

> `:is()` takes its most specific argument, `#sidebar`, giving (1,0,0) even when the match came through `.panel`. `:where()` always contributes zero. `a` is (0,0,1), and `:not(.external)` contributes its argument, (0,1,0). The total is (1,1,1).

### 8. The modal below is covered by the header. Why?

```css
.header { position: sticky; top: 0; z-index: 10; }
.content { position: relative; z-index: 1; }
.content .modal { position: fixed; inset: 0; z-index: 9999; }
```

- [ ] `position: fixed` elements cannot have a `z-index`
- [ ] `z-index` has a maximum of 999
- [ ] Sticky elements always paint above fixed elements
- [x] `.content` forms a stacking context at level 1, so the modal can never rise above the header at level 10

> A positioned element with a `z-index` other than `auto` creates a stacking context. The modal's 9999 is compared only with other things inside `.content`. The whole of `.content`, at 1, is then painted below `.header`, at 10. Fix it by moving the modal out of `.content`, removing the `z-index` from `.content`, or using `<dialog>` with `showModal()`, which renders in the top layer.

### 9. A flex row contains a sidebar and a main area with `flex: 1`. A long URL inside the main area makes the whole page scroll horizontally. What is the most direct fix?

- [ ] Add `flex-shrink: 1` to the main area
- [ ] Add `width: 100%` to the main area
- [x] Add `min-width: 0` to the main area
- [ ] Add `flex-wrap: wrap` to the container

> Flex items have `min-width: auto`, which stops them from shrinking below their min-content size, here the unbreakable URL. `flex-shrink` is already 1, so adding it changes nothing. `min-width: 0` removes the floor so that the item can shrink; you would then add `overflow-wrap: anywhere` so that the URL wraps.

### 10. A gallery has two cards in a 1200px container. How do they lay out?

```css
.gallery {
  display: grid;
  gap: 0;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
```

- [ ] Each card is 600px wide
- [x] Each card is 200px wide, with four empty columns beside them
- [ ] Each card is 200px wide and the pair is centred
- [ ] The cards overflow the container

> `auto-fill` creates as many tracks as fit, six of 200px here, and keeps the empty ones, so the two cards occupy two 200px columns. `auto-fit` would collapse the empty tracks to zero and the two cards would grow to 600px each.

### 11. The sticky heading does not stick when the page scrolls. What is the cause?

```css
.wrapper { overflow: hidden; }
.wrapper h2 { position: sticky; top: 0; }
```

- [ ] Sticky positioning needs a `z-index`
- [ ] Headings cannot be sticky
- [ ] `top: 0` should be `top: auto`
- [x] `overflow: hidden` makes `.wrapper` the scroll container that the heading sticks to, and `.wrapper` does not scroll

> A sticky element sticks relative to its nearest ancestor with a scrolling mechanism, and `overflow: hidden` counts. Since `.wrapper` never scrolls, the heading never reaches its threshold. If the overflow was there only for clipping, `overflow: clip` clips without creating a scroll container.

### 12. What background colour does the button get?

```css
:root { --size: 20px; }
.button { background-color: red; }
.button { background-color: var(--size, blue); }
```

- [ ] Red, because the invalid declaration is discarded and the earlier one applies
- [ ] Blue, because the fallback is used when the value is invalid
- [x] Transparent, because the declaration is invalid at computed-value time and the property falls back to its initial value
- [ ] It is a parse error and the whole stylesheet is dropped

> A declaration containing `var()` cannot be validated at parse time, so it wins the cascade as written. By the time `20px` is substituted and found invalid for `background-color`, the earlier `red` declaration has already been discarded. The property then behaves as `unset`, which for the non-inherited `background-color` means its initial value, transparent. The fallback `blue` is used only if `--size` is not defined at all.

### 13. Hovering the button changes the gradient instantly instead of animating. Why?

```css
.button {
  --stop: 20%;
  background: linear-gradient(90deg, navy var(--stop), teal);
  transition: --stop 400ms;
}
.button:hover { --stop: 80%; }
```

- [ ] Custom properties cannot be listed in `transition`
- [ ] Gradients need `transition: background 400ms`
- [x] `--stop` is unregistered, so the browser does not know its type and cannot interpolate it
- [ ] Percentages cannot be interpolated

> An unregistered custom property is an untyped list of tokens, so its transition is discrete: it flips at the midpoint. Registering it gives the browser a type to interpolate:
>
> ```css
> @property --stop { syntax: "<percentage>"; inherits: false; initial-value: 20%; }
> ```
>
> Transitioning `background` would not help, because gradient images are not interpolated. All three descriptors are needed; if one is missing, the rule is ignored and the jump returns.

### 14. With the layers below, which colour does `<a class="link" id="home">` get?

```css
@layer base, theme;

@layer theme { .link { color: green; } }
@layer base  { #home.link { color: red; } }
a { color: purple; }
```

- [x] Purple, because unlayered styles beat all layered styles
- [ ] Red, because it has the highest specificity
- [ ] Green, because `theme` is the last layer
- [ ] Green, because the `theme` block appears first in the source

> Layer order is checked before specificity. Among layers, `theme` beats `base`, so green beats red in spite of the ID. But normal declarations that are not in any layer outrank every layer, so the plain `a` rule wins.

### 15. You want a card's layout to change when the card itself is wider than 30em. Why does this not work?

```css
.card { container-type: inline-size; }

@container (inline-size > 30em) {
  .card { display: grid; grid-template-columns: 1fr 2fr; }
}
```

- [ ] Container queries need `min-width`, not range syntax
- [ ] `container-type` must be `size` for width queries
- [x] A container query styles descendants of the container; `.card` cannot query itself
- [ ] A `container-name` is mandatory

> The `@container` rule makes `.card` look for an *ancestor* container. The card is the container, so the query is evaluated against some outer container, or against nothing. Add a wrapper that carries `container-type`, or move the grid to an inner element of the card.

### 16. Which statement about `height: 100vh` on a mobile browser is correct?

- [ ] It always equals the visible area of the page
- [x] It equals the viewport with the browser toolbars retracted, so content can be cut off while they are showing
- [ ] It changes continuously as the toolbars slide in and out
- [ ] It is not supported on mobile browsers

> On mobile, `vh` corresponds to the large viewport. With the address bar showing, a `100vh` element is taller than the visible area. `100svh` is the small viewport (toolbars showing), and `100dvh` tracks the current state.

### 17. Which animation is cheapest for the browser to run at 60 frames per second?

- [ ] Animating `left` from `0` to `200px` on an absolutely positioned element
- [ ] Animating `width` from `100px` to `300px`
- [ ] Animating `margin-left` from `0` to `200px`
- [x] Animating `translate` from `0` to `200px`

> `translate` (like `transform` and `opacity`) can be animated by the compositor without running layout or paint, and off the main thread. `left`, `width`, and `margin` all change geometry and force layout on every frame. Taking the element out of flow reduces how much is laid out, but does not avoid it.

### 18. What does the `h1` font size compute to at a viewport width of 1000px, given a 16px root font size?

```css
h1 { font-size: clamp(2rem, 1rem + 4vw, 4rem); }
```

- [ ] 32px
- [x] 56px
- [ ] 64px
- [ ] 40px

> The preferred value is 1rem + 4vw = 16px + 40px = 56px. That lies between the minimum, 32px, and the maximum, 64px, so it is used as it is. The minimum applies below 400px wide and the maximum above 1200px.

### 19. What is the difference between these two declarations on a `<div>`?

```css
.a { display: initial; }
.b { display: revert; }
```

- [ ] There is none; both produce `block`
- [x] `.a` is `inline` and `.b` is `block`
- [ ] `.a` is `block` and `.b` is `inline`
- [ ] Both produce `inline`

> `initial` is the value from the specification, and for `display` that is `inline` for every element. Divs are block only because the browser's stylesheet says so. `revert` rolls back to the previous origin, which is that browser stylesheet, giving `block`.

### 20. A link sits inside `.dark`, which sits inside `.light`. Which colour does it get, and why?

```css
@scope (.dark)  { a { color: lightblue; } }
@scope (.light) { a { color: darkblue; } }
```

- [ ] Dark blue, because that rule comes last in the source
- [ ] Dark blue, because `.light` is the outermost scope
- [x] Light blue, because the `.dark` scope root is closer to the link
- [ ] Neither; the conflicting scopes cancel out

> Both rules have the same specificity. Scope proximity is evaluated before source order, and the declaration whose scope root is fewer steps from the element wins. Written as plain `.dark a` and `.light a`, the later rule would win and the link would be dark blue.

### 21. Which selector matches a `.field` wrapper only when the input inside it is invalid after the user has interacted with it?

- [x] `.field:has(:user-invalid)`
- [ ] `.field > :invalid`
- [ ] `.field:invalid`
- [ ] `.field:is(:user-invalid)`

> `:has()` makes the wrapper the subject on a condition about its descendants. `.field > :invalid` selects the input, not the wrapper. `:is(:user-invalid)` would require the wrapper itself to be the invalid control. `:user-invalid` waits for interaction, where `:invalid` matches as soon as the page loads.

### 22. Why can this scroll-driven animation fail to follow the scroll position?

```css
.bar {
  animation-timeline: scroll(root);
  animation: grow linear both;
}
```

- [ ] `scroll(root)` is not valid syntax
- [ ] A duration is required for scroll-driven animations
- [ ] `linear` easing is not allowed
- [x] The `animation` shorthand comes after `animation-timeline` and resets it to `auto`

> `animation-timeline` is a reset-only sub-property of the `animation` shorthand, so the later shorthand restores the default document timeline. With no duration, the animation then does not run visibly at all. Declare the timeline after the shorthand.

### 23. A popover fades in correctly, but disappears instantly when it closes. What is missing?

```css
[popover] {
  opacity: 0;
  transition: opacity 200ms;
}
[popover]:popover-open {
  opacity: 1;
  @starting-style { opacity: 0; }
}
```

- [x] `display` (and `overlay`) in the transition list with `allow-discrete`, so the element stays rendered while it fades out
- [ ] A second `@starting-style` block in the base rule for the exit state
- [ ] `transition-behavior: allow-discrete` on `opacity`
- [ ] `animation-fill-mode: forwards`

> `@starting-style` handles entry only. On close, the browser's `display: none` applies at once, so the fade to `opacity: 0` is never seen. Adding `display 200ms allow-discrete` keeps the element rendered until the transition ends, and `overlay 200ms allow-discrete` keeps it in the top layer for that time. The exit state is the base rule itself; there is no exit counterpart of `@starting-style`. `opacity` is already interpolable and needs no `allow-discrete`. Note that Firefox does not yet transition `display`, so there the close stays instant.

### 24. Explain the difference between `auto-fit` and `auto-fill` in `repeat()`, and give the one-line grid that produces a responsive card gallery without media queries.

> Both create as many tracks as fit in the container. `auto-fill` keeps empty tracks, so a few items stay at column width with blank columns after them. `auto-fit` collapses empty tracks to zero width, so the items present stretch to fill the row. With enough items to fill a row, the two behave identically.
>
> ```css
> .gallery {
>   display: grid;
>   gap: 1rem;
>   grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
> }
> ```
>
> The `min(16rem, 100%)` stops the minimum from overflowing a container narrower than 16rem.

### 25. A header has a background colour and contains an `<h1>` with `margin-top: 2rem`. The header has no padding or border. A gap appears above the header and not inside it. Explain why, and give two fixes.

> The top margin of a first child collapses with its parent's top margin when nothing separates them: no padding, border, inline content, or new block formatting context. The combined margin is placed outside the parent, so the space appears above the header and the heading sits flush with the header's top edge.
>
> Fixes: make the header a new block formatting context with `display: flow-root`; give it some `padding-top` (and remove the heading's margin); or make it a flex or grid container, in which margins never collapse. Any of these keeps the heading's margin inside the header.

### 26. Why should `line-height` be written without a unit? Describe the bug that `line-height: 1.5em` on `body` causes.

> A unitless `line-height` is inherited as the number, and each element multiplies it by its own font size. A value with a unit is computed once, on the element where it is declared, and the resulting length is inherited.
>
> With `body { font-size: 16px; line-height: 1.5em; }`, the computed line height is 24px, and every descendant inherits 24px. An `h1` with a 48px font size then has lines 24px tall, so its wrapped lines overlap. With `line-height: 1.5`, the `h1` gets 72px.

### 27. Write the CSS for a theme system that follows the operating system by default and lets a `data-theme` attribute on `<html>` force light or dark. Explain what `color-scheme` contributes.

> ```css
> :root {
>   color-scheme: light dark;
>   --bg: light-dark(#ffffff, #121417);
>   --text: light-dark(#1a1c1e, #e6e8eb);
> }
> :root[data-theme="light"] { color-scheme: light; }
> :root[data-theme="dark"]  { color-scheme: dark; }
>
> body { background: var(--bg); color: var(--text); }
> ```
>
> `color-scheme` tells the browser which schemes the page supports. With `light dark` it follows the user's preference, and it restyles everything the browser draws itself: the canvas, default text colour, form controls, and scrollbars. `light-dark()` resolves against the used colour scheme, so forcing `color-scheme` on the root is enough to flip every token, with no duplicated variable definitions. To avoid a flash of the wrong theme, set `data-theme` from a small inline script in the `<head>` before first paint, and add `<meta name="color-scheme" content="light dark">`.
>
> For browsers without `light-dark()`, define the tokens on `:root`, override them inside `@media (prefers-color-scheme: dark)`, and override again under `[data-theme]` selectors.

### 28. A colleague writes `transition: height 300ms` to open a panel from `height: 0` to `height: auto`, and nothing animates. Explain why, and describe a technique that works in every current browser.

> A transition interpolates between two values of the same type. `auto` is a keyword, not a length, so there is nothing to interpolate and the height jumps.
>
> A technique that works everywhere is to animate a grid track:
>
> ```css
> .panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 300ms; }
> .panel.open { grid-template-rows: 1fr; }
> .panel > .inner { overflow: hidden; min-height: 0; }
> ```
>
> The `fr` values are interpolable, and `1fr` resolves to the content's height. Chromium also supports `interpolate-size: allow-keywords`, which makes `height: auto` animatable directly, but other engines do not support it yet, so it is only an enhancement. Animating `max-height` to a large guess works too, but the timing is wrong, because the animation covers the guessed distance and not the real one.

### 29. Write a print stylesheet for an article page that has a site header, a sidebar, and a long body containing figures, tables, and external links. Explain each decision, and say how you would test it.

> ```css
> @media print {
>   header, .sidebar, nav, button { display: none; }
>   body { font: 11pt/1.4 Georgia, serif; color: #000; background: #fff; }
>   main { max-width: none; margin: 0; display: block; }
>   h2, h3 { break-after: avoid; }
>   figure, table, pre { break-inside: avoid; }
>   a[href^="http"]::after { content: " (" attr(href) ")"; }
> }
> @page { margin: 2cm; }
> ```
>
> Hide what is useless on paper (navigation and controls). Linearise the layout and remove width limits, and use block layout for the main container, since page breaking inside grid and flex containers is less dependable. Use print units and a light colour scheme, because browsers drop backgrounds by default and a dark theme would print badly. Ask the browser not to break straight after a heading, or inside a figure or table; these are requests, and a box taller than a page is still split. Print the URL after external links, as a reader cannot click paper. Set the page margins with `@page`.
>
> To test, emulate the `print` media type in the DevTools Rendering tab to inspect the rules, and then check the real print preview or a saved PDF for the page breaks, in more than one browser.

### 30. You are given a `position: fixed` "back to top" button that scrolls away with the page instead of staying in the corner. List the steps you would take to find the cause, and the likely culprits.

> A fixed element is positioned against the viewport unless an ancestor becomes its containing block. So inspect the button and walk up its ancestors in the Elements panel, checking the Computed pane of each for a property that creates a containing block for fixed descendants: `transform` (including `translate`, `rotate`, and `scale`), `filter`, `backdrop-filter`, `perspective`, `will-change` naming one of those, or `contain: paint`, `layout`, `strict`, or `content`.
>
> A common culprit is an animation library or a page-transition wrapper that leaves `transform: translateX(0)` behind, or a `will-change: transform` added for performance. Fix it by removing the property once the animation has ended, or by moving the button in the DOM so that it is outside that ancestor, for example as a direct child of `<body>`.

### 31. When would you choose a container query over a media query, and what are the consequences of setting `container-type: inline-size` on an element?

> Use a media query for decisions about the page as a whole and about the user: overall page layout, and preferences such as colour scheme and reduced motion. Use a container query for a reusable component whose layout should depend on the space it has been given, since the same component can appear in a narrow sidebar and in a wide main column at one viewport width.
>
> Declaring `container-type: inline-size` applies inline-size containment, so the element's width can no longer be derived from its contents. If it was shrink-to-fit (a float, an inline-block, an absolutely positioned box, or an auto-sized flex item), it can collapse to zero width, so it must get its width from its context. It also applies style containment, which scopes counters. And the container cannot style itself through its own query; only its descendants can be targeted.

### 32. Explain what progressive enhancement means for a feature such as anchor positioning or scroll-driven animations, and show the shape of the CSS.

> You write a baseline that is fully usable in every browser, and then add the newer feature only where it is supported, so that no user gets a broken page and capable browsers get the better experience.
>
> ```css
> /* Baseline: works everywhere */
> .tooltip { position: absolute; inset-block-start: 100%; inset-inline-start: 0; }
>
> /* Enhancement */
> @supports (anchor-name: --a) {
>   .trigger { anchor-name: --tip; }
>   .tooltip {
>     position-anchor: --tip;
>     inset: auto;
>     position-area: block-end;
>     position-try-fallbacks: flip-block;
>   }
> }
> ```
>
> The fallback is written first and outside the query. `@supports` is needed here because the enhancement is several declarations that only make sense together, and it must undo part of the baseline. For a single value, two declarations in a row are enough, since a browser ignores the one it does not understand. The same applies to scroll-driven animations: content must be visible without them, so the reveal styles belong inside `@supports (animation-timeline: view())` and inside a `prefers-reduced-motion: no-preference` query.
