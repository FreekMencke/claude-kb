# Writing, testing and distributing skills

Prefix `SKILL`. Researched 2026-10-12 against Claude Code 2.1.296. All "Last verified" dates are 2026-10-12. "Local CLI" means `--help` output or a command run on Claude Code 2.1.296 on that date.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What does Claude see of a skill before using it? | Only `name` + `description` (≈100 tokens each) in the skill listing; the body loads when the skill is invoked, bundled files only when read. | SKILL-004 |
| How long may a description be? | 1,024 chars on claude.ai, the API and the open spec. Claude Code truncates `description` + `when_to_use` at 1,536 chars in its listing. | SKILL-003, SKILL-005 |
| Why doesn't my skill trigger? | Vague description, no user-vocabulary keywords, listing budget overflow dropped it, broken YAML, or the task was too simple to need a skill. | SKILL-015, SKILL-005 |
| What goes in a description? | What it does + when to use it, third person, the words users type, and a "not for X" line for neighbouring skills. Don't summarise a multi-step workflow. | SKILL-011, SKILL-012, SKILL-013 |
| How big may SKILL.md be? | Under 500 lines / ~5k tokens; push detail into one-level-deep reference files and scripts. | SKILL-016, SKILL-017 |
| Skill, CLAUDE.md, hook, subagent or MCP? | CLAUDE.md = always-true facts; skill = on-demand procedure; hook = must-happen guarantee; subagent = isolated side task; MCP = access to external systems. | SKILL-021, SKILL-023 |
| How do I test that a skill triggers? | `claude plugin eval` with a `tool_used: Skill` grader, or skill-creator's `run_loop`; ~20 queries, half near-miss negatives, 3 runs each. | SKILL-026, SKILL-027, SKILL-028 |
| How do I show a skill helps? | Run the same prompts with and without it in fresh sessions; look at the score delta and the token/time cost. | SKILL-025, SKILL-026, SKILL-032 |
| Should I add a "forced skill evaluation" hook? | Not by default: no official endorsement, evidence is one author with small N, and it raises false positives. | SKILL-029 |
| How do I find skills that cost context but are never used? | `/skill-doctor`; `claude plugin details <name>` for a plugin's always-on cost. | SKILL-030 |
| How do I share skills with a team? | Commit `.claude/skills/`, or ship a plugin through a marketplace registered in `.claude/settings.json`; claude.ai org provisioning for non-CLI users. | SKILL-034, SKILL-038 |
| Why don't users get my plugin update? | A fixed `version` in `plugin.json` pins them until you bump it; auto-update is off for third-party marketplaces. | SKILL-035, SKILL-036 |
| Which frontmatter fields are portable? | `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. Everything else is Claude Code-only and rejected on claude.ai/API upload. | SKILL-002, SKILL-040 |
| Which published collections are worth studying? | anthropics/skills (skill-creator, docx/pdf), obra/superpowers (testing discipline), plugin-dev, trailofbits/skills. | SKILL-042 to SKILL-044 |
| How many skills is too many? | No official number; trigger accuracy measurably drops as the roster grows. Install few, prune with `/skill-doctor`. | SKILL-045, SKILL-005 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| SKILL-001 | Skill anatomy: folder, SKILL.md, scripts, references, assets | fact | anatomy |
| SKILL-002 | Frontmatter fields: open standard vs Claude Code extensions | fact | anatomy, frontmatter, portability |
| SKILL-003 | Name and description limits per surface | fact | frontmatter, limits |
| SKILL-004 | How Claude decides to load a skill (three levels) | fact | loading, progressive-disclosure |
| SKILL-005 | Claude Code skill-listing budget and truncation | fact | loading, context-cost |
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

---

## Anatomy and loading

## [SKILL-001] Skill anatomy: folder, SKILL.md, scripts, references, assets
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Agent Skills specification](https://agentskills.io/specification), [Claude Code skills](https://code.claude.com/docs/en/skills), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: SKILL-003, SKILL-014, SKILL-040

Fields from the open standard work everywhere. Claude Code adds many more, which claude.ai, the API and `package_skill.py` reject with a hard error.

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
- Last verified: 2026-10-12
- Sources: [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview), [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Agent Skills specification](https://agentskills.io/specification), [Claude Code skills](https://code.claude.com/docs/en/skills)
- Related: SKILL-002, SKILL-005

The limits differ by surface, so write to the strictest: a name of up to 64 characters and a description of up to 1,024.

| Limit | claude.ai / API | Open spec | Claude Code |
|---|---|---|---|
| `name` | ≤64 chars; lowercase letters, digits and hyphens; no XML tags; must not contain "anthropic" or "claude" | ≤64; no leading, trailing or double hyphen; must match the folder | Defaults to the folder name; names over 256 chars are ignored |
| `description` | 1–1,024 chars, no XML tags | 1–1,024 | Listing truncates `description` + `when_to_use` at 1,536 chars (`skillListingMaxDescChars`) |

History: Claude Code's per-entry listing cap was 250 characters at v2.1.86 and became 1,536 at v2.1.105. Community posts quoting "250 characters" are out of date.

## [SKILL-004] How Claude decides to load a skill (three levels)
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview), [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), [Claude Code skills](https://code.claude.com/docs/en/skills), [skill-creator SKILL.md](https://github.com/anthropics/skills/tree/main/skills/skill-creator)
- Related: SKILL-005, SKILL-011, SKILL-017

Skills load progressively, in three levels. Claude chooses a skill from its description alone.

1. **Metadata** (always loaded): the name and description of every skill, about 100 tokens each, sit in the system prompt.
2. **Body** (when triggered): in Claude Code, Claude calls the `Skill` tool and the rendered SKILL.md enters the conversation. Elsewhere, Claude reads the file with bash. The guideline is under 5k tokens.
3. **Resources** (as needed): Claude reads reference files or runs scripts. A script's source never enters context, only its output.

Consequences:
- Everything about *when* to use the skill must be in the description, because the body is unseen until the skill fires.
- According to skill-creator, Claude "only consults skills for tasks it can't easily handle on its own", so a one-step request ("read this PDF") may not trigger even a well-described skill.
- In Claude Code, typing `/name` at the start of a message invokes the skill directly. Permission rules use `Skill(name)` or `Skill(name *)`.

## [SKILL-005] Claude Code skill-listing budget and truncation
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Claude Code skills: "Skill descriptions are cut short"](https://code.claude.com/docs/en/skills), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: SKILL-003, SKILL-014, SKILL-030, SKILL-045

All skill descriptions share one listing budget, and a skill whose description is cut cannot be matched to a request. The budget "scales at 1% of the model's context window" (it was 2% at v2.1.32).

- The listing always keeps every skill name. On overflow, Claude Code drops descriptions, starting with the skills you invoke least.
- Each entry's `description` + `when_to_use` is capped at 1,536 chars whatever the budget.
- Settings:
  - `skillListingBudgetFraction` (e.g. `0.02`) raises the budget.
  - `SLASH_COMMAND_TOOL_CHAR_BUDGET` sets a fixed character budget.
  - `skillListingMaxDescChars` changes the per-entry cap.
- Diagnostics: `/context` shows the size after the budget is applied, `/doctor` estimates the listing cost, `--debug` warns on overflow, and `/skill-doctor` lists unused skills.

Practical upshot: every installed skill makes the others less likely to trigger. Front-load the key use case so truncation cuts the least useful words. The default value of `skillListingBudgetFraction`, and whether the 1% is counted in characters or tokens, were not confirmed (see Open questions).

## [SKILL-006] A loaded skill stays in context; compaction keeps 5k tokens of it
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Claude Code skills](https://code.claude.com/docs/en/skills)
- Related: SKILL-016, SKILL-023

An invoked SKILL.md enters the conversation as one message and stays there on every later turn. It is not re-read, so "every line is a recurring token cost". Invoking an unchanged skill again only adds a short "already loaded" note.

At auto-compaction, Claude Code re-attaches the most recent invocation of each skill:
- It keeps the first 5,000 tokens of each skill.
- All skills share a 25,000-token budget, filled starting with the most recently invoked skill. Older skills can drop out.

How to write for this:
- Put the rules that matter most in the first part of the body. A long skill loses its tail after compaction.
- Write standing instructions ("run the tests after every edit") rather than one-off steps you expect Claude to re-read.
- In long sessions, invoke the skill again after a compaction if behaviour drifts.

## [SKILL-007] Where Claude Code finds skills, precedence and reload
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [Plugin loading](https://code.claude.com/docs/en/plugins/loading), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: SKILL-033, SKILL-038

| Scope | Location |
|---|---|
| Enterprise | `.claude/skills/` in the managed-settings directory |
| Personal | `~/.claude/skills/<name>/SKILL.md` |
| Project | `.claude/skills/<name>/SKILL.md` (committed) |
| Nested | `<subdir>/.claude/skills/`, loaded once Claude touches files there; invoked as `/subdir:name` |
| Plugin | `<plugin>/skills/<name>/`, invoked as `/plugin:name` |
| claude.ai account | `~/.claude/skills/synced/` (one-way sync; see SKILL-038) |

- When names collide: enterprise beats personal, which beats project. A skill beats a `.claude/commands/` file with the same name. Plugin skills are namespaced and never collide.
- Edits to skill directories reload live. A newly created top-level `skills/` folder needs `/reload-skills`.
- Reserved folder names: `synced` and `anthropic-skills`.
- Cloud sessions don't see personal `~/.claude/skills`.

## [SKILL-008] Arguments, variables and `!` context injection
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: SKILL-002, SKILL-018

Custom slash commands were merged into skills in v2.1.3. `.claude/commands/x.md` still creates `/x`, and supports the same frontmatter except `name` and `paths`.

- **Arguments**:
  - `$ARGUMENTS` is the whole argument string.
  - `$ARGUMENTS[0]` or `$0` is a 0-based positional argument, split with shell-style quoting.
  - `$name` maps to the `arguments:` list.
  - If nothing consumes the arguments, `ARGUMENTS: <value>` is appended to the body.
- **Variables**:
  - `${CLAUDE_SKILL_DIR}` (use it to call bundled scripts), `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_SESSION_ID}` and `${CLAUDE_EFFORT}`.
  - In plugins also `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}`.
- **Injection**: !`git status` at line start, or a fenced block opened with ```` ```! ````, runs *before* Claude sees the skill and pastes its output in as plain text.
  - A non-zero exit aborts the invocation; append `|| true` to tolerate failure.
  - Commands go through permission rules, so pre-approve them in `allowed-tools`.
  - The `disableSkillShellExecution` setting turns injection off.
  - Skills synced from claude.ai never run `!` commands.

## [SKILL-009] `context: fork` and subagents that preload skills
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [Subagents](https://code.claude.com/docs/en/sub-agents)
- Related: SKILL-021

There are two ways to combine skills and subagents.

**A skill that runs as a subagent** (`context: fork`):
- The body becomes the prompt of a new subagent. `agent:` picks its type (default `general-purpose`).
- The subagent has no conversation history, so the body must be self-contained.
- Since v2.1.218 it runs in the background by default; set `background: false` to wait for its result.
- Use it only for skills with an explicit task. A guideline-only skill forked this way "returns nothing useful".

**A subagent that preloads skills** (`skills:` in the agent's frontmatter):
- It injects the full skill content at startup, up to the first 32 distinct names.
- It controls what is preloaded, not what is accessible. The subagent can still invoke other skills through the `Skill` tool unless `Skill` is removed from its tools.
- Skills with `disable-model-invocation: true` can't be preloaded.

Use a preloading reviewer agent when a checklist must always apply to that agent. Use `context: fork` when a skill's work would flood the main context.

## [SKILL-010] `allowed-tools` pre-approves; it does not restrict
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [skill-creator SKILL.md](https://github.com/anthropics/skills/tree/main/skills/skill-creator), [anthropics/skills docx skill](https://github.com/anthropics/skills/tree/main/skills/docx), [Enterprise skills guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise)
- Related: SKILL-011, SKILL-028

Anthropic's skill-creator says Claude "tends to undertrigger" skills, so descriptions should be "a little bit pushy". For example: "Make sure to use this skill whenever the user mentions dashboards, data visualization, internal metrics…".

The counterweight is a **negative trigger** for neighbouring skills. Anthropic's docx skill ends its description with "Do NOT use for PDFs, spreadsheets, Google Docs, or general coding tasks."

- Anthropic's enterprise guidance names the failure this prevents: a new skill whose description "is too broad, stealing triggers" from others. It says to test coexistence, not just the skill alone.
- Keep pushiness to *coverage* (more situations and synonyms). Capitalised commands are not the way (see SKILL-020).
- When two skills share vocabulary, give each a one-line boundary that names the other: "For benchmarked runs, use skill-creator instead."

## [SKILL-013] Don't summarise a multi-step workflow in the description
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [Extend Claude Code](https://code.claude.com/docs/en/features-overview)
- Related: SKILL-005, SKILL-015

| Control | Effect | Use for |
|---|---|---|
| `disable-model-invocation: true` | Only `/name` runs it. The description is removed from context (zero listing cost). Can't be preloaded into subagents. | Side-effecting skills (deploy, publish) and rarely used ones |
| `user-invocable: false` | Hidden from the `/` menu; Claude can still load it | Background knowledge skills |
| `paths: [globs]` | Auto-loads only when working on matching files | Language- or directory-specific conventions |
| `skillOverrides` setting: `on` / `name-only` / `user-invocable-only` / `off` | Changes visibility without editing SKILL.md (not for plugin skills) | Silencing bundled or third-party skills you don't use |
| `disableBundledSkills` / `CLAUDE_CODE_DISABLE_BUNDLED_SKILLS` | Drops Claude Code's own bundled skills | Small listing budgets |

These are Claude Code-only fields. Skills synced from claude.ai cannot carry them (SKILL-002), but the `skillOverrides` setting still works on them.

## [SKILL-015] Troubleshooting: not triggering, over-triggering, not followed
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Claude Code skills: Troubleshooting](https://code.claude.com/docs/en/skills), [skill-creator SKILL.md](https://github.com/anthropics/skills/tree/main/skills/skill-creator)
- Related: SKILL-005, SKILL-023, SKILL-026

**Doesn't trigger**
1. Ask "What skills are available?" or check `/skills`. If the skill is missing, check for YAML errors (`claude plugin validate <dir>`, `--debug`) and the folder location.
2. Run `/context`. The description may have been dropped by the listing budget.
3. Add the words users actually say. Test with a substantive prompt; trivial one-step tasks don't trigger skills.
4. Measure the effect of a change with `claude plugin eval` and a `tool_used: Skill` grader.

**Triggers too often**: make the description more specific, add a "not for X" line, use `paths:`, or set `disable-model-invocation: true`.

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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), [skill-creator SKILL.md](https://github.com/anthropics/skills/tree/main/skills/skill-creator)
- Related: SKILL-008, SKILL-016

Anthropic frames this as "degrees of freedom": a narrow bridge needs guard rails, an open field doesn't.
- **High freedom (prose)** when many approaches are valid.
- **Medium (pseudocode or parameterised scripts)** when a pattern is preferred.
- **Low (an exact script, "do not add flags")** for fragile or destructive operations.

Scripts are more reliable than generated code and cheaper: only their output enters context.

- **Say whether to execute or read**: "Run `scripts/analyze_form.py`" or "See `analyze_form.py` for the algorithm".
- **"Solve, don't defer."** Handle errors in the script and justify every constant.
- **Plan, validate, execute** for batch or destructive work: write a plan file, check it with a verbose validator, then apply it.
- **List dependencies.** Don't assume packages are installed: the API sandbox has no network.
- **Bundle repeated code.** If every test run writes the same helper, put it in `scripts/` (skill-creator).

## [SKILL-019] Durable wording: no dates, one term per idea, a default not a menu
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Extend Claude Code](https://code.claude.com/docs/en/features-overview), [Skills explained](https://claude.com/blog/skills-explained), [Steering Claude Code](https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more), [Output styles](https://code.claude.com/docs/en/output-styles)
- Related: SKILL-022, SKILL-023, SKILL-024

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
- Slash commands are now skills.
- A procedure longer than about 30 lines belongs in a skill, not in CLAUDE.md.
- They combine: a skill can teach an MCP server's query patterns, a subagent can preload skills, and a skill can register hooks.

## [SKILL-022] Context cost of each extension type
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Extend Claude Code](https://code.claude.com/docs/en/features-overview), [Subagents](https://code.claude.com/docs/en/sub-agents), [Memory](https://code.claude.com/docs/en/memory), local CLI `claude plugin details`
- Related: SKILL-005, SKILL-006, SKILL-030

| Mechanism | When it loads | Recurring cost |
|---|---|---|
| CLAUDE.md (+ `@imports`) | Session start, in full | Every request; imports don't save anything |
| Output style | Session start | Every request |
| Skill | Description at start; body when invoked | About 100 tokens per description; the body stays once loaded |
| MCP | Tool names at start; schemas deferred (tool search) | Low until used |
| Subagent | Its own fresh context | Isolated, but it counts toward usage limits |
| Hook | On its event | Zero unless it returns output |

Measure instead of guessing: `claude plugin details <plugin>` prints "Always-on" and "on-invoke" token estimates per component. For example, claude-md-management costs about 177 always-on tokens, and its claude-md-improver skill about 2.2k on invoke.

## [SKILL-023] Rules that must hold every time belong in hooks
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Extend Claude Code](https://code.claude.com/docs/en/features-overview), [Hooks guide](https://code.claude.com/docs/en/hooks-guide), [Memory](https://code.claude.com/docs/en/memory), [Claude Code skills](https://code.claude.com/docs/en/skills)
- Related: SKILL-015, SKILL-021

Skills, CLAUDE.md and output styles are advisory: "'never edit .env' in CLAUDE.md or a skill is a request, not a guarantee. A PreToolUse hook that blocks the edit is enforcement."

- A skill's outcome "can vary"; a hook "always fires on its event".
- Hook handlers can be `command`, `http`, `mcp_tool`, `prompt` or `agent`. Exit code 2 blocks a blockable event.
- A skill can declare `hooks:`. They apply from invocation to the end of the session, not before it.
- Split the work: put judgement and procedure in the skill, and the invariant (format check, forbidden path, required test run) in a hook.

## [SKILL-024] CLAUDE.md under 200 lines; move procedures into skills
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Memory](https://code.claude.com/docs/en/memory), [Steering Claude Code](https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more)
- Related: SKILL-021, SKILL-022

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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- **CI flags**: `--threshold`, `--max-cost-usd`, `--model`, `--trust-plugin`, `--json`. Pin `--model` "so a model rollout isn't mistaken for a plugin regression".
- **Reports**: the HTML report is published to claude.ai by default; `--no-publish` keeps it local.
- **Caveat**: it runs real sessions on your plan's usage.

## [SKILL-027] skill-creator: benchmarks and description optimisation
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Claude Code skills: Find unused skills](https://code.claude.com/docs/en/skills), [Monitoring usage](https://code.claude.com/docs/en/monitoring-usage), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md), local CLI
- Related: SKILL-005, SKILL-022, SKILL-032

- **`/skill-doctor`** (docs: v2.1.252+; the CHANGELOG lists it under 2.1.261) shows each loaded skill's context cost and how often it is invoked. It also lists plugins you haven't used recently and tells you where to switch skills off (`skillOverrides`). The interactive report is in `/plugin` › Stats.
  - It measures usage and cost only, not trigger accuracy or quality.
  - It excludes bundled and enterprise skills.
  - Don't confuse it with the community `skill-doctor` plugin.
- **`claude plugin details <name>`** gives the component inventory and always-on and on-invoke token estimates.
- **`/doctor`** estimates the cost of the skill listing. **`/doctor prompt-audit`** flags outdated prompting patterns.
- **OpenTelemetry** (`CLAUDE_CODE_ENABLE_TELEMETRY=1`):
  - The `claude_code.skill_activated` event carries `invocation_trigger` (`user-slash`, `claude-proactive` or `nested-skill`).
  - `skill.name` is an attribute on the cost and token metrics.
  - Custom skill names show only with `OTEL_LOG_TOOL_DETAILS=1`.
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
- **Unchecked harness artifacts.** Broken YAML, a same-name skill shadowing yours, an expired login, or a different roster size can each swing the numbers.
- **Testing only on Opus** when Haiku or Sonnet subagents will run the skill.

## [SKILL-032] Retire skills the model has outgrown
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Improving skill-creator](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills), [Plugin evals](https://code.claude.com/docs/en/plugin-evals), [Evaluating skills (agentskills.io)](https://agentskills.io/skill-creation/evaluating-skills)
- Related: SKILL-030, SKILL-019

Anthropic distinguishes two kinds of skill:
- **Capability uplift** teaches something the model can't yet do well. These can become unnecessary.
- **Encoded preference** captures your workflow and formats. These stay useful.

"If a base model passes evals without the skill loaded… the skill isn't broken, just no longer necessary."

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
- Last verified: 2026-10-12
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
- `claude plugin init <name> --with skills,agents,hooks` scaffolds a plugin in `~/.claude/skills/<name>/`. It loads next session as `<name>@skills-dir`.
- Name rules: no spaces, `@` or `:`. Names imitating Anthropic (`claude-*`, `anthropic-*`) are rejected.

## [SKILL-034] Marketplaces and team rollout
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Plugin loading](https://code.claude.com/docs/en/plugins/loading), [Host a marketplace](https://code.claude.com/docs/en/plugins/host-marketplace)
- Related: SKILL-035

**Auto-update**
- It runs in interactive sessions after the first message, with a random delay of up to 10 minutes. The new version loads at the next launch or on `/reload-plugins`.
- It is **on** by default for `claude-plugins-official` and marketplaces added from claude.ai.
- It is **off** for the community marketplace and every third-party or local marketplace. Turn it on with `autoUpdate: true` on the `extraKnownMarketplaces` entry, or in `/plugin` › Marketplaces. A marketplace owner can't force it from `marketplace.json`.

**Manual updates**
- `claude plugin update <plugin>` updates one plugin. There is no "update all" command.
- `claude plugin marketplace update` refreshes the listings only.

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
- Last verified: 2026-10-12
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

**`claude plugin tag [--dry-run] [--push]`** creates a `<name>--v<version>` tag after checking that `plugin.json` and the marketplace entry agree.

**Pre-publish checklist** (docs):
1. `validate --strict`.
2. Install from a local marketplace.
3. Run `claude plugin eval`.

The agentskills.io reference validator is `skills-ref validate ./my-skill`. In-session `/plugin validate` is not documented.

## [SKILL-038] claude.ai skills: upload, sharing, org provisioning, sync into Claude Code
- Type: fact
- Applies to: claude.ai
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude), [Provision skills for your organization](https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization), [Claude Code skills: synced skills](https://code.claude.com/docs/en/skills), [Plugin loading](https://code.claude.com/docs/en/plugins/loading)
- Related: SKILL-002, SKILL-007

**Upload**: Customize › Skills › + › Upload a skill, as a ZIP. The folder must match `name`, and only standard frontmatter fields are allowed.

**Sharing** (Team and Enterprise):
- Recipients get view-only access.
- "Publish to org" can require review. Since 2026-10-02 that is the default for Enterprise orgs that hadn't chosen.
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
- Last verified: 2026-10-12
- Sources: [Skills guide](https://platform.claude.com/docs/en/build-with-claude/skills-guide), [Enterprise skills guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise)
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

A research agent read that the `skills-2025-10-02` beta header is no longer required. A second agent couldn't confirm it (see Open questions).

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
- Last verified: 2026-10-12
- Sources: [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview), [Enterprise skills guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise), [Plugin security](https://code.claude.com/docs/en/plugins/security), [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- Related: SKILL-010, SKILL-037

"Only use skills from trusted sources." Installing a skill or plugin is installing software. "A Claude Code plugin you install can execute arbitrary code on your machine with your user privileges."
- Hooks, monitors, MCP and LSP servers and `bin/` run *outside* the permission sandbox.
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Claude Code skills (listing budget)](https://code.claude.com/docs/en/skills), [Extend Claude Code](https://code.claude.com/docs/en/features-overview), [Enterprise skills guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise), [Lung: plugin eval on 89 skills](https://dev.to/dexterlung/i-ran-claude-plugin-eval-on-89-skills-the-trigger-rate-fell-from-100-to-556-n29), [RoboRhythms: best Claude Code skills 2026](https://www.roborhythms.com/best-claude-code-skills-2026/)
- Related: SKILL-005, SKILL-030, SKILL-032

Every installed skill makes the others less likely to trigger and adds to the cost of every session. There are three sources of evidence:
- **Official.** The listing budget drops descriptions of rarely used skills, and overlapping descriptions mean "Claude may load the wrong skill or miss one that would help". Enterprise guidance says to "limit the number of Skills loaded simultaneously" and to stop adding skills when recall degrades.
- **Measured.** One author's skill triggered 9 of 9 times with 1 skill installed and 5 of 9 with 89 installed.
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
- Last verified: 2026-10-12
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

## Recommendations for our setup

Reviewed on 2026-10-12: `roadmap-issues`, `parallel-code-orchestrator`, `refresh-md-files` and `skill-workshop`. All four are claude.ai skills synced to `~/.claude/skills/synced/`. All pass `claude plugin validate --strict`.

| Skill | Lines | Words | Description chars |
|---|---|---|---|
| roadmap-issues | 203 | 1,757 | 295 |
| parallel-code-orchestrator | 211 | 2,846 | 259 |
| refresh-md-files | 49 | 556 | 306 |
| skill-workshop | 121 | 1,431 | 389 |

**What they already do well.** All four are under 500 lines and have descriptions under 1,024 chars. They give output templates and say what to output when there is nothing to report. They gate anything public or irreversible behind a go-ahead, name their sibling skill for out-of-scope work, and share one vocabulary (finding, proof, blocks/slows/minor). Keep all of this in any rewrite (SKILL-016, SKILL-019).

Ranked by impact versus effort:

1. **High impact, low effort: replace the roadmap section of the global `~/.claude/CLAUDE.md` with a pointer to the skill.** The section "Roadmap issues (work split over several issues)" restates the `roadmap-issues` workflow: creation order, sub-issues, blocked-by links and labels. That costs tokens in every session and gives the two copies a chance to drift. Keep one line ("Split work over several issues with the `roadmap-issues` skill") and any rule that must apply even when the skill doesn't load. (SKILL-024, SKILL-022)
2. **High impact, low effort: make `roadmap-issues` trigger on single follow-up issues.** The skill already covers "a single follow-up in another repo", but its description only mentions roadmaps and tracking issues. Add "or to open a follow-up issue in another repo". CLAUDE.md's "Cross-repo work becomes an issue" section could then shrink to the rule plus that pointer. (SKILL-011, SKILL-015)
3. **High impact, low effort: separate overlapping descriptions.** The pairs that collide:
   - `refresh-md-files` ("audit or refresh a README or CLAUDE.md") and the installed `claude-md-management:claude-md-improver` ("Audit and improve CLAUDE.md files").
   - `skill-workshop` and `skill-creator`. skill-workshop already names skill-creator; skill-creator is the one without a boundary.

   Add a "not for…" line on each side of every pair, or set the one you don't use to `skillOverrides: off`. (SKILL-012, SKILL-045)
4. **High impact, medium effort: move the skills' source into git and add evals.** Today their source of truth is claude.ai: there is no history and no review, and the sync is one-way, so local edits are lost. A private repo laid out as a skills-dir plugin (`claude plugin init`) would add three things:
   - History and review.
   - `claude plugin validate --strict` in CI.
   - `evals/` cases for `claude plugin eval`: 3 positive and 3 near-miss negative prompts per skill, the negatives drawn from the sibling skills, with a `tool_used: Skill` grader.

   Keep uploading the ZIP to claude.ai for the other surfaces. Constraint: anything synced through claude.ai must use standard frontmatter only, so `when_to_use`, `paths` and `disable-model-invocation` are not available while claude.ai is the distribution channel. (SKILL-026, SKILL-028, SKILL-037, SKILL-038, SKILL-041)
5. **Medium impact, low effort: update `skill-workshop` to the current tooling.** Specific changes:
   - Its "For measured test runs… use skill-creator" should also name `claude plugin eval` and `/skill-doctor`.
   - Step 6 should say that 1,024 chars is the upload limit, while Claude Code's listing truncates at 1,536 and can drop descriptions under budget pressure, so front-load the use case.
   - Add an overlap check against sibling skills' descriptions, and a warning not to summarise workflow steps in the description.
   - Add a note that synced skills can only carry standard frontmatter.

   (SKILL-003, SKILL-005, SKILL-013, SKILL-026, SKILL-030)
6. **Medium impact, low effort: trim the workflow out of the `parallel-code-orchestrator` description.** "…then integrate, verify and run the repo's reviewer agent" is the kind of step summary superpowers found agents follow instead of the body. Keep the outcome and the triggers. Then measure triggering and compliance before and after. (SKILL-013)
7. **Medium impact, medium effort: protect `parallel-code-orchestrator` against compaction.** At about 2,850 words (an estimated 3.8k tokens) it fits the 5k tokens kept per skill after compaction. But it shares the 25k re-attach budget with other skills, and it runs in the longest sessions. Keep the hard rules (one repo per run, model table, when to stop and ask) in the first screen. Consider moving the brief template, triage and handoff format to `references/` files that are read when those steps start. Check for staleness at each model release: the model-tier table names specific models. (SKILL-006, SKILL-017, SKILL-019, SKILL-032)
8. **Low effort: audit listing pressure.** The 26 synced skills alone carry about 14.7k characters of descriptions. Seven of them (docs, terminal, pptx, xlsx, computer-health-check, computer-use, docx) are each about 940–1,010 chars. Run `/skill-doctor` and `/context`, and set unused ones to `name-only` or `off`. (SKILL-005, SKILL-030)
9. **Check availability per surface.** In this desktop-app Code-tab session, none of the synced skills appeared in the skill listing; only plugin and bundled skills did. Sync needs a claude.ai OAuth sign-in and never reaches API-key or cloud sessions. So `roadmap-issues` and `parallel-code-orchestrator`, which refer to each other, may be silently missing on some surfaces. Confirm with `/skills` on each surface you use. (SKILL-038)

## Open questions

- **Listing budget.** Is the 1% of the context window counted in characters or tokens, and what is the default `skillListingBudgetFraction`? The detailed settings entries weren't read.
- **Missing synced skills.** Why did synced claude.ai skills not appear in this desktop Code-tab session: auth method, a `syncClaudeAiSkills` setting, or the surface? Not investigated.
- **`/skill-doctor` version.** The docs say v2.1.252+; the CHANGELOG lists it under 2.1.261.
- **Official marketplace submission.** The claude-plugins-official README points to a form; the Claude Code docs say the official marketplace takes no portal submissions and to use a partner contact.
- **Skills API beta header.** Is `skills-2025-10-02` still needed? One agent read it is not; another couldn't confirm.
- **`.agents/skills`.** Does Claude Code read the cross-tool `.agents/skills` directory? Not documented.
- **Trigger-only descriptions.** Does superpowers' finding (SKILL-013) hold on current models? It is single-source, with no controlled replication.
- **Forcing hooks.** Do hooks that force skill evaluation still help on current models (Opus 5.x, Sonnet 5.x)? All published measurements are on 4.5-era models or small N.
- **ZIP size.** The claude.ai skill ZIP size limit is not stated anywhere found.
- **TOC threshold.** Anthropic's best-practices page says reference files over 100 lines need a TOC; skill-creator says over 300.
