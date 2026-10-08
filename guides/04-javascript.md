# JavaScript: Guide

## Toolkit

### DevTools and tooling

You need a fast way to run small pieces of code and a real debugger. Learn both early.

- **Console** (browser DevTools). Evaluate expressions against the live page. Useful helpers: `$0` is the element selected in the Elements panel, `$_` is the last result, `copy(value)` puts a value on the clipboard, `console.table(array)` prints rows and columns, and `console.dir(obj)` shows an object's properties including its prototype. Top-level `await` works. Remember that the Console logs a *live reference* to an object, so if you expand it later you see its current state; log `structuredClone(obj)` or `JSON.stringify(obj)` when you need a snapshot.
- **Sources panel debugger.** Click a line number to set a breakpoint; right-click for a conditional breakpoint or a logpoint (a `console.log` that needs no code change). When paused, the Scope pane shows Local, Closure, and Global variables, which makes closures visible. The Call Stack pane includes async frames. Step over, into, and out. "Pause on uncaught exceptions" finds the throw site at once. Writing `debugger;` in your code sets a breakpoint from the source.
- **Snippets** (Sources, then Snippets) keep multi-line scratch code between sessions.
- **Node.js.** `node` opens a REPL. `node file.js` runs a file, `node --watch file.js` reruns it on save, and `node --test` runs the built-in test runner. `node --inspect-brk file.js` pauses on the first line and lets you attach Chrome DevTools through `chrome://inspect`, or attach your editor's debugger.
- **ESLint** with the recommended rules from `@eslint/js` in `eslint.config.js` catches unused variables, unreachable code, accidental assignment in conditions, and more. **Prettier** removes formatting from your list of worries.
- **Type checking plain JavaScript.** Add `// @ts-check` at the top of a file and your editor's TypeScript service reports type errors, wrong argument counts, and misspelt properties with no build step.
- **Performance and Memory panels** for long tasks and leaks, covered under the event loop and garbage collection.

### Testing and verifying your work

For language-level code, "done" means that a test proves the behaviour, including the awkward inputs. Node ships a test runner and an assertion library, so you need to install nothing:

```js
// sum.test.js — run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sum } from './sum.js';

test('sums numbers', () => {
  assert.equal(sum([1, 2, 3]), 6);
});
test('returns 0 for an empty array', () => {
  assert.equal(sum([]), 0);
});
```

`assert.equal` from `node:assert/strict` uses `Object.is` semantics, and `assert.deepEqual` compares structures. `assert.throws` and `assert.rejects` check errors. Vitest is the usual choice inside a project that has a build tool; its API is similar.

Habits that make verification real:

1. **List edge cases before you write the code.** Empty input, one element, duplicates, `null` and `undefined`, `NaN`, negative zero, very large numbers, sparse arrays, strings with emoji, and objects with prototype-less or cyclic structure.
2. **Compare with the built-in.** When you re-implement `map` or `Promise.all`, run the same inputs through the native version and assert equal results.
3. **Test asynchronous code deterministically.** Return or `await` the promise from the test. Use fake timers (`mock.timers` in `node:test`, `vi.useFakeTimers()` in Vitest) for debounce and throttle, so that tests do not sleep.
4. **Test the failure path.** Check that the right error type is thrown, with a useful message, and that rejections propagate.
5. **Check that inputs are not mutated.** Freeze an argument with `Object.freeze` in a test; under strict mode, any mutation throws.

Run ESLint and, if you use `// @ts-check`, the type checker as part of the same loop. When behaviour surprises you, read the relevant section of MDN or the specification instead of guessing; JavaScript's odd corners are all documented.

### Tricks and gotchas

- `typeof null` is `'object'`, and `typeof NaN` is `'number'`. Test for null with `=== null`, and for NaN with `Number.isNaN()`.
- `x == null` is true for exactly `null` and `undefined`. It is the one widely accepted use of loose equality.
- `||` falls back on any falsy value, so `count || 10` turns a legitimate `0` into `10`. Use `??` for defaults.
- `[1, 10, 2].sort()` gives `[1, 10, 2]`, because the default sort compares strings. Pass `(a, b) => a - b`. `sort()` also mutates; `toSorted()` does not.
- `['1', '2', '3'].map(parseInt)` gives `[1, NaN, NaN]`, because `map` passes the index as the second argument, which `parseInt` reads as a radix. Use `.map(Number)`.
- `array.forEach(async ...)` does not wait for anything. Use `for...of` with `await`, or `await Promise.all(array.map(...))`.
- A regular expression with the `g` or `y` flag keeps `lastIndex` between calls to `test()` and `exec()`, so reusing one gives alternating results.
- `new Date('2026-03-01')` is midnight UTC, and `new Date('2026-03-01T00:00')` is midnight local time. Months in `new Date(2026, 0, 1)` start at zero.
- `0.1 + 0.2 !== 0.3`. Keep money in integer cents.
- An arrow function that returns an object literal needs parentheses: `() => ({ a: 1 })`.
- `const` prevents reassignment of the binding. It does not make the object immutable.
- Spread and `Object.assign` copy one level. Nested objects are still shared.
- `JSON.stringify` drops `undefined` and functions, and turns `NaN` into `null`.
- A `return` inside `finally` overrides a `return` or a thrown error from `try`.
- Passing `obj.method` as a callback loses `this`. Pass `() => obj.method()` or `obj.method.bind(obj)`.
- `await` in a loop runs the operations one after another. That is right when order matters, and slow when it does not.

### Official references

- [MDN: JavaScript reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference) — every built-in object, operator, and statement, with compatibility tables.
- [MDN: JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) — chapter-length explanations of the main topics.
- [ECMAScript Language Specification](https://tc39.es/ecma262/) — the living standard for the language; the final word on any behaviour.
- [ECMAScript Internationalization API Specification](https://tc39.es/ecma402/) — the `Intl` object: formatting of dates, numbers, lists, and plurals.
- [TC39 proposals](https://github.com/tc39/proposals) — every feature in progress and its current stage.
- [HTML Standard: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops) — how browsers schedule tasks, microtasks, and rendering.
- [Node.js API documentation](https://nodejs.org/api/) — modules, the test runner, and the runtime outside the browser.
- [V8 blog](https://v8.dev/blog) — how the engine in Chrome and Node implements and optimises features.
- [javascript.info](https://javascript.info/) — a thorough, free tutorial that follows the language from basics to advanced topics.
- [ESLint: Rules reference](https://eslint.org/docs/latest/rules/) — what each lint rule catches and why.
- [Chrome DevTools: Debug JavaScript](https://developer.chrome.com/docs/devtools/javascript) — the official walkthrough of the debugger.

## Skills

### Values and types

JavaScript has seven primitive types and one type for everything else. The primitives are `string`, `number`, `bigint`, `boolean`, `symbol`, `undefined`, and `null`. Everything else is an `object`, including arrays, functions, dates, and regular expressions.

Primitives are immutable and are compared by value. `'abc'.toUpperCase()` returns a new string; nothing can change the original. Objects are mutable and compared by identity, so `{} === {}` is false. A variable holds either a primitive value or a reference to an object.

Primitives have no properties, yet `'abc'.length` works, because the engine temporarily wraps the primitive in an object (`String`, `Number`, and so on) for the lookup. Never create these wrappers yourself with `new String('x')`; that gives you an object, which is truthy even when it wraps `''` or `0`.

`typeof` returns a string naming the type, with two results to memorise:

```js
typeof null          // 'object'   (a historical bug that cannot be fixed)
typeof function(){}  // 'function' (functions are objects, reported specially)
typeof []            // 'object'   (use Array.isArray)
typeof NaN           // 'number'
typeof undeclared    // 'undefined', and it does not throw
```

`undefined` means "no value was provided": an unassigned variable, a missing property, a missing argument, a function with no `return`. `null` is a value that a programmer assigns to mean "deliberately empty". The DOM and JSON use `null`; the language itself produces `undefined`. Default parameters and destructuring defaults apply only for `undefined`, not for `null`.

To identify things precisely, use `Array.isArray(x)`, `x === null`, `Number.isNaN(x)`, `x instanceof Date`, and, for the general case, `Object.prototype.toString.call(x)`, which gives strings such as `'[object Date]'`.

**Try it:** Without running them, write down the `typeof` result for `null`, `[]`, `class A {}`, `Symbol()`, `10n`, `new Number(5)`, and `undefined`. Check in the Console. Then write an `isPlainObject(x)` function that returns true for `{}` and `Object.create(null)` but false for arrays, `null`, dates, and class instances.

**Resources**
- [MDN: JavaScript data types and data structures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures)
- [MDN: typeof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof)
- [ECMAScript specification: ECMAScript language types](https://tc39.es/ecma262/#sec-ecmascript-language-types)

### Variables

Declare with `const` by default, and with `let` when the binding must be reassigned. Both are block-scoped: they exist only inside the nearest pair of braces (a block, a loop body, a function).

`const` fixes the *binding*, not the value. You cannot assign to the name again, but if it holds an object you can still change that object's contents:

```js
const user = { name: 'Ada' };
user.name = 'Grace';   // fine
user = {};             // TypeError: Assignment to constant variable
```

The temporal dead zone (TDZ) is the stretch between entering a scope and reaching the declaration. The variable exists (it is hoisted to the top of the block) but is uninitialised, and any access throws a `ReferenceError`. This is deliberate: it turns use-before-declaration from a silent `undefined` into an error.

```js
{
  console.log(a);  // ReferenceError: Cannot access 'a' before initialization
  let a = 1;
}
```

The TDZ is about *time*, not position in the file. A function defined above a `let` may refer to it, as long as the function is called after the declaration has run.

`var` is the older form, and you should recognise its behaviour in existing code: it is function-scoped (it ignores blocks), it is hoisted and initialised to `undefined`, it can be redeclared, and at the top level of a classic script it creates a property on the global object. In a `for` loop, `let` creates a fresh binding for every iteration, so that closures created in the loop each see their own value; `var` shares one binding across all iterations, which is the cause of the classic bug in which every callback logs the final value.

Declare variables as close as possible to where they are used, one per statement, and prefer a new `const` to reassigning an old `let`.

**Try it:** Write a `for` loop from 0 to 2 that calls `setTimeout(() => console.log(i), 0)`, once with `var i` and once with `let i`. Predict both outputs, then run them. Then pause inside the loop in the debugger and look at how the Scope pane presents the two cases.

**Resources**
- [MDN: let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
- [MDN: const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
- [javascript.info: Variables](https://javascript.info/variables)

### Operators

**Equality.** `===` compares without converting: different types are never equal. `==` converts first, by rules that produce results such as `'' == 0` and `[] == false` both being true. Use `===` everywhere, with one accepted exception: `x == null` is true exactly when `x` is `null` or `undefined`. `Object.is(a, b)` is like `===`, except that it treats `NaN` as equal to itself and distinguishes `0` from `-0`.

**Logical operators return operands, not booleans.** `a || b` returns `a` if it is truthy, otherwise `b`. `a && b` returns `a` if it is falsy, otherwise `b`. Both short-circuit: the right side is not evaluated when the left side decides the result.

**Nullish coalescing.** `a ?? b` returns `b` only when `a` is `null` or `undefined`. This is what you want for defaults, because `||` also replaces `0`, `''`, and `false`:

```js
const volume = settings.volume || 50;   // 0 becomes 50: a bug
const volume2 = settings.volume ?? 50;  // 0 stays 0
```

You cannot mix `??` with `||` or `&&` without parentheses; it is a syntax error, to prevent ambiguity.

**Optional chaining.** `a?.b` evaluates to `undefined` if `a` is `null` or `undefined`, instead of throwing. It also works for calls, `fn?.()`, and for computed access, `obj?.[key]`. It short-circuits the *rest of the chain*: in `a?.b.c.d`, if `a` is nullish, nothing after it is evaluated. It does not protect against `b` being undefined; for that you would write `a?.b?.c`.

Do not scatter `?.` everywhere. It hides bugs by turning "this should never be missing" into a silent `undefined`. Use it where absence is a legitimate case.

**Logical assignment.** `a ??= b` assigns only if `a` is nullish; `a ||= b` and `a &&= b` follow the same pattern.

Also worth knowing: `**` for exponentiation, `%` as remainder (the result takes the sign of the left operand, so `-1 % 3` is `-1`), and the fact that `+` is both addition and concatenation.

**Try it:** Predict each result, then check: `0 || 'a'`, `0 ?? 'a'`, `'' && 'x'`, `null ?? undefined ?? 0`, `({}).a?.b.c`, `({ a: {} }).a?.b.c`, and `-7 % 3`. One of them throws; explain why.

**Resources**
- [MDN: Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness)
- [MDN: Nullish coalescing operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
- [MDN: Optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)

### Type coercion

Coercion is the automatic conversion of a value to another type when an operator or statement needs it. It is rule-based, and a small number of rules covers nearly all cases.

**To boolean** (in `if`, `!`, `&&`, `||`, `?:`). Exactly these values are falsy: `false`, `0`, `-0`, `0n`, `''`, `null`, `undefined`, and `NaN`. Everything else is truthy, including `'0'`, `'false'`, `[]`, `{}`, and every function.

**To string.** The `+` operator concatenates if *either* operand is a string (after objects have been converted to primitives). Template literals also convert to string.

**To number.** The other arithmetic operators (`-`, `*`, `/`, `%`), unary `+`, and the relational operators with mixed types convert to number. `Number('')` is `0`, `Number(' 12 ')` is `12`, `Number('12px')` is `NaN`, `Number(null)` is `0`, `Number(undefined)` is `NaN`, `Number(true)` is `1`, and `Number([])` is `0`.

**Objects to primitives.** An object is converted by calling `Symbol.toPrimitive`, or else `valueOf()` and then `toString()`. Arrays stringify by joining their elements, so `[]` becomes `''` and `[1, 2]` becomes `'1,2'`. Plain objects become `'[object Object]'`.

```js
'5' + 2        // '52'
'5' - 2        // 3
[] + {}        // '[object Object]'
[] == false    // true  ([] -> '' -> 0, false -> 0)
null == 0      // false (null only loosely equals undefined)
null >= 0      // true  (relational operators convert null to 0)
NaN == NaN     // false
```

For `==`: if the types match, it compares as `===`. `null` and `undefined` equal each other and nothing else. Otherwise booleans become numbers, strings compared with numbers become numbers, and objects become primitives.

In practice, convert explicitly at the edges of your program (form input, URL parameters, JSON) with `Number(x)`, `String(x)`, and `Boolean(x)`, and then use `===`. The classic bugs are `if (count)` when zero is a valid count, `if (array)` to test for emptiness (an empty array is truthy; test `array.length`), and adding a number to a string read from an `<input>`.

**Try it:** Predict the results of `1 + '2' - 1`, `true + true`, `[] + []`, `[2] * [3]`, `'b' + 'a' + +'a' + 'a'`, `!!'false'`, and `[0] == false`. Check them, and for each one write the conversion steps.

**Resources**
- [MDN: Type coercion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures#type_coercion)
- [javascript.info: Type conversions](https://javascript.info/type-conversions)
- [ECMAScript specification: IsLooselyEqual](https://tc39.es/ecma262/#sec-islooselyequal)

### Control flow

Control flow decides which statements run and how often. The syntax is simple; the skill is in choosing the form that keeps the code flat and the intent obvious.

**Early returns.** Handle the invalid and trivial cases first and leave. This removes nesting and puts the main path at the left margin:

```js
function priceFor(user, item) {
  if (!item) return 0;
  if (!user?.isMember) return item.price;
  return item.price * 0.9;
}
```

**Loops.** Pick by what you are iterating:

- `for...of` walks the *values* of any iterable (arrays, strings, Maps, Sets, NodeLists). It supports `break`, `continue`, and `await`. This is the default loop.
- `for...in` walks the enumerable string *keys* of an object, including inherited ones. Do not use it on arrays. For objects, prefer `for (const [key, value] of Object.entries(obj))`.
- The classic `for (let i = 0; ...)` is for when you need the index, a step other than one, or to go backwards.
- `array.forEach()` cannot `break`, and it ignores promises returned by its callback.
- `while` and `do...while` are for loops whose end is not known in advance.

**`switch`** compares with `===` and *falls through* to the next case unless you `break` or `return`. The whole `switch` is one block, so a `let` in one case collides with the same name in another; wrap case bodies in braces. A lookup object or a `Map` is often clearer than a `switch` that only maps values to values.

**Conditionals.** The ternary `a ? b : c` is an expression and suits choosing between two values. Do not nest it more than once. `if` with `&&` chains should test the specific thing you mean, not general truthiness, when `0` or `''` is a valid value.

Labels (`outer: for (...)` with `break outer`) let you leave nested loops, though extracting a function and returning is usually cleaner.

**Try it:** Take a function with three levels of nested `if`/`else` (write one if you have none) and refactor it to guard clauses with no `else`. Then write a `switch` that forgets a `break`, observe the fall-through in the debugger by stepping, and rewrite it as a lookup object.

**Resources**
- [MDN: Control flow and error handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
- [MDN: Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration)
- [MDN: for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)

### Strings

A string is an immutable sequence of UTF-16 code units. Every method returns a new string.

Template literals, in backticks, give you interpolation and multi-line text:

```js
const line = `${user.name} has ${count} item${count === 1 ? '' : 's'}`;
```

A *tagged* template puts a function name directly before the opening backtick. That function is called with the literal parts and the interpolated values as separate arguments, which is how HTML and SQL templating libraries escape interpolated values safely. `String.raw` is a built-in tag that leaves backslashes alone.

The methods you will use daily:

| Need | Methods |
| --- | --- |
| Search | `includes`, `startsWith`, `endsWith`, `indexOf` |
| Extract | `slice(start, end)`, `at(-1)` |
| Change | `replace`, `replaceAll`, `trim`, `trimStart`, `trimEnd`, `padStart`, `padEnd`, `repeat` |
| Case | `toLowerCase`, `toUpperCase` |
| Split and join | `split(separator)`, and `array.join(separator)` |

`slice` accepts negative indexes and is the one extraction method worth using; ignore `substr`, and note that `substring` swaps its arguments and treats negatives as zero. `replace` with a string pattern replaces only the first match; use `replaceAll` or a regular expression with the `g` flag.

The detail that the simple picture hides is Unicode. `length` counts UTF-16 code units, not characters. Characters outside the Basic Multilingual Plane, including most emoji, take two units, so `'👍'.length` is 2 and `'👍'[0]` is half a character. Iterating with `for...of` or spreading with `[...str]` goes by code point, which fixes that case, but what a user sees as one character (a flag, a family emoji, a letter with a combining accent) can be several code points. To count or truncate by user-perceived characters, use `Intl.Segmenter`:

```js
const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
[...seg.segment('👨‍👩‍👧')].length;   // 1, while .length is 8
```

Compare strings for sorting with `a.localeCompare(b)` or an `Intl.Collator`, not with `<`, which compares code units and puts `'Z'` before `'a'`. Use `normalize()` before comparing text that may contain composed and decomposed accents. Build long strings with an array and `join`, or with template literals; do not worry about the performance of `+` in ordinary code.

**Try it:** Write `truncate(str, max)` that cuts a string to at most `max` user-perceived characters and appends an ellipsis, without ever splitting an emoji. Test it with plain text, `'👍👍👍'`, and a string containing a flag emoji.

**Resources**
- [MDN: String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
- [MDN: Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
- [MDN: Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)

### Numbers

Every `number` is a 64-bit IEEE 754 floating-point value. There is no separate integer type. Two consequences follow.

**Fractions are approximate.** Most decimal fractions have no exact binary representation, so `0.1 + 0.2` is `0.30000000000000004`. Never compare the results of fractional arithmetic with `===`; compare with a tolerance, `Math.abs(a - b) < 1e-9`, or avoid fractions altogether. For money, store integer minor units (cents) and format only for display. `toFixed(2)` returns a *string* and rounds the binary value, so `(1.005).toFixed(2)` is `'1.00'`.

**Integers are exact only up to 2^53 − 1**, which is `Number.MAX_SAFE_INTEGER` (9007199254740991). Beyond that, neighbouring integers collapse into each other. This bites with 64-bit database IDs sent as JSON numbers, which should be sent as strings.

`NaN` is the result of an invalid numeric operation (`0 / 0`, `Number('abc')`). It is the only value not equal to itself. Test with `Number.isNaN(x)`. The global `isNaN()` coerces its argument first, so `isNaN('abc')` is true. `NaN` is contagious: one in a calculation makes the whole result `NaN`. Also know `Infinity` (`1 / 0`) and `-0`.

**Parsing.** `Number(str)` converts the whole string or gives `NaN`, but treats `''` and whitespace as `0`. `parseInt(str, 10)` reads leading digits and stops at the first other character, so `parseInt('12px', 10)` is 12; always pass the radix. `parseFloat` does the same for decimals. For user input, `Number()` plus `Number.isFinite()` is the strict check. Do not pass non-strings to `parseInt`: `parseInt(0.0000005)` is 5, because the number is first converted to the string `'5e-7'`.

**BigInt** is a separate type for arbitrarily large integers, written `123n`. You cannot mix it with numbers in arithmetic (`1n + 1` throws a `TypeError`), division truncates, and `JSON.stringify` throws on it. Use it for large IDs and exact integer arithmetic, not for decimals.

Format numbers for people with `Intl.NumberFormat`, which handles currency, percentages, units, compact notation, and locale separators. Numeric separators (`1_000_000`) make literals readable.

**Try it:** Write `addMoney(a, b)` that adds two decimal strings such as `'0.10'` and `'0.20'` and returns `'0.30'`, by converting to integer cents. Then find the smallest positive integer `n` for which `n + 1 === n` is true, and explain it.

**Resources**
- [MDN: Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
- [MDN: BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
- [javascript.info: Numbers](https://javascript.info/number)

### Error handling

`throw` stops the current function and unwinds the call stack until it finds a `catch`. If it finds none, the error is uncaught: the browser logs it, and Node exits.

```js
class ValidationError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'ValidationError';
  }
}

async function loadConfig(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (err) {
    throw new Error(`Could not load config from ${path}`, { cause: err });
  } finally {
    console.log('load attempted');   // runs on success, failure, and return
  }
}
```

Rules that matter in practice:

- **Throw `Error` objects**, never strings or plain objects. Only errors carry a stack trace, and callers expect `.message`.
- **`cause`** links a higher-level error to the low-level error that triggered it, so that you can add context without losing the original stack. DevTools and Node print the whole chain.
- **Custom classes** let callers tell errors apart with `instanceof`. Pass `options` through to `super` so that `cause` still works, and set `name`.
- **Catch only what you can handle.** A `catch` block that logs and continues turns a clear failure into a mysterious one later. Either recover, add context and rethrow, or do not catch. Inside `catch`, check the type and rethrow anything you did not expect.
- **`finally`** always runs and is for cleanup. A `return` or `throw` inside `finally` replaces whatever `try` or `catch` produced, so avoid them there.
- **`try`/`catch` is synchronous.** It does not catch an error thrown later inside a `setTimeout` callback or in a promise that you did not `await`. With `async`/`await`, an awaited rejection becomes a throw, so the same syntax works.
- The `catch` binding is optional: `catch { ... }`.

Errors are for exceptional conditions. For an expected outcome such as "user not found", returning `null` or a result object is often clearer than throwing.

As a last line of defence, the browser fires `error` and `unhandledrejection` events on `window`. Use them to report to a logging service, not to recover.

**Try it:** Write `parseUser(json)` that throws a `ValidationError` when a required field is missing, and wraps a `JSON.parse` failure in an error with `cause`. Call it with bad input, log the caught error in the Console, and expand it to see the cause chain. Then write a function with `return` in both `try` and `finally`, and predict what it returns.

**Resources**
- [MDN: Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
- [MDN: Error: cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
- [MDN: try...catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)

### Function forms

There are several ways to create a function, and they differ in hoisting, in `this`, and in what the function can do.

```js
function add(a, b) { return a + b; }          // declaration
const sub = function (a, b) { return a - b; } // expression
const mul = (a, b) => a * b;                  // arrow
const obj = { div(a, b) { return a / b; } };  // method shorthand
```

A **declaration** is hoisted with its body, so you can call it above the line where it is written. That lets you put the high-level code at the top of a file and the helpers below.

A **function expression** is a value. It exists only once the line has run, and if assigned to `const` or `let` it is subject to the temporal dead zone. It can have its own name (`const f = function inner() {}`), which is visible only inside the function and appears in stack traces.

An **arrow function** is not just shorter syntax. It has no `this`, `arguments`, `super`, or `new.target` of its own; it takes them from the enclosing scope. It cannot be called with `new` and has no `prototype` property. It cannot be a generator. With an expression body, it returns that expression implicitly; to return an object literal, wrap it in parentheses, as otherwise the braces are read as a function body.

How to choose:

- Arrows for callbacks and short functions, especially when you want the surrounding `this`.
- Method shorthand for object and class methods, which need a dynamic `this`. An arrow function as an object-literal method is a bug: its `this` is that of the enclosing scope, not the object.
- Declarations for top-level named functions.

Every function has `name` and `length` (the number of parameters before the first default or rest). An immediately invoked function expression, `(function () { ... })()`, was the old way to create a private scope; blocks and modules have replaced it, though you still see `(async () => { ... })()` where top-level `await` is unavailable.

**Try it:** Create an object with a `name` property and three functions that each log `this.name`: a method shorthand, a function expression property, and an arrow function property. Call each as `obj.fn()` and predict the output. Then try `new` on an arrow function and read the error.

**Resources**
- [MDN: Functions guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)
- [MDN: Arrow function expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- [javascript.info: Function expressions](https://javascript.info/function-expressions)

### Parameters

JavaScript does not check the number of arguments. Missing ones are `undefined`, and extras are ignored (though still reachable). The parameter syntax gives you tools for dealing with both.

**Defaults** apply when the argument is `undefined`, whether omitted or passed explicitly, and *not* when it is `null`. The default expression is evaluated at each call, so a default of `[]` or `{}` gives a fresh object every time (unlike in Python). Defaults can refer to earlier parameters.

```js
function createUser(name, { role = 'viewer', active = true } = {}, ...tags) {
  return { name, role, active, tags };
}
createUser('Ada');                               // role 'viewer', tags []
createUser('Ada', { role: 'admin' }, 'x', 'y');  // tags ['x', 'y']
```

**Destructured parameters** give you named arguments. A function with more than two or three parameters, or with any boolean parameter, reads better with an options object: `resize({ width: 100, keepRatio: true })` explains itself where `resize(100, null, true)` does not. Note the `= {}` after the pattern above. Without it, calling the function with no second argument tries to destructure `undefined` and throws a `TypeError`.

**Rest parameters** (`...tags`) collect the remaining arguments into a real array. A rest parameter must be last. It replaces the old `arguments` object, which is array-like but not an array, and does not exist in arrow functions.

**Spread** at the call site is the reverse: `Math.max(...numbers)` passes array elements as separate arguments. Very large arrays can exceed the engine's argument limit, so use a loop or `reduce` for those.

Arguments are passed by value, but for objects the value is a reference. Reassigning a parameter does not affect the caller; mutating the object it points to does. Treat parameters as read-only, and copy before changing anything.

**Try it:** Write `fetchPage({ url, page = 1, pageSize = 20, signal } = {})` that throws a `TypeError` if `url` is missing and otherwise returns the options it would use. Call it with no arguments, with `page: undefined`, and with `page: null`, and explain the three results.

**Resources**
- [MDN: Default parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters)
- [MDN: Rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters)
- [MDN: Destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring)

### Scope and hoisting

Scope is the set of rules for where a name is visible. JavaScript uses *lexical* scope: what a function can see is determined by where the function is written in the source, not by where it is called from.

Scopes nest. There is the global scope, a module scope for each module, a function scope for each function, and a block scope for each pair of braces (for `let`, `const`, and `class`). When the engine resolves a name, it looks in the current scope and then outwards through each enclosing scope. The first match wins, so an inner declaration *shadows* an outer one with the same name.

```js
const x = 'outer';
function show() { console.log(x); }
function run() { const x = 'inner'; show(); }
run();   // 'outer': show sees the scope where it was defined
```

Hoisting is the fact that declarations are processed when a scope is entered, before any code in it runs. What you can do with the name before its line differs by kind:

| Declaration | Hoisted | Value before its line |
| --- | --- | --- |
| `function f() {}` | Yes, with its body | Callable |
| `var x` | Yes | `undefined` |
| `let`, `const`, `class` | Yes | Temporal dead zone: access throws `ReferenceError` |
| `import` | Yes | Available |

So `let` *is* hoisted. That is why this throws instead of logging `'outer'`:

```js
const v = 'outer';
{ console.log(v); const v = 'inner'; }   // ReferenceError
```

The inner `v` already shadows the outer one for the whole block.

A function expression assigned to `var` hoists only the variable, so calling it early gives "is not a function". Function declarations inside blocks are block-scoped in strict mode; avoid declaring functions inside `if` blocks altogether.

Assigning to a name that was never declared creates a global variable in sloppy mode and throws in strict mode, which is one more reason to use modules.

**Try it:** Write a short script containing a function declaration, a `var`, a `let`, and a function expression assigned to `const`, and above all of them put four `console.log` or call statements, one for each. Predict which lines work, which log `undefined`, and which throw, then run it one statement at a time.

**Resources**
- [MDN: Hoisting](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting)
- [MDN: Scope](https://developer.mozilla.org/en-US/docs/Glossary/Scope)
- [You Don't Know JS Yet: Scope & Closures](https://github.com/getify/You-Dont-Know-JS/tree/2nd-ed/scope-closures)

### Closures

A closure is a function together with the variables of the scope in which it was created. Every function in JavaScript keeps a reference to its enclosing scope, so it can still read and write those variables after the outer function has returned.

```js
function createCounter() {
  let count = 0;                       // private: nothing else can reach it
  return {
    increment: () => ++count,
    reset: () => { count = 0; },
  };
}
const a = createCounter();
const b = createCounter();
a.increment(); a.increment();   // 2
b.increment();                  // 1: each call created its own `count`
```

The point that people miss is that a closure captures *variables*, not *values*. The inner function sees the variable's current value whenever it runs. That explains the classic loop bug with `var` (every callback shares one variable, which has reached its final value by the time they run), and it explains "stale closures" in UI frameworks, where a callback created during an earlier render still refers to that render's variables.

Uses you will write deliberately:

- **Private state**, as above, without a class.
- **Function factories:** `const double = multiplier(2)`.
- **Remembering between calls:** memoisation caches, `once()`, debounce and throttle timers.
- **Callbacks with context:** an event handler that knows which item it belongs to.
- **Partial application:** fixing some arguments now and supplying the rest later.

Closures have a memory cost: everything a closure can reach stays alive for as long as the closure does. A long-lived event listener that refers to a large object keeps that object from being collected. Engines keep only the variables that some inner function actually uses, but one closure that uses a big variable is enough to retain it for all closures from the same scope.

In the debugger, pause inside an inner function and look at the Scope pane: the entries labelled "Closure" are the captured variables.

**Try it:** Write `once(fn)` that returns a function which calls `fn` the first time and afterwards returns the first result without calling it again. Then write `makeIdGenerator(prefix)` that returns a function producing `prefix-1`, `prefix-2`, and so on. Verify that two generators do not share a counter, and inspect the Closure scope in the debugger.

**Resources**
- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)
- [javascript.info: Variable scope, closure](https://javascript.info/closure)

### `this`

In a normal function, `this` is not fixed by where the function is defined. It is set at each call, by *how* the function is called. There are four rules, in order of precedence:

1. **`new` binding.** `new Fn()` creates a new object and sets `this` to it.
2. **Explicit binding.** `fn.call(obj, a, b)` and `fn.apply(obj, [a, b])` call the function with `this` set to `obj`. `fn.bind(obj)` returns a new function whose `this` is permanently `obj`.
3. **Implicit binding.** `obj.method()` sets `this` to the object left of the dot (or bracket) at the call.
4. **Default binding.** A plain call, `fn()`, gives `undefined` in strict mode and modules, and the global object in sloppy mode.

Arrow functions are outside this scheme. They have no `this` of their own and use the `this` of the enclosing scope, fixed at the time they were created. `call`, `apply`, and `bind` cannot change it.

The standard bug is losing the implicit binding by separating the function from its object:

```js
const counter = {
  count: 0,
  inc() { this.count++; },
};
const inc = counter.inc;
inc();                               // TypeError in strict mode: this is undefined
button.addEventListener('click', counter.inc);    // this is the button
setTimeout(counter.inc, 100);        // this is not counter

setTimeout(() => counter.inc(), 100);      // fix: call it as a method
setTimeout(counter.inc.bind(counter), 100); // fix: bind
```

Only the call expression matters. `counter.inc` on its own is just a reference to a function; the object is forgotten.

In classes, a method passed as a callback has the same problem. The common fix is a class field holding an arrow function, `handleClick = () => { ... }`, which captures the instance, at the cost of one function per instance.

Other facts: in a DOM event listener added with a normal function, `this` is the element the listener is attached to. `bind` can also fix leading arguments (`fn.bind(null, 1)`). A bound function cannot be re-bound. At the top level of a module, `this` is `undefined`.

**Try it:** Write an object with a method that logs `this`. Call it as `obj.m()`, `const f = obj.m; f()`, `obj.m.call({ other: true })`, `(obj.m)()`, `(0, obj.m)()`, and `new obj.m()`. Predict all six first. Then convert the method to an arrow function and repeat.

**Resources**
- [MDN: this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- [MDN: Function.prototype.bind()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
- [javascript.info: Object methods, "this"](https://javascript.info/object-methods)

### Higher-order functions

A higher-order function takes a function as an argument, returns a function, or both. Functions are ordinary values in JavaScript, so this needs no special syntax. It is the main way to reuse *behaviour*: you write the general shape once and pass in the part that varies.

You already use them: `array.map(fn)`, `addEventListener('click', fn)`, `setTimeout(fn, 100)`, and `promise.then(fn)`.

Returning functions lets you configure behaviour ahead of time:

```js
const byKey = (key) => (a, b) => (a[key] > b[key]) - (a[key] < b[key]);
users.toSorted(byKey('age'));

const withLogging = (fn) => (...args) => {
  console.log(fn.name, args);
  return fn(...args);
};

const pipe = (...fns) => (input) => fns.reduce((value, fn) => fn(value), input);
const slugify = pipe(
  (s) => s.trim(),
  (s) => s.toLowerCase(),
  (s) => s.replaceAll(/\s+/g, '-'),
);
slugify('  Hello World ');   // 'hello-world'
```

`byKey` is a factory. `withLogging` is a decorator: it wraps a function and adds behaviour without altering it. `pipe` composes small functions into a pipeline, applied left to right.

What to watch:

- **Argument mismatch.** The caller decides what arguments your callback receives. `['1', '2', '3'].map(parseInt)` gives `[1, NaN, NaN]`, because `map` passes `(value, index, array)` and `parseInt` reads the index as a radix. Wrap it: `.map((s) => parseInt(s, 10))`.
- **Losing `this`.** Passing `obj.method` passes the bare function. Wrap it in an arrow or bind it.
- **Passing versus calling.** `onClick(handle)` passes the function. `onClick(handle())` calls it at once and passes its result.
- **Wrappers should be transparent:** forward all arguments with `...args`, forward `this` if the wrapped function may be a method, and return the result.

Do not overdo it. A chain of five point-free combinators is harder to read and to step through than a plain loop. Use higher-order functions where they name a real pattern.

**Try it:** Write `retry(fn, times)` that returns an async function which calls `fn` with the same arguments and retries up to `times` times if it rejects, rethrowing the last error. Test it with a function that fails twice and then succeeds, and with one that always fails.

**Resources**
- [Eloquent JavaScript: Higher-Order Functions](https://eloquentjavascript.net/05_higher_order.html)
- [MDN: Functions guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)
- [MDN: First-class function](https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function)

### Pure functions and immutability

A pure function has two properties: given the same arguments it always returns the same result, and it has no side effects (it does not modify its arguments or outside state, and performs no I/O). `Math.max` is pure. `Math.random`, `Date.now`, and anything that reads the DOM are not.

Pure functions are easy to reason about because everything they depend on is in the parameter list. They are easy to test (no setup and no mocks), safe to call twice, safe to cache, and safe to reorder. A program cannot be entirely pure, since it must do I/O somewhere. The practical aim is a pure core of logic with the side effects pushed to the edges.

Immutability means never changing a value after it has been created; you make a changed copy instead.

```js
// Mutating: the caller's array changes too
function addItem(cart, item) { cart.push(item); return cart; }

// Immutable
const addItem2 = (cart, item) => [...cart, item];
const setQty = (cart, id, qty) =>
  cart.map((line) => (line.id === id ? { ...line, qty } : line));
const removeItem = (cart, id) => cart.filter((line) => line.id !== id);
```

Know which array methods mutate: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, and `fill` change the array in place. Their copying counterparts are `toSorted()`, `toReversed()`, `toSpliced()`, and `with(index, value)`, alongside `map`, `filter`, `slice`, and `concat`. The classic bug is `const sorted = items.sort()`, which sorts `items` itself.

Why this matters for front-end work: frameworks decide whether to re-render by comparing references (`oldState === newState`). If you mutate an object in place, the reference is unchanged and the UI does not update. With immutable updates, a changed reference *means* changed data, and unchanged parts keep their references, which makes comparison cheap.

`Object.freeze(obj)` makes an object's own properties read-only, but it is shallow, and a failed write is silent outside strict mode. It is useful in tests and for constants. Local mutation inside a function, such as building up an array that you then return, is fine: purity concerns what is observable from outside.

**Try it:** Write `updateIn(state, id, changes)` for a state shaped as `{ users: [{ id, profile: { name, email } }] }` that returns a new state with one user's profile merged with `changes`. Deep-freeze the input in a test to prove that you do not mutate it, and assert that the untouched users are the *same references* as before.

**Resources**
- [MDN: Array.prototype.toSorted()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)
- [MDN: Object.freeze()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
- [React: Keeping components pure](https://react.dev/learn/keeping-components-pure)

### Objects

An object is a collection of properties, each a key (a string or a symbol) mapped to a value. Number keys are converted to strings.

```js
const key = 'role';
const name = 'Ada';
const user = {
  name,                       // shorthand for name: name
  [key]: 'admin',             // computed key
  'last-login': null,         // keys that are not identifiers need quotes
  greet() { return `Hi, ${this.name}`; },   // method shorthand
};

user.name;            // dot access: the key must be a valid identifier
user['last-login'];   // bracket access: any string or expression

const { name: userName, role = 'viewer', ...rest } = user;   // destructuring
const updated = { ...user, role: 'owner' };                  // spread
```

**Destructuring** pulls properties into variables. You can rename (`name: userName`), give defaults (used only for `undefined`), collect the remainder (`...rest`), and nest. Destructuring `null` or `undefined` throws.

**Spread** copies own enumerable properties into a new object, with later properties overriding earlier ones. The order therefore matters: `{ ...defaults, ...options }` lets options win. The copy is shallow, and getters are evaluated and copied as plain values.

Things that the short description leaves out:

- **Missing properties are `undefined`**, with no error. To distinguish "absent" from "present with value undefined", use `Object.hasOwn(obj, key)`, or `key in obj`, which also checks the prototype chain.
- **Property order is defined:** keys that look like non-negative integers come first, in ascending numeric order, and then string keys in insertion order. `{ b: 1, 2: 1, a: 1, 1: 1 }` enumerates as `1, 2, b, a`. Use a `Map` if insertion order matters for number-like keys.
- **Iterate** with `Object.keys`, `Object.values`, and `Object.entries`, which return own enumerable string keys. `Object.fromEntries` is the inverse, giving a neat way to transform an object: `Object.fromEntries(Object.entries(obj).map(...))`.
- **Getters and setters** (`get full() {}`) look like properties and run code; the entry on property descriptors covers them, with `Object.freeze`.
- `delete obj.key` removes a property. In immutable code, prefer the rest pattern to leave one out: `const { password, ...safe } = user`.
- `Object.groupBy(items, fn)` groups an array into an object of arrays.

Never use user input as a key on a plain object without thought: keys such as `__proto__` and `constructor` have special meaning. Use a `Map` or `Object.create(null)` for dictionaries with arbitrary keys.

**Try it:** Write `pick(obj, keys)` and `omit(obj, keys)` without mutating the input. Then write `renameKeys(obj, mapping)` using `Object.entries` and `Object.fromEntries`. Test with an object that has a property whose value is `undefined` and check that it survives.

**Resources**
- [MDN: Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects)
- [MDN: Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
- [MDN: Object.hasOwn()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)

### Arrays

The iteration methods let you say *what* transformation you want, without managing an index.

| Method | Returns | Use it to |
| --- | --- | --- |
| `map(fn)` | New array, same length | Transform each element |
| `filter(fn)` | New array, same or shorter | Keep elements that pass a test |
| `reduce(fn, init)` | Any single value | Fold the array into one result |
| `find(fn)`, `findLast(fn)` | An element or `undefined` | Get the first or last match |
| `some(fn)`, `every(fn)` | Boolean | Ask whether any or all match |
| `flatMap(fn)` | New array | Map, then flatten one level |
| `toSorted(compare)` | New sorted array | Sort without mutating |

```js
const total = orders
  .filter((o) => o.status === 'paid')
  .map((o) => o.amount)
  .reduce((sum, n) => sum + n, 0);

const tags = posts.flatMap((p) => p.tags);     // one flat list
const byAge = users.toSorted((a, b) => a.age - b.age);
```

Details that matter:

- **Always give `reduce` an initial value.** Without one, it uses the first element as the start and throws a `TypeError` on an empty array. If you are building an array or object in a `reduce`, a `for...of` loop or `Object.groupBy` is usually clearer.
- **The comparator** must return a negative number, zero, or a positive number. With no comparator, elements are converted to strings, so `[10, 9, 1].toSorted()` is `[1, 10, 9]`. For strings, use `(a, b) => a.localeCompare(b)`. Sorting is stable.
- **`some` and `every` short-circuit**, as do `find` and `findIndex`. On an empty array, `every` returns true and `some` returns false.
- **`flatMap`** can drop and add elements in one pass: return `[]` to skip, and `[a, b]` to insert two.
- **`includes`** finds `NaN`, where `indexOf` does not.
- **`at(-1)`** reads the last element.
- **`forEach`** returns `undefined` and is only for side effects; if you are pushing into another array inside it, you wanted `map` or `filter`.
- Each chained call makes a pass over the data and an intermediate array. That is fine for ordinary sizes. For very large arrays, use a single loop.
- Create arrays with `Array.from({ length: n }, (_, i) => i)`. `new Array(3)` creates three empty slots, which the iteration methods skip.
- Do not mutate the array that you are iterating over.

**Try it:** Given an array of `{ name, team, score }` objects, compute with array methods only: the names of the top three scorers, the average score per team (with `Object.groupBy`), and whether every team has at least one score above 50. Write each as one expression.

**Resources**
- [MDN: Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [MDN: Array.prototype.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
- [javascript.info: Array methods](https://javascript.info/array-methods)

### Reference vs value

Primitives are copied by value. Objects (including arrays and functions) are handled by reference: a variable holds a pointer to the object, and assignment, argument passing, and returning all copy the pointer, not the object.

```js
const a = { n: 1 };
const b = a;        // same object, two names
b.n = 2;
a.n;                // 2
a === b;            // true: same identity
({ n: 1 }) === ({ n: 1 });   // false: different objects with equal content
```

This is why a function can accidentally change its caller's data, and why `===` on objects tells you about identity, not content.

A **shallow copy** creates a new top-level container whose slots hold the same values, so nested objects are still shared. Spread (`{ ...obj }`, `[...arr]`), `Object.assign`, `Array.from`, and `slice` are all shallow.

```js
const original = { name: 'Ada', tags: ['x'] };
const copy = { ...original };
copy.name = 'Grace';        // independent
copy.tags.push('y');        // also changes original.tags
```

A **deep copy** duplicates everything reachable. Use `structuredClone(value)`, which is built into browsers and Node. It handles nested objects and arrays, `Date`, `Map`, `Set`, `RegExp`, typed arrays, `Error` objects, and circular references. Its limits: it throws a `DataCloneError` on functions and DOM nodes, it drops the prototype (a class instance comes back as a plain object), and it ignores getters, setters, and symbol-keyed properties.

The older `JSON.parse(JSON.stringify(x))` trick is lossy: dates become strings, `undefined` and functions vanish, `Map` and `Set` become `{}`, and cycles throw.

You seldom need a deep copy. For an immutable update, copy only the path you are changing and share the rest:

```js
const next = { ...state, user: { ...state.user, name: 'Grace' } };
```

This is cheaper, and it keeps the references of unchanged branches stable, which UI frameworks depend on. Deep-clone when you need a fully independent snapshot, for example before handing data to code that you do not trust not to mutate it.

**Try it:** Create an object containing a nested array, a `Date`, a `Map`, and a reference to itself. Copy it with spread, with the JSON round trip, and with `structuredClone`. For each copy, record what was preserved, what was shared, and what broke.

**Resources**
- [MDN: structuredClone()](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)
- [MDN: The structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
- [MDN: Shallow copy](https://developer.mozilla.org/en-US/docs/Glossary/Shallow_copy)

### Prototypes

Every object has a hidden link, written `[[Prototype]]` in the specification, to another object or to `null`. When you read a property, the engine looks on the object itself and, if it does not find it there, follows the link and looks again, until it finds the property or reaches `null`. That sequence of links is the prototype chain, and it is the only inheritance mechanism in the language. Classes are syntax over it.

```js
const animal = { eats: true, describe() { return `eats: ${this.eats}`; } };
const rabbit = Object.create(animal);    // rabbit's prototype is animal
rabbit.jumps = true;

rabbit.eats;                      // true, found on the prototype
rabbit.describe();                // `this` is rabbit, not animal
Object.hasOwn(rabbit, 'eats');    // false
Object.getPrototypeOf(rabbit) === animal;   // true
```

The asymmetry to remember: **reads** walk the chain, but **writes** go to the object itself. `rabbit.eats = false` creates an own property on `rabbit` that shadows the inherited one, and `animal` is unchanged. (The exception is when the chain has a setter for that name, in which case the setter runs.) Mutating a shared object or array held on a prototype *does* affect every inheritor, since you are reading the reference and then changing its target.

Two different things are called "prototype":

- An object's `[[Prototype]]`, which you get with `Object.getPrototypeOf(obj)`. The `__proto__` accessor is the legacy way.
- The `prototype` *property* of a function, which is the object that becomes the `[[Prototype]]` of instances created with `new`. So `Object.getPrototypeOf(new Foo()) === Foo.prototype`.

For an array, the chain is `arr`, then `Array.prototype`, then `Object.prototype`, then `null`. That is where `map` and `toString` live. `instanceof` checks whether `Constructor.prototype` appears anywhere in the chain.

Practical rules: do not modify built-in prototypes, since a later standard method with the same name will clash with yours. Use `Object.create(null)` or a `Map` for dictionaries, so that keys such as `toString` are not "found" by inheritance. Be aware of prototype pollution, an attack in which a recursive merge of untrusted JSON writes through a `__proto__` key onto `Object.prototype`, affecting every object in the program.

**Try it:** In the Console, expand `[1, 2]` with `console.dir` and follow `[[Prototype]]` down to `null`, noting where `map`, `hasOwnProperty`, and `length` live. Then create a three-level chain with `Object.create`, add a property of the same name at two levels, and predict which is read, and what happens when you assign to it on the lowest object.

**Resources**
- [MDN: Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)
- [javascript.info: Prototypal inheritance](https://javascript.info/prototype-inheritance)

### Classes

A class is a template for objects that share methods through a prototype. The syntax is built on prototypes, but it adds features that the older function-based pattern did not have.

```js
class Account {
  static #count = 0;                 // private static field
  #balance = 0;                      // private instance field
  owner;                             // public field

  constructor(owner) { this.owner = owner; Account.#count++; }

  get balance() { return this.#balance; }           // getter: account.balance
  deposit(amount) {
    if (amount <= 0) throw new RangeError('Amount must be positive');
    this.#balance += amount;
    return this;
  }
  static get count() { return Account.#count; }
  static isAccount(x) { return #balance in x; }     // brand check
}

class Savings extends Account {
  constructor(owner, rate) { super(owner); this.rate = rate; }
  deposit(amount) { return super.deposit(amount * (1 + this.rate)); }
}
```

What each part means:

- **Methods** are placed on `Account.prototype`, shared by all instances, and are non-enumerable.
- **Fields** are created on each *instance*, before the constructor body runs (after `super()` returns, in a subclass). A field that holds an arrow function gives you a method bound to the instance, at the cost of one function per instance.
- **`#private` members** are truly private, enforced by the language. They are not properties: `obj['#balance']` does not reach them, they do not appear in `Object.keys` or JSON, and access from outside the class body is a syntax error. `#x in obj` tests whether an object has the private member.
- **`static`** members belong to the class itself. Use them for factories and utilities.
- **Getters and setters** look like properties to the caller. Keep them cheap and unsurprising.
- **`extends` and `super`.** A subclass constructor must call `super()` before using `this`. `super.method()` calls the parent's version. `instanceof` works through the chain.

Differences from plain functions: class bodies are always in strict mode, a class cannot be called without `new`, and a class declaration is hoisted but stays in the temporal dead zone until its line runs.

On design: prefer composition to deep inheritance. More than one level of `extends` becomes hard to change, because subclasses depend on the internals of their parents. Use a class when you have state together with the behaviour that protects it, or many instances sharing methods. For a bag of data, use a plain object; for a single function, use a function.

**Try it:** Write a `Stack` class with a private array, `push`, `pop`, and `peek` methods, a `size` getter, a static `from(iterable)` factory, and a `[Symbol.iterator]` method so that `for...of` works on it. Try to read the private array from outside and note the kind of error you get.

**Resources**
- [MDN: Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- [MDN: Private elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements)
- [MDN: Using classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes)

### Property descriptors

A property is more than a key and a value. Each one has attributes, which you can read with `Object.getOwnPropertyDescriptor(obj, key)`. There are two kinds of property:

- A **data property** has `value` and `writable`.
- An **accessor property** has `get` and `set` functions in place of a value.

Both kinds also have `enumerable` and `configurable`.

| Attribute | When it is `false` |
| --- | --- |
| `writable` | Assignment fails |
| `enumerable` | The property is skipped by `for...in`, `Object.keys`, `Object.entries`, spread, `Object.assign`, and `JSON.stringify` |
| `configurable` | The property cannot be deleted, switched between data and accessor, or have its attributes changed (except that `writable` may still go from `true` to `false`) |

A property created by assignment or in a literal has all three set to `true`. One created with `Object.defineProperty` has every attribute you leave out set to `false`, which is the opposite, and is the usual surprise:

```js
const user = { name: 'Ada' };
Object.defineProperty(user, 'id', { value: 7 });   // not writable, enumerable, or configurable
Object.keys(user);          // ['name']
user.id = 8;                // TypeError in strict mode; silently ignored in sloppy mode

const temp = {
  celsius: 20,
  get fahrenheit() { return this.celsius * 9 / 5 + 32; },
  set fahrenheit(f) { this.celsius = (f - 32) * 5 / 9; },
};
temp.fahrenheit = 212;      // runs the setter: celsius is now 100
```

**Getters and setters** run a function on read and on write, while looking like a plain property to the caller. Use them for values derived from other state, and for validation on assignment. A getter with no setter is read-only. Keep getters cheap and free of side effects, since nobody expects `obj.x` to do work. Note that spread and `Object.assign` *call* the getter and copy the resulting value; to copy the accessor itself, use `Object.defineProperties(target, Object.getOwnPropertyDescriptors(source))`. Class methods and accessors are non-enumerable, which is why they do not show up in `Object.keys(instance)`.

Three functions lock down a whole object, each stricter than the last:

| Function | Add properties | Delete properties | Change values |
| --- | --- | --- | --- |
| `Object.preventExtensions` | No | Yes | Yes |
| `Object.seal` | No | No | Yes |
| `Object.freeze` | No | No | No |

`seal` marks every property non-configurable, and `freeze` also marks every data property non-writable. Test with `Object.isSealed` and `Object.isFrozen`. Things to remember:

- All three are **shallow**. A frozen object's nested objects can still be changed. Freeze recursively if you need to.
- They cannot be undone.
- A failed write throws a `TypeError` only in strict mode. In sloppy mode it does nothing, silently.
- Freezing does not affect accessor properties' behaviour: a setter still runs.
- `freeze` does not work as you might hope on a `Map` or `Set`, whose contents are not properties.

`const` and `freeze` are different tools: `const` stops a variable from being reassigned, and `freeze` stops an object from being changed.

**Try it:** Write `deepFreeze(obj)` that freezes an object and everything reachable from it, and copes with cycles. Then define a `fullName` accessor on a `{ first, last }` object with `Object.defineProperty`, copy the object once with spread and once with `getOwnPropertyDescriptors`, change `first` on each copy, and compare their `fullName`.

**Resources**
- [MDN: Object.defineProperty()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [MDN: Enumerability and ownership of properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties)
- [MDN: Object.freeze()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)

### Symbols

A symbol is a primitive value that is guaranteed to be unique. `Symbol('id') === Symbol('id')` is false: the string is only a description for debugging. Symbols exist for one purpose, to be property keys that cannot collide with any other key.

```js
const id = Symbol('id');
const user = { name: 'Ada', [id]: 42 };

user[id];                        // 42
Object.keys(user);               // ['name']
JSON.stringify(user);            // '{"name":"Ada"}'
Object.getOwnPropertySymbols(user);   // [Symbol(id)]
```

Symbol-keyed properties are skipped by `for...in`, `Object.keys`, `Object.entries`, and `JSON.stringify`. They are *not* private, though: `Object.getOwnPropertySymbols` and `Reflect.ownKeys` list them, and spread and `Object.assign` copy them. Use `#private` fields for privacy. Use symbols when you must attach data to an object you do not own, or define a key in a library, without any risk of clashing with someone else's property names.

Mechanics:

- Create with `Symbol(description)`, without `new` (which throws). `typeof` gives `'symbol'`.
- A symbol does not convert to a string implicitly. A template literal or `+ ''` throws a `TypeError`; use `String(sym)` or `sym.description`.
- `Symbol.for('app.key')` looks up, or creates, a symbol in a global registry, so the same key gives the same symbol everywhere, even across iframes and workers' realms. `Symbol.keyFor(sym)` reverses it. Registered symbols are shared on purpose, so they can collide by name.

**Well-known symbols** are how the language lets your objects hook into its built-in behaviour. They are static properties of `Symbol`, and each one names a method that some syntax or built-in looks for:

| Symbol | Used by |
| --- | --- |
| `Symbol.iterator` | `for...of`, spread, destructuring, `Array.from` |
| `Symbol.asyncIterator` | `for await...of` |
| `Symbol.toPrimitive` | Conversion to a number or string |
| `Symbol.toStringTag` | `Object.prototype.toString`, and how consoles label the object |
| `Symbol.hasInstance` | `instanceof` |
| `Symbol.dispose`, `Symbol.asyncDispose` | `using` and `await using` |

```js
class Money {
  constructor(amount, currency) { this.amount = amount; this.currency = currency; }
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.amount : `${this.amount} ${this.currency}`;
  }
  get [Symbol.toStringTag]() { return 'Money'; }
}
const price = new Money(5, 'EUR');
+price;        // 5
`${price}`;    // '5 EUR'
```

Using symbols for these hooks, and not string names such as `iterator`, meant that the feature could be added to the language without breaking any existing object that happened to have a property of that name. That is the collision-avoidance idea at work.

**Try it:** Make a `Playlist` class iterable by giving it a `[Symbol.iterator]` generator method, and confirm that spread and `for...of` work on it. Add `Symbol.toStringTag` and see how the Console labels an instance. Then attach metadata to a DOM element under a symbol key, and show that `Object.keys` and `JSON.stringify` do not see it but `Reflect.ownKeys` does.

**Resources**
- [MDN: Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
- [javascript.info: Symbol type](https://javascript.info/symbol)
- [ECMAScript specification: Well-known symbols](https://tc39.es/ecma262/#sec-well-known-symbols)

### `Map`, `Set`, `WeakMap`, `WeakSet`

**`Map`** is a key-value collection. Reach for it in place of a plain object when:

- keys are not strings (objects, numbers, anything), since object keys are always converted to strings;
- keys come from user input, since a `Map` has no prototype keys such as `constructor` or `__proto__` to collide with;
- you add and remove entries often, or need the `size`;
- you need iteration in insertion order for every kind of key.

Keep plain objects for fixed, known shapes (records), and for anything that goes to JSON.

```js
const visits = new Map();
visits.set(user, (visits.get(user) ?? 0) + 1);    // an object as the key
for (const [key, value] of visits) { }

const unique = [...new Set(emails)];              // remove duplicates
const seen = new Set();
if (!seen.has(id)) { seen.add(id); }

const common = new Set(a).intersection(new Set(b));
```

**`Set`** holds unique values. `has()` is fast at any size, whereas `array.includes()` scans the whole array. Sets support `union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf`, and related methods in all current browsers.

Both use the *SameValueZero* comparison: like `===`, except that `NaN` equals `NaN`. Objects are compared by identity, so `set.add({ a: 1 })` twice stores two entries, and `map.get([1, 2])` never finds a key that was a different array.

**`WeakMap`** and **`WeakSet`** hold their keys *weakly*. If nothing else refers to the key object, it can be garbage-collected and its entry disappears. The price is that keys must be objects (or non-registered symbols), and that the collections are not iterable and have no `size`, because their contents depend on when the collector runs.

That makes a `WeakMap` the right tool for attaching data to objects that you do not own, without leaking memory:

```js
const cache = new WeakMap();
function measure(element) {
  if (!cache.has(element)) cache.set(element, expensiveLayoutWork(element));
  return cache.get(element);
}
```

When the element is removed and dropped, its cache entry goes with it. With a `Map`, the map itself would keep every element alive for ever. A `WeakSet` suits "have I seen this object?" marks, such as tracking visited nodes while walking a cyclic structure.

Conversions: `new Map(Object.entries(obj))`, `Object.fromEntries(map)`, and `[...map.keys()]`. `Map.groupBy(items, fn)` groups by keys of any type.

**Try it:** Write `countBy(items, keyFn)` that returns a `Map` from key to count, and test it with keys that are objects. Then build a memoised `getMetadata(obj)` with a `Map` and with a `WeakMap`, and explain which one leaks when `obj` is discarded.

**Resources**
- [MDN: Keyed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections)
- [MDN: Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [MDN: WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)

### Iterators and generators

Iteration in JavaScript is a protocol: an agreement about method names that any object can follow.

- An **iterable** has a method at the key `Symbol.iterator` that returns an iterator.
- An **iterator** has a `next()` method that returns `{ value, done }`.

Everything that consumes sequences uses this protocol: `for...of`, spread, array destructuring, `Array.from`, `new Map(iterable)`, `Promise.all`, and `yield*`. Arrays, strings, Maps, Sets, NodeLists, and `arguments` are iterable. Plain objects are not, which is why `for...of` on an object throws; use `Object.entries(obj)`.

A **generator function** (`function*`) is the easy way to write an iterator. Calling it runs no code; it returns a generator object. Each `next()` runs the body until the next `yield`, hands out that value, and pauses there with all local state kept.

```js
function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) yield i;
}
[...range(0, 5)];                 // [0, 1, 2, 3, 4]

function* naturals() { let n = 1; while (true) yield n++; }

const firstEvenSquares = naturals()
  .filter((n) => n % 2 === 0)
  .map((n) => n * n)
  .take(3)
  .toArray();                     // [4, 16, 36]

class Tree {
  *[Symbol.iterator]() {
    yield this.value;
    for (const child of this.children) yield* child;   // delegate
  }
}
```

The important property is **laziness**. Values are computed one at a time, on demand, so `naturals()` can be infinite, and the pipeline above does only as much work as the three results need. The iterator helper methods used there (`map`, `filter`, `take`, `drop`, `flatMap`, `some`, `every`, `find`, `reduce`, `toArray`) are available on all built-in iterators in current browsers and Node. Unlike the array methods, they build no intermediate arrays.

Things to know:

- An iterator is **single-use**. Once consumed it is finished; get a fresh one to go again. An array is *iterable* (it gives a new iterator each time), while a generator object is itself an *iterator*.
- Leaving a `for...of` early with `break` calls the iterator's `return()` method, so a generator's `finally` block runs and can clean up.
- **Async iteration** uses `Symbol.asyncIterator` and `for await...of`, with `async function*`. It suits streams and paginated APIs, where each value arrives later.

**Try it:** Write a generator `chunk(iterable, size)` that yields arrays of `size` items, and works on any iterable, including another generator. Then write `paginate(fetchPage)` as an async generator that yields items page by page until a page comes back empty, and consume it with `for await`.

**Resources**
- [MDN: Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)
- [MDN: Iterators and generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators)
- [MDN: Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator)

### JSON

JSON is a text format with six kinds of value: objects, arrays, strings, numbers, booleans, and `null`. It is stricter than JavaScript object literals: keys and strings need double quotes, and there are no trailing commas, no comments, and no `undefined`.

`JSON.stringify(value, replacer, space)` serialises, and `JSON.parse(text, reviver)` parses. What does not survive a round trip:

| Value | Becomes |
| --- | --- |
| `undefined`, a function, a symbol (as a property value) | The property is omitted |
| The same, inside an array | `null` |
| `NaN`, `Infinity`, `-Infinity` | `null` |
| `Date` | An ISO string, which stays a string after parsing |
| `Map`, `Set`, `RegExp` | `{}` |
| A class instance | A plain object with own enumerable properties only |
| `BigInt` | Throws a `TypeError` |
| A circular reference | Throws a `TypeError` |

An object with a `toJSON()` method is serialised as whatever that method returns, which is how `Date` produces a string. The `replacer` may be an array of keys to keep, or a function `(key, value)` that transforms values. The `space` argument pretty-prints: `JSON.stringify(data, null, 2)`.

`JSON.parse` throws a `SyntaxError` on invalid input, so wrap it whenever the text comes from outside. A `reviver` can restore types:

```js
const data = JSON.parse(text, (key, value) =>
  key.endsWith('At') && typeof value === 'string' ? new Date(value) : value);
```

Three things that cause real bugs:

1. **Dates.** After parsing, `createdAt` is a string. Code that calls `.getTime()` on it fails.
2. **Large integers.** Numbers beyond 2^53 lose precision when parsed. APIs should send 64-bit IDs as strings.
3. **Trust.** Parsing does not validate. `JSON.parse` tells you that the text is JSON, not that it has the shape you expect. Validate data that crosses a trust boundary, by hand or with a schema library, before using it.

`JSON.parse` is safe from code execution, and a `"__proto__"` key in parsed JSON becomes an ordinary own property. The danger comes later, if you recursively merge that object into another.

`response.json()` on a `fetch` response is `JSON.parse` applied to the body, and it rejects on invalid JSON, including an empty body.

**Try it:** Build an object containing a `Date`, `undefined`, `NaN`, a `Map`, a nested array with a function in it, and a `BigInt`. Predict the output of `JSON.stringify` (and which value makes it throw). Then write a replacer and reviver pair that round-trips `Map` and `Date` values correctly.

**Resources**
- [MDN: JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [MDN: JSON.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [JSON.org: Introducing JSON](https://www.json.org/json-en.html)

### Dates and time

A `Date` is a single number: milliseconds since 1970-01-01T00:00:00Z. It has no time zone of its own. The methods then present that instant either in UTC (`getUTCHours`) or in the *local time zone of the machine* (`getHours`), and there is no way to ask for any other zone.

The pain points:

- **Months start at zero.** `new Date(2026, 0, 31)` is 31 January.
- **Parsing is inconsistent.** `new Date('2026-03-01')` is treated as UTC, and `new Date('2026-03-01T00:00')` as local time. For users west of Greenwich, the first one displays as 28 February. Formats other than ISO 8601 are implementation-defined.
- **It is mutable.** `date.setDate(...)` changes the object in place, so a date passed to a function can be altered under you.
- **Arithmetic overflows silently.** Adding a month to 31 January with `setMonth` gives 3 March.
- **No date-only or time-only type.** A birthday becomes a midnight instant in some zone, and shifts by a day when viewed from another.
- **Daylight saving.** A "day" is not always 24 hours, so adding `86400000` milliseconds is wrong twice a year.

For *display*, `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat` are good and universally supported, and they accept a `timeZone` option. For timestamps, `Date.now()` and `toISOString()` are fine.

**`Temporal`** is the replacement. It is a finished (Stage 4) part of the language with separate, immutable types for separate ideas: `Temporal.Instant` (an exact moment), `Temporal.ZonedDateTime` (a moment in a named time zone), `Temporal.PlainDate`, `Temporal.PlainTime`, and `Temporal.PlainDateTime` (wall-clock values with no zone), and `Temporal.Duration`.

```js
const due = Temporal.PlainDate.from('2026-01-31').add({ months: 1 });   // 2026-02-28
const today = Temporal.Now.plainDateISO();
const daysLeft = today.until(due, { largestUnit: 'day' }).days;

const meeting = Temporal.ZonedDateTime.from('2026-11-01T09:00[America/New_York]');
const inTokyo = meeting.withTimeZone('Asia/Tokyo');
```

Months start at one, arithmetic is aware of calendars and daylight saving, and every operation returns a new object. At the time of writing, Temporal ships in Firefox, in Chrome and Edge, and in Node 26, but not yet in a stable Safari release. Until it does, load a polyfill, or use a library such as date-fns. Check the MDN compatibility table for the current state.

Whatever you use: store and transmit instants in UTC as ISO 8601 strings, store date-only values as `YYYY-MM-DD` strings, and convert to the user's zone only for display.

**Try it:** Using `Date`, write `addMonths(date, n)` that does not mutate its argument and clamps to the last day of the month (31 January plus one month is 28 or 29 February). List the edge cases you had to handle. Then, in a browser that supports it, do the same with `Temporal.PlainDate` and compare.

**Resources**
- [MDN: Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)
- [MDN: Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [TC39: Temporal documentation](https://tc39.es/proposal-temporal/docs/)

### Regular expressions

A regular expression describes a pattern of characters. Write one as a literal, `/pattern/flags`, or build one from a string with `new RegExp(string, flags)` when the pattern is dynamic.

The everyday vocabulary:

- **Character classes:** `\d` (digit), `\w` (letter, digit, or underscore), `\s` (whitespace), `.` (any character except a line break), `[abc]`, `[^abc]`, and `[a-z]`.
- **Quantifiers:** `*` (zero or more), `+` (one or more), `?` (optional), and `{2,4}`. They are *greedy*, taking as much as they can. Add `?` to make them lazy: `<.+?>`.
- **Anchors:** `^` and `$` (start and end), and `\b` (word boundary).
- **Groups:** `(...)` captures, `(?:...)` groups without capturing, `(?<name>...)` captures by name, and `a|b` is alternation.
- **Lookarounds:** `(?=...)`, `(?!...)`, `(?<=...)`, and `(?<!...)` assert what is ahead or behind without consuming it.

Flags: `g` (find all), `i` (ignore case), `m` (`^` and `$` match at line breaks), `s` (`.` also matches line breaks), `u` or `v` (Unicode mode, which you should use by default; it enables `\p{Letter}`), `y` (sticky), and `d` (match indices).

```js
const re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/u;
const { year, month } = '2026-10-04'.match(re).groups;

'2026-10-04'.replace(re, '$<day>/$<month>/$<year>');        // '04/10/2026'
for (const m of text.matchAll(/#(\w+)/gu)) console.log(m[1], m.index);
'a, b;c'.split(/[,;]\s*/u);                                 // ['a', 'b', 'c']
```

Which method to use: `regex.test(str)` for yes or no; `str.match(regex)` for the first match and its groups (or `null`); `str.matchAll(regex)` with `g` for every match with groups; and `str.replace` or `replaceAll` with a replacement string or function.

Traps:

- A regex with `g` or `y` is **stateful**. It records `lastIndex`, so calling `test()` twice on the same regex object can give true and then false. Do not reuse a global regex for `test`.
- To match a literal string that came from a user, escape it with `RegExp.escape(input)` before building the pattern.
- Forgetting anchors: `/\d{4}/.test('abc12345')` is true. For validation, write `/^\d{4}$/`.
- **Catastrophic backtracking.** Nested quantifiers such as `(a+)+$` take exponential time on some inputs, and can freeze the page or be used for denial of service. Avoid ambiguity in repeated groups.
- Regular expressions cannot parse nested structures such as HTML. Use a parser. Do not validate email addresses with a giant pattern; check for an `@` and send a confirmation message.

**Try it:** On regex101, with the ECMAScript flavour selected, write patterns for: a hex colour of three or six digits, a time in 24-hour `HH:MM`, and every `{{placeholder}}` in a template string. Then use `replace` with a function to fill the placeholders from an object, leaving unknown ones unchanged.

**Resources**
- [MDN: Regular expressions guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions)
- [MDN: Regular expressions reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions)
- [regex101: tester and debugger](https://regex101.com/)

### The event loop

JavaScript runs on one thread, with one call stack. It can do only one thing at a time, and a function runs to completion before anything else starts. The event loop is the mechanism that decides what runs next once the stack is empty.

There are two kinds of queued work:

- **Tasks** (often called macrotasks): a script's initial run, a timer callback, a user event, a network callback, a `MessageChannel` message.
- **Microtasks:** promise reactions (`then`, `catch`, `finally`, and the code after an `await`), `queueMicrotask` callbacks, and `MutationObserver` callbacks.

The loop goes like this:

1. Take one task and run it to completion.
2. Run *all* microtasks, including any that are queued while doing so, until the microtask queue is empty.
3. If it is time to render, run `requestAnimationFrame` callbacks, then style, layout, and paint.
4. Repeat.

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
queueMicrotask(() => console.log('4'));
(async () => { console.log('5'); await null; console.log('6'); })();
console.log('7');
// 1 5 7 3 4 6 2
```

Synchronous code comes first: 1, 5 (an async function runs synchronously up to its first `await`), and 7. Then the microtasks in the order they were queued: 3, 4, 6. Then the next task: 2.

Consequences:

- **Microtasks always beat tasks.** A `setTimeout(fn, 0)` runs after every pending promise callback.
- **Microtasks can starve the loop.** A microtask that keeps queueing another never lets the browser handle input or paint.
- **Long tasks block everything.** While your function runs, the page cannot respond to clicks or render. Anything above about 50ms is noticeable. Break long work into chunks and yield between them (with `await scheduler.yield()` where it is supported, or a `setTimeout`), or move it to a Web Worker.
- **Rendering happens between tasks,** never in the middle of one. Changing the DOM three times in one function produces a single paint, with the final state.
- **`await` does not block.** It suspends that one function and returns control to the loop.

Node has the same model with more named phases, plus `process.nextTick`, which runs before promise microtasks.

**Try it:** Write a snippet of eight log statements mixing synchronous code, two timers, promises, an async function with two awaits, and `queueMicrotask`. Write down the order and then run it. Then record a `while` loop that spins for 300ms in the Performance panel, and find the long task marked in the main-thread track.

**Resources**
- [MDN: JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)
- [HTML Standard: Event loop processing model](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)
- [Jake Archibald: Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)

### Callbacks

A callback is a function that you pass to other code, to be called later or repeatedly. Some callbacks are synchronous: `array.map(fn)` calls `fn` before it returns. Others are asynchronous: `setTimeout(fn)`, `addEventListener('click', fn)`. An asynchronous callback always runs after the current code has finished, never in the middle of it.

Before promises, asynchronous results were delivered through callbacks. Node standardised the "error-first" convention:

```js
readFile('config.json', 'utf8', (err, text) => {
  if (err) return handle(err);
  parseConfig(text, (err, config) => {
    if (err) return handle(err);
    connect(config, (err, db) => {
      if (err) return handle(err);
      // and so on, further to the right
    });
  });
});
```

The trouble with this is not only the indentation, the "pyramid of doom". The deeper problems are:

- **Errors do not propagate.** Each level must check `err` and pass it on by hand. `try`/`catch` around the outer call catches nothing, since the callbacks run later, on a different call stack.
- **Inversion of control.** You hand your continuation to someone else's code and trust it to call it exactly once, with the right arguments, and asynchronously. Buggy code may call it twice, never, or sometimes synchronously and sometimes not.
- **Composition is manual.** "Run these three in parallel and continue when all are done" needs counters and flags.
- **No return value.** The result exists only inside the callback, so you cannot store it or pass it on.

Promises address each of these: a promise is a value that you can return and store, it settles exactly once, its handlers always run asynchronously, errors skip forward to the next rejection handler, and the combinators handle parallelism.

Callbacks remain the right tool for things that happen *many times* (events, observers, `map`), since a promise settles only once.

To convert an old API, wrap it once:

```js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
```

In Node, `util.promisify(fn)` converts any error-first function, and most core modules have promise versions, such as `node:fs/promises`.

**Try it:** Write a callback-style `loadScript(src, callback)` that appends a `<script>` element and calls back on its `load` and `error` events. Load three scripts in sequence with nested callbacks and full error handling. Then wrap it in a promise and rewrite the sequence with `await`, and compare the two versions.

**Resources**
- [javascript.info: Introduction: callbacks](https://javascript.info/callbacks)
- [MDN: Callback function](https://developer.mozilla.org/en-US/docs/Glossary/Callback_function)
- [Node.js: util.promisify()](https://nodejs.org/api/util.html#utilpromisifyoriginal)

### Promises

A promise is an object that stands for the eventual result of an asynchronous operation. It is in one of three states: *pending*, *fulfilled* with a value, or *rejected* with a reason. Once it is fulfilled or rejected (settled), it never changes again.

You consume a promise with `then(onFulfilled, onRejected)`, `catch(onRejected)`, and `finally(onSettled)`. The key fact, which makes chaining work, is that **each of these returns a new promise**, whose fate depends on what the handler does:

- If the handler returns a value, the new promise is fulfilled with it.
- If the handler returns a promise, the new promise follows that one.
- If the handler throws, the new promise is rejected with the error.
- If there is no handler for the outcome, the outcome passes through unchanged.

```js
fetch('/api/user')
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();                  // returning a promise: the chain waits
  })
  .then((user) => fetch(`/api/teams/${user.teamId}`))
  .then((res) => res.json())
  .catch((err) => { report(err); return null; })   // recovers: the chain continues fulfilled
  .finally(() => hideSpinner());
```

A rejection skips every `then` until it reaches a rejection handler, much as a `throw` skips to the nearest `catch`. A `catch` that returns normally *recovers*, and the chain continues as fulfilled; rethrow if you only wanted to observe.

Common mistakes:

- **Forgetting to return** inside `then`. The chain then carries on at once with `undefined`, and the inner promise's rejection is unhandled.
- **Nesting** `then` inside `then` when you could return and chain.
- **`then(a, b)` against `then(a).catch(b)`.** In the first form, `b` does not catch errors thrown by `a`.
- **Unhandled rejections.** A rejected promise with no handler triggers the `unhandledrejection` event in browsers, and by default terminates a Node process. Every chain should end in a `catch`, or be awaited inside a `try`.
- **The constructor anti-pattern:** wrapping an existing promise in `new Promise`. Use the constructor only to adapt callback APIs.

Mechanics worth knowing: the function passed to `new Promise(executor)` runs *synchronously*, and a throw inside it rejects the promise. Handlers always run asynchronously, as microtasks, even when the promise has already settled. Calling `resolve` or `reject` a second time does nothing. `Promise.resolve(x)` wraps a value, and `Promise.withResolvers()` returns `{ promise, resolve, reject }` for cases where the resolving code lives elsewhere.

A promise represents a result, not the operation. It cannot be cancelled; cancellation is done with `AbortSignal`.

**Try it:** Write a chain of four `then` calls in which the second throws. Add a `catch` after the third and one more `then` after the `catch`. Predict which handlers run and with what values. Then remove a `return` from the middle of a working chain and observe what the next handler receives.

**Resources**
- [MDN: Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [MDN: Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [javascript.info: Promises chaining](https://javascript.info/promise-chaining)

### `async`/`await`

An `async` function always returns a promise. Returning a value fulfils it, and throwing rejects it. Inside, `await promise` suspends the function until the promise settles, and then either yields its value or throws its rejection reason. The rest of the program carries on running in the meantime. This lets you write asynchronous code with ordinary control flow: loops, conditions, and `try`/`catch`.

The most important thing to get right is sequential versus parallel:

```js
// Sequential: about 2 seconds if each takes 1 second
const user = await getUser(id);
const posts = await getPosts(id);

// Parallel: about 1 second. Start both, then wait for both.
const [user2, posts2] = await Promise.all([getUser(id), getPosts(id)]);
```

Use sequential awaits when the second call needs the first one's result. Otherwise start them together. The work begins when the function is *called*; `await` only waits.

More traps:

- **`await` in `forEach` does nothing useful.** `forEach` ignores the promises its callback returns. Use `for...of` for sequential work, or `await Promise.all(items.map(async (item) => ...))` for parallel work.
- **Forgetting `await`.** You get a promise where you expected a value (`if (isAdmin(user))` is always truthy), and errors escape your `try`. The lint rule `no-floating-promises` in typescript-eslint catches this.
- **`return` versus `return await`.** Inside a `try` block, `return fetchData()` returns the promise before it settles, so a rejection is *not* caught by the surrounding `catch`. Write `return await fetchData()` when you want to handle the error there.
- **The dangling promise.** If you write `const a = getA(); const b = getB(); await a; await b;` and `b` rejects while you are still waiting for `a`, the rejection is reported as unhandled. `Promise.all` attaches handlers to both at once.
- **Unbounded parallelism.** `Promise.all` over a thousand requests starts a thousand at once. Process in batches, or use a small concurrency limiter.

Error handling is with `try`/`catch`. Catch at the level that can do something about the error, and do not wrap every `await` separately.

Top-level `await` works in ES modules. Importing modules wait for it, so use it for real initialisation and not for slow optional work. `for await...of` consumes async iterables. An `async` function called from non-async code returns a promise that somebody must handle, even if only with `.catch(report)`.

**Try it:** Write `fetchAll(urls)` three ways: sequentially with `for...of`, fully in parallel with `Promise.all`, and with at most three requests in flight at a time. Simulate requests with a `delay` function that logs start and end, and compare the total times and the log order.

**Resources**
- [MDN: async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN: How to use promises](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Async_JS/Promises)
- [V8 blog: Faster async functions and promises](https://v8.dev/blog/fast-async)

### Promise combinators

Four static methods each take an iterable of promises (plain values are wrapped with `Promise.resolve`) and return a single promise. They differ in when that promise settles.

| Method | Fulfils when | Rejects when | Result |
| --- | --- | --- | --- |
| `Promise.all` | All fulfil | Any rejects (at once) | Array of values, in input order |
| `Promise.allSettled` | All settle | Never | Array of `{ status, value }` or `{ status, reason }` |
| `Promise.race` | The first to settle fulfils | The first to settle rejects | That value or reason |
| `Promise.any` | Any fulfils (the first) | All reject | The first value, or an `AggregateError` |

```js
const [user, settings] = await Promise.all([getUser(), getSettings()]);

const results = await Promise.allSettled(urls.map((u) => fetch(u)));
const failed = results.filter((r) => r.status === 'rejected');

const fastest = await Promise.any([fetchFrom(mirrorA), fetchFrom(mirrorB)]);
```

How to choose:

- **`all`** when you need every result and one failure makes the whole thing useless. Results come in input order, whatever order they finished in.
- **`allSettled`** when the operations are independent and you want to know the outcome of each: saving several items, or loading dashboard widgets.
- **`any`** for redundancy: the first *success* wins and failures are ignored unless everything fails. The `AggregateError` has an `errors` array.
- **`race`** when you care about whichever settles first, success or failure. It was traditionally used for timeouts, though `AbortSignal.timeout()` is better for fetches, as it actually stops the request.

What they do not do:

- **They do not cancel anything.** When `all` rejects or `race` settles, the other operations keep running and their results are discarded. Pass an `AbortSignal` to the operations if you want the losers to stop.
- **They do not start anything.** The operations began when you created the promises. The combinators only observe.
- **They do not limit concurrency.**

Edge cases with an empty iterable: `all` and `allSettled` fulfil with `[]`, `any` rejects with an `AggregateError`, and `race` stays pending for ever.

After `Promise.all` rejects with the first error, later rejections from the other promises are silently swallowed. That is convenient, but it means that you see only one of possibly several failures. Use `allSettled` if you need them all.

**Try it:** Create three promises that settle after different delays: one fulfils fast, one rejects in the middle, and one fulfils slowly. Pass the same three to all four combinators and write down, for each, the outcome and the time at which it settles. Then change the fast one so that it rejects, and repeat.

**Resources**
- [MDN: Promise.all()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- [MDN: Promise.allSettled()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [V8: Promise combinators](https://v8.dev/features/promise-combinators)

### Cancellation

Promises cannot be cancelled, so the platform has a separate mechanism. An `AbortController` owns a `signal`. You pass the signal to an operation, and calling `controller.abort()` tells every operation holding that signal to stop.

```js
let controller;

async function search(query) {
  controller?.abort();                       // cancel the previous request
  controller = new AbortController();
  try {
    const res = await fetch(`/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });
    render(await res.json());
  } catch (err) {
    if (err.name === 'AbortError') return;   // expected: ignore
    throw err;
  }
}
```

This pattern also fixes a race condition. Without it, a slow response to an old query can arrive after a fast response to a newer one, and overwrite it.

When a fetch is aborted, its promise rejects with a `DOMException` named `AbortError` (or with whatever reason you passed to `abort(reason)`). Always tell aborts apart from real failures, as an abort is not an error to show the user.

The signal works well beyond `fetch`:

- **Event listeners:** `el.addEventListener('click', fn, { signal })`. One `abort()` removes every listener registered with that signal, which is the cleanest way to tear down a component.
- **Timeouts:** `AbortSignal.timeout(5000)` returns a signal that aborts by itself, with a `TimeoutError`.
- **Combining:** `AbortSignal.any([userSignal, AbortSignal.timeout(5000)])` aborts when either does.
- **Streams, and many Node APIs,** including `fs`, timers from `node:timers/promises`, and `child_process`.

To make your own async function cancellable, accept a `signal` option and honour it:

```js
function delay(ms, { signal } = {}) {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      reject(signal.reason);
    }, { once: true });
  });
}
```

Check `signal.throwIfAborted()` at the start and between steps of long work, and pass the signal on to anything you call.

Limits: a controller aborts only once, so make a new one for each operation. Aborting stops the *client* from waiting; the server may already have processed the request, so cancellation does not undo a completed write.

**Try it:** Build a search input that fetches on every keystroke, and add artificial random latency on the server or with a wrapper. Observe the out-of-order results. Fix it with an `AbortController` per request, and watch the cancelled requests in the Network panel. Then add a three-second timeout with `AbortSignal.any`.

**Resources**
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN: AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [DOM Standard: Aborting ongoing activities](https://dom.spec.whatwg.org/#aborting-ongoing-activities)

### Timers

These are host APIs (from the browser or Node), not part of the language itself. Each schedules a callback at a different point in the event loop.

**`setTimeout(fn, ms)`** queues a task after *at least* `ms` milliseconds. It is a minimum, not a guarantee: the callback waits for the stack to empty and for earlier tasks to run. `setTimeout(fn, 0)` means "after the current task and all microtasks". Browsers clamp nested timers (more than five levels deep) to at least 4ms, and throttle timers in background tabs heavily, to once a second or less. It returns an ID for `clearTimeout`.

**`setInterval(fn, ms)`** repeats. It has two problems: it takes no account of how long the callback runs, so slow callbacks pile up one after another, and it carries on when an asynchronous operation started by the callback has not finished. Prefer a chained timeout that schedules the next run when the current one is done:

```js
async function poll() {
  await refresh();
  timer = setTimeout(poll, 5000);
}
```

Always keep the ID and clear it when the component or page goes away. Forgotten intervals are a classic leak.

**`queueMicrotask(fn)`** runs `fn` after the current synchronous code and before any task or rendering. Use it to defer something to "the end of this operation", for example to batch several synchronous updates into one. It does not let the browser paint.

**`requestAnimationFrame(fn)`** runs `fn` just before the next repaint, normally sixty times a second or at the display's refresh rate. It receives a high-resolution timestamp. Use it for anything visual: animation driven by JavaScript, and reading or writing layout once per frame. Animate from the timestamp, not from a frame count, so that speed does not depend on the refresh rate. It pauses in background tabs. It is one-shot, so request the next frame inside the callback, and cancel with `cancelAnimationFrame`.

```js
function animate(now) {
  const t = Math.min((now - start) / duration, 1);
  el.style.translate = `${t * 300}px 0`;
  if (t < 1) requestAnimationFrame(animate);
}
```

To break up long work and let the browser respond to input, `await scheduler.yield()` is the purpose-built API. It is not in Safari at the time of writing, so fall back to a zero-delay timeout.

Do not use timers to wait for something to "probably be ready". Wait for the event or promise that signals it. Also remember that `setTimeout(obj.method, 100)` loses `this`.

**Try it:** Log `performance.now()` deltas from a `setInterval` of 100ms while a busy loop blocks the thread for 350ms, and explain the timing you see. Then animate a box across the screen with `requestAnimationFrame` and timestamps, switch tabs for five seconds, and come back.

**Resources**
- [MDN: setTimeout()](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout)
- [MDN: requestAnimationFrame()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [MDN: Using microtasks in JavaScript with queueMicrotask()](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)

### Debounce and throttle

Both limit how often a function runs in response to a rapid stream of calls, such as keystrokes, scroll events, or resize events. They answer different questions.

**Debounce** waits for a pause. The function runs once, `wait` milliseconds after the *last* call. Use it when only the final state matters: search-as-you-type, validating a field, saving a draft, or reacting to the end of a resize.

**Throttle** enforces a maximum rate. The function runs at most once per `wait` milliseconds while calls keep coming. Use it when you want regular updates during a continuous action: scroll position, pointer movement, progress reporting.

```js
function debounce(fn, wait) {
  let timer;
  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  }
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

function throttle(fn, wait) {
  let lastRun = -Infinity;
  let timer = null;
  return function throttled(...args) {
    const remaining = wait - (Date.now() - lastRun);
    clearTimeout(timer);
    if (remaining <= 0) {
      lastRun = Date.now();
      fn.apply(this, args);                 // leading call
    } else {
      timer = setTimeout(() => {            // trailing call with the latest arguments
        lastRun = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  };
}
```

Points to understand in these implementations:

- The timer and timestamp live in a **closure**, so each debounced or throttled function has its own state.
- The wrappers are normal functions, not arrows, and use `fn.apply(this, args)`, so that `this` and the arguments are forwarded. That matters when the wrapped function is a method or an event handler.
- This throttle fires on the leading edge and also makes a trailing call, so the final event in a burst is never lost. A throttle that drops the trailing call leaves the UI showing a stale value.
- Offer `cancel`, and call it when the component is torn down, or the delayed call may run against a removed element.

A frequent bug is creating the debounced function *inside* the handler or the render function. Each call then makes a new wrapper with a new timer, and nothing is debounced. Create it once and reuse it.

For visual updates, throttle to the frame rate with `requestAnimationFrame` instead of a fixed time. Often no throttling is needed at all: `IntersectionObserver`, `ResizeObserver`, and CSS scroll-driven animations replace most scroll and resize handlers. Debouncing a search does not prevent out-of-order responses; you still need `AbortController`.

**Try it:** Type both functions out from memory, then test them with fake timers (`mock.timers` from `node:test`): five calls 40ms apart with `wait` of 100 should give one debounced call, with the last arguments, and three throttled calls. Add a `leading` option to `debounce`.

**Resources**
- [MDN: Debounce](https://developer.mozilla.org/en-US/docs/Glossary/Debounce)
- [MDN: Throttle](https://developer.mozilla.org/en-US/docs/Glossary/Throttle)
- [CSS-Tricks: Debouncing and Throttling Explained Through Examples](https://css-tricks.com/debouncing-throttling-explained-examples/)

### ES modules

An ES module is a file with its own scope that states what it needs with `import` and what it offers with `export`.

```js
// math.js
export const PI = 3.14159;
export function area(r) { return PI * r ** 2; }
export default class Circle { }

// app.js
import Circle, { area, PI as pi } from './math.js';
import * as math from './math.js';
export { area } from './math.js';                // re-export

const { Chart } = await import('./chart.js');    // dynamic: returns a promise
```

**Named and default exports.** A module can have many named exports and one default. Named exports must be imported by their exact name (with optional `as` renaming), which helps tooling: auto-import, safe renaming, and an error when the name does not exist. A default export can be imported under any name, which leads to inconsistent naming across a codebase. Many teams use named exports only. The default export is really just an export called `default`.

How modules behave:

- **The structure is static.** `import` and `export` must be at the top level, with string-literal specifiers. That allows tools to work out the dependency graph without running code, which is what makes tree shaking possible.
- **Imports are hoisted** and are resolved before any code in the module runs.
- **Bindings are live and read-only.** An import is a view of the exporter's variable, not a copy. If the exporting module reassigns it, importers see the new value. Importers cannot assign to it.
- **A module is evaluated once.** Every importer shares the same instance, so module-level state is effectively a singleton.
- **Modules are always in strict mode,** and `this` at the top level is `undefined`.
- **Top-level `await`** is allowed.

**Dynamic `import()`** loads a module on demand and returns a promise for its namespace object. It works anywhere, including in non-module scripts, and accepts a computed specifier. It is the basis of code splitting: load a heavy feature only when the user needs it.

In the browser, use `<script type="module" src="app.js">`. Module scripts are deferred by default, are fetched with CORS, and run once even if included twice. Specifiers must be URLs or start with `./`, `../`, or `/`, with the file extension; a bare specifier such as `'lodash'` needs an import map or a bundler. JSON can be imported with an import attribute: `import data from './data.json' with { type: 'json' }`.

`import.meta.url` gives the module's own URL. Circular imports are permitted, but reading a binding before the other module has initialised it throws, because of the temporal dead zone, so avoid cycles.

**Try it:** Make three files with no build tool: a module that exports a counter variable and an `increment` function, and two modules that import them. Serve them with a local static server and show that both importers see the same live counter. Then load a fourth module with `import()` on a button click, and watch it arrive in the Network panel.

**Resources**
- [MDN: JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [MDN: import()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [V8: JavaScript modules](https://v8.dev/features/modules)

### CommonJS

CommonJS (CJS) is the module system that Node used before ES modules existed. A great deal of npm is still published in it, so you need to recognise it and understand where it meets ESM.

```js
// CommonJS
const fs = require('node:fs');
const { parse } = require('./parser');
module.exports = { run };
exports.helper = helper;
```

How it differs from ES modules:

- **`require()` is a function** that runs synchronously, and can appear anywhere: in an `if`, in a function, with a computed path. Tools therefore cannot fully analyse a CJS dependency graph statically, and tree shaking is weaker.
- **Exports are a plain object, copied at the time of the `require`.** Destructuring `const { count } = require('./counter')` takes a snapshot. There are no live bindings.
- **Not strict by default,** and the module has `__dirname`, `__filename`, `module`, and `exports` as injected variables. In ESM, use `import.meta.dirname` and `import.meta.filename`.
- **Resolution is looser:** extensions and `/index.js` may be left out.

**How Node decides which system a file uses:** `.mjs` is always ESM, `.cjs` is always CommonJS, and a `.js` file follows the `"type"` field of the nearest `package.json` (`"module"` or `"commonjs"`). Without that field, current Node versions examine the syntax of the file to decide; set the field explicitly to avoid surprises.

**Interop:**

- **ESM importing CJS** works. `import pkg from 'cjs-package'` gives you `module.exports` as the default. Named imports work only when Node's static analysis can detect the export names, which fails for some patterns; then you must import the default and destructure.
- **CJS requiring ESM** was impossible for years (you got `ERR_REQUIRE_ESM`), and dynamic `import()` was the only route. Current Node versions (22.12 and later, including 24) allow `require()` of an ES module, as long as that module and its dependencies use no top-level `await`; otherwise it throws `ERR_REQUIRE_ASYNC_MODULE`.
- **The dual package hazard.** A package that ships both builds can be loaded twice, once in each format, giving two copies of its state and failing `instanceof` checks.
- **`default` confusion.** Code compiled from ESM to CJS exposes its default export as `exports.default`, so a consumer may end up writing `pkg.default`.

A package's `"exports"` field in `package.json` maps entry points per condition (`"import"`, `"require"`), and determines which file you actually get.

For new code, write ESM. Browsers do not understand CommonJS at all; bundlers convert it.

**Try it:** In an empty folder, create `a.cjs` that exports an object with a counter and an `inc` function, and `b.mjs` that imports it with both default and named import syntax. See which forms work. Then `require()` an `.mjs` file from a `.cjs` file, add a top-level `await` to the `.mjs` file, and read the error.

**Resources**
- [Node.js: CommonJS modules](https://nodejs.org/api/modules.html)
- [Node.js: ECMAScript modules, interoperability with CommonJS](https://nodejs.org/api/esm.html#interoperability-with-commonjs)
- [Node.js: Packages, determining module system](https://nodejs.org/api/packages.html#determining-module-system)

### Strict mode

Strict mode is a restricted variant of the language that turns several silent mistakes into errors and removes some features that made code hard to optimise and reason about. You opt in with the directive `'use strict';` as the first statement of a script or function. **ES modules and class bodies are always strict**, so in modern code you are nearly always in strict mode without writing anything.

What changes:

- **Assigning to an undeclared variable throws** a `ReferenceError`. In sloppy mode, `total = 5` with a misspelt name quietly creates a global variable.
- **`this` is `undefined` in a plain function call,** not the global object. A method that loses its binding now fails at once with a `TypeError`, where in sloppy mode it would read and write globals.
- **Failed writes throw.** Assigning to a read-only property, to a getter with no setter, to a property of a frozen object, or adding to a non-extensible object throws a `TypeError`. In sloppy mode nothing happens and the code carries on with the wrong assumption.
- **Deleting an undeletable property throws,** and `delete name` on a plain variable is a `SyntaxError`.
- **Duplicate parameter names** are a `SyntaxError`.
- **Legacy octal literals** such as `010` are a `SyntaxError`. Write `0o10`.
- **`with` is forbidden.**
- **`eval` gets its own scope** and no longer leaks variables into the surrounding one. `eval` and `arguments` cannot be assigned to.
- **`arguments` is no longer linked to the parameters.** In sloppy mode, changing `arguments[0]` changes the first parameter, and the reverse.
- **Primitives are not boxed** when used as `this`: `fn.call(5)` gives `this === 5`.
- **Function declarations in blocks are block-scoped.**
- More words are **reserved**, including `let`, `static`, `implements`, `interface`, `package`, `private`, `protected`, `public`, and `yield`.

Where you can still meet sloppy mode: classic `<script>` tags without the directive, inline event handler attributes, code typed into the Console, old libraries, and CommonJS files in Node. Bundlers generally emit strict code.

One thing to watch when concatenating old scripts: a `'use strict'` directive at the top of the combined file applies to all of it, which can break legacy code. The directive is recognised only as the very first statement; anywhere else it is an ordinary string expression and does nothing. A function with default, rest, or destructured parameters cannot contain its own `'use strict'` directive.

**Try it:** Write a classic script (not a module) that assigns to an undeclared variable, calls a function that logs `this`, and writes to a property of a frozen object. Run it, add `'use strict';` at the top, and run it again. Note which lines changed behaviour and what kind of error each throws.

**Resources**
- [MDN: Strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
- [ECMAScript specification: The strict mode of ECMAScript](https://tc39.es/ecma262/#sec-strict-mode-of-ecmascript)

### Garbage collection

JavaScript manages memory for you. The collector frees an object when it becomes *unreachable*: when no chain of references leads to it from a root. The roots are the global object, the variables of functions currently on the call stack, and things the host keeps alive, such as the DOM tree, pending timers, and registered event listeners.

Engines use mark-and-sweep: start at the roots, mark everything that can be reached, and free the rest. Two objects that refer only to each other are collected, since neither can be reached from a root. Modern collectors are generational (new objects are checked often and cheaply, and survivors are promoted), incremental, and partly concurrent, but the rule you need is the reachability rule. You cannot force a collection, or know when one happens.

A **leak**, in a garbage-collected language, is an object that you no longer need but that is still reachable. The usual causes:

- **Forgotten listeners and observers.** A listener on `window` or `document` whose callback closes over a component keeps the component alive for ever. Remove it, or register it with an `AbortSignal`.
- **Forgotten timers.** A `setInterval` that is never cleared keeps its callback and everything the callback refers to.
- **Detached DOM nodes.** An element removed from the document, but still held in a variable, array, or closure. It keeps its whole subtree alive.
- **Unbounded caches.** A `Map` or object used as a cache that only grows. Limit its size, or key it by object in a `WeakMap`.
- **Closures that capture more than intended,** such as a long-lived callback that refers to one small field of a large object, and so retains the whole object.
- **Accidental globals,** and arrays at module level that are appended to and never trimmed.

Finding leaks with the Chrome DevTools Memory panel:

1. Take a heap snapshot.
2. Perform the suspect action several times (open and close a dialog ten times), and then force a collection with the bin icon.
3. Take another snapshot and choose the "Comparison" view. Objects whose count grows by exactly the number of repetitions are your suspects.
4. Select one and read the **Retainers** pane, which shows the chain of references that keeps it alive. That chain is the answer.

Typing "Detached" into the class filter lists detached DOM nodes. The "Allocation instrumentation on timeline" recording shows which allocations survive.

`WeakMap`, `WeakSet`, and `WeakRef` hold objects without keeping them alive. `FinalizationRegistry` lets you run code after an object has been collected, but its timing is not guaranteed, so do not rely on it for program logic.

**Try it:** Write a page with a button that creates a `<div>`, adds a `resize` listener on `window` whose callback refers to the div, and then removes the div from the document. Click it twenty times, and use the snapshot comparison to find the twenty detached divs and their retainer chain. Fix the leak and verify.

**Resources**
- [MDN: Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management)
- [Chrome DevTools: Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems)
- [javascript.info: Garbage collection](https://javascript.info/garbage-collection)

### Explicit resource management

Garbage collection frees memory, at a time of its own choosing. It does nothing for resources that must be released *promptly*: file handles, database connections, locks, timers, event listeners, temporary files. Until now the tool for those was `try`/`finally`, which works but is verbose, nests one level for each resource, and is easy to forget. The `using` declaration ties cleanup to scope instead.

```js
function openTempDir() {
  const path = fs.mkdtempSync('/tmp/job-');
  return {
    path,
    [Symbol.dispose]() { fs.rmSync(path, { recursive: true }); },
  };
}

function build() {
  using dir = openTempDir();
  using lock = acquireLock(dir.path);
  compile(dir.path);        // may throw or return early
}                           // lock is disposed, then dir, whatever happened
```

A *disposable* is any object with a `[Symbol.dispose]()` method. `using x = value` declares a block-scoped constant and registers the value, and when the block is left, by reaching the end, by `return`, by `break`, or by a throw, the method is called. Several resources are disposed in **reverse order** of declaration, like a stack, so a resource that depends on an earlier one is released first.

`await using` is the asynchronous form. It calls `[Symbol.asyncDispose]()` (falling back to `Symbol.dispose`) and awaits the result before continuing. It is allowed only where `await` is: in async functions and at the top level of modules.

```js
async function report() {
  await using db = await connect(url);     // db[Symbol.asyncDispose] closes the connection
  return db.query('select ...');
}
```

Rules and details:

- The value must be `null`, `undefined` (both are skipped, which allows optional resources), or an object with the dispose method. Anything else throws a `TypeError` at the declaration.
- `using` is allowed in blocks, function bodies, modules, and the heads of `for` and `for...of` loops. It is not allowed at the top level of a classic script, or directly in a `switch` case.
- If the block throws and a disposer then throws too, neither error is lost. The result is a `SuppressedError`, whose `error` property is the disposal error and whose `suppressed` property is the original one.
- `DisposableStack` (and `AsyncDisposableStack`) collects cleanups by hand: `stack.use(resource)`, `stack.defer(fn)` for an arbitrary callback, and `stack.adopt(value, fn)` for a value that is not itself disposable. The stack is disposable, so `using stack = new DisposableStack()` gives a scope a list of deferred cleanups. `stack.move()` transfers ownership, which is how a constructor acquires several resources and hands them to the finished object only if every step succeeded.
- Built-in iterators have a `Symbol.dispose` method that calls `return()`, and Node exposes the symbols on many of its handles, such as file handles.

The proposal is finished (Stage 4, for inclusion in ES2027). At the time of writing it ships in Chrome and Edge, in Firefox, and in Node 24, but not in a stable Safari release, so in code for browsers you compile it. TypeScript and Babel both transform the syntax, and you must add a polyfill for `Symbol.dispose`, `DisposableStack`, and `SuppressedError`, for example from core-js.

Do not confuse this with `FinalizationRegistry`, which runs at some unknown time after collection. `using` is deterministic.

**Try it:** In Node 24, write `timer(label)` that returns a disposable which logs the elapsed time on disposal, and use it with `using` in a function that returns early on one path and throws on another. Then declare three resources that log on disposal and predict the order. Finally, make both the block and a disposer throw, and inspect the `SuppressedError`.

**Resources**
- [MDN: using](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/using)
- [MDN: JavaScript resource management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Resource_management)
- [V8: JavaScript's New Superpower: Explicit Resource Management](https://v8.dev/features/explicit-resource-management)

### Keeping up with the spec

JavaScript is standardised as ECMAScript by TC39, a committee of engine implementers, large users, and invited experts. New features go through a staged process, and a new edition of the standard (ES2025, ES2026, and so on) is published every June, containing whatever reached the last stage in time.

| Stage | Meaning | What it means for you |
| --- | --- | --- |
| 0 | An idea | Ignore it |
| 1 | The committee accepts the problem as worth solving | Interesting; it will change |
| 2 | A draft design has been chosen | The direction is set, the details are not |
| 2.7 | The design is approved in principle, and awaits tests | Nearly stable |
| 3 | Ready for implementation in engines | Starts appearing in browsers; usable with care |
| 4 | Finished: tests pass and at least two implementations ship | Part of the next edition |

The edition year tells you little in practice. What matters is whether the engines that *your users* run have shipped the feature. A feature can be at Stage 4 and still be missing from one browser for a long time, as `Temporal` shows.

Where to check:

- **MDN.** The compatibility table at the bottom of every reference page lists the version in which each browser and Node shipped a feature. Pages also carry a **Baseline** badge: "newly available" means that it works in the latest Chrome, Edge, Firefox, and Safari, and "widely available" means that it has done so for thirty months.
- **caniuse.com** for the same data with usage percentages.
- **The TC39 proposals repository** for what is coming, with links to each proposal's explainer.
- **Release notes:** the V8 blog, the WebKit blog's Safari release posts, the Firefox release notes on MDN, and the Node.js changelog.

Two different remedies exist for missing features, and people confuse them:

- **New syntax** (`?.`, `#private`, `using`) cannot be added at run time. A compiler (TypeScript, Babel, esbuild, SWC) must rewrite it for older engines, according to a target that you configure.
- **New APIs** (`Array.prototype.toSorted`, `Promise.withResolvers`, `structuredClone`) can be polyfilled: a script defines the missing function. core-js is the usual source.

Decide your support target explicitly, for example with a browserslist query such as `baseline widely available` or `defaults`, and let the tools apply it. Do not adopt Stage 2 proposals in production; they change. Before using something new, feature-detect it where that is possible (`if ('groupBy' in Object)`).

The specification itself is readable once you learn its conventions, and it settles any argument about what the language does.

**Try it:** Pick three features that you have heard about but not used. For each, find the proposal in the TC39 repository and note its stage, then find its MDN page and note the Baseline status and the first Safari and Node versions that support it. Decide whether you could use each one in a project that supports the last two years of browsers.

**Resources**
- [TC39: The TC39 process](https://tc39.es/process-document/)
- [TC39 proposals repository](https://github.com/tc39/proposals)
- [web.dev: Baseline](https://web.dev/baseline)

### Implement array methods

Writing the built-ins yourself shows that there is no magic in them, and forces you to notice details of their contracts that you normally skip.

```js
function map(array, fn, thisArg) {
  const result = new Array(array.length);
  for (let i = 0; i < array.length; i++) {
    if (i in array) result[i] = fn.call(thisArg, array[i], i, array);   // skip holes
  }
  return result;
}

function reduce(array, fn, ...rest) {
  let i = 0;
  let acc;
  if (rest.length > 0) {
    acc = rest[0];
  } else {
    while (i < array.length && !(i in array)) i++;
    if (i >= array.length) throw new TypeError('Reduce of empty array with no initial value');
    acc = array[i++];
  }
  for (; i < array.length; i++) {
    if (i in array) acc = fn(acc, array[i], i, array);
  }
  return acc;
}

function flat(array, depth = 1) {
  const result = [];
  for (const item of array) {
    if (Array.isArray(item) && depth > 0) result.push(...flat(item, depth - 1));
    else result.push(item);
  }
  return result;
}
```

`filter` follows the pattern of `map`, pushing the element when the callback's result is truthy.

What to get right:

- **Callback arguments.** The callback receives `(value, index, array)`, and `reduce` passes `(accumulator, value, index, array)`.
- **`thisArg`.** `map` and `filter` take an optional second argument used as `this` for the callback.
- **No mutation.** Return a new array and leave the input alone.
- **The initial value in `reduce`.** You must distinguish "no initial value was passed" from "`undefined` was passed", which is why the code uses a rest parameter and checks its length. With no initial value, the first element becomes the accumulator and iteration starts at the second. With an empty array and no initial value, throw a `TypeError`.
- **Sparse arrays.** The real methods skip holes (`i in array` is false) but preserve them in `map`'s output. `flat` removes holes; the version above, which uses `for...of`, turns them into `undefined`, which is a difference you should be able to explain.
- **Length is read once** at the start in the real methods, so elements appended during iteration are not visited.
- **`flat` depth.** The default is 1, and `Infinity` flattens fully. A recursive version can overflow the stack on extremely deep nesting; an iterative version with an explicit stack avoids that.

Write them as stand-alone functions, as here. Do not add them to `Array.prototype`.

**Try it:** Implement all four without looking at the code above. For each, write tests that run the same inputs through your version and the built-in and assert deep equality. Include: an empty array, a sparse array (`[1, , 3]`), a callback that uses the index, `reduce` with and without an initial value, and `flat` with depths 0, 2, and `Infinity`.

**Resources**
- [ECMAScript specification: Array.prototype.map](https://tc39.es/ecma262/#sec-array.prototype.map)
- [MDN: Array.prototype.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
- [MDN: Array.prototype.flat()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat)

### Implement utilities

These five small functions come up constantly in interviews and in real code. Each one exercises a core idea: closures, recursion, references, and `this`.

**`debounce` and `throttle`** are covered in their own entry. The essentials are a timer held in a closure, and forwarding `this` and the arguments.

**`deepEqual(a, b)`** compares structure and not identity:

```js
function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (a instanceof Date) return a.getTime() === b.getTime();
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]));
}
```

Decisions to make and state: `Object.is` makes `NaN` equal to itself; comparing prototypes stops `[]` from equalling `{}`; and comparing key counts alone is not enough, as `{ a: undefined }` and `{ b: 1 }` show, hence the `hasOwn` check. Extensions are `Map`, `Set`, and cyclic structures, which need a record of the pairs already being compared.

**`memoize(fn)`** caches results by argument:

```js
function memoize(fn, keyOf = (...args) => args[0]) {
  const cache = new Map();
  return function memoized(...args) {
    const key = keyOf(...args);
    if (!cache.has(key)) cache.set(key, fn.apply(this, args));
    return cache.get(key);
  };
}
```

Use `has` and not a truthiness test, so that cached falsy results count. The hard part is the key. `JSON.stringify(args)` is a common choice, but it fails for functions, cycles, and differing key order, and it is slow. Other concerns: the cache grows without limit, memoising only makes sense for pure functions, and a memoised async function caches rejections too unless you evict them.

**Event emitter:**

```js
function createEmitter() {
  const listeners = new Map();
  return {
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type)?.delete(fn);     // unsubscribe
    },
    once(type, fn) {
      const off = this.on(type, (...args) => { off(); fn(...args); });
      return off;
    },
    emit(type, ...args) {
      for (const fn of [...(listeners.get(type) ?? [])]) fn(...args);
    },
  };
}
```

A `Map` of `Set`s gives fast add and remove, and ignores duplicate registrations. `emit` iterates over a *copy*, so that a listener which unsubscribes itself, or adds another listener, during the emit does not disturb the loop. Returning an unsubscribe function is more convenient than a separate `off` that needs the original reference. Decide what happens when a listener throws: here it stops the remaining listeners.

**Try it:** Implement all five in one file with tests using `node:test`. For `deepEqual`, include `NaN`, nested arrays, `{ a: undefined }` against `{}`, and dates. For the emitter, test a `once` listener, and a listener that unsubscribes during `emit`. For `memoize`, assert that the underlying function is called only once for repeated arguments, including when the result is `0`.

**Resources**
- [Node.js: Test runner](https://nodejs.org/api/test.html)
- [MDN: EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)
- [Lodash documentation: memoize](https://lodash.com/docs/#memoize)

### Implement `Promise.all`

This exercise checks whether you really understand promises: creation, settling once, ordering, and the handling of values that are not promises.

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const results = [];
    let pending = 0;
    let index = 0;

    for (const item of iterable) {
      const i = index++;                    // capture this item's position
      pending++;
      Promise.resolve(item).then((value) => {
        results[i] = value;
        if (--pending === 0) resolve(results);
      }, reject);
    }

    if (index === 0) resolve(results);      // empty input
  });
}
```

The requirements, and how the code meets each:

1. **It returns a promise at once.** Everything happens inside one `new Promise`.
2. **It accepts any iterable,** not only arrays, so it uses `for...of` and counts as it goes, without relying on `.length`.
3. **It accepts non-promises.** `Promise.resolve(item)` wraps plain values and thenables, and passes real promises through.
4. **Results are in input order, not completion order.** Each callback writes to its own index `i`. Pushing to the array would order by completion, which is the most common mistake.
5. **It fulfils only when all have fulfilled.** A counter tracks what is outstanding. Do not test `results.length`: assigning to `results[2]` first makes the length 3 while two results are still missing.
6. **It rejects as soon as any input rejects.** Passing `reject` as the rejection handler does this. A promise settles only once, so later rejections and the eventual `resolve` are ignored, and no extra flag is needed.
7. **An empty iterable fulfils with `[]`.** Without the final check, the promise would stay pending for ever.

Two subtle points. First, why is it safe to test `pending === 0` inside the callbacks while the loop may still be adding items? Because `then` callbacks always run asynchronously, as microtasks, the whole loop finishes before the first of them runs. Second, if the iterable itself throws during iteration, the throw happens inside the executor, and the constructor turns it into a rejection.

Note what the function does not do: it does not cancel the other operations on rejection, and it does not limit concurrency. Those are properties of the native method too.

Once this works, the other combinators are variations. `allSettled` never rejects, and records `{ status, value }` or `{ status, reason }` in both handlers. `race` passes `resolve` and `reject` straight to each input. `any` inverts `all`: it resolves on the first fulfilment, and collects the rejection reasons into an `AggregateError`.

**Try it:** Write `promiseAll` from a blank file, then test it against the native method with: an empty array, a mix of values and promises, promises that fulfil in reverse order (check the result order), one rejection among slow fulfilments (check that it rejects before the slow ones finish), and a `Set` as input. Then implement `promiseAllSettled` and `promiseAny`.

**Resources**
- [MDN: Promise.all()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- [ECMAScript specification: Promise.all](https://tc39.es/ecma262/#sec-promise.all)
- [javascript.info: Promise API](https://javascript.info/promise-api)

### Solve 30 small problems

Reading about a language gives you recognition. Fluency, the ability to produce correct code without looking things up, comes only from solving many small problems. Thirty is enough to make the core methods and patterns automatic.

How to make the practice count:

1. **Use no framework and no libraries.** Use only the language and its standard library. Run solutions with Node.
2. **Write the tests first.** List the cases, including empty input, a single element, duplicates, negative numbers, and Unicode strings, as `node:test` tests, before you write the solution. Exercism gives you a test suite for each exercise, which you run locally.
3. **Time-box.** Give yourself twenty to thirty minutes. If you are stuck, read a hint or one solution, close it, and write your own from scratch the next day.
4. **Solve it, then improve it.** Get a working version first. Then ask: is there a built-in that does this? Can a `Map` or `Set` remove a nested loop? Is the input mutated? What is the time complexity?
5. **Read other people's solutions** once you have passed. This is where you pick up idioms. Exercism's community solutions and optional mentoring, and Codewars' solution lists, are good for it. Be wary of the "clever" one-liners that are voted to the top; prefer the clear ones.
6. **Keep a log** of what each problem taught you, in a line or two. Redo the ones that you found hard, two weeks later, without notes.

Aim for a spread of topics and not thirty string puzzles:

- Strings: reversing by grapheme, anagrams, counting words, parsing a simple format.
- Arrays: grouping, chunking, removing duplicates, flattening, two-pointer problems.
- Objects and Maps: frequency counts, inverting a mapping, deep merge.
- Recursion: tree traversal, permutations, nested structures.
- Closures and higher-order functions: `once`, `curry`, `pipe`, a rate limiter.
- Asynchrony: retry with backoff, a concurrency-limited map, a timeout wrapper.
- Dates and numbers: formatting durations, rounding money.

On difficulty: on Codewars, stay around 7 to 5 kyu, and on Exercism follow the track's order. Puzzles that depend on a mathematical trick teach you less JavaScript than plain data-manipulation tasks do.

**Try it:** Today, set up a folder with `package.json` containing `"type": "module"` and a `test` script that runs `node --test`. Solve one problem with tests first, commit it, and write one sentence about what you learnt. Do one a day for thirty days.

**Resources**
- [Exercism: JavaScript track](https://exercism.org/tracks/javascript)
- [Node.js: Test runner](https://nodejs.org/api/test.html)
- [Codewars documentation: JavaScript](https://docs.codewars.com/languages/javascript/)
