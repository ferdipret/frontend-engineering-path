# FE Path

A complete frontend engineer path, from how the web works to leading frontend architecture, with a local web view for checking skills off.

## The path

| Stage | Modules |
| --- | --- |
| 1 · Foundations | [How the Web Works](path/01-how-the-web-works.md) · [HTML](path/02-html.md) · [CSS](path/03-css.md) · [JavaScript](path/04-javascript.md) · [DOM and Browser APIs](path/05-browser-apis.md) · [Tools of the Trade](path/06-tools-of-the-trade.md) |
| 2 · Professional | [TypeScript](path/07-typescript.md) · [Accessibility](path/08-accessibility.md) · [React and Component Frameworks](path/09-react-and-component-frameworks.md) · [State and Data](path/10-state-and-data.md) · [Rendering and Meta-frameworks](path/11-rendering-and-meta-frameworks.md) · [Styling and Design Systems](path/12-styling-and-design-systems.md) · [Testing](path/13-testing.md) · [Build Tooling](path/14-build-tooling.md) |
| 3 · Advanced | [Performance](path/15-performance.md) · [Security](path/16-security.md) · [Browser Internals](path/17-browser-internals.md) · [PWAs, Offline, Mobile](path/18-pwa-offline-and-mobile.md) · [Graphics and Rich UI](path/19-graphics-and-rich-ui.md) · [i18n and Product Quality](path/20-internationalization-and-product-quality.md) |
| 4 · Mastery | [Architecture and System Design](path/21-frontend-architecture.md) · [Delivery and Operations](path/22-delivery-and-operations.md) · [Craft and Leadership](path/23-craft-and-leadership.md) · [Capstones](path/24-capstones.md) |

Work roughly top to bottom. Check a skill off when you can do it without looking anything up.

Every module has three files with the same name:

| Folder | What it is |
| --- | --- |
| `path/` | The checklist of skills, grouped into sections, with projects and core resources |
| `guides/` | A toolkit for the module (DevTools and tooling, how to test and verify your work, tricks and gotchas, official references) and a detailed entry for every skill: explanation, a "try it" exercise, and links to official docs |
| `quizzes/` | A practice test: multiple-choice questions with explanations, and open questions with model answers |

## Tracker

A server-rendered React Router app on Vite and TypeScript. Requires Node 22.22 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173. For a production build, `npm run build` then `npm start`.

- **Skills**: click a skill to open its guide; tick the box when you've got it.
- **Toolkit** and **Practice test** are tabs on each module. Finishing a test's multiple-choice questions saves the score, and the dashboard shows your best per module.
- **Search**: press `Ctrl K` or `/`. It searches skills, guide text, toolkits, test questions, and resource links, tolerates typos, and understands shorthand like `a11y` or `perf`. Filters: `is:todo`, `is:done`, `type:skill|module|toolkit|quiz|link`, `in:<module>`, and `"exact phrase"`.
- The web view re-reads the markdown whenever a content file changes, so edits show up on refresh.
- Progress and test results are stored in SQLite at `data/progress.db` (git-ignored). The checkboxes in the markdown stay unchecked.

## Editing the content

[AUTHORING.md](AUTHORING.md) describes the three file formats. After editing, check that everything lines up and that links resolve:

```bash
node scripts/validate.ts 03-css --links
```

A checklist module looks like this:

```markdown
# Module title

> Stage: 2 · Professional
> One-paragraph summary.

## Section

- [ ] Skill name — what being able to do it means
- Plain bullets and [links](https://example.com) are shown as-is
```

A skill's identity is its file name plus the text before the ` — `. Rewording the explanation keeps its checked state; renaming the skill or the file resets it, and its guide entry heading has to be renamed to match.
