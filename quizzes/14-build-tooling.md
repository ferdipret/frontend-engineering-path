# Build Tooling: Practice test

### 1. Browsers support ES modules natively. Why do production apps still bundle?

- [ ] Browsers cannot execute `import` statements without a bundler runtime
- [x] Unbundled graphs load as a waterfall of many requests discovered one level at a time, and bundling also enables resolution of npm packages, minification, tree shaking, and cacheable hashed chunks
- [ ] HTTP/2 limits a page to six module requests
- [ ] ES modules are slower to execute than bundled scripts

> Native modules work, but the browser only learns a module's imports after downloading and parsing it, so deep graphs load in sequential rounds, and thousands of small files compress and cache poorly. HTTP/2 multiplexing makes parallel requests cheap; it does not remove the discovery waterfall. Bundlers also resolve bare specifiers and CommonJS, and apply optimisations.

### 2. Which tool in a typical Vite and TypeScript project reports type errors?

- [ ] Vite's transformer, during `vite build`
- [ ] Rolldown, when it links modules
- [ ] The minifier
- [x] `tsc`, run separately (for example `tsc --noEmit`) or through the editor

> Vite, like Babel, SWC, esbuild, and Oxc, strips types one file at a time without checking them. Only the TypeScript compiler analyses types across files. A build can succeed with type errors unless CI runs `tsc`.

### 3. A project sets an old build target. In an old browser, which line still fails at runtime?

```js
const name = user?.profile?.name;
const last = items.findLast((item) => item.done);
```

- [ ] The first, because optional chaining cannot be transformed
- [x] The second, because `findLast` is an API that needs a polyfill, which a syntax target does not add
- [ ] Both, because targets only affect CSS
- [ ] Neither, because the target makes the bundler include everything needed

> Optional chaining is syntax, so the transformer rewrites it for the target. `Array.prototype.findLast` is a runtime API; lowering the target does not create it. Without a polyfill the call throws `items.findLast is not a function`.

### 4. What does "Baseline Widely available" mean?

- [ ] The feature works in at least 95% of browsers by global usage
- [ ] The feature is in the latest stable version of Chrome
- [ ] The feature has reached W3C Recommendation status
- [x] The feature has been supported across the core browser set (Chrome, Edge, Firefox, Safari, desktop and mobile) for at least 30 months

> A feature is Newly available when all core browsers support it in stable, and becomes Widely available 30 months later. It is defined by time since interoperability, not by usage share or standards status. Vite's default build target uses this definition.

### 5. Given this `.env` file, what is in the production bundle?

```ini
VITE_API_URL=https://api.example.com
DB_PASSWORD=hunter2
```

```js
console.log(import.meta.env.VITE_API_URL, import.meta.env.DB_PASSWORD);
```

- [x] The API URL as a string literal, and `undefined` for the password
- [ ] Both values as string literals
- [ ] Neither; env values are fetched from the server at runtime
- [ ] Both, but the password is encrypted

> Vite only exposes variables with the `VITE_` prefix (configurable with `envPrefix`) and inlines them statically at build time. `DB_PASSWORD` is not exposed, so the expression evaluates to `undefined`. The corollary is that every `VITE_` value is public once shipped.

### 6. In this webpack rule, in what order do the loaders run?

```js
{ test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] }
```

- [ ] `style-loader`, then `css-loader`, then `sass-loader`
- [ ] All three in parallel, merged by webpack
- [x] `sass-loader`, then `css-loader`, then `style-loader`
- [ ] The order is decided by each loader's `enforce` setting

> A `use` array runs right to left (last to first). Sass is compiled to CSS, `css-loader` resolves `@import` and `url()` and turns it into a module, and `style-loader` injects it. Reversing the array is a classic misconfiguration.

### 7. Which statement about source maps in production is correct?

- [ ] Shipping source maps slows page load because browsers download them with every script
- [ ] A `'hidden'` source map is encrypted so only your team can read it
- [x] Browsers fetch maps only when DevTools is open; the concern is exposing readable source, which `'hidden'` maps uploaded to an error tracker avoid
- [ ] Source maps are only useful in development because minified stack traces cannot be mapped afterwards

> Maps are not downloaded by ordinary visitors. `build.sourcemap: 'hidden'` generates the maps but omits the `sourceMappingURL` comment, so you can upload them to an error tracker for symbolication and keep them off the public server. They are not encrypted.

### 8. A Vite project has `autoprefixer` in `postcss.config.js`. A developer then sets `css.transformer: 'lightningcss'`. What changes?

- [ ] Nothing; Lightning CSS runs after PostCSS, so both apply
- [x] PostCSS plugins stop running; prefixing and syntax lowering are now done by Lightning CSS according to its browser targets
- [ ] CSS Modules stop working, because only PostCSS supports them
- [ ] Minification is disabled until `cssnano` is added

> `css.transformer` selects the engine for CSS processing. With `'lightningcss'`, the PostCSS config is no longer applied, and Lightning CSS handles bundling, prefixing, lowering, CSS Modules, and minification itself, driven by its targets. If the targets are not set as intended, expected prefixes or fallbacks can disappear, so check the emitted CSS after switching.

### 9. Why might editing a file cause a full page reload instead of a hot update?

- [ ] HMR only works for CSS files
- [ ] The WebSocket connection is closed after the first update
- [ ] The file is larger than the HMR size limit
- [x] No module on the importer chain accepts the update, so propagation reaches the root

> When a module changes, the server walks up through its importers looking for an HMR boundary (a module that called `import.meta.hot.accept`, usually inserted by a framework plugin). If none is found, the only safe option is a reload. With React Fast Refresh, a file that exports non-component values alongside components is a common cause.

### 10. Only `add` is imported from this module. What ends up in a tree-shaken, unminified bundle?

```js
export const add = (a, b) => a + b;
export const sub = (a, b) => a - b;
export const registry = createRegistry();
```

- [ ] Only `add`
- [x] `add` and the `createRegistry()` call, because the bundler cannot prove the call has no side effects
- [ ] All three exports, because they are in the same module
- [ ] Nothing is removed without `sideEffects: false`

> `sub` is a function expression with no effects, so it is dropped. `createRegistry()` is a call at module top level; it might do anything, so it is kept even though `registry` is unused. Marking it `/* @__PURE__ */ createRegistry()` allows removal. With `"sideEffects": false` in the package the bundler may still need to evaluate a module whose exports are used, so the annotation is the precise fix.

### 11. Which import is most likely to pull an entire library into the bundle?

- [ ] `import { debounce } from 'lodash-es';`
- [ ] `import debounce from 'lodash/debounce';`
- [x] `import { debounce } from 'lodash';`
- [ ] `const { default: debounce } = await import('lodash-es/debounce.js');`

> The `lodash` package's main entry is a single CommonJS module. CommonJS exports are assigned dynamically, so the bundler cannot tell which parts are unused and keeps everything. `lodash-es` is ESM and tree-shakeable, and `lodash/debounce` imports just one file.

### 12. A team puts all of `node_modules` into a single `vendor` chunk "for caching". What is the main drawback?

- [ ] Browsers cannot cache chunks above a size limit
- [ ] Vendor chunks cannot be content-hashed
- [ ] It disables tree shaking for dependencies
- [x] Updating any one dependency changes the chunk's hash and invalidates all of it, and every route downloads dependencies only some routes use

> A single vendor chunk is cache-stable only if no dependency ever changes. In practice one patch release rehashes the whole file. It also defeats route-level splitting for libraries used in one place. Group by stability (framework core separately) or by usage, or leave chunking automatic.

### 13. What does `<link rel="modulepreload" href="/assets/store.js">` do?

- [ ] Downloads and executes the module immediately
- [ ] Only stores the response in the HTTP cache, like `rel="prefetch"`
- [x] Fetches, parses, and compiles the module and puts it in the module map without executing it
- [ ] Tells the server to push the module over HTTP/2

> `modulepreload` prepares a module ahead of discovery so that the later `import` links immediately, removing a round trip from the import chain. Execution still happens in normal dependency order. `prefetch` is a low-priority hint for future navigations, and `preload as="script"` uses a different request mode and does not populate the module map.

### 14. Given this `package.json`, what happens on current Node.js?

```json
{
  "name": "tiny-lib",
  "type": "module",
  "exports": { ".": "./dist/index.js" }
}
```

```js
// consumer.cjs
const lib = require('tiny-lib');
const internal = require('tiny-lib/dist/internal.js');
```

- [ ] Both lines throw `ERR_REQUIRE_ESM`
- [ ] Both lines work
- [x] The first works if the module graph has no top-level `await`; the second throws because the subpath is not listed in `exports`
- [ ] The first throws; the second works because deep paths bypass `exports`

> Supported Node versions can `require()` synchronous ES modules; a top-level `await` anywhere in the graph causes `ERR_REQUIRE_ASYNC_MODULE`. An `exports` map encapsulates the package, so anything not listed fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`.

### 15. A component library lists `react` under `dependencies` and bundles it into its output. What goes wrong in an app that uses it?

- [x] The app can end up with two copies of React, which breaks hooks and context and inflates the bundle
- [ ] Nothing; bundlers always dedupe packages with the same name
- [ ] The app fails to install because React cannot be a regular dependency
- [ ] Tree shaking removes the app's own copy of React

> React keeps module-level state, so hooks called against a second copy fail with an invalid hook call, and context does not cross copies. Libraries should declare `react` as a `peerDependency` with a wide range and mark it external in their build, so the host app provides the single instance.

### 16. In Turborepo, what does `"dependsOn": ["^build"]` on the `build` task mean?

- [ ] Run `build` in every package in the repository first
- [ ] Run this package's `build` script before any other of its tasks
- [ ] Skip the cache for `build`
- [x] Run `build` in the packages this package depends on before running it here

> The `^` prefix refers to the same task in the package's workspace dependencies, so libraries are built before the apps that consume them. Without the caret, `"dependsOn": ["build"]` would mean another task in the same package.

### 17. Explain how a source map lets DevTools show your original TypeScript when the browser is running a single minified line.

> The minified file ends with a `//# sourceMappingURL=` comment (or the response carries a `SourceMap` header) pointing to a JSON file. That file lists the original `sources`, optionally their full text in `sourcesContent`, a `names` array of original identifiers, and a `mappings` string. `mappings` encodes, for positions in the generated file, the corresponding source file, line, and column (and optionally a name), using Base64 VLQ numbers stored as deltas, with `;` separating generated lines and `,` separating segments.
>
> Given a generated line and column from a breakpoint or stack frame, the debugger looks up the nearest mapping and shows the original location. Each build step produces its own map and they are composed, so the final map goes from minified output back to authored source. A step that changes code without emitting a map breaks the chain for that file.

### 18. This Vite plugin is meant to let you `import data from './file.yaml'`, but it makes builds slow and breaks other files. Find the problems.

```js
import { parse } from 'yaml';

export default function yamlPlugin() {
  return {
    transform(code, id) {
      const data = parse(code);
      return `export default ${data}`;
    },
  };
}
```

> - There is no check on `id`, so the hook runs on every module and tries to parse JavaScript and CSS as YAML, corrupting or failing them. Restrict it with a hook filter or an early return: `transform: { filter: { id: /\.ya?ml$/ }, handler(code, id) { … } }`. The filter also avoids calling into JavaScript for every module, which is the performance problem.
> - `${data}` interpolates an object as `[object Object]`. Use `JSON.stringify(data)` to emit valid JavaScript.
> - The plugin has no `name`, so errors and warnings cannot be attributed to it.
> - It should return an object with `code`, `map: null`, and `moduleType: 'js'` so the bundler treats the result as JavaScript and knows there is no source map.
>
> ```js
> export default function yamlPlugin() {
>   return {
>     name: 'vite-plugin-yaml',
>     transform: {
>       filter: { id: /\.ya?ml$/ },
>       handler(code) {
>         return {
>           code: `export default ${JSON.stringify(parse(code))};`,
>           map: null,
>           moduleType: 'js',
>         };
>       },
>     },
>   };
> }
> ```

### 19. What cache headers would you set for `index.html` and for `/assets/index-B7xK2a9f.js`, and why?

> Hashed assets: `Cache-Control: public, max-age=31536000, immutable`. The file name contains a hash of the content, so a given URL never changes meaning; it can be cached for a year and the browser need not revalidate it.
>
> `index.html`: `Cache-Control: no-cache` (store it, but revalidate before each use), ideally with an `ETag`. The HTML is the one file with a stable URL, and it references the current hashed file names. If it were cached for a long time, users would keep loading old asset URLs after a deploy; if hashed assets were not cached, users would re-download unchanged code on every visit.
>
> Also keep the previous deploy's assets available for a while, because a tab opened before the deploy still references the old hashes and may lazy-load an old chunk later.

### 20. The entry chunk of your app grew by 180 kB after a pull request that "only added a date picker". How do you investigate, and what fixes are likely?

> Reproduce with a production build on the commit before and after, and compare the build report. Open a bundle visualiser (Vite DevTools, `rollup-plugin-visualizer`, or `source-map-explorer`) on both and diff the entry chunk to see which modules are new. Trace why they are there: which import chain connects the entry to them.
>
> Typical findings and fixes:
>
> - The date picker depends on a large date library, possibly with all locales, or a second date library alongside the one already used. Choose a picker that uses the existing library or `Intl`, or import only the needed locale.
> - The picker is imported statically by a component on the initial route. Load it with a dynamic import when the field is first focused or opened.
> - The library is consumed as CommonJS or through a barrel with side effects, so nothing is tree-shaken. Import its ESM entry or specific subpaths.
> - It introduced a duplicate version of an existing dependency. Check with `pnpm why` and dedupe.
> - Its CSS is bundled into the main stylesheet. Split it with the lazy chunk.
>
> Confirm the result by compressed size, and add a size budget to CI so this is caught in review next time.

### 21. You are asked to add a bundle size budget to CI. What would you measure, how would you choose the limits, and why is Vite's chunk size warning not sufficient?

> Measure what users download on first load: the compressed (Brotli or gzip) size of the entry JavaScript and CSS for the key routes, matched with globs because file names are hashed. A budget on the total output directory is misleading, since adding a lazy-loaded route increases the total without hurting anyone's first load.
>
> Set each limit slightly above the current size so it works as a ratchet. A limit far above current size never fires, and an aspirational one that fails immediately gets removed. Keep the limits in the repository so raising one is a reviewed change with a reason, and lower them after each optimisation.
>
> Use a tool that exits non-zero, such as `size-limit` with `@size-limit/file`, webpack's `performance.hints: 'error'`, or Lighthouse CI budgets, and run it on every pull request, ideally with a comment showing the size change. Vite's `build.chunkSizeWarningLimit` only prints a warning and the build still succeeds, it is based on uncompressed chunk size, and nobody reads build logs on a green check.
>
> When it fails, analyse what was added and defer, replace, or consciously accept it. Pair the byte budget with a performance metric so you know the bytes matter.

### 22. Explain the dual package hazard and why ESM-only publishing is now a reasonable default.

> A dual package ships a CommonJS build and an ESM build selected by the `require` and `import` conditions in `exports`. If one application loads the package both ways, for example its own code imports it while a CommonJS dependency requires it, Node evaluates two separate module instances. Any module-level state exists twice: caches and registries diverge, `instanceof` checks fail between objects from different copies, and singletons are no longer single. Dual builds also double the published size and need two sets of type declarations (`.d.mts` and `.d.cts`), which are easy to get wrong.
>
> The reason dual packages existed is that `require()` could not load ES modules. Node now supports `require(esm)` for synchronous module graphs in all maintained release lines, and bundlers handle ESM natively. An ESM-only package therefore works for both `import` and `require` consumers, has one instance, one set of types, and tree-shakes well. The remaining constraint is to avoid top-level `await` in the library, and to keep a CommonJS build only if you must support older Node versions.

### 23. Describe the runtime that a simple bundler emits to make several modules work in one file, and how it handles circular imports.

> Each module's code is wrapped in a function taking `require`, `module`, and `exports`, so its top-level variables stay private. The bundle holds a table from module ID to that function plus a mapping from the specifiers the module wrote (`'./util.js'`) to the IDs the bundler assigned.
>
> The runtime's `require(id)` checks a cache. On a miss it creates a `module` object with an empty `exports`, stores it in the cache, then calls the module function, and finally returns `module.exports`. On a hit it returns the cached `exports` at once. Execution starts by requiring the entry ID.
>
> Because the cache entry is created before the module function runs, a cycle does not recurse forever: if A requires B and B requires A, B receives A's `exports` object as it is at that moment, partially filled. That is also why a module's top-level code runs exactly once no matter how many modules import it. Scope-hoisting bundlers such as Rollup and Rolldown avoid these wrappers by placing modules in one scope and renaming bindings.

### 24. Your CI installs dependencies with a plain `npm install` and a bot automerges every dependency update as soon as it is published. What are the risks and what would you change?

> Risks: `npm install` can modify the lockfile and resolve different versions than were tested, so builds are not reproducible. Automerging brand-new releases means a compromised or broken version reaches your main branch within minutes of publication, and install scripts from any transitive dependency run on CI with access to its secrets.
>
> Changes:
>
> - Commit the lockfile and install with `npm ci` or `pnpm install --frozen-lockfile`.
> - Add a cooldown: `minimumReleaseAge` in Renovate and in pnpm, so versions are adopted only after they have been public for a day or more. Most malicious releases are pulled within hours.
> - Disable dependency install scripts by default and allow only the packages that need them (pnpm does this by default).
> - Limit automerge to patch and minor updates of low-risk groups such as dev dependencies, require CI to pass, group related packages, and review major updates by hand with the lockfile diff.
> - Run `audit` in CI focused on production dependencies, pin GitHub Actions to commit SHAs, and scope CI secrets so the install step cannot read publish or deploy credentials.
> - Publish your own packages with trusted publishing and provenance instead of long-lived tokens.
