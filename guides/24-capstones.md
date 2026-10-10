# Capstone Projects: Guide

## Toolkit

### DevTools and tooling

A capstone uses everything the earlier modules introduced, so the tooling list is about the things that turn a project into a product.

Start every capstone with the same base: a repository with a `README`, TypeScript in `strict` mode, a formatter and linter (Prettier or Biome, ESLint with typescript-eslint), Vitest for unit and component tests, Playwright for end-to-end tests, and a CI workflow in GitHub Actions that runs type check, lint, tests, and build on every pull request. Add preview deployments from your host so each pull request has a URL you can test on a real phone.

For performance, use Lighthouse in Chrome DevTools for a quick lab read, the Performance panel with CPU throttling set to 4x or 6x slowdown and network to Slow 4G for diagnosis, and Lighthouse CI or `size-limit` in the pipeline to enforce a budget. The `web-vitals` library reports LCP, INP, and CLS from real users; send them to your analytics endpoint or use your host's real user monitoring. PageSpeed Insights shows Chrome UX Report field data for an origin once it has enough traffic.

For accessibility, use the axe DevTools extension and the Accessibility pane in the Elements panel (computed name, role, and the full accessibility tree), `@axe-core/playwright` in CI, and real screen readers: NVDA with Firefox or Chrome on Windows, VoiceOver with Safari on macOS and iOS, TalkBack with Chrome on Android.

For operations, set up Sentry or a similar error tracker with source maps uploaded at build time and each release tagged with the commit SHA, plus a feature flag mechanism, even a simple environment-driven one.

For publishing (design system, developer tool), use Changesets for versioning and changelogs, `npm pack --dry-run` to see exactly what will be published, `publint` and Are The Types Wrong to check the package's `exports`, and npm trusted publishing from CI so no long-lived token exists.

### Testing and verifying your work

A capstone is done when someone else can use it and you can show evidence that it works, not when the features exist on your machine.

- **It runs for a stranger.** A fresh clone, following only the README, reaches a running app. A person who is not you completes the main flow on the deployed URL without help. Watch them do it and say nothing.
- **Critical flows are covered end to end.** Sign up, the core action, and any flow involving money each have a Playwright test that runs in CI against a production build.
- **Accessibility is verified by hand as well as by tool.** Automated checks find perhaps a third to a half of issues. You have completed every flow with the keyboard alone and with a screen reader, at 200% zoom and 320 CSS pixels wide, and you have a written list of what you tested and what you found.
- **Performance is measured in the field.** Lab scores guide you; the pass mark is the 75th percentile of real visits meeting the Core Web Vitals thresholds: LCP at or under 2.5 seconds, INP at or under 200 milliseconds, CLS at or under 0.1.
- **The budget fails the build.** Open a pull request that deliberately exceeds the budget and confirm CI goes red.
- **Errors reach you.** Throw a test error in production and confirm it arrives in the tracker with a readable, source-mapped stack trace and the release identified.
- **Rollback is rehearsed.** You have rolled back a real deployment and timed it.
- **The writing exists.** The design doc predates the code, and the retrospective is published.

Keep a `docs/evidence.md` in each capstone that links to the test runs, the audit notes, a field data screenshot, and the rollback rehearsal. It is the difference between claiming and showing.

### Tricks and gotchas

- Deploy on day one. A "hello world" with CI, a preview URL, error tracking, and a rollback is the first milestone of every capstone. Adding operations at the end never happens.
- Pick one capstone and finish it before starting another. One finished product teaches more than four at 60%.
- Scope with a cut line. List features in order and mark where you could stop and still have a product. Stretch goals stay below the line until everything above it is done.
- Use boring choices for everything except the thing the capstone is about. In the real-time capstone, the novelty is the sync engine; do not also pick an unfamiliar framework.
- The Chrome UX Report only includes origins with enough traffic, so a personal project will usually have no data there. Collect your own field data with the `web-vitals` library from day one.
- Test on a real mid-range Android phone over a mobile connection. DevTools throttling is an approximation and flatters you.
- Fake the money, not the flow. Use the payment provider's test mode and test cards end to end, including webhooks, failed payments, and cancellations.
- Seed data matters. Empty-state screenshots do not show a product; write a seed script that creates a realistic account.
- Never commit secrets. Use the host's environment variables, and add a secret scanner to CI.
- Find real users. Three people using it weekly will give you a bug list no test plan would.
- Write the retrospective notes as you go. A `NOTES.md` with dated entries of surprises and decisions makes the final write-up an editing job instead of archaeology.
- Record a two-minute demo video. It forces the product to work start to finish and is what most people will actually look at.

### Official references

- [Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/) - what a design doc contains and when to write one.
- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) - every success criterion with techniques, filterable to level AA.
- [ARIA Authoring Practices Guide: Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) - expected keyboard behaviour and ARIA for common widgets.
- [web.dev: Web Vitals](https://web.dev/articles/vitals) - the metrics, the thresholds, and how they are measured.
- [Chrome UX Report documentation](https://developer.chrome.com/docs/crux) - where public field data comes from and its eligibility rules.
- [Lighthouse CI: Getting started](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md) - running Lighthouse and assertions in a pipeline.
- [Playwright: Best practices](https://playwright.dev/docs/best-practices) - writing end-to-end tests that are stable.
- [GitHub Actions documentation](https://docs.github.com/en/actions) - workflows, environments, and deployment.
- [Sentry: JavaScript](https://docs.sentry.io/platforms/javascript/) - error tracking setup, releases, and source maps.
- [Google SRE book: Postmortem culture](https://sre.google/sre-book/postmortem-culture/) - how to write about what went wrong without blame.
- [Semantic Versioning 2.0.0](https://semver.org/) - the contract your published packages make.

## Skills

### Production SaaS app

**Brief.** Build and run a small multi-tenant product that a team could pay for: an invoice tracker, a booking tool, a feedback board, a status page service. The domain matters less than the fact that it has accounts, money-shaped flows, and data people would be upset to lose. This capstone draws most on the modules on React, state and data, rendering and meta-frameworks, testing, security, and delivery and operations.

**Required features.**

- Authentication: sign up with email verification, sign in, sign out, password reset, and session expiry. Sessions in `HttpOnly`, `Secure`, `SameSite` cookies. Use a maintained auth library or provider; do not write your own password hashing.
- Organisations and roles: a user belongs to a workspace, can invite others by email, and there are at least two roles. Authorisation is enforced on the server for every request, never only by hiding buttons.
- The core resource with full create, read, update, delete: list with pagination, filtering and sorting reflected in the URL, detail view, optimistic updates, and proper loading, empty, and error states.
- A dashboard with at least two charts that have text alternatives.
- Billing-shaped flows using a payment provider's test mode: plans, checkout, upgrade and downgrade, cancellation, failed payment, and plan limits enforced. Subscription state changes arrive by webhook, with signature verification and idempotent handling.
- Settings: profile, workspace, members, billing, and account deletion.
- Transactional email: verification, invitation, receipt.

**Architecture and stack options.** A full-stack meta-framework is the pragmatic choice: Next.js (App Router), React Router in framework mode, or TanStack Start, with Postgres and a typed query layer. An SPA with a separate API is also valid if you want to practise that boundary. Validate every input on the server with a schema shared with the client forms. Decide deliberately which state lives in the URL, in the server cache, and in local component state.

**Milestones.**

1. Design doc, then a deployed skeleton with CI, preview deployments, error tracking, and a rehearsed rollback.
2. Auth, workspaces, and roles, with end-to-end tests.
3. The core resource and dashboard.
4. Billing and webhooks.
5. Settings, email, accessibility audit, performance budget met.
6. Real users, monitoring review, retrospective.

**Done means.** A stranger can sign up, verify, create a workspace, invite a teammate, use the core feature, subscribe with a test card, cancel, and delete their account, on a phone, with a keyboard, and with a screen reader. Every one of those flows has an end-to-end test. Cross-workspace access is proven impossible by the authorisation tests described under Security review.

**Stretch goals.** Audit log, two-factor authentication or passkeys, an in-app command palette, import and export, internationalisation with a second locale and right-to-left support, usage-based billing.

**Try it:** Before writing code, list every state a subscription can be in (trialing, active, past due, cancelled but still in its paid period, expired) and what the user can do in each. Check the list against your payment provider's documentation.

**Resources**
- [Stripe Docs: Build a subscriptions integration](https://docs.stripe.com/billing/subscriptions/build-subscriptions)
- [OWASP Cheat Sheet: Session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Next.js documentation](https://nextjs.org/docs)

### Design system

**Brief.** Build a component library that another team could adopt: design tokens, accessible components, documentation, tests, and a published, versioned package. The product is the developer and designer experience, and its users are other engineers. This draws on the modules on CSS, accessibility, styling and design systems, TypeScript, testing, and build tooling.

**Required features.**

- Tokens in three tiers: primitives (the raw palette and scales), semantic tokens (`color.text.muted`, `space.inset.md`), and component tokens where needed. Author them in the Design Tokens Community Group format and build them to CSS custom properties. Light and dark themes, both meeting WCAG AA contrast.
- At least 20 components. A sensible set: Button, IconButton, Link, TextField, Textarea, Checkbox, RadioGroup, Switch, Select, Combobox, Dialog, Popover, Tooltip, Menu, Tabs, Accordion, Toast, Alert, Badge, Card, Table, Pagination, Skeleton, Avatar. Each follows the matching ARIA Authoring Practices pattern, works with keyboard and screen reader, has visible focus, respects `prefers-reduced-motion`, and supports right-to-left through logical properties.
- A consistent, typed API: the same prop names for the same ideas across components, forwarded refs, native attributes passed through, controlled and uncontrolled modes for stateful components, and composition in preference to large configuration props.
- A documentation site with live examples, a props table, accessibility notes, and do and don't guidance for every component.
- Tests: interaction tests per component, automated axe checks on every story, and visual regression across themes.
- A published npm package with correct `exports`, type declarations, tree-shakeable ES modules, semantic versioning, and a generated changelog.

**Architecture and stack options.** For behaviour, either build on a headless library (React Aria Components, Radix Primitives, Base UI) and own the styling and API, or write a few primitives yourself to learn the hard parts. Build Dialog and Combobox from scratch at least once; they contain most of the difficulty. Style with CSS custom properties plus CSS Modules, vanilla-extract, or Tailwind driven by your tokens. Use Storybook for the workshop and for tests. Build with Vite library mode or tsdown, and release with Changesets from CI using npm trusted publishing.

**Milestones.**

1. Design doc: principles, token architecture, API conventions, browser support.
2. Tokens, themes, and the build and release pipeline, publishing version `0.1.0` with only Button.
3. Form controls.
4. Overlays (Dialog, Popover, Menu, Tooltip, Combobox, Toast).
5. Remaining components, documentation site, visual regression.
6. Build a real page with it, fix what hurts, release `1.0.0`.

**Done means.** A separate application installs the package from npm and builds a settings page and a data table page with it, without overriding styles by force. Every component passes a keyboard and screen reader check that you have recorded. A breaking change goes out as a major version with a migration note.

**Stretch goals.** A codemod for one breaking change, a Figma library that uses the same tokens, a second framework binding or web component output, density modes, and published bundle size per component.

**Try it:** Write the API for `Select` and `Combobox` as TypeScript types before implementing either. Give them to another engineer and ask them to write usage code for three cases from the types alone. Wherever they hesitate, the API needs work.

**Resources**
- [ARIA Authoring Practices Guide: Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [Design Tokens Format Module](https://www.designtokens.org/tr/2025.10/format/)
- [Storybook: Writing tests](https://storybook.js.org/docs/writing-tests)

### Real-time collaborative tool

**Brief.** Build a multi-user whiteboard or document editor in which several people edit the same thing at once, see each other, and never lose work, including when someone goes offline and comes back. This is the hardest capstone technically; it draws on browser APIs, state and data, PWA and offline, graphics and rich UI, and performance.

**Required features.**

- A shared document: for a whiteboard, shapes, freehand strokes, text, selection, move, resize, delete, pan and zoom; for an editor, rich text with headings, lists, links, and marks.
- Real-time sync between clients, converging to the same state whatever the order of message arrival.
- Presence: who is here, live cursors or selections with names and colours, and removal when someone leaves or their connection drops.
- Conflict resolution that you can explain: what happens when two people edit the same object or the same sentence at the same moment.
- Offline support: edits made offline persist locally, survive a reload, and merge on reconnect. The UI shows connection and sync state.
- Undo and redo scoped to the local user, so undo never reverts someone else's edit.
- Sharing by link with at least view and edit permissions enforced on the server.

**Architecture and stack options.** The main decision is the sync model. A CRDT library (Yjs or Automerge) gives you convergence and offline merging, with providers for WebSocket transport and IndexedDB persistence; for text, bind Yjs to an editor such as ProseMirror or Tiptap. The alternative is a server-authoritative model: clients send operations, the server orders them and broadcasts, and the last write wins per property, which is close to what Figma describes for its own multiplayer system. That model is simpler but makes offline editing harder. Write the reasoning for your choice in the design doc. For the server, a WebSocket service with one room per document; Cloudflare Durable Objects or a similar per-document actor fits well. Render a whiteboard to canvas for scale or to SVG for simplicity, and keep the document model separate from the renderer.

Presence is ephemeral state. Send it on a separate channel (the Yjs awareness protocol does this), throttle cursor updates, and never store it in the document.

**Milestones.**

1. Design doc including the sync model and a written conflict policy.
2. Single-user editor with a clean document model and local persistence.
3. Two clients syncing through a server.
4. Presence and per-user undo.
5. Offline, reconnection, and sync status UI.
6. Permissions, performance work, accessibility pass.

**Done means.** Open the document in three browsers, take one offline, edit in all three, reconnect, and all three show identical state with no edit lost. An automated test does the same with randomised operations and asserts convergence. With 1,000 objects or a 20,000-word document and five simulated users, interaction stays responsive. Basic navigation and editing work by keyboard, and the object list or document is exposed to assistive technology.

**Stretch goals.** Comments and mentions, version history with restore, follow-a-user mode, end-to-end encryption, export to image or Markdown.

**Try it:** Before choosing a library, write down three concurrent-edit scenarios (two users move the same shape; one deletes a shape another is editing; two users type at the same position) and the outcome you want for each. Then check what Yjs or your chosen model actually does in each case.

**Resources**
- [Yjs documentation](https://docs.yjs.dev/)
- [Figma: How Figma's multiplayer technology works](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
- [Ink & Switch: Local-first software](https://www.inkandswitch.com/essay/local-first/)

### Performance showcase

**Brief.** Build a content or commerce site (a magazine, a recipe site, a shop with catalogue, product pages, cart, and checkout) that passes Core Web Vitals in the field for real visitors on mid-range phones, and prove it with data. The constraint is the deliverable: a realistic site, with real images, fonts, analytics, and third-party scripts, that is still fast. This draws on HTML, CSS, rendering and meta-frameworks, build tooling, performance, and browser internals.

**Required features.**

- At least four page types: home, listing with filtering, detail page with image gallery, and search or cart and checkout.
- Realistic weight: 100 or more content items, responsive images in modern formats, one or two web fonts, an analytics script, and at least one third-party embed (video, map, or reviews widget).
- Field measurement: the `web-vitals` library reporting LCP, INP, and CLS with attribution to your own endpoint, and a dashboard showing the 75th percentile per page type and device class.
- A performance budget enforced in CI.
- A written log of each optimisation with before and after measurements.

**Targets.** At the 75th percentile of mobile visits: LCP at or under 2.5 seconds, INP at or under 200 milliseconds, CLS at or under 0.1. Those are the "good" thresholds; all three must pass for each page type.

**Architecture and stack options.** Ship HTML first. Use static generation or server rendering with caching at the CDN edge, and send as little JavaScript as the page needs: Astro with islands, or Next.js or another meta-framework with server components and careful client boundaries. Self-host fonts with `font-display: swap` or `optional`, subset them, and preload the one used above the fold. Give the LCP image `fetchpriority="high"`, never lazy-load it, and make sure it is discoverable in the initial HTML. Reserve space for every image, embed, and late-loading element. Load third parties after the main content, behind a facade where possible. For repeat navigation, consider the Speculation Rules API to prerender likely next pages; check current browser support before relying on it, since it began as a Chromium feature, and note that browsers without support simply ignore the rules.

**Milestones.**

1. Design doc with the budget and the measurement plan.
2. Deployed skeleton with field measurement and the CI budget working from the first commit.
3. Page types built with real content.
4. Add the fonts, analytics, and third-party scripts, and keep the budget.
5. Get real traffic and tune from field data.
6. Publish the write-up.

**Done means.** Your field dashboard shows all three metrics in the "good" range at the 75th percentile on mobile for every page type over at least two weeks and a meaningful number of visits. If the origin has enough traffic to appear in the Chrome UX Report, PageSpeed Insights shows a passing assessment. The site works without JavaScript for reading content. Lighthouse lab scores are supporting evidence only.

**Stretch goals.** View transitions between pages, an offline reading mode with a service worker, an A/B test showing the effect of one optimisation, and a comparison build that shows what an unoptimised version costs.

**Try it:** Take any page you have built, open it on a real mid-range Android phone over mobile data with remote debugging attached, and record a Performance trace of load and of one interaction. Identify the LCP element, its four sub-parts (time to first byte, load delay, load time, render delay), and the longest task during the interaction.

**Resources**
- [web.dev: Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp)
- [web.dev: Optimize Interaction to Next Paint](https://web.dev/articles/optimize-inp)
- [GitHub: web-vitals library](https://github.com/GoogleChrome/web-vitals)

### Developer tool

**Brief.** Build a tool that other developers install and keep using: a command-line tool, a Vite or Rollup plugin, an ESLint rule set, or a browser extension. Solve a problem you have had more than once. The users are engineers, so the product is the install experience, the error messages, and the documentation as much as the code. This draws on tools of the trade, TypeScript, build tooling, testing, and the open-source skills in the craft module.

**Choose one form.**

- **CLI:** for example, a tool that finds unused translation keys, checks a bundle against a budget, or scaffolds a feature folder. Parse arguments with Node's built-in `util.parseArgs` or a small library, provide `--help` and `--version`, use exit codes correctly (0 for success, non-zero for failure), write results to stdout and diagnostics to stderr, offer `--json` for machines, and respect `NO_COLOR`.
- **Bundler plugin:** a Vite plugin that does something at build time, such as generating typed route definitions or optimising SVG imports. Use the documented hooks (`resolveId`, `load`, `transform`, `configureServer`) and support both dev server and build.
- **Lint rule set:** an ESLint plugin of three or more rules that encode real conventions, with autofixes or suggestions where safe, written against the AST and tested with `RuleTester`. Use typescript-eslint's utilities if rules need type information.
- **Browser extension:** Manifest V3, with an extension service worker, the minimum permissions needed, a content script or DevTools panel, and a published store listing.

**Required of all forms.**

- TypeScript source and published type declarations.
- A README that shows installation and one working example within the first screen, then full option reference.
- Error messages that say what went wrong, where, and what to do about it.
- Automated tests, including fixture-based tests of real input and expected output.
- Semantic versioning, a changelog, and automated releases from CI.
- A licence, a contributing guide, and issue templates.

**Architecture.** Keep a pure core (input in, result out) separate from the shell that reads files, prints, or talks to the bundler. The core is easy to test and can be reused if you later add a second form, such as a CLI and a plugin sharing one engine. Keep dependencies few; every dependency is install time and supply-chain surface for your users. Declare supported Node versions in `engines` and test against them in a CI matrix, including Windows, where path separators and line endings break tools written only on macOS.

**Milestones.**

1. Design doc: the problem, existing tools and why they do not fit, the interface.
2. The core with tests.
3. The shell, used on your own real project.
4. Publish `0.1.0`; get three other people to install it and watch them.
5. Fix what confused them; write docs; release `1.0.0`.

**Done means.** It is published to npm or an extension store, and at least a handful of people who are not you have installed it and used it on their own code. Someone can go from the README to a working result in under five minutes. A bug report from a user has been reproduced with a test and fixed in a release.

**Stretch goals.** Editor integration, a configuration file with schema validation, a watch mode, performance work on large repositories, a documentation site.

**Try it:** Write the README first: the install command, one example with its exact output, and the option list. Give it to a developer and ask what they expect the tool to do in two edge cases. Their answers are your first test cases.

**Resources**
- [Vite: Plugin API](https://vite.dev/guide/api-plugin)
- [ESLint: Custom rules](https://eslint.org/docs/latest/extend/custom-rules)
- [Command Line Interface Guidelines](https://clig.dev/)

### From-scratch framework

**Brief.** Build a small UI framework yourself, with no runtime dependencies, then build an application with it and write about what you learned. The goal is understanding, not a competitor to React. After this you should be able to explain why frameworks make the trade-offs they do, because you met the same problems. This draws on JavaScript, browser APIs, React and component frameworks, browser internals, and frontend architecture.

**Required features.**

- **Reactivity.** Pick one model and implement it: signals with automatic dependency tracking (`signal`, `computed`, `effect`), or a virtual DOM with a diffing reconciler and a scheduler. Signals are less code and closer to where Solid, Vue, Svelte, and Angular now sit; a virtual DOM teaches you how React works.
- **Components.** Functions that take props and return a view, with local state, children, a way to run code on mount and clean up on unmount, and keyed list rendering that preserves DOM nodes and their state when items reorder.
- **Templating.** JSX through a custom `jsx` factory configured in TypeScript, or tagged template literals.
- **A router.** Nested routes, dynamic parameters, link interception, back and forward support, a not-found route, and focus management after navigation. Build it on the History API, or on the Navigation API where you want to explore it.
- **A demonstration application** of real size, such as a task manager with routes, forms, and async data.
- **Tests** for the reactive core and the list reconciliation, and a benchmark.

The core of a signals system is small. Understanding why each line is there is the exercise:

```js
let activeEffect = null;

export function signal(value) {
  const subscribers = new Set();
  return {
    get value() {
      if (activeEffect) subscribers.add(activeEffect); // track the reader
      return value;
    },
    set value(next) {
      if (Object.is(next, value)) return;
      value = next;
      for (const run of [...subscribers]) run(); // notify
    },
  };
}

export function effect(fn) {
  const run = () => {
    const previous = activeEffect;
    activeEffect = run;
    try { fn(); } finally { activeEffect = previous; }
  };
  run();
}
```

This version has the problems you will need to solve: effects are never unsubscribed, stale dependencies are not cleaned up when a branch changes, several writes trigger several runs instead of one batched run, and a derived value read by two effects can be seen in an inconsistent state (a glitch).

**Milestones.**

1. Design doc: the model, the public API, and what is out of scope.
2. The reactive core with tests.
3. Rendering and components.
4. Keyed lists.
5. The router.
6. The demonstration application, benchmark, and write-up.

**Done means.** The demonstration application works, including reordering a list of inputs without losing focus or typed text. You have run a standard benchmark such as js-framework-benchmark, or your own equivalent, against one mainstream framework and can explain the differences. The write-up covers what was harder than expected, which design decisions you reversed, and what you now understand about the framework you use at work.

**Stretch goals.** Batching and a scheduler, context, error boundaries, async resources with suspense-like loading states, server rendering to a string plus hydration, and a small DevTools panel that shows the dependency graph.

**Try it:** Type in the signal and effect code above. Write a test in which an effect reads `a.value` only when `flag.value` is true, set `flag` to false, then change `a`. Observe the effect running when it should not, and fix it by clearing an effect's subscriptions before each run.

**Resources**
- [TC39: Signals proposal](https://github.com/tc39/proposal-signals)
- [Rodrigo Pombo: Build your own React](https://pomb.us/build-your-own-react/)
- [Vue: Reactivity in depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)

### Written design doc

Write the design doc before you build, and keep it short enough that someone will read it: two to five pages. Its purpose is to make you think through the hard parts while changing your mind is free, and to give reviewers something concrete to disagree with.

Use this structure:

```markdown
# Title · author · date · status

## Context and problem
Who is this for and what can they not do today?

## Goals and non-goals
Measurable goals. Non-goals are tempting things you are choosing not to do.

## Requirements
Functional (features) and non-functional: browsers and devices, accessibility
level, performance budget, offline, security, expected scale.

## Architecture
Rendering strategy, routing, state and data flow, API contracts, storage,
auth, hosting. One diagram. Name the libraries and why.

## Alternatives considered
For each major decision: the options, the trade-offs, why this one.

## Risks and open questions
What might not work, and how you will find out early.

## Milestones
Deployable increments with a cut line.
```

How to judge it. A good design doc states trade-offs, not only choices: "server-rendered with a meta-framework, because first load on mobile matters more than offline use; the cost is a server to run" tells the reader you understood the alternatives. The non-goals remove real scope. The non-functional requirements have numbers. The risks section names the thing you are most worried about and puts it in the first milestone. A reader can predict the folder structure and the main data flow from the document alone.

Get it reviewed by at least one other engineer before you build, and respond to their comments in writing. After the project, do not rewrite the doc to match what you built; note where reality diverged in the retrospective. Record later decisions as short architecture decision records beside the code.

The usual failures: writing it after the code as documentation, describing only the happy path, and listing technologies without saying why.

**Try it:** Write the "Alternatives considered" section for your capstone's single biggest decision (rendering strategy, sync model, or styling approach) with three real options and one paragraph on each. If you cannot argue for the options you rejected, you have not understood the decision yet.

**Resources**
- [Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/)
- [Architecture decision records](https://adr.github.io/)

### Accessibility audit

The target is WCAG 2.2 level AA, verified by using the product the way people with disabilities do. An automated scan is the first ten minutes of an audit, not the audit.

Work through these passes on every key flow, and write down what you find with the page, the element, the success criterion, and the severity.

1. **Automated.** Run axe in the browser and in CI. Fix everything it reports. It reliably finds missing names, contrast failures, and invalid ARIA; it cannot judge whether a name is meaningful or focus order makes sense.
2. **Keyboard only.** Unplug the mouse. Every interactive element is reachable with `Tab`, in a logical order, with a visible focus indicator that is not obscured by sticky headers. Widgets follow the expected keys (arrows in menus and tabs, `Escape` to close). Opening a dialog moves focus into it, keeps it there, and returns it to the trigger on close. Nothing traps you. After a route change, focus goes somewhere sensible.
3. **Screen reader.** Test with at least two pairings, such as NVDA with Firefox or Chrome and VoiceOver with Safari. Navigate by headings and landmarks. Every control announces a name, role, and state. Form errors are announced and associated with their fields. Dynamic updates (toasts, loading, results counts) are announced through live regions.
4. **Visual and zoom.** Text contrast at least 4.5:1 and non-text UI at least 3:1. The page works at 200% zoom and reflows at 320 CSS pixels wide without two-directional scrolling. Information is never carried by colour alone. Animation respects `prefers-reduced-motion`.
5. **Pointer and input.** Targets are at least 24 by 24 CSS pixels. Dragging has a non-drag alternative. Inputs have labels, correct `autocomplete`, and do not block paste.

```ts
// Playwright: fail CI on detectable violations
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('dashboard has no detectable a11y violations', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

The audit is done when every flow has been completed by keyboard and by screen reader, all findings at blocker or serious level are fixed, the remainder are filed, and the automated check runs on every pull request. Publish a short accessibility statement saying what was tested and what is known not to work.

**Try it:** Turn on a screen reader, close your eyes or turn off the display, and complete your product's main flow from sign-in to the core action. Write down every point where you did not know what had happened or what to do next.

**Resources**
- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [Playwright: Accessibility testing](https://playwright.dev/docs/accessibility-testing)
- [web.dev: Assistive technology testing](https://web.dev/learn/accessibility/test-assistive-technology)

### Security review

A security review asks, before real users arrive, how this product could be abused and whether your defences actually work. It has four parts, and each produces something you can show.

**Threat model.** Spend an hour with a diagram of the system: browser, server, database, third parties, and the trust boundaries between them. Answer four questions: what are we building, what can go wrong, what are we going to do about it, and did we do a good job? For "what can go wrong", walk each boundary with STRIDE as a prompt list: spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege. Write the result as a table of threat, mitigation, and how it is verified. For a frontend-heavy product the list nearly always includes cross-site scripting, cross-site request forgery, broken access control, leaked secrets, a compromised dependency, and abuse of anything that costs you money (sign-up, email sending, AI endpoints).

**Strict Content Security Policy.** A strict CSP is based on nonces or hashes, not on a list of allowed hosts, which is easy to bypass:

```http
Content-Security-Policy:
  script-src 'nonce-{random-per-response}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none'
```

The server generates a fresh nonce for every response and puts it on each `<script>` tag. No `'unsafe-inline'` and no `'unsafe-eval'` for scripts. Deploy it first as `Content-Security-Policy-Report-Only`, fix what it reports, then enforce. Check the result with Google's CSP Evaluator. Add the other headers at the same time: HSTS, `X-Content-Type-Options: nosniff`, and a `Referrer-Policy`.

**Dependency audit.** Commit the lockfile and install with `npm ci`. Run `npm audit` in CI and triage what it reports by whether the vulnerable code is reachable in your use. Turn on automated update pull requests. Review what you depend on directly: remove what is unused, and look at maintenance and install scripts before adding anything. Scan the repository for committed secrets.

**Authorisation tests.** Broken access control is the most common serious web vulnerability, and hiding a button does not fix it. For every resource, prove with a test that a user cannot read or change another user's data, and that a lower role cannot do what a higher role can:

```ts
import { expect, test } from '@playwright/test';

test("user B cannot read user A's invoice", async ({ playwright }) => {
  const asUserB = await playwright.request.newContext({
    baseURL: process.env.BASE_URL,
    storageState: 'playwright/.auth/user-b.json',
  });
  const res = await asUserB.get(`/api/invoices/${process.env.USER_A_INVOICE_ID}`);
  expect(res.status()).toBe(404);
});
```

Test the API directly, as here, because an attacker does not use your UI. Cover read, update, and delete, plus the unauthenticated case.

The review is done when the threat table has a verification for every row, the CSP is enforced with no unsafe script sources, the audit is clean or each exception is written down, and the authorisation tests run in CI.

**Try it:** Sign in as two different users in two browser profiles. Copy the ID of a resource from one account and request it from the other, through the URL and then directly against the API with `curl` and the second user's cookie. Do the same for an update and a delete.

**Resources**
- [OWASP Cheat Sheet: Threat modeling](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
- [web.dev: Mitigate cross-site scripting with a strict Content Security Policy](https://web.dev/articles/strict-csp)
- [OWASP Cheat Sheet: Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

### Performance budget

A performance budget is a set of numeric limits agreed before you build and enforced automatically, so that performance is a constraint on every change instead of a clean-up project later. Without enforcement it is a wish.

Set budgets at three levels:

- **User-centric metrics**, the real goal: LCP at or under 2.5 seconds, INP at or under 200 milliseconds, CLS at or under 0.1, at the 75th percentile of field data on mobile.
- **Lab proxies** you can check in CI: Lighthouse performance score, Total Blocking Time (the lab stand-in for interactivity, since INP needs real interactions), LCP and CLS under fixed throttling.
- **Quantity budgets**, which catch regressions earliest and most deterministically: compressed JavaScript per route, total page weight, image weight, number of third-party requests.

Derive the numbers from your target device and network, not from what the app currently weighs. A common starting point for a mid-range phone on a slow connection is under about 170 KB of compressed JavaScript on the critical path. Write the budget into the design doc.

Enforce it in the pipeline. `size-limit` is the simplest check for bundle size:

```json
{
  "size-limit": [
    { "name": "home route JS", "path": "dist/assets/index-*.js", "limit": "170 kB" }
  ]
}
```

Lighthouse CI asserts on lab metrics and resource sizes against a production build or preview URL:

```json
{
  "ci": {
    "collect": { "numberOfRuns": 3 },
    "assert": {
      "assertions": {
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }],
        "resource-summary:script:size": ["error", { "maxNumericValue": 170000 }]
      }
    }
  }
}
```

Run Lighthouse several times and use the median, because single lab runs vary. Then close the loop with field data from the `web-vitals` library, and alert when the 75th percentile crosses a threshold.

When a change exceeds the budget there are three honest options: optimise the change, remove something else to make room, or raise the budget deliberately with a written reason. The failure is raising the limit quietly every time it goes red.

**Try it:** Add `size-limit` or Lighthouse CI to a project, then open a pull request that imports a large library on the home route. Confirm the check fails, and read the report to see exactly which metric it tripped.

**Resources**
- [web.dev: Performance budgets 101](https://web.dev/articles/performance-budgets-101)
- [Lighthouse CI: Configuration](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)
- [GitHub: size-limit](https://github.com/ai/size-limit)

### Test strategy

A test strategy says what you test at which level, and why, so that the suite gives confidence in proportion to its cost. Write it in the design doc as a short table, then build it alongside the features.

The levels and what belongs at each:

- **Static:** TypeScript in strict mode and ESLint. Free on every keystroke; catches a whole class of errors before any test runs.
- **Unit:** pure logic with real branching, such as price calculation, date handling, reducers, parsers, permission checks. Fast, many cases, no DOM.
- **Component and integration:** a component or a whole screen rendered with its real children, queried the way a user finds things (by role and accessible name), with the network mocked at the boundary using Mock Service Worker. This level usually gives the most confidence per test in a frontend codebase.
- **End to end:** a real browser against a production build, for the critical flows only: sign up, sign in, the core action, payment, and anything whose failure would be an incident. Keep the number small; each one is slow and has more ways to flake.
- **Non-functional:** automated accessibility checks, visual regression for a design system, and the performance budget.

```text
Flow / unit                 Unit  Component  E2E  Notes
Price and tax calculation    x                    table-driven, edge cases
Checkout form validation           x              errors announced, focus moves
Sign up → verify → sign in                    x   real email via test inbox
Subscribe, cancel                             x   provider test mode + webhook
Role-based access            x     x          x   also tested directly at the API
```

Principles that keep the suite healthy. Test behaviour through the public interface, so a refactor does not break tests. Each test must be able to fail: break the code and watch it go red. Tests are independent and create their own data. In Playwright use role-based locators and web-first assertions (`await expect(locator).toBeVisible()`), which wait automatically; never `waitForTimeout`. A flaky test is a bug with a deadline; fix or delete it, because a suite people re-run until green protects nothing.

Coverage percentage is a tool for finding untested code, not a goal. The measure of the strategy is whether you would deploy on a Friday on a green pipeline.

**Try it:** List your capstone's five most important user flows. For each, write which level tests it and what specific failure that test would catch. Any flow with no end-to-end test, or any test you cannot name a failure for, is your next task.

**Resources**
- [Playwright: Best practices](https://playwright.dev/docs/best-practices)
- [Testing Library: Guiding principles](https://testing-library.com/docs/guiding-principles/)
- [Kent C. Dodds: The testing trophy and testing classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

### Production operations

Shipping is the start of a product's life. Operations is the set of things that let you know it is working, find out fast when it is not, and get back to a good state quickly. A capstone needs three: error tracking, real user monitoring, and a rollback you have actually performed.

**Error tracking.** Install an error tracker (Sentry is the common choice) on client and server. Upload source maps during the build so stack traces show your source, and tag every event with the release, using the commit SHA, so you can tell which deploy introduced an error. Add React error boundaries that report and show a recovery UI. Set an alert for new error types and for a spike in error rate. Scrub personal data before events leave the browser. Keep the signal clean: filter browser-extension noise and fix or silence recurring errors, because an inbox with 4,000 unread issues is the same as no tracking.

**Real user monitoring.** Collect LCP, INP, and CLS from real sessions with the `web-vitals` library, using the attribution build so each report says which element or interaction was responsible:

```ts
import { onCLS, onINP, onLCP } from 'web-vitals/attribution';

function send(metric: { name: string; value: number; id: string; attribution: unknown }) {
  const body = JSON.stringify({ ...metric, page: location.pathname, release: __RELEASE__ });
  // sendBeacon survives page unload; fall back to fetch with keepalive
  if (!navigator.sendBeacon?.('/rum', body)) {
    fetch('/rum', { body, method: 'POST', keepalive: true });
  }
}

onCLS(send);
onINP(send);
onLCP(send);
```

Here `__RELEASE__` is a build-time constant you define in your bundler config. Look at the 75th percentile by page and device type, not the average. Add uptime monitoring on the main URL and a health endpoint.

**A tested rollback.** Know the exact steps to return to the previous version, and rehearse them. On most hosts this is promoting the previous immutable deployment, which takes seconds. Database changes are what make rollback hard, so use expand-and-contract migrations: add the new column, deploy code that works with both, backfill, and remove the old column later. Put risky features behind flags so that turning one off is the first response. During an incident, mitigate first and debug afterwards.

Write a one-page runbook: where the dashboards are, how to roll back, how to disable each flag, and who to tell. It is done when you have deployed a deliberately broken build to production, seen the alert, rolled back by following the runbook, and recorded how long it took.

**Try it:** Deploy a version that throws on one button click. Confirm the error appears in your tracker with a readable stack trace and the right release. Then roll back using only your runbook and time it from alert to recovery.

**Resources**
- [Sentry: Source maps for JavaScript](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [GitHub: web-vitals library](https://github.com/GoogleChrome/web-vitals)
- [Google SRE workbook: Incident response](https://sre.google/workbook/incident-response/)

### Retrospective

A retrospective is an honest, public account of the project: what you set out to do, what happened, and what you would do differently. It turns experience into knowledge you keep, and it is the most persuasive evidence of seniority a project can produce, because it shows judgement and not only output.

Write for an engineer about to attempt something similar. A structure:

```markdown
# Building X: a retrospective

## What it is
One paragraph, a screenshot, links to the live product and the repository.

## Goals and how it went
The goals from the design doc, each with the result. Include numbers:
field Core Web Vitals, test counts, bundle size, users, time taken
against the estimate.

## Decisions that worked
Two or three, with why they worked. Be specific enough to be reusable.

## Decisions that did not
What you chose, what went wrong, what it cost, what you would choose now.

## Surprises
Things neither the plan nor the docs prepared you for.

## What I would do differently
Concrete, starting from the first day.

## What is next
```

How to judge it. The best retrospectives are specific and candid. "State management got messy" teaches nothing. "I put server data in a global store, then spent a week writing cache invalidation that a query library does for free; I migrated in week five and deleted 600 lines" teaches a lot. Compare what happened against the design doc: where was the estimate wrong and why, which risks materialised, which non-goals you were tempted to break. Show evidence such as charts, traces, and before and after measurements. Admit what is still not good.

Apply blameless thinking to yourself. The useful question is what about the situation made the wrong choice look right at the time, because that is what you can change next time. Avoid the two failure modes: the success story with no mistakes, and the confession with no analysis.

Keep notes during the project; memory rewrites history within weeks. Publish it where others can read it, and link it from the repository's README. Then send it to two people and ask what they would have done differently.

**Try it:** Open your capstone's design doc and annotate every section with "held", "changed", or "wrong", and one sentence on why. Those annotations are the skeleton of the retrospective.

**Resources**
- [Google SRE book: Postmortem culture](https://sre.google/sre-book/postmortem-culture/)
- [swyx: Learn in public](https://swyx.io/learn-in-public)
- [Atlassian Team Playbook: Retrospective](https://www.atlassian.com/team-playbook/plays/retrospective)

### Teach it

If you can explain a topic to a junior engineer without notes, answer their follow-up questions, and they can then do something they could not do before, you understand it. If you can only recite it, you have memorised it. Teaching is the check that distinguishes the two.

How to do it. Pick a module from this path, set aside 30 minutes with someone less experienced, and use a whiteboard or a blank editor, with no slides and no notes.

- Start from a problem they have met, not a definition. "Why did your list lose its input values when you deleted a row?" leads into reconciliation and keys better than "React uses a virtual DOM".
- Build the model in layers: the simple version first, then the complication that breaks it, then the refinement. Draw it.
- Use a concrete example with real code, and change it live to show what happens.
- Stop every few minutes and ask them to predict something or explain it back. Their explanation tells you what landed.
- Say "I don't know, let's find out" when you do not know. Looking it up together teaches the method.
- Finish with something they do themselves.

How to judge it. Afterwards the learner can explain the idea in their own words, apply it to a case you did not cover, and say where it stops applying. You, for your part, should note every question you could not answer and every place you reached for jargon to cover a gap; those are the edges of your understanding, and going back to the primary source to fill them is the point of the exercise.

Common failures: starting too far up the stack and assuming knowledge they lack, explaining how before why, covering everything instead of the three ideas that matter, and talking for twenty minutes without checking. Experts forget what was once confusing; ask the learner what was unclear, and believe them.

Work through the whole path this way over time. Modules you cannot teach are the modules to revisit.

**Try it:** Choose the module you feel least sure of. Explain its central idea out loud to an empty room for five minutes, recording yourself. Listen back and mark every vague phrase and every "basically". Look those up, then teach it to a real person.

**Resources**
- [Julia Evans: Patterns in confusing explanations](https://jvns.ca/blog/confusing-explanations/)
- [Software Engineering at Google: Knowledge sharing](https://abseil.io/resources/swe-book/html/ch03.html)
- [Farnam Street: The Feynman technique](https://fs.blog/feynman-technique/)

### Debug anything

The claim is not that you know every system. It is that, given an unfamiliar production problem and only symptoms, you have a method that reliably gets you to the root cause.

The method, end to end:

1. **Mitigate first if users are affected.** Roll back, turn off the flag, or fail over. Preserve the evidence (the release ID, logs, a failing request) but stop the harm before you investigate.
2. **Define the symptom precisely.** What is wrong, for whom, since when, how often? "The page is slow" becomes "INP at the 75th percentile on the product page went from 180 to 450 milliseconds on Android after Tuesday's release".
3. **Find what changed.** Deploys, flags, configuration, dependencies, a third-party script, a browser release, traffic mix, data volume. Line the symptom's start time up against the change log.
4. **Segment.** Break the data down by browser, device, region, release, account, and route. A problem that affects only Safari 17, or only accounts with more than a thousand items, has told you half the answer.
5. **Reproduce.** Recreate the conditions: the same browser, throttling, data, account state. If you cannot reproduce it, add instrumentation and wait for it to recur.
6. **Hypothesise and test.** State a cause that could be false, predict what you will see if it is true, and run the cheapest experiment. Bisect when the search space is large.
7. **Confirm the root cause.** You can turn the problem on and off. Keep asking why until you reach something you can change so that this class of problem does not recur.
8. **Fix, verify in production, add a regression test and an alert, and write it up.**

Know which tool answers which question: the error tracker for stack traces and breadcrumbs by release; real user monitoring for who is affected; the Network panel and HAR files for request-level problems; the Performance panel for long tasks and layout; the Memory panel's heap snapshots and allocation timeline for leaks; server logs and traces for the other side of the request; `curl -v` for headers and caching.

How to judge it. You can state the root cause in one sentence and show the evidence for it; someone else could follow your written notes and reach the same conclusion; and the fix addresses the cause, not the symptom. Practise on problems outside your comfort zone: a memory leak, a caching bug at the CDN, a hydration mismatch, a race condition, a problem that occurs in one browser only.

**Try it:** Ask a colleague to plant a bug in a staging build of an application you do not know well, and to describe only the symptom as a user would. Diagnose it while keeping a written log of each hypothesis, test, and result. Review the log with them afterwards for wasted steps.

**Resources**
- [Google SRE book: Effective troubleshooting](https://sre.google/sre-book/effective-troubleshooting/)
- [Chrome DevTools: Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems)
- [Julia Evans: A debugging manifesto](https://jvns.ca/blog/2022/12/08/a-debugging-manifesto/)

### Decide well

Choosing an architecture for a new product is a decision made with incomplete information that will be expensive to reverse. Doing it well means being explicit about what you are optimising for, honest about what you are giving up, and able to hold the position, or change it, under questioning.

A process:

1. **Establish the forces before the options.** Who are the users and what devices do they have? Is the product content, an application, or both? Does it need search engine visibility, offline use, real-time updates? What is the team's size and experience? What must be true in two years? Which constraints are fixed: budget, compliance, an existing backend?
2. **Rank the quality attributes.** You cannot maximise first-load performance, rich interactivity, offline capability, development speed, and low operating cost at once. Decide the top three, in order.
3. **Generate real options**, at least three, including the boring one and "do less".
4. **Evaluate each against the ranked attributes**, with evidence: a spike, a benchmark on your own data, another team's experience.
5. **Identify the one-way doors.** The rendering model, the data layer, and how code is split across teams are hard to change. The component library and state library are easier. Spend your deliberation on the first kind and keep options open cheaply on the second.
6. **Decide, and write an architecture decision record** covering context, decision, alternatives, and consequences, including the negative ones.
7. **State what would change your mind.**

Defending it to sceptical peers is part of the skill. Present the forces first, so that the decision follows from them. Name the weaknesses of your choice before others do. When challenged, separate a new fact, which should move you, from a preference, which should not. "You are right that this adds a server to operate; I judged that acceptable because first-load performance on mobile is our top priority, and here is the measurement" is a defence. "It's the industry standard" is not.

How to judge it. A sceptical senior engineer, after 30 minutes of questions, agrees the reasoning is sound even if they would have chosen differently. The decision record would still make sense to someone reading it in two years. You can argue the strongest case for the option you rejected.

Typical failures: choosing by familiarity or fashion, optimising for a scale you do not have, treating reversible decisions as permanent, and deciding alone and announcing it.

**Try it:** Take a product brief such as "a field-service app for technicians with poor connectivity" or "a marketing site plus logged-in dashboard for a bank". Write a one-page decision record in 45 minutes, then have two colleagues attack it for 20. Note every question you could not answer.

**Resources**
- [Martin Fowler: Architecture decision record](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html)
- [Michael Nygard: Documenting architecture decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Andrew Harmel-Law on martinfowler.com: Scaling the practice of architecture, conversationally](https://martinfowler.com/articles/scaling-architecture-conversationally.html)

### Mock system design

A frontend system design interview gives you an open prompt ("design a news feed", "design an autocomplete", "design a collaborative spreadsheet") and 45 to 60 minutes. It tests whether you can structure an ambiguous problem, make trade-offs aloud, and go deep where it matters. Three mock sessions with a peer, with honest feedback, is the minimum to get comfortable; the skill is partly performance, and performance needs rehearsal.

A structure for the session:

1. **Clarify requirements (5 minutes).** Who uses it, on what devices, at what scale? Which features are in scope? Ask about offline, real-time, accessibility, internationalisation, and search engine needs. Write down the functional and non-functional requirements and get agreement.
2. **High-level architecture (10 minutes).** Draw the main pieces: rendering strategy, the client's layers (view, state, data access), the server and CDN, and how data flows between them.
3. **Data model and API (10 minutes).** The entities, the client-side cache shape (normalised or per-query), the endpoints with request and response shapes, pagination style, and whether updates arrive by polling, server-sent events, or WebSocket.
4. **Deep dive (15 minutes).** The interviewer picks, or you propose, the hardest part: virtualising a long list, optimistic updates and rollback, race conditions in typeahead, conflict resolution, image loading strategy.
5. **Cross-cutting concerns (5 to 10 minutes).** Performance (what is the LCP element, what is code-split, what is cached), accessibility (keyboard model, announcements, focus), error and offline states, security, observability, and testing.
6. **Summarise** the trade-offs and what you would do with more time.

Prompts to practise: an infinite-scroll feed, a typeahead search, an image gallery with upload, a chat application, a data grid with 100,000 rows, a rich text editor, a video player, an e-commerce product page, a dashboard with live charts, a form builder.

How to run the mock. One person interviews, with a prompt chosen in advance and a short rubric; the other designs aloud on a shared whiteboard. Record it. Then swap. Score against the rubric: requirements gathered before designing; a coherent architecture; trade-offs stated with alternatives; real depth in at least one area; accessibility and performance raised unprompted; time managed; clear communication.

The common failures are starting to draw before asking a single question, describing a backend system and forgetting the client, listing technologies instead of reasoning, staying shallow everywhere, and ignoring the interviewer's hints.

**Try it:** Set a 45-minute timer and design "autocomplete for a search box" alone on paper, following the six steps. Then compare your answer against the checklist of concerns in step 5 and note what you left out.

**Resources**
- [GreatFrontEnd: Front end system design playbook](https://www.greatfrontend.com/front-end-system-design-playbook)
- [Patterns.dev](https://www.patterns.dev/)
- [GitHub: Awesome front end system design](https://github.com/greatfrontend/awesome-front-end-system-design)

### Leave it better

The last check is whether you have changed something for the better in a way that continues without you. Features you ship are used; improvements to how a team works are multiplied by everyone who works there afterwards.

What qualifies is an improvement to the system of work, not a single piece of work: a CI pipeline cut from 15 minutes to 4; an accessibility check that now runs on every pull request; a lint rule and codemod that removed a class of bug; a component or internal API that made the right thing the default; an onboarding guide that halves the time to first commit; a flaky test suite made reliable; a documented incident process; in open source, a feature, a significant fix, or documentation that the maintainers merged and now maintain.

How to do it:

1. **Find a real, recurring pain** and measure it: minutes lost per day, incidents per quarter, questions asked per week.
2. **Propose it** in a short written note with the evidence, the change, the cost, and who is affected. Get agreement from the people who will live with it.
3. **Build the smallest version that works** and prove it in one place.
4. **Make it the default.** Wire it into the template, the pipeline, or the lint configuration, so that adopting it requires no effort and avoiding it does.
5. **Document it** where people will look, including why it exists.
6. **Hand it over.** Give it an owner other than you: a team, a rota, the maintainers. Make sure at least two other people understand it well enough to change it.
7. **Measure again** and publish the before and after.

The test of durability: six months later, after you have moved to other work, it is still in use, someone else has modified it, and new team members assume it has always been there. If it works only while you personally push for it, it was a project, not an improvement.

The failures are the clever tool nobody else understands, the standard announced but never automated, the improvement abandoned at 90% with the old way still in place alongside it, and fixing something nobody was bothered by.

**Try it:** Ask three teammates what wastes their time every week. Pick the item mentioned most that you could fix in under two weeks, measure it today, and write the one-paragraph proposal.

**Resources**
- [StaffEng: Manage technical quality](https://staffeng.com/guides/manage-technical-quality/)
- [Open Source Guides: How to contribute to open source](https://opensource.guide/how-to-contribute/)
- [Tanya Reilly: Being glue](https://www.noidea.dog/glue)
