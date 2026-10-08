# Authoring guide

Every module has three markdown files that share a file name:

| File | Holds |
| --- | --- |
| `path/NN-slug.md` | The checklist: skills grouped into sections. This is the spine; the other two hang off it. |
| `guides/NN-slug.md` | The deep dive: a toolkit for the module and a detailed entry for every skill. |
| `quizzes/NN-slug.md` | The practice test. |

Run `node scripts/validate.js NN-slug --links` after editing. It checks that guides and quizzes line up with the checklist and that every link resolves.

## Voice and sourcing

- Write for someone learning the topic properly, in the second person, plainly. No filler, no hype, no "in this section we will".
- Be specific and correct. Prefer a precise statement with a short example over a general one. Say what goes wrong in practice.
- Describe the platform as it is today. For anything fast-moving (framework APIs, tooling, browser support), check the official docs rather than relying on memory, and say so when a feature is not yet available in all major browsers.
- Link official and primary sources first: MDN, web.dev, developer.chrome.com, the WHATWG/W3C/TC39 specs, and the official docs of the tool or framework in question (react.dev, typescriptlang.org, vite.dev, playwright.dev, and so on). A well-known independent article is fine as a second or third link when it is the best explanation available. No link farms, no content mills, no paywalled courses.
- Link to the specific page, not a home page. Never invent a URL: every link must pass the link check.

## Markdown that the web view renders

Paragraphs, `-` bullet lists, `1.` numbered lists, fenced code blocks with a language, `inline code`, `**bold**`, `*italic*`, `[links](https://…)`, `> blockquotes`, and simple pipe tables. Do not use nested lists, images, raw HTML, or footnotes. Write HTML tags you mention as inline code, like `<dialog>`.

## `guides/NN-slug.md`

```markdown
# Module title: Guide

## Toolkit

### DevTools and tooling
### Testing and verifying your work
### Tricks and gotchas
### Official references

## Skills

### Skill name exactly as in the checklist
…
```

### Toolkit

Four sections with exactly these headings, 150–350 words each, specific to this module:

- **DevTools and tooling** — the browser DevTools panels and features, CLI tools, editor extensions, linters, and playgrounds that matter for this topic, and how to actually use each one (which panel, which setting, which command, what to look for).
- **Testing and verifying your work** — how you check that work in this area is correct: validators, automated tests, manual checks, what "done" looks like.
- **Tricks and gotchas** — a bullet list of practical tips, shortcuts, and common traps that experienced engineers know.
- **Official references** — a bullet list of the canonical docs and specs for the module, one line each on what it is for.

### Skills

One `### ` entry for every checklist item in `path/NN-slug.md`, in the same order. The heading must be the skill's name exactly: the item text before the ` — `, including any backticks. Entries must not contain headings of their own.

Each entry is 150–300 words (more only where the topic needs it) and has, in this order:

1. The explanation: what it is, the mental model, the details the one-line checklist description glosses over, and the mistakes people make. Include a short code example whenever code makes it clearer.
2. A `**Try it:**` paragraph: one concrete exercise or DevTools experiment that takes 5–20 minutes and proves the reader understands.
3. A `**Resources**` line followed by 1–3 bullet links, official docs first. Give each link a label that names the source, like `[MDN: The cascade](…)`.

Example:

````markdown
### Specificity

When two declarations from the same origin and layer target the same property, the selector with the higher specificity wins. Specificity is three numbers compared left to right: ID selectors, then classes/attributes/pseudo-classes, then type selectors and pseudo-elements. `#nav .link` is (1,1,0) and beats `ul li a.link` at (0,1,3), because the first column is compared before the others; no number of classes outranks one ID.

```css
:is(#main, .card) p { }   /* (1,0,1): takes its most specific argument */
:where(#main, .card) p { } /* (0,0,1): always contributes zero */
```

`:not()` and `:has()` behave like `:is()`. Inline styles beat all selectors, and `!important` moves a declaration into a separate, higher-priority origin rather than adding specificity. The usual mistake is escalating: an ID here, an `!important` there, until nothing can be overridden. Keep specificity low and flat, and use `:where()` for defaults you expect people to override.

**Try it:** In DevTools, inspect an element with several competing rules. The Styles pane lists rules in winning order with losers struck through; hover a selector to see its specificity. Predict the order before you look.

**Resources**
- [MDN: Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity)
- [Selectors Level 4: Calculating specificity](https://drafts.csswg.org/selectors/#specificity-rules)
````

## `quizzes/NN-slug.md`

```markdown
# Module title: Practice test

### 1. Question text
…
```

At least 20 questions per module: 14 or more multiple choice and 6 or more open questions, ordered roughly from easier to harder and spread across the module's sections.

- Test understanding, not trivia. Good questions ask the reader to predict output, find the bug, choose between approaches, or explain why something happens. At least a third should involve reading code.
- **Multiple choice**: a task list of 4 options with exactly one `[x]`. Wrong options must be plausible (real misconceptions). Vary the position of the correct answer. Follow with a `> ` blockquote explaining why the right answer is right and the tempting wrong one is wrong.
- **Open question**: no options. The `> ` blockquote is the model answer, shown when the reader clicks reveal. Use these for "explain", "write", "debug", and "how would you" questions.
- Code in a question goes in a fenced block directly under the heading. The explanation may also contain fenced code; prefix those lines with `> ` too.

Example:

````markdown
### 3. What does this log?

```js
console.log('a');
setTimeout(() => console.log('b'), 0);
Promise.resolve().then(() => console.log('c'));
console.log('d');
```

- [ ] a, b, c, d
- [ ] a, d, b, c
- [x] a, d, c, b
- [ ] a, c, d, b

> Synchronous code runs first (a, d). Promise callbacks are microtasks, which drain before the next task, so c logs before the timer callback b, even with a 0ms delay.

### 4. Explain why a `fetch()` to a URL that returns 404 does not reject, and how you would handle it.

> `fetch` only rejects on network failure or abort. An HTTP error is still a completed response, so you check `response.ok` (or `response.status`) and throw yourself before reading the body.
````
