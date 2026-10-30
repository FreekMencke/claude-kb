# Engineering-discipline skill packs

Prefix `SKPACK`. This file covers the six most-starred engineering-method packs for Claude Code (obra/superpowers, mattpocock/skills, affaan-m/ECC, multica-ai/andrej-karpathy-skills, DietrichGebert/ponytail and addyosmani/agent-skills): what installing each runs and injects every session, what it sends over the network, what evidence backs it, and which of their ideas are worth borrowing into our own skills and CLAUDE.md files. It links rather than repeats: Superpowers' subagent flow (ORCH-041) and test-driven skill writing (SKILL-043), community prompt collections (PROMPT-037), terse-output skills such as Caveman (TOK-113), vetting a skill before install (SKILL-041, SKILL-069), test-first with an agent (JSTEST-017, FLOW-002) and the interview-then-spec workflow (FLOW-003).

Research basis:
- Researched 2026-10-30 in a cloud session, Claude Code v2.1.314, Opus 5.5 lead with a Sonnet reader on the packs' files.
- The lead shallow-cloned each repo and read it locally; nothing from them was installed or run. Commits: obra/superpowers `2ce8aa1` (2026-10-21, plugin 7.0.1), mattpocock/skills `a496f55` (2026-10-29, 1.3.2), affaan-m/ECC `b38be6a` (2026-10-29, 2.2.3), multica-ai/andrej-karpathy-skills `2c60614` (2026-04-20, 1.0.0), DietrichGebert/ponytail `96608e0` (2026-10-29, 5.3.3) and addyosmani/agent-skills `eb07f19` (2026-10-28, 0.6.14).
- Stars are from GitHub repository search on 2026-10-30. They are popularity signals that can be gamed; nothing here rests on them.
- Nothing was tested: running a pack means running its hooks, which the research rules exclude. Hook output was read from the hook scripts.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which engineering skill packs are most popular, and how do they differ? | Superpowers (309k stars) and ECC (293k) impose a whole workflow through hooks; mattpocock/skills (307k) is mostly user-invoked skills; ponytail (180k) is one always-on YAGNI mode; addyosmani/agent-skills (112k) is 25 lifecycle skills with no Claude Code hook; the Karpathy repo (227k) is one 65-line CLAUDE.md. | SKPACK-001 |
| What does each pack inject into every session? | Superpowers: its `using-superpowers` skill (3,192 characters) at startup, clear and compact. Ponytail: its ruleset plus a codebase map, on session and subagent start. ECC: 27 hook entries over 8 events, plus a Chrome DevTools MCP server. The other three: nothing. | SKPACK-002 |
| Which packs send data off the machine? | Superpowers loads a logo with its version from primeradiant.com by default (opt out with `SUPERPOWERS_DISABLE_TELEMETRY`). Ponytail writes a local CSV per turn and posts only if you set a webhook. ECC says it "never uploads diagnostics automatically". | SKPACK-003 |
| Does any pack have measured evidence? | Ponytail: its author's run (585 sessions, Opus 5.5) and JetBrains' 80 paired tasks (−15% code, −10.3% cost, no quality difference found). A third-party benchmark of eight setups, including Superpowers and ECC, found no significant lead over plain Claude Code. | SKPACK-004, SKPACK-005 |
| Should we install one? | No. Borrow four ideas instead: grilling in rounds, "end with what you skipped", pre-agreed test seams, and the PR door and blast-radius lines. | SKPACK-013 |
| How do I make Claude interview me well before building? | mattpocock's `grilling`: ask every unblocked question per round, each with a recommended answer that "yes" accepts, and send subagents for facts. | SKPACK-006, SKPACK-007 |
| How do I stop over-engineering? | Ponytail's ladder: does it need to exist, then reuse, stdlib, an installed dependency, one line, then the minimum, and name what was skipped. | SKPACK-008 |
| How do I stop agents writing useless tests? | Agree the test seams first and reject implementation-coupled, tautological and horizontally sliced tests (mattpocock `tdd`). | SKPACK-009 |
| What should a PR description say about risk? | A one-way or two-way door call and a one-word blast radius (mattpocock `pr`, after HumanLayer's `show-me`). | SKPACK-010 |
| Is the Karpathy CLAUDE.md worth adding? | Little: its four rules repeat what our CLAUDE.md files and PROMPT-031 already say, and the repo has no LICENSE file. | SKPACK-012 |
| What's "context load" vs "cognitive load"? | mattpocock's terms: always-loaded text costs the agent tokens; pointers move it out of context at the cost of a human knowing which file to reach for. | SKPACK-011 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| SKPACK-001 | Six engineering-discipline packs compared | comparison | superpowers, mattpocock, ecc, ponytail, karpathy, agent-skills |
| SKPACK-002 | What each pack runs and injects every session | fact | hooks, sessionstart, context, statusline |
| SKPACK-003 | Telemetry, network and paid tiers | fact | telemetry, privacy, network |
| SKPACK-004 | Ponytail's benchmark: what it shows and what it doesn't | fact | measurement, ponytail, yagni, tests |
| SKPACK-005 | Evidence for the other packs | fact | measurement, evals, claims |
| SKPACK-006 | Grilling: questions in rounds with a recommended answer each | pattern | interview, planning, questions, subagents |
| SKPACK-007 | interview-me: a hypothesis and a confidence number first | pattern | interview, planning, headless |
| SKPACK-008 | Ponytail's ladder, and ending with what was skipped | pattern | yagni, scope, output |
| SKPACK-009 | Tests at pre-agreed seams, and three test anti-patterns | pattern | tdd, tests, seams |
| SKPACK-010 | PR descriptions: door and blast radius | pattern | pull-requests, risk, documentation |
| SKPACK-011 | Context load against cognitive load | pattern | claude-md, skills, pointers |
| SKPACK-012 | The Karpathy CLAUDE.md: four rules we mostly have | fact | claude-md, karpathy, licence |
| SKPACK-013 | Borrow ideas, don't install a pack | recommendation | adoption, vetting, skills |

## [SKPACK-001] Six engineering-discipline packs compared
- Type: comparison
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [obra/superpowers](https://github.com/obra/superpowers/tree/2ce8aa1), [mattpocock/skills](https://github.com/mattpocock/skills/tree/a496f55), [affaan-m/ECC](https://github.com/affaan-m/ECC/tree/b38be6a), [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills/tree/2c60614), [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail/tree/96608e0), [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/eb07f19)
- Related: SKPACK-002, SKPACK-003, SKPACK-013, ORCH-041, PROMPT-037

Stars from GitHub search on 2026-10-30; skill counts are SKILL.md files in the plugin.

| Pack | Stars | Licence | What it is | Model-invocable? |
|---|--:|---|---|---|
| obra/superpowers 7.0.1 | 308,884 | MIT | A mandatory workflow: brainstorm, worktree, plan, subagent execution, TDD, review; 15 skills | Yes, and forced (SKPACK-002) |
| mattpocock/skills 1.3.2 | 306,841 | MIT | 27 plugin skills (grilling, tdd, pr, spec, triage…); 23 of the repo's 38 SKILL.md set `disable-model-invocation: true` | Mostly user-invoked |
| affaan-m/ECC 2.2.3 | 292,908 | MIT | "71 agents, 314 skills, and 98 legacy command shims, plus hooks, rules, memory…" | Yes |
| multica-ai/andrej-karpathy-skills 1.0.0 | 226,572 | README says MIT; no LICENSE file | One 65-line CLAUDE.md, also as one skill | Yes |
| DietrichGebert/ponytail 5.3.3 | 180,432 | MIT | One always-on "lazy senior dev" mode (lite, full, ultra) plus review and debt commands | On by hook |
| addyosmani/agent-skills 0.6.14 | 111,812 | MIT | 25 skills in six lifecycle phases, 9 commands, 4 agents | Yes |

The split that matters is how each gets into context: through a hook every session (Superpowers, ponytail, ECC), or only when a skill matches or is called (the rest).

## [SKPACK-002] What each pack runs and injects every session
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [superpowers hooks.json and session-start](https://github.com/obra/superpowers/tree/2ce8aa1/hooks), [ponytail plugin.json](https://github.com/DietrichGebert/ponytail/blob/96608e0/.claude-plugin/plugin.json), [ponytail-activate.js](https://github.com/DietrichGebert/ponytail/blob/96608e0/hooks/ponytail-activate.js), [ECC hooks.json](https://github.com/affaan-m/ECC/blob/b38be6a/hooks/hooks.json), [agent-skills CONTRIBUTING.md](https://github.com/addyosmani/agent-skills/blob/eb07f19/CONTRIBUTING.md)
- Related: SKPACK-001, SKPACK-013, SKILL-069, HOOK-001, PROMPT-004, BROWSER-006

Read from the hook files at the pinned commits; not run.

- **Superpowers:** a `SessionStart` hook (matcher `startup|clear|compact`) injects the whole `using-superpowers` SKILL.md (3,192 characters) inside `<EXTREMELY_IMPORTANT>`. It says: "If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill." Anthropic's best-practices page now says current models "follow a plainly worded line, and piling on emphasis mostly makes Claude over-apply the rule" (PROMPT-004).
- **Ponytail:** `SessionStart` (also on `resume`), `SubagentStart` and `UserPromptSubmit` hooks run Node scripts. The session hook emits the ruleset for the active level plus a codebase map (3 s budget; `PONYTAIL_MAP=0` turns it off). Until a status line is set, it appends text telling Claude to "Proactively offer to set this up" by adding a `statusLine` to your settings file: a config write to treat as stop-and-ask (SKILL-069 item 4). It also registers a mod (`band/register.tsx`).
- **ECC:** `hooks/hooks.json` holds 27 entries over 8 events (10 `PreToolUse`, 8 `Stop`), and `.mcp.json` runs `npx -y chrome-devtools-mcp@1.10.1` (BROWSER-006 on its telemetry), gated by the `hooks_enabled` option and a `minimal`/`standard`/`strict` profile.
- **addyosmani/agent-skills:** none. CONTRIBUTING.md: "The Claude Code plugin does not register it", to avoid "two routers for the same task".
- **mattpocock/skills, Karpathy:** no hooks.

## [SKPACK-003] Telemetry, network and paid tiers
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [superpowers README: Visual companion telemetry](https://github.com/obra/superpowers/blob/2ce8aa1/README.md#visual-companion-telemetry), [superpowers server.cjs](https://github.com/obra/superpowers/blob/2ce8aa1/skills/brainstorming/scripts/server.cjs), [ponytail plugin.json](https://github.com/DietrichGebert/ponytail/blob/96608e0/.claude-plugin/plugin.json), [ECC README](https://github.com/affaan-m/ECC/blob/b38be6a/README.md)
- Related: SKPACK-002, SKILL-069, DSKILL-015, BROWSER-006

- **Superpowers:** "By default, the Prime Radiant logo on brainstorming's optional visual companion feature is loaded from our website. It includes the version of Superpowers in use." The code requests `https://primeradiant.com/brand/superpowers-visual-brainstorming-logo.png?v=<version>`. Opt out with `SUPERPOWERS_DISABLE_TELEMETRY`; the README says it also honours Claude Code's telemetry opt-outs. Only the optional visual companion loads it.
- **Ponytail:** the `ledger` option defaults to `true` and writes each task's "cost, turns, agent time, tokens, reuse, tests" to `~/.config/ponytail/band/<project>.csv`. `webhookUrl` defaults to empty ("Empty: nothing leaves this machine"); if you set one, `sendNames` (default `true`) also sends each task's name or first prompt.
- **ECC:** "ECC never uploads diagnostics automatically." It sells ECC Pro, a hosted GitHub App ("Private repos from $19/seat/mo"), and its README warns: "Install ECC only from verified channels", because "Third-party re-uploads and unofficial mirrors" are not its own.
- **mattpocock/skills, Karpathy, addyosmani:** no network calls or telemetry found in a grep for URLs and `fetch`/`curl` in their skills; absence covers only the files grepped.

## [SKPACK-004] Ponytail's benchmark: what it shows and what it doesn't
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [ponytail 2026-10-07 agentic results](https://github.com/DietrichGebert/ponytail/blob/96608e0/benchmarks/results/2026-10-07-agentic.md), [JetBrains: ponytail tested](https://blog.jetbrains.com/ai/2026/07/ponytail-skill-claude-tested/)
- Related: SKPACK-008, TOK-113, JSTEST-017, TOK-083

The only pack with a published measurement, run by its author: "2026-10-07. Opus 5.5, default effort, Claude Code CLI 2.1.288", `claude -p` per task, 39 tasks, "5 per task and arm, 585 sessions", each in a fresh temp folder outside git; medians per task, geometric mean over tasks with 95% bootstrap intervals.

Ponytail 5 against no skill:
- Lines of code "-53% [-63..-41]", output tokens "-45%", cost "-26% [-36..-16]", time "-41%"; cheaper on "30 of 38 tasks".
- "A test where the logic needs one": 68% without, "98%" with. Injected bugs caught over all cells: 46% against "66%"; but where a test exists, 77% without against 69% with: more tests, each weaker.
- Correctness and safety: "Less code did not cost correctness or safety. It did not add any either: the three arms are level."
- Replies: a blind Sonnet 5.5 judge preferred no skill 106 to 82 ("p=0.09"), so not a clear win on readability.

Caveats: one model, the author's own tasks and judge; "Bash is disabled for every arm", and "Only the 18 surgical tasks have hidden checks". **Independent rerun:** JetBrains (80 paired SkillsBench tasks, `claude-sonnet-5` at medium, Claude Code 2.1.201, ponytail v4.8.4) measured "−15% code, −10.3% cost" against an advertised −54% and −20%, found "no quality difference", and saw "−31%" on big builds. Read it as "cuts code and cost without measured harm", not "better code".

## [SKPACK-005] Evidence for the other packs
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [agent-skills docs/comparison.md](https://github.com/addyosmani/agent-skills/blob/eb07f19/docs/comparison.md), [agent-skills evals](https://github.com/addyosmani/agent-skills/tree/eb07f19/evals), [superpowers README](https://github.com/obra/superpowers/blob/2ce8aa1/README.md), [Karpathy CLAUDE.md](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c60614/CLAUDE.md), [Tran: Claude Code tool benchmark](https://claude-tool-benchmark.pages.dev/preview/paper)
- Related: SKPACK-004, SKILL-043, TOK-113

- **addyosmani/agent-skills:** an in-repo eval harness (`evals/cases`, `evals/plugin`) checks which skill a prompt routes to, and `evals/skill-impact.md` is a ledger of description changes rejected on eval scores. Its only head-to-head is a reader's test that `docs/comparison.md` itself calls "one developer's single-task experiment, not a benchmark": about 8 against 12 minutes to code and 7 against 5 validation passes.
- **Superpowers:** `tests/` holds per-harness, hook and explicit-skill-request tests, and `docs/superpowers/specs/` has design notes (one on evals); no published outcome result. SKILL-043 covers its test-driven method for writing skills, which tests the skill text, not the user's results.
- **mattpocock/skills, ECC:** no outcome benchmark found in the repos.
- **Outside:** Tran (2026-05-12, self-published) ran eight setups, including Superpowers 5.1.0, ECC 1.10.0 and plain Claude Code, on claude-opus-4-7, 5 trials each, 5 judges: "no rank-1 lead is statistically significant", and the bare baseline was "top-1 on refactor".
- **Karpathy:** the CLAUDE.md states only its intended effects: "fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes."

Star counts are the main evidence the packs offer. TOK-113 shows how far an advertised saving can fall in an independent test (Caveman: 65% advertised, 8.5% measured).

## [SKPACK-006] Grilling: questions in rounds with a recommended answer each
- Type: pattern
- Applies to: Claude Code, claude.ai
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [mattpocock/skills grilling SKILL.md](https://github.com/mattpocock/skills/blob/a496f55/skills/productivity/grilling/SKILL.md), [grill-me SKILL.md](https://github.com/mattpocock/skills/blob/a496f55/skills/productivity/grill-me/SKILL.md)
- Related: SKPACK-007, FLOW-003, PROMPT-025, ORCH-024

`grill-me` is a seven-line user-invoked stub ("Call the Skill tool with \"grilling\"."); `grilling` (30 lines) holds the method:

- Map the plan as a **design tree**. The **frontier** is "every decision whose prerequisites are already settled". "Ask the whole frontier in one round: number each question and give your recommended answer."
- "Word each question so \"yes\" accepts your recommended answer."
- A question that depends on another open one "belongs to a _later_ round".
- "Finding _facts_ is your job, never the user's": dispatch a fresh-context subagent for anything in the environment, and don't block the rest of the round on it. "The _decisions_ are the user's."
- Done "when the frontier is empty"; "Do not act on it until the user confirms".

What it adds to FLOW-003's interview-then-spec: batching by dependency instead of one question at a time, a default answer per question so the user can approve fast, and a rule that facts are looked up, never asked. It fits the scoping step of a planning or orchestration skill.

## [SKPACK-007] interview-me: a hypothesis and a confidence number first
- Type: pattern
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [agent-skills interview-me SKILL.md](https://github.com/addyosmani/agent-skills/blob/eb07f19/skills/interview-me/SKILL.md)
- Related: SKPACK-006, FLOW-003, PROMPT-014

addyosmani's counterpart to grilling, aimed at intent rather than design decisions: "What people ask for and what they actually want are different things."

- When: the ask lacks "**who** the user is, **why** they want it, what **success** looks like, what the binding **constraint** is", or two values are in tension and the user hasn't picked.
- Method: write a hypothesis with a confidence number, then ask one question at a time, each with a guess, until about 95% confidence.
- Not when the ask is "unambiguous and self-contained", the user asked for speed, or it's a pure information request.
- "**Do not invoke in non-interactive contexts** like CI pipelines, scheduled runs, `/loop`, or autonomous-loop"; there, report the gap as a blocker instead of guessing.

The non-interactive rule is the piece to copy into any interviewing skill: PROMPT-014's unattended runs have nobody to answer. One question at a time is slower than grilling's rounds; grilling suits design trees, interview-me a vague single ask.

## [SKPACK-008] Ponytail's ladder, and ending with what was skipped
- Type: pattern
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [ponytail SKILL.md](https://github.com/DietrichGebert/ponytail/blob/96608e0/skills/ponytail/SKILL.md)
- Related: SKPACK-004, PROMPT-031, PROMPT-024, PROMPT-027

Ponytail's rules, which are separable from its hooks:

**The ladder,** "Take the first option that fully works":
1. "Does it need to exist?" Skip unrequested features "and name them in one line".
2. "Already in this codebase", used the way the surrounding code does.
3. "Standard library or a platform feature", unless the project has its own.
4. "An installed dependency? Use it. Never add a dependency for a few lines."
5. One line, if a reader gets it at a glance; otherwise 6. "the minimum code that works".

**Limits:** "Be lazy about the solution, never about the change itself": update callers, tests and fixtures. "Never cut: validation at trust boundaries, error handling that prevents data loss, security, accessibility…". New non-trivial logic "leaves one small test or an assert-based self-check". A known shortcut gets a `shortcut: <the limit>, <when to upgrade>` comment.

**The reply:** "End your reply with one or two lines: what you skipped or did not check, and any risk the user must know." Its benchmark's judge named this line as the main reason it preferred Ponytail 5's replies over v4.13's; against no skill the judge leaned the other way (SKPACK-004). PROMPT-027 and PROMPT-031 already ask for this; the borrowable part is only the fixed closing-line format.

The closing line complements PROMPT-027's evidence-before-claims: it reports what wasn't verified instead of implying everything was.

## [SKPACK-009] Tests at pre-agreed seams, and three test anti-patterns
- Type: pattern
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [mattpocock/skills tdd SKILL.md](https://github.com/mattpocock/skills/blob/a496f55/skills/engineering/tdd/SKILL.md), [superpowers test-driven-development SKILL.md](https://github.com/obra/superpowers/blob/2ce8aa1/skills/test-driven-development/SKILL.md)
- Related: JSTEST-017, FLOW-002, PROMPT-028, SKPACK-004, JSTEST-016

mattpocock's `tdd` skill:

- **Seams:** "Test only at pre-agreed seams. Before writing any test, write down the seams under test and confirm them with the user. No test is written at an unconfirmed seam." Each proposed seam gets a note on what it catches and misses.
- **Anti-patterns:**
  - "**Implementation-coupled**": mocks internals or checks through a side channel; "the test breaks when you refactor but behavior hasn't changed".
  - "**Tautological**": the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`), "so it passes by construction".
  - "**Horizontal slicing**": all tests first, then all code; bulk tests "verify _imagined_ behavior".
- **Loop:** "Red before green", one seam and one test per cycle, refactoring left to review.

Superpowers is stricter: "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST", and it deletes code written before its test. FLOW-002's all-tests-first recipe is "horizontal slicing" in this vocabulary; its upside is that committed tests make "don't edit the tests" checkable. JSTEST-017 says when test-first pays off at all. The seam agreement and the tautology check are the parts to borrow: they target the weak tests ponytail's benchmark measured (SKPACK-004) and the test gaming of PROMPT-028.

## [SKPACK-010] PR descriptions: door and blast radius
- Type: pattern
- Applies to: Claude Code, general
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [mattpocock/skills pr SKILL.md](https://github.com/mattpocock/skills/blob/a496f55/skills/engineering/pr/SKILL.md), [humanlayer show-me SKILL.md](https://github.com/humanlayer/skills/blob/main/plugins/show-me/skills/show-me/SKILL.md)
- Related: SKPACK-008, SKPACK-013

mattpocock's `pr` skill, credited to HumanLayer's `show-me`, writes a PR body led by the smallest visual summary of the change with before and after evidence, and two risk lines:

- **Door:** "Describe whether it's a one-way or two-way door. You can walk back through two-way doors, but not one-way doors. A PR that is cheap to roll back is lower risk. Changes that involve destructive actions or hard-to-reverse decisions are one-way doors."
- **Blast Radius:** "<one-word description>": "the potential impact or scope of the changes introduced by this PR. Consider all possibilities. Examples are layout shift, breakages for consumers, mobile responsiveness, etc."

Two lines cost a reviewer nothing to read and answer the question they ask first: how bad is it if this is wrong? They fit any PR template, and pair with ponytail's "what I skipped or didn't check" line (SKPACK-008) as the honesty section of a description.

## [SKPACK-011] Context load against cognitive load
- Type: pattern
- Applies to: Claude Code, claude.ai
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [mattpocock/skills writing-for-agents SKILL.md](https://github.com/mattpocock/skills/blob/a496f55/skills/productivity/writing-for-agents/SKILL.md)
- Related: REPO-044, MEM-001, TOK-005, PROMPT-015, SKILL-014, TOK-064

mattpocock's `writing-for-agents` (81 lines) names a trade-off our CLAUDE.md and skill rules make implicitly:

- "**Context load** is the cost of always-loaded material on the agent's window: an `AGENTS.md` line, a skill description, anything sitting in context every turn, spending tokens and attention whether or not it fires."
- "**Cognitive load** is the cost on the human: which documents exist and when to reach for each. The human is the index."
- "Material reached only through a pointer escapes context load at the price of the pointer's own line; material with no pointer at all rides entirely on cognitive load."

Use it when deciding where a rule goes (REPO-044): a line in CLAUDE.md pays context load every turn; a skill pays only its description (TOK-005), and a `disable-model-invocation` skill nothing (SKILL-014; 23 of mattpocock's 38); a doc with no pointer is free for the agent but only works if a person remembers it. The skill's other sections (information hierarchy, completion criteria, pruning) overlap PROMPT-015 and the skill-authoring entries.

## [SKPACK-012] The Karpathy CLAUDE.md: four rules we mostly have
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [andrej-karpathy-skills CLAUDE.md](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c60614/CLAUDE.md), [README](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c60614/README.md)
- Related: PROMPT-031, PROMPT-037, PROMPT-003, OSS-001

A third party's distillation of Andrej Karpathy's posts on LLM coding mistakes, not Karpathy's own file. Its plugin author is `forrestchang`. Four rules in 65 lines:

1. "Think Before Coding": "State your assumptions explicitly. If uncertain, ask."
2. "Simplicity First": "If you write 200 lines and it could be 50, rewrite it."
3. "Surgical Changes": "Every changed line should trace directly to the user's request."
4. "Goal-Driven Execution": "\"Fix the bug\" → \"Write a test that reproduces it, then make it pass\"".

These overlap scope rules we already keep (PROMPT-031, PROMPT-003) and the global CLAUDE.md, so adding the file would mostly duplicate. Licence: the README's License section says "MIT", but the repo at `2c60614` has no LICENSE file; under OSS-001 that's a weak grant, so quote its ideas rather than copying the file. The repo was last changed 2026-04-20.

## [SKPACK-013] Borrow ideas, don't install a pack
- Type: recommendation
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [obra/superpowers](https://github.com/obra/superpowers/tree/2ce8aa1), [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail/tree/96608e0), [affaan-m/ECC](https://github.com/affaan-m/ECC/tree/b38be6a), [mattpocock/skills](https://github.com/mattpocock/skills/tree/a496f55)
- Related: SKPACK-002, SKPACK-003, SKPACK-004, SKPACK-006, SKPACK-008, SKPACK-009, SKPACK-010, SKILL-069

Our judgement from the entries above; the packs make no claim about this.

**Don't install:**
- Superpowers and ECC replace our workflow wholesale and inject text through hooks every session (SKPACK-002), with no measured gain over plain Claude Code (SKPACK-005). ECC's surface (27 hooks, an MCP server, 314 skills, a paid tier) is the largest to vet.
- Ponytail has the best evidence (SKPACK-004), but its hooks also nudge settings writes and run a mod; its rules work without them.

**Borrow** (each is a few lines):
1. Grilling's rounds, default answers and "facts are looked up, never asked" (SKPACK-006) for the scoping step of planning and orchestration skills, with interview-me's no-interviews-when-unattended rule (SKPACK-007).
2. "End with what you skipped or did not check, and any risk" (SKPACK-008) as a reply rule.
3. Agreed test seams and the three anti-patterns (SKPACK-009) for test-writing rules.
4. Door and blast radius lines (SKPACK-010) for PR descriptions.

All six are MIT (Karpathy only by README). Copying a paragraph of wording, as opposed to the idea, keeps the MIT notice (OSS-001).

## Recommendations for our setup

Ranked by impact against effort.

1. **Add a reply rule to the global CLAUDE.md:** end a task's final report with what was skipped or not checked, and any risk the user must know (SKPACK-008, SKPACK-013). One line; it also covers PROMPT-027's honest-report concern. It replaces nothing and must not grow into a verification step (PROMPT-030).
2. **Add door and blast-radius lines to PR descriptions** in the global CLAUDE.md's PR guidance (SKPACK-010).
3. **Adopt grilling's round format in `parallel-code-orchestrator`'s and `design-workshop`'s scoping steps** (FreekMencke/claude-skills): batch unblocked questions with a recommended answer each, and send subagents for facts (SKPACK-006, SKPACK-007). Open: FreekMencke/claude-skills#138, with trigger evals if a description changes.
4. Done 2026-10-30: `angular-conventions`' Tests rules require literal expected values, never recomputed the way the code computes them (FreekMencke/claude-skills#137; SKPACK-009). Seam agreement was left out: the rules already limit tests to "complex or important logic", and no source measures what agreeing seams adds.
5. Decision: **no engineering pack installed** (SKPACK-013). Revisit if an independent benchmark shows one improving correctness, not only size or cost.

## Open questions

- **Ponytail on Opus and Fable 5.x on other people's tasks:** JetBrains' rerun used `claude-sonnet-5` and v4.8.4 (SKPACK-004).
- **Superpowers' and ECC's per-session token cost:** not measured, because measuring means running their hooks. Superpowers' injection is about 3.2k characters plus a wrapper; ECC's depends on its profile (SKPACK-002).
- **mattpocock/skills' install counts:** a DEV Community post says `grill-me` passed frontend-design as the second most-installed skill on skills.sh; skills.sh wasn't reachable from this session.
- **What ECC's 27 hooks do individually:** only counted by event and matcher, not read one by one.
