# Writing, testing and distributing skills

Prefix `SKILL`. Researched 2026-10-12 against Claude Code 2.1.296. Re-verified 2026-10-14; each entry's Last verified date is authoritative. SKILL-064 to SKILL-073 (finding and vetting community skills) were added 2026-10-23 (FreekMencke/claude-kb#256) from the Claude Code docs, vercel-labs/skills at commit a80e4c9 (skills@1.7.4), the lists' and directories' own pages and the GitHub API, read by an Opus 5.5 lead and two Sonnet 5.5 readers. "Local CLI" means `--help` output or a command run on Claude Code 2.1.296 on that date.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What does Claude see of a skill before using it? | Only `name` + `description` (≈100 tokens each) in the skill listing; the body loads when the skill is invoked, bundled files only when read. | SKILL-004 |
| How long may a description be? | 1,024 chars on claude.ai, the API and the open spec. Claude Code truncates `description` + `when_to_use` at 1,536 chars in its listing. | SKILL-003, TOK-005 |
| What goes in a description, and why doesn't my skill trigger? | What it does + when to use it, third person, the words users type, and a "not for X" line for neighbouring skills; don't summarise a multi-step workflow. It fails to trigger with a vague description, no user-vocabulary keywords, a listing-budget overflow, broken YAML, or a task too simple to need a skill. | SKILL-011 to SKILL-013, SKILL-015, TOK-005 |
| How big may SKILL.md be? | Under 500 lines / ~5k tokens; push detail into one-level-deep reference files and scripts. | SKILL-016, SKILL-017 |
| Skill, CLAUDE.md, hook, subagent or MCP? | CLAUDE.md = always-true facts; skill = on-demand procedure; hook = must-happen guarantee; subagent = isolated side task; MCP = access to external systems. | SKILL-021, SKILL-023 |
| How do I test a skill? | Triggering: `claude plugin eval` with a `tool_used: Skill` grader, or skill-creator's `run_loop`; ~20 queries, half near-miss negatives, 3 runs each. Usefulness: run the same prompts with and without it in fresh sessions; compare the score delta and the token/time cost. | SKILL-025 to SKILL-028, SKILL-032 |
| Should I add a "forced skill evaluation" hook? | Not by default: no official endorsement, evidence is one author with small N, and it raises false positives. | SKILL-029 |
| How do I share skills with a team? | Commit `.claude/skills/`, or ship a plugin through a marketplace registered in `.claude/settings.json`; claude.ai org provisioning for non-CLI users. A personal Git marketplace added on claude.ai reaches chat, Cowork and local Claude Code, but not cloud sessions or routines. | SKILL-034, SKILL-038, SKILL-059, SKILL-060 |
| Why don't users get my plugin update? | A fixed `version` in `plugin.json` pins them until you bump it; auto-update is off for third-party marketplaces. | SKILL-035, SKILL-036 |
| Which frontmatter fields are portable? | `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. Everything else is Claude Code-only and rejected on claude.ai/API upload, except inside a plugin, where claude.ai accepts them. | SKILL-002, SKILL-040, SKILL-062 |
| How many skills is too many, and how do I prune? | No official number; one measurement saw a skill's invocation rate drop as the roster grew. Install few; `/skill-doctor` finds skills that cost context but are never used, `claude plugin details <name>` shows a plugin's always-on cost. | SKILL-045, TOK-005, SKILL-030 |
| Do skills and plugins load in desktop-app Code sessions, including WSL? | Local and Cloud: claude.ai skills yes, delivered by the app as a plugin. Desktop WSL: claude.ai skills and `<name>@synced` plugins no (local tests), so symlink the skills you need into the distro's `~/.claude/skills` and install plugins with the distro's CLI (`claude plugin install <plugin>@<marketplace name>`); those load although the docs say no, but the plugin UI is missing. To check, ask the model to list its skills after the first message; the `/` menu and Customize panel are unreliable. | SKILL-049, SKILL-050, SKILL-052, SKILL-054, SKILL-056, SKILL-063 |
| Where should skills live with desktop and WSL? | WSL uses the distro's Linux `~/.claude`; Windows and WSL share no skills, plugins, settings or credentials. Keep skills in a git repo on the distro filesystem, symlinked per skill into the distro's `~/.claude/skills`, plus repo `.claude/skills`. | SKILL-051, SKILL-056 |
| Where do I find community skills, which collections are worth studying, and what do installs and stars prove? | Worth studying: anthropics/skills (skill-creator, docx/pdf), obra/superpowers (testing discipline), plugin-dev, trailofbits/skills. Only Anthropic's directory has human review (and `claude-community` is SHA-pinned); skills.sh runs automated partner audits. The awesome-claude-skills lists and skillselion are for discovery only. A skills.sh install count is deduplicated `npx skills add` telemetry, not quality, and partner audit badges often disagree. | SKILL-042 to SKILL-044, SKILL-064, SKILL-065 |
| How do I vet, pin and update a third-party skill? | Read hooks, `bin/`, scripts, network calls and telemetry, settings writes, `allowed-tools`, embedded instructions, hidden Unicode (it reaches the model; grep given) and the licence. Pin a full commit and diff before you move it; a pin doesn't cover a plugin's dependencies or `command` source. `skills update`/`check` reinstall with no diff, and a symlink to a clone you `git pull` changes the skill mid-session. | SKILL-069, SKILL-068, SKILL-066, SKILL-072, SKILL-073 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| SKILL-001 | Skill anatomy: folder, SKILL.md, scripts, references, assets | fact | anatomy |
| SKILL-002 | Frontmatter fields: open standard vs Claude Code extensions | fact | anatomy, frontmatter, portability |
| SKILL-003 | Name and description limits per surface | fact | frontmatter, limits |
| SKILL-004 | How Claude decides to load a skill (three levels) | fact | loading, progressive-disclosure |
| SKILL-005 | Claude Code skill-listing budget and truncation (merged into TOK-005) | fact | loading, context-cost |
| SKILL-006 | A loaded skill stays in context; compaction keeps 5k tokens of it | fact | loading, compaction |
| SKILL-007 | Where Claude Code finds skills, precedence and reload | fact | anatomy, locations |
| SKILL-008 | Arguments, variables and `!` context injection | fact | anatomy, commands |
| SKILL-009 | `context: fork` and subagents that preload skills | fact | subagents |
| SKILL-010 | `allowed-tools` pre-approves; it does not restrict | anti-pattern | permissions, security |
| SKILL-011 | Descriptions: what + when, third person, user vocabulary | recommendation | description, triggering |
| SKILL-012 | Undertriggering: be a little pushy, and add negative triggers | pattern | description, triggering |
| SKILL-013 | Don't summarise a multi-step workflow in the description | pattern | description, triggering |
| SKILL-014 | Invocation controls: manual-only, hidden, path-scoped, overrides | tool | triggering, context-cost |
| SKILL-015 | Troubleshooting: not triggering, over-triggering, not followed | recommendation | triggering, debugging |
| SKILL-016 | Keep the body small: only what Claude doesn't already know | recommendation | body, size |
| SKILL-017 | Reference files: one level deep, TOC, descriptive names | pattern | progressive-disclosure |
| SKILL-018 | Scripts for deterministic steps; match freedom to fragility | pattern | scripts, body |
| SKILL-019 | Durable wording: no dates, one term per idea, a default not a menu | recommendation | body, maintenance |
| SKILL-020 | Anti-pattern: capitalised MUST/NEVER instead of reasons | anti-pattern | body, style |
| SKILL-021 | Skills vs CLAUDE.md vs hooks vs subagents vs MCP vs output styles | comparison | architecture |
| SKILL-022 | Context cost of each extension type | comparison | context-cost |
| SKILL-023 | Rules that must hold every time belong in hooks | recommendation | hooks, reliability |
| SKILL-024 | CLAUDE.md under 200 lines; move procedures into skills | recommendation | claude-md, context-cost |
| SKILL-025 | Evaluation-first development and the Claude A / Claude B loop | pattern | testing |
| SKILL-026 | `claude plugin eval`: built-in with/without evaluation | tool | testing, triggering |
| SKILL-027 | skill-creator: benchmarks and description optimisation | tool | testing, triggering |
| SKILL-028 | Designing a trigger eval set | recommendation | testing, triggering |
| SKILL-029 | Community trigger-rate numbers and forced-evaluation hooks | comparison | testing, triggering, hooks |
| SKILL-030 | `/skill-doctor`, `plugin details` and telemetry for usage and cost | tool | maintenance, context-cost |
| SKILL-031 | Anti-patterns in skill testing | anti-pattern | testing |
| SKILL-032 | Retire skills the model has outgrown | recommendation | maintenance, testing |
| SKILL-033 | Plugin layout for shipping skills | fact | distribution, plugins |
| SKILL-034 | Marketplaces and team rollout | fact | distribution, plugins |
| SKILL-035 | Plugin versioning: a fixed `version` pins users | anti-pattern | distribution, versioning |
| SKILL-036 | Auto-update, pinning and release channels | fact | distribution, versioning |
| SKILL-037 | Validate before publishing: `plugin validate --strict`, `plugin tag` | tool | distribution, ci |
| SKILL-038 | claude.ai skills: upload, sharing, org provisioning, sync into Claude Code | fact | distribution, claude.ai |
| SKILL-039 | Skills in the Claude API | fact | distribution, api |
| SKILL-040 | The Agent Skills open standard and portability | fact | portability |
| SKILL-041 | Security review of third-party skills and plugins | recommendation | security |
| SKILL-042 | anthropics/skills and claude-plugins-official | fact | collections |
| SKILL-043 | obra/superpowers: test-driven skill writing | pattern | collections, testing |
| SKILL-044 | Other strong collections: plugin-dev, Trail of Bits, wshobson, Vercel | comparison | collections |
| SKILL-045 | Anti-pattern: installing collections wholesale | anti-pattern | collections, context-cost |
| SKILL-046 | Ideas from other AI coding tools | comparison | portability, triggering |
| SKILL-047 | How the desktop app's Code tab runs Claude Code | fact | desktop, wsl, versions |
| SKILL-048 | Which skill sources each session type loads | comparison | desktop, wsl, cloud, loading |
| SKILL-049 | claude.ai account skills reach sessions in two different ways | fact | desktop, claude.ai, sync |
| SKILL-050 | Desktop WSL sessions don't load claude.ai account skills | fact | desktop, wsl, sync |
| SKILL-051 | Windows and WSL keep separate `~/.claude` homes | fact | wsl, locations |
| SKILL-052 | Plugins in desktop WSL sessions: docs say no, distro-enabled plugins load | comparison | desktop, wsl, plugins |
| SKILL-053 | Desktop worktree sessions read project skills from the main checkout | fact | desktop, worktrees |
| SKILL-054 | Checking which skills a desktop session actually has | recommendation | desktop, debugging |
| SKILL-055 | Writing skills on WSL: Linux filesystem, LF endings, exec bits | recommendation | wsl, authoring |
| SKILL-056 | Setup for someone using both the desktop app and WSL | recommendation | desktop, wsl, distribution |
| SKILL-057 | Skill features that behave differently in the desktop app | fact | desktop, permissions |
| SKILL-058 | Controlling claude.ai account skills on the desktop | fact | desktop, claude.ai, context-cost |
| SKILL-059 | Personal Git marketplaces on claude.ai, synced into Claude Code | fact | distribution, claude.ai, plugins |
| SKILL-060 | Cloud sessions and routines don't load claude.ai marketplace plugins | fact | cloud, routines, plugins |
| SKILL-061 | Literal `$` in a skill body: substitution and the backslash escape | fact | anatomy, commands |
| SKILL-062 | Plugins on claude.ai: Claude Code frontmatter, custom skill paths, inline servers, names and versions | fact | distribution, claude.ai, plugins, frontmatter |
| SKILL-063 | Desktop WSL: synced plugins didn't load, a CLI install from the marketplace did | fact | desktop, wsl, plugins, sync |
| SKILL-064 | Where to find community skills, and what each source reviews | comparison | discovery, security, awesome-lists, skills-sh, marketplaces |
| SKILL-065 | Install counts and stars: what they measure | fact | discovery, install-counts, skills-sh, audits |
| SKILL-066 | `npx skills`: where it installs, its lock files, and `update` | tool | npx-skills, lock-file, pinning, update |
| SKILL-067 | `npx skills`: telemetry, the advisory audit and agent mode | fact | npx-skills, telemetry, security, audits |
| SKILL-068 | Pinning and updating a community skill | recommendation | pinning, update, symlink, supply-chain |
| SKILL-069 | Vetting checklist for a community skill or plugin | recommendation | security, supply-chain, vetting, hidden-unicode |
| SKILL-070 | Anti-pattern: skill text fetched from a server at run time | anti-pattern | security, prompt-injection, mcp, load-skill |
| SKILL-071 | What vetting catches in small animation and scroll kits | fact | security, vetting, examples, animation |
| SKILL-072 | What a plugin pin doesn't cover: dependencies and `command` sources | fact | pinning, dependencies, command-source, supply-chain |
| SKILL-073 | Hidden Unicode in a skill body reaches the model | fact | security, hidden-unicode, prompt-injection |

---

## Anatomy and loading

## [SKILL-001] Skill anatomy: folder, SKILL.md, scripts, references, assets
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Agent Skills specification](https://agentskills.io/specification), [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview), [Claude Code skills](https://code.claude.com/docs/en/skills)
- Related: SKILL-002, SKILL-004, SKILL-017

A skill is a folder whose `SKILL.md` holds YAML frontmatter and Markdown instructions. Optional subfolders are `scripts/` (code Claude runs), `references/` (docs Claude reads when needed) and `assets/` (templates, images, data).

```
my-skill/
├── SKILL.md          # frontmatter + instructions (required)
├── references/api.md # read on demand
├── scripts/check.py  # executed; only its output enters context
└── assets/template.docx
```

- Frontmatter must start on line 1. In Claude Code, broken YAML still loads the body but with empty metadata, so `/name` works and automatic matching silently doesn't. `--debug` shows the parse error.
- Bundled files cost nothing until Claude reads or runs them, so large references and datasets are fine to include.
- Claude Code 2.1.290 finds a skill by the `name` in SKILL.md even when the folder name differs. The open spec and claude.ai uploads still require them to match, so keep them equal.

## [SKILL-002] Frontmatter fields: open standard vs Claude Code extensions
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Agent Skills specification](https://agentskills.io/specification), [Claude Code skills](https://code.claude.com/docs/en/skills), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: SKILL-003, SKILL-014, SKILL-040

Fields from the open standard work everywhere. Claude Code adds many more, which claude.ai, the API and `package_skill.py` reject with a hard error. A skill inside a plugin uploaded to claude.ai keeps them (SKILL-062).

| Field | Where | Effect |
|---|---|---|
| `name`, `description` | all | Identity and trigger text (required by the spec) |
| `license`, `compatibility` (≤500 chars), `metadata` (string map) | all | Informational; no effect in Claude Code |
| `allowed-tools` | all (experimental in the spec) | Pre-approves tools; see SKILL-010 |
| `when_to_use` | Claude Code | Extra trigger text, counted in the same 1,536-char cap |
| `disable-model-invocation`, `user-invocable`, `paths` | Claude Code | Invocation control; see SKILL-014 |
| `argument-hint`, `arguments` | Claude Code | `/` autocomplete hint; named `$args` |
| `model`, `effort` | Claude Code | Model and effort for the invoking turn only |
| `context: fork`, `agent`, `background` | Claude Code | Run as a subagent; see SKILL-009 |
| `hooks`, `disallowed-tools`, `shell` | Claude Code | Session hooks from invocation on; remove tools; `bash` or `powershell` for `!` injection |

- Claude Code silently ignores unknown fields. A top-level `version` is not a documented field; put it under `metadata`.
- Booleans accept `true/false`, `yes/no`, `on/off` and `1/0` (v2.1.218+).

## [SKILL-003] Name and description limits per surface
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview), [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Agent Skills specification](https://agentskills.io/specification), [Claude Code skills](https://code.claude.com/docs/en/skills)
- Related: SKILL-002, TOK-005

The limits differ by surface, so write to the strictest: a name of up to 64 characters and a description of up to 1,024.

| Limit | claude.ai / API | Open spec | Claude Code |
|---|---|---|---|
| `name` | ≤64 chars; lowercase letters, digits and hyphens; no XML tags; must not contain "anthropic" or "claude" | ≤64; no leading, trailing or double hyphen; must match the folder | Defaults to the folder name; names over 256 chars are ignored, and since v2.1.299 so are names with hidden or direction-changing characters, `<` or `>` |
| `description` | 1–1,024 chars, no XML tags | 1–1,024 | Listing truncates `description` + `when_to_use` at 1,536 chars (`skillListingMaxDescChars`) |

History: Claude Code's per-entry listing cap was 250 characters at v2.1.86 and became 1,536 at v2.1.105. Community posts quoting "250 characters" are out of date.

## [SKILL-004] How Claude decides to load a skill (three levels)
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview), [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), [Claude Code skills](https://code.claude.com/docs/en/skills), [skill-creator SKILL.md](https://github.com/anthropics/skills/tree/main/skills/skill-creator)
- Related: TOK-005, SKILL-011, SKILL-017

Skills load progressively, in three levels. Claude chooses a skill from its description alone.

1. **Metadata** (always loaded): the name and description of every skill, about 100 tokens each, sit in the system prompt.
2. **Body** (when triggered): in Claude Code, Claude calls the `Skill` tool and the rendered SKILL.md enters the conversation. Elsewhere, Claude reads the file with bash. The guideline is under 5k tokens.
3. **Resources** (as needed): Claude reads reference files or runs scripts. A script's source never enters context, only its output.

Consequences:
- Everything about *when* to use the skill must be in the description, because the body is unseen until the skill fires.
- According to skill-creator, Claude "only consults skills for tasks it can't easily handle on its own", so a one-step request ("read this PDF") may not trigger even a well-described skill.
- In Claude Code, typing `/name` at the start of a message invokes the skill directly. Permission rules use `Skill(name)` or `Skill(name *)`.
- The API overview says you can "install many Skills without context penalty". In Claude Code every listing entry costs context on every turn (TOK-005), so trust the Claude Code docs there.

## [SKILL-005] Claude Code skill-listing budget and truncation
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code skills: "Skill descriptions are cut short"](https://code.claude.com/docs/en/skills), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: TOK-005

Merged into TOK-005 (kb-token-usage.md) on 2026-10-12. Read that entry for the listing budget, the per-entry cap, the settings that change them and the diagnostics.

## [SKILL-006] A loaded skill stays in context; compaction keeps 5k tokens of it
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code skills](https://code.claude.com/docs/en/skills)
- Related: SKILL-016, SKILL-023, SKILL-009

An invoked SKILL.md enters the conversation as one message and stays there on every later turn. It is not re-read, so "every line is a recurring token cost". Invoking an unchanged skill again only adds a short "already loaded" note. A 400-line skill invoked at turn 5 of a 200-turn session is read about 195 times.

At auto-compaction, Claude Code re-attaches the most recent invocation of each skill:
- It keeps the first 5,000 tokens of each skill.
- All skills share a 25,000-token budget, filled starting with the most recently invoked skill. Older skills can drop out.

How to write for this:
- Put the rules that matter most in the first part of the body. A long skill loses its tail after compaction.
- Write standing instructions ("run the tests after every edit") rather than one-off steps you expect Claude to re-read.
- In long sessions, invoke the skill again after a compaction if behaviour drifts. Since v2.1.299 `/reload-skills` says it re-sends the full skill list, which is how to get skills back after compaction.
- Move rarely needed detail to reference files, and run long self-contained procedures with `context: fork` (SKILL-009), so the body lives in a subagent.

## [SKILL-007] Where Claude Code finds skills, precedence and reload
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [Plugin loading](https://code.claude.com/docs/en/plugins/loading), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: SKILL-033, SKILL-038

| Scope | Location |
|---|---|
| Enterprise | `.claude/skills/` in the managed-settings directory |
| Personal | `~/.claude/skills/<name>/SKILL.md` |
| Project | `.claude/skills/<name>/SKILL.md` (committed) |
| Nested | `<subdir>/.claude/skills/`, loaded at startup when the session starts in or below `<subdir>`, otherwise once Claude touches files there (`/add-dir <subdir>` loads it sooner, v2.1.257+); invoked as `/name`, or as `/<subdir path>:name` (for example `/apps/web:deploy`) when its name clashes with another skill |
| Plugin | `<plugin>/skills/<name>/`, invoked as `/plugin:name` |
| claude.ai account | `~/.claude/skills/synced/` (one-way sync; see SKILL-038) |

- When names collide: enterprise beats personal, which beats project. A skill beats a `.claude/commands/` file with the same name. Plugin skills are namespaced and never collide.
- Edits to skill directories reload live. A newly created top-level `skills/` folder needs `/reload-skills`.
- Reserved names: `synced`, and outside a plugin `anthropic-skills` or a name starting `anthropic-skills:`. v2.1.282 also reserved `claude-ai`; v2.1.283 reverted that.
- Cloud sessions don't see personal `~/.claude/skills`.
- The cross-tool `.agents/skills/` directory isn't in the docs' list. A 2026-10-12 probe was blocked by auto mode, so whether Claude Code reads it is still untested (see Open questions).

## [SKILL-008] Arguments, variables and `!` context injection
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: SKILL-002, SKILL-018, SKILL-061

Custom slash commands were merged into skills in v2.1.3. `.claude/commands/x.md` still creates `/x`, and supports the same frontmatter except `name` and `paths`.

- **Arguments**:
  - `$ARGUMENTS` is the whole argument string.
  - `$ARGUMENTS[0]` or `$0` is a 0-based positional argument, split with shell-style quoting.
  - Literal text is substituted too when arguments are passed: `$0` in a code block or in `$0.05` becomes the first argument. Escape it as `\$0` (SKILL-061).
  - `$name` maps to the `arguments:` list.
  - If nothing consumes the arguments, `ARGUMENTS: <value>` is appended to the body.
- **Variables**:
  - `${CLAUDE_SKILL_DIR}` (use it to call bundled scripts), `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_SESSION_ID}` and `${CLAUDE_EFFORT}`.
  - In plugins also `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}`.
- **Injection**: !`git status` at line start, or a fenced block opened with ```` ```! ````, runs *before* Claude sees the skill and pastes its output in as plain text.
  - A non-zero exit aborts the invocation, except exit 1 from search and comparison commands (`grep`, `rg`, `find`, `diff`, `test`, `git diff`, `git grep`); append `|| true` for others.
  - Commands go through permission rules, so pre-approve them in `allowed-tools`.
  - Commands are subject to the 2-minute Bash timeout.
  - The `disableSkillShellExecution` setting turns injection off.
  - Skills synced from claude.ai never run `!` commands.

## [SKILL-009] `context: fork` and subagents that preload skills
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [Subagents](https://code.claude.com/docs/en/sub-agents)
- Related: SKILL-021, MCP-039

There are two ways to combine skills and subagents.

**A skill that runs as a subagent** (`context: fork`):
- The body becomes the prompt of a new subagent. `agent:` picks its type (default `general-purpose`).
- The subagent has no conversation history, so the body must be self-contained.
- Since v2.1.218 it runs in the background by default; set `background: false` to wait for its result.
- Use it only for skills with an explicit task. A guideline-only skill forked this way "returns without meaningful output".
- In the background it gets the narrower background-subagent tool set, and its edits aren't covered by `/rewind`; set `background: false` if it needs other tools.

**A subagent that preloads skills** (`skills:` in the agent's frontmatter):
- It injects the full skill content at startup, up to the first 32 distinct names.
- It controls what is preloaded, not what is accessible. The subagent can still invoke other skills through the `Skill` tool unless `Skill` is removed from its tools.
- Skills with `disable-model-invocation: true` can't be preloaded.

Use a preloading reviewer agent when a checklist must always apply to that agent. Use `context: fork` when a skill's work would flood the main context.

Tested 2026-10-15, v2.1.296, WSL terminal, Opus 5.5 main session: a forked Haiku skill gets the session's MCP tools (it loaded them with ToolSearch). Looking up the claude-kb server through the fork cost 0.24 USD per lookup plus one follow-up turn, against 0.35 USD with the main session calling the same tools itself (12 runs each, 6 questions); the fork cited the expected entries in 12 of 12 runs, direct calls in 10 of 12 ([FreekMencke/claude-kb#114](https://github.com/FreekMencke/claude-kb/issues/114)). Direct calls spent 4 Opus turns per lookup, the fork 2.


## [SKILL-010] `allowed-tools` pre-approves; it does not restrict
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: SKILL-041

A common mistake is to treat `allowed-tools` as a sandbox. In Claude Code it only *grants permission* to the listed tools for the invoking turn (the grant clears on your next message). Claude can still use any other tool, with the usual permission prompts.

- To remove tools while a skill is active, use `disallowed-tools` (v2.1.152+) or permission deny rules.
- `allowed-tools` in a repository's skills is **not** gated by workspace trust, so read it before running Claude Code in an unfamiliar repo.
- Admins can ignore project and personal `allowed-tools` with `allowManagedPermissionRulesOnly` (v2.1.282+).

---

## Writing descriptions that trigger

## [SKILL-011] Descriptions: what + when, third person, user vocabulary
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Claude Code skills](https://code.claude.com/docs/en/skills), [Rulestack: 38 runs, seven descriptions](https://dev.to/rulestack/will-claude-code-call-your-skill-on-its-own-38-runs-one-skill-seven-ways-to-describe-it-203m)
- Related: SKILL-004, SKILL-012, SKILL-013

The description decides whether the skill loads. Claude picks from "potentially 100+" skills using only this text.

- **Say what it does and when to use it.** Good: "Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction." Bad: "Helps with documents", "Processes data".
- **Third person.** The description is injected into the system prompt, and "I can help you…" or "You can use this…" "can cause discovery problems".
- **Use the words users type**: file types, tool names, verbs ("audit", "refresh", "stale").
- **Front-load the key use case.** The Claude Code listing can truncate the end.
- **Trigger information goes in the description, never only in the body.**

Evidence: in a single-author test on Claude Code 2.1.273, "Helps with git stuff." triggered 0 of 6 times. A specific description triggered 6 of 6, with 0 of 2 false triggers. Adding `when_to_use` to the vague description fixed it.

## [SKILL-012] Undertriggering: be a little pushy, and add negative triggers
- Type: pattern
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-14
- Sources: [skill-creator SKILL.md](https://github.com/anthropics/skills/tree/main/skills/skill-creator), [anthropics/skills docx skill](https://github.com/anthropics/skills/tree/main/skills/docx), [Enterprise skills guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise)
- Related: SKILL-011, SKILL-028

Anthropic's skill-creator says Claude "tends to undertrigger" skills, so descriptions should be "a little bit pushy". For example: "Make sure to use this skill whenever the user mentions dashboards, data visualization, internal metrics…".

The counterweight is a **negative trigger** for neighbouring skills. Anthropic's docx skill ends its description with "Do NOT use for PDFs, spreadsheets, Google Docs, or general coding tasks unrelated to document generation."

- Anthropic's enterprise guidance names the failure this prevents: a new skill whose description "is too broad, stealing triggers" from others. It says to test coexistence, not just the skill alone.
- Keep pushiness to *coverage* (more situations and synonyms). Capitalised commands are not the way (see SKILL-020).
- When two skills share vocabulary, give each a one-line boundary that names the other: "For benchmarked runs, use skill-creator instead."

## [SKILL-013] Don't summarise a multi-step workflow in the description
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [obra/superpowers writing-skills SKILL.md](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md)
- Related: SKILL-011, SKILL-043

The superpowers collection reports a failure mode for process skills. When the description summarises the workflow, the agent may follow the summary and never read the body.

Its evidence: the description "dispatches subagent per task with code review between tasks" led an agent to do *one* review. The skill's flowchart required two (spec compliance, then code quality). After the description was rewritten to triggers only ("Use when executing implementation plans with independent tasks"), the agent followed the body. Superpowers therefore writes descriptions as "Use when…" plus conditions, and keeps them under 500 characters.

This conflicts with Anthropic's "what + when" (SKILL-011). Reconciliation, which we would trust:
- State *what* at the level of the outcome ("Creates GitHub roadmap issues").
- Never list the *steps* or their order.
- For skills whose value is a specific multi-step order, test whether a description with only the trigger conditions is followed better (SKILL-026).

## [SKILL-014] Invocation controls: manual-only, hidden, path-scoped, overrides
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [Extend Claude Code](https://code.claude.com/docs/en/features-overview)
- Related: TOK-005, SKILL-015, TOK-064

| Control | Effect | Use for |
|---|---|---|
| `disable-model-invocation: true` | Only `/name` runs it. The description is removed from context (zero listing cost). Can't be preloaded into subagents. | Side-effecting skills (deploy, publish) and rarely used ones |
| `user-invocable: false` | Hidden from the `/` menu; Claude can still load it | Background knowledge skills |
| `paths: [globs]` | Auto-loads only when working on matching files | Language- or directory-specific conventions |
| `skillOverrides` setting: `on` / `name-only` / `user-invocable-only` / `off` | Changes visibility without editing SKILL.md (not for plugin skills) | Silencing bundled or third-party skills you don't use |
| `disableBundledSkills` / `CLAUDE_CODE_DISABLE_BUNDLED_SKILLS` | Drops Claude Code's own bundled skills | Small listing budgets |

These are Claude Code-only fields. Skills synced from claude.ai cannot carry them (SKILL-002), but the `skillOverrides` setting still works on terminal-synced copies (not on the desktop app's plugin-delivered ones, SKILL-058).

## [SKILL-015] Troubleshooting: not triggering, over-triggering, not followed
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code skills: Troubleshooting](https://code.claude.com/docs/en/skills), [skill-creator SKILL.md](https://github.com/anthropics/skills/tree/main/skills/skill-creator)
- Related: TOK-005, SKILL-023, SKILL-026

**Doesn't trigger**
1. Ask "What skills are available?" or check `/skills`. If the skill is missing, check for YAML errors (`claude plugin validate <dir>`, `--debug`) and the folder location.
2. Run `/context`. The description may have been dropped by the listing budget.
3. Add the words users actually say. Test with a substantive prompt; trivial one-step tasks don't trigger skills.
4. Measure the effect of a change with `claude plugin eval` and a `tool_used: Skill` grader.

**Triggers too often**: make the description more specific, add a "not for X" line, use `paths:`, or set `disable-model-invocation: true`.

Tested 2026-10-13, v2.1.296, CLI (`claude-kb-lookup` trigger evals, Opus 5.5), two near misses:
- "or adding an MCP server" in the "Use before …" clause loaded the skill for "Add a new entry to claude-kb about prompt caching" in 3 of 6 runs, against 0 of 6 without it. Listing the topic alone was enough (FreekMencke/claude-skills#40).
- "READMEs" in the topic list loaded it for "Write the README for this repo" in 1 of 3 runs. "Not for writing a repo's docs" fixed it, and should-load cases stayed 54/54 (FreekMencke/claude-skills#44).

A topic word draws in tasks that do that thing; name them in the exclusion.

**Loads but isn't followed**:
- Move rules that must always hold into a hook. The skill's own `hooks:` frontmatter works for this.
- Word judgement guidance so it applies to the whole task.
- Re-invoke the skill after a compaction.

---

## Progressive disclosure and the body

## [SKILL-016] Keep the body small: only what Claude doesn't already know
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Agent Skills specification](https://agentskills.io/specification), [obra/superpowers writing-skills](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md)
- Related: SKILL-006, SKILL-017

"Default assumption: Claude is already very smart. Only add context Claude doesn't already have." Challenge every paragraph: does Claude need this explanation, and is it worth its tokens?

- **Limits**:
  - SKILL.md under 500 lines; Anthropic, the spec and skill-creator all agree on this.
  - Under about 5,000 tokens (the spec).
  - Split the content before you reach either limit.
- **Stricter community targets** for skills loaded often (superpowers): under 200 words, and under 150 for bootstrap skills.
- **What to cut**:
  - Generic programming knowledge.
  - Anything said twice.
  - Reasoning longer than a clause.
  - Options Claude will never choose.
- **What to keep**:
  - Local facts: paths, commands, names, house formats.
  - Decisions already made.
  - Output templates.
  - The empty case: what to output when there is nothing to report.

Several widely used skills exceed 500 lines: superpowers writing-skills (681), plugin-dev hook-development (712) and skill-development (637). Popularity is no evidence that the size is fine.

## [SKILL-017] Reference files: one level deep, TOC, descriptive names
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [skill-creator SKILL.md](https://github.com/anthropics/skills/tree/main/skills/skill-creator)
- Related: SKILL-004, SKILL-016

Treat SKILL.md as a table of contents and move the detail into files that load on demand.

- **Link every reference directly from SKILL.md.** When a reference links to another reference, Claude may preview it with `head -100` and read only part of it.
- **Give long reference files a table of contents.** Anthropic's best-practices page says over 100 lines; skill-creator says over 300. A TOC lets Claude see the whole scope from a partial read.
- **Organise by domain or variant**, e.g. `reference/finance.md` and `reference/sales.md`, or one file per cloud provider. Claude then reads only the one it needs.
- **Use descriptive file names** (`form_validation_rules.md`, not `doc2.md`) and forward slashes only.
- **Say when to read each file**: "For tracked changes, read `references/redlining.md`."
- **Watch how Claude navigates.** Files it never opens and sections it over-relies on are signs the structure or the pointers are wrong.

## [SKILL-018] Scripts for deterministic steps; match freedom to fragility
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), [skill-creator SKILL.md](https://github.com/anthropics/skills/tree/main/skills/skill-creator)
- Related: SKILL-008, SKILL-016, TOK-109

Anthropic frames this as "degrees of freedom": a narrow bridge needs guard rails, an open field doesn't.
- **High freedom (prose)** when many approaches are valid.
- **Medium (pseudocode or parameterised scripts)** when a pattern is preferred.
- **Low (an exact script, "do not add flags")** for fragile or destructive operations.

Scripts are more reliable than generated code and cheaper: only their output enters context. "Sorting a list via token generation is far more expensive than simply running a sorting algorithm."

- **Say whether to execute or read**: "Run `scripts/analyze_form.py`" or "See `analyze_form.py` for the algorithm".
- **"Solve, don't defer."** Handle errors in the script and justify every constant.
- **Plan, validate, execute** for batch or destructive work: write a plan file, check it with a verbose validator, then apply it.
- **List dependencies.** Don't assume packages are installed: the API sandbox has no network.
- **Bundle repeated code.** If every test run writes the same helper, put it in `scripts/` (skill-creator).

Validator output: short on success (`# Returns: "OK" or lists conflicts`), specific on failure; the full output contract is TOK-109.

## [SKILL-019] Durable wording: no dates, one term per idea, a default not a menu
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- Related: SKILL-032

These rules keep a skill correct as things change and stop it confusing the reader.

- **No time-sensitive phrasing** ("before August 2025, use…"). Write a "Current method" section and put the legacy method in a collapsed `<details>` "Old patterns" block.
- **One term per idea.** Pick "endpoint" or "route" and never switch. Sibling skills that work together should share vocabulary.
- **A default, not a menu.** "Use pdfplumber; for scanned PDFs use pytesseract" beats a list of five libraries.
- **Fully qualified MCP tool names** (`ServerName:tool_name`) avoid "tool not found".
- **Name the skill for what it does.** A gerund (`processing-pdfs`) is preferred; noun or verb phrases are acceptable. Avoid `helper`, `utils` and `documents`.
- **Generic rules, local facts.** A skill shared across repos should state the rule and let each repo's docs supply specifics. Copied repo facts go stale.

## [SKILL-020] Anti-pattern: capitalised MUST/NEVER instead of reasons
- Type: anti-pattern
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-14
- Sources: [skill-creator SKILL.md](https://github.com/anthropics/skills/tree/main/skills/skill-creator), [obra/superpowers writing-skills](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md), [Claude Code CHANGELOG (doctor prompt-audit)](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: SKILL-012, SKILL-016

skill-creator calls heavy-handed ALWAYS/NEVER "a yellow flag". Explain *why* a rule exists so the model can generalise; current models follow reasoned instructions without shouting.

- `/doctor prompt-audit` (v2.1.283) audits CLAUDE.md, skills, agents and commands "for prompting patterns written for older models". Shouting is one such pattern.
- Superpowers, which does use strong language in its discipline skills, reports wording tests with two results:
  - "Don't X" prohibitions backfired on problems of output shape; a positive recipe worked better.
  - Adding a nuance clause ("unless it matters") to a winning recipe made results worse.
- Takeaway: state rules positively, give the reason in one clause, and test wording changes (SKILL-026) rather than escalating emphasis.

---

## Choosing the right mechanism

## [SKILL-021] Skills vs CLAUDE.md vs hooks vs subagents vs MCP vs output styles
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Extend Claude Code](https://code.claude.com/docs/en/features-overview), [Skills explained](https://claude.com/blog/skills-explained), [Steering Claude Code](https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more), [Output styles](https://code.claude.com/docs/en/output-styles)
- Related: SKILL-022, SKILL-023, SKILL-024, TOK-065

| Mechanism | Is | Signal that you need it (official "build over time" table) |
|---|---|---|
| CLAUDE.md / `.claude/rules/` | Facts and conventions loaded every session (rules can be path-scoped) | Claude gets a convention wrong twice |
| Skill | On-demand procedure, playbook or reference | You paste the same playbook or prompt a third time |
| Hook | Script that runs on an event, guaranteed | Something must happen every time |
| Subagent | Isolated context that returns a summary | A side task floods the conversation |
| MCP server | Tools and data access to an external system | You keep copying data from somewhere Claude can't see |
| Output style | Session-wide role, tone and format | You keep asking for the same response style |
| Plugin | Packaging for all of the above | A second repo needs the same setup |

- "MCP connects Claude to data; Skills teach Claude what to do with that data."
- Slash commands are now skills ("Custom commands have been merged into skills", Claude Code skills docs).
- Procedures belong in skills, not CLAUDE.md. The "about 30 lines" threshold is not in the official sources (unverified).
- They combine: a skill can teach an MCP server's query patterns, a subagent can preload skills, and a skill can register hooks.

## [SKILL-022] Context cost of each extension type
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Extend Claude Code](https://code.claude.com/docs/en/features-overview), [Subagents](https://code.claude.com/docs/en/sub-agents), [Memory](https://code.claude.com/docs/en/memory), local CLI `claude plugin details`
- Related: TOK-005, SKILL-006, SKILL-030, TOK-065

| Mechanism | When it loads | Recurring cost |
|---|---|---|
| CLAUDE.md (+ `@imports`) | Session start, in full | Every request; imports don't save anything |
| Output style | Session start | Every request |
| Skill | Description at start; body when invoked | Name and description listed every request; each description plus `when_to_use` is capped at 1,536 characters and the listing has a 1% context budget (`skillListingBudgetFraction`); the body stays once loaded |
| MCP | Tool names at start; schemas deferred (tool search) | Low until used |
| Subagent | Its own fresh context | Isolated, but it counts toward usage limits |
| Hook | On its event | Zero unless it returns output |

Measure instead of guessing: `claude plugin details <plugin>` prints "Always-on" and "on-invoke" token estimates per component. For example, claude-md-management costs about 177 always-on tokens, and its claude-md-improver skill about 2.2k on invoke.

## [SKILL-023] Rules that must hold every time belong in hooks
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Extend Claude Code](https://code.claude.com/docs/en/features-overview), [Hooks guide](https://code.claude.com/docs/en/hooks-guide), [Memory](https://code.claude.com/docs/en/memory), [Claude Code skills](https://code.claude.com/docs/en/skills)
- Related: SKILL-015, SKILL-021

Skills, CLAUDE.md and output styles are advisory: "'never edit .env' in CLAUDE.md or a skill is a request, not a guarantee. A PreToolUse hook that blocks the edit is enforcement."

- A skill's outcome "can vary"; a hook "always fires on its event".
- Hook handlers can be `command`, `http`, `mcp_tool`, `prompt` or `agent`. Exit code 2 blocks a blockable event.
- A skill can declare `hooks:`. They apply from invocation to the end of the session, not before it. Since v2.1.299 a skill's own `UserPromptSubmit` hook first runs on the prompt after the one that invoked it.
- Split the work: put judgement and procedure in the skill, and the invariant (format check, forbidden path, required test run) in a hook.

## [SKILL-024] CLAUDE.md under 200 lines; move procedures into skills
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Memory](https://code.claude.com/docs/en/memory), [Steering Claude Code](https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more)
- Related: SKILL-021, SKILL-022, TOK-003, REPO-045

Target under 200 lines per CLAUDE.md: "Longer files consume more context and reduce adherence."

- Put in CLAUDE.md only what must be true in every session: facts, conventions, pointers.
- Move multi-step procedures to skills, and path-specific rules to `.claude/rules/` with `paths:`.
- A pointer is enough: "To create a roadmap, use the `roadmap-issues` skill." Duplicating a skill's rules in CLAUDE.md pays for them in every session, and the two copies drift apart.
- Subdirectory CLAUDE.md files load only when Claude reads files there.
- Claude Code reads AGENTS.md only when no CLAUDE.md exists (v2.1.277+). Otherwise import it with `@AGENTS.md`.

---

## Testing and evaluation

## [SKILL-025] Evaluation-first development and the Claude A / Claude B loop
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Claude Code skills: Testing](https://code.claude.com/docs/en/skills), [Evaluating skills (agentskills.io)](https://agentskills.io/skill-creation/evaluating-skills)
- Related: SKILL-026, SKILL-031, SKILL-043

"Create evaluations BEFORE writing extensive documentation."

1. Run representative tasks *without* the skill and record the failures.
2. Write at least three eval scenarios that hit those gaps.
3. Record the baseline.
4. Write minimal instructions.
5. Run again, compare with the baseline, refine.

Use two instances:
- **Claude A** helps write the skill.
- **Claude B** is a *fresh* session with the skill installed that does real tasks.

Watch B's trajectory: unexpected read order, references it never followed, sections it leaned on. Bring the specifics back to A. The fresh session matters: "leftover context from authoring the skill will mask gaps."

Test on every model you will use. Haiku may need more detail; Opus may need less.

The best-practices page still says "there is not currently a built-in way to run these evaluations". That is out of date since `claude plugin eval` (SKILL-026).

## [SKILL-026] `claude plugin eval`: built-in with/without evaluation
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Plugin evals](https://code.claude.com/docs/en/plugin-evals), local CLI `claude plugin eval --help` (2.1.296), [Claude Code CHANGELOG v2.1.269](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: SKILL-027, SKILL-028, SKILL-031

Added in v2.1.269 (2026-09-11). It runs eval cases against a plugin and reports scores. The target can be a path, an installed plugin or a skills-dir plugin.

- **Cases**: `evals/<case>/prompt.md` + `graders/*.md`, or `case.yaml`. `claude plugin eval init` interviews you and proposes should- and shouldn't-trigger cases; `--bare` writes a blank template.
- **Isolation**: each run is a fresh `claude -p` with a temporary home, only the target plugin loaded, and no user CLAUDE.md, hooks or MCP servers.
- **Two arms by default**: with the plugin and without it, 3 runs each, reported as `WITH`, `W/OUT` and `Δ`. "If a case scores 1.0 both with and without the plugin, the plugin isn't what made it pass."
- **Graders**:
  - `regex`, `tool_used`, `tool_order` and `file_exists` are free.
  - `llm` (2 of 3 judge votes; judge defaults to Haiku) and `baseline` cost judge calls.
- **Trigger check**: `type: tool_used`, `tool: Skill`, `input_match: '"skill"\s*:\s*"(?:[\w-]+:)?my-skill"'`. In two-arm runs it is an unscored indicator. For a negative case use `min: 0, max: 0, arm: both`.
- **Tools**: runs never prompt; `Bash`, `Write`, `Edit`, `WebFetch` and `WebSearch` are removed unless granted with `--allow-tools`. `--disallow-tools` (v2.1.299) keeps others out.
- **CI flags**: `--threshold`, `--max-cost-usd`, `--model`, `--trust-plugin`, `--json`. Since v2.1.299 a run ending on an API error scores 0 and the suite exits 1. Pin `--model` "so a model rollout isn't mistaken for a plugin regression".
- **Reports**: published as a private claude.ai artifact when you're signed in with a subscription that has artifacts (not with API-key auth, and not for a run a Claude Code session started unless `--publish-report`); `--no-publish` keeps it local.
- **Caveat**: it runs real sessions on your plan's usage.

## [SKILL-027] skill-creator: benchmarks and description optimisation
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-14
- Sources: [anthropics/skills skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator), [Improving skill-creator (2026-03-03)](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills), [Optimizing descriptions (agentskills.io)](https://agentskills.io/skill-creation/optimizing-descriptions)
- Related: SKILL-026, SKILL-028

Anthropic's skill-creator skill is installed with `/plugin install skill-creator@claude-plugins-official`. It is a conversational harness for a single skill.

- **Output quality**:
  - Put 2–3 realistic prompts in `evals/evals.json`.
  - Spawn with-skill and baseline subagents in the same turn. The baseline is no skill, or a snapshot of the previous version.
  - Record `total_tokens` and `duration_ms` from each run's completion notice.
  - Grade with `agents/grader.md`, then summarise with `scripts/aggregate_benchmark.py` (pass rate, time and tokens as mean ± stddev, plus the delta).
  - Review in `eval-viewer/generate_review.py`.
  - Optional: blind A/B comparison with `agents/comparator.md`.
- **Triggering**: `python -m scripts.run_loop --eval-set q.json --skill-path <dir> --model <session model> --max-iterations 5`.
  - It runs 3 runs per query, with a threshold of 0.5 and a stratified 40% holdout (fixed seed).
  - `improve_description.py` rewrites the description from the training failures only and picks the best by held-out score.
- **Fidelity caveat** (from reading `run_eval.py`): it detects triggering through a temporary `.claude/commands/` stub, and counts it as a miss if the first tool call is anything other than `Skill` or `Read`.

The blog reports tuning "improved triggering on 5 of 6 public skills". Its eval format is not compatible with `claude plugin eval`.

## [SKILL-028] Designing a trigger eval set
- Type: recommendation
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-12
- Sources: [skill-creator SKILL.md](https://github.com/anthropics/skills/tree/main/skills/skill-creator), [Optimizing descriptions (agentskills.io)](https://agentskills.io/skill-creation/optimizing-descriptions), [Enterprise skills guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise), [Plugin evals](https://code.claude.com/docs/en/plugin-evals)
- Related: SKILL-026, SKILL-027, SKILL-031

How to build the query set:

- **Size**: about 20 queries, 8–10 that should trigger and 8–10 that shouldn't.
- **Realistic queries**: include file paths, backstory, casual wording and typos. Make them substantive enough that Claude would want help.
- **Near-miss negatives**: requests that share vocabulary with the skill but belong to a neighbouring skill. "Write a fibonacci function" as a negative for a PDF skill tests nothing.
- **Repeats**: 3 or more runs per query. A positive passes at a trigger rate ≥ 0.5 and a negative at < 0.5. Stricter community tools use ≥ 0.8 and ≤ 0.2.
- **Holdout**: keep 40% of queries out of the improver's sight and select by held-out score. Finish with 5–10 fresh queries.
- **Coexistence**: run with your *real* skill roster installed as well as alone. One measurement found 100% triggering with 1 skill installed, against 56% with 89 (see SKILL-029).
- **Models**: test on the models that will run the skill. Enterprise guidance: 3–5 queries per skill on Haiku, Sonnet and Opus.

## [SKILL-029] Community trigger-rate numbers and forced-evaluation hooks
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [Spence: sandboxed skill-activation evals (2026-02-08)](https://scottspence.com/posts/measuring-claude-code-skill-activation-with-sandboxed-evals), [Spence: make skills activate reliably (2025-11-16)](https://scottspence.com/posts/how-to-make-claude-code-skills-activate-reliably), [Lung: plugin eval on 89 skills](https://dev.to/dexterlung/i-ran-claude-plugin-eval-on-89-skills-the-trigger-rate-fell-from-100-to-556-n29), [Rulestack: 38 runs](https://dev.to/rulestack/will-claude-code-call-your-skill-on-its-own-38-runs-one-skill-seven-ways-to-describe-it-203m)
- Related: SKILL-028, SKILL-023

There is no official baseline trigger rate. Published numbers vary with the model, the number of skills installed, the description and the harness.

| Study | Setup | Result |
|---|---|---|
| Spence round 2 | Sonnet 4.5, real CLI, 22 prompts × 2 runs | No hook 50–55%; "forced-eval" UserPromptSubmit hook 100% |
| Spence, harder set | 24 prompts incl. 5 negatives | Forced-eval 75% with 0 false positives; LLM-eval hook 4 of 5 false positives |
| Lung | `claude plugin eval` | 1 skill installed 100%; 89 skills 5 of 9 (56%) |
| Rulestack | Claude Code 2.1.273, 1 skill | Vague description 0 of 6; specific 6 of 6 |

The widely repeated "skills activate about 20% of the time" comes from Spence's round 1 (a weak hook, Haiku 4.5, API calls, not the CLI). It is not a baseline.

Judgement: official docs neither endorse nor reject hooks that force skill evaluation; their levers are the description, `paths` and `skillOverrides`. The evidence for the hooks is one author, with small N and few negatives, and they add latency (about 2 s). Fix descriptions first. Adopt a forcing hook only if your own eval, including negative cases, shows a gain.

## [SKILL-030] `/skill-doctor`, `plugin details` and telemetry for usage and cost
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code skills: Find unused skills](https://code.claude.com/docs/en/skills), [Monitoring usage](https://code.claude.com/docs/en/monitoring-usage), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md), local CLI
- Related: TOK-005, SKILL-022, SKILL-032

- **`/skill-doctor`** (docs: v2.1.252+; the CHANGELOG lists it under 2.1.261) shows each loaded skill's context cost and how often it is invoked. It also lists plugins you haven't used recently and tells you where to switch skills off (`skillOverrides`). The interactive report is in `/plugin` › Stats. `claude -p "/skill-doctor"` prints the same table without a model turn (tested on v2.1.296, 2026-10-12); the desktop Code tab doesn't offer it (SKILL-031). The docs say it is unavailable in sessions that skip feature-flag fetching and over Remote Control.
  - It measures usage and cost only, not trigger accuracy or quality.
  - It excludes bundled and enterprise skills.
  - Don't confuse it with the community `skill-doctor` plugin.
- **`claude plugin details <name>`** gives the component inventory and always-on and on-invoke token estimates.
- **`/doctor`** estimates the cost of the skill listing. **`/doctor prompt-audit`** flags outdated prompting patterns.
- **OpenTelemetry** (`CLAUDE_CODE_ENABLE_TELEMETRY=1`):
  - The `claude_code.skill_activated` event carries `invocation_trigger` (`user-slash`, `claude-proactive` or `nested-skill`).
  - `skill.name` is an attribute on the cost and token metrics: user-defined skill names appear verbatim, third-party plugin skills as `third-party`. On the `skill_activated` event, user-defined and third-party skills show as `custom_skill`. `OTEL_LOG_TOOL_DETAILS=1` shows the real names (on the metrics since v2.1.273).
  - `/usage` (Pro, Max, Team, Enterprise) shows each skill's, subagent's, plugin's and MCP server's share of recent usage.
  - The ratio of `claude-proactive` to `user-slash` activations is a cheap production signal for whether a skill triggers on its own.

## [SKILL-031] Anti-patterns in skill testing
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Claude Code skills: Testing](https://code.claude.com/docs/en/skills), [Plugin evals](https://code.claude.com/docs/en/plugin-evals), [skill-creator agents/analyzer.md](https://github.com/anthropics/skills/tree/main/skills/skill-creator), [Optimizing descriptions (agentskills.io)](https://agentskills.io/skill-creation/optimizing-descriptions)
- Related: SKILL-026, SKILL-028

- **Testing in the authoring session.** Your context hides gaps; use a fresh session.
- **Counting a trigger as success.** "Seeing a skill trigger tells you Claude found it, not that it did what you intended." Measure triggering and output quality separately.
- **No negative cases**, or only obviously unrelated ones.
- **Single runs.** "A single run is noisy." Use at least 3 and look at the variance.
- **Overfitting the description**: pasting failed queries into it as keywords. Use a holdout set.
- **Assertions that pass in both arms.** They inflate scores without discriminating anything; the analyzer flags them. Assertions that fail in both arms are broken.
- **Trusting a weak judge.** Prefer `regex` or scripts for checks that can be mechanical, and use `--judge-model sonnet` when the LLM judgement matters.
- **Unchecked harness artifacts.** Broken YAML, a same-name skill shadowing yours, an expired login, or a different roster size can each swing the numbers. Before v2.1.299 a run that ended on an API error (such as exhausted credit) scored 0 as if the grader failed; now it scores 0 ungraded and the suite exits 1.
- **Testing only on Opus** when Haiku or Sonnet subagents will run the skill.

## [SKILL-032] Retire skills the model has outgrown
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Improving skill-creator](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills), [Plugin evals](https://code.claude.com/docs/en/plugin-evals), [Evaluating skills (agentskills.io)](https://agentskills.io/skill-creation/evaluating-skills)
- Related: SKILL-030, SKILL-019

Anthropic distinguishes two kinds of skill:
- **Capability uplift** teaches something the model can't yet do well. These can become unnecessary.
- **Encoded preference** captures your workflow and formats. These stay useful.

"If the base model starts passing your evals without the skill loaded… The skill isn't broken; it's just no longer necessary." The blog applies this to capability-uplift skills.

Routine:
- **On each model release**, rerun the with/without evals unpinned. If `W/OUT` is already near 1.0, the skill is dead weight: delete it or set it to `off`.
- **Weigh benefit against cost.** "A skill that adds 13s but improves pass rate by 50 points is probably worth it. A skill that doubles tokens for a 2-point improvement might not be."
- **Prune what never fires.** `/skill-doctor` shows skills that are never invoked; `/doctor prompt-audit` catches wording written for older models.

---

## Distribution and maintenance

## [SKILL-033] Plugin layout for shipping skills
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Plugin manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference), [Claude Code skills](https://code.claude.com/docs/en/skills), local CLI `claude plugin init --help`
- Related: SKILL-034, SKILL-037

A plugin packages skills with agents, hooks, MCP and LSP servers, output styles and more.

```
my-plugin/
├── .claude-plugin/plugin.json   # optional; only "name" required
├── skills/<name>/SKILL.md
├── agents/  commands/  output-styles/
├── hooks/hooks.json  .mcp.json  .lsp.json
├── scripts/                     # executables (not bin/ if it must reach claude.ai)
└── evals/                       # for `claude plugin eval`
```

- Plugin skills are invoked as `/plugin:skill`.
- `${CLAUDE_PLUGIN_ROOT}` changes on every update. Keep state in `${CLAUDE_PLUGIN_DATA}`, which survives updates.
- A `CLAUDE.md` at the plugin root is **not** loaded; put that guidance in a skill.
- `claude plugin init <name> --with skills agents hooks` scaffolds a plugin in `~/.claude/skills/<name>/`. It loads next session as `<name>@skills-dir`.
- Name rules: no spaces, `@` or `:`. Names that pass as Anthropic's own (starting `claude-`, `anthropic-`, `anthropics-` or `cc-plugin-`, or exactly `claude`, `anthropic`, `anthropics`, `claude-code`, `claude-mods`) fail `claude plugin validate`, and `plugin init` and `plugin tag` refuse them; Claude Code still loads such a plugin.

## [SKILL-034] Marketplaces and team rollout
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference), [Install plugins](https://code.claude.com/docs/en/plugins/install), [Plugins for organisations](https://code.claude.com/docs/en/plugins/org), [Anthropic marketplaces](https://code.claude.com/docs/en/plugins/anthropic-marketplaces)
- Related: SKILL-033, SKILL-035, SKILL-036

**The catalogue.** A marketplace is a repo with `.claude-plugin/marketplace.json`, which holds `name`, `owner` and `plugins[]`, each plugin with a `name` and a `source`. Source types:
- a relative path
- `github`, `url` or `git-subdir`, each with `ref` and/or a full 40-character `sha`
- `npm` (install scripts disabled)
- `archive` with a `sha256`
- `command`, which runs on the user's machine

**Installing.**
- Add the marketplace with `/plugin marketplace add owner/repo[#ref]`.
- Install with `claude plugin install p@m --scope user|project|local`.

**Team rollout.** Commit `.claude/settings.json` with:

```json
{ "extraKnownMarketplaces": { "team": { "source": { "source": "github", "repo": "org/marketplace" } } },
  "enabledPlugins": { "tools@team": true } }
```

- These settings apply only after the workspace-trust dialog is accepted, so cloud sessions ignore them.
- Admins can enforce sources with `strictKnownMarketplaces` and `blockedMarketplaces`. An allowlist also blocks skills-dir plugins unless `{ "source": "skills-dir" }` is listed.

**Anthropic's marketplaces.**
- `claude-plugins-official` is added automatically.
- `claude-community` must be added by hand and is SHA-pinned.
- `claude-code-plugins` (the anthropics/claude-code repo) holds demo plugins.

## [SKILL-035] Plugin versioning: a fixed `version` pins users
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Plugin loading: versions and updates](https://code.claude.com/docs/en/plugins/loading), [Host a marketplace](https://code.claude.com/docs/en/plugins/host-marketplace), [Publish](https://code.claude.com/docs/en/plugins/publish)
- Related: SKILL-036, SKILL-037

The version that decides updates comes from the first of these that is set:
1. `version` in `plugin.json`.
2. `version` in the marketplace entry.
3. A version derived from the source: the 12-character commit SHA for git sources, or `unknown` for npm and local folders.

**The trap.** You set `"version": "1.0.0"`, then keep pushing commits. Users keep the cached copy, and `claude plugin update` reports "already at the latest version".

Choose one approach:
- **Bump `version` on every release.**
- **Omit `version` in both places**, so users track commits.

Other rules:
- Never set `version` in both places. `plugin.json` silently wins, and `validate` warns.
- The string isn't checked as semver.
- Dependency ranges between plugins resolve against git tags named `<plugin>--v<version>`. Create them with `claude plugin tag`.
- A plugin from a *local-path* marketplace loads in place: edits apply after `/reload-plugins`, whatever the version says.

## [SKILL-036] Auto-update, pinning and release channels
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Plugin loading](https://code.claude.com/docs/en/plugins/loading), [Host a marketplace](https://code.claude.com/docs/en/plugins/host-marketplace)
- Related: SKILL-035

**Auto-update**
- It runs in interactive sessions after the first message, with a random delay of up to 10 minutes. The new version loads at the next launch or on `/reload-plugins`.
- It is **on** by default for `claude-plugins-official` and marketplaces added from claude.ai.
- It is **off** for the community marketplace and every third-party or local marketplace. Turn it on with `autoUpdate: true` on the `extraKnownMarketplaces` entry, or in `/plugin` › Marketplaces. A marketplace owner can't force it from `marketplace.json`.

**Manual updates**
- `claude plugin update <plugin>` updates one plugin. There is no "update all" command.
- `claude plugin marketplace update` refreshes the listings only. In `/plugin` › Marketplaces, **Update marketplace** also updates the plugins installed from that marketplace.

**Pinning**: a `ref` or `sha` on the plugin source, or `owner/repo#ref` on `marketplace add`.

**Channels**: "Claude Code has no release-channel concept." Publish two marketplaces with different names pointing at different refs (e.g. `stable` and `latest`).

**Removal**
- `renames` (old name → new name, or → `null`) migrates or removes plugins.
- `forceRemoveDeletedPlugins: true` uninstalls removed plugins.
- Old cache versions are deleted 14 days after being orphaned.

## [SKILL-037] Validate before publishing: `plugin validate --strict`, `plugin tag`
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Plugin CLI reference](https://code.claude.com/docs/en/plugins/cli-reference), [Publish](https://code.claude.com/docs/en/plugins/publish), local CLI `claude plugin validate --help`, `claude plugin tag --help`
- Related: SKILL-026, SKILL-035

**`claude plugin validate <path> [--strict] [--json]`** checks a plugin, a marketplace, or a bare `skills/`, `agents/` or `commands/` directory (v2.1.233+).
- What it checks:
  - manifest and marketplace JSON
  - paths and name rules
  - unknown fields
  - SKILL.md and agent frontmatter
  - MCP entries
- `--strict` turns warnings into failures; use it in CI.
- What it does **not** check:
  - It does not follow symlinks.
  - On a marketplace, it does not open plugins that live elsewhere.
  - It does not check a root-level SKILL.md.
  - It does not catch `source` fetch errors.
- Run locally on 2026-10-12, it passed all four of our custom skills.
- Tested 2026-10-14, v2.1.296, CLI: it reported nothing on a skill with `description: Bad: colon here`, an unknown key or `name: [unclosed`, under the default `skills/` and a custom `skills` path, and only warned about the missing `version`. Claude Code tolerated the unquoted `: `: the skill loaded by name and its description appeared intact in the model's skill list. So validate doesn't catch every malformed frontmatter: the docs (v2.1.233+) say it reports SKILL.md files whose YAML fails to parse, and a lead re-run on 2026-10-14, v2.1.296, flagged an unterminated quoted string (`YAML frontmatter failed to parse`, exit 1) but still passed `name: [unclosed` and an unquoted `: `.

**`claude plugin tag [--dry-run] [--push]`** creates a `<name>--v<version>` tag after checking that `plugin.json` and the marketplace entry agree.

**Pre-publish checklist** (docs):
1. `validate --strict`.
2. Install from a local marketplace.
3. Run `claude plugin eval`.

The agentskills.io reference validator is `skills-ref validate ./my-skill`. In-session `/plugin validate <path>` is documented and prints the same report as `claude plugin validate`.

## [SKILL-038] claude.ai skills: upload, sharing, org provisioning, sync into Claude Code
- Type: fact
- Applies to: claude.ai
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude), [Provision skills for your organization](https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization), [Claude Code skills: synced skills](https://code.claude.com/docs/en/skills), [Plugin loading](https://code.claude.com/docs/en/plugins/loading)
- Related: SKILL-002, SKILL-007, SKILL-059

**Upload**: Customize › Skills › + › Upload a skill, as a ZIP. The folder must match `name`, and only standard frontmatter fields are allowed.

**Sharing** (Team and Enterprise):
- Recipients get view-only access.
- "Publish to org" can require review. The help article starts Team at "Open" and Enterprise at off, and switches an org that hadn't chosen a setting to "Requires review" on 2026-10-02; it doesn't limit that switch to Enterprise.
- Security scanning on Enterprise blocks malicious skills and puts a caution banner on risky ones.

**Org provisioning**: Organization settings › Plugins & skills. To target a group, bundle the skills into a plugin.

**Sync into Claude Code** (v2.1.273+):
- Skills enabled on your claude.ai account download to `~/.claude/skills/synced/`.
- Checks run about every 10 minutes while a session is active and about every 40 while idle (v2.1.293).
- Invoke as `/name` or `/anthropic-skills:name`.
- The sync is **one-way**: local edits there are overwritten.
- It happens only for sessions signed in through claude.ai OAuth; API-key and Bedrock sessions get nothing.
- Synced skills never run `!` commands.
- Turn it off with `syncClaudeAiSkills: false`. Plugins sync separately (`syncClaudeAiPlugins`, `~/.claude/plugins/synced/`).

The skills overview page still says claude.ai skills "cannot be centrally managed by admins". The support articles contradict this and are newer: trust them.

## [SKILL-039] Skills in the Claude API
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Skills guide](https://platform.claude.com/docs/en/build-with-claude/skills-guide), [Enterprise skills guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise), [Platform release notes](https://platform.claude.com/docs/en/release-notes/overview)
- Related: SKILL-003, SKILL-041

**Requirements**: the code execution tool (`code_execution_20250825`). Pass `container.skills[]` entries of the form `{type: "anthropic"|"custom", skill_id, version}`.
- Anthropic skill IDs: `pptx`, `xlsx`, `docx`, `pdf`.
- Custom skill IDs look like `skill_01…`, with versions `skver_…` or `latest`.

**Limits**: 20 skills per request; uploads under 30 MB uncompressed.

**Endpoints**: `POST/GET /v1/skills`, `GET/DELETE /v1/skills/{id}`, `POST /v1/skills/{id}/versions`.
- Each version is a full snapshot, and its `name` must match the skill's.

**Production rules**:
- **Pin version IDs.** With `latest`, anyone's upload changes production behaviour.
- **Isolate tenants by workspace.** Custom skills are visible to every key in the workspace, so use one workspace per tenant.
- Containers have no network and can't install packages.
- Skills are not covered by ZDR.
- Changing the skill list breaks the prompt cache.

The `skills-2025-10-02` beta header is no longer required: the Skills API left beta on 2026-08-19 (platform release notes). Requests that still send it keep working with the beta response shapes. Without the header, `DELETE /v1/skills/{skill_id}` removes the Skill with all its versions.

## [SKILL-040] The Agent Skills open standard and portability
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [agentskills.io](https://agentskills.io/specification), [Codex skills](https://learn.chatgpt.com/docs/build-skills), [GitHub Copilot agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills), [Cursor skills](https://cursor.com/docs/context/skills), [Gemini CLI skills](https://geminicli.com/docs/cli/skills/)
- Related: SKILL-002, SKILL-046

Anthropic released SKILL.md as an open standard ([agentskills.io](https://agentskills.io), Dec 2025). Adopters include Codex, GitHub Copilot, VS Code, Cursor, Gemini CLI, OpenCode, Goose, Amp and others.

| Tool | Where it looks |
|---|---|
| Codex | `.agents/skills` (walking up to the repo root), `~/.agents/skills` |
| Copilot | `.github/skills`, `.claude/skills`, `.agents/skills` |
| Cursor | `.cursor/skills`, `.agents/skills`, and `.claude/skills` for compatibility |
| Gemini CLI | `.gemini/skills`, `.agents/skills` |

Portability rules:
- Use only the standard fields if a skill must work outside Claude Code.
- Keep `name` equal to the folder name.
- Use forward slashes in paths.
- Don't depend on `$ARGUMENTS`, `${CLAUDE_SKILL_DIR}` or `!` injection.

`.agents/skills/` is the cross-tool convention. The Claude Code docs list only `.claude/skills`, so Claude Code reading `.agents/skills` is unverified.

## [SKILL-041] Security review of third-party skills and plugins
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview), [Enterprise skills guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise), [Plugin security](https://code.claude.com/docs/en/plugins/security), [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- Related: SKILL-010, SKILL-037, SKILL-069, SKILL-068, SKILL-064

"Only use skills from trusted sources." Installing a skill or plugin is installing software. "A Claude Code plugin you install can execute arbitrary code on your machine with your user privileges."
- Hooks, monitors, MCP and LSP servers (and any process a mod starts) run *outside* the sandbox. A `bin/` executable runs as a Claude Bash command, so permission rules apply to it; `bin/` is on the shell's `PATH`, so read every file in it before installing.
- Auto-update can change files after you reviewed them.

Before installing:
1. Read SKILL.md, every script, `hooks/hooks.json`, `.mcp.json` and `bin/`.
2. Look for network calls, file access beyond the stated purpose, hardcoded credentials, instructions to hide actions, and external URLs that are fetched, since fetched content can inject instructions.
3. Run `claude --plugin-dir <clone> plugin details <name>` to see the inventory.
4. Pin a `sha` for git sources or a `sha256` for archives, and leave auto-update off for third-party marketplaces.

The enterprise guidance adds:
- Authors don't review their own skills.
- Git is the source of truth.
- Scripts are tested in a sandbox before rollout.

A blog claimed Snyk found that 36% of 3,984 public skills had security issues. That figure is unverified at source.

---

## Published collections

## [SKILL-042] anthropics/skills and claude-plugins-official
- Type: fact
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-14
- Sources: [anthropics/skills](https://github.com/anthropics/skills), [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official), GitHub API star counts 2026-10-12
- Related: SKILL-012, SKILL-027

**anthropics/skills** (≈181k stars) is Anthropic's reference collection.
- Contents:
  - The document skills `docx`, `pdf`, `pptx` and `xlsx` (source-available, not open source).
  - `skill-creator`, `mcp-builder`, `webapp-testing`, `frontend-design`, `claude-api` and others.
- Install with `/plugin marketplace add anthropics/skills`, which offers the `document-skills` and `example-skills` plugins.
- The README calls the contents demonstrations and says to test them before relying on them.

What to copy:
- **Thin SKILL.md with heavy `scripts/`**: docx is 91 lines; pdf is 314 lines and relies on its scripts.
- **Long, specific descriptions with an explicit "Do NOT use for…"**.
- **A `license:` field and a bundled LICENSE**.
- **skill-creator** is the most complete public testing harness.

**claude-plugins-official** (≈38k stars) is the curated marketplace that Claude Code auto-adds. It holds LSP plugins, `skill-creator`, `claude-md-management`, `plugin-dev`, `code-review` and others. For listing in the directory, the docs and the README disagree on where to submit (see Open questions).

## [SKILL-043] obra/superpowers: test-driven skill writing
- Type: pattern
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [obra/superpowers](https://github.com/obra/superpowers), [writing-skills SKILL.md](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md), [testing-skills-with-subagents.md](https://github.com/obra/superpowers/blob/main/skills/writing-skills/testing-skills-with-subagents.md)
- Related: SKILL-013, SKILL-025, SKILL-045

Superpowers (≈298k stars, MIT) is a library of process skills: brainstorming, writing and executing plans, TDD, systematic debugging, verification before completion, and code review. It ships adapters for Codex, Cursor and others, and a `tests/` folder.

Ideas worth copying:
- **"TDD for skills."**
  - RED: run a pressure scenario on a subagent *without* the skill and record its rationalisations verbatim.
  - GREEN: write the minimal skill that fixes them.
  - REFACTOR: close the loopholes.
  - "If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing."
- **Pressure scenarios** combine three or more pressures (time, sunk cost, authority) and force a choice.
- **Rationalisation tables** ("Excuse → Reality") and "Red Flags — STOP" lists in discipline skills.
- **Variance is a metric**: five interpretations across five runs means the wording isn't binding.
- **Cross-references by name** ("REQUIRED: use X") instead of copying content.
- **Trigger-only descriptions** (SKILL-013).

Caveats:
- Its bootstrap skill injects "if there is even a 1% chance a skill applies, you MUST invoke it" through a hook. That trades context and false positives for recall.
- Several skills run well over 500 lines.
- Users report keeping only a few of its skills (unverified secondary source).

## [SKILL-044] Other strong collections: plugin-dev, Trail of Bits, wshobson, Vercel
- Type: comparison
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-14
- Sources: [plugin-dev](https://github.com/anthropics/claude-code/tree/main/plugins/plugin-dev), [trailofbits/skills AGENTS.md](https://github.com/trailofbits/skills/blob/main/AGENTS.md), [wshobson/agents](https://github.com/wshobson/agents), [wshobson plugin-eval](https://github.com/wshobson/agents/blob/main/docs/plugin-eval.md), [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills), [vercel-labs/skills](https://github.com/vercel-labs/skills)
- Related: SKILL-042, SKILL-043

| Collection | Notable pattern to adopt | Caveat |
|---|---|---|
| **plugin-dev** (Anthropic) | Skills paired with `skill-reviewer` and `plugin-validator` agents. Descriptions quote literal user phrases: "This skill should be used when the user asks to 'create a hook'…" | hook-development is 712 lines |
| **trailofbits/skills** (≈7.5k★, 44 plugins) | Contributor guide with complexity-tiered example skills. A validator catches `allowed-tools` vs `tools` key mistakes. "Phase 1… repeat until" plans become workflow scripts, not prose. CI loads every plugin in both Claude Code and Codex | Security niche |
| **wshobson/agents** (≈40k★, 184 skills) | One source generated for 7 harnesses; per-agent `model:` tiers. PluginEval has a static lint layer | Its LLM-judge layers are "not validated against human labels". Too big to install wholesale |
| **vercel-labs/agent-skills** | Rules kept as separate files, compiled into one SKILL/AGENTS file by a build step with tests. `npx skills add owner/repo` installs across tools | Generated content is long |

Common to the best collections: a validator in CI, examples by complexity tier, and a reviewer or eval step next to the skill.

## [SKILL-045] Anti-pattern: installing collections wholesale
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-14
- Sources: [Claude Code skills (listing budget)](https://code.claude.com/docs/en/skills), [Extend Claude Code](https://code.claude.com/docs/en/features-overview), [Enterprise skills guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise), [Lung: plugin eval on 89 skills](https://dev.to/dexterlung/i-ran-claude-plugin-eval-on-89-skills-the-trigger-rate-fell-from-100-to-556-n29), [RoboRhythms: best Claude Code skills 2026](https://www.roborhythms.com/best-claude-code-skills-2026/)
- Related: TOK-005, SKILL-030, SKILL-032

Every installed skill makes the others less likely to trigger and adds to the cost of every session. There are three sources of evidence:
- **Official.** The listing budget drops descriptions of rarely used skills, and overlapping descriptions mean "Claude may load the wrong skill or miss one that would help". Enterprise guidance says to "limit the number of Skills loaded simultaneously" and to stop adding skills when recall degrades.
- **Measured.** One author's skill triggered 9 of 9 times with 1 skill installed and 5 of 9 with 89 installed. The author notes this counts invocations only: in the missed runs the model reasoned from the description without invoking the skill, the eval workspace was empty, and he drew no conclusion on pruning.
- **Anecdotal.** One reviewer uninstalled 20 of 23 marketplace skills within 10 days, because most "restate general best practices Claude already follows".

Practice:
- Install single plugins, not whole marketplaces.
- Prefer skills that encode *your* conventions over generic advice.
- Check `/skill-doctor` monthly.
- Set skills you only call by hand to `disable-model-invocation` or `skillOverrides: name-only`.

## [SKILL-046] Ideas from other AI coding tools
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Cursor rules](https://cursor.com/docs/context/rules), [Codex skills](https://learn.chatgpt.com/docs/build-skills), [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Gemini CLI extensions](https://geminicli.com/docs/extensions/)
- Related: SKILL-014, SKILL-040

| Idea | Origin | Claude Code equivalent |
|---|---|---|
| Four activation modes: always, by description, by file glob, manual | Cursor rules | CLAUDE.md, the description, `paths:`, `disable-model-invocation` |
| Per-skill switch for implicit invocation (`policy.allow_implicit_invocation: false`) | Codex `agents/openai.yaml` | `disable-model-invocation` |
| Hard byte cap on instruction files (32 KiB `project_doc_max_bytes`) with an override file | Codex AGENTS.md | No hard cap; the 200-line guideline, `/doctor` trims |
| Skill listing capped at 2% of context (8,000 chars if unknown) | Codex | 1% budget, configurable (SKILL-005) |
| One-command install from a repo URL, plus a list command to audit installs | Gemini CLI extensions | `/plugin marketplace add`, `/plugin` |
| Shared `~/.agents/skills` directory read by several tools | Codex, Copilot, Gemini, Cursor | Not documented for Claude Code |

Every tool now has path-scoped activation and a manual-only mode, and Claude Code covers both. The one idea it lacks is a shared cross-tool skills directory. Today a portable skill means a symlink, or a plugin plus a `.agents/skills` copy.

---

## Claude desktop app and WSL

Entries SKILL-047 to SKILL-058 were added on 2026-10-12. Where they cite a "local test", the setup was the Windows desktop app 2.31226.1, whose Code tab ran Claude Code 2.1.295 in an Ubuntu WSL2 distro, and the WSL terminal CLI 2.1.296.

## [SKILL-047] How the desktop app's Code tab runs Claude Code
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code on desktop](https://code.claude.com/docs/en/desktop), [Desktop with WSL](https://code.claude.com/docs/en/desktop-wsl), [#80089](https://github.com/anthropics/claude-code/issues/80089), local test
- Related: SKILL-048, SKILL-051

The Code tab "runs the same underlying engine" as the CLI, but as "its own copy of Claude Code, which has its own version number". The desktop app downloads and updates that copy, so it can lag or lead the `claude` in your terminal.
- Check the copy's version with `/status` in a Code-tab session. Update it through the app's "Check for Updates".
- New Claude Code features and fixes, such as a skills fix in 2.1.296, reach desktop sessions only once the app ships that build.

Session environments are Local, Cloud, SSH, and WSL (Windows only).

For a **WSL** session, the app copies a Linux CLI build into the distro under `~/.claude/remote/ccd-cli/<version>`, plus a small server under `~/.claude/remote/srv/`. It then runs the session through that server.
- The local test showed `CLAUDE_CODE_ENTRYPOINT=claude-desktop` and `DISABLE_AUTOUPDATER=1`.
- The app launched the CLI with `--setting-sources=user,project,local`, an inline `--settings` JSON and `--project-config-root`.
- Tools, git and paths are all Linux-side.
- WSL sessions require WSL 2. WSL 1 works only for the CLI, without the sandbox.

## [SKILL-048] Which skill sources each session type loads
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code on desktop: Use skills](https://code.claude.com/docs/en/desktop), [Claude Code skills: Cowork and cloud sessions](https://code.claude.com/docs/en/skills), [Cloud environments](https://code.claude.com/docs/en/cloud-environments), [#88432](https://github.com/anthropics/claude-code/issues/88432), local test
- Related: SKILL-049, SKILL-050, SKILL-052, SURF-016

| Session | Personal `~/.claude/skills` | Project `.claude/skills` | Installed plugins | claude.ai account skills |
|---|---|---|---|---|
| Terminal CLI (`/login`) | yes | yes | yes | yes, from `~/.claude/skills/synced/` |
| Desktop Local | yes (that OS's home) | yes | yes | yes, delivered by the app as a plugin |
| Desktop WSL | yes (the distro's home) | yes | docs say no; observed yes for CLI installs (SKILL-052), no for `<name>@synced` (SKILL-063) | **no** (local test, SKILL-050) |
| Desktop SSH | the remote host's | yes | yes | not documented |
| Desktop Cloud, routines | no | yes (from the clone) | no | skills enabled one by one only; marketplace plugins don't load (SKILL-060) |
| Cowork | no | n/a | from Customize | yes |
| Desktop scheduled tasks | yes | yes | n/a | n/a |

Other skills that depend on the surface:
- Bundled skills that need artifacts (`artifact-capabilities`, `artifact-diagramming`) appear only where artifacts are available.
- `artifact-design` appeared in the desktop session but not in the terminal CLI. It is the built-in design skill bundled with the `Artifact` tool, so it appears only where artifacts are available; the docs describe it but don't name it (SURF-016, SURF-009).
- `dataviz` appeared in both.

Verify each surface rather than assuming parity (SKILL-054).

## [SKILL-049] claude.ai account skills reach sessions in two different ways
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code skills: synced skills](https://code.claude.com/docs/en/skills), [Settings reference: disableSideloadFlags](https://code.claude.com/docs/en/settings-reference), [#100272](https://github.com/anthropics/claude-code/issues/100272), [#101061](https://github.com/anthropics/claude-code/issues/101061)
- Related: SKILL-038, SKILL-050, SKILL-058

There are two separate delivery paths, and the settings that control one don't control the other.

1. **Terminal file sync.**
   - The CLI downloads skills into `~/.claude/skills/synced/` and lists them as `anthropic-skills:<name>`.
   - It requires a sign-in stored by `/login` and feature-flag fetching.
   - There is no sync with an API key, `ANTHROPIC_AUTH_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN`, `apiKeyHelper`, Bedrock, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, bare or safe mode, or `--setting-sources` without `user`.
   - `syncClaudeAiSkills: false` turns it off.
2. **Desktop app delivery.**
   - The app downloads the account's skills into its own folder (`%APPDATA%\Claude\local-agent-mode-sessions\skills-plugin\…` on Windows) and passes them to Local sessions as a plugin.
   - A deny rule on `Skill(anthropic-skills:<name>)` blocks a skill "when Claude Desktop delivers it to a session as a plugin".
   - Only the managed `disableSideloadFlags` withholds them from Local sessions.
   - A user report (#101061) says `syncClaudeAiSkills: false` does not stop the desktop delivery, and that `skillOverrides` can't hide these skills because they are plugin skills.

Both paths show the same `anthropic-skills:<name>` names, which hides which path a session actually used.

## [SKILL-050] Desktop WSL sessions don't load claude.ai account skills
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: local test, [Claude Code on desktop](https://code.claude.com/docs/en/desktop), [Claude Code skills: where synced skills load](https://code.claude.com/docs/en/skills)
- Related: SKILL-048, SKILL-049, SKILL-056

In a desktop WSL session, none of the 17 `anthropic-skills:*` skills was in the skill listing. The distro's `~/.claude/skills/synced/` held all 17, and its last sync round had completed that morning.

Bisect:

| Run | Account skills listed |
|---|---|
| WSL terminal CLI 2.1.296, clean env | 17 |
| The desktop's own CLI build (2.1.295) started from a terminal | 17 |
| …with `CLAUDE_CODE_ENTRYPOINT=claude-desktop` | 17 |
| …with `--setting-sources=user,project,local` | 17 |
| The same build launched by the desktop app | 0 |

So the cause is how the desktop app launches the session, not the CLI version.

Likely mechanism (inference): the desktop path (SKILL-049) passes plugins, which WSL sessions don't get, and the file sync doesn't apply because the app brokers auth instead of a `/login` sign-in.

Fix (verified): put the skill in the distro's `~/.claude/skills` or the repo's `.claude/skills`. Per-skill symlinks from a git repo into `~/.claude/skills/` appeared in a running desktop WSL session's listing without a restart (SKILL-056).

## [SKILL-051] Windows and WSL keep separate `~/.claude` homes
- Type: fact
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-14
- Sources: [Desktop with WSL](https://code.claude.com/docs/en/desktop-wsl), [Settings](https://code.claude.com/docs/en/settings), [#100742](https://github.com/anthropics/claude-code/issues/100742), [#88432](https://github.com/anthropics/claude-code/issues/88432), [#66303](https://github.com/anthropics/claude-code/issues/66303), [#96790](https://github.com/anthropics/claude-code/issues/96790), local test
- Related: SKILL-047, SKILL-056

Each side reads its own home:
- Desktop **Local** sessions and the Windows CLI read `%USERPROFILE%\.claude`.
- Desktop **WSL** sessions and the WSL CLI read the distro's `/home/<user>/.claude`. A debug log from a WSL session shows `Loading skills from: … user=/home/<user>/.claude/skills`.

The two don't share skills, plugins, `settings.json`, credentials, MCP config (`claude_desktop_config.json` doesn't reach WSL sessions) or claude.ai synced copies.

The docs' "Desktop and the CLI read the same settings files" holds within one OS only. No official page states the Windows/WSL split. The evidence is issue reports plus the local test, in which the Windows side had no skills and no plugins while the distro had everything.

Pitfalls:
- **Pre-session `/` menu.** In a WSL session, the `/` menu on the new-session screen scans the *Windows* skills folder until the first message is sent (#100742, open).
- **`CLAUDE_CONFIG_DIR` pointed at `/mnt/c/...`.** It would share credentials and plugin state across both sides. Concurrent writes to `.credentials.json` clobber each other (#76561), so avoid it.

## [SKILL-052] Plugins in desktop WSL sessions: docs say no, distro-enabled plugins load
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-17
- Sources: [Claude Code on desktop: Install plugins](https://code.claude.com/docs/en/desktop), [Desktop with WSL](https://code.claude.com/docs/en/desktop-wsl), [#88432](https://github.com/anthropics/claude-code/issues/88432), [#97515](https://github.com/anthropics/claude-code/issues/97515), local test
- Related: SKILL-048, SKILL-050, SKILL-063

The docs say: "Plugins aren't available in WSL sessions". The WSL page lists "connectors and plugins" as unavailable.

Observed behaviour:
- In the local test, a desktop WSL session loaded the skills of plugins enabled in the distro's `~/.claude/settings.json`. These were `claude-md-management` and `frontend-design`, plus the `playwright` plugin's MCP server.
- #88432 shows the same, with 7 plugin skills in a WSL session's listing.
- #97515 reports a CLI-installed plugin missing in the Code tab.

Working interpretation:
- What is unavailable in WSL sessions is the app's plugin *UI*, together with the plugins the *app* manages itself: the claude.ai skills plugin and app-deployed org plugins.
- Plugins installed with the WSL CLI (`claude plugin install …`) and enabled in the distro's settings do load.
- Plugins synced from claude.ai (`<name>@synced`) didn't, in a 2026-10-17 test (SKILL-063).

Rely on them, but re-check after app updates, since the documented behaviour says otherwise.

## [SKILL-053] Desktop worktree sessions read project skills from the main checkout
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Worktrees](https://code.claude.com/docs/en/worktrees), [Plugin loading](https://code.claude.com/docs/en/plugins/loading), [#99145](https://github.com/anthropics/claude-code/issues/99145), [#100497](https://github.com/anthropics/claude-code/issues/100497), local test
- Related: SKILL-007

The docs say the CLI reads a worktree's own `.claude/skills` and falls back to the main checkout only when the worktree has none (v2.1.277+). The desktop app works differently: it launches worktree sessions with `--project-config-root <main checkout>`.
- The local test showed this flag pointing at the main repo while the session's working directory was a worktree.
- Open issues #99145 and #100497 report that project skills, hooks and commands then come from the main checkout.
- The worktrees page now states it: a desktop-started worktree session reads settings, hooks, skills, agents, commands and `.mcp.json` from the main checkout's root, while `CLAUDE.md` and `.claude/rules/` still load from the worktree. #100497 dates the change to the desktop app update of 2026-10-07.

Consequence: when a desktop session edits `.claude/skills/` on a worktree branch, that same session keeps running the main checkout's version. To test a skill change, merge it first, or start a CLI session inside the worktree.

## [SKILL-054] Checking which skills a desktop session actually has
- Type: recommendation
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-14
- Sources: [Claude Code on desktop](https://code.claude.com/docs/en/desktop), [#82676](https://github.com/anthropics/claude-code/issues/82676), [#91210](https://github.com/anthropics/claude-code/issues/91210), [#93339](https://github.com/anthropics/claude-code/issues/93339), [#100272](https://github.com/anthropics/claude-code/issues/100272), local test
- Related: SKILL-015, SKILL-048

The desktop `/` menu and the Customize panel are built separately from the skill listing the model receives, and several open issues show them disagreeing:
- **Lazy spawn.** In WSL and SSH sessions the CLI only starts on the first message, so the menu is incomplete before it (#82676).
- **Missing entries.** Personal skills can be absent from the menu yet invocable (#93339, #91210).
- **Late account skills.** `anthropic-skills:*` entries appear only after the first message (#100272, closed as completed 2026-10-13; re-check on a current build).

Reliable checks, best first:
1. **Ask the model.** After the first message, ask it to list its available skills verbatim. That is the listing that decides triggering.
2. **Read the app log.** `main.log` has lines such as "Passing N plugin(s) to SDK". For WSL sessions there is also `~/.claude/remote/run/<id>/remote-server.log`.
3. **Run `/status`** for the bundled version.

Terminal-dialog commands behave differently in the Code tab. Commands with no argument form reply "isn't available in this environment". `/skill-doctor` in a new desktop WSL session replies "Skill usage reports are not available on this connection" (observed 2026-10-12). Run it from the terminal CLI on the same OS instead: `claude -p "/skill-doctor"` prints the whole report as text, with no model turn. Whether `/skills` and `/context` work in the Code tab is undocumented.

## [SKILL-055] Writing skills on WSL: Linux filesystem, LF endings, exec bits
- Type: recommendation
- Applies to: Claude Code
- Confidence: unverified
- Last verified: 2026-10-14
- Sources: [Desktop with WSL](https://code.claude.com/docs/en/desktop-wsl), [Troubleshooting: slow search on WSL](https://code.claude.com/docs/en/troubleshooting), [#60580](https://github.com/anthropics/claude-code/issues/60580), [#93845](https://github.com/anthropics/claude-code/issues/93845), [#76973](https://github.com/anthropics/claude-code/issues/76973)
- Related: SKILL-018, SKILL-056

Most of this is general Linux behaviour that no Claude doc confirms for skills specifically, so treat it as unverified.

- **Keep skills and repos on the distro filesystem** (`/home/...`).
  - Access across `/mnt/c` or `\\wsl.localhost` "is slow and breaks file watching", so live skill reload may not fire. Run `/reload-skills` if in doubt.
  - Search on `/mnt/c` can return partial results.
- **Use LF line endings.**
  - A CRLF `SKILL.md` broke the desktop scheduled-task editor's frontmatter parser (#60580, closed as completed 2026-05-21), although the reporter says the skill loader itself tolerates CRLF.
  - A CRLF shebang breaks bundled scripts under bash.
  - Fix: `.gitattributes` with `* text=auto eol=lf`.
- **Keep scripts executable in git** (`git update-index --chmod=+x`). Files on `/mnt/c` report mode 0777 and Windows git can drop the exec bit.
- **Paths.** Use `${CLAUDE_SKILL_DIR}` and forward slashes. `C:\…` paths in a skill don't work in a WSL session.
- **`!` injection** uses bash by default, which is always present in WSL. `shell: powershell` needs `CLAUDE_CODE_USE_POWERSHELL_TOOL=1` and `pwsh` on the PATH there.
- **Sandbox pitfall.** Don't symlink sensitive directories into `/mnt/c`: deny-read paths that are symlinks into `/mnt/c` break the bwrap sandbox (#93845).

## [SKILL-056] Setup for someone using both the desktop app and WSL
- Type: recommendation
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-14
- Sources: [Claude Code skills (symlinked skill folders)](https://code.claude.com/docs/en/skills), [#82676 comment](https://github.com/anthropics/claude-code/issues/82676), [#66303](https://github.com/anthropics/claude-code/issues/66303), local test
- Related: SKILL-050, SKILL-051, SKILL-052

**1. Choose one home and work there.** If repos live in WSL, run desktop sessions in the WSL environment, then put skills, plugins and settings in the distro's `~/.claude`. The Windows side can stay empty.

**2. Keep skills in git and link each one in.** Clone a skills repo on the distro filesystem, then symlink each skill into place:

```bash
ln -s ~/repos/my-skills/skills/roadmap-issues ~/.claude/skills/roadmap-issues
```

- Per-skill symlinks are documented, and they work in desktop WSL sessions: reported with 33 skills, and confirmed in the local test.
- Linking each skill rather than the whole folder keeps `~/.claude/skills/synced/` separate.

**3. Put repo-specific skills in the repo's `.claude/skills/`.** That is the one path that behaves the same in every session type: CLI, desktop Local and WSL, and cloud.

**4. Don't rely on claude.ai sync for skills you need in WSL desktop sessions** (SKILL-050).
- Keep claude.ai uploads for chat, Cowork and Local sessions.
- The same skill can then be listed twice in the terminal: once as personal, once as `anthropic-skills:<name>`. Fix that with `syncClaudeAiSkills: false` in the distro, or by not uploading those skills to claude.ai.

**5. Install plugins with the WSL CLI** (`claude plugin install …`). Desktop WSL sessions currently load them (SKILL-052).

**6. Verify each surface after app updates** (SKILL-054).

## [SKILL-057] Skill features that behave differently in the desktop app
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [Claude Code on desktop: What's not available](https://code.claude.com/docs/en/desktop), [#80696](https://github.com/anthropics/claude-code/issues/80696), [#93987](https://github.com/anthropics/claude-code/issues/93987), [#90460](https://github.com/anthropics/claude-code/issues/90460), [#91053](https://github.com/anthropics/claude-code/issues/91053)
- Related: SKILL-010, SKILL-054

Documented differences:
- No `/plugin` TUI. Use "+ › Plugins" or Customize instead.
- Terminal-dialog commands are unavailable or redirected.
- No agent teams.
- No `--print` or scripting.
- Desktop WSL sessions also lack connectors, the plugin UI, session forking and `@` file suggestions.

Reported in issues, without a maintainer fix:
- **`allowed-tools` grants never take effect** in the desktop app, so a skill's pre-approved commands still prompt (#80696, closed as not planned on 2026-10-09). Don't design desktop-used skills around `allowed-tools` silencing prompts.
- **`/reload-skills` reports "(no changes)"** for a skill added mid-session; a new session picks it up (#93987, open).
- **Typing `/<user-skill>` sometimes does nothing**, even though the model can still load the skill through the Skill tool (#90460, open).
- **Account skills are listed twice** in the menu, bare and prefixed (#91053, open).

Consequence: test skill behaviour that depends on slash invocation or permissions on the surface where it will run.

## [SKILL-058] Controlling claude.ai account skills on the desktop
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Settings reference: disableSideloadFlags](https://code.claude.com/docs/en/settings-reference), [Claude Code skills: restrict skill access](https://code.claude.com/docs/en/skills), [#101061](https://github.com/anthropics/claude-code/issues/101061)
- Related: SKILL-049, SKILL-014

The usual controls cover only part of the account skills in desktop sessions.
- **`syncClaudeAiSkills: false`** stops the terminal file sync and moves `synced/` to `.trash`. According to #101061 it does not stop the desktop app's delivery.
- **`skillOverrides`** doesn't apply, because desktop-delivered account skills arrive as a plugin.
- **`permissions.deny: ["Skill(anthropic-skills:<name>)"]`** blocks invocation. Their descriptions still use the listing budget: about 2.5k tokens for 17 skills in one report.
- **Managed `disableSideloadFlags`** keeps app-managed plugins, including account skills, out of Local sessions. It's an MDM or managed-file key, not a user setting.
- **Disabling a skill on claude.ai** (Customize › Skills) removes it from every surface. This is the most effective lever for personal accounts.

Context-cost consequence: on the desktop, account skills you never use in code sessions cost listing budget in every session and subagent. Prune them on claude.ai rather than in Claude Code settings.

---

## [SKILL-059] Personal Git marketplaces on claude.ai, synced into Claude Code
- Type: fact
- Applies to: claude.ai
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Plugins (claude.com docs)](https://claude.com/docs/plugins/overview), [Install plugins in Cowork](https://claude.com/docs/cowork/guide/plugins), [Plugin loading: synced plugins](https://code.claude.com/docs/en/plugins/loading)
- Related: SKILL-038, SKILL-034, SKILL-036, SKILL-050, SKILL-060, SKILL-062

An individual can add a Git repo as a plugin marketplace on claude.ai, and the plugins installed from it reach chat, Cowork and Claude Code. This replaces ZIP uploads (SKILL-038) for skills kept in git.

**Adding it**: Customize › Plugins › Add › Add marketplace, with a URL or `owner/repo`. GitHub and GitHub Enterprise work, plus public GitLab and Bitbucket repos. A private GitHub repo needs the Claude GitHub App to have access to it. Limits: 25 marketplaces, 500 plugins each, 512 MB repo archive.

**Updates**: **Check for updates** pulls the latest; for a github.com marketplace you can turn on **Sync automatically**.

**In Claude Code**: an account plugin downloads as `<name>@synced` the next time a session signed in with claude.ai starts (v2.1.273+); `/reload-plugins` loads it mid-session. Not in sessions authenticated by `ANTHROPIC_AUTH_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN` or `apiKeyHelper`, nor bare or `--safe-mode` sessions. `"<name>@synced": false` in `enabledPlugins` turns one off; `syncClaudeAiPlugins: false` turns them all off. A plugin with the same name from another origin wins over the synced copy.

**The other way**: plugins installed from the Claude Code command line stay on that machine and aren't added to the account.

**Not in cloud sessions**: synced plugins don't load in cloud sessions or routines (SKILL-060).

## [SKILL-060] Cloud sessions and routines don't load claude.ai marketplace plugins
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Plugin loading: synced plugins](https://code.claude.com/docs/en/plugins/loading), [Skills: Cowork and cloud sessions](https://code.claude.com/docs/en/skills), [Cloud environments: what carries over](https://code.claude.com/docs/en/cloud-environments), [Routines](https://code.claude.com/docs/en/routines), local test (routine runs 2026-10-12)
- Related: SKILL-048, SKILL-059, REPO-012, REPO-030, ORCH-017

A plugin installed from a claude.ai marketplace (SKILL-059) loads as `<name>@synced` only in Cowork and in terminal sessions signed in with claude.ai: "Synced plugins load in Cowork sessions and in terminal sessions where you sign in with your claude.ai account". Cloud sessions, which include every routine run, load only "the skills enabled for your claude.ai account" (enabled one by one) and the cloned repo's `.claude/skills/`. They also skip plugins from the repo's `enabledPlugins`/`extraKnownMarketplaces` and your user settings.

Observed: a routine whose prompt named `refresh-md-files` (shipped only in the `freek-skills` marketplace plugin) reported the skill unavailable. Its session config listed `account_plugins: []` and `account_skills: []`.

**Workaround that keeps one source of truth:** add the skills repo as an extra repository on the routine. The prompt then tells the run to read `skills/<name>/SKILL.md` from that clone, follow it exactly, and stop if the file is missing. Tested 2026-10-12: a private repo cloned fine through the Claude GitHub App, the run followed the skill's output format, and the prompt can ask the run to confirm it read the file. The alternatives are uploading the skill to claude.ai one by one (a second copy that drifts) or committing it to each target repo.

**Better, when the skill can live in a repo's `.claude/skills/`:** every attached repository's project skills load, not just the first one's. Tested 2026-10-14, routine run on Haiku 5.5 with osrs-tracker-web first and claude-kb second: the cwd was `/home/user`, each repo was cloned under it, and claude-kb's `.claude/skills/claude-kb-lookup` was listed at session start. `${CLAUDE_SKILL_DIR}` resolved to the clone, and `context: fork` ran. This is why `claude-kb-lookup` lives in claude-kb.

## Anatomy (continued)

## [SKILL-061] Literal `$` in a skill body: substitution and the backslash escape
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md), local tests 2026-10-12 and 2026-10-14
- Related: SKILL-008

Argument substitution (SKILL-008) also hits literal text whenever arguments are passed, so a skill that shows `$0` in an example breaks only when it's called with arguments. Put one backslash directly before the dollar sign to keep it literal: `\$0.05`, `\$ARGUMENTS`.

- **What gets substituted:** with arguments (`/name args`, or the model's Skill call with `args`), `$0` in a code block, in `awk '$0 ~ …'` or in a dollar amount like `$0.05` becomes the first argument. Without arguments they stay literal. Local test, 2026-10-12, v2.1.296 (FreekMencke/claude-kb#5).
- **The escape:** CHANGELOG 2.1.163, "added `\$` escape syntax to include a literal `$` before a digit in command bodies". The docs: "To include a literal `$` before a digit, `ARGUMENTS`, or a declared argument name, such as `$1.00` in prose, escape it with a backslash: `\$1.00`." A backslash before any other `$` is kept, a doubled backslash escapes nothing, and `${CLAUDE_*}` variables still expand.
- **Tested** 2026-10-14, v2.1.296, `claude -p --model haiku --max-turns 2 --max-budget-usd 0.30`, a project skill asking the model to copy a line verbatim (FreekMencke/claude-skills#50): `` X1=\$ARGUMENTS X2=\$0 X3=$(0) X4=`\$1` `` rendered as `` X1=$ARGUMENTS X2=$0 X3=$(0) X4=`$1` `` for both `/esc-test` and `/esc-test foo bar`. The backslash is removed either way, inside a code span too, so an escaped line reads the same with or without arguments.
- **In awk**, `$(0)` is the same field and isn't substituted. It reads more plainly than `\$0`; `claude-kb-lookup` uses it.

## [SKILL-062] Plugins on claude.ai: Claude Code frontmatter, custom skill paths, inline servers, names and versions
- Type: fact
- Applies to: claude.ai, Claude Code
- Confidence: single-source
- Last verified: 2026-10-15
- Sources: [Plugin structure and testing](https://claude.com/docs/plugins/build), [Plugin support by app](https://claude.com/docs/plugins/platform-support), [Plugins reference](https://code.claude.com/docs/en/plugins-reference), [Plugin loading: versions and updates](https://code.claude.com/docs/en/plugins/loading), local tests ([FreekMencke/claude-kb#116](https://github.com/FreekMencke/claude-kb/issues/116))
- Related: SKILL-002, SKILL-038, SKILL-059, SKILL-034, MCP-040, MCP-009

claude.ai's plugin upload accepts more than its standalone skill upload, and reads manifest keys its docs don't list. Tested 2026-10-15 with zips of our `kb-lookup` plugin, uploaded in the desktop app (Customize › Plugins › Add › Upload plugin):

- **Claude Code frontmatter:** a plugin skill with `context: fork`, `agent`, `model`, `background` and `argument-hint` uploaded and ran in chat, where a standalone upload rejects them (SKILL-002). Chat showed no fork: the tool calls appeared in the main chat.
- **Custom skill path:** with `"skills": ["./.claude/skills/"]` in `plugin.json` and no `skills/` folder, the plugin listed 1 skill. The claude.com docs list only `skills/<name>/SKILL.md`; in Claude Code the key "Adds to the default `skills/` scan".
- **Inline `mcpServers`:** a server declared in `plugin.json`, with no `.mcp.json`, showed on the Connectors tab. That keeps it out of a repo-root `.mcp.json`, which would also load as a project server in that repo's sessions.

So a repo can be its own plugin, with nothing copied: `.claude-plugin/marketplace.json` with `"source": "./"`, and the skill left in `.claude/skills/`.

- **Names:** `claude plugin validate` (v2.1.296) rejects a plugin named `claude-kb`: "A third party's plugin name cannot start with "claude-", "anthropic-", "anthropics-", or "cc-plugin-"".
- **Version:** "a manifest that pins `"version": "1.0.0"` keeps every user on the cached copy until its author changes the string, however many commits they push. To let users track commits instead, leave `version` out of both the manifest and the entry." Validation then warns about the missing version.

## [SKILL-063] Desktop WSL: synced plugins didn't load, a CLI install from the marketplace did
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-17
- Sources: local tests ([FreekMencke/claude-skills#77](https://github.com/FreekMencke/claude-skills/issues/77), [FreekMencke/claude-kb#164](https://github.com/FreekMencke/claude-kb/issues/164)), [Plugin loading: synced plugins](https://code.claude.com/docs/en/plugins/loading), [Desktop with WSL](https://code.claude.com/docs/en/desktop-wsl)
- Related: SKILL-050, SKILL-052, SKILL-059, SKILL-036, MCP-009, MCP-039

A plugin synced from claude.ai (`<name>@synced`, SKILL-059) didn't load in a desktop WSL session, like synced account skills (SKILL-050). The same plugin installed with the distro's CLI from its marketplace did. One session per case, on one machine.

Tested 2026-10-17, desktop Code tab on WSL (bundled CLI 2.1.295 or 2.1.299; which one ran wasn't checked), terminal v2.1.296, with our `kb-lookup` plugin:
1. **Synced:** `kb-lookup@synced: true` in the distro's `enabledPlugins`, the plugin downloaded under `~/.claude/plugins/synced/`. Neither its skill nor its MCP server loaded. The claude.ai connector's `mcp__<uuid>__kb_*` tools arrived late in the session (MCP-010).
2. **Marketplace name:** `claude plugin install kb-lookup@claude-kb` failed. The CLI registers a marketplace under the `name` in its `.claude-plugin/marketplace.json` (ours: `freek-kb`); `claude-kb` was only the claude.ai sync's name. `claude plugin marketplace add FreekMencke/claude-kb`, then `claude plugin install kb-lookup@freek-kb`, worked at user scope.
3. **CLI install:** in the next desktop WSL session the skill was listed once, as `kb-lookup:claude-kb-lookup`, though `kb-lookup@synced` was still `true`. With no user-scope `claude-kb` server, the tools were `mcp__plugin_kb-lookup_claude-kb__kb_*` (MCP-009), so allow rules naming `mcp__claude-kb__*` don't cover them.
4. **Auto-update** was off for `freek-kb`, as SKILL-036 says for third-party marketplaces, and was turned on with `"autoUpdate": true` on its `extraKnownMarketplaces` entry. Later that day the install was still at the commit it was installed from, two commits behind `main`: no update seen yet.

---

## Finding and vetting community skills

## [SKILL-064] Where to find community skills, and what each source reviews
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Publish to the directory: prepare for review](https://claude.com/docs/directory/publish), [claude-plugins-community README](https://github.com/anthropics/claude-plugins-community/blob/main/README.md), [Plugin security and trust](https://code.claude.com/docs/en/plugins/security), [Anthropic's marketplaces](https://code.claude.com/docs/en/plugins/anthropic-marketplaces), [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills), [its PR-labelling workflow](https://github.com/ComposioHQ/awesome-claude-skills/blob/master/.github/workflows/label-ready-skill.yml), [travisvn/awesome-claude-skills CONTRIBUTING](https://github.com/travisvn/awesome-claude-skills/blob/main/CONTRIBUTING.md), [BehiSecc/awesome-claude-skills](https://github.com/BehiSecc/awesome-claude-skills), [skills.sh about](https://skills.sh/about), [Skillselion FAQ](https://skillselion.com/faq), [SkillsMP about](https://skillsmp.com/about); stars from the GitHub API, 2026-10-23
- Related: SKILL-034, SKILL-041, SKILL-042, SKILL-065, SKILL-069, MCP-020, OSS-001

Only Anthropic's directory puts a person in the loop. skills.sh runs automated partner audits and drops a skill only if it fails all of them. The other lists and directories run no review: use them to find skills, not to trust them.

| Source | Review | Pinned |
|---|---|---|
| Anthropic directory, `claude-community` | "every version gets automated validation and a security scan, and a person reviews a new listing before it goes live" | Community, per the security page: "nearly every entry" is pinned by SHA, and Claude Code "refuses to install a different commit" |
| `claude-plugins-official` | "Most of what it lists comes from partners and other authors" | Per entry (not checked) |
| Third-party marketplaces | "Anthropic doesn't review third-party marketplaces" | Owner's choice |
| ComposioHQ list (77,710★) | A workflow labels a PR ready when it adds one alphabetical README link with no crypto keywords. The list opens with Composio's own product | No |
| travisvn list (15,513★) | PRs under "a basic 10 stars" are closed, and AI-written PRs are refused. Warns "Skills can execute arbitrary code". Last push 2026-04-28 | No |
| BehiSecc list (10,288★) | Fork and PR, no criteria; paid sponsors at the top | No |
| skills.sh (Vercel) | Listed on first `npx skills add`; "cannot guarantee the quality or security of every skill" | No |
| skillselion.com | "Do you check listings for security? Not ourselves." | No |
| skillsmp.com | A "map" of "3M+ skills" | No |

None of the three lists has a licence in the GitHub API or a LICENSE file (Composio's README claims Apache 2.0). Without a licence, copying is not allowed (OSS-001).

## [SKILL-065] Install counts and stars: what they measure
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [skills.sh about](https://skills.sh/about), [skills.sh FAQ](https://skills.sh/docs/faq), [skills.sh audits](https://skills.sh/audits), [Skillselion about](https://skillselion.com/about), [Skillselion research methodology](https://skillselion.com/research/methodology), [Skillselion security census 2026-08](https://skillselion.com/research/agent-skill-security-census-2026-08), [find-skills SKILL.md at a80e4c9](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/skills/find-skills/SKILL.md)
- Related: SKILL-064, SKILL-067, SKILL-069

An install count is the deduplicated count of `npx skills add` telemetry events: it doesn't count users or use. Stars are bookmarks. Neither says anything about safety, and both can be gamed.

- **skills.sh**: "Rankings come from anonymous, deduplicated install counts collected by the skills CLI when users opt in … Deduplication runs hourly to prevent artificial inflation."
  - In fact the CLI sends them unless you opt out (SKILL-067).
  - Plugin installs, clones, `install.sh` scripts and private GitHub repos are never counted.
- **Skillselion** ranks "installs first, then GitHub stars", taken from skills.sh.
  - "Install counts are cumulative registry install events, not active users. Bundle installs … count each bundled skill separately."
  - Its stars lag: the design page, dated 2026-10-22, gave taste-skill 84.6k, and the GitHub API gave 101,256 the next day.
- **Audit badges disagree.** skills.sh's `/audits` rated `design-mobile-apps` "Safe" (Gen) and "High Risk" (Snyk).
  - Skillselion's census of 2026-08-12 found "87.8% of listings have never been audited".
  - On "12.7% of the multi-rated set", one auditor said HIGH/CRITICAL where another said LOW/SAFE.
  - That is single-source: its CC BY 4.0 dataset wasn't recomputed.
- **Agents are taught to trust popularity.** The CLI's bundled `skills/find-skills/SKILL.md` says "Prefer skills with 1K+ installs. Be cautious with anything under 100".

Use the numbers to choose what to read first, never in place of reading (SKILL-069).

## [SKILL-066] `npx skills`: where it installs, its lock files, and `update`
- Type: tool
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [vercel-labs/skills at a80e4c9 (skills@1.7.4)](https://github.com/vercel-labs/skills/tree/a80e4c9d12d607631249d4d7d059f835d4b2f13a), read 2026-10-23: `src/add.ts`, `src/installer.ts`, `src/agents.ts`, `src/skill-lock.ts`, `src/local-lock.ts`, `src/update.ts`, `src/cli.ts`, `src/git.ts`, `docs/commands.md`; [vercel-labs/skills#954](https://github.com/vercel-labs/skills/issues/954); `npm view skills 'time[1.7.4]'`
- Related: SKILL-040, SKILL-067, SKILL-068

`npx skills add <source>` installs vercel-labs/skills, whose 1.7.4 was published 2026-10-19. It copies a skill to `.agents/skills/<name>` and symlinks `.claude/skills/<name>` to that copy. With `-g` it uses `~/.agents/skills` and `~/.claude/skills`, or `$CLAUDE_CONFIG_DIR/skills`; `--copy` makes plain copies. It writes no settings, hooks or plugins and runs no scripts. File modes are kept, so scripts stay executable.

- **Sources**: `owner/repo[@skill]`, git URLs, `.well-known/agent-skills` endpoints and archives. Without a ref, skills from `vercel`, `vercel-labs`, `heygen-com` and `remotion-dev` come from a skills.sh snapshot, not from git.
- **Lock files.** The global `~/.agents/.skill-lock.json` stores the skill folder's GitHub tree SHA. The project `skills-lock.json` stores a SHA-256 of paths and contents. Neither stores the commit. Both come from the same fetch as the files, so they catch later local edits, not an upstream swap. A restore doesn't check them.
- **Pin**: `owner/repo#<ref>` or a `/tree/<ref>/` URL. It accepts a full 40-character SHA and rejects abbreviated ones.
- **`skills update`** compares tree SHAs on the stored ref, or on HEAD, `main` or `master`. On a change it deletes the folder and re-runs `add -y`, with no diff and no confirm. A SHA pin never updates; a branch or tag pin follows the branch or tag.
- **`skills check`** shares `update`'s code (`cli.ts` 420–423) and reinstalls too. That contradicts `docs/commands.md`, "without reinstalling them", and #954 (open since 2026-04-17) reports it.

Read from source; not run.

## [SKILL-067] `npx skills`: telemetry, the advisory audit and agent mode
- Type: fact
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [vercel-labs/skills at a80e4c9 (skills@1.7.4)](https://github.com/vercel-labs/skills/tree/a80e4c9d12d607631249d4d7d059f835d4b2f13a), read 2026-10-23: `src/telemetry.ts`, `src/add.ts`, `src/source-parser.ts`, `src/sanitize.ts`, `skills/find-skills/SKILL.md`, `README.md`
- Related: SKILL-065, SKILL-066, SKILL-069

The CLI reports installs by default, and it shows partner audits that never block an install. When an AI agent runs it, it skips its confirm prompt.

- **Telemetry** goes as a GET to `https://www.skills.sh/tele/t`. It carries the CLI version, the detected agent and `ci=1` in CI, plus per event:
  - install: source, skills, agents, file paths, install URL;
  - remove;
  - update counts;
  - find: the query text.

  Any non-empty `DISABLE_TELEMETRY` or `DO_NOT_TRACK`, even `0`, turns it off, and so does the audit fetch; CI doesn't. A GitHub install is reported only if an unauthenticated API call says the repo is public.
- **Audit.** `add` fetches "Security Risk Assessments" (Gen, Socket, Snyk) from `https://www.skills.sh/tele/audit` for public GitHub repos, with a 3-second timeout. The code says it "never blocks installation" and is "advisory only". A person sees it before the "Proceed with installation?" prompt. No data, a timeout and telemetry off all look the same: no table.
- **Agent mode.** When the CLI detects an AI agent it sets `--yes`, so nothing is confirmed. `find-skills` offers `npx skills add <owner/repo@skill> -g -y` once the user agrees.
- **Sanitising.** `sanitize.ts` strips terminal escapes from names and descriptions. Nothing scans the SKILL.md body.

So run `npx skills add` yourself, or have the agent show the command first. Read from source; not run.

## [SKILL-068] Pinning and updating a community skill
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Marketplace reference: ref, sha, sha256](https://code.claude.com/docs/en/plugins/marketplace-reference), [Plugin security and trust](https://code.claude.com/docs/en/plugins/security), [Skills: symlinked folders, live change detection](https://code.claude.com/docs/en/skills), [taste-skill install.sh at 6010f91](https://github.com/Leonxlnx/taste-skill/blob/6010f91a9935f1c167dfc500fb1a475681892e6b/install.sh), local test
- Related: SKILL-035, SKILL-036, SKILL-066, SKILL-069, SKILL-070, SKILL-072, GHA-009

Pin a full commit, write down the SHA and the date you read it, and read the diff before you move the pin.

| Route | Pin | Update |
|---|---|---|
| Plugin, git source | A marketplace entry you control with `"sha": "<40 chars>"`. Claude Code installs it even if `ref` was deleted, "as long as the commit is still reachable" | Diff, then change `sha`; keep auto-update off (SKILL-036) |
| Plugin, `archive` source | `sha256`, which Claude Code enforces. It's independent only if you computed it from the copy you read | New digest after reading |
| `claude-community` | Anthropic pins "nearly every entry" | Leave auto-update off |
| `npx skills` | `owner/repo#<full sha>` | Diff, then re-add; `update` and `check` show no diff (SKILL-066) |
| Copy in `.claude/skills/` | Commit it with its source SHA | Diff upstream, copy, commit |

**The symlink trap.** Claude Code reads a symlinked skill folder's target and watches skill folders (except in bare mode). A `git pull` in a clone that `~/.claude/skills` links to therefore changes live instructions without review. taste-skill's `install.sh` is built for this: "this links instead of copying, so `git pull` updates every installed skill in place".

Tested 2026-10-23, v2.1.296, terminal `-p`, Haiku: a skill was invoked, its symlink target was edited with `sed`, and the next invocation in the same run returned the edited text.

Before moving a pin, check that history wasn't rewritten:

```bash
git -C <clone> fetch
git -C <clone> merge-base --is-ancestor <pinned-sha> origin/main && echo fast-forward
git -C <clone> log --oneline <pinned-sha>..origin/main -- <skill-dir>
git -C <clone> diff <pinned-sha>..origin/main -- <skill-dir>
```

A pin doesn't cover dependencies, `command` sources or run-time fetches (SKILL-072, SKILL-070).

## [SKILL-069] Vetting checklist for a community skill or plugin
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Plugin security and trust](https://code.claude.com/docs/en/plugins/security), [Plugin loading: Node.js package dependencies](https://code.claude.com/docs/en/plugins/loading), [Skills: allowed-tools and workspace trust](https://code.claude.com/docs/en/skills), [ripgrep GUIDE.md: Automatic filtering, 14.1.0](https://github.com/BurntSushi/ripgrep/blob/14.1.0/GUIDE.md#automatic-filtering) (accessed 2026-10-23), `npm view gsap@3.15.0 license`
- Related: SKILL-041, SKILL-010, SKILL-068, SKILL-070, SKILL-071, SKILL-072, SKILL-073, MCP-019, OSS-001, DSKILL-010, ANIMLIB-012

This extends SKILL-041. Check the owner and repo name letter by letter against the author's own site, then read every file at the commit you'll pin. Take behaviour from the code, not the README.

1. **Code that runs**: hooks, monitors, `.mcp.json`, mods, `bin/` (on the Bash tool's `PATH`), `scripts/`. Hooks, monitors and servers run outside the sandbox. Pin a downloaded binary by a hash you computed. A checksum file next to it only catches corrupt downloads.
2. **Later installs.** Plugin npm dependencies install from an exact lockfile, registry packages only, with `--ignore-scripts`. Anything else (Python, git dependencies, build steps) comes from a hook or script, so read those.
3. **Network**: every host, telemetry field, default and opt-out.
4. **Config writes and installs**: settings files, `claude mcp add`, and instructions to install other skills, plugins or servers. Treat each as stop-and-ask, and vet the target too.
5. **`allowed-tools`**, which workspace trust doesn't gate (SKILL-010).
6. **Instructions**: fetching URLs, running commands without asking, "ignore previous", hiding actions, reading files outside the skill.
7. **Hidden Unicode**: it reaches the model unchanged (SKILL-073).
8. **Licence**: no licence means you can't copy the skill (OSS-001). Check code it copies too: GSAP's licence is "Standard 'no charge' license", not OSI.
9. **Run-time content**: CDN scripts without SRI, a WebFetch of a branch URL or `llms.txt` on each run, `load_skill` (SKILL-070).

Greps for items 3, 4 and 7. ripgrep skips hidden and ignored files by default, so `--hidden --no-ignore` reaches `.mcp.json` and `.claude-plugin/`; `-g '!.git'` skips git's objects:

```bash
rg -n -i --hidden --no-ignore -g '!.git' 'https?://|curl|wget|fetch\(' <dir>
rg -n --hidden --no-ignore -g '!.git' 'settings(\.local)?\.json|claude (mcp|plugin) |npx skills add|enabledPlugins' <dir>
rg -n -P --hidden --no-ignore -g '!.git' '[\x{00AD}\x{180E}\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2064}\x{2066}-\x{2069}\x{FEFF}\x{E0000}-\x{E007F}]' <dir>
```

Tested 2026-10-23, ripgrep 14.1.0: without the flags, a URL in `.mcp.json` or a gitignored file and `settings.json` in `.claude-plugin/plugin.json` went unreported; with them, all were found.

## [SKILL-070] Anti-pattern: skill text fetched from a server at run time
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [skillselion-mcp 0.9.11 (npm)](https://www.npmjs.com/package/skillselion-mcp/v/0.9.11), [skillselion/skillselion-mcp](https://github.com/skillselion/skillselion-mcp), [Skillselion FAQ](https://skillselion.com/faq), [web-design-guidelines SKILL.md at 063bee9](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines/SKILL.md)
- Related: SKILL-068, SKILL-069, MCP-019, REPO-037, UIREV-004

Some tools pull skill text from a server whenever the agent asks. That skips every pin and review: the text can change between runs and reaches the context as instructions.

- **skillselion-mcp 0.9.11** (npm, published 2026-08-21, MIT). Its `index.js` was read in full but not run.
  - `load_skill` fetches a skill's files from `skillselion.com/api/skills/<id>/files`, or from GitHub `main` or `master`, into a temp folder. It returns "Read <dir>/SKILL.md and follow it", with no hash or commit check.
  - The server instructions say "DEFAULT TO LOADING … call load_skill FIRST" and "safe to over-ask". They call the skills "community-vetted", and the tool adds "Always verify the loaded skill against your project before trusting it". The site's FAQ says it doesn't check security itself.
  - Network: listings and "lessons" that bias ranking come from `skillselion.com/api/upstream`. A scrubbed query goes to `/mcp/demand`, which `DO_NOT_TRACK` or `SK_NO_DEMAND` turns off.
  - The user-run `setup` command runs `claude mcp add --scope user` and adds a SessionStart hook to `~/.claude/settings.json` that primes every session. Opt-in `--history` scans local Claude Code and Codex transcripts for keywords.
- **vercel-labs/agent-skills `web-design-guidelines`** says "Fetch fresh guidelines before each review" with WebFetch, from `web-interface-guidelines/main/command.md`, which "contains all the rules and output format instructions". Each review follows whatever that branch holds that day.

Install a reviewed, pinned copy instead (SKILL-068). For an MCP server, see MCP-019.

## [SKILL-071] What vetting catches in small animation and scroll kits
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [zubair-trabzada/scroll-cinematic-claude](https://github.com/zubair-trabzada/scroll-cinematic-claude), [prantikmedhi/motioncraft](https://github.com/prantikmedhi/motioncraft), [KailasMahavarkar/agentic-skills](https://github.com/KailasMahavarkar/agentic-skills); found with `gh search code "lenis" --filename SKILL.md`, 2026-10-23
- Related: SKILL-069, ACCESS-014, OSS-001

Three Lenis and "awwwards-style" scroll skills, found 2026-10-23 and read on their default branches, show what SKILL-069 catches. None had a licence, so none may be copied.

- **scroll-cinematic-claude** (76★):
  - Its "Step 0" runs a script that curls a static ffmpeg build from a third-party site, with no checksum, and executes it.
  - Its template loads Lenis from unpkg without SRI, and it has no reduced-motion handling.
  - It needs a paid image MCP.
- **motioncraft** (0★): its `install-*.sh` scripts copy into agent folders such as `.claude/skills/`. Its Lenis skill reads a plugin-root file, which an install of the skill alone wouldn't have.
- **agentic-skills** (2★): its `lenis-react` skill has GSAP ScrollTrigger code and an unpinned `npm install lenis`. It does handle `prefers-reduced-motion`.

Fonts, images and settings writes weren't checked. What Lenis does to scrolling is in ANIMLIB-009, ANIMLIB-010 and ANIMLIB-015, and community design skills are in DSKILL-001.

## [SKILL-072] What a plugin pin doesn't cover: dependencies and `command` sources
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Plugin dependencies](https://code.claude.com/docs/en/plugins/dependencies), [Plugin loading: when a command source re-runs](https://code.claude.com/docs/en/plugins/loading), [Marketplace reference: command source](https://code.claude.com/docs/en/plugins/marketplace-reference)
- Related: SKILL-068, SKILL-069, SKILL-036

A `sha` pins one plugin's own files. Two things around it still move.

**Dependencies.** A plugin's `dependencies` resolve separately.
- "Each dependency tracks the latest version its marketplace provides unless you declare a version constraint."
- With a range, it "installs at the highest git tag that satisfies this range", and the dependency's maintainer can tag new versions inside that range.
- `"name@marketplace"` or a `marketplace` field resolves in another marketplace. That only works if the root marketplace lists it in `allowCrossMarketplaceDependenciesOn`.

So read each dependency as a plugin of its own, and install it pinned yourself.

**`command` sources.** A marketplace entry can name "a shell command that prints the plugin directory's absolute path". Claude Code "shows users the whole string for review before it runs"; it is at most 500 printable ASCII characters. It runs again:
- on every install and update;
- "Once per session for each enabled command-sourced plugin, in the background … This run doesn't depend on the marketplace's auto-update setting or on `DISABLE_AUTOUPDATER`";
- when the cached version is missing.

`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` skips the background runs. The directory it prints can differ on every run, so review the tool the command calls as well as the string.

## [SKILL-073] Hidden Unicode in a skill body reaches the model
- Type: fact
- Applies to: Claude Code
- Confidence: unverified
- Last verified: 2026-10-23
- Sources: [claude-code CHANGELOG 2.1.277, 2.1.280, 2.1.284](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md), [Skills: characters a skill name can't hold](https://code.claude.com/docs/en/skills), local test
- Related: SKILL-069, MEM-019, REPO-037

Claude Code removes invisible Unicode from some inputs, but nothing documents doing so for a skill body, and a test shows it doesn't.

Documented:
- **Prompts**: invisible formatting and tag characters are "removed and the cleaned prompt is shown for review" (2.1.277; in VS Code also "from anything else before it is sent", 2.1.280).
- **MEMORY.md**: invisible characters are "neutralized … before they reach Claude" (2.1.284).
- **Skill names**: outside a plugin, a skill folder doesn't load when its name holds "a zero-width space".

The docs and the CHANGELOG through 2.1.309 say nothing about skill bodies or plugin files.

Tested 2026-10-23, v2.1.296, terminal `-p`, Haiku, with only the Write tool. A project skill's body held a zero-width space, an RLO override and two tag characters. The model wrote the lines to a file, and `od -c` showed all three byte sequences intact. So they reached the model. The same ripgrep pattern (SKILL-069) flagged all five test characters in a sample file and left the clean line alone; to reach hidden files such as `.mcp.json` it needs SKILL-069's `--hidden --no-ignore` flags.

Grep every text file in a skill before installing it. Text the model reads but you can't see is an injection channel.

## Recommendations for our setup

Reviewed on 2026-10-12: `roadmap-issues`, `parallel-code-orchestrator`, `refresh-md-files` and `skill-workshop`. Their source is now FreekMencke/claude-skills (SKILL-050, SKILL-056, SKILL-059).

**Done.** Recommendations 1–9 were applied on 2026-10-12: 1 in the global `~/.claude/CLAUDE.md`; 2–7 through roadmap [FreekMencke/claude-skills#1](https://github.com/FreekMencke/claude-skills/issues/1) (#2, #3, #4, #8); 8 and 12 for WSL Claude Code (`/skill-doctor` and `skillOverrides`, see kb-token-usage R8). Decisions from them that still hold:
- `freek-skills` (`skills/`) is installed on claude.ai from the marketplace with **Sync automatically** (SKILL-059), so it keeps to standard frontmatter until it's known whether claude.ai accepts Claude Code-only fields (Open questions). Claude Code-only skills go in `freek-local-skills` (`local-skills/skills/`), which is never installed on claude.ai.
- `claude-kb-lookup` lives in claude-kb (`.claude/skills/`) since 2026-10-14, not in claude-skills: it is the only skill that reads the KB, so a new topic and its routing land in one PR. As a project skill, a cloud session or routine with claude-kb attached can load it (SKILL-048, SKILL-060). Locally it comes from the `kb-lookup` plugin, replacing a personal-skill symlink: synced since 2026-10-15 (SKILL-062), and since 2026-10-17 also installed from the CLI as `kb-lookup@freek-kb`, because the synced copy doesn't load in desktop WSL sessions (SKILL-063). It reads the KB only through the MCP server (MCP-041).
- On the machine that uses `install.sh`, `"freek-skills@synced": false` in `enabledPlugins` stops every skill being listed twice.
- Don't set `syncClaudeAiSkills: false`. The only synced skills left are the 10 set to `name-only` (under 20 tokens each), so turning sync off saves almost nothing and drops the account skills from the terminal.

10. **Medium impact, low effort: test skill edits outside the desktop worktree session.** Desktop worktree sessions read `.claude/` from the main checkout (SKILL-053). `CLAUDE.md` and `.claude/rules/` still load from the worktree, so CLAUDE.md edits do take effect there.
11. **Low effort: keep the Windows-side `~/.claude` empty and work in WSL.** It currently holds no skills or plugins. Adding things there would create a second setup that only Local sessions and the pre-session `/` menu see (SKILL-051, SKILL-054).
12. **Done 2026-10-12: unused account skills pruned**: `name-only` in WSL Claude Code's `skillOverrides` (kb-token-usage R8), and `morning` and `import-memory` disabled on claude.ai. The rest are kept on purpose, since disabling one there removes it from every surface. SKILL-058, SKILL-005.
13. **Done 2026-10-23: third-party skills only as pinned, reviewed copies.** The global `~/.claude/CLAUDE.md` now says "Install third-party skills only pinned to a full commit, after reading every file; diff before moving the pin" ([FreekMencke/claude-kb#256](https://github.com/FreekMencke/claude-kb/issues/256)). SKILL-068, SKILL-069, SKILL-066, SKILL-070.
14. **Done 2026-10-23: SKILL-069 is a read-only vetting mode of `skill-workshop`** (decided on FreekMencke/claude-kb#260 over a skill of its own; FreekMencke/claude-skills#103, FreekMencke/claude-skills#104). SKILL-068 to SKILL-073.

## Open questions

- **Listing budget.** Is the 1% of the context window counted in characters or tokens, and what is the default `skillListingBudgetFraction`? The detailed settings entries weren't read. Answered in TOK-005 (from the settings and env-vars references): a character budget, `skillListingBudgetFraction: 0.01`, with an 8,000-character fallback; see INDEX.md, Conflicts.
- **Desktop WSL mechanism.** Which launch factor stops desktop WSL sessions from loading `~/.claude/skills/synced/`: the host-brokered auth, or something in the app's inline `--settings`? The bisect (SKILL-050) ruled out the CLI version, the entrypoint variable and `--setting-sources`. The inline settings could not be inspected, because reading the process command line was blocked as credential exploration.
- **Plugins in desktop WSL sessions.** Is it intended that they load (SKILL-052) when the docs say they don't, or will a later app build stop them loading?
- **Skill commands in the desktop Code tab.** Do `/skills` and `/context` work there? It's undocumented and wasn't tested. `/skill-doctor` doesn't, at least in desktop WSL sessions (SKILL-054).
- **Sync version.** The docs and the support article give v2.1.273 for terminal sync of claude.ai skills; the CHANGELOG entry is under 2.1.275.
- **`artifact-design`.** Where does this skill, present only in desktop sessions, come from? Partly answered in SURF-016: it is the built-in design skill bundled with the `Artifact` tool, present wherever artifacts are. Whether it can be overridden or disabled per project is tracked in `kb-surfaces.md` open questions.
- **`/skill-doctor` version.** The docs say v2.1.252+; the CHANGELOG lists it under 2.1.261.
- **Official marketplace submission.** The claude-plugins-official README points to a form; the Claude Code docs say the official marketplace takes no portal submissions and to use a partner contact.
- **`.agents/skills`.** Does Claude Code read the cross-tool `.agents/skills` directory? Not documented. The 2026-10-12 probe (FreekMencke/claude-kb#27) was blocked: auto mode refused writing a test `SKILL.md` under `.agents/skills/` in a scratch repo as `[Self-Modification]`. Run it by hand: a skill there that replies one word, then `claude -p --model haiku --max-turns 1 --max-budget-usd 0.50 "/<name>"`.
- **Trigger-only descriptions.** Does superpowers' finding (SKILL-013) hold on current models? It is single-source, with no controlled replication.
- **Forcing hooks.** Do hooks that force skill evaluation still help on current models (Opus 5.x, Sonnet 5.x)? All published measurements are on 4.5-era models or small N.
- **Claude Code-only frontmatter on claude.ai.** Does claude.ai accept, ignore or reject fields such as `context`, `agent` or `disable-model-invocation` in a skill that arrives through a marketplace plugin (SKILL-059) rather than a ZIP upload? Until tested, `freek-skills` keeps to standard frontmatter.
- **Auto-update for a third-party marketplace.** Does `"autoUpdate": true` on the `freek-kb` entry make Claude Code update `kb-lookup@freek-kb` to a newer commit (SKILL-063, SKILL-036)? Turned on 2026-10-17; no update seen that day. Check `gitCommitSha` for `kb-lookup@freek-kb` in `~/.claude/plugins/installed_plugins.json` against `main`.
- **ZIP size.** The claude.ai skill ZIP size limit is not stated anywhere found. Uploaded plugins may hold up to 5,000 files and 200 MB ([claude.com plugins platform support](https://claude.com/docs/plugins/platform-support), read 2026-10-14).
- **TOC threshold.** Anthropic's best-practices page says reference files over 100 lines need a TOC; skill-creator says over 300.
- **skills.sh server side.** What do the partner audits (Gen, Socket, Snyk) scan, and how often? The CLI receives `analyzedAt` but doesn't show it. Is "when users opt in" (skills.sh about page) wrong, or does the server drop events the CLI sends by default? Looked in: vercel-labs/skills at a80e4c9 (client only), skills.sh `/about`, `/docs`, `/docs/faq`, `/audits` (SKILL-065, SKILL-067).
- **`skills check`.** Is reinstalling on `check` intended, given docs/commands.md says "without reinstalling them"? It was read from source at a80e4c9, not run (SKILL-066).
- **Hidden Unicode in skill bodies.** Undocumented; a v2.1.296 test showed it reaches the model (SKILL-073). Does a later version strip it? Looked in: the skills, plugins security and plugins loading docs, and the claude-code CHANGELOG through 2.1.309.
- **"Anthropic verified."** What does the label on claude.com/marketplace/plugins require beyond the directory's scan and human review? The publish page doesn't say (SKILL-064).
- **Skillselion's hosted `/mcp`.** Does it behave like the npm client's `load_skill`? Only the npm package 0.9.11 was read (SKILL-070).
