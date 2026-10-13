# Dev Environment Manager — Product Idea

Oct 11, 2026 · @broski

## The idea, restated

A single dashboard that shows everything installed on a dev machine, where it came from, what depends on it, and lets you safely clean it up.

Today this information is scattered across `pyenv`, `nvm`, `brew`, `conda`, `rustup`, `pip`, `npm -g`, shell config files and random project folders. Nobody holds a mental map of it, so when something breaks ("why is `python` pointing to 3.9?") or the disk fills up, you dig through the terminal. This app is the map.

Scope: a desktop app with a modern, clean UI, Mac first, with Windows and Linux later.

## Core feature 1: Inventory

The "see everything" part: one place that lists what is on the machine.

- **Languages and runtimes:** Python, Node, Rust, Go, Java, Ruby, and which version manager installed each one
- **Virtual environments:** every `venv`, `.venv`, conda env and `virtualenv` on disk, with project path, Python version, size and last-used date
- **Package managers and global packages:** Homebrew formulae and casks, `pip`, `npm -g`, `cargo install`
- **Environment variables:** grouped by where they are defined (`.zshrc`, `.zprofile`, `/etc/paths`, project `.env` files)
- **`PATH`:** shown as an ordered list, with duplicates and dead entries flagged
- **Heavy folders:** `node_modules`, `__pycache__`, build caches and Docker images

## Core feature 2: Trace

The "why is this happening" part, and the feature that makes this more than a dashboard.

- **Which `python` runs?** The app shows the full resolution chain when you type `python`: `PATH` order, shims, aliases.
- **Where is `FOO_API_KEY` set?** It lists every file that sets it and which one wins.
- **Why is this package installed?** It shows the dependency tree, so you can see that X exists only because of Y.
- **Conflict detector:** flags the classic problems, such as multiple Pythons fighting, a broken Homebrew link or a stale shim.

## Core feature 3: Clean up

The "remove it" part: safe deletion with a preview and an undo.

- Show the size of everything, biggest first
- Flag stale items, such as venvs for projects untouched in 6+ months or orphaned packages
- Preview before removing: "this will delete 2.3 GB, and these 4 projects depend on it"
- Move to Trash or a quarantine folder instead of hard-deleting, so there is an undo

## AI features

AI belongs only where the answer needs reasoning across several facts; the scanner still does all listing, sizing and `PATH` parsing. The user supplies their own API key and picks a provider (OpenAI, Anthropic, Google, Groq, DeepSeek or local Ollama).

1. **Diagnose this error (build first).** Paste a traceback or ask "why does `python` show 3.9?". The agent checks which interpreter runs, the active venv, `PATH` order and where the package lives, then returns a cause and a proposed fix.
2. **Cleanup advisor.** For each stale item, a verdict of safe, probably safe or leave it, with a one-line reason based on evidence such as whether the git repo still exists, whether the folder is empty, and whether another project uses that version.
3. **Ask your machine.** Natural-language questions over the inventory, such as "what depends on Python 3.9?" or "what's my biggest dead weight?", answered from scanner results.
4. **Explain this (later).** A button on any row that explains what it is and why it is probably there, for example an odd shim, an unfamiliar global package or an obscure env var.
5. **Setup migration (later).** "Set up a new Mac like this one" produces an ordered install script from a snapshot of the current machine.

Features 1 and 3 share the same plumbing: a set of read-only scanner tools the model can call. The model never runs arbitrary commands; fixes come back as a plan you approve, and the app's own code executes them.

## Nice-to-haves for later

- Health score and a "fix this" button for common problems
- Snapshot and diff: "what changed on my machine since last week?"
- Export your setup as a script for a new Mac
- Menu bar widget showing disk used by dev tooling

## How to build it

Tauri (Rust backend plus a React or Next.js frontend) is the recommended stack: lightweight, as polished as web tech allows, and cross-platform when you are ready.

- **Alternative:** SwiftUI feels most native on Mac but locks you to Apple. Tauri lets you reuse your Next.js skills.
- **Scanner layer:** mostly read-only shell commands and file parsing, for example `pyvenv.cfg` for venvs, `brew list --json`, parsing `~/.zshrc`, and walking directories for `node_modules`.
- **Storage:** a local SQLite database caching scan results, so the UI opens instantly and rescans in the background.
- **Permissions:** macOS will prompt for Full Disk Access, so plan the onboarding around that.

## Honest caveats

- **Pieces of this exist.** `mise` and `asdf` unify version managers, `brew` has its own tooling, and apps like CleanMyMac handle cleanup. No good GUI is known that combines the unified inventory, the trace and the safe cleanup in one place. That combination is the angle.
- **Deletion is the risky part.** Build read-only first, and add removal only once the scanner is trustworthy.
- **Dev setups are messy.** Edge cases (odd shells, custom paths) will eat time. Start with `zsh` and the most common tools.

## Suggested MVP

Scope for a weekend to two weeks; everything else waits until you have used it yourself for a couple of weeks.

1. Scan and list all venvs with size and last-used date
2. Show installed runtimes and which manager owns them
3. A `PATH` viewer with a "which python?" tracer
4. A clean UI with a sidebar (Languages, Environments, Variables, Disk)
5. Delete only for venvs, with Trash and a confirmation

Possible next steps: sketch the UI layout, write a one-page spec, or prototype the scanner in Python.

Open question: the example UI image did not upload in the original chat. Share it again to set the design direction.
