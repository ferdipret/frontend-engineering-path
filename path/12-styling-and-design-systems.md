# Styling at Scale and Design Systems

> Stage: 2 · Professional
> Writing CSS for one page is easy. Keeping it consistent and maintainable across hundreds of components and many contributors is the real skill.

## Styling approaches

- [ ] The scaling problem — global scope, specificity wars, dead CSS
- [ ] Methodologies — BEM and utility-first; what problem each solves
- [ ] CSS Modules — locally scoped class names
- [ ] Tailwind CSS — build fluently with utilities; configure the theme
- [ ] CSS-in-JS — runtime vs zero-runtime (vanilla-extract, Panda), and the SSR cost of runtime styles
- [ ] Variants — manage component variants with `cva` or equivalent
- [ ] Layers and scope at scale — use `@layer` and `@scope` to order resets, library styles, components, and overrides
- [ ] Preprocessors — read Sass; know what native CSS has made unnecessary
- [ ] PostCSS and Lightning CSS — what the CSS toolchain does to your styles
- [ ] Choosing — pick an approach for a team and defend it

## Design fundamentals for engineers

- [ ] Visual hierarchy — size, weight, colour, and space to guide the eye
- [ ] Spacing systems — a consistent scale instead of arbitrary values
- [ ] Type scales — a limited, harmonious set of sizes
- [ ] Colour systems — palettes, semantic roles, accessible contrast
- [ ] Layout principles — alignment, proximity, grids
- [ ] Interaction states — hover, focus, active, disabled, loading, error for every control
- [ ] Reading a design file — inspect and extract from Figma accurately
- [ ] Working with designers — ask about edge cases: long text, empty, error, small screens
- [ ] Design-to-code handoff — connect design components to code components (Figma Dev Mode, Code Connect) so both stay in sync

## Design systems

- [ ] Design tokens — primitive, semantic, and component tiers; export to code
- [ ] Theming — light/dark and brand themes via tokens and custom properties
- [ ] Component API design — props that are consistent, composable, hard to misuse
- [ ] Headless primitives — build on Radix, React Aria, or Ark for behaviour and accessibility
- [ ] Storybook — document and develop components in isolation
- [ ] Visual regression testing — catch unintended UI changes (Chromatic, Playwright screenshots)
- [ ] Component accessibility testing — automated checks, keyboard tests, and screen reader passes for every component
- [ ] Iconography — an SVG icon pipeline and sprite or component strategy
- [ ] Documentation — usage guidelines, do's and don'ts, examples
- [ ] Versioning and distribution — publish a package, semver, changelogs, codemods for breaking changes
- [ ] Adoption and governance — contribution model, deprecations, measuring usage

## Motion

- [ ] Purposeful animation — motion that communicates rather than decorates
- [ ] Easing and duration — choose curves and timings that feel right
- [ ] Animation libraries — Motion or GSAP for orchestrated sequences
- [ ] Layout and shared-element transitions — FLIP technique and the View Transitions API

## Projects

- [ ] Mini design system — tokens, eight components, Storybook docs, dark mode, published to npm
- [ ] Pixel-accurate build — implement a complex Figma design and overlay-compare it

## Resources

- [Refactoring UI](https://www.refactoringui.com/)
- [Storybook tutorials](https://storybook.js.org/tutorials/)
- [Design Tokens Community Group format](https://www.designtokens.org/)
- [Tailwind CSS docs](https://tailwindcss.com/docs)
