# Frontend Architecture and System Design

> Stage: 4 · Mastery
> Architecture is the set of decisions that are expensive to change. A master makes them deliberately, writes down why, and keeps the codebase able to evolve.

## Code organisation

- [ ] Module boundaries — organise by feature or domain rather than by file type
- [ ] Dependency direction — enforce layering and prevent cycles with lint rules
- [ ] Public APIs — each module exposes a small surface and hides the rest
- [ ] Coupling and cohesion — recognise and reduce accidental coupling
- [ ] Abstraction timing — duplicate until the pattern is clear; avoid premature generalisation
- [ ] Separation of concerns — keep domain logic out of components and testable alone
- [ ] Conventions — codify structure so the right thing is the easy thing

## Application architecture

- [ ] Rendering architecture — choose SPA, MPA, SSR, islands, or a hybrid per product need
- [ ] Data layer design — where fetching, caching, and normalisation live
- [ ] API contract design — collaborate on API shape; BFF and GraphQL as aggregation layers
- [ ] Error handling strategy — consistent propagation, boundaries, and user messaging
- [ ] Auth architecture — session handling, token refresh, and permission modelling in the UI
- [ ] Configuration — environments, runtime config, and flags
- [ ] Cross-cutting concerns — logging, analytics, i18n, and theming without tangling features
- [ ] Testing architecture — decide what is verified at which level, including contracts between frontend and API

## Scaling codebases and teams

- [ ] Monorepos — structure, ownership, caching, and affected-only builds
- [ ] Shared packages — design system, utilities, and config as versioned internal libraries
- [ ] Micro-frontends — module federation and composition; know the costs and when it's justified
- [ ] Code ownership — CODEOWNERS and clear boundaries between teams
- [ ] Build and CI at scale — keep feedback fast as the repo grows

## Evolution

- [ ] Incremental migration — the strangler pattern for moving frameworks or architectures
- [ ] Codemods — automate large refactors with jscodeshift or ast-grep
- [ ] Deprecation — retire APIs with warnings, tooling, and deadlines
- [ ] Technical debt — make it visible, prioritise it, and pay it down continuously
- [ ] Technology selection — evaluate a library or framework on maturity, fit, exit cost, and team skill
- [ ] Build vs buy — decide when to adopt and when to own

## System design

- [ ] Requirements first — clarify functional needs, scale, devices, and constraints before designing
- [ ] Design a news feed — pagination, virtualisation, caching, real-time updates, optimistic interactions
- [ ] Design an autocomplete — debouncing, caching, race handling, accessibility, ranking
- [ ] Design a collaborative editor — data model, sync, conflict resolution, presence
- [ ] Design a media-heavy page — image and video delivery, layout stability, performance budget
- [ ] Design a component library — API, theming, accessibility, distribution, versioning
- [ ] Communicate a design — diagrams, trade-offs, and alternatives considered

## Documentation of decisions

- [ ] Architecture decision records — capture context, decision, and consequences
- [ ] RFCs — propose a significant change in writing and drive it to a decision
- [ ] Architecture diagrams — keep a current map of the system that new hires can follow

## Projects

- [ ] Architecture review — document the architecture of a real codebase and propose three improvements
- [ ] Write an RFC — for a migration or major change, including rollout and rollback

## Resources

- [patterns.dev](https://www.patterns.dev/)
- [GreatFrontEnd: Front End System Design](https://www.greatfrontend.com/front-end-system-design-playbook)
- [Martin Fowler: Micro Frontends](https://martinfowler.com/articles/micro-frontends.html)
- [Architecture Decision Records](https://adr.github.io/)
