# Build Tooling

> Stage: 2 · Professional
> The pipeline between your source and what the browser runs. You don't need to write a bundler, but you must be able to debug one.

## Concepts

- [ ] Why we build — modules, syntax transforms, optimisation, non-JS assets
- [ ] Module graph — how a bundler walks imports from entry points
- [ ] Transpilation — what Babel, SWC, esbuild, Oxc, and `tsc` each do
- [ ] Browser targets — `browserslist`, Baseline, and deciding what to support
- [ ] Polyfills — syntax transforms vs runtime polyfills; ship only what's needed
- [ ] Source maps — how they work and how to use them in production safely
- [ ] Dev server and HMR — how hot module replacement keeps state between edits

## Bundlers

- [ ] Vite — configure dev and build, plugins, env variables, and library mode
- [ ] Rollup and Rolldown — the plugin model beneath Vite
- [ ] webpack — read and modify a legacy config: loaders, plugins, chunks
- [ ] esbuild, Turbopack, Rspack — know the Rust and Go generation and why they're fast
- [ ] Write a plugin — a small Vite or Rollup plugin that transforms a file type

## Optimisation

- [ ] Tree shaking — how it works, side effects, and why some imports defeat it
- [ ] Code splitting — dynamic imports, vendor chunks, and chunking strategy
- [ ] Minification and compression — Oxc, esbuild, or Terser for minifying; gzip and Brotli for transfer
- [ ] Asset handling — hashing for long-term caching, images, fonts, inlining thresholds
- [ ] CSS in the build — what PostCSS and Lightning CSS do: bundling, prefixing, syntax lowering, minifying, CSS Modules
- [ ] Bundle analysis — visualise a bundle and remove the biggest offenders
- [ ] Size budgets in CI — fail a pull request when a bundle grows past its limit
- [ ] Module preloading — `modulepreload` and avoiding import waterfalls

## Packages and modules

- [ ] ESM vs CJS in practice — dual packages, `exports` map, `type: "module"`
- [ ] Publishing a library — build ESM output with types, `sideEffects`, peer dependencies
- [ ] Monorepo basics — workspaces with pnpm; task running with Turborepo or Nx
- [ ] Dependency hygiene — dedupe, audit, automate updates with Renovate or Dependabot

## Projects

- [ ] Toy bundler — write a minimal bundler that resolves imports and emits one file
- [ ] Bundle diet — take a real app, analyse the bundle, and cut it by a measurable amount
- [ ] Publish a package — a typed, tree-shakeable utility library on npm

## Resources

- [Vite guide](https://vite.dev/guide/)
- [web.dev: Baseline](https://web.dev/baseline)
- [Minipack: a simplified bundler explained](https://github.com/ronami/minipack)
- [Are the types wrong?](https://arethetypeswrong.github.io/)
