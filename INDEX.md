# Claude efficiency knowledge base: index

Start here. Find your question in Quick answers, or an entry by ID, title or tag in the index below, then read only that entry: `grep -n '^## \[TOK-036\]' kb-*.md` gives the file and line. Every entry carries its sources, a Confidence value and a Last verified date; treat an entry last verified more than 60 days ago as a lead to re-check, not a fact. The prefix tells you the file:

| File | Prefix | Topic | Entries |
|---|---|---|---|
| `kb-orchestration.md` | ORCH | Orchestration, parallelization and model selection | 47 (0 merged into other entries) |
| `kb-token-usage.md` | TOK | Token usage and context efficiency | 62 (4 merged into other entries) |
| `kb-skills.md` | SKILL | Writing, testing and distributing skills | 59 (1 merged into other entries) |
| `kb-repo-agents.md` | REPO | Agents in repositories (osrs-tracker-web) | 52 (0 merged into other entries) |
| `kb-sessions.md` | SESS | Several sessions in one repo | 35 (0 merged into other entries) |
| `kb-hooks.md` | HOOK | Hooks: events, handler types, cost, debugging, security, patterns | 36 (0 merged into other entries) |
| `kb-infra-agents.md` | INFRA | Agents with cloud and cluster access | 24 (0 merged into other entries) |
| `kb-prompting.md` | PROMPT | Instructing the 5.x models: prompts, CLAUDE.md wording, subagent briefs | 38 (0 merged into other entries) |

Each topic file also ends with "Recommendations for our setup" (what we should adopt, ranked) and "Open questions". Recommendations are kept apart from the facts because they go stale faster.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which model should a codebase-search or Explore subagent use? | Haiku 5.5 at `medium`, set explicitly. Built-in Explore runs on the main session's model (Opus, if that's what you run), not Haiku, and `CLAUDE_CODE_SUBAGENT_MODEL` doesn't reach it. Override it with a user agent named `Explore`, or pass `model: haiku` per call. | ORCH-005, ORCH-030 |
| Which model should a reviewer use? | Opus 5.5 at `high` for bug, design and security review, in a fresh context. Sonnet 5.5 at `medium` for convention compliance. Never Haiku. Pin it in the agent's frontmatter and don't pass `model` on the spawn. | ORCH-030, ORCH-042, REPO-022 |
| Which model should an implementer use? | Sonnet 5.5 for well-specified units. Opus 5.5 when the unit needs design judgment or defines a shared contract. Haiku saves less than it seems, because extra turns eat the price gap. | ORCH-030, ORCH-033 |
| How is a subagent's model resolved? | The per-call `model` parameter, then frontmatter `model`, then `CLAUDE_CODE_SUBAGENT_MODEL`, then the main model. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` overrides all of them. | ORCH-003 |
| Effort or model: which should I change first? | Effort; Anthropic calls it the cheapest experiment. The 5.5 models default to `medium` in Claude Code. Raise effort before raising the tier. | ORCH-028, ORCH-029, TOK-055 |
| How much does multi-agent cost? | About 3–10× the tokens of a single agent for a coding fan-out. Agent teams use about 7× in plan mode. Ten parallel sessions burn quota about 10× as fast. | ORCH-020 |
| When does parallelizing pay off? | For independent, read-heavy work (research, review, search, competing hypotheses) or disjoint files with a test oracle. Not for sequential chains, shared files or open design. Keep a single writer. | ORCH-021, ORCH-022, ORCH-023 |
| Subagents, agent view, agent teams or workflows? | Subagents for side tasks that return a summary. Agent view for independent tasks you hand off. Agent teams (experimental) when workers must talk to each other. Dynamic workflows for dozens of agents or cross-checked results. | ORCH-001 |
| How should subagent results come back? | As a short structured report (status, files, verify result, about 1–2k tokens). Bulky output goes to files or the diff, never into the orchestrator's context. | ORCH-034, ORCH-035 |
| What does a subagent start with? | Its own prompt, tools and the brief; the full CLAUDE.md hierarchy and a git status snapshot (Explore and Plan skip both); preloaded skills. No conversation history. Its first turn is about 28k tokens. | ORCH-007, TOK-006, REPO-010 |
| Can subagents spawn subagents? | Yes, up to 3 layers below the main conversation by default (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`), with at most 20 running at once. | ORCH-006 |
| How big is the fixed overhead, and how do I see what fills my context? | About 25–27k tokens of system prompt and tool definitions; 37–42k on our first turn with CLAUDE.md, skills and the prompt. `/context` shows the split, `/usage` the spend. | TOK-002, TOK-001, TOK-010 |
| When should I `/clear` vs `/compact`? | `/clear` between unrelated tasks or after two failed corrections. `/compact <focus>` at a natural break inside one long task. | TOK-030, TOK-031 |
| When does auto-compact fire, and should I lower it? | At about 967K tokens on native-1M models (200K on 4.6 models without `[1m]`). A lower window (`/autocompact`, `autoCompactWindow`) trades lossy summaries for cost: 300K cut input tokens by about 30% in our simulation. | TOK-007, TOK-032, TOK-008 |
| How long does the prompt cache live, and what breaks it? | 1 hour for the main conversation on a subscription; 5 minutes for subagents, forks and teammates, and on an API key. Switching model, fast mode, effort on older models, upgrading Claude Code, and MCP changes with tool search off all break it. | TOK-052, TOK-053, ORCH-040 |
| Do many MCP servers still bloat context? | Much less than before: Claude Code defers MCP tool schemas by default, so only names and server instructions load. CLIs (`gh`, `aws`) are still cheaper. | TOK-020, TOK-022 |
| How long should CLAUDE.md be? | Under 200 lines per file. `@imports` don't reduce cost, and every custom subagent loads it too. Move procedures to skills and path-specific rules to `paths:`-scoped rules. | TOK-003, SKILL-024, REPO-045 |
| Skill, CLAUDE.md, hook, subagent or MCP? | CLAUDE.md for always-true facts; a skill for an on-demand procedure; a hook for a must-happen guarantee; a subagent for an isolated side task; MCP for access to external systems. | SKILL-021, SKILL-023, TOK-065, REPO-044 |
| What goes in a skill description, and how long? | What it does and when to use it, third person, the words users type, and a "not for X" line; never a summary of the workflow's steps. Max 1,024 characters (1,536 in Claude Code's listing); we aim for 150–400, because every character is paid on every turn. | SKILL-003, SKILL-011, SKILL-013, TOK-061 |
| Why doesn't my skill trigger? | A vague description, missing user keywords, a listing-budget overflow that dropped its description, broken YAML, or a task too simple to need a skill. | SKILL-015, TOK-005 |
| How big may SKILL.md be? | Under 500 lines and about 5k tokens, with the important rules first: after compaction only the first 5k tokens are kept. Push detail into one-level-deep reference files and scripts. | SKILL-016, SKILL-017, SKILL-006 |
| How do I test a skill? | Triggering: `claude plugin eval` with a `tool_used: Skill` grader, or skill-creator's `run_loop`; about 20 queries, half near-miss negatives, 3 runs each. Usefulness: the same prompts with and without the skill in fresh sessions, comparing score and token cost. | SKILL-025 to SKILL-028, SKILL-032 |
| How do I make a reviewer agent truly read-only? | An explicit `tools: Read, Grep, Glob, Bash`, a frontmatter `PreToolUse` hook that allows only git and gh reads, and no `memory:`. A `permissionMode` setting and "never edit" in the prompt aren't enough. | REPO-033, REPO-031, REPO-032 |
| How do I make sure a review actually runs? | Name it in a procedure the session follows (a skill or orchestrator), or `@agent-<name>`. Auto-delegation from the description is advisory. Use hooks or CI for hard gates. | REPO-023, REPO-024, REPO-025 |
| How do I share agents and skills across repos or a team? | Committed copies work everywhere, including cloud sessions and the GitHub action. Plugins are versioned, but they drop agent `hooks` and `permissionMode`, cloud sessions don't install them, and a fixed `version` pins users. Keep agent bodies generic and the rules in each repo. | REPO-040, REPO-041, REPO-042, SKILL-034, SKILL-035 |
| What do parallel sessions in worktrees share, and can I `git stash`? | All of `refs/` (including the stash), `.git/config` and hooks, plus Claude Code's project plugins and "don't ask again" approvals. Never use bare `git stash`: another session can pop it. | SESS-001, SESS-002, SESS-004 |
| Why doesn't CI start on my PR when other sessions keep merging? | GitHub runs no `pull_request` workflow on a conflicting PR. Poll `gh pr view <n> --json mergeable,mergeStateStatus`, rebase on `CONFLICTING`, and force-push with `--force-with-lease --force-if-includes`. A merge queue removes the loop, but only in org-owned repos. | SESS-021, SESS-022, SESS-024, SESS-025 |
| Can one session message or hand off to another? | `SendMessage` delivers plain text to your other sessions (v2.1.224+), but it never counts as your consent. For state, resume (`--resume <name>` works across worktrees), teleport from the cloud, or write an issue or progress file. | SESS-017, SESS-018, SESS-029, SESS-031 |
| How do I write a hook that blocks something? | A `PreToolUse` command hook that exits 2 with the reason on stderr, or exits 0 with `permissionDecision: "deny"` JSON. Exit 1 doesn't block, and a crashing or timed-out hook lets the action through unless it sets `onFailure: "block"` (v2.1.295+). | HOOK-004, HOOK-006, HOOK-013 |
| What does a hook cost? | A command hook costs a few ms per call and no tokens unless it returns text. A `prompt` hook is a Haiku call per match; on Stop it re-reads the conversation uncached. Filter with `if` (e.g. `Bash(git *)`) and use `async` for slow checks. | HOOK-015, HOOK-010, HOOK-019 |
| How do I debug a hook that does nothing? | Pipe sample JSON into the script and check the exit code, then run with `claude --debug-file <path>` and grep `Hooks:` lines. Usual causes: exit 1, text before the JSON, a field outside `hookSpecificOutput`, matcher case, one invalid matcher dropping the file. | HOOK-022, HOOK-023, HOOK-024 |
| Is a read-only MCP server enough to keep an agent read-only on AWS or Kubernetes? | No. The flag is client-side, and Bash can run `aws` or `kubectl` with the same profile or kubeconfig. Only the credential's IAM policy or RBAC binds every path; scope the identity the agent can reach. | INFRA-006, INFRA-004, INFRA-005 |
| How should an agent change infrastructure? | It plans or opens a PR; a human or CI applies. Preview first (`terraform plan -out`, `kubectl diff`, `flux diff`). Auto mode blocks an apply with no visible plan, but misses about 17% of overeager actions. | INFRA-013, INFRA-014, INFRA-009 |
| Which guardrail would have prevented published agent incidents? | Scoped or read-only credentials first, then a human-run apply, then deletion protection and backups out of the agent's reach. Prompt instructions failed every time. | INFRA-022, INFRA-023 |
| How literally do the 5.x models follow instructions, and should I write MUST or IMPORTANT? | Literally, most of all at low effort: state the scope and the action. Drop CRITICAL/MUST written for older models (it over-triggers); give the reason instead, and mark at most the one line that keeps being skipped. | PROMPT-003, PROMPT-004, PROMPT-005, SKILL-020 |
| What goes in a subagent or `claude -p` brief? | Objective and why, what you already know or ruled out, exact inputs, boundaries, done-when, return format and length. For unattended runs, say nobody is watching and when to stop. | PROMPT-012, PROMPT-013, PROMPT-014 |
| How do I stop "done" without a check, or unrequested extra work? | Ask for a real check that exercises the change and for claims backed by this session's results; name the extras to leave out and send them to the summary. | PROMPT-027, PROMPT-031 |
| Which old prompt lines hurt the current models? | Forced verification and "double-check" (Opus), progress-every-N-calls, anti-markdown blocks (Fable 5.1), "minimize tool calls", and show-your-reasoning (may be refused). `/doctor prompt-audit` finds them. | PROMPT-030, PROMPT-011, PROMPT-017 |

## Index

Merged entries keep their ID and a pointer, so old references still resolve.

### Orchestration, parallelization and model selection (`kb-orchestration.md`, ORCH)

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

### Token usage and context efficiency (`kb-token-usage.md`, TOK)

| ID | Title | Type | Tags |
|---|---|---|---|
| TOK-001 | What fills the context, by feature | fact | context, claude-code |
| TOK-002 | Fixed overhead per session (measured) | fact | baseline, system-prompt, tools |
| TOK-003 | CLAUDE.md loading rules and size target | fact | claude-md, memory |
| TOK-004 | Auto memory (MEMORY.md) load limits | fact | memory |
| TOK-005 | Skill listing budget | fact | skills, listing |
| TOK-006 | What a subagent's context starts with | fact | subagents |
| TOK-007 | Context window sizes and auto-compact thresholds | fact | 1m, compaction |
| TOK-008 | Cost grows with context length on every turn | fact | long-sessions, cost |
| TOK-009 | A token entering context costs about as much as an output token | fact | economics, cache |
| TOK-010 | `/usage`, `/context` and other built-in meters | tool | measurement |
| TOK-011 | Status line JSON fields for live monitoring | tool | statusline, measurement |
| TOK-012 | OpenTelemetry metrics for teams | tool | otel, measurement |
| TOK-013 | Local transcripts as a usage data source | tool | jsonl, measurement |
| TOK-014 | claude.ai plan limits: 5-hour and weekly windows | fact | plans, limits |
| TOK-015 | What drains plan usage in claude.ai | recommendation | plans, claude.ai |
| TOK-016 | API usage fields and the token counting endpoint | fact | api, measurement |
| TOK-017 | API prices and multipliers | fact | api, pricing |
| TOK-018 | Admin Usage & Cost API and Claude Code Analytics API | tool | api, org |
| TOK-020 | MCP tool search is on by default in Claude Code | fact | mcp, deferred-tools |
| TOK-021 | MCP overhead without deferral | fact | mcp, overhead |
| TOK-022 | Prefer CLIs and scope MCP servers narrowly | recommendation | mcp, scoping |
| TOK-023 | MCP output limits | fact | mcp, output |
| TOK-024 | Code execution and programmatic tool calling (API) | pattern | api, mcp |
| TOK-030 | `/clear` between tasks | recommendation | session-hygiene |
| TOK-031 | `/compact` with focus, and what survives compaction | fact | compaction |
| TOK-032 | Tuning auto-compact | recommendation | compaction, settings |
| TOK-033 | Rewind, partial summarize and `/btw` | tool | session-hygiene |
| TOK-034 | Resuming and idle gaps | fact | cache, resume |
| TOK-035 | Delegate verbose work to subagents | pattern | subagents, context |
| TOK-036 | Subagent model selection | recommendation | subagents, model |
| TOK-037 | Multi-agent and agent teams multiply tokens (merged into ORCH-020) | fact | subagents, teams |
| TOK-038 | API context management: compaction, context editing, memory tool | tool | api, context |
| TOK-040 | Read tool limits and partial reads | fact | files |
| TOK-041 | Search before reading; code intelligence | pattern | files, lsp |
| TOK-042 | Bash output limits and output-filtering hooks | pattern | output, hooks |
| TOK-043 | Pastes, images and PDFs | fact | images, pdf, paste |
| TOK-044 | Blocking reads of large or irrelevant files | fact | permissions |
| TOK-050 | Prompt caching on the API: mechanics | fact | caching, api |
| TOK-051 | Automatic caching and cache diagnostics | tool | caching, api |
| TOK-052 | Prompt caching in Claude Code: TTLs and settings | fact | caching, claude-code |
| TOK-053 | What invalidates the Claude Code cache | fact | caching, claude-code |
| TOK-054 | Message Batches API | fact | batch, api |
| TOK-055 | Effort and thinking as cost levers | fact | effort, thinking |
| TOK-056 | Order of cost levers (official cookbook) | recommendation | api, cost |
| TOK-060 | Skill progressive disclosure (merged into SKILL-004) | fact | skills |
| TOK-061 | Writing skill descriptions | recommendation | skills, descriptions |
| TOK-062 | SKILL.md size and reference files | recommendation | skills |
| TOK-063 | Scripts and dynamic injection instead of prose (merged into SKILL-018, SKILL-008) | pattern | skills, scripts |
| TOK-064 | Frontmatter that cuts skill cost | tool | skills, frontmatter |
| TOK-065 | CLAUDE.md vs rules vs skills vs hooks | comparison | claude-md, skills, hooks |
| TOK-066 | Invoked skills stay in context (merged into SKILL-006) | fact | skills, compaction |
| TOK-067 | Plugin and subagent-definition overhead | fact | plugins, subagents |
| TOK-070 | Anti-patterns: sessions and workflow | anti-pattern | consolidated |
| TOK-071 | Anti-patterns: configuration | anti-pattern | consolidated |
| TOK-072 | Anti-patterns: API apps | anti-pattern | consolidated, api |
| TOK-080 | ccusage | tool | community, tracker |
| TOK-081 | Claude-Code-Usage-Monitor | tool | community, tracker |
| TOK-082 | Status line projects | tool | community, statusline |
| TOK-083 | Output-compression tools (RTK, context-mode) | tool | community, output |
| TOK-084 | Code-index MCP servers (Serena, claude-context, code-review-graph) | tool | community, search |
| TOK-085 | Ideas from other coding agents | comparison | aider, cline, codex |
| TOK-086 | The April 2026 usage-drain incident | fact | cache, incident |

### Writing, testing and distributing skills (`kb-skills.md`, SKILL)

#### Anatomy and loading

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

#### Writing descriptions that trigger

| ID | Title | Type | Tags |
|---|---|---|---|
| SKILL-011 | Descriptions: what + when, third person, user vocabulary | recommendation | description, triggering |
| SKILL-012 | Undertriggering: be a little pushy, and add negative triggers | pattern | description, triggering |
| SKILL-013 | Don't summarise a multi-step workflow in the description | pattern | description, triggering |
| SKILL-014 | Invocation controls: manual-only, hidden, path-scoped, overrides | tool | triggering, context-cost |
| SKILL-015 | Troubleshooting: not triggering, over-triggering, not followed | recommendation | triggering, debugging |

#### Progressive disclosure and the body

| ID | Title | Type | Tags |
|---|---|---|---|
| SKILL-016 | Keep the body small: only what Claude doesn't already know | recommendation | body, size |
| SKILL-017 | Reference files: one level deep, TOC, descriptive names | pattern | progressive-disclosure |
| SKILL-018 | Scripts for deterministic steps; match freedom to fragility | pattern | scripts, body |
| SKILL-019 | Durable wording: no dates, one term per idea, a default not a menu | recommendation | body, maintenance |
| SKILL-020 | Anti-pattern: capitalised MUST/NEVER instead of reasons | anti-pattern | body, style |

#### Choosing the right mechanism

| ID | Title | Type | Tags |
|---|---|---|---|
| SKILL-021 | Skills vs CLAUDE.md vs hooks vs subagents vs MCP vs output styles | comparison | architecture |
| SKILL-022 | Context cost of each extension type | comparison | context-cost |
| SKILL-023 | Rules that must hold every time belong in hooks | recommendation | hooks, reliability |
| SKILL-024 | CLAUDE.md under 200 lines; move procedures into skills | recommendation | claude-md, context-cost |

#### Testing and evaluation

| ID | Title | Type | Tags |
|---|---|---|---|
| SKILL-025 | Evaluation-first development and the Claude A / Claude B loop | pattern | testing |
| SKILL-026 | `claude plugin eval`: built-in with/without evaluation | tool | testing, triggering |
| SKILL-027 | skill-creator: benchmarks and description optimisation | tool | testing, triggering |
| SKILL-028 | Designing a trigger eval set | recommendation | testing, triggering |
| SKILL-029 | Community trigger-rate numbers and forced-evaluation hooks | comparison | testing, triggering, hooks |
| SKILL-030 | `/skill-doctor`, `plugin details` and telemetry for usage and cost | tool | maintenance, context-cost |
| SKILL-031 | Anti-patterns in skill testing | anti-pattern | testing |
| SKILL-032 | Retire skills the model has outgrown | recommendation | maintenance, testing |

#### Distribution and maintenance

| ID | Title | Type | Tags |
|---|---|---|---|
| SKILL-033 | Plugin layout for shipping skills | fact | distribution, plugins |
| SKILL-034 | Marketplaces and team rollout | fact | distribution, plugins |
| SKILL-035 | Plugin versioning: a fixed `version` pins users | anti-pattern | distribution, versioning |
| SKILL-036 | Auto-update, pinning and release channels | fact | distribution, versioning |
| SKILL-037 | Validate before publishing: `plugin validate --strict`, `plugin tag` | tool | distribution, ci |
| SKILL-038 | claude.ai skills: upload, sharing, org provisioning, sync into Claude Code | fact | distribution, claude.ai |
| SKILL-039 | Skills in the Claude API | fact | distribution, api |
| SKILL-040 | The Agent Skills open standard and portability | fact | portability |
| SKILL-041 | Security review of third-party skills and plugins | recommendation | security |

#### Published collections

| ID | Title | Type | Tags |
|---|---|---|---|
| SKILL-042 | anthropics/skills and claude-plugins-official | fact | collections |
| SKILL-043 | obra/superpowers: test-driven skill writing | pattern | collections, testing |
| SKILL-044 | Other strong collections: plugin-dev, Trail of Bits, wshobson, Vercel | comparison | collections |
| SKILL-045 | Anti-pattern: installing collections wholesale | anti-pattern | collections, context-cost |
| SKILL-046 | Ideas from other AI coding tools | comparison | portability, triggering |

#### Claude desktop app and WSL

| ID | Title | Type | Tags |
|---|---|---|---|
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

### Agents in repositories (osrs-tracker-web) (`kb-repo-agents.md`, REPO)

#### Baseline: osrs-tracker-web today

| ID | Title | Type | Tags |
|---|---|---|---|
| REPO-001 | osrs-tracker-web's Claude Code setup (inventory) | fact | baseline, osrs-tracker-web |
| REPO-002 | The `conventions-reviewer` agent: definition, tools, model | fact | baseline, reviewer |
| REPO-003 | How the reviewer is triggered and how it performs (measured) | fact | baseline, measurement, cost |
| REPO-004 | What the baseline does not cover | fact | baseline, gaps |

#### Definition, discovery and precedence

| ID | Title | Type | Tags |
|---|---|---|---|
| REPO-005 | Where each repo component lives and how it loads | fact | discovery, agents, skills, hooks, settings |
| REPO-006 | Settings precedence: scalars override, lists and hooks merge, deny wins | fact | precedence, permissions, hooks |
| REPO-007 | Workspace trust: what a repo can do before you trust it | fact | trust, hooks, security |
| REPO-008 | Commands are merged into skills | fact | commands, skills |
| REPO-009 | Agent discovery, reload and the `/agents` change | fact | discovery, reload, agents |
| REPO-010 | What a repo subagent starts with | fact | context, CLAUDE.md, skills |
| REPO-011 | Agent `memory:` for reviewers | fact | memory, reviewer |
| REPO-012 | Which surfaces load repo config | comparison | cloud, actions, add-dir, worktrees |

#### Which agents a repository should have

| ID | Title | Type | Tags |
|---|---|---|---|
| REPO-013 | A repo agent earns its place only with repo-specific knowledge | recommendation | catalogue, built-ins |
| REPO-014 | Conventions reviewer: rules read at runtime from the repo | pattern | reviewer, conventions |
| REPO-015 | Bug reviewer in a fresh context | pattern | reviewer, bugs, opus |
| REPO-016 | Test writer and test-gap analyser | recommendation | tests |
| REPO-017 | Security auditor | recommendation | security, reviewer |
| REPO-018 | Docs-drift checker and docs updater | recommendation | docs, schedule |
| REPO-019 | Dependency updater and migration helper | recommendation | dependencies, migration |
| REPO-020 | CI-failure fixer | tool | ci, autofix |
| REPO-021 | Browser or visual checker to keep screenshots out of the main context | pattern | playwright, tokens, ui |
| REPO-022 | Agent catalogue: purpose, trigger, tools, tier | recommendation | catalogue, model-selection |

#### Triggering repo agents

| ID | Title | Type | Tags |
|---|---|---|---|
| REPO-023 | Manual triggers in a session | fact | triggers, at-mention, --agent |
| REPO-024 | Auto-delegation is advisory; make mandatory reviews deterministic | recommendation | triggers, delegation |
| REPO-025 | Hooks that force or run a review | fact | hooks, stop, agent-hooks |
| REPO-026 | Calling a repo agent from an orchestrator | recommendation | orchestrator, background, resume |
| REPO-027 | CI: `claude-code-action@v1` modes and inputs | tool | github-actions, ci |
| REPO-028 | Running repo agents and skills inside the action | fact | github-actions, skills, agents |
| REPO-029 | Managed Code Review and `REVIEW.md` | tool | code-review, review-md |
| REPO-030 | Scheduled repo agents | comparison | schedule, routines, cron |

#### Permissions and safety

| ID | Title | Type | Tags |
|---|---|---|---|
| REPO-031 | `tools` allowlist, `disallowedTools`, and why Bash can't be scoped per agent | fact | tools, least-privilege |
| REPO-032 | The parent's permission mode overrides the agent's; auto mode checks subagents | fact | permission-modes, auto-mode |
| REPO-033 | Recipe: a reviewer that really can't write | pattern | read-only, hooks, reviewer |
| REPO-034 | Bash permission rules are pattern matches, not a boundary | fact | permissions, bash |
| REPO-035 | Sandboxing for agent Bash | tool | sandbox |
| REPO-036 | Secrets and identifiers around repo agents | recommendation | secrets, public-repo |
| REPO-037 | Prompt injection: the threat model for repo agents | fact | prompt-injection, incidents |
| REPO-038 | Hardening checklist for agents in GitHub Actions | recommendation | github-actions, security |
| REPO-039 | Untrusted-content discipline in agent prompts | pattern | prompt-injection, prompts |

#### Sharing agents across repositories

| ID | Title | Type | Tags |
|---|---|---|---|
| REPO-040 | Ways to share agents, skills and hooks across repos | comparison | sharing, plugins |
| REPO-041 | What a plugin can't carry for repo agents | fact | plugins, limits |
| REPO-042 | Pattern: a generic reviewer body, repo-specific rules files | pattern | sharing, rules, review-md |
| REPO-043 | Our three `conventions-reviewer` copies: what differs | fact | baseline, sharing |

#### CLAUDE.md and agent instructions

| ID | Title | Type | Tags |
|---|---|---|---|
| REPO-044 | What goes in CLAUDE.md, a skill, an agent, a hook or REVIEW.md | recommendation | CLAUDE.md, design |
| REPO-045 | Size, instruction count and cross-tool instruction files | fact | CLAUDE.md, AGENTS.md, size |

#### How good reviewers are written

| ID | Title | Type | Tags |
|---|---|---|---|
| REPO-046 | Official reviewer agents compared | comparison | reviewer, official-example |
| REPO-047 | The do-not-flag list | pattern | reviewer, noise |
| REPO-048 | Verify findings before anyone acts on them | pattern | reviewer, validation |
| REPO-049 | Severity schemes, caps and convergence | comparison | reviewer, severity |
| REPO-050 | Structured findings and a verdict line | pattern | reviewer, output |
| REPO-051 | Community agent collections: what to copy and what to avoid | anti-pattern | community, collections |
| REPO-052 | Ideas from other review tools | comparison | codex, bugbot, copilot, coderabbit |

### Several sessions in one repo (`kb-sessions.md`, SESS)

| ID | Title | Type | Tags |
|---|---|---|---|
| SESS-001 | What git worktrees share and keep apart | fact | git, worktrees, refs, config |
| SESS-002 | The stash is shared across worktrees | anti-pattern | git, stash, worktrees |
| SESS-003 | Lock contention on shared `.git` files | fact | git, locks, worktrees |
| SESS-004 | What Claude Code worktrees share with the main checkout | fact | worktrees, plugins, permissions, hooks, desktop |
| SESS-005 | Worktree lifecycle on each surface | comparison | worktrees, cleanup, desktop, cloud |
| SESS-006 | Fresh bases and reusing a worktree name | fact | worktrees, baseRef, staleness |
| SESS-007 | The worktree isolation checks | fact | worktrees, isolation, guard |
| SESS-008 | Gitignored files, dependencies and ports in worktrees | pattern | worktrees, node_modules, env, ports |
| SESS-009 | `~/.claude` state that concurrent sessions share | fact | config, settings, history, memory, plugins |
| SESS-010 | `~/.claude.json` under concurrent sessions | fact | config, corruption, backups |
| SESS-011 | `/model` and `/effort` leak into other sessions | anti-pattern | settings, model, effort |
| SESS-012 | OAuth refresh races across sessions | fact | auth, credentials, locks |
| SESS-013 | MCP servers and browser profiles across sessions | fact | mcp, playwright, processes |
| SESS-014 | `CLAUDE_CONFIG_DIR`: what it isolates | fact | config, isolation, env-vars |
| SESS-015 | The prompt cache is per directory | fact | cache, worktrees |
| SESS-016 | Sessions share one dev-server port space | pattern | ports, dev-server |
| SESS-017 | Cross-session messaging: `ListAgents` and `SendMessage` | tool | messaging, sendmessage, listagents |
| SESS-018 | A message from another session carries no authority | fact | messaging, permissions, security |
| SESS-019 | Inbound message controls and defaults | fact | messaging, settings, headless |
| SESS-020 | Remote Control and several sessions | tool | remote-control, mobile, server-mode |
| SESS-021 | No `pull_request` CI on a conflicting PR | fact | github, ci, conflicts |
| SESS-022 | Reading `mergeable` and `mergeStateStatus` | fact | github, gh, polling |
| SESS-023 | Strict "up to date" checks and Update branch | fact | github, branch-protection, ci |
| SESS-024 | Merge queue vs auto-merge | comparison | github, merge-queue, auto-merge |
| SESS-025 | Rebasing and force-pushing from worktrees | pattern | git, rebase, force-with-lease, rerere |
| SESS-026 | `merge=union` for CHANGELOG.md works only locally | fact | changelog, gitattributes, github |
| SESS-027 | Changelog fragments avoid the shared file | comparison | changelog, changesets, towncrier, scriv |
| SESS-028 | What Claude's GitHub integrations do about conflicts | fact | claude-code-action, cloud, conflicts |
| SESS-029 | Resuming sessions across worktrees | fact | resume, continue, worktrees |
| SESS-030 | Moving sessions between cloud, terminal and desktop | comparison | teleport, cloud, desktop |
| SESS-031 | Choosing a hand-off channel | recommendation | handoff, issues, messaging, progress-files |
| SESS-032 | Parallel sessions share one plan allowance | fact | usage-limits, quota, usage |
| SESS-033 | How many sessions practitioners run, and what limits them | comparison | sizing, review, community |
| SESS-034 | Watching many sessions | tool | notifications, statusline, monitoring |
| SESS-035 | Our setup against these findings | comparison | our-setup, global-claude-md |

### Hooks (`kb-hooks.md`, HOOK)

| ID | Title | Type | Tags |
|---|---|---|---|
| HOOK-001 | Session, turn and tool-loop events | fact | events, reference |
| HOOK-002 | Agent, environment and lifecycle events | fact | events, reference |
| HOOK-003 | Common input fields and hook environment variables | fact | input, env |
| HOOK-004 | Exit codes and stdout: how a run resolves | fact | exit-codes, output |
| HOOK-005 | JSON output fields and the 10,000-character cap | fact | json, output, limits |
| HOOK-006 | PreToolUse decisions and how they meet permission rules | fact | pretooluse, permissions |
| HOOK-007 | `additionalContext`: where it lands and how to word it | pattern | context, output |
| HOOK-008 | SessionStart outputs and `CLAUDE_ENV_FILE` | fact | sessionstart, env |
| HOOK-009 | The five handler types and which events take them | comparison | handler-types |
| HOOK-010 | Prompt and agent hooks: behaviour and cost | fact | prompt-hooks, agent-hooks, cost |
| HOOK-011 | Async and `asyncRewake` hooks | fact | async, background |
| HOOK-012 | Timeouts per handler type and event | fact | timeouts, limits |
| HOOK-013 | Hooks fail open by default; `onFailure: "block"` | fact | failure, reliability |
| HOOK-014 | Parallel runs, deduplication and combined decisions | fact | ordering, parallel |
| HOOK-015 | The cost of a hook on every tool call | fact | cost, latency, measurement |
| HOOK-016 | Where hooks are defined | fact | locations, plugins, settings |
| HOOK-017 | Hooks by surface: terminal, desktop, cloud, `-p`, action, SDK | comparison | surfaces, desktop, cloud |
| HOOK-018 | Matcher syntax | fact | matchers |
| HOOK-019 | The `if` field: filtering on tool arguments | fact | if, matchers, bash |
| HOOK-020 | Hooks in skill and agent frontmatter | fact | frontmatter, skills, agents |
| HOOK-021 | `/hooks`, live reload and switching hooks off | tool | hooks-menu, disable, managed |
| HOOK-022 | Debug log for hooks | tool | debugging |
| HOOK-023 | Testing a hook script on its own | pattern | testing, debugging |
| HOOK-024 | Why a hook silently does nothing | anti-pattern | debugging, pitfalls |
| HOOK-025 | Hooks run with your permissions; trust and `-p` | fact | security, trust |
| HOOK-026 | Hooks read untrusted input and are not a security boundary | recommendation | security, injection |
| HOOK-027 | Pattern: format or lint after an edit | pattern | format, posttooluse |
| HOOK-028 | Pattern: block dangerous commands and protected files | pattern | safety, pretooluse |
| HOOK-029 | Pattern: context at SessionStart, after compaction, before compaction | pattern | sessionstart, compaction |
| HOOK-030 | Pattern: notifications | pattern | notification, stop |
| HOOK-031 | Pattern: Stop hooks that keep Claude working | pattern | stop, loops |
| HOOK-032 | Community hook collections worth reading | tool | community, collections |
| HOOK-033 | Hook anti-patterns | anti-pattern | pitfalls, performance |
| HOOK-034 | Hooks in other coding agents | comparison | cursor, codex, gemini, copilot |
| HOOK-035 | Plugin mods versus settings hooks | fact | mods, plugins |
| HOOK-036 | Our hooks today (osrs-tracker repos, user settings) | fact | our-setup, osrs-tracker |

### Instructing the 5.x models (`kb-prompting.md`, PROMPT)

| ID | Title | Type | Tags |
|---|---|---|---|
| PROMPT-001 | Where Anthropic's prompting guidance lives | fact | docs, per-model-pages |
| PROMPT-002 | What changed from the 4.x models | fact | migration, 5.x |
| PROMPT-003 | Literal instruction following: state the scope | fact | literal, scope |
| PROMPT-004 | Emphasis and capitals: one marked line, not many | recommendation | emphasis, over-triggering |
| PROMPT-005 | Give the reason behind a rule | pattern | motivation, generalisation |
| PROMPT-006 | Examples: 3–5, varied, tagged, and positive | pattern | few-shot, examples |
| PROMPT-007 | XML tags and long-context layout | pattern | xml, long-context, pasted-content |
| PROMPT-008 | Role prompts: one sentence is enough | fact | role, system-prompt |
| PROMPT-009 | Say what to do; when banning, name the exact patterns | recommendation | positive-phrasing, prohibitions |
| PROMPT-010 | Thinking is set by effort; prompts move it less | fact | thinking, effort |
| PROMPT-011 | Don't ask for the reasoning in the response | anti-pattern | reasoning-extraction, refusals |
| PROMPT-012 | Briefing a cold-start subagent | pattern | subagents, briefs |
| PROMPT-013 | Asking for a return format | pattern | subagents, output-format, headless |
| PROMPT-014 | Unattended runs and `claude -p`: tell it nobody is watching | pattern | headless, autonomy, early-stopping |
| PROMPT-015 | Wording CLAUDE.md and agent bodies | recommendation | claude-md, agents, wording |
| PROMPT-016 | Conflicting instructions and where instructions lose force | fact | claude-md, conflicts, compaction |
| PROMPT-017 | `/doctor prompt-audit`: find instructions written for older models | tool | audit, maintenance |
| PROMPT-018 | Claude Code runs the current models on a shorter system prompt | fact | system-prompt, claude-code |
| PROMPT-019 | The four current models compared: scaffolding and over-following | comparison | models, scaffolding |
| PROMPT-020 | Haiku 5.5: what to add to its prompts | fact | haiku, scaffolding |
| PROMPT-021 | Sonnet 5.5: initiative depends on effort | fact | sonnet, effort, scope |
| PROMPT-022 | Opus 5.5: long unattended runs and early reports | fact | opus, unattended |
| PROMPT-023 | Fable 5.1: finish the task, keep it in scope | fact | fable, scope, writing |
| PROMPT-024 | Shorter output: lead with the outcome, be selective | recommendation | verbosity, length |
| PROMPT-025 | Fewer clarifying questions, or more: the knobs | pattern | questions, autonomy, auto-mode |
| PROMPT-026 | Output styles in Claude Code | tool | output-styles, verbosity |
| PROMPT-027 | Premature "done": demand evidence and a real check | pattern | failure-modes, verification |
| PROMPT-028 | Test gaming and hard-coding | pattern | failure-modes, reward-hacking |
| PROMPT-029 | Sycophancy and holding a position | fact | failure-modes, sycophancy |
| PROMPT-030 | Remove scaffolding written for older models | anti-pattern | migration, cleanup |
| PROMPT-031 | Scope creep: name the extras to leave out | pattern | scope, over-eagerness |
| PROMPT-032 | Review prompts: a severity bar lowers recall | pattern | review, recall |
| PROMPT-033 | Text right after tool results can read as an injection | fact | harness, injection, reminders |
| PROMPT-034 | Claude Code's own prompt fragments: what to borrow | comparison | community, claude-code, system-prompt |
| PROMPT-035 | OpenAI Codex and GPT prompting guides: what transfers | comparison | codex, openai |
| PROMPT-036 | Gemini CLI, Cline, Aider, Cursor, Amp, Copilot: ideas | comparison | gemini, aider, cursor, leaks |
| PROMPT-037 | Community prompt and agent collections: what to copy | comparison | community, collections |
| PROMPT-038 | How Anthropic's newest agent bodies are written | pattern | agents, official-example, wording |

### Agents with cloud and cluster access (`kb-infra-agents.md`, INFRA)

| ID | Title | Type | Tags |
|---|---|---|---|
| INFRA-001 | What Anthropic and AWS say about cloud credentials for agents | fact | least-privilege, identity, aws |
| INFRA-002 | Isolation for infrastructure work: dev containers, cloud sessions, the sandbox | comparison | devcontainer, cloud-sessions, sandbox |
| INFRA-003 | The AWS MCP Server: tools, read-only mode and IAM context keys | tool | aws, mcp, iam |
| INFRA-004 | kubernetes-mcp-server: read-only, denied resources and output | tool | kubernetes, mcp, read-only |
| INFRA-005 | Flux MCP server: read-only, secret masking and filters | tool | flux, mcp, gitops |
| INFRA-006 | What a server or a credential enforces that Bash rules can't | fact | mcp, rbac, iam, permissions |
| INFRA-007 | Output size: MCP filters versus CLI output | recommendation | mcp, tokens, output |
| INFRA-008 | Permission rules for `aws`, `kubectl`, `helm` and `terraform` | fact | permissions, bash, cloud-cli |
| INFRA-009 | Auto mode's built-in rules for cloud and cluster actions | fact | auto-mode, classifier, infra |
| INFRA-010 | Telling auto mode which infrastructure is production | recommendation | auto-mode, environment, settings |
| INFRA-011 | The sandbox with cloud CLIs, and AWS credential masking | tool | sandbox, credentials, sigv4 |
| INFRA-012 | Guard hooks for destructive infrastructure commands | pattern | hooks, pretooluse, safety |
| INFRA-013 | Plan and apply split with human approval | pattern | terraform, approval, ci |
| INFRA-014 | GitOps: the agent opens a PR, Flux applies it | pattern | gitops, flux, pr |
| INFRA-015 | Dry-run and diff commands before any change | fact | dry-run, diff, kubectl, terraform |
| INFRA-016 | AWS audit trail: CloudTrail and attributing agent actions | fact | cloudtrail, audit, aws |
| INFRA-017 | Kubernetes audit logs and Claude Code's own records | fact | audit, kubernetes, otel, hooks |
| INFRA-018 | Reading logs and events with filters during an incident | pattern | logs, incidents, mcp |
| INFRA-019 | A read-only subagent that digests logs | pattern | subagents, logs, incidents |
| INFRA-020 | AWS credentials: profiles, short-lived sessions and Claude Code's AWS settings | fact | credentials, sso, sts, settings |
| INFRA-021 | How credentials leak into transcripts, environments and telemetry | fact | credentials, transcripts, otel, env |
| INFRA-022 | Published incidents: agents that destroyed infrastructure or data | fact | incidents, terraform, databases |
| INFRA-023 | Which guardrail would have stopped each incident | recommendation | incidents, guardrails |
| INFRA-024 | Our setup: AWS, Kubernetes and MCP access as of 2026-10-12 | fact | our-setup, aws, kubernetes, mcp |

## Conflicts

Places where entries, or an entry and another file's recommendations or open questions, disagree. Checked 2026-10-12 against the sources the entries cite; the pages were not re-fetched.

| Topic | Claims | Which the sources support |
|---|---|---|
| Default skill-listing budget | SKILL-005 and `kb-skills.md` Open questions: the default `skillListingBudgetFraction`, and whether the 1% counts characters or tokens, are unconfirmed. TOK-005: a character budget, `skillListingBudgetFraction: 0.01`, with an 8,000-character fallback. | TOK-005, which cites the settings and env-vars references that SKILL-005 didn't read. Resolved by merging SKILL-005 into TOK-005. |
| Can subagents spawn subagents? | `kb-token-usage.md` Open question 5: the context-window page says the Agent tool is withheld from subagents by default. ORCH-006: nesting up to 3 layers by default (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`), with the history of the default (5, then 1, then 3 since v2.1.219). | ORCH-006. The sub-agents and env-vars pages are the reference for this setting, and the context-window page is an illustrative simulation. To confirm, check `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` on the env-vars page during re-verification. |
| Does `CLAUDE_CODE_SUBAGENT_MODEL` move built-in Explore? | `kb-token-usage.md` recommendation R4 said the env var covers "all subagents… including built-in Explore". ORCH-005 quotes the docs: plain `CLAUDE_CODE_SUBAGENT_MODEL` doesn't change Explore or Plan; a user agent named `Explore` does. | ORCH-005. R4 is corrected to say so. |
| Which model for the `Explore` override? | `kb-orchestration.md` recommendation 13 and REPO-022: Haiku 5.5 at `medium`. `kb-token-usage.md` R4 offers an `Explore` override with `model: sonnet` as its alternative. | ORCH-030 and ORCH-005 support Haiku 5.5 for read-only search (the official code-review plugin uses Haiku for this role); ORCH-033's Sonnet floor applies to agents that write. Combined advice: `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` for general-purpose subagents, plus an `Explore` override on Haiku 5.5 at `medium`, checked after a week. |
| Sonnet 5.5's default effort | ORCH-026 and TOK-055: `high` on the API. ORCH-028: `medium` in Claude Code. | Not a contradiction: the two surfaces have different defaults, and ORCH-028 says so. Whether that's intentional is an open question in `kb-orchestration.md`. |
| Does settings `env` keep `AWS_PROFILE` from other processes? | The Amazon Bedrock page: use settings files for "environment variables like `AWS_PROFILE` that you don't want to leak to other processes". The settings reference: `env` values "reach every subprocess Claude Code starts". | The settings reference, which describes the mechanism; the Bedrock line means the value stays out of your shell profile. INFRA-020 quotes both. |
| Emphasis in instructions | Claude Code best practices (2026-10-12): "add emphasis such as 'IMPORTANT' to that line alone. If you emphasize many lines, none of them stands out." The same page on 2026-01-23 ([Wayback](https://web.archive.org/web/20260123082902/https://code.claude.com/docs/en/best-practices)): "adding emphasis (e.g., 'IMPORTANT' or 'YOU MUST') to improve adherence". Prompting best practices: "dial back any aggressive language" (Opus 4.5 and later over-trigger). | The current pages agree on direction: no blanket emphasis, at most one marked line. PROMPT-004 records both. |
| Telling the model to verify its work | Prompting Claude Opus 5: remove explicit verification instructions, they "cause over-verification". Sonnet 5.5 and Haiku 5.5 pages: add a "run a real check" paragraph. Claude Code best practices: "Give Claude a way to verify its work". | Model- and effort-specific, not a contradiction: Opus verifies unprompted; Sonnet 5.5 at `low` and Haiku 5.5 at `low`/`medium` skip checks. Whether the Opus 5 advice holds for Opus 5.5 is open. PROMPT-027, PROMPT-030. |
| Numeric length caps on subagent reports | Effective context engineering: subagents return "often 1,000-2,000 tokens"; Claude Code's delegation prompt: "report in under 200 words". The `prompt-audit` rubric flags "hard word caps" because they "starve reasoning". | Read together: cap the final report, not the work. Inference, recorded in PROMPT-013. |

## Overlaps kept on purpose

These clusters cover neighbouring ground from different angles. They are cross-linked through `Related:` rather than merged:

- Where to put something, and what it costs: SKILL-021 (decision), SKILL-022 and TOK-065 (context cost), REPO-044 (repos with agents).
- CLAUDE.md size: SKILL-024 (authoring), TOK-003 (loading rules), REPO-045 (research and agents).
- Effort: ORCH-028 (levels and defaults), TOK-055 (as a cost lever, plus thinking).
- Keeping the orchestrator's context lean: ORCH-034 (results), TOK-035 (when to delegate).
- Caching: ORCH-040 (in fan-outs), TOK-052 (TTLs and settings).
- Skill frontmatter: SKILL-014 (invocation controls), TOK-064 (token effects).
- Scheduling: ORCH-017 (mechanisms), REPO-030 (for repo agents).
- Subagent definitions: ORCH-002 (fields), REPO-005 and REPO-009 (locations, reload), TOK-067 (description budget).
- Worktrees: ORCH-009 (subagent and session isolation mechanics), SESS-001 and SESS-004 (what worktrees share), SESS-005 (lifecycle per surface), SKILL-053 (desktop config root).
- Parallel sessions and quota: ORCH-013 and ORCH-020 (agent view, multipliers), SESS-032 and SESS-033 (plan allowance, how many sessions), ORCH-043 (session managers).
- Hand-offs: ORCH-036 (progress files in long runs), SESS-031 (choosing a channel between sessions), TOK-030 (handoff before `/clear`).
- Cloud and teleport: ORCH-016 (cloud sessions), SESS-030 (moving sessions between surfaces).
- Cache scope: TOK-052 (TTLs and scope), SESS-015 (worktrees split the cache).
- Hook handler types and model-based hooks: HOOK-009 and HOOK-010 (all types, cost), REPO-025 (review hooks), SKILL-023 (hooks vs skills).
- Where hooks live and how they merge: HOOK-016 and HOOK-021 (locations, `/hooks`, disabling), REPO-005 and REPO-006 (repo components, precedence).
- Hook trust and security: HOOK-025 (all hook sources, `-p`), REPO-007 (agent frontmatter, untrusted folders).
- Hook events: HOOK-001 and HOOK-002 (every event), ORCH-019 (orchestration events and uses).
- Blocking hooks: HOOK-028 (dangerous commands, protected files), REPO-033 (read-only reviewer), TOK-042 and TOK-044 (output and large-read hooks).
- Our osrs-tracker hooks: HOOK-036 (hook details and the aws `git -C` gap), REPO-001 (repo baseline).
- Sandboxing and credentials: REPO-035 and REPO-036 (repo agents), INFRA-011 (cloud CLIs, AWS credential masking) and INFRA-021 (transcripts, env, telemetry).
- Permission rules and their limits: REPO-034 (Bash rules are text matches), INFRA-008 (cloud CLI flag order), INFRA-006 (server flags versus credentials).
- Auto mode: REPO-032 (modes, subagents, fallback), INFRA-009 and INFRA-010 (infrastructure rules, environment entries).
- MCP servers: TOK-020 to TOK-023 (overhead and output limits), INFRA-003 to INFRA-005 and INFRA-007 (AWS, Kubernetes and Flux servers).
- Guard hooks: HOOK-028 and HOOK-032 (pattern, collections), INFRA-012 (infrastructure packs).
- Incidents: REPO-037 (prompt injection in repos and CI), INFRA-022 and INFRA-023 (destroyed infrastructure and data).
- Emphasis and reasons in instructions: SKILL-020 (skills), PROMPT-004 and PROMPT-005 (all prompts).
- CLAUDE.md wording: PROMPT-015 and PROMPT-016 (wording, conflicts), REPO-044 and REPO-045 (what goes where, size), SKILL-024.
- Subagent briefs and returns: ORCH-007 and ORCH-024 (context, decisions), PROMPT-012 and PROMPT-013 (wording), ORCH-034 and ORCH-035 (report protocol).
- Premature completion: ORCH-037 and ORCH-039 (guardrails, verifiers), PROMPT-027 (prompt lines).
- Reviewer wording: REPO-047 to REPO-049 (do-not-flag lists, validation, severity), PROMPT-032 (severity bars and recall).
- Injection: REPO-037 and REPO-039 (untrusted content), PROMPT-033 (our own harness text mistaken for injection), PROMPT-007 (marking pasted text).
- Other tools' prompts: TOK-085, ORCH-044 and REPO-052 (cost, orchestration, review), PROMPT-034 to PROMPT-036 (instruction wording).
- Community collections: SKILL-044, SKILL-045 and REPO-051 (skills, agents), PROMPT-037 (prompt wording).
- Text injected next to tool results: HOOK-007 (wording hook `additionalContext`), PROMPT-033 (harness text mistaken for injection).

## Merges

Done 2026-10-12. "Full" means the entry is now a pointer; "partial" means only the repeated part became a pointer and the entry keeps its unique content.

| Entry | Kind | Kept in | What moved, and why that one was kept |
|---|---|---|---|
| TOK-060 Skill progressive disclosure | Full | SKILL-004 | SKILL-004 has more sources and the consequences. Moved: the API overview's "no context penalty" caveat. |
| TOK-066 Invoked skills stay in context | Full | SKILL-006 | Same source; SKILL-006 is the skills topic's home. Moved: the 400-line example, and the reference-files and `context: fork` advice. |
| SKILL-005 Skill-listing budget and truncation | Full | TOK-005 | TOK-005 cites the settings and env-vars references and knows the default (see Conflicts). Moved: `--debug` overflow warning, the front-loading advice, the CHANGELOG source. |
| TOK-063 Scripts and dynamic injection | Full | SKILL-018, SKILL-008 | The SKILL entries are fuller. Moved: the sorting quote (SKILL-018), the 2-minute Bash timeout (SKILL-008). |
| TOK-037 Multi-agent multiplies tokens | Full | ORCH-020 | ORCH-020 has five sources and every figure; scaling rules are in ORCH-025 and agent-team cost in ORCH-010. Nothing moved. |
| TOK-036 Subagent model selection | Partial | ORCH-003, ORCH-005 | Resolution order and Explore's model became a pointer. Kept: the official Haiku advice and our 6-day cost numbers (first labelled 30-day). |
| TOK-006 What a subagent's context starts with | Partial | ORCH-007 | The starts-with list became a pointer. Kept: cache behaviour and measured sizes. |
| REPO-010 What a repo subagent starts with | Partial | ORCH-007 | The starts-with list (with its CLAUDE.md hierarchy and `omitClaudeMd` details, now in ORCH-007) became a pointer. Kept: the consequences for repo agents. |
| TOK-061 Writing skill descriptions | Partial | SKILL-003, SKILL-011–013 | Limits and content rules became a pointer. Kept: the length-versus-cost tension, Vercel's eval, our default length. |
| TOK-062 SKILL.md size and reference files | Partial | SKILL-016, SKILL-017 | Size and structure rules became a pointer. Kept: measured sizes of official skills and the superpowers cut. |

`Related:` lines and Quick answers that named a fully merged entry now name the entry it went into.

## Changelog

| Date | IDs | Change |
|---|---|---|
| 2026-10-12 | INFRA-001 to INFRA-024 | New topic file `kb-infra-agents.md` (FreekMencke/claude-kb#21): cloud identities and isolation, AWS/Kubernetes/Flux MCP servers versus CLIs, permission rules, auto mode and the sandbox for infrastructure commands, plan and apply, GitOps, audit trails, incident debugging, credential leaks, published incidents, and a review of our AWS, cluster and MCP access. 3 Quick answers, 1 conflict and 6 overlap clusters added. |
| 2026-10-12 | SESS-001 to SESS-035 | New topic file `kb-sessions.md` (FreekMencke/claude-kb#20): worktrees and shared git state, shared `~/.claude` state, cross-session messaging, keeping branches current on GitHub, hand-offs, and usage limits. 3 Quick answers and 5 overlap clusters added. |
| 2026-10-12 | all | INDEX.md created (step 3: merge and index). 5 full and 5 partial merges, 5 conflicts recorded, 10 cross-links added; see Merges and Conflicts. `kb-token-usage.md` R4 corrected per ORCH-005. |
| 2026-10-12 | SKILL-050, SKILL-056 | Fix for missing account skills in desktop WSL sessions verified: per-skill symlinks from a git repo into `~/.claude/skills/` load there, without a restart. Recommendation 9 in `kb-skills.md` marked done (FreekMencke/claude-skills), recommendation 4 started. |
| 2026-10-12 | all (official-docs / official-example entries) | Monthly re-verification: 174 entries checked against their sources; Last verified set to 2026-10-12 except SKILL-040, SKILL-046 and TOK-085 (sources unfetchable, dates left as they were). No source was gone, so none was marked unverified. |
| 2026-10-12 | ORCH-019 | PreCompact can block (exit 2), PostCompact can't; WorktreeRemove fails only if the directory still exists. Flags recommendation 12 in `kb-orchestration.md`. |
| 2026-10-12 | ORCH-025 | "the lead spawned" corrected to "early agents spawned" per the research-system post. |
| 2026-10-12 | ORCH-040 | Changing effort keeps the cache in Claude Code on Opus 5.5, Sonnet 5.5, Haiku 5.5 and Fable 5.1 (API key or subscription). Flags recommendation 9 in `kb-orchestration.md`. |
| 2026-10-12 | ORCH-042 | Validator subagents are Opus for bugs and Sonnet for CLAUDE.md violations. Flags recommendation 8 in `kb-orchestration.md`. |
| 2026-10-12 | REPO-005 | Skill frontmatter hooks stay active for the rest of the session once invoked; agent hooks only while the subagent runs. |
| 2026-10-12 | REPO-008 | "Project command beats `--add-dir` command" has no source; marked unverified. |
| 2026-10-12 | REPO-017 | Hard-exclusion count no longer stated (source numbering repeats 16); `security-guidance` says stay on the default Opus for precision, not about Sonnet by name. |
| 2026-10-12 | REPO-027 | Checked: `session_id` is an action output (action.yml, added as a source). No change. |
| 2026-10-12 | REPO-036, REPO-038 | PAT warning applies to `allowed_non_write_users`; `allowed_bots: '*'` is discouraged, not prohibited; v1.0.94 described as its release notes do (the `PATH` fix), release notes added as a source. Flags the CI agents row in `kb-repo-agents.md` recommendations. |
| 2026-10-12 | REPO-046 | Checked: the docs' "Code reviewer" example is Read, Grep, Glob, Bash on `inherit` with Critical / Warnings / Suggestions. No change. |
| 2026-10-12 | SKILL-007 | Reserved names: `anthropic-skills` (outside a plugin) added next to `synced`; the v2.1.282 `claude-ai` reservation was reverted in v2.1.283. |
| 2026-10-12 | SKILL-012 | docx negative-trigger quote completed. |
| 2026-10-12 | SKILL-021 | "About 30 lines" threshold isn't in the sources; marked unverified. Slash-command merge sourced to the skills docs. |
| 2026-10-12 | SKILL-022 | "About 100 tokens per description" replaced with the documented 1,536-character cap and 1% listing budget. Flags recommendation 1 in `kb-skills.md`. |
| 2026-10-12 | SKILL-032 | Quote corrected; it applies to capability-uplift skills. Flags recommendation 7 in `kb-skills.md`. |
| 2026-10-12 | SKILL-037 | In-session `/plugin validate <path>` is documented. |
| 2026-10-12 | TOK-015 | Quotes replaced with the support articles' actual wording; inactivity expiry quoted from article 9797557. |
| 2026-10-12 | TOK-020, TOK-022 | MCP description and server-instruction limit is 4,096 characters since v2.1.296 (was 2,048). Flags R9 in `kb-token-usage.md`. Its open question about the cap (2,048 vs 16,384) is partly answered. |
| 2026-10-12 | TOK-043 | Checked: the PDF support page states 1,500–3,000 tokens per page. No change. |
| 2026-10-12 | TOK-051, TOK-054 | Automatic-caching quote replaced with the docs' wording; speculative caching now cites its own cookbook; "expiry, not an SLA" removed (not in the batch cookbook). |
| 2026-10-12 | TOK-052 | Checked: the blog URL on claude.dev resolves (claude.com redirects to it). No change. |
| 2026-10-12 | TOK-072 | Cache table row: tool-definition changes invalidate the whole cache, `tool_choice` and thinking only message blocks. |
| 2026-10-12 | SKILL-059, SKILL-038 | New SKILL-059: personal Git marketplaces on claude.ai and `<name>@synced` plugins in Claude Code. `kb-skills.md` recommendations 4 and 9 updated to the marketplace route and the `freek-local-skills` split; two open questions added (FreekMencke/claude-kb#4). |
| 2026-10-12 | TOK-008, TOK-009, TOK-032, TOK-036, TOK-042, TOK-043, REPO-004 | The "30 days" local measurements cover 2026-10-07 to 2026-10-12 (6 days); labels corrected, shares unchanged. Flags `kb-token-usage.md` R1, R4, R5, R7 and R9, whose savings were per 6 days, not per month (FreekMencke/claude-kb#5). |
| 2026-10-12 | SKILL-008, TOK-013 | `$0`/`$N` substitution also hits literal text when arguments are passed; `cost-state` transcript lines added as a second usage source (FreekMencke/claude-kb#5). |
| 2026-10-12 | SKILL-030, SKILL-031 | `/skill-doctor` in a desktop WSL session replies "Skill usage reports are not available on this connection"; `claude -p "/skill-doctor"` in the terminal prints the report. Open question on Code-tab skill commands narrowed. |
| 2026-10-12 | (recommendations) | `kb-token-usage.md`: measured starting context with `claude -p "/context all"` (29.4k per turn); open question 1 answered; R8 measured and R9 downgraded. |
| 2026-10-12 | SKILL-060, SKILL-048, SKILL-059, ORCH-017, REPO-012 | New SKILL-060: cloud sessions and routines don't load claude.ai marketplace plugins; read the skill from a cloned repo instead (tested in the docs-drift routine). ORCH-017: GraphQL is blocked in cloud sessions, use `gh api`. `kb-repo-agents.md` recommendation 6 status updated. |
| 2026-10-12 | REPO-021 | Template T3 tested in osrs-tracker-web#223: plugin MCP tools listed by name work in a subagent's `tools`; notes on reading screenshots and their path. `kb-repo-agents.md` open question answered. The token savings stay unmeasured until #223's step 6. |
| 2026-10-12 | (recommendations) | Done recommendations cut to one-line pointers in all four topic files; open items, won't-do decisions, measurements and referenced IDs kept. `kb-repo-agents.md` T1 now points to the live `conventions-reviewer` and keeps the shared read-only hook. |
| 2026-10-12 | (recommendations) | `kb-skills.md` recommendation 12: `morning` and `import-memory` disabled on claude.ai; `docs`, the file skills, `deep-research`, the three browser skills and `skill-creator` kept on purpose; recommendation done. |
| 2026-10-12 | HOOK-001–HOOK-036 | New topic `kb-hooks.md` (FreekMencke/claude-kb#19): every event, handler types and their cost, timeouts, failure modes, locations and surfaces, matchers and `if`, debugging, security, patterns, community collections and our setup. Answers REPO's open question on `prompt` hook cost (HOOK-010); ORCH-019's unverified TaskCreated, TaskCompleted and TeammateIdle input fields are now in HOOK-002. |
| 2026-10-12 | PROMPT-001 to PROMPT-038 | New topic `kb-prompting.md`: instructing the 5.x models (FreekMencke/claude-kb#22). 4 Quick answers, 3 Conflicts and 9 Overlaps added; links HOOK-007 and HOOK-031. |
