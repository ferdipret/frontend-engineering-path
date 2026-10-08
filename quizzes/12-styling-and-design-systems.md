# Styling at Scale and Design Systems: Practice test

### 1. A team's stylesheet only ever grows; nobody deletes rules even when features are removed. What property of plain global CSS causes this?

- [ ] CSS files are cached by browsers, so deleting rules has no effect
- [x] There is no reliable way to prove that a selector matches nothing anywhere in the product, so deleting is risky
- [ ] Minifiers re-add deleted rules from source maps
- [ ] The cascade requires every rule to remain for specificity to work

> A global selector could match markup produced by any template, script, or CMS content, so you cannot tell from the stylesheet alone whether a rule is dead. Deleting markup is safe; deleting CSS is a gamble, so people append instead. Scoped styles, utilities, and colocated CSS fix this by tying each rule to the component that uses it.

### 2. Which selector follows BEM conventions for the title inside a card's header?

```html
<article class="card">
  <header class="card__header">
    <h2 class="???">Title</h2>
  </header>
</article>
```

- [ ] `card__header__title`
- [ ] `card-header-title`
- [x] `card__title`
- [ ] `card .header .title`

> BEM elements belong to the block, not to other elements, so the name does not mirror DOM nesting. `card__title` stays valid if the title later moves out of the header. Chaining elements (`card__header__title`) couples the name to the structure, and a descendant selector raises specificity, which is what BEM exists to avoid.

### 3. What colour is the paragraph inside `Child`, and why?

```css
/* parent.module.css */
.wrapper p { color: red; }
```

```css
/* child.module.css */
.text { color: blue; }
```

```tsx
<div className={parent.wrapper}>
  <Child /> {/* renders <p className={child.text}>Hello</p> */}
</div>
```

- [ ] Blue, because CSS Modules scope each file's styles to its own component
- [ ] Blue, because the child's stylesheet is imported later
- [x] Red, because only class names are scoped; `.wrapper p` still matches any descendant `p` and has higher specificity
- [ ] Red, because parent modules always override child modules

> CSS Modules rename classes; they do not isolate DOM subtrees. `.wrapper_x1 p` matches the child's paragraph, and its specificity (0,1,1) beats the single class `.text_y2` (0,1,0), regardless of import order. Keep module selectors to single classes to avoid leaking into nested components.

### 4. This button renders with no background colour in production, even though `bg-green-600` works elsewhere in the app. Why?

```tsx
function Badge({ color }: { color: 'green' | 'red' }) {
  return <span className={`bg-${color}-600 text-white`}>New</span>;
}
```

- [ ] Template literals are not allowed in `className`
- [ ] Tailwind requires colours to be registered in `@theme` before use
- [ ] `text-white` overrides the background utility
- [x] Tailwind finds classes by scanning source text for complete names; `bg-${color}-600` is never a complete class name, so `bg-red-600` is not generated unless it appears elsewhere

> The compiler does not execute your code. It looks for whole class-name strings in the files. An interpolated fragment matches nothing. Map the prop to complete strings instead: `{ green: 'bg-green-600', red: 'bg-red-600' }[color]`.

### 5. In Tailwind v4, what does this CSS do?

```css
@import "tailwindcss";

@theme {
  --color-*: initial;
  --color-ink: oklch(0.2 0.02 260);
  --color-paper: oklch(0.98 0.01 90);
}
```

- [ ] Adds two colours to the default palette
- [x] Removes the default colour palette and defines exactly two colours, creating utilities such as `bg-ink` and `text-paper` and matching custom properties on `:root`
- [ ] Defines two CSS variables but no utilities; utilities require `tailwind.config.js`
- [ ] Resets every colour utility to the browser's initial value at runtime

> Setting a namespace to `initial` inside `@theme` clears Tailwind's defaults for it. The two theme variables then define the full colour vocabulary: utilities are generated from them, and they are emitted as custom properties. In v4 the theme lives in CSS; a JavaScript config is the older approach.

### 6. Explain why runtime CSS-in-JS libraries are a poor fit for React Server Components and streaming SSR, and what zero-runtime libraries do differently.

> Runtime libraries generate CSS while components render: they serialise the style object, hash it, and inject a rule into a `<style>` element, usually relying on React context for the theme. On the server, that means collecting every style produced during render and inlining it into the HTML; with streaming, styles must be flushed in step with each chunk or content arrives unstyled. Server Components cannot use context or run that injection logic, so every styled component has to be a Client Component, which drags more of the tree into the client bundle. There is also a runtime cost in the browser: library code plus work on each render. Zero-runtime libraries such as vanilla-extract and Panda evaluate or statically analyse the style definitions at build time and emit ordinary CSS files with generated class names. The component just references a class string, so it works in Server Components and with any rendering strategy, and nothing runs in the browser. The trade-off is that values must be known at build time; dynamic values are passed through CSS custom properties.

### 7. Given this definition, which call makes the compound variant's classes apply?

```ts
const button = cva('btn', {
  variants: {
    intent: { primary: 'bg-blue-600', danger: 'bg-red-600' },
    outline: { true: 'bg-transparent border' },
  },
  compoundVariants: [
    { intent: 'danger', outline: true, class: 'border-red-600 text-red-700' },
  ],
  defaultVariants: { intent: 'primary' },
});
```

- [ ] `button({ outline: true })`
- [ ] `button({ intent: 'danger' })`
- [x] `button({ intent: 'danger', outline: true })`
- [ ] `button({ intent: 'primary', outline: true })`

> A compound variant applies only when every listed condition matches. `outline: true` alone uses the default intent `primary`, so the condition `intent: 'danger'` fails. Compound variants exist for exactly this "when A and B together" case that nested ternaries handle badly.

### 8. What colour is the text of `<p id="intro" class="note">`?

```css
@layer base, components;

@layer components {
  .note { color: green; }
}

@layer base {
  #intro { color: red; }
}

p { color: blue; }
```

- [ ] Red, because an ID selector has the highest specificity
- [ ] Green, because `components` is the last declared layer
- [x] Blue, because styles outside any layer beat all layered styles
- [ ] Red, because the `base` block appears later in the source

> Layer order is compared before specificity, and unlayered declarations are treated as a final, highest-priority layer. So `p` wins despite having the lowest specificity. Between the two layers, `components` would beat `base` because of the order in the `@layer` statement, regardless of the ID selector or where the blocks appear. This is why partially adopting layers lets legacy unlayered CSS override everything.

### 9. A Sass file contains `$brand: #2563eb;` and uses `$brand` throughout. The team wants a dark theme that changes the brand colour when `data-theme="dark"` is set on `<html>`. Why can the Sass variable not do this by itself?

- [ ] Sass variables cannot hold colour values
- [ ] Sass variables are scoped to the file and cannot be shared
- [ ] Sass does not support attribute selectors
- [x] Sass variables are replaced with their values at compile time, so nothing remains in the browser to change; a CSS custom property is resolved at runtime and can be overridden by a selector

> After compilation, every `$brand` is the literal `#2563eb`. There is no variable left to re-assign when the attribute changes. Custom properties participate in the cascade, so `[data-theme="dark"] { --brand: … }` changes every `var(--brand)` beneath it. Sass can still be used to author the custom properties.

### 10. Your CSS source contains `color: oklch(0.6 0.2 250)` and native nesting. The built stylesheet contains an extra `color: #…` line before the `oklch()` line and flattened selectors. What produced that, and what controls it?

- [ ] The browser rewrote the stylesheet when it loaded
- [ ] The minifier corrupted the file
- [x] A transform step (Lightning CSS or PostCSS plugins) compiled newer syntax for older browsers, driven by the project's Browserslist targets
- [ ] Sass converted the colours because OKLCH is not valid CSS

> Tools such as Lightning CSS and `postcss-preset-env` lower modern syntax and add fallbacks for the browsers in your target list. Updating the targets to modern browsers removes the fallback and keeps nesting. Only syntax can be compiled this way; features that need browser behaviour, such as container queries, cannot.

### 11. You are choosing a styling approach for a new product built with Next.js App Router by a team of twelve, with an existing token set. Give your recommendation and the argument for it, including what you give up.

> A sound answer names criteria and trades them off. The App Router is built on Server Components and streaming, so the approach should emit static CSS: Tailwind, CSS Modules, vanilla-extract, or Panda. Runtime CSS-in-JS is ruled out by its Server Component and SSR costs. With twelve people, consistency matters: Tailwind configured from the existing tokens makes on-scale values the path of least resistance and keeps CSS size flat, at the cost of noisy markup and the need for component abstraction and a variant helper such as `cva`. CSS Modules with tokens as custom properties is an equally defensible choice for a team with strong CSS skills; it gives real CSS and no lock-in but relies on linting to keep people on the tokens. vanilla-extract or Panda add typed tokens and variants, at the cost of build integration and a learning curve. Whatever is chosen, tokens should live outside the styling tool as custom properties or a token file, the decision should be recorded with its reasoning, and the team should state what would cause a revisit. "It is popular" or "I know it" are not arguments.

### 12. A card shows a product name, a price, and a "Free returns" note, all at 16 px regular weight in the same colour. Without changing any font size, describe how you would establish a clear hierarchy.

> Use weight, colour, and space instead of size. Make the most important item (usually the price, or the name, depending on the goal) heavier, for example weight 600 or 700 in the primary text colour. Keep the name at medium weight in the primary colour. De-emphasise the note by using the secondary text colour and regular weight; lowering the supporting content is often more effective than raising the main content. Then use spacing to group: keep the name and price close together and put more space before the note, so proximity shows what belongs together. Check the result with a squint or blur test, confirm the secondary text colour still meets 4.5:1 contrast, and make sure nothing relies on colour alone.

### 13. In a form, the label-to-input gap is 16 px and the gap between one field group and the next is also 16 px. Users report the form is hard to scan. Which principle is being violated and what is the fix?

- [ ] Alignment; right-align the labels
- [ ] Hierarchy; make the labels larger
- [x] Proximity; make the label-to-input gap clearly smaller than the gap between groups
- [ ] Consistency; use 16 px everywhere including padding

> People read closeness as relatedness. With equal gaps, a label is as close to the field above as to its own field, so the grouping is ambiguous. Tightening the label gap (to 4 or 8 px) and widening the gap between groups (to 24 px) makes the structure visible without any other change.

### 14. Why is OKLCH preferred over HSL for generating a colour palette's ramps?

- [ ] OKLCH is supported in more browsers than HSL
- [ ] HSL cannot express dark colours
- [ ] OKLCH colours are automatically WCAG compliant
- [x] OKLCH lightness is perceptually uniform, so equal lightness values look equally light across hues and contrast is predictable

> In HSL, yellow and blue at the same lightness percentage look very different in brightness, so step 500 of each hue would contrast differently against the same background. OKLCH's lightness channel tracks perceived lightness, which lets you build ramps whose steps behave consistently across hues. It does not guarantee compliance; you still verify the pairs.

### 15. What is wrong with this focus styling, and how should it be written?

```css
button:focus { outline: none; }
button:hover { background: var(--action-hover); }
```

> Removing the outline with no replacement leaves keyboard users with no indication of which control has focus, which fails WCAG's Focus Visible requirement and makes the interface unusable without a mouse. The intent is usually to hide the ring on mouse click; `:focus-visible` does that properly, since browsers match it for keyboard focus and not for pointer clicks on buttons. Write `button:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }` and make sure the ring has at least 3:1 contrast against adjacent colours. The hover rule can also be wrapped in `@media (hover: hover)` to avoid sticky hover styles on touch devices.

### 16. In Figma, a frame uses auto layout with a child set to "Fill container" along the main axis and a sibling set to "Hug contents". What is the closest CSS for the two children?

- [ ] Both `width: 100%`
- [x] The first `flex: 1` (grows to take remaining space), the second sized by its content with no grow
- [ ] The first `position: absolute; inset: 0`, the second `display: inline`
- [ ] The first a fixed pixel width copied from the inspect panel, the second `flex: 1`

> Auto layout maps to flexbox. "Fill container" means take the available space, which is `flex: 1` on the main axis (or `align-self: stretch` on the cross axis). "Hug contents" means the size comes from the content, which is a flex item's default. Copying the pixel width shown in the inspect panel hard-codes the size the designer happened to draw at.

### 17. Developers on a product team keep rebuilding buttons from the CSS shown in Figma's inspect panel instead of using the design system's `Button`. What does connecting the Figma component to the code component change, and what has to be true for it to work well?

> With a Code Connect mapping, selecting a button instance in Dev Mode shows the real usage of the code component, with props derived from that instance's Figma properties (for example `<Button variant="danger" disabled>Delete</Button>`), instead of autogenerated CSS. The path of least resistance becomes importing the existing component. The mapping declares how each Figma property translates to a prop and is published from the repository so it stays current; AI tools using the Figma MCP server read the same mapping. For it to work well, the two sides must be aligned first: variant property names and values in Figma should match the component's props, designs should be bound to variables whose code syntax shows the token name rather than a raw value, every library component should correspond to one code component with a known status, and there must be a process so that a change on either side is reflected in the other.

### 18. A design system has these tokens. A rebrand changes the primary colour from blue to purple. Which change is correct?

```css
--blue-600: oklch(0.55 0.2 258);
--purple-600: oklch(0.52 0.22 300);
--color-action: var(--blue-600);
--button-primary-bg: var(--color-action);
```

- [ ] Change the value of `--blue-600` to the purple colour
- [ ] Change `--button-primary-bg` to `var(--purple-600)`
- [x] Change `--color-action` to `var(--purple-600)`
- [ ] Find and replace `--blue-600` with `--purple-600` in every component

> The semantic tier exists for this. Repointing `--color-action` updates every component that uses the action role. Changing the primitive's value makes `--blue-600` a lie and breaks anything that legitimately wants blue. Changing only the button token leaves links, focus states, and other action-coloured elements on the old brand. Components should never reference primitives directly.

### 19. A site stores the user's theme choice in `localStorage` and applies it in a React effect. Users who chose dark see a white flash on every page load. Explain the cause and the fix.

> The server (or static HTML) is rendered with the default light theme. The browser paints it, then the JavaScript bundle loads, React hydrates, and only then does the effect read `localStorage` and set the theme, so the first paint is always light. The fix is to apply the theme before first paint: a small inline, render-blocking script in `<head>` that reads the stored preference (falling back to `prefers-color-scheme`) and sets `data-theme` on the root element. Because it runs before the body is parsed, the first paint already has the right custom property values. With server rendering, an alternative is to store the choice in a cookie and render the attribute on the server. Also set `color-scheme` so native controls and the canvas match.

### 20. Which prop design is hardest to misuse?

- [ ] `<Alert error warning={false} success={false} />`
- [ ] `<Alert type={1} />`
- [x] `<Alert tone="error" />` with `tone` typed as `'info' | 'success' | 'warning' | 'error'`
- [ ] `<Alert className="alert-error" />`

> A single prop with a union of named values makes the options mutually exclusive, discoverable through autocomplete, and checked by the compiler. Separate booleans allow contradictory combinations such as `error` and `success` together. A numeric code is opaque, and a class name bypasses the component's API entirely.

### 21. A team builds a custom dropdown menu from `<div>`s with click handlers. List at least five behaviours it needs in order to be accessible, and say what a headless library provides.

> A menu button pattern needs: the trigger to expose `aria-haspopup` and `aria-expanded`; `role="menu"` and `role="menuitem"` on the popup and items; opening with Enter, Space, and the arrow keys; focus moving into the menu on open; arrow keys moving between items, with Home and End; typeahead to jump to an item by its first letters; Escape closing the menu and returning focus to the trigger; closing on outside click and on Tab; skipping disabled items; positioning that flips when there is no room; and correct behaviour with screen readers and touch. Getting all of that right across browsers and assistive technologies is hard. A headless library (Radix, Base UI, React Aria, Ark) implements the behaviour, focus management, and ARIA wiring with no styles, so you supply the look through your own classes and tokens and wrap the primitive once as your design system's component.

### 22. What does this story's `play` function verify?

```tsx
export const Disabled: Story = {
  args: { disabled: true, onClick: fn() },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
```

- [ ] That the button renders with a disabled visual style
- [ ] That clicking the button calls `onClick` exactly once
- [x] That clicking a disabled button does not invoke the `onClick` handler
- [ ] That the story throws when `disabled` is true

> `fn()` creates a spy passed in as the `onClick` arg. The play function runs after the story renders, simulates a click, and asserts the spy was not called. It checks behaviour, not appearance; the visual state would be covered by a screenshot test.

### 23. Screenshot tests pass on a developer's Mac but fail in Linux CI with small differences around all text. What is the most likely cause and the right fix?

- [ ] The CI machine is slower, so animations had not finished; add a longer timeout
- [ ] The threshold is too strict; raise `maxDiffPixelRatio` until it passes
- [x] Font rendering and antialiasing differ between operating systems; generate and compare baselines in the same environment, such as a fixed Docker image
- [ ] Git corrupted the PNG baselines; store them outside the repository

> Text is rasterised differently on each platform, so a baseline captured on macOS will never match Linux output exactly. Baselines must be produced in the environment that runs the comparison. Loosening the threshold until it passes hides real regressions along with the noise.

### 24. Every story in a component library passes the axe checks in CI. Which conclusion is justified?

- [ ] The components are WCAG AA compliant
- [ ] Keyboard and screen-reader testing can be skipped for these components
- [x] No automatically detectable violations were found; focus order, keyboard interaction, and the quality of names and announcements still need manual testing
- [ ] The components are accessible in every theme and at every zoom level

> Automated engines check rules that can be decided from the DOM, such as missing names, invalid ARIA, and contrast in the rendered state. They cannot judge whether a label makes sense, whether focus moves and returns correctly, or what a screen reader actually announces, and they only see the states and themes your stories render. They catch a useful share of problems, which is why they should fail the build, but a pass is a floor, not a certification.

### 25. What does this story's test verify about the dialog, and which accessibility requirement would break it?

```tsx
export const FocusReturn: Story = {
  play: async ({ canvas, userEvent }) => {
    const open = canvas.getByRole('button', { name: 'Edit profile' });
    await userEvent.click(open);
    await userEvent.keyboard('{Escape}');
    await expect(open).toHaveFocus();
  },
};
```

> It opens the dialog from its trigger, presses Escape, and asserts that keyboard focus is back on the trigger. That checks two parts of the dialog pattern: Escape closes it, and focus returns to the element that opened it. If the dialog did not restore focus (leaving it on `<body>` or on a removed element), keyboard and screen-reader users would lose their place and have to navigate from the top of the page; the assertion would fail. The `getByRole` query with a name is also a check in itself: it only succeeds if the trigger is exposed as a button with the accessible name "Edit profile".

### 26. An icon-only button is implemented like this. Identify the accessibility problems and rewrite it.

```tsx
<div onClick={onClose}>
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path d="M6 6l12 12M18 6L6 18" stroke="#333" />
  </svg>
</div>
```

> A `<div>` is not focusable, has no role, and does not respond to Enter or Space, so keyboard and screen-reader users cannot use it. Nothing gives the control an accessible name. The stroke colour is hard-coded, so it will not follow the text colour or theme. The click target is only 16 px square, below the 24 px minimum in WCAG 2.2. A corrected version:
>
> ```tsx
> <button type="button" onClick={onClose} aria-label="Close" className="icon-button">
>   <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
>     <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
>   </svg>
> </button>
> ```
>
> The `<button>` supplies focus, role, and keyboard activation. `aria-label` names it, and the SVG is hidden from assistive technology because it is decorative here. `currentColor` inherits the theme, and the `icon-button` class should give the button padding so the target is at least 24 by 24 CSS pixels with a visible focus ring.

### 27. Which of these changes to a published component library requires a major version under semantic versioning?

- [ ] Adding a new optional `size="xl"` value to Button
- [ ] Fixing a bug where the focus ring did not appear in Safari
- [ ] Adding a new `Tooltip` component
- [x] Changing Button's default `variant` from `"primary"` to `"secondary"`

> A changed default alters the behaviour of every existing usage that relied on it, without any code change by the consumer, so it is breaking. Adding an optional value or a new component is a minor release, and a bug fix is a patch. In component libraries, renamed CSS variables, changed DOM structure, and raised peer dependency minimums are also breaking.

### 28. A consumer installs your component package and gets "Invalid hook call" errors. `npm ls react` shows two copies of React. What is wrong in your `package.json`?

- [ ] `sideEffects` is missing, so React was tree-shaken
- [x] React is listed under `dependencies` instead of `peerDependencies`, so the package brings its own copy
- [ ] The `exports` field does not include a `require` condition
- [ ] The package is missing `"type": "module"`

> Hooks require a single React instance shared by the app and its libraries. Declaring React as a regular dependency lets the package manager install a second copy for your package when versions do not dedupe. A peer dependency says "use the host's React". Keep it in `devDependencies` as well for local development.

### 29. Your design system needs to rename Button's `kind` prop to `variant` across forty consuming repositories. Describe a release plan that minimises pain.

> First, a minor release that adds `variant` and keeps `kind` working: map `kind` to `variant` internally, mark `kind` with a `@deprecated` JSDoc tag so editors strike it through, and log a development-only console warning naming the replacement. Document the change in the changelog and the component's docs. Second, write and publish a codemod (for example with jscodeshift) that finds JSX usages of the Button import and renames the attribute, and test it against a few real repositories. Third, measure adoption: use a usage scanner or code search to see which repositories still pass `kind`, and offer help to the stragglers. Finally, remove `kind` in the next major version, with a migration guide that links the codemod, and publish a pre-release so teams can try the upgrade early. The principle is to deprecate before removing, automate the migration, and give a clear timeline.

### 30. Which easing is the best default for a dropdown menu appearing in response to a click?

- [ ] `linear`, because it is the most predictable
- [ ] `ease-in`, because the menu should build up speed
- [x] An ease-out curve, because it responds immediately and settles gently
- [ ] A long ease-in-out over 800 ms, because it feels smooth

> Elements entering in response to user input should start fast so the interface feels responsive, then decelerate into place: ease-out. Ease-in starts slowly, which reads as lag after a click. Linear motion looks mechanical, and 800 ms is far too long for a frequently used control; 150 to 250 ms is typical.

### 31. A list item should animate out when removed. With plain React state, the item disappears instantly even though it has a CSS exit transition. Why, and how does Motion solve it?

- [ ] React batches state updates, which cancels CSS transitions
- [ ] CSS transitions cannot animate opacity to zero
- [ ] The item's key changed, so React reused the wrong element
- [x] React removes the element from the DOM as soon as it is no longer rendered, leaving nothing to animate; `AnimatePresence` keeps it mounted until its `exit` animation finishes

> An exit transition needs the element to exist while it animates. React unmounts immediately when the item leaves the rendered output. `AnimatePresence` tracks children that have been removed, plays their `exit` state, and only then removes them from the DOM.

### 32. Explain the four steps of FLIP and why it performs better than animating `top` and `left`.

> First: measure the element's starting position and size with `getBoundingClientRect()`. Last: make the DOM or style change that moves it to its final layout, and measure again. Invert: apply a transform (translate and, if needed, scale) equal to the difference, so the element appears to be back where it started. Play: animate that transform to none, so the element moves to its real final position. It performs better because the expensive layout work happens once, before the animation starts. During the animation only `transform` changes, which the browser can run on the compositor without recalculating layout or repainting on every frame. Animating `top`, `left`, `width`, or `height` forces layout for the element and anything affected by it on each frame, which causes dropped frames on slower devices.

### 33. A product grid uses this to morph a clicked thumbnail into the detail image, but the transition falls back to a plain page update with no animation. What is the likely cause?

```css
.product-thumbnail { view-transition-name: product-image; }
.detail-image { view-transition-name: product-image; }
```

```js
document.startViewTransition(() => showDetail(id));
```

- [ ] `startViewTransition` requires an async callback
- [ ] `view-transition-name` only works on `<img>` elements
- [x] Every thumbnail in the grid has the same `view-transition-name`, and names must be unique among rendered elements when the snapshot is taken
- [ ] Shared-element transitions need the cross-document `@view-transition` rule

> A view transition name must identify exactly one rendered element in each captured state. With many thumbnails sharing `product-image`, the browser skips the transition. Assign the name only to the clicked thumbnail (set it just before starting the transition, or use a unique name per item) so that one old element pairs with one new element.
