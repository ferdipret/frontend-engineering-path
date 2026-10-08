# TypeScript: Practice test

### 1. Which of these bugs can TypeScript's type checker NOT catch, even in strict mode?

- [ ] Calling `user.getName()` when `user` may be `null`
- [ ] Passing arguments to a function in the wrong order when their types differ
- [x] An API returning `{ "name": null }` for a field your type declares as `name: string`
- [ ] Forgetting to handle a newly added member of a union in an exhaustive `switch`

> Types are erased before the code runs, so the checker only reasons about code it can see. Data arriving at runtime is whatever the server sent; typing it as `string` is a claim, not a check, and needs runtime validation. The other three are exactly what static checking is for: `strictNullChecks`, parameter type checking, and `never`-based exhaustiveness.

### 2. What are the inferred types of `a`, `b`, and `c.mode`?

```ts
const a = 'dark';
let b = 'dark';
const c = { mode: 'dark' };
```

- [ ] `string`, `string`, `string`
- [ ] `'dark'`, `'dark'`, `'dark'`
- [ ] `'dark'`, `string`, `'dark'`
- [x] `'dark'`, `string`, `string`

> A `const` binding of a primitive keeps its literal type because it can never change. A `let` binding and an object property are both mutable locations, so the literal is widened to `string`. `const c` only prevents reassigning `c`, not `c.mode`. Use `as const` to keep the property literal.

### 3. Why does the second call fail to compile when the first succeeds?

```ts
type Options = { color?: string; width?: number };
function draw(options: Options) {}

const opts = { colour: 'red', width: 2 };
draw(opts);                          // OK
draw({ colour: 'red', width: 2 });   // error
```

- [x] Excess property checking applies only to object literals written directly at the assignment or call
- [ ] Variables declared with `const` are exempt from type checking
- [ ] `opts` was inferred as `any` because it has no annotation
- [ ] The first call is also an error, but the compiler stops at the first one it reports

> Structurally, an object with extra properties is assignable to `Options`, so `draw(opts)` passes: `opts` has a compatible `width` and no conflicting `color`. A *fresh object literal* additionally gets an excess property check, which catches the `colour` typo. `opts` is fully typed as `{ colour: string; width: number }`, not `any`. Adding `satisfies Options` to the `opts` declaration would catch the typo there.

### 4. What is the problem with this function?

```ts
function describe(value: string | string[] | null) {
  if (typeof value === 'object') {
    return value.join(', ');
  }
  return value.toUpperCase();
}
```

- [ ] `typeof` cannot be used to narrow union types
- [ ] `value.toUpperCase()` fails because `value` could still be an array there
- [x] `value.join` fails because `value` is `string[] | null` inside the `if`
- [ ] Nothing; it compiles and runs correctly

> `typeof null` is `'object'`, so the `typeof value === 'object'` branch narrows to `string[] | null`, and the compiler reports that `value` is possibly `null`. The fall-through branch is correctly narrowed to `string`. Check `value === null` first, or use `Array.isArray(value)`.

### 5. A function receives the result of `JSON.parse`. Which parameter type forces the caller's code to check the value before using it?

- [ ] `any`
- [x] `unknown`
- [ ] `object`
- [ ] `never`

> `unknown` accepts any value but permits no operations until you narrow or validate it, which is the correct type for unverified data. `any` also accepts everything but disables checking and spreads through everything it touches. `object` wrongly excludes primitives (JSON can be a string or number) and still allows no useful property access. `never` accepts no values at all.

### 6. With `noUncheckedIndexedAccess` enabled, what happens?

```ts
const names: string[] = [];
const first = names[0];
console.log(first.toUpperCase());
```

- [ ] It compiles; `first` is `string`
- [ ] It compiles; `first` is `any`
- [ ] Compile error on line 2: index `0` is out of bounds
- [x] Compile error on line 3: `first` is `string | undefined`

> The flag adds `undefined` to the result of index access on arrays and index signatures, because the compiler cannot know the array's length. Without the flag `first` is `string` and the code crashes at runtime. TypeScript does not track array lengths for ordinary arrays, so there is no out-of-bounds error on line 2. This flag is not part of `strict`.

### 7. What is the type `RouteName`?

```ts
type Route = { path: string };

const routes = {
  home: { path: '/' },
  about: { path: '/about' },
} satisfies Record<string, Route>;

type RouteName = keyof typeof routes;
```

- [ ] `string`
- [ ] `string | number`
- [x] `'home' | 'about'`
- [ ] `never`

> `satisfies` checks the expression against the type but leaves the inferred type untouched, so `routes` still has exactly the keys `home` and `about`. Had it been annotated as `const routes: Record<string, Route> = ...`, the variable's type would be the annotation, and `keyof` would give `string` (the tempting wrong answer).

### 8. Which statement about this type guard is true?

```ts
type User = { id: string; name: string };

function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value;
}
```

- [ ] It fails to compile because the body does not check `name`
- [ ] The compiler inserts the missing runtime checks for `name` automatically
- [ ] It compiles, and the compiler warns at each call site that the guard is incomplete
- [x] It compiles, and the compiler trusts it, so `{ id: 1 }` will be treated as a `User`

> A type predicate is a promise from the author. The compiler checks only that the function returns a boolean, not that the logic establishes the claimed type. Here `{ id: 1 }` passes the guard and is then used as a `User` with a string `id` and a `name`. That is why guards should be small and tested, or generated from a schema.

### 9. What is `Result`?

```ts
type ToArray<T> = T extends unknown ? T[] : never;
type Result = ToArray<string | number>;
```

- [x] `string[] | number[]`
- [ ] `(string | number)[]`
- [ ] `unknown[]`
- [ ] `never`

> `T` is a bare type parameter in the `extends` check, so the conditional type distributes over the union: it is evaluated for `string` and for `number` separately and the results are unioned. To get `(string | number)[]` you would disable distribution with `[T] extends [unknown] ? T[] : never`.

### 10. Which line fails to compile under `strictFunctionTypes`?

```ts
type Animal = { name: string };
type Dog = { name: string; bark(): void };

declare let handleAnimal: (a: Animal) => void;
declare let handleDog: (d: Dog) => void;

handleDog = handleAnimal;   // line A
handleAnimal = handleDog;   // line B
```

- [ ] Line A
- [x] Line B
- [ ] Both lines
- [ ] Neither line

> Function parameters are contravariant. A function that accepts any `Animal` can safely be used where a `Dog` handler is expected (line A), because it only relies on `name`. The reverse is unsafe: `handleAnimal` could be called with a cat, and the dog handler would call `bark()` on it. People often expect the opposite because `Dog` is assignable to `Animal` as a value.

### 11. What does this code emit, and why does that matter?

```ts
enum Status { Active = 'active', Archived = 'archived' }
type StatusUnion = 'active' | 'archived';
```

- [ ] Both lines are erased; neither produces JavaScript
- [ ] Both lines produce a runtime object
- [ ] The union produces a frozen array of its members; the enum is erased
- [x] The enum produces a runtime object; the type alias is erased

> An `enum` is one of the few TypeScript constructs with a runtime representation, which is why type-stripping tools (Node's built-in TypeScript support, the `erasableSyntaxOnly` flag) reject it. A type alias never emits anything. If you need runtime values, an `as const` object with a derived union type gives you both without non-erasable syntax.

### 12. What is the type `G`?

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type G = Getters<{ name: string; age: number }>;
```

- [ ] `{ name: () => string; age: () => number }`
- [x] `{ getName: () => string; getAge: () => number }`
- [ ] `{ getname: () => string; getage: () => number }`
- [ ] `{ get: () => string | number }`

> The `as` clause remaps each key through a template literal type. `Capitalize` upper-cases the first character, giving `getName` and `getAge`, and `T[K]` still refers to the original key's value type. `string & K` is there because `keyof T` can include `number` and `symbol`, which template literal types do not accept.

### 13. A caller writes `const user = await get<User>('/api/users/1')`. What does the type argument guarantee?

```ts
async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json();
}
```

- [ ] That the response matches `User`, because the generic is checked against the JSON at runtime
- [ ] That the response matches `User`, because `res.json()` is validated by the compiler
- [x] Nothing; `T` appears only in the return type, so it is a type assertion in disguise
- [ ] That the request URL corresponds to an endpoint returning `User`

> `res.json()` returns `Promise<any>`, which is assignable to `Promise<T>` for any `T` the caller picks. No argument relates to `T`, so nothing constrains or verifies it; `get<User>` and `get<Banana>` compile equally. A real solution passes a schema whose output type becomes the return type.

### 14. Which declaration correctly adds a typed `analytics` property to `window` from a file that contains `import` statements?

- [ ] `interface Window { analytics: Analytics }` at the top level of the file
- [ ] `declare module 'window' { export const analytics: Analytics }`
- [ ] `type Window = Window & { analytics: Analytics }`
- [x] `declare global { interface Window { analytics: Analytics } }`

> A file with a top-level `import` or `export` is a module, so a top-level `interface Window` there declares a new, module-local interface instead of merging with the global one. `declare global` reopens the global scope so interface merging can happen. The top-level form works only in a script file with no imports or exports. A type alias cannot merge and cannot refer to itself that way.

### 15. This code passes `tsc --noEmit` under `strict`. Which tool reports the bug?

```ts
async function save(): Promise<void> {
  const res = await fetch('/api/save', { method: 'POST' });
  if (!res.ok) throw new Error('Save failed');
}

saveButton.addEventListener('click', () => {
  save();
  showToast('Saved');
});
```

- [ ] `noUncheckedIndexedAccess`, because the promise result is never read
- [x] typescript-eslint's `no-floating-promises`, which needs typed linting to know `save()` returns a promise
- [ ] `strictNullChecks`, because `save()` may resolve to `undefined`
- [ ] Nothing can detect it statically; only a runtime test would

> Calling an async function without awaiting or handling it is valid TypeScript, so no compiler flag reports it. Here a failed save is an unhandled rejection and the "Saved" toast appears regardless. `no-floating-promises` asks the type checker for the type of each expression statement and flags unhandled promises, which is why it only works with type-aware linting enabled. The fix is to `await` inside an async handler with a `try`/`catch`, or to chain `.catch()`.

### 16. Your Vite app builds and deploys even though the editor shows type errors. Why?

- [ ] Vite downgrades type errors to warnings in production mode
- [x] The bundler strips type syntax without type-checking; only `tsc --noEmit` (or an equivalent step) checks types
- [ ] `strict` mode is disabled automatically when `noEmit` is set
- [ ] `skipLibCheck: true` disables checking of your source files

> Bundlers transpile each file in isolation by removing type syntax, which is fast precisely because no type analysis happens. Type checking is a separate step you must run in a script and in CI. `skipLibCheck` only skips `.d.ts` files, and `noEmit` has no effect on strictness.

### 17. A type test contains the lines below. Later, someone loosens `getUser` to accept any `string`. What happens when the type tests run?

```ts
// @ts-expect-error a plain string is not a UserId
getUser('abc');
```

- [ ] Nothing; `@ts-expect-error` silences the line whether or not it has an error
- [ ] The call fails at runtime because type test files are executed
- [x] The compiler reports the directive as unused, so the test fails and flags the regression
- [ ] The directive is automatically removed by the compiler

> `@ts-expect-error` requires the next line to have a type error. Once the call becomes valid, the directive itself is an error ("Unused '@ts-expect-error' directive"), which is exactly what makes it usable as a negative type test. `@ts-ignore` is the one that stays silent either way, which is why it should not be used. Type test files are only analysed by the compiler, never run.

### 18. What is `Keys`?

```ts
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number };

type Keys = keyof Omit<Shape, 'kind'>;
```

- [ ] `'radius' | 'size'`
- [ ] `'radius'`
- [ ] `'kind' | 'radius' | 'size'`
- [x] `never`

> `Omit` is not distributive. It is built on `keyof T`, and `keyof` of a union is only the keys common to every member, here just `'kind'`. Omitting `'kind'` leaves an object with no known keys, so its `keyof` is `never`. The union's structure is lost. A distributive version, `T extends unknown ? Omit<T, K> : never`, preserves each member.

### 19. Explain the difference between annotating a variable with a type, using `satisfies`, and using `as`. When is each appropriate?

> An annotation (`const x: T = value`) checks the value against `T` and then makes the variable's type exactly `T`, discarding anything more specific that was inferred. Use it when you want a stable, deliberately wide type, such as a mutable state variable.
>
> `satisfies` (`const x = value satisfies T`) performs the same check, including excess property checks, but the variable keeps its inferred, more precise type. Use it for configuration objects and lookup tables where you want typos caught and still want literal keys and values for `keyof typeof` and autocomplete. It combines with `as const`.
>
> `as T` is an assertion: it tells the compiler to treat the value as `T` and performs only a loose plausibility check. It can claim things that are false (a downcast, or `{} as User`), so it can hide bugs. Reserve it for cases where you know more than the compiler and can justify it in a comment, ideally inside one small, tested function.

### 20. This code compiles. Describe the runtime bug and how to change the function signature so the compiler prevents it.

```ts
type Animal = { name: string };
type Dog = { name: string; bark(): void };

function addStray(animals: Animal[]) {
  animals.push({ name: 'Stray cat' });
}

const dogs: Dog[] = [];
addStray(dogs);
dogs.forEach((dog) => dog.bark());
```

> `Dog[]` is assignable to `Animal[]` because TypeScript treats mutable arrays as covariant, which is unsound. `addStray` pushes an object with no `bark` method into what is really the `dogs` array, so `dog.bark()` throws "bark is not a function" at runtime.
>
> If the function only needs to read, declare the parameter as `readonly Animal[]`; `push` then fails to compile inside the function. If it really must add elements, it should not accept a more specific array: return a new `Animal[]` instead of mutating, or make it generic and have the caller supply the element (`function add<T>(items: T[], item: T)`).

### 21. Rewrite this state type so that impossible combinations cannot be represented, and show how to make a `switch` over it fail to compile when a new state is added.

```ts
type RequestState = {
  isLoading: boolean;
  data?: User;
  error?: string;
};
```

> The original allows `{ isLoading: true, data, error }` and `{ isLoading: false }` with neither data nor error. Model each state as a member of a discriminated union:
>
> ```ts
> type RequestState =
>   | { status: 'idle' }
>   | { status: 'loading' }
>   | { status: 'success'; data: User }
>   | { status: 'error'; error: string };
>
> function assertNever(value: never): never {
>   throw new Error(`Unhandled: ${JSON.stringify(value)}`);
> }
>
> function view(state: RequestState): string {
>   switch (state.status) {
>     case 'idle': return '';
>     case 'loading': return 'Loading';
>     case 'success': return state.data.name;
>     case 'error': return state.error;
>     default: return assertNever(state);
>   }
> }
> ```
>
> After every case is handled, `state` is narrowed to `never` in `default`. Adding a new member means `state` is no longer `never` there, so the `assertNever` call fails to compile. The `switch-exhaustiveness-check` lint rule is an alternative.

### 22. Write a generic function `pick(obj, keys)` that returns a new object containing only the listed keys, with a precise return type. A misspelled key must be a compile error.

> ```ts
> function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
>   const result = {} as Pick<T, K>;
>   for (const key of keys) {
>     result[key] = obj[key];
>   }
>   return result;
> }
>
> const user = { id: '1', name: 'Ada', email: 'ada@example.com' };
> const preview = pick(user, ['id', 'name']); // { id: string; name: string }
> pick(user, ['emial']);                      // error
> ```
>
> `K extends keyof T` constrains the keys to those of the object, and `K` is inferred as the union of the literals passed, so the return type is exactly `Pick<T, K>`. One assertion is needed for the initially empty object; it is contained in a small function whose signature is honest. Note that because of structural typing `obj` may have extra runtime keys, which is fine here since only the listed keys are copied.

### 23. A teammate proposes `type UserId = string` and `type OrderId = string` "for safety". Explain why this gives no protection and show an approach that does.

> Type aliases do not create new types; both names are just `string`, and TypeScript is structural, so a `UserId` is accepted wherever an `OrderId` is expected and so is any plain string. The aliases are documentation only.
>
> To make them incompatible, brand them with a phantom property that exists only at the type level, and create values through a single validating function:
>
> ```ts
> declare const brand: unique symbol;
> type Brand<T, B extends string> = T & { readonly [brand]: B };
>
> type UserId = Brand<string, 'UserId'>;
> type OrderId = Brand<string, 'OrderId'>;
>
> function toUserId(value: string): UserId {
>   if (!value.startsWith('usr_')) throw new TypeError('Invalid user id');
>   return value as UserId;
> }
> ```
>
> At runtime the values are still plain strings. The protection depends on the assertion living in one place; if code casts with `as UserId` freely, the brand proves nothing. Schema libraries can produce branded types as part of parsing.

### 24. You inherit a 40,000-line JavaScript app and are asked to move it to TypeScript without stopping feature work. Outline your plan.

> 1. Add TypeScript without converting anything: a `tsconfig.json` with `allowJs` and `noEmit`, and `tsc --noEmit` in CI so the baseline is enforced.
> 2. Turn on `checkJs` (or `// @ts-check` per file) to get checking from inference and JSDoc, and install `@types/*` for dependencies.
> 3. Define the core domain types and the schemas for API responses first, since every module depends on them.
> 4. Convert files leaf-first (utilities with no internal imports, then upward through the import graph) in small pull requests that change types only, not behaviour.
> 5. Ratchet strictness. Either enable strict flags one at a time, or enable `strict` immediately and mark existing errors with `// @ts-expect-error` so all new code is strict while the suppression count is burned down. Since `strict` is the default from TypeScript 6.0, a looser starting point has to be configured explicitly.
> 6. Prevent regression with lint rules against new `.js` files, explicit `any`, and `@ts-ignore`, and a CI check that the suppression count never increases.
>
> Throughout: prefer `unknown` to `any` for types not yet known, treat `strictNullChecks` errors as likely real bugs, and do not spend effort perfectly typing modules that are about to be deleted.

### 25. Your team upgrades to TypeScript 7. `tsc` is now much faster, but ESLint with typed rules and the Vue template type-check are as slow as before, and a colleague finds a second copy of TypeScript in `node_modules`. Explain what is going on and whether it is a problem.

> TypeScript 7.0 is the native (Go) port of the compiler. The `tsc` command line is fully replaced, but 7.0 does not ship a programmatic API. Tools that import `typescript` as a library, such as typescript-eslint and the template type-checkers for Vue, Svelte, and Astro, cannot call the native compiler yet. They run on the JavaScript-based 6.0 compiler through the `@typescript/typescript6` compatibility package, which is the second copy. The API is planned for 7.1.
>
> So this is the expected setup, not a misconfiguration: the build and type-check use the native compiler, and the linter and framework tooling use the older one at the older speed. Things to watch: both must be configured from the same `tsconfig`, the config must already be free of options removed in 7.0 (the 6.0 deprecations are hard errors and `ignoreDeprecations` no longer helps), and in rare cases the two compilers can disagree, so reproduce an odd error with both `tsc` and `tsc6` before reporting it. Re-check each tool's release notes as native support arrives.

### 26. The editor has become slow and `tsc --noEmit` takes several minutes on a monorepo. How do you find the cause, and what are the likely fixes?

> Measure before changing anything. `tsc --noEmit --extendedDiagnostics` shows the number of files, types, and instantiations and the time per phase. `--listFilesOnly` and `--explainFiles` show what is in the program and why each file was included. A generated trace (`--generateTrace`, summarised with `@typescript/analyze-trace`) identifies the specific files and types that dominate check time.
>
> Typical causes and fixes:
>
> - Too many files: an `include` that sweeps in build output, generated code, or another package's sources. Narrow `include`/`exclude`, enable `skipLibCheck`, and list `types` explicitly.
> - Expensive types: very large unions, deep recursive conditional or template literal types, big intersections, and huge inferred return types re-derived at every use. Add explicit return types to exported functions, use `interface extends` instead of intersections, and simplify or cap the clever types.
> - No incremental structure: split the repository into project references with `composite: true` and build with `tsc --build`, so unchanged packages are skipped and consumed through their `.d.ts` files. Enable `incremental` for single projects.
> - Also confirm the compiler version: the native compiler in TypeScript 7 is roughly an order of magnitude faster and checks in parallel, but it does not rescue pathological types.

### 27. Explain why `Object.keys(obj)` returns `string[]` instead of `(keyof T)[]`, and what you should do when you need typed keys.

> Object types are open: structural typing means a value of type `T` may have more properties at runtime than `T` declares (for example an object with `x`, `y`, and `z` assigned to a `{ x: number; y: number }` variable). `Object.keys` returns every own enumerable key, including those extras, so `(keyof T)[]` would be a lie and indexing with the result could yield values of an unexpected type.
>
> Options when you need typed keys: iterate a known list of keys you declared yourself (an `as const` array from which the type is derived); assert in one small helper when you created the object in the same place and know it has no extra keys; or iterate with `Object.entries` and treat values as possibly wider. For lookup tables, `Record<Key, V>` built from a literal union keeps keys and type in step.
