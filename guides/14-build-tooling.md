# Build Tooling: Guide

## Toolkit

### DevTools and tooling

The landscape changed substantially in 2026, so check versions before following older tutorials. Vite 8 replaced its esbuild-plus-Rollup pair with Rolldown (bundler) and Oxc (transformer and minifier), both written in Rust. TypeScript 7 ships a native compiler. Babel 8 is ESM-only. Next.js 16 builds with Turbopack by default.

- **Vite CLI.** `vite` starts the dev server, `vite build` writes `dist/`, and `vite preview` serves the built output locally, which is the only honest way to check a production build. `vite --debug` (or `--debug transform`, `--debug hmr`) logs what the server is doing, and `vite build --mode staging` selects env files.
- **Vite DevTools.** Install `@vitejs/devtools` and set `devtools: true` in the config (Vite 8.3 or later). It shows the Rolldown module graph, chunks, assets, and per-plugin timings for a build.
- **Bundle visualisers.** `rollup-plugin-visualizer` produces a treemap of what is in each chunk; `webpack-bundle-analyzer` does the same for webpack; `source-map-explorer` works on any bundle that has a source map.
- **Chrome DevTools.** Network panel: enable "Big request rows" to see transferred versus decoded size, add the Content-Encoding column, and use the Initiator column and waterfall to spot import chains. Coverage panel (Command Menu, "Show Coverage"): shows how much of each loaded script actually ran. Sources panel: authored files appear when source maps load; the Developer Resources drawer tab reports source maps that failed.
- **Target and package checks.** `npx browserslist` prints the browsers your query resolves to. `npx publint` and `npx @arethetypeswrong/cli --pack` lint a package's `exports` and types before you publish.
- **Dependency inspection.** `pnpm why <pkg>` explains why a package is installed and in which versions; `pnpm dedupe --check` reports removable duplicates; `npx knip` finds unused dependencies and exports.
- **Playgrounds.** The Rolldown REPL, the Oxc playground, the esbuild "try" page, and AST Explorer let you paste code and see exactly what a tool emits.

### Testing and verifying your work

Build configuration fails silently: the app still loads, only larger, slower, or broken in a browser you did not open. Verify against the output, not the config.

- **Build and preview.** Run `vite build && vite preview` and use the app. Dev and production differ in bundling, minification, env values, and base path, so "works in dev" proves little. Test under the real base path if you deploy to a subdirectory.
- **Read the build report.** Vite prints each chunk with raw and gzip size and warns above 500 kB. Know your entry chunk size and notice when it moves.
- **Open the output.** Search `dist/` for a string that should have been removed (a dev-only message, an unused library's name). Build once with `build.minify: false` when you need to read what the bundler produced.
- **Check the network.** In a preview or staging deployment, confirm hashed assets return `Cache-Control` with a long `max-age` and `immutable`, HTML is revalidated, text assets have `Content-Encoding: br` or `gzip`, and the waterfall has no chain of sequential module requests.
- **Check targets.** Load the build in the oldest browser you claim to support. A syntax error there stops the whole script.
- **Check source maps.** Throw an error in production code and confirm your error tracker shows the original file and line, and that `.map` files are not publicly reachable unless you intend that.
- **Budget in CI.** Fail the build when a chunk exceeds a size budget (`size-limit` or a bundler performance hint), so growth is a reviewed decision.
- **For packages.** Run `npm pack --dry-run` to see exactly which files ship, then `publint` and `attw`, then install the tarball into a scratch project and import it from both an ESM file and a CommonJS file.

"Done" means the production build is measured, loads in your target browsers, caches correctly, and can be debugged.

### Tricks and gotchas

- Vite does not type check. It strips types per file. Run `tsc --noEmit` separately in CI, and keep `isolatedModules` (or `verbatimModuleSyntax`) on so per-file transforms are safe.
- Only variables prefixed `VITE_` reach client code, and they are inlined as strings at build time. Anything in the bundle is public; never put a secret there.
- `import.meta.env.VITE_X` is replaced statically. `import.meta.env[key]` with a dynamic key is not.
- Files in `public/` are copied as-is with no hash and no processing. Reference them by absolute path and do not expect long-term caching.
- A dynamic import with a fully variable path (`import(path)`) cannot be analysed. Keep a static prefix and extension: ``import(`./locales/${lang}.json`)``.
- After a deploy, users on an old tab may request chunks that no longer exist. Listen for `vite:preloadError` and reload, and keep old assets available for a while.
- A vendor chunk containing every dependency changes hash whenever any dependency changes. Split stable libraries from volatile ones, or leave chunking automatic.
- `sideEffects: false` in a package that imports CSS or registers globals will drop those imports. List the exceptions.
- In `exports` conditions, `types` goes first and `default` last. Order is significant.
- Compare compressed sizes. A change that saves 40 kB minified may save 3 kB over the wire, or the reverse.
- Two copies of React (or any library with module-level state) in one bundle cause "invalid hook call" style bugs. Check with `pnpm why` and fix with a peer dependency or dedupe.
- Legacy `rollupOptions` and `esbuild` keys in a Vite config are auto-converted by Vite 8's compatibility layer, but new work should use `rolldownOptions` and `oxc`.

### Official references

- [Vite guide](https://vite.dev/guide/): concepts, features, and the build and plugin guides.
- [Vite config reference](https://vite.dev/config/): every option with its default.
- [Rolldown docs](https://rolldown.rs/guide/getting-started): the bundler beneath Vite 8, including in-depth pages on splitting and dead code elimination.
- [Rollup docs](https://rollupjs.org/introduction/): the original plugin model and option reference that Rolldown follows.
- [webpack concepts](https://webpack.js.org/concepts/): entry, output, loaders, plugins, and mode.
- [esbuild docs](https://esbuild.github.io/api/): API and behaviour of the Go bundler and transformer.
- [Oxc docs](https://oxc.rs/docs/guide/introduction.html): the parser, transformer, and minifier used by Rolldown and Vite.
- [Node.js: Packages](https://nodejs.org/api/packages.html): `type`, `exports`, conditions, and dual-package rules.
- [TypeScript: Modules reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html): how `module` and `moduleResolution` map to runtimes and bundlers.
- [Source map specification (ECMA-426)](https://tc39.es/ecma426/): the standard for the source map format.
- [web.dev: Baseline](https://web.dev/baseline): what "Newly" and "Widely available" mean.
- [browserslist](https://github.com/browserslist/browserslist): query syntax shared by build tools.
- [pnpm docs: Workspaces](https://pnpm.io/workspaces): monorepo linking and the `workspace:` protocol.

## Skills

### Why we build

Browsers run JavaScript, CSS, and HTML directly, and native ES modules mean you can ship source files as they are. A build step exists because doing that for a real application is slow, limited, and unsafe to cache. It solves four separate problems.

**Modules.** An app with 1,500 modules served unbundled makes 1,500 requests, discovered level by level: the browser cannot know what `b.js` imports until it has downloaded and parsed it. HTTP/2 and HTTP/3 make parallel requests cheaper but do not remove that discovery waterfall, and many small files compress worse than a few large ones. A bundler resolves the whole graph ahead of time and emits a small number of chunks. It also resolves bare specifiers like `import 'react'`, which a browser cannot do without an import map, and consumes CommonJS packages that browsers cannot load at all.

**Syntax transforms.** TypeScript and JSX are not valid JavaScript. Newer syntax may need lowering for older browsers. CSS may need nesting flattened or prefixes added.

**Optimisation.** Minification, dead code elimination, tree shaking, code splitting, content-hashed file names for caching, and compression all reduce what users download and how often.

**Non-JS assets.** `import logo from './logo.svg'` or `import './styles.css'` is not something the platform defines. The bundler gives these meaning: copy the file, hash its name, return its URL, or inline it.

The mental model is a pipeline: resolve, load, transform, link, optimise, emit. Each tool in this module handles one or more of those stages. In development the priorities invert, favouring fast startup and instant updates over output size, which is why dev servers and production builds behave differently.

Small sites and prototypes can skip the build: a few native modules and an import map work fine. Knowing what each stage buys you is how you decide when it is worth having, and where to look when the output is wrong.

**Try it:** Write a three-module app with native `<script type="module">` and no tooling, serve it with any static server, and record the Network waterfall. Add a dependency from npm and note what fails. Then build the same app with Vite and compare request count, transferred bytes, and the waterfall shape.

**Resources**
- [Rolldown: Why bundlers](https://rolldown.rs/in-depth/why-bundlers)
- [Vite: Why Vite](https://vite.dev/guide/why)
- [MDN: JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

### Module graph

A bundler starts from one or more **entry points** and builds a directed graph: each node is a module, each edge an import. For every module it runs the same loop:

1. **Resolve** the specifier to a file. `./util` gets an extension tried; `react` is looked up in `node_modules` and its `package.json` `exports` map is read with the active conditions (`browser`, `import`, `production`, and so on); aliases and plugins can intercept.
2. **Load** the contents, from disk or from a plugin (virtual modules).
3. **Transform** to JavaScript if it is something else: TypeScript, JSX, CSS, an image.
4. **Parse** to find `import` and `export` declarations, and repeat for each new dependency.

Each file becomes one node no matter how many modules import it, which is how cycles terminate and why a module's top-level code runs once.

Edges come in kinds. A **static import** means the dependency is needed before the importer can run, so both end up in the same load. A **dynamic `import()`** marks a point where loading can be deferred; the bundler starts a new chunk there. Other edge types include `new URL('./file.png', import.meta.url)`, `new Worker(new URL(...))`, CSS `@import` and `url()`, and `import.meta.glob`.

The graph can only contain what static analysis can see. `import(variable)` gives the bundler nothing to follow; a template with a fixed prefix and suffix is expanded to every file that could match. `require()` calls inside conditionals, and CommonJS in general, are resolved conservatively.

After the module graph is complete, the bundler derives a **chunk graph**: which modules are emitted together and which chunks import which. Nearly every optimisation works on these two graphs. Tree shaking prunes unused exports from modules. Code splitting partitions modules into chunks. HMR walks importers upward from a changed module. Bundle analysis is a view of the chunk graph.

When a module shows up where you did not expect it, the question is always "which import chain pulled it in?", and the graph answers it.

**Try it:** In a Vite project, enable Vite DevTools (or add `rollup-plugin-visualizer`), build, and find a third-party module in your entry chunk. Trace the chain of importers back to your code. Then change one static import on that chain to a dynamic import and watch the module move to a new chunk.

**Resources**
- [webpack: Dependency graph](https://webpack.js.org/concepts/dependency-graph/)
- [Rolldown: Automatic code splitting](https://rolldown.rs/in-depth/automatic-code-splitting)
- [Node.js: Packages (resolution and `exports`)](https://nodejs.org/api/packages.html)

### Transpilation

Transpiling turns source code into different source code: removing TypeScript types, compiling JSX to function calls, and lowering newer syntax for older engines. Several tools do it, with different scope.

| Tool | Written in | Type checks | Role |
| --- | --- | --- | --- |
| `tsc` | Go (TypeScript 7) | Yes | The only type checker. Also emits JavaScript and `.d.ts` files. |
| Babel | JavaScript | No | Plugin-driven AST transforms. The most extensible and the slowest. |
| SWC | Rust | No | Fast transforms and minifier. Used by Next.js, Turbopack, and Rspack. |
| esbuild | Go | No | Fast transform, bundle, and minify in one tool. |
| Oxc | Rust | No | Parser, transformer, and minifier used by Rolldown and Vite 8. |

The important split is that only `tsc` understands types across files. Every other tool compiles **one file at a time** by stripping type syntax, which is why they are fast and why some TypeScript features need care. A per-file transform cannot know whether `import { Foo } from './foo'` is a type or a value, so use `import type` and turn on `verbatimModuleSyntax` (or `isolatedModules`), which make the compiler reject code that is unsafe to transform in isolation. A `const enum` imported from another file is the usual casualty, because inlining its values needs information from that other file.

So a normal setup runs two things: a fast transformer inside the bundler for development and builds, and `tsc --noEmit` as a separate check in the editor and CI. In `tsconfig.json`, `target` then affects only type checking and `tsc`'s own emit; the bundler's target is configured in the bundler.

Other facts worth knowing:

- TypeScript 7 (July 2026) is a native port and roughly ten times faster. It ships without a programmatic API, so tools that embed the compiler, such as typescript-eslint, still run on the JavaScript-based 6.x package for now.
- `isolatedDeclarations` requires explicit types on exports so that tools other than `tsc` can generate `.d.ts` files per file, quickly.
- Babel remains the choice when you need a custom AST plugin with no native equivalent. Babel 8 is ESM-only and no longer assumes ES5 output.
- Node.js runs `.ts` files directly by stripping erasable type syntax; `erasableSyntaxOnly` keeps your code within what that supports.

Transpilers change syntax. They do not add missing runtime APIs; that is the job of polyfills.

**Try it:** Paste a file with an optional chain, a class with a private field, and a `const enum` imported from another file into the esbuild or Oxc playground. Change the target from `esnext` to `es2019` and read the output. Then enable `isolatedModules` in a project and see which code the compiler rejects.

**Resources**
- [TypeScript: `isolatedModules`](https://www.typescriptlang.org/tsconfig/#isolatedModules)
- [Oxc: Transformer](https://oxc.rs/docs/guide/usage/transformer.html)
- [Babel: What is Babel?](https://babeljs.io/docs/)

### Browser targets

Your build needs to know which browsers must run the output, because that decides which syntax is lowered, which CSS is transformed or prefixed, and which polyfills you ship. Targeting too old costs every user bytes and speed; targeting too new breaks the site for some of them.

**browserslist** is the shared format. A query in `package.json` or `.browserslistrc` is read by Babel, Autoprefixer, postcss-preset-env, Lightning CSS, and lint plugins:

```json
{
  "browserslist": ["baseline widely available"]
}
```

Queries combine with commas (union) and `and`/`not`: `"> 0.5%, last 2 versions, Firefox ESR, not dead"` is what the `defaults` keyword means. Run `npx browserslist` to see the resolved list. Usage-based queries rely on a database that ships as a dependency, so refresh it with `npx update-browserslist-db@latest` or the list drifts stale.

**Baseline** is a cross-vendor definition of feature availability. A feature is *Newly available* once it works in the current stable versions of Chrome, Edge, Firefox, and Safari on desktop and mobile. It becomes *Widely available* 30 months after that date. MDN, caniuse, and DevTools display the Baseline status of each feature. As a target, "Baseline Widely available" is a moving window of roughly two and a half years of browsers, and browserslist supports it directly, including dated forms like `baseline 2023`.

Vite's `build.target` defaults to `'baseline-widely-available'`, which in Vite 8 resolves to Chrome 111, Edge 111, Firefox 114, and Safari 16.4. Vite fixes those versions per major release and does not read your browserslist for JavaScript, so set `build.target` explicitly if you need something else.

Decide with data. Look at the browser and version breakdown in your analytics or RUM, weighted by the users who matter to the business, and consider what failure looks like: a missing animation is tolerable, a syntax error that blanks the page is not. Enterprise and public-sector audiences skew older; embedded webviews and smart TVs are often far behind. Write the decision down, encode it once, and test the oldest supported browser in CI or by hand.

Targets govern syntax and CSS. Whether a JavaScript or DOM API exists is a separate question, covered next.

**Try it:** Run `npx browserslist "baseline widely available"` and `npx browserslist "defaults"` and compare the lists and their `--coverage`. Then build a Vite project with `build.target` set to `'es2018'` and to the default, and diff the size and the syntax in the output.

**Resources**
- [web.dev: Baseline](https://web.dev/baseline)
- [browserslist: Queries](https://github.com/browserslist/browserslist#queries)
- [Vite: Browser compatibility](https://vite.dev/guide/build#browser-compatibility)

### Polyfills

Two different things get called "transpiling for old browsers", and confusing them causes production errors.

A **syntax transform** rewrites code the old engine cannot parse into code it can. `a?.b` becomes a conditional; a class private field becomes a `WeakMap`. This happens at build time and is controlled by your target.

A **polyfill** is runtime code that adds a missing API: `Array.prototype.at`, `Promise.withResolvers`, `structuredClone`, `Object.groupBy`, `IntersectionObserver`. No transpiler setting creates these. If `build.target` is old but nothing supplies `Array.prototype.findLast`, the build succeeds and the call throws `findLast is not a function` on the old browser.

```js
const last = items.findLast((i) => i.done); // API: needs a polyfill on old engines
const name = user?.profile?.name;           // syntax: handled by the transform
```

Some features can be neither transformed nor polyfilled faithfully (`Proxy`, most CSS features), which is a reason to choose targets carefully.

Ship only what is needed:

- Vite and Rolldown add no API polyfills. `@vitejs/plugin-legacy` generates a separate legacy bundle with core-js polyfills, loaded via `nomodule`, for browsers below your modern target.
- In Babel 8, the `useBuiltIns` and `corejs` options were removed from `@babel/preset-env`. Use `babel-plugin-polyfill-corejs3` directly: its `usage-global` method injects imports only for APIs your code uses that your targets lack.
- For a single newer API, a feature-detected dynamic import is the smallest option, since modern browsers download nothing:

```js
if (!('IntersectionObserver' in window)) {
  await import('intersection-observer');
}
```

Rules that save trouble: libraries should not bundle global polyfills, because the application owns that decision and duplicates add up; state your requirements in the README instead. Self-host polyfills; the 2024 polyfill.io compromise turned a third-party polyfill script into malware on a large number of sites. And audit regularly: polyfills added for a browser you dropped two years ago are pure cost. A bundle analysis that shows a large `core-js` block is a prompt to revisit targets.

**Try it:** Use `Object.groupBy` and optional chaining in a small app. Build with an old target and inspect the output: the optional chain is rewritten and `Object.groupBy` is untouched. Then add a feature-detected dynamic import of a polyfill and confirm in the Network panel that a current browser never requests it.

**Resources**
- [MDN: Polyfill](https://developer.mozilla.org/en-US/docs/Glossary/Polyfill)
- [babel-polyfills: usage and injection methods](https://github.com/babel/babel-polyfills)
- [Vite: `@vitejs/plugin-legacy`](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy)

### Source maps

A source map is a JSON file that maps positions in generated code back to positions in the original sources, so DevTools and error trackers can show your TypeScript instead of one minified line.

```json
{
  "version": 3,
  "file": "index-B7xK2a.js",
  "sources": ["../src/cart.ts"],
  "sourcesContent": ["export function total(items) { … }"],
  "names": ["total", "items"],
  "mappings": "AAAA,SAASA,MAAMC…",
  "ignoreList": []
}
```

`mappings` is the core. Semicolons separate generated lines, commas separate segments, and each segment is a group of Base64 VLQ numbers: generated column, source index, original line, original column, and optionally a name index, each stored relative to the previous segment to keep the string short. `sourcesContent` embeds the original files so the map is self-contained. `ignoreList` marks third-party sources that debuggers should skip when stepping. The format is standardised as ECMA-426.

The generated file points to its map with a trailing comment, `//# sourceMappingURL=index-B7xK2a.js.map`, or the server sends a `SourceMap` response header. Each tool in a pipeline (TypeScript transform, bundler, minifier) produces a map, and they are composed into one that goes from final output to original source. A plugin that changes code without returning a map breaks the chain for that file.

Browsers fetch maps only when DevTools is open, so shipping them does not slow users down. The production question is exposure: a public map with `sourcesContent` hands out your original source and comments. Minified code is not a secret, but most teams prefer not to publish the readable version. The usual safe setup:

1. Build with `build.sourcemap: 'hidden'` (maps are generated but no `sourceMappingURL` comment is emitted).
2. Upload the `.map` files to your error tracker in CI, keyed by release or debug ID.
3. Delete them from the deploy directory, or serve them only to internal networks.

Stack traces are then symbolicated on the tracker's side. In development, Vite serves maps automatically. Options such as webpack's `eval` variants trade accuracy for rebuild speed and are for development only.

**Try it:** Build with `build.sourcemap: true`, open the `.map` file, and identify each field. Decode the first few `mappings` segments with a source map visualiser. Then switch to `'hidden'`, confirm the comment is gone from the JavaScript, and load the map manually in DevTools via "Add source map" in the Sources panel.

**Resources**
- [Source map format specification (ECMA-426)](https://tc39.es/ecma426/)
- [Chrome DevTools: Debug your original code with source maps](https://developer.chrome.com/docs/devtools/javascript/source-maps)
- [web.dev: What are source maps?](https://web.dev/articles/source-maps)

### Dev server and HMR

A dev server's job is to show your edit in the browser as fast as possible, ideally without losing what you were doing.

Vite's server does this by not bundling your source. The browser requests `/src/main.tsx` as a native ES module; Vite transforms that one file on demand and serves it, and the browser's own import requests pull in the rest. Only modules the current page needs are ever processed, so startup time does not grow with app size. Dependencies are handled differently: on first run they are **pre-bundled** (by Rolldown in Vite 8) into single ESM files, which converts CommonJS packages and collapses packages with hundreds of internal modules into one request. The cost of unbundled serving is many requests on very large apps, which is why Vite 8.1 has an experimental bundled dev mode and why Turbopack and Rspack bundle in development.

**Hot module replacement** swaps a changed module in the running page:

1. The file watcher sees a change, and the server invalidates that module.
2. The server walks up the importer chain looking for an **HMR boundary**: a module that has declared it can accept the update.
3. It sends a message over a WebSocket. The client re-imports the changed module with a cache-busting query and runs the accept callback.
4. If the walk reaches the root with no boundary, the page does a full reload.

```js
if (import.meta.hot) {
  import.meta.hot.accept((next) => {
    render(next.routes);
  });
  import.meta.hot.dispose(() => clearInterval(timer));
}
```

You rarely write this yourself. Framework plugins insert it: React Fast Refresh makes every component file a boundary, re-renders with the new function, and keeps `useState` values as long as the hook order is unchanged. CSS updates swap the style without touching JavaScript.

State is lost when the boundary cannot be honoured: a file that exports both components and non-component values, edits to a class component, a changed hook signature, or a change in a module that many things import with no acceptor. Module-level side effects (timers, listeners, sockets) duplicate on each update unless cleaned up in `dispose`. `import.meta.hot.data` carries values across updates.

**Try it:** In a Vite app with no framework, write a counter module that holds state and renders into the page. Edit it and watch state reset through a full reload. Add `import.meta.hot.accept` and `dispose`, preserve the count via `import.meta.hot.data`, and watch the WebSocket messages in the Network panel as you save.

**Resources**
- [Vite: HMR API](https://vite.dev/guide/api-hmr)
- [Vite: Dependency pre-bundling](https://vite.dev/guide/dep-pre-bundling)
- [Bjorn Lu: Hot Module Replacement is Easy](https://bjornlu.com/blog/hot-module-replacement-is-easy)

### Vite

Vite is two things behind one config: a dev server that serves source as native ES modules, and a production build that bundles with Rolldown. `index.html` at the project root is the entry point; Vite follows its `<script type="module">` and `<link>` tags.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
  },
  build: {
    target: 'baseline-widely-available',
    sourcemap: mode === 'production' ? 'hidden' : true,
  },
}));
```

**Dev versus build.** `server.*` options (proxy, port, HTTPS, `forwardConsole`) apply to `vite`. `build.*` options (target, minify, sourcemap, `assetsInlineLimit`, `rolldownOptions`) apply to `vite build`. `vite preview` serves `dist/` for checking. In Vite 8 transforms use Oxc (`oxc` option), JavaScript minification uses Oxc, and CSS minification uses Lightning CSS. Older `esbuild` and `build.rollupOptions` keys are still accepted and converted.

**Plugins** are objects with hooks, added to the `plugins` array. Order matters; `enforce: 'pre' | 'post'` and `apply: 'serve' | 'build'` adjust when a plugin runs. Framework support (React, Vue, Svelte) is a plugin.

**Env variables.** Vite loads `.env`, `.env.local`, `.env.[mode]`, and `.env.[mode].local`, and exposes only variables starting with `VITE_` on `import.meta.env`, alongside the built-ins `MODE`, `DEV`, `PROD`, `BASE_URL`, and `SSR`. Values are inlined at build time as strings, so `if (import.meta.env.DEV)` blocks are removed from production output, and nothing there is secret. Mode (`--mode staging`) selects which files load and is independent of `NODE_ENV`. Declare your variables in `src/vite-env.d.ts` by extending `ImportMetaEnv` for type safety.

**Library mode.** `build.lib` switches the entry from HTML to a module and emits library formats:

```ts
build: {
  lib: { entry: 'src/index.ts', formats: ['es'] },
  rolldownOptions: { external: ['react', 'react/jsx-runtime'] },
}
```

Externalise peer dependencies so they are not bundled into your output. Library mode does not emit `.d.ts` files; generate them with `tsc` or a plugin. For libraries without an app-style dev need, `tsdown` (also Rolldown-based) is a more focused tool.

**Try it:** Scaffold with `npm create vite@latest`. Add a `VITE_API_URL` and a non-prefixed variable to `.env`, log both, and build with two different modes. Search `dist/` for each value. Then add a dev proxy for `/api` and confirm in the Network panel that requests go through it.

**Resources**
- [Vite: Features](https://vite.dev/guide/features)
- [Vite: Env variables and modes](https://vite.dev/guide/env-and-mode)
- [Vite: Building for production (including library mode)](https://vite.dev/guide/build)

### Rollup and Rolldown

Rollup introduced the design most modern bundlers follow: ES modules as the internal representation, tree shaking by default, and a small plugin interface made of named hooks. Rolldown is a Rust bundler that implements Rollup's API and plugin interface with far higher throughput. Since Vite 8 it performs both dependency pre-bundling and the production build, replacing esbuild and Rollup respectively, so development and production now go through one bundler.

A plugin is an object with a `name` and hook functions. The build runs in two phases.

**Build hooks** run per module as the graph is discovered:

- `resolveId(source, importer)` maps an import specifier to an ID. Return `null` to defer to the next plugin.
- `load(id)` returns the source for an ID. Used for virtual modules.
- `transform(code, id)` rewrites source and returns `{ code, map }`.
- `buildStart`, `buildEnd`, and `moduleParsed` mark lifecycle points.

**Output generation hooks** run once the graph is linked: `renderChunk` (transform a whole chunk, which is where minifiers sit), `generateBundle` (inspect or add output files), `writeBundle`, `closeBundle`.

Hooks have kinds. `resolveId` and `load` are *first*: plugins are asked in order and the first non-null answer wins. `transform` is *sequential*: each plugin receives the previous one's output. Inside hooks, `this.resolve()`, `this.emitFile()`, `this.warn()`, and `this.addWatchFile()` talk to the bundler.

What differs in Rolldown:

- Much is built in that needed plugins under Rollup: TypeScript and JSX transforms, Node-style resolution, CommonJS interop, JSON, `define`, and minification. `@rollup/plugin-node-resolve` and `@rollup/plugin-commonjs` are unnecessary.
- **Hook filters**: a hook can declare `filter: { id: /\.svg$/ }` so the Rust core calls into JavaScript only for matching modules. Crossing the Rust-to-JS boundary for every module is the main cost of JS plugins, so filters matter.
- Manual chunking uses `output.codeSplitting` groups; the object form of `manualChunks` is gone and the function form is deprecated.
- A plugin converting a non-JS file to JavaScript should return `moduleType: 'js'`.

Most Rollup plugins work unchanged. Vite adds its own hooks on top (`config`, `configureServer`, `transformIndexHtml`, `hotUpdate`), and in dev only `resolveId`, `load`, and `transform` are called per request.

**Try it:** Write a `rolldown.config.js` with one entry and build it. Add a tiny plugin that logs each ID in `resolveId` and `transform`, and read the order. Add a hook filter and confirm the log shrinks. Then drop the same plugin into a `vite.config.ts` and observe which hooks fire in dev versus build.

**Resources**
- [Rolldown: Plugin API](https://rolldown.rs/apis/plugin-api)
- [Rollup: Plugin development](https://rollupjs.org/plugin-development/)
- [Rolldown: Notable features](https://rolldown.rs/guide/notable-features)

### webpack

webpack still runs a large share of production apps, so you need to be able to read a config and change it safely, even if you would not start a new project with it. A config is one object with a handful of parts.

```js
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: { main: './src/index.tsx' },
  output: {
    path: __dirname + '/dist',
    filename: '[name].[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  resolve: { extensions: ['.tsx', '.ts', '.js'], alias: { '@': __dirname + '/src' } },
  module: {
    rules: [
      { test: /\.tsx?$/, exclude: /node_modules/, use: 'babel-loader' },
      { test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'] },
      { test: /\.(png|svg|woff2)$/, type: 'asset' },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: './public/index.html' }), new MiniCssExtractPlugin()],
  optimization: { splitChunks: { chunks: 'all' }, runtimeChunk: 'single' },
  devtool: 'source-map',
};
```

- **Loaders** (`module.rules`) transform individual files that match `test`. A `use` array runs **right to left**: above, PostCSS first, then `css-loader` resolves `@import` and `url()`, then the extract loader pulls the CSS into a file. Getting this order wrong is the classic webpack bug.
- **Asset modules** (`type: 'asset'`, `'asset/resource'`, `'asset/inline'`) replaced `file-loader` and `url-loader` in webpack 5.
- **Plugins** hook into the whole compilation: generating HTML, extracting CSS, defining constants (`DefinePlugin`), analysing bundles.
- **Chunks.** `splitChunks` controls how shared and vendor code is split out; `cacheGroups` define named groups with `test`, `priority`, and `minSize`. `runtimeChunk: 'single'` isolates the module-loading runtime so its changes do not rehash other chunks. Dynamic `import()` creates async chunks, named with `/* webpackChunkName: "x" */`.
- **`mode`** sets defaults: `production` enables minification, scope hoisting, and tree shaking; `development` favours rebuild speed.
- **`devtool`** selects the source map style.

When modifying a legacy config: find the webpack major version first (4 and 5 differ in assets, caching, and Node polyfills), print the resolved result with `npx webpack --stats detailed` or run `webpack-bundle-analyzer`, change one thing at a time, and compare output. Recent 5.x releases added built-in CSS, HTML, and TypeScript handling, but configs you inherit almost always use loaders. For speed without a rewrite, Rspack accepts most webpack configs unchanged.

**Try it:** Take a webpack 5 config and, in order: add a `contenthash` to output names, enable `splitChunks` with a separate cache group for React, and add an SVG asset rule. After each change, build and diff the file list in `dist/`. Then swap two loaders in the CSS rule and read the error.

**Resources**
- [webpack: Concepts](https://webpack.js.org/concepts/)
- [webpack: Loaders](https://webpack.js.org/concepts/loaders/)
- [webpack: SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)

### esbuild, Turbopack, Rspack

The first generation of bundlers (webpack, Rollup, Parcel 1) was written in JavaScript. The current generation is written in Go or Rust and is typically ten to a hundred times faster on the same work. The reasons are structural:

- **Native code, no warm-up.** A JavaScript bundler is itself parsed and JIT-compiled on every run, and its hot paths compete with garbage collection.
- **Real parallelism with shared memory.** Parsing and code generation are spread across all cores, with threads reading the same data. JavaScript worker threads must serialise data between isolates, which eats most of the gain.
- **Fewer passes and compact data.** esbuild touches the AST about three times in total. A JavaScript toolchain that chains Babel, a bundler, and Terser parses, transforms, prints, and re-parses the same code repeatedly, converting between AST formats.
- **Incremental computation.** Caching work at fine granularity so a rebuild only redoes what a change invalidated.

The tools:

- **esbuild** (Go) proved the approach. It transforms, bundles, and minifies, and is used widely as a library and as a fast transpiler in test runners and scripts. Its code splitting is limited, it does not do HMR, and its maintainer keeps the scope deliberately small. It powered Vite's transforms and dependency pre-bundling until Vite 8.
- **Turbopack** (Rust) is built into Next.js and has been its default bundler for both `dev` and `build` since Next.js 16. Its core is an incremental engine that caches results down to individual functions, persists them to disk, and only bundles what the dev server actually requests. It supports webpack loaders but not webpack plugins, and it is not a general-purpose standalone tool.
- **Rspack** (Rust) reimplements webpack's configuration and its loader and plugin APIs. The pitch is migration: keep most of a webpack config and get large speedups. Rsbuild is its batteries-included wrapper.
- **Rolldown** (Rust) is the Rollup-compatible member of the group and sits beneath Vite 8, with Oxc as its parser, transformer, and minifier. SWC plays that compiler role for Turbopack and Rspack.

How to choose in practice: the framework usually decides (Next.js means Turbopack; most others mean Vite and Rolldown). For an existing webpack app that is too slow, Rspack is the cheapest move. Reach for esbuild directly for scripts, simple library builds, and server bundles. Speed claims depend on the benchmark; measure cold build, rebuild, and HMR on your own project.

**Try it:** Bundle the same small app with `npx esbuild src/main.ts --bundle --minify --outfile=out.js` and with your usual bundler. Time both with a cold cache, compare output size, and list what esbuild did not do for you (HTML, CSS handling, chunking, HMR).

**Resources**
- [esbuild: FAQ (Why is esbuild fast?)](https://esbuild.github.io/faq/)
- [Next.js: Turbopack](https://nextjs.org/docs/app/api-reference/turbopack)
- [Rspack: Introduction](https://rspack.rs/guide/start/introduction)

### Write a plugin

Writing one plugin is the fastest way to stop treating the bundler as a black box. The minimal useful plugin teaches the bundler a new file type by turning it into a JavaScript module in the `transform` hook.

```js
// vite-plugin-csv.js
export default function csv() {
  return {
    name: 'vite-plugin-csv',
    transform: {
      filter: { id: /\.csv$/ },
      handler(source) {
        const [header, ...rows] = source
          .trim()
          .split(/\r?\n/)
          .map((line) => line.split(','));
        const data = rows.map((row) =>
          Object.fromEntries(header.map((key, i) => [key, row[i]])),
        );
        return {
          code: `export default ${JSON.stringify(data)};`,
          map: null,
          moduleType: 'js',
        };
      },
    },
  };
}
```

Add it to `plugins: [csv()]` and `import rows from './prices.csv'` returns an array of objects, in dev and in the build.

What each part does:

- `name` appears in errors and warnings. Use the `vite-plugin-` prefix for Vite-only plugins and `rolldown-plugin-` (or `rollup-plugin-`) when it uses only universal hooks.
- The `filter` lets Rolldown skip calling the handler for other files, which keeps a JavaScript plugin from slowing a Rust bundler. The object form of a hook (`{ filter, handler }`) is what enables it.
- The handler returns JavaScript source as a string. `JSON.stringify` is the safe way to embed data in generated code.
- `map: null` says "no source map for this transform". If you modify JavaScript rather than replace a data file, generate a real map with `magic-string` so debugging still works.
- `moduleType: 'js'` tells Rolldown the result is JavaScript even though the extension is not.

The second pattern to know is the **virtual module**: `resolveId` claims an ID such as `virtual:build-info` and returns it prefixed with `\0`, and `load` returns generated code for that ID. Nothing exists on disk.

For anything Vite-specific, use the Vite hooks: `configureServer` to add dev middleware, `transformIndexHtml` to inject tags, `hotUpdate` for custom HMR. Add `enforce: 'pre'` if you must run before Vite's own transforms. Report problems with `this.error()` and `this.warn()` so they are attributed to your plugin, and add a `.d.ts` declaring `*.csv` modules so TypeScript accepts the import.

**Try it:** Build the CSV plugin above, then extend it: coerce numeric columns, throw a helpful `this.error` for rows with the wrong column count, and add a `virtual:build-info` module exporting the build time and git commit. Verify both in `vite` and in `vite build`.

**Resources**
- [Vite: Plugin API](https://vite.dev/guide/api-plugin)
- [Rolldown: Plugin API](https://rolldown.rs/apis/plugin-api)
- [Rollup: Plugin development](https://rollupjs.org/plugin-development/)

### Tree shaking

Tree shaking removes exports that nothing imports. It depends on ES modules being static: `import` and `export` are top-level declarations with string specifiers, so a bundler can know which bindings are used without running the code. It marks what is reachable from the entry points and leaves the rest out.

The catch is **side effects**. Unused code can be removed only if removing it changes nothing observable. The bundler must assume the worst about anything it cannot prove:

```js
export const a = 1;                       // removable when unused
export const b = createStore();           // a call: might do anything, so it stays
export const c = /* @__PURE__ */ createStore(); // you promise it is safe to drop
window.analytics = init();                // a side effect: always stays
```

Three levers control this:

- **`"sideEffects": false`** in a package's `package.json` promises that importing any of its modules has no effect beyond its exports, so whole unused modules, including those reached through re-exports, can be skipped. Use an array for exceptions: `["**/*.css", "./src/polyfill.js"]`.
- **`/* @__PURE__ */`** before a call or `new` expression marks that one call as removable if its result is unused. `/* @__NO_SIDE_EFFECTS__ */` on a function declaration marks every call to it.
- **Minification** finishes the job by deleting code proven unreachable, such as branches under `if (import.meta.env.DEV)` after constant replacement.

Imports that defeat it:

- **CommonJS.** `require` and `module.exports` are dynamic, so analysis is conservative. `import { debounce } from 'lodash'` pulls in the whole library; `lodash-es` or `lodash/debounce` does not.
- **Objects as namespaces.** `export default { a, b, c }` or a class with many methods is one binding. Use one, keep all. Prefer named exports of standalone functions.
- **Barrel files** (`index.ts` re-exporting everything) in packages without `sideEffects: false`: every re-exported module must be evaluated for possible effects.
- **Dynamic access**: `import * as ns` followed by `ns[key]` forces the bundler to keep every export.
- **Top-level work** in a module: registrations, prototype patches, eager singletons.

Tree shaking is a production-build behaviour. To check a result, do not trust the import statement; look in the bundle analysis or search the output for a function name that should be gone.

**Try it:** Create a module with four exported functions, one of which is assigned at the top level from a function call. Import one function, build with minification off, and read the output. Then add `/* @__PURE__ */` and watch the call vanish. Finally compare the bundle from `import { debounce } from 'lodash'` against `lodash-es`.

**Resources**
- [Rolldown: Dead code elimination](https://rolldown.rs/in-depth/dead-code-elimination)
- [webpack: Tree shaking](https://webpack.js.org/guides/tree-shaking/)
- [MDN: Tree shaking](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)

### Code splitting

Code splitting divides the bundle into chunks that load at different times, so the first page view downloads only what it needs. The mechanism is the dynamic import: `import('./Editor.js')` returns a promise for the module, and the bundler turns that module and everything only it depends on into a separate chunk.

```tsx
import { lazy, Suspense } from 'react';

const Settings = lazy(() => import('./routes/Settings'));

<Suspense fallback={<Spinner />}>
  <Settings />
</Suspense>
```

Where to split, in order of payoff:

1. **Routes.** Each page becomes a chunk. Most routers do this for you.
2. **Heavy, conditional features.** A rich-text editor, charting, a PDF viewer, an admin area: code most visits never use.
3. **Interaction-triggered code.** A modal's contents, loaded on click, ideally prefetched on hover or when idle.

The bundler also creates **shared chunks** automatically: a module used by two async chunks is moved into a common chunk so it is not downloaded twice.

**Vendor chunks** are about caching, not first load. Application code changes every deploy; `react` changes a few times a year. Putting stable dependencies in their own chunk lets returning users keep them cached. In Vite 8 this is configured through Rolldown:

```ts
build: {
  rolldownOptions: {
    output: {
      codeSplitting: {
        groups: [{ name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ }],
      },
    },
  },
}
```

One chunk holding every dependency is a poor default: it is invalidated whenever any dependency updates, and it forces code used by one route onto all of them. Group by stability and by where code is used, or leave chunking automatic until you have a measured reason.

Trade-offs to keep in view. Too few chunks means large downloads and poor cache reuse. Too many means request overhead, worse compression, and waterfalls where a chunk's own imports are discovered late. Every split point needs a loading state and an error state. And deploys break old tabs: a client holding last week's HTML asks for a chunk hash that no longer exists. Handle `vite:preloadError` (or catch the import rejection) by reloading, and keep previous assets on the server for a period.

**Try it:** Convert one route and one heavy component to dynamic imports. Compare the build report before and after, then load the page with the Network panel open and note when each chunk is requested. Throttle to "Slow 4G" and judge whether the loading state is acceptable.

**Resources**
- [MDN: `import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [Rolldown: Manual code splitting](https://rolldown.rs/in-depth/manual-code-splitting)
- [React: `lazy`](https://react.dev/reference/react/lazy)

### Minification and compression

These are two separate stages that both shrink what is sent. Minification rewrites the code at build time; compression encodes the bytes at the server or CDN. You want both, and you should measure the result after both.

**Minification** does three things:

- Removes whitespace and comments.
- **Mangles** local names: `function total(items)` becomes `function t(e)`. Top-level names in a module bundle and property names are left alone by default, because renaming properties is unsafe unless the tool can see every use.
- **Compresses** syntax: folds constants, inlines single-use functions, simplifies conditionals, and deletes unreachable code. This is the step that removes `if (false) { … }` after `import.meta.env.DEV` or `process.env.NODE_ENV` has been replaced with a literal.

Minifiers differ in speed and output. Terser (JavaScript) is the slowest and squeezes slightly more out. esbuild, SWC, and Oxc are far faster with output a few percent larger at most. Vite 8 defaults to Oxc (`build.minify: 'oxc'`; `'terser'` and `'esbuild'` remain options) and to Lightning CSS for stylesheets. Minified code breaks things that rely on `Function.prototype.name` or on `fn.toString()`; configure `keep_fnames`-style options where a library needs them, and always generate source maps.

**Compression** applies to text responses (HTML, CSS, JavaScript, SVG, JSON):

- **gzip** is universally supported and the baseline.
- **Brotli** (`br`) typically produces JavaScript 15 to 20 percent smaller than gzip. At maximum quality (11) it is slow, so precompress static assets at build or deploy time and use a mid level (4 to 6) for dynamic responses.
- **Zstandard** (`zstd`) compresses and decompresses quickly at ratios near Brotli; browser support is newer, so serve it with a fallback.

The browser advertises support in `Accept-Encoding` and the server answers with `Content-Encoding`. Most CDNs handle this automatically; verify it in the Network panel instead of assuming. Do not compress already-compressed formats such as JPEG, WebP, or WOFF2.

Two consequences. First, minified size is not transfer size: repetitive code compresses very well, so judge changes by compressed bytes. Second, compression is not free for the client: the browser still has to decompress, parse, and compile the full minified size, which is why shipping less JavaScript beats compressing more.

**Try it:** Build an app and take the largest chunk. Record its raw size, then `gzip -9` and `brotli -q 11` sizes. Rebuild with `build.minify: false` and record the same three numbers. Note how much minification saves before and after compression, and check which `Content-Encoding` your deployed site actually serves.

**Resources**
- [MDN: Compression in HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression)
- [Vite: `build.minify`](https://vite.dev/config/build-options#build-minify)
- [Terser: Options](https://terser.org/docs/options/)

### Asset handling

The goal is that a returning visitor downloads only what changed. The technique is content hashing: the build names each file after a hash of its contents, such as `assets/index-B7xK2a9f.js`. If the content changes, the name changes, so the URL can be cached forever.

That gives two cache policies:

```http
Cache-Control: public, max-age=31536000, immutable
```

for everything under `assets/` with a hash in its name, and

```http
Cache-Control: no-cache
```

for `index.html`, which must be revalidated on every visit because it is the file that points at the current hashes. Get this backwards and users either re-download everything or stay stuck on an old version.

Hashes cascade. A chunk that imports `vendor-abc123.js` contains that file name, so when the vendor chunk's hash changes, every importer's content and hash change too. Isolating the runtime, and Vite's experimental `build.chunkImportMap` (which moves the mapping into an import map), limit that ripple.

How Vite treats imports of non-code files:

- `import imgUrl from './hero.png'` returns the final URL. The file is emitted with a hash.
- Assets smaller than `build.assetsInlineLimit` (4096 bytes by default) are inlined as base64 data URLs to save a request. Base64 adds about a third to the size and the bytes cannot be cached separately, so keep the limit small.
- Suffixes change the behaviour: `?url` forces a URL, `?raw` imports the contents as a string, `?inline` and `?no-inline` override the threshold.
- `new URL('./file.bin', import.meta.url)` is the standards-based way to reference an asset and is understood by the bundler.
- CSS `url()` references are resolved and hashed the same way; see CSS in the build.
- `public/` is copied verbatim with no hashing. Use it only for files that need a fixed name, like `robots.txt` or `favicon.ico`.

Images and fonts need work the bundler does not do by default: generate modern formats (AVIF, WebP) and multiple sizes for `srcset`, subset fonts and serve WOFF2, and preload the one or two fonts that block first render. Use a plugin, an image CDN, or the framework's image component.

If the site is served from a subpath or a separate asset domain, set `base` so emitted URLs are correct.

**Try it:** Build twice without changes and confirm the hashes are identical. Change one line in one component, rebuild, and list which file names changed and why. Then inspect your deployed site's response headers for the HTML and for a hashed asset, and fix the policy if either is wrong.

**Resources**
- [Vite: Static asset handling](https://vite.dev/guide/assets)
- [web.dev: Prevent unnecessary network requests with the HTTP Cache](https://web.dev/articles/http-cache)
- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)

### CSS in the build

CSS goes through its own pipeline, parallel to the JavaScript one, and five jobs happen in it.

- **Bundling.** `@import` in plain CSS makes the browser fetch files one after another. The build inlines imports into one stylesheet per chunk and rewrites relative `url()` paths so they still point at the right asset, which is then hashed like any other.
- **Prefixing.** Some properties still need vendor prefixes in some target browsers. A tool adds the ones your targets need and can strip stale ones you wrote by hand.
- **Syntax lowering.** The CSS equivalent of transpiling: nesting flattened to plain rules, `light-dark()` and `color-mix()` expanded, range media queries rewritten to `min-width`/`max-width`, modern colour spaces given fallbacks. As with JavaScript, only syntax can be lowered. Nothing makes container queries or `:has()` work in a browser that lacks them.
- **Minifying.** Whitespace, shorthand merging, shorter colour and number forms, duplicate rule merging.
- **CSS Modules.** For `*.module.css` files, class names are rewritten to unique names and the mapping is exported to JavaScript, giving locally scoped styles with no runtime.

```css
/* input */
.card {
  inline-size: 20rem;
  & > h2 { margin: 0; }
}
@media (width >= 40rem) { .card { inline-size: 30rem; } }

/* output for older targets, roughly */
.card { inline-size: 20rem; }
.card > h2 { margin: 0; }
@media (min-width: 40rem) { .card { inline-size: 30rem; } }
```

Two tools do this work. **PostCSS** is a JavaScript framework that parses CSS to an AST and runs plugins over it: `autoprefixer`, `postcss-preset-env`, `postcss-nesting`, `cssnano`. It does nothing by itself; behaviour is whatever your `postcss.config.js` lists, and plugin order matters. **Lightning CSS** is a single Rust tool that bundles, prefixes, lowers syntax, minifies, and handles CSS Modules in one pass, driven by browser targets, and is much faster.

In Vite 8, `css.transformer` defaults to `'postcss'`: Vite inlines imports, rebases URLs, runs any PostCSS config it finds, and handles CSS Modules, then minifies with Lightning CSS using `build.cssTarget`. Autoprefixer is not included unless you add it. Setting `css.transformer: 'lightningcss'` moves the whole pipeline to Lightning CSS, configured under `css.lightningcss`; PostCSS plugins then no longer run, and the Vite team has said it plans to make this the default in the next major. Sass and Less are separate preprocessors that run first; install the package and Vite picks them up. Tailwind ships its own Vite plugin.

Things that go wrong: CSS order differing between dev and build when the same file is imported from several chunks, because order follows chunk loading; prefixes or lowering missing because no targets were configured for the CSS tool; and forgetting that CSS is code split too (`build.cssCodeSplit`), so a lazy route's styles arrive with its chunk.

**Try it:** Write a stylesheet using nesting, `light-dark()`, and a range media query. Build with `build.cssTarget` set to an old Safari version and read the emitted CSS. Then switch `css.transformer` to `'lightningcss'`, rebuild, and diff. Finally rename the file to `.module.css` and inspect the generated class names.

**Resources**
- [Vite: Features (CSS)](https://vite.dev/guide/features#css)
- [Lightning CSS: Transpilation](https://lightningcss.dev/transpilation.html)
- [PostCSS: documentation](https://github.com/postcss/postcss#readme)

### Bundle analysis

You cannot reduce a bundle by guessing. Analysis tools draw the chunk graph as a treemap: each rectangle is a module, sized by bytes, nested by package and chunk. Thirty seconds of looking usually reveals the problem.

Tools:

- **Vite DevTools** (`devtools: true` with `@vitejs/devtools`) shows Rolldown's modules, chunks, assets, and why each module was included.
- **rollup-plugin-visualizer** emits an HTML treemap for Rollup, Rolldown, and Vite builds. Turn on its gzip and Brotli sizes.
- **webpack-bundle-analyzer** for webpack and Rspack; Rsdoctor for deeper Rspack analysis.
- **source-map-explorer** works on any bundle with a source map, whatever built it.
- **Chrome DevTools Coverage** shows at runtime how much of each loaded file executed. A chunk that is 70 percent unused on first load is a splitting candidate.

Read three sizes: *rendered* or *stat* (before minification), *parsed* (minified, what the browser compiles), and *gzip/Brotli* (what crosses the network). Prioritise by compressed size for download cost and by parsed size for main-thread cost.

What to look for, roughly in order of how often it is the answer:

- **A large library used for one function.** Date libraries with all locales, `lodash` instead of per-function imports, a full icon set when ten icons are used, a syntax highlighter with every language.
- **Duplicates.** Two versions of the same package because two dependencies pin different ranges. `pnpm why <pkg>` shows who wants which.
- **Code in the wrong chunk.** A charting or editor library sitting in the entry chunk because one static import reaches it.
- **Polyfills** for browsers you no longer support.
- **Large JSON or data** files imported as modules.
- **Both ESM and CJS builds** of one library pulled in by different importers.
- **Dev-only code** that was not stripped.

Fixes map to the cause: import narrower entry points, replace the library with a smaller one or a platform API (`Intl`, `fetch`, `structuredClone`), dynamic-import the heavy feature, dedupe versions, tighten targets.

Then keep it fixed with a budget; see Size budgets in CI.

**Try it:** Run a visualiser on a real project. Write down the five largest modules in the initial chunks and, for each, whether it is needed on first load. Remove or defer the worst one and record the before and after compressed size of the entry chunk.

**Resources**
- [Vite DevTools: Guide](https://devtools.vite.dev/guide/)
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)
- [Chrome DevTools: Coverage](https://developer.chrome.com/docs/devtools/coverage)

### Size budgets in CI

Bundles grow one reasonable pull request at a time. Nobody decides to add 200 kB; a date picker here and an SDK there do it. A size budget turns that drift into an explicit decision by failing the build when an output exceeds a limit, in the pull request that caused it, while the author still remembers why.

`size-limit` is the common tool. With `@size-limit/file` it measures built files after compression (Brotli by default):

```json
{
  "scripts": { "size": "vite build && size-limit" },
  "size-limit": [
    { "name": "entry JS", "path": "dist/assets/index-*.js", "limit": "90 kB" },
    { "name": "all CSS", "path": "dist/assets/*.css", "limit": "20 kB" }
  ]
}
```

`npx size-limit` exits non-zero when a limit is exceeded, so adding `npm run size` to the pull-request workflow is enough to gate merges. `--json` gives machine-readable output, `--why` explains what is inside, and a GitHub Action can comment the before-and-after sizes on each pull request. For libraries, the `import` option measures what a consumer pays for importing one named export after tree shaking.

Alternatives: webpack and Rspack have `performance: { hints: 'error', maxEntrypointSize, maxAssetSize }`, which fails the build itself. Vite's `build.chunkSizeWarningLimit` only prints a warning, so it is not a gate. Lighthouse CI can enforce budgets on resource sizes and on timing metrics in a real page load.

Designing a budget that people respect:

- **Measure what users download.** Compressed size, for the files needed on first load of key routes. A budget on total `dist` size punishes adding a lazy route and misses a bloated entry.
- **Use globs for hashed names**, as above.
- **Start from today.** Set the limit just above the current size so it acts as a ratchet. An aspirational limit that fails on day one gets deleted.
- **Leave little headroom.** A limit 50% above current size will not fire until the damage is done.
- **Make raising it visible.** The limit lives in the repository, so increasing it is a reviewed diff with a stated reason. That conversation is the point.
- **Lower it after wins.** When a bundle diet saves 30 kB, tighten the limit the same day or the saving erodes.

When the check fails, the response is the bundle analysis loop: find what was added, decide whether it belongs in the initial load, and either defer it, replace it, or consciously accept it. Size is a proxy; pair it with a lab or field metric (LCP, INP, Total Blocking Time) so you know the bytes you guard are the ones that matter.

**Try it:** Add `size-limit` to a project with limits about 2% above current sizes and wire it into CI. Open a pull request that statically imports a heavy library and watch it fail. Fix it with a dynamic import, confirm the check passes, then tighten the limit.

**Resources**
- [size-limit](https://github.com/ai/size-limit)
- [web.dev: Performance budgets 101](https://web.dev/articles/performance-budgets-101)
- [webpack: Performance](https://webpack.js.org/configuration/performance/)

### Module preloading

With ES modules the browser discovers dependencies by downloading and parsing each file. If `main.js` imports `app.js`, which imports `store.js`, which imports `utils.js`, that is four sequential round trips before anything executes, even though all four could have been fetched in parallel. That is the import waterfall. Bundling shortens it, but code splitting reintroduces it: an entry chunk imports shared chunks, and a lazy route chunk has dependencies of its own.

`<link rel="modulepreload">` tells the browser about a module before it is discovered:

```html
<script type="module" src="/assets/index-B7xK2a.js"></script>
<link rel="modulepreload" href="/assets/react-Dk3lP0.js">
<link rel="modulepreload" href="/assets/store-9fQ2mA.js">
```

The browser fetches each listed module, parses and compiles it, and stores it in the document's module map, ready to link when an `import` reaches it. It does not execute it. This differs from `rel="preload" as="script"`, which only fills the HTTP cache and uses a different credentials mode from module requests, so it can result in a double download. Use `modulepreload` for modules. It is Baseline and supported in all current engines.

Bundlers generate these for you. Vite injects `modulepreload` links into `index.html` for the entry chunk's static imports. For dynamic imports it rewrites the call so that, when `import('./Settings')` runs, the chunks Settings depends on (and its CSS) are requested in parallel with it instead of after it. `build.modulePreload` configures this; its `resolveDependencies` function lets you filter the list, and its polyfill is only relevant for old browsers.

Guidelines:

- Preload what the current page is certain to need. Each hint competes for bandwidth with images, fonts, and CSS, and a long list of preloads delays the things that affect first paint.
- For code the user will *probably* need next (the next route), use a lower-priority strategy: `rel="prefetch"`, or trigger the dynamic import on hover, focus, or idle.
- If you server-render or use a backend framework, read the build manifest (`build.manifest`) to emit the right preload links for each route.
- Diagnose in the Network panel: a staircase of script requests, each starting when the previous finished, is a waterfall. The Initiator column shows which module requested which.

**Try it:** Add a lazily loaded route that imports a shared chunk. In the Network panel, check whether the route chunk and its dependency start at the same time. Then remove the generated `modulepreload` links from a built `index.html` by hand, reload with throttling on, and compare the waterfall.

**Resources**
- [MDN: `rel="modulepreload"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/modulepreload)
- [web.dev: Preload modules](https://web.dev/articles/modulepreload)
- [Vite: `build.modulePreload`](https://vite.dev/config/build-options#build-modulepreload)

### ESM vs CJS in practice

JavaScript has two module systems in circulation. **CommonJS** (`require`, `module.exports`) is Node's original format: synchronous, dynamic, and evaluated as it loads. **ES modules** (`import`, `export`) are the language standard: static structure, asynchronous loading, live bindings, and top-level `await`. Browsers only understand ESM. Most friction comes from the two meeting inside `node_modules`.

How Node decides what a file is:

- `.mjs` is always ESM and `.cjs` is always CommonJS.
- `.js` follows the nearest `package.json`: `"type": "module"` means ESM; otherwise CommonJS.

Interop rules:

- ESM can `import` CommonJS. The default import is `module.exports`; named imports work only when Node's static analysis can detect them.
- CommonJS can `require()` ESM in every currently supported Node release, provided the ESM graph has no top-level `await` (otherwise `ERR_REQUIRE_ASYNC_MODULE`). Before Node 22.12 and 20.19 this threw `ERR_REQUIRE_ESM`, which is why dual packages became common.
- ESM has no `__dirname` or `require`. Use `import.meta.dirname`, `import.meta.filename`, and `import.meta.url`.
- Relative imports in Node ESM need the file extension: `./util.js`.

The **`exports` map** in `package.json` defines a package's public entry points and hides everything else:

```json
{
  "name": "tiny-lib",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  }
}
```

Conditions are matched in order, top to bottom, so `types` goes first and `default` last. Common conditions are `import`, `require`, `node`, `browser`, and `default`.

A **dual package** ships both formats, with `import` and `require` conditions pointing to different files, each with its own type declarations (`.d.mts` and `.d.cts`). The risk is the **dual package hazard**: one program loads both copies, so there are two instances of module state and `instanceof` fails across them.

Since `require(esm)` works everywhere that is still maintained, the simplest correct choice for a new library is ESM-only. Ship dual only if you must support consumers on old Node or old bundlers. For TypeScript, set `"module": "nodenext"` when the code runs in Node, or `"module": "preserve"` with `"moduleResolution": "bundler"` when a bundler consumes it. Validate with `publint` and Are the Types Wrong.

**Try it:** Create an ESM-only package with an `exports` map. From a scratch project, `import` it from an `.mjs` file and `require` it from a `.cjs` file on current Node. Add a top-level `await` to the package and read the error from `require`. Then try to import a file not listed in `exports`.

**Resources**
- [Node.js: Packages](https://nodejs.org/api/packages.html)
- [Node.js: Loading ECMAScript modules using `require()`](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require)
- [TypeScript: Modules theory](https://www.typescriptlang.org/docs/handbook/modules/theory.html)

### Publishing a library

A library build has different goals from an app build. You are producing input for someone else's bundler, so the output should be readable, modular ESM with accurate types, and it should leave decisions (minification, targets, polyfills, which copy of React) to the consumer.

A sound `package.json`:

```json
{
  "name": "tiny-date",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
  },
  "files": ["dist"],
  "sideEffects": false,
  "peerDependencies": { "react": "^18.0.0 || ^19.0.0" },
  "engines": { "node": ">=22" }
}
```

The decisions behind it:

- **Build.** `tsdown` (Rolldown-based) or Vite library mode produce ESM and declarations; for a small package, plain `tsc` output is enough. Do not minify. Avoid collapsing everything into one file if you can keep modules separate, since that helps consumers' tree shaking. Ship source maps.
- **Types.** Emit `.d.ts` next to the JavaScript and point the `types` condition at it. Enabling `isolatedDeclarations` makes declaration generation fast and forces explicit public types.
- **`sideEffects: false`** tells bundlers that unused modules can be dropped. List any files that do have effects, such as CSS.
- **`peerDependencies`** are for things the host app must provide exactly one of: React, a framework, a shared context library. A second bundled copy of React breaks hooks. Use wide ranges. Regular `dependencies` are for implementation details; keep them few, because every one becomes your users' install and audit burden.
- **`files`** is an allowlist of what goes in the tarball. Without it you may publish tests, fixtures, or secrets.
- **Externalise** all dependencies and peer dependencies in the build so they are not inlined.

Before publishing:

1. `npm pack --dry-run` and read the file list.
2. `npx publint` and `npx @arethetypeswrong/cli --pack` to check `exports` and type resolution under every module mode.
3. Install the tarball in a scratch app and import it.

Version with semver: breaking changes to the public API, including type changes and raising the minimum Node version, are a major bump. Automate versions and changelogs with Changesets or a similar tool.

Publish from CI using **trusted publishing**: npm verifies the workflow's OIDC identity, so no long-lived token is stored, and a provenance attestation linking the package to its source commit is generated automatically. It needs npm 11.5.1 or later and `id-token: write` permission in the workflow.

**Try it:** Take a two-function utility, build it with `tsdown` or `tsc`, and run `publint` and `attw` until both are clean. Pack it, install the tarball in a Vite app, import one function, and confirm in the built output that the other function is absent.

**Resources**
- [tsdown: Getting started](https://tsdown.dev/guide/getting-started)
- [npm Docs: Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers)
- [publint: Rules](https://publint.dev/rules)

### Monorepo basics

A monorepo keeps several packages (apps, shared UI, config, utilities) in one repository. The gains are atomic changes across packages, one set of tooling, and no publish-and-bump cycle for internal code. The costs are tooling to keep builds fast and discipline about boundaries. Two layers make it work.

**Workspaces** link the packages. With pnpm, a root `pnpm-workspace.yaml` lists them:

```yaml
packages:
  - apps/*
  - packages/*
```

A package depends on a sibling with the workspace protocol:

```json
{ "dependencies": { "@acme/ui": "workspace:*" } }
```

`pnpm install` symlinks `@acme/ui` into the consumer's `node_modules`, so edits are visible immediately. `workspace:` refuses to fall back to the registry, and on publish it is rewritten to a real version range. pnpm's strict `node_modules` layout means a package can only import what it declares, which catches phantom dependencies that would break once the package is published or moved. **Catalogs** define a dependency version once in `pnpm-workspace.yaml` and reference it as `catalog:` everywhere, so every package uses the same React or TypeScript. Run commands on a subset with `pnpm --filter @acme/web build`, or `--filter "...[origin/main]"` for packages changed since a ref and their dependents.

**Task runners** make it fast. Turborepo and Nx both build a graph of packages and tasks, run tasks in dependency order and in parallel, and cache results keyed on a hash of inputs.

```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

`^build` means "build my dependencies first". `outputs` tells Turborepo which files to store and restore. On a cache hit the task is skipped and its outputs and logs are replayed; with remote caching, CI and teammates share those hits, so unchanged packages are never rebuilt. `turbo run test --affected` limits work to what a change touches. Nx offers the same core with more built in: project graph visualisation, generators, and module-boundary lint rules.

Common mistakes: undeclared inputs (an env variable or a root config file not in the hash) causing stale cache hits, missing `outputs` so a hit restores nothing, circular dependencies between packages, and one shared `tsconfig` or ESLint config that forces everything to rebuild on any change. Decide early whether internal packages are built (`dist`) or consumed as source by the app's bundler; the latter is simpler for app-only repos.

**Try it:** Create a pnpm workspace with `apps/web` and `packages/ui`, linked by `workspace:*`. Add Turborepo with the config above. Run `turbo run build` twice and observe the cache hit, then edit a file in `packages/ui` and see which tasks rerun.

**Resources**
- [pnpm: Workspace](https://pnpm.io/workspaces)
- [Turborepo: Configuring tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks)
- [Nx: Intro](https://nx.dev/getting-started/intro)

### Dependency hygiene

Dependencies are code you ship and do not review. A typical frontend project has a few dozen direct dependencies and over a thousand transitive ones. Hygiene is the routine that keeps that set small, current, and trustworthy.

**Know what you have.** The lockfile is the source of truth for what gets installed; commit it and install in CI with `pnpm install --frozen-lockfile` or `npm ci` so builds are reproducible. `pnpm why <pkg>` (or `npm explain`) shows which dependents require a package and at which versions. `knip` reports dependencies nothing imports. Before adding a package, check its size, maintenance, and dependency count, and ask whether the platform already does the job.

**Dedupe.** When two dependents accept overlapping ranges, the lockfile can still hold two versions resolved at different times. `pnpm dedupe` (or `npm dedupe`) collapses them where ranges allow. Duplicates that ranges do not allow need an upgrade of the lagging dependent, or as a last resort an `overrides` entry. Duplicates cost bundle size and, for libraries with singleton state, correctness.

**Audit.** `pnpm audit` and `npm audit` compare your tree against the advisory database. Triage by reachability: a ReDoS in a build-time tool is not the same risk as a vulnerability in code that runs in users' browsers or on your server. Use `--prod` to focus on shipped dependencies. Fix by updating; override a transitive version when the maintainer is slow.

**Automate updates.** Renovate or Dependabot open pull requests when new versions appear. Configure them or they become noise: group related packages (all ESLint plugins, all `@types`), schedule weekly, automerge patch and minor updates of dev dependencies when CI passes, and keep major updates as individual reviewed pull requests. This only works if your tests are trustworthy, which is the practical link between this module and the testing one.

**Supply-chain defences.** Several large npm compromises in 2025 spread through hijacked maintainer accounts and install scripts. Countermeasures that are now standard:

- A cooldown before adopting new releases: `minimumReleaseAge` in pnpm (current versions default to one day) and in Renovate. Most malicious versions are removed within hours.
- No install scripts by default: pnpm does not run dependency lifecycle scripts unless you allow the package.
- Pin GitHub Actions to commit SHAs, and publish your own packages with trusted publishing and provenance.
- Never run a blanket "update everything" without the lockfile diff being reviewed.

Small, frequent updates are cheaper and safer than an annual migration.

**Try it:** In a real project run `pnpm dedupe --check`, `pnpm audit --prod`, and `npx knip`. Fix one finding from each. Then add a Renovate or Dependabot config with grouping and a weekly schedule and review the first batch of pull requests it opens.

**Resources**
- [pnpm: Mitigating supply chain attacks](https://pnpm.io/supply-chain-security)
- [Renovate: Minimum release age](https://docs.renovatebot.com/key-concepts/minimum-release-age/)
- [GitHub Docs: About Dependabot version updates](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates)

### Toy bundler

Building a bundler in about a hundred lines removes the mystery from everything else in this module. The aim is one output file that runs an app made of several ES modules. Leave out `node_modules` resolution, tree shaking, and source maps.

The steps mirror a real bundler:

1. **Parse** the entry file into an AST with a real parser (`acorn`, `@babel/parser`, or `oxc-parser`). Do not use regular expressions; they fail on strings and comments that contain the word `import`.
2. **Collect dependencies** by reading every `ImportDeclaration`'s `source.value`.
3. **Resolve** each specifier relative to the importing file's directory, adding the extension if needed.
4. **Recurse** with a queue, assigning each file an ID and storing it in a map keyed by absolute path so shared modules are processed once and cycles terminate.
5. **Transform** each module so it can run inside a function. The easy route, used by Minipack, converts ESM to CommonJS so `import`/`export` become `require` calls and assignments to `exports`.
6. **Emit** a single file: a table of module functions plus a small runtime.

The runtime is the instructive part:

```js
(function (modules) {
  const cache = {};
  function require(id) {
    if (cache[id]) return cache[id].exports;
    const [fn, mapping] = modules[id];
    const module = (cache[id] = { exports: {} });
    fn((specifier) => require(mapping[specifier]), module, module.exports);
    return module.exports;
  }
  require(0);
})({
  0: [function (require, module, exports) { /* entry code */ }, { './message.js': 1 }],
  1: [function (require, module, exports) { /* message.js code */ }, {}],
});
```

Each module is wrapped in a function so its variables stay private. `mapping` translates the specifier a module wrote into the numeric ID the bundler assigned. The cache is populated *before* the module function runs, which is what makes circular imports return a partially filled `exports` object instead of recursing forever.

This is the "wrapped modules" design that webpack uses. Rollup, Rolldown, and esbuild instead **scope-hoist**: they place all modules in one scope and rename colliding bindings, which yields smaller, faster output and makes tree shaking natural, but is much harder to write. As extensions, try bare-specifier resolution through `package.json` `exports`, a dynamic `import()` that emits a second file, or dropping unused exports.

**Try it:** Write the bundler against a three-file app where two files import a shared third and one pair forms a cycle. Run the output with Node and in a browser. Then explain, from your own code, why a module's top-level code runs only once.

**Resources**
- [Minipack: a simplified bundler explained](https://github.com/ronami/minipack)
- [Rolldown: Why bundlers](https://rolldown.rs/in-depth/why-bundlers)
- [AST Explorer](https://astexplorer.net/)

### Bundle diet

This project applies the optimisation skills to a real application with numbers before and after. The discipline is measure, change one thing, measure again.

**1. Baseline.** Pick a real app, yours or an open-source one. Build for production and record:

- Compressed (Brotli or gzip) size of all JavaScript and CSS needed for the first load of the main route, and the total across the app.
- Number of requests and the shape of the waterfall for that first load.
- Lab metrics on a throttled mobile profile in Lighthouse or the Performance panel: LCP, Total Blocking Time, and main-thread script evaluation time.
- A saved treemap from your visualiser.

**2. Find the offenders.** From the treemap and the Coverage panel, list the largest modules in the initial chunks and how much of each runs on first load. Rank by compressed bytes saved per hour of effort.

**3. Apply fixes, one per commit**, re-measuring each time:

- Replace or remove heavy dependencies: a date library for `Intl.DateTimeFormat`, a utility belt for native methods, a full icon pack for individual icon imports.
- Fix imports that defeat tree shaking (CommonJS builds, namespace objects, side-effectful barrels).
- Dedupe duplicated packages.
- Dynamic-import routes and heavy, conditional features; load on interaction where it suits.
- Drop polyfills and syntax lowering your real audience does not need by raising the target.
- Strip dev-only code and large inline data; move big JSON to a fetch.
- Check compression and caching headers on the deployed site.

**4. Guard it.** Add a size budget to CI, set just above the new size, so the saving survives.

**5. Write it up.** A short table of each change with bytes saved and the metric movement, plus what you tried that did not help. Negative results are useful: a change that saves 30 kB minified but 1 kB compressed tells you something about where to look next.

Be honest about what the numbers mean. Download size matters most on slow networks; parse and execution time matter most on slow devices; a smaller bundle that moves a critical module behind a waterfall can be a regression for users. Verify with the user-facing metrics, not only the byte count.

**Try it:** Set a target before starting, for example "cut first-load JavaScript by 30 percent compressed". Work through the steps above and stop when you reach the target or run out of changes that pay for themselves. Present the before and after treemaps side by side.

**Resources**
- [web.dev: Reduce JavaScript payloads with code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)
- [Chrome DevTools: Coverage](https://developer.chrome.com/docs/devtools/coverage)
- [size-limit](https://github.com/ai/size-limit)

### Publish a package

The final project is to take a small utility library from an empty directory to a published, typed, tree-shakeable package, with the release automated. Pick something tiny and real: a few date helpers, a `clamp`/`range`/`chunk` set, a typed event emitter. The value is in the packaging, not the code.

Steps:

1. **Source.** TypeScript, one function per module, re-exported from `src/index.ts` with named exports. No top-level side effects. Explicit return types on public functions.
2. **Tests.** Vitest unit tests, including type tests with `expectTypeOf` for anything generic.
3. **Build.** `tsdown` or `tsc` to `dist/`: ESM `.js`, `.d.ts`, and source maps. No minification.
4. **Manifest.** `"type": "module"`, an `exports` map with `types` first, `"files": ["dist"]`, `"sideEffects": false`, `engines`, `repository`, `license`, and no runtime dependencies if you can manage it.
5. **Verify the artifact.** `npm pack --dry-run` for the file list; `npx publint`; `npx @arethetypeswrong/cli --pack`. Fix every finding.
6. **Verify as a consumer.** Install the packed tarball into a fresh Vite app, import one function, build, and confirm the others are not in the output. Import it from a CommonJS file with `require` on current Node. Check that editor autocomplete and go-to-definition work.
7. **Document.** A README with install, a usage example, the API, and stated requirements (Node version, browser baseline, no polyfills included).
8. **Release.** Choose a name (a scope such as `@you/name` avoids collisions). Configure trusted publishing for the repository on npmjs.com and publish from a GitHub Actions workflow with `id-token: write`; provenance is attached automatically. Use Changesets for the version bump and changelog. Start at `0.x` while the API is unsettled and move to `1.0.0` when you are prepared to keep it stable.
9. **After release.** Install it by name in a clean project. Check the package page for the provenance badge and the unpacked size.

Typical mistakes this project surfaces: `types` not resolving under `moduleResolution: "nodenext"` because of a missing extension or wrong condition order; tests or source accidentally published; a default export that confuses CommonJS consumers; a "tree-shakeable" claim that fails because of a top-level side effect; and breaking type changes shipped as a patch.

**Try it:** Complete all nine steps and publish version `0.1.0`. Then make a deliberately breaking change to one function's signature, ship it correctly as a new version with a changelog entry, and upgrade your consumer app to confirm the release notes told you what to change.

**Resources**
- [Are the types wrong?](https://arethetypeswrong.github.io/)
- [npm Docs: Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers)
- [Node.js: Packages](https://nodejs.org/api/packages.html)
