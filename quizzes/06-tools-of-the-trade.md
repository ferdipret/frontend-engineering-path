# Tools of the Trade: Practice test

### 1. You install ESLint with `npm install -D eslint`, then type `eslint .` in your terminal and get "command not found". Running `npm run lint` (where the script is `eslint .`) works. Why?

- [ ] ESLint must be installed globally before any use
- [x] The binary is in `node_modules/.bin`, which is not on your shell's `PATH`; npm adds it to `PATH` only while running scripts
- [ ] `-D` installs packages without their executables
- [ ] The terminal must be restarted after every `npm install`

> The shell finds commands by searching the directories in `PATH`. Local package binaries live in `node_modules/.bin`, which npm prepends to `PATH` for the duration of a script. From the terminal, use `npx eslint .`, which looks there too. Installing globally would "work" but gives you a version teammates and CI do not share.

### 2. What does this command do?

```bash
npm test > results.log 2>&1
```

- [ ] Writes stdout to `results.log` and prints stderr to the terminal
- [ ] Writes only errors to `results.log`
- [ ] Runs the tests twice, logging the second run
- [x] Writes both stdout and stderr to `results.log`

> `>` redirects stdout (file descriptor 1) to the file. `2>&1` then redirects stderr (2) to wherever stdout currently points, which is the file. Order matters: written as `2>&1 > results.log`, stderr would be pointed at the terminal before stdout was moved, and errors would still print to the screen.

### 3. What is the difference between `git diff` and `git diff --staged`?

- [ ] `git diff` shows committed changes; `--staged` shows uncommitted ones
- [ ] They are identical unless a merge is in progress
- [x] `git diff` compares the working tree to the index (unstaged changes); `--staged` compares the index to the last commit (what the next commit will contain)
- [ ] `git diff` compares against the remote; `--staged` compares against the local branch

> Git has three areas: working tree, index, and repository. Plain `git diff` shows what you have changed but not yet staged, which is why it shows nothing right after `git add`. `git diff --staged` shows exactly what `git commit` will record, and reading it before every commit is the best habit to form.

### 4. You added `.env` to `.gitignore`, but `git status` still shows `.env` as modified every time you edit it. Why, and what fixes it?

```text
$ git status --short
 M .env
```

- [ ] `.gitignore` changes only take effect after `git gc`
- [ ] The pattern must be written as `/.env/` to match a file
- [x] The file was already tracked, and `.gitignore` only applies to untracked files; run `git rm --cached .env` and commit
- [ ] Git never ignores dotfiles; rename the file

> Ignore rules stop untracked files from being offered for tracking. A file that is already in the index stays tracked whatever `.gitignore` says. `git rm --cached .env` removes it from the index while leaving it on disk; after committing that, the ignore rule applies. The file's contents remain in earlier commits, so if it held secrets they must be rotated.

### 5. You have three local commits on `main` that should have been on a feature branch. Nothing has been pushed. Which sequence fixes it?

```bash
# A
git branch feature
git reset --hard origin/main

# B
git reset --hard origin/main
git branch feature

# C
git revert HEAD~3..HEAD
git switch -c feature
```

- [x] A
- [ ] B
- [ ] C
- [ ] A and B are equivalent

> In A, the new branch `feature` is created pointing at the current commit, so the three commits stay reachable; then `main` is moved back. In B, `main` is reset first, so `feature` is created at `origin/main` and does not contain the commits (they would have to be recovered from the reflog). C adds three more commits that undo the work, and the new branch then contains both the work and its reversal.

### 6. After `git reset --soft HEAD~1`, what is the state of the changes from the commit you just undid?

- [ ] Discarded from the working tree and the index
- [ ] In the working tree but unstaged
- [x] Still staged in the index, ready to be committed again
- [ ] Moved to the stash

> All three modes move the branch pointer. `--soft` leaves the index and working tree untouched, so the changes appear staged. `--mixed`, the default, resets the index, leaving them unstaged in the working tree. `--hard` resets both and discards them.

### 7. A teammate force-pushed a rebased version of a shared branch, and now your `git pull` produces duplicate commits and conflicts. Explain what happened in terms of commit identity, and state the rule that prevents it.

> A commit's hash is derived from its content, message, author, timestamp, and parent. Rebasing reapplies commits onto a new base, which changes the parent, so every rebased commit is a new commit with a new hash, even when its diff is identical. Your local branch still contains the original commits. When you pull, Git sees two different sets of commits with the same changes and tries to combine them, producing duplicates and conflicts.
>
> The rule: do not rewrite (rebase, amend, or reset) commits that other people have based work on. Rebasing is for your own unshared work, or a feature branch only you use. On a branch that is yours, push rewritten history with `git push --force-with-lease`, which refuses if the remote has commits you have not fetched. To recover here, if you have no local work of your own, reset your branch to the remote version (`git fetch`, then `git reset --hard origin/branch`); otherwise rebase your own commits onto the new remote branch.

### 8. `git push` to `https://github.com/acme/app.git` fails with "Authentication failed" even though you typed your GitHub account password correctly. What is the cause?

- [ ] HTTPS remotes are read-only; pushing requires an SSH URL
- [x] GitHub does not accept account passwords for Git over HTTPS; you need a token, normally supplied by a credential helper such as Git Credential Manager or `gh auth login`
- [ ] `user.email` in your Git config does not match your GitHub account
- [ ] The repository's default branch is protected

> Password authentication for Git operations was removed years ago. Over HTTPS, Git needs a personal access token or an OAuth token, and a credential helper obtains and stores one securely so you are not prompted. `user.name` and `user.email` only label commits and play no part in authentication. Both HTTPS and SSH remotes can push; a protected branch produces a different, explicit rejection.

### 9. A commit that broke production was merged into `main` and pushed two days ago; several people have since pulled. What is the right way to undo it?

- [ ] `git reset --hard <previous-commit>` then `git push --force`
- [ ] `git rebase -i` to drop the commit, then `git push --force-with-lease`
- [x] `git revert <commit>` and push the new commit
- [ ] `git restore --source=<previous-commit> .` and leave it uncommitted

> `git revert` creates a new commit that applies the inverse change. History is only added to, so everyone's clone stays consistent. The reset and rebase options rewrite shared history, which causes exactly the divergence that makes teammates' pulls fail and can resurrect the bad commit when someone pushes.

### 10. What does this `package.json` range allow, assuming versions 0.4.2, 0.4.9, 0.5.0, and 1.0.0 exist?

```json
{ "dependencies": { "tiny-lib": "^0.4.2" } }
```

- [ ] 0.4.2 only
- [x] 0.4.2 and 0.4.9
- [ ] 0.4.2, 0.4.9, and 0.5.0
- [ ] Everything below 1.0.0, plus 1.0.0

> The caret permits changes that do not modify the leftmost non-zero digit. For `^1.2.3` that digit is the major, giving `<2.0.0`. For `^0.4.2` it is the minor, giving `>=0.4.2 <0.5.0`. Below 1.0.0, semver treats a minor bump as potentially breaking, so the caret behaves like a tilde.

### 11. A project has a committed `package-lock.json`. Which statement about `npm install` and `npm ci` is correct?

- [ ] They are aliases; `ci` is just shorter
- [ ] `npm ci` ignores the lockfile and installs the newest versions allowed by `package.json`
- [ ] `npm install` never modifies the lockfile
- [x] `npm ci` installs exactly what the lockfile specifies and fails if it disagrees with `package.json`; `npm install` may update the lockfile

> `npm ci` is the reproducible install: it removes `node_modules`, installs the locked versions, and never writes to the lockfile, erroring out on any mismatch. `npm install` reconciles `package.json` with the lockfile and will rewrite the lockfile when they differ, which is why it is not suitable for CI.

### 12. A teammate's PR contains a 9,000-line change to `package-lock.json` with a description that says "bumped one dev dependency". What probably happened, why does it matter, and what would you ask them to do?

> The most likely causes are that they deleted the lockfile (and perhaps `node_modules`) and regenerated it, or that they installed with a different npm major version or a different package manager. Regenerating re-resolves every range in the whole tree to the newest allowed version, so hundreds of transitive dependencies changed at once, not one.
>
> It matters because the lockfile is what makes installs reproducible. This PR silently upgrades a large amount of code that nobody reviewed or tested deliberately, any of which could introduce a regression or a compromised release, and if something breaks it will be very hard to tell which change caused it.
>
> Ask them to restore the lockfile from `main` (`git restore --source=origin/main package-lock.json`), then make the targeted change with `npm install -D <pkg>@<version>` using the project's pinned Node and npm versions, and commit the resulting small diff. If a broad dependency refresh is wanted, it should be its own PR.

### 13. Which script in this `package.json` will fail for a teammate on Windows using the default npm configuration?

```json
{
  "scripts": {
    "lint": "eslint .",
    "check": "npm run lint && npm test",
    "build": "NODE_ENV=production vite build",
    "format": "prettier . --write"
  }
}
```

- [ ] `lint`, because binaries in `node_modules/.bin` are not found on Windows
- [ ] `check`, because `&&` is not supported by `cmd.exe`
- [x] `build`, because `NAME=value command` is POSIX shell syntax that `cmd.exe` does not understand
- [ ] `format`, because `.` is not a valid path on Windows

> npm runs scripts with `cmd.exe` on Windows by default. `&&` works there, and npm adds `node_modules/.bin` to `PATH` on every platform. Setting an environment variable as a command prefix is a POSIX shell feature; in `cmd.exe` it is an error. Use a cross-platform approach, such as a helper like `cross-env`, a Node script, or the tool's own option (for Vite, `--mode`).

### 14. A README says to run the following. You paste it into Windows PowerShell and get an error that `export` is not recognised. What is the equivalent?

```bash
export API_URL=http://localhost:4000
npm run dev
```

- [ ] `set API_URL=http://localhost:4000` then `npm run dev`
- [ ] `API_URL=http://localhost:4000 npm run dev`
- [ ] `export` works after running `Set-ExecutionPolicy RemoteSigned`
- [x] `$env:API_URL = 'http://localhost:4000'` then `npm run dev`

> `export` is a bash builtin. PowerShell sets environment variables for the session through the `$env:` drive. `set NAME=value` is `cmd.exe` syntax; in PowerShell `set` is an alias for `Set-Variable` and does not create an environment variable. The inline prefix form is POSIX-only. The execution policy controls whether script files may run and has nothing to do with this. In Git Bash or WSL the original command works unchanged.

### 15. What is the practical difference between a formatter and a linter?

- [ ] A formatter is for CSS and a linter is for JavaScript
- [ ] A linter rewrites code layout; a formatter finds bugs
- [ ] They do the same job, so a project should choose only one
- [x] A formatter rewrites layout (whitespace, quotes, line breaks) without changing behaviour; a linter analyses code for likely bugs and bad patterns

> Prettier and Biome's formatter reprint your code in one consistent style. ESLint and Biome's linter report things like unused variables, missing `await`, or `==` comparisons, some of which can be auto-fixed. They are complementary. When both are used, turn off the linter's stylistic rules (for ESLint with Prettier, via `eslint-config-prettier`) so the two do not fight.

### 16. This shell script is run as `./deploy.sh` and the `build/` directory does not exist. What happens?

```bash
#!/usr/bin/env bash
cd build
rm -rf *
echo "Cleaned"
```

- [ ] The script stops at the failed `cd` and prints an error
- [x] `cd` fails, the script carries on, and `rm -rf *` deletes the contents of the directory the script was run from
- [ ] `rm -rf *` refuses to run outside `build/`
- [ ] Nothing is deleted because `*` matches nothing

> By default a shell script continues after a failing command. `cd build` prints an error and leaves the working directory unchanged, then `rm -rf *` runs there. Start scripts with `set -euo pipefail` so that any failure aborts, and write dependent steps defensively, for example `cd build && rm -rf ./*` or `rm -rf build/*`.

### 17. Find the two bugs in this script, which is meant to back up a file whose path is passed as the first argument.

```bash
#!/usr/bin/env bash
file=$1
cp $file $file.bak
echo "Backed up $file"
```

> First, the expansions are unquoted. Called with `"My Notes.txt"`, `$file` splits into two words, so `cp` receives `My`, `Notes.txt`, `My`, and `Notes.txt.bak` and fails or copies the wrong things. Quote every expansion: `cp "$file" "$file.bak"`.
>
> Second, there is no error handling. With no argument, `$file` is empty and `cp` is called with nonsense; if `cp` fails for any reason, the script still prints "Backed up" and exits with status 0, telling the caller it succeeded. Add `set -euo pipefail` and validate the input.
>
> ```bash
> #!/usr/bin/env bash
> set -euo pipefail
> file="${1:?Usage: backup.sh <file>}"
> cp -- "$file" "$file.bak"
> echo "Backed up $file"
> ```
>
> The `--` stops a filename beginning with `-` from being read as an option.

### 18. During `git rebase origin/main` on your feature branch, a conflict appears. In the conflict markers, what does the `HEAD` ("ours") side contain?

- [ ] Your feature branch's version, because that is the branch you were on
- [ ] The common ancestor of the two branches
- [x] The version from `origin/main` plus any of your commits already replayed, because rebase rebuilds your branch on top of that base
- [ ] An empty section; rebase conflicts only show one side

> A rebase checks out the new base and replays your commits onto it one at a time. At the moment of conflict, `HEAD` is the new base (with earlier replayed commits), and the commit being applied, which is yours, is "theirs". This is the reverse of a merge, where `HEAD` is your branch, and it regularly leads people to keep the wrong side.

### 19. You want to find which of 800 commits introduced a failing test. You run:

```bash
git bisect start HEAD v3.1.0
git bisect run npm test -- cart.test.js
```

Roughly how many commits will Git test, and how does it decide whether each is good or bad?

- [ ] About 800; it runs the test on every commit in order
- [ ] About 400; it tests every second commit
- [x] About 10; it uses the command's exit code, with 0 meaning good and non-zero (other than 125) meaning bad
- [ ] About 10; it parses the test runner's output for the word "fail"

> Bisect is a binary search, so the number of steps is about log2 of the range: 800 commits need about 10 tests. `git bisect run` treats exit code 0 as good, 1 to 127 as bad, and 125 as "skip this commit". It does not read the output, which is why your test command must exit with an accurate status.

### 20. A bug fix was committed on `main` as commit `3f9a2c1`. You run the following. Which statement about the result is true?

```bash
git switch release/2.4
git cherry-pick 3f9a2c1
```

- [x] `release/2.4` gains a new commit with the same changes and message but a different hash
- [ ] Commit `3f9a2c1` is moved from `main` to `release/2.4`
- [ ] `release/2.4` now also contains every commit on `main` that came before `3f9a2c1`
- [ ] The two branches now share commit `3f9a2c1`, so a later merge will skip it

> Cherry-pick applies the diff introduced by one commit on top of the current branch and records it as a new commit. Its parent differs, so its hash differs. The original stays on `main`, and no earlier commits come along, which is why a cherry-picked change can fail if it depends on them. Because the two commits are distinct objects, the change appears twice in history if the branches are merged later.

### 21. You expand a logged object in the Console and see `items: Array(3)`, but you are certain the array was empty when that line ran. What explains this?

```js
const cart = { items: [] };
console.log(cart);
cart.items.push('a', 'b', 'c');
```

- [ ] `console.log` runs asynchronously, after the `push`
- [x] The Console holds a live reference to the object and reads its properties when you expand it
- [ ] The array methods are hoisted above the `console.log`
- [ ] Objects in the Console always show their final state because of garbage collection

> The log is recorded immediately, but for objects the Console stores a reference, not a snapshot. Expanding it later shows the object as it is at that moment. To capture the state at log time, log a copy (`structuredClone(cart)` or `JSON.stringify(cart)`), or pause with a breakpoint.

### 22. In the Network panel, a request's Timing tab shows 12 ms for connection setup, 2.8 s for "Waiting for server response", and 15 ms for "Content download". What should you investigate?

- [ ] The size of the response body
- [ ] The user's bandwidth
- [ ] Render-blocking JavaScript on the page
- [x] The server's processing time for that request

> "Waiting for server response" (time to first byte) is the gap between sending the request and receiving the first byte back, which is dominated by backend work such as database queries. A large body or slow connection would show up as a long "Content download". Page JavaScript does not affect an individual request's server wait.

### 23. A function runs inside a loop of 10,000 iterations and produces a wrong value only for the item with `id` 7421. What is the most efficient way to inspect that iteration?

- [ ] Add `console.log(item)` and search the output
- [ ] Set a line breakpoint and press Resume until you reach it
- [x] Set a conditional breakpoint with the expression `item.id === 7421`
- [ ] Throttle the CPU so the loop runs slowly enough to pause manually

> A conditional breakpoint pauses only when its expression is truthy, taking you straight to the iteration you care about with the full scope and call stack available. Logging ten thousand objects gives you a snapshot without the ability to step or inspect further, and resuming thousands of times is not practical.

### 24. A team adds a Husky `pre-commit` hook that runs `npm run lint && npm test` on the whole project. Within a month, half the team is committing with `--no-verify`, and a commit with lint errors has reached `main`. Explain what went wrong and how you would set this up instead.

> Two separate mistakes. First, the hook is too slow. Linting and testing the entire project on every commit takes long enough that it interrupts work, so people bypass it, and a bypassed hook protects nothing. Second, the hook was being treated as enforcement. Hooks are client-side and optional: `--no-verify` skips them, commits made through the web UI never run them, and a teammate with a broken install may not have them at all. Nothing on the server was checking.
>
> A better setup:
>
> - `pre-commit` runs `npx lint-staged`, configured to run `eslint --fix` and the formatter only on staged files. That takes a second or two, and it handles partially staged files safely.
> - Slower checks (type checking with `tsc --noEmit`, unit tests) move to a `pre-push` hook, or are left to CI.
> - CI runs the full lint, format check, type check, and tests on every pull request, and branch protection requires those checks to pass before merging. This is the actual enforcement.
>
> ```json
> {
>   "scripts": { "prepare": "husky" },
>   "lint-staged": {
>     "*.{js,ts,tsx}": ["eslint --fix", "prettier --write"],
>     "*.{css,md,json}": "prettier --write"
>   }
> }
> ```
>
> The hook's purpose is fast feedback before a push; CI is the guarantee.

### 25. A user reports that a fix deployed yesterday "is not showing up" for them, although it works for you. List the things you would check in DevTools, and explain the mechanism behind each.

> - **Service worker (Application > Service workers).** If the site registers one, it may be serving cached assets. A new service worker installs but waits until every tab controlled by the old one is closed, so the user can keep running the old version indefinitely. Check for a worker in the "waiting" state; "Update on reload" and "Unregister" confirm the diagnosis.
> - **HTTP cache (Network panel).** Look at the Size column for `(disk cache)` or `(memory cache)` and at the response's `Cache-Control` header. If the HTML or an unhashed asset is cached with a long `max-age`, the browser will not ask the server for the new version. Reload with "Disable cache" ticked to compare.
> - **Cache storage (Application > Cache storage).** Entries created by a service worker may hold old responses.
> - **Stored state (Application > Local storage, IndexedDB, Cookies).** Old-format persisted data, a feature flag, or an A/B cookie can make new code behave differently. Compare the user's values to yours.
> - **Which build is running.** In Sources or Network, check the hashed file names or a version string against the latest deployment. This distinguishes "old code is being served" from "new code behaves differently for this user".
>
> "Clear site data" in Application > Storage resets all of it for the origin and is a useful final confirmation, but identify the actual cause first, because other users are affected too and the real fix is in caching headers or the service worker's update strategy.

### 26. You pushed a branch and opened a pull request. You want to wait in the terminal until CI finishes, and if it fails, read only the output of the failing step. Which commands do that?

- [ ] `git status --checks` then `git log --ci`
- [ ] `gh pr view --web` then `gh pr diff`
- [ ] `gh run rerun --failed` then `gh pr merge`
- [x] `gh pr checks --watch` then `gh run view <run-id> --log-failed`

> Git has no knowledge of CI; that is the host's feature, exposed by the GitHub CLI. `gh pr checks --watch` shows each check for the current branch's pull request and blocks until they complete. `gh run view --log-failed` prints only the log lines from failed steps, instead of the entire run. `gh run rerun --failed` re-runs failed jobs, which is useful for a flaky failure but tells you nothing about why it failed.

### 27. Your page looks correct in Chrome's device mode with an iPhone preset, but users report a layout bug on real iPhones. What is the most likely explanation?

- [ ] Device mode does not change the viewport width, only the user agent
- [ ] The preset disables CSS media queries
- [ ] Real iPhones have a lower device pixel ratio than the preset
- [x] Device mode still renders with Chrome's engine; iPhones use WebKit, which has its own behaviour, and features like the dynamic toolbar and on-screen keyboard are not reproduced

> Device mode emulates viewport size, pixel ratio, touch events, and the user agent string, but the rendering engine is still Chrome's Blink on your desktop. Engine-specific bugs, viewport-unit behaviour with the collapsing toolbar, safe-area insets, and keyboard behaviour only appear on a real device or the iOS Simulator, debugged with Safari's Web Inspector.

### 28. You run Lighthouse twice against `http://localhost:5173` (a dev server) and get performance scores of 41 and 58. Give three reasons these numbers should not be trusted, and describe how to get a meaningful measurement.

> 1. **It is a dev build.** A dev server serves unminified, unbundled modules with no compression or caching headers, plus development-only code. This says nothing about what users receive. Audit the production build (`npm run build`, then a preview server, or the deployed site).
> 2. **Lab data varies between runs.** A single run is affected by other work on your machine, background tabs, and network jitter. The 17-point swing shows this. Run several times and take the median.
> 3. **The environment is polluted or unrepresentative.** Browser extensions inject scripts, so use an Incognito window or the CLI. Results also depend on the throttling and device settings, and on your machine's speed.
>
> Even done properly, Lighthouse is one simulated load on one machine. It cannot measure INP in navigation mode because nothing is clicked. For what real users experience, look at field data (the Chrome UX Report, or your own real-user monitoring), and use the Performance panel to investigate specific problems.

### 29. An older tutorial tells you to save this as `.eslintrc.json` in the project root. What is wrong with that instruction if you are installing the current version of ESLint?

```json
{
  "extends": ["eslint:recommended"],
  "env": { "browser": true },
  "rules": { "eqeqeq": "error" }
}
```

- [ ] `eqeqeq` is no longer a rule
- [x] Current ESLint uses flat config in `eslint.config.js` and no longer reads `.eslintrc` files; `env` is replaced by `languageOptions.globals`
- [ ] JSON configuration must be placed inside `package.json`
- [ ] `extends` must list the full npm package name

> The `.eslintrc` format has been removed. Configuration is an array exported from `eslint.config.js`, the recommended rules come from the `@eslint/js` package, and environments are expressed as globals:
>
> ```js
> import { defineConfig } from 'eslint/config';
> import js from '@eslint/js';
> import globals from 'globals';
>
> export default defineConfig([
>   {
>     files: ['**/*.js'],
>     plugins: { js },
>     extends: ['js/recommended'],
>     languageOptions: { globals: globals.browser },
>     rules: { eqeqeq: 'error' },
>   },
> ]);
> ```

### 30. After `git reset --hard HEAD~2`, you realise you needed those two commits. `git reflog` shows this. Which command restores them?

```text
c0ffee1 HEAD@{0}: reset: moving to HEAD~2
ab12cd3 HEAD@{1}: commit: Add export button
9e8d7c6 HEAD@{2}: commit: Add CSV serialiser
c0ffee1 HEAD@{3}: commit: Refactor table model
```

- [x] `git reset --hard ab12cd3`
- [ ] `git reset --hard 9e8d7c6`
- [ ] `git revert c0ffee1`
- [ ] `git stash pop`

> The reflog lists positions of `HEAD`, newest first. Before the reset, `HEAD` was at `ab12cd3` ("Add export button"), whose parent is `9e8d7c6`. Resetting to `ab12cd3` (or `HEAD@{1}`) restores both commits. Resetting to `9e8d7c6` would bring back only the first of the two. `revert` would undo the refactor commit, and nothing was stashed.

### 31. You are about to add a small npm package to format relative dates ("3 hours ago"). Describe how you would decide whether to add it, covering the checks you would make and one alternative to adding it at all.

> Start with the alternative: the platform already provides `Intl.RelativeTimeFormat`, so a helper of about fifteen lines that picks a unit and calls it may remove the need for a dependency, with no bundle cost and nothing to maintain or audit.
>
> If a package is still justified (for instance, it handles many locales and edge cases you need), check:
>
> - **Maintenance.** Recent releases and commits, responsive maintainers, more than one maintainer, a changelog, healthy download numbers and dependents.
> - **Size.** Minified and gzipped size and tree-shakeability on Bundlephobia, whether it ships ES modules and types, and how many transitive dependencies it brings.
> - **Licence.** A permissive licence such as MIT, ISC, BSD, or Apache-2.0 that company policy permits. No licence means no right to use it.
> - **Security.** The exact package name (to avoid typosquats), `npm audit` results, whether it runs install scripts, its history with vulnerabilities, and whether releases are published with provenance. Avoid a version published in the last day or so.
>
> Then try it in a scratch project, read some of the source, and record the reasoning in the PR that adds it. The cost you are weighing is ongoing: every dependency must be updated and trusted for the life of the project.

### 32. A new teammate clones your repository. On their first commit the diff shows every line of several files changed, and CI fails on formatting. Which committed files would have prevented this, and what does each one do?

> The symptoms are line-ending differences (CRLF versus LF, typical of a Windows checkout) and the lack of shared formatter setup. The following committed files address them:
>
> - **`.gitattributes`** with `* text=auto eol=lf`: Git normalises text files to LF in the repository and working tree for everyone, whatever their `core.autocrlf` setting. This is what stops whole-file diffs.
> - **`.editorconfig`**: sets `end_of_line`, `indent_style`, `indent_size`, `charset`, final newline, and trailing-whitespace behaviour in any editor that supports it.
> - **Formatter config** (`.prettierrc` or `biome.json`) with the formatter pinned as a dev dependency at an exact version, so everyone produces identical output.
> - **`.vscode/settings.json`** with `editor.formatOnSave` and `editor.defaultFormatter`, and **`.vscode/extensions.json`** recommending the formatter, linter, and EditorConfig extensions, so the editor applies the rules without the teammate being told.
> - **`.nvmrc`** (and `engines` in `package.json`) so they run the same Node version, and the **lockfile** so they get the same tool versions.
>
> CI should keep running the format and lint checks, since editor settings are a convenience that can be bypassed. The test of the setup is that a fresh clone plus `npm ci` gives a correctly behaving environment with no verbal instructions.
