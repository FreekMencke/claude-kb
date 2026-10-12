# Orchestration, parallelization and model selection

How to split work across several Claude agents, which mechanism to use for it, and which model and effort level each agent should run on. Researched 2026-10-12 against Claude Code docs at v2.1.29x, the Claude 5 model family (Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5) and the Anthropic engineering blog. Version numbers in entries are the ones the docs print; recheck them before relying on a version-gated feature.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which model should a codebase-search / explore subagent use? | Haiku 5.5 at `medium` effort, set explicitly. The built-in Explore agent runs on the **main session's model**, not Haiku, unless you override it. | ORCH-005, ORCH-030 |
| Which model should a reviewer subagent use? | Opus 5.5 (session tier) for bug and design review, in a fresh context. Use Sonnet 5.5 as the minimum for any reviewer. Don't use Haiku. | ORCH-030, ORCH-039, ORCH-042 |
| Which model should an implementer use? | Sonnet 5.5 for well-specified units. Opus 5.5 when the unit needs design judgment or defines a shared contract. | ORCH-030, ORCH-026 |
| Which model should the orchestrator use? | The session model, normally Opus 5.5. Use Fable 5.1 only for long-horizon work where Opus 5.5 at `xhigh` falls short. | ORCH-027, ORCH-029 |
| How do I set a subagent's model, and what wins? | The per-call `model` parameter wins, then frontmatter `model`, then `CLAUDE_CODE_SUBAGENT_MODEL`, then the main model. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` overrides all of them. | ORCH-003 |
| How do I set a subagent's effort, and what wins? | `CLAUDE_CODE_EFFORT_LEVEL` wins, then the per-call `effort` parameter, then frontmatter `effort`, then the session `/effort`. The 5.5 models default to `medium` in Claude Code. | ORCH-004, ORCH-028 |
| Effort or model: which should I change first? | Effort. Anthropic: "Sweep effort on your current model first. It is the cheapest experiment". | ORCH-028, ORCH-029 |
| How much does multi-agent cost? | About 3–15× the tokens of a single agent. Agent teams use about 7× in plan mode. Ten parallel sessions burn quota about 10× as fast. | ORCH-020 |
| When does parallelizing pay off? | Independent, read-heavy work: research, review, search, competing hypotheses, or disjoint files with a test oracle. It doesn't pay off for sequential chains, shared files or open design. | ORCH-021, ORCH-022, ORCH-023 |
| Subagents, agent view, agent teams or workflows? | Subagents for side tasks that return a summary. Agent view for independent tasks you hand off. Agent teams (experimental) when workers must talk to each other. Dynamic workflows for dozens of agents or cross-checked results. | ORCH-001 |
| How do I stop parallel agents from editing the same files? | Put each writer in its own worktree (`isolation: worktree`), give every file one owner, and keep shared files (changelog, registries) with the orchestrator. | ORCH-009, ORCH-024 |
| How should results come back? | As a short structured report (status, files, verify result, about 1–2k tokens). Put bulky output in files or the diff, never in the orchestrator's context. | ORCH-034, ORCH-035 |
| How do I cap cost? | Headless: `--max-budget-usd` and `--max-turns`. SDK: `maxBudgetUsd`. Subagents: frontmatter `maxTurns`. Workflows: run a small slice first and use the size guideline. All: cheaper models and lower effort for workers. | ORCH-038 |
| Can subagents spawn subagents? | Yes, up to 3 layers below the main conversation by default (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`), with at most 20 running concurrently. Agent-team teammates can't spawn teammates. | ORCH-006, ORCH-010 |
| How do I run agents on a schedule or with the laptop closed? | Cloud routines (minimum 1 hour), desktop scheduled tasks (local, app open), `/loop` (in-session, expires after 7 days), `claude --cloud`, or GitHub Actions. | ORCH-016, ORCH-017 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| ORCH-001 | The five native ways to run agents in parallel | comparison | claude-code, subagents, agent-view, agent-teams, workflows, projects |
| ORCH-002 | Defining subagents: locations and frontmatter | fact | claude-code, subagents, config |
| ORCH-003 | Subagent model resolution order | fact | model-selection, precedence, env-vars |
| ORCH-004 | Subagent effort resolution order | fact | effort, precedence |
| ORCH-005 | Built-in agents and their models: Explore is not Haiku | fact | explore, haiku, built-in-agents |
| ORCH-006 | Concurrency, nesting and background defaults | fact | limits, nesting, background, fork-mode |
| ORCH-007 | What a subagent sees and what it returns | fact | context, results, resume |
| ORCH-008 | Forked subagents vs fresh subagents | fact | fork, context |
| ORCH-009 | Worktree isolation for parallel writers | tool | worktrees, isolation, git |
| ORCH-010 | Agent teams (experimental) | tool | agent-teams, cost, pitfalls |
| ORCH-011 | Dynamic workflows | tool | workflows, ultracode, scale |
| ORCH-012 | `/batch` for one large change | tool | batch, worktrees |
| ORCH-013 | Agent view and background sessions | tool | agent-view, background, quota |
| ORCH-014 | Headless fan-out with `claude -p` | tool | headless, ci, budget |
| ORCH-015 | Agent SDK subagents, budgets and cost tracking | tool | agent-sdk, budget, cost |
| ORCH-016 | Cloud sessions and GitHub Actions | tool | cloud, remote, github-actions |
| ORCH-017 | Scheduled runs: routines, desktop tasks, `/loop` | comparison | schedule, routines, loop |
| ORCH-018 | Claude Managed Agents multi-agent (API) | tool | managed-agents, api |
| ORCH-019 | Hooks for orchestration | tool | hooks, guardrails |
| ORCH-020 | Token and quota multipliers of multi-agent work | fact | cost, tokens, quota |
| ORCH-021 | When multi-agent helps and when it hurts | recommendation | decision, parallelization |
| ORCH-022 | Decomposition follows context, not role | anti-pattern | decomposition, coding |
| ORCH-023 | Single writer, parallel readers | pattern | conflicts, review, research |
| ORCH-024 | Cutting work into truly independent units | pattern | decomposition, ownership, contracts |
| ORCH-025 | Scale agent count to task complexity | recommendation | sizing, cost |
| ORCH-026 | Current model tiers: price, latency, context | comparison | models, pricing, latency |
| ORCH-027 | Anthropic's model-choice guidance | recommendation | models, choosing |
| ORCH-028 | Reasoning effort: levels, defaults, effects | fact | effort, thinking |
| ORCH-029 | Measured economics of orchestrator and advisor setups | fact | orchestrator, advisor, cost |
| ORCH-030 | Model tier per agent role | recommendation | roles, model-selection |
| ORCH-031 | Main-session model config, aliases and plan limits | fact | model-config, aliases, fable |
| ORCH-032 | Fast mode | fact | fast-mode, latency, cost |
| ORCH-033 | The cheapest model is not always the cheapest run | anti-pattern | haiku, turns, cost |
| ORCH-034 | Return summaries and references, not raw output | pattern | results, context |
| ORCH-035 | Structured subagent reports and status codes | pattern | results, protocol |
| ORCH-036 | Progress and handoff files for long runs | pattern | long-running, handoff, compaction |
| ORCH-037 | Failure modes and their guardrails | anti-pattern | failure-modes, guardrails |
| ORCH-038 | Cost caps per mechanism | recommendation | cost, budget, limits |
| ORCH-039 | Verification: generator-verifier and clean-context review | pattern | review, verification |
| ORCH-040 | Prompt caching in fan-outs | fact | caching, cost |
| ORCH-041 | Superpowers subagent-driven development | pattern | community, superpowers |
| ORCH-042 | Official code-review plugin as a tiering reference | pattern | official-example, review, tiers |
| ORCH-043 | Worktree session managers | tool | community, worktrees |
| ORCH-044 | Ideas from other tools and frameworks | comparison | aider, amp, openai, magentic-one, langgraph |
| ORCH-045 | Cognition vs Anthropic on multi-agent | comparison | debate, writes |
| ORCH-046 | Best-of-N needs a good verifier | fact | best-of-n, voting |
| ORCH-047 | Decision table: task → pattern → tier | recommendation | decision-table |

---

## [ORCH-001] The five native ways to run agents in parallel
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Run agents in parallel](https://code.claude.com/docs/en/agents), [Dynamic workflows](https://code.claude.com/docs/en/workflows)
- Related: ORCH-010, ORCH-011, ORCH-013, ORCH-047

Claude Code has five ways to work on several tasks at once. They differ in who coordinates the work and where results go.

| Approach | Coordinator | Results go to | Use when (docs) |
|---|---|---|---|
| Subagents | Claude, turn by turn | the spawning conversation, as a summary | "A side task would flood your main conversation" |
| Agent view (`claude agents`, research preview) | You | you | "several independent tasks" to hand off and check back on |
| Agent teams (experimental, off by default) | A lead agent | a shared task list and mailboxes | workers must share findings and coordinate |
| Projects (public beta, Pro/Max) | Claude, across cloud threads | you | multi-day work that keeps running with your machine off |
| Dynamic workflows | A script | script variables, with only the final answer in context | dozens to hundreds of agents, or results cross-checked against each other |

Supporting tools: worktrees (isolated checkouts), cross-session messaging, and `/batch` (5–30 worktree subagents for one change). The docs' three questions for choosing:
1. Who coordinates?
2. Do workers need to talk to each other?
3. Do they touch the same files? If so, use worktrees.

They also warn: "Running several sessions or subagents at once multiplies token usage."

## [ORCH-002] Defining subagents: locations and frontmatter
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Subagents](https://code.claude.com/docs/en/sub-agents), [SDK subagents](https://code.claude.com/docs/en/agent-sdk/subagents)
- Related: ORCH-003, ORCH-004, ORCH-009

Subagents are Markdown files with YAML frontmatter. When names collide, the higher-priority location wins: managed settings, then `--agents` JSON, then `.claude/agents/` (project), then `~/.claude/agents/` (user), then plugin `agents/`. Only `name` and `description` are required, and unknown fields are silently ignored.

Fields that matter for orchestration:
- `model`: `haiku`, `sonnet`, `opus`, `fable`, a full ID, or `inherit`.
- `effort`: `low` to `max`.
- `tools` / `disallowedTools`.
- `permissionMode`.
- `maxTurns`: at the cap the result is returned marked partial and can be resumed.
- `isolation: worktree`.
- `background: true`.
- `memory`: `user`, `project` or `local`.
- `skills`: preloads skills.
- `mcpServers`, `hooks`.
- `omitClaudeMd` (v2.1.271+).
- `experimental.cacheTtl`.

Gotchas:
- Plugin agents ignore `hooks`, `mcpServers` and `permissionMode`. Copy the file into `.claude/agents/` if you need them.
- When the parent runs in `bypassPermissions`, `acceptEdits` or auto mode, that mode overrides the subagent's `permissionMode`.
- Keep custom agents' descriptions under 15k tokens combined.
- The SDK takes the same fields through `AgentDefinition` in the `agents` option. Programmatic agents override filesystem agents with the same name.

## [ORCH-003] Subagent model resolution order
- Type: fact
- Applies to: Claude Code, Claude API (Agent SDK)
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Subagents – choose a model](https://code.claude.com/docs/en/sub-agents), [Model config](https://code.claude.com/docs/en/model-config), [Agent teams](https://code.claude.com/docs/en/agent-teams), [Workflows](https://code.claude.com/docs/en/workflows)
- Related: ORCH-004, ORCH-005, ORCH-030

Claude Code resolves a subagent's model in this order, first match wins:
1. The per-invocation `model` parameter on the Agent tool call.
2. The definition's `model` frontmatter (`inherit` means the main model).
3. `CLAUDE_CODE_SUBAGENT_MODEL`.
4. The main conversation's model.

Before v2.1.251 the env var came first and overrode everything, so older advice may say so. Setting `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` together with the env var (v2.1.257+) puts every subagent, teammate and workflow agent on that model. The docs: "Claude Code ignores the `model` field in subagent definitions, and Claude can't pass a model when it starts a subagent."

Other surfaces:
- **Workflow stages:** a model named in a workflow script counts as the per-invocation model.
- **Teammates:** the model named in the spawn prompt, then the definition, then the env var, then the lead's model. A teammate's model is fixed at spawn.
- **Forks:** always use the main model.

A model given at spawn overrides the model a repo agent pins in its file. To keep a pinned reviewer on its own model, don't pass `model` when spawning it. Unset subagents inherit the session model, which is often the most expensive, so set `model` on every spawn ([superpowers](https://github.com/obra/superpowers) gives the same advice).

## [ORCH-004] Subagent effort resolution order
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Subagents – effort level](https://code.claude.com/docs/en/sub-agents), [Model config – effort](https://code.claude.com/docs/en/model-config)
- Related: ORCH-003, ORCH-028

Effort for a non-fork subagent resolves in this order, first match wins:
1. `CLAUDE_CODE_EFFORT_LEVEL` env var: "takes precedence over both".
2. Per-invocation `effort` parameter (v2.1.292+): "overrides the `effort` field and stays in effect when the subagent is resumed".
3. Frontmatter `effort`: "Overrides the session effort level, but not the `CLAUDE_CODE_EFFORT_LEVEL` environment variable."
4. Session level (`--effort` or `/effort`), then saved `effortLevel`/`modelSettings`, then the model default.

An organization effort cap (`maxEffortLevel`) limits all of these. Teammates inherit the lead's effort. Extended-thinking settings are inherited from the main session, and there is no per-subagent thinking switch.

The model default matters. In Claude Code, Opus 5.5, Sonnet 5.5 and Haiku 5.5 default to `medium`, so a subagent with no effort set runs at `medium` unless the session or env var says otherwise (ORCH-028). The `effortLevel` setting accepts `low` to `xhigh`, but not `max`.

## [ORCH-005] Built-in agents and their models: Explore is not Haiku
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Subagents – built-in subagents](https://code.claude.com/docs/en/sub-agents)
- Related: ORCH-003, ORCH-030, ORCH-033

| Built-in | Model | Notes |
|---|---|---|
| Explore | **Main conversation's model** | Read-only, skips CLAUDE.md and git status, one-shot (not resumable). With a Fable main model on subscription/Console/gateway it runs on the `opus` alias. |
| Plan | Main model | Read-only, used in plan mode, one-shot |
| general-purpose | `CLAUDE_CODE_SUBAGENT_MODEL`, else main | All tools; the default when no type is given |
| claude | Standard order | Catch-all; the default for dispatched background sessions |
| claude-code-guide | Haiku | Claude Code questions |
| statusline-setup | Sonnet | |

The community belief that Explore runs on Haiku is not true of the current docs. With an Opus 5.5 session, every Explore sweep runs on Opus. Plain `CLAUDE_CODE_SUBAGENT_MODEL` does not change Explore or Plan. The docs' fix: "A user or project subagent named `Explore` overrides the built-in and keeps its own `model` field, so define one with `model: haiku` to run exploration on a lower-cost model." Alternatively, pass `model: haiku` on each Explore call.

You can disable the built-ins with `permissions.deny: ["Agent(Explore)"]` or `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS=1`.

## [ORCH-006] Concurrency, nesting and background defaults
- Type: fact
- Applies to: Claude Code, Claude API (Agent SDK)
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Subagents](https://code.claude.com/docs/en/sub-agents), [Env vars](https://code.claude.com/docs/en/env-vars), [SDK subagents](https://code.claude.com/docs/en/agent-sdk/subagents)
- Related: ORCH-007, ORCH-008, ORCH-037

Limits and defaults:
- **Concurrency:** 20 running subagents by default (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, v2.1.217+). Past the cap the spawn fails with `Concurrent subagent limit reached`. There is no limit on the total over a session. Ultracode sessions are exempt.
- **Nesting:** "a subagent can spawn subagents of its own, up to three layers below the main conversation" (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, default 3; `1` turns nesting off). The default changed several times (5, then 1, then 3 since v2.1.219), so "subagents can't spawn subagents" is outdated.
- **Background:** fork mode is on by default in interactive sessions (v2.1.232+). There, "Claude Code runs the subagent in the background, forks and non-fork subagents alike, and Claude can't ask for the foreground." It is off by default in `-p` and the SDK. `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` forces the foreground.
- **Background tool set:** background subagents get a reduced built-in tool set with no `AskUserQuestion`. Their permission prompts surface in the main session.
- **Never available to subagents:** `AskUserQuestion`, plan-mode tools, `ScheduleWakeup` and `Workflow`.

The SDK docs warn that Opus 5 "delegates to subagents more readily than earlier models", so set the depth and concurrency caps on Opus 5-class runs. A worker that spawns its own fan-out multiplies cost without the orchestrator seeing it.

## [ORCH-007] What a subagent sees and what it returns
- Type: fact
- Applies to: Claude Code, Claude API (Agent SDK)
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Subagents](https://code.claude.com/docs/en/sub-agents), [Tools reference – Agent tool](https://code.claude.com/docs/en/tools-reference), [SDK subagents](https://code.claude.com/docs/en/agent-sdk/subagents)
- Related: ORCH-008, ORCH-034, ORCH-035, REPO-010, TOK-006

**What a non-fork subagent starts with:**
- its own system prompt (the agent body), environment and tools, and the delegation message;
- the full CLAUDE.md hierarchy (user, project, `CLAUDE.local.md`, managed, and `AGENTS.md` as project instructions), except for Explore and Plan;
- a git status snapshot, also skipped by Explore and Plan;
- the full body of preloaded `skills:`;
- a roster of named sibling agents.

`omitClaudeMd: true` (v2.1.271+) starts a custom agent without the user, project and local CLAUDE.md files, keeping managed ones. It's ignored when the agent runs as the main session (`--agent`).

It does **not** get the parent's history, the files already read, the skills already invoked, the output style or auto memory, so the brief must be self-contained. Its context window is sized by its own model.

**What returns:** "The parent doesn't see the subagent's intermediate tool calls or outputs, only that final result." Background results arrive as a notification in a later turn. The result carries an `agentId` for resuming.

**Resuming:** `SendMessage` to the ID or name continues the subagent with its full history; it does not need agent teams. Explore and Plan can't be resumed. Transcripts are kept 30 days (`cleanupPeriodDays`).

**Compaction:** subagents auto-compact on the same triggers as the main session.

**Turn cap:** `maxTurns` returns partial output marked as partial (v2.1.246+), and the subagent can be resumed.

The docs' own warning: "Running many subagents that each return detailed results can consume significant context."

## [ORCH-008] Forked subagents vs fresh subagents
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Subagents – fork](https://code.claude.com/docs/en/sub-agents), [Run agents in parallel](https://code.claude.com/docs/en/agents)
- Related: ORCH-007, ORCH-022

A fork "inherits the entire conversation so far instead of starting fresh", along with the system prompt, tools and model.
- **Start one:** with `/subtask` (or `/fork` when agent view is off). Claude spawns them itself where fork mode is on.
- **Limits:** a fork can't spawn further forks. You can pass `isolation: "worktree"` on the fork call. Deny forks with `Agent(fork)`.
- **Copying a whole session:** `/fork` (with agent view on) copies the session into a new background session instead.

**When to use which:**
- A fork suits a side task that needs what the conversation already knows, such as "try the alternative approach we discussed", because it skips the cost of re-gathering context.
- A fresh subagent suits a task with a clean brief, where the parent's history would bias it (reviewers) or bloat it (searches).
- Forks always run on the main model, so they can't be used to drop to a cheaper tier.

## [ORCH-009] Worktree isolation for parallel writers
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Worktrees](https://code.claude.com/docs/en/worktrees), [Subagents](https://code.claude.com/docs/en/sub-agents), [Agent view](https://code.claude.com/docs/en/agent-view)
- Related: ORCH-010, ORCH-023, ORCH-024

Ways to get a worktree:
- **Session:** `claude --worktree <name>` (`-w`) creates `.claude/worktrees/<name>/` on branch `worktree-<name>`. `--worktree "#1234"` or a PR URL starts from that PR's head.
- **Subagent:** `isolation: worktree` in frontmatter, or on a fork's Agent call. Per-call `isolation` for non-fork subagents is only implied by the docs (see Open questions).
- **Background session:** each dispatched session moves into its own worktree at its first edit.

Base and copied files:
- "New worktrees branch from the repository's default branch", **not** your current branch.
- `worktree.baseRef: "head"` starts from your local HEAD, including unpushed commits. The default is `"fresh"`.
- `.worktreeinclude` (gitignore syntax) copies matching *gitignored* files such as `.env` into new worktrees.

Lifecycle and isolation:
- A subagent worktree with no changes is removed automatically. One with changes stays until a later sweep, and only once it holds no work.
- While a session is isolated, edits, cwd and git redirects into the main checkout are blocked. `cp` and shell redirects are not tracked.

Gotchas:
- A subagent in a default-location worktree loads CLAUDE.md and `.claude/rules/` from the main checkout, not from the worktree's branch.
- `-p` runs never clean up their worktrees.
- Agent-team teammates are **not** isolated in worktrees.

## [ORCH-010] Agent teams (experimental)
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Agent teams](https://code.claude.com/docs/en/agent-teams), [Costs](https://code.claude.com/docs/en/costs), [Run agents in parallel](https://code.claude.com/docs/en/agents)
- Related: ORCH-001, ORCH-009, ORCH-020

**Setup and structure:**
- Enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Interactive only; in `-p` and the SDK a named subagent stays a plain subagent.
- The lead is the main session. Teammates are separate Claude Code instances with a shared task list (file-locked claiming, dependencies) and per-agent mailboxes.
- Each teammate loads CLAUDE.md, MCP servers and skills, but not the lead's history.
- On the Claude 5 models the Task tools are off unless `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` is set or they are allowed. Without them, teammates coordinate by messages only.

**Cost:** "approximately 7x more tokens than standard sessions when teammates run in plan mode." Docs' tips: use Sonnet for teammates, keep teams small (3–5 teammates, 5–6 tasks each), keep spawn prompts focused, and shut down teammates that are done.

**Pitfalls:**
- **Silent teams.** While enabled, any Agent call with a `name` launches a teammate, "unless the call is a fork or passes `isolation` on the call itself". A frontmatter `isolation` does not prevent this, and the teammate then runs in the main checkout.
- **No worktree isolation.** "Two teammates editing the same file leads to overwrites."
- **Other limits:** no nested teams; no resumption of in-process teammates; task status can lag; one team per session; teammates' permissions are fixed at spawn.

**When:** research and review, separate new modules, competing-hypothesis debugging and cross-layer work. Start with research or review before parallel implementation.

## [ORCH-011] Dynamic workflows
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Dynamic workflows](https://code.claude.com/docs/en/workflows)
- Related: ORCH-001, ORCH-034, ORCH-038, ORCH-040

A workflow is a JavaScript script, written by Claude and run by a runtime, that calls `agent()`, `parallel()` and `pipeline()`. It "moves the plan into code". Intermediate results stay in script variables, "so Claude's context holds only the final answer". An `agent()` call can take a JSON `schema` so the agent returns validated JSON instead of prose.

**Triggers:** include `ultracode` in the prompt, say "use a workflow", run a bundled workflow such as `/deep-research`, or turn on `/effort ultracode` so Claude plans a workflow for every substantive task.

**Limits:**
- 16 concurrent agents by default (`CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS`, 1–256);
- 4,096 items per `parallel()` or `pipeline()` call;
- 1,000 agents per run;
- no mid-run user input;
- an agent that stalls is restarted automatically.

**Cost and resumption:**
- A `Large workflow` warning appears above 25 agents or about 1.5M projected tokens. It is advisory only.
- Runs are resumable in the same session and pause on usage limits.
- `/workflows` shows per-agent token use and lets you stop a run.
- Each stage can name a model, which counts as the per-invocation model.

**When:** "a codebase-wide audit, a 500-file migration, cross-checked research, or a plan drafted from several angles", that is, work that outgrows a handful of subagents or needs independent agents to check each other. Docs advice: run on a small slice first, and use the `small` size guideline to keep runs to fewer agents.

## [ORCH-012] `/batch` for one large change
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Run agents in parallel](https://code.claude.com/docs/en/agents), [Best practices](https://code.claude.com/docs/en/best-practices)
- Related: ORCH-009, ORCH-014

`/batch` is a bundled skill that "has Claude split one large change into 5 to 30 worktree-isolated subagents". It is a packaged use of subagents and worktrees, not a separate coordination style. Outside a git repo it needs a `WorktreeCreate` hook (v2.1.281+).

It fits a repetitive change across many independent files: a lint-rule migration, an API rename, adding types module by module. It does not fit changes that need a shared design decided first. Settle the contract yourself, then batch.

## [ORCH-013] Agent view and background sessions
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Agent view](https://code.claude.com/docs/en/agent-view), [Run agents in parallel](https://code.claude.com/docs/en/agents)
- Related: ORCH-001, ORCH-009, ORCH-020

**Starting and managing sessions:**
- `claude --bg "task"` starts a full background session and returns at once. It can't be combined with `-p`.
- `claude agents` opens agent view (research preview), one screen that shows every session's state.
- Other commands: `claude attach | logs | stop | rm | respawn <id>`, plus `/bg` and `/fork` inside a session.
- Notifications fire when a session needs input, finishes or fails. The `Notification` hook receives these as `agent_needs_input` and `agent_completed`.

**How sessions run:**
- Each session moves into its own worktree under `.claude/worktrees/` before its first edit (`worktree.bgIsolation: "none"` turns this off).
- A supervisor keeps sessions alive after the terminal closes, but they are local and stop when the machine shuts down.

**Results:** go to you, not to an orchestrating session. Use cross-session messaging if sessions must pass findings to each other.

**Quota:** "running ten agents in parallel uses quota roughly ten times as fast as running one."

**Use for:** several independent tasks you want to hand off and check back on, such as unrelated bugs or separate tickets. It is the human-orchestrated alternative to subagents.

## [ORCH-014] Headless fan-out with `claude -p`
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Headless](https://code.claude.com/docs/en/headless), [CLI reference](https://code.claude.com/docs/en/cli-reference), [Best practices – fan out](https://code.claude.com/docs/en/best-practices)
- Related: ORCH-012, ORCH-038

The docs' fan-out pattern: loop `claude -p` over a file list with `--allowedTools` and `--permission-mode dontAsk`. "Refine your prompt based on what goes wrong with the first 2-3 files, then run on the full set."

Flags for unattended parallel runs:
- **Caps:**
  - `--max-budget-usd` stops at an estimated spend, print mode only. Subagent spend counts, and spend can overshoot, so leave headroom.
  - `--max-turns` exits with an error at the limit. There is no limit by default.
- **Model:** `--model sonnet` or `haiku`; `--fallback-model sonnet,haiku`; `--effort low|…|max`.
- **Permissions:** `--permission-prompts none` denies anything that would prompt (v2.1.259+).
- **Reproducibility:** `--bare` skips hooks, skills, plugins, MCP, memory, CLAUDE.md and subagents. It is recommended for scripts and needs an API key.
- **Output:** `--output-format json` gives `result`, `session_id` and `total_cost_usd` (a client-side estimate). `--json-schema` puts validated output in `structured_output`.
- **Isolation:** `--worktree` per process when the runs edit files.

All processes share one plan or API rate limit.

## [ORCH-015] Agent SDK subagents, budgets and cost tracking
- Type: tool
- Applies to: Claude API (Agent SDK)
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [SDK subagents](https://code.claude.com/docs/en/agent-sdk/subagents), [SDK cost tracking](https://code.claude.com/docs/en/agent-sdk/cost-tracking), [SDK sessions](https://code.claude.com/docs/en/agent-sdk/sessions)
- Related: ORCH-003, ORCH-006, ORCH-038

**Defining subagents:** pass `agents: {name: AgentDefinition}` and include `"Agent"` in `allowedTools`. Older SDKs and the init tool list call it `Task`, so match both. `AgentDefinition` takes `model`, `effort`, `maxTurns`, `tools`, `background`, `permissionMode` and `skills`; `omitClaudeMd` exists in TypeScript only. The built-in `general-purpose` agent always exists unless `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS=1` is set.

**Caps:**
- `maxBudgetUsd` covers subagents and refuses new spawns with `Budget limit reached`. Docs: "Setting a budget is a good default for production agents."
- `maxTurns`.
- Depth and concurrency env vars, passed through the `env` option. In TypeScript, spread `process.env` because the option replaces the environment.
- Hitting a cap yields a `ResultMessage` with subtype `error_max_turns` or `error_max_budget_usd`.

**Cost accounting:** `usage` *excludes* subagents, while `total_cost_usd` and `modelUsage` include them, so use `modelUsage` for whole-tree accounting. On a resume, results report the session total, so don't sum them.

**Sessions:** `resume` continues a session, and `forkSession` branches the conversation but not the filesystem.

**Hooks:** `SubagentStart` and `SubagentStop` run in your process and cost no context.

## [ORCH-016] Cloud sessions and GitHub Actions
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web), [GitHub Actions](https://code.claude.com/docs/en/github-actions)
- Related: ORCH-017, ORCH-020

**Cloud sessions** (Pro, Max, Team, and Enterprise premium seats):
- Start from claude.ai/code, the desktop app, mobile, or `claude --cloud "task"` (`--remote` is a deprecated alias). Each `--cloud` call is an independent session.
- `--cloud` clones the remote at your current branch, so push first.
- `claude --teleport` pulls a session down to the terminal (one-way, and the working tree must be clean).
- Each session runs on an Ubuntu VM with 4 vCPU, 16 GB RAM and 30 GB disk, with a network allowlist and cached setup scripts. Idle VMs pause and may be reclaimed.
- "Cloud sessions share rate limits with all other Claude and Claude Code usage within your account. Running multiple tasks in parallel consumes more rate limits proportionately." There is no VM charge.

**GitHub Actions** (`anthropics/claude-code-action@v1`):
- Responds to `@claude` in issues and PRs, or runs a `prompt` on any event, including `schedule`.
- Pass CLI flags through `claude_args` (for example `--max-turns 5 --model …`).
- Docs: set `--max-turns`, workflow timeouts and concurrency controls.
- Cron runs only from the default branch.

## [ORCH-017] Scheduled runs: routines, desktop tasks, `/loop`
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks), [Routines](https://code.claude.com/docs/en/routines), [Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks), local test (routine runs 2026-10-12)
- Related: ORCH-016, REPO-030, SKILL-060

| | Cloud routines | Desktop scheduled tasks | `/loop` and cron tools |
|---|---|---|---|
| Runs on | Anthropic cloud (fresh clone) | Your machine (app open, awake) | Your open session |
| Minimum interval | 1 hour | 1 minute | 1 minute |
| Local files | No | Yes | Yes |
| Permissions | Autonomous, no prompts | Per task | Inherited from the session |
| Expiry or caps | 100 scheduled runs/hour/account | One catch-up run within 7 days | Recurring tasks expire after 7 days; 50 per session |

Notes:
- Routines (research preview) are created with `/schedule` or at claude.ai/code/routines. Their triggers are a schedule, an API POST, or GitHub `pull_request`/`release` events. All connectors are attached by default, so trim them. Runs use subscription usage.
- Cloud sessions, routines included, block GitHub's GraphQL API: `gh pr list`, `gh pr create` and `gh pr view` fail with "GitHub GraphQL is not available from Claude Code sessions; use the REST API". Write routine prompts with `gh api repos/<owner>/<repo>/…` (observed 2026-10-12). Marketplace plugins don't load there either (SKILL-060).
- `/loop` without an interval self-paces between 1 minute and 1 hour. Prefer the Monitor tool over polling.

Docs: "Use cloud tasks for work that should run reliably without your machine. Use Desktop tasks when you need access to local files and tools. Use `/loop` for quick polling during a session."

## [ORCH-018] Claude Managed Agents multi-agent (API)
- Type: tool
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview), [Multi-agent orchestration](https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Related: ORCH-011, ORCH-015

Managed Agents is a hosted agent harness for API builders (beta header `managed-agents-2026-04-01`). It is built from four concepts: agents, environments (a cloud or self-hosted sandbox), sessions and an event stream. Its multi-agent block (`multiagent_20261001`) offers three mechanisms:
- **Subagents:** one level of delegation, up to 25 concurrent child threads and up to 20 predefined agents. Predefined agents can use different models; the docs example mixes Opus 5.5 and Haiku 5.5.
- **Dynamic workflows:** under a session budget.
- **Advisor model:** billed at the advisor's rates.

Pricing: tokens at standard rates plus $0.08 per session-hour while running. There is no Batch discount.

Use it when you are building a product that needs long-running asynchronous agents without running the harness yourself. For your own coding work, Claude Code's mechanisms are the right layer. Unverified: whether runtime is billed per thread or per session.

## [ORCH-019] Hooks for orchestration
- Type: tool
- Applies to: Claude Code, Claude API (Agent SDK)
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Hooks](https://code.claude.com/docs/en/hooks), [Agent teams](https://code.claude.com/docs/en/agent-teams)
- Related: ORCH-037, ORCH-039

| Event | Can block? | Orchestration use |
|---|---|---|
| `SubagentStart` | No; can add `additionalContext` | Inject shared decisions or repo rules into every subagent; log spawns |
| `SubagentStop` | Yes (`decision: "block"` + reason) | Refuse to let a worker stop until its verify command passes; receives `last_assistant_message` |
| `TaskCreated` / `TaskCompleted` | Yes (exit 2) | Gate team tasks on tests |
| `TeammateIdle` | Yes | Keep a teammate working |
| `WorktreeCreate` / `WorktreeRemove` | Create: any non-zero exit fails. Remove: fails only if the directory still exists afterward | Custom VCS, dependency install, port allocation per worktree |
| `PreCompact` | Yes (exit 2 blocks compaction) | Persist a progress file before compaction |
| `PostCompact` | No (stderr to user only) | Post-compaction logging |

Matchers on `SubagentStart` and `SubagentStop` take the agent type, so you can target one role, such as only `implementer` agents. A `SubagentStop` gate that runs the unit's check turns "a report is a claim" into an enforced rule. Unverified: the exact input fields of `TaskCreated`, `TaskCompleted` and `TeammateIdle`.

## [ORCH-020] Token and quota multipliers of multi-agent work
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Multi-agent research system (2025-06-13)](https://www.anthropic.com/engineering/multi-agent-research-system), [When and how to use multi-agent (2026-01-23)](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them), [Costs](https://code.claude.com/docs/en/costs), [Agent view](https://code.claude.com/docs/en/agent-view), [C compiler (2026-02-05)](https://www.anthropic.com/engineering/building-c-compiler)
- Related: ORCH-021, ORCH-038

| Figure | Source and context |
|---|---|
| Agents use about 4× the tokens of chat; multi-agent about 15× | Research system post, Opus 4 era |
| Multi-agent uses "3-10x more tokens than single-agent approaches for equivalent tasks" | Claude blog, 2026. The overhead comes from duplicated context, coordination messages and handoff summaries |
| Agent teams use about 7× the tokens of a standard session | Costs page, when teammates run in plan mode |
| 10 parallel background sessions use quota about 10× as fast | Agent view docs |
| Token usage explains 80% of BrowseComp variance (95% with tool calls and model) | Research post. More tokens buy more quality, which is the reason multi-agent works |
| 16 agents, about 2,000 sessions, just under $20k | C compiler project, Opus 4.6 |
| About $13 per developer per active day; under $30 for 90% of users | Costs page, enterprise average |

The 15× and 3–10× figures measure different baselines (versus chat and versus a single agent). Use 3–10× when estimating a coding fan-out. The multi-agent premium is only worth paying when the extra tokens buy coverage or independence that one context can't (ORCH-021).

## [ORCH-021] When multi-agent helps and when it hurts
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Research system](https://www.anthropic.com/engineering/multi-agent-research-system), [When and how](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them), [Subagents](https://code.claude.com/docs/en/sub-agents), [Agent teams](https://code.claude.com/docs/en/agent-teams), [Optimizing for cost and intelligence](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence)
- Related: ORCH-022, ORCH-023, ORCH-047

**Helps** (Anthropic's three cases):
1. Context pollution degrades a single agent, for example verbose logs or wide searches.
2. Subtasks can genuinely run in parallel.
3. Specialization improves tool choice, for example 20+ tools or conflicting instructions.

Also when the work "fans out across genuinely independent files, documents, or cases, especially more than one context window of it", and for debugging with competing hypotheses, because "sequential investigation suffers from anchoring".

**Hurts:**
- "most coding tasks involve fewer truly parallelizable tasks than research" (2025).
- The work is one chain, fits in one context, or "a single model at lower effort already meets your bar".
- Sequential tasks, same-file edits, or "many dependencies".
- The subagents docs say to stay in the main conversation for frequent back-and-forth, for phases that share significant context, for quick targeted changes, and when latency matters.
- "Outside these situations, the coordination costs typically exceed the benefits." Start with a single agent.

**Speed:** parallel subagents mainly buy thoroughness. Anthropic's research system cut time by up to 90%, but only with 3–5 parallel subagents each making parallel tool calls on breadth-first queries.

## [ORCH-022] Decomposition follows context, not role
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [When and how to use multi-agent](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)
- Related: ORCH-021, ORCH-024

The anti-pattern is splitting a coding task by job title: planner agent, implementer agent, tester agent, reviewer agent. Anthropic: "Dividing by type of work (one agent writes features, another writes tests, a third reviews code) creates constant coordination overhead." In an experiment with agents specialized by role, "the subagents spent more tokens on coordination than on actual work."

The rule is "Decomposition follows context, not problem type." Split where the context separates:
- **Good boundaries:** independent research paths, components with clean interfaces, and black-box verification (a reviewer that needs only the diff and the criteria).
- **Poor boundaries:** sequential phases of the same work, and tightly coupled components.

The practical consequence is to keep a feature and its tests in the same unit. A *separate verifier* is the exception: it works because it needs little context (ORCH-039).

## [ORCH-023] Single writer, parallel readers
- Type: pattern
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: [Cognition – Multi-Agents: What's Actually Working (2026-04-22)](https://cognition.ai/blog/multi-agents-working), [Run agents in parallel](https://code.claude.com/docs/en/agents), [Superpowers SDD](https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md), [C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- Related: ORCH-009, ORCH-024, ORCH-045

The safest default is to parallelize reading and keep writing single-threaded, or partitioned by file. Cognition (2026): "multi-agent systems work best today when writes stay single-threaded and the additional agents contribute intelligence rather than actions." Superpowers: "Never dispatch multiple implementation subagents in parallel (conflicts)."

**Safe to parallelize:** codebase search, research, review lenses, root-cause hypotheses, validation of findings.

**Parallel writes can work, with three conditions:**
1. Every writer has its own checkout (a worktree or container).
2. No two writers own the same file.
3. There is an oracle, a test suite or reference implementation, that tells each writer when it is done.

Anthropic's 16-agent C compiler had all three and still saw frequent merge conflicts. It stalled when all agents hit the same Linux-kernel bug and overwrote each other's fixes, and recovered once a known-good oracle (GCC) let each agent work on different files.

## [ORCH-024] Cutting work into truly independent units
- Type: pattern
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: [Research system](https://www.anthropic.com/engineering/multi-agent-research-system), [Cognition – Don't build multi-agents](https://cognition.ai/blog/dont-build-multi-agents), [Agent teams](https://code.claude.com/docs/en/agent-teams), [Superpowers parallel agents](https://github.com/obra/superpowers/blob/main/skills/dispatching-parallel-agents/SKILL.md)
- Related: ORCH-022, ORCH-023, ORCH-035

A unit can run in parallel when it can finish without knowing how the others turned out. The checklist:
- **One owner per file.** Shared files (changelog, registries, routes, lockfiles, barrel exports) stay with the orchestrator, and units report the entries they need.
- **Shared code first.** A library that several units build on goes to one unit in an earlier wave.
- **Decide once, paste everywhere.** Cognition: "Actions carry implicit decisions, and conflicting decisions carry bad results." Settle signatures, schemas, naming, error handling and wording before launch, and paste identical text into each brief. A unit with open design questions isn't ready.
- **A self-contained brief.** It holds "an objective, an output format, guidance on the tools and sources to use, and clear task boundaries" (Anthropic). Vague briefs caused duplicated searches.
- **Done-when is a runnable check.** Without an oracle, agents "solve the wrong problem".
- **Same root cause means one agent.** Superpowers: don't parallelize "when failures may share a cause".
- **Shared runtime stays with the orchestrator:** dev servers, databases, ports.

## [ORCH-025] Scale agent count to task complexity
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Research system](https://www.anthropic.com/engineering/multi-agent-research-system), [Agent teams](https://code.claude.com/docs/en/agent-teams), [Workflows](https://code.claude.com/docs/en/workflows)
- Related: ORCH-020, ORCH-037

Anthropic embeds explicit scaling rules in the lead's prompt, because without them early agents spawned "50 subagents for simple queries":

| Task | Agents |
|---|---|
| Simple fact-finding | 1 agent, 3–10 tool calls |
| Direct comparison | 2–4 subagents, 10–15 calls each |
| Complex research | 10+ subagents with divided responsibilities |
| Agent team | Start with 3–5 teammates and 5–6 tasks each. "Three focused teammates often outperform five scattered ones." |
| Workflow size guideline | small < 5, medium < 10 (default; small on Pro), large < 50 agents |

A unit you could finish in two tool calls is not worth a subagent: the brief and the return report cost more than the work. Put these rules in the orchestrator's prompt or skill. Don't leave the count to the model, especially on Opus 5-class models, which delegate "more readily" (ORCH-006).

## [ORCH-026] Current model tiers: price, latency, context
- Type: comparison
- Applies to: Claude API, Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Effort](https://platform.claude.com/docs/en/build-with-claude/effort)
- Related: ORCH-027, ORCH-028, ORCH-030

| | Fable 5.1 | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 |
|---|---|---|---|---|
| API ID | `claude-fable-5-1` | `claude-opus-5-5` | `claude-sonnet-5-5` | `claude-haiku-5-5` |
| Input / output per MTok | $10 / $50 | $4 / $20 | $2 / $10 | $0.10 / $0.50 (≤100K prompt); $0.50 / $2.50 (>100K) |
| Cache read per MTok | $0.25 | $0.20 | $0.10 | $0.01 (≤100K) |
| Latency (official label) | Slower | Moderate | Fast | Fastest |
| Context / max output | 1M / 128K | 1M / 128K | 1M / 128K | 1M / 128K |
| Default effort (API) | high | medium | high | medium |
| Positioning | "demanding reasoning and long-horizon agentic work" | "long-running agentic coding and knowledge work" | "best combination of speed and intelligence" | "high-volume, latency-sensitive tasks"; "sub-agent tasks" |

Other pricing details:
- Batch is 50% off.
- Knowledge cutoff for all four is June 2026.
- Haiku 5.5 launched 2026-10-07; Sonnet 5.5 on 2026-09-28.
- Older models still offered include Opus 5 and Opus 4.5–4.8 ($5/$25), Sonnet 5 ($2/$10), Sonnet 4.6 ($3/$15) and Haiku 4.5 ($1/$5). Sonnet 4.5 retires 2026-11-30.
- Claude Code on Bedrock, Vertex or Foundry resolves aliases to older models (ORCH-031).

## [ORCH-027] Anthropic's model-choice guidance
- Type: recommendation
- Applies to: Claude API, Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Choosing a model](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model), [Haiku 5.5 launch](https://www.anthropic.com/claude-haiku-5-5), [Sonnet 5.5 launch](https://www.anthropic.com/claude-sonnet-5-5), [Opus 5.5 launch](https://www.anthropic.com/claude-opus-5-5), [Costs](https://code.claude.com/docs/en/costs)
- Related: ORCH-026, ORCH-029, ORCH-030

What Anthropic says about each model:
- "Most workloads start with Claude Opus 5.5." Move to Fable 5.1 for long-horizon work "or when your evals on Claude Opus 5.5 at higher effort still fall short."
- "Tuning effort is often a better lever than switching models."
- Haiku 5.5 "pairs well with Opus 5.5 and Sonnet 5.5 as a subagent on coding work". Sonnet 5.5 and Opus 5.5 "remain better choices for complex agentic coding tasks".
- Opus 5.5 "remains clearly stronger at complex, open-ended work requiring sustained judgment" than Sonnet 5.5. Sonnet 5.5 "complements Opus 5.5 best when running at lower effort settings".

On Anthropic's coding benchmarks:

| | Sonnet 5.5 | Opus 5.5 | Fable 5.1 | Haiku 5.5 |
|---|---|---|---|---|
| Terminal-Bench 4.0 | 70.6% | 66.4% (xhigh) | 55.8% | 39.2% |
| FrontierCode 1.1 | 46.2% | 54.4% | 50.3% | n/a |

Anthropic adds that "benchmark margins have become a less reliable guide to real-world differences", and that the gap between Opus 5.5 and Fable 5.1 "is narrower than these scores suggest". No SWE-bench figures are published for the 5.5 generation.

The Claude Code costs page still says "Sonnet handles most coding tasks well… Reserve Opus for complex architectural decisions", plus `model: haiku` for simple subagents and Sonnet for teammates.

## [ORCH-028] Reasoning effort: levels, defaults, effects
- Type: fact
- Applies to: Claude API, Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Effort](https://platform.claude.com/docs/en/build-with-claude/effort), [Model config](https://code.claude.com/docs/en/model-config), [Thinking](https://platform.claude.com/docs/en/build-with-claude/thinking)
- Related: ORCH-004, ORCH-029, ORCH-033, TOK-055

Levels are `low`, `medium`, `high`, `xhigh` and `max`, all supported on the Claude 5 models. "Effort is a behavioral signal, not a strict token budget." It changes thinking, tool-call count and verbosity; for a hard ceiling, use `max_tokens`.

What each level is for, per the docs:
- `low`: "Simpler tasks that need the best speed and lowest costs, such as subagents". Haiku 5.5 at `low` "is more likely to skip a search, stop early, or skip a check", so start Haiku workers at `medium`.
- `medium`: "Agentic tasks that require a balance of speed, cost, and performance". For Sonnet 5.5 agentic coding, start at `medium` for well-specified tasks and `high` for harder ones.
- `xhigh`: "Long-running agentic and coding tasks (over 30 minutes)".

**Defaults differ by surface.**
- API: Opus 5.5 and Haiku 5.5 default to `medium`; Sonnet 5.5 and Fable 5.1 to `high`.
- Claude Code: "Opus 5.5, Sonnet 5.5, and Haiku 5.5 default to `medium`".
- So the same Sonnet 5.5 subagent may run one level lower in Claude Code than on the API.

Other details:
- Thinking is adaptive on the 5.x models, and `budget_tokens` returns 400.
- Changing top-level effort mid-conversation invalidates the prompt cache. A per-message effort beta avoids that.
- At `max`, Sonnet 5.5 "more often ran Claude Code's code-review skill, which splits the review across many subagents", causing timeouts and out-of-scope edits. So `max` on an orchestrating model can increase fan-out.

## [ORCH-029] Measured economics of orchestrator and advisor setups
- Type: fact
- Applies to: Claude API, general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Optimizing for cost and intelligence](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence), [Research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- Related: ORCH-021, ORCH-027, ORCH-030

Anthropic's internal, directional measurements:
- **Orchestrator over workers, task larger than one context.** A Fable 5.1 lead over 25 Sonnet 5 workers, on a 21.6M-token corpus, cost 47–55% less than Fable alone and scored 10–12 points lower. It still beat Sonnet 5 alone. "On the full, harder BrowseComp set, the economics reversed."
- **Advisor/executor.** Opus 5.5 at `high` with a Fable 5.1 advisor scored 90.1% at $2.92 per attempt. Opus 5.5 alone at `xhigh` scored 91.1% at $4.11. The advisor's +1.7 points over Opus 5.5 at `high` sits "at the edge of run-to-run noise".
- **Cheap executors don't ask for help.** "Claude Haiku 5.5 and Claude Sonnet 5.5 called the Opus 5.5 advisor on none of the 198 questions" (GPQA Diamond, without a prompt telling them to consult). An escalation path has to be enforced, not left to the worker.
- **The 2025 research system.** An Opus 4 lead with Sonnet 4 subagents beat single-agent Opus 4 by 90.2% on breadth-first research.

The process Anthropic recommends:
1. "Sweep effort on your current model first. It is the cheapest experiment on this page, and most workloads end there."
2. Then price the stronger model alone at low effort.
3. Build an orchestrator only when the work fans out over independent pieces.

## [ORCH-030] Model tier per agent role
- Type: recommendation
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: [Costs](https://code.claude.com/docs/en/costs), [Choosing a model](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model), [Haiku 5.5 launch](https://www.anthropic.com/claude-haiku-5-5), [Code-review plugin](https://github.com/anthropics/claude-code/blob/main/plugins/code-review/commands/code-review.md), [Superpowers SDD](https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md)
- Related: ORCH-027, ORCH-028, ORCH-033, ORCH-042

| Role | Tier | Effort | Why |
|---|---|---|---|
| Orchestrator, planner, integrator | Session model (Opus 5.5) | session default, or `high` for planning | Holds decisions and reads every diff, so mistakes compound |
| Codebase search, scouting, gates, CLAUDE.md lookup | Haiku 5.5 | `medium` | Read-only and summarizable; the code-review plugin uses Haiku here; `low` skips checks |
| Summarizer, compaction, log digest | Haiku 5.5 | `low`–`medium` | Positioned for summarization |
| Mechanical implementer (exact files and edits known) | Sonnet 5.5 | `medium` | Top Terminal-Bench score at 1/2 Opus price |
| Test writer for existing code | Sonnet 5.5 | `medium` | Well-specified; the oracle is the code |
| Implementer needing design judgment or a shared contract | Opus 5.5 | `high` | "sustained judgment" |
| Reviewer (bugs, design) | Opus 5.5 | `high` | The code-review plugin uses Opus for bugs; superpowers sets a mid-tier floor |
| Reviewer (convention compliance), finding validator | Sonnet 5.5 | `medium` | The plugin uses Sonnet for CLAUDE.md compliance |
| Hard problem Opus 5.5 at `xhigh` already failed | Fable 5.1 | `high` | Slower, 2.5× Opus price, capped on Max plans |

Set the model on every spawn, unless a repo agent pins its own (ORCH-003). Escalate effort before tier (ORCH-029).

## [ORCH-031] Main-session model config, aliases and plan limits
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Model config](https://code.claude.com/docs/en/model-config), [Fable on your plan](https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan), [Pro/Max usage](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- Related: ORCH-003, ORCH-026

**Aliases:**
- `default` clears any override.
- `best` gives Fable where available, otherwise Opus.
- `fable`, `opus`, `sonnet` and `haiku` resolve to Fable 5.1, Opus 5.5, Sonnet 5.5 and Haiku 5.5 on the Anthropic API.
- `opusplan` uses Opus in plan mode and Sonnet for execution.
- `sonnet[1m]` and `opus[1m]` change nothing on native-1M models.

**Main-model precedence**, first wins: `/model`, then `--model`, then `ANTHROPIC_MODEL`, then the `model` setting, then `ANTHROPIC_DEFAULT_MODEL`. `ANTHROPIC_DEFAULT_{FABLE,OPUS,SONNET,HAIKU}_MODEL` remap the aliases. Managed `availableModels` restricts choices, but Haiku can't be disabled.

**Plan defaults:** Pro, Max, Team, Enterprise and API all default to Opus 5.5. Fable is never the default.

**Plan limits:**
- Usage limits "are shared across Claude and Claude Code", so every parallel agent draws from one pool.
- On Max and premium seats, Fable is capped at "up to 50% of your weekly usage limits" and uses limits "faster than other Claude models". On Pro and standard seats, Fable is available only through usage credits.

## [ORCH-032] Fast mode
- Type: fact
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Fast mode](https://code.claude.com/docs/en/fast-mode), [Pricing – fast mode](https://platform.claude.com/docs/en/about-claude/pricing#fast-mode-pricing)
- Related: ORCH-026

`/fast` runs the same Opus model in a speed-priority configuration, up to 2.5× faster output. It is not a smaller model.

**Availability:** Opus 5.5, Opus 5 and Opus 4.8 only; not Sonnet or Haiku. Priced at $8/$40 per MTok on Opus 5.5.

**Billing:** on subscription plans it is billed through usage credits, outside plan limits. It has its own rate-limit pool and falls back to standard speed when limited. Enable it at session start, because the first enable re-bills the whole context at the uncached fast price.

**Use it** for the interactive orchestrator you are watching. Don't use it for long autonomous runs, batch work, CI or worker subagents. A teammate's fast mode is fixed at spawn.

## [ORCH-033] The cheapest model is not always the cheapest run
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-12
- Sources: [Superpowers SDD – model selection](https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md), [Effort](https://platform.claude.com/docs/en/build-with-claude/effort), [Optimizing for cost and intelligence](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence)
- Related: ORCH-028, ORCH-030

The anti-pattern is pushing every worker to Haiku, or to `low` effort, to save money. Superpowers: "Turn count beats token price… the cheapest models routinely take 2-3× the turns on multi-step work". Superpowers also uses "a mid-tier model as the floor for reviewers and for implementers working from prose descriptions". Anthropic's effort docs note that Haiku 5.5 at `low` skips searches and checks. Cheap workers also don't escalate on their own (ORCH-029).

Haiku 5.5 is cheap: $0.10/$0.50, which is 1/20 of Sonnet 5.5's input price. But it scores 39.2% on Terminal-Bench 4.0 against Sonnet 5.5's 70.6%. A failed or partial unit then costs a review cycle plus a retry on the orchestrator's tier.

Use Haiku for read-only, summarizable work (search, gates, digests), where a miss is cheap and visible. Use Sonnet as the floor for anything that writes code or judges correctness. When in doubt, go one tier up, or one effort level up.

## [ORCH-034] Return summaries and references, not raw output
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Effective context engineering (2025-09-29)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), [Research system](https://www.anthropic.com/engineering/multi-agent-research-system), [Best practices](https://code.claude.com/docs/en/best-practices), [Workflows](https://code.claude.com/docs/en/workflows)
- Related: ORCH-007, ORCH-035, ORCH-036, TOK-035

Context is "the most important resource to manage", and "performance degrades as it fills". Ways to keep the orchestrator's context lean:
- **Summaries.** A subagent may use "tens of thousands of tokens or more, but returns only a condensed, distilled summary of its work (often 1,000-2,000 tokens)."
- **References, not content.** Write bulky output (reports, logs, data, the diff itself) to the filesystem and "pass lightweight references back to the coordinator". This avoids the "game of telephone" and saves tokens.
- **Delegation of verbose operations.** Hand test runs, log reading and doc fetching to subagents so only the summary returns (costs page).
- **Script variables.** For dozens of agents, use a workflow: intermediate results stay in script variables and only the final answer reaches context.
- **Bounded reports.** Cap the report's length in the brief and say what to leave out; "the diff is the detail".
- **Compaction instructions.** For example: "always preserve the full list of modified files and any test commands".

## [ORCH-035] Structured subagent reports and status codes
- Type: pattern
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: [Superpowers SDD](https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md), [Workflows – schema](https://code.claude.com/docs/en/workflows), [CLI reference – json-schema](https://code.claude.com/docs/en/cli-reference)
- Related: ORCH-034, ORCH-037

Have each subagent open its report with a status code the orchestrator can route on:

| Status | Orchestrator action |
|---|---|
| `DONE` | Review the diff |
| `DONE_WITH_CONCERNS` | Settle the concerns first |
| `NEEDS_CONTEXT` | Send the context to the same agent with `SendMessage` |
| `BLOCKED` | Find the cause and change something: add context, raise effort or tier, split the unit, or fix the plan. "Never retry BLOCKED unchanged." |

Superpowers uses the four statuses above. Our skill adds `HANDOFF` for budget exhaustion.

**The rest of the report** should be short and fixed:
- branch and files changed;
- verify commands and their results;
- entries needed in shared files;
- decisions another unit might also face;
- concerns.

**Machine-checked shape:** where the mechanism supports it, enforce the shape with a JSON schema: workflow `agent({schema})`, `claude -p --json-schema`, or SDK structured output.

**A report is a claim.** The orchestrator still reads the diff and runs the check.

## [ORCH-036] Progress and handoff files for long runs
- Type: pattern
- Applies to: Claude Code, general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Effective harnesses for long-running agents (2025-11-26)](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps), [Research system](https://www.anthropic.com/engineering/multi-agent-research-system), [Magentic-One](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/magentic-one.html)
- Related: ORCH-034, ORCH-041

Long runs outlive one context window, so state must live on disk.
- **Anthropic's harness:** an initializer agent writes `claude-progress.txt`, an `init.sh` and a `feature_list.json`. JSON is used because "the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files". Each coding session starts by reading git log and the progress file, works one feature, and commits.
- **The research system:** the lead saves its plan to memory, because context past 200k tokens gets truncated. It hands off to fresh subagents with clean contexts.
- **Magentic-One:** separates a task ledger (plan, facts, guesses) from a per-step progress ledger, and replans when progress stalls.

Compaction and resets:
- A compacted summary loses decisions and dead ends that a handoff file keeps.
- A *context reset* (fresh agent plus structured handoff) differs from compaction. Anthropic found older models needed resets, while Opus 4.5+ coped with compaction.
- Re-read the progress file after every compaction.

## [ORCH-037] Failure modes and their guardrails
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Research system](https://www.anthropic.com/engineering/multi-agent-research-system), [Agent teams](https://code.claude.com/docs/en/agent-teams), [C compiler](https://www.anthropic.com/engineering/building-c-compiler), [Harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps), [Coordination patterns (2026-04-10)](https://claude.com/blog/multi-agent-coordination-patterns)
- Related: ORCH-024, ORCH-038, ORCH-039

| Failure | Seen in | Guardrail |
|---|---|---|
| Too many agents ("50 subagents for simple queries") | Research system | Scaling rules in the prompt; depth and concurrency caps (ORCH-025, ORCH-006) |
| Duplicated work | Vague briefs in the research system; shared-state pattern | Explicit boundaries per brief; a task lock or claim file (`current_tasks/`) |
| Drift from the task, endless searching | Research system | Objective and stop condition in the brief; `maxTurns`; a budget |
| Conflicting edits and overwrites | Agent teams; C compiler | A worktree per writer; one owner per file; an oracle |
| Inconsistent decisions between units | Cognition's Flappy Bird example | Decide once and paste into every brief (ORCH-024) |
| Premature "done" and self-praise | Harness posts: "agents reliably skew positive when grading their own work" | Done-when checks; a separate verifier; a `SubagentStop` or `TaskCompleted` gate |
| Rubber-stamp verifier | Coordination patterns post | Give the verifier explicit criteria and a max-iteration limit with a fallback |
| Lead implements instead of delegating; teammates stop on error | Agent teams | Tell the lead to wait; monitor; don't leave teams unattended |
| Runaway cost | Workflows; agent teams | Caps per mechanism (ORCH-038) |
| Errors compounding over long runs | Building effective agents | Checkpoints, commits, retry logic, CI on every merge |

## [ORCH-038] Cost caps per mechanism
- Type: recommendation
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [CLI reference](https://code.claude.com/docs/en/cli-reference), [SDK cost tracking](https://code.claude.com/docs/en/agent-sdk/cost-tracking), [Workflows](https://code.claude.com/docs/en/workflows), [Costs](https://code.claude.com/docs/en/costs), [GitHub Actions](https://code.claude.com/docs/en/github-actions)
- Related: ORCH-014, ORCH-015, ORCH-020

| Mechanism | Hard cap | Soft levers |
|---|---|---|
| Interactive subagents | `maxTurns` in frontmatter; concurrency and depth env vars | `model`/`effort` per spawn; `/tasks` shows each agent's model and effort |
| `claude -p` | `--max-budget-usd`, `--max-turns` | `--model`, `--effort`, `--bare` |
| Agent SDK | `maxBudgetUsd`, `maxTurns` | `modelUsage` for the whole tree |
| Dynamic workflows | 1,000 agents per run; `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` | Small slice first; `small` size guideline; per-stage models; `/workflows` to stop |
| Agent teams | None documented | Sonnet teammates; 3–5 teammates; shut down idle ones |
| GitHub Actions | `--max-turns`, job `timeout-minutes`, `concurrency` | `--model` in `claude_args` |
| Whole account | Plan usage limits; API spend caps | `CLAUDE_CODE_SUBAGENT_MODEL` (+`_FORCE`) to push all workers to one tier |

Interactive Claude Code has no per-spawn dollar cap. Bound cost there through model, effort, `maxTurns`, unit size and a context budget written into the brief. Cost figures in `-p` and the SDK are client-side estimates; the Console is authoritative.

## [ORCH-039] Verification: generator-verifier and clean-context review
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Best practices](https://code.claude.com/docs/en/best-practices), [Coordination patterns](https://claude.com/blog/multi-agent-coordination-patterns), [Cognition 2026](https://cognition.ai/blog/multi-agents-working), [Code-review plugin](https://github.com/anthropics/claude-code/blob/main/plugins/code-review/commands/code-review.md)
- Related: ORCH-022, ORCH-042, ORCH-046

The most broadly endorsed multi-agent pattern for coding is a separate reviewer. "A fresh context improves code review since Claude won't be biased toward code it just wrote" (best practices). Cognition (2026) found the clean-context reviewer one of the few multi-agent flows that works.

Rules:
- **Give the reviewer criteria, not "is it good?".** "A verifier told only to check whether output is good… will rubber-stamp the generator's output."
- **Bound its findings.** A reviewer asked for gaps will report some. Tell it to flag only correctness or stated-requirement gaps, to avoid over-engineering (best practices).
- **Validate findings before acting.** The official code-review plugin launches a validator subagent for each bug finding and drops unvalidated ones.
- **Cap the fix loop:** superpowers allows 5 rounds and escalates to a stronger model in the last two. Coordination patterns: set a max-iteration limit with a fallback.
- **Make verifiers run things.** "You MUST run the complete test suite before marking as passed."

## [ORCH-040] Prompt caching in fan-outs
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Prompt caching](https://code.claude.com/docs/en/prompt-caching), [Workflows – caching](https://code.claude.com/docs/en/workflows), [Settings reference](https://code.claude.com/docs/en/settings-reference)
- Related: ORCH-011, ORCH-020, TOK-052

**Cache lifetimes:**
- On a subscription within plan usage, the main conversation's cache lasts 1 hour.
- Subagents, workflow agents, forks and in-process teammates get **5 minutes** by default, "including on a Claude subscription".
- `subagentPromptCacheTtl: "1h"` (or `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL`) extends it, at the higher 1-hour write price.

**Consequences for orchestration:**
- Resuming a subagent more than 5 minutes after its last turn re-reads its whole context uncached. That happens when you `SendMessage` a fix after a long integration step.
- Workflow agents share a cache prefix when model, effort, agent type, tools, schema and cwd match. Claude Code staggers matching agents by up to 5 s (`CLAUDE_CODE_WORKFLOW_PREFIX_STAGGER_MS`) so the rest read the first one's cache.
- Keep worker briefs' shared preamble identical and first, and per-unit details last.
- In Claude Code, changing effort mid-session keeps the cache on Opus 5.5, Sonnet 5.5, Haiku 5.5 and Fable 5.1 with an API key or Claude subscription. On other models, and on Bedrock, Google Cloud's Agent Platform or a Claude apps gateway, it still invalidates the cache.

## [ORCH-041] Superpowers subagent-driven development
- Type: pattern
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: [obra/superpowers (297,942 stars on 2026-10-12)](https://github.com/obra/superpowers), [SDD skill](https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md), [Parallel agents skill](https://github.com/obra/superpowers/blob/main/skills/dispatching-parallel-agents/SKILL.md)
- Related: ORCH-035, ORCH-039, ORCH-033

Superpowers is the most widely used Claude Code methodology. Its flow is brainstorm, design, plan, then execute.

**Subagent-driven development:**
- The controller never writes code. It keeps a ledger, which lets work resume after compaction.
- Each task goes to a fresh implementer, **one at a time**, in a git worktree.
- Implementers write their full report to a file and return status, commits, a one-line test summary and concerns.
- Each task is reviewed for both spec compliance and quality, and the whole branch gets one final review. Older versions ran two sequential review stages; the current file does not.
- The fix loop is capped at 5 rounds. Rounds 4–5 use a fresh implementer on a more capable model, and the controller adjudicates at the cap.
- On models: "Always specify the model explicitly"; "Turn count beats token price"; a mid-tier floor for reviewers.

**Parallel dispatch** (separate skill) means one agent per independent problem domain. It is not for shared root causes, whole-system understanding or shared files.

**What transfers:** the status protocol, file-based reports, explicit models and the capped escalating fix loop. Our skill already has most of these (see Recommendations).

## [ORCH-042] Official code-review plugin as a tiering reference
- Type: pattern
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-12
- Sources: [anthropics/claude-code – code-review command](https://github.com/anthropics/claude-code/blob/main/plugins/code-review/commands/code-review.md), [feature-dev README](https://github.com/anthropics/claude-code/blob/main/plugins/feature-dev/README.md)
- Related: ORCH-030, ORCH-039

Anthropic's own `code-review` plugin is the clearest official example of matching model tier to role. Its pipeline:
1. A **Haiku** agent gates the PR: skip it if closed, draft, trivial or already reviewed.
2. A **Haiku** agent lists the relevant CLAUDE.md paths.
3. A **Sonnet** agent summarizes the PR.
4. Four reviewers run in parallel: 2 **Sonnet** agents check CLAUDE.md compliance and 2 **Opus** agents look for bugs.
5. Parallel validator subagents re-check each issue from the bug reviewers: Opus subagents validate bug and logic issues, Sonnet subagents validate CLAUDE.md violations.
6. Unvalidated issues are dropped. Nothing is posted without `--comment`.

The pattern: cheap models for gates and lookups, mid-tier for rule checking, top tier for bug finding, and a validation pass to cut false positives. The `feature-dev` plugin runs 2–3 parallel explorer agents, 2–3 architect agents with different biases and 3 parallel reviewers, but implementation stays in the main session. That is single writer, parallel readers again (ORCH-023).

## [ORCH-043] Worktree session managers
- Type: tool
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: [claude-squad](https://github.com/smtg-ai/claude-squad), [vibe-kanban](https://github.com/BloopAI/vibe-kanban), [ccmanager](https://github.com/kbwo/ccmanager), [Conductor docs](https://www.conductor.build/docs/), [Crystal](https://github.com/stravu/crystal)
- Related: ORCH-009, ORCH-013

These tools run several Claude Code (or Codex, Gemini, Aider) sessions side by side, each in its own worktree or branch. Integration is a human reviewing each diff. They don't coordinate agents.

| Tool | Notes |
|---|---|
| claude-squad (~8.6k stars) | tmux plus a worktree per task |
| vibe-kanban (~28k stars) | A kanban card per task, inline diff comments; the README says it is sunsetting |
| ccmanager (~1.3k stars) | Copies gitignored files via `.worktreeinclude`; busy/waiting/idle status |
| Conductor | A workspace per task across several agent CLIs |
| Crystal | Deprecated since Feb 2026 |

Native agent view (`claude agents`) plus automatic worktrees per background session now covers the core of this, so prefer it unless you need multi-vendor agents. Ideas worth keeping: copy env files into worktrees (`.worktreeinclude`), and a per-session needs-input signal (the `Notification` hook). Star counts were read from page summaries on 2026-10-12.

## [ORCH-044] Ideas from other tools and frameworks
- Type: comparison
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-12
- Sources: [Aider architect/editor (2024)](https://aider.chat/2024/09/26/architect.html), [Amp models and subagents](https://ampcode.com/docs/models-and-subagents), [OpenAI Agents SDK multi-agent](https://openai.github.io/openai-agents-python/multi_agent/), [Magentic-One](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/magentic-one.html), [langgraph-supervisor](https://github.com/langchain-ai/langgraph-supervisor-py), [Gemini CLI subagents](https://geminicli.com/docs/core/subagents/), [spec-kit](https://github.com/github/spec-kit)
- Related: ORCH-029, ORCH-036

| Source | Idea | Transfer to Claude Code |
|---|---|---|
| Aider architect/editor | A strong model plans the change and a second model writes the edits. Even same-model pairs gained about 3–4 points (Claude 3.5 Sonnet: 77.4% → 80.5%) | `opusplan`, or an Opus plan handed to a Sonnet implementer. The numbers are from 2024 |
| Amp | An "oracle" subagent: a stronger model consulted only for hard planning and debugging | Possible as a pinned Opus/Fable agent, but cheap workers won't call it unprompted (ORCH-029), so make consultation a rule |
| OpenAI Agents SDK | Agents-as-tools (the manager keeps control) vs handoffs (the specialist takes over) | Claude Code subagents are agents-as-tools |
| Magentic-One | Task ledger plus progress ledger; replan on stall | Progress file plus a per-wave status (ORCH-036) |
| LangGraph supervisor | `full_history` vs `last_message` output modes; the library is archived in favor of hand-built tool-based supervisors | Last-message-only is Claude Code's default |
| Gemini CLI | Markdown subagents with a `model` field; no nesting | Same shape as Claude Code |
| spec-kit (~141k stars) | constitution, specify, plan, tasks, implement; "converge" until clean | Separate durable principles from per-feature specs |

Cursor's parallel agents (worktree per agent, compare results) are documented only by third parties, so unverified here.

## [ORCH-045] Cognition vs Anthropic on multi-agent
- Type: comparison
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: [Cognition – Don't Build Multi-Agents (2025-06-12)](https://cognition.ai/blog/dont-build-multi-agents), [Cognition – Multi-Agents: What's Actually Working (2026-04-22)](https://cognition.ai/blog/multi-agents-working), [Anthropic research system](https://www.anthropic.com/engineering/multi-agent-research-system), [Coordination patterns](https://claude.com/blog/multi-agent-coordination-patterns)
- Related: ORCH-023, ORCH-039

**Cognition 2025:**
- "Share context, and share full agent traces, not just individual messages."
- "Actions carry implicit decisions, and conflicting decisions carry bad results."
- Default to a single-threaded agent.

**Cognition 2026:**
- The 2025 observations "still hold today for parallel-writer swarms".
- What works: a clean-context reviewer, a "smart friend" consult to a stronger model, and a manager spawning child agents on scoped tasks. "The quality ceiling was set by the primary."

**Anthropic:**
- Multi-agent wins on breadth-first research.
- Coding has "fewer truly parallelizable tasks".
- Start with orchestrator-subagent and the simplest pattern that works.

**Where they agree:** parallel reading and reviewing is safe, and parallel writing is risky. Anthropic's C compiler shows parallel writes can work with isolation and an oracle. Trust both: use Cognition's single-writer rule as the default, and Anthropic's conditions (ORCH-023) as the exception.

## [ORCH-046] Best-of-N needs a good verifier
- Type: fact
- Applies to: general
- Confidence: unverified
- Last verified: 2026-10-12
- Sources: [Agentic Rubrics, arXiv 2601.04171](https://arxiv.org/abs/2601.04171), [SWE-Gym, arXiv 2412.21139](https://arxiv.org/abs/2412.21139)
- Related: ORCH-039

Generating N candidate patches and picking one (best-of-N, voting) adds value only as far as the selector is good. From search summaries, not checked against the papers:
- SWE-Gym: pass@16 was 42.8%, but verifier-picked best@16 was only 32.0%.
- Agentic Rubrics (Qwen3-32B, 16 rollouts): random pick 22.6%, best rubric verifier 40.6%, oracle 51.4%.

So spending N× tokens on parallel attempts pays only when you have an executable oracle (tests) or a strong verifier. Without one, prefer one attempt at higher effort (ORCH-029).

## [ORCH-047] Decision table: task → pattern → tier
- Type: recommendation
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: synthesis of ORCH-001 to ORCH-046
- Related: ORCH-001, ORCH-021, ORCH-030

| Task type | Orchestration pattern | Model tier (effort) | Why |
|---|---|---|---|
| Quick targeted fix; one-sentence diff | Main session only | Session (Opus 5.5) | A subagent costs more than the work (ORCH-021) |
| Find where X lives / sweep a large codebase | 1–3 parallel search subagents, read-only | Haiku 5.5 (medium), set explicitly | Summarizable; Explore defaults to the session model (ORCH-005) |
| Investigate a bug with several plausible causes | Parallel hypothesis subagents, read-only; fix in main | Sonnet 5.5 (high) investigators; Opus fixes | Avoids anchoring; single writer (ORCH-023) |
| Multi-source research or docs comparison | Orchestrator + 2–5 parallel researchers returning cited summaries | Sonnet 5.5 researchers; Opus synthesis | Anthropic's research pattern (ORCH-020) |
| Feature touching 3+ independent modules with settled interfaces | Waves of worktree subagents, one owner per file; orchestrator integrates | Sonnet (mechanical) or Opus (judgment); Opus integrates | Isolation plus decide-once (ORCH-024) |
| Feature whose design is still open | Single session, plan mode, then maybe split | Opus 5.5 (high) | Units with open decisions conflict (ORCH-024) |
| Same mechanical change across many files | `/batch`, `claude -p` fan-out, or a workflow | Sonnet 5.5 (medium), or Haiku after testing 2–3 files | Repetitive, an oracle exists (ORCH-012, ORCH-014) |
| Codebase-wide audit or 500-file migration | Dynamic workflow with schema-validated results and a cross-check stage | Per stage: Haiku/Sonnet workers, Opus checkers | Results stay out of context (ORCH-011) |
| Code review of a branch or PR | Parallel single-lens reviewers in fresh contexts, plus a validator per finding | Opus (bugs), Sonnet (conventions), Haiku (gates) | Official plugin pattern (ORCH-042) |
| Writing tests for existing code | One subagent per module, worktree | Sonnet 5.5 (medium) | Well-specified; tests are their own oracle |
| Summarize logs, a CI failure or a long doc | One subagent | Haiku 5.5 | Keeps the orchestrator lean (ORCH-034) |
| Several unrelated tickets | Agent view background sessions or cloud sessions | Session default per ticket | Human-orchestrated; no shared context (ORCH-013) |
| Workers must debate or share findings live | Agent team (experimental), 3–5 teammates | Sonnet teammates | About 7× tokens; only when communication is the point (ORCH-010) |
| Unsolved hard algorithm after Opus xhigh fails | Single dedicated subagent | Fable 5.1 (high) | Capped and slow; justify by prior failure (ORCH-030) |
| Recurring maintenance or triage | Routine (cloud) or desktop task | Sonnet/Haiku | No machine needed; min 1 h (ORCH-017) |

---

## Recommendations for our setup

Ranked by impact against effort. The first group reviews `parallel-code-orchestrator` (a user-level skill; since 2026-10-12 its source is `skills/parallel-code-orchestrator/SKILL.md` in FreekMencke/claude-skills, see SKILL-050) against the findings above.

### Improvements to `parallel-code-orchestrator`

Done through roadmap [FreekMencke/claude-skills#1](https://github.com/FreekMencke/claude-skills/issues/1), opened and closed 2026-10-12: recommendations 1–12 are FreekMencke/claude-skills#4.

1. **Fix the scouting row: "Haiku" doesn't happen by default.** *(High impact, trivial effort.)* Step 3 says "Use Haiku subagents to search", but the built-in Explore agent runs on the session model (Opus) unless `model: haiku` is passed or an `Explore` override exists. Change the row to: "Scouting: `model: haiku` on every Explore or general-purpose call, effort `medium` (Haiku at `low` skips checks)." Evidence: ORCH-005, ORCH-028.
2. **Add an effort column and set effort on every spawn.** *(High impact, low effort.)* The skill sets model but never effort. In Claude Code, Opus 5.5 and Sonnet 5.5 default to `medium`, so design and contract units and the integrating reviewer run at `medium` unless told otherwise. Suggested values:
   - scouting: Haiku `medium`
   - mechanical units: Sonnet `medium`
   - design or contract units and reviewers: `high`
   - Fable: `high`

   Note the per-call `effort` needs v2.1.292+, and `CLAUDE_CODE_EFFORT_LEVEL` overrides everything. Evidence: ORCH-004, ORCH-028.
3. **Escalate effort before tier.** *(Medium impact, trivial effort.)* In step 7 (BLOCKED, and "after two failed rounds"), make the ladder: same model at higher effort, then one tier up, then Fable only for its row. Anthropic: "Sweep effort on your current model first… most workloads end there." Evidence: ORCH-029.
4. **Pass `isolation: "worktree"` on the Agent call itself, not only in frontmatter.** *(High impact if agent teams are ever enabled, trivial effort.)* With `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, any named spawn becomes a teammate in the main checkout unless `isolation` is on the call. Frontmatter isolation doesn't prevent this. Add one line to step 6. Evidence: ORCH-010.
5. **Tell units not to fan out.** *(Medium impact, trivial effort.)* Subagents can nest 3 levels by default, and Opus 5-class models "delegate more readily", so a unit can silently spawn its own subagents on the session model. Add to the brief's `## Limits`: "Don't spawn subagents except read-only searches with `model: haiku`." Optionally set `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=2` for orchestration runs. Evidence: ORCH-006.
6. **Name the large-fan-out alternative.** *(Medium impact, low effort.)* The skill caps waves at 3–6 units. For the "same change across 30+ files" or "audit everything" shape, say to use `/batch` or a dynamic workflow ("use a workflow"). These keep results in script variables and can enforce a JSON report `schema`. Evidence: ORCH-011, ORCH-012.
7. **Add "keep a feature and its tests in one unit" to step 4.** *(Medium impact, trivial effort.)* Anthropic found role-split agents "spent more tokens on coordination than on actual work". The skill's Sonnet row "tests for existing code" is fine. Splitting tests for *new* code into another unit is not. Evidence: ORCH-022.
8. **Validate review findings before fixing.** *(Medium impact, low effort.)* Step 8 fixes every **breaks** and **violates** finding. Add the code-review plugin's move: for each finding, check it against the code (or spawn a cheap Sonnet validator) before changing code. Also tell reviewers to flag only correctness or requirement gaps. Evidence: ORCH-039, ORCH-042.
9. **Account for the 5-minute subagent cache.** *(Low–medium impact, trivial effort.)* The step 7 resume budget ("about 50k of room") ignores that a resume after more than 5 minutes re-reads the whole subagent context uncached. Either set `subagentPromptCacheTtl: "1h"` for orchestration runs, or prefer a fresh subagent from a handoff file when the old one has been idle for more than 5 minutes and is large. Evidence: ORCH-040.
10. **Fable row: add the facts behind "the exception".** *(Low impact, trivial effort.)* Add to the row:
    - Opus 5.5 matches or beats Fable 5.1 on Anthropic's listed coding benchmarks.
    - Fable is "Slower" and 2.5× Opus's price.
    - On Max it is capped at 50% of weekly limits.
    - With a Fable session, Explore runs on Opus.

    This makes the existing rule self-justifying for future editors. Evidence: ORCH-026, ORCH-027, ORCH-031.
11. **Note a worktree CLAUDE.md caveat in step 5's Rules.** *(Low impact, trivial effort.)* A subagent in a default-location worktree loads CLAUDE.md and `.claude/rules/` from the main checkout, not its branch. If wave 1 changed CLAUDE.md, the brief must say so. Evidence: ORCH-009.
12. **Optional: gate DONE with a `SubagentStop` hook.** *(Medium impact, medium effort.)* For repos with a fast verify command, a project hook matched to implementer agent types can block stopping until the check passes. That turns "a report is a claim" into enforcement. Evidence: ORCH-019.

What the skill already does well, confirmed by the research: the threshold for when to orchestrate, one owner per file, shared files kept by the orchestrator, decide-once in briefs, done-when as a command, explicit models on every spawn, status codes, file-based handoffs, a capped fix loop with escalation, reviewer-agent pins, and a fresh-context issue check. These match ORCH-024, ORCH-035, ORCH-036, ORCH-039 and ORCH-041.

### Other setup changes

13. **Done 2026-10-12. Add a user-level `Explore` override on Haiku.** *(High impact, trivial effort.)* Create `~/.claude/agents/explore.md` with `name: Explore`, read-only tools, `model: haiku` and `effort: medium`, so every exploration, in every repo, stops running on Opus. Check the result after a week: if searches start missing things, drop the override. Evidence: ORCH-005, ORCH-033.
14. **Done 2026-10-12. Set `--max-budget-usd` and `--max-turns` on every scripted `claude -p` and GitHub Action.** *(Medium impact, trivial effort.)* None exist in our repos as of 2026-10-12, so the rule is in the global `~/.claude/CLAUDE.md` ("Scripted Claude runs") for when the first one is added ([FreekMencke/claude-kb#7](https://github.com/FreekMencke/claude-kb/issues/7)). Both flags work together in v2.1.296; `--max-turns` is missing from `claude --help` but accepted. Evidence: ORCH-014, ORCH-038.
15. **Don't enable agent teams globally.** *(Risk avoidance.)* Enabling them changes what named subagent spawns do. Turn them on per session, only for research and review work. Evidence: ORCH-010.

## Open questions

- **Per-call `isolation` for non-fork subagents.** The Agent tool schema has it and the agent-teams docs imply it, but the docs explicitly document it only for forks. It is unclear whether it is supported, or ignored, for named non-fork subagents.
- **Sonnet 5.5's default effort** is `high` on the API and `medium` in Claude Code. It's not known whether this is intentional or one of the pages is stale.
- **A general cost multiplier for agent teams.** The 7× figure applies only "when teammates run in plan mode".
- **Benchmarks for the 5.5 generation.** No SWE-bench figures are published. The tier comparisons rest on Terminal-Bench, FrontierCode and CursorBench, which Anthropic itself calls "a less reliable guide".
- **Haiku 5.5 as a code-writing worker.** It is days old (launched 2026-10-07), and Anthropic pitches it as a coding subagent. There is no independent evidence yet on its retry rate versus Sonnet 5.5 for mechanical edits, so ORCH-033's "Sonnet floor for writers" may be too conservative.
- **Fable and the weekly cap.** Not tested: whether Claude Code's `fable` alias draws from the Max 50% Fable cap exactly as the support article describes.
- **Managed Agents billing.** Not known: whether multi-agent runtime is billed per session or per child thread.
- **Session limits.** Agent view and cloud sessions document no cap on simultaneous sessions beyond the shared usage limit.
- **Unverified community claims:** Cursor's parallel-agent details, best-of-N paper numbers (ORCH-046), and the performance claims of claude-flow/ruflo.
- **Truncated pages.** The sub-agents, hooks and model-config pages were longer than one fetch. A few details (hook input fields for team events) were not read in full.
