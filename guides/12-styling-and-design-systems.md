# Styling at Scale and Design Systems: Guide

## Toolkit

### DevTools and tooling

- **Styles and Computed panes.** In the Elements panel, the Styles pane lists every rule that matches an element in winning order, with losing declarations struck through and the cascade layer shown. The Computed pane shows the final value; expand a property to see which rule supplied it. Click a `var(--token)` to jump to its definition, which is how you trace a semantic token back to its primitive.
- **Force element state.** The `:hov` button in the Styles pane forces `:hover`, `:focus`, `:focus-visible`, and `:active` so you can inspect and screenshot each one without holding the mouse.
- **Coverage.** Command menu (`Ctrl+Shift+P`), *Show Coverage*, reload. It reports unused bytes per stylesheet for the current page. Use it to find dead CSS, with the caveat that "unused here" is not "unused everywhere".
- **Rendering tab.** Emulate `prefers-color-scheme`, `prefers-reduced-motion`, `prefers-contrast`, and forced colours without changing OS settings. Emulate vision deficiencies to check colour is not the only signal.
- **Colour picker contrast.** Click a colour swatch on a `color` declaration: the picker shows the contrast ratio against the background and the AA and AAA thresholds. The *CSS Overview* panel lists every colour, font, and contrast failure on the page, which is a quick audit of how many one-off values have crept in.
- **Animations panel.** Slows animations to 25% or 10%, replays them, and lets you edit the easing curve visually.
- **Figma Dev Mode.** Shift+D. Select a layer to read sizes, spacing, typography, and bound variables; hold Alt (Option) and hover to measure distances.
- **Storybook.** `npm create storybook@latest` adds it to a project. It is your workshop, documentation site, and test harness for components.
- **Linters.** Stylelint with `stylelint-config-standard` catches invalid and inconsistent CSS and can forbid raw hex colours. `eslint-plugin-jsx-a11y` and the Tailwind CSS IntelliSense extension catch mistakes as you type.
- **Token and package tools.** Style Dictionary (`npx style-dictionary build`) transforms tokens; `publint` and *Are the types wrong?* check a package before you publish it.

### Testing and verifying your work

Styling work is verified by looking, so make the looking systematic.

1. **Every state of every component.** Write a story per variant and per state (default, hover, focus-visible, active, disabled, loading, error) and a story with hostile content: a very long unbroken string, an empty list, a translated label twice as long. If a state has no story, it is untested.
2. **Visual regression.** Run screenshot comparisons in CI, either Chromatic against your Storybook or Playwright's `toHaveScreenshot`. A change to a token or base style should produce a diff you review deliberately. Render in one fixed environment (a Docker image or the cloud service), because fonts and antialiasing differ between operating systems.
3. **Accessibility.** Run axe on each story (Storybook's accessibility addon does this), check contrast for every text and background token pair in both themes, and tab through each component by keyboard. Automated tools catch perhaps a third of problems; focus order, focus visibility, and screen-reader output need a manual pass.
4. **Themes and preferences.** Toggle dark mode, forced colours, 200% zoom, and reduced motion in the Rendering tab. Look for hard-coded colours that did not switch and animations that ignore the preference.
5. **Against the design.** Overlay an exported frame on your build at the same viewport size and compare. Check spacing and type values in the Computed pane against the design file rather than judging by eye.
6. **The package.** Before publishing, run `npm pack --dry-run` and read the file list, install the tarball into a fresh app, and confirm that importing one component does not pull in all of them.

"Done" for a component means: all states exist and are visible in stories, it works by keyboard and with a screen reader, it holds up with long and missing content, it looks right in every theme, and a visual test will catch the next unintended change.

### Tricks and gotchas

- Specificity fights are a symptom. Put resets, tokens, components, and utilities in `@layer`s so order of layers, not selector weight, decides who wins.
- Never build Tailwind class names by string concatenation (`'bg-' + color + '-500'`). The compiler scans source text for complete class names and will not generate what it cannot see.
- Conflicting utility classes (`p-2 p-4`) are resolved by stylesheet order, not by order in the `class` attribute. Use `tailwind-merge` when you let consumers pass `className`.
- A dark theme is not inverted colours. Depth comes from lighter surfaces instead of shadows, and saturated colours need toning down.
- Name tokens for what they do (`color-text-danger`), never for what they look like (`color-red`). The value will change; the purpose will not.
- Prevent the theme flash on load with a tiny blocking inline script in `<head>` that sets the theme attribute before first paint.
- Use `:focus-visible`, not `:focus`, for focus rings, and never remove an outline without replacing it.
- `disabled` buttons are skipped by the keyboard and announce nothing about why. Consider `aria-disabled="true"` with an explanation when the user needs to know.
- Animate `transform` and `opacity` only. Animating `width`, `height`, `top`, or `left` forces layout on every frame.
- Icons should use `fill="currentColor"` or `stroke="currentColor"` so they inherit text colour and theme for free.
- Run screenshot tests with animations disabled and fonts loaded, or you will chase flaky diffs.
- A removed prop is a breaking change, and so is a changed default, a renamed CSS variable, and a changed DOM structure that consumers style against.
- Runtime CSS-in-JS libraries that inject styles during render do not work in React Server Components.
- Check the 320 px width and 200% zoom early. Layout problems found late are expensive.

### Official references

- [MDN: Cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers) - how `@layer` orders styles independent of specificity.
- [Tailwind CSS documentation](https://tailwindcss.com/docs/styling-with-utility-classes) - utility-first styling, theme variables, variants, and directives.
- [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/) - the stable community specification for token files.
- [Style Dictionary documentation](https://styledictionary.com/getting-started/installation/) - the standard tool for transforming tokens into platform code.
- [Storybook documentation](https://storybook.js.org/docs) - writing stories, docs, and tests for components.
- [WAI-ARIA Authoring Practices Guide: Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) - expected keyboard and ARIA behaviour for common widgets.
- [WCAG 2.2: Understanding Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) - the contrast requirement and how it is measured.
- [Playwright: Visual comparisons](https://playwright.dev/docs/test-snapshots) - screenshot assertions and their options.
- [Chrome for Developers: View transitions](https://developer.chrome.com/docs/web-platform/view-transitions) - same-document and cross-document transitions.
- [Semantic Versioning 2.0.0](https://semver.org/) - the contract behind version numbers.

## Skills

### The scaling problem

CSS was designed for documents, and three of its features become liabilities as a codebase and team grow.

**Global scope.** Every selector applies to the whole page. `.title` in the checkout stylesheet also matches the `.title` someone adds to the blog next year. Nothing warns you; the collision appears as a visual bug somewhere you were not looking.

**Specificity wars.** When a rule does not apply, the fastest fix is a stronger selector. The next person needs a stronger one still.

```css
.card .title { color: navy; }
.sidebar .card .title { color: black; }       /* override */
#main .sidebar .card .title { color: gray; }  /* override the override */
.title { color: red !important; }             /* give up */
```

Each step makes the next change harder, and source order across files starts to matter in ways nobody can hold in their head.

**Dead CSS.** Deleting markup is safe; deleting CSS is not, because you cannot prove a selector is unused. It might match a class added by JavaScript, a CMS template, or an email. So stylesheets only grow. Append-only CSS is the clearest sign of the problem.

Underneath all three is the same gap: there is no explicit link between a style rule and the component that needs it. Every approach in this module is a way of creating that link. Naming conventions do it by discipline, CSS Modules and scoped styles by tooling, utility classes by putting the styles in the markup, and CSS-in-JS by putting them in the component file.

The platform has also caught up with `@layer` and `@scope`, covered in *Layers and scope at scale*.

**Try it:** Open a large production site, run the Coverage tool, and note the percentage of unused CSS on the home page. Then open CSS Overview and count the distinct colours and font sizes. Both numbers tell you how well the site's styling has scaled.

**Resources**
- [MDN: Cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers)
- [MDN: @scope](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope)
- [Chrome DevTools: Coverage](https://developer.chrome.com/docs/devtools/coverage)

### Methodologies

A methodology is a set of rules that makes plain CSS predictable. Two dominate, and they solve the scaling problem from opposite directions.

**BEM** (Block, Element, Modifier) fakes scope with naming. A block is a standalone component, an element is a part of it, a modifier is a variation.

```html
<article class="card card--featured">
  <h2 class="card__title">Title</h2>
  <button class="card__action card__action--primary">Read</button>
</article>
```

```css
.card { }
.card--featured { }
.card__title { }
```

Every selector is a single class, so specificity is flat and equal, and the name says which component a rule belongs to. The costs are long names, the constant work of naming things, and nothing but discipline to stop someone writing `.card .title`. Elements do not nest in the name: `card__header__title` is wrong; use `card__title`.

**Utility-first** removes naming instead of systematising it. Each class does one thing, and you compose them in the markup.

```html
<article class="rounded-lg border p-4 shadow-sm">
  <h2 class="text-lg font-semibold">Title</h2>
</article>
```

Styles are colocated with the element, so deleting the element deletes its styles; the stylesheet stops growing because utilities are reused; and values come from a fixed scale, which enforces consistency. The costs are noisy markup and a vocabulary to learn. The objection that it is "just inline styles" misses that utilities are constrained to a design scale and support hover, focus, media queries, and dark mode, which inline styles cannot.

Other names you will meet: OOCSS (separate structure from skin), SMACSS (categorise rules), ITCSS (order layers from generic to specific, now expressible with `@layer`), and CUBE CSS (lean on the cascade, then add utilities and exceptions). They are compatible ideas rather than rivals. Most modern codebases use utilities or scoped component styles, with BEM-style naming surviving inside design-system CSS.

**Try it:** Build the same card twice, once with BEM in a stylesheet and once with utility classes. Then add a "compact" variant to each and delete the card's footer from each. Note which changes touched one file and which touched two.

**Resources**
- [Tailwind CSS: Styling with utility classes](https://tailwindcss.com/docs/styling-with-utility-classes)
- [CSS-Tricks: BEM 101](https://css-tricks.com/bem-101/)
- [CUBE CSS](https://cube.fyi/)

### CSS Modules

A CSS Module is an ordinary CSS file whose class names are local by default. The build tool rewrites each class to a unique name and gives your JavaScript a mapping object.

```css
/* button.module.css */
.button { padding: 0.5rem 1rem; border-radius: 0.375rem; }
.primary { background: var(--color-action); color: white; }
```

```tsx
import styles from './button.module.css';

export function Button({ primary, ...props }: { primary?: boolean } & React.ComponentProps<'button'>) {
  return (
    <button
      className={[styles.button, primary && styles.primary].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
```

The rendered class is something like `button_button__x7Kp2`, so `.button` here cannot collide with `.button` anywhere else. You write real CSS with all its features, there is no runtime cost, and it works with Server Components. Vite and Next.js support `*.module.css` with no configuration.

What to understand beyond the basics:

- **Only class names (and IDs, keyframes) are scoped.** A selector like `.card h2` still matches any `h2` inside, including those in nested components. Scope is by name, not by DOM subtree.
- **`:global(.some-class)`** opts a selector out, which you need when targeting a class set by a third-party library.
- **`composes: base from './shared.module.css'`** adds another module's class to the element. It is useful but niche.
- **Dynamic values** go through custom properties: set `style={{ '--progress': value }}` and read `var(--progress)` in the CSS.
- **Specificity still applies** inside and between modules, and import order decides ties. Keep selectors to a single class.
- **Typing.** `styles.buton` is `undefined` at runtime with no error. A TypeScript plugin or generated `.d.ts` files catch the typo.

CSS Modules solve collisions but not consistency: nothing stops each file inventing its own spacing and colours. Pair them with design tokens as custom properties.

**Try it:** Create two components that each define `.title` in their own module and render them on one page. Inspect the generated class names. Then write `.wrapper p { color: red }` in the parent's module and observe it leaking into the child component.

**Resources**
- [CSS Modules specification and documentation](https://github.com/css-modules/css-modules)
- [Vite: CSS Modules](https://vite.dev/guide/features#css-modules)
- [Next.js: CSS](https://nextjs.org/docs/app/getting-started/css)

### Tailwind CSS

Tailwind generates utility classes from a theme. The compiler scans your source files for class names and emits CSS only for those it finds, so the output stays small however large the framework's vocabulary is.

Fluency means knowing the grammar, not memorising classes. A class is `variant:utility-value`, and variants stack:

```html
<button class="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white
               hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2
               disabled:opacity-50 md:text-base dark:bg-brand-500">
  Save
</button>
```

Responsive variants are mobile-first: `md:` means "at the `md` breakpoint and up". Square brackets take arbitrary values (`w-[37ch]`, `bg-(--my-var)`), which is an escape hatch, not a habit.

In Tailwind v4 the theme is configured in CSS. Theme variables define which utilities exist and are also emitted as custom properties on `:root`:

```css
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.65 0.19 255);
  --color-brand-600: oklch(0.56 0.2 257);
  --color-brand-700: oklch(0.48 0.19 259);
  --font-display: "Inter Tight", sans-serif;
  --breakpoint-3xl: 120rem;
}
```

That creates `bg-brand-600`, `font-display`, and a `3xl:` variant. Setting `--color-*: initial` first removes the default palette so that only your colours exist. Spacing utilities are multiples of a single `--spacing` value. Older projects configure the theme in `tailwind.config.js`; you need to be able to read both.

Mistakes to avoid:

- **Dynamic class names.** `` `text-${color}-600` `` is invisible to the scanner. Map props to complete class strings instead.
- **Extracting too early with `@apply`.** Repetition is solved by components, not by recreating semantic CSS classes.
- **Arbitrary values everywhere.** `mt-[13px]` defeats the point of a scale.
- **Unsorted classes.** Use the official Prettier plugin so class order is consistent and diffs are readable.

**Try it:** Start a Vite project with `@tailwindcss/vite`. Define a three-step brand colour and a custom breakpoint in `@theme`, build a responsive card with hover, focus, and dark variants, then inspect `:root` in DevTools to see your theme variables as custom properties.

**Resources**
- [Tailwind CSS: Theme variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS: Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [Tailwind CSS: Hover, focus, and other states](https://tailwindcss.com/docs/hover-focus-and-other-states)

### CSS-in-JS

CSS-in-JS means authoring styles in JavaScript or TypeScript, next to the component. The category splits by *when* the CSS is produced.

**Runtime** libraries (styled-components, Emotion) generate CSS in the browser. When a component renders, the library serialises its styles, hashes them into a class name, and injects a rule into a `<style>` tag. This makes styles fully dynamic, since any prop can change any value, and it costs:

- Library code in the bundle and work on every render, which shows up in interaction latency.
- **SSR complexity.** The server must collect the styles produced during render and inline them into the HTML, or the page arrives unstyled and flashes. With streaming, styles have to be flushed in step with each chunk.
- **Server Components.** Runtime libraries depend on context and render-time injection, which Server Components do not have. Styled components must live in Client Components, which pulls more of your tree into the client bundle.

**Zero-runtime** libraries keep the authoring model and move the work to build time. vanilla-extract evaluates `.css.ts` files during the build and emits static CSS with typed class names:

```ts
// button.css.ts
import { style } from '@vanilla-extract/css';

export const button = style({
  padding: '0.5rem 1rem',
  borderRadius: 6,
  ':hover': { opacity: 0.9 },
});
```

Panda CSS statically analyses calls like `css({ px: 4, bg: 'brand.500' })` and generates atomic classes, giving a utility-style output with a typed, token-aware API. Both produce plain CSS files that work with any rendering strategy.

The trade is dynamism: values must be known at build time. Truly dynamic values are passed through custom properties set in the `style` attribute. In practice, most "dynamic" styling is a finite set of variants, which static tools handle well.

For a new project, choose a zero-runtime option, CSS Modules, or Tailwind. Understand runtime CSS-in-JS because a great deal of existing code uses it.

**Try it:** Write a button with vanilla-extract and inspect the build output: find the generated `.css` file and confirm no styling library is in the JavaScript bundle. If you have a styled-components project, record a Performance profile while typing into an input that re-renders styled children, and look for style injection work.

**Resources**
- [vanilla-extract: Getting started](https://vanilla-extract.style/documentation/getting-started)
- [Panda CSS: Why Panda](https://panda-css.com/docs/overview/getting-started)
- [Next.js: CSS-in-JS](https://nextjs.org/docs/app/guides/css-in-js)

### Variants

A component's visual options multiply quickly: three sizes, four intents, outline or solid, each with disabled and loading states. Written as conditionals, the styling logic becomes unreadable:

```tsx
className={`btn ${size === 'sm' ? 'px-2 text-sm' : 'px-4'} ${intent === 'danger' && !outline ? 'bg-red-600' : ''} …`}
```

A variant function replaces that with a declarative map. `cva` (class-variance-authority) is the common choice:

```ts
import { cva, type VariantProps } from 'class-variance-authority';

export const button = cva('inline-flex items-center rounded-md font-medium', {
  variants: {
    intent: {
      primary: 'bg-brand-600 text-white hover:bg-brand-700',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
    },
    outline: { true: 'bg-transparent border' },
  },
  compoundVariants: [
    { intent: 'danger', outline: true, class: 'border-red-600 text-red-700' },
  ],
  defaultVariants: { intent: 'primary', size: 'md' },
});

export type ButtonVariants = VariantProps<typeof button>;
```

`button({ intent: 'danger', size: 'sm' })` returns the class string. `VariantProps` derives the TypeScript prop types from the same definition, so the styles and the component's API cannot drift apart. **Compound variants** express "when A *and* B", which is where hand-written conditionals usually go wrong.

Details that matter:

- `cva` only concatenates strings. It is not tied to Tailwind and works with CSS Modules or plain classes.
- With Tailwind, two conflicting classes do not resolve by order in the string. Pass the result through `tailwind-merge` (the familiar `cn()` helper combines `clsx` and `twMerge`) when consumers can supply a `className`.
- Model variants as an enumerated set of names, not booleans. `variant="primary"` cannot conflict with itself; `primary` plus `secondary` booleans can.
- Equivalents exist elsewhere: Tailwind Variants (adds slots for multi-part components), Panda's `cva` and recipes, vanilla-extract's recipes package.
- In plain CSS the same idea is a data attribute per axis: `.button[data-size="sm"]`.

**Try it:** Take a component that has at least three style-affecting props written as ternaries and rewrite it with `cva`. Add one compound variant. Then pass an invalid variant value and confirm TypeScript rejects it.

**Resources**
- [CVA: Documentation](https://cva.style/docs)
- [Tailwind Variants: Introduction](https://www.tailwind-variants.org/docs/introduction)
- [Panda CSS: Recipes](https://panda-css.com/docs/concepts/recipes)

### Layers and scope at scale

Two native features address the scaling problem directly: `@layer` controls *which rule wins*, and `@scope` controls *which elements a rule reaches*.

**Cascade layers.** Declare the order once, at the top of the first stylesheet. Later layers beat earlier ones regardless of specificity or source order.

```css
@layer reset, tokens, vendor, components, utilities, overrides;

@import url("date-picker.css") layer(vendor);

@layer reset { button { all: unset; } }

@layer components {
  .card .title { color: navy; }      /* specificity (0,2,0) */
}

@layer utilities {
  .text-danger { color: crimson; }   /* (0,1,0), but wins: later layer */
}
```

Specificity now only matters *within* a layer. A third-party stylesheet with heavy selectors, imported into `vendor`, can be overridden by a single class in `components`. Rules to remember:

- **Unlayered styles beat every layer.** A stray stylesheet outside the layer system wins over all of it, so adopt layers completely or legacy CSS will dominate.
- **`!important` reverses layer order.** An important declaration in the first layer beats one in the last. That lets a reset protect something, and it surprises people.
- The first mention of a layer name fixes its position; the single declaration line is the source of truth.
- Layers can nest (`@layer components.card`).
- Tailwind v4 emits its own layers (`theme`, `base`, `components`, `utilities`); place your layers relative to those.

**Scope.** `@scope` limits rules to a subtree, with an optional lower boundary so that styles stop where a nested component begins:

```css
@scope (.card) to (.card__slot) {
  :scope { border: 1px solid var(--color-border); }
  img { border-radius: 0.5rem; }   /* images in the card, not in slotted content */
  .title { font-weight: 600; }
}
```

This "donut" is something CSS Modules and BEM cannot express. Scoped selectors stay short and low in specificity, and when two scopes target the same element with equal specificity, the rule whose scope root is *nearer* wins (scoping proximity), which makes nested themes behave sensibly. A `<style>` element containing a bare `@scope { … }` scopes to its parent element.

`@layer` has been available in all major browsers since 2022. `@scope` became available across them in late 2025, so check your support targets before depending on it; it cannot be polyfilled by a build step.

**Try it:** Take a page that loads a third-party widget's CSS. Import that CSS into a `vendor` layer and put your own styles in a later layer, then override one of the widget's most specific rules with a single class selector. Next, add an unlayered rule for the same property and watch it beat both.

**Resources**
- [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [MDN: @scope](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope)
- [MDN: Cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers)

### Preprocessors

Sass (SCSS syntax) compiles to CSS and for a decade supplied what CSS lacked. You will maintain Sass, so read it fluently:

```scss
@use 'sass:map';
@use './tokens' as t;

$breakpoints: (md: 48rem, lg: 64rem);

@mixin from($name) {
  @media (min-width: map.get($breakpoints, $name)) { @content; }
}

.card {
  padding: t.$space-4;
  &__title { font-weight: 600; }      // .card__title
  &:hover { box-shadow: t.$shadow-md; }
  @include from(md) { padding: t.$space-6; }
}

@each $name, $color in t.$intents {
  .badge--#{$name} { background: $color; }
}
```

`$variables` are compile-time constants. `@mixin` and `@include` reuse blocks. `&` is the parent selector. `@each`, `@for`, and `@if` generate rules. `@use` loads a module with a namespace; the older `@import` is deprecated and scheduled for removal in Dart Sass 3, so new code should not use it.

Native CSS now covers most of the everyday reasons to reach for Sass:

| Sass feature | Native CSS |
| --- | --- |
| Variables | Custom properties, which also work at runtime and cascade |
| Nesting | CSS nesting (`&` works; `&__title` concatenation does not) |
| Colour functions | `color-mix()`, relative colour syntax, `oklch()` |
| Maths | `calc()`, `min()`, `max()`, `clamp()`, `round()` |
| File organisation | `@layer`, plus bundler imports |

What CSS still lacks in all browsers: mixins, loops, and maps. A native `@function` exists in Chromium but is not yet cross-browser. If your design system generates dozens of utility classes from a map, Sass or a token build step still earns its place.

Know the conceptual difference: a Sass variable is replaced at compile time and cannot respond to a theme class or media query, while a custom property is resolved in the browser. Over-nesting is the classic Sass mistake: five levels of nesting produce five-part selectors and the specificity problems that come with them.

**Try it:** Take a small SCSS file that uses variables, nesting, and a `darken()` call. Rewrite it in plain CSS with custom properties, native nesting, and `color-mix()`. Note which construct, if any, you could not translate.

**Resources**
- [Sass: Documentation](https://sass-lang.com/documentation/)
- [Sass: @import is deprecated](https://sass-lang.com/blog/import-is-deprecated/)
- [MDN: Using CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting)

### PostCSS and Lightning CSS

The CSS you write is rarely the CSS that ships. A toolchain transforms it, and knowing what it does explains surprises in the output.

**PostCSS** parses CSS into an abstract syntax tree, runs plugins over it, and prints the result. It does nothing on its own. Common plugins: Autoprefixer (adds vendor prefixes based on your browser targets), `postcss-preset-env` (compiles newer syntax such as nesting or `light-dark()` to older equivalents), cssnano (minification), and, up to version 3, Tailwind itself.

**Lightning CSS** is a single Rust tool that does parsing, prefixing, syntax lowering, bundling of `@import`s, CSS Modules, and minification, many times faster than a chain of JavaScript plugins. Tailwind v4 uses it internally, and Vite can use it for both transforms and minification.

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  css: { transformer: 'lightningcss' },
  build: { cssMinify: 'lightningcss' },
});
```

Both read your **Browserslist** targets. That query decides which prefixes are added and which features are compiled down. If you write:

```css
.card {
  color: oklch(0.6 0.2 250);
  &:hover { color: color-mix(in oklch, currentColor, black 20%); }
}
```

with old targets, the output may contain a flattened `.card:hover` selector and an `rgb()` fallback before the `oklch()` declaration. With modern targets it passes through almost unchanged.

What to remember:

- Syntax can be compiled; behaviour cannot. No plugin makes container queries or `:has()` work in a browser that lacks them.
- Out-of-date targets ship unnecessary prefixes and fallbacks. Run `npx browserslist` to see the list your config resolves to.
- Minifiers merge and reorder rules. That is safe by specification, but it can expose code that depended on accidental source order.
- Enable CSS source maps so DevTools points at your source file, not the bundle.

**Try it:** Paste the snippet above into the Lightning CSS playground. Change the browser targets from the latest versions to ones several years old and watch the output change. Then run `npx browserslist` in one of your projects.

**Resources**
- [Lightning CSS: Transpilation](https://lightningcss.dev/transpilation.html)
- [PostCSS: Documentation](https://postcss.org/docs/)
- [Vite: CSS features](https://vite.dev/guide/features#css)

### Choosing

There is no best styling approach, only a best fit for a team and product. Decide against explicit criteria and write the decision down.

- **Rendering model.** With React Server Components or heavy streaming SSR, prefer anything that produces static CSS: Tailwind, CSS Modules, vanilla-extract, Panda. Runtime CSS-in-JS works against you.
- **Team.** A large or changing team benefits from constraints that make the consistent choice the easy one; Tailwind's scale does that. Strong CSS authors may prefer real CSS files in Modules.
- **Design system maturity.** If tokens exist, pick the approach that consumes them most directly and makes off-system values awkward.
- **Type safety.** vanilla-extract and Panda give typed tokens and variants; valuable in a component library.
- **Distribution.** A library consumed by other teams should not force a styling runtime or a specific Tailwind version on them. Ship plain CSS with custom properties as the theming surface.
- **Existing code.** Migration cost is real. A mixed codebase is worse than a consistent "second-best" one.

A rough comparison:

| Approach | Strength | Watch out for |
| --- | --- | --- |
| Tailwind | Speed, consistency, tiny CSS | Markup noise, needs component abstraction |
| CSS Modules | Real CSS, no runtime, simple | No built-in consistency; pair with tokens |
| vanilla-extract / Panda | Typed, static, token-aware | Build integration, learning curve |
| Runtime CSS-in-JS | Fully dynamic | Runtime and SSR cost, RSC incompatibility |
| Sass + BEM | Familiar, no lock-in | Relies on discipline |

To defend a choice, state the criteria, how each option scored, what you are giving up, and what would make you revisit it. Record it as a short architecture decision record. The poor arguments are "it is popular", "I know it", and a bundle-size comparison of a toy app. Whatever you choose, the tokens should live outside the styling tool, as custom properties or a token file, so that a future migration does not also mean redefining the design language.

**Try it:** Write a one-page decision record for a real or imagined team: context, options considered, criteria with weights, the decision, and consequences. Ask someone who prefers a different approach to challenge it.

**Resources**
- [Tailwind CSS: Styling with utility classes](https://tailwindcss.com/docs/styling-with-utility-classes)
- [web.dev: Learn CSS](https://web.dev/learn/css)
- [Architectural Decision Records](https://adr.github.io/)

### Visual hierarchy

Visual hierarchy is the order in which a design leads the eye. Users scan before they read, and hierarchy decides what they notice first, second, and not at all. Engineers need this skill because every screen you build without a designer, and every gap in a design you fill, is a hierarchy decision.

You have four tools:

- **Size.** Bigger draws attention, but it is the bluntest tool and the one beginners overuse.
- **Weight.** A 600-weight label at the same size as body text reads as more important without disturbing the layout.
- **Colour and contrast.** Use two or three text colours: a strong one for primary content, a softer one for secondary, a softer one still for tertiary. De-emphasising supporting content is often more effective than emphasising the main content.
- **Space.** Generous space around an element gives it importance; proximity signals grouping.

A typical card applies all four:

```css
.price { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
.name  { font-size: 1rem;   font-weight: 500; color: var(--text-primary); }
.meta  { font-size: 0.875rem; color: var(--text-secondary); }
```

Principles that fix most engineer-built interfaces:

- One primary action per view. If three buttons are all solid and coloured, none is primary. Use solid, outline, and text-only treatments to rank them.
- Labels are usually secondary to their values. In "Status: Shipped", the word *Shipped* matters.
- Visual hierarchy and document hierarchy are separate. Choose heading levels (`h1` to `h6`) for structure and accessibility, then style them to whatever size the design needs.
- Do not rely on colour alone to rank or to signal state; some users will not perceive it.

Two quick checks: the **squint test** (blur your eyes or the screenshot; what stands out should be what matters most) and converting to greyscale to see whether the hierarchy survives without hue.

**Try it:** Take a settings page or card you built and screenshot it. Apply a 5 px blur in an image editor or with `filter: blur(5px)` on the `<body>`. List what you can still identify. Then adjust only weight and text colour, not size, until the right element dominates.

**Resources**
- [web.dev: Learn Design](https://web.dev/learn/design)
- [Nielsen Norman Group: Visual hierarchy in UX](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)

### Spacing systems

A spacing system is a short list of allowed distances. Instead of choosing between 13, 14, 15, and 16 pixels each time, you choose a step. This removes hundreds of small decisions, makes layouts look deliberate, and gives designers and engineers a shared vocabulary ("space-4", not "about 15").

Most systems use a 4 px base with steps that grow further apart as they get larger, because the eye cannot tell 44 from 48 but can tell 4 from 8:

```css
:root {
  --space-1: 0.25rem;  /*  4px */
  --space-2: 0.5rem;   /*  8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
}
```

Define them in `rem` so spacing scales with the user's font-size preference.

Using the scale well:

- **Space expresses relationships.** Related things sit closer together than unrelated things. The gap between a label and its input should be smaller than the gap between one form field and the next, or the grouping is ambiguous.
- **Let the parent own spacing.** Use `gap` on a flex or grid container rather than margins on children. A component with an outer margin is hard to reuse, because every context wants a different one.
- **Start with more space than feels necessary**, then tighten. Cramped layouts are the more common failure.
- **Exceptions are legitimate but rare.** Optical alignment of an icon may need 1 or 2 px outside the scale. Write it as an explicit exception with a comment, not as a new habit.
- Fluid spacing with `clamp()` lets large section gaps shrink smoothly on small screens without breakpoints.

If you find yourself wanting a value between two steps often, the scale is wrong; fix the scale rather than bypassing it. A Stylelint rule that rejects raw pixel values in `margin`, `padding`, and `gap` keeps the system honest.

**Try it:** Open CSS Overview or search a stylesheet for every distinct `margin`, `padding`, and `gap` value. Count them. Map each to the nearest step on an eight-step scale and replace them. Check which, if any, visibly changed the design.

**Resources**
- [web.dev: Learn CSS: Spacing](https://web.dev/learn/css/spacing)
- [Tailwind CSS: Theme variables](https://tailwindcss.com/docs/theme)
- [Carbon Design System: Spacing](https://carbondesignsystem.com/elements/spacing/overview/)

### Type scales

A type scale is a small, fixed set of font sizes, each paired with a line height and often a weight and letter spacing. Six to nine steps cover almost any interface. Limiting the set is what makes text look consistent across screens built by different people.

Scales are often generated from a base size and a ratio (1.2 or 1.25 are common for interfaces; larger ratios suit editorial sites), then rounded to practical values:

```css
:root {
  --text-sm:  0.875rem;  --leading-sm: 1.25rem;
  --text-base: 1rem;     --leading-base: 1.5rem;
  --text-lg:  1.125rem;  --leading-lg: 1.75rem;
  --text-xl:  1.25rem;   --leading-xl: 1.75rem;
  --text-2xl: 1.5rem;    --leading-2xl: 2rem;
  --text-4xl: 2.25rem;   --leading-4xl: 2.5rem;
}
```

What goes with the sizes:

- **Line height is relative to size.** Body text reads well around 1.5; large headings need about 1.1 to 1.25, or the lines drift apart. This is why a scale stores them as pairs.
- **Line length.** Aim for roughly 45 to 75 characters. `max-width: 65ch` on text containers does it.
- **Units.** Use `rem` so text respects the user's browser font size. Pixel font sizes ignore that setting.
- **Weights.** Two or three (400, 500 or 600, 700) are enough. Each extra weight is a design decision to justify and, without a variable font, a file to download.
- **Tracking.** Large headings often look better with slightly negative letter spacing; small uppercase labels need positive.
- **Fluid type.** `font-size: clamp(1.75rem, 1.2rem + 2.5vw, 3rem)` scales a heading smoothly between a minimum and maximum. Keep a `rem` term in the middle value so zooming still works.

Name steps by size (`text-lg`) or by role (`heading-2`, `body`, `caption`); role names map better onto design files. Do not tie styles to HTML elements: an `h2` in a sidebar and an `h2` in an article often need different steps. Keep form inputs at 16 px or larger on mobile, because iOS Safari zooms the page when a smaller input is focused.

**Try it:** Use CSS Overview to list every font size on a site you work on. Design a seven-step scale that covers them, define it as custom properties with paired line heights, and replace the values. Then set your browser's default font size to 20 px and confirm everything scales.

**Resources**
- [web.dev: Learn Design: Typography](https://web.dev/learn/design/typography)
- [Utopia: Fluid type scale calculator](https://utopia.fyi/type/calculator/)
- [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)

### Colour systems

A colour system has two layers. The **palette** is the raw material: for each hue (neutral, brand, red, green, amber) a ramp of around ten to twelve steps from very light to very dark. **Semantic roles** map purposes onto palette steps: `surface`, `surface-raised`, `text-primary`, `text-secondary`, `border`, `action`, `danger`, `success`. Components use roles only.

```css
:root {
  /* palette */
  --gray-50: oklch(0.98 0.003 250);
  --gray-900: oklch(0.21 0.02 255);
  --blue-600: oklch(0.55 0.2 258);
  --red-600: oklch(0.56 0.22 27);

  /* roles */
  --color-surface: var(--gray-50);
  --color-text: var(--gray-900);
  --color-action: var(--blue-600);
  --color-danger: var(--red-600);
}
```

Build ramps in **OKLCH**. Its lightness channel is perceptually uniform, so step 600 of blue and step 600 of red look equally dark and contrast predictably against the same background. HSL lightness does not have that property: HSL yellow and HSL blue at 50% lightness are nowhere near each other visually.

**Accessible contrast** is a requirement, not polish. WCAG 2.2 level AA requires 4.5:1 for normal text and 3:1 for large text (about 24 px, or 18.66 px bold) and for meaningful non-text elements such as input borders, icons, and focus indicators. Design the ramp so that known step pairs pass: for example, text at step 700 or darker on surfaces at step 100 or lighter. Then the guarantee lives in the system rather than in each developer's memory.

Other rules:

- Neutrals do most of the work. A real interface is mostly greys with one accent.
- Never use colour as the only signal. Pair an error colour with an icon and text.
- Every state colour needs a subtle background, a border, and a readable text variant, not one "red".
- Semantic roles are what make dark mode possible: you remap roles to different steps rather than editing components.
- Placeholder and disabled text are where contrast most often fails. Disabled controls are exempt from the requirement, but placeholders are not.

**Try it:** Generate a ten-step grey and a ten-step brand ramp in OKLCH by stepping lightness evenly. Using the DevTools colour picker's contrast readout, find which text and background step pairs reach 4.5:1 and write the rule down as part of your system.

**Resources**
- [WCAG 2.2: Understanding Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [MDN: oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
- [Radix Colors: Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)

### Layout principles

Layout communicates structure before anyone reads a word. Three principles carry most of the weight.

**Alignment.** Every element should line up with something else. A page with a few strong vertical edges looks ordered; one where items are offset by a few pixels looks careless even if nobody can say why. Left-align body text (in left-to-right languages); centre only short, isolated content. Right-align numbers in table columns, with `font-variant-numeric: tabular-nums`, so digits line up. Geometric alignment sometimes looks wrong: an icon or a play triangle may need a nudge to appear centred. That is optical alignment, and it is deliberate.

**Proximity.** People perceive things that are close together as related (a Gestalt principle). This means spacing is information. The gap inside a group must be clearly smaller than the gap between groups. A heading should sit closer to the paragraph it introduces than to the one before it. If a form looks confusing, check whether each label is nearer to its own field than to the neighbouring one.

**Grids.** A grid gives a page consistent columns, gutters, and margins. Twelve columns is common because it divides into halves, thirds, quarters, and sixths. But not everything should stretch to fit columns: a form or an article has a natural maximum width, and fixed sidebars plus a flexible main area often work better than percentages.

```css
.page {
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr);
  gap: var(--space-8);
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--space-6);
}
.card { display: grid; grid-template-rows: subgrid; grid-row: span 3; }
```

`repeat(auto-fill, minmax())` gives a responsive grid with no media queries. `subgrid` lets cards in a row share row tracks so that titles, bodies, and footers align across cards even when content lengths differ.

Supporting ideas: consistency (the same pattern in the same place on every screen), whitespace as an active element rather than leftover area, and content-driven sizing over fixed dimensions.

**Try it:** Turn on the grid overlay in DevTools (the `grid` badge in the Elements panel) on a page you built. Draw the alignment edges you can see on a screenshot. If there are more than a handful of distinct left edges, consolidate them.

**Resources**
- [MDN: CSS grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- [Nielsen Norman Group: Proximity principle in visual design](https://www.nngroup.com/articles/gestalt-proximity/)
- [web.dev: Learn Design: Macro layouts](https://web.dev/learn/design/macro-layouts)

### Interaction states

Design files usually show a control in its resting state. A real control has many more, and each one that is missing becomes a bug or a guess.

| State | Trigger | Requirement |
| --- | --- | --- |
| Hover | Pointer over | Subtle change; never the only way to reveal information |
| Focus | Keyboard navigation | Clearly visible indicator with at least 3:1 contrast |
| Active | Being pressed | Immediate feedback |
| Disabled | Not available | Looks unavailable, cannot be activated |
| Loading | Action in progress | Shows progress, prevents double submission |
| Error | Invalid | Message in text, tied to the control |

```css
.button:hover { background: var(--action-hover); }
.button:active { background: var(--action-active); }
.button:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.button[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; }

@media (hover: hover) {
  .card:hover { box-shadow: var(--shadow-md); }
}
```

What each state hides:

- **Focus.** Use `:focus-visible` so the ring appears for keyboard users and not on mouse click. `outline: none` without a replacement makes the page unusable by keyboard.
- **Hover.** Touch devices have no hover, and "sticky hover" after a tap is a common glitch; the `(hover: hover)` media query avoids it.
- **Disabled.** The `disabled` attribute removes a button from the tab order and from form submission, and gives no explanation. When users need to discover the control and learn why it is unavailable, use `aria-disabled="true"`, keep it focusable, block the action in the handler, and explain.
- **Loading.** Keep the button's width stable (overlay the spinner rather than replacing the label), set `aria-busy`, and ignore repeat clicks. Announce completion for screen-reader users.
- **Error.** Set `aria-invalid="true"` and connect the message with `aria-describedby`. Colour alone is not enough.
- Others to ask about: selected, checked, indeterminate, read-only, expanded, dragging, and visited.

States combine: a focused, invalid input; a hovered, selected row. Decide which wins, and test the combinations in stories.

**Try it:** Pick a button and a text input from your project. Using the DevTools force-state controls, screenshot each state in the table. List the ones that look identical to another state or do not exist. Tab to each control and check the focus ring's contrast.

**Resources**
- [MDN: :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
- [WCAG 2.2: Understanding Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- [MDN: aria-disabled](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled)

### Reading a design file

Implementing a design accurately starts with extracting the right information from Figma, and that is mostly about recognising the system behind the pixels.

Use **Dev Mode** (Shift+D). Select a layer and the inspect panel shows dimensions, spacing, typography, colours, and, when the designer used them, the **variables** and **styles** behind each value. Hold Alt (Option on macOS) and hover another layer to see the distance between them.

Read structure before values:

- **Auto layout maps to flexbox.** Direction, gap, padding, and alignment translate directly. The resizing settings are the important part: *Hug contents* means the size comes from the content, *Fill container* means `flex: 1` or `align-self: stretch`, *Fixed* means an explicit size. A frame with a fixed width may simply be the size the designer drew at, not a requirement.
- **Constraints** tell you how an element behaves when its parent resizes.
- **Components and variants** tell you what is reusable and which props exist. A component's variant properties (size, state, type) are close to its code API.
- **Variables and styles** tell you which token to use. If a fill shows `color/text/secondary`, use that token; do not copy the hex.

Things to distrust:

- **Generated CSS** in the inspect panel is a starting hint. It emits absolute sizes and positions that are rarely what you should write.
- **Line height and letter spacing** may be shown as percentages; convert to unitless and `em`.
- **Text boxes** in Figma do not behave exactly like CSS line boxes, so vertical positions can differ by a pixel or two. Match spacing between elements, not absolute coordinates.
- **Shadows and blurs** need all their parameters, and stacked fills need composing.
- **Images and icons**: export SVG for vectors, and raster at 2x in a modern format.

If a value is off the scale (a 13 px gap among 12s and 16s), it is probably a slip. Ask rather than implementing it faithfully.

**Try it:** Open any community Figma file with components. For one card, write down in plain words its layout (direction, gap, padding, resizing of each child) and every token it uses, without looking at the generated CSS. Then build it and compare.

**Resources**
- [Figma: Guide to Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode)
- [Figma: Guide to auto layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)
- [Figma: Guide to variables](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)

### Working with designers

A mock-up shows a screen with ideal content at one size. Your job is to implement the screen for all content at all sizes, so the gaps between the two need answers. Asking early, before building, is cheaper for everyone than discovering the gaps in review.

A checklist to run against any design:

- **Long content.** What happens to a 60-character name, a long word with no spaces, a translated string 40% longer? Truncate with an ellipsis, wrap, or clamp to a number of lines?
- **Short and empty content.** No results, no data yet, a first-time user. Is there an empty state with guidance and an action?
- **Loading.** Skeleton, spinner, or nothing? What if it takes ten seconds?
- **Errors.** A failed request, a validation error per field, a partial failure. Where does the message go and what can the user do?
- **Small and large screens.** How does it reflow at 320 px? Does it stretch forever on an ultrawide monitor or stop at a maximum width?
- **Extremes of quantity.** Zero, one, and a thousand items. Is there pagination or virtualisation?
- **States.** Hover, focus, active, disabled, selected for each interactive element.
- **Input methods and accessibility.** Keyboard order, focus management in dialogs, touch target size, reduced motion.
- **Permissions and variants.** What does a read-only user see?

How you ask matters as much as what you ask:

- Bring a proposal. "The title can be 80 characters; I suggest clamping to two lines with a tooltip. OK?" gets a faster, better answer than "what about long titles?".
- Show it in the browser. A rough working prototype with real data surfaces problems a static frame hides.
- Explain constraints in terms of user impact and cost, and offer an alternative, rather than saying something cannot be done.
- Agree on the tokens. If a design uses an off-scale value, ask whether it is intentional before adding a one-off.
- Hold a short design review of the built result before release. Treat discrepancies as shared findings, not blame.

**Try it:** Take a design you are about to build, or a screen from any app. Write ten specific questions from the checklist, each with your proposed answer. If you have a designer to ask, send them; otherwise decide each one and note your reasoning.

**Resources**
- [web.dev: Learn Design](https://web.dev/learn/design)
- [Nielsen Norman Group: Designing empty states in complex applications](https://www.nngroup.com/articles/empty-state-interface-design/)
- [GOV.UK Design System: Error message component](https://design-system.service.gov.uk/components/error-message/)

### Design-to-code handoff

Handoff fails when the design file and the codebase describe the same component in two unrelated ways. The designer's "Button / Primary / Large" becomes a developer's guess, and Dev Mode's generated CSS invites people to rebuild what already exists. The fix is to link the two so that inspecting a design shows the real code.

**Code Connect** is Figma's mechanism for this. You map a Figma component to a code component and describe how Figma properties translate to props. Dev Mode then shows your actual component usage, with the selected instance's props filled in, instead of autogenerated markup.

```tsx
// button.figma.tsx
import figma from '@figma/code-connect/react';
import { Button } from './button';

figma.connect(Button, 'https://www.figma.com/design/FILE_KEY/Library?node-id=12-345', {
  props: {
    label: figma.string('Label'),
    disabled: figma.boolean('Disabled'),
    variant: figma.enum('Type', { Primary: 'primary', Danger: 'danger' }),
  },
  example: ({ label, disabled, variant }) => (
    <Button variant={variant} disabled={disabled}>{label}</Button>
  ),
});
```

The mappings are published with the Code Connect CLI, normally from CI so they track the main branch, or created in the Code Connect UI inside Figma. Figma's docs now recommend framework-agnostic *template files* as the authoring format going forward, with the React API above still supported; check the current docs when you set it up. Code Connect requires an Organization or Enterprise plan. The same mappings feed the Figma MCP server, so AI coding tools generate code that uses your components rather than raw markup.

The tooling only works if the two sides are aligned, and that alignment is the real work:

- **Same names.** Figma variant properties and values should match prop names and values (`size: sm | md | lg`). Agree on the vocabulary once.
- **Same tokens.** Bind designs to variables, and set each variable's *code syntax* so Dev Mode shows `var(--color-text-secondary)` rather than a hex value. Generate both sides from one token source where possible.
- **Same inventory.** Every library component links to its Storybook page and source, and each has a status (ready for development, in progress, deprecated).
- **A change process.** A component change in design or code triggers the other. Dev Mode's *Ready for dev* status and change comparison show what moved since you last looked.

**Try it:** Take one component that exists in both a Figma library and your code. List its Figma properties beside its props and note every mismatch in name or value. Fix the mismatches on one side, then write the Code Connect mapping for it, or, without the required plan, add the Storybook link and code syntax for its variables.

**Resources**
- [Figma developer docs: Code Connect](https://developers.figma.com/docs/code-connect/)
- [Figma developer docs: Code Connect for React](https://developers.figma.com/docs/code-connect/react/)
- [Figma: Guide to Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode)

### Design tokens

Design tokens are named design decisions stored as data: colours, spacing, type, radii, shadows, durations. They are the single source of truth that both design tools and code read from.

Tokens are organised in tiers:

- **Primitive** (also called base or global): the raw palette, with no meaning attached. `blue-600`, `space-4`, `font-size-300`.
- **Semantic** (alias): a purpose that points at a primitive. `color-action-background` refers to `blue-600`. This is the tier components use and the tier a theme swaps.
- **Component**: a decision scoped to one component. `button-primary-background` refers to `color-action-background`. Optional; add this tier only where a component needs to diverge, since each tier adds indirection to maintain.

The indirection is the point. Rebranding changes which primitive a semantic token references; no component is touched.

The Design Tokens Community Group published its first stable format specification (2025.10). Token files are JSON with `$value` and `$type`, and aliases use braces:

```json
{
  "color": {
    "$type": "color",
    "blue-600": { "$value": { "colorSpace": "srgb", "components": [0.15, 0.39, 0.92] } },
    "action": { "$value": "{color.blue-600}" }
  },
  "space": {
    "4": { "$type": "dimension", "$value": { "value": 16, "unit": "px" } }
  }
}
```

**Style Dictionary** is the standard tool for exporting to code. It reads token files, resolves references, applies transforms (naming, units), and writes each platform's format: CSS custom properties, TypeScript constants, Swift, Android XML.

```js
// style-dictionary.config.js
export default {
  source: ['tokens/**/*.tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [{ destination: 'tokens.css', format: 'css/variables', options: { outputReferences: true } }],
    },
  },
};
```

`outputReferences: true` keeps the alias chain in the output (`--color-action: var(--color-blue-600)`), which preserves runtime theming. Mistakes: components reading primitives directly, token names that describe appearance, and creating a token for every one-off value so that the system stops constraining anything.

**Try it:** Write a token file with five primitives and three semantic tokens that alias them. Build it with `npx style-dictionary build` and read the generated CSS. Change one alias to a different primitive, rebuild, and observe that only one line changed.

**Resources**
- [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/)
- [Style Dictionary: Getting started](https://styledictionary.com/getting-started/installation/)
- [Material Design 3: Design tokens](https://m3.material.io/foundations/design-tokens/overview)

### Theming

Theming means changing an interface's look by swapping token values, with no change to component code. The mechanism is CSS custom properties: components reference semantic tokens, and a theme is a set of values for those tokens applied to a subtree.

```css
:root {
  color-scheme: light dark;
  --color-surface: #ffffff;
  --color-text: #171717;
  --color-border: #e5e5e5;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-surface: #171717;
    --color-text: #fafafa;
    --color-border: #404040;
  }
}

:root[data-theme="dark"] {
  --color-surface: #171717;
  --color-text: #fafafa;
  --color-border: #404040;
}
```

This respects the operating system by default and lets an explicit user choice override it in either direction. `color-scheme` tells the browser to render its own parts (scrollbars, form controls, the default canvas) to match. The `light-dark()` function shortens the pattern to one declaration per token: `--color-surface: light-dark(#fff, #171717)`, which follows the element's `color-scheme`.

What makes theming work or fail:

- **Semantic tokens are the theming surface.** If a component uses `--gray-900`, no theme can fix it. Hard-coded colours are the usual cause of "dark mode is broken on this one screen".
- **No flash.** A stored preference must be applied before first paint: a small inline script in `<head>` reads the cookie or `localStorage` and sets `data-theme`. With server rendering, read a cookie and render the attribute on the server.
- **Dark is designed, not inverted.** Use dark grey rather than pure black, express elevation with lighter surfaces instead of shadows, reduce the saturation of accents, and re-check every contrast pair.
- **Offer three options**: light, dark, and system.
- **Scope freely.** Because custom properties cascade, `data-theme="dark"` on a single section themes just that subtree, and a brand theme is the same technique with a different attribute.
- Images, illustrations, and syntax highlighting need theme variants too.
- Test with forced colours (Windows High Contrast), where the system replaces your palette.

**Try it:** Add light, dark, and system options to a page using the pattern above, with the choice stored in `localStorage` and applied by an inline head script. Reload on a throttled connection and confirm there is no flash. Then search the stylesheet for raw colour values that did not switch.

**Resources**
- [MDN: color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)
- [MDN: light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
- [web.dev: Building a theme switch component](https://web.dev/articles/building/a-theme-switch-component)

### Component API design

A component's props are an interface that other engineers program against. A good one is easy to use correctly, hard to use incorrectly, and consistent with its siblings.

**Consistency.** The same concept gets the same name and values everywhere: `size="sm" | "md" | "lg"` on every sizable component, `variant` for visual style, `disabled` not `isDisabled` in one place and `inactive` in another. Follow the platform where it has a name already: `onChange`, `value`, `disabled`.

**Hard to misuse.** Make invalid combinations impossible to express.

```tsx
// Easy to misuse: what does primary + danger mean?
<Button primary danger />

// One prop, mutually exclusive values
<Button variant="danger" />
```

Use discriminated unions for props that depend on each other, and required props for required things. An icon-only button should require an accessible label in its types.

**Composable.** Prefer `children` and small parts over configuration props. A `Card` with `title`, `subtitle`, `image`, `footer`, and `actions` props needs a new prop for every new layout; `Card.Header`, `Card.Body`, and `Card.Footer` handle layouts nobody anticipated.

**Transparent to the platform.** Extend the native element's props, forward the rest, and pass the `ref`, so that `aria-*`, `data-*`, `type`, and `form` all work.

```tsx
type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return <button className={button({ variant, size, className })} {...rest} />;
}
```

Other decisions to make deliberately:

- **Controlled and uncontrolled.** Support `value` with `onChange` and also `defaultValue`, as native inputs do.
- **Polymorphism.** A button that must render a link needs an `asChild` or `render` prop rather than a styled `<a>` copy.
- **Styling escape hatches.** Accepting `className` is pragmatic but lets consumers override anything. Decide what is supported.
- **Defaults.** The most common use should need no props.
- **Small surface.** Every prop is a promise you must keep through future versions. It is much easier to add a prop than to remove one.

**Try it:** Write the TypeScript types for a `Dialog` API twice: once as a single component with configuration props, and once as composed parts. Then try to express "a dialog with a form whose footer has three buttons and a link" in each.

**Resources**
- [React: Passing props to a component](https://react.dev/learn/passing-props-to-a-component)
- [Radix Primitives: Composition](https://www.radix-ui.com/primitives/docs/guides/composition)
- [TypeScript handbook: Discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

### Headless primitives

Custom interactive widgets are far harder than they look. A correct combobox, menu, dialog, or date picker involves focus trapping and restoration, roving tabindex, typeahead, arrow-key navigation, Escape and outside-click dismissal, scroll locking, collision-aware positioning, ARIA roles and states that update correctly, and workarounds for screen-reader and browser differences. Teams that hand-roll these ship inaccessible components.

Headless (unstyled) libraries implement the behaviour and accessibility and leave all styling to you. You build your design system's components on top of them.

```tsx
import { Dialog } from 'radix-ui';

export function ConfirmDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="btn">Delete</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="dialog">
          <Dialog.Title>Delete project?</Dialog.Title>
          <Dialog.Description>This cannot be undone.</Dialog.Description>
          <Dialog.Close className="btn">Cancel</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

The main options:

- **Radix Primitives**: compound components, `asChild` for rendering your own element, state exposed through `data-state` attributes for styling. The basis of shadcn/ui.
- **Base UI**: from the teams behind Radix, MUI, and Floating UI; reached a stable 1.0 and uses a `render` prop for composition.
- **React Aria Components** (Adobe): the most thorough on accessibility and internationalisation, including touch and screen-reader behaviour across platforms, right-to-left layouts, and locale-aware dates and numbers.
- **Ark UI**: built on state machines (Zag.js), with the same components for React, Vue, Solid, and Svelte.

Use the platform first where it suffices. Native `<dialog>`, the `popover` attribute, and `<details>` cover many cases without a library.

Mistakes: overriding the library's ARIA attributes or keyboard handling, hiding the focus ring, omitting the title a dialog needs for its accessible name, and re-exporting the primitive unchanged so that every consumer restyles it. Wrap each primitive once in your own component with your tokens and variants. Compare behaviour against the ARIA Authoring Practices pattern for the widget.

**Try it:** Build a dropdown menu with one of these libraries and style it yourself. Test it with only the keyboard: open, arrow through items, type a letter to jump, press Escape, and check where focus returns. Then run the same test on a hand-made dropdown from an older project.

**Resources**
- [Radix Primitives: Introduction](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [React Aria: Getting started](https://react-spectrum.adobe.com/react-aria/getting-started.html)
- [WAI-ARIA Authoring Practices Guide: Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)

### Storybook

Storybook renders components in isolation, outside your app. A **story** is one named state of a component, written as data. A set of stories serves three purposes: a workshop for building a component without navigating to it in the app, living documentation, and test cases.

```tsx
// button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Button } from './button';

const meta = {
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Save', onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Danger: Story = { args: { variant: 'danger' } };

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
```

The pieces:

- **Args** are the props for a story. The Controls panel lets anyone change them live, and `argTypes` are inferred from your TypeScript types.
- **Decorators** wrap stories with whatever they need: a theme provider, a router, padding. Global ones go in `.storybook/preview.ts`.
- **Autodocs** generates a documentation page with a props table from the `autodocs` tag; MDX pages add prose.
- **Play functions** script interactions and assertions, turning a story into an interaction test. The Vitest addon runs every story as a test in a real browser, locally and in CI.
- **Addons** include accessibility checks (axe on every story), viewport and theme toolbars, and visual testing.
- **Mocking.** Stories must not depend on a live backend. Pass data through args, or mock the network with Mock Service Worker.

Write a story for every state that matters, including the ugly ones: loading, error, empty, overflowing text. If a state is hard to reach in a story, the component is probably too coupled to its surroundings, which is useful design feedback.

Storybook 10 is ESM-only. Publish the static build (`storybook build`) so designers and product managers can review components by URL.

**Try it:** Add Storybook to a project with `npm create storybook@latest`. Write stories for a component covering all variants, a long-content case, and one `play` function. Enable the accessibility addon and fix whatever it reports.

**Resources**
- [Storybook: Writing stories](https://storybook.js.org/docs/writing-stories)
- [Storybook: Interaction tests](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Storybook: Autodocs](https://storybook.js.org/docs/writing-docs/autodocs)

### Visual regression testing

Unit tests cannot tell you that a button moved four pixels or that a token change turned every link grey. Visual regression testing renders the UI, takes a screenshot, and compares it pixel by pixel to an approved **baseline**. Any difference fails the check until a person accepts it as intended (updating the baseline) or fixes it.

It is especially valuable in a design system, where one change to a token or base component can affect hundreds of screens.

**Playwright** has it built in:

```ts
import { test, expect } from '@playwright/test';

test('pricing card', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByTestId('pro-plan')).toHaveScreenshot('pro-plan.png', {
    maxDiffPixelRatio: 0.01,
    mask: [page.getByTestId('renewal-date')],
  });
});
```

The first run writes the baseline image next to the test; later runs compare. `npx playwright test --update-snapshots` accepts new baselines. Baselines are committed to git.

**Chromatic** (from the Storybook maintainers) does this as a service: it renders every story in cloud browsers, diffs against the last accepted build, and gives reviewers a web UI to approve or reject changes on the pull request. Because every story is a test, coverage follows from writing stories.

The enemy is flakiness: a test that fails with no real change teaches people to ignore it. Sources and fixes:

- **Rendering differences between machines.** Fonts and antialiasing differ across operating systems, so a baseline made on macOS fails on Linux CI. Generate and compare in one environment: the Playwright Docker image or the cloud service.
- **Animations and carets.** Playwright disables CSS animations and hides the caret for screenshots by default; make sure JavaScript-driven animation is finished or disabled too.
- **Dynamic content.** Dates, avatars, random IDs, ads. Mock the data, freeze the clock, or `mask` the region.
- **Loading.** Wait for web fonts and images before capturing.

Prefer component and story-level screenshots over full pages: they are smaller, more stable, and point at the cause. Keep thresholds tight, because a generous threshold hides real regressions. Every accepted diff should be a deliberate review, not a reflex.

**Try it:** Add a `toHaveScreenshot` test for one component. Run it twice to confirm it passes. Change a padding value by 2 px, run it again, and open the HTML report to view the expected, actual, and diff images.

**Resources**
- [Playwright: Visual comparisons](https://playwright.dev/docs/test-snapshots)
- [Storybook: Visual tests](https://storybook.js.org/docs/writing-tests/visual-testing)
- [Chromatic: Documentation](https://www.chromatic.com/docs/)

### Component accessibility testing

A design system multiplies whatever it contains. An inaccessible select ships to every product that uses it, and a fixed one fixes them all, so each component deserves three layers of testing.

**1. Automated checks.** axe-core finds rule-based failures: missing accessible names, invalid ARIA, insufficient contrast, duplicate IDs. Run it on every story with Storybook's accessibility addon and make violations fail:

```ts
// .storybook/preview.ts
import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  parameters: { a11y: { test: 'error' } },
};
export default preview;
```

With the Vitest addon these run in CI alongside your other story tests. In Playwright, `@axe-core/playwright` does the same for full pages. Automated tools catch only part of the problem (Deque puts axe at up to 57% of issues). They cannot tell whether a label is *meaningful*, whether focus order makes sense, or whether an announcement is helpful. A green run means "no detectable failures", not "accessible".

**2. Keyboard tests.** Script the interaction contract from the ARIA Authoring Practices pattern and assert on focus:

```tsx
export const KeyboardFlow: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Options' });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveFocus();
  },
};
```

Querying by role and name is itself an accessibility assertion: if `getByRole('button', { name: 'Options' })` fails, assistive technology cannot find the control either. Cover Tab order, arrow keys, Escape, focus trapping, and focus return.

**3. Screen reader passes.** Someone has to listen. Test with at least NVDA and Chrome or Firefox on Windows and VoiceOver and Safari on macOS or iOS, since behaviour differs between pairings. For each component, check that the role, name, state, and value are announced, that changes (expanded, selected, invalid, loading) are announced when they happen, and that live regions are neither silent nor noisy. Write the expected announcements into the component's documentation so the next reviewer has something to compare against.

Also check each component at 200% zoom, in forced-colours mode, and with reduced motion. Disable an axe rule only per story, with a comment explaining why.

**Try it:** Turn on `a11y: { test: 'error' }` for a component library and fix the failures in three components. Then write a keyboard `play` test for a dialog or menu, and finally operate that component with a screen reader with your monitor off. Note what the automated checks missed.

**Resources**
- [Storybook: Accessibility tests](https://storybook.js.org/docs/writing-tests/accessibility-testing)
- [Playwright: Accessibility testing](https://playwright.dev/docs/accessibility-testing)
- [WebAIM: Testing with screen readers](https://webaim.org/articles/screenreader_testing/)

### Iconography

An icon pipeline takes SVG files from design and delivers them to components consistently. The steps are export, optimise, deliver, and use accessibly.

**Source and optimise.** Icons should be drawn on one grid (commonly 24×24) with a consistent stroke width. Run exports through SVGO to strip editor metadata, and replace hard-coded colours with `currentColor` so an icon inherits the text colour and theme. Keep the `viewBox`; remove fixed `width` and `height` so CSS controls the size.

**Deliver.** There are two good strategies.

*Components* (SVGR turns each file into a React component):

```tsx
import { SearchIcon } from '@acme/icons';
<SearchIcon aria-hidden="true" width={20} height={20} />
```

Simple, tree-shakeable, and typed. The cost is that SVG markup becomes JavaScript: it is parsed as script, duplicated in the server HTML and again in the hydration bundle, and repeated for every instance.

*Sprite* (one SVG file of `<symbol>` elements referenced with `<use>`):

```tsx
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} aria-hidden="true">
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}
```

The sprite is a cacheable asset outside the JavaScript bundle, and each use is a few bytes of markup. Limits: an external sprite must be same-origin (or served with CORS), every user downloads all icons unless you split it, and you can only style what `currentColor` and inherited properties reach. For apps with many icons on screen, sprites are usually the better trade.

Avoid icon fonts (they fail when fonts are blocked, blur at some sizes, and are announced unpredictably by assistive technology) and avoid importing a whole icon library through a barrel file that defeats tree shaking.

**Accessibility.** A decorative icon beside text gets `aria-hidden="true"`. An icon that is the only content of a button needs a name: `aria-label` on the button, or visually hidden text. Keep the touch target at least 24×24 CSS pixels (WCAG 2.2), preferably larger, whatever the glyph size. Generate a TypeScript union of icon names from the file list so a typo is a compile error.

**Try it:** Take five SVGs exported from a design tool. Run `npx svgo -f icons/` and compare file sizes. Build both a sprite and SVGR components from them, render fifty icons on a page each way, and compare the HTML size and JavaScript bundle size.

**Resources**
- [MDN: `<use>` element](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/use)
- [SVGR: Getting started](https://react-svgr.com/docs/getting-started/)
- [SVGO: Introduction](https://svgo.dev/docs/introduction/)

### Documentation

A component library without documentation is a library people re-implement. Documentation is what turns a set of components into a system that a hundred engineers use the same way. Its readers are engineers choosing and using a component, designers checking what exists, and contributors.

A good component page answers, in this order:

1. **What it is and when to use it**, and when to use something else instead ("for a choice among more than five options, use Select rather than Radio group").
2. **Live examples** of the common cases, with code that can be copied.
3. **Do and don't** pairs: concrete, visual, with a reason. "Do: use one primary button per view. Don't: place two primary buttons side by side, because neither then reads as the main action."
4. **Props or API reference**, generated from the source types so it cannot go stale.
5. **Accessibility**: keyboard interactions, what a screen reader announces, and what the consumer must supply (a label, a title).
6. **Content guidance**: label length, capitalisation, tone of error messages.
7. **Status and changes**: stable, beta, or deprecated, with the replacement.

Beyond component pages you need: getting started (install, setup, theming), foundations (tokens for colour, type, spacing, with usage rules), patterns (forms, empty states, page layouts that combine components), and a contribution guide.

Practices that keep documentation true:

- **Generate what can be generated.** Props tables from TypeScript, examples that are real stories executed in CI. An example that does not compile should fail the build.
- **Co-locate.** Docs live beside the component and change in the same pull request. A component change without a docs change is incomplete.
- **Write guidance, not description.** "Has a `size` prop" is in the table already. "Use `sm` only inside dense tables" is knowledge.
- **Show the wrong way.** Most misuse is predictable; address it directly.
- **Make it searchable** and link each component to its design file and source.

Storybook's Autodocs and MDX pages cover this for many teams; larger systems build a dedicated site. Study GOV.UK, Carbon, and Polaris for the structure of their guidance pages.

**Try it:** Write a documentation page for one component: a one-sentence purpose, when to use and not use it, three live examples, two do and don't pairs with reasons, and keyboard behaviour. Give it to someone unfamiliar with the component and watch whether they use it correctly.

**Resources**
- [Storybook: MDX documentation](https://storybook.js.org/docs/writing-docs/mdx)
- [GOV.UK Design System: Button](https://design-system.service.gov.uk/components/button/)
- [Carbon Design System: Button usage](https://carbondesignsystem.com/components/button/usage/)

### Versioning and distribution

A design system reaches its consumers as a package, and the version number is your contract with them.

**Semantic versioning.** `MAJOR.MINOR.PATCH`: a patch fixes bugs, a minor adds features compatibly, a major breaks something. For a component library, "breaking" is wider than the TypeScript API. Removing or renaming a prop, changing a default, renaming a CSS custom property or class that consumers target, changing DOM structure that they style or test against, and raising a peer dependency's minimum are all breaking. A visual change is the judgement call; treat anything that could break a consumer's layout as major, or ship it behind an opt-in.

**Package shape.** The `package.json` decides whether the package works well in consumers' bundlers:

```json
{
  "name": "@acme/ui",
  "version": "2.3.0",
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./styles.css": "./dist/styles.css"
  },
  "files": ["dist"],
  "sideEffects": ["**/*.css"],
  "peerDependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" }
}
```

`exports` defines the public entry points and hides everything else. `sideEffects` tells bundlers which files are safe to tree-shake away; mark CSS as having side effects or it may be dropped. React must be a **peer** dependency, never a regular one, or consumers get two copies and broken hooks. Run `publint` and *Are the types wrong?* before publishing.

**Changelogs.** Changesets is the common workflow: each pull request adds a small file stating the bump type and a human-readable summary; a release step combines them into version bumps and a changelog. Write entries for consumers ("Button: `kind` renamed to `variant`"), not for yourself.

**Breaking changes.** Deprecate first: keep the old API working with a console warning and a `@deprecated` JSDoc tag for at least one minor release. Then, for the major version, ship a **codemod**, a script (typically jscodeshift) that rewrites consumers' source automatically. A rename that costs each team an afternoon by hand costs them one command with a codemod, and that difference decides whether teams upgrade.

Publish from CI with provenance or trusted publishing, and use pre-release tags (`3.0.0-beta.1`) to let teams try a major early.

**Try it:** Create a tiny package with one component, build it with Vite library mode, and run `npm pack --dry-run` to see exactly what would be published. Install the tarball into another project. Then rename a prop and write the changelog entry and the deprecation warning for it.

**Resources**
- [Semantic Versioning 2.0.0](https://semver.org/)
- [Node.js: Package entry points](https://nodejs.org/api/packages.html#package-entry-points)
- [Changesets](https://github.com/changesets/changesets)

### Adoption and governance

A design system is a product with internal customers, and it fails for organisational reasons far more often than technical ones. Three questions need explicit answers.

**Who decides and who builds?** The usual models:

- *Centralised*: a dedicated team builds everything. Consistent and high quality, but it becomes a bottleneck.
- *Federated*: product teams contribute, guided by a small core team that owns standards and review. Scales better; needs a clear process.
- *Solitary*: one product team's library that others borrow. Common at the start; breaks when needs diverge.

Most mature systems are a core team plus federated contribution.

**How does something get in?** Publish a contribution process. A typical path: a proposal issue describing the need and evidence that more than one team has it; a design and API review; implementation meeting a written definition of done (all states, accessibility checked, stories, docs, tests, tokens only); release. State the criteria for inclusion plainly, such as "used by at least three products", and say what happens to one-off needs: build it locally, and promote it later if it recurs. A fast, predictable answer matters more than a yes.

**How does something leave?** Deprecation needs a policy: announce it with the replacement, mark it in code and docs, warn at runtime, provide a codemod, keep it for a stated period, then remove it in a major version. Removing without that process destroys trust.

**Measuring usage** turns opinions into decisions:

- Which versions each repository is on (how far behind are consumers?).
- Component usage counts from static analysis (tools such as `react-scanner` crawl codebases and count component and prop usage).
- Coverage: the share of UI built from system components versus custom ones, and how often system styles are overridden.
- Which components and props are never used, which are candidates for removal.
- Qualitative signals: support questions, time to build a standard screen, contributions from outside the core team.

Adoption is earned. Make the system the easiest path (good defaults, good docs, quick support), publish a roadmap, and treat every "we built our own because…" as a product finding.

**Try it:** Write a one-page contribution guide for a small design system: inclusion criteria, the steps of a proposal, the definition of done, and the deprecation policy. Then run a usage scan on a codebase you know and list the five most and least used components.

**Resources**
- [GOV.UK Design System: Contribution criteria](https://design-system.service.gov.uk/community/contribution-criteria/)
- [Brad Frost: A design system governance process](https://bradfrost.com/blog/post/a-design-system-governance-process/)
- [react-scanner](https://github.com/moroshko/react-scanner)

### Purposeful animation

Animation in an interface should explain something. If you cannot say what a motion tells the user, remove it. The legitimate jobs are:

- **Feedback.** A button depresses, a toggle slides, a row highlights after saving. The system confirms it received the input.
- **Continuity and orientation.** A panel slides in from the edge it will return to; a thumbnail expands into the detail view. Motion shows where something came from and where it went, so the user keeps their mental map.
- **State change.** An accordion opens, an item is removed and the list closes up. An instant change can be missed or look like a glitch.
- **Directing attention.** A new notification moves once. Used rarely, because movement in peripheral vision is hard to ignore.
- **Perceived performance.** A skeleton or progress indicator makes a wait feel shorter and shows the app is working.

Decoration is motion with none of those jobs: content that fades in as you scroll for no reason, bouncing logos, parallax. It slows people down, and for frequent actions it becomes irritating quickly. The more often an interaction happens, the shorter and subtler its animation should be; a command palette opened fifty times a day should be nearly instant.

Motion is also an accessibility matter. Large movement, zooming, and parallax can trigger nausea and dizziness in people with vestibular disorders. Respect the user's setting:

```css
@media (prefers-reduced-motion: reduce) {
  .drawer { transition: opacity 150ms linear; transform: none; }
}
```

Reduced motion does not mean no feedback. Replace movement with a short cross-fade or an instant change; keep the information. Avoid the blanket rule that sets every duration to zero, since it can break code that waits for `transitionend`.

Other rules: never block input while an animation plays; never make content reachable only after an animation finishes; do not loop anything indefinitely near text people are reading; and let users pause anything that moves for more than five seconds.

**Try it:** List every animation in an app you use daily. For each, write the one thing it communicates, or "nothing". Then enable reduced motion in the DevTools Rendering tab on your own project and note which animations ignore it.

**Resources**
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [WCAG 2.2: Understanding Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [Material Design 3: Motion overview](https://m3.material.io/styles/motion/overview/how-it-works)

### Easing and duration

Easing is how an animation's speed changes over its duration. Real objects accelerate and decelerate, so linear motion looks mechanical. Duration is how long it takes. Together they decide whether motion feels right.

**Which curve:**

- **Ease-out** (fast start, slow finish) for things entering or responding to the user. It reacts immediately and settles gently. This is the default for most UI.
- **Ease-in** (slow start, fast finish) for things leaving the screen for good. It feels sluggish at the start, so avoid it for responses to input.
- **Ease-in-out** for things moving from one on-screen place to another.
- **Linear** for continuous motion (spinners, progress) and for opacity and colour changes.

The keyword curves are mild. Custom cubic Béziers give more character:

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 320ms;
}
.menu { transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out); }
```

A cubic Bézier cannot bounce or overshoot more than once. The `linear()` easing function, which takes a list of points, can approximate springs and bounces in plain CSS and is supported in all current browsers.

**How long:**

- 100 to 150 ms for small feedback: hover, press, a checkbox.
- 200 to 300 ms for most transitions: menus, tooltips, dialogs.
- 300 to 500 ms for large movements across the screen.
- Longer than about 500 ms feels slow for anything a user triggers.

Duration scales with distance and size: a full-screen sheet needs longer than a tooltip. Exits should be quicker than entrances, since the user has already moved on. Under about 100 ms, a change reads as instant.

**Springs** are defined by physics (stiffness, damping, mass) rather than duration. They handle interruption naturally because they carry velocity, which is why gesture-driven interfaces use them.

Store durations and curves as tokens. A handful of each, used everywhere, gives the product a consistent feel, in the same way a spacing scale does.

**Try it:** Animate a panel sliding in 300 px. Try it at 200 ms with `linear`, `ease-in`, `ease-out`, and a custom ease-out curve. Use the DevTools Animations panel to slow playback to 25% and edit the curve. Then change the duration to 600 ms and note how it feels to use repeatedly.

**Resources**
- [MDN: easing-function](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function)
- [Chrome for Developers: Create complex animation curves with linear()](https://developer.chrome.com/docs/css-ui/css-linear-easing-function)
- [Material Design 3: Easing and duration](https://m3.material.io/styles/motion/easing-and-duration/applying-easing-and-duration)

### Animation libraries

CSS transitions and keyframes handle state changes well. A library earns its place when you need things CSS makes painful: animating elements as they leave the DOM, sequencing many steps with precise overlap, physics-based springs, gestures, scroll-driven choreography, or animating layout changes.

**Motion** (formerly Framer Motion) is the standard for React and also has a plain JavaScript API. It is declarative: you describe states and it animates between them.

```tsx
import { AnimatePresence, motion } from 'motion/react';

<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    />
  )}
</AnimatePresence>
```

`AnimatePresence` keeps a removed component mounted until its `exit` animation ends, something React cannot do alone. `variants` with `staggerChildren` orchestrate groups, the `layout` prop animates size and position changes, and `layoutId` morphs one element into another. `useReducedMotion` lets you adapt.

**GSAP** is imperative and framework-agnostic, built around **timelines**:

```js
const tl = gsap.timeline({ defaults: { duration: 0.5, ease: 'power2.out' } });
tl.from('.hero-title', { y: 40, opacity: 0 })
  .from('.hero-copy', { y: 20, opacity: 0 }, '-=0.3')
  .from('.hero-cta', { scale: 0.9, opacity: 0 }, '<0.1');
```

The position parameter (`'-=0.3'`, `'<0.1'`) places each step relative to the others, and the whole timeline can be paused, reversed, or scrubbed. ScrollTrigger ties timelines to scroll position. GSAP, including its plugins, is free to use. In React, use the `useGSAP` hook from `@gsap/react` so animations are cleaned up on unmount.

Choosing: Motion for component-level UI animation in React; GSAP for complex sequenced or scroll-driven scenes, marketing pages, and non-React projects. The built-in **Web Animations API** (`element.animate(keyframes, options)`) covers simple imperative cases with no dependency.

Whichever you use: animate `transform` and `opacity`, check the bundle cost (Motion's `LazyMotion` and `m` component reduce it), and remember that animating components must be Client Components.

**Try it:** Build a notification list where items animate in, animate out when dismissed, and the remaining items slide up to close the gap, using Motion's `AnimatePresence` and `layout`. Then build a three-step hero entrance as a GSAP timeline and scrub it with `tl.progress()`.

**Resources**
- [Motion: React quick start](https://motion.dev/docs/react)
- [GSAP: Timeline](https://gsap.com/docs/v3/GSAP/Timeline/)
- [MDN: Using the Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API)

### Layout and shared-element transitions

Animating layout properties (`width`, `height`, `top`, `left`) forces the browser to recalculate layout every frame. **FLIP** gets the same visual result using only transforms:

1. **First**: measure the element's starting position with `getBoundingClientRect()`.
2. **Last**: apply the change (reorder the list, toggle the class) and measure again.
3. **Invert**: apply a transform that moves the element back to where it started.
4. **Play**: animate that transform to none.

```js
const first = el.getBoundingClientRect();
container.append(el);                      // the layout change
const last = el.getBoundingClientRect();

el.animate(
  [
    { transform: `translate(${first.left - last.left}px, ${first.top - last.top}px)` },
    { transform: 'none' },
  ],
  { duration: 250, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
);
```

The layout change happens once, up front; the animation runs on the compositor. Motion's `layout` prop automates FLIP, including correcting the distortion that scaling causes to children and border radii.

The **View Transitions API** builds this into the browser. You wrap a DOM update, the browser snapshots the old state, applies the update, and animates between the snapshots:

```js
function navigate(update) {
  if (!document.startViewTransition) return update();
  document.startViewTransition(update);
}
```

```css
.thumbnail { view-transition-name: hero-image; }
::view-transition-group(hero-image) { animation-duration: 300ms; }
```

By default the whole page cross-fades. An element with a `view-transition-name` is animated separately, and if an element with the same name exists after the update, the browser morphs position and size between them: a shared-element transition, even between two different elements. Names must be unique among rendered elements at capture time, or the transition is skipped. The animation is ordinary CSS on the `::view-transition-*` pseudo-elements, so you can customise or disable it under `prefers-reduced-motion`.

Same-document view transitions are supported in all major browsers. **Cross-document** transitions, enabled with `@view-transition { navigation: auto; }` on both pages of a same-origin navigation, work in Chromium and Safari but are not yet available everywhere; they degrade to a normal navigation. React's `<ViewTransition>` component is still in the canary channel; frameworks such as Astro and Next.js expose their own integrations.

Limits: the page is not interactive during the transition, and snapshots are images, so keep transitions short.

**Try it:** Build a grid of thumbnails that opens a detail view. Give the clicked thumbnail and the detail image the same `view-transition-name` and wrap the state change in `startViewTransition`. Then implement a list shuffle with manual FLIP and compare the amount of code.

**Resources**
- [Chrome for Developers: Same-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document)
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Paul Lewis: FLIP your animations](https://aerotwist.com/blog/flip-your-animations/)

### Mini design system

This project takes you through the whole life of a design system at small scale: tokens, components, documentation, theming, and distribution. Keep the scope tight and the quality high. Eight polished components teach more than thirty rough ones.

**Tokens first.** Define primitives (a grey ramp, one brand ramp, red, green; a spacing scale; a type scale; radii; shadows; durations) and semantic tokens (`surface`, `text`, `border`, `action`, `danger`, `focus-ring`) in DTCG-format JSON. Build them to CSS custom properties with Style Dictionary, with a light and a dark value for every semantic colour.

**Eight components** that cover different problems:

1. Button (variants, sizes, loading, as link)
2. Text field (label, help text, error, disabled)
3. Checkbox or switch
4. Select or combobox (build on a headless primitive)
5. Dialog (focus trap, title, close)
6. Tabs (arrow-key navigation)
7. Toast or alert (live region)
8. Card or stack (a layout primitive)

For each: semantic tokens only, every interaction state, keyboard support checked against the ARIA Authoring Practices pattern, `className` and `ref` passthrough, and typed variants.

**Storybook.** A story per variant and state, an autodocs page with usage guidance and at least one do and don't, a theme toggle in the toolbar, and the accessibility addon passing.

**Dark mode.** `data-theme` on the root, `prefers-color-scheme` as the default, and contrast verified in both themes.

**Publish.** Build with Vite library mode or tsup to ESM with type declarations, set `exports`, `files`, `sideEffects`, and peer dependencies, use Changesets for the version and changelog, and publish to npm under your scope. Then install it in a separate fresh app and build a small page with it. That last step finds the problems: missing CSS, a broken export, types that do not resolve.

Stretch goals: visual regression tests on every story, a second brand theme, and a codemod for a deliberate breaking change in version 2.

**Try it:** Before writing any component, write the token file and the button's API (its TypeScript props) and get someone to review both. Changing these after eight components depend on them is the expensive mistake this project is meant to teach you to avoid.

**Resources**
- [Storybook tutorials: Intro to Storybook](https://storybook.js.org/tutorials/intro-to-storybook/)
- [npm: Creating and publishing scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)
- [Vite: Library mode](https://vite.dev/guide/build#library-mode)

### Pixel-accurate build

Take a complex design, such as a marketing landing page or a dense dashboard screen from a Figma community file, and implement it so closely that an overlay comparison shows no visible difference. This trains the eye and the discipline that separate approximate from accurate work.

**Before coding**, read the file. List the type styles, colours, spacing values, and breakpoints it uses and set them up as tokens. Identify the layout structure (auto-layout direction, gaps, what hugs and what fills). Export the frame you will compare against as a PNG at 1x at its exact frame width.

**Build** with the system, not with magic numbers. If you find yourself writing `margin-top: 37px`, you have misread the structure: there is a gap, padding, or line-height you have not accounted for.

**Overlay-compare.** Set the viewport to the frame's exact width in DevTools device mode, then place the exported image over your page:

```css
body::after {
  content: "";
  position: absolute;
  inset: 0;
  background: url("/design.png") top center / 100% auto no-repeat;
  opacity: 0.5;
  pointer-events: none;
  z-index: 9999;
}
```

Toggle it on and off, or use `mix-blend-mode: difference` instead of opacity: matching areas turn black and differences glow. Work from the top down, since an error near the top shifts everything beneath it.

**Where differences come from:**

- **Line height.** The most common cause of vertical drift. Match the design's line height exactly and remember the browser splits the extra space above and below the text.
- **Font rendering.** Different fonts, weights not loaded, or fallback fonts. Confirm the right font file is in use in the Computed pane's *Rendered Fonts* section. Antialiasing will never match exactly; glyph positions should.
- **Box sizing and borders.** A 1 px border inside or outside the box.
- **Letter spacing** given as a percentage in the design.
- **Sub-pixel rounding** in fluid layouts.

Accuracy at one width is half the job. Check every breakpoint in the design and the widths between them, then test with real, longer content. Finish by writing a short list of the ambiguities you found and how you resolved each, as you would for a designer.

**Try it:** Start with a single section, such as the hero or a pricing table, and get its overlay to match before moving on. Time yourself, then note which category of error from the list above cost the most time.

**Resources**
- [Figma: Guide to Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode)
- [Chrome DevTools: Simulate mobile devices with device mode](https://developer.chrome.com/docs/devtools/device-mode)
- [MDN: mix-blend-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode)
