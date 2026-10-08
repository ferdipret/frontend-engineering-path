# CSS

> Stage: 1 · Foundations
> CSS is a declarative layout and styling language with its own mental model. Learn the model (cascade, box, formatting contexts) and the rest stops feeling like guesswork.

## Core model

- [ ] Selectors — type, class, id, attribute, combinators, pseudo-classes, pseudo-elements
- [ ] The cascade — origin, layers, specificity, and source order; predict which rule wins
- [ ] Specificity — calculate it, and know how `:is()`, `:where()`, and `:not()` affect it
- [ ] Inheritance — which properties inherit; `inherit`, `initial`, `unset`, `revert`
- [ ] The box model — content, padding, border, margin, and `box-sizing: border-box`
- [ ] Units — `px`, `rem`, `em`, `%`, `ch`, `vw`/`vh`, `dvh`, `fr`; choose the right one
- [ ] Custom properties — define, inherit, fall back, and scope CSS variables
- [ ] `@property` — register typed custom properties so they can animate and have defaults
- [ ] Values and functions — `calc()`, `min()`, `max()`, `clamp()`

## Layout

- [ ] Normal flow — block and inline formatting, and margin collapsing
- [ ] `display` — block, inline, inline-block, none, contents, flow-root
- [ ] Flexbox — main and cross axes, `flex` shorthand, wrapping, alignment, `gap`
- [ ] Grid — tracks, `fr`, `minmax()`, `auto-fit`/`auto-fill`, named areas, implicit grid
- [ ] Subgrid — align nested content to a parent grid
- [ ] Positioning — static, relative, absolute, fixed, sticky, and containing blocks
- [ ] Floats — wrap text around content with `float` and `shape-outside`, and read float-based layouts in older code
- [ ] Stacking contexts — explain why a `z-index: 9999` doesn't work
- [ ] Overflow and scrolling — `overflow`, scroll containers, `scroll-snap`, `overscroll-behavior`
- [ ] Sizing — intrinsic vs extrinsic sizing, `min-content`, `max-content`, `fit-content`, `aspect-ratio`
- [ ] Logical properties — `inline`/`block` instead of left/right/top/bottom

## Responsive design

- [ ] Mobile-first — start with the narrow layout and layer on enhancements
- [ ] Media queries — width, `prefers-color-scheme`, `prefers-reduced-motion`, `hover`, `pointer`
- [ ] Container queries — style components by their container, not the viewport
- [ ] Fluid type and space — scale with `clamp()` instead of breakpoints
- [ ] Responsive images in CSS — `object-fit`, `image-set()`, background sizing
- [ ] Print styles — `@media print`, page breaks, and making a page print well

## Visual styling

- [ ] Typography — font stacks, `line-height`, `font-weight`, measure, `text-wrap: balance`
- [ ] Web fonts — `@font-face`, `font-display`, variable fonts, subsetting
- [ ] Colour — hex, `rgb`, `hsl`, `oklch`, `color-mix()`, and contrast
- [ ] Backgrounds, borders, shadows — gradients, `border-radius`, `box-shadow`, `outline`
- [ ] Transitions — properties, durations, easing
- [ ] Keyframe animations — `@keyframes`, fill modes, and which properties animate cheaply
- [ ] Entry and exit animations — animate to and from `display: none` with `@starting-style` and `transition-behavior: allow-discrete`
- [ ] Transforms — translate, scale, rotate, and `transform-origin`
- [ ] Dark mode — implement theming with custom properties and `color-scheme`

## Modern CSS

- [ ] Nesting — native CSS nesting and `&`
- [ ] `:has()` — parent and sibling-aware selection
- [ ] Cascade layers — control precedence with `@layer`
- [ ] `@scope` — proximity-based scoping
- [ ] `@supports` — feature queries and progressive enhancement
- [ ] View transitions — animate between DOM states and pages
- [ ] Scroll-driven animations — animate on scroll progress without JavaScript
- [ ] Anchor positioning — tether popovers and tooltips to triggers

## Projects

- [ ] Recreate three layouts — a marketing page, a dashboard shell, and a card gallery, responsive from 320px up, no framework
- [ ] Themeable component set — buttons, inputs, cards with light/dark themes via custom properties
- [ ] CSS-only interactions — an accordion, tabs, and a carousel using only HTML and CSS, noting where CSS alone falls short on accessibility and browser support

## Resources

- [MDN: CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [web.dev: Learn CSS](https://web.dev/learn/css)
- [CSS-Tricks: A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [CSS-Tricks: A Complete Guide to CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Josh Comeau's blog](https://www.joshwcomeau.com/)
