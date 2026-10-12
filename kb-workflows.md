# Session workflows

Prefix: FLOW. Last verified for all entries: 2026-10-12, on Claude Code v2.1.296 and the docs live that day. This file covers how one session gets a correct result: the recommended workflows, plan mode, verifying inside the loop, safety nets, recovering a stuck session, waiting on external work, and steering mid-task. Linked, not repeated: multi-agent patterns (ORCH), session cost levers (TOK-030 to TOK-034), scheduled runs (ORCH-017), verification by a separate reviewer (ORCH-039), CI on conflicting PRs (SESS-021, SESS-022), Stop hooks that keep Claude working (HOOK-031). The desktop app's notifications and CI monitor are covered as features in `kb-surfaces.md` (SURF-002, SURF-020); here only as ways to wait.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What workflow does Anthropic recommend? | Explore in plan mode, plan, implement while running checks, commit. Skip the plan when you could describe the diff in one sentence. For larger features, have Claude interview you, write a spec, and run it in a fresh session. | FLOW-001, FLOW-003, FLOW-005 |
| What is the single biggest lever for a correct result? | Give Claude a check it can run (tests, build, lint, a screenshot to compare) and ask for evidence, not a claim. "It's the difference between a session you watch and one you walk away from." | FLOW-011, FLOW-015 |
| How do I make Claude keep going until a check passes? | In one prompt ("run the tests and fix failures"); across a session with `/goal <condition>`; deterministically with a Stop hook; or with a separate reviewer. Each step trades setup for attention. | FLOW-011, FLOW-012, HOOK-031, ORCH-039 |
| Is plan mode read-only? | For edits, yes until you approve. Shell commands still run: with auto mode available, the classifier approves them instead of prompting (`useAutoModeDuringPlan`, default on). Plans are files in `~/.claude/plans/`. | FLOW-006, FLOW-008 |
| Which model and effort should I plan with? | No official advice. Plan on the session's strongest model at `high` (Opus 5.5 for us); `opusplan` plans on Opus and executes on Sonnet. The Plan subagent inherits the session model. | FLOW-009 |
| What do checkpoints not undo? | Bash side effects (`rm`, `mv`, migrations, git, deploys), most subagent edits, edits by you or other sessions, and symlinked or hard-linked files. Git is the permanent net. | FLOW-017, FLOW-018 |
| How long do checkpoints last? | 100 most recent per session; snapshots are swept about 30 days after the session last saved one (`cleanupPeriodDays`). They survive `--resume`. | FLOW-016 |
| My session is going in circles. What now? | After two failed corrections: rewind to before the wrong turn, or `/clear` with a better prompt or a handoff. Raise effort if Claude skipped steps; switch model if it tried properly and still failed. | FLOW-020, FLOW-021, FLOW-022 |
| What's the cheapest way to wait on CI or a deploy? | One background command that exits when the state changes (`run_in_background`), which wakes Claude once. Monitor for a stream of events. `/loop` and cron cost a full-context turn per wake-up. | FLOW-024, FLOW-025, FLOW-028 |
| How long can a background command, a Monitor or a `/loop` run? | Background Bash: no limit in a local interactive session; 30 min default, 2 h max in unattended runs (10 min in `-p`). Monitor: 5 min default, 30 min max. `/loop`: expires after 7 days. | FLOW-025, FLOW-026, FLOW-027 |
| What happens to a message I send while Claude works? | It's queued and handed to Claude as soon as the current tool calls finish, inside the same turn. `Ctrl+Enter` sends now. `Esc` interrupts and keeps the work done so far. | FLOW-030, FLOW-031 |
| How do I ask something without polluting context? | `/btw <question>`: sees the conversation, has no tools, never enters history, and runs while Claude works. Press `f` to fork it into a subagent with tools. | FLOW-032, TOK-033 |
| Does Claude Code detect loops by itself? | Only narrow guards: the Stop-hook block cap (8), `/goal`'s no-progress stop, auto mode pausing after 3 blocks in a row or 20 in total, and the autocompact thrash stop. Nothing catches the same failed fix repeated. | FLOW-023 |
| How does our setup compare? | Strong on verify commands, handoffs and PR polling. Gaps: no rule for showing evidence or for stopping after two failed fixes, and blocking CI waits instead of background ones. | FLOW-033 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| FLOW-001 | Explore, plan, implement, commit | pattern | workflow, plan-mode, official |
| FLOW-002 | Test-driven workflow with Claude | pattern | tdd, tests, workflow |
| FLOW-003 | Interview, write a spec, run it in a fresh session | pattern | spec, interview, askuserquestion |
| FLOW-004 | UI work from a screenshot or design mock | pattern | ui, screenshots, design |
| FLOW-005 | Choosing a workflow by task size | recommendation | decision, workflow |
| FLOW-006 | Plan mode: what it blocks and what still runs | fact | plan-mode, permissions, bash |
| FLOW-007 | Approving a plan | fact | plan-mode, exitplanmode, approval |
| FLOW-008 | Plan files and `plansDirectory` | fact | plan-mode, plans, settings |
| FLOW-009 | Model and effort for planning | recommendation | plan-mode, model-selection, effort, opusplan |
| FLOW-010 | Planning beyond the terminal: desktop, cloud, Ultraplan removed | fact | plan-mode, desktop, cloud, ultraplan |
| FLOW-011 | Give Claude a check it can run | recommendation | verification, tests, official |
| FLOW-012 | `/goal`: keep working until a condition holds | tool | goal, verification, stop-hook |
| FLOW-013 | `/run`, `/verify` and a repo `verify` skill | tool | verify, skills, commit |
| FLOW-014 | Browser and GUI checks: Chrome, Playwright MCP, computer use | comparison | browser, playwright, chrome, ui |
| FLOW-015 | Evidence before claims: instructions that make Claude verify | pattern | verification, claude-md, superpowers |
| FLOW-016 | How checkpoints work | fact | checkpoints, rewind, retention |
| FLOW-017 | What checkpoints don't cover | fact | checkpoints, bash, subagents, limits |
| FLOW-018 | Git as the permanent safety net | recommendation | git, commits, worktrees |
| FLOW-019 | Branching a conversation: `/branch`, `--fork-session`, `/fork` | fact | sessions, branch, fork |
| FLOW-020 | Signs a session is stuck | anti-pattern | stuck, corrections, context-rot |
| FLOW-021 | Recovery ladder for a stuck session | recommendation | stuck, rewind, clear, handoff |
| FLOW-022 | Changing model or effort to get unstuck | recommendation | model-selection, effort, recovery |
| FLOW-023 | Built-in loop guards | fact | loops, limits, stop-hook, auto-mode |
| FLOW-024 | Ways to wait on external work | comparison | waiting, ci, polling, monitor, loop |
| FLOW-025 | Background Bash: limits and completion notices | fact | background, bash, timeouts |
| FLOW-026 | Monitor tool | tool | monitor, events, polling |
| FLOW-027 | `/loop`, `ScheduleWakeup` and the cron tools | tool | loop, schedulewakeup, cron |
| FLOW-028 | What polling costs | fact | cost, cache, polling |
| FLOW-029 | Push notifications, desktop CI monitor and channels | fact | notifications, desktop, channels, ci |
| FLOW-030 | Interrupting with `Esc` | fact | steering, interrupt |
| FLOW-031 | Queued messages and send-now | fact | steering, queue |
| FLOW-032 | `/btw`, `/model` and `/effort` while Claude works | fact | steering, btw, model, effort |
| FLOW-033 | Our setup against these findings | comparison | our-setup, global-claude-md, skills |

## [FLOW-001] Explore, plan, implement, commit
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Best practices: Explore first, then plan, then code](https://code.claude.com/docs/en/best-practices), [Claude Code best practices, 2025 post (archived 2025-08-01)](https://web.archive.org/web/20250801000000/https://www.anthropic.com/engineering/claude-code-best-practices)
- Related: FLOW-005, FLOW-006, FLOW-011, ORCH-047

Anthropic's recommended default workflow has four phases. "Separate research and planning from implementation to avoid solving the wrong problem."

1. **Explore** in plan mode (`Shift+Tab` until `⏸ plan mode on`, or `claude --permission-mode plan`): "Claude reads files and answers questions without making changes."
2. **Plan**: ask for a detailed plan. "Press `Ctrl+G` to open the plan in your text editor for direct editing before Claude proceeds."
3. **Implement**: approve the plan or press `Shift+Tab`, "then let Claude code, verifying against its plan." The example prompt ends "write tests for the callback handler, run the test suite and fix any failures."
4. **Commit**: "commit with a descriptive message and open a PR".

The 2025 post called steps 1–2 "crucial—without them, Claude tends to jump straight to coding a solution", and suggested saving the plan as a document or GitHub issue "so that you can reset to this spot" if the implementation goes wrong.

Note: the engineering-blog URL now serves the docs page. The 2025 post's TDD and screenshot workflows (FLOW-002, FLOW-004) and its "think / think hard / ultrathink" ladder are gone from it; only `ultrathink` is still a keyword (model-config).

## [FLOW-002] Test-driven workflow with Claude
- Type: pattern
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-12
- Sources: [Claude Code best practices, 2025 post (archived 2025-08-01)](https://web.archive.org/web/20250801000000/https://www.anthropic.com/engineering/claude-code-best-practices), [Best practices](https://code.claude.com/docs/en/best-practices), [superpowers test-driven-development](https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md)
- Related: FLOW-011, FLOW-018, ORCH-039, PROMPT-028

TDD was "an Anthropic-favorite workflow for changes that are easily verifiable with unit, integration, or end-to-end tests" in the 2025 post. The current docs page dropped the section, so it is historical Anthropic guidance (hence official-example, not official-docs).

Steps, quoted from the 2025 post:
1. "Ask Claude to write tests based on expected input/output pairs. Be explicit about the fact that you're doing test-driven development so that it avoids creating mock implementations."
2. "Tell Claude to run the tests and confirm they fail. Explicitly telling it not to write any implementation code at this stage is often helpful."
3. "Ask Claude to commit the tests when you're satisfied with them."
4. "Ask Claude to write code that passes the tests, instructing it not to modify the tests. Tell Claude to keep going until all tests pass."
5. Optionally "verify with independent subagents that the implementation isn't overfitting to the tests", then commit.

What survives in the current docs: the bug-fix prompt "write a failing test that reproduces the issue, then fix it", and "have one Claude write tests, then another write code to pass them."

Community (superpowers, about 298k stars): "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST", because "if you didn't watch the test fail, you don't know if it tests the right thing."

Committing the tests first (step 3) makes "don't modify the tests" checkable with `git diff`, and gives `/goal` a crisp condition (FLOW-012).

## [FLOW-003] Interview, write a spec, run it in a fresh session
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Best practices: Let Claude interview you](https://code.claude.com/docs/en/best-practices), [feature-dev plugin](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/feature-dev)
- Related: FLOW-005, FLOW-007, TOK-030, SESS-031

"For larger features, have Claude interview you first. Start with a minimal prompt and ask Claude to interview you using the `AskUserQuestion` tool." The docs' prompt:

```text
I want to build [brief description]. Interview me in detail using the AskUserQuestion tool.
Ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs. Don't ask obvious
questions, dig into the hard parts I might not have considered.
Keep interviewing until we've covered everything, then write a complete spec to SPEC.md.
```

"Once the spec is complete, start a fresh session to execute it. The new session has clean context focused entirely on implementation, and you have a written spec to reference."

What makes a spec useful: "they name the files and interfaces involved, state what is out of scope, and end with an end-to-end verification step that proves the feature works. Time spent making the spec precise pays off more than time spent watching the implementation."

Variants:
- A GitHub issue instead of `SPEC.md` (our `roadmap-issues` format already has `## Problem`, `## Do`, `## Verify`, `## Out of scope`).
- The plan-approval option "Yes, clear context and …" (FLOW-007) does the same hand-off inside one session.
- The official `feature-dev` plugin packages it as phases: discovery, exploration, clarifying questions, architecture, implementation, review.

## [FLOW-004] UI work from a screenshot or design mock
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Best practices: Give Claude a way to verify its work](https://code.claude.com/docs/en/best-practices), [Claude in Chrome](https://code.claude.com/docs/en/chrome), [Claude Code best practices, 2025 post (archived 2025-08-01)](https://web.archive.org/web/20250801000000/https://www.anthropic.com/engineering/claude-code-best-practices)
- Related: FLOW-011, FLOW-014, REPO-021, TOK-043

Give Claude a target image and a way to see its own output, then let it iterate. The docs' example turns "make the dashboard look better" into:

> [paste screenshot] implement this design. take a screenshot of the result and compare it to the original. list differences and fix them

The 2025 post spelled out the loop: give Claude a screenshot tool (it named Puppeteer MCP, an iOS simulator MCP, or manual paste), give it a mock, and "ask Claude to implement the design in code, take screenshots of the result, and iterate until its result matches the mock… after 2-3 iterations it will typically look much better."

The Chrome page lists the same use: "build a UI from a Figma mock, then open it in the browser to verify it matches."

Cost caveat: every screenshot stays in context and is re-read on every later turn (TOK-043). For a long UI session, take screenshots in a subagent that returns a short report and the file path (REPO-021), or compare with an accessibility snapshot where layout isn't the point. Paste images with `Ctrl+V` (`Alt+V` on WSL).

## [FLOW-005] Choosing a workflow by task size
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Best practices](https://code.claude.com/docs/en/best-practices), [Goal](https://code.claude.com/docs/en/goal)
- Related: FLOW-001, FLOW-003, FLOW-012, ORCH-047, ORCH-021

A synthesis of the docs' rules into one decision:

| Task | Workflow | Docs' rule |
|---|---|---|
| Typo, log line, rename | Ask directly | "If you could describe the diff in one sentence, skip the plan." |
| Unclear approach, several files, unfamiliar code | Plan mode, then implement (FLOW-001) | "Planning is most useful when you're uncertain about the approach…" |
| Testable behaviour change | Tests first (FLOW-002) | "Provide verification criteria" |
| Larger feature with open questions | Interview → spec → fresh session (FLOW-003) | "For larger features, have Claude interview you first." |
| Long unattended run with a checkable end | `/goal` in auto mode (FLOW-012) | "substantial work with a verifiable end state" |
| Exploratory | Let it run | "Sometimes you should skip planning… because the task is exploratory." |
| Many independent pieces | Split (ORCH-021, ORCH-047) | — |

Every row still needs a check Claude can run (FLOW-011). The docs end with "Pay attention to what works": these are defaults, not rules.

## [FLOW-006] Plan mode: what it blocks and what still runs
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Permission modes: plan mode](https://code.claude.com/docs/en/permission-modes), [Settings reference: useAutoModeDuringPlan](https://code.claude.com/docs/en/settings-reference), [Commands](https://code.claude.com/docs/en/commands), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: FLOW-007, FLOW-008, REPO-032

"Claude reads files, runs shell commands to explore, and writes a plan, but does not edit your source." Edits stay blocked until you approve, except in interactive terminal sessions with bypass permissions available.

Shell commands are **not** blocked outright. The first matching case applies:
1. Bypass permissions available (interactive terminal): no classifier, no prompt.
2. Auto mode available and `useAutoModeDuringPlan` on (default `true`; user, local or managed scope only): "the classifier reviews shell commands… instead of prompting you."
3. Otherwise: commands outside the built-in read-only set prompt.

Entering: `Shift+Tab` (cycle `default` → `acceptEdits` → `plan`), `/plan [description]` for one prompt, `claude --permission-mode plan`, or `defaultMode: "plan"`. Auto mode is the built-in starting mode since v2.1.283, so plan mode is always an explicit choice. The only writes plan mode makes are its own plan files (FLOW-008).

Tested 2026-10-12, v2.1.296, `claude -p --permission-mode plan`, Haiku: asked to create a file and run `touch`, it did neither, wrote the plan to `~/.claude/plans/<slug>.md`, and said `ExitPlanMode` wasn't among its tools. So in `-p` a plan-mode run can only plan. Cost: 0.09 USD, 2 turns.

## [FLOW-007] Approving a plan
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Permission modes: review and approve a plan](https://code.claude.com/docs/en/permission-modes), [Settings reference: showClearContextOnPlanAccept](https://code.claude.com/docs/en/settings-reference), [Tools reference](https://code.claude.com/docs/en/tools-reference), [Claude Code CHANGELOG 2.1.81](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: FLOW-003, FLOW-006, FLOW-008

Claude ends planning by calling `ExitPlanMode` (needs permission; plan approval never auto-resolves on idle). The menu offers:
- **Yes, and use auto mode** (reads **Yes, auto-accept edits** when auto mode isn't available, or the bypass-permissions wording when the session started with it).
- **Yes, manually approve edits**.
- **No, keep planning**: stay and tell Claude what to change.

`Ctrl+G` opens the plan in your editor before Claude proceeds. `Shift+Tab` leaves plan mode without approving. Approving switches to the chosen permission mode and gives the session a generated title.

**Clear-context option.** With `showClearContextOnPlanAccept: true` (default `false`), the menu gains a first option, "**Yes, clear context and …**", that "approves the plan, clears the conversation context, and starts implementing from the plan alone"; the label shows how much context planning used. It was shown by default until v2.1.81, so older guides list it as standard.

Use it when planning read a lot of files that the implementation won't need: it's the in-session version of "spec, then a fresh session" (FLOW-003). Skip it when the exploration itself is the useful context.

## [FLOW-008] Plan files and `plansDirectory`
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Settings reference: plansDirectory](https://code.claude.com/docs/en/settings-reference), [Permission modes: protected paths](https://code.claude.com/docs/en/permission-modes), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: FLOW-006, FLOW-007, SESS-009

Plans are Markdown files. The default location is `~/.claude/plans/`; `plansDirectory` (v2.1.9+) moves them, resolved relative to the project root, e.g. `{"plansDirectory": "./plans"}`. A path outside the project root falls back to `~/.claude/plans`. The session's own plan files are the one write plan mode allows.

Names are prompt-derived slugs (v2.1.111+), e.g. `fix-auth-race-snug-otter.md`. A fresh file is used after `/clear` (v2.1.3), and forks stop sharing one (v2.1.71). Plan mode survives resume from v2.1.290/2.1.292.

Implications:
- `~/.claude/plans/` is shared by every session and worktree on the machine (SESS-009) and isn't cleaned with the session. Our probe left a file there that had to be deleted by hand (FLOW-006).
- A repo-local `plansDirectory` puts plans under git's eye: gitignore it, or commit plans deliberately as specs.
- To hand a plan to another session or a cloud run, commit it or put it in an issue; the docs' cloud pattern is "save the plan to the repo, commit and push", then `claude --cloud "Execute the migration plan in docs/migration-plan.md"` (FLOW-010).

## [FLOW-009] Model and effort for planning
- Type: recommendation
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-12
- Sources: [Model configuration](https://code.claude.com/docs/en/model-config), [Sub-agents: Plan](https://code.claude.com/docs/en/sub-agents), [Choosing a model and effort level (2026-07-07)](https://claude.com/blog/claude-model-and-effort-level-in-claude-code)
- Related: ORCH-028, ORCH-029, ORCH-030, ORCH-005

No official page names a model or effort for planning. What exists:
- **`opusplan`**: "uses `opus` during plan mode, then switches to `sonnet` for execution." A Haiku session is upgraded to Sonnet in plan mode.
- **Plan subagent**: read-only research agent used in plan mode; "inherits from the main conversation" (it does not move with plain `CLAUDE_CODE_SUBAGENT_MODEL`, ORCH-005). It skips CLAUDE.md and git status.
- **Effort table** (model-config): `high` for "work where verification matters or edge cases are likely"; "at a higher level [Claude] tested more edge cases and verified more of its work."

Recommendation (ours, inferred): plan on the strongest model you'd trust with the design, at `high`: Opus 5.5 for us. A wrong plan wastes the whole implementation, while planning is a small share of tokens. Implement on the same model if the design is subtle; `opusplan` is the cheap option for well-scoped work, at the cost of a cache miss when the model switches (TOK-053).

Don't raise to `xhigh` or `max` for planning by default: `max` "may show diminishing returns and is prone to overthinking", and the KB's design notes found extra thinking without extra breadth (README).

## [FLOW-010] Planning beyond the terminal: desktop, cloud, Ultraplan removed
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Desktop](https://code.claude.com/docs/en/desktop), [Permission modes](https://code.claude.com/docs/en/permission-modes), [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web), [Ultraplan](https://code.claude.com/docs/en/ultraplan), [Claude Code CHANGELOG 2.1.222](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: FLOW-006, FLOW-008, SESS-030, ORCH-016

- **Desktop:** Plan mode "reads files and runs commands to explore, then proposes a plan without editing your source code", with a plan pane. The desktop remembers the chosen mode per folder, except Plan, which "applies to the current session only".
- **Cloud sessions:** honour `acceptEdits`, `plan`, `default` and `auto`. The docs' pattern for heavy work: plan locally, commit the plan, then `claude --cloud "Execute the migration plan in docs/migration-plan.md"`.
- **VS Code:** ignores the project's `defaultMode` for the starting mode; set `claudeCode.initialPermissionMode`.
- **Ultraplan is gone.** "Anthropic has removed the Ultraplan research preview": the `/ultraplan` command, the `ultraplan` keyword and the "refine with Ultraplan on Claude Code on the web" approval option (v2.1.222). Guides that mention it are out of date; use plan mode or a cloud session.

## [FLOW-011] Give Claude a check it can run
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Best practices: Give Claude a way to verify its work](https://code.claude.com/docs/en/best-practices), [Effective harnesses for long-running agents (2025-11-26)](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- Related: FLOW-012, FLOW-015, HOOK-031, ORCH-039, ORCH-037, PROMPT-027

It is the first section of the best-practices page: "Give Claude a check it can run: tests, a build, a screenshot to compare. It's the difference between a session you watch and one you walk away from."

Why: "Claude stops when the work looks done. Without a check it can run, 'looks done' is the only signal available, and you become the verification loop." A check is anything that returns a signal Claude can read: a test suite, a build exit code, a linter, a fixture diff, or a screenshot compared against a design. (No official page calls it "the single highest-leverage" thing; that phrase is community shorthand.)

How hard the check gates the stop, cheapest first:
1. **In one prompt:** "run the tests after implementing", "fix it and verify the build succeeds. address the root cause, don't suppress the error".
2. **Across a session:** `/goal` (FLOW-012).
3. **Deterministic gate:** a Stop hook that blocks until the check passes (HOOK-031).
4. **Second opinion:** a verification subagent or workflow (ORCH-039).

"Each step trades setup for attention… The `/goal` and Stop hook versions are what let an unattended run finish correctly without you."

Anthropic's harness post saw the failure this prevents: Claude tended "to mark a feature as complete without proper testing", and did much better "once explicitly prompted to use browser automation tools and do all testing as a human user would."

## [FLOW-012] `/goal`: keep working until a condition holds
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Goal](https://code.claude.com/docs/en/goal), [Costs: background token usage](https://code.claude.com/docs/en/costs)
- Related: FLOW-011, FLOW-023, HOOK-031, HOOK-010

`/goal <condition>` starts a turn and, after every turn, has the small fast model judge the condition against the conversation: not yet met (keep going, with the reason as guidance), met, or impossible. It is "a wrapper around a session-scoped prompt-based Stop hook". One goal per session; `/goal` shows status (turns, time, tokens); `/goal clear` removes it, and so does `/clear`.

Writing the condition: the evaluator "doesn't run commands or read files independently, so write the condition as something Claude's own output can demonstrate." Include:
- one measurable end state ("`npm test` exits 0"),
- the check that proves it,
- constraints ("no other test file is modified"),
- a bound such as `or stop after 20 turns`.
Up to 4,000 characters.

Behaviour:
- It doesn't change the permission mode; for unattended goals use auto mode.
- It works in `-p`, desktop and Remote Control, and is restored on resume.
- With no tool use for several turns, Claude Code stops the loop and keeps the goal set.
- Background work defers evaluation; idle check-ins send the full context, at most three per goal since v2.1.246 (`CLAUDE_CODE_GOAL_CHECKIN_MINUTES=0` turns them off).
- Unavailable when `disableAllHooks` is set.

## [FLOW-013] `/run`, `/verify` and a repo `verify` skill
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Skills: run and verify your app](https://code.claude.com/docs/en/skills), [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks), [Claude Code CHANGELOG 2.1.215, 2.1.286](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: FLOW-011, FLOW-014, SKILL-021

Three bundled skills check a change against the running app, not just tests:
- `/run`: launch and drive the app to see a change working.
- `/verify`: "Build and run your app to confirm a code change does what it should, without falling back to tests or type checks."
- `/run-skill-generator`: records the launch recipe as `.claude/skills/run-<name>/`, so `/run`, `/verify` and other agents reuse it. Run it once per project and again when the build changes.

Claude doesn't run `/verify` or `/code-review` on its own (v2.1.215); they are user-invoked and reach a `/loop` fire as plain text.

**Commit hook-in (v2.1.286+).** "When a session starts with a skill named `verify` or `simplify` in place, Claude Code's commit instructions tell Claude to run it right before each commit, except for changes to docs or tests." It counts only enterprise, personal, project or added-directory skills (not plugin or claude.ai ones), and not when the skill has `disable-model-invocation: true` or `includeGitInstructions` is off.

So a repo's own `.claude/skills/verify/SKILL.md` that runs its verify command turns "verify before committing" from a CLAUDE.md line into built-in commit guidance.

## [FLOW-014] Browser and GUI checks: Chrome, Playwright MCP, computer use
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Claude in Chrome](https://code.claude.com/docs/en/chrome), [Computer use](https://code.claude.com/docs/en/computer-use), [Desktop: preview your app](https://code.claude.com/docs/en/desktop), [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps), [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- Related: FLOW-004, REPO-021, SESS-013, TOK-043

| Option | Where | Notes |
|---|---|---|
| Claude in Chrome (`--chrome`, `/chrome`) | CLI, VS Code; Chrome or Edge | Console, DOM, forms, GIFs. Needs extension v1.0.36+ and a claude.ai login. **"Isn't supported in Windows Subsystem for Linux (WSL)."** On by default it "increases context usage". |
| Playwright MCP (plugin) | Any surface with MCP | Not covered by the Claude Code docs; Anthropic's harness post uses it for an evaluator that drives the live app, and the SDK post: "Using an MCP server like Playwright, you can automate this visual feedback loop." |
| Desktop Browser pane | Desktop app | Starts the dev server from `.claude/launch.json`, screenshots, clicks, fills forms. |
| Computer use | CLI (macOS, Pro/Max, interactive only) | "the broadest and slowest"; Claude tries MCP, Bash and Chrome first. Native apps, iOS Simulator. |

For us (WSL terminal and desktop WSL sessions): Chrome integration is out, so Playwright MCP stays the browser check, ideally in a subagent so screenshots don't pile up in the main context (REPO-021). One Playwright browser per workspace: don't run two checkers at once (SESS-013).

## [FLOW-015] Evidence before claims: instructions that make Claude verify
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Best practices](https://code.claude.com/docs/en/best-practices), [superpowers verification-before-completion](https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md), [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- Related: FLOW-011, FLOW-013, PROMPT-027, PROMPT-030, PROMPT-004, ORCH-039, SKILL-043

Official: "Have Claude show evidence rather than asserting success: the test output, the command it ran and what it returned, or a screenshot of the result. Reviewing evidence is faster than re-running the verification yourself." The named failure is "the trust-then-verify gap… If you can't verify it, don't ship it."

What to put in CLAUDE.md (best practices' own examples): the verify command, "Be sure to typecheck when you're done making a series of code changes", "Prefer running single tests… for performance". Keep it short; "If Claude keeps skipping one instruction, add emphasis such as 'IMPORTANT' to that line alone", and turn rules Claude must never skip into hooks.

Community, superpowers `verification-before-completion`: "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE. If you haven't run the verification command in this message, you cannot claim it passes." Its gate: identify the command, run it fresh, read the full output and exit code, then claim. Its claim table: a clean linter isn't a passing build, and a subagent's "done" needs the diff checked.

Both agree on evidence. The skill is advisory text; `/goal` and Stop hooks enforce. Self-grading is the weak spot: agents "confidently [praise] the work—even when… the quality is obviously mediocre" (harness post), so unattended work adds a separate check (ORCH-039).

Model caveat (PROMPT-027, PROMPT-030): ask for evidence in the report, not for extra verification passes. Anthropic's Opus 5 guidance says "include a final verification step" lines "cause over-verification", while Sonnet 5.5 and Haiku 5.5 at low effort still need a "run a real check" paragraph.

## [FLOW-016] How checkpoints work
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Checkpointing](https://code.claude.com/docs/en/checkpointing), [Settings reference: cleanupPeriodDays](https://code.claude.com/docs/en/settings-reference), [Claude directory](https://code.claude.com/docs/en/claude-directory)
- Related: FLOW-017, FLOW-021, TOK-033

"Every prompt you send that starts a turn creates a new checkpoint." Claude Code snapshots each file before its editing tools change it.

- **Cap:** file snapshots for "the 100 most recent checkpoints in a session" (each file's first snapshot is kept as the VS Code diff baseline).
- **Persistence:** saved with the conversation, so `/rewind` works after `--resume`.
- **Retention:** snapshots in `~/.claude/file-history/<session>/` are deleted in the retention sweep, "by default about 30 days after the session last saved one" (`cleanupPeriodDays`, default 30, minimum 1). Rewinding to a swept checkpoint fails with `No files were restored`.

`/rewind` (aliases `/checkpoint`, `/undo`), or `Esc Esc` on an empty prompt, lists your prompts. Actions:
- **Restore code and conversation**, **Restore conversation**, **Restore code**.
- **Summarize from here**, **Summarize up to here** (optional focus text; files untouched).
- **Never mind**.

Code options appear only when that checkpoint has tracked edits. After restoring the conversation, your original prompt is back in the input for editing.

After `/clear`, the menu's top entry `/resume <session-id> (previous session)` reopens the cleared conversation, until you exit or resume another session.

## [FLOW-017] What checkpoints don't cover
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Checkpointing: limitations](https://code.claude.com/docs/en/checkpointing), [Best practices: rewind with checkpoints](https://code.claude.com/docs/en/best-practices), [Agent SDK file checkpointing](https://code.claude.com/docs/en/agent-sdk/file-checkpointing)
- Related: FLOW-016, FLOW-018, SESS-010

- **Bash commands.** "Checkpointing does not track files modified by Bash commands" (`rm`, `mv`, `cp`). By the same rule nothing done through Bash is undone: `sed -i`, codegen, `npm install`, migrations, `git` operations, deploys. Remote systems "can't be checkpointed"; permission modes and rules are what guard them.
- **Subagents.** Rewinding doesn't restore subagent edits, including background forked skills and background `/code-review --fix`. Only a foreground `context: fork` skill is restored. "Use git to revert them."
- **You and other sessions.** Manual edits and "edits from other concurrent sessions are normally not captured".
- **Mid-turn messages.** A queued message read mid-turn gets no checkpoint of its own ("No code restore"); restore from the prompt that started the turn.
- **Symlinks and hard links** are skipped with `Restored the code, but skipped N files` (dotfile managers, pnpm).
- **Directories:** creating, moving or deleting them is not undone (SDK page).

"Checkpoints are designed for quick, session-level recovery. For permanent version history and collaboration, continue using version control." Best practices: "This isn't a replacement for git."

Rule of thumb: before Claude runs anything destructive through Bash, the safety net is a commit, not a checkpoint.

## [FLOW-018] Git as the permanent safety net
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Checkpointing](https://code.claude.com/docs/en/checkpointing), [Effective harnesses for long-running agents (2025-11-26)](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), [Permission modes: what the classifier blocks](https://code.claude.com/docs/en/permission-modes), [Worktrees](https://code.claude.com/docs/en/worktrees)
- Related: FLOW-017, ORCH-036, ORCH-009, SESS-002, SESS-005

Checkpoints undo file edits inside one session; git covers everything else and outlives the session.

- **Commit at green points.** Anthropic's long-running harness asked the model "to commit its progress to git with descriptive commit messages and to write summaries of its progress in a progress file. This allowed the model to use git to revert bad code changes and recover working states." A fresh context re-orients from `git log` plus the progress file (ORCH-036). Commit the tests before the implementation in TDD (FLOW-002).
- **A worktree per risky attempt** (`claude --worktree <name>`, ORCH-009). Worktrees isolate edits, not side effects such as shared ports or databases. Removing a worktree "deletes the worktree directory and its branch, along with all the work in them" (SESS-005).
- **Auto mode helps.** Its classifier blocks `git reset --hard`, `git checkout -- .`, `git restore .`, `git clean -fd`, `git stash drop` and `git stash clear` by default, because they discard uncommitted work.
- **Don't use bare `git stash` with parallel sessions**: the stash is shared across worktrees (SESS-002). Use a WIP commit.

The docs give no "commit every N minutes" rule; the harness post is the strongest official source for commit-as-checkpoint.

## [FLOW-019] Branching a conversation: `/branch`, `--fork-session`, `/fork`
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Sessions: branch a session](https://code.claude.com/docs/en/sessions), [Checkpointing](https://code.claude.com/docs/en/checkpointing), [Claude Code CHANGELOG 2.1.77, 2.1.212](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: FLOW-016, FLOW-021, SESS-029, ORCH-008

To try another approach without losing the current path, copy the conversation rather than summarizing it:
- **`/branch [name]`**: "creates a copy of the conversation so far and switches you into it, leaving the original intact." Session grants carry over, and background subagents and Bash keep running and report into the branch. Return with `/resume <original-name>`.
- **`claude --continue --fork-session`** (or `--resume <id> --fork-session`): the same from the shell, as a new process that re-asks for permissions.
- **`/fork [prompt]`** (since v2.1.212): copies the conversation into a background session while you keep working here. Before that, `/fork` was the old name of `/branch` (renamed in v2.1.77).

Forking copies checkpoint backups too, so a branch can still rewind.

These branch the **conversation, not the files**: both copies edit the same working tree. For a code experiment, pair it with a worktree or a commit (FLOW-018). Resuming one session in two terminals without forking interleaves both into one transcript.

## [FLOW-020] Signs a session is stuck
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Best practices: avoid common failure patterns](https://code.claude.com/docs/en/best-practices), [Effective context engineering (2025-09-29)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), [Troubleshooting](https://code.claude.com/docs/en/troubleshooting)
- Related: FLOW-021, FLOW-023, TOK-030, ORCH-037

Signs, each with its source:
- **The same correction twice.** "If you've corrected Claude more than twice on the same issue in one session, the context is cluttered with failed approaches."
- **A long, mixed session.** "Kitchen sink" sessions and "infinite exploration": "performance degrades as [the context] fills… Claude may start 'forgetting' earlier instructions or making more mistakes." Anthropic's context-engineering post calls this context rot: "as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases", in every model.
- **Plausible but unverified progress**: edits without a check run, or "done" without evidence (FLOW-011, FLOW-015).
- **Symptom fixes**: suppressing the error instead of finding the cause ("address the root cause, don't suppress the error").
- **Compaction loops**: `Autocompact is thrashing` means context refills to the limit right after compacting (FLOW-023).
- **Repeated permission blocks** in auto mode, which pause it (FLOW-023).

The common cause is context full of failed attempts, so more instructions in the same context rarely help. Recovery: FLOW-021.

## [FLOW-021] Recovery ladder for a stuck session
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Best practices: course-correct early and often](https://code.claude.com/docs/en/best-practices), [Checkpointing](https://code.claude.com/docs/en/checkpointing), [Sessions](https://code.claude.com/docs/en/sessions), [Troubleshooting](https://code.claude.com/docs/en/troubleshooting)
- Related: FLOW-016, FLOW-019, FLOW-022, TOK-030, TOK-031, SESS-031

Cheapest and least lossy first:

1. **`Esc` and redirect** as soon as it drifts: "Context is preserved, so you can redirect" (FLOW-030).
2. **Rewind to before the wrong turn** with **Restore code and conversation**, then edit the restored prompt with what you learned. Rewinding truncates to an already-cached prefix (TOK-033).
3. **Summarize from here** to squash a failed debugging detour while keeping the setup.
4. **`/clear` and a better prompt.** "After two failed corrections, `/clear` and write a better initial prompt incorporating what you learned. A clean session with a better prompt almost always outperforms a long session with accumulated corrections." Write a handoff first if state matters (SESS-031); instructions given only in conversation are lost (TOK-030).
5. **Branch instead of fighting** (FLOW-019) when two approaches compete.
6. **Change effort or model** (FLOW-022).
7. **Ask for a step back.** No official wording; common practice is "stop editing, list three hypotheses for the root cause and the cheapest check for each". Unverified as an official recommendation.

For autocompact thrashing (troubleshooting page): read the big file in chunks, `/compact` with a focus that drops the large output, move the large-file work to a subagent, or `/clear`. A hung session: `Ctrl+C`, then `claude --resume`.

## [FLOW-022] Changing model or effort to get unstuck
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Choosing a model and effort level (2026-07-07)](https://claude.com/blog/claude-model-and-effort-level-in-claude-code), [Interactive mode: queue messages](https://code.claude.com/docs/en/interactive-mode), [Model configuration](https://code.claude.com/docs/en/model-config)
- Related: ORCH-028, ORCH-029, TOK-053, SESS-011, FLOW-021

Anthropic's rule for which knob to turn after a miss:
- "If Claude got it wrong by skipping a file, not running the tests, or bailing on a refactor partway through, pick a higher effort level."
- "If Claude has all the pertinent context, clearly tried, and still got it wrong, that's a signal to pick a more capable model."

Effort covers how much Claude verifies, not only thinking: on Opus 5.5 and Fable 5.1, "at a higher level [Claude] tested more edge cases and verified more of its work." The 5.5 models default to `medium` in Claude Code (ORCH-028).

Mechanics:
- `/model` and `/effort` run immediately, even mid-turn, and apply to the next request in the current turn after you confirm any cache warning.
- Changing model rebuilds the prompt cache (TOK-053); changing effort keeps it on the 5.5 models (ORCH-040).
- With several sessions open, `/model` also saves your default to `settings.json`; pick "this session only" or launch with `--model` and `--effort` (SESS-011).

Escalate effort before tier (ORCH-029). A model switch doesn't fix a polluted context: combine it with a rewind or `/clear` (FLOW-021).

## [FLOW-023] Built-in loop guards
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Hooks guide: Stop hook hits the block cap](https://code.claude.com/docs/en/hooks-guide), [Goal](https://code.claude.com/docs/en/goal), [Permission modes: when auto mode falls back](https://code.claude.com/docs/en/permission-modes), [Troubleshooting](https://code.claude.com/docs/en/troubleshooting), [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: HOOK-031, FLOW-012, FLOW-020, ORCH-038

Claude Code has guards against specific runaway loops, not a general detector for repeating the same failed fix (none found in the docs or CHANGELOG; absence there isn't proof).

| Guard | Trigger | Configurable |
|---|---|---|
| Stop-hook block cap | 8 consecutive Stop/SubagentStop blocks with no tool call between; then the turn ends (v2.1.143) | `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` (0 disables) |
| `/goal` stall stop | "no tool use for several turns in a row"; goal stays set | No; count unstated |
| Auto mode fallback | 3 classifier blocks in a row or 20 in total; prompting resumes | "not configurable" |
| No server verdict | 10 responses in a row without a verdict stop the turn (v2.1.280) | No |
| Autocompact thrash | context refills to the limit right after compacting 3 times (v2.1.89) | No |
| Self-paced `/loop` | one fallback wakeup about 20 minutes after an iteration that neither reschedules nor stops; then it ends | No |
| `-p` runs | `--max-turns`, `--max-budget-usd` | Yes (SESS-034) |

Interactive sessions on a subscription have no turn or spend cap. A human noticing "corrected twice" (FLOW-020) is still the main loop detector.

## [FLOW-024] Ways to wait on external work
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Tools reference: Bash, Monitor](https://code.claude.com/docs/en/tools-reference), [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks), [Channels](https://code.claude.com/docs/en/channels), [Desktop: monitor pull request status](https://code.claude.com/docs/en/desktop)
- Related: FLOW-025, FLOW-026, FLOW-027, FLOW-028, FLOW-029, SESS-022, ORCH-017

| Mechanism | Wakes Claude | Turns spent while waiting | Fits |
|---|---|---|---|
| Foreground command (`gh pr checks <n> --watch`, `gh run watch`) | When it exits | None; the turn is blocked (moves to background at its timeout) | Short waits you'd watch anyway |
| Background command that exits on the condition (`run_in_background`) | Once, on exit | None | "Tell me when CI finishes" |
| Monitor | Per output line | One per event | A stream: each CI job, each error line |
| `/loop`, one-shot reminder (cron) | On a schedule | One full-context turn per fire | State with no command to block on |
| Channels (research preview) | On a pushed event | One per event | CI or chat pushing into the session |
| Desktop CI status bar | — | Polls with `gh`; can auto-fix CI | Desktop sessions with a PR |

The Monitor tool's own guidance: for one notification, use a background command with an `until` loop, not an unbounded Monitor. The scheduled-tasks page: Monitor "avoids polling altogether and is often more token-efficient and responsive than re-running a prompt on an interval."

Before waiting on a PR's checks, confirm it isn't conflicting: GitHub runs no `pull_request` CI then, and a watch hangs (SESS-021, SESS-022).

## [FLOW-025] Background Bash: limits and completion notices
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Tools reference: Bash tool behavior](https://code.claude.com/docs/en/tools-reference), [Interactive mode: background Bash commands](https://code.claude.com/docs/en/interactive-mode), [Claude Code CHANGELOG 2.1.83, 2.1.277, 2.1.285, 2.1.288](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: FLOW-024, FLOW-026, TOK-042

- **Foreground timeouts:** `BASH_DEFAULT_TIMEOUT_MS` is "two minutes out of the box"; Claude can pass up to `BASH_MAX_TIMEOUT_MS`, "ten minutes out of the box".
- **Auto-backgrounding:** a foreground command that reaches its timeout is moved to the background, "unless the command starts with `sleep`". The result reads `Command did not complete within its 120s timeout and was moved to the background`.
- **Starting one:** Claude sets `run_in_background: true`, or you press `Ctrl+B` (twice in tmux). `/tasks` lists and stops them.
- **Notice:** Claude is re-invoked when a background command exits, so it shouldn't poll it. Output goes to a file that Claude reads with `Read`. `TaskOutput` was deprecated in v2.1.83 and removed in v2.1.277; the tools reference still lists it as deprecated.
- **Time limit:** none in a local terminal, desktop or VS Code session. In unattended sessions (`-p`, SDK, CI, cloud): 30 minutes or Claude's `timeout`, at most 2 hours; 10 minutes in a `-p` run with a text prompt. Introduced in v2.1.285, limited to unattended sessions in v2.1.288.
- Not restored on `--resume`. Kept when you background the whole session.
- A foreground subagent's background commands end with that subagent.

The current Bash tool description (v2.1.296) also says "Foreground `sleep` is blocked" and points to Monitor with an `until` loop; the docs don't state it.

## [FLOW-026] Monitor tool
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Tools reference: Monitor tool](https://code.claude.com/docs/en/tools-reference), [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks), [Claude Code CHANGELOG 2.1.98, 2.1.271, 2.1.274](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: FLOW-024, FLOW-027, FLOW-028

Monitor runs a script in the background and turns each stdout line into a notification, so Claude reacts while you keep working. It can also open a WebSocket (`ws` input) and treat each text frame as an event. Added in v2.1.98.

- **Deadline:** "5 minutes by default, at most 30 minutes, and at most 10 minutes" in a single-prompt `-p` run. Claude gets one notice at expiry and can re-arm. The schema allows `timeout_ms` up to 3,600,000, but values above 1,800,000 are capped. The old no-timeout `persistent` option was removed in v2.1.271.
- **Permissions:** same rules as Bash; in auto mode the classifier reviews it.
- **Availability:** not on Bedrock, Agent Platform or Foundry, nor with `DISABLE_TELEMETRY` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`. Subagents keep it; stopping the subagent stops its monitors.

From the tool's own description (v2.1.296):
- **Every stdout line is a conversation message**: filter to the lines you'd act on, or the monitor gets stopped for volume.
- **"Silence is not success"**: match every terminal state, not only the happy path.
- `grep --line-buffered`; poll remote APIs at 30 s or more.
- For a single "tell me when", use a background `until` loop instead (FLOW-025).

A script's final line and its exit arrive as one notification since v2.1.274, saving a turn.

## [FLOW-027] `/loop`, `ScheduleWakeup` and the cron tools
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks), [Tools reference](https://code.claude.com/docs/en/tools-reference), [Sub-agents: available tools](https://code.claude.com/docs/en/sub-agents)
- Related: ORCH-017, FLOW-024, FLOW-028

`/loop` re-runs a prompt in the open session (ORCH-017 compares it with routines and desktop tasks):
- `/loop 5m <prompt>`: fixed interval, converted to cron (minute granularity; `7m` or `90m` get rounded).
- `/loop <prompt>`: self-paced. After each iteration Claude calls `ScheduleWakeup` with a delay "between one minute and one hour", printed with its reason, or `stop: true` (v2.1.202+) to end. `Esc` clears the pending wakeup.
- `/loop` alone: the built-in maintenance prompt (finish work, tend the branch's PR, cleanup), or `.claude/loop.md` / `~/.claude/loop.md` (25,000-byte cap).

Cron tools: `CronCreate` (5-field cron, recurring or one-shot), `CronList`, `CronDelete`; "remind me at 3pm…" makes a one-shot.

Limits:
- 50 tasks per session; recurring ones expire after 7 days.
- Tasks fire only while the session is open and idle, between turns, with no catch-up for missed fires.
- Recurring tasks run late by up to half their interval (at most 30 minutes), except `*/5`, which runs at 4:45.
- `--resume` restores cron tasks but not a self-paced `/loop`.
- Subagents never get `ScheduleWakeup`; background subagents lose the cron tools too.

A scheduled fire runs only skills Claude may invoke itself; `/verify` and built-in commands arrive as plain text.

## [FLOW-028] What polling costs
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Costs: background token usage](https://code.claude.com/docs/en/costs), [Prompt caching: cache lifetime](https://code.claude.com/docs/en/prompt-caching), [Scheduled tasks: jitter](https://code.claude.com/docs/en/scheduled-tasks), [claude-code-system-prompts (ScheduleWakeup, ccVersion 2.1.284)](https://github.com/Piebald-AI/claude-code-system-prompts)
- Related: TOK-034, TOK-052, FLOW-024, FLOW-027

Every wake-up is a model turn over the whole conversation. Costs page: "a scheduled task fires on its interval even while the session is idle, sending your full context each time"; the same holds for cross-session messages and `/goal` check-ins. A waiting command costs nothing until it exits.

Cache: the main conversation's TTL is 1 hour on a subscription and 5 minutes on an API key or usage credits (TOK-052). A wake-up inside the TTL pays cache reads for the context; one after it pays a full cache write. `/loop 5m` fires every 4:45 for that reason: "A run exactly five minutes after the last one would start after a five-minute prompt cache had expired."

Community (extracted tool prompt, not docs): on a 5-minute TTL, delays of 60–270 s stay warm, and 300 s is "the worst-of-both", so use 270 s or 1,200 s+. On a 1-hour TTL, "scheduling extra wakeups just to keep the cache warm is pure waste." Match the delay to how fast the state changes: one check at about 480 s for an 8-minute CI run, not eight 60 s checks.

Measure it: `/usage` has a **Loops** row per scheduled task (runs, total and per-run tokens). The costs page says v2.1.242+, the CHANGELOG entry is 2.1.243.

Cheapest first: a background command that exits on the condition, then Monitor with a tight filter, then wake-up polling.

## [FLOW-029] Push notifications, desktop CI monitor and channels
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Desktop: monitor pull request status](https://code.claude.com/docs/en/desktop), [Remote Control: mobile push notifications](https://code.claude.com/docs/en/remote-control), [Settings reference: agentPushNotifEnabled](https://code.claude.com/docs/en/settings-reference), [Channels](https://code.claude.com/docs/en/channels), [Claude Code on the web: auto-fix](https://code.claude.com/docs/en/claude-code-on-the-web)
- Related: SESS-034, HOOK-030, FLOW-024, SURF-002, SURF-020, SURF-029

Ways to be told, or to let Claude act, when external work changes. The desktop and mobile features themselves are SURF-002 (CI bar, auto-merge, desktop notifications), SURF-020 (phone pushes) and SURF-029 (cloud auto-fix).

- **Desktop CI status bar:** after a PR opens, "Claude Code uses the GitHub CLI to poll check results and surface failures." Toggles: **Auto-fix CI & address comments**, and **Auto-merge when ready**, which squash-merges and needs repo auto-merge enabled.
- **Cloud auto-fix** (`/autofix-pr`): subscribes to the PR's GitHub activity. GitHub sends no webhook when `main` moves and causes a conflict, so it can't react to conflicts.
- **Push to your phone:**
  - `agentPushNotifEnabled` ("Push when Claude decides") lets Claude send one, e.g. when a long task finishes.
  - `inputNeededNotifEnabled` pushes when a prompt waits on you.
  - Both arrive only while Remote Control is connected.
  - The desktop app also notifies when a session you aren't viewing finishes.
- **`Notification` hook:** fires when Claude waits on you (`idle_prompt` about 60 s after it stops), not when CI finishes (HOOK-030).
- **Channels** (research preview): an MCP server pushes events (CI results, chat) into the open session; needs claude.ai or Console auth.

## [FLOW-030] Interrupting with `Esc`
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Interactive mode: keyboard shortcuts](https://code.claude.com/docs/en/interactive-mode), [Best practices: course-correct early and often](https://code.claude.com/docs/en/best-practices), [Claude Code CHANGELOG 2.1.73](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: FLOW-021, FLOW-031, FLOW-016

`Esc` "stop[s] the current response or tool call mid-turn so you can redirect. Claude keeps the work done so far. If you have messages queued, Claude Code sends them next." Best practices: "Context is preserved, so you can redirect", and "Correct Claude as soon as you notice it going off track."

Context:
- On a permission prompt, `Esc` declines (like **No** without a comment).
- With a dialog open it closes the dialog; with a footer item selected it deselects it.
- `Esc Esc` on an empty prompt opens the rewind menu; with text in the input it clears the draft (recall with `Up`).
- `Up` right after an interrupt "restores the interrupted prompt and rewinds the conversation in one step" (v2.1.73).
- `Ctrl+C` also interrupts; on an idle prompt it clears, and a second press exits.
- `Esc` on a waiting self-paced `/loop` cancels the pending wakeup.
- Interrupts don't fire Stop hooks (HOOK-031).

Interrupting doesn't undo anything: files changed before the interrupt stay changed. Rewind or "Undo that" if they should go.

Prefer an early `Esc` and one precise correction over letting a wrong approach finish and correcting afterwards: each extra wrong turn adds context the next attempt has to work around (FLOW-020).

## [FLOW-031] Queued messages and send-now
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Interactive mode: queue messages while Claude works](https://code.claude.com/docs/en/interactive-mode), [Checkpointing: messages sent mid-turn](https://code.claude.com/docs/en/checkpointing), [Claude Code CHANGELOG 2.1.275, 2.1.281](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: FLOW-030, FLOW-032, FLOW-017

Typing and pressing `Enter` while Claude works queues the message instead of interrupting. Queued items show in gray until Claude starts on them.

When they arrive:
- **Messages:** "if you queue a message while Claude is running tool calls, Claude Code passes it to Claude as soon as those tool calls finish, within the same turn." Messages still queued at turn end go out automatically, in order.
- **Commands and `!` shell commands:** held until the turn ends, then run one at a time.
- `/model`, `/effort`, `/fast` and `/status` run immediately instead (FLOW-032).

**Send now:** `Ctrl+Enter` or `Ctrl+X Ctrl+S` (v2.1.275+). Running shell commands or subagents move to the background and Claude reads your message in the same turn. If Claude is only writing, the turn is interrupted (both cases interrupted before v2.1.281). `Up` on the first line takes queued messages back for editing.

Use a queued message for a small steer ("also cover the error path"). Use `Esc` when the current direction is wrong (FLOW-030). A mid-turn message has no checkpoint of its own (FLOW-017).

## [FLOW-032] `/btw`, `/model` and `/effort` while Claude works
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Interactive mode: side questions with /btw](https://code.claude.com/docs/en/interactive-mode), [Interactive mode: queue messages](https://code.claude.com/docs/en/interactive-mode)
- Related: TOK-033, FLOW-022, FLOW-031

TOK-033 covers `/btw` as a context saver; this is the steering angle.

`/btw <question>` "runs independently and doesn't interrupt the main turn. It sees everything in the conversation so far, except the reply Claude is still writing."
- No tools: it answers from context only.
- A single response, never added to history. Later side questions see the newest 20 earlier ones, until `x` clears them.
- `f` forks the question and answer into a background subagent with tools (local sessions only).
- "While the conversation's prompt cache is warm, a side question costs little beyond the answer itself."
- In VS Code it's a panel (extension v2.1.227+).

Use it to check what Claude is doing or assuming ("which file are you editing and why?") before deciding whether to interrupt. A real course change needs a queued message or `Esc`, since `/btw` can't reach the main turn.

`/model` and `/effort` aren't queued: after any cache warning, they apply "to the next request it makes in that turn", so you can raise effort mid-task. `/fast` applies from the next turn.

## [FLOW-033] Our setup against these findings
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-12
- Sources: [FreekMencke/claude-skills](https://github.com/FreekMencke/claude-skills), [Best practices](https://code.claude.com/docs/en/best-practices), local read of `~/.claude/CLAUDE.md`, `~/.claude/settings.json` and the osrs-tracker repos' CLAUDE.md and skills (2026-10-12)
- Related: FLOW-013, FLOW-015, FLOW-021, FLOW-024, SESS-035, HOOK-036

Read 2026-10-12: global CLAUDE.md, user settings, claude-skills at `ed6c8ba`, and the osrs-tracker repos' land steps.

| Finding | Ours | Gap |
|---|---|---|
| Verify command (FLOW-011) | Each repo's CLAUDE.md has one; roadmap issues carry `## Verify`; orchestrator's "done-when is a command" | None |
| `verify` skill (FLOW-013) | All three repos since 2026-10-12 (osrs-tracker/osrs-tracker-web#235, osrs-tracker/osrs-tracker-api#139, osrs-tracker/osrs-tracker-aws#81); each runs every check, cheapest first, and reports all failures at once | None |
| Evidence (FLOW-015) | Compact instructions keep verify results | No rule to show the command and output when claiming done |
| Stuck (FLOW-021) | `handoff` skill: state, dead ends, `/clear` | No "two failed fixes → stop" rule |
| Plan mode (FLOW-006–009) | `defaultMode: auto`; Opus at `high` for research | `showClearContextOnPlanAccept` unset |
| Waiting (FLOW-024) | Poll mergeability, then `gh pr checks --watch` in the foreground; "don't watch CD" | Blocks the turn |
| Notifications (FLOW-029) | `agentPushNotifEnabled: true` | Needs Remote Control connected |
| Browser checks (FLOW-014) | Playwright plugin; `browser-checker` agent in web | Chrome isn't an option on WSL |

`handoff` already refuses to `/clear` while background work runs: correct, because background Bash and monitors aren't restored on resume (FLOW-025).

## Recommendations for our setup

Ranked by impact against effort. Changes in other repos need an issue there (global CLAUDE.md rule); this session opened none, so they are listed in the PR.

1. **A `verify` skill in each osrs-tracker repo** (high impact, low effort). `.claude/skills/verify/SKILL.md` that runs the repo's verify command (or per-Lambda verify in aws) and reports the output, without `disable-model-invocation`. Since v2.1.286 Claude's commit instructions then run it before every non-docs, non-test commit. Optionally run `/run-skill-generator` once in osrs-tracker-web for `/verify` against the running app. Done in all three repos 2026-10-12 (osrs-tracker/osrs-tracker-web#235, osrs-tracker/osrs-tracker-api#139, osrs-tracker/osrs-tracker-aws#81). Each skill runs every check even after a failure, cheapest first, so one fix round covers all failures (osrs-tracker/osrs-tracker-web#236, osrs-tracker/osrs-tracker-api#141). FLOW-013.
2. **Two lines in `~/.claude/CLAUDE.md`** (medium impact, trivial effort):
   - A reporting rule, not an extra verification step: "When reporting work done, name the verify command you ran in this session and its result; say which check you didn't run and why." Opus over-verifies when told to add verification passes (PROMPT-030), but evidence-based reporting holds for every tier (PROMPT-027).
   - "After two failed attempts at the same fix, stop, list the hypotheses and suggest a rewind or `/handoff`."
   FLOW-015, FLOW-020, FLOW-021.
3. **Wait on CI in the background in the repos' release steps** (medium impact, low effort). Replace the foreground `gh pr checks <n> --watch` with the same command run with `run_in_background` (or a Monitor that emits each finished check). Claude is woken once on exit and can work or answer meanwhile; never `/loop` or `sleep` for CI. Keep the mergeability poll first (SESS-022). Needs an issue per osrs-tracker repo, since the steps live in their skills. FLOW-024, FLOW-025, FLOW-028.
4. **Try `showClearContextOnPlanAccept: true` in user settings** (low–medium impact, trivial effort). Gives the "approve and start from the plan alone" option after long planning. Keep it off if it's never picked after a week. FLOW-007.
5. **Keep planning on Opus 5.5 at `high`; don't adopt `opusplan`** (decision). Our design-heavy sessions implement on Opus anyway, and the switch costs a cache rebuild. FLOW-009.
6. **Don't turn on desktop "Auto-merge when ready"** (decision): it squash-merges, while our repos merge with `--merge`. "Auto-fix CI" is fine to try. FLOW-029, SURF-002; the same decision is `kb-surfaces.md` recommendation 5.
7. **`handoff` skill: mention `/branch` and rewind as cheaper alternatives** when the problem is one bad detour rather than a full context (low impact, trivial effort). Change in FreekMencke/claude-skills via an issue there. FLOW-019, FLOW-021.

## Open questions

- **How many turns does `/goal`'s stall stop wait?** The docs say "several" (FLOW-023).
- **Does `agentPushNotifEnabled` ever fire for us?** It needs Remote Control connected; we haven't checked whether desktop WSL sessions count.
- **`TaskOutput`:** the CHANGELOG removed it in v2.1.277, the tools reference still calls it deprecated (FLOW-025). Recorded under Conflicts.
- **`/usage` Loops row:** v2.1.242 (costs page) or v2.1.243 (CHANGELOG)? Recorded under Conflicts.
- **ScheduleWakeup's parameters and the [60, 3600] s clamp** come only from an extracted prompt; the docs say "one minute to one hour" (FLOW-028).
- **Does "Foreground `sleep` is blocked" hold on every surface?** Seen only in this session's Bash tool description, v2.1.296.
- **Is a "step back and list hypotheses" prompt measurably better** than `/clear` with a better prompt? No source compares them (FLOW-021).
- **Does `/plan open` (CHANGELOG 2.1.119) still exist?** The commands page documents only `/plan [description]`.
- **Does the Plan subagent run on Opus under `opusplan`?** It "inherits from the main conversation"; not tested.
- **Playwright MCP's default profile** still decides whether parallel browser checks (FLOW-014) need `--isolated`. Tracked once, as `kb-sessions.md` open question 8 (SESS-013).
