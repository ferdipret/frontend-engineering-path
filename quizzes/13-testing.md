# Testing: Practice test

### 1. Which statement best describes when a test is worth writing?

- [ ] Whenever a line of code is not yet covered, because uncovered code is untested code
- [ ] Only for pure functions, because UI tests are always brittle
- [x] When the cost of the bugs it prevents and the speed it adds to changes exceed the cost of writing and maintaining it
- [ ] Only after a bug has been reported, because predicting bugs is guesswork

> Tests are an investment with a maintenance cost. Risky, frequently changed code repays it; trivial code often does not. Chasing uncovered lines treats coverage as the goal, and UI tests written against behaviour with role queries are not inherently brittle.

### 2. In the testing trophy, which layer is the largest, and why?

- [ ] Unit tests, because they are the fastest to run
- [x] Integration tests, because most frontend bugs occur where components, state, and the network meet, and these tests are now fast enough to write in bulk
- [ ] End-to-end tests, because they give the most confidence per test
- [ ] Static analysis, because it needs no test code

> The trophy puts the bulk of effort into integration tests: several real components rendered together with the network mocked. Unit tests dominate the pyramid, not the trophy. E2E tests give high confidence each but are slow and costly, so both models keep them few. Static analysis is the base of the trophy but is not "the largest layer of tests".

### 3. A component test contains this assertion. What is wrong with it?

```tsx
render(<Banner />);
expect(screen.getByText('Offer expired')).not.toBeInTheDocument();
```

- [ ] `toBeInTheDocument` cannot be negated
- [ ] `getByText` is asynchronous and must be awaited
- [ ] Nothing; it passes when the text is absent
- [x] `getByText` throws when there is no match, so the test fails exactly when the text is absent

> `getBy*` queries throw if nothing matches, so the assertion can never pass in the case it is trying to check. Use `expect(screen.queryByText('Offer expired')).not.toBeInTheDocument()`; `queryBy*` returns `null` for no match.

### 4. Which query should you try first for a submit button labelled "Save"?

- [x] `screen.getByRole('button', { name: 'Save' })`
- [ ] `screen.getByTestId('save-button')`
- [ ] `container.querySelector('button.save')`
- [ ] `screen.getByText('Save')`

> `getByRole` with an accessible name matches how assistive technology and users identify the control, and it fails if the element is not really a button or has no accessible name. `getByText` would also match a heading or paragraph containing "Save". Test IDs and CSS selectors say nothing about accessibility and couple the test to markup.

### 5. What does this test report when `fetchUser` resolves with `{ name: 'Grace' }`?

```ts
test('loads the user', () => {
  fetchUser(1).then((user) => {
    expect(user.name).toBe('Ada');
  });
});
```

- [ ] It fails with "expected 'Grace' to be 'Ada'"
- [x] It passes, because the test function returns before the promise callback runs
- [ ] It times out waiting for the promise
- [ ] It fails because `test` callbacks must be `async`

> The test function returns `undefined` synchronously, so the runner marks it passed. The assertion runs later and its failure surfaces, at best, as an unhandled rejection attributed to the run. Return or `await` the promise. The typescript-eslint rule `no-floating-promises` catches this.

### 6. What is the difference between `toBe` and `toEqual`?

- [ ] `toBe` is for numbers and `toEqual` is for strings
- [ ] `toEqual` checks reference identity; `toBe` compares recursively
- [x] `toBe` compares with `Object.is` (identity); `toEqual` recursively compares structure
- [ ] They are aliases; `toEqual` exists only for Jest compatibility

> `expect({ a: 1 }).toBe({ a: 1 })` fails because they are two different objects, while `toEqual` passes because the contents match. `toStrictEqual` is stricter again: it also distinguishes `undefined` properties and class types.

### 7. A debounced search is tested like this. Why does the last assertion fail?

```ts
vi.useFakeTimers();
const onSearch = vi.fn(async (q: string) => { await save(q); });
const debounced = debounce(onSearch, 300);
const saved = vi.fn();

debounced('tea').then(saved); // debounce returns a promise for the result
vi.advanceTimersByTime(300);

expect(onSearch).toHaveBeenCalledWith('tea'); // passes
expect(saved).toHaveBeenCalled();             // fails
```

- [ ] `advanceTimersByTime` must be called with 301, not 300
- [ ] Fake timers do not work with `vi.fn`
- [ ] `debounce` cannot be used with fake timers
- [x] Advancing timers runs the timer callback synchronously but does not flush the promise continuations that follow it

> The timer fires and `onSearch` is called, but `.then(saved)` runs in a later microtask, and the test asserts before yielding. Use `await vi.advanceTimersByTimeAsync(300)`, which lets promise callbacks run between and after timers.

### 8. Why is mocking at the network level with MSW generally preferred over `vi.fn()` on `fetch`?

- [ ] MSW is faster because it skips the request entirely
- [x] Tests stay valid when you change how requests are made, and the code runs against real `Request`/`Response` behaviour
- [ ] `fetch` cannot be replaced in Node
- [ ] MSW automatically validates responses against your OpenAPI schema

> Stubbing `fetch` couples tests to the HTTP client and call shape, so swapping to another client or adding a wrapper breaks them, and hand-written stubs often omit `ok`, headers, or streaming behaviour. MSW intercepts real requests, so only the boundary is faked. It does not validate against a schema by itself.

### 9. In Vitest 5 with default settings, what does the second test see?

```ts
const send = vi.fn().mockReturnValue('ok');

test('first', () => {
  send('a');
  expect(send).toHaveBeenCalledTimes(1);
});

test('second', () => {
  expect(send).toHaveBeenCalledTimes(0);
  expect(send('b')).toBe('ok');
});
```

- [ ] The first assertion fails: the call from the first test is still recorded
- [ ] The second assertion fails: the return value was reset to `undefined`
- [x] Both assertions pass: call history is cleared between tests but the implementation is kept
- [ ] Both fail: mocks defined at module scope are recreated for each test

> Vitest 5 defaults `clearMocks` to `true`, which calls `mockClear` on every mock before each test. That wipes call history only. `mockReset` would also drop the `mockReturnValue`, and `mockRestore` applies to `vi.spyOn` spies. In Jest and in Vitest 4 the default is to clear nothing, so the first assertion would fail there.

### 10. Which of these tests is coupled to implementation details?

- [ ] It types into the field labelled "Email", clicks "Sign up", and expects a "Check your inbox" message
- [ ] It renders a list with an empty array and expects the text "No results"
- [ ] It calls a reducer with an `add` action and expects the returned state to contain the item
- [x] It asserts that the component's `setIsOpen` state setter was called with `true` after a click

> Asserting that a state setter was called checks how the component works, not what it does. It breaks when you move to `useReducer` and stays green if the rendered output is wrong. The other three exercise inputs and observable outputs.

### 11. A team's component tests are mostly `expect(container).toMatchSnapshot()`. Reviewers approve snapshot updates without reading them. What is the best improvement?

- [ ] Commit the `.snap` files to a separate repository so they do not clutter pull requests
- [ ] Run `vitest -u` in CI so snapshots never fail
- [x] Replace them with targeted assertions, small inline snapshots of meaningful output, and ARIA snapshots for structure
- [ ] Switch to `toStrictEqual` against a hand-written copy of the full DOM

> Whole-tree snapshots fail on any markup change and produce diffs too large to review, so approval becomes a reflex and the tests stop protecting anything. Scoping fixes this: assert the few things that matter, keep snapshots small and inline where a reviewer sees them, and use ARIA snapshots, which record roles and names and ignore tags and classes. Auto-updating in CI removes the check entirely.

### 12. In Playwright, why is the first form unreliable?

```ts
// A
expect(await page.getByRole('alert').isVisible()).toBe(true);

// B
await expect(page.getByRole('alert')).toBeVisible();
```

- [x] A reads visibility once at that instant; B retries until the alert is visible or the timeout expires
- [ ] A is fine; B is deprecated
- [ ] A throws if the alert is not attached; B does not
- [ ] B only works in Chromium

> `isVisible()` returns the current state immediately, so A races the application. Web-first assertions like `toBeVisible()` poll the locator until the condition holds. This one-shot pattern is among the most common sources of flaky E2E tests.

### 13. A click on `page.getByRole('button', { name: 'Delete' })` throws a strict mode violation. What is the right fix?

- [ ] Add `.first()` so Playwright picks one
- [ ] Add `await page.waitForTimeout(500)` before the click
- [x] Narrow the locator to the intended element, for example by chaining from the specific row or using `filter`
- [ ] Set `strict: false` globally in the config

> Strictness means the locator matched several elements, so the test is ambiguous about which one the user would click. Scope it: `page.getByRole('row').filter({ hasText: 'Invoice 1042' }).getByRole('button', { name: 'Delete' })`. `.first()` encodes DOM order and will silently click the wrong one when order changes.

### 14. What does a coverage report showing 95% line coverage tell you?

- [ ] 95% of the behaviour is verified by assertions
- [ ] At most 5% of the code can contain bugs
- [ ] The suite would catch 95% of injected faults
- [x] 95% of lines executed during the test run; it does not say whether the results were checked

> Coverage records execution only. A test with no assertions still covers every line it runs. The useful information is the uncovered 5% and, more so, the uncovered branches. Mutation testing is the tool that estimates how many faults the suite would actually detect.

### 15. A function has 100% line and branch coverage from this test. Which mutant would survive a mutation testing run?

```ts
export const isAdult = (age: number) => age >= 18;

test('isAdult', () => {
  expect(isAdult(30)).toBe(true);
  expect(isAdult(5)).toBe(false);
});
```

- [ ] None; full coverage means every mutant is killed
- [ ] Replacing the body with `true`
- [ ] Replacing `>=` with `<`
- [x] Replacing `>=` with `>`, because no test uses the boundary value 18

> With `age > 18`, both 30 and 5 still give the same results, so every test passes and the mutant survives. It reveals a missing boundary test: `isAdult(18)` should be `true` and `isAdult(17)` should be `false`. The `true` mutant is killed by the `5` case and the `<` mutant by both. Coverage only shows the line ran; mutation testing shows whether an error in it would be noticed.

### 16. Your visual regression tests pass on your Mac but fail in Linux CI with small diffs on all text. What is the best fix?

- [ ] Raise `maxDiffPixelRatio` until CI passes
- [x] Generate and compare baselines in one consistent environment, such as the Playwright Docker image, locally and in CI
- [ ] Switch from PNG to JPEG baselines
- [ ] Disable anti-aliasing with a CSS override

> Font rendering and anti-aliasing differ between operating systems, so cross-platform baselines never match exactly. Playwright even includes the platform in baseline file names. Raising the threshold until it passes hides real regressions. Produce baselines in the same container image that CI uses.

### 17. With a Playwright setup project that saves `storageState`, what do the dependent tests gain?

- [ ] They share one browser context, so they run faster
- [ ] They share one page, so navigation state carries over between tests
- [x] Each test still gets a fresh context, pre-loaded with the saved cookies and storage, so no test repeats the login flow
- [ ] They are forced to run serially after the setup test

> `storageState` seeds every new context with saved cookies and local storage. Isolation is preserved because each test has its own context; only the expensive login is done once. Tests still run in parallel. If tests modify server-side state tied to the account, use one account per worker.

### 18. This test intermittently fails with "not wrapped in act(...)" warnings. Find the bug.

```tsx
test('saves the form', () => {
  const user = userEvent.setup();
  render(<ProfileForm />);
  user.type(screen.getByLabelText('Name'), 'Ada');
  user.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByText('Saved')).toBeInTheDocument();
});
```

> user-event methods are async and none of them is awaited, so the click may start before typing finishes and the assertion runs before either completes; state updates then land after the test has moved on, which is what the act warning reports. Make the test `async`, `await` both interactions, and wait for the result: `expect(await screen.findByText('Saved')).toBeInTheDocument()`, because saving is presumably asynchronous too.
>
> ```tsx
> test('saves the form', async () => {
>   const user = userEvent.setup();
>   render(<ProfileForm />);
>   await user.type(screen.getByLabelText('Name'), 'Ada');
>   await user.click(screen.getByRole('button', { name: 'Save' }));
>   expect(await screen.findByText('Saved')).toBeInTheDocument();
> });
> ```

### 19. Explain the difference between a stub, a spy, a mock, and a fake, and say which you would use to replace a REST API in component tests.

> A stub returns canned answers and has no opinion about how it is called. A spy records calls (arguments, count), often while delegating to the real implementation. A mock is a double whose expected calls are part of the test's pass condition. A fake is a working but simplified implementation, such as an in-memory store.
>
> For a REST API in component tests, use a fake at the network boundary: MSW handlers that respond like the server. The component's real fetching code runs, tests assert on what the UI shows, and nothing depends on which HTTP client is used. Assertions about calls (mock-style) are reserved for genuine side effects with no visible result, such as analytics.

### 20. Write a table-driven Vitest test for `clamp(value, min, max)`, choosing rows that cover the boundaries.

> ```ts
> import { expect, test } from 'vitest';
> import { clamp } from './clamp';
>
> test.each([
>   { value: 5, min: 0, max: 10, expected: 5 },    // inside
>   { value: 0, min: 0, max: 10, expected: 0 },    // on lower bound
>   { value: 10, min: 0, max: 10, expected: 10 },  // on upper bound
>   { value: -1, min: 0, max: 10, expected: 0 },   // just below
>   { value: 11, min: 0, max: 10, expected: 10 },  // just above
>   { value: 3, min: 3, max: 3, expected: 3 },     // min equals max
>   { value: -5, min: -10, max: -1, expected: -5 } // negative range
> ])('clamp($value, $min, $max) -> $expected', ({ value, min, max, expected }) => {
>   expect(clamp(value, min, max)).toBe(expected);
> });
> ```
>
> Each row is reported as its own test. The rows cover one value per equivalence class plus both sides of each boundary, and expectations are literals, not recomputed with the same formula. A further test should pin down what happens when `min > max` (throw or swap), since that is a contract decision.

### 21. An E2E test fails about one run in twenty in CI and never locally. Describe how you would diagnose and fix it.

> Get evidence first. Make sure CI records a trace (`trace: 'on-first-retry'` or `'retain-on-failure'`), download the trace from a failed run, and open it with `npx playwright show-trace`. The timeline shows the DOM before and after every action, network requests, console errors, and which actionability check was waiting, which usually identifies the step that raced.
>
> Reproduce locally under stress: `npx playwright test the.spec.ts --repeat-each=50 --workers=4`, optionally with CPU throttling, since CI is slower and runs more in parallel.
>
> Then fix the cause according to what the trace shows: replace one-shot checks or sleeps with web-first assertions; wait for an app-ready signal if a click landed before hydration; register `waitForResponse` before the action that triggers the request; give the test its own data if another test changed shared state; control time with `page.clock`; block or mock third-party requests.
>
> Retries keep the pipeline moving meanwhile but are not the fix. Track tests reported as flaky, and quarantine with `test.fixme` plus an issue if it cannot be fixed immediately.

### 22. What can automated accessibility checks such as axe detect, and what can they not? How do you cover the gap?

> axe detects machine-checkable failures: missing form labels and alt attributes, invalid or misused ARIA, duplicate IDs referenced by ARIA, colour contrast (in a real browser, not jsdom), missing page language, and similar rule-based issues. That is a minority of real accessibility problems.
>
> It cannot judge whether alt text is meaningful, whether focus order is logical, whether a custom widget is fully keyboard operable, whether focus is trapped in and restored from a dialog, or whether announcements happen at the right time.
>
> Cover the gap with tests that query by role and accessible name (which fail when semantics are missing), keyboard-only interaction tests using `user.tab()` and `user.keyboard()`, assertions such as `toHaveAccessibleName` and `toHaveFocus`, ARIA snapshots in Playwright, axe scans of each interactive state (open dialog, visible errors), and manual testing with a screen reader for key flows.

### 23. Your team's frontend tests mock the API and are all green, but production broke when the backend renamed a response field. What practices would have prevented this?

> The mocks encoded an assumption about the API that nothing verified. Options, cheapest first:
>
> - Generate TypeScript types from the API's OpenAPI or GraphQL schema and type both the fetch layer and the MSW handlers with them. A rename becomes a compile error in the app and in the mocks as soon as the schema updates.
> - Diff the schema in the backend's CI and flag breaking changes.
> - Validate responses at runtime at the fetch boundary (Zod or similar) so drift fails loudly in one place.
> - Consumer-driven contract tests with Pact: frontend tests record the interactions they rely on, and the provider's CI replays them against the real service, failing before deploy if a consumer would break.
> - Keep a small number of E2E tests against the real backend for the critical journeys.
> - Make API changes additive: add the new field, migrate consumers, then remove the old one.

### 24. Review this test and list everything you would change.

```tsx
test('works', async () => {
  const { container } = render(<LoginForm onLogin={mockLogin} />);
  fireEvent.change(container.querySelector('#email')!, { target: { value: 'a@b.co' } });
  fireEvent.change(container.querySelector('#pw')!, { target: { value: 'secret' } });
  fireEvent.click(container.querySelector('.btn-primary')!);
  await new Promise((r) => setTimeout(r, 1000));
  expect(mockLogin).toHaveBeenCalled();
  expect(container).toMatchSnapshot();
});
```

> - The name "works" says nothing. Describe the behaviour: "calls onLogin with the credentials and shows a welcome message".
> - `container.querySelector` with IDs and class names couples the test to markup. Use `screen.getByLabelText('Email')`, `getByLabelText('Password')`, and `getByRole('button', { name: 'Log in' })`, which also verify that labels exist.
> - `fireEvent.change` sets the value in one step and skips focus, key, and input events. Use `const user = userEvent.setup()` with `await user.type(...)` and `await user.click(...)`.
> - The one-second sleep is slow and still racy. Wait for the observable outcome: `await screen.findByText(/welcome/i)` or `await waitFor(() => expect(mockLogin).toHaveBeenCalled())`.
> - `toHaveBeenCalled()` is too weak; assert the arguments: `toHaveBeenCalledWith({ email: 'a@b.co', password: 'secret' })`.
> - The whole-container snapshot asserts on every tag and attribute, will fail on any markup change, and will be updated without review. Replace it with specific assertions about what the user sees after logging in.
> - Add tests for the other states: invalid credentials, server error, and the disabled or loading state of the button while submitting.
