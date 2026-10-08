# Tools of the Trade

> Stage: 1 · Foundations
> The everyday toolkit: terminal, Git, package managers, editor, and DevTools. Fluency here makes everything else faster.

## Command line

- [ ] Navigation and files — move around, create, copy, move, and delete from the terminal
- [ ] Pipes and redirection — chain commands and capture output
- [ ] Environment variables and `PATH` — set them and know why a command "isn't found"
- [ ] Shell scripts — write a small script to automate a repeated task
- [ ] Shells on Windows — choose between PowerShell, Git Bash, and WSL, and know why a tutorial command fails in one of them

## Git

- [ ] Core workflow — `status`, `add`, `commit`, `diff`, `log`
- [ ] Branching and merging — create branches, merge, resolve conflicts
- [ ] Remotes — `clone`, `fetch`, `pull`, `push`, tracking branches
- [ ] Authentication — SSH keys, credential helpers, and tokens for talking to a remote
- [ ] Ignoring and attributes — `.gitignore`, `.gitattributes`, line endings, and untracking a committed file
- [ ] Rebase — rebase onto main and interactively tidy commits
- [ ] Undoing — `restore`, `reset`, `revert`, `stash`, and rescuing work with `reflog`
- [ ] Good commits — small, focused, with messages that explain why
- [ ] Pull requests — open, review, and respond to feedback on GitHub or similar
- [ ] `git bisect` — find the commit that introduced a bug
- [ ] Cherry-pick and worktrees — move single commits between branches and work on two branches at once
- [ ] Git hooks — run checks before commit or push with a hook manager and `lint-staged`
- [ ] GitHub CLI — create, review, and check pull requests and CI runs with `gh`

## Node and packages

- [ ] Node.js basics — run scripts, read files, understand it as a JS runtime outside the browser
- [ ] Version management — pin Node versions with a manager (`fnm`, `nvm`, `mise`)
- [ ] npm fundamentals — `package.json`, scripts, dependencies vs devDependencies
- [ ] Lockfiles — why they exist and why you commit them
- [ ] Semver — read version ranges (`^`, `~`) and reason about upgrades
- [ ] Alternative managers — know pnpm, Yarn, and Bun and how they differ
- [ ] Evaluating dependencies — judge a package by maintenance, size, licence, and security

## Editor and code quality

- [ ] Editor fluency — multi-cursor, go to definition, rename symbol, search across files
- [ ] Formatter — set up Prettier or Biome and format on save
- [ ] Linter — configure ESLint or Biome and understand the rules it enforces
- [ ] EditorConfig and settings — share consistent settings across a team

## Browser DevTools

- [ ] Elements panel — inspect and live-edit DOM and styles; debug layout with grid/flex overlays
- [ ] Console — beyond `console.log`: `table`, `group`, `$0`, live expressions
- [ ] Sources and debugging — breakpoints, conditional breakpoints, step through, watch, call stack
- [ ] Network panel — filter, throttle, inspect headers and timing, block requests
- [ ] Application panel — inspect storage, cookies, service workers, cache
- [ ] Device emulation — test viewports, touch, and throttled CPU
- [ ] Performance and Lighthouse — record a trace and run an audit (deep dive comes later)

## Practice

- [ ] Contribute via pull request — fork a repo, make a change, open a PR
- [ ] Recover from a Git mess — deliberately break a branch and fix it with `reflog`
- [ ] Debug without `console.log` — fix a bug using only breakpoints

## Resources

- [Pro Git (free book)](https://git-scm.com/book/en/v2)
- [Chrome DevTools documentation](https://developer.chrome.com/docs/devtools)
- [Oh Shit, Git!?!](https://ohshitgit.com/)
