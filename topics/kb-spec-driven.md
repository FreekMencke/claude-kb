# Spec-driven development frameworks against plan mode

Prefix `SDD`. This file covers the spec-driven development (SDD) frameworks coding agents use (GitHub's Spec Kit, OpenSpec, BMad Method, GSD Core and Agent OS): their workflows, what each writes into a repo and installs into Claude Code, telemetry and supply-chain notes, the evidence for SDD, and whether any beats Claude Code's own plan mode with a `SPEC.md`. It links rather than repeats: explore, plan, implement, commit (FLOW-001), interview then write `SPEC.md` (FLOW-003), plan mode and plan files (FLOW-006 to FLOW-010), plan docs with an expiry (DOC-022), Spec Kit's row among ideas from other tools (ORCH-044) and cutting work into units (ORCH-024).

Research basis:
- Researched 2026-10-30 in a cloud session, Claude Code v2.1.314, Opus 5.5 lead with a Sonnet reader on the frameworks' docs.
- Read as raw text from shallow clones, not installed or run: github/spec-kit `2a23a84` (2026-10-29), Fission-AI/OpenSpec `6d04a1b` (2026-10-24), bmad-code-org/BMAD-METHOD `61e01f8` (2026-10-18), open-gsd/gsd-core `7d68e2b` (2026-10-30), gsd-build/get-shit-done `bdcaab2` (2026-05-31, archived) and buildermethods/agent-os `e892e61` (2026-10-07). Claude Code's best-practices page as `.md`.
- Versions from the registries: PyPI `specify-cli` 1.2.5 (2026-10-28), `npm view @fission-ai/openspec 'time[1.15.0]'` (2026-10-24), `npm view bmad-method dist-tags` (`latest` 6.12.4), `npm view @opengsd/gsd-core version` (1.19.0).
- Added the same day once the session's network allowed them: Birgitta Böckeler's article on martinfowler.com, the Thoughtworks Radar blip and Kiro's docs as `.md` (SDD-010, SDD-011), read as raw text.
- Stars from GitHub repository search on 2026-10-30; popularity signals only.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which SDD frameworks are popular? | Spec Kit (143,993 stars), OpenSpec (73,406), GSD (64,182, archived; now GSD Core, 11,019), BMad Method (54,763) and Agent OS (5,563). All MIT. | SDD-001 |
| What does Spec Kit add to a Claude Code repo? | Skills in `.claude/skills/speckit-<command>/`, model-invocable by default; event handlers in `.claude/settings.json`; `.specify/`; and a `specs/NNN-feature/` folder of several files per feature. | SDD-002 |
| What's worth borrowing from Spec Kit? | `converge`: audit the code against the spec and only append tasks; and `analyze`, a read-only cross-check before implementing. | SDD-003 |
| How is OpenSpec different? | Lighter: propose, apply, archive, with delta specs that merge into `openspec/specs/` on archive. Telemetry is on by default. | SDD-004 |
| What happened to GSD (get-shit-done)? | Archived; it "continues as **GSD Core**" (`@opengsd/gsd-core`). Its installer once pre-authorized `npx gsd-core`, an npm name owned by someone else; fixed in 1.17.0. | SDD-005 |
| Is BMad stable? | v6.12 is stable and frozen; v7 is a preview alpha whose "skills, install path, and docs change often"; its stated ETA of 2026-10-16 had passed by the README's 2026-10-18 commit. | SDD-006 |
| Does anyone say plan mode replaces SDD? | Agent OS v3: "Spec writing — Now best handled using Plan mode"; it retired its implementation and orchestration phases. | SDD-007 |
| Is there evidence SDD beats plan mode or no spec? | Thin and mixed. Uvik (vendor, 50 tickets): 40 to 42 merged with a spec against 36 without, inside its ±10-point noise band, with fewer review defects but more time; no gain on bug fixes or refactors. An ESEM 2026 study of 88,052 PRs supported none of five vendor claims. | SDD-008 |
| Should we adopt one? | No. Keep an interviewed `SPEC.md`, a fresh build session and a review against the spec; borrow `converge` as that review step. | SDD-009 |
| What's Anthropic's own spec workflow? | The best-practices page (rewritten by 2026-10-30): "Interview me until you could write the spec, then write it to SPEC.md"; build in a fresh session; "Review against your spec" with a subagent. | SDD-009 |
| What do independent reviewers say about SDD tools? | Böckeler (2025-10-15): a small bug became "4 'user stories' with a total of 16 acceptance criteria"; "I'd rather review code than all these markdown files". Thoughtworks Radar (2025-11-05): Assess, "lengthy spec files that are hard to review". | SDD-010 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| SDD-001 | Five SDD frameworks compared | comparison | spec-kit, openspec, bmad, gsd, agent-os |
| SDD-002 | What Spec Kit installs into a Claude Code repo | fact | spec-kit, skills, hooks, context |
| SDD-003 | Spec Kit's `converge` and `analyze`: audits that don't edit code | pattern | spec-kit, review, verification |
| SDD-004 | OpenSpec: delta specs, archive, and telemetry on by default | fact | openspec, telemetry, specs |
| SDD-005 | GSD moved to GSD Core, and the pre-authorized npm name | fact | gsd, supply-chain, permissions |
| SDD-006 | BMad Method: a stable v6 and a changing v7 | fact | bmad, versions, churn |
| SDD-007 | Agent OS v3 hands spec writing to plan mode | fact | agent-os, plan-mode |
| SDD-008 | Evidence for SDD against plan mode | fact | measurement, evidence, overhead |
| SDD-009 | An interviewed `SPEC.md`, a fresh session and a converge-style review | recommendation | plan-mode, spec, review, adoption |
| SDD-010 | Independent assessments: Böckeler (2025) and the Thoughtworks Radar | fact | evidence, thoughtworks, kiro, spec-kit, review |
| SDD-011 | Kiro's spec format: three files and EARS requirements | fact | kiro, ears, requirements, specs |

## [SDD-001] Five SDD frameworks compared
- Type: comparison
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [github/spec-kit](https://github.com/github/spec-kit/tree/2a23a84), [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec/tree/6d04a1b), [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD/tree/61e01f8), [open-gsd/gsd-core](https://github.com/open-gsd/gsd-core/tree/7d68e2b), [buildermethods/agent-os](https://github.com/buildermethods/agent-os/tree/e892e61)
- Related: SDD-009, ORCH-044, FLOW-001

| Framework | Version | Install | Flow | Writes |
|---|---|---|---|---|
| Spec Kit | `specify-cli` 1.2.5 (PyPI) | `uv tool install specify-cli`, then `specify init <project> --integration claude` | constitution, specify, plan, tasks, implement, converge; optional clarify, checklist, analyze | `.specify/`, `specs/NNN-*/` |
| OpenSpec | 1.15.0 (npm) | `@fission-ai/openspec` | `/opsx:propose`, `/opsx:apply`, `/opsx:archive` | `openspec/specs/`, `openspec/changes/<name>/` |
| BMad Method | 6.12.4 stable; v7 alpha | `npx bmad-method install` | Agile-style roles and workflows, now skills | `_bmad/` and docs folders |
| GSD Core | 1.19.0 (npm) | `npx @opengsd/gsd-core@latest` | discuss, plan, execute in parallel subagents, verify, ship | `.planning/` state files |
| Agent OS | 3.0 (2026-01-20) | A bash script | Standards discovery and injection; specs via plan mode | `agent-os/standards/` |

Weight in Claude Code, from the repos at the pinned commits:
- **GSD Core:** 64 agent files (35 distinct, plus compact variants), 72 command files and 29 hook scripts, some for Cursor and Windsurf.
- **Spec Kit:** 10 core command skills plus event handlers (SDD-002).
- **OpenSpec:** a handful of skills and commands.
- **Agent OS:** commands only.

All five are MIT.

## [SDD-002] What Spec Kit installs into a Claude Code repo
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [Spec Kit: Claude Code integration](https://github.com/github/spec-kit/blob/2a23a84/docs/integrations/claude.md), [Spec Kit quickstart](https://github.com/github/spec-kit/blob/2a23a84/docs/quickstart.md), [Spec Kit installation](https://github.com/github/spec-kit/blob/2a23a84/docs/installation.md)
- Related: SDD-003, TOK-005, HOOK-001, SKILL-069

From `docs/integrations/claude.md`:

- "Skills are installed as `.claude/skills/speckit-<command>/SKILL.md`."
- "By default every Spec Kit skill installed for Claude Code is model-invocable, so its description is always in Claude's context and counts toward the skill-listing budget. In projects with many skills this can push other skills out of the listing" (TOK-005). `--integration-options="--no-model-invocation"` writes `disable-model-invocation: true` into the core skills; extension skills stay model-invocable.
- "The integration supports native events through `.claude/settings.json`": hooks in the project's settings. `--events false` turns them off.
- Workflow steps call `claude -p`; "This adapter does not add a permission-bypass flag itself."

Paths: the quickstart's "Shorter path — for smaller features" is specify, plan, tasks, implement, converge. The "Full path — for production features" adds constitution (once), clarify, checklist and analyze.

To try it without the listing and hook cost: `specify init --integration claude --integration-options="--events false --no-model-invocation"`, then run the commands by name. Pin a release (`uv tool install specify-cli==<version>`); the installation page warns that reinstalling "keep[s] the installed version, even when a newer release exists".

## [SDD-003] Spec Kit's `converge` and `analyze`: audits that don't edit code
- Type: pattern
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [converge command template](https://github.com/github/spec-kit/blob/2a23a84/templates/commands/converge.md), [Spec Kit README](https://github.com/github/spec-kit/blob/2a23a84/README.md), [Spec Kit installation](https://github.com/github/spec-kit/blob/2a23a84/docs/installation.md)
- Related: SDD-009, FLOW-003, REPO-048, PROMPT-027, ORCH-039

Two Spec Kit steps work on their own, outside the framework:

- **`converge`**: "Assess codebase against artifacts and append remaining tasks". Its template: "**APPEND-ONLY, NEVER REWRITE**: The command's **only** write is appending a new" set of tasks to `tasks.md`. The loop: "Repeat implement and converge until convergence reports `Converged`."
- **`analyze`**: a read-only consistency check across spec, plan and tasks before implementing.

Why it's worth borrowing: the checker can't "fix" the gap itself, so it can't paper over a missed requirement. Its findings become tasks that the next implement pass picks up. That is Anthropic's own advice in another form: "use a subagent to review the rate limiter diff against SPEC.md, check every requirement is implemented and the listed edge cases have tests, report gaps" (Claude Code best practices). Pair it with REPO-048's verify-before-acting and PROMPT-027's evidence-before-claims.

A plain-prompt version for a session with a `SPEC.md`: "Compare the diff against SPEC.md. Don't edit code. List each requirement or edge case that is missing or untested as a task, or say Converged."

## [SDD-004] OpenSpec: delta specs, archive, and telemetry on by default
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [OpenSpec README](https://github.com/Fission-AI/OpenSpec/blob/6d04a1b/README.md), [OpenSpec concepts](https://github.com/Fission-AI/OpenSpec/blob/6d04a1b/docs/concepts.md)
- Related: SDD-001, DOC-022, SDD-002

**Flow:** `/opsx:propose <name>` creates `openspec/changes/<name>/` with `proposal.md`, `design.md`, `tasks.md` and delta `specs/`. `/opsx:apply` implements the tasks. `/opsx:archive` moves the change to `openspec/changes/archive/<date>-<name>/` and merges its deltas into `openspec/specs/`, the standing description of how the system works. Concepts: "Brownfield-first", with "Delta specs — specifications for what's being added, modified, or removed".

**Telemetry:** "OpenSpec collects anonymous usage stats. We collect only command names and version … Automatically disabled in CI." Opt out with `openspec config set telemetry.enabled false` ("unset means on"), `OPENSPEC_TELEMETRY=0` (which also turns off `openspec update`'s version check) or `DO_NOT_TRACK=1`.

**Its own comparisons:** Spec Kit is "Thorough but heavyweight. Rigid phase gates, lots of Markdown, Python setup"; Kiro is "locked into their IDE and limited to Claude models". Both are a competitor's description.

**Advice it gives:** "Clear your context before starting implementation", the same move as FLOW-003's fresh session. Its model advice ("Codex 5.5 and Opus 4.7") names older models than the current ones.

The archive-and-merge step is the idea with no plan-mode equivalent: specs that stay true after the change ships, instead of plan files that go stale (DOC-022).

## [SDD-005] GSD moved to GSD Core, and the pre-authorized npm name
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [gsd-build/get-shit-done README](https://github.com/gsd-build/get-shit-done/blob/bdcaab2/README.md), [GSD Core CHANGELOG 1.17.0](https://github.com/open-gsd/gsd-core/blob/7d68e2b/CHANGELOG.md), [GSD Core README](https://github.com/open-gsd/gsd-core/blob/7d68e2b/README.md)
- Related: SKILL-069, SDD-001, SKILL-041

The original repo (64,182 stars) is archived. Its README now says "GSD Has Moved", and the project "now continues as **GSD Core** in the Open GSD repository". The old npm package was `get-shit-done-cc`; the new one is `@opengsd/gsd-core` 1.19.0. No reason for the move was found in either repo.

GSD Core's CHANGELOG, 1.17.0 (2026-10-14): "Claude Code installs no longer pre-authorize `npx gsd-core` — the installer wrote a `Bash(npx gsd-core *)` allow rule, but GSD ships as `@opengsd/gsd-core` and the unscoped npm name belongs to a different owner, so Claude Code would run whatever was published under it without asking." Upgrades remove the rule.

Lessons for any installer:
- An allow rule for `npx <name>` trusts whoever owns that npm name. Pin the scope and version, or don't pre-authorize.
- A renamed package makes a supply-chain gap. Check the exact npm scope before installing (SKILL-069 item 4).

GSD Core itself is a large surface: 64 agent files, 72 commands and 29 hook scripts, including write, read, prompt-injection and secret-read guards. It is a framework to vet as a whole, not to try casually.

## [SDD-006] BMad Method: a stable v6 and a changing v7
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [BMAD-METHOD README](https://github.com/bmad-code-org/BMAD-METHOD/blob/61e01f8/README.md), [BMAD docs index](https://github.com/bmad-code-org/BMAD-METHOD/blob/61e01f8/docs/index.md)
- Related: SDD-001, SDD-008

BMad ("Breakthrough Method for Agile Ai Driven Development") ships on two lines, per its README: "The stable release is **v6.12**, installed by the npm installer and frozen aside from bug fixes. **V7** is in preview alpha on this branch: its skills, install path, and docs change often." npm `latest` was 6.12.4 on 2026-10-30.

- v6.12: `npx bmad-method install`.
- v7: installed as skills (`npx skills add …` or a Claude Code plugin marketplace), updated with `bmad setup`, which "runs `npx skills update`".

Its docs index concedes the overhead point: you can "never ask BMad to write a line of code, and a small fix can go straight to building with no planning at all."

For a repo that must stay reproducible, v7's moving install path is a reason to wait.

## [SDD-007] Agent OS v3 hands spec writing to plan mode
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [Agent OS CHANGELOG 3.0](https://github.com/buildermethods/agent-os/blob/e892e61/CHANGELOG.md)
- Related: SDD-009, FLOW-001, FLOW-006, REPO-044

Agent OS 3.0 (2026-01-20) is the clearest statement from inside the SDD camp that plan mode now covers most of it:

- "Claude Code's plan mode, extended thinking, and improved models now handle much of the scaffolding that earlier versions provided":
  - "**Spec writing** — Now best handled using Plan mode"
  - "**Task breakdown** — Tools like Claude Code automatically create and track todo lists"
  - "**Implementation orchestration** — Frontier models manage task delegation on their own"
- "Implementation/orchestration phases retired—frontier models handle this well on their own now".
- What it kept: "establishing and injecting standards". `/discover-standards` writes `agent-os/standards/`, `/inject-standards` puts the relevant ones into a plan, and `/shape-spec` "enhances plan mode by prompting targeted questions that consider your standards and product mission".

Its kept part is what CLAUDE.md, rules files and skills already do (REPO-044). Its retired parts are what FLOW-001 and FLOW-006 cover. The framework's own retreat supports SDD-009.

## [SDD-008] Evidence for SDD against plan mode
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [Spec Kit quickstart](https://github.com/github/spec-kit/blob/2a23a84/docs/quickstart.md), [BMAD docs index](https://github.com/bmad-code-org/BMAD-METHOD/blob/61e01f8/docs/index.md), [Agent OS CHANGELOG](https://github.com/buildermethods/agent-os/blob/e892e61/CHANGELOG.md), [Uvik: SDD benchmark 2026](https://uvik.net/blog/spec-driven-development-benchmark/), [ESEM 2026: Specification artifacts in open-source PR workflows](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.ESEM.2026.84)
- Related: SDD-009, SDD-003, SDD-010

No controlled comparison of an SDD framework against plan mode was found. Two measurements exist against no spec:

- **Uvik** (a vendor, "Last updated: October 8, 2026", 50 Python tickets, human review): merge rate Spec Kit 80% (40/50), Kiro 82%, BMAD 82%, OpenSpec 84% (42/50), "No spec (control) 72% (36/50)", with "The noise band on merge rate is plus or minus 10 percentage points". Review defects per merged ticket: 0.39 to 0.57 with a spec against 0.86 without; median minutes to merge 36 to 55 against 29. A spec "did not pay for itself on bug-fix, refactor, or test-writing tickets".
- **ESEM 2026** (88,052 PRs, 119 repos): "None of the five hypotheses are supported". It measures specification artifacts in PRs (mostly ticket references), not SDD tools.
- A single-run Medium test (search text only): OpenSpec about 57.7k tokens against Spec Kit's 121k.
- Independent qualitative write-ups exist (SDD-010); neither measures outcomes.

What the frameworks concede themselves:
- Spec Kit has a "Shorter path — for smaller features".
- BMad: "a small fix can go straight to building with no planning at all".
- OpenSpec positions itself against "Rigid phase gates".
- Agent OS retired its spec and orchestration layers (SDD-007).

So the overhead on small changes is agreed. On larger features, one vendor measured a modest gain inside its own noise band.

## [SDD-009] An interviewed `SPEC.md`, a fresh session and a converge-style review
- Type: recommendation
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [Claude Code best practices](https://code.claude.com/docs/en/best-practices), [Spec Kit converge](https://github.com/github/spec-kit/blob/2a23a84/templates/commands/converge.md), [Agent OS CHANGELOG](https://github.com/buildermethods/agent-os/blob/e892e61/CHANGELOG.md)
- Related: FLOW-003, FLOW-001, SDD-003, SDD-004, SDD-007, SDD-008, FLOW-006

Our judgement from the entries above.

**Don't adopt a framework.** Anthropic's best-practices page, rewritten by 2026-10-30, already describes a spec-driven workflow in one file:
1. "Interview me until you could write the spec, then write it to SPEC.md."
2. "Once `SPEC.md` exists, start a fresh session to build from it".
3. "use a subagent to review the rate limiter diff against SPEC.md, check every requirement is implemented and the listed edge cases have tests, report gaps" ("Review against your spec"). FLOW-003 quotes the page's older wording.

The frameworks add files, hooks, skill listings and, for two of them, telemetry (SDD-002, SDD-004, SDD-005), for gains measured once, by a vendor, inside its noise band, and absent on small changes (SDD-008). One of them now defers to plan mode (SDD-007).

**Borrow:**
- `converge`'s rule for the review step: the checker doesn't edit code, it appends missing work as tasks or says "Converged" (SDD-003).
- A durable "constitution" is what CLAUDE.md already is; keep feature specs out of it.
- OpenSpec's delta-and-archive idea only for a long-lived product whose behaviour must stay documented (SDD-004). For our repos, DOC-022's dated plan docs suffice.

## [SDD-010] Independent assessments: Böckeler (2025) and the Thoughtworks Radar
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [Böckeler: Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl (martinfowler.com, 2025-10-15)](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html), [Thoughtworks Technology Radar: Spec-driven development (2025-11-05)](https://www.thoughtworks.com/radar/techniques/spec-driven-development)
- Related: SDD-008, SDD-009, SDD-011, ORCH-044

The two independent write-ups found; both predate Spec Kit 1.0 and say the tools change fast.

**Birgitta Böckeler** (Thoughtworks, on martinfowler.com, 2025-10-15) tried Kiro, Spec Kit and Tessl:
- Three levels: spec-first, spec-anchored, spec-as-source. "All SDD approaches and definitions I've found are spec-first", and the maintenance strategy over time is often "vague or totally open".
- Kiro on a small bug "was like using a sledgehammer to crack a nut": "4 'user stories' with a total of 16 acceptance criteria".
- Spec Kit "created a LOT of markdown files for me to review … I'd rather review code than all these markdown files."
- "False sense of control?": "I frequently saw the agent ultimately not follow all the instructions". Spec Kit's research notes on existing classes were taken "as a new specification", which duplicated them.
- "I'm very skeptical that lots of up-front spec design is a good idea, especially when it's overly verbose."

**Thoughtworks Radar** (published 2025-11-05, ring **Assess**; "not on the current edition"): "the workflows remain elaborate and opinionated … some generate lengthy spec files that are hard to review". It adds: "We may be relearning a bitter lesson — that handcrafting detailed rules for AI ultimately doesn't scale."

Both support SDD-009: small iterative steps with a short spec, not a framework's artifact set.

## [SDD-011] Kiro's spec format: three files and EARS requirements
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [Kiro: Specs](https://kiro.dev/docs/specs.md), [Kiro: Requirements-First workflow](https://kiro.dev/docs/specs/feature-specs/requirements-first.md)
- Related: SDD-001, SDD-010, FLOW-003

AWS's Kiro is an agent product with spec-driven development built in. Its docs now list "the Kiro IDE, the Kiro CLI, on the web, on mobile (iOS)".

- "Every spec generates three key files": "**requirements.md** (or **bugfix.md**) - Captures user stories, acceptance criteria, or bug analysis in structured notation"; "**design.md** - Documents technical architecture, sequence diagrams, and implementation considerations"; "**tasks.md** - Provides a detailed implementation plan with discrete, trackable tasks".
- Bugfix specs record "current/expected/unchanged behavior" in `bugfix.md`, a lighter path than a feature spec for the small-bug case Böckeler hit (SDD-010).
- Requirements use EARS: "System behaviors in EARS format (WHEN...THE SYSTEM SHALL...)", for example "WHEN a user submits valid registration data".
- The specs page also lists Quick Spec, parallel task execution, "Analyze Requirements" and a "Correctness (property-based testing)" check (IDE only).

What transfers to a `SPEC.md` in Claude Code (FLOW-003): one acceptance criterion per line in "WHEN … THE SYSTEM SHALL …" form gives a reviewer subagent something to check each change against (SDD-003). Bug specs that say what must stay unchanged also tell the reviewer what not to break.

## Recommendations for our setup

Ranked by impact against effort.

1. Decision: **no SDD framework** (SDD-009). Plan mode, `SPEC.md` and a fresh build session cover it. Revisit if an independent test shows a framework beating that workflow.
2. Done 2026-10-30: `parallel-code-orchestrator`'s review has a spec check: it compares the diff with the issue, the user's spec or the stated task without editing, lists missing work as tasks and skips style (FreekMencke/claude-skills#137; SDD-003, SDD-009).
3. **If anyone tries OpenSpec, set `OPENSPEC_TELEMETRY=0`**; Spec Kit with `--events false --no-model-invocation` (SDD-002, SDD-004).

## Open questions

- **Tessl:** Böckeler covers it (SDD-010) but it wasn't read here.
- **Uvik's model and method details:** the results table was read; its model and task list weren't checked (SDD-008).
- **Why GSD moved to GSD Core:** neither repo says (SDD-005).
- **Spec Kit's event handlers in `.claude/settings.json`:** which events and commands they register wasn't traced (SDD-002).
