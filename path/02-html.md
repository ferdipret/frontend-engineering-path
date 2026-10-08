# HTML

> Stage: 1 · Foundations
> HTML is the content and meaning of a page. Most accessibility, SEO, and robustness problems are HTML problems in disguise.

## Document basics

- [ ] Document structure — write `<!doctype html>`, `<html lang>`, `<head>`, and `<body>` from memory and say what each is for
- [ ] The head — set `<title>`, charset, viewport, description, and link stylesheets, icons, and scripts
- [ ] Elements and attributes — distinguish tags, elements, attributes, void elements, and global attributes
- [ ] Block vs inline content — and why the modern content model (flow, phrasing) is more precise
- [ ] Validation — run a page through the W3C validator and fix what it reports

## Semantic markup

- [ ] Headings — build a logical outline with `h1`–`h6`, never chosen for size
- [ ] Landmarks — use `header`, `nav`, `main`, `aside`, `footer`, `section`, `article` appropriately
- [ ] Text semantics — choose between `p`, `em`, `strong`, `blockquote`, `code`, `time`, `abbr`
- [ ] Lists — use `ul`, `ol`, and `dl` for the right shapes of content
- [ ] Links vs buttons — links navigate, buttons act; never a clickable `div`
- [ ] Tables — mark up tabular data with `caption`, `thead`, `th scope`, and never use tables for layout

## Forms

- [ ] Form fundamentals — `form`, `action`, `method`, and what happens on submit without JavaScript
- [ ] Labels — associate every control with a `label`
- [ ] Input types — pick the right `type` (`email`, `tel`, `number`, `date`, `search`…) for keyboards and validation
- [ ] Other controls — `select`, `textarea`, `checkbox`, `radio`, `fieldset` and `legend`
- [ ] Built-in validation — `required`, `pattern`, `min`/`max`, and the `:invalid` states
- [ ] Autofill — set `autocomplete` and `name` so browsers and password managers work

## Media and embedding

- [ ] Images — write meaningful `alt` text; know when it should be empty
- [ ] Responsive images — use `srcset`, `sizes`, and `picture` for resolution and art direction
- [ ] Image performance — set `width`/`height`, `loading="lazy"`, `decoding`, and `fetchpriority`
- [ ] Video and audio — embed with controls, captions (`track`), and sensible preload
- [ ] SVG — inline vs `img`; understand `viewBox`
- [ ] iframes — embed safely with `sandbox`, `title`, and lazy loading

## Modern HTML

- [ ] `dialog` — build a modal with the native element
- [ ] `details` and `summary` — disclosure without JavaScript
- [ ] Popover API — `popover` and `popovertarget` for menus and tooltips
- [ ] Invoker commands — open and close dialogs and popovers declaratively with `command` and `commandfor`
- [ ] `hidden` and `inert` — remove content from rendering or from interaction, and know how each affects assistive tech
- [ ] Script loading — `defer`, `async`, and `type="module"`, and how each affects parsing
- [ ] Metadata for sharing — Open Graph tags, canonical URLs, and structured data (JSON-LD)
- [ ] `data-*` attributes — attach custom data to elements

## Projects

- [ ] Semantic article page — a long-form article with no CSS that still reads well and passes validation
- [ ] Complete signup form — fully labelled, validated, and autofill-friendly with zero JavaScript

## Resources

- [MDN: HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [web.dev: Learn HTML](https://web.dev/learn/html)
- [HTML Living Standard](https://html.spec.whatwg.org/multipage/)
