# Tools of the Trade: Guide

## Toolkit

### DevTools and tooling

This module is about the tools themselves, so this section is the short list of what to install and where to look.

- **A POSIX shell.** macOS and Linux ship with zsh or bash. On Windows, install Git for Windows (which includes Git Bash) or WSL so the commands in tutorials work as written; PowerShell is fine day to day, but its syntax differs (`$env:NAME`, `Get-Command`, `Remove-Item`). Examples in this guide use bash syntax and call out PowerShell where it matters.
- **Git, version 2.40 or newer.** Run `git --version`. Set your identity and three quality-of-life options once: `git config --global init.defaultBranch main`, `git config --global pull.rebase true`, and `git config --global merge.conflictStyle zdiff3`.
- **GitHub CLI (`gh`).** `gh pr create`, `gh pr checkout 123`, and `gh pr view --web` remove most of the trips to the website.
- **Node through a version manager.** Install `fnm` or `nvm` rather than a system-wide Node installer, and use the current LTS line.
- **VS Code** (or an editor you know equally well) with the ESLint, Prettier or Biome, and EditorConfig extensions. The Command Palette (`Ctrl/Cmd+Shift+P`) finds every command by name.
- **Chrome DevTools**, opened with `F12` or `Ctrl+Shift+I` (`Cmd+Option+I` on macOS). Its own Command Menu (`Ctrl/Cmd+Shift+P`) is the fastest way to reach any panel or setting, and `Ctrl/Cmd+P` opens any loaded file. Firefox DevTools is worth having for its CSS grid, flexbox, and font tooling, and Safari's Web Inspector is the only way to debug iOS.
- **Helpers.** [ShellCheck](https://www.shellcheck.net/) lints shell scripts, [explainshell](https://explainshell.com/) breaks down a command you do not understand, and `npx` runs a package's CLI without installing it globally.

Keep global installs to a minimum. Tools installed per project, pinned in `package.json`, behave the same for every teammate and in CI.

### Testing and verifying your work

For tooling, "correct" means reproducible: someone else, or a clean machine, gets the same result.

- **Fresh clone test.** Clone your repository into a new directory, then run the documented install and start commands and nothing else. If it fails, something lives only on your machine: an uncommitted file, a global package, an environment variable, or a Node version you did not pin.
- **Clean install.** `npm ci` deletes `node_modules` and installs exactly what the lockfile says, failing if `package.json` and the lockfile disagree. This is what CI should run, and it is the honest check that your lockfile is committed and current.
- **Check before you commit.** `git status` and `git diff --staged` show precisely what is about to be recorded. Read the staged diff every time; it catches debug code, stray files, and secrets.
- **Check before you push.** `git log --oneline --graph origin/main..HEAD` lists the commits you are about to publish.
- **Format and lint in check mode.** `npx prettier . --check` and `npx eslint .` (or `npx biome ci .`) exit non-zero on problems without changing files. Run them in CI so the rules are enforced, not just suggested.
- **Scripts fail loudly.** Run a shell script with a deliberately broken step and confirm it stops with a non-zero exit code (`echo $?` in bash, `$LASTEXITCODE` in PowerShell) rather than carrying on.
- **Debugging conclusions are evidence-based.** A bug is understood when you can state the line where actual and expected state diverge and you have watched it happen at a breakpoint, not when a change happens to make the symptom go away.
- **DevTools measurements are repeatable.** Test in an Incognito window to exclude extensions, tick "Disable cache" in the Network panel, and apply throttling, so that two runs are comparable.

### Tricks and gotchas

- `cd -` jumps back to the previous directory, `Ctrl+R` searches shell history, and `!!` repeats the last command (`sudo !!` is the classic use).
- Quote every variable expansion in shell scripts: `"$file"`. Unquoted, a path with a space becomes two arguments.
- `rm -rf` has no undo and no recycle bin. Run `ls` with the same pattern first.
- npm scripts run in `cmd.exe` on Windows by default, so `rm -rf dist` or `NODE_ENV=production vite build` in a script breaks for Windows teammates. Use Node-based equivalents or cross-platform packages.
- `git add -p` stages changes hunk by hunk, which is how you turn a messy working tree into focused commits.
- `git switch -` returns to the previous branch. `git stash -u` includes untracked files.
- Never `git push --force` to a shared branch. On your own branch use `--force-with-lease`, which refuses if the remote has commits you have not seen.
- Almost nothing committed is ever truly lost. `git reflog` lists where `HEAD` has been; `git reset --hard HEAD@{n}` goes back there. Uncommitted changes are the exception, so commit or stash before risky commands.
- A file already tracked by Git is not affected by adding it to `.gitignore`. Untrack it with `git rm --cached file`.
- If a secret is pushed, rotating the secret is the fix. Removing the commit is not enough.
- `npm install` may rewrite the lockfile; `npm ci` never does. Use `npm ci` in CI and after pulling.
- `^0.2.3` allows only patch updates (`<0.3.0`), unlike `^1.2.3`, which allows minors.
- In DevTools, `$0` is the selected element, `$_` is the last Console result, and pressing `H` in the Elements panel toggles visibility of the selected node.
- Right-click a line number in Sources for conditional breakpoints and logpoints. Logpoints give you logging without editing code.
- Right-click a request in the Network panel and choose **Copy > Copy as fetch** or **Copy as cURL** to replay it.
- A long-press on the reload button with DevTools open offers **Empty cache and hard reload**.

### Official references

- [Pro Git (free book)](https://git-scm.com/book/en/v2) - the complete, readable explanation of Git's model and commands.
- [Git reference manual](https://git-scm.com/docs) - the authoritative page for every command and option.
- [GitHub Docs: Pull requests](https://docs.github.com/en/pull-requests) - creating, reviewing, and merging pull requests and working with forks.
- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html) - the definitive description of shell syntax, expansion, and redirection.
- [Node.js documentation](https://nodejs.org/docs/latest/api/) - the API reference for every built-in module and CLI flag.
- [npm Docs](https://docs.npmjs.com/) - the CLI commands, `package.json` fields, and configuration.
- [Semantic Versioning 2.0.0](https://semver.org/) - the specification version numbers are meant to follow.
- [Visual Studio Code documentation](https://code.visualstudio.com/docs) - editing features, settings, and debugging.
- [Prettier documentation](https://prettier.io/docs/), [Biome documentation](https://biomejs.dev/guides/getting-started/), and [ESLint documentation](https://eslint.org/docs/latest/) - setup, options, and rule references for the code quality tools.
- [Chrome DevTools documentation](https://developer.chrome.com/docs/devtools) - guides and references for every panel.
- [Firefox DevTools User Docs](https://firefox-source-docs.mozilla.org/devtools-user/) - the equivalent for Firefox.
- [The Missing Semester of Your CS Education (MIT)](https://missing.csail.mit.edu/) - an excellent free course on the shell, editors, and Git.

## Skills

### Navigation and files

The terminal always has a current working directory, and every relative path is resolved against it. Knowing where you are (`pwd`) and what is here (`ls -la`) removes most beginner confusion.

```bash
pwd                      # print working directory
ls -la                   # list all files, including dotfiles, with details
cd projects/site         # relative path
cd ..                    # up one level
cd ~                     # home directory
cd -                     # back to the previous directory

mkdir -p src/components/button   # create nested directories in one go
touch src/index.js               # create an empty file (or update its timestamp)
cp config.example.json config.json
cp -r templates/ backup/         # -r to copy a directory
mv old-name.js new-name.js       # mv both moves and renames
rm notes.txt
rm -r build/                     # delete a directory and its contents
```

Paths: `/` is the root, `~` is your home directory, `.` is the current directory, and `..` is the parent. A path starting with `/` or `~` is absolute; anything else is relative.

Habits that make you fast: press `Tab` to complete names (twice to list options) rather than typing them; use the up arrow and `Ctrl+R` to reuse history; use `Ctrl+A` and `Ctrl+E` to jump to the start and end of the line; and open the current folder in your editor with `code .`.

Mistakes to avoid: `rm` deletes permanently, and `rm -rf` on a mistyped path or an empty variable can remove far more than you intended, so list with the same pattern first. Names containing spaces must be quoted (`cd "My Project"`). `cp` and `mv` silently overwrite an existing destination unless you add `-i`. Globs such as `*.js` are expanded by the shell before the command runs, and `*` does not match dotfiles by default.

To read files, `cat file` prints it, `less file` pages through it (`q` to quit, `/` to search), and `head -n 20` and `tail -f` show the start and follow the end. PowerShell accepts most of these names as aliases for its own cmdlets (`ls`, `cd`, `cp`, `mv`, `rm`, `cat`), but flags differ: `rm -r -fo` rather than `rm -rf`.

**Try it:** Without touching a file manager, create `sandbox/a/b/c`, add three files at different levels, copy the tree to `sandbox-copy`, rename one file, delete the original tree, and confirm the result with `ls -R`.

**Resources**
- [MDN: Command line crash course](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Command_line)
- [The Missing Semester: Course overview and the shell](https://missing.csail.mit.edu/2020/course-shell/)
- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html)

### Pipes and redirection

Every process has three standard streams: stdin (input, file descriptor 0), stdout (normal output, 1), and stderr (errors and diagnostics, 2). Small programs become powerful because you can connect these streams together.

A pipe, `|`, connects the stdout of one command to the stdin of the next:

```bash
git log --oneline | wc -l                 # count commits
cat access.log | grep " 500 " | sort | uniq -c | sort -rn | head
history | grep "git rebase"
```

Redirection sends a stream to or from a file:

```bash
npm run build > build.log        # stdout to a file, overwriting it
echo "dist/" >> .gitignore       # append
npm test 2> errors.log           # stderr only
npm test > all.log 2>&1          # both: stderr joins stdout
npm test &> all.log              # bash and zsh shorthand for the same thing
sort < names.txt                 # file as stdin
some-command > /dev/null 2>&1    # discard everything
```

Order matters in `> all.log 2>&1`: `2>&1` means "send stderr to wherever stdout points right now", so it must come after stdout has been redirected. A pipe only carries stdout, which is why error messages still appear on screen in the middle of a pipeline; use `2>&1 |` to include them.

Commands are also chained by exit status. `a && b` runs `b` only if `a` succeeded (exit code 0), `a || b` only if it failed, and `a ; b` runs both regardless. That is why `npm run lint && npm test` stops at the first failure. Command substitution, `$(...)`, inserts a command's output into another command: `git switch "$(git branch --show-current)"`.

Useful pieces: `grep` filters lines, `sort` and `uniq -c` count duplicates, `wc -l` counts lines, `head` and `tail` trim, `xargs` turns input lines into arguments, and `tee file` writes to a file while passing data along. `>` truncates the target before the command runs, so `sort file > file` leaves you with an empty file.

By default a pipeline's exit status is that of its last command, which hides earlier failures; `set -o pipefail` in scripts fixes that. PowerShell has pipes too, but they carry objects rather than text, so the filtering commands differ (`Select-String`, `Where-Object`, `Measure-Object`).

**Try it:** In a Git repository, produce a ranked list of who has made the most commits using `git log --format='%an'` piped through `sort`, `uniq -c`, and `sort -rn`. Then save the output to a file and display it at the same time using `tee`.

**Resources**
- [GNU Bash Reference Manual: Redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html)
- [GNU Bash Reference Manual: Pipelines](https://www.gnu.org/software/bash/manual/html_node/Pipelines.html)
- [The Missing Semester: Shell tools and scripting](https://missing.csail.mit.edu/2020/shell-tools/)

### Environment variables and `PATH`

Environment variables are named strings attached to a process and inherited by the processes it starts. They are how configuration that varies between machines (API endpoints, credentials, modes) gets into a program without being written into the code.

```bash
echo "$HOME"                       # read one
printenv | sort                    # list all
API_URL=http://localhost:4000 npm run dev   # set for one command only
export API_URL=http://localhost:4000        # set for this shell session and its children
```

A plain `NAME=value` without `export` creates a shell variable that child processes do not see. To make a variable permanent, add the `export` line to your shell's startup file (`~/.zshrc`, `~/.bashrc`) and open a new terminal or `source` the file. In PowerShell the syntax is `$env:API_URL = 'http://localhost:4000'`, and the `NAME=value command` prefix form does not exist.

`PATH` is the variable that matters most. It is a list of directories, separated by `:` (or `;` on Windows). When you type `node`, the shell looks through those directories in order and runs the first executable with that name. Therefore "command not found" means one of three things: the program is not installed, its directory is not on `PATH`, or `PATH` was changed in a startup file that this terminal has not reloaded.

```bash
echo "$PATH" | tr ':' '\n'    # one directory per line
command -v node               # which file will actually run (also: which node)
export PATH="$HOME/.local/bin:$PATH"   # prepend a directory
```

On Windows, use `Get-Command node` or `where.exe node`. Order also explains the "wrong version" problem: if two Node installations are on `PATH`, the earlier one wins. Version managers work by putting their directory first.

Locally installed npm binaries live in `node_modules/.bin`, which is not on your `PATH`. npm adds it while running `package.json` scripts, and `npx` finds it too, which is why `eslint .` fails in your terminal but works as a script.

Projects usually keep local values in a `.env` file. Node can load one with `node --env-file=.env app.js`, and tools like Vite read them automatically. Do not commit `.env` files containing secrets; commit a `.env.example` with placeholder values. Remember that anything a bundler exposes to browser code (in Vite, variables prefixed `VITE_`) ships to every user and is not secret.

**Try it:** Run `command -v node` and find that directory in your `PATH` output. Then create a script in a new folder, make it executable, confirm it is "not found" by name, add the folder to `PATH` for the session, and run it by name.

**Resources**
- [Node.js: How to read environment variables from Node.js](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [GNU Bash Reference Manual: Environment](https://www.gnu.org/software/bash/manual/html_node/Environment.html)
- [Vite: Env variables and modes](https://vite.dev/guide/env-and-mode)

### Shell scripts

A shell script is a file of commands you would otherwise type by hand. Write one when you find yourself repeating a sequence: setting up a project, cleaning build output, running checks before a push.

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/new-component.sh Button
name="${1:?Usage: new-component.sh <Name>}"
dir="src/components/$name"

if [[ -d "$dir" ]]; then
  echo "Error: $dir already exists" >&2
  exit 1
fi

mkdir -p "$dir"
cat > "$dir/$name.js" <<EOF
export function $name() {}
EOF
echo "Created $dir"
```

Make it executable once with `chmod +x scripts/new-component.sh`, then run it by path.

What each part does:

- The first line, the shebang, tells the system which interpreter to use. `#!/usr/bin/env bash` finds bash on the `PATH`.
- `set -e` exits when a command fails, `set -u` treats use of an unset variable as an error, and `set -o pipefail` makes a pipeline fail if any stage fails. Without these, a script carries on after errors, which is how a failed `cd` followed by `rm -rf *` deletes the wrong directory.
- `$1`, `$2` are positional arguments, `"$@"` is all of them, and `$?` is the previous command's exit code.
- `${1:?message}` aborts with the message if the argument is missing.
- Always quote expansions (`"$dir"`), so that spaces and glob characters in values are not reinterpreted.
- Send error messages to stderr (`>&2`) and return a non-zero exit code on failure, so other tools and CI can tell that it failed.
- `[[ ... ]]` is bash's test syntax; `-d` tests for a directory, `-f` for a file, `-z` for an empty string.

Paste scripts into ShellCheck, or run the `shellcheck` CLI; it catches quoting and portability mistakes reliably.

Know when not to use shell. Bash scripts do not run in `cmd.exe` or PowerShell, and npm runs `package.json` scripts with `cmd.exe` on Windows by default. In a frontend project, a short Node script (`node scripts/clean.js`) or a `package.json` script that composes other scripts is often the more portable choice. Reach for bash for personal automation and CI steps that run on Linux.

**Try it:** Write a script that takes a directory argument, fails with a usage message if it is missing, and prints the five largest files in it. Run it through ShellCheck and fix every warning. Then break one command and confirm the script exits non-zero.

**Resources**
- [GNU Bash Reference Manual: Shell scripts](https://www.gnu.org/software/bash/manual/html_node/Shell-Scripts.html)
- [The Missing Semester: Shell tools and scripting](https://missing.csail.mit.edu/2020/shell-tools/)
- [ShellCheck: shell script analysis tool](https://www.shellcheck.net/)

### Shells on Windows

Most web development tutorials assume a POSIX shell (bash or zsh) on macOS or Linux. On Windows you have three realistic options, and knowing how they differ explains nearly every "I pasted the command and it failed" moment.

**PowerShell** is the native shell. Use PowerShell 7 (`pwsh`), which you install separately; the built-in Windows PowerShell 5.1 is older and lacks, for example, the `&&` and `||` operators. It is a different language from bash: pipelines carry objects, commands are `Verb-Noun` cmdlets, and variables and environment syntax differ. Node, npm, Git, and VS Code all work well in it.

**Git Bash** comes with Git for Windows. It is a real bash with the common Unix utilities (`ls`, `grep`, `sed`, `ssh`), running Windows programs. Tutorial commands and simple `.sh` scripts work as written. It is still Windows underneath: it runs the Windows builds of Node and Git, and it rewrites arguments that look like Unix paths, so an argument such as `/api` can be turned into `C:/Program Files/Git/api` (set `MSYS_NO_PATHCONV=1` for that command to stop it).

**WSL 2** (Windows Subsystem for Linux) runs a real Linux distribution in a lightweight virtual machine. Everything behaves exactly as on Linux, which matches your CI and production servers. Install with `wsl --install`, then install Node inside it separately. Keep projects in the Linux file system (`~/projects`), not under `/mnt/c`: crossing the boundary makes installs and file watching slow. VS Code's WSL extension edits those files natively, and `localhost` ports are forwarded to Windows browsers.

Why a pasted command fails:

| Tutorial (bash) | PowerShell | Why |
| --- | --- | --- |
| `export API_URL=x` | `$env:API_URL = 'x'` | `export` is a bash builtin |
| `NODE_ENV=production npm run build` | `$env:NODE_ENV = 'production'; npm run build` | No inline assignment prefix |
| `rm -rf dist` | `Remove-Item -Recurse -Force dist` | `rm` is an alias with different flags |
| `which node` | `Get-Command node` | No `which` |
| `touch a.txt` | `New-Item a.txt` | No `touch` |
| `source ~/.bashrc` | `. $PROFILE` | Different startup files |
| A trailing `\` to continue a line | A trailing backtick | Different escape character |
| `cmd1 && cmd2` | Works in 7, a parse error in 5.1 | Operator added in version 7 |

Two more Windows-specific surprises. PowerShell may refuse to run `npm` with "running scripts is disabled on this system", because npm's wrapper is a `.ps1` script and the default execution policy blocks scripts; `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` fixes it. And `package.json` scripts do not run in your interactive shell at all: npm runs them with `cmd.exe` on Windows, so a script that uses bash syntax fails in every one of the three unless it is written to be cross-platform.

A reasonable choice: use WSL 2 if you want the least friction with tutorials, tooling, and deployment environments; use PowerShell 7 plus Git Bash if you prefer to stay native. Whichever you pick, identify the shell first when a command fails. The prompt tells you (`PS C:\>` is PowerShell, `$` with a `MINGW64` label is Git Bash, `user@host:~$` is WSL).

**Try it:** Run these in each shell you have and explain every difference: `echo $HOME`, `ls -la`, `which node`, and setting a variable then reading it from `node -e "console.log(process.env.GREETING)"`. Then translate a three-line bash snippet from a README into PowerShell.

**Resources**
- [Microsoft Learn: How to install Linux on Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft Learn: What is PowerShell?](https://learn.microsoft.com/en-us/powershell/scripting/overview)
- [Microsoft Learn: Working across Windows and Linux file systems](https://learn.microsoft.com/en-us/windows/wsl/filesystems)

### Core workflow

Git tracks your project in three places. The **working tree** is the files on disk. The **index**, or staging area, is the snapshot you are assembling for the next commit. The **repository** is the history of commits. Almost every everyday command moves changes between these three or compares them.

```bash
git status                 # what is modified, staged, untracked; which branch
git diff                   # working tree vs index: changes not yet staged
git diff --staged          # index vs last commit: what the next commit will contain
git add src/app.js         # stage a file
git add -p                 # stage interactively, hunk by hunk
git commit -m "Fix total when cart is empty"
git log --oneline --graph --decorate -15
git show HEAD              # the last commit's message and diff
```

A commit is a full snapshot of the staged content plus a message, an author, a timestamp, and a pointer to its parent commit. It is identified by a hash of all that, so history cannot be altered without the hashes changing. `HEAD` is the commit you currently have checked out, usually via a branch name.

The staging area exists so that a commit can contain a deliberate subset of your changes. If you fixed a bug and reformatted an unrelated file, `git add -p` lets you commit them separately. Reading `git diff --staged` before every commit is the single most valuable habit: it is your last review before the change becomes history.

Common mistakes: running `git add .` without looking, which stages build output, `.env` files, or editor junk (set up `.gitignore` first, and note that it does not affect files already tracked); confusing `git diff`, which shows nothing once changes are staged, with `git diff --staged`; and using `git commit -a`, which skips staging for tracked files and silently ignores new files.

`git log` is searchable. `git log -S"functionName"` finds commits that added or removed a string, `git log -p -- path/to/file` shows a file's history with diffs, and `git blame file` shows who last changed each line and in which commit. `git commit --amend` replaces the last commit, which is fine before you push and a problem afterwards.

**Try it:** Make two unrelated edits in one file. Use `git add -p` to stage only one, verify with `git diff --staged` and `git diff`, and commit them as two separate commits. Then find the first with `git log -S`.

**Resources**
- [Pro Git: Recording changes to the repository](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository)
- [Git reference: git-status](https://git-scm.com/docs/git-status)
- [Pro Git: Viewing the commit history](https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History)

### Branching and merging

A branch is a movable pointer to a commit, nothing more. Creating one is instant and copies nothing. When you commit, the branch you are on moves forward to the new commit. That is the whole model, and it is why branches are cheap enough to create for every piece of work.

```bash
git switch -c feature/search      # create a branch and switch to it
git switch main                   # switch back
git branch -vv                    # list branches with their upstream and last commit
git merge feature/search          # merge it into the current branch
git branch -d feature/search      # delete a merged branch
```

`git merge` has two outcomes. If the current branch has no commits that the other lacks, Git simply moves the pointer forward: a **fast-forward**, with no new commit. If both sides have new commits, Git creates a **merge commit** with two parents, combining them. `--no-ff` forces a merge commit; `--ff-only` refuses to merge unless it can fast-forward.

A **conflict** happens when both branches changed the same lines, or one edited a file the other deleted. Git stops and marks the file:

```text
<<<<<<< HEAD
const total = items.reduce(sum, 0);
=======
const total = calculateTotal(items);
>>>>>>> feature/search
```

The top section is your current branch, the bottom is the branch being merged. With `merge.conflictStyle` set to `zdiff3` you also get the common ancestor's version in the middle, which makes it far easier to see what each side intended. To resolve: edit the file to the correct final content (which may be one side, both, or something new), remove all markers, `git add` the file, and `git commit`. `git status` tells you what remains, and `git merge --abort` returns you to the pre-merge state at any point.

Resolving a conflict is a code change, not a clerical task. Understand both changes, then run the tests, because Git only detects textual overlap. Two changes that merge cleanly can still break each other, such as one branch renaming a function another branch calls.

Keep branches short-lived and merge or rebase from `main` often; conflict size grows with how long branches diverge. VS Code's merge editor shows both sides and the result, which is easier than editing markers by hand.

**Try it:** Create two branches from the same commit, change the same line differently on each, and merge one into the other. Resolve the conflict by hand, then repeat and use `git merge --abort` instead. Inspect the result with `git log --graph --oneline --all`.

**Resources**
- [Pro Git: Basic branching and merging](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)
- [Pro Git: Branches in a nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
- [Git reference: git-merge](https://git-scm.com/docs/git-merge)

### Remotes

A remote is another copy of the repository, usually on a server, that you exchange commits with. `git clone <url>` copies one and names it `origin`. Your repository then holds three kinds of branch pointer: your local branches (`main`), **remote-tracking branches** (`origin/main`), which record where the remote's branches were the last time you communicated with it, and the actual branches on the server, which you cannot see directly.

```bash
git remote -v                    # list remotes and their URLs
git fetch origin                 # download new commits; update origin/* only
git log --oneline main..origin/main   # what the remote has that you do not
git pull                         # fetch, then integrate into the current branch
git push -u origin feature/search     # publish a branch and set its upstream
git push                         # later pushes need no arguments
```

`git fetch` is always safe: it updates `origin/*` and touches neither your branches nor your files. `git pull` is `fetch` followed by a merge or, with `pull.rebase` set to `true`, a rebase of your local commits on top of the remote's. Many engineers prefer to fetch, look, then integrate deliberately.

A **tracking branch** is a local branch with an upstream configured, which is what `-u` does. It lets `git status` report "ahead 2, behind 1", and lets plain `git pull` and `git push` know where to go. Setting `git config --global push.autoSetupRemote true` makes the first push of a new branch set the upstream automatically.

A push is rejected as "non-fast-forward" when the remote branch has commits you do not have. Git refuses to discard them. Integrate first (`git pull --rebase`), then push. Force-pushing is only legitimate on a branch that is yours alone, after rewriting it, and then use `git push --force-with-lease`, which aborts if the remote has moved since your last fetch.

Other things to know: `git fetch --prune` removes remote-tracking branches whose remote counterpart was deleted. With a fork you typically have two remotes, `origin` (your fork) and `upstream` (the original). And `origin/main` is only as fresh as your last fetch, so stale comparisons are a common source of confusion. How you prove your identity to the remote is covered in the next entry.

**Try it:** Clone a repository twice into two folders to simulate two people. Commit and push from one, then in the other run `git fetch`, compare with `git log main..origin/main`, and pull. Then commit in both and see the non-fast-forward rejection.

**Resources**
- [Pro Git: Remote branches](https://git-scm.com/book/en/v2/Git-Branching-Remote-Branches)
- [Pro Git: Working with remotes](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes)
- [Git reference: git-push](https://git-scm.com/docs/git-push)

### Authentication

A remote needs to know who you are before it accepts a push or serves a private repository. The remote's URL decides how you prove it: an `https://github.com/owner/repo.git` URL uses HTTPS with a token, and a `git@github.com:owner/repo.git` URL uses SSH with a key. `git remote -v` shows which you have and `git remote set-url origin <url>` switches. This is separate from `user.name` and `user.email`, which only label your commits and prove nothing.

**SSH keys.** You generate a key pair, keep the private key on your machine, and upload the public key to your account.

```bash
ssh-keygen -t ed25519 -C "you@example.com"   # accept the default path; set a passphrase
cat ~/.ssh/id_ed25519.pub                    # paste this into GitHub > Settings > SSH keys
ssh -T git@github.com                        # test: greets you by username
```

The passphrase encrypts the private key on disk, so a stolen laptop file is not a stolen identity. The SSH agent holds the unlocked key so you type the passphrase once per session (`ssh-add ~/.ssh/id_ed25519`; on macOS `--apple-use-keychain` stores it in the keychain, and on Windows the OpenSSH Authentication Agent service does the job). Never copy a private key between machines or paste it anywhere; make one key per machine and revoke it individually if the machine is lost.

**HTTPS and credential helpers.** GitHub and other hosts no longer accept your account password over HTTPS. Git asks a credential helper instead, which obtains a token and stores it in the operating system's secure store. Git Credential Manager is bundled with Git for Windows and available for macOS and Linux; it opens a browser sign-in the first time and is silent afterwards. `gh auth login` does the same job through the GitHub CLI and can configure either protocol for you. Check what is configured with `git config --get credential.helper`. Avoid the `store` helper, which writes credentials to a plain-text file.

**Personal access tokens** are for scripts, CI, and tools that cannot do an interactive sign-in. A token is a password with limits. Prefer fine-grained tokens: restrict them to specific repositories, grant the minimum permissions, and set an expiry. Treat one like a password: never commit it, never put it in a remote URL (it ends up in `.git/config` and shell history), and pass it to tools through an environment variable or secret store. If one leaks, revoke it immediately; deleting the commit is not enough, because it has already been copied.

Diagnosing failures:

- `Permission denied (publickey)`: the SSH key is not loaded in the agent, not added to your account, or you are using the wrong key. `ssh -vT git@github.com` shows which keys were offered.
- `Authentication failed` or a 403 over HTTPS: a stale or under-scoped stored token. Remove the saved credential (Windows Credential Manager, macOS Keychain) and sign in again.
- "Repository not found" on a repository you know exists usually means you are authenticated as an account without access.
- Organisations that use single sign-on require you to authorise each key or token for that organisation.

Either protocol is fine. SSH is simple once set up; HTTPS with a credential manager works through restrictive corporate networks and needs no key management.

**Try it:** Run `git remote -v` in a repository and identify the protocol. Set up the one you are not using: generate an SSH key, add it to your account, and verify with `ssh -T`, or sign in with `gh auth login` and inspect `gh auth status`. Then switch the remote URL and push.

**Resources**
- [GitHub Docs: Generating a new SSH key and adding it to the ssh-agent](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- [Git reference: gitcredentials](https://git-scm.com/docs/gitcredentials)
- [GitHub Docs: Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

### Ignoring and attributes

Two committed files tell Git how to treat paths: `.gitignore` says which untracked files to leave out, and `.gitattributes` says how to handle the files that are in.

**`.gitignore`** lists patterns, one per line, for files Git should not offer to track: dependencies, build output, logs, local environment files, editor and OS clutter.

```text
node_modules/
dist/
coverage/
*.log
.env
.env.*
!.env.example
.DS_Store
/config.local.json
```

Pattern rules: a trailing `/` matches directories only; a leading `/` anchors the pattern to the directory containing the `.gitignore`, where otherwise it matches at any depth; `*` does not cross `/` but `**` does; and `!` re-includes something an earlier pattern excluded. Later lines win. One trap: you cannot re-include a file whose parent directory is ignored, because Git never looks inside an ignored directory. Ignore `logs/*` and then `!logs/.gitkeep`, not `logs/`.

The rule everyone trips over: **`.gitignore` only affects untracked files.** If a file was already committed, adding it to `.gitignore` changes nothing and Git keeps tracking its changes. To stop tracking it while keeping it on disk:

```bash
git rm --cached .env             # or: git rm -r --cached dist/
git commit -m "Stop tracking .env"
```

The file remains in every earlier commit. If it held a secret, rotate the secret; untracking does not un-leak it.

Useful tools: `git check-ignore -v path` names the file and line responsible for ignoring a path, and `git status --ignored` lists what is being ignored. Personal clutter that is specific to your machine or editor belongs in a global ignore file (`~/.config/git/ignore`, or whatever `core.excludesFile` points to), not in every project's `.gitignore`. `.git/info/exclude` is a per-clone ignore list that is not shared.

**`.gitattributes`** assigns attributes to paths. Its most important job is line endings. Windows tools traditionally end lines with CRLF and everything else uses LF; when the two mix, every line of a file shows as changed, and shell scripts break with `\r` errors. Individual `core.autocrlf` settings differ from machine to machine, so settle it in the repository:

```text
* text=auto eol=lf
*.bat text eol=crlf
*.png binary
```

`text=auto` lets Git detect text files and store them with LF; `eol=lf` checks them out with LF on every platform; `binary` stops Git from touching or diffing a file. After adding this to an existing repository, run `git add --renormalize .` and commit the result once. `git ls-files --eol` shows the line endings in the index and working tree for each file.

Attributes also control diffs and merges: `package-lock.json -diff` suppresses noisy lockfile diffs in `git diff`, and on GitHub `linguist-generated` collapses generated files in pull requests.

**Try it:** Commit a file named `secret.env`, add it to `.gitignore`, edit it, and observe that `git status` still reports it. Untrack it with `git rm --cached` and confirm with `git check-ignore -v`. Then add the `.gitattributes` above, renormalise, and inspect `git ls-files --eol`.

**Resources**
- [Git reference: gitignore](https://git-scm.com/docs/gitignore)
- [Git reference: gitattributes](https://git-scm.com/docs/gitattributes)
- [GitHub Docs: Configuring Git to handle line endings](https://docs.github.com/en/get-started/git-basics/configuring-git-to-handle-line-endings)

### Rebase

Rebasing replays your commits on top of a different base. Where a merge ties two histories together with a merge commit, a rebase rewrites your branch so that it looks as if you started from the latest `main`, giving a linear history.

```bash
git switch feature/search
git fetch origin
git rebase origin/main
```

Git finds the commits on your branch that are not in `origin/main`, sets them aside, moves your branch to `origin/main`, and reapplies them one at a time. Each reapplied commit is a **new commit with a new hash**, even if its content is identical. If a commit conflicts, the rebase pauses: fix the files, `git add` them, and `git rebase --continue`. `git rebase --abort` returns everything to how it was.

Interactive rebase edits your own commits before you share them:

```bash
git rebase -i origin/main
```

Git opens a list of your commits, oldest first, each prefixed with `pick`. Change the word to alter what happens: `reword` edits the message, `squash` merges the commit into the one above and combines messages, `fixup` does the same but drops the message, `edit` pauses so you can amend or split it, and `drop` deletes it. You can also reorder lines. A common flow is to commit a small fix with `git commit --fixup <hash>` and later run `git rebase -i --autosquash`, which arranges the fixups for you.

The rule: **do not rebase commits that other people have based work on.** Because rebasing creates new commits, anyone who has the old ones ends up with duplicated, diverged history. Rebasing your own feature branch is normal, including one already pushed for a pull request, but it then requires `git push --force-with-lease`. Never rebase `main` or any shared branch.

Practical notes: during a rebase the conflict labels are reversed from what you may expect, because "ours" is the branch being rebuilt on (`main`) and "theirs" is your commit being applied. Because commits are replayed individually, you may resolve similar conflicts several times; squashing first, or enabling `git config --global rerere.enabled true`, reduces that. If a rebase goes wrong after it has finished, `git reflog` shows the commit your branch pointed to before, and `git reset --hard` to that restores it.

**Try it:** On a branch with four small commits, including one "fix typo" commit, run `git rebase -i` to fold the typo fix into the commit it belongs to and reword another. Compare `git log --oneline` before and after, noting that every hash changed.

**Resources**
- [Pro Git: Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing)
- [Pro Git: Rewriting history](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)
- [Git reference: git-rebase](https://git-scm.com/docs/git-rebase)

### Undoing

Git has a different undo command for each of its three areas, and choosing correctly depends on what you want to undo and whether it has been shared.

**Working tree and index.** `git restore file` discards unstaged edits to a file, permanently. `git restore --staged file` unstages it but keeps your edits. `git restore --source=HEAD~2 file` brings back an older version of one file.

**Local commits.** `git reset` moves the current branch to another commit. Its three modes differ in what happens to the changes from the commits you moved past:

| Command | Branch moves | Index | Working tree |
| --- | --- | --- | --- |
| `git reset --soft HEAD~1` | Yes | Kept (changes stay staged) | Kept |
| `git reset --mixed HEAD~1` (default) | Yes | Reset (changes unstaged) | Kept |
| `git reset --hard HEAD~1` | Yes | Reset | Reset (changes discarded) |

`--soft` is for "redo that commit"; `--hard` throws work away. `git commit --amend` is the shortcut for fixing just the last commit.

**Shared commits.** `git revert <hash>` creates a new commit that applies the inverse of an earlier one. History is added to, not rewritten, so it is the safe way to undo something already pushed to a shared branch. Reverting a merge commit needs `-m 1` to say which parent is the mainline.

**Parking work.** `git stash` saves uncommitted changes and cleans the working tree; `git stash pop` reapplies them. Add `-u` to include untracked files, and `git stash list` to see what you have. Stashes are easy to forget, so for anything longer than a few minutes a work-in-progress commit on a branch is safer.

**The safety net.** `git reflog` is a local log of every position `HEAD` has held: commits, switches, resets, rebases. After a bad reset or rebase, the commits still exist; find the entry from before the mistake and return to it.

```bash
git reflog
# a1b2c3d HEAD@{0}: reset: moving to HEAD~3
# 9f8e7d6 HEAD@{1}: commit: Add search filters
git reset --hard HEAD@{1}      # or: git switch -c rescue 9f8e7d6
```

Reflog entries last about 90 days by default and exist only on your machine. The reflog cannot save changes that were never committed or stashed: `git restore file`, `git reset --hard`, and `git clean` destroy uncommitted work for good. When in doubt, commit first.

**Try it:** Make three commits, run `git reset --hard HEAD~3`, and confirm with `git log` that they are gone. Bring them back using `git reflog`. Then undo one of them properly with `git revert` and read the resulting history.

**Resources**
- [Pro Git: Reset demystified](https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified)
- [Git reference: git-reflog](https://git-scm.com/docs/git-reflog)
- [Oh Shit, Git!?!](https://ohshitgit.com/)

### Good commits

A commit is a unit of change that someone will later read, review, revert, cherry-pick, or land on during a bisect. It serves those purposes well when it does one logical thing and leaves the project in a working state.

Small and focused means: one bug fix, one refactor, or one feature step per commit. Do not mix a behaviour change with reformatting or renaming, because the meaningful lines get buried and the commit cannot be reverted without undoing unrelated work. Use `git add -p` to separate changes that you made together. Each commit should build and pass tests on its own, which is what makes `git bisect` and `git revert` useful later.

The message has a conventional shape:

```text
Fix cart total when a discount exceeds the subtotal

The total went negative when a fixed-amount coupon was larger than
the subtotal, which the payment provider rejects with a 400.

Clamp the discounted total at zero and show the unused remainder
in the summary. Percentage discounts are unaffected.

Fixes #482
```

- A subject line of roughly 50 characters, capitalised, no trailing full stop, written in the imperative ("Fix", "Add", "Remove"), so it completes the sentence "If applied, this commit will…".
- A blank line. Tools rely on it to separate subject from body.
- A body, wrapped at about 72 characters, that explains **why**: the problem, the reasoning, the alternatives you rejected, any side effects. The diff already shows what changed; it cannot show the motivation.
- References to issues or tickets at the end.

Messages like "fix", "wip", "updates", or "address review comments" tell the future reader nothing. A good test: would this subject line make sense in `git log --oneline` a year from now, to someone who was not there?

Many teams use Conventional Commits, a prefix format such as `fix(cart): clamp negative totals` or `feat: add search filters`, which allows changelogs and version bumps to be generated automatically. Follow the convention of the repository you are working in.

You do not need to get it right first time. Commit freely while working, then tidy with `git commit --amend` and `git rebase -i` before pushing. If the team squash-merges pull requests, the pull request title and description become the commit, so apply the same standards there.

**Try it:** Take your last piece of work with messy commits, and use `git rebase -i` to restructure it into commits that each do one thing with a subject and a "why" body. Check the result with `git log --oneline` and `git show` on each.

**Resources**
- [Pro Git: Contributing to a project - commit guidelines](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project)
- [Chris Beams: How to write a Git commit message](https://cbea.ms/git-commit/)
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)

### Pull requests

A pull request (PR; GitLab calls it a merge request) proposes merging one branch into another and gives the team a place to review, discuss, and run automated checks before it lands. The mechanics are simple: push a branch, open the PR against `main`, respond to review, merge.

```bash
git switch -c fix/cart-negative-total
# ...commit...
git push -u origin fix/cart-negative-total
gh pr create --fill          # or use the link Git prints after pushing
```

What makes a PR good to review:

- **Small.** A few hundred changed lines at most. Review quality drops sharply with size, and small PRs merge faster. Split refactoring from behaviour changes.
- **Self-explanatory.** The description says what changed and why, how to test it, and includes screenshots or a recording for UI changes. Link the issue. Point out anything risky or anything you are unsure about.
- **Self-reviewed.** Read your own diff in the PR view before requesting review. You will find leftover logs and unrelated changes.
- **Green.** CI passes before you ask for someone's time. Open it as a draft if it is not ready.

Responding to feedback: reply to every comment, even if only to say it is done. Push follow-up commits rather than force-pushing over reviewed work, unless the team prefers otherwise, so reviewers can see what changed since their last look. When you disagree, explain your reasoning and ask questions; if a thread goes back and forth more than twice, talk directly. Feedback is about the code, not about you.

Reviewing others: understand the purpose first, then check correctness, edge cases, tests, naming, and whether the change is simpler than it could be. Check out the branch and run it for anything non-trivial (`gh pr checkout 123`). Be specific and kind, mark minor points as optional ("nit:"), explain why, and approve when the change improves the codebase even if it is not exactly how you would have written it. Leave formatting to the automated tools.

Merging has three strategies: a **merge commit** keeps all commits plus a merge, **squash and merge** collapses the PR to one commit on `main`, and **rebase and merge** replays the commits without a merge commit. Teams choose one; squash is the most common. Keep your branch current by rebasing on or merging `main`, and delete the branch after merging.

**Try it:** In a repository of your own, protect `main`, open a PR from a branch with a proper description, leave review comments on your own diff, address them in a new commit, and merge with squash. Then inspect what `main`'s history looks like.

**Resources**
- [GitHub Docs: About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [GitHub Docs: About pull request reviews](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews)
- [Google Engineering Practices: Code review](https://google.github.io/eng-practices/review/)

### `git bisect`

When something worked at an older commit and is broken now, `git bisect` finds the commit that introduced the problem by binary search. You mark one commit as good and one as bad; Git checks out the midpoint; you test and report; it halves the range again. A thousand commits take about ten steps.

```bash
git bisect start
git bisect bad                 # the current commit is broken
git bisect good v2.3.0         # this tag (or hash) was fine
# Git checks out a commit in the middle. Test it, then:
git bisect good                # or: git bisect bad
# ...repeat until Git prints "<hash> is the first bad commit"
git bisect reset               # return to where you started
```

If you can express the test as a command, automate the whole search. `git bisect run` uses the command's exit code: 0 means good, 1 to 127 (except 125) means bad, and 125 means "cannot test this commit, skip it".

```bash
git bisect start HEAD v2.3.0
git bisect run npm test -- cart.test.js
```

For a bug with no existing test, write a small script that reproduces it and exits non-zero on failure, and keep it outside the repository or untracked so it survives each checkout.

Things that make bisecting work in practice:

- If a commit cannot be built or tested for unrelated reasons, use `git bisect skip`.
- Dependencies may differ between commits. If `package-lock.json` changed, reinstall (`npm ci`) at each step, or include it in your run script.
- The terms need not mean good and bad. To find when something was fixed or when performance changed, use `git bisect start --term-old=slow --term-new=fast`.
- `git bisect log` records your answers; `git bisect replay` re-runs them if you make a mistake.
- Always finish with `git bisect reset`, or you are left on a detached `HEAD` in the middle of history.

Bisect is only as precise as your history. If every commit builds and does one thing, the answer is a small diff you can read in a minute. If commits are huge or broken, the answer is a 2,000-line commit, or a string of skips. This is the practical payoff of good commit discipline. Bisect is especially good for regressions where you have no idea where to look, including "it was fine last release".

**Try it:** In a test repository, write a script that creates twenty commits, with one of them changing a function to return the wrong value. Write a one-line Node check that exits 1 when the value is wrong, and find the culprit with `git bisect run`.

**Resources**
- [Git reference: git-bisect](https://git-scm.com/docs/git-bisect)
- [Pro Git: Debugging with Git](https://git-scm.com/book/en/v2/Git-Tools-Debugging-with-Git)

### Cherry-pick and worktrees

These are two unrelated tools for the same situation: you need something from, or on, a branch other than the one you are working on.

**Cherry-pick** copies the change made by one commit onto your current branch as a new commit.

```bash
git switch release/2.4
git cherry-pick -x 3f9a2c1          # apply that commit here
git cherry-pick a1b2c3d^..e4f5a6b   # a range, inclusive of both ends
```

Git computes the diff that commit introduced and applies it to your current `HEAD`. The result has the same message and author but a **new hash**, because its parent is different. `-x` appends "(cherry picked from commit ...)" to the message, which is worth doing on shared branches so the origin is traceable. If the change does not apply cleanly you get a conflict, resolved exactly as in a merge: fix, `git add`, `git cherry-pick --continue`, or bail out with `--abort`. `-n` applies the change without committing.

Good uses: backporting a bug fix from `main` to a release branch; rescuing one good commit from an abandoned branch; moving a commit you made on the wrong branch. Use it sparingly, because the same change now exists as two different commits. If those branches are later merged, Git usually copes, but history shows the change twice and conflicts are more likely. When you want everything from a branch, merge or rebase it. A cherry-picked commit may also depend on earlier commits you did not bring, so run the tests.

**Worktrees** let one repository have several working directories, each with a different branch checked out. The usual alternative when an urgent fix interrupts your work is to stash or make a work-in-progress commit, switch branches, reinstall dependencies, fix, and switch back. A worktree avoids disturbing your work at all.

```bash
git worktree add ../myapp-hotfix -b hotfix/login origin/main
cd ../myapp-hotfix && npm ci        # a separate folder with its own node_modules
# ...fix, commit, push, open the PR...
cd ../myapp
git worktree remove ../myapp-hotfix
git worktree list
```

All worktrees share one object database, so commits, branches, stashes, and fetches made in one are visible in the others at once, and creating one is far cheaper than a second clone. Each has its own working files, index, and `HEAD`.

What to know: a branch can be checked out in only one worktree at a time, and Git refuses a second checkout. Untracked and ignored files are not shared, so each worktree needs its own `npm ci` and its own `.env`. Dev servers in two worktrees need different ports. Remove worktrees with `git worktree remove`; if you delete the folder by hand, `git worktree prune` clears the stale record. Worktrees are also the comfortable way to review a colleague's branch, run a long test suite or a `git bisect` in the background, or compare two branches side by side in two editor windows.

**Try it:** Create a fix commit on `main`, then cherry-pick it onto an older branch with `-x` and compare the two commits' hashes and diffs with `git show`. Next, with uncommitted changes in your main folder, add a worktree for a new branch, commit there, and confirm with `git log --all --oneline` from the original folder that the commit is visible while your uncommitted changes are untouched.

**Resources**
- [Git reference: git-cherry-pick](https://git-scm.com/docs/git-cherry-pick)
- [Git reference: git-worktree](https://git-scm.com/docs/git-worktree)

### Git hooks

A hook is a script that Git runs at a fixed point in its workflow. If a "pre" hook exits with a non-zero status, Git aborts the operation. The ones that matter for a frontend project:

- `pre-commit` runs before a commit is created. Use it to format and lint the files being committed.
- `commit-msg` receives the message file and can reject messages that do not follow the team's convention.
- `pre-push` runs before a push. Use it for slower checks such as type checking or unit tests.

Hooks live in `.git/hooks`, which is not part of the repository's tracked content, so they are not shared by cloning. A **hook manager** solves that by keeping hook scripts in a committed directory and pointing Git at it through the `core.hooksPath` setting. Husky is the common choice in JavaScript projects:

```bash
npm install --save-dev husky lint-staged
npx husky init
```

`husky init` creates `.husky/pre-commit` and adds `"prepare": "husky"` to your `package.json` scripts. npm runs `prepare` after every install, so each teammate gets the hooks without doing anything. A hook file is just the shell commands to run:

```bash
# .husky/pre-commit
npx lint-staged
```

**lint-staged** is what makes a pre-commit hook fast enough to live with. Running the linter and formatter over the whole project on every commit takes long enough that people start bypassing it. lint-staged runs your commands only on the files that are staged, passing their paths as arguments:

```json
{
  "lint-staged": {
    "*.{js,ts,jsx,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,md,json}": "prettier --write"
  }
}
```

It also handles partially staged files correctly: unstaged changes are hidden while the commands run, fixes are added to the commit, and everything is restored if a command fails.

Using hooks well:

- **Hooks are a convenience, not enforcement.** Anyone can skip them with `git commit --no-verify`, and they do not run for commits made in a web UI. CI must run the same checks; the hook exists to give faster feedback.
- **Keep `pre-commit` under a few seconds.** Put the test suite and type checking in `pre-push` or leave them to CI.
- **Type checking does not fit lint-staged's model.** `tsc` needs the whole project, and passing it file names makes it ignore `tsconfig.json`. Run `tsc --noEmit` on the whole project in `pre-push` instead.
- **Hooks run in a shell.** Husky hooks are executed with `sh`, which on Windows is the one bundled with Git, so keep them to simple commands and put real logic in `package.json` scripts or Node scripts.
- **Skip installation where it is not wanted.** Setting the environment variable `HUSKY=0` disables it, which is useful in CI and production installs.
- A hook that modifies files other than through lint-staged leaves those changes out of the commit.

Lefthook is a popular alternative: a single binary configured with one YAML file that runs commands in parallel. The concepts are the same.

**Try it:** Add Husky and lint-staged to a project. Stage a badly formatted file containing an ESLint error that cannot be auto-fixed and try to commit: the commit should be blocked. Fix the error and commit again, and check that the formatting fix was included. Then commit with `--no-verify` to see why CI still has to check.

**Resources**
- [Pro Git: Git hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [Husky: Get started](https://typicode.github.io/husky/get-started.html)
- [lint-staged documentation (GitHub)](https://github.com/lint-staged/lint-staged)

### GitHub CLI

`gh` is GitHub's official command-line tool. Git itself knows nothing about pull requests, reviews, issues, or CI runs; those are GitHub features, normally reached through the website. `gh` brings them to the terminal, which keeps you in one place and makes them scriptable. Install it, then run `gh auth login` once; it signs you in through the browser and can configure Git's credentials for you. Commands infer the repository from the current directory's remotes.

**Pull requests**

```bash
gh pr create --fill              # title and body from your commits; --draft for a draft, --web to finish in the browser
gh pr status                     # your PRs, and those awaiting your review
gh pr list --author "@me"
gh pr view 123                   # description, reviews, checks; --web opens it
gh pr checkout 123               # fetch a PR's branch, including from a fork, and switch to it
gh pr diff 123
gh pr review 123 --approve       # or --request-changes -b "..." / --comment -b "..."
gh pr merge 123 --squash --delete-branch
```

`gh pr checkout` is the one to adopt first. Reviewing by running the code catches what reading a diff does not, and this turns it into one command, including for forks where you would otherwise add a remote by hand.

**CI**

```bash
gh pr checks --watch             # status of every check on the current branch's PR; waits until they finish
gh run list --limit 5            # recent GitHub Actions runs
gh run view <run-id> --log-failed    # only the log lines from failed steps
gh run rerun <run-id> --failed       # re-run just the failed jobs
gh run watch                     # follow a run live
```

`gh pr checks --watch` followed by `gh run view --log-failed` replaces refreshing the Checks tab and scrolling through thousands of log lines. `--fail-fast` makes the watch exit on the first failing check.

**Everything else.** `gh repo clone owner/name`, `gh repo fork --clone`, `gh repo sync`, `gh issue list` and `gh issue create`, `gh browse` (open the repository, or `gh browse src/app.js:42` for a specific line), and `gh release create`.

**Scripting.** Most commands accept `--json <fields>` with `--jq <expression>` to produce structured output:

```bash
gh pr list --json number,title,reviewDecision \
  --jq '.[] | select(.reviewDecision == "APPROVED") | "\(.number) \(.title)"'
```

`gh api` calls any REST or GraphQL endpoint with your authentication for whatever has no dedicated command, and `gh alias set` defines shortcuts. In GitHub Actions `gh` is preinstalled; give it the workflow's token through the `GH_TOKEN` environment variable.

Notes: every command has `--help`, and running a command with no flags usually prompts interactively. `gh pr create` pushes the branch for you if needed and asks where. On a fork it targets the upstream repository by default. Other hosts have equivalents, such as `glab` for GitLab.

**Try it:** Complete a full pull request without opening the website: create a branch and commit, `gh pr create --fill`, `gh pr checks --watch`, read a failing log with `gh run view --log-failed` (break a test on purpose), fix and push, then `gh pr merge --squash --delete-branch`.

**Resources**
- [GitHub CLI manual](https://cli.github.com/manual/)
- [GitHub Docs: GitHub CLI quickstart](https://docs.github.com/en/github-cli/github-cli/quickstart)
- [GitHub CLI manual: gh pr checks](https://cli.github.com/manual/gh_pr_checks)

### Node.js basics

Node.js is a JavaScript runtime: the V8 engine that Chrome uses, plus an event loop and a standard library for things a browser does not permit, such as reading files, starting processes, and opening network sockets. The language is the same; the environment is different. There is no `window`, `document`, or DOM. In their place are `process` (arguments, environment, exit codes), built-in modules such as `node:fs` and `node:path`, and the file system.

For a frontend engineer Node matters because every tool you use runs on it: bundlers, linters, test runners, and dev servers are all Node programs.

```js
// scripts/count-lines.js
import { readFile } from 'node:fs/promises';

const [file] = process.argv.slice(2);
if (!file) {
  console.error('Usage: node count-lines.js <file>');
  process.exit(1);
}

const text = await readFile(file, 'utf8');
console.log(`${file}: ${text.split('\n').length} lines`);
```

Run it with `node scripts/count-lines.js README.md`. `node` with no arguments opens a REPL for quick experiments.

Things to know:

- **Modules.** Node supports ES modules (`import`) and the older CommonJS (`require`). A `.js` file is treated as ESM when the nearest `package.json` has `"type": "module"`; `.mjs` is always ESM and `.cjs` always CommonJS. Prefer ESM for new code. In ESM, relative imports need the file extension, and `import.meta.dirname` and `import.meta.filename` replace `__dirname` and `__filename`.
- **Built-ins.** Import them with the `node:` prefix. Prefer the promise APIs (`node:fs/promises`). Build paths with `path.join()`, never by concatenating strings with `/`.
- **Paths are relative to where the process was started** (`process.cwd()`), not to the script file. Resolve against `import.meta.dirname` when you mean "next to this file".
- **Web-compatible globals.** Modern Node provides `fetch`, `URL`, `AbortController`, `structuredClone`, and `crypto.randomUUID()`, so much browser knowledge transfers.
- **Useful flags.** `node --watch file.js` restarts on change, `node --env-file=.env` loads environment variables, `node --test` runs the built-in test runner, and `node --inspect` lets you attach Chrome DevTools as a debugger.
- **TypeScript.** Current Node versions run `.ts` files directly by stripping the type annotations. Nothing is type-checked, and syntax that needs code generation, such as `enum`, is not supported in that mode.

An unhandled promise rejection or uncaught exception terminates the process with a non-zero exit code, which is what you want in a script.

**Try it:** Write a script that reads `package.json` from the current directory, prints its dependency names sorted alphabetically, and exits with code 1 and a message on stderr if the file is missing. Run it from two different directories to see how relative paths resolve.

**Resources**
- [Node.js: Introduction to Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)
- [Node.js API: File system](https://nodejs.org/api/fs.html)
- [Node.js API: ECMAScript modules](https://nodejs.org/api/esm.html)

### Version management

Node releases a new major version regularly, and projects depend on specific ones. A release line is "Current" for its first six months, while the ecosystem catches up, and the lines that are promoted to LTS (long-term support) are what you should use for real work. Until now only even-numbered majors became LTS; from Node 27 the project moves to one major a year, each of which becomes LTS. In early October 2026 the LTS lines are 24 and 22, and 26 is the Current release, due for promotion to LTS later in the month. Check the release schedule rather than trusting a tutorial, including this one.

A version manager installs several Node versions side by side and switches between them per project or per shell. Without one, a single system-wide install forces every project onto one version and makes "works on my machine" bugs inevitable.

```bash
# fnm
fnm install 24
fnm use 24
fnm default 24
node --version
```

The point is to **pin** the version in the repository so that everyone, and CI, uses the same one. Commit a `.nvmrc` or `.node-version` file containing the version (for example `24` or an exact `24.9.0`). `fnm` and `nvm` both read `.nvmrc`; `fnm` also reads `.node-version`, as do most CI setup actions and hosting platforms; `mise` uses its own `mise.toml` by default. With `fnm env --use-on-cd` in your shell profile, the version switches automatically when you `cd` into the project.

The main tools:

- **fnm** is a single fast binary that works on macOS, Linux, and Windows. A good default.
- **nvm** is the original, a shell script for macOS and Linux (and WSL). It is ubiquitous in documentation but slower to load, and does not support Windows natively; `nvm-windows` is a separate project with different behaviour.
- **mise** manages versions of many tools, not only Node, from one `mise.toml` file (`mise use node@24` writes it), and can also load environment variables and run tasks. It is the natural choice when a project also pins other tools. Note that it does not read `.nvmrc` or `.node-version` unless you enable that with `mise settings add idiomatic_version_file_enable_tools node`.

You will also meet Volta in existing projects. Its maintainers announced in late 2025 that it is no longer maintained, so do not pick it for new setups.

Complement the pin with the `engines` field in `package.json` (`"engines": { "node": ">=24" }`). By default npm only warns when it is not satisfied; setting `engine-strict=true` in the project's `.npmrc` makes it an error. Keep the CI configuration reading from the same file (for example `node-version-file: .nvmrc` in GitHub Actions' `setup-node`) so there is one source of truth.

The typical symptom of a version mismatch is not a clear message: it is a syntax error on a newer language feature, a native module failing to load, or a lockfile that changes when a teammate installs. Check `node --version` early when something inexplicable happens.

**Try it:** Install a version manager and two Node LTS versions. Add a `.nvmrc` to a project, enable automatic switching, and confirm `node --version` changes as you `cd` in and out. Add an `engines` field and `engine-strict`, switch to the wrong version, and run `npm install`.

**Resources**
- [Node.js: Releases and the release schedule](https://nodejs.org/en/about/previous-releases)
- [fnm: Fast Node Manager (GitHub)](https://github.com/Schniz/fnm)
- [mise: Node](https://mise.jdx.dev/lang/node.html)

### npm fundamentals

npm is three things: a registry of packages, the CLI that installs them, and the `package.json` format that describes a project. `npm init -y` creates the file.

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "format": "prettier . --write",
    "test": "vitest run",
    "check": "npm run lint && npm test"
  },
  "dependencies": {
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "eslint": "^10.0.0",
    "prettier": "3.6.2",
    "vite": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

`npm install <pkg>` adds a package to `dependencies`; `npm install -D <pkg>` adds it to `devDependencies`. Both download into `node_modules` and update the lockfile. `npm install` with no arguments installs everything listed.

**Dependencies versus devDependencies.** `dependencies` are what the code needs to run; `devDependencies` are what you need to build, test, and lint it. The difference has real effect in two cases: when you publish a library, consumers install only your `dependencies`; and `npm install --omit=dev` skips dev packages on a production server. In a bundled frontend app everything is consumed at build time, so the split is mostly documentation, but keep it accurate anyway. `peerDependencies` say "the host project must provide this", which is how a React component library avoids bundling a second copy of React.

**Scripts** are the project's command interface. `npm run <name>` runs one, with `node_modules/.bin` added to the `PATH`, so locally installed CLIs work by name. `start` and `test` can omit `run`. Pass extra arguments after `--`: `npm test -- --watch`. Scripts named `pre<name>` and `post<name>` run automatically around `<name>`. Prefer scripts over asking teammates to remember commands, and keep them cross-platform.

Other things worth knowing: `npx <pkg>` runs a package binary, downloading it temporarily if it is not installed. `npm ls <pkg>` and `npm explain <pkg>` show why a package is in your tree. `npm outdated` lists available updates and `npm update` applies those permitted by your ranges. `"private": true` prevents accidental publishing. Never commit `node_modules`; add it to `.gitignore`. Avoid `npm install -g` for project tools, since a global version is invisible to teammates and CI.

**Try it:** Create a project with `npm init -y`, install one runtime and one dev dependency, add `lint` and `check` scripts, then delete `node_modules` and restore it with `npm ci`. Run `npm explain` on a transitive dependency to see what pulled it in.

**Resources**
- [npm Docs: package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json)
- [npm Docs: scripts](https://docs.npmjs.com/cli/v11/using-npm/scripts)
- [npm Docs: npm install](https://docs.npmjs.com/cli/v11/commands/npm-install)

### Lockfiles

`package.json` lists the packages you asked for, as version **ranges**. Your project actually runs on hundreds of packages, most of them dependencies of dependencies, each of which must resolve to one concrete version. The lockfile (`package-lock.json` for npm, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`) records that resolution: the exact version of every package in the tree, where it was downloaded from, and an integrity hash of its contents.

Without a lockfile, `"vite": "^7.0.0"` means "the newest 7.x at the moment of install". You install on Monday and get 7.0.4; a teammate installs on Friday and gets 7.1.0; CI gets something else. A bug that appears in only one of those environments is extremely hard to diagnose. With a committed lockfile, everyone gets identical trees until someone deliberately changes it.

So: **commit the lockfile**, for applications always. It gives you reproducible installs, faster installs (resolution is already done), a reviewable record of what changed, and tamper detection via the integrity hashes.

The two install commands behave differently:

- `npm install` respects the lockfile when it satisfies `package.json`, but will update it if you changed `package.json` or if something is missing.
- `npm ci` installs exactly what the lockfile says, deletes `node_modules` first, and fails if the lockfile and `package.json` disagree. It never writes the lockfile. Use it in CI and whenever you want a clean, exact install. (pnpm and Yarn equivalents: `pnpm install --frozen-lockfile`, `yarn install --immutable`.)

Working with it day to day:

- Do not edit it by hand. To update a package, use `npm update <pkg>` or `npm install <pkg>@<version>` and commit the resulting change with the `package.json` change.
- For merge conflicts in the lockfile, do not resolve the markers manually. Resolve `package.json` first, then run `npm install`, which regenerates a consistent lockfile, and commit it.
- An unexpectedly large lockfile diff in a PR deserves a look. It usually means a different npm or Node version, a different package manager, or deleting and regenerating the file, which silently upgrades everything in range at once.
- Use one package manager per project and commit only its lockfile. The `packageManager` field in `package.json` records which one and which version.
- Deleting the lockfile and `node_modules` "to fix things" discards the pinning and swaps one problem for unknown new ones. Treat it as a last resort.

Libraries are a partial exception: the lockfile of a published package is not used by its consumers, who resolve your ranges themselves. Library authors still commit it for reproducible development.

**Try it:** In a project, look up one transitive dependency in `package-lock.json` and find its `version`, `resolved`, and `integrity` fields. Then change a version in `package.json` by hand without installing, and run `npm ci` to see the mismatch error.

**Resources**
- [npm Docs: package-lock.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json)
- [npm Docs: npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci)

### Semver

Semantic versioning gives a version number the form `MAJOR.MINOR.PATCH` and a meaning to each part. A **patch** release (1.4.2 to 1.4.3) contains only backwards-compatible bug fixes. A **minor** release (1.4.2 to 1.5.0) adds functionality without breaking existing use. A **major** release (1.4.2 to 2.0.0) contains breaking changes. Pre-releases append a tag, such as `2.0.0-beta.1`, and sort before the final version.

In `package.json` you write ranges, which say which future versions you will accept:

| Range | Matches | Meaning |
| --- | --- | --- |
| `1.4.2` | 1.4.2 only | Exact pin |
| `~1.4.2` | `>=1.4.2 <1.5.0` | Patch updates |
| `^1.4.2` | `>=1.4.2 <2.0.0` | Minor and patch updates |
| `^0.4.2` | `>=0.4.2 <0.5.0` | For 0.x, caret only allows patches |
| `^0.0.3` | 0.0.3 only | For 0.0.x, caret allows nothing |
| `>=1.4.0 <3` | An explicit range | |
| `*` or `latest` | Anything | Avoid |

The caret, which `npm install` writes by default, means "do not change the leftmost non-zero digit". The 0.x behaviour follows from the specification: before 1.0.0, anything may change at any time, so a minor bump is treated as potentially breaking. Many widely used packages stay on 0.x for years, and people are regularly surprised that `^0.4.2` does not pick up 0.5.0.

How to reason about upgrades:

- Semver is a promise made by humans, not something enforced. Patch releases break things regularly, because one person's bug fix is a change in behaviour that someone else relied on. Your lockfile and your tests are the real protection.
- A range only matters when the lockfile is created or updated. Between those moments, the lockfile decides what is installed.
- Before a major upgrade, read the changelog or migration guide, upgrade one major at a time, and do it in its own branch and PR.
- `npm outdated` shows three columns: Current (installed), Wanted (the newest your range allows), and Latest. `npm update` moves you to Wanted; going to Latest across a major requires `npm install pkg@latest`.
- Automated tools such as Dependabot or Renovate open upgrade PRs for you; keep them small and frequent rather than doing one painful yearly upgrade.
- Some teams pin exact versions for tools whose output changes between releases, such as formatters, so that a patch release does not reformat the codebase unexpectedly. Prettier's own install instructions use `--save-exact` for this reason.

**Try it:** Use the npm semver calculator to test `^1.2.3`, `~1.2.3`, `^0.2.3`, and `^0.0.3` against a real package's version list, predicting each result first. Then run `npm outdated` in a project and explain the Wanted and Latest columns for two packages.

**Resources**
- [Semantic Versioning 2.0.0](https://semver.org/)
- [npm semver calculator](https://semver.npmjs.com/)
- [node-semver: the range syntax npm implements (GitHub)](https://github.com/npm/node-semver#ranges)

### Alternative managers

npm ships with Node and is the baseline, but three alternatives are common. They all read `package.json` and install from the same registry; they differ in how they store packages, how strict they are, speed, and extra features. You will join projects that use each, so recognise them by their lockfile.

| Manager | Lockfile | Distinguishing design |
| --- | --- | --- |
| npm | `package-lock.json` | Bundled with Node; flat, hoisted `node_modules` |
| pnpm | `pnpm-lock.yaml` | Global content-addressable store, linked into a strict `node_modules` |
| Yarn (v2+, "Berry") | `yarn.lock` | Plug'n'Play by default (no `node_modules`), or a `node_modules` linker |
| Bun | `bun.lock` | A package manager built into the Bun runtime; very fast |

**pnpm** stores each package version once on disk and hard-links it into projects, which saves space and time. More importantly, its `node_modules` is strict: your code can import only the packages you declared. npm's flat layout hoists transitive dependencies to the top level, so you can accidentally import a package you never listed (a "phantom dependency") and break when that transitive dependency disappears. pnpm also takes the most cautious security defaults: dependency install scripts do not run unless you approve the package, and recent versions wait a day before installing a newly published version, which blunts fast-moving supply-chain attacks. Its workspace support is excellent, which is why it is popular for monorepos.

**Yarn** today means Yarn 2 and later, which is very different from the Yarn 1 "Classic" you may see in old tutorials (now frozen). Its Plug'n'Play mode replaces `node_modules` with a lookup file, which is fast and strict but needs tool and editor support; `nodeLinker: node-modules` in `.yarnrc.yml` restores the conventional layout.

**Bun** is an all-in-one runtime, bundler, test runner, and package manager. `bun install` is dramatically fast and works in ordinary Node projects. Dependency lifecycle scripts run only for packages you list as trusted.

Everyday command equivalents:

| Task | npm | pnpm | Yarn | Bun |
| --- | --- | --- | --- | --- |
| Install all | `npm install` | `pnpm install` | `yarn` | `bun install` |
| Add a package | `npm install x` | `pnpm add x` | `yarn add x` | `bun add x` |
| Run a script | `npm run dev` | `pnpm dev` | `yarn dev` | `bun run dev` |
| Run a binary | `npx x` | `pnpm dlx x` | `yarn dlx x` | `bunx x` |
| Exact CI install | `npm ci` | `pnpm install --frozen-lockfile` | `yarn install --immutable` | `bun install --frozen-lockfile` |

Rules that hold for all of them: use one manager per repository; commit only its lockfile; and record the choice in the `packageManager` field of `package.json` (for example `"pnpm@10.18.0"`). Corepack is the tool that reads that field and provides the right pnpm or Yarn version; note that it is no longer bundled with Node from version 25 onwards, so install it with `npm install -g corepack` or install the manager directly. Mixing managers produces competing lockfiles and trees that do not match.

**Try it:** Take a small npm project and install it with pnpm in a copy of the folder (`pnpm import` converts the lockfile). Compare the top level of `node_modules` in each, then try to import a transitive dependency you did not declare in both.

**Resources**
- [pnpm: Motivation](https://pnpm.io/motivation)
- [Yarn: Getting started](https://yarnpkg.com/getting-started)
- [Bun: bun install](https://bun.com/docs/pm/cli/install)

### Evaluating dependencies

Every dependency is code you did not write that runs with your application's privileges, ships to your users, and has to be kept up to date for the life of the project. Installing one takes five seconds; removing one after it is used in forty files does not. Spend ten minutes evaluating before you add it.

First ask whether you need it at all. The platform now covers much of what libraries used to: `fetch`, `Intl` for formatting, `structuredClone`, array and object methods, `<dialog>`, CSS for most layout and animation. A twenty-line function you own is often better than a dependency.

Then check four things.

**Maintenance.** On the repository: when was the last commit and last release? Are issues and PRs answered? Is there more than one maintainer? Is there a changelog and a migration guide for majors? On npm: weekly downloads and the number of dependents indicate how widely it is relied on. A stable, finished small library with few recent commits can be fine; an abandoned one with open security issues is not.

**Size.** Check what it costs your users. Bundlephobia reports the minified and gzipped size and whether the package is tree-shakeable; `npm view <pkg> dist.unpackedSize dependencies` shows install size and direct dependencies. Look at the transitive count too, since each one is a further maintenance and security exposure. Prefer packages that ship ES modules, declare `sideEffects: false`, and include TypeScript types.

**Licence.** Check the `license` field and the LICENSE file. MIT, ISC, BSD, and Apache-2.0 are permissive and broadly safe for commercial use. GPL and AGPL carry copyleft obligations that many companies prohibit in shipped products. No licence means you have no right to use it. If your employer has a policy, follow it.

**Security.** Run `npm audit` and read the advisories rather than counting them, since many concern dev-only tools or code paths you never reach. Check for a history of handled vulnerabilities and a security policy. Supply-chain attacks, in which a legitimate package is compromised or a lookalike name is published, are the modern risk: verify the exact package name, be wary of very new packages and brand-new versions, check whether the package has install scripts, and prefer packages published with provenance (`npm audit signatures` verifies registry signatures and attestations). A cool-down before adopting fresh releases, which pnpm now applies by default and npm supports through its `min-release-age` setting, avoids most compromised versions, because they are usually caught within hours.

Finally, check quality directly: read the README and a few source files, and try it in a scratch project.

**Try it:** Choose a need, such as date formatting or debouncing, and compare two candidate packages and a no-dependency approach across maintenance, size, licence, and security. Write three sentences justifying your choice as you would in a PR description.

**Resources**
- [npm Docs: npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit)
- [Bundlephobia: find the cost of adding an npm package](https://bundlephobia.com/)
- [Choose a License: Licenses](https://choosealicense.com/licenses/)

### Editor fluency

Your editor is where you spend the day, and a small set of features accounts for most of the speed difference between engineers. The shortcuts below are VS Code's on Windows and Linux; substitute `Cmd` for `Ctrl` and `Option` for `Alt` on macOS. Other editors have equivalents.

**Finding things**

- `Ctrl+P` opens a file by fuzzy name. Type `:42` to jump to a line, `@` for a symbol in the file.
- `Ctrl+Shift+P` is the Command Palette, which runs any command by name. If you learn one shortcut, learn this one.
- `Ctrl+Shift+F` searches across files, with regular expressions, case and whole-word toggles, and include or exclude globs such as `src/**/*.ts`.
- `Ctrl+T` jumps to any symbol in the workspace.

**Understanding code.** These use the language server, which understands the code's structure rather than matching text:

- `F12` goes to a definition; `Alt+F12` peeks at it inline.
- `Shift+F12` finds all references.
- `Alt+Left` navigates back to where you were.
- Hovering shows types and documentation.

**Changing code**

- `F2` renames a symbol everywhere it is used, across files, and updates imports. Unlike find and replace, it does not touch an unrelated variable with the same name or text in strings.
- `Ctrl+D` selects the next occurrence of the current selection, adding a cursor each time. `Ctrl+Shift+L` selects all occurrences.
- `Alt+Click` adds a cursor anywhere; `Ctrl+Alt+Down` adds one on the line below.
- `Alt+Up`/`Alt+Down` moves a line, `Shift+Alt+Down` duplicates it, `Ctrl+/` toggles a comment.
- `Ctrl+.` opens quick fixes and refactorings: add a missing import, extract a function or variable, convert to an arrow function.

Multi-cursor editing turns many repetitive edits into one. Converting a list of words into an array of strings, for example, means selecting the lines, placing a cursor on each (`Shift+Alt+I`), and typing the quotes and commas once.

Other features that pay off: the integrated terminal (`` Ctrl+` ``), split editors, the Source Control view for staging individual lines and reading diffs, and the built-in JavaScript debugger. Emmet expands abbreviations such as `ul>li*3>a` into HTML.

The way to learn is deliberate practice. When you notice yourself doing something slowly with the mouse, look up the command in the palette, which shows its shortcut, and force yourself to use it for a week. Print the official keyboard reference sheet. Customise sparingly; defaults keep you productive on any machine.

**Try it:** In a real project, with no mouse: open a file by name, jump to a function's definition, find its references, rename it with `F2`, and check the result in the Source Control diff. Then turn ten plain lines of text into a JavaScript array of strings using multi-cursor.

**Resources**
- [VS Code Docs: Basic editing](https://code.visualstudio.com/docs/editing/codebasics)
- [VS Code Docs: Code navigation](https://code.visualstudio.com/docs/editing/editingevolved)
- [VS Code Docs: Refactoring](https://code.visualstudio.com/docs/editing/refactoring)

### Formatter

A formatter rewrites your code's layout: indentation, line breaks, quotes, semicolons, spacing. It parses the code and prints it again from scratch according to its rules, so the output is the same no matter how the input was written. The value is not that the style is the best one; it is that there is exactly one, applied automatically, so nobody spends review time on formatting and diffs contain only meaningful changes.

**Prettier** is the long-standing standard and supports JavaScript, TypeScript, CSS, HTML, JSON, Markdown, and more.

```bash
npm install --save-dev --save-exact prettier
```

Create a `.prettierrc` file; an empty object accepts the defaults, and you add only the options you really want to change:

```json
{ "singleQuote": true }
```

Add a `.prettierignore` for generated files (Prettier also respects `.gitignore`), and two scripts: `"format": "prettier . --write"` and `"format:check": "prettier . --check"`. The exact version pin matters because output can change between releases.

**Biome** is a single fast tool, written in Rust, that formats and lints. Its formatter is deliberately very close to Prettier's output for the languages it supports.

```bash
npm install --save-dev --save-exact @biomejs/biome
npx @biomejs/biome init          # creates biome.json
npx @biomejs/biome format --write .
```

Note that Biome defaults to tabs for indentation where Prettier defaults to two spaces; set `formatter.indentStyle` in `biome.json` if you want spaces. Choose Prettier for the broadest language and plugin support, or Biome for speed and one tool instead of two.

**Format on save.** Install the editor extension and commit the setting in `.vscode/settings.json` so the whole team gets it:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

For Biome the formatter id is `biomejs.biome`. The extension uses the version installed in the project, so the editor and the CLI agree.

To make it stick:

- **Enforce it in CI** with the check command. Format on save is a convenience; CI is the guarantee.
- **Keep configuration minimal.** Every option is a debate. Accepting the defaults is the point.
- **Do not let the linter fight the formatter.** If you use ESLint with Prettier, add `eslint-config-prettier` to switch off ESLint's stylistic rules.
- **Introduce it in one commit.** Formatting an existing codebase touches every file. Do it as a single commit containing nothing else, and list that commit's hash in a `.git-blame-ignore-revs` file so `git blame` skips it.
- Optionally run it on staged files in a pre-commit hook; see the Git hooks entry.

**Try it:** Add Prettier or Biome to a project, enable format on save, and deliberately mangle a file's indentation and quotes before saving. Then mis-format a file from outside the editor and confirm the check command exits non-zero.

**Resources**
- [Prettier Docs: Install](https://prettier.io/docs/install)
- [Prettier Docs: Options](https://prettier.io/docs/options)
- [Biome Docs: Formatter](https://biomejs.dev/formatter/)

### Linter

A linter analyses code without running it and reports patterns that are likely bugs or that violate agreed conventions. A formatter decides how code looks; a linter judges what it does: an unused variable, a missing `await`, a `==` where `===` was meant, a conditional React hook, an `<img>` without `alt`.

**ESLint** is the standard, with by far the largest plugin ecosystem. `npm init @eslint/config@latest` sets it up interactively. Configuration lives in `eslint.config.js`, the "flat config" format, which is the only format current versions support. Older tutorials showing `.eslintrc` are out of date.

```js
// eslint.config.js
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['dist/']),
  {
    files: ['**/*.js'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser },
    rules: {
      eqeqeq: 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]);
```

The config is an array of objects. Each applies to the files matching its `files` globs, and later objects override earlier ones. A rule is set to `'off'`, `'warn'`, or `'error'`, optionally with options. `languageOptions.globals` tells ESLint which global variables exist, so `document` is known in browser code and flagged in Node scripts. For TypeScript, add `typescript-eslint`, whose type-aware rules catch things like unhandled promises. Frameworks supply their own plugins.

Run `npx eslint .` to check and `npx eslint . --fix` to apply automatic fixes. With the ESLint editor extension, problems appear as you type, and `"editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }` fixes what it can on save.

**Biome** includes a linter with a few hundred rules, many ported from ESLint and its popular plugins. It is much faster and needs almost no configuration (`npx @biomejs/biome lint .`, or `check` for formatting and linting together). Its limit is ecosystem: if you depend on a specific ESLint plugin, check that Biome has an equivalent.

Using a linter well is mostly about understanding it:

- Start from the recommended set and add rules for a reason. A wall of stylistic rules creates noise that people learn to ignore.
- When a rule fires, read its documentation page. Each explains the bug it prevents with examples, which is a cheap way to learn the language's sharp edges.
- Prefer `error` to `warn`. Warnings accumulate and get ignored. If it is not worth failing CI over, turn it off.
- Disable narrowly and explain why: `// eslint-disable-next-line no-console -- CLI output`. A blanket `/* eslint-disable */` at the top of a file hides real problems.
- Run it in CI with `--max-warnings 0`.
- Leave formatting to the formatter.

**Try it:** Set up ESLint in a project and write code that triggers five different recommended rules (an unused variable, an unreachable statement, a duplicate object key, and so on). Read the documentation page for each rule, then fix them all, using `--fix` where it applies.

**Resources**
- [ESLint Docs: Getting started](https://eslint.org/docs/latest/use/getting-started)
- [ESLint Docs: Configuration files](https://eslint.org/docs/latest/use/configure/configuration-files)
- [Biome Docs: Linter](https://biomejs.dev/linter/)

### EditorConfig and settings

A team's code stays consistent only if everyone's tools agree, whatever editor each person prefers. That agreement lives in configuration files committed to the repository, layered from most to least universal.

**EditorConfig** covers the basics that every editor understands: indentation, line endings, character set, and trailing whitespace. A `.editorconfig` file at the repository root is read by most editors natively or through a plugin (VS Code needs the EditorConfig extension).

```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

`root = true` stops the search for further files in parent directories. Sections are glob patterns, and later sections override earlier ones. EditorConfig controls how the editor behaves while you type; it does not reformat existing code. Prettier reads `.editorconfig` automatically for the options they share, and Biome does when `formatter.useEditorconfig` is enabled, so it can be the single source for indentation.

**Line endings** are the other half of this. `end_of_line = lf` controls what your editor writes, but the reliable fix for mixed CRLF and LF on a team with Windows users is at the Git level, with `* text=auto eol=lf` in `.gitattributes`. See the Ignoring and attributes entry.

**Workspace settings** handle editor-specific behaviour. In VS Code, settings resolve in layers: defaults, then your user settings, then the workspace's `.vscode/settings.json`, which wins. Commit the workspace file for settings the project depends on: format on save, the default formatter, the workspace TypeScript version. Add `.vscode/extensions.json` with a `recommendations` array, and teammates are prompted to install the extensions the project expects. Keep personal preferences, such as theme, font, and key bindings, in user settings.

The remaining shared files are ones you have already met: the formatter and linter configs, `.nvmrc`, `.gitignore`, and `package.json` scripts and `engines`.

The principle behind all of this: anything a new teammate would otherwise have to be told should be a committed file, and anything that matters should also be checked by CI, because editor settings are a convenience and can be bypassed. The test is whether a fresh clone, opened in an editor with the recommended extensions, produces correctly formatted, lint-clean code without any instructions.

**Try it:** Add `.editorconfig`, `.gitattributes`, `.vscode/settings.json`, and `.vscode/extensions.json` to a project. Open a file, insert a tab-indented line with trailing spaces, and save. Check the result with `git diff`, then confirm line endings with `git ls-files --eol`.

**Resources**
- [EditorConfig](https://editorconfig.org/)
- [VS Code Docs: User and workspace settings](https://code.visualstudio.com/docs/configure/settings)
- [Git reference: gitattributes](https://git-scm.com/docs/gitattributes)

### Elements panel

The Elements panel shows the live DOM, which is the result of parsing plus everything JavaScript has done since, alongside the CSS that applies to the selected node. Open it on a specific element by right-clicking the page and choosing Inspect, or with `Ctrl+Shift+C` (`Cmd+Shift+C`) to pick one by pointing.

**In the DOM tree** you can double-click to edit text, attributes, or tag names; press `F2` to edit a node as HTML; drag nodes to reorder; press `H` to hide and `Delete` to remove. Right-click a node for **Force state** (`:hover`, `:focus`, `:active`, `:focus-visible`), which lets you style states that vanish when you move the mouse, and for **Break on** subtree, attribute, or removal changes, which pauses the script responsible for a mutation. All edits are temporary and disappear on reload.

**In the Styles pane** you see every rule that matches, ordered from winning to losing, with overridden declarations struck through and invalid ones flagged with a warning icon. Click a value to edit it, use the arrow keys to nudge numbers (with `Shift` for steps of 10), tick checkboxes to disable declarations, and add new ones to `element.style` or a new rule with the `+` button. The `:hov` button forces states and `.cls` toggles classes. Colour swatches open a picker with contrast information, and easing and shadow values have visual editors.

**The Computed pane** answers "what is the final value, and where did it come from?". Expand a property to see the winning rule and those it beat, and inspect the box model diagram to read exact content, padding, border, and margin sizes. Use this when the Styles pane is too long to reason about.

**Layout debugging.** Elements with `display: grid` or `display: flex` have a badge in the DOM tree. Clicking it toggles an overlay on the page: for grid, the lines, line numbers, track sizes, and named areas; for flex, the item boundaries, gaps, and free space. The **Layout** pane lists every grid and flex container on the page with overlay options. In the Styles pane, the icon next to `display: flex` or `grid` opens an editor for alignment properties, so you can click through `justify-content` and `align-items` values and watch the result. Similar badges exist for scroll containers, container queries, and subgrid.

Other things to know: the **Event Listeners** pane lists handlers, the **Accessibility** pane shows the computed role and name, and the selected node is available as `$0` in the Console. The most common question, "why is my style not applying?", is answered by finding the declaration in Styles: either it is struck through (something else won), flagged invalid, greyed out as inactive with an explanatory tooltip (such as `align-items` on a non-flex element), or absent, meaning the selector does not match.

**Try it:** On any site with a grid layout, turn on the grid overlay with line numbers and work out which lines an item spans. Then find a flex container and change its alignment using the flexbox editor. Force `:hover` on a button and edit its hover styles.

**Resources**
- [Chrome DevTools: View and change CSS](https://developer.chrome.com/docs/devtools/css)
- [Chrome DevTools: Inspect CSS grid layouts](https://developer.chrome.com/docs/devtools/css/grid)
- [Chrome DevTools: Inspect and debug CSS flexbox layouts](https://developer.chrome.com/docs/devtools/css/flexbox)

### Console

The Console is a JavaScript REPL attached to the page and a log viewer. Using it well means knowing both the logging API your code calls and the utilities available only when typing in the Console itself.

**The `console` API**

```js
console.table(users, ['name', 'role']);     // array of objects as a sortable table
console.group('Checkout');                  // indent related logs; groupCollapsed starts closed
console.log('items', items);
console.groupEnd();
console.assert(total >= 0, 'Negative total', total);   // logs only when the condition is false
console.count('render');                    // render: 1, render: 2, ...
console.time('filter'); filter(); console.timeEnd('filter');   // filter: 3.2 ms
console.trace('who called this?');          // logs with a stack trace
console.dir(element);                       // the object's properties, not the DOM view
console.log({ user, cart });                // shorthand object: labels values for free
```

Use `console.warn` and `console.error` for severity; they are styled, filterable, and include a stack trace. `console.log('%cImportant', 'color: red; font-weight: bold')` styles output.

**Console utilities.** These exist only in the Console, not in your scripts:

- `$0` to `$4`: the most recently selected elements in the Elements panel.
- `$_`: the value of the last evaluated expression.
- `$('sel')` and `$$('sel')`: `querySelector`, and `querySelectorAll` returned as an array.
- `copy(value)`: copies a value, as JSON for objects, to the clipboard.
- `getEventListeners(node)`, `monitorEvents(node, 'key')`, `unmonitorEvents(node)`.
- `monitor(fn)` logs each call to a function with its arguments, and `debug(fn)` pauses when it is called.
- `queryObjects(Constructor)` lists all live instances of a class.

**Live expressions.** The eye icon pins an expression above the Console and re-evaluates it continuously. Pin `document.activeElement` to watch focus move as you tab, or a piece of state while you interact.

**Working with the output.** Filter by text, regular expression, or a negative term such as `-extension`. The level menu shows or hides errors, warnings, info, and verbose messages. The settings gear offers **Preserve log**, to keep messages across navigations, and timestamps. The context selector, which says `top` by default, chooses which frame or worker your input runs in, which explains why a variable in an iframe appears to be undefined. Top-level `await` works in the Console.

One trap catches everyone: the Console logs a live reference to an object, not a snapshot. If you log an object and then mutate it, expanding the entry later shows its current state, not its state at the time of the log. Log a copy (`structuredClone(obj)` or `JSON.stringify(obj)`) or use a breakpoint when timing matters.

Logging should also be cleaned up. Remove debugging logs before committing, and consider the `no-console` lint rule to catch strays.

**Try it:** On any page, run `console.table($$('img').map(({ src, alt, width }) => ({ src, alt, width })))` to audit images. Then add a live expression for `document.activeElement` and tab through the page.

**Resources**
- [Chrome DevTools: Console utilities API reference](https://developer.chrome.com/docs/devtools/console/utilities)
- [Chrome DevTools: Console API reference](https://developer.chrome.com/docs/devtools/console/api)
- [Chrome DevTools: Watch JavaScript values in real time with live expressions](https://developer.chrome.com/docs/devtools/console/live-expressions)

### Sources and debugging

A debugger stops your program at a chosen line and lets you examine everything: every variable in scope, the chain of calls that led there, and what happens as each next line runs. Compared with adding `console.log` and reloading, you see state you did not think to log, and you can keep asking questions without rerunning.

**Setting breakpoints.** In the Sources panel, open a file with `Ctrl+P` (`Cmd+P`) and click a line number. Right-click the line number for more kinds:

- A **conditional breakpoint** pauses only when an expression is true, such as `item.id === 42` or `i > 990`. Essential inside loops and frequently called handlers.
- A **logpoint** prints an expression to the Console without pausing and without changing your code.
- **Never pause here** silences a specific line.

You can also pause without choosing a line. The `debugger;` statement in code pauses when DevTools is open. In the right-hand sidebar, **Event Listener Breakpoints** pause on a category of event (for instance Mouse > click), **XHR/fetch Breakpoints** pause when a request URL contains some text, and the pause-on-exceptions option stops where an error is thrown, including caught ones if you tick that box. DOM breakpoints are set from the Elements panel.

**While paused**

- **Scope** shows local, closure, and global variables with current values; double-click to change one. Hovering a variable in the source also shows its value.
- **Call Stack** shows how execution reached this point. Click any frame to view that function's code and variables at the moment of the call. Async frames are included, so you can trace back through `await` and promise callbacks.
- **Watch** holds expressions that are re-evaluated at each pause.
- The Console evaluates in the paused scope, so you can call functions and test fixes.

**Stepping**

| Action | Shortcut | Does |
| --- | --- | --- |
| Resume | `F8` | Runs to the next breakpoint |
| Step over | `F10` | Runs the current line, including any calls in it |
| Step into | `F11` | Enters the function called on this line |
| Step out | `Shift+F11` | Finishes the current function and pauses in its caller |

"Continue to here" in a line's context menu runs to that line. "Restart frame" in the Call Stack re-runs the current function from its start.

Techniques that matter in practice. Debug your source, not the bundle: source maps let you set breakpoints in the original files, so make sure your dev build produces them. Add library and framework code to the **ignore list** (right-click a file or stack frame) so that stepping stays in your own code. Use a conditional breakpoint to reach the 500th iteration instead of pressing Resume 499 times. And for a bug you cannot locate, bisect in space: break at a point where state is still correct and a point where it is wrong, then narrow the gap.

The same debugger is available in VS Code through its JavaScript debugger, and for Node scripts with `node --inspect-brk file.js`.

**Try it:** Take a function with a loop that produces a wrong total. Without adding logs, set a conditional breakpoint for the iteration where the value first goes wrong, inspect Scope, add a Watch expression, step into the helper it calls, and change a variable while paused to test your theory.

**Resources**
- [Chrome DevTools: Debug JavaScript](https://developer.chrome.com/docs/devtools/javascript)
- [Chrome DevTools: Pause your code with breakpoints](https://developer.chrome.com/docs/devtools/javascript/breakpoints)
- [Chrome DevTools: JavaScript debugging reference](https://developer.chrome.com/docs/devtools/javascript/reference)

### Network panel

The Network panel records every request the page makes while DevTools is open. It is the source of truth for questions such as "was the request sent?", "what exactly did the server return?", and "why is this slow?". Open it before you reload, since requests made earlier are not captured.

**Reading the table.** Each row shows name, status, type, initiator, size, and time. The Size column says `(memory cache)`, `(disk cache)`, or `(ServiceWorker)` when no network transfer happened. The Initiator column tells you what caused the request; hover it for the call stack, and click through to the line of code. Failed requests are shown in red, and `(canceled)` or `(blocked:...)` statuses explain themselves. Right-click the header row to add columns such as Protocol, Priority, or a specific response header.

**Filtering.** The type buttons (Fetch/XHR, JS, CSS, Img, and so on) narrow the list; `Ctrl`/`Cmd`-click selects several. The filter box takes text, a regular expression, or property filters such as `status-code:404`, `method:POST`, `domain:*.example.com`, `larger-than:100k`, and `-domain:cdn.example.com` to exclude. `Ctrl+F` (`Cmd+F`) searches across headers and response bodies.

**Inspecting a request.** Click a row for its tabs:

- **Headers**: the URL, method, status, and the request and response headers. This is where you check `Content-Type`, `Cache-Control`, `Authorization`, cookies, and CORS headers.
- **Payload**: the query string and request body as sent.
- **Preview** and **Response**: the body, formatted and raw.
- **Initiator**: the chain of requests and code that led to this one.
- **Timing**: a breakdown into queueing, stalled, DNS lookup, connection and TLS, request sent, waiting for server response, and content download.

Timing tells you where to look. A long "Waiting for server response" means a slow backend. A long "Content download" means a large response or a slow connection. Long "Queueing" or "Stalled" means the browser was waiting for a connection or deprioritised the request.

**Controls**

- **Disable cache** (while DevTools is open) so you are testing a first visit.
- **Preserve log** to keep entries across page navigations and redirects, which is essential for debugging login flows.
- **Throttling** to emulate Slow 4G, 3G, or offline. Loading states and race conditions that are invisible on a fast connection become obvious.
- **Blocking and per-request throttling.** Right-click a request and choose Block request (for that URL or its whole domain) to see how the page copes without it, such as a third-party script or a failed API. Current Chrome manages these rules in the **Request conditions** drawer (formerly "Network request blocking"), which can also throttle individual requests by URL pattern.
- **Local overrides.** Right-click a request and choose Override content or Override headers to serve your own edited response, which lets you test against an API change that has not shipped.
- **Copy as fetch or cURL** to replay a request, and **Save all as HAR** to share a recording. A HAR file contains cookies and tokens, so sanitise it before sending it to anyone.

**Try it:** Load a page with cache disabled and Slow 4G throttling. Find the largest request and the slowest request and explain each from the Timing tab. Then block the page's main stylesheet or an API request, reload, and observe how the page handles the failure.

**Resources**
- [Chrome DevTools: Inspect network activity](https://developer.chrome.com/docs/devtools/network)
- [Chrome DevTools: Network features reference](https://developer.chrome.com/docs/devtools/network/reference)
- [Chrome DevTools: Request conditions](https://developer.chrome.com/docs/devtools/request-conditions)

### Application panel

The Application panel shows everything a site has stored in the browser and the background machinery attached to it. Much of what looks like a mysterious bug, such as "it only happens for me" or "it still shows the old version", is stale state, and this panel is where you see it and clear it.

**Storage.** The sidebar lists each mechanism for the current origin:

- **Local storage** and **Session storage** show keys and values in an editable table. Double-click to change a value, select and delete an entry, or clear all. This is how you test your code against missing, old-format, or corrupted data.
- **IndexedDB** lists databases, object stores, and indexes, with records you can browse and delete. Use the refresh button, since the view does not always update live.
- **Cookies** shows every cookie with its attributes: Domain, Path, Expires/Max-Age, Size, HttpOnly, Secure, SameSite, and Partitioned. You can edit and delete them, and filter by name. To learn why a cookie was not stored or not sent, look at the Cookies tab of the individual request in the Network panel, which shows blocked cookies and the reason.
- **Cache storage** lists the caches created through the Cache API, typically by a service worker, with each cached response.

**The Storage overview** at the top of that section shows how much quota the origin is using, broken down by type, and provides **Clear site data**, with checkboxes for what to include. That one button resets an origin to a first-visit state: storage, caches, and service worker registrations. It is the correct way to test "new user" behaviour, and much more precise than clearing the whole browser's data.

**Service workers.** This pane shows the registered worker, its status, and its lifecycle: a new version installs and then **waits** until all tabs using the old one have closed. That waiting state is the usual cause of "my changes are not showing up". The controls help during development: **Update on reload** installs and activates the newest worker on every reload, **Bypass for network** makes requests skip the worker entirely, **Unregister** removes it, and you can simulate offline and send test push and sync events.

**Manifest** shows the parsed web app manifest, its icons, and installability warnings.

**Background services.** The **Back/forward cache** pane tests whether the page is eligible for instant back and forward navigation and lists the reasons if it is not. Other entries record background fetch, sync, and notification events.

Habits that follow: when behaviour differs between you and a colleague, compare storage and cookies first. When a deployed fix does not appear, check for a service worker and the HTTP cache. Use an Incognito window for a clean profile without extensions. Remember that storage belongs to an origin, so `localhost:3000` and `localhost:5173` do not share anything, and neither do `http` and `https` versions of a site.

**Try it:** On a site you are logged in to, find the session cookie and read its HttpOnly, Secure, and SameSite attributes. On a project of yours that uses `localStorage`, corrupt a value by hand and reload. Then use Clear site data and confirm the app starts cleanly.

**Resources**
- [Chrome DevTools: Application panel overview](https://developer.chrome.com/docs/devtools/application)
- [Chrome DevTools: View, add, edit, and delete cookies](https://developer.chrome.com/docs/devtools/application/cookies)
- [Chrome DevTools: Debug Progressive Web Apps](https://developer.chrome.com/docs/devtools/progressive-web-apps)

### Device emulation

Device mode lets you check a page under mobile conditions without leaving your desk. Toggle it with the device toolbar button at the top left of DevTools, or `Ctrl+Shift+M` (`Cmd+Shift+M`).

What the toolbar gives you:

- **Viewport.** Choose "Responsive" and drag the handles, or type exact dimensions, to find where a layout breaks. Named device presets set the viewport size, device pixel ratio, and user agent together. The bar above the viewport marks common widths, and the three-dot menu can show your CSS media query breakpoints as clickable bars.
- **Device pixel ratio.** Controls which `srcset` candidate and resolution media queries apply. Check that the right image is requested in the Network panel.
- **Touch.** Mobile presets send touch events instead of mouse events and show a circular cursor. Hover states stop applying, as on a real touchscreen. Hold `Shift` and drag to simulate a pinch.
- **Throttling.** The toolbar's throttle menu applies combined presets such as "Mid-tier mobile" and "Low-end mobile", which slow both network and CPU. Finer control is in the Network panel (network) and the Performance panel's capture settings (CPU, including 4x, 6x, and 20x slowdowns).
- **Orientation** and, on supported presets, device posture for foldables.
- **Capture screenshot** and **Capture full size screenshot** in the three-dot menu.

Related emulation lives in two drawers, opened from the Command Menu. **Sensors** overrides geolocation, device orientation, and idle state. **Rendering** emulates `prefers-color-scheme`, `prefers-reduced-motion`, `prefers-contrast`, forced colours, print media, and vision deficiencies.

CPU throttling is the setting people most often skip. Your development machine is several times faster than a typical phone, so an interaction that feels instant for you can take a second on a mid-range Android device. Test interactions with at least 4x slowdown; lag and long tasks become obvious.

You must also understand what device mode is not. It is your desktop browser engine drawing in a smaller box. Chrome's documentation calls it a first-order approximation: you are not running your code on a mobile device. So it does **not** reproduce:

- Safari on iOS. Every browser on an iPhone uses WebKit, with its own bugs and feature gaps. No Chrome emulation shows you those.
- The real behaviour of the on-screen keyboard, the collapsing browser toolbar and dynamic viewport units, safe-area insets, or momentum scrolling.
- True device performance, memory limits, or thermal throttling.
- How large touch targets feel under a thumb.

Use device mode for quick iteration on layout, then verify on real hardware. Android devices can be debugged over USB from `chrome://inspect` (remote debugging), and iOS devices from Safari's Web Inspector on a Mac. Cloud device services fill the gap if you lack hardware.

**Try it:** In responsive mode, drag a page from 320px to 1440px wide and note each width at which the layout changes or breaks. Then choose a mid-range phone preset with "Low-end mobile" throttling, reload, and use the page for a minute. Finally, emulate `prefers-reduced-motion` and dark mode from the Rendering drawer.

**Resources**
- [Chrome DevTools: Simulate mobile devices with device mode](https://developer.chrome.com/docs/devtools/device-mode)
- [Chrome DevTools: Remote debug Android devices](https://developer.chrome.com/docs/devtools/remote-debugging)
- [Chrome DevTools: Sensors - emulate device sensors](https://developer.chrome.com/docs/devtools/sensors)

### Performance and Lighthouse

These are two different tools for two different jobs. **Lighthouse** runs an automated audit and gives you scores and a list of findings; it is a checklist. The **Performance panel** records exactly what the browser did over a period of time; it is a microscope. This entry gets you to the point of running both and reading the output. A later module covers performance in depth.

**The Performance panel.** When you open it, before recording anything, it shows live Core Web Vitals for the current page: Largest Contentful Paint (LCP, loading), Cumulative Layout Shift (CLS, visual stability), and Interaction to Next Paint (INP, responsiveness), updating as you interact. It can also show field data from real Chrome users for comparison, if you enable it.

To record a trace:

1. Use an Incognito window, so extensions do not pollute the result.
2. Set CPU throttling (4x slowdown is a reasonable start) and network throttling in the panel's settings.
3. For page load, click **Record and reload**. For an interaction, click **Record**, perform the interaction, and stop.

Reading the result, from top to bottom: the overview strip shows CPU activity and screenshots over time; drag across it to zoom into a range. The **Main** track is a flame chart of main-thread work, in which width is time and depth is call stack. Tasks longer than 50 ms are marked with red hatching: these long tasks are what block user input. The **Network** track shows requests, and other tracks mark layout shifts, interactions, and timings such as LCP. The **Insights** sidebar summarises specific problems, such as render-blocking requests, the breakdown of LCP, layout shift culprits, and forced reflows, and clicking an insight highlights the relevant part of the trace. Select any block in the flame chart and use the **Bottom-up** tab to see which functions cost the most in total, with links to the source line.

Start with the insights and the red markers, not by reading the whole flame chart.

**Lighthouse.** Open the Lighthouse panel, choose a mode (Navigation, for a page load, is the default), a device (Mobile or Desktop), and categories: Performance, Accessibility, Best Practices, and SEO are the long-standing ones, and the list changes over time. Click **Analyze page load**. The report gives a score from 0 to 100 for each category, the measured metrics, and a prioritised list of findings, each linking to documentation. It is also available as a CLI (`npx lighthouse https://example.com --view`), which is how you run it in CI.

Reading Lighthouse results sensibly:

- It is **lab data**: a single simulated load on your machine under emulated throttling. Scores vary from run to run, so run it several times and compare medians. It is not what your users experience; that is field data, from the Chrome UX Report or your own monitoring.
- Audit the production build. A dev server with unminified code and no compression gives meaningless numbers.
- The score is a summary. The value is in the individual findings.
- A 100 in Accessibility means the automated checks passed, which cover a minority of accessibility issues. Manual keyboard and screen reader testing is still required.
- A navigation audit cannot measure INP, because it involves no interaction. Use Timespan mode or the Performance panel for that.

**Try it:** Run Lighthouse in mobile mode on a production site three times and note how much the performance score varies. Then record a page load in the Performance panel with 4x CPU throttling, identify the LCP element from the insights, and find the longest task in the Main track and the function responsible.

**Resources**
- [Chrome DevTools: Performance panel - analyze your website's performance](https://developer.chrome.com/docs/devtools/performance/overview)
- [Chrome for Developers: Introduction to Lighthouse](https://developer.chrome.com/docs/lighthouse/overview)
- [web.dev: Web Vitals](https://web.dev/articles/vitals)

### Contribute via pull request

Contributing to a repository you do not have write access to uses the fork workflow. A fork is your own copy of the repository on GitHub. You push branches to your fork and open a pull request from there to the original, which is conventionally called `upstream`.

```bash
gh repo fork owner/project --clone     # fork, clone, and add the upstream remote
cd project
git switch -c docs/fix-install-typo    # never work on main
# ...make the change, run the project's checks...
git add -p
git commit -m "Fix typo in install instructions"
git push -u origin docs/fix-install-typo
gh pr create                           # opens a PR against upstream
```

Without the GitHub CLI: click Fork on GitHub, `git clone` your fork, and run `git remote add upstream <original-url>`.

Before you write anything:

1. **Read `CONTRIBUTING.md`**, the README, and the code of conduct. They state how to set up the project, which branch to target, the commit message convention, and whether you need to sign a contributor agreement.
2. **Find or open an issue.** Labels such as "good first issue" and "help wanted" mark suitable starting points. For anything beyond a trivial fix, comment on the issue and confirm the maintainers want the change before investing time. Unrequested large PRs are frequently declined.
3. **Get the project running** and its tests passing locally before changing anything, so you know that later failures are yours.

Making the change: keep it small and limited to one concern. Follow the existing code style, even where you disagree with it, and do not reformat files you did not need to touch. Add or update tests and documentation. Run the linter and test suite the project uses.

In the PR itself: fill in the template, explain what and why, link the issue (`Fixes #123` closes it automatically on merge), and include before and after screenshots for visual changes. Leave "Allow edits from maintainers" ticked.

Afterwards: CI will run, possibly only once a maintainer approves it for a first-time contributor. Maintainers are often volunteers; expect to wait days, and respond politely and promptly when they review. Push fixes as new commits on the same branch and the PR updates itself. If `upstream` moves ahead and you are asked to update, run `git fetch upstream` and `git rebase upstream/main`, then `git push --force-with-lease`.

Keep your fork current between contributions with `gh repo sync` or by fetching `upstream` and fast-forwarding your `main`. Start each new contribution on a fresh branch from the updated `main`.

Documentation fixes are real contributions and the best first ones: the stakes are low, and you exercise the entire workflow.

**Try it:** Find a project you use with a documentation error, an unclear instruction, or a "good first issue". Follow the workflow above to open a real pull request, and see it through review.

**Resources**
- [GitHub Docs: Contributing to a project](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project)
- [GitHub Docs: Syncing a fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork)
- [Open Source Guides: How to contribute to open source](https://opensource.guide/how-to-contribute/)

### Recover from a Git mess

The purpose of this exercise is to remove your fear of Git. Once you have destroyed and recovered a branch on purpose, a real accident is an inconvenience. The principle to internalise is that **commits are almost never deleted**. Commands like `reset` and `rebase` move branch pointers; the old commits remain in the repository, unreferenced, until garbage collection removes them weeks later. The reflog records every position `HEAD` and each branch have held, so you can always find them again.

Set up a throwaway repository with five or six commits, then work through each scenario, recovering before moving to the next.

**1. A hard reset too far.**

```bash
git reset --hard HEAD~4
git reflog                       # find the entry just before "reset: moving to HEAD~4"
git reset --hard HEAD@{1}
```

**2. A deleted, unmerged branch.** `git branch -D feature` prints the hash of the commit it pointed to. If you missed it, find the last commit on that branch in `git reflog`, then recreate the branch with `git branch feature <hash>`.

**3. A rebase gone wrong.** After a rebase where you dropped the wrong commit or resolved conflicts badly, `git reflog show feature` lists the branch's own history. Reset to the entry before the rebase began. `ORIG_HEAD` also points there immediately afterwards, so `git reset --hard ORIG_HEAD` works if you have done nothing since.

**4. Commits made on a detached `HEAD`.** Check out an old commit by hash, make two commits, then switch back to `main`. Git warns that you are leaving commits behind. Recover them with `git branch rescued <hash>` using the hash from the warning or the reflog.

**5. A bad amend.** `git commit --amend` replaces the last commit. The original is at `HEAD@{1}`.

**6. Committed to the wrong branch.** Create the right branch where you are (`git branch feature`), then move `main` back with `git reset --hard origin/main`. The commits remain on `feature`.

A safe procedure for any real incident:

1. Stop. Do not run more commands in the hope that one works.
2. Run `git status` and `git reflog` and read them.
3. Before trying a fix, mark the current state with `git branch backup-before-fix`, so that the attempt itself is reversible.
4. Inspect a candidate with `git show <hash>` or `git log <hash>` before resetting to it.

And know the limits. The reflog is local, so it cannot recover what was never on your machine. Entries for unreachable commits expire after about 30 days, and others after 90. Uncommitted changes destroyed by `git reset --hard`, `git restore`, or `git clean` were never recorded and cannot be recovered through Git, although your editor's local history may have them. If changes were staged with `git add` at some point, `git fsck --lost-found` can sometimes retrieve the content. The practical lesson is to commit early and often: anything committed can be rescued.

**Try it:** Work through all six scenarios in a scratch repository. For each one, write down the command that caused the damage, the reflog line you used to find the lost state, and the command that restored it.

**Resources**
- [Git reference: git-reflog](https://git-scm.com/docs/git-reflog)
- [Pro Git: Maintenance and data recovery](https://git-scm.com/book/en/v2/Git-Internals-Maintenance-and-Data-Recovery)
- [Oh Shit, Git!?!](https://ohshitgit.com/)

### Debug without `console.log`

Logging answers only the questions you thought to ask before running the code, and each new question costs an edit and a reload. A debugger lets you stop at the moment of interest and ask anything. This exercise forces the habit: fix a real bug using breakpoints alone, with no edits to the source until you make the fix.

Use a method rather than poking around:

1. **Reproduce it reliably.** Find the exact steps and inputs. A bug you cannot trigger on demand cannot be debugged.
2. **State expected versus actual** precisely: "the total should be 30.00 but shows 27.00 when a second coupon is applied".
3. **Form a hypothesis** about where the wrong value comes from, and pick the breakpoint that would confirm or refute it.
4. **Get paused near the problem.** If you know the function, set a line breakpoint. If you do not know where the code is, use an indirect breakpoint: an Event Listener Breakpoint on `click`, an XHR/fetch breakpoint on part of the request URL, a DOM "Break on subtree modifications" on the element that changes wrongly, or pause on exceptions if an error is thrown.
5. **Inspect.** Read the Scope pane. Hover variables. Look down the Call Stack to see who called this function and with what arguments; the bug is often a wrong argument from two frames up.
6. **Narrow down.** Step over lines while watching values in the Watch pane, and step into a function only when its result is wrong. Find the first line at which reality diverges from your expectation. That line, or the data flowing into it, is the bug.
7. **Test the fix while paused.** Change a variable in Scope, or evaluate a corrected expression in the Console, and resume to check that the outcome is now right.
8. **Then edit the code**, and reproduce the original steps to confirm.

Tools that replace specific logging habits:

| Instead of | Use |
| --- | --- |
| `console.log(x)` at a line | A logpoint, which needs no code change |
| Logging inside a loop and scanning the output | A conditional breakpoint such as `i === 41` |
| Logging "got here" | A breakpoint, plus the Call Stack to see how |
| Logging to find what changed the DOM | A DOM breakpoint |
| Logging a value repeatedly | A Watch expression or a live expression |
| Wrapping a function to log its calls | `debug(fn)` or `monitor(fn)` in the Console |

Asynchronous bugs deserve a note. The Call Stack shows async frames, so you can see what scheduled a callback. For timing problems, such as a stale response overwriting a fresh one, breakpoints can change the timing; use logpoints there, since they do not pause, alongside the Network panel's ordering.

Step into your own code, not the framework's: add third-party scripts to the ignore list so that stepping skips them.

Logging still has a place, for instance for production diagnostics or for seeing a sequence of events over time. The aim is to choose it deliberately, not to reach for it because it is the only technique you know.

**Try it:** Have a friend, or your past self, introduce a subtle bug into a small app, such as an off-by-one error in pagination or a mutated shared array. Find and fix it using only the Sources panel. Afterwards, write one sentence naming the first line at which the state was wrong.

**Resources**
- [Chrome DevTools: Debug JavaScript](https://developer.chrome.com/docs/devtools/javascript)
- [Chrome DevTools: Pause your code with breakpoints](https://developer.chrome.com/docs/devtools/javascript/breakpoints)
- [VS Code Docs: Browser debugging in VS Code](https://code.visualstudio.com/docs/nodejs/browser-debugging)
