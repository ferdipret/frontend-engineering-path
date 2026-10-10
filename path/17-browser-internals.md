# Browser Internals

> Stage: 3 · Advanced
> Understanding what the browser does with your code turns performance and correctness from folklore into reasoning.

## Architecture

- [ ] Multi-process architecture - browser, renderer, GPU, and network processes; site isolation
- [ ] Navigation - what happens from URL commit to first frame inside the browser
- [ ] Back/forward cache and prerendering - how pages are frozen and restored or rendered ahead of time, and what blocks each
- [ ] The main thread - everything that competes for it

## Rendering pipeline

- [ ] Parsing - HTML tokenising and tree construction; the preload scanner
- [ ] Parser blocking - how scripts and stylesheets block parsing and rendering
- [ ] CSSOM and style - how styles are matched and computed
- [ ] Layout - box tree, formatting contexts, what invalidates layout
- [ ] Paint and layers - paint records, layerisation, what promotes a layer
- [ ] Compositing - the compositor thread, tiles, rasterisation, GPU
- [ ] Input handling and scrolling - hit testing, compositor-thread scrolling, and why non-passive listeners block it
- [ ] The frame lifecycle - input, rAF, style, layout, paint, composite within 16ms
- [ ] Invalidation - which CSS properties trigger layout, paint, or composite only

## JavaScript engines

- [ ] Engine pipeline - parse, bytecode, interpreter, and tiered JIT compilation
- [ ] Hidden classes and inline caches - why object shape stability matters
- [ ] Deoptimisation - what makes optimised code bail out
- [ ] Garbage collection - generational, incremental, and concurrent collection
- [ ] Event loop in detail - tasks, microtasks, rendering opportunities, per the HTML spec
- [ ] WebAssembly - what it is, when to use it, how it interoperates with JS

## Networking internals

- [ ] Connection management - connection pools, HTTP/2 streams, QUIC
- [ ] Resource prioritisation - how the browser orders requests
- [ ] HTTP cache - memory cache, disk cache, and cache partitioning
- [ ] Service worker lifecycle - install, activate, fetch interception

## Reading the source of truth

- [ ] Read a spec - find the answer to a real question in the HTML, CSS, or ECMAScript spec
- [ ] Track platform changes - follow release notes, Baseline, and Interop
- [ ] File a browser bug - write a minimal reproduction and report it

## Practice

- [ ] Trace a frame - record a trace and label every pipeline stage in a single frame
- [ ] Explain a jank - reproduce a dropped-frame scenario and attribute it to a specific stage

## Resources

- [Inside look at modern web browser (4 parts)](https://developer.chrome.com/blog/inside-browser-part1)
- [RenderingNG](https://developer.chrome.com/docs/chromium/renderingng)
- [Web Browser Engineering (free book)](https://browser.engineering/)
- [V8 blog](https://v8.dev/blog)
