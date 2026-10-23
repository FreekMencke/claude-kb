# Token usage and context efficiency

Prefix: TOK. Researched 2026-10-12 on Claude Code v2.1.296 and the docs live that day; re-verified 2026-10-14 against the docs fetched that day, the claude-code CHANGELOG through 2.1.299 and our repos' `origin/main` (each entry's Last verified date is authoritative). Model names and prices are those on the docs that day (Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5). `docs.claude.com` now redirects to `platform.claude.com/docs`. Entries marked "local measurement" come from our own transcripts in `~/.claude/projects/` (6 days, 2026-10-07 to 2026-10-12, 209 main sessions, 482 transcript files, one machine), analysed on 2026-10-12.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What costs the most in a Claude Code session? | Re-reading the whole context on every turn. For us, cache reads are 52% of list-price cost, and turns over 200k context use 54% of input tokens. | TOK-008, TOK-009 |
| How big is the fixed overhead before I type anything? | About 25–27k tokens of system prompt + tool definitions, about 37–42k on our first turn including CLAUDE.md, skills and the prompt. A subagent starts at about 28.5k. | TOK-002, TOK-006 |
| How do I see what fills my context, and what I spent? | `/context` (or `/context all`); `/usage` for spend (`/cost` and `/stats` are aliases). For history, `ccusage`; live, the status line JSON, `claude-hud` or `ccstatusline`. | TOK-010, TOK-080, TOK-082 |
| How do plan limits work? | A 5-hour session window plus a weekly limit, shared by claude.ai, Claude Code and Desktop. Max is 5x or 20x Pro per session. | TOK-014 |
| Do many MCP servers still bloat context? | Much less: Claude Code defers MCP tool schemas by default, so only names and server instructions load. CLIs (`gh`, `aws`) are still cheaper. | TOK-020, TOK-022 |
| When should I `/clear` vs `/compact`, and when does auto-compact fire? | `/clear` between unrelated tasks or after two failed corrections; `/compact <focus>` at a natural break. Auto-compact fires at about 967K on native-1M models (200K on 4.6 without `[1m]`); lower it with `autoCompactWindow`. At 400K, compaction measurably lost little (TOK-116). | TOK-030, TOK-031, TOK-007, TOK-032, TOK-116 |
| Which model should subagents use? | Built-in Explore inherits the main model (Opus, if that's what you run). Set `model:` per agent, or `CLAUDE_CODE_SUBAGENT_MODEL` for cheaper defaults; it doesn't move built-in Explore or Plan, so define your own `Explore` agent or also set `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`. | TOK-036 |
| How long does the prompt cache live, and what breaks it? | 1 hour for the main conversation on a subscription; 5 minutes for subagents, on an API key, or on usage credits. Switching model, fast mode, effort on older models, upgrading Claude Code, and MCP changes with tool search off break it; editing CLAUDE.md doesn't. | TOK-052, TOK-053 |
| How much do batches save? | 50% on input and output, and it stacks with caching. Most finish within 1 hour, max 24 hours. | TOK-054 |
| How long should CLAUDE.md and skill descriptions be? | CLAUDE.md under 200 lines per file; `@imports` don't reduce cost, so move procedures to skills or `paths:`-scoped rules. Every skill's name + description loads on every turn, within 1% of the window and 1,536 characters each: keep it short and front-load triggers. | TOK-003, TOK-065, TOK-005, TOK-061 |
| What do images and PDFs cost? | An image costs ⌈w/28⌉×⌈h/28⌉ tokens (max 1,568 standard, 4,784 high-res). A PDF costs 1,500–3,000 tokens per page plus image cost. | TOK-043 |
| How should I read docs: WebFetch, `curl`, a docs MCP server or context7? | WebFetch reads 100,000 characters per call (an `offset` reads on), usually answered by a small model that may cut quotes; preapproved docs pages under that come back raw. For exact wording, `curl` the `.md` page and grep, or use the docs' MCP server. context7 costs about 2k tokens a lookup but can be weeks stale. | TOK-087, TOK-088, TOK-089, TOK-095, TOK-096, TOK-098 |
| WebSearch `standard` or `extended`? | `standard` first. `extended` is "several times the cost and latency" (tool schema only); in our one test it was broader, not more authoritative. 200 searches per session, shared with subagents. | TOK-093, TOK-092 |
| Should a subagent return its report or a file path? | A path and a status in under 15 lines, when the lead will only slice or forward the report (an inline 40k-character report cost the parent about 14.9k tokens, a path about 0.8k). Subagents can't write files named `report.md`, `summary.md`, `analysis.md` or `findings*.md` (2026-10-16). | TOK-103, TOK-107 |
| How should a verify or query script print its result? | One line on success. On failure, capped `file:line` errors with the log path first and last: Claude Code keeps 10,000 characters of head and tail "with no file path". Keep the exit status through pipes (`pipefail` is off). | TOK-108, TOK-109, TOK-042 |

## Index

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
| TOK-087 | WebFetch reads 100,000 characters and answers through a second model | fact | webfetch, truncation, research |
| TOK-088 | Preapproved docs pages come back raw, and big results go to a file | fact | webfetch, docs, research |
| TOK-089 | Getting full text: `curl` the `.md` page and grep | pattern | webfetch, curl, research |
| TOK-090 | `llms.txt` is an index; `llms-full.txt` is too big to read | fact | llms-txt, docs, research |
| TOK-091 | WebFetch settings: cache, deadline, permissions, turning it off | fact | webfetch, settings |
| TOK-092 | WebSearch returns titles, URLs and a synthesized answer, within a session budget | fact | websearch, limits, research |
| TOK-093 | WebSearch `standard` against `extended` | comparison | websearch, research |
| TOK-094 | API web search and web fetch tools: prices and token effects | fact | api, websearch, webfetch, pricing |
| TOK-095 | context7: cost per lookup, freshness and limits | tool | mcp, docs, context7 |
| TOK-096 | Anthropic's docs MCP servers | tool | mcp, docs |
| TOK-097 | Other docs and search MCP servers | tool | mcp, docs, search, community |
| TOK-098 | Picking a research tool by question | recommendation | research, cost |
| TOK-099 | How many research subagents, on which model | recommendation | research, subagents |
| TOK-100 | What a research subagent's brief adds | pattern | research, subagents, briefs |
| TOK-101 | Getting sources back from research subagents | pattern | research, subagents, citations |
| TOK-102 | Anti-patterns: research tools | anti-pattern | consolidated, research |
| TOK-103 | Subagent file handoff: return a path and a status, not the report | pattern | subagents, handoff, context |
| TOK-104 | Where handoff files go | recommendation | subagents, handoff, scratchpad |
| TOK-105 | A background agent's `output_file` is its transcript, not its report | fact | subagents, background, notifications |
| TOK-106 | Handoff file layout for partial reads | recommendation | handoff, files, read |
| TOK-107 | Anti-patterns: subagent handoff | anti-pattern | consolidated, subagents, handoff |
| TOK-108 | What the Bash tool does to a script's output | fact | bash, output, exit-codes |
| TOK-109 | Output contract for scripts and CLIs that agents run | recommendation | scripts, output, cli |
| TOK-110 | Detecting an agent in a script | fact | env-vars, scripts, detection |
| TOK-111 | Agent-aware test runners and quiet flags | tool | tests, output, flags |
| TOK-112 | Background token spenders | fact | background, usage, settings |
| TOK-113 | Terse-output skills and rules files: measured savings | comparison | community, output, measurement |
| TOK-114 | Masking old tool output: measured elsewhere, not a Claude Code setting | comparison | context, tool-results, other-agents |
| TOK-115 | Task budgets (API beta) | fact | api, budgets, agents |
| TOK-116 | What auto-compaction at 400K lost: measured | fact | compaction, measurement, our-setup |

---

## [TOK-001] What fills the context, by feature
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Features overview: context costs](https://code.claude.com/docs/en/features-overview#understand-context-costs), [Context window](https://code.claude.com/docs/en/context-window)
- Related: TOK-002, TOK-005, TOK-020, TOK-065

Each request sends, in this order: system prompt and tool definitions, then project context (CLAUDE.md, auto memory, unscoped rules), then the conversation. What each feature costs:

| Feature | In context |
|---|---|
| CLAUDE.md, output style, unscoped rules | Full content, every request |
| Skills | Name + description every request. Body only once invoked, then stays. |
| MCP | Tool names + server instructions. Schemas only when loaded via tool search. |
| Subagents | Isolated. Only the final summary returns. |
| Hooks | Zero, unless they return `additionalContext` (plain stdout on exit 0 doesn't enter, except on `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart` and `PostModelSwitch`) |
| File reads, tool output, messages | Everything, every request after it arrives |

The docs' context-window page is an interactive simulation with "representative numbers": system prompt 4,200, project CLAUDE.md 1,800, file reads 1,100–2,400 each, a subagent summary of 420 tokens after the subagent read 6,100 tokens. It doesn't show built-in tool definitions, which are the biggest fixed item (TOK-002). Use `/context` for real figures.

## [TOK-002] Fixed overhead per session (measured)
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: local transcripts (`~/.claude/projects/*/*.jsonl`, first assistant turn's `usage`); [Systima/OpenCode vs Claude Code overhead](https://www.kunalganglani.com/blog/opencode-vs-claude-code-token-overhead); [wmedia /context sample](https://wmedia.es/en/tips/claude-code-context-command-token-usage)
- Related: TOK-001, TOK-006, TOK-009

Anthropic publishes no figure for the real system prompt and tool definitions. Our measurement on Opus 5.5, Claude Code v2.1.29x, across 38 recent sessions:
- First-turn input is **36.5k–42k tokens**.
- About **24.3k–26.9k** of that is a prefix read from cache that other sessions wrote: system prompt plus built-in tools. It is identical across sessions in the same environment.
- The remaining **10–16k** is session-specific: CLAUDE.md files, skill listing, deferred MCP names, environment, and the first prompt.

Community figures agree on the magnitude:
- Systima captured about 33k harness tokens per request with raw HTTP (single-source).
- `/context` samples show system prompt about 3–4k and system tools about 17–21k.

This overhead is cached, so it costs cache-read rates each turn. It is re-written when a session's cache goes cold.

Confidence note: the figures are our local measurement; community captures (Systima, `/context` samples) agree on the magnitude.

## [TOK-003] CLAUDE.md loading rules and size target
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Memory](https://code.claude.com/docs/en/memory), [Costs](https://code.claude.com/docs/en/costs), [Best practices](https://code.claude.com/docs/en/best-practices)
- Related: TOK-065, TOK-031, SKILL-024, REPO-045

Target: "under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence." Test each line with "Would removing this cause Claude to make mistakes?"

Loading rules:
- CLAUDE.md in the cwd and every ancestor directory loads at launch. `CLAUDE.local.md` is appended after it.
- Subdirectory CLAUDE.md files load lazily, when Claude touches a file there.
- `@imports` (max 4 hops) "don't reduce its context cost, because imported files also load at launch."
- Block-level HTML comments are stripped before injection, so maintainer notes in them are free.
- `claudeMdExcludes` skips ancestor files, e.g. in monorepos.
- Files over 4 MiB are skipped. A startup warning shows when one file, or the files combined, exceed the recommended size.
- `/doctor` (v2.1.206+) proposes trims: it cuts derivable content and keeps pitfalls and non-default conventions.
- Edits mid-session don't apply until `/clear`, `/compact` or restart (TOK-053).

## [TOK-004] Auto memory (MEMORY.md) load limits
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Memory](https://code.claude.com/docs/en/memory), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-003, TOK-006

What loads at the start of each conversation:
- "The first 200 lines of MEMORY.md, or the first 25KB, whichever comes first."
- Topic files are read on demand, so put detail there and keep MEMORY.md a one-line-per-entry index.
- Writes past the limit succeed, but return an error telling Claude to rewrite the index.
- The directory `~/.claude/projects/<project>/memory/` is shared across worktrees of one repo.
- Non-fork subagents don't get the main auto memory. A custom agent can have its own via `memory:`, with the same 200-line/25KB limit.

## [TOK-005] Skill listing budget
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Skills: descriptions are cut short](https://code.claude.com/docs/en/skills), [Env vars](https://code.claude.com/docs/en/env-vars), [Settings reference](https://code.claude.com/docs/en/settings-reference), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: TOK-061, TOK-064, TOK-067, SKILL-003, SKILL-014, SKILL-030, SKILL-045

"Every skill in the skill listing adds to your context on every turn, whether or not Claude ever uses it."

How the budget works:
- The listing always has every name. Descriptions get a character budget of **1% of the context window** (`skillListingBudgetFraction: 0.01`), with an 8,000-character fallback.
- On overflow, Claude Code drops descriptions, starting with the skills you invoke least. A dropped skill silently stops triggering.
- Each entry's `description` + `when_to_use` is capped at **1,536 characters** (`skillListingMaxDescChars`).
- To raise the budget, use `skillListingBudgetFraction` or `SLASH_COMMAND_TOOL_CHAR_BUDGET` (a fixed character count).
- To trim entries, use `skillOverrides` values `"name-only"`, `"user-invocable-only"` or `"off"`. These don't apply to plugin skills; manage those with `/plugin`.

Diagnostics:
- `/doctor` estimates listing cost.
- `/skill-doctor` (v2.1.252+) gives per-skill cost and usage and flags never-invoked skills.
- `/context` shows the post-budget size.
- `--debug` warns on overflow.

Every installed skill makes the others less likely to trigger. Front-load the key use case, because truncation cuts the end first.

The 2% figure in changelog v2.1.32 is outdated. Community estimates are about 2,000 tokens (roughly 15–25 skills) at 200K and about 10,000 at 1M; these are unverified.

## [TOK-006] What a subagent's context starts with
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Sub-agents: what loads at startup](https://code.claude.com/docs/en/sub-agents), [Prompt caching: subagents](https://code.claude.com/docs/en/prompt-caching), local transcripts (`<session>/subagents/*.jsonl`)
- Related: TOK-035, TOK-036, TOK-052, ORCH-007

What a subagent starts with and what it returns: see ORCH-007 (merged there 2026-10-12). This entry keeps the token cost.

Cache behavior:
- The first request doesn't read the parent's cache.
- Subagents use a 5-minute TTL even on subscriptions.
- Parallel siblings can share a prefix: workflow fan-outs hold back all but the first agent for up to 5 seconds.

Measured (30 runs): a subagent's first turn is about **27.5k–29.9k tokens**. When six were launched in parallel, five read about 18.7k from the first one's cache.

Confidence note: the cache behavior is documented; the sizes are our local measurement (single-source).

## [TOK-007] Context window sizes and auto-compact thresholds
- Type: fact
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Model config: extended context, auto-compact](https://code.claude.com/docs/en/model-config), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- Related: TOK-032, TOK-008

Window sizes:
- 1M by default (no `[1m]` suffix): Fable 5.1/5, Sonnet 5+, Haiku 5.5, Opus 4.7+.
- Opus 4.6 and Sonnet 4.6 need `[1m]`, which needs plan access or usage credits.
- `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` holds sessions at 200K.

Auto-compact thresholds:
- Native-1M models compact at **about 967K** (moved from about 934K in v2.1.247).
- 4.6 models without `[1m]` compact at 200K.

On the API, 4.6+ models bill 1M context at standard per-token rates: "A 900k-token request is billed at the same per-token rate as a 9k-token request." The exception is Haiku 5.5, which costs more above 100K. The old 2x surcharge above 200K no longer applies to current models.

A large window removes the automatic brake on session length, so cost per turn keeps growing (TOK-008). Community "33K autocompact buffer" figures apply to old 200K defaults; on 1M models, 1M − 967K matches. Unverified for 200K windows.

## [TOK-008] Cost grows with context length on every turn
- Type: fact
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Costs: why usage climbs in a long session](https://code.claude.com/docs/en/costs), local transcripts
- Related: TOK-009, TOK-030, TOK-032

Claude Code re-sends the full conversation with every request; the cached part is billed at cache-read rates. A 300-turn session at 300k context reads about 90M tokens. Performance also degrades as context fills ([Best practices](https://code.claude.com/docs/en/best-practices); the API's [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows) page calls it "context rot").

Our 2026-10-07 to 2026-10-12, 6 days (list-price equivalent at Opus 5.5 rates). Correction 2026-10-12: this was first labelled "30 days", but the transcripts only start on 2026-10-06; shares are unaffected, totals are for 6 days. Re-measure with the `token-audit` skill (FreekMencke/claude-skills `local-skills/skills/token-audit/`), whose baseline for 2026-10-07 to 10-11 is 186 USD a day, 0.059 USD per API message, subagents 13% of cost.

| Bucket of context size per turn | Share of turns | Share of input tokens |
|---|---|---|
| <100k | 41% | 16% |
| 100–200k | 34% | 30% |
| 200–400k | 19% | 32% |
| >400k | 7% | 22% |

Other figures:
- Peak context per session: p50 101k, p90 308k, max 759k.
- 68 of 209 sessions passed 150k.
- Only 3 compactions in 6 days: on a 1M window, auto-compact almost never fires.
- Cost split: cache reads 52%, cache writes 31%, output 17%, uncached input about 0%. That is roughly $1,089 list-price equivalent over the 6 days, about $180 a day. On a subscription this is plan usage, not billing.

Confidence note: the mechanism is documented; the table is our local 6-day measurement (single-source).

## [TOK-009] A token entering context costs about as much as an output token
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: local transcripts; [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Related: TOK-008, TOK-042, TOK-043

Over our 6 days (2026-10-07 to 2026-10-12, TOK-008), 2.83B cache-read tokens against 48.6M cache-write tokens means each token written to context was re-read about **58 times** on average.

At Opus 5.5 subscription rates, a token that enters the main context costs:
- one 1-hour cache write ($8/MTok), plus
- about 58 reads ($0.20 each per MTok, so about $11.60),

which totals about **$19.60/MTok**. That's the same as the output price ($20). With an API key (5-minute writes at $5) it's about $16.60/MTok.

The practical upshot: a 5k-token `git diff` or screenshot read early in a long session costs about as much as Claude writing 5k tokens. Trimming tool output pays off more the earlier in a session it happens. Moving verbose work into a subagent caps the multiplier at the subagent's own, usually short, lifetime.

Confidence note: derived from our local 6-day measurement and list prices.

## [TOK-010] `/usage`, `/context` and other built-in meters
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Commands](https://code.claude.com/docs/en/commands), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-011, TOK-013, TOK-112

`/usage` shows session cost, plan usage limits and activity stats. `/cost` and `/stats` are aliases.
- **Session block:** API-style tokens and USD at list price, computed locally. It resets on `/clear` (v2.1.211+). "For authoritative billing see the Usage page in the Claude Console."
- **Plan breakdown (Pro/Max/Team/Enterprise):**
  - Attributes usage to skills, subagents, plugins and individual MCP servers.
  - Flags behaviors such as long context or cache misses when they account for 10% or more.
  - Lists the heaviest `/loop` tasks. Press `d` or `w` for 24h or 7 days.
  - It reads local history only, so other devices and claude.ai are excluded.
- **Prompt cache (main)** line (v2.1.251+): hit share, misses, expected rebuilds, warm or cold with TTL, and likely cause (v2.1.260+). It covers the main conversation only.

Other meters:
- `/context [all]` draws a coloured grid by category, with suggestions for heavy tools and memory bloat.
- `/insights` writes an HTML usage-pattern report. It costs plan tokens.
- The spinner shows live output tokens for the current turn.

Help-center articles still mention `/status` for remaining allocation. In current Claude Code, `/status` is version, model and account; the plan bars are in `/usage`.

2.1.299 "Added `/usage` warnings for max effort, workflows, always-on context and large tool results"; their wording isn't on a docs page (2026-10-16). Requests sent without a prompt: TOK-112.

## [TOK-011] Status line JSON fields for live monitoring
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Status line](https://code.claude.com/docs/en/statusline)
- Related: TOK-082, TOK-032

The `statusLine` command gets JSON on stdin. Configure it with `{"statusLine": {"type": "command", "command": "~/.claude/statusline.sh"}}`, plus an optional `refreshInterval` in seconds. Useful fields:

| Field | What it holds |
|---|---|
| `context_window.used_percentage` | Input + cache tokens only, not output |
| `context_window.remaining_percentage` | Remaining share of the window |
| `context_window.context_window_size` | 200000 or 1000000 |
| `context_window.current_usage` | Per-type split. Null before the first call and right after `/compact`. |
| `cost.total_cost_usd` | List-price estimate. Resets on `/clear`. |
| `rate_limits.five_hour` / `rate_limits.seven_day` | `used_percentage`, `resets_at`. Pro and Max only, after the first response. |
| `prompt_cache` (v2.1.251+) | `warm`, `ttl`, `expires_at`, `hit_ratio`, `misses`, `last_miss_cause` |

A minimal one-liner: `jq -r '"[\(.model.display_name)] \(.context_window.used_percentage // 0)% ctx · 5h \(.rate_limits.five_hour.used_percentage // "-")%"'`. This covers most of what community status lines offer (TOK-082).

With `CLAUDE_CODE_AUTO_COMPACT_WINDOW` set, `used_percentage` "always measures against the model's full context window, so once this variable is set, that percentage no longer indicates when compaction will run" (env-vars).

## [TOK-012] OpenTelemetry metrics for teams
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Monitoring usage](https://code.claude.com/docs/en/monitoring-usage), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-018

Turn it on with `CLAUDE_CODE_ENABLE_TELEMETRY=1`, then set `OTEL_METRICS_EXPORTER` (otlp, prometheus or console), `OTEL_LOGS_EXPORTER` and `OTEL_EXPORTER_OTLP_ENDPOINT`.

Metrics:
- `claude_code.token.usage`, with `type` = input, output, cacheRead or cacheCreation.
- `claude_code.cost.usage` (USD).
- Both are incremented per API request and tagged with `model`, `query_source` (main, subagent or auxiliary), `effort`, `agent.name`, `skill.name`, `plugin.name` and `mcp_server.name`. That makes it possible to see which skill or MCP server drives spend.

The `api_request` log event carries `cost_usd`. Prompt and response content logging is off by default.

The docs call OTel "the only option that streams per-user token and cost metrics into your own observability stack in near real time." It's the route for Bedrock, Vertex and Foundry, which the Analytics API doesn't cover. For one user it's overkill; use TOK-010, TOK-011 and TOK-013.

2.1.300 "Added `cache_creation_5m_tokens` and `cache_creation_1h_tokens` to the OpenTelemetry `api_request` event, splitting cache writes by lifetime"; monitoring-usage.md didn't list them on 2026-10-16.

## [TOK-013] Local transcripts as a usage data source
- Type: tool
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [.claude directory](https://code.claude.com/docs/en/claude-directory), local inspection
- Related: TOK-080, TOK-008, TOK-105

Where transcripts live:
- Main sessions: `~/.claude/projects/<project>/<session>.jsonl`.
- Subagents: `<session>/subagents/*.jsonl`.
- Large tool outputs spill to `<session>/tool-results/`.
- They are deleted after `cleanupPeriodDays` (default 30).

Assistant lines carry `message.usage`. The fields are not a documented contract:
- `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens`
- `cache_creation.ephemeral_1h_input_tokens` and `ephemeral_5m_input_tokens`
- `output_tokens_details.thinking_tokens`, `server_tool_use`, `speed`, `inference_geo`

Pitfall: one API message can appear on several lines (streamed chunks). **Deduplicate by `message.id` and keep the last line.** Summing every line inflates totals; a claim of about 2.87x inflation in claude-code#41346 is unverified. Taking the first line under-counts output.

All our local measurements in this file use last-line-per-id.

Second source: each session file also has `type: "cost-state"` lines with `modelUsage.<model>` (`inputTokens`, `outputTokens`, `cacheReadInputTokens`, `cacheCreationInputTokens`, `costUSD`, …). `costUSD` is exactly list price for its own token counts, but it counts about 10% more cache reads than the deduplicated `message.usage`, so transcript-based Opus cost comes out about 6% lower (median over 146 sessions, 2026-10-12). Use it as the closer total; `message.usage` for per-turn analysis.


A background subagent's notification names an `output_file`: a symlink to its transcript in `subagents/`, not its report (TOK-105).

Confidence note: the transcript location is documented (official-docs); the `usage` schema is observed locally and not a documented contract.

## [TOK-014] claude.ai plan limits: 5-hour and weekly windows
- Type: fact
- Applies to: Claude Code, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Usage and length limits](https://support.claude.com/en/articles/11647753), [Using Claude Code with Pro/Max](https://support.claude.com/en/articles/11145838), [Max plan](https://support.claude.com/en/articles/11049741), [Pro plan](https://support.claude.com/en/articles/8325606), [Team plan](https://support.claude.com/en/articles/9266767), [Fable usage](https://support.claude.com/en/articles/15424964), [Usage credits](https://support.claude.com/en/articles/12429409)
- Related: TOK-015, TOK-011

How the limits work:
- Two layers: "a session limit that resets every five hours" and a weekly limit "across all models".
- "Usage in claude.ai, Claude Code, and Claude Desktop counts toward the same limit."
- Session allowance relative to Pro: Max 5x and Max 20x get 5x and 20x; Team Standard seats 1.25x, Premium seats 6.25x. Limits are per member, not pooled.
- Exact token or message allowances aren't published.
- Fable is included on Max, Team premium and Enterprise premium seats, for up to 50% of weekly limits, and drains faster than other models. Pro and standard seats use usage credits.
- **Usage credits** (formerly "extra usage") are billed at standard API rates when you hit a limit. Manage them with `/usage-credits`.

The `ANTHROPIC_API_KEY` trap: if the variable is set, Claude Code bills the API instead of the plan.

Unverified: reported May 2026 limit doubling and peak-hour changes, and per-model weekly meters other than Fable.

## [TOK-015] What drains plan usage in claude.ai
- Type: recommendation
- Applies to: claude.ai
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Usage and length limits](https://support.claude.com/en/articles/11647753), [Usage limit best practices](https://support.claude.com/en/articles/9797557)
- Related: TOK-014, TOK-030

What increases usage: message length, attachment size, current conversation length, tool use (Research, web search, connectors), model choice, effort or extended thinking, artifacts, and multi-step agentic tasks.

How to reduce it:
- "Longer conversations that trigger automatic context management consume more of your usage limit. Try starting a new conversation if you're approaching your usage limit in a longer chat."
- Lower effort or turn off extended thinking when it isn't needed.
- Turn off unused connectors and web search.
- Keep project instructions short and prune project files. "Content in projects is cached and counts less against your limits when reused." "Caches expire after a period of inactivity."
- Batch related questions into one message instead of many short ones.

Check Settings → Usage for the 5-hour and weekly bars.

## [TOK-016] API usage fields and the token counting endpoint
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting), [Thinking cost](https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost), [Rate limits](https://platform.claude.com/docs/en/api/rate-limits)
- Related: TOK-017, TOK-050

Usage fields:
- Total input = `cache_read_input_tokens` + `cache_creation_input_tokens` + `input_tokens`. Here `input_tokens` is only the part after the last breakpoint.
- `output_tokens` is the billed total and includes thinking. `output_tokens_details.thinking_tokens` shows the thinking share. You pay for full thinking even when the display is summarized or omitted.

Rate limits: for most models only uncached input counts toward ITPM; `cache_read_input_tokens` doesn't. With 80% cache hits, a 2M ITPM limit handles about 10M input tokens per minute.

`POST /v1/messages/count_tokens`:
- Free, with its own RPM (5k/10k/20k by tier).
- It's an estimate and doesn't use caching.
- It rejects server tools, the MCP connector, and URL or file sources.

Claude 4.7+, Fable and Mythos use a tokenizer that produces **about 30% more tokens** for the same text, so recount before comparing models on price.

## [TOK-017] API prices and multipliers
- Type: fact
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Fast mode](https://platform.claude.com/docs/en/build-with-claude/fast-mode)
- Related: TOK-050, TOK-054, TOK-055

Prices per MTok:

| Model | Input | 5m write | 1h write | Cache read | Output |
|---|---|---|---|---|---|
| Fable 5.1 | $10 | $12.50 | $20 | $0.25 | $50 |
| Opus 5.5 | $4 | $5 | $8 | $0.20 | $20 |
| Opus 5 / 4.8–4.5 | $5 | $6.25 | $10 | $0.50 | $25 |
| Sonnet 5.5 | $2 | $2.50 | $4 | $0.10 | $10 |
| Sonnet 5 | $2 | $2.50 | $4 | $0.20 | $10 |
| Haiku 5.5 (≤100k prompt) | $0.10 | $0.125 | $0.20 | $0.01 | $0.50 |
| Haiku 5.5 (>100k) | $0.50 | $0.625 | $1 | $0.05 | $2.50 |

Multipliers:
- Cache writes cost 1.25x (5m) or 2x (1h) of input. Reads cost 0.1x, but 0.05x on Opus/Sonnet 5.5 and 0.025x on Fable/Mythos 5.1.
- Batch: −50%.
- US-only inference (`inference_geo: "us"`): 1.1x.
- Fast mode (Opus 5.5): $8/$40, so 2x.

All multipliers stack. Opus 5.5 is 2x Sonnet 5.5 per token; a model switch mid-session also costs a cache rebuild (TOK-053).

## [TOK-018] Admin Usage & Cost API and Claude Code Analytics API
- Type: tool
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Usage & Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api), [Claude Code Analytics API](https://platform.claude.com/docs/en/manage-claude/claude-code-analytics-api), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-012

Usage report, `GET /v1/organizations/usage_report/messages`:
- Buckets of 1m, 1h or 1d.
- Groups by model, workspace, API key, service tier, context window, geo and speed.
- Returns uncached input, cache read, cache write and output.
- Lags about 5 minutes.

Cost report, `GET /v1/organizations/cost_report`: daily, USD in cents.

Claude Code report, `GET /v1/organizations/usage_report/claude_code`:
- Per user per day: tokens and estimated cost per model.
- Covers the Claude API only, not Bedrock or Vertex. Lags up to 1 hour.

Access and console:
- All three need an Admin API credential (an Admin key, an `org:admin` OAuth token, or a key not scoped to a workspace) and aren't available to individual accounts. Claude Enterprise organizations use an Analytics API key and a different API.
- The Console has usage and cost pages, workspace spend limits and rate limits; Claude Code gets an auto-created workspace.
- The docs give per-user TPM recommendations, from 200–300k for 1–5 users down to 10–15k for 500+.

## [TOK-020] MCP tool search is on by default in Claude Code
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: scale with tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search), [Env vars](https://code.claude.com/docs/en/env-vars), [Changelog](https://code.claude.com/docs/en/changelog)
- Related: TOK-021, TOK-022, TOK-053

"Only tool names and server instructions load at session start, so adding more MCP servers has minimal impact on your context window." Claude loads a schema via the ToolSearch tool when needed.

`ENABLE_TOOL_SEARCH` values:

| Value | Behavior |
|---|---|
| unset | Defer all MCP tools. Falls back to upfront loading on a non-first-party `ANTHROPIC_BASE_URL`, Azure Foundry, and pre-4.5 Vertex models. |
| `true` | Defer, and always send the beta header |
| `auto` / `auto:N` | Load upfront while definitions are under 10% (or N%) of the window |
| `false` | Load everything upfront |

Other controls:
- Per server: `alwaysLoad: true` in `.mcp.json` exempts a server from deferral.
- As of v2.1.296 (2026-10-09) the default limit on MCP tool descriptions sent up front and on server instructions is 4,096 characters, up from 2,048 (`CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`). Descriptions loaded *through tool search* are cut at 16,384 (v2.1.295). The MCP and env-vars pages say both figures as of 2026-10-14. Since v2.1.299, descriptions and instructions from Anthropic's first-party MCP servers at `api.anthropic.com` reach Claude in full.
- Tested 2026-10-12, v2.1.296, -p (Haiku 5.5), a local stdio MCP server with one 10,000-character description: through ToolSearch the whole description arrived (all 100 position markers in the `deferred_tools_record`). With `ENABLE_TOOL_SEARCH=false` (loaded up front) it was cut after about 4,000 characters, ending `[04… [truncated]`. So 4,096 applies up front and the larger tool-search cap applies to deferred loads, as the docs now say.

History: v2.1.7 (Jan 2026) made `auto` at 10% the default, and later releases switched to defer-all. Blog posts that describe 10% auto as the default are outdated.

## [TOK-021] MCP overhead without deferral
- Type: fact
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use), [Tool search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool), [PolicyLayer GitHub MCP cost](https://policylayer.com/token-cost/github), [Unblocked MCP budget](https://getunblocked.com/blog/mcp-token-budget-autopsy/)
- Related: TOK-020, TOK-024

These figures apply when tool search is off.

Anthropic figures:
- Five servers (GitHub, Slack, Sentry, Grafana, Splunk), 58 tools: "approximately 55K tokens before the conversation even starts". Adding Jira (about 17K) pushes it past 100K.
- Anthropic saw up to 134K internally.
- Tool Search Tool: about 77K drops to about 8.7K. The post says 85%; the arithmetic gives about 89%.
- MCP-eval accuracy improved: Opus 4 from 49% to 74%, Opus 4.5 from 79.5% to 88.1%.
- Selection accuracy degrades past 30–50 tools.

Community per-server numbers, measured with a GPT tokenizer:
- GitHub MCP is about 14k tokens for 86 tools (PolicyLayer).
- Median server about 1.9k, p90 about 14k (PolicyLayer, 11,886 servers, read 2026-10-14; the figures move with each build).
- Others cite about 42k for GitHub MCP. Older versions vary.

Cheap places to defer:
- In Claude Code, deferral makes this mostly an API-builder concern.
- On the API, use tool search when you have 10+ tools or more than 10k tokens of definitions, and keep the 3–5 most-used tools non-deferred.
- `defer_loading` keeps definitions out of context and preserves the cache, but you still send them on every request.

Confidence note: the Anthropic figures are official; the per-server community numbers are single-source.

## [TOK-022] Prefer CLIs and scope MCP servers narrowly
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Costs](https://code.claude.com/docs/en/costs), [MCP: scopes](https://code.claude.com/docs/en/mcp), [Sub-agents](https://code.claude.com/docs/en/sub-agents)
- Related: TOK-020, TOK-071

Official: "Tools like gh, aws, gcloud, and sentry-cli are still more context-efficient than MCP servers because they don't add any per-tool listing." Disable unused servers with `/mcp`.

Even deferred, each server still costs its tool names plus its server instructions (up to 4,096 characters as of v2.1.296) on every turn.

Scopes:
- `local` (default): this project only, in `~/.claude.json`.
- `project`: `.mcp.json`, shared via git.
- `user`: all projects.

Ways to narrow:
- Use `claude mcp add --scope project` for servers one repo needs.
- Define a server inline in a subagent's `mcpServers`, and "the subagent gets the tools; the parent conversation doesn't."
- `--strict-mcp-config --mcp-config x.json` gives a minimal set for scripted runs.

With tool search active, toggling a server mid-session doesn't break the cache. With upfront loading, it does.

## [TOK-023] MCP output limits
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP](https://code.claude.com/docs/en/mcp), [Env vars](https://code.claude.com/docs/en/env-vars)
- Related: TOK-042

Limits:
- Warning above 10,000 tokens. Hard limit 25,000 tokens by default (`MAX_MCP_OUTPUT_TOKENS`).
- Text results over 50,000 characters are saved to a file in the session's `tool-results/` directory. Claude gets a path instead, unless the tool declares `_meta["anthropic/maxResultSizeChars"]` (ceiling 500,000).
- Error text over about 11k characters keeps the first and last 5k.

Raising `MAX_MCP_OUTPUT_TOKENS` is rarely the right fix. Prefer tools with filter parameters: the Flux MCP's `fields` JSONPath, Kubernetes `grep` and `since`, and Playwright `browser_snapshot` over screenshots. In our transcripts, Playwright MCP results averaged 195 tokens and Flux 998.

## [TOK-024] Code execution and programmatic tool calling (API)
- Type: pattern
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp), [Advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use), [Manage tool context](https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context)
- Related: TOK-021, SKILL-018

Intermediate tool results don't need to pass through the model:
- **Code execution with MCP** presents tools as files under `./servers/`. The agent writes code that calls them and filters results. One example workflow went "from 150,000 tokens to 2,000 tokens" (−98.7%), but that was the post's own example, not a benchmark.
- **Programmatic tool calling**: on complex research tasks, average tokens fell from 43,588 to 27,297 (−37%). In one budget example, about 200KB of raw data became about 1KB in context.

In Claude Code the equivalents are a skill script that processes data and prints a summary (TOK-063), and a subagent that returns only conclusions (TOK-035).

## [TOK-030] `/clear` between tasks
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Best practices](https://code.claude.com/docs/en/best-practices), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-008, TOK-031, TOK-070

Official guidance:
- "Use /clear to start fresh when switching to unrelated work. Stale context wastes tokens on every subsequent message."
- `/clear` itself "costs nothing". Run `/rename` first so `/resume` can find the session later.
- "If you've corrected Claude more than twice on the same issue in one session… run /clear and start fresh with a more specific prompt. A clean session with a better prompt almost always outperforms a long session with accumulated corrections."
- Named anti-patterns: the kitchen-sink session, correcting over and over, infinite exploration.
- The counterpoint: keep context when "deep in one complex problem and the history is valuable."

Instructions given only in conversation are lost on `/clear` and compaction. Put lasting ones in CLAUDE.md, or write a handoff note before clearing (see Recommendations, R3).

## [TOK-031] `/compact` with focus, and what survives compaction
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Context window](https://code.claude.com/docs/en/context-window), [Costs](https://code.claude.com/docs/en/costs), [Skills](https://code.claude.com/docs/en/skills), [Prompt caching](https://code.claude.com/docs/en/prompt-caching)
- Related: TOK-032, SKILL-006, MEM-003, TOK-114, TOK-116

Steering the summary:
- `/compact Focus on code samples and API usage` tells the summarizer what to keep.
- A `# Compact instructions` section in CLAUDE.md applies every time. It is advisory: the summarizer sees CLAUDE.md as context, and the heading itself made no difference in our test.

Tested 2026-10-12, v2.1.296, -p (Haiku 5.5), `claude -p --resume <id> "/compact"` (compaction works in `-p`), one run per cell: "When summarizing: start the summary with the exact line `MARKER: …`" was followed under both `# Compact instructions` and a neutral `# Notes` heading. The bare "Start with the exact line `MARKER: …`" was ignored under both. Write compact instructions that say they are for the summary; the heading alone doesn't scope them.

What survives (the docs' "After compaction" table):
- System prompt and output style still apply. Project-root CLAUDE.md, unscoped rules and auto memory are "re-injected from disk", as is a plan-mode plan; git status is read fresh.
- Nested CLAUDE.md files and `paths:` rules are not re-injected: they reload on demand when a matching file is touched (MEM-003).
- Up to 5 recently modified files are re-read. A file over 5,000 tokens comes back as a path only.
- Invoked skills are re-attached: the first 5,000 tokens each, 25,000 total.
- The skill listing doesn't reload. Hook-added context is only summarized, and conversation-only instructions are lost unless the summary keeps them.

Cost: compaction is itself a request over the whole history. While the cache is warm it reads the prefix at cache rates; after a break past the TTL it reprocesses everything uncached. So compact at a natural break, not mid-task. Hooks: `PreCompact` (exit 2 blocks), `PostCompact`, and `SessionStart` with matcher `compact` to re-inject context.

## [TOK-032] Tuning auto-compact
- Type: recommendation
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [Model config: set the auto-compact window](https://code.claude.com/docs/en/model-config), [Env vars](https://code.claude.com/docs/en/env-vars)
- Related: TOK-007, TOK-008, TOK-031, TOK-116

Knobs:
- `/autocompact 400k` is saved per model (v2.1.288+). `/autocompact auto` restores the default.
- `autoCompactWindow` setting or `--autocompact` flag.
- `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000`: plain integer, range 100k–1M, overrides the others.
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50`: can only compact earlier; also applies to subagents.
- `DISABLE_AUTO_COMPACT=1` keeps manual `/compact`. `DISABLE_COMPACT=1` disables both.
- Subagent frontmatter `autoCompactWindow` (v2.1.296).
- Raising `CLAUDE_CODE_MAX_OUTPUT_TOKENS` shrinks the effective window.

Simulation on our 6 days (2026-10-07 to 2026-10-12; first labelled "30 days", corrected 2026-10-12). It replays each session's per-turn context growth and resets to 60k at the window; it ignores the cost of the compaction request and any quality loss:

| Window | Input tokens vs. 967K default | Compactions in the 6 days (about 5× that a month) |
|---|---|---|
| 500K | −16% | 12 |
| 300K | −30% | 31 |
| 200K | −42% | 82 |

A lower window trades lossy summaries for cost. Pair it with compact instructions (TOK-031) and a handoff habit (R3). At 400K, measured over 31 compactions, the loss was small (TOK-116).


`CLAUDE_CODE_MAX_OUTPUT_TOKENS` has no single default: "Defaults and caps vary by model", and only "For a model ID Claude Code can't resolve to a model it knows, the default is 32000 and the cap is 128000". `CLAUDE_CODE_AUTO_COMPACT_WINDOW` takes a plain integer: "a value like `500k` reads as `500` and clamps to the 100K minimum"; `/autocompact` accepts `500k`. Since v2.1.198 the summarizer inherits the session's thinking settings (context-window docs).

Confidence note: the knobs are documented (official-docs); the savings come from our local simulation.

## [TOK-033] Rewind, partial summarize and `/btw`
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Checkpointing](https://code.claude.com/docs/en/checkpointing), [Interactive mode: /btw](https://code.claude.com/docs/en/interactive-mode#side-questions-with-btw), [Prompt caching](https://code.claude.com/docs/en/prompt-caching)
- Related: TOK-030, TOK-031

`/rewind`, or Esc Esc, offers:
- Restoring code and/or conversation to an earlier prompt.
- **"Summarize from here"**: condenses a detour such as a failed debugging path and keeps earlier context.
- **"Summarize up to here"**: condenses old context and keeps recent messages.
- Focus instructions are accepted, and originals stay in the transcript.

Rewinding truncates to an already-cached prefix, so it's cheaper than `/compact`. Checkpoints don't track Bash edits or subagent edits.

`/btw <question>` asks a side question that sees the conversation but isn't added to history, and has no tools. Use it for "what was that flag again?" questions that would otherwise sit in context forever.

## [TOK-034] Resuming and idle gaps
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Sessions: resume from a summary](https://code.claude.com/docs/en/sessions#resume-from-a-summary), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-052, TOK-086

"Your first message after a break longer than the cache lifetime misses the cache and reprocesses your full context." The lifetime is 1 hour on a subscription and 5 minutes on an API key.

`--resume` and `--continue` re-send the full history.

Tested 2026-10-12, v2.1.296, -p (Haiku 5.5), anthropics/claude-code#78720: a fresh `-p` run read 25,180 cached tokens and wrote about 13,460 (repeated identically on two more fresh runs). Of three `-p --resume` runs within minutes, two read the whole prior prefix (38,646 and 38,652 read, 112–128 written), including one after an untracked file changed `git status`, the issue's trigger. One resume wrote 11,120 tokens again (27,579 read), a partial miss we couldn't reproduce. The bug is not reliably present; expect an occasional rebuild.

On Pro and Max, for sessions idle more than about 1 hour and over 100k tokens, Claude Code offers "Resume from summary", which runs `/compact`.

Idle compaction (v2.1.290+, announced in the 2.1.299 CHANGELOG): in an interactive terminal session on the one-hour TTL, a conversation of 200K+ tokens (`CLAUDE_CODE_IDLE_COMPACT_MIN_TOKENS`, floor 100K) idle for about 54 minutes is compacted just before its cache expires, so the next message sends a summary instead of reprocessing the history. `"idleCompaction": false` or turning auto-compact off disables it. Sessions on the five-minute TTL don't get it ([settings reference: `idleCompaction`](https://code.claude.com/docs/en/settings-reference)).

Idle sessions can still spend: scheduled tasks, cross-session messages and goal check-ins each send the full context. Background helpers (titles, resume summaries) cost under $0.04 per session.

In our data, full rebuilds after the first turn (cache writes over 40k) were rare: 11 turns, 8% of main-session cache writes. Idle gaps are a minor cost driver for us; context length dominates (TOK-008).

Confidence note: the share of rebuilds is our local measurement (single-source).

## [TOK-035] Delegate verbose work to subagents
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Best practices](https://code.claude.com/docs/en/best-practices), [Sub-agents: isolate high-volume operations](https://code.claude.com/docs/en/sub-agents#isolate-high-volume-operations), [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Related: TOK-006, TOK-009, TOK-036, ORCH-020, ORCH-034, TOK-103

What the docs say:
- "Since context is your fundamental constraint, use subagents to keep research out of it."
- "The verbose output stays in the subagent's context while only the relevant summary returns."
- The docs' example: "Use a subagent to run the test suite and report only the failing tests with their error messages."
- Anthropic's context-engineering post says subagents typically return a "condensed, distilled summary (often 1,000-2,000 tokens)."

The trade-off: each subagent pays about 28k tokens of startup (TOK-006) and counts toward the same limits. A subagent pays off when it would otherwise pull more than that into a long-lived main context; with the re-read multiplier in TOK-009, the break-even is low.

Don't delegate when:
- the task needs back-and-forth or shares context across phases,
- it's a quick targeted change, or
- latency matters.

Ask for a specific return format with a word cap, to keep the summary small.

For a long result the lead will only slice or forward, have the subagent write it to a file and return the path (TOK-103).

## [TOK-036] Subagent model selection
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Sub-agents: choose a model](https://code.claude.com/docs/en/sub-agents), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-006, TOK-035, ORCH-003, ORCH-005, ORCH-030

Resolution order, `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` and built-in Explore's model: see ORCH-003 and ORCH-005 (merged there 2026-10-12). Tier per role: ORCH-030.

Official advice: "For simple subagent tasks, specify `model: haiku`". Sonnet handles most coding; reserve Opus for hard reasoning. A switch to Opus also applies to subagents that inherit.

Our 6 days (2026-10-07 to 2026-10-12, TOK-008):
- 54 subagent runs on Opus cost about $115 list-equivalent (about $2.13 per run).
- 206 runs on Sonnet cost about $26 (about $0.13 per run).
- The tasks differ, so this is not like-for-like.
- Subagents were 19% of total cost.

Confidence note: the official advice is documented; our numbers are local measurement (single-source).

## [TOK-037] Multi-agent and agent teams multiply tokens
- Type: fact
- Applies to: Claude Code, general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), [Costs: agent teams](https://code.claude.com/docs/en/costs)
- Related: ORCH-020, ORCH-025, ORCH-010

Merged into ORCH-020 (kb-orchestration.md) on 2026-10-12. Token multipliers are in ORCH-020, scaling rules in ORCH-025 and agent-team cost in ORCH-010.

## [TOK-038] API context management: compaction, context editing, memory tool
- Type: tool
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Compaction](https://platform.claude.com/docs/en/build-with-claude/compaction), [Compaction threshold](https://platform.claude.com/docs/en/build-with-claude/compaction-threshold), [Context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing), [Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool), [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- Related: TOK-050, TOK-055, TOK-114, TOK-115

**Server-side compaction (beta):**
- On demand: header `compact-2026-09-04`, top-level `compaction` param. This is the recommended mode.
- At a threshold: header `compact-2026-01-12`. Default trigger 150k input tokens, minimum 50k.
- It's an extra sampling step; sum `usage.iterations`.
- Put `cache_control` at the end of the system prompt so only the summary is re-written.

**Context editing** (`context-management-2025-06-27`):
- `clear_tool_uses_20250919`: trigger 100k, keeps the last 3 tool uses.
- `clear_thinking_20251015`: must be listed first.
- Clearing invalidates the cache from the edit point forward, so set `clear_at_least` to make each clear worthwhile.

**Memory tool** (`memory_20250818`): a client-side `/memories` directory that keeps state across resets.

**Thinking:** on current models (Opus 4.5+, Sonnet 4.6+, Haiku 5.5, Fable), earlier thinking blocks are kept and billed as input. Use thinking clearing in long loops.

On-demand compaction (beta `compact-2026-09-04`): "You can't combine `compaction` with `context_management` on one request"; a non-blank `instructions` string, "up to 16,384 characters", replaces the summary prompt; sum `usage.iterations` to count its cost. Task budgets: TOK-115.

## [TOK-040] Read tool limits and partial reads
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Tools reference: Read](https://code.claude.com/docs/en/tools-reference#read-tool-behavior), [Skill best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- Related: TOK-041, TOK-062, TOK-106

Limits:
- Read returns up to 25,000 tokens per call (`CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS`).
- It refuses whole files over 256 KB. Claude then pages with `offset` and `limit`, and gets a "PARTIAL view" notice when cut.
- v2.1.296 adds `allow_large: true`, sized against remaining context.
- PDFs over 10 pages need `pages` (max 20 per call). Images are resized.
- The "2,000 lines" limit from old tool descriptions isn't in current docs.

Habits:
- Grep for the symbol, then Read with `offset`/`limit` around the hit.
- For reference docs, put a table of contents at the top so a partial read shows scope.

Our 6 days (2026-10-07 to 2026-10-12): 428 text reads, median about 700 tokens, p90 about 6.4k. 171 (40%) already used offset/limit, and only 16 were over 10k. Text file reads aren't our problem; images and Bash output are (TOK-042, TOK-043).

CHANGELOG: 2.1.86 "deduplicates unchanged re-reads"; Read "cannot split one long line" (2.1.287), so write files Claude will page as lines, not one blob (TOK-106).

## [TOK-041] Search before reading; code intelligence
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Tools reference](https://code.claude.com/docs/en/tools-reference), [Costs](https://code.claude.com/docs/en/costs), [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Related: TOK-040, TOK-084

Context engineering favours "just-in-time" retrieval: keep lightweight identifiers (paths, queries) and load content on demand.

Search tools:
- On Linux, macOS and WSL, Claude Code searches through embedded `ugrep`/`bfs` via Bash; dedicated Grep and Glob tools are on by default only on Windows.
- Grep supports `head_limit`/`offset` and skips gitignored files.
- Glob returns at most 100 files, newest first, and doesn't respect `.gitignore` by default.

The costs page recommends code-intelligence (LSP) plugins: "go to definition" replaces "a grep followed by reading multiple candidate files." Specific prompts help too: "add input validation to the login function in auth.ts" instead of "improve this codebase", which triggers broad scanning.

A "codebase-overview" skill (official suggestion) or a small repo map (TOK-085) avoids re-exploring the same repo every session.

## [TOK-042] Bash output limits and output-filtering hooks
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Tools reference: output limits](https://code.claude.com/docs/en/tools-reference#output-limits), [Costs: offload processing to hooks](https://code.claude.com/docs/en/costs), [Hooks](https://code.claude.com/docs/en/hooks)
- Related: TOK-009, TOK-083, TOK-023, TOK-108, TOK-109

Limits:
- Successful output is inline up to about 30,000 characters. The `bashOutputMaxChars` setting (4,000–128,000, v2.1.261+) raises that ceiling and makes Claude Code ignore `BASH_MAX_OUTPUT_LENGTH`, which (default 30,000, max 150,000) only widens the read-back window. Beyond the inline ceiling Claude gets a file path plus a 2k preview.
- Failing commands: "Inline up to roughly 10,000 characters; past that, a head-and-tail excerpt of that size cut from the read-back window, with no file path" (TOK-108).

Official hook pattern: a `PreToolUse` hook on Bash rewrites `npm test` and `pytest` via `updatedInput` to `… 2>&1 | grep -A 5 -E '(FAIL|ERROR|error:)' | head -100`. The docs say this cuts a 10,000-line log "from tens of thousands of tokens to hundreds". `PostToolUse` can replace output with `updatedToolOutput`.

**The example hides failures**: `pipefail` is off in the Bash tool, so the pipeline exits with `head`'s status and a failing run exits 0; a crash line such as `TypeError: …` matches none of the patterns. Capture the status first: `out=$(cmd 2>&1); rc=$?; printf '%s\n' "$out" | grep … | head -100; exit $rc` (tested in TOK-108).

Our 6 days (2026-10-07 to 2026-10-12, TOK-008):
- Bash output was about 6.9M tokens over 13,350 calls (average about 520).
- Outputs over 3k tokens were 3.5% of calls but 32% of the volume.
- The top sources were `git diff` (72 large calls), `gh issue/pr view`, `git fetch`, and `sed -n`/`cat` reads, not test runs.

Habits beat hooks here:
- `git diff --stat` first, then a path-limited diff.
- `gh … --json <fields>`.
- `rg -n` before `sed -n`.

Confidence note: the limits and hook pattern are documented; the 6-day numbers are our local measurement (single-source).

## [TOK-043] Pastes, images and PDFs
- Type: fact
- Applies to: Claude Code, Claude API, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Terminal config: paste large content](https://code.claude.com/docs/en/terminal-config#paste-large-content), [Vision](https://platform.claude.com/docs/en/build-with-claude/vision), [PDF support](https://platform.claude.com/docs/en/build-with-claude/pdf-support)
- Related: TOK-009, TOK-040

**Pastes:** pastes over 800 characters or more than three lines collapse to `[Pasted text #N]`, but the full text is still sent. "Write the content to a file and ask Claude to read it instead of pasting." Piping works too: `cat log | claude -p "…"`.

**Images:** cost is ⌈w/28⌉ × ⌈h/28⌉ tokens. The old w×h/750 rule is outdated.
- Standard tier caps at 1,568 px long edge and 1,568 tokens. High-res (4.7+) caps at 2,576 px and 4,784 tokens, "up to roughly three times more".
- Examples: 1000×1000 is 1,296 tokens; 1920×1080 is 1,560 standard or 2,691 high-res.
- Downsample or crop before sending.
- In Claude Code, the oldest images are dropped in batches, which breaks the cache (TOK-053).

**PDFs:** 1,500–3,000 tokens per page of text ("depending on content density"), plus image cost per page. Use the Files API (`file_id`) rather than re-sending base64.

We had 995 image reads in 6 days (2026-10-07 to 2026-10-12), mostly UI screenshots. At 1.5–4.8k tokens each, that's roughly 1.5–4.8M tokens entering context, each re-read many times (TOK-009).

Confidence note: the paste, image and PDF rules are documented; our counts are local measurement (single-source).

## [TOK-044] Blocking reads of large or irrelevant files
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Permissions: read and edit](https://code.claude.com/docs/en/permissions#read-and-edit)
- Related: TOK-040, TOK-071

"If your project has a `.claudeignore` file, it has no effect, so move its entries into `Read` deny rules." Example: `"permissions": {"deny": ["Read(./dist/**)", "Read(./**/*.min.js)", "Read(./coverage/**)"]}`.

Limits of deny rules:
- They apply "best-effort" to Grep, Glob and `@file`.
- They don't stop commands that read files without naming them, such as `grep -r pattern .`. The sandbox gives OS-level enforcement.
- They are mainly a guard against accidental reads of build output, lockfiles and generated code. They don't make search results smaller.

## [TOK-050] Prompt caching on the API: mechanics
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Related: TOK-017, TOK-051, TOK-054

Basics:
- The prefix order is `tools` → `system` → `messages`. A hit needs "100% identical prompt segments".
- Up to 4 breakpoints. Each looks back at most 20 block positions; a conversation that grows 20+ blocks past the last write misses.
- TTL is 5 minutes by default, refreshed free on each hit. Set `"ttl": "1h"` for gaps between 5 minutes and 1 hour.
- Pay-off: after 1 read for 5m writes (1.25x), after 2 reads for 1h writes (2x).

Minimum cacheable length varies by model:
- 512 tokens: Opus 5.5, Opus 5, Sonnet 5.5, Haiku 5.5, Fable 5/5.1, Mythos 5/5.1.
- 1,024: Sonnet 5, Sonnet 4.6, Opus 4.8.
- 2,048: Opus 4.7.
- 4,096: Opus 4.5/4.6, Haiku 4.5.
- Below the minimum, nothing is cached and no error is returned.

What invalidates:
- Tool definitions invalidate everything.
- Web search, citations or speed toggles invalidate system and messages.
- `tool_choice` and images invalidate messages.

Pitfall: non-deterministic JSON key order in `tool_use` input (Go, Swift) silently breaks hits. Caches are per workspace on the Claude API.

## [TOK-051] Automatic caching and cache diagnostics
- Type: tool
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Cache diagnostics](https://platform.claude.com/docs/en/build-with-claude/cache-diagnostics), [Cookbook: prompt caching](https://github.com/anthropics/claude-cookbooks/blob/main/misc/prompt_caching.ipynb), [Cookbook: speculative prompt caching](https://github.com/anthropics/claude-cookbooks/blob/main/misc/speculative_prompt_caching.ipynb)
- Related: TOK-050

**Automatic caching:**
- Add a top-level `"cache_control": {"type": "ephemeral"}`. The breakpoint goes on the last cacheable block and moves forward as the conversation grows.
- "Start with automatic caching for multi-turn conversations."
- It uses one of the 4 breakpoint slots. It isn't on legacy Bedrock.

**Cache diagnostics** (GA, Claude API only):
- Pass `"diagnostics": {"previous_message_id": "<id>"}`, or `null` on the first turn.
- The response gives `cache_miss_reason`: `model_changed`, `system_changed`, `tools_changed`, `messages_changed` and others, with `cache_missed_input_tokens`.
- Use it when hit rates drop instead of guessing.

**Pre-warming:** a `max_tokens: 0` request with a breakpoint writes the cache and returns no content. It's not allowed in batches. The speculative prompt caching cookbook warms the cache while the user is still typing.

## [TOK-052] Prompt caching in Claude Code: TTLs and settings
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Prompt caching (Claude Code)](https://code.claude.com/docs/en/prompt-caching), [Costs](https://code.claude.com/docs/en/costs), [Lessons from building Claude Code: prompt caching is everything](https://claude.dev/blog/lessons-from-building-claude-code-prompt-caching-is-everything/)
- Related: TOK-053, TOK-034, TOK-006, ORCH-040

Claude Code caches automatically. Default TTLs:

| Request | Subscription, within plan | API key, cloud provider, or usage credits |
|---|---|---|
| Main conversation | 1 hour | 5 minutes |
| Subagents, teammates, forks, compaction | 5 minutes | 5 minutes |

Settings:
- `promptCacheTtl` / `CLAUDE_CODE_PROMPT_CACHE_TTL` for the main conversation, and `subagentPromptCacheTtl` / `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL` for the rest. Each takes `5m` or `1h` (v2.1.242+).
- `FORCE_PROMPT_CACHING_5M=1` and `ENABLE_PROMPT_CACHING_1H=1`.
- `DISABLE_PROMPT_CACHING` and its per-model variants; leave caching on for normal use.
- A subagent's `experimental.cacheTtl` frontmatter (v2.1.248+) sets the TTL for its requests.
- Idle compaction (v2.1.290+) compacts a 200K+ token terminal conversation idle for about 54 minutes before its one-hour cache expires (TOK-034).

Scope: the cache is "effectively scoped to one machine and directory". Parallel sessions in one directory share it.

Verify with `claude -p "hi" --output-format json` and look at `usage.cache_creation`. The Claude Code team alerts on cache hit rate and declares an incident if it's too low ("prompt caching is everything").

## [TOK-053] What invalidates the Claude Code cache
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Prompt caching (Claude Code)](https://code.claude.com/docs/en/prompt-caching)
- Related: TOK-052, TOK-020, TOK-070

**Breaks the cache:**
- `/model` switches: each model has its own cache. `opusplan` toggles and skills with a different `model:` count too.
- Effort changes on older models. On Opus, Sonnet and Haiku 5.5 and Fable 5.1, effort changes are cache-safe with an API key or subscription, but not on Bedrock, Google Cloud's Agent Platform or a Claude apps gateway, with `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS` set, or under a HIPAA configuration. Automatic model fallback is also a model switch.
- Turning on fast mode.
- MCP connects or disconnects and tool denies, only when tool search is off.
- `/compact` (the conversation layer).
- Accumulated images being dropped.
- **Upgrading Claude Code.**

**Keeps the cache:**
- Editing repo files.
- Editing CLAUDE.md (but "the new content loads on the next `/clear`, `/compact`, or restart").
- Permission mode and output style changes (v2.1.251+).
- Invoking skills and commands, `/rewind`, `/recap`, spawning subagents.
- Plugin skills and hooks.

Rule of thumb: pick model and effort at the start of a session, not in the middle.

## [TOK-054] Message Batches API
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing), [Rate limits](https://platform.claude.com/docs/en/api/rate-limits), [Cookbook: batch processing](https://github.com/anthropics/claude-cookbooks/blob/main/misc/batch_processing.ipynb)
- Related: TOK-017, TOK-050

Pricing and limits:
- "All usage is charged at 50% of the standard API prices." For example, Opus 5.5 is $2/$10 and Sonnet 5.5 is $1/$5.
- A batch holds up to 100,000 requests or 256 MB.
- "Most batches complete within 1 hour". Batches expire after 24 hours, and expired requests aren't billed.
- Results are kept for 29 days from creation.

**With caching:** the discounts stack, but hits are best-effort because requests run concurrently. Typical hit rates are 30–98%. Use identical `cache_control` blocks and consider the 1h TTL.

Rejected in a batch: `stream: true`, `speed` (fast mode) and `max_tokens: 0`. Server tools and their server-side loop do work in batches (a `pause_turn` is continued in a follow-up request); a client-side tool loop needs a new batch per round.

Good fits: evals, bulk classification or extraction, nightly jobs, re-verifying this KB's sources. Not for interactive work. The docs also suggest batch for thinking budgets above 32k, to avoid timeouts.

## [TOK-055] Effort and thinking as cost levers
- Type: fact
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Effort](https://platform.claude.com/docs/en/build-with-claude/effort), [Thinking cost](https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost), [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-017, TOK-053, ORCH-028, TOK-115

**Effort** (`output_config.effort`):
- Levels: low, medium, high, xhigh, max. It affects all output tokens: text, tool calls and thinking.
- Defaults: "high" on most models, **medium on Opus 5.5 and Haiku 5.5** (API). In Claude Code, Opus 5.5, Sonnet 5.5 and Haiku 5.5 default to `medium` and Opus 4.7 to `xhigh`.
- "low" suits simple tasks "such as subagents". "max adds significant cost for relatively small quality gains."
- Per-message effort (beta `mid-conversation-output-config-2026-07-01`) changes effort without breaking the cache.

**Thinking:**
- Billed as output, in full, even when summarized.
- Manual `budget_tokens` is deprecated on 4.6 and rejected on 4.7+. Use adaptive thinking plus effort instead.
- In Claude Code, thinking can't be turned off on Opus, Sonnet and Haiku 5.5 or Fable. Use `/effort` instead; `MAX_THINKING_TOKENS` applies only to fixed-budget models.
- On current models, earlier-turn thinking stays in context as input (TOK-038).

In Claude Code, "You can't turn thinking off on Opus 5.5, Sonnet 5.5, Haiku 5.5, or the Fable models", and "You are charged for all thinking tokens generated, even when collapsed or redacted." The API goes lower: `between_tools` on Sonnet 5.5 and `disabled` on Haiku 5.5, both only at `high` effort or below.

## [TOK-056] Order of cost levers (official cookbook)
- Type: recommendation
- Applies to: Claude API
- Confidence: official-example
- Last verified: 2026-10-14
- Sources: [Cookbook: cost optimization](https://github.com/anthropics/claude-cookbooks/blob/main/cost_optimization/cost_optimization.ipynb)
- Related: TOK-050, TOK-054, TOK-055, TOK-021

The Applied AI team's checklist, in order:
1. An eval baseline.
2. Prompt caching.
3. Input token management.
4. Agent-loop efficiency.
5. Output token management.
6. Batch API.
7. Model and effort.

Why model choice comes last: "Notice how model selection sits near the bottom. It's the easiest lever to pull but directly constrains the intelligence of your product."

Worked example (a claims-adjuster agent, single run, the notebook warns of nondeterminism):
- The baseline, Opus at high effort with no caching, cost about $0.29 per task.
- The cheapest config that still scored 10/10 was Sonnet at medium effort with automatic caching.
- "Explicit system breakpoints roughly halves cost per task".
- Batch ran at about half the interactive cost.
- Haiku passed 55%.

Tool-search rule of thumb: "once your schemas run past ~10K tokens… tool search often pays for itself."

## [TOK-060] Skill progressive disclosure
- Type: fact
- Applies to: Claude Code, Claude API, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview), [Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- Related: SKILL-004

Merged into SKILL-004 (kb-skills.md) on 2026-10-12. Read that entry for the three loading levels and their cost.

## [TOK-061] Writing skill descriptions
- Type: recommendation
- Applies to: Claude Code, general
- Confidence: community-consensus
- Last verified: 2026-10-14
- Sources: [Skill best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [anthropics/skills skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator), [obra/superpowers writing-skills](https://github.com/obra/superpowers), [Vercel: AGENTS.md vs skills](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)
- Related: TOK-005, TOK-064, SKILL-011, SKILL-012, SKILL-013

Limits and content rules (what + when, third person, negative triggers, no workflow summary): see SKILL-003, SKILL-011, SKILL-012 and SKILL-013 (merged there 2026-10-12). This entry keeps the cost side.

The tension:
- Anthropic's skill-creator says make descriptions "a little bit 'pushy'" because Claude tends to undertrigger. Its docx, xlsx and pptx descriptions are about 730–950 characters.
- Every character is paid on every turn, and an overflowing listing drops descriptions.

Vercel's eval found a skill wasn't invoked in 56% of cases, and a compact AGENTS.md index scored 100%. So knowledge that is always needed belongs in passive context, not a skill.

Our default: about 150–400 characters, triggers first, and `claude plugin eval` with a `tool_used: Skill` grader to check triggering after edits.

Confidence note: the per-turn cost is documented (official-docs); the length guidance is community practice, and Vercel's eval is single-source.

## [TOK-062] SKILL.md size and reference files
- Type: recommendation
- Applies to: Claude Code, general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Skill best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Skills (Claude Code)](https://code.claude.com/docs/en/skills), [anthropics/skills](https://github.com/anthropics/skills)
- Related: SKILL-004, SKILL-006, SKILL-016, SKILL-017

Size and structure rules (under 500 lines, references one level deep, a TOC over 100 lines, descriptive names, conditional pointers, "Claude is already very smart"): see SKILL-016 and SKILL-017 (merged there 2026-10-12). This entry keeps the measured sizes.

Official skill sizes (SKILL.md lines): xlsx 99, docx 91, pdf 314 plus 8 scripts, skill-creator 485. claude-api is 616 lines and 105 KB, breaking its own guidance, but it loads only the detected language's directory.

Community: one superpowers proposal (#832) cut 14 skills from 3,150 to 977 lines (−69%) by removing what "Claude would do anyway".

Built-in prompts shrank too: the `claude-api` skill "from ~200k+ tokens to ~25k" (2.1.234), and the Workflow tool's description to "about 1k tokens instead of 5.7k" (2.1.248).

## [TOK-063] Scripts and dynamic injection instead of prose
- Type: pattern
- Applies to: Claude Code, general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Skill best practices: utility scripts](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Skills: dynamic context injection](https://code.claude.com/docs/en/skills), [Equipping agents](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- Related: SKILL-018, SKILL-008

Merged on 2026-10-12: scripts into SKILL-018 and `!` dynamic injection into SKILL-008 (both kb-skills.md). Read those entries.

## [TOK-064] Frontmatter that cuts skill cost
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Skills](https://code.claude.com/docs/en/skills), [Features overview](https://code.claude.com/docs/en/features-overview)
- Related: TOK-005, TOK-035, SKILL-006, SKILL-014

| Frontmatter | Effect on tokens |
|---|---|
| `disable-model-invocation: true` | "Description not in context". User-only skills "have zero cost until invoked". Best for side-effect workflows (deploy, release, handoff). |
| `paths: [globs]` | Auto-loads only when working with matching files |
| `context: fork` + `agent:` | Runs in a subagent. The body is its prompt, and only the result returns. Use it only for task skills, not guidelines. |
| `model:` | Overrides the model for that turn. This is a cache-breaking model switch. |
| `when_to_use` | Appended to the description and counts toward the 1,536-character cap |
| `user-invocable: false` | Hidden from `/`, but the description still costs context |

A subagent's `skills:` field preloads full bodies at spawn (max 32), so list only what that agent always needs.

## [TOK-065] CLAUDE.md vs rules vs skills vs hooks
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Features overview](https://code.claude.com/docs/en/features-overview), [Memory: rules](https://code.claude.com/docs/en/memory), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-003, TOK-064, SKILL-021, SKILL-022

| Put it in | When | Context cost |
|---|---|---|
| CLAUDE.md | "Always do X" rules that every session needs | Full, every request |
| `.claude/rules/*.md` with `paths:` | Language- or directory-specific guidance | Only after a matching file is touched |
| `.claude/rules/*.md` without `paths:` | Same as CLAUDE.md, just organized | Full, every request |
| Skill | Procedures, reference, `/name` workflows | Description every turn, body on use |
| User-only skill | Rare manual workflows | Zero until invoked |
| Hook | Must-happen automation, guardrails, output filtering | Zero unless it returns context |
| Subagent | Verbose or isolated work | Summary only |

Costs page: "If it contains detailed instructions for specific workflows (like PR reviews or database migrations), those tokens are present even when you're doing unrelated work." Move those into skills.

## [TOK-066] Invoked skills stay in context
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Skills: skill content lifecycle](https://code.claude.com/docs/en/skills)
- Related: SKILL-006

Merged into SKILL-006 (kb-skills.md) on 2026-10-12. Read that entry for how an invoked skill stays in context and what compaction keeps.

## [TOK-067] Plugin and subagent-definition overhead
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Plugins](https://code.claude.com/docs/en/plugins), [Plugins: measure](https://code.claude.com/docs/en/plugins/measure), [Sub-agents](https://code.claude.com/docs/en/sub-agents)
- Related: TOK-005, TOK-061

"An enabled plugin is part of every session… for each skill, agent, and command that Claude can invoke on its own, the name and description are in Claude's context on every turn." Full text loads only on use. Hooks cost nothing in context.

Measuring plugins:
- `claude plugin details <name>` prints the projected cost, e.g. "Always-on: ~146 tok" for 3 skills plus 1 agent.
- `/plugin` shows a "Context cost" for official-marketplace plugins, highlighted at 2,000+ tokens.
- To lower it, shorten descriptions, or split a large plugin so users install only what they need.

Subagent definitions: descriptions of custom subagents are always listed. Claude Code warns at startup when they exceed 15,000 tokens combined. "Move detail into each subagent's system prompt, which only loads when that subagent runs."

## [TOK-070] Anti-patterns: sessions and workflow
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Best practices](https://code.claude.com/docs/en/best-practices), [Costs](https://code.claude.com/docs/en/costs), [Prompt caching](https://code.claude.com/docs/en/prompt-caching)
- Related: TOK-030, TOK-032, TOK-035, TOK-053

| Anti-pattern | Instead | Entry |
|---|---|---|
| One session for many unrelated tasks (the "kitchen sink") | `/clear` per task, `/rename` + `/resume` | TOK-030 |
| Correcting the same mistake 3+ times | `/clear` and write a better prompt | TOK-030 |
| Running a 1M window to 400k+ for routine work | Lower `autoCompactWindow`, hand off | TOK-032 |
| Unscoped "investigate X" in the main context | Delegate to a subagent with a return-format cap | TOK-035 |
| Switching `/model` or effort mid-task | Choose at session start | TOK-053 |
| Resuming a big session after hours away | "Resume from summary" or start fresh; in the terminal, idle compaction (v2.1.290+, default on) already compacts a 200K+ token conversation after about 54 idle minutes | TOK-034 |
| Pasting large logs | Save to a file and Read or grep it | TOK-043 |
| Full `git diff` or `gh pr view` dumps | `--stat`, `--json <fields>`, path filters | TOK-042 |
| Raw test output | Filter hook or subagent | TOK-042 |
| Many full-resolution screenshots in the main context | Accessibility snapshot, crop or downscale, or a subagent | TOK-043 |
| Vague prompts ("improve this codebase") | Name the file and the function | TOK-041 |
| Plan mode for a diff you could describe in one sentence | Skip the plan (best practices) | FLOW-005 |
| Large agent teams on Opus | Small teams, Sonnet teammates | TOK-037 |

Confidence note: each row's detail and confidence is in the linked entry.

## [TOK-071] Anti-patterns: configuration
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Memory](https://code.claude.com/docs/en/memory), [Skills](https://code.claude.com/docs/en/skills), [Costs](https://code.claude.com/docs/en/costs), [Permissions](https://code.claude.com/docs/en/permissions)
- Related: TOK-003, TOK-005, TOK-022, TOK-036

| Anti-pattern | Instead | Entry |
|---|---|---|
| CLAUDE.md over 200 lines, or workflows in it | Skills and `paths:` rules | TOK-003, TOK-065 |
| Relying on `@imports` to "shrink" CLAUDE.md | Imports load at launch too | TOK-003 |
| Long, pushy descriptions on dozens of skills | Short and trigger-first; `name-only` for rare skills | TOK-005, TOK-061 |
| Side-effect skills Claude can auto-invoke | `disable-model-invocation: true` | TOK-064 |
| Huge SKILL.md, or nested references | Under 500 lines, one level deep, with a table of contents | TOK-062 |
| Prose instructions for deterministic steps | Scripts, `` !`cmd` `` injection | TOK-063 |
| MCP servers for things a CLI does | `gh`, `aws`, `kubectl` | TOK-022 |
| `ENABLE_TOOL_SEARCH=false` or a gateway that strips it | Keep deferral on | TOK-020 |
| Opus as the default for every subagent and Explore | Per-agent `model:` or `CLAUDE_CODE_SUBAGENT_MODEL` | TOK-036 |
| `.claudeignore` (has no effect) | `Read(...)` deny rules | TOK-044 |
| `ANTHROPIC_API_KEY` set on a subscription machine | Unset it; check with `/status` | TOK-014 |
| Bloated MEMORY.md | Index plus topic files | TOK-004 |

Confidence note: each row's detail and confidence is in the linked entry.

## [TOK-072] Anti-patterns: API apps
- Type: anti-pattern
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Batch](https://platform.claude.com/docs/en/build-with-claude/batch-processing), [Cookbook: cost optimization](https://github.com/anthropics/claude-cookbooks/blob/main/cost_optimization/cost_optimization.ipynb)
- Related: TOK-050, TOK-054, TOK-056

| Anti-pattern | Instead |
|---|---|
| No caching, or dynamic content (timestamps, IDs) early in the prompt | Static first, dynamic last, automatic caching |
| Breakpoint on a block that changes each request | Put it on the last stable block |
| Prompt under the model's minimum, assumed cached | Check `cache_creation_input_tokens` > 0 |
| Unstable JSON key order in tool inputs | Serialize deterministically |
| Changing tools, `tool_choice` or thinking mid-conversation | Changing tool definitions invalidates the whole cache; `tool_choice` and thinking changes invalidate message blocks. Keep them fixed; use per-message effort. The beta `inline-tools-2026-09-15` adds or changes a tool through a mid-conversation system message without invalidating the cache |
| All tools loaded upfront with 10+ tools | Tool search, `defer_loading` |
| Interactive calls for offline jobs | Batch API (−50%) |
| Comparing token counts across tokenizers | Recount per model (4.7+ is about 30% more) |
| Picking a cheaper model before caching and trimming | Follow the lever order in TOK-056 |
| Letting tool results and thinking grow unbounded | Context editing or compaction |

## [TOK-080] ccusage
- Type: tool
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-14
- Sources: [ccusage/ccusage](https://github.com/ccusage/ccusage), [ccusage guide](https://ccusage.com/guide/claude), [Blocks reports](https://ccusage.com/guide/blocks-reports), [Statusline](https://ccusage.com/guide/statusline)
- Related: TOK-013, TOK-082

About 19k stars, v20.0.30 (2026-10-11), actively maintained. It moved from `ryoppippi/ccusage`.

What it does:
- Reads `~/.claude/projects/*.jsonl` and also covers Codex, Gemini CLI and others.
- Reports by day, week, month and session at LiteLLM list prices.
- `ccusage blocks` shows 5-hour windows with burn rate and projection. Blocks are in UTC; add warnings with `-t max`.
- `ccusage statusline` (beta) reads the status line stdin.
- Run with `npx ccusage@latest`.
- The `--live` mode was removed in v18; older blog posts describing it are stale.

Limits:
- Local data only: other devices and claude.ai aren't covered.
- History is capped by the 30-day transcript cleanup.
- Costs are list-price estimates, not plan usage.
- It doesn't show why usage is high (context length, subagent model, tool output). For that, use `/usage` attribution or a custom analysis like ours (R6).

## [TOK-081] Claude-Code-Usage-Monitor
- Type: tool
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-14
- Sources: [Maciek-roboblog/Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor)
- Related: TOK-080, TOK-014

About 8.7k stars, v4.0.0 (2026-06-27). Slower moving than ccusage.

What it does:
- A live terminal UI (Rich) with burn-rate predictions, JSON and state-file output, and an opt-in local warehouse that keeps history past 30 days.
- Data comes from local JSONL, official `rate_limits` captured through its `--statusline` hook (preferred when fresh), or an experimental OAuth usage API (`--api`).
- Install with `uv tool install claude-monitor`.

Limits: Pro, Max5 and Max20 limits are local guesses. The "Custom" plan uses P90 of your own history. Weekly percentages need the status line data.

Now that the status line exposes official `rate_limits` (TOK-011), most of this tool's value is the forecast view.

## [TOK-082] Status line projects
- Type: tool
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-16
- Sources: [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud), [sirmalloc/ccstatusline](https://github.com/sirmalloc/ccstatusline), [Status line docs](https://code.claude.com/docs/en/statusline), [ykdojo check-context.sh](https://github.com/ykdojo/claude-code-tips/blob/577ac89252195d61283b334c4b9d292b52c82203/scripts/check-context.sh), [ECC suggest-compact.js](https://github.com/affaan-m/everything-claude-code/blob/76aaa77df6adc5b889e689007bf99b9a4f74af34/scripts/hooks/suggest-compact.js)
- Related: TOK-011, TOK-080

**claude-hud** (about 28.5k stars, v0.10.0 on 2026-10-01):
- A plugin status line: context use, rate limits, active tools and agents, todos, and optional cost and cache expiry.
- Reads stdin and the transcript. Per its README, no network calls.
- Install: `/plugin marketplace add jarrodwatts/claude-hud` → `/plugin install claude-hud` → `/claude-hud:setup`. Needs v2.1.260+.

**ccstatusline** (about 13.3k stars, v2.2.32 on 2026-10-09):
- A Powerline status line configured through a TUI: context length, %, bar, session cost, cost rate, session and weekly bars, per-model weekly usage, reset timers.
- Rate-limit widgets call Anthropic's usage API.
- Pin a global install, because `bunx @latest` adds about 430 ms per repaint.

Others: cc-statusline (stale since Feb 2026) and claudeline (uses an undocumented API).

Context-threshold hooks exist. ykdojo's `check-context.sh` is a Stop hook that "suggests /half-clone when context usage exceeds 85%" of a hard-coded `max_context=200000`, so on a 1M window it fires at 17%. ECC's `suggest-compact.js` is a PreToolUse reminder at "default 160k on a 200k window, 250k on 1M", repeated every 60k tokens of growth. Neither has a measured effect. ykdojo's `half-clone-conversation.sh` (with `--quarter`) copies the later half or quarter of a conversation into a new session. The status line's `used_percentage` is the practical monitor. A DIY script reading TOK-011's fields gives the same core data with no dependency.

## [TOK-083] Output-compression tools (RTK, context-mode)
- Type: tool
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-16
- Sources: [rtk-ai/rtk](https://github.com/rtk-ai/rtk), [mksglu/context-mode](https://github.com/mksglu/context-mode), [JetBrains: RTK tested](https://blog.jetbrains.com/ai/2026/07/rtk-claude-code-token-savings/), [Quesma: RTK cost benchmark](https://quesma.com/blog/does-rtk-make-ai-coding-cheaper/)
- Related: TOK-042, TOK-009, TOK-113

**RTK** (about 83k stars, v0.51.0 on 2026-10-02, created Jan 2026):
- A Rust proxy that compresses command output. A PreToolUse hook (`rtk init -g`) rewrites Bash calls, e.g. `git status` becomes `rtk git status`.
- Claims "60–90% on common dev commands" (pytest −90%, cargo build −80%).
- Its README's caveats: it measures Bash output only, estimates tokens as bytes/4, and doesn't touch Read or Grep. Full output is kept on failure.

**context-mode** (about 26.8k stars):
- A plugin that routes tool output through sandboxed MCP `ctx_*` tools, indexes it, and returns summaries, steered by hooks.
- Claims "315 KB → 5.4 KB, 98%" over 14 selected scenarios.
- License is ELv2, not OSI open source.

**RTK, measured independently:**
- JetBrains (2026-07-20; Claude Code 2.1.201, claude-sonnet-5, SkillsBench, 80 clean pairs): "+7.6% more expensive at low reasoning effort (p=0.004), ±0% at high effort", task quality unchanged. RTK's own `rtk gain` "reported 96.2 million tokens saved" while "the measured bill for the same trials went up."
- Quesma (2026-09-11; Terminal-Bench 2.1, 1,740 attempts): "With RTK, costs fell by 5% for Fable and rose by 5% for DeepSeek" on the total bill, but per task "Fable was 1% more expensive, with no clear difference from zero", and pass rates were slightly lower: "We do not recommend RTK as a generic cost-saving tool."

**context-mode** has no independent measurement (searched 2026-10-16). Both tools follow the official hook-filtering pattern (TOK-042); hold any savings claim to paired per-task cost (TOK-113). Try one only where Bash output really dominates. For us, large outputs were `git diff`/`gh` dumps, which habits fix (TOK-042).

Confidence note: the 60–90% and 98% figures are the vendors' own claims; the RTK measurements are independent and agree.

## [TOK-084] Code-index MCP servers (Serena, claude-context, code-review-graph)
- Type: tool
- Applies to: Claude Code
- Confidence: unverified
- Last verified: 2026-10-14
- Sources: [oraios/serena](https://github.com/oraios/serena), [zilliztech/claude-context](https://github.com/zilliztech/claude-context), [tirth8205/code-review-graph](https://github.com/tirth8205/code-review-graph)
- Related: TOK-041, TOK-085

**Serena** (about 30k stars):
- LSP symbol-level find and edit tools over MCP.
- Says it is "much more token-efficient" but gives no numbers.

**claude-context** (Zilliz, about 12.6k stars):
- Vector semantic search. Claims "~40% token reduction": its own evaluation (30 SWE-bench Verified instances, 3 runs, a retrieval task against a grep-only baseline: 73,373 to 44,449 tokens, −39.4%, same F1) is vendor-run, not an end-to-end task measurement.
- Needs Milvus or Zilliz Cloud plus an embedding API key.

**code-review-graph** (about 32k stars):
- Claims a median 63x reduction, but its README admits the baseline is the whole corpus ("an upper bound no real agent pays"). It is worse than a plain read for single-file edits.

All three add MCP tools and dependencies. The official alternative is an LSP code-intelligence plugin (TOK-041); we already run `typescript-lsp`. Don't adopt these for token savings without measuring on our own tasks.

Confidence note: the savings figures are the vendors' own claims.

## [TOK-085] Ideas from other coding agents
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Aider repo map](https://aider.chat/docs/repomap.html), [Aider commands](https://aider.chat/docs/usage/commands.html), [Cline auto-compact](https://docs.cline.bot/features/auto-compact), [Cline new_task (blog)](https://cline.bot/blog/unlocking-persistent-memory-how-clines-new_task-tool-eliminates-context-window-limitations), [Cline commands](https://docs.cline.bot/core-workflows/using-commands), [Gemini CLI commands](https://google-gemini.github.io/gemini-cli/docs/cli/commands.html), [Gemini CLI configuration](https://github.com/google-gemini/gemini-cli/blob/b25669d84e1a404e30c176d779e732e25dafcec0/docs/reference/configuration.md), [Codex config schema](https://github.com/openai/codex/blob/b5115cdd669d37a8635a9742851e97ba4fb1d42c/codex-rs/core/config.schema.json), [OpenCode config](https://github.com/anomalyco/opencode/blob/582c974ee362683f5dd5c7f9741cae207581c6b5/packages/web/src/content/docs/config.mdx)
- Related: TOK-041, TOK-030, TOK-032, TOK-114

**Aider repo map.** A token-budgeted map (default 1k tokens) of files and key symbol signatures, ranked by a dependency-graph algorithm. It transfers as a generated `docs/repo-map.md`, or a `codebase-overview` skill read on demand, instead of re-exploring each session. Aider's `/drop` frees context, the equivalent of rewind-summarize here.

**Cline.** Two ideas:
- A context progress bar. Cline's blog claims quality dips past about 50% (vendor claim).
- A `new_task` tool that ends the session and starts a new one preloaded with a summary, files and next steps (the blog; on 2026-10-14 the docs describe a `/newtask` command instead and no longer list the tool).

That handoff idea transfers directly as a user-invoked handoff skill plus `/clear` (R3).

Beyond `/compact` (checked 2026-10-16 in each tool's repo):
- **Gemini CLI** (`/compress`, `/stats`) truncates tool output past `truncateToolOutputThreshold` (default `40000` characters), compresses at `compressionThreshold` (default `0.5` of the window), can summarize shell output per tool, and has tool-output masking under `contextManagement` (schema category "Experimental").
- **Codex** has `tool_output_token_limit`, compaction after a final response (`model_post_turn_compact_threshold_percent`), and background compaction at a default of 65%, a feature still under development and off by default. The `model_auto_compact_token_limit` default is unverified.
- **OpenCode**'s V1 config has `compaction.prune` to drop old tool outputs (default `false`); its V2 compaction page no longer lists it.

Masking old tool output, measured: TOK-114.

Confidence note: each tool's behavior is from its own docs; Cline's quality figure is a vendor claim and the Codex `model_auto_compact_token_limit` default is unverified.

## [TOK-086] The April 2026 usage-drain incident
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [April 23 postmortem](https://www.anthropic.com/engineering/april-23-postmortem), [claude-code#41930](https://github.com/anthropics/claude-code/issues/41930), [claude-code#38335](https://github.com/anthropics/claude-code/issues/38335)
- Related: TOK-052, TOK-053, TOK-034

Anthropic's postmortem:
- A bug cleared thinking history every turn from 2026-03-26 to 2026-04-10 (v2.1.101). It caused cache misses and "what drove the separate reports of usage limits draining faster than expected".
- The default effort dropped to medium on 2026-03-04 and was reverted 2026-04-07.
- Usage limits were reset on 2026-04-23.

Community reports in #38335 (877 comments) and #41930 include a 5-hour window gone in 19 minutes on Max 20x. Other suspected causes, such as `--resume` breaking the cache, were partly fixed. #78720 (`-p --resume` after a git status change) is still open, but our v2.1.296 test didn't reproduce it reliably (TOK-034).

Lessons:
- Watch the `Prompt cache (main)` line in `/usage` and `prompt_cache` in the status line, so a cache regression shows within a session, not at the weekly limit.
- Upgrade deliberately: the first turn after an upgrade rebuilds the cache.

---

Confidence note: the timeline is from Anthropic's postmortem; the drain reports are community issue reports.

---

## Research tools: WebSearch, WebFetch, docs MCP servers and research subagents

TOK-087 onwards (FreekMencke/claude-kb#26): what the tools this knowledge base is built with cost, where they cut content, and how to brief the subagents that use them. Tests ran on 2026-10-12 in a Claude Code v2.1.296 subagent session on WSL; each entry names its test. Deep-research workflows are in ORCH-011 and code-index MCP servers in TOK-084.

## [TOK-087] WebFetch reads 100,000 characters and answers through a second model
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Tools reference: WebFetch tool behavior](https://code.claude.com/docs/en/tools-reference#webfetch-tool-behavior), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) (2.1.290), [Inside Claude Code's web tools (mikhail.io)](https://mikhail.io/2025/10/claude-code-web-tools/), [claude-code#95127](https://github.com/anthropics/claude-code/issues/95127)
- Related: TOK-088, TOK-089, TOK-102

WebFetch converts the page to Markdown, then "for most fetches, it then runs the prompt against the content in a separate model call, and Claude receives the result of that call rather than the raw page". It is "lossy by design": "a result that says a page doesn't mention something may only mean the prompt didn't ask about it."

- **Window:** "WebFetch reads up to 100,000 characters of a page's content per call." Since v2.1.290 the result says how much went unread and takes an `offset`; before, the rest was "silently" dropped.
- **The extraction model** sees only the cut text, ending in "[Content truncated due to length...]"; the offset note is added after its answer.
- **Which model, and quote limits (single-source):** the tool says "a small fast model". A 2025-10 runtime inspection (mikhail.io) found a Haiku pass told to "Enforce a strict 125-character maximum for quotes from any source document" on non-preapproved domains, so never cite a WebFetch "quote" as exact wording. Since v2.1.299, page reads "pick their effort as web searches do: the caller's level on the caller's own model, otherwise the level settings give the small model" (CHANGELOG). [claude-code#95127](https://github.com/anthropics/claude-code/issues/95127) (open, no maintainer reply) reports the truncation invisible to the extraction step.

Tested 2026-10-12, v2.1.296, Claude Code on WSL (subagent session): WebFetch of the raw `CHANGELOG.md` (986,110 characters by `curl`) answered from characters 0–100,000 only (2.1.296 to 2.1.287, 714 of 8,789 lines), missed a variable further down, and ended with "the final 886110 were not read — to read on, call WebFetch again with the same url and offset: 100000".

## [TOK-088] Preapproved docs pages come back raw, and big results go to a file
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Tools reference: WebFetch tool behavior](https://code.claude.com/docs/en/tools-reference#webfetch-tool-behavior), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) (2.0.60), [MCP output limits](https://code.claude.com/docs/en/mcp#mcp-output-limits-and-warnings)
- Related: TOK-087, TOK-089, TOK-023

For a "built-in set of preapproved documentation domains" WebFetch fetches without a permission prompt, and since v2.0.60 it can "skip summarization for pre-approved websites" (CHANGELOG). WebFetch also sends an `Accept` header "that prefers Markdown over HTML", and `code.claude.com` answers it with `text/markdown`. The docs don't list the preapproved domains or say when summarization is skipped.

Tested 2026-10-12, v2.1.296, Claude Code on WSL (subagent session):
- `code.claude.com/docs/en/settings` (57,985 bytes as `.md`): WebFetch ignored the prompt and returned the page byte-for-byte identical to `curl …/settings.md`. `tools-reference` (81,007 bytes) did the same.
- Both results were over Claude Code's inline limit, so the conversation got "Output too large (56.6KB). Full output saved to: …" with a 2KB preview; the rest costs tokens only if Claude reads the file. MCP results over 50,000 characters are documented to work the same way.
- `env-vars` (169,065 bytes, over the 100,000-character window) was summarized: it answered the prompt from the first 100,000 characters.

So on Claude docs, WebFetch under 100,000 characters already gives full text, and the size check is what decides whether you get the page or a summary.

## [TOK-089] Getting full text: `curl` the `.md` page and grep
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Tools reference: WebFetch tool behavior](https://code.claude.com/docs/en/tools-reference#webfetch-tool-behavior), [Claude Code docs llms.txt](https://code.claude.com/docs/llms.txt), [Claude Platform docs llms.txt](https://platform.claude.com/llms.txt), [llms.txt proposal](https://llmstxt.org/)
- Related: TOK-087, TOK-088, TOK-090, TOK-040, TOK-042

The docs' own fix for a lossy fetch: "use `curl` via Bash for the unprocessed page." For an exact limit, default, price or version (CLAUDE.md's research rule), save the page and grep it instead of reading it whole:

```bash
curl -sL https://code.claude.com/docs/en/env-vars.md -o env-vars.md
grep -n 'WEB_SEARCH\|WEBFETCH' env-vars.md
```

- **Markdown versions:** append `.md` to a `code.claude.com/docs/en/…` or `platform.claude.com/docs/en/…` URL, or send `Accept: text/markdown`. Every code.claude.com docs page starts with a pointer to `llms.txt`; platform.claude.com pages start with front matter and don't.
- **Cost:** only the grep hits enter context, so a 169 KB page costs a few hundred tokens instead of about 42k (at about 4 characters per token, an estimate). Reading the saved file with `Read` and `offset`/`limit` is the fallback when context matters (TOK-040).
- **GitHub:** `raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>` or `gh api` for READMEs and CHANGELOGs; WebFetch reads only the first 100,000 characters of the 986 KB claude-code CHANGELOG (TOK-087).
- **Limits:** curl runs under Bash permissions and the sandbox network allowlist, which don't inherit WebFetch's preapproved domains (tools reference). Pages that need JavaScript to render return a shell; use a browser tool for those.

## [TOK-090] `llms.txt` is an index; `llms-full.txt` is too big to read
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Code docs llms.txt](https://code.claude.com/docs/llms.txt), [Claude Platform docs llms.txt](https://platform.claude.com/llms.txt), [llms.txt proposal](https://llmstxt.org/)
- Related: TOK-089, TOK-096

Both Anthropic docs sites publish the llms.txt pair. Each code.claude.com page's response carries `Link` headers to them (`rel="llms-txt"`, `rel="llms-full-txt"`); platform.claude.com pages link only their `.md` version (`rel="alternate"`, checked 2026-10-14). Measured with `curl -sL <url> | wc -c` on 2026-10-12:

| File | Size | Use |
|---|---|---|
| `code.claude.com/docs/llms.txt` | 61,893 bytes, 268 page links | Find the right page; fits in one WebFetch |
| `platform.claude.com/llms.txt` | 82,905 bytes | Same, for API docs |
| `code.claude.com/docs/llms-full.txt` | 9,458,535 bytes | grep only |
| `platform.claude.com/llms-full.txt` | 43,216,345 bytes | grep only |

At about 4 characters per token, the Claude Code `llms-full.txt` is roughly 2.4M tokens: bigger than any context window, and 95 WebFetch windows. Download it once and grep it, or better, use `llms.txt` to pick the page and fetch that page's `.md`.

## [TOK-091] WebFetch settings: cache, deadline, permissions, turning it off
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Tools reference: WebFetch tool behavior](https://code.claude.com/docs/en/tools-reference#webfetch-tool-behavior), [Environment variables](https://code.claude.com/docs/en/env-vars), [Permissions](https://code.claude.com/docs/en/permissions), [Data usage: WebFetch domain safety check](https://code.claude.com/docs/en/data-usage)
- Related: TOK-087, TOK-088, REPO-033

| Setting | Default | Since |
|---|---|---|
| `CLAUDE_CODE_WEBFETCH_CACHE_TTL_MS` | `900000` (15 minutes) per URL | v2.1.233 |
| `CLAUDE_CODE_WEBFETCH_DEADLINE_MS` | `300000` (five minutes) per download; `0` removes it | v2.1.268 |
| `CLAUDE_CODE_DISABLE_WEB_FETCH=1` | WebFetch off; "The WebSearch tool stays available" | v2.1.285 |
| `skipWebFetchPreflight: true` | Skips the hostname safety check | — |

- **Cache:** a repeat fetch of the same URL within 15 minutes returns quickly, so re-asking with a sharper prompt is cheap in time, but each answer still enters context.
- **Redirects** to another host come back as a text result; Claude fetches the target with a second call.
- **Safety check:** before a fetch, the hostname (not the URL) goes to `api.anthropic.com`; a passing host is cached for five minutes.
- **Permissions:** Manual and `acceptEdits` modes prompt per fetch except for allowed domains and the preapproved docs set. `WebFetch(domain:*.example.com)` covers subdomains only, not `example.com`.
- **Surfaces:** Team and Enterprise sessions withhold WebFetch until the organization policy loads (`/status` shows why).

## [TOK-092] WebSearch returns titles, URLs and a synthesized answer, within a session budget
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Tools reference: WebSearch tool behavior](https://code.claude.com/docs/en/tools-reference#websearch-tool-behavior), [Environment variables](https://code.claude.com/docs/en/env-vars), [Securely deploying AI agents](https://code.claude.com/docs/en/agent-sdk/secure-deployment), [LLM gateway](https://code.claude.com/docs/en/llm-gateway), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) (2.1.212, 2.1.290)
- Related: TOK-093, TOK-094, TOK-099

WebSearch "runs a query against Anthropic's web search backend and returns result titles and URLs. It doesn't fetch the result pages", so reading a source costs a second call (WebFetch or curl). It "may issue up to eight backend searches per call". `allowed_domains` or `blocked_domains` scope results. The backend isn't configurable. Not on Amazon Bedrock or Claude apps gateway sessions ([Claude apps gateway](https://code.claude.com/docs/en/claude-apps-gateway)).

**Budget:**
- An interactive terminal session has a limit of 200 calls (v2.1.212+). "Searches from the main conversation and from subagents, such as a parallel research fan-out, count against the same limit."
- It refills at about 100 calls per hour in an interactive session (v2.1.290+); in a non-interactive (`-p`) session the refill default is `0`.
- Raise the cap with `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` (it can't be turned off); `/clear` resets the count.
- At the cap, searches do nothing and Claude is told to continue with what it has.

"Search results are summarized rather than passing raw content directly into the context" (secure-deployment page).

Tested 2026-10-12, v2.1.296, Claude Code on WSL (subagent session): each result held a link list plus a few hundred words of answer written by the search side, with caveats such as "I couldn't retrieve that page". Treat that prose as a lead: the links are the evidence.

## [TOK-093] WebSearch `standard` against `extended`
- Type: comparison
- Applies to: Claude Code
- Confidence: unverified
- Last verified: 2026-10-14
- Sources: WebSearch tool schema in Claude Code v2.1.296 (no docs page); [Tools reference: WebSearch tool behavior](https://code.claude.com/docs/en/tools-reference#websearch-tool-behavior)
- Related: TOK-092, TOK-094, TOK-099

WebSearch takes a required `mode`. The tool's own description, the only source: `standard` is "the normal web search: quick and cheap; right for straightforward lookups (reference facts, official pages, documentation, well-known people, places and topics) and simple follow-up lookups"; `extended` is "a thorough, fresh search at several times the cost and latency." Neither the tools reference, the env-vars page nor the CHANGELOG mentions the modes (grepped 2026-10-12), so "several times" is unquantified and it isn't documented whether an extended call counts as one call against the session budget.

Tested 2026-10-12, v2.1.296, Claude Code on WSL (subagent session), one call each, query "context7 MCP server free tier rate limits API key 2026":
- `standard`: 9 links, 6 of them duplicates of two articles; said it couldn't find the numbers and pointed to the official plans page.
- `extended`: 10 distinct, more on-topic links, and more figures, which disagreed with each other (100 requests a day, 1,000 calls a month, "unlimited") and all came from third-party pages.

Neither reached the official page. Extended bought breadth, not authority.

**When extended pays off:** when a standard result is thin or stale (CLAUDE.md's rule), for recent events, or for a survey of community practice. For a fact with an official home, go to the source instead: `llms.txt`, the `.md` page, or a docs MCP server (TOK-089, TOK-096).

## [TOK-094] API web search and web fetch tools: prices and token effects
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool), [Web fetch tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Related: TOK-092, TOK-017, TOK-024, TOK-050

**Web search** (`web_search_20250305`, `_20260209` with dynamic filtering, `_20260318` with response inclusion):
- "$10 per 1,000 searches, plus standard token costs for search-generated content."
- "Web search results retrieved throughout a conversation are counted as input tokens, in search iterations executed during a single turn and in subsequent conversation turns": results are re-read every later turn, like any tool output (TOK-008).
- "Each web search counts as one use, regardless of the number of results returned"; failed searches aren't billed. Citation fields "do not count toward input or output token usage".
- `max_uses` caps searches per request: "Simple factual queries typically use 1–3 searches; comparative or multientity research can use 10 or more."

**Web fetch** (`web_fetch_20250910` up to `_20260318`): "no additional cost. You only pay standard token costs for the fetched content". The docs' estimates: "Average web page (10 kB): ~2,500 tokens", "Large documentation page (100 kB): ~25,000 tokens", "Research paper PDF (500 kB): ~125,000 tokens". `max_content_tokens` truncates text (approximately; PDFs excluded); there's no default `max_uses`.

**Dynamic filtering** (`_20260209` and later, Claude 4.6+): Claude writes code that filters results "before they reach the context window"; code execution with these tools adds no charge beyond tokens. This is the API's answer to WebFetch's extraction model: filter before the context pays for it.

Neither tool is on Amazon Bedrock; web fetch isn't on Google Cloud.

How Claude Code's WebSearch is metered on a subscription isn't documented (Open questions).

## [TOK-095] context7: cost per lookup, freshness and limits
- Type: tool
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [upstash/context7](https://github.com/upstash/context7), [Context7 plans](https://context7.com/plans), [Library updates](https://context7.com/docs/library-updates), [Data privacy](https://context7.com/docs/security/data-privacy), [Upstash benchmark](https://upstash.com/blog/context7-vs-web-search-benchmark)
- Related: TOK-096, TOK-097, TOK-098, TOK-020

context7 (about 62.9k stars, `@upstash/context7-mcp@4.3.0` on 2026-10-09) serves indexed snippets of library docs through two tools: `resolve-library-id`, then `query-docs`. Both descriptions say "Do not call this tool more than 3 times per question". The old `tokens` parameter is gone from the current schema.

- **Plan limits:** both calls are API calls. Free: "blocked after reaching the monthly limit of 1,000 API calls", plus "20 bonus API calls each day while you're blocked". Pro: "$10 per seat per month", 2,000 calls per seat, "then $5 per 1,000 additional calls". Without a key: "Low rate limits".
- **Freshness:** a request triggers a background refresh when docs are older than a popularity threshold ("Top 100: 1 day", Top 1,000: 15 days, Top 5,000: 30 days, others 45 days), and only for libraries "requested recently". The request that triggers it gets the old docs.
- **Privacy:** only the query and library name are sent; queries are stored anonymously.
- **Vendor benchmark (Upstash, 2026-05-27):** "reduced cost by 34.56% and total token usage by 36.81%" against WebSearch/WebFetch over 100 queries; no accuracy data.

Tested 2026-10-12, v2.1.296, Claude Code on WSL (subagent session): a lookup on `/websites/code_claude` cost two calls and about 2k tokens (about 2.5k characters to resolve, about 5k returned). Its WebFetch section predated v2.1.290 ("truncated to a fixed character limit", no 100,000 figure or `offset`), and an irrelevant Read-tool block came first. WebFetch of the same page returned the current text (TOK-088).

## [TOK-096] Anthropic's docs MCP servers
- Type: tool
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Claude Platform docs llms.txt](https://platform.claude.com/llms.txt), [Claude Code docs server card](https://code.claude.com/docs/.well-known/mcp/server-card.json), [MCP in Claude Code](https://code.claude.com/docs/en/mcp)
- Related: TOK-090, TOK-095, TOK-097, TOK-020

Both Anthropic docs sites expose a search MCP server, so neither needs context7:

- **Claude Platform docs:** `llms.txt` says "Connect an MCP client to https://platform.claude.com/docs/mcp (Streamable HTTP transport) to search and read these docs." Its own instructions scope it to the API, SDKs and Managed Agents, "not Claude Code or the Agent SDK". Tools include `search_docs` (`limit` default 10), `get_navigation` and `get_doc`.
- **Claude Code docs:** not in `llms.txt`, but every page's `Link` header points to `/docs/.well-known/mcp/server-card.json`. That card names a Mintlify server, "Claude Code Docs Docs MCP", with `search_claude_code_docs` and `query_docs_filesystem_claude_code_docs` (shell-like `head`/`cat` on page paths), no authentication.

Tested 2026-10-12 with `curl` JSON-RPC from Claude Code v2.1.296 on WSL (no MCP client): `search_claude_code_docs` for "WebFetch offset 100,000 characters unread" returned 10 page sections, 39,969 characters (roughly 10k tokens), led by the current WebFetch section with the 100,000-character text that context7 lacked (TOK-095). A research subagent's `initialize` on the platform server returned `claude-platform-docs`.

**Cost:** added to Claude Code, each costs only its tool names and server instructions until used, because MCP tools are deferred (TOK-020). A search returns whole sections, so it's fresher but larger than a context7 snippet; results count against MCP output limits: a warning above 10,000 tokens, a 25,000-token default cap, and text over 50,000 characters saved to a file (TOK-023).

## [TOK-097] Other docs and search MCP servers
- Type: tool
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [MicrosoftDocs/mcp](https://github.com/MicrosoftDocs/mcp), [AWS Knowledge MCP](https://github.com/awslabs/mcp/tree/main/src/aws-knowledge-mcp-server), [idosal/git-mcp](https://github.com/idosal/git-mcp), [DeepWiki MCP](https://cognition.com/blog/deepwiki-mcp-server), [ref-tools-mcp](https://github.com/ref-tools/ref-tools-mcp), [fetch server](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch), [Exa pricing](https://exa.ai/pricing), [Brave Search API](https://brave.com/search/api/), [Perplexity pricing](https://docs.perplexity.ai/guides/pricing)
- Related: TOK-095, TOK-096, TOK-022, TOK-084, INFRA-003

Sources are the vendors' READMEs and pricing pages.

| Server | What it reads | Cost and size controls |
|---|---|---|
| Microsoft Learn MCP | First-party Microsoft docs, live | Free, no key; `?maxTokenBudget=2000` caps a result |
| AWS Knowledge MCP | AWS docs and skills (`search_documentation`, `read_documentation`) | Free, no auth, "subject to rate limits". Our `aws` server is the managed AWS MCP Server instead (SigV4 credentials, INFRA-003), which has the same docs tools |
| GitMCP | Any GitHub repo's `llms.txt`, else README, live from the default branch | Free; no token figures |
| DeepWiki MCP | Generated wikis of indexed repos (`ask_question`) | Free; content can lag the repo |
| Ref | Docs search; vendor claims "the most relevant 5k tokens" per read against "20k+" for a plain fetch | API key; price not in README |
| `fetch` reference server | Any URL as Markdown | `max_length` "default: 5000" characters, `start_index` to page |
| Exa, Brave, Perplexity search APIs | Web search with your own key | Exa "From $4 /1k requests"; Brave "$5 per 1,000 requests"; Perplexity Search "$5.00" per 1K |

For docs with a first-party server (Microsoft, AWS, Anthropic, TOK-096), prefer it over a general index: it is the source. A third-party search API pays off mainly where WebSearch isn't available, such as gateway or Bedrock sessions (TOK-092).

## [TOK-098] Picking a research tool by question
- Type: recommendation
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: synthesis of TOK-087 to TOK-097; [Tools reference](https://code.claude.com/docs/en/tools-reference); tests listed in those entries
- Related: TOK-087, TOK-089, TOK-092, TOK-093, TOK-095, TOK-096

Rough cost per lookup from our 2026-10-12 tests (4 characters per token, one sample each):

| Question | Tool | Tokens into context |
|---|---|---|
| Exact limit, default, price or version in Claude docs | `curl` the `.md` + `grep -n` | A few hundred |
| Which page covers X (Claude docs) | `llms.txt` (62–83 KB) or a docs MCP search | About 10k (MCP search returns whole sections) |
| How to use library X | context7 | About 2k over two calls; may be weeks stale |
| Read a page under 100,000 characters | WebFetch (raw on preapproved docs, else a summary) | Summary: hundreds; raw: up to 25k, or a file pointer |
| Find sources on an open question | WebSearch `standard` | Under 1k per call, plus a fetch per source read |
| Survey community practice, or a thin standard result | WebSearch `extended` | Somewhat more; "several times the cost and latency" |

Rules that follow:
- **Quote only from full text.** A WebFetch summary or a search answer is a lead, not a source (TOK-087, TOK-092).
- **Search finds, fetch reads.** WebSearch never reads the page; budget one fetch or curl per source you cite.
- **Prefer the source's own channel** (`.md` page, docs MCP, raw GitHub) over an index of it (context7, DeepWiki) when freshness matters: our context7 snapshot of the Claude Code docs predated v2.1.290.

## [TOK-099] How many research subagents, on which model
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-14
- Sources: [Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), [claude-agent-sdk-demos research-agent](https://github.com/anthropics/claude-agent-sdk-demos/tree/main/research-agent), [Tools reference: session search limit](https://code.claude.com/docs/en/tools-reference#session-search-limit), [README: Design decisions](https://github.com/FreekMencke/claude-kb/blob/main/README.md#design-decisions)
- Related: ORCH-020, ORCH-025, ORCH-030, TOK-092, TOK-100

Anthropic's research system scales by query: "Simple fact-finding requires just 1 agent with 3-10 tool calls, direct comparisons might need 2-4 subagents with 10-15 calls each, and complex research might use more than 10 subagents with clearly divided responsibilities." Its lead "spins up 3-5 subagents in parallel". Multi-agent research used "about 15× more tokens than chats" (ORCH-020 has the multipliers, ORCH-025 the scaling rules).

For one knowledge-base topic (4–6 questions), that means 1–2 subagents split by question, not by tool:
- **Model:** Sonnet readers under an Opus lead (README design decision). Anthropic's SDK demo runs every agent on Haiku, but its notes carry no exact quotes; for claims every agent trusts, the reader's accuracy matters more than its price (ORCH-030).
- **Search budget:** subagents share the session's 200-call WebSearch limit, and a `claude -p` run gets no refill (TOK-092). A fan-out of five that each search 40 times uses it all.
- **Our measurement** (2026-10-12, this topic, Claude Code v2.1.296): two Sonnet 5.5 subagents at high effort used 102k and 124k tokens, 35 and 54 tool calls, 3 and 5 minutes. Both repeated some of the lead's own tests, an argument for doing the cheap tests first and telling subagents the results.

## [TOK-100] What a research subagent's brief adds
- Type: pattern
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-14
- Sources: [Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), [research_lead_agent.md](https://github.com/anthropics/claude-cookbooks/blob/main/patterns/agents/prompts/research_lead_agent.md), [One-liner research agent](https://github.com/anthropics/claude-cookbooks/blob/main/claude_agent_sdk/00_The_one_liner_research_agent.ipynb)
- Related: PROMPT-012, PROMPT-013, PROMPT-014, TOK-099, TOK-101

PROMPT-012 covers any cold-start brief: objective, what's known, inputs, boundaries, done-when, return format. Anthropic's research post reduces it to "an objective, an output format, guidance on the tools and sources to use, and clear task boundaries". What a research brief adds:

1. **Source order.** Early agents "consistently chose SEO-optimized content farms over authoritative but less highly-ranked sources"; "source quality heuristics" fixed it. Name the hierarchy (official docs, then official repos, then community).
2. **How to read.** "Start with short, broad queries, evaluate what's available, then progressively narrow focus." Then: exact figures only from `curl` + `grep`, never from a WebFetch summary (TOK-087).
3. **What's already known or tested,** so it doesn't redo it (TOK-099's measurement).
4. **Absence rules.** "Not found" must say where it looked; a truncated fetch is not evidence of absence (README, Re-verification routine).
5. **Fetched text is data.** Pages and issues may contain instructions; the subagent doesn't follow them or install what they suggest.
6. **Write limits.** "Don't write files" or a unique scratch folder, so parallel readers don't collide.
7. **Return format** with a source per claim (TOK-101).

## [TOK-101] Getting sources back from research subagents
- Type: pattern
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-14
- Sources: [Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), [One-liner research agent](https://github.com/anthropics/claude-cookbooks/blob/main/claude_agent_sdk/00_The_one_liner_research_agent.ipynb), [claude-agent-sdk-demos research-agent](https://github.com/anthropics/claude-agent-sdk-demos/tree/main/research-agent)
- Related: PROMPT-013, ORCH-034, ORCH-035, TOK-100, TOK-103

Anthropic's patterns:
- The cookbook research agent: "Always include source URLs as citations", "Format citations as markdown links", grouped in a "Sources:" section.
- The research system has subagents "store their work in external systems, then pass lightweight references back", to avoid a "game of telephone", and a separate CitationAgent maps claims to source locations.
- The SDK demo's researchers save notes ending in "## Sources" to `files/research_notes/{topic_name}.md` and return the "Filename where saved"; the lead holds only `Task`, and later agents find the notes in that folder (TOK-103).

What to ask for, per claim: the URL, the exact quoted wording for any number, default or version, how it was read (curl + grep, or a fetch), and "not verified" where it couldn't. Access dates are our rule (CLAUDE.md), not Anthropic's. Keep the report under about 1,500 words; bulky downloads stay in the subagent's scratch folder, where the lead can grep them.

**The lead re-checks the claims it publishes.** In this topic's research (2026-10-12) the lead spot-checked about ten quotes with `grep` on the curled pages: all held. But one subagent reported "code.claude.com has no MCP server card (404)" from the wrong path, while the page's `Link` header named one that works (TOK-096). Absence claims and claims that change an entry are the ones to verify first.

## [TOK-102] Anti-patterns: research tools
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Tools reference](https://code.claude.com/docs/en/tools-reference), [Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), [README: Re-verification routine](https://github.com/FreekMencke/claude-kb/blob/main/README.md#re-verification-routine)
- Related: TOK-087, TOK-089, TOK-092, TOK-093, TOK-098, TOK-101

| Anti-pattern | Instead | Entry |
|---|---|---|
| Citing a WebFetch answer as the page's wording | `curl` the page and grep for the quote | TOK-087, TOK-089 |
| "The page doesn't mention X" after one fetch | Check its length; read on with `offset`, or grep the curled page | TOK-087 |
| Reading `llms-full.txt` (9–43 MB) | `llms.txt` to find the page, then its `.md` | TOK-090 |
| WebFetch for a GitHub CHANGELOG | Raw URL + grep; WebFetch sees the first 10% | TOK-089 |
| `extended` by default | `standard` first; `extended` for thin or stale results | TOK-093 |
| Treating search-result prose as findings | Open the links that matter | TOK-092 |
| Trusting context7 for a just-released feature | The docs' own page or MCP server | TOK-095, TOK-096 |
| A wide fan-out in `claude -p` | Few subagents; the search budget doesn't refill there | TOK-099 |
| One-line briefs to parallel researchers | Distinct questions, source order, absence rules | TOK-100 |
| Publishing a subagent's "not found" unchecked | Re-check absence claims before they change an entry | TOK-101 |

Confidence note: each row's detail and confidence is in the linked entry.

## Subagent handoff and script output

## [TOK-103] Subagent file handoff: return a path and a status, not the report
- Type: pattern
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-16
- Sources: [Multi-agent research system (appendix)](https://www.anthropic.com/engineering/multi-agent-research-system), [Agent SDK: subagents](https://code.claude.com/docs/en/agent-sdk/subagents), [claude-agent-sdk-demos researcher prompt](https://github.com/anthropics/claude-agent-sdk-demos/blob/826b268506a5f3707623c9e6140b200befcbebae/research-agent/research_agent/prompts/researcher.txt), [superpowers implementer prompt](https://github.com/obra/superpowers/blob/bb92a77741419a4ab5f06e711a283343f1ada0c3/skills/subagent-driven-development/implementer-prompt.md)
- Related: ORCH-034, ORCH-035, ORCH-007, TOK-035, TOK-101, TOK-104, TOK-105, TOK-106, TOK-107

When a subagent's output is long and the lead needs only part of it, or hands it to another agent, have the subagent write the full report to a file named in the brief and return a status, the path and a few lines. An inline report enters the lead's context whole and is re-read on every later turn (TOK-008).

- **The brief carries the path**: "The only content you pass from parent to subagent is the Agent tool's prompt string" (SDK subagents page).
- **Anthropic's pattern.** Subagents "store their work in external systems, then pass lightweight references back to the coordinator", which "works particularly well for structured outputs like code, reports, or data visualizations" (engineering post, 2025-06-13). In the SDK demo, the lead holds only `Task`; researchers "SAVE findings to files/research_notes/{topic_name}.md" and return the "Filename where saved".
- **A worked contract.** superpowers: "report back with ONLY (under 15 lines — the detail lives in the report file)": a status (`DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, `NEEDS_CONTEXT`), commits, a one-line test summary, concerns and the path. Blockers go in the message itself: "the controller acts on it directly".
- **When it pays.** Only when the lead reads a slice (TOK-106) or forwards the path; reading the whole file back costs the same one turn later. The saving recurs on each later turn; the test below measured one. Under about 2k tokens, inline is simpler (our judgment, untested). Anthropic's stated reason is fidelity first.

Tested 2026-10-16, v2.1.296, `claude -p` on Haiku 5.5, 3 runs per arm: a 40,225-character report returned inline added 14,868 to 14,873 tokens to the parent's next request; written to a file with a 303–322-character return, 806 to 816.

## [TOK-104] Where handoff files go
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [The .claude directory: session scratchpad](https://code.claude.com/docs/en/claude-directory#session-scratchpad-directory), [Hooks: common input fields](https://code.claude.com/docs/en/hooks), [superpowers sdd-workspace](https://github.com/obra/superpowers/blob/bb92a77741419a4ab5f06e711a283343f1ada0c3/skills/subagent-driven-development/scripts/sdd-workspace), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: TOK-103, SESS-016, ORCH-009, HOOK-003

Default to the session scratchpad. Use a git-ignored folder in the working tree when the file must outlive the session or the session has none.

- **The scratchpad** is "a per-session directory that Claude Code gives Claude for temporary files", and Claude "can create, edit, and read files in it without a permission prompt". On Linux: `/tmp/claude-<uid>/<project>/<session-id>/scratchpad/`. Its files "last as long as the session's transcript", but the OS "can also clear it, such as on restart". Hooks get it as `scratchpad_dir` (v2.1.257+).
- **Not every session has one**: only with a claude.ai login rather than an API key, on the Anthropic API rather than Bedrock, Google Cloud or Foundry, and with `enableArtifact` not `false`.
- **Sibling subagents share it**: one per session, so give each subagent its own subfolder or filename.
- **In the repo**, superpowers keeps its workspace at `<repo-root>/.superpowers/sdd/<plan>/` with a self-ignoring `.gitignore`, "in the working tree (not under .git/) because Claude Code treats .git/ as a protected path and denies agent writes there".
- **Not inside an isolation worktree.** The CHANGELOG has three fixes for lost outputs: 2.1.98 ("removing worktrees that contain untracked files"), 2.1.143 ("preventing loss of gitignored or in-progress files") and 2.1.153 ("could silently discard outputs written to gitignored paths").
- **Cloud sessions**: since 2.1.268, files in persisted session folders "now persist for up to a day".

Tested 2026-10-16, desktop Code tab on WSL, v2.1.299: four parallel subagents wrote into their own folders under the lead's scratchpad with no permission prompt.

## [TOK-105] A background agent's `output_file` is its transcript, not its report
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Subagents](https://code.claude.com/docs/en/sub-agents), [Tools reference](https://code.claude.com/docs/en/tools-reference), [Hooks: SubagentStop](https://code.claude.com/docs/en/hooks), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: TOK-013, TOK-103, ORCH-007, ORCH-006

Since 2.1.198, "Subagents now run in the background by default", and "A background subagent's results reach Claude as a completion notification in a later turn." The notification names an `output_file`. For a Bash background task that file is the output, which Claude reads with `Read` (`TaskOutput` was "Removed in v2.1.277"). For a subagent it is `tasks/<agentId>.output`, a symlink to the transcript `subagents/agent-<agentId>.jsonl`. The launch result says: "Do NOT Read or tail this file via the shell tool — it is the full subagent JSONL transcript and reading it will overflow your context."

Where the report arrives: in the notification's result, or, in auto mode (v2.1.271+), as a separate hand-back message from the `SubagentHandback` tool. The notification then says "This agent's report was delivered to you as a message from …".

The docs give no size rule for a subagent's result. In our tests a 40,225-character report arrived whole in `claude -p`. In an interactive auto-mode session, a 50,709-byte report arrived as "Output too large (49.5KB). Full output saved to: …/tool-results/….txt" with "Preview (first 2KB)", matching 2.1.51's "Tool results larger than 50K characters are now persisted to disk".

Tested 2026-10-16: desktop Code tab on WSL, v2.1.299: each agent's `.output` in the session's `tasks/` folder was a symlink to its transcript, while a Bash background task's was a regular file. `claude -p`, v2.1.296: the Agent call was backgrounded (`task_started` with `is_backgrounded: true`), although sub-agents.md says fork mode is off in `-p`.

Confidence note: the symlink and the warning are observed harness behaviour, not documented.

## [TOK-106] Handoff file layout for partial reads
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Tools reference: output limits](https://code.claude.com/docs/en/tools-reference), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: TOK-103, TOK-040, SKILL-017

Write a handoff file so the lead can read only the part it needs:
- **Status and a summary of at most about ten lines first**, within 2,000 characters: a large Bash result is previewed as "the first 2,000 characters", and a reader may `head` the file.
- **A contents list.** For skill reference files: "For reference files longer than 100 lines, include a table of contents at the top. This ensures Claude can see the full scope of available information even when previewing with partial reads." Claude "might use commands like `head -100` to preview content rather than reading entire files".
- **Fixed, unique `##` headings**, so `grep -n '^#'` gives an outline with line numbers and `Read` with `offset` and `limit` fetches one section.
- **Lines, not blobs.** Read can't page one long line: 2.1.287 fixed Claude "being told to page large MCP results saved as JSON with Read's offset and limit, which cannot split one long line". A whole-file read past the limit returns "a truncated first page with a "PARTIAL view" notice" (2.1.145) unless Claude passes `allow_large` (2.1.296).
- **One claim per line with its source**, raw excerpts last.

Confidence note: the quoted rules are official for skill files and Read; applying them to handoff files is our inference, untested.

## [TOK-107] Anti-patterns: subagent handoff
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Subagents](https://code.claude.com/docs/en/sub-agents), [Hooks: SubagentStop](https://code.claude.com/docs/en/hooks), [Permission modes: protected paths](https://code.claude.com/docs/en/permission-modes), [VoltAgent multi-agent-coordinator](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/408d3c9eee2d0c75c12a3abb5de29e53c2ca6b9e/categories/09-meta-orchestration/multi-agent-coordinator.md), [superpowers SKILL.md](https://github.com/obra/superpowers/blob/bb92a77741419a4ab5f06e711a283343f1ada0c3/skills/subagent-driven-development/SKILL.md)
- Related: TOK-103, TOK-104, TOK-105, TOK-106, ORCH-005, ORCH-019, ORCH-023

| Anti-pattern | Instead |
|---|---|
| Asking Explore or Plan to write the report | They have "read-only tools; Write and Edit are denied"; use a general-purpose or custom agent |
| Asking a subagent to write `report.md`, `summary.md` or `findings.md` | The Write is refused (test below); ask for an inline return, or name the file for its content |
| Two subagents writing one file | One file each; VoltAgent: "a single writer per file", "write to a temp path, then swap" |
| Trusting a file left by an earlier run | A run-scoped folder, or an identity first line (superpowers' ledger) |
| Reading the notification's `output_file` | It is the transcript (TOK-105) |
| Reading the whole handoff file back | The summary and the sections you need (TOK-106) |
| A long inline report under a low output cap | Only the last segment arrives (test below) |
| A `SubagentStop` gate on `last_assistant_message` in auto mode | Match `SubagentHandback`: its `tool_input.message` is the report; `last_assistant_message` "is not the delivered report" (v2.1.271+) |
| Handoff files under `.git/` or `.claude/` | Protected paths prompt, and a background subagent can't answer |

Tested 2026-10-16, one Write per name, desktop Code tab on WSL (v2.1.299, auto mode) and `claude -p` (v2.1.296): subagent writes of `report.md`, `summary.md`, `analysis.md` and `findings*.md` failed with "Subagents should return findings as text, not write report files."; `notes.md`, `x-summary.md`, `probe-report.md` and `.txt` files were written. Undocumented: treat it as Anthropic's preference, not a filter to rename around.

Tested 2026-10-16, v2.1.296, `claude -p`, n=2: with `CLAUDE_CODE_MAX_OUTPUT_TOKENS=4000`, a 40,000-character inline return was cut three times ("Output token limit hit. Resume directly"), and the parent got only the last segment (6,209 and 6,023 characters), status `completed`.

## [TOK-108] What the Bash tool does to a script's output
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Tools reference: output limits](https://code.claude.com/docs/en/tools-reference), [Skills: injected command output](https://code.claude.com/docs/en/skills), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: TOK-042, TOK-109, TOK-110, HOOK-004

How Claude Code hands a command's output to Claude, which decides how a script should print (TOK-109):
- **Success**: "Inline up to roughly 30,000 characters by default; past that, the path of a file saved to the session directory and truncated past 64 MiB, plus a preview of up to the first 2,000 characters".
- **Failure**: "Inline up to roughly 10,000 characters; past that, a head-and-tail excerpt of that size cut from the read-back window, with no file path". A failing script's middle is lost, and Claude can't read the rest.
- **Exit 1 is a failure** except for "`grep`, `rg`, `egrep`, `fgrep`, `find`, `diff`, `test`, and `[`, plus `git diff` and `git grep`". A script that exits 1 for "no results" reads as failing.
- **Caps**: "a command whose output passes 5 GB is killed"; 2.1.265 "Added a 1 GB cap on tool results saved to disk".
- **Timeouts**: two minutes by default, ten at most. At its timeout a foreground command moves to the background, "unless the command starts with `sleep`".
- **stderr**: documented only for skill injection ("Claude Code merges stderr into stdout"). In the Bash tool, stdout and stderr came back interleaved in call order.

Tested 2026-10-16, desktop Code tab on WSL, v2.1.299, Bash tool: `set -o` showed `pipefail off`, so `false | tail -1` exits 0 (no docs page mentions `pipefail`); stdout and stdin were not terminals; a failing command's result started with `Exit code N`. With synthetic functions, costs.md's filter pipeline (TOK-042) exited 0 on a failing run; adding `set -o pipefail` made a passing run, where `grep` matched nothing, report `Exit code 1`; capturing the status first exited 1 with the FAIL lines.

## [TOK-109] Output contract for scripts and CLIs that agents run
- Type: recommendation
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-16
- Sources: [Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents), [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [OpenAI cli-creator: agent CLI patterns](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/references/agent-cli-patterns.md), [clig.dev](https://clig.dev/), [HumanLayer: context-efficient backpressure](https://www.humanlayer.dev/blog/context-efficient-backpressure), [npm logging](https://docs.npmjs.com/cli/v11/using-npm/logging)
- Related: TOK-108, TOK-042, SKILL-018, MCP-018, FLOW-011, FLOW-013, HOOK-004

A script an agent runs pays only for its output (SKILL-018), so shape the output:
- **Success: one line.** Anthropic's validator example: `# Returns: "OK" or lists conflicts`. HumanLayer: "Success = ✓. Failure = full output."
- **Failure: specific and bounded.** Errors should "clearly communicate specific and actionable improvements, rather than opaque error codes or tracebacks" (Anthropic). Print sorted `file:line` failures, cap them ("and N more"), stay under 10,000 characters, and put the log path on the first and last line: Claude Code keeps only head and tail of a failure, with no path (TOK-108). npm prints "the path to that file … if the execution of a command fails".
- **Exit status carries the verdict**: "Exit zero when the command succeeded, including an empty result" (cli-creator). As a hook, exit 2 blocks (HOOK-004). Keep the status through pipes (TOK-042).
- **Bounded by default**: "Start shallow by default", with `--limit`. When truncating, "be sure to steer agents with helpful instructions" (Anthropic).
- **`--json`**: "Emit JSON to stdout only." Progress on stderr still reaches Claude, which reads both streams (TOK-108), so send it to the log.
- **No colour, animation, pager or prompt off a terminal**: "If stdout is not an interactive terminal, don't display any animations"; "Use a pager only if stdin or stdout is an interactive terminal" (clig.dev).

Anthropic's example: a concise tool response of 72 tokens against a detailed one of 206 ("~⅓ of the tokens"), illustrative. Fail-fast ("One failure at a time", HumanLayer) trades against running every check in one round (FLOW-013).

Confidence note: a synthesis; Anthropic's rules are written for tools and validators, the CLI rules come from OpenAI's skill and clig.dev.

## [TOK-110] Detecting an agent in a script
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Environment variables](https://code.claude.com/docs/en/env-vars), [CLI hints for plugins](https://code.claude.com/docs/en/plugins/cli-hints), [Permissions](https://code.claude.com/docs/en/permissions), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md), [gh agents/detect.go](https://github.com/cli/cli/blob/b758ce35643e64cfe4d61bc58b6009c4088e5e0c/internal/agents/detect.go)
- Related: TOK-108, TOK-111, HOOK-003

- **`CLAUDECODE=1`**: set "in subprocesses Claude Code spawns (Bash and PowerShell tools, tmux sessions, hook commands, status line commands, stdio MCP server subprocesses). IDE extensions also set this in their integrated terminals", so a person may be typing.
- **`CLAUDE_CODE_CHILD_SESSION=1`** (v2.1.172+): "only set by Claude Code itself when it launches a subprocess and not by IDE extensions"; not set for stdio MCP servers. The CLI-hints page: "Emit the tag only when `CLAUDECODE` or `CLAUDE_CODE_CHILD_SESSION` is set".
- **`CLAUDE_CODE_SESSION_ID`** correlates a script with the session.
- **`AI_AGENT`**: CHANGELOG only, 2.1.120, "so `gh` can attribute traffic to Claude Code"; gh checks it first. **`CLAUDE_CODE_ENTRYPOINT`** is undocumented; gh: "it's not documented so we don't want to rely on it too heavily".
- **Not set**: `NO_COLOR`, `PAGER`, `GIT_PAGER`, `CI`. Claude Code relies on stdout not being a terminal; 2.1.295 fixed background sessions "inheriting `FORCE_COLOR=3`, which put color escape codes into the output Claude reads". `NO_COLOR` in settings `env` reaches "only subprocesses". Codex, by contrast, forces `NO_COLOR=1`, `TERM=dumb` and `PAGER=cat`; Gemini CLI sets `GEMINI_CLI=1` and `PAGER=cat` and strips ANSI.
- **Prefixes and allow rules**: "An allow rule won't match past an assignment of any other variable" than "certain known-safe" ones, so prefer flags (`git --no-pager`, `gh --json`) to `PAGER=cat`.

Tested 2026-10-16, desktop Code tab on WSL, v2.1.299: `CLAUDECODE=1`, `CLAUDE_CODE_CHILD_SESSION=1`, `AI_AGENT=claude-code_2-1-299_agent`, `CLAUDE_CODE_ENTRYPOINT=claude-desktop`; `NO_COLOR`, `PAGER`, `GIT_PAGER`, `CI` and `AGENT` unset; `TERM=xterm-256color`.

## [TOK-111] Agent-aware test runners and quiet flags
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Vitest reporters](https://vitest.dev/guide/reporters), [Bun test: AI agent integration](https://bun.com/docs/test), [testthat LlmReporter](https://testthat.r-lib.org/reference/LlmReporter.html), [pytest reference](https://docs.pytest.org/en/stable/reference/reference.html), [go help test](https://pkg.go.dev/cmd/go#hdr-Test_packages), [git docs](https://git-scm.com/docs/git)
- Related: TOK-108, TOK-110, TOK-042, FLOW-011

Some runners detect an agent and cut their own output:
- **Vitest** (v5.0.5): with no reporter configured, it uses "`minimal` when Vitest detects an AI coding agent", which keeps "only failed tests and their error messages". Detection comes from `std-env`, which maps Claude to `CLAUDECODE` and also turns watch mode off.
- **Bun**: "`CLAUDECODE=1` - For Claude Code" and "`AGENT=1` - Generic AI agent flag"; "Only test failures are displayed in detail" and "Summary statistics remain intact".
- **testthat**: "`LlmReporter` is used by default when tests are run by a coding agent."

Elsewhere, flags do it:
- **pytest**: `-q`, `-x` ("Exit instantly on first error or failed test"), `--tb=short`, `--no-header`, `--no-summary`.
- **go test**: with package arguments, a passing package prints "only the final 'ok' summary line"; `-v` prints everything.
- **cargo test**: `-q` is forwarded to the test harness, which then prints one character per test.
- **git**: pages only "if standard output is a terminal"; `--no-pager` for tools that allocate one.
- **gh**: `--json <fields>` with `--jq`.

Our largest Bash outputs were `git diff` and `gh`, not test runs (TOK-042), so quiet query habits matter as much as quiet runners.

## Background spenders and measured savers

## [TOK-112] Background token spenders
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Costs: background token usage](https://code.claude.com/docs/en/costs), [Interactive mode](https://code.claude.com/docs/en/interactive-mode), [Settings reference](https://code.claude.com/docs/en/settings-reference), [Permission modes: cost and latency](https://code.claude.com/docs/en/permission-modes), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: TOK-008, TOK-010, TOK-053, TOK-030

Requests Claude Code sends without a typed prompt:
- **Prompt suggestions**: "a short request to the model your session is using after Claude responds", "mostly cache reads plus a few output tokens", skipped when "The prompt cache is cold". Off: `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION=false` or `promptSuggestionEnabled: false`.
- **`!` commands** (since 2.1.186): Claude replies to the output, and "The response costs the same as sending a normal prompt." `respondToBashCommands: false` adds the output without a reply.
- **Idle compaction**: a long conversation left idle is compacted "shortly before its prompt cache expires" (default threshold 200,000 tokens, after "about 54 minutes"); `idleCompaction: false` turns it off.
- **Model switch** (2.1.301): "a conversation too long for the new model is now summarized by the previous model first".
- **Auto-mode classifier**: billed only where Claude Code runs it locally; `CLAUDE_CODE_AUTO_MODE_SERVER=0` opts into that "(the local classifier then counts toward usage)" (2.1.281).
- **Housekeeping**: `--resume` summaries and `/usage` status checks, "typically under $0.04 per session".
- **Idle turns with full context**: scheduled tasks, cross-session messages (`crossSessionInbound: hold`) and goal check-ins (at most three per goal; `CLAUDE_CODE_GOAL_CHECKIN_MINUTES=0` turns them off).

2.1.299 "Added `/usage` warnings for max effort, workflows, always-on context and large tool results"; their wording isn't on a docs page.

## [TOK-113] Terse-output skills and rules files: measured savings
- Type: comparison
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-16
- Sources: [JetBrains: Caveman tested](https://blog.jetbrains.com/ai/2026/07/speak-to-ai-agents-like-cavemen-tosave-tokens/), [Caveman README](https://github.com/JuliusBrussee/caveman/blob/d262ab3882952a59312ff3537cd86d894523c5ab/README.md), [claude-token-efficient benchmark](https://github.com/drona23/claude-token-efficient/blob/0d30a6db75af983b8ababf585f28faefdfc87895/benchmark/SUMMARY.md), [CAVEWOMAN (arXiv 2606.24083)](https://arxiv.org/abs/2606.24083), [Dasein code-compression-bench](https://github.com/daseinlabs/code-compression-bench/blob/466077f002e6ef71fe5e8f24fc1c930edd4e3691/FACT-VS-FICTION.md)
- Related: PROMPT-024, TOK-008, TOK-083

Terse-style skills cut a small share of an agent session's cost, because output is a small share of it (17% of our list-price cost, TOK-008).
- **JetBrains** (2026-07-06; Claude Code 2.1.200, claude-sonnet-5 at low effort, Caveman forced on, 82 paired tasks): "Advertised saving: 65%. Measured saving: 8.5%." Quality tied (p = 0.82). The raw totals came out 11.6% dearer, and "The entire inversion came from a single trial". Why: "Only the narration between tool calls gets compressed, and there is not much of it."
- **Caveman's own README** (2026-10-13): "'Be concise' is the real baseline", and `/caveman` "cuts 3% more at the median" (ten questions on Opus 5.5).
- **claude-token-efficient** (a terse CLAUDE.md, N=5): "The published 63% reduction does not reproduce", and "On short prompts the minimal profile is roughly cost-neutral. Per-turn input overhead cancels output saving."
- **Dasein** (one run per arm; the sponsor sells another arm): Caveman cost −19% on 100 SWE-bench Verified tasks.
- **CAVEWOMAN** (Adobe, single-turn QA): compressing the input "raises net cost rather than lowering it (~1.15x on the five-benchmark mean …)"; compressing the output cut cost "1.4-2.4x per model".

Take: a plain "be concise" instruction (PROMPT-024) gets most of the saving; hold savings claims to paired per-task cost over several runs. These tests cover Caveman's output style, not the input compression its 3.0 release added.

## [TOK-114] Masking old tool output: measured elsewhere, not a Claude Code setting
- Type: comparison
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-16
- Sources: [JetBrains Research: efficient context management](https://blog.jetbrains.com/research/2025/12/efficient-context-management/), [Gemini CLI configuration](https://github.com/google-gemini/gemini-cli/blob/b25669d84e1a404e30c176d779e732e25dafcec0/docs/reference/configuration.md), [Codex config schema](https://github.com/openai/codex/blob/b5115cdd669d37a8635a9742851e97ba4fb1d42c/codex-rs/core/config.schema.json), [Factory: evaluating compression](https://factory.com/news/evaluating-compression)
- Related: TOK-038, TOK-031, TOK-085, TOK-042

Dropping old tool outputs while keeping recent turns is the best-measured way to trim an agent's context, and Claude Code doesn't expose it as a setting.
- **JetBrains Research** (2025-12-01; SWE-bench Verified, 500 instances; Qwen3 and Gemini 2.5 Flash, not Claude): masking, with "a window of the latest 10 turns", "outperforms LLM summarization in terms of overall efficiency and reliability", and both "consistently cut costs by over 50%".
- **Other agents**: Gemini CLI truncates tool output at `truncateToolOutputThreshold` (default `40000` characters) and has masking settings under `contextManagement` (schema category "Experimental"); Codex has `tool_output_token_limit`; OpenCode's V1 `compaction.prune` "Remove[s] old tool outputs" (default `false`).
- **Claude Code**: big Bash and tool results go to a file (TOK-042, TOK-088). Claude Code does clear old tool results itself (costs.md counts "clearing old tool results from context" as an expected cache rebuild), but no page documents its trigger or a setting. The API's context editing does it on request, at a cache-write cost each time (TOK-038).
- **What compaction loses**: in Factory's vendor-run test, "Artifact trail is the weakest dimension for all methods, ranging from 2.19 to 2.45" out of 5, so compact instructions should list the files created and changed (TOK-031).

## [TOK-115] Task budgets (API beta)
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Task budgets](https://platform.claude.com/docs/en/build-with-claude/task-budgets), [Context windows: context awareness](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- Related: TOK-038, TOK-055, TOK-072

A task budget tells the model how many tokens a whole agentic loop may spend. Beta header `task-budgets-2026-03-13`; set `output_config.task_budget` with `type: "tokens"`, `total` and an optional `remaining`.
- "The minimum accepted `task_budget.total` is **20,000 tokens**"; smaller values return a 400.
- "Task budgets are a **soft hint, not a hard cap**"; `max_tokens` is still the enforced limit.
- It counts "what Claude **sees** (thinking, tool calls and results, and text)", and "The countdown is visible only to the model."
- Caching: "If your client decrements `task_budget.remaining` on each follow-up request, the changed value invalidates any cache prefix that contains it." Set it once.
- "Task budgets are not supported on Claude Code or Cowork surfaces."
- Supported on Fable 5.1, Mythos 5.1, Opus 5.5, Opus 5, Sonnet 5.5, Haiku 5.5 and others; not on Sonnet 5, Opus 4.6, Sonnet 4.6 or Haiku 4.5.

They replace context awareness on newer models: Sonnet 5, Sonnet 4.6, Sonnet 4.5 and Haiku 4.5 get injected budget tags, while "Claude Opus 4.7 and later Opus models, Claude Sonnet 5.5, … and Claude Haiku 5.5 don't receive these injected tags".

## [TOK-116] What auto-compaction at 400K lost: measured
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-16
- Sources: our transcripts (`compact_boundary` records in `~/.claude/projects`, 2026-10-12 to 2026-10-16), [FreekMencke/claude-kb#13](https://github.com/FreekMencke/claude-kb/issues/13), [Settings: when edits take effect](https://code.claude.com/docs/en/settings#when-edits-take-effect)
- Related: TOK-031, TOK-032, TOK-030, TOK-085

At `autoCompactWindow: 400000`, compaction lost little. In 15 compactions read by hand, no session made a mistake from missing context or asked for something it had known. The only redundant re-read was one file of about 7k tokens. Mean context over the next 20 API messages fell from 344k to 87k.

Scope: 31 auto compactions in 23 sessions, from R1 (2026-10-12 12:13 UTC) to 2026-10-16, on v2.1.295 to v2.1.299 in the desktop Code tab on WSL. A script listed the re-reads, `gh` calls and questions in the 20 API messages after each summary. 15 of them, across 6 repos, were read by hand.
- **Re-reads:** 12 of 15 compactions were followed by one. Nearly all read a file right before editing it, since summaries keep no file contents.
- **Cost of one compaction:** median 369k to 18k tokens, taking 67 s (32 to 121 s). The first cache write after it is a median 37k.
- **Summaries:** Claude Code's 9 sections, whatever `# Compact instructions` asks (TOK-031). A done-when appears in 4 of 31, and bare `#N` outnumber `owner/repo#N`, but neither caused a wrong lookup.
- **A running session kept its old window.** One session started before R1 grew to 631k after the change, though the docs say Claude Code "applies most edits to the running session without a restart". The setting was written with `jq … > tmp && mv`. One session; the cause is unknown.

## Recommendations for our setup

Baseline (local measurement, 2026-10-07 to 2026-10-12, 6 days, TOK-008; first labelled "30 days", corrected 2026-10-12). Dollar and token totals below are for those 6 days, about a fifth of a month; percentages are unaffected:
- About $1,089 list-price equivalent (about $180 a day), on a subscription.
- 97% of tokens on Opus 5.5.
- Cache reads 52% of cost, cache writes 31%, output 17%.
- 54% of input tokens from turns above 200k context.
- Subagents 19% of cost.
- Tool output entering context: Bash about 6.9M tokens, about 995 screenshots, text file reads about 0.9M.

Ranked by expected savings ÷ effort. Done on 2026-10-12, now in `~/.claude` or FreekMencke/claude-skills (re-measure with R6 a month later, Open question 2):
- R1: `"autoCompactWindow": 400000` and a `# Compact instructions` section in the global CLAUDE.md (a Keep/Drop list; TOK-031, TOK-032). Measured 2026-10-16 in FreekMencke/claude-kb#13: kept at 400K, since compaction lost little (TOK-116). Turns over 400k fell from 7% to 1%.
- R2: a context status line (TOK-011, TOK-082).
- R3: the user-only `handoff` skill: write state to the issue/PR or a scratch file, then `/clear` (FreekMencke/claude-skills#13; TOK-030, TOK-085).
- R4: `CLAUDE_CODE_SUBAGENT_MODEL=sonnet`, plus the Haiku `Explore` override (ORCH recommendation 13), because the env var doesn't reach built-in Explore and Plan (ORCH-005, TOK-036).
- R6: the user-only `token-audit` skill, which runs this file's analyses over `~/.claude/projects` (FreekMencke/claude-skills#14; TOK-013, TOK-080).
- R7: output habits in the global CLAUDE.md ("Shell output") (TOK-042).
- R8: the unused claude.ai-synced skills set to `name-only` (below; 10 kept, `morning` and `import-memory` disabled on claude.ai instead).
- R5: the `browser-checker` agent keeps osrs-tracker-web's screenshots out of main sessions (osrs-tracker/osrs-tracker-web#223, kb-repo-agents T3; final count due from 2026-10-27). TOK-043, TOK-009.

Won't do (measured 2026-10-12, below):
- R13, disabling `frontend-design` and `playwright` per project: together about 1.3% of the starting context, against settings changes in every repo that uses them.
- R9, project-scoping the `kubernetes`, `flux` and `aws` MCP servers: their tools are deferred, so it saves only their share of the 2.1k server instructions plus their names. Not worth losing the always-on access the global CLAUDE.md wants.

**Measured starting context (2026-10-12).** `claude -p "/context all"` and `claude -p "/skill-doctor"` print their reports as text from the terminal; the desktop Code tab doesn't offer `/skill-doctor` (SKILL-054). In a fresh terminal session in this repo (v2.1.296, Opus 5.5, 400k window):

| Loaded every turn | Tokens |
|---|---|
| System prompt | 2.4k |
| Built-in tools | 14.4k |
| MCP tools loaded up front | 1.5k |
| MCP server instructions | 2.1k |
| Memory files (global 1.6k, project 1k) | 2.6k |
| Skill listing | 6.3k |
| Custom agents (`Explore`) | 0.1k |
| **Total** | **29.4k** |

- Deferred tools (65–70k of MCP tools, 20.8k of built-in tools) are not in that total: only their names are listed until tool search loads one (TOK-020).
- The deferred MCP tools include claude.ai connectors (MongoDB Atlas, Google Calendar, Claude Docs) that reach terminal sessions from the account. They cost names only while deferred.
- Skills: 2.8k of the 6.3k listing was the 12 claude.ai-synced skills that `/skill-doctor` showed were never invoked in the last 7 days; about 2.8k more is built-in skills. All 12 were set to `"name-only"` in `skillOverrides` in WSL `~/.claude/settings.json` (on 2026-10-14: the 10 kept, plus the `anthropic-skills:deep-research` alias; `morning` and `import-memory` are disabled on claude.ai); re-measured, the skill listing dropped from 6.3k to 3.6k. claude.ai chat and desktop Local sessions are unaffected (SKILL-058).
- The 25 Playwright tools are about 7.8k tokens, all deferred, so a turn carries only their names (roughly 300 tokens); `frontend-design` is about 80 tokens of listing.

Not recommended now:
- RTK or context-mode (TOK-083): our big outputs aren't test runs, two independent tests found no reliable saving from RTK, and context-mode is unmeasured and ELv2.
- Serena or claude-context (TOK-084): `typescript-lsp` already covers symbol lookup.
- Raising cache TTLs: rebuilds are only 8% of writes (TOK-034).

**Research tools (TOK-087 to TOK-102).** R10 to R12, done 2026-10-12: CLAUDE.md's research rules (FreekMencke/claude-kb#50), and the re-verification routine's shared search budget, curl-not-search rule and autonomy opener (FreekMencke/claude-kb#51).

Not now: adding the Claude docs MCP servers user-wide (TOK-096). They'd cost only names while deferred, but `llms.txt` plus a curled `.md` page already finds and reads a page for fewer tokens. Revisit if lookups keep missing the right page. The AWS docs tools already come with the `aws` server (TOK-097).

**Subagent handoff and script output (TOK-103 to TOK-115, 2026-10-16).** Ranked by impact against effort:
- R14, done 2026-10-16: osrs-tracker-api's `verify.sh` keeps failed check logs and prints their path and tail, like web and aws (osrs-tracker/osrs-tracker-api#183). TOK-108, TOK-109.
- R15: leave this repo's research readers returning inline (the `research` skill's brief). Subagents can't write `report.md` or `findings*.md` files, and a report over 50K characters already arrived as a file plus a 2 KB preview in an interactive session, so ask for a 10-line summary first and one `##` section per question (TOK-105, TOK-106, TOK-107). No change needed: the brief already asks for per-question sections.
- R16, done 2026-10-18: compared in FreekMencke/claude-kb#49. The Concise style cut visible text by a third but saved under 1% of cost, as TOK-113 predicts; kept for readability (PROMPT-039).
- Not now: turning off prompt suggestions or `!` replies (TOK-112). Both are small, cache-read requests or ones we ask for.

## Open questions

1. **Real system prompt and tool sizes.** Answered 2026-10-12: `claude -p "/context all"` in a fresh terminal session in this repo measured a 29.4k starting prefix, close to the 24–27k inferred from `usage`. See "Measured starting context" above.
2. **Compaction quality versus window size.** Answered 2026-10-16 for 400K in [FreekMencke/claude-kb#13](https://github.com/FreekMencke/claude-kb/issues/13): no mistakes from lost context in 15 compactions, and mean context over the next 20 messages fell from 344k to 87k (TOK-116). Still open: whether 300K saves more without more loss. R1's saving in dollars couldn't be separated from R4 and R5, which landed the same week.
3. **How plan usage is weighted.** Are cache reads weighted like API prices (0.05x on Opus 5.5) when counting against 5-hour and weekly limits? Not documented. Our dollar figures are list-price equivalents, not plan percentages.
4. **MCP description cap.** Answered 2026-10-12: tested, 4,096 characters up front and at least 10,000 (the changelog's 16,384) via tool search. The docs now state 4,096 and 16,384 (2,048 before v2.1.296), and since v2.1.299 Anthropic's first-party servers at `api.anthropic.com` aren't cut (TOK-020).
5. **Subagent nesting.** The sub-agents page allows depth 3; the context-window page says the Agent tool is withheld from subagents by default. ORCH-006 sides with depth 3 (sub-agents and env-vars pages, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`); see INDEX.md, Conflicts.
6. **Skill descriptions and triggering.** No Anthropic benchmark relates description length to trigger rate. The evidence is skill-creator's "pushy" advice, superpowers' anecdotes and Vercel's eval.
7. **Unverified plan changes.** The May 2026 limit doubling and peak-hour changes, and whether per-model weekly meters other than Fable still exist on some plans, are reported only by secondary sources.
8. **Token savers.** RTK now has independent paired measurements (TOK-083, 2026-10-16); context-mode, Serena and claude-context still have none, and Caveman's results disagree between JetBrains and Dasein (TOK-113).
9. **Compact instructions.** Answered 2026-10-12: tested, just context it sees; the same text worked or failed alike under `# Compact instructions` and `# Notes` (TOK-031). One Haiku run per cell; a larger model may read the heading as scoping.
10. **Resume cache bug.** Answered 2026-10-12: tested, not reliably present in v2.1.296; two of three `-p --resume` runs hit the full cache, including after a `git status` change, and one rewrote 11k tokens (TOK-034).
11. **WebSearch `extended`.** What it does differently, what "several times the cost" means on a subscription, and whether one extended call counts as one against the 200-call budget. Only the tool schema mentions the modes (TOK-093). One test is not a latency or freshness measurement.
12. **Metering of web tools on a subscription.** How WebSearch calls and WebFetch's extraction-model calls count against plan usage, and which model does the extraction today (TOK-087, TOK-094).
13. **When WebFetch skips summarization.** The preapproved domain list isn't published; our tests fit "preapproved and under 100,000 characters", but the rule isn't documented (TOK-088). The size at which a WebFetch result goes to a file instead of inline (seen at 56.6 KB) isn't documented either.
14. **Accuracy of docs tools.** No independent benchmark compares context7, docs MCP servers, `llms.txt` and web search on answer accuracy; Upstash's benchmark covers tokens only (TOK-095).
15. **Search budget outside the terminal.** The docs give the 200-call limit for "an interactive terminal session"; whether cloud sessions, routines and the desktop app apply the same limit is untested (TOK-092).
16. **The report-file refusal.** "Subagents should return findings as text, not write report files" keys on file names in both interactive sessions and `claude -p` (TOK-107), but the full name list and the version that added it are in neither the docs nor the CHANGELOG.
17. **When an Agent result spills to a file.** 40,225 characters arrived whole in `claude -p`; 50,709 bytes spilled in an interactive auto-mode session. The docs give no rule, and the inline cost inside an interactive session wasn't measured (TOK-105).
18. **Does a running session pick up a new `autoCompactWindow`?** The settings docs say most edits apply without a restart, and they don't list this key among those read at start. One session started before R1 still grew to 631k (TOK-116). Untested: a fresh session edited mid-way, and an in-place edit instead of `mv`.
19. **Background subagents in `-p`.** The docs say fork mode is off in `-p`, yet v2.1.296 backgrounded the Agent call there (TOK-105).
20. **Undocumented meters.** The wording and thresholds of the `/usage` warnings (2.1.299), and the OTel `cache_creation_5m_tokens` and `cache_creation_1h_tokens` attributes (2.1.300), are only in the CHANGELOG (TOK-010, TOK-012).
21. **Other agents' defaults.** Whether Gemini CLI masks tool output by default, Codex's `model_auto_compact_token_limit` default, and whether OpenCode users run V1 (`prune`) or V2 compaction (TOK-085, TOK-114).
22. **Env prefixes and allow rules.** Whether `PAGER=cat`, `GIT_PAGER=cat` or `CI=1` stop a `Bash(...)` allow rule from matching. The docs' wording says they would; untested (TOK-110).
