# Memory and instruction files (MEM)

Where Claude Code's instructions and memory live, in what order and when each loads, what each surface sees, how auto memory writes and recalls notes, how to keep instruction files current, how the API memory tool and community memory servers compare, and a review of our own files. Researched 2026-10-12 against the Claude Code docs and CHANGELOG at v2.1.296, the Claude API docs, and community sources; probes ran on v2.1.296 with `claude -p` launched from a desktop-app session in WSL.

Out of scope, linked instead: load limits and sizes (TOK-003, TOK-004, SKILL-024, REPO-045), what goes in which file (REPO-044, TOK-065, SKILL-021), agent `memory:` for reviewers (REPO-011), and how to word an instruction (PROMPT-015 to PROMPT-018, PROMPT-038 in `kb-prompting.md`).

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Where can instructions and memory live? | Managed policy CLAUDE.md, `~/.claude/CLAUDE.md`, `~/.claude/rules/`, project `CLAUDE.md` or `.claude/CLAUDE.md`, `.claude/rules/`, `CLAUDE.local.md`, `@` imports, AGENTS.md (when no CLAUDE.md), auto memory, and per-agent `memory:`. | MEM-001 |
| In what order do they load, and which wins? | Broad to specific (managed, user, project, local; root down to the working directory) and concatenated. Nothing overrides anything: on a conflict Claude may follow either. | MEM-002 |
| What loads at launch and what loads later? | Ancestor CLAUDE.md files, unscoped rules, imports and the first 200 lines/25KB of MEMORY.md at launch. Subdirectory CLAUDE.md and `paths:` rules when Claude reads, writes or edits a matching file. Memory topic files when Claude opens them. | MEM-003, MEM-004 |
| What survives `/compact`? | Project-root CLAUDE.md, unscoped rules and auto memory are re-read from disk. Nested CLAUDE.md and `paths:` rules are summarized away until a matching file is touched again. | MEM-003 |
| Do subagents get CLAUDE.md and auto memory? | CLAUDE.md yes, except Explore, Plan and agents with `omitClaudeMd`. Auto memory: the docs say no (forks only), but our v2.1.296 probe showed a general-purpose subagent receiving the main MEMORY.md. | MEM-011 |
| How does auto memory decide what to save? | Claude saves `user`, `feedback`, `project` and `reference` notes it judges useful later, one file each plus a line in MEMORY.md; "remember X" always saves. It skips what the code or CLAUDE.md already says. | MEM-013, MEM-014 |
| What belongs in auto memory and what in CLAUDE.md? | Memory: personal preferences, corrections, short-lived project state, pointers. CLAUDE.md, a skill or `docs/`: anything a teammate, cloud session or reviewer subagent also needs. | MEM-017 |
| How do I turn auto memory off or move it? | `/memory` toggle or `autoMemoryEnabled: false` (any settings file), `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` (wins both ways), or `--bare`. `autoMemoryDirectory` moves it. | MEM-016 |
| How do memories go stale, and what to do? | Nothing expires them; a `modified` timestamp is the only age signal. Prune at the end of a piece of work, delete finished-project notes, and promote durable rules to CLAUDE.md or a skill. | MEM-018, MEM-035 |
| What does a cloud session, routine or the GitHub action see? | The repo's CLAUDE.md and `.claude/rules/` only: no `~/.claude/CLAUDE.md`, no local auto memory. Desktop and terminal share everything. | MEM-026 |
| How do I keep CLAUDE.md current? | Add a line when Claude repeats a mistake; run `/doctor` (trim) and `/doctor prompt-audit` (stale paths, conflicts); `/claude-md-management:revise-claude-md` at the end of a session; review changes in PRs. | MEM-020 to MEM-024 |
| API memory tool or Claude Code auto memory? | Same idea (a directory of files the model reads and writes). The API tool is client-side, loads nothing by itself and needs your path checks; Claude Code's auto memory is built in and preloads the index. | MEM-030, MEM-031 |
| Do memory servers (mem0, claude-mem, basic-memory) beat plain files? | No controlled evidence for coding work; published numbers are chat-recall benchmarks. Our own claude-mem trial was net-negative and removed. | MEM-032, MEM-033 |
| Can memory be a prompt-injection vector? | Yes: planted memory files steer later sessions. Since v2.1.50 Claude Code no longer puts MEMORY.md in the system prompt, and v2.1.284 neutralizes markup in it; guard what writes there. | MEM-019 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| MEM-001 | Every place instructions and memory live | comparison | locations, claude-md, rules, auto-memory |
| MEM-002 | Load order: concatenated, broad to specific, no overrides | fact | load-order, precedence, conflicts |
| MEM-003 | What loads at launch, on demand, and after compaction | fact | lazy-loading, compaction, nested |
| MEM-004 | `.claude/rules/`: unscoped, `paths:`-scoped, user-level, symlinked | fact | rules, paths, globs |
| MEM-005 | `@` imports: paths, depth and the external-import dialog | fact | imports, approval |
| MEM-006 | `CLAUDE.local.md` and personal instructions across worktrees | pattern | claude-local, worktrees, personal |
| MEM-007 | Managed policy CLAUDE.md and `claudeMd` | fact | managed, org |
| MEM-008 | AGENTS.md: when Claude Code reads it | fact | agents-md, interop |
| MEM-009 | Switches: settings and env vars that change what loads | fact | settings, env-vars, bare |
| MEM-010 | How instructions and memory are delivered to the model | fact | system-prompt, delivery, user-message |
| MEM-011 | What subagents and forks get | fact | subagents, fork, explore, omitclaudemd |
| MEM-012 | Version history of memory and instruction loading | fact | changelog, versions |
| MEM-013 | Auto memory: what gets saved and in what format | fact | auto-memory, types, frontmatter |
| MEM-014 | Auto memory recall: index at start, topic files on demand | fact | auto-memory, recall, limits |
| MEM-015 | `/memory` and auditing what was saved | tool | memory-command, audit |
| MEM-016 | Turning auto memory off or moving it | fact | auto-memory, settings, disable |
| MEM-017 | What auto memory should and shouldn't hold | recommendation | auto-memory, placement |
| MEM-018 | Stale memories | anti-pattern | staleness, maintenance |
| MEM-019 | Memory as a prompt-injection vector | fact | security, poisoning |
| MEM-020 | `/init` and `CLAUDE_CODE_NEW_INIT` | tool | init, bootstrap |
| MEM-021 | `/doctor` trim and prompt audit for instruction files | tool | doctor, audit |
| MEM-022 | The `claude-md-management` plugin | tool | plugin, audit, revise |
| MEM-023 | When to update CLAUDE.md: Anthropic's triggers | recommendation | maintenance, triggers |
| MEM-024 | Community practice for keeping instruction files current | comparison | community, maintenance, drift |
| MEM-025 | Memory ideas from other coding tools | comparison | cline, cursor, copilot, windsurf, codex |
| MEM-026 | What each surface loads | comparison | surfaces, cloud, desktop, wsl, routines, github-actions |
| MEM-027 | Worktrees and instruction files | fact | worktrees, claude-md, auto-memory |
| MEM-028 | Agent SDK and `claude -p`: setting sources and memory | fact | agent-sdk, headless, setting-sources |
| MEM-029 | Cloud Projects memory is a separate store | fact | projects, cloud, memory |
| MEM-030 | The API memory tool | tool | api, memory-tool |
| MEM-031 | API memory tool, Managed Agents memory stores and auto memory compared | comparison | api, managed-agents, auto-memory |
| MEM-032 | Community memory servers and plugins | comparison | community, mcp, mem0, claude-mem, basic-memory |
| MEM-033 | Do memory servers beat plain files? | recommendation | community, evidence, cost |
| MEM-034 | Our instruction files and memory, measured | fact | our-setup, measurement |
| MEM-035 | Our auto memory: misplaced and stale entries | comparison | our-setup, auto-memory, staleness |

## [MEM-001] Every place instructions and memory live
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory](https://code.claude.com/docs/en/memory), [Subagents](https://code.claude.com/docs/en/sub-agents), [CLI reference](https://code.claude.com/docs/en/cli-reference)
- Related: MEM-002, MEM-003, REPO-005, REPO-011, TOK-065

| Layer | Location | Written by | Loads |
|---|---|---|---|
| Managed policy | `/etc/claude-code/CLAUDE.md` (Linux, WSL), `/Library/Application Support/ClaudeCode/CLAUDE.md`, `C:\Program Files\ClaudeCode\CLAUDE.md`; or `claudeMd` in managed settings | IT | Launch; can't be excluded (MEM-007) |
| User | `~/.claude/CLAUDE.md`, `~/.claude/rules/*.md` | You | Launch, all projects |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md`, `.claude/rules/*.md` | Team, in git | Launch (ancestors), on demand (subdirectories, `paths:` rules) |
| Local | `./CLAUDE.local.md` ("add to `.gitignore`") | You | Launch, after that directory's CLAUDE.md |
| Imports | `@path` inside any of the above | Any | With the importing file (MEM-005) |
| AGENTS.md | `AGENTS.md`, `.claude/AGENTS.md` | Other tools | Only when no CLAUDE.md or CLAUDE.local.md exists, by default (MEM-008) |
| Auto memory | `~/.claude/projects/<project>/memory/MEMORY.md` plus topic files | Claude | Index at launch, topics on demand (MEM-014) |
| Agent memory | `memory: user/project/local` → `~/.claude/agent-memory/<agent>/`, `.claude/agent-memory/<agent>/`, `.claude/agent-memory-local/<agent>/` | The agent | That agent's start (REPO-011) |
| System prompt | `--append-system-prompt`, `--append-system-prompt-file`, output styles, an agent's body | You | Every request, in the system prompt (MEM-010) |

Not memory, but often confused with it: skills load on demand (SKILL-004), and hooks are enforced configuration (HOOK-016).

## [MEM-002] Load order: concatenated, broad to specific, no overrides
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: how CLAUDE.md files load](https://code.claude.com/docs/en/memory)
- Related: MEM-001, MEM-003, MEM-004, MEM-007, PROMPT-016

The docs list the layers "in load order, from broadest scope to most specific, so a project instruction appears in context after a user instruction": managed, user, project, local.

- **Concatenated, not overridden:** "All discovered files are concatenated into context rather than overriding each other."
- **Directory order:** "content is ordered from the filesystem root down to your working directory… instructions closer to where you launched Claude are read last." Within a directory, "`CLAUDE.local.md` is appended after `CLAUDE.md`".
- **Rules:** unscoped `.claude/rules/` files load "with the same priority as `.claude/CLAUDE.md`". User rules load before project rules, and "Neither set overrides the other: if a user rule and a project rule conflict, Claude may follow either one, so keep the two consistent."
- **Conflicts in general:** "if two instructions contradict each other, Claude may pick one arbitrarily."

Consequence: later position is not precedence. A repo rule that should beat a global one has to say so in words; how to word such an override is in PROMPT-016. Only managed settings (not managed CLAUDE.md) are enforced.

Tested 2026-10-12, v2.1.296, `claude -p`: the transcript's `instructions` attachment listed `~/.claude/CLAUDE.md`, then the project CLAUDE.md, then MEMORY.md, in that order.

## [MEM-003] What loads at launch, on demand, and after compaction
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory](https://code.claude.com/docs/en/memory), [Context window: what survives compaction](https://code.claude.com/docs/en/context-window), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: MEM-004, TOK-003, TOK-031, MEM-010

**At launch:** CLAUDE.md and CLAUDE.local.md in the working directory and every ancestor, unscoped rules, user rules, their `@` imports, and the first 200 lines or 25KB of MEMORY.md. `/context` lists them under **Memory files**.

**On demand:** a subdirectory's CLAUDE.md loads "once Claude reads, writes, or edits another file in that subdirectory", including single-file `cat` or `head` in Bash. Write and Edit triggers arrived in v2.1.288, Bash views in v2.1.293; before that, only Read. A `Loaded` line shows in the terminal; it doesn't appear under Memory files. Memory topic files load only when Claude opens them.

**After `/compact` or auto-compaction:**

| Content | After compaction |
|---|---|
| Project-root CLAUDE.md and unscoped rules | "Re-injected from disk" |
| Auto memory | "Re-injected from disk" |
| `paths:` rules, nested CLAUDE.md | Summarized away; reload "on demand" when a matching file is touched |

"If a rule must persist across compaction, drop the `paths:` frontmatter or move it to the project-root CLAUDE.md."

**Mid-session edits** to CLAUDE.md apply after `/clear`, `/compact` or a restart (TOK-003).

Tested 2026-10-12, v2.1.296, `claude -p` on Haiku: a `sub/CLAUDE.md` and a `paths: ["sub/**"]` rule were absent at start and present after one Read of `sub/file.txt`.

## [MEM-004] `.claude/rules/`: unscoped, `paths:`-scoped, user-level, symlinked
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: organize rules](https://code.claude.com/docs/en/memory), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: MEM-003, TOK-065, SKILL-014, REPO-044

`.claude/rules/` arrived in v2.0.64. "All `.md` files are discovered recursively", one topic per file.

**`paths:` frontmatter** is "the only field Claude Code reads from a rule". It takes a YAML list or a comma-separated string of globs (`src/**/*.{ts,tsx}`, `*.md` for the root only). A scoped rule loads when Claude uses Read, Write or Edit on a matching file, or views it with a single-file Bash read. Limits: one budget of "1,000 expanded patterns and 4 MiB" per rule; an invalid `[` pattern matches nothing. If the YAML doesn't parse, the rule loads unscoped; `claude --debug` shows the error.

**User rules** in `~/.claude/rules/` apply to every project and load before project rules.

**Symlinks** work. A link pointing outside the working directory is treated as an external import: it waits for the import approval (MEM-005), and then only unscoped linked rules load. Network paths are never followed. To share rules without the dialog, use `~/.claude/rules/`.

**When to use which:** unscoped rules cost the same as CLAUDE.md and only organize it. `paths:` rules are the cheap option for directory- or language-specific guidance, but they vanish after compaction until the next match (MEM-003). For on-demand procedures, use a skill (SKILL-021).

`--setting-sources` without `project` skips project rules (nested ones too since v2.1.211).

## [MEM-005] `@` imports: paths, depth and the external-import dialog
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: import additional files](https://code.claude.com/docs/en/memory), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: MEM-006, TOK-003, MEM-019

`@path/to/file` anywhere in a CLAUDE.md expands that file into context at launch (since v0.2.107).

- **Paths:** relative or absolute; relative paths "resolve relative to the file containing the import, not the working directory". `@~/…` works.
- **Depth:** "a maximum depth of four hops".
- **Escaping:** backslash before each space; a quoted path "isn't imported at all". Imports inside code spans and fenced blocks are skipped, so `` `@README` `` stays literal.
- **Cost:** imports "don't reduce its context cost, because imported files also load at launch" (TOK-003).
- **External imports** (resolving outside the working directory) from a project-level file trigger a one-time approval dialog per project. "If you decline, the imports stay disabled and the dialog doesn't appear again." User-scope files (`~/.claude/CLAUDE.md`, `~/.claude/rules/`) import without the dialog, except in Cowork sessions.
- **A prose pointer is not an import:** "tells Claude in words to read" a file means Claude sees it "only if it decides to open the file".

Use imports to share one file between tools (`@AGENTS.md`, MEM-008) or to pull a personal file into a gitignored worktree setup (MEM-006). Use a prose pointer, not an import, when the file should load only when needed.

## [MEM-006] `CLAUDE.local.md` and personal instructions across worktrees
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory](https://code.claude.com/docs/en/memory), [Worktrees](https://code.claude.com/docs/en/worktrees), [Desktop](https://code.claude.com/docs/en/desktop)
- Related: MEM-005, MEM-008, MEM-027, SESS-008

`CLAUDE.local.md` is current, not deprecated: it "loads alongside `CLAUDE.md` and is treated the same way", appended after the directory's CLAUDE.md. Claude Code doesn't gitignore it for you, except `/init` with `CLAUDE_CODE_NEW_INIT=1` and the personal option. Desktop and terminal both read it.

**Worktree trap:** "a gitignored `CLAUDE.local.md` only exists in the worktree where you created it." New worktrees don't get it unless `.worktreeinclude` lists it (SESS-008). The docs' fix is an import from your home directory:

```text
# Individual Preferences
- @~/.claude/my-project-instructions.md
```

That import is external, so it needs the one-time approval (MEM-005).

**AGENTS.md trap:** a `CLAUDE.local.md` counts as a CLAUDE.md, so adding one in a repo that relies on `AGENTS.md` stops Claude reading `AGENTS.md`, unless **Project instructions** is `claude-md-and-agents-md` (MEM-008).

For personal rules across all repos, use `~/.claude/CLAUDE.md` or `~/.claude/rules/` instead. In cloud sessions neither file exists unless a setup script writes it (MEM-026).

## [MEM-007] Managed policy CLAUDE.md and `claudeMd`
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: deploy organization-wide CLAUDE.md](https://code.claude.com/docs/en/memory), [Settings reference](https://code.claude.com/docs/en/settings-reference), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: MEM-001, MEM-002, MEM-009

An organization-wide CLAUDE.md lives at `/etc/claude-code/CLAUDE.md` (Linux and WSL), `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS) or `C:\Program Files\ClaudeCode\CLAUDE.md` (Windows), distributed by MDM or similar. It loads first and "cannot be excluded by individual settings", including by `claudeMdExcludes`.

The `claudeMd` key puts the same content inside `managed-settings.json`. It is honored only in managed and policy settings; "Setting `claudeMd` in user, project, or local settings has no effect." Since v2.1.260, a server-managed `claudeMd` no longer triggers the security approval dialog.

The docs split the two jobs: managed settings for "technical enforcement" (`permissions.deny`, sandbox, env), managed CLAUDE.md for "behavioral guidance", because "CLAUDE.md instructions shape Claude's behavior but are not a hard enforcement layer."

Not relevant to a single developer's machine; recorded so an agent doesn't mistake `/etc/claude-code/` for something to edit.

## [MEM-008] AGENTS.md: when Claude Code reads it
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: AGENTS.md](https://code.claude.com/docs/en/memory), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: REPO-045, MEM-006, MEM-005

Since v2.1.277, Claude Code reads `AGENTS.md` and `.claude/AGENTS.md` as project instructions, but by default only when no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` exists in the working directory or above. `~/.claude/CLAUDE.md`, managed CLAUDE.md and `.claude/rules/` don't count and keep loading. `AGENTS.local.md`, `AGENTS.override.md` and `.agents/` are never read.

**Project instructions** in `/config`: `claude-md-or-agents-md` (default), `claude-md-and-agents-md`, `claude-md`, `managed-only`. In a settings file it is `pluginConfigs["cc-plugin-agents-md@builtin"].options.instructionFiles` (named `agents-md@builtin` before v2.1.285), read from user, `--settings` or managed settings and ignored in project and local files.

Differences from a CLAUDE.md: no `InstructionsLoaded` hook, not loaded from `--add-dir` directories, and external imports load only if already approved.

**Sharing one file across tools:** a CLAUDE.md containing `@AGENTS.md` plus Claude-only lines works on every version and surface; Claude Code never reads it twice. A `CLAUDE.md → AGENTS.md` symlink breaks on Windows clones without `core.symlinks`. Remove old `SessionStart` hooks that print AGENTS.md: they now add a second copy.

Which other tools read CLAUDE.md is in REPO-045.

## [MEM-009] Switches: settings and env vars that change what loads
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Settings reference](https://code.claude.com/docs/en/settings-reference), [Environment variables](https://code.claude.com/docs/en/env-vars), [Memory](https://code.claude.com/docs/en/memory), [Headless](https://code.claude.com/docs/en/headless)
- Related: MEM-016, MEM-028, SESS-014

| Switch | Effect |
|---|---|
| `claudeMdExcludes` (any settings file, arrays merge) | Skip CLAUDE.md or rules by absolute-path glob; not managed files |
| `--add-dir` + `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` | Also load CLAUDE.md, `.claude/CLAUDE.md`, `.claude/rules/` and CLAUDE.local.md from added directories (off by default) |
| `--setting-sources` | Excluding `project` skips project rules; excluding `local` skips CLAUDE.local.md |
| `CLAUDE_CODE_DISABLE_CLAUDE_MDS=1` | No CLAUDE.md files, "including user, project, and auto memory files" |
| `--bare` / `CLAUDE_CODE_SIMPLE` | Skips hooks, skills, plugins, MCP, "auto memory, and CLAUDE.md"; "will become the default for `-p` in a future release" |
| `--safe-mode` / `CLAUDE_CODE_SAFE_MODE` (v2.1.169) | No CLAUDE.md, rules or auto memory |
| `includeGitInstructions: false` | Drops Claude Code's own commit and PR guidance and the git status snapshot, so CLAUDE.md git rules don't compete |
| `autoMemoryEnabled`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY`, `autoMemoryDirectory`, `CLAUDE_CODE_PROJECT_DIR_NAME` | Auto memory (MEM-016) |
| `omitClaudeMd: true` (agent frontmatter, v2.1.271) | That subagent skips user, project and local CLAUDE.md (MEM-011) |
| `CLAUDE_CODE_NEW_INIT=1` | Multi-phase `/init` (MEM-020) |

`permissions.additionalDirectories` grants file access only and loads no configuration.

## [MEM-010] How instructions and memory are delivered to the model
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: troubleshoot](https://code.claude.com/docs/en/memory), [Agent SDK: Claude Code features](https://code.claude.com/docs/en/agent-sdk/claude-code-features), [Agent SDK: modifying system prompts](https://code.claude.com/docs/en/agent-sdk/modifying-system-prompts), [Cisco: persistent memory compromise in Claude Code](https://blogs.cisco.com/ai/identifying-and-remediating-a-persistent-memory-compromise-in-claude-code)
- Related: MEM-019, TOK-052, SESS-015, PROMPT-016

**CLAUDE.md:** "delivered as a user message after the system prompt, not as part of the system prompt itself… there's no guarantee of strict compliance". It doesn't affect the system-prompt cache.

**System-prompt level:** `--append-system-prompt` (or `-file`), an output style, or a custom agent's body. The docs suggest `--append-system-prompt` "for scripts and automation".

**Auto memory, where sources disagree:**
- The Agent SDK page: "Loaded into the system prompt at session start".
- Cisco (2026-04-01): MEMORY.md used to load "directly into the AI's system prompt"; Anthropic "pushed a change to Claude Code v2.1.50 that removes this capability from the system prompt."
- Tested 2026-10-12, v2.1.296, `claude -p`: the transcript holds MEMORY.md in the same `instructions` attachment as the CLAUDE.md files, rendered as a user-role system reminder ("user's auto-memory, persists across conversations").

So in current Claude Code, memory arrives like CLAUDE.md: as context, not system-prompt instructions. The SDK page's wording looks out of date (INDEX.md Conflicts).

**Cache:** the prefix embeds the auto-memory path and working directory, so different directories don't share a cache (SESS-015).

## [MEM-011] What subagents and forks get
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Subagents: what loads at startup](https://code.claude.com/docs/en/sub-agents), [Memory](https://code.claude.com/docs/en/memory)
- Related: ORCH-007, REPO-010, REPO-011, MEM-010

The full starting context is in ORCH-007. For instructions and memory:

| Subagent | CLAUDE.md hierarchy | Main auto memory |
|---|---|---|
| Fork | Inherits the parent's context | Inherited |
| Explore, Plan | Skipped | Not loaded |
| general-purpose and custom | Loaded ("every level… including `~/.claude/CLAUDE.md`, project rules, `CLAUDE.local.md`, managed policy files" and AGENTS.md) | Docs: "isn't loaded" |
| Custom with `omitClaudeMd: true` (v2.1.271) | Managed policy only | Not loaded |
| Custom with `memory:` | As above | Its own directory instead (REPO-011) |

The docs advise restating in the delegation prompt any rule a subagent must keep, since the main conversation still has the full CLAUDE.md when it reads results.

**Probe contradicting the docs.** Tested 2026-10-12, v2.1.296, `claude -p --model haiku` with a custom `autoMemoryDirectory`: a `general-purpose` subagent (not a fork; the Agent call had `subagent_type: general-purpose`) answered a word that existed only in MEMORY.md, and its transcript held an `AutoMem` attachment with the index. An Explore subagent knew neither the CLAUDE.md nor the memory word. One run each; treat "subagents don't see auto memory" as unreliable in both directions until re-tested in an interactive session (Open questions).

## [MEM-012] Version history of memory and instruction loading
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: MEM-003, MEM-013, MEM-008

Condensed from the CHANGELOG, to judge whether old advice still applies.

| Version | Change |
|---|---|
| 0.2.107 | CLAUDE.md `@path` imports |
| 2.0.64 | `.claude/rules/` |
| 2.0.70 | "Removed # shortcut for quick memory entry (tell Claude to edit your CLAUDE.md instead)" |
| 2.1.33 | Agent `memory:` frontmatter |
| 2.1.59 | "Claude automatically saves useful context to auto-memory. Manage with /memory" |
| 2.1.63 | Auto memory shared across worktrees of a repo |
| 2.1.69 | `InstructionsLoaded` hook; `includeGitInstructions`; `paths:` rules and nested CLAUDE.md fixed in `-p` |
| 2.1.74 | `autoMemoryDirectory` |
| 2.1.81 | `--bare` |
| 2.1.83 | MEMORY.md truncates at 25KB as well as 200 lines |
| 2.1.206 | `/doctor` proposes CLAUDE.md trims |
| 2.1.210 | Over-limit MEMORY.md writes return an error instead of silent truncation |
| 2.1.214 | ISO `modified` timestamp in memory frontmatter |
| 2.1.271 | `omitClaudeMd` |
| 2.1.277 | AGENTS.md support |
| 2.1.283 | `/doctor prompt-audit`; Claude's own memory edits no longer blocked as sensitive-file writes |
| 2.1.284 | Invisible characters and markup-imitating tags in MEMORY.md neutralized |
| 2.1.285 | `/memory` can't turn auto memory on from background or Claude-started sessions |
| 2.1.288, 2.1.293 | Write/Edit, then Bash views, trigger nested CLAUDE.md and `paths:` rules |

Guides that mention the `#` shortcut, MEMORY.md in the system prompt, or rules loading only on Read predate these.

## [MEM-013] Auto memory: what gets saved and in what format
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: auto memory](https://code.claude.com/docs/en/memory), [Claude directory](https://code.claude.com/docs/en/claude-directory), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: MEM-014, MEM-017, TOK-004

Auto memory (v2.1.59+, on by default in local sessions) is notes Claude writes for itself. The docs name four kinds, recorded as `type` in each file's frontmatter:
- `user`: "your role, expertise, and working preferences"
- `feedback`: "corrections you give Claude and approaches you confirm"
- `project`: "ongoing work, deadlines, and decisions that Claude can't derive from the code or git history"
- `reference`: "where to find information outside the project, such as an issue tracker or dashboard"

"Claude skips anything it can derive from the codebase, such as architecture, file paths, or debugging fixes. It also skips anything your CLAUDE.md files already say." It "doesn't save something every session". The `.claude` directory page disagrees ("Claude saves notes as it works: build commands, debugging insights, architecture notes"); trust the memory page, which matches the v2.1.296 prompt (INDEX.md Conflicts). An explicit "remember that…" always saves to auto memory; "add this to CLAUDE.md" goes to CLAUDE.md instead. The `#` shortcut was removed in v2.0.70.

**Layout:** `MEMORY.md` holds one line per memory; each memory is its own file. Claude Code stamps an ISO `modified` time on any file with frontmatter (v2.1.214+).

Tested 2026-10-12, v2.1.296, `claude -p` on Haiku: "Remember for future sessions: the FIGWORD is MANGO" created `figword_mango.md` with frontmatter `name`, `description` and `metadata: {node_type: memory, type: user, originSessionId, modified}`, a body with **Why:** and **How to apply:** lines, and an index line in MEMORY.md. So `-p` runs write memory too.

## [MEM-014] Auto memory recall: index at start, topic files on demand
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: how it works](https://code.claude.com/docs/en/memory), [Errors: memory index over its read limit](https://code.claude.com/docs/en/errors)
- Related: TOK-004, MEM-013, MEM-003, MEM-018

- **At start:** "The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first". The rest is not loaded (limits in TOK-004).
- **Topic files:** not loaded at startup; "Claude reads them on demand using its standard file tools when it needs the information." The interface shows "Recalled 2 memories" or "Saved 2 memories".
- **Undocumented selection step (unverified):** the v2.1.296 binary holds a side-query prompt that returns "a list of filenames for the memories that will clearly be useful… (up to 5)", judged "based on their name and description". The CHANGELOG mentions "memory recall" (v2.1.288) but no doc describes it. No embedding search either way.
- **Keeping the index small:** after a write near a limit, Claude Code reminds Claude to "keep one line per entry, move detail into topic files, and merge or drop stale entries". Over a limit, the write succeeds but returns an error telling Claude to rewrite the index (v2.1.210+).
- **Retention:** memory files are excluded from the `cleanupPeriodDays` sweep; they stay until edited or deleted.
- **After compaction:** re-injected from disk (MEM-003).

Consequence: the index line and the `description` are the retrieval keys. A memory whose one-liner doesn't name the situation it applies to is rarely recalled. Write them as "when X, do Y", not as titles.

Our transcripts show how often recall happens in practice: in osrs-tracker-web, 33 of 125 sessions opened a memory topic file (MEM-034).

## [MEM-015] `/memory` and auditing what was saved
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: view and edit with /memory](https://code.claude.com/docs/en/memory), [Hooks: InstructionsLoaded](https://code.claude.com/docs/en/hooks)
- Related: MEM-016, MEM-018, MEM-003

`/memory`:
- lists CLAUDE.md, CLAUDE.local.md and other memory files across user and project scope, including ones that don't exist yet (selecting one creates it);
- opens a file in your editor (GUI editors no longer block the session since v2.1.216);
- toggles auto memory and opens the auto memory folder.

Other checks:
- `/context` shows the files that loaded at launch under **Memory files**. Lazily loaded nested files don't appear there; a `Loaded` line shows in the terminal instead.
- The `InstructionsLoaded` hook (v2.1.69+) logs which CLAUDE.md and rules files loaded, when and why: the tool for debugging `paths:` rules (HOOK-001).
- Memory files are plain Markdown: `ls ~/.claude/projects/<project>/memory/` and read them. The project folder name is the repo path with `/` replaced by `-`.

Nothing in Claude Code reviews memory for you. The only automatic hygiene is the index-size reminder (MEM-014); duplicates and stale entries stay until someone deletes them (MEM-018).

## [MEM-016] Turning auto memory off or moving it
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: enable or disable](https://code.claude.com/docs/en/memory), [Settings reference](https://code.claude.com/docs/en/settings-reference), [Environment variables](https://code.claude.com/docs/en/env-vars)
- Related: MEM-009, SESS-014, MEM-019

**Off:**
- `/memory` toggle, which writes `autoMemoryEnabled` to `~/.claude/settings.json`. Since v2.1.285 it can turn memory off but not on in a background session or one Claude started.
- `autoMemoryEnabled: false` in any settings file, e.g. a project's `.claude/settings.json` for one repo.
- `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. It wins "in either direction": `0` forces memory on even under `--bare` or `autoMemoryEnabled: false`.
- `--bare`, safe mode and `CLAUDE_CODE_DISABLE_CLAUDE_MDS=1` also drop it.
- Self-hosted cloud environments run with it off by default.

Turning it off also disables every agent's `memory:` field.

**Moving it:** `autoMemoryDirectory` (absolute or `~/` path, v2.1.74+) from any settings scope or `--settings`. In a repo's settings it follows the workspace-trust rule for hooks, and with `permissions.blockReadsOutsideWorkingDirectories` on, a repo-chosen directory is ignored. `CLAUDE_CODE_PROJECT_DIR_NAME` beside `CLAUDE_CONFIG_DIR` makes every project under that config share one memory folder (v2.1.234+).

Tested 2026-10-12, v2.1.296, `claude -p`: `--settings` with `autoMemoryDirectory` pointing into a scratch folder loaded that folder's MEMORY.md; adding `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` removed it while CLAUDE.md still loaded. A scratch directory is how to probe memory without touching `~/.claude/projects/`.

## [MEM-017] What auto memory should and shouldn't hold
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory](https://code.claude.com/docs/en/memory), [Cloud environments: what carries over](https://code.claude.com/docs/en/cloud-environments), [Subagents](https://code.claude.com/docs/en/sub-agents)
- Related: REPO-044, TOK-065, MEM-013, MEM-026, MEM-035

The docs' split: CLAUDE.md is "Instructions and rules" you write; auto memory is "Learnings and patterns" Claude writes, for "Your preferences, corrections you give Claude, and project context Claude can't derive from the code".

Auto memory is the narrowest channel. It is machine-local ("not shared across machines or cloud environments"), keyed to one repo, and invisible to cloud sessions, routines, the GitHub action and, per the docs, non-fork subagents. So:

| Content | Home |
|---|---|
| Personal working preferences for one repo, in-flight state, pointers to dashboards or issues | Auto memory |
| A preference that holds in every repo | `~/.claude/CLAUDE.md` or `~/.claude/rules/` |
| A convention, build fact or gotcha teammates, reviewers or cloud runs also need | Project CLAUDE.md, a `paths:` rule or the repo skill (REPO-044) |
| A deliberate trade-off reviewers must not flag | `docs/decisions.md` (REPO-044) |
| Anything that must happen | A hook (HOOK-028) |
| Secrets, tokens, account IDs | Nowhere; store a path to the credential file at most |

*Our inference from the visibility rules, not a documented list:* treat a `feedback` memory that keeps being recalled as a candidate CLAUDE.md or skill line, and a `project` memory as something to delete when the project ends.

## [MEM-018] Stale memories
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory](https://code.claude.com/docs/en/memory), [Managed Agents: dreams](https://platform.claude.com/docs/en/managed-agents/dreams), [anthropics/claude-code#85075](https://github.com/anthropics/claude-code/issues/85075), local v2.1.296 binary strings
- Related: MEM-014, MEM-015, MEM-035, MEM-023

**Documented:** nothing expires memory. There is the `modified` timestamp, which "shows how current the fact is, both to you and to Claude when it reads the memory back", the index-size reminder to "merge or drop stale entries" (MEM-014), and editing files yourself via `/memory`.

**Undocumented, in the v2.1.296 binary (unverified):**
- A system-prompt line: "Memory records can become stale over time… verify that the memory is still correct… If a recalled memory conflicts with current information, trust what you observe now". It's an instruction, not a check.
- "Auto-dream" consolidation: an `autoDreamEnabled` setting ("overrides the server-side default") and defaults `minHours:24,minSessions:5`. It isn't in the settings docs or CHANGELOG; Managed Agents documents the same idea as "dreams" (duplicates merged, "stale or contradicted entries replaced").

An open issue reports months-old memory loading with "no freshness indication, no expiry" (#85075).

How memories go stale, seen in ours (MEM-035):
- **Finished work** kept as a `project` memory ("tracking issue #78 (done 2026-10-07)").
- **Duplicates** of a skill or CLAUDE.md line, which then drift apart; the docs' "Claude may pick one arbitrarily" applies.
- **Environment facts** tied to a version ("after each desktop app update, follow up").
- **Rules stuck in the wrong repo**: a preference saved while working in one repo never loads in another.

Mitigation (our practice, not documented guidance): when a piece of work ends, delete its `project` memories and promote recurring `feedback` to CLAUDE.md or the skill (MEM-017).

## [MEM-019] Memory as a prompt-injection vector
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Cisco: persistent memory compromise in Claude Code](https://blogs.cisco.com/ai/identifying-and-remediating-a-persistent-memory-compromise-in-claude-code), [Bad Memory, arXiv 2607.14611](https://arxiv.org/abs/2607.14611), [Memory cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/tool_use/memory_cookbook.ipynb), [Managed Agents memory](https://platform.claude.com/docs/en/managed-agents/memory), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: MEM-010, MEM-016, REPO-037, HOOK-025

Memory files are read back as trusted context, so whatever writes them steers later sessions.

- **Claude Code incident:** Cisco (2026-04-01) planted instructions in MEMORY.md through an npm `postinstall` script; MEMORY.md then loaded into the system prompt, and "models assume they were written by the user and implicitly trust them". Anthropic moved it out of the system prompt in v2.1.50 (MEM-010). v2.1.284 neutralizes "invisible characters and tags that imitate Claude Code's own markup" in MEMORY.md.
- **Research:** "it is difficult to make an agent overwrite its own memory files using untrusted external content, payloads already planted in those files can successfully attack current and future sessions" (Bad Memory, tested Claude Code and Codex).
- **Anthropic's cookbook:** "Memory files are read back into Claude's context, making them a potential vector for prompt injection"; mitigations are sanitization, per-user and per-project scope, auditing, and telling Claude to ignore instructions in memory.
- **Managed Agents:** attach stores `read_only` when the agent processes untrusted input.
- **Repo-chosen directories:** a project's `autoMemoryDirectory` follows the trust rule for hooks (MEM-016).

Practical reading: the write path is the risk (install scripts, other tools, a shared memory directory), not Claude's own saves. Skim new memory files now and then (MEM-015), and keep secrets out of them.

## [MEM-020] `/init` and `CLAUDE_CODE_NEW_INIT`
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: set up a project CLAUDE.md](https://code.claude.com/docs/en/memory), [Commands](https://code.claude.com/docs/en/commands), [Environment variables](https://code.claude.com/docs/en/env-vars)
- Related: MEM-021, MEM-024, REPO-045

`/init` "analyzes your codebase and creates a file with build commands, test instructions, and project conventions it discovers. If a CLAUDE.md already exists, `/init` suggests improvements rather than overwriting it."

`CLAUDE_CODE_NEW_INIT=1` switches to a multi-phase flow: it asks which artifacts to set up (CLAUDE.md files, skills, hooks, personal memory files), explores with a subagent, asks follow-up questions, and "presents a reviewable proposal before writing any files". It can also gitignore a `CLAUDE.local.md`. The variable "only changes how `/init` runs, so you can leave it set."

**Migration:** `/init` folds in `.cursor/rules/`, `.cursorrules` and `.github/copilot-instructions.md`; with the new flow also `AGENTS.md`, `.devin/rules/`, `.windsurf/rules/`, `.windsurfrules` and `.clinerules`. `/import` (v2.1.213+) appends a one-time copy of another agent's instruction files plus its MCP servers, commands, subagents and skills.

**Caution:** a generated file is a starting point. Anthropic says to refine it "with instructions Claude wouldn't discover on its own", and an ICLR 2026 study found LLM-generated context files slightly lowered task success while raising cost by about 20% (MEM-033). Run `/init` on a new repo, then cut what the code already says.

## [MEM-021] `/doctor` trim and prompt audit for instruction files
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: audit your instruction files](https://code.claude.com/docs/en/memory), [Commands](https://code.claude.com/docs/en/commands), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: TOK-003, MEM-022, MEM-023, SKILL-030, PROMPT-017

Two built-in checks, both report-first:

- **`/doctor` trim** (v2.1.206+; `/checkup` is an alias): "proposes trims for a checked-in CLAUDE.md: it cuts content Claude can derive from the codebase, such as directory layouts, dependency lists, and architecture overviews, and keeps pitfalls, rationale, and conventions that differ from tool defaults". It also flags local CLAUDE.md files that duplicate checked-in ones and offers to move always-loaded guidance into skills or nested files.
- **`/doctor prompt-audit`** (v2.1.283+): checks CLAUDE.md, CLAUDE.local.md, AGENTS.md, rules, skills, commands, subagents and output styles under `.claude/` and `~/.claude/` for "instructions written for older models, references to files or commands that don't exist, and files that contradict each other". "Nothing in your files changes until you ask Claude to apply them." It needs the bundled `claude-api` skill enabled. Its wording findings are covered in PROMPT-017; here it matters for stale paths, stale commands and conflicts.
- **Size warnings** at startup and in `/status` when one file, or all of them combined, pass the recommended size (threshold scales with the context window since v2.1.169).

Neither looks at auto memory. Nothing built in audits MEMORY.md for duplicates of CLAUDE.md (MEM-018).

## [MEM-022] The `claude-md-management` plugin
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-12
- Sources: [claude-md-management plugin](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-md-management), [Memory](https://code.claude.com/docs/en/memory)
- Related: MEM-021, MEM-023, SKILL-022, MEM-012

Anthropic's plugin in `claude-plugins-official` (v1.0.0) has two parts:

| Part | When | What it does |
|---|---|---|
| `claude-md-improver` skill | "Periodic maintenance", after codebase changes | Scores every CLAUDE.md on a 100-point rubric (commands 20, architecture clarity 20, non-obvious patterns 15, conciseness 15, currency 15, actionability 15), "ALWAYS output the quality report BEFORE making any updates", then proposes fixes for stale commands, deleted paths and duplicates |
| `/revise-claude-md` command | "End of session" | Reflects on what context was missing (commands, style, testing, environment quirks, gotchas), drafts "one line per concept", and edits "Only… files they approve"; tools `Read, Edit, Glob` |

**Where it lags the docs (2026-10-12):**
- It still teaches the `#` shortcut, removed in v2.0.70.
- It names `.claude.local.md`; the docs say `CLAUDE.local.md`.
- 20 points for "architecture clarity" ("Key directories explained") pulls against `/doctor`, which cuts "directory layouts… and architecture overviews", and against the evidence that overviews don't help (MEM-033).

**Use:** `/revise-claude-md` after a session that hit a gotcha is a cheap, reviewable way to turn a correction into a CLAUDE.md line, the alternative to letting it sit in auto memory. Prefer `/doctor` over the improver's rubric for what to cut. Its always-on cost is about 177 tokens (SKILL-022).

## [MEM-023] When to update CLAUDE.md: Anthropic's triggers
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory: when to add to CLAUDE.md](https://code.claude.com/docs/en/memory), [Best practices](https://code.claude.com/docs/en/best-practices), [Large codebases](https://code.claude.com/docs/en/large-codebases), [Commands: /verify](https://code.claude.com/docs/en/commands)
- Related: REPO-044, REPO-045, MEM-021, MEM-024, PROMPT-015

**Add a line when** (memory page):
- "Claude makes the same mistake a second time"
- "A code review catches something Claude should have known about this codebase"
- "You type the same correction or clarification into chat that you typed last session"
- "A new teammate would need the same context to be productive"

**Prune** (best practices): "Treat CLAUDE.md like code: review it when things go wrong, prune it regularly, and test changes by observing whether Claude's behavior actually shifts." Test each line: "Would removing this cause Claude to make mistakes? If not, cut it." Leave out "Information that changes frequently". Check it into git "so your team can contribute".

**Review for conflicts** across CLAUDE.md, nested files and `.claude/rules/` "periodically" (memory page), now automated by `/doctor prompt-audit` (MEM-021).

**Don't fold every session's learnings in:** Anthropic changed its own `/verify` skill (v2.1.205) to edit the recorded file "only when it steered a run wrong", because folding in "anything a run learned… caused frequent merge conflicts".

**Revisit after major model releases** (large-codebases page): "instructions that worked around an older model's limitation may become overhead once a newer model handles the case on its own". `/doctor prompt-audit` looks for exactly these.

## [MEM-024] Community practice for keeping instruction files current
- Type: comparison
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: [Evaluating AGENTS.md, arXiv 2602.11988](https://arxiv.org/abs/2602.11988), [Self-improving CLAUDE.md hook (claudefa.st)](https://claudefa.st/blog/tools/hooks/self-improving-claude-md), [ctxharness](https://github.com/FlorianBruniaux/ctxharness), [Auditing Claude Code auto memory (aident.ai)](https://aident.ai/blog/audit-claude-code-auto-memory)
- Related: MEM-021, MEM-022, MEM-023, HOOK-031

Approaches in use, roughly from cheapest to dearest:

| Approach | What it catches | Notes |
|---|---|---|
| Deterministic drift check in CI or a hook: do the paths and scripts CLAUDE.md names exist? | Renamed files, removed npm scripts | ctxharness and similar linters exist but are low-popularity; a 20-line script does the same |
| End-of-session "revise" command, approval required | Missing gotchas | `/revise-claude-md` (MEM-022); Cline's "update memory bank" is the same ritual |
| Stop hook that runs `claude -p` on the diff and writes proposed CLAUDE.md edits to a review file | Drift as it happens | Costs a model call per stop; keep it non-blocking (HOOK-031) |
| Periodic memory audit: back up, `wc` the index, trace each fact to a canonical source | Duplicates, rot | Vendor blog; manual |
| Docs-drift routine on a schedule | Stale docs in general | We run one (SKILL-060) |

The measured caution: context files help mainly for "non-standard coding practices"; generated overviews add cost without success (MEM-033). So prune toward gotchas and commands, not toward completeness.

Common thread worth adopting: proposals, not silent edits, and a check that every named path and command still exists.

## [MEM-025] Memory ideas from other coding tools
- Type: comparison
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-12
- Sources: [GitHub Copilot memory](https://docs.github.com/en/copilot/concepts/agents/copilot-memory), [Codex memories](https://learn.chatgpt.com/docs/customization/memories.md?surface=app), [Cline Memory Bank](https://docs.cline.bot/features/memory-bank), [Cursor forum: memories gone in 2.1](https://forum.cursor.com/t/custom-modes-and-memories-gone-in-2-1/143744)
- Related: MEM-018, MEM-017, REPO-045, HOOK-034

| Tool | Memory design | Idea worth taking |
|---|---|---|
| GitHub Copilot | Repository facts with citations; "Before using a repository fact, Copilot checks its citations against the current branch… Only validated facts are used"; unused facts "automatically deleted after 28 days" | Cite the file a memory is about, and expire unused memories |
| OpenAI Codex | Local memories "off by default", in `~/.codex/memories/`; "Put required team rules in AGENTS.md or checked-in docs… a helpful recall layer, not as the only source for rules that must always apply" | Memory is provisional; rules live in checked-in files |
| Cline Memory Bank | A convention, not a feature: `projectbrief.md`, `activeContext.md`, `progress.md` and others, refreshed on "update memory bank" | Separate fast-changing state from stable context |
| Cursor | Memories UI dropped in 2.1.x; staff suggest exporting them to `.mdc` rules | Opaque auto-memories lost out to reviewable rules in the repo |
| Windsurf | Machine-local, opaque memories (secondary sources only) | None |

Claude Code already has the Codex split (MEM-017) and a `modified` timestamp. It lacks Copilot's citation check and expiry; the binary's staleness prompt asks Claude to verify, but nothing enforces it (MEM-018).

## [MEM-026] What each surface loads
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Cloud environments: what carries over](https://code.claude.com/docs/en/cloud-environments), [Desktop](https://code.claude.com/docs/en/desktop), [Desktop WSL](https://code.claude.com/docs/en/desktop-wsl), [Routines](https://code.claude.com/docs/en/routines), [GitHub Actions](https://code.claude.com/docs/en/github-actions), [Headless](https://code.claude.com/docs/en/headless), [Memory](https://code.claude.com/docs/en/memory)
- Related: MEM-027, MEM-028, ORCH-016, SKILL-060, MEM-029

| Surface | Repo CLAUDE.md, rules | `~/.claude/CLAUDE.md` | Auto memory |
|---|---|---|---|
| Terminal, desktop Code tab | Yes | Yes ("Desktop and CLI read the same configuration files") | Yes, shared |
| Desktop with WSL | Yes | The distro's (process "execute[s] inside the distribution"; not stated outright) | The distro's `~/.claude/projects/` |
| `claude -p` | Yes, "the same context an interactive session would" | Yes | Yes, and it writes (MEM-013); not with `--bare` |
| Cloud session | Yes, "Part of the clone" | "No… Lives on your machine" | Not documented; local files are "not shared across machines or cloud environments" |
| Routine | Clone of the repo, as cloud sessions | No | Not documented |
| `claude-code-action` | Root CLAUDE.md: "Claude reads it on every run" | Runner's home only | Not documented |
| Self-hosted environment | Yes | Per runner | Off by default |

Workarounds for cloud and routines: a setup script that writes `~/.claude/CLAUDE.md` (check `/context` for `/root/.claude/CLAUDE.md`), or commit the rule to the repo. Cloud Projects have their own memory (MEM-029).

Consequence: any rule a cloud run, routine or CI job must follow belongs in the repo's CLAUDE.md, a committed skill, or the routine's prompt, never only in `~/.claude/CLAUDE.md` or auto memory.

## [MEM-027] Worktrees and instruction files
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Worktrees](https://code.claude.com/docs/en/worktrees), [Memory: storage location](https://code.claude.com/docs/en/memory), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: SESS-004, SESS-009, MEM-006, ORCH-009

What git and `~/.claude` share across worktrees is in SESS-001, SESS-004 and SESS-009. For instructions and memory:

- **Auto memory:** one directory per repo, "derived from the git repository, so all worktrees and subdirectories within the same repo share one auto memory directory" (v2.1.63+). No documented write locking (SESS-009). Observed 2026-10-12: about 195 worktree project folders under `~/.claude/projects/` and none has its own `memory/`; all memory sits under the main repo's folder.
- **CLAUDE.md and rules:** each worktree loads its own branch's files, also in desktop worktree sessions, where settings, hooks, skills and agents come from the main checkout instead (SKILL-053).
- **Subagent in its own worktree:** "takes the instruction files it starts with from your main conversation, not from its worktree" (a double load was fixed in v2.1.286).
- **`CLAUDE.local.md`:** gitignored, so only in the worktree where you made it (MEM-006).

Consequence: an edit to CLAUDE.md on a branch affects only sessions on that branch until it merges, while a memory saved in any worktree reaches every session on the repo at its next start. Parallel sessions can also overwrite each other's MEMORY.md index lines; nothing merges them.

## [MEM-028] Agent SDK and `claude -p`: setting sources and memory
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Agent SDK: Claude Code features](https://code.claude.com/docs/en/agent-sdk/claude-code-features), [Agent SDK: modifying system prompts](https://code.claude.com/docs/en/agent-sdk/modifying-system-prompts), [Headless](https://code.claude.com/docs/en/headless)
- Related: ORCH-014, ORCH-015, MEM-009, MEM-016

**`claude -p`** loads what an interactive session loads. `--bare` skips CLAUDE.md, auto memory, hooks, skills, plugins and MCP, and is "the recommended mode for scripted and SDK calls"; it needs `ANTHROPIC_API_KEY` because it doesn't use the subscription login. Pass context with `--append-system-prompt` or `--add-dir` instead.

**Agent SDK:**
- "When you omit `settingSources`, `query()` reads the same filesystem settings as the Claude Code CLI: user, project, and local settings, CLAUDE.md files". Omitting it equals `["user", "project", "local"]`; `[]` turns them off. Python: `setting_sources`.
- `user` brings `~/.claude/CLAUDE.md` and `~/.claude/rules/`; `project` the CLAUDE.md and rules of the cwd and its parents; `local` CLAUDE.local.md.
- "CLAUDE.md loading is controlled by setting sources, not by the `claude_code` preset."
- **Not controlled by `settingSources`:** managed policy, `~/.claude.json` and auto memory. The agent writes memories "with the standard `Write` and `Edit` tools rather than a dedicated memory tool". The docs warn: "Do not rely on default `query()` options for multi-tenant isolation"; use `settingSources: []` plus `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.
- `AgentDefinition.memory` takes `user`, `project` or `local`, like agent frontmatter.

For our scripted runs: a `claude -p` probe in a scratch folder creates a new `~/.claude/projects/<folder>/memory/` (20 empty ones from earlier probes, MEM-034) and can save memories there.

## [MEM-029] Cloud Projects memory is a separate store
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Projects](https://code.claude.com/docs/en/claude-projects), [Claude chat search and memory](https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context)
- Related: MEM-026, ORCH-001, MEM-031

Projects (public beta on Pro and Max) run threads as cloud sessions that share "repositories, instructions, and memory".

- **Project memory:** "Notes Claude keeps about the project, such as requirements, decisions, and pitfalls, stored as files. Every cloud thread reads the index file `MEMORY.md` when it starts and opens the other files when it needs them." It is "separate from the auto memory Claude Code keeps on your machine, even though both use a `MEMORY.md` index", and separate from the repos' CLAUDE.md files.
- **Project instructions:** sent to each new thread, "up to 16,000 characters".
- **A thread run on your own computer** "Starts with the project's instructions, but not with its memory files loaded".
- The docs' split: "put instructions about a repository in its `CLAUDE.md` and notes about the project in project memory."

claude.ai chat memory is a third system: "Claude saves memory as a set of individual topics as you chat", with a separate space per claude.ai project. No source says Claude Code reads it (unverified).

## [MEM-030] The API memory tool
- Type: tool
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool), [Tool reference](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-reference), [Context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing), [Memory cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/tool_use/memory_cookbook.ipynb), [Managing context on the Claude Developer Platform](https://www.anthropic.com/news/context-management)
- Related: TOK-038, MEM-031, MEM-019, ORCH-036

Detail beyond TOK-038:
- **Declaration:** `{"type": "memory_20250818", "name": "memory"}`; "available on all Claude 4 and later models". The tool-reference table lists no beta header for it; the SDK helpers still sit in the beta namespace. Context editing still needs `context-management-2025-06-27`.
- **Client-side:** "Claude requests file operations, and your application executes them." Commands: `view`, `create`, `str_replace`, `insert`, `delete`, `rename`, all under a `/memories` prefix your handler maps to storage.
- **Auto-injected prompt:** the API adds "IMPORTANT: ALWAYS VIEW YOUR MEMORY DIRECTORY BEFORE DOING ANYTHING ELSE." plus a protocol to record progress because "Your context window might be reset at any moment". Nothing from the files is preloaded; the model must `view` first.
- **Your job:** validate every path ("`/memories/../../secrets.env`"; use `resolve()` and `relative_to()`), cap file size and `view` output, expire old files, and strip sensitive data.
- **Helpers:** Python `BetaAbstractMemoryTool` and `BetaLocalFilesystemMemoryTool`, TypeScript `betaMemoryTool`, C#, Java; none for Go or Ruby.
- **Pairing:** with context editing, Claude gets a warning near the clearing threshold so it can save to memory first. Anthropic's internal eval: memory plus context editing +39%, context editing alone +29%, 84% fewer tokens over 100 turns (vendor figure, method unpublished).
- **Cookbook advice:** "Start with a single memory file for patterns", "Store task-relevant patterns, not conversation history", don't "Let memory grow unbounded".

## [MEM-031] API memory tool, Managed Agents memory stores and auto memory compared
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool), [Managed Agents memory](https://platform.claude.com/docs/en/managed-agents/memory), [Memory (Claude Code)](https://code.claude.com/docs/en/memory)
- Related: MEM-030, MEM-014, TOK-038, ORCH-018

All three are a directory of plain files the model reads and writes with file operations; they differ in who hosts it and what loads at start.

| | API memory tool | Managed Agents memory store | Claude Code auto memory |
|---|---|---|---|
| Storage | Wherever your handler maps `/memories` | Workspace-scoped, mounted at `/mnt/memory/<slug>/` | `~/.claude/projects/<project>/memory/`, machine-local |
| Interface | Dedicated `memory_20250818` tool | The session's normal file tools; a note per mount in the system prompt | Normal Read, Write, Edit |
| Loaded at start | Nothing; injected prompt says view first | Mount note only | MEMORY.md, 200 lines or 25KB |
| Limits | Yours to set | 100 kB per memory, 10,000 per store, 8 stores per session | Index limits only |
| Access control | Yours | `read_write` or `read_only`, enforced | None |
| History | Yours | Immutable versions, redact | None |
| Consolidation | None | "Dreams" (research preview) | None |
| Beta header | None | `agent-memory-2026-07-22` (not combined with `managed-agents-2026-04-01` on store calls) | n/a |

Choosing: inside Claude Code, use auto memory and CLAUDE.md, as there is no way to attach the API tool. In your own API agent, use the memory tool for single-user state and context resets. For team-shared, audited memory, use Managed Agents stores.

## [MEM-032] Community memory servers and plugins
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-12
- Sources: [MCP memory server](https://github.com/modelcontextprotocol/servers/tree/main/src/memory), [mem0](https://github.com/mem0ai/mem0), [claude-mem](https://github.com/thedotmack/claude-mem), [basic-memory](https://github.com/basicmachines-co/basic-memory), [Serena](https://github.com/oraios/serena), [claude-subconscious](https://github.com/letta-ai/claude-subconscious), [Graphiti MCP](https://github.com/getzep/graphiti/tree/main/mcp_server), [MCP tool search](https://code.claude.com/docs/en/mcp)
- Related: MEM-033, TOK-020, TOK-084, HOOK-015

Stars and activity from the GitHub API, 2026-10-12. Each project describes itself; none was installed.

| Project | Stars | Storage | How it reaches Claude Code |
|---|---|---|---|
| claude-mem | ~100k | SQLite + Chroma behind a local worker | Hooks on SessionStart, UserPromptSubmit, PostToolUse, Stop; an injected index each session; MCP search tools; a background "observer" model call |
| mem0 / OpenMemory | ~67k | Extracted facts in a vector store | SDK, API or MCP |
| MCP reference `memory` | monorepo | Knowledge graph in a JSONL file | Nine MCP tools, nothing automatic; aimed at chat personalization |
| Serena | ~30k | Memory files beside a code-intelligence server | MCP; "can easily be disabled" |
| Graphiti (Zep) | ~32k | Temporal graph in FalkorDB or Neo4j via Docker | MCP |
| basic-memory | ~4k, AGPL | Markdown files plus a SQLite index | MCP |
| claude-subconscious (Letta) | ~3k | A Letta agent reading transcripts | Hooks "whisper" guidance; "not intended to be used in production" |

Also seen: agentmemory, supermemory, cognee, mcp-memory-service; cipher (byterover) is archived.

**Cost in Claude Code:** MCP tool schemas are deferred by default (TOK-020). The real costs are hook-injected text, background model calls on your plan, extra round trips, and hook reliability (claude-mem issues report silent failures when its worker is down).

## [MEM-033] Do memory servers beat plain files?
- Type: recommendation
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-12
- Sources: [Letta: is a filesystem all you need?](https://www.letta.com/blog/benchmarking-ai-agent-memory), [Evaluating AGENTS.md, arXiv 2602.11988](https://arxiv.org/abs/2602.11988), [mem0 README benchmarks](https://github.com/mem0ai/mem0), [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Related: MEM-032, REPO-045, MEM-034, TOK-008

No controlled study shows a memory server beating CLAUDE.md plus auto memory on coding tasks. The evidence that exists:

- **Vendor chat-recall benchmarks:** mem0 reports LoCoMo 92.5 and LongMemEval 94.4 for its managed platform ("proprietary optimizations not available in the open-source SDK"). These measure recall of conversation facts, not coding success.
- **Files as a baseline:** Letta got 74.0% on LoCoMo "by simply storing conversation histories in files", above mem0's then-reported 68.5%, and concluded memory "is more about how agents manage context than the exact retrieval mechanism used". Vendor post, older mem0 version.
- **More context isn't free:** context files "do not generally improve task success rates, while increasing inference cost by over 20% on average" (Gloaguen et al., ICLR 2026; static files, not servers).
- **Anthropic:** structured note-taking "provides persistent memory with minimal overhead"; "do the simplest thing that works".
- **Ours:** claude-mem, measured over 104 sessions (2026-10-06 to 2026-10-09), added about 4k tokens to every model call, made about 7.5k Haiku observer calls on the plan (42% no-ops), and its memory was searched in 2 sessions. It was removed (MEM-034). The command that produced these numbers wasn't kept.

**Recommendation:** stay on plain files for one developer. A server earns its place only for memory shared across different agents or clients, a corpus far beyond an index plus topic files, or team memory needing access control (Managed Agents stores, MEM-031). *Inference, not a sourced threshold.*

## [MEM-034] Our instruction files and memory, measured
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-12
- Sources: local files and transcripts read 2026-10-12; [osrs-tracker-web CLAUDE.md](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/CLAUDE.md), [osrs-tracker-api CLAUDE.md](https://github.com/osrs-tracker/osrs-tracker-api/blob/main/CLAUDE.md), [osrs-tracker-aws CLAUDE.md](https://github.com/osrs-tracker/osrs-tracker-aws/blob/main/CLAUDE.md)
- Related: MEM-035, SESS-035, HOOK-036, REPO-001, TOK-003

**Instruction files** (GitHub `main`, 2026-10-12): `~/.claude/CLAUDE.md` 78 lines (4.7 KB); osrs-tracker-web 52 lines, -api 55, -aws 63 (4.1–4.8 KB each). All well under 200 lines. Each repo CLAUDE.md holds commands, hard rules and where things live, and points to its repo skill for detail, which is the split REPO-044 recommends. None of the three repos, nor `~/.claude`, uses `.claude/rules/`, `CLAUDE.local.md` or AGENTS.md. The local osrs-tracker-aws checkout's CLAUDE.md differed from `main` (not pulled).

**Settings:** no auto-memory keys, so auto memory is on everywhere; `claude-md-management` is enabled at user level.

**Auto memory** (`~/.claude/projects/*/memory/`): osrs-tracker-web 25 topic files (index 25 lines, 3.9 KB, far below 200 lines/25 KB); osrs-tracker-aws 3; -api 1; home-cluster 2; solix 2; claude-kb and claude-skills none. Of 33 topic files: 17 `feedback`, 10 `project`, 5 `reference`, 1 `user`; 29 carry `modified`. 20 empty memory folders belong to `claude -p` probe directories.

**Use** (main-session transcripts, worktree folders counted with their repo, 2026-10-06 to 2026-10-12; counted Read, Bash reads and Write/Edit tool calls on paths under `~/.claude/projects/*/memory/`):

| Repo | Sessions | Opened a memory file | Wrote one |
|---|---|---|---|
| osrs-tracker-web | 125 | 33 | 26 |
| osrs-tracker-api | 59 | 2 | 1 |
| osrs-tracker-aws | 36 | 1 | 3 |
| claude-kb | 25 | 1 | 0 |
| home-cluster | 10 | 2 | 2 |

Memory matters in osrs-tracker-web (a quarter of sessions recall a topic, a fifth write one) and barely elsewhere.

## [MEM-035] Our auto memory: misplaced and stale entries
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-12
- Sources: synthesis of MEM-017, MEM-018, MEM-026, MEM-034; local memory files read 2026-10-12; [osrs-tracker-web](https://github.com/osrs-tracker/osrs-tracker-web)
- Related: MEM-017, MEM-018, MEM-034, REPO-044

Each memory checked against where MEM-017 says it belongs. Keyword checks against the osrs-tracker-web skill and `docs/decisions.md` were greps, not full reads.

| Group | Examples (topic file names) | Verdict |
|---|---|---|
| Design conventions already in the repo skill or decisions doc | `tabular-nums-values-only`, `semantic-colour-tokens`, `change-pill-colours`, `phone-news-grid`, `close-playwright-after-checks`, `no-visible-seo-filler`; partly `spacing-scale`, `visual-system-decisions` | Duplicates that can drift; delete the memory once the skill has the full rule |
| Deliberate trade-offs found only in memory | `first-appearance-gains-accepted`, `browse-page-tbt-accepted`, `tracker-landing-three-cards` | Move to `docs/decisions.md`, where reviewer agents and cloud runs see them |
| Release and workflow procedure | `review-before-docker-build`, `release-commands-unchained` | Belongs in the skill's release steps |
| Cross-repo preferences saved in one repo | `assign-issue-when-starting`, `guard-issue-body-writes`, `testing-new-agents` (web); `no-speculative-safeguards` (aws); `fable-only-for-hard-work`, `subagent-handoff-before-resume` (solix) | Never load in the other repos; move to `~/.claude/CLAUDE.md` or a user rule |
| Machine-level facts in one repo | `claude-mem-removed`, `plugins-local-not-synced`, `infra-mcps-setup` (web); `synced-skills-location` (home-cluster) | Move to a user-level note or this knowledge base; re-check the plugin and skill ones against SKILL-050 and SKILL-059 |
| Finished work | `redesign-migration` ("done 2026-10-07") | Delete |
| Fits auto memory | `osrs-tracker-design-canvas`, `search-console-pagespeed-access` (paths to credential files, no secrets seen), `mongo-hosting-decision`, `compact-hiscore-storage`, `measure-spacing-complaints`, `lighthouse-wsl-temp-dir`, `preconnect-measure-plain-chrome` | Keep; the decision records could also go to the repo docs |

Only 5 of osrs-tracker-web's 25 memories clearly fit where they are; the rest are rules other sessions, reviewers or repos also need.

## Recommendations for our setup

Ranked by impact against effort. This session changed none of the files below: `~/.claude/` is yours to edit, and the osrs-tracker changes need issues in those repos (listed, not opened).

1. **Move cross-repo preferences out of per-repo memory into `~/.claude/CLAUDE.md`** (done 2026-10-12, FreekMencke/claude-kb#48, plus `prefer-vitest` from aws) (or a `~/.claude/rules/` file): assign the issue before starting, check a fetched issue body before PATCHing it, no speculative safeguards, Fable only for hard work, hand off before resuming a large subagent. Today each loads in one repo only. A few lines, high impact. MEM-035, MEM-017.
2. **Sort osrs-tracker-web's memories** into the repo: deliberate trade-offs to `docs/decisions.md`, release rules to the skill, then delete the duplicates and `redesign-migration`. The reviewer agents and any cloud run see repo files, not your memory. Needs an issue in osrs-tracker/osrs-tracker-web. MEM-035, MEM-017, REPO-044.
3. **Add one hygiene line to `~/.claude/CLAUDE.md`** (done 2026-10-12, FreekMencke/claude-kb#47), e.g. "Save a preference that holds in every repo to `~/.claude/CLAUDE.md`, not auto memory; when a memory duplicates CLAUDE.md or a skill, or its work is done, delete it." Auto memory's own rule ("skips anything your CLAUDE.md files already say") isn't holding in our files. MEM-018, MEM-035.
4. **Run `/doctor prompt-audit` once per instruction set** for stale paths, stale commands and contradictions (`kb-prompting.md` recommendation 1 covers the wording side). MEM-021, PROMPT-017. Done for `~/.claude` 2026-10-12 (FreekMencke/claude-kb#47): no stale paths, stale commands or contradictions.
5. **End sessions that hit a gotcha with `/claude-md-management:revise-claude-md`** (already installed) instead of letting the fix sit in memory; use `/doctor` rather than the improver's rubric to decide what to cut. MEM-022, MEM-023.
6. **Rules that routines or cloud sessions need go in the repo or the routine's prompt.** Our global rules (cross-repo issues, rebase before merge, attribution) don't reach the monthly re-verification routine; it relies on this repo's CLAUDE.md, which is the right place. Check any new routine against this. MEM-026.
7. **Move machine-level notes** (done 2026-10-12, FreekMencke/claude-kb#48: a "This machine" section in `~/.claude/CLAUDE.md`; `synced-skills-location` and the skills half of `plugins-local-not-synced` were stale, since own skills are now symlinks from `~/repos/claude-skills`; `infra-mcps-setup` deleted, INFRA-024 holds it) (`claude-mem-removed`, `plugins-local-not-synced`, `synced-skills-location`) out of repo memory, after re-checking the plugin and skill ones against SKILL-050 and SKILL-059. Low effort. MEM-035.
8. **Keep plain files; don't add a memory server.** claude-mem was measured net-negative and removed; nothing published shows a server beating files for coding. Done; recorded so nobody reinstalls one. MEM-033.
9. **Won't do now: `.claude/rules/` with `paths:`.** Our CLAUDE.md files are 52–78 lines and detail already lives in repo skills; revisit when a file passes about 150 lines. MEM-004, TOK-003.
10. **Probe hygiene:** for memory probes, point `autoMemoryDirectory` at the scratchpad with `--settings` (MEM-016), so `~/.claude/projects/` gets no test memories. Done in this session.

Other repos' issues this needs: osrs-tracker/osrs-tracker-web (recommendation 2). Recommendations 1, 3 and 7 are edits to `~/.claude`, which only you make.

## Open questions

1. **Do non-fork subagents get the main auto memory?** The docs say no; one `claude -p` probe on v2.1.296 showed a general-purpose subagent with an `AutoMem` attachment, while Explore had none. Re-test in an interactive terminal session and with a custom agent. MEM-011.
2. **Where MEMORY.md is delivered.** The Agent SDK page says the system prompt; Cisco reports it left the system prompt in v2.1.50, and our transcript shows a user-role attachment. Whether the transcript reflects the API request exactly is untested. MEM-010.
3. **Auto-dream and the recall selector** are in the v2.1.296 binary but undocumented. Is consolidation on for our account, does `autoDreamEnabled` work, and does the "up to 5" selector run for every recall? MEM-014, MEM-018.
4. **Auto memory in cloud sessions, routines and `claude-code-action`.** No page says whether it is on; a cloud session would start with an empty folder anyway. Test with a routine that saves and recalls a word. MEM-026.
5. **Concurrent writes to one MEMORY.md** from parallel worktree sessions: no locking is documented, and nothing merges conflicting index edits. MEM-027, SESS-009.
6. **Desktop with WSL:** which `~/.claude` is read is implied (the distro's), not stated. MEM-026. Local tests point the same way: the app runs its CLI from the distro's `~/.claude/remote/ccd-cli/` (SURF-004) and loads personal skills from the distro's home (SKILL-048).
7. **Is the 25KB limit bytes or UTF-16 code units?** anthropics/claude-code#97453 says code units (single-source). TOK-004.
8. **The claude-mem measurement** (MEM-033) came from an earlier session whose command wasn't kept; a re-run needs a new script.
9. **Background memory extraction**: strings suggest a pass over recent turns besides Claude's own saves; when it runs, and whether in `-p`, is unknown. MEM-013.
