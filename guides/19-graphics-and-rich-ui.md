# Graphics, Visualisation, and Rich Interaction: Guide

## Toolkit

### DevTools and tooling

Start with the **Elements panel** for SVG: SVG is DOM, so you can select a `<path>`, edit `d` or `viewBox` live, and watch the result. Chrome and Firefox both draw the element's bounding box on hover, which is the fastest way to see why a transform or `viewBox` is off.

For canvas and animation work, live in the **Performance panel**. Record a few seconds of interaction and read the Frames track: long frames show as red or yellow blocks, and the Main track tells you whether the time went to script, style, layout, or paint. Open the **Rendering** drawer tab (Command Menu, type "Rendering") and turn on *Frame rendering stats* for a live FPS and GPU memory meter, *Paint flashing* to see what repaints, and *Layer borders* to see what was promoted to its own compositor layer. In the **Sensors** drawer you can force touch and emulate device orientation; device mode's toolbar sets a device pixel ratio so you can test high-DPI canvas scaling without a Retina display.

For GPU work: `chrome://gpu` reports whether WebGL and WebGPU are hardware accelerated on your machine. The [Spector.js](https://spector.babylonjs.com/) extension captures one WebGL frame and lists every draw call with its state and shaders. For Three.js, `renderer.info` gives draw call, triangle, and texture counts per frame, and the manual's debugging page covers helpers such as `AxesHelper` and `CameraHelper`.

For media: the **Media panel** in Chrome DevTools shows every player on the page, its decoder, dropped frames, and an event timeline; `chrome://webrtc-internals` (and `about:webrtc` in Firefox) shows live ICE candidates and bitrate graphs for each `RTCPeerConnection`. The **WebAudio** panel shows the context's state and render capacity.

Command-line and playground tools worth installing: `svgo` and its browser front end [SVGOMG](https://jakearchibald.github.io/svgomg/), [Observable](https://observablehq.com/) notebooks for trying D3 and Plot ideas in seconds, and an SVG path editor such as [yqnn's SvgPathEditor](https://yqnn.github.io/svg-path-editor/) for understanding path commands.

### Testing and verifying your work

Graphics code fails in ways unit tests miss, so split what you verify.

**Test the maths as plain functions.** Scales, hit testing, pan/zoom transforms, downsampling, and reorder logic are pure: `screenToWorld(worldToScreen(p))` should round-trip, a scale should map its domain ends to its range ends, and `reorder(list, from, to)` should be covered for first, last, and same-index moves. These tests are fast and catch most real bugs.

**Test the pixels with screenshots.** Playwright's `expect(page).toHaveScreenshot()` works on canvas and SVG alike. Fix the viewport and `deviceScaleFactor`, disable animation (the option `animations: 'disabled'` covers CSS; for canvas, drive your render loop from an injectable clock), and seed any randomness. Expect GPU output to differ by a pixel or two between machines, so run screenshot tests in one CI container image and set a small `maxDiffPixelRatio`.

**Test interactions with real input.** Use `page.mouse.move/down/up` with intermediate steps for drags (a single jump often fails activation distance checks), and `page.keyboard` for the keyboard path. Every drag interaction needs a keyboard test: focus the item, press Space, arrow, Space, and assert the new order and the live-region announcement.

**Check accessibility by hand.** Run a screen reader over each chart: does it announce a name and a summary, and can you reach the underlying numbers? View charts through DevTools' *Emulate vision deficiencies* (Rendering tab) for each colour-blindness type, and in forced-colors mode.

**Check performance on slow hardware.** Throttle the CPU 4x or 6x in the Performance panel, test at the largest dataset you claim to support, and watch memory over several minutes for leaks from undisposed GPU resources or detached listeners. "Done" means: correct at 1x and 2x pixel ratio, usable with keyboard alone, readable without colour, and inside frame budget on a mid-range phone.

### Tricks and gotchas

- A canvas has two sizes: the `width`/`height` attributes (the bitmap) and its CSS size. If they disagree by anything other than the device pixel ratio, everything is blurry or stretched.
- Setting `canvas.width` or `canvas.height`, even to the same value, clears the canvas and resets all context state.
- `viewBox` plus CSS sizing is what makes SVG responsive. Leave off fixed `width`/`height` attributes on inline SVG only if CSS gives it a size, otherwise it defaults to 300x150 or stretches unexpectedly.
- Use `fill="currentColor"` on icons so they inherit text colour, including in dark mode and forced-colors mode.
- SVG ids are document-global. Two inline copies of an icon with `id="gradient"` will both reference the first one; if that one is `display: none`, the gradient vanishes.
- On any element you drag or draw on, set `touch-action: none` (or a specific `pan-x`/`pan-y`), otherwise the browser claims the gesture and fires `pointercancel`.
- Call `setPointerCapture(e.pointerId)` on `pointerdown` so you keep receiving moves when the pointer leaves the element. You do not need window-level listeners.
- Never read layout (`getBoundingClientRect`, `offsetWidth`) inside a `pointermove` handler. Cache the rect on `pointerdown` and do the work in `requestAnimationFrame`.
- `requestAnimationFrame` stops in background tabs. Always compute motion from elapsed time and clamp the delta, or objects teleport when the tab returns.
- Line charts may start anywhere on the y axis; bar charts must start at zero because length encodes the value.
- Map libraries and GeoJSON use `[longitude, latitude]` order. A map centred in the ocean or on the wrong continent is almost always a swapped pair.
- In WebGL and Three.js you must free GPU resources yourself: `geometry.dispose()`, `material.dispose()`, `texture.dispose()`. Garbage collection does not do it.
- `video.play()` returns a promise that rejects when autoplay is blocked. Always handle the rejection. An `AudioContext` created before a user gesture starts `suspended`.
- Use `getCoalescedEvents()` in drawing apps to get every intermediate pointer position, not just one per frame.

### Official references

- [MDN: SVG reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference) — every element and attribute, with browser support.
- [SVG 2 specification](https://www.w3.org/TR/SVG2/) — the authority on coordinate systems, painting, and paths.
- [MDN: Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) — the 2D context reference and tutorial.
- [WebGL2 Fundamentals](https://webgl2fundamentals.org/) — the best from-first-principles WebGL course.
- [MDN: WebGPU API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API) — concepts and interfaces; pair with the [gpuweb implementation status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status) page.
- [Three.js manual](https://threejs.org/manual/) and [Three.js docs](https://threejs.org/docs/) — guides and API reference.
- [D3 documentation](https://d3js.org/) — scales, shapes, axes, zoom, brush, and array utilities.
- [MapLibre GL JS documentation](https://maplibre.org/maplibre-gl-js/docs/) — the map renderer's API and examples; the [style spec](https://maplibre.org/maplibre-style-spec/) defines sources, layers, and expressions.
- [Observable Plot documentation](https://observablehq.com/plot/) — the concise grammar-of-graphics library from the D3 team.
- [MDN: Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) — the unified input model for mouse, touch, and pen.
- [dnd-kit documentation](https://dndkit.com/) — the current drag and drop toolkit and its React adapter.
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) — keyboard patterns for grids, sliders, and listboxes that custom widgets should follow.
- [MDN: Media technologies](https://developer.mozilla.org/en-US/docs/Web/Media) — media elements, formats, MSE, WebRTC, and Web Audio guides.

## Skills

### SVG fundamentals

SVG describes a picture as a tree of elements: basic shapes (`<rect>`, `<circle>`, `<ellipse>`, `<line>`, `<polyline>`, `<polygon>`), the general-purpose `<path>`, `<text>`, and `<g>` for grouping and shared attributes or transforms. Because it is DOM, each shape can be styled, scripted, and given event listeners.

The key idea is that there are two coordinate systems. The *viewport* is the box the SVG occupies on the page (from `width`/`height` or CSS). The `viewBox="minX minY width height"` declares which rectangle of *user space* is mapped onto that viewport. With `viewBox="0 0 24 24"`, a circle at `cx="12"` is always centred, whether the icon renders at 16px or 400px. `preserveAspectRatio` decides what happens when the aspect ratios differ: the default `xMidYMid meet` scales uniformly and centres (like `object-fit: contain`), `slice` behaves like `cover`, and `none` stretches. The y axis points down.

```html
<svg viewBox="0 0 100 60" width="200">
  <g transform="translate(10 10)" fill="none" stroke="currentColor" stroke-width="2">
    <rect width="30" height="20" rx="4" />
    <path d="M40 20 L60 0 Q80 0 80 20 Z" />
  </g>
</svg>
```

Path data is a pen: `M` move, `L` line, `H`/`V` horizontal/vertical, `C`/`S` cubic Bézier, `Q`/`T` quadratic, `A` elliptical arc, `Z` close. Uppercase is absolute, lowercase relative to the current point. A `transform` on an element creates a new coordinate system for it and its children, and transforms apply right to left: `translate(50 50) rotate(45)` rotates first, then moves.

Common mistakes: forgetting `viewBox` so the graphic crops instead of scaling; strokes clipped at the edge because a stroke is centred on the geometry and half of it falls outside the `viewBox`; and expecting strokes to stay thin when scaled (use `vector-effect: non-scaling-stroke`).

**Try it:** Write an inline SVG with `viewBox="0 0 100 100"` and a circle. In DevTools, change the `viewBox` to `25 25 50 50`, then `0 0 200 200`, then set the element to 300x100 and cycle `preserveAspectRatio` through `xMinYMid meet`, `xMidYMid slice`, and `none`. Predict each result before applying it.

**Resources**
- [MDN: SVG positions and the coordinate system](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Positions)
- [MDN: viewBox](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox)
- [MDN: SVG paths](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Paths)

### Styling and animating SVG

Most SVG appearance attributes (`fill`, `stroke`, `stroke-width`, `opacity`, and in current browsers geometry such as `cx`, `r`, and `d`) are *presentation attributes*: they act like CSS declarations with zero specificity, so any CSS rule overrides them. That is why `fill="currentColor"` in markup plus `color` in CSS is the standard icon pattern. CSS only reaches SVG that is in the document: inline `<svg>` yes, an `<img src="icon.svg">` or CSS background no, and `<use>` content only through inheritance and custom properties because it lives in a closed shadow tree.

SMIL (`<animate>`, `<animateTransform>`) still works in all browsers but is rarely the right tool. Use CSS transitions and animations for state changes, and the Web Animations API or a library such as GSAP or Motion for sequencing. Two things trip people up when transforming SVG with CSS: the default `transform-origin` for SVG elements is the origin of the SVG canvas, not the element's centre. Fix it with:

```css
.spinner { transform-box: fill-box; transform-origin: center; }
```

The line-drawing effect uses dashes. Make one dash as long as the whole path, then slide it out of view with `stroke-dashoffset` and animate that back to zero. Setting `pathLength="1"` on the path normalises its length so you don't need to measure it:

```css
.draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1s ease-out forwards; }
@keyframes draw { to { stroke-dashoffset: 0; } }
```

Without `pathLength`, measure with `path.getTotalLength()`. The same trick builds progress rings: `stroke-dashoffset = circumference * (1 - progress)`. Animate `transform` and `opacity` where you can; animating `d` or `stroke-dashoffset` repaints every frame, which is fine for one icon and expensive for hundreds. Wrap motion in `@media (prefers-reduced-motion: no-preference)`.

**Try it:** Build a circular progress ring from two `<circle>` elements with `pathLength="100"`, drive it with a CSS custom property `--progress`, and rotate it so progress starts at 12 o'clock. Then animate a checkmark path drawing itself inside when it reaches 100.

**Resources**
- [MDN: stroke-dasharray](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dasharray)
- [MDN: transform-box](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-box)
- [MDN: SVGGeometryElement.getTotalLength()](https://developer.mozilla.org/en-US/docs/Web/API/SVGGeometryElement/getTotalLength)

### Accessible SVG

Decide first which of three things the graphic is, because the markup differs.

**Decorative** (an icon next to a visible label, a flourish): hide it. `aria-hidden="true"` on the `<svg>` removes it from the accessibility tree. If it is loaded with `<img>`, use `alt=""`.

**A simple informative image** (a standalone icon, a logo): give it an image role and a name. For inline SVG:

```html
<svg role="img" aria-labelledby="t" viewBox="0 0 24 24">
  <title id="t">Warning</title>
  <path d="…" />
</svg>
```

`role="img"` makes assistive technology treat the whole graphic as one image and ignore its children; without it some screen readers walk through every group and path. `<title>` should be the first child. `aria-label` on the `<svg>` works too, but text in `<title>` can be translated with the rest of your markup and is the form the SVG accessibility mapping describes. Be aware that `<title>` also produces a mouse tooltip in most browsers, which is sometimes unwanted.

**An icon-only control**: name the control, not the graphic. Put `aria-label` (or visually hidden text) on the `<button>` and `aria-hidden="true"` on the SVG. Never put click handlers on a bare `<svg>` or `<path>`; they are not focusable or announced as buttons.

**Complex graphics** (charts, diagrams) need more than a name; see the accessible charts entry.

Also check visuals: icons need 3:1 contrast against their background (WCAG 1.4.11), and in Windows forced-colors mode hard-coded fills can disappear into the background. `currentColor` adapts automatically because text colour is overridden by the system. Older guidance recommended `focusable="false"` to stop legacy Edge and IE tabbing into SVGs; it is harmless but no longer needed.

**Try it:** Take an icon button from one of your projects and inspect it in the DevTools Accessibility pane. Confirm the computed name comes from the button, and the SVG shows as ignored. Then turn on *forced-colors: active* in the Rendering tab and check the icon is still visible.

**Resources**
- [W3C WAI: Images tutorial](https://www.w3.org/WAI/tutorials/images/)
- [MDN: The SVG title element](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/title)
- [W3C: SVG Accessibility API Mappings](https://www.w3.org/TR/svg-aam-1.0/)

### Optimising SVG

SVG exported from design tools carries editor metadata, redundant groups, absurd numeric precision, and inline styles. SVGO removes that, commonly cutting 30 to 70 percent. Run it as a CLI (`npx svgo -f src/icons -o dist/icons`), through a bundler plugin, or interactively in SVGOMG where you can see the visual result of each option.

Configure it with `svgo.config.mjs`. SVGO 4 is current; unlike v3, its default preset no longer removes the `viewBox` or `<title>`, which fixed the two most common ways SVGO used to break responsive scaling and accessibility.

```js
export default {
  multipass: true,
  floatPrecision: 2,
  plugins: [
    { name: 'preset-default', params: { overrides: { cleanupIds: false } } },
    'removeDimensions', // drop width/height, keep viewBox
  ],
};
```

Things to watch: `cleanupIds` renames or removes ids that your CSS, JS, or `<use href>` may depend on, and minified ids like `a` collide when several SVGs are inlined in one page (use the `prefixIds` plugin). Too low a precision visibly distorts small icons. Always diff optimised output visually.

For delivery, choose by use. Inline SVG is stylable but is re-parsed on every page and bloats HTML or, worse, your JavaScript bundle when each icon is a component. A *sprite* puts every icon in one cacheable file as `<symbol id="…" viewBox="…">` elements, referenced with:

```html
<svg class="icon" aria-hidden="true"><use href="/icons.svg#search" /></svg>
```

The icon inherits `currentColor` and custom properties, the file is cached once, and the DOM stays small. External `<use>` must be same-origin (there is no CORS for it). For large illustrations, `<img>` with normal HTTP caching is usually best, and SVG compresses very well with Brotli or gzip.

**Try it:** Export an icon from a design tool, note its size, run it through SVGOMG, and toggle plugins one at a time while watching the diff. Then build a three-icon sprite by hand with `<symbol>` and render each icon in two different colours using only CSS `color`.

**Resources**
- [SVGO: Introduction and configuration](https://svgo.dev/docs/introduction/)
- [SVGO: preset-default](https://svgo.dev/docs/preset-default/)
- [MDN: The use element](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/use)

### Canvas 2D

Canvas is an *immediate mode* bitmap: you issue drawing commands, pixels change, and the canvas remembers nothing about what you drew. To move a shape you clear and redraw the scene. That is the opposite of SVG's retained tree, and it is why canvas scales to many thousands of shapes: there is no per-shape DOM cost.

The context is a state machine. `fillStyle`, `lineWidth`, the current transform, and the clip region persist until changed; `save()` and `restore()` push and pop that state. Paths are built with `beginPath()`, `moveTo`, `lineTo`, `arc`, then painted with `fill()` or `stroke()`. Forgetting `beginPath()` re-strokes everything drawn before, which gets slower every frame.

High-DPI screens need a bitmap larger than the CSS box, or the image is upscaled and blurry:

```js
function resize(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels from here on
}
```

Re-run it from a `ResizeObserver`, and when the pixel ratio changes (browser zoom, moving between monitors). A proper render loop uses `requestAnimationFrame` and elapsed time, not a fixed step per frame, because displays run at 60, 90, 120, or 144Hz:

```js
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1); // clamp after tab switches
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

Performance habits: batch shapes that share a style into one path, avoid `shadowBlur` and frequent `getImageData`, pre-render static layers to a second canvas and `drawImage` them, and redraw only when something changed. One-pixel lines look fuzzy unless they sit on half-pixel coordinates. Canvas content is invisible to assistive technology, so provide an alternative.

**Try it:** Draw 2,000 moving circles with a time-based loop. Check sharpness at device pixel ratio 1 and 2 in device mode, then record in the Performance panel and compare one `beginPath()` per circle against one path for all circles of the same colour.

**Resources**
- [MDN: Canvas tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [MDN: Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [MDN: Window.devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio)

### `OffscreenCanvas`

`OffscreenCanvas` is a canvas that is not tied to the DOM, so it can exist and render in a worker. That moves drawing work off the main thread: a heavy chart or game keeps animating while the main thread is busy with React, and your rendering no longer delays input handling.

There are two modes. In the common one, you hand control of an on-page canvas to a worker:

```js
// main.js
const offscreen = document.querySelector('canvas').transferControlToOffscreen();
const worker = new Worker(new URL('./render.js', import.meta.url), { type: 'module' });
worker.postMessage({ canvas: offscreen, dpr: devicePixelRatio }, [offscreen]);

// render.js
self.onmessage = ({ data }) => {
  const ctx = data.canvas.getContext('2d');
  function frame(t) {
    draw(ctx, t);
    requestAnimationFrame(frame); // available in dedicated workers
  }
  requestAnimationFrame(frame);
};
```

Frames are committed to the visible canvas automatically. In the second mode you construct `new OffscreenCanvas(w, h)` anywhere, draw, and produce an `ImageBitmap` with `transferToImageBitmap()` or a `Blob` with `convertToBlob()`. That suits thumbnail generation, image processing, and pre-rendering sprites.

The details that bite: the canvas is *transferred*, so list it in the transfer array, and after `transferControlToOffscreen()` the main thread can no longer call `getContext` on that element or set its `width`. A worker has no DOM, so you must forward everything it needs: size and device pixel ratio on resize, pointer positions, theme colours, and fonts (load them with the `FontFace` API inside the worker). Input still arrives on the main thread, so a blocked main thread delays events even though rendering stays smooth. Hit testing has to happen in the worker, or against data shared with it.

`OffscreenCanvas` is Baseline and works with 2D, WebGL, and WebGPU contexts. It adds real complexity, so measure first: it pays off when rendering takes several milliseconds per frame and competes with main-thread work.

**Try it:** Move the 2,000-circle loop from the Canvas 2D exercise into a worker. Add a button on the page that blocks the main thread for two seconds with a busy loop, and confirm the animation keeps running while the button's own UI freezes.

**Resources**
- [MDN: OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)
- [web.dev: OffscreenCanvas, speed up your canvas operations with a web worker](https://web.dev/articles/offscreen-canvas)

### WebGL basics

WebGL is a rasterisation API: you give the GPU triangles and two small programs, and it fills pixels extremely fast. It does not know about scenes, cameras, or lights; those are maths you supply. WebGL2 (based on OpenGL ES 3.0) is available in every current browser and is what you should target.

The pipeline, conceptually:

1. You upload vertex data (positions, colours, texture coordinates) into **buffers** on the GPU and describe their layout as **attributes**.
2. The **vertex shader** runs once per vertex and outputs a position in *clip space*, where x, y, and z each run from -1 to 1. Matrices that implement your camera and projection are applied here.
3. The GPU assembles vertices into triangles and **rasterises** them into fragments (candidate pixels), interpolating any values the vertex shader passed on (**varyings**).
4. The **fragment shader** runs once per fragment and outputs a colour, typically sampling **textures** and applying lighting.
5. Depth testing and blending decide what lands in the framebuffer.

**Uniforms** are values constant across a draw call (a matrix, a colour, time). Shaders are written in GLSL:

```glsl
#version 300 es
in vec4 a_position;
uniform mat4 u_matrix;
void main() { gl_Position = u_matrix * a_position; }
```

The API itself is a large state machine: you bind a buffer, bind a program, set uniforms, then call `gl.drawArrays` or `gl.drawElements`. The cost model follows from this. Each draw call has CPU overhead, so the path to performance is fewer, bigger draws: merge geometry, use texture atlases, and use *instancing* to draw thousands of copies in one call. What you rarely worry about is the triangle count itself.

Practical traps: a context can be lost at any time (handle `webglcontextlost` and `webglcontextrestored`), browsers cap the number of live contexts per page, textures and buffers must be deleted manually, and cross-origin images need CORS to be used as textures. Most product work goes through Three.js, regl, or PixiJS, but knowing the pipeline is what lets you debug them.

**Try it:** Work through the first WebGL2 Fundamentals lesson until you have one triangle. Then pass a `u_time` uniform and change the fragment shader so the colour varies with `gl_FragCoord` and time. Capture a frame with Spector.js and find your draw call.

**Resources**
- [WebGL2 Fundamentals: Fundamentals](https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html)
- [MDN: WebGL tutorial](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial)
- [MDN: WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

### Three.js

Three.js is a scene graph on top of WebGL (and now WebGPU). The pieces: a **renderer** that draws into a canvas, a **scene** that holds a tree of objects, a **camera**, **meshes** made of a geometry (shape) plus a material (surface), and **lights**.

```js
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 4);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.4 }),
);
scene.add(cube, new THREE.AmbientLight(0xffffff, 0.4));
const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(3, 5, 2);
scene.add(sun);

renderer.setAnimationLoop((t) => {
  cube.rotation.y = t / 1000;
  renderer.render(scene, camera);
});
```

Lighting only affects lit materials. `MeshBasicMaterial` ignores lights; `MeshStandardMaterial` is the physically based default, controlled by `roughness` and `metalness`. A black object almost always means "no light reaches a lit material". `AmbientLight` and `HemisphereLight` fill, `DirectionalLight` is a sun, `PointLight` and `SpotLight` are local, and an environment map (`scene.environment`) gives the most realistic result for the least effort. Shadows are opt-in three times: `renderer.shadowMap.enabled = true`, `light.castShadow = true`, and `castShadow`/`receiveShadow` on meshes; each shadow-casting light renders the scene again, so use few.

Things experienced users do: cap the pixel ratio at 2, update `camera.aspect` and call `updateProjectionMatrix()` on resize, mark colour textures with `texture.colorSpace = THREE.SRGBColorSpace`, load models as glTF with `GLTFLoader`, use `InstancedMesh` for many copies, and call `dispose()` on geometries, materials, and textures they remove. In React, React Three Fiber expresses the same scene graph as components. Three.js releases monthly and does not follow semver, so pin the version and read the migration guide when upgrading.

**Try it:** Build the scene above, add a ground plane and `OrbitControls`, then enable shadows. Add a `DirectionalLightHelper` and a `CameraHelper` on `sun.shadow.camera` to see why a shadow is clipped, and fix it by adjusting the shadow camera bounds.

**Resources**
- [Three.js manual: Fundamentals](https://threejs.org/manual/#en/fundamentals)
- [Three.js manual: Lights](https://threejs.org/manual/#en/lights)
- [Three.js manual: Shadows](https://threejs.org/manual/#en/shadows)

### WebGPU

WebGPU is the successor to WebGL, designed around how modern GPUs and their native APIs (Direct3D 12, Metal, Vulkan) actually work. What it adds:

- **Compute shaders.** General-purpose GPU work with no rendering involved: particle simulation, physics, image processing, and running machine-learning models in the browser. This is the biggest functional gap in WebGL.
- **An explicit, object-based API.** You create immutable pipeline objects and bind groups up front instead of mutating global state. Validation happens at creation time, so draw calls are cheaper and errors are clearer.
- **Lower CPU overhead per draw**, plus render bundles for replaying command lists, which matters for scenes with many distinct objects.
- **WGSL**, a new shading language, and well-defined behaviour across platforms.

```js
if (!navigator.gpu) throw new Error('WebGPU not available');
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) throw new Error('No suitable GPU adapter');
const device = await adapter.requestDevice();
const context = canvas.getContext('webgpu');
context.configure({ device, format: navigator.gpu.getPreferredCanvasFormat() });
```

Support, checked at the time of writing (October 2026): Chromium has shipped it since version 113 on Windows, macOS, and ChromeOS, on most Android 12+ devices, and on Linux for a growing set of GPU and driver combinations. Safari enabled it by default in Safari 26 on macOS, iOS, iPadOS, and visionOS. Firefox ships it on Windows (141+) and Apple Silicon Macs (145+), with Linux, Intel Mac, and Android still in progress. MDN therefore still marks it as limited availability rather than Baseline. It requires a secure context, and `requestAdapter()` can resolve to `null` even where the API exists (blocklisted drivers, no hardware acceleration), so always feature-detect and keep a fallback.

When to reach for it: you need compute, you are hitting WebGL's draw-call ceiling, or you are running ML inference. For an ordinary 3D scene, the practical route is Three.js's `WebGPURenderer` (imported from `three/webgpu`), which uses WebGPU when available and falls back to WebGL2. Do not rewrite a working WebGL app for its own sake.

**Try it:** Open the gpuweb implementation status page and your browser's `chrome://gpu` or `about:support` and establish whether WebGPU is hardware accelerated on your machine. Then run the first WebGPU Fundamentals example and log `adapter.info` and a few `adapter.limits`.

**Resources**
- [MDN: WebGPU API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [WebGPU Fundamentals: Fundamentals](https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html)
- [gpuweb wiki: Implementation status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status)

### Choosing a renderer

The choice is a trade between what the browser gives you for free and how many things you can draw.

| Renderer | Comfortable scale | You get for free | You pay with |
| --- | --- | --- | --- |
| DOM/CSS | hundreds to low thousands of nodes | layout, text, accessibility, events, CSS | layout and style cost per node |
| SVG | up to a few thousand elements | resolution independence, per-shape events and styling, accessibility hooks | DOM cost per shape |
| Canvas 2D | tens of thousands of shapes per frame | fast immediate drawing, pixel access | hit testing, text layout, accessibility, redraw logic |
| WebGL/WebGPU | hundreds of thousands to millions of primitives | GPU throughput, shaders, 3D | complexity, text rendering, context limits |

These numbers are orders of magnitude, not limits; they depend on the device and on how much changes per frame. A thousand static SVG nodes are fine, a thousand animating ones may not be.

Ask these questions in order. Is it text-heavy, form-like, or does it need to reflow? Use DOM. Does each mark need its own hover, focus, tooltip, or CSS styling, and are there fewer than a couple of thousand? Use SVG. Are there many marks, or is everything redrawn continuously (games, drawing tools, dense scatterplots)? Use canvas. Do you need 3D, shader effects, or more than roughly a hundred thousand points? Use WebGL or WebGPU, through a library.

Experienced engineers mix them. A typical high-performance chart draws the data marks on a canvas, puts axes and labels in SVG or DOM on top (crisp text, easy styling), and adds a transparent interaction layer plus a DOM tooltip. Maps do the same: WebGL tiles with DOM popups and controls (see the Maps entry). Mixing gives you the scale of canvas while keeping text, focus, and accessibility in the DOM.

The cost that gets underestimated is what you must rebuild when leaving the DOM: hit testing, keyboard focus, text wrapping, selection, high-DPI handling, and an accessible alternative. Budget for those before choosing canvas for something that has 200 elements.

**Try it:** Render the same scatterplot of N random points in SVG and in canvas, with a slider for N (100, 1,000, 10,000, 100,000). Animate the points and record the frame rate of each in the Performance panel. Note where each renderer stops being smooth on your machine.

**Resources**
- [web.dev: Rendering performance](https://web.dev/articles/rendering-performance)
- [Apache ECharts handbook: Canvas vs. SVG](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/)
- [MDN: Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

### Chart selection

Start from the question the reader needs answered, not from the data shape or the chart you find attractive. The common questions and their default answers:

| Question | Chart |
| --- | --- |
| How do categories compare? | Bar chart (horizontal when labels are long), sorted by value |
| How did it change over time? | Line chart; bars for few discrete periods |
| How is it distributed? | Histogram, box plot, or density plot |
| How are two measures related? | Scatterplot |
| What are the parts of a whole? | Stacked bar, or a pie only for two or three parts |
| How does it vary across two categories? | Heatmap |
| What is the one number? | A big number with a comparison, not a chart |

The reasoning behind the table is perceptual. People judge **position along a common scale** most accurately, then **length**, then **angle and area**, and **colour intensity** least accurately. So encode the most important quantity as position. That is why bars beat pies for comparison and why a heatmap is for patterns, not for reading exact values.

Rules that follow from how encodings work: bar charts must have a zero baseline, because the bar's length is the value and truncating it exaggerates differences; line charts may zoom the y axis, because slope and position carry the meaning. Avoid dual y axes: the apparent crossing point is an artefact of two arbitrary scales. Avoid 3D effects, which distort every encoding. Stacked areas make only the bottom series and the total readable. When there are more than about seven series, switch to small multiples (the same chart repeated per category with shared axes) instead of a rainbow of lines.

Then make the chart say its point: a title that states the finding, direct labels on lines instead of a separate legend, units on axes, a sensible sort order, and grey for context with one accent colour for what matters.

**Try it:** Take one dataset (for example monthly sales by region) and write three different questions about it. Sketch on paper the chart that best answers each, then build two of them and write the finding as each chart's title.

**Resources**
- [Claus Wilke: Fundamentals of Data Visualization, directory of visualizations](https://clauswilke.com/dataviz/directory-of-visualizations.html)
- [Observable Plot: Marks](https://observablehq.com/plot/features/marks)
- [From Data to Viz: chart decision tree](https://www.data-to-viz.com/)

### Scales and axes

A scale is a function from data values (the **domain**) to visual values (the **range**), usually pixels. Everything in a chart is built on that mapping, and D3's scale and shape modules are useful on their own, with or without the rest of D3.

```js
import { scaleLinear, scaleUtc } from 'd3-scale';
import { extent, max } from 'd3-array';
import { line } from 'd3-shape';

const m = { top: 10, right: 10, bottom: 24, left: 40 };
const x = scaleUtc(extent(data, (d) => d.date), [m.left, width - m.right]);
const y = scaleLinear([0, max(data, (d) => d.value)], [height - m.bottom, m.top]).nice();

const path = line()
  .defined((d) => d.value != null)
  .x((d) => x(d.date))
  .y((d) => y(d.value))(data); // an SVG path string for <path d={path}>
```

Note the y range is inverted (`[bottom, top]`) because SVG's y axis points down. `.nice()` rounds the domain to tidy tick values, `x.ticks(6)` returns tick positions, `x.tickFormat()` returns a matching formatter, and `x.invert(px)` maps pixels back to data, which is how tooltips and brushes work.

Pick the scale type by data: `scaleLinear` for quantities, `scaleUtc`/`scaleTime` for dates (prefer UTC to avoid DST artefacts), `scaleBand` for bars (it gives each category a `bandwidth()`), `scalePoint` for categorical positions, `scaleLog` for data spanning orders of magnitude (the domain cannot include zero; `scaleSymlog` can), `scaleSqrt` for circle radius so that *area* is proportional to value, and `scaleOrdinal` or `scaleSequential` for colour.

Shape generators (`line`, `area`, `arc`, `stack`) turn data into path strings or, with `.context(ctx)`, canvas calls. `d3-axis` renders an axis by mutating a `<g>`; in React many teams instead map over `scale.ticks()` and render ticks as JSX, keeping D3 for maths and React for the DOM. Use the "margin convention": reserve margins for axes and draw in the inner area.

Mistakes: forgetting to update the range on resize, missing data silently connected by a line (use `.defined()`), and curve interpolation such as `curveBasis` inventing values between points. `curveMonotoneX` smooths without overshooting.

**Try it:** Without a chart library, render a responsive SVG line chart with x and y axes built from `scale.ticks()`. Add a gap for a null value with `.defined()`, then swap `scaleLinear` for `scaleLog` and observe what happens to a zero in the data.

**Resources**
- [D3: d3-scale](https://d3js.org/d3-scale)
- [D3: Lines (d3-shape)](https://d3js.org/d3-shape/line)
- [D3: d3-axis](https://d3js.org/d3-axis)

### A charting library

Use a library for product charts. The four named here cover different points on the spectrum between convenience and control:

- **Recharts**: declarative React components rendered as SVG (`<LineChart>`, `<XAxis>`, `<Tooltip>`). Fastest route to a conventional chart in a React app. Version 3 rewrote the internals and turns on its keyboard accessibility layer by default. Weak for very large datasets because every mark is a React-rendered SVG node.
- **visx**: low-level React primitives over D3 (scales, shapes, axes, tooltips, brush). You assemble the chart yourself, so it fits a design system exactly and takes more code.
- **Observable Plot**: a concise grammar of graphics. You describe marks, channels, and transforms, and Plot returns an SVG element. Excellent for exploration and analytical charts; framework-agnostic, so in React you append the result in an effect.
- **Apache ECharts**: a batteries-included engine with canvas or SVG rendering, built-in zoom, brush, legends, large-data modes, and accessibility options. Configured with one big option object; the most capable for dense dashboards and the largest in bundle size unless you import only the parts you use.

```js
import * as Plot from '@observablehq/plot';

const chart = Plot.plot({
  y: { grid: true, label: 'Close (USD)' },
  marks: [Plot.ruleY([0]), Plot.lineY(data, { x: 'date', y: 'close', tip: true })],
});
container.append(chart);
```

Choose by asking: does it render to SVG or canvas and how many points will you have, does it tree-shake, can you theme it to your design tokens, what does it do for keyboard and screen reader users, does it work with server rendering, and how actively is it maintained? Whichever you choose, wrap it in your own small set of components so product code does not depend on the library's API directly.

Common mistakes: a responsive container inside a parent with no height (the chart renders at zero pixels), passing a new data array or new inline functions on every render so the chart re-animates or recomputes, and leaking instances by not disposing them on unmount (ECharts needs `chart.dispose()`).

**Try it:** Build the same chart (a multi-series line chart with a tooltip and legend) in two of these libraries. Compare the lines of code, the added bundle size reported by your bundler, and what happens when you press Tab and the arrow keys on each.

**Resources**
- [Observable Plot: Plots (the options and anatomy of a plot)](https://observablehq.com/plot/features/plots)
- [Apache ECharts handbook: Get started](https://echarts.apache.org/handbook/en/get-started/)
- [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide)

### Interaction

Chart interaction follows one principle: overview first, zoom and filter, then details on demand. Each technique is a use of the scale's inverse.

**Tooltips.** Do not attach hover handlers to tiny marks. Listen for `pointermove` on the whole plot area, convert the pointer's x to a data value with `x.invert()`, and find the nearest datum by bisection:

```js
import { bisector } from 'd3-array';
import { pointer } from 'd3-selection';
const bisect = bisector((d) => d.date).center;

function onPointerMove(e) {
  const [px] = pointer(e); // position relative to the event's current target
  const d = data[bisect(data, x.invert(px))];
  showTooltip(d);
}
```

For scatterplots, use a `d3-quadtree` or `d3-delaunay` to find the nearest point in two dimensions. Render the tooltip as a DOM element positioned to stay inside the viewport; hover does not exist on touch, so make tap show it, and make the same information reachable by keyboard.

**Brushing** selects a range. `d3-brush` gives you a draggable, resizable rectangle and reports a pixel selection, which you convert to a data interval with `invert`. **Zoom** with `d3-zoom` produces a transform `{x, y, k}`; apply it either geometrically (transform the group) or, better for charts, semantically with `transform.rescaleX(x)` so the axis re-ticks and lines keep their stroke width. Set `scaleExtent` and `translateExtent` so users cannot get lost.

**Linked views** share one piece of state (a hovered key, a brushed interval, a filter set) that every chart reads. Selecting a range in a timeline filters the bar chart; hovering a bar highlights the same category elsewhere. Keep the state in a store or the URL, not inside a chart. A focus-plus-context pair (a small overview with a brush controlling a detailed chart) is the classic pattern.

Performance: update on `requestAnimationFrame`, not on every event, and change as little DOM as possible (move one rule and one tooltip, do not re-render the series).

**Try it:** Add a crosshair and tooltip to your line chart using the bisector approach, then add a small overview chart underneath with a brush that sets the main chart's x domain. Make the left and right arrow keys move the crosshair when the chart has focus.

**Resources**
- [D3: d3-zoom](https://d3js.org/d3-zoom)
- [D3: d3-brush](https://d3js.org/d3-brush)
- [Observable Plot: Pointer interactions](https://observablehq.com/plot/interactions/pointer)

### Accessible charts

A chart must work for people who cannot see it, cannot distinguish its colours, or cannot use a pointer. Treat that as three layers.

**A text alternative, in two parts.** A short name saying what the chart is ("Monthly revenue, 2025, line chart") and a longer description of what it shows: the trend, extremes, and the conclusion a sighted reader would draw. Put the description in visible text near the chart where you can, since everyone benefits, and link it:

```html
<figure>
  <svg role="img" aria-labelledby="c-title" aria-describedby="c-desc" viewBox="0 0 600 300">
    <title id="c-title">Monthly revenue, 2025</title>
    …
  </svg>
  <figcaption id="c-desc">Revenue rose from £1.2m in January to £2.1m in December, with a dip in August.</figcaption>
</figure>
```

Then give access to the data itself: a data table (visible, in a `<details>`, or behind a "View as table" toggle) or a download. A table is the most robust alternative for canvas charts, which expose nothing.

**Keyboard access.** If hovering reveals values, the keyboard must too. The usual pattern is one tab stop for the chart, then arrow keys to move between data points, with each point's value announced. ECharts (`aria.enabled`), Recharts 3, and Highcharts provide versions of this; with custom SVG you manage a roving focus yourself.

**Colour.** Never encode with colour alone (WCAG 1.4.1): add direct labels, different markers or dash patterns, or textures. Use palettes designed to survive colour vision deficiency, such as ColorBrewer's colour-blind-safe schemes, the Okabe-Ito palette, or `d3.schemeTableau10`, and use sequential schemes like viridis for magnitude. Graphical elements need 3:1 contrast against the background (WCAG 1.4.11), and text needs the usual 4.5:1. Check forced-colors mode and 200 percent zoom, and respect `prefers-reduced-motion` for animated transitions.

**Try it:** Turn on each vision-deficiency emulation in the DevTools Rendering tab and view one of your multi-series charts. Then listen to it with a screen reader. Fix what you find: add direct labels, a summary, and a data table toggle.

**Resources**
- [W3C WAI: Complex images](https://www.w3.org/WAI/tutorials/images/complex/)
- [Chartability: a methodology for accessible data experiences](https://chartability.fizz.studio/)
- [ColorBrewer: colour advice with a colour-blind-safe filter](https://colorbrewer2.org/)

### Large datasets

A chart 800 pixels wide can show at most about 800 distinct x positions. Sending a million points to it wastes network, memory, and frame time, and the overplotted result is unreadable anyway. The strategy is to reduce data to what the screen can show, then render that efficiently.

**Aggregate.** Change the question from "show every point" to "show the distribution": bin into a histogram (`d3.bin`), group by hour or day, or turn a scatterplot into a 2D density heatmap or hexbin. Aggregate on the server or in a worker when the raw data is large; the client should receive the buckets.

**Downsample time series.** Taking every nth point destroys peaks. Use *min/max per pixel column* (keep the lowest and highest value in each bucket, so spikes survive) or *LTTB* (Largest Triangle Three Buckets), which picks the points that best preserve the visual shape. ECharts exposes this as `sampling: 'lttb'` on a line series.

**Render on canvas or WebGL.** Past a few thousand marks, SVG's per-node cost dominates. Canvas handles tens of thousands; WebGL libraries (deck.gl, regl-based scatterplots) handle millions. D3's shape generators draw to canvas with `.context(ctx)`. Canvas-first libraries such as uPlot are built for this case.

**Rebuild interaction.** Without DOM nodes there are no per-point events. Use a spatial index (`d3-quadtree`, or Flatbush/KDBush) to find the nearest point to the pointer in logarithmic time.

**Load by level of detail.** Fetch a coarse overview first and request finer data for the visible range when the user zooms, as map tiles do. Keep numeric columns in typed arrays (`Float64Array`) instead of arrays of objects to cut memory and garbage collection, and move parsing and aggregation to a worker so the main thread stays responsive.

The correctness risk is aggregation that hides what matters. Always check that outliers and gaps are still visible after reduction, and tell the user when they are looking at a sample.

**Try it:** Generate 500,000 points of a noisy sine wave with a few injected spikes. Render it three ways on canvas: every nth point, min/max per pixel column, and LTTB. Compare which spikes survive and the draw time of each.

**Resources**
- [D3: Binning data (d3-array)](https://d3js.org/d3-array/bin)
- [D3: d3-quadtree](https://d3js.org/d3-quadtree)
- [uPlot: a fast canvas time series chart (README and benchmarks)](https://github.com/leeoniya/uPlot)

### Maps

An interactive ("slippy") map is a tiled, zoomable renderer plus your data on top. **MapLibre GL JS** is the open-source WebGL map renderer (a community fork of Mapbox GL JS made before that became proprietary), and it is the default choice when you want vector maps without a vendor's SDK.

**Vector tiles.** The world is cut into a pyramid of square tiles addressed by zoom, column, and row (`/{z}/{x}/{y}`). A raster tile is a finished image. A vector tile (Mapbox Vector Tile format, a compact protobuf) contains geometry and attributes organised into named layers such as `water` or `transportation`, and the *client* draws it. That is why vector maps stay sharp at fractional zooms, rotate and tilt with upright labels, and can be restyled (dark mode, localised labels) without new tiles. MapLibre is only the renderer: tiles come from a provider (MapTiler, Stadia, OpenFreeMap) or from your own files, for example a single PMTiles archive on static hosting read with HTTP range requests.

**The style** is a JSON document with `sources` (where data comes from) and an ordered list of `layers` (how to draw it); later layers paint on top. Your own data is added the same way:

```js
import { Map, Popup, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Vite syntax; the docs list the equivalent for webpack, esbuild, and Rollup
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);

const map = new Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [-0.12, 51.5], // [longitude, latitude]
  zoom: 10,
});

map.on('load', () => {
  map.addSource('stations', { type: 'geojson', data: '/stations.geojson' });
  map.addLayer({
    id: 'stations',
    type: 'circle',
    source: 'stations',
    paint: {
      'circle-color': '#0a7d5a',
      'circle-radius': ['interpolate', ['linear'], ['get', 'bikes'], 0, 4, 40, 16],
    },
  });
  map.on('click', 'stations', (e) => {
    const f = e.features[0];
    new Popup().setLngLat(f.geometry.coordinates).setText(f.properties.name).addTo(map);
  });
});
```

Layer types are `fill`, `line`, `circle`, `symbol` (icons and text), `heatmap`, `fill-extrusion`, and `raster`. Paint and layout values can be **expressions** like the one above, evaluated per feature and per zoom on the GPU, which is how data-driven styling works. Update data with `map.getSource('stations').setData(next)`, use `setFeatureState` for hover and selection without re-uploading geometry, and set `cluster: true` on a GeoJSON source to group dense points.

What goes wrong: coordinates are `[lng, lat]`, the opposite of what most people say aloud; sources and layers can only be added after the style has loaded; the CSS file is required or controls and popups are unstyled; and the container needs an explicit height. The current major version, MapLibre GL JS 6, ships as ES modules with named exports and needs its worker URL configured under a bundler (`setWorkerUrl`, shown per bundler in the docs), while most older examples use a default `maplibregl` import, so check which version an example targets. Call `map.remove()` on unmount to free the WebGL context. A large GeoJSON file is parsed and tiled in a worker on the client; past tens of megabytes, pre-build vector tiles (tippecanoe) instead. Keep the attribution control: OpenStreetMap-based data requires it.

Design and accessibility: Web Mercator inflates areas near the poles, so normalise choropleths (per capita, not raw counts). The map canvas is opaque to assistive technology; MapLibre gives keyboard pan and zoom, but the information on the map also needs a text or list alternative, and pinch or drag needs button equivalents (the navigation control provides them). In React, `react-map-gl` wraps MapLibre; for very large or 3D data overlays, deck.gl renders on top of it.

**Try it:** Create a MapLibre map with a free vector style, add a GeoJSON point source from an open dataset, style circle radius and colour with expressions, and show a popup on click. Then turn on clustering and add a second layer that draws the cluster counts. Open the Network panel and identify the style JSON, the tile requests, the glyph (font) ranges, and the sprite.

**Resources**
- [MapLibre GL JS documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [MapLibre Style Spec: Layers](https://maplibre.org/maplibre-style-spec/layers/)
- [Protomaps docs: PMTiles concepts](https://docs.protomaps.com/pmtiles/)

### Drag and drop

There are three ways to build it. The native **HTML Drag and Drop API** (`draggable`, `dragstart`, `drop`, `DataTransfer`) is the only way to drag files in from the desktop or data between windows, but it has an awkward event model, limited styling of the drag image, patchy touch behaviour, and no keyboard support. For in-app reordering, use **pointer events** or a library built on them.

The pointer-based core is short:

```js
handle.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  handle.setPointerCapture(e.pointerId);
  const start = { x: e.clientX, y: e.clientY };
  const move = (ev) => {
    item.style.transform = `translate(${ev.clientX - start.x}px, ${ev.clientY - start.y}px)`;
  };
  const end = () => {
    handle.removeEventListener('pointermove', move);
    item.style.transform = '';
  };
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', end, { once: true });
  handle.addEventListener('pointercancel', end, { once: true });
});
```

A real implementation adds: `touch-action: none` on the handle, an activation threshold (a few pixels or a short delay) so clicks and scrolls are not hijacked, collision detection to find the drop target, auto-scroll near container edges, a placeholder showing where the item will land, and Escape to cancel.

**Keyboard support is not optional.** WCAG 2.2's 2.5.7 Dragging Movements requires a single-pointer alternative to any drag, and 2.1.1 requires keyboard operation. The conventional keyboard model: focus the item, Space or Enter to pick up, arrow keys to move, Space to drop, Escape to cancel, with each step announced through a live region ("Picked up Task A. Position 2 of 5."). Plain "Move up/Move down" buttons or a "Move to…" menu are also valid and often easier for everyone.

**dnd-kit** provides all of this. The current docs centre on `@dnd-kit/react` (with a framework-agnostic `@dnd-kit/dom` core and adapters for other frameworks): `DragDropProvider`, `useDraggable`, `useDroppable`, and `useSortable` from `@dnd-kit/react/sortable`, with pointer and keyboard sensors and screen reader announcements built in. Many codebases still use the older `@dnd-kit/core` and `@dnd-kit/sortable` packages, whose API (`DndContext`, `SortableContext`) differs, so check which generation an example targets.

**Try it:** Build a sortable list with dnd-kit's `useSortable`. Reorder items using only the keyboard with a screen reader running, and note what is announced. Then customise the announcement text to include the item's name and position.

**Resources**
- [dnd-kit: React quickstart](https://dndkit.com/react/quickstart)
- [W3C: Understanding SC 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- [MDN: Element.setPointerCapture()](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)

### Gestures

Pointer events unify mouse, touch, and pen. Each contact has a `pointerId`, so multi-touch gestures are a matter of tracking active pointers in a `Map`:

```js
const pointers = new Map();
let startDist = 0;

el.addEventListener('pointerdown', (e) => {
  el.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, e);
  if (pointers.size === 2) startDist = distance(...pointers.values());
});
el.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, e);
  if (pointers.size === 2) {
    const scale = distance(...pointers.values()) / startDist;
    const [a, b] = [...pointers.values()];
    zoomAround((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2, scale);
  }
});
const up = (e) => pointers.delete(e.pointerId);
el.addEventListener('pointerup', up);
el.addEventListener('pointercancel', up);

const distance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
```

The property that decides whether any of this works is CSS `touch-action`. By default the browser handles touches itself (scrolling, pinch zoom) and, once it decides a touch is a scroll, sends `pointercancel` and stops delivering moves. Declare what the browser may still do: `touch-action: none` for a fully custom surface, `pan-y` for a horizontal carousel that should still let the page scroll vertically. It must be set in CSS before the gesture starts; you cannot decide in a handler.

Recognising gestures: a **pan** is movement past a small threshold (around 8 to 10px, to separate it from a tap). A **swipe** is a pan that ends with enough velocity or distance, so track recent positions and timestamps and decide on `pointerup`. A **pinch** uses the ratio of distances between two pointers, scaled around their midpoint. On desktop trackpads, pinch arrives as `wheel` events with `ctrlKey` true, and two-finger pan as plain `wheel` events, so a zoomable surface needs a wheel handler too (registered with `{ passive: false }` if you call `preventDefault`).

Accessibility: WCAG 2.5.1 requires that anything done with a multipoint or path-based gesture can also be done with a single pointer without a path, so pair pinch with zoom buttons and swipe with previous/next controls. Add momentum and rubber-banding only after the basics feel right, and prefer CSS scroll snap over a hand-built carousel where it fits.

**Try it:** Build an image viewer with one-finger pan, two-finger pinch around the midpoint, wheel zoom around the cursor, and plus/minus buttons. Test it in device mode with touch emulation (Shift-drag simulates pinch) and on a real phone, and log how often `pointercancel` fires with and without `touch-action: none`.

**Resources**
- [MDN: Pinch zoom gestures](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures)
- [MDN: touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)
- [W3C: Understanding SC 2.5.1 Pointer Gestures](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html)

### Virtualised lists and grids

Virtualisation (windowing) renders only the rows near the viewport. A scroll container holds one tall spacer element sized to the total height, and the visible rows are positioned inside it. Ten thousand items cost about as much as thirty.

Fixed-height rows are simple arithmetic: `startIndex = Math.floor(scrollTop / rowHeight)`. Variable-height rows are the hard part, because you cannot know a row's height before rendering it. The standard approach is to *estimate* each size, render, *measure* the real element with a `ResizeObserver`, cache the result, and correct the offsets of later rows. With TanStack Virtual:

```jsx
const virtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 56,
  overscan: 8,
  getItemKey: (i) => rows[i].id,
});

<div ref={parentRef} style={{ height: 480, overflow: 'auto' }}>
  <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
    {virtualizer.getVirtualItems().map((v) => (
      <div key={v.key} data-index={v.index} ref={virtualizer.measureElement}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${v.start}px)` }}>
        {rows[v.index].text}
      </div>
    ))}
  </div>
</div>
```

A good estimate matters: bad ones make the scrollbar jump as real sizes arrive, especially when scrolling upward. `overscan` renders extra rows beyond the edges to hide blank flashes during fast scrolls. Sticky headers need care because the header's row may be unmounted; either always include the active header's index in the rendered range and position it with `position: sticky`, or render headers in a separate layer. Grids virtualise rows and columns independently.

What you lose: browser find-in-page cannot find unrendered text, Ctrl+A selects only what exists, and screen readers see a partial list, so set `aria-rowcount`/`aria-rowindex` (or `aria-setsize`/`aria-posinset`) and keep keyboard focus alive when the focused row scrolls out. Preserve scroll position across navigation yourself. Before virtualising, consider pagination, or CSS `content-visibility: auto` with `contain-intrinsic-size`, which skips rendering work for off-screen content while keeping it in the DOM and searchable.

**Try it:** Render 50,000 rows of variable-length text with TanStack Virtual's dynamic measurement. Count the DOM nodes in the Elements panel, scroll fast with CPU throttling and tune `overscan`, then drag the scrollbar to the middle and scroll upward to see how estimate quality affects jumping.

**Resources**
- [TanStack Virtual: Introduction](https://tanstack.com/virtual/latest/docs/introduction)
- [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility)
- [ARIA Authoring Practices Guide: Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)

### Rich text editing

`contenteditable` makes an element editable and hands you the browser's built-in editing behaviour. That behaviour is the problem: it was never fully specified, so browsers produce different HTML for the same keystroke (a `<div>`, a `<p>`, or a `<br>` for Enter), pasted content arrives with arbitrary markup and styles, and `document.execCommand` is deprecated and inconsistent. If the DOM is your source of truth, you inherit all of it. Other pitfalls: input method editors for Chinese, Japanese, and Korean fire composition events that you must not interrupt by re-rendering; Android keyboards report unhelpful key codes; selection across nested nodes is fiddly; a naive undo stack breaks as soon as you mutate the DOM yourself; and rendering stored HTML without sanitising it is an XSS hole.

Modern editors invert the relationship. They keep their **own document model**, constrained by a **schema** that says which nodes and marks are legal. User input is intercepted (largely through `beforeinput` and its `inputType`), turned into a **transaction** that produces a new immutable state, and the editable DOM is re-rendered from that state. The browser is used as an input device, not as the model. This is what makes consistent output, reliable undo, and collaboration possible.

The main choices:

- **ProseMirror**: the foundational toolkit. Schema, state, transforms, and view as separate modules. Very robust and unopinionated; you assemble a lot yourself.
- **Tiptap**: a friendlier, extension-based layer over ProseMirror with framework bindings. The usual choice when you want ProseMirror's model without its learning curve.
- **Lexical**: Meta's framework with its own node model and command system, strong React integration, and a small core.

All three support real-time collaboration through Yjs. Store the document as the editor's JSON, not as HTML, and render or export HTML from it. Accessibility basics still apply: the editable region needs `role="textbox"`, `aria-multiline="true"`, and a label, and toolbar buttons need names and `aria-pressed`. Chromium's EditContext API offers a cleaner way to receive text input without `contenteditable`, but it is not yet available in all browsers.

**Try it:** Make a bare `<div contenteditable>` and log `beforeinput` events with their `inputType`. Press Enter, apply bold with the keyboard shortcut, and paste from a word processor, in two different browsers, and compare the resulting `innerHTML`. Then do the same in a Tiptap starter and inspect its JSON output.

**Resources**
- [ProseMirror guide](https://prosemirror.net/docs/guide/)
- [Lexical: Introduction](https://lexical.dev/docs/intro)
- [MDN: beforeinput event](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event)

### Infinite canvas

An infinite canvas (Figma, Miro, tldraw, map views) is a camera looking at a world. Keep two coordinate spaces strictly separate: **world space**, where objects live and which never changes when you navigate, and **screen space**, which is pixels. The camera is three numbers: a translation `(x, y)` and a zoom `z`.

```js
const worldToScreen = (p, cam) => ({ x: p.x * cam.z + cam.x, y: p.y * cam.z + cam.y });
const screenToWorld = (p, cam) => ({ x: (p.x - cam.x) / cam.z, y: (p.y - cam.y) / cam.z });

// Zoom so the world point under the cursor stays under the cursor.
function zoomAt(cam, cursor, factor) {
  const z = Math.min(8, Math.max(0.1, cam.z * factor));
  const k = z / cam.z;
  return { z, x: cursor.x - (cursor.x - cam.x) * k, y: cursor.y - (cursor.y - cam.y) * k };
}
```

Zooming around the cursor rather than the origin is the detail that makes it feel right. Panning just adds the pointer delta to `cam.x`/`cam.y`. In a DOM or SVG implementation, apply the camera as one `transform: translate(x, y) scale(z)` with `transform-origin: 0 0` on a container; in canvas, call `ctx.setTransform(z * dpr, 0, 0, z * dpr, x * dpr, y * dpr)` and draw in world coordinates. `DOMMatrix` handles rotation and inversion if you need them.

**Hit testing** means converting the pointer to world space and asking which object contains it, iterating from topmost to bottom. Test rectangles and circles with arithmetic, complex shapes with `ctx.isPointInPath(path2d, x, y)` and thin lines with `isPointInStroke`, giving a tolerance that is constant in *screen* pixels (divide by zoom). For thousands of objects, use a spatial index (a quadtree or R-tree such as RBush) so you test only nearby candidates; the same index gives you **culling**, drawing only objects whose bounds intersect the visible world rectangle. An alternative is a colour-picking buffer: draw each object in a unique colour to a hidden canvas and read the pixel under the pointer.

Details that separate good from rough: handle wheel as pan and ctrl-wheel or pinch as zoom, keep selection handles and stroke widths constant on screen by dividing by zoom, snap rendering to device pixels to avoid shimmer, and provide keyboard navigation and zoom controls.

**Try it:** Build a canvas with a dot grid and a few rectangles in world space. Implement pan, cursor-centred wheel zoom, and click-to-select using `screenToWorld`. Write a unit test asserting that the world point under the cursor is unchanged by `zoomAt`.

**Resources**
- [MDN: DOMMatrix](https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix)
- [MDN: CanvasRenderingContext2D.isPointInPath()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/isPointInPath)
- [D3: d3-zoom (zoom transforms explained)](https://d3js.org/d3-zoom)

### Complex forms

Large forms fail on state management, not on inputs. Model four things separately: the **values**, the **validation errors**, per-field **meta state** (touched, dirty, validating), and **submission state**. Form libraries (React Hook Form, TanStack Form) exist to manage these without re-rendering the whole form on every keystroke.

**Dynamic fields.** Repeating groups (line items, addresses) need stable identity. Using the array index as the React `key` makes inputs swap values and lose focus when a row is removed or reordered. Use generated ids, as `useFieldArray` does:

```jsx
const { fields, append, remove } = useFieldArray({ control, name: 'items' });

{fields.map((field, i) => (
  <div key={field.id}>
    <input {...register(`items.${i}.name`)} />
    <button type="button" onClick={() => remove(i)}>Remove</button>
  </div>
))}
```

Decide what happens to the value of a conditionally hidden field: usually it should be cleared or excluded from validation and from the payload, otherwise invisible data blocks or pollutes submission.

**Dependent validation.** Some rules span fields (end date after start date, confirm password, total must not exceed budget). Express them in a schema with cross-field refinement (Zod's `refine`/`superRefine` attaching the issue to a specific `path`) and re-validate the dependent field when its dependency changes. Async rules such as "username available" must be debounced and must discard stale responses, either with an `AbortController` or by comparing against the latest value. The server validates everything again; map its field errors back onto the fields.

**Autosave.** Debounce saves (around a second after the last change), save on blur and before the page is hidden (`visibilitychange`), and show status: "Saving…", "Saved", "Couldn't save, retrying". Send only when dirty, serialise or abort in-flight requests so an older response cannot overwrite a newer one, and use a version or ETag so two tabs do not silently clobber each other. Keep a local draft in `localStorage` or IndexedDB so a crash or offline spell loses nothing, and never autosave over valid server data with an invalid draft.

For long forms, split into steps with per-step validation, keep earlier steps' data, and on a failed submit move focus to the first error.

**Try it:** Build an invoice form with add/remove line items, a validation rule that the sum of items must not exceed a budget field, and debounced autosave to a fake API with random latency. Remove the middle row and confirm values stay with the right rows; then verify that a slow early save cannot overwrite a later one.

**Resources**
- [React Hook Form: useFieldArray](https://react-hook-form.com/docs/usefieldarray)
- [MDN: Client-side form validation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation)
- [TanStack Form: Overview](https://tanstack.com/form/latest/docs/overview)

### Custom media players

`<video>` and `<audio>` share the `HTMLMediaElement` API. A custom player hides the native controls and drives the element through its properties, methods, and events; the UI should always be derived *from the element's events*, never from what you assume a click did.

```js
const video = document.querySelector('video');

playBtn.addEventListener('click', async () => {
  if (video.paused) {
    try { await video.play(); } catch (err) { /* autoplay blocked or load aborted */ }
  } else {
    video.pause();
  }
});
video.addEventListener('play', () => playBtn.setAttribute('aria-label', 'Pause'));
video.addEventListener('pause', () => playBtn.setAttribute('aria-label', 'Play'));
video.addEventListener('loadedmetadata', () => { seek.max = video.duration; });
video.addEventListener('timeupdate', () => { seek.value = video.currentTime; });
seek.addEventListener('input', () => { video.currentTime = Number(seek.value); });
```

Know these: `play()` returns a promise and rejects if autoplay policy blocks it (muted autoplay with `playsinline` is generally allowed); `duration` is `NaN` until `loadedmetadata` and `Infinity` for live streams; `timeupdate` fires only a few times a second, so use `requestAnimationFrame` or `requestVideoFrameCallback` for a smooth progress bar; `buffered` and `seekable` are `TimeRanges`; `waiting`, `stalled`, `ended`, and `error` drive spinner and error states. Call `requestFullscreen()` on the player *wrapper* so your controls come along. Set `width`/`height` or `aspect-ratio` and a `poster` to avoid layout shift, and `preload="metadata"` to avoid downloading video nobody plays.

Accessible controls are mostly native elements used properly: real `<button>`s with names that reflect state, `<input type="range">` for seek and volume with `aria-valuetext` such as "1 minute 5 seconds of 4 minutes", visible focus, and controls that do not vanish while focused. Follow established keyboard conventions (Space or K to toggle, arrows to seek and change volume, M to mute, F for fullscreen) only when focus is inside the player. Provide captions with `<track kind="captions" src="…vtt" srclang="en">` and a captions toggle via `video.textTracks`; captions are required for prerecorded video with audio, and a transcript helps everyone. Add the Media Session API for lock-screen and hardware key integration. Before building, consider whether the native controls or a maintained component such as Media Chrome or Vidstack already meet the need.

**Try it:** Build a player with play/pause, a seek slider, mute, captions toggle, and fullscreen, using only native buttons and range inputs. Operate it entirely by keyboard, then with a screen reader, and check the Media panel in DevTools for the event sequence when you seek.

**Resources**
- [MDN: HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement)
- [MDN: Creating a cross-browser video player](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Audio_and_video_delivery/cross_browser_video_player)
- [W3C WAI: Making audio and video media accessible, media players](https://www.w3.org/WAI/media/av/player/)

### Streaming

A plain `<video src="file.mp4">` is *progressive download*: one file at one quality. **Adaptive bitrate streaming** instead encodes the video at several qualities (a "ladder" of renditions), cuts each into segments a few seconds long, and publishes a **manifest** listing them. The player measures throughput and buffer level and picks the rendition for each next segment, so quality adapts to the network without stalling.

The two formats: **HLS** (Apple) uses `.m3u8` playlists, a multivariant playlist pointing to one media playlist per rendition. **MPEG-DASH** uses an XML `.mpd`. Both now commonly carry the same fragmented MP4 (CMAF) segments, so one set of media files can serve both manifests. Live streams are a manifest that keeps growing; low-latency variants use partial segments.

Browsers do not parse DASH, and most do not natively play HLS. Safari plays HLS directly in `<video>`. Elsewhere, a JavaScript player fetches the manifest and segments and feeds bytes to the media element through **Media Source Extensions**:

```js
const ms = new MediaSource();
video.src = URL.createObjectURL(ms);
ms.addEventListener('sourceopen', async () => {
  const sb = ms.addSourceBuffer('video/mp4; codecs="avc1.64001f, mp4a.40.2"');
  sb.appendBuffer(await (await fetch('/init.mp4')).arrayBuffer());
  // wait for 'updateend' before each further appendBuffer(segment)
});
```

You will not write that loop in production. Use **hls.js**, **dash.js**, or **Shaka Player**, which handle rendition switching, buffer management, error recovery, captions, and DRM through Encrypted Media Extensions. The standard hls.js pattern is: if `Hls.isSupported()`, attach it; otherwise, if `video.canPlayType('application/vnd.apple.mpegurl')`, set `video.src` to the playlist and let the browser play it. iPhones do not expose classic MSE; Safari there provides `ManagedMediaSource`, which current hls.js uses when available.

Operational points: segments are ordinary HTTP files, so they cache on a CDN, but they need CORS headers when served from another origin. Check codec support with `MediaSource.isTypeSupported()`. Tune start-up time (initial rendition, preload) and measure rebuffering. Unless video is your product, a hosted pipeline (Mux, Cloudflare Stream, and similar) handles encoding and delivery.

**Try it:** Play a public HLS test stream with hls.js. Open the Network panel and identify the multivariant playlist, a media playlist, and the segments. Throttle to "Fast 4G" then "Slow 4G" and watch the requested rendition change; log the `LEVEL_SWITCHED` event.

**Resources**
- [MDN: Media Source Extensions API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API)
- [hls.js: API documentation](https://github.com/video-dev/hls.js/blob/master/docs/API.md)
- [web.dev: Media Source Extensions basics](https://web.dev/articles/media-mse-basics)

### WebRTC

WebRTC sends audio, video, and arbitrary data directly between browsers with low latency. The browser handles capture, encoding, encryption, congestion control, and NAT traversal. What it deliberately does not provide is **signaling**: the way two peers find each other and exchange connection details. You build that, usually over a WebSocket.

A connection needs two exchanges through your signaling channel:

1. **Offer/answer (SDP).** One peer creates an offer describing its media and codecs, the other responds with an answer. Each side calls `setLocalDescription` with its own and `setRemoteDescription` with the other's.
2. **ICE candidates.** Each peer discovers addresses it might be reachable at and sends them across as they appear. A **STUN** server tells a peer its public address; when direct paths fail (symmetric NATs, strict firewalls), a **TURN** server relays the media. A meaningful minority of real-world calls need TURN, so "works on my Wi-Fi" proves little.

```js
const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
stream.getTracks().forEach((track) => pc.addTrack(track, stream));

pc.ontrack = ({ streams }) => { remoteVideo.srcObject = streams[0]; };
pc.onicecandidate = ({ candidate }) => signaling.send({ candidate });
pc.onnegotiationneeded = async () => {
  await pc.setLocalDescription();          // creates the right offer implicitly
  signaling.send({ description: pc.localDescription });
};
```

Handle incoming messages with the **perfect negotiation** pattern from MDN, which assigns one peer to be "polite" so simultaneous offers resolve without deadlock. Watch `pc.connectionState` for `failed` and `disconnected` and restart ICE when needed.

Working knowledge also means knowing the limits. Peer-to-peer is a mesh: each participant uploads a stream to every other, which stops scaling at around four to six people. Group calls use a server called an **SFU** (selective forwarding unit) that receives each stream once and forwards it; in practice you use LiveKit, mediasoup, Daily, or a similar platform rather than building one. `getUserMedia` needs HTTPS and a permission prompt; handle denial and missing devices. `RTCDataChannel` gives you peer-to-peer data for games or file transfer. Debug with `chrome://webrtc-internals` and `pc.getStats()`.

**Try it:** Create two `RTCPeerConnection` objects in one page and connect them by passing descriptions and candidates directly between them, showing your camera in a second `<video>`. Then split it into two tabs with a tiny WebSocket relay, and inspect the selected candidate pair in `chrome://webrtc-internals`.

**Resources**
- [MDN: Signaling and video calling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)
- [MDN: Establishing a connection, the perfect negotiation pattern](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation)
- [WebRTC.org: Getting started with peer connections](https://webrtc.org/getting-started/peer-connections)

### Web Audio

Web Audio is a graph. Inside an `AudioContext` you connect **source** nodes (an oscillator, a decoded buffer, a media element, a microphone) through **processing** nodes (gain, filter, delay, compressor) to `ctx.destination`. Audio runs on a separate high-priority thread, and you control it from JavaScript by scheduling against the context's own clock, `ctx.currentTime`, in seconds.

**Synthesis** at its simplest:

```js
const ctx = new AudioContext();

function beep(freq = 440, dur = 0.3) {
  const osc = new OscillatorNode(ctx, { type: 'sine', frequency: freq });
  const gain = new GainNode(ctx, { gain: 0 });
  osc.connect(gain).connect(ctx.destination);

  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.3, t + 0.01);          // attack
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);   // release
  osc.start(t);
  osc.stop(t + dur);
}

button.addEventListener('click', async () => {
  await ctx.resume(); // contexts start suspended until a user gesture
  beep();
});
```

The points that the snippet encodes: browsers' autoplay policy leaves a context `suspended` until a user gesture, so call `resume()` in a click handler. Source nodes are single-use: after `stop()` you create a new one, which is cheap. Starting or stopping a signal abruptly produces an audible click, so always shape volume with a short ramp. `exponentialRampToValueAtTime` cannot reach zero; ramp to a tiny value. Parameters like `gain.gain` and `osc.frequency` are `AudioParam`s with sample-accurate scheduling methods; use those, and `ctx.currentTime`, for timing instead of `setTimeout`, which jitters.

**Analysis** uses `AnalyserNode`, which exposes the signal without changing it:

```js
const analyser = new AnalyserNode(ctx, { fftSize: 2048 });
source.connect(analyser);
const bins = new Uint8Array(analyser.frequencyBinCount); // fftSize / 2
function draw() {
  analyser.getByteFrequencyData(bins); // or getByteTimeDomainData for a waveform
  render(bins);
  requestAnimationFrame(draw);
}
```

Each bin covers `sampleRate / fftSize` Hz. For playback of files, `fetch` then `ctx.decodeAudioData()` gives an `AudioBuffer` for an `AudioBufferSourceNode`; for long tracks, wrap an `<audio>` element with `createMediaElementSource` (cross-origin audio needs CORS or it outputs silence). Custom DSP belongs in an `AudioWorklet`. Keep overall gain modest and close contexts you no longer need.

**Try it:** Build a one-octave keyboard that plays oscillator notes with an attack and release envelope, and draw the live frequency spectrum on a canvas with an `AnalyserNode`. Remove the ramps and listen for the clicks; then switch the oscillator type to `square` and see the harmonics appear.

**Resources**
- [MDN: Using the Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)
- [MDN: AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode)
- [MDN: Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

### Interactive dashboard

This project proves you can make several charts behave as one instrument. Pick a real dataset with a time dimension, a couple of categories, and at least one measure: the vega-datasets collection, a city open-data portal, or your own exported data. Real data brings the problems that matter: gaps, outliers, long labels, skew, and time zones.

Design it before coding. Write down three or four questions the dashboard answers, and give each a view chosen by the chart selection rules: for example a timeline, a ranked bar chart by category, a distribution, and a table of detail. Then design the **linking**: one shared filter state that every view both reads and writes.

```js
// one source of truth, stored in the URL so views are shareable
const filters = { range: [start, end], category: null, hovered: null };
const visible = rows.filter((r) => inRange(r.date, filters.range)
  && (!filters.category || r.category === filters.category));
```

Brushing the timeline sets `range`; clicking a bar toggles `category`; hovering sets `hovered`, which highlights the same entity everywhere. Derive each chart's data from the filtered rows with memoised selectors, and keep transient hover state out of anything that triggers expensive recomputation. Show the active filters as removable chips with a "reset" control so users always know what they are looking at.

Requirements that make it a real product rather than a demo: loading, empty ("no data for this selection"), and error states for every panel; a responsive layout that reflows to one column; numbers and dates formatted with `Intl`; keyboard-operable filters; a text summary and table alternative for each chart; and smooth interaction with the full dataset. If filtering is slow, pre-aggregate, or move the computation to a worker.

Test the data logic (filtering and aggregation) with unit tests, and add one Playwright test that brushes a range and asserts that another chart's values change.

**Try it:** Before building, sketch the dashboard on paper and write the three questions it answers. After building, hand it to someone unfamiliar with the data, ask them those questions, and watch whether they can answer each in under a minute without help.

**Resources**
- [vega-datasets: a collection of real datasets for visualisation](https://github.com/vega/vega-datasets)
- [D3: d3-brush](https://d3js.org/d3-brush)
- [Observable Framework: Getting started (builds a dashboard step by step)](https://observablehq.com/framework/getting-started)

### Canvas app

Build a drawing tool or a small game; either forces you to own a render loop, input handling, and state. The architecture to aim for separates three things: **state** (the list of strokes or game entities, in world coordinates), **update** (advance state from input and time), and **draw** (render state to pixels, with no side effects on state).

For a game, use a fixed-timestep update so physics is deterministic regardless of refresh rate, and render as often as the display allows:

```js
const STEP = 1 / 60;
let acc = 0, last = performance.now();

function frame(now) {
  acc += Math.min((now - last) / 1000, 0.25);
  last = now;
  while (acc >= STEP) { update(STEP); acc -= STEP; }
  draw(acc / STEP); // interpolation factor for smooth rendering
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

For a drawing tool, you do not need to draw every frame: set a `dirty` flag when state changes and redraw only then. Capture input with pointer events, `setPointerCapture`, and `touch-action: none`, and read `e.getCoalescedEvents()` so fast strokes are not jagged. Store strokes as arrays of points (with `pressure` for pens), and smooth them by drawing quadratic curves through midpoints instead of straight segments. Keep finished strokes on a cached offscreen canvas and draw only the in-progress stroke on top.

The features that prove competence: correct high-DPI scaling and resize handling; undo and redo implemented as a stack of commands or state snapshots, not pixel copies; export via `canvas.toBlob()`; pause when `document.visibilityState` is hidden; and stable performance (no allocations inside the loop, checked in the Performance panel). For a game, add collision detection, a start/pause/game-over state machine, and keyboard controls that track a set of currently pressed keys instead of acting on `keydown` repeats.

Do not forget accessibility: a canvas is opaque, so give the controls real buttons with names, support keyboard operation where it makes sense, respect `prefers-reduced-motion`, and offer a pause control for anything that moves.

**Try it:** After the app works, throttle the CPU by 6x and open it on a 120Hz or 144Hz display if you have one. Movement speed should be identical at every frame rate, strokes should stay smooth, and the Performance panel should show no long frames while drawing.

**Resources**
- [MDN: Anatomy of a video game (the main loop)](https://developer.mozilla.org/en-US/docs/Games/Anatomy)
- [MDN: Window.requestAnimationFrame()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [MDN: PointerEvent.getCoalescedEvents()](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/getCoalescedEvents)

### Kanban board

A Kanban board is the standard test of accessible drag and drop: cards reorder within a column and move between columns, by pointer and by keyboard, with screen reader feedback.

Model the data first. Keep columns as a map from column id to an ordered array of card ids, so a move is a pure function you can unit test:

```js
function moveCard(board, cardId, toColumn, toIndex) {
  const next = Object.fromEntries(
    Object.entries(board).map(([col, ids]) => [col, ids.filter((id) => id !== cardId)]),
  );
  next[toColumn] = next[toColumn].toSpliced(toIndex, 0, cardId);
  return next;
}
```

With dnd-kit, each card calls `useSortable({ id, index, group: columnId, type: 'item', accept: 'item' })` from `@dnd-kit/react/sortable`, each column is a droppable that accepts items, and the `DragDropProvider`'s `onDragOver` updates state with the `move` helper from `@dnd-kit/helpers` so cards make room as you drag. In `onDragEnd`, check `event.canceled` and restore the snapshot you took at drag start. The docs' multiple sortable lists guide is exactly this build.

Semantics: render each column as a labelled list (`<section aria-labelledby>` containing `<ul>`/`<li>`), with the card's drag handle a real `<button>` whose name includes the card title. The keyboard path must cover everything the pointer can do: pick up with Space or Enter, up/down to reorder, left/right to change column, Space to drop, Escape to cancel and return the card to where it started. Announce each step through a live region with specifics: "Moved Fix login bug to In progress, position 2 of 4." After the drop, focus must stay on the moved card. Add a non-drag alternative as well, such as a "Move to…" menu on each card; it satisfies WCAG 2.5.7 on its own, and many pointer users prefer it for long boards.

Finish it properly: an empty column must still be a valid drop target, long boards need auto-scroll during drag, persistence should be optimistic with rollback on failure, and reduced-motion users should not get sliding animations. Test `moveCard` exhaustively, and add Playwright tests for one pointer drag and one full keyboard move.

**Try it:** With the board complete, unplug your mouse. Move a card from the first column to the last, to the top position, using only the keyboard with a screen reader on. Then cancel a move halfway with Escape and confirm both the visual state and the announcement are right.

**Resources**
- [dnd-kit: Multiple sortable lists guide](https://dndkit.com/react/guides/multiple-sortable-lists)
- [W3C: Understanding SC 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- [MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)
