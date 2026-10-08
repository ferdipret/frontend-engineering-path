# Graphics, Visualisation, and Rich Interaction: Practice test

### 1. This SVG is displayed at 200 by 200 CSS pixels. Where does the circle appear?

```html
<svg viewBox="0 0 50 50" width="200" height="200">
  <circle cx="25" cy="25" r="10" />
</svg>
```

- [ ] In the top-left corner, 20px across, because `cx`, `cy`, and `r` are in CSS pixels
- [x] Centred, 80px across, because user units are scaled 4x to fill the viewport
- [ ] Centred, 20px across, because `viewBox` only moves the origin
- [ ] Nowhere: a `viewBox` smaller than the element clips the circle

> The `viewBox` maps a 50 by 50 region of user space onto the 200 by 200 viewport, a scale of 4. The centre (25, 25) lands at (100, 100) and the radius of 10 becomes 40px, so the circle is 80px across. Coordinates inside an SVG are user units, not CSS pixels; they only coincide when there is no `viewBox` or it matches the element's size.

### 2. An icon's stroke is supposed to "draw itself" on load, but it appears fully drawn immediately and nothing animates. What is wrong?

```css
.icon path {
  stroke-dasharray: 1;
  animation: draw 1s ease-out forwards;
}
@keyframes draw {
  to { stroke-dashoffset: 0; }
}
```

```html
<svg class="icon" viewBox="0 0 24 24"><path pathLength="1" d="M4 12 l5 5 l11 -11" fill="none" stroke="currentColor" /></svg>
```

- [ ] `pathLength` cannot be used together with `stroke-dasharray`
- [ ] `stroke-dashoffset` is not animatable with CSS, so SMIL is required
- [x] There is no starting `stroke-dashoffset: 1`, so the animation runs from 0 to 0
- [ ] `forwards` holds the first keyframe, which keeps the path fully drawn

> With `pathLength="1"` and `stroke-dasharray: 1`, the dash covers the whole path. The effect needs the dash shifted out of view first with `stroke-dashoffset: 1`, then animated to 0. The initial value of `stroke-dashoffset` is 0, so this animation goes from 0 to 0. `stroke-dashoffset` animates fine in CSS, and `pathLength` exists precisely to make this technique easy.

### 3. Which markup is correct for an icon-only delete button?

- [ ] `<svg role="button" aria-label="Delete" onclick="…">…</svg>`
- [ ] `<button><svg><title>Delete</title>…</svg></button>` with nothing else, relying on the tooltip
- [ ] `<button aria-hidden="true"><svg aria-label="Delete">…</svg></button>`
- [x] `<button aria-label="Delete"><svg aria-hidden="true">…</svg></button>`

> Name the control and hide the graphic. A real `<button>` gives you focus, keyboard activation, and the button role for free; `aria-label` gives it a name; `aria-hidden` stops the SVG's internals being announced. A bare SVG with `role="button"` is not focusable or keyboard-operable without extra work. `aria-hidden` on the button removes the whole control from the accessibility tree while leaving it focusable, which is worse than no label.

### 4. A canvas is styled to 400 by 300 CSS pixels and looks blurry on a phone with a device pixel ratio of 3. Which fix is right?

- [ ] Set `image-rendering: crisp-edges` on the canvas
- [x] Set the `width` and `height` attributes to 1200 and 900, keep the CSS size, and scale the context by 3
- [ ] Set the CSS size to 1200 by 900 so there are more pixels to draw on
- [ ] Call `ctx.imageSmoothingEnabled = false` before drawing

> The bitmap (the `width`/`height` attributes) must match the number of device pixels the canvas covers; the CSS size stays at 400 by 300. Then `ctx.setTransform(3, 0, 0, 3, 0, 0)` lets you keep drawing in CSS pixel coordinates. Making the CSS box bigger just makes a bigger blurry canvas. `imageSmoothingEnabled` only affects how `drawImage` scales images, and `image-rendering` changes the upscaling algorithm without adding detail.

### 5. What is the bug in this render loop?

```js
let x = 0;
function frame() {
  x += 4;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(x, 50, 20, 20);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

- [ ] `clearRect` must be called after drawing, not before
- [ ] `requestAnimationFrame` should be replaced by `setInterval(frame, 16)` for consistent timing
- [x] Speed depends on the display's refresh rate: the square moves twice as fast at 120Hz as at 60Hz
- [ ] The loop leaks memory because each call adds a new callback that is never removed

> Movement is a fixed 4 pixels per frame, and `requestAnimationFrame` fires once per display refresh, so speed scales with refresh rate. Use the timestamp passed to the callback to compute elapsed time and move by `speed * dt`, clamping `dt` so a background tab does not cause a jump. `setInterval` is worse: it is not synchronised with the display and drifts. Each rAF callback runs once and is discarded, so nothing leaks.

### 6. After this code runs on the main thread, what happens on the last line?

```js
const canvas = document.querySelector('canvas');
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen }, [offscreen]);
const ctx = canvas.getContext('2d');
```

- [x] It throws, because control of the canvas has been transferred and the element can no longer create a context
- [ ] It returns a context that draws to the same bitmap, so both threads can draw
- [ ] It returns `null` silently, and the worker's context is also invalidated
- [ ] It works, but everything drawn is overwritten on the worker's next frame

> `transferControlToOffscreen()` hands the element's rendering to the `OffscreenCanvas`. From then on the placeholder element cannot create its own context (an `InvalidStateError` is thrown), and you cannot set its `width` or `height` either. All drawing, and therefore all resizing, must be done in the worker through messages. The `OffscreenCanvas` itself was transferred in the `postMessage` call, so the main thread cannot use that either.

### 7. In the WebGL pipeline, what is the job of the vertex shader?

- [ ] It runs once per pixel and outputs that pixel's colour
- [ ] It uploads vertex data from JavaScript arrays into GPU buffers
- [ ] It decides which triangles are hidden behind others
- [x] It runs once per vertex and outputs that vertex's position in clip space

> The vertex shader transforms each vertex (usually by model, view, and projection matrices) into clip space, where visible coordinates run from -1 to 1. The GPU then rasterises triangles into fragments, and the fragment shader, which is the one that runs per pixel, computes colours. Uploading data is done by `gl.bufferData` from JavaScript, and hidden-surface removal is the depth test after the fragment stage.

### 8. A Three.js scene shows a completely black cube. Which is the most likely cause?

```js
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({ color: 0xff0000 }),
);
scene.add(cube);
renderer.setAnimationLoop(() => renderer.render(scene, camera));
```

- [ ] `MeshStandardMaterial` requires a texture; a plain colour renders black
- [x] There are no lights in the scene, and `MeshStandardMaterial` only shows light it receives
- [ ] `setAnimationLoop` does not pass the scene to the renderer
- [ ] The colour must be given as a CSS string, not a hex number

> `MeshStandardMaterial` is physically based: with no light and no environment map there is nothing to reflect, so it renders black. Add an ambient or hemisphere light plus a directional light, or set `scene.environment`. `MeshBasicMaterial` would show red without lights because it ignores lighting. Hex numbers are a valid colour form, and the loop shown is correct.

### 9. Which statement about WebGPU is accurate as of late 2026?

- [ ] It is Baseline widely available, so no fallback is needed
- [ ] It is a thin wrapper that runs GLSL shaders faster than WebGL does
- [x] It adds compute shaders and a lower-overhead API, but support still varies by browser and platform, so feature detection and a fallback are required
- [ ] It works only in Chromium browsers and only behind a flag

> WebGPU's main additions are compute shaders, an explicit pipeline-based API with less per-draw CPU overhead, and WGSL. It ships by default in Chromium, in Safari 26 and later, and in Firefox on Windows and Apple Silicon macOS, but not yet everywhere (Firefox on Linux and Android, some Android and Linux GPUs), and `requestAdapter()` can return `null` even when `navigator.gpu` exists. MDN still lists it as limited availability. It uses WGSL, not GLSL.

### 10. You need to show a scatterplot of 200,000 points that the user can pan and zoom, with a tooltip for the nearest point. Which approach fits best?

- [ ] SVG, one `<circle>` per point, with a `mouseenter` listener on each
- [ ] DOM, one absolutely positioned `<div>` per point, with CSS transforms for zoom
- [ ] A single SVG `<path>` containing every point, with hit testing by `isPointInPath`
- [x] Canvas or WebGL for the points, a spatial index for nearest-point lookup, and a DOM tooltip

> 200,000 DOM or SVG nodes are far beyond what style, layout, and paint can handle interactively. Canvas (or WebGL at this size) draws them cheaply, a quadtree or similar index finds the nearest point in logarithmic time, and the tooltip stays in the DOM where text and accessibility are easy. One giant path would draw, but you would lose per-point identity and still have no efficient lookup.

### 11. A manager asks for a chart comparing revenue across 12 product categories. Which choice is best, and why?

- [ ] A pie chart, because the categories are parts of total revenue
- [ ] A line chart, because it shows the differences between adjacent categories most clearly
- [x] A sorted horizontal bar chart, because position and length on a common scale are read most accurately and the labels fit
- [ ] A 3D column chart, because depth separates the categories visually

> Comparison across categories is best encoded as length on a shared baseline, sorted so rank is immediate, and horizontal so 12 labels are readable. People judge angles and areas poorly, and 12 slices is far too many for a pie. A line implies a continuous order between categories that does not exist. 3D distorts every bar's apparent height.

### 12. What does this log?

```js
import { scaleLinear } from 'd3-scale';

const y = scaleLinear().domain([0, 100]).range([300, 0]);
console.log(y(25), y.invert(150));
```

- [ ] 75 and 50
- [ ] 225 and 150
- [x] 225 and 50
- [ ] 75 and 150

> The range is inverted because SVG's y axis points down: 0 maps to 300 and 100 maps to 0. 25 is a quarter of the way through the domain, so it maps a quarter of the way from 300 to 0, which is 225. `invert` goes from pixels back to data: 150 is halfway through the range, so it corresponds to 50.

### 13. A line chart of 2 million sensor readings is slow and its SVG path is enormous. A colleague suggests plotting every 1,000th reading. What is the main problem with that, and what is better?

- [ ] Nothing: taking every nth point is the standard approach and preserves the shape
- [x] It can drop short spikes entirely; keep the min and max per pixel column, or use LTTB, so extremes survive
- [ ] It changes the x axis scale; resample by averaging each bucket so the scale is preserved
- [ ] It is too slow; use CSS `will-change: transform` on the path so the GPU draws it

> Fixed-stride sampling keeps an arbitrary point from each bucket, so a one-sample spike has a 1 in 1,000 chance of surviving. Min/max decimation keeps the extremes of each bucket and LTTB picks the points that best preserve the visual shape. Averaging also hides spikes by flattening them. `will-change` does nothing for the cost of building and rasterising a multi-megabyte path.

### 14. A MapLibre map meant to show London opens on empty ocean off the coast of Somalia, and the marker layer never appears. What are the two mistakes?

```js
const map = new Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [51.5, -0.12],
  zoom: 10,
});

map.addSource('shops', { type: 'geojson', data: '/shops.geojson' });
map.addLayer({ id: 'shops', type: 'circle', source: 'shops' });
```

- [ ] The style URL must point to a `.pbf` tile, and `circle` layers need a `paint` object
- [x] Coordinates must be `[longitude, latitude]`, and sources and layers must be added after the map's `load` event
- [ ] `zoom` must be an integer tile level, and GeoJSON sources must be inlined rather than fetched by URL
- [ ] Coordinates must be given as `{ lat, lng }` objects, and `addLayer` must be called before `addSource`

> MapLibre, like GeoJSON, orders coordinates as longitude then latitude. `[51.5, -0.12]` is 51.5° east on the equator, in the Indian Ocean; London is `[-0.12, 51.5]`. The style is fetched asynchronously, so adding sources or layers before it has loaded throws; wrap those calls in `map.on('load', …)`. The style URL points at a style JSON document (which in turn lists tile sources), zoom can be fractional with vector tiles, a GeoJSON source accepts a URL, and a layer must reference a source that already exists.

### 15. A custom slider handle works with a mouse, but on a phone the drag stops after a few pixels and the page scrolls instead. The handler never sees `pointerup`. What fixes it?

```js
handle.addEventListener('pointerdown', (e) => {
  handle.setPointerCapture(e.pointerId);
  handle.addEventListener('pointermove', onMove);
});
```

- [ ] Call `e.preventDefault()` inside the `pointermove` handler
- [ ] Listen for `touchmove` on `window` as well as `pointermove`
- [x] Set `touch-action: none` (or `pan-y` for a horizontal slider) on the handle in CSS
- [ ] Replace `setPointerCapture` with a `pointermove` listener on `document`

> By default the browser treats a touch drag as a scroll, sends `pointercancel`, and stops delivering pointer events. `touch-action` declares in advance which gestures the browser may handle; with `none` (or `pan-y`, which leaves vertical scrolling to the browser but gives you horizontal movement) your handler keeps the pointer. Calling `preventDefault()` on pointer events does not stop scrolling, and document-level listeners are cancelled the same way.

### 16. A team builds a rich text editor by reading `element.innerHTML` from a `contenteditable` div and saving it. Which problem is inherent to that design?

- [ ] `contenteditable` does not support undo
- [ ] `innerHTML` cannot represent bold or italic text
- [ ] `contenteditable` elements cannot receive paste events
- [x] The browser decides the markup, so the same edit produces different HTML across browsers, and pasted content can inject arbitrary markup

> When the DOM is the source of truth, you get whatever each browser's editing code generates: different elements for a line break, nested or redundant formatting tags, and pasted styles and markup, some of it unsafe. Editor frameworks such as ProseMirror, Tiptap, and Lexical keep their own schema-constrained document model, turn input into transactions, and render the DOM from the model. Native undo does exist, but it breaks as soon as you modify the DOM programmatically.

### 17. An infinite canvas stores a camera as `{ x, y, z }` and renders with `screen = world * z + (x, y)`. Zooming with this function makes content slide away from the cursor. Fix it.

```js
function zoom(cam, cursor, factor) {
  return { ...cam, z: cam.z * factor };
}
```

> Scaling alone zooms around the screen origin, so every point moves away from or towards the top-left corner. To keep the world point under the cursor fixed, adjust the translation as well. The world point under the cursor is `w = (cursor - cam.xy) / cam.z`; after zooming it must still map to `cursor`, so `newXY = cursor - w * newZ`:
>
> ```js
> function zoom(cam, cursor, factor) {
>   const z = cam.z * factor;
>   const k = z / cam.z;
>   return {
>     z,
>     x: cursor.x - (cursor.x - cam.x) * k,
>     y: cursor.y - (cursor.y - cam.y) * k,
>   };
> }
> ```
>
> A good unit test asserts that `screenToWorld(cursor)` is the same before and after. In practice you also clamp `z` to a minimum and maximum.

### 18. This virtualised list of chat messages shows large gaps and overlapping rows. Messages vary from one line to twenty. What is wrong and how do you fix it?

```jsx
const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 40,
});

{virtualizer.getVirtualItems().map((v) => (
  <div key={v.key} style={{ position: 'absolute', top: 0, width: '100%',
    transform: `translateY(${v.start}px)` }}>
    {messages[v.index].text}
  </div>
))}
```

> The virtualizer only knows the estimate, 40px, so it positions every row as if it were 40px tall. Real rows are taller, so they overlap, and the total height is wrong. Rows of unknown height must be measured: give each row `data-index={v.index}` and `ref={virtualizer.measureElement}`, so the library observes the element's real size, caches it, and recomputes the offsets of later rows.
>
> Also improve the estimate (use a typical message height, or estimate from text length) so the scrollbar does not jump as measurements arrive, set `getItemKey` to the message id so cached sizes follow items when the list changes, and add some `overscan`. The inner container must have `position: relative` and `height: virtualizer.getTotalSize()`.

### 19. Explain why WCAG requires an alternative to drag and drop, and describe the keyboard interaction and announcements you would implement for a sortable list.

> Dragging requires holding a pointer down while moving along a path, which many people cannot do: keyboard and switch users, screen reader users, people with tremors or limited dexterity, and people using voice control. WCAG 2.1.1 requires keyboard operability, and WCAG 2.2's 2.5.7 Dragging Movements requires a single-pointer alternative that needs no dragging.
>
> Keyboard model: each item (or its handle) is a focusable button. Space or Enter picks it up, the up and down arrows move it, Space or Enter drops it, and Escape cancels and restores the original position. Focus stays on the moved item throughout and after the drop.
>
> Announcements go through a live region so they are spoken without moving focus: on pick-up, "Picked up Buy milk, position 2 of 5. Use arrow keys to move, Space to drop, Escape to cancel"; on each move, "Buy milk, position 3 of 5"; on drop, "Dropped Buy milk at position 3 of 5"; on cancel, "Move cancelled, Buy milk returned to position 2." Instructions should also be available through `aria-describedby` on the handle.
>
> In addition, offer a non-drag control such as "Move up"/"Move down" buttons or a "Move to" menu. That satisfies 2.5.7 for pointer users who cannot drag, and libraries such as dnd-kit provide the keyboard sensor and announcements for the rest.

### 20. A product page shows a bar chart of quarterly revenue for four regions, coloured red, green, orange, and brown, rendered to a `<canvas>`. List the accessibility problems and how you would fix each.

> Problems and fixes:
>
> 1. A canvas exposes nothing to assistive technology. Give it `role="img"` with an accessible name, and provide a text summary of what the chart shows (trend, highest and lowest, the conclusion) in visible text or linked with `aria-describedby`.
> 2. There is no access to the values. Provide a data table, visible or behind a "View as table" toggle or `<details>`, or a download.
> 3. Red, green, orange, and brown are easily confused with red-green colour vision deficiency, and colour alone identifies the regions, which fails WCAG 1.4.1. Use a colour-blind-safe palette (Okabe-Ito, a ColorBrewer safe scheme) and add a second cue: direct labels on the bars or groups, or patterns.
> 4. Bars and text need sufficient contrast: 3:1 for the graphical marks against the background and 4.5:1 for label text.
> 5. If values appear only in a hover tooltip, keyboard and touch users cannot reach them. Make the chart focusable with arrow-key navigation between bars that announces each value, or rely on the table.
> 6. Canvas text does not respond to user font settings and blurs under zoom unless redrawn at the right pixel ratio; put the title, axis labels, and legend in DOM text where possible. Check forced-colors mode and respect `prefers-reduced-motion` for any animated entrance.

### 21. Explain the difference between raster and vector map tiles, and what you would do when a MapLibre map becomes slow after loading a 150MB GeoJSON file of 400,000 points.

> Both kinds of tile divide the world into a pyramid addressed by zoom, column, and row. A raster tile is a pre-rendered image: simple, but fixed in style, blurry between zoom levels, and unable to rotate labels or be restyled on the client. A vector tile carries geometry and attributes in named layers, and the client draws it with WebGL according to a style document. That gives sharp rendering at any zoom, rotation and tilt with upright labels, runtime restyling (themes, label language), and features you can query and style from their data. The cost is more client-side work and a GPU requirement.
>
> A GeoJSON source is downloaded whole, parsed, and cut into tiles in a worker in the browser. At 150MB that means a long download, high memory use, and slow updates, especially on phones. Options, roughly in order of effort:
>
> 1. Reduce what is sent: drop unused properties, round coordinates to five or six decimals, and serve it compressed.
> 2. Turn on clustering on the source (`cluster: true`) so dense points are aggregated at low zooms, and style clusters and single points with separate layers.
> 3. Aggregate for overview zooms (a heatmap layer, or server-side bins) and show individual points only when zoomed in.
> 4. Stop shipping GeoJSON: pre-build vector tiles from the data with a tool such as tippecanoe, host them as a tile set or a single PMTiles archive, and add them as a `vector` source. The browser then downloads only the tiles in view, at a level of detail suited to the zoom.
> 5. For heavy analytical overlays, render the points with deck.gl on top of the map.
>
> Whichever you choose, use `setFeatureState` for hover and selection so interaction does not re-upload data, and check that aggregation does not hide what the map is meant to show.

### 22. This custom play button sometimes shows "Pause" while the video is not playing, and the console shows an unhandled promise rejection. Explain both and rewrite it.

```js
playBtn.addEventListener('click', () => {
  video.play();
  playBtn.textContent = 'Pause';
});
```

> `video.play()` is asynchronous and returns a promise. It rejects when the browser's autoplay policy blocks playback, when the source fails to load, or when a `pause()` or new load interrupts it. The code ignores the promise, which produces the unhandled rejection, and it changes the label optimistically, so the UI says "Pause" even when playback never started. The label can also drift if playback is paused by something else: the end of the media, a hardware media key, or the browser.
>
> Derive the UI from the element's own events and handle the rejection:
>
> ```js
> playBtn.addEventListener('click', async () => {
>   if (video.paused) {
>     try {
>       await video.play();
>     } catch (err) {
>       showMessage('Playback could not start.');
>     }
>   } else {
>     video.pause();
>   }
> });
>
> const sync = () => { playBtn.textContent = video.paused ? 'Play' : 'Pause'; };
> video.addEventListener('play', sync);
> video.addEventListener('pause', sync);
> video.addEventListener('ended', sync);
> ```

### 23. Two browsers need to start a WebRTC video call. Describe what has to be exchanged, what your server is responsible for, and why a call that works in the office can fail for a customer.

> WebRTC does not define how peers find each other, so your application provides a signaling channel, typically a WebSocket through your server. Two kinds of message cross it. First, session descriptions: one peer creates an SDP offer describing its media tracks and codecs and sets it as its local description; the other sets it as its remote description, creates an answer, and sends that back. Second, ICE candidates: each peer gathers possible network addresses (local, public as discovered through a STUN server, and relayed through a TURN server) and sends them to the other peer, which adds them. ICE then tests candidate pairs and picks one that works, after which encrypted media flows directly between the browsers.
>
> The server's responsibilities are signaling (relaying those messages between the right users, plus room and presence logic) and providing STUN and TURN servers. It does not carry media in a simple peer-to-peer call.
>
> In the office, both peers are often on the same network or behind friendly NATs, so a direct path exists. A customer behind a symmetric NAT or a corporate firewall that blocks UDP has no direct path; without a TURN relay configured (including TURN over TCP or TLS on port 443), the connection state goes to `failed`. Other causes are denied camera permission and pages not served over HTTPS. `chrome://webrtc-internals` shows which candidate pairs were tried and why they failed. For calls with more than a handful of participants you also need an SFU rather than a full mesh.

### 24. This function is called when a user presses a key in a web synthesiser. Users report a click at the start and end of every note, and in some browsers there is no sound at all on the first key press. Explain both problems and fix the code.

```js
const ctx = new AudioContext();

function playNote(freq) {
  const osc = ctx.createOscillator();
  osc.frequency.value = freq;
  osc.connect(ctx.destination);
  osc.start();
  setTimeout(() => osc.stop(), 300);
}
```

> No sound: an `AudioContext` created before any user gesture starts in the `suspended` state under autoplay policy. It has to be resumed from inside a user-initiated event, so call `ctx.resume()` (and await it) in the key or click handler, or create the context there.
>
> Clicks: the oscillator is connected straight to the output, so the waveform jumps from silence to full amplitude and back mid-cycle. That discontinuity is heard as a click. Route the oscillator through a `GainNode` and ramp the gain up and down over a few milliseconds. Schedule with the audio clock rather than `setTimeout`, which is imprecise and can be throttled.
>
> ```js
> async function playNote(freq, dur = 0.3) {
>   await ctx.resume();
>   const t = ctx.currentTime;
>   const osc = new OscillatorNode(ctx, { frequency: freq });
>   const gain = new GainNode(ctx, { gain: 0 });
>   osc.connect(gain).connect(ctx.destination);
>   gain.gain.setValueAtTime(0, t);
>   gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
>   gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
>   osc.start(t);
>   osc.stop(t + dur + 0.02);
> }
> ```
>
> The exponential ramp targets a tiny value because it cannot reach exactly zero. A new oscillator per note is correct: source nodes are single-use.

### 25. You are asked to add a rich text comment box with bold, italic, links, and @mentions to a React app. Explain how you would choose between a plain `contenteditable`, ProseMirror, Tiptap, and Lexical, and what you would store in the database.

> A hand-rolled `contenteditable` is ruled out for anything beyond trivial input: browsers generate inconsistent markup, paste brings arbitrary HTML, `execCommand` is deprecated, IME composition and mobile keyboards are fragile, and features such as mentions need structured nodes, reliable selection handling, and undo that survives programmatic changes.
>
> The three frameworks all keep their own document model with a schema and render the editable DOM from it. ProseMirror is the most established and most flexible, but you assemble the editor from low-level modules, which is the most work. Tiptap wraps ProseMirror with ready-made extensions (bold, italic, link, and a mention extension with a suggestion popup) and React bindings, so it is the fastest path to this feature set while keeping ProseMirror's model underneath. Lexical has its own model and a small core, with first-party React components and plugins; it suits teams that want tight React integration and are happy to build the mention plugin on its primitives. I would compare them on the mention UX they give out of the box, bundle size, accessibility of the result, collaboration needs (all can use Yjs), and maintenance activity, then prototype the mention flow in the top candidate.
>
> Store the editor's structured JSON document, not HTML. JSON is validated against the schema, can be migrated when the schema changes, makes mentions queryable (a mention node carries the user id, not just display text), and can be rendered to HTML, plain text, or a notification preview on demand. If HTML is ever rendered from stored content, generate it from the JSON on the server or sanitise it, never trusting client-supplied HTML.
