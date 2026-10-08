# Testing

> Stage: 2 · Professional
> Tests exist to let you change code with confidence. Learn to write tests that fail when behaviour breaks and stay green when you refactor.

## Principles

- [ ] Why test — confidence, documentation, design feedback; cost vs value
- [ ] Test shapes — the pyramid and the trophy; where to invest
- [ ] Test behaviour, not implementation — tests should survive a refactor
- [ ] Anatomy of a test — arrange, act, assert; one reason to fail
- [ ] What not to test — third-party code, trivial code, implementation details
- [ ] Static analysis as testing — types and lint catch whole classes of bugs for free

## Unit and integration

- [ ] Test runner — set up Vitest or Jest; watch mode, filtering, coverage
- [ ] Assertions and matchers — write clear expectations and custom matchers
- [ ] Test doubles — mocks, stubs, spies, fakes; avoid over-mocking
- [ ] Fake timers — test debounce, timeouts, and dates deterministically
- [ ] Snapshot testing — where snapshots help, where they rot, and inline and ARIA snapshots as better-scoped options
- [ ] Async tests — await correctly and avoid false positives
- [ ] Testing pure logic — reducers, utilities, parsers, with table-driven tests

## Component testing

- [ ] Testing Library — query by role and label, the way users find things
- [ ] User interactions — `user-event` for realistic typing and clicking
- [ ] Async UI — `findBy`, `waitFor`, and loading states
- [ ] Network mocking — MSW at the network boundary rather than mocking `fetch`
- [ ] Testing hooks and context — through components or `renderHook`
- [ ] Browser-mode component tests — run components in a real browser (Vitest browser mode, Playwright CT)
- [ ] Accessibility assertions — `axe` checks in component tests

## End-to-end

- [ ] Playwright — write, run, and debug E2E tests
- [ ] Resilient locators — role-based selectors and auto-waiting; no arbitrary sleeps
- [ ] Test data and isolation — seed state, authenticate once, keep tests independent
- [ ] Flakiness — diagnose and fix flaky tests with traces and retries
- [ ] Visual regression — screenshot comparisons with sensible thresholds
- [ ] Cross-browser and mobile — run against Chromium, Firefox, WebKit, and device profiles

## Strategy

- [ ] Tests in CI — run on every PR, parallelise, shard, and report
- [ ] Coverage — use it as a flashlight, not a target
- [ ] Mutation testing — measure whether your tests would catch a bug, using Stryker
- [ ] TDD — practise red-green-refactor enough to know when it helps
- [ ] Contract testing — keep frontend and API in agreement
- [ ] Testing strategy document — define what's tested at which level for a real app

## Projects

- [ ] Retrofit tests — add meaningful unit, component, and E2E tests to an earlier project
- [ ] TDD kata — build a small feature test-first, start to finish

## Resources

- [Testing Library docs](https://testing-library.com/docs/)
- [Playwright docs](https://playwright.dev/docs/intro)
- [Vitest docs](https://vitest.dev/guide/)
- [Kent C. Dodds: Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
