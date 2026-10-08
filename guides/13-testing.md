# Testing: Guide

## Toolkit

### DevTools and tooling

The default stack for a Vite-era frontend is Vitest for unit and component tests, Testing Library for querying the DOM, MSW for the network, and Playwright for end-to-end. Versions move quickly: this guide describes Vitest 5, Playwright 1.6x, Jest 30, user-event 14, and MSW 3 as they stand in late 2026.

- **Vitest CLI.** `npx vitest` starts watch mode locally and a single run in CI. In watch mode press `h` for the key list: `f` reruns failures, `p` filters by file name, `t` filters by test name. `npx vitest run src/cart` runs matching files once, `npx vitest src/cart.test.ts:42` runs the test at a line, and `npx vitest --ui` opens the browser UI with the module graph and coverage. `npx vitest doctor` reports configuration that slows the run.
- **Playwright tooling.** `npx playwright test --ui` is the main workbench: a watch-mode runner with a time-travel timeline, DOM snapshots, network and console per action, and a locator picker. `npx playwright codegen <url>` records actions and suggests locators. `npx playwright show-trace trace.zip` opens a trace from CI. The VS Code extension runs and debugs single tests and has "Pick locator".
- **Browser DevTools.** In Chrome's Elements panel, the Accessibility pane shows the computed role and accessible name of a node, which is exactly what `getByRole` matches against. Enable the full-page accessibility tree view there to see the page the way role queries do.
- **Testing Playground.** `screen.logTestingPlaygroundURL()` prints a link that opens the current DOM in testing-playground.com and suggests the best query for any element you click.
- **Lint rules.** `eslint-plugin-testing-library`, `eslint-plugin-jest-dom`, `@vitest/eslint-plugin`, and `eslint-plugin-playwright` catch missing `await`, `waitFor` misuse, focused tests, and weak queries before review does.
- **Editor integration.** The Vitest extension for VS Code shows pass/fail gutters and lets you debug one test with breakpoints. Without it, run `npx vitest --inspect-brk --no-file-parallelism` and attach from `chrome://inspect`.

### Testing and verifying your work

A test suite is itself code that can be wrong, so verify the tests.

- **See it fail.** A test you have never seen fail proves nothing. After writing one, break the behaviour (flip a condition, return early) and confirm the test goes red with a message that tells you what broke. This catches unawaited assertions, queries that match the wrong element, and mocks that replace the thing under test.
- **Refactor check.** Rename an internal function or restructure a component without changing behaviour. If tests fail, they are coupled to implementation; fix the tests, not the refactor.
- **Run in isolation and in random order.** Run a single file, then a single test with `.only` or a line filter. Run the suite with `vitest --sequence.shuffle`. Tests that only pass in a particular order share state.
- **Repeat for flakiness.** `npx playwright test --repeat-each=20 path/to/spec` and Vitest's `test('…', { repeats: 20 }, fn)` expose intermittent failures before CI does.
- **Read the coverage report for holes, not for the number.** Open the HTML report and look at the uncovered branches in code that matters: error paths, empty states, permission checks.
- **Mutation testing for critical modules.** Stryker changes your code (`>` to `>=`, removes a call) and reruns the tests. Surviving mutants are behaviour no test asserts on.

"Done" for a feature usually means: the logic with branches has unit tests, the component is tested through its rendered output and user interactions including loading and error states, one E2E test covers the critical path through the real stack, and the whole thing runs green in CI three times in a row without retries hiding anything.

### Tricks and gotchas

- Vitest does not inject `describe`/`test`/`expect` globally unless you set `globals: true`. React Testing Library only registers its automatic `cleanup` when a global `afterEach` exists, so without globals you must call `cleanup()` in your own `afterEach` or DOM leaks between tests.
- Vitest 5 defaults `clearMocks` to `true`: call history is cleared before each test but implementations stay. Jest's default is still to clear nothing.
- `vi.mock()` and `jest.mock()` calls are hoisted above imports. Variables they reference must come from `vi.hoisted()` or be defined inside the factory.
- `getBy*` throws when nothing matches, so `expect(screen.getByText('x')).not.toBeInTheDocument()` can never pass. Use `queryBy*` for absence.
- `findBy*` is `waitFor` plus `getBy*`. Reach for it before writing `waitFor(() => getBy…)`.
- Call `userEvent.setup()` once per test before rendering, and `await` every interaction. A missing `await` produces a test that passes or fails depending on timing.
- jsdom has no layout. `getBoundingClientRect()` returns zeros, nothing is ever scrolled or clipped, media queries do not apply, and `IntersectionObserver` does not exist. Logic that depends on those needs a real browser.
- In Playwright, `expect(await locator.isVisible()).toBe(true)` checks once and does not retry. `await expect(locator).toBeVisible()` retries until the timeout.
- Start `page.waitForResponse()` before the click that triggers the request, then await it after, or you race the response.
- Never commit `test.only`. Set `forbidOnly: !!process.env.CI` in Playwright, and note that Vitest already fails a CI run that contains `.only`.
- Retries hide flakiness. Use them in CI to keep the pipeline moving, but track tests reported as flaky and fix them.
- Snapshot tests of large rendered trees get approved without being read. Keep snapshots small and specific, or assert on the few things that matter.

### Official references

- [Vitest guide](https://vitest.dev/guide/): setup, CLI, configuration, and feature overview for the unit and component runner.
- [Vitest API: `vi`](https://vitest.dev/api/vi): mocks, spies, fake timers, and module mocking.
- [Vitest migration guide](https://vitest.dev/guide/migration): breaking changes between majors and the Jest migration notes.
- [Jest docs](https://jestjs.io/docs/getting-started): the runner you will meet in older codebases.
- [Testing Library: About queries](https://testing-library.com/docs/queries/about): query types and the priority order.
- [user-event](https://testing-library.com/docs/user-event/intro): realistic interaction simulation.
- [jest-dom](https://github.com/testing-library/jest-dom): DOM matchers such as `toBeVisible` and `toHaveAccessibleName`.
- [MSW docs](https://mswjs.io/docs/quick-start): network-level API mocking for Node and the browser.
- [Playwright docs](https://playwright.dev/docs/intro): E2E test runner, locators, fixtures, and tooling.
- [Playwright best practices](https://playwright.dev/docs/best-practices): the team's own guidance on resilient tests.
- [axe-core API](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md): the accessibility engine behind most automated checks.
- [web.dev: Learn Testing](https://web.dev/learn/testing): a vendor-neutral course on test types and strategy.

## Skills

### Why test

Tests are a tool for changing code safely. The first payoff is confidence: you can refactor, upgrade a dependency, or merge a colleague's change and know within minutes whether the behaviour users rely on still works. The second is documentation that cannot go stale, because a test named `rejects a coupon that expired yesterday` either describes the system or fails. The third is design feedback. Code that is painful to test is usually doing too much, reaching for globals, or hiding its inputs; the test is the first client of your API and it complains early.

Tests also cost something. You pay to write them, to run them on every push, and above all to maintain them when requirements change. A test earns its keep when the expected cost of the bugs it prevents, plus the speed it gives you when changing code, exceeds that maintenance cost. That is why a checkout flow deserves thorough tests and a throwaway prototype may deserve none. A useful way to rank candidates is risk multiplied by likelihood of change: code that handles money, permissions, or data loss, and code that many people edit, goes first.

The common mistakes sit at both ends. One is writing no tests and relying on manual clicking, which stops scaling the moment the app has more paths than you can remember. The other is treating test count or coverage as the goal, which produces brittle tests that fail on every refactor and train the team to ignore red builds. A flaky or noisy suite is worse than a small trustworthy one because people stop believing it.

**Try it:** Take a project you have shipped and list its five most damaging possible bugs (wrong total, lost form data, a broken login). For each, write one sentence describing the cheapest test that would catch it and at what level. That list is a better starting backlog than "increase coverage".

**Resources**
- [web.dev: Learn Testing](https://web.dev/learn/testing)
- [Kent C. Dodds: How to know what to test](https://kentcdodds.com/blog/how-to-know-what-to-test)

### Test shapes

A test "shape" describes how you spread effort across levels. The **pyramid** (Mike Cohn, popularised by Martin Fowler) puts many fast unit tests at the base, fewer integration tests in the middle, and a handful of slow end-to-end tests on top. It was drawn when UI tests meant brittle Selenium scripts and the reasoning still holds: the higher the level, the slower, more expensive, and harder to diagnose a failure is.

The **testing trophy** (Kent C. Dodds) is a response tuned for frontend work. From the bottom: static analysis (types and lint), a modest layer of unit tests, a large middle of integration tests that render several components together with a mocked network, and a small cap of E2E tests. The argument is that most frontend bugs live in how pieces connect (props, state, effects, requests), and that modern tools make integration tests nearly as fast as unit tests.

The two models disagree less than they appear to, largely because "unit" and "integration" have no agreed definitions. What matters is the trade-off each level makes:

| Level | Speed | Confidence per test | Failure tells you |
| --- | --- | --- | --- |
| Static | instant | narrow but broad coverage | exact line |
| Unit | milliseconds | logic in isolation | exact function |
| Integration/component | tens of ms | features working together | which feature |
| E2E | seconds | the real system | something is broken somewhere |

Invest where your risk is. A date-math library wants a pyramid. A CRUD dashboard wants a trophy. An app that is mostly glue between third-party services may need more E2E than either model suggests. Avoid the "ice cream cone": mostly manual and E2E tests on top of almost no lower-level tests, which is slow and flaky.

**Try it:** Count the tests in a real repository by level (static checks, unit, component, E2E) and sketch the shape. Then write down which recent production bugs each level would have caught. Does the shape match where the bugs were?

**Resources**
- [Martin Fowler: The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Kent C. Dodds: The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [web.dev: Pyramid or Crab? Find a testing strategy that fits](https://web.dev/articles/ta-strategies)

### Test behaviour, not implementation

A test should describe what the code does for its user and nothing about how. For a component, the user is a person (who sees text and clicks controls) and the parent component (which passes props and receives callbacks). For a function, it is the caller. Anything else, such as internal state names, private helpers, which hook was used, the class names on a wrapper `<div>`, is implementation.

Implementation-coupled tests fail in two ways. They produce **false negatives**: you refactor `useState` into `useReducer`, behaviour is identical, and tests break. And they produce **false positives**: the test asserts that `setOpen(true)` was called, the state updates, but the rendered output never changes because of a typo in the JSX, and the test stays green.

```tsx
// Coupled: breaks if the state shape or handler name changes
expect(wrapper.state('isOpen')).toBe(true);

// Behavioural: survives any refactor that keeps the UI working
await user.click(screen.getByRole('button', { name: 'Show details' }));
expect(screen.getByRole('region', { name: 'Details' })).toBeVisible();
```

Practical signs that you have crossed the line: the test imports something the production code does not export for consumers, it mocks a module that lives in the same feature folder, it asserts on the number of renders, or it needs editing every time you touch the file even when nothing visible changed. Snapshot tests of whole component trees are a frequent offender because they assert on every tag and attribute at once.

The rule applies to logic too. Test a reducer through actions in and state out, not by spying on its helper functions.

**Try it:** Pick a component test you wrote earlier. Refactor the component's internals (rename state, extract a child component, swap a class for a data attribute) without changing behaviour. Note every test that fails and rewrite each one so it would have survived.

**Resources**
- [Kent C. Dodds: Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
- [Testing Library: Guiding principles](https://testing-library.com/docs/guiding-principles)

### Anatomy of a test

Almost every good test has three parts. **Arrange** sets up the world: inputs, rendered component, mocked responses. **Act** does the one thing under test. **Assert** checks the outcome. The same structure is called given/when/then in BDD circles. Keeping the phases visually separate, usually with blank lines, lets a reader find the action instantly.

```ts
test('applies a percentage coupon to the subtotal', () => {
  const cart = createCart([{ sku: 'tea', price: 800, qty: 2 }]);

  const total = applyCoupon(cart, { code: 'TEN', percentOff: 10 });

  expect(total).toBe(1440);
});
```

"One reason to fail" does not mean one `expect`. It means one behaviour. Asserting that a submitted form shows a success message and clears its fields is one behaviour with two observations. Asserting that the form validates email, then also that it submits, then also that it handles a server error is three tests jammed together: when it fails you do not know which behaviour broke, and the first failure hides the rest.

Details that make tests readable months later:

- Name the test as a sentence about behaviour and context: `shows an inline error when the email is already registered`. A failing name should be a usable bug report.
- Keep the relevant data in the test body. Hiding the only interesting value in a shared `beforeEach` three screens up forces the reader to scroll. Use small factory functions (`createUser({ role: 'admin' })`) so each test states only what matters to it.
- Avoid logic in tests. Loops, conditionals, and computed expectations can be wrong in the same way as the code. Write expected values as literals.
- Each test must set up and clean up its own state so it can run alone and in any order.

**Try it:** Find a test longer than 30 lines. Mark each line A (arrange), B (act), or C (assert). If you see the pattern A-B-C-B-C-B-C, split it into separate tests with a factory for the shared setup and compare how the failure output reads.

**Resources**
- [Martin Fowler: GivenWhenThen](https://martinfowler.com/bliki/GivenWhenThen.html)
- [Kent C. Dodds: Avoid Nesting when you're Testing](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing)

### What not to test

Every test has a maintenance cost, so leaving things untested is a decision worth making deliberately.

**Third-party code.** You do not need to verify that React re-renders when state changes, that `Array.prototype.sort` sorts, or that your date library parses ISO strings. Their maintainers test those. What you do test is *your use* of them: that your component shows the sorted list, that your wrapper passes the right options. If you distrust a dependency enough to test it, write a few "learning tests" against it in isolation, which are also valuable when you upgrade.

**Trivial code.** A component that renders its props into markup with no branches, a constant map, a one-line getter: tests of these restate the code and fail only when you change it on purpose. They will be exercised indirectly by tests of the feature that uses them.

**Implementation details.** Private functions, internal state, the order of hook calls, CSS class names used only for styling. Covered in the entry above.

**Things other tools check better.** Types catch wrong argument shapes; a test that passes a number where a string is expected duplicates the compiler. Lint catches missing dependencies and unreachable code. Visual details like exact spacing belong in visual regression, not in assertions on computed style.

**Generated and configuration code.** GraphQL codegen output, route tables, i18n files. Test them through the features that consume them.

The counterweight: "trivial" is about logic, not size. A three-line function with a boundary condition (`>=` vs `>`) on a discount threshold is small and absolutely worth a test. And do not exclude code just because it is hard to test; that is usually where the bugs are, and the difficulty is a design signal.

**Try it:** Review a test file and classify each test as "would catch a real bug", "restates the implementation", or "tests a library". Delete the last two groups, then check whether coverage of your own branching logic actually dropped.

**Resources**
- [Kent C. Dodds: How to know what to test](https://kentcdodds.com/blog/how-to-know-what-to-test)
- [Playwright: Best practices (avoid testing third-party dependencies)](https://playwright.dev/docs/best-practices)

### Static analysis as testing

Static analysis checks code without running it, and it is the cheapest layer of the trophy: it runs on every keystroke, needs no test to be written per case, and points at the exact line.

**TypeScript** with `strict` on removes whole categories of bugs that would otherwise need tests: calling a function with the wrong argument shape, forgetting that a value can be `undefined`, missing a case in a `switch` over a union. That last one is worth setting up explicitly:

```ts
type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'error'; message: string };

function label(s: State): string {
  switch (s.kind) {
    case 'idle': return 'Ready';
    case 'loading': return 'Loading';
    case 'error': return s.message;
    default: return s satisfies never; // compile error when a new kind is added
  }
}
```

Types stop at the edge of your program. Data from `fetch`, `localStorage`, and URL parameters is whatever arrives at runtime, so validate it with a schema library (Zod, Valibot) and derive the type from the schema instead of asserting with `as`.

**ESLint** catches what types cannot: `react-hooks/rules-of-hooks` and `exhaustive-deps`, `jsx-a11y` for missing labels and invalid ARIA, and type-aware rules from typescript-eslint such as `no-floating-promises` and `no-misused-promises`, which find unawaited async calls. In test files, `eslint-plugin-testing-library` and the Vitest and Playwright plugins catch missing `await` and focused tests.

Make it a gate: run `tsc --noEmit` and `eslint .` in CI and in a pre-commit hook on changed files. TypeScript 7's native compiler makes full type checks fast enough that there is little reason to skip them. You can also test types themselves: Vitest's `expectTypeOf` and `vitest --typecheck` assert that a generic utility infers what you intend.

**Try it:** Enable `strict` plus `noUncheckedIndexedAccess` in a project, and add typescript-eslint's `no-floating-promises`. Count the errors and classify each as a real bug, a missing guard, or noise. Most people find at least one genuine bug.

**Resources**
- [TypeScript: `strict`](https://www.typescriptlang.org/tsconfig/#strict)
- [typescript-eslint: Linting with type information](https://typescript-eslint.io/getting-started/typed-linting)
- [Vitest: Testing types](https://vitest.dev/guide/testing-types)

### Test runner

A test runner finds test files, runs them in isolated workers, and reports results. **Vitest** is the default for Vite projects because it reuses your Vite config, so aliases, plugins, and TypeScript or JSX transforms behave identically in tests and in the app. **Jest** (version 30) is what you will find in older and non-Vite codebases; its API is nearly the same, but native ESM support still sits behind Node's `--experimental-vm-modules` flag and most setups transpile to CommonJS.

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: { provider: 'v8', include: ['src/**/*.{ts,tsx}'] },
  },
});
```

The default `environment` is `node`. Component tests need a DOM: `jsdom` or `happy-dom` simulate one in Node, and browser mode uses a real one. Use `test.projects` to run pure-logic tests in `node` and component tests in a DOM environment within one command.

Day-to-day commands:

- `vitest` watches and reruns only tests affected by a change, using the module graph. `vitest run` runs once.
- `vitest cart` filters by file path; `vitest src/cart.test.ts:42` by line; `-t "applies coupon"` by test name. In Vitest 5 nested names are joined with ` > `, so `-t "cart > applies coupon"`.
- `vitest related src/price.ts` runs tests that import a file, and `vitest --changed` runs tests affected by uncommitted changes.
- `vitest run --coverage` needs `@vitest/coverage-v8` installed. Only files loaded during the run are reported unless you set `coverage.include`.

Each test file runs in its own worker with a fresh module registry (the default pool is `forks`, child processes), so module-level state does not leak across files, but it does leak between tests in the same file. Vitest 5 writes reports and artifacts to a `.vitest` directory; add it to `.gitignore`.

**Try it:** Add Vitest to a small project. Write two tests, start watch mode, and edit a source file to see only the related test rerun. Then run a single test by line number, by name with `-t`, and generate an HTML coverage report and open it.

**Resources**
- [Vitest: Getting started](https://vitest.dev/guide/)
- [Vitest: Test filtering](https://vitest.dev/guide/filtering)
- [Jest: Getting started](https://jestjs.io/docs/getting-started)

### Assertions and matchers

An assertion states what must be true and, when it is not, should produce a message that explains the failure without a debugger. Choosing the most specific matcher is how you get that message.

```ts
expect(items.length).toBe(3);        // "expected 2 to be 3"
expect(items).toHaveLength(3);       // shows the actual array

expect(el.textContent === 'Saved').toBe(true); // "expected false to be true"
expect(el).toHaveTextContent('Saved');         // prints the actual text
```

The core distinctions:

- `toBe` uses `Object.is` (identity). `toEqual` compares structure recursively and ignores `undefined` properties. `toStrictEqual` also checks `undefined` keys, sparse arrays, and class types. Use `toEqual` or `toStrictEqual` for objects and arrays.
- `toBeCloseTo` for floating point; `0.1 + 0.2` is not `0.3`.
- `toThrow` needs a function, not a call: `expect(() => parse('')).toThrow(/empty/)`.
- Asymmetric matchers assert on the part you care about: `expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))`, `expect.any(Date)`, `expect.arrayContaining([...])`, `expect.stringMatching(/re/)`.
- `expect.soft` records a failure and keeps going, which is useful when checking several independent fields.

For the DOM, add `@testing-library/jest-dom` (import `@testing-library/jest-dom/vitest` in your setup file): `toBeVisible`, `toBeDisabled`, `toHaveValue`, `toHaveAccessibleName`, `toHaveAttribute`. In browser mode, Vitest ships equivalent matchers on `expect.element`.

Write a custom matcher when the same multi-line check repeats and its failure message is poor:

```ts
expect.extend({
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    return {
      pass,
      message: () => `expected ${received}${pass ? ' not' : ''} to be within ${min}..${max}`,
    };
  },
});
```

The message must read correctly for both the normal and the `.not` case, which is why it switches on `pass`. For TypeScript, augment `Matchers<R, T>` in a `declare module 'vitest'` block. For recorded expectations, see Snapshot testing.

**Try it:** Take five assertions written as `expect(condition).toBe(true)` and rewrite each with a specific matcher. Break the code each time and compare the two failure messages. Then write a `toBeValidIsoDate` custom matcher with a correct `.not` message.

**Resources**
- [Vitest: `expect` API](https://vitest.dev/api/expect)
- [Vitest: Extending matchers](https://vitest.dev/guide/extending-matchers)
- [jest-dom: Custom matchers](https://github.com/testing-library/jest-dom)

### Test doubles

A test double replaces a real collaborator so the test is fast, deterministic, or able to reach a state the real thing rarely produces. The vocabulary (from Gerard Meszaros) is worth knowing because people say "mock" for all of them:

- **Stub**: returns canned answers. `vi.fn().mockResolvedValue({ id: 1 })`.
- **Spy**: records how it was called, optionally while still calling the real code. `vi.spyOn(console, 'error')`.
- **Mock**: a double with expectations about calls built into the test's pass condition.
- **Fake**: a working, simplified implementation, such as an in-memory repository or MSW standing in for an API.

```ts
import { expect, test, vi } from 'vitest';
import { track } from './analytics';
import { checkout } from './checkout';

vi.mock(import('./analytics'), () => ({ track: vi.fn() }));

test('reports a completed purchase', async () => {
  const cart = { items: [{ sku: 'tea', price: 720, qty: 2 }] };
  await checkout(cart);
  expect(track).toHaveBeenCalledWith('purchase', { total: 1440 });
});
```

`vi.mock` is hoisted above the imports, replaces the module for the whole file, and in Vitest 5 must be called at the top level. Use `vi.hoisted()` for values the factory needs, `importOriginal` to keep part of the real module, and `vi.mocked(fn)` for types. `vi.when(spy).calledWith(1).thenReturn('one')` (new in Vitest 5) sets behaviour per argument.

Know the reset semantics: `mockClear` wipes call history, `mockReset` also resets the implementation, `mockRestore` puts back the original for `vi.spyOn` spies. Vitest 5 clears history before each test by default; implementations persist until you reset them.

Over-mocking is the main risk. Every double is an assumption about how the real collaborator behaves, and when that assumption drifts the tests stay green while production breaks. Mock at the boundaries you do not own or cannot control (network, clock, randomness, payment SDKs, analytics) and let your own modules run for real. If a test mocks the module directly beside the one under test, or mostly asserts `toHaveBeenCalledWith`, it is checking wiring, not behaviour. Prefer fakes to mocks, and prefer passing dependencies as arguments to module mocking.

**Try it:** Find a test that mocks one of your own modules. Rewrite it so only the outermost boundary (the HTTP call or the clock) is replaced. Then change the internal module's function signature and see which version of the test still passes for the right reason.

**Resources**
- [Vitest: Mocking](https://vitest.dev/guide/mocking)
- [Vitest: Mocking modules](https://vitest.dev/guide/mocking/modules)
- [Martin Fowler: Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html)

### Fake timers

Code that waits (debounce, polling, toasts that dismiss, token expiry) must not make tests wait. Fake timers replace `setTimeout`, `setInterval`, `Date`, and friends with a clock you control, so 30 seconds pass in a microsecond and the result is the same on every machine.

```ts
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { debounce } from './debounce';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

test('calls once, with the last arguments, after the quiet period', () => {
  const fn = vi.fn();
  const debounced = debounce(fn, 300);

  debounced('a');
  vi.advanceTimersByTime(299);
  debounced('b');
  vi.advanceTimersByTime(299);
  expect(fn).not.toHaveBeenCalled();

  vi.advanceTimersByTime(1);
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenLastCalledWith('b');
});
```

The details that trip people up:

- **Promises are not timers.** `advanceTimersByTime` runs timer callbacks synchronously but does not flush promise continuations between them. For code that awaits inside a timer callback, use `await vi.advanceTimersByTimeAsync(ms)`.
- **`runAllTimers` loops forever on a recurring interval** (it throws after 10,000 timers). Use `runOnlyPendingTimers` or advance by a fixed time.
- **Dates.** `vi.setSystemTime(new Date('2026-03-01T12:00:00Z'))` pins `Date.now()` and `new Date()` and works without faking timers. Always include a time zone in the string and set `TZ=UTC` for the test process, or tests fail on machines in other zones. Vitest 5 also fakes `Temporal`.
- **What is faked.** By default Vitest fakes timers and `Date` but not `process.nextTick` or `queueMicrotask`; add them with `toFake` if needed.
- **Testing Library.** `waitFor` and `findBy` poll with real timers and can hang under a frozen clock. Either use `vi.useFakeTimers({ shouldAdvanceTime: true })` or wire user-event with `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`.
- **Restore.** Always call `vi.useRealTimers()` in `afterEach`; a leaked fake clock breaks unrelated tests in the same file.

Jest's API is the same shape under `jest.useFakeTimers()`. In Playwright, the equivalent is `page.clock`.

**Try it:** Write a `poll(fn, intervalMs, maxAttempts)` helper that awaits `fn` on each tick. Test that it stops after `maxAttempts` using fake timers. Notice that the synchronous advance does not work, switch to the async variant, and explain why.

**Resources**
- [Vitest: Mocking timers](https://vitest.dev/guide/mocking/timers)
- [Vitest: `vi.useFakeTimers` and related APIs](https://vitest.dev/api/vi)
- [Jest: Timer mocks](https://jestjs.io/docs/timer-mocks)

### Snapshot testing

A snapshot assertion serialises a value, stores the result, and on later runs fails if the serialisation changed. You do not write the expected value; the tool records it. That is the appeal and the danger: the test asserts "nothing changed", not "this is correct", and whoever runs the update command decides what correct means.

```ts
expect(formatInvoice(invoice)).toMatchInlineSnapshot(`
  "Invoice 1042
  2 x Tea        £16.00
  Total          £16.00"
`);
```

The three forms differ in where the expectation lives. `toMatchSnapshot()` writes to a `.snap` file beside the test. `toMatchInlineSnapshot()` writes the value into the test file itself, where a reviewer sees it next to the code. `toMatchFileSnapshot('./expected.html')` compares against a named file with a real extension, which suits generated HTML, SQL, or code.

Snapshots help when the output is small, deterministic, and meant to be read: a formatter's result, an error message, a serialised AST, a generated config, the arguments of a call. They rot when they capture a whole rendered component tree. Such a snapshot fails on every class-name or wrapper change, the diff is hundreds of lines, and people press `u` without reading. At that point the test only documents that someone approved something.

Rules that keep them useful:

- Keep each snapshot short enough to review in a pull request, and prefer inline.
- Remove nondeterminism: dates, generated IDs, random values. Use property matchers such as `expect(user).toMatchSnapshot({ id: expect.any(String) })`, or a custom serializer.
- Update deliberately (`vitest -u`, or `u` in watch mode) and read the diff as you would code.
- In CI, Vitest does not write snapshots: a missing, mismatched, or obsolete snapshot fails the run, so a forgotten snapshot cannot slip through.

For UI, an **ARIA snapshot** is the better-scoped option. It records the accessibility tree (roles, names, states) and ignores tags, classes, and wrappers, so it survives refactors and fails when what users perceive changes:

```ts
await expect(page.getByRole('navigation')).toMatchAriaSnapshot(`
  - navigation:
    - link "Home"
    - link "Pricing"
    - button "Sign in"
`);
```

Playwright supports partial matching and regular expressions in these templates, and Vitest has `toMatchAriaSnapshot` and `toMatchAriaInlineSnapshot` as well. Screenshots are the third kind of snapshot; see Visual regression.

**Try it:** Write a file snapshot of a whole component, then rename a CSS class and add a wrapper element and look at the diff you are asked to approve. Replace it with one inline snapshot of the meaningful text and an ARIA snapshot of the structure, repeat the refactor, and compare what fails.

**Resources**
- [Vitest: Snapshot](https://vitest.dev/guide/snapshot)
- [Playwright: Snapshot testing (ARIA snapshots)](https://playwright.dev/docs/aria-snapshots)
- [Jest: Snapshot testing](https://jestjs.io/docs/snapshot-testing)

### Async tests

A test passes when its function returns (or its returned promise resolves) without throwing. Every async bug in tests comes from an assertion running after that moment, or never running at all.

```ts
// Passes even when the assertion would fail: nothing awaits the promise
test('loads the user', () => {
  fetchUser(1).then((user) => {
    expect(user.name).toBe('Ada');
  });
});

// Correct
test('loads the user', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('Ada');
});
```

The patterns to know:

- **Rejections.** `await expect(fetchUser(-1)).rejects.toThrow('not found')`. The `await` is required; without it the assertion is a floating promise. Vitest 5 now fails a test that leaves `resolves`/`rejects` unawaited, where older versions and Jest only warn or stay silent.
- **`try`/`catch` traps.** If the call unexpectedly succeeds, the `catch` block never runs and the test passes. Either use `rejects`, or add `expect.assertions(1)` at the top so the test fails when no assertion ran.
- **Callbacks and events.** Wrap them in a promise and await it, or use `vi.waitFor(() => expect(spy).toHaveBeenCalled())`. Vitest has no `done` callback.
- **Polling for a value.** `await expect.poll(() => store.getState().status).toBe('ready')` retries the getter until it matches or times out.
- **Do not sleep.** `await new Promise((r) => setTimeout(r, 500))` is slow when the code is fast and flaky when the code is slow. Wait for the observable condition instead.
- **Unhandled rejections** from code that outlives the test are reported against the run, sometimes attributed to a different test. They usually mean something was not awaited or a component was not unmounted.

Typed linting closes most of these holes mechanically: `@typescript-eslint/no-floating-promises` flags any promise that is neither awaited nor returned, and the Testing Library and Vitest lint plugins flag unawaited queries and assertions.

**Try it:** Write a test with the unawaited `.then` bug above and make the assertion wrong on purpose. Observe that it passes (or reports an error after the fact). Fix it three ways: `async`/`await`, returning the promise, and `expect.assertions`. Then turn on `no-floating-promises` and see it flagged.

**Resources**
- [Vitest: `expect` (`resolves`, `rejects`, `poll`, `assertions`)](https://vitest.dev/api/expect)
- [typescript-eslint: `no-floating-promises`](https://typescript-eslint.io/rules/no-floating-promises/)

### Testing pure logic

A pure function returns the same output for the same input and touches nothing else. Reducers, formatters, validators, parsers, and price calculators are the cheapest and most valuable code to test: no rendering, no mocks, millisecond runs. A good habit is to push logic out of components and hooks into pure functions precisely so it can be tested this way.

Table-driven tests keep many cases readable and make adding a case a one-line change:

```ts
import { expect, test } from 'vitest';
import { slugify } from './slugify';

test.each([
  { input: 'Hello World', expected: 'hello-world' },
  { input: '  trim me  ', expected: 'trim-me' },
  { input: 'Crème brûlée', expected: 'creme-brulee' },
  { input: 'a--b', expected: 'a-b' },
  { input: '', expected: '' },
])('slugify($input) -> $expected', ({ input, expected }) => {
  expect(slugify(input)).toBe(expected);
});
```

Each row becomes its own test with its own name, so one failure does not hide the others. Vitest's `test.for` is the same idea but passes the row as a single argument alongside the test context.

Choose rows deliberately. Cover each equivalence class once, then the boundaries: empty input, a single element, the value on each side of a threshold, negative numbers and zero, very long strings, Unicode, and invalid input. For a reducer, test each action from a relevant starting state, assert the input was not mutated (freeze it with `Object.freeze`), and check that unknown actions return the same reference.

For parsers and serialisers, round-trip properties are powerful: `parse(serialise(x))` should equal `x`. Property-based testing with `fast-check` generates hundreds of inputs and shrinks failures to a minimal example, which finds edge cases you would not think to write.

Keep expected values as literals. If the test computes the expectation with the same formula as the code, both can be wrong together.

**Try it:** Write a `parseDuration('1h 30m')` function that returns seconds, driven by a `test.each` table you write first. Include at least ten rows with boundaries and invalid input. Then add one property test asserting that formatting and parsing round-trip.

**Resources**
- [Vitest: Test API (`test.each`, `test.for`)](https://vitest.dev/api/)
- [fast-check: documentation](https://fast-check.dev/)

### Testing Library

Testing Library renders your component into a DOM and gives you queries that find elements the way a user or assistive technology does. The design goal is that tests cannot easily reach implementation details: there is no API for component state or instances.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('submits the email address', async () => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<SignupForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.click(screen.getByRole('button', { name: 'Sign up' }));

  expect(onSubmit).toHaveBeenCalledWith({ email: 'ada@example.com' });
});
```

Query priority, from best to last resort: `getByRole` (with `name`), `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`, then `getByAltText` and `getByTitle`, and finally `getByTestId`. `getByRole` matches the accessibility tree, so `getByRole('button', { name: 'Sign up' })` finds a `<button>`, an `<input type="submit">`, or an element with `role="button"`, by its accessible name. If the query cannot find your control, a screen reader user probably cannot either, which makes the test double as an accessibility check.

The three query families differ in what happens with no match: `getBy` throws (use it for things that must be there), `queryBy` returns `null` (use it only to assert absence), `findBy` returns a promise that retries (use it for things that appear later). All three throw on multiple matches; use the `AllBy` variants or narrow with `within(section)`.

Common mistakes: destructuring queries from `render` instead of using `screen`; `container.querySelector('.btn')`; test IDs where a role exists; exact-string matching on text that includes a count. When a query fails, the error prints the DOM and the roles available. `screen.debug()` prints on demand, and `screen.logTestingPlaygroundURL()` opens the DOM in a tool that suggests queries.

**Try it:** Take a form component and write its test using only `getByRole` and `getByLabelText`. Whenever a query fails, fix the markup (add a `<label>`, use a real `<button>`) instead of falling back to a test ID. Keep a list of the accessibility bugs you fixed along the way.

**Resources**
- [Testing Library: About queries](https://testing-library.com/docs/queries/about)
- [Testing Library: ByRole](https://testing-library.com/docs/queries/byrole)
- [Kent C. Dodds: Common mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### User interactions

`fireEvent.click(button)` dispatches a single `click` event. A real click is a sequence: pointer move, `pointerdown`, `mousedown`, focus change, `pointerup`, `mouseup`, `click`, and it does nothing at all if the button is disabled or covered. `@testing-library/user-event` simulates the whole interaction, including those checks, so tests fail for the reasons users would.

```tsx
const user = userEvent.setup();
render(<SearchBox />);

await user.type(screen.getByRole('searchbox'), 'vite{Enter}');
await user.tab();
await user.keyboard('{Shift>}{Tab}{/Shift}');
await user.selectOptions(screen.getByLabelText('Sort by'), 'Newest');
await user.upload(screen.getByLabelText('Avatar'), file);
```

What you need to know for version 14:

- Call `userEvent.setup()` once per test, before `render`, and use the returned `user`. It keeps keyboard and pointer state across calls, such as a held Shift key.
- Every method is async. A missing `await` is the most common cause of "state update not wrapped in act" warnings and intermittent failures.
- `user.type` clicks the element first, then fires `keydown`, `beforeinput`, `input`, and `keyup` per character, so per-keystroke validation and controlled-input bugs are exercised. `user.clear` empties a field.
- `user.click` on a disabled or `pointer-events: none` element throws or does nothing, as in a browser.
- `user.keyboard` uses a small syntax: `{Enter}`, `{Shift>}` to hold, `{/Shift}` to release, `[KeyA]` for physical keys.
- With fake timers, pass `advanceTimers` in `setup()` so its internal delays advance your clock, or tests hang.

Test keyboard paths as well as pointer paths: `user.tab()` then `user.keyboard('{Enter}')` exercises focus order and key handlers, which is where many accessibility bugs hide.

`fireEvent` is still right for events with no user-level API, such as `scroll`, `transitionend`, or a custom event. user-event runs inside jsdom and remains a simulation; in Vitest browser mode, `userEvent` from `vitest/browser` drives real input through the browser's automation protocol.

**Try it:** Build a controlled input that formats a credit-card number as you type. Test it once with `fireEvent.change(input, { target: { value: '4242424242424242' } })` and once with `user.type`. Introduce a bug in the per-keystroke formatting and see which test notices.

**Resources**
- [Testing Library: user-event introduction](https://testing-library.com/docs/user-event/intro)
- [Testing Library: user-event setup and options](https://testing-library.com/docs/user-event/setup)
- [Testing Library: Keyboard API](https://testing-library.com/docs/user-event/keyboard)

### Async UI

Most components do something after render: fetch, debounce, animate, lazy-load. The test must wait for the visible result of that work, not for the work itself.

```tsx
render(<UserProfile id="1" />);

expect(screen.getByRole('status')).toHaveTextContent('Loading');

expect(await screen.findByRole('heading', { name: 'Ada Lovelace' })).toBeVisible();
expect(screen.queryByRole('status')).not.toBeInTheDocument();
```

`findBy*` returns a promise that re-runs the query on an interval and on DOM mutations until it matches or times out (1000 ms by default). It is the right tool for "this element appears later". `waitFor(callback)` is the general form: it retries the callback until it stops throwing.

Rules for `waitFor`:

- Put one assertion inside it. With several, a failure in the second is reported only after the timeout, and the error can be misleading.
- Never perform side effects (clicks, `mockResolvedValue`) inside the callback; it runs many times.
- Do not write `await waitFor(() => {})` to "let things settle". Wait for something specific.
- To wait for something to go away, use `await waitForElementToBeRemoved(() => screen.queryByText('Loading'))` or `waitFor` with a `queryBy` absence assertion.

Test every state the user can see: loading, success, empty, and error. Errors and empty lists are the states people forget and the ones that break in production. Override the network handler per test to produce them.

The "not wrapped in act(...)" warning means a state update happened after your test stopped paying attention, typically a request resolving after the last assertion. The fix is to await the resulting UI change, not to wrap things in `act` by hand. Testing Library's `render`, `user-event`, `findBy`, and `waitFor` already use `act`.

With React `Suspense` and `use`, the same approach holds: assert the fallback, then `await findBy` the resolved content. If a wait hangs under fake timers, see the fake timers entry.

**Try it:** Write a component that fetches a list and has loading, empty, error, and populated states. Test all four with MSW handlers, using `findBy` for appearance and `waitForElementToBeRemoved` for the spinner. Deliberately remove an `await` and read the act warning it produces.

**Resources**
- [Testing Library: Async methods](https://testing-library.com/docs/dom-testing-library/api-async)
- [Testing Library: Appearance and disappearance](https://testing-library.com/docs/guide-disappearance)
- [Kent C. Dodds: Fix the "not wrapped in act(...)" warning](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)

### Network mocking

Mocking `fetch` with `vi.fn()` couples your tests to how the request is made. Switch from `fetch` to a client library, add a retry wrapper, or change how the URL is built, and every test needs rewriting even though behaviour is the same. Worse, a hand-rolled `fetch` stub skips real `Request`/`Response` behaviour: headers, `response.ok`, JSON parsing, abort signals.

Mock Service Worker (MSW) intercepts at the network boundary instead. Your app makes real requests with whatever client it uses; MSW catches them and answers from handlers you write. In Node it patches the request modules, and in the browser it uses a service worker, so the same handlers serve tests, Storybook, and local development.

```ts
// src/mocks/handlers.ts (MSW 3; in MSW 2 import these from 'msw')
import { http, HttpResponse } from 'msw/http';

export const handlers = [
  http.get('https://api.example.com/users/:id', ({ params }) =>
    HttpResponse.json({ id: params.id, name: 'Ada Lovelace' })),
];
```

```ts
// src/test/setup.ts
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

export const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Setting unhandled requests to `'error'` (the option is `onUnhandledFrame` in MSW 3, `onUnhandledRequest` in MSW 2) is important: a request with no handler fails the test loudly instead of hitting the real network or hanging.

Keep happy-path handlers as defaults and override per test for other states:

```ts
server.use(http.get('https://api.example.com/users/:id', () =>
  new HttpResponse(null, { status: 500 })));
```

`resetHandlers()` in `afterEach` removes overrides so tests stay independent. Use `HttpResponse.error()` for a network failure and `delay()` to hold a response while you assert a loading state.

Assert on what the UI does with the response, not on the request. Checking "fetch was called with X" is an implementation detail; if a request body really matters, have the handler return an error for a wrong body so the test fails through the UI. MSW 3 is ESM-only and needs Node 22 or later. In Playwright, the equivalent boundary tool is `page.route()`.

**Try it:** Take a component test that stubs `globalThis.fetch`. Replace the stub with MSW handlers, then refactor the component to use a different HTTP client or a wrapper function. The MSW version should pass unchanged. Add an error-state test with `server.use`.

**Resources**
- [MSW: Quick start](https://mswjs.io/docs/quick-start)
- [MSW: Avoid request assertions](https://mswjs.io/docs/best-practices/avoid-request-assertions)
- [MSW: Migrating from 2.x to 3.x](https://mswjs.io/docs/migrations/2.x-to-3.x)

### Testing hooks and context

A hook only runs inside a component, so the default way to test one is through a component that uses it. If `useCart` is used by `<CartSummary>`, test `<CartSummary>`: you cover the hook and the rendering together and the test survives if you later inline or split the hook.

Test a hook directly when it is a reusable unit with its own contract (a library hook, or shared logic with many branches). `renderHook` from `@testing-library/react` creates a throwaway component for you:

```tsx
import { act, renderHook } from '@testing-library/react';
import { useCounter } from './useCounter';

test('increments up to the maximum', () => {
  const { result } = renderHook(() => useCounter({ max: 2 }));

  act(() => result.current.increment());
  act(() => result.current.increment());
  act(() => result.current.increment());

  expect(result.current.count).toBe(2);
});
```

Details that matter:

- Always read `result.current` fresh. Destructuring `const { count } = result.current` captures a stale value from the first render.
- Wrap direct calls that update state in `act` so React flushes the update before you assert. For async updates, `await act(async () => { … })` or `await waitFor(() => expect(result.current.status).toBe('done'))`.
- `rerender(newProps)` re-runs the hook with new arguments; `unmount()` lets you assert cleanup, such as a removed event listener.

Context is handled with a wrapper. Hooks and components that need providers (router, query client, theme, auth) should be rendered with the real provider and test-specific values, not with the context module mocked:

```tsx
function renderWithProviders(ui: React.ReactElement, { user = guest } = {}) {
  return render(
    <AuthContext value={user}>
      <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
    </AuthContext>,
  );
}
```

Create stateful clients (query client, store) fresh per test so cache does not leak. `renderHook` takes the same idea through its `wrapper` option. Also test the provider itself through a small consumer: what value does a consumer see, and what happens when it is used outside the provider.

**Try it:** Write a `useLocalStorage(key, initial)` hook. Test it with `renderHook`: initial value, update, persistence across `unmount` and a new `renderHook`, and reaction to a `storage` event. Then write a `renderWithProviders` helper for an app with two providers and use it in one component test.

**Resources**
- [React Testing Library: API (`render`, `renderHook`, `wrapper`)](https://testing-library.com/docs/react-testing-library/api)
- [React: `act`](https://react.dev/reference/react/act)
- [React Testing Library: Setup and custom render](https://testing-library.com/docs/react-testing-library/setup)

### Browser-mode component tests

jsdom is a JavaScript reimplementation of parts of the DOM. It has no layout engine, no real CSS cascade, no painting, and gaps in newer APIs. Tests that depend on visibility, focus behaviour, scrolling, `ResizeObserver`, container queries, `<dialog>`, popovers, or native form validation either cannot be written or pass against behaviour that differs from a browser. Browser-mode tests render the component in a real browser while keeping the fast, isolated, component-level style.

**Vitest browser mode** runs your test files inside the browser, driven by a provider (Playwright or WebdriverIO):

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
```

```tsx
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

test('opens the menu', async () => {
  const screen = await render(<Menu />);
  await screen.getByRole('button', { name: 'Options' }).click();
  await expect.element(screen.getByRole('menu')).toBeVisible();
});
```

Locators and `expect.element` retry automatically, like Playwright's, and clicks are real input events from the automation protocol. In Vitest 5 locators match text exactly by default and a trace view (`browser.traceView`) records DOM snapshots per step. MSW works here through `setupWorker` from `msw/browser`.

**Playwright component testing** was redesigned in 1.62. The experimental per-framework packages are gone; you now write *stories* (named exports in `*.story.tsx` files that render a component in a fixed scenario), serve a gallery page from your own dev server, and call the `mount` fixture from `@playwright/test` with a story ID. The test runs in Node and talks to the page, so callbacks and state live in the story and are observed through the DOM.

The trade-off against jsdom is startup cost and CI setup (browsers must be installed). A common split is pure logic in `node`, most component tests in browser mode, and jsdom kept only where a large existing suite depends on it.

**Try it:** Write a tooltip or dropdown that positions itself and closes on outside click and Escape. Try to test "is visible and not clipped" in jsdom, then move the test to Vitest browser mode and assert with `toBeVisible` and a real click outside. Note what the jsdom version could not express.

**Resources**
- [Vitest: Browser mode](https://vitest.dev/guide/browser/)
- [Vitest: Component testing](https://vitest.dev/guide/browser/component-testing)
- [Playwright: Components](https://playwright.dev/docs/test-components)

### Accessibility assertions

axe-core is a rules engine that inspects a DOM for accessibility failures it can detect mechanically: form controls without labels, images without text alternatives, invalid ARIA attributes and roles, duplicate IDs referenced by ARIA, insufficient colour contrast, missing document language. Running it inside tests turns those into regressions that fail a build.

In a component test:

```tsx
import axe from 'axe-core';

test('signup form has no detectable a11y violations', async () => {
  const { container } = render(<SignupForm />);
  const results = await axe.run(container);
  expect(results.violations).toEqual([]);
});
```

`jest-axe` wraps this in a `toHaveNoViolations` matcher with readable output. In jsdom the `color-contrast` rule cannot work because nothing is painted, so run axe in a real browser when contrast matters. In Playwright, use `@axe-core/playwright`:

```ts
import AxeBuilder from '@axe-core/playwright';

const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
  .analyze();
expect(results.violations).toEqual([]);
```

Things to get right:

- Scan each meaningful state, not just the initial render: with the dialog open, with validation errors showing, with the menu expanded. Violations often exist only in those states.
- When you must suppress a finding, disable the specific rule or exclude the specific element with a comment explaining why. Do not turn off whole categories.
- A component rendered alone will trip page-level rules (landmarks, heading order). Scope the run to the component and keep page-level rules for E2E scans.

Automated rules detect only a minority of accessibility problems. They cannot tell whether alt text is meaningful, whether focus order makes sense, whether a custom widget is operable by keyboard, or whether a live region announces at the right time. Role-based queries, keyboard-driven interaction tests (`user.tab()`, `user.keyboard`), matchers like `toHaveAccessibleName`, and Playwright's `toMatchAriaSnapshot` cover more. Manual testing with a screen reader covers the rest.

**Try it:** Add an axe check to three existing component tests, including one with a modal open. Fix what it finds. Then write a keyboard-only test for the modal (open, Tab cycles inside, Escape closes, focus returns to the trigger), which axe cannot verify.

**Resources**
- [Playwright: Accessibility testing](https://playwright.dev/docs/accessibility-testing)
- [axe-core: API documentation](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md)
- [jest-axe](https://github.com/NickColley/jest-axe)

### Playwright

Playwright drives real browser engines (Chromium, Firefox, WebKit) out of process and comes with its own test runner, assertions, fixtures, and debugging tools. Scaffold with `npm init playwright@latest`, which creates `playwright.config.ts`, an example spec, and optionally a CI workflow.

```ts
import { expect, test } from '@playwright/test';

test('a visitor can add an item to the cart', async ({ page }) => {
  await page.goto('/products/tea');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('link', { name: 'Cart (1)' }).click();

  await expect(page.getByRole('heading', { name: 'Your cart' })).toBeVisible();
  await expect(page.getByRole('row', { name: /tea/i })).toContainText('£8.00');
});
```

The `page` fixture gives each test a fresh browser context: separate cookies, storage, and cache, like a new incognito profile. Set `use.baseURL` in the config so `goto('/…')` works, and use `webServer` to have Playwright start your app and wait for it before the run.

Running and debugging:

- `npx playwright test` runs headless in parallel. Add `--project=chromium`, a file path, `-g "cart"`, `--headed`, or `--last-failed`.
- `npx playwright test --ui` opens UI mode: watch, rerun, and step through each action with DOM snapshots before and after, network, console, and source.
- `npx playwright test --debug` opens the inspector and pauses at each action. `await page.pause()` sets a breakpoint in the test.
- `npx playwright codegen http://localhost:5173` records a session into test code. Treat it as a draft: fix the locators and add assertions.
- `npx playwright show-report` opens the HTML report; failed tests link to their trace.

Write E2E tests as user journeys through the real stack: sign up, search, check out. Keep them few and valuable. Assert with web-first assertions (`await expect(locator).toBeVisible()`, `toHaveText`, `toHaveURL`), which retry until the condition holds; a bare `expect(await locator.textContent())` reads once and races the app. Use `test.step('…', async () => {})` to label phases so reports and traces read as a story.

**Try it:** Install Playwright in a project with a dev server. Configure `webServer` and `baseURL`, write one journey test of five to eight steps, run it in UI mode, and step through the timeline. Then break a selector and use the trace to find the failing action.

**Resources**
- [Playwright: Writing tests](https://playwright.dev/docs/writing-tests)
- [Playwright: UI mode](https://playwright.dev/docs/test-ui-mode)
- [Playwright: Debugging tests](https://playwright.dev/docs/debug)

### Resilient locators

A locator is a description of how to find an element, evaluated fresh every time it is used. It is not a handle to a DOM node, so it cannot go stale when the framework re-renders. Combined with auto-waiting, this removes most of the reasons E2E tests used to need sleeps.

Prefer the user-facing locators, in roughly this order: `getByRole` with a `name`, `getByLabel`, `getByPlaceholder`, `getByText`, `getByAltText`, `getByTitle`, and `getByTestId` as the fallback. CSS and XPath selectors tie the test to DOM structure and class names, which change for reasons users never see.

```ts
const row = page.getByRole('row').filter({ hasText: 'Invoice 1042' });
await row.getByRole('button', { name: 'Download' }).click();

await page.getByRole('listitem')
  .filter({ has: page.getByRole('heading', { name: 'Tea' }) })
  .getByRole('button', { name: 'Add to cart' })
  .click();
```

Locators are **strict**: an action on a locator that matches more than one element throws rather than picking the first. Resolve it by narrowing (chain from a container, `filter`, `{ exact: true }`), not by reaching for `.first()` or `.nth()`, which encode order.

Before each action Playwright runs **actionability checks**: the element must be attached, visible, stable (not animating), able to receive events (not covered by another element), and enabled. It retries until they pass or the timeout expires. Web-first assertions retry the same way. That is why this is wrong:

```ts
await page.waitForTimeout(2000);                  // arbitrary: slow and still flaky
await page.getByRole('button', { name: 'Save' }).click();
```

and this is enough:

```ts
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByRole('status')).toHaveText('Saved');
```

If you feel the need to sleep, find the observable event you are really waiting for: an element appearing, a URL change (`toHaveURL`), a response (`page.waitForResponse`), or a spinner disappearing. `networkidle` is discouraged for the same reason as sleeps. Use `getByTestId` when there is genuinely no accessible handle, and agree a `data-testid` convention with the team.

**Try it:** Open `npx playwright codegen` on a page with a table or repeated cards. Use "Pick locator" on a button inside one row and compare its suggestion to what you would write. Then write a locator for "the delete button in the row for a named item" using `filter`, and confirm it survives reordering the rows.

**Resources**
- [Playwright: Locators](https://playwright.dev/docs/locators)
- [Playwright: Auto-waiting and actionability](https://playwright.dev/docs/actionability)
- [Playwright: Assertions](https://playwright.dev/docs/test-assertions)

### Test data and isolation

An E2E test is independent when it passes alone, in any order, in parallel with every other test, and when run twice in a row. That requires each test to own its data and its browser state.

**Browser state** is isolated for you: every test gets a new `BrowserContext`. The expensive part is logging in, so do it once. The recommended pattern is a setup project that authenticates and saves cookies and storage to a file, which other projects load:

```ts
// tests/auth.setup.ts
import { expect, test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_USER!);
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('link', { name: 'Account' })).toBeVisible();
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

```ts
// playwright.config.ts (excerpt)
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
  },
],
```

Add `playwright/.auth` to `.gitignore`. Logging in through an API request (`request.post`) instead of the UI is faster still. If tests mutate server-side state tied to the account, a shared login is not enough: use one account per worker, keyed on `testInfo.parallelIndex`.

**Server data** is the harder half. Options, from most to least isolated:

- Create what the test needs through the API or a seeding endpoint at the start of the test, with unique names (`crypto.randomUUID()` in the title), and never depend on data another test created.
- Give each worker or each CI run its own database or tenant, reset from a known snapshot.
- Mock the backend at the network with `page.route()`. Fast and deterministic, but it no longer tests the real integration.

Set up state through the fastest route (API, database) and reserve the UI for the behaviour under test. Do not rely on cleanup in `afterEach` for correctness, because a crashed test skips it; design so leftover data is harmless. Avoid `test.describe.serial`: tests that must run in order are one test, or a design problem. Wrap shared setup in fixtures (`test.extend`) so each test declares what it needs.

**Try it:** Add a setup project with `storageState` to a Playwright suite. Then write two tests that each create their own record via the API with a unique name, and run them with `--workers=4 --repeat-each=5`. If anything fails, find the shared state.

**Resources**
- [Playwright: Authentication](https://playwright.dev/docs/auth)
- [Playwright: Fixtures](https://playwright.dev/docs/test-fixtures)
- [Playwright: Isolation](https://playwright.dev/docs/browser-contexts)

### Flakiness

A flaky test passes and fails on the same code. It is a real defect, in the test or in the app, and the cost compounds: people rerun instead of reading failures, then stop trusting red builds at all.

The usual causes, roughly by frequency:

- **Racing the app.** Acting before hydration has attached handlers, asserting a one-shot value (`expect(await locator.isVisible())`), reading a count before the list has loaded.
- **Shared state.** Tests that depend on order, a shared account, a shared database row, or leftover data from a previous run.
- **Time and randomness.** Tests that fail near midnight, at month end, in another time zone, or on an unlucky random ID.
- **Environment.** Slower CI machines, animation timing, fonts loading late, third-party scripts, real network calls.
- **Real application bugs.** A genuine race condition in the product that only sometimes loses.

Diagnose with evidence. Configure `trace: 'on-first-retry'` (or `'retain-on-failure'`) and open the failing trace from the CI report: the timeline shows the DOM before and after each action, the network log, console output, and exactly which actionability check was waiting. Reproduce locally with `npx playwright test path --repeat-each=50 --workers=4`, and add CPU throttling or run headed to shake out timing.

Fix the cause:

- Replace one-shot checks and sleeps with web-first assertions and locator actions.
- Wait for an app-ready signal before interacting if hydration is the problem (an assertion on something only present when interactive).
- Register `page.waitForResponse()` before the triggering action.
- Control time with `page.clock`, and mock or block third-party hosts with `page.route()`.
- Give each test its own data.

Retries are a containment tool. `retries: process.env.CI ? 2 : 0` keeps the pipeline usable, and Playwright labels a test that passed on retry as "flaky" in the report. Track that list. `failOnFlakyTests` (or `--fail-on-flaky-tests`) makes flaky results fail the run, and `retryStrategy: 'isolated'` runs retries after everything else so load from parallel tests is ruled out. If a test cannot be fixed now, mark it with `test.fixme` and a linked issue so it is visible, not silently retried. Vitest has `retry` too, and the same reasoning applies.

**Try it:** Write a deliberately flaky test: click a button whose handler is attached 200 ms after load, with no wait. Run it with `--repeat-each=30` to see it fail intermittently, capture a trace, find the moment of the lost click in the timeline, and fix it without a sleep.

**Resources**
- [Playwright: Retries](https://playwright.dev/docs/test-retries)
- [Playwright: Trace viewer](https://playwright.dev/docs/trace-viewer)
- [Martin Fowler: Eradicating Non-Determinism in Tests](https://martinfowler.com/articles/nonDeterminism.html)

### Visual regression

Visual regression testing compares a screenshot against a stored baseline and fails when they differ. It catches what DOM assertions cannot: a broken layout, an overlapping element, a wrong colour, a missing icon, a CSS change that leaked into another page.

```ts
test('pricing page', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page).toHaveScreenshot('pricing.png', {
    fullPage: true,
    mask: [page.getByTestId('promo-countdown')],
    maxDiffPixelRatio: 0.01,
  });
});
```

The first run writes the baseline and fails; later runs compare. Playwright takes screenshots repeatedly until two consecutive ones match, disables CSS animations and hides the caret by default, then diffs with pixelmatch. `threshold` (default 0.2) is the per-pixel colour tolerance; `maxDiffPixels` and `maxDiffPixelRatio` set how many differing pixels are allowed and default to none. Set shared defaults under `expect.toHaveScreenshot` in the config.

The hard part is determinism. Rendering differs by operating system, browser version, GPU, and font stack, so a baseline made on macOS will not match Linux CI. Baseline file names include the browser and platform for this reason. The workable approach is to generate and compare baselines in one environment only, normally the official Playwright Docker image, both in CI and when updating locally.

Then remove variance in the page itself:

- Mask or hide dynamic regions (dates, avatars, ads) with `mask` or a `stylePath` stylesheet.
- Freeze time with `page.clock`, seed data, and mock the network.
- Wait for web fonts (`await page.evaluate(() => document.fonts.ready)`) and for images to load.
- Fix the viewport and device scale factor.

Sensible thresholds are small. A tolerance wide enough to hide anti-aliasing noise is fine; one wide enough to stop the test failing is hiding regressions. Prefer component-level screenshots (`expect(locator).toHaveScreenshot()`) over full pages: smaller images change for fewer reasons and diffs are easier to review.

Update baselines deliberately with `npx playwright test --update-snapshots` and review the image diffs in the pull request like code. Vitest browser mode has an equivalent `toMatchScreenshot` assertion for component-level checks.

**Try it:** Add `toHaveScreenshot` for one page and one component. Change a padding value and study the three-way diff in the HTML report. Then add a live timestamp to the page, watch the test flake, and stabilise it with `mask` and `page.clock`.

**Resources**
- [Playwright: Visual comparisons](https://playwright.dev/docs/test-snapshots)
- [Playwright: Docker](https://playwright.dev/docs/docker)
- [Vitest: Visual regression testing](https://vitest.dev/guide/browser/visual-regression-testing)

### Cross-browser and mobile

Browser engines differ in ways that matter: date and number input behaviour, focus on click (Safari does not focus buttons), scroll and overflow details, flexbox and grid edge cases, media codecs, and which newer APIs exist. Playwright runs the same tests against three engines through **projects**:

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 15'] } },
  ],
});
```

Install the engines with `npx playwright install --with-deps` and run one with `--project=webkit`. A device profile sets viewport, device scale factor, user agent, and the `isMobile` and `hasTouch` flags, so media queries, touch events, and mobile layouts are exercised. Context options also emulate locale, time zone, geolocation, permissions, colour scheme, and reduced motion.

Know the limits of what you are testing:

- Playwright's WebKit is the engine behind Safari built for Linux, Windows, and macOS, not Safari itself. It catches most engine-level differences but not everything tied to iOS: the dynamic toolbar and viewport units, the on-screen keyboard, safe-area insets, and some media and PWA behaviour.
- Mobile profiles are emulation on a desktop engine. They do not reproduce real device performance, memory limits, or mobile browser chrome.
- The `chromium` project runs Chrome for Testing builds. Use `channel: 'chrome'` or `'msedge'` to run against the installed branded browser when policies or codecs matter.

So keep a short manual pass on real devices, or a cloud device service, for the flows that carry the most risk.

Running every test on five projects multiplies CI time. A common compromise is the full suite on Chromium for every pull request, a tagged smoke subset (`--grep @smoke`) on Firefox, WebKit, and one mobile profile, and the full matrix nightly. When a test fails only in one engine, treat it as a product bug first; use `test.skip(({ browserName }) => browserName === 'webkit', 'reason')` only with a linked issue.

**Try it:** Enable all five projects above and run your suite. For each engine-specific failure, decide whether it is a real cross-browser bug or a test assumption. Then tag three tests `@smoke` and configure the non-Chromium projects to run only those.

**Resources**
- [Playwright: Projects](https://playwright.dev/docs/test-projects)
- [Playwright: Emulation](https://playwright.dev/docs/emulation)
- [Playwright: Browsers](https://playwright.dev/docs/browsers)

### Tests in CI

Tests that only run on laptops protect nothing. CI runs them on a clean machine for every pull request and blocks the merge when they fail. The pipeline's job is fast, trustworthy feedback, so order the stages by cost: type check and lint first, then unit and component tests, then E2E.

A minimal GitHub Actions job for Playwright:

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --shard=${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report
```

**Parallelism** happens at two levels. Within a machine, both Vitest and Playwright run test files in parallel workers; Playwright's `fullyParallel: true` also parallelises tests within a file. Across machines, **sharding** splits the suite: `--shard=2/4` runs the second quarter. Playwright shards by file unless `fullyParallel` is on, so uneven files give uneven shards. Use the `blob` reporter on shards and a final job that runs `npx playwright merge-reports --reporter html ./all-blob-reports` to produce one report. Vitest supports the same flow with `--shard`, `--reporter=blob`, and `--merge-reports`.

**Reporting** decides whether failures get fixed. Upload the HTML report and traces as artifacts even when the job fails. Emit JUnit XML if your CI displays test results, and use the GitHub reporter for inline annotations (Vitest enables it automatically in Actions).

Configuration worth having: `forbidOnly: !!process.env.CI`, `retries` only in CI, `trace: 'on-first-retry'`, dependency caching, and a per-job timeout so a hung browser cannot burn an hour. Keep the pull-request suite under about ten minutes; when it grows, shard further, run only tests affected by the change (`vitest --changed`, `playwright test --only-changed=origin/main`), and move the long tail to a nightly run. Make the checks required in branch protection, or they are advisory.

**Try it:** Set up a workflow that runs lint, type check, Vitest, and Playwright on pull requests. Shard Playwright across two jobs, merge the blob reports, and upload the result. Push a failing test and confirm you can diagnose it from the artifact alone, without rerunning locally.

**Resources**
- [Playwright: Setting up CI](https://playwright.dev/docs/ci-intro)
- [Playwright: Sharding](https://playwright.dev/docs/test-sharding)
- [Vitest: Reporters](https://vitest.dev/guide/reporters)

### Coverage

Coverage measures which code ran while the tests executed. It reports four numbers: **statements**, **branches** (each side of every `if`, ternary, `??`, and `&&`), **functions**, and **lines**. Branch coverage is the most informative, because a line can be "covered" while one of its conditions is never false.

Coverage tells you what is *not* tested. It says nothing about whether what ran was checked:

```ts
test('checkout', () => {
  checkout(cart); // executes 80 lines, asserts nothing
});
```

That test yields high coverage and catches nothing. So use the report as a flashlight: open the HTML output, sort by uncovered branches, and look for unexercised error handling, empty states, and permission checks in code that matters. Then decide whether each gap is worth a test.

Turning the number into a target invites gaming (Goodhart's law). A mandated 90% produces assertion-free tests and tests of trivial code, while the hard, risky paths stay uncovered because they are hard. Thresholds are still useful as a ratchet against regression: set them at or just below the current level so coverage cannot silently drop, and consider enforcing coverage on changed lines in a pull request instead of a global figure.

In Vitest, `vitest run --coverage` uses the V8 provider by default (install `@vitest/coverage-v8`); it collects from the engine and remaps through the AST, so results are comparable to Istanbul's instrumentation at lower cost. Two configuration points matter:

```ts
coverage: {
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['**/*.stories.tsx', 'src/generated/**'],
  thresholds: { branches: 80, lines: 85 },
}
```

Without `include`, only files imported by some test appear, so a module with no tests at all is invisible and the percentage is inflated. Exclude generated code and stories so the number reflects code you maintain. Use ignore comments (`/* v8 ignore next */`) sparingly and with a reason.

To measure whether tests actually detect faults, not just execute code, see Mutation testing.

**Try it:** Generate an HTML coverage report with `coverage.include` set. Find a file over 90% lines but with an uncovered branch, and write the test for that branch. Then write a test with no assertions and observe that coverage rises anyway.

**Resources**
- [Vitest: Coverage](https://vitest.dev/guide/coverage)
- [Martin Fowler: Test Coverage](https://martinfowler.com/bliki/TestCoverage.html)

### Mutation testing

Coverage tells you which code ran. Mutation testing tells you whether your tests would notice if that code were wrong. A mutation tool makes one small change to the source (a **mutant**), runs the tests that cover it, and records the result. If a test fails, the mutant is **killed**. If every test still passes, it **survived**: the suite cannot tell the broken code from the real code.

```ts
export function canCheckout(cart: Cart) {
  return cart.items.length > 0 && cart.total >= MIN_ORDER;
}
```

Typical mutants here: `> 0` becomes `>= 0`, `>=` becomes `>`, `&&` becomes `||`, and the whole expression becomes `true`. If your only test is "a full cart can check out", all four survive, even with 100% coverage. Killing them requires tests at the boundaries: an empty cart, and a total exactly at and just below the minimum.

StrykerJS is the standard tool for JavaScript and TypeScript:

```json
{
  "testRunner": "vitest",
  "mutate": ["src/pricing/**/*.ts", "!src/**/*.test.ts"],
  "reporters": ["html", "clear-text", "progress"],
  "thresholds": { "high": 80, "low": 60, "break": 50 }
}
```

Install `@stryker-mutator/core` and `@stryker-mutator/vitest-runner`, save that as `stryker.config.json`, and run `npx stryker run`. The HTML report shows each mutant in place with its status. The **mutation score** is detected mutants (killed plus timed out) divided by valid mutants. "No coverage" mutants are code no test executes at all.

How to use it sensibly:

- It is expensive: every mutant means a test run. Stryker only runs the tests that cover each mutant, but you should still scope `mutate` to modules where correctness matters (pricing, permissions, parsing) and use `--incremental` to reuse earlier results. Run it nightly or on changed files, not on every push.
- It works on fast unit tests. The Vitest runner does not support browser mode, and running E2E tests per mutant is impractical.
- Read survivors individually. Some are **equivalent mutants** that change nothing observable (`i < length` to `i !== length` in a simple loop); ignore those. Others point at a missing assertion or a missing boundary case, and those are the payoff.
- Do not chase 100%. As with coverage, the score is a guide to where tests are weak, and `thresholds.break` is best used as a ratchet.

A surviving mutant in code you believed was well tested is one of the most instructive things you can see about your own tests.

**Try it:** Run Stryker on one pure-logic module that has high coverage. Pick three surviving mutants, write the test that kills each, and rerun. Note which survivors were equivalent and which revealed a missing boundary test.

**Resources**
- [Stryker Mutator: StrykerJS introduction](https://stryker-mutator.io/docs/stryker-js/introduction/)
- [Stryker Mutator: Vitest runner](https://stryker-mutator.io/docs/stryker-js/vitest-runner/)
- [Stryker Mutator: Mutant states and metrics](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/)

### TDD

Test-driven development is a loop of three steps. **Red**: write one small test for behaviour that does not exist yet and watch it fail for the expected reason. **Green**: write the simplest code that makes it pass, even if it is crude. **Refactor**: with the tests green, clean up names, duplication, and structure, in both the code and the tests. Then pick the next behaviour.

Each step has a purpose that is easy to skip. Seeing red proves the test can fail and that the failure message is useful. Going green with the minimum stops you building things no test demands. Refactoring is where the design improves, and it is the step most often dropped, leaving a pile of passing but messy code.

Kent Beck's description starts one step earlier: write a list of the test scenarios you can think of, then turn them into tests one at a time, adding to the list as you learn. Writing all the tests up front is not TDD and removes the feedback.

TDD pays off when:

- The inputs and outputs are clear: parsers, validators, reducers, pricing rules, state machines.
- You are fixing a bug. Write the failing test that reproduces it first; it proves the fix and prevents the regression.
- The logic has many edge cases you would otherwise forget.
- You are designing an API and want to feel what calling it is like.

It helps less when you do not yet know what you are building: exploratory UI work, visual design, or a spike against an unfamiliar API. There, prototype first, then either throw the spike away and rebuild test-first or add tests once the shape settles. For components, a workable middle path is to test-drive behaviour (what happens on submit, which states exist) and leave layout to visual review.

Keep the steps small. If you are red for more than a few minutes, the step was too big: revert and choose a smaller test. TDD is a skill you should practise enough to use by choice, not a rule to apply everywhere.

**Try it:** Do the string calculator kata test-first: `add('')` returns 0, `add('1,2')` returns 3, then newlines as separators, then custom delimiters, then negatives throw. Commit after each green and each refactor. Review the history: were the steps small, and did you refactor?

**Resources**
- [Kent Beck: Canon TDD](https://tidyfirst.substack.com/p/canon-tdd)
- [Martin Fowler: Test Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

### Contract testing

Frontend tests that mock the API pass as long as the mock is right. When the backend renames `fullName` to `name`, the mocks do not change, every test stays green, and production breaks. Contract testing closes that gap by checking both sides against one shared description of the interface.

There are two main approaches.

**Schema-first (provider-driven).** The API publishes a machine-readable schema, usually OpenAPI or GraphQL. The frontend generates types from it (for example `openapi-typescript`), so a field rename becomes a compile error. Mocks are typed against the same schema, so an out-of-date MSW handler fails type checking. CI on the backend diffs the schema against the previous version and flags breaking changes. This is cheap, and for most teams it is where to start. Its weakness is that a schema says what the API *can* return, not what consumers actually depend on.

**Consumer-driven contracts (Pact).** The frontend's tests run against a Pact mock server and record every interaction they rely on: this request, with this state, expects a response of this shape. That record (the pact file) is published to a broker. The backend's CI replays each interaction against the real provider and fails if a response no longer satisfies it. `can-i-deploy` then checks whether a given version of either side is compatible with what is deployed. This catches breaking changes before deploy and tells the backend exactly which consumers a change would break, at the cost of more infrastructure and cooperation between teams.

Complementary practices:

- Validate responses at runtime with a schema (Zod or similar) at the fetch boundary, so drift fails loudly in one place instead of as `undefined` deep in a component.
- Keep one set of MSW handlers, typed from the schema, shared between tests and development.
- Version the API or make changes additive: add the new field, migrate consumers, then remove the old one.

Contract tests verify shape and semantics of individual interactions. They do not replace a few E2E tests that prove the deployed systems work together.

**Try it:** Take an OpenAPI document (your own or a public one), generate TypeScript types with `openapi-typescript`, and type both your fetch wrapper and your MSW handlers with them. Rename a field in the schema, regenerate, and count how many places the compiler now flags.

**Resources**
- [Pact: How Pact works](https://docs.pact.io/getting_started/how_pact_works)
- [OpenAPI TypeScript: Introduction](https://openapi-ts.dev/introduction)
- [Martin Fowler: Contract Test](https://martinfowler.com/bliki/ContractTest.html)

### Testing strategy document

A testing strategy is a short document, one or two pages, that tells the team what gets tested at which level and why. Without one, each engineer decides alone, and you get duplicated coverage in some places, none in others, and arguments in code review.

A useful document covers:

1. **Risks.** What would hurt most if it broke: payments, sign-in, data loss, accessibility obligations, the top three user journeys. This drives everything else.
2. **Levels and what belongs at each.** A table is clearest:

| Level | Tool | What goes here | What does not |
| --- | --- | --- | --- |
| Static | TypeScript, ESLint | Types, hook rules, a11y lint | Runtime behaviour |
| Unit | Vitest (node) | Pure logic with branches: pricing, validation, reducers | Rendering |
| Component | Vitest browser mode, Testing Library, MSW | Feature behaviour, all UI states, keyboard paths, axe | Cross-page flows |
| E2E | Playwright | Five to fifteen critical journeys on the real stack | Edge cases and validation rules |
| Visual | Playwright screenshots | Design-system components, key pages | Anything with live data |

3. **Conventions.** File naming and location, query priority, how the network is mocked, how test data and auth are created, what is never mocked.
4. **CI policy.** What runs on each pull request and what runs nightly, time budgets, the retry policy, what happens to flaky tests (quarantine with an owner and deadline), and coverage thresholds if any.
5. **Definition of done.** For example: new logic has unit tests, new UI states have component tests, a new critical journey has one E2E test, bug fixes come with a regression test.
6. **What is deliberately not tested**, and what covers that risk instead (monitoring, feature flags, manual exploratory testing before releases).

Keep it grounded in the actual app, with links to one exemplary test per level so people can copy the pattern. Review it when the architecture or the incident history changes. The test for the document itself: a new team member can read it and correctly decide where a test for their first feature should go.

**Try it:** Write this document for a real app in under two pages. Then take the last five bugs from its issue tracker and check, for each, whether your strategy would have caught it and at which level. Revise the strategy where it would not.

**Resources**
- [web.dev: Pyramid or Crab? Find a testing strategy that fits](https://web.dev/articles/ta-strategies)
- [Martin Fowler: The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Kent C. Dodds: Static vs Unit vs Integration vs E2E Testing for Frontend Apps](https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-tests)

### Retrofit tests

Adding tests to code that has none is a different skill from writing them alongside new code. The code was not designed to be tested, you are not sure what it is supposed to do, and you cannot safely refactor it to make it testable because there are no tests. Work from the outside in.

1. **Set up the tools and CI first.** Vitest, Testing Library, MSW, Playwright, and a pipeline that runs them. One trivial passing test per level proves the plumbing.
2. **Write E2E tests for the two or three critical journeys.** They need no changes to the code and give you a safety net for everything that follows.
3. **Add characterization tests.** For a tangled module, write tests that pin down what it does *now*, including behaviour that looks odd. Call it with representative inputs, record the outputs, and assert them. The goal is to detect change, not to judge correctness. If you find a bug, note it and fix it separately.
4. **Extract and unit test logic.** With the net in place, pull pure logic out of components and effects (price calculations, validation, data mapping) into functions and cover them with table-driven tests. This is the refactor the earlier tests make safe.
5. **Add component tests for the stateful UI**, covering loading, error, and empty states with MSW. Use role queries; expect to fix missing labels and non-semantic markup as you go.
6. **Enforce the ratchet.** Record current coverage as a threshold so it cannot drop, and adopt a rule that every bug fix starts with a failing test.

Prioritise by risk and churn: the files that change most often and matter most (check `git log --format= --name-only | sort | uniq -c | sort -rn | head`). Do not aim for a coverage number across the whole codebase, and do not write tests that merely mirror the implementation to make the number move.

Resist rewriting. Where the code resists testing because of a hidden dependency (a global, `Date.now()`, a module-level singleton), introduce the smallest seam that lets you substitute it, such as a parameter with a default value.

**Try it:** Choose an earlier project of yours. Add CI, two Playwright journeys, table-driven unit tests for one extracted piece of logic, and component tests for one stateful component with all its states. Then make a real refactor and note which tests gave you confidence and which got in the way.

**Resources**
- [Kent C. Dodds: How to know what to test](https://kentcdodds.com/blog/how-to-know-what-to-test)
- [Vitest: Getting started](https://vitest.dev/guide/)
- [Playwright: Installation](https://playwright.dev/docs/intro)

### TDD kata

A kata is a small, well-defined exercise repeated to practise technique, here the red-green-refactor rhythm. The problem is deliberately easy so your attention goes to the process: step size, naming, when to generalise, when to refactor.

For frontend work, pick a feature with real logic and a UI on top. Good candidates: a tag input (add on Enter or comma, no duplicates, remove with Backspace, maximum count), a password strength meter, a shopping cart with quantity limits and a coupon, or a search box with debounce and keyboard-navigable results.

How to run it:

1. **Write the test list first.** Plain sentences describing behaviours, simplest first: "starts empty", "adds a tag on Enter", "ignores an empty tag", "rejects a duplicate, case-insensitively". Add to the list as new cases occur to you; do not write the tests yet.
2. **Take one item. Write the test. See it fail** with the message you expect. A test that fails with a typo or import error has not gone red properly.
3. **Make it pass with the least code.** Returning a constant is legitimate for the first test; the next test forces the generalisation.
4. **Refactor on green**, both production and test code. Extract the pure logic (a `tagsReducer`) from the component when it emerges, and move the detailed cases down to fast unit tests while a few component tests cover the wiring.
5. **Commit after each green and each refactor.** If you get stuck red, `git reset --hard` and take a smaller step.

Test-drive the component through Testing Library and user-event, not through its internals, so the tests you end with are the tests you would want anyway. Include the keyboard and error paths in your list from the start.

Afterwards, review: read the commit log as a story, check that every test failed before it passed, and look for behaviour in the code that no test demanded. Repeat the same kata a week later and aim for smaller steps; the point is fluency, and the second run is where you notice your habits.

**Try it:** Build the tag input test-first within a 60-minute limit, committing at every green. Finish with a full run of the suite in random order and one deliberate bug per behaviour to confirm each test catches it.

**Resources**
- [Kent Beck: Canon TDD](https://tidyfirst.substack.com/p/canon-tdd)
- [Testing Library: user-event introduction](https://testing-library.com/docs/user-event/intro)
- [Vitest: Test API](https://vitest.dev/api/)
