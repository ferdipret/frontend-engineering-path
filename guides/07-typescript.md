# TypeScript: Guide

## Toolkit

### DevTools and tooling

The compiler is your main tool, and it changed shape recently. TypeScript 6.0 (March 2026) switched the defaults to `strict: true`, `module: esnext`, and `types: []`, and deprecated the legacy options. TypeScript 7.0 (July 2026) is the native Go port: same language, same `tsc` command, roughly ten times faster. Tools that embed the compiler still run on the 6.0 API for now; the entry on The native compiler has the details.

- **`tsc --noEmit`** is the type check. Bundlers such as Vite strip types without checking them, so this command (in a script and in CI) is the only thing that proves the program type-checks. `tsc --noEmit --watch` in a terminal gives project-wide errors while the editor only shows open files.
- **`tsc --showConfig`** prints the resolved configuration after `extends`. Use it whenever an option seems to be ignored.
- **The TypeScript Playground** is the fastest place to isolate a type problem. Write `// ^?` under an identifier to print its type inline, switch compiler versions, toggle flags in the TS Config menu, and share the URL in a bug report.
- **Editor**: hover shows a type, and Ctrl/Cmd-hover or "Go to Type Definition" jumps to it. "Go to Definition" on a library import opens its `.d.ts`. In VS Code run "TypeScript: Select TypeScript Version" and use the workspace version so the editor and CI agree.
- **typescript-eslint** with typed linting catches what the compiler will not, such as floating promises (see Typed linting).
- **Pretty TypeScript Errors** (VS Code extension) formats long errors into readable, syntax-highlighted types.
- **Are the Types Wrong?** checks whether a published package's types resolve correctly under each module resolution mode.
- **Node** 22.18 and later run `.ts` files directly by stripping erasable syntax, which is handy for scripts. It does not type-check either.

### Testing and verifying your work

"Done" for TypeScript work means three things: `tsc --noEmit` passes under the strictest configuration the project claims to use, the types reject what they should reject, and nothing untyped leaks in at the boundaries.

Test the negative cases. A type that accepts everything also passes the compiler. Put `// @ts-expect-error` above a line that must not compile; if the line later becomes valid, the directive itself becomes an error, so the test cannot silently rot. For positive assertions use Vitest's `expectTypeOf` (or the `expect-type` package), which runs as part of `vitest --typecheck`:

```ts
import { expectTypeOf, test } from 'vitest';

test('getUser returns a parsed User', () => {
  expectTypeOf(getUser).returns.resolves.toEqualTypeOf<User>();
  // @ts-expect-error id must be a UserId, not a plain string
  getUser('abc');
});
```

Hunt for `any`. Hover values that come out of `JSON.parse`, `response.json()`, `catch` clauses in old configs, and third-party callbacks. Turn on the `@typescript-eslint/no-unsafe-*` rules so that `any` cannot flow into typed code unnoticed. Search the codebase for `as `, `!`, and `@ts-ignore` during review: each is a place where a human overrode the checker, and each needs a reason.

Verify the runtime agrees with the types. Types are erased, so a typed API response is a claim until a schema has parsed it. Write an ordinary unit test that feeds malformed data into your boundary function and asserts it throws or returns an error result.

Finally, check the configuration itself: `tsc --showConfig` to confirm `strict` and `noUncheckedIndexedAccess` are really on, and `tsc --listFilesOnly` to confirm the files you think are checked are in the program.

### Tricks and gotchas

- Types do not exist at runtime. `as User` checks nothing, `interface` emits nothing, and a `fetch` response typed as `User` is whatever the server sent.
- Annotate function parameters and exported return types; let everything else be inferred. An explicit return type turns "error at 14 call sites" into "error at the one line that is wrong".
- Prefer `satisfies` to a type annotation when you want checking but also want to keep the precise inferred type.
- `// ^?` in the Playground and a temporary `type Debug = typeof x` in the editor are the quickest ways to see what the compiler thinks.
- Wrap a type in `type Prettify<T> = { [K in keyof T]: T[K] } & {}` to make a hover show the flattened object instead of `A & B & Omit<C, 'x'>`.
- `Omit` and `Pick` do not distribute over unions; they collapse a discriminated union into one object type. Write `type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never`.
- `Object.keys(obj)` returns `string[]` on purpose, because an object may have more keys than its type says. Do not "fix" it with a cast unless you created the object yourself.
- Excess property checks only apply to object literals written directly at the assignment. Pass the same object through a variable and extra keys are allowed.
- Narrowing does not survive into callbacks for `let` variables or for mutable properties, because the compiler cannot know when the callback runs. Copy the value into a `const` first.
- Use `// @ts-expect-error` with a comment, never `// @ts-ignore`.
- `skipLibCheck: true` is normal; it skips checking `.d.ts` files, not your code.
- When an error message is 40 lines long, read the last few lines first. The bottom is the specific property that failed; the top is just the path to it.
- `{}` as a type means "anything except `null` and `undefined`", not "empty object". Use `Record<string, never>` or `object` depending on intent.

### Official references

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html): the canonical language guide; read "Everyday Types" through "Type Manipulation" in order.
- [TSConfig Reference](https://www.typescriptlang.org/tsconfig/): every compiler option with its default, related flags, and the version it shipped in.
- [TypeScript Playground](https://www.typescriptlang.org/play/): in-browser compiler with version and flag switching and shareable links.
- [TypeScript release notes](https://www.typescriptlang.org/docs/handbook/release-notes/overview.html): the authoritative description of each feature, usually clearer than the handbook for newer syntax.
- [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/): the new defaults and the list of deprecated options.
- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/): the native compiler, what was removed, and what still needs the 6.0 compatibility package.
- [Handbook: Modules reference and guides](https://www.typescriptlang.org/docs/handbook/modules/introduction.html): how `module` and `moduleResolution` really work.
- [typescript-eslint](https://typescript-eslint.io/getting-started/): linting that understands types, with rule-by-rule documentation.
- [TypeScript wiki: Performance](https://github.com/microsoft/TypeScript/wiki/Performance): the team's own guidance on writing fast-to-check code and diagnosing slow builds.
- [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped): the source of every `@types/*` package.

## Skills

### Why types

A static type system checks, before the code runs, that every value is used in a way consistent with its declared or inferred shape. In practice it catches misspelled properties, wrong argument order, forgotten `null` handling, calling something that is not a function, a missing `case` when a new variant is added, and the fallout of a rename or refactor across hundreds of files. It is also the engine behind autocomplete, go-to-definition, and safe rename, which matter as much day to day as the errors.

What it cannot do is just as important. Types are erased at compile time, so TypeScript knows nothing about values that arrive at runtime: API responses, `localStorage`, URL parameters, form input, `postMessage` data. It does not check logic (`a - b` where you meant `a + b`), ordering, timing, or performance. And it is deliberately unsound in places for convenience: `any`, type assertions, array index access without `noUncheckedIndexedAccess`, and covariant mutable arrays all let wrong programs compile.

```ts
type User = { id: string; name: string };
const user = (await res.json()) as User; // compiles whatever the server returned
user.name.toUpperCase();                 // can still throw at runtime
```

The mental model: types are a proof about the code you wrote, under the assumptions you gave. The assumptions at the edges of the program are yours to verify with runtime validation, and behaviour is still verified with tests.

**Try it:** Take a small JavaScript file you wrote, rename it to `.ts`, and paste it into the Playground with strict mode on. Sort every error into "real bug", "missing null check", or "the compiler needs more information". Then write down one bug in that file that no type could ever catch.

**Resources**
- [TypeScript Handbook: The Basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)
- [TypeScript for the New Programmer](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)

### Basic annotations

An annotation is `: Type` after a binding. The primitives are `string`, `number`, `boolean`, `bigint`, `symbol`, `null`, and `undefined`, always lowercase. `String`, `Number`, and `Object` are the wrapper object types and are almost never what you want.

```ts
const tags: string[] = [];                  // same as Array<string>
const point: [x: number, y: number] = [0, 0]; // tuple: fixed length, per-index types
const frozen: readonly string[] = ['a'];    // no push, no index assignment

type User = {
  id: string;
  name: string;
  email?: string;            // optional
  readonly createdAt: Date;  // cannot be reassigned
};

function greet(user: User, greeting = 'Hello'): string {
  return `${greeting}, ${user.name}`;
}

type Comparator<T> = (a: T, b: T) => number; // function type
```

Details that trip people up. A tuple is still an array at runtime, so `point.push(1)` type-checks unless the tuple is `readonly`. `readonly` is shallow and compile-time only. A function returning nothing useful is `void`, and a callback typed as returning `void` may return a value that is then ignored, which is why `arr.forEach(x => list.push(x))` is fine. Use `object` for "any non-primitive" and `Record<string, unknown>` for "an object with unknown keys"; avoid `Object` and `{}`. An index signature such as `{ [key: string]: number }` claims every string key exists, which is a lie unless you enable `noUncheckedIndexedAccess`. Rest parameters are typed as arrays (`...ids: string[]`), and destructured parameters are annotated after the whole pattern: `({ id, name }: User)`.

**Try it:** In the Playground, type a function `formatPrice(amount, currency, options)` where `options` has an optional `locale` and a `readonly` `fractionDigits`. Then call it wrongly in four different ways (wrong order, missing argument, extra property, assigning to the readonly field) and read each error.

**Resources**
- [TypeScript Handbook: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [TypeScript Handbook: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript Handbook: More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)

### Inference

TypeScript infers a type for every expression, so most annotations are redundant. `const n = 1` is `1`, `let n = 1` is `number`, a function's return type comes from its `return` statements, and a callback's parameters are typed from the place it is passed (contextual typing). Redundant annotations add noise and, worse, can widen a precise type into a vaguer one.

```ts
const sizes = ['sm', 'md', 'lg'];          // string[]  (widened: arrays are mutable)
const config = { mode: 'dark' };           // { mode: string }
const lengths = sizes.map((s) => s.length); // s: string from context, result number[]
```

Widening is the rule to learn: a literal assigned to a mutable location (`let`, an object property, an array element) becomes its general type, because you might reassign it. `const` bindings of primitives keep the literal.

Annotate at boundaries, where the type is a decision and not a consequence:

- Function parameters. They cannot be inferred from the body.
- Return types of exported functions. Inference would work, but an explicit type keeps errors local to the function, stops accidental API changes, and speeds up checking.
- Empty collections and deferred initialisation: `const items: Item[] = []`, `let timer: number | undefined`.
- Data entering from outside, after validation.

The classic mistake is `const [state, setState] = useState(null)` or `const cache = {}`: inference only sees the initial value, so you get `null` or `{}` forever. Give the type argument or annotation there. The opposite mistake is annotating a callback parameter that context already types, which silently hides a mismatch when the surrounding API changes.

**Try it:** Open a file you wrote and delete every annotation on a local variable. Hover each variable to confirm the inferred type is the same or more precise. Restore only the ones where the hover got worse, and note why.

**Resources**
- [TypeScript Handbook: Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [TypeScript Handbook: Everyday Types, literal inference](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-inference)

### `interface` vs `type`

Both can describe an object shape, and for that job they are nearly interchangeable. The differences are at the edges.

A `type` alias can name anything: unions, tuples, primitives, function types, mapped and conditional types. An `interface` can only describe an object (or function/constructor) shape, but it has two abilities aliases lack. It is open: two declarations with the same name merge, which is how you augment `Window` or a library's types. And `extends` checks compatibility at the declaration, reporting a conflict where an intersection would quietly produce `never` for the clashing property.

```ts
interface Animal { name: string }
interface Dog extends Animal { name: number } // error: incompatible property 'name'

type Cat = Animal & { name: number };         // no error; Cat['name'] is never

type Result = { ok: true } | { ok: false; error: string }; // only a type alias can do this
```

Other real differences: interfaces are cached by name and are cheaper for the checker than large intersections, and they display by name in error messages. A type alias for an object literal has an implicit index signature, so it is assignable to `Record<string, unknown>`; an interface is not, which occasionally surprises people passing an interface-typed value to a function expecting a record.

Declaration merging is also a hazard: an interface named `Request` or `Event` in a script file silently merges with the global one.

Pick one convention and enforce it with the `@typescript-eslint/consistent-type-definitions` rule. Two defensible choices: "`type` everywhere, `interface` only when you need merging", or "`interface` for object shapes, `type` for everything else". Mixing by mood is the only wrong answer.

**Try it:** In the Playground, reproduce the `Dog`/`Cat` example and hover `Cat['name']`. Then declare `interface Window { myApp: { version: string } }` in a file and confirm `window.myApp.version` type-checks, to see merging at work.

**Resources**
- [TypeScript Handbook: Differences between type aliases and interfaces](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)
- [TypeScript Handbook: Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [typescript-eslint: consistent-type-definitions](https://typescript-eslint.io/rules/consistent-type-definitions/)

### Unions and literal types

A literal type is a type with exactly one value: `'left'`, `42`, `true`. A union `A | B` is a value that is one of its members. Together they let a type say precisely which values are allowed, where `string` says almost nothing.

```ts
type Align = 'left' | 'center' | 'right';
type Status = 200 | 404 | 500;

function setAlign(align: Align) {}
setAlign('centre'); // error, with a "did you mean 'center'?" suggestion
```

With a union you can only use what every member has in common until you narrow. `string | number` has `toString()` but not `toUpperCase()`. That restriction is the feature: it forces you to handle each case.

The widening trap is the most common first obstacle:

```ts
const options = { align: 'left' };
setAlign(options.align); // error: string is not assignable to Align
```

`options.align` was inferred as `string` because properties are mutable. Fix it at the source with `as const`, a type annotation on `options`, or `satisfies`.

Two more things to know. `boolean` is itself the union `true | false`, which is why discriminating on a boolean field works. And unions of object types behave as "at least one of these shapes", so a value with properties from several members can be assignable; when members must be mutually exclusive, give them a shared discriminant property (see Discriminated unions). For "any string, but suggest these", the idiom `'sm' | 'md' | (string & {})` keeps autocomplete for the literals while accepting other strings.

Prefer unions of literals to booleans when there are, or might be, more than two states: `variant: 'primary' | 'ghost'` ages better than `isPrimary: boolean`.

**Try it:** Type a `Button` props object with `size`, `variant`, and `type` as literal unions. Build the props in a separate `const` and pass it to a function. Fix the widening error three ways (`as const`, annotation, `satisfies`) and compare the resulting hover types.

**Resources**
- [TypeScript Handbook: Union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [TypeScript Handbook: Literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

### Narrowing

Narrowing is the compiler following your runtime checks and refining a variable's type along each branch. It is control-flow analysis: after an `if` that returns, the rest of the function sees the remaining type.

```ts
function describe(value: string | string[] | Date | null) {
  if (value === null) return 'nothing';        // equality
  if (typeof value === 'string') return value; // typeof
  if (value instanceof Date) return value.toISOString(); // instanceof
  return value.join(', ');                     // only string[] is left
}

type Circle = { kind: 'circle'; radius: number };
type Rect = { width: number; height: number };
function area(shape: Circle | Rect) {
  return 'radius' in shape ? Math.PI * shape.radius ** 2 : shape.width * shape.height; // in
}
```

Other narrowing forms: truthiness (`if (x)`), `Array.isArray`, comparing a discriminant property, user-defined type guards, and assignment.

The traps:

- `typeof null === 'object'`, so a `typeof x === 'object'` check leaves `null` in the type.
- Truthiness removes `''`, `0`, and `NaN` as well as `null`. Use `x != null` when zero or the empty string is valid.
- Narrowing of a `let` variable or an object property is discarded inside a callback, because the value could change before the callback runs. Assign to a `const` first.
- Narrowing applies to a specific reference such as `obj.a.b`, and is reset when any part of that path is assigned. The compiler does not reset it when you call a function that might mutate the object, so a narrowed property can be stale; copy it into a local `const` when that matters.
- Storing a check in a `const` works: `const isStr = typeof x === 'string'; if (isStr) { ... }` narrows `x`, provided `x` is `const` or a `readonly` property or an unmodified parameter.

Since TypeScript 5.5, a function whose body is a simple narrowing expression is inferred as a type predicate, so `items.filter((x) => x !== undefined)` now returns the narrowed array type without a hand-written guard.

**Try it:** Write `function len(x: string | string[] | null | undefined): number` using only narrowing, with no assertions. Then move part of the body into a `setTimeout` callback with `x` reassigned as a `let` and observe where narrowing is lost.

**Resources**
- [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript 5.5 release notes: Inferred type predicates](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html)

### `any`, `unknown`, `never`

These are the three special types at the edges of the type lattice.

`any` switches the checker off for that value. It is assignable to everything and everything is assignable to it, and it spreads: a property of `any` is `any`, the result of calling it is `any`. One `any` from `JSON.parse` can silently untype a whole call chain.

`unknown` is the safe counterpart. Anything can be assigned to it, but you can do nothing with it until you narrow or validate. That makes it the right type for data whose shape you have not verified: parsed JSON, `catch` variables (the default under `strict`), message event data, values from storage.

```ts
function parse(json: string): unknown {
  return JSON.parse(json); // contain the any at the source
}

const data = parse(input);
if (typeof data === 'object' && data !== null && 'id' in data) {
  data.id; // unknown, but access is now allowed
}
```

`never` is the empty type: no value has it. It is the return type of a function that always throws or loops forever, the type left after every union member has been narrowed away, and the result of an impossible intersection such as `string & number`. Because nothing is assignable to `never`, it gives you exhaustiveness checking:

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
```

Call it in the `default` branch of a `switch`; adding a new union member turns that call into a compile error.

Mistakes to avoid: using `any` to silence an error you do not understand (use `unknown` and narrow, or `// @ts-expect-error` with a reason), typing a `catch` variable's properties without checking `instanceof Error`, and forgetting that `any` also arrives implicitly from untyped libraries. The `@typescript-eslint/no-unsafe-*` rules flag `any` flowing into typed code.

**Try it:** Write `safeJsonParse(text: string): unknown`, then a function that takes its result and returns the `message` string if the value is an object with a string `message`, else `undefined`. No `any`, no `as`.

**Resources**
- [TypeScript Handbook: The `unknown`, `never`, and `any` types](https://www.typescriptlang.org/docs/handbook/2/functions.html#other-types-to-know-about)
- [TypeScript Handbook: Exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
- [typescript-eslint: no-unsafe-assignment](https://typescript-eslint.io/rules/no-unsafe-assignment/)

### Optional and nullable

With `strictNullChecks` (part of `strict`, and on by default since TypeScript 6.0), `null` and `undefined` are their own types and are not assignable to anything else. A value that may be absent must say so, and you must handle the absence before using it.

```ts
type User = {
  name: string;
  nickname?: string;        // may be missing: string | undefined when read
  deletedAt: Date | null;   // always present, possibly null
};

const label = user.nickname?.trim() ?? user.name; // optional chaining + nullish coalescing
```

`?` on a property means the key may be absent. `prop: T | undefined` means the key is required but may hold `undefined`. By default TypeScript blurs the two; `exactOptionalPropertyTypes` makes `{ nickname: undefined }` an error for an optional property, which matters for code that uses `'nickname' in obj` or spreads objects over defaults.

Use `??` and not `||` for defaults, since `||` also replaces `0`, `''`, and `false`. Choose one convention for "no value": many codebases use `undefined` everywhere internally and only accept `null` at API boundaries.

The non-null assertion `value!` tells the compiler "this is not null" and emits nothing. If you are wrong, you get the exact runtime crash the flag exists to prevent, with no hint in the code that the claim was unchecked. Prefer, in order:

1. Restructure so the value cannot be absent (make it a required parameter, initialise it earlier).
2. Narrow with a real check and handle the missing case.
3. Throw with a message: `if (!el) throw new Error('#app not found')`.

`!` is acceptable in tests and where an invariant is truly local and obvious. Enable `@typescript-eslint/no-non-null-assertion` and justify each exception. Remember that `Map.get`, `Array.find`, `querySelector`, and regex matches all return a possibly absent value by design.

**Try it:** Find every `!` in a project. For each, replace it with a check that throws a descriptive error or handles the case. Count how many were hiding a state that can really happen.

**Resources**
- [TypeScript Handbook: `null` and `undefined`](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#null-and-undefined)
- [TSConfig: exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes)
- [typescript-eslint: no-non-null-assertion](https://typescript-eslint.io/rules/no-non-null-assertion/)

### Structural typing

TypeScript compares types by shape, not by name. A value is assignable to a type if it has at least the required members with compatible types. Names of interfaces and classes are irrelevant, and so is where the value came from.

```ts
type Point = { x: number; y: number };
const p3 = { x: 1, y: 2, z: 3 };
const p: Point = p3; // OK: extra properties are fine

class Cat { name = 'Tom' }
class Robot { name = 'R2' }
const c: Cat = new Robot(); // OK: same shape
```

This means an object type is a minimum, not an exact description. `Object.keys(p)` may return `'z'`, which is why it is typed `string[]`, and why iterating keys of a typed object and indexing back in needs care.

The exception that confuses everyone is the **excess property check**. When you assign an object literal directly to a typed target, unknown properties are an error:

```ts
const q: Point = { x: 1, y: 2, z: 3 }; // error: 'z' does not exist in type 'Point'
```

This is a lint-like check for typos on fresh literals, not a change to assignability. Route the same object through a variable and it passes. It is most valuable for optional properties, where `{ colour: 'red' }` passed to `{ color?: string }` would otherwise be silently accepted.

A related rule, the weak type check, rejects assigning a value that shares no properties with a type whose properties are all optional.

Consequences to keep in mind: two types meant to be different but shaped the same (`UserId` and `OrderId` both `string`) are interchangeable (see Branded types); private or protected class members make a class behave nominally; and functions are compared structurally too, so a function with fewer parameters is assignable to a type with more, which is why `arr.map(fn)` works with a one-argument `fn`.

**Try it:** Write a function taking `{ color?: string; width?: number }`. Call it with a misspelled key as a literal, then via a variable. Explain the difference in one sentence, then make the variable case fail using `satisfies`.

**Resources**
- [TypeScript Handbook: Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [TypeScript Handbook: Excess property checks](https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks)

### Generics

A generic is a type parameter: a placeholder filled in at each use, so a function or type can relate its inputs to its outputs without knowing the concrete type. Without generics you choose between duplication and `any`.

```ts
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}
const n = first([1, 2, 3]); // T inferred as number

function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}
pluck(users, 'email'); // string[]; 'emial' would be an error

type ApiResponse<TData = unknown, TError = Error> =
  | { ok: true; data: TData }
  | { ok: false; error: TError };
```

A constraint (`K extends keyof T`) limits what a parameter can be and lets the body use what the constraint guarantees. A default (`TData = unknown`) applies when no argument is given or inferred.

Guidelines that separate good generics from noise:

- A type parameter should appear at least twice, linking two positions. `function log<T>(x: T): void` is just `(x: unknown) => void` with extra steps.
- Let call sites infer. If callers must write `fn<Foo>()` with no argument of that type, the generic is an unchecked assertion in disguise (`get<User>('/users/1')` verifies nothing).
- Inside the body, `T` is opaque. You cannot return a concrete `{ id: 1 }` as `T`, because the caller may have chosen a more specific subtype.
- Use the fewest parameters possible, and push them down: take `T` and derive `T[K]` instead of adding a third parameter.
- `const` type parameters (`<const T>`) infer literals as if the caller wrote `as const`, and `NoInfer<T>` stops a position from contributing inference candidates.

In `.tsx` files an arrow function generic needs a constraint or trailing comma (`<T,>(x: T) => x`) so it is not parsed as JSX.

**Try it:** Write `groupBy<T, K extends PropertyKey>(items: readonly T[], getKey: (item: T) => K): Record<K, T[]>`. Call it with a callback returning a literal union and check the result's key type. Then try to break it with a wrong callback.

**Resources**
- [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Handbook: Guidelines for writing good generic functions](https://www.typescriptlang.org/docs/handbook/2/functions.html#guidelines-for-writing-good-generic-functions)

### Discriminated unions

A discriminated union is a union of object types that share one property with a distinct literal type in each member. Checking that property narrows the whole object. It is the most useful modelling tool in the language, because it lets you make impossible states unrepresentable.

Compare a "bag of optionals":

```ts
type State = { loading: boolean; data?: User; error?: Error };
// allows { loading: true, data, error } and { loading: false } with neither
```

with:

```ts
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };

function render(state: State): string {
  switch (state.status) {
    case 'idle': return '';
    case 'loading': return 'Loading…';
    case 'success': return state.data.name; // data exists only here
    case 'error': return state.error.message;
    default: return assertNever(state);     // compile error if a case is missing
  }
}
```

`data` is only reachable after you prove the status is `'success'`. Adding a fifth state makes every non-exhaustive `switch` fail to compile, which is exactly the refactoring help you want. If you prefer no `default`, the `@typescript-eslint/switch-exhaustiveness-check` rule does the same job.

The same shape fits API results (`{ ok: true; data } | { ok: false; error }`), reducer actions, form steps, and WebSocket messages.

Pitfalls. The discriminant must be a literal type (string, number, boolean, `null`/`undefined`), not `string`. You can only destructure properties that every member has, and when you do (`const { type, payload } = action`), checking `type` narrows `payload` only if both came from the same `const` destructuring; with `let`, or after copying fields one at a time, the link is lost. The simplest habit is to check the discriminant on the object itself. And `Omit<State, 'x'>` or `Pick` collapses the union into a single object type; use a distributive version. Keep the discriminant name consistent across the codebase (`type`, `kind`, or `status`).

**Try it:** Model a file upload as a union: idle, selected (file), uploading (file, progress), done (url), failed (file, error). Write a `reducer` and a `label(state)` function with an exhaustive switch. Add a `cancelled` state and follow the compiler errors.

**Resources**
- [TypeScript Handbook: Discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [typescript-eslint: switch-exhaustiveness-check](https://typescript-eslint.io/rules/switch-exhaustiveness-check/)

### Utility types

The built-in utility types are ordinary mapped and conditional types shipped in the standard library. Their value is deriving one type from another so there is a single source of truth.

```ts
type User = { id: string; name: string; email: string; avatarUrl?: string };

type UserPatch = Partial<Omit<User, 'id'>>;      // every field optional, no id
type UserPreview = Pick<User, 'id' | 'name'>;
type Complete = Required<User>;                   // avatarUrl now required
type ById = Record<User['id'], User>;             // { [id: string]: User }

async function loadUser(id: string) { return { id, name: 'Ada' }; }
type Loaded = Awaited<ReturnType<typeof loadUser>>; // { id: string; name: string }
type Args = Parameters<typeof loadUser>;            // [id: string]
```

What each really does:

- `Partial<T>` / `Required<T>` add or remove `?` on every property, one level deep only.
- `Pick<T, K>` checks that `K` is a key of `T`. `Omit<T, K>` does not: `Omit<User, 'emial'>` compiles and omits nothing. Neither distributes over unions.
- `Record<K, V>` with a literal union for `K` requires every key, which makes it a good exhaustive lookup table. With `string` it claims every key exists.
- `ReturnType<F>` and `Parameters<F>` take a function *type*, so you need `typeof fn` for a function value. On overloaded functions they see only the last overload.
- `Awaited<T>` recursively unwraps promises, matching what `await` does.

Also worth knowing: `Readonly<T>`, `NonNullable<T>`, `Extract<T, U>` and `Exclude<T, U>` for filtering unions, and `NoInfer<T>`.

The judgment call: derive when the types are truly the same concept (a form's values and its patch), and declare separately when they only happen to coincide today. Deriving a public API type from an internal database row couples them forever. And prefer `ReturnType<typeof fn>` only for functions you do not own; for your own, name the return type and annotate the function with it.

**Try it:** Without looking them up, implement `MyPartial`, `MyPick`, `MyRecord`, and `MyReturnType` in the Playground, then open `lib.es5.d.ts` via "Go to Definition" on the real ones and compare.

**Resources**
- [TypeScript Handbook: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Handbook: Creating Types from Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

### `keyof`, `typeof`, indexed access

These three operators let you compute types from things that already exist, instead of writing the same information twice.

`keyof T` is the union of `T`'s known keys. The type-level `typeof value` gives the static type of a variable or property (it is unrelated to the runtime `typeof`, which returns a string). `T[K]` looks up the type of a property, and `K` can be a union.

```ts
const breakpoints = { sm: 640, md: 768, lg: 1024 } as const;

type Breakpoints = typeof breakpoints;        // { readonly sm: 640; ... }
type BreakpointName = keyof Breakpoints;      // 'sm' | 'md' | 'lg'
type BreakpointPx = Breakpoints[BreakpointName]; // 640 | 768 | 1024

const roles = ['admin', 'editor', 'viewer'] as const;
type Role = (typeof roles)[number];           // 'admin' | 'editor' | 'viewer'

type ApiUser = { id: string; address: { city: string; zip: string } };
type City = ApiUser['address']['city'];       // string
```

The pattern is "value first, type derived": write the runtime object or array once, mark it `as const`, and derive the union. The array stays available for validation, select options, and iteration, and the type can never drift from it.

Details that matter:

- `keyof` of a type with a string index signature is `string | number`, because numeric keys are valid on such objects.
- `keyof (A | B)` is only the keys common to both; `keyof (A & B)` is all keys.
- `T[number]` is the element type of an array or tuple; `T['length']` of a tuple is a literal number.
- `typeof` only works on identifiers and property paths, not on arbitrary expressions. Use `ReturnType<typeof fn>` for a call result.
- `keyof typeof obj` is the idiom for "the keys of this object value"; forgetting `typeof` gives the error "refers to a value, but is being used as a type".

**Try it:** Define a `const icons = { ... } as const` map of icon names to SVG paths. Derive `IconName`, write `getIcon(name: IconName)`, and build a typed list of all names for a picker using `Object.keys` plus one narrow, well-commented assertion. Add an icon and confirm nothing else needs editing.

**Resources**
- [TypeScript Handbook: Keyof Type Operator](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
- [TypeScript Handbook: Typeof Type Operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)
- [TypeScript Handbook: Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

### `as const` and `satisfies`

`as const` is a const assertion. It tells inference not to widen: string and number literals keep their literal types, object properties become `readonly`, and arrays become `readonly` tuples. It changes nothing at runtime and it is not `Object.freeze`.

`satisfies` checks that an expression is assignable to a type without changing the expression's inferred type. An annotation, by contrast, replaces the inferred type with the annotated one.

```ts
type Route = { path: string; auth?: boolean };

const annotated: Record<string, Route> = { home: { path: '/' } };
annotated.hme; // no error: any string key is allowed, and the key names are lost

const routes = {
  home: { path: '/' },
  account: { path: '/account', auth: true },
} satisfies Record<string, Route>;

routes.hme;            // error: property does not exist
type RouteName = keyof typeof routes; // 'home' | 'account'
```

Combine them when you want validation and literal precision: `{ ... } as const satisfies Record<string, Route>`. The order matters; `as const` applies to the literal and `satisfies` then checks the readonly result, so the target type may need `readonly` members to accept it.

When to use which:

- Annotation (`const x: T = ...`): you want the variable to *be* `T`, wide and stable, such as a mutable state variable.
- `satisfies`: you want the precise type but want typos and missing keys caught at the definition. Configuration objects, lookup tables, theme tokens, route maps.
- `as const`: you want literal types to derive unions from.
- `as T`: you are overriding the checker. It allows downcasts that may be false, and it is the one of the four that can hide a bug.

A common mistake is `as const` on a value typed by annotation (`const x: string[] = [...] as const`), which is an error or has no useful effect because the annotation wins.

**Try it:** Create a `theme` object with colour tokens. Type it three ways (annotation with `Record<string, string>`, `satisfies`, `as const satisfies`) and for each, hover `theme.primary` and try `theme.primry`. Write down which combination gives both the error and the literal.

**Resources**
- [TypeScript 4.9 release notes: The `satisfies` operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [TypeScript 3.4 release notes: `const` assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html)

### Type guards

When built-in narrowing cannot express a check, you write a function that performs the check at runtime and tells the compiler what it proves. There are two forms.

A **type predicate** returns a boolean and narrows in the branch where it is true:

```ts
type User = { id: string; name: string };

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' && value !== null &&
    'id' in value && typeof value.id === 'string' &&
    'name' in value && typeof value.name === 'string'
  );
}
```

An **assertion function** throws if the check fails and narrows for the rest of the scope:

```ts
function assert(condition: unknown, message = 'Assertion failed'): asserts condition {
  if (!condition) throw new Error(message);
}

function assertIsUser(value: unknown): asserts value is User {
  if (!isUser(value)) throw new TypeError('Not a User');
}

const el = document.querySelector('#app');
assert(el instanceof HTMLElement, '#app missing');
el.dataset.ready = 'true'; // el: HTMLElement from here on
```

The critical point: the compiler does not verify that the body matches the signature. `value is User` is a promise you make. A guard that checks `id` but forgets `name`, or one that was right before `User` gained a field, is a lie the type system now trusts everywhere. Keep guards small, test them with bad inputs, and for anything beyond a couple of fields generate the guard from a schema (see Runtime validation) so the check and the type cannot diverge.

Other details. Since TypeScript 5.5, simple guards such as `(x) => x !== null` are inferred as predicates automatically. Assertion functions must be called through an explicitly typed name; a `const assert = (...) => {}` arrow without a type annotation on the variable produces an error at the call site. A predicate's "false" branch narrows too: if `isString(x)` is false, `x` loses `string`, so a predicate that returns false for some strings is also wrong.

**Try it:** Write `isNonEmptyArray<T>(xs: readonly T[]): xs is readonly [T, ...T[]]` and use it so that `xs[0]` is `T` (not `T | undefined`) under `noUncheckedIndexedAccess`. Then deliberately break the body and notice that the compiler says nothing.

**Resources**
- [TypeScript Handbook: Using type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [TypeScript 3.7 release notes: Assertion functions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html)

### Function overloads

Overloads declare several call signatures for one implementation, so the return type can depend on which arguments were passed.

```ts
function createElement(tag: 'img'): HTMLImageElement;
function createElement(tag: 'input'): HTMLInputElement;
function createElement(tag: string): HTMLElement;
function createElement(tag: string): HTMLElement {
  return document.createElement(tag);
}

const input = createElement('input'); // HTMLInputElement
```

Rules that are easy to get wrong:

- The implementation signature is not callable from outside. Only the overload signatures above it are visible, and the implementation must be compatible with all of them.
- Overloads are tried top to bottom and the first match wins, so list specific signatures before general ones.
- The body is checked only against the implementation signature. Nothing verifies that you return an `HTMLInputElement` for `'input'`; overloads are an unchecked claim, like a type assertion.
- A caller holding a union cannot call an overloaded function: `createElement(tag as 'img' | 'input')` fails because no single overload accepts the union.

That last point is why a union is often the better choice. If the return type does not depend on the argument type, write one signature:

```ts
// Unnecessary overloads
function len(x: string): number;
function len(x: unknown[]): number;

// Better
function len(x: string | unknown[]): number { return x.length; }
```

When the return type does depend on the input, consider the alternatives before overloads: a generic with indexed access (`<K extends keyof Map>(key: K): Map[K]`, which also accepts unions and scales to many cases), or separate, well-named functions (`getOne` / `getMany`), which are usually clearer than a flag that changes the return type. Overloads earn their place for a small number of distinct call shapes, especially different argument counts, as in the DOM's own `addEventListener`.

**Try it:** Write an overloaded `parse(input: string): number` / `parse(input: string[]): number[]`. Call it with a `string | string[]` variable and read the error. Rewrite it with a generic conditional return type, then decide which version you would want to maintain.

**Resources**
- [TypeScript Handbook: Function overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)
- [TypeScript Handbook: Do's and Don'ts, overloads and unions](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### Enums vs unions

An `enum` is one of the few TypeScript features that emits runtime code. It creates a real object, and for numeric enums also a reverse mapping from value to name.

```ts
enum Direction { Up, Down }          // { 0: 'Up', 1: 'Down', Up: 0, Down: 1 }
enum Status { Active = 'active' }    // string enum: no reverse mapping
```

The trade-offs against a literal union:

- Enums are nominal-ish. `Status.Active` is not interchangeable with the string `'active'`, so data from an API must be converted or cast, and two enums with the same values are incompatible.
- They are not erasable syntax. Tools that only strip types (Node's built-in TypeScript support, and any setup using `erasableSyntaxOnly`) reject them. `const enum` is worse: it is inlined across files, which conflicts with `isolatedModules` and single-file transpilers.
- Numeric enums invite off-by-one persistence bugs when someone inserts a member in the middle.
- In their favour: a single named object to import, refactoring by member name, and doc comments on each member.

A literal union has no runtime footprint and matches JSON directly:

```ts
type Status = 'active' | 'archived';
```

When you also need the values at runtime (for a `<select>`, validation, or iteration), use an `as const` object and derive the type. You get the enum ergonomics with plain JavaScript:

```ts
export const Status = { Active: 'active', Archived: 'archived' } as const;
export type Status = (typeof Status)[keyof typeof Status]; // 'active' | 'archived'

Status.Active;                 // value
const s: Status = 'archived';  // plain strings are accepted
Object.values(Status);         // iterate
```

Declaring the type and the value with the same name is legal because they live in separate namespaces. The reasonable convention for new code: literal unions by default, `as const` objects when you need runtime values, and enums only when you are matching an existing codebase that uses them.

**Try it:** In the Playground, write a numeric enum, a string enum, a `const enum`, and an `as const` object, and compare the emitted JavaScript in the JS tab. Then turn on `erasableSyntaxOnly` in the TS Config menu and see which ones are rejected.

**Resources**
- [TypeScript Handbook: Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
- [TypeScript Handbook: Objects vs enums](https://www.typescriptlang.org/docs/handbook/enums.html#objects-vs-enums)
- [TSConfig: erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly)

### Typing the DOM and events

The `dom` lib describes the browser's API as a class hierarchy: `EventTarget` → `Node` → `Element` → `HTMLElement` → `HTMLInputElement` and friends. Most DOM typing problems are about getting from a general type to the specific one safely.

```ts
const input = document.querySelector('input');          // HTMLInputElement | null (tag name is known)
const el = document.querySelector('.search');           // Element | null
const cast = document.querySelector<HTMLInputElement>('.search'); // an unchecked claim

const field = document.querySelector('.search');
if (!(field instanceof HTMLInputElement)) throw new Error('.search input missing');
field.value; // checked at runtime, narrowed at compile time
```

The generic on `querySelector` is an assertion, not a check. It is fine when you control the markup, but `instanceof` is the honest version and handles `null` at the same time. Remember `querySelector` always may return `null`, and `querySelectorAll` returns a `NodeListOf<T>`, which has `forEach` but is not an array.

Events: `addEventListener` picks the event type from the name, so the callback parameter needs no annotation.

```ts
form.addEventListener('submit', (event) => {   // SubmitEvent
  event.preventDefault();
  const data = new FormData(form);              // use the element you attached the listener to
});

list.addEventListener('keydown', (event) => {  // KeyboardEvent
  if (!(event.target instanceof HTMLElement)) return;
  const item = event.target.closest('li');
});
```

`event.target` is typed `EventTarget | null` because the event may have been dispatched on any descendant, so narrow it with `instanceof`; do not cast it. `event.currentTarget` is always the element the listener is attached to at runtime, but the DOM typings also declare it as `EventTarget | null`, so in plain DOM code use the variable you called `addEventListener` on. (React's event types do type `currentTarget` as the element, which is why `e.currentTarget.value` works there and `e.target.value` may not.)

When you extract a handler into a named function you must annotate it yourself (`(event: KeyboardEvent) => void`). For custom events, add them to the event map by augmenting `HTMLElementEventMap` so `addEventListener('cart:add', ...)` infers `CustomEvent<CartItem>`. In React the equivalents are `React.ChangeEvent<HTMLInputElement>` and friends, which wrap the same DOM types.

**Try it:** Build a typed helper `qs<T extends Element>(selector: string, ctor: new () => T, root: ParentNode = document): T` that throws a descriptive error if the element is missing or of the wrong class. Use it to wire a form with input, select, and submit handling without a single `as`.

**Resources**
- [TypeScript Handbook: DOM Manipulation](https://www.typescriptlang.org/docs/handbook/dom-manipulation.html)
- [MDN: Document.querySelector()](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)
- [MDN: Event.currentTarget](https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget)

### Mapped types

A mapped type builds an object type by iterating over a union of keys, the type-level equivalent of `Object.fromEntries(keys.map(...))`.

```ts
type Flags<T> = { [K in keyof T]: boolean };

type Mutable<T> = { -readonly [K in keyof T]: T[K] };   // remove readonly
type Concrete<T> = { [K in keyof T]-?: T[K] };          // remove optional
type Nullable<T> = { [K in keyof T]: T[K] | null };
```

`+` and `-` prefixes add or remove the `readonly` and `?` modifiers. When you map over `keyof T` directly (a *homomorphic* mapped type), the original modifiers are preserved by default, which is why `Partial<T>` keeps `readonly` properties readonly. Mapping over some other union of keys starts with no modifiers.

The `as` clause remaps keys. Mapping a key to `never` drops it, which gives you filtering:

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
// Getters<{ name: string }>  ->  { getName: () => string }

type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
// PickByValue<{ id: number; name: string; age: number }, number> -> { id: number; age: number }
```

`string & K` is needed because `keyof T` may include `number` and `symbol` keys, and template literal types accept only string-like types.

Things to know. Mapped types over arrays and tuples map the elements and keep the array shape, so `Flags<[string, number]>` is `[boolean, boolean]`. A mapped type is shallow; a recursive `DeepPartial` must special-case functions, arrays, `Date`, and `Map`, and is easy to get subtly wrong (prefer a maintained library such as type-fest). A mapped type cannot declare extra properties alongside the mapping; intersect with another object type instead. And when a hover shows an unreadable mapped type, a `Prettify` wrapper forces the compiler to display the expanded result.

**Try it:** Write `FormErrors<T>` mapping each field of a form values type to `string | undefined`, then `Setters<T>` producing `setName(value: string): void`-style methods using key remapping. Apply both to a three-field type and check the hovers.

**Resources**
- [TypeScript Handbook: Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [type-fest: a collection of essential TypeScript types](https://github.com/sindresorhus/type-fest)

### Conditional types

A conditional type is a type-level ternary: `T extends U ? X : Y` picks `X` when `T` is assignable to `U`. Its power comes from two extra behaviours.

`infer` declares a type variable inside the `extends` clause and captures whatever matches at that position:

```ts
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
type ElementA = ElementOf<string[]>;                // string

type MyReturnType<F> = F extends (...args: never[]) => infer R ? R : never;
type FirstArg<F> = F extends (first: infer A, ...rest: never[]) => unknown ? A : never;
```

**Distributivity**: when the checked type is a bare type parameter and you pass a union, the conditional is applied to each member separately and the results are unioned. That is how `Exclude` works:

```ts
type MyExclude<T, U> = T extends U ? never : T;
type A = MyExclude<'a' | 'b' | 'c', 'a'>; // 'b' | 'c'

type ToArray<T> = T extends unknown ? T[] : never;
type B = ToArray<string | number>;        // string[] | number[]
```

To turn distribution off, wrap both sides in a tuple so the parameter is no longer bare:

```ts
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;
type C = ToArrayNonDist<string | number>; // (string | number)[]
```

The edge cases that cause real confusion:

- `never` is the empty union, so a distributive conditional given `never` returns `never` without evaluating either branch. `type IsNever<T> = [T] extends [never] ? true : false` needs the tuple wrapper.
- `boolean` distributes as `true | false`.
- `any` in the checked position yields the union of both branches.
- Inside a generic function body, a conditional type on an unresolved `T` is deferred; the compiler will not let you return a concrete value for it, which is why implementations of conditional-return functions usually need an assertion.

Conditional types can recurse (as in `Awaited`), with a depth limit that produces "Type instantiation is excessively deep" when exceeded.

**Try it:** Implement `UnwrapPromise<T>`, `Flatten<T>` (one array level), and `IsUnion<T>` in the Playground. For `IsUnion`, you will need to use distributivity and the tuple trick together; verify with `string`, `string | number`, and `never`.

**Resources**
- [TypeScript Handbook: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript Handbook: Distributive conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)

### Template literal types

Template literal types use template-string syntax at the type level. Interpolating a union produces every combination, and `infer` inside a template parses strings.

```ts
type Side = 'top' | 'right' | 'bottom' | 'left';
type MarginProp = `margin-${Side}`;            // 4 members
type Shade = 100 | 500 | 900;
type Token = `${'gray' | 'blue'}-${Shade}`;    // 6 members

type CssLength = `${number}px` | `${number}rem`;
const gap: CssLength = '1.5rem';

type EventName<K extends string> = `on${Capitalize<K>}`; // 'onClick' for 'click'
```

The intrinsic helpers `Uppercase`, `Lowercase`, `Capitalize`, and `Uncapitalize` transform string literal types. Combined with mapped type key remapping, they produce typed getters, event handler props, and CSS variable names.

Parsing with `infer` extracts parts of a string, which is how routers type path parameters:

```ts
type PathParams<P extends string> =
  P extends `${string}:${infer Param}/${infer Rest}` ? Param | PathParams<`/${Rest}`> :
  P extends `${string}:${infer Param}` ? Param :
  never;

type Params = PathParams<'/users/:userId/posts/:postId'>; // 'userId' | 'postId'
```

Limits and judgment:

- Combinations multiply. Three unions of 30 members is 27,000 strings; the compiler caps unions at 100,000 members and slows down long before that.
- `${number}` matches any string that converts to a finite number, including `'1e3'` and `'0x10'`; it is a loose check, not a validator.
- `${string}` patterns give no autocomplete, and the errors when a string does not match are unhelpful.
- You cannot express "any string except these" or real grammars. Complex formats such as emails, URLs, and dates belong in runtime validation.

Use template literal types where the set is small and derivable (design tokens, event names, `data-*` attributes, route params), and stop when the type starts to look like a regex engine.

**Try it:** Type a `t(key)` translation function whose keys are derived from a nested messages object as dot paths (`'nav.home' | 'nav.about' | 'footer.legal'`). Write the recursive `DotPaths<T>` type and check autocomplete works. Note how the hover and check time change as you add depth.

**Resources**
- [TypeScript Handbook: Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [TypeScript 4.1 release notes: Template literal types and key remapping](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html)

### Variance

Variance describes how assignability of a generic type follows assignability of its type argument. Given that `Dog` is assignable to `Animal`:

- **Covariant**: `Box<Dog>` is assignable to `Box<Animal>`. True for positions where `T` is only produced (return types, readonly properties).
- **Contravariant**: the direction flips. True for positions where `T` is only consumed (function parameters).
- **Invariant**: neither direction. True where `T` is both read and written.
- **Bivariant**: both directions, which is unsound.

Function parameters are the special case. A function that handles any `Animal` can stand in for a function that handles `Dog`s, but not the other way round:

```ts
type Animal = { name: string };
type Dog = Animal & { bark(): void };
type Handler<T> = (value: T) => void;

declare let onAnimal: Handler<Animal>;
declare let onDog: Handler<Dog>;

onDog = onAnimal;  // OK: it only needs name
onAnimal = onDog;  // error under strictFunctionTypes: it may call bark() on a cat
```

`strictFunctionTypes` (part of `strict`) enforces this for function-typed properties and function type aliases. It deliberately does not apply to members declared with *method syntax*, which stay bivariant, largely so that `Array<Dog>` remains assignable to `Array<Animal>`:

```ts
interface A { handle(value: Dog): void }      // method: bivariant, unsound
interface B { handle: (value: Dog) => void }  // property: checked contravariantly
```

Prefer the property form for callbacks in your own types. The same compromise makes mutable arrays covariant, so this compiles and breaks at runtime: assign a `Dog[]` to an `Animal[]` variable, push a cat, and the original array now holds a non-dog. Accepting `readonly T[]` in parameters removes the hazard.

Variance explains many confusing errors: why `(e: MouseEvent) => void` is rejected where `(e: Event) => void` is expected, and why a React `Dispatch<SetStateAction<Dog>>` is not assignable to one for `Animal`. You can annotate variance explicitly with `in` and `out` on type parameters (`interface Source<out T>`), mainly as documentation and a performance aid.

**Try it:** Reproduce the unsound array example and make it crash at runtime in the Playground. Then change the parameter to `readonly Animal[]` and see which line now fails to compile. Repeat the method-versus-property comparison with `strictFunctionTypes` toggled.

**Resources**
- [TSConfig: strictFunctionTypes](https://www.typescriptlang.org/tsconfig/#strictFunctionTypes)
- [TypeScript Handbook: Variance annotations](https://www.typescriptlang.org/docs/handbook/2/generics.html#variance-annotations)
- [TypeScript FAQ: Why are function parameters bivariant?](https://github.com/microsoft/TypeScript/wiki/FAQ#why-are-function-parameters-bivariant)

### Branded types

Structural typing means every `string` is the same type, so nothing stops you passing an order ID where a user ID is expected, or raw user input where sanitised HTML is required. A brand adds a phantom property that exists only in the type system, making otherwise identical types incompatible.

```ts
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;

function getUser(id: UserId) {}

declare const orderId: OrderId;
getUser(orderId);   // error: 'OrderId' is not assignable to 'UserId'
getUser('abc');     // error: plain string is not a UserId
```

At runtime a `UserId` is just a string: it works in template literals, as a `Map` key, and in `JSON.stringify`. The `unique symbol` key cannot be written by accident and does not show in autocomplete, unlike a `__brand` string property.

The value of a brand comes from controlling how one is created. Make a single function the only place that asserts:

```ts
function toUserId(value: string): UserId {
  if (!/^usr_[a-z0-9]{12}$/.test(value)) throw new TypeError(`Invalid user id: ${value}`);
  return value as UserId; // the one sanctioned assertion
}
```

Now holding a `UserId` is proof the validation ran. This "parse, don't validate" idea extends to `Email`, `PositiveInt`, `SanitizedHtml`, `Cents` versus `Dollars`, and absolute versus relative URLs. Schema libraries support it directly (Zod's `.brand()`), so parsing an API response yields branded IDs with no manual casting.

Costs to weigh: every literal in tests needs the constructor, brands are lost when you do arithmetic or string operations (a `Cents + Cents` is a `number`), and a brand that anyone can create with `as` anywhere is theatre. Use brands for identifiers and units that are really confused in your codebase, not for every string.

**Try it:** Brand `Cents` and `Dollars` over `number`, write `toCents(d: Dollars): Cents` and `addCents(a: Cents, b: Cents): Cents`, and try to pass dollars to `addCents`. Then add a lint rule or a grep check that the brand assertion appears in exactly one file.

**Resources**
- [TypeScript Handbook: `unique symbol`](https://www.typescriptlang.org/docs/handbook/symbols.html#unique-symbol)
- [Zod: Branded types](https://zod.dev/api#branded-types)
- [TypeScript Playground example: Nominal typing](https://www.typescriptlang.org/play/?#example/nominal-typing)

### Reading complex types

Library types and their errors look hostile, but they are read with a repeatable method.

For an **error message**: it is a chain, each line indented further, explaining why the line above failed. Read from the bottom. The last lines name the specific property or parameter and the two types that do not match; the top lines are the path that led there.

```text
Argument of type '{ onChange: (v: number) => void; }' is not assignable to parameter of type 'Props'.
  Types of property 'onChange' are incompatible.
    Type '(v: number) => void' is not assignable to type '(v: string) => void'.
      Types of parameters 'v' and 'v' are incompatible.
        Type 'string' is not assignable to type 'number'.
```

The bottom line is the fact; note that parameter errors read "backwards" because parameters are contravariant. For "No overload matches this call", the compiler lists each overload's failure, and the last one listed is usually the closest match.

For a **definition**: use "Go to Type Definition", then decode in order.

1. Read the type parameters and their constraints: these are the inputs.
2. Find the outermost operator: is it a conditional, a mapped type, an intersection?
3. Substitute a concrete type by hand, or better, do it for real: write `type Test = TheirType<MyConcreteType>` and hover.
4. Peel layers: alias each sub-expression (`type Step1 = ...`) and hover each one.

Tools that help: a `Prettify<T>` wrapper to expand intersections in hovers, the `noErrorTruncation` compiler option to stop `...` elision, the Pretty TypeScript Errors extension, and the Playground's `// ^?` queries when preparing a minimal reproduction.

Common patterns to recognise on sight: `T extends infer U ? ... : never` (force evaluation or distribution), `[T] extends [never]` (test for `never`), `K extends keyof T ? T[K] : never` (safe lookup), `(...args: any[]) => any` (any function), and `{} & T` or `T & {}` (strip `null`/`undefined`, or block literal widening).

**Try it:** Pick a library you use (a router, a form library, a query library). Trigger a type error on purpose, then find the exact line of its `.d.ts` responsible. Explain the type in three sentences, using a `type Test = ...` alias to verify each claim.

**Resources**
- [TypeScript Handbook: Understanding errors](https://www.typescriptlang.org/docs/handbook/2/understanding-errors.html)
- [TSConfig: noErrorTruncation](https://www.typescriptlang.org/tsconfig/#noErrorTruncation)
- [Pretty TypeScript Errors (VS Code extension)](https://github.com/yoavbls/pretty-ts-errors)

### Type-level restraint

TypeScript's type system is Turing-complete, and people have written SQL parsers and chess engines in it. That you can is not a reason to. Every type has costs paid by someone other than its author.

- **Readability.** A colleague must understand the type to change the code. A 30-line recursive conditional type is code with no debugger, no logging, and no unit test runner by default.
- **Error quality.** Clever types fail with errors about `never`, deferred conditionals, or "excessively deep" instantiation, far from the user's actual mistake.
- **Compile and editor speed.** Deep recursion, large template-literal unions, and big distributive conditionals are the usual causes of a sluggish editor.
- **Fragility.** Types that depend on inference details can break on a compiler upgrade.

A useful test: does this type prevent a bug that would plausibly happen, at a call site used often enough to matter? Types on a widely used library API (a router's path params, a query builder) pay back the complexity across thousands of call sites. The same machinery on an internal helper called twice does not.

Cheaper alternatives to reach for first:

- Write the two or three concrete types out by hand. Duplication in types is often fine.
- Use a discriminated union instead of a conditional return type.
- Use two functions instead of one function with overloads and flags.
- Generate types from a schema (OpenAPI, GraphQL, Zod) instead of computing them.
- Accept a slightly wider type and validate at runtime.
- Put one well-commented assertion inside a small, tested function, and keep its signature simple and honest.

When a complex type is justified, treat it like code: name the intermediate steps, comment the intent with an example input and output, add type tests with `expectTypeOf` and `@ts-expect-error`, and keep it in one module. If you cannot explain a type to a teammate in a minute, simplify it.

**Try it:** Find the most complex type in a codebase you work on (or in a library you use). Write down what bug it prevents, then write the simplest alternative that prevents most of the same bugs. Compare error messages for a wrong call under both versions.

**Resources**
- [TypeScript wiki: Performance, writing easy-to-compile code](https://github.com/microsoft/TypeScript/wiki/Performance#writing-easy-to-compile-code)
- [TypeScript Handbook: Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### `tsconfig.json`

`tsconfig.json` defines which files are in the program and how they are checked and emitted. Since TypeScript 6.0 the defaults are modern (`strict: true`, `module: esnext`, a recent `target`, `types: []`), and TypeScript 7.0 removed the legacy values (`moduleResolution: node`/`classic`, `baseUrl`, `target: es5`, AMD/UMD/System output). Still, state the important options explicitly so the file documents intent. A typical bundled web app:

```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["es2023", "dom"],
    "module": "preserve",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

What the key options mean:

- `strict` enables the whole strict family: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `useUnknownInCatchVariables`, and more. Non-negotiable for new code.
- `target` sets which syntax is downlevelled and the default `lib`. It does not polyfill anything; `lib` only tells the checker which APIs to assume exist. When a bundler does the transpiling, `target` mostly affects `lib`.
- `module` is the output module format; `moduleResolution` is how import specifiers are found. Use `bundler` (with `module: preserve` or `esnext`) for code that goes through Vite or another bundler, and `nodenext` for code Node runs directly or for published libraries, which then requires file extensions in relative imports.
- `noUncheckedIndexedAccess` adds `undefined` to `array[i]` and index-signature lookups. It is not part of `strict` and catches real bugs.
- `verbatimModuleSyntax` requires `import type` for type-only imports so single-file transpilers can drop them safely.
- `types` lists global type packages to load. With the `[]` default you must name them (`"node"`, `"vite/client"`, `"vitest/globals"`); imports of `@types` packages still resolve without being listed.
- `skipLibCheck` skips checking `.d.ts` files.

Run `tsc --showConfig` to see the effective result, and split configs (app, Node scripts, tests) when environments differ so that `document` is not available in your build script.

**Try it:** Create a small project with `tsc --init`, then toggle `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` one at a time on existing code and read the new errors. Run `tsc --showConfig` before and after extending a shared base config.

**Resources**
- [TSConfig Reference](https://www.typescriptlang.org/tsconfig/)
- [TypeScript Handbook: Choosing compiler options (modules)](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html)
- [Announcing TypeScript 6.0: new defaults and deprecations](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)

### Declaration files

A `.d.ts` file contains types with no implementation. It is how TypeScript knows about code it did not compile: the standard library (`lib.dom.d.ts`), packages written in JavaScript, and non-code imports.

Where types come from, in order of preference: bundled with the package (the `types` field or `exports` condition in its `package.json`), a separate `@types/name` package from DefinitelyTyped, or a declaration you write. Imports of a package automatically pick up its `@types` counterpart. Global, ambient types are different: since TypeScript 6.0 `types` defaults to `[]`, so packages that add globals (`@types/node`, test globals, `vite/client`) must be listed in `types` explicitly.

Writing your own covers three cases.

An untyped module or asset import:

```ts
// src/types/untyped-lib.d.ts
declare module 'untyped-lib' {
  export function parse(input: string): unknown;
}
declare module '*.svg' {
  const url: string;
  export default url;
}
```

Augmenting a module that already has types, by merging into its interfaces:

```ts
// src/types/env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
```

Augmenting the global scope from within a module:

```ts
export {}; // makes this file a module
declare global {
  interface Window { analytics?: { track(event: string): void } }
  interface HTMLElementEventMap { 'cart:add': CustomEvent<{ sku: string }> }
}
```

The rule that causes most confusion: a file with a top-level `import` or `export` is a module, and its declarations are local unless wrapped in `declare global` or `declare module`. A file without them is a script, and everything in it is global. Mixing these up produces "augmentation not applied" or accidental global pollution.

Other pitfalls: the `.d.ts` must be matched by `include`; a shorthand `declare module 'x';` types everything as `any`; and a declaration is an unverified claim about the JavaScript, so keep hand-written ones minimal. For libraries, generate declarations with `declaration: true` and verify the published package with Are the Types Wrong.

**Try it:** Add a typed `window.appConfig` global and a typed `*.md` import to a project via one `.d.ts` file. Then break it on purpose by adding a top-level `import` without `declare global`, and read what the compiler says.

**Resources**
- [TypeScript Handbook: Declaration files introduction](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [TypeScript Handbook: Module augmentation and global augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)
- [Are the Types Wrong?](https://arethetypeswrong.github.io/)

### Typed linting

The compiler answers "is this program type-correct?". It does not flag code that is type-correct and still almost certainly a bug. typescript-eslint fills that gap, and its most valuable rules are the ones that ask the type checker about each expression, known as typed (or type-aware) linting.

```ts
async function save(): Promise<void> { /* … */ }

button.addEventListener('click', () => {
  save();                 // no-floating-promises: a rejection here is never handled
});

if (save()) { /* … */ }   // no-misused-promises: a Promise is always truthy
array.forEach(async (x) => { await send(x); }); // no-misused-promises: forEach ignores the promises
```

All three compile. The rules need types because whether `save()` is a problem depends on what it returns. Other rules worth knowing: `await-thenable` (awaiting a non-promise), the `no-unsafe-*` family (stops `any` flowing into typed code), `no-unnecessary-condition` (a check the types say can never fail, often a sign the types are wrong), `switch-exhaustiveness-check`, `no-unnecessary-type-assertion`, and `restrict-template-expressions` (no `[object Object]` in strings).

Setup with ESLint's flat config:

```js
// eslint.config.mjs
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig({
  files: ['**/*.{ts,tsx}'],
  extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
  languageOptions: { parserOptions: { projectService: true } },
});
```

`projectService: true` makes the parser find the nearest `tsconfig.json` for each file, the same way the editor does. `strictTypeChecked` and `stylisticTypeChecked` are stricter presets to grow into.

Practical points:

- Typed linting builds the whole program, so it is as slow as a type check. Run it in CI and in the editor; lint only staged files in pre-commit hooks.
- A file not covered by any tsconfig produces a parser error. Include it, or apply `tseslint.configs.disableTypeChecked` to config and script files.
- Mark a deliberately unawaited promise with `void save()` so the intent is explicit.
- When the linter reports `any`-related errors everywhere, the real fault is usually one untyped import or a tsconfig the linter is not seeing.
- typescript-eslint uses the compiler's programmatic API, so it currently runs on the TypeScript 6 API even in a project that builds with the native compiler (see The native compiler). Check its supported-versions note when upgrading.

**Try it:** Add `recommendedTypeChecked` to a project that only used the non-typed preset. Triage the first twenty reports into real bugs, missing types, and noise. For each `no-floating-promises` hit, decide between `await`, `.catch()`, and `void`, and say why.

**Resources**
- [typescript-eslint: Linting with type information](https://typescript-eslint.io/getting-started/typed-linting/)
- [typescript-eslint: no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises/)
- [typescript-eslint: Shared configs](https://typescript-eslint.io/users/configs/)

### Runtime validation

Types vanish at compile time, so every value crossing into your program from outside is `unknown` in truth, whatever you annotate it as. A schema library closes that gap: you describe the expected shape once as a runtime value, it checks real data against it, and the static type is inferred from the schema so the two cannot drift.

```ts
import * as z from 'zod';

const User = z.object({
  id: z.string(),
  email: z.email(),
  role: z.enum(['admin', 'member']),
  createdAt: z.coerce.date(),
});
type User = z.infer<typeof User>;

const result = User.safeParse(await response.json());
if (!result.success) {
  console.error(z.prettifyError(result.error));
} else {
  result.data.role; // 'admin' | 'member'
}
```

This is Zod 4 syntax, where string formats such as `z.email()` are top-level. `parse` throws on failure; `safeParse` returns a discriminated union. Valibot offers the same idea with a modular, tree-shakable API (`v.object`, `v.pipe`, `v.parse`), which gives much smaller bundles when you only use a few validators. Both implement Standard Schema, a shared interface that lets form libraries, routers, and tRPC accept any compliant validator.

Where to validate: at trust boundaries only. HTTP responses, form submissions, URL and search params, `localStorage`, `postMessage`, environment variables, and third-party callbacks. Inside the program, pass the parsed, typed value and do not re-validate.

Practical points:

- Schemas can transform, so input and output types differ. `z.input` and `z.output` name each side; `z.infer` is the output.
- By default `z.object` strips unknown keys. Use `z.strictObject` to reject them or `z.looseObject` to keep them.
- Be lenient about what you do not use and strict about what you do. A schema listing every field of a large response breaks your app when the API adds or loosens a field you never read.
- Decide the failure policy per boundary: throw, show a fallback, or report and continue.
- Validation costs CPU and bytes. Check bundle impact, and avoid re-parsing large lists on every render.

**Try it:** Take one `fetch` call in a project that currently uses `as SomeType`. Write a schema, derive the type with `z.infer`, delete the hand-written type, and add a unit test that feeds a response with a missing field and a wrong type.

**Resources**
- [Zod: Defining schemas](https://zod.dev/api)
- [Valibot: Introduction](https://valibot.dev/guides/introduction/)
- [Standard Schema](https://standardschema.dev/)

### Testing types

Types are part of a module's public interface, and they regress like any other code: a refactor widens a return type to `any`, a generic stops inferring, an invalid call starts compiling. Nothing fails at runtime, so ordinary tests stay green. A type test is an assertion checked by the compiler.

There are two tools, and you need both.

**`// @ts-expect-error`** asserts that the next line does *not* compile. If the line ever becomes valid, the directive itself is reported as unused, so the test fails. This is how you test that wrong usage is rejected.

**`expectTypeOf`** (built into Vitest, from the `expect-type` package) asserts what a type *is*:

```ts
// api.test-d.ts
import { expectTypeOf, test } from 'vitest';
import { request, User, type ApiResult } from './api';

test('request infers its result from the schema', () => {
  expectTypeOf(request('/users/1', User)).resolves.toEqualTypeOf<ApiResult<{ id: string; name: string }>>();
  expectTypeOf(request).parameter(0).toBeString();
  expectTypeOf<{ id: string; extra: number }>().toExtend<{ id: string }>();

  // @ts-expect-error a schema is required
  request('/users/1');
});
```

Run `vitest --typecheck`. By default files named `*.test-d.ts` are treated as type tests. Vitest does not execute them; it runs the compiler over them and reports the diagnostics as test results. That means nothing dynamic works in them (`test.each` is not expanded), and a type test proves nothing about runtime behaviour.

Details that matter:

- `toEqualTypeOf` is exact identity and tells `any` apart from everything else, which is the regression you most want to catch. `toExtend` checks assignability only.
- `@ts-expect-error` suppresses *any* error on the line, including a misspelled function name. Keep the line minimal and put only the one wrong thing on it, or the test passes for the wrong reason.
- You do not need a test runner. A `*.type-test.ts` file included in `tsc --noEmit` with `type Expect<T extends true> = T` and an `Equal<A, B>` helper, as type-challenges does, works anywhere.
- Test what users of the module rely on: inference at call sites, narrowing of result unions, and rejected misuse. Do not restate every declaration.
- For a published library, also test the built `.d.ts` files, because declaration emit can differ from the source types.

**Try it:** Write type tests for one generic function you own: two `expectTypeOf` assertions on inferred results and two `@ts-expect-error` lines for misuse. Then change the function's return type to `any` and confirm exactly which assertions catch it.

**Resources**
- [Vitest: Testing types](https://vitest.dev/guide/testing-types)
- [Vitest: expectTypeOf API](https://vitest.dev/api/expect-typeof)
- [expect-type on GitHub](https://github.com/mmkal/expect-type)

### End-to-end types

End-to-end type safety means the types the UI uses for server data are derived from the server's own definition, so a backend change breaks the frontend build and not production. There are three mainstream routes, chosen by what your API looks like.

**OpenAPI codegen**, for REST APIs with an OpenAPI document. `openapi-typescript` turns the document into a `paths` type with no runtime code, and `openapi-fetch` is a tiny typed `fetch` wrapper over it:

```ts
import createClient from 'openapi-fetch';
import type { paths } from './api/schema'; // generated: npx openapi-typescript ./openapi.yaml -o ./src/api/schema.d.ts

const client = createClient<paths>({ baseUrl: '/api' });
const { data, error } = await client.GET('/users/{id}', { params: { path: { id: '42' } } });
```

The path, parameters, and response type are all checked. This is language-agnostic on the server side.

**tRPC**, for a TypeScript server you control in the same repository. There is no schema file or generation step: the client imports the *type* of the server's router (`import type { AppRouter }`) and inference does the rest. Inputs are validated at runtime with your schema library. The cost is tight coupling between one client and one TypeScript server.

**GraphQL codegen**, for GraphQL APIs. GraphQL Code Generator reads the schema and your operations and emits a typed document for each query, so results are typed to exactly the fields you selected.

What to keep in mind whichever you pick:

- Generated types describe what the server promises, not what it sent. A deployed server can lag or lead the client, and specs can be wrong. Validate at runtime where correctness matters, or at least handle unexpected shapes gracefully.
- Generate in CI and fail on a diff (or do not commit generated files at all), so types cannot go stale.
- Use `import type` so no server code is bundled into the client.
- Types from a database row should not flow unfiltered to the UI; define the API contract deliberately.
- Version skew is real during deploys: make changes additive, then remove.

**Try it:** Take a public OpenAPI document (or write a ten-line one), run `openapi-typescript` on it, and make a request with `openapi-fetch`. Rename a field in the spec, regenerate, and watch the compile errors identify every affected call site.

**Resources**
- [OpenAPI TypeScript: Introduction](https://openapi-ts.dev/introduction)
- [tRPC: Concepts](https://trpc.io/docs/concepts)
- [GraphQL Code Generator: Getting started](https://the-guild.dev/graphql/codegen/docs/getting-started)

### Migrating a codebase

A migration succeeds when it is incremental, the build stays green throughout, and strictness only ever goes up. A big-bang rewrite branch conflicts with everyone's work and is rarely finished.

A workable sequence:

1. **Add the compiler alongside JavaScript.** Install `typescript`, add a `tsconfig.json` with `allowJs: true` and `noEmit: true`, and run `tsc --noEmit` in CI. Your bundler already handles `.ts`.
2. **Get free checking.** Turn on `checkJs` (or add `// @ts-check` per file). JSDoc annotations give real types in `.js` files without renaming anything.
3. **Type the boundaries first.** Install `@types/*` packages, write a `.d.ts` for globals, and define the core domain types and API response schemas. This gives the most leverage.
4. **Rename leaf-first.** Convert modules with no internal dependencies (utilities, constants), then work up the import graph. Each rename is a small, reviewable pull request. Do not refactor behaviour in the same change.
5. **Ratchet strictness.** Either start with `strict: false` and enable flags one at a time (`noImplicitAny`, then `strictNullChecks`), or go strict immediately and suppress existing errors with `// @ts-expect-error` comments that you burn down. The second approach guarantees all new code is strict from day one. Note that `strict` is on by default since TypeScript 6.0, so a loose start must be explicit.
6. **Prevent regression.** Lint against new `.js` files, `any`, and `@ts-ignore`; track the count of suppressions and make CI fail if it rises.

Practical advice. Prefer `unknown` plus a `// TODO` to `any` when you do not know a type yet. Expect `strictNullChecks` to surface real bugs; fix them, do not paper over with `!`. Do not chase perfect types for legacy modules scheduled for deletion. And keep the team moving: agree that every touched file leaves in better shape than it arrived, instead of freezing feature work.

**Try it:** On a small JavaScript project, add `allowJs` and `checkJs`, and read the errors without changing any file extension. Add JSDoc types to one module until it is clean, then rename it to `.ts` and compare how much more concise the same types become.

**Resources**
- [TypeScript Handbook: Migrating from JavaScript](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [TypeScript Handbook: JS projects utilizing TypeScript](https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html)
- [TypeScript Handbook: JSDoc reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

### Type-check performance

Slow type checking shows up as a laggy editor and long CI runs. TypeScript 7 made everything roughly ten times faster (see The native compiler), but expensive types still scale badly, so the diagnosis skills remain the same.

Measure first:

- `tsc --noEmit --extendedDiagnostics` prints file counts, type and instantiation counts, memory, and time per phase (parse, bind, check). Many files with little check time means you are including too much; high check time with a huge instantiation count means expensive types.
- `tsc --listFilesOnly` and `--explainFiles` show what is in the program and why. A stray `include` pulling in `dist`, `node_modules`, or generated output is the most common cause.
- `tsc --generateTrace <dir>` writes a trace you can open in a trace viewer or summarise with `@typescript/analyze-trace`, pointing at the files and expressions that take longest. Flag availability has shifted between the JavaScript and native compilers, so confirm with `tsc --help --all` for your version.

Then fix the cause:

- Narrow `include`, set `skipLibCheck`, and list `types` explicitly.
- Annotate return types of exported functions, especially those returning large inferred objects, so the checker does not re-derive them at every use.
- Prefer `interface extends` to large intersections; interfaces are cached and flattened.
- Break up giant unions (hundreds of members compared pairwise are quadratic) and deep recursive conditional or template literal types. Name intermediate types so they can be cached.
- Avoid barrel files that make every import load the whole package.

**Project references** split a repository into separately checked units. Each sub-project sets `composite: true`, emits declarations, and lists its dependencies in `references`; `tsc --build` then rebuilds only projects whose inputs changed and reads `.d.ts` output for the rest. This helps monorepos most. `isolatedDeclarations` goes further by requiring enough annotations that other tools can emit declarations per file without the checker. `incremental: true` gives single projects a cache between runs.

**Try it:** Run `tsc --noEmit --extendedDiagnostics` on a real project and record files, instantiations, and check time. Use `--explainFiles` to find one file that should not be there, remove it via `include`/`exclude`, and measure again.

**Resources**
- [TypeScript wiki: Performance](https://github.com/microsoft/TypeScript/wiki/Performance)
- [TypeScript Handbook: Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)

### The native compiler

TypeScript 7.0, released in July 2026, replaces the compiler written in TypeScript with a port written in Go. The language is the same; the port was made as faithfully as possible so that it reports the same errors. What changes is speed and the surrounding tooling.

What you get:

- **The same commands.** `npm install -D typescript` now installs the native compiler, and you still run `tsc`. During the preview it was a separate `@typescript/native-preview` package with a `tsgo` binary; you will still see that name in older articles.
- **Speed.** Full builds are typically 8 to 12 times faster, from native code plus shared-memory parallelism. `--checkers <n>` sets the number of type-checking workers (more is faster and uses more memory), `--builders <n>` parallelises project-reference builds, and `--singleThreaded` turns parallelism off for debugging or constrained CI machines.
- **A new language server** built on the Language Server Protocol, which is what makes large projects open quickly in the editor.

What breaks:

- **Removed options are hard errors.** Everything deprecated in 6.0 is gone: `target: es5`, `moduleResolution: node` and `classic`, `baseUrl`, AMD/UMD/System output, `downlevelIteration`, and turning off `esModuleInterop` or `alwaysStrict`. The `ignoreDeprecations: "6.0"` escape hatch does not work in 7.0.
- **Stable type ordering is always on**, so the order of union members in error messages and emitted declarations can differ from older output.
- **There is no programmatic API in 7.0.** Anything that imports `typescript` as a library cannot use the native compiler yet: typescript-eslint, tools built on the compiler API, and the template type-checkers for Vue, Svelte, Astro, MDX, and Angular. The team expects to ship the API in 7.1.

The bridge is the `@typescript/typescript6` package, which provides the 6.0 compiler and API (and a `tsc6` binary) side by side with 7. So a typical project today type-checks and builds with the native `tsc` while its linter and framework tooling run on the JavaScript-based compiler. The two can disagree in rare cases; when they do, reproduce with both binaries before filing a bug.

A sensible upgrade path: move to 6.0 first, fix every deprecation warning without `ignoreDeprecations`, set `rootDir` and `types` explicitly, then switch to 7 and compare the error output of `tsc` and `tsc6` in CI for a while. This area is moving quickly, so read the current release notes instead of trusting an article, including this one.

**Try it:** In a project on TypeScript 7, install `@typescript/typescript6` and time `npx tsc --noEmit` against `npx tsc6 --noEmit`. Then list every dev dependency that imports `typescript` (`npm ls typescript` helps) and note which compiler each one is actually using.

**Resources**
- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [Announcing TypeScript 6.0: deprecations to clear before upgrading](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
- [microsoft/typescript-go on GitHub](https://github.com/microsoft/typescript-go)

### Convert a project

This is the migration skill applied end to end on code you know well, which is the fastest way to learn where types help and where they fight you. Pick a vanilla JavaScript project of a few hundred to a couple of thousand lines with real DOM work and at least one network call.

Set a clear definition of done:

- Every source file is `.ts`; `allowJs` is off.
- `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` are on, and `tsc --noEmit` passes in CI.
- No `any` (explicit or implicit), no `@ts-ignore`, and each remaining `as` or `!` has a one-line comment justifying it.
- External data (fetch responses, `localStorage`, URL params) is parsed by a schema or a type guard, not asserted.
- Application state with distinct modes is a discriminated union.

Work in this order: tooling and config, then domain types in one module, then leaf utilities, then DOM code, then the entry point. Commit after each file so you can see the diff per step.

What you will run into. `querySelector` returns `Element | null`, so write a small typed query helper that throws when an element is missing. Event `target` needs `instanceof` narrowing. Objects built up incrementally (`const state = {}` followed by assignments) need to be created whole or given a type. Functions that return different shapes on different paths reveal themselves as unions you must handle. Index access under `noUncheckedIndexedAccess` forces you to consider empty arrays. Resist the temptation to refactor behaviour mid-conversion; note improvements and do them afterwards.

Keep a log of every runtime bug the compiler exposed. That list is the honest answer to "what did TypeScript buy me?", and it is good interview material.

**Try it:** Before starting, run the project with `// @ts-check` at the top of each file and count the errors. After the conversion, write a short retrospective: the bugs found, the three types you are proudest of, and the places where you chose an assertion and why.

**Resources**
- [TypeScript Handbook: Migrating from JavaScript](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [Vite: TypeScript features and configuration](https://vite.dev/guide/features.html#typescript)
- [typescript-eslint: Linting with type information](https://typescript-eslint.io/getting-started/typed-linting/)

### Type challenges

type-challenges is a collection of puzzles in which you implement a type (`Pick`, `DeepReadonly`, `TrimLeft`, `Permutation`) so that a set of type-level test cases compiles. It is deliberate practice for mapped types, conditional types, `infer`, recursion, and template literals: the vocabulary you need to read library types fluently.

How to get the most from it:

- Do them in the Playground links the repository provides, with the test cases visible. The tests use `Expect<Equal<A, B>>`; a red squiggle on a test means your type is wrong for that case.
- Work through all of **easy** first (reimplementations of built-ins such as `Pick`, `Readonly`, `Exclude`, `Awaited`, `Parameters`, plus tuple basics). These teach the five or six core moves.
- In **medium**, expect to learn recursion over tuples with `[infer Head, ...infer Tail]`, string parsing with template literal `infer`, distributive tricks, accumulator parameters, and counting with tuple lengths.
- Set a time limit of about 20 minutes per puzzle. When stuck, read one posted solution, close it, and reimplement from memory the next day. Explaining why a solution works is the goal, not collecting green ticks.
- Keep a personal cheat sheet of patterns: testing for `never`, checking for a union, converting a union to an intersection, iterating a string.

Keep perspective. These puzzles exercise the type system far beyond what application code should contain (see Type-level restraint). The skill transfer is in reading and debugging: after the medium set, a router's or ORM's type definitions stop looking like noise. The hard and extreme sets are optional; they are fun, and mostly irrelevant to daily work.

Understand `Equal` itself, since it is not obvious: it compares two types by checking that two generic function types are mutually assignable, which is stricter than `A extends B ? B extends A ? ...` and correctly distinguishes `any` from other types.

**Try it:** Solve `Pick`, `Readonly`, `First of Array`, `Exclude`, and `Awaited` from the easy set without help. For each, write one sentence naming the language feature that makes it work.

**Resources**
- [type-challenges on GitHub](https://github.com/type-challenges/type-challenges)
- [TypeScript Handbook: Creating Types from Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

### Typed API client

This project combines generics, discriminated unions, inference, and runtime validation into the piece of code every frontend has: the layer between `fetch` and the rest of the app. The goal is that callers get fully typed data with no assertions, and bad data is caught at the boundary.

A minimal core:

```ts
import * as z from 'zod';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { kind: 'network' | 'http' | 'parse'; status?: number; message: string } };

export async function request<S extends z.ZodType>(
  url: string,
  schema: S,
  init?: RequestInit,
): Promise<ApiResult<z.infer<S>>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    return { ok: false, error: { kind: 'network', message: String(cause) } };
  }
  if (!response.ok) {
    return { ok: false, error: { kind: 'http', status: response.status, message: response.statusText } };
  }
  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, error: { kind: 'parse', message: z.prettifyError(parsed.error) } };
}

const User = z.object({ id: z.string(), name: z.string() });
const result = await request('/api/users/1', User);
if (result.ok) result.data.name; // string, inferred from the schema
```

Design decisions to make and defend:

- **Errors as values or exceptions?** A result union forces handling at each call site and types the failure. Throwing is terser and fits libraries that expect rejected promises. Pick one and be consistent.
- **Where do schemas live?** An endpoint map (`{ 'GET /users/:id': { params, response } }`) lets you derive the URL params and the response type from a single definition, using template literal types for the path.
- **What is configurable?** Base URL, auth header injection, `AbortSignal` support, and JSON request bodies with their own schemas.
- **Validator-agnostic?** Accepting any Standard Schema instead of Zod specifically keeps the client small and swappable.

Test it with malformed responses, a 500, a rejected `fetch`, and an aborted request, and add type tests proving that `request(url, User)` resolves to the right type and that a wrong path parameter fails to compile.

**Try it:** Extend the core with a typed endpoint map so that `api.get('/users/:id', { params: { id } })` infers both the required params and the response type. Add `expectTypeOf` tests and one `@ts-expect-error` for a missing param.

**Resources**
- [MDN: Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [Zod: Basic usage](https://zod.dev/basics)
- [Vitest: Testing types](https://vitest.dev/guide/testing-types)
