# JavaScript: Practice test

### 1. What does `typeof null` evaluate to?

- [ ] `'null'`
- [x] `'object'`
- [ ] `'undefined'`
- [ ] It throws a `TypeError`

> It is `'object'`, a mistake from the first implementation of the language that cannot be corrected without breaking existing sites. To test for null, compare with `=== null`. `typeof` never throws for a value, and returns `'undefined'` only for `undefined` and for undeclared names.

### 2. What does this log?

```js
const list = [1, 2];
list.push(3);
console.log(list.length);
```

- [x] 3
- [ ] 2
- [ ] Nothing; `push` throws a `TypeError` because `list` is a constant
- [ ] `undefined`

> `const` prevents the *binding* from being reassigned (`list = []` would throw). It does not make the array immutable, so `push` works. `Object.freeze(list)` is what would make `push` throw.

### 3. What does this log?

```js
console.log(0 || 10, 0 ?? 10, '' ?? 'x');
```

- [ ] `0 0 ''`
- [ ] `10 10 'x'`
- [x] `10 0 ''`
- [ ] `10 0 'x'`

> `||` returns the right side when the left is any falsy value, so `0 || 10` is 10. `??` falls back only for `null` and `undefined`, so `0` and the empty string are kept. This is why `??` is the right operator for default values when zero or an empty string is legitimate.

### 4. What are the values of `'5' + 2` and `'5' - 2`?

- [ ] `7` and `3`
- [ ] `'52'` and `NaN`
- [ ] `'52'` and `'3'`
- [x] `'52'` and `3`

> `+` concatenates if either operand is a string, so the number 2 is converted to `'2'`. `-` has no string meaning, so both operands are converted to numbers and the result is the number 3.

### 5. What does this log?

```js
console.log([10, 9, 1].sort());
```

- [ ] `[1, 9, 10]`
- [x] `[1, 10, 9]`
- [ ] `[10, 9, 1]`
- [ ] `[9, 10, 1]`

> With no comparator, `sort` converts the elements to strings and compares those, and `'10'` comes before `'9'` because `'1'` is less than `'9'`. Pass `(a, b) => a - b` for numbers. Note too that `sort` mutates the array; `toSorted` returns a sorted copy.

### 6. What does this log?

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```

- [x] 3, 3, 3
- [ ] 0, 1, 2
- [ ] 2, 2, 2
- [ ] 0, 0, 0

> `var` is function-scoped, so there is a single `i` shared by all three callbacks. The timers run after the loop has finished, when `i` is 3. With `let`, each iteration gets its own binding and the output is 0, 1, 2.

### 7. This code runs in an ES module. What happens?

```js
const user = {
  name: 'Ada',
  greet() { return `Hi ${this.name}`; },
};
const greet = user.greet;
console.log(greet());
```

- [ ] It logs `Hi Ada`
- [ ] It logs `Hi undefined`
- [x] It throws a `TypeError`
- [ ] It logs `Hi ` followed by the page's `window.name`

> `this` is set by the form of the call. `greet()` is a plain call with no object in front, and modules are in strict mode, so `this` is `undefined` and reading `.name` from it throws. In a sloppy-mode script, `this` would be the global object and the result would depend on `window.name`. Fix it with `user.greet()`, `user.greet.bind(user)`, or an arrow wrapper.

### 8. In what order are the letters logged?

```js
async function run() {
  console.log('A');
  await null;
  console.log('B');
}
setTimeout(() => console.log('C'), 0);
run();
Promise.resolve().then(() => console.log('D'));
console.log('E');
```

- [ ] A, B, E, D, C
- [ ] A, E, D, B, C
- [ ] E, A, B, D, C
- [x] A, E, B, D, C

> An async function runs synchronously up to its first `await`, so A logs at once. The rest of `run` is queued as a microtask. Then the `then` callback is queued as a second microtask, and E logs synchronously. Microtasks run in the order they were queued (B, then D), and the timer callback, a task, runs last.

### 9. What does this log?

```js
const a = { n: 1, tags: ['x'] };
const b = { ...a };
b.n = 2;
b.tags.push('y');
console.log(a.n, a.tags.length);
```

- [ ] `1 1`
- [x] `1 2`
- [ ] `2 2`
- [ ] `2 1`

> Spread makes a shallow copy. `n` is a primitive, so `b.n` is independent. `tags` is copied as a reference to the same array, so pushing through `b.tags` is visible through `a.tags`. `structuredClone(a)` would give a fully independent copy.

### 10. What does this log?

```js
function make() {
  let n = 0;
  return () => ++n;
}
const a = make();
const b = make();
a();
a();
console.log(a(), b());
```

- [x] `3 1`
- [ ] `3 3`
- [ ] `3 4`
- [ ] `1 1`

> Each call to `make` creates a new scope with its own `n`, and the returned function closes over that particular variable. `a` has been called three times and `b` once, and they share nothing.

### 11. When is `done` logged?

```js
async function saveAll(items) {
  items.forEach(async (item) => {
    await save(item);
  });
  console.log('done');
}
```

- [ ] After every save has finished
- [ ] After the first save has finished
- [x] Before any save has finished
- [ ] Never, because `await` is not allowed inside `forEach`

> `forEach` calls the callback for each item and ignores the promises that the async callbacks return. All the saves are *started*, and `done` is logged straight away. Any rejection is also unhandled. Use `for (const item of items) await save(item);` for sequential saves, or `await Promise.all(items.map(save))` for parallel ones.

### 12. What does this log?

```js
Promise.resolve(1)
  .then((v) => { throw new Error('boom'); })
  .then((v) => v + 1)
  .catch(() => 10)
  .then((v) => console.log(v));
```

- [ ] 2
- [x] 10
- [ ] 11
- [ ] Nothing; the error is reported as an unhandled rejection

> The throw rejects the promise returned by the first `then`. The second `then` has no rejection handler, so it is skipped. `catch` handles the error and returns 10, which *fulfils* the promise it returns, and the chain continues normally with that value.

### 13. You fetch the same file from three mirrors and want the first one that succeeds, ignoring mirrors that fail unless all of them do. Which combinator fits?

- [ ] `Promise.all`
- [ ] `Promise.race`
- [ ] `Promise.allSettled`
- [x] `Promise.any`

> `Promise.any` fulfils with the first fulfilment and rejects, with an `AggregateError`, only if every input rejects. `Promise.race` settles with the first promise to *settle*, so a mirror that fails fast would make it reject, even though another mirror was about to succeed.

### 14. What happens when this runs?

```js
let x = 1;
{
  console.log(x);
  let x = 2;
}
```

- [ ] It logs 1
- [ ] It logs `undefined`
- [x] It throws a `ReferenceError`
- [ ] It logs 2

> The inner `let x` is hoisted to the top of the block, so it shadows the outer `x` throughout the block. Until its declaration is reached, it is in the temporal dead zone, and reading it throws. With `var`, the result would have been different: the declaration would not be block-scoped at all.

### 15. What string does this produce?

```js
JSON.stringify({ a: undefined, b: NaN, c: new Date(0), d: [undefined] });
```

- [x] `{"b":null,"c":"1970-01-01T00:00:00.000Z","d":[null]}`
- [ ] `{"a":null,"b":null,"c":"1970-01-01T00:00:00.000Z","d":[null]}`
- [ ] `{"b":"NaN","c":0,"d":[]}`
- [ ] It throws a `TypeError`

> A property whose value is `undefined` is omitted. Inside an array, where the position must be kept, `undefined` becomes `null`. `NaN` is not valid JSON and becomes `null`. A `Date` has a `toJSON` method that returns its ISO string, and parsing that back gives a string, not a `Date`. Only `BigInt` values and circular references make `stringify` throw.

### 16. What does this log?

```js
const id = Symbol('id');
const obj = { name: 'x', [id]: 1 };
console.log(Object.keys(obj).length, JSON.stringify(obj), Symbol('id') === id);
```

- [ ] `2 {"name":"x","id":1} true`
- [ ] `1 {"name":"x"} true`
- [ ] `2 {"name":"x"} false`
- [x] `1 {"name":"x"} false`

> Symbol-keyed properties are skipped by `Object.keys` and by `JSON.stringify`, so only `name` is seen. Every call to `Symbol()` creates a new, unique symbol; the description is only a label, so the comparison is false. `Symbol.for('id')` would return the same registered symbol each time. The property is still there, and `Object.getOwnPropertySymbols(obj)` lists it.

### 17. Which statement about `WeakMap` is correct?

- [ ] It is a `Map` that removes entries after a timeout
- [ ] Its values are held weakly, so they may disappear while the key is still in use
- [ ] It can be iterated, but only with `for...of`
- [x] Its keys are held weakly, so an entry can be collected once nothing else refers to its key, and it cannot be iterated

> A `WeakMap` does not keep its keys alive. When a key object becomes otherwise unreachable, the entry, including the value, can be garbage-collected. Since the contents depend on the timing of the collector, there is no `size` and no iteration. Values are held strongly for as long as the key is alive.

### 18. What does this log?

```js
const user = { name: 'Ada' };
Object.defineProperty(user, 'id', { value: 7 });
console.log(Object.keys(user), JSON.stringify(user), user.id);
```

- [ ] `['name', 'id'] {"name":"Ada","id":7} 7`
- [ ] `['name'] {"name":"Ada"} undefined`
- [x] `['name'] {"name":"Ada"} 7`
- [ ] `['name', 'id'] {"name":"Ada"} 7`

> Attributes left out of a descriptor passed to `Object.defineProperty` default to `false`. So `id` is not enumerable, and `Object.keys` and `JSON.stringify` skip it, though reading it directly works. It is also not writable and not configurable: `user.id = 8` throws in strict mode, and `delete user.id` fails. A property created by ordinary assignment has all three attributes set to `true`.

### 19. What does `f()` return?

```js
function f() {
  try {
    return 'try';
  } finally {
    return 'finally';
  }
}
```

- [ ] `'try'`
- [x] `'finally'`
- [ ] `undefined`
- [ ] It throws a `SyntaxError`

> `finally` always runs, even after a `return` in `try`. If `finally` itself returns (or throws), that completion replaces the pending one. It would also swallow an error thrown in `try`, which is why you should not return from `finally`.

### 20. What does this log?

```js
console.log(['1', '2', '3'].map(parseInt));
```

- [ ] `[1, 2, 3]`
- [ ] `['1', '2', '3']`
- [x] `[1, NaN, NaN]`
- [ ] `[1, 2, NaN]`

> `map` calls its callback with `(value, index, array)`, and `parseInt` takes `(string, radix)`. So the calls are `parseInt('1', 0)`, which treats radix 0 as the default and gives 1, `parseInt('2', 1)`, which is an invalid radix and gives `NaN`, and `parseInt('3', 2)`, which gives `NaN` because 3 is not a binary digit. Use `.map(Number)` or `.map((s) => parseInt(s, 10))`.

### 21. What does this log?

```js
const base = { count: 0, items: [] };
const a = Object.create(base);
a.count++;
a.items.push('x');
console.log(base.count, base.items.length);
```

- [ ] `1 1`
- [ ] `0 0`
- [ ] `1 0`
- [x] `0 1`

> Reads walk the prototype chain, but assignments create an own property. `a.count++` reads 0 from `base` and then writes `count: 1` on `a` itself, leaving `base.count` at 0. `a.items.push('x')` only *reads* `items`, finds the array on `base`, and mutates that shared array.

### 22. What does this log?

```js
const re = /a/g;
console.log(re.test('a'), re.test('a'));
```

- [x] `true false`
- [ ] `true true`
- [ ] `false false`
- [ ] `false true`

> A regular expression with the `g` flag is stateful. After the first successful match, `lastIndex` is 1, and the second `test` starts searching from there, finds nothing, returns false, and resets `lastIndex` to 0. Do not reuse a global regex with `test`; drop the flag or create the regex anew.

### 23. What does `main.js` log?

```js
// counter.js
export let count = 0;
export function inc() { count++; }

// main.js
import { count, inc } from './counter.js';
inc();
console.log(count);
```

- [ ] 0, because imports are copies of the exported values
- [x] 1, because an import is a live binding to the exporting module's variable
- [ ] A `ReferenceError`, because `count` is in the temporal dead zone
- [ ] A `TypeError`, because imported bindings are read-only

> ES module imports are live, read-only views of the exporter's variables. When `counter.js` changes `count`, the importer sees the new value. The read-only rule applies to the importer: writing `count++` in `main.js` would throw. In CommonJS, `const { count } = require('./counter')` *would* be a copy, and would still be 0.

### 24. In what order are the lines logged?

```js
function res(name) {
  return { [Symbol.dispose]() { console.log(`dispose ${name}`); } };
}

function run() {
  using a = res('a');
  using b = res('b');
  console.log('work');
  return 'result';
}
console.log(run());
```

- [ ] work, dispose a, dispose b, result
- [x] work, dispose b, dispose a, result
- [ ] work, result, dispose b, dispose a
- [ ] dispose a, dispose b, work, result

> Resources declared with `using` are disposed when their scope is left, in reverse order of declaration, so `b` goes before `a`. Disposal happens as the function exits, after the return value has been evaluated but before the caller continues, so `result` is logged last. The same would happen if `run` threw. Nothing waits for the garbage collector.

### 25. Explain why `0.1 + 0.2 === 0.3` is false, and describe how you would handle money in JavaScript.

> Numbers are 64-bit binary floating-point values. Most decimal fractions, including 0.1, 0.2, and 0.3, have no exact binary representation, so each is stored as the nearest representable value. Adding the approximations of 0.1 and 0.2 gives 0.30000000000000004, which is a different stored value from the nearest approximation of 0.3.
>
> For money, avoid fractions. Store and compute in integer minor units (cents), which are exact up to `Number.MAX_SAFE_INTEGER`, and convert only for display, with `Intl.NumberFormat`. Decide explicitly where rounding happens, for instance once per line item, after applying tax. For general comparisons of fractional results, compare with a tolerance: `Math.abs(a - b) < 1e-9`. Do not use `toFixed` for calculation; it returns a string, and rounds the binary value in ways that look wrong (`(1.005).toFixed(2)` is `'1.00'`).

### 26. This search box is meant to be debounced, but the API is still called on every keystroke. Find the bug and fix it.

```js
input.addEventListener('input', (event) => {
  const run = debounce((value) => search(value), 300);
  run(event.target.value);
});
```

> A new debounced function is created on every event. Each one has its own timer in its own closure, so no call ever cancels a previous timer, and each fires 300ms after its own keystroke. The debounced function must be created once, so that all the calls share one timer:
>
> ```js
> const run = debounce((value) => search(value), 300);
> input.addEventListener('input', (event) => run(event.target.value));
> ```
>
> The same bug appears in UI frameworks when the debounced function is created inside a component's render function without being memoised.

### 27. The function below takes about three seconds, though the three requests are independent and each takes about one second. Rewrite it to take about one second, and say what changes in the error behaviour.

```js
async function loadDashboard(id) {
  const user = await getUser(id);
  const orders = await getOrders(id);
  const alerts = await getAlerts(id);
  return { user, orders, alerts };
}
```

> Each `await` waits for one request to finish before the next one is even started. Start all three first and then wait for them together:
>
> ```js
> async function loadDashboard(id) {
>   const [user, orders, alerts] = await Promise.all([
>     getUser(id),
>     getOrders(id),
>     getAlerts(id),
>   ]);
>   return { user, orders, alerts };
> }
> ```
>
> Error behaviour: `Promise.all` rejects as soon as any of the three rejects, with that first error. The other requests are not cancelled, and their results are discarded. In the sequential version, a failure in `getUser` meant that the other requests were never sent. If the dashboard should render with whatever data succeeded, use `Promise.allSettled` and inspect each result's `status`.

### 28. Write `promiseAll(iterable)` without using `Promise.all`, and list the behaviours that your implementation must get right.

> ```js
> function promiseAll(iterable) {
>   return new Promise((resolve, reject) => {
>     const results = [];
>     let pending = 0;
>     let index = 0;
>     for (const item of iterable) {
>       const i = index++;
>       pending++;
>       Promise.resolve(item).then((value) => {
>         results[i] = value;
>         if (--pending === 0) resolve(results);
>       }, reject);
>     }
>     if (index === 0) resolve(results);
>   });
> }
> ```
>
> It must: keep results in input order by writing to each item's own index, not by pushing in completion order; accept plain values and thenables by passing each through `Promise.resolve`; count outstanding items with a counter and not with `results.length`, which is wrong once a later index has been assigned; reject as soon as any input rejects (later settlements are ignored, since a promise settles once); fulfil with an empty array for empty input, instead of staying pending; and accept any iterable, not only arrays.

### 29. A search-as-you-type box sometimes shows results for an older query than the one in the input. Explain how this happens, and write a fix.

> Responses can arrive out of order. If the request for "re" is slow and the request for "react" is fast, the "react" results are rendered first, and are then overwritten when the older "re" response arrives. Debouncing reduces how often this happens but does not prevent it.
>
> Cancel the previous request whenever a new one starts:
>
> ```js
> let controller;
> async function search(query) {
>   controller?.abort();
>   controller = new AbortController();
>   try {
>     const res = await fetch(`/search?q=${encodeURIComponent(query)}`, {
>       signal: controller.signal,
>     });
>     if (!res.ok) throw new Error(`HTTP ${res.status}`);
>     render(await res.json());
>   } catch (err) {
>     if (err.name !== 'AbortError') throw err;
>   }
> }
> ```
>
> An aborted fetch rejects with an `AbortError`, which is expected and must be ignored and not shown as a failure. An alternative that needs no cancellation is to remember the latest query, or a request counter, and discard any response that does not match it.

### 30. Users report that a single-page app gets slower the longer it stays open. The code below runs every time a chart panel is opened. Explain the leak, and describe how you would confirm it in DevTools and fix it.

```js
function openPanel(container) {
  const chart = new Chart(container, loadLargeDataset());
  window.addEventListener('resize', () => chart.redraw());
}
```

> Each call adds a `resize` listener to `window` and never removes it. The listener's closure refers to `chart`, which refers to its container element and the large dataset. Since `window` lives as long as the page, every chart ever created stays reachable after its panel is closed: the DOM nodes become detached but not collectable, and every resize redraws all the dead charts, which explains the slowdown.
>
> To confirm: in the Memory panel, take a heap snapshot, open and close the panel ten times, force a collection, take a second snapshot, and use the Comparison view. Ten extra `Chart` objects, and detached elements, will be listed. Selecting one and reading the Retainers pane shows the chain back to the `resize` listener on `window`.
>
> To fix, return a clean-up function and call it when the panel closes. An `AbortController` makes this simple:
>
> ```js
> function openPanel(container) {
>   const controller = new AbortController();
>   const chart = new Chart(container, loadLargeDataset());
>   window.addEventListener('resize', () => chart.redraw(), { signal: controller.signal });
>   return () => { controller.abort(); chart.destroy?.(); };
> }
> ```

### 31. Explain what a closure is, using the function below, and describe what a "stale closure" is.

```js
function createLogger(prefix) {
  let count = 0;
  return (message) => console.log(`${prefix} #${++count}: ${message}`);
}
```

> A closure is a function together with the variables of the scope in which it was created. The arrow function returned by `createLogger` refers to `prefix` and `count`, which belong to that particular call of `createLogger`. They stay alive after `createLogger` has returned, because the returned function still refers to them. Each call to `createLogger` creates a new, independent pair of variables, so two loggers have separate counters, and nothing outside can read or change `count`.
>
> A closure captures variables, not snapshots of values, so the logger sees `count` change between calls. A stale closure is a function that still refers to the variables of an *older* scope when the program has moved on to newer ones. A typical case is a callback created during an earlier render of a UI component, or registered once in a timer, which reads that render's state variables, and so keeps seeing old values. The fix is to create the callback again when the values change, or to read the current value from something shared, such as an object property.

### 32. Explain the difference between `const`, `Object.freeze`, and `Object.seal`, and say what this code does in an ES module.

```js
const config = Object.freeze({ port: 80, db: { host: 'a' } });
config.db.host = 'b';
config.port = 81;
```

> `const` concerns the variable: `config` cannot be reassigned. It says nothing about the object. `Object.seal` concerns the object's shape: properties cannot be added or deleted, but existing values can still be changed. `Object.freeze` does the same, and also makes every data property non-writable, so values cannot change either. Both are shallow, and neither can be undone.
>
> In the code, `config.db.host = 'b'` succeeds, because `db` is a separate object that was not frozen; only the reference to it is fixed. `config.port = 81` then throws a `TypeError`, because modules are in strict mode and `port` is non-writable. In a sloppy-mode script the assignment would be ignored silently. To protect the whole structure, freeze recursively.

### 33. A colleague's Node project fails with errors about `require` and `import`. Explain the main differences between CommonJS and ES modules, and how Node decides which one a file is.

> ES modules use `import` and `export`, which are static declarations at the top level. The dependency graph is known before any code runs, imports are live read-only bindings, modules are always in strict mode, and top-level `await` is allowed. CommonJS uses `require()`, an ordinary function that runs synchronously and can be called anywhere, and `module.exports`, a plain object. A destructured `require` copies values at that moment, so there are no live bindings. CommonJS has `__dirname` and `__filename`; in ES modules you use `import.meta.dirname` and `import.meta.filename`.
>
> Node treats `.mjs` files as ES modules and `.cjs` files as CommonJS. A `.js` file follows the `"type"` field of the nearest `package.json`: `"module"` or `"commonjs"`. If the field is absent, current Node versions inspect the file's syntax, but stating the type explicitly avoids surprises.
>
> Interoperation: an ES module can import a CommonJS module, receiving `module.exports` as the default export; named imports work only when Node can detect the export names statically. A CommonJS file can `require()` an ES module in current Node versions, provided that the module graph has no top-level `await`; otherwise it must use dynamic `import()`, which returns a promise. The usual fixes are to set `"type": "module"` and convert the files to ESM, or to rename the odd files to `.cjs` or `.mjs`.
