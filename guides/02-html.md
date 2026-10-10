# HTML: Guide

## Toolkit

### DevTools and tooling

The **Elements panel** shows the DOM, which is the parser's *output*, not your source. The parser closes tags you left open, moves misplaced elements, and inserts `<tbody>`, so when the DOM surprises you, compare it with **View source** (Ctrl+U / Cmd+Option+U). Firefox's view-source marks parse errors in red, with the reason on hover.

Next to Styles in the Elements panel is the **Accessibility** pane: it shows the selected element's computed role, accessible name, and where the name came from. Tick "Enable full-page accessibility tree" there and a button appears in the Elements panel that switches the DOM view to the tree a screen reader sees. Firefox has a dedicated Accessibility panel that also shows tab order. This is the fastest way to answer "is this a button? what is it called?"

The **Issues** panel (three-dot menu > More tools > Issues) reports form problems in plain language: fields without labels, duplicate ids, missing or invalid `autocomplete` values. **Lighthouse** runs accessibility, SEO, and best-practice audits that are mostly HTML checks. Under Application, the frames tree shows each iframe's origin and security details.

Useful Console one-liners: `$0` is the selected element; `Object.fromEntries(new FormData($0))` shows exactly what a selected form would submit; `$$('h1,h2,h3,h4,h5,h6').map(h => h.tagName + ' ' + h.textContent.trim())` prints the heading outline.

Outside the browser:

- The **Nu Html Checker** (`validator.w3.org/nu`) validates by URL, upload, or pasted text.
- `npx html-validate "src/**/*.html"` runs an offline, configurable validator with accessibility rules; it fits CI.
- **axe DevTools** (browser extension) and `@axe-core/playwright` catch missing names, bad nesting, and contrast.
- In VS Code, Emmet is built in: type `!` then Tab for a document skeleton, or `ul>li*3>a` then Tab.
- A screen reader: NVDA (free, Windows), VoiceOver (built into macOS and iOS), TalkBack (Android).

### Testing and verifying your work

HTML has no compiler, so you need a routine. For any page or component:

1. **Validate.** Run the Nu Html Checker or `html-validate` and fix every error, starting from the first: one unclosed tag produces a cascade of follow-on errors. For pages rendered by JavaScript, validate the live DOM: run `copy(document.documentElement.outerHTML)` in the Console and paste into the checker's text input.
2. **Read it without CSS.** In Firefox, View > Page Style > No Style. The page should still read in a sensible order with visible structure: headings, lists, and labelled form fields. If it turns into soup, the markup is leaning on CSS for meaning.
3. **Use only the keyboard.** Tab through everything. Every interactive thing must be reachable, show focus, and work with Enter (links, buttons) or Space (buttons, checkboxes). Anything you cannot reach is probably a `div` with a click handler.
4. **Check the accessibility tree.** Confirm each control's role and name. Check that landmarks and headings form an outline that a stranger could navigate.
5. **Listen to it.** Spend five minutes with a screen reader: list headings, list landmarks, tab through a form and hear each label.
6. **Test forms without JavaScript.** Open the Command Menu (Ctrl+Shift+P), run "Disable JavaScript", and submit. Check the Payload tab of the request: every field should arrive under the name you expect.
7. **Test autofill** with a real saved address and a password manager.
8. **Automate what you can.** Playwright's role-based locators double as semantic tests: `page.getByRole('button', { name: 'Save' })` only passes if the element is exposed as a button with that name.

Automated checkers find perhaps a third of accessibility problems. They can tell you an `alt` is missing, not that it is useless.

### Tricks and gotchas

- Boolean attributes are true by presence. `disabled="false"` is still disabled; remove the attribute to turn it off.
- A `<button>` inside a `<form>` is `type="submit"` by default. Any button that is not meant to submit needs `type="button"`.
- A form control without a `name` is not submitted. An `id` is for labels and scripts; a `name` is for the server.
- An unchecked checkbox sends nothing at all, not `false`.
- `<p>` cannot contain block-level elements. `<p><div>…</div></p>` is parsed as an empty paragraph, a div, and another empty paragraph.
- The trailing slash on void elements (`<br />`) does nothing in HTML. `<div />` does *not* self-close; it is an opening tag.
- Browsers insert `<tbody>` into tables, so `table > tr` matches nothing.
- `id` values must be unique per document; duplicates break labels, `aria-*` references, and fragment links silently.
- Never set `user-scalable=no` or `maximum-scale=1` in the viewport meta. It blocks zooming for people who need it.
- Use a font size of at least 16px on inputs, or iOS Safari zooms the page when a field is focused.
- `placeholder` is not a label: it disappears on input and often fails contrast.
- Never lazy-load the image that is likely to be the largest thing above the fold.
- `target="_blank"` now implies `rel="noopener"` in all current browsers; you no longer need to add it for safety.
- Reach for ARIA last. `<button>` beats `<div role="button" tabindex="0">` plus two event handlers every time.
- `hidden` is overridden by any CSS `display` rule on the element. If `hidden` "does not work", look for that.

### Official references

- [HTML Living Standard (developer edition)](https://html.spec.whatwg.org/dev/) - the authoritative definition of every element, attribute, and content model, without the implementer-only detail.
- [MDN: HTML elements reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements) - one page per element with attributes, examples, accessibility notes, and browser support.
- [MDN: Global attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes) - attributes valid on every element.
- [web.dev: Learn HTML](https://web.dev/learn/html) - a structured course on the whole language.
- [web.dev: Learn Forms](https://web.dev/learn/forms) - a course on form markup, validation, and autofill.
- [Nu Html Checker](https://validator.w3.org/nu/) - the W3C validator for the living standard.
- [W3C: ARIA in HTML](https://www.w3.org/TR/html-aria/) - each element's implicit role and which ARIA attributes are allowed on it.
- [W3C WAI: Web accessibility tutorials](https://www.w3.org/WAI/tutorials/) - worked guidance for page structure, images, tables, and forms.
- [ARIA Authoring Practices Guide: Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) - expected keyboard behaviour for widgets such as dialogs, disclosures, and menus.

## Skills

### Document structure

Every HTML document has the same skeleton:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page title</title>
  </head>
  <body>
    <h1>Visible content</h1>
  </body>
</html>
```

- **`<!doctype html>`** is not a tag and not a version declaration. Its only job is to put the browser into **standards mode**. Leave it out and you get **quirks mode**, which emulates 1990s layout bugs: a different box model in places, odd table and line-height behaviour. It must be the first thing in the file.
- **`<html lang="en">`** is the root element. `lang` tells screen readers which pronunciation rules to use, and also drives hyphenation, quotation marks, spell-checking, font selection for CJK text, and translation prompts. A wrong or missing `lang` makes a screen reader read French with an English accent. Use a BCP 47 tag (`en`, `en-GB`, `pt-BR`), and set `lang` again on any passage in another language.
- **`<head>`** holds metadata: information *about* the document for browsers, search engines, and other tools. Nothing in it is rendered in the page.
- **`<body>`** holds everything the user sees and interacts with.

The parser is forgiving: omit `<html>`, `<head>`, and `<body>` and it creates them for you. That is why broken pages still render, and why the DOM can differ from your source. If you put a `<div>` in the `<head>`, the parser decides the head has ended and moves it, and everything after it, into the body.

For right-to-left languages, add `dir="rtl"` on `<html>`.

**Try it:** Create a file containing only `<p>Hello`, open it, and inspect the DOM the parser built. Run `document.compatMode` in the Console (`BackCompat` means quirks mode). Add the doctype, reload, and check again.

**Resources**
- [web.dev: Learn HTML, Document structure](https://web.dev/learn/html/document-structure)
- [MDN: Quirks mode and standards mode](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Quirks_mode_and_standards_mode)
- [MDN: lang global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang)

### The head

A solid `<head>`, in an order that matters:

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Checkout · Acme Store</title>
  <meta name="description" content="Review your basket and pay securely.">
  <link rel="stylesheet" href="/css/main.css">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <script src="/js/app.js" defer></script>
</head>
```

- **`charset`** must appear within the first 1024 bytes, so put it first. Without it the browser guesses the encoding, and non-ASCII characters can turn into mojibake (`â€™`).
- **`viewport`** tells mobile browsers to lay the page out at the device's width. Without it, phones render at around 980px wide and zoom out, and your media queries never match. Do not add `user-scalable=no`.
- **`<title>`** is required. It labels the tab, the bookmark, the history entry, the search result, and is the first thing a screen reader announces. Make it unique per page, most specific part first.
- **`description`** is often used as the search result snippet. It does not affect ranking; it affects whether people click.
- **Stylesheets** are render-blocking: the browser will not paint until they load. That is desirable (no flash of unstyled content) but means every stylesheet in the head is on the critical path.
- **Icons**: an `.ico` for legacy contexts, an SVG for modern browsers, and a 180×180 PNG for iOS home screens covers nearly everything.
- **Scripts** in the head should have `defer` or `type="module"` so they do not block parsing.

Also belonging here: `<link rel="canonical">`, Open Graph tags, `<link rel="preconnect">` and `rel="preload"` hints, `<meta name="theme-color">`, and `<meta name="color-scheme" content="light dark">`.

Only metadata elements are allowed in the head. Anything else ends it early.

**Try it:** On three sites you use, run `[...document.head.children].map(e => e.outerHTML.slice(0, 100))` in the Console. Identify each line's purpose. Then remove the viewport meta from a page of your own and view it with DevTools device emulation to see the zoomed-out result.

**Resources**
- [web.dev: Learn HTML, Metadata](https://web.dev/learn/html/metadata)
- [MDN: What's in the head? Web page metadata](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Webpage_metadata)
- [Evil Martians: How to favicon, six files that fit most needs](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs)

### Elements and attributes

The vocabulary, precisely:

```html
<a href="/pricing" class="cta">See pricing</a>
```

- A **tag** is the markup: `<a …>` is the start tag, `</a>` the end tag.
- An **element** is the whole thing, start tag, content, and end tag, and the node it becomes in the DOM.
- An **attribute** is a `name="value"` pair in the start tag.

**Void elements** cannot have content and have no end tag: `<br>`, `<hr>`, `<img>`, `<input>`, `<meta>`, `<link>`, `<source>`, `<track>`, `<wbr>`, `<area>`, `<base>`, `<col>`, `<embed>`. Writing `<br />` is allowed but the slash is ignored. It is not a general self-closing syntax: `<div />` is just `<div>`, and everything after it becomes a child.

Attributes come in kinds:

- **Boolean** attributes (`disabled`, `required`, `checked`, `hidden`, `open`, `defer`) are true when present. The value is irrelevant: `disabled="false"` disables.
- **Enumerated** attributes accept a fixed set of keywords (`type`, `loading`, `dir`, `autocomplete`), often with a default for invalid values. `contenteditable="false"` and `draggable="false"` are meaningful, which is why these are not boolean.
- **Global attributes** are valid on every element: `id`, `class`, `lang`, `dir`, `hidden`, `tabindex`, `title`, `style`, `inert`, `popover`, `translate`, `contenteditable`, `data-*`, and the `aria-*` family.

Tag and attribute names are case-insensitive in HTML; attribute values are not. Quotes can be omitted for simple values but always use them: `<a href=/a/b class=x y>` does not do what it looks like.

Attributes (in HTML) and properties (on the DOM object) are related but different. The `value` attribute of an input is its *initial* value; the `value` property is its *current* one.

```js
input.getAttribute('value'); // "initial", what the markup said
input.value;                 // what the user has typed
```

**Try it:** Write `<button disabled="false">Go</button>` and `<div /><p>inside?</p>`, open the page, and inspect the DOM. Explain both results. Then type in an input and compare `$0.value` with `$0.getAttribute('value')`.

**Resources**
- [web.dev: Learn HTML, Attributes](https://web.dev/learn/html/attributes)
- [MDN: Void element (glossary)](https://developer.mozilla.org/en-US/docs/Glossary/Void_element)
- [MDN: Global attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes)

### Block vs inline content

"Block" and "inline" are CSS `display` values: a block box starts on a new line and fills the available width; inline boxes flow within a line. Old HTML specifications sorted elements into those two groups too, and the idea persists, but it conflates two things. What an element *looks like* is CSS's business and can be changed (`display: flex` on a `<span>`). What an element *may contain* is HTML's business and cannot.

HTML defines that with **content categories**. The two main ones:

- **Flow content**: nearly everything that can go in `<body>`.
- **Phrasing content**: text and text-level elements such as `<a>`, `<em>`, `<span>`, `<img>`, `<input>`. All phrasing content is also flow content.

Other categories overlap these: heading, sectioning, embedded, interactive, and metadata. Every element then has a **content model** stating what it accepts. `<p>` and `<h1>`–`<h6>` accept only phrasing content. `<ul>` accepts only `<li>`. `<button>` accepts phrasing content with no interactive descendants.

The parser enforces some of this. A `<p>` is closed automatically when a block-level start tag appears:

```html
<p>Intro <div>box</div> outro</p>
<!-- becomes: <p>Intro </p><div>box</div> outro<p></p> -->
```

Some elements have a **transparent** content model: they accept whatever their parent would. That is why `<a>` can wrap a whole card with a heading and paragraphs inside a `<div>`, yet cannot wrap a `<div>` when it sits inside a `<p>`. In either case `<a>` must not contain interactive content such as a `<button>` or another link.

In frameworks, invalid nesting causes real bugs: server-rendered HTML gets rearranged by the parser, the client's expectation no longer matches, and you get a hydration error.

**Try it:** Put `<p>one <ul><li>two</li></ul> three</p>` in a page and inspect the DOM. Then run it through the validator and read the error. Finally look up `<a>` on MDN and find "Permitted content" in its technical summary.

**Resources**
- [MDN: Content categories](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Content_categories)
- [HTML Standard: Content models](https://html.spec.whatwg.org/multipage/dom.html#content-models)

### Validation

Browsers never report HTML errors; they recover silently, each parse error being fixed by rules in the standard. So invalid markup "works" until it does not: a stray `</div>` closes your layout container early, a duplicate `id` makes a label point at the wrong field, an unclosed `<a>` turns half the page into a link. A validator reports these mistakes before they become visual or accessibility bugs.

The **Nu Html Checker** at `validator.w3.org/nu` is the W3C validator for current HTML. Check by address, file upload, or text input. Messages come in three levels: **Error** (the document violates the standard), **Warning** (probably a mistake, such as a `<section>` without a heading), and **Info**.

How to work through a report:

1. Fix the first error and re-run. Errors cascade: one unclosed element can produce twenty messages.
2. Read the message literally. "Element `div` not allowed as child of element `span` in this context" is a content-model error. "Stray end tag" means an extra close or a missing open. "Duplicate ID" is self-explanatory.
3. Use the line and column numbers; tick "source" to see the offending line highlighted.

What it checks: syntax, nesting and content models, required and permitted attributes, attribute value syntax, unique ids, and that `aria-*` usage is permitted. What it cannot check: whether your `alt` text is any good, whether the heading order makes sense, or whether you picked the right element.

It validates the HTML the server sent. For client-rendered pages, copy the live DOM with `copy(document.documentElement.outerHTML)` and paste it in. For continuous checking, use `html-validate` locally or in CI:

```bash
npx html-validate "dist/**/*.html"
```

Valid is a floor, not a goal: a page of nested `<div>`s validates perfectly.

**Try it:** Validate the home page of a site you like and classify the first five errors as nesting, attribute, id, or obsolete-feature problems. Then deliberately break a page of your own (remove one `</li>`, duplicate an id, put a `<div>` in a `<span>`) and learn what each error message looks like.

**Resources**
- [Nu Html Checker](https://validator.w3.org/nu/)
- [Nu Html Checker: About and usage](https://validator.w3.org/nu/about.html)
- [html-validate: Getting started](https://html-validate.org/usage/index.html)

### Headings

Headings are the page's table of contents. Screen reader users navigate by them constantly: one key lists every heading, another jumps to the next `<h2>`. Search engines and reader modes use them to understand structure. So the level expresses *rank in the outline*, not appearance.

```html
<h1>Sourdough bread</h1>
  <h2>Ingredients</h2>
  <h2>Method</h2>
    <h3>Make the starter</h3>
    <h3>Shape and prove</h3>
  <h2>Troubleshooting</h2>
```

The rules that follow:

- One `<h1>` that names the page, usually matching the `<title>`.
- Do not skip levels going down. An `<h4>` directly under an `<h2>` implies a missing section. Going back up any number of levels is fine.
- Choose the level from the structure and set the size with CSS. If the design wants a small heading, style it; if you want big text that is not a heading, use a `<p>` with a class.
- Do not use headings for text that introduces no section: taglines, pull quotes, card labels that are not titles. For a title with a subtitle, wrap an `<h1>` and a `<p>` in `<hgroup>`.
- Do not fake headings with `<p><strong>`. They are invisible to navigation.

One piece of persistent misinformation: HTML5 once described an "outline algorithm" in which each `<section>` restarted heading levels, so you could use `<h1>` everywhere. No browser or screen reader ever implemented it, and it was removed from the standard in 2022. The default styles that shrank `<h1>` inside `<section>` are being removed from browsers too. Heading levels are exactly the numbers you write.

In component-based code the hard part is that a component does not know its depth. Pass the level in as a prop rather than hard-coding `<h2>`.

**Try it:** Run this on three sites and judge the outline as if it were a document's contents page:

```js
$$('h1,h2,h3,h4,h5,h6').map(h => '  '.repeat(h.tagName[1] - 1) + h.tagName + ' ' + h.textContent.trim()).join('\n')
```

**Resources**
- [W3C WAI: Headings](https://www.w3.org/WAI/tutorials/page-structure/headings/)
- [web.dev: Learn HTML, Headings and sections](https://web.dev/learn/html/headings-and-sections)
- [MDN: Heading elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements)

### Landmarks

Landmarks are the named regions of a page that assistive technology can list and jump between. Several HTML elements create them automatically:

| Element | Landmark role | Notes |
| --- | --- | --- |
| `<header>` | `banner` | Only when not inside `<article>`, `<aside>`, `<main>`, `<nav>`, or `<section>` |
| `<nav>` | `navigation` | For major blocks of navigation links |
| `<main>` | `main` | One per page (others must be `hidden`) |
| `<aside>` | `complementary` | Related but separable content |
| `<footer>` | `contentinfo` | Same scoping rule as `<header>` |
| `<section>` | `region` | Only when it has an accessible name |
| `<form>` | `form` | Only when it has an accessible name |
| `<search>` | `search` | Wraps search or filter controls |

`<article>` is not a landmark. It marks a self-contained composition (a blog post, a comment, a product card) that would make sense on its own. `<section>` is a thematic grouping that should have a heading; without a name it is semantically a `<div>`.

```html
<body>
  <header>…site logo, search…</header>
  <nav aria-label="Main">…</nav>
  <main>
    <h1>…</h1>
    <article>…</article>
    <aside aria-labelledby="related-h"><h2 id="related-h">Related</h2>…</aside>
  </main>
  <footer>
    <nav aria-label="Footer">…</nav>
  </footer>
</body>
```

Practical points:

- When a landmark type appears more than once, label each: `<nav aria-label="Main">`, `<nav aria-label="Breadcrumb">`. Do not include the word "navigation" in the label; the role already says it.
- All content should sit inside some landmark, and `<main>` should contain the unique content of the page, not the site chrome.
- More is not better. Wrapping everything in `<section>` or turning every list of links into `<nav>` makes the landmark list useless.
- `<div>` is still correct when you only need a styling hook.

**Try it:** In Chrome DevTools, enable the full accessibility tree and look at the top-level structure of a site. Or run `$$('header,nav,main,aside,footer,section[aria-label],section[aria-labelledby],search')`. Is there exactly one `main`? Are repeated `nav`s labelled?

**Resources**
- [ARIA Authoring Practices Guide: Landmark regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)
- [web.dev: Learn HTML, Semantic HTML](https://web.dev/learn/html/semantic-html)
- [MDN: Content sectioning elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements#content_sectioning)

### Text semantics

Text-level elements say what a run of text *is*. Choose by meaning; the default styling is incidental.

- **`<p>`**: a paragraph. Not a spacer, and not a wrapper for anything that happens to be text. Do not use `<br><br>` to fake paragraphs; `<br>` is for line breaks that are part of the content, such as addresses and poems.
- **`<em>`**: stress emphasis that changes the meaning of the sentence ("I *did* tell him"). **`<i>`** is for text in a different voice without emphasis: a foreign phrase, a taxonomic name, a thought.
- **`<strong>`**: importance, seriousness, or urgency ("**Warning:** hot surface"). **`<b>`** draws attention without importance: keywords, a product name in a review.
- **`<blockquote>`**: an extended quotation from another source, optionally with a `cite` attribute holding the URL. Put the attribution outside it, typically in a `<figcaption>` when both are wrapped in `<figure>`. Use **`<q>`** for short inline quotations and **`<cite>`** for the title of a work.
- **`<code>`**: a fragment of computer code. For a block, nest it in `<pre>`, which preserves whitespace. **`<kbd>`** is for user input (keys), **`<samp>`** for program output.
- **`<time>`**: a date, time, or duration, with a machine-readable `datetime` when the visible text is not one: `<time datetime="2026-10-04">last Sunday</time>`.
- **`<abbr>`**: an abbreviation. The `title` expansion is unavailable on touch screens and to most keyboard users, so also spell the term out on first use in the text.

Also useful: `<mark>` (highlighted for relevance), `<del>` and `<ins>` (edits), `<small>` (side comments, legal print), `<sub>` and `<sup>`.

Be realistic about what this buys: screen readers do not announce `<em>` or `<strong>` by default. The value is in correct default rendering, in machine consumers (translation, reader modes, search), and in markup that still makes sense when the stylesheet changes. Do not use `<blockquote>` to indent or `<strong>` just to get bold.

**Try it:** Mark up this plain text, choosing an element for each part that needs one, and justify each choice: "Warning: never run rm -rf / as root. If you already did, press Ctrl+C. The manual, The Linux Command Line, says the command is irreversible. This notice expires on 4 October 2026 at 14:00 UTC." You should end up using at least `<strong>`, `<code>`, `<kbd>`, `<cite>`, `<em>` or `<i>`, and `<time>`.

**Resources**
- [HTML Standard: Text-level semantics](https://html.spec.whatwg.org/multipage/text-level-semantics.html)
- [web.dev: Learn HTML, Text basics](https://web.dev/learn/html/text-basics)
- [MDN: Inline text semantics elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements#inline_text_semantics)

### Lists

A list tells assistive technology "there are five items here", which lets a user decide whether to read them or skip past. Pick the type by the shape of the content:

- **`<ul>`**: a set where order does not matter. Navigation links, features, tags, search results cards.
- **`<ol>`**: a sequence where changing the order changes the meaning. Steps, rankings, legal clauses. Attributes: `start="5"`, `reversed`, `type="a"`, and `value` on an `<li>`.
- **`<dl>`**: name–value groups. Glossaries, metadata ("Author: …, Published: …"), product specifications. Each group is one or more `<dt>` followed by one or more `<dd>`.

```html
<dl>
  <div>
    <dt>Weight</dt>
    <dd>1.2 kg</dd>
  </div>
  <div>
    <dt>Ports</dt>
    <dd>2 × USB-C</dd>
    <dd>HDMI</dd>
  </div>
</dl>
```

Wrapping each group in a `<div>` is allowed inside `<dl>` (and only there) to make styling possible.

Rules and traps:

- The only permitted children of `<ul>` and `<ol>` are `<li>` (plus `<script>` and `<template>`). A nested list goes *inside* an `<li>`, not directly inside the parent list.
- Do not fake lists with paragraphs starting with "•" or "1.", or with `<br>`-separated lines.
- Do not use a list for a single item, or `<ol>` just because you want numbers.
- Safari with VoiceOver deliberately stops announcing a list as a list when you remove its markers with `list-style: none`, outside of a `<nav>`. If the list semantics matter, add `role="list"` to the `<ul>`.
- Do not use `<dl>` for a dialogue or for arbitrary two-column layout.
- A menu of actions in an application is not necessarily a list of links; `role="menu"` is a specific desktop-style widget with its own keyboard contract, not a synonym for navigation.

**Try it:** Find a product page with a specification table or a "details" block and rewrite it as a `<dl>`. Then inspect a site's main navigation and check whether it is a `<ul>` inside a `<nav>`, and what the accessibility tree reports for it.

**Resources**
- [web.dev: Learn HTML, Lists](https://web.dev/learn/html/lists)
- [MDN: The Description List element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dl)
- [MDN: The Ordered List element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ol)

### Links vs buttons

The rule: if activating it takes the user to a URL, it is a link (`<a href>`). If it does something on the current page (submit, open, toggle, delete), it is a `<button>`. The distinction is not cosmetic; the two elements carry different built-in behaviour.

An `<a href>` gets: focus by Tab, activation with Enter, open in new tab or window, copy link address, a status-bar preview, visited styling, drag to bookmarks, crawling by search engines, and it works before or without JavaScript. Screen readers announce it as "link" and list it among the page's links.

A `<button>` gets: focus by Tab, activation with Enter *and* Space, form submission, the `disabled` attribute, and the "button" role.

A `<div onclick>` gets none of this. To make it equivalent to a button you need `role="button"`, `tabindex="0"`, a `keydown` handler for Enter, a `keyup` handler for Space, focus styling, and your own disabled handling. People forget at least two of these.

```html
<!-- Wrong: a button that navigates, and a link that acts -->
<button onclick="location.href='/pricing'">Pricing</button>
<a href="#" onclick="openMenu()">Menu</a>

<!-- Right -->
<a href="/pricing">Pricing</a>
<button type="button" aria-expanded="false" aria-controls="menu">Menu</button>
```

Details that matter:

- An `<a>` without `href` is not a link: it is not focusable and has no role. `href="#"` and `href="javascript:void(0)"` are signs that you wanted a button.
- Inside a form, give non-submitting buttons `type="button"`.
- A link styled to look like a button is fine. The element follows the behaviour, the look follows the design.
- The name comes from the content. "Click here" and "Read more" are useless out of context; an icon-only button needs an accessible name (visually hidden text or `aria-label`).
- Do not nest interactive elements: no button inside a link, no link inside a button.
- In single-page apps, client-side routes are still navigation. Use the router's link component, which renders an `<a href>`.

**Try it:** On a web app you use, tab through the header and middle-click (or Ctrl+click) each thing that navigates. Anything that does not open in a new tab is a fake link. Inspect it and note what element it really is.

**Resources**
- [MDN: The Anchor element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)
- [MDN: The Button element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button)
- [web.dev: Learn HTML, Links](https://web.dev/learn/html/links)

### Tables

A table is for data with two dimensions, where a cell's meaning comes from its row and its column. The markup's job is to record those relationships so a screen reader can announce "Revenue, Q2, 4.1 million" as the user moves around the grid.

```html
<table>
  <caption>Quarterly revenue, 2026 (millions)</caption>
  <thead>
    <tr>
      <th scope="col">Region</th>
      <th scope="col">Q1</th>
      <th scope="col">Q2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Europe</th>
      <td>3.8</td>
      <td>4.1</td>
    </tr>
  </tbody>
</table>
```

- **`<caption>`** is the table's accessible name and must be the first child. It is what a user hears when landing on the table or listing tables.
- **`<thead>`, `<tbody>`, `<tfoot>`** group rows. The parser inserts a `<tbody>` if you omit it.
- **`<th>`** marks a header cell; **`scope="col"`** or **`scope="row"`** says which cells it describes. The first cell of each data row is usually a row header.
- For headers that span groups, use `scope="colgroup"` or `rowgroup`; for truly irregular tables, the `headers` attribute pointing at `id`s. If you need that, consider splitting the table.
- `colspan` and `rowspan` merge cells; `<colgroup>` and `<col>` let you style columns.

Never use a table for page layout: it linearises badly, forces source order, and makes screen readers announce rows and columns that mean nothing. Layout is CSS Grid's job. HTML email is the one stubborn exception, where layout tables carry `role="presentation"`.

The opposite mistake is as common: building a data table out of `<div>`s and losing all the semantics.

Two practical gotchas. Setting `display: block`, `flex`, or `grid` on table elements for a responsive layout can strip their table semantics in the accessibility tree. The robust way to handle wide tables on small screens is to keep the table intact and let its wrapper scroll:

```html
<div role="region" aria-labelledby="rev-cap" tabindex="0" style="overflow-x: auto">
  <table>…<caption id="rev-cap">…</caption>…</table>
</div>
```

**Try it:** Mark up a train timetable or a pricing comparison with a caption and both row and column headers. Then turn on a screen reader and move through it with the table navigation keys (Ctrl+Alt+arrows in NVDA), listening for the headers on each cell.

**Resources**
- [W3C WAI: Tables tutorial](https://www.w3.org/WAI/tutorials/tables/)
- [web.dev: Learn HTML, Tables](https://web.dev/learn/html/tables)
- [MDN: The Table element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/table)

### Form fundamentals

A `<form>` is a declarative HTTP request. Submitting one makes the browser collect the controls' values, encode them, send them to the `action` URL using the `method`, and navigate to the response. No JavaScript is involved.

```html
<form action="/search" method="get">
  <label for="q">Search</label>
  <input id="q" name="q" type="search">
  <button>Go</button>
</form>
```

Typing "red shoes" and submitting navigates to `/search?q=red+shoes`.

- **`action`**: where to send. Omitted, it is the current URL.
- **`method="get"`** (the default) puts the data in the query string: right for searches and filters, because the result is bookmarkable and safe to repeat. **`method="post"`** puts it in the request body: required for anything that changes state or contains secrets.
- **`enctype`**: body encoding for `post`. The default is `application/x-www-form-urlencoded`. File inputs need `enctype="multipart/form-data"`, or only the file name is sent.

What gets submitted (the "form data set"): every control that has a `name`, is not `disabled`, and, for checkboxes and radios, is checked. Consequences:

- No `name`, no data.
- `disabled` fields are omitted; `readonly` fields are sent.
- An unchecked checkbox sends nothing. A checked one without a `value` sends `on`.
- Only the submit button that was actually used contributes its `name`/`value`, which lets one form have "Save" and "Delete" buttons.

Submission is triggered by a submit button (`<button>` defaults to `type="submit"`) or by pressing Enter in a text field (**implicit submission**). Before sending, the browser runs constraint validation and blocks the submit if any field is invalid.

Buttons can override the form with `formaction`, `formmethod`, and `formnovalidate`. A control outside the `<form>` element can join it with `form="form-id"`. Forms cannot be nested.

Even in a JavaScript application, keep the real `<form>` and handle its `submit` event. You keep Enter-to-submit, validation, autofill, and password manager support, and `new FormData(form)` hands you all the values.

After a successful POST, servers should respond with a redirect (303) so a reload does not resubmit.

**Try it:** Build a form with a text field, an unnamed text field, a checked and an unchecked checkbox, a disabled input, and two submit buttons with different `name`/`value`. Submit it with `method="get"` to any URL and read the query string. Account for every field that is present or missing.

**Resources**
- [MDN: Sending form data](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_and_retrieving_form_data)
- [MDN: The Form element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form)
- [web.dev: Learn Forms, The form element in depth](https://web.dev/learn/forms/form-element)

### Labels

A label gives a form control its **accessible name**, the text a screen reader announces on focus and that voice-control users speak to target the field. It also makes the text clickable: clicking a label focuses or toggles its control, which turns a 16-pixel checkbox into a comfortable target.

Two ways to associate them:

```html
<!-- Explicit: for matches id. Works anywhere in the document. -->
<label for="email">Email address</label>
<input id="email" name="email" type="email">

<!-- Implicit: the control is inside the label. -->
<label>
  <input type="checkbox" name="news"> Send me the newsletter
</label>
```

Explicit association is the most robust across assistive technologies, and you can combine both. The `for` value must match an `id`, not a `name`, and that `id` must be unique: with duplicate ids the label attaches to the first one, which in a list of repeated components is usually the wrong one.

What does not count as a label:

- **`placeholder`**. It vanishes as soon as the user types, is often too faint to read, and is not reliably exposed as a name. Use it only for an example of the format, if at all.
- Text that merely sits next to the input in a `<div>` or `<span>`.
- `title`, which is a tooltip unavailable to touch and most keyboard users.

When the design has no visible label (a search field with a magnifier icon), still provide one: a `<label>` hidden with a visually-hidden CSS class, or `aria-label` on the input. A visible label is better for everyone.

Extra help text and error messages are attached with `aria-describedby`, which is read after the name:

```html
<label for="pw">Password</label>
<input id="pw" name="password" type="password" aria-describedby="pw-hint">
<p id="pw-hint">At least 12 characters.</p>
```

Do not put other interactive elements (links, buttons) inside a label, and keep the label text short; long text belongs in the description. Groups of controls are labelled as a whole with `<fieldset>` and `<legend>`.

**Try it:** Open a form on any site, select each input in the Elements panel, and read "Name" in the Accessibility pane. Find one where the name is empty or comes from a placeholder. Also check the Issues panel for "no label associated with a form field". Then click each label and see whether focus moves to the control.

**Resources**
- [W3C WAI: Labeling controls](https://www.w3.org/WAI/tutorials/forms/labels/)
- [MDN: The Label element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)

### Input types

The `type` attribute on `<input>` selects the control's behaviour: which on-screen keyboard appears, what validation runs, what picker is shown, and how autofill treats it. Unknown types fall back to `text`, so newer types are always safe.

| Type | Gives you |
| --- | --- |
| `email` | A keyboard with `@`; validation that the value looks like an address |
| `tel` | A phone keypad; no validation, because formats vary too much |
| `url` | A keyboard with `/` and `.com`; requires a scheme |
| `search` | A clear button and a "search" Enter key on some platforms |
| `password` | Obscured text; password manager integration |
| `number` | Spin buttons; rejects non-numeric input; `min`, `max`, `step` |
| `date`, `time`, `datetime-local`, `month`, `week` | Native pickers |
| `range`, `color`, `file`, `checkbox`, `radio`, `hidden` | Specialised controls |

Things the table hides:

- **`type="number"` is for quantities, not for strings of digits.** It drops leading zeros, accepts `e` and `-`, can change value on scroll or arrow keys, and returns `""` for anything it cannot parse. For card numbers, postcodes, verification codes, and phone numbers use `type="text"` with **`inputmode="numeric"`** (and a `pattern` if you need validation).
- `inputmode` controls only the virtual keyboard (`numeric`, `decimal`, `tel`, `email`, `url`, `search`, `none`). `enterkeyhint` sets the Enter key's label (`search`, `send`, `next`, `done`).
- `email` validation is deliberately loose: `a@b` passes. Add `multiple` to accept a comma-separated list.
- **Date inputs always submit `yyyy-mm-dd`**, whatever format the user's locale displays. `min` and `max` use the same format. The pickers look different in every browser and are hard to style; that is the trade-off for getting accessibility and localisation for free.
- `step` affects validity: `type="number"` defaults to `step="1"`, so `1.5` is invalid unless you set `step="0.1"` or `step="any"`.
- For file inputs, `accept="image/*"` filters the picker and `capture` opens the camera on mobile. Neither is a security check.

**Try it:** Build a page with one input of each type in the table plus a `text` input with `inputmode="numeric"`, and open it on your phone (deploy it, or use DevTools remote debugging). Note the keyboard for each. On desktop, type `1e5`, `-`, and `007` into the number input and log its `.value` each time.

**Resources**
- [MDN: The Input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input)
- [MDN: inputmode global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)
- [GOV.UK: Why the Design System team changed the input type for numbers](https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers/)

### Other controls

**`<select>`** offers a choice from a list. Each `<option>` submits its `value`, or its text if there is none. `<optgroup label>` groups options; `multiple` allows several selections but is awkward to use, and checkboxes are usually better. The standard way to force a deliberate choice:

```html
<label for="country">Country</label>
<select id="country" name="country" required>
  <option value="">Choose a country</option>
  <option value="fi">Finland</option>
  <option value="se">Sweden</option>
</select>
```

`required` works because the first option's value is empty. Fully styleable selects (`appearance: base-select`) exist but are not yet available in all major browsers, so treat them as an enhancement.

**`<textarea>`** is multi-line text. It has no `value` attribute: the initial value is its content, and whitespace between the tags counts, so do not indent the closing tag. `rows` and `cols` set a default size; `maxlength` and `minlength` apply.

**Checkboxes** are independent on/off choices. Several can share one `name` to submit multiple values. The "indeterminate" state exists only as a JavaScript property (`el.indeterminate = true`) and is purely visual.

**Radio buttons** are one choice from a set, grouped by sharing a `name`. A group is a single tab stop; arrow keys move between options. `required` on any one radio makes the group required. Once one is selected the user cannot return to "none", so include an explicit "No preference" option if that is a valid answer.

**`<fieldset>` and `<legend>`** group related controls and name the group. Without them a screen reader user hears "Yes, radio button, 1 of 2" with no idea what the question was.

```html
<fieldset>
  <legend>Delivery speed</legend>
  <label><input type="radio" name="speed" value="standard" checked> Standard</label>
  <label><input type="radio" name="speed" value="express"> Express</label>
</fieldset>
```

`<fieldset disabled>` disables every control inside it at once, which is a neat way to lock a form while it submits.

Rules of thumb for choosing: up to about five mutually exclusive options, radios (all visible, one click); more, a select; a very long list, an `<input list>` with a `<datalist>` or a proper combobox. Two also deserve a mention: `<output>` for calculated results and `<progress>`/`<meter>` for measurements.

**Try it:** Build a "pizza order" form: size as radios in a fieldset, toppings as checkboxes sharing a name, a required select for delivery slot with a placeholder option, and a textarea for notes. Submit with `method="get"` and read the query string. Then navigate the whole form by keyboard only.

**Resources**
- [MDN: The Select element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select)
- [MDN: The Fieldset element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fieldset)
- [W3C WAI: Grouping controls](https://www.w3.org/WAI/tutorials/forms/grouping/)

### Built-in validation

Browsers validate form fields against constraints you declare in HTML, block submission while any are unmet, focus the first invalid field, and show a localised message. All without script.

| Attribute | Constraint |
| --- | --- |
| `required` | Must have a value (or be checked) |
| `type="email"`, `type="url"` | Must match the type's syntax |
| `pattern="…"` | Whole value must match the regular expression |
| `min`, `max`, `step` | Numeric and date ranges and granularity |
| `minlength`, `maxlength` | Length of text |

```html
<label for="code">Promo code</label>
<input id="code" name="code" required
       pattern="[A-Z]{3}-[0-9]{4}"
       title="Three capital letters, a dash, four digits, like ABC-1234">
```

Details worth knowing:

- `pattern` is implicitly anchored at both ends, so do not add `^` and `$`. It is not checked when the field is empty; combine it with `required`. The `title` text is appended to the browser's error message.
- `minlength` is only enforced after the user edits the field; a pre-filled short value passes.
- `maxlength` prevents typing beyond the limit rather than producing an error.

In CSS, **`:invalid`** and **`:valid`** match immediately, so a required empty field is styled as an error before the user has typed anything. Use **`:user-invalid`** and **`:user-valid`**, which only match after the user has interacted with the field or tried to submit:

```css
input:user-invalid { border-color: crimson; }
```

Other useful states: `:required`, `:optional`, `:in-range`, `:out-of-range`, `:placeholder-shown`.

To opt out, put `novalidate` on the form, or `formnovalidate` on one button (for "Save draft"). From JavaScript, `checkValidity()`, `reportValidity()`, the `validity` object, and `setCustomValidity('message')` let you extend the same system instead of replacing it.

Limitations to design around: the default error bubbles cannot be styled, disappear after a few seconds, and are announced inconsistently by screen readers, so production forms often add their own inline messages on top. And client-side validation is a convenience for the user, never a security measure. Anyone can send any request with `curl`. The server must validate everything again.

**Try it:** Build a form with a required email, a number from 1 to 10 in steps of 0.5, and the patterned field above. Style with `:invalid`, look at the page on load, then switch to `:user-invalid` and compare. In the Console, inspect `$0.validity` for a field in each failing state and find which flag is `true`.

**Resources**
- [MDN: Client-side form validation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation)
- [MDN: Using HTML form validation and the Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation)
- [MDN: :user-invalid](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid)

### Autofill

Browsers and password managers can fill forms for the user, but only if they can tell what each field is. Guessing from labels and names is unreliable; the `autocomplete` attribute states it outright. Good autofill measurably increases form completion, especially on phones.

```html
<label for="name">Full name</label>
<input id="name" name="name" autocomplete="name">

<label for="email">Email</label>
<input id="email" name="email" type="email" autocomplete="email">

<label for="new-pw">Password</label>
<input id="new-pw" name="password" type="password" autocomplete="new-password">
```

Tokens you will use constantly:

- Identity: `name`, `given-name`, `family-name`, `email`, `tel`, `bday`, `organization`.
- Address: `street-address`, `address-line1`, `address-level2` (city), `address-level1` (state or region), `postal-code`, `country`.
- Credentials: `username`, `current-password` (sign-in), `new-password` (sign-up and change-password; triggers the password generator), `one-time-code` (SMS and authenticator codes).
- Payment: `cc-name`, `cc-number`, `cc-exp`, `cc-csc`.

Tokens can be prefixed with `shipping` or `billing`, and with `section-*` to tell apart repeated groups on one page: `autocomplete="section-gift shipping postal-code"`.

Rules that make it work:

- Give every field a stable, conventional `name` and `id` (`email`, not `field_7`). Browsers use them as hints, and password managers rely on them.
- Use `username` on the sign-in identifier even if it is an email address, with `current-password` on the password. On a change-password form, include the username as well (it can be a hidden or read-only field) so the manager knows which account to update.
- Keep sign-up and sign-in as real `<form>` elements that actually submit or navigate. Managers offer to save credentials when they see a successful submission.
- Do not split one value across several inputs (four boxes for a card number, six for a code). One input with the right `autocomplete` and `inputmode` works better.
- Do not block paste on password or code fields, and do not use `autocomplete="off"` to fight password managers: browsers deliberately ignore it for credentials, and blocking them pushes users to weaker passwords.
- `autocomplete="off"` is appropriate for genuinely one-off values such as a CAPTCHA answer.

**Try it:** Save a test address in your browser's settings, then build a shipping form with correct tokens and confirm one click fills everything. Remove the `autocomplete` attributes and rename the fields `f1`, `f2`, and so on; try again. Check the Issues panel in Chrome for autocomplete warnings.

**Resources**
- [MDN: HTML attribute: autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)
- [web.dev: Learn Forms, Autofill](https://web.dev/learn/forms/autofill)
- [HTML Standard: Autofill](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)

### Images

The `alt` attribute is the image's replacement: what should be there if the image cannot be seen, because the user is blind, the image failed to load, or the reader is a search crawler. Write it by asking what the image *contributes at this spot in the page*, not what it depicts.

- **Informative image**: convey the information. `alt="Bar chart: sales doubled from 2024 to 2026"`, not `alt="chart"`.
- **Image that is the only content of a link or button**: describe the destination or action. A logo linking home is `alt="Acme home"`; a magnifier icon in a button is `alt="Search"`.
- **Decorative image** (a flourish, a stock photo that adds mood, an icon next to text that already says the same thing): `alt=""`. The empty value tells assistive technology to skip it.
- **Image of text**: the text itself. Better, use real text.
- **Complex image** (diagram, data chart): a short `alt` identifying it, plus the full description in adjacent text or a linked page.

The critical distinction: **`alt=""` is not the same as no `alt`**. With the attribute missing, a screen reader may fall back to reading the file name: "IMG underscore 4032 dot jpeg". An empty `alt` is a deliberate statement that the image carries no content. Every `<img>` must have the attribute.

Writing tips:

- Do not start with "Image of" or "Picture of"; the role is already announced. Mentioning the medium is fine when it matters ("Oil painting of…").
- Keep it to a sentence or two. End with a full stop so screen readers pause.
- Context decides. The same photo of a dog might be `alt="Golden retriever puppy"` on a breed page, `alt=""` in a blog post about weekends, and `alt="Bella, available for adoption"` on a shelter listing.
- A `<figcaption>` supplements `alt`; it does not replace it. Do not repeat the same text in both.
- `title` is not a substitute for `alt`.
- Purely decorative images are often better as CSS backgrounds, which keeps them out of the HTML entirely.

**Try it:** Take a news article with five or more images. For each, decide: informative, functional, decorative, or complex, then write the `alt`. Compare with what the site actually has (`$$('img').map(i => i.alt)`). Use the W3C alt decision tree for any you are unsure about.

**Resources**
- [W3C WAI: An alt decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/)
- [MDN: The Image Embed element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img)
- [web.dev: Learn HTML, Images](https://web.dev/learn/html/images)

### Responsive images

One image file cannot suit both a phone and a 4K monitor: either the phone downloads far too much or the monitor shows a blur. Responsive image markup offers the browser several candidates and enough information to choose.

**Resolution switching** is the common case: same picture, different sizes.

```html
<img
  src="hero-800.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1600.jpg 1600w"
  sizes="(min-width: 60rem) 50vw, 100vw"
  width="1600" height="900"
  alt="Cyclist crossing a bridge at dawn">
```

- `srcset` lists files with their **intrinsic widths** in pixels (the `w` descriptor).
- `sizes` tells the browser how wide the image will be *displayed*, in CSS units, under each media condition. The first match wins; the last entry is the default. It is needed because the browser chooses the file before CSS and layout are available.
- The browser multiplies the display width by the device pixel ratio and picks a candidate. On a 390px-wide phone with a 3× screen, `100vw` is 390 CSS px, so it needs about 1170 device pixels and chooses `hero-1600.jpg`.

If you omit `sizes`, the browser assumes `100vw` and over-fetches for any image narrower than the viewport. Getting `sizes` wrong is the most common mistake. For lazy-loaded images, `sizes="auto"` lets the browser use the actual layout width; it is long-standing in Chromium but reached Firefox and Safari only in 2026, so write `sizes="auto, (min-width: 60rem) 50vw, 100vw"` to give older browsers a fallback. It is valid only together with `loading="lazy"`.

For fixed-size images such as avatars, use density descriptors instead: `srcset="a.png 1x, a@2x.png 2x"`.

**`<picture>`** is for when the browser must not choose freely:

```html
<picture>
  <source media="(max-width: 40rem)" srcset="hero-tall.avif" type="image/avif" width="800" height="1200">
  <source srcset="hero-wide.avif" type="image/avif">
  <img src="hero-wide.jpg" alt="Cyclist crossing a bridge at dawn" width="1600" height="900">
</picture>
```

- **Art direction**: `media` on `<source>` swaps in a different crop. Unlike `srcset`, these conditions are binding.
- **Format selection**: `type` offers AVIF or WebP with a fallback. The first `<source>` the browser supports wins.

The `<img>` inside is required: it carries the `alt`, the fallback, and is the element that actually renders and that you style.

In practice an image CDN or your framework's image component generates the variants; you still need to supply an accurate `sizes`.

**Try it:** Put the first example on a page using any image at three sizes. In DevTools, hover the `<img>` in the Elements panel to see "current source", or read `$0.currentSrc`. Change the viewport width and the emulated device pixel ratio, reloading with the cache disabled each time, and predict the file before you look.

**Resources**
- [MDN: Using responsive images in HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images)
- [web.dev: Learn Images, Descriptive syntaxes](https://web.dev/learn/images/descriptive)
- [web.dev: Learn Images, Prescriptive syntaxes](https://web.dev/learn/images/prescriptive)

### Image performance

Four attributes on `<img>` control how an image affects loading and layout.

**`width` and `height`**: always set them to the image's intrinsic pixel dimensions. Browsers use the pair to compute an aspect ratio and reserve the space *before* the file arrives, so content below does not jump when it loads. That jump is **layout shift** (CLS). With `height: auto` in CSS, the image still scales fluidly:

```css
img { max-width: 100%; height: auto; }
```

**`loading="lazy"`** defers fetching until the image is near the viewport. Use it for everything below the fold. Do not use it on above-the-fold images, least of all the hero: the browser must run layout before it knows a lazy image is visible, which delays your largest paint.

**`fetchpriority="high"`** raises the fetch priority. Images start at low priority and are boosted only after layout shows they are in the viewport; this hint removes that delay. Put it on the one image likely to be the Largest Contentful Paint element, and nowhere else: if everything is high priority, nothing is.

**`decoding="async"`** lets the browser decode the image off the main thread so other content is not held up. It is a mild hint, safe on most images.

```html
<!-- The LCP image: eager by default, prioritised -->
<img src="hero.avif" width="1600" height="900" fetchpriority="high" alt="…">

<!-- Below the fold -->
<img src="team.avif" width="800" height="600" loading="lazy" decoding="async" alt="…">
```

More that matters:

- An image set as a CSS `background-image` or injected by JavaScript is invisible to the preload scanner and starts late. Keep the LCP image as an `<img>` in the HTML.
- Lazy loading is disabled when JavaScript is turned off (a privacy measure, so that image requests cannot be used to track scroll position).
- A lazy image without dimensions has zero height until it loads, which causes both layout shift and many images loading at once.
- Format and size dominate everything here. AVIF and WebP are supported in all current browsers; serve images at the size they are displayed.

**Try it:** Run Lighthouse on a page with a hero image and find the "Largest Contentful Paint element" and "Avoid large layout shifts" audits. In the Network panel, add the Priority column and reload: note the hero's initial priority. Add `fetchpriority="high"`, reload, compare. Then remove `width`/`height` from a below-the-fold image, throttle to Slow 4G, and watch the page jump.

**Resources**
- [web.dev: Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [web.dev: Browser-level image lazy loading for the web](https://web.dev/articles/browser-level-image-lazy-loading)
- [web.dev: Optimize resource loading with the Fetch Priority API](https://web.dev/articles/fetch-priority)

### Video and audio

`<video>` and `<audio>` give you a native player with one attribute:

```html
<video controls preload="metadata" poster="talk-poster.jpg" width="1280" height="720">
  <source src="talk.webm" type="video/webm">
  <source src="talk.mp4" type="video/mp4">
  <track kind="captions" src="talk.en.vtt" srclang="en" label="English" default>
  <track kind="subtitles" src="talk.es.vtt" srclang="es" label="Español">
  <p><a href="talk.mp4">Download the video</a></p>
</video>
```

- **`controls`** shows the browser's player UI, which is keyboard-accessible. Without it there are no controls at all, so the only reasons to omit it are a custom player or a purely decorative loop.
- **`<source>`** elements are tried in order; the browser plays the first `type` it supports. MP4 (H.264 + AAC) plays everywhere; WebM (VP9 or AV1) is usually smaller.
- **`preload`** is a hint. `none` fetches nothing until play; `metadata` fetches duration and dimensions (and usually the first frame); `auto` may download the whole file. Default to `metadata`, or `none` with a `poster` on pages with many videos. Browsers may ignore it on metered connections.
- **`poster`** is the image shown before playback. `width` and `height` reserve space as they do for images.
- Content inside the element is a fallback for browsers with no support.

**Captions** are an accessibility requirement, and many people watch muted. A `<track>` points to a **WebVTT** file:

```text
WEBVTT

00:00:01.000 --> 00:00:04.000
Welcome to the talk.

00:00:04.500 --> 00:00:07.000
[audience laughs]
```

`kind="captions"` is for viewers who cannot hear: dialogue plus relevant sounds. `kind="subtitles"` translates dialogue for viewers who can hear. `srclang` is required for subtitles, `label` appears in the menu, and `default` turns a track on. Track files must be same-origin unless the video has a `crossorigin` attribute and the server sends CORS headers. For audio-only content, provide a transcript.

**Autoplay**: browsers block autoplay with sound. A silent, decorative loop needs all of `autoplay muted loop playsinline` (`playsinline` stops iOS going full screen). Respect `prefers-reduced-motion`, and give anything that moves for more than five seconds a way to pause.

Do not use animated GIFs for video-like content; a muted looping `<video>` is a fraction of the size.

**Try it:** Take any short MP4, write a five-cue `.vtt` file by hand, and wire them up with `controls` and a `<track default>`. Serve the folder with a local server (tracks do not load from `file://`). Then switch `preload` between `none`, `metadata`, and `auto` and watch the bytes fetched in the Network panel before you press play.

**Resources**
- [MDN: The Video Embed element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video)
- [MDN: The Embed Text Track element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track)
- [web.dev: Learn HTML, Audio and video](https://web.dev/learn/html/audio-video)

### SVG

SVG is an XML-based vector format: shapes described by coordinates, sharp at any size. You can embed it two main ways, with different trade-offs.

**Inline**, as markup in the document:

```html
<button type="button">
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M5 12h14M12 5v14"/>
  </svg>
  Add item
</button>
```

The SVG's elements are part of the DOM. You can style them with page CSS, inherit the text colour through `currentColor`, animate parts, and attach event handlers. There is no extra request. The costs: it bloats the HTML, is not cached separately, and is repeated on every use (a sprite with `<use href="#id">` mitigates this).

**As a file**, through `<img src="logo.svg" alt="Acme">`: cached like any image, keeps the HTML small, and is sandboxed: scripts inside do not run and external resources do not load. But page CSS cannot reach inside it, so you cannot recolour it on hover or for dark mode.

Rule of thumb: icons and anything you need to style or animate go inline; logos, illustrations, and large or complex graphics go in `<img>`.

**`viewBox="min-x min-y width height"`** defines the SVG's internal coordinate system: the rectangle of user space that should be mapped onto the element's box. With `viewBox="0 0 24 24"`, the drawing uses coordinates from 0 to 24, whatever size it is displayed at. The `width` and `height` attributes (or CSS) set the displayed size; the viewBox is scaled to fit, preserving aspect ratio and centring by default (`preserveAspectRatio="xMidYMid meet"`).

An SVG with `width` and `height` but no `viewBox` does not scale: resizing it crops or pads instead. If you must delete one, never delete the `viewBox`. Changing the viewBox numbers pans and zooms: `viewBox="6 6 12 12"` on the icon above shows only its middle, magnified.

Accessibility: a decorative or redundant inline SVG takes `aria-hidden="true"`. A meaningful one takes `role="img"` and an `aria-label` (or a `<title>` child referenced with `aria-labelledby`). Never embed untrusted SVG inline: it can contain script.

Run exported SVG through SVGO or SVGOMG; design tools produce a lot of dead weight.

**Try it:** Paste the icon above into a page. Change `width`/`height` to 96 and observe that it scales. Remove the `viewBox` and observe that it does not. Restore it and try `viewBox="0 0 48 48"` and `viewBox="6 6 12 12"`, predicting each result. Finally set `color: tomato` on the button.

**Resources**
- [MDN: viewBox](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox)
- [MDN: The svg element](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/svg)
- [Sara Soueidan: Understanding SVG coordinate systems and transformations, part 1](https://www.sarasoueidan.com/blog/svg-coordinate-systems/)

### iframes

An `<iframe>` embeds another document, with its own URL, DOM, scripts, and origin, inside yours. The same-origin policy stops a cross-origin frame from reading your page's DOM or cookies, but an embedded page can still run script, open pop-ups, navigate the top window, show prompts, and consume CPU. The attributes exist to limit that.

```html
<iframe
  src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
  title="Video: Building accessible forms"
  width="560" height="315"
  loading="lazy"
  sandbox="allow-scripts allow-same-origin allow-presentation"
  allow="fullscreen; picture-in-picture"
  referrerpolicy="strict-origin-when-cross-origin"></iframe>
```

- **`title`** is the frame's accessible name. Screen readers list frames by title; without one the user hears "frame" or a URL. Describe the content.
- **`loading="lazy"`** defers loading the whole embedded document, with its scripts and trackers, until it is near the viewport. It is one of the cheapest performance wins available for off-screen embeds.
- **`sandbox`** with an empty value applies every restriction: scripts off, forms off, pop-ups off, top-level navigation off, and the content is treated as a unique opaque origin with no access to its own cookies or storage. You then add back only what is needed with tokens such as `allow-scripts`, `allow-forms`, `allow-popups`, and `allow-same-origin`.
- **`allow`** is a Permissions Policy: it delegates powerful features (camera, microphone, geolocation, fullscreen) that cross-origin frames do not get by default.
- `width` and `height` reserve space and prevent layout shift.

The sandbox trap: `allow-scripts` together with `allow-same-origin` on content from **your own origin** is equivalent to no sandbox, because the framed script can reach up into the parent and remove the attribute. That combination is only meaningful for cross-origin content. To display untrusted HTML, serve it from a separate origin, or use `srcdoc` with a sandbox that omits `allow-same-origin`.

The other direction matters too: to stop other sites framing *your* pages (clickjacking), send the `Content-Security-Policy: frame-ancestors 'self'` response header. Many sites do this, which is why they refuse to load in your iframe.

Frames communicate through `postMessage`; always check `event.origin` on receipt. For heavy third-party embeds, consider a facade: a static thumbnail that loads the real iframe on click.

**Try it:** Embed a page of your own in an iframe with `sandbox=""` and note what breaks (scripts, forms, links with `target="_top"`). Add tokens back one at a time. Then try to embed `https://github.com` and read the Console error to see which header blocked it.

**Resources**
- [MDN: The Inline Frame element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)
- [web.dev: Play safely in sandboxed IFrames](https://web.dev/articles/sandboxed-iframes)
- [web.dev: It's time to lazy-load offscreen iframes](https://web.dev/articles/iframe-lazy-loading)

### `dialog`

The `<dialog>` element is a native modal. Opened with `showModal()`, the browser does the difficult parts for you:

- Renders it in the **top layer**, above everything regardless of `z-index` or `overflow`.
- Makes the rest of the page **inert**: not clickable, not focusable, hidden from assistive technology.
- Moves focus into the dialog, and returns it to the previously focused element on close.
- Closes on Esc, firing a `cancel` event and then `close`.
- Provides a styleable `::backdrop` and the `dialog` role with `aria-modal` semantics.

```html
<button type="button" commandfor="confirm" command="show-modal">Delete project</button>

<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Delete this project?</h2>
  <p>This cannot be undone.</p>
  <form method="dialog">
    <button value="cancel" autofocus>Cancel</button>
    <button value="delete">Delete</button>
  </form>
</dialog>
```

```js
const dialog = document.getElementById('confirm');
dialog.addEventListener('close', () => {
  if (dialog.returnValue === 'delete') deleteProject();
});
```

A `<form method="dialog">` closes the dialog on submit instead of sending a request, and sets `dialog.returnValue` to the submitting button's `value`.

The trigger button uses `command` and `commandfor` to open the dialog without script; see Invoker commands below. The script equivalent is `dialog.showModal()` in a click handler.

Three ways to open, and they are not equivalent:

- `showModal()`: modal, with everything above.
- `show()`: non-modal; no backdrop, no inertness, no top layer.
- The `open` attribute in HTML: the same as `show()`. Do not add or remove `open` yourself to toggle a modal; it skips the modal behaviour and the `close` event.

Details: give the dialog a name with `aria-labelledby`. Put `autofocus` on the element the user should start at; for destructive confirmations that is the safe choice. To prevent closing with Esc while a save is in progress, call `preventDefault()` on `cancel`. Closing on a click outside is controlled by the `closedby` attribute (`any`, `closerequest`, `none`); it is supported in Chromium and Firefox but not yet in stable Safari, so the fallback is a click handler that checks `event.target === dialog`. The browser does not lock page scrolling for you; add `html:has(dialog[open]:modal) { overflow: hidden; }` if you need that.

**Try it:** Build the confirm dialog above. Verify with the keyboard that Tab stays inside it, Esc closes it, and focus returns to the trigger. Log `returnValue` for each button and for Esc. Then change `showModal()` to `show()` and list everything you lost.

**Resources**
- [MDN: The Dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
- [web.dev: Learn HTML, Dialog](https://web.dev/learn/html/dialog)
- [HTML Standard: The dialog element](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)

### `details` and `summary`

`<details>` is a disclosure widget: a visible `<summary>` that toggles the rest of the content. It needs no JavaScript, is keyboard operable, and is exposed to assistive technology with its expanded or collapsed state.

```html
<details>
  <summary>Shipping and returns</summary>
  <p>Orders ship within two working days.</p>
  <p>Returns are free for 30 days.</p>
</details>
```

- The `open` boolean attribute reflects and controls the state. Add it in HTML to start expanded; toggle it from script with `details.open = true`.
- `<summary>` must be the first child. Without one, the browser supplies a localised "Details" label.
- A `toggle` event fires on the `<details>` element after the state changes.
- Giving several `<details>` elements the same **`name`** makes them an exclusive accordion: opening one closes the others. This is available in all current browsers.

```html
<details name="faq" open>
  <summary>Do you ship abroad?</summary>
  <p>Yes, to most countries.</p>
</details>
<details name="faq">
  <summary>Can I change my order?</summary>
  <p>Until it ships.</p>
</details>
```

An advantage over hand-rolled accordions: collapsed content remains in the DOM, and browsers can search it. Find-in-page will expand a closed `<details>` that contains a match, a behaviour that began in Chromium and has been spreading to the other engines.

Styling: the marker is the `::marker` of the summary (it has `display: list-item`), so `summary { list-style: none; }` removes it; older Safari versions need `summary::-webkit-details-marker { display: none; }`. Target the open state with `details[open]`. The content area is exposed as the `::details-content` pseudo-element in newer browsers, which is what makes animating open and close possible in CSS.

Mistakes to avoid:

- Putting a heading *around* the summary. The summary can *contain* a heading (`<summary><h3>…</h3></summary>`), though screen reader support for navigating to it is uneven.
- Putting links or buttons inside `<summary>`: the whole summary is already one interactive control.
- Using exclusive accordions for content people need to compare. Forcing one panel shut to open another is often worse than letting several stay open.
- Using `<details>` for things it is not: a navigation menu, a tooltip, or a modal. Those have their own patterns (popover, dialog).

**Try it:** Build a four-question FAQ with `name` grouping. Operate it with only the keyboard. Use find-in-page for a word inside a collapsed answer and see what your browser does. Then restyle the marker as a `+` that becomes `−` when open, using only CSS.

**Resources**
- [MDN: The Details disclosure element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details)
- [web.dev: Learn HTML, Details and summary](https://web.dev/learn/html/details)

### Popover API

The `popover` attribute turns any element into one that is hidden by default and, when shown, appears in the **top layer** above everything else: no `z-index` battles, no clipping by an ancestor's `overflow: hidden`. A button controls it declaratively:

```html
<button type="button" popovertarget="account-menu">Account</button>

<div id="account-menu" popover>
  <a href="/settings">Settings</a>
  <a href="/billing">Billing</a>
  <button type="button">Sign out</button>
</div>
```

`popover` with no value means `popover="auto"`, which gives you:

- **Light dismiss**: clicking outside or pressing Esc closes it.
- Opening another auto popover closes this one (nested popovers excepted).
- Focus returns to the invoker on close, and the browser wires the button's expanded state for assistive technology.

`popover="manual"` has no light dismiss and does not close others; you close it explicitly. It suits toasts and notifications. `popover="hint"` is for tooltips: opening a hint does not close an open auto popover. It is supported in Chromium and Firefox but not yet Safari.

`popovertargetaction` on the button can be `toggle` (default), `show`, or `hide`. From script: `showPopover()`, `hidePopover()`, `togglePopover()`, plus `beforetoggle` and `toggle` events. In CSS, `:popover-open` matches while shown and `::backdrop` is available.

What a popover is *not*: it is **not modal**. The rest of the page stays interactive and focus is not trapped. If the user must respond before continuing, use `<dialog>` with `showModal()`.

Things you still have to do:

- **Semantics.** `popover` adds behaviour, not a role. A generic panel needs nothing more, but if you build a true menu or tooltip, add the right roles (`role="menu"`, `role="tooltip"` with `aria-describedby`) and the expected keyboard handling.
- **Positioning.** By default a popover is centred in the viewport. Place it beside its button with CSS anchor positioning; the invoker is the popover's implicit anchor. Anchor positioning reached Baseline only in 2026, so older browsers still need a fallback position.
- **Hover and focus triggers.** `popovertarget` works on click only. Tooltips that open on hover or focus need script today; the declarative `interestfor` attribute is not yet cross-browser.

`popovertarget` works only on `<button>` and `<input type="button">`. The newer, more general `commandfor` syntax is covered under Invoker commands.

**Try it:** Build the menu above. Confirm that Esc and an outside click close it and that focus returns to the button. Place the popover inside a container with `overflow: hidden` and `z-index: 0` and confirm it still appears on top. Switch to `popover="manual"` and note what stops working. Then position it under the button with `top: anchor(bottom); left: anchor(left); margin: 0;`.

**Resources**
- [MDN: Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [MDN: Using the Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using)
- [MDN: popover global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover)

### Invoker commands

Invoker commands let a button operate another element declaratively. `commandfor` holds the `id` of the target; `command` says what to do to it. They generalise `popovertarget`, which only handled popovers, to dialogs and to your own custom actions.

```html
<button type="button" commandfor="settings" command="show-modal">Settings</button>

<dialog id="settings" aria-labelledby="settings-title">
  <h2 id="settings-title">Settings</h2>
  <button type="button" commandfor="settings" command="close" value="dismissed">Close</button>
</dialog>

<button type="button" commandfor="tips" command="toggle-popover">Tips</button>
<div id="tips" popover>Press ? for keyboard shortcuts.</div>
```

The built-in commands:

| `command` | Target | Equivalent to |
| --- | --- | --- |
| `show-modal` | `<dialog>` | `dialog.showModal()` |
| `close` | `<dialog>` | `dialog.close()`; the button's `value` becomes `returnValue` |
| `request-close` | `<dialog>` | `dialog.requestClose()`: fires `cancel` first, which a listener can prevent |
| `show-popover`, `hide-popover`, `toggle-popover` | A `popover` element | `showPopover()`, `hidePopover()`, `togglePopover()` |

There is deliberately no command for the non-modal `show()`.

Why bother when one line of JavaScript does the same? The control works as soon as the HTML is parsed, before any script has loaded or hydrated; there is no listener to attach, leak, or forget; and the browser knows the relationship between button and target, so it can expose the expanded state of a popover to assistive technology for you.

**Custom commands** start with two dashes. The browser does nothing itself, but dispatches a `command` event on the target, giving you a tidy way to wire several buttons to one element:

```html
<button type="button" commandfor="player" command="--play-pause">Play / Pause</button>
<video id="player" src="clip.mp4"></video>
```

```js
player.addEventListener('command', (event) => {
  if (event.command === '--play-pause') {
    player.paused ? player.play() : player.pause();
  }
  // event.source is the button that was pressed
});
```

Things to know:

- Only `<button>` elements can be invokers. Give them `type="button"`: a button with an explicit `type="submit"` inside a `<form>` submits the form and ignores its command.
- The target must be in the same document or shadow tree; from script you can set `button.commandForElement` to an element directly.
- An unknown command without the `--` prefix does nothing, silently. A typo such as `command="showmodal"` fails with no error.
- The feature became Baseline in December 2025, so it is in the current version of every major browser but missing from ones only a year or two old. Detect it with `'commandForElement' in HTMLButtonElement.prototype` and attach click handlers as a fallback if you support those.

**Try it:** Build a page with a dialog and a popover controlled only by `command` buttons, with no `<script>` at all, and verify opening, closing, Esc, and focus return. Then add a button with `command="request-close"` and a `cancel` listener that calls `preventDefault()` while a checkbox is unticked. Finally add a custom `--toggle-theme` command targeting `<html>` and handle it in one listener.

**Resources**
- [MDN: Invoker Commands API](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API)
- [MDN: The Button element (command and commandfor)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button)
- [Chrome for Developers: Introducing command and commandfor](https://developer.chrome.com/blog/command-and-commandfor)

### `hidden` and `inert`

Both are global boolean attributes, and they answer different questions. `hidden` means "this is not relevant right now: do not show it to anyone". `inert` means "this is still shown, but nobody can interact with it".

**`hidden`** removes the element from rendering (the browser's stylesheet gives it `display: none`). It takes no space, cannot be focused, is not found by find-in-page, and is absent from the accessibility tree. It is the right tool for inactive tab panels, a collapsed section, or a message that does not apply yet.

Its weakness is that it is implemented with ordinary, low-priority CSS, so any author rule that sets `display` wins:

```css
.card { display: flex; }               /* <div class="card" hidden> is now visible */
[hidden] { display: none !important; } /* the usual guard, found in most CSS resets */
```

Also remember that hidden is not *gone*: scripts inside still run, hidden form controls are still submitted, and they are still validated. A `required` field inside a hidden section blocks submission with an error message the browser cannot display. Disable such fields (a `<fieldset disabled>` does it in one go).

`hidden="until-found"` keeps content hidden but lets find-in-page and fragment links reveal it: the browser fires a `beforematch` event and removes the attribute. It suits custom accordions. Support is solid in Chromium and recent Firefox and still partial in Safari; where unsupported it behaves as plain `hidden`.

**`inert`** leaves the element and its descendants painted but takes them out of play: no clicks, no focus, no text selection, no find-in-page, and no presence in the accessibility tree. It is widely available. Uses:

- Content behind a custom overlay or an off-canvas drawer that is still visible.
- Off-screen slides of a carousel, so Tab does not disappear into invisible content.
- A whole form or page region while a request is in flight.

A modal `<dialog>` opened with `showModal()` makes everything else inert automatically; you need the attribute only for custom widgets. There is **no visual change** by default, so style it (`[inert] { opacity: 0.5; }`), or users see controls that mysteriously ignore them. Inertness is inherited and only a modal dialog can escape an inert ancestor, so put it on siblings of the active content, never on a shared parent. For a single control, use `disabled` instead.

How the options compare:

| Technique | Visible | Interactive | Exposed to assistive tech |
| --- | --- | --- | --- |
| `hidden` | No | No | No |
| `inert` | Yes | No | No |
| `aria-hidden="true"` | Yes | Yes | No |
| Visually-hidden CSS class | No | Yes | Yes |

The third row is the dangerous one: `aria-hidden` on something that contains focusable elements produces a control a keyboard can reach but a screen reader cannot describe. If you find yourself pairing `aria-hidden="true"` with `tabindex="-1"` on every descendant, `inert` is what you wanted. The fourth row is for text meant for screen readers only, such as the label of an icon button.

**Try it:** Make a section with a link, a button, and a paragraph. Apply `hidden`, `inert`, and `aria-hidden="true"` in turn. For each: Tab through the page, click, select the text, search for it with Ctrl+F, and check the element in the full accessibility tree in DevTools. Then add `section { display: grid; }` and watch `hidden` stop working.

**Resources**
- [MDN: hidden global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden)
- [MDN: inert global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)
- [HTML Standard: Inert subtrees](https://html.spec.whatwg.org/multipage/interaction.html#inert-subtrees)

### Script loading

When the HTML parser meets a `<script>`, what happens depends on its attributes.

| Markup | Download | Executes | Order |
| --- | --- | --- | --- |
| `<script src>` | Blocks the parser | Immediately, parser still blocked | Document order |
| `<script src async>` | In parallel | As soon as it arrives, pausing the parser | Whichever arrives first |
| `<script src defer>` | In parallel | After parsing completes, before `DOMContentLoaded` | Document order |
| `<script type="module">` | In parallel, with its imports | Like `defer` | Document order |
| `<script type="module" async>` | In parallel | As soon as it and its imports are ready | Arrival order |

A **classic script with no attributes** stops HTML parsing while it downloads and runs. In the `<head>` that means a blank page until it finishes, and it cannot see elements below it. This is why scripts used to go at the end of `<body>`; `defer` in the head is better, because the download starts earlier.

**`defer`** is the default choice for application code: non-blocking, ordered, and guaranteed to run when the DOM is complete. It has no effect on inline classic scripts (no `src`).

**`async`** is for independent scripts that neither depend on nor are depended on by anything: analytics, ads. Because execution order is arrival order, two async scripts where one needs the other is a race condition that passes on your machine and fails in production.

**`type="module"`** scripts are deferred by default, including inline ones. They also differ from classic scripts in other ways: `import`/`export` work, strict mode is always on, top-level variables are not global, top-level `await` is allowed, they are fetched with CORS (so they do not work from `file://`), and a module is executed only once however many times it is included.

```html
<head>
  <script src="/analytics.js" async></script>
  <script type="module" src="/app.js"></script>
</head>
```

Related tools: `<link rel="modulepreload" href="…">` fetches a module and its dependencies early; `<script type="importmap">` maps bare specifiers such as `import 'lodash'` to URLs; `nomodule` marks a legacy fallback that module-supporting browsers skip, which is rarely needed now.

Mistakes: writing `document.querySelector()` in a blocking head script and getting `null`; waiting for `DOMContentLoaded` inside a deferred or module script (harmless but unnecessary); using `document.write`, which the parser handles badly and which is blocked in some conditions.

**Try it:** Make a page with a head script that logs `document.querySelector('h1')` and try it four ways: no attribute, `defer`, `async`, and `type="module"`. Add a `DOMContentLoaded` listener that logs too and record the order. Then set network throttling to Slow 4G, add a large blocking script from a CDN, and watch the Performance panel show the parser waiting.

**Resources**
- [MDN: The Script element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script)
- [HTML Standard: The script element](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element)
- [MDN: JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

### Metadata for sharing

When a URL is pasted into a chat app or social network, a bot fetches the page and builds a preview card from metadata in the `<head>`. Search engines read related metadata to decide which URL to index and what to show.

**Open Graph** controls link previews. Note that these use the `property` attribute, not `name`:

```html
<meta property="og:title" content="How DNS works">
<meta property="og:description" content="A visual walk through a DNS lookup.">
<meta property="og:image" content="https://example.com/img/dns-card.png">
<meta property="og:url" content="https://example.com/blog/dns">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
```

Use absolute URLs. The image should be about 1200×630 pixels, a PNG or JPEG rather than SVG, and readable when small; add `og:image:alt`. The `twitter:card` tag selects the large-image layout on X; most other platforms need only the `og:` tags.

**Canonical URL** tells search engines which address is the authoritative one when the same content is reachable at several (tracking parameters, `http` and `https`, trailing slashes, sort orders):

```html
<link rel="canonical" href="https://example.com/blog/dns">
```

It must be absolute, there must be only one, and it should agree with `og:url`, your sitemap, and your redirects. It is a strong hint, not a directive. A common disaster is a template that sets every page's canonical to the home page.

**Structured data** describes the page's content in a machine-readable vocabulary (schema.org), usually as JSON-LD:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How DNS works",
  "datePublished": "2026-10-04",
  "author": { "@type": "Person", "name": "Ada Okafor" },
  "image": "https://example.com/img/dns-card.png"
}
</script>
```

Search engines can use it for rich results: recipe cards, product prices and ratings, breadcrumbs, event dates. It must describe content that is actually visible on the page, and it makes a page *eligible* for rich results rather than guaranteeing them.

The gotcha that catches single-page apps: most preview bots do not run JavaScript. These tags must be in the HTML the server sends, per URL. Platforms also cache previews aggressively, so use their debugging tools to force a re-fetch after a change.

**Try it:** View source on an article from a large publisher and find its `og:` tags, canonical link, and JSON-LD block. Paste the URL into Google's Rich Results Test and the Schema Markup Validator. Then check with `curl -s URL | grep -i "og:"` that the tags are in the server response rather than added by script.

**Resources**
- [The Open Graph protocol](https://ogp.me/)
- [Google Search Central: Introduction to structured data markup](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Google Search Central: How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

### `data-*` attributes

Any attribute whose name starts with `data-` is valid on any element and reserved for your own use. Browsers ignore them, validators accept them, and they will never collide with a future HTML attribute. They are the sanctioned way to attach page-specific data to the DOM for scripts and styles.

```html
<li data-product-id="8841" data-in-stock data-price="19.90">Travel mug</li>
```

Read and write them in JavaScript through `dataset`, where the `data-` prefix is dropped and the rest is converted from kebab-case to camelCase:

```js
const li = document.querySelector('li');
li.dataset.productId;        // "8841"
li.dataset.price;            // "19.90", a string
'inStock' in li.dataset;     // true
li.dataset.inStock;          // "", an empty string, which is falsy
li.dataset.state = 'added';  // sets data-state="added"
delete li.dataset.price;     // removes the attribute
```

In CSS, select by attribute or read the value into generated content:

```css
[data-state="added"] { outline: 2px solid green; }
li::after { content: " (" attr(data-price) ")"; }
```

Good uses: an id for an event-delegation handler to act on, a state hook for styling (`data-state="open"`, a pattern used by many component libraries), configuration for a script, and `data-testid` for tests when no accessible role or name is available.

What to watch for:

- **Values are always strings.** `dataset.count + 1` concatenates. Convert with `Number()`, and parse JSON explicitly.
- **A present-but-empty attribute is `""`.** Test presence with `in` or `hasAttribute()`, not truthiness.
- **Names must be lowercase** in HTML; `data-userId` becomes `data-userid` and is read as `dataset.userid`.
- **It is public.** Everything is visible in view-source. Do not put secrets there, and treat values as untrusted input since extensions and users can edit them.
- **It is not semantics.** Assistive technology ignores `data-*`. If the platform has a real attribute for the job (`disabled`, `aria-expanded`, `hidden`, `<time datetime>`), use that and style from it instead: `[aria-expanded="true"]` is both a style hook and meaningful.
- **It is not content.** Text that users should read belongs in elements; content injected with `attr()` is inconsistently exposed and cannot be selected or translated reliably.
- For larger data, a `<script type="application/json">` block is cleaner than a long escaped attribute.

**Try it:** Build a list of five products with `data-product-id` and a button in each. Attach *one* click listener to the `<ul>`, and use `event.target.closest('li').dataset.productId` to log which product was clicked. Then toggle `data-state` on click and style the selected state purely from CSS.

**Resources**
- [MDN: Use data attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/Use_data_attributes)
- [MDN: HTMLElement.dataset](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset)

### Semantic article page

The goal is a long-form article that works on markup alone. With no stylesheet, browser defaults give you a readable serif page; if your structure is right, it will already look like a document.

A skeleton to build on:

```html
<body>
  <a href="#main">Skip to content</a>
  <header>
    <a href="/">The Daily Byte</a>
    <nav aria-label="Main"><ul>…</ul></nav>
  </header>
  <main id="main">
    <article>
      <header>
        <h1>Why the web stays backwards compatible</h1>
        <p>By <a href="/authors/ada" rel="author">Ada Okafor</a>,
           <time datetime="2026-10-04">4 October 2026</time></p>
      </header>
      <p>Opening paragraph…</p>
      <nav aria-label="Contents"><ol>…links to #section ids…</ol></nav>
      <section aria-labelledby="history">
        <h2 id="history">A short history</h2>
        <figure>
          <img src="mosaic.png" width="1200" height="800" alt="…">
          <figcaption>NCSA Mosaic, 1993.</figcaption>
        </figure>
      </section>
      <footer>…tags, licence…</footer>
    </article>
    <aside aria-labelledby="related"><h2 id="related">Related</h2>…</aside>
  </main>
  <footer>…</footer>
</body>
```

Include, at minimum: a complete head (title, description, canonical, Open Graph, JSON-LD `Article`); one `<h1>` and at least two levels beneath it with no skipped levels; a table of contents linking to heading `id`s; a `<figure>` with a caption and real `alt`; a `<blockquote>` with attribution; an ordered or unordered list and a `<dl>`; a data table with `<caption>` and scoped headers; `<code>` and a `<pre>` block; `<abbr>`, `<time>`, `<em>`, and `<strong>` each used for their meaning; and a footnote or two built with fragment links in both directions.

Definition of done:

1. The Nu Html Checker reports zero errors and zero warnings.
2. With no CSS, it reads top to bottom in a sensible order and the hierarchy is visible.
3. The heading outline, printed from the Console, reads like a table of contents.
4. The accessibility tree shows banner, navigation, main, complementary, and contentinfo landmarks, with repeated ones labelled.
5. Every link has text that makes sense out of context; every image has a considered `alt`.
6. Browser reader mode picks up the title, byline, and body correctly. This is a surprisingly good semantic test.
7. Lighthouse accessibility and SEO audits pass.

Resist adding even one line of CSS until all seven are true. The discipline is the point: when you later add styles, you will be decorating a structure rather than building one out of `<div>`s.

**Try it:** Take a long article you have written, or a Wikipedia article's text, and mark it up from plain text following the list above. Then have a screen reader read the heading list and landmarks, and navigate to the third section using only headings.

**Resources**
- [MDN: Structuring content with HTML](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content)
- [W3C WAI: Page structure tutorial](https://www.w3.org/WAI/tutorials/page-structure/)
- [HTML Standard: The figure element](https://html.spec.whatwg.org/multipage/grouping-content.html#the-figure-element)

### Complete signup form

This project combines every form skill: real submission, labels, the right input types, built-in validation, and autofill. No JavaScript is allowed, so every feature has to come from HTML.

```html
<form action="/signup" method="post">
  <h1>Create your account</h1>

  <p>
    <label for="name">Full name</label>
    <input id="name" name="name" autocomplete="name" required>
  </p>

  <p>
    <label for="email">Email</label>
    <input id="email" name="email" type="email" autocomplete="email"
           required aria-describedby="email-hint">
    <span id="email-hint">We will send a confirmation link.</span>
  </p>

  <p>
    <label for="password">Password</label>
    <input id="password" name="password" type="password"
           autocomplete="new-password" required minlength="12"
           aria-describedby="pw-hint">
    <span id="pw-hint">At least 12 characters.</span>
  </p>

  <fieldset>
    <legend>Plan</legend>
    <label><input type="radio" name="plan" value="free" checked> Free</label>
    <label><input type="radio" name="plan" value="pro"> Pro</label>
  </fieldset>

  <p>
    <label>
      <input type="checkbox" name="terms" value="accepted" required>
      I agree to the <a href="/terms">terms of service</a>
    </label>
  </p>

  <button>Create account</button>
</form>
```

Decisions worth understanding:

- `method="post"`: the request creates something and contains a password. Never `get`, which would put the password in the URL.
- One password field, no "confirm password". Confirmation fields add friction and password managers make them pointless; a show-password toggle is the better aid, but that needs script, so it is out of scope here.
- `autocomplete="new-password"` tells the password manager to offer a generated password and to save it with the email as the account identifier.
- State the password rule in visible text tied to the field with `aria-describedby`, rather than hiding it in a `pattern` the user discovers by failing.
- Do not add a `maxlength` to passwords, do not block paste, and do not impose composition rules that reject generated passwords.
- The terms link sits in the label next to the checkbox. This is a pragmatic exception to "no interactive content in labels"; a stricter version puts the link in a separate sentence.
- Mark optional fields as "(optional)" in the label rather than marking required ones with an asterisk that needs a legend.
- The single button is a submit button by default.

Definition of done:

1. Submitting with JavaScript disabled sends a POST whose Payload tab shows `name`, `email`, `password`, `plan`, and `terms`.
2. Submitting empty focuses the first invalid field and shows a browser message; each constraint can be triggered.
3. Every control has an accessible name in the Accessibility pane; the radio group announces its legend.
4. The whole form is completable by keyboard, and clicking any label activates its control.
5. A browser profile fills name and email in one action; the password manager offers to generate, and to save after submission.
6. On a phone, the email field shows the `@` keyboard and the page does not zoom on focus.
7. The validator and the Issues panel report nothing.

**Try it:** Build it, point `action` at `https://httpbin.org/post` to see exactly what a server would receive, and work through the seven checks. Then break one thing at a time (remove a `name`, a `for`, an `autocomplete`) and observe precisely which check fails.

**Resources**
- [web.dev: Sign-up form best practices](https://web.dev/articles/sign-up-form-best-practices)
- [web.dev: Learn Forms](https://web.dev/learn/forms)
- [W3C WAI: Forms tutorial](https://www.w3.org/WAI/tutorials/forms/)
