# JavaScript

> Stage: 1 · Foundations
> The language itself, independent of the browser. Depth here pays off for the rest of your career; frameworks come and go, the language semantics stay.

## Language basics

- [ ] Values and types - the primitives, objects, `typeof`, and `null` vs `undefined`
- [ ] Variables - `let`, `const`, block scope, and the temporal dead zone
- [ ] Operators - equality (`===` vs `==`), logical, nullish coalescing `??`, optional chaining `?.`
- [ ] Type coercion - predict truthiness and implicit conversions
- [ ] Control flow - conditionals, loops, `switch`, early returns
- [ ] Strings - template literals and the common methods
- [ ] Numbers - floating-point pitfalls, `NaN`, `BigInt`, `Number` vs `parseInt`
- [ ] Error handling - `try`/`catch`/`finally`, throwing, custom error classes, `cause`

## Functions and scope

- [ ] Function forms - declarations, expressions, arrow functions, and how they differ
- [ ] Parameters - defaults, rest, and destructuring
- [ ] Scope and hoisting - lexical scope and what is hoisted
- [ ] Closures - explain them and use them deliberately
- [ ] `this` - the four binding rules, and `call`/`apply`/`bind`
- [ ] Higher-order functions - pass and return functions; compose behaviour
- [ ] Pure functions and immutability - know why they make code easier to reason about

## Objects and collections

- [ ] Objects - literals, property access, spread, destructuring, shorthand
- [ ] Arrays - `map`, `filter`, `reduce`, `find`, `some`, `every`, `flatMap`, `toSorted`
- [ ] Reference vs value - copying, shallow vs deep, `structuredClone`
- [ ] Prototypes - the prototype chain and how property lookup works
- [ ] Classes - fields, private `#members`, static, getters/setters, inheritance
- [ ] Property descriptors - getters and setters, `Object.defineProperty`, `freeze`, `seal`, and what "writable, enumerable, configurable" control
- [ ] Symbols - unique keys and the well-known symbols (`Symbol.iterator`, `Symbol.asyncIterator`) the language hooks into
- [ ] `Map`, `Set`, `WeakMap`, `WeakSet` - when each beats a plain object or array
- [ ] Iterators and generators - the iteration protocol, `for...of`, `function*`
- [ ] JSON - `parse`, `stringify`, and what doesn't survive the round trip
- [ ] Dates and time - the pain of `Date`, and `Temporal` or a library as the remedy
- [ ] Regular expressions - write and read everyday patterns, groups, and flags

## Asynchrony

- [ ] The event loop - call stack, task queue, microtask queue; predict log ordering
- [ ] Callbacks - and why they led to promises
- [ ] Promises - states, chaining, error propagation
- [ ] `async`/`await` - sequential vs parallel awaits, error handling
- [ ] Promise combinators - `all`, `allSettled`, `race`, `any`
- [ ] Cancellation - `AbortController` and `AbortSignal`
- [ ] Timers - `setTimeout`, `setInterval`, `queueMicrotask`, `requestAnimationFrame`
- [ ] Debounce and throttle - implement both from scratch

## Modules and runtime

- [ ] ES modules - `import`/`export`, default vs named, dynamic `import()`
- [ ] CommonJS - recognise `require` and understand interop issues
- [ ] Strict mode - what it changes
- [ ] Garbage collection - reachability, and how leaks happen anyway
- [ ] Explicit resource management - `using`, `await using`, and `Symbol.dispose` for deterministic cleanup
- [ ] Keeping up with the spec - follow TC39 stages and check support on MDN or caniuse

## Practice

- [ ] Implement array methods - write your own `map`, `filter`, `reduce`, and `flat`
- [ ] Implement utilities - `debounce`, `throttle`, `deepEqual`, `memoize`, a tiny event emitter
- [ ] Implement `Promise.all` - from scratch, with correct rejection behaviour
- [ ] Solve 30 small problems - on a site like Exercism or Codewars, without a framework

## Resources

- [javascript.info](https://javascript.info/)
- [MDN: JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [You Don't Know JS Yet](https://github.com/getify/You-Dont-Know-JS)
- [What the heck is the event loop anyway? (talk)](https://www.youtube.com/watch?v=8aGhZQkoFbQ)
