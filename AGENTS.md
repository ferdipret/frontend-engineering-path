# Working on FE Path

Guidance for anyone (person or agent) contributing to this repository.

## What this is

A generic frontend engineer curriculum, from fundamentals to mastery, with a local tracker. It is meant to be usable by anyone, so keep the content general: no tailoring to one job, company, or stack beyond what the industry broadly uses.

## Commits

- Never add `Co-authored-by` trailers or any other attribution lines to commits or pull requests. The author field is enough.
- Small, atomic commits: one logical change each, readable on its own. Use `type: summary` subjects (`content:`, `tracker:`, `docs:`, `chore:`, `fix:`), imperative mood, under 72 characters, with a body only when the why isn't obvious.
- Do not commit `data/` (progress database) or anything generated.

## Layout

| Path | Purpose |
| --- | --- |
| `path/NN-slug.md` | Checklist modules: the spine of the curriculum |
| `guides/NN-slug.md` | Toolkit plus a detailed entry per skill |
| `quizzes/NN-slug.md` | Practice tests |
| `lib/content.js` | Markdown parsers shared by the server and scripts |
| `scripts/validate.js` | Structure and link checks |
| `server.js`, `web/` | The local tracker: Node + SQLite, dependency-free vanilla web app |

`AUTHORING.md` is the content spec: file formats, voice, sourcing rules, and worked examples. Read it before touching anything in `path/`, `guides/`, or `quizzes/`.

## Rules of thumb

- A skill's identity is its file name plus the text before ` — `. Renaming a skill resets progress and breaks its guide link; reword descriptions freely, rename names deliberately and update the guide heading to match.
- Prefer official docs and primary sources for links. Never invent a URL.
- After editing content run `node scripts/validate.js <slug> --links` and get to 0 errors.
- The tracker has no build step and no dependencies. Keep it that way unless there is a strong reason.
- Node 22.13+ is required (`node:sqlite`).
