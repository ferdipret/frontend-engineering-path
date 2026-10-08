# TypeScript

> Stage: 2 · Professional
> The default language of professional frontend work. Aim to model your domain with types so that wrong states fail to compile.

## Fundamentals

- [ ] Why types — explain what a static type system catches and what it can't
- [ ] Basic annotations — primitives, arrays, tuples, objects, function signatures
- [ ] Inference — let TypeScript infer; annotate at boundaries
- [ ] `interface` vs `type` — know the differences and pick a convention
- [ ] Unions and literal types — model "one of these" precisely
- [ ] Narrowing — `typeof`, `in`, `instanceof`, equality, and control-flow analysis
- [ ] `any`, `unknown`, `never` — use `unknown` at boundaries and `never` for exhaustiveness
- [ ] Optional and nullable — `?`, `strictNullChecks`, non-null assertion and why to avoid it
- [ ] Structural typing — understand assignability and excess property checks

## Intermediate

- [ ] Generics — write generic functions and types with constraints and defaults
- [ ] Discriminated unions — model state machines and API results; exhaustive `switch`
- [ ] Utility types — `Partial`, `Required`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`, `Awaited`
- [ ] `keyof`, `typeof`, indexed access — derive types from values and other types
- [ ] `as const` and `satisfies` — preserve literals and check without widening
- [ ] Type guards — user-defined predicates and assertion functions
- [ ] Function overloads — and when a union is the better choice
- [ ] Enums vs unions — know the trade-offs and prefer literal unions or `as const` objects
- [ ] Typing the DOM and events — `HTMLInputElement`, event types, `querySelector` generics

## Advanced

- [ ] Mapped types — transform every key of a type, with modifiers and key remapping
- [ ] Conditional types — `extends`, `infer`, and distributivity
- [ ] Template literal types — type string patterns
- [ ] Variance — covariance and contravariance, and why function parameters are special
- [ ] Branded types — distinguish `UserId` from `OrderId` at compile time
- [ ] Reading complex types — decode a library's type errors and definitions
- [ ] Type-level restraint — know when clever types cost more than they save

## Project setup

- [ ] `tsconfig.json` — `strict`, `target`, `module`, `moduleResolution`, `noUncheckedIndexedAccess`
- [ ] Declaration files — `.d.ts`, `@types/*`, augmenting modules and globals
- [ ] Typed linting — typescript-eslint rules that use type information, such as `no-floating-promises`
- [ ] Runtime validation — parse untrusted data with Zod, Valibot, or similar; infer types from schemas
- [ ] Testing types — assert types with `expectTypeOf` and `@ts-expect-error` so public types do not regress
- [ ] End-to-end types — share types from API to UI (OpenAPI codegen, tRPC, GraphQL codegen)
- [ ] Migrating a codebase — move a JS project to TS incrementally
- [ ] Type-check performance — project references and diagnosing slow types
- [ ] The native compiler — what TypeScript 7 changes, and what still runs on the JavaScript-based compiler

## Practice

- [ ] Convert a project — migrate one of your vanilla JS projects to strict TypeScript
- [ ] Type challenges — complete the easy and medium sets of type-challenges
- [ ] Typed API client — build a small fetch wrapper with validated, fully inferred responses

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Total TypeScript tutorials](https://www.totaltypescript.com/tutorials)
- [type-challenges](https://github.com/type-challenges/type-challenges)
