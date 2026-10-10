# Delivery and Operations

> Stage: 4 · Mastery
> Code isn't done until it's running reliably for users. Own the path from merge to production and what happens after.

## CI/CD

- [ ] CI pipeline - lint, type-check, test, and build on every PR (GitHub Actions or similar)
- [ ] Fast pipelines - caching, parallelism, and running only what's affected
- [ ] Preview deployments - a live URL for every PR
- [ ] Pipeline security - pin actions, least-privilege tokens, OIDC instead of long-lived secrets, and protected environments
- [ ] Continuous deployment - ship main automatically with confidence
- [ ] Release strategies - canary, blue-green, and percentage rollouts
- [ ] Rollbacks - revert quickly; decouple deploy from release with flags
- [ ] Feature flag lifecycle - ownership, expiry, cleanup, and keeping server and client evaluations consistent
- [ ] Database migrations - expand, migrate, contract, so every deploy can be rolled back
- [ ] Versioning and changelogs - automate releases for packages

## Hosting and infrastructure

- [ ] Hosting platforms - deploy to Vercel, Netlify, or Cloudflare and understand what they abstract
- [ ] CDN configuration - cache rules, invalidation, and edge logic
- [ ] Serverless and edge functions - cold starts, limits, and runtime differences
- [ ] Containers - write a Dockerfile for a Node-rendered frontend
- [ ] Infrastructure basics - DNS, TLS certificates, load balancers, at a conversational level
- [ ] Asset deployment safety - handle version skew between old clients and new deploys
- [ ] Cost awareness - know what drives the bill: bandwidth, function invocations, builds

## Observability

- [ ] Error tracking - alerts, grouping, release tagging, and source maps
- [ ] Real user monitoring - web vitals and custom metrics by route, device, and release
- [ ] Logging and tracing - correlate a frontend action with backend traces
- [ ] Synthetic monitoring - scheduled checks of critical flows
- [ ] Session replay - use it for debugging while respecting privacy
- [ ] Dashboards and alerts - signal over noise; alert on user impact
- [ ] SLOs - define availability and performance objectives for the frontend

## Incidents

- [ ] Incident response - triage, mitigate first, communicate, then fix
- [ ] Debugging production - reproduce from reports, replays, and logs
- [ ] Postmortems - blameless write-ups with concrete follow-ups
- [ ] On-call readiness - runbooks and knowing how to roll back at 3am

## Backend literacy

- [ ] Build an API - a small REST service with Node, validation, and a database
- [ ] Databases - SQL basics, indexes, and how queries shape UI latency
- [ ] Caching layers - where Redis and CDN caches sit and how staleness reaches the UI
- [ ] Queues and async work - why some operations return "accepted" rather than a result

## Projects

- [ ] Full pipeline - CI, preview deploys, production deploy, error tracking, and RUM for one of your apps
- [ ] Game day - break your deployed app on purpose and practise detection, rollback, and a postmortem

## Resources

- [GitHub Actions docs](https://docs.github.com/en/actions)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
- [web.dev: Monitor Core Web Vitals in the field](https://web.dev/articles/vitals-field-measurement-best-practices)
